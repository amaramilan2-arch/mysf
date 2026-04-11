// ===== CHARTS =====
let wRng=30,cRng=7,mRng=7;
function ema(data,span){const k=2/(span+1);let r=[data[0]];for(let i=1;i<data.length;i++)r.push(data[i]*k+r[i-1]*(1-k));return r}
function mkRng(cid,vals,cur,cb){const el=$(cid);el.innerHTML='';vals.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='rng-btn'+(v.d===cur?' sel':'');b.textContent=v.l;b.addEventListener('click',()=>{cb(v.d);renderCharts()});el.appendChild(b)})}
function getDates(n){const dates=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);dates.push(d.toISOString().slice(0,10))}return dates}
function renderCharts(){
  const ws=getW(),se=$('wSt'),st=weightStats();
  // Weight stats - 2 rows
  if(!st)se.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:8px"><span class="wl">Aucune pesee</span></div>';
  else{se.style.gridTemplateColumns='1fr 1fr 1fr';se.innerHTML='<div><div class="wl">Actuel</div><div class="wv">'+st.cur+'</div></div><div><div class="wl">Objectif</div><div class="wv" style="color:var(--org)">'+getPW()+'</div></div><div><div class="wl">IMC</div><div class="wv" style="color:'+(st.bmi<18.5?'var(--org)':st.bmi>25?'var(--red)':'var(--grn)')+'">'+st.bmi+'</div></div><div><div class="wl">Moy 7j</div><div class="wv" style="color:var(--acc)">'+st.avg7+'</div></div><div><div class="wl">Rythme</div><div class="wv" style="color:'+(st.rate<0?'var(--grn)':st.rate>0?'var(--red)':'var(--acc)')+'">'+(st.rate>0?'+':'')+st.rate+'/sem</div></div><div><div class="wl">'+(st.estDays?'ETA objectif':'Regularite')+'</div><div class="wv" style="color:var(--org)">'+(st.estDays?'~'+st.estDays+'j':st.reg+'%')+'</div></div>'}
  // Weight range selector
  mkRng('wRange',[{l:'7j',d:7},{l:'30j',d:30},{l:'90j',d:90},{l:'Tout',d:9999}],wRng,v=>{wRng=v});
  // Weight chart with EMA + goal line
  if(chartW)chartW.destroy();
  const l=wRng>=9999?ws:ws.slice(-wRng);
  if(l.length){
    const pw=getPW(),wData=l.map(w=>w.w),emaData=l.length>=3?ema(wData,Math.min(7,l.length)):null;
    const datasets=[{label:'Poids',data:wData,borderColor:'#4AD295',backgroundColor:'rgba(74,210,149,.08)',fill:true,tension:.35,pointRadius:l.length>60?1:3,pointBackgroundColor:'#6EEAB0',borderWidth:2.5}];
    if(emaData)datasets.push({label:'Tendance (EMA)',data:emaData.map(v=>+v.toFixed(1)),borderColor:'#FFB347',borderWidth:2,pointRadius:0,tension:.4,fill:false,borderDash:[]});
    if(pw>0)datasets.push({label:'Objectif',data:l.map(()=>pw),borderColor:'rgba(243,156,18,.5)',borderDash:[6,4],pointRadius:0,borderWidth:1.5,fill:false});
    chartW=new Chart($('wCh').getContext('2d'),{type:'line',data:{labels:l.map(w=>fmtD(w.date)),datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{x:{ticks:{color:'#52546A',font:{size:7},maxTicksLimit:l.length>60?5:7},grid:{color:'rgba(37,38,47,.6)'}},y:{ticks:{color:'#52546A',font:{size:8}},grid:{color:'rgba(37,38,47,.6)'}}},plugins:{legend:{display:true,position:'bottom',labels:{color:'#9395A5',font:{size:8},padding:8,usePointStyle:true,pointStyleWidth:8}},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y+' kg'}}}}})
  }
  // Palier trend chart (current kcal+phase palier only)
  renderPalierChart();
  // Phase trend chart (all entries matching current phase, across paliers)
  renderPhaseChart();
  // Calorie range selector
  mkRng('cRange',[{l:'7j',d:7},{l:'14j',d:14},{l:'30j',d:30}],cRng,v=>{cRng=v});
  const tg=getTg(),dates=getDates(cRng);
  const dt=dates.map(d=>dayTotals(d)),lbls=dates.map(d=>fmtD(d));
  // Calorie chart with deficit/surplus coloring
  if(chartC)chartC.destroy();
  const calColors=dt.map(t=>t.kcal>0?(t.kcal>tg.kcal?'rgba(231,76,60,.5)':'rgba(0,184,148,.5)'):'rgba(82,84,106,.2)');
  chartC=new Chart($('cCh').getContext('2d'),{type:'bar',data:{labels:lbls,datasets:[{data:dt.map(t=>Math.round(t.kcal)),backgroundColor:calColors,borderRadius:6,borderSkipped:false},{data:dates.map(()=>tg.kcal),type:'line',borderColor:'rgba(243,156,18,.6)',borderDash:[5,5],pointRadius:0,borderWidth:2,fill:false,label:'Objectif'}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:'#52546A',font:{size:cRng>14?6:8},maxTicksLimit:cRng>14?8:14},grid:{display:false}},y:{ticks:{color:'#52546A',font:{size:8}},grid:{color:'rgba(37,38,47,.6)'}}},plugins:{legend:{display:false}}}});
  // Calorie summary
  const tracked=dt.filter(t=>t.kcal>0),avgK=tracked.length?Math.round(tracked.reduce((s,t)=>s+t.kcal,0)/tracked.length):0;
  const deficit=tg.kcal-avgK,defCol=deficit>0?'var(--grn)':deficit<0?'var(--red)':'var(--acc)';
  const overDays=tracked.filter(t=>t.kcal>tg.kcal).length,underDays=tracked.filter(t=>t.kcal<=tg.kcal&&t.kcal>0).length;
  $('calSummary').innerHTML='<div class="sum-row"><div class="sum-box"><div class="sl">Moy/jour</div><div class="sv" style="color:var(--org)">'+avgK+'</div></div><div class="sum-box"><div class="sl">Deficit/Surplus</div><div class="sv" style="color:'+defCol+'">'+(deficit>0?'-':'+')+ Math.abs(deficit)+'</div></div><div class="sum-box"><div class="sl">Sous obj.</div><div class="sv" style="color:var(--grn)">'+underDays+'j</div></div><div class="sum-box"><div class="sl">Au-dessus</div><div class="sv" style="color:var(--red)">'+overDays+'j</div></div></div>';
  // Macro range selector
  mkRng('mRange',[{l:'7j',d:7},{l:'14j',d:14},{l:'30j',d:30}],mRng,v=>{mRng=v});
  const mDates=getDates(mRng),mDt=mDates.map(d=>dayTotals(d)),mTracked=mDt.filter(t=>t.kcal>0);
  const ap=mTracked.length?mTracked.reduce((s,t)=>s+t.p,0)/mTracked.length:0;
  const ag=mTracked.length?mTracked.reduce((s,t)=>s+t.g,0)/mTracked.length:0;
  const al=mTracked.length?mTracked.reduce((s,t)=>s+t.l,0)/mTracked.length:0;
  if(chartM)chartM.destroy();
  chartM=new Chart($('mCh').getContext('2d'),{type:'doughnut',data:{labels:['Prot','Gluc','Lip'],datasets:[{data:[Math.round(ap),Math.round(ag),Math.round(al)],backgroundColor:['#4AD295','#6EC6FF','#FD79A8'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{display:false}}}});
  // Macro legend + averages
  const totalG=ap+ag+al,ppct=totalG?Math.round(ap/totalG*100):0,gpct=totalG?Math.round(ag/totalG*100):0,lpct=totalG?Math.round(al/totalG*100):0;
  $('macroLeg').innerHTML='<div style="font-size:.7rem;line-height:2"><div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4AD295;margin-right:4px"></span>Prot <strong>'+ppct+'%</strong></div><div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6EC6FF;margin-right:4px"></span>Gluc <strong>'+gpct+'%</strong></div><div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FD79A8;margin-right:4px"></span>Lip <strong>'+lpct+'%</strong></div></div>';
  $('macroAvg').innerHTML='<div class="sum-row"><div class="sum-box"><div class="sl">Prot moy</div><div class="sv" style="color:#4AD295">'+Math.round(ap)+'g</div></div><div class="sum-box"><div class="sl">Obj</div><div class="sv" style="color:var(--t3)">'+tg.prot+'g</div></div><div class="sum-box"><div class="sl">Gluc moy</div><div class="sv" style="color:#6EC6FF">'+Math.round(ag)+'g</div></div><div class="sum-box"><div class="sl">Lip moy</div><div class="sv" style="color:#FD79A8">'+Math.round(al)+'g</div></div></div>';
  // Proteins chart
  const p7dates=getDates(7),p7dt=p7dates.map(d=>dayTotals(d)),p7lbl=p7dates.map(d=>fmtD(d));
  if(chartP)chartP.destroy();chartP=new Chart($('pCh').getContext('2d'),{type:'bar',data:{labels:p7lbl,datasets:[{data:p7dt.map(t=>Math.round(t.p)),backgroundColor:'rgba(74,210,149,.45)',borderRadius:6,borderSkipped:false},{data:p7dates.map(()=>tg.prot),type:'line',borderColor:'rgba(255,179,71,.5)',borderDash:[5,5],pointRadius:0,borderWidth:2,fill:false}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:'#52546A',font:{size:8}},grid:{display:false}},y:{ticks:{color:'#52546A',font:{size:8}},grid:{color:'rgba(37,38,47,.6)'}}},plugins:{legend:{display:false}}}});
  // Weight analysis section
  renderWeightAnalysis();
  // History (enriched with tg vs act kcal) — full list, page scrolls naturally
  const rv=[...ws].reverse();
  const rows=rv.map((w,i)=>{
    let ch='';const idx=ws.length-1-i;
    if(idx>=2){const a=((ws[idx].w-ws[idx-1].w)+(ws[idx-1].w-ws[idx-2].w))/2;ch=a<-0.05?'<span class="chip dn">\u2193</span>':a>0.05?'<span class="chip up">\u2191</span>':'<span class="chip st">\u2192</span>'}
    const en=enrichW(w),devPct=en.tgKcal>0?Math.abs(en.delta)/en.tgKcal:1;
    const col=en.actKcal===0?'var(--t3)':devPct<0.05?'var(--grn)':devPct<0.15?'var(--org)':'var(--red)';
    const kcalTxt=en.actKcal>0?(en.tgKcal+'\u2192'+en.actKcal):(en.tgKcal+'\u2192--');
    const phDot='<span class="ph-dot" title="Phase '+en.phase+'" style="background:'+PHC[en.phase]+'"></span>';
    return '<div class="hi" data-wd="'+w.date+'" data-ww="'+w.w+'" style="cursor:pointer"><span class="hd">'+fmtD(w.date)+phDot+'</span>'+ch+'<span class="hw mono">'+w.w+' kg</span><span class="hkc mono" style="color:'+col+'">'+kcalTxt+'</span><span style="font-size:.55rem;color:var(--t3);margin-left:4px">&#x270E;</span></div>';
  }).join('');
  $('wHi').innerHTML=rows;
  $('wHi').querySelectorAll('.hi[data-wd]').forEach(el=>el.addEventListener('click',function(){openWeightEdit(this.dataset.wd,this.dataset.ww)}));
}
function renderPalierChart(){
  const p=getPalier(),ws=getW();
  const pts=ws.filter(e=>e.date>=p.startDate
    &&(typeof e.tgKcal!=='number'||e.tgKcal===p.kcal)
    &&(typeof e.phase!=='string'||e.phase===p.phase));
  const meta=$('wPalMeta');
  if(chartWPal){chartWPal.destroy();chartWPal=null}
  if(pts.length<2){
    meta.innerHTML='<span>Palier '+p.kcal+' kcal \u00B7 phase '+p.phase+' \u2014 trop peu de pes\u00e9es pour une tendance</span>';
    return;
  }
  const t0=new Date(pts[0].date).getTime();
  const regPts=pts.map(pt=>({x:(new Date(pt.date).getTime()-t0)/86400000,y:pt.w}));
  const lr=linReg(regPts);
  const rate=+(lr.slope*7).toFixed(2);
  const regLine=regPts.map(pt=>+(lr.slope*pt.x+lr.intercept).toFixed(2));
  const days=palierDays(p);
  const tr=trend72();
  const conf=tr&&tr.confidence?tr.confidence:'low';
  meta.innerHTML='<span>Palier '+p.kcal+' kcal \u00B7 phase '+p.phase+' \u00B7 '+pts.length+' pes\u00e9es sur '+(days+1)+'j \u00B7 '+(rate>0?'+':'')+rate+' kg/sem \u00B7 conf '+conf+' \u00B7 R\u00B2 '+(+lr.r2.toFixed(2))+'</span>';
  chartWPal=new Chart($('wChPal').getContext('2d'),{
    type:'line',
    data:{labels:pts.map(pt=>fmtD(pt.date)),datasets:[
      {label:'Poids',data:pts.map(pt=>pt.w),borderColor:'#00CEC9',backgroundColor:'rgba(0,206,201,.08)',fill:true,tension:.3,pointRadius:3,pointBackgroundColor:'#00CEC9',borderWidth:2.2},
      {label:'R\u00e9gression',data:regLine,borderColor:'rgba(0,206,201,.6)',borderDash:[5,4],pointRadius:0,borderWidth:1.5,fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y+' kg'}}},scales:{x:{ticks:{color:'#52546A',font:{size:7},maxTicksLimit:6},grid:{display:false}},y:{ticks:{color:'#52546A',font:{size:8}},grid:{color:'rgba(37,38,47,.5)'}}}}
  });
}
function renderPhaseChart(){
  const pt=phaseTrend();
  const meta=$('wPhMeta');
  if(chartWPh){chartWPh.destroy();chartWPh=null}
  if(!pt||pt.count<2){
    meta.innerHTML='<span>Phase '+(pt?pt.phase:getPh())+' \u2014 pas assez de pes\u00e9es</span>';
    return;
  }
  const pts=pt.points;
  const t0=new Date(pts[0].date).getTime();
  const regPts=pts.map(e=>({x:(new Date(e.date).getTime()-t0)/86400000,y:e.w}));
  const lr=linReg(regPts);
  const regLine=regPts.map(pp=>+(lr.slope*pp.x+lr.intercept).toFixed(2));
  // Color each point by the palier it belongs to (different kcal levels within the phase)
  const kcalLevels=[...new Set(pts.map(e=>e.tgKcal))];
  const palette=['#FDCB6E','#FD79A8','#A29BFE','#00B894','#E17055','#6C5CE7'];
  const colorFor=k=>palette[kcalLevels.indexOf(k)%palette.length];
  const pointColors=pts.map(e=>colorFor(e.tgKcal));
  const spanDays=Math.max(1,(new Date(pt.endDate)-new Date(pt.startDate))/86400000);
  meta.innerHTML='<span>Phase '+pt.phase+' \u00B7 '+pt.count+' pes\u00e9es sur '+Math.round(spanDays+1)+'j \u00B7 '+(pt.rate>0?'+':'')+pt.rate+' kg/sem \u00B7 '+(pt.totalChange>0?'+':'')+pt.totalChange+' kg total \u00B7 R\u00B2 '+pt.r2+' \u00B7 '+kcalLevels.length+' palier'+(kcalLevels.length>1?'s':'')+'</span>';
  chartWPh=new Chart($('wChPh').getContext('2d'),{
    type:'line',
    data:{labels:pts.map(e=>fmtD(e.date)),datasets:[
      {label:'Poids',data:pts.map(e=>e.w),borderColor:'#FDCB6E',backgroundColor:'rgba(253,203,110,.06)',fill:true,tension:.25,pointRadius:3,pointBackgroundColor:pointColors,pointBorderColor:pointColors,borderWidth:2},
      {label:'R\u00e9gression',data:regLine,borderColor:'rgba(253,203,110,.55)',borderDash:[5,4],pointRadius:0,borderWidth:1.5,fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>{const e=pts[ctx.dataIndex];return ctx.dataset.label+': '+ctx.parsed.y+' kg'+(e&&e.tgKcal?' ('+e.tgKcal+' kcal)':'')}}}},scales:{x:{ticks:{color:'#52546A',font:{size:7},maxTicksLimit:7},grid:{display:false}},y:{ticks:{color:'#52546A',font:{size:8}},grid:{color:'rgba(37,38,47,.5)'}}}}
  });
}
function renderWeightAnalysis(){
  const el=$('wAnalysis'),st=weightStats(),ws=getW();
  if(!st||st.count<3){el.innerHTML='<div class="alt info"><span>3 pesees minimum pour l\'analyse</span></div>';return}
  const ph=getPh(),pw=getPW(),tr=trend72();
  // Phase timeline
  let phInfo='Phase '+ph+' ('+PH_NAMES[ph]+') \u2014 x'+PH_MULT[ph];
  // Rate analysis — prefer palier-restricted rate from trend72 when available
  const rRate=(tr&&tr.dir!=='observing')?tr.rate:st.rate;
  let rateMsg='',rateCls='info';
  if(ph==='B'){
    if(rRate<-1){rateMsg='Perte rapide ('+rRate+' kg/sem). Risque de perte musculaire, envisage de ralentir.';rateCls='warn'}
    else if(rRate<0){rateMsg='Deficit efficace ('+rRate+' kg/sem). Rythme optimal entre -0.3 et -0.7.';rateCls='success'}
    else if(rRate>=0){rateMsg='Pas de perte cette semaine. Verifie ton intake ou ajuste -200kcal.';rateCls='danger'}
  }else if(ph==='D'){
    if(rRate>0.5){rateMsg='Prise rapide (+'+rRate+' kg/sem). Reduis de 100-200kcal pour eviter trop de gras.';rateCls='warn'}
    else if(rRate>0){rateMsg='PDM on track (+'+rRate+' kg/sem). Vise +0.2 a +0.4 /sem.';rateCls='success'}
    else{rateMsg='Poids stable ou en baisse. Augmente de +200kcal.';rateCls='danger'}
  }else if(ph==='C'){
    if(Math.abs(rRate)<0.2){rateMsg='Reverse stable. Poids bien controle.';rateCls='success'}
    else if(rRate<-0.2){rateMsg='Encore en perte. Ajoute +200kcal pour reverse.';rateCls='warn'}
    else{rateMsg='Legere prise OK en reverse. Surveille.';rateCls='info'}
  }else if(ph==='F'){
    if(rRate<-1){rateMsg='Baisse tres rapide ('+rRate+' kg/sem). Tiens le palier avant de remonter.';rateCls='warn'}
    else if(rRate<-0.2){rateMsg='Remonte efficace ('+rRate+' kg/sem). Tu perds en remontant les kcal, parfait.';rateCls='success'}
    else if(Math.abs(rRate)<0.2){rateMsg='Plateau atteint. C\'est le moment de remonter +200 kcal.';rateCls='info'}
    else{rateMsg='Prise de poids en remonte (+'+rRate+' kg/sem). Redescends -200 kcal.';rateCls='danger'}
  }else{
    if(rRate<0){rateMsg='Tendance baisse ('+rRate+' kg/sem).';rateCls='success'}
    else if(rRate>0){rateMsg='Tendance hausse (+'+rRate+' kg/sem).';rateCls='warn'}
    else{rateMsg='Poids stable.';rateCls='info'}
  }
  // Variance (consistency)
  const last14=ws.slice(-14).map(w=>w.w);
  let variance=0;if(last14.length>1){const avg=last14.reduce((a,b)=>a+b,0)/last14.length;variance=Math.sqrt(last14.reduce((s,v)=>s+(v-avg)*(v-avg),0)/last14.length)}
  const varMsg=variance<0.3?'Tres stable':'Fluctuations '+(variance<0.6?'normales':'importantes ('+variance.toFixed(1)+' kg)');
  const varCls=variance<0.3?'var(--grn)':variance<0.6?'var(--acc)':'var(--org)';
  let html='<div style="margin-bottom:8px"><span class="chip" style="background:'+PHC[ph]+'20;color:'+PHC[ph]+'">'+phInfo+'</span></div>';
  if(tr&&tr.dir!=='observing'){
    const parts=['Fenetre '+tr.window+'j','conf '+tr.confidence];
    if(tr.adherence!==null)parts.push('adherence '+tr.adherence+'%');
    html+='<div style="font-size:.62rem;color:var(--t3);margin-bottom:6px">'+parts.join(' \u00B7 ')+'</div>';
  }
  html+='<div class="alt '+rateCls+'" style="margin-bottom:6px"><span>'+rateMsg+'</span></div>';
  html+='<div class="sum-row"><div class="sum-box"><div class="sl">Depart</div><div class="sv">'+st.start+'</div></div><div class="sum-box"><div class="sl">Min</div><div class="sv" style="color:var(--grn)">'+st.mn+'</div></div><div class="sum-box"><div class="sl">Max</div><div class="sv" style="color:var(--red)">'+st.mx+'</div></div><div class="sum-box"><div class="sl">Total</div><div class="sv" style="color:'+(st.total<0?'var(--grn)':'var(--red)')+'">'+(st.total>0?'+':'')+st.total+'</div></div></div>';
  html+='<div class="sum-row" style="margin-top:5px"><div class="sum-box"><div class="sl">Moy 30j</div><div class="sv" style="color:var(--pur)">'+st.avg30+'</div></div><div class="sum-box"><div class="sl">Pesees</div><div class="sv">'+st.count+'</div></div><div class="sum-box"><div class="sl">Regularite</div><div class="sv" style="color:var(--org)">'+st.reg+'%</div></div><div class="sum-box"><div class="sl">Fluctuation</div><div class="sv" style="color:'+varCls+'">'+variance.toFixed(1)+'</div></div></div>';
  if(st.estDays){html+='<div class="alt info" style="margin-top:8px;margin-bottom:0"><span>A ce rythme, objectif '+pw+' kg atteint dans ~<strong>'+st.estDays+' jours</strong></span></div>'}
  el.innerHTML=html;
}


// ===== WEIGHT =====
function saveWeight(){const inp=$('wIn');let v=inp.value.replace(',','.');const w=parseFloat(v);if(isNaN(w)||w<20||w>300){inp.style.borderColor='var(--red)';setTimeout(()=>inp.style.borderColor='',600);return}const ws=getW(),td=new Date().toISOString().slice(0,10),ex=ws.findIndex(e=>e.date===td),tgK=getTg().kcal,ph=getPh();if(ex>=0){ws[ex].w=w;ws[ex].tgKcal=tgK;ws[ex].phase=ph}else ws.push({date:td,w,tgKcal:tgK,phase:ph});ws.sort((a,b)=>a.date.localeCompare(b.date));sv("nt_weights",ws);inp.value='';renderCharts()}
let editWDate='';
function openWeightEdit(date,w){
  editWDate=date;
  $('wEditDate').textContent=fmtD(date);
  const ws=getW(),cur=ws.find(e=>e.date===date);
  const en=cur?enrichW(cur):enrichW({date,w:+w});
  $('wEditIn').value=w;
  $('wEditTg').value=en.tgKcal;
  $('wEditAct').value=en.actKcal>0?en.actKcal:'';
  wEditPhase=en.phase;
  renderPhaseSelector('wEditPh',wEditPhase,k=>{wEditPhase=k});
  // Detect if the real kcal comes from a single synthetic import entry (safe to overwrite)
  // or from real meals logged (we refuse to overwrite to avoid data loss).
  const dayItems=dayLog(date);
  const isSyntheticImport=dayItems.length===1&&typeof dayItems[0].food==='string'&&dayItems[0].food.indexOf('Import ')===0;
  let hint='';
  if(dayItems.length===0)hint='Aucun repas trackes pour ce jour. Saisir un reel kcal creera une entree d\'import.';
  else if(isSyntheticImport)hint='Entree d\'import existante \u2014 la valeur sera mise a jour.';
  else hint=dayItems.length+' repas trackes ce jour \u2014 le reel kcal est verrouille (edite via l\'onglet Repas).';
  $('wEditHint').textContent=hint;
  $('wEditAct').disabled=(dayItems.length>0&&!isSyntheticImport);
  $('wEditMo').classList.add('show');
}
function closeWeightEdit(){$('wEditMo').classList.remove('show');editWDate=''}
let wEditPhase='';
function saveWeightEdit(){
  const v=parseFloat(($('wEditIn').value||'').replace(',','.'));
  if(isNaN(v)||v<20||v>300){$('wEditIn').style.borderColor='var(--red)';setTimeout(()=>$('wEditIn').style.borderColor='',600);return}
  const ws=getW(),idx=ws.findIndex(e=>e.date===editWDate);
  if(idx>=0){
    ws[idx].w=v;
    const tgIn=parseInt($('wEditTg').value);
    ws[idx].tgKcal=(!isNaN(tgIn)&&tgIn>0)?tgIn:(typeof ws[idx].tgKcal==='number'?ws[idx].tgKcal:getTg().kcal);
    ws[idx].phase=wEditPhase||(typeof ws[idx].phase==='string'?ws[idx].phase:getPh());
    extendPalierBackward(ws[idx].date,ws[idx].tgKcal,ws[idx].phase);
  }
  sv("nt_weights",ws);
  // Real kcal: overwrite synthetic import if present, otherwise create one when day empty
  if(!$('wEditAct').disabled){
    const actIn=parseInt($('wEditAct').value);
    const log=getLog();
    const dayItems=log[editWDate]||[];
    const isSyntheticImport=dayItems.length===1&&typeof dayItems[0].food==='string'&&dayItems[0].food.indexOf('Import ')===0;
    if(!isNaN(actIn)&&actIn>0){
      if(isSyntheticImport){
        dayItems[0].kcal=actIn;
        log[editWDate]=dayItems;
      }else if(dayItems.length===0){
        log[editWDate]=[{id:Date.now()+Math.random(),food:'Import '+editWDate,meal:1,qty:0,kcal:actIn,p:0,g:0,l:0,f:0}];
      }
      sv("nt_log",log);
    }else if($('wEditAct').value===''&&isSyntheticImport){
      // Clearing the field removes the synthetic import
      delete log[editWDate];
      sv("nt_log",log);
    }
  }
  closeWeightEdit();
  renderCharts();
  if($('tab-home').classList.contains('active'))renderHome();
}
function deleteWeight(){const ws=getW().filter(e=>e.date!==editWDate);sv("nt_weights",ws);closeWeightEdit();renderCharts();if($('tab-home').classList.contains('active'))renderHome()}
function renderPhaseSelector(containerId,selected,onChange){
  const c=$(containerId);
  if(!c)return;
  c.innerHTML='';
  ['A','B','F','C','D','E'].forEach(k=>{
    const btn=document.createElement('div');
    btn.className='ph-btn'+(k===selected?' sel':'');
    btn.style.borderColor=k===selected?PHC[k]:'var(--s3)';
    if(k===selected)btn.style.background=PHC[k]+'22';
    btn.innerHTML='<span class="pl" style="color:'+PHC[k]+'">'+k+'</span>'+PH_NAMES[k];
    btn.addEventListener('click',()=>{onChange(k);renderPhaseSelector(containerId,k,onChange)});
    c.appendChild(btn);
  });
}
function openWeightAdd(){
  const today=new Date().toISOString().slice(0,10);
  $('wAddDate').value=today;
  $('wAddW').value='';
  $('wAddTg').value='';
  $('wAddTg').placeholder=getTg().kcal+' (auto)';
  $('wAddAct').value='';
  wAddPhase=getPh();
  renderPhaseSelector('wAddPh',wAddPhase,k=>{wAddPhase=k});
  $('wAddMo').classList.add('show');
}
function closeWeightAdd(){$('wAddMo').classList.remove('show')}
let wAddPhase='';
function saveWeightAdd(){
  const date=$('wAddDate').value;
  const w=parseFloat(($('wAddW').value||'').replace(',','.'));
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)){$('wAddDate').style.borderColor='var(--red)';setTimeout(()=>$('wAddDate').style.borderColor='',600);return}
  if(isNaN(w)||w<20||w>300){$('wAddW').style.borderColor='var(--red)';setTimeout(()=>$('wAddW').style.borderColor='',600);return}
  const tgIn=parseInt($('wAddTg').value);
  const tgKcal=(!isNaN(tgIn)&&tgIn>0)?tgIn:getTg().kcal;
  const phase=wAddPhase||getPh();
  const ws=getW(),idx=ws.findIndex(e=>e.date===date);
  if(idx>=0){ws[idx].w=w;ws[idx].tgKcal=tgKcal;ws[idx].phase=phase}
  else ws.push({date,w,tgKcal,phase});
  ws.sort((a,b)=>a.date.localeCompare(b.date));
  sv("nt_weights",ws);
  extendPalierBackward(date,tgKcal,phase);
  // Optional real kcal -> synthetic log entry if day empty
  const actIn=parseInt($('wAddAct').value);
  if(!isNaN(actIn)&&actIn>0){
    const log=getLog();
    const existing=log[date]||[];
    if(!existing.length){
      log[date]=[{id:Date.now()+Math.random(),food:'Import '+date,meal:1,qty:0,kcal:actIn,p:0,g:0,l:0,f:0}];
      sv("nt_log",log);
    }
  }
  closeWeightAdd();
  renderCharts();
  if($('tab-home').classList.contains('active'))renderHome();
}
