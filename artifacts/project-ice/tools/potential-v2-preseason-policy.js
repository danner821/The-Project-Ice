/* OFFLINE READ-ONLY Potential V2 baseline gate. No numerical migrations.
 * Run: node tools/potential-v2-preseason-policy.js PRIVATE_BACKUP.json
 * PRIVATE OUTPUT: keep away from GitHub and hosting.
 */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
function inspect(backup){
 if(backup?.format!=='projectice-career-backup'||backup.version!==1||
   backup.activeRecord?.id!=='career:'+backup.activeCareerId||
   !Array.isArray(backup.activeRecord?.world?.teams))
   throw Error('Invalid backup envelope');
 const world=backup.activeRecord.world,roster=world.teams.flatMap(t=>t.roster||[]);
 const ids=new Set();
 const rows=roster.map(p=>{
  const id=String(p.id||p.playerId||'');
  if(!id||ids.has(id))throw Error('Missing/duplicate roster identity');
  ids.add(id);
  const y=Number(String(p.incomingClassSeasonId||'').match(/^hs-(\d{4})-/)?.[1]);
  const contaminated=p.generatedIncomingFreshman===true&&
   (p.highSchoolSeasonHistory||[]).some(h=>!Number.isInteger(y)||
     !Number.isInteger(Number(h?.seasonStartYear))||Number(h.seasonStartYear)<y);
  const real=p.realPlayer===true||p.persistentProspect===true;
  const root=p.potential,nested=p.development?.potential;
  let status,reason;
  if(real){status='preserve-real';reason='REAL_PLAYER_NOT_MIGRATION_ELIGIBLE';}
  else if(contaminated){status='quarantine';reason='ARCHIVE_PREDATES_PLAYER_GENERATION';}
  else if(!Number.isInteger(root)||!Number.isInteger(nested)||root<25||root>99||nested<25||nested>99){
   status='review';reason='MISSING_OR_INVALID_POTENTIAL';
  }else if(root!==nested){status='review';reason='ROOT_DEVELOPMENT_CONFLICT';}
  else{status='preserve';reason='NO_APPROVED_REASON_TO_RESEED';}
  return{id,status,reason,currentRoot:root,currentDevelopment:nested,
   weeklyStatus:status==='preserve'?'await-current-season-evidence':'withheld'};
 });
 const counts=rows.reduce((o,r)=>(o[r.status]=(o[r.status]||0)+1,o),{});
 const dirty=rows.filter(r=>r.status==='review');
 return{readOnly:true,approvedRatingChanges:0,baseline:{careerId:backup.activeCareerId,
  revision:backup.activeRecord.revision,gameDate:world.currentDate,
  season:world.currentSeason,rosterCount:roster.length},counts,
  reviewedSeedCandidates:dirty,
  withheldPlayers:rows.filter(r=>r.status==='quarantine').length,
  rule:'Never choose 68 vs 74 from old field order. Freeze pre-generation archives; do not silently alter current potentials. Weekly evidence uses current-season games and clean same-level peers.'};
}
module.exports={inspect};
if(require.main===module){
 const input=process.argv[2];if(!input)throw Error('Usage: node potential-v2-preseason-policy.js PRIVATE_BACKUP.json');
 const bytes=fs.readFileSync(input),backup=JSON.parse(bytes);
 const report=inspect(backup);
 console.log(JSON.stringify({...report,privateBackupSha256:crypto.createHash('sha256').update(bytes).digest('hex')},null,2));
}
