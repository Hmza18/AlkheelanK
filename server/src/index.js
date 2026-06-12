import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import * as GM from "./gameManager.js";
import { getQuiz, quizSummaries, validateCustomQuiz, getStarterForCopy } from "./quizzes.js";
import { createRateLimiter, clientKey } from "./rateLimit.js";
import { generateQuiz, isAiConfigured } from "./ai.js";
import { searchImages } from "./imageSearch.js";

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const configuredOrigins =
  CORS_ORIGIN === "*" ? [] : CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (CORS_ORIGIN === "*") return true;
  if (configuredOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname === "alkheelan.xyz" || hostname.endsWith(".alkheelan.xyz")) return true;
    if (hostname.endsWith(".vercel.app") && hostname.includes("alkheelan")) return true;
  } catch {
    return false;
  }
  return false;
}

const corsOrigin =
  CORS_ORIGIN === "*"
    ? "*"
    : (origin, callback) => {
        if (isAllowedOrigin(origin)) callback(null, origin || true);
        else callback(new Error("Not allowed by CORS"));
      };

// Question images are sent to EVERYONE (host + players). The `image` survives
// sanitization in buildPublicQuestion (it is NOT stripped like `correct`).
// Flip to false to keep images on the host screen only (delivered via the
// host-only `host:questionImage` event instead).
const SEND_IMAGE_TO_PLAYERS = true;
const DOUBLE_POINTS_WARNING_MS = 2200;

// Synced 3-2-1-GO! on every screen between "Let's play" and the first question.
const COUNTDOWN_MS = 3200;
// Hold the question clock while clients play the entrance choreography
// (prompt → image → tiles → timer). Keep in sync with `questionIntro` in
// client/src/lib/motion.js.
const QUESTION_INTRO_MS = 900;

// How long the game survives a host disconnect before we tear it down. Long
// enough to cover a phone/laptop hiccup or a tab reload, short enough that a
// genuinely-gone host doesn't strand players forever.
const HOST_GRACE_MS = 45_000;

const limitHostCreate = createRateLimiter({ windowMs: 60_000, max: 8 });
const limitPlayerPeek = createRateLimiter({ windowMs: 60_000, max: 40 });
const limitPlayerJoin = createRateLimiter({ windowMs: 60_000, max: 30 });
const limitGenerate = createRateLimiter({ windowMs: 60_000, max: 4 });
const limitImageSearch = createRateLimiter({ windowMs: 60_000, max: 20 });

function httpClientKey(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) {
    // Take the last (proxy-appended) entry to prevent client X-Forwarded-For spoofing.
    const ips = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    return ips[ips.length - 1];
  }
  return req.ip || "unknown";
}

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.json({ name: "Alkheeloot server", status: "ok", ...GM.stats() });
});

app.get("/quizzes", (_req, res) => {
  res.json(quizSummaries());
});

// Full starter quiz (with questions) so a host can duplicate it into their
// account and edit it.
app.get("/quizzes/:id", (req, res) => {
  const quiz = getStarterForCopy(req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found." });
  res.json(quiz);
});

// Editor feature flags — lets the client hide buttons for unconfigured features.
app.get("/features", (_req, res) => {
  res.json({ aiGeneration: isAiConfigured() });
});

// AI quiz generation. Returns { title, questions } in the editor shape.
app.post("/generate-quiz", async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ error: "AI generation isn't set up on this server." });
  }
  if (!limitGenerate(httpClientKey(req))) {
    return res.status(429).json({ error: "Too many generations — wait a minute and try again." });
  }
  try {
    const { topic, count, audience, language } = req.body || {};
    const result = await generateQuiz({ topic, count, audience, language });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.data);
  } catch (err) {
    console.error("generate-quiz failed:", err?.message || err);
    res.status(502).json({ error: "Generation failed — try again in a moment." });
  }
});

// Image search for the editor (proxied through Openverse).
app.get("/image-search", async (req, res) => {
  if (!limitImageSearch(httpClientKey(req))) {
    return res.status(429).json({ error: "Too many searches — wait a moment." });
  }
  const result = await searchImages(req.query.q);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.data);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  pingTimeout: 60_000,
  pingInterval: 25_000,
  // 4 MB: allows up to ~2 MB of base64 images (validated in validateCustomQuiz)
  // plus JSON overhead for 30 questions, titles, and metadata.
  maxHttpBufferSize: 4e6,
});

const gameRoom = (pin) => `game:${pin}`;
const hostRoom = (pin) => `host:${pin}`;

// Broadcast the live answer-count to the host only.
function emitAnswerCount(game) {
  io.to(hostRoom(game.pin)).emit("host:answerCount", {
    answered: game.answers.size,
    total: GM.connectedCount(game),
  });
}

function emitPlayers(game) {
  io.to(gameRoom(game.pin)).emit("game:players", GM.playerList(game));
}

// Close the current question: stop the timer, reveal to everyone, send each
// player their private result. Caches the reveal so a reconnecting client can
// be re-synced.
function closeQuestion(game) {
  if (game.status !== "question") return;
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  game.paused = false;
  game.status = "reveal";

  const reveal = GM.buildReveal(game);
  game.lastReveal = reveal;
  GM.recordRanks(game); // snapshot ranking for the post-game comeback stat
  GM.recordQuestionStats(game); // snapshot per-question results for the host breakdown
  io.to(gameRoom(game.pin)).emit("game:reveal", reveal);

  for (const socketId of game.sockets.keys()) {
    io.to(socketId).emit("player:result", GM.buildPlayerResult(game, socketId));
  }
}

// Reveal -> standings: compute movement and broadcast the animated scoreboard.
function showStandings(game) {
  if (game.status !== "reveal") return;
  game.status = "standings";
  const standings = GM.buildStandings(game);
  game.lastStandings = standings;
  io.to(gameRoom(game.pin)).emit("game:standings", standings);
}

function buildDoublePointsWarning(game, nextIndex) {
  return {
    index: nextIndex,
    total: game.quiz.questions.length,
    durationMs: DOUBLE_POINTS_WARNING_MS,
  };
}

// Lobby → first question: broadcast a server-timed countdown, then advance.
// Clients derive 3/2/1/GO locally from startedAt so all screens stay in step.
function startCountdown(game) {
  game.status = "countdown";
  game.countdown = { startedAt: Date.now(), durationMs: COUNTDOWN_MS };
  io.to(gameRoom(game.pin)).emit("game:countdown", game.countdown);
  game.timer = setTimeout(() => {
    game.countdown = null;
    advance(game);
  }, COUNTDOWN_MS);
}

function advance(game, { skipDoubleWarning = false } = {}) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  const nextIndex = game.currentIndex + 1;
  const nextQuestion = game.quiz.questions[nextIndex];
  if (!skipDoubleWarning && nextQuestion?.doublePoints) {
    game.status = "double-warning";
    const warning = buildDoublePointsWarning(game, nextIndex);
    io.to(gameRoom(game.pin)).emit("game:doublePointsWarning", warning);
    game.timer = setTimeout(() => advance(game, { skipDoubleWarning: true }), DOUBLE_POINTS_WARNING_MS);
    return;
  }
  const q = GM.startNextQuestion(game, QUESTION_INTRO_MS);
  if (!q) {
    const final = GM.buildFinal(game);
    game.lastFinal = final;
    io.to(gameRoom(game.pin)).emit("game:final", final);
    return;
  }
  game.lastReveal = null;
  game.lastStandings = null;
  const publicQ = GM.buildPublicQuestion(game, { includeImage: SEND_IMAGE_TO_PLAYERS });
  io.to(gameRoom(game.pin)).emit("game:question", publicQ);

  // When images stay off phones, deliver the image to the host screen only.
  if (!SEND_IMAGE_TO_PLAYERS && q.image) {
    io.to(hostRoom(game.pin)).emit("host:questionImage", {
      index: game.currentIndex,
      image: q.image,
    });
  }

  emitAnswerCount(game);
  game.timer = setTimeout(() => closeQuestion(game), q.timeLimit * 1000 + QUESTION_INTRO_MS + 250);
}

// Re-sync a freshly (re)connected player socket to the current game phase.
function syncPlayer(game, socket) {
  // A rejoining player may have missed the host dropping (or coming back).
  socket.emit("game:hostStatus", { connected: game.hostConnected });
  switch (game.status) {
    case "question": {
      socket.emit("game:question", GM.buildPublicQuestion(game, { includeImage: SEND_IMAGE_TO_PLAYERS }));
      const player = GM.playerBySocket(game, socket.id);
      if (player && game.answers.has(player.pid)) {
        const locked = GM.buildAnswerLocked(game, player.pid);
        if (locked) socket.emit("player:answerLocked", locked);
      }
      if (game.paused) socket.emit("game:paused");
      break;
    }
    case "reveal": {
      if (game.lastReveal) socket.emit("game:reveal", game.lastReveal);
      if (game.revealStage > 0) {
        socket.emit("game:revealStage", {
          index: game.currentIndex,
          revealStage: game.revealStage,
        });
      }
      socket.emit("player:result", GM.buildPlayerResult(game, socket.id));
      break;
    }
    case "standings": {
      if (game.lastReveal) socket.emit("game:reveal", game.lastReveal);
      socket.emit("player:result", GM.buildPlayerResult(game, socket.id));
      if (game.lastStandings) socket.emit("game:standings", game.lastStandings);
      break;
    }
    case "double-warning": {
      socket.emit("game:doublePointsWarning", buildDoublePointsWarning(game, game.currentIndex + 1));
      break;
    }
    case "countdown": {
      if (game.countdown) socket.emit("game:countdown", game.countdown);
      break;
    }
    case "ended": {
      if (game.lastFinal) socket.emit("game:final", game.lastFinal);
      break;
    }
    default:
      break; // lobby — game:players broadcast covers it
  }
}

io.on("connection", (socket) => {
  // --- HOST ---------------------------------------------------------------
  socket.on("host:create", ({ quizId, quiz, settings } = {}, ack) => {
    const ip = clientKey(socket);
    if (!limitHostCreate(ip)) {
      const message = "Too many games started. Wait a minute and try again.";
      socket.emit("host:error", { message });
      if (typeof ack === "function") ack({ error: message });
      return;
    }
    let chosen;
    if (quiz) {
      const { quiz: valid, error } = validateCustomQuiz(quiz);
      if (error) {
        socket.emit("host:error", { message: error });
        if (typeof ack === "function") ack({ error });
        return;
      }
      chosen = valid;
    } else {
      chosen = getQuiz(quizId);
    }
    const game = GM.createGame(socket.id, chosen, settings);
    socket.join(gameRoom(game.pin));
    socket.join(hostRoom(game.pin));
    const payload = {
      pin: game.pin,
      hostToken: game.hostToken,
      settings: game.settings,
      quiz: { title: game.quizTitle, questionCount: chosen.questions.length },
    };
    socket.emit("host:created", payload);
    if (typeof ack === "function") ack(payload);
  });

  // Host re-binds to an in-progress game after a brief drop. Requires the
  // hostToken issued at create time so a random socket can't hijack a game.
  socket.on("host:reconnect", ({ pin, hostToken } = {}, ack) => {
    const game = GM.getGame(pin);
    if (!game || game.hostToken !== hostToken) {
      const error = "Couldn't restore the host session.";
      socket.emit("host:error", { message: error });
      if (typeof ack === "function") ack({ error });
      return;
    }
    if (game.hostGraceTimer) {
      clearTimeout(game.hostGraceTimer);
      game.hostGraceTimer = null;
    }
    game.hostSocketId = socket.id;
    game.hostConnected = true;
    socket.join(gameRoom(game.pin));
    socket.join(hostRoom(game.pin));
    io.to(gameRoom(game.pin)).emit("game:hostStatus", { connected: true });
    if (game.hostDisconnectPaused) {
      const startedAt = GM.resumeGame(game, () => closeQuestion(game));
      game.hostDisconnectPaused = false;
      if (startedAt) {
        io.to(gameRoom(game.pin)).emit("game:resumed", { startedAt });
      }
    }
    // Timed beats are held while the host is away (see disconnect handler) —
    // restart them now so the game never advances into a hostless question.
    if (game.status === "double-warning" && !game.timer) {
      io.to(gameRoom(game.pin)).emit(
        "game:doublePointsWarning",
        buildDoublePointsWarning(game, game.currentIndex + 1),
      );
      game.timer = setTimeout(() => advance(game, { skipDoubleWarning: true }), DOUBLE_POINTS_WARNING_MS);
    } else if (game.status === "countdown" && !game.timer) {
      startCountdown(game); // re-runs the 3-2-1 fresh for everyone
    }
    const state = GM.buildHostState(game);
    socket.emit("host:state", state);
    if (typeof ack === "function") ack(state);
  });

  socket.on("host:start", () => {
    const game = GM.getGameByHost(socket.id);
    if (!game || game.status !== "lobby") return;
    if (game.players.size === 0) {
      socket.emit("host:error", { message: "Need at least one player to start." });
      return;
    }
    startCountdown(game);
  });

  // Host closes a question early ("Skip to results").
  socket.on("host:closeQuestion", () => {
    const game = GM.getGameByHost(socket.id);
    if (game) closeQuestion(game);
  });

  // Reveal -> standings.
  socket.on("host:standings", () => {
    const game = GM.getGameByHost(socket.id);
    if (game) showStandings(game);
  });

  socket.on("host:advanceReveal", () => {
    const game = GM.getGameByHost(socket.id);
    if (!game) return;
    const payload = GM.advanceRevealStage(game);
    if (payload) io.to(gameRoom(game.pin)).emit("game:revealStage", payload);
  });

  socket.on("host:setPacing", ({ pacing } = {}) => {
    const game = GM.getGameByHost(socket.id);
    if (!game) return;
    GM.setGamePacing(game, pacing);
    io.to(gameRoom(game.pin)).emit("game:settings", { settings: game.settings });
  });

  // Standings -> next question (or final).
  socket.on("host:next", () => {
    const game = GM.getGameByHost(socket.id);
    if (!game) return;
    if (game.status === "question") {
      closeQuestion(game);
      return;
    }
    if (game.status === "reveal") {
      showStandings(game);
      return;
    }
    if (game.status === "standings") advance(game);
  });

  socket.on("host:pause", () => {
    const game = GM.getGameByHost(socket.id);
    if (game && GM.pauseGame(game)) {
      io.to(gameRoom(game.pin)).emit("game:paused");
    }
  });

  socket.on("host:resume", () => {
    const game = GM.getGameByHost(socket.id);
    if (!game || !game.paused) return;
    const startedAt = GM.resumeGame(game, () => closeQuestion(game));
    io.to(gameRoom(game.pin)).emit("game:resumed", { startedAt });
  });

  socket.on("host:end", () => {
    const game = GM.getGameByHost(socket.id);
    if (!game) return;
    io.to(gameRoom(game.pin)).emit("game:ended", { reason: "Host ended the game." });
    GM.destroyGame(game.pin);
  });

  socket.on("host:lockLobby", ({ locked } = {}) => {
    const game = GM.getGameByHost(socket.id);
    if (!game) return;
    if (!GM.setLobbyLocked(game, locked)) {
      socket.emit("host:error", { message: "Lobby lock can only be changed before the game starts." });
      return;
    }
    io.to(gameRoom(game.pin)).emit("game:lobbyLock", { locked: game.lobbyLocked });
  });

  socket.on("host:kickPlayer", ({ pid } = {}) => {
    const game = GM.getGameByHost(socket.id);
    if (!game || game.status !== "lobby") {
      socket.emit("host:error", { message: "Players can only be removed from the lobby." });
      return;
    }
    const { removed, socketId } = GM.kickPlayer(game, pid);
    if (!removed) {
      socket.emit("host:error", { message: "Couldn't remove that player." });
      return;
    }
    if (socketId) {
      io.to(socketId).emit("player:kicked", { reason: "The host removed you from the lobby." });
      const kicked = io.sockets.sockets.get(socketId);
      if (kicked) kicked.leave(gameRoom(game.pin));
    }
    emitPlayers(game);
  });

  // --- PLAYER -------------------------------------------------------------
  socket.on("player:peek", ({ pin } = {}, ack) => {
    if (!limitPlayerPeek(clientKey(socket))) {
      const err = { message: "Too many attempts. Wait a moment and try again." };
      if (typeof ack === "function") ack({ error: err.message });
      socket.emit("player:error", err);
      return;
    }
    const game = GM.getGame(pin);
    if (!game) {
      const err = { message: "No game found with that PIN." };
      if (typeof ack === "function") ack({ error: err.message });
      socket.emit("player:error", err);
      return;
    }
    const meta = GM.buildJoinMeta(game);
    if (typeof ack === "function") ack(meta);
    socket.emit("player:meta", meta);
  });

  socket.on("player:join", ({ pin, nickname, character, pid, joinToken, teamId } = {}, ack) => {
    if (!limitPlayerJoin(clientKey(socket))) {
      const err = { message: "Too many join attempts. Wait a moment and try again." };
      socket.emit("player:error", err);
      if (typeof ack === "function") ack({ error: err.message });
      return;
    }
    const game = GM.getGame(pin);
    if (!game) {
      const err = { message: "No game found with that PIN." };
      socket.emit("player:error", err);
      if (typeof ack === "function") ack({ error: err.message });
      return;
    }

    const finish = (player, reconnected) => {
      socket.join(gameRoom(game.pin));
      const ok = {
        id: player.pid,
        pid: player.pid,
        joinToken: player.joinToken,
        nick: player.nick,
        character: player.character,
        teamId: player.teamId,
        team: player.teamId ? game.teams.find((t) => t.id === player.teamId) : null,
        mode: game.settings.mode,
        teams: game.teams,
        quizTitle: game.quizTitle,
        gameStatus: game.status,
        reconnected: !!reconnected,
      };
      socket.emit("player:joined", ok);
      if (typeof ack === "function") ack(ok);
      emitPlayers(game);
      if (reconnected) syncPlayer(game, socket);
    };

    // 1) Reconnect with pid + joinToken (issued only to this player on first join).
    if (pid) {
      const player = GM.verifyJoinToken(game, pid, joinToken);
      if (!player) {
        const err = { message: "Couldn't verify your player session. Rejoin with your nickname in the lobby, or use the same device after refresh." };
        socket.emit("player:error", err);
        if (typeof ack === "function") ack({ error: err.message });
        return;
      }
      GM.attachSocket(game, pid, socket.id, character);
      finish(player, true);
      return;
    }

    // 2) Lobby: brand-new player.
    if (game.status === "lobby") {
      if (game.lobbyLocked) {
        const err = { message: "The host locked the room. Ask them to unlock it so you can join." };
        socket.emit("player:error", err);
        if (typeof ack === "function") ack({ error: err.message });
        return;
      }
      const { player, error } = GM.addPlayer(game, socket.id, nickname, character, teamId);
      if (error) {
        socket.emit("player:error", { message: error });
        if (typeof ack === "function") ack({ error });
        return;
      }
      finish(player, false);
      return;
    }

    const err = { message: "This game has already started." };
    socket.emit("player:error", err);
    if (typeof ack === "function") ack({ error: err.message });
  });

  socket.on("player:answer", ({ answerIndex } = {}) => {
    const game = GM.findGameBySocket(socket.id);
    if (!game) return;
    const res = GM.recordAnswer(game, socket.id, answerIndex);
    const player = GM.playerBySocket(game, socket.id);
    if (res.ignored) {
      if (res.ignored === "already_answered" && player) {
        const locked = GM.buildAnswerLocked(game, player.pid);
        if (locked) socket.emit("player:answerLocked", locked);
      }
      return;
    }
    if (player) {
      const locked = GM.buildAnswerLocked(game, player.pid);
      if (locked) socket.emit("player:answerLocked", locked);
    }
    emitAnswerCount(game);
    if (GM.allAnswered(game)) closeQuestion(game);
  });

  // --- DISCONNECT ---------------------------------------------------------
  socket.on("disconnect", () => {
    // Host dropped: give them a grace window to reconnect before tearing down.
    const hosted = GM.getGameByHost(socket.id);
    if (hosted) {
      hosted.hostConnected = false;
      io.to(gameRoom(hosted.pin)).emit("game:hostStatus", { connected: false });
      if (hosted.status === "question" && !hosted.paused && GM.pauseGame(hosted)) {
        hosted.hostDisconnectPaused = true;
        io.to(gameRoom(hosted.pin)).emit("game:paused");
      }
      // Hold timed beats (3-2-1 countdown, double-points warning) so they don't
      // advance into a question while the host screen is gone. host:reconnect
      // restarts them.
      if ((hosted.status === "countdown" || hosted.status === "double-warning") && hosted.timer) {
        clearTimeout(hosted.timer);
        hosted.timer = null;
      }
      if (hosted.hostGraceTimer) clearTimeout(hosted.hostGraceTimer);
      hosted.hostGraceTimer = setTimeout(() => {
        io.to(gameRoom(hosted.pin)).emit("game:ended", { reason: "The host disconnected." });
        GM.destroyGame(hosted.pin);
      }, HOST_GRACE_MS);
      return;
    }

    const game = GM.findGameBySocket(socket.id);
    if (!game) return;

    if (game.status === "lobby") {
      // In the lobby there's no score to keep — drop them and free the nickname.
      const pid = game.sockets.get(socket.id);
      if (pid) GM.removePlayer(game, pid);
      emitPlayers(game);
    } else {
      // Mid-game: keep their state so they can rejoin with the same nickname.
      GM.markDisconnected(game, socket.id);
      emitPlayers(game);
      // We may have been the last one the question was waiting on.
      if (game.status === "question" && GM.allAnswered(game)) closeQuestion(game);
    }
  });
});

// Purge games that have been alive for more than 6 hours.  Games are ephemeral
// in-memory state so we can safely evict anything that old — normal sessions
// last minutes, not hours.  This prevents a slow memory leak from abandoned or
// never-ended games (host creates game, closes the tab, never calls host:end).
const GAME_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours
const GAME_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // check every 15 minutes
setInterval(() => {
  const pins = GM.expiredGamePins(GAME_MAX_AGE_MS);
  for (const pin of pins) {
    io.to(gameRoom(pin)).emit("game:ended", { reason: "Game expired." });
    GM.destroyGame(pin);
  }
  if (pins.length) console.log(`[cleanup] removed ${pins.length} expired game(s)`);
}, GAME_CLEANUP_INTERVAL_MS).unref();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Alkheeloot server listening on :${PORT}  (CORS: ${CORS_ORIGIN})`);
});
