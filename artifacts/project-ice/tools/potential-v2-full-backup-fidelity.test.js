'use strict';
/* Tests the exact full-field comparator embedded in Save Trace.
 * Run: node artifacts/project-ice/tools/potential-v2-full-backup-fidelity.test.js
 * All fixtures synthetic; never opens IndexedDB or uses private backups.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const publicCode=fs.readFileSync(
  path.join(__dirname,'../public/persistence-trace-debug.js'),'utf8');
const begin=publicCode.indexOf('  async function verifyCompleteBackupRecord(');
const end=publicCode.indexOf('  /*\n   * An imported backup is tested ONLY',begin);
assert.ok(begin>=0&&end>begin,'extract actual Save Trace comparator');
const comparatorSource=publicCode.slice(begin,end);
assert.ok(!/indexedDB|localStorage|\\.put\\(|\\.delete\\(/.test(comparatorSource),
  'complete-record check never touches persistence');
const verify=vm.runInNewContext(comparatorSource+
  '\nverifyCompleteBackupRecord;', {setTimeout});
const original={
  id:'career:fixture',careerId:'fixture',revision:4,
  savedAt:'2026-09-24T01:00:00Z',
  world:{
    currentDate:'2025-09-04',
    season:{seasonId:'hs-2025-2026',careerYearIndex:2,
      schoolYear:'Junior',processedDates:['2025-09-02','2025-09-04']},
    player:{id:'career',overall:72,potential:74},
    teams:[{roster:[{id:'career',isCareerPlayer:true,overall:72,
      development:{potential:68,attributeXP:{speed:62,passing:105},
        attributeUpgradeCounts:{speed:2}},
      highSchoolSeasonHistory:[{seasonStartYear:2023,
        regularSeasonStats:{gamesPlayed:28,points:7}}]}]}],
    externalProspects:[{id:'real',potential:96}],
    timeline:[{date:'2025-09-04',completed:false}]
  }
};
const copy=x=>JSON.parse(JSON.stringify(x));
(async()=>{
  const before=JSON.stringify(original);
  const good=await verify(original,copy(original));
  assert.ok(good.verifiedFields>35,'visit entire saved data graph');
  assert.equal(JSON.stringify(original),before,'comparator may not mutate input');
  const xp=copy(original);
  xp.world.teams[0].roster[0].development.attributeXP.speed=63;
  await assert.rejects(verify(original,xp),/attributeXP.speed/,
    'detect one lost XP within otherwise matching career');
  const hist=copy(original);
  hist.world.teams[0].roster[0].highSchoolSeasonHistory[0]
    .regularSeasonStats.points=8;
  await assert.rejects(verify(original,hist),/points/,
    'catch changed historical stats');
  const season=copy(original);
  delete season.world.season.careerYearIndex;
  await assert.rejects(verify(original,season),
    /Field count mismatch|careerYearIndex/,'catch missing season alias');
  const list=copy(original);
  list.world.externalProspects.push({id:'new'});
  await assert.rejects(verify(original,list),/Array length mismatch/,
    'catch extra external prospect');
  const typo=copy(original);
  delete typo.world.teams[0].roster[0].overall;
  typo.world.teams[0].roster[0].score=72;
  await assert.rejects(verify(original,typo),/overall/,
    'catch equal-count changed field names');
  const huge={roster:Array.from({length:26000},(_,i)=>i)};
  const large=await verify(huge,copy(huge));
  assert.ok(large.verifiedFields>26000,'large career traversed iteratively');
  console.log('PASS: full-field fidelity, XP, stats, season, roster, and large-save checks');
})().catch(error=>{console.error(error);process.exitCode=1;});