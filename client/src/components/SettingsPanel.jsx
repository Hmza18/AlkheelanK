import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { copy } from "../lib/copy.js";
import { getAudioSettings, setAudioSettings, primeAudio, sfx, subscribeAudio } from "../lib/sound.js";
import ThemeToggle from "./ThemeToggle.jsx";

const PACING_OPTIONS = [
  { id: "quick", label: copy.host.pacing.quick, hint: copy.host.pacing.quickHint },
  { id: "normal", label: copy.host.pacing.normal, hint: copy.host.pacing.normalHint },
  { id: "cinematic", label: copy.host.pacing.cinematic, hint: copy.host.pacing.cinematicHint },
];

// A floating gear button + slide-in drawer for audio settings. Self-contained:
// reads/writes the persisted audio store, and changes drive playback live.
// Drop <SettingsPanel /> anywhere (dashboard, in-game) — it pins itself.
export default function SettingsPanel({
  corner = "bottom-left",
  triggerClassName = "",
  open: openControlled,
  onOpenChange,
  hideTrigger = false,
  hostControls = null,
  onEditLook = null,
}) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openControlled ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;
  const [s, setS] = useState(getAudioSettings());

  useEffect(() => subscribeAudio(setS), []);

  useEffect(() => {
    if (open) {
      primeAudio();
      setS(getAudioSettings());
    }
  }, [open]);

  const update = (patch) => {
    primeAudio();
    const next = { ...s, ...patch };
    setS(next);
    setAudioSettings(patch);
  };

  const pos =
    corner === "inline"
      ? ""
      : corner === "bottom-left"
      ? "bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))]"
      : corner === "bottom-right"
      ? "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]"
      : corner === "top-right"
      ? "top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]"
      : "top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))]";
  const positionClass = corner === "inline" ? "relative" : `fixed ${pos}`;

  const masterPct = Math.round(s.master * 100);
  const showQuestionControls = hostControls?.phase === "question";
  const showRevealControls = hostControls?.phase === "reveal";

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => {
            primeAudio();
            setOpen(true);
          }}
          title="Settings"
          className={`${positionClass} z-40 alkheelank-touch-target h-12 w-12 shrink-0 rounded-xl bg-surface-elevated/95 text-xl ring-1 ring-edge shadow-card backdrop-blur transition hover:bg-surface-muted ${triggerClassName}`}
        >
          ⚙️
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="k-settings-backdrop"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="k-settings-drawer"
            >
              <div className="k-settings-drawer__stripe" aria-hidden />
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-bold">{copy.settings.title}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 text-sm font-bold text-brand-mid transition hover:text-brand-end"
                >
                  {copy.settings.done}
                </button>
              </div>

              <section className="mt-8">
                <h3 className="alkheelank-label">Sound & vibe</h3>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="font-semibold text-ink-900">Mute everything</span>
                  <Toggle
                    on={s.muted}
                    onChange={(v) => update({ muted: v })}
                    ariaLabel={s.muted ? "Unmute all sound" : "Mute all sound"}
                  />
                </div>

                <div className={`mt-6 ${s.muted ? "pointer-events-none opacity-40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-ink-900">Master volume</label>
                    <span className="tabular-nums text-sm text-muted">{masterPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={masterPct}
                    onChange={(e) => update({ master: Number(e.target.value) / 100 })}
                    onMouseUp={() => sfx.tap()}
                    onTouchEnd={() => sfx.tap()}
                    className="alkheelank-range mt-2 w-full"
                  />

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-ink-900">🎵 Lobby music</span>
                      <p className="mt-0.5 text-xs text-muted">{copy.settings.lobbyMusicHint}</p>
                    </div>
                    <Toggle
                      on={s.music}
                      onChange={(v) => update({ music: v })}
                      ariaLabel={s.music ? "Turn lobby music off" : "Turn lobby music on"}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="font-semibold text-ink-900">🔔 Sound effects</span>
                    <Toggle
                      on={s.sfx}
                      onChange={(v) => {
                        update({ sfx: v });
                        if (v && !s.muted) setTimeout(() => sfx.correct(), 30);
                      }}
                      ariaLabel={s.sfx ? "Turn sound effects off" : "Turn sound effects on"}
                    />
                  </div>
                </div>
              </section>

              <section className="mt-8 border-t border-edge pt-6">
                <h3 className="alkheelank-label">{copy.settings.appearance}</h3>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{copy.settings.themeLabel}</p>
                    <p className="mt-0.5 text-sm text-muted">{copy.settings.themeHint}</p>
                  </div>
                  <ThemeToggle />
                </div>
              </section>

              {onEditLook && (
                <section className="mt-8 border-t border-edge pt-6">
                  <h3 className="alkheelank-label">Your avatar</h3>
                  <p className="mt-2 text-sm text-muted">{copy.player.editLookHint}</p>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.tap();
                      setOpen(false);
                      onEditLook();
                    }}
                    className="alkheelank-btn-primary mt-4 w-full py-3 text-base"
                  >
                    ✨ {copy.player.editLook}
                  </button>
                </section>
              )}

              {hostControls && (
                <section className="mt-8 border-t border-edge pt-6">
                  <h3 className="alkheelank-label">{copy.host.pacing.label}</h3>
                  <div className="mt-3 flex gap-1.5">
                    {PACING_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        title={opt.hint}
                        onClick={() => {
                          sfx.tap();
                          hostControls.onPacing?.(opt.id);
                        }}
                        className={`min-h-touch flex-1 rounded-xl px-2 py-2.5 text-sm font-bold ring-1 transition ${
                          hostControls.pacing === opt.id
                            ? "bg-brand-mid/15 ring-brand-mid text-brand-mid"
                            : "bg-surface-muted ring-edge text-muted hover:text-ink-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {showQuestionControls && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-edge pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          sfx.tap();
                          hostControls.paused ? hostControls.onResume?.() : hostControls.onPause?.();
                        }}
                        className="alkheelank-btn-ghost w-full py-3 text-base"
                      >
                        {hostControls.paused ? copy.host.resume : copy.host.pause}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.confirm?.();
                          hostControls.onSkipQuestion?.();
                        }}
                        className="alkheelank-btn-ghost w-full py-3 text-base"
                      >
                        {copy.host.skipResults}
                      </button>
                    </div>
                  )}

                  {showRevealControls && (
                    <div className="mt-4 border-t border-edge pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          sfx.tap();
                          hostControls.onSkipReveal?.();
                        }}
                        className="alkheelank-btn-ghost w-full py-3 text-base"
                      >
                        {copy.host.skipReveal}
                      </button>
                    </div>
                  )}
                </section>
              )}

              <p className="mt-auto pt-6 text-xs text-muted">
                Saved on this device — your ears will thank you next time.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Toggle({ on, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-8 min-h-touch w-14 shrink-0 items-center rounded-full transition ${
        on ? "bg-brand-gradient-2" : "bg-surface-muted"
      }`}
      aria-pressed={on}
      aria-label={ariaLabel}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-paper transition-all ${
          on ? "left-[calc(100%-1.75rem)]" : "left-1"
        }`}
      />
    </button>
  );
}
