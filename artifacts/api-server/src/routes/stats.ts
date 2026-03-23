import { Router } from "express";
import { db, storesTable, productsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";

const router = Router();

router.get("/public", async (_req, res) => {
  try {
    const [[{ totalStores }], [{ totalProducts }]] = await Promise.all([
      db.select({ totalStores: count() }).from(storesTable).where(eq(storesTable.status, "active")),
      db.select({ totalProducts: count() }).from(productsTable).where(eq(productsTable.status, "active")),
    ]);
    res.json({ totalStores: Number(totalStores), totalProducts: Number(totalProducts) });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
