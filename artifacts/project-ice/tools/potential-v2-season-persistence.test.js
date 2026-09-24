'use strict';
/* Synthetic replicas of September 4 metadata. No personal save in repository.
 * Extract real canonical season functions from live world.js.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const start=source.indexOf('  function createDefaultSeasonState(');
const end=source.indexOf('  function ensureCanonicalSeasonState(',start);
const completeEnd=source.indexOf('  function getSeasonWeekForDate(',end);
assert.ok(start>=0&&end>start&&completeEnd>end,'canonical season source found');
const canonical=vm.runInNewContext('(function(){\n'+source.slice(start,completeEnd)+
 '\nreturn {createDefaultSeasonState,ensureCanonicalSeasonState};\n})()',
 {structuredClone:x=>JSON.parse(JSON.stringify(x))});
const make=()=>({currentDate:'2025-09-04',currentSeason:'2025-26',
 currentWeek:1,currentYear:2025,seasonVersion:'season-v1',
 player:{id:'career-player',playerId:'career-player',currentDate:'2025-09-04',
 schoolYear:'Junior',overall:72,potential:74},
 season:{id:'hs-2025-2026',label:'2025-26',seasonNumber:3,
 careerYear:3,seasonStartYear:2025,seasonEndYear:2026,
 currentDate:'2025-09-04',currentWeek:1,phase:'preseason',status:'active',
 level:'high-school',regularSeason:{started:false,completed:false,gamesPerTeam:28},
 postseason:{qualified:false,started:false,completed:false},
 processedDates:['2025-09-02','2025-09-03','2025-09-04'],
 processedWeeks:[],weeklyHistory:[],unresolvedEventIds:[],
 completedEventIds:['returning-varsity-tryouts:hs-2025-2026'],
 lastProcessedDate:'2025-09-04',lastProcessedWeek:0,
 seasonId:'hs-2025-2026',seasonLabel:'2025-26',currentYear:2025,
 careerYearIndex:2,schoolYear:'Junior'},
 teams:[{roster:[{id:'career-player',isCareerPlayer:true,overall:72}]}],
 externalProspects:[{id:'real-prospect'}],schedule:[{id:'game'}]});
const full=make(),prior=JSON.stringify(full);
const fullSeason=canonical.createDefaultSeasonState(full);
assert.equal(fullSeason.seasonId,'hs-2025-2026');
assert.equal(fullSeason.seasonLabel,'2025-26');
assert.equal(fullSeason.currentYear,2025);
assert.equal(fullSeason.careerYearIndex,2);
assert.equal(fullSeason.schoolYear,'Junior');
assert.equal(JSON.stringify(full),prior,'create must not mutate source');
canonical.ensureCanonicalSeasonState(full);
assert.equal(full.season.seasonId,'hs-2025-2026');
assert.equal(full.season.schoolYear,'Junior');
assert.equal(full.player.overall,72);
assert.equal(full.teams[0].roster[0].overall,72);
assert.equal(full.schedule.length,1);
assert.equal(full.externalProspects.length,1);
const roundtrip=JSON.stringify(full);
canonical.ensureCanonicalSeasonState(full);
assert.equal(JSON.stringify(full),roundtrip,'repeated canonical load idempotent');
const partial=make();
for(const key of ['seasonId','seasonLabel','currentYear','careerYearIndex','schoolYear'])
 delete partial.season[key];
canonical.ensureCanonicalSeasonState(partial);
assert.equal(partial.season.seasonId,'hs-2025-2026');
assert.equal(partial.season.seasonLabel,'2025-26');
assert.equal(partial.season.currentYear,2025);
assert.equal(partial.season.careerYearIndex,2);
assert.equal(partial.season.schoolYear,'Junior');
assert.equal(partial.player.overall,72,'repair cannot reset overall');
assert.ok(source.includes('_saveRevision = Math.max(_saveRevision, loadedRevision)'),
 'authoritative load must resume revision');
assert.ok(source.includes('_saveRevision = Math.max(_saveRevision, legacyRevision)'),
 'legacy import must resume revision');
assert.ok(source.includes('Number(resolvedRecord.revision) || 0'),
 'authoritative revision comes from loaded career');
console.log('PASS: canonical season preserves metadata, repairs legacy and resumes save revisions');
