import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import * as GM from "./gameManager.js";
import { getQuiz, quizSummaries, validateCustomQuiz, getStarterForCopy } from "./quizzes.js";

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const origins = CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(",").map((s) => s.trim());

// Question images are sent to EVERYONE (host + players). The `image` survives
// sanitization in buildPublicQuestion (it is NOT stripped like `correct`).
// Flip to false to keep images on the host screen only (delivered via the
// host-only `host:questionImage` event instead).
const SEND_IMAGE_TO_PLAYERS = true;

// How long the game survives a host disconnect before we tear it down. Long
// enough to cover a phone/laptop hiccup or a tab reload, short enough that a
// genuinely-gone host doesn't strand players forever.
const HOST_GRACE_MS = 45_000;

const app = express();
app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ name: "AlkheelanK server", status: "ok", ...GM.stats() });
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: origins, methods: ["GET", "POST"] },
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  pingTimeout: 60_000,
  pingInterval: 25_000,
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
  io.to(gameRoom(game.pin)).emit("game:reveal", reveal);

  for (const player of game.players.values()) {
    if (player.socketId) {
      io.to(player.socketId).emit("player:result", GM.buildPlayerResult(game, player.socketId));
    }
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

function advance(game) {
  const q = GM.startNextQuestion(game);
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
  game.timer = setTimeout(() => closeQuestion(game), q.timeLimit * 1000 + 250);
}

// Re-sync a freshly (re)connected player socket to the current game phase.
function syncPlayer(game, socket) {
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
    advance(game);
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
    if (game.status === "question") closeQuestion(game);
    advance(game);
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

  // --- PLAYER -------------------------------------------------------------
  socket.on("player:peek", ({ pin } = {}, ack) => {
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

  socket.on("player:join", ({ pin, nickname, character, pid, teamId } = {}, ack) => {
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
        pid: player.pid,
        nick: player.nick,
        character: player.character,
        teamId: player.teamId,
        team: player.teamId ? game.teams.find((t) => t.id === player.teamId) : null,
        mode: game.settings.mode,
        teams: game.teams,
        quizTitle: game.quizTitle,
        reconnected: !!reconnected,
      };
      socket.emit("player:joined", ok);
      if (typeof ack === "function") ack(ok);
      emitPlayers(game);
      if (reconnected) syncPlayer(game, socket);
    };

    // 1) Reconnect by pid (the robust path — survives nickname edge cases).
    if (pid && game.players.has(pid)) {
      const player = GM.attachSocket(game, pid, socket.id, character);
      finish(player, true);
      return;
    }

    // 2) Lobby: brand-new player.
    if (game.status === "lobby") {
      const { player, error } = GM.addPlayer(game, socket.id, nickname, character, teamId);
      if (error) {
        socket.emit("player:error", { message: error });
        if (typeof ack === "function") ack({ error });
        return;
      }
      finish(player, false);
      return;
    }

    // 3) Active game: reconnect by matching nickname, restoring score + streak.
    const existing = GM.findPlayerByNick(game, nickname);
    if (existing) {
      const player = GM.attachSocket(game, existing.pid, socket.id, character);
      finish(player, true);
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AlkheelanK server listening on :${PORT}  (CORS: ${CORS_ORIGIN})`);
});
