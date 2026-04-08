import { useCallback, useEffect, useMemo, useState } from "react";
import GroupTable from "./components/GroupTable";
import ThirdSel from "./components/ThirdSel";
import { FullBracket } from "./components/Bracket";
import { FIN, QF, R16, R32, SF } from "./data/bracket";
import { GIDS, INIT_GROUPS, MV } from "./data/constants";
import {
  clearDown,
  delay,
  getTeam,
  pickWinnerByMV,
  solveThirds,
  weightedShuffle,
} from "./utils/helpers";

const decodeState = (raw) => {
  if (!raw) return null;
  try {
    const decoded = JSON.parse(atob(raw));
    if (!decoded || typeof decoded !== "object") return null;

    return {
      groups: decoded.groups && typeof decoded.groups === "object" ? decoded.groups : INIT_GROUPS,
      selThirds: Array.isArray(decoded.selThirds) ? decoded.selThirds : [],
      winners: decoded.winners && typeof decoded.winners === "object" ? decoded.winners : {},
    };
  } catch {
    return null;
  }
};

const encodeState = (groups, selThirds, winners) => {
  const payload = { groups, selThirds, winners };
  return btoa(JSON.stringify(payload));
};

const _restored = (() => {
  if (typeof window === "undefined") return null;
  const data = new URLSearchParams(window.location.search).get("data");
  return decodeState(data);
})();

export default function App() {
  const [groups, setGroups] = useState(_restored?.groups || INIT_GROUPS);
  const [selThirds, setSelThirds] = useState(_restored?.selThirds || []);
  const [winners, setWinners] = useState(_restored?.winners || {});
  const [tab, setTab] = useState("groups");

  const ta = useMemo(() => solveThirds(selThirds), [selThirds]);

  const handleReorder = useCallback((gid, order) => setGroups((p) => ({ ...p, [gid]: order })), []);
  const handleToggle = useCallback(
    (gid) => setSelThirds((p) => (p.includes(gid) ? p.filter((g) => g !== gid) : p.length >= 8 ? p : [...p, gid])),
    [],
  );
  const handleClearThirds = useCallback(() => {
    setSelThirds([]);
  }, []);
  const handleAutoThirds = useCallback(() => {
    const topThirds = GIDS.map((g) => {
      const team = groups[g]?.[2];
      const score = (MV[team] || 0) ** 2 * (0.5 + Math.random());
      return { gid: g, score };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ gid }) => gid);
    setSelThirds(topThirds);
  }, [groups]);
  const handlePick = useCallback((mid, side) => {
    setWinners((p) => {
      const n = { ...p };
      if (n[mid] === side) {
        delete n[mid];
        clearDown(mid, n);
      } else {
        n[mid] = side;
        clearDown(mid, n);
      }
      return n;
    });
  }, []);

  const totalPicks = Object.keys(winners).length;
  const [simulating, setSimulating] = useState(false);
  const groupsReady = selThirds.length === 8;

  // ── Simulate groups (weighted random by MV) ──
  const simulateGroupsFn = useCallback(async () => {
    setSimulating(true);
    setWinners({});
    setSelThirds([]);

    // Pre-compute all simulated group orderings
    const simGroups = {};
    for (const gid of GIDS) {
      simGroups[gid] = weightedShuffle(INIT_GROUPS[gid], (t) => MV[t] || 1);
    }

    // Animate one group at a time
    for (const gid of GIDS) {
      await delay(80);
      setGroups((p) => ({ ...p, [gid]: simGroups[gid] }));
    }

    // Auto-select 8 best third-place teams (weighted random)
    await delay(200);
    const thirdScores = GIDS.map((g) => ({
      g,
      score: (MV[simGroups[g][2]] || 1) * (0.5 + Math.random()),
    }));
    thirdScores.sort((a, b) => b.score - a.score);
    setSelThirds(thirdScores.slice(0, 8).map((t) => t.g));

    setSimulating(false);
  }, []);

  const resetGroupsFn = useCallback(() => {
    setGroups(INIT_GROUPS);
    setSelThirds([]);
    setWinners({});
  }, []);

  // ── Simulate bracket (weighted random by MV, round by round) ──
  const simulateBracketFn = useCallback(async () => {
    setSimulating(true);
    setWinners({});
    await delay(200);

    const curGroups = groups;
    const curTa = ta;
    const newW = {};
    const allMatches = [...R32, ...R16, ...QF, ...SF, FIN];

    for (const match of allMatches) {
      const teamA = getTeam(match.id, "a", curGroups, curTa, newW);
      const teamB = getTeam(match.id, "b", curGroups, curTa, newW);
      if (teamA && teamB) {
        newW[match.id] = pickWinnerByMV(teamA, teamB);
        await delay(60);
        setWinners({ ...newW });
      }
    }

    setSimulating(false);
  }, [groups, ta]);

  const resetBracketFn = useCallback(() => {
    setWinners({});
  }, []);

  // ── URL sync: update address bar on every state change ──
  useEffect(() => {
    const encoded = encodeState(groups, selThirds, winners);
    const url = new URL(window.location);
    url.searchParams.set("data", encoded);
    window.history.replaceState(null, "", url);
  }, [groups, selThirds, winners]);

  // ── Share link ──
  const [copied, setCopied] = useState(false);
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const inp = document.createElement("input");
      inp.value = window.location.href;
      document.body.appendChild(inp);
      inp.select();
      document.execCommand("copy");
      document.body.removeChild(inp);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ── Countdown to tournament start ──
  const WM_START = new Date("2026-06-11T12:00:00").getTime();
  const [countdown, setCountdown] = useState(() => {
    const d = WM_START - Date.now();
    if (d <= 0) return null;
    return {
      days: Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      minutes: Math.floor((d % 3600000) / 60000),
    };
  });

  useEffect(() => {
    const tick = () => {
      const d = WM_START - Date.now();
      if (d <= 0) { setCountdown(null); return; }
      setCountdown({
        days: Math.floor(d / 86400000),
        hours: Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000) / 60000),
      });
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [WM_START]);

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors
        ${tab === id ? "text-[#1a2d4a] bg-[#eef1f5] rounded-t" : "text-blue-300 hover:text-white"}`}
      style={{ fontFamily: "'Barlow Condensed',sans-serif", borderBottom: tab === id ? "none" : "2px solid transparent" }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "#eef1f5", fontFamily: "'Barlow','Barlow Condensed',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />

      <header className="sticky top-0 z-50 flex-shrink-0 shadow-sm" style={{ background: "#1a2d4a" }}>
        <div className="flex items-center px-5 py-1.5">
          <span className="text-xl mr-2">⚽</span>
          <div>
            <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.5px" }}>
              FIFA WM 2026 — TURNIERBAUM-PREDICTOR
            </h1>
            <p className="text-blue-200" style={{ fontSize: 10 }}>
              <span className="hidden sm:inline">USA · Mexiko · Kanada &nbsp;|&nbsp; 11. Juni – 19. Juli 2026</span>
              <span className="sm:hidden text-amber-300 font-bold">{totalPicks}/31 Tipps</span>
            </p>
            {countdown ? (
              <p className="text-blue-300 font-bold" style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif" }}>
                Noch {countdown.days} Tage, {countdown.hours} Std., {countdown.minutes} Min.
              </p>
            ) : (
              <p className="text-emerald-400 font-bold" style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif" }}>
                Das Turnier lauft!
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-3 text-blue-300" style={{ fontSize: 10 }}>
              <span>48 Teams</span><span>·</span><span>12 Gruppen</span><span>·</span>
              <span className="text-amber-300 font-bold">{totalPicks}/31 Tipps</span>
            </div>
            <button
              onClick={handleShare}
              className="relative px-2.5 py-1 rounded text-xs font-bold text-white transition-colors"
              style={{ background: "#2563eb", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11 }}
            >
              {copied ? "Kopiert!" : "Link teilen"}
              {copied && (
                <span
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-white whitespace-nowrap z-50"
                  style={{ background: "#059669", fontSize: 10 }}
                >
                  In Zwischenablage kopiert
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex px-5 gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#15253d" }}>
          {tabBtn("groups", "Gruppen & Analysen")}
          {tabBtn("bracket", "Turnierbaum")}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {tab === "groups" ? (
          <div className="p-4" style={{ background: "#f7f9fb" }}>
            <h2
              className="font-bold text-xs uppercase tracking-wider mb-3 pb-1"
              style={{ color: "#1a2d4a", borderBottom: "2px solid #1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              Gruppenphase — <span className="hidden sm:inline">Drag & Drop</span><span className="sm:hidden">Long-Press</span> zum Sortieren
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={simulateGroupsFn}
                disabled={simulating}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: simulating ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {simulating ? "Simuliere ..." : "Gruppen simulieren"}
              </button>
              <button
                onClick={resetGroupsFn}
                disabled={simulating}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#64748b", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {GIDS.map((g) => <GroupTable key={g} gid={g} teams={groups[g]} onReorder={handleReorder} />)}
            </div>
            <ThirdSel
              groups={groups}
              sel={selThirds}
              onToggle={handleToggle}
              onAutoFill={handleAutoThirds}
              onClear={handleClearThirds}
            />
            <div className="p-3 rounded bg-white border text-slate-500 mt-3" style={{ borderColor: "#d1d9e0", fontSize: 11 }}>
              <strong>Anleitung:</strong> Teams per Drag & Drop (Desktop) oder Long-Press (Mobil) sortieren. Formkurve (letzte 5 Spiele): Hover/Tap auf die Punkte zeigt das Ergebnis.
              8 Drittplatzierte wahlen, dann zum Tab "Turnierbaum" wechseln und auf Teams klicken, um den Sieger zu bestimmen.
              Die Gewinnwahrscheinlichkeit basiert auf den Kaderwerten (Transfermarkt).
            </div>
          </div>
        ) : (
          <div className="p-2 sm:p-4 overflow-x-auto">
            <h2
              className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
              style={{ color: "#1a2d4a", borderBottom: "2px solid #1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              K.o.-Runde — Auf ein Team klicken = Sieger auswahlen
            </h2>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                onClick={simulateBracketFn}
                disabled={simulating || !groupsReady}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: simulating || !groupsReady ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {simulating ? "Simuliere ..." : "Baum simulieren"}
              </button>
              <button
                onClick={resetBracketFn}
                disabled={simulating}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#64748b", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                Reset
              </button>
              {!groupsReady && (
                <span className="text-amber-600" style={{ fontSize: 10 }}>
                  Erst Gruppen abschliessen (8 Drittplatzierte wahlen)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-2 sm:hidden">← Wische zum Scrollen →</p>
            <FullBracket groups={groups} ta={ta} winners={winners} onPick={handlePick} />
          </div>
        )}
      </div>
    </div>
  );
}
