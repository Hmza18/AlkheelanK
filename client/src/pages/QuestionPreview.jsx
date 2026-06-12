import AnswerTile from "../components/AnswerTile.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import QuestionProgress from "../components/QuestionProgress.jsx";
import Timer, { TimerStrip } from "../components/Timer.jsx";

const makeSvgImage = (width, height, label, accent) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2e2922"/>
        <stop offset="55%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="#1a1814"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="${width * 0.26}" cy="${height * 0.34}" r="${Math.min(width, height) * 0.18}" fill="rgba(250,246,240,0.22)"/>
    <rect x="${width * 0.52}" y="${height * 0.22}" width="${width * 0.28}" height="${height * 0.5}" rx="${Math.min(width, height) * 0.06}" fill="rgba(250,246,240,0.2)"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="#faf6f0" font-family="Inter,Arial,sans-serif" font-size="${Math.max(28, Math.min(width, height) * 0.1)}" font-weight="800">${label}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const PREVIEW_IMAGES = {
  standard: makeSvgImage(960, 720, "4:3 photo", "#d97706"),
  wide: makeSvgImage(1200, 520, "wide photo", "#ea580c"),
  tall: makeSvgImage(520, 1040, "tall photo", "#e11d48"),
};

const MOCK = {
  index: 2,
  total: 10,
  type: "mc",
  question: "Which planet is known as the Red Planet?",
  timeLimit: 20,
  startedAt: Date.now(),
  answers: [
    { text: "Venus" },
    { text: "Mars" },
    { text: "Jupiter" },
    { text: "Saturn" },
  ],
};

/** Dev-only layout preview — open /dev/question-preview */
export default function QuestionPreview() {
  const params = new URLSearchParams(window.location.search);
  const variant = params.get("variant") === "host" ? "host" : "player";
  const imageKey = params.get("image") || "standard";
  const isHost = variant === "host";
  const q = {
    ...MOCK,
    question: params.get("prompt") || MOCK.question,
    image: PREVIEW_IMAGES[imageKey] || PREVIEW_IMAGES.standard,
  };

  return (
    <QuestionScreen
      variant={variant}
      questionType={q.type}
      questionKey={q.index}
      promptTag={isHost ? "h1" : "h2"}
      header={
        isHost ? (
          <div className="host-meta">
            <span className="host-meta__index">
              <span className="host-meta__index-now">{q.index + 1}</span>
              <span className="host-meta__index-sep">/</span>
              <span className="host-meta__index-total">{q.total}</span>
            </span>
            <span className="host-meta__answered">
              <span className="host-meta__pulse" aria-hidden />
              <span className="host-meta__answered-count">8</span>
              <span className="host-meta__answered-total">/ 12</span>
              <span className="host-meta__answered-label">answered</span>
            </span>
          </div>
        ) : (
          <div className="question-screen__meta flex shrink-0 items-center justify-between text-sm font-semibold text-muted">
            <span>
              Q{q.index + 1} / {q.total}
            </span>
            <span>Speed counts</span>
          </div>
        )
      }
      progress={
        isHost ? (
          <div className="host-answer-progress" role="progressbar" aria-label="Players answered" aria-valuemin={0} aria-valuemax={12} aria-valuenow={8}>
            <div className="host-answer-progress__fill" style={{ width: "67%" }} />
          </div>
        ) : (
          <QuestionProgress index={q.index} total={q.total} />
        )
      }
      prompt={q.question}
      image={q.image}
      animateImage
      timer={
        isHost ? (
          <>
            <div className="question-screen__timer-full">
              <Timer timeLimit={q.timeLimit} startedAt={q.startedAt} />
            </div>
            <div className="question-screen__timer-compact">
              <Timer timeLimit={q.timeLimit} startedAt={q.startedAt} size={48} />
            </div>
          </>
        ) : null
      }
      timerStrip={<TimerStrip timeLimit={q.timeLimit} startedAt={q.startedAt} />}
      answers={q.answers.map((a, i) => (
        <AnswerTile
          key={i}
          index={i}
          type={q.type}
          text={a.text}
          onClick={isHost ? undefined : () => {}}
          disabled={isHost}
          kahoot={!isHost}
          big={isHost}
          compact
        />
      ))}
    />
  );
}
