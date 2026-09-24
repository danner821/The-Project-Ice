'use strict';
/* Test the EXACT pure recovery-assessment function embedded in Save Trace.
 * This does not access the browser, IndexedDB, or any user's saved data.
 * Run: node artifacts/project-ice/tools/potential-v2-browser-recovery-preview.test.js
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/persistence-trace-debug.js'),'utf8');
const start=source.indexOf('  function assessBackupForRecovery(');
const end=source.indexOf('  async function previewDownloadedBackup(',start);
assert.ok(start>0&&end>start,'exact browser preflight source exists');
const code=source.slice(start,end);
assert.ok(!/indexedDB|localStorage|\.put\(|\.delete\(/.test(code),
 'assessment is pure: no persistence side effects');
const dateOf=world=>world?.season?.currentDate||world?.currentDate||null;
const assess=vm.runInNewContext(code+'\nassessBackupForRecovery;', {dateOf});
const activeId='career-1',recordId='career:'+activeId;
const make=(revision=8,date='2025-09-04',extra={})=>({
 id:recordId,careerId:activeId,revision,
 world:{currentDate:date,season:{seasonId:extra.seasonId||'hs-2025-2026',currentDate:date},
 teams:[{roster:[{id:'alacai',isCareerPlayer:true,overall:extra.ovr??72}]}],
 externalProspects:Array.from({length:2},(_,i)=>({id:i}))}
});
const backup={format:'projectice-career-backup',version:1,
 activeCareerId:activeId,activeRecord:make()};
const baseline=JSON.stringify(backup),live=make();
let result=assess(backup,live,activeId);
assert.equal(result.verdict,'SAME_RECOVERY_BASELINE');
assert.equal(result.restorePerformed,false);
assert.equal(result.readOnly,true);
assert.equal(result.newerLiveProgress,false);
assert.equal(JSON.stringify(backup),baseline,'backup unchanged');
assert.equal(JSON.stringify(live),JSON.stringify(make()),'live unchanged');
assert.equal(assess(backup,make(9),activeId).verdict,'OLDER_BACKUP');
assert.equal(assess(backup,make(8,'2025-09-05'),activeId).verdict,'OLDER_BACKUP');
assert.equal(assess(backup,make(8,'2025-09-04',{ovr:73}),activeId).verdict,'DIFFERENT_SAVE_STATE');
assert.equal(assess(backup,make(8,'2025-09-04',{seasonId:'other'}),activeId).verdict,'DIFFERENT_SAVE_STATE');
assert.equal(assess({...backup,activeCareerId:'other'},live,activeId).verdict,'BLOCKED');
assert.equal(assess({...backup,version:2},live,activeId).verdict,'BLOCKED');
assert.equal(assess({...backup,activeRecord:{...make(),id:'career:other'}},live,activeId).verdict,'BLOCKED');
assert.equal(assess(backup,{...live,id:'career:other'},activeId).verdict,'BLOCKED');
assert.equal(assess(backup,{...live,revision:null},activeId).verdict,'BLOCKED');
const gone=make();gone.world.teams[0].roster=[];
assert.equal(assess(backup,gone,activeId).verdict,'BLOCKED');
assert.ok(assess(backup,gone,activeId).failureCodes.includes('LIVE_CAREER_MARKER_COUNT'),
 'diagnostic must identify a missing live career marker');
const duplicated=make();
duplicated.world.teams[0].roster.push({
  id:'duplicate',isCareerPlayer:true,overall:72
});
assert.ok(assess(backup,duplicated,activeId).failureCodes.includes('LIVE_CAREER_MARKER_COUNT'),
 'diagnostic must identify duplicate career markers');
const wrongPlayer=make();
wrongPlayer.world.teams[0].roster[0].id='different-player';
assert.ok(assess(backup,wrongPlayer,activeId).failureCodes.includes('CAREER_PLAYER_ID_CHANGED'),
 'diagnostic must identify changed roster player identity');
assert.equal(assess(backup,wrongPlayer,activeId).comparison.samePlayerId,false,
 'diagnostic must not silently accept a different player ID');
const missing=make();delete missing.world.externalProspects;
assert.equal(assess(backup,missing,activeId).verdict,'BLOCKED');
assert.ok(source.includes('const freshRecords = await readRecords();'),
 'export must refresh the persisted snapshot before serializing');
assert.ok(source.includes('activeCareerId: activeId,\n          activeRecord: latestRecord,'),
 'fresh export identity must come from the same latest saved record');
assert.ok(source.includes('const currentRecords = await readRecords();'),
 'recovery preview must use the newest saved record');
assert.ok(source.includes("tx.oncomplete = () => {\n          db.close();\n          resolve(records);"),
 'readRecords must await readonly transaction completion');
assert.ok(!/\.put\(|\.delete\(/.test(source.slice(end,
 source.indexOf('  function ensureButton()',end))),
 'preview stage exposes no IndexedDB restore/write action');
console.log('PASS: source recovery preview including precise identity diagnostics and no-write checks');
