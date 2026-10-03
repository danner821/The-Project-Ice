'use strict';

/*
 * Pure Potential V2 seed-review policy. Read-only and never loaded by gameplay.
 * Numeric candidates are conservative role-tier floors, not live approvals.
 */
const posGroup=p=>String(p||'').toUpperCase()==='G'?'G':
  ['D','LD','RD'].includes(String(p||'').toUpperCase())?'D':'F';

function roleFor(position,potential){
  const p=Number(potential),g=posGroup(position);
  if(g==='G')return p>=96?'Franchise':p>=90?'Elite':p>=84?'Starter':
    p>=79?'Fringe Starter':p>=74?'Backup':'AHL Starter';
  if(g==='D')return p>=96?'Franchise':p>=90?'Elite':p>=84?'Top 4 D':
    p>=79?'Top 6 D':p>=74?'7th D':'AHL Top 2 D';
  return p>=96?'Franchise':p>=90?'Elite':p>=84?'Top 6 F':
    p>=79?'Top 9 F':p>=74?'Bottom 6 F':'AHL Top 6 F';
}

function recommendFromEvidence(e={}){
  if(e.positionGroup!=='F')
    return{status:'withheld',reason:'V1_SEED_REVIEW_FORWARD_ONLY'};
  if(Number(e.peerCount)<20)
    return{status:'withheld',reason:'INSUFFICIENT_CLEAN_PEERS'};

  const prior=Number(e.priorP60Percentile);
  const latest=Number(e.latestP60Percentile);
  const delta=Number(e.p60ImprovementPercentile);
  const overall=Number(e.latestOverallPercentile);
  const growth=Number(e.overallGrowthPercentile);
  const plusMinus=Number(e.latestPlusMinusPercentile);
  if([prior,latest,delta,overall,growth,plusMinus].some(n=>!Number.isFinite(n)))
    return{status:'withheld',reason:'INCOMPLETE_TWO_SEASON_EVIDENCE'};

  // Elite needs two completed high-end seasons. One huge breakout is capped
  // at Top-6 so future weekly V2 evidence owns any later Elite promotion.
  if(prior>=90&&latest>=95&&overall>=90&&plusMinus>=80){
    return{status:'candidate',candidate:90,range:[90,95],role:'Elite',
      confidence:55,accuracy:'Medium',
      rationale:'SUSTAINED_TWO_SEASON_ELITE_EVIDENCE'};
  }
  if(latest>=90&&delta>=90&&overall>=85&&growth>=75&&plusMinus>=75){
    return{status:'candidate',candidate:84,range:[84,89],role:'Top 6 F',
      confidence:55,accuracy:'Medium',
      rationale:'STRONG_BREAKOUT_TOP6_FLOOR;_ELITE_WITHHELD_WITHOUT_TWO_STRONG_SEASONS'};
  }
  if(latest>=75&&overall>=65&&(delta>=70||growth>=70)){
    return{status:'candidate',candidate:79,range:[79,83],role:'Top 9 F',
      confidence:55,accuracy:'Medium',
      rationale:'ABOVE_AVERAGE_TRAJECTORY_TOP9_FLOOR'};
  }
  if(latest>=50&&overall>=40){
    return{status:'candidate',candidate:74,range:[74,78],role:'Bottom 6 F',
      confidence:55,accuracy:'Medium',
      rationale:'MIDDLE_EVIDENCE_BOTTOM6_FLOOR'};
  }
  return{status:'candidate',candidate:73,range:[25,73],role:'AHL Top 6 F',
    confidence:55,accuracy:'Medium',rationale:'LIMITED_EVIDENCE_AHL_RANGE'};
}

module.exports={recommendFromEvidence,roleFor,posGroup};
