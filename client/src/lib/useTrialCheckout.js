import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isBillingLive } from "../lib/billingMode.js";
import { redirectToCheckoutIfConfigured } from "../lib/billing.js";
import {
  CHECKOUT_PLAN_ID,
  clearPendingCheckoutPlan,
  setPendingCheckoutPlan,
} from "../lib/pendingCheckout.js";

export function useTrialCheckout(user) {
  const navigate = useNavigate();
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const goHostFree = useCallback(() => {
    navigate(user ? "/host" : "/host?guest=1");
  }, [navigate, user]);

  const goTrial = useCallback(async () => {
    if (!isBillingLive) {
      goHostFree();
      return;
    }

    setCheckoutError(null);
    if (user) {
      setCheckoutBusy(true);
      try {
        setPendingCheckoutPlan();
        const started = await redirectToCheckoutIfConfigured(CHECKOUT_PLAN_ID, user);
        if (started) {
          clearPendingCheckoutPlan();
          return;
        }
        navigate("/host");
      } catch (err) {
        setCheckoutError(err?.message || "Checkout failed.");
      } finally {
        setCheckoutBusy(false);
      }
      return;
    }
    setPendingCheckoutPlan();
    navigate(`/login?plan=${CHECKOUT_PLAN_ID}`);
  }, [goHostFree, navigate, user]);

  return { goTrial, goHostFree, checkoutError, checkoutBusy, isBillingLive };
}
