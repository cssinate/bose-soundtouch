import { XMLParser } from "fast-xml-parser";
import {
  DeviceInfo,
  Capabilities,
  Presets,
  Sources,
  Volume,
  NowPlaying,
  Bass,
  Tone,
  PlayStatus,
  KeyValue,
} from "./types.js";
import { ConnectionError, TimeoutError, ApiError } from "./errors.js";

const ARRAY_FIELDS = new Set([
  "networkInfo",
  "capability",
  "sourceItem",
  "preset",
]);

export class SoundTouch {
  private baseUrl: string;
  private timeoutMs: number;
  private parser: XMLParser;

  constructor(
    private host: string,
    private port: number = 8090,
    timeout: number = 10.0,
  ) {
    this.baseUrl = `http://${host}:${port}`;
    this.timeoutMs = timeout * 1000;
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      isArray: (_name, jpath) => {
        const tag = jpath.split(".").pop() || "";
        return ARRAY_FIELDS.has(tag);
      },
      trimValues: true,
    });
  }

  private handleError(error: unknown): never {
    if (
      error instanceof ApiError ||
      error instanceof ConnectionError ||
      error instanceof TimeoutError
    ) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ConnectionError(
        `Could not connect to speaker at ${this.baseUrl}`,
        { cause: error },
      );
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TimeoutError(`Request to ${this.baseUrl} timed out`);
    }

    throw error;
  }

  private async get<T>(endpoint: string): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      let response: Response;
      try {
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          signal: controller.signal,
          headers: { "Content-Type": "application/xml" },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const text = await response.text();

      if (!response.ok) {
        const parsed = this.parser.parse(text);
        if (parsed?.errors?.error) {
          const err = parsed.errors.error;
          throw new ApiError(err.name, Number(err.code), err.message);
        }
        throw new ConnectionError(
          `Request failed with status ${response.status}`,
        );
      }

      return this.parser.parse(text) as T;
    } catch (error) {
      this.handleError(error);
    }
  }

  private async post(endpoint: string, body?: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/xml" },
          body,
        });

        if (!response.ok) {
          const text = await response.text();
          const parsed = this.parser.parse(text);
          if (parsed?.errors?.error) {
            const err = parsed.errors.error;
            throw new ApiError(err.name, Number(err.code), err.message);
          }
          throw new ConnectionError(
            `Request failed with status ${response.status}`,
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async getInfo(): Promise<DeviceInfo> {
    const data = await this.get<{ info: DeviceInfo }>("/info");
    return data.info;
  }

  async getCapabilities(): Promise<Capabilities> {
    const data = await this.get<{ capabilities: Capabilities }>("/capabilities");
    return data.capabilities;
  }

  async setName(name: string): Promise<void> {
    const xml = `<name>${this.escapeXml(name)}</name>`;
    await this.post("/name", xml);
  }

  async getNowPlaying(): Promise<NowPlaying> {
    const data = await this.get<{ nowPlaying: NowPlaying }>("/now_playing");
    const nowPlaying = data.nowPlaying;

    if (!nowPlaying.art && nowPlaying.ContentItem?.containerArt) {
      nowPlaying.art = nowPlaying.ContentItem.containerArt;
    }

    return nowPlaying;
  }

  async getSources(): Promise<Sources> {
    const data = await this.get<{ sources: Sources }>("/sources");
    return data.sources;
  }

  async selectSource(source: string, sourceAccount?: string): Promise<void> {
    let xml = `<ContentItem source="${this.escapeXml(source)}"`;
    if (sourceAccount) {
      xml += ` sourceAccount="${this.escapeXml(sourceAccount)}"`;
    }
    xml += ` location=""></ContentItem>`;
    await this.post("/select", xml);
  }

  async getVolume(): Promise<Volume> {
    const data = await this.get<{ volume: Volume }>("/volume");
    return data.volume;
  }

  async setVolume(level: number): Promise<void> {
    if (level < 0 || level > 100) {
      throw new Error("Volume level must be between 0 and 100");
    }
    const xml = `<volume>${level}</volume>`;
    await this.post("/volume", xml);
  }

  async mute(): Promise<void> {
    await this.post("/volume", "<volume>mute</volume>");
  }

  async unmute(): Promise<void> {
    await this.post("/volume", "<volume>unmute</volume>");
  }

  async volumeUp(): Promise<void> {
    await this.post("/volume", "<volume>volumeUp</volume>");
  }

  async volumeDown(): Promise<void> {
    await this.post("/volume", "<volume>volumeDown</volume>");
  }

  async getPresets(): Promise<Presets> {
    const data = await this.get<{ presets: Presets }>("/presets");
    return data.presets;
  }

  async selectPreset(presetId: number): Promise<void> {
    if (presetId < 1 || presetId > 6) {
      throw new Error("Preset ID must be between 1 and 6");
    }
    const key = `PRESET_${presetId}` as KeyValue;
    await this.sendKey(key);
  }

  async play(): Promise<void> {
    await this.sendKey(KeyValue.PLAY);
  }

  async pause(): Promise<void> {
    await this.sendKey(KeyValue.PAUSE);
  }

  async playPause(): Promise<void> {
    const nowPlaying = await this.getNowPlaying();
    if (nowPlaying.playStatus === PlayStatus.PLAY_STATE) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async stop(): Promise<void> {
    await this.sendKey(KeyValue.PAUSE);
  }

  async nextTrack(): Promise<void> {
    await this.sendKey(KeyValue.NEXT_TRACK);
  }

  async previousTrack(): Promise<void> {
    await this.sendKey(KeyValue.PREV_TRACK);
  }

  async getBass(): Promise<Bass> {
    const data = await this.get<{ bass: Bass }>("/bass");
    return data.bass;
  }

  async setBass(level: number): Promise<void> {
    if (level < -10 || level > 10) {
      throw new Error("Bass level must be between -10 and 10");
    }
    const xml = `<bass>${level}</bass>`;
    await this.post("/bass", xml);
  }

  async getTone(): Promise<Tone> {
    const data = await this.get<{ tone: Tone }>("/tone");
    return data.tone;
  }

  async sendKey(key: KeyValue | string): Promise<void> {
    const xml = `<key state="press" sender="Gabbo">${key}</key>`;
    await this.post("/key", xml);
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
