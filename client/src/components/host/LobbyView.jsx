import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Logo from "../Logo.jsx";
import Avatar from "../characters.jsx";
import SettingsPanel from "../SettingsPanel.jsx";
import { copy } from "../../lib/copy.js";
import { joinDisplayPath, joinQrUrl } from "../../lib/site.js";
import { sfx, isSoundOn, setSound, subscribeAudio } from "../../lib/sound.js";

// Festive scatter — squares in the four answer-shape hues + brand tones, kept
// faint and lobby-only so the global theme is untouched.
const CONFETTI = [
  { c: "#f43f5e", top: "8%", left: "6%", size: 26, rot: 18, dur: 7, delay: 0 },
  { c: "#0ea5e9", top: "16%", left: "88%", size: 20, rot: -12, dur: 8, delay: 0.6 },
  { c: "#f59e0b", top: "70%", left: "10%", size: 30, rot: 24, dur: 9, delay: 1.1 },
  { c: "#10b981", top: "78%", left: "84%", size: 22, rot: -20, dur: 7.5, delay: 0.3 },
  { c: "#e11d48", top: "42%", left: "4%", size: 16, rot: 8, dur: 6.5, delay: 1.4 },
  { c: "#d97706", top: "30%", left: "94%", size: 18, rot: -28, dur: 8.5, delay: 0.9 },
  { c: "#0ea5e9", top: "88%", left: "40%", size: 14, rot: 14, dur: 7, delay: 0.2 },
  { c: "#f59e0b", top: "12%", left: "46%", size: 18, rot: -16, dur: 9, delay: 1.7 },
  { c: "#10b981", top: "58%", left: "92%", size: 16, rot: 22, dur: 6.8, delay: 0.5 },
  { c: "#f43f5e", top: "64%", left: "30%", size: 12, rot: -10, dur: 8.2, delay: 1.2 },
  { c: "#d97706", top: "84%", left: "62%", size: 24, rot: 30, dur: 7.6, delay: 0.8 },
  { c: "#0ea5e9", top: "22%", left: "20%", size: 14, rot: -22, dur: 9.4, delay: 1.5 },
  { c: "#10b981", top: "6%", left: "70%", size: 16, rot: 12, dur: 7.1, delay: 0.4 },
  { c: "#f59e0b", top: "50%", left: "76%", size: 12, rot: -18, dur: 8.8, delay: 1.0 },
  { c: "#e11d48", top: "92%", left: "16%", size: 18, rot: 26, dur: 6.6, delay: 1.9 },
  { c: "#f43f5e", top: "36%", left: "60%", size: 10, rot: -14, dur: 9.1, delay: 0.7 },
];

function formatLobbyPin(pinStr) {
  return `${pinStr.slice(0, 3)} ${pinStr.slice(3, 6)}`;
}

const Icon = ({ children, ...props }) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...props}>
    {children}
  </svg>
);

const PersonIcon = () => (
  <Icon fill="currentColor">
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
  </Icon>
);
const SpeakerOnIcon = () => (
  <Icon fill="currentColor">
    <path d="M3 10v4a1 1 0 001 1h3l4 4V5L7 9H4a1 1 0 00-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.06A4.5 4.5 0 0016.5 12zM14 3.06v2.06A7 7 0 0119 12a7 7 0 01-5 6.88v2.06A9 9 0 0021 12a9 9 0 00-7-8.94z" />
  </Icon>
);
const SpeakerOffIcon = () => (
  <Icon>
    <path fill="currentColor" d="M3 10v4a1 1 0 001 1h3l4 4V5L7 9H4a1 1 0 00-1 1z" />
    <path
      d="M16 9l5 6m0-6l-5 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Icon>
);
const GearIcon = () => (
  <Icon fill="currentColor">
    <path d="M19.14 12.94a7.49 7.49 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.61-.22l-2.39.96a7.3 7.3 0 00-1.62-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.58.24-1.12.56-1.62.94l-2.39-.96a.5.5 0 00-.61.22L2.7 8.84a.5.5 0 00.12.64l2.03 1.58a7.49 7.49 0 000 1.88l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.61.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.58-.24 1.12-.56 1.62-.94l2.39.96a.5.5 0 00.61-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
  </Icon>
);
const LockClosedIcon = () => (
  <Icon fill="currentColor">
    <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 116 0v3z" />
  </Icon>
);
const LockOpenIcon = () => (
  <Icon fill="currentColor">
    <path d="M18 8h-1V6A5 5 0 008.11 4a1 1 0 101.68 1.08A3 3 0 0115 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4z" />
  </Icon>
);
const CloseIcon = () => (
  <Icon fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export default function LobbyView({ pin, quizMeta, players, mode, onStart, onClose, error }) {
  const pinStr = String(pin || "").padStart(6, "•");
  const joinUrl = joinQrUrl(pin);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundOn());
  const hasPlayers = players.length > 0;

  useEffect(() => subscribeAudio((s) => setSoundOn(!s.muted)), []);

  const handleStart = () => {
    if (!hasPlayers) return;
    onStart?.();
  };

  return (
    <div className="lobby-stage">
      <div className="lobby-confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="lobby-confetti__chip"
            style={{
              top: c.top,
              left: c.left,
              width: c.size,
              height: c.size,
              backgroundColor: c.c,
              "--rot": `${c.rot}deg`,
              "--dur": `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      <button type="button" className="lobby-close" onClick={onClose} aria-label="Close lobby">
        <CloseIcon />
      </button>

      <div className="lobby-header-card">
        <div className="lobby-header-card__main">
          <div className="lobby-header-card__cell">
            <span className="lobby-header-card__label">{copy.lobby.joinAt}</span>
            <span className="lobby-header-card__url">{joinDisplayPath()}</span>
          </div>
          <span className="lobby-header-card__slash" aria-hidden="true" />
          <div className="lobby-header-card__cell">
            <span className="lobby-header-card__label">{copy.lobby.pinLabel}</span>
            <span className="lobby-header-card__pin pin-display">
              {formatLobbyPin(pinStr)}
            </span>
          </div>
        </div>
        <div className="lobby-header-card__qr" aria-label="Scan to join">
          <QRCodeSVG value={joinUrl} size={112} bgColor="#faf6f0" fgColor="#1a1814" level="M" />
        </div>
      </div>

      <div className="lobby-center">
        <Logo size="lg" />

        <div className="lobby-control-row">
          <span className="lobby-status-pill">
            {hasPlayers
              ? `${players.length} ${players.length === 1 ? "player" : "players"} in the lobby`
              : copy.lobby.waiting}
          </span>
          <div className="lobby-actions">
            <button
              type="button"
              className="lobby-lock"
              onClick={() => {
                sfx.lock();
                setLocked((v) => !v);
              }}
              aria-pressed={locked}
              aria-label={locked ? "Unlock game" : "Lock game"}
              title={locked ? "Locked" : "Unlocked"}
            >
              {locked ? <LockClosedIcon /> : <LockOpenIcon />}
            </button>
            <button
              type="button"
              className="lobby-start"
              onClick={handleStart}
              disabled={!hasPlayers}
            >
              {copy.lobby.start}
            </button>
          </div>
        </div>

        {quizMeta && (
          <p className="lobby-quiz">
            {quizMeta.title} · {quizMeta.questionCount} questions
            {mode ? ` · ${mode === "teams" ? copy.lobby.modeTeams : copy.lobby.modeSolo}` : ""}
          </p>
        )}

        {hasPlayers && (
          <div className="lobby-players">
            <div className="pregame-player-chips">
              <AnimatePresence>
                {players.map((p, i) => (
                  <motion.span
                    key={p.pid ?? p.id ?? `${p.nick}-${i}`}
                    layout
                    initial={{ scale: 0, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="pregame-player-chip"
                  >
                    <Avatar config={p.character} size={36} ring />
                    {p.nick}
                    {mode === "teams" && p.team?.name && (
                      <span
                        className="pregame-player-chip__team"
                        style={{ backgroundColor: `${p.team.color}33`, color: p.team.color }}
                      >
                        {p.team.name}
                      </span>
                    )}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {error && <p className="lobby-error">{error}</p>}
        {!hasPlayers && !error && <p className="lobby-helper">{copy.lobby.emptyCta}</p>}
      </div>

      <div className="lobby-utilbar">
        <span className="lobby-utilbar__count" title="Players in lobby">
          <PersonIcon />
          {players.length}
        </span>
        <button
          type="button"
          className="lobby-utilbar__btn"
          onClick={() => {
            sfx.tap();
            setSound(!soundOn);
          }}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute audio" : "Unmute audio"}
        >
          {soundOn ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
        </button>
        <button
          type="button"
          className="lobby-utilbar__btn"
          onClick={() => {
            sfx.tap();
            setSettingsOpen(true);
          }}
          aria-label="Settings"
        >
          <GearIcon />
        </button>
      </div>

      <SettingsPanel hideTrigger open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
