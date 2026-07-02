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
import PinInput from "../components/PinInput.jsx";
import { isCompletePin, sanitizePin } from "../lib/pin.js";
import { starterImageSrc } from "../lib/starterImages.js";
import { isPodiumRank, playerRankHeadline, playerRankLine, teamPodiumLabel } from "../lib/rankDisplay.js";
import { savePlayerSession, loadPlayerSession, clearPlayerSession } from "../lib/playerSession.js";
import SettingsPanel from "../components/SettingsPanel.jsx";
import { TimerStrip } from "../components/Timer.jsx";
import QuestionScreen from "../components/QuestionScreen.jsx";
import QuestionProgress from "../components/QuestionProgress.jsx";
import ScrollHint from "../components/ScrollHint.jsx";
import DoublePointsWarning from "../components/DoublePointsWarning.jsx";
import Countdown from "../components/Countdown.jsx";
import PlayerShareCard from "../components/PlayerShareCard.jsx";
import GlowCard from "../components/ui/GlowCard.jsx";
import PointsPop from "../components/ui/PointsPop.jsx";
import confetti from "canvas-confetti";
import { questionIntro } from "../lib/motion.js";

export default function PlayScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const pinParam = sanitizePin(params.get("pin") || "");
  const [phase, setPhase] = useState("join");
  const [step, setStep] = useState(isCompletePin(pinParam) ? "profile" : "pin");
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
  const [finalPayload, setFinalPayload] = useState(null);
  const [paused, setPaused] = useState(false);
  const [players, setPlayers] = useState([]);
  const [hostConnected, setHostConnected] = useState(true);
  const [selfConnected, setSelfConnected] = useState(true);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [hintText, setHintText] = useState(null);
  const joinInfoRef = useRef(null);
  const pinRef = useRef(pin);
  const teamIdRef = useRef(teamId);
  pinRef.current = pin;
  teamIdRef.current = teamId;

  const peekJoinMeta = (cleanPin) => {
    (async () => {
      try {
        await wakeServer();
        await connectSocket();
        socket.emit("player:peek", { pin: cleanPin }, (res) => {
          if (!res) return;
          if (res.error) {
            setError(res.error);
            return;
          }
          if (res.lobbyLocked) {
            setError(copy.lobby.lockedJoin);
            return;
          }
          if (res.status && res.status !== "lobby") {
            setError("This game has already started.");
            return;
          }
          setMeta(res);
          if (res.mode === "teams" && res.teams?.length) {
            teamIdRef.current = res.teams[0].id;
            setTeamId(res.teams[0].id);
          }
          setError(null);
        });
      } catch (err) {
        setError(formatConnectError(err));
      }
    })();
  };

  // QR / deep-link joins skip the PIN step — still peek so team pickers populate.
  useEffect(() => {
    const saved = loadPlayerSession();
    if (saved?.pid && saved?.pin) {
      const urlPin = isCompletePin(pinParam) ? pinParam : null;
      if (!urlPin || urlPin === saved.pin) return;
    }
    if (!isCompletePin(pinParam)) return;
    peekJoinMeta(pinParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore session after refresh — rejoin with saved pid before the join form.
  useEffect(() => {
    const saved = loadPlayerSession();
    if (!saved?.pid || !saved?.pin) return;
    const urlPin = isCompletePin(pinParam) ? pinParam : null;
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
    const onHintReveal = ({ hint }) => setHintText(hint ?? null);
    const onQuestion = (q) => {
      setDoubleWarning(null);
      setQuestion(q);
      setSelected(null);
      setWaitContext(null);
      setResult(null);
      setReveal(null);
      setStandings(null);
      setPaused(!!q.paused);
      setHintText(null);
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
      // Don't clobber a local selection already set by submit(); for ms/type/
      // puzzle answerIndex is null, so fall back to a truthy lock marker.
      setSelected((s) => (s == null ? payload.answerIndex ?? true : s));
      setWaitContext(payload.waitContext ?? null);
      setPhase((p) => (p === "question" ? "answered" : p));
      sfx.lock();
    };
    const onAnswerRejected = () => {
      setSelected(null);
      setWaitContext(null);
      setPhase("question");
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
      setFinalPayload(f);
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
    socket.on("player:hintReveal", onHintReveal);
    socket.on("game:countdown", onCountdown);
    socket.on("game:doublePointsWarning", onDoublePointsWarning);
    socket.on("player:answerLocked", onLocked);
    socket.on("player:answerRejected", onAnswerRejected);
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
      socket.off("player:hintReveal", onHintReveal);
      socket.off("game:countdown", onCountdown);
      socket.off("game:doublePointsWarning", onDoublePointsWarning);
      socket.off("player:answerLocked", onLocked);
      socket.off("player:answerRejected", onAnswerRejected);
      socket.off("player:result", onResult);
      socket.off("game:standings", onStandings);
      socket.off("game:paused", onPaused);
      socket.off("game:resumed", onResumed);
      socket.off("game:final", onFinal);
      socket.off("game:ended", onEnded);
      socket.off("game:hostStatus", onHostStatus);
    };
  }, []);

  const goProfile = () => {
    const cleanPin = sanitizePin(pin);
    if (!isCompletePin(cleanPin)) return setError(copy.player.pinStep);
    setError(null);
    pinRef.current = cleanPin;
    setPin(cleanPin);
    // Match QR/deep-link flow: profile step first, validate in the background.
    setStep("profile");
    peekJoinMeta(cleanPin);
  };

  const join = async (e) => {
    e.preventDefault();
    const cleanPin = sanitizePin(pin);
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

  const openAvatarEditor = () => {
    setAvatar(me?.character || DEFAULT_AVATAR);
    setAvatarEditorOpen(true);
    setError(null);
  };

  const saveAvatar = (e) => {
    e.preventDefault();
    setSavingAvatar(true);
    setError(null);
    socket.emit("player:updateCharacter", { character: avatar }, (res) => {
      setSavingAvatar(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      const nextCharacter = res?.character || avatar;
      setMe((m) => (m ? { ...m, character: nextCharacter } : m));
      if (joinInfoRef.current) {
        const session = { ...joinInfoRef.current, character: nextCharacter };
        joinInfoRef.current = session;
        savePlayerSession(session);
      }
      setAvatarEditorOpen(false);
      sfx.confirm?.();
    });
  };

  const canEditLook = !!me && phase !== "join" && phase !== "ended";
  const playerChrome = (
    <>
      <SettingsPanel
        corner="bottom-left"
        triggerClassName="settings-fab--player"
        onEditLook={canEditLook ? openAvatarEditor : null}
      />
      {avatarEditorOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-surface">
          <AvatarPicker
            editMode
            avatar={avatar}
            setAvatar={setAvatar}
            onDone={saveAvatar}
            onCancel={() => {
              setAvatarEditorOpen(false);
              setError(null);
            }}
            joining={savingAvatar}
            error={error}
          />
        </div>
      )}
    </>
  );

  // One submit path for every question type. `payload` is the wire shape the
  // server grades: { index } for mc/tf, { indices } for ms, { text } for type,
  // { order } for puzzle. `selected` flips non-null to lock the UI; for mc/tf we
  // keep the numeric index so the waiting screen can echo the chosen tile.
  const submit = (payload) => {
    if (phase !== "question" || selected !== null || paused) return;
    setSelected(Number.isInteger(payload?.index) ? payload.index : true);
    sfx.lock();
    socket.emit("player:answer", payload);
  };

  const settingsFab = playerChrome;
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
          <button
            type="button"
            onClick={openAvatarEditor}
            className="mt-3 text-sm font-bold text-brand-mid underline-offset-2 hover:underline landscapePhone:mt-2 landscapePhone:text-xs"
          >
            ✨ {copy.player.editLookCta}
          </button>
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
          key={question.index}
          q={question}
          selected={selected}
          onSubmit={submit}
          onHint={() => socket.emit("player:hint")}
          paused={paused}
          hintText={hintText}
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
    return (
      <>
        {settingsFab}
        <div className="alkheelank-screen-player player-phase-fill flex items-center overflow-y-auto px-5 py-8 landscapePhone:py-4">
          <PlayerShareCard
            me={me}
            finalRank={finalRank}
            recap={finalPayload?.recap}
            quizTitle={finalPayload?.title}
          />
        </div>
      </>
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
      <div className="alkheelank-card mt-10 flex flex-col gap-4 p-6 landscapePhone:mt-4 landscapePhone:gap-3 landscapePhone:p-4">
        <label className="alkheelank-label text-center">{copy.lobby.pinLabel}</label>
        <PinInput value={pin} onChange={setPin} autoFocus />
        {error && (
          <p className="rounded-xl bg-tile-triangle/20 px-4 py-2 text-center font-semibold text-tile-triangle">
            {error}
          </p>
        )}
        <button type="button" onClick={goProfile} className="alkheelank-btn-primary w-full text-xl">
          Continue →
        </button>
      </div>
    </div>
  );
}

const TYPE_TAGLINE = {
  tf: "True or false?",
  ms: "Pick all that apply",
  type: "Type your answer",
  puzzle: "Put them in order",
};

function QuestionCard({ q, selected, onSubmit, onHint, paused, hintText }) {
  const type = q?.type || "mc";
  const locked = selected !== null || paused;
  const [hintOpen, setHintOpen] = useState(false);
  const [picks, setPicks] = useState([]); // ms: chosen option indices
  const [text, setText] = useState(""); // type: free text
  const [order, setOrder] = useState(() => (q?.answers || []).map((_, i) => i)); // puzzle: presented slots
  const noPoints = q?.points === "none";
  const openHint = () => {
    if (hintOpen || locked) return;
    setHintOpen(true);
    onHint?.();
    sfx.tap?.();
  };
  const togglePick = (i) =>
    !locked && setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const move = (pos, dir) => {
    if (locked) return;
    setOrder((o) => {
      const j = pos + dir;
      if (j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[pos], next[j]] = [next[j], next[pos]];
      return next;
    });
  };

  // Type-specific input rendered in the answer dock.
  let answersContent;
  if (type === "ms") {
    answersContent = (
      <div className="flex w-full flex-col gap-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.answers.map((a, i) => (
            <AnswerTile
              key={i}
              index={i}
              type="mc"
              text={a.text}
              onClick={() => togglePick(i)}
              selected={picks.includes(i)}
              disabled={locked}
              kahoot
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => picks.length && onSubmit({ indices: picks })}
          disabled={locked || picks.length === 0}
          className="alkheelank-btn-primary mt-1 w-full disabled:opacity-40"
        >
          Submit {picks.length > 0 ? `(${picks.length})` : ""}
        </button>
      </div>
    );
  } else if (type === "type") {
    answersContent = (
      <form
        className="flex w-full flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked && text.trim()) onSubmit({ text: text.trim() });
        }}
      >
        <input
          className="alkheelank-input !text-left !text-lg"
          placeholder="Type your answer…"
          maxLength={120}
          value={text}
          disabled={locked}
          autoFocus
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={locked || !text.trim()}
          className="alkheelank-btn-primary w-full disabled:opacity-40"
        >
          Submit
        </button>
      </form>
    );
  } else if (type === "puzzle") {
    answersContent = (
      <div className="flex w-full flex-col gap-2">
        {order.map((slot, pos) => (
          <div
            key={slot}
            className="flex items-center gap-2 rounded-2xl bg-surface-elevated px-3 py-2.5 ring-1 ring-edge landscapePhone:py-1.5"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-mid/15 text-sm font-extrabold text-brand-mid">
              {pos + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-left font-semibold text-ink-900">
              {q.answers[slot]?.text}
            </span>
            <button
              type="button"
              onClick={() => move(pos, -1)}
              disabled={locked || pos === 0}
              aria-label="Move up"
              className="min-h-touch rounded-lg px-2 py-1.5 text-lg font-bold text-muted ring-1 ring-edge hover:text-ink-900 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(pos, 1)}
              disabled={locked || pos === order.length - 1}
              aria-label="Move down"
              className="min-h-touch rounded-lg px-2 py-1.5 text-lg font-bold text-muted ring-1 ring-edge hover:text-ink-900 disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => !locked && onSubmit({ order })}
          disabled={locked}
          className="alkheelank-btn-primary mt-1 w-full disabled:opacity-40"
        >
          Submit order
        </button>
      </div>
    );
  } else {
    // mc / tf — classic positional tiles.
    answersContent = q?.answers?.map((a, i) => (
      <AnswerTile
        key={i}
        index={i}
        type={type}
        text={a.text}
        onClick={() => onSubmit({ index: i })}
        selected={selected === i}
        disabled={locked}
        staggerIndex={i}
        entranceDelay={questionIntro.tiles}
        kahoot
      />
    ));
  }

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
            {noPoints ? (
              <span className="hidden shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[0.625rem] font-extrabold text-muted ring-1 ring-edge landscapePhone:inline">
                0×
              </span>
            ) : null}
            <span className="landscapePhone:hidden">{noPoints ? "Just for fun" : TYPE_TAGLINE[type] || "Speed counts"}</span>
            <span className="hidden landscapePhone:inline">{type === "tf" ? "T / F" : type === "ms" ? "☑" : type === "type" ? "⌨" : type === "puzzle" ? "↕" : "⚡"}</span>
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
      image={starterImageSrc(q?.image)}
      animateImage
      notice={
        q?.hasHint ? (
          <div className="mx-auto mt-2 flex shrink-0 justify-center">
            {hintOpen ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md rounded-2xl bg-brand-mid/10 px-4 py-2 text-center text-sm font-semibold text-ink-900 ring-1 ring-brand-mid/30 landscapePhone:py-1.5 landscapePhone:text-xs"
              >
                🔍 {hintText ?? "…"}
              </motion.p>
            ) : (
              <button
                type="button"
                onClick={openHint}
                disabled={selected !== null || paused}
                className="min-h-touch rounded-full bg-surface-muted px-4 py-2 text-sm font-bold text-muted ring-1 ring-edge transition hover:text-ink-900 disabled:opacity-40 landscapePhone:py-1.5 landscapePhone:text-xs"
              >
                🔍 Closer Look <span className="font-normal">(−50% points)</span>
              </button>
            )}
          </div>
        ) : null
      }
      timerStrip={
        <TimerStrip
          timeLimit={q?.timeLimit}
          startedAt={q?.startedAt}
          paused={paused}
          introDelay={questionIntro.timer}
        />
      }
      answers={answersContent}
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
  const isCorrect = !!result?.correct;
  const isWrong = result?.answered && !result?.correct;

  useEffect(() => {
    if (isCorrect) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 } });
    }
  }, [isCorrect]);

  const showCorrect = !result?.correct && reveal?.index === q?.index;
  let correctAnswer = null;
  let correctStyle = null;
  if (showCorrect) {
    if (q?.type === "type" && reveal?.answerText) {
      correctAnswer = reveal.answerText;
    } else if (q?.type === "puzzle" && Array.isArray(reveal?.order)) {
      correctAnswer = reveal.order.join(" → ");
    } else if (q?.type === "ms" && Array.isArray(reveal?.correctIndices)) {
      correctAnswer = reveal.correctIndices.map((i) => q?.answers?.[i]?.text).filter(Boolean).join(", ");
    } else if (reveal?.correctIndex != null) {
      correctAnswer = q?.answers?.[reveal.correctIndex]?.text;
      correctStyle = tileStyle(q?.type, reveal.correctIndex);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: isCorrect ? 0.85 : 0.55 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.55 }}
        className={`result-flash ${isCorrect ? "result-flash--correct" : isWrong ? "result-flash--wrong" : ""}`}
        aria-hidden
      />
      <div className={`alkheelank-screen-player player-phase-fill flex items-center overflow-y-auto text-center landscapePhone:py-2 ${isWrong ? "result-shake" : ""}`}>
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="relative mx-auto my-auto w-full max-w-md px-4"
        >
          {isCorrect && result?.points > 0 && (
            <PointsPop key={result.points} points={result.points} className="top-0" />
          )}
          <GlowCard intense={isCorrect}>
            <div className="relative p-8 landscapePhone:p-4">
              <motion.h2
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className={`alkheelank-heading text-3xl landscapePhone:text-2xl ${isCorrect ? "k-shimmer-text" : isWrong ? "text-tile-triangle" : ""}`}
              >
                {title}
              </motion.h2>
              <motion.p
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, type: "spring", stiffness: 380, damping: 20 }}
                className={`mt-2 text-2xl font-bold landscapePhone:mt-1 landscapePhone:text-xl ${isCorrect ? "text-brand-mid" : ""}`}
              >
                {copy.player.result.points(result?.points ?? 0, result?.multiplier)}
              </motion.p>
          {correctAnswer && (
            <p className="mt-3 rounded-xl bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink-900 ring-1 ring-edge landscapePhone:mt-2">
              <span className="text-muted">{copy.player.result.correctWas}: </span>
              {correctStyle && <span style={{ color: correctStyle.color }}>{correctStyle.glyph}</span>} {correctAnswer}
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
          {q?.points === "none" && (
            <p className="mt-2 text-xs font-bold text-muted landscapePhone:mt-1">Just for fun — no points</p>
          )}
          {result?.usedHint && (
            <p className="mt-2 text-xs font-bold text-muted landscapePhone:mt-1">🔍 Closer Look used (−50%)</p>
          )}
          <p className="mt-4 text-muted animate-pulse landscapePhone:mt-2 landscapePhone:text-sm">{copy.player.result.watchScreen}</p>
          <ScrollHint />
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </>
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
