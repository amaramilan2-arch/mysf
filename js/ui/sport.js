// ===== SPORT =====
function renderSport(){
  // Sport type tabs
  document.querySelectorAll('.sport-type-btn').forEach(b=>{b.classList.toggle('sel',b.dataset.st===curSportType)});
  $('sportMuscu').style.display=curSportType==='muscu'?'block':'none';
  $('sportOther').style.display=curSportType!=='muscu'?'block':'none';
  if(curSportType==='muscu'){
    const g=$('splitGrid');g.innerHTML='';
    SPLITS.forEach(s=>{const b=document.createElement('div');b.className='split-btn'+(curSplit===s?' sel':'');b.textContent=s;b.addEventListener('click',()=>{curSplit=curSplit===s?'':s;renderSport()});g.appendChild(b)});
    const vl=$('volList');
    const muscles=curSplit?SPLIT_MUSCLES[curSplit.replace(' ','')]||ALL_MUSCLES:ALL_MUSCLES;
    vl.innerHTML=muscles.map(m=>'<div class="vol-item"><span class="vn">'+m+'</span><input type="number" inputmode="numeric" class="inp" data-mu="'+m+'" value="'+(curVolume[m]||'')+'" placeholder="0" style="width:50px;padding:5px;text-align:center"></div>').join('');
    vl.querySelectorAll('input').forEach(inp=>inp.addEventListener('change',()=>{curVolume[inp.dataset.mu]=+inp.value||0}));
  } else {
    const sports=SPORT_CATEGORIES[curSportType]||[];
    const g=$('otherSportGrid');g.innerHTML='';
    sports.forEach(s=>{const b=document.createElement('div');b.className='split-btn'+(curOtherSport===s?' sel':'');b.textContent=s;b.addEventListener('click',()=>{curOtherSport=curOtherSport===s?'':s;renderSport()});g.appendChild(b)});
  }
  renderWkHist();
}
function saveWk(){const tp=curSplit||'Seance';const dur=+$('wkDur').value||0,notes=$('wkNotes').value.trim();const wk=getWk();const vol=Object.entries(curVolume).filter(([k,v])=>v>0).map(([k,v])=>({name:k,sets:v}));wk.push({id:Date.now(),date:new Date().toISOString().slice(0,10),type:tp,dur,muscles:vol,notes});sv("nt_workouts",wk);$('wkDur').value='';$('wkNotes').value='';curSplit='';curVolume={};renderSport();toast('Seance '+tp+' enregistree','success')}
function saveOtherSport(){const tp=curOtherSport||'Sport';const dur=+$('osDur').value||0,cal=+$('osCal').value||0,notes=$('osNotes').value.trim();if(!dur){toast('Duree requise','error');return}const wk=getWk();wk.push({id:Date.now(),date:new Date().toISOString().slice(0,10),type:tp,dur,cal,notes});sv("nt_workouts",wk);$('osDur').value='';$('osCal').value='';$('osNotes').value='';curOtherSport='';renderSport();toast(tp+' enregistre','success')}
function delWk(id){sv("nt_workouts",getWk().filter(w=>w.id!==id));renderWkHist()}
function renderWkHist(){const wks=[...getWk()].reverse().slice(0,15),el=$('wkHist');if(!wks.length){el.innerHTML='<div class="card"><div class="empty" data-ico="\u{1F3CB}\uFE0F">Aucune seance enregistree</div></div>';return}el.innerHTML='';wks.forEach(w=>{const d=document.createElement('div');d.className='whi';const calInfo=w.cal?'<span class="wmc" style="background:var(--orgG);color:var(--org)">'+w.cal+' kcal</span>':'';d.innerHTML='<div class="wt"><div><span class="wtp">'+w.type+'</span> <span class="wdu mono">'+w.dur+'min</span></div><div><span class="wdd">'+fmtD(w.date)+'</span> <span class="wdel" data-wid="'+w.id+'">\u{1F5D1}</span></div></div>'+(w.muscles&&w.muscles.length?'<div class="wm">'+w.muscles.map(m=>'<span class="wmc">'+m.name+' '+m.sets+'s</span>').join('')+'</div>':'')+(calInfo?'<div class="wm">'+calInfo+'</div>':'')+(w.notes?'<div style="margin-top:3px;font-size:.62rem;color:var(--t3);font-style:italic">'+w.notes+'</div>':'');d.querySelector('.wdel').addEventListener('click',function(){delWk(+this.dataset.wid)});el.appendChild(d)})}
