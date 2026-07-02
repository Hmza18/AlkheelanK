const STORAGE_KEY = "kheelan_pending_checkout_plan";
export const CHECKOUT_PLAN_ID = "pro";

export function isValidCheckoutPlan(planId) {
  return planId === CHECKOUT_PLAN_ID;
}

/** Remember checkout intent before OAuth or email sign-in. */
export function setPendingCheckoutPlan(planId = CHECKOUT_PLAN_ID) {
  try {
    sessionStorage.setItem(STORAGE_KEY, CHECKOUT_PLAN_ID);
  } catch {
    // Private browsing / quota — URL ?plan= is still the fallback.
  }
}

export function getPendingCheckoutPlan() {
  try {
    const plan = sessionStorage.getItem(STORAGE_KEY);
    return plan === CHECKOUT_PLAN_ID ? CHECKOUT_PLAN_ID : null;
  } catch {
    return null;
  }
}

export function clearPendingCheckoutPlan() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** URL param wins; otherwise use the plan saved before OAuth. Legacy ?plan= values map to Pro. */
export function resolveCheckoutPlan(urlPlan) {
  if (urlPlan) {
    setPendingCheckoutPlan();
    return CHECKOUT_PLAN_ID;
  }
  return getPendingCheckoutPlan();
}
