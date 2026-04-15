import { INIT_GROUPS, GIDS } from "../data/constants";
import { POLY_GROUP_WINNER, POLY_WINNER, polyStrength } from "../data/polymarket";
import { R32, R16, QF, MI } from "../data/bracket";
import { solveThirds } from "./helpers";

const TEAM_TO_GROUP = Object.fromEntries(
  GIDS.flatMap((gid) => (INIT_GROUPS[gid] || []).map((team) => [team, gid])),
);

const rankGroupTeams = (teams) =>
  [...teams].sort((a, b) => {
    const byWinnerProb = (POLY_GROUP_WINNER[b] || 0) - (POLY_GROUP_WINNER[a] || 0);
    if (byWinnerProb !== 0) return byWinnerProb;
    return (POLY_WINNER[b] || 0) - (POLY_WINNER[a] || 0);
  });

const buildExpectedGroups = (finishOverride = "none") => {
  const groups = Object.fromEntries(
    GIDS.map((gid) => [gid, rankGroupTeams(INIT_GROUPS[gid] || [])]),
  );

  if (!finishOverride || finishOverride === "none") return groups;

  Object.entries(groups).forEach(([gid, order]) => {
    const team = finishOverride.team;
    if (!team || TEAM_TO_GROUP[team] !== gid) return;
    const withoutTeam = order.filter((name) => name !== team);
    const insertAt = finishOverride.rank === 2 ? 1 : finishOverride.rank === 3 ? 2 : 0;
    withoutTeam.splice(insertAt, 0, team);
    groups[gid] = withoutTeam;
  });

  return groups;
};

const pickBestThirdGroups = (groups) =>
  GIDS.map((gid) => ({ gid, team: groups[gid]?.[2] }))
    .filter((entry) => entry.team)
    .sort((a, b) => (POLY_WINNER[b.team] || 0) - (POLY_WINNER[a.team] || 0))
    .slice(0, 8)
    .map((entry) => entry.gid);

const slotTeam = (slot, groups, thirdAssignments, matchId) => {
  if (slot.g) return groups[slot.g]?.[slot.r - 1] || null;
  if (slot.t) {
    const thirdGroup = thirdAssignments[matchId];
    return thirdGroup ? groups[thirdGroup]?.[2] || null : null;
  }
  return null;
};

const buildExpectedKnockout = (groups) => {
  const thirdGroups = pickBestThirdGroups(groups);
  const thirdAssignments = solveThirds(thirdGroups);
  const winners = {};
  const matches = {};

  R32.forEach((match) => {
    const teamA = slotTeam(match.a, groups, thirdAssignments, match.id);
    const teamB = slotTeam(match.b, groups, thirdAssignments, match.id);
    matches[match.id] = { ...match, teamA, teamB };
    if (teamA && teamB) {
      winners[match.id] = polyStrength(teamA) >= polyStrength(teamB) ? teamA : teamB;
    }
  });

  [...R16, ...QF].forEach((match) => {
    const teamA = winners[match.a] || null;
    const teamB = winners[match.b] || null;
    matches[match.id] = { ...match, teamA, teamB };
    if (teamA && teamB) {
      winners[match.id] = polyStrength(teamA) >= polyStrength(teamB) ? teamA : teamB;
    }
  });

  return { thirdAssignments, matches, winners };
};

const findPathToQuarterfinal = (team, matches, winners) => {
  const r32Match = R32.find((m) => matches[m.id]?.teamA === team || matches[m.id]?.teamB === team);
  if (!r32Match) return null;

  const r16Match = R16.find((m) => m.a === r32Match.id || m.b === r32Match.id);
  if (!r16Match) return null;

  const qfMatch = QF.find((m) => m.a === r16Match.id || m.b === r16Match.id);
  if (!qfMatch) return null;

  const opponent = (match, focusTeam) => {
    const data = matches[match.id];
    if (!data) return null;
    if (data.teamA === focusTeam) return data.teamB;
    if (data.teamB === focusTeam) return data.teamA;
    return null;
  };

  const r32Opponent = opponent(r32Match, team);
  const r16Opponent = opponent(r16Match, winners[r32Match.id] || team);
  const qfOpponent = opponent(qfMatch, winners[r16Match.id] || team);

  const opponents = [r32Opponent, r16Opponent, qfOpponent].filter(Boolean);
  const totalStrength = opponents.reduce((sum, opp) => sum + polyStrength(opp), 0);
  const averageStrength = opponents.length ? totalStrength / opponents.length : 0;

  return {
    rounds: {
      r32: r32Opponent,
      r16: r16Opponent,
      qf: qfOpponent,
    },
    totalStrength,
    averageStrength,
  };
};

const buildTierBuckets = (entries) => {
  const tiers = ["S", "A", "B", "C", "F"];
  const sorted = [...entries].sort((a, b) => a.totalStrength - b.totalStrength);
  const size = Math.max(1, Math.ceil(sorted.length / tiers.length));
  return tiers.reduce((acc, tier, index) => {
    acc[tier] = sorted.slice(index * size, (index + 1) * size);
    return acc;
  }, {});
};

export const buildPathDifficultyTierList = ({ favoriteCount = 24, finishOverride = "none" } = {}) => {
  const groups = buildExpectedGroups(finishOverride);
  const knockout = buildExpectedKnockout(groups);

  const favorites = Object.entries(POLY_WINNER)
    .sort((a, b) => b[1] - a[1])
    .slice(0, favoriteCount)
    .map(([team]) => team);

  const entries = favorites
    .map((team) => {
      const path = findPathToQuarterfinal(team, knockout.matches, knockout.winners);
      if (!path) return null;
      return {
        team,
        ...path,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.totalStrength - b.totalStrength);

  return {
    groups,
    thirdAssignments: knockout.thirdAssignments,
    entries,
    tiers: buildTierBuckets(entries),
  };
};

export const getTeamGroup = (team) => TEAM_TO_GROUP[team] || null;
export const getMatchById = (id) => MI[id] || null;
export const getTierByTeam = (tiers, team) =>
  Object.entries(tiers).find(([, entries]) => entries.some((entry) => entry.team === team))?.[0] || null;
