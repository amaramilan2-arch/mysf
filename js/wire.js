// ===== WIRING =====
function wire(){
  $('dP').addEventListener('click',()=>changeDate(-1));$('dN').addEventListener('click',()=>changeDate(1));
  $('phPill').addEventListener('click',()=>$('phM').classList.add('show'));
  $('phM').addEventListener('click',e=>{if(e.target===$('phM'))$('phM').classList.remove('show')});$('phMC').addEventListener('click',()=>$('phM').classList.remove('show'));
  $('qMo').addEventListener('click',e=>{if(e.target===$('qMo'))closeQty()});$('qNo').addEventListener('click',closeQty);$('qYes').addEventListener('click',confirmFood);
  [25,50,100,150,200,250,300].forEach(v=>{const b=document.createElement('button');b.type='button';b.textContent=v+'g';b.addEventListener('click',()=>{$('qIn').value=v});$('qQ').appendChild(b)});
  $('wAdd').addEventListener('click',saveWeight);
  $('wkSave').addEventListener('click',saveWk);
  $('osSave').addEventListener('click',saveOtherSport);
  $('rcAdd').addEventListener('click',addRecipe);
  // Sport type tabs
  document.querySelectorAll('.sport-type-btn').forEach(b=>b.addEventListener('click',()=>{curSportType=b.dataset.st;curOtherSport='';renderSport()}));
  // Home weight
  $('wHAdd').addEventListener('click',()=>{const v=parseFloat(($('wHIn').value||'').replace(',','.'));if(isNaN(v)||v<20||v>300){$('wHIn').style.borderColor='var(--red)';setTimeout(()=>$('wHIn').style.borderColor='',600);toast('Poids invalide','error');return}const ws=getW(),td=new Date().toISOString().slice(0,10),ex=ws.findIndex(e=>e.date===td),tgK=getTg().kcal,ph=getPh();if(ex>=0){ws[ex].w=v;ws[ex].tgKcal=tgK;ws[ex].phase=ph}else ws.push({date:td,w:v,tgKcal:tgK,phase:ph});ws.sort((a,b)=>a.date.localeCompare(b.date));sv("nt_weights",ws);$('wHIn').value='';renderHome();toast('Poids enregistre '+v+' kg','success')});
  // Water +/-
  $('wPlus').addEventListener('click',()=>{const w=getWater();w[curDate]=Math.min((w[curDate]||0)+1,12);sv("nt_water",w);renderHome()});
  $('wMinus').addEventListener('click',()=>{const w=getWater();w[curDate]=Math.max((w[curDate]||0)-1,0);sv("nt_water",w);renderHome()});
  // Steps modal
  $('stepsCard').addEventListener('click',()=>{const s=getSteps();$('stepIn').value=s[curDate]||'';$('stepMo').classList.add('show')});
  $('stepMo').addEventListener('click',e=>{if(e.target===$('stepMo'))$('stepMo').classList.remove('show')});
  $('stepNo').addEventListener('click',()=>$('stepMo').classList.remove('show'));
  $('stepOk').addEventListener('click',()=>{const v=+$('stepIn').value||0;const s=getSteps();s[curDate]=v;sv("nt_steps",s);$('stepMo').classList.remove('show');renderHome()});
  document.querySelectorAll('[data-stepq]').forEach(b=>b.addEventListener('click',()=>{const cur=+$('stepIn').value||0;$('stepIn').value=cur+(+b.dataset.stepq)}));
  // Weight edit
  $('wEditMo').addEventListener('click',e=>{if(e.target===$('wEditMo'))closeWeightEdit()});
  $('wEditNo').addEventListener('click',closeWeightEdit);
  $('wEditOk').addEventListener('click',saveWeightEdit);
  $('wEditDel').addEventListener('click',()=>{if(confirm('Supprimer cette pesee ?'))deleteWeight()});
  // Weight add (historique)
  $('wAddBtn').addEventListener('click',openWeightAdd);
  $('wAddMo').addEventListener('click',e=>{if(e.target===$('wAddMo'))closeWeightAdd()});
  $('wAddNo').addEventListener('click',closeWeightAdd);
  $('wAddOk').addEventListener('click',saveWeightAdd);
  // Manual entry
  $('manualBtn').addEventListener('click',()=>$('manMo').classList.add('show'));
  $('manMo').addEventListener('click',e=>{if(e.target===$('manMo'))$('manMo').classList.remove('show')});
  $('manNo').addEventListener('click',()=>$('manMo').classList.remove('show'));
  $('manOk').addEventListener('click',addManualEntry);
  // Saved meals
  $('smBtn').addEventListener('click',openSavedMeals);
  $('smMo').addEventListener('click',e=>{if(e.target===$('smMo'))$('smMo').classList.remove('show')});
  $('smClose').addEventListener('click',()=>$('smMo').classList.remove('show'));
  $('smSave').addEventListener('click',saveMealCombo);
  // Barcode scanner
  $('scanBtn').addEventListener('click',openScanner);
  $('scClose').addEventListener('click',closeScanner);
  $('scMo').addEventListener('click',e=>{if(e.target===$('scMo'))closeScanner()});
  $('scManGo').addEventListener('click',scanManualSubmit);
  $('scMan').addEventListener('keydown',e=>{if(e.key==='Enter')scanManualSubmit()});
  // AI meal analysis
  $('aiBtn').addEventListener('click',()=>{aiReset();$('aiMo').classList.add('show')});
  $('aiMo').addEventListener('click',e=>{if(e.target===$('aiMo')){$('aiMo').classList.remove('show');aiReset()}});
  $('aiNo').addEventListener('click',()=>{$('aiMo').classList.remove('show');aiReset()});
  $('aiGo').addEventListener('click',aiAnalyze);
  $('aiRetry').addEventListener('click',()=>{$('aiResult').style.display='none';$('aiAddActions').style.display='none';$('aiActions').style.display='flex'});
  $('aiAddAll').addEventListener('click',aiAddAllToLog);
  $('aiPhotoClear').addEventListener('click',()=>{aiImageB64=null;$('aiImg').src='';$('aiPreview').style.display='none';$('aiPhotoLabel').style.display='flex'});
  $('aiPhotoIn').addEventListener('change',e=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      const compressed=await compressImage(ev.target.result,1024,0.7);
      aiImageB64=compressed;$('aiImg').src=compressed;$('aiPreview').style.display='block';$('aiPhotoLabel').style.display='none';
    };
    reader.readAsDataURL(file);e.target.value='';
  });
  // Voice dictation (Web Speech API)
  $('aiMic').addEventListener('click',()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){const s=$('aiMicStatus');s.style.display='block';s.style.color='var(--red)';s.textContent='Dictee vocale non supportee sur ce navigateur.';return}
    if(aiMicRec){try{aiMicRec.stop()}catch{}aiMicRec=null;return}
    const rec=new SR();
    rec.lang='fr-FR';rec.interimResults=true;rec.continuous=true;
    const ta=$('aiDesc'),st=$('aiMicStatus'),btn=$('aiMic');
    const baseText=ta.value?ta.value.replace(/\s+$/,'')+' ':'';
    rec.onstart=()=>{st.style.display='block';st.style.color='var(--acc)';st.textContent='\u{1F399}\uFE0F Dictee en cours... (touche pour arreter)';btn.style.background='var(--acc)';btn.style.color='#0a0c14'};
    rec.onresult=e=>{let interim='',final='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)final+=r[0].transcript;else interim+=r[0].transcript}ta.value=baseText+final+interim};
    rec.onerror=ev=>{st.style.display='block';st.style.color='var(--red)';st.textContent='Erreur dictee: '+(ev.error==='not-allowed'?'microphone refuse':ev.error==='no-speech'?'aucune parole detectee':ev.error);btn.style.background='';btn.style.color='';aiMicRec=null};
    rec.onend=()=>{btn.style.background='';btn.style.color='';if(aiMicRec===rec){aiMicRec=null;if(st.style.color!=='var(--red)'){st.textContent='Dictee terminee';setTimeout(()=>{if(!aiMicRec)st.style.display='none'},1500)}}};
    try{rec.start();aiMicRec=rec}catch(e){st.style.display='block';st.style.color='var(--red)';st.textContent='Impossible de demarrer la dictee';aiMicRec=null}
  });
  // AI key save
  $('aiKey').addEventListener('change',()=>{const v=$('aiKey').value.trim();sv('nt_aikey',v);$('aiKeyStatus').innerHTML=v?'<span class="set-status-ok"><span class="material-symbols-outlined">check_circle</span>Cle sauvegardee</span>':'<span class="set-status-mute">Aucune cle configuree</span>';if(v)toast('Cle API sauvegardee','success')});
  // Settings
  $('sSave').addEventListener('click',()=>{sv("nt_targets",{kcal:+$('sK').value||2200,prot:+$('sP').value||150,gluc:+$('sG').value||250,lip:+$('sL').value||75,fib:+$('sFib').value||30});sv("nt_pw",parseFloat(($('sPW').value||'75').replace(',','.'))||75);sv("nt_height",+$('sH').value||175);sv("nt_sg",+$('sSt').value||10000);if($('tab-home').classList.contains('active'))renderHome();toast('Reglages sauvegardes','success')});
  $('sCalc').addEventListener('click',()=>{
    const pw=parseFloat(($('sW').value||'75').replace(',','.'))||75,h=+$('sH').value||175,sg=+$('sSt').value||10000,m=PH_MULT[getPh()];
    const actMult={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very_active:1.9};
    const act=ld("nt_activity","moderate"),am=actMult[act]||1.55;
    // Mifflin-St Jeor + activity + phase
    const bmr=10*pw+6.25*h-5*30-5;// assume ~30 years, male approx
    const tdeeBase=Math.round(bmr*am);
    const stepBonus=Math.round(Math.max(0,(sg-5000)*0.04));
    const tdeeRaw=tdeeBase+stepBonus;
    const tdee=Math.round(tdeeRaw*m);
    const prot=Math.round(pw*2),lip=Math.round(pw*1),gluc=Math.max(0,Math.round((tdee-prot*4-lip*9)/4));
    $('sK').value=tdee;$('sP').value=prot;$('sG').value=gluc;$('sL').value=lip;
    $('sCalcR').innerHTML='<div class="alt info" style="margin-top:6px"><span><strong>BMR</strong>='+Math.round(bmr)+' \u00D7 '+am+' ('+act.replace('_',' ')+') = '+tdeeBase+'<br>+ Pas bonus: +'+stepBonus+' \u2192 '+tdeeRaw+'<br>\u00D7 Phase '+getPh()+' ('+m+') = <strong>'+tdee+' kcal</strong><br><br>Prot: '+pw+'\u00D72 = <strong>'+prot+'g</strong> ('+prot*4+' kcal)<br>Lip: '+pw+'\u00D71 = <strong>'+lip+'g</strong> ('+lip*9+' kcal)<br>Gluc: reste = <strong>'+gluc+'g</strong> ('+gluc*4+' kcal)</span></div>';
    updateMacroPreview();
  });
  $('applyPct').addEventListener('click',applyPct);
  // Live macro preview on input change
  ['sK','sP','sG','sL','sFib'].forEach(id=>$(id).addEventListener('input',updateMacroPreview));
  $('sExp').addEventListener('click',()=>{const d={log:getLog(),weights:getW(),workouts:getWk(),steps:getSteps(),water:getWater(),recipes:getRecipes(),savedmeals:getSavedMeals(),phase:getPh(),targets:getTg()};const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kripy_'+curDate+'.json';a.click()});
  $('sRst').addEventListener('click',()=>{if(confirm('Tout supprimer?')){localStorage.clear();location.reload()}});
  // Import tabs
  let curImpTab='weight';
  document.querySelectorAll('.imp-tab').forEach(b=>b.addEventListener('click',()=>{curImpTab=b.dataset.imp;document.querySelectorAll('.imp-tab').forEach(t=>t.classList.remove('sel'));b.classList.add('sel');$('impWeight').style.display=curImpTab==='weight'?'':'none';$('impCal').style.display=curImpTab==='cal'?'':'none';$('impJson').style.display=curImpTab==='json'?'':'none';$('impF').innerHTML=''}));
  // JSON file picker
  $('impFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{$('impJT').value=ev.target.result};r.readAsText(f)});
  // Import button
  $('impB').addEventListener('click',()=>{
    $('impF').innerHTML='';
    if(curImpTab==='weight'){
      const t=$('impWT').value.trim();if(!t){$('impF').innerHTML='<span style="color:var(--red)">Colle tes donnees</span>';return}
      const lines=t.split(/\r?\n/).filter(l=>l.trim());let imp=0,err=0;const ws=getW();
      lines.forEach(l=>{const p=l.split(/[,;\t]/);if(p.length<2){err++;return}let ds=p[0].trim().replace(/\//g,'-');if(!/^\d{4}-\d{2}-\d{2}$/.test(ds)){err++;return}const v=parseFloat(p[1].trim().replace(',','.'));if(v>=20&&v<=300){const i=ws.findIndex(e=>e.date===ds);if(i>=0)ws[i].w=v;else ws.push({date:ds,w:v});imp++}else err++});
      ws.sort((a,b)=>a.date.localeCompare(b.date));sv("nt_weights",ws);
      $('impF').innerHTML='<span style="color:var(--grn)">'+imp+' pesees importees</span>'+(err?' <span style="color:var(--red)">'+err+' erreurs</span>':'');$('impWT').value='';
    }else if(curImpTab==='cal'){
      const t=$('impCT').value.trim();if(!t){$('impF').innerHTML='<span style="color:var(--red)">Colle tes donnees</span>';return}
      const lines=t.split(/\r?\n/).filter(l=>l.trim());let imp=0,err=0;const log=getLog();
      lines.forEach(l=>{const p=l.split(/[,;\t]/);if(p.length<2){err++;return}let ds=p[0].trim().replace(/\//g,'-');if(!/^\d{4}-\d{2}-\d{2}$/.test(ds)){err++;return}
        const kcal=parseFloat(p[1])||0,prot=parseFloat(p[2])||0,gluc=parseFloat(p[3])||0,lip=parseFloat(p[4])||0,fib=parseFloat(p[5])||0;
        if(kcal<=0){err++;return}
        if(!log[ds])log[ds]=[];
        log[ds].push({id:Date.now()+Math.random(),food:'Import '+ds,meal:1,qty:0,kcal:kcal,p:prot,g:gluc,l:lip,f:fib});imp++});
      sv("nt_log",log);
      $('impF').innerHTML='<span style="color:var(--grn)">'+imp+' jours importes</span>'+(err?' <span style="color:var(--red)">'+err+' erreurs</span>':'');$('impCT').value='';
    }else if(curImpTab==='json'){
      const t=$('impJT').value.trim();if(!t){$('impF').innerHTML='<span style="color:var(--red)">Colle ou charge un fichier JSON</span>';return}
      try{
        const d=JSON.parse(t);let imp=[];
        if(d.weights&&Array.isArray(d.weights)){const ws=getW();d.weights.forEach(e=>{if(e.date&&e.w){const i=ws.findIndex(x=>x.date===e.date);if(i>=0)ws[i].w=e.w;else ws.push(e)}});ws.sort((a,b)=>a.date.localeCompare(b.date));sv("nt_weights",ws);imp.push(d.weights.length+' pesees')}
        if(d.log&&typeof d.log==='object'){const log=getLog();Object.keys(d.log).forEach(dt=>{if(!log[dt])log[dt]=[];log[dt]=log[dt].concat(d.log[dt])});sv("nt_log",log);imp.push(Object.keys(d.log).length+' jours repas')}
        if(d.workouts&&Array.isArray(d.workouts)){const wk=getWk();d.workouts.forEach(e=>{if(!wk.find(x=>x.id===e.id))wk.push(e)});sv("nt_workouts",wk);imp.push(d.workouts.length+' seances')}
        if(d.steps&&typeof d.steps==='object'){const s=getSteps();Object.assign(s,d.steps);sv("nt_steps",s);imp.push(Object.keys(d.steps).length+' jours pas')}
        if(d.water&&typeof d.water==='object'){const w=getWater();Object.assign(w,d.water);sv("nt_water",w);imp.push(Object.keys(d.water).length+' jours eau')}
        if(d.recipes&&typeof d.recipes==='object'){const r=getRecipes();Object.assign(r,d.recipes);sv("nt_recipes",r);imp.push(Object.keys(d.recipes).length+' recettes')}
        if(d.savedmeals&&Array.isArray(d.savedmeals)){const sm=getSavedMeals();d.savedmeals.forEach(e=>{if(!sm.find(x=>x.name===e.name))sm.push(e)});sv("nt_savedmeals",sm);imp.push(d.savedmeals.length+' repas sauv.')}
        if(d.phase)sv("nt_phase",d.phase);
        if(d.targets)sv("nt_targets",d.targets);
        $('impF').innerHTML='<span style="color:var(--grn)">Importe: '+imp.join(', ')+'</span>';$('impJT').value='';$('impFile').value='';
      }catch(e){$('impF').innerHTML='<span style="color:var(--red)">JSON invalide: '+e.message+'</span>'}
    }
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.sw'))$('fRs').classList.remove('show')});
  // Theme
  $('themeBtn').addEventListener('click',()=>{setTheme(getTheme()==='dark'?'light':'dark');if($('tab-settings').classList.contains('active'))renderSettings()});
  $('thDark').addEventListener('click',()=>{setTheme('dark');renderSettings()});
  $('thLight').addEventListener('click',()=>{setTheme('light');renderSettings()});
  // Cloud sync
  $('cloudSaveBtn').addEventListener('click',async()=>{const btn=$('cloudSaveBtn'),orig=btn.innerHTML;btn.innerHTML='<span class="material-symbols-outlined">sync</span>Sauvegarde...';toast('Sauvegarde en cours...','info',1500);await cloudSave();btn.innerHTML='<span class="material-symbols-outlined">check_circle</span>Sauvegarde !';showSyncStatus('\u2713 Donnees sauvegardees',true);setTimeout(()=>{btn.innerHTML=orig},1500)});
  $('cloudLoadBtn').addEventListener('click',async()=>{if(!confirm('Charger les donnees du cloud? (ecrase les donnees locales)'))return;const btn=$('cloudLoadBtn'),orig=btn.innerHTML;btn.innerHTML='<span class="material-symbols-outlined">sync</span>Chargement...';toast('Chargement cloud...','info',2000);const ok=await cloudLoad();if(ok){showSyncStatus('\u2713 Donnees chargees',true);location.reload()}else{showSyncStatus('Aucune donnee cloud',false);btn.innerHTML=orig}});
}

