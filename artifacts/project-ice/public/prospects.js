/*
============================================================
PROJECT ICE — REAL PROSPECT DATABASE
Research refresh: August 2026

IMPORTANT ARCHITECTURE CONTRACT

- The full prospect-ranking experience can show draft classes from 2024 on.
- Only REAL prospects in the 2027–2030 classes are persistent future-world
  players and are eligible to port into Project Ice's eventual NHL world.
- 2024–2026 ranking players are historical/bridge context only and must never
  become NHL-world players later.
- Project Ice begins early enough in the career timeline that the 2027 class is
  the freshman-era class. A prospect's REAL biography is therefore stored
  separately from their Project Ice starting age/year.
- Ratings, attributes, potential and development seeds are Project Ice
  game-balance evaluations. They are NOT official real-world ratings.
- Real biography fields should be sourced from real player data; unknown data
  stays null rather than being invented.
============================================================
*/

'use strict';

/* global REAL_PROSPECTS, PROJECT_ICE_PROSPECT_RULES */

const PROJECT_ICE_PROSPECT_RULES = Object.freeze({
  rankingStartDraftYear: 2024,
  persistentRealDraftYears: Object.freeze([2027, 2028, 2029, 2030]),
  nhlPortMinimumDraftYear: 2027,
  nhlPortMaximumDraftYear: 2030,
  prePersistentClassesAreRankingOnly: true,

  /*
   * Project Ice historical starting-state contract.
   * 2027 is the career player's freshman-era draft class.
   */
  projectIceStartAgeByDraftYear: Object.freeze({
    2027: 14,
    2028: 13,
    2029: 12,
    2030: 11,
  }),

  projectIceClassLabelByDraftYear: Object.freeze({
    2027: 'Freshman',
    2028: 'Pre-HS',
    2029: 'Pre-HS',
    2030: 'Pre-HS',
  }),
});

function normalizeProspectPosition(position) {
  const raw = String(position || 'F').toUpperCase();
  if (raw === 'G') return 'G';
  if (raw === 'D' || raw === 'LD' || raw === 'RD') return 'D';
  if (raw.includes('C')) return 'C';
  if (raw.includes('RW')) return 'RW';
  if (raw.includes('LW')) return 'LW';
  return 'F';
}

function getProspectPotentialTier(position, potential) {
  const pos = normalizeProspectPosition(position);
  const value = Number(potential) || 75;

  if (value >= 96) return 'Franchise';
  if (value >= 90) return 'Elite';

  if (pos === 'D') {
    if (value >= 84) return 'Top 4 D';
    if (value >= 78) return 'Top 6 D';
    return 'Depth D';
  }

  if (pos === 'G') {
    if (value >= 84) return 'Starter';
    if (value >= 78) return 'Fringe Starter';
    return 'Backup';
  }

  if (value >= 84) return 'Top 6 F';
  if (value >= 78) return 'Top 9 F';
  return 'Bottom 6 F';
}

/*
 * Existing seed players are retained while the researched 150-player database
 * is populated in class batches. Every entry now obeys the permanent prospect
 * contract so it can safely migrate into canonical world state later.
 */
const REAL_PROSPECTS = [
  {
    id: 'real-landon-dupont',
    firstName: 'Landon',
    lastName: 'DuPont',
    position: 'D',
    currentTeam: 'Everett Silvertips',
    teamAbbreviation: 'EVT',
    league: 'WHL',
    draftYear: 2027,

    birthDate: '2009-05-28',
    nationality: 'Canada',
    height: "6'0\"",
    weightLbs: 190,
    shoots: 'R',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 70,
    potential: 96,
    potentialTier: 'Franchise',
    potentialConfidence: 58,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 5,
    reputationPoints: 98,
    developmentSeed: 0.91,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-milan-sundstrom',
    firstName: 'Milan',
    lastName: 'Sundström',
    position: 'C',
    currentTeam: 'MoDo Hockey U20',
    teamAbbreviation: 'MODO',
    league: 'U20 Nationell',
    draftYear: 2027,

    birthDate: '2009-05-06',
    nationality: 'Sweden',
    height: "6'3\"",
    weightLbs: 196,
    shoots: 'L',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 67,
    potential: 93,
    potentialTier: 'Elite',
    potentialConfidence: 52,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 4,
    reputationPoints: 88,
    developmentSeed: 0.86,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-nazar-privalov',
    firstName: 'Nazar',
    lastName: 'Privalov',
    position: 'C/LW',
    currentTeam: 'Krasnaya Armiya Moskva',
    teamAbbreviation: 'KAM',
    league: 'MHL',
    draftYear: 2027,

    birthDate: '2009-05-25',
    nationality: 'Russia',
    height: "6'4\"",
    weightLbs: 227,
    shoots: 'L',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 67,
    potential: 92,
    potentialTier: 'Elite',
    potentialConfidence: 50,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 4,
    reputationPoints: 86,
    developmentSeed: 0.82,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-jaxon-jacobson',
    firstName: 'Jaxon',
    lastName: 'Jacobson',
    position: 'C',
    currentTeam: 'Brandon Wheat Kings',
    teamAbbreviation: 'BDN',
    league: 'WHL',
    draftYear: 2027,

    birthDate: '2008-12-11',
    nationality: 'Canada',
    height: "5'10\"",
    weightLbs: 183,
    shoots: 'L',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 67,
    potential: 92,
    potentialTier: 'Elite',
    potentialConfidence: 52,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 4,
    reputationPoints: 84,
    developmentSeed: 0.84,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-dima-zhilkin',
    firstName: 'Dima',
    lastName: 'Zhilkin',
    position: 'RW',
    currentTeam: 'Saginaw Spirit',
    teamAbbreviation: 'SAG',
    league: 'OHL',
    draftYear: 2027,

    birthDate: '2008-10-21',
    nationality: 'Canada',
    height: "5'10\"",
    weightLbs: 185,
    shoots: 'R',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 66,
    potential: 91,
    potentialTier: 'Elite',
    potentialConfidence: 50,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 4,
    reputationPoints: 82,
    developmentSeed: 0.80,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-max-calce',
    firstName: 'Max',
    lastName: 'Calce',
    position: 'C',
    currentTeam: 'Jungadler Mannheim U20',
    teamAbbreviation: 'MAN',
    league: 'DNL U20',
    draftYear: 2027,

    birthDate: '2009-06-11',
    nationality: 'Germany',
    height: "5'11\"",
    weightLbs: 181,
    shoots: 'L',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 64,
    potential: 88,
    potentialTier: 'Top 6 F',
    potentialConfidence: 46,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 4,
    reputationPoints: 78,
    developmentSeed: 0.79,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-levi-harper',
    firstName: 'Levi',
    lastName: 'Harper',
    position: 'D',
    currentTeam: 'Saginaw Spirit',
    teamAbbreviation: 'SAG',
    league: 'OHL',
    draftYear: 2027,

    birthDate: '2008-10-03',
    nationality: 'USA',
    height: "5'11\"",
    weightLbs: 174,
    shoots: 'R',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 64,
    potential: 88,
    potentialTier: 'Top 4 D',
    potentialConfidence: 45,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 3,
    reputationPoints: 72,
    developmentSeed: 0.78,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-kohyn-eshkawkogan',
    firstName: 'Kohyn',
    lastName: 'Eshkawkogan',
    position: 'D',
    currentTeam: "Ottawa 67's",
    teamAbbreviation: 'OTT',
    league: 'OHL',
    draftYear: 2027,

    birthDate: '2008-11-19',
    nationality: 'Canada',
    height: "5'11\"",
    weightLbs: 183,
    shoots: 'R',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 64,
    potential: 88,
    potentialTier: 'Top 4 D',
    potentialConfidence: 45,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 3,
    reputationPoints: 71,
    developmentSeed: 0.81,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-jamie-glance',
    firstName: 'Jamie',
    lastName: 'Glance',
    position: 'RW/C',
    currentTeam: 'U.S. National U18 Team',
    teamAbbreviation: 'NTDP',
    league: 'NTDP',
    draftYear: 2027,

    birthDate: '2008-09-23',
    nationality: 'USA',
    height: "5'11\"",
    weightLbs: 183,
    shoots: 'R',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 63,
    potential: 87,
    potentialTier: 'Top 6 F',
    potentialConfidence: 44,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 3,
    reputationPoints: 69,
    developmentSeed: 0.76,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-noah-davidson',
    firstName: 'Noah',
    lastName: 'Davidson',
    position: 'F',
    currentTeam: 'Medicine Hat Tigers',
    teamAbbreviation: 'MH',
    league: 'WHL',
    draftYear: 2027,

    birthDate: '2008-11-01',
    nationality: 'USA',
    height: "6'3\"",
    weightLbs: 216,
    shoots: 'L',

    age: 14,
    year: 'Freshman',
    realWorldAgeSnapshot: 17,

    overall: 63,
    potential: 86,
    potentialTier: 'Top 6 F',
    potentialConfidence: 43,
    potentialAccuracy: 'Medium',
    potentialTrend: 'Stable',

    reputationStars: 3,
    reputationPoints: 67,
    developmentSeed: 0.75,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'High',
  },

  {
    id: 'real-liam-pue',
    firstName: 'Liam',
    lastName: 'Pue',
    position: 'F',
    currentTeam: 'Regina Pat Canadians U18 AAA',
    teamAbbreviation: 'RPC',
    league: 'SMAAAHL',
    draftYear: 2028,

    birthDate: '2010-02-16',
    nationality: 'Canada',
    height: "6'2\"",
    weightLbs: 176,
    shoots: 'R',

    age: 13,
    year: 'Pre-HS',
    realWorldAgeSnapshot: 16,

    overall: 62,
    potential: 92,
    potentialTier: 'Elite',
    potentialConfidence: 38,
    potentialAccuracy: 'Low',
    potentialTrend: 'Stable',

    reputationStars: 3,
    reputationPoints: 65,
    developmentSeed: 0.88,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'Medium',
  },

  {
    id: 'real-maddox-schultz',
    firstName: 'Maddox',
    lastName: 'Schultz',
    position: 'F',
    currentTeam: 'Regina Pat Canadians U18 AAA',
    teamAbbreviation: 'RPC',
    league: 'SMAAAHL',
    draftYear: 2028,

    birthDate: '2010-03-15',
    nationality: 'Canada',
    height: "5'10\"",
    weightLbs: 181,
    shoots: 'L',

    age: 13,
    year: 'Pre-HS',
    realWorldAgeSnapshot: 16,

    overall: 62,
    potential: 92,
    potentialTier: 'Elite',
    potentialConfidence: 38,
    potentialAccuracy: 'Low',
    potentialTrend: 'Stable',

    reputationStars: 3,
    reputationPoints: 64,
    developmentSeed: 0.87,

    persistentProspect: true,
    portToNhlWorld: true,
    rankingOnly: false,
    realPlayer: true,
    dataConfidence: 'Medium',
  },
];

/* Ensure every current/future entry obeys the permanent class contract. */
REAL_PROSPECTS.forEach(player => {
  const draftYear = Number(player.draftYear);
  player.age = PROJECT_ICE_PROSPECT_RULES.projectIceStartAgeByDraftYear[draftYear] ?? player.age;
  player.year = PROJECT_ICE_PROSPECT_RULES.projectIceClassLabelByDraftYear[draftYear] ?? player.year;
  player.realPlayer = true;
  player.persistentProspect = PROJECT_ICE_PROSPECT_RULES.persistentRealDraftYears.includes(draftYear);
  player.portToNhlWorld =
    draftYear >= PROJECT_ICE_PROSPECT_RULES.nhlPortMinimumDraftYear &&
    draftYear <= PROJECT_ICE_PROSPECT_RULES.nhlPortMaximumDraftYear;
  player.rankingOnly = !player.portToNhlWorld;
  player.potentialTier = player.potentialTier || getProspectPotentialTier(player.position, player.potential);
});