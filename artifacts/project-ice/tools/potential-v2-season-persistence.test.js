'use strict';
/* Synthetic records matching the September 4 export discrepancy.
 * Run: node artifacts/project-ice/tools/potential-v2-season-persistence.test.js
 * Source-extracted assertions: tests the actual world.js canonicalization
 * and record revision bootstrap rather than reimplementing their behavior.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const start=source.indexOf('  function createDefaultSeasonState(');
const end=source.indexOf('\n  function ensureCanonicalSeasonState(',start);
assert.ok(start>=0&&end>start,'locate canonical season function');
const create=vm.runInNewContext(source.slice(start,end)+'\ncreateDefaultSeasonState;',{structuredClone});
function world(season){
 return {currentDate:'2025-09-04',currentSeason:'2025-26',
   player:{id:'career-player',currentDate:'2025-09-04',schoolYear:'Junior',
     year:'Junior'},
   season};
}
const full={id:'hs-2025-2026',label:'2025-26',seasonId:'hs-2025-2026',
 seasonLabel:'2025-26',seasonNumber:3,careerYear:3,careerYearIndex:2,
 currentYear:2025,schoolYear:'Junior',seasonStartYear:2025,
 seasonEndYear:2026,currentDate:'2025-09-04',currentWeek:1,
 phase:'preseason',status:'active',level:'high-school',
 regularSeason:{started:false,completed:false,gamesPerTeam:28},
 postseason:{qualified:false,started:false,completed:false},
 processedDates:['2025-09-02','2025-09-03','2025-09-04'],
 processedWeeks:[],weeklyHistory:[],otherSeasonMetadata:{source:'prior-season'}};
const canonical=create(world(full));
assert.equal(canonical.seasonId,'hs-2025-2026');
assert.equal(canonical.seasonLabel,'2025-26');
assert.equal(canonical.currentYear,2025);
assert.equal(canonical.careerYearIndex,2);
assert.equal(canonical.schoolYear,'Junior');
assert.equal(canonical.otherSeasonMetadata.source,'prior-season',
 'future season fields may not be silently dropped');
assert.deepEqual(JSON.parse(JSON.stringify(create(world(canonical)))),
 JSON.parse(JSON.stringify(canonical)),'two reloads must not erase metadata');
const missingAliases={...full};
for(const field of ['seasonId','seasonLabel','currentYear','careerYearIndex','schoolYear'])
 delete missingAliases[field];
const repaired=create(world(missingAliases));
assert.equal(repaired.seasonId,'hs-2025-2026');
assert.equal(repaired.seasonLabel,'2025-26');
assert.equal(repaired.currentYear,2025);
assert.equal(repaired.careerYearIndex,2);
assert.equal(repaired.schoolYear,'Junior');
assert.equal(repaired.currentDate,'2025-09-04');
assert.equal(repaired.phase,'preseason');
assert.deepEqual(repaired.processedDates,full.processedDates);
assert.equal(repaired.regularSeason.started,false);
assert.equal(repaired.postseason.started,false);
assert.deepEqual(JSON.parse(JSON.stringify(create(world(repaired)))),
 JSON.parse(JSON.stringify(repaired)),'repaired legacy aliases survive another reload');
const bootstrapStart=source.indexOf('        const loadedRevision = Math.max(');
const bootstrapEnd=source.indexOf('\n        _persistenceHydrated = true;',bootstrapStart);
assert.ok(bootstrapStart>0&&bootstrapEnd>bootstrapStart,'loaded revision bootstrap exists');
const bootstrap=source.slice(bootstrapStart,bootstrapEnd);
function revived(revision,inner,initial=0){
 const record={revision,world:{persistence:{revision:inner}}};
 const code='let _saveRevision='+initial+';const resolvedRecord=record;'+
    bootstrap+';return _saveRevision;';
 return new Function('record',code)(record);
}
assert.equal(revived(4,4),4,'resume from exact saved record');
assert.equal(revived(1,4),4,'prefer higher trusted world revision');
assert.equal(revived(4,1),4,'prefer higher record revision');
assert.equal(revived(1,1),1,'newer exported reset record still resumes at its current revision');
assert.equal(revived(4,4,5),5,'never lower an already active counter');
assert.equal(revived(4,4)+1,5,'next queued save increments beyond saved revision');
assert.ok(bootstrapEnd<source.indexOf('        if (awardNewsRepair.changed || scoutingConfidenceMigrated)'),
 'revision is restored before automatic repair save can run');
console.log('PASS: canonical season aliases, repeated reload, full history and revision safety');
