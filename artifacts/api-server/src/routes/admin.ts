import { Router, type IRouter } from "express";
import { db, usersTable, storesTable, productsTable, productImagesTable, reviewsTable, categoriesTable, bannersTable } from "@workspace/db";
import { eq, desc, asc, count, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { sendStoreApprovedEmail } from "../services/email.js";

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
    const { status, page: pageStr, limit: limitStr } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(pageStr || "1"));
    const limit = Math.min(100, parseInt(limitStr || "50"));
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
    if (status === "active") {
      const [owner] = await db
        .select({ email: usersTable.email, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, updated.userId))
        .limit(1);
      if (owner) {
        sendStoreApprovedEmail(owner.email, owner.name, updated.name, updated.slug).catch(() => {});
      }
    }
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

// ─── Store detail (admin) ──────────────────────────────────────────────────────

router.get("/stores/:id/detail", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, id)).limit(1);
    if (!store) { res.status(404).json({ error: "Not Found" }); return; }

    const [category] = store.categoryId
      ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, store.categoryId)).limit(1)
      : [];
    const [owner] = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, phone: usersTable.phone, district: usersTable.district,
      createdAt: usersTable.createdAt, isBlocked: usersTable.isBlocked,
    }).from(usersTable).where(eq(usersTable.id, store.userId)).limit(1);

    const [{ productCount }] = await db.select({ productCount: count() }).from(productsTable).where(eq(productsTable.storeId, id));
    const [{ reviewCount }] = await db.select({ reviewCount: count() }).from(reviewsTable).where(eq(reviewsTable.storeId, id));
    const [avgResult] = await db.select({ avg: sql<number>`AVG(${reviewsTable.rating})` }).from(reviewsTable).where(eq(reviewsTable.storeId, id));

    res.json({
      ...store,
      category: category || null,
      owner: owner || null,
      productCount: Number(productCount),
      reviewCount: Number(reviewCount),
      averageRating: avgResult.avg ? Number(avgResult.avg) : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get store detail" });
  }
});

// ─── Store products (admin) ────────────────────────────────────────────────────

router.get("/stores/:id/products", async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const rawProducts = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.storeId, storeId))
      .orderBy(asc(productsTable.sortOrder), asc(productsTable.id));

    const productIds = rawProducts.map(p => p.id);
    const allImages = productIds.length > 0
      ? await db.select().from(productImagesTable).where(inArray(productImagesTable.productId, productIds)).orderBy(productImagesTable.sortOrder)
      : [];

    res.json(rawProducts.map(p => ({
      ...p,
      images: allImages.filter(img => img.productId === p.id),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get store products" });
  }
});

// ─── Toggle product status ────────────────────────────────────────────────────

router.put("/products/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["active", "inactive", "rejected"].includes(status)) {
      res.status(400).json({ error: "Bad Request", message: "Invalid status" });
      return;
    }
    const [prod] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!prod) { res.status(404).json({ error: "Not Found" }); return; }
    const [updated] = await db.update(productsTable).set({ status, updatedAt: new Date() }).where(eq(productsTable.id, id)).returning();
    res.json({ ...updated, images: [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update product status" });
  }
});

// ─── Delete product (admin) ───────────────────────────────────────────────────

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productImagesTable).where(eq(productImagesTable.productId, id));
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete product" });
  }
});

// ─── Store reviews (admin — includes hidden) ──────────────────────────────────

router.get("/stores/:id/reviews", async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const reviews = await db
      .select({
        id: reviewsTable.id, storeId: reviewsTable.storeId, userId: reviewsTable.userId,
        rating: reviewsTable.rating, comment: reviewsTable.comment, isVisible: reviewsTable.isVisible,
        createdAt: reviewsTable.createdAt,
        userName: usersTable.name, userEmail: usersTable.email, userAvatar: usersTable.avatarUrl,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.storeId, storeId))
      .orderBy(desc(reviewsTable.createdAt));

    res.json(reviews.map(r => ({
      id: r.id, storeId: r.storeId, userId: r.userId,
      rating: r.rating, comment: r.comment, isVisible: r.isVisible, createdAt: r.createdAt,
      user: { name: r.userName, email: r.userEmail, avatarUrl: r.userAvatar },
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get reviews" });
  }
});

// ─── Toggle review visibility ─────────────────────────────────────────────────

router.put("/reviews/:id/visible", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [review] = await db.select({ isVisible: reviewsTable.isVisible }).from(reviewsTable).where(eq(reviewsTable.id, id)).limit(1);
    if (!review) { res.status(404).json({ error: "Not Found" }); return; }
    const [updated] = await db.update(reviewsTable).set({ isVisible: !review.isVisible }).where(eq(reviewsTable.id, id)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to toggle review" });
  }
});

// ─── Delete review ────────────────────────────────────────────────────────────

router.delete("/reviews/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete review" });
  }
});

export default router;
