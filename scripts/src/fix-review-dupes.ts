import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

console.log("Checking for duplicate reviews...");

const dupes = await db.execute(sql`
  SELECT store_id, user_id, COUNT(*) as cnt, array_agg(id ORDER BY id) as ids
  FROM reviews
  GROUP BY store_id, user_id
  HAVING COUNT(*) > 1
`);

console.log("Duplicates found:", dupes.rows.length);

if (dupes.rows.length > 0) {
  console.log("Duplicate data:", JSON.stringify(dupes.rows));
  const deleted = await db.execute(sql`
    DELETE FROM reviews
    WHERE id NOT IN (
      SELECT MAX(id) FROM reviews GROUP BY store_id, user_id
    )
  `);
  console.log("Deleted duplicate reviews:", deleted.rowCount);
} else {
  console.log("No duplicates found.");
}

process.exit(0);
