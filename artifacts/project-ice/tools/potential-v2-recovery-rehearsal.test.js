'use strict';
/* Synthetic-only fault-injection test. No real career, no browser storage.
 * node artifacts/project-ice/tools/potential-v2-recovery-rehearsal.test.js
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {planRecovery,simulateAtomicRecovery,createMemoryTransactionAdapter}=
  require('./potential-v2-recovery-rehearsal');
const id='career-fixture',key='career:'+id;
function record(revision,date='2025-09-04',savedAt='2026-09-24T22:29:06Z'){
  const player={id:'career-player',isCareerPlayer:true,age:16,position:'RW',
    firstName:'Fixture',lastName:'Player',overall:72,potential:74,
    attributes:{speed:78},development:{potential:68,attributeXP:{speed:62},
      attributeUpgradeCounts:{speed:2}},
    highSchoolSeasonHistory:[{seasonStartYear:2023,
      regularSeasonStats:{gamesPlayed:28,points:7}}]};
  return {id:key,careerId:id,revision,savedAt,
    world:{currentDate:date,
      season:{id:'hs-2025-2026',label:'2025-26',seasonNumber:3,
        careerYear:3,careerYearIndex:2,currentDate:date,phase:'preseason',
        schoolYear:'Junior',processedDates:['2025-09-02']},
      persistence:{revision,careerId:id,recordId:key,currentDate:date},
      teams:[{roster:[player]}],
      externalProspects:[{id:'real-prospect',realPlayer:true,potential:96}],
      player:{id:'career-player',potential:74,development:{potential:68}},
      awards:[],newsItems:[]}};
}
const old=record(4,'2025-09-04','2026-09-24T05:56:01Z');
const live=record(2);
const original=JSON.stringify({old,live});
const backup={format:'projectice-career-backup',version:1,
  activeCareerId:id,activeRecord:old};
const options={backup,live,activeCareerId:id,
  confirmation:true,fullRecordVerified:true,rollbackExportVerified:true};
const plan=planRecovery(options);
assert.equal(plan.status,'READY_FOR_ISOLATED_REHEARSAL');
assert.equal(plan.revisionReset,true,'recognize real historical revision-reset ordering');
assert.equal(plan.candidateRevision,5,'resume past both revisions');
assert.equal(plan.mayWriteLive,false);
assert.equal(plan.candidate.world.teams[0].roster[0].development.attributeXP.speed,62);
assert.equal(plan.candidate.world.season.careerYearIndex,2);
assert.equal(plan.candidate.world.externalProspects.length,1);
assert.equal(JSON.stringify({old,live}),original,'planning never mutates input');
assert.equal(planRecovery({...options,confirmation:false}).status,'BLOCKED');
assert.equal(planRecovery({...options,fullRecordVerified:false}).status,'BLOCKED');
assert.equal(planRecovery({...options,rollbackExportVerified:false}).status,'BLOCKED');
assert.equal(planRecovery({...options,activeCareerId:'wrong'}).status,'BLOCKED');
const changedPlayer=JSON.parse(JSON.stringify(live));
changedPlayer.world.teams[0].roster[0].id='different-person';
assert.equal(planRecovery({...options,live:changedPlayer}).status,'BLOCKED');
const older=record(1,'2025-09-03');
assert.equal(planRecovery({...options,backup:{...backup,activeRecord:older}})
  .reason,'BACKUP_OLDER_THAN_CURRENT_GAME_DATE');
const worldSource=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const start=worldSource.indexOf('  function createDefaultSeasonState(');
const end=worldSource.indexOf('\n  function ensureCanonicalSeasonState(',start);
assert.ok(start>0&&end>start,'extract actual game season boot normalizer');
const createSeason=vm.runInNewContext(worldSource.slice(start,end)+
  '\ncreateDefaultSeasonState;', {structuredClone});
let checks=0;
const boot=world=>{
  const result=createSeason(world);
  checks++;
  return result.currentDate==='2025-09-04'&&
    result.careerYearIndex===2&&result.schoolYear==='Junior'&&
    result.phase==='preseason'&&
    world.teams[0].roster[0].development.attributeXP.speed===62&&
    world.externalProspects.length===1;
};
function bootCandidate(record){return boot(record.world);}
async function run(){
 let store=createMemoryTransactionAdapter({[key]:live});
 let result=await simulateAtomicRecovery(plan,store,{bootCandidate});
 assert.equal(result.status,'STAGED_BOOT_VERIFIED_IN_FAKE_DB');
 assert.equal(result.productionRestoreAvailable,false);
 assert.equal(result.rollbackVerified,true);
 assert.equal(result.journalRetained,true);
 assert.equal((await store.get(key)).revision,5);
 assert.deepEqual(await store.get('recovery-test-rollback:'+id),live,
   'complete live record retained as rollback');
 assert.equal((await store.get('recovery-test-journal:'+id)).state,'PENDING_BOOT');
 assert.ok(checks>=1,'candidate ran through production season normalizer');
 result=await simulateAtomicRecovery(plan,store,{bootCandidate});
 assert.equal(result.status,'STALE_LIVE_STATE',
   'a second recovery cannot overwrite a staged candidate');
 store=createMemoryTransactionAdapter({[key]:live});
 store.injectFault('BEFORE');
 result=await simulateAtomicRecovery(plan,store,{bootCandidate});
 assert.equal(result.status,'TRANSACTION_ABORTED');
 assert.deepEqual(await store.get(key),live);
 assert.equal(await store.get('recovery-test-rollback:'+id),null);
 store=createMemoryTransactionAdapter({[key]:live});
 store.injectFault('BEFORE_COMMIT');
 result=await simulateAtomicRecovery(plan,store,{bootCandidate});
 assert.equal(result.status,'TRANSACTION_ABORTED',
   'atomic transaction never leaves half-written save after abort');
 assert.deepEqual(await store.get(key),live);
 assert.equal(await store.get('recovery-test-journal:'+id),null);
 store=createMemoryTransactionAdapter({[key]:live});
 store.injectFault('AFTER_COMMIT');
 result=await simulateAtomicRecovery(plan,store,{bootCandidate});
 assert.equal(result.commitAcknowledgmentLost,true);
 assert.equal(result.status,'STAGED_BOOT_VERIFIED_IN_FAKE_DB',
   'lost post-commit acknowledgment must not be mistaken for an abort');
 store=createMemoryTransactionAdapter({[key]:live});
 result=await simulateAtomicRecovery(plan,store,{bootCandidate:()=>false});
 assert.equal(result.status,'BOOT_FAILED_ROLLED_BACK');
 assert.equal(result.rollbackVerified,true);
 assert.deepEqual(await store.get(key),live,
   'the full saved record is recovered byte-for-byte as JSON values');
 assert.equal((await store.get('recovery-test-journal:'+id)).state,'ROLLED_BACK');
 store=createMemoryTransactionAdapter({[key]:live});
 result=await simulateAtomicRecovery(plan,store,{bootCandidate:()=>{throw Error('BOOT_FAILED')}});
 assert.equal(result.status,'BOOT_FAILED_ROLLED_BACK');
 store=createMemoryTransactionAdapter({[key]:live});
 const advanced={...live,revision:3,world:{...live.world,
   currentDate:'2025-09-05'}};
 result=await simulateAtomicRecovery(plan,store,{bootCandidate:async()=>{
   await store.atomic(tx=>tx.put(key,advanced));
   return false;
 }});
 assert.equal(result.status,'ROLLBACK_BLOCKED_SAVE_CHANGED',
   'never overwrite gameplay changes made after staged candidate');
 assert.deepEqual(await store.get(key),advanced);
 store=createMemoryTransactionAdapter({[key]:live});
 await store.atomic(tx=>tx.put(key,advanced));
 result=await simulateAtomicRecovery(plan,store,{bootCandidate});
 assert.equal(result.status,'STALE_LIVE_STATE',
   'concurrently advanced save must not be overwritten');
 assert.equal(JSON.stringify({old,live}),original,'all fault injections leave fixtures pristine');
 console.log('PASS: 40+ recovery gates, atomic fault injection, actual season boot, rollback CAS');
}
run().catch(e=>{console.error(e);process.exitCode=1;});