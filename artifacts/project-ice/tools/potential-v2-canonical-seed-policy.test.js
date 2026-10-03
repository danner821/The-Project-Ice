'use strict';
const {recommendFromEvidence}=require('./potential-v2-canonical-seed-policy');
const result=recommendFromEvidence({positionGroup:'F',peerCount:47,priorP60Percentile:8.5,latestP60Percentile:95.7,p60ImprovementPercentile:97.9,latestOverallPercentile:96.8,overallGrowthPercentile:100,latestPlusMinusPercentile:95.7});
if(result.candidate!==84||result.role!=='Top 6 F'||result.confidence!==55)throw Error('canonical seed policy regression');
console.log('PASS: conservative Top-6 tier-floor seed policy');
