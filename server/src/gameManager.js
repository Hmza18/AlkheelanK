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
// Revealing a question's "Closer Look" hint keeps only this fraction of the
// points a correct answer would otherwise earn.
const HINT_PENALTY = 0.5;

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

// Type-answer matching: forgiving but not sloppy. Lowercases, strips accents and
// most punctuation, and collapses whitespace so "St. Tropez" ≈ "st tropez".
function normalizeText(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A shuffled presentation order for a puzzle question that is guaranteed not to
// already be the correct (identity) order when there's more than one option.
function puzzlePresentation(n) {
  if (n <= 1) return [0];
  let order;
  do {
    order = shuffle(Array.from({ length: n }, (_, i) => i));
  } while (order.every((v, i) => v === i));
  return order;
}

const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

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
  let questions = quiz.questions.map((q) => ({
    ...q,
    answers: [...q.answers],
    correct: Array.isArray(q.correct) ? [...q.correct] : q.correct,
    doublePoints: !!q.doublePoints,
  }));
  if (settings.randomizeQuestions) questions = shuffle(questions);
  if (settings.randomizeAnswers) {
    questions = questions.map((q) => {
      // tf has fixed tiles; puzzle shuffles its presentation at play time; type
      // has no positional answers to shuffle.
      if (q.type === "tf" || q.type === "puzzle" || q.type === "type") return q;
      const order = shuffle(q.answers.map((_, i) => i));
      const answers = order.map((i) => q.answers[i]);
      if (q.type === "ms") {
        const correctSet = new Set(q.correct);
        const correct = [];
        order.forEach((origIdx, pos) => {
          if (correctSet.has(origIdx)) correct.push(pos);
        });
        return { ...q, answers, correct };
      }
      return { ...q, answers, correct: order.indexOf(q.correct) };
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
    lobbyLocked: false,
    countdown: null, // { startedAt, durationMs } during the pre-game 3-2-1
    currentIndex: -1,
    players: new Map(),
    sockets: new Map(),
    answers: new Map(),
    questionStartedAt: null,
    questionTimeLimit: null,
    hintsUsed: new Set(), // pids who revealed the current question's hint
    paused: false,
    pausedRemaining: 0,
    timer: null,
    prevRanks: new Map(),
    // whole-game accumulators for the post-game recap:
    answerHistory: [], // { pid, index, correct, timeMs, points }
    rankHistory: [], // [ Map(pid -> rank) ] snapshotted at each question close
    questionStats: [], // per-question results snapshot for the host breakdown
    lastReveal: null,
    revealStage: 0,
    lastStandings: null,
    lastFinal: null,
    createdAt: Date.now(),
  };
  games.set(pin, game);
  return game;
}

function normalizePin(pin) {
  const digits = String(pin ?? "").replace(/\D/g, "").slice(0, 6);
  return digits.length === 6 ? digits : null;
}

export const getGame = (pin) => {
  const key = normalizePin(pin);
  return key ? games.get(key) : null;
};
export function getGameByHost(hostSocketId) {
  let newest = null;
  for (const game of games.values()) {
    if (game.hostSocketId !== hostSocketId) continue;
    if (!newest || game.createdAt > newest.createdAt) newest = game;
  }
  return newest;
}

/** All in-memory games owned by a host socket (newest first). */
export function listGamesByHost(hostSocketId) {
  return [...games.values()]
    .filter((g) => g.hostSocketId === hostSocketId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function destroyGamesByHost(hostSocketId) {
  for (const [pin, game] of games.entries()) {
    if (game.hostSocketId === hostSocketId) destroyGame(pin);
  }
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
export function shouldBroadcastGameEnded(game) {
  // Finalized games already delivered game:final; a later game:ended event
  // would force players off the recap/share screen during normal cleanup.
  return game?.status !== "ended";
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

export function updatePlayerCharacter(game, socketId, rawCharacter) {
  const pid = game.sockets.get(socketId);
  if (!pid) return { error: "Not in a game." };
  const player = game.players.get(pid);
  if (!player) return { error: "Player not found." };
  if (game.status === "ended") return { error: "Game is over." };
  player.character = sanitizeAvatar(rawCharacter);
  return { character: player.character };
}
export function removePlayer(game, pid) {
  const p = game.players.get(pid);
  if (p?.socketId) game.sockets.delete(p.socketId);
  game.players.delete(pid);
  game.answers.delete(pid);
  game.prevRanks.delete(pid);
}

export function setLobbyLocked(game, locked) {
  if (game.status !== "lobby") return false;
  game.lobbyLocked = !!locked;
  return true;
}

/** Remove a player from the lobby; returns whether they were removed and their socket id if connected. */
export function kickPlayer(game, pid) {
  if (game.status !== "lobby") return { removed: false };
  const p = game.players.get(pid);
  if (!p) return { removed: false };
  const socketId = p.socketId;
  removePlayer(game, pid);
  return { removed: true, socketId };
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
  // Answers shown to players, by type:
  //   puzzle — the scrambled presentation order (never the correct order)
  //   type   — none (free-text input)
  //   else   — the options as stored
  let answerTexts;
  if (q.type === "puzzle") answerTexts = (q.present || q.answers.map((_, i) => i)).map((i) => q.answers[i]);
  else if (q.type === "type") answerTexts = [];
  else answerTexts = q.answers;
  const payload = {
    index: game.currentIndex,
    total: game.quiz.questions.length,
    type: q.type || "mc",
    question: q.question,
    answers: answerTexts.map((text) => ({ text })),
    timeLimit: q.timeLimit,
    startedAt: game.questionStartedAt,
    hasImage: !!q.image,
    paused: game.paused,
    doublePoints: !!q.doublePoints,
    points: q.points || (q.doublePoints ? "double" : "standard"),
    hasHint: !!q.hint,
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
// `introMs` shifts startedAt into the future so the timer only starts once the
// clients' entrance choreography has finished.
export function startNextQuestion(game, introMs = 0) {
  const next = game.currentIndex + 1;
  if (next >= game.quiz.questions.length) {
    game.status = "ended";
    return null;
  }
  if (next === 0) game.prevRanks = snapshotRanks(game);
  game.currentIndex = next;
  game.status = "question";
  game.answers = new Map();
  game.hintsUsed = new Set();
  game.paused = false;
  game.pausedRemaining = 0;
  for (const p of game.players.values()) p.answered = false;
  const q = currentQuestion(game);
  // Puzzle: pick the scrambled order players will sort. Stored on the live
  // question clone so the public payload and scoring share one source of truth.
  if (q.type === "puzzle") q.present = puzzlePresentation(q.answers.length);
  game.questionTimeLimit = q.timeLimit;
  game.questionStartedAt = Date.now() + introMs;
  return q;
}
// Grade a submitted answer against a question, independent of timing/scoring.
// Returns { correct, fraction, entry } or { ignored } for a malformed payload.
// `fraction` (0..1) is the share of credit earned — 1 for all-or-nothing types,
// proportional for puzzle ordering. `entry` holds the type-specific selection
// stored on the answer (index / indices / text / order).
function gradeAnswer(q, answer) {
  const a = answer && typeof answer === "object" ? answer : {};
  switch (q.type) {
    case "ms": {
      if (!Array.isArray(a.indices)) return { ignored: "bad_answer" };
      const picked = [
        ...new Set(
          a.indices
            .map(Number)
            .filter((n) => Number.isInteger(n) && n >= 0 && n < q.answers.length),
        ),
      ].sort((x, y) => x - y);
      const correct = arraysEqual(picked, q.correct);
      return { correct, fraction: correct ? 1 : 0, entry: { indices: picked } };
    }
    case "type": {
      if (typeof a.text !== "string") return { ignored: "bad_answer" };
      const text = a.text.slice(0, 200);
      const norm = normalizeText(text);
      const correct = norm.length > 0 && (q.accept || []).some((v) => normalizeText(v) === norm);
      return { correct, fraction: correct ? 1 : 0, entry: { text } };
    }
    case "puzzle": {
      const n = q.answers.length;
      const present = q.present || q.answers.map((_, i) => i);
      if (!Array.isArray(a.order) || a.order.length !== n) return { ignored: "bad_answer" };
      const order = a.order.map(Number);
      const valid =
        order.every((v) => Number.isInteger(v) && v >= 0 && v < n) &&
        new Set(order).size === n;
      if (!valid) return { ignored: "bad_answer" };
      // The item placed at final position p is presentation slot order[p]; its
      // original index is present[order[p]]. It is correct when that equals p.
      let correctCount = 0;
      for (let p = 0; p < n; p += 1) if (present[order[p]] === p) correctCount += 1;
      const fraction = n > 0 ? correctCount / n : 0;
      return { correct: correctCount === n, fraction, entry: { order, correctCount } };
    }
    default: {
      // mc / tf — single positional choice.
      const idx = a.index;
      if (!Number.isInteger(idx) || idx < 0 || idx >= q.answers.length) {
        return { ignored: "bad_answer" };
      }
      const correct = idx === q.correct;
      return { correct, fraction: correct ? 1 : 0, entry: { index: idx } };
    }
  }
}

export function recordAnswer(game, socketId, answer) {
  if (game.status !== "question") return { ignored: "not_active" };
  if (game.paused) return { ignored: "paused" };
  const player = playerBySocket(game, socketId);
  if (!player) return { ignored: "not_player" };
  if (game.answers.has(player.pid)) return { ignored: "already_answered" };
  const q = currentQuestion(game);
  const graded = gradeAnswer(q, answer);
  if (graded.ignored) return { ignored: graded.ignored };
  const { correct, fraction, entry } = graded;
  // Clamp: an answer during the entrance intro (startedAt in the future) counts
  // as instant, never negative.
  const elapsedMs = Math.max(0, Date.now() - game.questionStartedAt);
  if (elapsedMs > game.questionTimeLimit * 1000) return { ignored: "too_late" };
  let base = 0;
  let bonus = 0;
  if (fraction > 0) {
    if (game.settings.speedScoring) {
      const rem = Math.max(0, game.questionTimeLimit - elapsedMs / 1000);
      base = Math.round(1000 * (0.5 + 0.5 * (rem / game.questionTimeLimit)));
    } else base = 1000;
  }
  // Streak only rewards a fully-correct answer; a partial puzzle breaks it.
  if (correct) {
    player.streak += 1;
    bonus = Math.min((player.streak - 1) * 100, 500);
  } else player.streak = 0;
  const mode = q.points || (q.doublePoints ? "double" : "standard");
  const multiplier = mode === "double" ? 2 : mode === "none" ? 0 : 1;
  // "Closer Look" hint: revealing it before answering halves the earned points.
  const usedHint = game.hintsUsed.has(player.pid);
  // bonus is non-zero only when correct (fraction === 1), so scaling by fraction
  // is safe for the partial-credit puzzle case.
  let points = Math.round((base + bonus) * fraction) * multiplier;
  if (usedHint && points > 0) points = Math.round(points * HINT_PENALTY);
  player.score += points;
  player.answered = true;
  game.answers.set(player.pid, {
    ...entry,
    points,
    base,
    bonus,
    fraction,
    multiplier,
    usedHint,
    correct,
    timeMs: elapsedMs,
  });
  // Whole-game log for the recap (fastest finger / confident wrong, etc.).
  game.answerHistory.push({ pid: player.pid, index: game.currentIndex, correct, timeMs: elapsedMs, points });
  return { player, correct, points, bonus, answeredCount: game.answers.size, totalPlayers: connectedCount(game) };
}

/**
 * Mark that a player revealed the current question's "Closer Look" hint. Must
 * happen before they answer to take effect — a locked-in answer is already
 * scored. Returns true if the usage was newly recorded.
 */
export function useHint(game, socketId) {
  if (game.status !== "question") return false;
  const player = playerBySocket(game, socketId);
  if (!player) return false;
  if (game.answers.has(player.pid)) return false; // already answered — no effect
  const q = currentQuestion(game);
  if (!q?.hint) return false;
  if (game.hintsUsed.has(player.pid)) return false;
  game.hintsUsed.add(player.pid);
  return true;
}

/** Post-answer waiting UI: pace + speed rank from live answer timings. */
export function buildAnswerLocked(game, pid) {
  const entry = game.answers.get(pid);
  if (!entry) return null;
  const limitMs = game.questionTimeLimit * 1000;
  const { timeMs } = entry;
  const speedRank =
    1 + [...game.answers.values()].filter((a) => a.timeMs < timeMs).length;
  const FAST_MS = 2000;
  const lateThresholdMs = limitMs * 0.82;

  let pace = "normal";
  if (timeMs <= FAST_MS || speedRank <= 3) pace = "fast";
  else if (timeMs >= lateThresholdMs) pace = "late";

  return {
    answerIndex: entry.index ?? null,
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
// Per-option pick counts for the reveal bars. Meaningful for mc/tf/ms (ms tallies
// every selected option). type has no options; puzzle has no per-option
// distribution — both report zeros here and surface correctness separately.
export function answerCounts(game) {
  const q = currentQuestion(game);
  const counts = new Array(q.answers.length).fill(0);
  if (q.type === "type" || q.type === "puzzle") return counts;
  for (const a of game.answers.values()) {
    if (Array.isArray(a.indices)) {
      for (const i of a.indices) if (i >= 0 && i < counts.length) counts[i] += 1;
    } else if (Number.isInteger(a.index)) {
      counts[a.index] += 1;
    }
  }
  return counts;
}

/** How many submitted answers were fully correct this question. */
function correctAnswerCount(game) {
  let c = 0;
  for (const a of game.answers.values()) if (a.correct) c += 1;
  return c;
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
  const reveal = {
    index: game.currentIndex,
    type: q.type || "mc",
    correctIndex: typeof q.correct === "number" ? q.correct : null,
    counts: answerCounts(game),
    correctPlayers: revealCorrectPlayers(game),
    totalAnswers: game.answers.size,
    correctCount: correctAnswerCount(game),
    totalPlayers: connectedCount(game),
    hasNext: game.currentIndex + 1 < game.quiz.questions.length,
    doublePoints: !!q.doublePoints,
    points: q.points || (q.doublePoints ? "double" : "standard"),
    mode: game.settings.mode,
    teamStandings: teamStandings(game),
    pacing: game.settings.pacing,
    timing: getRevealTiming(game.settings.pacing),
    highlight: buildRevealHighlight(game),
    revealStage: game.revealStage,
  };
  if (q.type === "ms") {
    reveal.correctIndices = Array.isArray(q.correct) ? q.correct : [];
  } else if (q.type === "type") {
    reveal.answerText = q.accept?.[0] ?? "";
    reveal.accept = q.accept ?? [];
  } else if (q.type === "puzzle") {
    reveal.order = [...q.answers]; // the correct order
    reveal.present = q.present ? [...q.present] : q.answers.map((_, i) => i);
  }
  return reveal;
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
    usedHint: ans?.usedHint ?? false,
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

// Snapshot how the room answered this question. Called once at question close;
// feeds the host's post-game per-question breakdown.
export function recordQuestionStats(game) {
  const q = currentQuestion(game);
  if (!q) return;
  const correctCount = correctAnswerCount(game);
  game.questionStats.push({
    index: game.currentIndex,
    type: q.type || "mc",
    question: q.question,
    answers: [...q.answers],
    correctIndex: typeof q.correct === "number" ? q.correct : null,
    correctIndices: Array.isArray(q.correct) ? [...q.correct] : null,
    accept: q.type === "type" ? [...(q.accept || [])] : null,
    counts: answerCounts(game),
    correctCount,
    totalAnswers: game.answers.size,
    totalPlayers: connectedCount(game),
  });
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
    questionBreakdown: game.questionStats,
  };
}

/** Player-safe final — omits per-question answer keys (host-only breakdown). */
export function buildPlayerFinal(game) {
  const full = game.lastFinal ?? buildFinal(game);
  const { questionBreakdown: _omit, ...rest } = full;
  return rest;
}
export function buildHostState(game) {
  const hasActiveQuestion = ["question", "reveal", "standings"].includes(game.status);
  return {
    pin: game.pin,
    hostToken: game.hostToken,
    settings: game.settings,
    status: game.status,
    paused: game.paused,
    quiz: { title: game.quizTitle, questionCount: game.quiz.questions.length },
    lobbyLocked: !!game.lobbyLocked,
    players: playerList(game),
    teams: game.teams,
    mode: game.settings.mode,
    answerCount: { answered: game.answers.size, total: connectedCount(game) },
    countdown: game.status === "countdown" ? game.countdown : null,
    question: game.currentIndex >= 0 && hasActiveQuestion ? buildPublicQuestion(game, { includeImage: true }) : null,
    doubleWarning:
      game.status === "double-warning"
        ? { index: game.currentIndex + 1, total: game.quiz.questions.length }
        : null,
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
    lobbyLocked: !!game.lobbyLocked,
  };
}
export const stats = () => ({ activeGames: games.size });

/**
 * Return the PINs of every game older than `maxAgeMs`.
 * Callers are responsible for broadcasting game:ended and calling destroyGame().
 */
export function expiredGamePins(maxAgeMs) {
  const now = Date.now();
  const pins = [];
  for (const [pin, game] of games) {
    if (now - game.createdAt > maxAgeMs) pins.push(pin);
  }
  return pins;
}
