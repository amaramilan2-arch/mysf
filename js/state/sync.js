// ===== CLOUD SYNC =====
const SYNC_KEYS=["nt_log","nt_weights","nt_workouts","nt_steps","nt_water","nt_recipes","nt_favs","nt_recent","nt_targets","nt_pw","nt_height","nt_sg","nt_phase","nt_setup","nt_theme","nt_savedmeals","nt_palier","nt_barcodes"];
let db=null,syncing=false;
function getDb(){if(db)return db;if(firebaseReady&&firebase.firestore){db=firebase.firestore();return db}return null}
async function cloudSave(){if(!currentUser||!getDb()||syncing)return;syncing=true;try{const data={};SYNC_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)data[k]=v});data.updatedAt=Date.now();data.displayName=currentUser.displayName||'';data.email=currentUser.email||'';data.photoURL=currentUser.photoURL||'';await getDb().collection('users').doc(currentUser.uid).set(data,{merge:true});console.log('Kripy: cloud save OK')}catch(e){console.warn('Kripy: cloud save err',e)}syncing=false}
async function cloudLoad(){if(!currentUser||!getDb())return false;try{const doc=await getDb().collection('users').doc(currentUser.uid).get();if(!doc.exists)return false;const data=doc.data();let loaded=0;SYNC_KEYS.forEach(k=>{if(data[k]!==undefined){localStorage.setItem(k,data[k]);loaded++}});console.log('Kripy: cloud load OK,',loaded,'keys');return loaded>0}catch(e){console.warn('Kripy: cloud load err',e);return false}}
function autoSync(){if(!currentUser||!getDb())return;cloudSave();setInterval(()=>{if(currentUser&&getDb())cloudSave()},60000)}
function showSyncStatus(msg,ok){if(typeof toast==='function')toast(msg,ok?'success':'warn')}
