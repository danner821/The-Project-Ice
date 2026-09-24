/* Project Ice — Potential 2.0 XP SHADOW, never imported by live gameplay.
 * No mutation, RNG, IndexedDB, localStorage, network or migration.
 * Mirrors current production price, then experiments with player-specific
 * proximity, hidden personality and externally *validated* breakout evidence.
 * An input's breakoutEvidence must be computed from actual history elsewhere.
 */
'use strict';

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const POS=p=>String(p?.position||'').toUpperCase()==='G'?'G':['D','RD','LD'].includes(String(p?.position||'').toUpperCase())?'D':'F';
const BASE_TIERS=[[60,35],[70,50],[75,70],[80,95],[85,130],[90,180],[95,260],[98,400],[100,700]];
const PERSONALITY_CURVES=Object.freeze({
  balanced:1,fastLearner:.94,lateBloomer:1.12,gymRat:.97,naturalScorer:.98,
  filmJunkie:.98,highMotor:.96,smoothSkater:.98,rawAthlete:1.04,
  confidencePlayer:1,defensiveSpecialist:1.02
});
function basePrice(rating) {
  const n=clamp(Number(rating)||50,25,99);
  return BASE_TIERS.find(([edge])=>n<edge)[1];
}
function oldPotentialMultiplier(value) {
  const p=clamp(Number(value)||60,25,99);
  return p>=96?.84:p>=90?.89:p>=84?.95:p>=79?1:p>=74?1.07:1.14;
}
function oldAgeMultiplier(age,position){
  const a=clamp(Number(age)||14,14,45);
  if(POS({position})==='G')return a<=18?.90:a<=22?.94:a<=26?1:a<=29?1.1:a<=34?1.28:1.55;
  return a<=18?.90:a<=22?.95:a<=26?1:a<=28?1.12:a<=32?1.30:1.60;
}
function legacyCost(player,attributeKey,potential) {
  const rating=Number(player?.attributes?.[attributeKey]);
  if(!Number.isFinite(rating)||rating<25||rating>=99)return null;
  const upgrades=Math.max(0,Number(player?.development?.attributeUpgradeCounts?.[attributeKey])||0);
  const p=potential??player?.development?.potential??player?.potential??player?.overall;
  const age=Number(player?.age??player?.development?.currentAge)||14;
  return Math.max(25,Math.round(basePrice(rating)*(1+Math.min(.25,upgrades*.02))*
    oldPotentialMultiplier(p)*oldAgeMultiplier(age,player?.position)));
}
function proposal(player,attributeKey,options={}) {
  const root=Number(player?.potential),nested=Number(player?.development?.potential);
  const mismatch=Number.isFinite(root)&&Number.isFinite(nested)&&root!==nested;
  const explicit=Number(options.potential);
  if(mismatch&&!Number.isFinite(explicit)) return {
    status:'potential-conflict',rootPotential:root,developmentPotential:nested,
    scenarios:[proposal(player,attributeKey,{...options,potential:root}),proposal(player,attributeKey,{...options,potential:nested})],
    currentXP:Number(player?.development?.attributeXP?.[attributeKey])||0
  };
  const rating=Number(player?.attributes?.[attributeKey]);
  if(!Number.isFinite(rating)||rating<25||rating>=99)return{status:'unpriced-attribute'};
  const p=Number.isFinite(explicit)?clamp(explicit,25,99):
    clamp(Number(player?.development?.potential??player?.potential??player?.overall)||60,25,99);
  const legacy=legacyCost(player,attributeKey,p);
  const overall=clamp(Number(player?.overall)||50,25,99);
  const age=Number(player?.age??player?.development?.currentAge)||14;
  const personality=String(player?.development?.dna?.personality||'balanced');
  const profile=PERSONALITY_CURVES[personality]??1;
  // Potential's continuous OVR proximity curve. A negative gap represents
  // exceeding the current projection; it NEVER blocks actual improvements.
  const gap=p-overall;
  const near=clamp((8-gap)/8,0,2.5);
  const ageFactor=age<=22?1:age<=27?1.1:age<=32?1.22:1.38;
  const tierFactor=p>=96?.72:p>=90?.78:p>=84?.88:p>=79?.96:p>=74?1.06:1.17;
  const proximity=1+Math.pow(near,1.55)*(.23*ageFactor*tierFactor*profile);
  // Breakout discounts are gated by an outside, sustained-evidence evaluator.
  // Insufficient evidence => 0. A formal potential upgrade changes p immediately.
  const evidence=clamp(Number(options.breakoutEvidence)||0,0,1);
  const easing=age<=22?.37:age<=27?.25:age<=32?.11:.04;
  const discounted=1+(proximity-1)*(1-easing*evidence);
  const proposedCost=Math.max(25,Math.round(legacy*discounted));
  const currentXP=Math.max(0,Number(player?.development?.attributeXP?.[attributeKey])||0);
  return{
    status:'preview',attributeKey,position:POS(player),age,overall,attributeRating:rating,
    potential:p,hiddenPersonalityUsed:personality!=='balanced',
    baselineCost:legacy,proposedCost,proximityMultiplier:Number(proximity.toFixed(3)),
    breakoutEvidence:evidence,breakoutDiscount:Number((proximity-discounted).toFixed(3)),
    currentXP,remainingXP:Math.max(0,proposedCost-currentXP),
    immediatelyAffordable:currentXP>=proposedCost,
    preservesEarnedXP:true,levelUpPerformed:false,
    highSchoolOverallCap:85,
    // Never assume one attribute point will leave overall unchanged.
    needsActualOverallCapCheck:String(options.careerLevel||'').toUpperCase()==='HS'&&overall>=85
  };
}
function careerPreview(player,attributeKeys,options={}) {
  return {readOnly:true,playerId:player?.id||player?.playerId||null,
    attributes:attributeKeys.map(k=>proposal(player,k,options))};
}
module.exports={basePrice,oldPotentialMultiplier,oldAgeMultiplier,legacyCost,proposal,careerPreview};
