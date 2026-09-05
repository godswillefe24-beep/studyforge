import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("passwordHash"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({ emailIdx: uniqueIndex("users_email_idx").on(table.email) }));

export const exams = sqliteTable("exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier", { enum: ["free", "premium"] }).notNull().default("free"),
});

export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examId: integer("examId").notNull().references(() => exams.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (table) => ({ subjectSlugIdx: uniqueIndex("subjects_exam_slug_idx").on(table.examId, table.slug) }));

export const topics = sqliteTable("topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subjectId: integer("subjectId").notNull().references(() => subjects.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (table) => ({ topicSlugIdx: uniqueIndex("topics_subject_slug_idx").on(table.subjectId, table.slug) }));

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topicId: integer("topicId").notNull().references(() => topics.id),
  prompt: text("prompt").notNull(),
  optionsJson: text("optionsJson").notNull(),
  answerIndex: integer("answerIndex").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty").notNull().default("medium"),
});

export const practiceSessions = sqliteTable("practiceSessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  mode: text("mode").notNull().default("practice"),
  examId: integer("examId").references(() => exams.id),
  topicId: integer("topicId").references(() => topics.id),
  startedAt: integer("startedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  completedAt: integer("completedAt", { mode: "timestamp_ms" }),
  score: integer("score"),
  total: integer("total"),
});

export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("sessionId").notNull().references(() => practiceSessions.id),
  questionId: integer("questionId").notNull().references(() => questions.id),
  userId: integer("userId").notNull().references(() => users.id),
  selectedIndex: integer("selectedIndex").notNull(),
  isCorrect: integer("isCorrect").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  provider: text("provider").notNull().default("palmpay"),
  reference: text("reference"),
  status: text("status", { enum: ["free", "pending", "active", "past_due", "cancelled"] }).notNull().default("free"),
  planCode: text("planCode").notNull().default("studyforge_plus_monthly"),
  amountKobo: integer("amountKobo").notNull().default(0),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({ userSubscriptionIdx: uniqueIndex("subscriptions_user_idx").on(table.userId) }));

export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type Exam = InferSelectModel<typeof exams>;
export type Subject = InferSelectModel<typeof subjects>;
export type Topic = InferSelectModel<typeof topics>;
export type Question = InferSelectModel<typeof questions>;
export type PracticeSession = InferSelectModel<typeof practiceSessions>;
export type Attempt = InferSelectModel<typeof attempts>;
export type Subscription = InferSelectModel<typeof subscriptions>;


export const questionOptions = sqliteTable("questionOptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("questionId").notNull().references(() => questions.id),
  optionIndex: integer("optionIndex").notNull(),
  text: text("text").notNull(),
}, (table) => ({ questionOptionIdx: uniqueIndex("question_options_question_idx").on(table.questionId, table.optionIndex) }));

export type QuestionOption = InferSelectModel<typeof questionOptions>;
export type InsertQuestionOption = InferInsertModel<typeof questionOptions>;


export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  kind: text("kind").notNull().default("streak"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: integer("readAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export type Notification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;
