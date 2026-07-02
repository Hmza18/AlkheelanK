/** Flip to true when Lemon Squeezy is verified and checkout works in production. */
export const isBillingLive = import.meta.env.VITE_BILLING_ENABLED === "true";
