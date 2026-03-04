import type { Logger } from "./logger.js";

export interface ServiceModule {
  name: string;
  version: string;
  register(context: ServiceContext): Promise<void>;
  isConfigured(): boolean;
}

export interface ServiceContext {
  logger: Logger;
  config: Record<string, unknown>;
}

export interface SpeakerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  model?: string;
}
