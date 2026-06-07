import { useState } from "react";
import SettingsPanel from "./SettingsPanel.jsx";
import HostControlDeck from "./HostControlDeck.jsx";

const IN_GAME_PHASES = ["lobby", "question", "reveal", "standings"];
const PREGAME_PHASES = ["setup", "connecting", "lobby"];

const settingsBtnClass =
  "z-40 alkheelank-touch-target h-12 w-12 shrink-0 rounded-xl bg-ink-800/80 text-xl ring-1 ring-white/10 backdrop-blur transition hover:bg-ink-700";

/**
 * Host-only floating chrome. Portrait: settings bottom-left, end bottom-right,
 * control deck above end. Phone landscape: single top-right toolbar (no overlap).
 */
export default function HostChrome({
  phase,
  pacing,
  paused,
  onPacing,
  onPause,
  onResume,
  onSkipQuestion,
  onSkipReveal,
  onEndGame,
  endLabel,
  settingsOpen,
  onSettingsOpenChange,
}) {
  const [settingsOpenInternal, setSettingsOpenInternal] = useState(false);
  const open = settingsOpen ?? settingsOpenInternal;
  const setOpen = onSettingsOpenChange ?? setSettingsOpenInternal;
  const hideFloatingSettings = PREGAME_PHASES.includes(phase);
  const showEnd = IN_GAME_PHASES.includes(phase);
  const showDeck = ["question", "reveal", "standings"].includes(phase);

  return (
    <>
      <SettingsPanel open={open} onOpenChange={setOpen} hideTrigger />

      {/* Portrait — settings hidden during pre-game (header trigger instead) */}
      {!hideFloatingSettings && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Settings"
          className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] landscapePhone:hidden ${settingsBtnClass}`}
        >
          ⚙️
        </button>
      )}
      {showDeck && (
        <HostControlDeck
          phase={phase}
          pacing={pacing}
          paused={paused}
          onPacing={onPacing}
          onPause={onPause}
          onResume={onResume}
          onSkipQuestion={onSkipQuestion}
          onSkipReveal={onSkipReveal}
          wrapperClassName="landscapePhone:hidden"
        />
      )}
      {showEnd && (
        <button
          type="button"
          onClick={onEndGame}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 rounded-xl bg-ink-800/80 px-4 py-2 text-sm font-semibold text-muted ring-1 ring-white/10 backdrop-blur hover:text-paper landscapePhone:hidden"
        >
          {endLabel}
        </button>
      )}

      {/* Phone landscape toolbar */}
      <div
        className="host-chrome-toolbar pointer-events-none fixed z-40 hidden items-center gap-2 landscapePhone:flex"
        aria-label="Host controls"
      >
        {!hideFloatingSettings && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Settings"
            className={`pointer-events-auto relative ${settingsBtnClass}`}
          >
            ⚙️
          </button>
        )}
        {showDeck && (
          <HostControlDeck
            phase={phase}
            pacing={pacing}
            paused={paused}
            onPacing={onPacing}
            onPause={onPause}
            onResume={onResume}
            onSkipQuestion={onSkipQuestion}
            onSkipReveal={onSkipReveal}
            wrapperClassName="pointer-events-auto relative"
            panelAnchor="below"
          />
        )}
        {showEnd && (
          <button
            type="button"
            onClick={onEndGame}
            className="pointer-events-auto shrink-0 rounded-xl bg-ink-800/90 px-3 py-2 text-xs font-semibold text-muted ring-1 ring-white/10 backdrop-blur hover:text-paper"
          >
            {endLabel}
          </button>
        )}
      </div>
    </>
  );
}
