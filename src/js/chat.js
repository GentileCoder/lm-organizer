// ── Chat / AI ──
function toggleChat(){
  const body=document.getElementById("chat-body");
  const chevron=document.getElementById("chat-chevron");
  const open=body.classList.toggle("open");
  chevron.textContent=open?"▼":"▲";
}

function openChat(){
  const body=document.getElementById("chat-body");
  const chevron=document.getElementById("chat-chevron");
  if(!body.classList.contains("open")){body.classList.add("open");chevron.textContent="▼";}
}

function clearChat(){
  chatHist=[];
  const wrap=document.getElementById("chat-messages");
  if(wrap)wrap.innerHTML="";
  addBubble("ai","Chat cleared! What can I help you with?");
}

function addBubble(role,text){
  const wrap=document.getElementById("chat-messages");
  if(!wrap)return;
  const d=document.createElement("div");d.className="bubble "+role;d.textContent=text;
  wrap.appendChild(d);wrap.scrollTop=wrap.scrollHeight;
  if(role==="ai")openChat();
}

function buildCtx(){
  const cs=mSumm(now.getFullYear(),now.getMonth());
  return `You are a smart personal organizer and finance assistant. Today is ${todayStr}.
TASKS: ${D.tasks.map(t=>`[${t.done?"done":"pending"}] ${t.text}`).join("; ")||"none"}
NOTES: ${D.notes.map(n=>n.text).join("; ")||"none"}
GOALS: ${D.goals.map(g=>`${g.text} (${g.progress}%)`).join("; ")||"none"}
SHOPPING: ${D.shopping.map(s=>`[${s.done?"bought":"needed"}] ${s.text}`).join("; ")||"none"}
FINANCE: salary=${fmt(D.finance.salary||0)}, this month income=${fmt(cs.inc)}, expenses=${fmt(cs.exp)}, balance=${fmt(cs.bal)}
TRANSACTIONS: ${D.finance.transactions.slice(0,10).map(t=>`[${t.type}] ${t.description} ${fmt(t.amount)} ${t.date} ${t.recurring!=="none"?"↻":""}`).join("; ")||"none"}
Finance actions (end of response):
ACTION_TX:{expense|income}:{amount}:{description}:{category}:{YYYY-MM-DD}:{none|monthly|bimonthly}
ACTION_SALARY:{amount}
ACTION_DEL_TX:{description fragment}
Actions (end of response): ACTION_ADD:{section}:{text}, ACTION_EVENT:{YYYY-MM-DD}:{HH:MM}:{title}:{category}, ACTION_DONE:{section}:{fragment}. Event categories: Work, Personal, Health, Social, Travel, Other. Be concise.`;
}

function parseActs(text){
  const lines=text.split("\n"),clean=[];
  lines.forEach(l=>{
    const a=l.match(/^ACTION_ADD:(\w+):(.+)$/);
    const dn=l.match(/^ACTION_DONE:(\w+):(.+)$/);
    const ev=l.match(/^ACTION_EVENT:([^:]+):([^:]*):([^:]+):?(.*)$/);
    const tx=l.match(/^ACTION_TX:(expense|income):([0-9.]+):([^:]+):([^:]+):([^:]+):([^:]+)$/);
    const sal=l.match(/^ACTION_SALARY:([0-9.]+)$/);
    const dtx=l.match(/^ACTION_DEL_TX:(.+)$/);
    if(a&&D[a[1]]){D[a[1]].push({id:Date.now(),text:a[2].trim(),done:false});}
    else if(dn&&D[dn[1]]){D[dn[1]]=D[dn[1]].map(i=>i.text.toLowerCase().includes(dn[2].toLowerCase())?{...i,done:true}:i);}
    else if(ev){const validCat=EVT_CATS.find(c=>c.name===(ev[4]||"").trim());D.events.push({id:Date.now(),date:ev[1].trim(),time:ev[2].trim(),title:ev[3].trim(),category:validCat?validCat.name:"Other"});D.events.sort((a,b)=>a.date.localeCompare(b.date));}
    else if(tx){D.finance.transactions.push({id:"tx"+Date.now(),type:tx[1],amount:parseFloat(tx[2]),description:tx[3].trim(),category:tx[4].trim(),date:tx[5].trim(),recurring:tx[6].trim()});D.finance.transactions.sort((a,b)=>b.date.localeCompare(a.date));}
    else if(sal){D.finance.salary=parseFloat(sal[1]);}
    else if(dtx){D.finance.transactions=D.finance.transactions.filter(t=>!t.description.toLowerCase().includes(dtx[1].toLowerCase()));}
    else clean.push(l);
  });
  return clean.join("\n").trim();
}

async function sendMsg(){
  const inp=document.getElementById("chat-input");
  const msg=inp.value.trim();if(!msg||aiLoading)return;
  inp.value="";addBubble("user",msg);chatHist.push({role:"user",content:msg});
  aiLoading=true;document.getElementById("send-btn").disabled=true;
  const th=document.createElement("div");th.className="bubble ai thinking";th.textContent="Thinking…";
  document.getElementById("chat-messages").appendChild(th);
  document.getElementById("chat-messages").scrollTop=9999;
  try{
    const k=localStorage.getItem(GKEY)||"";
    if(!k){th.remove();addBubble("ai","Please set your Gemini API key using the 🔑 Key button.");aiLoading=false;document.getElementById("send-btn").disabled=false;return;}
    const contents=[
      {role:"user",parts:[{text:buildCtx()}]},
      {role:"model",parts:[{text:"Understood, I have your current data. How can I help?"}]},
      ...chatHist.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]}))
    ];
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${k}`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents})
    });
    const json=await res.json();
    if(json.error){th.remove();addBubble("ai","Gemini error: "+json.error.message);aiLoading=false;document.getElementById("send-btn").disabled=false;return;}
    const raw=json.candidates?.[0]?.content?.parts?.[0]?.text||"Sorry, couldn't respond.";
    const clean=parseActs(raw);
    th.remove();addBubble("ai",clean);chatHist.push({role:"assistant",content:clean});
    saveRemote();render();
  }catch(e){th.remove();addBubble("ai","Error: "+e.message);}
  aiLoading=false;document.getElementById("send-btn").disabled=false;
}
