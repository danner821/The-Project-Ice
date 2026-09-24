'use strict';
/* Synthetic 36-week timelines: no actual game world or browser save is touched.
 * Run: node artifacts/project-ice/tools/potential-v2-weekly-longitudinal.test.js
 */
const assert=require('node:assert/strict');
const {evaluate}=require('./potential-v2-weekly-shadow');
const rivals=Array.from({length:20},(_,i)=>({
  id:'peer'+i,leagueLevel:'NHL',position:'RW',age:20,potential:89+i%4,
  seasonStats:{gamesPlayed:40,points:25+i,minutesPlayed:800}
}));
const history=[
  {seasonId:'nhl-2023',level:'NHL',gamesPlayed:80,points:102},
  {seasonId:'nhl-2024',level:'NHL',gamesPlayed:78,points:105}
];
const player=(age,potential,week,historyOverride=[])=>({
 id:'career',leagueLevel:'NHL',position:'RW',age,potential,overall:86,
 documentedNHLSeasons:historyOverride,development:{
 potential,potentialConfidence:85,seasonAttributeGrowth:{speed:2}},
 seasonStats:{gamesPlayed:week+5,points:(week+5)*2.4,minutesPlayed:(week+5)*20}
});
function timeline(age,potential,documentedNHLSeasons=history){
 let previous=null,firstRapid=null,firstReview=null,moves=[],snapshots=[];
 const peers=rivals.map(x=>({...x,age,potential:potential-2+x.potential%5}));
 for(let w=1;w<=36;w++){
   const current=player(age,previous?.potential??potential,w,documentedNHLSeasons);
   const args={player:current,peers,previous:previous||{},
     seasonId:'nhl-2025',weekKey:'W'+w,weekNumber:w,observedGames:w+5};
   const before=JSON.stringify(args),r=evaluate(args);
   assert.equal(JSON.stringify(args),before,'never mutates input');
   assert.equal(r.status,'evaluated');
   assert.equal(evaluate(args).proposal?.potential,r.proposal.potential,'determinism');
   assert.equal(evaluate({...args,previous:r.proposal}).status,'already-evaluated','one evaluation per week');
   if(r.trend==='rapidly-rising'&&firstRapid===null)firstRapid=w;
   if(r.eligibleForReview&&firstReview===null)firstReview=w;
   if(r.changeProposed)moves.push({week:w,from:r.oldPotential,to:r.proposedPotential,confidence:r.proposal.confidence});
   previous=r.proposal;
   snapshots.push(r);
 }
 return{previous,firstRapid,firstReview,moves,snapshots};
}
const eliteNoHistory=timeline(20,90,[]);
assert.ok(eliteNoHistory.firstRapid!==null,'sustained extreme performance gets Rapidly Rising');
assert.ok(eliteNoHistory.snapshots[12].proposal.confidence<85,'mismatch lowers scouting confidence');
assert.equal(eliteNoHistory.moves.some(m=>m.to>=96),false,'no Franchise rise without two documented NHL seasons');
assert.ok(eliteNoHistory.snapshots.every(s=>s.franchiseGate?.permitted===false),'Franchise historical gate stays closed');
const shortSeasons=timeline(20,90,[
  {seasonId:'a',level:'NHL',gamesPlayed:20,points:24},
  {seasonId:'b',level:'NHL',gamesPlayed:22,points:28}
]);
assert.ok(shortSeasons.snapshots.every(s=>s.franchiseGate?.permitted===false),
 'short hot streaks are not two dominant NHL seasons');
const eliteWithHistory=timeline(20,90,history);
assert.ok(eliteWithHistory.snapshots.some(s=>s.franchiseGate?.permitted===true),'proven multi-season dominance permits review');
assert.ok(eliteWithHistory.snapshots.some(s=>s.eligibleForReview),'permitted does not guarantee promotion');
assert.ok(eliteWithHistory.moves.every(m=>m.confidence===55),'all official changes reset to Medium');
assert.ok(eliteWithHistory.moves.every(m=>m.to===96),'Franchise jump only one tier');
const older=timeline(30,90,history);
assert.equal(older.moves.some(m=>m.to===96),false,'age 30 elite stays elite despite extraordinary NHL season');
const teen=timeline(17,90,history);
assert.equal(teen.moves.some(m=>m.to===96),false,'17-year-old cannot be promoted Franchise');
const poor={...player(20,90,20,history),seasonStats:{gamesPlayed:25,points:0,minutesPlayed:500}};
const weakPeers=rivals.map(x=>({...x,seasonStats:{gamesPlayed:40,points:25+x.potential%8,minutesPlayed:800}}));
const weakBase={player:poor,peers:weakPeers,seasonId:'nhl-2025',
 weekKey:'W25',weekNumber:25,observedGames:20,previous:{
 seasonId:'nhl-2025',signal:-3.5,streak:11,confidence:40,
 gamesEvaluated:24,lastChangedWeek:-200}};
const weak=evaluate(weakBase);
assert.equal(weak.status,'evaluated');
assert.equal(weak.highTierDeclineGate.permitted,false,'no Elite downgrade without historical failure');
const withWeak=evaluate({...weakBase,player:{...poor,documentedWeakSeasons:[
 {seasonId:'a',gamesPlayed:65,performanceVsExpectation:.50},
 {seasonId:'b',gamesPlayed:55,performanceVsExpectation:.65}]}});
assert.equal(withWeak.highTierDeclineGate.permitted,true);
assert.ok(withWeak.eligibleForReview,'sustained multi-season underperformance permits review');
const noNHLPeers=evaluate({...weakBase,peers:weakPeers.map(p=>({...p,leagueLevel:'HS'}))});
assert.equal(noNHLPeers.status,'withheld','different league samples cannot contaminate NHL evaluation');
console.log('PASS: sustained breakout, certainty erosion, two-season Franchise guard, aging and downgrade gates');
