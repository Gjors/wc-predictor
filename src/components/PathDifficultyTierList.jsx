import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
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

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "fin"];
const SIM_STEP_MS = 700;

function Flag({ team }) {
  const code = ISO_CODES[team];
  if (!code) {
    return <span className="inline-block h-3 w-4 rounded-sm bg-slate-200" aria-label={`${team} flag missing`} />;
  }

  return <img src={`https://flagcdn.com/w20/${code}.png`} alt={`${team} flag`} className="h-3 w-4 rounded-sm object-cover" loading="lazy" />;
}

function PathLine({ title, team, lang, state = "locked", delay = 0 }) {
  const isVisible = state === "revealed";
  const isGhost = state === "ghost";

  return (
    <Motion.div
      layout
      initial={false}
      animate={
        isVisible
          ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
          : { opacity: isGhost ? 0.35 : 0.75, y: 0, scale: 1, filter: "blur(0px)" }
      }
      transition={{ type: "spring", stiffness: 210, damping: 22, delay }}
      className={`relative flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] ${
        isVisible ? "border-cyan-300 bg-cyan-50/80 text-slate-800 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]" : "border-dashed border-slate-300 bg-slate-50 text-slate-500"
      }`}
    >
      {isVisible ? (
        <Motion.span
          className="pointer-events-none absolute inset-0 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: "linear-gradient(120deg, transparent 0%, rgba(34,211,238,0.28) 50%, transparent 100%)" }}
        />
      ) : null}
      <span className="font-semibold">{title}:</span>
      {isVisible && team ? (
        <>
          <Flag team={team} />
          <span className="font-semibold">{sn(team, lang)}</span>
        </>
      ) : (
        <span className="font-mono text-[10px] tracking-wide text-slate-400">LOCKED</span>
      )}
    </Motion.div>
  );
}

function TeamSelect({ teams, selectedTeam, onSelect, lang, t }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = selectedTeam ? `${sn(selectedTeam, lang)} (${t.group} ${getTeamGroup(selectedTeam)})` : t.tierSelectTeamPlaceholder;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
      >
        <span className="flex items-center gap-2">
          {selectedTeam ? <Flag team={selectedTeam} /> : <span className="inline-block h-3 w-4 rounded-sm bg-slate-200" />}
          {selectedLabel}
        </span>
        <span className="text-xs text-slate-500">▾</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded border border-slate-300 bg-white shadow-lg">
          {teams.map((team) => (
            <button
              type="button"
              key={team}
              onClick={() => {
                onSelect(team);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 border-b border-slate-100 px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Flag team={team} />
              <span>{sn(team, lang)}</span>
              <span className="text-xs text-slate-500">({t.group} {getTeamGroup(team)})</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PathDifficultyTierList({ lang = "de" }) {
  const t = UI_DICT[lang];
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedRank, setSelectedRank] = useState(1);
  const [visibleRounds, setVisibleRounds] = useState(0);
  const [isSimulatingPath, setIsSimulatingPath] = useState(false);
  const [hasCompletedSimulation, setHasCompletedSimulation] = useState(false);

  const teams = useMemo(
    () => Object.entries(POLY_WINNER).sort((a, b) => b[1] - a[1]).map(([team]) => team),
    [],
  );
  const resetSimulation = () => {
    setVisibleRounds(0);
    setIsSimulatingPath(false);
    setHasCompletedSimulation(false);
  };

  const selectedScenario = FINISH_SCENARIOS.find((scenario) => scenario.rank === selectedRank) || FINISH_SCENARIOS[0];

  const scenarioResult = useMemo(() => {
    if (!selectedTeam) return { entry: null, tier: null };

    const data = buildPathDifficultyTierList({
      favoriteCount: 24,
      finishOverride: { team: selectedTeam, rank: selectedRank },
    });

    const entry = data.entries.find((item) => item.team === selectedTeam) || null;
    const tier = entry ? getTierByTeam(data.tiers, selectedTeam) : null;

    return { entry, tier };
  }, [selectedTeam, selectedRank]);

  useEffect(() => {
    if (!isSimulatingPath || !scenarioResult.entry) return undefined;

    const timers = ROUND_ORDER.map((_, index) =>
      setTimeout(() => {
        setVisibleRounds(index + 1);
        if (index === ROUND_ORDER.length - 1) {
          setIsSimulatingPath(false);
          setHasCompletedSimulation(true);
        }
      }, (index + 1) * SIM_STEP_MS),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [isSimulatingPath, scenarioResult.entry]);

  const tierInfo = scenarioResult.tier ? TIER_STYLE[scenarioResult.tier] : null;
  const progress = ROUND_ORDER.length ? Math.min(visibleRounds / ROUND_ORDER.length, 1) : 0;

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

        <TeamSelect
          teams={teams}
          selectedTeam={selectedTeam}
          onSelect={(team) => {
            resetSimulation();
            setSelectedTeam(team);
          }}
          lang={lang}
          t={t}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {FINISH_SCENARIOS.map((scenario) => (
            <button
              key={scenario.key}
              type="button"
              onClick={() => {
                if (scenario.rank !== selectedRank) {
                  resetSimulation();
                  setSelectedRank(scenario.rank);
                }
              }}
              className="rounded border px-2 py-1 text-xs font-semibold"
              style={{
                borderColor: selectedRank === scenario.rank ? "#0f172a" : "#cbd5e1",
                background: selectedRank === scenario.rank ? "#0f172a" : "#fff",
                color: selectedRank === scenario.rank ? "#fff" : "#334155",
              }}
            >
              {t[scenario.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {!selectedTeam ? (
        <p className="text-xs" style={{ color: "#64748b" }}>{t.tierSelectHint}</p>
      ) : (
        <article className="rounded border bg-white p-3 shadow-sm" style={{ borderColor: "#d1d9e0" }}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">{t[selectedScenario.labelKey]}</h3>
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

          {scenarioResult.entry ? (
            <>
              <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  <span>{isSimulatingPath ? t.simulating : hasCompletedSimulation ? "Simulation Complete" : "Simulation Ready"}</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <Motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
                    initial={false}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  [t.roundR32, scenarioResult.entry.rounds.r32],
                  [t.roundR16, scenarioResult.entry.rounds.r16],
                  [t.roundQF, scenarioResult.entry.rounds.qf],
                  [t.roundSF, scenarioResult.entry.rounds.sf],
                  [t.final, scenarioResult.entry.rounds.fin],
                ].map(([title, team], index) => (
                  <PathLine
                    key={`${title}-${team}`}
                    title={title}
                    team={team}
                    lang={lang}
                    state={visibleRounds > index ? "revealed" : isSimulatingPath ? "ghost" : "locked"}
                    delay={index * 0.03}
                  />
                ))}
              </div>

              <AnimatePresence>
                {!isSimulatingPath && !hasCompletedSimulation ? (
                  <Motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-2 text-[11px] text-slate-500"
                  >
                    Starte die Simulation, um den kompletten Turnierpfad freizuschalten.
                  </Motion.p>
                ) : null}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => {
                  setVisibleRounds(0);
                  setIsSimulatingPath(true);
                  setHasCompletedSimulation(false);
                }}
                disabled={isSimulatingPath}
                className="mt-3 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSimulatingPath ? t.simulating : t.simBracket}
              </button>

              <p className="mt-2 text-[11px] text-slate-500">
                {t.tierScore}: {scenarioResult.entry.totalStrength.toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">{t.noPath}</p>
          )}
        </article>
      )}
    </div>
  );
}
