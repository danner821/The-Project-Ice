/* Project Ice Potential 2.0 — offline, read-only calibration pass.
 * Never loaded by the live game. Input: exported backup JSON; output: separate report.
 * Present-day potential is a hypothesis, not a reconstructed historical tier.
 */
'use strict';
const fs=require('node:fs');
const POSITION=p=>String(p?.position||'').toUpperCase()==='G'?'G':['D','LD','RD'].includes(String(p?.position||'').toUpperCase())?'D':'F';
const valid=n=>Number.isFinite(Number(n));
const round=(v,dp=2)=>Number(Number(v).toFixed(dp));
const yearEnd=y=>`${Number(y)+1}-08-31`;
function eligible(player){return player&&player.realPlayer!==true&&player.persistentProspect!==true;}
function years(player,currentDate){return(Array.isArray(player?.highSchoolSeasonHistory)?player.highSchoolSeasonHistory:[]).filter(h=>Number.isInteger(Number(h?.seasonStartYear))&&yearEnd(h.seasonStartYear)<=currentDate).sort((a,b)=>a.seasonStartYear-b.seasonStartYear).slice(-2);}
function sample(player,season){
 const s=season?.regularSeasonStats||{},gp=Number(s.gamesPlayed)||0,age=Number(season?.age);
 if(!valid(age)||age<13||age>45)return null;
 const position=POSITION(player);
 if(position==='G'){
  const shots=Number(s.shotsAgainst)||0,saves=Number(s.saves)||0;
  if(gp<3||shots<100||shots<saves||!valid(s.saves))return null;
  return {position,age,gp,sample:shots,metric:saves/shots,kind:'savePercentage'};
 }
 const minutes=Number(s.minutesPlayed)||0;
 if(gp<10||minutes<100)return null;
 const goals=Number(s.goals)||0,assists=Number(s.assists)||0,points=Number(s.points??goals+assists);
 if(points<0)return null;
 return {position,age,gp,sample:minutes,metric:points*60/minutes,kind:'pointsPer60'};
}
function potentialValue(player,source){
 const v=source==='development'?player.development?.potential:player.potential,n=Number(v);
 return Number.isFinite(n)&&n>=25&&n<=99?n:null;
}
function tierBenchmark(target,cohort,hypothesis,source,excludeId){
 if(hypothesis===null||!target)return{status:'unavailable'};
 const pool=cohort.filter(item=>item.playerId!==excludeId&&item.metric&&item.metric.position===target.position&&Math.abs(item.metric.age-target.age)<=1)
  .map(item=>({...item,potential:potentialValue(item.player,source)}))
  .filter(item=>item.potential!==null&&Math.abs(item.potential-hypothesis)<=10)
  .map(item=>({...item,weight:1/(1+Math.abs(item.potential-hypothesis)/5)*(item.metric.age===target.age?1:.70)}));
 const sum=pool.reduce((n,x)=>n+x.weight,0);
 const effective=sum>0?sum*sum/pool.reduce((n,x)=>n+x.weight*x.weight,0):0;
 const required=target.position==='G'?5:8;
 if(pool.length<required||effective<required-1)return{status:'insufficient-tier-peers',peerCount:pool.length,effectivePeers:round(effective,1)};
 const mean=pool.reduce((n,x)=>n+x.metric.metric*x.weight,0)/sum;
 const percentile=pool.reduce((n,x)=>n+x.weight*(x.metric.metric<target.metric?1:x.metric.metric===target.metric?.5:0),0)/sum*100;
 return {status:'supported',peerCount:pool.length,effectivePeers:round(effective,1),referencePotential:hypothesis,
  expected:round(mean,4),observed:round(target.metric,4),performanceVsExpectation:mean>0?round(target.metric/mean,2):null,
  tierRelativePercentile:round(percentile,1),metric:target.kind};
}
function calibrate(world){
 const date=String(world?.currentDate||world?.season?.currentDate||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Array.isArray(world?.teams))throw Error('Invalid world/date');
 const roster=world.teams.flatMap(t=>Array.isArray(t.roster)?t.roster:[]);
 const generated=roster.filter(eligible);
 const cohort=generated.map(player=>({player,playerId:String(player.id||player.playerId||''),history:years(player,date)}));
 for(const item of cohort){item.prior=sample(item.player,item.history[0]);item.latest=sample(item.player,item.history[1]);}
 const peers=cohort.map(item=>({player:item.player,playerId:item.playerId,metric:item.latest}));
 const rows=cohort.map(item=>{
  const p=item.player,root=potentialValue(p,'root'),nested=potentialValue(p,'development');
  const out={id:item.playerId,name:[p.firstName,p.lastName].filter(Boolean).join(' '),position:POSITION(p),currentAge:Number(p.age)||null,
   rootPotential:root,nestedPotential:nested,hasConflict:root!==nested,latestYear:item.history[1]?.seasonStartYear??null,
   latestMetric:item.latest?round(item.latest.metric,4):null,latestGames:item.latest?.gp??null,
   scoreType:item.latest?.kind??null,rootHypothesis:null,developmentHypothesis:null,proposedPotential:null,
   historicalPotentialEvidence:'not-reconstructible-from-current-potential',
   caveat:'Uses current saved potential as a hypothesis, not an archived historical projection.'};
  if(!item.prior||!item.latest){out.status='insufficient-history';return out;}
  const near=peers.filter(x=>x.playerId!==item.playerId&&x.metric&&x.metric.position===item.latest.position&&Math.abs(x.metric.age-item.latest.age)<=1);
  out.agePositionPeerCount=near.length;
  if(near.length<8){out.status='insufficient-age-position-peers';return out;}
  out.rootHypothesis=tierBenchmark(item.latest,peers,root,'root',item.playerId);
  out.developmentHypothesis=tierBenchmark(item.latest,peers,nested,'development',item.playerId);
  out.status=out.hasConflict?'conflict-review':'calibrated-evidence-only';
  return out;
 });
 return {version:'potential-v2-calibration-v1',readOnly:true,gameDate:date,generatedCount:generated.length,
  excludedRealHS:roster.length-generated.length,excludedExternal:Array.isArray(world.externalProspects)?world.externalProspects.length:0,
  caveat:'Saved HS-world peer comparison only; not NHL-equivalent potential. No ratings assigned.',rows};
}
module.exports={calibrate,tierBenchmark,sample};
if(require.main===module){
 const source=process.argv[2],out=process.argv[3];
 if(!source||!out||source===out)throw Error('Usage: node potential-v2-calibration.js backup.json separate-report.json');
 const backup=JSON.parse(fs.readFileSync(source,'utf8'));
 if(backup.format!=='projectice-career-backup'||backup.version!==1||
    backup.activeRecord?.id!==`career:${backup.activeCareerId}`||!backup.activeRecord?.world)throw Error('Invalid backup');
 const report=calibrate(backup.activeRecord.world);
 fs.writeFileSync(out,JSON.stringify(report,null,2));
 const statuses=report.rows.reduce((o,r)=>(o[r.status]=(o[r.status]||0)+1,o),{});
 console.log(JSON.stringify({gameDate:report.gameDate,generated:report.generatedCount,excludedRealHS:report.excludedRealHS,excludedExternal:report.excludedExternal,statuses,career:report.rows.find(r=>r.name==='Alacai Stephenson')},null,2));
}
