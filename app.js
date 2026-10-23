import {firebaseConfig} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,deleteUser} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,collection,query,orderBy,limitToLast,where,onSnapshot,serverTimestamp,writeBatch,arrayUnion} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {initCalls,stopCalls,startCall,toast} from './calls.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const IC={chat:'M4 5h16v11H9l-5 4z',plus:'M12 5v14M5 12h14',user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',phone:'M5 4h4l2 5-2 1a11 11 0 005 5l1-2 5 2v4c-9 1-17-8-15-15z',video:'M3 6h12v12H3zM15 10l6-3v10l-6-3',mic:'M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4',cam:'M3 7h5l2-3h4l2 3h5v13H3zM12 17a3 3 0 100-6 3 3 0 000 6z',sw:'M4 9h13l-3-3M20 15H7l3 3',back:'M15 5l-7 7 7 7',send:'M4 12l16-8-6 16-3-7z',end:'M3 14c5-5 13-5 18 0l-3 3-3-2v-2c-3-1-6-1-6 0v2l-3 2z'};
const ic=n=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[n]}"/></svg>`;
$$('[data-i]').forEach(e=>e.innerHTML=ic(e.dataset.i));
const h=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const tmo=(p,ms=15000)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('Timed out. Check your connection.')),ms))]);
const hm=d=>d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

let auth,db,me,P={},C={},H={},L={},M=[],cur=null,R=null,sel=null,unsubs=[],unM=null,busy=false,signup=true,first=true;
const nm=i=>C[i]?.nick||P[i]?.name||'User';
const cidOf=i=>[me,i].sort().join('_');
const load=on=>$('#load').hidden=!on;
const show=v=>{$('#auth').hidden=v!=='auth';$('#app').hidden=v!=='app'};
function err(t,shake){$('#aerr').textContent=t||'';const f=$('#af');f.classList.remove('shake');$$('#af input').forEach(i=>i.classList.toggle('bad',!!shake));if(shake){void f.offsetWidth;f.classList.add('shake')}}
const msg=x=>x.code==='taken'||x.code==='auth/email-already-in-use'?'This account is already available':({'auth/invalid-credential':'Wrong email or password','auth/user-not-found':'Wrong email or password','auth/wrong-password':'Wrong email or password','auth/network-request-failed':'No connection. Try again','auth/weak-password':'Password is too weak','auth/too-many-requests':'Too many attempts. Wait a bit and retry','auth/invalid-email':'Invalid email'}[x.code]||x.message);

// ---------- auth ----------
if(/PASTE/.test(firebaseConfig.apiKey)){err('Firebase is not configured. Paste your config into js/firebase-config.js')}
else{const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);onAuthStateChanged(auth,u=>{if(busy)return;u?boot(u):show('auth')})}

$('#at').onclick=()=>{signup=!signup;$('#an').hidden=!signup;$('#ap').textContent=signup?'Create your account here':'Welcome back, sign in';$('#at').textContent=signup?'I already have an account':'Create a new account';$('#aw').autocomplete=signup?'new-password':'current-password';err('')};
$('#af').onsubmit=async e=>{
  e.preventDefault();if(busy||!auth)return;err('');
  const n=$('#an').value.trim(),em=$('#ae').value.trim(),pw=$('#aw').value;
  if(!/^\S+@\S+\.\S+$/.test(em)||pw.length<6||(signup&&!/^[A-Za-z0-9_.]{3,20}$/.test(n)))return err('Check your name (3-20 letters, numbers, _ or .), email, and password (min 6)',true);
  busy=true;load(true);
  try{if(signup)await register(n,em,pw);else await tmo(signInWithEmailAndPassword(auth,em,pw));busy=false;$('#aw').value='';await boot(auth.currentUser)}
  catch(x){busy=false;load(false);err(msg(x),true)}
};
async function register(name,email,pw){
  const u=name.toLowerCase(),cred=await tmo(createUserWithEmailAndPassword(auth,email,pw)),uid=cred.user.uid;
  try{
    if((await tmo(getDoc(doc(db,'usernames',u)))).exists())throw {code:'taken'};
    for(let i=0;i<6;i++){
      const n=String(Math.floor(1e7+Math.random()*9e7));
      if((await tmo(getDoc(doc(db,'numbers',n)))).exists())continue;
      const b=writeBatch(db);
      b.set(doc(db,'usernames',u),{uid});b.set(doc(db,'numbers',n),{uid});
      b.set(doc(db,'users',uid),{name,username:u,number:n,about:'Hey there! I am using NEXCHAT',createdAt:serverTimestamp()});
      try{await tmo(b.commit());return}catch(e){if(e.code==='permission-denied'&&i<5)continue;throw e}
    }
    throw new Error('Could not allocate a NEXCHAT number. Try again.');
  }catch(e){await deleteUser(cred.user).catch(()=>{});throw e}
}
async function boot(u){
  try{
    me=u.uid;const s=await tmo(getDoc(doc(db,'users',me)));
    if(!s.exists())throw new Error('Profile not found. Create the account again.');P[me]=s.data();
  }catch(e){load(false);me=null;await signOut(auth);show('auth');return err(e.message,true)}
  load(false);show('app');$('#meav').textContent=P[me].name[0].toUpperCase();
  unsubs.push(onSnapshot(collection(db,'users',me,'contacts'),s=>{C={};s.forEach(d=>C[d.id]=d.data());renderList();if(cur)$('#cn').textContent=nm(cur)},e=>toast(e.message)));
  unsubs.push(onSnapshot(query(collection(db,'chats'),where('members','array-contains',me)),s=>{H={};s.forEach(d=>{const o=d.data().members.find(x=>x!==me);if(o)H[o]=d.data()});renderList()},e=>toast(e.message)));
  initCalls(nm);
}
async function logout(){
  unsubs.splice(0).forEach(u=>u());unM&&unM();unM=null;stopCalls();
  C={};H={};P={};L={};M=[];cur=null;R=null;$('#pf').hidden=true;$('#app').classList.remove('open');$('#cp').classList.add('idle');
  await signOut(auth);me=null;show('auth');err('')
}

// ---------- list ----------
const lastT=i=>H[i]?.lastAt?.toMillis?.()||0;
function renderList(){
  const ids=[...new Set([...Object.keys(C),...Object.keys(H)])];
  ids.forEach(i=>{if(!P[i]&&!L[i]){L[i]=1;getDoc(doc(db,'users',i)).then(s=>{if(s.exists()){P[i]=s.data();renderList()}}).catch(()=>{})}});
  const k=$('#q').value.trim().toLowerCase(),ul=$('#cl');ul.innerHTML='';
  const arr=ids.filter(i=>nm(i).toLowerCase().includes(k)).sort((a,b)=>lastT(b)-lastT(a));
  if(!arr.length){ul.append(h('li','empty',ids.length?'No chats match your search':'Add contact to start chatting'));return}
  arr.forEach(i=>{
    const li=h('li','row'),b=h('div','grow'),at=H[i]?.lastAt?.toDate?.();
    b.append(h('b','',nm(i)),h('small','',H[i]?.lastText||'Say hello'));
    li.append(h('div','av',nm(i)[0].toUpperCase()),b,h('small','',at?hm(at):''));li.onclick=()=>openChat(i);ul.append(li)});
}
$('#q').oninput=renderList;

// ---------- chat ----------
function openChat(id){
  unM&&unM();cur=id;R=null;first=true;M=[];$('#rb').hidden=true;$('#ms').innerHTML='';
  $('#cp').classList.remove('idle');$('#app').classList.add('open');
  $('#cav').textContent=nm(id)[0].toUpperCase();$('#cn').textContent=nm(id);$('#cs').textContent=P[id]?'#'+P[id].number:'';
  unM=onSnapshot(query(collection(db,'chats',cidOf(id),'messages'),orderBy('createdAt'),limitToLast(80)),s=>{
    M=s.docs.map(d=>({id:d.id,...d.data({serverTimestamps:'estimate'}),pending:d.metadata.hasPendingWrites}));renderMsgs()},e=>toast(e.message));
}
function renderMsgs(){
  const el=$('#ms'),near=el.scrollHeight-el.scrollTop-el.clientHeight<140;el.innerHTML='';let last='';
  M.filter(m=>!(m.hiddenFor||[]).includes(me)).forEach(m=>{
    const t=m.createdAt?.toDate?.()||new Date(),day=t.toDateString();
    if(day!==last){last=day;el.append(h('div','day',t.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'})))}
    const b=h('div','msg '+(m.from===me?'out':'in')+(m.deleted?' del':''));
    if(m.replyTo){const q=h('div','quote');q.append(h('b','',m.replyTo.from===me?'You':nm(m.replyTo.from)),h('span','',m.replyTo.text));b.append(q)}
    b.append(h('span','tx',m.text),h('time','',m.pending?'…':hm(t)));attach(b,m);el.append(b)});
  if(near||first){el.scrollTop=el.scrollHeight;first=false}
}
function attach(b,m){
  let x0=0,y0=0,dx=0,lp=0,sw=false;
  b.ontouchstart=e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY;dx=0;sw=false;lp=setTimeout(()=>{lp=0;sw=false;menu(m)},500)};
  b.ontouchmove=e=>{const t=e.touches[0];dx=t.clientX-x0;const dy=Math.abs(t.clientY-y0);if(dy>10||Math.abs(dx)>10)clearTimeout(lp);if(dx>0&&dy<30){sw=true;b.style.transform=`translateX(${Math.min(dx,70)}px)`}};
  b.ontouchend=()=>{clearTimeout(lp);b.style.transform='';if(sw&&dx>55&&!m.deleted)reply(m)};
  b.ontouchcancel=()=>{clearTimeout(lp);b.style.transform=''};
  b.oncontextmenu=e=>{e.preventDefault();menu(m)};
  const k=h('button','dots','⋮');k.setAttribute('aria-label','Message options');k.onclick=e=>{e.stopPropagation();menu(m)};b.append(k);
}
function menu(m){
  sel=m;const del=!!m.deleted;
  $('#mn [data-a=reply]').hidden=del;$('#mn [data-a=copy]').hidden=del;$('#mn [data-a=all]').hidden=del||m.from!==me;$('#mn').hidden=false;
}
const closeMenu=()=>$('#mn').hidden=true;
function reply(m){R={id:m.id,text:m.text.slice(0,120),from:m.from};$('#rb b').textContent=m.from===me?'You':nm(m.from);$('#rb span').textContent=R.text;$('#rb').hidden=false;$('#ci').focus()}
$('#rx').onclick=()=>{R=null;$('#rb').hidden=true};
async function copy(t){
  try{await navigator.clipboard.writeText(t)}
  catch{const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.append(a);a.select();try{document.execCommand('copy')}catch{}a.remove()}
  toast('Message copied');
}
$('#mn').onclick=async e=>{
  const a=e.target.dataset.a;if(e.target.id!=='mn'&&!a)return;closeMenu();if(!a||!sel)return;
  const m=sel,ref=doc(db,'chats',cidOf(cur),'messages',m.id);
  if(a==='reply')reply(m);
  if(a==='copy')copy(m.text);
  if(a==='me')updateDoc(ref,{hiddenFor:arrayUnion(me)}).catch(x=>toast(x.message));
  if(a==='all'&&confirm('Delete this message for everyone?'))updateDoc(ref,{text:'This message has been deleted',deleted:true,replyTo:null}).catch(x=>toast(x.message));
};
$('#cf').onsubmit=e=>{
  e.preventDefault();const t=$('#ci').value.trim();if(!t||!cur)return;
  const id=cur,cid=cidOf(id),rr=R;$('#ci').value='';R=null;$('#rb').hidden=true;
  setDoc(doc(db,'chats',cid),{members:[me,id].sort(),lastText:t.slice(0,60),lastAt:serverTimestamp()},{merge:true}).catch(x=>toast('Send failed: '+x.message));
  addDoc(collection(db,'chats',cid,'messages'),{from:me,text:t,createdAt:serverTimestamp(),replyTo:rr}).catch(x=>{toast('Send failed: '+x.message);if(cur===id&&!$('#ci').value)$('#ci').value=t});
};
$('#back').onclick=()=>{$('#app').classList.remove('open');unM&&unM();unM=null;cur=null;$('#cp').classList.add('idle')};
$('#ca').onclick=()=>cur&&startCall(cur,nm(cur),'audio');
$('#cv').onclick=()=>cur&&startCall(cur,nm(cur),'video');

// ---------- contacts + profile ----------
const openAdd=()=>{$('#aer').textContent='';$('#ad').hidden=false;$('#a1').focus()};
$('#addb').onclick=$('#d2').onclick=openAdd;$('#ac').onclick=()=>$('#ad').hidden=true;
$('#d1').onclick=()=>$('#cl').scrollTo({top:0,behavior:'smooth'});
$('#adf').onsubmit=async e=>{
  e.preventDefault();const n=$('#a1').value.trim(),f=$('#a2').value.trim(),num=$('#a3').value.trim(),er=$('#aer');er.textContent='';
  if(!n||!f||!/^\d{8}$/.test(num))return er.textContent='Fill every field. The NEXCHAT number has 8 digits.';
  if(num===P[me].number)return er.textContent='You cannot add yourself.';
  load(true);
  try{
    const s=await tmo(getDoc(doc(db,'numbers',num)));if(!s.exists())throw new Error('No account has this number.');
    const uid=s.data().uid;if(C[uid])throw new Error('This contact is already saved.');
    const u=await tmo(getDoc(doc(db,'users',uid)));if(u.exists())P[uid]=u.data();
    await tmo(setDoc(doc(db,'users',me,'contacts',uid),{nick:n,full:f,number:num,uid}));
    $('#ad').hidden=true;$('#adf').reset();toast('Contact saved');openChat(uid);
  }catch(x){er.textContent=x.message}finally{load(false)}
};
const openPf=()=>{const p=P[me];$('#pa').textContent=p.name[0].toUpperCase();$('#pn').textContent=p.name;$('#pu').textContent='@'+p.username;$('#pnum').textContent=p.number;$('#pf').hidden=false};
$('#meav').onclick=$('#d3').onclick=openPf;$('#pcl').onclick=()=>$('#pf').hidden=true;
$('#pcp').onclick=()=>copy(P[me].number);$('#plo').onclick=()=>logout().catch(x=>toast(x.message));
$$('.back').forEach(b=>b.addEventListener('click',e=>{if(e.target===b&&b.id!=='mn')b.hidden=true}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.back').forEach(b=>b.hidden=true)});
