import Logo from "../Logo.jsx";
import { copy } from "../../lib/copy.js";
import HostPregameShell, {
  PregameHeaderLink,
  PregameLogoButton,
  PregameStartButton,
} from "./HostPregameShell.jsx";
import SegmentControl from "./SegmentControl.jsx";
import SettingToggle from "./SettingToggle.jsx";

const TEAM_PRESET_LABELS = {
  kidsAdults: "Kids vs Adults",
  colorClash: "Color Clash",
};

const TOGGLE_OPTIONS = [
  ["speedScoring", "Speed bonus", "Quick taps earn more. Off = flat points."],
  ["randomizeQuestions", "Shuffle rounds", "Different question order each game."],
  ["randomizeAnswers", "Shuffle tiles", "Mix answer spots (True/False stays put)."],
];

export default function SetupView({ quiz, settings, setSettings, onCreate, onCancel }) {
  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <HostPregameShell
      headerLeft={
        <PregameLogoButton onClick={() => window.location.assign("/")}>
          <Logo size="sm" />
        </PregameLogoButton>
      }
      headerRight={<PregameHeaderLink onClick={onCancel}>← Dashboard</PregameHeaderLink>}
      footer={
        <PregameStartButton onClick={onCreate}>Open lobby →</PregameStartButton>
      }
    >
      <div className="pregame-setup">
        <div className="pregame-setup__intro">
          <h1 className="pregame-setup__title alkheelank-heading">Tune your show</h1>
          <p className="pregame-setup__subtitle">Set the vibe, then open the lobby.</p>
        </div>

        {quiz && (
          <div className="alkheelank-card pregame-setup__card">
            <p className="alkheelank-label">Quiz</p>
            <p className="mt-2 font-display text-xl font-bold text-ink-900">{quiz.title}</p>
            <p className="mt-1 text-sm font-semibold text-muted">
              {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"}
            </p>
          </div>
        )}

        <div className="alkheelank-card pregame-setup__card">
          <p className="alkheelank-label">Mode</p>
          <SegmentControl
            className="mt-3"
            value={settings.mode}
            onChange={(mode) => setSettings((s) => ({ ...s, mode }))}
            options={[
              { id: "solo", label: "Solo" },
              { id: "teams", label: "Teams" },
            ]}
          />
          {settings.mode === "teams" && (
            <div className="mt-4">
              <p className="alkheelank-label">Team setup</p>
              <SegmentControl
                className="mt-2"
                value={settings.teamPreset}
                onChange={(teamPreset) => setSettings((s) => ({ ...s, teamPreset }))}
                options={Object.entries(TEAM_PRESET_LABELS).map(([id, label]) => ({ id, label }))}
              />
            </div>
          )}
        </div>

        <div className="alkheelank-card pregame-setup__card">
          <p className="alkheelank-label">{copy.host.pacing.label}</p>
          <p className="pregame-setup__hint">How snappy reveals feel on the big screen.</p>
          <SegmentControl
            className="mt-3"
            value={settings.pacing || "normal"}
            onChange={(pacing) => setSettings((s) => ({ ...s, pacing }))}
            options={[
              { id: "quick", label: copy.host.pacing.quick },
              { id: "normal", label: copy.host.pacing.normal },
              { id: "cinematic", label: copy.host.pacing.cinematic },
            ]}
          />
        </div>

        <div className="pregame-setup__toggles">
          {TOGGLE_OPTIONS.map(([key, title, desc]) => (
            <SettingToggle
              key={key}
              title={title}
              description={desc}
              active={settings[key]}
              onToggle={() => toggle(key)}
            />
          ))}
        </div>
      </div>
    </HostPregameShell>
  );
}
