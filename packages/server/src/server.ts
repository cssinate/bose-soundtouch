import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Config, Logger, ServerPlugin } from "@soundtouch/core";
import type Database from "better-sqlite3";
import { SpeakerManager } from "./speaker-manager.js";
import { speakerRoutes } from "./routes/speakers.js";
import { websocketPlugin } from "./plugins/websocket.js";
import { createTokenStore } from "./db.js";

const CORE_CONFIG_KEYS = new Set(["server", "speakers", "discovery"]);

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
  await app.register(websocketPlugin, { speakerManager });

  const tokenStore = createTokenStore(db);
  const loadedPlugins = new Set<string>();

  for (const [key, value] of Object.entries(config)) {
    if (CORE_CONFIG_KEYS.has(key) || value === undefined || value === null) {
      continue;
    }

    let mod: Record<string, unknown>;

    try {
      mod = await import(`@soundtouch/${key}`);
    } catch {
      try {
        const siblingPath = new URL(`../../${key}/dist/index.js`, import.meta.url);
        mod = await import(siblingPath.href);
      } catch {
        logger.warn(`Plugin '${key}' configured but @soundtouch/${key} not available`);
        continue;
      }
    }

    try {
      if (!mod.plugin) {
        logger.debug(`@soundtouch/${key} has no server plugin — skipping`);
        continue;
      }

      const pluginDef = mod.plugin as ServerPlugin;
      const validatedConfig = pluginDef.configSchema.parse(value);
      await pluginDef.createRoutes(app, { logger, tokenStore }, validatedConfig);
      loadedPlugins.add(pluginDef.name);
      logger.info(`Loaded plugin: ${pluginDef.name}`);
    } catch (err: unknown) {
      logger.error(`Failed to load plugin '${key}'`, err);
    }
  }

  app.get("/api/health", async () => {
    return { status: "ok", timestamp: Date.now() };
  });

  app.get("/api/config/services", async () => {
    const services: Record<string, boolean> = {};
    for (const name of loadedPlugins) {
      services[name] = true;
    }
    return { services };
  });

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
