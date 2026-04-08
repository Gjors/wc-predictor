import { useState, useMemo, useCallback, useRef } from "react";

/* =====================================================================
   FIFA WORLD CUP 2026 — BRACKET PREDICTOR v3
   Two-tab layout + market values + form + win probability
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

// ─── Market values (Mio. €) ────────────────────────────────────────
const MV = {
  "Mexiko":165.8,"Südafrika":25,"Republik Korea":136.75,"Tschechien":110.5,
  "Kanada":150,"Bosnien-Herzegowina":72.4,"Katar":18,"Schweiz":322.1,
  "Brasilien":778.5,"Marokko":456,"Haiti":12,"Schottland":210,
  "USA":356.7,"Paraguay":125,"Australien":45,"Türkei":440.2,
  "Deutschland":773.5,"Curaçao":14,"Elfenbeinküste":425.9,"Ecuador":366.73,
  "Niederlande":766,"Japan":264.2,"Schweden":363.98,"Tunesien":35,
  "Belgien":534.2,"Ägypten":130,"IR Iran":36.78,"Neuseeland":20,
  "Spanien":1310,"Kap Verde":28,"Saudi-Arabien":32,"Uruguay":366.45,
  "Frankreich":1360,"Senegal":474,"Irak":10,"Norwegen":504,
  "Argentinien":761.2,"Algerien":185,"Österreich":263.4,"Jordanien":15,
  "Portugal":864.5,"DR Kongo":110,"Usbekistan":26,"Kolumbien":300.5,
  "England":1620,"Kroatien":282.3,"Ghana":145,"Panama":22,
};
const fmtMV = (v) => {
  if (!v) return "—";
  if (v >= 1000) return `${(v/1000).toFixed(2).replace(".",",")} Mrd.`;
  if (v >= 100) return `${v.toFixed(0)} Mio.`;
  return `${v.toFixed(1).replace(".",",")} Mio.`;
};

// ─── Form data (last 5 results) ────────────────────────────────────
// Format: "R score vs Opponent" where R = S(ieg)/U(nentschieden)/N(iederlage)
const FORM = {
  "Mexiko": ["U 1:1 vs Belgien", "U 0:0 vs Portugal", "S 4:0 vs Island", "S 1:0 vs Bolivia", "S 1:0 vs Panama"],
  "Südafrika": ["N 1:2 vs Panama", "U 1:1 vs Panama", "N 1:2 vs Kamerun", "S 3:2 vs Simbabwe", "N 0:1 vs Ägypten"],
  "Republik Korea": ["N 0:1 vs Österreich", "N 0:4 vs Elfenbeinküste", "S 1:0 vs Ghana", "S 2:0 vs Bolivia", "S 2:0 vs Paraguay"],
  "Tschechien": ["U 2:2 vs Dänemark", "U 2:2 vs Irland", "S 6:0 vs Gibraltar", "S 1:0 vs San Marino", "N 1:2 vs Färöer"],
  "Kanada": ["U 0:0 vs Tunesien", "U 2:2 vs Island", "S 1:0 vs Guatemala", "N 0:2 vs Venezuela"],
  "Bosnien-Herzegowina": ["U 1:1 vs Italien", "U 1:1 vs Wales", "U 1:1 vs Österreich", "S 3:1 vs Rumänien", "S 4:1 vs Malta"],
  "Katar": ["N 0:3 vs Tunesien", "U 1:1 vs Syrien", "N 0:1 vs Palästina"],
  "Schweiz": ["U 0:0 vs Norwegen", "N 3:4 vs Deutschland", "U 1:1 vs Kosovo", "S 4:1 vs Schweden", "U 0:0 vs Slowenien"],
  "Brasilien": ["S 3:1 vs Kroatien", "N 1:2 vs Frankreich", "U 1:1 vs Tunesien", "S 2:0 vs Senegal", "N 2:3 vs Japan"],
  "Marokko": ["S 2:1 vs Paraguay", "U 1:1 vs Ecuador", "S 3:0 vs Senegal", "U 0:0 vs Nigeria", "S 2:0 vs Kamerun"],
  "Haiti": ["U 1:1 vs Island", "N 0:1 vs Tunesien", "S 2:0 vs Nicaragua", "S 1:0 vs Costa Rica", "N 0:3 vs Honduras"],
  "Schottland": ["N 0:1 vs Elfenbeinküste", "N 0:1 vs Japan", "S 4:2 vs Dänemark", "N 2:3 vs Griechenland", "S 2:1 vs Belarus"],
  "USA": ["N 0:2 vs Portugal", "N 2:5 vs Belgien", "S 5:1 vs Uruguay", "S 2:1 vs Paraguay", "S 2:1 vs Australien"],
  "Paraguay": ["N 1:2 vs Marokko", "S 1:0 vs Griechenland", "S 2:1 vs Mexiko", "N 1:2 vs USA", "N 0:2 vs Südkorea"],
  "Australien": ["S 5:1 vs Curaçao", "S 1:0 vs Kamerun", "N 0:3 vs Kolumbien", "N 0:1 vs Venezuela", "N 1:2 vs USA"],
  "Türkei": ["S 1:0 vs Kosovo", "S 1:0 vs Rumänien", "U 2:2 vs Spanien", "S 2:0 vs Bulgarien", "S 4:1 vs Georgien"],
  "Deutschland": ["S 2:1 vs Ghana", "S 4:3 vs Schweiz", "S 6:0 vs Slowakei", "S 2:0 vs Luxemburg", "S 1:0 vs Nordirland"],
  "Curaçao": ["N 1:5 vs Australien", "N 0:2 vs China", "U 0:0 vs Jamaika", "S 7:0 vs Bermuda", "U 1:1 vs Trinidad und Tobago"],
  "Elfenbeinküste": ["S 1:0 vs Schottland", "S 4:0 vs Südkorea", "N 2:3 vs Ägypten", "S 3:0 vs Burkina Faso", "S 3:2 vs Gabun"],
  "Ecuador": ["U 1:1 vs Niederlande", "U 1:1 vs Marokko", "S 2:0 vs Neuseeland", "U 0:0 vs Kanada", "U 1:1 vs Mexiko"],
  "Niederlande": ["U 1:1 vs Ecuador", "S 2:1 vs Norwegen", "S 4:0 vs Litauen", "U 1:1 vs Polen", "S 4:0 vs Finnland"],
  "Japan": ["S 1:0 vs England", "S 1:0 vs Schottland", "S 3:0 vs Bolivia", "S 2:0 vs Ghana", "S 3:2 vs Brasilien"],
  "Schweden": ["S 3:2 vs Polen", "S 3:1 vs Ukraine", "U 1:1 vs Slowenien", "N 1:4 vs Schweiz", "N 0:1 vs Kosovo"],
  "Tunesien": ["U 0:0 vs Kanada", "S 1:0 vs Haiti", "U 1:1 vs Mali", "U 1:1 vs Tansania", "N 2:3 vs Nigeria"],
  "Belgien": ["U 1:1 vs Mexiko", "S 5:2 vs USA", "S 7:0 vs Liechtenstein", "U 1:1 vs Kasachstan", "S 4:2 vs Wales"],
  "Ägypten": ["U 0:0 vs Spanien", "S 4:0 vs Saudi-Arabien", "U 0:0 vs Nigeria", "N 0:1 vs Senegal", "S 3:2 vs Elfenbeinküste"],
  "IR Iran": ["S 5:0 vs Costa Rica", "N 1:2 vs Nigeria", "U 0:0 vs Usbekistan", "U 0:0 vs Kap Verde", "S 2:0 vs Tansania"],
  "Neuseeland": ["S 4:1 vs Chile", "N 0:2 vs Finnland", "N 0:2 vs Ecuador", "N 1:2 vs Kolumbien", "U 1:1 vs Norwegen"],
  "Spanien": ["U 0:0 vs Ägypten", "S 3:0 vs Serbien", "U 2:2 vs Türkei", "S 4:0 vs Georgien"],
  "Kap Verde": ["U 1:1 vs Finnland", "N 2:4 vs Chile", "U 1:1 vs Ägypten", "U 0:0 vs IR Iran", "S 3:0 vs Eswatini"],
  "Saudi-Arabien": ["N 1:2 vs Serbien", "S 2:1 vs Serbien", "N 0:4 vs Ägypten", "U 0:0 vs VAE", "N 0:1 vs Jordanien"],
  "Uruguay": ["U 0:0 vs Algerien", "U 1:1 vs England", "N 1:5 vs USA", "U 0:0 vs Mexiko", "S 2:1 vs Usbekistan"],
  "Frankreich": ["S 3:1 vs Kolumbien", "S 2:1 vs Brasilien", "S 3:1 vs Aserbaidschan", "S 4:0 vs Ukraine", "U 2:2 vs Island"],
  "Senegal": ["S 3:1 vs Gambia", "S 2:0 vs Peru", "N 0:3 vs Marokko", "S 1:0 vs Ägypten", "S 1:0 vs Mali"],
  "Irak": ["S 2:1 vs Bolivia", "N 0:1 vs Jordanien", "N 0:2 vs Algerien", "S 2:0 vs Sudan", "S 2:1 vs Bahrain"],
  "Norwegen": ["U 0:0 vs Schweiz", "N 1:2 vs Niederlande", "S 4:1 vs Italien", "S 4:1 vs Estland", "U 1:1 vs Neuseeland"],
  "Argentinien": ["S 5:0 vs Sambia", "S 2:1 vs Mauretanien", "S 2:0 vs Angola"],
  "Algerien": ["U 0:0 vs Uruguay", "S 7:0 vs Guatemala", "N 0:2 vs Nigeria", "S 1:0 vs DR Kongo", "S 3:1 vs Äquatorialguinea"],
  "Österreich": ["S 1:0 vs Südkorea", "S 5:1 vs Ghana", "U 1:1 vs Bosnien-Herzegowina", "S 2:0 vs Zypern", "N 0:1 vs Rumänien"],
  "Jordanien": ["U 2:2 vs Nigeria", "U 2:2 vs Costa Rica", "N 2:3 vs Marokko", "S 1:0 vs Saudi-Arabien", "S 1:0 vs Irak"],
  "Portugal": ["S 2:0 vs USA", "U 0:0 vs Mexiko", "S 9:1 vs Armenien", "N 0:2 vs Irland", "U 2:2 vs Ungarn"],
  "DR Kongo": ["S 1:0 vs Jamaika", "S 2:0 vs Bermuda", "N 0:1 vs Algerien", "S 3:0 vs Botswana", "U 1:1 vs Senegal"],
  "Usbekistan": ["U 0:0 vs Venezuela", "S 3:1 vs Gabun", "S 4:2 vs Urartu", "U 2:2 vs China", "U 0:0 vs IR Iran"],
  "Kolumbien": ["N 1:3 vs Frankreich", "N 1:2 vs Kroatien", "S 3:0 vs Australien", "S 2:1 vs Neuseeland", "U 0:0 vs Kanada"],
  "England": ["N 0:1 vs Japan", "U 1:1 vs Uruguay", "S 2:0 vs Albanien", "S 2:0 vs Serbien", "S 5:0 vs Lettland"],
  "Kroatien": ["N 1:3 vs Brasilien", "S 2:1 vs Kolumbien", "S 3:2 vs Montenegro", "S 3:1 vs Färöer", "S 3:0 vs Gibraltar"],
  "Ghana": ["N 1:2 vs Deutschland", "N 1:5 vs Österreich", "N 0:1 vs Südkorea", "N 0:2 vs Japan", "S 1:0 vs Komoren"],
  "Panama": ["S 2:1 vs Südafrika", "U 1:1 vs Südafrika", "N 0:1 vs Mexiko", "U 1:1 vs Bolivia", "S 3:0 vs El Salvador"]
};

// ─── Win probability from market values ─────────────────────────────
const calcProb = (mvA, mvB) => {
  if (!mvA || !mvB) return { a: 50, b: 50 };
  const total = mvA + mvB;
  const pA = Math.round((mvA / total) * 100);
  return { a: pA, b: 100 - pA };
};

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
// GROUP TABLE — with market values + form curve
// ═════════════════════════════════════════════════════════════════════
const FC = { S: "bg-emerald-500", U: "bg-gray-400", N: "bg-red-500" };

function GroupTable({gid,teams,onReorder}){
  const drag=useRef(null),over=useRef(null);
  const onEnd=()=>{if(drag.current===null||over.current===null||drag.current===over.current)return;
    const t=[...teams],d=t.splice(drag.current,1)[0];t.splice(over.current,0,d);
    onReorder(gid,t);drag.current=null;over.current=null;};
  const moveTeam=(from,to)=>{const t=[...teams],d=t.splice(from,1)[0];t.splice(to,0,d);onReorder(gid,t);};

  // Sum of group market values for bar width reference
  const maxMV = Math.max(...teams.map(t=>MV[t]||0));

  return(
    <div className="mb-3">
      <div className="px-3 py-1.5 rounded-t flex items-center justify-between" style={{background:"#1a2d4a",color:"#fff"}}>
        <span className="font-bold text-xs tracking-wide" style={{fontFamily:"'Barlow Condensed',sans-serif"}}>GRUPPE {gid}</span>
        <span className="text-blue-300" style={{fontSize:9}}>Marktwert</span>
      </div>
      <div className="border border-t-0 rounded-b" style={{borderColor:"#d1d9e0"}}>
        {teams.map((team,i)=>{
          const form = FORM[team] || [];
          const mv = MV[team] || 0;
          return(
            <div key={team} draggable onDragStart={()=>{drag.current=i}} onDragEnter={()=>{over.current=i}}
              onDragEnd={onEnd} onDragOver={e=>e.preventDefault()}
              className={`flex items-center px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing select-none hover:bg-blue-50 transition-colors ${i<3?"border-b":""}`}
              style={{borderColor:"#e8ecf0",background:i%2===0?"#fff":"#f7f9fb"}}>
              {/* Mobile: up/down buttons */}
              <div className="flex flex-col sm:hidden mr-1 flex-shrink-0" style={{fontSize:10,lineHeight:1}}>
                <button onClick={(e)=>{e.stopPropagation();if(i>0)moveTeam(i,i-1)}} className={`${i>0?"text-slate-400":"text-transparent"} leading-none`}>▲</button>
                <button onClick={(e)=>{e.stopPropagation();if(i<3)moveTeam(i,i+1)}} className={`${i<3?"text-slate-400":"text-transparent"} leading-none`}>▼</button>
              </div>
              {/* Desktop: drag handle */}
              <span className="text-slate-300 mr-1 hidden sm:inline" style={{fontSize:10}}>⠿</span>
              <span className={`inline-flex items-center justify-center w-5 h-4 rounded font-bold mr-1.5 flex-shrink-0 ${RC[i]}`} style={{fontSize:10}}>{i+1}</span>
              <span className="mr-1 text-sm leading-none">{FL[team]||"🏳️"}</span>
              <span className="font-medium text-slate-800 truncate" style={{minWidth:0,maxWidth:90}}>{sn(team)}</span>

              {/* Form curve */}
              <div className="flex items-center gap-0.5 mx-1.5 sm:mx-2 flex-shrink-0">
                {form.map((f,fi)=>{
                  const r=f[0], detail=f.slice(2);
                  return(
                    <span key={fi} className="relative group/dot" title={detail}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${FC[r]||"bg-gray-300"} ring-1 ring-white`}/>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded shadow-lg bg-slate-800 text-white whitespace-nowrap hidden group-hover/dot:block z-50 pointer-events-none"
                        style={{fontSize:10}}>
                        {detail}
                      </span>
                    </span>
                  );
                })}
              </div>

              {/* Market value with mini bar */}
              <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                <div className="hidden sm:block w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden" title={`${fmtMV(mv)} €`}>
                  <div className="h-full rounded-full" style={{width:`${maxMV?(mv/maxMV*100):0}%`,background:mv>=500?"#16a34a":mv>=200?"#2563eb":mv>=100?"#d97706":"#94a3b8"}}/>
                </div>
                <span className="font-mono text-slate-500 text-right" style={{fontSize:9,minWidth:52}}>{fmtMV(mv)} €</span>
              </div>
            </div>
          );
        })}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
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
// MATCH CARD with winner picking + win probability
// ═════════════════════════════════════════════════════════════════════
function MCard({matchId,teamA,teamB,labelA,labelB,venue,winner,onPick,style,isFinal}){
  const probH=3;
  const h=isFinal?MH+10:MH;
  const headH=isFinal?15:13;
  const showProb=!!teamA&&!!teamB;
  const rowH=(h-headH-(showProb?probH:0))/2;

  const mvA=teamA?MV[teamA]:null, mvB=teamB?MV[teamB]:null;
  const prob=calcProb(mvA,mvB);

  const mkRow=(team,label,side)=>{
    const isW=winner===side, isL=winner&&winner!==side, ok=!!team;
    const pct=side==="a"?prob.a:prob.b;
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
          {showProb&&<span className="ml-auto font-mono flex-shrink-0" style={{fontSize:8,color:pct>=50?"#16a34a":"#94a3b8"}}>{pct}%</span>}
          {isW&&!showProb&&<span className="ml-auto text-emerald-600" style={{fontSize:9}}>▶</span>}
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
      {showProb&&(
        <div className="flex" style={{height:probH}}>
          <div style={{width:`${prob.a}%`,background:"#3b82f6",transition:"width 0.3s"}}/>
          <div style={{width:`${prob.b}%`,background:"#cbd5e1",transition:"width 0.3s"}}/>
        </div>
      )}
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
    <div className="flex items-center justify-center gap-3 py-2.5 px-3 sm:px-6 mb-4 rounded-lg animate-pulse"
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
// MAIN APP — Two-tab layout
// ═════════════════════════════════════════════════════════════════════
export default function App(){
  const [groups,setGroups]=useState(INIT_GROUPS);
  const [selThirds,setSelThirds]=useState([]);
  const [winners,setWinners]=useState({});
  const [tab,setTab]=useState("groups");

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

  const tabBtn=(id,label)=>(
    <button onClick={()=>setTab(id)}
      className={`px-3 sm:px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors
        ${tab===id?"text-[#1a2d4a] bg-[#eef1f5] rounded-t":"text-blue-300 hover:text-white"}`}
      style={{fontFamily:"'Barlow Condensed',sans-serif",borderBottom:tab===id?"none":"2px solid transparent"}}>
      {label}
    </button>
  );

  return(
    <div className="flex flex-col h-screen" style={{background:"#eef1f5",fontFamily:"'Barlow','Barlow Condensed',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <header className="sticky top-0 z-50 flex-shrink-0 shadow-sm" style={{background:"#1a2d4a"}}>
        <div className="flex items-center px-5 py-1.5">
          <span className="text-xl mr-2">⚽</span>
          <div>
            <h1 className="text-white font-bold text-base leading-tight" style={{fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.5px"}}>
              FIFA WM 2026 — TURNIERBAUM-PREDICTOR
            </h1>
            <p className="text-blue-200" style={{fontSize:10}}>
            <span className="hidden sm:inline">USA · Mexiko · Kanada &nbsp;|&nbsp; 11. Juni – 19. Juli 2026</span>
            <span className="sm:hidden text-amber-300 font-bold">{totalPicks}/31 Tipps</span>
          </p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-3 text-blue-300" style={{fontSize:10}}>
            <span>48 Teams</span><span>·</span><span>12 Gruppen</span><span>·</span>
            <span className="text-amber-300 font-bold">{totalPicks}/31 Tipps</span>
          </div>
        </div>
        {/* Tab bar */}
        <div className="flex px-5 gap-1" style={{borderTop:"1px solid rgba(255,255,255,0.08)",background:"#15253d"}}>
          {tabBtn("groups","Gruppen & Analysen")}
          {tabBtn("bracket","Turnierbaum")}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab==="groups"?(
          <div className="p-4" style={{background:"#f7f9fb"}}>
            <h2 className="font-bold text-xs uppercase tracking-wider mb-3 pb-1"
              style={{color:"#1a2d4a",borderBottom:"2px solid #1a2d4a",fontFamily:"'Barlow Condensed',sans-serif"}}>
              Gruppenphase — Drag & Drop zum Sortieren
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {GIDS.map(g=><GroupTable key={g} gid={g} teams={groups[g]} onReorder={handleReorder}/>)}
            </div>
            <ThirdSel groups={groups} sel={selThirds} onToggle={handleToggle}/>
            <div className="p-3 rounded bg-white border text-slate-500 mt-3" style={{borderColor:"#d1d9e0",fontSize:11}}>
              <strong>Anleitung:</strong> Teams per Drag & Drop sortieren. Formkurve (letzte 5 Spiele): Hover auf die Punkte zeigt das Ergebnis.
              8 Drittplatzierte wahlen, dann zum Tab "Turnierbaum" wechseln und auf Teams klicken, um den Sieger zu bestimmen.
              Die Gewinnwahrscheinlichkeit basiert auf den Kaderwerten (Transfermarkt).
            </div>
          </div>
        ):(
          <div className="p-2 sm:p-4 overflow-x-auto">
            <h2 className="font-bold text-xs uppercase tracking-wider mb-2 pb-1"
              style={{color:"#1a2d4a",borderBottom:"2px solid #1a2d4a",fontFamily:"'Barlow Condensed',sans-serif"}}>
              K.o.-Runde — Auf ein Team klicken = Sieger auswahlen
            </h2>
            <p className="text-xs text-slate-400 mb-2 sm:hidden">← Wische zum Scrollen →</p>
            <FullBracket groups={groups} ta={ta} winners={winners} onPick={handlePick}/>
          </div>
        )}
      </div>
    </div>
  );
}
