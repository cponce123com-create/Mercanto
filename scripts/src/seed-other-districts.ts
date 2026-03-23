/**
 * Seed otros distritos: 2 tiendas x 14 distritos = 28 tiendas, 10 productos c/u = 280 productos
 * Script ADITIVO — no elimina datos existentes (San Ramón intacto).
 */
import {
  db, usersTable, categoriesTable, storesTable, productsTable,
  productImagesTable, reviewsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
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
  "agricultura-insumos":    ["photo-1500595046743-cd271d694d30","photo-1416879595882-3373a0480b5b","photo-1530836369250-ef72a3f5cda8"],
  "turismo-hospedaje":      ["photo-1469474968028-56623f02e42e","photo-1533587851505-d119e13c8f76","photo-1476514525535-07fb3b4ae5f1"],
  "educacion-libreria":     ["photo-1481627834876-b7833e8f5570","photo-1524995997946-a1c2e315a42f","photo-1456513080510-7bf3a84b82f8"],
  "servicios-tecnicos":     ["photo-1504148455328-c376907d081c","photo-1581092918056-0c4c3acd3789","photo-1498050108023-c5249f4df085"],
};

function getPhoto(catSlug: string, idx: number): string {
  const photos = PHOTOS[catSlug] || PHOTOS["abarrotes-bodega"];
  return `https://images.unsplash.com/${photos[idx % photos.length]}?w=400&q=80&auto=format&fit=crop`;
}

// ─── Reseñas ──────────────────────────────────────────────────────────────────

const REVIEW_COMMENTS = [
  "Excelente atención, muy recomendado.",
  "Productos frescos y de buena calidad.",
  "Buen precio y rápida respuesta por WhatsApp.",
  "Lo mejor del distrito sin dudas.",
  "Muy amables y siempre tienen stock.",
  "Compro aquí seguido, nunca me defrauda.",
  "Los precios son muy justos para la zona.",
  "Muy buena atención al cliente.",
  "Calidad garantizada, lo recomiendo.",
  "Siempre encuentro lo que busco aquí.",
];

// ─── Datos por categoría: productos ───────────────────────────────────────────

const PRODUCTS_BY_CATEGORY: Record<string, Array<{ name: string; description: string; price: string; stock: number; unit: string }>> = {
  "frutas-verduras": [
    { name: "Naranja de Chanchamayo (kg)",   description: "Naranjas dulces y jugosas cultivadas en los valles de Chanchamayo. Ideal para jugos y consumo directo.", price: "3.50",  stock: 150, unit: "kg" },
    { name: "Piña Golden (unidad)",          description: "Piña golden madura de la selva central, extra dulce. Cosechada en su punto óptimo de madurez.",          price: "5.00",  stock: 80,  unit: "unidad" },
    { name: "Plátano de Isla (racimo)",      description: "Plátano de isla dulce y aromático, cultivado sin pesticidas en las riberas del río.",                    price: "8.00",  stock: 60,  unit: "racimo" },
    { name: "Tomate Cocina (kg)",            description: "Tomate perita rojo maduro para preparaciones culinarias. Producción local de calidad.",                   price: "4.00",  stock: 100, unit: "kg" },
    { name: "Papa Huayro (kg)",              description: "Papa huayro andina, variedad especial con textura harinosa ideal para guisos y sancochado.",              price: "3.00",  stock: 120, unit: "kg" },
    { name: "Cebolla Roja (kg)",             description: "Cebolla roja fresca de calidad. Fundamental en la cocina peruana, sin productos químicos.",               price: "3.50",  stock: 90,  unit: "kg" },
    { name: "Yuca Fresca (kg)",              description: "Yuca tierna y fresca del valle. Ideal para sancochado, fritura y preparaciones regionales.",              price: "2.50",  stock: 100, unit: "kg" },
    { name: "Maracuyá (kg)",                 description: "Maracuyá aromática y ácida de la selva central. Rica en vitamina C y minerales esenciales.",             price: "6.00",  stock: 50,  unit: "kg" },
    { name: "Palta Fuerte (unidad)",         description: "Palta fuerte grande y cremosa cultivada localmente. Rica en grasas saludables y vitaminas.",              price: "3.00",  stock: 70,  unit: "unidad" },
    { name: "Rocoto Fresco (100g)",          description: "Rocoto picante fresco de la región. Ingrediente indispensable de la cocina criolla y regional.",          price: "2.00",  stock: 80,  unit: "100g" },
  ],
  "cafe-cacao": [
    { name: "Café Molido Especial 250g",     description: "Café de altura 1800 msnm, tostado oscuro artesanal. Aroma intenso con notas a chocolate y frutas rojas.", price: "22.00", stock: 60,  unit: "bolsa 250g" },
    { name: "Café en Grano 500g",            description: "Granos de café verde seleccionados a mano, variedad Catimor y Bourbon. Para tueste propio.",              price: "30.00", stock: 40,  unit: "bolsa 500g" },
    { name: "Cacao en Polvo 200g",           description: "Cacao orgánico en polvo sin azúcar, 100% puro de Chanchamayo. Para bebidas, repostería y natillas.",     price: "18.00", stock: 50,  unit: "bolsa 200g" },
    { name: "Chocolate Artesanal 70%",       description: "Tableta de chocolate negro 70% cacao, sin leche ni aditivos artificiales. Elaborado localmente.",         price: "15.00", stock: 35,  unit: "tableta 100g" },
    { name: "Café Instantáneo 200g",         description: "Café liofilizado de alta calidad, elaborado con granos de Chanchamayo. Preparación rápida y sabrosa.",    price: "25.00", stock: 45,  unit: "frasco 200g" },
    { name: "Pasta de Cacao 150g",           description: "Pasta de cacao pura sin azúcar, ideal para repostería gourmet y preparación de chocolate casero.",         price: "20.00", stock: 30,  unit: "bloque 150g" },
    { name: "Nibs de Cacao 100g",            description: "Trozos de cacao tostado sin azúcar. Superalimento rico en antioxidantes y magnesio.",                    price: "16.00", stock: 40,  unit: "bolsa 100g" },
    { name: "Café Tostado Claro 250g",       description: "Café tostado ligero que preserva la acidez frutal del grano de altura. Ideal para métodos de filtro.",   price: "24.00", stock: 30,  unit: "bolsa 250g" },
    { name: "Miel de Café 300ml",            description: "Miel producida por abejas que polinizan cafetales de altura. Sabor floral con toques de café.",          price: "28.00", stock: 20,  unit: "frasco 300ml" },
    { name: "Kit Degustación Café",          description: "Set de 3 cafés: tostado claro, medio y oscuro de Chanchamayo. Ideal para regalo o experiencia barista.", price: "45.00", stock: 15,  unit: "set 3x100g" },
  ],
  "miel-apicultura": [
    { name: "Miel de Abeja Pura 1kg",        description: "Miel multifloral 100% pura de colmenas andino-amazónicas. Sin procesar ni calentar. Certificada.",        price: "35.00", stock: 50,  unit: "frasco 1kg" },
    { name: "Miel de Eucalipto 500g",        description: "Miel de eucalipto con propiedades expectorantes y antisépticas. Excelente para la tos y bronquios.",      price: "22.00", stock: 40,  unit: "frasco 500g" },
    { name: "Polen de Abeja 150g",           description: "Polen fresco deshidratado, rico en proteínas, vitaminas y minerales. Superalimento natural.",             price: "30.00", stock: 30,  unit: "frasco 150g" },
    { name: "Propóleo en Tintura 30ml",      description: "Propóleo amazónico en tintura de alcohol 70%. Antibiótico natural para fortalecer el sistema inmune.",    price: "20.00", stock: 35,  unit: "frasco 30ml" },
    { name: "Jalea Real 20g",                description: "Jalea real fresca de alta calidad. Estimula el sistema inmunitario y aporta energía natural.",            price: "35.00", stock: 20,  unit: "frasco 20g" },
    { name: "Cera de Abejas 100g",           description: "Cera de abejas pura en barra. Para cosméticos naturales, lustrar muebles y elaborar velas.",             price: "12.00", stock: 40,  unit: "barra 100g" },
    { name: "Miel de Café 300ml",            description: "Miel especial cosechada de colmenas en cafetales de altura. Sabor floral único y delicado.",              price: "28.00", stock: 25,  unit: "frasco 300ml" },
    { name: "Miel Cremada 500g",             description: "Miel cristalizada cremosa a temperatura controlada. Textura suave ideal para untar en pan.",              price: "28.00", stock: 30,  unit: "frasco 500g" },
    { name: "Kit Apicultura Principiante",   description: "Set básico: velo, guantes y ahumador para iniciarse en la apicultura natural de la selva.",               price: "85.00", stock: 8,   unit: "set" },
    { name: "Velas de Cera de Abejas",       description: "Velas artesanales de cera de abeja pura. Aroma natural suave, sin humo tóxico ni parafina.",             price: "15.00", stock: 25,  unit: "pack 3 velas" },
  ],
  "plantas-hierbas": [
    { name: "Uña de Gato en Cápsulas",       description: "Uña de gato amazónica en cápsulas 500mg. Inmunoestimulante y antiinflamatoria natural certificada.",     price: "25.00", stock: 50,  unit: "frasco 60 cáps" },
    { name: "Sangre de Grado 200ml",         description: "Látex de árbol sangre de grado, cicatrizante y antiulceroso. Uso interno y externo.",                    price: "18.00", stock: 40,  unit: "frasco 200ml" },
    { name: "Muña Seca 100g",                description: "Hierba andino-amazónica para digestión, osteoporosis y mal de altura. Infusión o masticación.",          price: "8.00",  stock: 70,  unit: "bolsa 100g" },
    { name: "Valeriana Raíz 100g",           description: "Raíz de valeriana seca con propiedades sedantes y ansiolíticas. Para el insomnio y nerviosismo.",        price: "10.00", stock: 55,  unit: "bolsa 100g" },
    { name: "Jengibre en Polvo 100g",        description: "Jengibre orgánico deshidratado. Antiinflamatorio, digestivo y antinauseoso.",                            price: "9.00",  stock: 90,  unit: "sobre 100g" },
    { name: "Cúrcuma Molida 100g",           description: "Cúrcuma orgánica molida de producción local. Potente antiinflamatorio y antioxidante.",                  price: "9.00",  stock: 85,  unit: "sobre 100g" },
    { name: "Manzanilla en Bolsitas",        description: "Té de manzanilla natural en 50 bolsitas individuales. Digestivo, calmante y relajante.",                 price: "6.00",  stock: 100, unit: "caja 50 bolsitas" },
    { name: "Aceite de Copaiba 50ml",        description: "Aceite de copaiba puro del árbol amazónico. Antiinflamatorio y cicatrizante natural.",                   price: "22.00", stock: 30,  unit: "frasco 50ml" },
    { name: "Llantén Seco 100g",             description: "Llantén (Plantago major) deshidratado. Para afecciones respiratorias, gastritis y heridas.",             price: "7.00",  stock: 60,  unit: "bolsa 100g" },
    { name: "Chancapiedra 100g",             description: "Planta medicinal para disolver cálculos renales y biliares. Uso en infusión.",                           price: "12.00", stock: 45,  unit: "bolsa 100g" },
  ],
  "carnes-pescados": [
    { name: "Pollo Entero (kg)",             description: "Pollo de corral fresco sin hormonas. Criado en granja local con alimentación natural.",                  price: "9.00",  stock: 80,  unit: "kg" },
    { name: "Carne de Res Molida (kg)",      description: "Carne de res molida fresca de primera calidad. Ideal para hamburguesas y guisos.",                       price: "18.00", stock: 50,  unit: "kg" },
    { name: "Bistec de Res (kg)",            description: "Bistec de res tierno cortado al momento. Perfecto para la parrilla o asado.",                             price: "22.00", stock: 40,  unit: "kg" },
    { name: "Costillas de Cerdo (kg)",       description: "Costillas de cerdo frescas de producción local. Sabrosas y jugosas para el horno.",                      price: "16.00", stock: 45,  unit: "kg" },
    { name: "Trucha Fresca (kg)",            description: "Trucha fresca de piscigranjas de la región Junín. Rica en omega-3 y proteínas.",                         price: "18.00", stock: 35,  unit: "kg" },
    { name: "Chicharrón de Cerdo (kg)",      description: "Chicharrón de cerdo dorado y crocante, preparado diariamente en el local.",                              price: "25.00", stock: 30,  unit: "kg" },
    { name: "Boquichico Fresco (kg)",        description: "Boquichico del río, el pescado más consumido de la región. Ideal para fritura.",                          price: "14.00", stock: 25,  unit: "kg" },
    { name: "Cecina de Cerdo (kg)",          description: "Cecina de cerdo salada y ahumada al estilo amazónico. Ideal para juane y platos típicos.",               price: "28.00", stock: 20,  unit: "kg" },
    { name: "Pechuga de Pollo (kg)",         description: "Pechuga de pollo fresca sin hueso. Ideal para parrilla, guisados y dieta.",                              price: "12.00", stock: 60,  unit: "kg" },
    { name: "Ahumado de Trucha (unid)",      description: "Trucha ahumada artesanalmente con leña de molle. Lista para consumir o usar en ensaladas.",              price: "20.00", stock: 20,  unit: "unidad" },
  ],
  "panaderia-pasteles": [
    { name: "Pan Francés (docena)",          description: "Pan francés crocante horneado cada mañana desde las 5am.",                                               price: "3.00",  stock: 200, unit: "docena" },
    { name: "Pan de Molde Integral",         description: "Pan de molde integral con semillas. Sin conservantes artificiales.",                                      price: "8.00",  stock: 50,  unit: "unidad" },
    { name: "Torta de Chocolate 1kg",        description: "Torta húmeda de chocolate con ganache. Pedidos con 24h anticipación.",                                   price: "65.00", stock: 10,  unit: "unidad" },
    { name: "Empanadas de Carne (unid)",     description: "Empanadas horneadas rellenas de carne molida con ají amarillo y aceitunas.",                             price: "3.50",  stock: 80,  unit: "unidad" },
    { name: "Pan de Yema (docena)",          description: "Pan de yema suave y dorado, ideal para desayuno con mantequilla.",                                        price: "6.00",  stock: 100, unit: "docena" },
    { name: "Bizcocho de Naranja",           description: "Bizcocho esponjoso de naranja. Perfecto para la hora del té.",                                           price: "15.00", stock: 30,  unit: "unidad" },
    { name: "Croissant de Mantequilla",      description: "Croissant hojaldrado con mantequilla natural. Para desayuno o merienda.",                                price: "4.50",  stock: 40,  unit: "unidad" },
    { name: "Cupcakes Decorados (6 unid)",   description: "Set de 6 cupcakes decorados para cumpleaños y celebraciones.",                                           price: "28.00", stock: 15,  unit: "set 6 unid" },
    { name: "Rosquitas de Manteca (kg)",     description: "Rosquitas crocantes de manteca de cerdo. Tradicionales perfectas con café.",                             price: "18.00", stock: 25,  unit: "kg" },
    { name: "Pan Dulce Especiado",           description: "Pan dulce con canela y vainilla, receta tradicional de la panadería.",                                   price: "0.80",  stock: 150, unit: "unidad" },
  ],
  "abarrotes-bodega": [
    { name: "Arroz Extra Calidad 5kg",       description: "Arroz blanco de grano largo calidad extra. Producción nacional.",                                        price: "22.00", stock: 100, unit: "bolsa 5kg" },
    { name: "Azúcar Rubia 2kg",              description: "Azúcar rubia granulada de caña. La preferida en Chanchamayo.",                                           price: "7.00",  stock: 150, unit: "bolsa 2kg" },
    { name: "Aceite Vegetal 1L",             description: "Aceite vegetal de girasol. Bajo en grasas saturadas y sin colesterol.",                                  price: "9.00",  stock: 80,  unit: "botella 1L" },
    { name: "Fideos Spaghetti 500g",         description: "Fideos de trigo enriquecidos con hierro. Para todas las preparaciones.",                                 price: "3.50",  stock: 200, unit: "bolsa 500g" },
    { name: "Leche Evaporada Gloria",        description: "Leche evaporada entera en lata. La preferida de las familias peruanas.",                                 price: "3.80",  stock: 100, unit: "lata 400g" },
    { name: "Atún en Lata Florida",          description: "Atún en agua y sal, rico en proteínas y omega-3. Para ensaladas y pastas.",                              price: "5.50",  stock: 80,  unit: "lata 170g" },
    { name: "Avena en Copos 500g",           description: "Avena entera en copos para desayuno. Rica en fibra y vitaminas B.",                                      price: "5.00",  stock: 90,  unit: "bolsa 500g" },
    { name: "Harina de Trigo 1kg",           description: "Harina de trigo sin preparar para repostería y cocina.",                                                 price: "4.50",  stock: 120, unit: "bolsa 1kg" },
    { name: "Sal de Mesa 1kg",               description: "Sal yodada de mesa enriquecida con yodo y flúor.",                                                       price: "1.50",  stock: 200, unit: "bolsa 1kg" },
    { name: "Jabón de Ropa",                 description: "Jabón de lavar ropa en barra. Efectivo en agua fría y caliente.",                                        price: "2.50",  stock: 150, unit: "barra 300g" },
  ],
  "ropa-calzado": [
    { name: "Polo Manga Corta Hombre",       description: "Polo de algodón 100% nacional. Cómodo para el clima de la zona. Tallas S a XXL.",                        price: "25.00", stock: 80,  unit: "unidad" },
    { name: "Jeans Slim Fit Dama",           description: "Pantalón jean de mezclilla elástica, ajuste slim. Moda actual a precio accesible.",                       price: "55.00", stock: 40,  unit: "unidad" },
    { name: "Vestido Casual Floral",         description: "Vestido floral liviano ideal para el clima cálido. Tallas S, M y L disponibles.",                         price: "45.00", stock: 30,  unit: "unidad" },
    { name: "Zapatillas Deportivas",         description: "Zapatillas deportivas unisex con suela antideslizante. Ideales para ciudad y campo.",                     price: "80.00", stock: 25,  unit: "par" },
    { name: "Sandalias Mujer",               description: "Sandalias femeninas de cuero sintético con suela confort. Para el verano.",                               price: "35.00", stock: 35,  unit: "par" },
    { name: "Camisa a Cuadros",              description: "Camisa de manga larga a cuadros, tela lino-algodón. Fresca y elegante.",                                 price: "40.00", stock: 30,  unit: "unidad" },
    { name: "Short Deportivo",               description: "Short de tela secado rápido para deporte y actividades al aire libre.",                                   price: "30.00", stock: 50,  unit: "unidad" },
    { name: "Mochila Casual 30L",            description: "Mochila urbana de 30 litros con compartimentos múltiples. Resistente al agua.",                           price: "60.00", stock: 20,  unit: "unidad" },
    { name: "Cinturón de Cuero",             description: "Cinturón de cuero genuino con hebilla clásica. Tallas 32 a 40.",                                          price: "22.00", stock: 40,  unit: "unidad" },
    { name: "Chompa de Polar",               description: "Chompa de polar con cierre para las noches frescas. Abrigo liviano y duradero.",                          price: "50.00", stock: 25,  unit: "unidad" },
  ],
  "artesania": [
    { name: "Collar de Semillas",            description: "Collar artesanal con semillas amazónicas. Pieza única elaborada por artesanas locales.",                   price: "25.00", stock: 40,  unit: "unidad" },
    { name: "Bolso Tejido de Caña",          description: "Bolso artesanal tejido con fibra de caña y palma. Diseños tradicionales de la selva.",                    price: "45.00", stock: 25,  unit: "unidad" },
    { name: "Tapete de Palma",               description: "Tapete decorativo tejido a mano con palma real. Motivos geométricos amazónicos.",                          price: "60.00", stock: 15,  unit: "unidad" },
    { name: "Arco y Flecha Decorativo",      description: "Arco y flecha artesanal de madera de la selva. Pieza decorativa coleccionable de 80cm.",                  price: "80.00", stock: 10,  unit: "set" },
    { name: "Sonajero de Semillas",          description: "Instrumento musical artesanal con semillas de shacapa y bambú. Para danza y meditación.",                  price: "20.00", stock: 30,  unit: "unidad" },
    { name: "Canasta de Palma",              description: "Canasta tejida con hojas de palma. Utilitaria y decorativa, 30cm de diámetro.",                           price: "35.00", stock: 20,  unit: "unidad" },
    { name: "Pulsera de Huayruro",           description: "Pulsera artesanal con semillas rojas de huayruro, símbolo de buena suerte.",                             price: "10.00", stock: 60,  unit: "unidad" },
    { name: "Máscara Decorativa Selva",      description: "Máscara tallada en madera con motivos de la cosmovisión amazónica. Obra única.",                          price: "90.00", stock: 8,   unit: "unidad" },
    { name: "Colgante de Madera",            description: "Colgante tallado en madera de huayruro con forma de animales amazónicos.",                               price: "15.00", stock: 50,  unit: "unidad" },
    { name: "Cushma Artesanal",              description: "Túnica tradicional tejida a mano con algodón natural y tintes naturales.",                               price: "150.00",stock: 8,   unit: "unidad" },
  ],
  "ferreteria-construccion": [
    { name: "Cemento Portland 42.5kg",       description: "Cemento Portland tipo I de alta resistencia para construcciones y obras civiles.",                         price: "35.00", stock: 60,  unit: "bolsa" },
    { name: "Pintura Látex Interior 4L",     description: "Pintura látex lavable alta cobertura. Secado rápido. Colores disponibles.",                               price: "45.00", stock: 40,  unit: "balde 4L" },
    { name: "Taladro Percutor 700W",         description: "Taladro percutor eléctrico 700W con mandril 13mm. Incluye maletín y brocas.",                             price: "180.00",stock: 10,  unit: "unidad" },
    { name: "Cable Eléctrico THW 14 (25m)", description: "Cable eléctrico de cobre calibre 14. Rollo de 25m para instalaciones domiciliarias.",                     price: "55.00", stock: 25,  unit: "rollo 25m" },
    { name: "Clavos de Acero 1kg",           description: "Clavos de acero galvanizado surtidos 1\", 2\", 3\" y 4\".",                                              price: "6.00",  stock: 100, unit: "kg" },
    { name: "Cinta Métrica 5m",              description: "Cinta métrica de acero con funda antideslizante. Precisión de 1mm.",                                      price: "12.00", stock: 50,  unit: "unidad" },
    { name: "Manguera de Agua 25m",          description: "Manguera flexible de PVC reforzada 3/4\". Resistente a la presión y rayos UV.",                           price: "35.00", stock: 20,  unit: "rollo 25m" },
    { name: "Interruptor Doble",             description: "Interruptor eléctrico doble de empotrar. Capacidad 10A 250V.",                                             price: "8.00",  stock: 60,  unit: "unidad" },
    { name: "Alambre Negro 16 (1kg)",        description: "Alambre negro recocido calibre 16 para amarre en construcción. Rollo de 1kg.",                           price: "8.00",  stock: 80,  unit: "rollo" },
    { name: "Llave Francesa 10\"",           description: "Llave inglesa ajustable de 10 pulgadas de acero cromado. Para plomería.",                                 price: "22.00", stock: 30,  unit: "unidad" },
  ],
  "farmacia-salud": [
    { name: "Vitamina C 500mg x100",         description: "Tabletas de vitamina C 500mg. Refuerza el sistema inmunológico.",                                         price: "18.00", stock: 60,  unit: "frasco 100 tab" },
    { name: "Paracetamol 500mg x20",         description: "Analgésico y antipirético genérico. Para dolor de cabeza y fiebre.",                                      price: "4.50",  stock: 100, unit: "caja 20 tab" },
    { name: "Ibuprofeno 400mg x20",          description: "Antiinflamatorio para dolor, fiebre e inflamación. Uso adultos.",                                         price: "6.00",  stock: 80,  unit: "caja 20 tab" },
    { name: "Alcohol Antiséptico 500ml",     description: "Alcohol isopropílico 70% para desinfección de heridas y superficies.",                                    price: "7.00",  stock: 90,  unit: "frasco 500ml" },
    { name: "Termómetro Digital",            description: "Termómetro digital de axila LCD. Lectura en 60 segundos con alarma de fiebre.",                           price: "25.00", stock: 30,  unit: "unidad" },
    { name: "Multivitamínico Adulto x60",    description: "Multivitamínico completo con 13 vitaminas y 10 minerales esenciales.",                                    price: "28.00", stock: 40,  unit: "frasco 60 tab" },
    { name: "Mascarillas Quirúrgicas x50",   description: "Mascarillas de 3 capas con filtro. Protección contra partículas y polvo.",                               price: "15.00", stock: 100, unit: "caja 50 unid" },
    { name: "Gasas Esterilizadas 10x10",     description: "Gasas estériles para curas y vendajes. Paquete de 10 unidades.",                                          price: "4.00",  stock: 70,  unit: "paquete 10 unid" },
    { name: "Solución Salina 1L",            description: "Suero fisiológico para lavado nasal y ocular. Estéril y lista para usar.",                                price: "8.00",  stock: 50,  unit: "frasco 1L" },
    { name: "Zinc + Vitamina C x30",         description: "Suplemento de zinc y vitamina C para fortalecer las defensas. Sabor naranja.",                            price: "22.00", stock: 45,  unit: "frasco 30 tab" },
  ],
  "belleza-cuidado": [
    { name: "Shampoo Natural Cacao 300ml",   description: "Shampoo con extracto de cacao y argán. Hidrata y fortalece el cabello. Sin sulfatos.",                    price: "25.00", stock: 50,  unit: "frasco 300ml" },
    { name: "Crema Hidratante Facial 50ml",  description: "Crema facial con aloe vera y aceite de rosa mosqueta. Para todo tipo de piel.",                           price: "35.00", stock: 40,  unit: "frasco 50ml" },
    { name: "Jabón Artesanal de Miel",       description: "Jabón artesanal con miel de abeja y avena. Nutritivo y suavizante para la piel sensible.",               price: "12.00", stock: 60,  unit: "barra 100g" },
    { name: "Aceite de Coco Virgen 200ml",   description: "Aceite de coco virgen prensado en frío. Para cabello, piel y cocina saludable.",                          price: "28.00", stock: 35,  unit: "frasco 200ml" },
    { name: "Desodorante Natural 75g",       description: "Desodorante de piedra de alumbre natural. Sin alcohol ni parabenos. Efectivo 24h.",                       price: "18.00", stock: 45,  unit: "barra 75g" },
    { name: "Mascarilla Capilar 300ml",      description: "Mascarilla nutritiva con proteína de cacao y manteca de karité. Para cabello seco.",                      price: "32.00", stock: 30,  unit: "frasco 300ml" },
    { name: "Sérum Vitamina C 30ml",         description: "Sérum facial con vitamina C estabilizada. Ilumina, unifica el tono y reduce manchas.",                   price: "45.00", stock: 25,  unit: "frasco 30ml" },
    { name: "Talco Mentolado 200g",          description: "Talco refrescante con mentol para pies y cuerpo. Absorbe humedad y previene rozaduras.",                  price: "12.00", stock: 70,  unit: "lata 200g" },
    { name: "Perfume Floral 50ml",           description: "Agua de perfume con notas florales de la selva: orquídea, jazmín y rosa silvestre.",                      price: "55.00", stock: 20,  unit: "frasco 50ml" },
    { name: "Set Manicure 7 piezas",         description: "Kit de manicure con cortaúñas, lima, empujador y accesorios. Estuche elegante.",                          price: "22.00", stock: 30,  unit: "set" },
  ],
  "electronica-tecnologia": [
    { name: "Cable USB-C 1m",                description: "Cable de carga rápida USB-C de alta resistencia. Compatible con todos los dispositivos USB-C.",           price: "15.00", stock: 80,  unit: "unidad" },
    { name: "Cargador Rápido 65W",           description: "Cargador GaN 65W con puerto USB-A y USB-C. Carga rápida para laptop, tablet y móvil.",                   price: "55.00", stock: 30,  unit: "unidad" },
    { name: "Auriculares Bluetooth",         description: "Auriculares inalámbricos con cancelación de ruido. Batería 30h. Conexión Bluetooth 5.0.",                 price: "120.00",stock: 20,  unit: "unidad" },
    { name: "Funda Silicona Samsung A54",    description: "Funda protectora de silicona premium para Samsung Galaxy A54. Colores variados.",                          price: "18.00", stock: 50,  unit: "unidad" },
    { name: "Funda iPhone 14/15",            description: "Funda transparente MagSafe para iPhone 14/15. Protección militar grado A.",                               price: "25.00", stock: 40,  unit: "unidad" },
    { name: "Memoria MicroSD 128GB",         description: "Tarjeta microSD 128GB clase 10 A2. Velocidad de lectura 100MB/s. Para cámara y teléfono.",               price: "45.00", stock: 35,  unit: "unidad" },
    { name: "Adaptador HDMI a USB-C",        description: "Adaptador multipuerto USB-C a HDMI 4K + USB 3.0 + carga 100W. Para laptop y tablet.",                   price: "38.00", stock: 25,  unit: "unidad" },
    { name: "Parlante Bluetooth Portátil",   description: "Parlante Bluetooth 20W resistente al agua IPX7. Batería 12h. Sonido envolvente 360°.",                    price: "150.00",stock: 15,  unit: "unidad" },
    { name: "Soporte Celular para Auto",     description: "Soporte magnético de ventosa para celular en el auto. Universal para todos los tamaños.",                  price: "22.00", stock: 40,  unit: "unidad" },
    { name: "Batería Portátil 20000mAh",     description: "Power bank 20000mAh con carga rápida 22.5W. Doble puerto USB. Pantalla LED de nivel.",                   price: "95.00", stock: 20,  unit: "unidad" },
  ],
  "hogar-muebles": [
    { name: "Juego de Sábanas King",         description: "Juego de sábanas de algodón 200 hilos para cama King. Incluye sábana encimera, bajera y 2 fundas.",      price: "85.00", stock: 20,  unit: "set" },
    { name: "Cojín Decorativo 45x45cm",      description: "Cojín decorativo con funda de tela estampada. Relleno de fibra siliconada. Lavable.",                    price: "25.00", stock: 40,  unit: "unidad" },
    { name: "Organizador de Cocina",         description: "Set de organizadores modulares para armario de cocina. Plástico resistente de grado alimentario.",          price: "45.00", stock: 25,  unit: "set 6 piezas" },
    { name: "Espejo Decorativo 60x80cm",     description: "Espejo rectangular con marco de madera natural. Para sala, dormitorio o entrada.",                         price: "120.00",stock: 10,  unit: "unidad" },
    { name: "Lámpara de Mesa LED",           description: "Lámpara de escritorio LED con luz cálida, neutra y fría. Dimmer ajustable. USB integrado.",               price: "65.00", stock: 15,  unit: "unidad" },
    { name: "Olla de Presión 7L",            description: "Olla a presión de aluminio anodizado 7 litros. Con sistema de seguridad y válvula autorregulable.",       price: "95.00", stock: 12,  unit: "unidad" },
    { name: "Set de Toallas x3",             description: "Set de 3 toallas (mano, cara y baño) en algodón absorbente. Colores variados disponibles.",               price: "45.00", stock: 30,  unit: "set" },
    { name: "Canasto de Ropa Sucia",         description: "Canasto de ropa con tapa de bambú y bolsa interior de tela. Capacidad 80L.",                              price: "55.00", stock: 15,  unit: "unidad" },
    { name: "Estante Flotante 60cm",         description: "Estante de madera MDF con soportes metálicos. Capacidad 20kg. Ideal para sala o dormitorio.",              price: "40.00", stock: 20,  unit: "unidad" },
    { name: "Cuadro Decorativo Selva",       description: "Cuadro artístico con pintura de paisaje amazónico. Marco de madera natural 40x60cm.",                     price: "75.00", stock: 10,  unit: "unidad" },
  ],
  "agricultura-insumos": [
    { name: "Semillas de Café Catimor",      description: "Semillas certificadas de café Catimor seleccionadas. Alta resistencia a la roya. 50 semillas/sobre.",     price: "25.00", stock: 40,  unit: "sobre 50 semillas" },
    { name: "Abono Orgánico Compost (20kg)", description: "Compost orgánico de restos de cacao y café. Mejora estructura del suelo y aporta nutrientes.",            price: "30.00", stock: 30,  unit: "saco 20kg" },
    { name: "Fertilizante NPK 20-20-20",    description: "Fertilizante balanceado para etapa vegetativa. Soluble en agua para riego por goteo.",                    price: "45.00", stock: 25,  unit: "bolsa 5kg" },
    { name: "Machete Agrícola 18\"",         description: "Machete de acero templado con mango de madera. Indispensable para el trabajo agrícola de la selva.",      price: "22.00", stock: 50,  unit: "unidad" },
    { name: "Mochila Fumigadora 20L",        description: "Mochila aspersora de 20 litros con bomba manual y boquilla ajustable. Para fumigación de cultivos.",      price: "85.00", stock: 15,  unit: "unidad" },
    { name: "Semillas de Cacao CCN-51",      description: "Semillas clonales de cacao CCN-51, alta productividad y tolerancia a enfermedades.",                      price: "35.00", stock: 20,  unit: "sobre 30 semillas" },
    { name: "Insecticida Orgánico 1L",       description: "Insecticida a base de neem orgánico. Controla plagas sin dañar el ecosistema del suelo.",                 price: "28.00", stock: 30,  unit: "botella 1L" },
    { name: "Guantes Agrícolas Talla M",     description: "Guantes de trabajo resistentes con recubrimiento de látex. Para protección en labores de campo.",         price: "12.00", stock: 60,  unit: "par" },
    { name: "Rafia para Tutoreo 200m",       description: "Rafia biodegradable para tutoreo y amarre de cultivos. Resistente a la humedad y el sol.",               price: "8.00",  stock: 80,  unit: "rollo 200m" },
    { name: "Sustrato Coco Fiber 5L",        description: "Sustrato de fibra de coco para almácigos y plantas en maceta. Retiene humedad y aireación.",              price: "15.00", stock: 40,  unit: "bolsa 5L" },
  ],
  "servicios-tecnicos": [
    { name: "Cambio de Pantalla Samsung",    description: "Servicio de reemplazo de pantalla para Samsung Galaxy A y M series. Garantía 30 días.",                  price: "120.00",stock: 10,  unit: "servicio" },
    { name: "Cambio de Batería iPhone",      description: "Reemplazo de batería original para iPhone 11, 12, 13 y 14. Tiempo de entrega 2h.",                       price: "80.00", stock: 10,  unit: "servicio" },
    { name: "Instalación Cámaras CCTV 4ch", description: "Instalación de sistema de 4 cámaras HD con DVR, cables y configuración remota.",                          price: "450.00",stock: 5,   unit: "servicio" },
    { name: "Reparación Laptop",             description: "Diagnóstico y reparación de laptop: placa, pantalla, teclado. Presupuesto sin costo.",                    price: "60.00", stock: 10,  unit: "servicio" },
    { name: "Instalación Windows 11",        description: "Instalación y configuración de Windows 11 con drivers actualizados. Incluye antivirus.",                  price: "45.00", stock: 10,  unit: "servicio" },
    { name: "Mantenimiento PC Completo",     description: "Limpieza, actualización de drivers, optimización y antivirus. Tiempo estimado 2 horas.",                  price: "40.00", stock: 10,  unit: "servicio" },
    { name: "Reparación Electrodomésticos",  description: "Reparación de lavadoras, refrigeradoras y ventiladores. A domicilio en el distrito.",                     price: "80.00", stock: 10,  unit: "servicio" },
    { name: "Instalación Antena TV",         description: "Instalación de antena satelital o señal abierta con orientación y cables incluidos.",                     price: "120.00",stock: 8,   unit: "servicio" },
    { name: "Servicio Internet Satelital",   description: "Configuración y activación de internet satelital Starlink. Asistencia técnica in situ.",                  price: "150.00",stock: 5,   unit: "servicio" },
    { name: "Respaldo y Recuperación Datos", description: "Respaldo de datos en nube y recuperación de archivos eliminados de cualquier dispositivo.",               price: "55.00", stock: 10,  unit: "servicio" },
  ],
  "bebidas-jugos": [
    { name: "Jugo de Maracuyá 1L",           description: "Jugo puro de maracuyá sin azúcar añadida. Refrescante y rico en vitamina C.",                            price: "6.00",  stock: 60,  unit: "botella 1L" },
    { name: "Refresco de Cocona 1L",         description: "Refresco de cocona amazónica con alto contenido de vitamina B.",                                          price: "5.00",  stock: 50,  unit: "botella 1L" },
    { name: "Jugo de Guanábana 1L",          description: "Jugo natural de guanábana sin conservantes. Rico en vitaminas del complejo B y hierro.",                 price: "7.00",  stock: 35,  unit: "botella 1L" },
    { name: "Chicha de Jora Artesanal",      description: "Chicha de jora preparada con maíz morado fermentado según receta tradicional.",                           price: "4.00",  stock: 40,  unit: "botella 750ml" },
    { name: "Jugo Mixto Selva 1L",           description: "Mezcla de jugos tropicales: maracuyá, piña y naranja. La favorita de Chanchamayo.",                       price: "7.50",  stock: 30,  unit: "botella 1L" },
    { name: "Agua de Coco Natural",          description: "Agua de coco joven directamente del fruto. Isotónica natural e hidratante.",                              price: "4.00",  stock: 25,  unit: "unidad" },
    { name: "Jugo de Piña Natural 1L",       description: "Jugo de piña chanchamayo recién exprimido. Digestivo y rico en bromelina.",                              price: "5.50",  stock: 40,  unit: "botella 1L" },
    { name: "Masato de Yuca (1L)",           description: "Bebida tradicional amazónica de yuca fermentada. Preparada artesanalmente.",                              price: "5.00",  stock: 20,  unit: "botella 1L" },
    { name: "Té de Hierbas Medicinales",     description: "Infusión de hierbas amazónicas: muña, boldo y menta. Digestivo y relajante.",                            price: "3.00",  stock: 60,  unit: "sobre 10 bolsitas" },
    { name: "Limonada de Tumbo 500ml",       description: "Limonada con tumbo (curuba) de la selva. Sin colorantes artificiales.",                                   price: "4.50",  stock: 45,  unit: "botella 500ml" },
  ],
  "turismo-hospedaje": [
    { name: "Tour Cataratas (1 día)",        description: "Excursión de un día a las cataratas locales con guía nativo. Incluye transporte y snack.",                price: "80.00", stock: 20,  unit: "persona" },
    { name: "Tour Comunidad Nativa",         description: "Visita guiada a comunidad nativa con almuerzo típico y demostración de artesanía.",                       price: "65.00", stock: 20,  unit: "persona" },
    { name: "Hospedaje Cabaña (noche)",      description: "Noche en cabaña ecológica con desayuno incluido. En medio del bosque con vista al río.",                  price: "150.00",stock: 10,  unit: "noche/2 personas" },
    { name: "Alquiler de Bicicleta MTB",     description: "Alquiler de bicicleta de montaña por día. Casco y candado incluidos. Rutas señalizadas.",                price: "30.00", stock: 8,   unit: "día" },
    { name: "Paseo en Canoa (2h)",           description: "Paseo en canoa por el río con guía. Observación de aves y flora amazónica.",                              price: "40.00", stock: 15,  unit: "persona" },
    { name: "Taller de Cocina Regional",     description: "Aprende a cocinar juane, cecina y tacacho con instructor local. Degustación incluida.",                  price: "55.00", stock: 12,  unit: "persona" },
    { name: "Fotografía de Naturaleza (4h)", description: "Tour fotográfico de 4h por senderos del bosque con guía experto en flora y fauna.",                      price: "70.00", stock: 10,  unit: "persona" },
    { name: "Paquete Fin de Semana",         description: "2 noches en cabaña + 2 tours + desayunos. El plan ideal para conocer la selva central.",                price: "380.00",stock: 5,   unit: "paquete 2 pax" },
    { name: "Desayuno Típico (servido)",     description: "Desayuno amazónico: jugo, pan de yuca, revuelto de huevo con cecina y café de altura.",                  price: "18.00", stock: 30,  unit: "persona" },
    { name: "Transfer Aeropuerto (1 vía)",   description: "Traslado en vehículo privado al aeropuerto o terminal más cercano. Capacidad 4 pasajeros.",              price: "45.00", stock: 10,  unit: "servicio" },
  ],
};

// ─── Distritos y sus tiendas ───────────────────────────────────────────────────

interface DistrictData {
  name: string;
  lat: number;
  lng: number;
  suffix: string;
  stores: Array<{
    name: string; catSlug: string; location: string;
    whatsapp: string; description: string; featured: boolean;
  }>;
}

const DISTRICTS: DistrictData[] = [
  {
    name: "La Merced", lat: -11.0575, lng: -75.3197, suffix: "lm",
    stores: [
      {
        name: "La Merced Frutas y Selva",
        catSlug: "frutas-verduras",
        location: "Jr. 2 de Mayo 234, La Merced, Chanchamayo",
        whatsapp: "51964300201",
        description: "La frutería más visitada de La Merced con naranjas, piñas y cítricos frescos del valle. Ofrecemos delivery en el centro de La Merced.",
        featured: true,
      },
      {
        name: "Café del Valle La Merced",
        catSlug: "cafe-cacao",
        location: "Av. Colonizadores 145, La Merced, Chanchamayo",
        whatsapp: "51964300202",
        description: "Cafetería especializada en granos de café de altura de Chanchamayo. Tostamos artesanalmente en el local. También ofrecemos cacao en tabletas.",
        featured: true,
      },
    ],
  },
  {
    name: "Pichanaqui", lat: -10.9467, lng: -74.9958, suffix: "pq",
    stores: [
      {
        name: "Carnes Frescas Pichanaqui",
        catSlug: "carnes-pescados",
        location: "Mercado Municipal Stand 5, Pichanaqui, Chanchamayo",
        whatsapp: "51964300301",
        description: "Carnes frescas de res, cerdo y pollo locales en Pichanaqui. También contamos con trucha fresca del río y boquichico. Abrimos desde las 5am.",
        featured: true,
      },
      {
        name: "Bodega Central Pichanaqui",
        catSlug: "abarrotes-bodega",
        location: "Av. Las Palmas 112, Pichanaqui, Chanchamayo",
        whatsapp: "51964300302",
        description: "La bodega más completa de Pichanaqui con abarrotes, bebidas y productos de limpieza. Precios al por mayor y menor. Atendemos 6am a 10pm.",
        featured: false,
      },
    ],
  },
  {
    name: "San Luis de Shuaro", lat: -11.1150, lng: -75.2200, suffix: "sls",
    stores: [
      {
        name: "Miel Pura de Shuaro",
        catSlug: "miel-apicultura",
        location: "Jr. Progreso 78, San Luis de Shuaro, Chanchamayo",
        whatsapp: "51964300401",
        description: "Miel de abeja pura de colmenas de la selva de Shuaro. Sin procesar, sin calentar. Polen, propóleo y jalea real también disponibles.",
        featured: true,
      },
      {
        name: "Artesanías de Shuaro",
        catSlug: "artesania",
        location: "Calle Principal 45, San Luis de Shuaro, Chanchamayo",
        whatsapp: "51964300402",
        description: "Artesanías auténticas elaboradas por comunidades de San Luis de Shuaro. Collares, canastas, tapetes y máscaras con materiales amazónicos.",
        featured: false,
      },
    ],
  },
  {
    name: "Vitoc", lat: -11.2200, lng: -75.3100, suffix: "vt",
    stores: [
      {
        name: "Plantas Medicinales Vitoc",
        catSlug: "plantas-hierbas",
        location: "Jr. Amazonas 23, Vitoc, Chanchamayo",
        whatsapp: "51964300501",
        description: "Hierbas medicinales frescas y secas del bosque de Vitoc. Uña de gato, sangre de grado, muña y más de 40 variedades de plantas curativas.",
        featured: false,
      },
      {
        name: "Jugos Naturales de Vitoc",
        catSlug: "bebidas-jugos",
        location: "Av. Principal 56, Vitoc, Chanchamayo",
        whatsapp: "51964300502",
        description: "Jugos naturales de frutas amazónicas preparados al momento. Maracuyá, cocona, guanábana y mezclas especiales sin conservantes.",
        featured: true,
      },
    ],
  },
  {
    name: "Perené", lat: -10.9000, lng: -75.1000, suffix: "pe",
    stores: [
      {
        name: "Café Orgánico Perené",
        catSlug: "cafe-cacao",
        location: "Jr. San Martín 189, Perené, Chanchamayo",
        whatsapp: "51964300601",
        description: "Café orgánico certificado de los cafetales de Perené. Variedades Typica, Bourbon y Geisha. Tostado artesanal a pedido.",
        featured: true,
      },
      {
        name: "Frutas de Perené",
        catSlug: "frutas-verduras",
        location: "Mercado de Perené Stand 12, Perené, Chanchamayo",
        whatsapp: "51964300602",
        description: "Frutas frescas de las chacras de Perené: naranjas, piñas, papayas y plátanos directamente del productor al consumidor.",
        featured: false,
      },
    ],
  },
  {
    name: "Satipo", lat: -11.2572, lng: -74.6353, suffix: "sa",
    stores: [
      {
        name: "Moda y Calzado Satipo",
        catSlug: "ropa-calzado",
        location: "Jr. Manuel Prado 234, Satipo, Junín",
        whatsapp: "51964300701",
        description: "La tienda de moda más grande de Satipo con ropa, calzado y accesorios para toda la familia. Marcas nacionales e importadas.",
        featured: true,
      },
      {
        name: "Farmacia Salud Satipo",
        catSlug: "farmacia-salud",
        location: "Av. Colonos 456, Satipo, Junín",
        whatsapp: "51964300702",
        description: "Farmacia completa con medicamentos genéricos y de marca. Químico farmacéutico disponible para orientación. Delivery en Satipo.",
        featured: false,
      },
    ],
  },
  {
    name: "Mazamari", lat: -11.3267, lng: -74.5344, suffix: "mz",
    stores: [
      {
        name: "Bodega Mazamari Centro",
        catSlug: "abarrotes-bodega",
        location: "Jr. Progreso 67, Mazamari, Satipo",
        whatsapp: "51964300801",
        description: "Bodega central de Mazamari con todos los productos de primera necesidad. Precios justos y atención de calidad desde hace 15 años.",
        featured: false,
      },
      {
        name: "Carnicería El Bosque",
        catSlug: "carnes-pescados",
        location: "Mercado de Mazamari Stand 8, Mazamari, Satipo",
        whatsapp: "51964300802",
        description: "Carnes frescas y pescados del río en Mazamari. Especialidad en cecina de cerdo ahumada al estilo amazónico y boquichico fresco.",
        featured: true,
      },
    ],
  },
  {
    name: "San Martín de Pangoa", lat: -11.4000, lng: -74.4667, suffix: "smp",
    stores: [
      {
        name: "Artesanías de Pangoa",
        catSlug: "artesania",
        location: "Jr. Independencia 34, San Martín de Pangoa, Satipo",
        whatsapp: "51964300901",
        description: "Artesanías de comunidades Asháninka de Pangoa. Piezas únicas tejidas y talladas a mano con materiales naturales de la selva.",
        featured: true,
      },
      {
        name: "Agro Insumos Pangoa",
        catSlug: "agricultura-insumos",
        location: "Av. Agraria 112, San Martín de Pangoa, Satipo",
        whatsapp: "51964300902",
        description: "Insumos agrícolas para caficultores y cacaoteros de Pangoa. Semillas certificadas, fertilizantes orgánicos y herramientas de campo.",
        featured: false,
      },
    ],
  },
  {
    name: "Río Negro", lat: -11.3758, lng: -74.7736, suffix: "rn",
    stores: [
      {
        name: "Jugos del Río Negro",
        catSlug: "bebidas-jugos",
        location: "Jr. Las Flores 45, Río Negro, Satipo",
        whatsapp: "51964301001",
        description: "Jugos naturales y refrescos amazónicos preparados al instante. Cocona, maracuyá, guanábana y masato tradicional.",
        featured: false,
      },
      {
        name: "Panadería Río Negro",
        catSlug: "panaderia-pasteles",
        location: "Av. Central 78, Río Negro, Satipo",
        whatsapp: "51964301002",
        description: "Panadería artesanal de Río Negro. Pan francés horneado cada mañana, tortas decoradas y empanadas de carne caseras.",
        featured: true,
      },
    ],
  },
  {
    name: "Tarma", lat: -11.4197, lng: -75.6894, suffix: "ta",
    stores: [
      {
        name: "Ferretería El Andino",
        catSlug: "ferreteria-construccion",
        location: "Jr. Lima 312, Tarma, Junín",
        whatsapp: "51964301101",
        description: "Ferretería completa en Tarma con materiales de construcción, herramientas eléctricas y plomería. Asesoría técnica gratuita y servicio a domicilio.",
        featured: true,
      },
      {
        name: "Muebles y Hogar Tarma",
        catSlug: "hogar-muebles",
        location: "Av. Palcamayo 156, Tarma, Junín",
        whatsapp: "51964301102",
        description: "Artículos para el hogar, decoración y muebles en Tarma. Sábanas, lámparas, ollas y todo para amueblar tu hogar a precios accesibles.",
        featured: false,
      },
    ],
  },
  {
    name: "Jauja", lat: -11.7769, lng: -75.4861, suffix: "ja",
    stores: [
      {
        name: "Panadería La Jaujina",
        catSlug: "panaderia-pasteles",
        location: "Jr. Junín 234, Jauja, Junín",
        whatsapp: "51964301201",
        description: "Panadería tradicional de Jauja con 30 años de historia. Pan de yema, bizcochos andinos y tortas decoradas para toda ocasión.",
        featured: true,
      },
      {
        name: "Mieles del Valle de Jauja",
        catSlug: "miel-apicultura",
        location: "Av. Marco Cápac 89, Jauja, Junín",
        whatsapp: "51964301202",
        description: "Miel de abeja del Valle del Mantaro, zona declarada libre de pesticidas. Polen, propóleo y jalea real de producción artesanal.",
        featured: false,
      },
    ],
  },
  {
    name: "Huancayo", lat: -12.0652, lng: -75.2050, suffix: "hyo",
    stores: [
      {
        name: "TechHuancayo Electronics",
        catSlug: "electronica-tecnologia",
        location: "Jr. Real 456, Huancayo, Junín",
        whatsapp: "51964301301",
        description: "Tienda de electrónica en Huancayo con accesorios para celulares, laptops y cámaras. Importación directa, precios competitivos y garantía.",
        featured: true,
      },
      {
        name: "Beauty Center Huancayo",
        catSlug: "belleza-cuidado",
        location: "Av. Giráldez 234, Huancayo, Junín",
        whatsapp: "51964301302",
        description: "Centro de belleza y cuidado personal en Huancayo. Cosméticos naturales, cremas, perfumes y kits de cuidado para hombres y mujeres.",
        featured: false,
      },
    ],
  },
  {
    name: "El Tambo", lat: -12.0453, lng: -75.2100, suffix: "et",
    stores: [
      {
        name: "Moda El Tambo",
        catSlug: "ropa-calzado",
        location: "Av. Leoncio Prado 123, El Tambo, Huancayo",
        whatsapp: "51964301401",
        description: "Tienda de ropa y calzado para toda la familia en El Tambo. Últimas tendencias con marcas nacionales e internacionales a precios justos.",
        featured: false,
      },
      {
        name: "Técnico Express El Tambo",
        catSlug: "servicios-tecnicos",
        location: "Jr. Arequipa 78, El Tambo, Huancayo",
        whatsapp: "51964301402",
        description: "Servicio técnico de celulares, laptops y electrodomésticos en El Tambo. Reparaciones rápidas con garantía. Cambio de pantallas y baterías.",
        featured: true,
      },
    ],
  },
  {
    name: "Chilca", lat: -12.0786, lng: -75.2356, suffix: "ch",
    stores: [
      {
        name: "Farmacia Chilca Salud",
        catSlug: "farmacia-salud",
        location: "Av. Huancayo 345, Chilca, Huancayo",
        whatsapp: "51964301501",
        description: "Farmacia y botica en Chilca con medicamentos genéricos y de marca a precios accesibles. Atención de lunes a sábado de 8am a 8pm.",
        featured: false,
      },
      {
        name: "Abarrotes La Chilquena",
        catSlug: "abarrotes-bodega",
        location: "Jr. Comercio 67, Chilca, Huancayo",
        whatsapp: "51964301502",
        description: "La bodega más completa de Chilca. Productos de primera necesidad, bebidas y artículos de limpieza. Precios al por menor y mayor.",
        featured: true,
      },
    ],
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌎 Seed Otros Distritos — Mercanto\n");
  console.log("ℹ️  Script ADITIVO: no elimina datos de San Ramón\n");

  // Get existing categories (created by seed-san-ramon)
  const cats = await db.select().from(categoriesTable);
  if (cats.length === 0) {
    throw new Error("No hay categorías en la base de datos. Ejecuta primero seed-san-ramon.");
  }
  const catMap = new Map(cats.map(c => [c.slug, c.id]));
  console.log(`✓ ${cats.length} categorías encontradas`);

  // Get existing users to pick reviewers from
  const existingUsers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  console.log(`✓ ${existingUsers.length} usuarios existentes (usados para reseñas)\n`);

  // Create vendor users (2 per district)
  console.log("👥 Creando 28 usuarios vendedores...");
  const pwHash = await bcrypt.hash("User2024!", 10);
  const newUsersData: typeof usersTable.$inferInsert[] = [];
  let phoneIdx = 200;

  for (const dist of DISTRICTS) {
    for (let i = 1; i <= 2; i++) {
      const slug = dist.suffix.replace(/-/g, "");
      newUsersData.push({
        name: `Vendedor${i} ${dist.name}`,
        email: `vendor${i}.${slug}@mercanto.pe`,
        phone: `5196220${String(phoneIdx).padStart(4, "0")}`,
        district: dist.name,
        role: "vendor" as const,
        passwordHash: pwHash,
      });
      phoneIdx++;
    }
  }

  const insertedUsers = await db.insert(usersTable).values(newUsersData).returning();
  console.log(`  ✓ ${insertedUsers.length} usuarios creados (contraseña: User2024!)\n`);

  // Create stores (2 per district)
  console.log("🏪 Creando 28 tiendas en 14 distritos...");
  let totalStores = 0;
  const allInsertedStores: Array<{ id: number; name: string; catSlug: string }> = [];
  let userIdx = 0;

  for (const dist of DISTRICTS) {
    for (let i = 0; i < dist.stores.length; i++) {
      const s = dist.stores[i];
      const catId = catMap.get(s.catSlug);
      const owner = insertedUsers[userIdx++];

      const [store] = await db.insert(storesTable).values({
        userId: owner.id,
        name: s.name,
        slug: `${slugify(s.name)}-${dist.suffix}`,
        description: s.description,
        categoryId: catId,
        location: s.location,
        district: dist.name,
        lat: jitter(dist.lat),
        lng: jitter(dist.lng),
        whatsapp: s.whatsapp,
        status: "active" as const,
        isFeatured: s.featured,
        bannerUrl: null,
        logoUrl: null,
      }).returning();

      allInsertedStores.push({ id: store.id, name: store.name, catSlug: s.catSlug });
      totalStores++;
      console.log(`  ✓ [${dist.name}] ${s.name}`);
    }
  }
  console.log(`\n  Total: ${totalStores} tiendas creadas\n`);

  // Create 10 products per store
  console.log("📦 Creando 10 productos por tienda (280 productos)...");
  let totalProducts = 0;

  for (const store of allInsertedStores) {
    const catSlug = store.catSlug;
    const prods = PRODUCTS_BY_CATEGORY[catSlug] || PRODUCTS_BY_CATEGORY["abarrotes-bodega"];

    const productValues = prods.map((p, idx) => ({
      storeId: store.id,
      name: p.name,
      slug: `${slugify(p.name)}-${store.id}`,
      description: p.description,
      price: p.price,
      offerPrice: idx === 0 ? String((parseFloat(p.price) * 0.85).toFixed(2)) : null,
      stock: p.stock,
      unit: p.unit,
      status: "active" as const,
      isFeatured: idx < 2,
      isOffer: idx === 0,
    }));

    const insertedProds = await db.insert(productsTable).values(productValues).returning();
    totalProducts += insertedProds.length;

    for (let i = 0; i < insertedProds.length; i++) {
      await db.insert(productImagesTable).values({
        productId: insertedProds[i].id,
        url: getPhoto(catSlug, i),
        publicId: `mercanto/products/${catSlug}-${store.id}-${i}`,
        sortOrder: 0,
      });
    }
  }
  console.log(`  ✓ ${totalProducts} productos creados con imágenes y precios de oferta\n`);

  // Create reviews (2-4 per store)
  console.log("⭐ Creando reseñas...");
  let totalReviews = 0;
  const allUsers = [...existingUsers, ...insertedUsers.map(u => ({ id: u.id, name: u.name }))];

  for (const store of allInsertedStores) {
    const numReviews = 2 + Math.floor(Math.random() * 3);
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
  console.log(`  ✓ ${totalReviews} reseñas creadas\n`);

  // Summary
  console.log("✅ Seed completado:");
  console.log(`   👥 ${insertedUsers.length} nuevos vendedores`);
  console.log(`   🏪 ${totalStores} tiendas en 14 distritos`);
  console.log(`   📦 ${totalProducts} productos (10 por tienda)`);
  console.log(`   ⭐ ${totalReviews} reseñas`);
  console.log("\n🔑 Contraseña vendedores: User2024!");
  process.exit(0);
}

main().catch(e => { console.error("❌ Error:", e); process.exit(1); });
