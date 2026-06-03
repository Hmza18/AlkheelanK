// Ambient living-room backdrop: warm brand glows + slowly floating answer shapes.
// Purely decorative; pointer-events disabled so it never blocks taps.
import Shape from "./Shape.jsx";

const FLOATERS = [
  { type: "triangle", color: "#f43f5e", top: "12%", left: "8%", size: 70, delay: "0s" },
  { type: "diamond", color: "#0ea5e9", top: "70%", left: "12%", size: 56, delay: "1.5s" },
  { type: "circle", color: "#f59e0b", top: "22%", left: "82%", size: 64, delay: "0.8s" },
  { type: "square", color: "#10b981", top: "68%", left: "85%", size: 60, delay: "2.2s" },
];

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-900">
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-start/20 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-brand-mid/18 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-brand-end/12 blur-3xl" />
      {FLOATERS.map((f, i) => (
        <div
          key={i}
          className="absolute animate-float opacity-[0.14]"
          style={{ top: f.top, left: f.left, animationDelay: f.delay }}
        >
          <Shape type={f.type} size={f.size} color={f.color} />
        </div>
      ))}
    </div>
  );
}
