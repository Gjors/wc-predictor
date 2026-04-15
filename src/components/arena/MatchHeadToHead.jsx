import { motion as Motion } from "framer-motion";
import { sn } from "../../utils/helpers";

function clampPercent(value, fallback = 50) {
  if (Number.isNaN(value) || value === undefined || value === null) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formBadge(result, index) {
  const styles = {
    W: "bg-emerald-600 text-white",
    D: "bg-slate-500 text-white",
    L: "bg-rose-600 text-white",
  };
  const label = result || "?";
  return (
    <span
      key={index}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${styles[result] || "bg-slate-300 text-slate-700"}`}
    >
      {label}
    </span>
  );
}

function TeamPanel({ team, sideLabel, flagUrl, form, selected, defeated, onPick, disabled, lang }) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition ${
        selected ? "border-emerald-500 ring-1 ring-emerald-300" : "border-slate-200"
      } ${defeated ? "opacity-60" : ""} ${disabled ? "cursor-not-allowed" : "hover:border-slate-300"}`}
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{sideLabel}</p>
      <div className="flex items-center gap-3">
        {flagUrl ? (
          <img src={flagUrl} alt={`${team} flag`} className="h-12 w-16 rounded-md border border-slate-200 object-cover" loading="lazy" />
        ) : (
          <span className="h-12 w-16 rounded-md border border-slate-200 bg-slate-100" />
        )}
        <h3 className="truncate text-2xl font-bold text-slate-900">{team ? sn(team, lang) : "TBD"}</h3>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">Form (W-D-L)</p>
        <div className="flex gap-1.5">{(form || []).map((item, i) => formBadge(item, i))}</div>
      </div>
    </button>
  );
}

export default function MatchHeadToHead({
  match,
  teamA,
  teamB,
  teamMeta,
  winner,
  onPick,
  lang = "en",
  locked = false,
  probabilityA,
  probabilityB,
  hint,
  players,
}) {
  const safeA = clampPercent(probabilityA);
  const safeB = clampPercent(probabilityB, 100 - safeA);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6">
      <header className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{match.roundLabel}</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">Match {match.roundIndex}</h2>
        <p className="mt-1 text-sm text-slate-500">{match.v}</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <TeamPanel
          team={teamA}
          sideLabel="Team A"
          flagUrl={teamMeta?.a?.flagUrl}
          form={teamMeta?.a?.form}
          selected={winner === "a"}
          defeated={Boolean(winner && winner !== "a")}
          onPick={() => teamA && !locked && onPick(match.id, "a")}
          disabled={!teamA || locked}
          lang={lang}
        />
        <div className="mx-auto rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold tracking-wide text-slate-600">VS</div>
        <TeamPanel
          team={teamB}
          sideLabel="Team B"
          flagUrl={teamMeta?.b?.flagUrl}
          form={teamMeta?.b?.form}
          selected={winner === "b"}
          defeated={Boolean(winner && winner !== "b")}
          onPick={() => teamB && !locked && onPick(match.id, "b")}
          disabled={!teamB || locked}
          lang={lang}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{teamA || "Team A"}</span>
          <span>{teamB || "Team B"}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <Motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${safeA}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm font-semibold tabular-nums text-slate-700">
          <span>{safeA}%</span>
          <span>{safeB}%</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Odds edge</p>
          <p className="mt-1 text-sm text-slate-700">{hint}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Key player · {teamA || "Team A"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{players?.left?.name}</p>
          <p className="text-sm text-slate-600">{players?.left?.stat}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Key player · {teamB || "Team B"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{players?.right?.name}</p>
          <p className="text-sm text-slate-600">{players?.right?.stat}</p>
        </article>
      </div>
    </section>
  );
}
