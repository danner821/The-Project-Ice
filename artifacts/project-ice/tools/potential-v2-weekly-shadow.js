/* Project Ice: offline, deterministic Potential 2.0 weekly SHADOW.
 * Never imported by live game. Pure functions; NO save writes, RNG,
 * browser APIs, player mutation or historical rating migration.
 * Caller provides same-level age-near and potential-near peer stats;
 * insufficient cohorts are withheld rather than supplemented with guesses.
 */
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const round=(n,d=3)=>Number(n.toFixed(d));
const position=p=>String(p||'F').toUpperCase()==='G'?'G':
  ['D','LD','RD'].includes(String(p||'').toUpperCase())?'D':'F';
const level=p=>String(p||'').toUpperCase().replace(/\s+/g,'').replace(/-/g,'');
const tier=(p,pos)=>p>=96?'Franchise':p>=90?'Elite':
  position(pos)==='G'?(p>=84?'Starter':p>=79?'Fringe Starter':p>=74?'Backup':'AHL Starter'):
  position(pos)==='D'?(p>=84?'Top 4 D':p>=79?'Top 6 D':p>=74?'7th D':'AHL Top 2 D'):
  p>=84?'Top 6 F':p>=79?'Top 9 F':p>=74?'Bottom 6 F':'AHL Top 6 F';
function boundary(p,pos,sign){
  for(let i=p+sign;i>=25&&i<=99;i+=sign)if(tier(p,pos)!==tier(i,pos))return i;
  return p;
}
function metric(player,minimum=true){
  const s=player?.seasonStats||{},gp=Number(s.gamesPlayed??s.gp??0),
    type=position(player?.position);
  if(!Number.isFinite(gp)||gp<=0)return null;
  if(type==='G'){
    const shots=Number(s.shotsAgainst??0),saves=Number(s.saves??0);
    if(!Number.isFinite(shots)||!Number.isFinite(saves)||shots<=0||
      saves>shots||saves<0||minimum&&(gp<5||shots<180))return null;
    return{value:saves/shots,position:type,gp,volume:shots,units:'savePercentage'};
  }
  const minutes=Number(s.minutesPlayed??s.toiMinutes??0),points=Number(s.points??
    ((Number(s.goals)||0)+(Number(s.assists)||0)));
  if(!Number.isFinite(minutes)||!Number.isFinite(points)||minutes<=0||points<0||
     minimum&&(gp<5||minutes<100))return null;
  return{value:points*60/minutes,position:type,gp,volume:minutes,units:'pointsPer60'};
}
function cohort(player,peers){
  const currentLevel=level(player?.leagueLevel||player?.teamLevel||player?.level);
  const age=Number(player?.age),potential=Number(player?.potential);
  const group=position(player?.position),found=[];
  if(!currentLevel||!Number.isFinite(age)||!Number.isFinite(potential))return found;
  for(const p of peers||[]){
    if(!p||String(p.id||p.playerId)===String(player?.id||player?.playerId))continue;
    if(level(p.leagueLevel||p.teamLevel||p.level)!==currentLevel||
      position(p.position)!==group||Math.abs(Number(p.age)-age)>2||
      Math.abs(Number(p.potential)-potential)>12)continue;
    const m=metric(p,false);
    if(!m||m.gp<8||(group==='G'?m.volume<300:m.volume<240))continue;
    found.push({metric:m.value,age:Number(p.age),potential:Number(p.potential),
      weight:(Number(p.age)===age?1:.75)/(1+Math.abs(Number(p.potential)-potential)/6)});
  }
  return found;
}
function baseline(player,peers){
  const pool=cohort(player,peers),required=position(player?.position)==='G'?5:8;
  const sum=pool.reduce((a,x)=>a+x.weight,0),
    sq=pool.reduce((a,x)=>a+x.weight*x.weight,0),
    effective=sq>0?sum*sum/sq:0;
  if(pool.length<required||effective<required-1)return{
    status:'withheld',reason:'INSUFFICIENT_SAME_LEVEL_TIER_PEERS',
    peerCount:pool.length,effectivePeers:round(effective)};
  return{status:'supported',expected:pool.reduce((a,x)=>a+x.metric*x.weight,0)/sum,
    peerCount:pool.length,effectivePeers:round(effective),
    units:position(player.position)==='G'?'savePercentage':'pointsPer60'};
}
function accuracy(n){return n>=75?'High':n>=45?'Medium':'Low';}
function hashRoll(input){
  let h=2166136261;
  for(const char of String(input)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}
  return(h>>>0)/4294967296;
}
function evaluate({player,peers=[],previous={},seasonId,weekKey,weekNumber=0,
  observedGames=0}={}){
  if(!player||typeof player!=='object'||!seasonId||!weekKey)
    return{status:'withheld',reason:'MISSING_WEEK_OR_PLAYER',readOnly:true};
  const root=Number(player.potential),nested=Number(player.development?.potential);
  if(!Number.isFinite(root)||!Number.isFinite(nested)||root<25||root>99||
    nested<25||nested>99||root!==nested)
    return{status:'withheld',reason:'UNRECONCILED_OR_MISSING_POTENTIAL',readOnly:true,
      rootPotential:Number.isFinite(root)?root:null,
      nestedPotential:Number.isFinite(nested)?nested:null};
  if(previous.seasonId===seasonId&&previous.lastEvaluatedWeek===weekKey)
    return{status:'already-evaluated',readOnly:true,proposal:{...previous}};
  const stats=metric(player),base=baseline(player,peers),levelName=level(player.leagueLevel||
    player.teamLevel||player.level),dateAge=Number(player.age);
  const prior=previous.seasonId===seasonId?previous:{};
  const pastGames=Math.max(0,Number(prior.gamesEvaluated)||0);
  const pastObserved=Math.max(0,Number(prior.observedGames)||0);
  const games=stats?.gp||0,observed=Math.max(0,Number(observedGames)||0);
  const carry={...prior,seasonId,lastEvaluatedWeek:weekKey,gamesEvaluated:Math.max(pastGames,games),
    observedGames:Math.max(pastObserved,observed),potential:root,
    confidence:clamp(Number(prior.confidence??player.development?.potentialConfidence??50),25,99)};
  if(!stats||base.status!=='supported'||!levelName||games<=pastGames){
    return{status:'withheld',readOnly:true,
      reason:!stats?'INSUFFICIENT_PLAYER_SAMPLE':base.status!=='supported'?base.reason:
        !levelName?'MISSING_LEVEL':'NO_NEW_GAMES',
      peerCount:base.peerCount||0,proposal:carry};
  }
  const ratio=stats.value/base.expected;
  if(!Number.isFinite(ratio)||base.expected<=0)
    return{status:'withheld',readOnly:true,reason:'INVALID_LEVEL_EXPECTATION',proposal:carry};
  const goalie=position(player.position)==='G';
  const delta=goalie?(stats.value-base.expected)/.07:(ratio-1)/.85;
  const performance=clamp(delta,-1,1);
  const growth=player.development?.seasonAttributeGrowth||{};
  const recordedGrowth=Object.values(growth).reduce((sum,v)=>sum+Math.max(0,Number(v)||0),0);
  const growthSignal=clamp(recordedGrowth/8,0,1);
  // Age affects how much evidence *may move potential*, never how well the
  // player played. The comparison cohort itself is age-specific.
  const evidence=clamp(performance*.88+growthSignal*.12,-1,1);
  const signal=clamp((Number(prior.signal)||0)*.82+evidence*.62,-4,4);
  const streak= Math.sign(evidence)===Math.sign(Number(prior.signal)||0)&&
    Math.abs(evidence)>.25?Math.max(1,Number(prior.streak)||0)+1:
    Math.abs(evidence)>.25?1:0;
  const mismatched=Math.abs(signal)>=.85&&Math.abs(evidence)>=.25&&streak>=2;
  const ageFactor=dateAge<=18?1:dateAge<=22?.9:dateAge<=27?.58:dateAge<=32?.25:.12;
  const confidenceOld=carry.confidence;
  const confidence=mismatched?clamp(confidenceOld-
      Math.min(3.4,(.8+Math.abs(signal)*.57)*ageFactor),25,99):
    observed>pastObserved&&Math.abs(evidence)<.26?
      clamp(confidenceOld+Math.min(1.1,(observed-pastObserved)*.2),25,99):confidenceOld;
  const intensity=Math.abs(signal);
  const trend=streak>=4&&intensity>=1.8?
    (signal>0?'rapidly-rising':'rapidly-falling'):
    streak>=2&&intensity>=.75?(signal>0?'rising':'falling'):'stable';
  const changeAgeThreshold=dateAge<=18?7:dateAge<=22?9:dateAge<=27?12:dateAge<=32?20:30;
  const lastChange=Number(prior.lastChangedWeek)||-999;
  const weeksSinceChange=Number(weekNumber)-lastChange;
  const ageAllowsUp=dateAge<=27||root<96&&dateAge<=32;
  const franchiseNext=tier(boundary(root,player.position,+1),player.position)==='Franchise';
  /*
   * A Franchise promotion must reflect MULTI-SEASON NHL dominance and
   * cannot be generated from one exceptional teenage high-school season.
   * Accept only recorded distinct NHL seasons with >=20 GP and >=1.2 PPG
   * (90+ points/82 GP equivalent). Never infer missing seasons.
   */
  const documented=(Array.isArray(player.documentedNHLSeasons)?
    player.documentedNHLSeasons:[]).filter(s=>
      level(s?.level)==='NHL'&&Number(s?.gamesPlayed)>=20&&
      Number(s?.points)>=Number(s?.gamesPlayed)*1.2&&
      s?.seasonId!=null);
  const dominantSeasons=new Set(documented.map(s=>String(s.seasonId))).size;
  const franchiseReady=!franchiseNext||(
    levelName==='NHL'&&root>=90&&dateAge>=19&&dateAge<=27&&
    dominantSeasons>=2&&weeksSinceChange>=24);
  /* High-tier downgrades need preceding season-level evidence too. */
  const weakSeasons=(Array.isArray(player.documentedWeakSeasons)?
    player.documentedWeakSeasons:[]).filter(s=>
      s?.seasonId!=null&&Number(s?.gamesPlayed)>=20&&
      Number(s?.performanceVsExpectation)>0&&
      Number(s?.performanceVsExpectation)<.72);
  const prolongedDecline=root<84||
    new Set(weakSeasons.map(s=>String(s.seasonId))).size>=2;
  const threshold=dateAge<=18?2.25:dateAge<=22?2.50:dateAge<=27?2.85:3.30;
  const directionAllowed=signal>=0?ageAllowsUp&&franchiseReady:
    prolongedDecline;
  const eligible=games>=changeAgeThreshold&&streak>=4&&intensity>=threshold&&
    weeksSinceChange>=10&&confidence<=68&&directionAllowed;
  /* Promotions to Franchise remain rare even after eligibility. */
  const chance=eligible?franchiseNext&&signal>0?
    clamp(.015+(intensity-threshold)*.015,0,.055):
    clamp(.16+(intensity-threshold)*.09,0,.37):0;
  const passed=eligible&&hashRoll([seasonId,weekKey,
    player.id||player.playerId,'potential-v2'].join(':'))<chance;
  const next=passed?boundary(root,player.position,signal>=0?1:-1):root;
  const changed=passed&&next!==root;
  const newConfidence=changed?55:round(confidence,2); // Medium after every change
  const proposed={...carry,confidence:newConfidence,potential:next,
    signal:changed?round(signal*.35):round(signal),streak:changed?0:streak,
    trend:changed?(signal>=0?'rising':'falling'):trend,
    lastChangedWeek:changed?Number(weekNumber):prior.lastChangedWeek,
    lastEvaluatedWeek:weekKey};
  return{status:'evaluated',readOnly:true,changeProposed:changed,
    oldPotential:root,proposedPotential:next,
    proposedRole:tier(next,player.position),certainty:accuracy(newConfidence),
    trend:proposed.trend,evidence:round(evidence),
    relativeProduction:round(ratio),reference:base.units,
    peerCount:base.peerCount,eligibleForReview:eligible,
    franchiseGate:franchiseNext?{documentedDominantNHLSeasons:dominantSeasons,
      permitted:franchiseReady}:null,
    highTierDeclineGate:root>=84?{documentedWeakSeasons:
      new Set(weakSeasons.map(s=>String(s.seasonId))).size,
      permitted:prolongedDecline}:null,
    deterministicRoll:round(hashRoll([seasonId,weekKey,
      player.id||player.playerId,'potential-v2'].join(':'))),
    proposal:proposed};
}
module.exports={metric,cohort,baseline,evaluate,tier};
