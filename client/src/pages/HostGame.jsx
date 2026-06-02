import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { socket, ensureConnected, wakeServer, connectSocket, emitWithAck } from "../socket.js";
import { sfx, music } from "../lib/sound.js";
import SettingsPanel from "../components/SettingsPanel.jsx";
import Recap from "../components/Recap.jsx";
import { logGame } from "../lib/db.js";
import { useAuth } from "../lib/auth.jsx";
import Logo from "../components/Logo.jsx";
import AnswerTile from "../components/AnswerTile.jsx";
import Timer from "../components/Timer.jsx";
import Leaderboard from "../components/Leaderboard.jsx";
import Standings from "../components/Standings.jsx";
import Podium from "../components/Podium.jsx";
import Avatar from "../components/characters.jsx";
import SocialReveal, { revealStageName } from "../components/SocialReveal.jsx";
import HostControlDeck from "../components/HostControlDeck.jsx";
import PhaseShell from "../components/PhaseShell.jsx";
import { HostRecoveredBanner, HostStatusBanner } from "../components/ConnectionBanner.jsx";
import { copy } from "../lib/copy.js";

const DEFAULT_SETTINGS = {
  mode: "solo",
  teamPreset: "kidsAdults",
  music: true,
  randomizeQuestions: false,
  randomizeAnswers: false,
  speedScoring: true,
  pacing: "normal",
};

const TEAM_PRESET_LABELS = {
  kidsAdults: "Kids vs Adults",
  colorClash: "Color Clash",
};

export default function HostGame({ launch, onExit }) {
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
    const onConnect = () => {
      if (hostTokenRef.current && pinRef.current) {
        socket.emit("host:reconnect", { pin: pinRef.current, hostToken: hostTokenRef.current });
        if (wasHostDisconnectRef.current) {
          setHostRecovered(true);
          setTimeout(() => setHostRecovered(false), 4000);
        }
      }
    };
    const onCreated = ({ pin, hostToken, quiz, settings: s }) => {
      setPin(pin);
      pinRef.current = pin;
      hostTokenRef.current = hostToken;
      setQuizMeta(quiz);
      if (s) setSettings(s);
      setHostError(null);
      setPhase("lobby");
    };
    const onState = (state) => {
      setPin(state.pin);
      pinRef.current = state.pin;
      hostTokenRef.current = state.hostToken;
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
      setHostConnected(true);
      wasHostDisconnectRef.current = false;
      const map = {
        lobby: "lobby",
        question: "question",
        reveal: "reveal",
        standings: "standings",
        ended: state.final ? "final" : "ended",
      };
      setPhase(map[state.status] || "lobby");
    };
    const onPlayers = (list) => setPlayers((prev) => {
      if (list.length > prev.length) sfx.join();
      return list;
    });
    const onQuestion = (q) => {
      setQuestion(q);
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
    const onError = ({ message }) => setHostError(message);
    const onEnded = ({ reason }) => {
      hostTokenRef.current = null;
      setEndedReason(reason || "Game ended.");
      setPhase("ended");
    };

    socket.on("connect", onConnect);
    socket.on("host:created", onCreated);
    socket.on("host:state", onState);
    socket.on("game:players", onPlayers);
    socket.on("game:question", onQuestion);
    socket.on("host:questionImage", onQuestionImage);
    socket.on("host:answerCount", onAnswerCount);
    socket.on("game:reveal", onReveal);
    socket.on("game:standings", onStandings);
    socket.on("game:paused", onPaused);
    socket.on("game:resumed", onResumed);
    socket.on("game:final", onFinal);
    socket.on("host:error", onError);
    socket.on("game:ended", onEnded);
    socket.on("game:revealStage", onRevealStage);
    socket.on("game:settings", onSettings);
    socket.on("disconnect", () => {
      wasHostDisconnectRef.current = true;
      setHostConnected(false);
    });
    return () => {
      socket.off("connect", onConnect);
      socket.off("host:created", onCreated);
      socket.off("host:state", onState);
      socket.off("game:players", onPlayers);
      socket.off("game:question", onQuestion);
      socket.off("host:questionImage", onQuestionImage);
      socket.off("host:answerCount", onAnswerCount);
      socket.off("game:reveal", onReveal);
      socket.off("game:standings", onStandings);
      socket.off("game:paused", onPaused);
      socket.off("game:resumed", onResumed);
      socket.off("game:final", onFinal);
      socket.off("host:error", onError);
      socket.off("game:ended", onEnded);
      socket.off("game:revealStage", onRevealStage);
      socket.off("game:settings", onSettings);
      socket.off("disconnect");
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
      setConnectHint(copy.connecting.creating);
      await emitWithAck("host:create", { ...launch, settings }, 15_000);
      // host:created moves us to lobby; ack is a backstop if that event was missed.
      setPhase((p) => (p === "connecting" ? "lobby" : p));
    } catch (err) {
      setHostError(err.message || "Could not create room.");
    } finally {
      setCreatingRoom(false);
    }
  };

  const currentImage = question ? question.image ?? images[question.index] ?? null : null;

  return (
    <div className="min-h-screen">
      <HostRecoveredBanner show={hostRecovered} />
      <HostStatusBanner connected={hostConnected} />
      <PhaseShell phaseKey={phase} className="min-h-screen">
        {phase === "setup" && (
          <SetupView settings={settings} setSettings={setSettings} onCreate={createLobby} onCancel={onExit} />
        )}
        {phase === "connecting" && (
          <Centered>
            <p className="text-xl text-muted animate-pulse">{connectHint}</p>
            {hostError && (
              <>
                <p className="mt-4 max-w-md font-semibold text-tile-triangle">{hostError}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button onClick={createLobby} className="alkheelank-btn-primary px-6">
                    Try again
                  </button>
                  <button
                    onClick={() => {
                      setHostError(null);
                      setPhase("setup");
                    }}
                    className="rounded-xl bg-ink-700 px-6 py-3 text-sm font-semibold text-muted ring-1 ring-white/10 hover:text-paper"
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
            {!hostError && (
              <button
                onClick={() => setPhase("setup")}
                className="mt-8 text-sm font-semibold text-muted underline-offset-4 hover:text-paper hover:underline"
              >
                Cancel
              </button>
            )}
          </Centered>
        )}
        {phase === "lobby" && (
          <Lobby
            pin={pin}
            quizMeta={quizMeta}
            players={players}
            mode={settings.mode}
            onStart={() => {
              sfx.confirm();
              socket.emit("host:start");
            }}
            error={hostError}
          />
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
      <SettingsPanel corner="bottom-left" />
      <HostControlDeck
        phase={phase}
        pacing={settings.pacing || "normal"}
        paused={paused}
        onPacing={(p) => socket.emit("host:setPacing", { pacing: p })}
        onPause={() => socket.emit("host:pause")}
        onResume={() => socket.emit("host:resume")}
        onSkipQuestion={() => socket.emit("host:closeQuestion")}
        onSkipReveal={() => socket.emit("host:advanceReveal")}
      />
      {(phase === "lobby" || phase === "question" || phase === "reveal" || phase === "standings") && (
        <button
          onClick={() => {
            if (window.confirm("End this game for everyone?")) {
              socket.emit("host:end");
              onExit();
            }
          }}
          className="fixed bottom-4 right-4 rounded-xl bg-ink-800/80 px-4 py-2 text-sm font-semibold text-muted ring-1 ring-white/10 hover:text-paper"
        >
          {copy.host.endConfirm}
        </button>
      )}
    </div>
  );
}

function Centered({ children }) {
  return <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">{children}</div>;
}

function SetupView({ settings, setSettings, onCreate, onCancel }) {
  const toggle = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => window.location.assign("/")} className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid" aria-label="Go to homepage"><Logo size="sm" /></button>
        <button onClick={onCancel} className="text-muted hover:text-paper">← Dashboard</button>
      </div>
      <h1 className="mt-10 alkheelank-heading text-4xl">Tune your show</h1>
      <p className="mt-1 text-muted">Set the vibe, then open the lobby.</p>
      <div className="mt-6 rounded-2xl bg-ink-700/60 p-4 ring-1 ring-white/10">
        <p className="text-sm font-bold uppercase tracking-widest text-muted">Mode</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {["solo", "teams"].map((mode) => (
            <button key={mode} onClick={() => setSettings((s) => ({ ...s, mode }))} className={`rounded-xl px-4 py-3 font-bold ring-1 ${settings.mode === mode ? "bg-brand-mid/25 ring-brand-mid text-paper" : "bg-ink-800 ring-white/10 text-muted"}`}>
              {mode === "solo" ? "Solo" : "Teams"}
            </button>
          ))}
        </div>
        {settings.mode === "teams" && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Team setup</p>
            <div className="mt-2 flex gap-2">
              {Object.entries(TEAM_PRESET_LABELS).map(([id, label]) => (
                <button key={id} onClick={() => setSettings((s) => ({ ...s, teamPreset: id }))} className={`rounded-xl px-3 py-2 text-sm font-bold ring-1 ${settings.teamPreset === id ? "bg-brand-mid/25 ring-brand-mid text-paper" : "bg-ink-800 ring-white/10 text-muted"}`}>{label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <div className="mt-5 rounded-2xl bg-ink-700/60 p-4 ring-1 ring-white/10">
          <p className="alkheelank-label">Show pace</p>
          <p className="mt-1 text-sm text-muted">How snappy reveals feel on the big screen.</p>
          <div className="mt-3 flex gap-2">
            {["quick", "normal", "cinematic"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, pacing: p }))}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ring-1 ${
                  (settings.pacing || "normal") === p ? "bg-brand-mid/25 ring-brand-mid text-paper" : "bg-ink-800 ring-white/10 text-muted"
                }`}
              >
                {copy.host.pacing[p]}
              </button>
            ))}
          </div>
        </div>
        {[
          ["music", "Lobby groove", "Soft music while the crew gathers."],
          ["speedScoring", "Speed bonus", "Quick taps earn more. Off = flat points."],
          ["randomizeQuestions", "Shuffle rounds", "Different question order each game."],
          ["randomizeAnswers", "Shuffle tiles", "Mix answer spots (True/False stays put)."],
        ].map(([key, title, desc]) => (
          <button key={key} onClick={() => toggle(key)} className={`flex items-center justify-between gap-4 rounded-2xl p-5 text-left ring-1 ${settings[key] ? "bg-brand-mid/15 ring-brand-mid" : "bg-ink-700/60 ring-white/10 hover:bg-ink-700"}`}>
            <div><p className="font-display text-xl font-bold">{title}</p><p className="mt-0.5 text-sm text-muted">{desc}</p></div>
            <span className={`relative h-8 w-14 shrink-0 rounded-full ${settings[key] ? "bg-brand-mid" : "bg-ink-500"}`}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-1 h-6 w-6 rounded-full bg-paper ${settings[key] ? "right-1" : "left-1"}`} />
            </span>
          </button>
        ))}
      </div>
      <button onClick={onCreate} className="alkheelank-btn-primary mt-8 w-full text-xl">Open lobby →</button>
    </div>
  );
}

function Lobby({ pin, quizMeta, players, mode, onStart, error }) {
  const pinStr = String(pin || "").padStart(6, "•");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinUrl = `${origin}/join?pin=${pin}`;
  return (
    <div className="alkheelank-screen-host flex min-h-[88vh] flex-col">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => window.location.assign("/")} className="rounded-xl transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-brand-mid" aria-label="Go to homepage"><Logo /></button>
        <div className="text-right"><p className="text-sm uppercase tracking-widest text-muted">Players</p><p className="font-display text-3xl font-bold">{players.length}</p></div>
      </div>
      <div className="mt-10 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
        <div className="flex flex-col items-center text-center">
          <p className="alkheelank-label tracking-[0.3em]">{copy.lobby.pinLabel}</p>
          <div className="pin-display mt-2 font-display text-7xl font-bold alkheelank-gradient-text sm:text-8xl">{pinStr.split("").join(" ")}</div>
          {quizMeta && <p className="mt-3 text-muted">{quizMeta.title} · {quizMeta.questionCount} questions</p>}
          <p className="mt-2 rounded-full bg-ink-700 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted">{mode === "teams" ? copy.lobby.modeTeams : copy.lobby.modeSolo}</p>
        </div>
        {pin && <div className="flex flex-col items-center"><div className="rounded-3xl bg-ink-800/70 p-5 ring-1 ring-white/10"><QRCodeSVG value={joinUrl} size={150} bgColor="transparent" fgColor="#f5f6ff" level="M" /></div><p className="mt-3 text-sm font-semibold text-muted">📱 {copy.lobby.scan}</p></div>}
      </div>
      <div className="mt-10 flex-1">
        {players.length === 0 ? <p className="mt-10 text-center text-xl text-muted animate-pulse">{copy.lobby.waiting}</p> : (
          <div className="flex flex-wrap justify-center gap-3">
            <AnimatePresence>
              {players.map((p) => (
                <motion.span key={p.id} layout initial={{ scale: 0, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="flex items-center gap-2 rounded-2xl bg-ink-700 py-2 pl-2 pr-4 text-xl font-bold ring-1 ring-white/10">
                  <Avatar config={p.character} size={40} ring />
                  {p.nick}
                  {mode === "teams" && p.team?.name && <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${p.team.color}33`, color: p.team.color }}>{p.team.name}</span>}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      {error && <p className="mb-2 text-center font-semibold text-tile-triangle">{error}</p>}
      <div className="sticky bottom-6 mt-6 flex justify-center">
        <button onClick={onStart} disabled={players.length === 0} className="alkheelank-btn-primary px-16 text-2xl" title={players.length === 0 ? copy.lobby.emptyCta : ""}>
          {copy.lobby.start}
        </button>
      </div>
    </div>
  );
}

function QuestionView({ question, image, answerCount, paused }) {
  const isTF = question.type === "tf";
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
    <div className="alkheelank-screen-host flex min-h-[90vh] flex-col">
      <div className="flex items-center justify-between text-muted">
        <span className="font-semibold">Question {question.index + 1} of {question.total}{isTF && <span className="ml-3 rounded-full bg-ink-700 px-3 py-1 text-sm">True / False</span>}</span>
        <span className="font-semibold">{answerCount.answered} answered</span>
      </div>
      {question.doublePoints && <div className="mx-auto mt-3 inline-flex animate-pulse items-center gap-2 rounded-full bg-brand-mid/25 px-5 py-2 text-lg font-extrabold text-paper ring-1 ring-brand-mid">⚡ {copy.reveal.doublePoints}</div>}
      <h1 className="mt-4 text-center font-display text-4xl font-bold leading-tight sm:text-5xl">{question.question}</h1>
      {image && <div className="mt-5"><motion.img initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} src={image} alt="" className="mx-auto max-h-[34vh] w-auto rounded-2xl object-contain shadow-xl ring-1 ring-white/10" /></div>}
      <div className="my-6 flex items-center justify-center"><Timer timeLimit={question.timeLimit} startedAt={question.startedAt} paused={paused} sound /></div>
      <div className={`mt-auto grid gap-4 ${isTF ? "sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {question.answers.map((a, i) => <AnswerTile key={i} index={i} type={question.type} text={a.text} disabled big />)}
      </div>
      {paused && (
        <p className="mt-6 text-center text-lg font-bold text-warning">⏸ Round paused — use show controls to resume</p>
      )}
    </div>
  );
}

function StandingsView({ standings, onNext }) {
  return (
    <div className="alkheelank-screen-host mx-auto flex min-h-[90vh] max-w-4xl flex-col">
      <div className="text-center">
        <p className="alkheelank-label tracking-[0.3em]">{copy.standings.subtitle(standings.index, standings.total)}</p>
        <h1 className="mt-2 alkheelank-heading text-4xl alkheelank-gradient-text sm:text-5xl">{copy.standings.title}</h1>
      </div>
      {standings.funStat && <div className="mx-auto mt-4 rounded-full bg-ink-700 px-5 py-2 text-center ring-1 ring-white/10"><span className="font-bold text-paper">{standings.funStat.title}:</span> <span className="text-muted">{standings.funStat.subtitle}</span></div>}
      {standings.mode === "teams" && standings.teamStandings?.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-center alkheelank-heading text-2xl text-muted">{copy.standings.teamRace}</h3>
          <div className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
            {standings.teamStandings.map((t) => (
              <div key={t.id} className="rounded-xl bg-ink-700/70 px-4 py-3 ring-1 ring-white/10">
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
      <div className="mt-8"><Standings standings={standings.standings} max={8} /></div>
      <div className="sticky bottom-6 mt-10 flex justify-center">
        <button onClick={onNext} className="alkheelank-btn-primary px-16 text-2xl">
          {standings.hasNext ? `${copy.host.nextQuestion} →` : `${copy.host.finalResults} 🏆`}
        </button>
      </div>
    </div>
  );
}

function FinalView({ final, onHome }) {
  const [showList, setShowList] = useState(false);
  const [view, setView] = useState("podium"); // podium | recap

  if (view === "recap") {
    return (
      <div className="mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center py-10">
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
    <div className="mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center py-10">
      <h1 className="alkheelank-heading text-5xl alkheelank-gradient-text sm:text-7xl">{copy.final.title}</h1>
      <p className="mt-2 text-muted">{final.title}</p>
      {final.mode === "teams" && final.teamPodium?.length > 0 ? (
        <TeamPodium teams={final.teamPodium} onComplete={() => setShowList(true)} />
      ) : (
        <div className="mt-12 w-full"><Podium podium={final.podium} onComplete={() => setShowList(true)} /></div>
      )}
      <AnimatePresence>
        {showList && final.standings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-14 w-full max-w-2xl">
            <h3 className="mb-4 text-center alkheelank-heading text-2xl text-muted">{final.mode === "teams" ? copy.final.topContributors : copy.final.podiumRest}</h3>
            <Leaderboard entries={final.mode === "teams" ? final.standings.slice(0, 10) : final.standings.slice(3)} max={10} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <button onClick={() => setView("recap")} className="alkheelank-btn-primary px-10 text-lg">🎉 {copy.final.recapCta}</button>
        <button onClick={onHome} className="alkheelank-btn-ghost px-8">Back to dashboard</button>
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
    <div className="mt-10 flex w-full max-w-3xl items-end justify-center gap-4">
      {teams.map((t, i) => (
        <motion.div key={t.id} initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.3 }} className="flex w-44 flex-col items-center">
          <div className="mb-3 text-center"><p className="font-display text-2xl font-bold" style={{ color: t.color }}>{t.name}</p><p className="text-3xl font-extrabold tabular-nums">{t.score.toLocaleString()}</p></div>
          <div className={`w-full rounded-t-2xl ${i === 0 ? "h-52" : i === 1 ? "h-44" : "h-36"} grid place-items-start pt-3 font-display text-4xl font-bold text-ink-900`} style={{ backgroundColor: t.color }}>{i + 1}</div>
        </motion.div>
      ))}
    </div>
  );
}
