import app from "./app";
import { logger } from "./lib/logger";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@workspace/db";
import path from "path";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Correr migraciones automáticamente al arrancar
async function start() {
  try {
    logger.info("Running migrations...");
    await migrate(db, {
      migrationsFolder: path.resolve("../../lib/db/drizzle"),
    });
    logger.info("Migrations complete");
  } catch (err) {
    logger.error({ err }, "Migration failed");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
