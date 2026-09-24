'use strict';
const assert=require('node:assert/strict');
const {preview}=require('./potential-v2-restore-guard');
const id='c1',wid='career:'+id;
function r(revision=4,date='2025-09-04',opts={}){
 const p={id:'career-player',isCareerPlayer:true,overall:opts.overall||72};
 return{id:opts.id||wid,careerId:opts.careerId||id,revision,
   savedAt:opts.savedAt||'2026-09-24T01:00:00Z',
   world:{currentDate:date,season:{seasonId:opts.seasonId||'hs-2025-2026'},
     teams:[{roster:[p]}],externalProspects:[{}]}};
}
const backup={format:'projectice-career-backup',version:1,
 activeCareerId:id,activeRecord:r()};
const original=JSON.stringify(backup),current=r();
let x=preview(backup,current,id);
assert.equal(x.status,'PREVIEW_ONLY');
assert.equal(x.readOnly,true);
assert.equal(x.restorePerformed,false);
assert.equal(x.writeAuthorized,false);
assert.equal(x.wouldDiscardNewerProgress,false);
assert.equal(JSON.stringify(backup),original);
assert.equal(preview(backup,r(5),id).action,'STOP_AND_BACK_UP_CURRENT_LIVE_CAREER');
assert.equal(preview(backup,r(4,'2025-09-05'),id).wouldDiscardNewerProgress,true);
const resetLive=r(2,'2025-09-04',{savedAt:'2026-09-24T22:29:06Z'});
const olderExport={...backup,activeRecord:{
 ...backup.activeRecord,savedAt:'2026-09-24T05:56:01Z'
}};
const reset=preview(olderExport,resetLive,id);
assert.equal(reset.revisionResetDetected,true,
 'a later same-date save can have a smaller revision after the old bug');
assert.equal(reset.wouldDiscardNewerProgress,true,
 'recovery must protect later saved data despite lower revision');
assert.equal(reset.action,'STOP_AND_BACK_UP_CURRENT_LIVE_CAREER');
const earlierSameRevision=r(4,'2025-09-04',{savedAt:'2026-09-24T05:00:00Z'});
assert.equal(preview(olderExport,earlierSameRevision,id).revisionResetDetected,false,
 'older timestamp with same revision is not a revision reset');

assert.equal(preview(backup,r(4,'2025-09-04',{overall:74}),id).divergentSameDate,true);
const oldAlias=r();oldAlias.world.season.id=oldAlias.world.season.seasonId;
delete oldAlias.world.season.seasonId;
assert.equal(preview(backup,oldAlias,id).status,'PREVIEW_ONLY',
 'season.id must work for complete legacy backups with missing seasonId');
assert.equal(preview(backup,r(4,'2025-09-04',{seasonId:'other'}),id).divergentSameDate,true);
assert.equal(preview({...backup,activeCareerId:'not-c1'},current,id).status,'BLOCKED');
assert.equal(preview({...backup,activeRecord:r(4,'2025-09-04',{id:'career:c2'})},current,id).status,'BLOCKED');
assert.equal(preview(backup,r(4,'2025-09-04',{id:'career:c2'}),id).status,'BLOCKED');
assert.equal(preview(backup,r(4,'2025-09-04',{careerId:'c2'}),id).status,'BLOCKED');
const empty=r();empty.world.teams[0].roster=[];
assert.equal(preview(backup,empty,id).status,'BLOCKED');
const missingRevision=r();delete missingRevision.revision;
assert.equal(preview(backup,missingRevision,id).status,'BLOCKED');
assert.equal(JSON.stringify(current),JSON.stringify(r()),'never mutate live');
console.log('PASS: 15 non-destructive restore-preflight assertions');
