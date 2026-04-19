// ── Investment ──
let invForm={name:"",initial:"",monthlyRev:"",monthlyCost:"",growth:""};
let invResult=null;

function renderInvestment(main){
  const f=invForm;
  let h=`
  <div class="card" style="margin-bottom:12px">
    <div style="font-size:15px;font-weight:700;margin-bottom:14px">📈 Investment Analyzer</div>

    <div class="inv-label">Investment Name</div>
    <input id="inv-name" type="text" placeholder="e.g. Apartment, Business, Fund" value="${esc(f.name)}" style="margin-bottom:10px"/>

    <div class="inv-label">Initial Investment (€)</div>
    <input id="inv-initial" type="number" min="0" step="1" placeholder="50000" value="${f.initial}" style="margin-bottom:10px"/>

    <div class="sg2" style="margin-bottom:10px">
      <div>
        <div class="inv-label">Monthly Revenue (€)</div>
        <input id="inv-rev" type="number" min="0" step="1" placeholder="8000" value="${f.monthlyRev}"/>
      </div>
      <div>
        <div class="inv-label">Monthly Costs (€)</div>
        <input id="inv-cost" type="number" min="0" step="1" placeholder="5000" value="${f.monthlyCost}"/>
      </div>
    </div>

    <div class="inv-label">Expected Annual Growth Rate (%)</div>
    <input id="inv-growth" type="number" min="-100" max="1000" step="0.5" placeholder="10" value="${f.growth}" style="margin-bottom:14px"/>

    <button class="pbtn" onclick="calcInvestment()" style="width:100%">Calculate</button>
  </div>

  <div class="card" style="margin-bottom:12px;padding:12px 14px">
    <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:8px;letter-spacing:.04em">WHAT MAKES A GOOD INVESTMENT?</div>
    <div style="font-size:12px;color:#aaa;line-height:1.7">
      <b style="color:#e8e8e8">ROI (Return on Investment)</b> — annual net profit ÷ initial capital × 100.<br>
      <b style="color:#e8e8e8">Payback period</b> — months until cumulative profit covers your investment.<br>
      <b style="color:#e8e8e8">Cash flow</b> — monthly revenue minus monthly costs. Must be positive.<br>
      <b style="color:#e8e8e8">Growth rate</b> — expected annual increase in profits (use conservative estimates).
    </div>
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px">
      ${[["⭐⭐⭐⭐⭐ Excellent","ROI > 50%","#3d9e75"],["⭐⭐⭐⭐ Great","ROI 30–50%","#5CB85C"],["⭐⭐⭐ Good","ROI 15–30%","#C9A227"],["⭐⭐ Fair","ROI 5–15%","#E08A3C"],["⭐ Poor","ROI 0–5%","#d85a30"],["💸 Loss","Negative ROI","#E05C5C"]].map(([s,r,c])=>`<div style="display:flex;align-items:center;gap:5px;padding:3px 0"><span>${s}</span><span style="color:${c};margin-left:auto">${r}</span></div>`).join("")}
    </div>
  </div>`;

  if(invResult) h+=renderInvResults(invResult);

  const saved=D.investments||[];
  if(saved.length){
    h+=`<div style="font-size:11px;color:#888;margin:16px 0 8px;letter-spacing:.04em;text-transform:uppercase">Saved Analyses</div>`;
    saved.forEach((inv,i)=>{h+=savedInvCard(inv,i);});
  }
  main.innerHTML=h;
}

function calcInvestment(){
  const name=document.getElementById("inv-name")?.value.trim()||"My Investment";
  const initial=parseFloat(document.getElementById("inv-initial")?.value)||0;
  const monthlyRev=parseFloat(document.getElementById("inv-rev")?.value)||0;
  const monthlyCost=parseFloat(document.getElementById("inv-cost")?.value)||0;
  const growth=parseFloat(document.getElementById("inv-growth")?.value)||0;
  invForm={name,initial,monthlyRev,monthlyCost,growth};

  const monthlyProfit=monthlyRev-monthlyCost;
  const annualProfit=monthlyProfit*12;
  const annualROI=initial>0?(annualProfit/initial*100):0;
  const paybackMonths=monthlyProfit>0?Math.ceil(initial/monthlyProfit):Infinity;

  // 3-year projection — profit grows by growth%, costs stay flat
  const years=[];
  let cumulative=0;
  let yearProfit=annualProfit;
  for(let y=1;y<=3;y++){
    cumulative+=yearProfit;
    years.push({year:y,profit:yearProfit,cumulative:cumulative});
    yearProfit*=(1+growth/100);
  }

  let score,scoreLabel,scoreColor;
  if(annualROI<0){score=0;scoreLabel="Loss — negative cash flow";scoreColor="#E05C5C";}
  else if(annualROI<5){score=1;scoreLabel="Poor";scoreColor="#d85a30";}
  else if(annualROI<15){score=2;scoreLabel="Fair";scoreColor="#E08A3C";}
  else if(annualROI<30){score=3;scoreLabel="Good";scoreColor="#C9A227";}
  else if(annualROI<50){score=4;scoreLabel="Great";scoreColor="#5CB85C";}
  else{score=5;scoreLabel="Excellent";scoreColor="#3d9e75";}

  invResult={name,initial,monthlyRev,monthlyCost,growth,monthlyProfit,annualProfit,annualROI,paybackMonths,years,score,scoreLabel,scoreColor};
  render();
}

function renderInvResults(r){
  const noBreakEven=r.paybackMonths===Infinity;
  const paybackStr=noBreakEven?"Never"
    :r.paybackMonths<=24?`${r.paybackMonths} months`
    :`${(r.paybackMonths/12).toFixed(1)} years`;

  // Which year does break-even occur in the projection?
  const bey=r.years.findIndex(y=>y.cumulative>=r.initial&&r.initial>0);

  // Score card
  const starsStr=r.score>0?"⭐".repeat(r.score):"💸";
  let h=`<div class="card" style="margin-bottom:12px;text-align:center;padding:24px 16px">
    <div style="font-size:40px;margin-bottom:6px">${starsStr}</div>
    <div style="font-size:22px;font-weight:700;color:${r.scoreColor};margin-bottom:6px">${r.scoreLabel}</div>
    <div style="display:flex;justify-content:center;gap:24px;margin-top:8px">
      <div><div style="font-size:11px;color:#888">Annual ROI</div><div style="font-size:18px;font-weight:700;color:${r.scoreColor}">${r.annualROI.toFixed(1)}%</div></div>
      <div style="width:1px;background:#1C2E4A"></div>
      <div><div style="font-size:11px;color:#888">Payback</div><div style="font-size:18px;font-weight:700;color:${noBreakEven?"#E05C5C":r.scoreColor}">${paybackStr}</div></div>
    </div>
  </div>`;

  // Key metrics
  h+=`<div class="card" style="margin-bottom:12px">
    <div class="inv-label" style="margin-bottom:10px">Key Metrics</div>
    ${invMetricRow("Monthly cash flow",fmt(r.monthlyProfit),r.monthlyProfit>=0?"#3d9e75":"#E05C5C")}
    ${invMetricRow("Annual net profit",fmt(r.annualProfit),r.annualProfit>=0?"#3d9e75":"#E05C5C")}
    ${invMetricRow("Break-even point",paybackStr,noBreakEven?"#E05C5C":r.paybackMonths<24?"#3d9e75":r.paybackMonths<60?"#C9A227":"#E08A3C")}
    ${invMetricRow("Initial investment",fmt(r.initial),"#e8e8e8")}
    ${invMetricRow("Monthly revenue",fmt(r.monthlyRev),"#888")}
    ${invMetricRow("Monthly costs",fmt(r.monthlyCost),"#888")}
  </div>`;

  // 3-year projection
  h+=`<div class="card" style="margin-bottom:12px">
    <div class="inv-label" style="margin-bottom:12px">3-Year Projection${r.growth!==0?` (${r.growth>0?"+":""}${r.growth}% growth/yr)`:""}</div>`;

  r.years.forEach(y=>{
    const pct=r.initial>0?Math.min(100,Math.max(0,y.cumulative/r.initial*100)):y.cumulative>0?100:0;
    const reached=r.initial>0&&y.cumulative>=r.initial;
    const isBreakEvenYear=bey===y.year-1;
    const barColor=reached?"#3d9e75":y.cumulative>0?"#C9A227":"#E05C5C";
    h+=`<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
        <span style="font-size:13px;font-weight:600">Year ${y.year}</span>
        <span style="font-size:12px;color:#888">+${fmt(y.profit)} this year</span>
        <span style="font-size:14px;font-weight:700;color:${barColor}">${fmt(y.cumulative)}</span>
      </div>
      <div style="background:#0C1525;border-radius:4px;height:8px;overflow:hidden">
        <div style="background:${barColor};height:8px;border-radius:4px;width:${pct}%"></div>
      </div>
      ${isBreakEvenYear?`<div style="font-size:11px;color:#3d9e75;margin-top:4px">✓ Break-even reached in Year ${y.year}</div>`:""}
      ${!isBreakEvenYear&&!reached&&r.initial>0?`<div style="font-size:10px;color:#555;margin-top:3px">${fmt(Math.max(0,r.initial-y.cumulative))} still to recover</div>`:""}
    </div>`;
  });

  h+=`<div style="border-top:1px solid #1C2E4A;padding-top:10px;margin-top:4px">
    <div style="font-size:12px;color:#888">Cumulative profit after 3 years</div>
    <div style="font-size:20px;font-weight:700;color:${r.years[2].cumulative>=0?"#3d9e75":"#E05C5C"}">${fmt(r.years[2].cumulative)}</div>
    ${r.initial>0?`<div style="font-size:12px;color:#888;margin-top:2px">Total ROI over 3 years: <span style="color:#e8e8e8;font-weight:600">${(r.years[2].cumulative/r.initial*100).toFixed(1)}%</span></div>`:""}
  </div>`;

  h+=`<button class="sbtn" onclick="saveInvestment()" style="width:100%;margin-top:14px">Save Analysis</button>
  </div>`;

  return h;
}

function invMetricRow(label,value,color){
  return `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #0C1525">
    <span style="font-size:13px;color:#888">${label}</span>
    <span style="font-size:14px;font-weight:600;color:${color}">${value}</span>
  </div>`;
}

function saveInvestment(){
  if(!invResult)return;
  if(!D.investments)D.investments=[];
  D.investments.push({...invResult,id:Date.now(),date:todayStr});
  invResult=null;
  invForm={name:"",initial:"",monthlyRev:"",monthlyCost:"",growth:""};
  saveRemote();render();
}

function savedInvCard(inv,i){
  const stars=inv.score>0?"⭐".repeat(inv.score):"💸";
  return `<div class="card" style="margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(inv.name)}</div>
        <div style="font-size:11px;color:#888;margin-top:2px">${inv.date} · ${fmt(inv.initial)} invested</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:12px">${stars}</div>
        <div style="font-size:14px;font-weight:700;color:${inv.scoreColor}">${inv.annualROI.toFixed(1)}%</div>
      </div>
      <button class="del-btn" onclick="delInvestment(${i})">✕</button>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid #0C1525;font-size:12px;color:#888">
      <span>Cash flow <span style="color:${inv.monthlyProfit>=0?"#3d9e75":"#E05C5C"};font-weight:600">${fmt(inv.monthlyProfit)}/mo</span></span>
      <span>Payback <span style="color:#e8e8e8;font-weight:600">${inv.paybackMonths===Infinity?"Never":inv.paybackMonths<=24?inv.paybackMonths+"mo":(inv.paybackMonths/12).toFixed(1)+"yr"}</span></span>
      <span>3yr <span style="color:#e8e8e8;font-weight:600">${fmt(inv.years[2].cumulative)}</span></span>
    </div>
  </div>`;
}

function delInvestment(i){D.investments.splice(i,1);saveRemote();render();}
