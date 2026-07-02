// Soft ambient backdrop — Marc Lou-style glow orbs + dot grid.

export default function Background() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--alkheelank-surface)" }}
    >
      <div className="k-grid-bg" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, var(--alkheelank-glow-a), transparent 68%)",
        }}
      />
      <div
        className="absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full blur-[130px] opacity-90"
        style={{ background: "var(--alkheelank-glow-a)" }}
      />
      <div
        className="absolute -bottom-24 -right-32 h-[26rem] w-[26rem] rounded-full blur-[120px] opacity-80"
        style={{ background: "var(--alkheelank-glow-b)" }}
      />
      <div
        className="absolute left-1/2 top-[38%] h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px] opacity-50"
        style={{ background: "var(--alkheelank-glow-c)" }}
      />
    </div>
  );
}
