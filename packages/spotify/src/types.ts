export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  displayName: string;
  email?: string;
  imageUrl?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  durationMs: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  trackCount: number;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  imageUrl?: string;
  uri: string;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number | null;
}

export interface SpotifySearchResults {
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  playlists: SpotifyPlaylist[];
}

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  track: SpotifyTrack | null;
  device: SpotifyDevice | null;
  progressMs: number;
}
