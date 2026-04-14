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
}) {
  const mode = useModel();
  const probabilities = calcProb(teamA, teamB, mode);
  const showProbabilities = Boolean(teamA && teamB);

  const renderRow = (team, label, side) => {
    const isWinner = winner === side;
    const isLoser = winner && winner !== side;
    const isKnownTeam = Boolean(team);
    const probability = side === "a" ? probabilities.a : probabilities.b;

    return (
      <button
        type="button"
        onClick={() => isKnownTeam && onPick(matchId, side)}
        disabled={!isKnownTeam}
        className={`flex h-5 w-full items-center gap-2 px-2 text-left transition-colors ${
          isKnownTeam ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed"
        } ${isLoser ? "opacity-55" : ""} ${isWinner ? "bg-emerald-50" : "bg-white"}`}
      >
        {isKnownTeam ? (
          <>
            <Flag team={team} />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-800">{sn(team, lang)}</span>
            {showProbabilities && (
              <span className={`text-[11px] font-semibold tabular-nums ${isWinner ? "text-emerald-700" : "text-slate-500"}`}>
                {probability}%
              </span>
            )}
          </>
        ) : (
          <span className="truncate text-[10px] italic text-slate-400">{label}</span>
        )}
      </button>
    );
  };

  return (
    <article
      className={`absolute overflow-hidden rounded-lg border bg-white shadow-sm ${isFinal ? "border-amber-300" : "border-slate-200"}`}
      style={{
        ...style,
        width: CARD_WIDTH,
        height: MATCH_HEIGHT,
      }}
    >
      <header className={`flex h-4 items-center justify-between border-b px-2 ${isFinal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-600">M{matchId}</span>
        <span className="truncate text-[9px] text-slate-500">{venue}</span>
      </header>
      {renderRow(teamA, labelA, "a")}
      <div className="h-px bg-slate-100" />
      {renderRow(teamB, labelB, "b")}
    </article>
  );
}
