'use strict';
/* Run: node artifacts/project-ice/tools/potential-v2-disposable-protocol.test.js
 * Tests the EXACT function in Save Trace against a minimal transactional
 * fake IndexedDB. This tests control flow and atomicity, NOT real Safari.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {fakeIndexedDB}=require('./potential-v2-fake-indexeddb');
const src=fs.readFileSync(path.join(__dirname,
  '../public/persistence-trace-debug.js'),'utf8');
const start=src.indexOf('  async function testDisposableRecoveryProtocol(');
const end=src.indexOf('  /*\n   * Restore PREVIEW ONLY',start);
assert.ok(start>0&&end>start,'extract current deployed browser test');
const code=src.slice(start,end);
assert.ok(!code.includes('localStorage')&&!code.includes("indexedDB.open(DB_NAME"),
  'no writes to user storage or the live game database');
function runner(fake){
  const pending=new Set();
  let count=0;
  const timer=fn=>{
    const id=++count;
    let promise=Promise.resolve();
    for(let i=0;i<30;i++)promise=promise.then(()=>{});
    promise.then(()=>{if(pending.has(id)){pending.delete(id);fn();}});
    pending.add(id);
    return id;
  };
  const clear=id=>pending.delete(id);
  return new Function('indexedDB','structuredClone','DB_NAME',
    'setTimeout','clearTimeout',code+
    '\nreturn testDisposableRecoveryProtocol;')(
      fake.indexedDB,structuredClone,'projectice_database',timer,clear);
}
async function run(){
  const real={id:'career:real',revision:17,
    world:{currentDate:'2025-09-04',special:'MUST REMAIN UNTOUCHED'}};
  const fake=fakeIndexedDB();
  fake.addSentinel('projectice_database','career:real',real);
  const result=await runner(fake)();
  assert.equal(result.abortedTransaction,true);
  assert.equal(result.atomicStage,true);
  assert.equal(result.readBack,true);
  assert.equal(result.failedBootRollback,true);
  assert.equal(result.newerProgressProtected,true);
  assert.equal(result.cleanup,'deleted');
  assert.equal(fake.counters.transactions>=15,true);
  assert.equal(fake.counters.abortions>=2,true);
  assert.equal(fake.counters.opens.length,1);
  assert.ok(fake.counters.opens[0].startsWith(
    'projectice_recovery_protocol_disposable_'));
  assert.ok(fake.counters.opens.every(n=>n!=='projectice_database'));
  assert.deepEqual([...fake.registry.keys()],['projectice_database'],
    'temporary database deleted after all checks');
  assert.deepEqual(fake.registry.get('projectice_database')
    .records.get('career:real'),real,'real IndexedDB sentinel unchanged');
  const constrained=fakeIndexedDB({maxRecordBytes:120});
  constrained.addSentinel('projectice_database','career:real',real);
  await assert.rejects(runner(constrained)(),/QuotaExceededError/,
    'quota error aborts the synthetic transaction safely');
  assert.equal(constrained.counters.abortions,1);
  assert.equal(constrained.counters.deletions.length,1,
    'cleanup must run even after quota error');
  assert.deepEqual([...constrained.registry.keys()],['projectice_database']);
  assert.deepEqual(constrained.registry.get('projectice_database')
    .records.get('career:real'),real);
  console.log('PASS: disposable atomic abort, staged readback, rollback, '+
    'newer-progress CAS, cleanup and quota-failure isolation');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
