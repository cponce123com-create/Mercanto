import { Router, type IRouter } from "express";
import { db, storesTable, categoriesTable, userFavoritesTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

function parsePaymentMethods(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function mapFavStore(s: any) {
  return {
    id: s.id, userId: s.userId, name: s.name, slug: s.slug,
    description: s.description, logoUrl: s.logoUrl, bannerUrl: s.bannerUrl,
    categoryId: s.categoryId, location: s.location, district: s.district,
    lat: s.lat, lng: s.lng, whatsapp: s.whatsapp, instagram: s.instagram,
    facebook: s.facebook, website: s.website, status: s.status,
    isFeatured: s.isFeatured, totalVisits: s.totalVisits,
    createdAt: s.createdAt, updatedAt: s.updatedAt,
    paymentMethods: parsePaymentMethods(s.paymentMethods),
    doesDelivery: s.doesDelivery ?? false,
    deliveryRadius: s.deliveryRadius ?? null,
    category: s.categoryId ? { id: s.categoryId, name: s.categoryName, slug: s.categorySlug, icon: s.categoryIcon } : null,
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const favs = await db.select({ storeId: userFavoritesTable.storeId })
      .from(userFavoritesTable)
      .where(eq(userFavoritesTable.userId, userId));

    const favoriteIds = favs.map(f => f.storeId);

    if (favoriteIds.length === 0) {
      res.json({ favorites: [], favoriteIds: [] });
      return;
    }

    const stores = await db.select({
      id: storesTable.id, userId: storesTable.userId, name: storesTable.name,
      slug: storesTable.slug, description: storesTable.description,
      logoUrl: storesTable.logoUrl, bannerUrl: storesTable.bannerUrl,
      categoryId: storesTable.categoryId, location: storesTable.location,
      district: storesTable.district, lat: storesTable.lat, lng: storesTable.lng,
      whatsapp: storesTable.whatsapp, instagram: storesTable.instagram,
      facebook: storesTable.facebook, website: storesTable.website,
      status: storesTable.status, isFeatured: storesTable.isFeatured,
      totalVisits: storesTable.totalVisits, createdAt: storesTable.createdAt,
      updatedAt: storesTable.updatedAt, paymentMethods: storesTable.paymentMethods,
      doesDelivery: storesTable.doesDelivery, deliveryRadius: storesTable.deliveryRadius,
      categoryName: categoriesTable.name, categorySlug: categoriesTable.slug, categoryIcon: categoriesTable.icon,
    })
      .from(storesTable)
      .leftJoin(categoriesTable, eq(storesTable.categoryId, categoriesTable.id))
      .where(and(inArray(storesTable.id, favoriteIds), eq(storesTable.status, "active")));

    res.json({ favorites: stores.map(mapFavStore), favoriteIds });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get favorites" });
  }
});

router.post("/:storeId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const storeId = parseInt(String(req.params.storeId));
    if (isNaN(storeId)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid storeId" });
      return;
    }
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.id, storeId)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }
    await db.insert(userFavoritesTable).values({ userId, storeId }).onConflictDoNothing();
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to add favorite" });
  }
});

router.delete("/:storeId", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const storeId = parseInt(String(req.params.storeId));
    if (isNaN(storeId)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid storeId" });
      return;
    }
    await db.delete(userFavoritesTable).where(and(eq(userFavoritesTable.userId, userId), eq(userFavoritesTable.storeId, storeId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to remove favorite" });
  }
});

export default router;
