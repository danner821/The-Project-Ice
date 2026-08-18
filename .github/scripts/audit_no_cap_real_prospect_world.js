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
vm.runInContext(`${prospects}\n${world}\n;globalThis.__PI_REAL = REAL_PROSPECTS; globalThis.__PI_RULES = PROJECT_ICE_PROSPECT_RULES; globalThis.__PI_WORLD = WorldEngine;`, sandbox, { timeout: 10000 });

const source = sandbox.__PI_REAL;
const rules = sandbox.__PI_RULES;
const engine = sandbox.__PI_WORLD;
const external = engine.getExternalProspects();
const allWorld = engine.getAllWorldPlayers();

const countBy = (items, fn) => items.reduce((acc, item) => {
  const key = String(fn(item));
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const byName = new Map(source.map(p => [String(p.fullName), p]));
const expectedKnownClasses = {
  'Landon DuPont': 2027,
  'Jaxon Jacobson': 2027,
  'Liam Pue': 2028,
  'Maddox Schultz': 2028,
  'Madden Daneault': 2029,
  'Parker McMillan': 2029,
  'Tyson Orr': 2029,
  'RJ Celebrini': 2030,
  'Kale Nicol': 2030,
  'Jack Keiser': 2030,
  'Jack Leibowitz': 2030,
};

const knownClassErrors = Object.entries(expectedKnownClasses)
  .filter(([name, year]) => Number(byName.get(name)?.draftYear) !== year)
  .map(([name, year]) => ({ name, expected: year, actual: byName.get(name)?.draftYear ?? null }));

const classCounts = countBy(source, p => p.draftYear);
const expectedClassCounts = Object.fromEntries(
  Object.entries(rules.researchedClassCounts).map(([year, count]) => [String(year), Number(count)])
);
const ids = source.map(p => String(p.id || p.playerId || ''));
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const missingAttributes = source.filter(p => !p.attributes || Object.keys(p.attributes).length < 19);
const invalidYears = source.filter(p => ![2027, 2028, 2029, 2030].includes(Number(p.draftYear)));
const invalidPersistence = external.filter(p => p.realPlayer !== true || p.persistentProspect !== true || p.portToNhlWorld !== true || p.rankingOnly === true);
const missingFromWorld = source.filter(p => !allWorld.some(w => String(w.id || w.playerId) === String(p.id || p.playerId)));

const result = {
  sourceCount: source.length,
  minimumCount: rules.minimumRealProspectCount,
  externalCount: external.length,
  allWorldCount: allWorld.length,
  classCounts,
  expectedClassCounts,
  knownClassErrors,
  duplicateIds,
  missingAttributeCount: missingAttributes.length,
  invalidYearCount: invalidYears.length,
  invalidPersistenceCount: invalidPersistence.length,
  missingFromWorldCount: missingFromWorld.length,
  realPlayerCount: source.filter(p => p.realPlayer === true).length,
  persistentCount: source.filter(p => p.persistentProspect === true).length,
  portCount: source.filter(p => p.portToNhlWorld === true).length,
};

console.log(JSON.stringify(result, null, 2));

const failures = [];
if (source.length < Number(rules.minimumRealProspectCount || 150)) failures.push('belowMinimumCount');
if (external.length !== source.length) failures.push(`externalCount=${external.length}`);
if (JSON.stringify(classCounts) !== JSON.stringify(expectedClassCounts)) failures.push('classCountsMismatch');
if (knownClassErrors.length) failures.push('knownClassErrors');
if (duplicateIds.length) failures.push('duplicateIds');
if (missingAttributes.length) failures.push('missingAttributes');
if (invalidYears.length) failures.push('invalidYears');
if (invalidPersistence.length) failures.push('invalidPersistence');
if (missingFromWorld.length) failures.push('missingFromWorld');
if (result.realPlayerCount !== source.length) failures.push('realPlayerCount');
if (result.persistentCount !== source.length) failures.push('persistentCount');
if (result.portCount !== source.length) failures.push('portCount');

if (failures.length) {
  console.error('FAILURES:', failures.join(', '));
  process.exit(1);
}
