'use strict';
/* OPTIONAL PRIVATE integration. Executes the current production game engine
 * on an isolated IndexedDB stand-in; reads the user backup, never rewrites it.
 * node tools/potential-v2-private-first-week-gate.js /private/backup.json
 * Do NOT upload the backup or tool output containing private roster details.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {fakeIndexedDB}=require('./potential-v2-fake-indexeddb');
const copy=x=>JSON.parse(JSON.stringify(x)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const filename=process.argv[2];if(!filename)throw Error('Private backup path required');
const bytes=fs.readFileSync(filename),originalHash=hash(bytes),backup=JSON.parse(bytes);
assert.equal(backup.format,'projectice-career-backup');
assert.equal(backup.activeRecord.id,'career:'+backup.activeCareerId);
const disposable='potential_v2_ONLY_DISPOSABLE_authority';
const fake=fakeIndexedDB();
fake.addSentinel(disposable,backup.activeRecord.id,backup.activeRecord);
fake.addSentinel('projectice_database','career:protected',{id:'career:protected',world:{canary:42}});
const local=new Map([['projectice_active_career_id_v1',backup.activeCareerId]]);
const ctx={
 indexedDB:{open(name,version){assert.equal(name,'projectice_database');
   return fake.indexedDB.open(disposable,version);},
  deleteDatabase(){throw Error('Production DB deletion blocked');}},
 localStorage:{getItem:k=>local.get(k)||null,
   setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)},
 structuredClone:copy,console:{log(){},warn(){},error(){}},
 window:{},document:{},Date,Math,setTimeout,clearTimeout
};
vm.createContext(ctx);
const publicDir=path.join(__dirname,'../public');
vm.runInContext(fs.readFileSync(path.join(publicDir,'prospects.js'),'utf8')+
 '\n'+fs.readFileSync(path.join(publicDir,'world.js'),'utf8')+
 '\nthis.engine=WorldEngine;',ctx,{timeout:30000});
(async()=>{
 assert.equal(await ctx.engine.load(),true,'original active career must load');
 const world=ctx.engine.state,roster=()=>world.teams.flatMap(t=>t.roster||[]);
 const potentialSignature=()=>roster().map(p=>({
   id:p.id||p.playerId,root:p.potential,development:p.development?.potential,
   confidence:p.development?.potentialConfidence,
   trend:p.development?.potentialTrend,
   history:copy(p.development?.potentialHistory||[])
 }));
 assert.equal(roster().length,160);assert.equal(world.externalProspects.length,191);
 const prior=potentialSignature(),beforeSaved=copy(fake.registry.get(disposable).records.get(backup.activeRecord.id));
 const advanced=ctx.engine.advanceToDate('2025-09-08',{maximumDays:7,save:false});
 assert.equal(advanced.weeklyProcessingResults.length,1,'one real production weekly boundary');
 assert.deepEqual(potentialSignature(),prior,'no protected preseason potential mutation');
 const career=roster().find(p=>p.isCareerPlayer);
 assert.equal(career.potential,74);
 assert.equal(career.development.potential,68);
 assert.deepEqual(fake.registry.get(disposable).records.get(backup.activeRecord.id),
   beforeSaved,'calendar simulation with save:false cannot write backup');
 assert.equal(fake.registry.get('projectice_database').records.get('career:protected').world.canary,42);
 assert.equal(hash(fs.readFileSync(filename)),originalHash,'private input unchanged');
 console.log('PASS: actual production first-week calendar, protected 160 player potential records; 74/68 intact; no real DB touched');
 // Production WorldEngine may leave housekeeping timers armed in the VM.
 // All assertions are complete; exit so standalone/CI verification cannot hang.
 process.exit(0);
})().catch(e=>{console.error(e);process.exitCode=1;});
