'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HUB='pi-travel-hockey-hub-canonical', HOME='pi-travel-home-card', LEAGUE='pi-travel-league-card';
  const ACTIVE='pi-travel-season-active', STYLE='pi-travel-canonical-styles', LAST='projectice_last_travel_club_v1';
  let adapterId=null;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const travel=()=>WorldEngine.getTravelHockeyState?.()||WorldEngine.state?.travelHockey||null;
  const active=()=>Boolean(travel()?.tryoutResult&&travel()?.placementLevel&&travel()?.completed!==true);

  function rosterCareer(){
    const base=WorldEngine.state?.player||{}, id=String(base.playerId||base.id||'career-player'); let best=null;
    for(const team of WorldEngine.state?.teams||[]) for(const p of team?.roster||[]){
      const pid=String(p?.playerId||p?.id||'');
      if(p?.isCareerPlayer===true||pid==='career-player'||pid===id){
        if(!best||Number(p?.overall??p?.ovr??0)>Number(best?.overall??best?.ovr??0)) best=p;
      }
    }
    return best;
  }

  function syncCareer(){
    if(!travel()) return WorldEngine.state?.player||null;
    const source=rosterCareer(); if(!source) return WorldEngine.state?.player||null;
    const base=WorldEngine.state?.player||{}, merged={...base};
    ['playerId','id','firstName','lastName','name','playerName','position','handedness','archetype','overall','ovr','attributes','ratings','age','potential','coachTrust','trust','currentForm','form'].forEach(k=>{if(source[k]!==undefined&&source[k]!==null&&source[k]!=='') merged[k]=source[k];});
    if(!merged.name) merged.name=[merged.firstName,merged.lastName].filter(Boolean).join(' ').trim();
    if(!merged.playerName) merged.playerName=merged.name;
    WorldEngine.state.player=merged;
    try{if(typeof Game!=='undefined'&&Game) Game.player={...(Game.player||{}),...merged};}catch(_){}
    return merged;
  }

  const originalSelect=typeof WorldEngine.selectCareerSave==='function'?WorldEngine.selectCareerSave.bind(WorldEngine):null;
  if(originalSelect&&!WorldEngine.__travelCareerSyncWrapped){
    WorldEngine.__travelCareerSyncWrapped=true;
    WorldEngine.selectCareerSave=async(...args)=>{const out=await originalSelect(...args);syncCareer();return out;};
  }

  function rand(n){
    if(!n) return 0;
    try{if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}}catch(_){}
    return Math.floor(Math.random()*n);
  }

  function randomizePlacement(){
    const s=travel(), r=s?.tryoutResult, level=s?.placementLevel||r?.placementLevel;
    if(!s||!r||!level||r.randomClubApplied) return false;
    const opts=s.teamOptionsByLevel?.[level]; if(!Array.isArray(opts)||!opts.length) return false;
    let last=''; try{last=localStorage.getItem(`${LAST}:${level}`)||'';}catch(_){}
    const original=String(r.placementTeamId||s.placementTeamId||'');
    let pool=opts.filter(o=>String(o.teamId)!==last&&String(o.teamId)!==original);
    if(!pool.length) pool=opts.filter(o=>String(o.teamId)!==last); if(!pool.length) pool=opts.slice();
    const pick=pool[rand(pool.length)]||opts[0]; if(!pick) return false;
    r.randomClubApplied=true; r.placementTeamId=pick.teamId; r.placementTeamName=pick.name; r.placementTeamCity=pick.city;
    s.placementTeamId=pick.teamId; s.placementTeamName=pick.name; s.playerTeamId=pick.teamId; s.playerTeamName=pick.name; s.placementTeam={...pick};
    delete s.worldVersion; delete s.teams; delete s.tournament;
    try{localStorage.setItem(`${LAST}:${level}`,pick.teamId);}catch(_){}
    const card=document.querySelector('#pi-travel-tryouts-screen .pi-travel-team');
    if(card){const strong=card.querySelector('strong'), small=card.querySelector('small'); if(strong) strong.textContent=pick.name; if(small) small.textContent=pick.city||'';}
    WorldEngine.save?.(); return true;
  }

  function ensureWorld(save=false){
    syncCareer(); const s=WorldEngine.ensureTravelHockeyWorld?.({save:false})||travel(); if(!s?.teams?.length) return s;
    const c=syncCareer()||{}, cid=String(c.playerId||c.id||'career-player'), cname=String(c.name||c.playerName||[c.firstName,c.lastName].filter(Boolean).join(' ')||'Career Player'), covr=Number(c.overall??c.ovr??60);
    for(const t of s.teams){
      t.travelStats=t.travelStats||{gp:0,w:0,l:0,gf:0,ga:0};
      for(const p of t.roster||[]){
        const id=String(p.playerId||p.sourcePlayerId||p.id||'');
        if(p.isCareerPlayer||id===cid||id==='career-player'){
          p.isCareerPlayer=true; p.name=cname; p.firstName=c.firstName||p.firstName; p.lastName=c.lastName||p.lastName; p.position=c.position||p.position; p.overall=covr; p.ovr=covr; p.attributes=c.attributes||p.attributes; p.ratings=c.ratings||p.ratings; p.sourcePlayerId=cid;
        }
        p.travelStats=p.travelStats||{gp:0,g:0,a:0,pts:0,pim:0,sog:0};
      }
    }
    s.tournament=s.tournament||{version:1,status:'not-started',level:s.placementLevel,teamIds:s.teams.map(t=>t.teamId),rounds:{quarterfinals:[],semifinals:[],championship:[]},championTeamId:null};
    s.tournament.rounds=s.tournament.rounds||{quarterfinals:[],semifinals:[],championship:[]};
    if(!Array.isArray(s.tournament.rounds.quarterfinals)||s.tournament.rounds.quarterfinals.length!==4){
      const teams=[...s.teams].sort((a,b)=>Number(a.seed||99)-Number(b.seed||99)), pairs=[[0,7],[3,4],[1,6],[2,5]];
      s.tournament.rounds.quarterfinals=pairs.map((p,i)=>({seriesId:`travel-qf-${i+1}`,teamAId:teams[p[0]]?.teamId||null,teamBId:teams[p[1]]?.teamId||null,teamAWins:0,teamBWins:0,status:'scheduled',bestOf:3}));
    }
    if(!Array.isArray(s.tournament.rounds.semifinals)) s.tournament.rounds.semifinals=[];
    if(!Array.isArray(s.tournament.rounds.championship)) s.tournament.rounds.championship=[];
    if(save) WorldEngine.save?.(); return s;
  }

  const byTeam=(s,id)=>(s?.teams||[]).find(t=>String(t.teamId)===String(id||''))||null;
  const record=t=>`${Number(t?.travelStats?.w||0)}-${Number(t?.travelStats?.l||0)}`;

  function styles(){
    if(document.getElementById(STYLE)) return; const st=document.createElement('style'); st.id=STYLE;
    st.textContent=`body.${ACTIVE} #pi-league-postseason-card,body.${ACTIVE} #pi-playoff-leaders-card{display:none!important}.pi-ts-card{margin:18px 0;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.22);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.88));color:#f6f9ff;cursor:pointer}.pi-ts-card small{display:block;color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.pi-ts-card strong{display:block;margin-top:6px;font-size:18px}.pi-ts-card span{display:block;margin-top:5px;color:#8298b2;font-size:10px}.pi-ts-card b{float:right;color:#8fc1ff;font-size:20px}#${HUB}{position:fixed;inset:0;z-index:100090;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 18px calc(env(safe-area-inset-bottom,0px) + 30px);background:radial-gradient(circle at 50% 0%,rgba(48,107,201,.34),transparent 32%),linear-gradient(180deg,#061628,#030d18);color:#f6f9ff}.pi-ts-shell{max-width:650px;margin:0 auto}.pi-ts-back{width:42px;height:42px;border-radius:14px;border:1px solid rgba(118,166,229,.23);background:rgba(17,40,70,.72);color:#fff;font-size:25px}.pi-ts-kicker{margin-top:17px;color:#7aaff6;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-ts-title{margin:7px 0 5px;font-size:31px}.pi-ts-sub{margin:0;color:#8499b4;font-size:11px;line-height:1.5}.pi-ts-your{margin-top:17px;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.22);background:rgba(40,98,180,.18);cursor:pointer}.pi-ts-your h2{margin:7px 0 3px;font-size:22px}.pi-ts-your small{color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-ts-your p{margin:0;color:#8298b2;font-size:10px}.pi-ts-sec{margin-top:22px}.pi-ts-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:9px}.pi-ts-head h3{margin:0;font-size:18px}.pi-ts-head span{color:#6f86a4;font-size:9px;text-transform:uppercase;font-weight:900}.pi-ts-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pi-ts-team,.pi-ts-series{padding:13px;border-radius:15px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-team.you{border-color:rgba(95,166,255,.38);background:rgba(45,105,190,.14)}.pi-ts-team strong{display:block;font-size:12px}.pi-ts-team span,.pi-ts-team em{display:block;margin-top:4px;color:#7186a1;font-size:9px;font-style:normal}.pi-ts-series{cursor:default;margin-bottom:8px}.pi-ts-row{display:flex;justify-content:space-between;margin-top:7px;font-size:11px;font-weight:800}.pi-ts-row button{all:unset;cursor:pointer}.pi-ts-empty{padding:14px;border-radius:14px;border:1px dashed rgba(112,166,236,.22);color:#8297b0;font-size:10px}.pi-ts-leader{display:grid;grid-template-columns:28px 1fr 50px;gap:9px;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-leader .v{text-align:right;font-weight:900}`;
    document.head.appendChild(st);
  }

  function bracket(s){
    const groups=[['Quarterfinals',s.tournament?.rounds?.quarterfinals||[]],['Semifinals',s.tournament?.rounds?.semifinals||[]],['Championship',s.tournament?.rounds?.championship||[]]];
    return groups.map(([label,arr])=>`<div class="pi-ts-sec"><div class="pi-ts-head"><h3>${label}</h3><span>Best of 3</span></div>${arr.length?arr.map((x,i)=>{const a=byTeam(s,x.teamAId),b=byTeam(s,x.teamBId);return `<div class="pi-ts-series"><small>Series ${i+1}</small><div class="pi-ts-row"><button data-team="${esc(a?.teamId||'')}">${esc(a?.name||'TBD')}</button><span>${Number(x.teamAWins||0)}</span></div><div class="pi-ts-row"><button data-team="${esc(b?.teamId||'')}">${esc(b?.name||'TBD')}</button><span>${Number(x.teamBWins||0)}</span></div></div>`;}).join(''):'<div class="pi-ts-empty">This round will populate when the previous round is decided.</div>'}</div>`).join('');
  }

  function leaders(s){
    const rows=(s.teams||[]).flatMap(t=>(t.roster||[]).map(p=>({t,p}))).filter(x=>Number(x.p.travelStats?.gp||0)>0).sort((a,b)=>Number(b.p.travelStats?.pts||0)-Number(a.p.travelStats?.pts||0)).slice(0,5);
    if(!rows.length) return '<div class="pi-ts-empty">Travel leaders will populate as tournament games are played.</div>';
    return rows.map((x,i)=>`<div class="pi-ts-leader" data-player="${esc(x.p.playerId||x.p.sourcePlayerId||'')}" data-team="${esc(x.t.teamId)}"><span>${i+1}</span><span>${esc(x.p.name)}<small>${esc(x.t.shortName||x.t.name)}</small></span><span class="v">${Number(x.p.travelStats?.pts||0)} PTS</span></div>`).join('');
  }

  function cleanupAdapter(){if(adapterId&&Array.isArray(WorldEngine.state?.teams)) WorldEngine.state.teams=WorldEngine.state.teams.filter(t=>!(t.travelProfileAdapter&&String(t.teamId)===String(adapterId))); adapterId=null;}
  function adapter(team){const s=travel(),st=team.travelStats||{},level=s?.placementLevel||team.level||'A',club=team.shortName||String(team.name||'').replace(/\s+(B|A|AA|AAA)$/i,''); return {...team,schoolName:club,teamName:`${level} Travel Hockey`,abbreviation:team.abbreviation||club.split(/\s+/).map(x=>x[0]).join('').slice(0,4).toUpperCase(),primaryColor:team.primaryColor||'#2f6fd6',secondaryColor:team.secondaryColor||'#8fc1ff',wins:Number(st.w||0),losses:Number(st.l||0),overtimeLosses:0,goalsFor:Number(st.gf||0),goalsAgainst:Number(st.ga||0),prestige:2,identity:`${level} summer travel hockey`,coachName:'Travel Hockey Staff',coachStyle:'Tournament development',arenaName:`${team.city||'Regional'} Ice Center`,arenaCapacity:'Travel venue',travelProfileAdapter:true,roster:(team.roster||[]).map(p=>({...p,teamId:team.teamId,stats:p.travelStats||p.stats}))};}

  function openTeam(id){
    const s=ensureWorld(false),team=byTeam(s,id); if(!team||typeof globalThis.openTeamProfile!=='function') return false;
    cleanupAdapter(); const a=adapter(team); WorldEngine.state.teams.push(a); adapterId=a.teamId; document.getElementById(HUB)?.remove(); globalThis.openTeamProfile(a.teamId,'hub');
    requestAnimationFrame(()=>{const e=document.querySelector('#team-profile-screen .tp-header .eyebrow'); if(e)e.textContent='Travel Team Profile'; document.getElementById('pi-team-profile-leaders-scope')?.remove();}); return true;
  }

  function openPlayer(teamId,id){const s=ensureWorld(false),t=byTeam(s,teamId),p=(t?.roster||[]).find(x=>String(x.playerId||x.sourcePlayerId||'')===String(id||'')); if(!p||typeof globalThis.openPlayerProfile!=='function')return false; document.getElementById(HUB)?.remove(); globalThis.openPlayerProfile((p.sourcePlayerId&&WorldEngine.getPlayerById?.(p.sourcePlayerId))||p,'hub'); return true;}

  function openHub(){
    cleanupAdapter(); const s=ensureWorld(true); if(!s?.teams?.length)return false; styles(); document.getElementById('pi-travel-hockey-hub')?.remove(); document.getElementById(HUB)?.remove(); const mine=byTeam(s,s.playerTeamId)||s.teams[0];
    const root=document.createElement('section'); root.id=HUB; root.innerHTML=`<div class="pi-ts-shell"><button class="pi-ts-back">‹</button><div class="pi-ts-kicker">Summer Travel Hockey · ${esc(s.placementLevel)}</div><h1 class="pi-ts-title">Travel Hockey Hub</h1><p class="pi-ts-sub">Your summer tournament world. Team profiles, bracket progress, and Travel statistics all live here.</p><div class="pi-ts-your" data-team="${esc(mine.teamId)}"><small>Your Team</small><h2>${esc(mine.name)}</h2><p>${esc(mine.city)} · ${record(mine)} tournament record</p></div><div class="pi-ts-sec"><div class="pi-ts-head"><h3>Travel Field</h3><span>8 Teams</span></div><div class="pi-ts-grid">${s.teams.map(t=>`<div class="pi-ts-team${t.teamId===s.playerTeamId?' you':''}" data-team="${esc(t.teamId)}"><strong>${esc(t.name)}</strong><span>${esc(t.city)}${t.teamId===s.playerTeamId?' · YOU':''}</span><em>${record(t)} · ${Number(t.travelStats?.gp||0)?`${Number(t.travelStats.gf||0)} GF · ${Number(t.travelStats.ga||0)} GA`:'Tournament not started'}</em></div>`).join('')}</div></div>${bracket(s)}<div class="pi-ts-sec"><div class="pi-ts-head"><h3>Travel Stat Leaders</h3><span>PTS</span></div>${leaders(s)}</div></div>`;
    root.querySelector('.pi-ts-back')?.addEventListener('click',()=>root.remove()); root.querySelectorAll('[data-team]').forEach(n=>n.addEventListener('click',e=>{if(e.target.closest('[data-player]'))return; if(n.dataset.team)openTeam(n.dataset.team);})); root.querySelectorAll('[data-player]').forEach(n=>n.addEventListener('click',e=>{e.stopPropagation();openPlayer(n.dataset.team,n.dataset.player);})); document.body.appendChild(root); return true;
  }

  function entry(id,s){const c=document.createElement('section');c.id=id;c.className='pi-ts-card';c.tabIndex=0;c.innerHTML=`<b>›</b><small>Summer Travel Hockey · ${esc(s.placementLevel)}</small><strong>${esc(s.playerTeamName||'Travel Hockey Hub')}</strong><span>Open teams, tournament bracket, and Travel stat leaders.</span>`;c.addEventListener('click',openHub);return c;}
  function objective(s){const stage=document.getElementById('home-objective-stage'),title=document.getElementById('hub-current-objective-title'),text=document.getElementById('hub-current-objective');if(stage)stage.textContent=`${s.placementLevel} Travel Hockey`;if(title)title.textContent='Summer Tournament';if(text)text.textContent=`Represent ${s.playerTeamName||'your travel team'} and make your summer tournament count.`;}

  function reconcile(){
    styles(); document.body?.classList.toggle(ACTIVE,active()); if(!active()){document.getElementById(HOME)?.remove();document.getElementById(LEAGUE)?.remove();return false;} const s=ensureWorld(false); if(!s)return false;
    document.getElementById(HOME)?.remove(); const home=document.getElementById('hub-tab-home')||document.getElementById('hub-panel-home'); const obj=home?.querySelector('.home-objective'); if(home){const c=entry(HOME,s);obj?obj.insertAdjacentElement('afterend',c):home.prepend(c);}
    document.getElementById(LEAGUE)?.remove(); const league=document.getElementById('hub-tab-league')||document.getElementById('hub-panel-league')||document.getElementById('league-panel'); if(league)league.prepend(entry(LEAGUE,s)); objective(s); return true;
  }

  let queued=false; function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;reconcile();setTimeout(reconcile,80);});}
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#pi-travel-tryouts-screen .pi-travel-next');if(b&&/see placement/i.test(b.textContent||'')){setTimeout(()=>{randomizePlacement();queue();},0);return;}if(adapterId&&e.target?.closest?.('#btn-back-team-profile')){setTimeout(()=>{cleanupAdapter();openHub();},0);return;}if(e.target?.closest?.('.hub-nav__item,[data-tab],#pi-travel-tryouts-continue,#btn-dev-hub')){queue();setTimeout(queue,140);}});
  syncCareer(); styles(); setTimeout(queue,100); setTimeout(queue,500); setTimeout(queue,1200);
  WorldEngine.syncTravelCareerIdentity=syncCareer; WorldEngine.openTravelHockeyHub=openHub; WorldEngine.openTravelTeamProfile=openTeam; WorldEngine.renderTravelHockeyHubEntries=reconcile; WorldEngine.reconcileTravelSeasonPresentation=reconcile;
})();
