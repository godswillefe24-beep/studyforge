import { describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 30000 });
import { appRouter } from "./routers";
import { getUserByOpenId, listExams } from "./db";
import type { TrpcContext } from "./_core/context";

const baseContext = (role: "user" | "admin" = "user"): TrpcContext => ({
  user: { id: 999999, openId: "test-context-only", name: "Test Context", email: "test@example.com", passwordHash: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
});

describe("StudyForge feature contracts", () => {
  it("rejects invalid demo login input before touching the database", async () => {
    const caller = appRouter.createCaller({ ...baseContext(), user: null });
    await expect(caller.auth.demoLogin({ email: "not-an-email", password: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns the Nigeria-ready plan catalog without requiring a session", async () => {
    const caller = appRouter.createCaller({ ...baseContext(), user: null });
    const plans = await caller.billing.plans();
    expect(plans.map((plan) => plan.code)).toEqual(["studyforge_plus_monthly", "studyforge_plus_term"]);
    expect(plans.every((plan) => plan.amountKobo > 0)).toBe(true);
  });

  it("blocks admin catalog access for regular learners", async () => {
    const caller = appRouter.createCaller(baseContext("user"));
    await expect(caller.admin.catalog()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows the admin catalog contract for an admin context", async () => {
    const caller = appRouter.createCaller(baseContext("admin"));
    const result = await caller.admin.catalog();
    expect(Array.isArray(result)).toBe(true);
  });

  it("reads the Turso-backed catalog without fabricating a user record", async () => {
    const exams = await listExams();
    expect(exams.some((exam) => exam.code === "WAEC")).toBe(true);
    expect(await getUserByOpenId("studyforge_test_missing_user")).toBeUndefined();
  });
});


it("authenticates the configured Paystack secret against a read-only endpoint", async () => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  expect(secret, "PAYSTACK_SECRET_KEY must be configured").toBeTruthy();
  const response = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=1", { headers: { Authorization: `Bearer ${secret}` } });
  expect(response.status).toBe(200);
});


it("hashes and verifies preview account passwords without storing plaintext", async () => {
  const { hashPassword, verifyPassword } = await import("./db");
  const hash = hashPassword("studyforge-test-password");
  expect(hash).not.toContain("studyforge-test-password");
  expect(verifyPassword("studyforge-test-password", hash)).toBe(true);
  expect(verifyPassword("wrong-password", hash)).toBe(false);
});

it("persists a practice session, attempt, completion, and progress row in Turso", async () => {
  const { getOrCreateDemoUser, listQuestions, createSession, saveAttempt, completeSession, getProgress } = await import("./db");
  const user = await getOrCreateDemoUser(`integration-${Date.now()}@studyforge.local`, "Integration Learner", "studyforge-test-password");
  const question = (await listQuestions({ limit: 1 }))[0];
  expect(question).toBeTruthy();
  const sessionId = await createSession(user.id, "practice", null);
  await saveAttempt({ sessionId, questionId: question!.id, userId: user.id, selectedIndex: question!.answerIndex, isCorrect: true });
  const completed = await completeSession(sessionId, user.id, 100, 1);
  expect(completed?.completedAt).toBeTruthy();
  expect(completed?.score).toBe(100);
  expect((await getProgress(user.id)).at(-1)?.questions).toBeGreaterThanOrEqual(1);
}, 20000);

it("keeps premium exam access closed for a learner without an active subscription", async () => {
  const caller = appRouter.createCaller(baseContext("user"));
  await expect(caller.exams.access({ code: "WAEC_FULL" })).resolves.toMatchObject({ allowed: false, exam: { tier: "premium" } });
  await expect(caller.exams.access({ code: "WAEC" })).resolves.toMatchObject({ allowed: true, exam: { tier: "free" } });
});


it("retrieves the premium exam question set by WAEC_FULL code", async () => {
  const { listQuestions } = await import("./db");
  const questions = await listQuestions({ examCode: "WAEC_FULL", limit: 20 });
  expect(questions.length).toBeGreaterThan(0);
  expect(questions[0]?.topic).toBe("Timed rehearsal");
});

it("exposes subject, topic, and question identifiers for admin CRUD reachability", async () => {
  const { listContent } = await import("./db");
  const rows = await listContent();
  expect(rows.some((row) => row.subjectId)).toBe(true);
  expect(rows.some((row) => row.topicId)).toBe(true);
  expect(rows.some((row) => row.questionId)).toBe(true);
});


it("persists a WAEC_FULL exam session through submit and completion", async () => {
  const { getOrCreateDemoUser, listQuestions, upsertSubscription } = await import("./db");
  const user = await getOrCreateDemoUser(`exam-${Date.now()}@studyforge.local`, "Exam Integration Learner", "studyforge-test-password");
  await upsertSubscription({ userId: user.id, reference: `test-${Date.now()}`, status: "active", planCode: "studyforge_plus_monthly", amountKobo: 500000, currentPeriodEnd: new Date(Date.now() + 86400000) });
  const caller = appRouter.createCaller({ ...baseContext(), user });
  const examQuestions = await listQuestions({ examCode: "WAEC_FULL", limit: 20 });
  expect(examQuestions.length).toBeGreaterThan(0);
  const sessionId = await caller.practice.start({ mode: "exam", examCode: "WAEC_FULL", topicId: null });
  const submitted = await caller.practice.submit({ sessionId, questionId: examQuestions[0]!.id, selectedIndex: examQuestions[0]!.answerIndex });
  expect(submitted.isCorrect).toBe(true);
  const completed = await caller.practice.complete({ sessionId, score: 100, total: examQuestions.length });
  expect(completed.session?.mode).toBe("exam");
  expect(completed.session?.examId).toBeTruthy();
  expect(completed.session?.completedAt).toBeTruthy();
}, 20000);


it("exercises admin subject, topic, and question update reachability", async () => {
  const { listContent } = await import("./db");
  const row = (await listContent()).find((item) => item.subjectId && item.topicId && item.questionId);
  expect(row).toBeTruthy();
  const caller = appRouter.createCaller(baseContext("admin"));
  await caller.admin.updateSubject({ id: row!.subjectId!, name: `${row!.subjectName} ` });
  await caller.admin.updateTopic({ id: row!.topicId!, name: `${row!.topicName} ` });
  await caller.admin.updateQuestion({ id: row!.questionId!, prompt: row!.prompt! });
  const refreshed = (await listContent()).find((item) => item.questionId === row!.questionId);
  expect(refreshed?.subjectName).toBe(row!.subjectName);
  expect(refreshed?.topicName).toBe(row!.topicName);
  expect(refreshed?.prompt).toBe(row!.prompt);
});


it("exercises admin create and delete procedures with an isolated WAEC fixture", async () => {
  const { listContent } = await import("./db");
  const caller = appRouter.createCaller(baseContext("admin"));
  const suffix = Date.now().toString();
  const subjectSlug = `crud-${suffix}`;
  const topicSlug = `crud-topic-${suffix}`;
  const prompt = `Integration CRUD question ${suffix}: choose the correct option.`;
  const imported = await caller.admin.importQuestions({ rows: [{ examCode: "WAEC", examName: "West African Examinations Council", examTier: "free", subjectName: `CRUD Subject ${suffix}`, subjectSlug, topicName: `CRUD Topic ${suffix}`, topicSlug, prompt, options: ["A", "B"], answerIndex: 0, explanation: "Fixture", difficulty: "easy" }] });
  expect(imported.imported).toBe(1);
  const row = (await listContent()).find((item) => item.subjectSlug === subjectSlug && item.topicSlug === topicSlug && item.prompt === prompt);
  expect(row?.subjectId && row.topicId && row.questionId).toBeTruthy();
  await caller.admin.deleteQuestion({ id: row!.questionId! });
  await caller.admin.deleteTopic({ id: row!.topicId! });
  await caller.admin.deleteSubject({ id: row!.subjectId! });
  expect((await listContent()).some((item) => item.subjectSlug === subjectSlug)).toBe(false);
}, 30000);


it("exposes analytics, notifications, billing mode, bulk editing, and the subject catalogue", async () => {
  const { listContent } = await import("./db");
  const learner = appRouter.createCaller(baseContext("user"));
  const admin = appRouter.createCaller(baseContext("admin"));
  const analytics = await learner.progress.analytics();
  const notifications = await learner.notifications.list();
  const mode = await learner.billing.mode();
  expect(analytics).toHaveProperty("accuracy");
  expect(Array.isArray(notifications)).toBe(true);
  expect(["test", "live", "unknown"]).toContain(mode.environment);
  const rows = await listContent();
  const expectedSubjects = ["Mathematics", "English Language", "Agricultural Science", "Applied Electricity", "Auto Mechanics", "Biology", "Building Construction", "Chemistry", "Christian Religious Knowledge", "Civic Education", "Clothing and Textile", "Commerce", "Computer Science", "Economics", "Electronics", "Financial Accounting", "Foods and Nutrition", "French", "Further Mathematics", "Geography", "Government", "Health Science", "History", "Home Management", "Islamic Studies", "Literature in English", "Marketing", "Metalwork", "Music", "Physical Education", "Physics", "Shorthand", "Technical Drawing", "Typewriting", "Visual Arts", "Woodwork"];
  const subjectNames = new Set(rows.map((row) => row.subjectName));
  expect(expectedSubjects).toHaveLength(36);
  expect(expectedSubjects.every((subject) => subjectNames.has(subject))).toBe(true);
  const firstSubject = rows.find((row) => row.subjectId);
  expect(firstSubject?.subjectId).toBeTruthy();
  const bulk = await admin.admin.bulkUpdate({ rows: [{ kind: "subject", id: firstSubject!.subjectId!, value: firstSubject!.subjectName }] });
  expect(bulk.updated).toBe(1);
});


it("returns the full WAEC catalogue and filters questions by subject and difficulty", async () => {
  const { listSubjects, listQuestions } = await import("./db");
  const subjects = await listSubjects("WAEC");
  const expected = ["Mathematics", "English Language", "Agricultural Science", "Applied Electricity", "Auto Mechanics", "Biology", "Building Construction", "Chemistry", "Christian Religious Knowledge", "Civic Education", "Clothing and Textile", "Commerce", "Computer Science", "Economics", "Electronics", "Financial Accounting", "Foods and Nutrition", "French", "Further Mathematics", "Geography", "Government", "Health Science", "History", "Home Management", "Islamic Studies", "Literature in English", "Marketing", "Metalwork", "Music", "Physical Education", "Physics", "Shorthand", "Technical Drawing", "Typewriting", "Visual Arts", "Woodwork"];
  expect(subjects).toHaveLength(36);
  expect(new Set(subjects.map((subject) => subject.name))).toEqual(new Set(expected));
  const chemistry = subjects.find((subject) => subject.name === "Chemistry");
  expect(chemistry).toBeTruthy();
  const hardQuestions = await listQuestions({ subjectId: chemistry!.id, difficulty: "hard", limit: 20 });
  expect(hardQuestions.length).toBeGreaterThan(0);
  expect(hardQuestions.every((question) => question.subject === "Chemistry" && question.difficulty === "hard")).toBe(true);
});

it("returns a 30-day zero-filled history for a first-time account", async () => {
  const { getOrCreateDemoUser, get30DayHistory, getAnalytics } = await import("./db");
  const user = await getOrCreateDemoUser(`zero-state-${Date.now()}@studyforge.local`, "StudyForge learner", "studyforge-test-password");
  const [history, analytics] = await Promise.all([get30DayHistory(user.id), getAnalytics(user.id)]);
  expect(history).toHaveLength(30);
  expect(history[0]).toHaveProperty("day");
  expect(history.every((point) => point.questions === 0 && point.score === 0 && point.active === false)).toBe(true);
  expect(analytics).toMatchObject({ attempts: 0, accuracy: 0, activeDays: 0, completedSessions: 0 });
});

it("keeps startup auth anonymous until a session exists", async () => {
  const caller = appRouter.createCaller({ ...baseContext(), user: null });
  await expect(caller.auth.me()).resolves.toBeNull();
});


it("supports selecting every WAEC subject with subject-scoped question retrieval", async () => {
  const { listSubjects, listQuestions } = await import("./db");
  const subjects = await listSubjects("WAEC");
  const results = await Promise.all(subjects.map(async (subject) => ({ subject, questions: await listQuestions({ subjectId: subject.id, limit: 5 }) })));
  expect(results).toHaveLength(36);
  expect(results.every(({ subject, questions }) => questions.length > 0 && questions.every((question) => question.subject === subject.name))).toBe(true);
});
