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

  const sysPrompt='Tu es un nutritionniste expert specialise dans l\'estimation calorique des repas du monde entier (francaise, maghrebine, tunisienne, africaine, asiatique, mediterraneenne, moyen-orientale, americaine, fast-food, etc.).\n\n=== HIERARCHIE DES SOURCES (CRITIQUE) ===\nL\'utilisateur fournit DEUX types d\'information:\n1. UNE DESCRIPTION TEXTE (source PRIMAIRE, source de VERITE)\n2. Une photo (source SECONDAIRE, simple support visuel)\n\nREGLE ABSOLUE: La description texte fait LOI. La photo sert uniquement a:\n  a) Confirmer l\'identification du plat si le texte est ambigu\n  b) Estimer les quantites UNIQUEMENT si le texte ne les precise pas\n  c) Reperer des elements non mentionnes dans le texte (ex: boisson visible)\n\nSi le texte dit "150g de riz", tu utilises 150g, MEME SI la photo semble montrer plus ou moins. Le texte ecrase toujours la photo.\nSi le texte dit "poulet grille", tu analyses comme poulet grille, MEME si la photo parait huileuse.\n\n=== FORMAT DE SORTIE ===\nRetourne UNIQUEMENT un objet JSON (pas de markdown, pas de texte autour):\n{"nom":"Nom du plat","kcal":650,"prot":25,"gluc":80,"lip":22,"fib":6,"details":"Explication courte"}\n\nLe champ "details" (2-3 phrases) explique la repartition calorique. Exemple: "Le riz (250 kcal) constitue la base, le poulet (220 kcal) apporte les proteines, l\'huile de cuisson (80 kcal) ajoute les lipides."\n\n=== REGLE DE PROPORTIONNALITE (CRITIQUE) ===\nSi l\'utilisateur donne un poids en grammes, applique STRICTEMENT cette formule:\n  kcal_total = (kcal_pour_100g * poids_en_grammes) / 100\n  (idem pour prot, gluc, lip, fib)\n\nExemples concrets:\n- "250g de nouasser" (180 kcal/100g) -> 250*180/100 = 450 kcal\n- "550g de nouasser" (180 kcal/100g) -> 550*180/100 = 990 kcal\n- "100g de poulet grille" (165 kcal/100g) -> 165 kcal\n- "300g de poulet grille" (165 kcal/100g) -> 495 kcal\n\n550g donne TOUJOURS plus de kcal que 250g du meme plat. Verifie ton calcul.\n\n=== METHODE (suis ces etapes) ===\n1. LIRE ATTENTIVEMENT la description texte (elle contient la verite)\n2. IDENTIFIER chaque aliment mentionne, corriger les fautes evidentes ("poul"->poulet, "steck"->steak, "fromaje"->fromage)\n3. RELEVER les quantites precisees (ex: "150g", "2 cuilleres", "1 assiette", "grande portion")\n4. Pour chaque element SANS quantite precisee: utiliser la photo OU les portions standard ci-dessous\n5. CALCULER avec la formule proportionnelle\n6. ADDITIONNER tous les composants\n7. VERIFIER la coherence: prot*4 + gluc*4 + lip*9 doit etre proche de kcal (+/-10%)\n\n=== DENSITES CALORIQUES DE REFERENCE (par 100g ou par unite) ===\nFeculents cuits: riz blanc 130, riz complet 120, pates 155, pommes de terre 85, frites 310, pain 265\nProteines: poulet grille 165, poulet frit 250, boeuf maigre 200, boeuf hache 250, poisson blanc 95, saumon 210, thon 130, oeuf 145, tofu 145\nLegumes: tomate 20, carotte 35, courgette 20, salade verte 15, avocat 160, pois chiches cuits 160, lentilles cuites 115\nProduits laitiers: fromage moyen 350, mozzarella 280, yaourt nature 60, lait entier 65, lait ecreme 35\nMatieres grasses: huile 900, beurre 750, mayonnaise 680, vinaigrette 300\nFruits: pomme 52, banane 90, orange 47, raisin 70, fraise 32\nBoissons: soda 42, jus de fruit 45, biere 43, vin 85, cafe noir 2\nFast-food: burger classique 250, pizza 265, kebab 215, nuggets 295\n\n=== PORTIONS STANDARD (si quantite non precisee) ===\n1 assiette = 300-400g / 1 portion viande = 120-150g / 1 portion feculents cuits = 200-250g / 1 portion legumes = 150-200g / 1 sandwich = 200-300g / 1 part pizza = 130g / 1 tranche pain = 35g / 1 oeuf = 60g / 1 yaourt = 125g / 1 verre = 200ml / 1 bol = 300ml / 1 cuillere a soupe huile = 10g (90 kcal)\n\n=== AJUSTEMENTS CUISSON ===\nFrit/pane: +30-50% kcal vs grille. Saute a l\'huile: +80-120 kcal par cuillere d\'huile ajoutee. Vapeur/bouilli: aucun surplus. Rotisserie: +10%.\n\n=== CUISINE REGIONALE (IMPORTANT) ===\nQuand un mot est suivi d\'une origine ("X tunisien", "Y marocain", "Z libanais"), c\'est TOUJOURS un plat regional, JAMAIS un ingredient occidental.\n\nPlats tunisiens (kcal/100g approx): nwasser/nouasser 180, lablebi 110, brik 280, kafteji 150, ojja 130, chakchouka 100, mloukhia 140, couscous 160, fricasse 320, makroud 380, bambalouni 350\nPlats maghrebins: couscous 160, tajine 140, pastilla 280, harira 85, msemen 300\nPlats moyen-orient: shawarma 215, falafel 330, houmous 165, fattoush 90, kibbeh 250\nSi un plat regional t\'est inconnu, base-toi sur un plat similaire de la meme region.\n\n=== REGLES FINALES ===\n- Corrige les fautes evidentes sans demander confirmation\n- Produis TOUJOURS un total unique pour le repas complet (pas de decomposition par item dans le JSON)\n- Valeurs pour la PORTION REELLE, pas pour 100g. Arrondis a l\'unite.\n- Sois confiant. Ne refuse jamais d\'estimer, ne demande jamais plus de details.';
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
      body:JSON.stringify({model:'meta-llama/llama-4-maverick-17b-128e-instruct',messages:[{role:'system',content:sysPrompt},{role:'user',content}],temperature:0.1,max_tokens:1024})
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
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Prot</div><div style="font-size:.9rem;font-weight:800;color:#4AD295;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+p+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Gluc</div><div style="font-size:.9rem;font-weight:800;color:#6EC6FF;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+g+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Lip</div><div style="font-size:.9rem;font-weight:800;color:#FD79A8;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+l+'g</div></div>'+
          '<div style="background:var(--s2);border-radius:12px;padding:10px 4px"><div style="font-size:.55rem;color:var(--t2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">Fib</div><div style="font-size:.9rem;font-weight:800;color:#FFB347;margin-top:2px;font-family:\'JetBrains Mono\',monospace">'+f+'g</div></div>'+
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
