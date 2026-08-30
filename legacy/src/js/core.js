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
let wsTab="tasks";
let aiLoading=false, chatHist=[];
let showAddEvt=false, showCatMgr=false, editCatName=null, editEvtIdx=null, delConfirmEvt=null;
let editShopCard=null, editShopItemKey=null, activeShopCard=0;
let activeGoal=0;
let editExpIdx=null;

// ── Data ──
let D={
  tasks:[{id:1,text:"Review patent pipeline config",done:false}],
  notes:[{id:1,text:"El Toro: check BONit invoice export",done:false}],
  goals:[{id:1,text:"Ship confidentiality system v2",progress:60}],
  shopping:[],
  events:[],
  finance:{incomeSources:[],expenseCategories:["Housing","Food","Transport","Health","Entertainment","Utilities","Other"],expenses:[],salary:0,transactions:[],budgets:{}},
  review:[],
  eventCategories:[...DEFAULT_EVT_CATS],
  investments:[]
};

function safeD(){
  if(!D.finance)D.finance={};
  if(!D.finance.incomeSources)D.finance.incomeSources=[];
  if(!D.finance.expenseCategories)D.finance.expenseCategories=["Housing","Food","Transport","Health","Entertainment","Utilities","Other"];
  if(!D.finance.expenses)D.finance.expenses=[];
  if(!D.finance.transactions)D.finance.transactions=[];
  if(!D.finance.budgets)D.finance.budgets={};
  if(!D.review)D.review=[];
  if(!D.events)D.events=[];
  if(!D.tasks)D.tasks=[];
  if(!D.notes)D.notes=[];
  if(!D.goals)D.goals=[];
  if(!D.shopping)D.shopping=[];
  // Migrate old flat-items format to new cards format
  if(D.shopping.length>0&&D.shopping[0].text!==undefined){D.shopping=[{id:Date.now(),name:"Shopping",items:D.shopping}];}
  D.shopping.forEach(c=>{if(!c.items)c.items=[];});
  if(!D.eventCategories)D.eventCategories=[...DEFAULT_EVT_CATS];
  if(!D.investments)D.investments=[];
  D.goals.forEach(g=>{if(!g.tasks)g.tasks=[];if(g.plan===undefined)g.plan="";});
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
  if(section==="shopping"){renderShopping(main);return;}
  if(section==="investment"){renderInvestment(main);return;}
  if(section==="workspace"){renderWorkspace(main);return;}
  if(section==="goals"){renderGoals(main);return;}
}

// ── Goals ──
function renderGoals(main){
  const goals=D.goals||[];
  if(activeGoal>=goals.length)activeGoal=Math.max(0,goals.length-1);

  let h=`<div style="display:flex;gap:8px;margin-bottom:12px">
    <input id="new-goal-input" type="text" placeholder="New goal…" onkeydown="if(event.key==='Enter')addGoal()"/>
    <button class="pbtn" onclick="addGoal()">Add</button>
  </div>`;

  if(!goals.length){h+=`<p class="empty">No goals yet.</p>`;main.innerHTML=h;return;}

  // Tab bar
  h+=`<div style="display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;padding-bottom:2px">`;
  goals.forEach((g,i)=>{
    const tasks=g.tasks||[];
    const pct=tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0;
    const active=activeGoal===i;
    h+=`<button onclick="activeGoal=${i};render()" style="padding:6px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;background:${active?"#C9A227":"#0F1E35"};color:${active?"#fff":"#888"};font-weight:${active?"600":"400"}">${esc(g.text)} <span style="opacity:.75">${pct}%</span></button>`;
  });
  h+=`</div>`;

  const gi=activeGoal;
  const g=goals[gi];
  const tasks=g.tasks||[];
  const done=tasks.filter(t=>t.done).length;
  const pct=tasks.length?Math.round(done/tasks.length*100):0;

  h+=`<div class="card">`;

  // Title + delete
  h+=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
    <span style="font-weight:600;font-size:16px;flex:1;line-height:1.3">${esc(g.text)}</span>
    <button class="del-btn" onclick="delGoal(${gi})" style="margin-left:8px;flex-shrink:0">✕</button>
  </div>`;

  // Progress bar
  h+=`<div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:11px;color:#888;letter-spacing:.04em;text-transform:uppercase">Progress</span>
      <span style="font-size:13px;font-weight:600;color:#C9A227">${pct}%</span>
    </div>
    <div style="background:#1C2E4A;border-radius:4px;height:8px">
      <div style="background:#C9A227;height:8px;border-radius:4px;width:${pct}%;transition:width .3s ease"></div>
    </div>
    ${tasks.length?`<div style="font-size:11px;color:#888;margin-top:5px">${done} of ${tasks.length} tasks completed</div>`:`<div style="font-size:11px;color:#555;margin-top:5px">Add tasks to track progress</div>`}
  </div>`;

  // Plan
  h+=`<div style="margin-bottom:16px">
    <div style="font-size:11px;color:#888;letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px">Plan</div>
    <textarea id="goal-plan" placeholder="Describe your approach, milestones, key steps…" style="min-height:90px" onblur="saveGoalPlan(${gi})">${esc(g.plan||"")}</textarea>
  </div>`;

  // Tasks
  h+=`<div style="font-size:11px;color:#888;letter-spacing:.04em;text-transform:uppercase;margin-bottom:10px">Tasks</div>`;
  if(tasks.length){
    tasks.forEach((t,ti)=>{
      h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1C2E4A">
        <div onclick="toggleGoalTask(${gi},${ti})" style="width:16px;height:16px;border-radius:50%;border:2px solid ${t.done?"#3d9e75":"#1C2E4A"};background:${t.done?"#3d9e75":"transparent"};cursor:pointer;flex-shrink:0"></div>
        <span style="flex:1;font-size:14px;${t.done?"text-decoration:line-through;color:#555":""}">${esc(t.text)}</span>
        <button class="del-btn" onclick="delGoalTask(${gi},${ti})">✕</button>
      </div>`;
    });
  }else{
    h+=`<p style="font-size:13px;color:#555;margin-bottom:4px">No tasks yet.</p>`;
  }
  h+=`<div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #1C2E4A">
    <input id="goal-task-input" type="text" placeholder="Add task…" onkeydown="if(event.key==='Enter')addGoalTask(${gi})"/>
    <button class="sbtn" onclick="addGoalTask(${gi})">Add</button>
  </div></div>`;

  main.innerHTML=h;
}
function addGoal(){
  const el=document.getElementById("new-goal-input");const t=el.value.trim();if(!t)return;
  D.goals.push({id:Date.now(),text:t,plan:"",tasks:[]});
  activeGoal=D.goals.length-1;el.value="";saveRemote();render();
}
function delGoal(gi){
  D.goals.splice(gi,1);
  if(activeGoal>=D.goals.length)activeGoal=Math.max(0,D.goals.length-1);
  saveRemote();render();
}
function addGoalTask(gi){
  const el=document.getElementById("goal-task-input");const t=el.value.trim();if(!t)return;
  if(!D.goals[gi].tasks)D.goals[gi].tasks=[];
  D.goals[gi].tasks.push({id:Date.now(),text:t,done:false});
  saveRemote();render();
}
function toggleGoalTask(gi,ti){D.goals[gi].tasks[ti].done=!D.goals[gi].tasks[ti].done;saveRemote();render();}
function delGoalTask(gi,ti){D.goals[gi].tasks.splice(ti,1);saveRemote();render();}
function saveGoalPlan(gi){const el=document.getElementById("goal-plan");if(el)D.goals[gi].plan=el.value;saveRemote();}

// ── Workspace (Tasks · Notes · Review) ──
function renderWorkspace(main){
  const tabs=["tasks","notes","review"];
  const labels={tasks:"✓ Tasks",notes:"≡ Notes",review:"★ Review"};
  const tabBar=`<div style="display:flex;gap:4px;margin-bottom:14px">
    ${tabs.map(t=>`<button onclick="wsTab='${t}';render()" style="padding:6px 16px;border-radius:20px;border:none;font-size:13px;cursor:pointer;background:${wsTab===t?"#C9A227":"#0F1E35"};color:${wsTab===t?"#fff":"#888"};font-weight:${wsTab===t?"600":"400"}">${labels[t]}</button>`).join("")}
  </div>`;

  let h=tabBar;

  if(wsTab==="tasks"||wsTab==="notes"){
    const key=wsTab;
    const items=D[key]||[];
    const label=key==="tasks"?"task":"note";
    h+=`<div class="add-row"><input id="ni" type="text" placeholder="Add ${label}…" onkeydown="if(event.key==='Enter')addWsItem()"/><button class="pbtn" onclick="addWsItem()">Add</button></div>`;
    if(!items.length){h+=`<p class="empty">Nothing here yet.</p>`;}
    else{
      items.forEach((item,i)=>{
        h+=`<div class="card"><div style="display:flex;align-items:center;gap:10px">
          <div onclick="toggleWsDone(${i})" style="width:18px;height:18px;border-radius:50%;border:2px solid ${item.done?"#3d9e75":"#1C2E4A"};background:${item.done?"#3d9e75":"transparent"};cursor:pointer;flex-shrink:0"></div>
          <span style="flex:1;font-size:14px;${item.done?"text-decoration:line-through;color:#888":""}">${esc(item.text)}</span>
          <button class="del-btn" onclick="delWsItem(${i})">✕</button>
        </div></div>`;
      });
    }
  } else {
    // Review sub-tab — delegate to existing renderer logic inline
    if(!D.review)D.review=[];
    const rows=D.review.map((item,i)=>`<div class="card">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="flex:1"><div style="font-size:13px;line-height:1.5">${esc(item.text)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">${item.date}</div></div>
        <button class="del-btn" onclick="delReview(${i})">✕</button>
      </div></div>`).join("");
    const copy=D.review.length?`<button onclick="copyReviews()" style="width:100%;background:#0F1E35;border:1px solid #1C2E4A;color:#888;padding:10px;border-radius:8px;font-size:13px;cursor:pointer;margin-bottom:14px">Copy all ideas to clipboard ↗</button>`:"";
    h+=`<div class="card" style="margin-bottom:14px">
      <div style="font-size:13px;font-weight:500;margin-bottom:10px">New idea or improvement</div>
      <textarea id="ri" placeholder="Describe an idea, bug, or feature…" style="min-height:80px;margin-bottom:8px"></textarea>
      <button onclick="addReview()" style="width:100%;background:#C9A227;color:#fff;padding:10px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none">Save idea</button>
    </div>${copy}${rows||"<p class='empty'>No ideas yet.</p>"}`;
  }
  main.innerHTML=h;
}
function addWsItem(){
  const el=document.getElementById("ni");const t=el.value.trim();if(!t)return;
  D[wsTab].push({id:Date.now(),text:t,done:false});
  el.value="";saveRemote();render();
}
function toggleWsDone(i){const item=D[wsTab][i];item.done=!item.done;saveRemote();render();}
function delWsItem(i){D[wsTab].splice(i,1);saveRemote();render();}

// ── Shopping ──
function urlDomain(u){try{return new URL(u).hostname.replace(/^www\./,"");}catch{return u;}}
function renderShopping(main){
  const cards=D.shopping||[];
  if(activeShopCard>=cards.length)activeShopCard=Math.max(0,cards.length-1);
  let globalTotal=0,globalPending=0;
  cards.forEach(c=>(c.items||[]).forEach(it=>{const p=parseFloat(it.price)||0;globalTotal+=p;if(!it.done)globalPending+=p;}));

  // Global summary
  let h=`<div class="card" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-size:11px;color:#888;margin-bottom:2px">TOTAL</div><div style="font-size:22px;font-weight:600;color:#C9A227">${fmt(globalTotal)}</div></div>
    <div style="text-align:right"><div style="font-size:11px;color:#888;margin-bottom:2px">PENDING</div><div style="font-size:22px;font-weight:600">${fmt(globalPending)}</div></div>
  </div>`;

  // Tab bar + new-list button
  h+=`<div style="display:flex;gap:4px;margin-bottom:12px;overflow-x:auto;padding-bottom:2px">`;
  cards.forEach((c,ci)=>{
    const active=activeShopCard===ci;
    h+=`<button onclick="activeShopCard=${ci};editShopCard=null;editShopItemKey=null;render()" style="padding:6px 14px;border-radius:20px;border:none;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0;background:${active?"#C9A227":"#0F1E35"};color:${active?"#fff":"#888"};font-weight:${active?"600":"400"}">${esc(c.name)}</button>`;
  });
  h+=`<button onclick="showNewListForm()" style="padding:6px 14px;border-radius:20px;border:1px dashed #1C2E4A;background:transparent;color:#888;font-size:13px;cursor:pointer;white-space:nowrap;flex-shrink:0">+ List</button>`;
  h+=`</div>`;
  h+=`<div id="new-list-form" style="display:none;margin-bottom:12px">
    <div style="display:flex;gap:8px">
      <input id="new-card-name" type="text" placeholder="List name…" onkeydown="if(event.key==='Enter')addShopCard()"/>
      <button class="pbtn" onclick="addShopCard()">Add</button>
      <button class="icon-btn" onclick="document.getElementById('new-list-form').style.display='none'">✕</button>
    </div>
  </div>`;

  if(!cards.length){
    h+=`<p class="empty">No lists yet — create one above.</p>`;
  }else{
    const ci=activeShopCard;
    const card=cards[ci];
    const items=card.items||[];
    const cardTotal=items.reduce((s,it)=>s+(parseFloat(it.price)||0),0);
    const cardPending=items.filter(it=>!it.done).reduce((s,it)=>s+(parseFloat(it.price)||0),0);
    const hasPrice=items.some(it=>it.price>0||it.price==="0");

    h+=`<div class="card">`;
    // Card header
    if(editShopCard===ci){
      h+=`<div style="display:flex;gap:8px;margin-bottom:12px">
        <input id="sedit-card-name" value="${esc(card.name)}" style="flex:1"/>
        <button class="sbtn" onclick="saveShopCardName(${ci})">Save</button>
        <button class="icon-btn" onclick="editShopCard=null;render()">✕</button>
      </div>`;
    }else{
      h+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${hasPrice?"8px":"12px"}">
        <span style="font-weight:600;font-size:15px">${esc(card.name)}</span>
        <div style="display:flex;gap:4px">
          <button class="icon-btn" onclick="editShopCard=${ci};render()">✎</button>
          <button class="del-btn" onclick="delShopCard(${ci})">✕</button>
        </div>
      </div>`;
      if(hasPrice){
        h+=`<div style="display:flex;justify-content:space-between;margin-bottom:12px;padding:8px 10px;background:#0C1525;border-radius:8px">
          <div><div style="font-size:10px;color:#888">TOTAL</div><div style="font-size:14px;font-weight:600;color:#C9A227">${fmt(cardTotal)}</div></div>
          <div style="text-align:right"><div style="font-size:10px;color:#888">PENDING</div><div style="font-size:14px;font-weight:600">${fmt(cardPending)}</div></div>
        </div>`;
      }
    }
    // Items
    items.forEach((item,ii)=>{
      const ekey=`${ci}-${ii}`;
      if(editShopItemKey===ekey){
        h+=`<div style="background:#0C1525;border-radius:8px;padding:10px;margin-bottom:8px">
          <input id="sedit-name-${ci}-${ii}" value="${esc(item.text)}" style="margin-bottom:8px"/>
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <input id="sedit-price-${ci}-${ii}" type="number" min="0" step="0.01" value="${item.price||""}" placeholder="Price" style="width:90px;flex-shrink:0"/>
            <input id="sedit-url-${ci}-${ii}" type="url" value="${esc(item.url||"")}" placeholder="URL" style="flex:1"/>
          </div>
          <div style="display:flex;gap:6px">
            <button class="sbtn" onclick="saveShopItem(${ci},${ii})" style="flex:1">Save</button>
            <button class="icon-btn" onclick="editShopItemKey=null;render()">✕</button>
          </div>
        </div>`;
      }else{
        const price=item.price>0||item.price==="0"?fmt(parseFloat(item.price)):"";
        const domain=item.url?urlDomain(item.url):"";
        h+=`<div style="display:flex;flex-direction:column;padding:6px 0;border-bottom:1px solid #1C2E4A">
          <div style="display:flex;align-items:center;gap:10px">
            <div onclick="toggleShopDone(${ci},${ii})" style="width:16px;height:16px;border-radius:50%;border:2px solid ${item.done?"#3d9e75":"#1C2E4A"};background:${item.done?"#3d9e75":"transparent"};cursor:pointer;flex-shrink:0"></div>
            <span style="flex:1;font-size:14px;${item.done?"text-decoration:line-through;color:#555":""}">${esc(item.text)}</span>
            ${price?`<span style="font-size:13px;font-weight:600;color:${item.done?"#555":"#C9A227"};flex-shrink:0">${price}</span>`:""}
            <button class="icon-btn" onclick="editShopItemKey='${ci}-${ii}';render()">✎</button>
            <button class="del-btn" onclick="delShopItem(${ci},${ii})">✕</button>
          </div>
          ${domain?`<a href="${esc(item.url)}" target="_blank" rel="noopener" style="display:inline-block;padding-top:4px;padding-left:26px;font-size:12px;color:#4A90D9;text-decoration:none">🔗 ${esc(domain)}</a>`:""}
        </div>`;
      }
    });
    // Add item form
    h+=`<div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #1C2E4A">
      <input id="shop-name-${ci}" type="text" placeholder="Add item…" onkeydown="if(event.key==='Enter')addShopItem(${ci})"/>
      <div style="display:flex;gap:6px">
        <input id="shop-price-${ci}" type="number" min="0" step="0.01" placeholder="Price" style="width:90px;flex-shrink:0"/>
        <input id="shop-url-${ci}" type="url" placeholder="URL (optional)" style="flex:1"/>
        <button class="sbtn" onclick="addShopItem(${ci})">Add</button>
      </div>
    </div></div>`;
  }
  main.innerHTML=h;
}
function showNewListForm(){
  const f=document.getElementById("new-list-form");
  if(f){f.style.display="block";document.getElementById("new-card-name")?.focus();}
}
function addShopCard(){
  const name=document.getElementById("new-card-name")?.value.trim();if(!name)return;
  if(!Array.isArray(D.shopping))D.shopping=[];
  D.shopping.push({id:Date.now(),name,items:[]});
  activeShopCard=D.shopping.length-1;
  saveRemote();render();
}
function delShopCard(ci){
  D.shopping.splice(ci,1);
  editShopCard=null;editShopItemKey=null;
  if(activeShopCard>=D.shopping.length)activeShopCard=Math.max(0,D.shopping.length-1);
  saveRemote();render();
}
function saveShopCardName(ci){
  const name=document.getElementById("sedit-card-name")?.value.trim();if(!name)return;
  D.shopping[ci].name=name;editShopCard=null;saveRemote();render();
}
function addShopItem(ci){
  const name=document.getElementById(`shop-name-${ci}`)?.value.trim();if(!name)return;
  const price=document.getElementById(`shop-price-${ci}`)?.value;
  const url=document.getElementById(`shop-url-${ci}`)?.value.trim();
  if(!D.shopping[ci].items)D.shopping[ci].items=[];
  D.shopping[ci].items.push({id:Date.now(),text:name,done:false,price:price?parseFloat(price):"",url:url||""});
  saveRemote();render();
}
function toggleShopDone(ci,ii){D.shopping[ci].items[ii].done=!D.shopping[ci].items[ii].done;saveRemote();render();}
function delShopItem(ci,ii){
  D.shopping[ci].items.splice(ii,1);
  if(editShopItemKey===`${ci}-${ii}`)editShopItemKey=null;
  saveRemote();render();
}
function saveShopItem(ci,ii){
  const name=document.getElementById(`sedit-name-${ci}-${ii}`)?.value.trim();if(!name)return;
  const price=document.getElementById(`sedit-price-${ci}-${ii}`)?.value;
  const url=document.getElementById(`sedit-url-${ci}-${ii}`)?.value.trim();
  D.shopping[ci].items[ii]={...D.shopping[ci].items[ii],text:name,price:price?parseFloat(price):"",url:url||""};
  editShopItemKey=null;saveRemote();render();
}

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
