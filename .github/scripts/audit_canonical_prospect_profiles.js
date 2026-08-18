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
vm.runInContext(`${prospects}\n${world}\n;globalThis.__PI_WORLD = WorldEngine;`, sandbox, { timeout: 10000 });
const engine = sandbox.__PI_WORLD;

const dupont = engine.getPlayerById('real-landon-dupont');
const goalie = engine.getExternalProspects().find(p => String(p.position).toUpperCase() === 'G');

function profileContract(player) {
  if (!player) return null;
  return {
    id: player.id || player.playerId,
    name: `${player.firstName || ''} ${player.lastName || ''}`.trim(),
    position: player.position,
    draftYear: player.draftYear,
    team: player.currentTeam || player.realTeamSnapshot || player.teamName || null,
    league: player.league || player.realLeagueSnapshot || null,
    height: player.height || null,
    weightLbs: Number(player.weightLbs ?? player.weight) || null,
    shoots: player.shoots || null,
    catches: player.catches || null,
    overall: Number(player.overall) || null,
    potentialRole: player.development?.potentialRole || player.potentialRole || player.potentialTier || null,
    potentialAccuracy: player.development?.potentialAccuracy || player.potentialAccuracy || player.scoutingProfile?.evaluationAccuracy || null,
    attributeCount: player.attributes ? Object.keys(player.attributes).length : 0,
    canonicalLookupSameObject: engine.getPlayerById(player.id || player.playerId) === player,
  };
}

const result = {
  dupont: profileContract(dupont),
  goalie: profileContract(goalie),
};
console.log(JSON.stringify(result, null, 2));

const failures = [];
if (!dupont) failures.push('dupont missing');
if (!result.dupont?.canonicalLookupSameObject) failures.push('dupont lookup not canonical');
if (!result.dupont?.team || !result.dupont?.league) failures.push('dupont context missing');
if (!result.dupont?.weightLbs) failures.push('dupont weight missing');
if ((result.dupont?.attributeCount || 0) < 20) failures.push('dupont attributes incomplete');
if (!goalie) failures.push('goalie missing');
if (!result.goalie?.canonicalLookupSameObject) failures.push('goalie lookup not canonical');
if (!result.goalie?.team || !result.goalie?.league) failures.push('goalie context missing');
if ((result.goalie?.attributeCount || 0) < 19) failures.push('goalie attributes incomplete');

if (failures.length) {
  console.error('FAILURES:', failures.join(', '));
  process.exit(1);
}
