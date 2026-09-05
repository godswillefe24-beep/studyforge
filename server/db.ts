import { createClient, type Client, type InStatement } from "@libsql/client";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Attempt, Exam, InsertUser, PracticeSession, Question, Subscription, User } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: Client | null = null;

export async function getDb(): Promise<Client | null> {
  if (_db) return _db;
  if (!ENV.tursoDatabaseUrl || !ENV.tursoAuthToken) {
    console.warn("[Database] Turso environment is not configured");
    return null;
  }
  _db = createClient({ url: ENV.tursoDatabaseUrl, authToken: ENV.tursoAuthToken });
  return _db;
}

async function execute(statement: InStatement) {
  const db = await getDb();
  if (!db) throw new Error("Turso database is not configured");
  return db.execute(statement);
}

const dateFrom = (value: unknown) => new Date(Number(value ?? Date.now()));
const numberFrom = (value: unknown) => Number(value ?? 0);

function mapUser(row: Record<string, unknown>): User {
  return {
    id: numberFrom(row.id),
    openId: String(row.openId),
    name: row.name == null ? null : String(row.name),
    email: row.email == null ? null : String(row.email),
    passwordHash: row.passwordHash == null ? null : String(row.passwordHash),
    loginMethod: row.loginMethod == null ? null : String(row.loginMethod),
    role: row.role === "admin" ? "admin" : "user",
    createdAt: dateFrom(row.createdAt),
    updatedAt: dateFrom(row.updatedAt),
    lastSignedIn: dateFrom(row.lastSignedIn),
  };
}

function mapQuestion(row: Record<string, unknown>): Question & { options: string[]; topic: string; subject: string } {
  let options: string[] = [];
  try { options = JSON.parse(String(row.optionsJson)); } catch { options = []; }
  return { id: numberFrom(row.id), topicId: numberFrom(row.topicId), prompt: String(row.prompt), optionsJson: String(row.optionsJson), answerIndex: numberFrom(row.answerIndex), explanation: row.explanation == null ? null : String(row.explanation), difficulty: String(row.difficulty), options, topic: String(row.topicName ?? ""), subject: String(row.subjectName ?? "") };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const now = Date.now();
  await execute({
    sql: `INSERT INTO users (openId, name, email, passwordHash, loginMethod, role, createdAt, updatedAt, lastSignedIn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(openId) DO UPDATE SET
        name = COALESCE(excluded.name, users.name),
        email = COALESCE(excluded.email, users.email),
        passwordHash = COALESCE(excluded.passwordHash, users.passwordHash),
        loginMethod = COALESCE(excluded.loginMethod, users.loginMethod),
        role = COALESCE(excluded.role, users.role),
        updatedAt = excluded.updatedAt,
        lastSignedIn = excluded.lastSignedIn`,
    args: [user.openId, user.name ?? null, user.email ?? null, user.passwordHash ?? null, user.loginMethod ?? null, user.role ?? "user", user.createdAt?.getTime?.() ?? now, user.updatedAt?.getTime?.() ?? now, user.lastSignedIn?.getTime?.() ?? now],
  });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const result = await execute({ sql: "SELECT * FROM users WHERE openId = ? LIMIT 1", args: [openId] });
  return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await execute({ sql: "SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1", args: [email.trim()] });
  return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : undefined;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, digest] = storedHash.split(":");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function getOrCreateDemoUser(email: string, name = "StudyForge learner", password?: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    if (password && existing.passwordHash && !verifyPassword(password, existing.passwordHash)) throw new Error("Incorrect email or password");
    if (password && !existing.passwordHash) await upsertUser({ openId: existing.openId, passwordHash: hashPassword(password), lastSignedIn: new Date() });
    return (await getUserByOpenId(existing.openId)) ?? existing;
  }
  const openId = `studyforge_${normalizedEmail.replace(/[^a-z0-9]+/g, "_")}`;
  await upsertUser({ openId, name, email: normalizedEmail, passwordHash: password ? hashPassword(password) : null, loginMethod: "demo" });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Failed to create StudyForge user");
  return user;
}

export async function listExams(): Promise<Exam[]> {
  const result = await execute({ sql: "SELECT id, code, name, description, tier FROM exams ORDER BY id", args: [] });
  return result.rows.map((row) => ({ id: numberFrom(row.id), code: String(row.code), name: String(row.name), description: row.description == null ? null : String(row.description), tier: row.tier === "premium" ? "premium" : "free" }));
}

export async function listSubjects(examCode = "WAEC") {
  const result = await execute({ sql: "SELECT subjects.id, subjects.name, subjects.slug, exams.code AS examCode FROM subjects JOIN exams ON exams.id = subjects.examId WHERE exams.code = ? ORDER BY subjects.name", args: [examCode] });
  return result.rows.map((row) => ({ id: numberFrom(row.id), name: String(row.name), slug: String(row.slug), examCode: String(row.examCode) }));
}

export async function listContent(): Promise<Array<{ examCode: string; examName: string; tier: "free" | "premium"; subjectId: number | null; subjectName: string; subjectSlug: string; topicName: string; topicSlug: string; topicId: number | null; questionId: number | null; prompt: string | null; optionsJson: string | null; answerIndex: number | null; explanation: string | null; difficulty: string | null }>> {
  const result = await execute({ sql: `SELECT exams.code AS examCode, exams.name AS examName, exams.tier, subjects.id AS subjectId, subjects.name AS subjectName, subjects.slug AS subjectSlug, topics.name AS topicName, topics.slug AS topicSlug, topics.id AS topicId, questions.id AS questionId, questions.prompt, questions.optionsJson, questions.answerIndex, questions.explanation, questions.difficulty FROM exams LEFT JOIN subjects ON subjects.examId = exams.id LEFT JOIN topics ON topics.subjectId = subjects.id LEFT JOIN questions ON questions.topicId = topics.id ORDER BY exams.name, subjects.name, topics.name, questions.id`, args: [] });
  return result.rows.map((raw) => { const row = raw as Record<string, unknown>; return { examCode: String(row.examCode ?? ""), examName: String(row.examName ?? ""), tier: row.tier === "premium" ? "premium" : "free", subjectId: row.subjectId == null ? null : numberFrom(row.subjectId), subjectName: String(row.subjectName ?? ""), subjectSlug: String(row.subjectSlug ?? ""), topicName: String(row.topicName ?? ""), topicSlug: String(row.topicSlug ?? ""), topicId: row.topicId == null ? null : numberFrom(row.topicId), questionId: row.questionId == null ? null : numberFrom(row.questionId), prompt: row.prompt == null ? null : String(row.prompt), optionsJson: row.optionsJson == null ? null : String(row.optionsJson), answerIndex: row.answerIndex == null ? null : numberFrom(row.answerIndex), explanation: row.explanation == null ? null : String(row.explanation), difficulty: row.difficulty == null ? null : String(row.difficulty) }; });
}

export async function listQuestions(input?: { topicId?: number; examId?: number; examCode?: string; subjectId?: number; subjectName?: string; difficulty?: string; limit?: number }) {
  const limit = Math.min(Math.max(input?.limit ?? 20, 1), 100);
  const clauses: string[] = [];
  const args: Array<string | number> = [];
  if (input?.examId) { clauses.push("exams.id = ?"); args.push(input.examId); }
  else if (input?.examCode) { clauses.push("exams.code = ?"); args.push(input.examCode); }
  if (input?.subjectId) { clauses.push("subjects.id = ?"); args.push(input.subjectId); }
  if (input?.subjectName) { clauses.push("lower(subjects.name) = lower(?)"); args.push(input.subjectName); }
  if (input?.topicId) { clauses.push("questions.topicId = ?"); args.push(input.topicId); }
  if (input?.difficulty) { clauses.push("lower(questions.difficulty) = lower(?)"); args.push(input.difficulty); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await execute({ sql: `SELECT questions.*, topics.name AS topicName, subjects.name AS subjectName FROM questions JOIN topics ON topics.id = questions.topicId JOIN subjects ON subjects.id = topics.subjectId JOIN exams ON exams.id = subjects.examId ${where} ORDER BY questions.id LIMIT ?`, args: [...args, limit] });
  return result.rows.map((row) => mapQuestion(row as Record<string, unknown>));
}

export async function createSession(userId: number, mode: string, topicId: number | null = null, examId: number | null = null): Promise<number> {
  const result = await execute({ sql: "INSERT INTO practiceSessions (userId, mode, examId, topicId, startedAt) VALUES (?, ?, ?, ?, ?)", args: [userId, mode, examId, topicId, Date.now()] });
  return Number(result.lastInsertRowid);
}

export async function saveAttempt(input: { sessionId: number; questionId: number; userId: number; selectedIndex: number; isCorrect: boolean }) {
  await execute({ sql: "INSERT INTO attempts (sessionId, questionId, userId, selectedIndex, isCorrect, createdAt) VALUES (?, ?, ?, ?, ?, ?)", args: [input.sessionId, input.questionId, input.userId, input.selectedIndex, input.isCorrect ? 1 : 0, Date.now()] });
}

export async function getSession(sessionId: number, userId: number) {
  const result = await execute({ sql: "SELECT * FROM practiceSessions WHERE id = ? AND userId = ? LIMIT 1", args: [sessionId, userId] });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? { id: numberFrom(row.id), userId: numberFrom(row.userId), mode: String(row.mode), examId: row.examId == null ? null : numberFrom(row.examId), topicId: row.topicId == null ? null : numberFrom(row.topicId) } : undefined;
}

export async function completeSession(sessionId: number, userId: number, score: number, total: number): Promise<PracticeSession | undefined> {
  await execute({ sql: "UPDATE practiceSessions SET completedAt = ?, score = ?, total = ? WHERE id = ? AND userId = ?", args: [Date.now(), score, total, sessionId, userId] });
  const result = await execute({ sql: "SELECT * FROM practiceSessions WHERE id = ? AND userId = ? LIMIT 1", args: [sessionId, userId] });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? { id: numberFrom(row.id), userId: numberFrom(row.userId), mode: String(row.mode), examId: row.examId == null ? null : numberFrom(row.examId), topicId: row.topicId == null ? null : numberFrom(row.topicId), startedAt: dateFrom(row.startedAt), completedAt: row.completedAt == null ? null : dateFrom(row.completedAt), score: row.score == null ? null : numberFrom(row.score), total: row.total == null ? null : numberFrom(row.total) } : undefined;
}

export async function getProgress(userId: number) {
  const result = await execute({ sql: `SELECT date(createdAt / 1000, 'unixepoch') AS day, COUNT(*) AS questions, ROUND(AVG(isCorrect) * 100) AS score FROM attempts WHERE userId = ? GROUP BY day ORDER BY day DESC LIMIT 14`, args: [userId] });
  return result.rows.reverse().map((row) => ({ day: String(row.day), questions: numberFrom(row.questions), score: numberFrom(row.score) }));
}

export async function get30DayHistory(userId: number) {
  const start = Date.now() - 29 * 86400000;
  const result = await execute({ sql: `SELECT date(createdAt / 1000, 'unixepoch') AS day, COUNT(*) AS questions, ROUND(AVG(isCorrect) * 100) AS score FROM attempts WHERE userId = ? AND createdAt >= ? GROUP BY day`, args: [userId, start] });
  const byDay = new Map(result.rows.map((row) => [String(row.day), { questions: numberFrom(row.questions), score: numberFrom(row.score) }]));
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.now() - (29 - index) * 86400000);
    const day = date.toISOString().slice(0, 10);
    const value = byDay.get(day) ?? { questions: 0, score: 0 };
    return { day, label: date.toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" }), questions: value.questions, score: value.score, active: value.questions > 0 };
  });
}

export async function getSubscription(userId: number): Promise<Subscription | undefined> {
  const result = await execute({ sql: "SELECT * FROM subscriptions WHERE userId = ? LIMIT 1", args: [userId] });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? { id: numberFrom(row.id), userId: numberFrom(row.userId), provider: String(row.provider), reference: row.reference == null ? null : String(row.reference), status: ["pending", "active", "past_due", "cancelled"].includes(String(row.status)) ? String(row.status) as Subscription["status"] : "free", planCode: String(row.planCode), amountKobo: numberFrom(row.amountKobo), currentPeriodEnd: row.currentPeriodEnd == null ? null : dateFrom(row.currentPeriodEnd), createdAt: dateFrom(row.createdAt), updatedAt: dateFrom(row.updatedAt) } : undefined;
}

export async function upsertSubscription(input: { userId: number; reference: string; status: Subscription["status"]; planCode: string; amountKobo: number; currentPeriodEnd: Date | null; provider?: string }) {
  const now = Date.now();
  await execute({ sql: `INSERT INTO subscriptions (userId, provider, reference, status, planCode, amountKobo, currentPeriodEnd, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET provider = excluded.provider, reference = excluded.reference, status = excluded.status, planCode = excluded.planCode, amountKobo = excluded.amountKobo, currentPeriodEnd = excluded.currentPeriodEnd, updatedAt = excluded.updatedAt`, args: [input.userId, input.provider ?? "palmpay", input.reference, input.status, input.planCode, input.amountKobo, input.currentPeriodEnd?.getTime() ?? null, now, now] });
}

export async function listPendingSubscriptions() {
  const result = await execute({ sql: `SELECT subscriptions.*, users.name AS userName, users.email AS userEmail FROM subscriptions JOIN users ON users.id = subscriptions.userId WHERE subscriptions.status = 'pending' ORDER BY subscriptions.createdAt ASC`, args: [] });
  return result.rows.map(row => ({
    id: numberFrom(row.id),
    userId: numberFrom(row.userId),
    provider: String(row.provider),
    reference: row.reference == null ? null : String(row.reference),
    status: "pending" as const,
    planCode: String(row.planCode),
    amountKobo: numberFrom(row.amountKobo),
    currentPeriodEnd: row.currentPeriodEnd == null ? null : dateFrom(row.currentPeriodEnd),
    userName: row.userName == null ? null : String(row.userName),
    userEmail: row.userEmail == null ? null : String(row.userEmail),
    createdAt: dateFrom(row.createdAt),
  }));
}

export async function insertContent(input: { exam: { code: string; name: string; description?: string; tier?: "free" | "premium" }; subject: { name: string; slug: string }; topic: { name: string; slug: string }; question: { prompt: string; options: string[]; answerIndex: number; explanation?: string; difficulty?: string } }) {
  const now = Date.now();
  await execute({ sql: "INSERT INTO exams (code, name, description, tier) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO UPDATE SET name = excluded.name, description = excluded.description, tier = excluded.tier", args: [input.exam.code, input.exam.name, input.exam.description ?? null, input.exam.tier ?? "free"] });
  const exam = await execute({ sql: "SELECT id FROM exams WHERE code = ? LIMIT 1", args: [input.exam.code] });
  const examId = numberFrom(exam.rows[0]?.id);
  await execute({ sql: "INSERT INTO subjects (examId, name, slug) VALUES (?, ?, ?) ON CONFLICT(examId, slug) DO UPDATE SET name = excluded.name", args: [examId, input.subject.name, input.subject.slug] });
  const subject = await execute({ sql: "SELECT id FROM subjects WHERE examId = ? AND slug = ? LIMIT 1", args: [examId, input.subject.slug] });
  const subjectId = numberFrom(subject.rows[0]?.id);
  await execute({ sql: "INSERT INTO topics (subjectId, name, slug) VALUES (?, ?, ?) ON CONFLICT(subjectId, slug) DO UPDATE SET name = excluded.name", args: [subjectId, input.topic.name, input.topic.slug] });
  const topic = await execute({ sql: "SELECT id FROM topics WHERE subjectId = ? AND slug = ? LIMIT 1", args: [subjectId, input.topic.slug] });
  const topicId = numberFrom(topic.rows[0]?.id);
  const question = await execute({ sql: "INSERT INTO questions (topicId, prompt, optionsJson, answerIndex, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?)", args: [topicId, input.question.prompt, JSON.stringify(input.question.options), input.question.answerIndex, input.question.explanation ?? null, input.question.difficulty ?? "medium"] });
  const questionId = Number(question.lastInsertRowid);
  for (let optionIndex = 0; optionIndex < input.question.options.length; optionIndex++) {
    await execute({ sql: "INSERT OR IGNORE INTO questionOptions (questionId, optionIndex, text) VALUES (?, ?, ?)", args: [questionId, optionIndex, input.question.options[optionIndex]!] });
  }
  return { examId, subjectId, topicId, questionId, importedAt: now };
}


export async function getQuestionById(id: number) {
  const result = await execute({ sql: `SELECT questions.*, topics.name AS topicName, subjects.name AS subjectName FROM questions JOIN topics ON topics.id = questions.topicId JOIN subjects ON subjects.id = topics.subjectId WHERE questions.id = ? LIMIT 1`, args: [id] });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapQuestion(row) : undefined;
}

export async function getExamByCode(code: string): Promise<Exam | undefined> {
  const result = await execute({ sql: "SELECT id, code, name, description, tier FROM exams WHERE code = ? LIMIT 1", args: [code] });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? { id: numberFrom(row.id), code: String(row.code), name: String(row.name), description: row.description == null ? null : String(row.description), tier: row.tier === "premium" ? "premium" : "free" } : undefined;
}


export async function questionExists(input: { examCode: string; subjectSlug: string; topicSlug: string; prompt: string }) {
  const result = await execute({ sql: `SELECT questions.id FROM questions JOIN topics ON topics.id = questions.topicId JOIN subjects ON subjects.id = topics.subjectId JOIN exams ON exams.id = subjects.examId WHERE exams.code = ? AND subjects.slug = ? AND topics.slug = ? AND lower(trim(questions.prompt)) = lower(trim(?)) LIMIT 1`, args: [input.examCode, input.subjectSlug, input.topicSlug, input.prompt] });
  return Boolean(result.rows[0]);
}


export async function getUserById(id: number): Promise<User | undefined> {
  const result = await execute({ sql: "SELECT * FROM users WHERE id = ? LIMIT 1", args: [id] });
  return result.rows[0] ? mapUser(result.rows[0] as Record<string, unknown>) : undefined;
}

export async function updateUserProfile(id: number, input: { name?: string; email?: string }) {
  const fields: string[] = [];
  const args: Array<string | number> = [];
  if (input.name !== undefined) { fields.push("name = ?"); args.push(input.name.trim()); }
  if (input.email !== undefined) { fields.push("email = ?"); args.push(input.email.trim().toLowerCase()); }
  if (fields.length) { fields.push("updatedAt = ?"); args.push(Date.now()); await execute({ sql: `UPDATE users SET ${fields.join(", ")} WHERE id = ?`, args: [...args, id] }); }
  return getUserById(id);
}

export async function updateQuestion(id: number, input: { prompt?: string; explanation?: string; answerIndex?: number; difficulty?: string; options?: string[] }) {
  const fields: string[] = []; const args: Array<string | number> = [];
  if (input.prompt !== undefined) { fields.push("prompt = ?"); args.push(input.prompt); }
  if (input.explanation !== undefined) { fields.push("explanation = ?"); args.push(input.explanation); }
  if (input.answerIndex !== undefined) { fields.push("answerIndex = ?"); args.push(input.answerIndex); }
  if (input.difficulty !== undefined) { fields.push("difficulty = ?"); args.push(input.difficulty); }
  if (input.options !== undefined) { fields.push("optionsJson = ?"); args.push(JSON.stringify(input.options)); await execute({ sql: "DELETE FROM questionOptions WHERE questionId = ?", args: [id] }); for (let optionIndex = 0; optionIndex < input.options.length; optionIndex++) await execute({ sql: "INSERT INTO questionOptions (questionId, optionIndex, text) VALUES (?, ?, ?)", args: [id, optionIndex, input.options[optionIndex]!] }); }
  if (fields.length) await execute({ sql: `UPDATE questions SET ${fields.join(", ")} WHERE id = ?`, args: [...args, id] });
  return getQuestionById(id);
}

export async function deleteQuestion(id: number) {
  await execute({ sql: "DELETE FROM attempts WHERE questionId = ?", args: [id] });
  await execute({ sql: "DELETE FROM questionOptions WHERE questionId = ?", args: [id] });
  await execute({ sql: "DELETE FROM questions WHERE id = ?", args: [id] });
  return { success: true as const };
}

export async function updateTopic(id: number, name: string) { await execute({ sql: "UPDATE topics SET name = ? WHERE id = ?", args: [name.trim(), id] }); return { success: true as const }; }
export async function deleteTopic(id: number) {
  const questions = await execute({ sql: "SELECT id FROM questions WHERE topicId = ?", args: [id] });
  for (const row of questions.rows) {
    const questionId = numberFrom(row.id);
    await execute({ sql: "DELETE FROM attempts WHERE questionId = ?", args: [questionId] });
    await execute({ sql: "DELETE FROM questionOptions WHERE questionId = ?", args: [questionId] });
  }
  await execute({ sql: "UPDATE practiceSessions SET topicId = NULL WHERE topicId = ?", args: [id] });
  await execute({ sql: "DELETE FROM questions WHERE topicId = ?", args: [id] });
  await execute({ sql: "DELETE FROM topics WHERE id = ?", args: [id] });
  return { success: true as const };
}
export async function updateSubject(id: number, name: string) { await execute({ sql: "UPDATE subjects SET name = ? WHERE id = ?", args: [name.trim(), id] }); return { success: true as const }; }
export async function deleteSubject(id: number) {
  const topics = await execute({ sql: "SELECT id FROM topics WHERE subjectId = ?", args: [id] });
  for (const row of topics.rows) await deleteTopic(numberFrom(row.id));
  await execute({ sql: "DELETE FROM subjects WHERE id = ?", args: [id] });
  return { success: true as const };
}


export async function listNotifications(userId: number, limit = 20) {
  const result = await execute({ sql: "SELECT id, kind, title, body, readAt, createdAt FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?", args: [userId, limit] });
  return result.rows.map((row) => ({ id: numberFrom(row.id), kind: String(row.kind), title: String(row.title), body: String(row.body), readAt: row.readAt == null ? null : dateFrom(row.readAt), createdAt: dateFrom(row.createdAt) }));
}

export async function markNotificationRead(userId: number, id: number) {
  await execute({ sql: "UPDATE notifications SET readAt = ? WHERE id = ? AND userId = ?", args: [Date.now(), id, userId] });
  return { success: true } as const;
}

export async function recordStreakNotification(userId: number) {
  const result = await execute({ sql: "SELECT DISTINCT date(createdAt / 1000, 'unixepoch') AS day FROM attempts WHERE userId = ? ORDER BY day DESC LIMIT 30", args: [userId] });
  const days = result.rows.map((row) => String(row.day));
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const day of days) {
    const expected = cursor.toISOString().slice(0, 10);
    const yesterday = new Date(cursor); yesterday.setDate(yesterday.getDate() - 1);
    if (day !== expected && day !== yesterday.toISOString().slice(0, 10)) break;
    streak += 1;
    cursor = new Date(`${day}T00:00:00Z`);
  }
  if (streak < 2) return streak;
  const recent = await execute({ sql: "SELECT id FROM notifications WHERE userId = ? AND kind = 'streak' AND createdAt > ? LIMIT 1", args: [userId, Date.now() - 86400000] });
  if (!recent.rows.length) await execute({ sql: "INSERT INTO notifications (userId, kind, title, body, createdAt) VALUES (?, 'streak', ?, ?, ?)", args: [userId, `${streak}-day study streak`, `You showed up ${streak} days in a row. Keep the chain gentle and consistent.`, Date.now()] });
  return streak;
}

export async function getAnalytics(userId: number) {
  const summary = await execute({ sql: `SELECT COUNT(*) AS attempts, ROUND(AVG(isCorrect) * 100) AS accuracy, COUNT(DISTINCT date(createdAt / 1000, 'unixepoch')) AS activeDays FROM attempts WHERE userId = ?`, args: [userId] });
  const subjects = await execute({ sql: `SELECT subjects.name AS subject, COUNT(attempts.id) AS attempts, ROUND(AVG(attempts.isCorrect) * 100) AS accuracy FROM attempts JOIN questions ON questions.id = attempts.questionId JOIN topics ON topics.id = questions.topicId JOIN subjects ON subjects.id = topics.subjectId WHERE attempts.userId = ? GROUP BY subjects.id, subjects.name ORDER BY attempts DESC LIMIT 8`, args: [userId] });
  const sessions = await execute({ sql: "SELECT COUNT(*) AS completed, ROUND(AVG(CASE WHEN completedAt IS NOT NULL THEN (completedAt - startedAt) / 60000.0 END), 1) AS avgMinutes FROM practiceSessions WHERE userId = ? AND completedAt IS NOT NULL", args: [userId] });
  return { attempts: numberFrom(summary.rows[0]?.attempts), accuracy: numberFrom(summary.rows[0]?.accuracy), activeDays: numberFrom(summary.rows[0]?.activeDays), completedSessions: numberFrom(sessions.rows[0]?.completed), averageMinutes: Number(sessions.rows[0]?.avgMinutes ?? 0), subjects: subjects.rows.map((row) => ({ subject: String(row.subject), attempts: numberFrom(row.attempts), accuracy: numberFrom(row.accuracy) })) };
}
