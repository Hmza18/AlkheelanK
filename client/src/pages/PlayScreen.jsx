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
import { HostStatusBanner, PlayerReconnectBanner, PlayerConnectionBanner } from "../components/ConnectionBanner.jsx";
import { copy } from "../lib/copy.js";
import { tileStyle } from "../lib/answers.js";
import { formatPinInput } from "../lib/pin.js";
import { isPodiumRank, playerRankHeadline, playerRankLine, teamPodiumLabel } from "../lib/rankDisplay.js";
import { savePlayerSession, loadPlayerSession, clearPlayerSession } from "../lib/playerSession.js";
import SettingsPanel from "../components/SettingsPanel.jsx";
import { TimerStrip } from "../components/Timer.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import QuestionProgress from "../components/QuestionProgress.jsx";
import ScrollHint from "../components/ScrollHint.jsx";
import DoublePointsWarning from "../components/DoublePointsWarning.jsx";
import Countdown from "../components/Countdown.jsx";
import { questionIntro } from "../lib/motion.js";

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
  const [doubleWarning, setDoubleWarning] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [selected, setSelected] = useState(null);
  const [waitContext, setWaitContext] = useState(null);
  const [result, setResult] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [standings, setStandings] = useState(null);
  const [finalRank, setFinalRank] = useState(null);
  const [paused, setPaused] = useState(false);
  const [players, setPlayers] = useState([]);
  const [hostConnected, setHostConnected] = useState(true);
  const [selfConnected, setSelfConnected] = useState(true);
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
      setSelfConnected(true);
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
      setDoubleWarning(null);
      setQuestion(q);
      setSelected(null);
      setWaitContext(null);
      setResult(null);
      setReveal(null);
      setStandings(null);
      setPaused(!!q.paused);
      setPhase("question");
    };
    const onDoublePointsWarning = (warning) => {
      setDoubleWarning(warning);
      setSelected(null);
      setWaitContext(null);
      setResult(null);
      setStandings(null);
      setPaused(false);
      setPhase("double-warning");
      sfx.confirm?.();
    };
    const onCountdown = (c) => {
      setCountdown(c);
      setSelected(null);
      setWaitContext(null);
      setResult(null);
      setStandings(null);
      setPaused(false);
      setPhase("countdown");
    };
    const onLocked = (payload) => {
      setSelected(payload.answerIndex);
      setWaitContext(payload.waitContext ?? null);
      setPhase((p) => (p === "question" ? "answered" : p));
      sfx.lock();
    };
    const onReveal = (r) => setReveal(r);
    const onPlayers = (list) => setPlayers(list || []);
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
    const onKicked = ({ reason }) => {
      clearPlayerSession();
      joinInfoRef.current = null;
      setMe(null);
      setJoining(false);
      setStep("pin");
      setPhase("join");
      setError(reason || copy.lobby.kicked);
    };
    // Named so cleanup removes only THIS handler — socket.off("disconnect")
    // without a reference would break every other listener on the shared socket.
    const onDisconnect = () => setSelfConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("game:players", onPlayers);
    socket.on("game:reveal", onReveal);
    socket.on("player:meta", onMeta);
    socket.on("player:joined", onJoined);
    socket.on("player:error", onPlayerError);
    socket.on("player:kicked", onKicked);
    socket.on("game:question", onQuestion);
    socket.on("game:countdown", onCountdown);
    socket.on("game:doublePointsWarning", onDoublePointsWarning);
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
      socket.off("disconnect", onDisconnect);
      socket.off("game:players", onPlayers);
      socket.off("game:reveal", onReveal);
      socket.off("player:meta", onMeta);
      socket.off("player:joined", onJoined);
      socket.off("player:error", onPlayerError);
      socket.off("player:kicked", onKicked);
      socket.off("game:question", onQuestion);
      socket.off("game:countdown", onCountdown);
      socket.off("game:doublePointsWarning", onDoublePointsWarning);
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
        else if (res.lobbyLocked) {
          setMeta(res);
          setError(copy.lobby.lockedJoin);
        } else if (res.status && res.status !== "lobby") {
          setError("This game has already started.");
        } else {
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
  // Shown mid-game whenever this phone's own connection drops (joined players only).
  const connectionBanner = me ? <PlayerConnectionBanner connected={selfConnected} /> : null;

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
        {connectionBanner}
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
          {me?.quizTitle && (
            <p className="mt-3 text-sm font-semibold text-muted landscapePhone:mt-2">
              🎬 {me.quizTitle}
            </p>
          )}
          {players.length > 0 && (
            <p className="mt-1 text-sm text-muted landscapePhone:text-xs">
              {copy.player.lobbyCrowd(players.length)}
            </p>
          )}
          <p className="mt-6 text-muted animate-pulse landscapePhone:mt-3 landscapePhone:text-sm">{copy.player.lobbyWait}</p>
        </CenterCard>
      </>
    );
  }
  if (phase === "countdown") {
    return (
      <>
        {settingsFab}
        {connectionBanner}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <Countdown countdown={countdown} />
      </>
    );
  }
  if (phase === "double-warning") {
    return (
      <>
        {settingsFab}
        {connectionBanner}
        <HostStatusBanner connected={hostConnected} forPlayer />
        <DoublePointsWarning warning={doubleWarning} />
      </>
    );
  }
  if (phase === "question" && question) {
    return (
      <>
        {settingsFab}
        {connectionBanner}
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
        {connectionBanner}
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
        {connectionBanner}
        <ResultCard result={result} q={question} reveal={reveal} />
      </>
    );
  }
  if (phase === "standings") {
    return (
      <>
        {settingsFab}
        {connectionBanner}
        <StandingsCard standings={standings} meId={me?.id ?? me?.pid ?? joinInfoRef.current?.pid} />
      </>
    );
  }
  if (phase === "final") {
    const onPodium = isPodiumRank(finalRank?.rank);
    return (
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
          maxLength={7}
          value={formatPinInput(pin)}
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
      questionType={q?.type}
      questionKey={q?.index}
      header={
        <div className="question-screen__meta flex shrink-0 items-center justify-between gap-2 text-sm font-semibold text-muted landscapePhone:text-[0.625rem] landscapePhone:leading-tight">
          <span className="shrink-0 tabular-nums">
            Q{q?.index + 1}/{q?.total}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 landscapePhone:gap-1">
            {q?.doublePoints ? (
              <span className="hidden shrink-0 rounded-full bg-brand-mid/15 px-2 py-0.5 text-[0.625rem] font-extrabold text-brand-mid ring-1 ring-brand-mid/30 landscapePhone:inline">
                ⚡2×
              </span>
            ) : null}
            <span className="landscapePhone:hidden">{q?.type === "tf" ? "True or false?" : "Speed counts"}</span>
            <span className="hidden landscapePhone:inline">{q?.type === "tf" ? "T / F" : "⚡"}</span>
          </span>
        </div>
      }
      progress={<QuestionProgress index={q?.index ?? 0} total={q?.total ?? 1} />}
      badge={
        q?.doublePoints ? (
          <div className="mx-auto mt-1.5 inline-flex shrink-0 animate-pulse rounded-full bg-brand-mid/15 px-4 py-1 text-sm font-extrabold text-brand-mid ring-1 ring-brand-mid/30 landscapePhone:hidden">
            ⚡ 2X POINTS
          </div>
        ) : null
      }
      prompt={q?.question}
      image={q?.image}
      animateImage
      timerStrip={
        <TimerStrip
          timeLimit={q?.timeLimit}
          startedAt={q?.startedAt}
          paused={paused}
          introDelay={questionIntro.timer}
        />
      }
      answers={q?.answers?.map((a, i) => (
        <AnswerTile
          key={i}
          index={i}
          type={q.type}
          text={a.text}
          onClick={() => onAnswer(i)}
          selected={selected === i}
          disabled={selected !== null || paused}
          staggerIndex={i}
          entranceDelay={questionIntro.tiles}
          kahoot
          compact
        />
      ))}
      overlay={
        paused ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-surface/90 backdrop-blur-sm"
          >
            <div className="text-6xl">⏸</div>
            <h2 className="mt-4 alkheelank-heading text-3xl">{copy.player.paused}</h2>
          </motion.div>
        ) : null
      }
    />
  );
}

function ResultCard({ result, q, reveal }) {
  const title = result?.correct
    ? copy.player.result.correct
    : result?.answered
    ? copy.player.result.wrong
    : copy.player.result.timeout;
  // Show the right answer to anyone who missed it. The reveal broadcast carries
  // the correct index (only sent after the question closes, so no spoilers).
  const correctAnswer =
    !result?.correct && reveal?.index === q?.index && reveal?.correctIndex != null
      ? q?.answers?.[reveal.correctIndex]?.text
      : null;
  const correctStyle = correctAnswer != null ? tileStyle(q?.type, reveal.correctIndex) : null;
  return (
    <CenterCard>
      <h2 className="alkheelank-heading text-3xl landscapePhone:text-2xl">{title}</h2>
      <p className="mt-2 text-2xl font-bold landscapePhone:mt-1 landscapePhone:text-xl">
        {copy.player.result.points(result?.points ?? 0, result?.multiplier)}
      </p>
      {correctAnswer && (
        <p className="mt-3 rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge landscapePhone:mt-2">
          <span className="text-muted">{copy.player.result.correctWas}: </span>
          <span style={{ color: correctStyle.color }}>{correctStyle.glyph}</span> {correctAnswer}
        </p>
      )}
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
              className="mb-2 flex items-center justify-between rounded-xl bg-surface-elevated px-3 py-2 ring-1 ring-edge landscapePhone:mb-1 landscapePhone:px-2 landscapePhone:py-1.5 landscapePhone:text-sm"
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
