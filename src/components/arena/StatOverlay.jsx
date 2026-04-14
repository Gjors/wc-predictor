import { motion as Motion } from "framer-motion";

const defaultPlayers = {
  left: { name: "Star Forward", stat: "5 goals in qualifiers" },
  right: { name: "Playmaker", stat: "8 key passes avg." },
};

function clampPercent(value) {
  if (Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function StatOverlay({
  teamA,
  teamB,
  probabilityA,
  probabilityB,
  hint,
  players = defaultPlayers,
}) {
  const safeA = clampPercent(probabilityA);
  const safeB = clampPercent(probabilityB ?? 100 - safeA);

  return (
    <aside className="rounded-2xl border border-cyan-400/40 bg-slate-950/65 p-4 backdrop-blur-md shadow-[0_0_35px_rgba(34,211,238,0.2)]">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
        <span>Power hint</span>
        <span>Pre-match edge</span>
      </div>

      <p className="mb-4 text-sm font-medium text-slate-100">{hint}</p>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
          <span>{teamA}</span>
          <span>{teamB}</span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <Motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${safeA}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <Motion.div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-fuchsia-400 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${safeB}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-200">
          <span>{safeA}%</span>
          <span>{safeB}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-cyan-200">{teamA} key player</div>
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/25 text-xs">👤</div>
          <p className="text-sm font-semibold text-slate-100">{players.left.name}</p>
          <p className="text-xs text-slate-300">{players.left.stat}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-fuchsia-200">{teamB} key player</div>
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/25 text-xs">👤</div>
          <p className="text-sm font-semibold text-slate-100">{players.right.name}</p>
          <p className="text-xs text-slate-300">{players.right.stat}</p>
        </div>
      </div>
    </aside>
  );
}
