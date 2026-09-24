'use strict';
const assert=require('node:assert/strict');
const {metric,baseline,evaluate,tier}=require('./potential-v2-weekly-shadow');
const players=(p=74)=>Array.from({length:18},(_,i)=>({
 id:'peer'+i,leagueLevel:'HS',age:16,position:'RW',potential:p-5+i%12,
 seasonStats:{gamesPlayed:20,points:10+i,minutesPlayed:400}}));
const career={id:'career',leagueLevel:'HS',age:16,position:'RW',potential:74,
 development:{potential:74,potentialConfidence:85,seasonAttributeGrowth:{passing:2}},
 seasonStats:{gamesPlayed:14,points:25,minutesPlayed:280}};
const peers=players();
const opts={player:career,peers,seasonId:'hs-2025-2026',weekKey:'2025-W42',
 weekNumber:8,observedGames:10};
const orig=JSON.stringify({career,peers,opts});
const a=evaluate(opts),b=evaluate(opts);
assert.equal(a.status,'evaluated');
assert.deepEqual(a,b,'deterministic');
assert.equal(JSON.stringify({career,peers,opts}),orig,'pure, no save mutation');
assert.ok(a.relativeProduction>1,'real peer-relative production');
assert.equal(a.changeProposed,false,'one week cannot force potential jump');
assert.equal(a.proposal.potential,74);
assert.equal(evaluate({...opts,previous:{...a.proposal}}).status,'already-evaluated');
assert.equal(evaluate({...opts,weekKey:'2025-W43',previous:a.proposal}).reason,'NO_NEW_GAMES');
assert.equal(evaluate({...opts,peers:[]}).reason,'INSUFFICIENT_SAME_LEVEL_TIER_PEERS');
assert.equal(evaluate({...opts,player:{...career,development:{...career.development,potential:68}}}).reason,'UNRECONCILED_OR_MISSING_POTENTIAL');
const varsity={...career,teamLevel:'Varsity'};
assert.equal(evaluate({...opts,player:varsity,peers}).status,
  'evaluated','missing legacy HS labels normalize to Varsity');
const varsityPeers=peers.map(p=>({...p,teamLevel:'Varsity'}));
assert.equal(evaluate({...opts,player:career,peers:varsityPeers}).status,
  'evaluated','all current HS players use the sole Varsity level');
const AAA=peers.map(p=>({...p,leagueLevel:'TRAVEL',teamLevel:'AAA'}));
const AA={...career,leagueLevel:'TRAVEL',teamLevel:'AA'};
assert.equal(evaluate({...opts,player:AA,peers:AAA}).reason,
  'INSUFFICIENT_SAME_LEVEL_TIER_PEERS','travel AA cannot benchmark against AAA');
const realPeers=peers.map(p=>({...p,leagueLevel:'NHL'}));
assert.equal(evaluate({...opts,peers:realPeers}).reason,'INSUFFICIENT_SAME_LEVEL_TIER_PEERS','no HS/NHL crossover');
const low= {...career,seasonStats:{gamesPlayed:2,points:10,minutesPlayed:44}};
assert.equal(evaluate({...opts,player:low}).reason,'INSUFFICIENT_PLAYER_SAMPLE');
const goalie={id:'g',leagueLevel:'HS',age:16,position:'G',potential:84,
 development:{potential:84,potentialConfidence:60},
 seasonStats:{gamesPlayed:12,saves:400,shotsAgainst:450}};
assert.ok(metric(goalie).value>.85);
const goaliePeers=Array.from({length:9},(_,i)=>({...goalie,id:'g'+i,
 seasonStats:{gamesPlayed:12,saves:370+i,shotsAgainst:420}}));
assert.equal(baseline(goalie,goaliePeers).status,'supported');
const goalieEvaluation=evaluate({...opts,player:goalie,peers:goaliePeers});
assert.equal(goalieEvaluation.status,'evaluated');
const noObservation={...career,seasonStats:{...career.seasonStats}};
const first=evaluate({...opts,player:noObservation,observedGames:0});
assert.ok(first.proposal.confidence<=85,'no free certainty from zero observations');
assert.equal(tier(96,'G'),'Franchise');
assert.equal(tier(84,'D'),'Top 4 D');
const thirty={...career,age:30,potential:90,development:{potential:90,potentialConfidence:45}};
const oldPeers=Array.from({length:12},(_,i)=>({...thirty,id:'old'+i,potential:88+i%5,
 seasonStats:{gamesPlayed:20,points:10+i,minutesPlayed:420}}));
const future=evaluate({...opts,player:thirty,peers:oldPeers,previous:{seasonId:opts.seasonId,
 signal:3.9,streak:20,confidence:45,gamesEvaluated:8,lastChangedWeek:-50},
 weekNumber:31});
assert.equal(future.proposedPotential,90,'30-year-old Elite cannot gain Franchise via extraordinary production');
const reduced={...career,seasonStats:{gamesPlayed:14,points:0,minutesPlayed:280}};
const down=evaluate({...opts,player:reduced,previous:{seasonId:opts.seasonId,confidence:80,
 signal:-1.3,streak:2,gamesEvaluated:11},weekKey:'2025-W44'});
assert.ok(down.proposal.confidence<80,'sustained mismatch reduces confidence');
assert.equal(down.trend,'falling');
assert.equal(a.proposal.lastEvaluatedWeek,opts.weekKey);
console.log('PASS: weekly shadow deterministic, peer-level, age, confidence and save-safety checks');
