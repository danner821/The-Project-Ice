const fs = require('fs');
const vm = require('vm');

const prospects = fs.readFileSync('artifacts/project-ice/public/prospects.js', 'utf8');
const world = fs.readFileSync('artifacts/project-ice/public/world.js', 'utf8');

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
vm.runInContext(`${prospects}\n${world}\n;globalThis.__WORLD = WorldEngine;`, sandbox, { timeout: 15000 });
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
    rosterSlot: `slot-${slotIndex}`,
    jerseyNumber: slotIndex + 1,
    realPlayer: false,
    isCareerPlayer: false,
  }));
});

const rosterSizesBefore = state.teams.map(team => team.roster.length);
const externalBefore = engine.getExternalProspects().length;
const pipeline = engine.getHighSchoolProspectPipeline();
const allPlayers = engine.getAllWorldPlayers();
const rosterSizesAfter = state.teams.map(team => team.roster.length);
const realHsPlayers = state.teams.flatMap(team => team.roster.filter(player => player?.realPlayer === true && player?.hsPathProspect === true));
const realHsIds = new Set(realHsPlayers.map(player => String(player.id || player.playerId)));
const externalAfter = engine.getExternalProspects();
const duplicateExternal = externalAfter.filter(player => realHsIds.has(String(player.id || player.playerId)));

const teamDistribution = state.teams.map(team => ({
  teamId: team.teamId,
  realHsCount: team.roster.filter(player => player?.realPlayer === true && player?.hsPathProspect === true).length,
  rosterSize: team.roster.length,
}));

const cohortCounts = {};
for (const [year, cohort] of Object.entries(pipeline.cohorts || {})) {
  cohortCounts[year] = Array.isArray(cohort.playerIds) ? cohort.playerIds.length : 0;
}

const futureRostered = realHsPlayers.filter(player => Number(player.draftYear) > 2027);
const current2027 = realHsPlayers.filter(player => Number(player.draftYear) === 2027);
const currentAllWorldCopies = current2027.map(player => ({
  id: player.id,
  copies: allPlayers.filter(item => String(item.id || item.playerId) === String(player.id || player.playerId)).length,
}));

const result = {
  rosterSizesBefore,
  rosterSizesAfter,
  externalBefore,
  externalAfter: externalAfter.length,
  cohortCounts,
  realHsCount: realHsPlayers.length,
  current2027Count: current2027.length,
  futureRosteredCount: futureRostered.length,
  duplicateExternalCount: duplicateExternal.length,
  teamDistribution,
  currentAllWorldCopies,
  sample2027: current2027.map(player => ({
    id: player.id,
    name: `${player.firstName || ''} ${player.lastName || ''}`.trim(),
    draftYear: player.draftYear,
    teamId: player.teamId,
    rosterSlot: player.rosterSlot,
    currentTeam: player.currentTeam,
    realTeamSnapshot: player.realTeamSnapshot,
  })),
};

console.log(JSON.stringify(result, null, 2));

const failures = [];
if (rosterSizesAfter.some((size, i) => size !== rosterSizesBefore[i])) failures.push('roster-size-changed');
if (current2027.length !== Math.min(12, cohortCounts['2027'] || 0)) failures.push(`2027-rostered=${current2027.length}`);
if (futureRostered.length !== 0) failures.push(`future-rostered=${futureRostered.length}`);
if (duplicateExternal.length !== 0) failures.push(`external-duplicates=${duplicateExternal.length}`);
if (currentAllWorldCopies.some(item => item.copies !== 1)) failures.push('canonical-duplicate');
if (!teamDistribution.every(team => team.realHsCount >= 1 && team.realHsCount <= 2)) failures.push('team-distribution');
if ((cohortCounts['2027'] || 0) !== 12) failures.push(`2027-cohort=${cohortCounts['2027']}`);
if ((cohortCounts['2028'] || 0) !== 12) failures.push(`2028-cohort=${cohortCounts['2028']}`);
if ((cohortCounts['2029'] || 0) !== 3) failures.push(`2029-cohort=${cohortCounts['2029']}`);
if ((cohortCounts['2030'] || 0) !== 12) failures.push(`2030-cohort=${cohortCounts['2030']}`);

if (failures.length) {
  console.error('FAILURES:', failures.join(', '));
  process.exit(1);
}
