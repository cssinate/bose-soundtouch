import { createSocket, Socket } from "node:dgram";
import { EventEmitter } from "node:events";
import type { SpeakerInfo, Logger } from "@soundtouch/core";
import { createLogger } from "@soundtouch/core";

const SSDP_ADDRESS = "239.255.255.250";
const SSDP_PORT = 1900;
const SOUNDTOUCH_URN = "urn:schemas-upnp-org:device:MediaRenderer:1";

const SEARCH_MESSAGE = [
  "M-SEARCH * HTTP/1.1",
  `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
  'MAN: "ssdp:discover"',
  "MX: 3",
  `ST: ${SOUNDTOUCH_URN}`,
  "",
  "",
].join("\r\n");

interface RawSsdpHeaders {
  location?: string;
  usn?: string;
  st?: string;
  [key: string]: string | undefined;
}

export interface ScannerOptions {
  /** How often to broadcast discovery (ms). Default: 30000 */
  intervalMs?: number;
  /** Timeout for the speaker info fetch (ms). Default: 5000 */
  fetchTimeoutMs?: number;
  logger?: Logger;
}

export interface ScannerEvents {
  discovered: [speaker: SpeakerInfo];
  lost: [speaker: SpeakerInfo];
  error: [error: Error];
}

export class SpeakerScanner extends EventEmitter<ScannerEvents> {
  private socket: Socket | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private speakers = new Map<string, SpeakerInfo>();
  private lastSeen = new Map<string, number>();
  private logger: Logger;
  private intervalMs: number;
  private fetchTimeoutMs: number;

  constructor(options: ScannerOptions = {}) {
    super();
    this.intervalMs = options.intervalMs ?? 30_000;
    this.fetchTimeoutMs = options.fetchTimeoutMs ?? 5_000;
    this.logger = options.logger ?? createLogger("discovery");
  }

  get knownSpeakers(): SpeakerInfo[] {
    return Array.from(this.speakers.values());
  }

  async start(): Promise<void> {
    if (this.socket) return;

    this.socket = createSocket({ type: "udp4", reuseAddr: true });

    this.socket.on("message", (msg) => {
      try {
        this.handleResponse(msg.toString());
      } catch (err) {
        this.emit("error", err instanceof Error ? err : new Error(String(err)));
      }
    });

    this.socket.on("error", (err) => {
      this.logger.error("Socket error", err);
      this.emit("error", err);
    });

    await new Promise<void>((resolve, reject) => {
      this.socket!.bind(undefined, () => {
        try {
          this.socket!.addMembership(SSDP_ADDRESS);
        } catch {
          // Membership add can fail if already joined; non-fatal
        }
        resolve();
      });
      this.socket!.once("error", reject);
    });

    this.logger.info("Discovery started");
    this.search();
    this.intervalId = setInterval(() => this.search(), this.intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.socket) {
      try {
        this.socket.dropMembership(SSDP_ADDRESS);
      } catch {
        // Ignore
      }
      this.socket.close();
      this.socket = null;
    }

    this.logger.info("Discovery stopped");
  }

  private search(): void {
    if (!this.socket) return;

    const buf = Buffer.from(SEARCH_MESSAGE);
    this.socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
      if (err) {
        this.logger.error("Failed to send discovery", err);
      }
    });

    this.pruneStale();
  }

  private handleResponse(raw: string): void {
    const headers = this.parseHeaders(raw);

    if (!headers.location) return;

    const url = new URL(headers.location);
    const host = url.hostname;
    const port = 8090;

    const id = headers.usn ?? host;

    if (this.speakers.has(id)) {
      this.lastSeen.set(id, Date.now());
      return;
    }

    this.fetchSpeakerInfo(host, port, id);
  }

  private async fetchSpeakerInfo(
    host: string,
    port: number,
    id: string,
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.fetchTimeoutMs,
      );

      const res = await fetch(`http://${host}:${port}/info`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return;

      const text = await res.text();
      const nameMatch = text.match(/<name>([^<]+)<\/name>/);
      const typeMatch = text.match(/<type>([^<]+)<\/type>/);
      const deviceIdMatch = text.match(/deviceID="([^"]+)"/);

      const speaker: SpeakerInfo = {
        id: deviceIdMatch?.[1] ?? id,
        name: nameMatch?.[1] ?? "Unknown",
        host,
        port,
        model: typeMatch?.[1],
      };

      this.speakers.set(id, speaker);
      this.lastSeen.set(id, Date.now());
      this.logger.info(`Discovered speaker: ${speaker.name} at ${host}`);
      this.emit("discovered", speaker);
    } catch {
      this.logger.debug(`Failed to fetch info from ${host}:${port}`);
    }
  }

  private pruneStale(): void {
    const staleThreshold = Date.now() - this.intervalMs * 3;

    for (const [id, lastSeen] of this.lastSeen) {
      if (lastSeen < staleThreshold) {
        const speaker = this.speakers.get(id);
        if (speaker) {
          this.speakers.delete(id);
          this.lastSeen.delete(id);
          this.logger.info(`Lost speaker: ${speaker.name}`);
          this.emit("lost", speaker);
        }
      }
    }
  }

  private parseHeaders(raw: string): RawSsdpHeaders {
    const headers: RawSsdpHeaders = {};
    const lines = raw.split("\r\n");

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      headers[key] = value;
    }

    return headers;
  }
}
