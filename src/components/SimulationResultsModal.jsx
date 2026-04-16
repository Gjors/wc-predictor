import { ISO_CODES } from "../data/constants";
import { sn } from "../utils/helpers";

const toPercent = (value, runs) => {
  if (!runs) return "0%";
  return `${Math.round((value / runs) * 100)}%`;
};

const heatmapStyle = (value, runs) => {
  if (!runs) return {};
  const ratio = value / runs;
  const alpha = Math.max(0, Math.min(0.24, ratio * 0.24));
  return {
    backgroundColor: `rgba(5, 150, 105, ${alpha})`,
  };
};

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

export default function SimulationResultsModal({
  isOpen,
  rows,
  runs,
  lang,
  labels,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-3 py-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">{labels.title}</h3>
            <p className="text-xs text-slate-500">{labels.subtitle.replace("{n}", String(runs))}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100"
          >
            {labels.close}
          </button>
        </div>

        <div className="max-h-[65vh] overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-600">
                <th className="px-3 py-2 font-semibold">{labels.team}</th>
                <th className="px-3 py-2 font-semibold">{labels.champion}</th>
                <th className="px-3 py-2 font-semibold">{labels.final}</th>
                <th className="px-3 py-2 font-semibold">{labels.semiFinal}</th>
                <th className="px-3 py-2 font-semibold">{labels.quarterFinal}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.team} className="border-t border-slate-100 text-slate-700">
                  <td className="px-3 py-2">
                    <TeamCell team={row.team} lang={lang} />
                  </td>
                  <td className="px-3 py-2 font-semibold" style={heatmapStyle(row.wins, runs)}>{toPercent(row.wins, runs)}</td>
                  <td className="px-3 py-2" style={heatmapStyle(row.finals, runs)}>{toPercent(row.finals, runs)}</td>
                  <td className="px-3 py-2" style={heatmapStyle(row.semiFinals, runs)}>{toPercent(row.semiFinals, runs)}</td>
                  <td className="px-3 py-2" style={heatmapStyle(row.quarterFinals, runs)}>{toPercent(row.quarterFinals, runs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
