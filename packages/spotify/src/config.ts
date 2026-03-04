import { z } from "zod";

export const spotifyConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z
    .string()
    .url()
    .default("http://127.0.0.1:3000/auth/spotify/callback"),
});

export type SpotifyConfig = z.infer<typeof spotifyConfigSchema>;
