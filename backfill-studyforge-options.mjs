import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const result = await db.execute("SELECT id, optionsJson FROM questions");
let inserted = 0;
for (const row of result.rows) {
  const options = JSON.parse(String(row.optionsJson ?? "[]"));
  for (let index = 0; index < options.length; index++) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO questionOptions (questionId, optionIndex, text) VALUES (?, ?, ?)",
      args: [Number(row.id), index, String(options[index])],
    });
    inserted++;
  }
}
console.log(`Backfilled ${inserted} normalized question options.`);
