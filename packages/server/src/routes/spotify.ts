import type { FastifyInstance } from "fastify";
import type { Config, Logger } from "@soundtouch/core";
import type Database from "better-sqlite3";
import { getToken, upsertToken } from "../db.js";

export async function spotifyRoutes(
  app: FastifyInstance,
  opts: { config: Config; db: Database.Database; logger: Logger },
): Promise<void> {
  const { config, db, logger } = opts;

  if (!config.spotify) {
    logger.debug("Spotify not configured — skipping routes");
    return;
  }

  let SpotifyAuth: typeof import("@soundtouch/spotify").SpotifyAuth;
  let SpotifyClient: typeof import("@soundtouch/spotify").SpotifyClient;

  try {
    const spotify = await import("@soundtouch/spotify");
    SpotifyAuth = spotify.SpotifyAuth;
    SpotifyClient = spotify.SpotifyClient;
  } catch {
    logger.info(
      "@soundtouch/spotify not installed — Spotify features disabled",
    );
    return;
  }

  const auth = new SpotifyAuth(config.spotify);

  app.get("/auth/spotify", async (_request, reply) => {
    const state = crypto.randomUUID();
    const url = auth.getAuthorizeUrl(state);
    return reply.redirect(url);
  });

  app.get<{ Querystring: { code?: string; error?: string } }>(
    "/auth/spotify/callback",
    async (request, reply) => {
      if (request.query.error) {
        return reply
          .code(400)
          .send({ error: `Spotify auth error: ${request.query.error}` });
      }

      if (!request.query.code) {
        return reply.code(400).send({ error: "Missing authorization code" });
      }

      try {
        const tokens = await auth.exchangeCode(request.query.code);
        upsertToken(
          db,
          "spotify",
          tokens.accessToken,
          tokens.refreshToken,
          tokens.expiresAt,
          tokens.scope,
        );
        logger.info("Spotify authenticated successfully");
        return reply.redirect("/");
      } catch (err) {
        logger.error("Spotify token exchange failed", err);
        return reply.code(500).send({ error: "Authentication failed" });
      }
    },
  );

  app.get("/api/spotify/status", async () => {
    const token = getToken(db, "spotify");
    return {
      authenticated: !!token,
      expiresAt: token?.expires_at ?? null,
    };
  });

  app.get("/api/spotify/me", async (_request, reply) => {
    const client = await getClient(reply);
    if (!client) return;
    return client.getMe();
  });

  app.get<{ Querystring: { q: string } }>(
    "/api/spotify/search",
    async (request, reply) => {
      const client = await getClient(reply);
      if (!client) return;
      return client.search(request.query.q);
    },
  );

  app.get("/api/spotify/playlists", async (_request, reply) => {
    const client = await getClient(reply);
    if (!client) return;
    return client.getPlaylists();
  });

  app.get<{ Params: { id: string } }>(
    "/api/spotify/playlists/:id/tracks",
    async (request, reply) => {
      const client = await getClient(reply);
      if (!client) return;
      return client.getPlaylistTracks(request.params.id);
    },
  );

  app.get("/api/spotify/devices", async (_request, reply) => {
    const client = await getClient(reply);
    if (!client) return;
    return client.getDevices();
  });

  app.get("/api/spotify/player", async (_request, reply) => {
    const client = await getClient(reply);
    if (!client) return;
    return client.getPlaybackState();
  });

  app.post<{ Body: { deviceId: string; play?: boolean } }>(
    "/api/spotify/player/transfer",
    async (request, reply) => {
      const client = await getClient(reply);
      if (!client) return;
      await client.transferPlayback(
        request.body.deviceId,
        request.body.play ?? true,
      );
      return { ok: true };
    },
  );

  app.post<{
    Body: { deviceId?: string; contextUri?: string; uris?: string[] };
  }>("/api/spotify/player/play", async (request, reply) => {
    const client = await getClient(reply);
    if (!client) return;
    await client.play(request.body);
    return { ok: true };
  });

  app.put("/api/spotify/player/pause", async (_request, reply) => {
    const client = await getClient(reply);
    if (!client) return;
    await client.pause();
    return { ok: true };
  });

  async function getClient(
    reply: FastifyInstance["_Reply"],
  ): Promise<InstanceType<typeof SpotifyClient> | null> {
    const token = getToken(db, "spotify");
    if (!token) {
      reply.code(401).send({ error: "Not authenticated with Spotify" });
      return null;
    }

    if (token.expires_at && Date.now() > token.expires_at * 1000 - 60_000) {
      if (token.refresh_token) {
        try {
          const refreshed = await auth.refreshTokens(token.refresh_token);
          upsertToken(
            db,
            "spotify",
            refreshed.accessToken,
            refreshed.refreshToken,
            refreshed.expiresAt,
            refreshed.scope,
          );
          return new SpotifyClient(refreshed.accessToken);
        } catch {
          reply.code(401).send({ error: "Token refresh failed" });
          return null;
        }
      }
      reply.code(401).send({ error: "Token expired" });
      return null;
    }

    return new SpotifyClient(token.access_token);
  }
}
