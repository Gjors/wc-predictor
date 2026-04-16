import { FIN, QF, R16, R32, SF } from "../data/bracket";
import { getTeam, pickWinner } from "./helpers";

const EMPTY_STATS = {
  wins: 0,
  finals: 0,
  semiFinals: 0,
  quarterFinals: 0,
};

const SORT_KEYS = ["wins", "finals", "semiFinals", "quarterFinals"];

const ensureTeamStats = (aggregate, team) => {
  if (!team) return;
  if (!aggregate[team]) {
    aggregate[team] = { ...EMPTY_STATS };
  }
};

const bumpRoundParticipants = (aggregate, matches, groups, ta, winners, key) => {
  matches.forEach((match) => {
    ["a", "b"].forEach((side) => {
      const team = getTeam(match.id, side, groups, ta, winners);
      if (!team) return;
      ensureTeamStats(aggregate, team);
      aggregate[team][key] += 1;
    });
  });
};

const sortByPerformance = (entries) =>
  [...entries].sort(([teamA, statsA], [teamB, statsB]) => {
    for (const key of SORT_KEYS) {
      const diff = statsB[key] - statsA[key];
      if (diff !== 0) return diff;
    }
    return teamA.localeCompare(teamB);
  });

export async function runMonteCarloBracketSimulations({
  runs,
  groups,
  ta,
  mode,
  onProgress,
}) {
  const aggregate = {};
  const allMatches = [...R32, ...R16, ...QF, ...SF, FIN];

  const allTeams = Object.values(groups).flat();
  allTeams.forEach((team) => ensureTeamStats(aggregate, team));

  for (let run = 0; run < runs; run += 1) {
    const winners = {};

    allMatches.forEach((match) => {
      const teamA = getTeam(match.id, "a", groups, ta, winners);
      const teamB = getTeam(match.id, "b", groups, ta, winners);
      if (!teamA || !teamB) return;
      winners[match.id] = pickWinner(teamA, teamB, mode);
    });

    bumpRoundParticipants(aggregate, QF, groups, ta, winners, "quarterFinals");
    bumpRoundParticipants(aggregate, SF, groups, ta, winners, "semiFinals");
    bumpRoundParticipants(aggregate, [FIN], groups, ta, winners, "finals");

    const championSide = winners[FIN.id];
    if (championSide) {
      const champion = getTeam(FIN.id, championSide, groups, ta, winners);
      if (champion) {
        ensureTeamStats(aggregate, champion);
        aggregate[champion].wins += 1;
      }
    }

    if (onProgress && (run + 1 === runs || (run + 1) % 5 === 0)) {
      onProgress(run + 1, runs);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return {
    aggregate,
    rows: sortByPerformance(Object.entries(aggregate)).map(([team, stats]) => ({
      team,
      ...stats,
    })),
  };
}
