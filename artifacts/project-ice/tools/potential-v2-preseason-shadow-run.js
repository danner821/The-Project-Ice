/* Offline exact-backup weekly rehearsal. Zero writes to game, backup or DB.
 * Run: node tools/potential-v2-preseason-shadow-run.js PRIVATE_BACKUP.json
 */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const {inspect}=require('./potential-v2-preseason-policy');
const {evaluate}=require('./potential-v2-weekly-shadow');
function run(backup){
 const seed=inspect(backup),world=backup.activeRecord.world;
 const roster=world.teams.flatMap(t=>t.roster||[]);
 const status=new Map();
 for(const p of roster){
  const info=seed.reviewedSeedCandidates.find(r=>r.id===String(p.id||p.playerId));
  const y=Number(String(p.incomingClassSeasonId||'').match(/^hs-(\d{4})-/)?.[1]);
  const contaminated=p.generatedIncomingFreshman===true&&
   (p.highSchoolSeasonHistory||[]).some(h=>!Number.isInteger(y)||
     !Number.isInteger(Number(h?.seasonStartYear))||Number(h.seasonStartYear)<y);
  const key=String(p.id||p.playerId);
  status.set(key,p.realPlayer||p.persistentProspect?'real':contaminated?'quarantine':info?'review':'preserve');
 }
 const peers=roster.filter(p=>status.get(String(p.id||p.playerId))==='preserve')
  .map(p=>({...p,leagueLevel:p.leagueLevel||'HS'}));
 const counts={},proposals=[];
 for(const p of roster){
  const id=String(p.id||p.playerId),s=status.get(id);
  if(s!=='preserve'){
   const reason=s==='quarantine'?'INHERITED_ARCHIVE_BLOCKED':s==='real'?'REAL_PLAYER_NOT_ELIGIBLE':'UNRESOLVED_BASELINE';
   counts[reason]=(counts[reason]||0)+1;continue;
  }
  const assessment=evaluate({player:{...p,leagueLevel:p.leagueLevel||'HS'},peers,
   seasonId:world.season?.seasonId||'hs-'+world.currentSeason.replace('-','-20'),
   weekKey:'preseason:'+world.currentDate,weekNumber:world.currentWeek||1,
   observedGames:0});
  const key=assessment.reason||assessment.status;
  counts[key]=(counts[key]||0)+1;
  if(assessment.changeProposed)proposals.push({id,proposal:assessment.proposedPotential});
 }
 return{readOnly:true,baseline:seed.baseline,seedCounts:seed.counts,
  weeklyOutcomes:counts,proposals,allRosterPlayersCounted:Object.values(counts).reduce((a,b)=>a+b,0)};
}
module.exports={run};
if(require.main===module){
 const name=process.argv[2];if(!name)throw Error('Provide private backup');
 const source=fs.readFileSync(name),before=crypto.createHash('sha256').update(source).digest('hex');
 const report=run(JSON.parse(source));
 const after=crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');
 if(before!==after||report.allRosterPlayersCounted!==report.baseline.rosterCount||report.proposals.length)
   throw Error('Unexpected backup mutation/count/automatic rerating');
 console.log(JSON.stringify({...report,privateBackupSha256:after},null,2));
}
