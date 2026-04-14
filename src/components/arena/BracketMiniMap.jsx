import { motion as Motion } from "framer-motion";
import { sn } from "../../utils/helpers";

function Node({ match, teams, winner, lang, isActive, isNext, isRoundPeer }) {
  const nodeClass = isActive
    ? "border-cyan-300 bg-cyan-400/20 shadow-[0_0_24px_rgba(34,211,238,0.5)]"
    : isNext
      ? "border-violet-300/70 bg-violet-400/15 shadow-[0_0_16px_rgba(167,139,250,0.35)]"
      : isRoundPeer
        ? "border-amber-300/60 bg-amber-400/10"
        : "border-white/15 bg-white/5";

  return (
    <Motion.div
      layout
      animate={isActive ? { boxShadow: ["0 0 10px rgba(34,211,238,0.35)", "0 0 24px rgba(34,211,238,0.8)", "0 0 10px rgba(34,211,238,0.35)"] } : undefined}
      transition={isActive ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY } : { duration: 0.25 }}
      className={`rounded-lg border px-2 py-2 transition-colors ${nodeClass}`}
    >
      <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-slate-400">{match.roundLabel} · M{match.id}</div>
      <div className="space-y-1 text-xs">
        <div className={winner === "a" ? "font-semibold text-emerald-300" : "text-slate-200"}>{teams.teamA ? sn(teams.teamA, lang) : "TBD"}</div>
        <div className={winner === "b" ? "font-semibold text-emerald-300" : "text-slate-200"}>{teams.teamB ? sn(teams.teamB, lang) : "TBD"}</div>
      </div>
      {isActive && <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">Live now</div>}
      {!isActive && isNext && <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-200">Next opponent node</div>}
    </Motion.div>
  );
}

export default function BracketMiniMap({
  rounds,
  winners,
  resolveTeams,
  currentMatchId,
  nextMatchId,
  activeRoundKey,
  lang = "en",
}) {
  return (
    <aside className="rounded-2xl border border-cyan-300/35 bg-slate-950/75 p-3 shadow-[0_0_35px_rgba(34,211,238,0.2)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Bird&apos;s-eye HUD</h4>
        <span className="rounded-full border border-cyan-300/45 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">Tactical map</span>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {rounds.map((round) => (
          <div key={round.key} className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">{round.roundLabel}</div>
            {round.matches.map((match) => (
              <Node
                key={match.id}
                match={match}
                teams={resolveTeams(match.id)}
                winner={winners[match.id]}
                lang={lang}
                isActive={match.id === currentMatchId}
                isNext={match.id === nextMatchId}
                isRoundPeer={round.key === activeRoundKey && match.id !== currentMatchId}
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
