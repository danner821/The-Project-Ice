'use strict';

/* global WorldEngine, Game, openHubTab, openTeamTab */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CONTROL_ID='pi-team-leaders-scope',STYLE_ID='pi-team-leaders-scope-styles';
  let selectedScope='regular-season';
  const nameOf=p=>`${p?.firstName||''} ${p?.lastName||''}`.trim()||p?.name||p?.playerName||'Unknown Player';
  const postseasonAvailable=()=>Boolean(WorldEngine.state?.postseason?.highSchool?.initialized===true);

  function injectStyles(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`#${CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:10px 0 14px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}#${CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 9px;background:transparent;color:#6d819e;font:inherit;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}#${CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}.pi-team-leader-empty{color:#647892!important;font-weight:700!important}`;document.head.appendChild(s);}

  function currentTeam(){
    const explicit=Game?.teamTabSelectedTeamId; if(explicit){const t=WorldEngine.getTeamById?.(explicit);if(t&&!t.travelProfileAdapter)return t;}
    const player=WorldEngine.state?.player||Game?.player||{};const ids=new Set([String(player.playerId||''),String(player.id||''),'career-player'].filter(Boolean));
    return (WorldEngine.state?.teams||[]).find(t=>!t?.travelProfileAdapter&&(t.roster||[]).some(p=>p?.isCareerPlayer===true||ids.has(String(p?.playerId||p?.id||''))))||null;
  }

  function syncPalette(team){
    if(!team)return;const r=document.getElementById('team-page-root')||document.querySelector('#hub-tab-team .team-page-root')||document.getElementById('hub-tab-team');if(!r)return;
    r.querySelectorAll('.team-profile-style-hero__color-primary').forEach(n=>n.style.background=team.primaryColor||'#2f6fd6');
    r.querySelectorAll('.team-profile-style-hero__color-secondary').forEach(n=>n.style.background=team.secondaryColor||'#d6aa2f');
    const identity=r.querySelector('.team-profile-style-identity,.team-identity-card');if(identity)identity.style.borderLeftColor=team.primaryColor||'#2f6fd6';
  }

  function entries(team,isGoalie){return (team?.roster||[]).filter(p=>(String(p?.position||'').toUpperCase()==='G')===isGoalie).map(player=>({player,stats:WorldEngine.getPlayerStatsByScope?.(player,selectedScope)||null})).filter(e=>e.stats&&Number(e.stats.gamesPlayed||0)>0);}
  function best(rows,key,second=null){return [...rows].sort((a,b)=>Number(b.stats?.[key]||0)-Number(a.stats?.[key]||0)||(second?Number(b.stats?.[second]||0)-Number(a.stats?.[second]||0):0)||nameOf(a.player).localeCompare(nameOf(b.player)))[0]||null;}
  function fmt(e,key,fn=v=>String(v)){return e?`${nameOf(e.player)} · ${fn(e.stats?.[key]||0)}`:'No stats yet';}
  function update(){const team=currentTeam();if(!team)return;syncPalette(team);WorldEngine.rebuildHighSchoolPostseasonStats?.();const s=entries(team,false),g=entries(team,true),goals=best(s,'goals','points'),assists=best(s,'assists','points'),points=[...s].sort((a,b)=>Number(b.stats?.points||0)-Number(a.stats?.points||0)||Number(b.stats?.goals||0)-Number(a.stats?.goals||0))[0]||null,wins=best(g,'wins','savePercentage'),sv=best(g,'savePercentage','wins');const vals={'team-leader-goals':fmt(goals,'goals'),'team-leader-assists':fmt(assists,'assists'),'team-leader-points':fmt(points,'points'),'team-leader-wins':fmt(wins,'wins'),'team-leader-save-percentage':fmt(sv,'savePercentage',v=>Number(v||0).toFixed(3).replace(/^0/,''))};Object.entries(vals).forEach(([id,text])=>{const el=document.querySelector(`#hub-tab-team [id="${id}"]`)||document.getElementById(id);if(el){el.textContent=text;el.classList.toggle('pi-team-leader-empty',text==='No stats yet');}});}
  function syncButtons(){const c=document.querySelector(`#hub-tab-team #${CONTROL_ID}`)||document.getElementById(CONTROL_ID);c?.querySelectorAll('button[data-scope]').forEach(b=>{const on=b.dataset.scope===selectedScope;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',on?'true':'false');});}
  function ensureControl(){const section=document.querySelector('#hub-tab-team .team-leaders'),header=section?.querySelector('.team-leaders__header');if(!section||!header)return;injectStyles();let c=section.querySelector(`#${CONTROL_ID}`);if(!postseasonAvailable()){c?.remove();selectedScope='regular-season';return;}if(!c){c=document.createElement('div');c.id=CONTROL_ID;c.innerHTML='<button type="button" data-scope="regular-season">Regular Season</button><button type="button" data-scope="playoffs">Playoffs</button>';header.insertAdjacentElement('afterend',c);c.addEventListener('click',e=>{const b=e.target.closest('button[data-scope]');if(!b)return;selectedScope=b.dataset.scope==='playoffs'?'playoffs':'regular-season';syncButtons();update();});}syncButtons();const full=document.getElementById('team-view-full-stats');if(full&&full.dataset.piScopeBound!=='true'){full.dataset.piScopeBound='true';full.addEventListener('click',()=>{if(typeof Game!=='undefined')Game.fullStatsScope=selectedScope;},true);}}
  function render(){ensureControl();update();}
  const oh=typeof openHubTab==='function'?openHubTab:null;if(oh)window.openHubTab=function(tab,...args){const out=oh(tab,...args);if(String(tab||'').toLowerCase()==='team')requestAnimationFrame(render);return out;};
  const ot=typeof openTeamTab==='function'?openTeamTab:null;if(ot)window.openTeamTab=function(...args){const out=ot(...args);requestAnimationFrame(render);return out;};
  document.addEventListener('click',e=>{if(e.target?.closest?.('.hub-nav__item,[data-tab]'))requestAnimationFrame(render);});
  WorldEngine.renderScopedTeamLeaders=render;
})();
