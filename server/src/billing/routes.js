import express from "express";
import {
  billingConfig,
  configuredPlanIds,
  createCheckout,
  parseWebhookPayload,
  verifyWebhookSignature,
} from "./lemonSqueezy.js";

const limitCheckout = express.Router();

limitCheckout.post("/checkout", async (req, res) => {
  const { email, userId } = req.body || {};
  const result = await createCheckout({
    planId: "pro",
    email: typeof email === "string" ? email.trim() : undefined,
    userId: typeof userId === "string" ? userId.trim() : undefined,
  });

  if (result.error) {
    const status = result.error.includes("not configured") ? 503 : 400;
    return res.status(status).json({ error: result.error });
  }

  res.json({ url: result.url });
});

limitCheckout.get("/status", (_req, res) => {
  const cfg = billingConfig();
  res.json({
    configured: cfg.configured,
    plans: configuredPlanIds(),
  });
});

export function mountBillingJsonRoutes(app) {
  app.use("/api/billing", limitCheckout);
}

export function billingWebhookHandler(req, res) {
  const signature = req.headers["x-signature"];
  const rawBody = req.body;

  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).send("Expected raw body");
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[billing] Webhook signature mismatch");
    return res.status(401).send("Invalid signature");
  }

  const payload = parseWebhookPayload(rawBody);
  if (!payload) return res.status(400).send("Invalid JSON");

  const eventName = payload?.meta?.event_name;
  const custom = payload?.meta?.custom_data || {};
  console.info("[billing] Lemon Squeezy webhook:", eventName, custom);

  // Subscription sync to Supabase can be added when LEMONSQUEEZY_WEBHOOK_SECRET
  // and SUPABASE_SERVICE_ROLE_KEY are configured.
  res.status(200).send("OK");
}
