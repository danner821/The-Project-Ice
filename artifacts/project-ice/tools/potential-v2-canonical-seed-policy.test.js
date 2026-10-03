'use strict';
const assert=require('node:assert/strict');
const {recommendFromEvidence}=require('./potential-v2-canonical-seed-policy');

const breakout=recommendFromEvidence({
  positionGroup:'F',peerCount:47,
  priorP60Percentile:8.5,latestP60Percentile:95.7,
  p60ImprovementPercentile:97.9,latestOverallPercentile:96.8,
  overallGrowthPercentile:100,latestPlusMinusPercentile:95.7
});
assert.deepEqual(
  {status:breakout.status,candidate:breakout.candidate,range:breakout.range,
   role:breakout.role,confidence:breakout.confidence,accuracy:breakout.accuracy},
  {status:'candidate',candidate:84,range:[84,89],role:'Top 6 F',confidence:55,accuracy:'Medium'}
);

const sustainedElite=recommendFromEvidence({
  positionGroup:'F',peerCount:40,
  priorP60Percentile:94,latestP60Percentile:98,
  p60ImprovementPercentile:80,latestOverallPercentile:94,
  overallGrowthPercentile:82,latestPlusMinusPercentile:88
});
assert.equal(sustainedElite.candidate,90);
assert.equal(sustainedElite.role,'Elite');

const oneYearOnly=recommendFromEvidence({
  positionGroup:'F',peerCount:40,
  priorP60Percentile:35,latestP60Percentile:96,
  p60ImprovementPercentile:96,latestOverallPercentile:82,
  overallGrowthPercentile:80,latestPlusMinusPercentile:80
});
assert.equal(oneYearOnly.candidate,79,'thin Top-6 evidence must fall back to Top-9 review');

const inadequate=recommendFromEvidence({
  positionGroup:'F',peerCount:12,
  priorP60Percentile:90,latestP60Percentile:99,
  p60ImprovementPercentile:99,latestOverallPercentile:99,
  overallGrowthPercentile:99,latestPlusMinusPercentile:99
});
assert.equal(inadequate.status,'withheld');
assert.equal(inadequate.reason,'INSUFFICIENT_CLEAN_PEERS');

const goalie=recommendFromEvidence({
  positionGroup:'G',peerCount:40,
  priorP60Percentile:99,latestP60Percentile:99,
  p60ImprovementPercentile:99,latestOverallPercentile:99,
  overallGrowthPercentile:99,latestPlusMinusPercentile:99
});
assert.equal(goalie.status,'withheld');
assert.equal(goalie.reason,'V1_SEED_REVIEW_FORWARD_ONLY');

console.log('PASS: conservative canonical seed policy boundaries');
