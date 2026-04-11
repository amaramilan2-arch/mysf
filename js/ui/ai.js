// ===== AI MEAL ANALYSIS =====
let aiImageB64=null;

// Compress image to max 1024px JPEG before sending to API
function compressImage(dataUrl,maxSize,quality){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      let w=img.width,h=img.height;
      if(w>maxSize||h>maxSize){
        if(w>h){h=Math.round(h*maxSize/w);w=maxSize}
        else{w=Math.round(w*maxSize/h);h=maxSize}
      }
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
      resolve(c.toDataURL('image/jpeg',quality));
    };
    img.onerror=()=>resolve(dataUrl);
    img.src=dataUrl;
  });
}

function aiReset(){aiImageB64=null;$('aiImg').src='';$('aiPreview').style.display='none';$('aiPhotoLabel').style.display='flex';$('aiDesc').value='';$('aiResult').style.display='none';$('aiItems').innerHTML='';$('aiErr').style.display='none';$('aiLoading').style.display='none';$('aiActions').style.display='flex';$('aiAddActions').style.display='none'}
function aiShowErr(type,detail){
  const el=$('aiErr'),styles={
    nokey:  {icon:'\u{1F511}',bg:'var(--orgG)',color:'var(--org)',title:'Cle API manquante',msg:'Ajoute ta cle API Groq dans Reglages > IA — Analyse repas. Cree un compte gratuit sur <b>console.groq.com</b>.'},
    badkey: {icon:'\u{1F6AB}',bg:'var(--redG)',color:'var(--red)',title:'Cle API invalide',msg:'La cle API Groq est incorrecte. Verifie-la dans Reglages > IA. Elle commence par <b>gsk_</b>.'},
    quota:  {icon:'\u{23F3}',bg:'var(--orgG)',color:'var(--org)',title:'Quota depasse',msg:'Limite de requetes atteinte. Reessaie dans 1-2 minutes.'},
    network:{icon:'\u{1F4E1}',bg:'var(--redG)',color:'var(--red)',title:'Erreur reseau',msg:'Impossible de contacter Groq. Verifie ta connexion internet.'},
    api:    {icon:'\u{2699}\u{FE0F}',bg:'var(--redG)',color:'var(--red)',title:'Erreur API',msg:detail||'L\'API a retourne une erreur inattendue.'},
    parse:  {icon:'\u{1F372}',bg:'var(--accG)',color:'var(--acc2)',title:'Analyse impossible',msg:'L\'IA n\'a pas pu identifier le repas. Ajoute une description plus detaillee ou une meilleure photo.'},
    empty:  {icon:'\u{1F4DD}',bg:'var(--orgG)',color:'var(--org)',title:'Rien a analyser',msg:'Prends une photo du repas et/ou decris-le en texte.'}
  };
  const s=styles[type]||styles.api;
  el.style.cssText='display:block;font-size:.72rem;margin-bottom:8px;padding:10px 12px;border-radius:10px;line-height:1.5;background:'+s.bg+';color:'+s.color+';border:1px solid '+s.color+'20';
  el.innerHTML='<div style="font-weight:700;font-size:.78rem;margin-bottom:2px">'+s.icon+' '+s.title+'</div><div style="opacity:.85">'+s.msg+'</div>';
  $('aiLoading').style.display='none';$('aiActions').style.display='flex';$('aiAddActions').style.display='none';
}

async function aiAnalyze(){
  const key=ld('nt_aikey','');
  if(!key){aiShowErr('nokey');return}
  const desc=$('aiDesc').value.trim();
  if(!desc&&!aiImageB64){aiShowErr('empty');return}
  $('aiErr').style.display='none';$('aiLoading').style.display='block';$('aiActions').style.display='none';$('aiResult').style.display='none';

  const sysPrompt='Tu es un nutritionniste expert. Analyse le repas et retourne UNIQUEMENT un JSON valide (pas de markdown, pas de texte autour). Format exact: [{"nom":"Nom aliment","qte":150,"kcal":250,"prot":20,"gluc":30,"lip":8,"fib":3},...]. Estime les quantites si non precisees. Chaque aliment separement. Valeurs pour la quantite estimee, PAS pour 100g.';
  const userText=desc||'Analyse la photo du repas.';

  const content=[];
  if(aiImageB64)content.push({type:'image_url',image_url:{url:aiImageB64}});
  content.push({type:'text',text:userText});

  let r;
  try{
    r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'meta-llama/llama-4-scout-17b-16e-instruct',messages:[{role:'system',content:sysPrompt},{role:'user',content}],temperature:0.3,max_tokens:2048})
    });
  }catch(e){aiShowErr('network');return}

  if(!r.ok){
    let msg='';try{const j=await r.json();msg=j.error&&j.error.message||JSON.stringify(j.error)||''}catch{}
    if(r.status===401)aiShowErr('badkey');
    else if(r.status===429)aiShowErr('quota');
    else if(r.status>=500)aiShowErr('api','Serveurs Groq temporairement indisponibles. Reessaie dans un instant.');
    else aiShowErr('api','Erreur '+r.status+(msg?' — '+msg.slice(0,150):''));
    return;
  }

  let d;
  try{d=await r.json()}catch{aiShowErr('api','Reponse invalide.');return}

  const txt=d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||'';
  if(!txt){aiShowErr('parse');return}

  try{
    let json=txt;const jm=txt.match(/\[[\s\S]*\]/);if(jm)json=jm[0];
    const items=JSON.parse(json);
    if(!Array.isArray(items)||!items.length){aiShowErr('parse');return}
    aiShowResults(items);
  }catch{aiShowErr('parse')}
}

function aiShowResults(items){
  $('aiLoading').style.display='none';$('aiResult').style.display='block';$('aiActions').style.display='none';$('aiAddActions').style.display='flex';
  const el=$('aiItems');el.innerHTML='';
  items.forEach((it,i)=>{
    const div=document.createElement('div');
    div.style.cssText='background:var(--s2);border:1px solid var(--s3);border-radius:12px;padding:10px 12px;margin-bottom:6px;font-size:.78rem';
    div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
      '<strong style="flex:1">'+it.nom+'</strong>'+
      '<span class="mono" style="color:var(--org);font-weight:700">'+Math.round(it.kcal)+' kcal</span></div>'+
      '<div style="display:flex;gap:8px;font-size:.66rem;color:var(--t2)">'+
      '<span>'+Math.round(it.qte||0)+'g</span>'+
      '<span style="color:var(--acc)">P'+Math.round(it.prot||0)+'</span>'+
      '<span style="color:var(--grn)">G'+Math.round(it.gluc||0)+'</span>'+
      '<span style="color:var(--pnk)">L'+Math.round(it.lip||0)+'</span>'+
      '<span style="color:var(--brn)">F'+Math.round(it.fib||0)+'</span></div>';
    div.dataset.idx=i;
    el.appendChild(div);
  });
  el._items=items;
}

function aiAddAllToLog(){
  const items=$('aiItems')._items;
  if(!items||!items.length)return;
  const log=getLog();if(!log[curDate])log[curDate]=[];
  items.forEach(it=>{
    log[curDate].push({food:it.nom||'Aliment IA',qty:Math.round(it.qte||0),kcal:Math.round(it.kcal||0),p:Math.round(it.prot||0),g:Math.round(it.gluc||0),l:Math.round(it.lip||0),f:Math.round(it.fib||0),meal:curMeal,id:Date.now()+Math.random()*1000|0});
  });
  sv("nt_log",log);$('aiMo').classList.remove('show');aiReset();renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
}
