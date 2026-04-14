import { AnimatePresence, motion as Motion } from "framer-motion";
import { sn } from "../../utils/helpers";

export default function MatchArena({
  match,
  teamA,
  teamB,
  teamMeta = {},
  winner,
  onPick,
  lang = "en",
  locked = false,
}) {
  const matchupKey = `${match.id}-${teamA || "pending"}-${teamB || "pending"}`;

  const renderFormBadge = (result, index) => {
    const baseClass = "inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black";
    if (result === "W") return <span key={index} className={`${baseClass} border-emerald-300/60 bg-emerald-400/20 text-emerald-100`}>W</span>;
    if (result === "D") return <span key={index} className={`${baseClass} border-amber-300/60 bg-amber-400/20 text-amber-100`}>D</span>;
    if (result === "L") return <span key={index} className={`${baseClass} border-rose-300/60 bg-rose-500/25 text-rose-100`}>L</span>;
    return <span key={index} className={`${baseClass} border-slate-500 bg-slate-700/50 text-slate-200`}>?</span>;
  };

  const renderTeamCard = (team, side) => {
    const selected = winner === side;
    const defeated = winner && winner !== side;
    const teamInfo = teamMeta[side] || {};
    const form = teamInfo.form || ["?", "?", "?", "?"];

    return (
      <Motion.button
        type="button"
        onClick={() => team && !locked && onPick(match.id, side)}
        disabled={!team || locked}
        className="relative min-h-36 w-full overflow-hidden rounded-2xl border px-4 py-5 text-left transition disabled:cursor-not-allowed"
        animate={{
          scale: selected ? 1.05 : 1,
          opacity: defeated ? 0.25 : 1,
          borderColor: selected ? "rgba(52,211,153,0.9)" : "rgba(148,163,184,0.35)",
          boxShadow: selected
            ? "0 0 40px rgba(16,185,129,0.55)"
            : defeated
              ? "0 0 0 rgba(0,0,0,0)"
              : "0 0 20px rgba(14,116,144,0.25)",
        }}
        whileHover={!locked && team ? { scale: 1.03 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        style={{
          background:
            "radial-gradient(circle at top, rgba(30,41,59,0.9), rgba(15,23,42,0.95) 70%)",
        }}
      >
        <div className="mb-2 text-xs uppercase tracking-[0.15em] text-slate-300">{side === "a" ? "Home side" : "Away side"}</div>
        <div className="flex items-center gap-3">
          {teamInfo.flagUrl ? (
            <img
              src={teamInfo.flagUrl}
              alt={`${team} flag`}
              className="h-8 w-12 rounded-md border border-white/25 object-cover shadow-[0_0_20px_rgba(34,211,238,0.25)]"
              loading="lazy"
            />
          ) : (
            <span className="inline-block h-8 w-12 rounded-md border border-white/20 bg-slate-700/70" aria-label={`${team || "Team"} flag missing`} />
          )}
          <div className="text-2xl font-black tracking-wide text-white md:text-3xl">{team ? sn(team, lang) : "TBD"}</div>
        </div>
        <div className="mt-3">
          <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-cyan-200/90">Recent form</div>
          <div className="flex items-center gap-1.5">{form.map((item, index) => renderFormBadge(item, index))}</div>
        </div>
        {selected && <div className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Winner locked</div>}
      </Motion.button>
    );
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-slate-900/80 p-6 shadow-[0_0_45px_rgba(56,189,248,0.25)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_55%)]" />

      <AnimatePresence mode="wait">
        <Motion.div
          key={matchupKey}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/90">{match.roundLabel}</p>
            <h3 className="mt-2 text-3xl font-black tracking-[0.08em] text-white md:text-4xl">Arena Match {match.roundIndex}</h3>
            <p className="mt-2 text-sm text-slate-300">{match.v}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {renderTeamCard(teamA, "a")}
            <Motion.div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/60 text-xl font-black text-cyan-200"
              animate={{ rotate: [0, -8, 8, 0], boxShadow: ["0 0 10px rgba(34,211,238,0.3)", "0 0 30px rgba(34,211,238,0.75)", "0 0 10px rgba(34,211,238,0.3)"] }}
              transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY }}
            >
              VS
            </Motion.div>
            {renderTeamCard(teamB, "b")}
          </div>
        </Motion.div>
      </AnimatePresence>
    </section>
  );
}
