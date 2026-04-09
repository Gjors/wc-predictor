import { ISO_CODES, MV } from "../data/constants";
import { calcProb, sn } from "../utils/helpers";

const MH = 42;
const CW = 128;

export default function MCard({ matchId, teamA, teamB, labelA, labelB, venue, winner, onPick, style, isFinal, lang = "de" }) {
  const probH = 3;
  const h = isFinal ? MH + 10 : MH;
  const headH = isFinal ? 15 : 13;
  const showProb = !!teamA && !!teamB;
  const rowH = (h - headH - (showProb ? probH : 0)) / 2;

  const mvA = teamA ? MV[teamA] : null;
  const mvB = teamB ? MV[teamB] : null;
  const prob = calcProb(mvA, mvB);

  const mkRow = (team, label, side) => {
    const isW = winner === side;
    const isL = winner && winner !== side;
    const ok = !!team;
    const pct = side === "a" ? prob.a : prob.b;

    return (
      <div
        onClick={() => ok && onPick(matchId, side)}
        className={`flex items-center px-1.5 truncate transition-all
          ${ok ? "cursor-pointer" : ""}
          ${ok && !isW && !isL ? "hover:bg-blue-50" : ""}
          ${isL ? "opacity-35" : ""}`}
        style={{
          height: rowH,
          fontSize: 11,
          background: isW ? "#dcfce7" : "transparent",
          borderLeft: isW ? "3px solid #16a34a" : "3px solid transparent",
          color: ok ? "#1e293b" : "#94a3b8",
          fontStyle: ok ? "normal" : "italic",
          fontWeight: isW ? "700" : "500",
        }}
      >
        {ok ? (
          <>
            {ISO_CODES[team] ? (
              <img
                src={`https://flagcdn.com/w20/${ISO_CODES[team]}.png`}
                alt={`${team} flag`}
                className="mr-1 w-4 h-3 object-cover rounded-sm shadow-sm inline-block flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <span className="mr-1 w-4 h-3 rounded-sm bg-gray-300 inline-block flex-shrink-0" aria-label={`${team} flag missing`} />
            )}
            <span className="truncate">{sn(team, lang)}</span>
            {showProb && <span className="ml-auto font-mono flex-shrink-0" style={{ fontSize: 8, color: pct >= 50 ? "#16a34a" : "#94a3b8" }}>{pct}%</span>}
            {isW && !showProb && <span className="ml-auto text-emerald-600" style={{ fontSize: 9 }}>▶</span>}
          </>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute rounded overflow-hidden"
      style={{
        ...style,
        width: isFinal ? CW + 12 : CW,
        height: h,
        border: isFinal ? "2px solid #c9a84c" : "1px solid #c4cdd5",
        background: "#fff",
        zIndex: 2,
        boxShadow: isFinal ? "0 4px 16px rgba(201,168,76,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-1.5"
        style={{
          height: headH,
          fontSize: 9,
          background: isFinal ? "#1a2d4a" : "#edf1f5",
          borderBottom: isFinal ? "1px solid #c9a84c" : "1px solid #dde3e9",
          color: isFinal ? "#c9a84c" : "#5a6d80",
        }}
      >
        <span className="font-bold">{isFinal ? "🏆 " : ""}S{matchId}</span>
        <span className="truncate ml-1">{venue}</span>
      </div>
      {mkRow(teamA, labelA, "a")}
      {mkRow(teamB, labelB, "b")}
      {showProb && (
        <div className="flex" style={{ height: probH }}>
          <div style={{ width: `${prob.a}%`, background: "#3b82f6", transition: "width 0.3s" }} />
          <div style={{ width: `${prob.b}%`, background: "#cbd5e1", transition: "width 0.3s" }} />
        </div>
      )}
    </div>
  );
}
