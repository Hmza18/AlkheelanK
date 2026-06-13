import { HAMZA_INSTAGRAM_URL } from "../lib/credits.js";

export default function BuiltByHamza({ className = "" }) {
  return (
    <p className={`text-center text-sm font-semibold text-muted/80 ${className}`.trim()}>
      Built by{" "}
      <a
        href={HAMZA_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-900 underline-offset-4 transition hover:text-brand-mid hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mid"
      >
        Hamza
      </a>
    </p>
  );
}
