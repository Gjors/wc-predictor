import { SH, MV } from "../data/constants";
import { FIN, MI, R16, SF, TS, QF, isR32id } from "../data/bracket";

export const sn = (n) => SH[n] || n;

export const fmtMV = (v) => {
  if (!v) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(2).replace(".", ",")} Mrd.`;
  if (v >= 100) return `${v.toFixed(0)} Mio.`;
  return `${v.toFixed(1).replace(".", ",")} Mio.`;
};

export const calcProb = (mvA, mvB) => {
  if (!mvA || !mvB) return { a: 50, b: 50 };
  const weightedA = mvA ** 2;
  const weightedB = mvB ** 2;
  const total = weightedA + weightedB;
  const pA = Math.round((weightedA / total) * 100);
  return { a: pA, b: 100 - pA };
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

/** Pick match winner ('a' or 'b') based on market value weighted probability */
export function pickWinnerByMV(teamA, teamB) {
  const mvA = MV[teamA] || 1;
  const mvB = MV[teamB] || 1;
  return Math.random() < mvA / (mvA + mvB) ? "a" : "b";
}
