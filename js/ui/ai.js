// ===== AI MEAL ANALYSIS =====
let aiImageB64=null,aiTotal=null,aiMicRec=null;

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

function aiReset(){aiImageB64=null;aiTotal=null;$('aiImg').src='';$('aiPreview').style.display='none';$('aiPhotoLabel').style.display='flex';$('aiDesc').value='';$('aiResult').style.display='none';$('aiResult').innerHTML='';$('aiErr').style.display='none';$('aiLoading').style.display='none';$('aiActions').style.display='flex';$('aiAddActions').style.display='none';if(aiMicRec){try{aiMicRec.stop()}catch{}aiMicRec=null}$('aiMicStatus').style.display='none'}
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

  const sysPrompt='Tu es un assistant nutrition specialise dans la cuisine mondiale (francaise, maghrebine, africaine, asiatique, mediterraneenne, moyen-orientale, americaine, etc.). L\'utilisateur decrit un repas en langage naturel, en francais, parfois avec des fautes de frappe. Ton role: identifier le plat et donner une estimation nutritionnelle rapide et fiable. Retourne UNIQUEMENT un objet JSON (pas de markdown, pas de texte autour). Format: {"nom":"Nom du plat","kcal":650,"prot":25,"gluc":80,"lip":22,"fib":6}. REGLES: (1) IMPORTANT: quand un mot est accompagne d\'une origine geographique (ex: "X tunisien", "Y marocain", "Z libanais"), c\'est TOUJOURS le nom d\'un plat regional, JAMAIS un ingredient occidental - cherche le plat traditionnel correspondant (ex: "nwasser tunisien"=pates tunisiennes carrees avec sauce/viande, "couscous marocain", "tajine", "mloukhia", "brik", "chakchouka", "kafteji", "lablebi", "ojja", "harissa", "mechouia", etc.). Si tu ne reconnais pas exactement le plat regional, utilise les valeurs moyennes d\'un plat similaire de cette region (plat complet tunisien ~= 500-700 kcal pour une portion normale). (2) Pour les aliments courants sans origine, corrige les fautes evidentes (ex: "poul"->"poulet", "steck"->"steak"). (3) Si la quantite n\'est pas precisee, utilise une portion standard realiste (1 pomme=150g, 1 banane=120g, 1 assiette=300-400g, 1 tranche de pain=35g, 1 verre=200ml). (4) Agrege TOUT en UN SEUL total pour le repas complet. (5) Valeurs pour la portion reelle, PAS pour 100g. Arrondis. (6) Sois rapide, confiant, ne demande jamais plus de details. Ne refuse jamais d\'estimer.';
  const userText=desc||'Analyse la photo du repas et donne le total calorique.';

  const content=[];
  if(aiImageB64)content.push({type:'image_url',image_url:{url:aiImageB64}});
  content.push({type:'text',text:userText});

  let r;
  try{
    r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'meta-llama/llama-4-scout-17b-16e-instruct',messages:[{role:'system',content:sysPrompt},{role:'user',content}],temperature:0.2,max_tokens:512})
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
    let json=txt;
    const om=txt.match(/\{[\s\S]*\}/);if(om)json=om[0];
    const obj=JSON.parse(json);
    if(!obj||typeof obj!=='object'||Array.isArray(obj)){aiShowErr('parse');return}
    if(!obj.kcal&&!obj.prot&&!obj.gluc&&!obj.lip){aiShowErr('parse');return}
    aiShowResult(obj);
  }catch{aiShowErr('parse')}
}

function aiShowResult(it){
  aiTotal=it;
  $('aiLoading').style.display='none';$('aiResult').style.display='block';$('aiActions').style.display='none';$('aiAddActions').style.display='flex';
  const kcal=Math.round(it.kcal||0),p=Math.round(it.prot||0),g=Math.round(it.gluc||0),l=Math.round(it.lip||0),f=Math.round(it.fib||0);
  const nom=it.nom||'Repas';
  $('aiResult').innerHTML=
    '<div style="background:var(--s1);border-radius:20px;padding:22px 18px;text-align:center;box-shadow:var(--shadow);position:relative;overflow:hidden">'+
      '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,var(--accG),transparent 65%);pointer-events:none"></div>'+
      '<div style="position:relative">'+
        '<div style="font-size:.62rem;color:var(--t2);text-transform:uppercase;letter-spacing:1px;font-weight:800;margin-bottom:6px">Estimation du repas</div>'+
        '<div style="font-size:.95rem;color:var(--t1);font-weight:700;margin-bottom:10px;line-height:1.2">'+nom+'</div>'+
        '<div style="font-size:3rem;font-weight:800;color:var(--acc);letter-spacing:-2px;line-height:1;font-family:\'JetBrains Mono\',monospace">~'+kcal+'</div>'+
        '<div style="font-size:.7rem;color:var(--t2);margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.8px">kcal approx.</div>'+
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:16px">'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Prot</div><div style="font-size:.9rem;font-weight:800;color:#4AD295;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+p+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Gluc</div><div style="font-size:.9rem;font-weight:800;color:#6EC6FF;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+g+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Lip</div><div style="font-size:.9rem;font-weight:800;color:#FD79A8;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+l+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Fib</div><div style="font-size:.9rem;font-weight:800;color:#FFB347;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+f+'g</div></div>'+
        '</div>'+
      '</div>'+
    '</div>';
}

function aiAddAllToLog(){
  const it=aiTotal;
  if(!it)return;
  const log=getLog();if(!log[curDate])log[curDate]=[];
  log[curDate].push({food:it.nom||'Repas IA',qty:0,kcal:Math.round(it.kcal||0),p:Math.round(it.prot||0),g:Math.round(it.gluc||0),l:Math.round(it.lip||0),f:Math.round(it.fib||0),meal:curMeal,id:Date.now()});
  sv("nt_log",log);$('aiMo').classList.remove('show');aiReset();renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
}
