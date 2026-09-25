'use strict';
/* Offline 36-week synthetic stress: no actual game world or IndexedDB. */
const assert=require('node:assert/strict'),{evaluate}=require('./potential-v2-weekly-shadow');
const make=(id,position='RW',potential=79)=>({id,position,age:16,leagueLevel:'HS',
 potential,development:{potential,potentialConfidence:82,seasonAttributeGrowth:{}},
 seasonStats:{gamesPlayed:0,points:0,minutesPlayed:0}});
const players={main:make('career'),average:make('average'),falling:make('falling'),
 real:{...make('real'),realPlayer:true},
 orphan:{...make('orphan'),generatedIncomingFreshman:true,
  incomingClassSeasonId:'hs-2025-2026',
  highSchoolSeasonHistory:[{seasonStartYear:2024,age:15}]},
 conflicted:{...make('conflicted'),development:{potential:68}},
 goalie:make('goalie','G',84)};
const peers=Array.from({length:18},(_,i)=>({...make('peer'+i,'RW',75+i%7),
 seasonStats:{gamesPlayed:20,points:12+i%6,minutesPlayed:400}}));
const initial=JSON.stringify(players),history={},results={};
for(const name of Object.keys(players)){history[name]={};results[name]=[];}
for(let week=1;week<=36;week++){
 // Stop all skater games for five injury weeks, then resume.
 if(week<10||week>14)
  for(const [name,points] of [['main',3],['average',.8],['falling',0]]){
   const s=players[name].seasonStats;s.gamesPlayed++;s.minutesPlayed+=20;s.points+=points;
  }
 for(const name of Object.keys(players)){
  const player=players[name],args={player,
   peers:week>=19&&week<=24?peers.slice(0,3):peers,
   previous:history[name],seasonId:'hs-2025-2026',
   weekKey:'week:'+week,weekNumber:week,observedGames:Math.min(week,10)};
  const before=JSON.stringify(args),one=evaluate(args);
  assert.deepEqual(one,evaluate(args),'deterministic '+name+' '+week);
  assert.equal(JSON.stringify(args),before,'evaluator mutated fixture');
  assert.equal(one.readOnly,true);
  results[name].push(one);
  if(one.proposal)history[name]=one.proposal;
  if(one.status==='evaluated'){
   assert.equal(evaluate({...args,previous:one.proposal}).status,'already-evaluated');
   if(one.changeProposed){
    assert(Number.isInteger(one.proposedPotential));
    player.potential=one.proposedPotential;player.development.potential=one.proposedPotential;
   }
  }
 }
}
for(const name of ['main','average','falling']){
 assert(results[name].some(x=>x.status==='evaluated'));
 assert(results[name].slice(9,14).every(x=>x.reason==='NO_NEW_GAMES'));
 assert(results[name].slice(18,24).every(x=>x.reason==='INSUFFICIENT_SAME_LEVEL_TIER_PEERS'));
}
assert.deepEqual(results.main.filter(x=>x.changeProposed).map(x=>[x.oldPotential,x.proposedPotential]),[[79,84]]);
assert.equal(results.average.some(x=>x.changeProposed),false);
assert.deepEqual(results.falling.filter(x=>x.changeProposed).map(x=>[x.oldPotential,x.proposedPotential]),[[79,78]]);
for(const [name,reason] of Object.entries({
 orphan:'UNVERIFIED_ARCHIVED_PLAYER_IDENTITY',
 real:'REAL_PLAYER_WEEKLY_RERATE_NOT_ENABLED',
 conflicted:'UNRECONCILED_OR_MISSING_POTENTIAL',
 goalie:'INSUFFICIENT_PLAYER_SAMPLE'})){
 assert(results[name].every(x=>x.reason===reason),'safety gate '+name);
 assert.equal(JSON.stringify(players[name]),JSON.stringify(JSON.parse(initial)[name]),'protected '+name);
}
console.log('PASS: 36 weeks, breakout/decline, injury, cohort turnover, protected identities, deterministic pure evaluation');
