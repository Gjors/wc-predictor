import { useMemo, useState } from "react";
import { ISO_CODES, UI_DICT } from "../data/constants";
import { sn } from "../utils/helpers";
import { buildPathDifficultyTierList, getTeamGroup, getTierByTeam } from "../utils/pathDifficulty";
import { POLY_WINNER } from "../data/polymarket";

const TIER_STYLE = {
  S: { label: "S-Tier", bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  A: { label: "A-Tier", bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  B: { label: "B-Tier", bg: "#e0f2fe", border: "#0ea5e9", text: "#075985" },
  C: { label: "C-Tier", bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  F: { label: "F-Tier", bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
};

const FINISH_SCENARIOS = [
  { key: "first", rank: 1, labelKey: "tierToggleFirst" },
  { key: "second", rank: 2, labelKey: "tierToggleSecond" },
  { key: "third", rank: 3, labelKey: "tierToggleThird" },
];

function PathLine({ title, team, lang }) {
  if (!team) {
    return (
      <div className="rounded border border-dashed border-slate-300 px-2 py-1 text-[11px] text-slate-500">
        {title}: —
      </div>
    );
  }

  const code = ISO_CODES[team];
  return (
    <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
      <span className="font-semibold text-slate-500">{title}:</span>
      {code ? (
        <img src={`https://flagcdn.com/w20/${code}.png`} alt={`${team} flag`} className="h-3 w-4 rounded-sm object-cover" loading="lazy" />
      ) : (
        <span className="inline-block h-3 w-4 rounded-sm bg-slate-200" aria-label={`${team} flag missing`} />
      )}
      <span className="font-semibold">{sn(team, lang)}</span>
    </div>
  );
}

export default function PathDifficultyTierList({ lang = "de" }) {
  const t = UI_DICT[lang];
  const [selectedTeam, setSelectedTeam] = useState("");

  const teams = useMemo(
    () => Object.entries(POLY_WINNER).sort((a, b) => b[1] - a[1]).map(([team]) => team),
    [],
  );

  const scenarioData = useMemo(
    () =>
      FINISH_SCENARIOS.map((scenario) => {
        if (!selectedTeam) {
          return { ...scenario, entry: null, tier: null };
        }

        const data = buildPathDifficultyTierList({
          favoriteCount: 24,
          finishOverride: { team: selectedTeam, rank: scenario.rank },
        });

        const entry = data.entries.find((item) => item.team === selectedTeam) || null;
        const tier = entry ? getTierByTeam(data.tiers, selectedTeam) : null;

        return { ...scenario, entry, tier };
      }),
    [selectedTeam],
  );

  return (
    <div className="p-3 sm:p-4" style={{ background: "#f7f9fb" }}>
      <h2
        className="mb-2 border-b pb-1 text-xs font-bold uppercase tracking-wider"
        style={{ color: "#1a2d4a", borderBottomColor: "#1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        {t.tierTitle}
      </h2>
      <p className="mb-3 text-xs" style={{ color: "#475569" }}>
        {t.tierSubtitle}
      </p>

      <div className="mb-4 rounded border bg-white p-3" style={{ borderColor: "#d1d9e0" }}>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider" style={{ color: "#1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}>
          {t.tierTeamSelect}
        </label>
        <select
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
        >
          <option value="">{t.tierSelectTeamPlaceholder}</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {sn(team, lang)} ({t.group} {getTeamGroup(team)})
            </option>
          ))}
        </select>
      </div>

      {!selectedTeam ? (
        <p className="text-xs" style={{ color: "#64748b" }}>{t.tierSelectHint}</p>
      ) : (
        <div className="space-y-3">
          {scenarioData.map((scenario) => {
            const tierInfo = scenario.tier ? TIER_STYLE[scenario.tier] : null;
            return (
              <article key={scenario.key} className="rounded border bg-white p-3 shadow-sm" style={{ borderColor: "#d1d9e0" }}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800">{t[scenario.labelKey]}</h3>
                  {tierInfo ? (
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{ background: tierInfo.bg, border: `1px solid ${tierInfo.border}`, color: tierInfo.text }}
                    >
                      {tierInfo.label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </div>

                {scenario.entry ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <PathLine title={t.roundR32} team={scenario.entry.rounds.r32} lang={lang} />
                      <PathLine title={t.roundR16} team={scenario.entry.rounds.r16} lang={lang} />
                      <PathLine title={t.roundQF} team={scenario.entry.rounds.qf} lang={lang} />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {t.tierScore}: {scenario.entry.totalStrength.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">{t.noPath}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
