import { useCallback, useEffect, useMemo, useState } from "react";
import GroupTable from "./components/GroupTable";
import ThirdSel from "./components/ThirdSel";
import { FullBracket } from "./components/Bracket";
import { BracketVertical, BracketTabs, BracketPath } from "./components/BracketVariants";
import KnockoutArena from "./components/arena/KnockoutArena";
import { GIDS, INIT_GROUPS, UI_DICT } from "./data/constants";
import { R32, R16, QF, SF, FIN } from "./data/bracket";
import {
  clearDown,
  delay,
  solveThirds,
  getTeam,
  weightedShuffle,
  pickWinner,
  groupWeight,
  teamStrength,
} from "./utils/helpers";
import { POLY_SPECIALS } from "./data/polymarket";
import { ModelContext } from "./utils/model";

const PROB_MODE_STORAGE_KEY = "wc-predictor-prob-mode";

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

const GROUP_PICK_KEYS = Array.from("ABCDEFGHIJKL").flatMap((gid) => Array.from({ length: 6 }, (_, idx) => `${gid}-${idx}`));

const encodePicks = (picksObject) =>
  GROUP_PICK_KEYS.map((key) => {
    const pick = picksObject?.[key];
    return pick === "1" || pick === "X" || pick === "2" ? pick : "-";
  }).join("");

const decodePicks = (picksString) => {
  if (!picksString) return {};
  return GROUP_PICK_KEYS.reduce((acc, key, idx) => {
    const pick = picksString[idx];
    if (pick === "1" || pick === "X" || pick === "2") acc[key] = pick;
    return acc;
  }, {});
};

const _restored = (() => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const data = params.get("data");
  const restoredState = decodeState(data) || {};

  return {
    ...restoredState,
    isDetailMode: params.get("dm") === "1",
    groupPicks: decodePicks(params.get("p")),
  };
})();

const GROUP_MATCHES = [
  [0, 1],
  [2, 3],
  [0, 2],
  [3, 1],
  [3, 0],
  [1, 2],
];

// Detail-mode group simulator: turns a pair of team strengths into a
// 1/X/2 pick with a closeness-dependent draw rate. Uses teamStrength() so
// it automatically follows the active probability model (poly or mv).
const getMatchPick = (teamA, teamB, mode) => {
  const sA = teamStrength(teamA, mode) || 0.0001;
  const sB = teamStrength(teamB, mode) || 0.0001;
  const ratioA = sA / (sA + sB);
  const closeness = 1 - Math.abs(ratioA - 0.5) * 2;
  const drawWeight = 0.18 + closeness * 0.24;
  const winWeightA = Math.max(0.1, (1 - drawWeight) * ratioA);
  const winWeightB = Math.max(0.1, (1 - drawWeight) * (1 - ratioA));
  const total = winWeightA + drawWeight + winWeightB;
  const roll = Math.random() * total;
  if (roll < winWeightA) return "1";
  if (roll < winWeightA + drawWeight) return "X";
  return "2";
};

// Detail-mode third-place ranking: collects points from the user's 1/X/2
// picks, then uses the active model's teamStrength as a tiebreaker and
// for the final cross-group ordering.
const calcThirdsFromPicks = (groups, picks, mode) =>
  GIDS.map((gid) => {
    const teams = groups[gid] || [];
    const points = Object.fromEntries(teams.map((team) => [team, 0]));
    GROUP_MATCHES.forEach(([aIndex, bIndex], matchIndex) => {
      const teamA = teams[aIndex];
      const teamB = teams[bIndex];
      const pick = picks[`${gid}-${matchIndex}`];
      if (!teamA || !teamB) return;
      if (pick === "1") points[teamA] += 3;
      if (pick === "X") {
        points[teamA] += 1;
        points[teamB] += 1;
      }
      if (pick === "2") points[teamB] += 3;
    });

    const thirdTeam = [...teams].sort((a, b) => {
      const byPoints = (points[b] || 0) - (points[a] || 0);
      if (byPoints !== 0) return byPoints;
      return teamStrength(b, mode) - teamStrength(a, mode);
    })[2];

    return {
      gid,
      points: points[thirdTeam] || 0,
      strength: teamStrength(thirdTeam, mode),
    };
  })
    .sort((a, b) => {
      const byPoints = b.points - a.points;
      if (byPoints !== 0) return byPoints;
      return b.strength - a.strength;
    })
    .slice(0, 8)
    .map(({ gid }) => gid);

const isDefaultState = (groups, selThirds, winners, isDetailMode, groupPicks) => {
  const isDefaultGroups = GIDS.every(
    (gid) =>
      Array.isArray(groups[gid]) &&
      groups[gid].length === INIT_GROUPS[gid].length &&
      groups[gid].every((team, idx) => team === INIT_GROUPS[gid][idx]),
  );
  return isDefaultGroups && selThirds.length === 0 && Object.keys(winners).length === 0 && !isDetailMode && Object.keys(groupPicks).length === 0;
};

export default function App() {
  const [groups, setGroups] = useState(_restored?.groups || INIT_GROUPS);
  const [selThirds, setSelThirds] = useState(_restored?.selThirds || []);
  const [winners, setWinners] = useState(_restored?.winners || {});
  const [tab, setTab] = useState("groups");
  const [lang, setLang] = useState("de");
  const [isDetailMode, setIsDetailMode] = useState(_restored?.isDetailMode || false);
  const [groupPicks, setGroupPicks] = useState(_restored?.groupPicks || {});
  const t = UI_DICT[lang];

  const ta = useMemo(() => solveThirds(selThirds), [selThirds]);

  const handleReorder = useCallback((gid, order) => setGroups((p) => ({ ...p, [gid]: order })), []);
  const handleToggle = useCallback(
    (gid) => setSelThirds((p) => (p.includes(gid) ? p.filter((g) => g !== gid) : p.length >= 8 ? p : [...p, gid])),
    [],
  );
  const handleClearThirds = useCallback(() => {
    setSelThirds([]);
  }, []);
  // Probability model for simulations, match probabilities, etc.
  // Persisted in localStorage so the user's choice survives reloads.
  const [probMode, setProbMode] = useState(() => {
    if (typeof window === "undefined") return "poly";
    try {
      const saved = window.localStorage.getItem(PROB_MODE_STORAGE_KEY);
      return saved === "mv" || saved === "poly" ? saved : "poly";
    } catch {
      return "poly";
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PROB_MODE_STORAGE_KEY, probMode);
    } catch {
      // localStorage unavailable (e.g. private mode) — silently ignore.
    }
  }, [probMode]);

  const handleAutoThirds = useCallback(() => {
    if (isDetailMode) {
      setSelThirds(calcThirdsFromPicks(groups, groupPicks, probMode));
      return;
    }
    const topThirds = GIDS.map((g) => {
      const team = groups[g]?.[2];
      const score = teamStrength(team, probMode) * (0.5 + Math.random());
      return { gid: g, score };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ gid }) => gid);
    setSelThirds(topThirds);
  }, [groups, groupPicks, isDetailMode, probMode]);
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
  const handlePickMatch = useCallback((gid, matchIndex, pick) => {
    const key = `${gid}-${matchIndex}`;
    setGroupPicks((prev) => {
      const next = { ...prev };
      const currentPick = prev[key];
      if (currentPick === pick) delete next[key];
      else next[key] = pick;
      return next;
    });
  }, []);
  const handleToggleDetailMode = useCallback(() => {
    setIsDetailMode((prev) => {
      if (prev) setGroupPicks({});
      return !prev;
    });
  }, []);

  const totalPicks = Object.keys(winners).length;
  const [simulating, setSimulating] = useState(false);
  const groupsReady = selThirds.length === 8;
  // Mobile bracket variant selector (Ticket-05 test): classic|vertical|tabs|path
  const [bracketVariant, setBracketVariant] = useState("classic");

  // ── Simulate groups (weighted random via active probability model) ──
  const simulateGroupsFn = useCallback(async () => {
    setSimulating(true);
    setWinners({});
    setSelThirds([]);
    if (isDetailMode) {
      const simulatedPicks = {};
      GIDS.forEach((gid) => {
        GROUP_MATCHES.forEach(([aIndex, bIndex], matchIndex) => {
          const teamA = groups[gid]?.[aIndex];
          const teamB = groups[gid]?.[bIndex];
          if (!teamA || !teamB) return;
          simulatedPicks[`${gid}-${matchIndex}`] = getMatchPick(teamA, teamB, probMode);
        });
      });
      setGroupPicks(simulatedPicks);
      setSelThirds(calcThirdsFromPicks(groups, simulatedPicks, probMode));
      setSimulating(false);
      return;
    }

    setGroupPicks({});

    // Pre-compute all simulated group orderings
    const simGroups = {};
    for (const gid of GIDS) {
      simGroups[gid] = weightedShuffle(INIT_GROUPS[gid], (team) => groupWeight(team, probMode));
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
      score: teamStrength(simGroups[g][2], probMode) * (0.5 + Math.random()),
    }));
    thirdScores.sort((a, b) => b.score - a.score);
    setSelThirds(thirdScores.slice(0, 8).map((t) => t.g));

    setSimulating(false);
  }, [groups, isDetailMode, probMode]);

  const resetGroupsFn = useCallback(() => {
    setGroups(INIT_GROUPS);
    setSelThirds([]);
    setWinners({});
    setGroupPicks({});
  }, []);

  // ── Simulate bracket (weighted random via active model, round by round) ──
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
        newW[match.id] = pickWinner(teamA, teamB, probMode);
        await delay(60);
        setWinners({ ...newW });
      }
    }

    setSimulating(false);
  }, [groups, ta, probMode]);

  const resetBracketFn = useCallback(() => {
    setWinners({});
  }, []);

  // ── URL sync: update address bar on every state change ──
  useEffect(() => {
    const url = new URL(window.location);
    const hasDefaultState = isDefaultState(groups, selThirds, winners, isDetailMode, groupPicks);
    if (hasDefaultState) {
      window.history.replaceState(null, "", `${url.pathname}${url.hash || ""}`);
      return;
    }

    const encoded = encodeState(groups, selThirds, winners);
    url.searchParams.set("data", encoded);
    if (isDetailMode) url.searchParams.set("dm", "1");
    else url.searchParams.delete("dm");

    const encodedPicks = encodePicks(groupPicks);
    if (encodedPicks.includes("1") || encodedPicks.includes("X") || encodedPicks.includes("2")) {
      url.searchParams.set("p", encodedPicks);
    } else {
      url.searchParams.delete("p");
    }
    window.history.replaceState(null, "", url);
  }, [groups, selThirds, winners, isDetailMode, groupPicks]);

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

  // ── Neymar trivia (Polymarket special): show a dismissible quiz hint
  // whenever there's a pending Brazil match in the knockout bracket. The
  // user's dismissal is session-local (no persistence) so reloading the
  // app gives them the trivia again. ──
  const [neymarSeen, setNeymarSeen] = useState(false);
  const brazilPending = useMemo(() => {
    for (const match of [...R32, ...R16, ...QF, ...SF, FIN]) {
      if (winners[match.id]) continue;
      const a = getTeam(match.id, "a", groups, ta, winners);
      const b = getTeam(match.id, "b", groups, ta, winners);
      if (a === "Brasilien" || b === "Brasilien") return true;
    }
    return false;
  }, [groups, ta, winners]);
  const showNeymarTrivia = tab === "bracket" && brazilPending && !neymarSeen;

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer
        ${tab === id ? "text-[#1a2d4a] bg-[#eef1f5] rounded-t" : "text-blue-300 hover:text-white"}`}
      style={{ fontFamily: "'Barlow Condensed',sans-serif", borderBottom: tab === id ? "none" : "2px solid transparent" }}
    >
      {label}
    </button>
  );

  return (
    <ModelContext.Provider value={probMode}>
    <div className="flex flex-col h-screen" style={{ background: "#eef1f5", fontFamily: "'Barlow','Barlow Condensed',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />

      <header className="sticky top-0 z-50 flex-shrink-0 shadow-sm" style={{ background: "#1a2d4a" }}>
        <div className="flex items-center px-5 py-1.5">
          <span className="text-xl mr-2">⚽</span>
          <div>
            <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.5px" }}>
              {t.title}
            </h1>
            <p className="text-blue-200" style={{ fontSize: 10 }}>
              <span className="hidden sm:inline">{t.subtitle} &nbsp;|&nbsp; {t.dates}</span>
              <span className="sm:hidden text-amber-300 font-bold">{totalPicks}/31 {t.picks}</span>
            </p>
            {countdown ? (
              <p className="text-blue-300 font-bold" style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif" }}>
                {t.countdownPre}{t.countdownPre ? " " : ""}{countdown.days} {t.countdownDays}, {countdown.hours} {t.countdownHours}, {countdown.minutes} {t.countdownMin}.
              </p>
            ) : (
              <p className="text-emerald-400 font-bold" style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif" }}>
                {t.tournamentLive}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-3 text-blue-300" style={{ fontSize: 10 }}>
              <span>{t.teams}</span><span>·</span><span>{t.groups}</span><span>·</span>
              <span className="text-amber-300 font-bold">{totalPicks}/31 {t.picks}</span>
            </div>
            <button
              onClick={handleShare}
              className="relative px-2.5 py-1 rounded text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11 }}
            >
              {copied ? t.copied : t.share}
              {copied && (
                <span
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-white whitespace-nowrap z-50"
                  style={{ background: "#059669", fontSize: 10 }}
                >
                  {t.copiedTooltip}
                </span>
              )}
            </button>
            {/* Model toggle (Polymarket ⇄ Market Value) */}
            <button
              type="button"
              onClick={() => setProbMode((m) => (m === "poly" ? "mv" : "poly"))}
              title={t.modelToggleTooltip}
              aria-label={t.modelToggleTooltip}
              className="px-2 py-1 rounded text-xs font-bold text-white transition-colors duration-200 cursor-pointer hover:brightness-110"
              style={{
                background: probMode === "poly" ? "#c9a84c" : "#475569",
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: 11,
                letterSpacing: "0.08em",
              }}
            >
              {probMode === "poly" ? t.modelBadgePoly : t.modelBadgeMV}
            </button>
            {/* Language toggle */}
            <button
              onClick={() => setLang((l) => (l === "de" ? "en" : "de"))}
              className="px-2 py-1 rounded text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11 }}
            >
              {lang === "de" ? "🇬🇧 EN" : "🇩🇪 DE"}
            </button>
          </div>
        </div>
        <div className="flex px-5 gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "#15253d" }}>
          {tabBtn("groups", t.tabGroups)}
          {tabBtn("bracket", t.tabBracket)}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {tab === "groups" ? (
          <div className="p-4" style={{ background: "#f7f9fb" }}>
            <h2
              className="font-bold text-xs uppercase tracking-wider mb-3 pb-1"
              style={{ color: "#1a2d4a", borderBottom: "2px solid #1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {t.groupHeading} — <span className="hidden sm:inline">{t.sortDragDrop}</span><span className="sm:hidden">{t.sortLongPress}</span> {t.sortSuffix}
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={simulateGroupsFn}
                disabled={simulating}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white cursor-pointer transition-colors duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: simulating ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {simulating ? t.simulating : t.simGroups}
              </button>
              <button
                onClick={resetGroupsFn}
                disabled={simulating}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white cursor-pointer transition-colors duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#64748b", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {t.reset}
              </button>
              <button
                onClick={handleToggleDetailMode}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white cursor-pointer transition-colors duration-200 hover:brightness-110"
                style={{ background: isDetailMode ? "#0f766e" : "#475569", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {isDetailMode ? t.detailModeOn : t.detailModeOff}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {GIDS.map((g) => (
                <GroupTable
                  key={g}
                  gid={g}
                  teams={groups[g]}
                  onReorder={handleReorder}
                  lang={lang}
                  isDetailMode={isDetailMode}
                  groupPicks={groupPicks}
                  onPickMatch={handlePickMatch}
                  groupMatches={GROUP_MATCHES}
                />
              ))}
            </div>
            <ThirdSel
              groups={groups}
              sel={selThirds}
              onToggle={handleToggle}
              onAutoFill={handleAutoThirds}
              onClear={handleClearThirds}
              lang={lang}
            />
            <div className="p-3 rounded bg-white border text-slate-500 mt-3" style={{ borderColor: "#d1d9e0", fontSize: 11 }}>
              <strong>{t.instructionsLabel}</strong> {t.instructions}
            </div>
          </div>
        ) : (
          <div className="p-2 sm:p-4 overflow-x-auto">
            <h2
              className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
              style={{ color: "#1a2d4a", borderBottom: "2px solid #1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {t.bracketHeading}
            </h2>
            {showNeymarTrivia && (
              <div
                className="mb-3 p-3 rounded flex items-start gap-3"
                style={{
                  background: "linear-gradient(135deg,#fefce8,#fff7ed)",
                  border: "1px solid #c9a84c",
                  boxShadow: "0 2px 10px rgba(201,168,76,0.25)",
                }}
              >
                <span className="text-xl leading-none" aria-hidden="true">💡</span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "#c9a84c", fontSize: 9, fontFamily: "'Barlow Condensed',sans-serif" }}
                  >
                    {t.triviaBadge} · {POLY_SPECIALS.neymarPlays}%
                  </div>
                  <div
                    className="font-bold"
                    style={{ color: "#1a2d4a", fontSize: 13, fontFamily: "'Barlow Condensed',sans-serif" }}
                  >
                    {t.triviaNeymarTitle}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.35 }}>
                    {t.triviaNeymarBody}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNeymarSeen(true)}
                  className="px-2 py-1 rounded text-xs font-bold text-white cursor-pointer hover:brightness-110 flex-shrink-0"
                  style={{ background: "#1a2d4a", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10 }}
                >
                  {t.triviaDismiss}
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                onClick={simulateBracketFn}
                disabled={simulating || !groupsReady}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: simulating || !groupsReady ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {simulating ? t.simulating : t.simBracket}
              </button>
              <button
                onClick={resetBracketFn}
                disabled={simulating}
                className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#64748b", fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {t.reset}
              </button>
              {!groupsReady && (
                <span className="text-amber-600" style={{ fontSize: 10 }}>
                  {t.bracketDisabled}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 mb-2">
              <span
                className="text-slate-500 mr-1 uppercase tracking-wider font-bold"
                style={{ fontSize: 9, fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {t.bracketVariant}:
              </span>
              {[
                { key: "classic", label: t.variantClassic },
                { key: "vertical", label: t.variantVertical },
                { key: "tabs", label: t.variantTabs },
                { key: "path", label: t.variantPath },
                { key: "arena", label: t.variantArena },
              ].map((v) => {
                const on = bracketVariant === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setBracketVariant(v.key)}
                    className="px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors"
                    style={{
                      background: on ? "#2563eb" : "#e8ecf0",
                      color: on ? "#fff" : "#475569",
                      fontSize: 10,
                      fontFamily: "'Barlow Condensed',sans-serif",
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
            {bracketVariant === "classic" && (
              <p className="text-xs text-slate-400 mb-2 sm:hidden">{t.swipeHint}</p>
            )}
            {bracketVariant === "classic" ? (
              <FullBracket groups={groups} ta={ta} winners={winners} onPick={handlePick} lang={lang} />
            ) : bracketVariant === "vertical" ? (
              <BracketVertical groups={groups} ta={ta} winners={winners} onPick={handlePick} lang={lang} />
            ) : bracketVariant === "tabs" ? (
              <BracketTabs groups={groups} ta={ta} winners={winners} onPick={handlePick} lang={lang} />
            ) : bracketVariant === "path" ? (
              <BracketPath groups={groups} ta={ta} winners={winners} onPick={handlePick} lang={lang} />
            ) : (
              <KnockoutArena groups={groups} ta={ta} winners={winners} onPick={handlePick} lang={lang} />
            )}
          </div>
        )}
      </div>
    </div>
    </ModelContext.Provider>
  );
}
