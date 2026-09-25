'use strict';
/* Synthetic-only regression for the optional private-file loader.
 * Execute from the repository: node tools/potential-v2-private-world-boot.test.js
 * Never use or commit a real career file.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {verify}=require('./potential-v2-private-world-boot');
const sourceWorld=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const sourceProspects=fs.readFileSync(path.join(__dirname,'../public/prospects.js'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const sandbox={indexedDB:{},localStorage:{getItem:()=>null,
   setItem(){},removeItem(){}},structuredClone:clone,
   console:{log(){},warn(){},error(){}},window:{},document:{},
   Date,Math,setTimeout,clearTimeout};
 vm.createContext(sandbox);
 vm.runInContext(sourceProspects+'\n'+sourceWorld+
   '\nthis.world=WorldEngine.state;this.prospects=REAL_PROSPECTS;',
   sandbox,{timeout:30000});
 const w=clone(sandbox.world);
 w.currentDate='2025-09-04';
 w.player={id:'fixture-player',playerId:'fixture-player',
   schoolYear:'Junior',currentDate:'2025-09-04'};
 w.season={id:'hs-2025-2026',seasonId:'hs-2025-2026',
   currentDate:'2025-09-04',seasonStartYear:2025,seasonEndYear:2026,
   schoolYear:'Junior',careerYearIndex:2,phase:'preseason'};
 w.teams.forEach((t,ti)=>t.roster=Array.from({length:20},(_,i)=>({
   id:ti===0&&i===0?'fixture-player':'generated-'+ti+'-'+i,
   isCareerPlayer:ti===0&&i===0,age:16,position:'RW',
   overall:72,potential:74,
   development:{potential:68,attributeXP:{speed:62}},
   highSchoolSeasonHistory:[{seasonStartYear:2023},{seasonStartYear:2024}]
 })));
 w.externalProspects=clone(sandbox.prospects);
 w.persistence={recordId:'career:synthetic',careerId:'synthetic',
   revision:4,currentDate:'2025-09-04'};
 return{format:'projectice-career-backup',version:1,
   activeCareerId:'synthetic',activeRecord:{id:'career:synthetic',
     careerId:'synthetic',revision:4,savedAt:'2026-09-24T05:56:01Z',
     world:w}};
}
async function run(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'projectice-private-boot-'));
 const file=path.join(dir,'synthetic-only.json');
 try{
   const backup=fixture();
   fs.writeFileSync(file,JSON.stringify(backup));
   const before=fs.readFileSync(file);
   const result=await verify(file);
   assert.equal(result.status,'PASS');
   assert.equal(result.sourceFileUnmodified,true);
   assert.equal(result.gameDate,'2025-09-04');
   assert.equal(result.season,'hs-2025-2026');
   assert.equal(result.roster,160);
   assert.equal(result.externalSaved,191);
   assert.equal(result.externalAfterBoot,191);
   assert.equal(result.potentialConflict,true);
   assert.equal(result.sourceRevision,4);
   assert.equal(result.firstBootRevision,4);
   assert.equal(result.secondBootRevision,4);
   assert.equal(result.realDBCanaryUnchanged,true);
   assert.equal(result.gameJSBootNotTested,true);
   assert.equal(Buffer.compare(fs.readFileSync(file),before),0,
     'original bytes must remain unchanged');
   backup.activeRecord.id='career:wrong';
   fs.writeFileSync(file,JSON.stringify(backup));
   await assert.rejects(verify(file),'wrong active career record must fail');
   backup.activeRecord.id='career:synthetic';
   delete backup.activeRecord.world.season;
   fs.writeFileSync(file,JSON.stringify(backup));
   await assert.rejects(verify(file),
     'incomplete/legacy career season must not falsely pass');
   console.log('PASS: optional private snapshot test, double WorldEngine boot, '+ 
     'wrong-career rejection, protected file, 160 roster and 191 real prospects');
 }finally{
   fs.rmSync(dir,{recursive:true,force:true});
 }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
