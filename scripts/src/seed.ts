import { db, usersTable, categoriesTable, storesTable } from "@workspace/db";
import { productsTable, productImagesTable } from "@workspace/db/schema";
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
  { name: "Cafetal San Ramón", district: "San Ramón", lat: "-11.1297", lng: "-75.3500", cat: "cafe-cacao", whatsapp: "51900000001", description: "Café de altura directo del productor. Granos seleccionados de las alturas de Chanchamayo.", featured: true },
  { name: "Frutas del Valle", district: "San Ramón", lat: "-11.1280", lng: "-75.3480", cat: "frutas-verduras", whatsapp: "51900000002", description: "Las mejores frutas tropicales: naranja, piña, maracuyá, plátano y más.", featured: true },
  { name: "Miel Pura Selva", district: "La Merced", lat: "-11.0567", lng: "-75.3247", cat: "miel-apicultura", whatsapp: "51900000003", description: "Miel 100% natural de abejas criadas en el bosque de Chanchamayo.", featured: false },
  { name: "Panadería La Merceña", district: "La Merced", lat: "-11.0550", lng: "-75.3230", cat: "panaderia-pasteles", whatsapp: "51900000004", description: "Pan artesanal, tortas y pasteles para toda ocasión.", featured: true },
  { name: "Artesanías Asháninka", district: "Pichanaqui", lat: "-10.9333", lng: "-75.0167", cat: "artesania", whatsapp: "51900000005", description: "Artesanías tradicionales Asháninka: cushmas, collares, bolsas tejidas.", featured: true },
  { name: "Tienda Verde Orgánica", district: "Pichanaqui", lat: "-10.9350", lng: "-75.0150", cat: "agricultura-insumos", whatsapp: "51900000006", description: "Insumos orgánicos para agricultura, semillas y herramientas de campo.", featured: false },
  { name: "Lodge El Paraíso", district: "Perené", lat: "-10.9500", lng: "-75.2833", cat: "turismo-hospedaje", whatsapp: "51900000007", description: "Hospedaje campestre, tours a la selva y pesca deportiva en el río Perené.", featured: false },
  { name: "Bodega El Compadre", district: "San Ramón", lat: "-11.1310", lng: "-75.3515", cat: "abarrotes-bodega", whatsapp: "51900000008", description: "Abarrotes, víveres y productos de primera necesidad a buen precio.", featured: false },
];

const OFFER_IMAGES: Record<string, string> = {
  "Pack de Huevos Frescos": "https://images.unsplash.com/photo-1587334274328-64186a80aeee?w=400&q=80&auto=format&fit=crop",
  "Zapatos Deportivos": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&auto=format&fit=crop",
  "Perfume Elegance": "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80&auto=format&fit=crop",
  "Auriculares Inalámbricos": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&auto=format&fit=crop",
  "Café Premium Molido": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80&auto=format&fit=crop",
  "Miel de Abeja Natural": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80&auto=format&fit=crop",
  "Piña Tropical Fresca": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80&auto=format&fit=crop",
  "Pan Artesanal de Yema": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&auto=format&fit=crop",
};

async function seed() {
  console.log("🌱 Starting seed...");

  /* Admin */
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
    console.log("ℹ️  Admin user already exists");
  }

  /* Categories */
  for (const cat of categories) {
    const existing = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, cat.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(categoriesTable).values({ ...cat, isActive: true });
    }
  }
  console.log("✅ Categories seeded");

  const allCats = await db.select().from(categoriesTable);
  const catBySlug = Object.fromEntries(allCats.map(c => [c.slug, c]));

  /* Stores */
  const vendorPasswordHash = await bcrypt.hash("Vendor2024!", 10);
  const storeIds: Record<string, number> = {};

  for (const store of sampleStores) {
    const existing = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.name, store.name)).limit(1);
    if (existing.length > 0) {
      storeIds[store.name] = existing[0].id;
      continue;
    }

    const slug = store.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const email = `${slug.replace(/-/g, "").slice(0, 30)}@mercanto.pe`;
    let user = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0];
    if (!user) {
      [user] = await db.insert(usersTable).values({ name: store.name, email, passwordHash: vendorPasswordHash, role: "vendor", district: store.district }).returning();
    }

    const [inserted] = await db.insert(storesTable).values({
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
      isFeatured: store.featured,
    }).returning();
    storeIds[store.name] = inserted.id;
  }
  console.log("✅ Sample stores seeded");

  /* Re-fetch store IDs */
  const allStores = await db.select().from(storesTable);
  const storeByName = Object.fromEntries(allStores.map(s => [s.name, s]));

  /* Products with offer prices */
  const sampleProducts = [
    {
      storeName: "Bodega El Compadre",
      catSlug: "abarrotes-bodega",
      name: "Pack de Huevos Frescos",
      slug: "pack-huevos-frescos",
      description: "Bandeja de 30 huevos frescos de campo, grandes y nutritivos.",
      price: "18.00",
      offerPrice: "12.00",
    },
    {
      storeName: "Artesanías Asháninka",
      catSlug: "ropa-calzado",
      name: "Zapatos Deportivos",
      slug: "zapatos-deportivos-ashaninka",
      description: "Zapatos deportivos cómodos y duraderos, tallas disponibles.",
      price: "120.00",
      offerPrice: "79.90",
    },
    {
      storeName: "Artesanías Asháninka",
      catSlug: "belleza-cuidado",
      name: "Perfume Elegance",
      slug: "perfume-elegance",
      description: "Fragancia floral duradera, presentación 50ml.",
      price: "75.00",
      offerPrice: "45.00",
    },
    {
      storeName: "Tienda Verde Orgánica",
      catSlug: "electronica-tecnologia",
      name: "Auriculares Inalámbricos",
      slug: "auriculares-inalambricos",
      description: "Auriculares bluetooth con cancelación de ruido y 20h de batería.",
      price: "150.00",
      offerPrice: "95.00",
    },
    {
      storeName: "Cafetal San Ramón",
      catSlug: "cafe-cacao",
      name: "Café Premium Molido",
      slug: "cafe-premium-molido",
      description: "Café de altura 100% arábica, tostado medio, bolsa 500g.",
      price: "38.00",
      offerPrice: "25.00",
    },
    {
      storeName: "Miel Pura Selva",
      catSlug: "miel-apicultura",
      name: "Miel de Abeja Natural",
      slug: "miel-abeja-natural",
      description: "Miel pura de flor de café y selva, frasco 1kg.",
      price: "45.00",
      offerPrice: "32.00",
    },
    {
      storeName: "Frutas del Valle",
      catSlug: "frutas-verduras",
      name: "Piña Tropical Fresca",
      slug: "pina-tropical-fresca",
      description: "Piñas dulces de temporada, cosechadas en Chanchamayo.",
      price: "10.00",
      offerPrice: "6.50",
    },
    {
      storeName: "Panadería La Merceña",
      catSlug: "panaderia-pasteles",
      name: "Pan Artesanal de Yema",
      slug: "pan-artesanal-yema",
      description: "Pan de yema recién horneado, bolsa de 12 unidades.",
      price: "12.00",
      offerPrice: "8.00",
    },
  ];

  for (const p of sampleProducts) {
    const existing = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, p.slug)).limit(1);
    if (existing.length > 0) continue;

    const store = storeByName[p.storeName];
    if (!store) { console.log(`⚠️  Store not found: ${p.storeName}`); continue; }

    const catId = catBySlug[p.catSlug]?.id || null;

    const [prod] = await db.insert(productsTable).values({
      storeId: store.id,
      categoryId: catId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      offerPrice: p.offerPrice,
      stock: 50,
      unit: "unidad",
      status: "active",
      sortOrder: 0,
    }).returning();

    const imgUrl = OFFER_IMAGES[p.name];
    if (imgUrl) {
      await db.insert(productImagesTable).values({
        productId: prod.id,
        url: imgUrl,
        publicId: `seed/${p.slug}`,
        sortOrder: 0,
      });
    }
  }
  console.log("✅ Sample products with offers seeded");
  console.log("🎉 Seed completed!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
