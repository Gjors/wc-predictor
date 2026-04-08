export const R32 = [
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

export const R16 = [
  {id:89,a:74,b:77,v:"Philadelphia"},{id:90,a:73,b:75,v:"Houston"},
  {id:91,a:76,b:78,v:"New York"},{id:92,a:79,b:80,v:"Mexiko-Stadt"},
  {id:93,a:83,b:84,v:"Dallas"},{id:94,a:81,b:82,v:"Seattle"},
  {id:95,a:86,b:88,v:"Atlanta"},{id:96,a:85,b:87,v:"Vancouver"},
];

export const QF = [
  {id:97,a:89,b:90,v:"Boston"},{id:98,a:93,b:94,v:"Los Angeles"},
  {id:99,a:91,b:92,v:"Miami"},{id:100,a:95,b:96,v:"Kansas City"},
];

export const SF = [{id:101,a:97,b:98,v:"Dallas"},{id:102,a:99,b:100,v:"Atlanta"}];
export const FIN = {id:104,a:101,b:102,v:"New York"};

export const MI = {};
[...R32,...R16,...QF,...SF,FIN].forEach((m) => { MI[m.id] = m; });
export const isR32id = (id) => R32.some((m) => m.id === id);

export const L_R32=[74,77,73,75,83,84,81,82];
export const L_R16=[89,90,93,94];
export const L_QF=[97,98];
export const L_SF=[101];
export const R_R32=[76,78,79,80,86,88,85,87];
export const R_R16=[91,92,95,96];
export const R_QF=[99,100];
export const R_SF=[102];

export const TS = [
  {m:74,e:["A","B","C","D","F"]},{m:77,e:["C","D","F","G","H"]},
  {m:79,e:["C","E","F","H","I"]},{m:80,e:["E","H","I","J","K"]},
  {m:81,e:["B","E","F","I","J"]},{m:82,e:["A","E","H","I","J"]},
  {m:85,e:["E","F","G","I","J"]},{m:87,e:["D","E","I","J","L"]},
];

const MH=42, MG=10;
const MU=MH+MG;
const c0=Array(8).fill(0).map((_,i)=>i*MU+MH/2);
const c1=[];for(let i=0;i<8;i+=2)c1.push((c0[i]+c0[i+1])/2);
const c2=[];for(let i=0;i<4;i+=2)c2.push((c1[i]+c1[i+1])/2);
const c3=[(c2[0]+c2[1])/2];
export const CC=[c0,c1,c2,c3];
export const HH=8*MH+7*MG;
