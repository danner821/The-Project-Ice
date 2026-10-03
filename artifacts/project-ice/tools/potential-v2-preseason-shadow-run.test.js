'use strict';
const assert=require('node:assert/strict'),{run}=require('./potential-v2-preseason-shadow-run');
const p=(id,extra={})=>({id,potential:74,development:{potential:74},position:'RW',age:16,
 seasonStats:{gamesPlayed:0},...extra});
const roster=[p('clean'),p('real',{realPlayer:true}),
 p('tainted',{generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2025-2026',
 highSchoolSeasonHistory:[{seasonStartYear:2024,age:15}]}),
 p('career',{development:{potential:68}})];
const backup={format:'projectice-career-backup',version:1,activeCareerId:'fixture',
 activeRecord:{id:'career:fixture',revision:16,world:{currentDate:'2025-09-04',
 currentSeason:'2025-26',currentWeek:1,teams:[{roster}]}}};
const before=JSON.stringify(backup),r=run(backup);
assert.deepEqual(r.weeklyOutcomes,{
 INSUFFICIENT_PLAYER_SAMPLE:1,REAL_PLAYER_NOT_ELIGIBLE:1,
 INHERITED_ARCHIVE_BLOCKED:1,UNRESOLVED_BASELINE:1});
assert.equal(r.allRosterPlayersCounted,4);assert.deepEqual(r.proposals,[]);
assert.equal(JSON.stringify(backup),before,'no backup mutation');
// A prospective player sample without an adequate clean cohort is withheld.
roster[0].seasonStats={gamesPlayed:8,points:8,minutesPlayed:300};
const r2=run(backup);assert.equal(r2.weeklyOutcomes.INSUFFICIENT_SAME_LEVEL_TIER_PEERS,1);
assert.deepEqual(r2.proposals,[]);
console.log('PASS: initial preseason and post-games insufficient-cohort shadow; no mutation or auto-rating');
