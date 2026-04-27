import { ISO_CODES } from "../data/constants";
import { calcProb, sn } from "../utils/helpers";
import { useModel } from "../utils/model";

const MATCH_HEIGHT = 56;
const CARD_WIDTH = 208;

function Flag({ team }) {
  const code = ISO_CODES[team];
  if (!code) {
    return <span className="h-4 w-6 rounded-sm bg-slate-200" aria-label={`${team || "Team"} flag missing`} />;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={`${team} flag`}
      className="h-4 w-6 rounded-[2px] border border-slate-200 object-cover"
      loading="lazy"
    />
  );
}

export default function BracketNode({
  matchId,
  teamA,
  teamB,
  labelA,
  labelB,
  venue,
  winner,
  onPick,
  style,
  isFinal,
  lang = "de",
  theme = "light",
}) {
  const mode = useModel();
  const probabilities = calcProb(teamA, teamB, mode);
  const showProbabilities = Boolean(teamA && teamB);

  const renderRow = (team, label, side) => {
    const isWinner = winner === side;
    const isLoser = winner && winner !== side;
    const isKnownTeam = Boolean(team);
    const probability = side === "a" ? probabilities.a : probabilities.b;
    const hoverClass = isKnownTeam
      ? (theme === "dark" ? "cursor-pointer hover:bg-[#223250]" : "cursor-pointer hover:bg-slate-50")
      : "cursor-not-allowed";

    return (
      <button
        type="button"
        onClick={() => isKnownTeam && onPick(matchId, side)}
        disabled={!isKnownTeam}
        className={`flex h-5 w-full items-center gap-2 px-2 text-left transition-colors ${hoverClass} ${isLoser ? "opacity-60" : ""}`}
        style={{
          background: theme === "dark"
            ? (isWinner ? "linear-gradient(90deg, rgba(40,88,76,0.72), rgba(31,52,84,0.64))" : "rgba(16,29,53,0.5)")
            : (isWinner ? "linear-gradient(90deg, rgba(220,252,231,0.95), rgba(240,249,255,0.95))" : "rgba(255,255,255,0.92)"),
        }}
      >
        {isKnownTeam ? (
          <>
            <Flag team={team} />
            <span className={`min-w-0 flex-1 truncate text-[11px] font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{sn(team, lang)}</span>
            {showProbabilities && (
              <span className={`text-[11px] font-semibold tabular-nums ${isWinner ? (theme === "dark" ? "text-emerald-300" : "text-emerald-700") : (theme === "dark" ? "text-slate-400" : "text-slate-500")}`}>
                {probability}%
              </span>
            )}
          </>
        ) : (
          <span className={`truncate text-[10px] italic ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{label}</span>
        )}
      </button>
    );
  };

  return (
    <article
      className={`absolute overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm ${isFinal ? (theme === "dark" ? "border-emerald-300/60" : "border-amber-300") : (theme === "dark" ? "border-slate-400/25" : "border-slate-200")}`}
      style={{
        ...style,
        width: CARD_WIDTH,
        height: MATCH_HEIGHT,
        background: theme === "dark"
          ? "linear-gradient(170deg, rgba(31,47,74,0.92), rgba(15,24,45,0.85))"
          : "linear-gradient(170deg, rgba(255,255,255,0.96), rgba(241,245,249,0.96))",
        boxShadow: isFinal
          ? (theme === "dark" ? "0 0 24px rgba(74,222,128,0.25)" : "0 4px 18px rgba(201,168,76,0.28)")
          : (theme === "dark" ? "0 10px 24px rgba(4,10,25,0.28)" : "0 4px 12px rgba(15,23,42,0.12)"),
      }}
    >
      <header className={`flex h-4 items-center justify-between border-b px-2 ${theme === "dark" ? "border-slate-400/20 bg-[#1d2a44]" : "border-slate-200 bg-slate-50"}`}>
        <span className={`text-[9px] font-semibold uppercase tracking-wide ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>M{matchId}</span>
        <span className={`truncate text-[9px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{venue}</span>
      </header>
      {renderRow(teamA, labelA, "a")}
      <div className={`h-px ${theme === "dark" ? "bg-slate-300/15" : "bg-slate-100"}`} />
      {renderRow(teamB, labelB, "b")}
    </article>
  );
}
