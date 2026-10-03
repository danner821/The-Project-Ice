'use strict';
const assert=require('node:assert/strict');
const {rehearsal,core}=require('./potential-v2-migration-rehearsal');

const career={
  id:'career-player',playerId:'career-player',isCareerPlayer:true,
  position:'RW',age:16,overall:72,potential:74,
  potentialRole:'Bottom 6 F',potentialAccuracy:'Medium',
  potentialConfidence:62,potentialTrend:'rising',
  attributes:{speed:78,passing:73},
  seasonStats:{gamesPlayed:0},
  highSchoolSeasonHistory:[
    {seasonStartYear:2023,age:15,overall:69,regularSeasonStats:{gamesPlayed:28,points:7,minutesPlayed:568}},
    {seasonStartYear:2024,age:16,overall:72,regularSeasonStats:{gamesPlayed:28,points:23,minutesPlayed:578}},
  ],
  development:{
    potential:68,potentialRole:'AHL Top 6 F',
    potentialConfidence:87.17,potentialAccuracy:'High',potentialTrend:'stable',
    potentialHistory:[],attributeXP:{speed:62},attributeUpgradeCounts:{speed:2},
  }
};
const npc={id:'npc',position:'D',age:17,overall:70,potential:79,
 development:{potential:79,attributeXP:{passing:10}},seasonStats:{gamesPlayed:0}};
const world={
 currentDate:'2025-09-04',
 season:{seasonId:'hs-2025-2026',currentDate:'2025-09-04'},
 player:{id:'career-player',playerId:'career-player',overall:72,potential:74,
   potentialRole:'Bottom 6 F',potentialAccuracy:'Medium',
   potentialConfidence:62,potentialTrend:'rising'},
 teams:[{roster:[career,npc]}],
 externalProspects:[{id:'outside',potential:96}],
 schedule:[{date:'2025-09-18',home:'a',away:'b'}],
};
const backup={format:'projectice-career-backup',version:1,activeCareerId:'x',
 activeRecord:{id:'career:x',revision:16,world}};
const before=JSON.stringify(core(world));
const result=rehearsal(backup,{
 expectedCareerId:'x',expectedDate:'2025-09-04',expectedRevision:16,
 players:[{
   id:'career-player',fromRoot:74,fromDevelopment:68,to:79,
   migrationKind:'legacy-provenance-reseed',
   reason:'Legacy root and nested values are provenance artifacts; independent reviewed breakout evidence supports lower bound of Top 9 tier.',
   reviewed:true
 }]
});
assert.equal(result.readOnly,true);
assert.equal(result.approvedForLive,false);
assert.equal(result.previewCount,1);
const staged=result.previewWorld.teams[0].roster[0];
assert.equal(staged.potential,79);
assert.equal(staged.development.potential,79);
assert.equal(staged.potentialRole,'Top 9 F');
assert.equal(staged.development.potentialRole,'Top 9 F');
assert.equal(staged.potentialConfidence,55);
assert.equal(staged.development.potentialConfidence,55);
assert.equal(staged.potentialAccuracy,'Medium');
assert.equal(staged.development.potentialAccuracy,'Medium');
assert.equal(staged.potentialTrend,'stable');
assert.equal(staged.development.potentialTrend,'stable');
assert.equal(staged.development.potentialHistory.length,1);
assert.equal(staged.development.potentialHistory[0].kind,'legacy-provenance-reseed');
assert.equal(staged.development.potentialHistory[0].trend,'stable');
assert.deepEqual(staged.development.attributeXP,{speed:62});
assert.deepEqual(staged.development.attributeUpgradeCounts,{speed:2});
assert.equal(JSON.stringify(core(result.previewWorld)),before,
 'non-potential gameplay core must remain identical');
assert.equal(result.previewWorld.player.potential,79);
assert.equal(result.previewWorld.player.potentialTrend,'stable');
console.log('PASS: provenance reseed preview synchronizes 79/79 at Medium 55, Stable, without gameplay-core mutation');
