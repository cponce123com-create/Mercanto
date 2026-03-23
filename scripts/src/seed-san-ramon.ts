/**
 * Seed San Ramón: 20 categorías, 20 usuarios, 30 tiendas en San Ramón, 10 productos por tienda
 * Limpia datos previos (excepto admin) antes de insertar.
 */
import {
  db, usersTable, categoriesTable, storesTable, productsTable,
  productImagesTable, reviewsTable,
} from "@workspace/db";
import { eq, ne, sql, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function jitter(base: number, range = 0.003): string {
  return (base + (Math.random() - 0.5) * 2 * range).toFixed(6);
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Categories (20) ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Frutas y Verduras",           slug: "frutas-verduras",         icon: "🍎", sortOrder: 1 },
  { name: "Café y Cacao",                slug: "cafe-cacao",              icon: "☕", sortOrder: 2 },
  { name: "Miel y Apicultura",           slug: "miel-apicultura",         icon: "🍯", sortOrder: 3 },
  { name: "Plantas y Hierbas",           slug: "plantas-hierbas",         icon: "🌿", sortOrder: 4 },
  { name: "Carnes y Pescados",           slug: "carnes-pescados",         icon: "🥩", sortOrder: 5 },
  { name: "Panadería y Pasteles",        slug: "panaderia-pasteles",      icon: "🥐", sortOrder: 6 },
  { name: "Abarrotes y Bodega",          slug: "abarrotes-bodega",        icon: "🛒", sortOrder: 7 },
  { name: "Bebidas y Jugos",             slug: "bebidas-jugos",           icon: "🧃", sortOrder: 8 },
  { name: "Ropa y Calzado",              slug: "ropa-calzado",            icon: "👗", sortOrder: 9 },
  { name: "Artesanía",                   slug: "artesania",               icon: "🧶", sortOrder: 10 },
  { name: "Ferretería y Construcción",   slug: "ferreteria-construccion", icon: "🔧", sortOrder: 11 },
  { name: "Farmacia y Salud",            slug: "farmacia-salud",          icon: "💊", sortOrder: 12 },
  { name: "Belleza y Cuidado Personal",  slug: "belleza-cuidado",         icon: "💄", sortOrder: 13 },
  { name: "Electrónica y Tecnología",    slug: "electronica-tecnologia",  icon: "📱", sortOrder: 14 },
  { name: "Hogar y Muebles",             slug: "hogar-muebles",           icon: "🏠", sortOrder: 15 },
  { name: "Mascotas",                    slug: "mascotas",                icon: "🐾", sortOrder: 16 },
  { name: "Agricultura e Insumos",       slug: "agricultura-insumos",     icon: "🌾", sortOrder: 17 },
  { name: "Turismo y Hospedaje",         slug: "turismo-hospedaje",       icon: "🏕️", sortOrder: 18 },
  { name: "Educación y Librería",        slug: "educacion-libreria",      icon: "📚", sortOrder: 19 },
  { name: "Servicios Técnicos",          slug: "servicios-tecnicos",      icon: "🛠️", sortOrder: 20 },
];

// ─── Users (20) ───────────────────────────────────────────────────────────────

const USERS_DATA = [
  { name: "María Quispe Huamán",     email: "maria.quispe@gmail.com",     phone: "51961100001", district: "San Ramón", role: "user"   },
  { name: "Carlos Flores Mamani",    email: "carlos.flores@gmail.com",    phone: "51961100002", district: "San Ramón", role: "vendor" },
  { name: "Rosa López Condori",      email: "rosa.lopez@gmail.com",       phone: "51961100003", district: "San Ramón", role: "vendor" },
  { name: "Juan Pérez García",       email: "juan.perez@gmail.com",       phone: "51961100004", district: "San Ramón", role: "user"   },
  { name: "Ana Torres Huanca",       email: "ana.torres@gmail.com",       phone: "51961100005", district: "San Ramón", role: "user"   },
  { name: "Luis Mendoza Ríos",       email: "luis.mendoza@gmail.com",     phone: "51961100006", district: "San Ramón", role: "vendor" },
  { name: "Carmen Soto Vargas",      email: "carmen.soto@gmail.com",      phone: "51961100007", district: "San Ramón", role: "user"   },
  { name: "Pedro Chávez Ramos",      email: "pedro.chavez@gmail.com",     phone: "51961100008", district: "San Ramón", role: "vendor" },
  { name: "Elena Díaz Cruz",         email: "elena.diaz@gmail.com",       phone: "51961100009", district: "San Ramón", role: "user"   },
  { name: "Martín Villanueva Salas", email: "martin.villanueva@gmail.com",phone: "51961100010", district: "San Ramón", role: "vendor" },
  { name: "Isabel Rojas Paredes",    email: "isabel.rojas@gmail.com",     phone: "51961100011", district: "San Ramón", role: "user"   },
  { name: "Julio Huanca Quispe",     email: "julio.huanca@gmail.com",     phone: "51961100012", district: "San Ramón", role: "vendor" },
  { name: "Sofía García Torres",     email: "sofia.garcia@gmail.com",     phone: "51961100013", district: "San Ramón", role: "user"   },
  { name: "Roberto Mamani Flores",   email: "roberto.mamani@gmail.com",   phone: "51961100014", district: "San Ramón", role: "vendor" },
  { name: "Patricia Ramos López",    email: "patricia.ramos@gmail.com",   phone: "51961100015", district: "San Ramón", role: "user"   },
  { name: "Alejandro Condori",       email: "alejandro.condori@gmail.com",phone: "51961100016", district: "San Ramón", role: "vendor" },
  { name: "Lucía Vargas Mendoza",    email: "lucia.vargas@gmail.com",     phone: "51961100017", district: "San Ramón", role: "user"   },
  { name: "Daniel Cruz Soto",        email: "daniel.cruz@gmail.com",      phone: "51961100018", district: "San Ramón", role: "user"   },
  { name: "Teresa Salas Chávez",     email: "teresa.salas@gmail.com",     phone: "51961100019", district: "San Ramón", role: "user"   },
  { name: "Miguel Paredes Rojas",    email: "miguel.paredes@gmail.com",   phone: "51961100020", district: "San Ramón", role: "vendor" },
];

// ─── Unsplash photos by category ──────────────────────────────────────────────

const PHOTOS: Record<string, string[]> = {
  "frutas-verduras":        ["photo-1610832958506-aa56368176cf","photo-1550258987-190a2d41a8ba","photo-1490474418585-ba9bad8fd0ea","photo-1547514701-42782101795e","photo-1512621776951-a57141f2eefd"],
  "cafe-cacao":             ["photo-1447933601403-0c6688de566a","photo-1559056199-641a0ac8b55e","photo-1514432324607-a09d9b4aefdd","photo-1495474472287-4d71bcdd2085"],
  "miel-apicultura":        ["photo-1558642452-9d2a7deb7f62","photo-1587049352846-4a222e784d38","photo-1560472354-b33ff0c44a43"],
  "plantas-hierbas":        ["photo-1416879595882-3373a0480b5b","photo-1509316785289-025f5b846b35","photo-1544947950-fa07a98d237f"],
  "carnes-pescados":        ["photo-1607623814075-e51df1bdc82f","photo-1544551763-46a013bb70d5","photo-1559739733-beb5abd942ec","photo-1529692236671-f1f6cf9683ba"],
  "panaderia-pasteles":     ["photo-1509440159596-0249088772ff","photo-1519915028121-7d3463d5b1ff","photo-1501443762994-82bd5dace89a","photo-1558401391-7899b4bd5bbf"],
  "abarrotes-bodega":       ["photo-1604719312566-8912e9227c6a","photo-1534723452862-4c874986f0d8","photo-1542838132-92c53300491e"],
  "bebidas-jugos":          ["photo-1534353436294-0dbd4bdac845","photo-1473058664319-1c5a6316d4f1","photo-1622597467836-f3bac9e7d3ad"],
  "ropa-calzado":           ["photo-1523381210434-271e8be1f52b","photo-1542291026-7eec264c27ff","photo-1558618666-fcd25c85cd64","photo-1562157873-818bc0726f68"],
  "artesania":              ["photo-1581783898377-1c85bf937427","photo-1567225557594-88887e4e1f7a","photo-1602173574767-37ac01994b2a"],
  "ferreteria-construccion":["photo-1504148455328-c376907d081c","photo-1558618047-3c8c76ca0d1d","photo-1416669609937-190e3bb17c7e"],
  "farmacia-salud":         ["photo-1584308666744-24d5c474f2ae","photo-1559757175-5700dde675bc","photo-1471864190281-a93a3070b6de"],
  "belleza-cuidado":        ["photo-1541643600914-78b084683702","photo-1571781926291-c477ebfd024b","photo-1487412720507-e7ab37603c6f"],
  "electronica-tecnologia": ["photo-1498049794561-7780e7231661","photo-1505740420928-5e560c06d30e","photo-1518770660439-4636190af475"],
  "hogar-muebles":          ["photo-1555041469-a586c61ea9bc","photo-1556909114-f6e7ad7d3136","photo-1484101403633-562f891dc89a"],
  "mascotas":               ["photo-1587300003388-59208cc962cb","photo-1544568100-847a188d9bca","photo-1450778869180-41d0601e046e"],
  "agricultura-insumos":    ["photo-1500595046743-cd271d694d30","photo-1416879595882-3373a0480b5b","photo-1530836369250-ef72a3f5cda8"],
  "turismo-hospedaje":      ["photo-1469474968028-56623f02e42e","photo-1533587851505-d119e13c8f76","photo-1476514525535-07fb3b4ae5f1"],
  "educacion-libreria":     ["photo-1481627834876-b7833e8f5570","photo-1524995997946-a1c2e315a42f","photo-1456513080510-7bf3a84b82f8"],
  "servicios-tecnicos":     ["photo-1504148455328-c376907d081c","photo-1581092918056-0c4c3acd3789","photo-1498050108023-c5249f4df085"],
};

function getPhoto(catSlug: string, idx: number): string {
  const photos = PHOTOS[catSlug] || PHOTOS["abarrotes-bodega"];
  return `https://images.unsplash.com/${photos[idx % photos.length]}?w=400&q=80&auto=format&fit=crop`;
}

// ─── 30 Stores in San Ramón ───────────────────────────────────────────────────

interface StoreData {
  name: string; catSlug: string; location: string; whatsapp: string;
  description: string; featured: boolean;
}

const STORES: StoreData[] = [
  {
    name: "Frutería La Cosecha",
    catSlug: "frutas-verduras",
    location: "Jr. Progreso 145, San Ramón, Chanchamayo",
    whatsapp: "51964200101",
    description: "La mejor frutería de San Ramón con naranjas, piñas, maracuyás y plátanos directamente de las chacras de Chanchamayo. Abrimos de lunes a sábado desde las 6am. Delivery dentro del distrito sin costo.",
    featured: true,
  },
  {
    name: "Café Aroma Selva",
    catSlug: "cafe-cacao",
    location: "Av. Mariscal Castilla 320, San Ramón, Chanchamayo",
    whatsapp: "51964200102",
    description: "Cafetería especializada en café de altura de Chanchamayo, tostado artesanal en el local. Nuestros granos se seleccionan a 1800 msnm. También ofrecemos cacao orgánico y chocolate artesanal.",
    featured: true,
  },
  {
    name: "Carnicería El Toro",
    catSlug: "carnes-pescados",
    location: "Mercado Municipal Stand 22, San Ramón, Chanchamayo",
    whatsapp: "51964200103",
    description: "Carnes frescas de res, cerdo y pollo traídas directamente de los criaderos locales de Chanchamayo. 30 años de experiencia garantizan la calidad. Abrimos de lunes a sábado desde las 5am.",
    featured: true,
  },
  {
    name: "Panadería El Pan del Día",
    catSlug: "panaderia-pasteles",
    location: "Jr. Chanchamayo 88, San Ramón, Chanchamayo",
    whatsapp: "51964200104",
    description: "Panadería familiar con 20 años haciendo el pan más esponjoso de San Ramón. Elaboramos panes artesanales, tortas decoradas y pasteles con productos de la zona. Pedidos para eventos con anticipación.",
    featured: true,
  },
  {
    name: "Bodega El Ahorro",
    catSlug: "abarrotes-bodega",
    location: "Av. Tarma 412, San Ramón, Chanchamayo",
    whatsapp: "51964200105",
    description: "La bodega más completa de San Ramón con los mejores precios. Arroz, azúcar, aceites, conservas y productos de limpieza al por menor y mayor. Atendemos de 6am a 10pm todos los días.",
    featured: false,
  },
  {
    name: "Artesanías Asháninka",
    catSlug: "artesania",
    location: "Jr. Junín 78, San Ramón, Chanchamayo",
    whatsapp: "51964200106",
    description: "Artesanías auténticas de las comunidades Asháninka y Yánesha. Cada pieza está elaborada a mano por artesanos locales con materiales naturales de la amazonia. Exportamos a todo el Perú.",
    featured: true,
  },
  {
    name: "Farmacia Vida Sana",
    catSlug: "farmacia-salud",
    location: "Av. Principal 256, San Ramón, Chanchamayo",
    whatsapp: "51964200107",
    description: "Farmacia y botica con medicamentos genéricos y de marca a precios justos. Químico farmacéutico disponible para orientación gratuita. Delivery de medicamentos dentro de San Ramón sin costo.",
    featured: false,
  },
  {
    name: "Ferretería El Constructor",
    catSlug: "ferreteria-construccion",
    location: "Av. 2 de Mayo 512, San Ramón, Chanchamayo",
    whatsapp: "51964200108",
    description: "Ferretería completa con materiales de construcción, herramientas eléctricas y plomería. Proveemos a maestros de obra y particulares. Asesoría técnica gratuita y servicio a domicilio.",
    featured: false,
  },
  {
    name: "Boutique Moda Selva",
    catSlug: "ropa-calzado",
    location: "Jr. Cusco 190, San Ramón, Chanchamayo",
    whatsapp: "51964200109",
    description: "Tienda de moda con las últimas tendencias en ropa casual y calzado para toda la familia. Trabajamos con marcas nacionales e importadas a precios accesibles. Renovamos stock semanalmente.",
    featured: false,
  },
  {
    name: "TechZone San Ramón",
    catSlug: "electronica-tecnologia",
    location: "Jr. Lima 190, San Ramón, Chanchamayo",
    whatsapp: "51964200110",
    description: "Tienda de electrónica con accesorios para celulares, laptops y consolas. Importamos directamente para ofrecer los mejores precios de Chanchamayo. Servicio técnico en garantía.",
    featured: false,
  },
  {
    name: "Hierbasanta Medicinales",
    catSlug: "plantas-hierbas",
    location: "Jr. Bolívar 45, San Ramón, Chanchamayo",
    whatsapp: "51964200111",
    description: "Especialistas en plantas medicinales de la amazonía peruana sin pesticidas. Uña de gato, chanca piedra, sangre de grado y otras plantas curativas milenarias. Vendemos frescas, secas y en extractos.",
    featured: false,
  },
  {
    name: "Apiario Miel del Valle",
    catSlug: "miel-apicultura",
    location: "Jr. Arequipa 30, San Ramón, Chanchamayo",
    whatsapp: "51964200112",
    description: "Productores de miel 100% pura de abeja en los valles de Chanchamayo. Nuestros apiarios están en zonas libres de contaminación rodeadas de bosques nativos. Miel cruda, propóleo y jalea real.",
    featured: false,
  },
  {
    name: "Jugos Tropicales San Ramón",
    catSlug: "bebidas-jugos",
    location: "Av. Mariscal Miller 200, San Ramón, Chanchamayo",
    whatsapp: "51964200113",
    description: "Jugos naturales de frutas tropicales procesados al momento. Maracuyá, cocona, guanábana, piña y combinaciones especiales de la selva central. También chicha de jora y masato artesanal.",
    featured: false,
  },
  {
    name: "Hogar y Decoración Chanchamayo",
    catSlug: "hogar-muebles",
    location: "Jr. Grau 115, San Ramón, Chanchamayo",
    whatsapp: "51964200114",
    description: "Muebles y decoración para el hogar con maderas locales de alta calidad. Sillas, mesas, estantes y artículos decorativos elaborados por carpinteros artesanos de la zona.",
    featured: false,
  },
  {
    name: "PetShop Amigos Fieles",
    catSlug: "mascotas",
    location: "Jr. Puno 75, San Ramón, Chanchamayo",
    whatsapp: "51964200115",
    description: "Todo lo que tu mascota necesita en San Ramón. Alimentos, accesorios, juguetes y productos de higiene para perros, gatos y pequeños animales. Atención veterinaria los fines de semana.",
    featured: false,
  },
  {
    name: "Agencia Turismo Selva Adventure",
    catSlug: "turismo-hospedaje",
    location: "Av. Mariscal Castilla 450, San Ramón, Chanchamayo",
    whatsapp: "51964200116",
    description: "Agencia de turismo especializada en tours de aventura por Chanchamayo. Rafting, avistamiento de aves, visitas a comunidades Asháninka y caminatas a cataratas. Tours diarios y paquetes completos.",
    featured: true,
  },
  {
    name: "Agrovida San Ramón",
    catSlug: "agricultura-insumos",
    location: "Jr. Huancayo 670, San Ramón, Chanchamayo",
    whatsapp: "51964200117",
    description: "Proveedor de insumos agrícolas para cafetaleros y cacaoteros. Fertilizantes orgánicos, fungicidas, semillas mejoradas y herramientas de campo a precios de mayorista. Asistencia técnica gratuita.",
    featured: false,
  },
  {
    name: "Servicio Técnico Electrónica Carlos",
    catSlug: "servicios-tecnicos",
    location: "Jr. Progreso 88, San Ramón, Chanchamayo",
    whatsapp: "51964200118",
    description: "Servicio técnico especializado en celulares, laptops y equipos electrónicos. Reparación de pantallas, cambio de baterías, formateo de equipos y venta de repuestos originales.",
    featured: false,
  },
  {
    name: "Salón de Belleza Esencia",
    catSlug: "belleza-cuidado",
    location: "Jr. Cusco 45, San Ramón, Chanchamayo",
    whatsapp: "51964200119",
    description: "Centro de belleza con tratamientos faciales, capilares y corporales usando ingredientes naturales amazónicos. Manicure, pedicure, tinte, cortes y masajes relajantes. Reservas por WhatsApp.",
    featured: false,
  },
  {
    name: "Distribuidora Chanchamayo",
    catSlug: "abarrotes-bodega",
    location: "Av. Tarma 890, San Ramón, Chanchamayo",
    whatsapp: "51964200120",
    description: "Distribuidora mayorista de abarrotes y alimentos no perecederos. Proveemos a bodegas, restaurantes y minimarkets de toda la provincia de Chanchamayo. Precios directos de fábrica.",
    featured: false,
  },
  {
    name: "Avícola El Porvenir",
    catSlug: "carnes-pescados",
    location: "Jr. Junín 200, San Ramón, Chanchamayo",
    whatsapp: "51964200121",
    description: "Granja avícola con pollos de granja, huevos orgánicos y cuyes criados en el campo. También vendemos patos, conejos y carnes de caza. Productos frescos todos los días.",
    featured: false,
  },
  {
    name: "Naturista El Árbol Verde",
    catSlug: "plantas-hierbas",
    location: "Jr. Arequipa 150, San Ramón, Chanchamayo",
    whatsapp: "51964200122",
    description: "Tienda naturista con extractos de plantas amazónicas, aceites esenciales y productos orgánicos de la selva central. Sacha inchi, camu camu, aguaymanto, copaiba y más remedios naturales.",
    featured: false,
  },
  {
    name: "Textilería y Modas El Tejido",
    catSlug: "ropa-calzado",
    location: "Av. Principal 340, San Ramón, Chanchamayo",
    whatsapp: "51964200123",
    description: "Ropa tejida artesanalmente con lana y alpaca. Chompas, mantas, calcetines y accesorios tejidos a mano por artesanas locales de la región. Diseños únicos y personalizados por encargo.",
    featured: false,
  },
  {
    name: "Librería y Papelería El Saber",
    catSlug: "educacion-libreria",
    location: "Jr. 2 de Mayo 55, San Ramón, Chanchamayo",
    whatsapp: "51964200124",
    description: "La librería más completa de San Ramón con útiles escolares, libros de texto y materiales de oficina. Fotocopias, anillados e impresiones a color. Atendemos de lunes a sábado.",
    featured: false,
  },
  {
    name: "Vidriería y Aluminios San Ramón",
    catSlug: "ferreteria-construccion",
    location: "Jr. Lima 333, San Ramón, Chanchamayo",
    whatsapp: "51964200125",
    description: "Especialistas en vidrios templados, espejos y estructuras de aluminio. Fabricamos ventanas, puertas y divisiones de vidrio a medida para hogares y negocios de Chanchamayo.",
    featured: false,
  },
  {
    name: "Distribuidora de Gas y Agua",
    catSlug: "abarrotes-bodega",
    location: "Av. Colonos 222, San Ramón, Chanchamayo",
    whatsapp: "51964200126",
    description: "Distribuidora autorizada de balones de gas y agua purificada para hogares y negocios. Delivery a domicilio en toda San Ramón sin costo adicional. Atendemos desde las 7am hasta las 8pm.",
    featured: false,
  },
  {
    name: "Mueblería Maderas del Perú",
    catSlug: "hogar-muebles",
    location: "Jr. Bolívar 500, San Ramón, Chanchamayo",
    whatsapp: "51964200127",
    description: "Fabricantes de muebles de madera con cedro, caoba y tornillo de la selva central. Camas, roperos, comedores y muebles a medida con garantía de 3 años. Diseños modernos y clásicos.",
    featured: false,
  },
  {
    name: "Licorería y Bebidas La Fiesta",
    catSlug: "bebidas-jugos",
    location: "Jr. Grau 88, San Ramón, Chanchamayo",
    whatsapp: "51964200128",
    description: "Distribuidora de bebidas alcohólicas y no alcohólicas para eventos y consumo personal. Cervezas, gaseosas, vinos, licores nacionales e importados. Precios al por mayor disponibles.",
    featured: false,
  },
  {
    name: "Óptica Visual San Ramón",
    catSlug: "farmacia-salud",
    location: "Av. Mariscal Castilla 180, San Ramón, Chanchamayo",
    whatsapp: "51964200129",
    description: "Óptica con examen visual gratuito y monturas nacionales e importadas. Lentes progresivos, bifocales, de contacto y gafas de sol con protección UV400 a precios accesibles.",
    featured: false,
  },
  {
    name: "Internet y Comunicaciones E-Net",
    catSlug: "electronica-tecnologia",
    location: "Jr. Chanchamayo 410, San Ramón, Chanchamayo",
    whatsapp: "51964200130",
    description: "Proveedor de equipos de telecomunicaciones y servicio técnico en redes. Routers, antenas, switches, cámaras IP y UPS. Instalación de redes en hogares y empresas de toda la provincia.",
    featured: false,
  },
];

// ─── Products (10 per store) ──────────────────────────────────────────────────

type ProductItem = { name: string; description: string; price: string; stock: number; unit: string };

const PRODUCTS_BY_CATEGORY: Record<string, ProductItem[]> = {
  "frutas-verduras": [
    { name: "Piña Chanchamayo",          description: "Piña madura y dulce, cosechada en las chacras del valle de Chanchamayo. Ideal para jugos y postres.", price: "5.00",  stock: 100, unit: "unidad" },
    { name: "Naranja de Jugo (kg)",       description: "Naranjas jugosas y dulces de producción local, perfectas para hacer refrescos naturales.",              price: "3.00",  stock: 200, unit: "kg" },
    { name: "Maracuyá Orgánico (kg)",     description: "Maracuyá orgánica cultivada sin pesticidas en los valles de Chanchamayo. Pulpa abundante.",             price: "6.00",  stock: 80,  unit: "kg" },
    { name: "Plátano de Isla (racimo)",   description: "Plátano de isla dulce y aromático. El favorito de la región para desayuno y merienda.",                  price: "12.00", stock: 50,  unit: "racimo" },
    { name: "Yuca Fresca (kg)",           description: "Yuca blanca y harinosa recién cosechada. Ideal para sancochada, frita o en sopas.",                      price: "2.50",  stock: 150, unit: "kg" },
    { name: "Papaya Criolla (kg)",        description: "Papaya madura y dulce de la selva central. Rica en vitaminas y enzimas digestivas.",                     price: "4.00",  stock: 60,  unit: "kg" },
    { name: "Mandarina Ponkan (malla)",   description: "Mandarinas ponkan dulces y fáciles de pelar. Malla de 3kg cosechadas en la zona.",                       price: "8.00",  stock: 70,  unit: "malla 3kg" },
    { name: "Cacao en Vaina",             description: "Vainas de cacao frescas del valle de Chanchamayo. Pulpa blanca dulce comestible.",                       price: "3.00",  stock: 40,  unit: "unidad" },
    { name: "Zapallo Macre (kg)",         description: "Zapallo macre anaranjado y harinoso. Ideal para sopas, guisos y mazamorra.",                             price: "2.00",  stock: 120, unit: "kg" },
    { name: "Granadilla de Selva",        description: "Granadilla dulce y aromática directamente de las chacras de San Ramón. Excelente para refresco.",        price: "1.50",  stock: 90,  unit: "unidad" },
  ],
  "cafe-cacao": [
    { name: "Café Molido Premium 250g",   description: "Café 100% arábica molido de tostación media, cosechado en las alturas de Chanchamayo. Aroma intenso.",  price: "18.00", stock: 60,  unit: "bolsa 250g" },
    { name: "Café en Grano Tostado 500g", description: "Granos de café seleccionados a mano, tostados artesanalmente en el local para máxima frescura.",         price: "32.00", stock: 40,  unit: "bolsa 500g" },
    { name: "Café Instantáneo 200g",      description: "Café instantáneo de Chanchamayo con sabor intenso. Sin aditivos ni conservantes artificiales.",           price: "22.00", stock: 80,  unit: "frasco 200g" },
    { name: "Cacao en Polvo Orgánico",    description: "Cacao en polvo sin azúcar, 100% orgánico certificado de los valles de Chanchamayo.",                    price: "15.00", stock: 50,  unit: "bolsa 200g" },
    { name: "Chocolate Artesanal 70%",    description: "Tableta de chocolate negro 70% cacao elaborada artesanalmente con cacao local de primera calidad.",       price: "12.00", stock: 45,  unit: "tableta 100g" },
    { name: "Bebida de Cacao (1L)",       description: "Bebida natural de cacao con leche, lista para tomar. Receta tradicional de la selva central.",            price: "8.00",  stock: 30,  unit: "botella 1L" },
    { name: "Café Verde (sin tostar)",    description: "Café verde sin tostar para preparación casera. Conserva todos los antioxidantes naturales.",              price: "25.00", stock: 20,  unit: "bolsa 250g" },
    { name: "Cacao Nibs",                 description: "Fragmentos de cacao tostado sin azúcar. Superalimento amazónico rico en magnesio y antioxidantes.",      price: "18.00", stock: 35,  unit: "bolsa 150g" },
    { name: "Pasta de Cacao 200g",        description: "Pasta pura de cacao sin aditivos, base para chocolate casero y recetas gourmet.",                        price: "20.00", stock: 25,  unit: "barra 200g" },
    { name: "Café Chanchamayo 1kg",       description: "Café molido en presentación de 1kg para familias y negocios. Mezcla especial de la finca propia.",        price: "60.00", stock: 15,  unit: "bolsa 1kg" },
  ],
  "miel-apicultura": [
    { name: "Miel Pura de Abeja 1kg",     description: "Miel cruda sin procesar de flores silvestres de Chanchamayo. 100% pura, sin azúcar añadida.",            price: "35.00", stock: 50,  unit: "tarro 1kg" },
    { name: "Miel de Flores 500g",        description: "Miel de flores silvestres del bosque amazónico. Sabor suave y aroma delicado. Ideal para té.",            price: "20.00", stock: 60,  unit: "tarro 500g" },
    { name: "Propóleo en Gotas 30ml",     description: "Propóleo líquido extraído directamente de las colmenas. Poderoso antibiótico natural y antiviral.",       price: "18.00", stock: 40,  unit: "frasco 30ml" },
    { name: "Jalea Real 50g",             description: "Jalea real fresca de producción propia. Estimulante del sistema inmune y energizante natural.",           price: "45.00", stock: 20,  unit: "frasco 50g" },
    { name: "Miel con Jengibre 500g",     description: "Miel pura mezclada con jengibre orgánico. Excelente para el frío y las defensas del organismo.",          price: "25.00", stock: 30,  unit: "tarro 500g" },
    { name: "Polen de Abeja 200g",        description: "Polen fresco de abeja, rico en proteínas y aminoácidos. Superalimento natural de la colmena.",            price: "30.00", stock: 25,  unit: "frasco 200g" },
    { name: "Cera de Abeja Natural",      description: "Cera pura de abeja para fabricar velas, cosméticos y cuidado de la madera. Sin blanquear.",               price: "15.00", stock: 35,  unit: "bloque 100g" },
    { name: "Miel de Eucalipto 1kg",      description: "Miel monofloral de eucalipto con propiedades expectorantes y antibacterianas.",                          price: "40.00", stock: 20,  unit: "tarro 1kg" },
    { name: "Propóleo en Polvo 30g",      description: "Propóleo deshidratado en polvo para cápsulas y preparaciones naturales caseras.",                        price: "22.00", stock: 20,  unit: "sobre 30g" },
    { name: "Miel Cruda 2kg",             description: "Miel cruda sin filtrar con cera y propóleo natural. Presentación familiar al mejor precio.",              price: "65.00", stock: 10,  unit: "tarro 2kg" },
  ],
  "plantas-hierbas": [
    { name: "Uña de Gato 500g",           description: "Corteza seca de uña de gato (Uncaria tomentosa) del bosque amazónico. Antiinflamatoria y antiviral.",    price: "15.00", stock: 60,  unit: "bolsa 500g" },
    { name: "Chanca Piedra 250g",         description: "Hierba phyllanthus niruri para tratamiento natural de cálculos renales y hepáticos.",                    price: "12.00", stock: 50,  unit: "bolsa 250g" },
    { name: "Sangre de Grado 200ml",      description: "Látex de árbol sangre de grado, poderoso cicatrizante y antiulceroso de la selva peruana.",               price: "18.00", stock: 40,  unit: "frasco 200ml" },
    { name: "Muña Seca 100g",             description: "Hierba andina-amazónica con propiedades digestivas y para el tratamiento de la osteoporosis.",            price: "8.00",  stock: 70,  unit: "bolsa 100g" },
    { name: "Boldo Seco 100g",            description: "Hojas secas de boldo para infusiones digestivas y desintoxicantes del hígado.",                          price: "7.00",  stock: 80,  unit: "bolsa 100g" },
    { name: "Valeriana Raíz 100g",        description: "Raíz de valeriana seca con propiedades sedantes y ansiolíticas. Ideal para el insomnio.",                 price: "10.00", stock: 55,  unit: "bolsa 100g" },
    { name: "Jengibre en Polvo 100g",     description: "Jengibre orgánico deshidratado y molido. Antiinflamatorio, digestivo y antinauseoso.",                   price: "9.00",  stock: 90,  unit: "sobre 100g" },
    { name: "Cúrcuma Molida 100g",        description: "Cúrcuma orgánica molida de producción local. Potente antiinflamatorio y antioxidante natural.",           price: "9.00",  stock: 85,  unit: "sobre 100g" },
    { name: "Manzanilla en Bolsitas",     description: "Té de manzanilla natural en 50 bolsitas individuales. Digestivo, calmante y relajante.",                 price: "6.00",  stock: 100, unit: "caja 50 bolsitas" },
    { name: "Aceite de Copaiba 50ml",     description: "Aceite de copaiba puro extraído del árbol de la selva. Antiinflamatorio y cicatrizante natural.",         price: "22.00", stock: 30,  unit: "frasco 50ml" },
  ],
  "carnes-pescados": [
    { name: "Pollo Entero (kg)",          description: "Pollo de corral fresco, criado en granja local de Chanchamayo. Sin hormonas ni antibióticos.",             price: "9.00",  stock: 80,  unit: "kg" },
    { name: "Pechuga de Pollo (kg)",      description: "Pechuga de pollo fresca sin hueso. Ideal para parrilla, guisados y preparaciones saludables.",            price: "12.00", stock: 60,  unit: "kg" },
    { name: "Carne de Res Molida (kg)",   description: "Carne de res molida fresca de primera calidad. Ideal para hamburguesas, tallarin y guisos.",              price: "18.00", stock: 50,  unit: "kg" },
    { name: "Bistec de Res (kg)",         description: "Bistec de res tierno cortado al momento. Perfecto para la parrilla o asado.",                             price: "22.00", stock: 40,  unit: "kg" },
    { name: "Costillas de Cerdo (kg)",    description: "Costillas de cerdo frescas de producción local. Sabrosas y jugosas para el horno o la parrilla.",          price: "16.00", stock: 45,  unit: "kg" },
    { name: "Trucha Fresca (kg)",         description: "Trucha fresca de piscigranjas de altura de la región Junín. Rica en omega-3 y proteínas.",                price: "18.00", stock: 35,  unit: "kg" },
    { name: "Chicharrón de Cerdo (kg)",   description: "Chicharrón de cerdo dorado y crocante, preparado diariamente en el local. El favorito de San Ramón.",     price: "25.00", stock: 30,  unit: "kg" },
    { name: "Hígado de Res (kg)",         description: "Hígado fresco de res, excelente fuente de hierro y vitaminas. Para encebollado o guisado.",               price: "10.00", stock: 40,  unit: "kg" },
    { name: "Boquichico Fresco (kg)",     description: "Boquichico del río Chanchamayo, el pescado más consumido de la región. Ideal para fritura.",               price: "14.00", stock: 25,  unit: "kg" },
    { name: "Ahumado de Trucha (unid)",   description: "Trucha ahumada artesanalmente con leña de molle. Lista para consumir o usar en ensaladas.",               price: "20.00", stock: 20,  unit: "unidad" },
  ],
  "panaderia-pasteles": [
    { name: "Pan Francés (docena)",       description: "Pan francés crocante por fuera y suave por dentro, horneado cada mañana a partir de las 5am.",            price: "3.00",  stock: 200, unit: "docena" },
    { name: "Pan de Molde Integral",      description: "Pan de molde integral con semillas de sésamo y linaza. Sin conservantes artificiales.",                   price: "8.00",  stock: 50,  unit: "unidad" },
    { name: "Pan Dulce Chanchamayo",      description: "Pan dulce especiado con canela y vainilla, receta tradicional de la panadería familiar.",                 price: "0.80",  stock: 150, unit: "unidad" },
    { name: "Torta de Chocolate 1kg",     description: "Torta húmeda de chocolate con relleno de crema y cobertura de ganache. Pedidos con 24h anticipación.",   price: "65.00", stock: 10,  unit: "unidad" },
    { name: "Empanadas de Carne (unid)",  description: "Empanadas horneadas rellenas de carne molida con cebolla, ají amarillo y aceitunas.",                     price: "3.50",  stock: 80,  unit: "unidad" },
    { name: "Bizcocho de Naranja",        description: "Bizcocho esponjoso de naranja de Chanchamayo. Perfecto para la hora del té.",                             price: "15.00", stock: 30,  unit: "unidad" },
    { name: "Pan de Yema (docena)",       description: "Pan de yema suave y dorado, ideal para desayuno con mantequilla y mermelada.",                            price: "6.00",  stock: 100, unit: "docena" },
    { name: "Croissant de Mantequilla",   description: "Croissant hojaldrado con mantequilla natural. Perfecto para desayuno o merienda.",                        price: "4.50",  stock: 40,  unit: "unidad" },
    { name: "Cupcakes Decorados (6 unid)",description: "Set de 6 cupcakes decorados con betún de colores. Ideales para cumpleaños y celebraciones.",              price: "28.00", stock: 15,  unit: "set 6 unid" },
    { name: "Rosquitas de Manteca (kg)",  description: "Rosquitas crocantes de manteca de cerdo. Tradicionales de Chanchamayo, perfectas con café.",              price: "18.00", stock: 25,  unit: "kg" },
  ],
  "abarrotes-bodega": [
    { name: "Arroz Extra Calidad 5kg",    description: "Arroz blanco de grano largo, calidad extra para consumo diario. Producción nacional.",                    price: "22.00", stock: 100, unit: "bolsa 5kg" },
    { name: "Azúcar Rubia 2kg",           description: "Azúcar rubia granulada de caña de azúcar. La preferida en los hogares de Chanchamayo.",                   price: "7.00",  stock: 150, unit: "bolsa 2kg" },
    { name: "Aceite Vegetal 1L",          description: "Aceite vegetal de girasol para cocinar. Bajo en grasas saturadas y sin colesterol.",                      price: "9.00",  stock: 80,  unit: "botella 1L" },
    { name: "Fideos Spaghetti 500g",      description: "Fideos de trigo enriquecidos con hierro. Ideales para todas las preparaciones italianas.",                price: "3.50",  stock: 200, unit: "bolsa 500g" },
    { name: "Sal de Mesa 1kg",            description: "Sal yodada de mesa para el hogar. Enriquecida con yodo y flúor según norma peruana.",                     price: "1.50",  stock: 200, unit: "bolsa 1kg" },
    { name: "Leche Evaporada Gloria",     description: "Leche evaporada entera en lata. La preferida de las familias peruanas para todas las preparaciones.",     price: "3.80",  stock: 100, unit: "lata 400g" },
    { name: "Atún en Lata Florida",       description: "Atún en agua y sal, rico en proteínas y omega-3. Ideal para ensaladas, sánguches y pastas.",              price: "5.50",  stock: 80,  unit: "lata 170g" },
    { name: "Avena en Copos 500g",        description: "Avena entera en copos para desayuno. Rica en fibra y vitaminas del grupo B.",                             price: "5.00",  stock: 90,  unit: "bolsa 500g" },
    { name: "Harina de Trigo 1kg",        description: "Harina de trigo sin preparar para repostería y cocina general. Calidad premium.",                        price: "4.50",  stock: 120, unit: "bolsa 1kg" },
    { name: "Jabón de Ropa",              description: "Jabón de lavar ropa en barra. Efectivo en agua fría y caliente. Aroma fresco.",                           price: "2.50",  stock: 150, unit: "barra 300g" },
  ],
  "bebidas-jugos": [
    { name: "Jugo de Maracuyá 1L",        description: "Jugo puro de maracuyá natural sin azúcar añadida. Refrescante y rico en vitamina C.",                    price: "6.00",  stock: 60,  unit: "botella 1L" },
    { name: "Refresco de Cocona 1L",      description: "Refresco de cocona amazónica, fruta típica de la selva con alto contenido de vitamina B.",               price: "5.00",  stock: 50,  unit: "botella 1L" },
    { name: "Chicha de Jora Artesanal",   description: "Chicha de jora preparada con maíz morado fermentado siguiendo receta tradicional de la región.",         price: "4.00",  stock: 40,  unit: "botella 750ml" },
    { name: "Jugo de Guanábana 1L",       description: "Jugo natural de guanábana sin conservantes. Rico en vitaminas del complejo B y hierro.",                 price: "7.00",  stock: 35,  unit: "botella 1L" },
    { name: "Limonada de Tumbo",          description: "Limonada refrescante con tumbo (curuba) de la selva. Sin colorantes artificiales.",                       price: "4.50",  stock: 45,  unit: "botella 500ml" },
    { name: "Jugo Mixto Selva 1L",        description: "Mezcla de jugos tropicales: maracuyá, piña y naranja. La combinación favorita de Chanchamayo.",          price: "7.50",  stock: 30,  unit: "botella 1L" },
    { name: "Agua de Coco Natural",       description: "Agua de coco joven directamente del fruto. Isotónica natural, hidratante y refrescante.",                price: "4.00",  stock: 25,  unit: "unidad" },
    { name: "Jugo de Piña Natural",       description: "Jugo de piña chanchamayo recién exprimido. Digestivo y rico en bromelina.",                              price: "5.50",  stock: 40,  unit: "botella 1L" },
    { name: "Masato de Yuca (1L)",        description: "Bebida tradicional amazónica de yuca fermentada. Preparada artesanalmente con receta Asháninka.",         price: "5.00",  stock: 20,  unit: "botella 1L" },
    { name: "Té de Hierbas Medicinales",  description: "Infusión de hierbas amazónicas: muña, boldo y menta. Digestivo y relajante natural.",                    price: "3.00",  stock: 60,  unit: "sobre 10 bolsitas" },
  ],
  "ropa-calzado": [
    { name: "Polo Manga Corta Hombre",    description: "Polo de algodón 100% nacional, cómodo y fresco para el clima de Chanchamayo. Tallas S a XXL.",           price: "25.00", stock: 80,  unit: "unidad" },
    { name: "Jeans Slim Fit Dama",        description: "Pantalón jean de mezclilla elástica, ajuste slim. Moda actual a precio accesible.",                       price: "55.00", stock: 40,  unit: "unidad" },
    { name: "Vestido Casual Floral",      description: "Vestido floral liviano ideal para el clima cálido de San Ramón. Tallas S, M y L disponibles.",            price: "45.00", stock: 30,  unit: "unidad" },
    { name: "Zapatillas Deportivas",      description: "Zapatillas deportivas unisex con suela antideslizante. Ideales para ciudad y campo.",                     price: "80.00", stock: 25,  unit: "par" },
    { name: "Sandalias Mujer",            description: "Sandalias femeninas de cuero sintético con suela confort. Perfectas para el verano de la selva.",         price: "35.00", stock: 35,  unit: "par" },
    { name: "Camisa a Cuadros",           description: "Camisa de manga larga a cuadros, tela lino-algodón. Fresca y elegante para el trabajo.",                 price: "40.00", stock: 30,  unit: "unidad" },
    { name: "Short Deportivo",            description: "Short de tela secado rápido para deporte y actividades al aire libre en la selva.",                        price: "30.00", stock: 50,  unit: "unidad" },
    { name: "Mochila Casual 30L",         description: "Mochila urbana de 30 litros con compartimentos múltiples. Resistente al agua.",                           price: "60.00", stock: 20,  unit: "unidad" },
    { name: "Cinturón de Cuero",          description: "Cinturón de cuero genuino con hebilla clásica. Para hombre y mujer. Tallas 32 a 40.",                    price: "22.00", stock: 40,  unit: "unidad" },
    { name: "Chompa de Polar",            description: "Chompa de polar con cierre para noches frescas de San Ramón. Abrigo liviano y duradero.",                 price: "50.00", stock: 25,  unit: "unidad" },
  ],
  "artesania": [
    { name: "Collar de Semillas",         description: "Collar artesanal tejido con semillas del bosque amazónico. Pieza única elaborada por artesanas Asháninka.", price: "25.00", stock: 40,  unit: "unidad" },
    { name: "Bolso Tejido de Caña",       description: "Bolso artesanal tejido con fibra de caña y palma. Diseños tradicionales de la selva central.",            price: "45.00", stock: 25,  unit: "unidad" },
    { name: "Tapete de Palma",            description: "Tapete decorativo tejido a mano con palma real y totora. Motivos geométricos Asháninka.",                  price: "60.00", stock: 15,  unit: "unidad" },
    { name: "Arco y Flecha Decorativo",   description: "Arco y flecha artesanal de madera de la selva. Pieza decorativa y coleccionable. 80cm de largo.",         price: "80.00", stock: 10,  unit: "set" },
    { name: "Cushma Asháninka",           description: "Túnica tradicional Asháninka tejida a mano con algodón natural y teñida con tintes naturales.",            price: "150.00",stock: 8,   unit: "unidad" },
    { name: "Sonajero de Semillas",       description: "Instrumento musical artesanal hecho con semillas de shacapa y bambú. Para danza y meditación.",            price: "20.00", stock: 30,  unit: "unidad" },
    { name: "Canasta de Palma",           description: "Canasta tejida con hojas de palma. Utilitaria y decorativa. Tamaño mediano 30cm diámetro.",              price: "35.00", stock: 20,  unit: "unidad" },
    { name: "Pulsera de Huayruro",        description: "Pulsera artesanal con semillas rojas de huayruro, símbolo de buena suerte en la selva peruana.",          price: "10.00", stock: 60,  unit: "unidad" },
    { name: "Máscara Decorativa Selva",   description: "Máscara tallada en madera de cedro con motivos de la cosmovisión amazónica. Obra de arte única.",          price: "90.00", stock: 8,   unit: "unidad" },
    { name: "Colgante de Madera",         description: "Colgante tallado a mano en madera de huayruro con forma de animales amazónicos. Amuleto natural.",        price: "15.00", stock: 50,  unit: "unidad" },
  ],
  "ferreteria-construccion": [
    { name: "Cemento Portland 42.5kg",    description: "Cemento Portland tipo I de alta resistencia. Para construcciones y obras civiles en general.",             price: "35.00", stock: 60,  unit: "bolsa" },
    { name: "Pintura Látex Interior 4L",  description: "Pintura látex lavable para interiores. Alta cobertura, secado rápido. Colores disponibles.",              price: "45.00", stock: 40,  unit: "balde 4L" },
    { name: "Clavos de Acero 1kg",        description: "Clavos de acero galvanizado surtidos. Presentación de 1kg mixta: 1\", 2\", 3\" y 4\".",                  price: "6.00",  stock: 100, unit: "kg" },
    { name: "Alambre Negro 16 (1kg)",     description: "Alambre negro recocido calibre 16 para amarre en construcción. Rollo de 1kg.",                           price: "8.00",  stock: 80,  unit: "rollo" },
    { name: "Cinta Métrica 5m",           description: "Cinta métrica de acero inoxidable con funda de goma antideslizante. Precisión de 1mm.",                  price: "12.00", stock: 50,  unit: "unidad" },
    { name: "Taladro Percutor 700W",      description: "Taladro percutor eléctrico 700W con mandril de 13mm. Incluye maletín y brocas.",                          price: "180.00",stock: 10,  unit: "unidad" },
    { name: "Cable Eléctrico THW 14 (25m)",description: "Cable eléctrico THW de cobre sólido calibre 14. Rollo de 25 metros para instalaciones domiciliarias.",  price: "55.00", stock: 25,  unit: "rollo 25m" },
    { name: "Interruptor Doble",          description: "Interruptor eléctrico doble de empotrar marca Ticino. Capacidad 10A 250V.",                               price: "8.00",  stock: 60,  unit: "unidad" },
    { name: "Llave Francesa 10\"",        description: "Llave inglesa ajustable de 10 pulgadas de acero cromado. Para plomería y mecánica.",                      price: "22.00", stock: 30,  unit: "unidad" },
    { name: "Manguera de Agua 25m",       description: "Manguera flexible de PVC reforzada 3/4\" de diámetro. Resistente a la presión y rayos UV.",               price: "35.00", stock: 20,  unit: "rollo 25m" },
  ],
  "farmacia-salud": [
    { name: "Vitamina C 500mg x100",      description: "Tabletas de vitamina C 500mg. Refuerza el sistema inmunológico y ayuda a combatir resfríos.",             price: "18.00", stock: 60,  unit: "frasco 100 tab" },
    { name: "Paracetamol 500mg x20",      description: "Analgésico y antipirético genérico. Para el dolor de cabeza, fiebre y malestares en general.",           price: "4.50",  stock: 100, unit: "caja 20 tab" },
    { name: "Ibuprofeno 400mg x20",       description: "Antiinflamatorio no esteroideo para dolor, fiebre e inflamación. Uso adultos.",                          price: "6.00",  stock: 80,  unit: "caja 20 tab" },
    { name: "Alcohol Antiséptico 500ml",  description: "Alcohol isopropílico 70% para desinfección de heridas y superficies. Uso externo.",                       price: "7.00",  stock: 90,  unit: "frasco 500ml" },
    { name: "Gasas Esterilizadas 10x10",  description: "Gasas estériles 10x10cm en paquete de 10 unidades. Para curas y vendajes de heridas.",                   price: "4.00",  stock: 70,  unit: "paquete 10 unid" },
    { name: "Termómetro Digital",         description: "Termómetro digital de axila con pantalla LCD. Lectura en 60 segundos, alarma de fiebre.",                price: "25.00", stock: 30,  unit: "unidad" },
    { name: "Multivitamínico Adulto",     description: "Complejo multivitamínico con 12 vitaminas y 8 minerales para adultos activos.",                           price: "22.00", stock: 40,  unit: "frasco 60 tab" },
    { name: "Protector Solar FPS50+",     description: "Bloqueador solar factor 50+ para clima tropical de la selva. Resistente al agua y sudor.",                price: "28.00", stock: 35,  unit: "tubo 90ml" },
    { name: "Repelente de Insectos",      description: "Repelente de mosquitos y zancudos 8 horas de protección. Esencial en la selva de Chanchamayo.",          price: "15.00", stock: 50,  unit: "frasco 100ml" },
    { name: "Suero Oral Rehidratante",    description: "Sales de rehidratación oral para diarreas y deshidratación. Sabor naranja. Sin azúcar.",                  price: "3.00",  stock: 80,  unit: "sobre" },
  ],
  "belleza-cuidado": [
    { name: "Corte y Peinado",            description: "Servicio de corte de cabello para dama o caballero con lavado, corte y peinado incluidos.",               price: "25.00", stock: 30,  unit: "servicio" },
    { name: "Tinte Profesional",          description: "Coloración completa con tinte profesional, incluye decoloración si necesita. Sin amoníaco disponible.",   price: "60.00", stock: 20,  unit: "servicio" },
    { name: "Tratamiento Nutritivo",      description: "Tratamiento capilar nutritivo con aceite de coco y argán. Devuelve el brillo y suavidad al cabello.",     price: "35.00", stock: 25,  unit: "servicio" },
    { name: "Manicure Gel",               description: "Manicure completo con esmalte en gel que dura hasta 3 semanas. Incluye limado y cutículas.",              price: "30.00", stock: 20,  unit: "servicio" },
    { name: "Pedicure Spa",               description: "Pedicure terapéutico con baño de pies, exfoliación, masaje y esmalte a elección.",                        price: "35.00", stock: 20,  unit: "servicio" },
    { name: "Depilación de Cejas",        description: "Diseño y depilación de cejas con hilo y pinzas para definir perfectamente el arco.",                     price: "12.00", stock: 30,  unit: "servicio" },
    { name: "Masaje Relajante 1h",        description: "Masaje corporal relajante de 1 hora con aceites esenciales de la selva. Alivia tensiones y estrés.",     price: "55.00", stock: 15,  unit: "sesión 1h" },
    { name: "Limpieza Facial Profunda",   description: "Limpieza facial con vapor, extracción y mascarilla de arcilla. Piel fresca y radiante.",                  price: "40.00", stock: 15,  unit: "servicio" },
    { name: "Extensiones de Pestañas",    description: "Extensión de pestañas pelo a pelo con fibra de seda. Duración 3-4 semanas. Efecto natural.",              price: "80.00", stock: 10,  unit: "servicio" },
    { name: "Kit Cosméticos Naturales",   description: "Set de cosméticos elaborados con ingredientes naturales amazónicos: crema, sérum y contorno de ojos.",    price: "45.00", stock: 20,  unit: "kit" },
  ],
  "electronica-tecnologia": [
    { name: "Audífonos Bluetooth",        description: "Audífonos inalámbricos con cancelación de ruido. Batería 20h, conexión multipunto.",                      price: "89.00", stock: 30,  unit: "unidad" },
    { name: "Cargador USB-C 65W",         description: "Cargador de carga rápida 65W compatible con laptops, tablets y celulares USB-C.",                         price: "35.00", stock: 50,  unit: "unidad" },
    { name: "Protector de Pantalla",      description: "Vidrio templado 9H para celulares. Consultar compatibilidad. Instalación sin costo.",                     price: "15.00", stock: 60,  unit: "unidad" },
    { name: "Funda para Celular",         description: "Funda protectora de silicona o acrílica. Diseños variados. Consultar disponibilidad para tu modelo.",     price: "15.00", stock: 70,  unit: "unidad" },
    { name: "Mouse Inalámbrico",          description: "Mouse óptico inalámbrico 2.4GHz. Batería AA dura 12 meses. Compatible con Windows/Mac.",                  price: "28.00", stock: 35,  unit: "unidad" },
    { name: "Teclado USB",                description: "Teclado USB en español con teclas de multimedia. Layout latinoamericano. Plug and Play.",                 price: "25.00", stock: 30,  unit: "unidad" },
    { name: "Memoria USB 64GB",           description: "Pen drive 64GB USB 3.0 de alta velocidad (100MB/s lectura). Compatible con todos los sistemas.",          price: "22.00", stock: 45,  unit: "unidad" },
    { name: "Parlante Bluetooth",         description: "Parlante portátil bluetooth 20W resistente al agua IPX5. Batería 10h. Perfecto para la selva.",           price: "75.00", stock: 20,  unit: "unidad" },
    { name: "Cámara de Seguridad WiFi",   description: "Cámara IP HD 1080p con visión nocturna, detección de movimiento y acceso remoto desde celular.",         price: "120.00",stock: 15,  unit: "unidad" },
    { name: "Cable HDMI 3m",             description: "Cable HDMI 2.0 de 3 metros. 4K 60Hz, compatible con TV, monitor y proyector.",                           price: "18.00", stock: 40,  unit: "unidad" },
  ],
  "hogar-muebles": [
    { name: "Silla de Madera Cedro",      description: "Silla de madera cedro barnizada, resistente y elegante. Fabricación artesanal local. Peso máx 150kg.",   price: "120.00",stock: 20,  unit: "unidad" },
    { name: "Mesa de Centro Madera",      description: "Mesa de centro en madera tornillo con acabado lustrado. 100x60x45cm. Diseño moderno.",                   price: "280.00",stock: 8,   unit: "unidad" },
    { name: "Estante 4 Niveles",          description: "Estante de melamina de 4 niveles con estructura metálica. 180x80x30cm. Armado incluido.",                price: "220.00",stock: 10,  unit: "unidad" },
    { name: "Cojines Decorativos (par)",  description: "Par de cojines decorativos con tela de algodón estampada. Relleno de microfibra. 45x45cm.",              price: "35.00", stock: 30,  unit: "par" },
    { name: "Cortinas para Sala (par)",   description: "Par de cortinas de tela blackout para sala o dormitorio. 2.5m altura. Varios colores.",                  price: "90.00", stock: 15,  unit: "par" },
    { name: "Set de Vasos x6",            description: "Set de 6 vasos de vidrio templado 350ml. Aptos para lavavajillas. Diseño moderno.",                     price: "28.00", stock: 40,  unit: "set 6 piezas" },
    { name: "Juego de Ollas 5 piezas",    description: "Set de ollas de aluminio anodizado antiadherente. Incluye: 3 ollas, 1 sartén y 1 olla arrocera.",       price: "180.00",stock: 12,  unit: "set" },
    { name: "Organizador de Cocina",      description: "Organizador de plástico de alta resistencia con 3 bandejas giratorias para especias y condimentos.",     price: "45.00", stock: 20,  unit: "unidad" },
    { name: "Tapete de Sala 150x200cm",   description: "Tapete de polipropileno 150x200cm con diseño geométrico. Fácil de limpiar y resistente.",               price: "150.00",stock: 8,   unit: "unidad" },
    { name: "Espejo Decorativo",          description: "Espejo con marco de madera tallada 60x90cm. Ideal para sala o pasillo. Fabricación local.",              price: "95.00", stock: 10,  unit: "unidad" },
  ],
  "mascotas": [
    { name: "Croquetas Perro Adulto 5kg", description: "Alimento balanceado para perros adultos. Rico en proteínas y vitaminas. Razas pequeñas y medianas.",     price: "65.00", stock: 30,  unit: "bolsa 5kg" },
    { name: "Croquetas Gato Adulto 2kg",  description: "Alimento seco para gatos adultos con pollo y atún. Controla el peso y cuida el pelaje.",                 price: "38.00", stock: 25,  unit: "bolsa 2kg" },
    { name: "Arena Sanitaria 5kg",        description: "Arena aglomerante para gatos con control de olores. Sin polvo y de fácil limpieza.",                     price: "22.00", stock: 35,  unit: "bolsa 5kg" },
    { name: "Correa Extensible 5m",       description: "Correa retráctil de 5 metros para perros hasta 25kg. Con freno y bloqueo de seguridad.",                 price: "35.00", stock: 20,  unit: "unidad" },
    { name: "Collar Anti-pulgas",         description: "Collar antiparasitario contra pulgas y garrapatas. Protección continua por 8 meses.",                    price: "28.00", stock: 30,  unit: "unidad" },
    { name: "Juguete para Perro",         description: "Juguete de goma resistente con sonido para perros medianos. Estimula el juego y reduce la ansiedad.",    price: "15.00", stock: 40,  unit: "unidad" },
    { name: "Rascador para Gato",         description: "Rascador de sisal con plataforma superior. 50cm altura. Salva tus muebles y entretiene al gato.",       price: "45.00", stock: 15,  unit: "unidad" },
    { name: "Shampoo para Mascotas",      description: "Shampoo hipoalergénico con aloe vera para perros y gatos. pH neutro. No irrita los ojos.",               price: "18.00", stock: 30,  unit: "frasco 500ml" },
    { name: "Comedero Automático 2L",     description: "Comedero automático programable de 2 litros para perros y gatos pequeños. 4 comidas al día.",            price: "75.00", stock: 10,  unit: "unidad" },
    { name: "Caseta para Perro",          description: "Caseta de plástico resistente para perros medianos. Ventilada y fácil de limpiar. 60x80cm.",             price: "120.00",stock: 8,   unit: "unidad" },
  ],
  "agricultura-insumos": [
    { name: "Fertilizante NPK 25kg",      description: "Fertilizante granulado NPK 20-20-20 para cultivos de café, cacao y frutales. Alta solubilidad.",         price: "85.00", stock: 30,  unit: "saco 25kg" },
    { name: "Guano de Isla 50kg",         description: "Guano de isla peruano certificado. Fertilizante orgánico natural, el mejor para café y cacao.",          price: "65.00", stock: 25,  unit: "saco 50kg" },
    { name: "Fungicida Orgánico 1L",      description: "Fungicida biológico a base de Bacillus subtilis. Control de enfermedades fúngicas en café.",              price: "45.00", stock: 20,  unit: "litro" },
    { name: "Insecticida Biológico 500ml",description: "Insecticida orgánico derivado de extractos vegetales. Controla plagas sin dañar el medioambiente.",      price: "35.00", stock: 25,  unit: "frasco 500ml" },
    { name: "Semillas Cacao CCN-51",      description: "Semillas certificadas de cacao CCN-51 de alto rendimiento. Lote de 100 semillas seleccionadas.",          price: "30.00", stock: 15,  unit: "lote 100 semillas" },
    { name: "Semillas de Café Caturra",   description: "Semillas de café variedad Caturra adaptadas a los valles de Chanchamayo. Certificadas.",                  price: "25.00", stock: 15,  unit: "lote 100 semillas" },
    { name: "Machete Agrícola",           description: "Machete de acero inoxidable con mango de madera. Ideal para deshierbe y cosecha en la selva.",           price: "18.00", stock: 40,  unit: "unidad" },
    { name: "Tijeras de Podar",           description: "Tijeras de poda de acero templado con resorte y seguro. Para poda de café, cacao y frutales.",           price: "25.00", stock: 30,  unit: "unidad" },
    { name: "Manguera de Riego 25m",      description: "Manguera flexible de alta presión 3/4\" para sistemas de riego por goteo. Resistente a rayos UV.",       price: "35.00", stock: 20,  unit: "rollo 25m" },
    { name: "Botas de Campo",             description: "Botas de jebe PVC resistentes para trabajo agrícola en campo. Impermeables. Tallas 38 a 45.",             price: "45.00", stock: 25,  unit: "par" },
  ],
  "turismo-hospedaje": [
    { name: "Tour Río Chanchamayo 1 día", description: "Excursión de un día al río Chanchamayo con almuerzo incluido, actividades de pesca y natación.",         price: "80.00", stock: 20,  unit: "persona" },
    { name: "Rafting Río Perené",         description: "Descenso en rafting por los rápidos del río Perené. 3 horas de aventura. Equipo y guía incluidos.",      price: "120.00",stock: 15,  unit: "persona" },
    { name: "Caminata Catarata del Tirol",description: "Trekking de medio día a la Catarata del Tirol. Guía, refrigerio y seguro incluidos.",                    price: "60.00", stock: 20,  unit: "persona" },
    { name: "Tour Comunidad Asháninka",   description: "Visita guiada a comunidad Asháninka nativa. Conoce su cultura, artesanías y gastronomía.",               price: "90.00", stock: 15,  unit: "persona" },
    { name: "Avistamiento de Aves",       description: "Tour de birdwatching al amanecer con guía ornitólogo. Más de 300 especies en Chanchamayo.",               price: "70.00", stock: 12,  unit: "persona" },
    { name: "Pesca Deportiva en el Río",  description: "Jornada de pesca deportiva de 4 horas con equipo y guía experto. Boquichico y truchas.",                 price: "80.00", stock: 10,  unit: "persona" },
    { name: "Campamento Selva 2 Días",    description: "Campamento de 2 días y 1 noche en la selva con todo incluido. Actividades y alimentación.",              price: "280.00",stock: 8,   unit: "persona" },
    { name: "Visita Finca Cafetalera",    description: "Tour a finca cafetalera de Chanchamayo. Proceso del café de planta a taza. Cata incluida.",              price: "55.00", stock: 15,  unit: "persona" },
    { name: "Tour Oxapampa-Pozuzo",       description: "Excursión de 2 días a las colonias europeas de Oxapampa y Pozuzo. Transporte y hospedaje incluidos.",    price: "350.00",stock: 6,   unit: "persona" },
    { name: "Circuito Completo 5 Días",   description: "Circuito turístico completo por toda la provincia de Chanchamayo. Todo incluido. Mínimo 4 personas.",    price: "850.00",stock: 4,   unit: "persona" },
  ],
  "educacion-libreria": [
    { name: "Resma de Papel A4 75g",      description: "Resma de 500 hojas de papel bond A4 75g. Para impresión y fotocopiado. Blancura superior.",              price: "18.00", stock: 60,  unit: "resma 500 hojas" },
    { name: "Cuaderno Universitario 200h",description: "Cuaderno cuadriculado de 200 hojas tamaño universitario. Tapa dura plastificada.",                       price: "7.00",  stock: 80,  unit: "unidad" },
    { name: "Lapiceros Faber-Castell x12",description: "Caja de 12 lapiceros ballpoint Faber-Castell 0.7mm. Negros y azules. Escritura fluida.",                 price: "12.00", stock: 50,  unit: "caja 12 unid" },
    { name: "Mochila Escolar",            description: "Mochila escolar de 25 litros con compartimento para laptop 14\". Tela impermeable reforzada.",            price: "65.00", stock: 20,  unit: "unidad" },
    { name: "Calculadora Científica",     description: "Calculadora científica 240 funciones. Para colegios y universidades. 2 líneas de visualización.",        price: "55.00", stock: 15,  unit: "unidad" },
    { name: "Colores Faber-Castell x24",  description: "Caja de 24 lápices de colores Faber-Castell. Colores vivos y mina gruesa. Para escolares.",              price: "18.00", stock: 40,  unit: "caja 24 unid" },
    { name: "Plumones Gruesos Stabilo",   description: "Set de 10 plumones gruesos de colores para manualidades y pizarras. Tinta al agua.",                     price: "15.00", stock: 35,  unit: "set 10 colores" },
    { name: "Plastilina Surtida 10 barras",description: "Set de plastilina no tóxica en 10 colores. Para modelado escolar y arte. Textura suave.",              price: "10.00", stock: 45,  unit: "set 10 barras" },
    { name: "Folder Manila x50",          description: "Paquete de 50 folders manila tamaño oficio con gancho. Para archivos y documentos.",                     price: "12.00", stock: 50,  unit: "paquete 50 unid" },
    { name: "Engrapadora + Grapas",       description: "Engrapadora de escritorio metálica para 25 hojas, incluye 1 caja de 1000 grapas estándar.",              price: "18.00", stock: 30,  unit: "set" },
  ],
  "servicios-tecnicos": [
    { name: "Reparación Pantalla Celular",description: "Cambio de pantalla LCD o AMOLED para la mayoría de modelos. Consultar disponibilidad para tu teléfono.", price: "80.00", stock: 20,  unit: "servicio" },
    { name: "Cambio de Batería Celular",  description: "Reemplazo de batería original para celulares Android e iPhone. Incluye diagnóstico sin costo.",          price: "45.00", stock: 25,  unit: "servicio" },
    { name: "Desbloqueo de Celular",      description: "Liberación de operador para cualquier celular. Software o hardware según el caso. Garantía 30 días.",    price: "25.00", stock: 20,  unit: "servicio" },
    { name: "Configuración de Red WiFi",  description: "Instalación y configuración de router WiFi en el hogar o negocio. Incluye seguridad y cobertura.",       price: "40.00", stock: 15,  unit: "servicio" },
    { name: "Mantenimiento de Laptop",    description: "Limpieza interna, cambio de pasta térmica y optimización de software para laptops lentas.",              price: "60.00", stock: 15,  unit: "servicio" },
    { name: "Formateo de PC / Laptop",   description: "Formateo completo con instalación de Windows 10/11 y drivers. Incluye antivirus y programas básicos.",  price: "50.00", stock: 15,  unit: "servicio" },
    { name: "Instalación Cámaras CCTV",  description: "Instalación de sistema de cámaras de seguridad con monitoreo remoto. Cotización sin costo.",            price: "200.00",stock: 5,   unit: "servicio" },
    { name: "Reparación de Tablet",       description: "Diagnóstico y reparación de tablets Android. Pantallas, botones, carga y software.",                    price: "70.00", stock: 10,  unit: "servicio" },
    { name: "Venta de Repuestos Celular", description: "Repuestos originales y genéricos para los modelos más comunes. Consultar disponibilidad.",               price: "30.00", stock: 30,  unit: "pieza" },
    { name: "Servicio Técnico a Domicilio",description: "Visita técnica al domicilio o negocio para diagnóstico y reparación in situ. En San Ramón.",           price: "50.00", stock: 10,  unit: "servicio" },
  ],
};

// Reviews data
const REVIEW_COMMENTS = [
  "Excelente atención, muy amables. Volveré a comprar.",
  "Productos de muy buena calidad. Los recomiendo.",
  "Entrega rápida y productos tal como se describen.",
  "Buena relación calidad-precio. Satisfecho con la compra.",
  "Atención personalizada. El vendedor muy atento.",
  "Los mejores de San Ramón. Siempre frescos y naturales.",
  "Compramos seguido aquí. Nunca nos han fallado.",
  "Muy buen servicio, rápido y eficiente. Gracias.",
  "Calidad garantizada. Los precios son accesibles.",
  "Negocio confiable, llevan años en el mercado de San Ramón.",
  "Me atendieron de maravilla. Todo llegó en perfecto estado.",
  "Lo mejor de Chanchamayo. Totalmente recomendados.",
  "Buen trato y productos auténticos de la zona.",
  "Precios justos para la calidad que ofrecen. Excelente.",
  "Los productos son frescos y de producción local. Me encanta.",
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Iniciando seed San Ramón...\n");

  // ── 1. Limpiar datos anteriores (respetando admin) ────────────────────────
  console.log("🧹 Limpiando datos anteriores...");
  
  // Get admin user ID(s)
  const admins = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.role, "admin"));
  const adminIds = admins.map(a => a.id);
  
  // Get admin store IDs
  let adminStoreIds: number[] = [];
  if (adminIds.length > 0) {
    const adminStores = await db.select({ id: storesTable.id }).from(storesTable)
      .where(inArray(storesTable.userId, adminIds));
    adminStoreIds = adminStores.map(s => s.id);
  }

  // Delete non-admin data
  await db.delete(reviewsTable);
  console.log("  ✓ Reseñas eliminadas");
  
  await db.delete(productImagesTable);
  await db.delete(productsTable);
  console.log("  ✓ Productos eliminados");
  
  // Set category_id to NULL in all stores before deleting categories
  await db.execute(sql`UPDATE stores SET category_id = NULL`);
  
  // Delete ALL stores (admin can recreate their store)
  await db.delete(storesTable);
  console.log("  ✓ Tiendas eliminadas");
  
  // Delete non-admin users
  if (adminIds.length > 0) {
    await db.execute(
      sql`DELETE FROM users WHERE role != 'admin'`
    );
  } else {
    await db.execute(sql`DELETE FROM users`);
  }
  console.log("  ✓ Usuarios no-admin eliminados");

  // Delete and re-insert categories
  await db.delete(categoriesTable);
  console.log("  ✓ Categorías eliminadas");

  // ── 2. Insertar 20 categorías ─────────────────────────────────────────────
  console.log("\n📁 Creando 20 categorías...");
  const insertedCats = await db.insert(categoriesTable).values(
    CATEGORIES.map(c => ({ ...c, isActive: true }))
  ).returning();
  const catMap = new Map(insertedCats.map(c => [c.slug, c.id]));
  console.log(`  ✓ ${insertedCats.length} categorías creadas`);

  // ── 3. Insertar 20 usuarios ───────────────────────────────────────────────
  console.log("\n👥 Creando 20 usuarios...");
  const pwHash = await bcrypt.hash("User2024!", 10);
  const insertedUsers = await db.insert(usersTable).values(
    USERS_DATA.map(u => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      district: u.district,
      role: u.role as "user" | "vendor" | "admin",
      passwordHash: pwHash,
    }))
  ).returning();
  console.log(`  ✓ ${insertedUsers.length} usuarios creados (contraseña: User2024!)`);

  // ── 4. Insertar 30 tiendas en San Ramón ───────────────────────────────────
  console.log("\n🏪 Creando 30 tiendas en San Ramón...");
  const vendorUsers = insertedUsers.filter(u => u.role === "vendor");
  const SAN_RAMON = { lat: -11.1297, lng: -75.3500 };

  const storeValues = STORES.map((s, i) => {
    const owner = vendorUsers[i % vendorUsers.length];
    const catId = catMap.get(s.catSlug);
    return {
      userId: owner.id,
      name: s.name,
      slug: `${slugify(s.name)}-sr`,
      description: s.description,
      categoryId: catId,
      location: s.location,
      district: "San Ramón",
      lat: jitter(SAN_RAMON.lat),
      lng: jitter(SAN_RAMON.lng),
      whatsapp: s.whatsapp,
      status: "active" as const,
      isFeatured: s.featured,
      bannerUrl: null,
      logoUrl: null,
    };
  });

  const insertedStores = await db.insert(storesTable).values(storeValues).returning();
  console.log(`  ✓ ${insertedStores.length} tiendas creadas en San Ramón`);

  // ── 5. Insertar 10 productos por tienda ───────────────────────────────────
  console.log("\n📦 Creando 10 productos por tienda (300 productos)...");
  let totalProducts = 0;

  for (const store of insertedStores) {
    const catSlug = STORES.find(s => s.name === store.name)?.catSlug || "abarrotes-bodega";
    const prods = PRODUCTS_BY_CATEGORY[catSlug] || PRODUCTS_BY_CATEGORY["abarrotes-bodega"];

    const productValues = prods.map((p, idx) => ({
      storeId: store.id,
      name: p.name,
      slug: `${slugify(p.name)}-${store.id}`,
      description: p.description,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      status: "active" as const,
      isFeatured: idx < 2,
      isOffer: idx === 0,
    }));

    const insertedProds = await db.insert(productsTable).values(productValues).returning();
    totalProducts += insertedProds.length;

    // Add one image per product
    for (let i = 0; i < insertedProds.length; i++) {
      await db.insert(productImagesTable).values({
        productId: insertedProds[i].id,
        url: getPhoto(catSlug, i),
        publicId: `mercanto/products/${catSlug}-${i}`,
        sortOrder: 0,
      });
    }
  }
  console.log(`  ✓ ${totalProducts} productos creados con imágenes`);

  // ── 6. Insertar reseñas ───────────────────────────────────────────────────
  console.log("\n⭐ Creando reseñas...");
  let totalReviews = 0;
  const allUsers = insertedUsers;

  for (const store of insertedStores) {
    const numReviews = 3 + Math.floor(Math.random() * 4); // 3-6 reviews
    for (let r = 0; r < numReviews; r++) {
      const reviewer = allUsers[Math.floor(Math.random() * allUsers.length)];
      await db.insert(reviewsTable).values({
        storeId: store.id,
        userId: reviewer.id,
        rating: 4 + Math.round(Math.random()),
        comment: pick(REVIEW_COMMENTS),
        isVisible: true,
      });
      totalReviews++;
    }
  }
  console.log(`  ✓ ${totalReviews} reseñas creadas`);

  // ── Final report ──────────────────────────────────────────────────────────
  console.log("\n✅ Seed completado:");
  console.log(`   📁 ${insertedCats.length} categorías`);
  console.log(`   👥 ${insertedUsers.length} usuarios (contraseña: User2024!)`);
  console.log(`   🏪 ${insertedStores.length} tiendas en San Ramón, Chanchamayo, Junín`);
  console.log(`   📦 ${totalProducts} productos (10 por tienda)`);
  console.log(`   ⭐ ${totalReviews} reseñas`);
  console.log("\n🔑 Admin sigue activo: admin@mercanto.pe / Admin2024!");
  process.exit(0);
}

main().catch(e => { console.error("❌ Error:", e); process.exit(1); });
