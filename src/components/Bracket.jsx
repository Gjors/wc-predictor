import { FL, UI_DICT } from "../data/constants";
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
import MCard from "./MCard";

const MH = 42;
const CW = 128;
const CG = 22;
const HALF_W = 4 * CW + 3 * CG;

export function BHalf({ r32ids, r16ids, qfids, sfids, groups, ta, winners, onPick, mirror, lang = "de" }) {
  const allIds = [r32ids, r16ids, qfids, sfids];
  const colX = (lvl) => {
    const idx = mirror ? 3 - lvl : lvl;
    return idx * (CW + CG);
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
        x1 = colX(lvl) + CW;
        x2 = colX(lvl + 1);
      } else {
        x1 = colX(lvl);
        x2 = colX(lvl + 1) + CW;
      }
      const xM = (x1 + x2) / 2;
      paths.push(
        <g key={`${lvl}-${p}`}>
          <line x1={x1} y1={tY} x2={xM} y2={tY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={x1} y1={bY} x2={xM} y2={bY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={xM} y1={tY} x2={xM} y2={bY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={xM} y1={mY} x2={x2} y2={mY} stroke="#c5ced6" strokeWidth="1.5" />
        </g>,
      );
    }
  }

  return (
    <div className="relative" style={{ width: HALF_W, height: HH }}>
      <svg className="absolute inset-0 pointer-events-none" width={HALF_W} height={HH}>{paths}</svg>
      {allIds.map((ids, lvl) => {
        const centers = CC[lvl];
        const x = colX(lvl);
        return ids.map((mid, mi) => {
          const tA = getTeam(mid, "a", groups, ta, winners);
          const tB = getTeam(mid, "b", groups, ta, winners);
          return (
            <MCard
              key={mid}
              matchId={mid}
              teamA={tA}
              teamB={tB}
              labelA={slotLabel(mid, "a")}
              labelB={slotLabel(mid, "b")}
              venue={MI[mid]?.v || ""}
              winner={winners[mid]}
              onPick={onPick}
              style={{ left: x, top: centers[mi] - MH / 2 }}
              lang={lang}
            />
          );
        });
      })}
    </div>
  );
}

export function Champ({ groups, ta, winners, lang = "de" }) {
  const ws = winners[104];
  const champ = ws ? getTeam(104, ws, groups, ta, winners) : null;
  if (!champ) return null;
  const t = UI_DICT[lang];

  return (
    <div
      className="flex items-center justify-center gap-3 py-2.5 px-3 sm:px-6 mb-4 rounded-lg"
      style={{ background: "linear-gradient(135deg,#1a2d4a,#2a4a6b)", border: "2px solid #c9a84c" }}
    >
      <span className="text-3xl">{FL[champ] || "🏆"}</span>
      <div className="text-center">
        <div className="text-amber-400 font-bold tracking-widest uppercase" style={{ fontSize: 10 }}>{t.champion}</div>
        <div className="text-white font-bold text-xl" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{sn(champ, lang)}</div>
      </div>
      <span className="text-3xl">🏆</span>
    </div>
  );
}

export function FullBracket({ groups, ta, winners, onPick, lang = "de" }) {
  const t = UI_DICT[lang];
  const GAP = 36;
  const TOTAL_W = HALF_W + GAP + CW + 12 + GAP + HALF_W;

  const finX = HALF_W + GAP;
  const finY = HH / 2 - (MH + 10) / 2;
  const finCY = HH / 2;
  const sfCY = CC[3][0];

  const lSFx = 3 * (CW + CG) + CW;
  const rSFx_local = 0;
  const rSFx_global = HALF_W + GAP + CW + 12 + GAP + rSFx_local;

  const lMid = (lSFx + finX) / 2;
  const rMid = (finX + CW + 12 + rSFx_global) / 2;

  const leftLabels = [t.roundR32, t.roundR16, t.roundQF, t.roundSF];
  const rightLabels = [...leftLabels].reverse();

  return (
    <div>
      <Champ groups={groups} ta={ta} winners={winners} lang={lang} />

      <div className="flex items-end mb-1" style={{ width: TOTAL_W }}>
        {leftLabels.map((l, i) => (
          <div
            key={`l${i}`}
            className="text-center font-bold uppercase tracking-wider flex-shrink-0"
            style={{
              width: CW,
              marginLeft: i ? CG : 0,
              fontSize: 9,
              color: "#1a2d4a",
              borderBottom: "2px solid #1a2d4a",
              paddingBottom: 3,
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          >
            {l}
          </div>
        ))}
        <div
          className="text-center font-bold uppercase tracking-wider flex-shrink-0"
          style={{
            width: CW + 12,
            marginLeft: GAP,
            marginRight: GAP,
            fontSize: 10,
            color: "#c9a84c",
            borderBottom: "2px solid #c9a84c",
            paddingBottom: 3,
            fontFamily: "'Barlow Condensed',sans-serif",
          }}
        >
          {t.final}
        </div>
        {rightLabels.map((l, i) => (
          <div
            key={`r${i}`}
            className="text-center font-bold uppercase tracking-wider flex-shrink-0"
            style={{
              width: CW,
              marginLeft: i ? CG : 0,
              fontSize: 9,
              color: "#1a2d4a",
              borderBottom: "2px solid #1a2d4a",
              paddingBottom: 3,
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          >
            {l}
          </div>
        ))}
      </div>

      <div className="relative" style={{ width: TOTAL_W, height: HH + 10 }}>
        <div className="absolute" style={{ left: 0, top: 0 }}>
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
          />
        </div>

        <div className="absolute" style={{ left: HALF_W + GAP + CW + 12 + GAP, top: 0 }}>
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
          />
        </div>

        <MCard
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
        />

        <svg className="absolute inset-0 pointer-events-none" width={TOTAL_W} height={HH + 10}>
          <line x1={lSFx} y1={sfCY} x2={lMid} y2={sfCY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={lMid} y1={sfCY} x2={lMid} y2={finCY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={lMid} y1={finCY} x2={finX} y2={finCY} stroke="#c5ced6" strokeWidth="1.5" />

          <line x1={rSFx_global} y1={sfCY} x2={rMid} y2={sfCY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={rMid} y1={sfCY} x2={rMid} y2={finCY} stroke="#c5ced6" strokeWidth="1.5" />
          <line x1={rMid} y1={finCY} x2={finX + CW + 12} y2={finCY} stroke="#c5ced6" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
