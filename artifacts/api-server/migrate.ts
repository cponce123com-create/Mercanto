import { db } from "../../lib/db/src/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_type text NOT NULL DEFAULT 'local'`);
    console.log("store_type added to stores");
  } catch(e: any) { console.log("store_type:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_number text`);
    console.log("dni_number added");
  } catch(e: any) { console.log("dni_number:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_front_url text`);
    console.log("dni_front_url added");
  } catch(e: any) { console.log("dni_front_url:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_front_public_id text`);
    console.log("dni_front_public_id added");
  } catch(e: any) { console.log("dni_front_public_id:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_back_url text`);
    console.log("dni_back_url added");
  } catch(e: any) { console.log("dni_back_url:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_back_public_id text`);
    console.log("dni_back_public_id added");
  } catch(e: any) { console.log("dni_back_public_id:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false`);
    console.log("identity_verified added");
  } catch(e: any) { console.log("identity_verified:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_rejected_reason text`);
    console.log("identity_rejected_reason added");
  } catch(e: any) { console.log("identity_rejected_reason:", e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE users ADD CONSTRAINT users_dni_number_unique UNIQUE (dni_number)`);
    console.log("Unique constraint added");
  } catch(e: any) { console.log("unique constraint:", e.message); }
  
  // Verify
  const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'store_type'`);
  console.log("store_type exists:", result.rows.length > 0);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
