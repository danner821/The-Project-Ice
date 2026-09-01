const fs = require('fs');
const vm = require('vm');

const prospects = fs.readFileSync('artifacts/project-ice/public/prospects.js', 'utf8');
const world = fs.readFileSync('artifacts/project-ice/public/world.js', 'utf8');
const game = fs.readFileSync('artifacts/project-ice/public/game.js', 'utf8');

const sandbox = {
  console,
  structuredClone,
  Date,
  Math,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Map,
  Set,
  Promise,
  Intl,
  setTimeout,
  clearTimeout,
  localStorage: {
    _data: new Map(),
    getItem(key) { return this._data.has(key) ? this._data.get(key) : null; },
    setItem(key, value) { this._data.set(key, String(value)); },
    removeItem(key) { this._data.delete(key); },
  },
};

vm.createContext(sandbox);
vm.runInContext(`${prospects}\n${world}\n;globalThis.__WORLD = WorldEngine;`, sandbox, { timeout: 20000 });
const engine = sandbox.__WORLD;
const state = engine.state;

state.currentSeason = '2026-27';
if (!state.season || typeof state.season !== 'object') state.season = {};
state.season.label = '2026-27';
state.season.currentDate = '2026-09-10';

const positions = ['LW','C','RW','LW','C','RW','LW','C','RW','LW','C','RW','LD','RD','LD','RD','LD','RD','G','G'];
state.teams.forEach((team, teamIndex) => {
  team.roster = positions.map((position, slotIndex) => ({
    id: `generated-${teamIndex}-${slotIndex}`,
    playerId: `generated-${teamIndex}-${slotIndex}`,
    firstName: `Gen${teamIndex}`,
    lastName: `Player${slotIndex}`,
    position,
    overall: 55 + (slotIndex % 8),
    potential: 75,
    age: 14 + (slotIndex % 4),
    year: ['Freshman','Sophomore','Junior','Senior'][slotIndex % 4],
    teamId: team.teamId,
    rosterSlot: slotIndex < 12
      ? `fwd-${Math.floor(slotIndex / 3) + 1}-${['lw','c','rw'][slotIndex % 3]}`
      : slotIndex < 18
        ? `def-${Math.floor((slotIndex - 12) / 2) + 1}-${(slotIndex - 12) % 2 ? 'rd' : 'ld'}`
        : slotIndex === 18 ? 'g-starter' : 'g-backup',
    realPlayer: false,
    isCareerPlayer: false,
  }));
});

const careerTeam = state.teams[0];
const career = careerTeam.roster[0];
Object.assign(career, {
  id: 'career-player',
  playerId: 'career-player',
  firstName: 'Audit',
  lastName: 'Career',
  isCareerPlayer: true,
  teamId: careerTeam.teamId,
  draftYear: 2027,
  scoutingProfile: { publicRank: 237, previousRank: 241 },
});
state.player = { ...career, highSchoolTeamId: careerTeam.teamId };

// Force the normal external/HS prospect reconciliation once.
engine.getExternalProspects();
const pipelineA = structuredClone(engine.getHighSchoolProspectPipeline());
const rosterSnapshotA = state.teams.map(team =>
  team.roster.map(player => String(player.id || player.playerId || ''))
);
const pipelineB = structuredClone(engine.getHighSchoolProspectPipeline());
const rosterSnapshotB = state.teams.map(team =>
  team.roster.map(player => String(player.id || player.playerId || ''))
);

// Add a temporary Travel adapter containing a generated player and a copied
// canonical player. Neither may create a new master-scouting identity.
state.teams.push({
  teamId: 'travel-audit-adapter',
  travelProfileAdapter: true,
  roster: [
    {
      id: 'travel-generated-audit',
      playerId: 'travel-generated-audit',
      generatedTravelPlayer: true,
      firstName: 'Travel',
      lastName: 'Generated',
      position: 'C',
      overall: 99,
      potential: 99,
    },
    {
      ...career,
      id: 'travel-copy-career',
      playerId: 'travel-copy-career',
      sourcePlayerId: 'career-player',
      isCareerPlayer: true,
    },
  ],
});

const universe = engine.getScoutingProspectUniverse();
const universeIds = universe.map(player => String(player.sourcePlayerId || player.playerId || player.id || ''));
const careerCount = universeIds.filter(id => id === 'career-player').length;
const travelGeneratedPresent = universeIds.includes('travel-generated-audit');

const realHsPlayers = state.teams
  .filter(team => team.travelProfileAdapter !== true)
  .flatMap(team => team.roster.filter(player => player?.realPlayer === true && player?.hsPathProspect === true));
const distribution = state.teams
  .filter(team => team.travelProfileAdapter !== true)
  .map(team => team.roster.filter(player => player?.realPlayer === true && player?.hsPathProspect === true).length);

const sourceMutationRisk = /const sourcePlayer = externalPlayer \|\| \(sourceTemplate \? structuredClone\(sourceTemplate\) : null\)/.test(world);
const frozenCohortContract = /hasLockedMembership/.test(world) && /existing\.locked = true/.test(world);
const explicitRankingApi = /getScoutingProspectUniverse,\s*\n\s*getProspectRankings,/.test(world);
const uiPreservesRank = /preservedCareerRank/.test(game);

const result = {
  universeSize: universe.length,
  careerCount,
  travelGeneratedPresent,
  realHsCount: realHsPlayers.length,
  distribution,
  cohortsStable: JSON.stringify(pipelineA.cohorts) === JSON.stringify(pipelineB.cohorts),
  rosterStableAcrossReads: JSON.stringify(rosterSnapshotA) === JSON.stringify(rosterSnapshotB),
  sourceMutationRiskFixed: sourceMutationRisk,
  frozenCohortContract,
  explicitRankingApi,
  uiPreservesRank,
};

console.log(JSON.stringify(result, null, 2));

const failures = [];
if (careerCount !== 1) failures.push(`career-count=${careerCount}`);
if (travelGeneratedPresent) failures.push('travel-generated-in-scouting-universe');
if (realHsPlayers.length !== 12) failures.push(`real-hs-count=${realHsPlayers.length}`);
if (!distribution.every(count => count >= 1 && count <= 2)) failures.push(`distribution=${distribution.join(',')}`);
if (!result.cohortsStable) failures.push('cohorts-not-stable');
if (!result.rosterStableAcrossReads) failures.push('roster-changed-on-repeat-read');
if (!sourceMutationRisk) failures.push('source-template-not-cloned');
if (!frozenCohortContract) failures.push('cohort-freeze-contract-missing');
if (!explicitRankingApi) failures.push('ranking-api-missing');
if (!uiPreservesRank) failures.push('career-rank-ui-preservation-missing');
if (universe.length <= 100) failures.push(`universe-too-small=${universe.length}`);

if (failures.length) {
  console.error('PROSPECT_INTEGRITY_FAILURES:', failures.join(', '));
  process.exit(1);
}

console.log('PROSPECT_INTEGRITY_AUDIT=PASS');
