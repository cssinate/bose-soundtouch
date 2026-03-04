import { createLogger } from "@soundtouch/core";
import { loadConfig } from "./config-loader.js";
import { createDatabase } from "./db.js";
import { createServer } from "./server.js";

async function main() {
  const configPath = process.argv[2];
  const config = loadConfig(configPath);
  const logger = createLogger("server", config.server.logLevel);

  logger.info("Starting SoundTouch server...");

  const db = createDatabase(config.server.dataDir);
  const app = await createServer({ config, db, logger });

  try {
    await app.listen({ port: config.server.port, host: config.server.host });
    logger.info(
      `Server listening on http://${config.server.host}:${config.server.port}`,
    );
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }

  const shutdown = async () => {
    logger.info("Shutting down...");
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
