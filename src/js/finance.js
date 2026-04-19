// ── Finance ──
function getRecM(y,m){
  return D.finance.transactions.filter(t=>{
    if(t.type!=="expense")return false;
    if(t.recurring==="monthly")return true;
    if(t.recurring==="bimonthly"||t.recurring==="quarterly"||t.recurring==="biannual"){
      const td=new Date(t.date);
      const diff=(y*12+m)-(td.getFullYear()*12+td.getMonth());
      const interval=t.recurring==="bimonthly"?2:t.recurring==="quarterly"?3:6;
      return diff>=0&&diff%interval===0;
    }
    return false;
  });
}
function getOncM(y,m){
  const ms=`${y}-${String(m+1).padStart(2,"0")}`;
  return D.finance.transactions.filter(t=>(t.recurring==="none"||!t.recurring)&&t.date.startsWith(ms));
}
function mSumm(y,m){
  const o=getOncM(y,m),r=getRecM(y,m);
  const inc=(D.finance.salary||0)+o.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const exp=o.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)+r.reduce((s,t)=>s+t.amount,0);
  return{inc,exp,bal:inc-exp};
}

function renderFin(main){
  const tabs=["overview","month","expenses","recurring","budget"];
  const tl={overview:"Overview",month:"Month",expenses:"Expenses",recurring:"Recurring",budget:"Budget"};
  let th=`<div class="fin-tabs">${tabs.map(t=>`<button class="fin-tab${finTab===t?" active":""}" onclick="finTab='${t}';render()">${tl[t]}</button>`).join("")}</div>`;
  let c="";
  if(finTab==="overview")c=finOverview();
  else if(finTab==="month")c=finMonth();
  else if(finTab==="expenses")c=finExpenses();
  else if(finTab==="recurring")c=finRecurring();
  else if(finTab==="budget")c=finBudget();
  main.innerHTML=th+c;
}

function finOverview(){
  const ms=[];
  for(let i=11;i>=0;i--){let m=now.getMonth()-i,y=now.getFullYear();if(m<0){m+=12;y--;}ms.push({y,m,label:MONTHS_S[m],s:mSumm(y,m)});}
  const cs=mSumm(now.getFullYear(),now.getMonth());
  const ti=ms.reduce((s,x)=>s+x.s.inc,0),te=ms.reduce((s,x)=>s+x.s.exp,0);
  const mx=Math.max(...ms.map(x=>Math.max(x.s.inc,x.s.exp)),1);
  const bars=ms.map(x=>{
    const ih=Math.max(Math.round((x.s.inc/mx)*80),2),eh=Math.max(Math.round((x.s.exp/mx)*80),2);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
      <div style="display:flex;gap:1px;align-items:flex-end;height:80px">
        <div style="width:8px;height:${ih}px;background:#3d9e75;border-radius:2px 2px 0 0"></div>
        <div style="width:8px;height:${eh}px;background:#d85a30;border-radius:2px 2px 0 0"></div>
      </div><span style="font-size:9px;color:#888">${x.label}</span></div>`;
  }).join("");
  return `<div class="sg3"><div class="sc"><div class="sl">Income</div><div class="sv" style="color:#3d9e75">${fmt(cs.inc)}</div></div>
    <div class="sc"><div class="sl">Expenses</div><div class="sv" style="color:#d85a30">${fmt(cs.exp)}</div></div>
    <div class="sc"><div class="sl">Balance</div><div class="sv" style="color:${cs.bal>=0?"#3d9e75":"#d85a30"}">${fmt(cs.bal)}</div></div></div>
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:12px">12-month chart</div>
    <div style="display:flex;gap:2px;align-items:flex-end">${bars}</div>
    <div style="display:flex;gap:12px;margin-top:8px;font-size:11px;color:#888">
      <span><span style="display:inline-block;width:8px;height:8px;background:#3d9e75;border-radius:2px;margin-right:4px"></span>Income</span>
      <span><span style="display:inline-block;width:8px;height:8px;background:#d85a30;border-radius:2px;margin-right:4px"></span>Expenses</span>
    </div></div>
    <div class="card" style="margin-top:10px">
      <div style="font-size:13px;font-weight:500;margin-bottom:10px">12-month totals</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #1C2E4A"><span style="color:#888">Total income</span><span style="color:#3d9e75">${fmt(ti)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #1C2E4A"><span style="color:#888">Total expenses</span><span style="color:#d85a30">${fmt(te)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0"><span style="color:#888">Net savings</span><span style="color:${ti-te>=0?"#3d9e75":"#d85a30"}">${fmt(ti-te)}</span></div>
    </div>`;
}

function finMonth(){
  const s=mSumm(finY,finM);
  const o=getOncM(finY,finM),r=getRecM(finY,finM);
  const all=[...o,...r.map(t=>({...t,_r:true}))].sort((a,b)=>b.date.localeCompare(a.date));
  const ct={};all.filter(t=>t.type==="expense").forEach(t=>{ct[t.category]=(ct[t.category]||0)+t.amount;});
  const cr=Object.entries(ct).sort((a,b)=>b[1]-a[1]).map(([c,a])=>{
    const p=s.exp>0?Math.round((a/s.exp)*100):0;
    return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:#888">${c}</span><span>${fmt(a)}</span></div>
    <div style="background:#1C2E4A;border-radius:4px;height:4px"><div style="background:#d85a30;height:4px;border-radius:4px;width:${p}%"></div></div></div>`;
  }).join("");
  const tr=all.slice(0,20).map(t=>`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #1C2E4A;gap:8px">
    <div style="flex:1"><div style="font-size:13px">${esc(t.description)}${t._r?` <span style="font-size:10px;color:#C9A227;background:#2A1A00;padding:1px 5px;border-radius:4px">↻</span>`:""}</div>
    <div style="font-size:11px;color:#888">${t.category}·${t.date}</div></div>
    <span style="font-size:14px;font-weight:500;color:${t.type==="income"?"#3d9e75":"#d85a30"}">${t.type==="income"?"+":"−"}${fmt(t.amount)}</span>
  </div>`).join("");
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <button class="cal-nav-btn" onclick="finNav(-1)">‹</button>
    <span style="font-weight:500;font-size:15px">${MONTHS_L[finM]} ${finY}</span>
    <button class="cal-nav-btn" onclick="finNav(1)">›</button></div>
    <div class="sg3" style="margin-bottom:14px">
      <div class="sc"><div class="sl">Income</div><div class="sv" style="color:#3d9e75;font-size:13px">${fmt(s.inc)}</div></div>
      <div class="sc"><div class="sl">Expenses</div><div class="sv" style="color:#d85a30;font-size:13px">${fmt(s.exp)}</div></div>
      <div class="sc"><div class="sl">Balance</div><div class="sv" style="color:${s.bal>=0?"#3d9e75":"#d85a30"};font-size:13px">${fmt(s.bal)}</div></div></div>
    ${cr?`<div class="card" style="margin-bottom:14px"><div style="font-size:13px;font-weight:500;margin-bottom:10px">By category</div>${cr}</div>`:""}
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:8px">Transactions</div>${tr||"<p style='font-size:13px;color:#888'>No transactions this month.</p>"}</div>`;
}
function finNav(d){finM+=d;if(finM>11){finM=0;finY++;}if(finM<0){finM=11;finY--;}render();}

function finExpenses(){
  const rows=[...D.finance.transactions].reverse().slice(0,25).map(t=>`
    <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #1C2E4A;gap:8px">
      <div style="flex:1"><div style="font-size:13px">${esc(t.description)}${t.recurring&&t.recurring!=="none"?` <span style="font-size:10px;color:#C9A227;background:#2A1A00;padding:1px 5px;border-radius:4px">↻${t.recurring==="bimonthly"?" 2mo":""}</span>`:""}</div>
      <div style="font-size:11px;color:#888">${t.category}·${t.date}</div></div>
      <span style="font-size:14px;font-weight:500;color:${t.type==="income"?"#3d9e75":"#d85a30"}">${t.type==="income"?"+":"−"}${fmt(t.amount)}</span>
      <button class="del-btn" onclick="delTx('${t.id}')">✕</button>
    </div>`).join("");
  return `<div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:12px">Add transaction</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <select id="tx-type" style="flex:1;width:auto"><option value="expense">Expense</option><option value="income">Income</option></select>
      <input id="tx-amt" type="number" min="0" step="0.01" placeholder="Amount €" style="flex:1;width:auto;font-size:13px"/>
    </div>
    <input id="tx-desc" type="text" placeholder="Description" style="margin-bottom:8px;font-size:13px"/>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <select id="tx-cat" style="flex:1;width:auto">${ECATS.map(c=>`<option>${c}</option>`).join("")}</select>
      <input id="tx-date" type="date" value="${todayStr}" style="flex:1;width:auto;font-size:13px"/>
    </div>
    <select id="tx-rec" style="margin-bottom:10px">
      <option value="none">One-time</option>
      <option value="monthly">Recurring monthly</option>
      <option value="bimonthly">Recurring every 2 months</option>
      <option value="quarterly">Recurring every 3 months</option>
      <option value="biannual">Recurring every 6 months</option>
    </select>
    <button onclick="addTx()" style="width:100%;background:#C9A227;color:#fff;padding:10px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none">Add</button>
  </div>
  <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:8px">All transactions</div>${rows||"<p style='font-size:13px;color:#888'>No transactions yet.</p>"}</div>`;
}
function addTx(){
  const type=document.getElementById("tx-type").value;
  const amt=parseFloat(document.getElementById("tx-amt").value);
  const desc=document.getElementById("tx-desc").value.trim();
  const cat=document.getElementById("tx-cat").value;
  const date=document.getElementById("tx-date").value;
  const rec=document.getElementById("tx-rec").value;
  if(!amt||!date)return;
  D.finance.transactions.push({id:"tx"+Date.now(),type,amount:amt,description:desc||cat,category:cat,date,recurring:rec});
  D.finance.transactions.sort((a,b)=>b.date.localeCompare(a.date));
  saveRemote();render();
}
function delTx(id){D.finance.transactions=D.finance.transactions.filter(t=>t.id!==id);saveRemote();render();}

function finRecurring(){
  const rec=D.finance.transactions.filter(t=>t.recurring&&t.recurring!=="none");
  const mt=rec.filter(t=>t.recurring==="monthly").reduce((s,t)=>s+t.amount,0);
  const bt=rec.filter(t=>t.recurring==="bimonthly").reduce((s,t)=>s+t.amount,0);
  const rows=rec.map(t=>`<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #1C2E4A;gap:8px">
    <div style="flex:1"><div style="font-size:13px">${esc(t.description)}</div>
    <div style="font-size:11px;color:#888">${t.category}·<span style="color:#C9A227">${{monthly:"Every month",bimonthly:"Every 2 months",quarterly:"Every 3 months",biannual:"Every 6 months"}[t.recurring]||t.recurring}</span></div></div>
    <span style="font-size:14px;font-weight:500;color:#d85a30">−${fmt(t.amount)}</span>
    <button class="del-btn" onclick="delTx('${t.id}')">✕</button>
  </div>`).join("");
  return `<div class="sg2"><div class="sc"><div class="sl">Monthly fixed</div><div class="sv" style="color:#d85a30">${fmt(mt)}</div></div>
    <div class="sc"><div class="sl">Avg/month (all)</div><div class="sv" style="color:#d85a30">${fmt(mt+bt/2)}</div></div></div>
    <div class="card">${rows||"<p style='font-size:13px;color:#888'>No recurring expenses yet.</p>"}</div>`;
}

function finBudget(){
  const s=mSumm(now.getFullYear(),now.getMonth());
  const sal=D.finance.salary||0,bud=D.finance.budgets||{};
  const o=getOncM(now.getFullYear(),now.getMonth()),r=getRecM(now.getFullYear(),now.getMonth());
  const ca={};[...o.filter(t=>t.type==="expense"),...r].forEach(t=>{ca[t.category]=(ca[t.category]||0)+t.amount;});
  const br=ECATS.map(c=>{
    const act=ca[c]||0,bdg=bud[c]||0,p=bdg>0?Math.min(Math.round((act/bdg)*100),100):0,ov=bdg>0&&act>bdg;
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>${c}</span>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="color:#888">€<input type="number" min="0" value="${bdg}" onchange="setBudget('${c}',this.value)" style="width:55px;background:transparent;border:none;border-bottom:1px solid #1C2E4A;color:#e8e8e8;font-size:12px;text-align:right;outline:none;padding:2px"/></span>
        <span style="color:${ov?"#d85a30":act>0?"#e8e8e8":"#888"}">${fmt(act)}</span>
      </div></div>
      <div style="background:#1C2E4A;border-radius:4px;height:5px"><div style="background:${ov?"#d85a30":"#C9A227"};height:5px;border-radius:4px;width:${p}%"></div></div>
    </div>`;
  }).join("");
  return `<div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:10px">Monthly salary</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input type="number" id="sal" value="${sal}" placeholder="0.00" style="flex:1;font-size:14px"/>
      <button onclick="setSal()" class="sbtn">Save</button>
    </div></div>
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:12px">Budget vs actual — ${MONTHS_S[now.getMonth()]}</div>
    ${br}
    <div style="border-top:1px solid #1C2E4A;padding-top:10px;margin-top:4px;display:flex;justify-content:space-between;font-size:13px">
      <span style="color:#888">Remaining</span>
      <span style="color:${sal-s.exp>=0?"#3d9e75":"#d85a30"}">${fmt(sal-s.exp)}</span>
    </div></div>`;
}
function setSal(){const v=parseFloat(document.getElementById("sal").value)||0;D.finance.salary=v;saveRemote();render();}
function setBudget(c,v){if(!D.finance.budgets)D.finance.budgets={};D.finance.budgets[c]=parseFloat(v)||0;saveRemote();}
