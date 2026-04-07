import { useState, useMemo, useCallback, useRef } from "react";

/* =====================================================================
   FIFA WORLD CUP 2026 — BRACKET PREDICTOR v2
   Mirror bracket (left half → center ← right half) + winner picking
   ===================================================================== */

// ─── Flag emoji lookup ──────────────────────────────────────────────
const FL = {
  "Mexiko":"🇲🇽","Südafrika":"🇿🇦","Republik Korea":"🇰🇷","Tschechien":"🇨🇿",
  "Kanada":"🇨🇦","Bosnien-Herzegowina":"🇧🇦","Katar":"🇶🇦","Schweiz":"🇨🇭",
  "Brasilien":"🇧🇷","Marokko":"🇲🇦","Haiti":"🇭🇹","Schottland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA":"🇺🇸","Paraguay":"🇵🇾","Australien":"🇦🇺","Türkei":"🇹🇷",
  "Deutschland":"🇩🇪","Curaçao":"🇨🇼","Elfenbeinküste":"🇨🇮","Ecuador":"🇪🇨",
  "Niederlande":"🇳🇱","Japan":"🇯🇵","Schweden":"🇸🇪","Tunesien":"🇹🇳",
  "Belgien":"🇧🇪","Ägypten":"🇪🇬","IR Iran":"🇮🇷","Neuseeland":"🇳🇿",
  "Spanien":"🇪🇸","Kap Verde":"🇨🇻","Saudi-Arabien":"🇸🇦","Uruguay":"🇺🇾",
  "Frankreich":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Norwegen":"🇳🇴",
  "Argentinien":"🇦🇷","Algerien":"🇩🇿","Österreich":"🇦🇹","Jordanien":"🇯🇴",
  "Portugal":"🇵🇹","DR Kongo":"🇨🇩","Usbekistan":"🇺🇿","Kolumbien":"🇨🇴",
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Kroatien":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦",
};
const SH = {
  "Republik Korea":"Korea","Bosnien-Herzegowina":"Bosnien","Elfenbeinküste":"Elfenbeink.",
  "Saudi-Arabien":"Saudi-A.","Neuseeland":"Neuseel.",
};
const sn = (n) => SH[n]||n;

// ─── Group data ─────────────────────────────────────────────────────
const INIT_GROUPS = {
  A:["Mexiko","Südafrika","Republik Korea","Tschechien"],
  B:["Kanada","Bosnien-Herzegowina","Katar","Schweiz"],
  C:["Brasilien","Marokko","Haiti","Schottland"],
  D:["USA","Paraguay","Australien","Türkei"],
  E:["Deutschland","Curaçao","Elfenbeinküste","Ecuador"],
  F:["Niederlande","Japan","Schweden","Tunesien"],
  G:["Belgien","Ägypten","IR Iran","Neuseeland"],
  H:["Spanien","Kap Verde","Saudi-Arabien","Uruguay"],
  I:["Frankreich","Senegal","Irak","Norwegen"],
  J:["Argentinien","Algerien","Österreich","Jordanien"],
  K:["Portugal","DR Kongo","Usbekistan","Kolumbien"],
  L:["England","Kroatien","Ghana","Panama"],
};
const GIDS = Object.keys(INIT_GROUPS);

// ─── Round of 32 match definitions ──────────────────────────────────
const R32 = [
  {id:73,a:{g:"A",r:2},b:{g:"B",r:2},v:"Los Angeles"},
  {id:74,a:{g:"E",r:1},b:{t:true,e:["A","B","C","D","F"]},v:"Boston"},
  {id:75,a:{g:"F",r:1},b:{g:"C",r:2},v:"Monterrey"},
  {id:76,a:{g:"C",r:1},b:{g:"F",r:2},v:"Houston"},
  {id:77,a:{g:"I",r:1},b:{t:true,e:["C","D","F","G","H"]},v:"New York"},
  {id:78,a:{g:"E",r:2},b:{g:"I",r:2},v:"Dallas"},
  {id:79,a:{g:"A",r:1},b:{t:true,e:["C","E","F","H","I"]},v:"Mexiko-Stadt"},
  {id:80,a:{g:"L",r:1},b:{t:true,e:["E","H","I","J","K"]},v:"Atlanta"},
  {id:81,a:{g:"D",r:1},b:{t:true,e:["B","E","F","I","J"]},v:"San Francisco"},
  {id:82,a:{g:"G",r:1},b:{t:true,e:["A","E","H","I","J"]},v:"Seattle"},
  {id:83,a:{g:"K",r:2},b:{g:"L",r:2},v:"Toronto"},
  {id:84,a:{g:"H",r:1},b:{g:"J",r:2},v:"Los Angeles"},
  {id:85,a:{g:"B",r:1},b:{t:true,e:["E","F","G","I","J"]},v:"Vancouver"},
  {id:86,a:{g:"J",r:1},b:{g:"H",r:2},v:"Miami"},
  {id:87,a:{g:"K",r:1},b:{t:true,e:["D","E","I","J","L"]},v:"Kansas City"},
  {id:88,a:{g:"D",r:2},b:{g:"G",r:2},v:"Dallas"},
];

const R16 = [
  {id:89,a:74,b:77,v:"Philadelphia"},{id:90,a:73,b:75,v:"Houston"},
  {id:91,a:76,b:78,v:"New York"},{id:92,a:79,b:80,v:"Mexiko-Stadt"},
  {id:93,a:83,b:84,v:"Dallas"},{id:94,a:81,b:82,v:"Seattle"},
  {id:95,a:86,b:88,v:"Atlanta"},{id:96,a:85,b:87,v:"Vancouver"},
];
const QF = [
  {id:97,a:89,b:90,v:"Boston"},{id:98,a:93,b:94,v:"Los Angeles"},
  {id:99,a:91,b:92,v:"Miami"},{id:100,a:95,b:96,v:"Kansas City"},
];
const SF = [{id:101,a:97,b:98,v:"Dallas"},{id:102,a:99,b:100,v:"Atlanta"}];
const FIN = {id:104,a:101,b:102,v:"New York"};

// ─── Match index ────────────────────────────────────────────────────
const MI = {};
[...R32,...R16,...QF,...SF,FIN].forEach(m=>{MI[m.id]=m;});
const isR32id = (id) => R32.some(m=>m.id===id);

// ─── Bracket half assignments ───────────────────────────────────────
const L_R32=[74,77,73,75,83,84,81,82];
const L_R16=[89,90,93,94]; const L_QF=[97,98]; const L_SF=[101];
const R_R32=[76,78,79,80,86,88,85,87];
const R_R16=[91,92,95,96]; const R_QF=[99,100]; const R_SF=[102];

// ─── 3rd place solver ───────────────────────────────────────────────
const TS = [
  {m:74,e:["A","B","C","D","F"]},{m:77,e:["C","D","F","G","H"]},
  {m:79,e:["C","E","F","H","I"]},{m:80,e:["E","H","I","J","K"]},
  {m:81,e:["B","E","F","I","J"]},{m:82,e:["A","E","H","I","J"]},
  {m:85,e:["E","F","G","I","J"]},{m:87,e:["D","E","I","J","L"]},
];
function solveThirds(sel) {
  if(sel.length!==8)return {};
  const s=new Set(sel),res={},used=new Set();
  const sorted=[...TS].sort((a,b)=>a.e.filter(g=>s.has(g)).length-b.e.filter(g=>s.has(g)).length);
  function go(i){if(i===sorted.length)return true;
    for(const g of sorted[i].e){if(s.has(g)&&!used.has(g)){
      used.add(g);res[sorted[i].m]=g;if(go(i+1))return true;used.delete(g);delete res[sorted[i].m];
    }}return false;}
  go(0);return res;
}

// ─── Team resolution ────────────────────────────────────────────────
function r32Team(match,side,groups,ta){
  const sl=match[side];
  if(sl.g)return groups[sl.g]?.[sl.r-1]||null;
  if(sl.t){const ag=ta[match.id];return ag?groups[ag]?.[2]||null:null;}
  return null;
}
function getTeam(mid,side,groups,ta,winners){
  const m=MI[mid];if(!m)return null;
  if(isR32id(mid))return r32Team(m,side,groups,ta);
  const fid=m[side],ws=winners[fid];
  if(!ws)return null;
  return getTeam(fid,ws,groups,ta,winners);
}
function slotLabel(mid,side){
  const m=MI[mid];if(!m)return"—";
  if(isR32id(mid)){const sl=m[side];
    if(sl.g)return`${sl.r}. Gr.${sl.g}`;if(sl.t)return`3. ${sl.e.join("/")}`;
  }return`W${m[side]}`;
}
function clearDown(mid,w){
  [...R16,...QF,...SF,FIN].forEach(m=>{
    if(m.a===mid||m.b===mid){if(w[m.id]!==undefined){delete w[m.id];clearDown(m.id,w);}}
  });
}

// ─── Rank colors ────────────────────────────────────────────────────
const RC=["bg-emerald-600 text-white","bg-sky-600 text-white","bg-amber-500 text-white","bg-slate-400 text-white"];

// ═════════════════════════════════════════════════════════════════════
// GROUP TABLE
// ═════════════════════════════════════════════════════════════════════
function GroupTable({gid,teams,onReorder}){
  const drag=useRef(null),over=useRef(null);
  const onEnd=()=>{if(drag.current===null||over.current===null||drag.current===over.current)return;
    const t=[...teams],d=t.splice(drag.current,1)[0];t.splice(over.current,0,d);
    onReorder(gid,t);drag.current=null;over.current=null;};
  return(
    <div className="mb-2.5">
      <div className="px-2.5 py-1 rounded-t" style={{background:"#1a2d4a",color:"#fff"}}>
        <span className="font-bold text-xs tracking-wide" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>GRUPPE {gid}</span>
      </div>
      <div className="border border-t-0 rounded-b" style={{borderColor:"#d1d9e0"}}>
        {teams.map((team,i)=>(
          <div key={team} draggable onDragStart={()=>{drag.current=i}} onDragEnter={()=>{over.current=i}}
            onDragEnd={onEnd} onDragOver={e=>e.preventDefault()}
            className={`flex items-center px-2 py-1 text-xs cursor-grab active:cursor-grabbing select-none hover:bg-blue-50 transition-colors ${i<3?"border-b":""}`}
            style={{borderColor:"#e8ecf0",background:i%2===0?"#fff":"#f7f9fb"}}>
            <span className="text-slate-300 mr-1.5" style={{fontSize:10}}>⠿</span>
            <span className={`inline-flex items-center justify-center w-5 h-4 rounded font-bold mr-1.5 flex-shrink-0 ${RC[i]}`} style={{fontSize:10}}>{i+1}</span>
            <span className="mr-1 text-sm leading-none">{FL[team]||"🏳️"}</span>
            <span className="font-medium text-slate-800 truncate">{team}</span>
            <span className="ml-auto flex-shrink-0" style={{fontSize:9,color:i<2?"#16a34a":i===2?"#d97706":"#94a3b8"}}>
              {i<2?"✓ Weiter":i===2?"? Dritter":"✗ Aus"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// THIRD PLACE SELECTOR
// ═════════════════════════════════════════════════════════════════════
function ThirdSel({groups,sel,onToggle}){
  const n=sel.length,full=n>=8;
  return(
    <div className="mb-3">
      <div className="flex items-center justify-between px-2.5 py-1 rounded-t" style={{background:"#1a2d4a",color:"#fff"}}>
        <span className="font-bold text-xs tracking-wide" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>BESTE DRITTPLATZIERTE</span>
        <span className={`font-mono px-1.5 py-0.5 rounded ${n===8?"bg-emerald-500":"bg-amber-500"}`} style={{fontSize:10}}>{n}/8</span>
      </div>
      <div className="border border-t-0 rounded-b p-1.5" style={{borderColor:"#d1d9e0"}}>
        <div className="grid grid-cols-3 gap-1">
          {GIDS.map(g=>{const team=groups[g]?.[2];if(!team)return null;
            const on=sel.includes(g),dis=full&&!on;
            return(<button key={g} onClick={()=>!dis&&onToggle(g)} disabled={dis}
              className={`flex items-center gap-1 px-1.5 py-1 rounded font-medium transition-all border
                ${on?"bg-emerald-50 border-emerald-400 text-emerald-800"
                  :dis?"bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  :"bg-white border-gray-200 text-slate-700 hover:border-blue-300 cursor-pointer"}`}
              style={{fontSize:11}}>
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                ${on?"bg-emerald-500 border-emerald-500 text-white":"border-gray-300"}`} style={{fontSize:8}}>{on?"✓":""}</span>
              <span>{FL[team]||""}</span><span className="truncate">{sn(team)}</span>
              <span className="text-gray-400 ml-auto">({g})</span>
            </button>);
          })}
        </div>
        {n<8&&<p className="text-amber-600 mt-1.5 text-center" style={{fontSize:10}}>Noch {8-n} wählen</p>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// BRACKET DIMENSIONS
// ═════════════════════════════════════════════════════════════════════
const MH=42, MG=10, MU=MH+MG, CW=128, CG=22;
const HALF_W=4*CW+3*CG;
const c0=Array(8).fill(0).map((_,i)=>i*MU+MH/2);
const c1=[];for(let i=0;i<8;i+=2)c1.push((c0[i]+c0[i+1])/2);
const c2=[];for(let i=0;i<4;i+=2)c2.push((c1[i]+c1[i+1])/2);
const c3=[(c2[0]+c2[1])/2];
const CC=[c0,c1,c2,c3];
const HH=8*MH+7*MG;

// ═════════════════════════════════════════════════════════════════════
// MATCH CARD with winner picking
// ═════════════════════════════════════════════════════════════════════
function MCard({matchId,teamA,teamB,labelA,labelB,venue,winner,onPick,style,isFinal}){
  const h=isFinal?MH+10:MH;
  const headH=isFinal?15:13;
  const rowH=(h-headH)/2;

  const mkRow=(team,label,side)=>{
    const isW=winner===side, isL=winner&&winner!==side, ok=!!team;
    return(
      <div onClick={()=>ok&&onPick(matchId,side)}
        className={`flex items-center px-1.5 truncate transition-all
          ${ok?"cursor-pointer":""}
          ${ok&&!isW&&!isL?"hover:bg-blue-50":""}
          ${isL?"opacity-35":""}`}
        style={{height:rowH,fontSize:11,
          background:isW?"#dcfce7":"transparent",
          borderLeft:isW?"3px solid #16a34a":"3px solid transparent",
          color:ok?"#1e293b":"#94a3b8",fontStyle:ok?"normal":"italic",
          fontWeight:isW?"700":"500"}}>
        {ok?(<>
          <span className="mr-1 text-sm leading-none">{FL[team]||""}</span>
          <span className="truncate">{sn(team)}</span>
          {isW&&<span className="ml-auto text-emerald-600" style={{fontSize:9}}>▶</span>}
        </>):(<span className="truncate">{label}</span>)}
      </div>
    );
  };

  return(
    <div className="absolute rounded overflow-hidden" style={{
      ...style,width:isFinal?CW+12:CW,height:h,
      border:isFinal?"2px solid #c9a84c":"1px solid #c4cdd5",
      background:"#fff",zIndex:2,
      boxShadow:isFinal?"0 4px 16px rgba(201,168,76,0.3)":"0 1px 3px rgba(0,0,0,0.06)"}}>
      <div className="flex items-center justify-between px-1.5" style={{
        height:headH,fontSize:9,
        background:isFinal?"#1a2d4a":"#edf1f5",
        borderBottom:isFinal?"1px solid #c9a84c":"1px solid #dde3e9",
        color:isFinal?"#c9a84c":"#5a6d80"}}>
        <span className="font-bold">{isFinal?"🏆 ":""}S{matchId}</span>
        <span className="truncate ml-1">{venue}</span>
      </div>
      {mkRow(teamA,labelA,"a")}
      {mkRow(teamB,labelB,"b")}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// BRACKET HALF (8 R32 → 4 R16 → 2 QF → 1 SF)
// mirror=false: left-to-right | mirror=true: right-to-left
// ═════════════════════════════════════════════════════════════════════
function BHalf({r32ids,r16ids,qfids,sfids,groups,ta,winners,onPick,mirror}){
  const allIds=[r32ids,r16ids,qfids,sfids];
  const colX=(lvl)=>{const idx=mirror?(3-lvl):lvl;return idx*(CW+CG);};

  // SVG connectors
  const paths=[];
  for(let lvl=0;lvl<3;lvl++){
    const src=CC[lvl],dst=CC[lvl+1];
    for(let p=0;p<dst.length;p++){
      const tY=src[p*2],bY=src[p*2+1],mY=dst[p];
      let x1,x2;
      if(!mirror){x1=colX(lvl)+CW;x2=colX(lvl+1);}
      else{x1=colX(lvl);x2=colX(lvl+1)+CW;}
      const xM=(x1+x2)/2;
      paths.push(<g key={`${lvl}-${p}`}>
        <line x1={x1} y1={tY} x2={xM} y2={tY} stroke="#c5ced6" strokeWidth="1.5"/>
        <line x1={x1} y1={bY} x2={xM} y2={bY} stroke="#c5ced6" strokeWidth="1.5"/>
        <line x1={xM} y1={tY} x2={xM} y2={bY} stroke="#c5ced6" strokeWidth="1.5"/>
        <line x1={xM} y1={mY} x2={x2} y2={mY} stroke="#c5ced6" strokeWidth="1.5"/>
      </g>);
    }
  }

  return(
    <div className="relative" style={{width:HALF_W,height:HH}}>
      <svg className="absolute inset-0 pointer-events-none" width={HALF_W} height={HH}>{paths}</svg>
      {allIds.map((ids,lvl)=>{
        const centers=CC[lvl],x=colX(lvl);
        return ids.map((mid,mi)=>{
          const tA=getTeam(mid,"a",groups,ta,winners);
          const tB=getTeam(mid,"b",groups,ta,winners);
          return <MCard key={mid} matchId={mid} teamA={tA} teamB={tB}
            labelA={slotLabel(mid,"a")} labelB={slotLabel(mid,"b")}
            venue={MI[mid]?.v||""} winner={winners[mid]} onPick={onPick}
            style={{left:x,top:centers[mi]-MH/2}}/>;
        });
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// CHAMPION BANNER
// ═════════════════════════════════════════════════════════════════════
function Champ({groups,ta,winners}){
  const ws=winners[104];
  const champ=ws?getTeam(104,ws,groups,ta,winners):null;
  if(!champ)return null;
  return(
    <div className="flex items-center justify-center gap-3 py-2.5 px-6 mb-4 rounded-lg animate-pulse"
      style={{background:"linear-gradient(135deg,#1a2d4a,#2a4a6b)",border:"2px solid #c9a84c"}}>
      <span className="text-3xl">{FL[champ]||"🏆"}</span>
      <div className="text-center">
        <div className="text-amber-400 font-bold tracking-widest uppercase" style={{fontSize:10}}>Weltmeister 2026</div>
        <div className="text-white font-bold text-xl" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>{champ}</div>
      </div>
      <span className="text-3xl">🏆</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// FULL BRACKET — LEFT | FINAL | RIGHT
// ═════════════════════════════════════════════════════════════════════
function FullBracket({groups,ta,winners,onPick}){
  const GAP=36; // gap between halves for the final
  const TOTAL_W=HALF_W+GAP+CW+12+GAP+HALF_W;

  const finX=HALF_W+GAP;
  const finY=HH/2-(MH+10)/2;
  const finCY=HH/2;
  const sfCY=CC[3][0]; // SF vertical center

  // Left SF right edge
  const lSFx=3*(CW+CG)+CW;
  // Right SF left edge (mirrored: SF is at col index 3→mapped to 0)
  const rSFx_local=0; // in right half coordinate space
  const rSFx_global=HALF_W+GAP+CW+12+GAP+rSFx_local;

  const lMid=(lSFx+finX)/2;
  const rMid=(finX+CW+12+rSFx_global)/2;

  const leftLabels=["16tel-Finale","Achtelfinale","Viertelfinale","Halbfinale"];
  const rightLabels=[...leftLabels].reverse();

  return(
    <div>
      <Champ groups={groups} ta={ta} winners={winners}/>

      {/* Column headers */}
      <div className="flex items-end mb-1" style={{width:TOTAL_W}}>
        {leftLabels.map((l,i)=>(
          <div key={`l${i}`} className="text-center font-bold uppercase tracking-wider flex-shrink-0"
            style={{width:CW,marginLeft:i?CG:0,fontSize:9,color:"#1a2d4a",
              borderBottom:"2px solid #1a2d4a",paddingBottom:3,fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div>
        ))}
        <div className="text-center font-bold uppercase tracking-wider flex-shrink-0"
          style={{width:CW+12,marginLeft:GAP,marginRight:GAP,fontSize:10,color:"#c9a84c",
            borderBottom:"2px solid #c9a84c",paddingBottom:3,fontFamily:"'Barlow Condensed',sans-serif"}}>
          ★ FINALE ★
        </div>
        {rightLabels.map((l,i)=>(
          <div key={`r${i}`} className="text-center font-bold uppercase tracking-wider flex-shrink-0"
            style={{width:CW,marginLeft:i?CG:0,fontSize:9,color:"#1a2d4a",
              borderBottom:"2px solid #1a2d4a",paddingBottom:3,fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</div>
        ))}
      </div>

      {/* Bracket body */}
      <div className="relative" style={{width:TOTAL_W,height:HH+10}}>
        {/* Left half */}
        <div className="absolute" style={{left:0,top:0}}>
          <BHalf r32ids={L_R32} r16ids={L_R16} qfids={L_QF} sfids={L_SF}
            groups={groups} ta={ta} winners={winners} onPick={onPick} mirror={false}/>
        </div>

        {/* Right half */}
        <div className="absolute" style={{left:HALF_W+GAP+CW+12+GAP,top:0}}>
          <BHalf r32ids={R_R32} r16ids={R_R16} qfids={R_QF} sfids={R_SF}
            groups={groups} ta={ta} winners={winners} onPick={onPick} mirror={true}/>
        </div>

        {/* Final card */}
        <MCard matchId={104}
          teamA={getTeam(104,"a",groups,ta,winners)}
          teamB={getTeam(104,"b",groups,ta,winners)}
          labelA={slotLabel(104,"a")} labelB={slotLabel(104,"b")}
          venue={FIN.v} winner={winners[104]} onPick={onPick}
          style={{left:finX,top:finY}} isFinal={true}/>

        {/* Connectors SF → Final */}
        <svg className="absolute inset-0 pointer-events-none" width={TOTAL_W} height={HH+10}>
          {/* Left SF → Final */}
          <line x1={lSFx} y1={sfCY} x2={lMid} y2={sfCY} stroke="#c5ced6" strokeWidth="1.5"/>
          <line x1={lMid} y1={sfCY} x2={lMid} y2={finCY} stroke="#c5ced6" strokeWidth="1.5"/>
          <line x1={lMid} y1={finCY} x2={finX} y2={finCY} stroke="#c5ced6" strokeWidth="1.5"/>
          {/* Right SF → Final */}
          <line x1={rSFx_global} y1={sfCY} x2={rMid} y2={sfCY} stroke="#c5ced6" strokeWidth="1.5"/>
          <line x1={rMid} y1={sfCY} x2={rMid} y2={finCY} stroke="#c5ced6" strokeWidth="1.5"/>
          <line x1={rMid} y1={finCY} x2={finX+CW+12} y2={finCY} stroke="#c5ced6" strokeWidth="1.5"/>
        </svg>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════
export default function App(){
  const [groups,setGroups]=useState(INIT_GROUPS);
  const [selThirds,setSelThirds]=useState([]);
  const [winners,setWinners]=useState({});

  const ta=useMemo(()=>solveThirds(selThirds),[selThirds]);

  const handleReorder=useCallback((gid,order)=>setGroups(p=>({...p,[gid]:order})),[]);
  const handleToggle=useCallback((gid)=>setSelThirds(p=>
    p.includes(gid)?p.filter(g=>g!==gid):p.length>=8?p:[...p,gid]),[]);
  const handlePick=useCallback((mid,side)=>{
    setWinners(p=>{const n={...p};
      if(n[mid]===side){delete n[mid];clearDown(mid,n);}
      else{n[mid]=side;clearDown(mid,n);}
      return n;});
  },[]);

  const totalPicks=Object.keys(winners).length;

  return(
    <div className="min-h-screen" style={{background:"#eef1f5",fontFamily:"'Barlow','Barlow Condensed',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center px-5 py-1.5 shadow-sm"
        style={{background:"#1a2d4a",borderBottom:"3px solid #c9a84c"}}>
        <span className="text-xl mr-2">⚽</span>
        <div>
          <h1 className="text-white font-bold text-base leading-tight" style={{fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.5px"}}>
            FIFA WM 2026 — TURNIERBAUM-PREDICTOR
          </h1>
          <p className="text-blue-200" style={{fontSize:10}}>USA · Mexiko · Kanada &nbsp;|&nbsp; 11. Juni – 19. Juli 2026</p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-blue-300" style={{fontSize:10}}>
          <span>48 Teams</span><span>·</span><span>12 Gruppen</span><span>·</span>
          <span className="text-amber-300 font-bold">{totalPicks}/31 Tipps</span>
        </div>
      </header>

      <div className="flex" style={{height:"calc(100vh - 44px)"}}>
        {/* LEFT PANEL */}
        <div className="overflow-y-auto flex-shrink-0 p-3" style={{width:"26%",minWidth:320,borderRight:"1px solid #d1d9e0",background:"#f7f9fb"}}>
          <h2 className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
            style={{color:"#1a2d4a",borderBottom:"2px solid #1a2d4a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            Gruppenphase — Drag & Drop
          </h2>
          <div className="grid grid-cols-2 gap-x-2">
            {GIDS.map(g=><GroupTable key={g} gid={g} teams={groups[g]} onReorder={handleReorder}/>)}
          </div>
          <ThirdSel groups={groups} sel={selThirds} onToggle={handleToggle}/>
          <div className="p-2 rounded bg-white border text-slate-500" style={{borderColor:"#d1d9e0",fontSize:10}}>
            <strong>Anleitung:</strong> Teams per Drag & Drop sortieren → 8 Drittplatzierte wählen →
            Im Turnierbaum auf Teams klicken, um den Sieger zu bestimmen. Der Baum füllt sich automatisch bis zum Finale.
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 overflow-auto p-4">
          <h2 className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
            style={{color:"#1a2d4a",borderBottom:"2px solid #1a2d4a",fontFamily:"'Barlow Condensed',sans-serif"}}>
            K.o.-Runde — Auf ein Team klicken = Sieger auswählen
          </h2>
          <FullBracket groups={groups} ta={ta} winners={winners} onPick={handlePick}/>
        </div>
      </div>
    </div>
  );
}
