// ===== STEP SYNC via URL param (iOS Shortcuts / Tasker) =====
// Usage: open the app with ?steps=12345 (optional &date=YYYY-MM-DD) to save steps
function handleStepUrlParam(){try{const u=new URL(location.href),p=u.searchParams;if(!p.has('steps'))return;const v=parseInt(p.get('steps'),10);if(!isNaN(v)&&v>=0&&v<200000){const d=p.get('date')||new Date().toISOString().slice(0,10);const s=getSteps();s[d]=v;sv("nt_steps",s);try{renderHome()}catch{}}p.delete('steps');p.delete('date');history.replaceState(null,'',u.pathname+(p.toString()?'?'+p.toString():'')+u.hash)}catch{}}

// ===== INIT =====
initAuth();initNav();initSearch();wire();handleStepUrlParam();
