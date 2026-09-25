/* Project Ice: PRIVATE snapshot WorldEngine boot verification.
 * Run locally, outside GitHub:
 *   node --max-old-space-size=4096 tools/potential-v2-private-world-boot.js "/private/career-backup.json"
 *
 * The file supplied by the user is NEVER written, uploaded or committed.
 * The unmodified production world.js and prospects.js are loaded in a VM
 * whose IndexedDB/localStorage are isolated in memory. Every request to the
 * normal projectice_database name is remapped to a disposable fake name.
 * WorldEngine.load() may auto-repair/save; all such writes stay inside the VM.
 * This tests world bootstrap, NOT game.js/UI/real Safari quota.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {fakeIndexedDB}=require('./potential-v2-fake-indexeddb');
const copy=x=>JSON.parse(JSON.stringify(x));
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const sourceWorld=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const sourceProspects=fs.readFileSync(path.join(__dirname,'../public/prospects.js'),'utf8');
const disposable='projectice_private_boot_disposable_fixture';
function createRuntime(fake,storage,events){
 const guarded={
   open(name,version){
     assert.equal(name,'projectice_database');
     return fake.indexedDB.open(disposable,version);
   },
   deleteDatabase(name){throw Error('Production WorldEngine attempted database deletion: '+name);}
 };
 const local={
   getItem:key=>storage.has(key)?storage.get(key):null,
   setItem:(key,value)=>storage.set(key,String(value)),
   removeItem:key=>storage.delete(key)
 };
 const ctx={indexedDB:guarded,localStorage:local,structuredClone,
   console:{log:()=>{},warn:(...x)=>events.push(['warn',String(x[0])]),
     error:(...x)=>events.push(['error',String(x[0])])},
   window:{},document:{},Date,Math,setTimeout,clearTimeout};
 vm.createContext(ctx);
 vm.runInContext(sourceProspects+'\n'+sourceWorld+
   '\nthis.bootEngine=WorldEngine;this.curated=REAL_PROSPECTS;',ctx,
   {filename:'isolated-private-world.js',timeout:30000});
 return{engine:ctx.bootEngine,curated:ctx.curated};
}
function summary(world){
 const roster=world.teams.flatMap(t=>t.roster||[]);
 const career=roster.filter(p=>p?.isCareerPlayer);
 const p=career[0];
 return{date:String(world.season?.currentDate||world.currentDate),
   seasonId:world.season?.seasonId||world.season?.id||null,
   schoolYear:world.season?.schoolYear||world.player?.schoolYear||null,
   careerYearIndex:world.season?.careerYearIndex??null,
   phase:world.season?.phase||null,teams:world.teams.length,
   roster:roster.length,external:world.externalProspects?.length,
   careerMarkers:career.length,playerId:p?.id||p?.playerId||null,
   overall:p?.overall,potentialRoot:p?.potential,
   potentialDevelopment:p?.development?.potential,
   attributeXP:copy(p?.development?.attributeXP||{}),
   history:copy(p?.highSchoolSeasonHistory||[]),
   schedule:world.schedule?.length??null,
   seasonProcessedDates:copy(world.season?.processedDates||[])};
}
function stableEqual(a,b){
 const k=['date','seasonId','schoolYear','careerYearIndex','phase','teams',
   'roster','careerMarkers','playerId','overall','potentialRoot',
   'potentialDevelopment','attributeXP','history','seasonProcessedDates'];
 for(const name of k)assert.deepEqual(a[name],b[name],
   'Unexpected WorldEngine boot change: '+name);
}
async function verify(filename){
 if(!filename||!fs.existsSync(filename))throw Error('Give an existing PRIVATE JSON backup path.');
 const originalBytes=fs.readFileSync(filename);
 const beforeHash=sha(originalBytes);
 const envelope=JSON.parse(originalBytes.toString('utf8'));
 assert.equal(envelope.format,'projectice-career-backup');
 assert.equal(envelope.version,1);
 const id=envelope.activeCareerId;
 assert.equal(envelope.activeRecord?.id,'career:'+id);
 assert.equal(envelope.activeRecord?.careerId,id);
 const original=envelope.activeRecord;
 const baseline=summary(original.world);
 assert.equal(baseline.careerMarkers,1,'backup career identity must be unambiguous');
 assert.ok(baseline.teams>0&&baseline.roster>0);
 const fake=fakeIndexedDB();
 const canary={id:'career:NEVER_TOUCH_REAL',revision:999,
   world:{sentinel:'protected'}};
 fake.addSentinel('projectice_database',canary.id,canary);
 fake.addSentinel(disposable,original.id,original);
 const local=new Map([['projectice_active_career_id_v1',id]]);
 const events=[];
 const runtime=createRuntime(fake,local,events);
 const curatedCount=runtime.curated.length;
 const first=await runtime.engine.load();
 assert.equal(first,true,'real WorldEngine.load() could not hydrate backup');
 let current=summary(runtime.engine.state);
 stableEqual(baseline,current);
 assert.equal(runtime.engine.getCareerPlayer()?.id,baseline.playerId);
 assert.equal(runtime.engine.getTeamById(runtime.engine.state.teams[0].teamId)
   ?.teamId,runtime.engine.state.teams[0].teamId);
 let stored=fake.registry.get(disposable).records.get(original.id);
 const afterFirst=copy(stored);
 const autoSave=stored.revision!==original.revision;
 // A second clean app instance must see exactly the first boot's sandbox
 // persistence. Automatic repair writes are reported rather than ignored.
 const secondRuntime=createRuntime(fake,local,events);
 assert.equal(await secondRuntime.engine.load(),true,'second world boot failed');
 const second=summary(secondRuntime.engine.state);
 stableEqual(current,second);
 assert.deepEqual(fake.registry.get(disposable).records.get(original.id),
   afterFirst,'second boot unexpectedly mutated the persistent record');
 assert.deepEqual(fake.registry.get('projectice_database')
   .records.get(canary.id),canary,'actual-name sentinel modified');
 assert.deepEqual(local.get('projectice_active_career_id_v1'),id);
 const afterHash=sha(fs.readFileSync(filename));
 assert.equal(afterHash,beforeHash,'PRIVATE backup bytes changed');
 assert.ok(fake.counters.opens.every(n=>n===disposable),
   'WorldEngine escaped the injected disposable database');
 return{status:'PASS',readOnly:true,sourceSHA256:beforeHash,
   sourceFileUnmodified:true,gameDate:current.date,season:current.seasonId,
   classLevel:current.schoolYear,playerOVR:current.overall,
   potentialConflict:current.potentialRoot!==current.potentialDevelopment,
   roster:current.roster,externalSaved:baseline.external,
   externalAfterBoot:current.external,curatedCount,schedule:current.schedule,
   bootAutosaveDetected:autoSave,sourceRevision:original.revision,
   firstBootRevision:stored.revision,secondBootRevision:
     fake.registry.get(disposable).records.get(original.id).revision,
   realDBCanaryUnchanged:true,gameJSBootNotTested:true,
   realSafariStorageNotTested:true,readOnlyInput:true,
   warnings:events.filter(x=>x[0]!=='log').slice(0,12)};
}
module.exports={verify,summary,createRuntime};
if(require.main===module){
 verify(process.argv[2]).then(result=>console.log(JSON.stringify(result,null,2)))
 .catch(e=>{console.error('NOT VERIFIED: '+(e?.stack||String(e)));process.exitCode=1;});
}
