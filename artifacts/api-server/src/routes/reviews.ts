import { Router, type IRouter } from "express";
import { db, reviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const id = parseInt(String(req.params.id));
    const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id)).limit(1);
    if (!review) {
      res.status(404).json({ error: "Not Found", message: "Review not found" });
      return;
    }
    if (review.userId !== userId && userRole !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete review" });
  }
});

export default router;
