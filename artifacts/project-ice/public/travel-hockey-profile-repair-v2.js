'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  let activeTravelTeam=null,restoreTeamId=null;
  const travel=()=>WorldEngine.getTravelHockeyState?.()||WorldEngine.state?.travelHockey||null;
  const idOf=p=>String(p?.playerId||p?.id||'');
  const sourceIdOf=p=>String(p?.sourcePlayerId||p?.playerId||p?.id||'');
  const nameOf=p=>String(p?.name||p?.playerName||[p?.firstName,p?.lastName].filter(Boolean).join(' ').trim()||'Player');

  function realCareerTeamId(){const p=WorldEngine.state?.player||{},ids=new Set([String(p.playerId||''),String(p.id||''),'career-player'].filter(Boolean));return (WorldEngine.state?.teams||[]).find(t=>!t?.travelProfileAdapter&&(t.roster||[]).some(x=>x?.isCareerPlayer===true||ids.has(String(x?.playerId||x?.id||''))))?.teamId||Game?.player?.highSchoolTeamId||p?.highSchoolTeamId||null;}
  function restoreHsTeam(){
    if(Array.isArray(WorldEngine.state?.teams))WorldEngine.state.teams=WorldEngine.state.teams.filter(t=>t?.travelProfileAdapter!==true);
    const id=realCareerTeamId()||restoreTeamId;
    try{
      if(typeof Game!=='undefined'&&id)Game.teamTabSelectedTeamId=id;
      if(id&&typeof globalThis.renderTeamTab==='function')globalThis.renderTeamTab(id);
      if(typeof Game!=='undefined'&&id)Game.teamTabSelectedTeamId=id;
    }catch(_){}
    return id;
  }

  /*
   * The bottom Team tab is a permanent "My Team" destination. The core
   * openTeamTab(null, 'hub') path otherwise reuses whichever team was last
   * selected/rendered, which is why visiting any Team Profile can turn the
   * Team tab into that team. Preserve explicit teamId navigation, but when the
   * hub asks for Team with no explicit target, resolve the career player's real
   * HS roster team every time.
   */
  function installTeamTabOwnership(){
    if(typeof globalThis.openTeamTab!=='function'||globalThis.__projectIceMyTeamTabWrapped)return false;
    const original=globalThis.openTeamTab;
    globalThis.__projectIceMyTeamTabWrapped=true;
    globalThis.openTeamTab=function(teamId=null,origin='hub'){
      const resolved=(teamId==null&&origin==='hub')?(realCareerTeamId()||teamId):teamId;
      if(typeof Game!=='undefined'&&resolved)Game.teamTabSelectedTeamId=resolved;
      return original(resolved,origin);
    };
    return true;
  }

  function patch(team){const screen=document.getElementById('team-profile-screen'),root=document.getElementById('team-profile-modern-content');if(!team||!screen||!root||screen.classList.contains('screen--hidden'))return;root.dataset.travelTeamId=String(team.teamId||'');root.dataset.travelProfile='true';const p=root.querySelector('.team-profile-style-hero__color-primary'),s=root.querySelector('.team-profile-style-hero__color-secondary');if(p)p.style.background=team.primaryColor||'#2f6fd6';if(s)s.style.background=team.secondaryColor||'#8fc1ff';WorldEngine.renderScopedTeamProfileLeaders?.();}
  function install(){installTeamTabOwnership();if(typeof WorldEngine.openTravelTeamProfile!=='function'||WorldEngine.__travelProfileRepairV4Wrapped)return false;const original=WorldEngine.openTravelTeamProfile.bind(WorldEngine);WorldEngine.__travelProfileRepairV4Wrapped=true;WorldEngine.openTravelTeamProfile=function(teamId){const state=WorldEngine.rebuildTravelHockeyRosters?.()||travel();activeTravelTeam=(state?.teams||[]).find(t=>String(t.teamId)===String(teamId))||null;restoreTeamId=realCareerTeamId();const out=original(teamId);requestAnimationFrame(()=>requestAnimationFrame(()=>{patch(activeTravelTeam);restoreHsTeam();}));return out;};return true;}
  document.addEventListener('click',event=>{const root=event.target?.closest?.('#team-profile-modern-content'),card=event.target?.closest?.('[data-player-id]');if(root&&card&&activeTravelTeam){const id=String(card.dataset.playerId||''),p=(activeTravelTeam.roster||[]).find(x=>idOf(x)===id||sourceIdOf(x)===id);if(p){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const target=p.isRealProspect===true&&p.sourcePlayerId?(WorldEngine.getPlayerById?.(p.sourcePlayerId)||p):p;globalThis.openPlayerProfile?.(target,'hub');}}if(event.target?.closest?.('#btn-back-team-profile')){activeTravelTeam=null;restoreTeamId=null;}},true);
  install();setTimeout(install,50);setTimeout(install,150);setTimeout(install,350);setTimeout(install,800);
})();
