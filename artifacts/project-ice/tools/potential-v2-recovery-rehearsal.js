/* Project Ice Recovery v2 — ISOLATED TRANSACTION REHEARSAL ONLY.
 * Explicitly NOT imported by the live game. The store is an injected fake
 * transactional adapter; this module cannot open browser IndexedDB, write
 * localStorage, or replace a real saved career.
 *
 * Recovery contract, to be implemented later behind explicit confirmation:
 *  1. Re-read live record and reject unexpected live mutations.
 *  2. Atomically journal its COMPLETE rollback snapshot + candidate record.
 *  3. Verify read-back and boot the candidate against real load contracts.
 *  4. If boot fails, compare-and-swap rollback WITHOUT destroying new progress.
 *  5. Retain rollback journal until the restored game has passed device checks.
 */
'use strict';
const {isDeepStrictEqual}=require('node:util');
const clone=x=>structuredClone(x);
function inspect(record) {
 const w=record?.world;
 const roster=Array.isArray(w?.teams)?
   w.teams.flatMap(t=>Array.isArray(t.roster)?t.roster:[]):[];
 const career=roster.filter(p=>p?.isCareerPlayer===true);
 return {id:record?.id,careerId:record?.careerId,
   revision:record?.revision,date:w?.season?.currentDate||w?.currentDate,
   seasonId:w?.season?.seasonId||w?.season?.id,
   playerId:career[0]?.id||career[0]?.playerId||null,
   careerPlayers:career.length,rosterCount:roster.length,
   externalCount:Array.isArray(w?.externalProspects)?w.externalProspects.length:null};
}
function planRecovery({backup,live,activeCareerId,confirmation=false,
 fullRecordVerified=false,rollbackExportVerified=false,allowOlderDate=false}={}) {
 const reject=(reason,details={})=>({status:'BLOCKED',reason,readOnly:true,...details});
 const original=backup?.activeRecord;
 const now=inspect(live),incoming=inspect(original);
 const id=String(activeCareerId||'');
 if(backup?.format!=='projectice-career-backup'||backup.version!==1||
   !id||backup.activeCareerId!==id||original?.id!=='career:'+id||
   original?.careerId!==id)return reject('INVALID_BACKUP_OR_CAREER');
 if(now.id!=='career:'+id||now.careerId!==id)
   return reject('LIVE_CAREER_MISMATCH');
 for(const val of [now,incoming]){
   if(val.careerPlayers!==1||!val.playerId||val.rosterCount===0||
     val.externalCount===null||!/^\d{4}-\d{2}-\d{2}$/.test(val.date||'')||
     !val.seasonId||!Number.isSafeInteger(val.revision)||val.revision<0)
     return reject('INCOMPLETE_WORLD_OR_REVISION',{incoming,live:now});
 }
 if(now.playerId!==incoming.playerId)
   return reject('DIFFERENT_CAREER_PLAYER',{incoming,live:now});
 const gameplayRollback=incoming.date<now.date;
 if(gameplayRollback&&!allowOlderDate)
   return reject('BACKUP_OLDER_THAN_CURRENT_GAME_DATE',{incoming,live:now});
 if(!confirmation||!fullRecordVerified||!rollbackExportVerified)
   return reject('EXPLICIT_CONFIRMATION_AND_VERIFIED_ROLLBACK_REQUIRED',{
     missing:{confirmation:!confirmation,fullRecordVerified:!fullRecordVerified,
       rollbackExportVerified:!rollbackExportVerified},incoming,live:now});
 const newerLiveTimestamp=Date.parse(live?.savedAt||'')>
   Date.parse(original?.savedAt||'');
 const revisionReset=newerLiveTimestamp&&now.revision<incoming.revision;
 const nextRevision=Math.max(now.revision,incoming.revision)+1;
 const candidate=clone(original);
 candidate.revision=nextRevision;
 candidate.savedAt='RECOVERY_REHEARSAL_ONLY';
 candidate.world.persistence={
   ...(candidate.world.persistence||{}),
   careerId:id,recordId:'career:'+id,revision:nextRevision,
   currentDate:incoming.date
 };
 const baseline=clone(live);
 return {status:'READY_FOR_ISOLATED_REHEARSAL',readOnly:true,
   mayWriteLive:false,activeCareerId:id,liveRevision:now.revision,
   candidateRevision:nextRevision,revisionReset,gameplayRollback,
   incoming,live:now,baseline,candidate};
}
async function simulateAtomicRecovery(plan,adapter,{bootCandidate}={}) {
 if(plan?.status!=='READY_FOR_ISOLATED_REHEARSAL'||!adapter||
   typeof adapter.atomic!=='function'||typeof adapter.get!=='function'||
   typeof bootCandidate!=='function')
   throw Error('Missing reviewed plan, fake transactional adapter or boot checker.');
 const key='career:'+plan.activeCareerId;
 const rollbackKey='recovery-test-rollback:'+plan.activeCareerId;
 const journalKey='recovery-test-journal:'+plan.activeCareerId;
 const result={status:'NOT_STARTED',readOnly:true,
   productionRestoreAvailable:false,rollbackVerified:false};
 const savedBefore=await adapter.get(key);
 if(!isDeepStrictEqual(savedBefore,plan.baseline)) {
   result.status='STALE_LIVE_STATE';
   return result;
 }
 try {
   await adapter.atomic(tx=>{
     if(!isDeepStrictEqual(tx.get(key),plan.baseline))
       throw Error('CONCURRENT_LIVE_MUTATION');
     if(tx.get(rollbackKey)||tx.get(journalKey))
       throw Error('UNRESOLVED_RECOVERY_JOURNAL');
     tx.put(rollbackKey,clone(plan.baseline));
     tx.put(key,clone(plan.candidate));
     tx.put(journalKey,{id:journalKey,state:'PENDING_BOOT',
       rollbackKey,careerId:plan.activeCareerId,
       originalRevision:plan.liveRevision,
       candidateRevision:plan.candidateRevision});
   });
 } catch(e) {
   /*
    * A lost acknowledgment after commit is NOT proof of an abort. Re-read
    * all three records before deciding. A fully committed transaction may
    * still be recoverable, while partial/unknown state must stop safely.
    */
   const after=await adapter.get(key);
   const backup=await adapter.get(rollbackKey);
   const journal=await adapter.get(journalKey);
   if(!isDeepStrictEqual(after,plan.candidate)||
      !isDeepStrictEqual(backup,plan.baseline)||
      journal?.state!=='PENDING_BOOT'){
     result.status=isDeepStrictEqual(after,plan.baseline)&&
       backup===null&&journal===null?
         'TRANSACTION_ABORTED':'INDETERMINATE_STOP';
     result.reason=String(e?.message||e);
     return result;
   }
   result.commitAcknowledgmentLost=true;
 }
 const staged=await adapter.get(key);
 const retained=await adapter.get(rollbackKey);
 const journal=await adapter.get(journalKey);
 const roundTrip=isDeepStrictEqual(staged,plan.candidate)&&
   isDeepStrictEqual(retained,plan.baseline)&&journal?.state==='PENDING_BOOT';
 let boot=false;
 if(roundTrip) {
   try {boot=await bootCandidate(clone(staged))===true;}
   catch(_) {boot=false;}
 }
 if(!roundTrip||!boot) {
   try {
     await adapter.atomic(tx=>{
       if(!isDeepStrictEqual(tx.get(key),plan.candidate)||
         !isDeepStrictEqual(tx.get(rollbackKey),plan.baseline))
         throw Error('REFUSE_ROLLBACK_OVER_NEW_GAME_PROGRESS');
       tx.put(key,clone(plan.baseline));
       tx.put(journalKey,{...tx.get(journalKey),state:'ROLLED_BACK'});
     });
     result.rollbackVerified=isDeepStrictEqual(await adapter.get(key),
       plan.baseline);
     result.status=result.rollbackVerified?'BOOT_FAILED_ROLLED_BACK':
       'ROLLBACK_NOT_VERIFIED';
   }catch(e){
     result.status='ROLLBACK_BLOCKED_SAVE_CHANGED';
     result.reason=String(e?.message||e);
   }
   return result;
 }
 result.status='STAGED_BOOT_VERIFIED_IN_FAKE_DB';
 result.rollbackVerified=isDeepStrictEqual(retained,plan.baseline);
 result.journalRetained=true;
 return result;
}
function createMemoryTransactionAdapter(initial={}) {
 /* Test-only fully atomic copy-on-write adapter. Never connect this to the
  * browser's actual projectice_database. */
 let records=new Map(Object.entries(initial).map(([k,v])=>[k,clone(v)]));
 let fault=null;
 return {
   injectFault(kind){fault=kind;},
   async get(k){const v=records.get(k);return v===undefined?null:clone(v);},
   async atomic(fn){
     const staged=new Map([...records.entries()].map(([k,v])=>[k,clone(v)]));
     const tx={get:k=>staged.has(k)?clone(staged.get(k)):null,
       put:(k,v)=>staged.set(k,clone(v))};
     if(fault==='BEFORE') {fault=null;throw Error('INJECTED_BEFORE');}
     fn(tx);
     if(fault==='BEFORE_COMMIT') {fault=null;throw Error('INJECTED_BEFORE_COMMIT');}
     records=staged;
     if(fault==='AFTER_COMMIT') {fault=null;throw Error('INJECTED_AFTER_COMMIT');}
   }
 };
}
module.exports={inspect,planRecovery,simulateAtomicRecovery,
 createMemoryTransactionAdapter};
