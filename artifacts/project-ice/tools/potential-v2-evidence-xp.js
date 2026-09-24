/* Project Ice — OFFLINE evidence → XP integration review.
 * Does not import into gameplay. Does not change a save or propose ratings.
 * Reads the backup, uses two independent historical scoring paths, then
 * previews XP under EACH supported current-potential hypothesis.
 * Scouting confidence alone NEVER grants breakout XP discounts.
 */
'use strict';
const fs=require('node:fs');
const {evaluateWorld}=require('./potential-v2-shadow');
const {calibrate}=require('./potential-v2-calibration');
const {proposal}=require('./potential-v2-xp-shadow');
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const rounded=n=>Number(n.toFixed(3));
function evidenceFor(shadow,calibrated,hypothesis){
  const withheld={status:'withheld',breakoutEvidence:0,reasons:[]};
  if(!shadow||!calibrated){withheld.reasons.push('MISSING_CROSS_CHECK');return withheld;}
  if(!shadow.historicalDataComplete||calibrated.status==='insufficient-history'){
    withheld.reasons.push('MISSING_COMPLETED_SEASONS');return withheld;
  }
  if(calibrated.status==='insufficient-age-position-peers'){
    withheld.reasons.push('INSUFFICIENT_PEERS');return withheld;
  }
  if(!hypothesis||hypothesis.status!=='supported'){
    withheld.reasons.push('INSUFFICIENT_POTENTIAL_TIER_PEERS');return withheld;
  }
  const isGoalie=shadow.group==='G';
  const hasVolume=Number(calibrated.latestGames)>= (isGoalie?8:15);
  if(!hasVolume||Number(shadow.latestPeerCount)<8){
    withheld.reasons.push('INSUFFICIENT_SEASON_SAMPLE');return withheld;
  }
  const previous=Number(shadow.previousMainPercentile);
  const latest=Number(shadow.latestMainPercentile);
  const percentile=Number(hypothesis.tierRelativePercentile);
  const ratio=Number(hypothesis.performanceVsExpectation);
  if(![previous,latest,percentile,ratio].every(Number.isFinite)){
    withheld.reasons.push('INVALID_EVIDENCE_METRICS');return withheld;
  }
  const rise=latest-previous;
  const isBreakout=['strong-breakout-review','breakout-review'].includes(shadow.review);
  const isGoalieChallenge=isGoalie?percentile>=85&&ratio>=1.015:percentile>=78&&ratio>=1.20;
  if(!isBreakout||rise<15||!isGoalieChallenge){
    return {status:'no-sustained-breakout',breakoutEvidence:0,
      reasons:['NO_VALIDATED_TWO_SEASON_POTENTIAL_MISMATCH'],
      ratio,percentile,relativeImprovement:rounded(rise)};
  }
  // Current potential is a comparison hypothesis; all evidence is
  // explicitly provisional until age/league calibration is approved.
  const ratioScore=isGoalie?clamp((ratio-1.005)/.055,0,1):clamp((ratio-1.12)/.78,0,1);
  const percentileScore=clamp((percentile-75)/24,0,1);
  const improvementScore=clamp((rise-15)/65,0,1);
  const combined=ratioScore*.43+percentileScore*.37+improvementScore*.20;
  const age=Number(calibrated.currentAge);
  const ageWeight=age<=22?1:age<=27?.78:age<=32?.43:.18;
  const score=rounded(clamp(combined*ageWeight,0,1));
  return {status:score>=.65?'strong-provisional':'provisional',
    breakoutEvidence:score,
    reasons:['TWO_SEASON_PERFORMANCE_CHALLENGE','CURRENT_TIER_HYPOTHESIS_ONLY'],
    ratio,percentile,relativeImprovement:rounded(rise)};
}
function playerReview(world,attributeKeys=['wristShotPower','passing','speed']){
 const shadow=evaluateWorld(world),calibration=calibrate(world);
 const shadowById=new Map(shadow.rows.map(x=>[String(x.id),x]));
 const calibratedById=new Map(calibration.rows.map(x=>[String(x.id),x]));
 const roster=world.teams.flatMap(t=>Array.isArray(t.roster)?t.roster:[]);
 const players=roster.filter(p=>p&&p.realPlayer!==true&&p.persistentProspect!==true);
 const rows=players.map(p=>{
   const id=String(p.id||p.playerId||''),sh=shadowById.get(id),cal=calibratedById.get(id);
   const conflict=cal?.hasConflict===true;
   const sourceList=conflict?['root','development']:['development'];
   const scenarios=sourceList.map(source=>{
     const potential=source==='root'?cal?.rootPotential:cal?.nestedPotential;
     const hypothesis=source==='root'?cal?.rootHypothesis:cal?.developmentHypothesis;
     const evidence=evidenceFor(sh,cal,hypothesis);
     return {source,potential,evidence,
       pricePreviews:attributeKeys.filter(k=>Number.isFinite(Number(p?.attributes?.[k]))&&
          Number(p.attributes[k])>=25&&Number(p.attributes[k])<99)
         .map(key=>proposal(p,key,{potential,breakoutEvidence:evidence.breakoutEvidence,careerLevel:'HS'}))
         .filter(x=>x.status==='preview')
         .map(x=>({attribute:x.attributeKey,attributeRating:x.attributeRating,
           baselineXP:x.baselineCost,proposedXP:x.proposedCost,earnedXP:x.currentXP,
           remainingXP:x.remainingXP,breakoutEvidence:x.breakoutEvidence,
           noXPSpent:x.levelUpPerformed===false}))
     };
   });
   return {id,name:cal?.name||null,position:cal?.position||null,
     conflict,review:sh?.review||'unknown',previousPercentile:sh?.previousMainPercentile??null,
     latestPercentile:sh?.latestMainPercentile??null,
     potentialMigration:'NOT_AUTHORIZED',scenarios};
 });
 const statuses={};
 for(const r of rows)for(const scenario of r.scenarios){
  const k=scenario.evidence.status;statuses[k]=(statuses[k]||0)+1;
 }
 return {version:'potential-v2-evidence-xp-v1',readOnly:true,gameDate:calibration.gameDate,
   generatedHS:players.length,excludedRealHS:calibration.excludedRealHS,
   excludedExternal:calibration.excludedExternal,
   reports:statuses,unresolvedPotentialConflicts:rows.filter(r=>r.conflict).length,
   caveat:'Provisional historical XP simulation only. No game scores, ratings, XP or save data changed.',
   rows};
}
module.exports={evidenceFor,playerReview};
if(require.main===module){
 const source=process.argv[2],dest=process.argv[3];
 if(!source||!dest||source===dest)throw Error('Usage: node potential-v2-evidence-xp.js backup.json separate-report.json');
 const backup=JSON.parse(fs.readFileSync(source,'utf8'));
 if(backup?.format!=='projectice-career-backup'||backup.version!==1||
   backup.activeRecord?.id!=='career:'+backup.activeCareerId||!backup.activeRecord?.world)
   throw Error('Invalid backup envelope. Nothing written.');
 const report=playerReview(backup.activeRecord.world);
 fs.writeFileSync(dest,JSON.stringify(report,null,2));
 console.log(JSON.stringify({gameDate:report.gameDate,generatedHS:report.generatedHS,
   excludedRealHS:report.excludedRealHS,excludedExternal:report.excludedExternal,
   reports:report.reports,unresolvedPotentialConflicts:report.unresolvedPotentialConflicts,
   career:report.rows.find(r=>r.name==='Alacai Stephenson')},null,2));
}
