import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const migration = await readFile(
  new URL("./drizzle/migrations/0002_condemned_avengers.sql", import.meta.url),
  "utf8"
);
const columns = await db.execute("PRAGMA table_info(practiceSessions)");
if (columns.rows.some(row => String(row.name) === "examId")) {
  console.log(
    "Migration 0002 already applied: practiceSessions.examId exists."
  );
} else {
  await db.execute(
    migration.replace(
      "ALTER TABLE `practiceSessions` ADD `examId`",
      "ALTER TABLE practiceSessions ADD COLUMN examId"
    )
  );
  console.log("Applied generated migration 0002 to Turso.");
}
