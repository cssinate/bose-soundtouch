import { SoundTouch } from "@soundtouch/api";
import { SpeakerScanner } from "@soundtouch/discovery";
import type { SpeakerInfo, Logger } from "@soundtouch/core";
import type Database from "better-sqlite3";
import { upsertSpeaker, getAllSpeakers } from "./db.js";

export class SpeakerManager {
  private connections = new Map<string, SoundTouch>();
  private speakers = new Map<string, SpeakerInfo>();
  private scanner: SpeakerScanner | null = null;

  constructor(
    private db: Database.Database,
    private logger: Logger,
  ) {}

  async initialize(
    manualSpeakers: { host: string; port: number; name?: string }[],
    discoveryEnabled: boolean,
    discoveryIntervalMs?: number,
  ): Promise<void> {
    for (const s of manualSpeakers) {
      const st = new SoundTouch(s.host, s.port);
      try {
        const info = await st.getInfo();
        const speaker: SpeakerInfo = {
          id: info.deviceID,
          name: info.name,
          host: s.host,
          port: s.port,
          model: info.type,
        };
        this.register(speaker);
        this.logger.info(`Connected to speaker: ${speaker.name} at ${s.host}`);
      } catch {
        this.logger.warn(
          `Could not reach speaker at ${s.host}:${s.port} — will retry via discovery`,
        );
      }
    }

    if (discoveryEnabled) {
      this.scanner = new SpeakerScanner({
        intervalMs: discoveryIntervalMs,
        logger: this.logger,
      });

      this.scanner.on("discovered", (speaker) => {
        this.register(speaker);
      });

      this.scanner.on("lost", (speaker) => {
        this.logger.info(`Speaker went offline: ${speaker.name}`);
      });

      await this.scanner.start();
    }
  }

  private register(speaker: SpeakerInfo): void {
    this.speakers.set(speaker.id, speaker);
    this.connections.set(
      speaker.id,
      new SoundTouch(speaker.host, speaker.port),
    );
    upsertSpeaker(
      this.db,
      speaker.id,
      speaker.name,
      speaker.host,
      speaker.port,
      speaker.model,
    );
  }

  getSpeaker(id: string): SoundTouch | undefined {
    return this.connections.get(id);
  }

  listSpeakers(): SpeakerInfo[] {
    return Array.from(this.speakers.values());
  }

  listPersistedSpeakers() {
    return getAllSpeakers(this.db);
  }

  stop(): void {
    this.scanner?.stop();
  }
}
