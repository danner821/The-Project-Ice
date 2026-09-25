/* Offline-only private-backup migration sensitivity smoke.
 * Targets are HYPOTHETICAL and never approved or suitable for live writes.
 * Usage: node --max-old-space-size=4096 tools/potential-v2-private-migration-audit.js PRIVATE.json
 * Source backup is read only. No career data is committed or exported.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const {rehearsal}=require('./potential-v2-migration-rehearsal');
const file=process.argv[2];
if(!file||!fs.existsSync(file))throw Error('Provide a private backup JSON pathname');
const input=fs.readFileSync(file),sha=crypto.createHash('sha256').update(input).digest('hex');
const backup=JSON.parse(input),world=backup.activeRecord?.world;
const roster=(world?.teams||[]).flatMap(t=>t.roster||[]);
const career=roster.filter(p=>p.isCareerPlayer===true);
assert.equal(career.length,1,'one canonical roster career player required');
const p=career[0],id=p.id;
assert.equal(world.player?.playerId||world.player?.id,id,'root career mirror identity');
assert(Number.isInteger(p.potential)&&Number.isInteger(p.development?.potential));
const allowedRoster=/^(potential|potentialRole|potentialConfidence|potentialAccuracy|potentialTrend|development\.(potential|potentialRole|potentialConfidence|potentialAccuracy|potentialTrend|potentialHistory))$/;
const allowedRoot=/^(potential|potentialRole|potentialConfidence|potentialAccuracy|potentialTrend|development\.(potential|potentialRole|potentialConfidence|potentialAccuracy|potentialTrend|potentialHistory))$/;
function exactDiff(a,b){
 const changes=[],stack=[[a,b,'']];
 while(stack.length){
  const [left,right,path]=stack.pop();
  if(left===right)continue;
  if(left&&right&&typeof left==='object'&&typeof right==='object'&&
     Array.isArray(left)===Array.isArray(right)){
   if(Array.isArray(left)&&left.length!==right.length){
    assert(path.endsWith('development.potentialHistory')&&right.length===left.length+1,
      'unexpected array size: '+path);
    changes.push(path);continue;
   }
   for(const k of new Set([...Object.keys(left),...Object.keys(right)]))
     stack.push([left[k],right[k],path+(path?'.':'')+k]);
  }else changes.push(path);
 }
 return changes.sort();
}
const originalHash=crypto.createHash('sha256').update(JSON.stringify(world)).digest('hex');
const tests=[];
for(const target of [p.potential,Math.min(95,Math.max(p.potential,p.development.potential)+5)]){
 const result=rehearsal(backup,{expectedCareerId:backup.activeCareerId,
   expectedDate:world.currentDate,expectedRevision:backup.activeRecord.revision,
   players:[{id,fromRoot:p.potential,fromDevelopment:p.development.potential,
     to:target,reason:'HYPOTHETICAL OFFLINE TEST ONLY; NOT APPROVED',
     reviewed:true}]});
 assert(result.readOnly===true&&result.approvedForLive===false);
 const migrated=result.previewWorld;
 const next=migrated.teams.flatMap(t=>t.roster||[]).find(x=>x.id===id);
 const oldHistory=p.development?.potentialHistory||[],newHistory=next.development?.potentialHistory||[];
 assert.deepEqual(newHistory.slice(0,oldHistory.length),oldHistory);
 assert.equal(newHistory.length,oldHistory.length+1);
 assert.equal(next.potential,target);
 assert.equal(next.development.potential,target);
 assert.equal(next.potentialRole,next.development.potentialRole);
 assert.equal(next.potentialConfidence,55);
 assert.equal(next.development.potentialConfidence,55);
 assert.equal(next.potentialAccuracy,'Medium');
 assert.equal(next.development.potentialAccuracy,'Medium');
 assert.equal(next.potentialTrend,next.development.potentialTrend);
 assert.equal(migrated.player.potential,target);
 const changes=exactDiff(world,migrated);
 const rootChanges=changes.filter(path=>path.startsWith('player.'));
 const rosterChanges=changes.filter(path=>path.startsWith('teams.'));
 for(const path of rootChanges)
   assert(allowedRoot.test(path.slice('player.'.length)),'unapproved root change: '+path);
 for(const path of rosterChanges){
   const m=path.match(/^teams\.(\d+)\.roster\.(\d+)\.(.*)$/);
   assert(m&&allowedRoster.test(m[3]),'unapproved field: '+path);
   assert.equal(world.teams[Number(m[1])].roster[Number(m[2])].id,id,
      'unapproved roster player change');
 }
 assert.equal(changes.length,rootChanges.length+rosterChanges.length,
   'unexpected non-potential field change');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(world)).digest('hex'),
   originalHash,'original runtime world mutated');
 tests.push({hypotheticalTarget:target,changedLeafCount:changes.length,changedPaths:changes,
    rosterCount:roster.length,revision:backup.activeRecord.revision});
}
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
 sha,'source backup changed');
console.log(JSON.stringify({status:'PASS',privateBaselineSha256:sha,
 caution:'hypothetical clone-only scenarios; never live-approved',tests},null,2));
