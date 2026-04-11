// ===== TOAST =====
// Lightweight toast notifications. Queue, auto-dismiss, tap to close.
// Usage: toast("Message", "success"|"error"|"warn"|"info", durationMs)
const TOAST_ICONS={success:'\u2713',error:'\u00D7',warn:'!',info:'i'};
const TOAST_MAX=3;
function toastRoot(){
  let r=document.getElementById('toastRoot');
  if(!r){r=document.createElement('div');r.id='toastRoot';r.className='toast-root';document.body.appendChild(r)}
  return r;
}
function toast(msg,type,dur){
  type=type||'info';dur=dur||2600;
  const root=toastRoot();
  while(root.children.length>=TOAST_MAX)root.removeChild(root.firstChild);
  const el=document.createElement('div');
  el.className='toast '+type;
  const ico=document.createElement('span');ico.className='tIco';ico.textContent=TOAST_ICONS[type]||'';
  const txt=document.createElement('span');txt.textContent=msg;
  el.appendChild(ico);el.appendChild(txt);
  const close=()=>{if(!el.parentNode)return;el.classList.add('hide');setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},220)};
  el.addEventListener('click',close);
  root.appendChild(el);
  setTimeout(close,dur);
  return el;
}
