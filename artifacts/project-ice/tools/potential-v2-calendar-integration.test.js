'use strict';
/* Runs the ACTUAL production WorldEngine calendar + scheduled NPC game,
 * then reads the post-event state with the offline Potential V2 evaluator.
 * Only synthetic players and a fake remapped disposable IndexedDB are used.
 * No user's backup or browser storage is opened.
 * node tools/potential-v2-calendar-integration.test.js
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {fakeIndexedDB}=require('./potential-v2-fake-indexeddb');
const {evaluate}=require('./potential-v2-weekly-shadow');
const copy=x=>JSON.parse(JSON.stringify(x));
const source=fs.readFileSync(path.join(__dirname,'../public/world.js'),'utf8');
const prospects=fs.readFileSync(path.join(__dirname,'../public/prospects.js'),'utf8');
const dbName='projectice_DISPOSABLE_v2_calendar_integration';
const id='fixture-calendar',key='career:'+id;
const fake=fakeIndexedDB();
const other={id:'career:PROTECTED',revision:444,world:{untouched:true}};
fake.addSentinel('projectice_database',other.id,other);
const local=new Map([['projectice_active_career_id_v1',id]]);
const storage={getItem:k=>local.get(k)||null,
  setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};
const warnings=[];
function sandbox(){
  const context={indexedDB:{open(name,version){
    assert.equal(name,'projectice_database');
    return fake.indexedDB.open(dbName,version);
  },deleteDatabase(){throw Error('A production DB delete was attempted');}},
  localStorage:storage,structuredClone:copy,Date,Math,setTimeout,clearTimeout,
  console:{log(){},warn:(...v)=>warnings.push(String(v[0])),
    error:(...v)=>warnings.push(String(v[0]))},window:{},document:{}};
  vm.createContext(context);
  vm.runInContext(prospects+'\n'+source+'\nthis.engine=WorldEngine;this.curated=REAL_PROSPECTS;',
    context,{filename:'production-prospects-world.js',timeout:30000});
  return{engine:context.engine,curated:context.curated};
}
const app=sandbox(),w=copy(app.engine.state);
assert.equal(app.curated.length,191);
w.currentDate='2025-09-04';w.currentYear=2025;w.currentWeek=1;
w.currentSeason='2025-26';
w.season={id:'hs-2025-2026',seasonId:'hs-2025-2026',seasonStartYear:2025,
  seasonEndYear:2026,phase:'preseason',schoolYear:'Junior',careerYearIndex:2,
  currentDate:'2025-09-04',currentWeek:1,processedDates:[]};
w.player={id:'fixture-career',playerId:'fixture-career',currentDate:'2025-09-04',
  firstName:'Synthetic',lastName:'Career',potential:74,development:{potential:68}};
const attributeKeys=['wristShotPower','wristShotAccuracy','slapShotPower',
 'slapShotAccuracy','passing','puckControl','deking','handEye','speed',
 'acceleration','agility','balance','endurance','offensiveAwareness',
 'defensiveAwareness','poise','discipline','stickChecking','shotBlocking',
 'bodyChecking','strength','durability','faceoffs'];
for(let t=0;t<8;t++)w.teams[t].roster=Array.from({length:20},(_,i)=>{
 const career=t===0&&i===0,goalie=i===19,potential=career?74:75;
 return{id:career?'fixture-career':`npc-${t}-${i}`,age:16,
  firstName:career?'Synthetic':'Fixture',lastName:'Player',
  isCareerPlayer:career,position:goalie?'G':i%4===0?'D':'RW',
  overall:career?72:62+i%12,potential,
  attributes:Object.fromEntries(attributeKeys.map(k=>[k,65])),
  development:{potential:career?68:potential,
    attributeXP:{speed:career?62:10},attributeUpgradeCounts:{speed:1}},
  seasonStats:{gamesPlayed:0,points:0,minutesPlayed:0},
  highSchoolSeasonHistory:[]};
});
const career=w.teams[0].roster[0];
const real=w.teams[0].roster[1];real.realPlayer=true;
const contaminated=w.teams[0].roster[2];
contaminated.generatedIncomingFreshman=true;
contaminated.incomingClassSeasonId='hs-2025-2026';
contaminated.highSchoolSeasonHistory=[{seasonStartYear:2024,age:15}];
w.externalProspects=copy(app.curated);
w.schedule=[{id:'other-team-game',date:'2025-09-12',type:'game',
 homeTeamId:w.teams[1].teamId,awayTeamId:w.teams[2].teamId,played:false}];
w.persistence={careerId:id,recordId:key,revision:4};
const saved={id:key,careerId:id,revision:4,
  savedAt:'2026-09-24T05:56:01Z',world:w};
fake.addSentinel(dbName,key,saved);
async function run(){
 assert.equal(await app.engine.load(),true,'isolated real production load');
 const before=copy(fake.registry.get(dbName).records.get(key));
 const advance=app.engine.advanceToDate('2025-09-18',{
  maximumDays:21,save:false});
 assert.equal(advance.success,true);
 assert.equal(advance.daysAdvanced,14);
 assert.deepEqual(Array.from(advance.crossedWeeks),[2,3]);
 assert.equal(advance.weeklyProcessingResults.length,2);
 assert.equal(advance.simulationSummary.eventTypes.game,1);
 assert.equal(advance.dateProcessingResults.filter(day=>day.eventResults?.some(
  event=>event.type==='game'&&event.resolved)).length,1);
 assert.equal(app.engine.state.schedule[0].played,true,
  'actual NPC game should be permanently applied in the synthetic world');
 const roster=app.engine.state.teams.flatMap(t=>t.roster||[]);
 assert.equal(roster.length,160);
 assert.equal(app.engine.state.externalProspects.length,191);
 assert(app.engine.state.teams[1].roster.some(p=>p.seasonStats?.gamesPlayed>0),
  'actual simulated game should produce skater statistics');
 assert(app.engine.state.livingWorld.processedWeeks.includes('week:2025-09-08'));
 const date=app.engine.state.season.currentDate,seasonId=app.engine.state.season.seasonId;
 const previousGame=copy(app.engine.state.schedule[0]);
 assert.equal(app.engine.advanceToDate(date,{save:false}).daysAdvanced,0,
  'same-date replay must not duplicate games');
 assert.deepEqual(copy(app.engine.state.schedule[0]),previousGame);
 // This is the exact bridge point: AFTER the production game/calendar week,
 // BEFORE any V2 rating writes. All evaluated objects are detached views.
 const engineBeforeShadow=JSON.stringify(app.engine.state);
 const peers=roster.map(p=>({...p,leagueLevel:'HS'}));
 const reasons={};let proposed=0;
 for(const raw of roster){
  const p={...raw,leagueLevel:'HS'};
  const args={player:p,peers,seasonId,weekKey:date,
   weekNumber:app.engine.state.season.currentWeek,observedGames:0};
  const first=evaluate(args),again=evaluate(args);
  assert.deepEqual(first,again,'pure, deterministic result');
  assert.equal(first.readOnly,true);
  reasons[first.reason||first.status]=(reasons[first.reason||first.status]||0)+1;
  if(first.changeProposed)proposed++;
 }
 assert.deepEqual(reasons,{
  UNRECONCILED_OR_MISSING_POTENTIAL:1,
  REAL_PLAYER_WEEKLY_RERATE_NOT_ENABLED:1,
  UNVERIFIED_ARCHIVED_PLAYER_IDENTITY:1,
  INSUFFICIENT_PLAYER_SAMPLE:157},
  'actual one-game league week cannot prematurely force potential');
 assert.equal(proposed,0);
 assert.equal(JSON.stringify(app.engine.state),engineBeforeShadow,
  'V2 must NEVER mutate actual production state while shadowing');
 assert.deepEqual(fake.registry.get(dbName).records.get(key),before,
  'disposable in-memory game and V2 shadow must not write without save');
 assert.deepEqual(fake.registry.get('projectice_database').records.get(other.id),other);
 // Confirm actual game state can be saved and reloaded ONLY in fake IDB.
 assert.equal(await app.engine.save(),true);
 const persisted=copy(fake.registry.get(dbName).records.get(key));
 assert(persisted.revision>before.revision,'revision must advance monotonically');
 const reboot=sandbox();
 assert.equal(await reboot.engine.load(),true);
 assert.equal(reboot.engine.state.season.currentDate,date);
 assert.equal(reboot.engine.state.schedule[0].played,true);
 assert.equal(reboot.engine.state.teams.flatMap(t=>t.roster).length,160);
 assert.equal(reboot.engine.getCareerPlayer().potential,74);
 assert.equal(reboot.engine.getCareerPlayer().development.potential,68);
 assert.deepEqual(copy(fake.registry.get(dbName).records.get(key)),persisted,
  'repeat boot cannot modify the saved fixture');
 assert(fake.counters.opens.every(n=>n===dbName),
  'every IDB open mapped to disposable adapter');
 assert.deepEqual(fake.registry.get('projectice_database').records.get(other.id),other);
 console.log('PASS: actual WorldEngine 14-day calendar, two crossed weeks, '+
   'NPC game and stats, V2 shadow 160/160, no premature ratings, '+
   'disposable save/reboot, protected database untouched');
 console.log('SHADOW:',JSON.stringify(reasons));
}
run().catch(e=>{console.error(e);process.exitCode=1;});
