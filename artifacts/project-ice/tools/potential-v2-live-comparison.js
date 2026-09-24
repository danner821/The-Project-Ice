/* Offline legacy-formula versus Potential V2 comparison.
 * NO imports by game, no IndexedDB, no mutation or proposed migration.
 * This mirrors only the legacy weekly *entry evidence* and implicit OVR+2
 * floor, not its entire live stateful deterministic reevaluation routine.
 */
'use strict';
const {evaluate}=require('./potential-v2-weekly-shadow');
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function generated(player){
  return player&&player.realPlayer!==true&&player.persistentProspect!==true;
}
function approximateOldWeek(player){
 const p=player||{},d=p.development||{},s=p.seasonStats||{};
 const age=Number(p.age??d.currentAge)||14,overall=Number(p.overall)||50;
 const potential=Number(d.potential??p.potential),gp=Number(s.gamesPlayed??p.gamesPlayed)||0;
 let performance=0;
 if(gp>=3){
   if(String(p.position).toUpperCase()==='G'){
     const sv=Number(s.savePercentage??p.savePercentage)||
       (Number(s.shotsAgainst)>0?Number(s.saves)/Number(s.shotsAgainst):0);
     if(sv>0)performance=clamp((sv-.900)/.055,-1,1);
   }else{
     const points=Number(s.points??p.points)||((Number(s.goals)||0)+(Number(s.assists)||0));
     const ppg=points/Math.max(1,gp);
     const expected=clamp(.30+(overall-55)*.025,.18,1.35);
     performance=clamp((ppg-expected)/.65,-1,1);
   }
 }
 const form=clamp(((Number(p.recentForm)||50)-50)/50,-1,1),
   trust=clamp(((Number(p.coachTrust)||50)-50)/50,-1,1);
 const ledger=Object.values(d.seasonAttributeGrowth||{}).reduce((sum,n)=>
   sum+Math.max(0,Number(n)||0),0);
 const growth=clamp(ledger/12,-1,1);
 const missed=Math.max(0,Number(p.health?.gamesMissed)||0);
 const injury=clamp(-missed/8,-1,0);
 const ageFlex=age<=18?1:age<=23?.72:age<=27?.42:.20;
 const evidence=clamp((performance*.48+growth*.22+form*.14+
   trust*.10+injury*.06)*ageFlex,-1,1);
 const floor=Math.min(99,Math.max(25,overall+(age<=23?2:0)));
 return {rootPotential:Number.isFinite(Number(p.potential))?Number(p.potential):null,
   developmentPotential:Number.isFinite(Number(d.potential))?Number(d.potential):null,
   oldPotential:Number.isFinite(potential)?potential:null,
   legacyOverallFloor:floor,wouldRaiseToFloor:Number.isFinite(potential)&&floor>potential,
   legacyEntryEvidence:Number(evidence.toFixed(4)),gp};
}
function compareWorld(world,{seasonId,weekKey,weekNumber=1,observedGames=0}={}){
 if(!world||!Array.isArray(world.teams)||!seasonId||!weekKey)
   throw Error('Valid world and explicit season/week required');
 const all=world.teams.flatMap(t=>Array.isArray(t?.roster)?t.roster:[]);
 const hs=all.filter(generated);
 const peers=hs.map(p=>({...p,leagueLevel:'HS',teamLevel:'Varsity'}));
 const rows=hs.map(p=>{
   const old=approximateOldWeek(p);
   const current={...p,leagueLevel:'HS',teamLevel:'Varsity'};
   const modern=evaluate({player:current,peers,seasonId,weekKey,weekNumber,
     observedGames:Number(p?.scoutingProfile?.gamesObserved)||observedGames,
     previous:{}});
   return {id:p.id||p.playerId||null,
     careerPlayer:p.isCareerPlayer===true,
     existingRootPotential:old.rootPotential,
     existingDevelopmentPotential:old.developmentPotential,
     legacyEvidence:old.legacyEntryEvidence,
     legacyForcedFloor:old.legacyOverallFloor,
     legacyCouldForcePromotion:old.wouldRaiseToFloor,
     modernStatus:modern.status,
     modernWithholdReason:modern.reason||null,
     modernEvidence:modern.status==='evaluated'?modern.evidence:null,
     modernTrend:modern.status==='evaluated'?modern.trend:null,
     modernChangeProposal:modern.status==='evaluated'?modern.changeProposed:false,
     wasMutated:false};
 });
 return {version:'potential-v2-offline-comparison-v1',readOnly:true,
   source:'Legacy arithmetic mirror versus pure V2 weekly shadow, not live execution',
   generatedHS:hs.length,excludedRealHS:all.length-hs.length,
   excludedExternal:Array.isArray(world.externalProspects)?world.externalProspects.length:0,
   unsupportedDraftProspects:'no reassessment',rows};
}
module.exports={approximateOldWeek,compareWorld};
