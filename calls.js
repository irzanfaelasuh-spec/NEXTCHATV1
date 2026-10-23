import {getApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,doc,collection,addDoc,setDoc,updateDoc,getDocs,deleteDoc,onSnapshot,query,where,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {ICE_SERVERS} from './firebase-config.js';
const $=s=>document.querySelector(s);
export const toast=t=>{const e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,3500)};
let db,me,nameOf,pc,stream,id,role,inc,acc,unsubs=[],q=[],out=[],ready=false,tm,tick,t0,incUnsub,facing='user';
const status=t=>$('#cst').textContent=t;
const fmt=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const merr=e=>e.name==='NotAllowedError'?'Camera/microphone permission denied':e.name==='NotFoundError'?'No camera or microphone found':e.message||'Call failed';

export function initCalls(fn){
  nameOf=fn;db=getFirestore(getApp());me=getAuth().currentUser.uid;incUnsub&&incUnsub();
  incUnsub=onSnapshot(query(collection(db,'calls'),where('callee','==',me),where('status','==','ringing')),s=>s.docChanges().forEach(ch=>{
    const d=ch.doc.data();
    if(ch.type==='added'){
      const age=Date.now()-(d.createdAt?.toMillis?.()||Date.now());if(age>60000)return;
      if(id||inc){updateDoc(ch.doc.ref,{status:'rejected'}).catch(()=>{});return}
      inc={id:ch.doc.id,d};$('#inn').textContent=nameOf(d.caller);$('#int').textContent=d.type==='video'?'Incoming video call':'Incoming voice call';$('#inc').hidden=false;
    }
    if(ch.type==='removed'&&inc&&inc.id===ch.doc.id){const n=nameOf(inc.d.caller);inc=null;$('#inc').hidden=true;toast('Missed call from '+n)}
  }),e=>toast('Call listener: '+e.message));
}
export function stopCalls(){incUnsub&&incUnsub();incUnsub=null;inc=null;$('#inc').hidden=true;if(id)done('Call ended')}

async function media(type){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Calls need HTTPS and a supported browser');
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:type==='video'?{facingMode:facing}:false});
}
function makePc(){
  pc=new RTCPeerConnection({iceServers:ICE_SERVERS});
  pc.onicecandidate=e=>{if(e.candidate)send(e.candidate.toJSON())};
  pc.ontrack=e=>{const v=$('#rv');v.srcObject=e.streams[0];v.play().catch(()=>{})};
  pc.onconnectionstatechange=()=>{const s=pc.connectionState;
    if(s==='connected'){t0=Date.now();clearInterval(tick);tick=setInterval(()=>status(fmt(Date.now()-t0)),1000);status('Connected')}
    else if(s==='disconnected')status('Reconnecting…');
    else if(s==='failed')end(acc?'ended':'cancelled','Connection failed. A TURN server is probably needed.')};
  stream.getTracks().forEach(t=>pc.addTrack(t,stream));$('#lv').srcObject=stream;
}
function send(c){ready?addDoc(collection(db,'calls',id,'cands'),{from:me,c:JSON.stringify(c)}).catch(()=>{}):out.push(c)}
async function flush(){for(const c of q.splice(0))await pc.addIceCandidate(c).catch(()=>{})}
function openUi(type,name,st){$('#call').dataset.type=type;$('#cn2').textContent=name;status(st);$('#call').hidden=false;
  ['#mu','#cm'].forEach(s=>$(s).classList.remove('off'))}
function listen(){
  ready=true;out.splice(0).forEach(send);
  unsubs.push(onSnapshot(collection(db,'calls',id,'cands'),s=>s.docChanges().forEach(async ch=>{
    if(ch.type!=='added')return;const x=ch.doc.data();if(x.from===me||!pc)return;const c=JSON.parse(x.c);
    if(pc.remoteDescription)await pc.addIceCandidate(c).catch(()=>{});else q.push(c)})));
  unsubs.push(onSnapshot(doc(db,'calls',id),async s=>{
    const d=s.data();if(!d||!pc)return;
    if(d.status==='accepted'){acc=true;clearTimeout(tm)}
    if(role==='out'&&d.status==='accepted'&&d.answer&&!pc.currentRemoteDescription){await pc.setRemoteDescription(d.answer);await flush();status('Connecting…')}
    if(['rejected','cancelled','missed','ended'].includes(d.status))done(d.status==='rejected'?'Call declined':'Call ended');
  }));
}
function done(msg){
  if(!id)return;const cid=id;id=null;
  unsubs.splice(0).forEach(u=>u());clearTimeout(tm);clearInterval(tick);
  if(pc){pc.onicecandidate=pc.ontrack=pc.onconnectionstatechange=null;pc.close();pc=null}
  stream?.getTracks().forEach(t=>t.stop());stream=null;
  $('#rv').srcObject=null;$('#lv').srcObject=null;$('#call').hidden=true;
  q=[];out=[];ready=false;role=null;acc=false;
  getDocs(collection(db,'calls',cid,'cands')).then(s=>s.forEach(x=>deleteDoc(x.ref).catch(()=>{}))).catch(()=>{});
  toast(msg);
}
function end(st,msg){if(id)updateDoc(doc(db,'calls',id),{status:st}).catch(()=>{});done(msg)}

export async function startCall(peer,name,type){
  if(id||inc)return toast('You are already in a call');
  if(!navigator.onLine)return toast('You are offline');
  const ref=doc(collection(db,'calls'));id=ref.id;role='out';acc=false;
  try{
    await media(type);makePc();openUi(type,name,'Calling…');
    const o=await pc.createOffer();await pc.setLocalDescription(o);
    await setDoc(ref,{caller:me,callee:peer,type,status:'ringing',offer:{type:o.type,sdp:o.sdp},createdAt:serverTimestamp()});
    listen();status('Ringing…');
    tm=setTimeout(()=>{if(!acc)end('missed','No answer')},45000);
  }catch(e){const m=merr(e);if(id&&ready)end('cancelled',m);else done(m)}
}
async function accept(){
  const c=inc;if(!c)return;inc=null;$('#inc').hidden=true;id=c.id;role='in';acc=false;
  try{
    await media(c.d.type);makePc();openUi(c.d.type,nameOf(c.d.caller),'Connecting…');
    await pc.setRemoteDescription(c.d.offer);await flush();
    const a=await pc.createAnswer();await pc.setLocalDescription(a);
    await updateDoc(doc(db,'calls',id),{status:'accepted',answer:{type:a.type,sdp:a.sdp}});
    acc=true;listen();
  }catch(e){updateDoc(doc(db,'calls',c.id),{status:'rejected'}).catch(()=>{});done(merr(e))}
}
function reject(){const c=inc;if(!c)return;inc=null;$('#inc').hidden=true;updateDoc(doc(db,'calls',c.id),{status:'rejected'}).catch(()=>{})}
const hangup=()=>{if(id)end(acc?'ended':'cancelled','Call ended')};

$('#ia').onclick=accept;$('#ir').onclick=reject;$('#hg').onclick=hangup;
$('#mu').onclick=e=>{const t=stream?.getAudioTracks()[0];if(!t)return;t.enabled=!t.enabled;e.currentTarget.classList.toggle('off',!t.enabled)};
$('#cm').onclick=e=>{const t=stream?.getVideoTracks()[0];if(!t)return;t.enabled=!t.enabled;e.currentTarget.classList.toggle('off',!t.enabled)};
$('#sw').onclick=async()=>{
  if(!stream||!pc)return;
  try{
    const f=facing==='user'?'environment':'user';
    const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:f}});const nt=n.getVideoTracks()[0];
    const s=pc.getSenders().find(x=>x.track&&x.track.kind==='video');await s.replaceTrack(nt);
    stream.getVideoTracks().forEach(t=>{t.stop();stream.removeTrack(t)});stream.addTrack(nt);facing=f;$('#lv').srcObject=stream;
  }catch{toast('This device cannot switch camera')}
};
window.addEventListener('pagehide',()=>{if(id)end(acc?'ended':'cancelled','Call ended')});
