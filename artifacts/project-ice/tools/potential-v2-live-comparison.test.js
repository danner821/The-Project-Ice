'use strict';
const assert=require('node:assert/strict');
const {approximateOldWeek,compareWorld}=require('./potential-v2-live-comparison');
function fixture(id,pts=15,p=74,real=false){
 return{id,firstName:id,position:'RW',age:16,overall:72,potential:p,
 realPlayer:real,attributes:{speed:76},scoutingProfile:{gamesObserved:10},
 development:{potential:p,potentialConfidence:85,seasonAttributeGrowth:{}},
 seasonStats:{gamesPlayed:20,points:pts,minutesPlayed:400}};
}
const peers=Array.from({length:20},(_,i)=>fixture('peer'+i,10+i,70+i%10));
const career=fixture('career',32,68);career.isCareerPlayer=true;
career.potential=74; // conflicting saved root/nested potential
const real=fixture('real',40,96,true);
const world={teams:[{roster:[...peers,career,real]}],externalProspects:[real]};
const before=JSON.stringify(world);
const args={seasonId:'hs-2025-2026',weekKey:'week:2025-09-01',weekNumber:1};
const a=compareWorld(world,args);
assert.equal(JSON.stringify(world),before,'must not change career save');
assert.deepEqual(a,compareWorld(world,args),'deterministic');
assert.equal(a.generatedHS,21);
assert.equal(a.excludedRealHS,1);
assert.equal(a.excludedExternal,1);
assert.ok(!a.rows.some(p=>p.id==='real'),'real prospect excluded');
const row=a.rows.find(p=>p.careerPlayer);
assert.equal(row.existingRootPotential,74);
assert.equal(row.existingDevelopmentPotential,68);
assert.equal(row.legacyForcedFloor,74);
assert.equal(row.legacyCouldForcePromotion,true,'old engine can force 72+2');
assert.equal(row.modernStatus,'withheld','new engine refuses conflicted rating');
assert.equal(row.modernWithholdReason,'UNRECONCILED_OR_MISSING_POTENTIAL');
assert.equal(row.modernChangeProposal,false);
assert.ok(a.rows.every(r=>r.wasMutated===false));
const clean=fixture('clean',16,74);
const classic=approximateOldWeek(clean);
assert.equal(classic.legacyOverallFloor,74);
assert.equal(classic.wouldRaiseToFloor,false);
assert.equal(approximateOldWeek({...clean,age:30,overall:80}).legacyOverallFloor,80);
const empty={teams:[{roster:[fixture('noGames',0)]}]};
empty.teams[0].roster[0].seasonStats.gamesPlayed=0;
assert.equal(compareWorld(empty,args).rows[0].modernWithholdReason,'INSUFFICIENT_PLAYER_SAMPLE');
assert.throws(()=>compareWorld(world,{}));
console.log('PASS: read-only legacy/V2 comparison and no-mutation regression checks');
