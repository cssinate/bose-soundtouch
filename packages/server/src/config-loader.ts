import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { configSchema, type Config } from "@soundtouch/core";

function envToConfig(): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  const server: Record<string, unknown> = {};
  if (process.env.PORT) server.port = Number(process.env.PORT);
  if (process.env.HOST) server.host = process.env.HOST;
  if (process.env.DATA_DIR) server.dataDir = process.env.DATA_DIR;
  if (process.env.LOG_LEVEL) server.logLevel = process.env.LOG_LEVEL;
  if (process.env.PIN) server.pin = process.env.PIN;
  if (Object.keys(server).length > 0) config.server = server;

  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    const spotify: Record<string, string> = {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    };
    if (process.env.SPOTIFY_REDIRECT_URI)
      spotify.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    config.spotify = spotify;
  }

  if (process.env.SPEAKER_HOSTS) {
    config.speakers = process.env.SPEAKER_HOSTS.split(",").map((h) => {
      const [host, portStr] = h.trim().split(":");
      return { host, port: portStr ? Number(portStr) : 8090 };
    });
  }

  if (process.env.DISCOVERY_ENABLED !== undefined) {
    config.discovery = {
      enabled: process.env.DISCOVERY_ENABLED !== "false",
    };
  }

  return config;
}

export function loadConfig(configPath?: string): Config {
  let fileConfig: Record<string, unknown> = {};

  const resolvedPath =
    configPath ?? resolve(process.cwd(), "..", "..", "soundtouch.config.yaml");

  if (existsSync(resolvedPath)) {
    const raw = readFileSync(resolvedPath, "utf-8");
    fileConfig = parseYaml(raw) ?? {};
  }

  const envConfig = envToConfig();

  const merged = deepMerge(fileConfig, envConfig);
  return configSchema.parse(merged);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };

  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overVal = override[key];

    if (
      isPlainObject(baseVal) &&
      isPlainObject(overVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overVal as Record<string, unknown>,
      );
    } else {
      result[key] = overVal;
    }
  }

  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}
