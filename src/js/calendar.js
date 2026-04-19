// ── Calendar ──
function renderCal(main){
  const viewTabs=`<div style="display:flex;gap:4px;margin-bottom:14px">
    ${["month","week","day"].map(v=>`<button onclick="calMode='${v}';render()" style="padding:5px 14px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${calMode===v?"#C9A227":"#0F1E35"};color:${calMode===v?"#fff":"#888"};font-weight:${calMode===v?"500":"400"}">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join("")}
  </div>`;
  if(calMode==="month") main.innerHTML=viewTabs+renderCalMonth();
  else if(calMode==="week") main.innerHTML=viewTabs+renderCalWeek();
  else main.innerHTML=viewTabs+renderCalDay();
}

function dStr(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtTime(t){if(!t)return "";const[h,m]=t.split(":");const ap=+h>=12?"pm":"am";return `${+h%12||12}:${m}${ap}`;}

function renderCalMonth(){
  const {y,m}=calView;
  const dim=new Date(y,m+1,0).getDate(),fd=new Date(y,m,1).getDay();
  const dl=DAYS.map(d=>`<div style="text-align:center;font-size:11px;color:#888;padding:4px 0">${d}</div>`).join("");
  const bl=Array(fd).fill("<div></div>").join("");
  let ds="";
  for(let d=1;d<=dim;d++){
    const ds2=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const evts=D.events.filter(e=>e.date===ds2);
    const isT=ds2===todayStr,isS=ds2===calSel;
    const cls=`cal-day${isT?" today":""}${isS?" selected":""}`;
    const dots=evts.length?`<div class="cal-dots">${evts.slice(0,3).map(()=>'<div class="cal-dot"></div>').join("")}</div>`:"";
    ds+=`<div class="${cls}" onclick="selDay('${ds2}')"><span>${d}</span>${dots}</div>`;
  }
  let evH="";
  if(calSel){
    const se=D.events.filter(e=>e.date===calSel);
    const er=se.length?se.map(e=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      ${e.time?`<span style="font-size:12px;color:#C9A227;min-width:40px">${fmtTime(e.time)}</span>`:""}
      <span style="flex:1;font-size:14px">${esc(e.title)}</span>
      <button class="del-btn" onclick="delEvt(${D.events.indexOf(e)})">✕</button>
    </div>`).join(""):`<p style="font-size:13px;color:#888;margin-bottom:10px">No events</p>`;
    evH=`<div class="card" style="margin-top:4px">
      <p style="font-size:13px;color:#888;margin-bottom:10px">${calSel}</p>${er}
      <div style="display:flex;gap:6px;margin-top:8px">
        <input id="et" type="text" placeholder="Event title" style="flex:1" onkeydown="if(event.key==='Enter')addEvt()"/>
        <input id="etm" type="time" style="width:90px"/>
        <button class="sbtn" onclick="addEvt()">+</button>
      </div></div>`;
  }
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <button class="cal-nav-btn" onclick="calMv(-1)">‹</button>
    <span style="font-size:15px;font-weight:500">${MONTHS_L[m]} ${y}</span>
    <button class="cal-nav-btn" onclick="calMv(1)">›</button></div>
    <div class="cal-grid">${dl}</div>
    <div class="cal-grid">${bl}${ds}</div>${evH}`;
}

function renderCalWeek(){
  const days=[];
  for(let i=0;i<7;i++){const d=new Date(calWeekStart);d.setDate(d.getDate()+i);days.push(d);}
  const startLabel=`${MONTHS_S[days[0].getMonth()]} ${days[0].getDate()}`;
  const endLabel=`${MONTHS_S[days[6].getMonth()]} ${days[6].getDate()}, ${days[6].getFullYear()}`;
  const cols=days.map(d=>{
    const ds=dStr(d);
    const evts=D.events.filter(e=>e.date===ds).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
    const isT=ds===todayStr;
    const evRows=evts.map(e=>`<div onclick="selDay('${ds}')" style="background:#2A1A00;border-radius:6px;padding:4px 6px;margin-bottom:3px;cursor:pointer">
      ${e.time?`<div style="font-size:10px;color:#E0BE5A">${fmtTime(e.time)}</div>`:""}
      <div style="font-size:11px;color:#e8e8e8;line-height:1.3">${esc(e.title)}</div>
    </div>`).join("");
    return `<div style="flex:1;min-width:0;border-right:1px solid #1C2E4A;padding:0 4px">
      <div style="text-align:center;padding:6px 0;border-bottom:1px solid #1C2E4A;margin-bottom:6px">
        <div style="font-size:10px;color:#888">${DAYS[d.getDay()].slice(0,2)}</div>
        <div style="font-size:14px;font-weight:500;${isT?"color:#C9A227":""}">${d.getDate()}</div>
      </div>
      ${evRows||""}
      <div onclick="selDay('${ds}')" style="text-align:center;margin-top:4px;cursor:pointer;color:#1C2E4A;font-size:18px">+</div>
    </div>`;
  }).join("");

  let evH="";
  if(calSel){
    const se=D.events.filter(e=>e.date===calSel);
    const er=se.length?se.map(e=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      ${e.time?`<span style="font-size:12px;color:#C9A227;min-width:40px">${fmtTime(e.time)}</span>`:""}
      <span style="flex:1;font-size:14px">${esc(e.title)}</span>
      <button class="del-btn" onclick="delEvt(${D.events.indexOf(e)})">✕</button>
    </div>`).join(""):`<p style="font-size:13px;color:#888;margin-bottom:10px">No events</p>`;
    evH=`<div class="card" style="margin-top:12px">
      <p style="font-size:13px;color:#888;margin-bottom:10px">${calSel}</p>${er}
      <div style="display:flex;gap:6px;margin-top:8px">
        <input id="et" type="text" placeholder="Event title" style="flex:1" onkeydown="if(event.key==='Enter')addEvt()"/>
        <input id="etm" type="time" style="width:90px"/>
        <button class="sbtn" onclick="addEvt()">+</button>
      </div></div>`;
  }

  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <button class="cal-nav-btn" onclick="calMv(-1)">‹</button>
    <span style="font-size:14px;font-weight:500">${startLabel} – ${endLabel}</span>
    <button class="cal-nav-btn" onclick="calMv(1)">›</button></div>
    <div style="display:flex;background:#0F1E35;border:1px solid #1C2E4A;border-radius:12px;overflow:hidden;min-height:160px">${cols}</div>${evH}`;
}

function renderCalDay(){
  const ds=dStr(calDayDate);
  const evts=D.events.filter(e=>e.date===ds).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const isT=ds===todayStr;
  const evRows=evts.length?evts.map(e=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#162035;border-radius:8px;margin-bottom:8px">
    <div style="flex:1">
      <div style="font-size:14px">${esc(e.title)}</div>
      ${e.time?`<div style="font-size:12px;color:#E0BE5A;margin-top:2px">${fmtTime(e.time)}</div>`:""}
    </div>
    <button class="del-btn" onclick="delEvt(${D.events.indexOf(e)})">✕</button>
  </div>`).join(""):`<p style="color:#888;font-size:13px;text-align:center;margin:2rem 0">No events today</p>`;

  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <button class="cal-nav-btn" onclick="calMv(-1)">‹</button>
    <div style="text-align:center">
      <div style="font-size:18px;font-weight:500;${isT?"color:#C9A227":""}">${calDayDate.getDate()}</div>
      <div style="font-size:12px;color:#888">${DAYS[calDayDate.getDay()]}, ${MONTHS_L[calDayDate.getMonth()]} ${calDayDate.getFullYear()}</div>
    </div>
    <button class="cal-nav-btn" onclick="calMv(1)">›</button></div>
    <div>${evRows}</div>
    <div class="card" style="margin-top:12px">
      <div style="font-size:13px;font-weight:500;margin-bottom:10px">Add event</div>
      <div style="display:flex;gap:6px">
        <input id="et" type="text" placeholder="Event title" style="flex:1" onkeydown="if(event.key==='Enter')addEvt()"/>
        <input id="etm" type="time" style="width:90px"/>
        <button class="sbtn" onclick="addEvt()">+</button>
      </div></div>`;
}

function calMv(d){
  if(calMode==="month"){calView.m+=d;if(calView.m>11){calView.m=0;calView.y++;}if(calView.m<0){calView.m=11;calView.y--;}}
  else if(calMode==="week"){calWeekStart.setDate(calWeekStart.getDate()+d*7);}
  else{calDayDate.setDate(calDayDate.getDate()+d);}
  render();
}
function selDay(d){
  calSel=calSel===d?null:d;
  if(calMode!=="month"){calSel=d;}
  render();
}
function addEvt(){
  const t=document.getElementById("et")?.value.trim();
  const tm=document.getElementById("etm")?.value;
  const date=calSel||(calMode==="day"?dStr(calDayDate):null);
  if(!t||!date)return;
  D.events.push({id:Date.now(),date,time:tm||"",title:t});
  D.events.sort((a,b)=>a.date.localeCompare(b.date));
  saveRemote();render();
}
function delEvt(i){D.events.splice(i,1);saveRemote();render();}
