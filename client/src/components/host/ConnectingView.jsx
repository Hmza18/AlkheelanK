import Logo from "../Logo.jsx";
import { copy } from "../../lib/copy.js";
import HostPregameShell, { PregameHeaderLink, PregameLogoButton } from "./HostPregameShell.jsx";

const STEPS = [
  { key: "server", label: "Connecting" },
  { key: "waking", label: "Waking server" },
  { key: "creating", label: "Creating room" },
];

function activeStepIndex(connectHint) {
  if (connectHint === copy.connecting.creating || connectHint === copy.connecting.restoring) return 2;
  if (
    connectHint === copy.connecting.waking ||
    connectHint === copy.connecting.slow ||
    connectHint === copy.connecting.verySlow
  ) {
    return 1;
  }
  return 0;
}

export default function ConnectingView({
  connectHint,
  hostError,
  onRetry,
  onBack,
  onCancel,
}) {
  const stepIdx = activeStepIndex(connectHint);

  return (
    <HostPregameShell
      headerLeft={
        <PregameLogoButton onClick={() => window.location.assign("/")}>
          <Logo size="sm" />
        </PregameLogoButton>
      }
      headerRight={null}
      footer={
        !hostError ? (
          <button type="button" onClick={onCancel} className="pregame-cancel-btn alkheelank-btn-ghost">
            Cancel
          </button>
        ) : null
      }
    >
      <div className="pregame-connecting">
        <div className="alkheelank-card pregame-connecting__card">
          <div className="pregame-connecting__pulse" aria-hidden="true" />
          <h1 className="pregame-connecting__title alkheelank-heading">{copy.connecting.title}</h1>
          <p className={`pregame-connecting__hint ${hostError ? "pregame-connecting__hint--error" : ""}`}>
            {hostError || connectHint}
          </p>

          {!hostError && (
            <ol className="pregame-connecting__steps" aria-label="Connection progress">
              {STEPS.map((step, i) => (
                <li
                  key={step.key}
                  className={`pregame-connecting__step ${i <= stepIdx ? "pregame-connecting__step--active" : ""}`}
                >
                  {step.label}
                </li>
              ))}
            </ol>
          )}

          {hostError && (
            <div className="pregame-connecting__actions">
              <button type="button" onClick={onRetry} className="alkheelank-btn-primary">
                Try again
              </button>
              <button type="button" onClick={onBack} className="alkheelank-btn-ghost">
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </HostPregameShell>
  );
}
