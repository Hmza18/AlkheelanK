// Shared mid-game stat aggregation used by standings payloads.
// Keeping this in a dedicated module avoids duplicate logic when multiple
// server flows or agents need the same stat calculations.

function pickFastestFinger(game) {
  let best = null;
  for (const [pid, ans] of game.answers.entries()) {
    if (!ans.correct) continue;
    if (!best || ans.timeMs < best.timeMs) best = { pid, ...ans };
  }
  if (!best) return null;
  const p = game.players.get(best.pid);
  if (!p) return null;
  return {
    key: "fastest_finger",
    title: "Fastest correct",
    subtitle: `${p.nick} — ${(best.timeMs / 1000).toFixed(2)}s`,
    playerId: p.pid,
  };
}

function pickConfidentWrong(game) {
  let best = null;
  for (const [pid, ans] of game.answers.entries()) {
    if (ans.correct) continue;
    if (!best || ans.timeMs < best.timeMs) best = { pid, ...ans };
  }
  if (!best) return null;
  const p = game.players.get(best.pid);
  if (!p) return null;
  return {
    key: "confident_wrong",
    title: "Speedy miss",
    subtitle: `${p.nick} — ${(best.timeMs / 1000).toFixed(2)}s`,
    playerId: p.pid,
  };
}

function pickBiggestComeback(standings) {
  if (!Array.isArray(standings) || standings.length === 0) return null;
  let best = null;
  for (const row of standings) {
    if (!best || row.delta > best.delta) best = row;
  }
  if (!best || best.delta <= 0) return null;
  return {
    key: "biggest_comeback",
    title: "Comeback climb",
    subtitle: `${best.nick} — up ${best.delta} spot${best.delta === 1 ? "" : "s"}`,
    playerId: best.id,
  };
}

/** In-reveal social moment (fastest correct or clutch under pressure). */
export function buildRevealHighlight(game) {
  const limitMs = game.questionTimeLimit * 1000;
  let fastest = null;
  let clutch = null;
  const clutchThreshold = limitMs * 0.78;

  for (const [pid, ans] of game.answers.entries()) {
    if (!ans.correct) continue;
    const p = game.players.get(pid);
    if (!p) continue;
    const row = { id: p.pid, nick: p.nick, character: p.character, timeMs: ans.timeMs };
    if (!fastest || ans.timeMs < fastest.timeMs) fastest = row;
    if (ans.timeMs >= clutchThreshold && (!clutch || ans.timeMs > clutch.timeMs)) {
      clutch = row;
    }
  }

  if (fastest) {
    return {
      key: "fastest_correct",
      title: "Fastest correct",
      subtitle: `${fastest.nick} in ${(fastest.timeMs / 1000).toFixed(2)}s`,
      player: fastest,
    };
  }
  if (clutch) {
    return {
      key: "clutch_answer",
      title: "Clutch pick",
      subtitle: `${clutch.nick} snuck in with ${((limitMs - clutch.timeMs) / 1000).toFixed(1)}s left`,
      player: clutch,
    };
  }
  return null;
}

export function buildFunStat(game, standings) {
  // Priority order keeps this feeling varied but meaningful:
  // comeback first, then speed moments.
  return (
    pickBiggestComeback(standings) ||
    pickFastestFinger(game) ||
    pickConfidentWrong(game) || {
      key: "steady_climb",
      title: "Still anyone's game",
      subtitle: "One round can flip the whole board.",
    }
  );
}

