import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function fixAdmin() {
  const [updated] = await db
    .update(usersTable)
    .set({ role: "admin" })
    .where(eq(usersTable.email, "admin@mercanto.pe"))
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

  if (updated) {
    console.log("✅ Admin role restored:", updated);
  } else {
    console.log("⚠️  No user found with email admin@mercanto.pe");
  }
  process.exit(0);
}

fixAdmin().catch(e => { console.error(e); process.exit(1); });
