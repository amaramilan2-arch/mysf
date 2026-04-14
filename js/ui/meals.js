// ===== MEALS =====
function changeDate(dir){const d=new Date(curDate);d.setDate(d.getDate()+dir);const max=new Date();max.setDate(max.getDate()+7);if(d>max)return;curDate=d.toISOString().slice(0,10);renderMealsTab()}
function renderMealsTab(){
  const today=new Date().toISOString().slice(0,10);const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const tmrStr=tomorrow.toISOString().slice(0,10);
  let lbl=curDate===today?"Aujourd'hui":curDate===tmrStr?'Demain':fmtD(curDate);
  if(curDate>today)lbl+=' (prep)';
  if(curDate<today){const diff=Math.round((new Date(today)-new Date(curDate))/86400000);if(diff===1)lbl='Hier';else if(diff<=3)lbl='il y a '+diff+'j';}
  if($('cDtL'))$('cDtL').textContent=lbl;
  const dtxt=new Date(curDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  $('cDt').textContent=dtxt.charAt(0).toUpperCase()+dtxt.slice(1);
  $('cDt').style.color=curDate>today?'var(--org)':curDate<today?'var(--t3)':'var(--t1)';
  // Daily bento summary
  const t=dayTotals(),tg=getTg();
  const rem=Math.max(0,Math.round(tg.kcal-t.kcal)),pct=tg.kcal?Math.min(100,Math.round(t.kcal/tg.kcal*100)):0;
  const over=t.kcal>tg.kcal;
  const fmtN=n=>n.toLocaleString('fr-FR').replace(/\u202F/g,' ');
  const heroN=over?'+'+fmtN(Math.round(t.kcal-tg.kcal)):fmtN(rem);
  $('mSm').innerHTML=
    '<div class="meal-bento-hero">'+
      '<div class="meal-bento-hero-l">'+
        '<p class="meal-bento-cap">'+(over?'Depassement':'Calories restantes')+'</p>'+
        '<h2 class="meal-bento-v"><span>'+heroN+'</span><span class="meal-bento-u">kcal</span></h2>'+
      '</div>'+
      '<div class="meal-bento-hero-r">'+
        '<p class="meal-bento-cap meal-bento-cap-acc">Objectif : '+fmtN(tg.kcal)+'</p>'+
        '<div class="meal-bento-bar"><div class="meal-bento-bar-f" style="width:'+pct+'%"></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="meal-bento-m"><span class="meal-bento-l">Prot</span><span class="meal-bento-m-v" style="color:var(--acc)">'+Math.round(t.p)+'<span class="meal-bento-m-u">g</span></span></div>'+
    '<div class="meal-bento-m"><span class="meal-bento-l">Gluc</span><span class="meal-bento-m-v" style="color:#4DD0E1">'+Math.round(t.g)+'<span class="meal-bento-m-u">g</span></span></div>'+
    '<div class="meal-bento-m"><span class="meal-bento-l">Lip</span><span class="meal-bento-m-v" style="color:#FF6B9D">'+Math.round(t.l)+'<span class="meal-bento-m-u">g</span></span></div>'+
    '<div class="meal-bento-m"><span class="meal-bento-l">Fib</span><span class="meal-bento-m-v" style="color:#FFB347">'+Math.round(t.f)+'<span class="meal-bento-m-u">g</span></span></div>';
  // Favs
  const favs=getFavs(),recent=getRecent(),all=[...new Set([...favs,...recent])].slice(0,12);
  $('favS').innerHTML=all.length?all.map(f=>'<div class="fav-c" data-f="'+f+'">'+f+'</div>').join(''):'';
  $('favS').querySelectorAll('.fav-c').forEach(c=>c.addEventListener('click',()=>selectFood(c.dataset.f)));
  renderMealTabs();renderMealsList();
}
function renderMealTabs(){const c=$('mT');c.innerHTML='';MEALS.forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.className='meal-tab'+(i===curMeal?' active':'');b.textContent=m;b.addEventListener('click',()=>{curMeal=i;renderMealTabs();renderMealsList()});c.appendChild(b)})}
function renderMealsList(){
  const items=dayLog(),c=$('mC');
  // Show only current meal's items (tabs select which meal), matching mockup flow
  const mi=items.filter(i=>i.meal===curMeal),mk=mi.reduce((s,i)=>s+i.kcal,0);
  let html='<div class="meal-section-head"><h3 class="meal-section-t">'+MEALS[curMeal]+'</h3><span class="meal-section-k">'+Math.round(mk)+' kcal</span></div>';
  if(mi.length){
    html+='<div class="meal-entries">'+mi.map(i=>{
      const qty=i.qty?i.qty+'g':'';
      const macros=[qty,Math.round(i.kcal)+' kcal',i.p?Math.round(i.p)+'g P':''].filter(Boolean).join(' &middot; ');
      return '<div class="meal-entry">'+
        '<div class="meal-entry-l">'+
          '<div class="meal-entry-ico"><span class="material-symbols-outlined">restaurant</span></div>'+
          '<div class="meal-entry-m">'+
            '<h4 class="meal-entry-n" data-eid="'+i.id+'">'+i.food+'</h4>'+
            '<p class="meal-entry-d">'+macros+'</p>'+
          '</div>'+
        '</div>'+
        '<button type="button" class="meal-entry-del" data-id="'+i.id+'" aria-label="Supprimer"><span class="material-symbols-outlined">delete_outline</span></button>'+
      '</div>'
    }).join('')+'</div>';
  }else{
    html+='<div class="meal-empty"><div class="meal-empty-ico"><span class="material-symbols-outlined">restaurant</span></div><p class="meal-empty-t">'+MEALS[curMeal]+' vide</p><p class="meal-empty-s">Utilise la recherche ou (+) pour ajouter</p></div>';
  }
  // Other meals recap (compact)
  const recap=MEALS.map((name,idx)=>{
    if(idx===curMeal)return '';
    const oi=items.filter(i=>i.meal===idx),ok=oi.reduce((s,i)=>s+i.kcal,0);
    return '<button type="button" class="meal-recap" data-mi="'+idx+'"><span class="meal-recap-n">'+name+'</span><span class="meal-recap-c">'+oi.length+' items</span><span class="meal-recap-k">'+Math.round(ok)+' kcal</span></button>'
  }).filter(Boolean).join('');
  if(recap)html+='<div class="meal-recap-head">Autres repas du jour</div><div class="meal-recap-list">'+recap+'</div>';
  c.innerHTML=html;
  c.querySelectorAll('.meal-entry-del').forEach(el=>el.addEventListener('click',function(){rmFood(+this.dataset.id)}));
  c.querySelectorAll('.meal-entry-n[data-eid]').forEach(el=>el.addEventListener('click',function(){editFoodQty(+this.dataset.eid)}));
  c.querySelectorAll('.meal-recap[data-mi]').forEach(el=>el.addEventListener('click',function(){curMeal=+this.dataset.mi;renderMealTabs();renderMealsList()}));
}

// ===== SEARCH =====
function initSearch(){const inp=$('fSr');inp.addEventListener('input',()=>searchFood(inp.value));inp.addEventListener('focus',()=>searchFood(inp.value))}
function searchFood(q){const res=$('fRs');if(!q){res.classList.remove('show');return}const lq=q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const foods=getAllFoods();let m=Object.keys(foods).filter(f=>f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(lq)).slice(0,14);if(!m.length){res.classList.remove('show');return}res.innerHTML='';m.forEach(f=>{const d=foods[f],div=document.createElement('div');div.className='sri';div.innerHTML='<span class="fn">'+f+'</span><span class="fm mono">'+d[0]+'kcal P'+d[1]+' G'+d[2]+' L'+d[3]+' F'+(d[4]||0)+'</span>';div.addEventListener('click',()=>selectFood(f));res.appendChild(div)});res.classList.add('show')}
function selectFood(name){const foods=getAllFoods();if(!foods[name])return;selFood=name;$('fRs').classList.remove('show');$('fSr').value='';const d=foods[name];$('qN').textContent=name;$('qPr').textContent='Pour 100g: '+d[0]+' kcal | P'+d[1]+' G'+d[2]+' L'+d[3]+' Fib'+(d[4]||0);$('qIn').value='100';$('qMo').classList.add('show')}
function closeQty(){$('qMo').classList.remove('show');selFood=null}
function confirmFood(){if(!selFood)return;const foods=getAllFoods();const qty=parseFloat($('qIn').value);if(!qty||qty<=0)return;const d=foods[selFood],m=qty/100;const item={food:selFood,qty:Math.round(qty),kcal:Math.round(d[0]*m*10)/10,p:Math.round(d[1]*m*10)/10,g:Math.round(d[2]*m*10)/10,l:Math.round(d[3]*m*10)/10,f:Math.round((d[4]||0)*m*10)/10,meal:curMeal,id:Date.now()};const log=getLog();if(!log[curDate])log[curDate]=[];log[curDate].push(item);sv("nt_log",log);const rec=getRecent().filter(f=>f!==selFood);rec.unshift(selFood);sv("nt_recent",rec.slice(0,10));const added=selFood;closeQty();renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();toast(added+' ajoute','success')}
function rmFood(id){const log=getLog();if(log[curDate]){log[curDate]=log[curDate].filter(i=>i.id!==id);sv("nt_log",log);renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();toast('Aliment retire','info')}}
function addManualEntry(){
  const name=$('manName').value.trim()||'Saisie manuelle';
  const kcal=+$('manKcal').value||0,p=+$('manP').value||0,g=+$('manG').value||0,l=+$('manL').value||0,f=+$('manF').value||0;
  if(!kcal&&!p&&!g&&!l){$('manKcal').style.borderColor='var(--red)';setTimeout(()=>$('manKcal').style.borderColor='',600);toast('Saisie vide','error');return}
  const item={food:name,qty:0,kcal,p,g,l,f,meal:curMeal,id:Date.now()};
  const log=getLog();if(!log[curDate])log[curDate]=[];log[curDate].push(item);sv("nt_log",log);
  $('manMo').classList.remove('show');$('manName').value='';$('manKcal').value='';$('manP').value='';$('manG').value='';$('manL').value='';$('manF').value='';
  renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
  toast(name+' ajoute','success');
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
