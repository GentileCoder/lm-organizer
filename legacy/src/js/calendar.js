// ── Calendar ──

function renderCal(main){
  const viewTabs=`<div style="display:flex;gap:4px;margin-bottom:14px;align-items:center">
    ${["month","week","day"].map(v=>`<button onclick="calMode='${v}';showCatMgr=false;render()" style="padding:5px 14px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${calMode===v&&!showCatMgr?"#C9A227":"#0F1E35"};color:${calMode===v&&!showCatMgr?"#fff":"#888"};font-weight:${calMode===v&&!showCatMgr?"500":"400"}">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join("")}
    <div style="flex:1"></div>
    <button onclick="showCatMgr=!showCatMgr;render()" style="padding:5px 10px;border-radius:20px;border:none;font-size:12px;cursor:pointer;background:${showCatMgr?"#C9A227":"#0F1E35"};color:${showCatMgr?"#fff":"#888"}">🎨 Categories</button>
  </div>`;
  if(showCatMgr) main.innerHTML=viewTabs+renderCatMgr();
  else if(calMode==="month") main.innerHTML=viewTabs+renderCalMonth();
  else if(calMode==="week") main.innerHTML=viewTabs+renderCalWeek();
  else main.innerHTML=viewTabs+renderCalDay();
}

// ── Helpers ──
function dStr(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtTime(t){
  if(!t||!t.includes(":"))return "";
  const[h,m]=t.split(":");
  if(h===undefined||m===undefined)return "";
  const ap=+h>=12?"pm":"am";
  return `${+h%12||12}:${m}${ap}`;
}
function fmtDateLabel(ds){
  const d=new Date(ds+"T12:00:00");
  return `${DAYS[d.getDay()]}, ${MONTHS_L[d.getMonth()]} ${d.getDate()}`;
}
function catSelect(selectedName,id="ecat"){
  const cats=D.eventCategories||DEFAULT_EVT_CATS;
  const opts=cats.map(c=>`<option value="${esc(c.name)}" ${c.name===selectedName?"selected":""}>${esc(c.name)}</option>`).join("");
  return `<select id="${id}">${opts}</select>`;
}
const RECUR_OPTS=[
  {v:"none",   l:"Does not repeat"},
  {v:"daily",  l:"Daily"},
  {v:"workdays",l:"Every workday (Mon–Fri)"},
  {v:"weekly", l:"Weekly"},
  {v:"biweekly",l:"Every 2 weeks"},
  {v:"monthly",l:"Monthly"},
];
function recurSelect(selected="none",id="erec"){
  const opts=RECUR_OPTS.map(o=>`<option value="${o.v}" ${o.v===selected?"selected":""}>${o.l}</option>`).join("");
  return `<select id="${id}">${opts}</select>`;
}
function recurLabel(val){
  const o=RECUR_OPTS.find(o=>o.v===val);
  return o&&o.v!=="none"?o.l:"";
}

// ── Recurrence logic ──
function isRecurringOn(e,ds){
  if(!e.recurring||e.recurring==="none")return false;
  if(ds<e.date)return false;
  if(e.exceptions&&e.exceptions.includes(ds))return false;
  const start=new Date(e.date+"T12:00:00");
  const target=new Date(ds+"T12:00:00");
  const dow=target.getDay();
  switch(e.recurring){
    case"daily":return true;
    case"workdays":return dow>=1&&dow<=5;
    case"weekly":return dow===start.getDay();
    case"biweekly":{
      if(dow!==start.getDay())return false;
      const diff=Math.round((target-start)/86400000);
      return diff%14===0;
    }
    case"monthly":return start.getDate()===target.getDate();
    default:return false;
  }
}
function eventsForDate(ds){
  const result=[];
  D.events.forEach(e=>{
    if(e.date===ds){result.push(e);}
    else if(e.recurring&&e.recurring!=="none"&&isRecurringOn(e,ds)){result.push(e);}
  });
  return result.sort((a,b)=>(a.time||"").localeCompare(b.time||""));
}

// ── Category manager ──
function renderCatMgr(){
  const cats=D.eventCategories||DEFAULT_EVT_CATS;
  const rows=cats.map(c=>{
    if(editCatName===c.name){
      return `<div class="cat-row" style="flex-wrap:wrap;gap:6px">
        <input id="ecat-name" value="${esc(c.name)}" style="flex:1;min-width:100px"/>
        <input id="ecat-color" type="color" value="${c.color}"/>
        <button class="sbtn" onclick="saveCat('${esc(c.name)}')" style="font-size:12px;padding:4px 10px">Save</button>
        <button class="icon-btn" onclick="editCatName=null;render()">✕</button>
      </div>`;
    }
    return `<div class="cat-row">
      <div class="cat-swatch" style="background:${c.color}"></div>
      <span style="flex:1;font-size:14px">${esc(c.name)}</span>
      <button class="icon-btn" onclick="editCatName='${esc(c.name)}';render()" title="Edit">✎</button>
      <button class="icon-btn" onclick="delCat('${esc(c.name)}')" title="Delete">✕</button>
    </div>`;
  }).join("");
  return `<div class="card">
    <div style="font-size:14px;font-weight:600;margin-bottom:10px">Event Categories</div>
    ${rows}
    <div style="border-top:1px solid #1C2E4A;margin-top:10px;padding-top:10px">
      <div style="font-size:11px;color:#888;margin-bottom:8px;letter-spacing:0.04em;text-transform:uppercase">New category</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="new-cat-name" type="text" placeholder="Name" style="flex:1"/>
        <input id="new-cat-color" type="color" value="#4A90D9"/>
        <button class="sbtn" onclick="addCat()">Add</button>
      </div>
    </div>
  </div>`;
}
function addCat(){
  const name=document.getElementById("new-cat-name")?.value.trim();
  const color=document.getElementById("new-cat-color")?.value||"#888888";
  if(!name)return;
  if((D.eventCategories||[]).find(c=>c.name===name))return;
  D.eventCategories.push({name,color});
  saveRemote();render();
}
function delCat(name){
  D.eventCategories=(D.eventCategories||[]).filter(c=>c.name!==name);
  saveRemote();render();
}
function saveCat(originalName){
  const newName=document.getElementById("ecat-name")?.value.trim();
  const newColor=document.getElementById("ecat-color")?.value||"#888888";
  if(!newName)return;
  D.eventCategories=(D.eventCategories||[]).map(c=>c.name===originalName?{name:newName,color:newColor}:c);
  D.events=D.events.map(e=>e.category===originalName?{...e,category:newName}:e);
  editCatName=null;saveRemote();render();
}

// ── Event row ──
function evtRow(e,idx,ds){
  const col=evtColor(e.category);
  const t=fmtTime(e.time);
  const isRec=e.recurring&&e.recurring!=="none";
  const rl=isRec?recurLabel(e.recurring):"";

  // Delete confirmation state
  if(delConfirmEvt&&delConfirmEvt.idx===idx){
    return `<div style="display:flex;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid #0C1525;flex-wrap:wrap">
      <span style="font-size:13px;flex:1">Delete <strong>${esc(e.title)}</strong>?</span>
      ${isRec?`<button class="sbtn" onclick="deleteOccurrence(${idx},'${ds}')" style="font-size:11px;padding:3px 8px;background:#1C2E4A;color:#e8e8e8">This date</button>
      <button class="sbtn" onclick="deleteSeries(${idx})" style="font-size:11px;padding:3px 8px;background:#d85a30">All dates</button>`
      :`<button class="sbtn" onclick="deleteSeries(${idx})" style="font-size:11px;padding:3px 8px;background:#d85a30">Delete</button>`}
      <button class="icon-btn" onclick="delConfirmEvt=null;render()">✕</button>
    </div>`;
  }

  // Edit form state
  if(editEvtIdx===idx){
    return `<div class="evt-edit-form">
      <input id="edit-et" value="${esc(e.title)}"/>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <input id="edit-etm" type="time" value="${e.time||""}" style="width:100px;flex-shrink:0"/>
        ${catSelect(e.category,"edit-ecat")}
      </div>
      ${recurSelect(e.recurring||"none","edit-erec")}
      <div style="display:flex;gap:6px">
        <button class="sbtn" onclick="saveEvt(${idx})" style="font-size:12px;padding:4px 10px;flex:1">Save all occurrences</button>
        <button class="icon-btn" onclick="editEvtIdx=null;render()">✕</button>
      </div>
    </div>`;
  }

  return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #0C1525">
    <div style="width:3px;min-height:32px;align-self:stretch;border-radius:2px;background:${col};flex-shrink:0"></div>
    ${t
      ?`<span style="font-size:11px;color:${col};background:#0C1525;padding:2px 7px;border-radius:10px;white-space:nowrap">${t}</span>`
      :`<span style="font-size:11px;color:#555;background:#0F1E35;padding:2px 7px;border-radius:10px">All day</span>`}
    <span style="flex:1;font-size:14px">${esc(e.title)}</span>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0">
      <span style="font-size:10px;color:${col};opacity:0.85">${e.category||"Other"}</span>
      ${isRec?`<span style="font-size:9px;color:#888">🔁 ${rl}</span>`:""}
    </div>
    <button class="icon-btn" onclick="editEvtIdx=${idx};delConfirmEvt=null;render()" title="Edit">✎</button>
    <button class="del-btn" onclick="delEvt(${idx},'${ds}')">✕</button>
  </div>`;
}
function saveEvt(idx){
  const title=document.getElementById("edit-et")?.value.trim();
  const time=document.getElementById("edit-etm")?.value||"";
  const cat=document.getElementById("edit-ecat")?.value||"Other";
  const rec=document.getElementById("edit-erec")?.value||"none";
  if(!title)return;
  D.events[idx]={...D.events[idx],title,time,category:cat,recurring:rec};
  editEvtIdx=null;saveRemote();render();
}

// ── Add event form ──
function addEvtForm(){
  return `<div style="display:flex;flex-direction:column;gap:6px;padding-top:10px">
    <input id="et" type="text" placeholder="Event title" onkeydown="if(event.key==='Enter')addEvt()"/>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <input id="etm" type="time" style="width:100px;flex-shrink:0"/>
      ${catSelect("Other")}
    </div>
    ${recurSelect("none")}
    <button class="sbtn" onclick="addEvt()" style="align-self:flex-end;padding:5px 18px">Add</button>
  </div>`;
}

// ── Day panel ──
function dayPanel(dateStr){
  const evts=eventsForDate(dateStr);
  const rows=evts.length
    ?evts.map(e=>evtRow(e,D.events.indexOf(e),dateStr)).join("")
    :`<p style="font-size:13px;color:#555;padding:8px 0 0">No events</p>`;
  return `<div class="card" style="margin-top:12px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <span style="font-size:14px;font-weight:600;color:#C9A227">${fmtDateLabel(dateStr)}</span>
      <button class="sbtn" onclick="showAddEvt=!showAddEvt;editEvtIdx=null;delConfirmEvt=null;render()" style="font-size:12px;padding:4px 10px">${showAddEvt?"✕ Cancel":"＋ Add"}</button>
    </div>
    ${showAddEvt?addEvtForm():""}
    <div style="margin-top:${showAddEvt?"10px":"0"}">${rows}</div>
  </div>`;
}

// ── Month view ──
function renderCalMonth(){
  const {y,m}=calView;
  const dim=new Date(y,m+1,0).getDate(),fd=new Date(y,m,1).getDay();
  const dl=DAYS.map(d=>`<div style="text-align:center;font-size:11px;color:#888;padding:4px 0">${d}</div>`).join("");
  const bl=Array(fd).fill("<div></div>").join("");
  let ds="";
  for(let d=1;d<=dim;d++){
    const ds2=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const evts=eventsForDate(ds2);
    const isT=ds2===todayStr,isS=ds2===calSel;
    const cls=`cal-day${isT?" today":""}${isS?" selected":""}`;
    const chips=evts.slice(0,2).map(e=>{
      const col=evtColor(e.category);
      const rec=e.recurring&&e.recurring!=="none"?"🔁 ":"";
      return `<div class="cal-evt-chip" style="background:${isS?"rgba(255,255,255,0.25)":col}">${rec}${esc(e.title)}</div>`;
    }).join("");
    const more=evts.length>2?`<div class="cal-evt-more">+${evts.length-2}</div>`:"";
    ds+=`<div class="${cls}" onclick="selDay('${ds2}')"><span>${d}</span>${chips}${more}</div>`;
  }
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <button class="cal-nav-btn" onclick="calMv(-1)">‹</button>
    <span style="font-size:15px;font-weight:500">${MONTHS_L[m]} ${y}</span>
    <button class="cal-nav-btn" onclick="calMv(1)">›</button></div>
    <div class="cal-grid">${dl}</div>
    <div class="cal-grid">${bl}${ds}</div>
    ${calSel?dayPanel(calSel):""}`;
}

// ── Week view ──
function renderCalWeek(){
  const days=[];
  for(let i=0;i<7;i++){const d=new Date(calWeekStart);d.setDate(d.getDate()+i);days.push(d);}
  const startLabel=`${MONTHS_S[days[0].getMonth()]} ${days[0].getDate()}`;
  const endLabel=`${MONTHS_S[days[6].getMonth()]} ${days[6].getDate()}, ${days[6].getFullYear()}`;
  const cols=days.map(d=>{
    const ds=dStr(d);
    const evts=eventsForDate(ds);
    const isT=ds===todayStr;
    const evRows=evts.map(e=>{
      const col=evtColor(e.category);
      const isRec=e.recurring&&e.recurring!=="none";
      return `<div onclick="selDay('${ds}')" style="border-left:2px solid ${col};background:#1C2E4A;border-radius:0 5px 5px 0;padding:3px 5px;margin-bottom:3px;cursor:pointer">
        ${e.time?`<div style="font-size:9px;color:${col}">${fmtTime(e.time)}</div>`:""}
        <div style="font-size:10px;color:#e8e8e8;line-height:1.3;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${isRec?"🔁 ":""}${esc(e.title)}</div>
      </div>`;
    }).join("");
    return `<div style="flex:1;min-width:0;border-right:1px solid #1C2E4A;padding:0 3px">
      <div style="text-align:center;padding:6px 0;border-bottom:1px solid #1C2E4A;margin-bottom:5px">
        <div style="font-size:10px;color:#888">${DAYS[d.getDay()].slice(0,2)}</div>
        <div style="font-size:13px;font-weight:500;${isT?"color:#C9A227":""}">${d.getDate()}</div>
      </div>
      ${evRows}
      <div onclick="selDay('${ds}')" style="text-align:center;margin-top:4px;cursor:pointer;color:#1C2E4A;font-size:16px">+</div>
    </div>`;
  }).join("");
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
    <button class="cal-nav-btn" onclick="calMv(-1)">‹</button>
    <span style="font-size:14px;font-weight:500">${startLabel} – ${endLabel}</span>
    <button class="cal-nav-btn" onclick="calMv(1)">›</button></div>
    <div style="display:flex;background:#0F1E35;border:1px solid #1C2E4A;border-radius:12px;overflow:hidden;min-height:160px">${cols}</div>
    ${calSel?dayPanel(calSel):""}`;
}

// ── Day view ──
function renderCalDay(){
  const ds=dStr(calDayDate);
  const evts=eventsForDate(ds);
  const isT=ds===todayStr;
  const rows=evts.length
    ?evts.map(e=>evtRow(e,D.events.indexOf(e),ds)).join("")
    :`<p style="color:#555;font-size:13px;text-align:center;padding:1.5rem 0">No events</p>`;
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <button class="cal-nav-btn" onclick="calMv(-1)">‹</button>
    <div style="text-align:center">
      <div style="font-size:22px;font-weight:600;${isT?"color:#C9A227":""}">${calDayDate.getDate()}</div>
      <div style="font-size:12px;color:#888">${DAYS[calDayDate.getDay()]}, ${MONTHS_L[calDayDate.getMonth()]} ${calDayDate.getFullYear()}</div>
    </div>
    <button class="cal-nav-btn" onclick="calMv(1)">›</button></div>
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;font-weight:500;color:#C9A227">${isT?"Today":DAYS[calDayDate.getDay()]}</span>
        <button class="sbtn" onclick="calSel='${ds}';showAddEvt=!showAddEvt;editEvtIdx=null;delConfirmEvt=null;render()" style="font-size:12px;padding:4px 10px">${showAddEvt&&calSel===ds?"✕ Cancel":"＋ Add"}</button>
      </div>
      ${showAddEvt&&calSel===ds?addEvtForm()+"<div style='margin-top:10px'></div>":""}
      <div>${rows}</div>
    </div>`;
}

// ── Navigation & CRUD ──
function calMv(d){
  showAddEvt=false;editEvtIdx=null;delConfirmEvt=null;
  if(calMode==="month"){calView.m+=d;if(calView.m>11){calView.m=0;calView.y++;}if(calView.m<0){calView.m=11;calView.y--;}}
  else if(calMode==="week"){calWeekStart.setDate(calWeekStart.getDate()+d*7);}
  else{calDayDate.setDate(calDayDate.getDate()+d);}
  render();
}
function selDay(d){
  editEvtIdx=null;delConfirmEvt=null;
  if(calSel===d){calSel=null;showAddEvt=false;}else{calSel=d;showAddEvt=false;}
  if(calMode==="week"||calMode==="day"){calSel=d;}
  render();
}
function addEvt(){
  const t=document.getElementById("et")?.value.trim();
  const tm=document.getElementById("etm")?.value;
  const cat=document.getElementById("ecat")?.value||"Other";
  const rec=document.getElementById("erec")?.value||"none";
  const date=calSel||(calMode==="day"?dStr(calDayDate):null);
  if(!t||!date)return;
  D.events.push({id:Date.now(),date,time:tm||"",title:t,category:cat,recurring:rec,exceptions:[]});
  D.events.sort((a,b)=>a.date.localeCompare(b.date));
  showAddEvt=false;saveRemote();render();
}
function delEvt(idx,ds){
  delConfirmEvt={idx,ds};editEvtIdx=null;render();
}
function deleteOccurrence(idx,ds){
  if(!D.events[idx].exceptions)D.events[idx].exceptions=[];
  D.events[idx].exceptions.push(ds);
  delConfirmEvt=null;saveRemote();render();
}
function deleteSeries(idx){
  D.events.splice(idx,1);delConfirmEvt=null;saveRemote();render();
}
