// ===== HOME =====
// ===== HOME =====
function renderHome(){
  const h=new Date().getHours();$('hHi').textContent=(h<12?'Bonjour':h<18?'Bon apres-midi':'Bonsoir')+(currentUser?', '+currentUser.displayName.split(' ')[0]:'');
  $('hDt').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  const t=dayTotals(curDate),tg=getTg(),rem=Math.max(0,Math.round(tg.kcal-t.kcal));
  tweenInt($('cV'),rem,520);$('cV').style.color=t.kcal>tg.kcal?'var(--red)':'var(--t1)';
  $('cSub').textContent=Math.round(t.kcal)+' / '+tg.kcal+' kcal';
  const pct=tg.kcal?Math.min(100,Math.round(t.kcal/tg.kcal*100)):0,over=t.kcal>tg.kcal;
  const ringBg=getTheme()==='light'?'#DFE2EA':'#1F1F24',ringFg=over?'#FF6B6B':pct>85?'#FFB347':getTheme()==='light'?'#2DB77B':'#6AEFAF';
  const ringData=over?[100,0]:[pct,100-pct];
  if(chartRing){chartRing.data.datasets[0].data=ringData;chartRing.data.datasets[0].backgroundColor=[ringFg,ringBg];chartRing.update()}
  else chartRing=new Chart($('cRing').getContext('2d'),{type:'doughnut',data:{datasets:[{data:ringData,backgroundColor:[ringFg,ringBg],borderWidth:0,borderRadius:999}]},options:{responsive:true,maintainAspectRatio:true,cutout:'88%',plugins:{legend:{display:false},tooltip:{enabled:false}},animation:{duration:700,easing:'easeOutCubic'},events:[]}});
  const mp=Math.round(t.p),mg=Math.round(t.g),ml=Math.round(t.l),mf=Math.round(t.f);
  tweenInt($('hP'),mp,450);$('hPt').textContent=' / '+tg.prot+' g';$('hPb').style.width=Math.min(100,tg.prot?Math.round(t.p/tg.prot*100):0)+'%';
  tweenInt($('hG'),mg,450);$('hGt').textContent=' / '+tg.gluc+' g';$('hGb').style.width=Math.min(100,tg.gluc?Math.round(t.g/tg.gluc*100):0)+'%';
  tweenInt($('hL'),ml,450);$('hLt').textContent=' / '+tg.lip+' g';$('hLb').style.width=Math.min(100,tg.lip?Math.round(t.l/tg.lip*100):0)+'%';
  tweenInt($('hF'),mf,450);$('hFt').textContent=' / '+(tg.fib||30)+' g';$('hFb').style.width=Math.min(100,(tg.fib||30)?Math.round(t.f/(tg.fib||30)*100):0)+'%';
  const w=getWater(),wc=w[curDate]||0;$('wV').textContent=(wc*0.25).toFixed(1);
  const s=getSteps(),sc=s[curDate]||0,sg=ld("nt_sg",10000);tweenInt($('sV'),sc,450);
  if($('sGoal'))$('sGoal').textContent=sg.toLocaleString('fr-FR').replace(/\u202F/g,' ');
  if($('sBar'))$('sBar').style.width=Math.min(100,sg?Math.round(sc/sg*100):0)+'%';
  // Weight home
  const ws=getW(),todayW=ws.find(x=>x.date===new Date().toISOString().slice(0,10));
  $('wHv').textContent=todayW?todayW.w+' kg':'--';
  if(todayW)$('wHIn').value=todayW.w;
  // Streak
  const log=getLog();let sk=0;const dd=new Date();for(let i=0;i<365;i++){const ds=dd.toISOString().slice(0,10);if(log[ds]&&log[ds].length)sk++;else if(i>0)break;dd.setDate(dd.getDate()-1)}
  if(sk>1){$('skBar').style.display='flex';$('skV').textContent=sk}else $('skBar').style.display='none';
  renderAlert('hAlt');renderAnalysis('hAn');
  const items=dayLog(curDate),el=$('hMeals');
  if(!items.length)el.innerHTML='<section class="hm-card"><div class="hm-head"><span class="material-symbols-outlined hm-ico">restaurant</span><h3>Repas du jour</h3></div><div class="empty" data-ico="\u{1F37D}">Aucun repas aujourd\'hui</div></section>';
  else{const byM={};items.forEach(i=>{if(!byM[i.meal])byM[i.meal]=[];byM[i.meal].push(i)});const total=items.reduce((s,i)=>s+i.kcal,0);el.innerHTML='<section class="hm-card"><div class="hm-head"><span class="material-symbols-outlined hm-ico">restaurant</span><h3>Repas du jour</h3><span class="hm-tot">'+Math.round(total)+' kcal</span></div>'+Object.keys(byM).map(mi=>'<div class="hm-item"><span class="hn">'+MEALS[mi]+' <span class="hn-c">('+byM[mi].length+')</span></span><span class="hk">'+Math.round(byM[mi].reduce((s,i)=>s+i.kcal,0))+'</span></div>').join('')+'</section>'}
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
function buildAn(){
  const w=getW(),ph=getPh(),tg=getTg(),tr=trend72(),p=getPalier();
  // Fenetre palier-scoped, capee a 14j pour rester ISO avec les autres graphes
  const winDays=Math.min(14,palierDays(p)+1);
  const dates=[];
  for(let i=winDays-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);if(ds>=p.startDate)dates.push(ds)}
  const dt=dates.map(d=>dayTotals(d)),dwd=dt.filter(t=>t.kcal>0);
  const ac=dwd.length?Math.round(dwd.reduce((s,t)=>s+t.kcal,0)/dwd.length):0;
  const ap=dwd.length?Math.round(dwd.reduce((s,t)=>s+t.p,0)/dwd.length):0;
  // Evolution poids sur la meme fenetre
  const firstDate=dates[0]||new Date().toISOString().slice(0,10);
  const rw=w.filter(x=>x.date>=firstDate);
  let wc=0;if(rw.length>=2)wc=rw[rw.length-1].w-rw[0].w;
  const kcal=tg.kcal,newUp=kcal+200,newDn=Math.max(1200,kcal-200);
  if(!tr||w.length<1)return{v:'maintain',vt:'Pese-toi pour demarrer',vx:'Ajoute une pesee pour activer le suivi de palier.',va:'',ac,ap,wc,dwd:dwd.length,winDays:dates.length,tr:null};
  const rec=recommendAction(ph,tr,kcal);
  let v='maintain',vt='',vx=rec.reason,va='';
  if(rec.act==='observer'){v='maintain';vt=tr.dir==='observing'?'OBSERVE LE PALIER ('+tr.daysOnPalier+'/'+tr.daysNeeded+'j)':rec.msg}
  else if(rec.act==='+200'){v='increase';vt='+200 KCAL \u2192 '+newUp;va='Gluc: '+tg.gluc+'g \u2192 '+(tg.gluc+50)+'g'}
  else if(rec.act==='-200'){v='decrease';vt='-200 KCAL \u2192 '+newDn;va='Gluc: '+tg.gluc+'g \u2192 '+Math.max(0,tg.gluc-50)+'g'}
  else{v='maintain';vt='MAINTENIR '+kcal+' KCAL'}
  return{v,vt,vx,va,ac,ap,wc,dwd:dwd.length,winDays:dates.length,tr,rec};
}
function renderAnalysis(cid){const el=$(cid);if(!el)return;const a=buildAn();if(!a){el.innerHTML='';return}
  const st=weightStats();
  // Main action button (gradient CTA) if a kcal adjustment is recommended
  let btn='';if(a.va&&(a.v==='increase'||a.v==='decrease')){const d=a.v==='increase'?50:-50;btn='<button type="button" class="an-cta btn-apply" data-delta="'+d+'">Appliquer la recommandation</button>'}
  // Quoted recommendation line
  const quote=a.vt?'<div class="an-quote"><p>&laquo;&nbsp;'+a.vt+'&nbsp;&raquo;</p></div>':'';
  // Trend sub (window / conf / adherence)
  let trSub='';
  if(a.tr&&a.tr.dir!=='observing'){
    const parts=['Fenetre '+a.tr.window+'j','conf '+a.tr.confidence];
    if(a.tr.adherence!==null)parts.push('adherence '+a.tr.adherence+'%');
    trSub='<div class="an-sub">'+parts.join(' \u00B7 ')+'</div>';
  }
  // Compact stats grid (2x2) — keeps full data visibility
  let stats='<div class="an-g"><div class="an-s"><div class="al">Moy cal '+a.winDays+'j</div><div class="av" style="color:var(--org)">'+a.ac+'</div></div><div class="an-s"><div class="al">Moy prot</div><div class="av" style="color:var(--acc)">'+a.ap+'g</div></div><div class="an-s"><div class="al">Evol '+a.winDays+'j</div><div class="av" style="color:'+(a.wc<0?'var(--grn)':a.wc>0?'var(--red)':'var(--acc)')+'">'+(a.wc>0?'+':'')+a.wc.toFixed(1)+'</div></div><div class="an-s"><div class="al">Trackes</div><div class="av">'+a.dwd+'/'+a.winDays+'</div></div></div>';
  let extra='';if(st&&st.count>=2){
    extra='<div class="an-g an-g2"><div class="an-s"><div class="al">Moy 7j</div><div class="av" style="color:var(--acc)">'+st.avg7+'</div></div><div class="an-s"><div class="al">Moy 30j</div><div class="av" style="color:var(--pur)">'+st.avg30+'</div></div><div class="an-s"><div class="al">Rythme</div><div class="av" style="color:'+(st.rate<0?'var(--grn)':st.rate>0?'var(--red)':'var(--acc)')+'">'+(st.rate>0?'+':'')+st.rate+'/sem</div></div><div class="an-s"><div class="al">'+(st.estDays?'Objectif':'Regularite')+'</div><div class="av" style="color:var(--org)">'+(st.estDays?'~'+st.estDays+'j':st.reg+'%')+'</div></div></div>';
  }
  el.innerHTML='<section class="an-card '+a.v+'"><div class="an-head"><div class="an-ico"><span class="material-symbols-outlined">analytics</span></div><div class="an-hx"><h3>Analyse du Lab</h3><p>'+a.vx+'</p>'+trSub+'</div></div>'+quote+btn+stats+extra+'</section>';
  el.querySelectorAll('.btn-apply').forEach(b=>b.addEventListener('click',function(){const tg=getTg();tg.gluc=Math.max(0,tg.gluc+(+this.dataset.delta));tg.kcal=tg.prot*4+tg.gluc*4+tg.lip*9;sv("nt_targets",tg);renderHome()}))}

function updateBadge(){const ph=getPh(),c=PHC[ph];$('phPill').style.cssText='color:'+c+';background:'+c+'10;border-color:'+c+'25';$('phPill').querySelector('.d').style.background=c;$('phLbl').textContent='Phase '+ph}
