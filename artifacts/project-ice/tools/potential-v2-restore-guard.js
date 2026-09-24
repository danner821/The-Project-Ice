/* Project Ice: OFFLINE restoration preflight ONLY.
 * Explicitly refuses to mutate IndexedDB, browser storage, user saves, or JSON.
 * Expects the same envelope exported by Save Trace. Used to design a future
 * user-confirmed restore flow; a PASS here never performs a restore.
 */
'use strict';
const fail=(reason,details={})=>({status:'BLOCKED',readOnly:true,reason,...details});
const isoDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?String(x):null;
function core(world){
 const season=world?.season||{};
 const roster=Array.isArray(world?.teams)?
   world.teams.flatMap(team=>Array.isArray(team?.roster)?team.roster:[]):[];
 const careers=roster.filter(p=>p?.isCareerPlayer===true);
 return {date:isoDate(world?.currentDate||season.currentDate),
   seasonId:String(season.seasonId||season.id||''),rosterCount:roster.length,
   realProspectCount:Array.isArray(world?.externalProspects)?world.externalProspects.length:null,
   careerPlayers:careers.length,careerPlayerId:careers[0]?.id||careers[0]?.playerId||null,
   overall:careers[0]?.overall??null};
}
function preview(backup,liveRecord,activeCareerId){
 const active=String(activeCareerId||'');
 if(!active||!backup||backup.format!=='projectice-career-backup'||backup.version!==1)
   return fail('INVALID_ENVELOPE_OR_ACTIVE_CAREER');
 const targetId='career:'+active;
 if(backup.activeCareerId!==active||backup.activeRecord?.id!==targetId||
    backup.activeRecord?.careerId!==active)return fail('BACKUP_CAREER_ID_MISMATCH');
 if(!liveRecord||liveRecord.id!==targetId||liveRecord.careerId!==active)
   return fail('LIVE_CAREER_ID_MISMATCH');
 const older=backup.activeRecord,live=liveRecord;
 const source=core(older.world),current=core(live.world);
 if(!source.date||!current.date||!source.seasonId||!current.seasonId||
    source.careerPlayers!==1||current.careerPlayers!==1||
    !source.careerPlayerId||!current.careerPlayerId||
    source.careerPlayerId!==current.careerPlayerId||
    source.rosterCount<=0||current.rosterCount<=0||
    source.realProspectCount===null||current.realProspectCount===null)
   return fail('INVALID_OR_MISMATCHED_WORLD_IDENTITIES',{backup:source,live:current});
 const oldRevision=Number(older.revision),liveRevision=Number(live.revision);
 if(!Number.isSafeInteger(oldRevision)||!Number.isSafeInteger(liveRevision)||
    oldRevision<0||liveRevision<0)
   return fail('MISSING_REVISION',{backup:source,live:current});
 const newer=liveRevision>oldRevision||current.date>source.date;
 const rollback=source.date<current.date;
 const divergent=source.date===current.date&&
   (oldRevision!==liveRevision||source.seasonId!==current.seasonId||
    source.overall!==current.overall);
 const warning=newer?
    'Live progress is newer. A production restore would discard progress; first export and verify a NEW live backup.':
   'Any production restore requires explicit user confirmation and an independently verified rollback backup.';
 return {status:'PREVIEW_ONLY',readOnly:true,restorePerformed:false,writeAuthorized:false,
   candidateId:targetId,backup:source,live:current,
   backupRevision:oldRevision,liveRevision,
   wouldDiscardNewerProgress:newer,olderGameDate:rollback,
   divergentSameDate:divergent,
   action:newer?'STOP_AND_BACK_UP_CURRENT_LIVE_CAREER':'REVIEW_BEFORE_ANY_RESTORE',
   warning};
}
module.exports={core,preview};
