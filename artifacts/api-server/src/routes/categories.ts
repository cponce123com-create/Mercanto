import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.isActive, true)).orderBy(categoriesTable.sortOrder, categoriesTable.name);
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list categories" });
  }
});

export default router;
