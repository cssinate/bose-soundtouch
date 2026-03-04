import type { z } from "zod";
import type { Logger } from "./logger.js";

export interface TokenRecord {
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
}

export interface TokenStore {
  get(service: string): TokenRecord | undefined;
  upsert(
    service: string,
    accessToken: string,
    refreshToken?: string | null,
    expiresAt?: number | null,
    scope?: string | null,
  ): void;
}

export interface PluginContext {
  logger: Logger;
  tokenStore: TokenStore;
}

export interface ServerPlugin {
  name: string;
  configSchema: z.ZodTypeAny;
  createRoutes(
    app: unknown,
    context: PluginContext,
    config: unknown,
  ): Promise<void>;
}

export interface SpeakerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  model?: string;
}

/**
 * Metadata for music service plugins
 * Allows UI to discover and display available services
 */
export interface MusicServiceMetadata {
  /** Service identifier (e.g., "spotify", "deezer") */
  id: string;
  /** Display name (e.g., "Spotify", "Deezer") */
  name: string;
  /** OAuth authorization URL (relative to server root) */
  authUrl: string;
}

/**
 * Standard shape for music service browser API functions
 * All music service plugins should implement these functions
 */
export interface MusicServiceBrowserAPI {
  /**
   * Check authentication status
   * @returns Object with authenticated flag and optional expiration timestamp
   */
  getStatus(): Promise<{ authenticated: boolean; expiresAt: number | null }>;

  /**
   * Get current user info
   * @returns User profile data (implementation-specific)
   */
  getMe(): Promise<unknown>;

  /**
   * Search for content (tracks, albums, playlists, artists)
   * @param query - Search query string
   * @returns Search results (implementation-specific)
   */
  search(query: string): Promise<unknown>;

  /**
   * Get user's playlists/collections
   * @returns Array of playlists (implementation-specific)
   */
  getPlaylists(): Promise<unknown[]>;

  /**
   * Get tracks from a specific playlist
   * @param playlistId - Playlist identifier
   * @returns Array of tracks (implementation-specific)
   */
  getPlaylistTracks(playlistId: string): Promise<unknown[]>;

  /**
   * Play a context (playlist, album, artist)
   * @param speakerId - Soundtouch speaker ID
   * @param uri - Service-specific URI for the content
   * @param metadata - Optional metadata (name, image, etc.)
   */
  playUri(speakerId: string, uri: string, metadata?: Record<string, any>): Promise<void>;

  /**
   * Play a single track
   * @param speakerId - Soundtouch speaker ID
   * @param uri - Service-specific URI for the track
   * @param metadata - Optional metadata (name, image, etc.)
   */
  playTrack(speakerId: string, uri: string, metadata?: Record<string, any>): Promise<void>;
}

/**
 * Complete music service plugin export
 * Plugins should export this to enable full UI integration
 */
export interface MusicServicePlugin {
  /** Plugin metadata */
  metadata: MusicServiceMetadata;
  /** Browser API implementation */
  api: MusicServiceBrowserAPI;
}
