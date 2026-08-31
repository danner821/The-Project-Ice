'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const STYLE_ID='pi-travel-profile-repair-v2-style';
  let activeTravelTeam=null,restoreTeamId=null;
  const travel=()=>WorldEngine.getTravelHockeyState?.()||WorldEngine.state?.travelHockey||null;
  const idOf=p=>String(p?.playerId||p?.id||'');
  const sourceIdOf=p=>String(p?.sourcePlayerId||p?.playerId||p?.id||'');
  const nameOf=p=>String(p?.name||p?.playerName||[p?.firstName,p?.lastName].filter(Boolean).join(' ').trim()||'Player');

  function injectStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent='.pi-prospect-rank-badge{display:block;margin-top:3px;color:#657b96;font-size:7px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}';document.head.appendChild(s);}
  function rankRows(){let rows=[];try{rows=WorldEngine.getProspectRankings?.()||WorldEngine.state?.prospectRankings||WorldEngine.state?.prospects||[];}catch(_){}return Array.isArray(rows)?[...rows].sort((a,b)=>Number(a?.rank??a?.prospectRank??a?.ranking??9999)-Number(b?.rank??b?.prospectRank??b?.ranking??9999)).slice(0,100):[];}
  function prospectRank(player){
    const embedded=Number(player?.prospectRank);if(Number.isFinite(embedded)&&embedded>=1&&embedded<=100)return embedded;
    if(!player||player.generatedTravelPlayer===true)return null;const ids=new Set([String(player.sourcePlayerId||''),String(player.playerId||''),String(player.id||'')].filter(Boolean)),rows=rankRows();
    for(let i=0;i<rows.length;i++){const row=rows[i],rid=String(row?.playerId||row?.id||row?.prospectId||'');if(rid&&ids.has(rid))return Number(row?.rank??row?.prospectRank??row?.ranking??i+1);}
    if(player.isRealProspect===true){const n=nameOf(player).toLowerCase(),i=rows.findIndex(r=>nameOf(r).toLowerCase()===n);if(i>=0)return Number(rows[i]?.rank??rows[i]?.prospectRank??rows[i]?.ranking??i+1);}
    return null;
  }
  function decorate(root,team){if(!root||!team)return;root.querySelectorAll('.pi-prospect-rank-badge').forEach(n=>n.remove());for(const card of root.querySelectorAll('[data-player-id]')){const id=String(card.dataset.playerId||''),p=(team.roster||[]).find(x=>idOf(x)===id||sourceIdOf(x)===id),rank=prospectRank(p);if(!rank)continue;const target=card.querySelector('.lineup-player__overall')||card.querySelector('.lineup-player__name')||card.querySelector('[class*="overall"]')||card.querySelector('[class*="name"]')||card;const b=document.createElement('small');b.className='pi-prospect-rank-badge';b.textContent=`Prospect #${rank}`;target.insertAdjacentElement('afterend',b);}}
  function realCareerTeamId(){const p=WorldEngine.state?.player||{},ids=new Set([String(p.playerId||''),String(p.id||''),'career-player'].filter(Boolean));return (WorldEngine.state?.teams||[]).find(t=>!t?.travelProfileAdapter&&(t.roster||[]).some(x=>x?.isCareerPlayer===true||ids.has(String(x?.playerId||x?.id||''))))?.teamId||null;}
  function restoreHsTeam(){if(Array.isArray(WorldEngine.state?.teams))WorldEngine.state.teams=WorldEngine.state.teams.filter(t=>t?.travelProfileAdapter!==true);const id=restoreTeamId||realCareerTeamId();try{if(typeof Game!=='undefined'&&id)Game.teamTabSelectedTeamId=id;}catch(_){}return id;}
  function patch(team){const screen=document.getElementById('team-profile-screen'),root=document.getElementById('team-profile-modern-content');if(!team||!screen||!root||screen.classList.contains('screen--hidden'))return;root.dataset.travelTeamId=String(team.teamId||'');root.dataset.travelProfile='true';const p=root.querySelector('.team-profile-style-hero__color-primary'),s=root.querySelector('.team-profile-style-hero__color-secondary');if(p)p.style.background=team.primaryColor||'#2f6fd6';if(s)s.style.background=team.secondaryColor||'#8fc1ff';decorate(root,team);WorldEngine.renderScopedTeamProfileLeaders?.();}
  function install(){injectStyle();if(typeof WorldEngine.openTravelTeamProfile!=='function'||WorldEngine.__travelProfileRepairV4Wrapped)return false;const original=WorldEngine.openTravelTeamProfile.bind(WorldEngine);WorldEngine.__travelProfileRepairV4Wrapped=true;WorldEngine.openTravelTeamProfile=function(teamId){const state=WorldEngine.rebuildTravelHockeyRosters?.()||travel();activeTravelTeam=(state?.teams||[]).find(t=>String(t.teamId)===String(teamId))||null;try{restoreTeamId=typeof Game!=='undefined'?Game.teamTabSelectedTeamId:null;}catch(_){restoreTeamId=null;}const out=original(teamId);requestAnimationFrame(()=>requestAnimationFrame(()=>{patch(activeTravelTeam);restoreHsTeam();}));return out;};return true;}
  document.addEventListener('click',event=>{const root=event.target?.closest?.('#team-profile-modern-content'),card=event.target?.closest?.('[data-player-id]');if(root&&card&&activeTravelTeam){const id=String(card.dataset.playerId||''),p=(activeTravelTeam.roster||[]).find(x=>idOf(x)===id||sourceIdOf(x)===id);if(p){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const target=p.isRealProspect===true&&p.sourcePlayerId?(WorldEngine.getPlayerById?.(p.sourcePlayerId)||p):p;globalThis.openPlayerProfile?.(target,'hub');}}if(event.target?.closest?.('#btn-back-team-profile')){activeTravelTeam=null;restoreTeamId=null;}},true);
  install();setTimeout(install,50);setTimeout(install,150);setTimeout(install,350);setTimeout(install,800);
})();
