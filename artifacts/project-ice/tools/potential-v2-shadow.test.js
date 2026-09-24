/* Synthetic-only regression suite. Run: node artifacts/project-ice/tools/potential-v2-shadow.test.js */
'use strict';
const {evaluateWorld,role,measure}=require('./potential-v2-shadow');
function check(value,label){if(!value)throw Error('FAIL: '+label);}
function hs(id,firstPoints,latestPoints,real=false){const make=(year,age,pts,ovr)=>({seasonStartYear:year,age,overall:ovr,regularSeasonStats:{gamesPlayed:28,points:pts,shots:pts*2+10,minutesPlayed:570,plusMinus:pts-15}});return{id,firstName:id,lastName:'Test',position:'RW',realPlayer:real,age:16,overall:72,potential:74,development:{potential:74},highSchoolSeasonHistory:[make(2023,15,firstPoints,70),make(2024,16,latestPoints,72)]};}
const peers=Array.from({length:25},(_,i)=>hs('peer'+i,4+i,6+i));
const breakout=hs('breakout',2,44);breakout.development.potential=68;
const falling=hs('falling',45,1);
const future=hs('future',10,22);future.highSchoolSeasonHistory.push({seasonStartYear:2025,age:17,overall:99,regularSeasonStats:{gamesPlayed:28,points:300,shots:400,minutesPlayed:500,plusMinus:300}});
const missing=hs('missing',1,2);missing.highSchoolSeasonHistory=[];
const goalie={id:'goalie',firstName:'Goalie',position:'G',age:16,overall:72,potential:84,development:{potential:84},highSchoolSeasonHistory:[2023,2024].map((year,i)=>({seasonStartYear:year,age:15+i,overall:70+i,regularSeasonStats:{gamesPlayed:20,shotsAgainst:700,saves:i?650:620,minutesPlayed:1200}}))};
const world={currentDate:'2025-09-04',teams:[{roster:[...peers,breakout,falling,future,missing,goalie,hs('real',15,25,true)]}],externalProspects:[{id:'external',realPlayer:true}]};
const before=JSON.stringify(world),first=evaluateWorld(world),again=evaluateWorld(world),get=id=>first.rows.find(x=>x.id===id);
check(JSON.stringify(world)===before,'no mutation');
check(JSON.stringify(first)===JSON.stringify(again),'determinism');
check(first.generatedHighSchoolPlayers===30,'eligible HS count');
check(first.excludedRealHS===1&&first.excludedExternal===1,'real player exclusions');
check(get('breakout').evidenceTrend==='Rapidly Rising','genuine multifactor breakout');
check(get('breakout').rootPotential===74&&get('breakout').developmentPotential===68,'preserve potential mismatch');
check(get('falling').evidenceTrend==='Rapidly Falling','downward trend');
check(get('future').historicalDataComplete&&get('future').latestMainPercentile<100,'unfinished future season excluded');
check(get('missing').evidenceTrend==='Under Evaluation','missing history held');
check(get('goalie').historicalDataComplete&&measure(goalie,goalie.highSchoolSeasonHistory[1]).main>.9,'goalie sample valid');
check(first.rows.every(x=>x.ratingProposal===null),'no unauthorized rating proposal');
check(role(96,'RW')==='Franchise'&&role(84,'G')==='Starter','position tier thresholds');
console.log('PASS: 12 Potential 2.0 synthetic checks');