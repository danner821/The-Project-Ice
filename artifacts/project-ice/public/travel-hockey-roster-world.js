'use strict';

/* global WorldEngine, REAL_PROSPECTS */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const VERSION=6;
  const FIRST=['Aiden','Blake','Brady','Cam','Carter','Cole','Connor','Dylan','Ethan','Evan','Gavin','Hudson','Jack','Jake','Liam','Logan','Lucas','Mason','Max','Nolan','Noah','Owen','Parker','Ryan','Sam','Tyler','Wyatt'];
  const LAST=['Anderson','Bailey','Bell','Bennett','Brooks','Carter','Cook','Cooper','Foster','Gray','Hayes','Howard','Hughes','Johnson','Kelly','Lewis','Miller','Morgan','Murphy','Nelson','Perry','Peterson','Price','Reed','Richardson','Ross','Shaw','Sullivan','Thompson','Turner','Ward','Wood','Young'];
  const CLUB_META={
    'arizona-jr-coyotes':{coachName:'Matt Reynolds',coachStyle:'Speed and transition',arenaName:'AZ Ice Peoria',arenaCapacity:650,prestige:2,strength:-1,identity:'Fast, aggressive transition hockey',primaryColor:'#8c2633',secondaryColor:'#e2d6b5'},
    'colorado-thunderbirds':{coachName:'Ryan Caldwell',coachStyle:'Puck possession',arenaName:'Family Sports Center',arenaCapacity:900,prestige:3,strength:1,identity:'Skilled possession and pace',primaryColor:'#173f7a',secondaryColor:'#d8e8ff'},
    'dallas-stars-elite':{coachName:'Chris Wallace',coachStyle:'Structured two-way',arenaName:'Comerica Center',arenaCapacity:3500,prestige:4,strength:2,identity:'Structured, mature two-way hockey',primaryColor:'#006847',secondaryColor:'#b3b7b9'},
    'chicago-mission':{coachName:'Mike O’Donnell',coachStyle:'High-pressure attack',arenaName:'Seven Bridges Ice Arena',arenaCapacity:1200,prestige:5,strength:3,identity:'Relentless pressure and elite skill',primaryColor:'#c8102e',secondaryColor:'#ffffff'},
    'little-caesars':{coachName:'Dan Stevens',coachStyle:'Physical possession',arenaName:'Little Caesars Arena Practice Rink',arenaCapacity:1000,prestige:5,strength:2,identity:'Heavy, skilled possession hockey',primaryColor:'#ce1126',secondaryColor:'#ffffff'},
    'pittsburgh-penguins-elite':{coachName:'Kevin Murphy',coachStyle:'Attack through the middle',arenaName:'UPMC Lemieux Sports Complex',arenaCapacity:1500,prestige:4,strength:2,identity:'Creative offense through the middle',primaryColor:'#fcb514',secondaryColor:'#000000'},
    'boston-jr-eagles':{coachName:'Sean McCarthy',coachStyle:'Smart puck support',arenaName:'New England Sports Center',arenaCapacity:1800,prestige:5,strength:3,identity:'High-IQ support and puck movement',primaryColor:'#1b365d',secondaryColor:'#c4ced4'},
    'la-jr-kings':{coachName:'Jason Miller',coachStyle:'Rush offense',arenaName:'Toyota Sports Performance Center',arenaCapacity:900,prestige:3,strength:0,identity:'Quick-strike rush offense',primaryColor:'#111111',secondaryColor:'#a2aaad'},
  };
  const travel=()=>WorldEngine.getTravelHockeyState?.()||WorldEngine.state?.travelHockey||null;
  const pid=p=>String(p?.playerId||p?.id||'');
  const pname=p=>String(p?.name||p?.playerName||[p?.firstName,p?.lastName].filter(Boolean).join(' ').trim()||'Player');
  const ovr=p=>Number(p?.overall??p?.ovr??p?.rating??60);
  const pos=p=>{
    const r=String(p?.position||p?.pos||'').trim().toUpperCase();
    if(r==='G'||r==='GK'||r.includes('GOAL'))return'G';
    if(r==='D'||r==='LD'||r==='RD'||r==='LHD'||r==='RHD'||r.includes('DEF'))return'D';
    if(r==='LW'||r==='LF'||r.includes('LEFT WING'))return'LW';
    if(r==='RW'||r==='RF'||r.includes('RIGHT WING'))return'RW';
    return'C';
  };
  function hash(v){let h=2166136261;for(const ch of String(v||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  const seeded=(list,seed)=>[...list].sort((a,b)=>hash(`${seed}:${pid(a)||pname(a)}`)-hash(`${seed}:${pid(b)||pname(b)}`));
  const baseFor=l=>({B:58,A:64,AA:70,AAA:76})[String(l||'A').toUpperCase()]||64;
  const blankStats=()=>({gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,savePercentage:0});
  function normalize(p,extra={}){return{...p,playerId:pid(p)||`prospect:${hash(pname(p))}`,sourcePlayerId:p?.sourcePlayerId||pid(p)||null,name:pname(p),position:pos(p),overall:ovr(p),ovr:ovr(p),travelStats:p?.travelStats||blankStats(),...extra};}
  function generated(team,slot,level,delta){const seed=hash(`${team.teamId}:${slot}:${level}:travel-v${VERSION}`),first=FIRST[seed%FIRST.length],last=LAST[Math.floor(seed/31)%LAST.length],positions=['LW','C','RW','LW','C','RW','LW','C','RW','LW','C','RW','D','D','D','D','D','D','G','G'],overall=Math.max(45,Math.min(88,baseFor(level)+delta+((seed%9)-4)));return{playerId:`travel-gen:${team.teamId}:${slot}:v${VERSION}`,name:`${first} ${last}`,firstName:first,lastName:last,position:positions[slot]||'C',overall,ovr:overall,generatedTravelPlayer:true,travelStats:blankStats()};}
  const worldPool=()=>{const a=WorldEngine.getAllWorldPlayers?.()||(WorldEngine.state?.teams||[]).flatMap(t=>t.roster||[]);return Array.isArray(a)?a:[];};
  function rankedProspects(level){
    const target=baseFor(level),out=[],seen=new Set();let rows=[];try{rows=WorldEngine.getProspectRankings?.()||WorldEngine.state?.prospectRankings||WorldEngine.state?.prospects||[];}catch(_){}
    if(Array.isArray(rows)){
      [...rows].sort((a,b)=>Number(a?.rank??a?.prospectRank??a?.ranking??9999)-Number(b?.rank??b?.prospectRank??b?.ranking??9999)).slice(0,100).forEach((row,i)=>{
        const rank=Number(row?.rank??row?.prospectRank??row?.ranking??i+1),rid=String(row?.playerId||row?.id||row?.prospectId||'');
        const source=(rid&&WorldEngine.getPlayerById?.(rid))||row?.player||row;if(!source)return;const p=normalize(source,{sourcePlayerId:rid||pid(source)||null,isRealProspect:true,prospectRank:rank});
        const key=p.sourcePlayerId||pid(p)||pname(p).toLowerCase();if(!key||seen.has(key)||Math.abs(ovr(p)-target)>12)return;seen.add(key);out.push(p);
      });
    }
    worldPool().filter(p=>p&&(p.isRealProspect===true||p.realProspect===true||p.prospectId)).forEach(p=>{const n=normalize(p,{isRealProspect:true});const key=n.sourcePlayerId||pid(n)||pname(n).toLowerCase();if(!seen.has(key)&&Math.abs(ovr(n)-target)<=10){seen.add(key);out.push(n);}});
    try{if(typeof REAL_PROSPECTS!=='undefined'&&Array.isArray(REAL_PROSPECTS))REAL_PROSPECTS.forEach(p=>{const n=normalize(p,{isRealProspect:true});const key=n.sourcePlayerId||pid(n)||pname(n).toLowerCase();if(!seen.has(key)&&Math.abs(ovr(n)-target)<=10){seen.add(key);out.push(n);}});}catch(_){}
    return out;
  }
  function otherPool(level){const target=baseFor(level),career=pid(WorldEngine.state?.player||{});return worldPool().filter(p=>p&&pid(p)&&pid(p)!==career&&!p.isCareerPlayer&&Math.abs(ovr(p)-target)<=8).map(p=>normalize(p));}
  const clubId=t=>t.clubId||t.organizationId||String(t.teamId||'').replace(/^travel-/,'').replace(/-(b|a|aa|aaa)$/i,'');
  function meta(team){const m=CLUB_META[clubId(team)]||{};Object.assign(team,{coachName:m.coachName||'Travel Hockey Staff',coachStyle:m.coachStyle||'Balanced development',coach:{name:m.coachName||'Travel Hockey Staff',style:m.coachStyle||'Balanced development'},arenaName:m.arenaName||`${team.city||'Regional'} Ice Center`,arenaCapacity:m.arenaCapacity||800,arena:{name:m.arenaName||`${team.city||'Regional'} Ice Center`,capacity:m.arenaCapacity||800},prestige:m.prestige||3,identity:m.identity||'Competitive summer travel hockey',primaryColor:m.primaryColor||'#2f6fd6',secondaryColor:m.secondaryColor||'#8fc1ff',teamStrengthDelta:m.strength||0});return team;}
  function take(pool,want){let i=pool.findIndex(p=>pos(p)===want);if(i<0)i=0;return i>=0?pool.splice(i,1)[0]:null;}
  function lineup(team){for(const p of team.roster||[]){delete p.rosterSlot;delete p.slot;}const f=(team.roster||[]).filter(p=>!['D','G'].includes(pos(p))).sort((a,b)=>ovr(b)-ovr(a)),d=(team.roster||[]).filter(p=>pos(p)==='D').sort((a,b)=>ovr(b)-ovr(a)),g=(team.roster||[]).filter(p=>pos(p)==='G').sort((a,b)=>ovr(b)-ovr(a)),fp=[...f],fl=[],dp=[];for(let i=1;i<=4;i++){const lw=take(fp,'LW'),c=take(fp,'C'),rw=take(fp,'RW');if(lw)lw.rosterSlot=`fwd-${i}-lw`;if(c)c.rosterSlot=`fwd-${i}-c`;if(rw)rw.rosterSlot=`fwd-${i}-rw`;fl.push([lw,c,rw].filter(Boolean));}for(let i=1;i<=3;i++){const ld=d[(i-1)*2],rd=d[(i-1)*2+1];if(ld)ld.rosterSlot=`def-${i}-ld`;if(rd)rd.rosterSlot=`def-${i}-rd`;dp.push([ld,rd].filter(Boolean));}if(g[0])g[0].rosterSlot='g-starter';if(g[1])g[1].rosterSlot='g-backup';const id=p=>p?.playerId||p?.id||null,topF=fl.flat(),topD=dp.flat(),pp=u=>({slots:{leftFlank:id(u[0]),bumper:id(u[1]),rightFlank:id(u[2]),netFront:id(u[3]),quarterback:id(u[4])}}),pk=u=>({slots:{leftForward:id(u[0]),rightForward:id(u[1]),leftDefense:id(u[2]),rightDefense:id(u[3])}});team.forwardLines=fl;team.defensePairs=dp;team.goalies=g;team.lines={forwards:fl,defense:dp,goalies:g};team.lineup={forwards:fl,defense:dp,defensePairs:dp,goalies:g,starter:g[0]||null,backup:g[1]||null};team.specialTeams={powerPlay:[pp([...topF.slice(0,3),...topD.slice(0,2)]),pp([...topF.slice(3,6),...topD.slice(2,4)])],penaltyKill:[pk([...topF.slice(0,2),...topD.slice(0,2)]),pk([...topF.slice(2,4),...topD.slice(2,4)])]};return team;}
  function rebuild(state){
    if(!state?.teams?.length)return state;const level=state.placementLevel||'A';if(state.travelRosterWorldVersion===VERSION){state.teams.forEach(t=>{meta(t);lineup(t);});return state;}
    const oldStats=new Map();for(const t of state.teams)for(const p of t.roster||[]){const key=String(p.sourcePlayerId||p.playerId||p.id||'');if(key)oldStats.set(key,p.travelStats);}
    const used=new Set(),prospects=rankedProspects(level),others=otherPool(level),career=normalize(WorldEngine.state?.player||{});career.isCareerPlayer=true;
    for(const team of state.teams){meta(team);const m=CLUB_META[clubId(team)]||{},roster=[];const counts=()=>({F:roster.filter(p=>!['D','G'].includes(pos(p))).length,D:roster.filter(p=>pos(p)==='D').length,G:roster.filter(p=>pos(p)==='G').length});
      const add=(pool,maxProspects=Infinity)=>{for(const raw of pool){if(roster.length>=20)break;const key=String(raw.sourcePlayerId||pid(raw)||pname(raw).toLowerCase());if(!key||used.has(key))continue;const bucket=pos(raw)==='G'?'G':pos(raw)==='D'?'D':'F',limit={F:12,D:6,G:2}[bucket];if(counts()[bucket]>=limit)continue;if(raw.isRealProspect&&roster.filter(p=>p.isRealProspect).length>=maxProspects)continue;const p={...raw};p.position=pos(p);p.travelStats=oldStats.get(key)||p.travelStats||blankStats();used.add(key);roster.push(p);}};
      add(seeded(prospects,team.teamId),4);add(seeded(others,`world:${team.teamId}`));while(counts().F<12)roster.push(generated(team,counts().F,level,m.strength||0));while(counts().D<6){const p=generated(team,12+counts().D,level,m.strength||0);p.position='D';roster.push(p);}while(counts().G<2){const p=generated(team,18+counts().G,level,m.strength||0);p.position='G';roster.push(p);}team.roster=roster.slice(0,20);lineup(team);
    }
    const mine=state.teams.find(t=>String(t.teamId)===String(state.playerTeamId))||state.teams[0];if(mine){mine.roster=mine.roster.filter(p=>!p.isCareerPlayer&&pid(p)!==pid(career));const careerBucket=pos(career);const replace=mine.roster.findIndex(p=>pos(p)===careerBucket);if(replace>=0)mine.roster.splice(replace,1);else if(mine.roster.length)mine.roster.pop();career.position=careerBucket;career.travelStats=oldStats.get(pid(career))||career.travelStats||blankStats();mine.roster.unshift(career);mine.roster=mine.roster.slice(0,20);lineup(mine);}
    state.travelRosterWorldVersion=VERSION;WorldEngine.save?.();return state;
  }
  const original=typeof WorldEngine.ensureTravelHockeyWorld==='function'?WorldEngine.ensureTravelHockeyWorld.bind(WorldEngine):null;if(original&&!WorldEngine.__travelRosterWorldWrapped){WorldEngine.__travelRosterWorldWrapped=true;WorldEngine.ensureTravelHockeyWorld=function(options={}){const out=original(options)||travel();return rebuild(out);};}
  setTimeout(()=>{const s=travel();if(s?.teams?.length)rebuild(s);},400);WorldEngine.rebuildTravelHockeyRosters=()=>rebuild(travel());
})();