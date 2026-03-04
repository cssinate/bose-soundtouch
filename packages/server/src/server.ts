import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Config, Logger } from "@soundtouch/core";
import type Database from "better-sqlite3";
import { SpeakerManager } from "./speaker-manager.js";
import { speakerRoutes } from "./routes/speakers.js";
import { systemRoutes } from "./routes/system.js";
import { spotifyRoutes } from "./routes/spotify.js";
import { websocketPlugin } from "./plugins/websocket.js";

export interface ServerOptions {
  config: Config;
  db: Database.Database;
  logger: Logger;
  webDistPath?: string;
}

export async function createServer(opts: ServerOptions) {
  const { config, db, logger } = opts;

  const app = Fastify({
    logger: false,
  });

  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyWebsocket);

  const speakerManager = new SpeakerManager(db, logger);

  await app.register(speakerRoutes, { speakerManager });
  await app.register(systemRoutes, { config });
  await app.register(spotifyRoutes, { config, db, logger });
  await app.register(websocketPlugin, { speakerManager });

  const webDist =
    opts.webDistPath ??
    resolve(
      import.meta.dirname ?? process.cwd(),
      "..",
      "..",
      "web",
      "dist",
    );

  if (existsSync(webDist)) {
    logger.info(`Serving web UI from ${webDist}`);
    await app.register(fastifyStatic, {
      root: webDist,
      wildcard: false,
    });

    app.setNotFoundHandler((_req, reply) => {
      return reply.sendFile("index.html");
    });
  } else {
    logger.info("No web UI build found — serving API only");
    app.setNotFoundHandler((_req, reply) => {
      reply.code(404).send({ error: "Not found" });
    });
  }

  await speakerManager.initialize(
    config.speakers,
    config.discovery.enabled,
    config.discovery.intervalMs,
  );

  app.addHook("onClose", () => {
    speakerManager.stop();
    db.close();
  });

  return app;
}
