import { useEffect, useState } from "react";
import { animate } from "framer-motion";

const RUN_OPTIONS = [100, 1000, 5000];

const formatRuns = (value) => new Intl.NumberFormat().format(value);

export default function SimulationControlBar({
  totalRuns,
  isThinking,
  pendingRuns,
  labels,
  onAddRuns,
  onResetStats,
  disabled,
}) {
  const [displayedPendingRuns, setDisplayedPendingRuns] = useState(0);

  useEffect(() => {
    if (!isThinking || !pendingRuns) return undefined;

    const controls = animate(0, pendingRuns, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayedPendingRuns(Math.round(latest)),
    });

    return () => controls.stop();
  }, [isThinking, pendingRuns]);

  const shownPendingRuns = isThinking ? displayedPendingRuns : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{labels.totalSimulationsLabel}</p>
          <p className="text-lg font-bold text-slate-800">{formatRuns(totalRuns)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RUN_OPTIONS.map((runs) => (
            <button
              key={runs}
              type="button"
              onClick={() => onAddRuns(runs)}
              disabled={disabled}
              className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: disabled ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              +{formatRuns(runs)} {labels.runsSuffix}
            </button>
          ))}
          <button
            type="button"
            onClick={onResetStats}
            disabled={disabled && totalRuns === 0}
            className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "#475569", fontFamily: "'Barlow Condensed',sans-serif" }}
          >
            {labels.resetStats}
          </button>
        </div>
      </div>

      {isThinking && (
        <div className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>{labels.calculatingLabel.replace("{n}", formatRuns(pendingRuns))}</span>
            <span>{labels.processingCounter.replace("{current}", formatRuns(shownPendingRuns)).replace("{total}", formatRuns(pendingRuns))}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-slate-200" aria-hidden="true">
            <div className="h-full w-full animate-pulse rounded bg-emerald-600/70" />
          </div>
        </div>
      )}
    </div>
  );
}
