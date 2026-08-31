'use strict';

/* global WorldEngine, REAL_PROSPECTS */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const STYLE_ID = 'pi-travel-profile-fixes-styles';
  const HUB_ID = 'pi-travel-hockey-hub-canonical';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const ovr = p => Number(p?.overall ?? p?.ovr ?? p?.rating ?? 0);
  const pid = p => String(p?.playerId || p?.sourcePlayerId || p?.id || '');
  const pname = p => String(p?.name || p?.playerName || [p?.firstName,p?.lastName].filter(Boolean).join(' ').trim() || 'Player');
  const pos = p => {
    const raw = String(p?.position || p?.pos || '').toUpperCase();
    if (raw === 'G' || raw.includes('GOAL')) return 'G';
    if (raw === 'D' || raw.includes('DEF')) return 'D';
    if (raw === 'LW' || raw.includes('LEFT')) return 'LW';
    if (raw === 'RW' || raw.includes('RIGHT')) return 'RW';
    return 'C';
  };

  function currentAdapter() {
    return (WorldEngine.state?.teams || []).find(team => team?.travelProfileAdapter === true) || null;
  }

  function rankMap() {
    let rows = [];
    try {
      rows = WorldEngine.getProspectRankings?.() || WorldEngine.state?.prospectRankings || WorldEngine.state?.prospects || [];
    } catch (_) {}
    try {
      if (!Array.isArray(rows) || !rows.length) rows = typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS) ? REAL_PROSPECTS : [];
    } catch (_) { rows = []; }
    if (!Array.isArray(rows)) rows = [];
    const sorted = [...rows].sort((a,b) => {
      const ar = Number(a?.rank ?? a?.prospectRank ?? a?.ranking ?? a?.sourceOrder ?? 9999);
      const br = Number(b?.rank ?? b?.prospectRank ?? b?.ranking ?? b?.sourceOrder ?? 9999);
      if (ar !== br) return ar - br;
      return ovr(b) - ovr(a);
    });
    const map = new Map();
    sorted.slice(0,100).forEach((p,index) => {
      const rank = Number(p?.rank ?? p?.prospectRank ?? p?.ranking ?? p?.sourceOrder ?? (index + 1));
      const id = pid(p); const name = pname(p).toLowerCase();
      if (id) map.set(`id:${id}`, rank);
      if (name) map.set(`name:${name}`, rank);
    });
    return map;
  }

  function prospectRank(player, map = rankMap()) {
    const id = pid(player); const name = pname(player).toLowerCase();
    return (id && map.get(`id:${id}`)) || (name && map.get(`name:${name}`)) || null;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pi-travel-clean-lineup{margin-top:20px}
      .pi-travel-clean-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(93,153,235,.28);border-radius:14px;overflow:hidden;margin-bottom:18px}
      .pi-travel-clean-tab{border:0;background:transparent;color:#778ca9;padding:12px;font:inherit;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .pi-travel-clean-tab.on{background:linear-gradient(135deg,#2d71d7,#1d4f9c);color:#fff}
      .pi-travel-group{margin:16px 0 21px}.pi-travel-group>h4{margin:0 0 10px;color:#789fd3;font-size:10px;letter-spacing:.17em;text-transform:uppercase}
      .pi-travel-line-label{margin:11px 0 7px;color:#d8e2f2;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .pi-travel-line{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pi-travel-line.defense{grid-template-columns:repeat(2,minmax(0,1fr))}
      .pi-travel-slot{min-height:76px;border:1px solid rgba(91,153,239,.25);border-radius:14px;background:rgba(20,45,78,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 5px;text-align:center;cursor:pointer}
      .pi-travel-slot .pos{color:#98afd0;font-size:8px;font-weight:900}.pi-travel-slot .name{margin-top:3px;color:#f4f7fc;font-size:11px;font-weight:850;line-height:1.15}.pi-travel-slot .ovr{margin-top:3px;color:#c9d5e7;font-size:9px;font-weight:800}
      .pi-travel-slot .prospect,.pi-prospect-rank-badge{display:block;margin-top:3px;color:#6d809a;font-size:7px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
      .pi-travel-goalies{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .pi-travel-leaders{margin:28px 0}.pi-travel-leaders-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.pi-travel-leaders-head h3{margin:0;color:#7ba3d9;font-size:12px;letter-spacing:.16em;text-transform:uppercase}.pi-travel-leaders-head span{color:#7187a2;font-size:8px;font-weight:900;text-transform:uppercase}
      .pi-travel-leaders-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pi-travel-leader-card{padding:13px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.025)}.pi-travel-leader-card span{display:block;color:#7388a4;font-size:8px;font-weight:900;text-transform:uppercase}.pi-travel-leader-card strong{display:block;margin-top:5px;color:#eef4ff;font-size:11px}
    `;
    document.head.appendChild(style);
  }

  function takeForward(pool, preferred) {
    let index = pool.findIndex(p => pos(p) === preferred);
    if (index < 0) index = 0;
    return index >= 0 ? pool.splice(index,1)[0] : null;
  }

  function cleanLines(team) {
    const forwards = (team.roster || []).filter(p => !['D','G'].includes(pos(p))).sort((a,b)=>ovr(b)-ovr(a));
    const defense = (team.roster || []).filter(p => pos(p)==='D').sort((a,b)=>ovr(b)-ovr(a));
    const goalies = (team.roster || []).filter(p => pos(p)==='G').sort((a,b)=>ovr(b)-ovr(a));
    const fpool = [...forwards], lines=[];
    for (let i=0;i<4;i+=1) lines.push([takeForward(fpool,'LW'),takeForward(fpool,'C'),takeForward(fpool,'RW')]);
    const pairs=[0,1,2].map(i=>defense.slice(i*2,i*2+2));
    return { lines, pairs, goalies };
  }

  function slot(player, rankMapValue) {
    if (!player) return '<div class="pi-travel-slot"><span class="name">Empty</span></div>';
    const rank = prospectRank(player, rankMapValue);
    return `<button type="button" class="pi-travel-slot" data-pi-player="${esc(pid(player))}"><span class="pos">${esc(pos(player))}</span><span class="name">${esc(pname(player))}</span><span class="ovr">${ovr(player)} OVR</span>${rank ? `<span class="prospect">Prospect #${rank}</span>` : ''}</button>`;
  }

  function specialUnits(team) {
    const {lines,pairs} = cleanLines(team);
    const f = lines.flat().filter(Boolean), d = pairs.flat().filter(Boolean);
    return {
      pp:[[...f.slice(0,3),...d.slice(0,2)],[...f.slice(3,6),...d.slice(2,4)]],
      pk:[[...f.slice(0,2),...d.slice(0,2)],[...f.slice(2,4),...d.slice(2,4)]],
    };
  }

  function renderLineup(team) {
    const {lines,pairs,goalies}=cleanLines(team), ranks=rankMap();
    return `<div class="pi-travel-clean-tabs"><button class="pi-travel-clean-tab on" data-pi-travel-tab="even">Even Strength</button><button class="pi-travel-clean-tab" data-pi-travel-tab="special">Special Teams</button></div>
      <div data-pi-travel-pane="even">
        <div class="pi-travel-group"><h4>Forwards</h4>${lines.map((line,i)=>`<div class="pi-travel-line-label">Line ${i+1}</div><div class="pi-travel-line">${line.map(p=>slot(p,ranks)).join('')}</div>`).join('')}</div>
        <div class="pi-travel-group"><h4>Defense</h4>${pairs.map((pair,i)=>`<div class="pi-travel-line-label">Pair ${i+1}</div><div class="pi-travel-line defense">${pair.map(p=>slot(p,ranks)).join('')}</div>`).join('')}</div>
        <div class="pi-travel-group"><h4>Goalies</h4><div class="pi-travel-goalies">${slot(goalies[0],ranks)}${slot(goalies[1],ranks)}</div></div>
      </div>
      <div data-pi-travel-pane="special" hidden>${(() => { const u=specialUnits(team); return `<div class="pi-travel-group"><h4>Power Play</h4>${u.pp.map((unit,i)=>`<div class="pi-travel-line-label">PP${i+1}</div><div class="pi-travel-line">${unit.slice(0,3).map(p=>slot(p,ranks)).join('')}</div><div class="pi-travel-line defense" style="margin-top:8px">${unit.slice(3).map(p=>slot(p,ranks)).join('')}</div>`).join('')}</div><div class="pi-travel-group"><h4>Penalty Kill</h4>${u.pk.map((unit,i)=>`<div class="pi-travel-line-label">PK${i+1}</div><div class="pi-travel-line defense">${unit.map(p=>slot(p,ranks)).join('')}</div>`).join('')}</div>`; })()}</div>`;
  }

  function textNode(root, exact) {
    return [...root.querySelectorAll('h2,h3,h4,p,span,div')].find(el => el.children.length===0 && String(el.textContent||'').trim().toUpperCase()===exact);
  }

  function closestSection(node, root) {
    let cur=node;
    while(cur && cur!==root){ if(cur.tagName==='SECTION' || /section|lineup|leaders/i.test(cur.className||'')) return cur; cur=cur.parentElement; }
    return node?.parentElement || null;
  }

  function travelLeaders(team) {
    const players=(team.roster||[]).filter(p=>Number(p.travelStats?.gp||0)>0);
    const top=(key,tie='g')=>[...players].sort((a,b)=>Number(b.travelStats?.[key]||0)-Number(a.travelStats?.[key]||0)||Number(b.travelStats?.[tie]||0)-Number(a.travelStats?.[tie]||0))[0];
    const goalie=[...players].filter(p=>pos(p)==='G').sort((a,b)=>Number(b.travelStats?.wins||b.travelStats?.w||0)-Number(a.travelStats?.wins||a.travelStats?.w||0))[0];
    const item=(label,p,value)=>`<div class="pi-travel-leader-card"><span>${label}</span><strong>${p ? `${esc(pname(p))} · ${value}` : '—'}</strong></div>`;
    const goals=top('g'), assists=top('a'), points=top('pts');
    return `<div class="pi-travel-leaders"><div class="pi-travel-leaders-head"><h3>Travel Leaders</h3><span>Summer Tournament</span></div><div class="pi-travel-leaders-grid">${item('Goals',goals,goals?.travelStats?.g||0)}${item('Assists',assists,assists?.travelStats?.a||0)}${item('Points',points,points?.travelStats?.pts||0)}${item('Goalie Wins',goalie,goalie ? Number(goalie.travelStats?.wins||goalie.travelStats?.w||0) : 0)}</div></div>`;
  }

  function patchTravelProfile() {
    const screen=document.getElementById('team-profile-screen'), team=currentAdapter();
    if(!screen||!team||screen.classList.contains('screen--hidden')) return;
    injectStyles();

    // The temporary roster added in the previous pass duplicated the canonical profile; remove it.
    document.getElementById('pi-travel-profile-roster')?.remove();

    const mount=document.getElementById('team-profile-modern-content') || screen;
    let clean=document.getElementById('pi-travel-clean-lineup');
    if(!clean){
      const heading=textNode(mount,'LINEUP');
      const old=closestSection(heading,mount);
      if(old){ old.dataset.piTravelOriginalLineup='1'; old.style.display='none'; clean=document.createElement('section'); clean.id='pi-travel-clean-lineup'; clean.className='pi-travel-clean-lineup'; clean.innerHTML=renderLineup(team); old.insertAdjacentElement('afterend',clean); }
    }

    if(!document.getElementById('pi-travel-clean-leaders')){
      const heading=textNode(mount,'TEAM LEADERS');
      const old=closestSection(heading,mount);
      if(old){ old.dataset.piTravelOriginalLeaders='1'; old.style.display='none'; const replacement=document.createElement('section'); replacement.id='pi-travel-clean-leaders'; replacement.innerHTML=travelLeaders(team); old.insertAdjacentElement('afterend',replacement); }
    }
  }

  function openTravelPlayer(id) {
    const team=currentAdapter(); if(!team) return;
    const player=(team.roster||[]).find(p=>pid(p)===String(id||'')); if(!player || typeof globalThis.openPlayerProfile!=='function') return;
    const source=player.sourcePlayerId ? WorldEngine.getPlayerById?.(player.sourcePlayerId) : null;
    globalThis.openPlayerProfile(source||player,'hub');
  }

  function decorateProspectRanks() {
    const ranks=rankMap(); if(!ranks.size) return;
    const roots=[document.getElementById('team-page-root'),document.getElementById('team-profile-screen')].filter(Boolean);
    for(const root of roots){
      const candidates=[...root.querySelectorAll('span,strong,div,p')].filter(el=>el.children.length===0 && el.textContent?.trim());
      for(const el of candidates){
        if(el.closest('.pi-prospect-rank-badge,.pi-travel-slot')) continue;
        const name=el.textContent.trim().toLowerCase(); const rank=ranks.get(`name:${name}`); if(!rank) continue;
        if(el.parentElement?.querySelector(':scope > .pi-prospect-rank-badge')) continue;
        const badge=document.createElement('small'); badge.className='pi-prospect-rank-badge'; badge.textContent=`Prospect #${rank}`; el.insertAdjacentElement('afterend',badge);
      }
    }
  }

  document.addEventListener('click', event => {
    const tab=event.target?.closest?.('[data-pi-travel-tab]');
    if(tab){ const root=tab.closest('#pi-travel-clean-lineup'); if(!root)return; const which=tab.dataset.piTravelTab; root.querySelectorAll('[data-pi-travel-tab]').forEach(x=>x.classList.toggle('on',x===tab)); root.querySelectorAll('[data-pi-travel-pane]').forEach(x=>x.hidden=x.dataset.piTravelPane!==which); return; }
    const player=event.target?.closest?.('#pi-travel-clean-lineup [data-pi-player]'); if(player){ event.preventDefault(); event.stopPropagation(); openTravelPlayer(player.dataset.piPlayer); }
  });

  // Capture Travel Hub taps before any legacy/bubbling listeners can consume the first tap.
  document.addEventListener('click', event => {
    const hub=document.getElementById(HUB_ID); if(!hub || !hub.contains(event.target)) return;
    const player=event.target?.closest?.('[data-player]');
    if(player) return;
    const teamNode=event.target?.closest?.('[data-team]');
    if(!teamNode?.dataset?.team) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    WorldEngine.openTravelTeamProfile?.(teamNode.dataset.team);
  }, true);

  let queued=false;
  function queue(){ if(queued)return; queued=true; requestAnimationFrame(()=>{queued=false; patchTravelProfile(); decorateProspectRanks();}); }
  const observer=new MutationObserver(queue); observer.observe(document.body,{subtree:true,childList:true});
  document.addEventListener('click',()=>setTimeout(queue,0),{passive:true});
  setTimeout(queue,100); setTimeout(queue,500);

  WorldEngine.patchTravelTeamProfile=patchTravelProfile;
  WorldEngine.decorateProspectRankBadges=decorateProspectRanks;
})();