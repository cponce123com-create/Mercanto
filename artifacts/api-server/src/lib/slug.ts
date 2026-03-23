import { db } from "@workspace/db";
import { storesTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateUniqueStoreSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
    if (existing.length === 0) return slug;
    slug = `${base}-${counter++}`;
  }
}

export async function generateUniqueProductSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
    if (existing.length === 0) return slug;
    slug = `${base}-${counter++}`;
  }
}
