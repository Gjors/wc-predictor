import { motion as Motion } from "framer-motion";
import { ISO_CODES } from "../data/constants";
import { sn } from "../utils/helpers";

const TOP_QF_BOSSES = new Set(["Spanien", "Frankreich", "England"]);

function PathStep({ roundLabel, team, lang }) {
  const code = ISO_CODES[team];

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-fuchsia-400/60 bg-slate-900/80 px-3 py-2 shadow-[0_0_20px_rgba(217,70,239,0.25)]">
      <span className="text-[10px] uppercase tracking-[0.16em] text-fuchsia-200">{roundLabel}</span>
      <div className="flex items-center gap-1.5">
        {code ? (
          <img
            src={`https://flagcdn.com/w20/${code}.png`}
            alt={`${team} flag`}
            className="h-3 w-5 rounded-sm object-cover"
            loading="lazy"
          />
        ) : (
          <span className="inline-block h-3 w-5 rounded-sm bg-slate-700" aria-label={`${team} flag missing`} />
        )}
        <span className="text-xs font-semibold text-white">{sn(team, lang)}</span>
      </div>
    </div>
  );
}

function getScoutAnalysis(entry) {
  if (entry.tier === "F") {
    return "Brutal gauntlet! You are facing absolute heavyweights right out of the gate.";
  }

  if (TOP_QF_BOSSES.has(entry.rounds.qf)) {
    return `Smooth start, but a massive Endboss awaits in the Quarterfinals: ${sn(entry.rounds.qf, "en")}.`;
  }

  if (entry.tier === "S") {
    return "Highway to the Semis! Statistically, this is a dream draw with very manageable opponents.";
  }

  if (entry.tier === "B" || entry.tier === "C") {
    return "A tricky but doable path. Every match will be a grind.";
  }

  return "Sharp focus needed. This lane is winnable, but one bad half can flip everything.";
}

export default function PathRevealModal({ entry, lang = "de", onClose }) {
  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Motion.div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <Motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-2xl rounded-2xl border border-cyan-300/70 bg-slate-900/95 p-5 text-white shadow-[0_0_45px_rgba(34,211,238,0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close path reveal"
          className="absolute right-3 top-3 rounded-md border border-slate-500 px-2 py-1 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200"
        >
          ✕
        </button>

        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">Path Reveal & Analysis</p>
        <h3 className="mb-4 text-lg font-bold">
          {sn(entry.team, lang)} <span className="text-cyan-300">→ Expected Route to the Semis</span>
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <PathStep roundLabel="Ro32 vs" team={entry.rounds.r32} lang={lang} />
          <span className="text-cyan-200">➔</span>
          <PathStep roundLabel="Ro16 vs" team={entry.rounds.r16} lang={lang} />
          <span className="text-cyan-200">➔</span>
          <PathStep roundLabel="QF vs" team={entry.rounds.qf} lang={lang} />
        </div>

        <div className="mt-5 rounded-xl border border-fuchsia-300/60 bg-slate-950/70 p-4 shadow-[0_0_32px_rgba(217,70,239,0.25)]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200">Scout Analysis</p>
          <p className="mt-2 text-sm text-slate-100">{getScoutAnalysis(entry)}</p>
        </div>
      </Motion.div>
    </div>
  );
}
