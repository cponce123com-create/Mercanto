/**
 * Asigna coordenadas realistas en San Ramón a todas las tiendas
 * Centro de San Ramón: lat -11.1297, lng -75.3500
 * Se distribuyen en un radio de ~1km
 */
import { db, storesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SAN_RAMON_CENTER = { lat: -11.1297, lng: -75.3500 };
const SPREAD = 0.012; // ~1.3km

// Puntos reales de San Ramón distribuidos por zonas
const LOCATIONS = [
  { lat: -11.1240, lng: -75.3485, zone: "Plaza de Armas" },
  { lat: -11.1255, lng: -75.3520, zone: "Mercado Central" },
  { lat: -11.1270, lng: -75.3455, zone: "Jr. Dos de Mayo" },
  { lat: -11.1282, lng: -75.3510, zone: "Av. Progreso" },
  { lat: -11.1295, lng: -75.3478, zone: "Jr. Lima" },
  { lat: -11.1310, lng: -75.3535, zone: "Jr. Junín" },
  { lat: -11.1322, lng: -75.3460, zone: "Av. Tarma" },
  { lat: -11.1248, lng: -75.3498, zone: "Jr. San Martín" },
  { lat: -11.1263, lng: -75.3468, zone: "Jr. Ucayali" },
  { lat: -11.1290, lng: -75.3525, zone: "Barrio Bellavista" },
  { lat: -11.1305, lng: -75.3492, zone: "Av. La Marina" },
  { lat: -11.1235, lng: -75.3512, zone: "Jr. Chanchamayo" },
  { lat: -11.1278, lng: -75.3445, zone: "Barrio Centro" },
  { lat: -11.1315, lng: -75.3508, zone: "Jr. Puno" },
  { lat: -11.1260, lng: -75.3540, zone: "Mercado Modelo" },
  { lat: -11.1288, lng: -75.3467, zone: "Jr. Huancayo" },
  { lat: -11.1242, lng: -75.3475, zone: "Plaza Municipal" },
  { lat: -11.1298, lng: -75.3552, zone: "Av. Circunvalación" },
  { lat: -11.1325, lng: -75.3473, zone: "Jr. Pichis" },
  { lat: -11.1268, lng: -75.3498, zone: "Jr. Ayacucho" },
  { lat: -11.1245, lng: -75.3530, zone: "Sector Norte" },
  { lat: -11.1285, lng: -75.3483, zone: "Jr. Palcazu" },
  { lat: -11.1312, lng: -75.3462, zone: "Av. Saposoa" },
  { lat: -11.1258, lng: -75.3515, zone: "Jr. La Merced" },
  { lat: -11.1302, lng: -75.3540, zone: "Barrio Sur" },
  { lat: -11.1272, lng: -75.3458, zone: "Jr. Jauja" },
  { lat: -11.1238, lng: -75.3492, zone: "Sector Este" },
  { lat: -11.1320, lng: -75.3525, zone: "Jr. Oxapampa" },
  { lat: -11.1265, lng: -75.3470, zone: "Jr. Satipo" },
  { lat: -11.1295, lng: -75.3505, zone: "Centro Comercial" },
];

async function main() {
  const stores = await db.select({ id: storesTable.id, name: storesTable.name })
    .from(storesTable)
    .orderBy(storesTable.id);

  console.log(`📍 Actualizando coordenadas para ${stores.length} tiendas en San Ramón...`);

  for (let i = 0; i < stores.length; i++) {
    const loc = LOCATIONS[i % LOCATIONS.length];
    // Add tiny random offset to avoid exact overlaps
    const jitter = 0.0004;
    const lat = (loc.lat + (Math.random() - 0.5) * jitter).toFixed(6);
    const lng = (loc.lng + (Math.random() - 0.5) * jitter).toFixed(6);

    await db.update(storesTable)
      .set({ lat, lng })
      .where(eq(storesTable.id, stores[i].id));

    console.log(`  ✓ ${stores[i].name} → ${lat}, ${lng} (${loc.zone})`);
  }

  console.log(`\n✅ Coordenadas actualizadas para ${stores.length} tiendas.`);
  process.exit(0);
}

main().catch(e => { console.error("❌ Error:", e); process.exit(1); });
