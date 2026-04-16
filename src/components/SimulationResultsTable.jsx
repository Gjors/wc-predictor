import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "framer-motion";
import { ISO_CODES } from "../data/constants";
import { sn } from "../utils/helpers";

const toPercentValue = (value, runs) => (runs > 0 ? (value / runs) * 100 : 0);

function AnimatedPercentCell({ value, runs }) {
  const target = useMemo(() => toPercentValue(value, runs), [value, runs]);
  const prevValueRef = useRef(target);
  const [displayValue, setDisplayValue] = useState(target);

  useEffect(() => {
    const controls = animate(prevValueRef.current, target, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });

    prevValueRef.current = target;

    return () => controls.stop();
  }, [target]);

  return <span className="font-semibold text-slate-700">{displayValue.toFixed(1)}%</span>;
}

function TeamCell({ team, lang }) {
  const code = ISO_CODES[team];

  return (
    <div className="flex items-center gap-2">
      {code ? (
        <img
          src={`https://flagcdn.com/w20/${code}.png`}
          alt={`${team} flag`}
          className="h-3 w-5 rounded-sm object-cover"
          loading="lazy"
        />
      ) : (
        <span className="inline-block h-3 w-5 rounded-sm bg-slate-200" aria-hidden="true" />
      )}
      <span className="font-medium text-slate-800">{sn(team, lang)}</span>
    </div>
  );
}

export default function SimulationResultsTable({ rows, totalRuns, lang, labels }) {
  return (
    <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 border-b border-slate-200 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">{labels.title}</h3>
        <p className="text-xs text-slate-500">{labels.subtitle.replace("{n}", new Intl.NumberFormat().format(totalRuns))}</p>
      </div>

      {totalRuns === 0 ? (
        <p className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">{labels.emptyState}</p>
      ) : (
        <div className="overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">{labels.team}</th>
                <th className="px-3 py-2 font-semibold">{labels.champion}</th>
                <th className="px-3 py-2 font-semibold">{labels.final}</th>
                <th className="px-3 py-2 font-semibold">{labels.semiFinal}</th>
                <th className="px-3 py-2 font-semibold">{labels.quarterFinal}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.team} className={`border-t border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                  <td className="px-3 py-2">
                    <TeamCell team={row.team} lang={lang} />
                  </td>
                  <td className="px-3 py-2">
                    <AnimatedPercentCell value={row.wins} runs={totalRuns} />
                  </td>
                  <td className="px-3 py-2">
                    <AnimatedPercentCell value={row.finals} runs={totalRuns} />
                  </td>
                  <td className="px-3 py-2">
                    <AnimatedPercentCell value={row.semiFinals} runs={totalRuns} />
                  </td>
                  <td className="px-3 py-2">
                    <AnimatedPercentCell value={row.quarterFinals} runs={totalRuns} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
