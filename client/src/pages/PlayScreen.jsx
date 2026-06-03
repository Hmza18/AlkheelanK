import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { socket, ensureConnected, wakeServer, connectSocket, formatConnectError } from "../socket.js";
import { sfx } from "../lib/sound.js";
import Logo from "../components/Logo.jsx";
import AnswerTile from "../components/AnswerTile.jsx";
import Avatar, { BASES, COLORS, DEFAULT_AVATAR } from "../components/characters.jsx";
import PostAnswerWaiting from "../components/PostAnswerWaiting.jsx";
import { HostStatusBanner, PlayerReconnectBanner } from "../components/ConnectionBanner.jsx";
import { copy } from "../lib/copy.js";
import SettingsPanel from "../components/SettingsPanel.jsx";

export default function PlayScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const pinParam = (params.get("pin") || "").replace(/\D/g, "").slice(0, 6);
  const [phase, setPhase] = useState("join");
  const [step, setStep] = useState(pinParam.length === 6 ? "profile" : "pin");
  const [pin, setPin] = useState(pinParam);
  const [meta, setMeta] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [me, setMe] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [waitContext, setWaitContext] = useState(null);
  const [result, setResult] = useState(null);
  const [standings, setStandings] = useState(null);
  const [finalRank, setFinalRank] = useState(null);
  const [paused, setPaused] = useState(false);
  const [hostConnected, setHostConnected] = useState(true);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);
  const joinInfoRef = useRef(null);
  const pinRef = useRef(pin);
  const teamIdRef = useRef(teamId);
  pinRef.current = pin;
  teamIdRef.current = teamId;

  useEffect(() => {
    wakeServer().catch(() => {});
    ensureConnected();

    const onConnect = () => {
      const info = joinInfoRef.current;
      if (!info) return;
      socket.emit("player:join", {
        pin: info.pin,
        nickname: info.nick,
        character: info.character,
        teamId: info.teamId,
        pid: info.pid,
      });
    };
    const onMeta = (m) => {
      setMeta(m);
      if (m.mode === "teams" && m.teams?.length && !teamIdRef.current) {
        const first = m.teams[0].id;
        teamIdRef.current = first;
        setTeamId(first);
      }
    };
    const onJoined = (info) => {
      const player = { ...info, id: info.id ?? info.pid };
      setMe(player);
      joinInfoRef.current = {
        pin: pinRef.current.replace(/\D/g, "").slice(0, 6),
        nick: player.nick,
        character: player.character,
        teamId: player.teamId,
        pid: player.pid,
      };
      setJoining(false);
      setError(null);
      if (info.reconnected) {
        setShowReconnectBanner(true);
        setTimeout(() => setShowReconnectBanner(false), 3500);
      } else {
        setPhase("lobby");
      }
    };
    const onHostStatus = ({ connected }) => {
      setHostConnected(connected !== false);
    };
    const onQuestion = (q) => {
      setQuestion(q);
      setSelected(null);
      setWaitContext(null);
      setResult(null);
      setStandings(null);
      setPaused(!!q.paused);
      setPhase("question");
    };
    const onLocked = (payload) => {
      setSelected(payload.answerIndex);
      setWaitContext(payload.waitContext ?? null);
      setPhase((p) => (p === "question" ? "answered" : p));
      sfx.lock();
    };
    const onResult = (r) => {
      setResult(r);
      setPhase("result");
      if (r.correct) sfx.correct();
      else if (r.answered) sfx.wrong();
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
      const myId = joinInfoRef.current?.pid;
      setFinalRank(f.standings.find((p) => p.id === myId));
      setPhase("final");
    };
    const onEnded = () => setPhase("ended");
    const onPlayerError = ({ message }) => {
      setError(message);
      setJoining(false);
    };

    socket.on("connect", onConnect);
    socket.on("player:meta", onMeta);
    socket.on("player:joined", onJoined);
    socket.on("player:error", onPlayerError);
    socket.on("game:question", onQuestion);
    socket.on("player:answerLocked", onLocked);
    socket.on("player:result", onResult);
    socket.on("game:standings", onStandings);
    socket.on("game:paused", onPaused);
    socket.on("game:resumed", onResumed);
    socket.on("game:final", onFinal);
    socket.on("game:ended", onEnded);
    socket.on("game:hostStatus", onHostStatus);

    return () => {
      socket.off("connect", onConnect);
      socket.off("player:meta", onMeta);
      socket.off("player:joined", onJoined);
      socket.off("player:error", onPlayerError);
      socket.off("game:question", onQuestion);
      socket.off("player:answerLocked", onLocked);
      socket.off("player:result", onResult);
      socket.off("game:standings", onStandings);
      socket.off("game:paused", onPaused);
      socket.off("game:resumed", onResumed);
      socket.off("game:final", onFinal);
      socket.off("game:ended", onEnded);
      socket.off("game:hostStatus", onHostStatus);
    };
  }, []);

  const goProfile = async () => {
    const cleanPin = pin.replace(/\D/g, "").slice(0, 6);
    if (cleanPin.length !== 6) return setError(copy.player.pinStep);
    setError(null);
    try {
      await wakeServer();
      await connectSocket();
      socket.emit("player:peek", { pin: cleanPin }, (res) => {
        if (res?.error) setError(res.error);
        else {
          setMeta(res);
          if (res.mode === "teams" && res.teams?.length) setTeamId(res.teams[0].id);
          setStep("profile");
          setError(null);
        }
      });
    } catch (err) {
      setError(formatConnectError(err));
    }
  };

  const join = async (e) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\D/g, "").slice(0, 6);
    if (!nickname.trim()) return setError("Pick a nickname to join.");
    setJoining(true);
    setError(null);
    try {
      await wakeServer();
      await connectSocket();
      socket.emit("player:join", {
        pin: cleanPin,
        nickname: nickname.trim(),
        character: avatar,
        teamId,
      });
    } catch (err) {
      setJoining(false);
      setError(formatConnectError(err));
    }
  };

  const answer = (i) => {
    if (phase !== "question" || selected !== null || paused) return;
    setSelected(i);
    sfx.tap();
    socket.emit("player:answer", { answerIndex: i });
  };

  const settingsFab = <SettingsPanel corner="bottom-left" />;

  if (phase === "join" && step === "pin") {
    return (
      <>
        {settingsFab}
        <JoinPin pin={pin} setPin={setPin} goProfile={goProfile} error={error} />
      </>
    );
  }
  if (phase === "join" && step === "profile") {
    return (
      <>
        {settingsFab}
        <JoinProfile
        nickname={nickname}
        setNickname={setNickname}
        avatar={avatar}
        setAvatar={setAvatar}
        mode={meta?.mode}
        teams={meta?.teams || []}
        teamId={teamId}
        setTeamId={setTeamId}
        join={join}
        joining={joining}
        error={error}
      />
      </>
    );
  }
  if (phase === "lobby") {
    return (
      <>
        {settingsFab}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <CenterCard>
          <PlayerReconnectBanner show={showReconnectBanner} />
          <Avatar config={me?.character} size={96} ring />
          <h2 className="mt-4 alkheelank-heading text-2xl">{copy.player.joined}</h2>
          <p className="mt-1 text-3xl font-bold alkheelank-gradient-text">{me?.nick}</p>
          {me?.team?.name && (
            <p className="mt-2 text-sm font-bold" style={{ color: me.team.color }}>
              {me.team.name}
            </p>
          )}
          <p className="mt-6 text-muted animate-pulse">{copy.player.lobbyWait}</p>
        </CenterCard>
      </>
    );
  }
  if (phase === "question" && question) {
    return (
      <>
        {settingsFab}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <QuestionCard
          q={question}
          selected={selected}
          onAnswer={answer}
          paused={paused}
        />
      </>
    );
  }
  if (phase === "answered") {
    return (
      <>
        {settingsFab}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <PostAnswerWaiting
        me={me}
        question={question}
        selected={selected}
        waitContext={waitContext}
        paused={paused}
      />
      </>
    );
  }
  if (phase === "result") {
    return (
      <>
        {settingsFab}
        <ResultCard result={result} q={question} />
      </>
    );
  }
  if (phase === "standings") {
    return (
      <>
        {settingsFab}
        <StandingsCard standings={standings} meId={me?.id ?? me?.pid ?? joinInfoRef.current?.pid} />
      </>
    );
  }
  if (phase === "final") {
    return (
      <CenterCard>
        <h2 className="alkheelank-heading text-3xl">{copy.player.final}</h2>
        <p className="mt-2 text-2xl font-bold alkheelank-gradient-text">#{finalRank?.rank ?? "-"}</p>
        <p className="mt-1 text-muted">{(finalRank?.score ?? 0).toLocaleString()} pts total</p>
        <button type="button" onClick={() => navigate("/")} className="alkheelank-btn-primary mt-6 w-full">
          {copy.player.playAgain}
        </button>
      </CenterCard>
    );
  }
  return (
    <CenterCard>
      <h2 className="alkheelank-heading text-3xl">{copy.player.gameOver}</h2>
      <button type="button" onClick={() => navigate("/")} className="alkheelank-btn-primary mt-6 w-full">
        {copy.player.playAgain}
      </button>
    </CenterCard>
  );
}

function CenterCard({ children }) {
  return (
    <div className="alkheelank-screen-player alkheelank-screen-fill flex items-center text-center">
      <div className="alkheelank-card w-full p-8">{children}</div>
    </div>
  );
}

function JoinPin({ pin, setPin, goProfile, error }) {
  return (
    <div className="alkheelank-screen-player alkheelank-screen-fill flex flex-col">
      <div className="mt-6 flex justify-center">
        <Logo size="md" />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goProfile();
        }}
        className="alkheelank-card mt-10 flex flex-col gap-4 p-6"
      >
        <label className="alkheelank-label text-center">{copy.lobby.pinLabel}</label>
        <input
          className="alkheelank-input pin-display"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          autoFocus
        />
        {error && (
          <p className="rounded-xl bg-tile-triangle/20 px-4 py-2 text-center font-semibold text-tile-triangle">
            {error}
          </p>
        )}
        <button type="submit" className="alkheelank-btn-primary w-full text-xl">
          Continue →
        </button>
      </form>
    </div>
  );
}

function JoinProfile({
  nickname,
  setNickname,
  avatar,
  setAvatar,
  mode,
  teams,
  teamId,
  setTeamId,
  join,
  joining,
  error,
}) {
  return (
    <form onSubmit={join} className="alkheelank-screen-fill alkheelank-safe-x mx-auto flex max-w-md flex-col overflow-y-auto px-5 py-6 pb-24">
      <div className="mt-3 flex justify-center">
        <Avatar config={avatar} size={120} ring />
      </div>
      <input
        className="alkheelank-input mt-4"
        placeholder="Nickname"
        maxLength={16}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        autoFocus
      />
      {mode === "teams" && (
        <div className="mt-3 rounded-2xl bg-ink-800/70 p-3 ring-1 ring-white/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Choose team</p>
          <div className="grid grid-cols-2 gap-2">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTeamId(t.id)}
                className={`min-h-touch rounded-xl px-3 py-3 text-sm font-bold ring-1 ${
                  teamId === t.id ? "ring-paper text-paper" : "ring-white/10 text-muted"
                }`}
                style={{ backgroundColor: `${t.color}22` }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 rounded-3xl bg-ink-800/70 p-3 ring-1 ring-white/10">
        <div className="grid grid-cols-5 gap-2">
          {BASES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setAvatar((a) => ({ ...a, base: id }))}
              className={`flex min-h-touch min-w-touch items-center justify-center rounded-2xl p-1 ${
                avatar.base === id ? "bg-brand-mid/30 ring-2 ring-brand-mid" : "ring-1 ring-white/10"
              }`}
            >
              <Avatar config={{ ...avatar, base: id }} size={56} />
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAvatar((a) => ({ ...a, color: c }))}
              className={`h-11 w-11 shrink-0 rounded-full ${
                avatar.color === c ? "ring-4 ring-paper" : "ring-2 ring-white/15"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-tile-triangle/20 px-4 py-2 text-center font-semibold text-tile-triangle">
          {error}
        </p>
      )}
      <button type="submit" disabled={joining} className="alkheelank-btn-primary mt-5 w-full text-xl">
        {joining ? copy.player.joining : copy.player.profileCta}
      </button>
    </form>
  );
}

function QuestionCard({ q, selected, onAnswer, paused }) {
  return (
    <div className="alkheelank-screen-fill alkheelank-safe-x relative mx-auto flex max-w-md flex-col px-5 py-6 pb-20">
      <div className="flex items-center justify-between text-sm font-semibold text-muted">
        <span>
          Q{q?.index + 1} / {q?.total}
        </span>
        <span>{q?.type === "tf" ? "True or false?" : "Speed counts"}</span>
      </div>
      {q?.doublePoints && (
        <div className="mx-auto mt-3 inline-flex animate-pulse rounded-full bg-brand-mid/25 px-4 py-1 text-sm font-extrabold text-paper ring-1 ring-brand-mid">
          ⚡ 2X POINTS
        </div>
      )}
      <h2 className="mt-3 text-center text-2xl font-bold">{q?.question}</h2>
      <div className="mt-5 grid flex-1 grid-cols-1 content-end gap-4">
        {q?.answers?.map((a, i) => (
          <AnswerTile
            key={i}
            index={i}
            type={q.type}
            text={a.text}
            onClick={() => onAnswer(i)}
            selected={selected === i}
            disabled={selected !== null || paused}
            big
          />
        ))}
      </div>
      {paused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-ink-900/80 backdrop-blur-sm"
        >
          <div className="text-6xl">⏸</div>
          <h2 className="mt-4 alkheelank-heading text-3xl">{copy.player.paused}</h2>
        </motion.div>
      )}
    </div>
  );
}

function ResultCard({ result, q }) {
  const title = result?.correct
    ? copy.player.result.correct
    : result?.answered
    ? copy.player.result.wrong
    : copy.player.result.timeout;
  return (
    <CenterCard>
      <h2 className="alkheelank-heading text-3xl">{title}</h2>
      <p className="mt-2 text-2xl font-bold">
        {copy.player.result.points(result?.points ?? 0, result?.multiplier)}
      </p>
      <p className="mt-2 text-muted">
        {copy.player.result.rank(result?.rank, result?.totalPlayers)} ·{" "}
        {(result?.totalScore ?? 0).toLocaleString()} pts total
      </p>
      {result?.team?.name && (
        <p className="mt-2 text-sm font-bold" style={{ color: result.team.color }}>
          {result.team.name}
        </p>
      )}
      {q?.doublePoints && (
        <p className="mt-2 text-xs font-bold text-brand-end">Double-points question</p>
      )}
      <p className="mt-4 text-muted animate-pulse">{copy.player.result.watchScreen}</p>
    </CenterCard>
  );
}

function StandingsCard({ standings, meId }) {
  const me = standings?.standings?.find((p) => p.id === meId);
  return (
    <CenterCard>
      <h2 className="alkheelank-heading text-3xl">{copy.player.standings}</h2>
      {standings?.funStat && (
        <p className="mt-2 text-sm">
          <span className="font-bold">{standings.funStat.title}:</span> {standings.funStat.subtitle}
        </p>
      )}
      <p className="mt-4 text-5xl font-bold alkheelank-gradient-text">#{me?.rank ?? "-"}</p>
      <p className="mt-2 text-xl font-bold">{(me?.score ?? 0).toLocaleString()} pts</p>
      {standings?.mode === "teams" && standings?.teamStandings?.length > 0 && (
        <div className="mt-4 w-full text-left">
          {standings.teamStandings.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className="mb-2 flex items-center justify-between rounded-xl bg-ink-700/60 px-3 py-2"
            >
              <span className="font-bold" style={{ color: t.color }}>
                {t.rank}. {t.name}
              </span>
              <span>{t.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </CenterCard>
  );
}
