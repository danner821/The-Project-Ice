'use strict';

/* global WorldEngine, Game, renderTeamTab, openPlayerProfile */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const STYLE_ID = 'pi-travel-profile-repair-v2-style';
  const LAST_KEY = 'projectice_travel_last_club_v2';
  let activeTravelTeam = null;

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const idOf = p => String(p?.playerId || p?.id || '');
  const sourceIdOf = p => String(p?.sourcePlayerId || p?.playerId || p?.id || '');
  const nameOf = p => String(p?.name || p?.playerName || [p?.firstName,p?.lastName].filter(Boolean).join(' ').trim() || 'Player');
  const ovr = p => Number(p?.overall ?? p?.ovr ?? p?.rating ?? 0);
  const pos = p => {
    const raw = String(p?.position || p?.pos || '').toUpperCase();
    if (raw === 'G' || raw.includes('GOAL')) return 'G';
    if (raw === 'D' || raw.includes('DEF')) return 'D';
    if (raw === 'LW' || raw.includes('LEFT')) return 'LW';
    if (raw === 'RW' || raw.includes('RIGHT')) return 'RW';
    return 'C';
  };

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `.pi-prospect-rank-badge{display:block;margin-top:3px;color:#657b96;font-size:7px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}`;
    document.head.appendChild(s);
  }

  function takePreferred(pool, preferred) {
    let i = pool.findIndex(p => pos(p) === preferred);
    if (i < 0) i = 0;
    return i >= 0 ? pool.splice(i, 1)[0] : null;
  }

  function assignNativeSlots(team) {
    if (!team?.roster) return team;
    for (const p of team.roster) {
      delete p.rosterSlot;
      delete p.slot;
    }
    const forwards = team.roster.filter(p => !['D','G'].includes(pos(p))).sort((a,b)=>ovr(b)-ovr(a));
    const defense = team.roster.filter(p => pos(p)==='D').sort((a,b)=>ovr(b)-ovr(a));
    const goalies = team.roster.filter(p => pos(p)==='G').sort((a,b)=>ovr(b)-ovr(a));
    const f = [...forwards];
    for (let line=1; line<=4; line+=1) {
      const lw = takePreferred(f,'LW'), c = takePreferred(f,'C'), rw = takePreferred(f,'RW');
      if (lw) lw.rosterSlot = `fwd-${line}-lw`;
      if (c) c.rosterSlot = `fwd-${line}-c`;
      if (rw) rw.rosterSlot = `fwd-${line}-rw`;
    }
    for (let pair=1; pair<=3; pair+=1) {
      const ld = defense[(pair-1)*2], rd = defense[(pair-1)*2+1];
      if (ld) ld.rosterSlot = `def-${pair}-ld`;
      if (rd) rd.rosterSlot = `def-${pair}-rd`;
    }
    if (goalies[0]) goalies[0].rosterSlot = 'g-starter';
    if (goalies[1]) goalies[1].rosterSlot = 'g-backup';

    const playerId = p => p ? (p.playerId || p.id || null) : null;
    const fwd = team.roster.filter(p=>String(p.rosterSlot||'').startsWith('fwd-')).sort((a,b)=>String(a.rosterSlot).localeCompare(String(b.rosterSlot)));
    const def = team.roster.filter(p=>String(p.rosterSlot||'').startsWith('def-')).sort((a,b)=>String(a.rosterSlot).localeCompare(String(b.rosterSlot)));
    const pp1=[...fwd.slice(0,3),...def.slice(0,2)], pp2=[...fwd.slice(3,6),...def.slice(2,4)];
    const pk1=[...fwd.slice(0,2),...def.slice(0,2)], pk2=[...fwd.slice(2,4),...def.slice(2,4)];
    const pp = u => ({slots:{leftFlank:playerId(u[0]),bumper:playerId(u[1]),rightFlank:playerId(u[2]),netFront:playerId(u[3]),quarterback:playerId(u[4])}});
    const pk = u => ({slots:{leftForward:playerId(u[0]),rightForward:playerId(u[1]),leftDefense:playerId(u[2]),rightDefense:playerId(u[3])}});
    team.specialTeams = { powerPlay:[pp(pp1),pp(pp2)], penaltyKill:[pk(pk1),pk(pk2)] };
    return team;
  }

  function repairTravelWorld() {
    const s = travel();
    if (!s?.teams?.length) return s;
    for (const team of s.teams) assignNativeSlots(team);
    return s;
  }

  function rankRows() {
    let rows=[];
    try { rows = WorldEngine.getProspectRankings?.() || WorldEngine.state?.prospectRankings || WorldEngine.state?.prospects || []; } catch (_) {}
    if (!Array.isArray(rows)) rows=[];
    return [...rows].sort((a,b)=>Number(a?.rank??a?.prospectRank??a?.ranking??9999)-Number(b?.rank??b?.prospectRank??b?.ranking??9999)).slice(0,100);
  }

  function prospectRank(player) {
    if (!player || player.generatedTravelPlayer === true) return null;
    const rows = rankRows();
    const ids = new Set([String(player.sourcePlayerId||''), String(player.playerId||''), String(player.id||'')].filter(Boolean));
    for (let i=0;i<rows.length;i+=1) {
      const r=rows[i], rid=String(r?.playerId||r?.id||r?.prospectId||'');
      if (rid && ids.has(rid)) return Number(r?.rank??r?.prospectRank??r?.ranking??i+1);
    }
    if (player.isRealProspect === true || player.realProspect === true || player.prospectId) {
      const n=nameOf(player).toLowerCase();
      const i=rows.findIndex(r=>nameOf(r).toLowerCase()===n);
      if (i>=0) return Number(rows[i]?.rank??rows[i]?.prospectRank??rows[i]?.ranking??i+1);
    }
    return null;
  }

  function decorateNativeCards(root, team) {
    if (!root || !team) return;
    root.querySelectorAll('.pi-prospect-rank-badge').forEach(x=>x.remove());
    for (const card of root.querySelectorAll('[data-player-id]')) {
      const id=String(card.dataset.playerId||'');
      const p=(team.roster||[]).find(x=>idOf(x)===id || sourceIdOf(x)===id);
      const rank=prospectRank(p);
      if (!rank) continue;
      const target=card.querySelector('.lineup-player__overall') || card.querySelector('.lineup-player__name') || card;
      const badge=document.createElement('small'); badge.className='pi-prospect-rank-badge'; badge.textContent=`Prospect #${rank}`;
      target.insertAdjacentElement('afterend',badge);
    }
  }

  function travelLeader(team, key, goalie=false) {
    const pool=(team?.roster||[]).filter(p=>Number(p?.travelStats?.gp||0)>0 && (!goalie || pos(p)==='G'));
    if (!pool.length) return null;
    return [...pool].sort((a,b)=>Number(b.travelStats?.[key]||0)-Number(a.travelStats?.[key]||0))[0];
  }

  function patchProfileDom(team) {
    const screen=document.getElementById('team-profile-screen');
    const root=document.getElementById('team-profile-modern-content');
    if (!screen || !root || screen.classList.contains('screen--hidden')) return;

    document.getElementById('pi-travel-clean-lineup')?.remove();
    document.getElementById('pi-travel-clean-leaders')?.remove();
    document.getElementById('pi-travel-profile-roster')?.remove();
    document.getElementById('pi-team-profile-leaders-scope')?.remove();
    root.querySelectorAll('[data-pi-travel-original-lineup],[data-pi-travel-original-leaders]').forEach(el=>{el.style.display=''; delete el.dataset.piTravelOriginalLineup; delete el.dataset.piTravelOriginalLeaders;});

    const rosterSection=root.querySelector('.team-roster');
    const leadersSection=root.querySelector('.team-leaders');
    if (rosterSection) rosterSection.style.display='';
    if (leadersSection) {
      leadersSection.style.display='';
      const label=leadersSection.querySelector('.team-section-label'); if(label) label.textContent='Travel Leaders';
      leadersSection.querySelectorAll('[id*="scope"],.team-leader-scope,.team-leader-scope-control').forEach(x=>x.remove());
      const set=(suffix,value)=>{const el=leadersSection.querySelector(`[id$="${suffix}"]`); if(el) el.textContent=value;};
      const g=travelLeader(team,'g'), a=travelLeader(team,'a'), pts=travelLeader(team,'pts');
      const gw=travelLeader(team,'wins',true) || travelLeader(team,'w',true);
      const sv=(team.roster||[]).filter(p=>pos(p)==='G'&&Number(p?.travelStats?.gp||0)>0).sort((x,y)=>Number(y.travelStats?.savePercentage||0)-Number(x.travelStats?.savePercentage||0))[0];
      set('team-leader-goals',g?`${nameOf(g)} · ${Number(g.travelStats.g||0)}`:'No stats yet');
      set('team-leader-assists',a?`${nameOf(a)} · ${Number(a.travelStats.a||0)}`:'No stats yet');
      set('team-leader-points',pts?`${nameOf(pts)} · ${Number(pts.travelStats.pts||0)}`:'No stats yet');
      set('team-leader-wins',gw?`${nameOf(gw)} · ${Number(gw.travelStats.wins||gw.travelStats.w||0)}`:'No stats yet');
      set('team-leader-save-percentage',sv?`${nameOf(sv)} · ${Number(sv.travelStats.savePercentage||0).toFixed(3)}`:'No stats yet');
    }
    decorateNativeCards(root, team);
  }

  function realCareerTeamId() {
    const p=WorldEngine.state?.player||{}; const ids=new Set([String(p.playerId||''),String(p.id||''),'career-player'].filter(Boolean));
    const t=(WorldEngine.state?.teams||[]).find(team=>!team.travelProfileAdapter && (team.roster||[]).some(x=>x?.isCareerPlayer===true || ids.has(String(x?.playerId||x?.id||''))));
    return t?.teamId || null;
  }

  function cleanupAdapterAndRestore(restoreId) {
    if (Array.isArray(WorldEngine.state?.teams)) WorldEngine.state.teams=WorldEngine.state.teams.filter(t=>t?.travelProfileAdapter!==true);
    const id=restoreId || realCareerTeamId();
    try { if (typeof Game !== 'undefined' && id) Game.teamTabSelectedTeamId=id; } catch (_) {}
    try { if (id && typeof globalThis.renderTeamTab==='function') globalThis.renderTeamTab(id); } catch (_) {}
  }

  function randomDifferentPlacement() {
    const s=travel(), r=s?.tryoutResult, level=s?.placementLevel||r?.placementLevel;
    const options=s?.teamOptionsByLevel?.[level];
    if(!s||!r||!level||!Array.isArray(options)||options.length<2) return;
    let last=''; try{last=localStorage.getItem(`${LAST_KEY}:${level}`)||'';}catch(_){}
    let pool=options.filter(o=>String(o.teamId)!==last);
    if(!pool.length) pool=options.slice();
    let pick=pool[Math.floor(Math.random()*pool.length)];
    if(String(pick?.teamId||'')===String(r.placementTeamId||'') && pool.length>1) pick=pool[(pool.indexOf(pick)+1)%pool.length];
    if(!pick) return;
    r.randomClubApplied=true; r.placementTeamId=pick.teamId; r.placementTeamName=pick.name; r.placementTeamCity=pick.city;
    s.placementTeamId=pick.teamId; s.placementTeamName=pick.name; s.playerTeamId=pick.teamId; s.playerTeamName=pick.name; s.placementTeam={...pick};
    delete s.worldVersion; delete s.travelRosterWorldVersion; delete s.teams; delete s.tournament;
    try{localStorage.setItem(`${LAST_KEY}:${level}`,String(pick.teamId));}catch(_){}
    const card=document.querySelector('#pi-travel-tryouts-screen .pi-travel-team');
    if(card){const n=card.querySelector('strong'),c=card.querySelector('small');if(n)n.textContent=pick.name;if(c)c.textContent=pick.city||'';}
    WorldEngine.save?.();
  }

  function install() {
    injectStyle(); repairTravelWorld();
    if (typeof WorldEngine.openTravelTeamProfile==='function' && !WorldEngine.__travelProfileRepairV2Wrapped) {
      const original=WorldEngine.openTravelTeamProfile.bind(WorldEngine);
      WorldEngine.__travelProfileRepairV2Wrapped=true;
      WorldEngine.openTravelTeamProfile=function(teamId){
        repairTravelWorld();
        const s=travel(); const team=(s?.teams||[]).find(t=>String(t.teamId)===String(teamId));
        if(team) assignNativeSlots(team);
        let restore=null; try{restore=typeof Game!=='undefined'?Game.teamTabSelectedTeamId:null;}catch(_){}
        activeTravelTeam=team||null;
        const out=original(teamId);
        requestAnimationFrame(()=>{patchProfileDom(activeTravelTeam);cleanupAdapterAndRestore(restore);setTimeout(()=>patchProfileDom(activeTravelTeam),40);});
        return out;
      };
    }
  }

  document.addEventListener('click',event=>{
    const see=event.target?.closest?.('#pi-travel-tryouts-screen .pi-travel-next');
    if(see && /see placement/i.test(see.textContent||'')){setTimeout(randomDifferentPlacement,25);return;}
    const screen=event.target?.closest?.('#team-profile-modern-content');
    const card=event.target?.closest?.('[data-player-id]');
    if(screen&&card&&activeTravelTeam){
      const id=String(card.dataset.playerId||''); const p=(activeTravelTeam.roster||[]).find(x=>idOf(x)===id||sourceIdOf(x)===id);
      if(p){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        let target=p;
        if(p.isRealProspect===true && p.sourcePlayerId) target=WorldEngine.getPlayerById?.(p.sourcePlayerId)||p;
        if(typeof globalThis.openPlayerProfile==='function') globalThis.openPlayerProfile(target,'hub');
      }
    }
    if(event.target?.closest?.('#btn-back-team-profile,.hub-nav__tab')){activeTravelTeam=null;setTimeout(()=>cleanupAdapterAndRestore(null),0);}
  },true);

  const observer=new MutationObserver(()=>{install(); if(activeTravelTeam) patchProfileDom(activeTravelTeam);});
  observer.observe(document.body,{childList:true,subtree:true});
  install(); setTimeout(install,100); setTimeout(install,500);
})();