import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import MatchArena from "./MatchArena";
import StatOverlay from "./StatOverlay";
import BracketZoomView from "./BracketZoomView";
import { R32, R16, QF, SF, FIN } from "../../data/bracket";
import { UI_DICT } from "../../data/constants";
import { calcProb, getTeam } from "../../utils/helpers";
import { useModel } from "../../utils/model";

const ROUND_CONFIG = [
  { key: "r32", labelEn: "Round of 32", labelDe: "Sechzehntelfinale", matches: R32 },
  { key: "r16", labelEn: "Round of 16", labelDe: "Achtelfinale", matches: R16 },
  { key: "qf", labelEn: "Quarterfinal", labelDe: "Viertelfinale", matches: QF },
  { key: "sf", labelEn: "Semifinal", labelDe: "Halbfinale", matches: SF },
  { key: "fin", labelEn: "Final", labelDe: "Finale", matches: [FIN] },
];

const PLAYER_SPOTLIGHTS = {
  "Spanien": { left: { name: "Lamine Yamal", stat: "Elite dribbles + progressive carries" } },
  "Frankreich": { right: { name: "Kylian Mbappé", stat: "Top acceleration + xG leader" } },
  "England": { left: { name: "Jude Bellingham", stat: "Box entries + duel wins" } },
  "Deutschland": { left: { name: "Florian Wirtz", stat: "Chance creation + assists" } },
  "Brasilien": { left: { name: "Vinícius Jr.", stat: "1v1 breakaways + key goals" } },
  "Argentinien": { left: { name: "Julián Álvarez", stat: "Pressing + finishing" } },
};

const roundLabel = (round, lang) => (lang === "de" ? round.labelDe : round.labelEn);

export default function KnockoutArena({ groups, ta, winners, onPick, lang = "en", marketProbabilities = {} }) {
  const t = UI_DICT[lang];
  const mode = useModel();
  const [viewMode, setViewMode] = useState("arena");

  const rounds = useMemo(
    () => ROUND_CONFIG.map((round) => ({
      ...round,
      matches: round.matches.map((match, index) => ({ ...match, roundLabel: roundLabel(round, lang), roundIndex: index + 1 })),
    })),
    [lang],
  );

  const allMatches = rounds.flatMap((round) => round.matches);

  const currentRoundIndex = rounds.findIndex((round) => round.matches.some((match) => !winners[match.id]));
  const activeRoundIndex = currentRoundIndex === -1 ? rounds.length - 1 : currentRoundIndex;
  const activeRound = rounds[activeRoundIndex];
  const currentMatch = activeRound.matches.find((match) => !winners[match.id]) || activeRound.matches[activeRound.matches.length - 1];

  const resolveTeams = (matchId) => ({
    teamA: getTeam(matchId, "a", groups, ta, winners),
    teamB: getTeam(matchId, "b", groups, ta, winners),
  });

  const { teamA, teamB } = resolveTeams(currentMatch.id);
  const liveProbabilities = marketProbabilities[currentMatch.id] || {};
  // Fallback match probabilities derived from the active model (poly/mv)
  // via the shared calcProb helper.
  const fallbackProbabilities = calcProb(teamA, teamB, mode);
  const probabilityA = liveProbabilities.a ?? fallbackProbabilities.a;
  const probabilityB = liveProbabilities.b ?? fallbackProbabilities.b;

  const mergedPlayers = {
    left: PLAYER_SPOTLIGHTS[teamA]?.left || { name: "Dynamic attacker", stat: "Form streak + finishing" },
    right: PLAYER_SPOTLIGHTS[teamB]?.right || { name: "Creative engine", stat: "Chance creation + xThreat" },
  };

  const handlePick = (matchId, side) => {
    const willCompleteRound = activeRound.matches.every((match) => winners[match.id] || match.id === matchId);
    onPick(matchId, side);
    if (willCompleteRound) {
      setViewMode("zoom");
      setTimeout(() => setViewMode("arena"), 1300);
    }
  };

  const progress = allMatches.filter((match) => winners[match.id]).length;

  return (
    <div className="rounded-3xl border border-cyan-300/30 bg-[radial-gradient(circle_at_top,rgba(12,74,110,0.45),rgba(2,6,23,0.96))] p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Game mode</p>
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Knockout Arena</h2>
        </div>
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === "arena" ? "zoom" : "arena"))}
          className="rounded-full border border-cyan-300/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-300/10"
        >
          {viewMode === "arena" ? "Show bracket zoom" : "Back to arena"}
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 transition-[width] duration-500" style={{ width: `${Math.round((progress / allMatches.length) * 100)}%` }} />
      </div>
      <p className="mb-6 text-xs text-slate-300">{progress}/{allMatches.length} {t.picks}</p>

      <AnimatePresence mode="wait">
        {viewMode === "arena" ? (
          <div key="arena" className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
            <MatchArena
              match={currentMatch}
              teamA={teamA}
              teamB={teamB}
              winner={winners[currentMatch.id]}
              onPick={handlePick}
              lang={lang}
            />
            <StatOverlay
              teamA={teamA || "Team A"}
              teamB={teamB || "Team B"}
              probabilityA={probabilityA}
              probabilityB={probabilityB}
              hint="Momentum pulse: pressing efficiency and recent chance creation can swing this tie."
              players={mergedPlayers}
            />
          </div>
        ) : (
          <BracketZoomView
            key="zoom"
            title={`${activeRound.roundLabel} complete`}
            matches={activeRound.matches}
            resolveTeams={resolveTeams}
            winners={winners}
            lang={lang}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
