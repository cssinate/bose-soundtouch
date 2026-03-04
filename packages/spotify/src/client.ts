import type {
  SpotifyUser,
  SpotifyTrack,
  SpotifyPlaylist,
  SpotifyAlbum,
  SpotifyDevice,
  SpotifySearchResults,
  SpotifyPlaybackState,
} from "./types.js";

const API_BASE = "https://api.spotify.com/v1";

export class SpotifyClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Spotify API error ${res.status}: ${err}`);
    }

    return (await res.json()) as T;
  }

  async getMe(): Promise<SpotifyUser> {
    const data = await this.request<{
      id: string;
      display_name: string;
      email?: string;
      images?: { url: string }[];
    }>("/me");

    return {
      id: data.id,
      displayName: data.display_name,
      email: data.email,
      imageUrl: data.images?.[0]?.url,
    };
  }

  async search(
    query: string,
    types: ("track" | "album" | "playlist")[] = ["track", "album", "playlist"],
    limit = 20,
  ): Promise<SpotifySearchResults> {
    const params = new URLSearchParams({
      q: query,
      type: types.join(","),
      limit: String(limit),
    });

    const data = await this.request<{
      tracks?: { items: RawTrack[] };
      albums?: { items: RawAlbum[] };
      playlists?: { items: RawPlaylist[] };
    }>(`/search?${params}`);

    return {
      tracks: (data.tracks?.items ?? []).map(mapTrack),
      albums: (data.albums?.items ?? []).map(mapAlbum),
      playlists: (data.playlists?.items ?? []).map(mapPlaylist),
    };
  }

  async getPlaylists(limit = 50): Promise<SpotifyPlaylist[]> {
    const data = await this.request<{ items: RawPlaylist[] }>(
      `/me/playlists?limit=${limit}`,
    );
    return data.items.map(mapPlaylist);
  }

  async getPlaylistTracks(
    playlistId: string,
    limit = 100,
  ): Promise<SpotifyTrack[]> {
    const data = await this.request<{
      items: { track: RawTrack }[];
    }>(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return data.items.map((i) => mapTrack(i.track));
  }

  async getDevices(): Promise<SpotifyDevice[]> {
    const data = await this.request<{ devices: RawDevice[] }>(
      "/me/player/devices",
    );
    return data.devices.map(mapDevice);
  }

  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    const data = await this.request<RawPlaybackState | undefined>(
      "/me/player",
    );

    if (!data) return null;

    return {
      isPlaying: data.is_playing,
      track: data.item ? mapTrack(data.item) : null,
      device: data.device ? mapDevice(data.device) : null,
      progressMs: data.progress_ms ?? 0,
    };
  }

  async transferPlayback(deviceId: string, play = true): Promise<void> {
    await this.request("/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [deviceId], play }),
    });
  }

  async play(options?: {
    deviceId?: string;
    contextUri?: string;
    uris?: string[];
  }): Promise<void> {
    const params = options?.deviceId
      ? `?device_id=${options.deviceId}`
      : "";

    const body: Record<string, unknown> = {};
    if (options?.contextUri) body.context_uri = options.contextUri;
    if (options?.uris) body.uris = options.uris;

    await this.request(`/me/player/play${params}`, {
      method: "PUT",
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  }

  async pause(deviceId?: string): Promise<void> {
    const params = deviceId ? `?device_id=${deviceId}` : "";
    await this.request(`/me/player/pause${params}`, { method: "PUT" });
  }

  async next(deviceId?: string): Promise<void> {
    const params = deviceId ? `?device_id=${deviceId}` : "";
    await this.request(`/me/player/next${params}`, { method: "POST" });
  }

  async previous(deviceId?: string): Promise<void> {
    const params = deviceId ? `?device_id=${deviceId}` : "";
    await this.request(`/me/player/previous${params}`, { method: "POST" });
  }

  async setVolume(percent: number, deviceId?: string): Promise<void> {
    const params = new URLSearchParams({
      volume_percent: String(Math.round(percent)),
    });
    if (deviceId) params.set("device_id", deviceId);
    await this.request(`/me/player/volume?${params}`, { method: "PUT" });
  }
}

// --- Raw Spotify API types (snake_case) ---

interface RawTrack {
  id: string;
  name: string;
  uri: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
  duration_ms: number;
}

interface RawAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  images?: { url: string }[];
  uri: string;
}

interface RawPlaylist {
  id: string;
  name: string;
  description?: string;
  images?: { url: string }[];
  tracks: { total: number };
  uri: string;
}

interface RawDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number | null;
}

interface RawPlaybackState {
  is_playing: boolean;
  item?: RawTrack;
  device?: RawDevice;
  progress_ms?: number;
}

function mapTrack(raw: RawTrack): SpotifyTrack {
  return {
    id: raw.id,
    name: raw.name,
    uri: raw.uri,
    artists: raw.artists.map((a) => ({ id: a.id, name: a.name })),
    album: {
      id: raw.album.id,
      name: raw.album.name,
      imageUrl: raw.album.images?.[0]?.url,
    },
    durationMs: raw.duration_ms,
  };
}

function mapAlbum(raw: RawAlbum): SpotifyAlbum {
  return {
    id: raw.id,
    name: raw.name,
    artists: raw.artists.map((a) => ({ id: a.id, name: a.name })),
    imageUrl: raw.images?.[0]?.url,
    uri: raw.uri,
  };
}

function mapPlaylist(raw: RawPlaylist): SpotifyPlaylist {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    imageUrl: raw.images?.[0]?.url,
    trackCount: raw.tracks.total,
    uri: raw.uri,
  };
}

function mapDevice(raw: RawDevice): SpotifyDevice {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    isActive: raw.is_active,
    volumePercent: raw.volume_percent,
  };
}
