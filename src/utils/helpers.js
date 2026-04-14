import { SH, SH_EN, MV, EN_TEAMS } from "../data/constants";
import { polyStrength, POLY_GROUP_WINNER } from "../data/polymarket";
import { FIN, MI, R16, SF, TS, QF, isR32id } from "../data/bracket";

/** Display name: short name if available, optionally translated to English */
export const sn = (n, lang = "de") => {
  if (lang === "en") return SH_EN[n] || EN_TEAMS[n] || n;
  return SH[n] || n;
};

/** Format market value with locale-appropriate unit */
export const fmtMV = (v, lang = "de") => {
  if (!v) return "—";
  const bn = lang === "en" ? "bn" : "Mrd.";
  const mn = lang === "en" ? "m" : "Mio.";
  if (v >= 1000) {
    const fmt = (v / 1000).toFixed(2);
    return `${lang === "de" ? fmt.replace(".", ",") : fmt} ${bn}`;
  }
  if (v >= 100) return `${v.toFixed(0)} ${mn}`;
  const fmt = v.toFixed(1);
  return `${lang === "de" ? fmt.replace(".", ",") : fmt} ${mn}`;
};

// ─── Probability model ──────────────────────────────────────────────
// The app supports two probability models selectable at runtime via the
// ModelContext:
//   "poly" — cube root of Polymarket championship odds (default)
//   "mv"   — squared Transfermarkt market values (legacy)
// teamStrength() returns a single scalar that calcProb/pickWinner/
// simulateGroupsFn/handleAutoThirds all consume.
export const teamStrength = (team, mode = "poly") => {
  if (!team) return 0;
  if (mode === "mv") {
    const mv = MV[team] || 0;
    return mv * mv;
  }
  return polyStrength(team);
};

// Match win probability derived from team strengths (Bradley-Terry style).
// Signature note: the legacy calcProb used to accept raw market values. It
// now takes the two team names directly so it can read whichever model is
// active. Returns integer percentages that always sum to 100.
export const calcProb = (teamA, teamB, mode = "poly") => {
  if (!teamA || !teamB) return { a: 50, b: 50 };
  const sA = teamStrength(teamA, mode);
  const sB = teamStrength(teamB, mode);
  const total = sA + sB;
  if (total <= 0) return { a: 50, b: 50 };
  const pA = Math.round((sA / total) * 100);
  return { a: pA, b: 100 - pA };
};

// Weight used by simulateGroupsFn to order teams 1st→4th within a group.
// In "poly" mode the first pick (= group winner) is drawn directly from the
// Polymarket group-winner market; later picks fall back to the championship-
// derived strength so the ranking stays sensible.
export const groupWeight = (team, mode = "poly") => {
  if (mode === "mv") return MV[team] || 1;
  const gw = POLY_GROUP_WINNER[team];
  if (gw && gw > 0) return gw;
  return polyStrength(team) || 0.1;
};

export function solveThirds(sel) {
  if (sel.length !== 8) return {};
  const s = new Set(sel);
  const res = {};
  const used = new Set();
  const sorted = [...TS].sort((a, b) => a.e.filter((g) => s.has(g)).length - b.e.filter((g) => s.has(g)).length);

  function go(i) {
    if (i === sorted.length) return true;
    for (const g of sorted[i].e) {
      if (s.has(g) && !used.has(g)) {
        used.add(g);
        res[sorted[i].m] = g;
        if (go(i + 1)) return true;
        used.delete(g);
        delete res[sorted[i].m];
      }
    }
    return false;
  }

  go(0);
  return res;
}

export function r32Team(match, side, groups, ta) {
  const sl = match[side];
  if (sl.g) return groups[sl.g]?.[sl.r - 1] || null;
  if (sl.t) {
    const ag = ta[match.id];
    return ag ? groups[ag]?.[2] || null : null;
  }
  return null;
}

export function getTeam(mid, side, groups, ta, winners) {
  const m = MI[mid];
  if (!m) return null;
  if (isR32id(mid)) return r32Team(m, side, groups, ta);
  const fid = m[side];
  const ws = winners[fid];
  if (!ws) return null;
  return getTeam(fid, ws, groups, ta, winners);
}

export function slotLabel(mid, side) {
  const m = MI[mid];
  if (!m) return "—";
  if (isR32id(mid)) {
    const sl = m[side];
    if (sl.g) return `${sl.r}. Gr.${sl.g}`;
    if (sl.t) return `3. ${sl.e.join("/")}`;
  }
  return `W${m[side]}`;
}

export function clearDown(mid, winners) {
  [...R16, ...QF, ...SF, FIN].forEach((m) => {
    if (m.a === mid || m.b === mid) {
      if (winners[m.id] !== undefined) {
        delete winners[m.id];
        clearDown(m.id, winners);
      }
    }
  });
}


export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Simulation helpers ─────────────────────────────────────────────

/** Weighted random shuffle: pick items one by one with probability proportional to weightFn */
export function weightedShuffle(items, weightFn) {
  const result = [];
  const remaining = items.map((item) => ({ item, w: weightFn(item) }));
  while (remaining.length > 0) {
    const total = remaining.reduce((s, r) => s + r.w, 0);
    let rand = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].w;
      if (rand <= 0) { idx = i; break; }
    }
    result.push(remaining[idx].item);
    remaining.splice(idx, 1);
  }
  return result;
}

/** Pick match winner ('a' or 'b') using the active probability model. */
export function pickWinner(teamA, teamB, mode = "poly") {
  const sA = teamStrength(teamA, mode) || 0.0001;
  const sB = teamStrength(teamB, mode) || 0.0001;
  return Math.random() < sA / (sA + sB) ? "a" : "b";
}
