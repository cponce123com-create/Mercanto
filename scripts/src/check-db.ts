import { db, usersTable, categoriesTable, storesTable, productsTable, reviewsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function check() {
  const [u] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [c] = await db.select({ count: sql<number>`count(*)` }).from(categoriesTable);
  const [s] = await db.select({ count: sql<number>`count(*)` }).from(storesTable);
  const [p] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  const [r] = await db.select({ count: sql<number>`count(*)` }).from(reviewsTable);
  console.log(`Users: ${u.count}, Categories: ${c.count}, Stores: ${s.count}, Products: ${p.count}, Reviews: ${r.count}`);
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
