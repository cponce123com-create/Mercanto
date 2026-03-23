import { Router, type IRouter } from "express";
import { db, storesTable, productsTable, productImagesTable, categoriesTable } from "@workspace/db";
import { eq, and, asc, desc, sql, inArray } from "drizzle-orm";
import { requireVendor, requireAuth } from "../lib/auth.js";
import { generateUniqueProductSlug } from "../lib/slug.js";

const router: IRouter = Router();

async function getProductWithImages(productId: number) {
  const [product] = await db
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
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!product) return null;

  const images = await db.select().from(productImagesTable).where(eq(productImagesTable.productId, productId)).orderBy(asc(productImagesTable.sortOrder));

  return {
    ...product,
    category: product.categoryId ? { id: product.categoryId, name: product.categoryName, slug: product.categorySlug, icon: product.categoryIcon } : null,
    images,
  };
}

router.get("/", requireVendor, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (!store) {
      res.json([]);
      return;
    }
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
      .where(eq(productsTable.storeId, store.id))
      .orderBy(asc(productsTable.sortOrder), desc(productsTable.createdAt));

    const productIds = products.map(p => p.id);
    const images = productIds.length > 0
      ? await db.select().from(productImagesTable).where(inArray(productImagesTable.productId, productIds))
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

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const product = await getProductWithImages(id);
    if (!product) {
      res.status(404).json({ error: "Not Found", message: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get product" });
  }
});

router.post("/", requireVendor, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (!store) {
      res.status(400).json({ error: "Bad Request", message: "No store found for this vendor" });
      return;
    }
    const [{ count: productCount }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productsTable)
      .where(eq(productsTable.storeId, store.id));
    const maxProducts = Number(process.env.MAX_PRODUCTS_PER_STORE) || 30;
    if (Number(productCount) >= maxProducts) {
      res.status(400).json({ error: "Bad Request", message: `Maximum ${maxProducts} products allowed` });
      return;
    }
    const { name, description, price, offerPrice, stock, unit, categoryId, status, images } = req.body;
    if (!name || !price) {
      res.status(400).json({ error: "Bad Request", message: "name and price are required" });
      return;
    }
    const slug = await generateUniqueProductSlug(name);
    const [product] = await db.insert(productsTable).values({
      storeId: store.id, name, slug, description, price: String(price),
      offerPrice: offerPrice ? String(offerPrice) : undefined,
      stock: stock || 0, unit: unit || "unidad",
      categoryId: categoryId || null, status: status || "active",
    }).returning();

    if (images && Array.isArray(images)) {
      const validImages = images.slice(0, 5);
      for (let i = 0; i < validImages.length; i++) {
        await db.insert(productImagesTable).values({
          productId: product.id, url: validImages[i].url,
          publicId: validImages[i].publicId, sortOrder: i,
        });
      }
    }

    const result = await getProductWithImages(product.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create product" });
  }
});

router.put("/:id", requireVendor, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = parseInt(String(req.params.id));
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (!store) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [product] = await db.select({ id: productsTable.id, storeId: productsTable.storeId }).from(productsTable).where(and(eq(productsTable.id, id), eq(productsTable.storeId, store.id))).limit(1);
    if (!product) {
      res.status(404).json({ error: "Not Found", message: "Product not found" });
      return;
    }
    const { name, description, price, offerPrice, stock, unit, categoryId, status, images } = req.body;
    await db.update(productsTable)
      .set({
        name, description, price: String(price), offerPrice: offerPrice ? String(offerPrice) : null,
        stock, unit, categoryId: categoryId || null, status, updatedAt: new Date(),
      })
      .where(eq(productsTable.id, id));

    if (images && Array.isArray(images)) {
      await db.delete(productImagesTable).where(eq(productImagesTable.productId, id));
      const validImages = images.slice(0, 5);
      for (let i = 0; i < validImages.length; i++) {
        await db.insert(productImagesTable).values({
          productId: id, url: validImages[i].url,
          publicId: validImages[i].publicId, sortOrder: i,
        });
      }
    }

    const result = await getProductWithImages(id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update product" });
  }
});

router.delete("/:id", requireVendor, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    const id = parseInt(String(req.params.id));
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (!store && userRole !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(productImagesTable).where(eq(productImagesTable.productId, id));
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete product" });
  }
});

router.put("/:id/toggle", requireVendor, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const id = parseInt(String(req.params.id));
    const [store] = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.userId, userId)).limit(1);
    if (!store) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [product] = await db.select().from(productsTable).where(and(eq(productsTable.id, id), eq(productsTable.storeId, store.id))).limit(1);
    if (!product) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    const newStatus = product.status === "active" ? "inactive" : "active";
    await db.update(productsTable).set({ status: newStatus, updatedAt: new Date() }).where(eq(productsTable.id, id));
    const result = await getProductWithImages(id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to toggle product" });
  }
});

export default router;
