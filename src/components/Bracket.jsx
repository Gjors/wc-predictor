import { useEffect, useRef, useState } from "react";
import { ISO_CODES, UI_DICT } from "../data/constants";
import {
  CC,
  FIN,
  HH,
  L_QF,
  L_R16,
  L_R32,
  L_SF,
  MI,
  R_QF,
  R_R16,
  R_R32,
  R_SF,
} from "../data/bracket";
import { getTeam, sn, slotLabel } from "../utils/helpers";
import BracketNode from "./BracketNode";

const MATCH_HEIGHT = 56;
const CARD_WIDTH = 208;
const COL_GAP = 24;
const HALF_W = 4 * CARD_WIDTH + 3 * COL_GAP;
const CONNECTOR = "rgba(94,234,212,0.55)";

export function BHalf({ r32ids, r16ids, qfids, sfids, groups, ta, winners, onPick, mirror, lang = "de", theme = "light" }) {
  const allIds = [r32ids, r16ids, qfids, sfids];
  const colX = (lvl) => {
    const idx = mirror ? 3 - lvl : lvl;
    return idx * (CARD_WIDTH + COL_GAP);
  };

  const paths = [];
  for (let lvl = 0; lvl < 3; lvl += 1) {
    const src = CC[lvl];
    const dst = CC[lvl + 1];
    for (let p = 0; p < dst.length; p += 1) {
      const tY = src[p * 2];
      const bY = src[p * 2 + 1];
      const mY = dst[p];
      let x1;
      let x2;
      if (!mirror) {
        x1 = colX(lvl) + CARD_WIDTH;
        x2 = colX(lvl + 1);
      } else {
        x1 = colX(lvl);
        x2 = colX(lvl + 1) + CARD_WIDTH;
      }
      const xM = (x1 + x2) / 2;
      paths.push(
        <g key={`${lvl}-${p}`}>
          <line x1={x1} y1={tY} x2={xM} y2={tY} stroke={CONNECTOR} strokeWidth="1" />
          <line x1={x1} y1={bY} x2={xM} y2={bY} stroke={CONNECTOR} strokeWidth="1" />
          <line x1={xM} y1={tY} x2={xM} y2={bY} stroke={CONNECTOR} strokeWidth="1" />
          <line x1={xM} y1={mY} x2={x2} y2={mY} stroke={CONNECTOR} strokeWidth="1" />
        </g>,
      );
    }
  }

  return (
    <div className="relative" style={{ width: HALF_W, height: HH }}>
      <svg className="pointer-events-none absolute inset-0" width={HALF_W} height={HH}>{paths}</svg>
      {allIds.map((ids, lvl) => {
        const centers = CC[lvl];
        const x = colX(lvl);
        return ids.map((mid, mi) => {
          const tA = getTeam(mid, "a", groups, ta, winners);
          const tB = getTeam(mid, "b", groups, ta, winners);
          return (
            <BracketNode
              key={mid}
              matchId={mid}
              teamA={tA}
              teamB={tB}
              labelA={slotLabel(mid, "a")}
              labelB={slotLabel(mid, "b")}
              venue={MI[mid]?.v || ""}
              winner={winners[mid]}
              onPick={onPick}
              style={{ left: x, top: centers[mi] - MATCH_HEIGHT / 2 }}
              lang={lang}
              theme={theme}
            />
          );
        });
      })}
    </div>
  );
}

export function Champ({ groups, ta, winners, lang = "de", theme = "light" }) {
  const ws = winners[104];
  const champ = ws ? getTeam(104, ws, groups, ta, winners) : null;
  if (!champ) return null;
  const t = UI_DICT[lang];

  return (
    <div className="mb-4 flex items-center justify-center gap-3 rounded-2xl border border-emerald-400/35 bg-[#132540]/85 px-4 py-3">
      {ISO_CODES[champ] ? (
        <img
          src={`https://flagcdn.com/w40/${ISO_CODES[champ]}.png`}
          alt={`${champ} flag`}
          className="h-6 w-10 rounded-sm border border-amber-200 object-cover"
          loading="lazy"
        />
      ) : (
        <span className="inline-block h-6 w-10 rounded bg-slate-300" aria-label={`${champ} flag missing`} />
      )}
      <div className="text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">{t.champion}</div>
        <div className="text-lg font-bold text-slate-100">{sn(champ, lang)}</div>
      </div>
      <span className="text-xl">🏆</span>
    </div>
  );
}

export function FullBracket({ groups, ta, winners, onPick, lang = "de", theme = "light" }) {
  const t = UI_DICT[lang];
  const GAP = 42;
  const FINAL_WIDTH = CARD_WIDTH + 20;
  const TOTAL_W = HALF_W + GAP + FINAL_WIDTH + GAP + HALF_W;

  const finX = HALF_W + GAP;
  const finY = HH / 2 - MATCH_HEIGHT / 2;
  const finCY = HH / 2;
  const sfCY = CC[3][0];

  const lSFx = 3 * (CARD_WIDTH + COL_GAP) + CARD_WIDTH;
  const rSFx_global = HALF_W + GAP + FINAL_WIDTH + GAP;

  const lMid = (lSFx + finX) / 2;
  const rMid = (finX + FINAL_WIDTH + rSFx_global) / 2;

  const leftLabels = [t.roundR32, t.roundR16, t.roundQF, t.roundSF];
  const rightLabels = [...leftLabels].reverse();
  const fitRef = useRef(null);
  const [scale, setScale] = useState(1);
  const baseHeight = HH + 40;

  useEffect(() => {
    const el = fitRef.current;
    if (!el) return undefined;
    const updateScale = () => {
      const width = el.clientWidth;
      if (!width) return;
      setScale(Math.min(1, Math.max(0.5, (width - 8) / TOTAL_W)));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [TOTAL_W]);

  return (
    <div
      className="rounded-2xl border p-3 shadow-sm sm:p-4"
      style={{
        borderColor: "rgba(148,163,184,0.25)",
        background: "radial-gradient(circle at 45% 20%, rgba(26,70,128,0.28), rgba(8,18,39,0.96) 55%)",
      }}
    >
      <Champ groups={groups} ta={ta} winners={winners} lang={lang} />
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max">
          <div className="mb-2 flex items-end" style={{ width: TOTAL_W }}>
            {leftLabels.map((label, i) => (
              <div
                key={`l${i}`}
                className="flex-shrink-0 border-b border-slate-400/30 pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300"
                style={{ width: CARD_WIDTH, marginLeft: i ? COL_GAP : 0 }}
              >
                {label}
              </div>
            ))}
            <div
              className="flex-shrink-0 border-b border-emerald-400/60 pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300"
              style={{ width: FINAL_WIDTH, marginLeft: GAP, marginRight: GAP }}
            >
              {t.final}
            </div>
            {rightLabels.map((label, i) => (
              <div
                key={`r${i}`}
                className="flex-shrink-0 border-b border-slate-400/30 pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300"
                style={{ width: CARD_WIDTH, marginLeft: i ? COL_GAP : 0 }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="relative" style={{ width: TOTAL_W, height: HH + 8 }}>
            <div className="absolute left-0 top-0">
              <BHalf
                r32ids={L_R32}
                r16ids={L_R16}
                qfids={L_QF}
                sfids={L_SF}
                groups={groups}
                ta={ta}
                winners={winners}
                onPick={onPick}
                mirror={false}
                lang={lang}
                theme={theme}
              />
            </div>

            <div className="absolute top-0" style={{ left: HALF_W + GAP + FINAL_WIDTH + GAP }}>
              <BHalf
                r32ids={R_R32}
                r16ids={R_R16}
                qfids={R_QF}
                sfids={R_SF}
                groups={groups}
                ta={ta}
                winners={winners}
                onPick={onPick}
                mirror
                lang={lang}
                theme={theme}
              />
            </div>

            <BracketNode
              matchId={104}
              teamA={getTeam(104, "a", groups, ta, winners)}
              teamB={getTeam(104, "b", groups, ta, winners)}
              labelA={slotLabel(104, "a")}
              labelB={slotLabel(104, "b")}
              venue={FIN.v}
              winner={winners[104]}
              onPick={onPick}
              style={{ left: finX, top: finY }}
              isFinal
              lang={lang}
              theme={theme}
            />

            <svg className="pointer-events-none absolute inset-0" width={TOTAL_W} height={HH + 8}>
              <line x1={lSFx} y1={sfCY} x2={lMid} y2={sfCY} stroke={CONNECTOR} strokeWidth="1" />
              <line x1={lMid} y1={sfCY} x2={lMid} y2={finCY} stroke={CONNECTOR} strokeWidth="1" />
              <line x1={lMid} y1={finCY} x2={finX} y2={finCY} stroke={CONNECTOR} strokeWidth="1" />

              <line x1={rSFx_global} y1={sfCY} x2={rMid} y2={sfCY} stroke={CONNECTOR} strokeWidth="1" />
              <line x1={rMid} y1={sfCY} x2={rMid} y2={finCY} stroke={CONNECTOR} strokeWidth="1" />
              <line x1={rMid} y1={finCY} x2={finX + FINAL_WIDTH} y2={finCY} stroke={CONNECTOR} strokeWidth="1" />
            </svg>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
