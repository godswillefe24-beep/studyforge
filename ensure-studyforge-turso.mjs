import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
await db.execute(`CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL DEFAULT 'streak',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  readAt INTEGER,
  createdAt INTEGER NOT NULL
)`);
console.log("Bootstrapped streak notifications.");
