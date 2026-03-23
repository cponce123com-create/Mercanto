import { Router, type IRouter } from "express";
import { db, storesTable, categoriesTable, productsTable, productImagesTable, storeGalleryImagesTable, reviewsTable, usersTable } from "@workspace/db";
import { eq, and, ilike, or, desc, asc, sql, isNotNull, count, inArray } from "drizzle-orm";
import { requireAuth, requireVendor, optionalAuth } from "../lib/auth.js";
import { generateUniqueStoreSlug } from "../lib/slug.js";

const router: IRouter = Router();

router.get("/map", async (req, res) => {
  try {
    const { district, category } = req.query as Record<string, string>;
    const conditions = [
      eq(storesTable.status, "active"),
      isNotNull(storesTable.lat),
      isNotNull(storesTable.lng),
    ];
    if (district) conditions.push(eq(storesTable.district, district));
    const stores = await db
      .select({
        id: storesTable.id,
        name: storesTable.name,
        slug: storesTable.slug,
        description: storesTable.description,
        logoUrl: storesTable.logoUrl,
        district: storesTable.district,
        lat: storesTable.lat,
        lng: storesTable.lng,
        whatsapp: storesTable.whatsapp,
        categoryId: storesTable.categoryId,
        categoryName: categoriesTable.name,
        categorySlug: categoriesTable.slug,
        categoryIcon: categoriesTable.icon,
      })
      .from(storesTable)
      .leftJoin(categoriesTable, eq(storesTable.categoryId, categoriesTable.id))
      .where(and(...conditions))
      .limit(500);

    if (category) {
      res.json(stores.filter(s => s.categorySlug === category || s.categoryName?.toLowerCase() === category.toLowerCase()));
      return;
    }

    res.json(stores.map(s => ({
      id: s.id, name: s.name, slug: s.slug, description: s.description,
      logoUrl: s.logoUrl, district: s.district, lat: s.lat, lng: s.lng,
      whatsapp: s.whatsapp,
      category: s.categoryId ? { id: s.categoryId, name: s.categoryName, slug: s.categorySlug, icon: s.categoryIcon } : null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list stores for map" });
  }
});

router.get("/my", requireVendor, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [store] = await db.select().from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "No store found" });
      return;
    }
    const [category] = store.categoryId
      ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, store.categoryId)).limit(1)
      : [];
    const galleryImages = await db.select().from(storeGalleryImagesTable).where(eq(storeGalleryImagesTable.storeId, store.id)).orderBy(storeGalleryImagesTable.sortOrder);
    const [{ count: reviewCount }] = await db.select({ count: count() }).from(reviewsTable).where(and(eq(reviewsTable.storeId, store.id), eq(reviewsTable.isVisible, true)));
    const [avgResult] = await db.select({ avg: sql<number>`AVG(${reviewsTable.rating})` }).from(reviewsTable).where(and(eq(reviewsTable.storeId, store.id), eq(reviewsTable.isVisible, true)));
    res.json({ ...store, category: category || null, products: [], galleryImages, reviewCount: Number(reviewCount), averageRating: avgResult.avg ? Number(avgResult.avg) : null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get store" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { district, category, search, sort, page: pageStr, limit: limitStr, featured } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(pageStr || "1"));
    const limit = Math.min(50, parseInt(limitStr || "12"));
    const offset = (page - 1) * limit;

    const conditions = [eq(storesTable.status, "active")];
    if (district) conditions.push(eq(storesTable.district, district));
    if (featured === "true") conditions.push(eq(storesTable.isFeatured, true));

    const whereClause = and(...conditions);

    let query = db
      .select({
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
      })
      .from(storesTable)
      .leftJoin(categoriesTable, eq(storesTable.categoryId, categoriesTable.id))
      .where(whereClause)
      .$dynamic();

    if (search) {
      query = db
        .select({
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
        })
        .from(storesTable)
        .leftJoin(categoriesTable, eq(storesTable.categoryId, categoriesTable.id))
        .where(and(eq(storesTable.status, "active"),
          or(ilike(storesTable.name, `%${search}%`), ilike(storesTable.description, `%${search}%`))))
        .$dynamic();
    }

    const [{ count: totalCount }] = await db.select({ count: count() }).from(storesTable)
      .leftJoin(categoriesTable, eq(storesTable.categoryId, categoriesTable.id))
      .where(search
        ? and(eq(storesTable.status, "active"), or(ilike(storesTable.name, `%${search}%`), ilike(storesTable.description, `%${search}%`)))
        : whereClause);

    if (sort === "visits") query = query.orderBy(desc(storesTable.totalVisits));
    else if (sort === "oldest") query = query.orderBy(asc(storesTable.createdAt));
    else if (sort === "name") query = query.orderBy(asc(storesTable.name));
    else query = query.orderBy(desc(storesTable.isFeatured), desc(storesTable.createdAt));

    const stores = await query.limit(limit).offset(offset);

    if (category) {
      const filtered = stores.filter(s => s.categorySlug === category);
      res.json({
        stores: filtered.map(s => mapStore(s)),
        total: filtered.length,
        page,
        totalPages: 1,
      });
      return;
    }

    res.json({
      stores: stores.map(s => mapStore(s)),
      total: Number(totalCount),
      page,
      totalPages: Math.ceil(Number(totalCount) / limit),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list stores" });
  }
});

function mapStore(s: any) {
  return {
    id: s.id, userId: s.userId, name: s.name, slug: s.slug,
    description: s.description, logoUrl: s.logoUrl, bannerUrl: s.bannerUrl,
    categoryId: s.categoryId, location: s.location, district: s.district,
    lat: s.lat, lng: s.lng, whatsapp: s.whatsapp, instagram: s.instagram,
    facebook: s.facebook, website: s.website, status: s.status,
    isFeatured: s.isFeatured, totalVisits: s.totalVisits,
    createdAt: s.createdAt, updatedAt: s.updatedAt,
    category: s.categoryId ? { id: s.categoryId, name: s.categoryName, slug: s.categorySlug, icon: s.categoryIcon } : null,
  };
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const existing = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "You already have a store" });
      return;
    }
    const { name, description, categoryId, location, district, lat, lng, whatsapp, instagram, facebook, website, logoUrl, logoPublicId, bannerUrl, bannerPublicId } = req.body;
    if (!name) {
      res.status(400).json({ error: "Bad Request", message: "name is required" });
      return;
    }
    const slug = await generateUniqueStoreSlug(name);
    const [store] = await db.insert(storesTable).values({
      userId, name, slug, description, categoryId, location, district, lat, lng,
      whatsapp, instagram, facebook, website, logoUrl, logoPublicId, bannerUrl, bannerPublicId,
      status: "pending",
    }).returning();
    // Only upgrade to vendor if user is a plain user (don't downgrade admins)
    const [currentUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (currentUser?.role === "user") {
      await db.update(usersTable).set({ role: "vendor" }).where(eq(usersTable.id, userId));
    }
    const [category] = categoryId ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, categoryId)).limit(1) : [];
    res.json({ ...store, category: category || null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create store" });
  }
});

router.get("/:slug", optionalAuth, async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }
    if (store.status !== "active" && store.userId !== userId && userRole !== "admin") {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }

    const [category] = store.categoryId
      ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, store.categoryId)).limit(1)
      : [];
    const galleryImages = await db.select().from(storeGalleryImagesTable).where(eq(storeGalleryImagesTable.storeId, store.id)).orderBy(storeGalleryImagesTable.sortOrder);
    const [{ count: reviewCount }] = await db.select({ count: count() }).from(reviewsTable).where(and(eq(reviewsTable.storeId, store.id), eq(reviewsTable.isVisible, true)));
    const [avgResult] = await db.select({ avg: sql<number>`AVG(${reviewsTable.rating})` }).from(reviewsTable).where(and(eq(reviewsTable.storeId, store.id), eq(reviewsTable.isVisible, true)));

    // Load products with images
    const rawProducts = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.storeId, store.id), eq(productsTable.status, "active")))
      .orderBy(asc(productsTable.sortOrder), asc(productsTable.id))
      .limit(30);

    const productIds = rawProducts.map(p => p.id);
    const allImages = productIds.length > 0
      ? await db.select().from(productImagesTable).where(inArray(productImagesTable.productId, productIds)).orderBy(productImagesTable.sortOrder)
      : [];

    const products = rawProducts.map(p => ({
      ...p,
      images: allImages.filter(img => img.productId === p.id),
    }));

    res.json({
      ...store,
      category: category || null,
      products,
      galleryImages,
      reviewCount: Number(reviewCount),
      averageRating: avgResult.avg ? Number(avgResult.avg) : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get store" });
  }
});

router.put("/:slug", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const slug = String(req.params.slug);
    const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }
    if (store.userId !== userId && userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Not your store" });
      return;
    }
    const { name, description, categoryId, location, district, lat, lng, whatsapp, instagram, facebook, website, logoUrl, logoPublicId, bannerUrl, bannerPublicId } = req.body;
    const [updated] = await db.update(storesTable)
      .set({ name, description, categoryId, location, district, lat, lng, whatsapp, instagram, facebook, website, logoUrl, logoPublicId, bannerUrl, bannerPublicId, updatedAt: new Date() })
      .where(eq(storesTable.id, store.id))
      .returning();
    const [category] = updated.categoryId ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated.categoryId)).limit(1) : [];
    res.json({ ...updated, category: category || null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update store" });
  }
});

router.post("/:slug/visit", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    await db.update(storesTable)
      .set({ totalVisits: sql`${storesTable.totalVisits} + 1` })
      .where(eq(storesTable.slug, slug));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to increment visit" });
  }
});

router.get("/:storeSlug/products", optionalAuth, async (req, res) => {
  try {
    const storeSlug = String(req.params.storeSlug);
    const { category } = req.query as Record<string, string>;
    const [store] = await db.select({ id: storesTable.id, userId: storesTable.userId, status: storesTable.status }).from(storesTable).where(eq(storesTable.slug, storeSlug)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    if (store.status !== "active" && store.userId !== userId && userRole !== "admin") {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }
    const conditions = [eq(productsTable.storeId, store.id), eq(productsTable.status, "active")];
    if (category) conditions.push(eq(categoriesTable.slug, category));
    const products = await db
      .select({
        id: productsTable.id, storeId: productsTable.storeId, categoryId: productsTable.categoryId,
        name: productsTable.name, slug: productsTable.slug, description: productsTable.description,
        price: productsTable.price, offerPrice: productsTable.offerPrice, stock: productsTable.stock,
        unit: productsTable.unit, status: productsTable.status, sortOrder: productsTable.sortOrder,
        createdAt: productsTable.createdAt,
        categoryName: categoriesTable.name, categorySlug: categoriesTable.slug, categoryIcon: categoriesTable.icon,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(and(...conditions))
      .orderBy(asc(productsTable.sortOrder), desc(productsTable.createdAt));

    const productIds = products.map(p => p.id);
    const images = productIds.length > 0
      ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} = ANY(${sql.raw(`ARRAY[${productIds.join(",")}]`)})`)
      : [];
    const imagesByProduct = images.reduce((acc, img) => {
      if (!acc[img.productId]) acc[img.productId] = [];
      acc[img.productId].push(img);
      return acc;
    }, {} as Record<number, typeof images>);

    res.json(products.map(p => ({
      ...p,
      category: p.categoryId ? { id: p.categoryId, name: p.categoryName, slug: p.categorySlug, icon: p.categoryIcon } : null,
      images: (imagesByProduct[p.id] || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get products" });
  }
});

router.get("/:storeSlug/reviews", async (req, res) => {
  try {
    const storeSlug = String(req.params.storeSlug);
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || "10"))));
    const offset = (page - 1) * limit;

    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.slug, storeSlug)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }

    const whereClause = and(eq(reviewsTable.storeId, store.id), eq(reviewsTable.isVisible, true));

    const [{ total }] = await db
      .select({ total: count() })
      .from(reviewsTable)
      .where(whereClause);

    const reviews = await db
      .select({
        id: reviewsTable.id, storeId: reviewsTable.storeId, userId: reviewsTable.userId,
        rating: reviewsTable.rating, comment: reviewsTable.comment, isVisible: reviewsTable.isVisible,
        createdAt: reviewsTable.createdAt,
        userName: usersTable.name, userAvatar: usersTable.avatarUrl,
        userRole: usersTable.role, userEmail: usersTable.email, userDistrict: usersTable.district,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(reviewsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      reviews: reviews.map(r => ({
        id: r.id, storeId: r.storeId, userId: r.userId, rating: r.rating, comment: r.comment,
        isVisible: r.isVisible, createdAt: r.createdAt,
        user: { id: r.userId, name: r.userName, email: r.userEmail, role: r.userRole, avatarUrl: r.userAvatar, district: r.userDistrict, isBlocked: false },
      })),
      pagination: {
        total: Number(total),
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get reviews" });
  }
});

router.post("/:storeSlug/reviews", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const storeSlug = String(req.params.storeSlug);
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Bad Request", message: "rating must be between 1 and 5" });
      return;
    }
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.slug, storeSlug)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Not Found", message: "Store not found" });
      return;
    }
    const [review] = await db.insert(reviewsTable).values({ storeId: store.id, userId, rating, comment, isVisible: true }).returning();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    res.json({ ...review, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, district: user.district, isBlocked: false } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create review" });
  }
});

export default router;
