import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Logo from "../Logo.jsx";
import Avatar from "../characters.jsx";
import { copy } from "../../lib/copy.js";
import { joinDisplayPath, joinQrUrl } from "../../lib/site.js";
import HostPregameShell, {
  PregameLogoButton,
  PregameSettingsTrigger,
  PregameStartButton,
} from "./HostPregameShell.jsx";

function formatLobbyPin(pinStr) {
  return `${pinStr.slice(0, 3)} ${pinStr.slice(3, 6)}`;
}

export default function LobbyView({ pin, quizMeta, players, mode, onStart, error, onOpenSettings }) {
  const pinStr = String(pin || "").padStart(6, "•");
  const joinUrl = joinQrUrl(pin);

  return (
    <HostPregameShell
      variant="lobby"
      headerLeft={
        <PregameLogoButton onClick={() => window.location.assign("/")}>
          <Logo />
        </PregameLogoButton>
      }
      headerRight={
        <>
          <div className="pregame-header__count">
            <p className="pregame-header__count-label">Players</p>
            <p className="pregame-header__count-value">{players.length}</p>
          </div>
          <PregameSettingsTrigger onClick={onOpenSettings} />
        </>
      }
      joinSlot={
        <>
          {quizMeta && (
            <div className="pregame-quiz-badge">
              {quizMeta.title} · {quizMeta.questionCount} questions
            </div>
          )}

          <div className="pregame-join-stage">
            <div className="pregame-join-panel-grid">
              <div className="pregame-join-panel__instructions">
                <p className="pregame-join-kicker">{copy.lobby.joinAt}</p>
                <p className="pregame-join-url">{joinDisplayPath()}</p>
                <p className="pregame-join-helper">
                  {copy.lobby.joinOr} <strong>{copy.lobby.joinQr}</strong>
                </p>
              </div>
              <div className="pregame-join-panel__separator" aria-hidden="true" />
              <div className="pregame-join-panel__pin">
                <p className="pregame-join-panel__pin-label">{copy.lobby.pinLabel}</p>
                <div className="pregame-join-panel__pin-glow">
                  <div className="pin-display-lobby pregame-join-panel__pin-number font-display alkheelank-gradient-text">
                    {formatLobbyPin(pinStr)}
                  </div>
                </div>
              </div>
              {pin && (
                <>
                  <div className="pregame-join-panel__separator" aria-hidden="true" />
                  <div className="pregame-join-panel__qr">
                    <QRCodeSVG
                      value={joinUrl}
                      size={160}
                      bgColor="#faf6f0"
                      fgColor="#1a1814"
                      level="M"
                      className="pregame-join-panel__qr-code"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {mode && (
            <p className="pregame-mode-badge">
              {mode === "teams" ? copy.lobby.modeTeams : copy.lobby.modeSolo}
            </p>
          )}
        </>
      }
      playersSlot={
        <>
          <p className="pregame-section-label">{copy.lobby.playersLabel}</p>
          {players.length === 0 ? (
            <p className="pregame-waiting-status" role="status" aria-live="polite">
              <span className="pregame-waiting-status__label alkheelank-wait-shimmer">{copy.lobby.waiting}</span>
              <span className="pregame-waiting-status__dots" aria-hidden="true">
                <span className="pregame-waiting-status__dot" />
                <span className="pregame-waiting-status__dot" />
                <span className="pregame-waiting-status__dot" />
              </span>
            </p>
          ) : (
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
          )}
        </>
      }
      footer={
        <>
          {error && <p className="pregame-cta-zone__error">{error}</p>}
          <PregameStartButton
            onClick={onStart}
            disabled={players.length === 0}
            helperText={players.length === 0 ? copy.lobby.emptyCta : null}
          >
            {copy.lobby.start}
          </PregameStartButton>
        </>
      }
    />
  );
}
