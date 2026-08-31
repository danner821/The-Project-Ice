'use strict';

/* global WorldEngine, REAL_PROSPECTS */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const VERSION = 3;
  const STYLE_ID = 'pi-travel-roster-profile-styles';
  const FIRST = ['Aiden','Blake','Brady','Cam','Carter','Cole','Connor','Dylan','Ethan','Evan','Gavin','Hudson','Jack','Jake','Liam','Logan','Lucas','Mason','Max','Nolan','Noah','Owen','Parker','Ryan','Sam','Tyler','Wyatt'];
  const LAST = ['Anderson','Bailey','Bell','Bennett','Brooks','Carter','Cook','Cooper','Foster','Gray','Hayes','Howard','Hughes','Johnson','Kelly','Lewis','Miller','Morgan','Murphy','Nelson','Perry','Peterson','Price','Reed','Richardson','Ross','Shaw','Sullivan','Thompson','Turner','Ward','Wood','Young'];
  const CLUB_META = {
    'arizona-jr-coyotes': { coachName:'Matt Reynolds', coachStyle:'Speed and transition', arenaName:'AZ Ice Peoria', arenaCapacity:650, prestige:2, strength:-1, identity:'Fast, aggressive transition hockey', primaryColor:'#8c2633', secondaryColor:'#e2d6b5' },
    'colorado-thunderbirds': { coachName:'Ryan Caldwell', coachStyle:'Puck possession', arenaName:'Family Sports Center', arenaCapacity:900, prestige:3, strength:1, identity:'Skilled possession and pace', primaryColor:'#173f7a', secondaryColor:'#d8e8ff' },
    'dallas-stars-elite': { coachName:'Chris Wallace', coachStyle:'Structured two-way', arenaName:'Comerica Center', arenaCapacity:3500, prestige:4, strength:2, identity:'Structured, mature two-way hockey', primaryColor:'#006847', secondaryColor:'#b3b7b9' },
    'chicago-mission': { coachName:'Mike O’Donnell', coachStyle:'High-pressure attack', arenaName:'Seven Bridges Ice Arena', arenaCapacity:1200, prestige:5, strength:3, identity:'Relentless pressure and elite skill', primaryColor:'#c8102e', secondaryColor:'#ffffff' },
    'little-caesars': { coachName:'Dan Stevens', coachStyle:'Physical possession', arenaName:'Little Caesars Arena Practice Rink', arenaCapacity:1000, prestige:5, strength:2, identity:'Heavy, skilled possession hockey', primaryColor:'#ce1126', secondaryColor:'#ffffff' },
    'pittsburgh-penguins-elite': { coachName:'Kevin Murphy', coachStyle:'Attack through the middle', arenaName:'UPMC Lemieux Sports Complex', arenaCapacity:1500, prestige:4, strength:2, identity:'Creative offense through the middle', primaryColor:'#fcb514', secondaryColor:'#000000' },
    'boston-jr-eagles': { coachName:'Sean McCarthy', coachStyle:'Smart puck support', arenaName:'New England Sports Center', arenaCapacity:1800, prestige:5, strength:3, identity:'High-IQ support and puck movement', primaryColor:'#1b365d', secondaryColor:'#c4ced4' },
    'la-jr-kings': { coachName:'Jason Miller', coachStyle:'Rush offense', arenaName:'Toyota Sports Performance Center', arenaCapacity:900, prestige:3, strength:0, identity:'Quick-strike rush offense', primaryColor:'#111111', secondaryColor:'#a2aaad' },
  };

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const pid = p => String(p?.playerId || p?.id || '');
  const pname = p => String(p?.name || p?.playerName || [p?.firstName,p?.lastName].filter(Boolean).join(' ').trim() || 'Player');
  const ovr = p => Number(p?.overall ?? p?.ovr ?? p?.rating ?? 60);
  const pos = p => {
    const raw = String(p?.position || p?.pos || '').toUpperCase();
    if (raw === 'G' || raw.includes('GOAL')) return 'G';
    if (raw === 'D' || raw.includes('DEF')) return 'D';
    if (raw.includes('LEFT') || raw === 'LW') return 'LW';
    if (raw.includes('RIGHT') || raw === 'RW') return 'RW';
    return 'C';
  };
  function hash(value){ let h=2166136261; for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; }
  function seededSort(list, seed){ return [...list].sort((a,b)=>hash(`${seed}:${pid(a)||pname(a)}`)-hash(`${seed}:${pid(b)||pname(b)}`)); }
  function baseFor(level){ return ({B:58,A:64,AA:70,AAA:76})[String(level||'A').toUpperCase()] || 64; }
  function normalizeProspect(p){
    return {
      ...p,
      playerId: pid(p) || `prospect:${hash(pname(p))}`,
      sourcePlayerId: pid(p) || null,
      name: pname(p),
      position: pos(p),
      overall: ovr(p),
      ovr: ovr(p),
      isRealProspect: p?.isRealProspect === true || p?.realProspect === true || Boolean(p?.prospectId) || Boolean(p?.draftYear),
      travelStats: p?.travelStats || {gp:0,g:0,a:0,pts:0,pim:0,sog:0},
    };
  }
  function generated(team, slot, level, delta){
    const seed=hash(`${team.teamId}:${slot}:${level}:travel-v${VERSION}`), first=FIRST[seed%FIRST.length], last=LAST[Math.floor(seed/31)%LAST.length];
    const positions=['C','LW','RW','C','LW','RW','C','LW','RW','C','LW','RW','D','D','D','D','D','D','G','G'];
    const position=positions[slot] || 'C';
    const overall=Math.max(45,Math.min(88,baseFor(level)+delta+((seed%9)-4)));
    return { playerId:`travel-gen:${team.teamId}:${slot}:v${VERSION}`, name:`${first} ${last}`, firstName:first,lastName:last,position,overall,ovr:overall,generatedTravelPlayer:true,travelStats:{gp:0,g:0,a:0,pts:0,pim:0,sog:0} };
  }
  function canonicalPlayer(){ return WorldEngine.state?.player || {}; }
  function worldPool(){
    const all = WorldEngine.getAllWorldPlayers?.() || (WorldEngine.state?.teams||[]).flatMap(t=>t.roster||[]);
    return Array.isArray(all) ? all : [];
  }
  function prospectPool(level){
    const target=baseFor(level), world=worldPool();
    let prospects=world.filter(p=>p && pid(p) && (p.isRealProspect===true || p.realProspect===true || p.prospectId) && Math.abs(ovr(p)-target)<=8);
    try {
      if (typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)) {
        prospects.push(...REAL_PROSPECTS.filter(p=>p && Math.abs(ovr(p)-target)<=8));
      }
    } catch (_) {}
    const seen=new Set();
    return prospects.map(normalizeProspect).filter(p=>{const id=pid(p)||pname(p).toLowerCase(); if(!id||seen.has(id))return false; seen.add(id); return true;});
  }
  function otherWorldPool(level){
    const target=baseFor(level), careerId=pid(canonicalPlayer());
    return worldPool().filter(p=>p&&pid(p)&&pid(p)!==careerId&&!p.isCareerPlayer&&Math.abs(ovr(p)-target)<=7).map(normalizeProspect);
  }
  function clubId(team){ return team.clubId || team.organizationId || String(team.teamId||'').replace(/^travel-/,'').replace(/-(b|a|aa|aaa)$/i,''); }
  function applyTeamMeta(team){
    const meta=CLUB_META[clubId(team)] || {};
    Object.assign(team, {
      coachName:meta.coachName||'Travel Hockey Staff', coachStyle:meta.coachStyle||'Balanced development',
      coach:{name:meta.coachName||'Travel Hockey Staff',style:meta.coachStyle||'Balanced development'},
      arenaName:meta.arenaName||`${team.city||'Regional'} Ice Center`, arenaCapacity:meta.arenaCapacity||800,
      arena:{name:meta.arenaName||`${team.city||'Regional'} Ice Center`,capacity:meta.arenaCapacity||800},
      prestige:meta.prestige||3, identity:meta.identity||'Competitive summer travel hockey',
      primaryColor:meta.primaryColor||'#2f6fd6', secondaryColor:meta.secondaryColor||'#8fc1ff',
      teamStrengthDelta:meta.strength||0,
    });
  }
  function buildLineup(team){
    const forwards=(team.roster||[]).filter(p=>pos(p)!=='D'&&pos(p)!=='G').sort((a,b)=>ovr(b)-ovr(a));
    const defense=(team.roster||[]).filter(p=>pos(p)==='D').sort((a,b)=>ovr(b)-ovr(a));
    const goalies=(team.roster||[]).filter(p=>pos(p)==='G').sort((a,b)=>ovr(b)-ovr(a));
    const fLines=[0,1,2,3].map(i=>forwards.slice(i*3,i*3+3));
    const dPairs=[0,1,2].map(i=>defense.slice(i*2,i*2+2));
    const pp1=[...forwards.slice(0,3),...defense.slice(0,2)], pp2=[...forwards.slice(3,6),...defense.slice(2,4)];
    const pk1=[...forwards.slice(0,2),...defense.slice(0,2)], pk2=[...forwards.slice(2,4),...defense.slice(2,4)];
    team.forwardLines=fLines; team.defensePairs=dPairs; team.goalies=goalies;
    team.lines={forwards:fLines,defense:dPairs,goalies};
    team.lineup={forwards:fLines,defense:dPairs,defensePairs:dPairs,goalies,starter:goalies[0]||null,backup:goalies[1]||null};
    team.specialTeams={powerPlay:[pp1,pp2],penaltyKill:[pk1,pk2],pp:[pp1,pp2],pk:[pk1,pk2]};
  }
  function rebuild(state){
    if(!state?.teams?.length || state.travelRosterWorldVersion===VERSION) return state;
    const level=state.placementLevel||'A', used=new Set(), prospects=seededSort(prospectPool(level),`prospects:${state.tryoutDate||''}:${level}`), others=seededSort(otherWorldPool(level),`world:${state.tryoutDate||''}:${level}`);
    const career=normalizeProspect(canonicalPlayer()); career.isCareerPlayer=true;
    state.teams.forEach((team,index)=>{
      applyTeamMeta(team); const meta=CLUB_META[clubId(team)]||{}, roster=[];
      const desired={F:12,D:6,G:2};
      const take=(pool,wantedProspects=false)=>{
        for(const p of pool){ if(roster.length>=20)break; const id=pid(p)||pname(p).toLowerCase(); if(!id||used.has(id))continue;
          const bucket=pos(p)==='G'?'G':pos(p)==='D'?'D':'F', count=roster.filter(x=>(pos(x)==='G'?'G':pos(x)==='D'?'D':'F')===bucket).length;
          if(count>=desired[bucket])continue; if(wantedProspects && roster.filter(x=>x.isRealProspect).length>=4)break;
          used.add(id); roster.push({...p,travelStats:p.travelStats||{gp:0,g:0,a:0,pts:0,pim:0,sog:0}});
        }
      };
      take(seededSort(prospects,team.teamId),true); take(seededSort(others,team.teamId));
      while(roster.filter(p=>pos(p)!=='D'&&pos(p)!=='G').length<12) roster.push(generated(team,roster.length,level,meta.strength||0));
      while(roster.filter(p=>pos(p)==='D').length<6){const p=generated(team,12+roster.filter(x=>pos(x)==='D').length,level,meta.strength||0);p.position='D';roster.push(p);}
      while(roster.filter(p=>pos(p)==='G').length<2){const p=generated(team,18+roster.filter(x=>pos(x)==='G').length,level,meta.strength||0);p.position='G';roster.push(p);}
      team.roster=roster.slice(0,20);
      buildLineup(team);
    });
    const mine=state.teams.find(t=>String(t.teamId)===String(state.playerTeamId)) || state.teams[0];
    if(mine){
      mine.roster=mine.roster.filter(p=>!p.isCareerPlayer && pid(p)!==pid(career));
      const replace=mine.roster.findIndex(p=>pos(p)!=='G'&&pos(p)!=='D'); if(replace>=0)mine.roster.splice(replace,1);
      mine.roster.unshift(career); mine.roster=mine.roster.slice(0,20); buildLineup(mine);
    }
    state.travelRosterWorldVersion=VERSION; WorldEngine.save?.(); return state;
  }

  const originalEnsure=typeof WorldEngine.ensureTravelHockeyWorld==='function'?WorldEngine.ensureTravelHockeyWorld.bind(WorldEngine):null;
  if(originalEnsure && !WorldEngine.__travelRosterWorldWrapped){
    WorldEngine.__travelRosterWorldWrapped=true;
    WorldEngine.ensureTravelHockeyWorld=function(options={}){ const out=originalEnsure(options)||travel(); return rebuild(out); };
  }

  function injectStyles(){ if(document.getElementById(STYLE_ID))return; const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`#pi-travel-profile-roster{margin:28px 0 40px}.pi-trp-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.pi-trp-head h3{margin:0;font-size:18px}.pi-trp-head span{color:#6f86a4;font-size:9px;font-weight:900;text-transform:uppercase}.pi-trp-list{display:grid;gap:7px}.pi-trp-player{display:grid;grid-template-columns:34px minmax(0,1fr) 42px;gap:8px;align-items:center;padding:11px 12px;border:1px solid rgba(255,255,255,.065);border-radius:13px;background:rgba(255,255,255,.025);cursor:pointer}.pi-trp-player.you{border-color:rgba(91,159,244,.3);background:rgba(48,111,199,.15)}.pi-trp-pos{color:#79adf5;font-size:9px;font-weight:900}.pi-trp-name{font-size:11px;font-weight:850}.pi-trp-name small{display:block;color:#657b96;font-size:8px;margin-top:2px}.pi-trp-ovr{text-align:right;font-size:11px;font-weight:900}`;document.head.appendChild(s); }
  function currentTravelAdapter(){ return (WorldEngine.state?.teams||[]).find(t=>t.travelProfileAdapter===true) || null; }
  function openPlayer(p){ if(typeof globalThis.openPlayerProfile!=='function')return; const source=p.sourcePlayerId?WorldEngine.getPlayerById?.(p.sourcePlayerId):null; globalThis.openPlayerProfile(source||p,'hub'); }
  function patchProfile(){
    const screen=document.getElementById('team-profile-screen'), team=currentTravelAdapter(); if(!screen||!team||screen.classList.contains('screen--hidden'))return;
    injectStyles(); applyTeamMeta(team); buildLineup(team);
    const replacements=[['Coach unavailable',team.coachName],['Coaching style unavailable.',team.coachStyle],['Arena unavailable',team.arenaName],['Capacity unavailable',`${team.arenaCapacity.toLocaleString()} capacity`],['JUNIOR VARSITY',`${team.level||travel()?.placementLevel||'A'} TRAVEL HOCKEY`]];
    const walker=document.createTreeWalker(screen,NodeFilter.SHOW_TEXT); const nodes=[]; while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){for(const [from,to] of replacements){if(String(node.nodeValue||'').trim().toUpperCase()===from.toUpperCase())node.nodeValue=String(node.nodeValue).replace(node.nodeValue.trim(),to);}}
    const ordered=[...(team.forwardLines||[]).flat(),...(team.defensePairs||[]).flat(),...(team.goalies||[])]; let slot=0;
    const empties=[...screen.querySelectorAll('*')].filter(el=>el.children.length===0&&String(el.textContent||'').trim()==='Empty');
    for(const el of empties){const p=ordered[slot%ordered.length];slot+=1;if(!p)continue;el.textContent=pname(p);el.style.cursor='pointer';el.dataset.travelPlayerId=pid(p)||p.sourcePlayerId||'';el.addEventListener('click',e=>{e.stopPropagation();openPlayer(p);},{once:false});}
    let roster=document.getElementById('pi-travel-profile-roster'); if(!roster){roster=document.createElement('section');roster.id='pi-travel-profile-roster'; const mount=document.getElementById('team-profile-modern-content')||screen.querySelector('.tp-wrap')||screen; mount.appendChild(roster);}
    roster.innerHTML=`<div class="pi-trp-head"><h3>Roster</h3><span>${team.roster.length} Players</span></div><div class="pi-trp-list">${[...(team.roster||[])].sort((a,b)=>(pos(a)==='G')-(pos(b)==='G')||ovr(b)-ovr(a)).map(p=>`<div class="pi-trp-player${p.isCareerPlayer?' you':''}" data-id="${pid(p)||p.sourcePlayerId||''}"><span class="pi-trp-pos">${pos(p)}</span><span class="pi-trp-name">${pname(p)}${p.isCareerPlayer?'<small>YOU</small>':p.isRealProspect?'<small>PROSPECT</small>':''}</span><span class="pi-trp-ovr">${ovr(p)}</span></div>`).join('')}</div>`;
    roster.querySelectorAll('.pi-trp-player').forEach((row,i)=>row.addEventListener('click',()=>openPlayer([...(team.roster||[])].sort((a,b)=>(pos(a)==='G')-(pos(b)==='G')||ovr(b)-ovr(a))[i])));
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(patchProfile)); observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#team-profile-screen'))setTimeout(patchProfile,0);},{passive:true});
  setTimeout(()=>{const s=travel(); if(s?.teams?.length)rebuild(s);},400);
  WorldEngine.rebuildTravelHockeyRosters=()=>rebuild(travel());
})();