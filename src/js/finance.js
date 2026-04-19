// ── Finance v2 ──

function finMigrate(){
  const f=D.finance;
  if(!f.bull)f.bull=[];
  if(f.salary>0&&!f._incMigrated){
    f.incomeSources.push({id:"inc"+Date.now(),name:"Salary",amount:f.salary,frequency:"monthly"});
    f._incMigrated=true;
  }
  if(f.transactions&&f.transactions.length&&!f._txMigrated){
    const recMap={monthly:"monthly",bimonthly:"quarterly",quarterly:"quarterly",biannual:"biannual",yearly:"yearly"};
    f.transactions.forEach(tx=>{
      if(tx.type!=="expense")return;
      f.expenses.push({id:"exp"+Date.now()+Math.random(),category:tx.category||"Other",amount:tx.amount,description:tx.description||"",withdrawDay:parseInt((tx.date||"").split("-")[2])||null,recurring:recMap[tx.recurring]||"one-time",startDate:tx.date||todayStr});
    });
    f._txMigrated=true;
  }
}

// ── Calculations ──
function toMonthly(amount,freq){
  if(freq==="daily")return amount*365/12;
  if(freq==="weekly")return amount*52/12;
  if(freq==="yearly")return amount/12;
  return amount;
}
function totalMonthlyIncome(){
  return(D.finance.incomeSources||[]).reduce((s,src)=>s+toMonthly(src.amount,src.frequency),0);
}
function expInMonth(exp,y,m){
  if(exp.recurring==="one-time"){
    const ms=`${y}-${String(m+1).padStart(2,"0")}`;
    return(exp.startDate||"").startsWith(ms);
  }
  if(exp.recurring==="monthly")return true;
  if(!exp.startDate)return false;
  const sd=new Date(exp.startDate);
  const diff=(y*12+m)-(sd.getFullYear()*12+sd.getMonth());
  if(diff<0)return false;
  return diff%({quarterly:3,biannual:6,yearly:12}[exp.recurring]||1)===0;
}
function bullForMonth(y,m){
  const ms=`${y}-${String(m+1).padStart(2,"0")}`;
  return(D.finance.bull||[]).filter(b=>b.date.startsWith(ms)).reduce((s,b)=>s+b.amount,0);
}
function mSumm(y,m){
  const inc=totalMonthlyIncome()+bullForMonth(y,m);
  const exps=(D.finance.expenses||[]).filter(e=>expInMonth(e,y,m));
  const exp=exps.reduce((s,e)=>s+e.amount,0);
  return{inc,exp,bal:inc-exp,exps};
}

// ── Router ──
function renderFin(main){
  finMigrate();
  const tabs=["overview","month","income","expenses","bull"];
  const tl={overview:"Overview",month:"Month",income:"Income",expenses:"Expenses",bull:"Bull"};
  let h=`<div class="fin-tabs">${tabs.map(t=>`<button class="fin-tab${finTab===t?" active":""}" onclick="finTab='${t}';render()">${tl[t]}</button>`).join("")}</div>`;
  if(finTab==="overview")h+=finOverview();
  else if(finTab==="month")h+=finMonth();
  else if(finTab==="income")h+=finIncome();
  else if(finTab==="expenses")h+=finExpenses();
  else if(finTab==="bull")h+=finBull();
  main.innerHTML=h;
}

// ── Overview ──
function finOverview(){
  const months=[];
  for(let i=11;i>=0;i--){let m=now.getMonth()-i,y=now.getFullYear();if(m<0){m+=12;y--;}months.push({y,m,label:MONTHS_S[m],s:mSumm(y,m)});}
  const cur=mSumm(now.getFullYear(),now.getMonth());
  const ti=months.reduce((s,x)=>s+x.s.inc,0);
  const te=months.reduce((s,x)=>s+x.s.exp,0);
  const savingsRate=ti>0?Math.round(((ti-te)/ti)*100):0;
  const mx=Math.max(...months.map(x=>Math.max(x.s.inc,x.s.exp)),1);

  const bars=months.map(x=>{
    const ih=Math.max(Math.round((x.s.inc/mx)*80),x.s.inc>0?2:0);
    const eh=Math.max(Math.round((x.s.exp/mx)*80),x.s.exp>0?2:0);
    const isCur=x.y===now.getFullYear()&&x.m===now.getMonth();
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
      <div style="display:flex;gap:1px;align-items:flex-end;height:80px">
        <div style="width:8px;height:${ih}px;background:#3d9e75;border-radius:2px 2px 0 0"></div>
        <div style="width:8px;height:${eh}px;background:#d85a30;border-radius:2px 2px 0 0"></div>
      </div>
      <span style="font-size:9px;color:${isCur?"#C9A227":"#888"}">${x.label}</span>
    </div>`;
  }).join("");

  const catTotals={};
  months.forEach(({s})=>s.exps.forEach(e=>{catTotals[e.category]=(catTotals[e.category]||0)+e.amount;}));
  const catRows=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([cat,amt])=>{
    const p=te>0?Math.round((amt/te)*100):0;
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:#888">${esc(cat)}</span><span>${fmt(amt)}</span></div>
      <div style="background:#1C2E4A;border-radius:4px;height:4px"><div style="background:#d85a30;height:4px;border-radius:4px;width:${p}%"></div></div>
    </div>`;
  }).join("");

  return `
  <div class="sg2" style="margin-bottom:10px">
    <div class="sc"><div class="sl">Monthly income</div><div class="sv" style="color:#3d9e75">${fmt(cur.inc)}</div></div>
    <div class="sc"><div class="sl">Monthly expenses</div><div class="sv" style="color:#d85a30">${fmt(cur.exp)}</div></div>
  </div>
  <div class="sg2" style="margin-bottom:14px">
    <div class="sc"><div class="sl">Balance / mo</div><div class="sv" style="color:${cur.bal>=0?"#3d9e75":"#d85a30"}">${fmt(cur.bal)}</div></div>
    <div class="sc"><div class="sl">Savings rate</div><div class="sv" style="color:${savingsRate>=0?"#3d9e75":"#d85a30"}">${savingsRate}%</div></div>
  </div>
  <div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:12px">12-month chart</div>
    <div style="display:flex;gap:2px;align-items:flex-end">${bars}</div>
    <div style="display:flex;gap:12px;margin-top:8px;font-size:11px;color:#888">
      <span><span style="display:inline-block;width:8px;height:8px;background:#3d9e75;border-radius:2px;margin-right:4px"></span>Income</span>
      <span><span style="display:inline-block;width:8px;height:8px;background:#d85a30;border-radius:2px;margin-right:4px"></span>Expenses</span>
    </div>
  </div>
  ${catRows?`<div class="card" style="margin-bottom:14px"><div style="font-size:13px;font-weight:500;margin-bottom:10px">Expenses by category (12 mo)</div>${catRows}</div>`:""}
  <div class="card">
    <div style="font-size:13px;font-weight:500;margin-bottom:10px">12-month totals</div>
    <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #1C2E4A"><span style="color:#888">Total income</span><span style="color:#3d9e75">${fmt(ti)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #1C2E4A"><span style="color:#888">Total expenses</span><span style="color:#d85a30">${fmt(te)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0"><span style="color:#888">Net savings</span><span style="color:${ti-te>=0?"#3d9e75":"#d85a30"}">${fmt(ti-te)}</span></div>
  </div>`;
}

// ── Month view ──
function finMonth(){
  const s=mSumm(finY,finM);
  const catTotals={};s.exps.forEach(e=>{catTotals[e.category]=(catTotals[e.category]||0)+e.amount;});
  const catRows=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
    const p=s.exp>0?Math.round((amt/s.exp)*100):0;
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:#888">${esc(cat)}</span><span>${fmt(amt)}</span></div>
      <div style="background:#1C2E4A;border-radius:4px;height:4px"><div style="background:#d85a30;height:4px;border-radius:4px;width:${p}%"></div></div>
    </div>`;
  }).join("");
  const RL={"one-time":"","monthly":"↻ Monthly","quarterly":"↻ Every 3 mo","biannual":"↻ Every 6 mo","yearly":"↻ Yearly"};
  const expRows=s.exps.map(e=>`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #1C2E4A;gap:8px">
    <div style="flex:1">
      <div style="font-size:13px">${esc(e.description||e.category)}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${esc(e.category)}${RL[e.recurring]?` · <span style="color:#C9A227">${RL[e.recurring]}</span>`:""}${e.withdrawDay?` · day ${e.withdrawDay}`:""}</div>
    </div>
    <span style="font-size:14px;font-weight:500;color:#d85a30">${fmt(e.amount)}</span>
  </div>`).join("");
  const incRows=(D.finance.incomeSources||[]).map(src=>`<div style="display:flex;align-items:center;padding:7px 0;border-bottom:1px solid #1C2E4A;gap:8px">
    <span style="flex:1;font-size:13px">${esc(src.name)}</span>
    <span style="font-size:13px;font-weight:500;color:#3d9e75">+${fmt(toMonthly(src.amount,src.frequency))}</span>
  </div>`).join("");
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <button class="cal-nav-btn" onclick="finNav(-1)">‹</button>
    <span style="font-weight:500;font-size:15px">${MONTHS_L[finM]} ${finY}</span>
    <button class="cal-nav-btn" onclick="finNav(1)">›</button>
  </div>
  <div class="sg3" style="margin-bottom:14px">
    <div class="sc"><div class="sl">Income</div><div class="sv" style="color:#3d9e75;font-size:13px">${fmt(s.inc)}</div></div>
    <div class="sc"><div class="sl">Expenses</div><div class="sv" style="color:#d85a30;font-size:13px">${fmt(s.exp)}</div></div>
    <div class="sc"><div class="sl">Balance</div><div class="sv" style="color:${s.bal>=0?"#3d9e75":"#d85a30"};font-size:13px">${fmt(s.bal)}</div></div>
  </div>
  ${incRows?`<div class="card" style="margin-bottom:14px"><div style="font-size:13px;font-weight:500;margin-bottom:6px">Income sources</div>${incRows}</div>`:""}
  ${catRows?`<div class="card" style="margin-bottom:14px"><div style="font-size:13px;font-weight:500;margin-bottom:10px">By category</div>${catRows}</div>`:""}
  <div class="card">
    <div style="font-size:13px;font-weight:500;margin-bottom:6px">Expenses</div>
    ${expRows||"<p style='font-size:13px;color:#888;padding:8px 0'>No expenses this month.</p>"}
  </div>`;
}
function finNav(d){finM+=d;if(finM>11){finM=0;finY++;}if(finM<0){finM=11;finY--;}render();}

// ── Income tab ──
function finIncome(){
  const sources=D.finance.incomeSources||[];
  const totalInc=totalMonthlyIncome();
  const FL={daily:"/ day",weekly:"/ week",monthly:"/ month",yearly:"/ year"};
  const srcRows=sources.map((src,i)=>`<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #1C2E4A;gap:8px">
    <div style="flex:1">
      <div style="font-size:14px;font-weight:500">${esc(src.name)}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${fmt(src.amount)} ${FL[src.frequency]||""} · <span style="color:#3d9e75">${fmt(toMonthly(src.amount,src.frequency))}/mo</span></div>
    </div>
    <button class="del-btn" onclick="delIncSrc(${i})">✕</button>
  </div>`).join("");
  return `
  <div class="sc" style="margin-bottom:14px;padding:14px;border-radius:12px;text-align:center">
    <div class="sl">Total recurring monthly income</div>
    <div style="font-size:26px;font-weight:600;color:#3d9e75;margin-top:4px">${fmt(totalInc)}</div>
  </div>
  <div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:12px">Add income source</div>
    <input id="inc-name" type="text" placeholder="Source name (e.g. Salary, Freelance)" style="margin-bottom:8px"/>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <input id="inc-amt" type="number" min="0" step="0.01" placeholder="Amount €" style="flex:1;width:auto"/>
      <select id="inc-freq" style="flex:1;width:auto">
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
        <option value="daily">Daily</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
    <button onclick="addIncSrc()" style="width:100%;background:#3d9e75;color:#fff;padding:10px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none">Add source</button>
  </div>
  <div class="card">
    <div style="font-size:13px;font-weight:500;margin-bottom:4px">Income sources</div>
    ${srcRows||"<p style='font-size:13px;color:#888;padding:8px 0'>No income sources yet.</p>"}
  </div>`;
}
// ── Bull tab ──
function finBull(){
  const bull=D.finance.bull||[];

  // Week bounds (Mon–Sun)
  const dow=now.getDay()===0?6:now.getDay()-1; // 0=Mon
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-dow);weekStart.setHours(0,0,0,0);
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekStart.getDate()+7);
  const weekTotal=bull.filter(b=>{const d=new Date(b.date+"T12:00:00");return d>=weekStart&&d<weekEnd;}).reduce((s,b)=>s+b.amount,0);

  const thisMonthMs=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthTotal=bull.filter(b=>b.date.startsWith(thisMonthMs)).reduce((s,b)=>s+b.amount,0);
  const yearTotal=bull.filter(b=>b.date.startsWith(String(now.getFullYear()))).reduce((s,b)=>s+b.amount,0);

  // 12-month chart
  const months=[];
  for(let i=11;i>=0;i--){
    let m=now.getMonth()-i,y=now.getFullYear();if(m<0){m+=12;y--;}
    const ms=`${y}-${String(m+1).padStart(2,"0")}`;
    const total=bull.filter(b=>b.date.startsWith(ms)).reduce((s,b)=>s+b.amount,0);
    const count=bull.filter(b=>b.date.startsWith(ms)).length;
    months.push({label:MONTHS_S[m],total,count,isCur:y===now.getFullYear()&&m===now.getMonth()});
  }
  const mx=Math.max(...months.map(x=>x.total),1);
  const bars=months.map(x=>{
    const h=Math.max(Math.round((x.total/mx)*80),x.total>0?2:0);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
      <div style="display:flex;align-items:flex-end;height:80px">
        <div style="width:16px;height:${h}px;background:#3d9e75;border-radius:2px 2px 0 0" title="${fmt(x.total)}"></div>
      </div>
      <span style="font-size:9px;color:${x.isCur?"#C9A227":"#888"}">${x.label}</span>
    </div>`;
  }).join("");

  // Monthly average (months with at least 1 entry)
  const activeMos=months.filter(x=>x.total>0);
  const avgMonth=activeMos.length?activeMos.reduce((s,x)=>s+x.total,0)/activeMos.length:0;

  // Log sorted desc
  const rows=[...bull].sort((a,b)=>b.date.localeCompare(a.date)).map(b=>`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #1C2E4A;gap:8px">
    <span style="flex:1;font-size:13px;color:#888">${b.date}</span>
    <span style="font-size:14px;font-weight:600;color:#3d9e75">+${fmt(b.amount)}</span>
    <button class="del-btn" onclick="delBull('${b.id}')">✕</button>
  </div>`).join("");

  return `
  <div class="sg3" style="margin-bottom:10px">
    <div class="sc"><div class="sl">This week</div><div class="sv" style="color:#3d9e75">${fmt(weekTotal)}</div></div>
    <div class="sc"><div class="sl">This month</div><div class="sv" style="color:#3d9e75">${fmt(monthTotal)}</div></div>
    <div class="sc"><div class="sl">This year</div><div class="sv" style="color:#3d9e75">${fmt(yearTotal)}</div></div>
  </div>
  <div class="sg2" style="margin-bottom:14px">
    <div class="sc"><div class="sl">Avg / active month</div><div class="sv" style="color:#3d9e75">${fmt(avgMonth)}</div></div>
    <div class="sc"><div class="sl">Total entries</div><div class="sv">${bull.length}</div></div>
  </div>
  <div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:12px">Log entry</div>
    <div style="display:flex;gap:8px">
      <input id="bull-date" type="date" value="${todayStr}" style="flex:1;width:auto"/>
      <input id="bull-amt" type="number" min="0" step="0.01" placeholder="Amount €" style="flex:1;width:auto"/>
      <button class="sbtn" onclick="addBull()">Add</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:12px">12-month chart</div>
    <div style="display:flex;gap:2px;align-items:flex-end">${bars}</div>
  </div>
  <div class="card">
    <div style="font-size:13px;font-weight:500;margin-bottom:4px">Log</div>
    ${rows||"<p style='font-size:13px;color:#888;padding:8px 0'>No entries yet.</p>"}
  </div>`;
}

function addIncSrc(){
  const name=document.getElementById("inc-name")?.value.trim();if(!name)return;
  const amt=parseFloat(document.getElementById("inc-amt")?.value);if(!amt)return;
  const freq=document.getElementById("inc-freq")?.value;
  D.finance.incomeSources.push({id:"inc"+Date.now(),name,amount:amt,frequency:freq});
  saveRemote();render();
}
function delIncSrc(i){D.finance.incomeSources.splice(i,1);saveRemote();render();}
function addBull(){
  const date=document.getElementById("bull-date")?.value;
  const amt=parseFloat(document.getElementById("bull-amt")?.value);
  if(!date||!amt)return;
  if(!D.finance.bull)D.finance.bull=[];
  D.finance.bull.push({id:"bull"+Date.now(),date,amount:amt});
  saveRemote();render();
}
function delBull(id){D.finance.bull=D.finance.bull.filter(b=>b.id!==id);saveRemote();render();}

// ── Expenses tab ──
function finExpenses(){
  const cats=D.finance.expenseCategories||[];
  const exps=D.finance.expenses||[];
  const RL={"one-time":"One-time","monthly":"Monthly","quarterly":"Every 3 mo","biannual":"Every 6 mo","yearly":"Yearly"};
  const monthlyFixed=exps.filter(e=>e.recurring!=="one-time").reduce((s,e)=>{
    return s+e.amount/({monthly:1,quarterly:3,biannual:6,yearly:12}[e.recurring]||1);
  },0);
  const catTags=cats.map((c,i)=>`<span style="display:inline-flex;align-items:center;gap:5px;background:#0C1525;border:1px solid #1C2E4A;border-radius:20px;padding:4px 10px;font-size:12px;color:#aaa">
    ${esc(c)}<span onclick="delExpCat(${i})" style="color:#555;cursor:pointer;font-size:11px">✕</span>
  </span>`).join("");
  const rows=exps.map((e,i)=>{
    if(editExpIdx===i){
      return `<div style="background:#0C1525;border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <select id="eedit-cat" style="flex:1;width:auto">${cats.map(c=>`<option${c===e.category?" selected":""}>${esc(c)}</option>`).join("")}</select>
          <input id="eedit-amt" type="number" min="0" step="0.01" value="${e.amount}" style="width:80px;flex-shrink:0"/>
        </div>
        <input id="eedit-desc" type="text" value="${esc(e.description||"")}" placeholder="Description (optional)" style="margin-bottom:8px"/>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div style="flex:1">
            <div style="font-size:11px;color:#888;margin-bottom:4px">Withdraw day</div>
            <input id="eedit-day" type="number" min="1" max="31" placeholder="1–31" value="${e.withdrawDay||""}"/>
          </div>
          <div style="flex:1">
            <div style="font-size:11px;color:#888;margin-bottom:4px">Start / date</div>
            <input id="eedit-date" type="date" value="${e.startDate||""}"/>
          </div>
        </div>
        <select id="eedit-rec" style="margin-bottom:10px">
          <option value="one-time"${e.recurring==="one-time"?" selected":""}>One-time</option>
          <option value="monthly"${e.recurring==="monthly"?" selected":""}>Monthly</option>
          <option value="quarterly"${e.recurring==="quarterly"?" selected":""}>Every 3 months</option>
          <option value="biannual"${e.recurring==="biannual"?" selected":""}>Every 6 months</option>
          <option value="yearly"${e.recurring==="yearly"?" selected":""}>Yearly</option>
        </select>
        <div style="display:flex;gap:6px">
          <button class="sbtn" onclick="saveExp(${i})" style="flex:1">Save</button>
          <button class="icon-btn" onclick="editExpIdx=null;render()">✕</button>
        </div>
      </div>`;
    }
    return `<div style="display:flex;align-items:flex-start;padding:10px 0;border-bottom:1px solid #1C2E4A;gap:8px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${esc(e.description||e.category)}</div>
        <div style="font-size:11px;color:#888;margin-top:2px">
          <span style="color:#C9A227">${esc(e.category)}</span> · ${RL[e.recurring]||e.recurring}${e.withdrawDay?` · day ${e.withdrawDay}`:""}
        </div>
      </div>
      <span style="font-size:14px;font-weight:600;color:#d85a30;flex-shrink:0">${fmt(e.amount)}</span>
      <button class="icon-btn" onclick="editExpIdx=${i};render()">✎</button>
      <button class="del-btn" onclick="delExp(${i})">✕</button>
    </div>`;
  }).join("");
  return `
  <div class="sg2" style="margin-bottom:14px">
    <div class="sc"><div class="sl">Avg fixed / mo</div><div class="sv" style="color:#d85a30">${fmt(monthlyFixed)}</div></div>
    <div class="sc"><div class="sl">Total entries</div><div class="sv">${exps.length}</div></div>
  </div>
  <div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:10px">Categories</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${catTags||"<span style='font-size:12px;color:#555'>No categories</span>"}</div>
    <div style="display:flex;gap:8px">
      <input id="new-cat" type="text" placeholder="New category…"/>
      <button class="sbtn" onclick="addExpCat()">Add</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:12px">Add expense</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <select id="exp-cat" style="flex:1;width:auto">${cats.map(c=>`<option>${esc(c)}</option>`).join("")||"<option>—</option>"}</select>
      <input id="exp-amt" type="number" min="0" step="0.01" placeholder="€" style="width:80px;flex-shrink:0"/>
    </div>
    <input id="exp-desc" type="text" placeholder="Description (optional)" style="margin-bottom:8px"/>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <div style="flex:1">
        <div style="font-size:11px;color:#888;margin-bottom:4px">Withdraw day</div>
        <input id="exp-day" type="number" min="1" max="31" placeholder="1–31"/>
      </div>
      <div style="flex:1">
        <div style="font-size:11px;color:#888;margin-bottom:4px">Start / date</div>
        <input id="exp-date" type="date" value="${todayStr}"/>
      </div>
    </div>
    <select id="exp-rec" style="margin-bottom:10px">
      <option value="one-time">One-time</option>
      <option value="monthly">Monthly</option>
      <option value="quarterly">Every 3 months</option>
      <option value="biannual">Every 6 months</option>
      <option value="yearly">Yearly</option>
    </select>
    <button onclick="addExp()" style="width:100%;background:#C9A227;color:#fff;padding:10px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none">Add expense</button>
  </div>
  <div class="card">
    <div style="font-size:13px;font-weight:500;margin-bottom:4px">All expenses</div>
    ${rows||"<p style='font-size:13px;color:#888;padding:8px 0'>No expenses defined yet.</p>"}
  </div>`;
}
function addExpCat(){
  const el=document.getElementById("new-cat");const c=el.value.trim();if(!c)return;
  if(!D.finance.expenseCategories.includes(c))D.finance.expenseCategories.push(c);
  el.value="";saveRemote();render();
}
function delExpCat(i){D.finance.expenseCategories.splice(i,1);saveRemote();render();}
function addExp(){
  const cat=document.getElementById("exp-cat")?.value;
  const amt=parseFloat(document.getElementById("exp-amt")?.value);
  if(!cat||!amt)return;
  const desc=document.getElementById("exp-desc")?.value.trim()||"";
  const day=parseInt(document.getElementById("exp-day")?.value)||null;
  const date=document.getElementById("exp-date")?.value||todayStr;
  const rec=document.getElementById("exp-rec")?.value;
  D.finance.expenses.push({id:"exp"+Date.now(),category:cat,amount:amt,description:desc,withdrawDay:day,recurring:rec,startDate:date});
  saveRemote();render();
}
function delExp(i){D.finance.expenses.splice(i,1);if(editExpIdx===i)editExpIdx=null;saveRemote();render();}
function saveExp(i){
  const cat=document.getElementById("eedit-cat")?.value;
  const amt=parseFloat(document.getElementById("eedit-amt")?.value);
  if(!cat||!amt)return;
  const desc=document.getElementById("eedit-desc")?.value.trim()||"";
  const day=parseInt(document.getElementById("eedit-day")?.value)||null;
  const date=document.getElementById("eedit-date")?.value||todayStr;
  const rec=document.getElementById("eedit-rec")?.value;
  D.finance.expenses[i]={...D.finance.expenses[i],category:cat,amount:amt,description:desc,withdrawDay:day,startDate:date,recurring:rec};
  editExpIdx=null;saveRemote();render();
}
