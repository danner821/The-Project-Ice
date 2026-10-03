'use strict';

/*
 * Potential V2 74/68 provenance audit.
 *
 * Synthetic mode (CI): validates the historical source fingerprints that
 * created the split and replays their data-flow without touching IndexedDB.
 *
 * Optional private mode:
 *   node tools/potential-v2-root-cause-provenance.test.js /private/backup.json
 *
 * Private output is aggregate only. Never commit the backup or its output.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const cp=require('node:child_process');

const WORLD='artifacts/project-ice/public/world.js';
const GAME='artifacts/project-ice/public/game.js';
const TRAVEL='artifacts/project-ice/public/travel-hockey-canonical-ui.js';

const WEEKLY_REF='4466aa38f66e';
const TRAVEL_REF='6001bc38345c';
const PREFX_REF='43f1f259a494';

function show(ref,file){
  return cp.execFileSync('git',['show',ref+':'+file],{encoding:'utf8',maxBuffer:32*1024*1024});
}
function section(source,startNeedle,endNeedle){
  const start=source.indexOf(startNeedle);
  assert(start>=0,'missing source marker: '+startNeedle);
  const end=endNeedle?source.indexOf(endNeedle,start+startNeedle.length):-1;
  return source.slice(start,end>start?end:source.length);
}

/* Historical source proof. */
const weekly=show(WEEKLY_REF,WORLD);
const evaluate=section(weekly,'  function evaluatePlayerPotentialWeek(', '\n  function processPotentialWeek(');
assert.match(evaluate,/development\.potential\s*\?\?\s*player\.potential/);
assert.match(evaluate,/evidence\.overall\s*\+\s*\(evidence\.age\s*<=\s*23\s*\?\s*2\s*:\s*0\)/);
assert.match(evaluate,/development\.potential\s*=\s*newPotential/);
assert.match(evaluate,/player\.potential\s*=\s*newPotential/);

const travel=show(TRAVEL_REF,TRAVEL);
const travelSync=section(travel,'  function syncCareer()', '\n  const originalSelect');
assert.match(travelSync,/['"]potential['"]/);
assert.doesNotMatch(travelSync,/['"]development['"]/,
  'historical Travel root sync intentionally did not copy development');

const preFixGame=show(PREFX_REF,GAME);
const oldSync=section(preFixGame,'function syncCareerPlayerWithWorld()', '\n/*\n * ============================================================\n * CAREER LOAD');
assert.match(oldSync,/WorldEngine\.getPlayerById\(\s*careerPlayerId\s*\)/);
assert.doesNotMatch(oldSync,/WorldEngine\s*\.getCareerPlayer/,
  'pre-fix sync had no permanent career-player fallback');
assert.match(oldSync,/WorldEngine\.upsertCareerPlayer\(\{\s*\.\.\.Game\.player/s);

const preFixWorld=show(PREFX_REF,WORLD);
const defaultDev=section(preFixWorld,'  function createDefaultDevelopmentState(', '\n  function createDefaultHealthState(');
assert.match(defaultDev,/Number\(player\.potential\)\s*\|\|\s*\n?\s*Number\(player\.overall\)/);
const contract=section(preFixWorld,'  function ensureCanonicalPlayerContract(', '\n  function getPlayerDevelopmentStage(');
assert.match(contract,/\.\.\.defaultDevelopment,[\s\S]*\.\.\.\(player\.development\s*\|\|\s*\{\}\)/);
const upsert=section(preFixWorld,'  function upsertCareerPlayer(', '\n  // ── Public API');
assert.match(upsert,/playerData\.playerId\s*\|\|\s*\n?\s*playerData\.id\s*\|\|\s*\n?\s*['"]career-player['"]/);
assert.match(upsert,/development:\s*\{\s*\.\.\.\(playerData\.development\s*\|\|\s*\{\}\)/);
assert.match(upsert,/ensureCanonicalPlayerContract\(\s*careerPlayer\s*\)/);

/* Current source proves the identity reset path is now closed. */
const currentGame=fs.readFileSync(GAME,'utf8');
const currentSync=section(currentGame,'function syncCareerPlayerWithWorld()', '\n/*\n * ============================================================\n * CAREER LOAD');
assert.match(currentSync,/WorldEngine\s*\.getCareerPlayer/);
const currentWorld=fs.readFileSync(WORLD,'utf8');
assert.match(currentWorld,/getCareerPlayer:\s*\(\)\s*=>\s*\n?\s*getCareerRosterPlayerFromWorldState\(\)/);

/*
 * Causal replay of the verified historical field ownership:
 * 1) nested development was seeded from starting OVR when root potential was absent;
 * 2) old weekly code forced young-player minimum POT = OVR + 2;
 * 3) Travel root sync copied potential but not development;
 * 4) pre-fix identity fallback could rebuild from that split Game snapshot;
 * 5) canonicalization let stale nested development override the root-derived default.
 */
function canonicalize(snapshot){
  const copy=structuredClone(snapshot);
  const defaultPotential=Math.max(25,Math.min(99,
    Number(copy.potential)||Number(copy.overall)||60));
  copy.development={
    potential:defaultPotential,
    ...(copy.development||{})
  };
  return copy;
}
function weeklyFloor(player){
  const next=structuredClone(player);
  const old=Number(next.development?.potential??next.potential??next.overall);
  const floor=Math.min(99,Math.max(25,Number(next.overall)+(Number(next.age)<=23?2:0)));
  const result=Math.max(floor,Math.min(99,old));
  next.development.potential=result;
  next.potential=result;
  return {old,floor,result,next};
}
function travelRootOnlySync(source,ui){
  const merged={...structuredClone(ui)};
  for(const key of ['playerId','id','firstName','lastName','position','overall','age','potential']){
    if(source[key]!==undefined&&source[key]!==null&&source[key]!=='') merged[key]=structuredClone(source[key]);
  }
  return merged;
}
function preFixFallbackRebuild(gameSnapshot){
  return canonicalize({
    ...structuredClone(gameSnapshot),
    id:'career-player',
    playerId:'career-player',
    isCareerPlayer:true
  });
}

const initial=canonicalize({age:16,overall:68,startingOverall:68});
assert.equal(initial.development.potential,68,'initial nested seed follows OVR when no root POT existed');

let ui={age:16,overall:71,potential:71,development:{potential:68}};
let canonical={...structuredClone(ui),development:{potential:68}};
let first=weeklyFloor(canonical);
assert.deepEqual({old:first.old,floor:first.floor,result:first.result},{old:68,floor:73,result:73});
ui=travelRootOnlySync(first.next,ui);
assert.equal(ui.potential,73);
assert.equal(ui.development.potential,68,'root-only Travel sync leaves stale nested projection');
canonical=preFixFallbackRebuild(ui);
assert.equal(canonical.potential,73);
assert.equal(canonical.development.potential,68,'fallback rebuild recreates split');

canonical.overall=72;
ui.overall=72;
let second=weeklyFloor(canonical);
assert.deepEqual({old:second.old,floor:second.floor,result:second.result},{old:68,floor:74,result:74});
ui=travelRootOnlySync(second.next,ui);
canonical=preFixFallbackRebuild(ui);
assert.equal(canonical.potential,74);
assert.equal(canonical.development.potential,68,'the same reset can repeat after OVR reaches 72');

function analyzePrivate(file){
  const before=fs.readFileSync(file);
  const sourceHash=crypto.createHash('sha256').update(before).digest('hex');
  const backup=JSON.parse(before);
  const world=backup?.activeRecord?.world;
  assert(world&&Array.isArray(world.teams),'valid private world required');
  const roster=world.teams.flatMap(team=>team.roster||[]);
  const careers=roster.filter(p=>p?.isCareerPlayer===true);
  assert.equal(careers.length,1,'exactly one career roster record');
  const p=careers[0],d=p.development||{};
  assert.equal(Number(p.startingOverall),68);
  assert.equal(Number(p.potential),74);
  assert.equal(Number(d.potential),68);
  assert.equal((d.potentialHistory||[]).length,0);

  const archives=world?.history?.highSchoolSeasons||[];
  const archivePairs=archives.map(a=>[
    Number(a?.careerPlayer?.overall),
    Number(a?.careerPlayer?.potential)
  ]);
  assert.deepEqual(archivePairs.slice(-2),[[69,71],[72,74]],
    'archived root projection follows OVR+2 in the two completed seasons');

  const ids=new Set([p.id,p.playerId].filter(Boolean).map(String));
  const beats=(world?.livingWorld?.recentBeats||[]).filter(b=>
    b?.type==='potential_update'&&ids.has(String(b?.playerId||'')));
  assert.equal(beats.length,20);
  assert(beats.every(b=>Number(b.from)===68),'all saved weekly updates restart from stale 68');

  const upgrades=(d.developmentHistory||[])
    .filter(e=>e?.date&&Number.isFinite(Number(e?.overallAfter)))
    .slice()
    .sort((a,b)=>String(a.date).localeCompare(String(b.date))||
      String(a.id||'').localeCompare(String(b.id||'')));
  function ovrAt(date){
    let value=Number(p.startingOverall)||Number(p.overall)||0;
    for(const e of upgrades){
      if(String(e.date)>String(date)) break;
      value=Number(e.overallAfter);
    }
    return value;
  }
  const floorMatches=beats.filter(b=>
    Number(b.to)===Math.min(99,Math.max(25,ovrAt(b.date)+2))).length;
  assert.equal(floorMatches,beats.length,
    'every saved legacy potential update exactly equals young-player OVR+2 floor');
  assert.deepEqual(beats.slice(0,2).map(b=>Number(b.to)),[73,73]);
  assert(beats.slice(2).every(b=>Number(b.to)===74));

  const after=fs.readFileSync(file);
  assert.equal(crypto.createHash('sha256').update(after).digest('hex'),sourceHash,
    'private backup bytes unchanged');

  console.log(JSON.stringify({
    status:'PASS',
    readOnly:true,
    rosterPlayers:roster.length,
    archivedSeasonPairs:archivePairs.slice(-2),
    currentRootPotential:Number(p.potential),
    currentNestedPotential:Number(d.potential),
    savedPotentialHistoryEntries:(d.potentialHistory||[]).length,
    careerPotentialUpdateBeats:beats.length,
    updatesRestartingFrom68:beats.filter(b=>Number(b.from)===68).length,
    exactOvrPlusTwoFloorMatches:floorMatches,
    sourceFileUnmodified:true
  },null,2));
}

if(process.argv[2]) analyzePrivate(process.argv[2]);
console.log('PASS: historical source fingerprints and synthetic 68 -> floor -> stale-reset causal replay');
