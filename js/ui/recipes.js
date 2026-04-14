// ===== RECIPES =====
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function renderRecipes(){
  const recipes=getRecipes(),el=$('rcList'),cnt=$('rcCount');
  const keys=Object.keys(recipes);
  if(cnt)cnt.textContent=keys.length+' '+(keys.length===1?'RECETTE':'RECETTES');
  if(!keys.length){el.innerHTML='<div class="rcp-empty"><div class="rcp-empty-ico"><span class="material-symbols-outlined">menu_book</span></div><h4>Aucune recette encore</h4><p>Commence a construire ta base de donnees personnalisee.</p></div>';return}
  el.innerHTML=keys.map(k=>{
    const d=recipes[k],name=escHtml(k),nk=d[0]||0,np=d[1]||0,ng=d[2]||0,nl=d[3]||0,nf=d[4]||0;
    return '<div class="rc-item">'+
      '<div class="rc-body">'+
        '<div class="rc-h">'+
          '<h4 class="rc-name">'+name+'</h4>'+
          '<span class="rc-kcal">'+nk+' kcal</span>'+
        '</div>'+
        '<div class="rc-macs">'+
          '<div class="rc-m"><span class="rc-l">Prot</span><span class="rc-v rc-v-p">'+np+'g</span></div>'+
          '<div class="rc-m"><span class="rc-l">Gluc</span><span class="rc-v rc-v-g">'+ng+'g</span></div>'+
          '<div class="rc-m"><span class="rc-l">Lip</span><span class="rc-v rc-v-l">'+nl+'g</span></div>'+
          '<div class="rc-m"><span class="rc-l">Fib</span><span class="rc-v rc-v-f">'+nf+'g</span></div>'+
        '</div>'+
      '</div>'+
      '<button type="button" class="rc-del" data-r="'+name+'" aria-label="Supprimer"><span class="material-symbols-outlined">delete</span></button>'+
    '</div>'
  }).join('');
  el.querySelectorAll('.rc-del').forEach(b=>b.addEventListener('click',function(){const r=getRecipes();delete r[this.dataset.r];sv("nt_recipes",r);renderRecipes()}));
}
function addRecipe(){const name=$('rcName').value.trim();if(!name){toast('Nom requis','error');return}const k=+$('rcKcal').value||0,p=+$('rcProt').value||0,g=+$('rcGluc').value||0,l=+$('rcLip').value||0,f=+$('rcFib').value||0;const r=getRecipes();r[name]=[k,p,g,l,f];sv("nt_recipes",r);$('rcName').value='';$('rcKcal').value='';$('rcProt').value='';$('rcGluc').value='';$('rcLip').value='';$('rcFib').value='';renderRecipes();toast(name+' enregistree','success')}

// ===== SAVED MEALS =====
function openSavedMeals(){renderSavedMealsList();$('smMo').classList.add('show')}
function renderSavedMealsList(){
  const meals=getSavedMeals(),el=$('smList');
  if(!meals.length){el.innerHTML='<div class="empty" data-ico="\u2B50" style="margin:10px 0">Aucun repas sauvegarde</div>';return}
  el.innerHTML=meals.map((m,i)=>{
    const tk=m.items.reduce((s,x)=>s+x.kcal,0),tp=m.items.reduce((s,x)=>s+x.p,0),tg=m.items.reduce((s,x)=>s+x.g,0),tl=m.items.reduce((s,x)=>s+x.l,0);
    const detail=m.items.map(x=>x.food+' '+x.qty+'g').join(', ');
    return '<div class="sm-item"><div class="sm-name">'+m.name+'</div><div class="sm-detail">'+detail+'</div><div class="sm-macros mono">'+Math.round(tk)+' kcal | P'+Math.round(tp)+' G'+Math.round(tg)+' L'+Math.round(tl)+'</div><div class="sm-acts"><button class="btn btn-p btn-sm" data-smi="'+i+'">Ajouter</button><button class="btn btn-d btn-sm" data-smd="'+i+'">Supprimer</button></div></div>'
  }).join('');
  el.querySelectorAll('[data-smi]').forEach(b=>b.addEventListener('click',function(){loadSavedMeal(+this.dataset.smi)}));
  el.querySelectorAll('[data-smd]').forEach(b=>b.addEventListener('click',function(){deleteSavedMeal(+this.dataset.smd)}));
}
function saveMealCombo(){
  const name=$('smName').value.trim();if(!name)return;
  const items=dayLog().filter(x=>x.meal===curMeal);
  if(!items.length){$('smName').style.borderColor='var(--red)';setTimeout(()=>$('smName').style.borderColor='',600);return}
  const meals=getSavedMeals();
  meals.push({name,items:items.map(x=>({food:x.food,qty:x.qty,kcal:x.kcal,p:x.p,g:x.g,l:x.l,f:x.f||0}))});
  sv("nt_savedmeals",meals);$('smName').value='';renderSavedMealsList();
}
function loadSavedMeal(idx){
  const meals=getSavedMeals(),m=meals[idx];if(!m)return;
  const log=getLog();if(!log[curDate])log[curDate]=[];
  m.items.forEach(x=>{log[curDate].push({...x,meal:curMeal,id:Date.now()+Math.random()*1000|0})});
  sv("nt_log",log);$('smMo').classList.remove('show');renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
}
function deleteSavedMeal(idx){
  const meals=getSavedMeals();meals.splice(idx,1);sv("nt_savedmeals",meals);renderSavedMealsList();
}


