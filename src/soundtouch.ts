import axios, { AxiosInstance, AxiosError } from "axios";
import { parseString } from "xml2js";
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
} from "./types";
import { ConnectionError, TimeoutError, ApiError } from "./errors";

/**
 * Main class for controlling Bose SoundTouch speakers
 */
export class SoundTouch {
  private client: AxiosInstance;
  private baseUrl: string;

  /**
   * Create a new SoundTouch instance
   * @param host - IP address or hostname of the speaker
   * @param port - HTTP port (default: 8090)
   * @param timeout - Request timeout in seconds (default: 10.0)
   */
  constructor(
    private host: string,
    private port: number = 8090,
    private timeout: number = 10.0
  ) {
    this.baseUrl = `http://${host}:${port}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: timeout * 1000,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }

  /**
   * Handle errors and convert to appropriate error types
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNREFUSED" || axiosError.code === "ENOTFOUND") {
        throw new ConnectionError(
          `Could not connect to speaker at ${this.baseUrl}`,
          axiosError
        );
      }

      if (axiosError.code === "ETIMEDOUT" || axiosError.code === "ECONNABORTED") {
        throw new TimeoutError(`Request to ${this.baseUrl} timed out`);
      }

      // Check for API error response
      if (axiosError.response?.data) {
        const data = axiosError.response.data;
        if (typeof data === "object" && "error" in data) {
          const errorData = data as { error: { name: string; code: number; message?: string } };
          throw new ApiError(
            errorData.error.name,
            errorData.error.code,
            errorData.error.message
          );
        }
      }

      throw new ConnectionError(
        `Request failed: ${axiosError.message}`,
        axiosError
      );
    }

    throw error;
  }

  /**
   * Parse XML string to JavaScript object
   */
  private async parseXml<T>(xml: string): Promise<T> {
    return new Promise((resolve, reject) => {
      parseString(
        xml,
        {
          explicitArray: false,
          mergeAttrs: true,
          explicitCharkey: false,
          trim: true,
          normalize: true,
          ignoreAttrs: false,
          attrNameProcessors: [],
          tagNameProcessors: [],
        },
        (err, result) => {
          if (err) {
            reject(new Error(`Failed to parse XML: ${err.message}`));
          } else {
            resolve(result as T);
          }
        }
      );
    });
  }

  /**
   * Make a GET request and parse XML response
   */
  private async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.get<string>(endpoint, {
        responseType: "text",
      });
      const parsed = await this.parseXml<T>(response.data);
      return parsed;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Make a POST request with XML body
   */
  private async post(endpoint: string, body?: string): Promise<void> {
    try {
      await this.client.post(endpoint, body);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get device information
   */
  async getInfo(): Promise<DeviceInfo> {
    const data = await this.get<{ info: DeviceInfo }>("/info");
    // Normalize networkInfo to always be an array
    if (data.info.networkInfo && !Array.isArray(data.info.networkInfo)) {
      data.info.networkInfo = [data.info.networkInfo];
    }
    return data.info;
  }

  /**
   * Get device capabilities
   */
  async getCapabilities(): Promise<Capabilities> {
    const data = await this.get<{ capabilities: Capabilities }>("/capabilities");
    // Normalize capabilities array
    if (data.capabilities.capability && !Array.isArray(data.capabilities.capability)) {
      data.capabilities.capability = [data.capabilities.capability];
    }
    console.log(data.capabilities.capability);
    return data.capabilities;
  }

  /**
   * Set device name
   */
  async setName(name: string): Promise<void> {
    const xml = `<name>${this.escapeXml(name)}</name>`;
    await this.post("/name", xml);
  }

  /**
   * Get current playback state
   */
  async getNowPlaying(): Promise<NowPlaying> {
    const data = await this.get<{ nowPlaying: NowPlaying }>("/now_playing");
    return data.nowPlaying;
  }

  /**
   * Get available sources
   */
  async getSources(): Promise<Sources> {
    const data = await this.get<{ sources: Sources }>("/sources");
    // Normalize sourceItem array
    if (data.sources.sourceItem && !Array.isArray(data.sources.sourceItem)) {
      data.sources.sourceItem = [data.sources.sourceItem];
    }
    return data.sources;
  }

  /**
   * Select a source
   */
  async selectSource(
    source: string,
    sourceAccount?: string
  ): Promise<void> {
    let xml = `<ContentItem source="${this.escapeXml(source)}"`;
    if (sourceAccount) {
      xml += ` sourceAccount="${this.escapeXml(sourceAccount)}"`;
    }
    xml += ` location=""></ContentItem>`;
    await this.post("/select", xml);
  }

  /**
   * Get volume state
   */
  async getVolume(): Promise<Volume> {
    const data = await this.get<{ volume: Volume }>("/volume");
    return data.volume;
  }

  /**
   * Set volume level (0-100)
   */
  async setVolume(level: number): Promise<void> {
    if (level < 0 || level > 100) {
      throw new Error("Volume level must be between 0 and 100");
    }
    const xml = `<volume>${level}</volume>`;
    await this.post("/volume", xml);
  }

  /**
   * Mute the speaker
   */
  async mute(): Promise<void> {
    const xml = "<volume>mute</volume>";
    await this.post("/volume", xml);
  }

  /**
   * Unmute the speaker
   */
  async unmute(): Promise<void> {
    const xml = "<volume>unmute</volume>";
    await this.post("/volume", xml);
  }

  /**
   * Increase volume
   */
  async volumeUp(): Promise<void> {
    await this.post("/volume", "<volume>volumeUp</volume>");
  }

  /**
   * Decrease volume
   */
  async volumeDown(): Promise<void> {
    await this.post("/volume", "<volume>volumeDown</volume>");
  }

  /**
   * Get presets
   */
  async getPresets(): Promise<Presets> {
    const data = await this.get<{ presets: Presets }>("/presets");
    // Normalize preset array
    if (data.presets.preset && !Array.isArray(data.presets.preset)) {
      data.presets.preset = [data.presets.preset];
    }
    return data.presets;
  }

  /**
   * Select a preset (1-6)
   */
  async selectPreset(presetId: number): Promise<void> {
    if (presetId < 1 || presetId > 6) {
      throw new Error("Preset ID must be between 1 and 6");
    }
    const key = `PRESET_${presetId}` as KeyValue;
    await this.sendKey(key);
  }

  /**
   * Play
   */
  async play(): Promise<void> {
    await this.sendKey(KeyValue.PLAY);
  }

  /**
   * Pause
   */
  async pause(): Promise<void> {
    await this.sendKey(KeyValue.PAUSE);
  }

  /**
   * Toggle play/pause
   */
  async playPause(): Promise<void> {
    const nowPlaying = await this.getNowPlaying();
    if (nowPlaying.playStatus === PlayStatus.PLAY_STATE) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Stop
   */
  async stop(): Promise<void> {
    await this.sendKey(KeyValue.PAUSE);
  }

  /**
   * Next track
   */
  async nextTrack(): Promise<void> {
    await this.sendKey(KeyValue.NEXT_TRACK);
  }

  /**
   * Previous track
   */
  async previousTrack(): Promise<void> {
    await this.sendKey(KeyValue.PREV_TRACK);
  }

  /**
   * Get bass level
   */
  async getBass(): Promise<Bass> {
    const data = await this.get<{ bass: Bass }>("/bass");
    return data.bass;
  }

  /**
   * Set bass level (-10 to 10)
   */
  async setBass(level: number): Promise<void> {
    if (level < -10 || level > 10) {
      throw new Error("Bass level must be between -10 and 10");
    }
    const xml = `<bass>${level}</bass>`;
    await this.post("/bass", xml);
  }

  /**
   * Get tone settings (bass and treble)
   */
  async getTone(): Promise<Tone> {
    const data = await this.get<{ tone: Tone }>("/tone");
    return data.tone;
  }

  /**
   * Send a raw key press
   */
  async sendKey(key: KeyValue | string): Promise<void> {
    const keyValue = typeof key === "string" ? key : key;
    const xml = `<key state="press" sender="Gabbo">${keyValue}</key>`;
    await this.post("/key", xml);
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
