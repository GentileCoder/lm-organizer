// ── Review ──
function renderReview(main){
  if(!D.review)D.review=[];
  const rows=D.review.map((item,i)=>`<div class="card">
    <div style="display:flex;align-items:flex-start;gap:10px">
      <div style="flex:1"><div style="font-size:13px;line-height:1.5">${esc(item.text)}</div>
      <div style="font-size:11px;color:#888;margin-top:4px">${item.date}</div></div>
      <button class="del-btn" onclick="delReview(${i})">✕</button>
    </div></div>`).join("");
  const copy=D.review.length?`<button onclick="copyReviews()" style="width:100%;background:#0F1E35;border:1px solid #1C2E4A;color:#888;padding:10px;border-radius:8px;font-size:13px;cursor:pointer;margin-bottom:14px">Copy all ideas to clipboard ↗</button>`:"";
  main.innerHTML=`<div class="card" style="margin-bottom:14px">
    <div style="font-size:13px;font-weight:500;margin-bottom:10px">New idea or improvement</div>
    <textarea id="ri" placeholder="Describe an idea, bug, or feature you'd like added…" style="min-height:80px;margin-bottom:8px"></textarea>
    <button onclick="addReview()" style="width:100%;background:#C9A227;color:#fff;padding:10px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none">Save idea</button>
  </div>${copy}${rows||"<p class='empty'>No ideas yet.</p>"}`;
}
function addReview(){
  const ta=document.getElementById("ri");const t=ta.value.trim();if(!t)return;
  if(!D.review)D.review=[];
  D.review.unshift({id:Date.now(),text:t,date:todayStr});
  ta.value="";saveRemote();render();
}
function delReview(i){D.review.splice(i,1);saveRemote();render();}
function copyReviews(){
  const txt=D.review.map((r,i)=>`${i+1}. [${r.date}] ${r.text}`).join("\n\n");
  navigator.clipboard.writeText(txt).then(()=>addBubble("ai","All ideas copied! Paste them in a new chat.")).catch(()=>addBubble("ai","Copy failed — try manually."));
}
