import AnswerTile from "../components/AnswerTile.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import Timer from "../components/Timer.jsx";

const MOCK = {
  index: 2,
  total: 10,
  type: "mc",
  question: "Which planet is known as the Red Planet?",
  image: "https://picsum.photos/seed/alkheeloot/960/720",
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
  const q = MOCK;
  return (
    <QuestionScreen
      variant="player"
      header={
        <div className="question-screen__meta flex shrink-0 items-center justify-between text-sm font-semibold text-muted">
          <span>
            Q{q.index + 1} / {q.total}
          </span>
          <span>Speed counts</span>
        </div>
      }
      prompt={q.question}
      image={q.image}
      animateImage
      timer={<Timer timeLimit={q.timeLimit} startedAt={q.startedAt} size={48} />}
      answers={q.answers.map((a, i) => (
        <AnswerTile key={i} index={i} type={q.type} text={a.text} onClick={() => {}} compact />
      ))}
    />
  );
}
