import { CHECKOUT_PLAN_ID } from "./pendingCheckout.js";
import { serverUrl } from "./serverUrl.js";

function apiUrl(path) {
  return serverUrl(path);
}

let statusCache = null;
let checkoutInFlight = null;

export async function getBillingStatus({ force = false } = {}) {
  if (statusCache && !force) return statusCache;
  try {
    const res = await fetch(apiUrl("/api/billing/status"));
    const data = await res.json().catch(() => ({}));
    if (res.ok && typeof data.configured === "boolean") {
      statusCache = data;
      return data;
    }
  } catch {
    // Network error — don't cache; caller can retry.
  }
  return { configured: false, plans: [] };
}

export async function startCheckout(planId = CHECKOUT_PLAN_ID, { email, userId } = {}) {
  if (checkoutInFlight) return checkoutInFlight;

  checkoutInFlight = (async () => {
    let res;
    try {
      res = await fetch(apiUrl("/api/billing/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: CHECKOUT_PLAN_ID, email, userId }),
      });
    } catch {
      throw new Error(
        import.meta.env.DEV
          ? "Can't reach the billing server — start it with npm run dev:server."
          : "Can't reach the billing server. Try again in a moment.",
      );
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Could not start checkout.");
    }
    if (data.url) {
      try {
        sessionStorage.setItem("kheelan_checkout_redirect", data.url);
      } catch {
        // ignore
      }
      window.location.replace(data.url);
    }
    return data;
  })();

  try {
    return await checkoutInFlight;
  } finally {
    checkoutInFlight = null;
  }
}

/** @returns {Promise<boolean>} true if redirecting to Lemon Squeezy */
export async function redirectToCheckoutIfConfigured(_planId, user) {
  try {
    await startCheckout(CHECKOUT_PLAN_ID, {
      email: user?.email,
      userId: user?.id,
    });
    return true;
  } catch (err) {
    const msg = err?.message || "";
    if (/not configured|No Lemon Squeezy variant/i.test(msg)) return false;
    throw err;
  }
}
