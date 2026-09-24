/* Synthetic fixtures only. No user's backup in this repository.
 * Run: node artifacts/project-ice/tools/potential-v2-evidence-xp.test.js
 */
'use strict';
const assert=require('node:assert/strict');
const {evidenceFor,playerReview}=require('./potential-v2-evidence-xp');
function skater(id,previous,latest,opts={}){
 const year=(start,age,points,ovr)=>({seasonStartYear:start,age,overall:ovr,
   regularSeasonStats:{gamesPlayed:28,goals:Math.floor(points/2),
     assists:points-Math.floor(points/2),points,shots:points+20,
     minutesPlayed:570,plusMinus:points-15}});
 const potential=opts.potential??74;
 return{id,firstName:id,lastName:'Fixture',position:'RW',
   age:opts.age??16,overall:opts.overall??72,potential,
   realPlayer:Boolean(opts.real),attributes:{wristShotPower:78,passing:73},
   development:{potential:opts.nested??potential,potentialConfidence:opts.confidence??87,
     attributeXP:{wristShotPower:62},attributeUpgradeCounts:{wristShotPower:1},
     dna:{personality:opts.personality??'balanced'}},
   highSchoolSeasonHistory:[year(2023,(opts.age??16)-1,previous,70),
     year(2024,opts.age??16,latest,72)]};
}
const peers=Array.from({length:25},(_,i)=>skater('peer'+i,7+i,8+i));
const breakout=skater('breakout',2,44,{nested:68});
const steady=skater('steady',22,22);
const missing=skater('missing',7,9);
missing.highSchoolSeasonHistory=[];
const noPotential=skater('no-potential',7,12);
delete noPotential.potential;
delete noPotential.development.potential;
const future=skater('future',8,18);
future.highSchoolSeasonHistory.push({seasonStartYear:2025,age:17,overall:99,
 regularSeasonStats:{gamesPlayed:28,points:300,shots:350,minutesPlayed:550}});
const real=skater('real-prospect',1,60,{real:true,potential:96});
const roster=[...peers,breakout,steady,missing,noPotential,future,real];
const world={currentDate:'2025-09-04',
 teams:[{roster}],externalProspects:[{id:'external',realPlayer:true,potential:99}]};
const before=JSON.stringify(world);
const a=playerReview(world,['wristShotPower','passing']),b=playerReview(world,['wristShotPower','passing']);
const get=id=>a.rows.find(x=>x.id===id);
assert.equal(JSON.stringify(world),before,'read-only world');
assert.deepEqual(a,b,'repeatability');
assert.equal(a.generatedHS,roster.length-1,'real-rostered prospect excluded');
assert.equal(a.excludedRealHS,1);
assert.equal(a.excludedExternal,1);
assert.ok(!get('real-prospect'),'never rerate real prospects');
assert.equal(get('breakout').conflict,true,'mismatch not ignored');
assert.equal(get('breakout').scenarios.length,2,'both potential hypotheses');
assert.ok(get('breakout').scenarios.every(s=>s.evidence.breakoutEvidence>0),'validated breakout at both hypotheses');
assert.ok(get('breakout').scenarios.every(s=>s.pricePreviews.every(p=>p.noXPSpent&&p.earnedXP>=0)),'no XP changed');
assert.ok(get('breakout').scenarios[0].pricePreviews[0].proposedXP<
 get('steady').scenarios[0].pricePreviews[0].proposedXP,'strong breakout eases projected XP cost');
assert.equal(get('steady').scenarios[0].evidence.breakoutEvidence,0,'no bonus for good but stable performance');
assert.equal(get('missing').scenarios[0].evidence.status,'withheld','missing historical seasons');
assert.equal(get('missing').scenarios[0].evidence.breakoutEvidence,0);
assert.equal(get('no-potential').needsPotentialData,true,'do not treat absent potential as zero');
assert.equal(get('no-potential').scenarios.length,0,'no blind fallback potential');
assert.equal(get('future').scenarios[0].evidence.breakoutEvidence,
 playerReview({...world,teams:[{roster:roster.map(p=>p.id==='future'?
  {...p,highSchoolSeasonHistory:p.highSchoolSeasonHistory.slice(0,2)}:p)}]},['wristShotPower'])
 .rows.find(x=>x.id==='future').scenarios[0].evidence.breakoutEvidence,'future archive excluded');
assert.ok(a.rows.every(r=>r.potentialMigration==='NOT_AUTHORIZED'),'no automatic migration');
assert.ok(a.rows.every(r=>r.scenarios.every(s=>s.pricePreviews.every(p=>!('personality' in p)))),'DNA stays hidden');
const sample={historicalDataComplete:true,latestPeerCount:20,group:'F',
 previousMainPercentile:11,latestMainPercentile:97,review:'strong-breakout-review'};
const cal={status:'calibrated-evidence-only',latestGames:28,currentAge:16};
const hyp={status:'supported',performanceVsExpectation:1.8,tierRelativePercentile:97};
assert.ok(evidenceFor(sample,cal,hyp).breakoutEvidence>.75,'extreme supported evidence');
assert.equal(evidenceFor(sample,{...cal,currentAge:31},hyp).breakoutEvidence<
 evidenceFor(sample,cal,hyp).breakoutEvidence,true,'post-prime discount less');
assert.equal(evidenceFor(sample,cal,{status:'insufficient-tier-peers'}).breakoutEvidence,0,
 'insufficient tier peers withhold benefits');
console.log('PASS: 22 offline evidence→XP bridge assertions');
