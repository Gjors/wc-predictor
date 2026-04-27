import { useEffect, useMemo, useRef, useState } from "react";
import { FORM, ISO_CODES, MV, UI_DICT } from "../data/constants";
import { fmtMV, sn } from "../utils/helpers";

const RC = ["bg-emerald-600 text-white", "bg-sky-600 text-white", "bg-amber-500 text-white", "bg-slate-400 text-white"];
const FC = { S: "bg-emerald-500", U: "bg-gray-400", N: "bg-red-500" };

export default function GroupTable({
  gid,
  teams,
  onReorder,
  lang = "de",
  isDetailMode = false,
  groupPicks = {},
  onPickMatch,
  groupMatches = [],
  theme = "light",
}) {
  const t = UI_DICT[lang];
  const drag = useRef(null);
  const over = useRef(null);

  const onEnd = () => {
    if (isDetailMode) return;
    if (drag.current === null || over.current === null || drag.current === over.current) return;
    const t = [...teams];
    const d = t.splice(drag.current, 1)[0];
    t.splice(over.current, 0, d);
    onReorder(gid, t);
    drag.current = null;
    over.current = null;
  };

  const containerRef = useRef(null);
  const [td, setTd] = useState(null);

  useEffect(() => {
    if (isDetailMode) return undefined;
    const el = containerRef.current;
    if (!el) return;
    let sy = 0;
    let si = -1;
    let rh = 0;
    let act = false;
    let tmr = null;
    let cur = null;

    const onTS = (e) => {
      const row = e.target.closest("[data-ri]");
      if (!row) return;
      si = +row.dataset.ri;
      sy = e.touches[0].clientY;
      rh = row.offsetHeight;
      tmr = setTimeout(() => {
        act = true;
        cur = { from: si, to: si, dy: 0, rowH: rh };
        setTd({ ...cur });
        if (navigator.vibrate) navigator.vibrate(30);
      }, 400);
    };

    const onTM = (e) => {
      const dy = e.touches[0].clientY - sy;
      if (!act) {
        if (Math.abs(dy) > 10) clearTimeout(tmr);
        return;
      }
      e.preventDefault();
      const to = Math.max(0, Math.min(3, si + Math.round(dy / rh)));
      cur = { from: si, to, dy, rowH: rh };
      setTd({ ...cur });
    };

    const onTE = () => {
      clearTimeout(tmr);
      if (act && cur && cur.from !== cur.to) {
        const t = [...teams];
        const d = t.splice(cur.from, 1)[0];
        t.splice(cur.to, 0, d);
        onReorder(gid, t);
      }
      act = false;
      cur = null;
      setTd(null);
    };

    el.addEventListener("touchstart", onTS, { passive: true });
    el.addEventListener("touchmove", onTM, { passive: false });
    el.addEventListener("touchend", onTE);
    el.addEventListener("touchcancel", onTE);
    return () => {
      clearTimeout(tmr);
      el.removeEventListener("touchstart", onTS);
      el.removeEventListener("touchmove", onTM);
      el.removeEventListener("touchend", onTE);
      el.removeEventListener("touchcancel", onTE);
    };
  }, [gid, isDetailMode, onReorder, teams]);

  const pointsByTeam = useMemo(() => {
    const points = Object.fromEntries(teams.map((team) => [team, 0]));
    groupMatches.forEach(([aIndex, bIndex], matchIndex) => {
      const teamA = teams[aIndex];
      const teamB = teams[bIndex];
      if (!teamA || !teamB) return;
      const pick = groupPicks[`${gid}-${matchIndex}`];
      if (pick === "1") points[teamA] += 3;
      if (pick === "X") {
        points[teamA] += 1;
        points[teamB] += 1;
      }
      if (pick === "2") points[teamB] += 3;
    });
    return points;
  }, [gid, groupMatches, groupPicks, teams]);

  const viewTeams = useMemo(() => {
    if (!isDetailMode) return teams;
    return [...teams].sort((a, b) => {
      const byPoints = (pointsByTeam[b] || 0) - (pointsByTeam[a] || 0);
      if (byPoints !== 0) return byPoints;
      return (MV[b] || 0) - (MV[a] || 0);
    });
  }, [isDetailMode, pointsByTeam, teams]);

  const maxMV = Math.max(...viewTeams.map((t) => MV[t] || 0));
  const isDark = theme === "dark";

  return (
    <div className="mb-3">
      <div className="px-3 py-1.5 rounded-t flex items-center justify-between" style={{ background: isDark ? "#0f2547" : "#1a2d4a", color: "#fff" }}>
        <span className="font-bold text-xs tracking-wide" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{t.group} {gid}</span>
        {isDetailMode ? (
          <div className="text-blue-300 flex items-center justify-end gap-4" style={{ fontSize: 9 }}>
            <span>{t.marketValue}</span>
            <span className="text-right w-12">{t.pointsShort}</span>
          </div>
        ) : (
          <span className="text-blue-300" style={{ fontSize: 9 }}>{t.marketValue}</span>
        )}
      </div>
      <div
        ref={containerRef}
        className="border border-t-0 rounded-b"
        style={{ borderColor: isDark ? "rgba(148,163,184,0.35)" : "#d1d9e0", WebkitTouchCallout: "none", pointerEvents: isDetailMode ? "none" : "auto" }}
      >
        {viewTeams.map((team, i) => {
          const form = FORM[team] || [];
          const mv = MV[team] || 0;
          const isDragged = td && td.from === i;
          let transform = "";
          let zIdx = 1;
          let transition = "";
          let shadow = "none";
          let bg = i % 2 === 0 ? (isDark ? "rgba(9,23,43,0.92)" : "#fff") : (isDark ? "rgba(17,36,63,0.92)" : "#f7f9fb");

          if (td) {
            if (isDragged) {
              transform = `translateY(${td.dy}px) scale(1.04)`;
              zIdx = 10;
              shadow = "0 8px 24px rgba(0,0,0,0.18)";
              bg = isDark ? "rgba(22,78,99,0.82)" : "#e0f2fe";
            } else {
              const { from, to, rowH } = td;
              transition = "transform 0.15s ease";
              if (from < to && i > from && i <= to) transform = `translateY(-${rowH}px)`;
              else if (from > to && i >= to && i < from) transform = `translateY(${rowH}px)`;
            }
          }

          return (
            <div
              key={team}
              data-ri={i}
              draggable={!isDetailMode}
              onDragStart={() => {
                drag.current = i;
              }}
              onDragEnter={() => {
                over.current = i;
              }}
              onDragEnd={onEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center px-2 py-1.5 text-xs select-none ${isDetailMode ? "" : isDark ? "cursor-grab active:cursor-grabbing hover:bg-[#1e3458]" : "cursor-grab active:cursor-grabbing hover:bg-blue-50"} ${i < 3 ? "border-b" : ""}`}
              style={{
                borderColor: isDark ? "rgba(148,163,184,0.22)" : "#e8ecf0",
                background: bg,
                position: "relative",
                transform,
                zIndex: zIdx,
                transition,
                boxShadow: shadow,
                borderRadius: isDragged ? "6px" : "0",
                willChange: isDragged ? "transform" : "auto",
              }}
            >
              <span className={`mr-1 hidden sm:inline ${isDark ? "text-slate-500" : "text-slate-300"}`} style={{ fontSize: 10 }}>⠿</span>
              <span className={`inline-flex items-center justify-center w-5 h-4 rounded font-bold mr-1.5 flex-shrink-0 ${RC[i]}`} style={{ fontSize: 10 }}>{i + 1}</span>
              {ISO_CODES[team] ? (
                <img
                  src={`https://flagcdn.com/w20/${ISO_CODES[team]}.png`}
                  alt={`${team} flag`}
                  className="mr-1 w-4 h-3 object-cover rounded-sm shadow-sm inline-block"
                  loading="lazy"
                />
              ) : (
                <span className="mr-1 w-4 h-3 rounded-sm bg-gray-300 inline-block" aria-label={`${team} flag missing`} />
              )}
              <span className={`truncate font-medium ${isDark ? "text-slate-100" : "text-slate-800"}`} style={{ minWidth: 0, maxWidth: 90 }}>{sn(team, lang)}</span>

              <div className="flex items-center gap-0.5 mx-1.5 sm:mx-2 flex-shrink-0">
                {[...form].reverse().map((f, fi) => {
                  const r = f[0];
                  const detail = f.slice(2);
                  return (
                    <span key={fi} className="relative group/dot" title={detail}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${FC[r] || "bg-gray-300"} ${isDark ? "ring-1 ring-slate-700" : "ring-1 ring-white"}`} />
                      <span
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded shadow-lg bg-slate-800 text-white whitespace-nowrap hidden group-hover/dot:block z-50 pointer-events-none"
                        style={{ fontSize: 10 }}
                      >
                        {detail}
                      </span>
                    </span>
                  );
                })}
              </div>

              <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                <div className="hidden sm:block w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden" title={`${fmtMV(mv, lang)} €`}>
                  <div className="h-full rounded-full" style={{ width: `${maxMV ? (mv / maxMV) * 100 : 0}%`, background: mv >= 500 ? "#16a34a" : mv >= 200 ? "#2563eb" : mv >= 100 ? "#d97706" : "#94a3b8" }} />
                </div>
                <span className={`font-mono text-right ${isDark ? "text-slate-300" : "text-slate-500"}`} style={{ fontSize: 9, minWidth: 52 }}>{fmtMV(mv, lang)} €</span>
                {isDetailMode && (
                  <span className={`w-12 text-right font-bold ${isDark ? "text-slate-100" : "text-slate-700"}`} style={{ fontSize: 10 }}>
                    {pointsByTeam[team] || 0}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isDetailMode && (
        <div className="mt-2 rounded border px-2 py-2" style={{ borderColor: isDark ? "rgba(148,163,184,0.35)" : "#d1d9e0", background: isDark ? "rgba(10,25,45,0.88)" : "#fff" }}>
          <div className="space-y-1.5">
            {groupMatches.map(([aIndex, bIndex], matchIndex) => {
              const teamA = teams[aIndex];
              const teamB = teams[bIndex];
              const pick = groupPicks[`${gid}-${matchIndex}`];
              return (
                <div key={`${gid}-match-${matchIndex}`} className="rounded border px-2 py-1.5" style={{ borderColor: isDark ? "rgba(148,163,184,0.28)" : "#e8ecf0", background: isDark ? "rgba(22,38,66,0.82)" : "transparent" }}>
                  <div className={`mb-1 ${isDark ? "text-slate-400" : "text-slate-400"}`} style={{ fontSize: 10 }}>{t.matchday} {matchIndex + 1}</div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                    <span className={`truncate text-right ${isDark ? "text-slate-100" : "text-slate-700"}`} style={{ fontSize: 11 }}>{sn(teamA, lang)}</span>
                    <div className="flex items-center gap-1">
                      {["1", "X", "2"].map((option) => {
                        const active = pick === option;
                        return (
                          <button
                            key={option}
                            onClick={() => onPickMatch?.(gid, matchIndex, option)}
                            className="w-6 h-6 rounded text-[10px] font-bold border transition-colors cursor-pointer"
                            style={{
                              borderColor: active ? "#2563eb" : isDark ? "rgba(148,163,184,0.35)" : "#cbd5e1",
                              background: active ? "#2563eb" : isDark ? "rgba(9,23,43,0.92)" : "#fff",
                              color: active ? "#fff" : isDark ? "#cbd5e1" : "#334155",
                            }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <span className={`truncate ${isDark ? "text-slate-100" : "text-slate-700"}`} style={{ fontSize: 11 }}>{sn(teamB, lang)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
