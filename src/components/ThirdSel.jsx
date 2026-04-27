import { useState } from "react";
import { GIDS, ISO_CODES, UI_DICT } from "../data/constants";
import { sn } from "../utils/helpers";

export default function ThirdSel({ groups, sel, onToggle, onAutoFill, onClear, lang = "de", theme = "light" }) {
  const [showInfo, setShowInfo] = useState(false);
  const n = sel.length;
  const full = n >= 8;
  const t = UI_DICT[lang];
  const isDark = theme === "dark";

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-2.5 py-1 rounded-t" style={{ background: isDark ? "#0f2547" : "#1a2d4a", color: "#fff" }}>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs tracking-wide" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{t.bestThirds}</span>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="w-4 h-4 rounded-full border border-white/60 text-[10px] font-semibold leading-none flex items-center justify-center hover:bg-white/10"
            aria-label={t.thirdsInfoLabel}
            aria-expanded={showInfo}
          >
            ?
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className={`font-mono px-1.5 py-0.5 rounded ${n === 8 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ fontSize: 10 }}>{n}/8</span>
          <button
            type="button"
            onClick={onAutoFill}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
          >
            {t.autoFill}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
          >
            {t.clear}
          </button>
        </div>
      </div>
      <div className="border border-t-0 rounded-b p-1.5" style={{ borderColor: isDark ? "rgba(148,163,184,0.35)" : "#d1d9e0", background: isDark ? "rgba(8,21,41,0.84)" : "transparent" }}>
        {showInfo && (
          <div className={`mb-1.5 rounded px-2 py-1.5 text-[11px] leading-snug ${isDark ? "bg-blue-950/70 text-blue-100" : "bg-blue-50 text-blue-800"}`}>
            {t.thirdsInfo}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
          {GIDS.map((g) => {
            const team = groups[g]?.[2];
            if (!team) return null;
            const on = sel.includes(g);
            const dis = full && !on;
            return (
              <button
                key={g}
                onClick={() => !dis && onToggle(g)}
                disabled={dis}
                className={`flex items-center gap-1 px-1.5 py-1 rounded font-medium transition-all border
                ${on
                  ? (isDark ? "bg-emerald-950/70 border-emerald-500 text-emerald-200" : "bg-emerald-50 border-emerald-400 text-emerald-800")
                  : dis
                    ? (isDark ? "bg-slate-900/70 border-slate-700 text-slate-500 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed")
                    : (isDark ? "bg-slate-900/70 border-slate-700 text-slate-100 hover:border-blue-400 cursor-pointer" : "bg-white border-gray-200 text-slate-700 hover:border-blue-300 cursor-pointer")}`}
                style={{ fontSize: 11 }}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                ${on ? "bg-emerald-500 border-emerald-500 text-white" : isDark ? "border-slate-500" : "border-gray-300"}`} style={{ fontSize: 8 }}>{on ? "✓" : ""}</span>
                {ISO_CODES[team] ? (
                  <img
                    src={`https://flagcdn.com/w20/${ISO_CODES[team]}.png`}
                    alt={`${team} flag`}
                    className="w-4 h-3 object-cover rounded-sm shadow-sm inline-block flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <span className="w-4 h-3 rounded-sm bg-gray-300 inline-block flex-shrink-0" aria-label={`${team} flag missing`} />
                )}
                <span className="truncate">{sn(team, lang)}</span>
                <span className={`ml-auto ${isDark ? "text-slate-500" : "text-gray-400"}`}>({g})</span>
              </button>
            );
          })}
        </div>
        {n < 8 && <p className={`mt-1.5 text-center ${isDark ? "text-amber-300" : "text-amber-600"}`} style={{ fontSize: 10 }}>{t.thirdsRemaining.replace("{n}", 8 - n)}</p>}
      </div>
    </div>
  );
}
