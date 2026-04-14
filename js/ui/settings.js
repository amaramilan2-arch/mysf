// ===== SETTINGS =====
const PH_DESC={
  A:'Maintenance et preparation',
  B:'Seche controlee progressive',
  F:'Remonte post-seche',
  C:'Reverse diet graduel',
  D:'Prise de masse propre',
  E:'Reset metabolique'
};
function renderSettings(){
  const tg=getTg();$('sK').value=tg.kcal;$('sP').value=tg.prot;$('sG').value=tg.gluc;$('sL').value=tg.lip;$('sFib').value=tg.fib||30;$('sW').value=getW().length?getW()[getW().length-1].w:75;$('sH').value=getH();$('sSt').value=getSG();$('sPW').value=getPW();
  // Activity level pills
  const curAct=ld("nt_activity","moderate");
  const acts=[{k:'sedentary',l:'Sedentaire'},{k:'light',l:'Leger'},{k:'moderate',l:'Modere'},{k:'active',l:'Actif'},{k:'very_active',l:'Athlete'}];
  $('actLvl').innerHTML=acts.map(a=>'<button type="button" class="set-pill'+(a.k===curAct?' sel':'')+'" data-act="'+a.k+'">'+a.l.toUpperCase()+'</button>').join('');
  $('actLvl').querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{sv("nt_activity",b.dataset.act);renderSettings()}));
  // Theme buttons
  const ct=getTheme();
  $('thDark').className='set-theme-btn'+(ct==='dark'?' sel':'');
  $('thLight').className='set-theme-btn'+(ct==='light'?' sel':'');
  // AI key
  $('aiKey').value=ld('nt_aikey','');
  const hasKey=!!ld('nt_aikey','');
  $('aiKeyStatus').innerHTML=hasKey?'<span class="set-status-ok"><span class="material-symbols-outlined">check_circle</span>Cle configuree</span>':'<span class="set-status-mute">Aucune cle configuree</span>';
  renderPresets();renderPhSel();renderPhDet();updateMacroPreview();
  // Account block
  const ac=$('sAcc');
  if(currentUser){
    const initial=(currentUser.displayName||'?')[0].toUpperCase();
    const avatar=currentUser.photoURL
      ?'<img src="'+currentUser.photoURL+'" class="set-acc-avatar">'
      :'<div class="set-acc-avatar set-acc-avatar-fallback">'+initial+'</div>';
    ac.innerHTML='<div class="set-acc-row">'+avatar+'<div class="set-acc-meta"><div class="set-acc-name">'+(currentUser.displayName||'Utilisateur')+'</div><div class="set-acc-mail">'+(currentUser.email||'')+'</div><div class="set-acc-st"><span class="material-symbols-outlined">cloud_done</span>Connecte'+(getDb()?' + cloud sync':'')+'</div></div><button class="set-acc-logout" type="button" id="logout" aria-label="Deconnexion"><span class="material-symbols-outlined">logout</span></button></div>';
    $('logout').addEventListener('click',()=>{if(currentUser&&getDb())cloudSave().then(()=>{if(firebaseReady)firebase.auth().signOut();currentUser=null;location.reload()});else{if(firebaseReady)firebase.auth().signOut();currentUser=null;location.reload()}});
    $('syncBtns').style.display='flex';
  }else{
    ac.innerHTML='<div class="set-acc-guest"><span class="material-symbols-outlined">person_off</span><p><strong>Mode local</strong><br>Connecte-toi pour sauvegarder tes donnees dans le cloud et les retrouver sur tous tes appareils.</p></div>';
    $('syncBtns').style.display='none';
  }
}
function renderPresets(){
  const el=$('presets');el.innerHTML='';
  Object.keys(MACRO_PRESETS).forEach(name=>{const b=document.createElement('button');b.type='button';b.className='set-preset-btn';b.textContent=name.toUpperCase();b.addEventListener('click',()=>{const pr=MACRO_PRESETS[name];$('pProt').value=pr.p;$('pGluc').value=pr.g;$('pLip').value=pr.l;applyPct();el.querySelectorAll('.set-preset-btn').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')});el.appendChild(b)});
  const custom=document.createElement('button');custom.type='button';custom.className='set-preset-btn';custom.textContent='CUSTOM';custom.addEventListener('click',()=>{$('pProt').focus();el.querySelectorAll('.set-preset-btn').forEach(x=>x.classList.remove('sel'));custom.classList.add('sel')});el.appendChild(custom);
}
function applyPct(){
  const kcal=+$('sK').value||2200,pp=+$('pProt').value||30,pg=+$('pGluc').value||40,pl=+$('pLip').value||30;
  const total=pp+pg+pl;
  if(total!==100)$('pctWarn').innerHTML='<span class="set-pct-warn-msg warn">Total: '+total+'% '+(total>100?'(depasse 100%)':'(sous 100%)')+'</span>';
  else $('pctWarn').innerHTML='<span class="set-pct-warn-msg ok">Total: 100% &#x2713;</span>';
  const prot=Math.round(kcal*pp/100/4),gluc=Math.round(kcal*pg/100/4),lip=Math.round(kcal*pl/100/9);
  $('sP').value=prot;$('sG').value=gluc;$('sL').value=lip;
  updateMacroPreview();
}
function updateMacroPreview(){
  const kcal=+$('sK').value||0,p=+$('sP').value||0,g=+$('sG').value||0,l=+$('sL').value||0,f=+$('sFib').value||0;
  const pK=p*4,gK=g*4,lK=l*9,macroTotal=pK+gK+lK;
  const diff=kcal-macroTotal;
  const pPct=macroTotal?Math.round(pK/macroTotal*100):0,gPct=macroTotal?Math.round(gK/macroTotal*100):0,lPct=macroTotal?Math.round(lK/macroTotal*100):0;
  // Update macro bar indicators (mini bars above the input)
  const grid=document.querySelectorAll('.set-macro-f .set-macro-bar span');
  if(grid.length>=4){
    grid[0].style.width=Math.min(100,pPct*1.5)+'%';
    grid[1].style.width=Math.min(100,gPct*1.5)+'%';
    grid[2].style.width=Math.min(100,lPct*3)+'%';
    grid[3].style.width=f?Math.min(100,Math.round(f/35*100))+'%':'0%';
  }
  let html='<div class="set-macro-preview">';
  html+='<div class="set-macro-preview-bar"><div style="width:'+pPct+'%;background:#6AEFAF"></div><div style="width:'+gPct+'%;background:#4DD0E1"></div><div style="width:'+lPct+'%;background:#FF6B9D"></div></div>';
  html+='<div class="set-macro-preview-grid">';
  html+='<div><span class="set-mp-l">Prot</span><span class="set-mp-v" style="color:#6AEFAF">'+p+'g</span><span class="set-mp-s">'+pK+' kcal &middot; '+pPct+'%</span></div>';
  html+='<div><span class="set-mp-l">Gluc</span><span class="set-mp-v" style="color:#4DD0E1">'+g+'g</span><span class="set-mp-s">'+gK+' kcal &middot; '+gPct+'%</span></div>';
  html+='<div><span class="set-mp-l">Lip</span><span class="set-mp-v" style="color:#FF6B9D">'+l+'g</span><span class="set-mp-s">'+lK+' kcal &middot; '+lPct+'%</span></div>';
  html+='</div>';
  if(Math.abs(diff)>10)html+='<div class="set-mp-diff '+(diff>0?'warn':'err')+'">Macros = '+macroTotal+' kcal ('+(diff>0?diff+' kcal non repartis':Math.abs(diff)+' kcal en trop')+')</div>';
  else html+='<div class="set-mp-diff ok">Macros = '+macroTotal+' kcal &#x2713;</div>';
  html+='</div>';
  $('macroPreview').innerHTML=html;
}
function renderPhSel(){
  const ph=getPh(),c=$('phSel');c.innerHTML='';
  Object.keys(PH_NAMES).forEach(k=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='set-ph-card'+(k===ph?' sel':'');
    b.style.setProperty('--ph-color',PHC[k]);
    b.innerHTML='<span class="ph-letter">'+k+'</span><span class="ph-name">'+PH_NAMES[k]+'</span><span class="ph-desc">'+(PH_DESC[k]||'')+'</span>';
    b.addEventListener('click',()=>{sv("nt_phase",k);updateBadge();renderPhSel();renderPhDet()});
    c.appendChild(b);
  });
}
function renderPhDet(){const ph=getPh(),i={A:{c:PHC.A,t:'Pre-prep (x1.0)',d:'Baisse: rien. Stagne: +200kcal.'},B:{c:PHC.B,t:'Deficit (x0.85)',d:'Stagne: -200kcal. Remontee: verifier.'},F:{c:PHC.F,t:'Remonte (x0.92)',d:'Remonte les kcal en continuant a perdre. Stable=+200, prise=-200.'},C:{c:PHC.C,t:'Reverse (x0.90)',d:'Baisse=+200kcal. Stable: rien.'},D:{c:PHC.D,t:'PDM (x1.075)',d:'Baisse: +200kcal.'},E:{c:PHC.E,t:'Reset (x0.88)',d:'Deficit+Reverse.'}}[ph];$('phDet').innerHTML='<div class="ph-det" style="border-color:'+i.c+'"><strong style="color:'+i.c+'">'+ph+' \u2014 '+i.t+'</strong><br>'+i.d+'</div>'}
