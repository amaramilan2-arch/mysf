// ===== NAV =====
// ===== NAV =====
function initNav(){
  const tabs=[
    {id:'home',l:'Accueil',i:'<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"/>'},
    {id:'charts',l:'Stats',i:'<path d="M3 3v18h18"/><path d="M7 16l4-6 4 4 5-8"/>'},
    {id:'meals',l:'Repas',i:'<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>'},
    {id:'recipes',l:'Recettes',i:'<path d="M4 6h16M4 12h10M4 18h14"/><circle cx="18" cy="12" r="2"/>'},
    {id:'sport',l:'Sport',i:'<path d="M18 6a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M5 21l3-9 4 3 4-3 3 9"/>'},
    {id:'settings',l:'Reglages',i:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'}
  ];
  const n=$('nav');tabs.forEach((t,i)=>{const b=document.createElement('button');b.type='button';if(i===0)b.classList.add('active');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+t.i+'</svg>'+t.l;b.addEventListener('click',()=>{document.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));$('tab-'+t.id).classList.add('active');n.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');({home:renderHome,charts:renderCharts,meals:renderMealsTab,recipes:renderRecipes,sport:renderSport,settings:renderSettings})[t.id]()});n.appendChild(b)})
}
