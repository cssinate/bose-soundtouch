import type { MusicServiceBrowserAPI, MusicServicePlugin } from "@soundtouch/core";

/**
 * Browser-side API functions for Spotify
 * These make HTTP requests to the server's Spotify endpoints
 * Implements the standard MusicServiceBrowserAPI interface
 */

const BASE = "";

// Cache the Spotify username
let cachedSpotifyUsername: string | null = null;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function getSpotifyUsername(): Promise<string> {
  if (cachedSpotifyUsername) {
    return cachedSpotifyUsername;
  }
  
  try {
    const me = await request<any>("/api/spotify/me");
    cachedSpotifyUsername = me.id || me.display_name || "";
    return cachedSpotifyUsername;
  } catch (error) {
    console.error("Failed to get Spotify username:", error);
    return "";
  }
}

function spotifyUriToContentItem(uri: string, metadata?: Record<string, any>, sourceAccount?: string) {
  return {
    source: "SPOTIFY",
    type: "uri",
    location: uri,
    sourceAccount: sourceAccount || "",
    itemName: metadata?.name || uri,
    containerArt: metadata?.imageUrl,
  };
}

// Standard MusicServiceBrowserAPI implementation
export async function getStatus(): Promise<{ authenticated: boolean; expiresAt: number | null }> {
  return request("/api/spotify/status");
}

export async function getMe(): Promise<any> {
  return request("/api/spotify/me");
}

export async function search(query: string): Promise<any> {
  return request(`/api/spotify/search?q=${encodeURIComponent(query)}`);
}

export async function getPlaylists(): Promise<any> {
  return request("/api/spotify/playlists");
}

export async function getPlaylistTracks(playlistId: string): Promise<any> {
  return request(`/api/spotify/playlists/${playlistId}/tracks`);
}

export async function playUri(speakerId: string, uri: string, metadata?: Record<string, any>): Promise<void> {
  const username = await getSpotifyUsername();
  const contentItem = spotifyUriToContentItem(uri, metadata, username);
  await request(`/api/speakers/${speakerId}/play`, {
    method: "POST",
    body: JSON.stringify({ contentItem }),
  });
}

export async function playTrack(speakerId: string, uri: string, metadata?: Record<string, any>): Promise<void> {
  const username = await getSpotifyUsername();
  const contentItem = spotifyUriToContentItem(uri, metadata, username);
  await request(`/api/speakers/${speakerId}/play`, {
    method: "POST",
    body: JSON.stringify({ contentItem }),
  });
}

/**
 * Spotify implementation of MusicServiceBrowserAPI
 * Can be used by generic music service UI components
 */
export const api: MusicServiceBrowserAPI = {
  getStatus,
  getMe,
  search,
  getPlaylists,
  getPlaylistTracks,
  playUri,
  playTrack,
};

/**
 * Complete Spotify plugin for UI integration
 */
export const spotify: MusicServicePlugin = {
  metadata: {
    id: "spotify",
    name: "Spotify",
    authUrl: "/auth/spotify",
  },
  api,
};