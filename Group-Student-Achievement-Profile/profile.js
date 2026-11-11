// ---- Supabase config: Project Settings > API (URL + anon public key) ----
const SUPABASE_URL='https://xkyeuongogbvmpsvhehg.supabase.co',SUPABASE_ANON_KEY='sb_publishable_FiDoWnO2q4XG9tlYQ7jrUw_K1tnR34k';
// Students sign in with their 6-digit ID; it is mapped to this email domain for Supabase Auth.
const STUDENT_EMAIL_DOMAIN='students.africau.edu';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const names=new Proxy({},{get:(_,k)=>(S.users.find(u=>u.id===k)||{}).name||'Unknown student'});
const cats=['Academic','Leadership','Internship','Research','Competition','Community','Club or society','Professional development','Sports','Volunteering','Scholarship','Conference','Certification','Debate and public speaking','Entrepreneurship','Technical work','Pre-university'];
const purposes=['Master’s scholarship','Employment reference','Internship application','Postgraduate application','Leadership opportunity'];
const stepNames={requested:'Requested',drafting:'In progress',sent:'Sent'};
const icon={verified:'✓',sent:'✓',pending:'…',requested:'…',rejected:'✕',declined:'✕',drafting:'✎'};
const label={verified:'Verified',pending:'Awaiting endorsement',rejected:'Not endorsed',requested:'Requested',drafting:'In progress',sent:'Sent',declined:'Declined'};
function D(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
let S={users:[],ach:[],reqs:[],log:[],drafts:{},skills:[],results:[],views:[]};
const nameOf=id=>(S.users.find(u=>u.id===id)||{}).name||'';
async function load(){
const [p,a,r,l,ac,sk,rs,pv]=await Promise.all([
sb.from('profiles').select('id,full_name,student_id,role,share_enabled,share_token,phone,backup_email,share_expires_at'),
sb.from('achievements').select('*').order('achieved_on',{ascending:false}),
sb.from('recommendation_requests').select('*'),
sb.from('letters').select('request_id,body'),
sb.from('activity').select('student_text,lecturer_text,created_at').order('created_at',{ascending:false}).limit(40),
sb.from('skills').select('*').order('kind'),sb.from('results').select('*').order('semester'),sb.from('profile_views').select('viewed_at').order('viewed_at',{ascending:false}).limit(20)]);
const bad=[p,a,r,l,ac,sk,rs,pv].find(x=>x.error);if(bad)throw bad.error;
S.users=p.data.map(x=>({id:x.id,role:x.role,name:x.full_name,login:x.student_id||'',share:x.share_enabled,token:x.share_token,phone:x.phone||'',backup:x.backup_email||'',exp:x.share_expires_at}));
S.ach=a.data.map(x=>({id:x.id,sid:x.student_id,cat:x.category,title:x.title,date:x.achieved_on,lid:x.lecturer_id,lvl:x.significance,file:x.evidence_path,shared:x.shared,ev:x.evidence||'',status:x.status,by:nameOf(x.endorsed_by),note:x.note||''}));
S.reqs=r.data.map(x=>({id:x.id,sid:x.student_id,lid:x.lecturer_id,purpose:x.purpose,due:x.due_on,status:x.status,note:x.decline_reason||'',kp:x.key_points||''}));
S.drafts=Object.fromEntries(l.data.map(x=>[x.request_id,x.body]));
S.skills=sk.data;S.results=rs.data;S.views=pv.data.map(x=>x.viewed_at);
const lec=user()?.role==='lecturer';
S.log=ac.data.map(x=>({t:lec?x.lecturer_text:x.student_text,at:x.created_at})).filter(x=>x.t)}
const fail=e=>say(e?.message?'Something went wrong: '+e.message:'Something went wrong. Try again.');
async function act(p,ok){const{error}=await p;if(error){fail(error);return false}await load();if(ok)say(ok);return true}
let dt,pd=null;
function queueDraft(id,body){pd={id,body};clearTimeout(dt);dt=setTimeout(flushDraft,800)}
async function flushDraft(){clearTimeout(dt);if(!pd)return;const d=pd;pd=null;const{error}=await sb.from('letters').upsert({request_id:d.id,body:d.body,updated_at:new Date().toISOString()});if(error)say('Draft couldn’t be saved: '+error.message)}
let ready=false,pub=null,me=null,stab='ach',auth='in',authErr='',authVal={},ltab='requests',rf='all',sf='all',open=null,modal=null;
const user=()=>S.users.find(u=>u.id===me);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=d=>new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const fmtAt=t=>new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const left=d=>Math.round((new Date(d+'T00:00')-new Date().setHours(0,0,0,0))/864e5);
const badge=s=>`<span class="badge ${s}"><span aria-hidden="true">${icon[s]}</span>${label[s]}</span>`;
let tt;function say(m){const t=document.getElementById('toast');t.textContent=m;clearTimeout(tt);tt=setTimeout(()=>t.textContent='',3200)}
function dueText(r){if(r.status==='sent'||r.status==='declined')return 'Was due '+fmt(r.due);const n=left(r.due);return n<0?`<span class="late">Overdue by ${-n} day${n===-1?'':'s'}</span>`:n===0?'<span class="late">Due today</span>':`Due ${fmt(r.due)} (${n} day${n===1?'':'s'})`}
async function copy(t){try{await navigator.clipboard.writeText(t);say('Copied')}catch(_){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');say('Copied')}catch(__){say('Copy isn’t available here')}x.remove()}}
const verified=sid=>S.ach.filter(a=>a.sid===sid&&a.status==='verified');
const shareUrl=()=>location.href.split('#')[0].split('?')[0]+'?p='+user().token;

function achItem(a,extra=''){
const n=a.note?`<p class="note"><b>${a.status==='rejected'?'Reason':'Note'}:</b> ${esc(a.note)}</p>`:'';
const by=a.status==='verified'&&a.by?` · Endorsed by ${esc(a.by)}`:a.status==='pending'&&a.lid?` · Sent to ${esc(nameOf(a.lid))}`:'';
const lv=a.lvl?` · ${a.lvl[0].toUpperCase()+a.lvl.slice(1)} recognition`:'',fl=a.file?` · <button class="btn" data-act="file" data-v="${esc(a.file)}" style="min-height:32px;padding:.1rem .6rem">View file</button>`:'';
return `<li class="item"><div class="row"><h3>${esc(a.title)}</h3>${badge(a.status)}</div><p class="meta">${esc(a.cat)} · ${fmt(a.date)} · Evidence: ${esc(a.ev||'none given')}${by}${lv}${fl}</p>${n}${extra}</li>`}
const feedHTML=rows=>`<ul class="list feed">${rows.map(l=>`<li class="item"><p class="meta" style="margin:0">${fmtAt(l.at)}</p>${esc(l.t)}</li>`).join('')||'<li class="empty">No activity yet.</li>'}</ul>`;

function student(){
const u=user(),mine=S.ach.filter(a=>a.sid===me),c=s=>mine.filter(x=>x.status===s).length;
const myReqs=S.reqs.filter(r=>r.sid===me),on=u.share;
const ini=u.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const head=`<div class="profile"><div class="avatar" aria-hidden="true">${esc(ini)}</div><div><h1>${esc(u.name)}</h1><p class="sub" style="margin:0">BSc Software Engineering · Student ID ${esc(u.login)}</p><p class="sub" style="margin:.3rem 0 0"><b>${c('verified')}</b> verified · <b>${c('pending')}</b> awaiting endorsement · <b>${myReqs.length}</b> request${myReqs.length===1?'':'s'}</p></div></div>`;
let body='';
if(stab==='ach'){
const shown=sf==='all'?mine:mine.filter(a=>a.status===sf);
const fl=[['all','All'],['verified','Verified'],['pending','Awaiting'],['rejected','Not endorsed']];
const itm=a=>achItem(a,a.status==='pending'?`<div class="actions"><button class="btn" data-act="withdraw" data-id="${a.id}">Withdraw claim</button></div>`:a.status==='rejected'?`<div class="actions"><button class="btn primary" data-act="resubmit" data-id="${a.id}">Resubmit for endorsement</button><button class="btn" data-act="withdraw" data-id="${a.id}">Remove</button></div>`:a.status==='verified'?`<div class="actions"><button class="btn" data-act="tshare" data-id="${a.id}" data-v="${a.shared?0:1}">${a.shared?'Hide from shared profile':'Include in shared profile'}</button></div>`:'');
const groups=cats.map(cn=>[cn,shown.filter(a=>a.cat===cn).sort((x,y)=>x.date<y.date?1:-1)]).filter(g=>g[1].length);
body=`<section class="panel hl" aria-labelledby="h-a"><h2 id="h-a">My achievements</h2>
<div class="tabs" role="tablist" aria-label="Filter achievements">${fl.map(f=>`<button role="tab" aria-selected="${sf===f[0]}" data-act="sf" data-v="${f[0]}">${f[1]}</button>`).join('')}</div>
${groups.map(g=>`<h3 class="cat">${g[0]}<span class="count">${g[1].length}</span></h3><ul class="list timeline">${g[1].map(itm).join('')}</ul>`).join('')||(mine.length?'<div class="empty">Nothing matches this filter.</div>':'<div class="empty"><p>No achievements yet. Record your first one so a lecturer can endorse it.</p><button class="btn main" data-act="snav" data-v="add">Add an achievement</button></div>')}</section>`}
else if(stab==='add'){
body=`<section class="panel" aria-labelledby="h-add"><h2 id="h-add">Add an achievement</h2><p class="sub">The lecturer you choose must endorse it before it counts as verified, and only that lecturer sees it until then. You can withdraw a claim but not edit it.</p>
<form id="addForm"><label for="c">Category</label><select id="c" name="cat">${cats.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="al">Lecturer who will endorse it</label><select id="al" name="lid" required>${S.users.filter(x=>x.role==='lecturer').map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
<label for="t">What did you do?</label><input id="t" name="title" type="text" required maxlength="120">
<label for="d">Date</label><input id="d" name="date" type="date" required max="${D(0)}">
<label for="e">Evidence or who can confirm it</label><input id="e" name="ev" type="text" maxlength="120">
<label for="ef">Evidence file (PDF, PNG or JPG, up to 5 MB)</label><input id="ef" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg">
<label for="sg">Level of recognition (for reporting only)</label><select id="sg" name="sg"><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="major">Major</option></select>
<p></p><button class="btn main" type="submit">Submit for endorsement</button></form></section>`}
else if(stab==='req'){
body=`<section class="panel" aria-labelledby="h-r"><h2 id="h-r">Request a recommendation</h2><p class="sub">Choose who you’d like to write it. They see only your verified achievements.</p>
<form id="reqForm"><label for="lc">Lecturer</label><select id="lc" name="lid">${S.users.filter(x=>x.role==='lecturer').map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
<label for="p">What is it for?</label><select id="p" name="purpose">${purposes.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="kp">Key points you’d like included (optional)</label><textarea id="kp" name="kp" maxlength="500" style="min-height:90px"></textarea>
<label for="rd">Needed by</label><input id="rd" name="due" type="date" required min="${D(0)}">
<p></p><button class="btn main" type="submit">Send request</button></form></section>
<section class="panel" style="margin-top:1.5rem" aria-labelledby="h-mr"><h2 id="h-mr">My requests</h2><ul class="list">${myReqs.map(r=>`<li class="item"><div class="row"><h3>${esc(r.purpose)}</h3>${badge(r.status)}</div><p class="meta">${dueText(r)} · Lecturer: ${esc(names[r.lid])}</p>${r.status==='declined'?`<p class="note"><b>Reason:</b> ${esc(r.note)}</p>`:`<ol class="stepper" aria-label="Progress">${Object.keys(stepNames).map((k,i)=>{const cur=Object.keys(stepNames).indexOf(r.status),st=r.status==='sent'||i<cur?'done':i===cur?'now':'';return `<li class="${st}"${st==='now'?' aria-current="step"':''}>${stepNames[k]}</li>`}).join('')}</ol>`}${r.status==='sent'?'':`<div class="actions" style="margin-top:.6rem"><button class="btn" data-act="cancelreq" data-id="${r.id}">${r.status==='declined'?'Remove':'Cancel request'}</button></div>`}</li>`).join('')||'<li class="empty">No requests yet. Use the form above to ask a lecturer.</li>'}</ul></section>`}
else if(stab==='prof'){
body=`<section class="panel" aria-labelledby="h-pf"><h2 id="h-pf">Contact details</h2><p class="sub">Your name, student ID and programme are locked. You can update how people reach you.</p>
<form id="contactForm"><label for="pn">Phone</label><input id="pn" name="phone" type="text" maxlength="30" value="${esc(u.phone)}"><label for="be">Personal backup email (for use after graduation)</label><input id="be" name="backup" type="text" maxlength="120" value="${esc(u.backup)}"><p></p><button class="btn main" type="submit">Save contact details</button></form></section>
<section class="panel" style="margin-top:1.5rem"><h2>Skills</h2><ul class="list">${S.skills.map(x=>`<li class="item"><div class="row"><span><b>${esc(x.name)}</b> · ${x.kind}${x.level?' · '+x.level:''}</span><button class="btn" data-act="delskill" data-id="${x.id}">Remove</button></div></li>`).join('')||'<li class="empty">No skills yet.</li>'}</ul>
<form id="skillForm"><label for="sn">Skill</label><input id="sn" name="name" type="text" required maxlength="60"><label for="sk">Type</label><select id="sk" name="kind"><option>Technical</option><option>Language</option></select><label for="sl">Level</label><select id="sl" name="level"><option>Basic</option><option>Good</option><option>Fluent or expert</option></select><p></p><button class="btn primary" type="submit">Add skill</button></form></section>
<section class="panel" style="margin-top:1.5rem"><h2>CV</h2><p class="sub">Builds a CV from your verified achievements and skills.</p><div class="actions"><button class="btn main" data-act="cv">Generate CV</button></div></section>`}
else if(stab==='res'){body=`<section class="panel" aria-labelledby="h-rs"><h2 id="h-rs">My results</h2><p class="sub">Read-only. Results are imported by the Academic Records Office.</p><ul class="list">${S.results.map(x=>`<li class="item"><div class="row"><span><b>${esc(x.course_code)}</b> ${esc(x.course_name)}<br><span class="meta">${esc(x.semester)}</span></span><b>${esc(x.grade)}</b></div></li>`).join('')||'<li class="empty">No results have been imported yet.</li>'}</ul></section>`}
else if(stab==='priv'){
body=`<section class="panel" aria-labelledby="h-p"><h2 id="h-p">Privacy and sharing</h2><div class="toggle"><input type="checkbox" id="sh" data-act="share" ${on?'checked':''}><label for="sh">Let employers and scholarship providers check my verified achievements with a link I share.</label></div>
<p class="meta" style="margin-top:.6rem">${on?'Sharing is on. Only verified achievements are visible.':'Sharing is off. Only you and your recommendation writers can see your record.'}</p>
<label for="ex">Link expiry</label><select id="ex" data-act="exp"><option value="x">Change expiry…</option><option value="0">Never expires</option><option value="7">In 7 days</option><option value="30">In 30 days</option><option value="90">In 90 days</option></select>${u.exp?`<p class="meta">Current link expires ${fmtAt(u.exp)}.</p>`:''}
<p class="meta"><b>${S.views.length}</b> recent view${S.views.length===1?'':'s'} of your shared profile${S.views[0]?', latest '+fmtAt(S.views[0]):''}.</p>
<div class="actions"><button class="btn primary" data-act="preview">Preview shared profile</button><button class="btn" data-act="newlink">Cancel old link, make a new one</button><button class="btn" data-act="copysum">Copy profile summary</button><button class="btn" data-act="print">Print</button></div></section>`}
else{body=`<section class="panel" aria-labelledby="h-f"><h2 id="h-f">Recent activity</h2>${feedHTML(S.log.slice(0,10))}</section>`}
return head+body}

function draftFor(r){const vs=verified(r.sid);
return `Dear Selection Committee,\n\nI am pleased to support ${names[r.sid]}’s application for a ${r.purpose.toLowerCase()}.\n\nThe university’s verified record shows the following:\n${vs.map(a=>`- ${a.title} (${a.cat}, ${fmt(a.date)})`).join('\n')||'- No verified achievements yet.'}\n\n[Add your own observations of ${names[r.sid].split(' ')[0]}’s work and conduct here.]\n\nYours faithfully,\n${user().name}\nDepartment of AI, Software Engineering and Computer Science\nAfrica University`}

function lecturer(){
const RQ=S.reqs.filter(r=>r.lid===me),pend=S.ach.filter(a=>a.status==='pending'&&a.lid===me),openR=RQ.filter(r=>r.status==='requested'||r.status==='drafting');
const soon=openR.filter(r=>left(r.due)<=7).length;
let body='';
if(ltab==='requests'){
const list=RQ.filter(r=>rf==='all'||r.status===rf).sort((a,b)=>a.due<b.due?-1:1);
const sel=RQ.find(r=>r.id===open);
body=`<div style="max-width:260px"><label for="rf" style="margin-top:0">Show</label><select id="rf" data-act="rf">${[['all','All requests'],['requested','Requested'],['drafting','In progress'],['sent','Sent'],['declined','Declined']].map(o=>`<option value="${o[0]}" ${rf===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
<ul class="list" style="margin-top:1rem">${list.map(r=>`<li class="item${(r.status==='requested'||r.status==='drafting')&&left(r.due)<=7?' urgent':''}"><div class="row"><div class="who"><span class="avatar sm" aria-hidden="true">${ini(names[r.sid])}</span><div><h3>${names[r.sid]}</h3><p class="meta" style="margin:0">${esc(r.purpose)}</p></div></div>${badge(r.status)}</div><p class="meta" style="margin-top:.5rem"><b>${dueText(r)}</b> · ${verified(r.sid).length} verified achievements on record</p><div class="actions"><button class="btn ${r.status==='requested'||r.status==='drafting'?'primary':''}" data-act="open" data-id="${r.id}">${r.status==='sent'?'View letter':r.status==='declined'?'View record':'Open record and draft'}</button></div></li>`).join('')||'<li class="empty">No requests match this filter.</li>'}</ul>`;
if(sel){const sa=S.ach.filter(a=>a.sid===sel.sid&&a.status==='verified'),ro=sel.status==='sent'||sel.status==='declined';
body+=`<section class="panel hl" style="margin-top:1.5rem" aria-labelledby="h-d"><div class="row"><h2 id="h-d" style="border:0;margin:0;padding:0">${names[sel.sid]}: ${esc(sel.purpose)}</h2><button class="btn" data-act="close">Close</button></div>
<div class="grid" style="margin-top:1rem"><div>${sel.kp?`<p class="note"><b>Student’s key points:</b> ${esc(sel.kp)}</p>`:''}<h3 style="margin-top:0">Record</h3><ul class="list">${sa.map(a=>achItem(a)).join('')}</ul></div>
<div><h3 style="margin-top:0">Draft letter</h3><label for="dr" style="position:absolute;left:-9999px">Letter text</label><textarea id="dr" class="draft" ${ro?'readonly':''}>${esc(S.drafts[sel.id]||draftFor(sel))}</textarea>
<div class="actions" style="margin-top:.6rem"><button class="btn" data-act="copy">Copy text</button>${ro?'':`<button class="btn" data-act="regen" data-id="${sel.id}">Reset draft</button><button class="btn danger" data-act="declineR" data-id="${sel.id}">Decline request</button><button class="btn main" data-act="sent" data-id="${sel.id}">Mark as sent</button>`}</div>
<p class="meta" style="margin-top:.6rem">${sel.status==='declined'?'You declined this request.':'Only verified achievements are added to the draft. Edits save automatically.'}</p></div></div></section>`}
}else if(ltab==='endorse'){
body=`<ul class="list">${pend.map(a=>achItem(a,`<p class="meta who"><span class="avatar sm" aria-hidden="true">${ini(names[a.sid])}</span><span><b>${names[a.sid]}</b> submitted this for endorsement.</span></p><div class="actions"><button class="btn primary" data-act="endorse" data-id="${a.id}">Endorse</button><button class="btn danger" data-act="declineA" data-id="${a.id}">Decline</button></div>`)).join('')||'<li class="empty">Nothing waiting. New claims from students appear here.</li>'}</ul>`}else{body=`<section class="panel" aria-labelledby="h-l"><h2 id="h-l">Recent activity</h2>${feedHTML(S.log.slice(0,10))}</section>`}
return `<h1>Lecturer dashboard</h1><p class="sub">${esc(user().name)}, Software Engineering.</p>
<div class="stats"><div class="stat gold"><b>${openR.length}</b>Open requests</div><div class="stat"><b>${soon}</b>Due within 7 days</div><div class="stat"><b>${pend.length}</b>Claims to endorse</div></div>
${body}`}

function modalHTML(){const m=modal;
if(m.type==='share'){const vs=verified(me).filter(a=>a.shared);
return `<h2>Shared profile preview</h2><p class="sub">This is what an employer sees when you share your link.</p>`+(user().share?`<div class="panel"><h3 style="margin:0">${names[me]}</h3><p class="meta">BSc Software Engineering, Africa University</p><ul class="list">${vs.map(a=>`<li class="item"><h3>${esc(a.title)}</h3><p class="meta">${esc(a.cat)} · ${fmt(a.date)} · Verified by ${esc(a.by)}</p></li>`).join('')||'<li class="empty">No verified achievements yet.</li>'}</ul></div><p class="meta">${shareUrl(me)}</p><div class="actions"><button class="btn primary" data-act="copylink">Copy link</button><button class="btn" data-act="mclose">Close</button></div>`:`<p class="empty">Sharing is off, so employers can’t see anything. Turn it on under Privacy and sharing.</p><div class="actions"><button class="btn" data-act="mclose">Close</button></div>`)}
const req=m.type==='declineR',a=(req?S.reqs:S.ach).find(x=>x.id===m.id),must=m.type!=='endorse';
const title=m.type==='endorse'?`Endorse “${esc(a.title)}”`:req?`Decline request from ${names[a.sid]}`:`Decline “${esc(a.title)}”`;
return `<h2>${title}</h2><form id="mForm"><label for="note" style="margin-top:0">${must?'Reason for the student (required)':'Note for the student (optional)'}</label><textarea id="note" name="note" style="min-height:110px" maxlength="300" ${must?'required':''}></textarea><div class="actions" style="margin-top:.9rem"><button class="btn ${must?'danger':'main'}" type="submit">${m.type==='endorse'?'Confirm endorsement':'Confirm decline'}</button><button class="btn" type="button" data-act="mclose">Cancel</button></div></form>`}

const dlg=document.createElement('dialog');dlg.id='dlg';document.body.appendChild(dlg);
dlg.addEventListener('close',()=>{modal=null});
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
function render(){const u=user();
document.getElementById('who').innerHTML=u?`<span><b>${esc(u.name)}</b> · ${u.role==='lecturer'?'Lecturer':'Student'}</span><button class="btn" data-act="logout" style="min-height:40px;padding:.3rem .9rem">Sign out</button>`:'';
document.getElementById('subnav').innerHTML=u?navHTML(u):'';
document.getElementById('app').innerHTML=!ready?'<p class="sub">Loading…</p>':pub?publicHTML():!u?loginPage():u.role==='student'?student():lecturer();
if(u&&modal){dlg.innerHTML=modalHTML();if(!dlg.open)dlg.showModal()}else if(dlg.open)dlg.close()}

document.addEventListener('click',async e=>{
const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.act,id=+b.dataset.id;
const rq=()=>S.reqs.find(x=>x.id===id),role=user()?.role;
const LA=['ltab','open','close','sent','regen','endorse','declineA','declineR','copy'],SA=['snav','sf','withdraw','resubmit','cancelreq','share','preview','tshare','newlink','delskill','cv','copylink','copysum','print'];
if(!role&&a!=='auth')return;
if((LA.includes(a)&&role!=='lecturer')||(SA.includes(a)&&role!=='student'))return;
if(['open','sent','regen','declineR'].includes(a)&&rq()?.lid!==me)return;
try{await flushDraft();
if(a==='auth'){auth=b.dataset.v;authErr=''}
else if(a==='logout'){await sb.auth.signOut();resetUI();say('Signed out')}
else if(a==='share'){const on=b.checked;await act(sb.from('profiles').update({share_enabled:on}).eq('id',me),on?'Sharing turned on':'Sharing turned off')}
else if(a==='sf')sf=b.dataset.v;
else if(a==='snav')stab=b.dataset.v;
else if(a==='ltab'){ltab=b.dataset.v;open=null}
else if(a==='open'){open=id;if(rq().status==='requested')await act(sb.from('recommendation_requests').update({status:'drafting'}).eq('id',id))}
else if(a==='close')open=null;
else if(a==='withdraw')await act(sb.from('achievements').delete().eq('id',id),'Claim removed');
else if(a==='resubmit')await act(sb.from('achievements').update({status:'pending',endorsed_by:null,note:null}).eq('id',id),'Resubmitted for endorsement');
else if(a==='cancelreq'){await act(sb.from('recommendation_requests').delete().eq('id',id),'Request removed');if(open===id)open=null}
else if(a==='tshare')await act(sb.rpc('set_achievement_shared',{p_id:id,p_shared:b.dataset.v==='1'}),b.dataset.v==='1'?'Included in shared profile':'Hidden from shared profile');
else if(a==='newlink')await act(sb.from('profiles').update({share_token:crypto.randomUUID()}).eq('id',me),'New link created. The old link no longer works');
else if(a==='delskill')await act(sb.from('skills').delete().eq('id',id),'Skill removed');
else if(a==='file'){const w=window.open('','_blank');const{data,error}=await sb.storage.from('evidence').createSignedUrl(b.dataset.v,120);if(error){w?.close();throw error}if(w)w.location=data.signedUrl;else say('Allow pop-ups to open the file');return}
else if(a==='cv'){openCV();return}
else if(a==='preview')modal={type:'share'};
else if(a==='copylink'){copy(shareUrl());return}
else if(a==='copysum'){copy(`${names[me]}, BSc Software Engineering, Africa University\nVerified achievements:\n`+(verified(me).map(x=>`- ${x.title} (${x.cat}, ${fmt(x.date)}), verified by ${x.by}`).join('\n')||'- None yet'));return}
else if(a==='print'){try{window.print()}catch(_){say('Printing isn’t available here')}return}
else if(a==='copy'){copy(document.getElementById('dr').value);return}
else if(a==='regen'){S.drafts[id]=draftFor(rq());queueDraft(id,S.drafts[id]);await flushDraft();say('Draft reset to the verified record')}
else if(a==='sent'){const body=document.getElementById('dr').value,now=new Date().toISOString();
const{error}=await sb.from('letters').upsert({request_id:id,body,updated_at:now});if(error)throw error;
await act(sb.from('recommendation_requests').update({status:'sent',sent_at:now}).eq('id',id),'Marked as sent. The student can see this.')}
else if(a==='endorse')await act(sb.from('achievements').update({status:'verified',endorsed_by:me,note:null}).eq('id',id),'Endorsed “'+S.ach.find(x=>x.id===id)?.title+'”');
else if(a==='declineA')modal={type:'declineA',id};
else if(a==='declineR')modal={type:'declineR',id};
else if(a==='mclose'){modal=null;dlg.close();return}
}catch(err){fail(err)}
render();
if(a==='open')document.getElementById('h-d')?.scrollIntoView({block:'start'})});

document.addEventListener('change',async e=>{const a=e.target.dataset?.act;
if(a==='rf'){rf=e.target.value;render()}
else if(a==='exp'&&e.target.value!=='x'){const d=+e.target.value;try{await act(sb.from('profiles').update({share_expires_at:d?new Date(Date.now()+d*864e5).toISOString():null}).eq('id',me),d?'Link will expire in '+d+' days':'Link no longer expires')}catch(err){fail(err)}render()}});

document.addEventListener('submit',async e=>{e.preventDefault();const id=e.target.id,f=new FormData(e.target);
if(id==='loginForm'){doLogin(f);return}
if(id==='regForm'){doReg(f);return}
if(!user())return;
try{
if(id==='addForm'){const title=f.get('title').trim(),date=f.get('date'),file=f.get('file');
if(S.ach.some(x=>x.sid===me&&x.title.toLowerCase()===title.toLowerCase()&&x.date===date)&&!confirm('You already have an achievement with this title and date. Add it anyway?'))return;
let path=null;
if(file&&file.size){if(file.size>5242880){say('That file is over 5 MB.');return}
path=me+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^\w.\-]/g,'_');
const up=await sb.storage.from('evidence').upload(path,file,{contentType:file.type});if(up.error)throw up.error}
if(await act(sb.from('achievements').insert({lecturer_id:f.get('lid'),category:f.get('cat'),title,achieved_on:date,evidence:f.get('ev').trim()||null,significance:f.get('sg'),evidence_path:path}),'Submitted for endorsement'))stab='ach'}
else if(id==='contactForm')await act(sb.from('profiles').update({phone:f.get('phone').trim()||null,backup_email:f.get('backup').trim()||null}).eq('id',me),'Contact details saved');
else if(id==='skillForm'){if(await act(sb.from('skills').insert({name:f.get('name').trim(),kind:f.get('kind'),level:f.get('level')}),'Skill added'))e.target.reset()}
else if(id==='reqForm'){const lec=S.users.find(u=>u.id===f.get('lid')&&u.role==='lecturer');if(!lec)return;
await act(sb.from('recommendation_requests').insert({lecturer_id:lec.id,purpose:f.get('purpose'),due_on:f.get('due'),key_points:f.get('kp').trim()||null}),'Request sent to '+lec.name)}
else if(id==='mForm'){const note=f.get('note').trim(),m=modal;let ok;
if(m.type==='declineR')ok=await act(sb.from('recommendation_requests').update({status:'declined',decline_reason:note}).eq('id',m.id),'Request declined');
else if(m.type==='endorse')ok=await act(sb.from('achievements').update({status:'verified',endorsed_by:me,note:note||null}).eq('id',m.id),'Achievement endorsed');
else ok=await act(sb.from('achievements').update({status:'rejected',endorsed_by:me,note}).eq('id',m.id),'Achievement declined');
if(ok){modal=null;dlg.close()}}
}catch(err){fail(err)}
render()});

document.addEventListener('input',e=>{if(e.target.classList.contains('draft')){S.drafts[open]=e.target.value;queueDraft(open,e.target.value)}});

const toEmail=s=>/^\d{6}$/.test(s)?s+'@'+STUDENT_EMAIL_DOMAIN:s.toLowerCase();
function resetUI(){me=null;stab='ach';open=null;modal=null;sf='all';ltab='requests';rf='all';auth='in';authErr='';authVal={};S={users:[],ach:[],reqs:[],log:[],drafts:{},skills:[],results:[],views:[]}}
async function enter(id,quiet){me=id;
try{await load()}catch(e){await sb.auth.signOut();resetUI();authErr='Couldn’t load your data: '+e.message;render();return}
const u=user();if(!u){await sb.auth.signOut();resetUI();authErr='No profile was found for this account.';render();return}
stab='ach';sf='all';ltab='requests';rf='all';open=null;authErr='';authVal={};render();if(!quiet)say('Signed in as '+u.name)}
async function doLogin(f){const raw=f.get('login').trim();
const{data,error}=await sb.auth.signInWithPassword({email:toEmail(raw),password:f.get('pw')});
if(error){authVal={login:raw};authErr='Incorrect ID or password. Check both and try again.';render();return}
await enter(data.user.id)}
async function doReg(f){const name=f.get('name').trim(),sid=f.get('sid').trim(),pw=f.get('pw');authVal={name,sid};
if(!/^\d{6}$/.test(sid))authErr='Enter your 6-digit student ID.';
else if(pw.length<8)authErr='Use a password with at least 8 characters.';
else if(pw!==f.get('pw2'))authErr='The two passwords don’t match.';
else authErr='';
if(authErr){render();return}
const{data,error}=await sb.auth.signUp({email:toEmail(sid),password:pw,options:{data:{full_name:name,student_id:sid}}});
if(error){authErr=/database error|already|registered/i.test(error.message)?'An account with this student ID already exists. Sign in instead.':error.message;render();return}
if(!data.session){authErr='Account created, but email confirmation is switched on in Supabase, so you can’t sign in yet.';render();return}
await enter(data.user.id)}
function publicHTML(){const d=pub.data;
if(!d)return `<div class="authwrap"><section class="panel"><h2>Profile not available</h2><p class="sub">This link is switched off or doesn’t exist.</p></section></div>`;
return `<section class="panel hl" aria-labelledby="h-pub"><h1 id="h-pub">${esc(d.name)}</h1><p class="meta">Verified achievements, Africa University</p><ul class="list">${(d.achievements||[]).map(a=>`<li class="item"><h3>${esc(a.title)}</h3><p class="meta">${esc(a.category)} · ${fmt(a.date)} · Verified by ${esc(a.verified_by||'the university')}</p></li>`).join('')||'<li class="empty">No verified achievements yet.</li>'}</ul>${(d.skills||[]).length?`<h3 class="cat">Skills</h3><ul class="list">${d.skills.map(x=>`<li class="item">${esc(x.name)} · ${esc(x.kind)}${x.level?' · '+esc(x.level):''}</li>`).join('')}</ul>`:''}</section>`}
function loginPage(){const up=auth==='up',v=authVal;
return `<div class="authwrap"><div class="hero"><div class="mark" aria-hidden="true">AU</div><h1>Keep a verified record of your university achievements</h1><p class="sub">Students record what they’ve done. Lecturers endorse it and write recommendations from the evidence.</p></div>
<section class="panel hl" aria-labelledby="h-au"><h2 id="h-au">${up?'Create a student account':'Sign in'}</h2>
<p class="sub">${up?'Lecturer accounts are set up by the university.':'Students and lecturers sign in here. You’ll see the view for your role.'}</p>
<div class="tabs" role="tablist"><button role="tab" aria-selected="${!up}" data-act="auth" data-v="in">Sign in</button><button role="tab" aria-selected="${up}" data-act="auth" data-v="up">Create student account</button></div>
${authErr?`<p class="note" role="alert" style="border-left-color:var(--bad);color:var(--bad)"><b>${esc(authErr)}</b></p>`:''}
${up?`<form id="regForm"><label for="rn">Full name</label><input id="rn" name="name" type="text" required maxlength="80" autocomplete="name" value="${esc(v.name)}">
<label for="rs">Student ID (6 digits)</label><input id="rs" name="sid" type="text" required inputmode="numeric" maxlength="6" value="${esc(v.sid)}">
<label for="rp">Password (8 characters or more)</label><input id="rp" name="pw" type="password" required minlength="8" autocomplete="new-password">
<label for="rp2">Confirm password</label><input id="rp2" name="pw2" type="password" required autocomplete="new-password">
<p></p><button class="btn main" type="submit">Create account</button></form>`
:`<form id="loginForm"><label for="li">Student ID or staff email</label><input id="li" name="login" type="text" required autocomplete="username" value="${esc(v.login)}">
<label for="lp">Password</label><input id="lp" name="pw" type="password" required autocomplete="current-password">
<p></p><button class="btn main" type="submit">Sign in</button></form>`}
</section>
</div>`}
(async()=>{const tok=new URLSearchParams(location.search).get('p');
if(tok){const{data}=await sb.rpc('get_shared_profile',{p_token:tok});pub={data};ready=true;render();return}
const{data:{session}}=await sb.auth.getSession();ready=true;
if(session)await enter(session.user.id,true);else render()})();

function navHTML(u){const st=u.role==='student';
const items=st?[['ach','Achievements'],['add','Add achievement'],['req','Request recommendation'],['prof','Profile and CV'],['res','Results'],['priv','Privacy'],['act','Activity']]:[['requests',`Requests (${S.reqs.filter(r=>r.lid===me).length})`],['endorse',`To endorse (${S.ach.filter(a=>a.status==='pending'&&a.lid===me).length})`],['act','Activity']];
const cur=st?stab:ltab,act=st?'snav':'ltab';
return `<div class="subbar" role="tablist" aria-label="Sections">${items.map(i=>`<button role="tab" aria-selected="${cur===i[0]}" data-act="${act}" data-v="${i[0]}">${i[1]}</button>`).join('')}</div>`}

function ini(n){return n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}

function openCV(){const u=user(),vs=verified(me).filter(a=>a.shared!==false||true);
const w=window.open('','_blank');if(!w){say('Allow pop-ups to open your CV');return}
w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(u.name)} CV</title><body style="font:16px/1.5 system-ui,Arial,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem"><h1 style="margin:0">${esc(u.name)}</h1><p>BSc Software Engineering, Africa University · Student ID ${esc(u.login)}${u.phone?' · '+esc(u.phone):''}${u.backup?' · '+esc(u.backup):''}</p><h2>Verified achievements</h2><ul>${vs.map(a=>`<li><b>${esc(a.title)}</b> (${esc(a.cat)}, ${fmt(a.date)}). Verified by ${esc(a.by)}</li>`).join('')||'<li>None yet</li>'}</ul><h2>Skills</h2><ul>${S.skills.map(x=>`<li>${esc(x.name)} (${x.kind}${x.level?', '+x.level:''})</li>`).join('')||'<li>None listed</li>'}</ul><p><button onclick="print()">Print or save as PDF</button></p>`);w.document.close()}