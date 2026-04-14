// ===== TREND & ANALYSIS =====
// Palier = current calorie level with its start date.
// Auto-detects kcal changes: when tg.kcal differs, reset startDate to today.
// Palier = (kcal, phase, startDate). Changing EITHER kcal OR phase starts a new palier.
function getPalier(){
  let p=ld("nt_palier",null);
  const tg=getTg();
  const ph=getPh();
  const today=new Date().toISOString().slice(0,10);
  if(!p||typeof p!=='object'||p.kcal!==tg.kcal||p.phase!==ph){
    p={kcal:tg.kcal,phase:ph,startDate:today};
    sv("nt_palier",p);
  }
  // Auto-extend startDate backward across the most-recent consecutive run of matching (kcal,phase).
  // Walk backward from latest weigh-in; stop on the first entry with a *different* explicit kcal or phase.
  // Legacy entries without both tgKcal and phase set are skipped (neither included nor stopping).
  const ws=[...ld("nt_weights",[])].sort((a,b)=>a.date.localeCompare(b.date));
  let earliest=p.startDate;
  for(let i=ws.length-1;i>=0;i--){
    const e=ws[i];
    if(typeof e.tgKcal!=='number'||typeof e.phase!=='string')continue;
    if(e.tgKcal===p.kcal&&e.phase===p.phase){
      if(e.date<earliest)earliest=e.date;
    }else{
      break;
    }
  }
  if(earliest!==p.startDate){
    p.startDate=earliest;
    sv("nt_palier",p);
  }
  return p;
}
// Extend palier startDate backward when a backfilled pesée matches the current (kcal,phase) palier.
function extendPalierBackward(date,tgKcal,phase){
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
  const p=getPalier();
  if(tgKcal===p.kcal&&phase===p.phase&&date<p.startDate){
    p.startDate=date;
    sv("nt_palier",p);
  }
}
// Days elapsed since palier started (0 = same day)
function palierDays(p){
  const today=new Date();today.setHours(0,0,0,0);
  const s=new Date(p.startDate);s.setHours(0,0,0,0);
  return Math.max(0,Math.floor((today-s)/86400000));
}
// Timeline des paliers déduite de l'historique des pesées (chaque pesée porte son tgKcal).
// On ajoute un point "today" avec le palier courant si le dernier tgKcal connu diffère,
// pour refléter un changement de palier fait via Réglages sans pesée associée.
function palierTimeline(){
  const tl=[...getW()].filter(e=>typeof e.tgKcal==='number'&&e.tgKcal>0)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .map(e=>({date:e.date,tgKcal:e.tgKcal}));
  const curK=getTg().kcal,today=new Date().toISOString().slice(0,10);
  if(!tl.length||tl[tl.length-1].tgKcal!==curK)tl.push({date:today,tgKcal:curK});
  return tl;
}
// Palier (kcal cible) actif à une date donnée : dernière entrée <= date, sinon 1re connue, sinon cible courante.
function targetForDate(date){
  const tl=palierTimeline();
  if(!tl.length)return getTg().kcal;
  let cur=tl[0].tgKcal;
  for(const e of tl){if(e.date<=date)cur=e.tgKcal;else break}
  return cur;
}
