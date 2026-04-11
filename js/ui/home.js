// ===== HOME =====
// ===== HOME =====
function renderHome(){
  const h=new Date().getHours();$('hHi').textContent=(h<12?'Bonjour':h<18?'Bon apres-midi':'Bonsoir')+(currentUser?', '+currentUser.displayName.split(' ')[0]:'');
  $('hDt').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  const t=dayTotals(curDate),tg=getTg(),rem=Math.max(0,Math.round(tg.kcal-t.kcal));
  $('cV').textContent=rem;$('cV').style.color=t.kcal>tg.kcal?'var(--red)':'var(--t1)';
  $('cSub').textContent=Math.round(t.kcal)+' / '+tg.kcal+' kcal';
  if(chartRing)chartRing.destroy();const pct=tg.kcal?Math.min(100,Math.round(t.kcal/tg.kcal*100)):0,over=t.kcal>tg.kcal;
  const ringBg=getTheme()==='light'?'#DFE1EA':'#25262F',ringFg=over?'#E74C3C':pct>85?'#F39C12':getTheme()==='light'?'#5F4DD0':'#6C5CE7';
  chartRing=new Chart($('cRing').getContext('2d'),{type:'doughnut',data:{datasets:[{data:over?[100,0]:[pct,100-pct],backgroundColor:[ringFg,ringBg],borderWidth:0}]},options:{responsive:false,cutout:'82%',plugins:{legend:{display:false},tooltip:{enabled:false}},animation:{duration:600},events:[]}});
  const mp=Math.round(t.p),mg=Math.round(t.g),ml=Math.round(t.l),mf=Math.round(t.f);
  $('hP').textContent=mp+'g';$('hPt').textContent='/'+tg.prot;$('hPb').style.width=Math.min(100,tg.prot?Math.round(t.p/tg.prot*100):0)+'%';
  $('hG').textContent=mg+'g';$('hGt').textContent='/'+tg.gluc;$('hGb').style.width=Math.min(100,tg.gluc?Math.round(t.g/tg.gluc*100):0)+'%';
  $('hL').textContent=ml+'g';$('hLt').textContent='/'+tg.lip;$('hLb').style.width=Math.min(100,tg.lip?Math.round(t.l/tg.lip*100):0)+'%';
  $('hF').textContent=mf+'g';$('hFt').textContent='/'+(tg.fib||30);$('hFb').style.width=Math.min(100,(tg.fib||30)?Math.round(t.f/(tg.fib||30)*100):0)+'%';
  const w=getWater(),wc=w[curDate]||0;$('wV').textContent=(wc*0.25).toFixed(1)+'L';
  const s=getSteps();$('sV').textContent=(s[curDate]||0).toLocaleString('fr-FR');
  // Weight home
  const ws=getW(),todayW=ws.find(x=>x.date===new Date().toISOString().slice(0,10));
  $('wHv').textContent=todayW?todayW.w+' kg':'--';
  if(todayW)$('wHIn').value=todayW.w;
  // Streak
  const log=getLog();let sk=0;const dd=new Date();for(let i=0;i<365;i++){const ds=dd.toISOString().slice(0,10);if(log[ds]&&log[ds].length)sk++;else if(i>0)break;dd.setDate(dd.getDate()-1)}
  if(sk>1){$('skBar').style.display='flex';$('skV').textContent=sk}else $('skBar').style.display='none';
  renderAlert('hAlt');renderAnalysis('hAn');
  const items=dayLog(curDate),el=$('hMeals');
  if(!items.length)el.innerHTML='<div class="empty">Aucun repas</div>';
  else{const byM={};items.forEach(i=>{if(!byM[i.meal])byM[i.meal]=[];byM[i.meal].push(i)});el.innerHTML=Object.keys(byM).map(mi=>'<div class="hm-item"><span class="hn">'+MEALS[mi]+' ('+byM[mi].length+')</span><span class="hk mono">'+Math.round(byM[mi].reduce((s,i)=>s+i.kcal,0))+'</span></div>').join('')}
}

function renderAlert(cid){const el=$(cid);if(!el)return;const tr=trend72();if(!tr){el.innerHTML='';return}
  const ph=getPh(),tg=getTg(),kcal=tg.kcal;
  const rec=recommendAction(ph,tr,kcal);
  // Confidence badge (only when >= 3 days on palier but still low)
  let confBadge='';
  if(tr.dir!=='observing'&&tr.confidence==='low')confBadge=' <span style="font-size:.55rem;color:var(--t3);margin-left:4px">(confiance basse, vise '+tr.idealDays+'j)</span>';
  // Secondary line: window / confidence / adherence
  let sub='';
  if(tr.dir!=='observing'){
    const parts=['Fenetre '+tr.window+'j','conf '+tr.confidence];
    if(tr.adherence!==null)parts.push('adherence '+tr.adherence+'%');
    sub='<span style="font-size:.58rem;color:var(--t3)">'+parts.join(' \u00B7 ')+'</span>';
  }
  // Apply button only when an adjustment is recommended. Palier auto-resets on kcal change.
  let btn='';
  if(rec.act==='+200')btn=' <button type="button" class="btn btn-p btn-sm" style="margin-top:6px" id="alertApply" data-d="200">Appliquer +200</button>';
  else if(rec.act==='-200')btn=' <button type="button" class="btn btn-d btn-sm" style="margin-top:6px" id="alertApply" data-d="-200">Appliquer -200</button>';
  el.innerHTML='<div class="alt '+rec.tp+'" style="flex-direction:column;align-items:stretch;gap:4px"><span>'+rec.msg+confBadge+'</span>'+sub+btn+'</div>';
  const ab=$('alertApply');if(ab)ab.addEventListener('click',function(){
    const tg=getTg(),d=+this.dataset.d;
    tg.gluc=Math.max(0,tg.gluc+Math.round(d/4));
    tg.kcal=tg.prot*4+tg.gluc*4+tg.lip*9;
    sv("nt_targets",tg);
    // Palier auto-resets on next getPalier() call (detects kcal change)
    renderHome();
  });
}
function buildAn(){const w=getW(),ph=getPh(),tg=getTg(),tr=trend72();const dates=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10))}const dt=dates.map(d=>dayTotals(d)),dwd=dt.filter(t=>t.kcal>0);const ac=dwd.length?Math.round(dwd.reduce((s,t)=>s+t.kcal,0)/dwd.length):0,ap=dwd.length?Math.round(dwd.reduce((s,t)=>s+t.p,0)/dwd.length):0;const rw=w.filter(x=>x.date>=dates[0]);let wc=0;if(rw.length>=2)wc=rw[rw.length-1].w-rw[0].w;
  const kcal=tg.kcal,newUp=kcal+200,newDn=Math.max(1200,kcal-200);
  if(!tr||w.length<1)return{v:'maintain',vt:'Pese-toi pour demarrer',vx:'Ajoute une pesee pour activer le suivi de palier.',va:'',ac,ap,wc,dwd:dwd.length,tr:null};
  const rec=recommendAction(ph,tr,kcal);
  let v='maintain',vt='',vx=rec.reason,va='';
  if(rec.act==='observer'){v='maintain';vt='OBSERVE LE PALIER ('+tr.daysOnPalier+'/'+tr.daysNeeded+'j)'}
  else if(rec.act==='+200'){v='increase';vt='+200 KCAL \u2192 '+newUp;va='Gluc: '+tg.gluc+'g \u2192 '+(tg.gluc+50)+'g'}
  else if(rec.act==='-200'){v='decrease';vt='-200 KCAL \u2192 '+newDn;va='Gluc: '+tg.gluc+'g \u2192 '+Math.max(0,tg.gluc-50)+'g'}
  else{v='maintain';vt='MAINTENIR '+kcal+' KCAL'}
  return{v,vt,vx,va,ac,ap,wc,dwd:dwd.length,tr,rec};
}
function renderAnalysis(cid){const el=$(cid);if(!el)return;const a=buildAn();if(!a){el.innerHTML='';return}
  const st=weightStats();let ah='';if(a.va){ah='<div class="ava mono">'+a.va+'</div>';if(a.v==='increase'||a.v==='decrease'){const d=a.v==='increase'?50:-50;ah+='<button type="button" class="btn btn-p btn-apply" data-delta="'+d+'">Appliquer</button>'}}
  let trSub='';
  if(a.tr&&a.tr.dir!=='observing'){
    const parts=['Fenetre '+a.tr.window+'j','conf '+a.tr.confidence];
    if(a.tr.adherence!==null)parts.push('adherence '+a.tr.adherence+'%');
    trSub='<div style="font-size:.6rem;color:var(--t3);margin-top:4px">'+parts.join(' \u00B7 ')+'</div>';
  }
  let extra='';if(st&&st.count>=2){
    extra='<div class="an-g" style="margin-top:8px"><div class="an-s"><div class="al">Moy 7j</div><div class="av mono" style="color:var(--acc)">'+st.avg7+'</div></div><div class="an-s"><div class="al">Moy 30j</div><div class="av mono" style="color:var(--pur)">'+st.avg30+'</div></div><div class="an-s"><div class="al">Rythme</div><div class="av mono" style="color:'+(st.rate<0?'var(--grn)':st.rate>0?'var(--red)':'var(--acc)')+'">'+(st.rate>0?'+':'')+st.rate+'/sem</div></div><div class="an-s"><div class="al">'+(st.estDays?'Objectif':'Regularite')+'</div><div class="av mono" style="color:var(--org)">'+(st.estDays?'~'+st.estDays+'j':st.reg+'%')+'</div></div></div>';
  }
  el.innerHTML='<div class="an"><h3>Analyse</h3><div class="an-v '+a.v+'"><div class="avt">'+(a.v==='increase'?'\u2B06 ':a.v==='decrease'?'\u2B07 ':'\u27A1 ')+a.vt+'</div><div>'+a.vx+'</div>'+trSub+ah+'</div><div class="an-g"><div class="an-s"><div class="al">Moy cal</div><div class="av mono" style="color:var(--org)">'+a.ac+'</div></div><div class="an-s"><div class="al">Moy prot</div><div class="av mono" style="color:var(--acc)">'+a.ap+'g</div></div><div class="an-s"><div class="al">Evol 7j</div><div class="av mono" style="color:'+(a.wc<0?'var(--grn)':a.wc>0?'var(--red)':'var(--acc)')+'">'+(a.wc>0?'+':'')+a.wc.toFixed(1)+'</div></div><div class="an-s"><div class="al">Trackes</div><div class="av mono">'+a.dwd+'/7</div></div></div>'+extra+'</div>';
  el.querySelectorAll('.btn-apply').forEach(b=>b.addEventListener('click',function(){const tg=getTg();tg.gluc=Math.max(0,tg.gluc+(+this.dataset.delta));tg.kcal=tg.prot*4+tg.gluc*4+tg.lip*9;sv("nt_targets",tg);renderHome()}))}

function updateBadge(){const ph=getPh(),c=PHC[ph];$('phPill').style.cssText='color:'+c+';background:'+c+'10;border-color:'+c+'25';$('phPill').querySelector('.d').style.background=c;$('phLbl').textContent='Phase '+ph}
