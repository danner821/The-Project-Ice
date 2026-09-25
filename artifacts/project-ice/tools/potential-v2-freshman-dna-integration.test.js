'use strict';
/* Actual production world.js + freshman rollover, synthetic fixture and zero DB writes.
 * node tools/potential-v2-freshman-dna-integration.test.js
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../public');
const code=['prospects.js','world.js','high-school-roster-rollover.js']
 .map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
const cache=new Map(),context={
 window:{addEventListener(){}},document:{},
 localStorage:{getItem:k=>cache.get(k)||null,
   setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)},
 indexedDB:{open(){throw Error('No real IndexedDB allowed in this test')}},
 structuredClone:x=>JSON.parse(JSON.stringify(x)),console:{log(){},warn(){},error(){}},
 Date,Math,setTimeout,clearTimeout
};
vm.createContext(context);
vm.runInContext(code+'\nthis.engine=WorldEngine;',context,{timeout:30000});
const engine=context.engine,world=engine.state;
world.currentDate='2024-08-31';
world.season={seasonId:'hs-2023-2024',seasonStartYear:2023,currentDate:'2024-08-31'};
world.player={id:'fixture-career',isCareerPlayer:true};
world.teams.forEach(team=>team.roster=[]);
const senior={id:'graduate-fixture',firstName:'Fixture',lastName:'Senior',
 position:'RW',grade:12,year:'Senior',age:18,draftYear:2025,
 overall:75,potential:84,attributes:{speed:76,passing:71},
 highSchoolSeasonHistory:[{seasonStartYear:2023,age:18}],
 development:{xpEarnedCareer:900,attributeXP:{speed:20},
   dna:{seed:.99,personality:'late'}}};
world.teams[0].roster=[senior];
let saves=0;engine.save=()=>{saves++;return true};
engine.syncPlayerAges=()=>{};engine.refreshTeamRosterManagement=()=>{};
assert(engine.captureHighSchoolGraduatingClass());
assert(engine.applyHighSchoolRosterRollover(
 {seasonId:'hs-2024-2025',startDate:'2024-09-01'}));
const freshman=world.teams[0].roster[0];
assert(freshman.generatedIncomingFreshman&&freshman.id!==senior.id);
assert.equal(freshman.development.dna,null,'graduate DNA not inherited');
assert.equal(freshman.development.xpEarnedCareer,0,'graduate XP not inherited');
engine.getAllWorldPlayers(); // actual canonical initializer, not a mock
assert(freshman.development.dna&&typeof freshman.development.dna==='object',
 'actual WorldEngine must initialize independent freshman DNA');
assert.notEqual(freshman.development.dna.seed,senior.development.dna.seed);
assert.equal(freshman.development.xpEarnedCareer,0);
assert.equal(saves,1,'only one rollover save');
console.log('PASS: real WorldEngine creates independent freshman DNA, zero inherited XP, isolated no-DB transition');
