// In-memory game state. Single-process, ephemeral — exactly what we want for a
// family/friends party game. No DB, no persistence.
//
// Sync model:
//   - room "game:PIN"  -> every socket in the game (host + all players)
//   - room "host:PIN"  -> the host socket only (host-only events)
//
// Security model:
//   - The `correct` answer index lives ONLY on the server. Player-facing
//     payloads are built by buildPublicQuestion(), which never includes it.
//     The correct index is revealed only AFTER a question closes.

import { buildFunStat, buildRevealHighlight } from "./gameStats.js";
import { getRevealTiming, sanitizePacing } from "./pacing.js";
import { securePin, secureToken } from "./crypto.js";

const games = new Map();
const MAX_NICK_LEN = 16;

export const TEAM_PRESETS = {
  kidsAdults: [
    { id: "kids", name: "Kids", color: "#0ea5e9" },
    { id: "adults", name: "Adults", color: "#f59e0b" },
  ],
  colorClash: [
    { id: "red", name: "Red Rockets", color: "#f43f5e" },
    { id: "blue", name: "Blue Blasters", color: "#0ea5e9" },
    { id: "green", name: "Green Giants", color: "#10b981" },
    { id: "gold", name: "Gold Gliders", color: "#f59e0b" },
  ],
};

export const AVATAR_BASES = [
  "sun", "bear", "moose", "pug", "cat", "hamster", "mouse", "rabbit", "fox", "wolf",
  "spark", "frog", "bunny", "robot", "lion", "owl", "seal",
  "dragon", "bee", "pup", "alien", "chick", "raccoon",
];
export const AVATAR_ACCESSORIES = [
  "none", "disguise", "crown", "bow", "plaster", "wizard", "halo", "horns", "shades",
];
export const AVATAR_COLORS = [
  "#f43f5e", "#fb923c", "#facc15", "#22c55e",
  "#10b981", "#0ea5e9", "#6366f1", "#d97706",
];
export const AVATAR_HATS = ["none", "cap", "crown", "party"];
export const AVATAR_GLASSES = ["none", "round", "shades"];
export const AVATAR_MOUTHS = ["smile", "grin", "oh"];

export const DEFAULT_AVATAR = {
  base: "sun",
  accessory: "none",
  color: "#0ea5e9",
  hat: "none",
  glasses: "none",
  mouth: "smile",
};

const BLOCKLIST = [
  "fuck", "shit", "bitch", "bastard", "asshole", "dick", "piss", "cock",
  "pussy", "cunt", "slut", "whore", "fag", "nigger", "nigga", "retard",
  "rape", "nazi", "penis", "vagina", "boobs", "porn", "sex", "anus",
  "wank", "damn", "crap", "hell",
];

function pick(list, value, fallback) {
  return list.includes(value) ? value : fallback;
}
function genId() {
  return secureToken(12);
}
function generatePin() {
  let pin;
  do pin = securePin();
  while (games.has(pin));
  return pin;
}
function normalizeForFilter(str) {
  return String(str)
    .toLowerCase()
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4|@/g, "a")
    .replace(/0/g, "o")
    .replace(/5|\$/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z]/g, "");
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isNickAllowed(nick) {
  const norm = normalizeForFilter(nick);
  if (!norm) return true;
  return !BLOCKLIST.some((word) => norm.includes(word));
}

const ACCESSORY_ALIASES = {
  party: "bow",
  headphones: "plaster",
  cap: "bow",
  medal: "plaster",
  helmet: "bow",
  beard: "plaster",
  heart: "plaster",
};

function sanitizeAvatar(cfg) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  let base = pick(AVATAR_BASES, c.base, DEFAULT_AVATAR.base);
  if (base === "mouse") base = "hamster";
  let accessory = ACCESSORY_ALIASES[c.accessory] || c.accessory;
  if (!AVATAR_ACCESSORIES.includes(accessory)) accessory = "none";
  else accessory = pick(AVATAR_ACCESSORIES, accessory, "none");
  return {
    base,
    accessory,
    color: pick(AVATAR_COLORS, c.color, DEFAULT_AVATAR.color),
    hat: pick(AVATAR_HATS, c.hat, "none"),
    glasses: pick(AVATAR_GLASSES, c.glasses, "none"),
    mouth: pick(AVATAR_MOUTHS, c.mouth, "smile"),
  };
}

function resolveTeams(settings) {
  if (settings.mode !== "teams") return [];
  const preset = TEAM_PRESETS[settings.teamPreset] || TEAM_PRESETS.kidsAdults;
  return preset.map((t) => ({ ...t }));
}

function applySettings(quiz, settings) {
  let questions = quiz.questions.map((q) => ({ ...q, answers: [...q.answers], doublePoints: !!q.doublePoints }));
  if (settings.randomizeQuestions) questions = shuffle(questions);
  if (settings.randomizeAnswers) {
    questions = questions.map((q) => {
      if (q.type === "tf") return q;
      const order = shuffle(q.answers.map((_, i) => i));
      return {
        ...q,
        answers: order.map((i) => q.answers[i]),
        correct: order.indexOf(q.correct),
      };
    });
  }
  return { ...quiz, questions };
}

export function sanitizeSettings(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const mode = o.mode === "teams" ? "teams" : "solo";
  const teamPreset = o.teamPreset && TEAM_PRESETS[o.teamPreset] ? o.teamPreset : "kidsAdults";
  return {
    mode,
    teamPreset,
    music: o.music !== false,
    randomizeQuestions: !!o.randomizeQuestions,
    randomizeAnswers: !!o.randomizeAnswers,
    speedScoring: o.speedScoring !== false,
    pacing: sanitizePacing(o.pacing),
  };
}

export function setGamePacing(game, pacing) {
  game.settings.pacing = sanitizePacing(pacing);
  return game.settings;
}

export function createGame(hostSocketId, quiz, settings) {
  const pin = generatePin();
  const safeSettings = sanitizeSettings(settings);
  const game = {
    pin,
    hostSocketId,
    hostToken: secureToken(24),
    hostConnected: true,
    hostGraceTimer: null,
    quiz: applySettings(quiz, safeSettings),
    quizTitle: quiz.title,
    settings: safeSettings,
    teams: resolveTeams(safeSettings),
    status: "lobby",
    currentIndex: -1,
    players: new Map(),
    sockets: new Map(),
    answers: new Map(),
    questionStartedAt: null,
    questionTimeLimit: null,
    paused: false,
    pausedRemaining: 0,
    timer: null,
    prevRanks: new Map(),
    // whole-game accumulators for the post-game recap:
    answerHistory: [], // { pid, index, correct, timeMs, points }
    rankHistory: [], // [ Map(pid -> rank) ] snapshotted at each question close
    lastReveal: null,
    revealStage: 0,
    lastStandings: null,
    lastFinal: null,
    createdAt: Date.now(),
  };
  games.set(pin, game);
  return game;
}

export const getGame = (pin) => games.get(String(pin || "").trim());
export function getGameByHost(hostSocketId) {
  for (const game of games.values()) if (game.hostSocketId === hostSocketId) return game;
  return null;
}
export function findGameBySocket(socketId) {
  for (const game of games.values()) if (game.sockets.has(socketId)) return game;
  return null;
}
export function destroyGame(pin) {
  const game = games.get(pin);
  if (game?.timer) clearTimeout(game.timer);
  if (game?.hostGraceTimer) clearTimeout(game.hostGraceTimer);
  games.delete(pin);
}
export const connectedCount = (game) => [...game.players.values()].filter((p) => p.connected).length;
export const playerBySocket = (game, socketId) => game.players.get(game.sockets.get(socketId));
export function findPlayerByNick(game, rawNick) {
  const nick = String(rawNick || "").trim().toLowerCase();
  for (const p of game.players.values()) if (p.nick.toLowerCase() === nick) return p;
  return null;
}
const teamById = (game, teamId) => game.teams.find((t) => t.id === teamId) || null;
function resolveTeam(game, requestedTeamId) {
  if (game.settings.mode !== "teams") return null;
  const req = String(requestedTeamId || "").trim();
  return game.teams.find((t) => t.id === req) || game.teams[0] || null;
}

export function addPlayer(game, socketId, rawNick, rawCharacter, teamId) {
  const nick = String(rawNick || "").trim().slice(0, MAX_NICK_LEN);
  if (!nick) return { error: "Please enter a nickname." };
  if (!isNickAllowed(nick)) return { error: "Please pick a friendlier nickname." };
  if (findPlayerByNick(game, nick)) return { error: "That nickname is already taken." };
  if (game.players.size >= 100) return { error: "This game is full." };
  const player = {
    pid: genId(),
    joinToken: secureToken(18),
    socketId,
    nick,
    character: sanitizeAvatar(rawCharacter),
    score: 0,
    streak: 0,
    answered: false,
    connected: true,
    teamId: resolveTeam(game, teamId)?.id || null,
  };
  game.players.set(player.pid, player);
  game.sockets.set(socketId, player.pid);
  return { player };
}
export function verifyJoinToken(game, pid, joinToken) {
  const player = game.players.get(pid);
  if (!player || !joinToken) return null;
  if (player.joinToken !== String(joinToken)) return null;
  return player;
}

export function attachSocket(game, pid, socketId, rawCharacter) {
  const player = game.players.get(pid);
  if (!player) return null;
  if (player.socketId) game.sockets.delete(player.socketId);
  player.socketId = socketId;
  player.connected = true;
  if (rawCharacter) player.character = sanitizeAvatar(rawCharacter);
  game.sockets.set(socketId, pid);
  return player;
}
export function removePlayer(game, pid) {
  const p = game.players.get(pid);
  if (p?.socketId) game.sockets.delete(p.socketId);
  game.players.delete(pid);
  game.answers.delete(pid);
  game.prevRanks.delete(pid);
}
export function markDisconnected(game, socketId) {
  const pid = game.sockets.get(socketId);
  if (!pid) return null;
  const p = game.players.get(pid);
  if (p) {
    p.connected = false;
    p.socketId = null;
  }
  game.sockets.delete(socketId);
  return p;
}

/** Lobby/player roster — omits internal ids so other clients cannot hijack sessions. */
export function playerList(game) {
  return [...game.players.values()].map((p) => ({
    pid: p.pid,
    nick: p.nick,
    character: p.character,
    score: p.score,
    connected: p.connected,
    teamId: p.teamId,
    team: p.teamId ? teamById(game, p.teamId) : null,
  }));
}
export const currentQuestion = (game) => game.quiz.questions[game.currentIndex];
export function buildPublicQuestion(game, { includeImage = false } = {}) {
  const q = currentQuestion(game);
  const payload = {
    index: game.currentIndex,
    total: game.quiz.questions.length,
    type: q.type || "mc",
    question: q.question,
    answers: q.answers.map((text) => ({ text })),
    timeLimit: q.timeLimit,
    startedAt: game.questionStartedAt,
    hasImage: !!q.image,
    paused: game.paused,
    doublePoints: !!q.doublePoints,
    mode: game.settings.mode,
    teams: game.teams,
  };
  if (includeImage && q.image) payload.image = q.image;
  return payload;
}
function snapshotRanks(game) {
  const map = new Map();
  leaderboard(game).forEach((p) => map.set(p.id, p.rank));
  return map;
}
export function startNextQuestion(game) {
  const next = game.currentIndex + 1;
  if (next >= game.quiz.questions.length) {
    game.status = "ended";
    return null;
  }
  if (next === 0) game.prevRanks = snapshotRanks(game);
  game.currentIndex = next;
  game.status = "question";
  game.answers = new Map();
  game.paused = false;
  game.pausedRemaining = 0;
  for (const p of game.players.values()) p.answered = false;
  const q = currentQuestion(game);
  game.questionTimeLimit = q.timeLimit;
  game.questionStartedAt = Date.now();
  return q;
}
export function recordAnswer(game, socketId, answerIndex) {
  if (game.status !== "question") return { ignored: "not_active" };
  if (game.paused) return { ignored: "paused" };
  const player = playerBySocket(game, socketId);
  if (!player) return { ignored: "not_player" };
  if (game.answers.has(player.pid)) return { ignored: "already_answered" };
  const q = currentQuestion(game);
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= q.answers.length) return { ignored: "bad_index" };
  const elapsedMs = Date.now() - game.questionStartedAt;
  if (elapsedMs > game.questionTimeLimit * 1000) return { ignored: "too_late" };
  const correct = answerIndex === q.correct;
  let base = 0;
  let bonus = 0;
  if (correct) {
    if (game.settings.speedScoring) {
      const rem = Math.max(0, game.questionTimeLimit - elapsedMs / 1000);
      base = Math.round(1000 * (0.5 + 0.5 * (rem / game.questionTimeLimit)));
    } else base = 1000;
    player.streak += 1;
    bonus = Math.min((player.streak - 1) * 100, 500);
  } else player.streak = 0;
  const multiplier = q.doublePoints ? 2 : 1;
  const points = (base + bonus) * multiplier;
  player.score += points;
  player.answered = true;
  game.answers.set(player.pid, { index: answerIndex, points, base, bonus, multiplier, correct, timeMs: elapsedMs });
  // Whole-game log for the recap (fastest finger / confident wrong, etc.).
  game.answerHistory.push({ pid: player.pid, index: game.currentIndex, correct, timeMs: elapsedMs, points });
  return { player, correct, points, bonus, answeredCount: game.answers.size, totalPlayers: connectedCount(game) };
}

/** Post-answer waiting UI: pace + speed rank from live answer timings. */
export function buildAnswerLocked(game, pid) {
  const entry = game.answers.get(pid);
  if (!entry) return null;
  const limitMs = game.questionTimeLimit * 1000;
  const { timeMs } = entry;
  const times = [...game.answers.values()].map((a) => a.timeMs).sort((a, b) => a - b);
  const speedRank = times.indexOf(timeMs) + 1;
  const FAST_MS = 2000;
  const lateThresholdMs = limitMs * 0.82;

  let pace = "normal";
  if (timeMs <= FAST_MS || speedRank <= 3) pace = "fast";
  else if (timeMs >= lateThresholdMs) pace = "late";

  return {
    answerIndex: entry.index,
    waitContext: {
      pace,
      timeMs,
      speedRank,
      answeredSoFar: game.answers.size,
      timeLimitSec: game.questionTimeLimit,
    },
  };
}

export function allAnswered(game) {
  const connected = [...game.players.values()].filter((p) => p.connected);
  return connected.length > 0 && connected.every((p) => game.answers.has(p.pid));
}
export function pauseGame(game) {
  if (game.status !== "question" || game.paused) return false;
  if (game.timer) clearTimeout(game.timer);
  game.timer = null;
  const elapsed = Date.now() - game.questionStartedAt;
  game.pausedRemaining = Math.max(0, game.questionTimeLimit * 1000 - elapsed);
  game.paused = true;
  return true;
}
export function resumeGame(game, onExpire) {
  if (!game.paused) return null;
  const consumed = game.questionTimeLimit * 1000 - game.pausedRemaining;
  game.questionStartedAt = Date.now() - consumed;
  game.paused = false;
  game.timer = setTimeout(onExpire, game.pausedRemaining + 250);
  return game.questionStartedAt;
}

export function leaderboard(game) {
  return [...game.players.values()]
    .sort((a, b) => b.score - a.score || a.nick.localeCompare(b.nick))
    .map((p, i) => ({
      id: p.pid,
      nick: p.nick,
      character: p.character,
      score: p.score,
      rank: i + 1,
      connected: p.connected,
      teamId: p.teamId,
      team: p.teamId ? teamById(game, p.teamId) : null,
    }));
}
export function teamStandings(game) {
  if (game.settings.mode !== "teams") return [];
  const map = new Map(game.teams.map((t) => [t.id, { ...t, score: 0, members: [] }]));
  for (const p of game.players.values()) {
    const row = map.get(p.teamId);
    if (!row) continue;
    row.score += p.score;
    row.members.push({ id: p.pid, nick: p.nick, score: p.score, connected: p.connected, character: p.character });
  }
  return [...map.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((t, i) => ({ ...t, rank: i + 1 }));
}
export function answerCounts(game) {
  const q = currentQuestion(game);
  const counts = new Array(q.answers.length).fill(0);
  for (const a of game.answers.values()) counts[a.index] += 1;
  return counts;
}

/** Players who chose the correct answer — for the host social reveal (avatars on tile). */
export function revealCorrectPlayers(game) {
  const rows = [];
  for (const [pid, ans] of game.answers) {
    if (!ans.correct) continue;
    const p = game.players.get(pid);
    if (!p) continue;
    rows.push({
      id: p.pid,
      nick: p.nick,
      character: p.character,
      timeMs: ans.timeMs,
    });
  }
  rows.sort((a, b) => a.timeMs - b.timeMs);
  return rows.map(({ id, nick, character }) => ({ id, nick, character }));
}

export function buildReveal(game) {
  const q = currentQuestion(game);
  game.revealStage = 0;
  return {
    index: game.currentIndex,
    type: q.type || "mc",
    correctIndex: q.correct,
    counts: answerCounts(game),
    correctPlayers: revealCorrectPlayers(game),
    totalAnswers: game.answers.size,
    totalPlayers: connectedCount(game),
    hasNext: game.currentIndex + 1 < game.quiz.questions.length,
    doublePoints: !!q.doublePoints,
    mode: game.settings.mode,
    teamStandings: teamStandings(game),
    pacing: game.settings.pacing,
    timing: getRevealTiming(game.settings.pacing),
    highlight: buildRevealHighlight(game),
    revealStage: game.revealStage,
  };
}

export function advanceRevealStage(game) {
  if (game.status !== "reveal") return null;
  game.revealStage = Math.min(2, (game.revealStage ?? 0) + 1);
  if (game.lastReveal) {
    game.lastReveal = { ...game.lastReveal, revealStage: game.revealStage };
  }
  return { index: game.currentIndex, revealStage: game.revealStage };
}
export function buildStandings(game) {
  const board = leaderboard(game);
  const standings = board.map((p) => {
    const prevRank = game.prevRanks.get(p.id) ?? p.rank;
    return { ...p, prevRank, delta: prevRank - p.rank, streak: game.players.get(p.id)?.streak ?? 0 };
  });
  game.prevRanks = new Map(board.map((p) => [p.id, p.rank]));
  return {
    index: game.currentIndex,
    total: game.quiz.questions.length,
    standings,
    teamStandings: teamStandings(game),
    mode: game.settings.mode,
    hasNext: game.currentIndex + 1 < game.quiz.questions.length,
    funStat: buildFunStat(game, standings),
  };
}
export function buildPlayerResult(game, socketId) {
  const board = leaderboard(game);
  const p = playerBySocket(game, socketId);
  const me = p ? board.find((x) => x.id === p.pid) : null;
  const ans = p ? game.answers.get(p.pid) : null;
  const prevRank = me ? game.prevRanks.get(me.id) ?? me.rank : null;
  const q = currentQuestion(game);
  return {
    answered: !!ans,
    correct: ans?.correct ?? false,
    points: ans?.points ?? 0,
    bonus: ans?.bonus ?? 0,
    multiplier: ans?.multiplier ?? (q?.doublePoints ? 2 : 1),
    totalScore: me?.score ?? 0,
    rank: me?.rank ?? connectedCount(game),
    prevRank: prevRank ?? me?.rank ?? null,
    totalPlayers: game.players.size,
    streak: p?.streak ?? 0,
    mode: game.settings.mode,
    teamId: p?.teamId ?? null,
    team: p?.teamId ? teamById(game, p.teamId) : null,
  };
}

// Snapshot the current ranking. Called once per question close so the recap can
// work out who climbed the most over the whole game (biggest comeback).
export function recordRanks(game) {
  game.rankHistory.push(snapshotRanks(game));
}

// Post-game recap: the shareable fun stats, derived from the whole-game
// accumulators. Any stat can be null if the game didn't produce it.
export function buildRecap(game) {
  const board = leaderboard(game);
  const byPid = new Map(board.map((p) => [p.id, p]));
  const meta = (pid) => ({
    nick: byPid.get(pid)?.nick ?? "Player",
    character: byPid.get(pid)?.character ?? DEFAULT_AVATAR,
  });

  let fastest = null;
  let confident = null;
  for (const a of game.answerHistory) {
    if (a.correct) {
      if (!fastest || a.timeMs < fastest.timeMs) fastest = a;
    } else if (!confident || a.timeMs < confident.timeMs) {
      confident = a;
    }
  }

  let comeback = null;
  for (const p of board) {
    let worst = p.rank;
    for (const snap of game.rankHistory) {
      const r = snap.get(p.id);
      if (r != null && r > worst) worst = r;
    }
    const gained = worst - p.rank;
    if (gained > 0 && (!comeback || gained > comeback.gained)) {
      comeback = { pid: p.id, gained };
    }
  }

  const winner = board[0] || null;
  return {
    winner: winner
      ? { nick: winner.nick, character: winner.character, score: winner.score }
      : null,
    fastestFinger: fastest ? { ...meta(fastest.pid), timeMs: fastest.timeMs } : null,
    mostConfidentWrong: confident ? { ...meta(confident.pid), timeMs: confident.timeMs } : null,
    biggestComeback: comeback ? { ...meta(comeback.pid), gained: comeback.gained } : null,
    totalQuestions: game.quiz.questions.length,
    totalPlayers: game.players.size,
  };
}

export function buildFinal(game) {
  const board = leaderboard(game);
  const teams = teamStandings(game);
  return {
    podium: board.slice(0, 3),
    standings: board,
    teamPodium: teams.slice(0, 3),
    teamStandings: teams,
    mode: game.settings.mode,
    teams: game.teams,
    title: game.quizTitle,
    recap: buildRecap(game),
  };
}
export function buildHostState(game) {
  return {
    pin: game.pin,
    hostToken: game.hostToken,
    settings: game.settings,
    status: game.status,
    paused: game.paused,
    quiz: { title: game.quizTitle, questionCount: game.quiz.questions.length },
    players: playerList(game),
    teams: game.teams,
    mode: game.settings.mode,
    answerCount: { answered: game.answers.size, total: connectedCount(game) },
    question: game.currentIndex >= 0 && game.status !== "ended" ? buildPublicQuestion(game, { includeImage: true }) : null,
    reveal: game.lastReveal,
    standings: game.lastStandings,
    final: game.lastFinal,
  };
}
export function buildJoinMeta(game) {
  return {
    pin: game.pin,
    mode: game.settings.mode,
    teams: game.teams,
    quizTitle: game.quizTitle,
    status: game.status,
  };
}
export const stats = () => ({ activeGames: games.size });
