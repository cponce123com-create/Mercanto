import { Router, type IRouter } from "express";
import { db, storesTable, usersTable, reviewsTable, productsTable } from "@workspace/db";
import { eq, and, gte, count, avg } from "drizzle-orm";
import { sendWeeklySummaryEmail } from "../services/email.js";

const router: IRouter = Router();

router.post("/weekly-summary", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (!secret || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const vendors = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.role, "vendor"));

  let sent = 0;
  for (const vendor of vendors) {
    const [store] = await db
      .select()
      .from(storesTable)
      .where(and(eq(storesTable.userId, vendor.id), eq(storesTable.status, "active")))
      .limit(1);
    if (!store) continue;

    const [{ totalProducts }] = await db
      .select({ totalProducts: count() })
      .from(productsTable)
      .where(and(eq(productsTable.storeId, store.id), eq(productsTable.status, "active")));

    const [{ newReviews }] = await db
      .select({ newReviews: count() })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.storeId, store.id), gte(reviewsTable.createdAt, oneWeekAgo)));

    const [{ avgRating }] = await db
      .select({ avgRating: avg(reviewsTable.rating) })
      .from(reviewsTable)
      .where(eq(reviewsTable.storeId, store.id));

    await sendWeeklySummaryEmail(vendor.email, vendor.name, store.name, store.slug, {
      visits: store.totalVisits ?? 0,
      newReviews: Number(newReviews),
      avgRating: avgRating ? Number(avgRating) : null,
      totalProducts: Number(totalProducts),
    });
    sent++;
  }

  res.json({ success: true, sent });
});

export default router;
