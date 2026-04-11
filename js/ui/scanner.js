// ===== BARCODE SCANNER =====
let scanStream=null,scanActive=false,scanReader=null,scanRAF=null,scanMode='';
function scSetMsg(t,color){const el=$('scMsg');if(!el)return;el.textContent=t;el.style.color=color||'var(--t2)'}
async function openScanner(){
  $('scMo').classList.add('show');
  $('scMan').value='';
  scanMode='';
  scSetMsg('Autorisation camera...');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    scSetMsg('Camera indisponible. Saisis le code manuellement.','var(--red)');return;
  }
  if(!window.isSecureContext){
    scSetMsg('HTTPS requis pour la camera. Saisie manuelle.','var(--red)');return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},
      audio:false
    });
    scanStream=stream;
    const video=$('scVid');
    video.srcObject=stream;
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.muted=true;
    await video.play().catch(e=>{throw new Error('play: '+e.message)});
    // Wait until video has real dimensions
    let tries=0;
    while(video.videoWidth===0&&tries<40){await new Promise(r=>setTimeout(r,50));tries++}
    if(video.videoWidth===0){scSetMsg('Video sans dimensions. Saisis le code.','var(--red)');return}
    scanActive=true;
    await startDetection(video);
  }catch(e){
    scSetMsg('Camera KO: '+(e.message||e.name||'erreur')+'. Saisis le code.','var(--red)');
  }
}
function closeScanner(){
  scanActive=false;
  if(scanRAF){cancelAnimationFrame(scanRAF);scanRAF=null}
  if(scanReader){try{scanReader.reset()}catch(e){}scanReader=null}
  if(scanStream){scanStream.getTracks().forEach(t=>t.stop());scanStream=null}
  const v=$('scVid');if(v){v.srcObject=null;try{v.pause()}catch(e){}}
  $('scMo').classList.remove('show');
}
function loadScript(src){
  return new Promise((res,rej)=>{
    if(document.querySelector('script[data-src="'+src+'"]'))return res();
    const s=document.createElement('script');s.src=src;s.dataset.src=src;
    s.onload=()=>res();s.onerror=()=>rej(new Error('load failed: '+src));
    document.head.appendChild(s);
  });
}
async function startDetection(video){
  const EAN_FMTS=['ean_13','ean_8','upc_a','upc_e','code_128','code_39'];
  // 1. Native BarcodeDetector — only if it supports the formats we need
  if('BarcodeDetector' in window){
    try{
      const supp=await BarcodeDetector.getSupportedFormats();
      if(supp.some(f=>EAN_FMTS.includes(f))){
        const avail=EAN_FMTS.filter(f=>supp.includes(f));
        const det=new BarcodeDetector({formats:avail});
        scanMode='native';
        scSetMsg('Scan natif - place le code dans le cadre');
        const loop=async()=>{
          if(!scanActive)return;
          try{
            const codes=await det.detect(video);
            if(codes&&codes.length){onBarcodeFound(codes[0].rawValue);return}
          }catch(e){}
          scanRAF=requestAnimationFrame(loop);
        };
        loop();return;
      }
    }catch(e){/* fall through */}
  }
  // 2. ZXing manual canvas loop (universal fallback, iOS Safari, etc.)
  scSetMsg('Chargement du scanner...');
  const CDNs=[
    'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js',
    'https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js'
  ];
  let loaded=false;
  for(const url of CDNs){
    try{await loadScript(url);if(window.ZXing){loaded=true;break}}catch(e){}
  }
  if(!loaded||!window.ZXing||!ZXing.MultiFormatReader){
    scSetMsg('Scanner indisponible (reseau?). Saisis le code.','var(--red)');return;
  }
  try{
    scanMode='zxing';
    const reader=new ZXing.MultiFormatReader();
    const hints=new Map();
    const F=ZXing.BarcodeFormat,DHT=ZXing.DecodeHintType;
    hints.set(DHT.POSSIBLE_FORMATS,[F.EAN_13,F.EAN_8,F.UPC_A,F.UPC_E,F.CODE_128,F.CODE_39]);
    hints.set(DHT.TRY_HARDER,true);
    reader.setHints(hints);
    scanReader={reset:()=>{try{reader.reset()}catch(e){}}};
    const cvs=document.createElement('canvas');
    const ctx=cvs.getContext('2d',{willReadFrequently:true});
    scSetMsg('Place le code bien cadre et eclaire');
    let last=0;
    const tick=(ts)=>{
      if(!scanActive)return;
      if(ts-last>=120&&video.readyState>=2&&video.videoWidth>0){
        last=ts;
        // Crop to central region for faster + more reliable decode
        const vw=video.videoWidth,vh=video.videoHeight;
        const cw=Math.floor(vw*0.8),ch=Math.floor(vh*0.55);
        const cx=Math.floor((vw-cw)/2),cy=Math.floor((vh-ch)/2);
        cvs.width=cw;cvs.height=ch;
        try{
          ctx.drawImage(video,cx,cy,cw,ch,0,0,cw,ch);
          const src=new ZXing.HTMLCanvasElementLuminanceSource(cvs);
          const bb=new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(src));
          const res=reader.decode(bb);
          const txt=res&&(res.getText?res.getText():res.text);
          if(txt){onBarcodeFound(txt);return}
        }catch(e){/* NotFoundException is normal */}
        try{reader.reset()}catch(e){}
      }
      scanRAF=requestAnimationFrame(tick);
    };
    scanRAF=requestAnimationFrame(tick);
  }catch(e){
    scSetMsg('Scanner KO: '+(e.message||'erreur').slice(0,60)+'. Saisis le code.','var(--red)');
  }
}
async function onBarcodeFound(ean){
  if(!scanActive)return;
  scanActive=false;
  if(scanRAF){cancelAnimationFrame(scanRAF);scanRAF=null}
  if(scanReader){try{scanReader.reset()}catch(e){}scanReader=null}
  if(navigator.vibrate)try{navigator.vibrate(60)}catch(e){}
  scSetMsg('Code '+ean+' - recherche...');
  const cache=getBarcodes();
  if(cache[ean]){
    const name=cache[ean].name;
    closeScanner();selectFood(name);return;
  }
  try{
    const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(ean)+'.json?fields=product_name,brands,nutriments,code');
    const j=await r.json();
    if(j.status===1&&j.product){
      const prod=j.product,n=prod.nutriments||{};
      const kcal=Math.round(n['energy-kcal_100g']||n.energy_kcal_100g||((n['energy_100g']||0)/4.184)||0);
      const prot=+((n.proteins_100g||0).toFixed(1));
      const gluc=+((n.carbohydrates_100g||0).toFixed(1));
      const lip=+((n.fat_100g||0).toFixed(1));
      const fib=+((n.fiber_100g||0).toFixed(1));
      if(kcal<=0&&prot<=0&&gluc<=0&&lip<=0){
        scSetMsg('Produit trouve mais sans valeurs nutritionnelles.','var(--red)');
        setTimeout(()=>{scanActive=true;const v=$('scVid');if(v&&scanStream)startDetection(v)},1500);
        return;
      }
      const brand=(prod.brands||'').split(',')[0].trim();
      let name=((brand?brand+' ':'')+(prod.product_name||'Produit '+ean)).trim();
      if(name.length>50)name=name.slice(0,50);
      // Avoid collision with existing name
      const foods=getAllFoods();let finalName=name,i=2;
      while(foods[finalName]&&finalName!==name){finalName=name+' ('+i+')';i++}
      cache[ean]={name:finalName,kcal,p:prot,g:gluc,l:lip,f:fib,ean,ts:Date.now()};
      sv("nt_barcodes",cache);
      scSetMsg('Produit ajoute!','var(--grn)');
      setTimeout(()=>{closeScanner();selectFood(finalName)},350);
    }else{
      scSetMsg('Produit introuvable sur OpenFoodFacts ('+ean+')','var(--red)');
      setTimeout(()=>{scanActive=true;const v=$('scVid');if(v&&scanStream)startDetection(v)},1800);
    }
  }catch(e){
    scSetMsg('Erreur reseau. Reessaie.','var(--red)');
    setTimeout(()=>{scanActive=true;const v=$('scVid');if(v&&scanStream)startDetection(v)},1500);
  }
}
function scanManualSubmit(){
  const v=($('scMan').value||'').trim().replace(/\s/g,'');
  if(!/^\d{6,14}$/.test(v)){$('scMan').style.borderColor='var(--red)';setTimeout(()=>$('scMan').style.borderColor='',700);return}
  scanActive=true;onBarcodeFound(v);
}
