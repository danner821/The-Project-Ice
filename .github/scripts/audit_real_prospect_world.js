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
vm.runInContext(`${prospects}\n${world}\n;globalThis.__PI_REAL = REAL_PROSPECTS; globalThis.__PI_WORLD = WorldEngine;`, sandbox, { timeout: 10000 });

const source = sandbox.__PI_REAL;
const engine = sandbox.__PI_WORLD;
const external = engine.getExternalProspects();
const allWorld = engine.getAllWorldPlayers();

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = String(getKey(item));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function range(items, key) {
  const nums = items.map(x => Number(x?.[key])).filter(Number.isFinite);
  return nums.length ? [Math.min(...nums), Math.max(...nums)] : [null, null];
}

const ids = external.map(p => p.id || p.playerId);
const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
const missingAttributes = external.filter(p => !p.attributes || Object.keys(p.attributes).length < 19);
const invalidDraftYears = external.filter(p => ![2027, 2028, 2029, 2030].includes(Number(p.draftYear)));
const invalidPort = external.filter(p => p.portToNhlWorld !== true || p.rankingOnly === true);
const numericPotLeakFields = external.filter(p => !Number.isFinite(Number(p.potential)));
const notInAllWorld = external.filter(p => !allWorld.some(w => String(w.id || w.playerId) === String(p.id || p.playerId)));

const result = {
  sourceCount: source.length,
  externalCount: external.length,
  allWorldCount: allWorld.length,
  classCounts: countBy(external, p => p.draftYear),
  positionCounts: countBy(external, p => String(p.position || '')),
  potentialRoleCounts: countBy(external, p => p.development?.potentialRole || p.potentialRole || p.potentialTier || 'unknown'),
  accuracyCounts: countBy(external, p => p.development?.potentialAccuracy || p.potentialAccuracy || 'unknown'),
  overallRange: range(external, 'overall'),
  potentialRange: range(external, 'potential'),
  realPlayerCount: external.filter(p => p.realPlayer === true).length,
  persistentCount: external.filter(p => p.persistentProspect === true).length,
  portCount: external.filter(p => p.portToNhlWorld === true).length,
  rankingOnlyCount: external.filter(p => p.rankingOnly === true).length,
  duplicateIds,
  missingAttributes: missingAttributes.map(p => p.fullName || p.id),
  invalidDraftYears: invalidDraftYears.map(p => p.fullName || p.id),
  invalidPort: invalidPort.map(p => p.fullName || p.id),
  invalidHiddenPotential: numericPotLeakFields.map(p => p.fullName || p.id),
  notInAllWorld: notInAllWorld.map(p => p.fullName || p.id),
};

console.log(JSON.stringify(result, null, 2));

const failures = [];
if (result.sourceCount !== 150) failures.push(`sourceCount=${result.sourceCount}`);
if (result.externalCount !== 150) failures.push(`externalCount=${result.externalCount}`);
if (JSON.stringify(result.classCounts) !== JSON.stringify({ '2027': 87, '2028': 28, '2029': 3, '2030': 32 })) failures.push('classCounts');
if (result.realPlayerCount !== 150) failures.push(`realPlayerCount=${result.realPlayerCount}`);
if (result.persistentCount !== 150) failures.push(`persistentCount=${result.persistentCount}`);
if (result.portCount !== 150) failures.push(`portCount=${result.portCount}`);
if (result.rankingOnlyCount !== 0) failures.push(`rankingOnlyCount=${result.rankingOnlyCount}`);
if (duplicateIds.length) failures.push('duplicateIds');
if (missingAttributes.length) failures.push('missingAttributes');
if (invalidDraftYears.length) failures.push('invalidDraftYears');
if (invalidPort.length) failures.push('invalidPort');
if (numericPotLeakFields.length) failures.push('invalidHiddenPotential');
if (notInAllWorld.length) failures.push('notInAllWorld');

if (failures.length) {
  console.error('FAILURES:', failures.join(', '));
  process.exit(1);
}
