import GlowCard from "./ui/GlowCard.jsx";
import { copy } from "../lib/copy.js";

function ProPricingCard({ plan, onSubscribe }) {
  const { vs } = plan;

  return (
    <GlowCard intense className="k-pricing-card-wrap k-pricing-card-wrap--featured w-full max-w-lg">
      <div className="k-pricing-card k-pricing-card--featured k-pricing-card--solo p-6 text-left sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="k-pricing-card__name">{plan.name}</p>
            <p className="k-pricing-card__tagline">{plan.tagline}</p>
          </div>
          {plan.badge && <span className="k-pricing-card__badge">{plan.badge}</span>}
        </div>

        {vs && (
          <div className="k-pricing-vs mt-5">
            <div className="k-pricing-vs__col k-pricing-vs__col--them">
              <span className="k-pricing-vs__label">{vs.themLabel}</span>
              <span className="k-pricing-vs__price k-pricing-vs__price--struck">{vs.themPrice}</span>
            </div>
            <span className="k-pricing-vs__arrow" aria-hidden="true">
              →
            </span>
            <div className="k-pricing-vs__col k-pricing-vs__col--us">
              <span className="k-pricing-vs__label">{vs.usLabel}</span>
              <span className="k-pricing-vs__price">{vs.usPrice}</span>
            </div>
          </div>
        )}

        <div className="k-pricing-hero-price mt-6">
          <p className="k-pricing-card__price">
            <span className="k-pricing-card__amount">{plan.price}</span>
            <span className="k-pricing-card__period">{plan.period}</span>
          </p>
          {plan.priceSub && <p className="k-pricing-card__sub">{plan.priceSub}</p>}
          {plan.trial && <p className="k-pricing-card__trial">{plan.trial}</p>}
        </div>

        <ul className="k-pricing-card__features mt-6">
          {plan.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onSubscribe()}
          className="alkheelank-btn-primary k-btn-glow mt-6 w-full text-base sm:text-lg"
        >
          {plan.cta}
        </button>
      </div>
    </GlowCard>
  );
}

export default function LandingPricing({ onSubscribe }) {
  const { eyebrow, title, subtitle, playerNote, plans } = copy.landing.pricing;
  const plan = plans[0];

  return (
    <div className="mx-auto w-full max-w-4xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-mid">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-muted">{subtitle}</p>

      <div className="mx-auto mt-8 flex justify-center px-1">
        {plan && <ProPricingCard plan={plan} onSubscribe={onSubscribe} />}
      </div>

      <p className="mt-5 text-xs font-semibold text-muted">{playerNote}</p>
    </div>
  );
}
