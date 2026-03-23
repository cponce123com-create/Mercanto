import { Router, type IRouter } from "express";
import { db, bannersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const banners = await db.select().from(bannersTable).where(eq(bannersTable.isActive, true)).orderBy(bannersTable.sortOrder);
    res.json(banners);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list banners" });
  }
});

export default router;
