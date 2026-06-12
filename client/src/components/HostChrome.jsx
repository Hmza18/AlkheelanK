import { useState } from "react";
import SettingsPanel from "./SettingsPanel.jsx";

const IN_GAME_PHASES = ["lobby", "question", "reveal", "standings"];
const settingsBtnClass =
  "z-40 alkheelank-touch-target h-12 w-12 shrink-0 rounded-xl bg-ink-800/80 text-xl ring-1 ring-white/10 backdrop-blur transition hover:bg-ink-700 landscapePhone:h-9 landscapePhone:w-9 landscapePhone:min-h-9 landscapePhone:min-w-9 landscapePhone:rounded-lg landscapePhone:text-base";

/**
 * Host-only floating chrome. Portrait: settings icon bottom-left, end bottom-right,
 * control deck above end. Phone landscape: single top-right toolbar (no overlap).
 */
export default function HostChrome({
  phase,
  pacing,
  paused,
  hostError,
  onDismissError,
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
  const showEnd = IN_GAME_PHASES.includes(phase);
  const showDeck = ["question", "reveal", "standings"].includes(phase);
  const hostControls = showDeck
    ? {
        phase,
        pacing,
        paused,
        onPacing,
        onPause,
        onResume,
        onSkipQuestion,
        onSkipReveal,
      }
    : null;

  return (
    <>
      {hostError && (
        <div className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 w-[min(92vw,28rem)] -translate-x-1/2">
          <div className="flex items-start gap-3 rounded-2xl bg-tile-triangle/20 px-4 py-3 text-sm font-semibold text-tile-triangle ring-1 ring-tile-triangle/40 backdrop-blur">
            <p className="flex-1">{hostError}</p>
            <button
              type="button"
              onClick={onDismissError}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-paper hover:bg-white/10"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <SettingsPanel open={open} onOpenChange={setOpen} hideTrigger hostControls={hostControls} />

      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Settings"
        className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] landscapePhone:hidden ${settingsBtnClass}`}
      >
        ⚙️
      </button>
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Settings"
          aria-label="Settings"
          className={`pointer-events-auto relative ${settingsBtnClass}`}
        >
          ⚙️
        </button>
        {showEnd && (
          <button
            type="button"
            onClick={onEndGame}
            className="pointer-events-auto h-9 shrink-0 rounded-lg bg-ink-800/90 px-3 text-xs font-semibold text-muted ring-1 ring-white/10 backdrop-blur hover:text-paper"
          >
            {endLabel}
          </button>
        )}
      </div>
    </>
  );
}
