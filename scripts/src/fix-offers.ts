/**
 * Agrega precios de oferta al primer producto de cada tienda
 * offerPrice = price * 0.75 (25% descuento)
 */
import { db, productsTable, storesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

async function main() {
  // Get all stores
  const stores = await db.select({ id: storesTable.id, name: storesTable.name })
    .from(storesTable)
    .where(eq(storesTable.status, "active"));

  console.log(`📦 Configurando ofertas para ${stores.length} tiendas...`);
  let updated = 0;

  for (const store of stores) {
    // Get first 2 products of each store (sorted by id)
    const products = await db.select({ id: productsTable.id, price: productsTable.price })
      .from(productsTable)
      .where(eq(productsTable.storeId, store.id))
      .limit(2);

    if (products.length === 0) continue;

    // First product: 25% discount
    const p1 = products[0];
    const offerPrice1 = (parseFloat(p1.price) * 0.75).toFixed(2);
    await db.update(productsTable)
      .set({ isOffer: true, offerPrice: offerPrice1 })
      .where(eq(productsTable.id, p1.id));
    updated++;

    // Second product (if exists): 15% discount
    if (products.length > 1) {
      const p2 = products[1];
      const offerPrice2 = (parseFloat(p2.price) * 0.85).toFixed(2);
      await db.update(productsTable)
        .set({ isOffer: true, offerPrice: offerPrice2 })
        .where(eq(productsTable.id, p2.id));
      updated++;
    }
  }

  console.log(`✅ ${updated} productos actualizados con precios de oferta.`);
  process.exit(0);
}

main().catch(e => { console.error("❌ Error:", e); process.exit(1); });
