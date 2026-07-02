import crypto from "crypto";

const API_BASE = "https://api.lemonsqueezy.com/v1";

const PLAN_VARIANT_ENV = {
  pro: "LEMONSQUEEZY_VARIANT_PRO",
};

/** Where Lemon Squeezy sends the customer after a successful checkout. */
function checkoutRedirectBase() {
  const url =
    process.env.CHECKOUT_REDIRECT_URL?.trim() ||
    process.env.CLIENT_URL?.trim() ||
    process.env.PRODUCTION_SITE_URL?.trim() ||
    process.env.CORS_ORIGIN?.split(",")?.[0]?.trim() ||
    "http://localhost:5173";
  return url.replace(/\/$/, "");
}

export function billingConfig() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMONSQUEEZY_STORE_ID?.trim();
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();
  const clientUrl = checkoutRedirectBase();

  const variants = {};
  for (const [planId, envKey] of Object.entries(PLAN_VARIANT_ENV)) {
    const id = process.env[envKey]?.trim();
    if (id) variants[planId] = id;
  }

  return {
    configured: Boolean(apiKey && Object.keys(variants).length > 0),
    apiKey,
    storeId,
    webhookSecret,
    clientUrl,
    variants,
  };
}

export function variantIdForPlan(planId) {
  const { variants } = billingConfig();
  return variants[planId] ?? null;
}

export function configuredPlanIds() {
  return Object.keys(billingConfig().variants);
}

async function lemonFetch(path, apiKey, init = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.body ? { "Content-Type": "application/vnd.api+json" } : {}),
      ...init.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail || res.statusText;
    throw new Error(detail || "Lemon Squeezy API error.");
  }
  return json;
}

async function resolveProContext(apiKey, variantId) {
  const json = await lemonFetch(`/variants/${variantId}?include=product`, apiKey);
  const product = json.included?.find((row) => row.type === "products");

  if (product?.attributes?.status !== "published") {
    throw new Error("Publish Kheelan Pro in Lemon Squeezy first (Products → Kheelan Pro → Publish product).");
  }

  const storeId = String(product?.attributes?.store_id || billingConfig().storeId || "");
  if (!storeId) {
    throw new Error("Could not resolve Lemon Squeezy store for Pro.");
  }

  return { storeId, variantId: String(variantId) };
}

export async function createCheckout({ email, userId }) {
  const cfg = billingConfig();
  if (!cfg.configured) {
    return { error: "Billing is not configured on this server." };
  }

  const variantId = variantIdForPlan("pro");
  if (!variantId) {
    return { error: "No Lemon Squeezy variant configured for Pro." };
  }

  try {
    const { storeId } = await resolveProContext(cfg.apiKey, variantId);
    const redirectUrl = `${cfg.clientUrl}/host?checkout=success&plan=pro`;

    const attributes = {
      checkout_data: {
        ...(email
          ? {
              email,
              name: email.split("@")[0]?.trim() || "Customer",
            }
          : {}),
        custom: {
          plan_id: "pro",
          ...(userId ? { user_id: String(userId) } : {}),
        },
      },
      product_options: {
        redirect_url: redirectUrl,
        receipt_button_text: "Open host dashboard",
        receipt_thank_you_note: "Your Pro trial is active — start hosting from your dashboard.",
      },
    };

    const json = await lemonFetch("/checkouts", cfg.apiKey, {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes,
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: String(variantId) } },
          },
        },
      }),
    });

    const url = json?.data?.attributes?.url;
    if (!url) return { error: "Checkout created but no URL returned." };
    return { url };
  } catch (err) {
    console.error("[billing] Checkout failed:", err?.message || err);
    return { error: err?.message || "Could not start checkout." };
  }
}

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const { webhookSecret } = billingConfig();
  if (!webhookSecret || !signatureHeader) return false;

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseWebhookPayload(rawBody) {
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    return null;
  }
}
