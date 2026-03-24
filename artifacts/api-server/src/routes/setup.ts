import { Router } from "express";
import { db, usersTable, categoriesTable, storesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// Endpoint temporal — eliminar después del primer uso
router.post("/setup/run-migrations", async (req, res) => {
  const secret = req.headers["x-setup-secret"];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    // Verifica conexión
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", message: "DB connected. Run seed separately." });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
