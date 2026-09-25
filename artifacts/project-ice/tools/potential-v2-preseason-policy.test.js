'use strict';
const assert=require('node:assert/strict');
const {inspect}=require('./potential-v2-preseason-policy');
const player=(id,opts={})=>({id,potential:74,development:{potential:74},
 seasonStats:{gamesPlayed:0},...opts});
const roster=[player('clean'),player('real',{realPlayer:true,potential:90,development:{potential:90}}),
 player('tainted',{generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2025-2026',
 highSchoolSeasonHistory:[{seasonStartYear:2024,age:14}]}),
 player('conflict',{development:{potential:68}})];
const input={format:'projectice-career-backup',version:1,activeCareerId:'fixture',
 activeRecord:{id:'career:fixture',revision:16,world:{currentDate:'2025-09-04',
 currentSeason:'2025-26',teams:[{roster}]}}};
const original=JSON.stringify(input),out=inspect(input);
assert.deepEqual(out.counts,{preserve:1,'preserve-real':1,quarantine:1,review:1});
assert.equal(out.approvedRatingChanges,0);
assert.equal(out.reviewedSeedCandidates[0].currentRoot,74);
assert.equal(out.reviewedSeedCandidates[0].currentDevelopment,68);
assert.equal(JSON.stringify(input),original,'never mutate backup');
const plausible={...roster[2],highSchoolSeasonHistory:[{seasonStartYear:2024,age:16}],age:17};
const alternate={...input,activeRecord:{...input.activeRecord,world:{...input.activeRecord.world,
 teams:[{roster:[plausible]}]}}};
assert.equal(inspect(alternate).counts.quarantine,1,'stamp outranks coincidental matching ages');
const legitimate={...plausible,id:'legitimate',highSchoolSeasonHistory:[{seasonStartYear:2025,age:14}]};
const newer={...alternate,activeRecord:{...alternate.activeRecord,world:{...alternate.activeRecord.world,
 teams:[{roster:[legitimate]}]}}};
assert.equal(inspect(newer).counts.preserve,1,'valid new history accepted');
assert.throws(()=>inspect({...input,activeCareerId:'wrong'}),/Invalid backup/);
assert.throws(()=>inspect({...input,activeRecord:{...input.activeRecord,
 world:{...input.activeRecord.world,teams:[{roster:[roster[0],roster[0]]}]}}}),/duplicate/);
console.log('PASS: seed baseline gates, identity quarantine, no new ratings, immutable backup');
