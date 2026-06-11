import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { socket, ensureConnected, wakeServer, connectSocket, formatConnectError } from "../socket.js";
import { sfx } from "../lib/sound.js";
import Logo from "../components/Logo.jsx";
import AnswerTile from "../components/AnswerTile.jsx";
import Avatar, { DEFAULT_AVATAR } from "../components/characters.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";
import PostAnswerWaiting from "../components/PostAnswerWaiting.jsx";
import { HostStatusBanner, PlayerReconnectBanner } from "../components/ConnectionBanner.jsx";
import { copy } from "../lib/copy.js";
import { isPodiumRank, playerRankHeadline, playerRankLine, teamPodiumLabel } from "../lib/rankDisplay.js";
import { savePlayerSession, loadPlayerSession, clearPlayerSession } from "../lib/playerSession.js";
import SettingsPanel from "../components/SettingsPanel.jsx";
import Timer, { TimerStrip } from "../components/Timer.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import ScrollHint from "../components/ScrollHint.jsx";
import OrientationGate from "../components/OrientationGate.jsx";

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

  // Restore session after refresh — rejoin with saved pid before the join form.
  useEffect(() => {
    const saved = loadPlayerSession();
    if (!saved?.pid || !saved?.pin) return;
    const urlPin = pinParam.length === 6 ? pinParam : null;
    if (urlPin && urlPin !== saved.pin) return;

    joinInfoRef.current = saved;
    pinRef.current = saved.pin;
    setPin(saved.pin);
    setNickname(saved.nick || "");
    setAvatar(saved.character || DEFAULT_AVATAR);
    if (saved.teamId) {
      teamIdRef.current = saved.teamId;
      setTeamId(saved.teamId);
    }
    setStep("profile");
    setJoining(true);
    setError(null);

    (async () => {
      try {
        await wakeServer();
        await connectSocket();
        socket.emit("player:join", {
          pin: saved.pin,
          nickname: saved.nick,
          character: saved.character,
          teamId: saved.teamId,
          pid: saved.pid,
          joinToken: saved.joinToken,
        });
      } catch (err) {
        setJoining(false);
        clearPlayerSession();
        setError(formatConnectError(err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        joinToken: info.joinToken,
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
      const session = {
        pin: pinRef.current.replace(/\D/g, "").slice(0, 6),
        nick: player.nick,
        character: player.character,
        teamId: player.teamId,
        pid: player.pid,
        joinToken: player.joinToken,
      };
      joinInfoRef.current = session;
      savePlayerSession(session);
      setJoining(false);
      setError(null);
      if (info.reconnected) {
        setShowReconnectBanner(true);
        setTimeout(() => setShowReconnectBanner(false), 3500);
        if (info.gameStatus === "lobby") setPhase("lobby");
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
    const onEnded = () => {
      clearPlayerSession();
      joinInfoRef.current = null;
      setPhase("ended");
    };
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

  const settingsFab = <SettingsPanel corner="bottom-left" triggerClassName="settings-fab--player" />;
  const landscapePlay = ["question", "answered", "result", "standings", "final"].includes(phase);

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
        <AvatarPicker
        nickname={nickname}
        setNickname={setNickname}
        avatar={avatar}
        setAvatar={setAvatar}
        mode={meta?.mode}
        teams={meta?.teams || []}
        teamId={teamId}
        setTeamId={setTeamId}
        onDone={join}
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
          <Avatar config={me?.character} size={80} ring />
          <h2 className="mt-4 alkheelank-heading text-2xl landscapePhone:mt-2 landscapePhone:text-xl">{copy.player.joined}</h2>
          <p className="mt-1 text-3xl font-bold alkheelank-gradient-text landscapePhone:text-2xl">{me?.nick}</p>
          {me?.team?.name && (
            <p className="mt-2 text-sm font-bold landscapePhone:mt-1" style={{ color: me.team.color }}>
              {me.team.name}
            </p>
          )}
          <p className="mt-6 text-muted animate-pulse landscapePhone:mt-3 landscapePhone:text-sm">{copy.player.lobbyWait}</p>
        </CenterCard>
      </>
    );
  }
  if (phase === "question" && question) {
    return (
      <>
        {settingsFab}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <OrientationGate active={landscapePlay}>
          <QuestionCard
            q={question}
            selected={selected}
            onAnswer={answer}
            paused={paused}
          />
        </OrientationGate>
      </>
    );
  }
  if (phase === "answered") {
    return (
      <>
        {settingsFab}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <OrientationGate active={landscapePlay}>
          <PostAnswerWaiting
            me={me}
            question={question}
            selected={selected}
            waitContext={waitContext}
            paused={paused}
          />
        </OrientationGate>
      </>
    );
  }
  if (phase === "result") {
    return (
      <OrientationGate active={landscapePlay}>
        {settingsFab}
        <ResultCard result={result} q={question} />
      </OrientationGate>
    );
  }
  if (phase === "standings") {
    return (
      <OrientationGate active={landscapePlay}>
        {settingsFab}
        <StandingsCard standings={standings} meId={me?.id ?? me?.pid ?? joinInfoRef.current?.pid} />
      </OrientationGate>
    );
  }
  if (phase === "final") {
    const onPodium = isPodiumRank(finalRank?.rank);
    return (
      <OrientationGate active={landscapePlay}>
        <CenterCard>
        <h2 className="alkheelank-heading text-3xl landscapePhone:text-2xl">{onPodium ? copy.player.onPodium : copy.player.final}</h2>
        {!onPodium && (
          <p className="mt-2 text-2xl font-bold alkheelank-gradient-text landscapePhone:mt-1 landscapePhone:text-xl">#{finalRank?.rank ?? "-"}</p>
        )}
        {onPodium && <p className="mt-2 text-muted landscapePhone:mt-1 landscapePhone:text-sm">{copy.player.onPodiumTeaser}</p>}
        <p className={`${onPodium ? "mt-4" : "mt-1"} text-muted landscapePhone:mt-2 landscapePhone:text-sm`}>{(finalRank?.score ?? 0).toLocaleString()} pts total</p>
        <button type="button" onClick={() => navigate("/")} className="alkheelank-btn-primary mt-6 w-full landscapePhone:mt-3">
          {copy.player.playAgain}
        </button>
      </CenterCard>
      </OrientationGate>
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
    <div className="alkheelank-screen-player player-phase-fill flex items-center overflow-y-auto text-center landscapePhone:py-2">
      <div className="alkheelank-card my-auto w-full p-8 landscapePhone:p-4">
        {children}
        <ScrollHint />
      </div>
    </div>
  );
}

function JoinPin({ pin, setPin, goProfile, error }) {
  return (
    <div className="alkheelank-screen-player player-phase-fill flex flex-col landscapePhone:py-2">
      <div className="mt-6 flex shrink-0 justify-center landscapePhone:mt-2">
        <Logo size="md" />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goProfile();
        }}
        className="alkheelank-card mt-10 flex flex-col gap-4 p-6 landscapePhone:mt-4 landscapePhone:gap-3 landscapePhone:p-4"
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

function QuestionCard({ q, selected, onAnswer, paused }) {
  return (
    <QuestionScreen
      variant="player"
      header={
        <div className="question-screen__meta flex shrink-0 items-center justify-between text-sm font-semibold text-muted">
          <span>
            Q{q?.index + 1} / {q?.total}
          </span>
          <span>{q?.type === "tf" ? "True or false?" : "Speed counts"}</span>
        </div>
      }
      badge={
        q?.doublePoints ? (
          <div className="mx-auto mt-2 inline-flex shrink-0 animate-pulse rounded-full bg-brand-mid/25 px-4 py-1 text-sm font-extrabold text-paper ring-1 ring-brand-mid">
            ⚡ 2X POINTS
          </div>
        ) : null
      }
      prompt={q?.question}
      image={q?.image}
      animateImage
      timer={<Timer timeLimit={q?.timeLimit} startedAt={q?.startedAt} paused={paused} size={48} />}
      timerStrip={<TimerStrip timeLimit={q?.timeLimit} startedAt={q?.startedAt} paused={paused} />}
      answers={q?.answers?.map((a, i) => (
        <AnswerTile
          key={i}
          index={i}
          type={q.type}
          text={a.text}
          onClick={() => onAnswer(i)}
          selected={selected === i}
          disabled={selected !== null || paused}
          compact
        />
      ))}
      overlay={
        paused ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-ink-900/80 backdrop-blur-sm"
          >
            <div className="text-6xl">⏸</div>
            <h2 className="mt-4 alkheelank-heading text-3xl">{copy.player.paused}</h2>
          </motion.div>
        ) : null
      }
    />
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
      <h2 className="alkheelank-heading text-3xl landscapePhone:text-2xl">{title}</h2>
      <p className="mt-2 text-2xl font-bold landscapePhone:mt-1 landscapePhone:text-xl">
        {copy.player.result.points(result?.points ?? 0, result?.multiplier)}
      </p>
      <p className="mt-2 text-muted landscapePhone:mt-1 landscapePhone:text-sm">
        {playerRankLine(result?.rank, result?.totalPlayers)} ·{" "}
        {(result?.totalScore ?? 0).toLocaleString()} pts total
      </p>
      {result?.team?.name && (
        <p className="mt-2 text-sm font-bold landscapePhone:mt-1" style={{ color: result.team.color }}>
          {result.team.name}
        </p>
      )}
      {q?.doublePoints && (
        <p className="mt-2 text-xs font-bold text-brand-end landscapePhone:mt-1">Double-points question</p>
      )}
      <p className="mt-4 text-muted animate-pulse landscapePhone:mt-2 landscapePhone:text-sm">{copy.player.result.watchScreen}</p>
    </CenterCard>
  );
}

function StandingsCard({ standings, meId }) {
  const me = standings?.standings?.find((p) => p.id === meId);
  return (
    <CenterCard>
      <h2 className="alkheelank-heading text-3xl landscapePhone:text-2xl">{copy.player.standings}</h2>
      {standings?.funStat && (
        <p className="mt-2 text-sm landscapePhone:mt-1 landscapePhone:text-xs">
          <span className="font-bold">{standings.funStat.title}:</span> {standings.funStat.subtitle}
        </p>
      )}
      <p className="mt-4 text-5xl font-bold alkheelank-gradient-text landscapePhone:mt-2 landscapePhone:text-4xl">
        {me?.rank ? playerRankHeadline(me.rank) : "-"}
      </p>
      {isPodiumRank(me?.rank) && <p className="mt-2 text-sm text-muted landscapePhone:mt-1 landscapePhone:text-xs">{copy.player.onPodiumTeaser}</p>}
      <p className="mt-2 text-xl font-bold landscapePhone:mt-1 landscapePhone:text-lg">{(me?.score ?? 0).toLocaleString()} pts</p>
      {standings?.mode === "teams" && standings?.teamStandings?.length > 0 && (
        <div className="mt-4 w-full text-left landscapePhone:mt-2">
          {standings.teamStandings.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className="mb-2 flex items-center justify-between rounded-xl bg-ink-700/60 px-3 py-2 landscapePhone:mb-1 landscapePhone:px-2 landscapePhone:py-1.5 landscapePhone:text-sm"
            >
              <span className="font-bold" style={{ color: t.color }}>
                {teamPodiumLabel(t)}
              </span>
              <span>{t.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </CenterCard>
  );
}
