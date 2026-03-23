import { db, usersTable, categoriesTable, storesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const categories = [
  { name: "Frutas y Verduras", slug: "frutas-verduras", icon: "🍎", sortOrder: 1 },
  { name: "Café y Cacao", slug: "cafe-cacao", icon: "☕", sortOrder: 2 },
  { name: "Miel y Apicultura", slug: "miel-apicultura", icon: "🍯", sortOrder: 3 },
  { name: "Plantas y Hierbas", slug: "plantas-hierbas", icon: "🌿", sortOrder: 4 },
  { name: "Carnes y Pescados", slug: "carnes-pescados", icon: "🥩", sortOrder: 5 },
  { name: "Panadería y Pasteles", slug: "panaderia-pasteles", icon: "🥐", sortOrder: 6 },
  { name: "Abarrotes y Bodega", slug: "abarrotes-bodega", icon: "🛒", sortOrder: 7 },
  { name: "Bebidas y Jugos", slug: "bebidas-jugos", icon: "🧃", sortOrder: 8 },
  { name: "Ropa y Calzado", slug: "ropa-calzado", icon: "👗", sortOrder: 9 },
  { name: "Artesanía", slug: "artesania", icon: "🧶", sortOrder: 10 },
  { name: "Ferretería y Construcción", slug: "ferreteria-construccion", icon: "🔧", sortOrder: 11 },
  { name: "Farmacia y Salud", slug: "farmacia-salud", icon: "💊", sortOrder: 12 },
  { name: "Belleza y Cuidado Personal", slug: "belleza-cuidado", icon: "💄", sortOrder: 13 },
  { name: "Electrónica y Tecnología", slug: "electronica-tecnologia", icon: "📱", sortOrder: 14 },
  { name: "Hogar y Muebles", slug: "hogar-muebles", icon: "🏠", sortOrder: 15 },
  { name: "Mascotas", slug: "mascotas", icon: "🐾", sortOrder: 16 },
  { name: "Transporte y Movilidad", slug: "transporte-movilidad", icon: "🚐", sortOrder: 17 },
  { name: "Servicios Técnicos", slug: "servicios-tecnicos", icon: "🛠️", sortOrder: 18 },
  { name: "Educación y Cursos", slug: "educacion-cursos", icon: "📚", sortOrder: 19 },
  { name: "Turismo y Hospedaje", slug: "turismo-hospedaje", icon: "🏕️", sortOrder: 20 },
  { name: "Agricultura e Insumos", slug: "agricultura-insumos", icon: "🌾", sortOrder: 21 },
  { name: "Otros", slug: "otros", icon: "📦", sortOrder: 22 },
];

const sampleStores = [
  { name: "Cafetal San Ramón", district: "San Ramón", lat: "-11.1297", lng: "-75.3500", cat: "cafe-cacao", whatsapp: "51900000001", description: "Café de altura directo del productor. Granos seleccionados de las alturas de Chanchamayo." },
  { name: "Frutas del Valle", district: "San Ramón", lat: "-11.1280", lng: "-75.3480", cat: "frutas-verduras", whatsapp: "51900000002", description: "Las mejores frutas tropicales: naranja, piña, maracuyá, plátano y más." },
  { name: "Miel Pura Selva", district: "La Merced", lat: "-11.0567", lng: "-75.3247", cat: "miel-apicultura", whatsapp: "51900000003", description: "Miel 100% natural de abejas criadas en el bosque de Chanchamayo." },
  { name: "Panadería La Merceña", district: "La Merced", lat: "-11.0550", lng: "-75.3230", cat: "panaderia-pasteles", whatsapp: "51900000004", description: "Pan artesanal, tortas y pasteles para toda ocasión." },
  { name: "Artesanías Asháninka", district: "Pichanaqui", lat: "-10.9333", lng: "-75.0167", cat: "artesania", whatsapp: "51900000005", description: "Artesanías tradicionales Asháninka: cushmas, collares, bolsas tejidas." },
  { name: "Tienda Verde Orgánica", district: "Pichanaqui", lat: "-10.9350", lng: "-75.0150", cat: "agricultura-insumos", whatsapp: "51900000006", description: "Insumos orgánicos para agricultura, semillas y herramientas de campo." },
  { name: "Lodge El Paraíso", district: "Perené", lat: "-10.9500", lng: "-75.2833", cat: "turismo-hospedaje", whatsapp: "51900000007", description: "Hospedaje campestre, tours a la selva y pesca deportiva en el río Perené." },
  { name: "Bodega El Compadre", district: "San Ramón", lat: "-11.1310", lng: "-75.3515", cat: "abarrotes-bodega", whatsapp: "51900000008", description: "Abarrotes, víveres y productos de primera necesidad a buen precio." },
];

async function seed() {
  console.log("🌱 Starting seed...");

  const adminPasswordHash = await bcrypt.hash("Admin2024!", 10);
  const existingAdmin = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, "admin@mercanto.pe")).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(usersTable).values({
      name: "Administrador Mercanto",
      email: "admin@mercanto.pe",
      passwordHash: adminPasswordHash,
      role: "admin",
      district: "San Ramón",
    });
    console.log("✅ Admin user created");
  } else {
    console.log("ℹ️ Admin user already exists");
  }

  for (const cat of categories) {
    const existing = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, cat.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(categoriesTable).values({ ...cat, isActive: true });
    }
  }
  console.log("✅ Categories seeded");

  const allCats = await db.select().from(categoriesTable);
  const catBySlug = Object.fromEntries(allCats.map(c => [c.slug, c]));

  const vendorPasswordHash = await bcrypt.hash("Vendor2024!", 10);
  for (const store of sampleStores) {
    const existing = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.name, store.name)).limit(1);
    if (existing.length > 0) continue;

    const slug = store.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const email = `${slug.replace(/-/g, "")}@mercanto.pe`;
    let user = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0];
    if (!user) {
      [user] = await db.insert(usersTable).values({ name: store.name, email, passwordHash: vendorPasswordHash, role: "vendor", district: store.district }).returning();
    }

    await db.insert(storesTable).values({
      userId: user.id,
      name: store.name,
      slug,
      description: store.description,
      categoryId: catBySlug[store.cat]?.id || null,
      district: store.district,
      lat: store.lat,
      lng: store.lng,
      whatsapp: store.whatsapp,
      status: "active",
      isFeatured: store.name.includes("Cafetal") || store.name.includes("Artesanías"),
    });
  }
  console.log("✅ Sample stores seeded");
  console.log("🎉 Seed completed!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
