/** Thin Kahoot-style quiz progress — fills as questions advance. */
export default function QuestionProgress({ index = 0, total = 1 }) {
  const pct = total > 0 ? Math.min(100, ((index + 1) / total) * 100) : 0;

  return (
    <div
      className="question-progress"
      role="progressbar"
      aria-valuenow={index + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Question ${index + 1} of ${total}`}
    >
      <div className="question-progress__track">
        <div className="question-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
