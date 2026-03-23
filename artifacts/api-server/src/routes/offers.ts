import { Router, type IRouter } from "express";
import { db, storesTable, productsTable, productImagesTable, categoriesTable } from "@workspace/db";
import { eq, and, isNotNull, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { district, limit: limitStr } = req.query as Record<string, string>;
    const limit = Math.min(20, parseInt(limitStr || "8"));

    const conditions = [
      eq(productsTable.status, "active"),
      eq(storesTable.status, "active"),
      isNotNull(productsTable.offerPrice),
    ];
    if (district) conditions.push(eq(storesTable.district, district));

    const products = await db
      .select({
        id: productsTable.id,
        storeId: productsTable.storeId,
        storeSlug: storesTable.slug,
        storeName: storesTable.name,
        storeDistrict: storesTable.district,
        categoryId: productsTable.categoryId,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        price: productsTable.price,
        offerPrice: productsTable.offerPrice,
        stock: productsTable.stock,
        unit: productsTable.unit,
        status: productsTable.status,
        createdAt: productsTable.createdAt,
        categoryName: categoriesTable.name,
        categorySlug: categoriesTable.slug,
        categoryIcon: categoriesTable.icon,
      })
      .from(productsTable)
      .innerJoin(storesTable, eq(productsTable.storeId, storesTable.id))
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(and(...conditions))
      .orderBy(desc(productsTable.createdAt))
      .limit(limit);

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
      id: p.id,
      storeId: p.storeId,
      storeSlug: p.storeSlug,
      storeName: p.storeName,
      storeDistrict: p.storeDistrict,
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      offerPrice: p.offerPrice,
      stock: p.stock,
      unit: p.unit,
      status: p.status,
      createdAt: p.createdAt,
      category: p.categoryId ? { id: p.categoryId, name: p.categoryName, slug: p.categorySlug, icon: p.categoryIcon } : null,
      images: (imagesByProduct[p.id] || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get offers" });
  }
});

export default router;
