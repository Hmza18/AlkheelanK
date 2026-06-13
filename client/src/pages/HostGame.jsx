import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket, ensureConnected, wakeServer, connectSocket, emitWithAck, formatConnectError } from "../socket.js";
import { sfx, music } from "../lib/sound.js";
import Recap from "../components/Recap.jsx";
import { logGame } from "../lib/db.js";
import { useAuth } from "../lib/auth.jsx";
import AnswerTile from "../components/AnswerTile.jsx";
import Timer, { TimerStrip } from "../components/Timer.jsx";
import ScrollHint from "../components/ScrollHint.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import Leaderboard from "../components/Leaderboard.jsx";
import Standings from "../components/Standings.jsx";
import Podium from "../components/Podium.jsx";
import SocialReveal, { revealStageName } from "../components/SocialReveal.jsx";
import HostChrome from "../components/HostChrome.jsx";
import PhaseShell from "../components/PhaseShell.jsx";
import SetupView from "../components/host/SetupView.jsx";
import ConnectingView from "../components/host/ConnectingView.jsx";
import LobbyView from "../components/host/LobbyView.jsx";
import { HostRecoveredBanner, HostStatusBanner } from "../components/ConnectionBanner.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import DoublePointsWarning from "../components/DoublePointsWarning.jsx";
import Countdown from "../components/Countdown.jsx";
import { copy } from "../lib/copy.js";
import { questionIntro } from "../lib/motion.js";
import { saveHostSession, loadHostSession, clearHostSession } from "../lib/hostSession.js";
import { tileStyle } from "../lib/answers.js";

function statusToPhase(status, state) {
  const map = {
    lobby: "lobby",
    countdown: "countdown",
    question: "question",
    "double-warning": "double-warning",
    reveal: "reveal",
    standings: "standings",
    ended: state?.final ? "final" : "ended",
  };
  return map[status] || "lobby";
}

const DEFAULT_SETTINGS = {
  mode: "solo",
  teamPreset: "kidsAdults",
  music: true,
  randomizeQuestions: false,
  randomizeAnswers: false,
  speedScoring: true,
  pacing: "normal",
};

export default function HostGame({ launch, onExit }) {
  const resumeOnly = Boolean(launch?.reconnect);
  const { user } = useAuth();
  const [phase, setPhase] = useState("setup");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pin, setPin] = useState(null);
  const [quizMeta, setQuizMeta] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [images, setImages] = useState({});
  const [answerCount, setAnswerCount] = useState({ answered: 0, total: 0 });
  const [reveal, setReveal] = useState(null);
  const [standings, setStandings] = useState(null);
  const [final, setFinal] = useState(null);
  const [endedReason, setEndedReason] = useState(null);
  const [hostError, setHostError] = useState(null);
  const [paused, setPaused] = useState(false);
  const [revealStage, setRevealStage] = useState(null);
  const [hostRecovered, setHostRecovered] = useState(false);
  const [hostConnected, setHostConnected] = useState(true);
  const [connectHint, setConnectHint] = useState(copy.connecting.server);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [doubleWarning, setDoubleWarning] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [lobbyLocked, setLobbyLocked] = useState(false);
  const loggedRef = useRef(false);
  const hostTokenRef = useRef(null);
  const pinRef = useRef(null);
  const wasHostDisconnectRef = useRef(false);

  useEffect(() => {
    if (phase === "lobby" && settings.music) music.start();
    else music.stop();
    return () => music.stop();
  }, [phase, settings.music]);

  useEffect(() => {
    wakeServer();
    ensureConnected();
  }, []);

  useEffect(() => {
    if (phase !== "connecting") return;
    setConnectHint(copy.connecting.server);
    const t1 = setTimeout(() => setConnectHint(copy.connecting.waking), 4000);
    const t2 = setTimeout(() => setConnectHint(copy.connecting.slow), 15000);
    const t3 = setTimeout(() => setConnectHint(copy.connecting.verySlow), 35000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  useEffect(() => {
    ensureConnected();
    const onConnect = async () => {
      if (!hostTokenRef.current || !pinRef.current) return;
      try {
        await emitWithAck(
          "host:reconnect",
          { pin: pinRef.current, hostToken: hostTokenRef.current },
          15_000,
        );
        if (wasHostDisconnectRef.current) {
          setHostRecovered(true);
          setTimeout(() => setHostRecovered(false), 4000);
        }
      } catch (err) {
        setHostError(formatConnectError(err) || "Could not restore session. Start a new game?");
      }
    };
    const onCreated = ({ pin, hostToken, quiz, settings: s }) => {
      setPin(pin);
      pinRef.current = pin;
      hostTokenRef.current = hostToken;
      saveHostSession({ pin, hostToken });
      setQuizMeta(quiz);
      if (s) setSettings(s);
      setHostError(null);
      setLobbyLocked(false);
      setPhase("lobby");
    };
    const onState = (state) => {
      setPin(state.pin);
      pinRef.current = state.pin;
      hostTokenRef.current = state.hostToken;
      saveHostSession({ pin: state.pin, hostToken: state.hostToken });
      setQuizMeta(state.quiz);
      if (state.settings) setSettings(state.settings);
      setPlayers(state.players || []);
      setAnswerCount(state.answerCount || { answered: 0, total: 0 });
      setPaused(!!state.paused);
      if (state.question) setQuestion(state.question);
      if (state.reveal) {
        setReveal(state.reveal);
        setRevealStage(revealStageName(state.reveal.revealStage ?? 0));
      }
      if (state.standings) setStandings(state.standings);
      if (state.final) setFinal(state.final);
      if (state.doubleWarning) setDoubleWarning(state.doubleWarning);
      else if (state.status !== "double-warning") setDoubleWarning(null);
      if (state.countdown) setCountdown(state.countdown);
      setLobbyLocked(!!state.lobbyLocked);
      setHostConnected(true);
      wasHostDisconnectRef.current = false;
      setPhase(statusToPhase(state.status, state));
    };
    const onPlayers = (list) => setPlayers((prev) => {
      if (list.length > prev.length) sfx.join();
      return list;
    });
    const onDoublePointsWarning = (warning) => {
      setDoubleWarning(warning);
      setReveal(null);
      setStandings(null);
      setPhase("double-warning");
      sfx.moment();
    };
    const onCountdown = (c) => {
      setCountdown(c);
      setReveal(null);
      setStandings(null);
      setPhase("countdown");
    };
    const onQuestion = (q) => {
      setQuestion(q);
      setDoubleWarning(null);
      setReveal(null);
      setStandings(null);
      setPaused(!!q.paused);
      setAnswerCount((c) => ({ answered: 0, total: c.total }));
      setPhase("question");
    };
    const onQuestionImage = ({ index, image }) => setImages((m) => ({ ...m, [index]: image }));
    const onAnswerCount = (c) => setAnswerCount(c);
    const onReveal = (r) => {
      setReveal(r);
      setRevealStage("bars");
      setPaused(false);
      setPhase("reveal");
      sfx.reveal();
    };
    const onRevealStage = ({ revealStage: rs }) => {
      setRevealStage(revealStageName(rs ?? 0));
    };
    const onSettings = ({ settings: s }) => {
      if (s) setSettings(s);
    };
    const onStandings = (s) => {
      setStandings(s);
      setPhase("standings");
    };
    const onPaused = () => setPaused(true);
    const onResumed = ({ startedAt }) => {
      setPaused(false);
      setQuestion((q) => (q ? { ...q, startedAt } : q));
    };
    const onFinal = (f) => {
      setFinal(f);
      setPhase("final");
      if (user && !loggedRef.current) {
        loggedRef.current = true;
        logGame(user.id, {
          quizTitle: f.title,
          playerCount: f.standings?.length || 0,
          winner: f.mode === "teams" ? f.teamPodium?.[0]?.name || null : f.podium?.[0]?.nick || null,
        });
      }
    };
    const onLobbyLock = ({ locked }) => setLobbyLocked(!!locked);
    const onError = ({ message }) => setHostError(message);
    const onEnded = ({ reason }) => {
      hostTokenRef.current = null;
      clearHostSession();
      setEndedReason(reason || "Game ended.");
      setPhase("ended");
    };

    // Must be a named function so cleanup can remove only THIS handler.
    // socket.off("disconnect") without a reference removes ALL disconnect
    // listeners on the shared socket singleton, breaking reconnect in every
    // other component that also listens to it.
    const onDisconnect = () => {
      wasHostDisconnectRef.current = true;
      setHostConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("host:created", onCreated);
    socket.on("host:state", onState);
    socket.on("game:players", onPlayers);
    socket.on("game:countdown", onCountdown);
    socket.on("game:doublePointsWarning", onDoublePointsWarning);
    socket.on("game:question", onQuestion);
    socket.on("host:questionImage", onQuestionImage);
    socket.on("host:answerCount", onAnswerCount);
    socket.on("game:reveal", onReveal);
    socket.on("game:standings", onStandings);
    socket.on("game:paused", onPaused);
    socket.on("game:resumed", onResumed);
    socket.on("host:final", onFinal);
    socket.on("game:lobbyLock", onLobbyLock);
    socket.on("host:error", onError);
    socket.on("game:ended", onEnded);
    socket.on("game:revealStage", onRevealStage);
    socket.on("game:settings", onSettings);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("host:created", onCreated);
      socket.off("host:state", onState);
      socket.off("game:players", onPlayers);
      socket.off("game:countdown", onCountdown);
      socket.off("game:doublePointsWarning", onDoublePointsWarning);
      socket.off("game:question", onQuestion);
      socket.off("host:questionImage", onQuestionImage);
      socket.off("host:answerCount", onAnswerCount);
      socket.off("game:reveal", onReveal);
      socket.off("game:standings", onStandings);
      socket.off("game:paused", onPaused);
      socket.off("game:resumed", onResumed);
      socket.off("host:final", onFinal);
      socket.off("game:lobbyLock", onLobbyLock);
      socket.off("host:error", onError);
      socket.off("game:ended", onEnded);
      socket.off("game:revealStage", onRevealStage);
      socket.off("game:settings", onSettings);
      socket.off("disconnect", onDisconnect);
    };
  }, [user]);

  useEffect(() => {
    setAnswerCount((c) => ({ ...c, total: players.filter((p) => p.connected !== false).length }));
  }, [players]);

  const createLobby = async () => {
    if (creatingRoom) return;
    setCreatingRoom(true);
    setPhase("connecting");
    setHostError(null);
    setConnectHint(copy.connecting.server);
    try {
      await wakeServer();
      setConnectHint(copy.connecting.server);
      await connectSocket({ timeoutMs: 45_000 });

      const saved = loadHostSession();
      if (saved?.pin && saved?.hostToken) {
        setConnectHint(copy.connecting.restoring);
        try {
          const state = await emitWithAck(
            "host:reconnect",
            { pin: saved.pin, hostToken: saved.hostToken },
            15_000,
          );
          pinRef.current = state.pin;
          hostTokenRef.current = state.hostToken;
          setPin(state.pin);
          if (state.settings) setSettings(state.settings);
          setQuizMeta(state.quiz);
          setPlayers(state.players || []);
          setAnswerCount(state.answerCount || { answered: 0, total: 0 });
          setPaused(!!state.paused);
          if (state.question) setQuestion(state.question);
          if (state.reveal) {
            setReveal(state.reveal);
            setRevealStage(revealStageName(state.reveal.revealStage ?? 0));
          }
          if (state.standings) setStandings(state.standings);
          if (state.final) setFinal(state.final);
          if (state.doubleWarning) setDoubleWarning(state.doubleWarning);
          if (state.countdown) setCountdown(state.countdown);
          setLobbyLocked(!!state.lobbyLocked);
          setPhase(statusToPhase(state.status, state));
          setCreatingRoom(false);
          return;
        } catch {
          clearHostSession();
          if (resumeOnly) {
            setHostError("Couldn't restore your game — it may have ended.");
            setCreatingRoom(false);
            return;
          }
          setHostError("Couldn't restore your previous session. Starting a new game.");
        }
      } else if (resumeOnly) {
        setHostError("Couldn't restore your game — it may have ended.");
        setCreatingRoom(false);
        return;
      }

      setConnectHint(copy.connecting.creating);
      await emitWithAck("host:create", { quizId: launch?.quizId, quiz: launch?.quiz, settings }, 15_000);
      // host:created moves us to lobby; ack is a backstop if that event was missed.
      setPhase((p) => (p === "connecting" ? "lobby" : p));
    } catch (err) {
      setHostError(formatConnectError(err));
    } finally {
      setCreatingRoom(false);
    }
  };

  const currentImage = question ? question.image ?? images[question.index] ?? null : null;

  // What's about to be launched — shown on the setup screen before the room exists.
  const launchQuizMeta =
    launch?.quizMeta ??
    (launch?.quiz
      ? { title: launch.quiz.title, questionCount: launch.quiz.questions?.length ?? 0 }
      : null);

  useEffect(() => {
    if (resumeOnly) createLobby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeOnly]);

  return (
    <div className="min-h-screen">
      <HostRecoveredBanner show={hostRecovered} />
      <HostStatusBanner connected={hostConnected} />
      <PhaseShell phaseKey={phase} className="min-h-screen landscapePhone:h-dvh landscapePhone:max-h-dvh landscapePhone:min-h-0 landscapePhone:overflow-y-auto landscapePhone:pt-9">
        {phase === "setup" && (
          <SetupView
            quiz={launchQuizMeta}
            settings={settings}
            setSettings={setSettings}
            onCreate={createLobby}
            onCancel={onExit}
          />
        )}
        {phase === "connecting" && (
          <ConnectingView
            connectHint={connectHint}
            hostError={hostError}
            onRetry={createLobby}
            onBack={() => {
              setHostError(null);
              setPhase("setup");
            }}
            onCancel={() => setPhase("setup")}
          />
        )}
        {phase === "lobby" && (
          <LobbyView
            pin={pin}
            quizMeta={quizMeta}
            players={players}
            mode={settings.mode}
            lobbyLocked={lobbyLocked}
            onToggleLock={() => {
              sfx.lock();
              socket.emit("host:lockLobby", { locked: !lobbyLocked });
            }}
            onKickPlayer={(pid) => socket.emit("host:kickPlayer", { pid })}
            onStart={() => {
              sfx.confirm();
              socket.emit("host:start");
            }}
            onClose={() => setConfirmAction("closeLobby")}
            error={hostError}
          />
        )}
        {phase === "countdown" && <Countdown countdown={countdown} variant="host" />}
        {phase === "double-warning" && (
          <DoublePointsWarning warning={doubleWarning} variant="host" />
        )}
        {phase === "question" && question && (
          <QuestionView
            question={question}
            image={currentImage}
            answerCount={answerCount}
            paused={paused}
          />
        )}
        {phase === "reveal" && reveal && question && (
          <SocialReveal
            question={question}
            image={currentImage}
            reveal={reveal}
            externalStage={revealStage}
            onStandings={() => {
              sfx.transition();
              socket.emit("host:standings");
            }}
          />
        )}
        {phase === "standings" && standings && (
          <StandingsView standings={standings} onNext={() => {
            sfx.transition();
            socket.emit("host:next");
          }} />
        )}
        {phase === "final" && final && <FinalView final={final} onHome={onExit} />}
        {phase === "ended" && (
          <Centered>
            <h2 className="alkheelank-heading text-4xl">{copy.ended.title}</h2>
            <p className="mt-3 text-muted">{endedReason}</p>
            <button onClick={onExit} className="alkheelank-btn-primary mt-8">Back to dashboard</button>
          </Centered>
        )}
      </PhaseShell>
      {/* Lobby owns its own chrome (close, utility bar, settings) to match the
          board layout, so suppress the global host chrome during that phase. */}
      {phase !== "lobby" && (
      <HostChrome
        phase={phase}
        pacing={settings.pacing || "normal"}
        paused={paused}
        hostError={hostError}
        onDismissError={() => setHostError(null)}
        onPacing={(p) => socket.emit("host:setPacing", { pacing: p })}
        onPause={() => socket.emit("host:pause")}
        onResume={() => socket.emit("host:resume")}
        onSkipQuestion={() => socket.emit("host:closeQuestion")}
        onSkipReveal={() => socket.emit("host:advanceReveal")}
        endLabel={copy.host.endConfirm}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        onEndGame={() => setConfirmAction("endGame")}
      />
      )}

      {confirmAction === "closeLobby" && (
        <ConfirmModal
          title="Close lobby?"
          message="Close this lobby for everyone? Players will be disconnected."
          confirmLabel="Close lobby"
          cancelLabel="Keep open"
          destructive
          onConfirm={() => {
            setConfirmAction(null);
            socket.emit("host:end");
            onExit();
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "endGame" && (
        <ConfirmModal
          title="End game?"
          message="End this game for everyone? This cannot be undone."
          confirmLabel="End game"
          cancelLabel="Keep playing"
          destructive
          onConfirm={() => {
            setConfirmAction(null);
            socket.emit("host:end");
            onExit();
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="host-phase-fill flex min-h-[80dvh] flex-col items-center justify-center text-center landscapePhone:min-h-0">
      {children}
    </div>
  );
}

const TYPE_LABEL = {
  tf: "True / False",
  ms: "Pick all that apply",
  type: "Type answer",
  puzzle: "Put in order",
};

function QuestionView({ question, image, answerCount, paused }) {
  const isTF = question.type === "tf";
  const typeLabel = TYPE_LABEL[question.type];
  const isType = question.type === "type";
  useEffect(() => {
    if (!question?.startedAt || paused) return;
    const timer = setInterval(() => {
      const rem = question.timeLimit - (Date.now() - question.startedAt) / 1000;
      const pct = Math.max(0, Math.min(1, rem / question.timeLimit));
      music.setTension?.(pct < 0.2 ? 1 : pct < 0.45 ? 0.6 : pct < 0.7 ? 0.25 : 0);
    }, 200);
    return () => {
      clearInterval(timer);
      music.setTension?.(0);
    };
  }, [question?.startedAt, question?.timeLimit, paused]);
  return (
    <QuestionScreen
      variant="host"
      questionType={question.type}
      questionKey={question.index}
      promptTag="h1"
      header={
        <div className="host-meta">
          <span className="host-meta__index">
            <span className="host-meta__index-now">{question.index + 1}</span>
            <span className="host-meta__index-sep">/</span>
            <span className="host-meta__index-total">{question.total}</span>
          </span>
          {typeLabel && <span className="host-meta__chip">{typeLabel}</span>}
          <span className="host-meta__answered">
            <span className="host-meta__pulse" aria-hidden />
            <span className="host-meta__answered-count">{answerCount.answered}</span>
            {answerCount.total > 0 && (
              <span className="host-meta__answered-total">/ {answerCount.total}</span>
            )}
            <span className="host-meta__answered-label">answered</span>
          </span>
        </div>
      }
      progress={
        answerCount.total > 0 ? (
          <div
            className="host-answer-progress"
            role="progressbar"
            aria-label="Players answered"
            aria-valuemin={0}
            aria-valuemax={answerCount.total}
            aria-valuenow={answerCount.answered}
          >
            <div
              className="host-answer-progress__fill"
              style={{ width: `${Math.round((answerCount.answered / answerCount.total) * 100)}%` }}
            />
          </div>
        ) : null
      }
      badge={
        question.doublePoints ? (
          <div className="mx-auto mt-2 inline-flex shrink-0 animate-pulse items-center gap-2 rounded-full bg-brand-mid/15 px-4 py-1.5 text-base font-extrabold text-brand-mid ring-1 ring-brand-mid/30">
            ⚡ {copy.reveal.doublePoints}
          </div>
        ) : question.points === "none" ? (
          <div className="mx-auto mt-2 inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-muted px-4 py-1.5 text-base font-extrabold text-muted ring-1 ring-edge">
            🎈 Just for fun
          </div>
        ) : null
      }
      prompt={question.question}
      image={image}
      animateImage
      timer={
        <>
          <div className="question-screen__timer-full">
            <Timer timeLimit={question.timeLimit} startedAt={question.startedAt} paused={paused} sound />
          </div>
          <div className="question-screen__timer-compact">
            <Timer timeLimit={question.timeLimit} startedAt={question.startedAt} paused={paused} sound size={48} />
          </div>
        </>
      }
      timerStrip={
        <TimerStrip
          timeLimit={question.timeLimit}
          startedAt={question.startedAt}
          paused={paused}
          introDelay={questionIntro.timer}
        />
      }
      answers={
        isType ? (
          <div className="grid w-full place-items-center rounded-3xl bg-surface-elevated px-6 py-10 ring-1 ring-edge">
            <span className="text-5xl">⌨️</span>
            <p className="mt-3 alkheelank-heading text-2xl text-muted">Players type their answer on their phones</p>
          </div>
        ) : (
          question.answers.map((a, i) => (
            <AnswerTile
              key={i}
              index={i}
              type={question.type === "ms" || question.type === "puzzle" ? "mc" : question.type}
              text={a.text}
              disabled
              big
              compact
              staggerIndex={i}
              entranceDelay={questionIntro.tiles}
            />
          ))
        )
      }
      notice={
        paused ? (
          <p className="mt-2 shrink-0 text-center text-lg font-bold text-warning">⏸ Round paused — use show controls to resume</p>
        ) : null
      }
    />
  );
}

function StandingsView({ standings, onNext }) {
  return (
    <div className="host-phase-fill alkheelank-screen-host mx-auto flex min-h-0 max-w-4xl flex-col overflow-x-hidden">
      <div className="text-center landscapePhone:shrink-0">
        <p className="alkheelank-label tracking-[0.3em] landscapePhone:tracking-widest landscapePhone:text-[10px]">{copy.standings.subtitle(standings.index, standings.total)}</p>
        <h1 className="mt-2 alkheelank-heading text-4xl alkheelank-gradient-text landscapePhone:mt-1 landscapePhone:text-2xl">{copy.standings.title}</h1>
      </div>
      {standings.funStat && <div className="mx-auto mt-4 rounded-full bg-surface-elevated px-5 py-2 text-center ring-1 ring-edge landscapePhone:mt-2 landscapePhone:px-3 landscapePhone:py-1 landscapePhone:text-sm"><span className="font-bold text-ink-900">{standings.funStat.title}:</span> <span className="text-muted">{standings.funStat.subtitle}</span></div>}
      {standings.mode === "teams" && standings.teamStandings?.length > 0 && (
        <div className="mt-8 landscapePhone:mt-3">
          <h3 className="mb-3 text-center alkheelank-heading text-2xl text-muted landscapePhone:mb-1 landscapePhone:text-lg">{copy.standings.teamRace}</h3>
          <div className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
            {standings.teamStandings.map((t) => (
              <div key={t.id} className="rounded-xl bg-surface-elevated px-4 py-3 ring-1 ring-edge">
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: t.color }}>{t.rank}. {t.name}</span>
                  <span className="font-display text-2xl tabular-nums">{t.score.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{t.members.slice(0, 3).map((m) => `${m.nick} ${m.score}`).join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto overflow-x-hidden landscapePhone:mt-2"><Standings standings={standings.standings} max={8} compactLandscape /><ScrollHint /></div>
      <div className="sticky bottom-6 mt-10 flex shrink-0 justify-center landscapePhone:bottom-2 landscapePhone:mt-3">
        <button onClick={onNext} className="alkheelank-btn-primary px-16 text-2xl landscapePhone:px-8 landscapePhone:py-3 landscapePhone:text-lg">
          {standings.hasNext ? `${copy.host.nextQuestion} →` : `${copy.host.finalResults} 🏆`}
        </button>
      </div>
    </div>
  );
}

function FinalView({ final, onHome }) {
  const [showList, setShowList] = useState(false);
  const [view, setView] = useState("podium"); // podium | recap | breakdown

  if (view === "breakdown") {
    return (
      <QuestionBreakdownView
        breakdown={final.questionBreakdown || []}
        onBack={() => setView("podium")}
        onHome={onHome}
      />
    );
  }

  if (view === "recap") {
    return (
      <div className="host-phase-fill alkheelank-screen-host mx-auto flex min-h-0 max-w-5xl flex-col items-center justify-center py-10 landscapePhone:py-4">
        <Recap recap={final.recap} title={final.title} standings={final.standings} />
        <p className="mt-4 text-center text-sm text-muted">📸 {copy.final.recapHint}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => setView("podium")} className="alkheelank-btn-ghost px-8">← Podium</button>
          <button onClick={onHome} className="alkheelank-btn-primary px-8">Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="host-phase-fill alkheelank-screen-host mx-auto flex min-h-0 max-w-5xl flex-col items-center justify-center overflow-x-hidden overflow-y-auto py-10 landscapePhone:py-3">
      <h1 className="shrink-0 alkheelank-heading text-5xl alkheelank-gradient-text landscapePhone:text-2xl sm:text-7xl landscapePhone:sm:text-2xl">{copy.final.title}</h1>
      <p className="mt-2 shrink-0 text-muted landscapePhone:mt-1 landscapePhone:text-sm">{final.title}</p>
      {final.mode === "teams" && final.teamPodium?.length > 0 ? (
        <TeamPodium teams={final.teamPodium} onComplete={() => setShowList(true)} />
      ) : (
        <div className="mt-12 w-full shrink-0 landscapePhone:mt-3"><Podium podium={final.podium} onComplete={() => setShowList(true)} /></div>
      )}
      <AnimatePresence>
        {showList && final.standings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-14 w-full max-w-2xl landscapePhone:mt-4">
            <h3 className="mb-4 text-center alkheelank-heading text-2xl text-muted landscapePhone:mb-2 landscapePhone:text-lg">{final.mode === "teams" ? copy.final.topContributors : copy.final.podiumRest}</h3>
            <Leaderboard entries={final.mode === "teams" ? final.standings.slice(0, 10) : final.standings.slice(3)} max={10} />
          </motion.div>
        )}
      </AnimatePresence>
      <ScrollHint />
      <div className="mt-12 flex shrink-0 flex-wrap justify-center gap-3 landscapePhone:mt-4 landscapePhone:gap-2">
        <button onClick={() => setView("recap")} className="alkheelank-btn-primary px-10 text-lg landscapePhone:px-6 landscapePhone:py-2 landscapePhone:text-base">🎉 {copy.final.recapCta}</button>
        {final.questionBreakdown?.length > 0 && (
          <button onClick={() => setView("breakdown")} className="alkheelank-btn-ghost px-8 landscapePhone:px-5 landscapePhone:py-2 landscapePhone:text-sm">📊 Question breakdown</button>
        )}
        <button onClick={onHome} className="alkheelank-btn-ghost px-8 landscapePhone:px-5 landscapePhone:py-2 landscapePhone:text-sm">Back to dashboard</button>
      </div>
    </div>
  );
}

// Post-game per-question results: how the room answered each question, which
// options they picked, and which questions were hardest.
function QuestionBreakdownView({ breakdown, onBack, onHome }) {
  return (
    <div className="host-phase-fill alkheelank-screen-host mx-auto flex min-h-0 max-w-3xl flex-col py-10 landscapePhone:py-4">
      <div className="shrink-0 text-center">
        <h1 className="alkheelank-heading text-4xl alkheelank-gradient-text landscapePhone:text-2xl">Question breakdown</h1>
        <p className="mt-2 text-muted landscapePhone:mt-1 landscapePhone:text-sm">How the room did, question by question</p>
      </div>

      <div className="mt-8 min-h-0 flex-1 space-y-4 overflow-y-auto landscapePhone:mt-3">
        {breakdown.map((q) => {
          const pct = q.totalAnswers > 0 ? Math.round((q.correctCount / q.totalAnswers) * 100) : 0;
          const pctColor = pct >= 70 ? "text-tile-square" : pct >= 40 ? "text-tile-circle" : "text-tile-triangle";
          const maxCount = Math.max(1, ...q.counts);
          return (
            <div key={q.index} className="rounded-2xl bg-surface-elevated p-5 ring-1 ring-edge landscapePhone:p-3">
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-ink-900">
                  <span className="mr-2 text-muted">Q{q.index + 1}.</span>
                  {q.question}
                </p>
                <span className={`shrink-0 font-display text-2xl font-bold tabular-nums ${pctColor}`}>{pct}%</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {q.correctCount} of {q.totalAnswers} answered correctly
                {q.totalAnswers < q.totalPlayers && ` · ${q.totalPlayers - q.totalAnswers} didn't answer`}
              </p>
              {q.type === "type" ? (
                <div className="mt-3 text-sm text-muted">
                  Answer: <b className="text-ink-900">{(q.accept && q.accept[0]) || "—"}</b>
                  {q.accept?.length > 1 && <span> (also: {q.accept.slice(1).join(", ")})</span>}
                </div>
              ) : q.type === "puzzle" ? (
                <ol className="mt-3 space-y-1 text-sm">
                  {q.answers.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded bg-brand-mid/15 text-xs font-extrabold text-brand-mid">{i + 1}</span>
                      <span className="font-semibold text-ink-900">{a}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-3 space-y-1.5">
                  {q.answers.map((a, i) => {
                    const s = tileStyle(q.type === "ms" ? "mc" : q.type, i);
                    const isCorrect = Array.isArray(q.correctIndices)
                      ? q.correctIndices.includes(i)
                      : i === q.correctIndex;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-5 text-center" style={{ color: s.color }}>{s.glyph}</span>
                        <span className={`w-32 truncate sm:w-48 ${isCorrect ? "font-bold text-ink-900" : "text-muted"}`}>
                          {a}{isCorrect && " ✓"}
                        </span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(q.counts[i] / maxCount) * 100}%`,
                              backgroundColor: s.color,
                              opacity: isCorrect ? 1 : 0.45,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right tabular-nums text-muted">{q.counts[i]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <ScrollHint />
      </div>

      <div className="mt-6 flex shrink-0 flex-wrap justify-center gap-3 landscapePhone:mt-3">
        <button onClick={onBack} className="alkheelank-btn-ghost px-8">← Podium</button>
        <button onClick={onHome} className="alkheelank-btn-primary px-8">Back to dashboard</button>
      </div>
    </div>
  );
}

function TeamPodium({ teams, onComplete }) {
  useEffect(() => {
    const t = setTimeout(() => onComplete?.(), 1800);
    return () => clearTimeout(t);
  }, [onComplete]);
  return (
    <div className="mt-10 flex w-full max-w-3xl items-end justify-center gap-4 landscapePhone:mt-3 landscapePhone:gap-2">
      {teams.map((t, i) => (
        <motion.div key={t.id} initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.3 }} className="flex w-44 flex-col items-center landscapePhone:w-24 landscapePhone:sm:w-28">
          <div className="mb-3 text-center landscapePhone:mb-1"><p className="font-display text-2xl font-bold landscapePhone:text-sm" style={{ color: t.color }}>{t.name}</p><p className="text-3xl font-extrabold tabular-nums landscapePhone:text-lg">{t.score.toLocaleString()}</p></div>
          <div className={`w-full rounded-t-2xl grid place-items-start pt-3 font-display text-4xl font-bold text-ink-900 landscapePhone:rounded-t-xl landscapePhone:pt-1 landscapePhone:text-2xl ${i === 0 ? "h-52 landscapePhone:h-20" : i === 1 ? "h-44 landscapePhone:h-16" : "h-36 landscapePhone:h-14"}`} style={{ backgroundColor: t.color }}>{i + 1}</div>
        </motion.div>
      ))}
    </div>
  );
}
