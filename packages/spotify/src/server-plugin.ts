import type { ServerPlugin, PluginContext } from "@soundtouch/core";
import { spotifyConfigSchema, type SpotifyConfig } from "./config.js";
import { SpotifyAuth } from "./auth.js";
import { SpotifyClient } from "./client.js";

export const plugin: ServerPlugin = {
  name: "spotify",
  configSchema: spotifyConfigSchema,

  async createRoutes(app: any, context: PluginContext, config: SpotifyConfig) {
    const { logger, tokenStore } = context;
    const auth = new SpotifyAuth(config);

    app.get("/auth/spotify", async (_request: any, reply: any) => {
      const state = crypto.randomUUID();
      const url = auth.getAuthorizeUrl(state);
      return reply.redirect(url);
    });

    app.get(
      "/auth/spotify/callback",
      async (request: any, reply: any) => {
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
          tokenStore.upsert(
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
      const token = tokenStore.get("spotify");
      return {
        authenticated: !!token,
        expiresAt: token?.expires_at ?? null,
      };
    });

    app.get("/api/spotify/me", async (_request: any, reply: any) => {
      const client = await getClient(reply);
      if (!client) return;
      return client.getMe();
    });

    app.get(
      "/api/spotify/search",
      async (request: any, reply: any) => {
        const client = await getClient(reply);
        if (!client) return;
        return client.search(request.query.q);
      },
    );

    app.get("/api/spotify/playlists", async (_request: any, reply: any) => {
      const client = await getClient(reply);
      if (!client) return;
      return client.getPlaylists();
    });

    app.get(
      "/api/spotify/playlists/:id/tracks",
      async (request: any, reply: any) => {
        const client = await getClient(reply);
        if (!client) return;
        return client.getPlaylistTracks(request.params.id);
      },
    );

    app.get("/api/spotify/devices", async (_request: any, reply: any) => {
      const client = await getClient(reply);
      if (!client) return;
      return client.getDevices();
    });

    app.get("/api/spotify/player", async (_request: any, reply: any) => {
      const client = await getClient(reply);
      if (!client) return;
      return client.getPlaybackState();
    });

    app.post(
      "/api/spotify/player/transfer",
      async (request: any, reply: any) => {
        const client = await getClient(reply);
        if (!client) return;
        await client.transferPlayback(
          request.body.deviceId,
          request.body.play ?? true,
        );
        return { ok: true };
      },
    );

    app.post("/api/spotify/player/play", async (request: any, reply: any) => {
      const client = await getClient(reply);
      if (!client) return;
      await client.play(request.body);
      return { ok: true };
    });

    app.put("/api/spotify/player/pause", async (_request: any, reply: any) => {
      const client = await getClient(reply);
      if (!client) return;
      await client.pause();
      return { ok: true };
    });

    async function getClient(reply: any): Promise<SpotifyClient | null> {
      const token = tokenStore.get("spotify");
      if (!token) {
        reply.code(401).send({ error: "Not authenticated with Spotify" });
        return null;
      }

      if (token.expires_at && Date.now() > token.expires_at * 1000 - 60_000) {
        if (token.refresh_token) {
          try {
            const refreshed = await auth.refreshTokens(token.refresh_token);
            tokenStore.upsert(
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
  },
};
