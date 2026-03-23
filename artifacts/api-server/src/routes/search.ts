import { Router, type IRouter } from "express";
import { db, storesTable, productsTable, categoriesTable, productImagesTable } from "@workspace/db";
import { eq, and, ilike, or, asc, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { q, type, district } = req.query as Record<string, string>;
    if (!q || q.trim().length < 2) {
      res.json({ stores: [], products: [], query: q || "" });
      return;
    }

    const searchTerm = `%${q.trim()}%`;
    const stores: any[] = [];
    const products: any[] = [];

    if (!type || type === "all" || type === "stores") {
      const storeConditions = [
        eq(storesTable.status, "active"),
        or(ilike(storesTable.name, searchTerm), ilike(storesTable.description, searchTerm)),
      ];
      if (district) storeConditions.push(eq(storesTable.district, district));
      const foundStores = await db
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
        .where(and(...storeConditions))
        .orderBy(desc(storesTable.isFeatured), desc(storesTable.totalVisits))
        .limit(20);

      stores.push(...foundStores.map(s => ({
        id: s.id, userId: s.userId, name: s.name, slug: s.slug, description: s.description,
        logoUrl: s.logoUrl, bannerUrl: s.bannerUrl, categoryId: s.categoryId,
        location: s.location, district: s.district, lat: s.lat, lng: s.lng,
        whatsapp: s.whatsapp, instagram: s.instagram, facebook: s.facebook, website: s.website,
        status: s.status, isFeatured: s.isFeatured, totalVisits: s.totalVisits,
        createdAt: s.createdAt, updatedAt: s.updatedAt,
        category: s.categoryId ? { id: s.categoryId, name: s.categoryName, slug: s.categorySlug, icon: s.categoryIcon } : null,
      })));
    }

    if (!type || type === "all" || type === "products") {
      const foundProducts = await db
        .select({
          id: productsTable.id, storeId: productsTable.storeId, categoryId: productsTable.categoryId,
          name: productsTable.name, slug: productsTable.slug, description: productsTable.description,
          price: productsTable.price, offerPrice: productsTable.offerPrice, stock: productsTable.stock,
          unit: productsTable.unit, status: productsTable.status, sortOrder: productsTable.sortOrder,
          createdAt: productsTable.createdAt,
          categoryName: categoriesTable.name, categorySlug: categoriesTable.slug, categoryIcon: categoriesTable.icon,
          storeName: storesTable.name, storeSlug: storesTable.slug, storeDistrict: storesTable.district,
        })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .leftJoin(storesTable, eq(productsTable.storeId, storesTable.id))
        .where(and(
          eq(productsTable.status, "active"),
          eq(storesTable.status, "active"),
          or(ilike(productsTable.name, searchTerm), ilike(productsTable.description, searchTerm)),
        ))
        .orderBy(asc(productsTable.name))
        .limit(20);

      const productIds = foundProducts.map(p => p.id);
      const images = productIds.length > 0
        ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} = ANY(${sql.raw(`ARRAY[${productIds.join(",")}]`)})`)
        : [];
      const imagesByProduct = images.reduce((acc, img) => {
        if (!acc[img.productId]) acc[img.productId] = [];
        acc[img.productId].push(img);
        return acc;
      }, {} as Record<number, typeof images>);

      products.push(...foundProducts.map(p => ({
        id: p.id, storeId: p.storeId, name: p.name, slug: p.slug, description: p.description,
        price: p.price, offerPrice: p.offerPrice, stock: p.stock, unit: p.unit,
        status: p.status, sortOrder: p.sortOrder, createdAt: p.createdAt,
        category: p.categoryId ? { id: p.categoryId, name: p.categoryName, slug: p.categorySlug, icon: p.categoryIcon } : null,
        store: { name: p.storeName, slug: p.storeSlug, district: p.storeDistrict },
        images: (imagesByProduct[p.id] || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      })));
    }

    res.json({ stores, products, query: q });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Search failed" });
  }
});

export default router;
