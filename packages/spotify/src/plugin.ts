import type { SpotifyConfig } from "@soundtouch/core";
import type { ServiceModule, ServiceContext } from "@soundtouch/core";
import { SpotifyAuth } from "./auth.js";
import { SpotifyClient } from "./client.js";

export interface SpotifyPluginDeps {
  spotifyConfig: SpotifyConfig;
  getToken: () =>
    | {
        access_token: string;
        refresh_token: string | null;
        expires_at: number | null;
      }
    | undefined;
  saveToken: (
    accessToken: string,
    refreshToken?: string | null,
    expiresAt?: number | null,
    scope?: string | null,
  ) => void;
}

export function createSpotifyModule(deps: SpotifyPluginDeps): ServiceModule & {
  getAuth: () => SpotifyAuth;
  getClient: () => Promise<SpotifyClient>;
} {
  const auth = new SpotifyAuth(deps.spotifyConfig);
  let client: SpotifyClient | null = null;

  async function getClient(): Promise<SpotifyClient> {
    const token = deps.getToken();
    if (!token) throw new Error("Not authenticated with Spotify");

    if (!client) {
      client = new SpotifyClient(token.access_token);
    }

    if (token.expires_at && Date.now() > token.expires_at - 60_000) {
      if (token.refresh_token) {
        const refreshed = await auth.refreshTokens(token.refresh_token);
        deps.saveToken(
          refreshed.accessToken,
          refreshed.refreshToken,
          refreshed.expiresAt,
          refreshed.scope,
        );
        client.setAccessToken(refreshed.accessToken);
      }
    }

    return client;
  }

  return {
    name: "spotify",
    version: "0.1.0",

    async register(ctx: ServiceContext) {
      ctx.logger.info("Spotify module registered");
    },

    isConfigured(): boolean {
      return !!(
        deps.spotifyConfig.clientId && deps.spotifyConfig.clientSecret
      );
    },

    getAuth: () => auth,
    getClient,
  };
}
