import type { z } from "zod";
import type { Logger } from "./logger.js";

export interface TokenRecord {
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
}

export interface TokenStore {
  get(service: string): TokenRecord | undefined;
  upsert(
    service: string,
    accessToken: string,
    refreshToken?: string | null,
    expiresAt?: number | null,
    scope?: string | null,
  ): void;
}

export interface PluginContext {
  logger: Logger;
  tokenStore: TokenStore;
}

export interface ServerPlugin {
  name: string;
  configSchema: z.ZodTypeAny;
  createRoutes(
    app: unknown,
    context: PluginContext,
    config: unknown,
  ): Promise<void>;
}

export interface SpeakerInfo {
  id: string;
  name: string;
  host: string;
  port: number;
  model?: string;
}
