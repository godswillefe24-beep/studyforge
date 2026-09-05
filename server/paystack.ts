import { createHmac, timingSafeEqual } from "node:crypto";
import type { Express, Request } from "express";
import { getUserByEmail, getUserByOpenId, upsertSubscription } from "./db";
import { ENV } from "./_core/env";

type PaystackEvent = {
  event?: string;
  data?: {
    status?: string;
    amount?: number;
    reference?: string;
    customer?: { email?: string };
    metadata?: { userId?: string | number; planCode?: string };
  };
};

function isValidSignature(req: Request) {
  const signature = req.header("x-paystack-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!signature || !rawBody || !ENV.paystackSecretKey) return false;
  const expected = createHmac("sha512", ENV.paystackSecretKey).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function registerPaystackRoutes(app: Express) {
  app.post("/api/paystack/webhook", async (req, res) => {
    if (!isValidSignature(req)) return res.status(401).json({ ok: false, message: "Invalid Paystack signature" });
    const payload = req.body as PaystackEvent;
    if (payload.event !== "charge.success" || payload.data?.status !== "success") return res.status(200).json({ ok: true, ignored: true });
    try {
      const data = payload.data;
      const email = data.customer?.email;
      const userId = data.metadata?.userId ? Number(data.metadata.userId) : undefined;
      const user = email ? await getUserByEmail(email) : undefined;
      const resolvedUser = user ?? (userId ? await getUserByOpenId(`studyforge_user_${userId}`) : undefined);
      if (!resolvedUser || !data.reference) return res.status(200).json({ ok: true, ignored: true });
      const planCode = data.metadata?.planCode === "studyforge_plus_term" ? "studyforge_plus_term" : "studyforge_plus_monthly";
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (planCode.endsWith("term") ? 3 : 1));
      await upsertSubscription({ userId: resolvedUser.id, reference: data.reference, status: "active", planCode, amountKobo: Number(data.amount ?? 0), currentPeriodEnd });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Paystack] Webhook processing failed", error);
      return res.status(500).json({ ok: false });
    }
  });
}
