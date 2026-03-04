import type { SpotifyConfig } from "./config.js";
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

export function createSpotifyModule(deps: SpotifyPluginDeps) {
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
    name: "spotify" as const,
    getAuth: () => auth,
    getClient,
    isConfigured: () =>
      !!(deps.spotifyConfig.clientId && deps.spotifyConfig.clientSecret),
  };
}
