// ===== MEALS =====
function changeDate(dir){const d=new Date(curDate);d.setDate(d.getDate()+dir);const max=new Date();max.setDate(max.getDate()+7);if(d>max)return;curDate=d.toISOString().slice(0,10);renderMealsTab()}
function renderMealsTab(){
  const today=new Date().toISOString().slice(0,10);const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const tmrStr=tomorrow.toISOString().slice(0,10);
  let lbl=curDate===today?"Aujourd'hui":curDate===tmrStr?'Demain':fmtD(curDate);
  if(curDate>today)lbl+=' (prep)';
  if(curDate<today){const diff=Math.round((new Date(today)-new Date(curDate))/86400000);if(diff===1)lbl='Hier';else if(diff<=3)lbl='il y a '+diff+'j';}
  $('cDt').textContent=lbl;$('cDt').style.color=curDate>today?'var(--org)':curDate<today?'var(--t3)':'var(--t1)';
  const t=dayTotals();$('mSm').innerHTML='<div><div class="mv mono" style="color:var(--org)">'+Math.round(t.kcal)+'</div><div class="ml">kcal</div></div><div><div class="mv mono" style="color:var(--acc)">'+Math.round(t.p)+'g</div><div class="ml">prot</div></div><div><div class="mv mono" style="color:var(--grn)">'+Math.round(t.g)+'g</div><div class="ml">gluc</div></div><div><div class="mv mono" style="color:var(--pnk)">'+Math.round(t.l)+'g</div><div class="ml">lip</div></div><div><div class="mv mono" style="color:var(--brn)">'+Math.round(t.f)+'g</div><div class="ml">fib</div></div>';
  // Favs
  const favs=getFavs(),recent=getRecent(),all=[...new Set([...favs,...recent])].slice(0,12);
  $('favS').innerHTML=all.length?all.map(f=>'<div class="fav-c" data-f="'+f+'">'+f+'</div>').join(''):'';
  $('favS').querySelectorAll('.fav-c').forEach(c=>c.addEventListener('click',()=>selectFood(c.dataset.f)));
  renderMealTabs();renderMealsList();
}
function renderMealTabs(){const c=$('mT');c.innerHTML='';MEALS.forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.className='meal-tab'+(i===curMeal?' active':'');b.textContent=m;b.addEventListener('click',()=>{curMeal=i;renderMealTabs()});c.appendChild(b)})}
function renderMealsList(){
  const items=dayLog(),c=$('mC'),foods=getAllFoods();
  c.innerHTML=MEALS.map((name,idx)=>{const mi=items.filter(i=>i.meal===idx),mk=mi.reduce((s,i)=>s+i.kcal,0);
    return '<div class="m-section card"><div class="m-header"><h3>'+name+'</h3><span class="mk mono">'+Math.round(mk)+'</span></div>'+(mi.length?mi.map(i=>'<div class="mi"><span class="mn" data-eid="'+i.id+'" style="cursor:pointer">'+i.food+'</span><span class="mf mono">'+(i.qty?i.qty+'g\u00B7':'')+Math.round(i.kcal)+'</span><span class="md" data-id="'+i.id+'">\u00D7</span></div>').join(''):'<div class="empty">Vide</div>')+'</div>'}).join('');
  c.querySelectorAll('.md').forEach(el=>el.addEventListener('click',function(){rmFood(+this.dataset.id)}));
  c.querySelectorAll('.mn[data-eid]').forEach(el=>el.addEventListener('click',function(){editFoodQty(+this.dataset.eid)}));
}

// ===== SEARCH =====
function initSearch(){const inp=$('fSr');inp.addEventListener('input',()=>searchFood(inp.value));inp.addEventListener('focus',()=>searchFood(inp.value))}
function searchFood(q){const res=$('fRs');if(!q){res.classList.remove('show');return}const lq=q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const foods=getAllFoods();let m=Object.keys(foods).filter(f=>f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(lq)).slice(0,14);if(!m.length){res.classList.remove('show');return}res.innerHTML='';m.forEach(f=>{const d=foods[f],div=document.createElement('div');div.className='sri';div.innerHTML='<span class="fn">'+f+'</span><span class="fm mono">'+d[0]+'kcal P'+d[1]+' G'+d[2]+' L'+d[3]+' F'+(d[4]||0)+'</span>';div.addEventListener('click',()=>selectFood(f));res.appendChild(div)});res.classList.add('show')}
function selectFood(name){const foods=getAllFoods();if(!foods[name])return;selFood=name;$('fRs').classList.remove('show');$('fSr').value='';const d=foods[name];$('qN').textContent=name;$('qPr').textContent='Pour 100g: '+d[0]+' kcal | P'+d[1]+' G'+d[2]+' L'+d[3]+' Fib'+(d[4]||0);$('qIn').value='100';$('qMo').classList.add('show')}
function closeQty(){$('qMo').classList.remove('show');selFood=null}
function confirmFood(){if(!selFood)return;const foods=getAllFoods();const qty=parseFloat($('qIn').value);if(!qty||qty<=0)return;const d=foods[selFood],m=qty/100;const item={food:selFood,qty:Math.round(qty),kcal:Math.round(d[0]*m*10)/10,p:Math.round(d[1]*m*10)/10,g:Math.round(d[2]*m*10)/10,l:Math.round(d[3]*m*10)/10,f:Math.round((d[4]||0)*m*10)/10,meal:curMeal,id:Date.now()};const log=getLog();if(!log[curDate])log[curDate]=[];log[curDate].push(item);sv("nt_log",log);const rec=getRecent().filter(f=>f!==selFood);rec.unshift(selFood);sv("nt_recent",rec.slice(0,10));closeQty();renderMealsTab();if($('tab-home').classList.contains('active'))renderHome()}
function rmFood(id){const log=getLog();if(log[curDate]){log[curDate]=log[curDate].filter(i=>i.id!==id);sv("nt_log",log);renderMealsTab();if($('tab-home').classList.contains('active'))renderHome()}}
function addManualEntry(){
  const name=$('manName').value.trim()||'Saisie manuelle';
  const kcal=+$('manKcal').value||0,p=+$('manP').value||0,g=+$('manG').value||0,l=+$('manL').value||0,f=+$('manF').value||0;
  if(!kcal&&!p&&!g&&!l){$('manKcal').style.borderColor='var(--red)';setTimeout(()=>$('manKcal').style.borderColor='',600);return}
  const item={food:name,qty:0,kcal,p,g,l,f,meal:curMeal,id:Date.now()};
  const log=getLog();if(!log[curDate])log[curDate]=[];log[curDate].push(item);sv("nt_log",log);
  $('manMo').classList.remove('show');$('manName').value='';$('manKcal').value='';$('manP').value='';$('manG').value='';$('manL').value='';$('manF').value='';
  renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
}
function editFoodQty(id){
  const log=getLog(),items=log[curDate];if(!items)return;
  const item=items.find(i=>i.id===id);if(!item)return;
  const foods=getAllFoods(),d=foods[item.food];if(!d)return;
  const nq=prompt('Modifier la quantite (g) pour '+item.food+':',item.qty);
  if(nq===null)return;const qty=parseFloat(nq);if(!qty||qty<=0)return;
  const m=qty/100;item.qty=Math.round(qty);item.kcal=Math.round(d[0]*m*10)/10;item.p=Math.round(d[1]*m*10)/10;item.g=Math.round(d[2]*m*10)/10;item.l=Math.round(d[3]*m*10)/10;item.f=Math.round((d[4]||0)*m*10)/10;
  sv("nt_log",log);renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
}
