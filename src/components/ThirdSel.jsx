import { FL, GIDS } from "../data/constants";
import { sn } from "../utils/helpers";

export default function ThirdSel({ groups, sel, onToggle }) {
  const n = sel.length;
  const full = n >= 8;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-2.5 py-1 rounded-t" style={{ background: "#1a2d4a", color: "#fff" }}>
        <span className="font-bold text-xs tracking-wide" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>BESTE DRITTPLATZIERTE</span>
        <span className={`font-mono px-1.5 py-0.5 rounded ${n === 8 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ fontSize: 10 }}>{n}/8</span>
      </div>
      <div className="border border-t-0 rounded-b p-1.5" style={{ borderColor: "#d1d9e0" }}>
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
                ${on ? "bg-emerald-50 border-emerald-400 text-emerald-800" : dis ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 text-slate-700 hover:border-blue-300 cursor-pointer"}`}
                style={{ fontSize: 11 }}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                ${on ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300"}`} style={{ fontSize: 8 }}>{on ? "✓" : ""}</span>
                <span>{FL[team] || ""}</span><span className="truncate">{sn(team)}</span>
                <span className="text-gray-400 ml-auto">({g})</span>
              </button>
            );
          })}
        </div>
        {n < 8 && <p className="text-amber-600 mt-1.5 text-center" style={{ fontSize: 10 }}>Noch {8 - n} wählen</p>}
      </div>
    </div>
  );
}
