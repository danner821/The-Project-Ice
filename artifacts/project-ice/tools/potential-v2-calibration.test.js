'use strict';
/* Synthetic fixtures only; run node artifacts/project-ice/tools/potential-v2-calibration.test.js */
const assert=require('node:assert/strict');
const {calibrate,tierBenchmark,sample}=require('./potential-v2-calibration');
function f(id,pts0,pts1,potential=74,real=false,age=16){
 return{id,firstName:id,lastName:'Fixture',position:'RW',age,overall:72,potential,realPlayer:real,
  development:{potential},highSchoolSeasonHistory:[2023,2024].map((year,i)=>({
   seasonStartYear:year,age:age-1+i,overall:70+i*2,
   regularSeasonStats:{gamesPlayed:28,points:i?pts1:pts0,minutesPlayed:570,shots:30,plusMinus:0}
  }))};
}
const peers=Array.from({length:25},(_,i)=>f('peer'+i,12+i,14+i,66+i));
const breakout=f('breakout',2,42);breakout.development.potential=68;
const future=f('future',15,22);
future.highSchoolSeasonHistory.push({seasonStartYear:2025,age:17,overall:99,
 regularSeasonStats:{gamesPlayed:28,points:300,minutesPlayed:500}});
const incomplete=f('incomplete',8,9);incomplete.highSchoolSeasonHistory=[];
const real=f('real',12,48,90,true);
const goalie={id:'goalie',firstName:'goalie',position:'G',age:16,potential:85,
 development:{potential:85},highSchoolSeasonHistory:[2023,2024].map((y,i)=>({
  seasonStartYear:y,age:15+i,overall:70+i,
  regularSeasonStats:{gamesPlayed:20,saves:620+i*30,shotsAgainst:700}
 }))};
const world={currentDate:'2025-09-04',
 teams:[{roster:[...peers,breakout,future,incomplete,goalie,real]}],
 externalProspects:[{realPlayer:true,potential:96}]};
const before=JSON.stringify(world),out=calibrate(world),again=calibrate(world);
const get=id=>out.rows.find(x=>x.id===id);
assert.equal(JSON.stringify(world),before,'no mutation');
assert.deepEqual(out,again,'deterministic');
assert.equal(out.generatedCount,29);
assert.equal(out.excludedRealHS,1);
assert.equal(out.excludedExternal,1);
assert.equal(get('breakout').status,'conflict-review');
assert.equal(get('breakout').rootHypothesis.status,'supported');
assert.equal(get('breakout').developmentHypothesis.status,'supported');
assert.ok(get('breakout').rootHypothesis.performanceVsExpectation>1);
assert.equal(get('future').latestYear,2024,'no future archives');
assert.equal(get('incomplete').status,'insufficient-history');
assert.ok(out.rows.every(x=>x.proposedPotential===null),'no rating assignments');
assert.equal(sample(goalie,goalie.highSchoolSeasonHistory[1]).metric,650/700);
assert.equal(tierBenchmark({position:'G',age:16,metric:.92},[],85,'root','none').status,'insufficient-tier-peers');
assert.ok(!out.rows.find(x=>x.id==='real'),'real players excluded');
assert.ok(!get('goalie').proposedPotential);
console.log('PASS 15 calibrated shadow regression checks');
