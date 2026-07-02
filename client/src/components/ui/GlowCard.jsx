/** Gradient-border card with soft outer glow — Marc Lou / indie SaaS shell. */
export default function GlowCard({ children, className = "", intense = false }) {
  return (
    <div className={`k-glow-card ${intense ? "k-glow-card--intense" : ""} ${className}`}>
      <div className="k-glow-card__inner">{children}</div>
    </div>
  );
}
