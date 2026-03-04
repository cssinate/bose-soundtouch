export interface SpeakerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  model?: string;
}

export interface NowPlaying {
  source: string;
  track?: string;
  artist?: string;
  album?: string;
  stationName?: string;
  art?: string;
  playStatus?: string;
  skipEnabled?: boolean;
  skipPreviousEnabled?: boolean;
}

export interface Volume {
  targetvolume: number;
  actualvolume: number;
  muteenabled: boolean;
}

export interface Preset {
  id: string;
  contentItem?: {
    source: string;
    itemName?: string;
  };
}

export interface SpeakerState {
  nowPlaying: NowPlaying | null;
  volume: Volume | null;
}

export interface ServiceStatus {
  services: Record<string, boolean>;
}
