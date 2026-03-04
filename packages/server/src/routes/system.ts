import type { FastifyInstance } from "fastify";
import type { Config } from "@soundtouch/core";

export async function systemRoutes(
  app: FastifyInstance,
  opts: { config: Config },
): Promise<void> {
  app.get("/api/health", async () => {
    return { status: "ok", timestamp: Date.now() };
  });

  app.get("/api/config/services", async () => {
    const services: Record<string, boolean> = {
      spotify: !!opts.config.spotify,
    };
    return { services };
  });
}
