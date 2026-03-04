import { z } from "zod";

export const speakerConfigSchema = z.object({
  host: z.string(),
  port: z.number().default(8090),
  name: z.string().optional(),
});

export const spotifyConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z
    .string()
    .url()
    .default("http://127.0.0.1:3000/auth/spotify/callback"),
});

export const serverConfigSchema = z.object({
  port: z.number().default(3000),
  host: z.string().default("0.0.0.0"),
  dataDir: z.string().default("./data"),
  logLevel: z
    .enum(["debug", "info", "warn", "error", "silent"])
    .default("info"),
  pin: z.string().optional(),
});

export const configSchema = z.object({
  server: serverConfigSchema.default({}),
  speakers: z.array(speakerConfigSchema).default([]),
  spotify: spotifyConfigSchema.optional(),
  discovery: z
    .object({
      enabled: z.boolean().default(true),
      intervalMs: z.number().default(30_000),
    })
    .default({}),
});

export type SpeakerConfig = z.infer<typeof speakerConfigSchema>;
export type SpotifyConfig = z.infer<typeof spotifyConfigSchema>;
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export type Config = z.infer<typeof configSchema>;
