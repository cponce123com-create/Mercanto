import { db, usersTable, categoriesTable, storesTable, productsTable, productImagesTable, reviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jitter(base: number, amount = 0.004): string {
  return (base + (Math.random() - 0.5) * 2 * amount).toFixed(6);
}

function slugify(name: string): string {
  return name
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

// ─── District coordinates ─────────────────────────────────────────────────────

const COORDS: Record<string, { lat: number; lng: number }> = {
  "San Ramón":   { lat: -11.1297, lng: -75.3500 },
  "La Merced":   { lat: -11.0567, lng: -75.3247 },
  "Pichanaqui":  { lat: -10.9333, lng: -75.0167 },
  "Perené":      { lat: -10.9500, lng: -75.2833 },
  "Vitoc":       { lat: -11.2167, lng: -75.3000 },
};

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Frutas y Verduras",         slug: "frutas-verduras",         icon: "🍎", sortOrder: 1 },
  { name: "Café y Cacao",              slug: "cafe-cacao",              icon: "☕", sortOrder: 2 },
  { name: "Miel y Apicultura",         slug: "miel-apicultura",         icon: "🍯", sortOrder: 3 },
  { name: "Plantas y Hierbas",         slug: "plantas-hierbas",         icon: "🌿", sortOrder: 4 },
  { name: "Carnes y Pescados",         slug: "carnes-pescados",         icon: "🥩", sortOrder: 5 },
  { name: "Panadería y Pasteles",      slug: "panaderia-pasteles",      icon: "🥐", sortOrder: 6 },
  { name: "Abarrotes y Bodega",        slug: "abarrotes-bodega",        icon: "🛒", sortOrder: 7 },
  { name: "Bebidas y Jugos",           slug: "bebidas-jugos",           icon: "🧃", sortOrder: 8 },
  { name: "Ropa y Calzado",            slug: "ropa-calzado",            icon: "👗", sortOrder: 9 },
  { name: "Artesanía",                 slug: "artesania",               icon: "🧶", sortOrder: 10 },
  { name: "Ferretería y Construcción", slug: "ferreteria-construccion", icon: "🔧", sortOrder: 11 },
  { name: "Farmacia y Salud",          slug: "farmacia-salud",          icon: "💊", sortOrder: 12 },
  { name: "Belleza y Cuidado Personal",slug: "belleza-cuidado",         icon: "💄", sortOrder: 13 },
  { name: "Electrónica y Tecnología",  slug: "electronica-tecnologia",  icon: "📱", sortOrder: 14 },
  { name: "Hogar y Muebles",           slug: "hogar-muebles",           icon: "🏠", sortOrder: 15 },
  { name: "Mascotas",                  slug: "mascotas",                icon: "🐾", sortOrder: 16 },
  { name: "Transporte y Movilidad",    slug: "transporte-movilidad",    icon: "🚐", sortOrder: 17 },
  { name: "Servicios Técnicos",        slug: "servicios-tecnicos",      icon: "🛠️", sortOrder: 18 },
  { name: "Educación y Cursos",        slug: "educacion-cursos",        icon: "📚", sortOrder: 19 },
  { name: "Turismo y Hospedaje",       slug: "turismo-hospedaje",       icon: "🏕️", sortOrder: 20 },
  { name: "Agricultura e Insumos",     slug: "agricultura-insumos",     icon: "🌾", sortOrder: 21 },
  { name: "Otros",                     slug: "otros",                   icon: "📦", sortOrder: 22 },
];

// ─── Photo IDs by category ────────────────────────────────────────────────────

const PHOTOS: Record<string, string[]> = {
  "frutas-verduras":        ["photo-1610832958506-aa56368176cf", "photo-1550258987-190a2d41a8ba", "photo-1490474418585-ba9bad8fd0ea", "photo-1547514701-42782101795e"],
  "cafe-cacao":             ["photo-1447933601403-0c6688de566a", "photo-1559056199-641a0ac8b55e", "photo-1514432324607-a09d9b4aefdd"],
  "miel-apicultura":        ["photo-1558642452-9d2a7deb7f62", "photo-1587049352846-4a222e784d38"],
  "plantas-hierbas":        ["photo-1416879595882-3373a0480b5b", "photo-1509316785289-025f5b846b35"],
  "carnes-pescados":        ["photo-1607623814075-e51df1bdc82f", "photo-1544551763-46a013bb70d5", "photo-1559739733-beb5abd942ec"],
  "panaderia-pasteles":     ["photo-1509440159596-0249088772ff", "photo-1519915028121-7d3463d5b1ff", "photo-1501443762994-82bd5dace89a"],
  "abarrotes-bodega":       ["photo-1604719312566-8912e9227c6a", "photo-1534723452862-4c874986f0d8"],
  "bebidas-jugos":          ["photo-1534353436294-0dbd4bdac845", "photo-1473058664319-1c5a6316d4f1"],
  "ropa-calzado":           ["photo-1523381210434-271e8be1f52b", "photo-1542291026-7eec264c27ff", "photo-1558618666-fcd25c85cd64"],
  "artesania":              ["photo-1581783898377-1c85bf937427", "photo-1567225557594-88887e4e1f7a"],
  "ferreteria-construccion":["photo-1504148455328-c376907d081c", "photo-1558618047-3c8c76ca0d1d"],
  "farmacia-salud":         ["photo-1584308666744-24d5c474f2ae", "photo-1559757175-5700dde675bc"],
  "belleza-cuidado":        ["photo-1541643600914-78b084683702", "photo-1571781926291-c477ebfd024b"],
  "electronica-tecnologia": ["photo-1498049794561-7780e7231661", "photo-1505740420928-5e560c06d30e", "photo-1518770660439-4636190af475"],
  "hogar-muebles":          ["photo-1555041469-a586c61ea9bc", "photo-1556909114-f6e7ad7d3136"],
  "mascotas":               ["photo-1587300003388-59208cc962cb", "photo-1544568100-847a188d9bca"],
  "turismo-hospedaje":      ["photo-1469474968028-56623f02e42e", "photo-1533587851505-d119e13c8f76"],
  "agricultura-insumos":    ["photo-1500595046743-cd271d694d30", "photo-1416879595882-3373a0480b5b"],
  "servicios-tecnicos":     ["photo-1504148455328-c376907d081c"],
  "otros":                  ["photo-1560472354-b33ff0c44a43", "photo-1600093463592-8e36ae95ef56"],
};

function getPhoto(catSlug: string, idx: number): string {
  const photos = PHOTOS[catSlug] || PHOTOS["otros"];
  const id = photos[idx % photos.length];
  return `https://images.unsplash.com/${id}?w=400&q=80&auto=format&fit=crop`;
}

// ─── Stores data (30 stores) ──────────────────────────────────────────────────

interface StoreData {
  name: string; catSlug: string; district: string;
  location: string; whatsapp: string; description: string; featured: boolean;
}

const STORES: StoreData[] = [
  { name: "Frutería El Huerto Verde", catSlug: "frutas-verduras", district: "San Ramón",
    location: "Av. Mariscal Castilla 145, San Ramón", whatsapp: "51912000101",
    description: "La mejor frutería de San Ramón con productos directamente de las chacras locales. Ofrecemos naranjas, piñas, maracuyás y plátanos recién cosechados. Delivery dentro del distrito todos los días.", featured: true },

  { name: "Café del Bosque", catSlug: "cafe-cacao", district: "La Merced",
    location: "Jr. Tarma 320, La Merced", whatsapp: "51912000102",
    description: "Cafetería especializada en café de altura de Chanchamayo, tostado artesanal en el local. Nuestros granos se seleccionan a 1800 msnm para garantizar el mejor sabor. También vendemos cacao orgánico certificado.", featured: true },

  { name: "Carnicería Don Julio", catSlug: "carnes-pescados", district: "San Ramón",
    location: "Mercado Municipal Stand 22, San Ramón", whatsapp: "51912000103",
    description: "Carnes frescas de res, cerdo y pollo, traídas directamente de los criaderos locales de Chanchamayo. 30 años de experiencia garantizan la calidad y frescura de todos nuestros cortes. Abrimos de lunes a sábado desde las 5am.", featured: true },

  { name: "Panadería La Espiga Dorada", catSlug: "panaderia-pasteles", district: "La Merced",
    location: "Calle 2 de Mayo 88, La Merced", whatsapp: "51912000104",
    description: "Panadería familiar con 20 años haciendo el pan más esponjoso de La Merced. Elaboramos panes artesanales, tortas decoradas y pasteles con productos de la zona. Pedidos con anticipación para eventos y cumpleaños.", featured: true },

  { name: "Abarrotes La Economía", catSlug: "abarrotes-bodega", district: "Pichanaqui",
    location: "Av. Colonos Andinos 412, Pichanaqui", whatsapp: "51912000105",
    description: "La bodega más completa de Pichanaqui con los mejores precios de la zona. Contamos con arroz, azúcar, aceites, conservas y productos de limpieza al por menor y mayor. Atendemos de 6am a 10pm todos los días.", featured: true },

  { name: "Artesanías Selva Central", catSlug: "artesania", district: "San Ramón",
    location: "Jr. Chanchamayo 78, San Ramón", whatsapp: "51912000106",
    description: "Artesanías auténticas de las comunidades Asháninka y Yánesha de la selva central peruana. Cada pieza está elaborada a mano por artesanos locales con materiales naturales de la amazonia. Exportamos a todo el Perú y el extranjero.", featured: true },

  { name: "Miel Pura Chanchamayo", catSlug: "miel-apicultura", district: "Vitoc",
    location: "Sector Laguna Azul Km 5, Vitoc", whatsapp: "51912000107",
    description: "Productores de miel 100% pura de abeja en el valle de Vitoc, Chanchamayo. Nuestros apiarios están ubicados en zonas libres de contaminación rodeadas de bosques nativos. Ofrecemos miel cruda, propóleo y jalea real.", featured: false },

  { name: "Verduras Don Carlos", catSlug: "frutas-verduras", district: "Pichanaqui",
    location: "Mercado Grau Stand 8, Pichanaqui", whatsapp: "51912000108",
    description: "Verduras y hortalizas frescas cosechadas cada mañana en las chacras de Pichanaqui. Zanahoria, brócoli, tomate, lechuga y más a precios de campo. Ventas al por menor y mayor para restaurantes y negocios.", featured: false },

  { name: "Ropa y Calzado Styles", catSlug: "ropa-calzado", district: "La Merced",
    location: "Centro Comercial El Palmero Local 15, La Merced", whatsapp: "51912000109",
    description: "Tienda de moda con las últimas tendencias en ropa casual y calzado para toda la familia. Trabajamos con marcas nacionales e importadas a precios accesibles para la zona de Chanchamayo. Renovamos stock semanalmente.", featured: false },

  { name: "Farmacia Salud Total", catSlug: "farmacia-salud", district: "San Ramón",
    location: "Av. Principal 256, San Ramón", whatsapp: "51912000110",
    description: "Farmacia y botica con medicamentos genéricos y de marca a precios justos. Contamos con químico farmacéutico disponible para orientación médica gratuita. Delivery de medicamentos dentro de San Ramón sin costo adicional.", featured: false },

  { name: "Ferretería El Constructor", catSlug: "ferreteria-construccion", district: "La Merced",
    location: "Av. Los Colonos 512, La Merced", whatsapp: "51912000111",
    description: "Ferretería completa con materiales de construcción, herramientas eléctricas y plomería. Proveemos a maestros de obra y particulares con cemento, pinturas, cables y accesorios. Atención personalizada y asesoría técnica gratuita.", featured: false },

  { name: "Electrónica Tech Jungle", catSlug: "electronica-tecnologia", district: "San Ramón",
    location: "Jr. Junín 190, San Ramón", whatsapp: "51912000112",
    description: "Tienda de electrónica y tecnología con accesorios para celulares, laptops y consolas. Importamos directamente para ofrecer los mejores precios de Chanchamayo. Servicio técnico en garantía para todos nuestros productos.", featured: false },

  { name: "Plantas Medicinales Amazónicas", catSlug: "plantas-hierbas", district: "Perené",
    location: "Carretera Central Km 90, Perené", whatsapp: "51912000113",
    description: "Especialistas en plantas medicinales de la amazonía peruana, cultivadas sin pesticidas químicos. Ofrecemos uña de gato, chanca piedra, sangre de grado y otras plantas curativas milenarias. Vendemos frescas, secas y en extractos.", featured: false },

  { name: "Lácteos El Valle", catSlug: "abarrotes-bodega", district: "Vitoc",
    location: "Sector El Porvenir s/n, Vitoc", whatsapp: "51912000114",
    description: "Productos lácteos artesanales elaborados con leche fresca de vacas criadas en pastos naturales de Vitoc. Quesos, mantequillas y yogures elaborados diariamente sin conservantes. Delivery a La Merced y San Ramón los martes y viernes.", featured: false },

  { name: "Cacao Premium Selva", catSlug: "cafe-cacao", district: "Perené",
    location: "Av. Perené 88, Perené", whatsapp: "51912000115",
    description: "Productores de cacao orgánico certificado UTZ del valle del Perené, Chanchamayo. Procesamos pasta de cacao, manteca y chocolate artesanal bajo el concepto de bean-to-bar. Exportamos a Lima y Cusco.", featured: false },

  { name: "Bodega Central Pichanaqui", catSlug: "abarrotes-bodega", district: "Pichanaqui",
    location: "Plaza de Armas Local 3, Pichanaqui", whatsapp: "51912000116",
    description: "Bodega central de Pichanaqui con amplio stock de bebidas, snacks y productos de primera necesidad. Distribuidores oficiales de Coca-Cola, Inca Kola y Backus para la zona. Precios especiales por volumen para revendedores.", featured: false },

  { name: "Belleza y Spa Jungle", catSlug: "belleza-cuidado", district: "La Merced",
    location: "Jr. Huancayo 45, La Merced", whatsapp: "51912000117",
    description: "Centro de belleza y spa con tratamientos faciales, capilares y corporales usando ingredientes naturales amazónicos. Ofrecemos masajes relajantes, manicure, pedicure y tinte. Reservas por WhatsApp con 24 horas de anticipación.", featured: false },

  { name: "Juguetes y Regalos Kids", catSlug: "otros", district: "San Ramón",
    location: "Centro Comercial Chanchamayo Local 8, San Ramón", whatsapp: "51912000118",
    description: "La tienda de juguetes más completa de San Ramón con opciones para todas las edades y presupuestos. Juguetes educativos, bicicletas, muñecas y juegos de mesa de marcas reconocidas. Envíos a toda la provincia de Chanchamayo.", featured: false },

  { name: "Deportes Aventura Selva", catSlug: "otros", district: "San Ramón",
    location: "Av. Mariscal Miller 302, San Ramón", whatsapp: "51912000119",
    description: "Equipamiento completo para deportes de aventura y outdoor en la selva de Chanchamayo. Mochilas de trekking, carpas, botas de montaña y accesorios para kayak y rafting. Asesoramos en rutas y excursiones por la región.", featured: false },

  { name: "Lodge Turismo Verde", catSlug: "turismo-hospedaje", district: "Perené",
    location: "Carretera Perené-Satipo Km 8, Perené", whatsapp: "51912000120",
    description: "Lodge ecoturístico a orillas del río Perené con cabañas en medio de la selva virgen. Ofrecemos tours de avistamiento de aves, pesca deportiva, rafting y visitas a comunidades nativas Asháninka. Capacidad para 40 personas.", featured: false },

  { name: "Insumos Agrícolas Del Campo", catSlug: "agricultura-insumos", district: "La Merced",
    location: "Av. Progreso 670, La Merced", whatsapp: "51912000121",
    description: "Proveedor de insumos agrícolas para cafetaleros y cacaoteros de Chanchamayo. Fertilizantes, fungicidas, insecticidas orgánicos y herramientas de campo a precios de mayorista. Asistencia técnica gratuita en campo para nuestros clientes.", featured: false },

  { name: "Pescadería Río Chanchamayo", catSlug: "carnes-pescados", district: "San Ramón",
    location: "Jr. Perú 112, San Ramón", whatsapp: "51912000122",
    description: "Pescados y mariscos frescos extraídos del río Chanchamayo y la selva central peruana. Trucha, boquichico, gamitana y paiche disponibles según temporada. Ahumados y salados también disponibles para mayor duración.", featured: false },

  { name: "Heladería Tropical", catSlug: "panaderia-pasteles", district: "La Merced",
    location: "Pasaje San Martín 34, La Merced", whatsapp: "51912000123",
    description: "Heladería artesanal con sabores tropicales únicos de Chanchamayo: mango, maracuyá, camu camu y lúcuma. Elaboramos nuestros helados a diario con fruta fresca de la zona, sin colorantes artificiales. Ideal para el calor de la selva.", featured: false },

  { name: "Librería y Útiles El Saber", catSlug: "otros", district: "Pichanaqui",
    location: "Calle Libertad 28, Pichanaqui", whatsapp: "51912000124",
    description: "Librería completa con útiles escolares, papelería y artículos de oficina para toda la familia. Cuadernos, lapiceros, mochilas y todo lo necesario para el inicio del año escolar. Fotocopias, impresiones y laminados también disponibles.", featured: false },

  { name: "Mecánica y Servicios Rapid", catSlug: "servicios-tecnicos", district: "San Ramón",
    location: "Av. Industrial 445, San Ramón", whatsapp: "51912000125",
    description: "Taller mecánico especializado en autos, motos y maquinaria agrícola de Chanchamayo. Cambio de aceite, frenos, sistema eléctrico y mecánica general a domicilio. 15 años de experiencia y técnicos certificados.", featured: false },

  { name: "Frutería Tropical Perené", catSlug: "frutas-verduras", district: "Perené",
    location: "Mercado de Perené Stand 5, Perené", whatsapp: "51912000126",
    description: "Frutas exóticas de la selva del Perené: aguaymanto, camu camu, cocona, lúcuma y pitahaya orgánicas. Cosecha directa de los productores locales garantiza frescura y precios sin intermediarios. Exportamos a Lima semanalmente.", featured: false },

  { name: "Café Aroma Andino", catSlug: "cafe-cacao", district: "Vitoc",
    location: "Sector Huancabamba s/n, Vitoc", whatsapp: "51912000127",
    description: "Micro-tostadora de café de especialidad ubicada en el corazón de Vitoc, Chanchamayo. Nuestro café es cultivado a 1900 msnm en suelos volcánicos que le dan su característico aroma y cuerpo. Puntaje Q-grader: 84 puntos.", featured: false },

  { name: "Pollería y Comida La Selva", catSlug: "carnes-pescados", district: "La Merced",
    location: "Av. Tarma 200, La Merced", whatsapp: "51912000128",
    description: "La mejor pollería a la brasa de La Merced con pollo criado en granja propia sin hormonas. También servimos anticuchos, parrillas y comida selvática típica de Chanchamayo. Pedidos por WhatsApp con 1 hora de anticipación.", featured: false },

  { name: "Hogar y Decoración Chanchamayo", catSlug: "hogar-muebles", district: "San Ramón",
    location: "Calle Colón 89, San Ramón", whatsapp: "51912000129",
    description: "Tienda de artículos para el hogar con electrodomésticos, lencería y decoración a precios competitivos. Importamos directamente desde Lima para ofrecer las mejores marcas en Chanchamayo. Envíos a toda la provincia sin costo adicional.", featured: false },

  { name: "Mascotas y Accesorios PetShop", catSlug: "mascotas", district: "La Merced",
    location: "Jr. Progreso 156, La Merced", whatsapp: "51912000130",
    description: "La primera petshop completa de La Merced con alimentos, accesorios y veterinaria para mascotas. Atendemos perros, gatos, aves y reptiles con los mejores productos nacionales e importados. Servicio de baño y corte de pelo disponible.", featured: false },
];

// ─── Products per store ────────────────────────────────────────────────────────

interface ProdData {
  name: string; price: string; offerPrice?: string;
  stock: number; unit: string; description: string;
}

const PRODUCTS: Record<string, ProdData[]> = {
  "Frutería El Huerto Verde": [
    { name: "Naranja Dulce de Chanchamayo", price: "8.00", offerPrice: "5.50", stock: 80, unit: "kg", description: "Naranjas dulces y jugosas cultivadas a 1200 msnm en las laderas de Chanchamayo. Sin pesticidas, ideales para jugos y consumo directo." },
    { name: "Piña Tropical Selva", price: "10.00", offerPrice: "6.50", stock: 40, unit: "unidad", description: "Piñas maduras y dulces de la selva central, peso promedio 1.5kg. Perfectas para jugos, mermeladas y postres tropicales." },
    { name: "Maracuyá Fresco", price: "12.00", stock: 50, unit: "kg", description: "Maracuyá fresco de alta acidez, ideal para jugos, refrescos y repostería. Cultivado orgánicamente en fincas del valle." },
    { name: "Plátano de la Selva", price: "5.00", offerPrice: "3.50", stock: 60, unit: "racimo", description: "Plátano de isla fresco y maduro, dulce y suave. Excelente para consumo directo, tostones y chicha de plátano." },
    { name: "Limón Tahití", price: "6.00", stock: 70, unit: "kg", description: "Limón tahití jugoso y aromático, indispensable en la cocina peruana. Bajo en semillas y alto en jugo." },
    { name: "Papaya Maradol", price: "9.00", offerPrice: "6.00", stock: 30, unit: "unidad", description: "Papaya maradol fresca de pulpa naranja, dulce y nutritiva. Excelente fuente de vitamina C y enzimas digestivas." },
    { name: "Mango Criollo", price: "7.00", stock: 45, unit: "kg", description: "Mango criollo de temporada, fibroso y dulce con piel verde-amarilla. Ideal para jugos, mermeladas y consumo fresco." },
    { name: "Tomate Orgánico", price: "6.00", offerPrice: "4.00", stock: 55, unit: "kg", description: "Tomate orgánico de campo abierto, firme y con excelente sabor. Libre de pesticidas, ideal para ensaladas y salsas." },
    { name: "Cebolla Morada", price: "5.00", stock: 60, unit: "kg", description: "Cebolla morada fresca de la sierra, tamaño mediano-grande. Esencial para el ceviche y la cocina peruana en general." },
    { name: "Ají Amarillo Fresco", price: "8.00", offerPrice: "5.50", stock: 35, unit: "kg", description: "Ají amarillo fresco de Chanchamayo, aromático y de picante moderado. Ingrediente clave de la gastronomía peruana." },
  ],

  "Café del Bosque": [
    { name: "Café Molido Premium 500g", price: "35.00", offerPrice: "28.00", stock: 60, unit: "bolsa", description: "Café arábica molido de altura, tostado medio, con notas de chocolate y frutos rojos. Certificado orgánico por Biolatina." },
    { name: "Café en Grano Arábica 1kg", price: "65.00", stock: 40, unit: "bolsa", description: "Granos de café arábica enteros para moler en casa, cosecha reciente del valle de Chanchamayo. Perfil de sabor complejo y balanceado." },
    { name: "Café Tostado Oscuro 250g", price: "22.00", offerPrice: "18.00", stock: 50, unit: "bolsa", description: "Tostado oscuro con cuerpo intenso y amargor pronunciado, ideal para espresso. Mezcla de varietales caturra y bourbon." },
    { name: "Cacao Orgánico en Polvo 200g", price: "28.00", stock: 45, unit: "bolsa", description: "Cacao en polvo puro sin azúcar, producido en Perené. Ideal para repostería, batidos proteicos y bebidas calientes." },
    { name: "Chocolate Bitter 70% Cacao", price: "18.00", offerPrice: "14.00", stock: 55, unit: "barra", description: "Chocolate negro 70% cacao bean-to-bar, elaborado con granos seleccionados del Perené. Sin aditivos artificiales." },
    { name: "Café Filtrante x10 sobres", price: "15.00", stock: 70, unit: "caja", description: "Café filtrante práctico para preparar en taza, mezcla premium de café de Chanchamayo. Aroma intenso y sabor balanceado." },
    { name: "Té de Hoja de Coca 20 sobres", price: "12.00", offerPrice: "9.00", stock: 80, unit: "caja", description: "Té de hoja de coca natural del Perú, alivia el mal de altura y la fatiga. Suave y aromático, sin efectos psicoactivos." },
    { name: "Café Verde Sin Tostar 500g", price: "30.00", stock: 30, unit: "bolsa", description: "Café verde (sin tostar) para preparar bebida adelgazante o tostar en casa. Rico en ácido clorogénico antioxidante." },
    { name: "Nibs de Cacao Orgánico 150g", price: "20.00", offerPrice: "15.00", stock: 40, unit: "bolsa", description: "Granos de cacao fermentado y troceado, sin azúcar. Excelente para granola, yogur y repostería saludable." },
    { name: "Mezcla Café Chanchamayo Especial", price: "45.00", stock: 25, unit: "bolsa", description: "Blend exclusivo de tres varietales de café de Chanchamayo, perfil de taza: cuerpo pleno, acidez suave y final limpio." },
  ],

  "Carnicería Don Julio": [
    { name: "Pollo Entero Fresco 2kg", price: "22.00", offerPrice: "18.00", stock: 50, unit: "unidad", description: "Pollo entero fresco de crianza local, sin hormonas. Peso promedio 2kg, ideal para hornear o preparar caldo." },
    { name: "Carne de Res Bistec 1kg", price: "36.00", stock: 40, unit: "kg", description: "Bistec de res fresco cortado al momento, ideal para saltado, lomo saltado y a la plancha." },
    { name: "Costilla de Cerdo 1kg", price: "28.00", offerPrice: "22.00", stock: 35, unit: "kg", description: "Costillas frescas de cerdo, perfectas para adobo, chicharrón y parrilla." },
    { name: "Hígado de Res 1kg", price: "18.00", stock: 40, unit: "kg", description: "Hígado fresco de res, rico en hierro y vitaminas. Ideal para el guiso de hígado encebollado." },
    { name: "Pollo Troceado 1kg", price: "14.00", offerPrice: "11.00", stock: 55, unit: "kg", description: "Pollo troceado fresco (presa mixta), listo para guisar o freír. Cortado al momento de su pedido." },
    { name: "Carne Molida de Res 1kg", price: "30.00", stock: 45, unit: "kg", description: "Carne molida fresca de res, ideal para hamburguesas caseras, pastel de carne y rellenos." },
    { name: "Chicharrón de Cerdo 500g", price: "20.00", offerPrice: "16.00", stock: 30, unit: "porción", description: "Chicharrón de cerdo crujiente preparado al momento, servido con camote y mote." },
    { name: "Anticucho de Corazón x8", price: "16.00", stock: 40, unit: "porción", description: "Anticuchos marinados en ají panca y especias, listos para la parrilla. 8 palitos por porción." },
    { name: "Cecina de Cerdo 500g", price: "25.00", offerPrice: "20.00", stock: 20, unit: "porción", description: "Cecina ahumada artesanalmente, especialidad selvática de Chanchamayo. Perfecta para juane y tacacho." },
    { name: "Carne de Alpaca 1kg", price: "42.00", stock: 15, unit: "kg", description: "Carne magra y nutritiva de alpaca, baja en grasa y alta en proteínas. Sabor suave y textura tierna." },
  ],

  "Panadería La Espiga Dorada": [
    { name: "Pan de Yema Docena", price: "12.00", offerPrice: "9.00", stock: 60, unit: "docena", description: "Pan de yema esponjoso y dorado, elaborado con huevos frescos locales. La especialidad de La Espiga Dorada." },
    { name: "Pan Francés Docena", price: "8.00", stock: 80, unit: "docena", description: "Pan francés crujiente por fuera y suave por dentro, horneado en horno de leña tres veces al día." },
    { name: "Torta de Cumpleaños Personalizada", price: "80.00", offerPrice: "65.00", stock: 10, unit: "unidad", description: "Torta decorada al gusto, sabores variados: chocolate, vainilla, lúcuma y maracuyá. Pedidos con 48h anticipación." },
    { name: "Empanadas de Pollo x6", price: "18.00", stock: 40, unit: "porción", description: "Empanadas horneadas rellenas de pollo guisado con verduras. Masa hojaldrada y crujiente, sin aceite de freír." },
    { name: "Picarones con Miel", price: "10.00", offerPrice: "8.00", stock: 30, unit: "porción", description: "Picarones fritos de zapallo y camote, servidos con chancaca y miel de caña. Postre tradicional peruano." },
    { name: "Pan Integral Multigrano", price: "10.00", stock: 50, unit: "bolsa", description: "Pan integral de 500g con semillas de chía, quinua y avena. Nutritivo y apto para dietas saludables." },
    { name: "Rosca de Anís Grande", price: "15.00", offerPrice: "12.00", stock: 20, unit: "unidad", description: "Rosca esponjosa con anís y ajonjolí, tradicional de la selva central. Perfecta para el desayuno." },
    { name: "Galletas de Mantequilla x12", price: "14.00", stock: 45, unit: "caja", description: "Galletas artesanales de mantequilla, crujientes y levemente dulces. Elaboradas sin preservantes ni colorantes." },
    { name: "Bizcocho de Selva 500g", price: "16.00", offerPrice: "13.00", stock: 25, unit: "unidad", description: "Bizcocho húmedo con sabor a maracuyá y coco rallado, receta familiar exclusiva de la panadería." },
    { name: "Panetón Artesanal 900g", price: "35.00", stock: 15, unit: "unidad", description: "Panetón artesanal con frutas confitadas y pasas, elaborado con masa madre. Sabor superior al industrial." },
  ],

  "Abarrotes La Economía": [
    { name: "Arroz Extra Costeño 5kg", price: "28.00", offerPrice: "24.00", stock: 100, unit: "bolsa", description: "Arroz extra costeño de grano largo, ideal para todo tipo de preparaciones. Buena relación calidad-precio." },
    { name: "Azúcar Blanca Rubia 5kg", price: "22.00", stock: 80, unit: "bolsa", description: "Azúcar blanca refinada de primera calidad para uso doméstico y comercial. Marca Nacional." },
    { name: "Aceite Vegetal Primor 1L", price: "9.00", offerPrice: "7.50", stock: 90, unit: "botella", description: "Aceite vegetal de girasol sin colesterol, ideal para frituras y aderezos. Presentación de 1 litro." },
    { name: "Fideos Spaghetti 500g", price: "4.50", stock: 100, unit: "bolsa", description: "Fideos de trigo durum, tiempo de cocción 8 minutos. Listos para todo tipo de preparaciones italianas." },
    { name: "Leche Gloria Evaporada", price: "5.50", offerPrice: "4.50", stock: 80, unit: "lata", description: "Leche evaporada Gloria, enriquecida con vitaminas A y D. Ideal para café, mazamorra y arroz con leche." },
    { name: "Atún Primor en Aceite 170g", price: "6.50", stock: 70, unit: "lata", description: "Atún light en aceite vegetal, rico en proteínas y omega-3. Sin preservantes artificiales." },
    { name: "Detergente Ariel 4kg", price: "38.00", offerPrice: "32.00", stock: 50, unit: "bolsa", description: "Detergente Ariel para ropa con fragancia fresca, efectivo para toda clase de manchas." },
    { name: "Sal de Mesa Emsal 1kg", price: "2.50", stock: 100, unit: "bolsa", description: "Sal yodada y fluorada de mesa, presentación de 1kg. Producto esencial del hogar." },
    { name: "Jabón de Tocador Lux x3", price: "7.00", offerPrice: "5.50", stock: 60, unit: "pack", description: "Jabón Lux fragancia floral, pack de 3 unidades. Suave para la piel y duradero." },
    { name: "Harina Sin Preparar Blancaflor 1kg", price: "6.00", stock: 75, unit: "bolsa", description: "Harina de trigo sin preparar para pan, tortas y rebozados. Calidad garantizada Blancaflor." },
  ],

  "Artesanías Selva Central": [
    { name: "Cushma Asháninka Adulto", price: "120.00", offerPrice: "95.00", stock: 15, unit: "unidad", description: "Cushma tejida a mano con hilo de algodón natural, diseño tradicional Asháninka con motivos geométricos. Talla única adjustable." },
    { name: "Collar de Semillas Amazónicas", price: "35.00", stock: 30, unit: "unidad", description: "Collar artesanal con semillas nativas de la amazonia peruana, huayruro y shapaja. Cada pieza es única." },
    { name: "Bolsa Tejida Yánesha", price: "55.00", offerPrice: "45.00", stock: 20, unit: "unidad", description: "Bolsa tejida con fibra de chambira por artesanas Yánesha, diseño geométrico y resistente. Ideal para el mercado." },
    { name: "Arco y Flecha Decorativo", price: "80.00", stock: 10, unit: "unidad", description: "Arco y flecha decorativos elaborados con madera de chonta y plumas naturales. Pieza coleccionable de la selva." },
    { name: "Pulsera de Chaquira Tradicional", price: "20.00", offerPrice: "15.00", stock: 50, unit: "unidad", description: "Pulsera tejida con chaquiras de colores en diseños geométricos Asháninka. Elástica y ajustable." },
    { name: "Cerámica Pintada a Mano", price: "65.00", stock: 12, unit: "unidad", description: "Cerámica de arcilla pintada con motivos amazónicos, quemada en horno artesanal. Funcional y decorativa." },
    { name: "Tapiz Amazónico 60x90cm", price: "150.00", offerPrice: "120.00", stock: 8, unit: "unidad", description: "Tapiz tejido a telar con escenas de la vida en la amazonia. Lana y algodón natural, sin teñidos artificiales." },
    { name: "Máscara de Madera Tallada", price: "90.00", stock: 10, unit: "unidad", description: "Máscara tallada en madera de cedro con figuras del folklore amazónico. Pintada con tintes naturales." },
    { name: "Llavero Artesanal de Semillas", price: "12.00", offerPrice: "9.00", stock: 60, unit: "unidad", description: "Llavero artesanal con semillas de huayruro y chaquiras de colores. Símbolo de buena suerte." },
    { name: "Pañuelo con Bordado Selva", price: "25.00", stock: 25, unit: "unidad", description: "Pañuelo de algodón bordado a mano con motivos florales y animales de la selva amazónica peruana." },
  ],

  "Miel Pura Chanchamayo": [
    { name: "Miel de Abeja Pura 1kg", price: "45.00", offerPrice: "38.00", stock: 40, unit: "frasco", description: "Miel cruda sin filtrar de apiarios de Vitoc, Chanchamayo. Cristalización natural garantiza su pureza. Sin aditivos." },
    { name: "Miel con Polen de Flor 500g", price: "32.00", stock: 35, unit: "frasco", description: "Miel enriquecida con polen de flor de café y flores silvestres. Excelente para fortalecer el sistema inmune." },
    { name: "Propóleo Natural 30ml", price: "22.00", offerPrice: "18.00", stock: 50, unit: "frasco", description: "Propóleo líquido de alta concentración (30% extracto), antibacteriano y antifúngico natural." },
    { name: "Jalea Real Fresca 50g", price: "55.00", stock: 20, unit: "frasco", description: "Jalea real fresca refrigerada, con alta concentración de proteínas y vitaminas B. Poderoso energizante natural." },
    { name: "Polen de Abeja 200g", price: "28.00", offerPrice: "22.00", stock: 30, unit: "bolsa", description: "Polen recolectado en los apiarios de Vitoc, rico en proteínas, aminoácidos y vitaminas. Superalimento." },
    { name: "Miel de Abeja 250g", price: "18.00", stock: 55, unit: "frasco", description: "Presentación familiar de 250g de miel pura de Chanchamayo, ideal para regalo o uso personal diario." },
    { name: "Cera de Abeja Natural 100g", price: "15.00", offerPrice: "12.00", stock: 40, unit: "bloque", description: "Cera de abeja pura para cosmética natural, velas artesanales y cuidado de maderas. Sin blanqueadores." },
    { name: "Miel con Jengibre 350g", price: "30.00", stock: 30, unit: "frasco", description: "Miel de abeja mezclada con jengibre fresco, potencia las propiedades antigripales y digestivas." },
    { name: "Vela de Cera de Abeja", price: "20.00", offerPrice: "16.00", stock: 25, unit: "unidad", description: "Vela artesanal de cera de abeja pura con mecha de algodón natural. Arde más limpio y duradero que la parafina." },
    { name: "Miel de Eucalipto 500g", price: "35.00", stock: 20, unit: "frasco", description: "Miel monofloral de eucalipto con propiedades expectorantes y broncodilatadoras. Ideal para la tos y resfríos." },
  ],

  "Verduras Don Carlos": [
    { name: "Zanahoria Fresca 1kg", price: "4.00", offerPrice: "2.80", stock: 80, unit: "kg", description: "Zanahoria fresca de huerta propia, mediano calibre y coloración intensa. Rica en betacaroteno y vitamina A." },
    { name: "Brócoli Orgánico por kilo", price: "6.00", stock: 60, unit: "kg", description: "Brócoli orgánico recién cortado, sin pesticidas. Excelente para vapor, salteado y ensaladas." },
    { name: "Tomate Rojo Fresco 1kg", price: "5.00", offerPrice: "3.50", stock: 70, unit: "kg", description: "Tomate firme y rojo de campo abierto, ideal para ensaladas, salsas y guisos." },
    { name: "Espinaca Fresca 500g", price: "4.00", stock: 55, unit: "atado", description: "Espinaca tierna y fresca, cosechada en la mañana. Rica en hierro, calcio y ácido fólico." },
    { name: "Lechuga Hidropónica", price: "5.50", offerPrice: "4.00", stock: 50, unit: "unidad", description: "Lechuga hidropónica de cabeza redonda, sin tierra y libre de pesticidas. Crujiente y de larga duración." },
    { name: "Betarraga Mediana 1kg", price: "5.00", stock: 60, unit: "kg", description: "Betarraga fresca de buen tamaño, perfecta para ensalada rusa, jugos detox y encurtidos." },
    { name: "Coliflor Grande", price: "7.00", offerPrice: "5.00", stock: 35, unit: "unidad", description: "Coliflor de cabeza grande y blanca, sin manchas. Ideal para gratinados, purés y ensaladas." },
    { name: "Pepino Fresco 1kg", price: "4.00", stock: 65, unit: "kg", description: "Pepino verde fresco y crujiente, con o sin semilla. Excelente para ensaladas y agua infusionada." },
    { name: "Pimiento Rojo 1kg", price: "8.00", offerPrice: "6.00", stock: 45, unit: "kg", description: "Pimiento rojo maduro y carnoso, alto en vitamina C. Perfecto para saltados, pizzas y ensaladas." },
    { name: "Choclo Desgranado 500g", price: "5.00", stock: 50, unit: "bolsa", description: "Choclo peruano desgranado y cocido, listo para consumir. Para chicha morada, tamales y sopas." },
  ],

  "Ropa y Calzado Styles": [
    { name: "Camisa Casual Hombre", price: "65.00", offerPrice: "52.00", stock: 30, unit: "unidad", description: "Camisa de algodón manga larga, diseño moderno, disponible en 5 colores y tallas S al XL." },
    { name: "Polo Básico de Algodón", price: "35.00", stock: 50, unit: "unidad", description: "Polo de algodón 100% suave y transpirable, tallas XS-XXL. Clásico que combina con todo." },
    { name: "Zapatillas Deportivas Hombre", price: "150.00", offerPrice: "120.00", stock: 20, unit: "par", description: "Zapatillas deportivas con suela de caucho, ideales para caminata y ejercicio diario. Tallas 38-44." },
    { name: "Sandalias de Playa Mujer", price: "55.00", stock: 25, unit: "par", description: "Sandalias resistentes al agua, perfectas para el clima cálido de Chanchamayo. Tallas 35-40." },
    { name: "Vestido Floral Mujer", price: "85.00", offerPrice: "70.00", stock: 20, unit: "unidad", description: "Vestido ligero con estampado floral, ideal para el calor de la selva. Tela transpirable, tallas S-XL." },
    { name: "Jean Clásico Hombre", price: "95.00", stock: 25, unit: "unidad", description: "Jean de mezclilla azul clásico, corte recto y resistente. Marcas nacionales, tallas 28-38." },
    { name: "Casaca Polar Mujer", price: "110.00", offerPrice: "88.00", stock: 15, unit: "unidad", description: "Casaca de polar abrigadora, ideal para noches frías en las alturas de Chanchamayo. Tallas S-XL." },
    { name: "Short Deportivo Unisex", price: "45.00", stock: 35, unit: "unidad", description: "Short deportivo de lycra con bolsillos, liviano y cómodo para el ejercicio en clima cálido." },
    { name: "Calcetines Deportivos Pack x6", price: "30.00", offerPrice: "24.00", stock: 40, unit: "pack", description: "Pack de 6 pares de calcetines deportivos con refuerzo en talón y puntera. Tallas 35-42." },
    { name: "Gorra con Visera Bordada", price: "40.00", stock: 30, unit: "unidad", description: "Gorra de tela ajustable con visera, protege del sol del trópico. Diseños variados disponibles." },
  ],

  "Farmacia Salud Total": [
    { name: "Paracetamol 500mg x100", price: "12.00", offerPrice: "9.50", stock: 60, unit: "caja", description: "Paracetamol genérico 500mg para alivio del dolor y fiebre. 100 comprimidos, presentación económica." },
    { name: "Ibuprofeno 400mg x30", price: "18.00", stock: 50, unit: "caja", description: "Ibuprofeno antiinflamatorio 400mg, indicado para dolor muscular, articular y fiebre." },
    { name: "Vitamina C 1000mg x60", price: "35.00", offerPrice: "28.00", stock: 40, unit: "frasco", description: "Vitamina C efervescente 1000mg para fortalecer el sistema inmune. Sabor naranja, 60 comprimidos." },
    { name: "Mascarillas N95 x10", price: "25.00", stock: 70, unit: "caja", description: "Mascarillas N95 certificadas, filtración de partículas finas. Pack de 10 unidades desechables." },
    { name: "Alcohol 70% 1 Litro", price: "15.00", offerPrice: "12.00", stock: 80, unit: "frasco", description: "Alcohol isopropílico 70% para desinfección de heridas y superficies. Presentación de 1 litro." },
    { name: "Termómetro Digital Infrarrojo", price: "45.00", stock: 25, unit: "unidad", description: "Termómetro infrarrojo sin contacto para frente, resultado en 1 segundo. Memoria de 32 lecturas." },
    { name: "Vendas Elásticas 10cm x3", price: "14.00", offerPrice: "11.00", stock: 35, unit: "pack", description: "Venda elástica autoadhesiva 10cm de ancho, pack de 3 unidades. Para torceduras y esguinces." },
    { name: "Antigripal NyQuil DayQuil", price: "22.00", stock: 40, unit: "caja", description: "Antigripal para síntomas de gripe y resfriado: congestión, tos y fiebre. Día y noche." },
    { name: "Omeprazol 20mg x30", price: "28.00", offerPrice: "22.00", stock: 45, unit: "caja", description: "Omeprazol protector gástrico 20mg, reduce la acidez y úlceras. 30 cápsulas con cubierta entérica." },
    { name: "Jabón Antibacterial Dettol 250ml", price: "12.00", stock: 60, unit: "frasco", description: "Jabón líquido antibacterial Dettol para manos, elimina el 99.9% de gérmenes." },
  ],

  "Ferretería El Constructor": [
    { name: "Cemento Sol Rápido 25kg", price: "38.00", offerPrice: "32.00", stock: 30, unit: "bolsa", description: "Cemento de fraguado rápido tipo I, ideal para reparaciones urgentes y construcción general." },
    { name: "Pintura Látex Blanco 4L", price: "55.00", stock: 20, unit: "galón", description: "Pintura látex lavable base agua, rendimiento 40m² por galón. Acabado mate resistente." },
    { name: "Tornillos Autotaladrantes x100", price: "18.00", offerPrice: "14.00", stock: 50, unit: "caja", description: "Tornillos autotaladrantes 3.5x25mm de acero inoxidable, para madera y drywall. Caja x100." },
    { name: "Cinta Métrica 5m Stanley", price: "25.00", stock: 35, unit: "unidad", description: "Cinta métrica Stanley de acero, 5 metros con freno de bloqueo y carcasa de goma antideslizante." },
    { name: "Nivel de Burbuja 60cm", price: "32.00", offerPrice: "26.00", stock: 20, unit: "unidad", description: "Nivel de aluminio 60cm con 3 burbujas, precisión ±0.5mm/m. Con escala en ambas caras." },
    { name: "Taladro Percutor 650W", price: "180.00", stock: 10, unit: "unidad", description: "Taladro percutor 650W con maletín y 15 brocas incluidas. Función percutor para mampostería." },
    { name: "Brocha de Pintar 3 pulgadas", price: "12.00", offerPrice: "9.00", stock: 40, unit: "unidad", description: "Brocha para pintura de 3 pulgadas con cerdas sintéticas, mango ergonómico de madera." },
    { name: "Caño Galvanizado 1 pulgada", price: "22.00", stock: 25, unit: "unidad", description: "Caño galvanizado de 1 pulgada x 6m para instalaciones de agua. Rosca estándar BSP." },
    { name: "Martillo de Carpintero 16oz", price: "35.00", offerPrice: "28.00", stock: 20, unit: "unidad", description: "Martillo de acero forjado 16oz con mango de fibra de vidrio antivibración." },
    { name: "Extensión Eléctrica 10m", price: "45.00", stock: 15, unit: "unidad", description: "Extensión eléctrica 10m con 4 tomacorrientes y protector de sobrecarga. Cable de 1.5mm²." },
  ],

  "Electrónica Tech Jungle": [
    { name: "Audífonos Bluetooth 5.0", price: "85.00", offerPrice: "69.00", stock: 25, unit: "unidad", description: "Audífonos inalámbricos con cancelación de ruido, autonomía 20h. Conecta hasta 2 dispositivos." },
    { name: "Cable USB-C 1.5m Trenzado", price: "18.00", stock: 40, unit: "unidad", description: "Cable USB-C de nylon trenzado, carga rápida 60W. Compatible con Android, iPad y MacBook." },
    { name: "Cargador Rápido 45W USB-C", price: "65.00", offerPrice: "52.00", stock: 20, unit: "unidad", description: "Cargador GaN 45W USB-C con tecnología de carga rápida PD 3.0. Compacto y eficiente." },
    { name: "Foco LED Smart 12W Wifi", price: "35.00", stock: 30, unit: "unidad", description: "Foco LED inteligente 12W controlable desde el celular, 16 millones de colores RGB. Base E27." },
    { name: "Router WiFi 6 Dual Band", price: "220.00", offerPrice: "180.00", stock: 10, unit: "unidad", description: "Router WiFi 6 con velocidad hasta 1800Mbps, cobertura 120m², 4 antenas externas." },
    { name: "Power Bank 10000mAh", price: "75.00", stock: 20, unit: "unidad", description: "Power bank 10000mAh con carga rápida dual, 2 salidas USB y 1 USB-C. Pantalla LED indicadora." },
    { name: "Mousepad Gaming XL 90x40cm", price: "45.00", offerPrice: "36.00", stock: 15, unit: "unidad", description: "Mousepad gaming de tela extra grande 90x40cm con base antideslizante de caucho natural." },
    { name: "Cable HDMI 2.0 2 metros", price: "28.00", stock: 30, unit: "unidad", description: "Cable HDMI 2.0 4K 60Hz con conector dorado, ideal para TV, monitor y proyector." },
    { name: "Webcam 1080p con Micrófono", price: "120.00", offerPrice: "95.00", stock: 12, unit: "unidad", description: "Webcam Full HD 1080p con micrófono integrado y corrección automática de luz. Plug & play." },
    { name: "Teclado Inalámbrico Compacto", price: "95.00", stock: 15, unit: "unidad", description: "Teclado inalámbrico 2.4GHz con batería recargable de 30 días. Diseño silencioso y compacto." },
  ],

  "Plantas Medicinales Amazónicas": [
    { name: "Uña de Gato 100g Seco", price: "22.00", offerPrice: "18.00", stock: 40, unit: "bolsa", description: "Uña de gato (Uncaria tomentosa) seca y triturada, poderoso antiinflamatorio natural de la amazonia." },
    { name: "Chanca Piedra 100g", price: "18.00", stock: 50, unit: "bolsa", description: "Chanca piedra (Phyllanthus niruri) para tratamiento de cálculos renales y vesiculares. 100% natural." },
    { name: "Sangre de Grado 30ml", price: "25.00", offerPrice: "20.00", stock: 35, unit: "frasco", description: "Látex de sangre de grado (Croton lechleri) para cicatrización acelerada de heridas internas y externas." },
    { name: "Copaiba 30ml", price: "30.00", stock: 30, unit: "frasco", description: "Aceite de copaiba (Copaifera officinalis) antiinflamatorio y antibacteriano, uso tópico e interno." },
    { name: "Hierba Luisa Fresca 500g", price: "8.00", offerPrice: "6.00", stock: 60, unit: "atado", description: "Hierba luisa fresca cortada, relajante y digestiva. Ideal para té caliente o frío." },
    { name: "Jengibre Fresco 500g", price: "10.00", stock: 55, unit: "kg", description: "Jengibre fresco de la selva, antiinflamatorio y digestivo. Para infusiones, jugos y cocina." },
    { name: "Cúrcuma en Polvo 150g", price: "20.00", offerPrice: "16.00", stock: 40, unit: "bolsa", description: "Cúrcuma molida de alta curcumina, potente antiinflamatorio y antioxidante. Uso en cocina y salud." },
    { name: "Malva Seca 100g", price: "12.00", stock: 45, unit: "bolsa", description: "Malva seca para infusión, antiinflamatoria y expectorante. Calma la garganta y las vías respiratorias." },
    { name: "Eucalipto Hojas Frescas 500g", price: "8.00", offerPrice: "6.00", stock: 50, unit: "atado", description: "Hojas frescas de eucalipto para vaporizaciones, infusiones y alivio de la congestión nasal." },
    { name: "Muña Seca 100g", price: "15.00", stock: 35, unit: "bolsa", description: "Muña andina seca, favorece la digestión y reduce el dolor de estómago. Endémica de los Andes peruanos." },
  ],

  "Lácteos El Valle": [
    { name: "Queso Fresco Artesanal 500g", price: "22.00", offerPrice: "18.00", stock: 40, unit: "unidad", description: "Queso fresco sin sal elaborado con leche de vacas de pasto natural en Vitoc. Suave y cremoso." },
    { name: "Mantequilla Artesanal 200g", price: "18.00", stock: 35, unit: "frasco", description: "Mantequilla pura de crema de leche, sin aditivos. Elaborada diariamente en el fundo de Vitoc." },
    { name: "Yogurt Natural 500g", price: "14.00", offerPrice: "11.00", stock: 50, unit: "frasco", description: "Yogurt natural sin azúcar con cultivos activos. Excelente para el intestino y probiótico natural." },
    { name: "Leche Fresca Pasteurizada 1L", price: "6.00", stock: 70, unit: "botella", description: "Leche fresca pasteurizada de vaca criolla, sin hormonas. Entregada diariamente en el local." },
    { name: "Queso Andino Semimaduro 500g", price: "28.00", offerPrice: "23.00", stock: 25, unit: "unidad", description: "Queso semimaduro de 30 días de maduración, consistente y de sabor pronunciado." },
    { name: "Crema de Leche 200ml", price: "10.00", stock: 45, unit: "frasco", description: "Crema de leche fresca para salsas, repostería y pastas. Contenido de grasa 35%." },
    { name: "Queso Mozzarella 250g", price: "24.00", offerPrice: "19.00", stock: 30, unit: "unidad", description: "Mozzarella fresca elaborada con leche entera, perfecta para pizzas y caprese." },
    { name: "Manjar Blanco 500g", price: "20.00", stock: 30, unit: "frasco", description: "Manjar blanco artesanal cocido a fuego lento, sin preservantes. Apto para rellenos y postres." },
    { name: "Leche Fresca 2L Familiar", price: "11.00", offerPrice: "9.00", stock: 55, unit: "botella", description: "Presentación familiar de 2 litros de leche fresca de Vitoc. Ideal para familias numerosas." },
    { name: "Helado Artesanal de Lúcuma", price: "12.00", stock: 20, unit: "unidad", description: "Helado artesanal elaborado con lúcuma fresca de la zona. Sin colorantes artificiales, 250ml." },
  ],

  "Cacao Premium Selva": [
    { name: "Cacao Orgánico Crudo 500g", price: "38.00", offerPrice: "30.00", stock: 35, unit: "bolsa", description: "Granos de cacao orgánico crudos fermentados de Perené, certificado UTZ. Sabor afrutado y floral." },
    { name: "Pasta de Cacao Puro 250g", price: "32.00", stock: 30, unit: "barra", description: "Pasta de cacao 100% sin azúcar, base para chocolatería artesanal. Intenso y aromático." },
    { name: "Manteca de Cacao 200g", price: "45.00", offerPrice: "36.00", stock: 25, unit: "frasco", description: "Manteca de cacao prensada en frío, uso en cosmética y chocolate blanco artesanal." },
    { name: "Chocolate Negro 85% Cacao", price: "22.00", stock: 40, unit: "barra", description: "Chocolate negro 85% cacao bean-to-bar, notas de frutas tropicales. Sin lecitina de soya." },
    { name: "Cacao en Polvo Sin Azúcar 200g", price: "25.00", offerPrice: "20.00", stock: 45, unit: "bolsa", description: "Cacao en polvo alcalino sin azúcar para repostería y bebidas. Color oscuro intenso." },
    { name: "Bombones de Chocolate x12", price: "35.00", stock: 20, unit: "caja", description: "Bombones artesanales de chocolate rellenos de ganache de frutas exóticas. Caja de 12 piezas." },
    { name: "Chocolate con Menta 70g", price: "14.00", offerPrice: "11.00", stock: 50, unit: "barra", description: "Chocolate 65% cacao con aceite esencial de menta orgánica. Sabor fresco e intenso." },
    { name: "Chips de Chocolate 200g", price: "20.00", stock: 40, unit: "bolsa", description: "Chips de chocolate semidulce para repostería, resistentes al calor del horno. 200g." },
    { name: "Trufas de Chocolate x8", price: "30.00", offerPrice: "24.00", stock: 15, unit: "caja", description: "Trufas de chocolate negro con relleno cremoso de café y cacao. Caja de 8 unidades." },
    { name: "Cacao en Polvo Azucarado 400g", price: "18.00", stock: 55, unit: "lata", description: "Cacao soluble con azúcar para bebidas calientes tipo chocolate. Rendimiento 40 tazas." },
  ],

  "Bodega Central Pichanaqui": [
    { name: "Inca Kola 3 Litros", price: "12.00", offerPrice: "10.00", stock: 80, unit: "botella", description: "La bebida peruana favorita en presentación de 3 litros. Sabor único e inconfundible." },
    { name: "Agua San Mateo 2.5L", price: "5.50", stock: 90, unit: "botella", description: "Agua mineral natural San Mateo sin gas, fuente de la sierra peruana. Hidratación pura." },
    { name: "Cerveza Cusqueña 6-Pack", price: "36.00", offerPrice: "30.00", stock: 50, unit: "pack", description: "Six pack de cerveza Cusqueña Golden 330ml, la más premiada del Perú. Fresca y maltosa." },
    { name: "Gaseosa Pepsi 2.5L", price: "9.00", stock: 70, unit: "botella", description: "Gaseosa Pepsi 2.5 litros, ideal para reuniones y fiestas familiares." },
    { name: "Ron Cartavio Superior 750ml", price: "55.00", offerPrice: "48.00", stock: 30, unit: "botella", description: "Ron Cartavio Superior añejado en barricas, suave y aromático. Presentación 750ml." },
    { name: "Chicha Morada 2L Pack", price: "14.00", stock: 55, unit: "botella", description: "Chicha morada lista para servir, elaborada con maíz morado peruano. Sin preservantes." },
    { name: "Vino Santa Helena Reserva", price: "45.00", offerPrice: "38.00", stock: 20, unit: "botella", description: "Vino tinto chileno cabernet sauvignon de reserva. Cuerpo pleno y taninos suaves." },
    { name: "Cerveza Pilsen Callao 6-Pack", price: "32.00", stock: 55, unit: "pack", description: "Six pack de Pilsen Callao 330ml, la cerveza tradicional peruana. Rubia y refrescante." },
    { name: "Gaseosa Coca-Cola 1.5L", price: "7.50", offerPrice: "6.00", stock: 80, unit: "botella", description: "Coca-Cola en presentación de 1.5 litros, ideal para el refrigerador familiar." },
    { name: "Sangría en Caja 1L", price: "28.00", stock: 25, unit: "caja", description: "Sangría española lista para servir, base de vino tinto con frutas. Presentación 1 litro." },
  ],

  "Belleza y Spa Jungle": [
    { name: "Crema Hidratante Facial 50ml", price: "55.00", offerPrice: "44.00", stock: 30, unit: "frasco", description: "Crema hidratante con aceite de sacha inchi y vitamina E, para todo tipo de piel." },
    { name: "Shampoo de Aceite de Coco 400ml", price: "35.00", stock: 40, unit: "frasco", description: "Shampoo nutritivo con aceite de coco virgen para cabello seco y dañado. Sin sulfatos." },
    { name: "Acondicionador Natural 400ml", price: "35.00", offerPrice: "28.00", stock: 40, unit: "frasco", description: "Acondicionador con manteca de cupuazú y proteínas de quinua. Desenreda y da brillo." },
    { name: "Perfume Mujer Floral 50ml", price: "95.00", stock: 20, unit: "frasco", description: "Eau de parfum con notas de rosa, jazmín y vainilla. Duración 8 horas, fabricación nacional." },
    { name: "Mascarilla de Barro Amazónico 200g", price: "42.00", offerPrice: "34.00", stock: 25, unit: "frasco", description: "Mascarilla arcilla con extractos de plantas amazónicas, limpia profundo los poros." },
    { name: "Serum Vitamina C 30ml", price: "75.00", stock: 20, unit: "frasco", description: "Serum vitamina C 20% con ácido hialurónico, iluminador y antioxidante para el rostro." },
    { name: "Tónico Facial con Agua de Rosa", price: "38.00", offerPrice: "30.00", stock: 30, unit: "frasco", description: "Tónico refrescante de agua de rosa búlgara, equilibra el pH de la piel y minimiza poros." },
    { name: "Esmalte de Uñas x6 colores", price: "30.00", stock: 25, unit: "set", description: "Set de 6 esmaltes de uñas en colores temporada, larga duración y secado rápido." },
    { name: "Labial Matte Rojo Intenso", price: "28.00", offerPrice: "22.00", stock: 35, unit: "unidad", description: "Labial matte de larga duración, fórmula hidratante con vitamina E. Tono rojo intenso." },
    { name: "Delineador de Ojos Negro", price: "22.00", stock: 40, unit: "unidad", description: "Delineador líquido negro de punta fina, resistente al agua y al sudor. Larga duración 24h." },
  ],

  "Juguetes y Regalos Kids": [
    { name: "Muñeca de Trapo Artesanal", price: "45.00", offerPrice: "36.00", stock: 20, unit: "unidad", description: "Muñeca de trapo hecha a mano con tela de algodón y cabello de lana, personalizable." },
    { name: "Carros a Control Remoto 4x4", price: "120.00", stock: 15, unit: "unidad", description: "Camioneta 4x4 a control remoto, recargable USB, velocidad 15km/h. Para niños de 6-12 años." },
    { name: "Rompecabezas 500 piezas Perú", price: "55.00", offerPrice: "44.00", stock: 20, unit: "unidad", description: "Rompecabezas de 500 piezas con mapa del Perú e ilustraciones culturales, educativo." },
    { name: "Bicicleta Infantil 20 pulgadas", price: "280.00", stock: 8, unit: "unidad", description: "Bicicleta para niños de 6-10 años, rueda 20 pulgadas, frenos de mano y casco incluido." },
    { name: "Pelota de Fútbol N5", price: "55.00", offerPrice: "45.00", stock: 25, unit: "unidad", description: "Pelota de fútbol tamaño 5 reglamentaria, cosida a mano y resistente al agua." },
    { name: "Juego de Mesa Monopoly", price: "75.00", stock: 12, unit: "unidad", description: "Monopoly clásico versión Perú con propiedades de las principales ciudades del país." },
    { name: "LEGO Creativo 200 piezas", price: "95.00", offerPrice: "76.00", stock: 10, unit: "caja", description: "Set de bloques de construcción compatibles con Lego, 200 piezas en colores variados." },
    { name: "Caja de Colores Faber Castell x60", price: "38.00", stock: 30, unit: "caja", description: "60 lápices de colores Faber Castell, mina blanda resistente a la rotura, colores vibrantes." },
    { name: "Mochila Escolar Primaria", price: "65.00", offerPrice: "52.00", stock: 18, unit: "unidad", description: "Mochila escolar con compartimentos organizadores, porta laptop y estuche. Diseños variados." },
    { name: "Peluche de Oso Polar 40cm", price: "45.00", stock: 22, unit: "unidad", description: "Peluche de oso polar de felpa suave 40cm, lavable en máquina. Relleno hipoalergénico." },
  ],

  "Deportes Aventura Selva": [
    { name: "Mochila Trekking 40L Impermeable", price: "220.00", offerPrice: "175.00", stock: 12, unit: "unidad", description: "Mochila de trekking 40L con marco interno, cubierta impermeable y sistema de ventilación dorsal." },
    { name: "Carpa de Campaña 2 Personas", price: "280.00", stock: 8, unit: "unidad", description: "Carpa para 2 personas, doble capa, resistente al viento y lluvia tropical. Montaje en 5 min." },
    { name: "Botas de Montaña Impermeables", price: "250.00", offerPrice: "198.00", stock: 10, unit: "par", description: "Botas de montaña con membrana Gore-Tex, suela Vibram, protección tobillo. Tallas 38-45." },
    { name: "Linterna de Cabeza LED 1000 lm", price: "85.00", stock: 20, unit: "unidad", description: "Linterna frontal LED 1000 lúmenes, resistente al agua, batería 20h en modo bajo." },
    { name: "Kit de Pesca Completo", price: "120.00", offerPrice: "95.00", stock: 10, unit: "set", description: "Kit de pesca con caña telescópica 2.7m, carrete, señuelos y anzuelos variados. Para ríos." },
    { name: "Cuerda de Rappel 30m 8mm", price: "180.00", stock: 6, unit: "rollo", description: "Cuerda dinámica para rappel y escalada 8mm x 30m, certificada CE. Resistencia 2100kg." },
    { name: "Navaja Multiusos Swiss Army", price: "95.00", offerPrice: "76.00", stock: 15, unit: "unidad", description: "Navaja multiusos con 15 herramientas: tijeras, sierra, sacacorchos, destornillador y más." },
    { name: "Chaleco Salvavidas Adulto", price: "140.00", stock: 10, unit: "unidad", description: "Chaleco salvavidas CE para kayak y rafting, talla M-XL, flotabilidad 50N. Varios colores." },
    { name: "Repelente Spray Insectos 100ml", price: "35.00", offerPrice: "28.00", stock: 30, unit: "frasco", description: "Repelente de insectos 40% DEET, eficaz contra mosquitos tropicales y jejenes. 8h protección." },
    { name: "GPS de Montaña Garmin Etrex", price: "580.00", stock: 4, unit: "unidad", description: "GPS portátil Garmin eTrex 32x con mapas topográficos, brújula y altímetro barométrico." },
  ],

  "Lodge Turismo Verde": [
    { name: "Tour Selva 1 Día con Almuerzo", price: "120.00", offerPrice: "95.00", stock: 20, unit: "persona", description: "Tour de 1 día por la selva del Perené con guía bilingüe, almuerzo típico y avistamiento de aves." },
    { name: "Pesca Deportiva Río Perené", price: "85.00", stock: 15, unit: "persona", description: "Pesca deportiva en el río Perené, equipo incluido, guía experto. Captura de truchas y boquichico." },
    { name: "Alojamiento Cabaña Doble", price: "200.00", offerPrice: "160.00", stock: 5, unit: "noche", description: "Cabaña doble en el lodge con baño privado, ventilador y mosquitero. Desayuno incluido." },
    { name: "Avistamiento de Aves al Amanecer", price: "65.00", stock: 20, unit: "persona", description: "Tour de avistamiento de más de 50 especies de aves a orillas del Perené. Binoculares incluidos." },
    { name: "Tour Catarata El Tirol", price: "75.00", offerPrice: "60.00", stock: 18, unit: "persona", description: "Excursión a la catarata El Tirol, 4 horas de caminata por bosque primario. Transporte incluido." },
    { name: "Rafting Río Perené 3h", price: "110.00", stock: 12, unit: "persona", description: "Rafting nivel II-III en el río Perené, 3 horas de adrenalina. Equipo y guía certificado." },
    { name: "Paseo a Caballo por la Selva", price: "55.00", offerPrice: "44.00", stock: 10, unit: "hora", description: "Paseo a caballo por senderos de la selva, 2 horas con guía. Apto para principiantes." },
    { name: "Tour Nocturno con Linterna", price: "50.00", stock: 15, unit: "persona", description: "Exploración nocturna del bosque para observar reptiles, anfibios y mamíferos nocturnos." },
    { name: "Camping 2 Días en Selva", price: "280.00", offerPrice: "220.00", stock: 8, unit: "persona", description: "Paquete de camping 2 días en la selva con equipo, comidas, guía y seguro de accidentes." },
    { name: "Tour Comunidades Nativas", price: "95.00", stock: 12, unit: "persona", description: "Visita a comunidades nativas Asháninka del Perené, artesanías, danzas y almuerzo típico." },
  ],

  "Insumos Agrícolas Del Campo": [
    { name: "Fertilizante NPK 20-20-20 50kg", price: "145.00", offerPrice: "120.00", stock: 20, unit: "saco", description: "Fertilizante completo NPK 20-20-20 para cafetales y cacaotales. Saco de 50kg, uso foliar." },
    { name: "Insecticida Orgánico Nim 1L", price: "45.00", stock: 30, unit: "frasco", description: "Insecticida orgánico a base de aceite de nim (azadiractina), repelente y ovicida ecológico." },
    { name: "Fungicida Cupravit 1kg", price: "55.00", offerPrice: "44.00", stock: 25, unit: "bolsa", description: "Fungicida cúprico Cupravit para control de monilia del cacao y ojo de pollo del café." },
    { name: "Semillas de Café Caturra 1kg", price: "35.00", stock: 15, unit: "bolsa", description: "Semillas de café variedad caturra seleccionadas, alta productividad y resistencia a la roya." },
    { name: "Semillas de Cacao CCN-51", price: "40.00", offerPrice: "32.00", stock: 12, unit: "bolsa", description: "Semillas de cacao CCN-51 de alta producción, 80 semillas por bolsa. Certificadas." },
    { name: "Machete de Campo 45cm", price: "28.00", stock: 25, unit: "unidad", description: "Machete de acero forjado 45cm con mango de madera resistente. Para deshierbo y poda." },
    { name: "Pala Agrícola con Mango", price: "45.00", offerPrice: "36.00", stock: 20, unit: "unidad", description: "Pala de acero templado con mango de madera de 120cm. Para labores de campo pesadas." },
    { name: "Manguera de Riego 50m", price: "75.00", stock: 10, unit: "rollo", description: "Manguera de polietileno ¾ pulgada, 50m de largo, resistente a la presión y rayos UV." },
    { name: "Bomba de Mochila 20L", price: "120.00", offerPrice: "95.00", stock: 8, unit: "unidad", description: "Bomba mochila manual 20L para aplicación de plaguicidas y fertilizantes foliares. Correa ajustable." },
    { name: "Abono Orgánico Compost 50kg", price: "35.00", stock: 30, unit: "saco", description: "Abono orgánico compost certificado, mezcla de rastrojos y estiércol descompuesto. Para todo cultivo." },
  ],

  "Pescadería Río Chanchamayo": [
    { name: "Trucha Fresca Entera 1kg", price: "28.00", offerPrice: "22.00", stock: 30, unit: "kg", description: "Trucha arco iris fresca de piscigranja local, tamaño mediano-grande. Ideal para ceviche y frita." },
    { name: "Boquichico Fresco 1kg", price: "22.00", stock: 35, unit: "kg", description: "Boquichico (Prochilodus nigricans) fresco del río Chanchamayo, sabor suave y espinas finas." },
    { name: "Filete de Paiche 500g", price: "45.00", offerPrice: "36.00", stock: 15, unit: "porción", description: "Filete de paiche (Arapaima gigas) sin espinas, carne firme y de sabor delicado. El pez gigante amazónico." },
    { name: "Camarones del Río 500g", price: "55.00", stock: 20, unit: "bolsa", description: "Camarones frescos de río, medianos, ideales para chupe, sudado y ceviche de camarones." },
    { name: "Gamitana Ahumada 500g", price: "38.00", offerPrice: "30.00", stock: 18, unit: "porción", description: "Gamitana ahumada artesanalmente en leña de huayruro, sabor intenso y larga duración." },
    { name: "Surubí Fresco Entero 2kg", price: "60.00", stock: 10, unit: "unidad", description: "Surubí fresco entero, promedio 2kg, bagre de río de carne blanca y suave sin escamas." },
    { name: "Picuro Ahumado 1kg", price: "75.00", offerPrice: "60.00", stock: 8, unit: "kg", description: "Picuro (pacarana) ahumado, carne de monte local de sabor único. Preparación artesanal." },
    { name: "Tilapia Fresca Entera 1kg", price: "20.00", stock: 40, unit: "kg", description: "Tilapia de crianza local, fresca y limpia. Versátil para guisos, a la plancha y ceviche." },
    { name: "Filete de Corvina 500g", price: "40.00", offerPrice: "32.00", stock: 12, unit: "porción", description: "Filete de corvina fresca sin espinas, carne blanca y firme. Traída de la costa semanalmente." },
    { name: "Cecina de Pescado 500g", price: "35.00", stock: 15, unit: "porción", description: "Cecina amazónica de pescado de río seco y salado, preservación artesanal tradicional." },
  ],

  "Heladería Tropical": [
    { name: "Helado de Mango 250ml", price: "8.00", offerPrice: "6.50", stock: 40, unit: "vaso", description: "Helado artesanal de mango fresco de Chanchamayo, sin colorantes artificiales. Cremoso y refrescante." },
    { name: "Helado de Maracuyá 250ml", price: "8.00", stock: 40, unit: "vaso", description: "Helado de maracuyá con jugo natural concentrado, equilibrio perfecto entre ácido y dulce." },
    { name: "Helado de Coco Artesanal 250ml", price: "9.00", offerPrice: "7.00", stock: 35, unit: "vaso", description: "Helado de coco con trozos de coco rallado, base de leche de coco natural. Exótico y cremoso." },
    { name: "Helado de Lúcuma 250ml", price: "9.00", stock: 30, unit: "vaso", description: "Helado de lúcuma peruana, dulce natural con textura cremosa única. El sabor peruano favorito." },
    { name: "Picolé Tropical Mix", price: "5.00", offerPrice: "4.00", stock: 50, unit: "unidad", description: "Picolé de fruta mixta tropical (mango, maracuyá, piña), sin azúcar añadida. Refrescante." },
    { name: "Sorbete de Tamarindo 200ml", price: "7.00", stock: 35, unit: "vaso", description: "Sorbete de tamarindo agridulce, base de agua, refrescante para el calor de la selva." },
    { name: "Granizado de Fresa con Leche Condensada", price: "6.00", offerPrice: "5.00", stock: 45, unit: "vaso", description: "Granizado de fresa fresca con leche condensada, preparación al momento. El clásico de la heladería." },
    { name: "Helado de Chocolate Belga 250ml", price: "10.00", stock: 25, unit: "vaso", description: "Helado de chocolate con cacao de Chanchamayo y base de leche fresca. Intenso y cremoso." },
    { name: "Copa Tropical Especial", price: "18.00", offerPrice: "14.00", stock: 15, unit: "porción", description: "Copa con 3 bolas de helado tropical, fruta picada fresca, crema chantilly y galleta wafer." },
    { name: "Mil Hojas de Crema Chantilly", price: "14.00", stock: 20, unit: "porción", description: "Pastel de mil hojas con crema chantilly y manjar blanco, porción individual 150g." },
  ],

  "Librería y Útiles El Saber": [
    { name: "Cuaderno Universitario 100 hojas", price: "8.50", offerPrice: "7.00", stock: 80, unit: "unidad", description: "Cuaderno universitario cuadriculado 100 hojas, tapa dura. Ideal para colegio y universidad." },
    { name: "Lapiceros BIC Cristal x12", price: "15.00", stock: 60, unit: "caja", description: "Lapiceros BIC Cristal azul, punta media 1.0mm, flujo de tinta uniforme. Caja de 12." },
    { name: "Resaltadores de Colores x5", price: "18.00", offerPrice: "14.00", stock: 45, unit: "set", description: "Set de 5 resaltadores en colores variados, punta biselada. Para textos y apuntes." },
    { name: "Regla Metálica 30cm", price: "8.00", stock: 50, unit: "unidad", description: "Regla de aluminio 30cm con escala en cm y pulgadas. Resistente para estudiantes y profesionales." },
    { name: "Corrector Liquid Paper 20ml", price: "6.50", offerPrice: "5.00", stock: 55, unit: "unidad", description: "Corrector líquido Liquid Paper de secado rápido, para papel de todo tipo. 20ml." },
    { name: "Cinta Adhesiva Scoth 18mm x33m", price: "5.00", stock: 70, unit: "rollo", description: "Cinta adhesiva transparente Scotch 18mm x33m, uso escolar y de oficina." },
    { name: "Folder Manila A4 x10", price: "12.00", offerPrice: "9.50", stock: 50, unit: "paquete", description: "Folders de manila color beige A4, para organizar documentos e informes. Pack de 10." },
    { name: "Grapadora Rapid con Grapas", price: "28.00", stock: 25, unit: "unidad", description: "Grapadora de escritorio con 1000 grapas incluidas, capacidad 25 hojas." },
    { name: "Borrador Pelikan Nata x2", price: "5.00", offerPrice: "3.80", stock: 60, unit: "pack", description: "Borradores Pelikan Nata para lápiz y lapicero, plástico libre de PVC. Pack de 2." },
    { name: "Caja de Colores Acuarela x24", price: "25.00", stock: 30, unit: "caja", description: "Colores acuarela pastilla 24 tonos, incluye pincel y paleta mezcladora. Para arte escolar." },
  ],

  "Mecánica y Servicios Rapid": [
    { name: "Aceite Motor SAE 20W-50 1L", price: "28.00", offerPrice: "23.00", stock: 40, unit: "litro", description: "Aceite de motor mineral SAE 20W-50 para autos y motos, protección total del motor." },
    { name: "Filtro de Aceite Mitsubishi", price: "35.00", stock: 25, unit: "unidad", description: "Filtro de aceite compatible con Mitsubishi L200, Galant y similares. Alta filtración." },
    { name: "Pastillas de Freno Delanteras", price: "75.00", offerPrice: "60.00", stock: 15, unit: "juego", description: "Juego de pastillas de freno delanteras de alta resistencia, universales para autos japoneses." },
    { name: "Batería de Auto 60Ah", price: "280.00", stock: 8, unit: "unidad", description: "Batería de auto 60Ah libre de mantenimiento, arranque garantizado en clima cálido y frío." },
    { name: "Refrigerante Radiador 1L Azul", price: "22.00", stock: 30, unit: "frasco", description: "Refrigerante anticongelante azul -37°C para radiadores, dilución 50/50 con agua destilada." },
    { name: "Bujías NGK Estándar x4", price: "45.00", offerPrice: "36.00", stock: 20, unit: "juego", description: "Juego de 4 bujías NGK estándar para autos de 1.3L a 2.0L. Mayor rendimiento y arranque." },
    { name: "Faja Dentada Motor Kit", price: "120.00", stock: 10, unit: "kit", description: "Kit de faja dentada con tensor y polea, universal para autos japoneses 1.6L-2.0L." },
    { name: "Líquido de Frenos DOT 4 500ml", price: "18.00", offerPrice: "14.00", stock: 25, unit: "frasco", description: "Líquido de frenos DOT 4 de alto punto de ebullición para mayor seguridad en frenado." },
    { name: "Desengrasante Motor Spray 400g", price: "25.00", stock: 20, unit: "lata", description: "Desengrasante motor en aerosol, elimina grasa, barro y residuos. No daña plásticos ni pinturas." },
    { name: "Kit Afinamiento Motor Completo", price: "85.00", offerPrice: "68.00", stock: 8, unit: "kit", description: "Kit completo de afinamiento: filtro aire, aceite, bujías y aditivo combustible." },
  ],

  "Frutería Tropical Perené": [
    { name: "Aguaymanto 500g", price: "15.00", offerPrice: "12.00", stock: 35, unit: "bolsa", description: "Aguaymanto (Physalis peruviana) fresco en su cápsula, agridulce y muy nutritivo. Orgánico." },
    { name: "Camu Camu 500g", price: "20.00", stock: 25, unit: "bolsa", description: "Camu camu fresco, la fruta con mayor contenido de vitamina C del mundo (60x el limón)." },
    { name: "Cocona Tropical 1kg", price: "12.00", offerPrice: "9.00", stock: 40, unit: "kg", description: "Cocona (Solanum sessiliflorum) fresca, de sabor cítrico único. Para jugos, salsas y dulces." },
    { name: "Lúcuma Fresca 1kg", price: "16.00", stock: 30, unit: "kg", description: "Lúcuma fresca madura, dulce y harinosa. La fruta del Inca para helados, batidos y repostería." },
    { name: "Pitahaya Amarilla 500g", price: "28.00", offerPrice: "22.00", stock: 20, unit: "bolsa", description: "Pitahaya amarilla de pulpa blanca, dulce y jugosa. Alta en fibra y antioxidantes." },
    { name: "Chirimoya Grande 1kg", price: "18.00", stock: 25, unit: "kg", description: "Chirimoya fresca de Perené, pulpa cremosa blanca de sabor tropical dulce. La reina de las frutas." },
    { name: "Guanábana 1kg", price: "14.00", offerPrice: "11.00", stock: 30, unit: "kg", description: "Guanábana fresca, fruta tropical con propiedades medicinales reconocidas mundialmente." },
    { name: "Carambola 500g", price: "10.00", stock: 40, unit: "bolsa", description: "Carambola (fruta estrella) fresca y jugosa, excelente en jugos y decoración de platos." },
    { name: "Tamarindo 500g", price: "12.00", offerPrice: "9.50", stock: 35, unit: "bolsa", description: "Tamarindo de vaina con pulpa agridulce, para refrescos, dulces y salsas asiáticas." },
    { name: "Marañón Fresco 1kg", price: "14.00", stock: 25, unit: "kg", description: "Marañón (anacardo) con nuez incluida, fruto jugoso para jugos tropicales naturales." },
  ],

  "Café Aroma Andino": [
    { name: "Café Filtrante Premium x20", price: "28.00", offerPrice: "22.00", stock: 50, unit: "caja", description: "Café filtrante de especialidad de Vitoc, notas de caramelo y almendra. 20 sobres individuales." },
    { name: "Espresso Blend 250g", price: "30.00", stock: 40, unit: "bolsa", description: "Blend de espresso con cuerpo intenso y crema abundante. Molienda fina para cafetera espresso." },
    { name: "Café Descafeinado 250g", price: "32.00", offerPrice: "26.00", stock: 30, unit: "bolsa", description: "Café arábica descafeinado por proceso de agua (Swiss Water), conserva el aroma original." },
    { name: "Té de Cacao en Sobre x15", price: "18.00", stock: 40, unit: "caja", description: "Infusión de cáscara de cacao tostada (cascara), dulce naturalmente, con cafeína baja." },
    { name: "Granola de Café y Avena 300g", price: "25.00", offerPrice: "20.00", stock: 35, unit: "bolsa", description: "Granola artesanal con café de Vitoc, avena, miel y frutos secos. Sin azúcar refinada." },
    { name: "Jabón de Café Exfoliante", price: "22.00", stock: 25, unit: "unidad", description: "Jabón artesanal exfoliante con posos de café, aceite de coco y manteca de cacao. 100g." },
    { name: "Crema Corporal de Café 200ml", price: "45.00", offerPrice: "36.00", stock: 20, unit: "frasco", description: "Crema corporal nutritiva con extracto de café, reduce celulitis y piel de naranja. Hidratante." },
    { name: "Caramelos de Café Artesanales x20", price: "15.00", stock: 30, unit: "bolsa", description: "Caramelos de café de Vitoc hechos a mano con leche condensada. Sabor intenso a café." },
    { name: "Licor de Café 375ml", price: "55.00", offerPrice: "44.00", stock: 12, unit: "botella", description: "Licor artesanal de café de Chanchamayo macerado en aguardiente de caña, 25% alcohol." },
    { name: "Café Capuchino Instantáneo x10", price: "18.00", stock: 45, unit: "caja", description: "Capuchino instantáneo con café de Vitoc y leche en polvo, 10 sobres individuales." },
  ],

  "Pollería y Comida La Selva": [
    { name: "Pollo a la Brasa Entero", price: "38.00", offerPrice: "32.00", stock: 30, unit: "unidad", description: "Pollo a la brasa entero marinado con especias amazónicas, cocido en horno de leña. Con papas y ensalada." },
    { name: "Medio Pollo a la Brasa", price: "22.00", stock: 40, unit: "porción", description: "Medio pollo a la brasa con papas fritas, ensalada y cremas. Ideal para 2 personas." },
    { name: "Cuarto de Pollo con Guarnición", price: "14.00", offerPrice: "11.00", stock: 50, unit: "porción", description: "Cuarto de pollo a la brasa con arroz amarillo, ensalada y ají verde. Porción personal." },
    { name: "Brochetas de Pollo x5", price: "20.00", stock: 25, unit: "porción", description: "5 brochetas de pollo marinado en ají panca y especias, acompañadas de yucas al horno." },
    { name: "Anticuchos de Corazón x10", price: "22.00", offerPrice: "18.00", stock: 30, unit: "porción", description: "10 anticuchos de corazón de res marinados, a la parrilla, con papa y ají especial." },
    { name: "Parrilla de Res 300g", price: "35.00", stock: 20, unit: "porción", description: "Corte de res a la parrilla al punto, con papas nativas y chimichurri casero." },
    { name: "Chuletas de Cerdo a la Parrilla", price: "30.00", offerPrice: "24.00", stock: 20, unit: "porción", description: "2 chuletas de cerdo a la parrilla con salsa bbq casera, papas y ensalada fresca." },
    { name: "Hamburguesa Casera de Pollo", price: "18.00", stock: 30, unit: "unidad", description: "Hamburguesa de pollo grillado con lechuga, tomate, queso y salsa especial en pan brioche." },
    { name: "Costillas BBQ 500g", price: "42.00", offerPrice: "34.00", stock: 15, unit: "porción", description: "Costillas de cerdo bañadas en salsa BBQ casera, cocción lenta 4 horas. Carne que se desprende." },
    { name: "Chicharrón de Pollo Grande", price: "22.00", stock: 25, unit: "porción", description: "Chicharrón de trozos de pollo rebozado y frito, crujiente por fuera y jugoso por dentro." },
  ],

  "Hogar y Decoración Chanchamayo": [
    { name: "Juego de Sábanas Queen 100% Algodón", price: "120.00", offerPrice: "95.00", stock: 15, unit: "juego", description: "Juego de sábanas queen 100% algodón percal 200 hilos, incluye sábana base, encimera y 2 fundas." },
    { name: "Almohada Memory Foam", price: "85.00", stock: 20, unit: "unidad", description: "Almohada de espuma viscoelástica memory foam, se adapta al cuello. Funda de algodón incluida." },
    { name: "Edredón Microfibra 2 Plazas", price: "150.00", offerPrice: "120.00", stock: 10, unit: "unidad", description: "Edredón de microfibra antiácaros, 2 plazas, peso 400g/m². Lavable en máquina." },
    { name: "Cojines Decorativos x2", price: "65.00", stock: 20, unit: "par", description: "Par de cojines decorativos 45x45cm con diseños de la selva amazónica. Relleno de silicona." },
    { name: "Cortinas Blackout 140x260cm Par", price: "130.00", offerPrice: "104.00", stock: 8, unit: "par", description: "Par de cortinas blackout 100% opacas, reducen el calor y el ruido. Varias medidas." },
    { name: "Vajilla de Porcelana x6 personas", price: "180.00", stock: 8, unit: "juego", description: "Vajilla de porcelana 24 piezas para 6 personas, diseño moderno blanco. Apta para microondas." },
    { name: "Sartén Teflón 24cm con Tapa", price: "85.00", offerPrice: "68.00", stock: 12, unit: "unidad", description: "Sartén antiadherente Tefal 24cm con tapa de vidrio, mango ergonómico. Apta para inducción." },
    { name: "Licuadora Oster 600W", price: "180.00", stock: 8, unit: "unidad", description: "Licuadora Oster 600W con jarra de vidrio 1.5L y 10 velocidades. Ideal para batidos y salsas." },
    { name: "Hervidor Eléctrico 1.7L Inox", price: "95.00", offerPrice: "76.00", stock: 12, unit: "unidad", description: "Hervidor eléctrico de acero inoxidable 1.7L, 2200W, hierve en 3 minutos. Auto-apagado." },
    { name: "Organizador Cocina 5 piezas", price: "75.00", stock: 15, unit: "set", description: "Set de 5 organizadores apilables para cocina: especieros, utensilios y alimentos. Acero cromado." },
  ],

  "Mascotas y Accesorios PetShop": [
    { name: "Croquetas Pro Plan Perro 15kg", price: "210.00", offerPrice: "175.00", stock: 15, unit: "saco", description: "Alimento seco Pro Plan para perros adultos razas medianas, fórmula de pollo y arroz." },
    { name: "Comida Whiskas Gato 1.5kg", price: "55.00", stock: 25, unit: "bolsa", description: "Alimento seco Whiskas para gatos adultos, sabor pollo. Nutrición completa y equilibrada." },
    { name: "Collar Ajustable con Placa", price: "35.00", offerPrice: "28.00", stock: 30, unit: "unidad", description: "Collar ajustable de nylon para perros medianos, incluye placa grabada con el nombre." },
    { name: "Correa Retráctil 5 metros", price: "65.00", stock: 20, unit: "unidad", description: "Correa retráctil 5m con freno automático, para perros hasta 25kg. Mango antideslizante." },
    { name: "Cama para Mascotas Mediana", price: "95.00", offerPrice: "76.00", stock: 12, unit: "unidad", description: "Cama lavable con relleno de espuma HR para perros y gatos medianos, forro polar suave." },
    { name: "Juguete Kong Classic", price: "55.00", stock: 20, unit: "unidad", description: "Juguete Kong Classic de caucho resistente, relleno con premios, estimula la mente del perro." },
    { name: "Champú para Perros 400ml", price: "28.00", offerPrice: "22.00", stock: 25, unit: "frasco", description: "Champú para perros con avena y aloe vera, pH neutro. Suave para la piel, sin parabenos." },
    { name: "Antipulgas Frontline Spot-On", price: "45.00", stock: 20, unit: "pipeta", description: "Antipulgas Frontline Spot-On para perros 10-20kg, acción hasta 4 semanas. Importado." },
    { name: "Jaula para Pájaro Canario", price: "110.00", offerPrice: "88.00", stock: 8, unit: "unidad", description: "Jaula de acero galvanizado 40x30x55cm para canarios y periquitos, con comedero y bebedero." },
    { name: "Arena Aglomerante Gato 5kg", price: "42.00", stock: 20, unit: "bolsa", description: "Arena sanitaria aglomerante para gatos 5kg, control de olores 7 días. Libre de polvo." },
  ],
};

// ─── Test users ───────────────────────────────────────────────────────────────

const TEST_USERS = [
  { name: "Carlos Mendoza", email: "carlos.mendoza@test.pe" },
  { name: "Ana Flores", email: "ana.flores@test.pe" },
  { name: "Luis Torres", email: "luis.torres@test.pe" },
  { name: "María Quispe", email: "maria.quispe@test.pe" },
  { name: "Jorge Huamán", email: "jorge.huaman@test.pe" },
  { name: "Patricia Salazar", email: "patricia.salazar@test.pe" },
  { name: "Roberto Ccapa", email: "roberto.ccapa@test.pe" },
  { name: "Lucía Paredes", email: "lucia.paredes@test.pe" },
  { name: "Miguel Ramos", email: "miguel.ramos@test.pe" },
  { name: "Isabel Condori", email: "isabel.condori@test.pe" },
  { name: "Fernando Vela", email: "fernando.vela@test.pe" },
  { name: "Rosa Pinedo", email: "rosa.pinedo@test.pe" },
  { name: "Arturo Díaz", email: "arturo.diaz@test.pe" },
  { name: "Silvia Meza", email: "silvia.meza@test.pe" },
  { name: "César Aguilar", email: "cesar.aguilar@test.pe" },
  { name: "Gloria Pachas", email: "gloria.pachas@test.pe" },
  { name: "David Reyes", email: "david.reyes@test.pe" },
  { name: "Carmen Inga", email: "carmen.inga@test.pe" },
  { name: "Óscar Mamani", email: "oscar.mamani@test.pe" },
  { name: "Pilar Leiva", email: "pilar.leiva@test.pe" },
];

// ─── Review comments ──────────────────────────────────────────────────────────

const COMMENTS_5 = [
  "Excelente atención, el producto es de primera calidad. Volveré a comprar sin dudarlo.",
  "El mejor de toda la zona de Chanchamayo, lo recomiendo a todos mis amigos y familia.",
  "Productos frescos directamente del campo, se nota la calidad y la dedicación del productor.",
  "Muy buena tienda, ya es mi proveedor de confianza. Siempre encuentro lo que necesito.",
  "La atención es increíble y los productos son excelentes. Llevo meses comprando aquí.",
  "Entrega rápida y empaque muy cuidadoso, recibí todo en perfectas condiciones.",
  "El mejor sabor que he probado en mi vida, completamente natural y auténtico de la selva.",
  "Precio justo para la calidad que ofrecen. Muy satisfecho con mi compra.",
  "La miel es pura y natural, la recomiendo al 100%. No tiene comparación con las de tienda.",
  "Ambiente muy limpio y personal amable. Se nota que cuidan mucho la calidad de sus productos.",
];

const COMMENTS_4 = [
  "Buena atención y productos de calidad. Solo tardó un poco más de lo esperado en la entrega.",
  "Me gustó mucho el producto, aunque el precio podría ser un poco más accesible.",
  "Muy buena experiencia en general. El local está bien organizado y el staff es amable.",
  "Productos frescos y de buena calidad. Recomendable, aunque el stock se acaba rápido.",
  "Buena relación calidad-precio para la zona de Chanchamayo. Volvería a comprar.",
  "La calidad del producto es muy buena. Solo mejoraría el horario de atención.",
  "Muy buen servicio. Los productos son lo que prometen, sin sorpresas desagradables.",
  "Contento con la compra. El vendedor fue muy atento y conoce bien sus productos.",
];

const COMMENTS_3 = [
  "El producto es bueno pero el precio está un poco elevado para la zona.",
  "Regular experiencia. El producto llegó bien pero el servicio al cliente puede mejorar.",
  "Pasable. El producto cumple con lo prometido pero esperaba un poco más de calidad.",
  "Ni muy bien ni muy mal. Compraría nuevamente si mejoran la presentación del producto.",
];

const COMMENTS_2 = [
  "El producto no era exactamente lo que esperaba según la descripción. Aceptable.",
  "Demora en la atención y el producto llegó con algunos golpes. Puede mejorar.",
];

const COMMENTS_1 = [
  "No quedé satisfecho con el producto. No cumple con las expectativas descritas.",
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting comprehensive seed...\n");

  // 1. Categories
  for (const cat of CATEGORIES) {
    const existing = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, cat.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(categoriesTable).values({ ...cat, isActive: true });
    }
  }
  const allCats = await db.select().from(categoriesTable);
  const catBySlug = Object.fromEntries(allCats.map(c => [c.slug, c]));
  console.log("✅ Categories seeded");

  // 2. Admin
  const adminHash = await bcrypt.hash("Admin2024!", 10);
  const existingAdmin = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, "admin@mercanto.pe")).limit(1);
  let adminId = existingAdmin[0]?.id;
  if (!adminId) {
    const [admin] = await db.insert(usersTable).values({ name: "Administrador Mercanto", email: "admin@mercanto.pe", passwordHash: adminHash, role: "admin", district: "San Ramón" }).returning();
    adminId = admin.id;
    console.log("✅ Admin created");
  }

  // 3. Test users (20)
  const userHash = await bcrypt.hash("User2024!", 10);
  const testUserIds: number[] = [];
  for (const u of TEST_USERS) {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, u.email)).limit(1);
    if (existing.length > 0) {
      testUserIds.push(existing[0].id);
    } else {
      const [inserted] = await db.insert(usersTable).values({ name: u.name, email: u.email, passwordHash: userHash, role: "user", district: ["San Ramón", "La Merced", "Pichanaqui"][testUserIds.length % 3] }).returning();
      testUserIds.push(inserted.id);
    }
  }
  console.log("✅ 20 test users seeded");

  // 4. Stores (30) with vendor accounts
  const vendorHash = await bcrypt.hash("Vendor2024!", 10);
  const storeIdByName: Record<string, number> = {};
  const storeSlugByName: Record<string, string> = {};

  for (let i = 0; i < STORES.length; i++) {
    const s = STORES[i];
    const slug = slugify(s.name);
    storeSlugByName[s.name] = slug;

    const existingStore = await db.select({ id: storesTable.id }).from(storesTable).where(eq(storesTable.slug, slug)).limit(1);
    if (existingStore.length > 0) {
      storeIdByName[s.name] = existingStore[0].id;
      continue;
    }

    const email = `${slug.replace(/-/g, "").slice(0, 25)}@mercanto.pe`;
    let userId: number;
    const existingUser = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const [u] = await db.insert(usersTable).values({ name: s.name, email, passwordHash: vendorHash, role: "vendor", district: s.district }).returning();
      userId = u.id;
    }

    const coords = COORDS[s.district];
    const [store] = await db.insert(storesTable).values({
      userId,
      name: s.name,
      slug,
      description: s.description,
      location: s.location,
      categoryId: catBySlug[s.catSlug]?.id || null,
      district: s.district,
      lat: jitter(coords.lat),
      lng: jitter(coords.lng),
      whatsapp: s.whatsapp,
      status: "active",
      isFeatured: s.featured,
    }).returning();

    storeIdByName[s.name] = store.id;
  }
  // Re-fetch all stores to get IDs for already-existing ones
  const allStores = await db.select().from(storesTable);
  for (const st of allStores) { if (!storeIdByName[st.name]) storeIdByName[st.name] = st.id; }
  console.log("✅ 30 stores seeded");

  // 5. Products (10 per store = 300 total)
  let productCount = 0;
  for (const [storeName, prods] of Object.entries(PRODUCTS)) {
    const storeId = storeIdByName[storeName];
    if (!storeId) { console.log(`  ⚠️  Store not found: ${storeName}`); continue; }

    const store = STORES.find(s => s.name === storeName);
    const catSlug = store?.catSlug || "otros";

    for (let j = 0; j < prods.length; j++) {
      const p = prods[j];
      const slug = `${slugify(p.name)}-${storeId}`;

      const existingProd = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
      if (existingProd.length > 0) continue;

      const [prod] = await db.insert(productsTable).values({
        storeId,
        categoryId: catBySlug[catSlug]?.id || null,
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        offerPrice: p.offerPrice || null,
        stock: p.stock,
        unit: p.unit,
        status: "active",
        sortOrder: j,
      }).returning();

      await db.insert(productImagesTable).values({
        productId: prod.id,
        url: getPhoto(catSlug, j),
        publicId: `seed/${slug}`,
        sortOrder: 0,
      });

      productCount++;
    }
  }
  console.log(`✅ ${productCount} products seeded`);

  // 6. Reviews (5-15 per store)
  const DATES = [90, 75, 60, 50, 40, 35, 30, 25, 20, 18, 15, 12, 10, 8, 5, 3, 2, 1].map(d => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date;
  });

  let reviewCount = 0;
  for (const [storeName, storeId] of Object.entries(storeIdByName)) {
    const existing = await db.select({ id: reviewsTable.id }).from(reviewsTable).where(eq(reviewsTable.storeId, storeId)).limit(1);
    if (existing.length > 0) continue;

    const numReviews = 5 + Math.floor(Math.random() * 11); // 5-15
    for (let r = 0; r < numReviews; r++) {
      const userId = testUserIds[r % testUserIds.length];
      // Weight towards 4-5 stars
      const rand = Math.random();
      let rating: number;
      let comment: string;
      if (rand < 0.45) { rating = 5; comment = COMMENTS_5[r % COMMENTS_5.length]; }
      else if (rand < 0.75) { rating = 4; comment = COMMENTS_4[r % COMMENTS_4.length]; }
      else if (rand < 0.90) { rating = 3; comment = COMMENTS_3[r % COMMENTS_3.length]; }
      else if (rand < 0.97) { rating = 2; comment = COMMENTS_2[r % COMMENTS_2.length]; }
      else { rating = 1; comment = COMMENTS_1[0]; }

      await db.insert(reviewsTable).values({
        storeId,
        userId,
        rating,
        comment,
        isVisible: true,
        createdAt: DATES[r % DATES.length],
      });
      reviewCount++;
    }
  }
  console.log(`✅ ${reviewCount} reviews seeded`);
  console.log("\n🎉 Comprehensive seed completed!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
