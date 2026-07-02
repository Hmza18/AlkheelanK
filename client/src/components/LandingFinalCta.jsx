import GlowCard from "./ui/GlowCard.jsx";
import { copy } from "../lib/copy.js";

export default function LandingFinalCta({ onHost }) {
  const { title, body, cta, footnote } = copy.landing.finalCta;

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <GlowCard intense>
        <div className="k-final-cta p-8 sm:p-10">
          <p className="k-final-cta__eyebrow">{copy.landing.finalCta.eyebrow}</p>
          <h2 className="k-final-cta__title">{title}</h2>
          <p className="k-final-cta__body">{body}</p>
          <button type="button" onClick={onHost} className="alkheelank-btn-primary k-btn-glow mt-6 w-full px-8 text-lg">
            {cta}
          </button>
          <p className="k-final-cta__note">{footnote}</p>
        </div>
      </GlowCard>
    </div>
  );
}
