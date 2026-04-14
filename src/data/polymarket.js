// ─── Polymarket implied probabilities (scraped market data) ───────────
// Keys match the internal German team names used across the app so no
// translation layer is needed at lookup time. All values are percentages
// (0–100). <1% entries from the raw scrape are stored as 0.5 (midpoint).
//
// This module is the single source of truth for the "poly" probability
// model. The legacy MV (market value) numbers in constants.js are still
// available behind a toggle in the UI for comparison.

import { INIT_GROUPS } from "./constants";

// ─── Tournament winner market (all 48 teams) ─────────────────────────
// Used by polyStrength() below and by handleAutoThirds() for ranking
// third-placed teams.
export const POLY_WINNER = {
  Spanien: 17.3,
  Frankreich: 16.6,
  England: 11.1,
  Argentinien: 8.8,
  Brasilien: 8.5,
  Portugal: 6.9,
  Deutschland: 5.2,
  Niederlande: 3.3,
  Norwegen: 2.2,
  Japan: 1.8,
  Belgien: 1.8,
  Kolumbien: 1.7,
  Marokko: 1.6,
  USA: 1.4,
  Mexiko: 1.1,
  Schweiz: 1.0,
  Uruguay: 1.0,
  Kroatien: 1.0,
  Türkei: 0.8,
  Ecuador: 0.8,
  Senegal: 0.7,
  Kanada: 0.6,
  Österreich: 0.6,
  Schweden: 0.6,
  "Republik Korea": 0.5,
  Paraguay: 0.5,
  Elfenbeinküste: 0.5,
  "Bosnien-Herzegowina": 0.4,
  Schottland: 0.4,
  Tschechien: 0.4,
  Ägypten: 0.4,
  Curaçao: 0.3,
  "IR Iran": 0.3,
  Ghana: 0.3,
  Algerien: 0.3,
  Tunesien: 0.3,
  Panama: 0.3,
  Südafrika: 0.3,
  "DR Kongo": 0.3,
  Australien: 0.3,
  "Saudi-Arabien": 0.3,
  Neuseeland: 0.2,
  Haiti: 0.2,
  Jordanien: 0.2,
  Usbekistan: 0.2,
  Irak: 0.2,
  "Kap Verde": 0.2,
  Katar: 0.2,
};

// ─── Group-winner market (1st-place probability per group) ───────────
// Polymarket sometimes lumps multiple TBD playoff candidates into a single
// cell (e.g. "CZE/DEN/MKD/IRL 24%"). We attach that bucket value to the
// specific team currently placed in the group by INIT_GROUPS:
//   Group A: CZE/DEN/MKD/IRL 24%  -> Tschechien
//   Group B: BIH/ITA/NIR/WAL 21%  -> Bosnien-Herzegowina
//   Group D: KOS/ROU/SVK/TUR 38%  -> Türkei
//   Group F: ALB/POL/SWE/UKR 13%  -> Schweden
//   Group K: DRC/JAM/NCL 3.2%     -> DR Kongo
// If the actual playoff slot resolves to a different team later, the mapping
// above must be revisited.
//
// Group I (France, Senegal, Iraq, Norway) was missing from the scraped
// market, so we derive it by normalising the four teams' POLY_WINNER values
// to sum to 100% within the group.
const RAW_GROUP_WINNER = {
  // Group A
  Mexiko: 46,
  Tschechien: 24,
  "Republik Korea": 20,
  Südafrika: 4.3,
  // Group B
  Schweiz: 54,
  Kanada: 26,
  "Bosnien-Herzegowina": 21,
  Katar: 3.4,
  // Group C
  Brasilien: 77,
  Marokko: 20,
  Schottland: 4.4,
  Haiti: 0.5,
  // Group D
  USA: 39,
  Türkei: 38,
  Paraguay: 17,
  Australien: 7.1,
  // Group E
  Deutschland: 71,
  Ecuador: 21,
  Elfenbeinküste: 7.7,
  Curaçao: 1.5,
  // Group F
  Niederlande: 56,
  Japan: 27,
  Schweden: 13,
  Tunesien: 4.2,
  // Group G
  Belgien: 74,
  Ägypten: 17,
  "IR Iran": 10.2,
  Neuseeland: 5.8,
  // Group H
  Spanien: 82,
  Uruguay: 16,
  "Saudi-Arabien": 2.3,
  "Kap Verde": 0.5,
  // Group J
  Argentinien: 77,
  Österreich: 16,
  Algerien: 4.7,
  Jordanien: 2.9,
  // Group K
  Portugal: 65,
  Kolumbien: 31,
  "DR Kongo": 3.2,
  Usbekistan: 0.5,
  // Group L
  England: 72,
  Kroatien: 23,
  Panama: 3.4,
  Ghana: 2.5,
};

// Derive Group I group-winner odds from POLY_WINNER (missing from scrape).
const GROUP_I_TEAMS = INIT_GROUPS.I;
const groupITotal = GROUP_I_TEAMS.reduce((s, t) => s + (POLY_WINNER[t] || 0), 0) || 1;
const GROUP_I_DERIVED = Object.fromEntries(
  GROUP_I_TEAMS.map((t) => [t, ((POLY_WINNER[t] || 0) / groupITotal) * 100]),
);

export const POLY_GROUP_WINNER = { ...RAW_GROUP_WINNER, ...GROUP_I_DERIVED };

// ─── Strength conversion (tournament % -> per-match scalar) ──────────
// Design note: Polymarket winner odds describe surviving ~5 knockout rounds,
// not a single match. Taking the cube root gives us a Bradley-Terry
// compatible scalar that produces clear favourite roles for single matches
// (e.g. Spain vs. Mexico ≈ 71%) while still allowing upsets. The user chose
// the cube-root flavour explicitly for the arcade/quiz-show gameplay.
export const polyStrength = (team) => {
  const p = POLY_WINNER[team];
  if (!p || p <= 0) return 0.1;
  return Math.cbrt(p);
};

// ─── Special markets (for trivia popups etc.) ────────────────────────
// "Wird Neymar spielen?" — Polymarket puts the Yes side at 47%.
export const POLY_SPECIALS = {
  neymarPlays: 47,
};
