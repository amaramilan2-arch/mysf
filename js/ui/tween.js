// ===== TWEEN =====
// Animate a DOM element's text content from its current number to a target.
// Usage: tweenNum(el, 2200, {dur:450, decimals:0, suffix:''})
const _tweens=new WeakMap();
function tweenNum(el,to,opts){
  if(!el)return;
  opts=opts||{};
  const dur=opts.dur||450;
  const dec=opts.decimals||0;
  const suf=opts.suffix||'';
  const pre=opts.prefix||'';
  // Parse current value from textContent, ignoring non-numeric chars except - and .
  const cur=parseFloat((el.textContent||'0').replace(/[^\d.\-]/g,''))||0;
  if(Math.abs(cur-to)<Math.pow(10,-dec-1)){el.textContent=pre+to.toFixed(dec)+suf;return}
  // Cancel any in-flight tween on this element
  const prev=_tweens.get(el);if(prev)cancelAnimationFrame(prev);
  const start=performance.now();
  const step=(now)=>{
    const t=Math.min(1,(now-start)/dur);
    // easeOutCubic
    const e=1-Math.pow(1-t,3);
    const v=cur+(to-cur)*e;
    el.textContent=pre+v.toFixed(dec)+suf;
    if(t<1){_tweens.set(el,requestAnimationFrame(step))}else{_tweens.delete(el)}
  };
  _tweens.set(el,requestAnimationFrame(step));
}
// Animate a localized integer (fr-FR thousands)
function tweenInt(el,to,dur){
  if(!el)return;
  const cur=parseInt((el.textContent||'0').replace(/\D/g,''),10)||0;
  if(cur===to){el.textContent=to.toLocaleString('fr-FR');return}
  const prev=_tweens.get(el);if(prev)cancelAnimationFrame(prev);
  const start=performance.now(),d=dur||450;
  const step=(now)=>{
    const t=Math.min(1,(now-start)/d);
    const e=1-Math.pow(1-t,3);
    el.textContent=Math.round(cur+(to-cur)*e).toLocaleString('fr-FR');
    if(t<1){_tweens.set(el,requestAnimationFrame(step))}else{_tweens.delete(el)}
  };
  _tweens.set(el,requestAnimationFrame(step));
}
