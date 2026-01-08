/**
 * Type definitions for Bose SoundTouch API responses
 */

export enum PlayStatus {
  PLAY_STATE = "PLAY_STATE",
  PAUSE_STATE = "PAUSE_STATE",
  STOP_STATE = "STOP_STATE",
  BUFFERING_STATE = "BUFFERING_STATE",
}

export enum KeyValue {
  POWER = "POWER",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  PREV_TRACK = "PREV_TRACK",
  NEXT_TRACK = "NEXT_TRACK",
  THUMBS_UP = "THUMBS_UP",
  THUMBS_DOWN = "THUMBS_DOWN",
  BOOKMARK = "BOOKMARK",
  PRESET_1 = "PRESET_1",
  PRESET_2 = "PRESET_2",
  PRESET_3 = "PRESET_3",
  PRESET_4 = "PRESET_4",
  PRESET_5 = "PRESET_5",
  PRESET_6 = "PRESET_6",
  AUX_INPUT = "AUX_INPUT",
  SHUFFLE_OFF = "SHUFFLE_OFF",
  SHUFFLE_ON = "SHUFFLE_ON",
  REPEAT_OFF = "REPEAT_OFF",
  REPEAT_ONE = "REPEAT_ONE",
  REPEAT_ALL = "REPEAT_ALL",
  ADD_FAVORITE = "ADD_FAVORITE",
  REMOVE_FAVORITE = "REMOVE_FAVORITE",
  INVALID_KEY = "INVALID_KEY",
}

export interface NetworkInfo {
  type: string;
  macAddress: string;
  ipAddress: string;
}

export interface DeviceInfo {
  deviceID: string;
  name: string;
  type: string;
  networkInfo: NetworkInfo[];
}

export interface Capability {
  name: string;
  value: string;
}

export interface Capabilities {
  capabilities: Capability[];
}

export interface ContentItem {
  source: string;
  sourceAccount?: string;
  location?: string;
  isPresetable?: boolean;
  itemName?: string;
  containerArt?: string;
  type?: string;
}

export interface Preset {
  id: string;
  contentItem?: ContentItem;
}

export interface Presets {
  preset: Preset[];
}

export interface Source {
  source: string;
  sourceAccount?: string;
  status: string;
  isLocal?: boolean;
  multiroomallowed?: boolean;
}

export interface Sources {
  sourceItem: Source[];
}

export interface Volume {
  targetvolume: number;
  actualvolume: number;
  muteenabled: boolean;
}

export interface NowPlaying {
  source: string;
  ContentItem?: ContentItem;
  track?: string;
  artist?: string;
  album?: string;
  stationName?: string;
  art?: string;
  artImageStatus?: string;
  playStatus?: PlayStatus;
  skipEnabled?: boolean;
  skipPreviousEnabled?: boolean;
  favoriteEnabled?: boolean;
  isFavorite?: boolean;
  stationLocation?: string;
  time?: number;
  totalTime?: number;
}

export interface Bass {
  targetbass: number;
  actualbass: number;
  available?: boolean;
}

export interface Tone {
  targettreble: number;
  actualtreble: number;
  targetbass: number;
  actualbass: number;
  available?: boolean;
}
