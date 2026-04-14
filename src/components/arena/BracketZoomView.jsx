import { motion as Motion } from "framer-motion";
import { sn } from "../../utils/helpers";

function MatchRow({ match, teamA, teamB, winner, lang }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-400">{match.roundLabel} · M{match.id}</div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={winner === "a" ? "font-bold text-emerald-300" : "text-slate-200"}>{teamA ? sn(teamA, lang) : "TBD"}</span>
        <span className="text-slate-500">vs</span>
        <span className={winner === "b" ? "font-bold text-emerald-300" : "text-slate-200"}>{teamB ? sn(teamB, lang) : "TBD"}</span>
      </div>
    </div>
  );
}

export default function BracketZoomView({ title, matches, resolveTeams, winners, lang = "en" }) {
  return (
    <Motion.section
      initial={{ opacity: 0, scale: 1.15 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="rounded-3xl border border-violet-300/30 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(168,85,247,0.28)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-[0.12em] text-violet-200">{title}</h3>
        <span className="rounded-full border border-violet-300/40 px-3 py-1 text-xs uppercase tracking-[0.14em] text-violet-200">Bracket Zoom</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {matches.map((match) => {
          const { teamA, teamB } = resolveTeams(match.id);
          return (
            <MatchRow
              key={match.id}
              match={match}
              teamA={teamA}
              teamB={teamB}
              winner={winners[match.id]}
              lang={lang}
            />
          );
        })}
      </div>
    </Motion.section>
  );
}
