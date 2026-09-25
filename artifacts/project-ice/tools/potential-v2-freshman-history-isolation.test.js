'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../public/high-school-roster-rollover.js'),'utf8');
const graduate={id:'graduating-senior',playerId:'graduating-senior',firstName:'Older',lastName:'Senior',
 position:'RW',age:18,grade:12,schoolYear:'Senior',draftYear:2025,overall:70,
 potential:82,development:{potential:82,developmentHistory:[{id:'senior-upgrade'}],
 attributeXP:{speed:43},xpEarnedCareer:320},attributes:{speed:70,puckControl:70},
 highSchoolSeasonHistory:[{seasonId:'hs-2023-2024',seasonStartYear:2023,age:17,
 regularSeasonStats:{gamesPlayed:28}},{seasonId:'hs-2024-2025',seasonStartYear:2024,age:18,
 regularSeasonStats:{gamesPlayed:28}}],seasonHistory:[{id:'old-season'}],
 appliedGameIds:['old-id'],scoutingProfile:{publicRank:3,gamesObserved:18}};
const before=JSON.stringify(graduate);
const world={currentDate:'2025-09-04',season:{seasonId:'hs-2025-2026',seasonStartYear:2025,
 currentDate:'2025-09-04'},teams:[{teamId:'team-test',schoolName:'Test',teamName:'Tigers',
 roster:[JSON.parse(before)]}],player:{isCareerPlayer:true,age:16},
 highSchoolRosterLifecycle:{version:2,completedSeasonIds:[],graduatedPlayers:[],
 pendingGraduates:[{playerId:'graduating-senior',teamId:'team-test',seasonId:'hs-2024-2025',
 player:JSON.parse(before)}]}};
let saves=0;
const sandbox={WorldEngine:{state:world,save:()=>{saves++},
 syncPlayerAges:()=>{},refreshTeamRosterManagement:()=>{}},
 window:{addEventListener:()=>{}},console:{warn:()=>{}}};
vm.runInNewContext(code,sandbox,{filename:'high-school-roster-rollover.js'});
assert.equal(typeof sandbox.WorldEngine.applyHighSchoolRosterRollover,'function');
sandbox.WorldEngine.applyHighSchoolRosterRollover({seasonId:'hs-2025-2026',startDate:'2025-09-04'});
const freshman=world.teams[0].roster.find(p=>p.generatedIncomingFreshman===true);
assert(freshman,'one freshman must replace graduated senior');
assert.notEqual(freshman.id,graduate.id);
assert.equal(freshman.grade,9);
assert.equal(freshman.age,14);
assert.equal(JSON.stringify(freshman.highSchoolSeasonHistory),JSON.stringify([]),
 'new freshman must never inherit graduate archived seasons');
assert.equal(JSON.stringify(freshman.seasonHistory),JSON.stringify([]));
assert.equal(world.highSchoolRosterLifecycle.graduatedPlayers.length,1);
assert.equal(JSON.stringify(world.highSchoolRosterLifecycle.graduatedPlayers[0].highSchoolSeasonHistory),
 JSON.stringify(graduate.highSchoolSeasonHistory),'original graduated history retained');
assert(saves>=1);
console.log('PASS: exact production rollover keeps graduated HS history out of incoming freshmen');
