'use strict';
/* Source-extracted production weekly authority; no browser DB or live writes.
 * Optional offline private input: node tools/potential-v2-legacy-authority.test.js PRIVATE.json
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const s=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const start=s.indexOf('  function processPotentialWeek(dateString) {');
const end=s.indexOf('\n  function getScoutingAttributeGroups(',start);
assert(start>=0&&end>start,'source markers');
const source=s.slice(start,end);
assert(source.includes('eligibleForLegacyPotentialWeek'),'guard missing');
const player=(id,extra={})=>({id,position:'RW',potential:74,
 development:{potential:74},seasonStats:{gamesPlayed:0},...extra});
function inspect(players){
 const calls=[],living={recentBeats:[]},ctx={
  normalizeLivingWorldDateKey:d=>d,getLivingWorldWeekKey:()=> 'week:2025-09-08',
  getAllWorldPlayers:()=>players,
  evaluatePlayerPotentialWeek:p=>{calls.push(p.id||p.playerId);return{
   changed:p.id==='eligible',oldPotential:74,newPotential:79,
   oldRole:'Bottom 6 F',newRole:'Top 9 F',trend:'rising',accuracy:'Medium'};},
  getCareerPlayerFromWorldState:()=>players.find(p=>p.id==='conflict'),
  ensureLivingWorldState:()=>living,
 };
 vm.createContext(ctx);
 vm.runInContext(source+'\nthis.process=processPotentialWeek;',ctx,{timeout:30000});
 const before=JSON.stringify(players),result=JSON.parse(JSON.stringify(ctx.process('2025-09-08')));
 assert.equal(JSON.stringify(players),before,'immutable input');
 return{calls,result,living};
}
const sample=[
 player('preseason'),player('eligible',{seasonStats:{gamesPlayed:8}}),
 player('conflict',{potential:74,development:{potential:68},seasonStats:{gamesPlayed:20}}),
 player('real',{realPlayer:true,seasonStats:{gamesPlayed:20}}),
 player('external',{persistentProspect:true,seasonStats:{gamesPlayed:20}}),
 player('tainted',{generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2025-2026',
  highSchoolSeasonHistory:[{seasonStartYear:2024,age:15}],seasonStats:{gamesPlayed:20}}),
 player('age-coincidence',{generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2025-2026',
  highSchoolSeasonHistory:[{seasonStartYear:2024,age:16}],seasonStats:{gamesPlayed:20}}),
 player('new-freshman',{generatedIncomingFreshman:true,incomingClassSeasonId:'hs-2025-2026',
  highSchoolSeasonHistory:[{seasonStartYear:2025,age:14}],seasonStats:{gamesPlayed:8}})
];
const r=inspect(sample);
assert.deepEqual(r.calls,['eligible','new-freshman']);
assert.equal(r.result.evaluated,8);assert.equal(r.result.changes.length,1);
assert.equal(r.result.careerResult.reason,'unreviewed-potential-conflict-held');
assert.equal(r.living.recentBeats.length,0);
for(const p of sample.filter(p=>!r.calls.includes(p.id)))
 assert.equal(inspect([p]).calls.length,0,'protected '+p.id);
if(process.argv[2]){
 const bytes=fs.readFileSync(process.argv[2]),backup=JSON.parse(bytes);
 assert.equal(backup.format,'projectice-career-backup');
 const list=backup.activeRecord.world.teams.flatMap(t=>t.roster||[]);
 assert.equal(list.length,160);const actual=inspect(list);
 assert.equal(actual.calls.length,0,'no preseason rerating');
 const groups={};
 for(const p of list){
  let reason;
  if(p.realPlayer===true||p.persistentProspect===true)reason='real';
  else if(p.generatedIncomingFreshman===true&&
   p.highSchoolSeasonHistory.some(h=>h.seasonStartYear<
    Number(String(p.incomingClassSeasonId).match(/^hs-(\d{4})-/)?.[1])))reason='tainted';
  else if(p.potential!==p.development?.potential)reason='conflict';
  else reason='preseason';
  groups[reason]=(groups[reason]||0)+1;
 }
 assert.deepEqual(groups,{real:12,tainted:53,conflict:1,preseason:94});
 console.log('PASS: real private preseason 160/160 blocked (12 real, 53 tainted, 1 conflict, 94 no games)');
}
console.log('PASS: source-extracted protected authority, healthy eligibility, no input mutation');
