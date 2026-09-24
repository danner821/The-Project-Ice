'use strict';
const assert=require('node:assert/strict');
const {rehearsal,core}=require('./potential-v2-migration-rehearsal');
const career={id:'career-player',isCareerPlayer:true,position:'RW',age:16,
 overall:72,potential:74,potentialRole:'Bottom 6 F',attributes:{speed:78},
 seasonStats:{gamesPlayed:0},highSchoolSeasonHistory:[{seasonStartYear:2024,gp:28}],
 development:{potential:68,potentialRole:'AHL Top 6 F',potentialConfidence:87,
 potentialAccuracy:'High',potentialTrend:'stable',
 potentialHistory:[{kind:'old',to:68}],attributeXP:{speed:62},
 attributeUpgradeCounts:{speed:2}}};
const npc={id:'npc',position:'D',age:17,overall:70,potential:79,
 development:{potential:79,potentialHistory:[],attributeXP:{speed:25}}};
const real={id:'real',realPlayer:true,position:'RW',potential:90,
 development:{potential:90}};
const world={currentDate:'2025-09-04',season:{seasonId:'hs-2025-2026'},
 player:{id:'career-player',potential:74,development:{potential:68,
 attributeXP:{speed:62},potentialConfidence:87,potentialHistory:[{kind:'old',to:68}]}},
 teams:[{roster:[career,npc,real]}],externalProspects:[{id:'outside',potential:96}],
 schedule:[{date:'2025-09-18',home:'a',away:'b'}]};
const backup={format:'projectice-career-backup',version:1,
 activeCareerId:'x',activeRecord:{id:'career:x',revision:9,world}};
const before=JSON.stringify(backup);
const baseline={expectedCareerId:'x',expectedDate:'2025-09-04',expectedRevision:9};
const valid={...baseline,players:[{id:'career-player',fromRoot:74,
 fromDevelopment:68,to:79,reason:'reviewed sustained breakout',reviewed:true}]};
const preview=rehearsal(backup,valid);
assert.equal(JSON.stringify(backup),before,'original immutable');
assert.equal(preview.readOnly,true);
assert.equal(preview.approvedForLive,false);
assert.equal(preview.previewCount,1);
const staged=preview.previewWorld.teams[0].roster[0];
assert.equal(staged.potential,79);
assert.equal(staged.development.potential,79);
assert.equal(staged.development.potentialAccuracy,'Medium');
assert.equal(staged.development.potentialConfidence,55);
assert.equal(staged.development.potentialHistory.length,2,'retain history');
assert.equal(preview.previewWorld.player.potential,79,'root snapshot synchronized');
assert.equal(preview.previewWorld.player.development.potential,79);
assert.deepEqual(core(preview.previewWorld),core(world),'no unrelated player/world changes');
assert.deepEqual(preview.previewWorld.teams[0].roster[2],real,'real prospect unchanged');
assert.deepEqual(preview.previewWorld.externalProspects,world.externalProspects);
assert.throws(()=>rehearsal(backup,{...valid,expectedRevision:10}));
assert.throws(()=>rehearsal(backup,{...valid,expectedDate:'2025-09-05'}));
assert.throws(()=>rehearsal(backup,{...valid,players:[
 {...valid.players[0],fromDevelopment:74}]}),'stale nested potential blocked');
assert.throws(()=>rehearsal(backup,{...valid,players:[
 {...valid.players[0],reviewed:false}]}));
assert.throws(()=>rehearsal(backup,{...valid,players:[
 {...valid.players[0],to:99.5}]}));
assert.throws(()=>rehearsal(backup,{...valid,players:[
 {...valid.players[0],id:'real',fromRoot:90,fromDevelopment:90}]}));
assert.throws(()=>rehearsal(backup,{...valid,players:[
 valid.players[0],valid.players[0]]}));
assert.equal(JSON.stringify(backup),before,'blocked plans do not mutate');
console.log('PASS: 23 migration rehearsal safety assertions');
