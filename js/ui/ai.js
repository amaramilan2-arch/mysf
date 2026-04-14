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

  const sysPrompt='Tu es un nutritionniste expert specialise dans l\'estimation calorique precise des repas du monde entier (francaise, maghrebine, tunisienne, africaine, asiatique, mediterraneenne, moyen-orientale, americaine, fast-food, etc.). L\'utilisateur decrit un repas en francais (parfois avec des fautes) et/ou envoie une photo. Ton role: identifier chaque composant du repas, estimer les quantites, calculer les macronutriments de chaque element, puis donner le total agrege.\n\nRetourne UNIQUEMENT un objet JSON (pas de markdown, pas de texte autour).\nFormat: {"nom":"Nom du plat","kcal":650,"prot":25,"gluc":80,"lip":22,"fib":6,"details":"Explication courte"}\n\nLe champ "details" est une explication concise (2-3 phrases max) qui decrit comment les calories se repartissent. Exemple: "Le riz (250 kcal) constitue la base glucidique, le poulet grille (220 kcal) apporte les proteines, et la sauce (80 kcal) ajoute les lipides. Repas equilibre et moderement calorique."\n\nREGLE CRITIQUE - PROPORTIONNALITE:\nQuand l\'utilisateur donne un poids en grammes, tu DOIS utiliser cette formule:\n  kcal_total = (kcal_pour_100g_du_plat * poids_en_grammes) / 100\n  (idem pour prot, gluc, lip, fib)\nExemples:\n- "250g de nouasser": 180kcal/100g -> 250*180/100 = 450 kcal\n- "550g de nouasser": 180kcal/100g -> 550*180/100 = 990 kcal\n- "100g de poulet": 165kcal/100g -> 100*165/100 = 165 kcal\n- "300g de poulet": 165kcal/100g -> 300*165/100 = 495 kcal\nLe resultat DOIT changer proportionnellement au poids. 550g donne TOUJOURS plus de kcal que 250g du meme plat.\n\nMETHODE D\'ESTIMATION (suis ces etapes dans l\'ordre):\n1. IDENTIFIER chaque aliment/composant du repas separement\n2. PRENDRE la quantite donnee par l\'utilisateur. Si non precisee, estimer en grammes\n3. CALCULER avec la formule proportionnelle ci-dessus pour chaque composant\n4. ADDITIONNER tous les composants pour obtenir le total du repas\n5. VERIFIER: prot*4 + gluc*4 + lip*9 doit etre proche de kcal (marge 10%)\n\nREGLES DE PRECISION:\n- Prends en compte le MODE DE CUISSON: frit (+30-50% kcal vs grille), saute a l\'huile (+80-120 kcal par cuillere), vapeur (pas de surplus), pane (+100-150 kcal)\n- L\'HUILE et les SAUCES comptent enormement: 1 cuillere a soupe d\'huile = 90 kcal, mayonnaise = 100 kcal/cs, beurre = 75 kcal/10g, vinaigrette = 45 kcal/cs\n- Le PAIN et les FECULENTS: 1 baguette = ~250 kcal, 1 tranche = 70 kcal, 1 assiette de riz cuit = 200-250 kcal, 1 assiette de pates cuites = 220-280 kcal\n- Les BOISSONS: 1 canette soda = 140 kcal, 1 jus de fruit 200ml = 90 kcal, 1 cafe au lait = 40-70 kcal, eau = 0 kcal\n- Le FROMAGE: 1 portion (30g) = 90-120 kcal selon le type\n- Les FRUITS: 1 pomme=80 kcal, 1 banane=100 kcal, 1 orange=60 kcal, raisin 100g=70 kcal\n\nPORTIONS STANDARD (quand la quantite n\'est pas precisee):\n- 1 assiette plat principal = 300-400g\n- 1 portion viande/poisson = 120-150g\n- 1 portion feculents cuits = 200-250g\n- 1 portion legumes = 150-200g\n- 1 salade composee = 250-350g\n- 1 sandwich/burger = 200-300g\n- 1 part de pizza = 120-150g\n- 1 tranche de pain = 35-40g\n- 1 oeuf = 60g\n- 1 yaourt = 125g\n- 1 verre = 200ml\n- 1 bol = 300ml\n\nCUISINE REGIONALE - IMPORTANT:\n- Quand un mot est accompagne d\'une origine geographique (ex: "X tunisien", "Y marocain", "Z libanais"), c\'est TOUJOURS un plat regional traditionnel, JAMAIS un ingredient occidental\n- Plats tunisiens: nwasser (pates carrees sauce tomate/viande ~600 kcal), lablebi (soupe pois chiches ~450 kcal), brik (feuille farcie frite ~300 kcal), kafteji (legumes frits + oeuf ~400 kcal), ojja (oeuf sauce tomate piquante ~350 kcal), chakchouka (~300 kcal), mloukhia (ragout vert + viande ~550 kcal), couscous tunisien (~700 kcal), fricasse (~350 kcal), makroud (~200 kcal/piece), bambalouni (~250 kcal)\n- Plats maghrebins: couscous (~650-800 kcal), tajine (~500-650 kcal), pastilla (~450 kcal), harira (~300 kcal), msemen (~250 kcal)\n- Plats du Moyen-Orient: shawarma (~550 kcal), falafel assiette (~600 kcal), houmous + pain (~350 kcal), fattoush (~200 kcal)\n- Si plat regional inconnu: estime en te basant sur un plat similaire de la meme region\n\nAUTRES REGLES:\n- Corrige les fautes evidentes (ex: "poul"->"poulet", "steck"->"steak", "riz"->"riz", "fromaje"->"fromage")\n- Si une photo est fournie, analyse visuellement les proportions et volumes pour mieux estimer les quantites\n- TOUJOURS agreger en UN SEUL total pour le repas complet\n- Valeurs pour la PORTION REELLE, PAS pour 100g. Arrondis a l\'unite\n- Sois confiant et precis. Ne demande jamais plus de details. Ne refuse jamais d\'estimer.';
  const userText=desc||'Analyse la photo du repas et donne le total calorique.';

  // Extract quantity from user text to reinforce it
  let finalUserText=userText;
  if(desc){
    const qm=desc.match(/(\d+)\s*(?:g(?:r(?:ammes?)?)?|grammes?|kg)/i);
    if(qm){
      const grams=desc.toLowerCase().includes('kg')?parseFloat(qm[1])*1000:parseInt(qm[1]);
      finalUserText=desc+'\n\nIMPORTANT: La quantite est EXACTEMENT '+grams+'g. Utilise la formule: kcal = (kcal_pour_100g * '+grams+') / 100. Les macros doivent etre proportionnelles a '+grams+'g.';
    }
  }

  const content=[];
  if(aiImageB64)content.push({type:'image_url',image_url:{url:aiImageB64}});
  content.push({type:'text',text:finalUserText});

  let r;
  try{
    r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'meta-llama/llama-4-scout-17b-16e-instruct',messages:[{role:'system',content:sysPrompt},{role:'user',content}],temperature:0.1,max_tokens:1024})
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
  const details=it.details||'';
  $('aiResult').innerHTML=
    '<div style="background:var(--s1);border-radius:20px;padding:22px 18px;text-align:center;box-shadow:var(--shadow);position:relative;overflow:hidden">'+
      '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,var(--accG),transparent 65%);pointer-events:none"></div>'+
      '<div style="position:relative">'+
        '<div style="font-size:.62rem;color:var(--t2);text-transform:uppercase;letter-spacing:1px;font-weight:800;margin-bottom:6px">Estimation du repas</div>'+
        '<div style="font-size:.95rem;color:var(--t1);font-weight:700;margin-bottom:10px;line-height:1.2">'+nom+'</div>'+
        '<div style="font-size:3rem;font-weight:800;color:var(--acc);letter-spacing:-2px;line-height:1;font-family:\'JetBrains Mono\',monospace">~'+kcal+'</div>'+
        '<div style="font-size:.7rem;color:var(--t2);margin-top:4px;font-weight:700;text-transform:uppercase;letter-spacing:.8px">kcal approx.</div>'+
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:16px">'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.18em;font-family:\'JetBrains Mono\',monospace">Prot</div><div style="font-size:.9rem;font-weight:800;color:#6AEFAF;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+p+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.18em;font-family:\'JetBrains Mono\',monospace">Gluc</div><div style="font-size:.9rem;font-weight:800;color:#4DD0E1;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+g+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.18em;font-family:\'JetBrains Mono\',monospace">Lip</div><div style="font-size:.9rem;font-weight:800;color:#FF6B9D;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+l+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.18em;font-family:\'JetBrains Mono\',monospace">Fib</div><div style="font-size:.9rem;font-weight:800;color:#FFB347;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+f+'g</div></div>'+
        '</div>'+
        (details?'<div style="margin-top:14px;padding:12px 14px;background:var(--s2);border-radius:14px;text-align:left;line-height:1.55">'+
          '<div style="font-size:.6rem;color:var(--t2);font-weight:800;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">\u{1F4A1} Explication</div>'+
          '<div style="font-size:.72rem;color:var(--t2);font-weight:500">'+details+'</div>'+
        '</div>':'')+
      '</div>'+
    '</div>';
}

function aiAddAllToLog(){
  const it=aiTotal;
  if(!it)return;
  const log=getLog();if(!log[curDate])log[curDate]=[];
  const name=it.nom||'Repas IA';
  log[curDate].push({food:name,qty:0,kcal:Math.round(it.kcal||0),p:Math.round(it.prot||0),g:Math.round(it.gluc||0),l:Math.round(it.lip||0),f:Math.round(it.fib||0),meal:curMeal,id:Date.now()});
  sv("nt_log",log);$('aiMo').classList.remove('show');aiReset();renderMealsTab();if($('tab-home').classList.contains('active'))renderHome();
  toast(name+' ajoute','success');
}
