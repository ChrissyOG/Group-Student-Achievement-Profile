
const KEY='au-profile-v3',SKEY='au-session-v3';
const names=new Proxy({},{get:(_,k)=>(S.users.find(u=>u.id===k)||{}).name||'Unknown student'});
const cats=['Academic','Leadership','Internship','Research','Competition','Community','Club or society','Professional development'];
const purposes=['Master’s scholarship','Employment reference','Internship application','Postgraduate application','Leadership opportunity'];
const stepNames={requested:'Requested',drafting:'In progress',sent:'Sent'};
const icon={verified:'✓',sent:'✓',pending:'…',requested:'…',rejected:'✕',declined:'✕',drafting:'✎'};
const label={verified:'Verified',pending:'Awaiting endorsement',rejected:'Not endorsed',requested:'Requested',drafting:'In progress',sent:'Sent',declined:'Declined'};
function D(n){const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function seed(){const H=36e5,n=Date.now();return{nid:100,share:{s1:true,s2:true,s3:false},
users:[{id:'s1',role:'student',name:'Rudo Chikwanha',login:'250601',pw:'student123'},{id:'s2',role:'student',name:'Tafara Ncube',login:'250602',pw:'student123'},{id:'s3',role:'student',name:'Farai Dube',login:'250603',pw:'student123'},{id:'l1',role:'lecturer',name:'Ms Mafu',login:'mafu@africau.edu',pw:'lecturer123'},{id:'l2',role:'lecturer',name:'Dr Banda',login:'banda@africau.edu',pw:'lecturer123'},{id:'l3',role:'lecturer',name:'Prof Moyo',login:'moyo@africau.edu',pw:'lecturer123'}],drafts:{},
ach:[
{id:1,sid:'s1',cat:'Academic',title:'Dean’s list, Semester 1',date:'2025-06-20',ev:'Registry result slip',status:'verified',by:'Registry',note:''},
{id:2,sid:'s1',cat:'Leadership',title:'Class representative, Software Engineering Year 2',date:'2026-02-10',ev:'Department appointment letter',status:'verified',by:'Ms Mafu',note:''},
{id:3,sid:'s1',cat:'Competition',title:'Inter-university hackathon, 2nd place',date:'2026-05-14',ev:'Certificate',status:'verified',by:'Event organiser',note:''},
{id:4,sid:'s1',cat:'Club or society',title:'Software Engineering Society, events lead',date:'2026-03-01',ev:'Club patron can confirm',status:'pending',by:'',note:''},
{id:5,sid:'s1',cat:'Internship',title:'Intern, Mutare Tech Hub (8 weeks)',date:'2026-01-30',ev:'Supervisor letter attached',status:'pending',by:'',note:''},
{id:6,sid:'s2',cat:'Research',title:'Poster presented at AU Research Day',date:'2026-04-18',ev:'Programme listing',status:'pending',by:'',note:''},
{id:7,sid:'s2',cat:'Leadership',title:'Student council treasurer',date:'2025-09-01',ev:'Council minutes',status:'verified',by:'Student Affairs',note:''},
{id:8,sid:'s3',cat:'Community',title:'Volunteer, campus literacy outreach',date:'2026-06-12',ev:'Coordinator email',status:'pending',by:'',note:''}],
reqs:[
{id:1,sid:'s2',lid:'l1',purpose:'Master’s scholarship',due:D(5),status:'requested',note:''},
{id:2,sid:'s3',lid:'l2',purpose:'Employment reference',due:D(12),status:'requested',note:''},
{id:3,sid:'s1',lid:'l1',purpose:'Postgraduate application',due:D(20),status:'requested',note:''}],
log:[{sid:'s1',t:'Ms Mafu endorsed “Class representative, Software Engineering Year 2”.',at:n-30*H},{sid:'s1',t:'You requested a recommendation for a postgraduate application.',at:n-5*H}]}}
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(_){}
if(!S||!S.ach)S=seed();
else{seed().users.forEach(u=>{if(!S.users.some(x=>x.id===u.id))S.users.push(u)});S.reqs.forEach(r=>{r.lid=r.lid||'l1'})}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(_){}};
let me=null,stab='ach',auth='in',authErr='',authVal={},ltab='requests',rf='all',sf='all',open=null,modal=null;
const user=()=>S.users.find(u=>u.id===me);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=d=>new Date(d+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const fmtAt=t=>new Date(t).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const left=d=>Math.round((new Date(d+'T00:00')-new Date().setHours(0,0,0,0))/864e5);
const badge=s=>`<span class="badge ${s}"><span aria-hidden="true">${icon[s]}</span>${label[s]}</span>`;
const log=(sid,t,lid,lt)=>{S.log.unshift({sid,t,lid,lt,at:Date.now()});S.log=S.log.slice(0,40)};
let tt;function say(m){const t=document.getElementById('toast');t.textContent=m;clearTimeout(tt);tt=setTimeout(()=>t.textContent='',3200)}
function dueText(r){if(r.status==='sent'||r.status==='declined')return 'Was due '+fmt(r.due);const n=left(r.due);return n<0?`<span class="late">Overdue by ${-n} day${n===-1?'':'s'}</span>`:n===0?'<span class="late">Due today</span>':`Due ${fmt(r.due)} (${n} day${n===1?'':'s'})`}
async function copy(t){try{await navigator.clipboard.writeText(t);say('Copied')}catch(_){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');say('Copied')}catch(__){say('Copy isn’t available here')}x.remove()}}
const verified=sid=>S.ach.filter(a=>a.sid===sid&&a.status==='verified');
const shareUrl=sid=>'https://verify.au.example/p/'+names[sid].toLowerCase().replace(/ /g,'-');

function achItem(a,extra=''){
const n=a.note?`<p class="note"><b>${a.status==='rejected'?'Reason':'Note'}:</b> ${esc(a.note)}</p>`:'';
const by=a.status==='verified'&&a.by?` · Endorsed by ${esc(a.by)}`:'';
return `<li class="item"><div class="row"><h3>${esc(a.title)}</h3>${badge(a.status)}</div><p class="meta">${esc(a.cat)} · ${fmt(a.date)} · Evidence: ${esc(a.ev||'none given')}${by}</p>${n}${extra}</li>`}
const feedHTML=rows=>`<ul class="list feed">${rows.map(l=>`<li class="item"><p class="meta" style="margin:0">${fmtAt(l.at)}</p>${esc(l.t)}</li>`).join('')||'<li class="empty">No activity yet.</li>'}</ul>`;

function student(){
const u=user(),mine=S.ach.filter(a=>a.sid===me),c=s=>mine.filter(x=>x.status===s).length;
const myReqs=S.reqs.filter(r=>r.sid===me),on=S.share[me];
const ini=u.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const head=`<div class="profile"><div class="avatar" aria-hidden="true">${esc(ini)}</div><div><h1>${esc(u.name)}</h1><p class="sub" style="margin:0">BSc Software Engineering · Student ID ${esc(u.login)}</p><p class="sub" style="margin:.3rem 0 0"><b>${c('verified')}</b> verified · <b>${c('pending')}</b> awaiting endorsement · <b>${myReqs.length}</b> request${myReqs.length===1?'':'s'}</p></div></div>`;
let body='';
if(stab==='ach'){
const shown=sf==='all'?mine:mine.filter(a=>a.status===sf);
const fl=[['all','All'],['verified','Verified'],['pending','Awaiting'],['rejected','Not endorsed']];
const itm=a=>achItem(a,a.status==='pending'?`<div class="actions"><button class="btn" data-act="withdraw" data-id="${a.id}">Withdraw claim</button></div>`:a.status==='rejected'?`<div class="actions"><button class="btn primary" data-act="resubmit" data-id="${a.id}">Resubmit for endorsement</button><button class="btn" data-act="withdraw" data-id="${a.id}">Remove</button></div>`:'');
const groups=cats.map(cn=>[cn,shown.filter(a=>a.cat===cn).sort((x,y)=>x.date<y.date?1:-1)]).filter(g=>g[1].length);
body=`<section class="panel hl" aria-labelledby="h-a"><h2 id="h-a">My achievements</h2>
<div class="tabs" role="tablist" aria-label="Filter achievements">${fl.map(f=>`<button role="tab" aria-selected="${sf===f[0]}" data-act="sf" data-v="${f[0]}">${f[1]}</button>`).join('')}</div>
${groups.map(g=>`<h3 class="cat">${g[0]}<span class="count">${g[1].length}</span></h3><ul class="list timeline">${g[1].map(itm).join('')}</ul>`).join('')||(mine.length?'<div class="empty">Nothing matches this filter.</div>':'<div class="empty"><p>No achievements yet. Record your first one so a lecturer can endorse it.</p><button class="btn main" data-act="snav" data-v="add">Add an achievement</button></div>')}</section>`}
else if(stab==='add'){
body=`<section class="panel" aria-labelledby="h-add"><h2 id="h-add">Add an achievement</h2><p class="sub">A lecturer, supervisor or club patron must endorse it before it counts as verified. You can withdraw a claim but not edit it.</p>
<form id="addForm"><label for="c">Category</label><select id="c" name="cat">${cats.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="t">What did you do?</label><input id="t" name="title" type="text" required maxlength="120">
<label for="d">Date</label><input id="d" name="date" type="date" required max="${D(0)}">
<label for="e">Evidence or who can confirm it</label><input id="e" name="ev" type="text" maxlength="120">
<p></p><button class="btn main" type="submit">Submit for endorsement</button></form></section>`}
else if(stab==='req'){
body=`<section class="panel" aria-labelledby="h-r"><h2 id="h-r">Request a recommendation</h2><p class="sub">Choose who you’d like to write it. They see only your verified achievements.</p>
<form id="reqForm"><label for="lc">Lecturer</label><select id="lc" name="lid">${S.users.filter(x=>x.role==='lecturer').map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
<label for="p">What is it for?</label><select id="p" name="purpose">${purposes.map(x=>`<option>${x}</option>`).join('')}</select>
<label for="rd">Needed by</label><input id="rd" name="due" type="date" required min="${D(0)}">
<p></p><button class="btn main" type="submit">Send request</button></form></section>
<section class="panel" style="margin-top:1.5rem" aria-labelledby="h-mr"><h2 id="h-mr">My requests</h2><ul class="list">${myReqs.map(r=>`<li class="item"><div class="row"><h3>${esc(r.purpose)}</h3>${badge(r.status)}</div><p class="meta">${dueText(r)} · Lecturer: ${esc(names[r.lid])}</p>${r.status==='declined'?`<p class="note"><b>Reason:</b> ${esc(r.note)}</p>`:`<ol class="stepper" aria-label="Progress">${Object.keys(stepNames).map((k,i)=>{const cur=Object.keys(stepNames).indexOf(r.status),st=r.status==='sent'||i<cur?'done':i===cur?'now':'';return `<li class="${st}"${st==='now'?' aria-current="step"':''}>${stepNames[k]}</li>`}).join('')}</ol>`}${r.status==='sent'?'':`<div class="actions" style="margin-top:.6rem"><button class="btn" data-act="cancelreq" data-id="${r.id}">${r.status==='declined'?'Remove':'Cancel request'}</button></div>`}</li>`).join('')||'<li class="empty">No requests yet. Use the form above to ask a lecturer.</li>'}</ul></section>`}
else if(stab==='priv'){
body=`<section class="panel" aria-labelledby="h-p"><h2 id="h-p">Privacy and sharing</h2><div class="toggle"><input type="checkbox" id="sh" data-act="share" ${on?'checked':''}><label for="sh">Let employers and scholarship providers check my verified achievements with a link I share.</label></div>
<p class="meta" style="margin-top:.6rem">${on?'Sharing is on. Only verified achievements are visible.':'Sharing is off. Only you and your recommendation writers can see your record.'}</p>
<div class="actions"><button class="btn primary" data-act="preview">Preview shared profile</button><button class="btn" data-act="copysum">Copy profile summary</button><button class="btn" data-act="print">Print</button></div></section>`}
else{body=`<section class="panel" aria-labelledby="h-f"><h2 id="h-f">Recent activity</h2>${feedHTML(S.log.filter(l=>l.sid===me).slice(0,10))}</section>`}
return head+body}

function draftFor(r){const vs=verified(r.sid);
return `Dear Selection Committee,\n\nI am pleased to support ${names[r.sid]}’s application for a ${r.purpose.toLowerCase()}.\n\nThe university’s verified record shows the following:\n${vs.map(a=>`- ${a.title} (${a.cat}, ${fmt(a.date)})`).join('\n')||'- No verified achievements yet.'}\n\n[Add your own observations of ${names[r.sid].split(' ')[0]}’s work and conduct here.]\n\nYours faithfully,\n${user().name}\nDepartment of AI, Software Engineering and Computer Science\nAfrica University`}

function lecturer(){
const RQ=S.reqs.filter(r=>r.lid===me),pend=S.ach.filter(a=>a.status==='pending'),openR=RQ.filter(r=>r.status==='requested'||r.status==='drafting');
const soon=openR.filter(r=>left(r.due)<=7).length;
let body='';
if(ltab==='requests'){
const list=RQ.filter(r=>rf==='all'||r.status===rf).sort((a,b)=>a.due<b.due?-1:1);
const sel=RQ.find(r=>r.id===open);
body=`<div style="max-width:260px"><label for="rf" style="margin-top:0">Show</label><select id="rf" data-act="rf">${[['all','All requests'],['requested','Requested'],['drafting','In progress'],['sent','Sent'],['declined','Declined']].map(o=>`<option value="${o[0]}" ${rf===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
<ul class="list" style="margin-top:1rem">${list.map(r=>`<li class="item${(r.status==='requested'||r.status==='drafting')&&left(r.due)<=7?' urgent':''}"><div class="row"><div class="who"><span class="avatar sm" aria-hidden="true">${ini(names[r.sid])}</span><div><h3>${names[r.sid]}</h3><p class="meta" style="margin:0">${esc(r.purpose)}</p></div></div>${badge(r.status)}</div><p class="meta" style="margin-top:.5rem"><b>${dueText(r)}</b> · ${verified(r.sid).length} verified achievements on record</p><div class="actions"><button class="btn ${r.status==='requested'||r.status==='drafting'?'primary':''}" data-act="open" data-id="${r.id}">${r.status==='sent'?'View letter':r.status==='declined'?'View record':'Open record and draft'}</button></div></li>`).join('')||'<li class="empty">No requests match this filter.</li>'}</ul>`;
if(sel){const sa=S.ach.filter(a=>a.sid===sel.sid),ro=sel.status==='sent'||sel.status==='declined';
body+=`<section class="panel hl" style="margin-top:1.5rem" aria-labelledby="h-d"><div class="row"><h2 id="h-d" style="border:0;margin:0;padding:0">${names[sel.sid]}: ${esc(sel.purpose)}</h2><button class="btn" data-act="close">Close</button></div>
<div class="grid" style="margin-top:1rem"><div><h3 style="margin-top:0">Record</h3><ul class="list">${sa.map(a=>achItem(a)).join('')}</ul></div>
<div><h3 style="margin-top:0">Draft letter</h3><label for="dr" style="position:absolute;left:-9999px">Letter text</label><textarea id="dr" class="draft" ${ro?'readonly':''}>${esc(S.drafts[sel.id]??draftFor(sel))}</textarea>
<div class="actions" style="margin-top:.6rem"><button class="btn" data-act="copy">Copy text</button>${ro?'':`<button class="btn" data-act="regen" data-id="${sel.id}">Reset draft</button><button class="btn danger" data-act="declineR" data-id="${sel.id}">Decline request</button><button class="btn main" data-act="sent" data-id="${sel.id}">Mark as sent</button>`}</div>
<p class="meta" style="margin-top:.6rem">${sel.status==='declined'?'You declined this request.':'Only verified achievements are added to the draft. Edits save automatically.'}</p></div></div></section>`}
}else if(ltab==='endorse'){
body=`<ul class="list">${pend.map(a=>achItem(a,`<p class="meta who"><span class="avatar sm" aria-hidden="true">${ini(names[a.sid])}</span><span><b>${names[a.sid]}</b> submitted this for endorsement.</span></p><div class="actions"><button class="btn primary" data-act="endorse" data-id="${a.id}">Endorse</button><button class="btn danger" data-act="declineA" data-id="${a.id}">Decline</button></div>`)).join('')||'<li class="empty">Nothing waiting. New claims from students appear here.</li>'}</ul>`}else{body=`<section class="panel" aria-labelledby="h-l"><h2 id="h-l">Recent activity</h2>${feedHTML(S.log.filter(l=>l.lt&&(!l.lid||l.lid===me)).slice(0,10).map(l=>({at:l.at,t:l.lt})))}</section>`}
return `<h1>Lecturer dashboard</h1><p class="sub">${esc(user().name)}, Software Engineering. Sample data for demonstration.</p>
<div class="stats"><div class="stat gold"><b>${openR.length}</b>Open requests</div><div class="stat"><b>${soon}</b>Due within 7 days</div><div class="stat"><b>${pend.length}</b>Claims to endorse</div></div>
${body}`}

function modalHTML(){const m=modal;
if(m.type==='share'){const vs=verified(me);
return `<h2>Shared profile preview</h2><p class="sub">This is what an employer sees when you share your link.</p>`+(S.share[me]?`<div class="panel"><h3 style="margin:0">${names[me]}</h3><p class="meta">BSc Software Engineering, Africa University</p><ul class="list">${vs.map(a=>`<li class="item"><h3>${esc(a.title)}</h3><p class="meta">${esc(a.cat)} · ${fmt(a.date)} · Verified by ${esc(a.by)}</p></li>`).join('')||'<li class="empty">No verified achievements yet.</li>'}</ul></div><p class="meta">${shareUrl(me)}</p><div class="actions"><button class="btn primary" data-act="copylink">Copy link</button><button class="btn" data-act="mclose">Close</button></div>`:`<p class="empty">Sharing is off, so employers can’t see anything. Turn it on under Privacy and sharing.</p><div class="actions"><button class="btn" data-act="mclose">Close</button></div>`)}
const req=m.type==='declineR',a=(req?S.reqs:S.ach).find(x=>x.id===m.id),must=m.type!=='endorse';
const title=m.type==='endorse'?`Endorse “${esc(a.title)}”`:req?`Decline request from ${names[a.sid]}`:`Decline “${esc(a.title)}”`;
return `<h2>${title}</h2><form id="mForm"><label for="note" style="margin-top:0">${must?'Reason for the student (required)':'Note for the student (optional)'}</label><textarea id="note" name="note" style="min-height:110px" maxlength="300" ${must?'required':''}></textarea><div class="actions" style="margin-top:.9rem"><button class="btn ${must?'danger':'main'}" type="submit">${m.type==='endorse'?'Confirm endorsement':'Confirm decline'}</button><button class="btn" type="button" data-act="mclose">Cancel</button></div></form>`}

const dlg=document.createElement('dialog');dlg.id='dlg';document.body.appendChild(dlg);
dlg.addEventListener('close',()=>{modal=null});
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
function render(){const u=user();
document.getElementById('who').innerHTML=u?`<span><b>${esc(u.name)}</b> · ${u.role==='lecturer'?'Lecturer':'Student'}</span><button class="btn" data-act="logout" style="min-height:40px;padding:.3rem .9rem">Sign out</button>`:'';
document.getElementById('subnav').innerHTML=u?navHTML(u):'';
document.getElementById('app').innerHTML=!u?loginPage():u.role==='student'?student():lecturer();
if(u&&modal){dlg.innerHTML=modalHTML();if(!dlg.open)dlg.showModal()}else if(dlg.open)dlg.close();
save()}

document.addEventListener('click',e=>{
const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.act,id=+b.dataset.id;
const ach=()=>S.ach.find(x=>x.id===id),rq=()=>S.reqs.find(x=>x.id===id);
const role=user()?.role;
const LA=['ltab','ltab','open','close','sent','regen','endorse','declineA','declineR','copy'],SA=['snav','sf','withdraw','resubmit','cancelreq','share','preview','copylink','copysum','print'];
if(!role&&!['auth','fill','reset'].includes(a))return;
if((LA.includes(a)&&role!=='lecturer')||(SA.includes(a)&&role!=='student'))return;
if(['open','sent','regen','declineR'].includes(a)&&rq()?.lid!==me)return;
if(a==='auth'){auth=b.dataset.v;authErr=''}
else if(a==='fill'){const s=b.dataset.v==='s';auth='in';authErr='';render();document.querySelector('[name=login]').value=s?'250601':'mafu@africau.edu';document.querySelector('[name=pw]').value=s?'student123':'lecturer123';return}
else if(a==='logout'){me=null;stab='ach';open=null;modal=null;sf='all';ltab='requests';rf='all';auth='in';authErr='';authVal={};try{localStorage.removeItem(SKEY)}catch(_){}say('Signed out')}
else if(a==='share'){S.share[me]=b.checked;say(b.checked?'Sharing turned on':'Sharing turned off')}
else if(a==='sf')sf=b.dataset.v;
else if(a==='snav')stab=b.dataset.v;
else if(a==='ltab'){ltab=b.dataset.v;open=null}
else if(a==='open'){open=id;const r=rq();if(r.status==='requested'){r.status='drafting';log(r.sid,`${user().name} started your recommendation letter.`,me,`You started the letter for ${names[r.sid]}.`)}}
else if(a==='close')open=null;
else if(a==='withdraw'){S.ach=S.ach.filter(x=>!(x.id===id&&x.sid===me));say('Claim removed')}
else if(a==='resubmit'){const x=ach();if(x.sid!==me)return;x.status='pending';x.note='';log(x.sid,`You resubmitted “${x.title}” for endorsement.`,null,`${names[x.sid]} resubmitted “${x.title}”.`);say('Resubmitted for endorsement')}
else if(a==='cancelreq'){S.reqs=S.reqs.filter(x=>!(x.id===id&&x.sid===me));if(open===id)open=null;say('Request removed')}
else if(a==='preview')modal={type:'share'};
else if(a==='copylink'){copy(shareUrl(me));return}
else if(a==='copysum'){copy(`${names[me]}, BSc Software Engineering, Africa University\nVerified achievements:\n`+(verified(me).map(x=>`- ${x.title} (${x.cat}, ${fmt(x.date)}), verified by ${x.by}`).join('\n')||'- None yet'));return}
else if(a==='print'){try{window.print()}catch(_){say('Printing isn’t available here')}return}
else if(a==='copy'){copy(document.getElementById('dr').value);return}
else if(a==='regen'){delete S.drafts[id];say('Draft reset to the verified record')}
else if(a==='sent'){const r=rq();r.status='sent';S.drafts[id]=document.getElementById('dr').value;log(r.sid,`${user().name} sent your recommendation for a ${r.purpose.toLowerCase()}.`,me,`You sent the letter for ${names[r.sid]}.`);say('Marked as sent. The student can see this.')}
else if(a==='endorse'){const x=ach();x.status='verified';x.by=user().name;x.note='';log(x.sid,`${user().name} endorsed “${x.title}”.`,me,`You endorsed “${x.title}” for ${names[x.sid]}.`);say('Endorsed “'+x.title+'”')}
else if(a==='declineA')modal={type:'declineA',id};
else if(a==='declineR')modal={type:'declineR',id};
else if(a==='mclose'){modal=null;dlg.close();return}
else if(a==='reset'){S=seed();me=null;open=null;modal=null;authErr='';try{localStorage.removeItem(SKEY)}catch(_){}hashUsers().then(()=>{render();say('Demo data reset')});return}
render();
if(a==='open')document.getElementById('h-d')?.scrollIntoView({block:'start'})});

document.addEventListener('change',e=>{const a=e.target.dataset?.act;
if(a==='rf'){rf=e.target.value;render()}});

document.addEventListener('submit',e=>{e.preventDefault();const id=e.target.id,f=new FormData(e.target);
if(id==='loginForm'){doLogin(f);return}
if(id==='regForm'){doReg(f);return}
if(!user())return;
if(id==='addForm'){S.ach.push({id:S.nid++,sid:me,cat:f.get('cat'),title:f.get('title').trim(),date:f.get('date'),ev:f.get('ev').trim(),status:'pending',by:'',note:''});log(me,`You submitted “${f.get('title').trim()}” for endorsement.`,null,`${names[me]} submitted “${f.get('title').trim()}” for endorsement.`);stab='ach';say('Submitted for endorsement')}
if(id==='reqForm'){const lec=S.users.find(u=>u.id===f.get('lid')&&u.role==='lecturer');if(!lec)return;
S.reqs.push({id:S.nid++,sid:me,lid:lec.id,purpose:f.get('purpose'),due:f.get('due'),status:'requested',note:''});
log(me,`You requested a recommendation from ${lec.name} for a ${f.get('purpose').toLowerCase()}.`,lec.id,`${names[me]} requested a recommendation (${f.get('purpose').toLowerCase()}).`);say('Request sent to '+lec.name)}
if(id==='mForm'){const note=f.get('note').trim(),m=modal;
if(m.type==='declineR'){const r=S.reqs.find(x=>x.id===m.id);if(r.lid===me){r.status='declined';r.note=note;log(r.sid,`${user().name} declined your request: ${note}`,me,`You declined ${names[r.sid]}’s request.`);say('Request declined')}}
else{const x=S.ach.find(y=>y.id===m.id);if(m.type==='endorse'){x.status='verified';x.by=user().name;x.note=note;log(x.sid,`${user().name} endorsed “${x.title}”.`,me,`You endorsed “${x.title}” for ${names[x.sid]}.`);say('Achievement endorsed')}else{x.status='rejected';x.note=note;log(x.sid,`${user().name} didn’t endorse “${x.title}”: ${note}`,me,`You declined “${x.title}” for ${names[x.sid]}.`);say('Achievement declined')}}
modal=null;dlg.close()}
render()});

document.addEventListener('input',e=>{if(e.target.classList.contains('draft')){S.drafts[open]=e.target.value;save()}});

const H=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(_){return s}};
async function hashUsers(){for(const u of S.users)if(!u.h){u.h=await H(u.pw+':'+u.id);delete u.pw}}
function signIn(u){me=u.id;stab='ach';sf='all';ltab='requests';rf='all';open=null;authErr='';authVal={};try{localStorage.setItem(SKEY,me)}catch(_){}render();say('Signed in as '+u.name)}
async function doLogin(f){const k=f.get('login').trim().toLowerCase(),u=S.users.find(x=>x.login.toLowerCase()===k);
if(!u||(await H(f.get('pw')+':'+u.id))!==u.h){authVal={login:f.get('login')};authErr='Incorrect ID or password. Check both and try again.';render();return}
signIn(u)}
async function doReg(f){const name=f.get('name').trim(),sid=f.get('sid').trim(),pw=f.get('pw');authVal={name,sid};
if(!/^\d{6}$/.test(sid))authErr='Enter your 6-digit student ID.';
else if(S.users.some(x=>x.login===sid))authErr='An account with this student ID already exists. Sign in instead.';
else if(pw.length<8)authErr='Use a password with at least 8 characters.';
else if(pw!==f.get('pw2'))authErr='The two passwords don’t match.';
else authErr='';
if(authErr){render();return}
const u={id:'u'+S.nid++,role:'student',name,login:sid};u.h=await H(pw+':'+u.id);S.users.push(u);S.share[u.id]=false;signIn(u)}
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
<section class="panel" style="margin-top:1.25rem"><h2>Demo accounts</h2><p class="sub">Sample accounts for trying the prototype. Accounts and data stay in this browser only, so don’t enter a real password.</p>
<ul class="list"><li class="item"><div class="row"><span><b>Student:</b> 250601 / student123</span><button class="btn" data-act="fill" data-v="s">Fill in</button></div></li>
<li class="item"><div class="row"><span><span><b>Lecturer:</b> mafu@africau.edu / lecturer123<br><span class="meta">Also banda@africau.edu and moyo@africau.edu, same password.</span></span></span><button class="btn" data-act="fill" data-v="l">Fill in</button></div></li></ul></section></div>`}
(async()=>{await hashUsers();try{const m=localStorage.getItem(SKEY);if(m&&S.users.some(u=>u.id===m))me=m}catch(_){}render()})();

function navHTML(u){const st=u.role==='student';
const items=st?[['ach','Achievements'],['add','Add achievement'],['req','Request recommendation'],['priv','Privacy'],['act','Activity']]:[['requests',`Requests (${S.reqs.filter(r=>r.lid===me).length})`],['endorse',`To endorse (${S.ach.filter(a=>a.status==='pending').length})`],['act','Activity']];
const cur=st?stab:ltab,act=st?'snav':'ltab';
return `<div class="subbar" role="tablist" aria-label="Sections">${items.map(i=>`<button role="tab" aria-selected="${cur===i[0]}" data-act="${act}" data-v="${i[0]}">${i[1]}</button>`).join('')}</div>`}

function ini(n){return n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
