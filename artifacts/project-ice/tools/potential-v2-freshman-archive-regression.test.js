'use strict';
/* Production-source VM regression. Synthetic players only. No real DB writes.
 * node tools/potential-v2-freshman-archive-regression.test.js
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/high-school-roster-rollover.js'),'utf8');
const senior={id:'senior',firstName:'Former',lastName:'Senior',position:'RW',
 grade:12,year:'Senior',age:18,overall:75,potential:84,draftYear:2025,
 attributes:{speed:76},seasonStats:{gamesPlayed:28,points:24},appliedGameIds:['old'],
 highSchoolSeasonHistory:[{seasonStartYear:2022,age:17},{seasonStartYear:2023,age:18}],
 seasonHistory:[{id:'old'}],travelHistory:[{id:'old'}],
 development:{potential:84,xpEarnedCareer:1050,xpSpentCareer:200,attributeXP:{speed:44},
 attributeXPEarnedCareer:{speed:100},attributeUpgradeCounts:{speed:2},
 developmentHistory:[{id:'old-training'}],potentialHistory:[{id:'old-potential'}],
 dna:{seed:.9}},scoutingProfile:{gamesObserved:20,scoutingHistory:[{id:'old-scout'}]},
 gameLog:[{id:'old-game'}],accomplishments:[{id:'old-award'}],
 history:{seasons:[{id:'old-season'}]}};
const returning={id:'returning',firstName:'Returning',lastName:'Player',
 position:'D',grade:10,year:'Sophomore',age:16,overall:65,draftYear:2027,
 highSchoolSeasonHistory:[{seasonStartYear:2023,age:16}]};
const world={currentDate:'2024-08-31',
 season:{seasonId:'hs-2023-2024',seasonStartYear:2023,currentDate:'2024-08-31'},
 player:{id:'career',isCareerPlayer:true},teams:[{teamId:'team-test',schoolName:'Test',
 teamName:'Lynx',roster:[senior,returning]}]};
let saves=0;const WorldEngine={state:world,save(){saves++;},
 refreshTeamRosterManagement(){},syncPlayerAges(){}};
vm.runInNewContext(source,{WorldEngine,Game:{},window:{addEventListener(){}},
 console:{warn(){}}},{filename:'high-school-roster-rollover.js'});
assert(WorldEngine.captureHighSchoolGraduatingClass());
assert(WorldEngine.applyHighSchoolRosterRollover({seasonId:'hs-2024-2025',
 startDate:'2024-09-01'}));
const freshman=world.teams[0].roster.find(p=>p.generatedIncomingFreshman);
assert(freshman&&freshman.id!==senior.id&&freshman.age===14);
for(const field of ['highSchoolSeasonHistory','seasonHistory','travelHistory',
 'gameLog','accomplishments'])
 assert.equal(freshman[field].length,0,'inherited '+field);
assert.equal(freshman.history.seasons.length,0);
assert.equal(freshman.development.xpEarnedCareer,0);
assert.equal(freshman.development.xpSpentCareer,0);
assert.equal(freshman.development.developmentHistory.length,0);
assert.equal(freshman.development.potentialHistory.length,0);
assert.equal(Object.keys(freshman.development.attributeXP).length,0);
assert.equal(freshman.development.dna,null);
assert.notEqual(freshman.developmentSeed,senior.development?.dna?.seed);
assert.equal(freshman.scoutingProfile.gamesObserved,0);
assert.equal(freshman.scoutingProfile.scoutingHistory.length,0);
assert.equal(freshman.seasonStats.gamesPlayed,0);
assert.equal(freshman.careerStats.gamesPlayed,0);
assert.equal(freshman.appliedGameIds.length,0);
assert.equal(world.highSchoolRosterLifecycle.graduatedPlayers.length,1);
assert.equal(world.highSchoolRosterLifecycle.graduatedPlayers[0].highSchoolSeasonHistory.length,2);
assert.equal(returning.highSchoolSeasonHistory.length,1);
const count=world.teams[0].roster.length;
assert.equal(WorldEngine.applyHighSchoolRosterRollover({seasonId:'hs-2024-2025',
 startDate:'2024-09-01'}),false,'same-season replay');
assert.equal(world.teams[0].roster.length,count);
assert.equal(saves,1);
returning.grade=12;returning.year='Senior';returning.schoolYear='Senior';
returning.draftYear=2026;
world.season={seasonId:'hs-2024-2025',seasonStartYear:2024,currentDate:'2025-08-31'};
freshman.highSchoolSeasonHistory.push({seasonStartYear:2024,age:14});
assert(WorldEngine.captureHighSchoolGraduatingClass());
assert(WorldEngine.applyHighSchoolRosterRollover({seasonId:'hs-2025-2026',
 startDate:'2025-09-01'}));
const new2025=world.teams[0].roster.filter(p=>p.generatedIncomingFreshman&&
 p.incomingClassSeasonId==='hs-2025-2026');
assert.equal(new2025.length,1);
assert.equal(new2025[0].highSchoolSeasonHistory.length,0);
assert.equal(freshman.highSchoolSeasonHistory.length,1);
assert.equal(world.highSchoolRosterLifecycle.graduatedPlayers.length,2);
assert.equal(saves,2);
console.log('PASS: two production-source rollover years, independent freshman XP/scouting/history, archived graduates, returning histories, idempotent saving');
