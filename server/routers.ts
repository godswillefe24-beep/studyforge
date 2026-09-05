import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const plans = [
  { code: "studyforge_plus_monthly", name: "StudyForge Plus", amountKobo: 500000, price: "₦5,000", cadence: "per month", description: "Unlock full WAEC simulations, saved questions, and deeper progress history." },
  { code: "studyforge_plus_term", name: "StudyForge Term", amountKobo: 1200000, price: "₦12,000", cadence: "per 3 months", description: "A calmer term plan for consistent preparation with a lower effective monthly cost." },
] as const;

const sessionCookie = (ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: { cookie: (name: string, value: string, options: Record<string, unknown>) => void } }, token: string) => {
  ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
};

const importRowSchema = z.object({
  examCode: z.string().min(2).max(40),
  examName: z.string().min(2).max(120),
  examDescription: z.string().max(500).optional(),
  examTier: z.enum(["free", "premium"]).default("free"),
  subjectName: z.string().min(2).max(120),
  subjectSlug: z.string().min(2).max(80),
  topicName: z.string().min(2).max(120),
  topicSlug: z.string().min(2).max(80),
  prompt: z.string().min(10).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  answerIndex: z.number().int().min(0).max(5),
  explanation: z.string().max(1200).optional(),
  difficulty: z.string().max(30).default("medium"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(6) })).mutation(async ({ ctx, input }) => {
      let user;
      try {
        user = await db.getOrCreateDemoUser(input.email, input.email.split("@")[0] || "StudyForge learner", input.password);
      } catch {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password" });
      }
      const token = await sdk.signSession({ openId: user.openId, appId: ENV.appId || "studyforge", name: user.name || "StudyForge learner" });
      sessionCookie(ctx, token);
      return { user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  content: router({
    exams: publicProcedure.query(() => db.listExams()),
    subjects: publicProcedure.input(z.object({ examCode: z.string().min(2).default("WAEC") }).optional()).query(({ input }) => db.listSubjects(input?.examCode ?? "WAEC")),
    catalog: protectedProcedure.query(() => db.listContent()),
    questions: protectedProcedure.input(z.object({ topicId: z.number().int().positive().optional(), examId: z.number().int().positive().optional(), examCode: z.string().min(2).optional(), subjectId: z.number().int().positive().optional(), subjectName: z.string().min(2).optional(), difficulty: z.enum(["easy", "medium", "hard"]).optional(), limit: z.number().int().min(1).max(100).optional() }).optional()).query(({ input }) => db.listQuestions(input)),
  }),
  practice: router({
    start: protectedProcedure.input(z.object({ mode: z.enum(["practice", "exam"]).default("practice"), topicId: z.number().int().positive().nullable().optional(), examCode: z.string().min(2).optional() })).mutation(async ({ ctx, input }) => {
      const exam = input.examCode ? await db.getExamByCode(input.examCode) : undefined;
      if (input.mode === "exam" && (!exam || exam.tier !== "premium")) throw new TRPCError({ code: "FORBIDDEN", message: "A premium exam code is required for exam mode." });
      if (input.mode === "exam" && (await db.getSubscription(ctx.user.id))?.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "An active StudyForge Plus subscription is required." });
      return db.createSession(ctx.user.id, input.mode, input.topicId ?? null, exam?.id ?? null);
    }),
    submit: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), questionId: z.number().int().positive(), selectedIndex: z.number().int().min(0).max(5) })).mutation(async ({ ctx, input }) => {
      const session = await db.getSession(input.sessionId, ctx.user.id);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Practice session not found" });
      const question = await db.getQuestionById(input.questionId);
      if (!question) throw new TRPCError({ code: "NOT_FOUND", message: "Question not found" });
      if (session.mode === "exam" && session.examId) {
        const examQuestions = await db.listQuestions({ examId: session.examId, limit: 100 });
        if (!examQuestions.some((candidate) => candidate.id === question.id)) throw new TRPCError({ code: "FORBIDDEN", message: "Question is outside this exam session." });
      }
      const isCorrect = question.answerIndex === input.selectedIndex;
      await db.saveAttempt({ sessionId: input.sessionId, questionId: input.questionId, userId: ctx.user.id, selectedIndex: input.selectedIndex, isCorrect });
      return { isCorrect, explanation: question.explanation };
    }),
    complete: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), score: z.number().int().min(0), total: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const session = await db.getSession(input.sessionId, ctx.user.id);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Practice session not found" });
      if (session.mode === "exam" && !session.examId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Exam session is missing its exam record." });
      const completed = await db.completeSession(input.sessionId, ctx.user.id, input.score, input.total);
      const streak = await db.recordStreakNotification(ctx.user.id);
      return { session: completed, streak };
    }),
  }),
  progress: router({
    history: protectedProcedure.query(({ ctx }) => db.getProgress(ctx.user.id)),
    history30: protectedProcedure.query(({ ctx }) => db.get30DayHistory(ctx.user.id)),
    analytics: protectedProcedure.query(({ ctx }) => db.getAnalytics(ctx.user.id)),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.markNotificationRead(ctx.user.id, input.id)),
  }),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => db.getUserById(ctx.user.id)),
    update: protectedProcedure.input(z.object({ name: z.string().min(2).max(120).optional(), email: z.string().email().optional() })).mutation(({ ctx, input }) => db.updateUserProfile(ctx.user.id, input)),
  }),
  exams: router({
    access: protectedProcedure.input(z.object({ code: z.string().min(2) })).query(async ({ ctx, input }) => {
      const exam = await db.getExamByCode(input.code);
      if (!exam) throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });
      if (exam.tier === "free") return { allowed: true, exam, reason: null };
      const subscription = await db.getSubscription(ctx.user.id);
      const allowed = subscription?.status === "active";
      return { allowed, exam, reason: allowed ? null : "This simulation is part of StudyForge Plus." };
    }),
  }),
  billing: router({
    mode: publicProcedure.query(() => ({ configured: Boolean(ENV.paystackSecretKey), environment: ENV.paystackSecretKey?.startsWith("sk_test_") ? "test" as const : ENV.paystackSecretKey?.startsWith("sk_live_") ? "live" as const : "unknown" as const })),
    plans: publicProcedure.query(() => plans),
    subscription: protectedProcedure.query(async ({ ctx }) => (await db.getSubscription(ctx.user.id)) ?? { status: "free" as const, planCode: null, currentPeriodEnd: null }),
    initializeCheckout: protectedProcedure.input(z.object({ planCode: z.enum(["studyforge_plus_monthly", "studyforge_plus_term"]) })).mutation(async ({ ctx, input }) => {
      if (!ENV.paystackSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paystack is not configured yet." });
      const plan = plans.find((item) => item.code === input.planCode)!;
      if (!ctx.user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Add an email to your profile before starting checkout." });
      const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${ENV.paystackSecretKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: ctx.user.email, amount: plan.amountKobo, reference: `sf_${ctx.user.id}_${Date.now()}`, metadata: { userId: ctx.user.id, planCode: plan.code } }) });
      const payload = await response.json() as { status?: boolean; message?: string; data?: { authorization_url: string; access_code: string; reference: string } };
      if (!response.ok || !payload.status || !payload.data) throw new TRPCError({ code: "BAD_GATEWAY", message: payload.message || "Paystack could not initialize checkout." });
      return payload.data;
    }),
    verifyCheckout: protectedProcedure.input(z.object({ reference: z.string().min(4), planCode: z.enum(["studyforge_plus_monthly", "studyforge_plus_term"]) })).mutation(async ({ ctx, input }) => {
      if (!ENV.paystackSecretKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Paystack is not configured yet." });
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`, { headers: { Authorization: `Bearer ${ENV.paystackSecretKey}` } });
      const payload = await response.json() as { status?: boolean; message?: string; data?: { status: string; amount: number; reference: string } };
      if (!response.ok || !payload.status || payload.data?.status !== "success") throw new TRPCError({ code: "BAD_REQUEST", message: payload.message || "Payment has not been verified." });
      const plan = plans.find((item) => item.code === input.planCode)!;
      const periodMonths = input.planCode.endsWith("term") ? 3 : 1;
      const currentPeriodEnd = new Date(); currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + periodMonths);
      await db.upsertSubscription({ userId: ctx.user.id, reference: payload.data.reference, status: "active", planCode: plan.code, amountKobo: payload.data.amount, currentPeriodEnd });
      return { status: "active" as const, currentPeriodEnd };
    }),
  }),
  admin: router({
    catalog: adminProcedure.query(() => db.listContent()),
    updateQuestion: adminProcedure.input(z.object({ id: z.number().int().positive(), prompt: z.string().min(10).max(2000).optional(), explanation: z.string().max(1200).optional(), answerIndex: z.number().int().min(0).max(5).optional(), difficulty: z.string().max(30).optional(), options: z.array(z.string().min(1).max(500)).min(2).max(6).optional() })).mutation(({ input }) => db.updateQuestion(input.id, input)),
    deleteQuestion: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteQuestion(input.id)),
    updateTopic: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(2).max(120) })).mutation(({ input }) => db.updateTopic(input.id, input.name)),
    deleteTopic: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteTopic(input.id)),
    updateSubject: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(2).max(120) })).mutation(({ input }) => db.updateSubject(input.id, input.name)),
    deleteSubject: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteSubject(input.id)),
    bulkUpdate: adminProcedure.input(z.object({ rows: z.array(z.object({ kind: z.enum(["subject", "topic", "question"]), id: z.number().int().positive(), value: z.string().min(2).max(2000) })).min(1).max(200) })).mutation(async ({ input }) => {
      for (const row of input.rows) {
        if (row.kind === "subject") await db.updateSubject(row.id, row.value);
        else if (row.kind === "topic") await db.updateTopic(row.id, row.value);
        else await db.updateQuestion(row.id, { prompt: row.value });
      }
      return { updated: input.rows.length };
    }),
    importQuestions: adminProcedure.input(z.object({ rows: z.array(importRowSchema).min(1).max(500) })).mutation(async ({ input }) => {
      const seen = new Set<string>();
      let imported = 0; let skipped = 0;
      const errors: Array<{ row: number; message: string }> = [];
      for (let index = 0; index < input.rows.length; index++) {
        const row = input.rows[index]!;
        const key = `${row.examCode}|${row.subjectSlug}|${row.topicSlug}|${row.prompt.trim().toLowerCase()}`;
        if (seen.has(key) || await db.questionExists({ examCode: row.examCode, subjectSlug: row.subjectSlug, topicSlug: row.topicSlug, prompt: row.prompt })) { skipped++; continue; }
        seen.add(key);
        try {
          await db.insertContent({ exam: { code: row.examCode, name: row.examName, description: row.examDescription, tier: row.examTier }, subject: { name: row.subjectName, slug: row.subjectSlug }, topic: { name: row.topicName, slug: row.topicSlug }, question: { prompt: row.prompt, options: row.options, answerIndex: row.answerIndex, explanation: row.explanation, difficulty: row.difficulty } });
          imported++;
        } catch (error) {
          errors.push({ row: index + 1, message: error instanceof Error ? error.message : "Import failed" });
        }
      }
      return { imported, skipped, errors };
    }),
  }),
});

export type AppRouter = typeof appRouter;
