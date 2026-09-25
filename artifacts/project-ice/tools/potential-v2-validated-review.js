/* Offline-only historical identity gate: no live save writes. CLI output is PRIVATE. */
'use strict';
const fs=require('node:fs');
const {evaluateWorld}=require('./potential-v2-shadow');
const {calibrate}=require('./potential-v2-calibration');
const {playerReview}=require('./potential-v2-evidence-xp');
function provenance(p,history){
 // An incoming freshman has a new identity. No archived season may precede
 // that player's incoming class, even when recycled ages look plausible.
 const incomingYear=Number(String(p?.incomingClassSeasonId||'').match(/^hs-(\d{4})-/)?.[1]);
 if(p?.generatedIncomingFreshman===true && Number.isInteger(incomingYear) &&
   (history||[]).some(h=>Number.isInteger(Number(h?.seasonStartYear)) &&
     Number(h.seasonStartYear)<incomingYear))
  return{status:'quarantined',reason:'ARCHIVE_PREDATES_PLAYER_GENERATION'};
 const h=(history||[]).slice(-2);
 if(h.length!==2)return{status:'missing-archive',reason:'TWO_COMPLETED_SEASONS_REQUIRED'};
 const a=Number(h[0].age),b=Number(h[1].age),current=Number(p.age);
 const y0=Number(h[0].seasonStartYear),y1=Number(h[1].seasonStartYear);
 if(![a,b,current,y0,y1].every(Number.isFinite)||a<13||b<13||current<13||a>45||b>45||current>45)
  return{status:'quarantined',reason:'INVALID_SEASON_AGE_OR_YEAR'};
 if(y1!==y0+1)return{status:'quarantined',reason:'NONCONSECUTIVE_ARCHIVE_YEARS'};
 if(b!==a+1)return{status:'quarantined',reason:'HISTORICAL_AGE_DISCONTINUITY'};
 if(current<b||current>b+2)return{status:'quarantined',reason:'CURRENT_AGE_DISCONTINUITY'};
 return{status:'coherent',reason:'CHRONOLOGICAL_IDENTITY_COHERENCE'};
}
function validateWorld(world){
 const all=(world.teams||[]).flatMap(t=>t.roster||[]);
 const generated=all.filter(p=>p&&p.realPlayer!==true&&p.persistentProspect!==true);
 const flags=new Map();
 for(const p of generated){
  const full=(p.highSchoolSeasonHistory||[]).filter(h=>{
   const y=Number(h?.seasonStartYear);
   return Number.isInteger(y)&&String(y+1)+'-08-31'<=world.currentDate;
  }).sort((a,b)=>a.seasonStartYear-b.seasonStartYear);
  flags.set(String(p.id||p.playerId),provenance(p,full));
 }
 // Remove tainted history from a DISPOSABLE score-only clone, never the source.
 const isolated={...world,teams:world.teams.map(t=>({...t,roster:(t.roster||[]).map(p=>{
  const f=flags.get(String(p.id||p.playerId));
  return f?.status==='quarantined'?{...p,highSchoolSeasonHistory:[]}:p;
 })}))};
 const shadow=evaluateWorld(isolated),calibration=calibrate(isolated),evidence=playerReview(isolated);
 for(const r of shadow.rows){const f=flags.get(String(r.id));if(f?.status==='quarantined'){
  r.review='quarantined-age-identity';r.reasonCodes=[f.reason];r.historicalDataComplete=false;
 }}
 for(const r of calibration.rows){const f=flags.get(String(r.id));if(f?.status==='quarantined'){
  r.status='quarantined-age-identity';r.historyIntegrity=f.reason;
 }}
 for(const r of evidence.rows){const f=flags.get(String(r.id));if(f?.status==='quarantined'){
  r.review='quarantined-age-identity';r.historyIntegrity=f.reason;
  for(const s of r.scenarios){s.evidence={status:'withheld',breakoutEvidence:0,reasons:[f.reason]};s.pricePreviews=[];}
 }}
 const count=values=>values.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{});
 return{readOnly:true,version:'potential-v2-validated-review-v1',gameDate:world.currentDate,
  generatedCount:generated.length,
  integrity:count([...flags.values()].map(f=>f.reason)),
  shadowReviews:count(shadow.rows.map(r=>r.review)),
  calibrationStatuses:count(calibration.rows.map(r=>r.status)),
  evidenceStatuses:count(evidence.rows.flatMap(r=>r.scenarios.map(s=>s.evidence.status))),
  caveat:'Unreliable archived identity quarantined only in disposable scoring clone. No rating assignments.',
  players:generated.map(p=>{const id=String(p.id||p.playerId);return{id,name:p.firstName+' '+p.lastName,
   position:p.position,integrity:flags.get(id),shadow:shadow.rows.find(r=>String(r.id)===id),
   calibration:calibration.rows.find(r=>String(r.id)===id),
   evidence:evidence.rows.find(r=>String(r.id)===id)};})};
}
module.exports={provenance,validateWorld};
if(require.main===module){
 const [source,dest]=process.argv.slice(2);
 if(!source||!dest||source===dest)throw Error('Usage: node potential-v2-validated-review.js PRIVATE.json PRIVATE_REPORT.json');
 const backup=JSON.parse(fs.readFileSync(source,'utf8'));
 if(backup.format!=='projectice-career-backup'||backup.activeRecord?.id!=='career:'+backup.activeCareerId)
  throw Error('Invalid backup envelope');
 const result=validateWorld(backup.activeRecord.world);
 fs.writeFileSync(dest,JSON.stringify(result,null,2));
 const {players,...summary}=result;console.log(JSON.stringify(summary,null,2));
}
