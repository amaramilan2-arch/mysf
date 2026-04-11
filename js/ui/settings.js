// ===== SETTINGS =====
function renderSettings(){
  const tg=getTg();$('sK').value=tg.kcal;$('sP').value=tg.prot;$('sG').value=tg.gluc;$('sL').value=tg.lip;$('sFib').value=tg.fib||30;$('sW').value=getW().length?getW()[getW().length-1].w:75;$('sH').value=getH();$('sSt').value=getSG();$('sPW').value=getPW();
  // Activity level buttons
  const curAct=ld("nt_activity","moderate");
  const acts=[{k:'sedentary',l:'Sedentaire',m:1.2},{k:'light',l:'Leger',m:1.375},{k:'moderate',l:'Modere',m:1.55},{k:'active',l:'Actif',m:1.725},{k:'very_active',l:'Tres actif',m:1.9}];
  $('actLvl').innerHTML=acts.map(a=>'<button type="button" class="rng-btn'+(a.k===curAct?' sel':'')+'" data-act="'+a.k+'" style="flex:1;min-width:55px">'+a.l+'</button>').join('');
  $('actLvl').querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{sv("nt_activity",b.dataset.act);renderSettings()}));
  // Theme buttons
  const ct=getTheme();$('thDark').className='btn '+(ct==='dark'?'btn-p':'btn-o');$('thLight').className='btn '+(ct==='light'?'btn-p':'btn-o');
  // AI key
  $('aiKey').value=ld('nt_aikey','');$('aiKeyStatus').textContent=ld('nt_aikey','')?'Cle configuree':'Aucune cle configuree';
  renderPresets();renderPhSel();renderPhDet();updateMacroPreview();
  const ac=$('sAcc');
  if(currentUser){ac.innerHTML='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+(currentUser.photoURL?'<img src="'+currentUser.photoURL+'" style="width:40px;height:40px;border-radius:50%;border:2px solid var(--acc)">':'<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--acc),var(--pur));display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:#fff">'+(currentUser.displayName||'?')[0].toUpperCase()+'</div>')+'<div><div style="font-weight:700;font-size:.85rem">'+(currentUser.displayName||'Utilisateur')+'</div><div style="font-size:.65rem;color:var(--t3)">'+(currentUser.email||'')+'</div><div style="font-size:.55rem;color:var(--grn);margin-top:2px">&#x2713; Connecte'+(getDb()?' + Cloud sync':'')+'</div></div></div><button class="btn btn-o" type="button" id="logout" style="width:100%">Deconnexion</button>';$('logout').addEventListener('click',()=>{if(currentUser&&getDb())cloudSave().then(()=>{if(firebaseReady)firebase.auth().signOut();currentUser=null;location.reload()});else{if(firebaseReady)firebase.auth().signOut();currentUser=null;location.reload()}});$('syncBtns').style.display='block'}
  else{ac.innerHTML='<div class="alt info" style="margin:0"><span>Mode local — connecte-toi pour sauvegarder tes donnees dans le cloud et les retrouver sur tous tes appareils.</span></div>';$('syncBtns').style.display='none'}
}
function renderPresets(){
  const el=$('presets');el.innerHTML='';
  Object.keys(MACRO_PRESETS).forEach(name=>{const b=document.createElement('div');b.className='preset-btn';b.textContent=name;b.addEventListener('click',()=>{const pr=MACRO_PRESETS[name],kcal=+$('sK').value||2200;$('pProt').value=pr.p;$('pGluc').value=pr.g;$('pLip').value=pr.l;applyPct()});el.appendChild(b)});
  const custom=document.createElement('div');custom.className='preset-btn';custom.textContent='Custom %';custom.addEventListener('click',()=>{$('pProt').focus()});el.appendChild(custom);
}
function applyPct(){
  const kcal=+$('sK').value||2200,pp=+$('pProt').value||30,pg=+$('pGluc').value||40,pl=+$('pLip').value||30;
  const total=pp+pg+pl;
  if(total!==100)$('pctWarn').innerHTML='<span style="color:var(--org)">Total: '+total+'% '+(total>100?'(depasse 100%)':'(sous 100%)')+'</span>';
  else $('pctWarn').innerHTML='<span style="color:var(--grn)">Total: 100% &#x2713;</span>';
  const prot=Math.round(kcal*pp/100/4),gluc=Math.round(kcal*pg/100/4),lip=Math.round(kcal*pl/100/9);
  $('sP').value=prot;$('sG').value=gluc;$('sL').value=lip;
  updateMacroPreview();
}
function updateMacroPreview(){
  const kcal=+$('sK').value||0,p=+$('sP').value||0,g=+$('sG').value||0,l=+$('sL').value||0,f=+$('sFib').value||0;
  const pK=p*4,gK=g*4,lK=l*9,macroTotal=pK+gK+lK;
  const diff=kcal-macroTotal;
  const pPct=macroTotal?Math.round(pK/macroTotal*100):0,gPct=macroTotal?Math.round(gK/macroTotal*100):0,lPct=macroTotal?Math.round(lK/macroTotal*100):0;
  let html='<div style="margin-bottom:6px"><div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--s3)">';
  html+='<div style="width:'+pPct+'%;background:#4AD295"></div>';
  html+='<div style="width:'+gPct+'%;background:#6EC6FF"></div>';
  html+='<div style="width:'+lPct+'%;background:#FD79A8"></div></div></div>';
  html+='<div class="sum-row"><div class="sum-box"><div class="sl">Prot</div><div class="sv" style="color:#4AD295;font-size:.75rem">'+p+'g <span style="font-size:.55rem;color:var(--t3)">'+pK+' kcal ('+pPct+'%)</span></div></div>';
  html+='<div class="sum-box"><div class="sl">Gluc</div><div class="sv" style="color:#6EC6FF;font-size:.75rem">'+g+'g <span style="font-size:.55rem;color:var(--t3)">'+gK+' kcal ('+gPct+'%)</span></div></div>';
  html+='<div class="sum-box"><div class="sl">Lip</div><div class="sv" style="color:#FD79A8;font-size:.75rem">'+l+'g <span style="font-size:.55rem;color:var(--t3)">'+lK+' kcal ('+lPct+'%)</span></div></div></div>';
  if(Math.abs(diff)>10)html+='<div style="font-size:.65rem;margin-top:4px;color:'+(diff>0?'var(--org)':'var(--red)')+'">Macros = '+macroTotal+' kcal ('+(diff>0?diff+' kcal non repartis':Math.abs(diff)+' kcal en trop')+')</div>';
  else html+='<div style="font-size:.65rem;margin-top:4px;color:var(--grn)">Macros = '+macroTotal+' kcal &#x2713;</div>';
  $('macroPreview').innerHTML=html;
}
function renderPhSel(){const ph=getPh(),c=$('phSel');c.innerHTML='';Object.keys(PH_NAMES).forEach(k=>{const b=document.createElement('div');b.className='ph-btn'+(k===ph?' sel':'');b.style.color=k===ph?PHC[k]:'var(--t2)';b.style.borderColor=k===ph?PHC[k]:'var(--s3)';if(k===ph)b.style.background=PHC[k]+'10';b.innerHTML='<span class="pl">'+k+'</span>'+PH_NAMES[k];b.addEventListener('click',()=>{sv("nt_phase",k);updateBadge();renderPhSel();renderPhDet()});c.appendChild(b)})}
function renderPhDet(){const ph=getPh(),i={A:{c:PHC.A,t:'Pre-prep (x1.0)',d:'Baisse: rien. Stagne: +200kcal.'},B:{c:PHC.B,t:'Deficit (x0.85)',d:'Stagne: -200kcal. Remontee: verifier.'},C:{c:PHC.C,t:'Reverse (x0.90)',d:'Baisse=+200kcal. Stable: rien.'},D:{c:PHC.D,t:'PDM (x1.075)',d:'Baisse: +200kcal.'},E:{c:PHC.E,t:'Reset (x0.88)',d:'Deficit+Reverse.'}}[ph];$('phDet').innerHTML='<div class="ph-det" style="border-color:'+i.c+'"><strong style="color:'+i.c+'">'+ph+' \u2014 '+i.t+'</strong><br>'+i.d+'</div>'}
