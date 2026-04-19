// ── Constants ──
const WKEY="organizer_worker_url", GKEY="gemini_api_key", TKEY="organizer_token";
const MONTHS_S=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_L=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ECATS=["Housing","Food","Transport","Health","Entertainment","Shopping","Utilities","Other"];
const DEFAULT_EVT_CATS=[
  {name:"Work",    color:"#4A90D9"},
  {name:"Personal",color:"#3d9e75"},
  {name:"Health",  color:"#E05C5C"},
  {name:"Social",  color:"#9B6DD4"},
  {name:"Travel",  color:"#E08A3C"},
  {name:"Other",   color:"#888888"},
];
function evtColor(cat){
  const cats=D.eventCategories||DEFAULT_EVT_CATS;
  return (cats.find(c=>c.name===cat)||{color:"#888888"}).color;
}
const fmt=n=>"€"+Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

const now=new Date();
const todayStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

// ── State ──
let workerUrl=localStorage.getItem(WKEY)||"";
let workerToken=localStorage.getItem(TKEY)||"";
let section="calendar";
let calSel=null, calView={y:now.getFullYear(),m:now.getMonth()}, calMode="month";
let calWeekStart=new Date(now); calWeekStart.setDate(now.getDate()-now.getDay());
let calDayDate=new Date(now);
let finTab="overview", finM=now.getMonth(), finY=now.getFullYear();
let aiLoading=false, chatHist=[];
let showAddEvt=false, showCatMgr=false, editCatName=null, editEvtIdx=null, delConfirmEvt=null;

// ── Data ──
let D={
  tasks:[{id:1,text:"Review patent pipeline config",done:false}],
  notes:[{id:1,text:"El Toro: check BONit invoice export",done:false}],
  goals:[{id:1,text:"Ship confidentiality system v2",progress:60}],
  shopping:[{id:1,text:"Descaler for glasswasher",done:false}],
  events:[],
  finance:{salary:0,transactions:[],budgets:{}},
  review:[],
  eventCategories:[...DEFAULT_EVT_CATS]
};

function safeD(){
  if(!D.finance)D.finance={salary:0,transactions:[],budgets:{}};
  if(!D.finance.transactions)D.finance.transactions=[];
  if(!D.finance.budgets)D.finance.budgets={};
  if(!D.review)D.review=[];
  if(!D.events)D.events=[];
  if(!D.tasks)D.tasks=[];
  if(!D.notes)D.notes=[];
  if(!D.goals)D.goals=[];
  if(!D.shopping)D.shopping=[];
  if(!D.eventCategories)D.eventCategories=[...DEFAULT_EVT_CATS];
}

// ── Sync ──
function setSS(msg){const el=document.getElementById("sync-status");el.textContent=msg;el.className=msg.includes("✓")?"status-ok":msg.includes("rror")||msg.includes("fail")||msg.includes("Not")?"status-err":"status-mid";}
async function loadRemote(){
  if(!workerUrl)return;setSS("Loading…");
  try{
    const headers={};
    if(workerToken)headers["Authorization"]="Bearer "+workerToken;
    const r=await fetch(workerUrl,{headers});
    if(r.status===401){setSS("Auth failed ✕");addBubble("ai","401: check your auth token (🔒 Token).");return;}
    if(!r.ok)throw new Error("HTTP "+r.status);
    const d=await r.json();
    if(d&&Object.keys(d).length>0)D=d;
    safeD();setSS("Synced ✓");render();addBubble("ai","Connected! Data loaded.");
  }catch(e){setSS("Error: "+e.message);}
}
async function saveRemote(){
  if(!workerUrl){setSS("Not connected");return;}setSS("Saving…");
  try{
    const headers={"Content-Type":"application/json"};
    if(workerToken)headers["Authorization"]="Bearer "+workerToken;
    const r=await fetch(workerUrl,{method:"POST",headers,body:JSON.stringify(D)});
    if(r.status===401){setSS("Auth failed ✕");return;}
    if(!r.ok)throw new Error("HTTP "+r.status);
    setSS("Saved ✓");
  }catch(e){setSS("Save failed");}
}
function toggleBar(id){document.getElementById(id).classList.toggle("open");}
async function connectWorker(){
  const u=document.getElementById("url-field").value.trim();if(!u)return;
  workerUrl=u;localStorage.setItem(WKEY,u);
  document.getElementById("url-bar").classList.remove("open");
  await loadRemote();
}
function saveKey(){
  const k=document.getElementById("key-field").value.trim();if(!k)return;
  localStorage.setItem(GKEY,k);document.getElementById("key-bar").classList.remove("open");
  addBubble("ai","Gemini key saved! I'm ready.");
}
function saveToken(){
  const t=document.getElementById("token-field").value.trim();if(!t)return;
  workerToken=t;localStorage.setItem(TKEY,t);document.getElementById("token-bar").classList.remove("open");
  addBubble("ai","Auth token saved! Reconnecting…");loadRemote();
}

// ── Navigation ──
function nav(sec,btn){section=sec;document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");render();}

// ── Render router ──
function render(){
  const main=document.getElementById("main");
  if(section==="calendar"){renderCal(main);return;}
  if(section==="finance"){renderFin(main);return;}
  if(section==="review"){renderReview(main);return;}
  const items=D[section]||[];
  const label={tasks:"Tasks",notes:"Notes",goals:"Goals",shopping:"Shopping"}[section];
  let h=`<div class="add-row"><input id="ni" type="text" placeholder="Add to ${label}…" onkeydown="if(event.key==='Enter')addItem()"/><button class="pbtn" onclick="addItem()">Add</button></div>`;
  if(!items.length){h+=`<p class="empty">Nothing here yet.</p>`;}
  else if(section==="goals"){
    items.forEach((item,i)=>{
      h+=`<div class="card">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px"><span style="font-weight:500">${esc(item.text)}</span><span style="color:#888;font-size:12px">${item.progress}%</span></div>
        <div style="background:#1C2E4A;border-radius:4px;height:6px;margin-bottom:10px"><div style="background:#C9A227;height:6px;border-radius:4px;width:${item.progress}%"></div></div>
        <div style="display:flex;gap:8px;align-items:center"><input type="range" min="0" max="100" value="${item.progress}" style="flex:1;accent-color:#C9A227;border:none;background:none;padding:0" oninput="updGoal(${i},this.value)"/><button class="del-btn" onclick="delItem(${i})">✕</button></div>
      </div>`;
    });
  }else{
    items.forEach((item,i)=>{
      h+=`<div class="card"><div style="display:flex;align-items:center;gap:10px">
        <div onclick="toggleDone(${i})" style="width:18px;height:18px;border-radius:50%;border:2px solid ${item.done?"#3d9e75":"#1C2E4A"};background:${item.done?"#3d9e75":"transparent"};cursor:pointer;flex-shrink:0"></div>
        <span style="flex:1;font-size:14px;${item.done?"text-decoration:line-through;color:#888":""}">${esc(item.text)}</span>
        <button class="del-btn" onclick="delItem(${i})">✕</button>
      </div></div>`;
    });
  }
  main.innerHTML=h;
}
function addItem(){
  const el=document.getElementById("ni");const t=el.value.trim();if(!t)return;
  const item={id:Date.now(),text:t,done:false};
  if(section==="goals")item.progress=0;
  D[section].push(item);el.value="";saveRemote();render();
}
function toggleDone(i){const item=D[section][i];item.done=!item.done;saveRemote();render();}
function delItem(i){D[section].splice(i,1);saveRemote();render();}
function updGoal(i,v){D.goals[i].progress=parseInt(v);saveRemote();}

// ── Lock screen ──
async function unlockApp(){
  const urlVal=document.getElementById("lock-url").value.trim();
  const tokVal=document.getElementById("lock-token").value.trim();
  const errEl=document.getElementById("lock-err");
  const btn=document.getElementById("lock-btn");
  if(!urlVal||!tokVal){errEl.textContent="Both fields are required.";return;}
  btn.disabled=true;btn.textContent="Checking…";errEl.textContent="";
  try{
    const r=await fetch(urlVal,{headers:{"Authorization":"Bearer "+tokVal}});
    if(r.status===401){errEl.textContent="Wrong token — access denied.";btn.disabled=false;btn.textContent="Unlock";return;}
    if(!r.ok&&r.status!==404){errEl.textContent="Connection error (HTTP "+r.status+").";btn.disabled=false;btn.textContent="Unlock";return;}
    workerUrl=urlVal;workerToken=tokVal;
    localStorage.setItem(WKEY,urlVal);localStorage.setItem(TKEY,tokVal);
    document.getElementById("url-field").value=urlVal;
    document.getElementById("token-field").value=tokVal;
    document.getElementById("lock-screen").classList.add("hidden");
    await loadRemote();
  }catch(e){errEl.textContent="Network error — check the URL.";btn.disabled=false;btn.textContent="Unlock";}
}

// ── Init (runs after all functions are declared) ──
const sk=localStorage.getItem(GKEY)||"";
if(sk)document.getElementById("key-field").value=sk;
if(workerToken&&workerUrl){
  // already authenticated on a previous visit
  document.getElementById("lock-screen").classList.add("hidden");
  document.getElementById("url-field").value=workerUrl;
  document.getElementById("token-field").value=workerToken;
  loadRemote();
}else{
  // pre-fill whatever partial values exist in the lock form
  if(workerUrl)document.getElementById("lock-url").value=workerUrl;
  if(workerToken)document.getElementById("lock-token").value=workerToken;
}
document.getElementById("lock-url").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("lock-token").focus();});
document.getElementById("lock-token").addEventListener("keydown",e=>{if(e.key==="Enter")unlockApp();});
render();
