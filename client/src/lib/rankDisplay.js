import { copy } from "./copy.js";

export function isPodiumRank(rank) {
  return typeof rank === "number" && rank >= 1 && rank <= 3;
}

/** After each question — rank line on the player phone. */
export function playerRankLine(rank, totalPlayers) {
  if (isPodiumRank(rank)) return copy.player.onPodium;
  return copy.player.result.rank(rank, totalPlayers);
}

/** Standings / final headline rank (large). */
export function playerRankHeadline(rank) {
  if (isPodiumRank(rank)) return copy.player.onPodium;
  return `#${rank}`;
}

/** Team row label on player standings when the team is in the top three. */
export function teamPodiumLabel(team) {
  if (isPodiumRank(team?.rank)) return team.name;
  return `${team.rank}. ${team.name}`;
}
