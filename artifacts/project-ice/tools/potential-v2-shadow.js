/* Project Ice Potential 2.0: READ-ONLY shadow evaluator.
 * Runs only when invoked explicitly by a developer. Never loaded by the game.
 * No save writing, no live WorldEngine mutations, no rating assignments.
 * Input: exported Project Ice career JSON; output: a separate audit JSON.
 * Peer percentiles represent only the recorded high-school world, not NHL-level ability.
 * Do NOT promote any review flag to a potential rating without the calibrated
 * longitudinal baseline and explicit migration approval.
 */
'use strict';

function group(p){const pos=String(p?.position||"").toUpperCase();return pos==="G"?"G":["D","LD","RD"].includes(pos)?"D":"F";}

function role(potential,position){const p=Number(potential);if(!Number.isFinite(p))return null;const g=group({position});if(p>=96)return"Franchise";if(p>=90)return"Elite";if(g==="G")return p>=84?"Starter":p>=79?"Fringe Starter":p>=74?"Backup":"AHL Starter";if(g==="D")return p>=84?"Top 4 D":p>=79?"Top 6 D":p>=74?"7th D":"AHL Top 2 D";return p>=84?"Top 6 F":p>=79?"Top 9 F":p>=74?"Bottom 6 F":"AHL Top 6 F";}

function measure(p,s){const stats=s?.regularSeasonStats||{};const gp=Number(stats.gamesPlayed)||0;const min=Number(stats.minutesPlayed)||0;const age=Number(s?.age);const ov=Number(s?.overall);if(group(p)==="G"){const shots=Number(stats.shotsAgainst)||0, saves=Number(stats.saves)||0;if(gp<3||shots<100||saves>shots)return null;return{age,overall:ov,gp,main:saves/shots,second:Math.min(1,shots/Math.max(1,gp*30)),third:0,sample:shots};}if(gp<10||min<100)return null;const pts=Number(stats.points??((Number(stats.goals)||0)+(Number(stats.assists)||0))),shots=Number(stats.shots)||0,pm=Number(stats.plusMinus)||0;return{age,overall:ov,gp,main:60*pts/min,second:60*shots/min,third:Math.max(-2,Math.min(2,pm/gp)),sample:min};}

function pct(value,values){if(value===null||!values.length)return null;let below=0,tied=0;for(const n of values){if(n<value)below++;else if(n===value)tied++;}return 100*(below+0.5*tied)/values.length;}

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}

function evaluateWorld(world){const all=(Array.isArray(world?.teams)?world.teams:[]).flatMap(t=>Array.isArray(t.roster)?t.roster:[]);const generated=all.filter(p=>p&&p.realPlayer!==true&&p.persistentProspect!==true);const currentDate=String(world?.currentDate||world?.season?.currentDate||'').slice(0,10);const seasons=generated.map(p=>({p,h:(Array.isArray(p.highSchoolSeasonHistory)?p.highSchoolSeasonHistory:[]).filter(h=>{const y=Number(h?.seasonStartYear);return Number.isInteger(y)&&y>=1900&&currentDate&&`${y+1}-08-31`<=currentDate;}).sort((a,b)=>a.seasonStartYear-b.seasonStartYear),g:group(p)}));const metrics=seasons.map(o=>({p:o.p,g:o.g,h:o.h,m:o.h.slice(-2).map(s=>measure(o.p,s))}));const rows=[];for(const o of metrics){const [prior,current]=o.m;const output={id:o.p.id||o.p.playerId||null,name:[o.p.firstName,o.p.lastName].filter(Boolean).join(" "),group:o.g,age:Number(o.p.age)||null,overall:Number(o.p.overall)||null,rootPotential:Number(o.p.potential)||null,developmentPotential:Number(o.p.development?.potential)||null,rootRole:role(o.p.potential,o.p.position),developmentRole:role(o.p.development?.potential,o.p.position),historicalDataComplete:!!prior&&!!current,latestPeerCount:0,latestMainPercentile:null,previousMainPercentile:null,latestContextPercentile:null,overallGrowth:null,evidenceTrend:"Under Evaluation",certaintyReview:"hold",review:"missing-historical-evidence",ratingProposal:null,reasonCodes:[]};if(output.rootPotential!==output.developmentPotential)output.reasonCodes.push("POTENTIAL_FIELD_CONFLICT");if(!prior||!current){output.reasonCodes.push("INSUFFICIENT_HISTORY");rows.push(output);continue;}let vals=[];for(let index=0;index<2;index++){let peers=metrics.filter(x=>x.g===o.g&&x.m[index]&&Math.abs(Number(x.m[index].age)-Number(o.m[index].age))<=1);if(peers.length<12)peers=metrics.filter(x=>x.g===o.g&&x.m[index]);vals.push(peers);}const p0=pct(prior.main,vals[0].map(v=>v.m[0].main)),p1=pct(current.main,vals[1].map(v=>v.m[1].main));output.previousMainPercentile=Number(p0?.toFixed(1));output.latestMainPercentile=Number(p1?.toFixed(1));output.latestPeerCount=vals[1].length;const p2=pct(current.second,vals[1].map(v=>v.m[1].second));const p3=o.g==="G"?50:pct(current.third,vals[1].map(v=>v.m[1].third));output.latestContextPercentile=Number((p1*.72+p2*.20+p3*.08).toFixed(1));output.overallGrowth=Number.isFinite(current.overall)&&Number.isFinite(prior.overall)?current.overall-prior.overall:null;const rise=p1-p0;const extreme=output.latestContextPercentile>=90&&rise>=30;const strong=output.latestContextPercentile>=85&&rise>=15;const falling=output.latestContextPercentile<=20&&rise<=-30;const low=output.latestContextPercentile<=20&&p0<=25;const support=(o.g==="G"?current.sample>=350:current.gp>=20&&current.sample>=250);if(vals[1].length<8){output.reasonCodes.push("INSUFFICIENT_PEERS");rows.push(output);continue;}if(extreme&&support){output.evidenceTrend="Rapidly Rising";output.review="strong-breakout-review";output.certaintyReview="challenge-current-projection";output.reasonCodes.push("EXCEPTIONAL_SUSTAINED_IMPROVEMENT");}else if(strong){output.evidenceTrend="Rising";output.review="breakout-review";output.certaintyReview="challenge-current-projection";output.reasonCodes.push("STRONG_SEASON_OVER_SEASON_GROWTH");}else if(falling&&support){output.evidenceTrend="Rapidly Falling";output.review="decline-evidence-review";output.certaintyReview="challenge-current-projection";output.reasonCodes.push("SIGNIFICANT_SEASON_DECLINE");}else if(low&&support){output.evidenceTrend="Falling";output.review="persistent-underperformance-review";output.certaintyReview="challenge-current-projection";output.reasonCodes.push("TWO_LOW_RELATIVE_SEASONS");}else{output.evidenceTrend="Stable";output.review="retain-pending-calibration";output.reasonCodes.push("NO_CLEAR_TIER_CHANGE");}if(output.overallGrowth!==null&&output.overallGrowth>=2&&output.evidenceTrend.includes("Rising"))output.reasonCodes.push("ATTRIBUTE_SUPPORTED_OVERALL_GROWTH");output.reasonCodes.push("HISTORICAL_POTENTIAL_BASELINE_UNAVAILABLE");rows.push(output);}return{schema:"potential-v2-shadow-v1",readOnly:true,gameDate:world?.currentDate||null,generatedHighSchoolPlayers:generated.length,excludedRealHS:all.length-generated.length,excludedExternal:Array.isArray(world?.externalProspects)?world.externalProspects.length:0,rows};}

module.exports = {evaluateWorld,role,measure};
if (require.main === module) {
  const fs = require('fs');
  const source = process.argv[2];
  const output = process.argv[3];
  if (!source || !output || source === output) {
    console.error('Usage: node potential-v2-shadow.js backup.json shadow-report.json');
    process.exitCode = 2;
  } else {
    const backup = JSON.parse(fs.readFileSync(source, 'utf8'));
    if (backup.format !== 'projectice-career-backup' || backup.version !== 1 ||
        backup.activeRecord?.id !== 'career:' + backup.activeCareerId || !backup.activeRecord?.world) {
      throw new Error('Invalid Project Ice backup. No output written.');
    }
    const audit = evaluateWorld(backup.activeRecord.world);
    fs.writeFileSync(output, JSON.stringify(audit, null, 2));
    const counts = {};
    for (const row of audit.rows) counts[row.review]=(counts[row.review]||0)+1;
    console.log(JSON.stringify({readOnly:true,gameDate:audit.gameDate,generated:audit.generatedHighSchoolPlayers,excludedReal:audit.excludedRealHS,excludedExternal:audit.excludedExternal,reviewCounts:counts},null,2));
  }
}
