// Linear regression helper: returns {slope, intercept, r2, ssRes, n}
function linReg(pts){
  const n=pts.length;
  const sx=pts.reduce((s,pt)=>s+pt.x,0),sy=pts.reduce((s,pt)=>s+pt.y,0);
  const sxx=pts.reduce((s,pt)=>s+pt.x*pt.x,0),sxy=pts.reduce((s,pt)=>s+pt.x*pt.y,0);
  const denom=n*sxx-sx*sx;
  const slope=denom!==0?(n*sxy-sx*sy)/denom:0;
  const intercept=(sy-slope*sx)/n;
  const meanY=sy/n;
  const ssTot=pts.reduce((s,pt)=>s+(pt.y-meanY)*(pt.y-meanY),0);
  const ssRes=pts.reduce((s,pt)=>{const pred=slope*pt.x+intercept;return s+(pt.y-pred)*(pt.y-pred)},0);
  const r2=ssTot>0?1-ssRes/ssTot:0;
  return{slope,intercept,r2,ssRes,n};
}
// Trend analysis RESTRICTED to current palier.
// Adaptive window 7/5/3j based on noise, kcal adherence downgrades confidence.
function trend72(){
  const w=getW();if(w.length<1)return null;
  const p=getPalier();
  // Restrict to palier: date >= startDate AND (tgKcal/phase match OR legacy).
  // A hand-edited entry with a different palier or phase cannot leak in.
  const onPalierRaw=w.filter(x=>x.date>=p.startDate
    &&(typeof x.tgKcal!=='number'||x.tgKcal===p.kcal)
    &&(typeof x.phase!=='string'||x.phase===p.phase));
  const days=palierDays(p);
  const MIN_DAYS=3,IDEAL_DAYS=5;
  if(onPalierRaw.length<3||days<MIN_DAYS){
    return{dir:'observing',rate:0,confidence:'pending',sampleSize:onPalierRaw.length,
      daysOnPalier:days,daysNeeded:MIN_DAYS,idealDays:IDEAL_DAYS,palierKcal:p.kcal,
      window:0,avgAct:0,avgTg:p.kcal,adherence:null,trackedDays:0,r2:0};
  }
  const onPalier=onPalierRaw.map(enrichW);
  const today=new Date().toISOString().slice(0,10);
  // Adaptive window: try 7, 5, 3 — take up to s.w points, keep if we meet minN
  const sizes=[{w:7,maxNoise:0.7,minN:5,conf:'high'},{w:5,maxNoise:1.0,minN:4,conf:'medium'},{w:3,maxNoise:Infinity,minN:3,conf:'low'}];
  let chosen=null;
  for(const s of sizes){
    const slice=onPalier.slice(-s.w);
    if(slice.length<s.minN)continue;
    const t0=new Date(slice[0].date).getTime();
    const pts=slice.map(pt=>({x:(new Date(pt.date).getTime()-t0)/86400000,y:pt.w}));
    const lr=linReg(pts);
    const residualStd=Math.sqrt(lr.ssRes/Math.max(1,lr.n));
    const signalAmp=Math.max(0.2,Math.abs(lr.slope*s.w));
    const noiseRatio=residualStd/signalAmp;
    if(noiseRatio<s.maxNoise||s.w===3){
      chosen={slice,pts,lr,window:s.w,confidence:s.conf,noiseRatio};break;
    }
  }
  if(!chosen){
    // Not enough clean data — fallback last 3
    const slice=onPalier.slice(-3);
    const t0=new Date(slice[0].date).getTime();
    const pts=slice.map(pt=>({x:(new Date(pt.date).getTime()-t0)/86400000,y:pt.w}));
    chosen={slice,pts,lr:linReg(pts),window:3,confidence:'low',noiseRatio:0};
  }
  const rate=+(chosen.lr.slope*7).toFixed(2);
  // Adhérence sur la fenêtre retenue — on exclut le jour en cours (actKcal partiel
  // fausse la moyenne tant que la journée n'est pas terminée).
  const tracked=chosen.slice.filter(e=>e.actKcal>0&&e.date!==today);
  const trackedDays=tracked.length;
  let avgAct=0,avgTg=0,adherence=null;
  if(trackedDays>=2){
    avgAct=Math.round(tracked.reduce((s,e)=>s+e.actKcal,0)/trackedDays);
    avgTg=Math.round(tracked.reduce((s,e)=>s+e.tgKcal,0)/trackedDays);
    const avgDev=tracked.reduce((s,e)=>s+Math.abs(e.actKcal-e.tgKcal),0)/trackedDays;
    adherence=avgTg>0?Math.round(100*(1-avgDev/avgTg)):null;
  }else{
    avgTg=chosen.slice.reduce((s,e)=>s+e.tgKcal,0)/chosen.slice.length;
    avgTg=Math.round(avgTg);
  }
  // Downgrade confidence if adherence weak
  let confidence=chosen.confidence;
  if(adherence!==null&&adherence<85)confidence='low';
  // Direction thresholds widen as confidence drops (plus conservative quand incertain)
  const confMult={high:1.0,medium:1.25,low:1.6}[confidence]||1.25;
  const tFast=0.8*confMult,tSlow=0.2*confMult;
  // Signal/noise: si le changement observe reste dans le bruit, force stable
  const residualStd=Math.sqrt(chosen.lr.ssRes/Math.max(1,chosen.lr.n));
  const dayspan=Math.max(1,chosen.pts[chosen.pts.length-1].x-chosen.pts[0].x);
  const signalAbs=Math.abs(chosen.lr.slope*dayspan);
  const withinNoise=signalAbs<residualStd*1.5;
  let dir;
  if(withinNoise)dir='stable';
  else if(rate<=-tFast)dir='down_fast';
  else if(rate<=-tSlow)dir='down';
  else if(rate<tSlow)dir='stable';
  else if(rate<tFast)dir='up';
  else dir='up_fast';
  return{dir,rate,confidence,window:chosen.window,sampleSize:chosen.lr.n,
    r2:+chosen.lr.r2.toFixed(2),daysOnPalier:days,daysNeeded:MIN_DAYS,idealDays:IDEAL_DAYS,
    palierKcal:p.kcal,avgAct,avgTg,adherence,trackedDays};
}
function enrichW(e){
  const tg=getTg();
  const tgKcal=(e&&typeof e.tgKcal==='number'&&e.tgKcal>0)?e.tgKcal:tg.kcal;
  const phase=(e&&typeof e.phase==='string'&&e.phase)?e.phase:getPh();
  const actKcal=Math.round(dayTotals(e.date).kcal);
  return{date:e.date,w:e.w,tgKcal,phase,actKcal,delta:actKcal-tgKcal};
}
// Phase-wide weight trend: regression across ALL weigh-ins tagged with the current phase,
// regardless of kcal palier. Used for long-term reporting, NOT for decisions.
function phaseTrend(){
  const ws=getW();if(!ws.length)return null;
  const ph=getPh();
  const matched=ws.filter(e=>{
    if(typeof e.phase==='string')return e.phase===ph;
    return true; // legacy entries fall back to current phase
  }).map(enrichW);
  if(matched.length<2)return{count:matched.length,phase:ph};
  const t0=new Date(matched[0].date).getTime();
  const pts=matched.map(pt=>({x:(new Date(pt.date).getTime()-t0)/86400000,y:pt.w}));
  const lr=linReg(pts);
  const rate=+(lr.slope*7).toFixed(2);
  const startDate=matched[0].date,endDate=matched[matched.length-1].date;
  const totalChange=+(matched[matched.length-1].w-matched[0].w).toFixed(1);
  return{count:matched.length,phase:ph,rate,r2:+lr.r2.toFixed(2),
    startDate,endDate,totalChange,points:matched};
}
function weightStats(){
  const w=getW();if(!w.length)return null;
  const cur=w[w.length-1].w,start=w[0].w,mn=Math.min(...w.map(x=>x.w)),mx=Math.max(...w.map(x=>x.w));
  const hm=getH()/100,bmi=hm>0?(cur/(hm*hm)).toFixed(1):'--';
  // 7-day avg
  const now=new Date(),d7=new Date(now);d7.setDate(d7.getDate()-7);
  const w7=w.filter(x=>x.date>=d7.toISOString().slice(0,10)),avg7=w7.length?+(w7.reduce((s,x)=>s+x.w,0)/w7.length).toFixed(1):cur;
  // 30-day avg
  const d30=new Date(now);d30.setDate(d30.getDate()-30);
  const w30=w.filter(x=>x.date>=d30.toISOString().slice(0,10)),avg30=w30.length?+(w30.reduce((s,x)=>s+x.w,0)/w30.length).toFixed(1):cur;
  // Weekly rate (kg/week)
  let rate=0;if(w7.length>=2){rate=+((w7[w7.length-1].w-w7[0].w)/(w7.length-1)*7).toFixed(2)}
  else if(w.length>=2){const days=Math.max(1,(new Date(w[w.length-1].date)-new Date(w[0].date))/86400000);rate=+((cur-start)/days*7).toFixed(2)}
  // Est. goal date
  const pw=getPW();let estDays=null;
  if(rate!==0&&((cur>pw&&rate<0)||(cur<pw&&rate>0))){estDays=Math.ceil(Math.abs(cur-pw)/Math.abs(rate)*7)}
  // Regularity (% of last 14 days with a weigh-in)
  const d14=new Date(now);d14.setDate(d14.getDate()-14);
  const w14=w.filter(x=>x.date>=d14.toISOString().slice(0,10));
  const reg=Math.min(100,Math.round(w14.length/14*100));
  return{cur,start,mn,mx,bmi,avg7,avg30,rate,estDays,total:+(cur-start).toFixed(1),reg,count:w.length}
}
// Unified recommendation logic based on phase + trend
function recommendAction(ph,tr,kcal){
  const newUp=kcal+200,newDn=Math.max(1200,kcal-200);
  const d=tr.dir,r=tr.rate;
  // Observation phase: not enough data on current palier yet
  if(d==='observing'){
    const dn=tr.daysOnPalier,dt=tr.daysNeeded;
    return{act:'observer',
      msg:'Palier '+kcal+' kcal \u2014 observe encore ('+dn+'/'+dt+' jours)',
      tp:'info',
      reason:'Reste sur '+kcal+' kcal pendant au moins '+dt+' jours avant d\'ajuster. Tendance fiable a partir de '+tr.idealDays+' jours.'};
  }
  // Garde-fou: tracking incoherent -> on ne change pas de palier
  if(tr.confidence==='low'&&tr.adherence!==null&&tr.adherence<85){
    return{act:'observer',tp:'warn',
      msg:'Tracking irregulier ('+tr.adherence+'% adherence) \u2014 stabilise avant d\'ajuster',
      reason:'Moy reelle '+tr.avgAct+' kcal vs cible '+tr.avgTg+' kcal. Respecte la cible '+tr.idealDays+'j avant de decider un +/-200.'};
  }
  // Garde-fou phase B: si tu depasses la cible, tiens le palier
  if(ph==='B'&&tr.avgAct>0&&tr.avgAct>kcal+100){
    return{act:'maintenir',tp:'warn',
      msg:'Depassement cible (+'+(tr.avgAct-kcal)+' kcal) \u2014 maintiens '+kcal+' kcal',
      reason:'Tu manges au-dessus de ta cible deficit. Tiens le palier actuel avant de couper.'};
  }
  // Garde-fou phase D symetrique: si tu manges en-dessous, tiens le palier
  if(ph==='D'&&tr.avgAct>0&&tr.avgAct<kcal-100){
    return{act:'maintenir',tp:'warn',
      msg:'Sous-consommation (-'+(kcal-tr.avgAct)+' kcal) \u2014 maintiens '+kcal+' kcal',
      reason:'Tu manges en-dessous de ta cible PDM. Atteins d\'abord '+kcal+' kcal avant de monter.'};
  }
  // Garde-fou phase F: si tu manges en-dessous de la cible, tu recrees un deficit involontaire
  if(ph==='F'&&tr.avgAct>0&&tr.avgAct<kcal-100){
    return{act:'maintenir',tp:'warn',
      msg:'Sous-consommation (-'+(kcal-tr.avgAct)+' kcal) \u2014 tiens '+kcal+' kcal',
      reason:'La remonte exige d\'atteindre la cible. Tu recrees un deficit non voulu, stabilise d\'abord.'};
  }
  let act='maintenir',msg='',tp='info',reason='';
  if(ph==='A'){
    if(d==='down_fast'){act='maintenir';msg='Baisse rapide ('+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='warn';reason='Tu perds trop vite pour une pre-prep.'}
    else if(d==='down'){act='maintenir';msg='Legere baisse ('+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='success';reason='Tendance normale en pre-prep.'}
    else if(d==='stable'){act='+200';msg='Stagnation (+/-0) \u2014 passe a '+newUp+' kcal (+200)';tp='warn';reason='Ton metabolisme tient, augmente pour progresser.'}
    else if(d==='up'){act='maintenir';msg='Legere prise (+'+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='info';reason='Continue, le corps s\'adapte.'}
    else{act='-200';msg='Prise rapide (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='danger';reason='Trop rapide, ralentis.'}
  }else if(ph==='B'){// DEFICIT
    if(d==='down_fast'){act='+200';msg='Perte trop rapide ('+r+' kg/sem) \u2014 monte a '+newUp+' kcal (+200)';tp='warn';reason='Risque de perte musculaire. Ralentis le deficit.'}
    else if(d==='down'){act='maintenir';msg='Deficit efficace ('+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='success';reason='Rythme optimal, continue.'}
    else if(d==='stable'){act='-200';msg='Stagnation en deficit \u2014 baisse a '+newDn+' kcal (-200)';tp='warn';reason='Ton corps s\'est adapte, besoin de creuser.'}
    else if(d==='up'){act='-200';msg='Remontee en deficit (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='danger';reason='Verifie ton tracking et reduis.'}
    else{act='-200';msg='Remontee rapide (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='danger';reason='Tracking a verifier imperativement.'}
  }else if(ph==='C'){// REVERSE
    if(d==='down_fast'||d==='down'){act='+200';msg='Encore en perte ('+r+' kg/sem) \u2014 monte a '+newUp+' kcal (+200)';tp='warn';reason='Le reverse vise a maintenir le poids.'}
    else if(d==='stable'){act='maintenir';msg='Reverse stable \u2014 maintiens '+kcal+' kcal';tp='success';reason='Parfait, le metabolisme se reeduque.'}
    else if(d==='up'){act='maintenir';msg='Legere prise (+'+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='info';reason='Normal en reverse, surveille.'}
    else{act='-200';msg='Prise rapide (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='warn';reason='Tu montes trop vite, ralentis.'}
  }else if(ph==='F'){// REMONTE — remonter les kcal en continuant a perdre
    if(d==='down_fast'){act='maintenir';msg='Baisse rapide ('+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='warn';reason='Tu descends encore vite malgre la remonte. Tiens le palier, ne remonte pas encore.'}
    else if(d==='down'){act='maintenir';msg='Remonte efficace ('+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='success';reason='Parfait: tu remontes les kcal ET tu perds du poids. Continue sur ce palier.'}
    else if(d==='stable'){act='+200';msg='Plateau atteint \u2014 monte a '+newUp+' kcal (+200)';tp='info';reason='Le metabolisme s\'est adapte au palier. Pousse encore pour relancer la perte plus haut en kcal.'}
    else if(d==='up'){act='-200';msg='Legere prise (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='warn';reason='Tu as depasse le plafond de remonte. Reviens au palier precedent.'}
    else{act='-200';msg='Prise rapide (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='danger';reason='Largement au-dessus du plafond, redescends.'}
  }else if(ph==='D'){// PDM
    if(d==='down_fast'||d==='down'){act='+200';msg='Poids baisse ('+r+' kg/sem) \u2014 monte a '+newUp+' kcal (+200)';tp='warn';reason='Pas de surplus, augmente.'}
    else if(d==='stable'){act='+200';msg='Stagnation en PDM \u2014 monte a '+newUp+' kcal (+200)';tp='warn';reason='Pas de prise, plus de calories necessaires.'}
    else if(d==='up'){act='maintenir';msg='PDM on track (+'+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='success';reason='Rythme ideal, continue.'}
    else{act='-200';msg='Prise rapide (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='danger';reason='Trop de gras, ralentis le bulk.'}
  }else{// E Reset
    if(d==='down_fast'||d==='down'){act='maintenir';msg='Reset OK ('+r+' kg/sem) \u2014 maintiens '+kcal+' kcal';tp='success';reason='Le reset fonctionne.'}
    else if(d==='stable'){act='-200';msg='Stagnation reset \u2014 baisse a '+newDn+' kcal (-200)';tp='warn';reason='Ajuste pour relancer.'}
    else{act='-200';msg='Remontee en reset (+'+r+' kg/sem) \u2014 baisse a '+newDn+' kcal (-200)';tp='danger';reason='Baisse pour reprendre le controle.'}
  }
  return{act,msg,tp,reason};
}
