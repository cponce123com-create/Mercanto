import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).json({
      status: "ok",
      timestamp,
      database: "connected",
      uptime,
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp,
      database: "disconnected",
      uptime,
    });
  }
});

export default router;
