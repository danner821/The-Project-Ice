'use strict';
/* Run:
 * node artifacts/project-ice/tools/potential-v2-isolated-world-boot.test.js
 *
 * Runs the ACTUAL, complete production world.js WorldEngine.load()/save()
 * in a Node VM with separately injected in-memory IndexedDB/localStorage.
 * The fixture contains 160 SYNTHETIC varsity roster slots, 191 CURRENT CURATED
 * real/external prospects and an intentionally conflicted 74/68 career.
 * There is no real browser storage, no real user career identity, no
 * game.js UI boot, and no live user career record.
 *
 * Optional real backup use is intentionally NOT automatic: only after
 * adding a separate audited, private local file input/validation flow.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {fakeIndexedDB}=require('./potential-v2-fake-indexeddb');
const source=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const curatedProspects=fs.readFileSync(path.join(__dirname,'../public/prospects.js'),'utf8');
const copy=x=>JSON.parse(JSON.stringify(x));
const id='synthetic-boot-career';
const key='career:'+id;
const local=new Map([['projectice_active_career_id_v1',id]]);
const forbiddenKey='career:actual-player-must-never-be-read';
function createRuntime(db,trace){
 const storage={
   getItem(k){return local.has(k)?local.get(k):null;},
   setItem(k,v){local.set(k,String(v));},
   removeItem(k){local.delete(k);}
 };
 const context={indexedDB:db.indexedDB,localStorage:storage,
   structuredClone:copy,
   console:{log(){},warn:(...args)=>trace.push(String(args[0])),
     error:(...args)=>trace.push(String(args[0]))},
   window:{},document:{},setTimeout,clearTimeout,Date,Math};
 vm.createContext(context);
 vm.runInContext(curatedProspects+'\n'+source+
   '\nthis.IsolatedWorldEngine=WorldEngine;'+
   '\nthis.IsolatedCuratedProspects=REAL_PROSPECTS;',
   context,{filename:'production-prospects-and-world.js',timeout:30000});
 return{engine:context.IsolatedWorldEngine,
   real:context.IsolatedCuratedProspects};
}
function buildWorld(engine,real){
 const world=copy(engine.state);
 world.currentDate='2025-09-04';
 world.player={id:'fixture-career',playerId:'fixture-career',
   firstName:'Synthetic',lastName:'Career',schoolYear:'Junior',
   currentDate:'2025-09-04'};
 world.season={
   id:'hs-2025-2026',seasonId:'hs-2025-2026',
   currentDate:'2025-09-04',seasonStartYear:2025,seasonEndYear:2026,
   careerYearIndex:2,schoolYear:'Junior',phase:'preseason'};
 world.teams.forEach((team,t)=>{
   team.roster=Array.from({length:20},(_,i)=>{
     const career=t===0&&i===0;
     return{id:career?'fixture-career':'generated-'+t+'-'+i,
       firstName:'Synthetic',lastName:'Fixture',age:16,
       position:career?'RW':i===19?'G':i%3===0?'D':'RW',
       overall:career?72:60+i,potential:career?74:70,
       realPlayer:false,isCareerPlayer:career,
       development:{
         potential:career?68:70,attributeXP:{speed:62+i,passing:15},
         attributeUpgradeCounts:{speed:1}},
       highSchoolSeasonHistory:[
         {seasonStartYear:2023,regularSeasonStats:
           {gamesPlayed:28,points:5+i}},
         {seasonStartYear:2024,regularSeasonStats:
           {gamesPlayed:28,points:20+i}}
       ]};
   });
 });
 world.externalProspects=copy(real);
 world.persistence={careerId:id,recordId:key,revision:4,
   currentDate:'2025-09-04'};
 return world;
}
function snapshot(engine){
 const s=engine.state,roster=s.teams.flatMap(t=>t.roster);
 const p=roster.find(v=>v.isCareerPlayer);
 return{date:s.season.currentDate,
   seasonId:s.season.seasonId||s.season.id,
   year:s.season.careerYearIndex,schoolYear:s.season.schoolYear,
   phase:s.season.phase,rosterCount:roster.length,
   externalCount:s.externalProspects.length,
   playerId:p?.id,overall:p?.overall,rootPotential:p?.potential,
   developmentPotential:p?.development?.potential,
   savedSpeedXP:p?.development?.attributeXP?.speed,
   historyLength:p?.highSchoolSeasonHistory?.length};
}
async function run(){
 const fake=fakeIndexedDB();
 const sentinel={id:forbiddenKey,revision:444,world:{state:'PROTECTED'}};
 fake.addSentinel('projectice_database',forbiddenKey,sentinel);
 const trace=[];
 const runtime=createRuntime(fake,trace);
 assert.equal(runtime.real.length,191,'current curated prospect count');
 const fixture=buildWorld(runtime.engine,runtime.real);
 const saved={id:key,careerId:id,revision:4,
   savedAt:'2026-09-24T05:56:01Z',world:fixture};
 fake.addSentinel('projectice_database',key,saved);
 const original=copy(saved),originalSentinel=copy(sentinel);
 assert.equal(await runtime.engine.load(),true,
   'actual WorldEngine.load() must hydrate exact selected record');
 const after=snapshot(runtime.engine);
 assert.deepEqual(after,{
   date:'2025-09-04',seasonId:'hs-2025-2026',year:2,
   schoolYear:'Junior',phase:'preseason',rosterCount:160,
   externalCount:191,playerId:'fixture-career',overall:72,
   rootPotential:74,developmentPotential:68,savedSpeedXP:62,
   historyLength:2
 },'production boot must preserve entire career fingerprint');
 assert.deepEqual(fake.registry.get('projectice_database').records.get(key),
   original,'no accidental saved data change on normal boot');
 assert.deepEqual(fake.registry.get('projectice_database').records.get(forbiddenKey),
   originalSentinel,'another career remains untouched');
 const keys=[...local.keys()];
 assert.equal(keys.includes('projectice_pending_career_id_v1'),false,
   'cannot switch active career during load');
 // Reboot from the SAME isolated database. It must not rerun season
 // transitions, clear XP, lose prospects or alter the record.
 const again=createRuntime(fake,trace);
 assert.equal(await again.engine.load(),true,'repeat production boot');
 assert.deepEqual(snapshot(again.engine),after,
   'repeat boot must preserve season, real prospects and development');
 assert.deepEqual(fake.registry.get('projectice_database').records.get(key),
   original,'second boot must not overwrite saved data');
 // Finally execute an explicit ordinary save INSIDE THE SANDBOX ONLY.
 // Its revision must continue from 4 to 5 instead of restarting at 1.
 assert.equal(await again.engine.save(),true,'sandbox ordinary save');
 const persisted=fake.registry.get('projectice_database').records.get(key);
 assert.equal(persisted.revision,5,'revision must advance monotonically');
 assert.equal(persisted.world.season.careerYearIndex,2);
 assert.equal(persisted.world.teams.flatMap(t=>t.roster).length,160);
 assert.equal(persisted.world.externalProspects.length,191);
 assert.equal(persisted.world.teams[0].roster[0].development.attributeXP.speed,62);
 assert.deepEqual(fake.registry.get('projectice_database').records.get(forbiddenKey),
   originalSentinel,'unrelated career untouched after explicit sandbox save');
 assert.ok(fake.counters.opens.every(name=>name==='projectice_database'),
   'the fake adapter must be the only available database provider');
 console.log('PASS: actual production WorldEngine load twice + sandbox save; 160 roster, '+
   '191 external prospects, historical XP, season metadata, other-career isolation');
}
run().catch(e=>{console.error(e);process.exitCode=1;});