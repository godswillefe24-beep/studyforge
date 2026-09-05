import "dotenv/config";
import { createClient } from "@libsql/client";

const subjects = [
  "Mathematics",
  "English Language",
  "Agricultural Science",
  "Applied Electricity",
  "Auto Mechanics",
  "Biology",
  "Building Construction",
  "Chemistry",
  "Christian Religious Knowledge",
  "Civic Education",
  "Clothing and Textile",
  "Commerce",
  "Computer Science",
  "Economics",
  "Electronics",
  "Financial Accounting",
  "Foods and Nutrition",
  "French",
  "Further Mathematics",
  "Geography",
  "Government",
  "Health Science",
  "History",
  "Home Management",
  "Islamic Studies",
  "Literature in English",
  "Marketing",
  "Metalwork",
  "Music",
  "Physical Education",
  "Physics",
  "Shorthand",
  "Technical Drawing",
  "Typewriting",
  "Visual Arts",
  "Woodwork",
];
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
await db.execute({
  sql: "INSERT INTO exams (code, name, description, tier) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO NOTHING",
  args: [
    "WAEC",
    "West African Examinations Council",
    "WAEC practice questions and full exam simulations.",
    "free",
  ],
});
const exam = await db.execute({
  sql: "SELECT id FROM exams WHERE code = ? LIMIT 1",
  args: ["WAEC"],
});
const examId = Number(exam.rows[0].id);
for (const name of subjects) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  await db.execute({
    sql: "INSERT INTO subjects (examId, name, slug) VALUES (?, ?, ?) ON CONFLICT(examId, slug) DO UPDATE SET name = excluded.name",
    args: [examId, name, slug],
  });
}
console.log(`Ensured ${subjects.length} WAEC subjects.`);
