import type {
  SpeakerInfo,
  NowPlaying,
  Volume,
  Preset,
  ServiceStatus,
} from "./types.js";

const BASE = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function getSpeakers(): Promise<SpeakerInfo[]> {
  return request("/api/speakers");
}

export async function getNowPlaying(speakerId: string): Promise<NowPlaying> {
  return request(`/api/speakers/${speakerId}/now-playing`);
}

export async function getVolume(speakerId: string): Promise<Volume> {
  return request(`/api/speakers/${speakerId}/volume`);
}

export async function setVolume(
  speakerId: string,
  level: number,
): Promise<void> {
  await request(`/api/speakers/${speakerId}/volume`, {
    method: "POST",
    body: JSON.stringify({ level }),
  });
}

export async function sendPlaybackAction(
  speakerId: string,
  action: string,
): Promise<void> {
  await request(`/api/speakers/${speakerId}/playback`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function getPresets(speakerId: string): Promise<{ preset: Preset[] }> {
  return request(`/api/speakers/${speakerId}/presets`);
}

export async function selectPreset(
  speakerId: string,
  presetId: number,
): Promise<void> {
  await request(`/api/speakers/${speakerId}/presets/select`, {
    method: "POST",
    body: JSON.stringify({ presetId }),
  });
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  return request("/api/config/services");
}
