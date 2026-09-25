'use strict';
/*
 * Synthetic integration test of atomic staging + the ACTUAL WorldEngine
 * startup + rollback. All storage is injected and remapped to a disposable
 * in-memory database. No user backup, real IndexedDB or production restore.
 * node artifacts/project-ice/tools/potential-v2-staged-production-boot.test.js
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {fakeIndexedDB}=require('./potential-v2-fake-indexeddb');
const worldSource=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const prospectsSource=fs.readFileSync(path.join(__dirname,'../public/prospects.js'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const equals=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const disposable='projectice_recovery_boot_disposable_fixture';
const recordId='career:fixture-career';
const rollbackId='rollback:fixture-career';
const journalId='journal:fixture-career';
const savedAt='2026-09-24T22:29:06Z';
function start(fake){
 const local=new Map([['projectice_active_career_id_v1','fixture-career']]);
 const storage={getItem:k=>local.get(k)||null,
   setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};
 const index={open:(name,version)=>{
   assert.equal(name,'projectice_database',
     'game may request only its canonical database name');
   return fake.indexedDB.open(disposable,version);
 },deleteDatabase:()=>{throw Error('World boot attempted database deletion');}};
 const context={indexedDB:index,localStorage:storage,structuredClone:clone,
   console:{log(){},warn(){},error(){}},
   window:{},document:{},setTimeout,clearTimeout,Date,Math};
 vm.createContext(context);
 vm.runInContext(prospectsSource+'\n'+worldSource+
   '\nthis.bootEngine=WorldEngine;this.fixtureProspects=REAL_PROSPECTS;',
   context,{filename:'sandboxed-prospects-and-world.js',timeout:30000});
 return{engine:context.bootEngine,prospects:context.fixtureProspects};
}
function worldFixture(runtime){
 const w=clone(runtime.engine.state);
 w.currentDate='2025-09-04';w.currentSeason='2025-26';w.currentYear=2025;
 w.season={id:'hs-2025-2026',seasonId:'hs-2025-2026',
   seasonStartYear:2025,seasonEndYear:2026,
   label:'2025-26',seasonLabel:'2025-26',careerYear:3,seasonNumber:3,
   currentDate:'2025-09-04',schoolYear:'Junior',careerYearIndex:2,
   phase:'preseason',status:'active',level:'high-school'};
 w.player={id:'career-fixture',playerId:'career-fixture',
   firstName:'Test',lastName:'Career',currentDate:'2025-09-04',
   schoolYear:'Junior',potential:74,development:{potential:68}};
 for(let t=0;t<w.teams.length;t++){
   w.teams[t].roster=Array.from({length:20},(_,i)=>{
     const career=t===0&&i===0;
     return{id:career?'career-fixture':'npc-'+t+'-'+i,
       firstName:career?'Test':'Fake',lastName:career?'Career':'NPC',
       position:career?'RW':i===19?'G':i%4?'RW':'D',
       isCareerPlayer:career,age:16,overall:career?72:60+i,
       potential:career?74:75,
       development:{potential:career?68:75,
         attributeXP:{speed:career?62:i},attributeUpgradeCounts:{speed:2}},
       highSchoolSeasonHistory:[
         {seasonStartYear:2023,regularSeasonStats:{gamesPlayed:28,points:7}},
         {seasonStartYear:2024,regularSeasonStats:{gamesPlayed:28,points:23}}]};
   });
 }
 w.externalProspects=clone(runtime.prospects);
 w.persistence={recordId,careerId:'fixture-career',
   revision:2,currentDate:'2025-09-04'};
 return w;
}
async function transact(db,fn,expectedAbort=false){
 return new Promise((resolve,reject)=>{
   const tx=db.transaction('worlds','readwrite');
   tx.oncomplete=()=>expectedAbort?reject(Error('Expected abort did not occur')):resolve();
   tx.onabort=()=>expectedAbort?resolve():reject(
     tx.error||Error('Atomic transaction aborted'));
   tx.onerror=()=>{};
   try{fn(tx.objectStore('worlds'),tx);}catch(e){
     try{tx.abort();}catch(_){}
     reject(e);
   }
 });
}
async function read(db,id){
 return new Promise((resolve,reject)=>{
   const tx=db.transaction('worlds','readonly');
   let result=null;
   const req=tx.objectStore('worlds').get(id);
   req.onsuccess=()=>{result=req.result??null;};
   tx.oncomplete=()=>resolve(result);
   tx.onabort=tx.onerror=()=>reject(tx.error||Error('Read failed'));
 });
}
async function stage(db,live,candidate){
 await transact(db,(store,tx)=>{
   const request=store.get(recordId);
   request.onsuccess=()=>{
     if(!equals(request.result,live)){tx.abort();return;}
     store.put({...live,id:rollbackId});
     store.put(candidate);
     store.put({id:journalId,state:'PENDING_BOOT',
       expectedRevision:candidate.revision,rollbackId});
   };
 });
 assert.ok(equals(await read(db,recordId),candidate),
   'full staged candidate read-back');
 assert.ok(equals(await read(db,rollbackId),{...live,id:rollbackId}),
   'complete old save retained before boot');
 assert.equal((await read(db,journalId)).state,'PENDING_BOOT');
}
async function rollback(db,live,candidate){
 await transact(db,(store,tx)=>{
   const a=store.get(recordId),b=store.get(rollbackId);
   let x,y,hasX=false,hasY=false;
   const finish=()=>{
     if(!hasX||!hasY)return;
     if(!equals(x,candidate)||!equals(y,{...live,id:rollbackId})){
       tx.abort();return;
     }
     store.put(live);
     store.put({id:journalId,state:'ROLLED_BACK',rollbackId});
   };
   a.onsuccess=()=>{x=a.result;hasX=true;finish();};
   b.onsuccess=()=>{y=b.result;hasY=true;finish();};
 });
}
function assertBoot(engine){
 const w=engine.state;
 const roster=w.teams.flatMap(t=>t.roster);
 const p=roster.find(v=>v.isCareerPlayer);
 assert.equal(w.season.currentDate,'2025-09-04');
 assert.equal(w.season.careerYearIndex,2);
 assert.equal(w.season.schoolYear,'Junior');
 assert.equal(roster.length,160);
 assert.equal(w.externalProspects.length,191);
 assert.equal(p.id,'career-fixture');
 assert.equal(p.overall,72);
 assert.equal(p.potential,74);
 assert.equal(p.development.potential,68);
 assert.equal(p.development.attributeXP.speed,62);
 assert.equal(p.highSchoolSeasonHistory[1].regularSeasonStats.points,23);
 assert.equal(engine.getCareerPlayer().id,'career-fixture');
}
async function run(){
 const fake=fakeIndexedDB();
 const sentinel={id:'career:real-user',revision:99,
   world:{marker:'ACTUAL USER CAREER MUST NEVER CHANGE'}};
 fake.addSentinel('projectice_database',sentinel.id,sentinel);
 const runtime=start(fake);
 const fixture=worldFixture(runtime);
 assert.equal(runtime.prospects.length,191);
 const live={id:recordId,careerId:'fixture-career',revision:2,
   savedAt,world:fixture};
 const candidate=clone(live);
 candidate.revision=5;
 candidate.world.persistence.revision=5;
 candidate.savedAt='2026-09-25T00:00:00Z';
 fake.addSentinel(disposable,recordId,live);
 const db=fake.registry.get(disposable);
 const immutableLive=clone(live),immutableCandidate=clone(candidate);
 await stage(db,live,candidate);
 const boot=start(fake);
 assert.equal(await boot.engine.load(),true,
   'actual WorldEngine startup accepts atomically staged candidate');
 assertBoot(boot.engine);
 assert.ok(equals(await read(db,recordId),candidate),
   'boot cannot accidentally alter staged recovery');
 // Pretend the surrounding UI failed to initialize AFTER WorldEngine loaded.
 await rollback(db,live,candidate);
 assert.ok(equals(await read(db,recordId),live),
   'atomic rollback restores all original fields');
 assert.equal((await read(db,journalId)).state,'ROLLED_BACK');
 const reboot=start(fake);
 assert.equal(await reboot.engine.load(),true);
 assertBoot(reboot.engine);
 // Stage the candidate again; an actual sandbox save will now advance it.
 await transact(db,store=>{store.delete(rollbackId);store.delete(journalId);});
 await stage(db,live,candidate);
 const resumed=start(fake);
 assert.equal(await resumed.engine.load(),true);
 assertBoot(resumed.engine);
 resumed.engine.state.season.currentDate='2025-09-05';
 resumed.engine.state.currentDate='2025-09-05';
 resumed.engine.state.player.currentDate='2025-09-05';
 assert.equal(await resumed.engine.save(),true,
   'a new gameplay save in the fake database should advance the revision');
 const newer=await read(db,recordId);
 assert.equal(newer.revision,6);
 assert.equal(newer.world.season.currentDate,'2025-09-05');
 let refused=false;
 try{await rollback(db,live,candidate);}catch(_){refused=true;}
 assert.equal(refused,true,'stale rollback must abort on newer gameplay');
 assert.ok(equals(await read(db,recordId),newer),
   'new progress survives aborted stale rollback');
 assert.deepEqual(fake.registry.get('projectice_database')
   .records.get(sentinel.id),sentinel,
   'a completely separate real-world sentinel must stay untouched');
 assert.ok(fake.counters.opens.every(n=>n===disposable),
   'every underlying database open must use the disposable name');
 assert.ok(equals(live,immutableLive)&&equals(candidate,immutableCandidate),
   'all input snapshots remain immutable');
 console.log('PASS: REAL WorldEngine loads staged recovery, rejects UI boot via '+
   'atomic rollback, boots rollback, resumes and saves, blocks stale rollback; '+
   '160 synthetic varsity players and 191 curated real prospects preserved');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
