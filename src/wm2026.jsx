import { useCallback, useMemo, useState } from "react";
import GroupTable from "./components/GroupTable";
import ThirdSel from "./components/ThirdSel";
import { FullBracket } from "./components/Bracket";
import { GIDS, INIT_GROUPS } from "./data/constants";
import { clearDown, solveThirds } from "./utils/helpers";

export default function App() {
  const [groups, setGroups] = useState(INIT_GROUPS);
  const [selThirds, setSelThirds] = useState([]);
  const [winners, setWinners] = useState({});
  const [tab, setTab] = useState("groups");

  const ta = useMemo(() => solveThirds(selThirds), [selThirds]);

  const handleReorder = useCallback((gid, order) => setGroups((p) => ({ ...p, [gid]: order })), []);
  const handleToggle = useCallback(
    (gid) => setSelThirds((p) => (p.includes(gid) ? p.filter((g) => g !== gid) : p.length >= 8 ? p : [...p, gid])),
    [],
  );
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
          </div>
          <div className="ml-auto hidden md:flex items-center gap-3 text-blue-300" style={{ fontSize: 10 }}>
            <span>48 Teams</span><span>·</span><span>12 Gruppen</span><span>·</span>
            <span className="text-amber-300 font-bold">{totalPicks}/31 Tipps</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {GIDS.map((g) => <GroupTable key={g} gid={g} teams={groups[g]} onReorder={handleReorder} />)}
            </div>
            <ThirdSel groups={groups} sel={selThirds} onToggle={handleToggle} />
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
            <p className="text-xs text-slate-400 mb-2 sm:hidden">← Wische zum Scrollen →</p>
            <FullBracket groups={groups} ta={ta} winners={winners} onPick={handlePick} />
          </div>
        )}
      </div>
    </div>
  );
}
