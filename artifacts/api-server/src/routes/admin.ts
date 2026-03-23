import { Router, type IRouter } from "express";
import { db, usersTable, storesTable, productsTable, reviewsTable, categoriesTable, bannersTable } from "@workspace/db";
import { eq, desc, asc, count, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router: IRouter = Router();

router.use(requireAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [[{ totalUsers }], [{ totalStores }], [{ activeStores }], [{ pendingStores }], [{ totalProducts }], [{ totalReviews }]] = await Promise.all([
      db.select({ totalUsers: count() }).from(usersTable),
      db.select({ totalStores: count() }).from(storesTable),
      db.select({ activeStores: count() }).from(storesTable).where(eq(storesTable.status, "active")),
      db.select({ pendingStores: count() }).from(storesTable).where(eq(storesTable.status, "pending")),
      db.select({ totalProducts: count() }).from(productsTable),
      db.select({ totalReviews: count() }).from(reviewsTable),
    ]);
    res.json({
      totalUsers: Number(totalUsers),
      totalStores: Number(totalStores),
      activeStores: Number(activeStores),
      pendingStores: Number(pendingStores),
      totalProducts: Number(totalProducts),
      totalReviews: Number(totalReviews),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get stats" });
  }
});

router.get("/stores", async (req, res) => {
  try {
    const { status, page: pageStr } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(pageStr || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: storesTable.id, userId: storesTable.userId, name: storesTable.name,
      slug: storesTable.slug, description: storesTable.description,
      logoUrl: storesTable.logoUrl, bannerUrl: storesTable.bannerUrl,
      categoryId: storesTable.categoryId, location: storesTable.location,
      district: storesTable.district, lat: storesTable.lat, lng: storesTable.lng,
      whatsapp: storesTable.whatsapp, instagram: storesTable.instagram,
      facebook: storesTable.facebook, website: storesTable.website,
      status: storesTable.status, isFeatured: storesTable.isFeatured,
      totalVisits: storesTable.totalVisits, createdAt: storesTable.createdAt, updatedAt: storesTable.updatedAt,
      categoryName: categoriesTable.name, categorySlug: categoriesTable.slug, categoryIcon: categoriesTable.icon,
    }).from(storesTable).leftJoin(categoriesTable, eq(storesTable.categoryId, categoriesTable.id)).$dynamic();

    let countQuery = db.select({ total: count() }).from(storesTable).$dynamic();
    if (status) {
      query = query.where(eq(storesTable.status, status));
      countQuery = countQuery.where(eq(storesTable.status, status));
    }
    const [{ total }] = await countQuery;
    const stores = await query.orderBy(desc(storesTable.createdAt)).limit(limit).offset(offset);

    res.json({
      stores: stores.map(s => ({
        ...s,
        category: s.categoryId ? { id: s.categoryId, name: s.categoryName, slug: s.categorySlug, icon: s.categoryIcon } : null,
      })),
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list stores" });
  }
});

router.put("/stores/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["pending", "active", "rejected"].includes(status)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid status" });
      return;
    }
    const [updated] = await db.update(storesTable).set({ status, updatedAt: new Date() }).where(eq(storesTable.id, id)).returning();
    res.json({ ...updated, category: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update status" });
  }
});

router.put("/stores/:id/featured", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [store] = await db.select({ isFeatured: storesTable.isFeatured }).from(storesTable).where(eq(storesTable.id, id)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const [updated] = await db.update(storesTable).set({ isFeatured: !store.isFeatured, updatedAt: new Date() }).where(eq(storesTable.id, id)).returning();
    res.json({ ...updated, category: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to toggle featured" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { page: pageStr } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(pageStr || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;
    const [{ total }] = await db.select({ total: count() }).from(usersTable);
    const users = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, avatarUrl: usersTable.avatarUrl, phone: usersTable.phone,
      district: usersTable.district, isBlocked: usersTable.isBlocked, createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    res.json({
      users: users.map(u => ({ ...u, isBlocked: u.isBlocked ?? false })),
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list users" });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!["user", "vendor", "admin"].includes(role)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid role" });
      return;
    }
    const [updated] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, avatarUrl: usersTable.avatarUrl, phone: usersTable.phone,
      district: usersTable.district, isBlocked: usersTable.isBlocked, createdAt: usersTable.createdAt,
    });
    res.json({ ...updated, isBlocked: updated.isBlocked ?? false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update role" });
  }
});

router.put("/users/:id/block", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db.select({ isBlocked: usersTable.isBlocked }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const [updated] = await db.update(usersTable).set({ isBlocked: !user.isBlocked }).where(eq(usersTable.id, id)).returning({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, avatarUrl: usersTable.avatarUrl, phone: usersTable.phone,
      district: usersTable.district, isBlocked: usersTable.isBlocked, createdAt: usersTable.createdAt,
    });
    res.json({ ...updated, isBlocked: updated.isBlocked ?? false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to toggle block" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list categories" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const { name, slug, icon, description, isActive, sortOrder } = req.body;
    const [cat] = await db.insert(categoriesTable).values({ name, slug, icon, description, isActive: isActive ?? true, sortOrder: sortOrder ?? 0 }).returning();
    res.json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create category" });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, slug, icon, description, isActive, sortOrder } = req.body;
    const [updated] = await db.update(categoriesTable).set({ name, slug, icon, description, isActive, sortOrder }).where(eq(categoriesTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update category" });
  }
});

router.get("/banners", async (req, res) => {
  try {
    const banners = await db.select().from(bannersTable).orderBy(asc(bannersTable.sortOrder));
    res.json(banners);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list banners" });
  }
});

router.post("/banners", async (req, res) => {
  try {
    const { title, subtitle, imageUrl, publicId, linkUrl, isActive, sortOrder } = req.body;
    const [banner] = await db.insert(bannersTable).values({ title, subtitle, imageUrl, publicId, linkUrl, isActive: isActive ?? true, sortOrder: sortOrder ?? 0 }).returning();
    res.json(banner);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create banner" });
  }
});

router.put("/banners/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, subtitle, imageUrl, publicId, linkUrl, isActive, sortOrder } = req.body;
    const [updated] = await db.update(bannersTable).set({ title, subtitle, imageUrl, publicId, linkUrl, isActive, sortOrder }).where(eq(bannersTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update banner" });
  }
});

router.delete("/banners/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(bannersTable).where(eq(bannersTable.id, id));
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete banner" });
  }
});

export default router;
