import { useMemo, useState } from "react";
import { ISO_CODES, UI_DICT } from "../data/constants";
import { sn } from "../utils/helpers";
import { buildPathDifficultyTierList, getTeamGroup } from "../utils/pathDifficulty";

const TIER_STYLE = {
  S: { label: "S-Tier", subtitle: "Easiest Path", bg: "linear-gradient(90deg,#f59e0b,#fde047)", border: "#facc15" },
  A: { label: "A-Tier", subtitle: "Smooth Sailing", bg: "linear-gradient(90deg,#8b5cf6,#c084fc)", border: "#a855f7" },
  B: { label: "B-Tier", subtitle: "Balanced", bg: "linear-gradient(90deg,#0ea5e9,#38bdf8)", border: "#0284c7" },
  C: { label: "C-Tier", subtitle: "Tough Road", bg: "linear-gradient(90deg,#22c55e,#86efac)", border: "#16a34a" },
  F: { label: "F-Tier", subtitle: "Hell Path", bg: "linear-gradient(90deg,#ef4444,#f97316)", border: "#dc2626" },
};

const FINISH_OPTIONS = [
  { key: "none", rank: null, labelKey: "tierToggleExpected" },
  { key: "first", rank: 1, labelKey: "tierToggleFirst" },
  { key: "second", rank: 2, labelKey: "tierToggleSecond" },
];

export default function PathDifficultyTierList({ lang = "de" }) {
  const t = UI_DICT[lang];
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [finishMode, setFinishMode] = useState("none");

  const finishOverride = useMemo(() => {
    if (!selectedTeam || finishMode === "none") return "none";
    return { team: selectedTeam, rank: finishMode === "first" ? 1 : 2 };
  }, [finishMode, selectedTeam]);

  const tierData = useMemo(
    () => buildPathDifficultyTierList({ favoriteCount: 24, finishOverride }),
    [finishOverride],
  );

  const selectedEntry = useMemo(
    () => tierData.entries.find((entry) => entry.team === selectedTeam) || null,
    [selectedTeam, tierData.entries],
  );

  return (
    <div className="p-3 sm:p-4" style={{ background: "#f7f9fb" }}>
      <h2
        className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
        style={{ color: "#1a2d4a", borderBottom: "2px solid #1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        {t.tierTitle}
      </h2>
      <p className="text-xs mb-3" style={{ color: "#475569" }}>
        {t.tierSubtitle}
      </p>

      <div className="mb-3 rounded border bg-white p-2" style={{ borderColor: "#d1d9e0" }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}>
          {t.tierWhatIf}
        </div>
        <div className="flex flex-wrap gap-2">
          {FINISH_OPTIONS.map((option) => {
            const active = finishMode === option.key;
            const disabled = option.key !== "none" && !selectedTeam;
            return (
              <button
                key={option.key}
                type="button"
                disabled={disabled}
                onClick={() => setFinishMode(option.key)}
                className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: active ? "#0f172a" : "#e2e8f0",
                  color: active ? "#f8fafc" : "#334155",
                  fontFamily: "'Barlow Condensed',sans-serif",
                }}
              >
                {t[option.labelKey]}
              </button>
            );
          })}
        </div>
        {selectedTeam ? (
          <p className="mt-2 text-[11px]" style={{ color: "#64748b" }}>
            {t.tierSelectedPrefix} <strong>{sn(selectedTeam, lang)}</strong> ({t.group} {getTeamGroup(selectedTeam)})
          </p>
        ) : (
          <p className="mt-2 text-[11px]" style={{ color: "#94a3b8" }}>{t.tierSelectHint}</p>
        )}
      </div>

      <div className="space-y-2">
        {Object.entries(TIER_STYLE).map(([tierKey, style]) => (
          <div key={tierKey} className="rounded border overflow-hidden" style={{ borderColor: style.border, boxShadow: "0 3px 10px rgba(15,23,42,0.08)" }}>
            <div className="flex items-center justify-between px-3 py-1.5" style={{ background: style.bg }}>
              <div className="text-white font-bold uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{style.label}</div>
              <div className="text-white text-[11px] font-semibold">{style.subtitle}</div>
            </div>
            <div className="bg-white p-2 min-h-14 flex flex-wrap gap-2">
              {(tierData.tiers[tierKey] || []).map((entry) => {
                const isActive = selectedTeam === entry.team;
                const code = ISO_CODES[entry.team];
                return (
                  <button
                    key={entry.team}
                    type="button"
                    onClick={() => setSelectedTeam(entry.team)}
                    onMouseEnter={() => setSelectedTeam(entry.team)}
                    className="px-2 py-1 rounded border text-left transition-all"
                    style={{
                      borderColor: isActive ? style.border : "#cbd5e1",
                      background: isActive ? "#eff6ff" : "#ffffff",
                      minWidth: 110,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {code ? (
                        <img src={`https://flagcdn.com/w20/${code}.png`} alt={`${entry.team} flag`} className="w-4 h-3 rounded-sm object-cover" loading="lazy" />
                      ) : (
                        <span className="w-4 h-3 rounded-sm bg-slate-200 inline-block" aria-label={`${entry.team} flag missing`} />
                      )}
                      <span className="text-[11px] font-semibold" style={{ color: "#0f172a" }}>{sn(entry.team, lang)}</span>
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: "#475569" }}>
                      {t.tierScore}: {entry.totalStrength.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedEntry && (
        <div className="mt-3 rounded border bg-white p-3" style={{ borderColor: "#1d4ed8", boxShadow: "0 6px 16px rgba(29,78,216,0.15)" }}>
          <div className="text-[11px] uppercase tracking-wider font-bold mb-1" style={{ color: "#1d4ed8", fontFamily: "'Barlow Condensed',sans-serif" }}>
            {t.tierRevealTitle}
          </div>
          <div className="font-bold text-sm mb-1" style={{ color: "#0f172a" }}>
            {sn(selectedEntry.team, lang)} — {t.tierPathToSF}
          </div>
          <div className="text-xs" style={{ color: "#334155", lineHeight: 1.4 }}>
            Ro32 vs <strong>{sn(selectedEntry.rounds.r32, lang)}</strong> ➔ Ro16 vs <strong>{sn(selectedEntry.rounds.r16, lang)}</strong> ➔ QF vs <strong>{sn(selectedEntry.rounds.qf, lang)}</strong>
          </div>
          <div className="mt-2 text-[11px]" style={{ color: "#475569" }}>
            {t.tierWhy}: {t.tierTotalStrength} <strong>{selectedEntry.totalStrength.toFixed(2)}</strong>, {t.tierAvgStrength} <strong>{selectedEntry.averageStrength.toFixed(2)}</strong>.
          </div>
        </div>
      )}
    </div>
  );
}
