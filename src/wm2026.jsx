import { useCallback, useEffect, useMemo, useState } from "react";
import GroupTable from "./components/GroupTable";
import ThirdSel from "./components/ThirdSel";
import { FullBracket } from "./components/Bracket";
import PathDifficultyTierList from "./components/PathDifficultyTierList";
import SimulationResultsModal from "./components/SimulationResultsModal";
import { FORM, GIDS, INIT_GROUPS, UI_DICT } from "./data/constants";
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
import { ModelContext } from "./utils/model";
import { POLY_GROUP_WINNER } from "./data/polymarket";
import { runMonteCarloBracketSimulations } from "./utils/simulationAggregator";

const PROB_MODE = "poly";

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

const SCENARIO_KEY = {
  STRICT_FAVORITES: "strict-favorites",
  REALISTIC_TOURNAMENT: "realistic-tournament",
  HOT_FORM: "hot-form",
  CHAOS_MODE: "chaos-mode",
};

const getFormScore = (team) => {
  const recentForm = FORM[team] || [];
  return recentForm.reduce((total, entry) => {
    const result = entry?.[0];
    if (result === "S" || result === "W") return total + 3;
    if (result === "U" || result === "D") return total + 1;
    return total;
  }, 0);
};

const getPolyGroupStrength = (team) => POLY_GROUP_WINNER[team] || teamStrength(team, PROB_MODE) || 0.1;

const sortByStrictFavorites = (teams) =>
  [...teams].sort((a, b) => {
    const byGroupWinnerOdds = getPolyGroupStrength(b) - getPolyGroupStrength(a);
    if (byGroupWinnerOdds !== 0) return byGroupWinnerOdds;
    return teamStrength(b, PROB_MODE) - teamStrength(a, PROB_MODE);
  });

const sortByHotForm = (teams) =>
  [...teams].sort((a, b) => {
    const byForm = getFormScore(b) - getFormScore(a);
    if (byForm !== 0) return byForm;
    return getPolyGroupStrength(b) - getPolyGroupStrength(a);
  });

const sortByRealisticTournament = (teams) => weightedShuffle(teams, (team) => getPolyGroupStrength(team));

const sortByChaosMode = (teams) => {
  const weights = teams.map((team) => getPolyGroupStrength(team));
  const maxWeight = Math.max(...weights, 1);
  return weightedShuffle(teams, (team) => {
    const baseWeight = getPolyGroupStrength(team);
    const inverted = Math.max(0.05, maxWeight - baseWeight + 0.2);
    return inverted * inverted;
  });
};

// Detail-mode group simulator: turns a pair of team strengths into a
// 1/X/2 pick with a closeness-dependent draw rate using Polymarket values.
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
// picks, then uses Polymarket teamStrength as tiebreaker/final sorter.
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
  const handleAutoThirds = useCallback(() => {
    if (isDetailMode) {
      setSelThirds(calcThirdsFromPicks(groups, groupPicks, PROB_MODE));
      return;
    }
    const topThirds = GIDS.map((g) => {
      const team = groups[g]?.[2];
      const score = teamStrength(team, PROB_MODE) * (0.5 + Math.random());
      return { gid: g, score };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ gid }) => gid);
    setSelThirds(topThirds);
  }, [groups, groupPicks, isDetailMode]);
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
  const [simulationMenuOpen, setSimulationMenuOpen] = useState(false);
  const [multiSimProgress, setMultiSimProgress] = useState({ current: 0, total: 0 });
  const [simulationResults, setSimulationResults] = useState({ isOpen: false, runs: 0, rows: [] });
  const [selectedScenario, setSelectedScenario] = useState("");
  const groupsReady = selThirds.length === 8;
  const withViewTransition = useCallback(async (updateFn) => {
    if (typeof document === "undefined" || typeof document.startViewTransition !== "function") {
      await updateFn();
      return;
    }
    const transition = document.startViewTransition(() => updateFn());
    await transition.finished;
  }, []);
  // ── Simulate groups (weighted random via Polymarket model) ──
  const simulateGroupsFn = useCallback(async () => {
    setSimulating(true);
    setSelectedScenario("");
    setWinners({});
    setSelThirds([]);
    if (isDetailMode) {
      const simulatedPicks = {};
      GIDS.forEach((gid) => {
        GROUP_MATCHES.forEach(([aIndex, bIndex], matchIndex) => {
          const teamA = groups[gid]?.[aIndex];
          const teamB = groups[gid]?.[bIndex];
          if (!teamA || !teamB) return;
          simulatedPicks[`${gid}-${matchIndex}`] = getMatchPick(teamA, teamB, PROB_MODE);
        });
      });
      setGroupPicks(simulatedPicks);
      setSelThirds(calcThirdsFromPicks(groups, simulatedPicks, PROB_MODE));
      setSimulating(false);
      return;
    }

    setGroupPicks({});

    // Pre-compute all simulated group orderings
    const simGroups = {};
    for (const gid of GIDS) {
      simGroups[gid] = weightedShuffle(INIT_GROUPS[gid], (team) => groupWeight(team, PROB_MODE));
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
      score: teamStrength(simGroups[g][2], PROB_MODE) * (0.5 + Math.random()),
    }));
    thirdScores.sort((a, b) => b.score - a.score);
    setSelThirds(thirdScores.slice(0, 8).map((t) => t.g));

    setSimulating(false);
  }, [groups, isDetailMode]);

  const resetGroupsFn = useCallback(() => {
    setGroups(INIT_GROUPS);
    setSelThirds([]);
    setWinners({});
    setGroupPicks({});
    setSelectedScenario("");
  }, []);

  const applyQuickScenario = useCallback(
    async (scenarioKey) => {
      if (!scenarioKey) return;
      setSimulating(true);
      setSelectedScenario(scenarioKey);
      setWinners({});
      setSelThirds([]);
      setGroupPicks({});

      const sorterByScenario = {
        [SCENARIO_KEY.STRICT_FAVORITES]: sortByStrictFavorites,
        [SCENARIO_KEY.REALISTIC_TOURNAMENT]: sortByRealisticTournament,
        [SCENARIO_KEY.HOT_FORM]: sortByHotForm,
        [SCENARIO_KEY.CHAOS_MODE]: sortByChaosMode,
      };

      const sorter = sorterByScenario[scenarioKey];
      if (!sorter) {
        setSimulating(false);
        return;
      }

      const scenarioGroups = {};
      GIDS.forEach((gid) => {
        scenarioGroups[gid] = sorter(groups[gid] || INIT_GROUPS[gid]);
      });

      for (const gid of GIDS) {
        await delay(70);
        await withViewTransition(() => {
          setGroups((prevGroups) => ({ ...prevGroups, [gid]: scenarioGroups[gid] }));
        });
      }

      const thirdScores = GIDS.map((g) => ({
        g,
        score: teamStrength(scenarioGroups[g][2], PROB_MODE) * (0.5 + Math.random()),
      }));
      thirdScores.sort((a, b) => b.score - a.score);
      setSelThirds(thirdScores.slice(0, 8).map((item) => item.g));
      setSimulating(false);
    },
    [groups, withViewTransition],
  );

  // ── Simulate bracket (weighted random via Polymarket model, round by round) ──
  const simulateBracketFn = useCallback(async () => {
    setSimulating(true);
    setSimulationMenuOpen(false);
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
        newW[match.id] = pickWinner(teamA, teamB, PROB_MODE);
        await delay(60);
        setWinners({ ...newW });
      }
    }

    setSimulating(false);
  }, [groups, ta]);

  const simulateBracketMultipleFn = useCallback(
    async (runs) => {
      if (runs <= 1) {
        await simulateBracketFn();
        return;
      }

      setSimulationMenuOpen(false);
      setSimulating(true);
      setMultiSimProgress({ current: 0, total: runs });

      const { rows } = await runMonteCarloBracketSimulations({
        runs,
        groups,
        ta,
        mode: PROB_MODE,
        onProgress: (current, total) => setMultiSimProgress({ current, total }),
      });

      setSimulationResults({
        isOpen: true,
        runs,
        rows,
      });
      setSimulating(false);
      setMultiSimProgress({ current: 0, total: 0 });
    },
    [groups, ta, simulateBracketFn],
  );

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
    <ModelContext.Provider value={PROB_MODE}>
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
          {tabBtn("tierList", t.tabTierList)}
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
              <div className="relative">
                <select
                  value={selectedScenario}
                  disabled={simulating}
                  onChange={(event) => applyQuickScenario(event.target.value)}
                  className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide text-white cursor-pointer transition-colors duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
                  style={{ background: "#1d4ed8", fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  <option value="">{t.quickScenarios}</option>
                  <option value={SCENARIO_KEY.STRICT_FAVORITES}>{t.scenarioStrictFavorites}</option>
                  <option value={SCENARIO_KEY.REALISTIC_TOURNAMENT}>{t.scenarioRealisticTournament}</option>
                  <option value={SCENARIO_KEY.HOT_FORM}>{t.scenarioHotForm}</option>
                  <option value={SCENARIO_KEY.CHAOS_MODE}>{t.scenarioChaosMode}</option>
                </select>
                <span
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white"
                  style={{ fontSize: 10 }}
                >
                  ▾
                </span>
              </div>
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
        ) : tab === "tierList" ? (
          <PathDifficultyTierList lang={lang} />
        ) : (
          <div className="p-2 sm:p-4 overflow-x-auto">
            <h2
              className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
              style={{ color: "#1a2d4a", borderBottom: "2px solid #1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {t.bracketHeading}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="relative inline-flex">
                <button
                  onClick={() => simulateBracketMultipleFn(1)}
                  disabled={simulating || !groupsReady}
                  className="px-3 py-1.5 rounded-l text-xs font-bold uppercase tracking-wide text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: simulating || !groupsReady ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  {simulating ? t.simulating : t.simBracketSingle}
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMenuOpen((prev) => !prev)}
                  disabled={simulating || !groupsReady}
                  aria-label={t.simBracketMenu}
                  className="px-2 py-1.5 rounded-r text-xs font-bold uppercase tracking-wide text-white border-l border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: simulating || !groupsReady ? "#64748b" : "#059669", fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  ▾
                </button>
                {simulationMenuOpen && !simulating && groupsReady && (
                  <div className="absolute left-0 top-full z-20 mt-1 min-w-[170px] overflow-hidden rounded border border-slate-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => simulateBracketMultipleFn(1)}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {t.simBracketSingle}
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateBracketMultipleFn(10)}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {t.simBracketTen}
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateBracketMultipleFn(100)}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {t.simBracketHundred}
                    </button>
                  </div>
                )}
              </div>
              {multiSimProgress.total > 1 && (
                <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" aria-hidden="true" />
                  <span>{t.simulatingRuns.replace("{current}", String(multiSimProgress.current)).replace("{total}", String(multiSimProgress.total))}</span>
                </div>
              )}
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
            <p className="text-xs text-slate-400 mb-2 sm:hidden">{t.swipeHint}</p>
            <FullBracket groups={groups} ta={ta} winners={winners} onPick={handlePick} lang={lang} />
          </div>
        )}
      </div>
      <SimulationResultsModal
        isOpen={simulationResults.isOpen}
        rows={simulationResults.rows}
        runs={simulationResults.runs}
        lang={lang}
        labels={{
          title: t.simResultsTitle,
          subtitle: t.simResultsSubtitle,
          team: t.simResultsTeam,
          champion: t.simResultsChampion,
          final: t.simResultsFinal,
          semiFinal: t.simResultsSemiFinal,
          quarterFinal: t.simResultsQuarterFinal,
          close: t.close,
        }}
        onClose={() => setSimulationResults({ isOpen: false, runs: 0, rows: [] })}
      />
    </div>
    </ModelContext.Provider>
  );
}
