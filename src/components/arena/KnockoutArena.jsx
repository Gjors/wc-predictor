import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import MatchHeadToHead from "./MatchHeadToHead";
import BracketZoomView from "./BracketZoomView";
import BracketMiniMap from "./BracketMiniMap";
import { R32, R16, QF, SF, FIN } from "../../data/bracket";
import { FORM, ISO_CODES, UI_DICT } from "../../data/constants";
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
const FORM_TO_RESULT = { S: "W", U: "D", N: "L", W: "W", D: "D", L: "L" };

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
  const nextMatch = allMatches.find((match) => match.a === currentMatch.id || match.b === currentMatch.id);

  const resolveTeams = (matchId) => ({
    teamA: getTeam(matchId, "a", groups, ta, winners),
    teamB: getTeam(matchId, "b", groups, ta, winners),
  });

  const getFlagUrl = (team) => {
    const isoCode = ISO_CODES[team];
    return isoCode ? `https://flagcdn.com/w80/${isoCode}.png` : null;
  };

  const getRecentForm = (team) => {
    const fallback = ["?", "?", "?", "?", "?"];
    if (!team || !FORM[team]) return fallback;
    const recentGames = FORM[team].slice(0, 5);
    return recentGames.map((line) => {
      const prefix = line.trim().charAt(0);
      return FORM_TO_RESULT[prefix] || "?";
    });
  };

  const { teamA, teamB } = resolveTeams(currentMatch.id);
  const teamMeta = {
    a: { flagUrl: getFlagUrl(teamA), form: getRecentForm(teamA) },
    b: { flagUrl: getFlagUrl(teamB), form: getRecentForm(teamB) },
  };
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Game mode</p>
          <h2 className="text-2xl font-bold text-slate-900">Knockout Arena</h2>
        </div>
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === "arena" ? "zoom" : "arena"))}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-100"
        >
          {viewMode === "arena" ? "Show bracket zoom" : "Back to arena"}
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${Math.round((progress / allMatches.length) * 100)}%` }} />
      </div>
      <p className="mb-6 text-xs text-slate-500">{progress}/{allMatches.length} {t.picks}</p>

      <AnimatePresence mode="wait">
        {viewMode === "arena" ? (
          <div key="arena" className="space-y-4">
            <BracketMiniMap
              rounds={rounds}
              winners={winners}
              resolveTeams={resolveTeams}
              currentMatchId={currentMatch.id}
              nextMatchId={nextMatch?.id}
              activeRoundKey={activeRound.key}
              lang={lang}
            />
            <MatchHeadToHead
              match={currentMatch}
              teamA={teamA}
              teamB={teamB}
              teamMeta={teamMeta}
              winner={winners[currentMatch.id]}
              onPick={handlePick}
              lang={lang}
              probabilityA={probabilityA}
              probabilityB={probabilityB}
              hint="Current edge based on pricing momentum, recent shot volume, and transition efficiency."
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
