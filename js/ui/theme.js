// ===== THEME =====
function getTheme(){return localStorage.getItem('nt_theme')||'dark'}
function setTheme(t){localStorage.setItem('nt_theme',t);document.documentElement.setAttribute('data-theme',t);const btn=$('themeBtn');if(btn){const ic=btn.querySelector('.material-symbols-outlined');if(ic)ic.textContent=t==='light'?'light_mode':'dark_mode';else btn.innerHTML=t==='light'?'\u2600\uFE0F':'\uD83C\uDF19'}if(typeof renderHome==='function'&&$('tab-home')&&$('tab-home').classList.contains('active'))renderHome();if(typeof renderCharts==='function'&&$('tab-charts')&&$('tab-charts').classList.contains('active'))renderCharts()}
(function(){const t=getTheme();if(t==='light')document.documentElement.setAttribute('data-theme','light')})();
