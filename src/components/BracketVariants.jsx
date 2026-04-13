import { useState } from "react";
import { FL, MV, UI_DICT } from "../data/constants";
import { R32, R16, QF, SF, FIN, MI } from "../data/bracket";
import { getTeam, r32Team, slotLabel, calcProb, sn } from "../utils/helpers";

// ─── Shared flow-layout match card (replaces absolute-positioned MCard) ─
function FlowCard({ matchId, groups, ta, winners, onPick, lang, isFinal }) {
  const teamA = getTeam(matchId, "a", groups, ta, winners);
  const teamB = getTeam(matchId, "b", groups, ta, winners);
  const labelA = slotLabel(matchId, "a");
  const labelB = slotLabel(matchId, "b");
  const winner = winners[matchId];
  const venue = MI[matchId]?.v || "";
  const mvA = teamA ? MV[teamA] : null;
  const mvB = teamB ? MV[teamB] : null;
  const prob = calcProb(mvA, mvB);
  const showProb = !!teamA && !!teamB;

  const row = (team, label, side) => {
    const isW = winner === side;
    const isL = winner && winner !== side;
    const ok = !!team;
    const pct = side === "a" ? prob.a : prob.b;
    return (
      <div
        onClick={() => ok && onPick(matchId, side)}
        className={`flex items-center px-2 py-2 transition-all
          ${ok ? "cursor-pointer" : ""}
          ${ok && !winner ? "hover:bg-blue-50" : ""}
          ${isL ? "opacity-40" : ""}`}
        style={{
          background: isW ? "#dcfce7" : "transparent",
          borderLeft: isW ? "3px solid #16a34a" : "3px solid transparent",
          fontWeight: isW ? 700 : 500,
          color: ok ? "#1e293b" : "#94a3b8",
          fontStyle: ok ? "normal" : "italic",
          minHeight: 32,
        }}
      >
        {ok ? (
          <>
            <span className="mr-1.5 text-base leading-none">{FL[team] || ""}</span>
            <span className="truncate flex-1" style={{ fontSize: 12 }}>{sn(team, lang)}</span>
            {showProb && (
              <span
                className="ml-2 font-mono flex-shrink-0"
                style={{ fontSize: 9, color: pct >= 50 ? "#16a34a" : "#94a3b8" }}
              >
                {pct}%
              </span>
            )}
          </>
        ) : (
          <span className="truncate" style={{ fontSize: 11 }}>{label}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="rounded overflow-hidden bg-white"
      style={{
        border: isFinal ? "2px solid #c9a84c" : "1px solid #c4cdd5",
        boxShadow: isFinal ? "0 4px 16px rgba(201,168,76,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-2"
        style={{
          fontSize: 9,
          background: isFinal ? "#1a2d4a" : "#edf1f5",
          color: isFinal ? "#c9a84c" : "#5a6d80",
          height: 16,
          borderBottom: isFinal ? "1px solid #c9a84c" : "1px solid #dde3e9",
        }}
      >
        <span className="font-bold">{isFinal ? "🏆 " : ""}S{matchId}</span>
        <span className="truncate ml-1">{venue}</span>
      </div>
      {row(teamA, labelA, "a")}
      <div style={{ height: 1, background: "#edf1f5" }} />
      {row(teamB, labelB, "b")}
    </div>
  );
}

// ─── Champion banner (shared across variants) ────────────────────────
function ChampBanner({ groups, ta, winners, lang }) {
  const ws = winners[104];
  const champ = ws ? getTeam(104, ws, groups, ta, winners) : null;
  if (!champ) return null;
  const t = UI_DICT[lang];
  return (
    <div
      className="flex items-center justify-center gap-3 py-2.5 px-3 mb-3 rounded-lg"
      style={{ background: "linear-gradient(135deg,#1a2d4a,#2a4a6b)", border: "2px solid #c9a84c" }}
    >
      <span className="text-2xl">{FL[champ] || "🏆"}</span>
      <div className="text-center">
        <div className="text-amber-400 font-bold tracking-widest uppercase" style={{ fontSize: 10 }}>
          {t.champion}
        </div>
        <div className="text-white font-bold text-lg" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
          {sn(champ, lang)}
        </div>
      </div>
      <span className="text-2xl">🏆</span>
    </div>
  );
}

const roundHeader = (label, gold) => (
  <div
    className="font-bold uppercase tracking-wider mb-1.5 pb-0.5"
    style={{
      color: gold ? "#c9a84c" : "#1a2d4a",
      borderBottom: gold ? "2px solid #c9a84c" : "2px solid #1a2d4a",
      fontSize: 10,
      fontFamily: "'Barlow Condensed',sans-serif",
    }}
  >
    {label}
  </div>
);

// ─── Variant A: Vertical Inverted Tree ────────────────────────────────
// Champion at the top, then Final → SF → QF → R16 → R32 stacked downwards.
export function BracketVertical({ groups, ta, winners, onPick, lang = "de" }) {
  const t = UI_DICT[lang];
  const sections = [
    { key: "fin", label: t.final, matches: [FIN], cols: 1, gold: true, isFinal: true },
    { key: "sf", label: t.roundSF, matches: SF, cols: 2 },
    { key: "qf", label: t.roundQF, matches: QF, cols: 2 },
    { key: "r16", label: t.roundR16, matches: R16, cols: 2 },
    { key: "r32", label: t.roundR32, matches: R32, cols: 2 },
  ];
  return (
    <div className="max-w-xl mx-auto">
      <ChampBanner groups={groups} ta={ta} winners={winners} lang={lang} />
      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.key}>
            {roundHeader(s.label, s.gold)}
            <div
              className={`grid gap-2 ${
                s.cols === 1 ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {s.matches.map((m) => (
                <FlowCard
                  key={m.id}
                  matchId={m.id}
                  groups={groups}
                  ta={ta}
                  winners={winners}
                  onPick={onPick}
                  lang={lang}
                  isFinal={s.isFinal}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant B: Round Tabs ────────────────────────────────────────────
// Segmented control selects one round at a time. Matches render full-width.
export function BracketTabs({ groups, ta, winners, onPick, lang = "de" }) {
  const t = UI_DICT[lang];
  const rounds = [
    { key: "r32", label: t.roundR32, matches: R32 },
    { key: "r16", label: t.roundR16, matches: R16 },
    { key: "qf", label: t.roundQF, matches: QF },
    { key: "sf", label: t.roundSF, matches: SF },
    { key: "fin", label: t.final, matches: [FIN], isFinal: true },
  ];
  const [active, setActive] = useState("r32");
  const current = rounds.find((r) => r.key === active) || rounds[0];
  return (
    <div className="max-w-xl mx-auto">
      <ChampBanner groups={groups} ta={ta} winners={winners} lang={lang} />
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {rounds.map((r) => {
          const on = active === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setActive(r.key)}
              className="px-3 py-1.5 rounded whitespace-nowrap font-bold uppercase tracking-wider flex-shrink-0 transition-colors"
              style={{
                background: on ? (r.isFinal ? "#c9a84c" : "#1a2d4a") : "#e8ecf0",
                color: on ? "#fff" : "#475569",
                fontSize: 10,
                fontFamily: "'Barlow Condensed',sans-serif",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <div className={`grid gap-2 ${current.isFinal ? "grid-cols-1 max-w-xs mx-auto" : "grid-cols-1 sm:grid-cols-2"}`}>
        {current.matches.map((m) => (
          <FlowCard
            key={m.id}
            matchId={m.id}
            groups={groups}
            ta={ta}
            winners={winners}
            onPick={onPick}
            lang={lang}
            isFinal={current.isFinal}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Variant C: Champion Path ─────────────────────────────────────────
// User picks a team; the view shows only that team's path from R32 to Final.
function computePath(team, groups, ta) {
  if (!team) return null;
  let startId = null;
  for (const m of R32) {
    if (r32Team(m, "a", groups, ta) === team || r32Team(m, "b", groups, ta) === team) {
      startId = m.id;
      break;
    }
  }
  if (!startId) return null;
  const parentMap = {};
  for (const m of [...R16, ...QF, ...SF, FIN]) {
    parentMap[m.a] = m.id;
    parentMap[m.b] = m.id;
  }
  const path = [startId];
  let cur = startId;
  while (parentMap[cur] !== undefined) {
    cur = parentMap[cur];
    path.push(cur);
  }
  return path;
}

export function BracketPath({ groups, ta, winners, onPick, lang = "de" }) {
  const t = UI_DICT[lang];
  // Collect all 32 R32 participants (16 seeds + 8 currently chosen thirds).
  const teamSet = new Set();
  for (const m of R32) {
    const a = r32Team(m, "a", groups, ta);
    const b = r32Team(m, "b", groups, ta);
    if (a) teamSet.add(a);
    if (b) teamSet.add(b);
  }
  const teams = [...teamSet].sort((a, b) => (MV[b] || 0) - (MV[a] || 0));
  const [pickedRaw, setPickedRaw] = useState(null);
  // Derived selection: fall back to the highest-MV team if the user's pick is
  // no longer in the tournament (e.g. because groups/thirds changed).
  const picked = pickedRaw && teamSet.has(pickedRaw) ? pickedRaw : teams[0] || null;
  const path = computePath(picked, groups, ta);
  const roundLabels = [t.roundR32, t.roundR16, t.roundQF, t.roundSF, t.final];

  return (
    <div className="max-w-xl mx-auto">
      <ChampBanner groups={groups} ta={ta} winners={winners} lang={lang} />
      <div className="mb-3">
        <label
          className="block font-bold uppercase tracking-wider mb-1"
          style={{ fontSize: 10, color: "#1a2d4a", fontFamily: "'Barlow Condensed',sans-serif" }}
        >
          {t.selectTeam}
        </label>
        <select
          value={picked || ""}
          onChange={(e) => setPickedRaw(e.target.value)}
          className="w-full px-2 py-2 rounded border bg-white"
          style={{ borderColor: "#c4cdd5", fontSize: 13 }}
        >
          {teams.length === 0 && <option value="">—</option>}
          {teams.map((tm) => (
            <option key={tm} value={tm}>
              {FL[tm] || ""} {sn(tm, lang)}
            </option>
          ))}
        </select>
      </div>
      {!path ? (
        <div className="text-center text-slate-500 py-8" style={{ fontSize: 12 }}>
          {t.noPath}
        </div>
      ) : (
        <div className="space-y-3">
          {path.map((mid, i) => (
            <div key={mid}>
              {roundHeader(roundLabels[i], i === path.length - 1)}
              <FlowCard
                matchId={mid}
                groups={groups}
                ta={ta}
                winners={winners}
                onPick={onPick}
                lang={lang}
                isFinal={i === path.length - 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
