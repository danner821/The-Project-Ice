const fs = require('fs');
const vm = require('vm');

const storage = new Map();
const context = {
  console: {
    log: (...args) => console.log(...args),
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => {
      if (String(args[0] || '').includes('[WorldEngine] IndexedDB save failed')) {
        return;
      }
      console.error(...args);
    },
  },
  structuredClone: global.structuredClone,
  setTimeout: () => 0,
  clearTimeout: () => {},
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  },
  indexedDB: {
    open() {
      throw new Error('IndexedDB is not used by this diagnostic.');
    },
  },
};

vm.createContext(context);
vm.runInContext(
  `${fs.readFileSync('artifacts/project-ice/public/world.js', 'utf8')}\nthis.__WorldEngine = WorldEngine;`,
  context,
  { filename: 'world.js' }
);

const engine = context.__WorldEngine;
const state = engine.state;
const attributes = {
  speed: 70,
  acceleration: 70,
  agility: 70,
  balance: 70,
  endurance: 70,
  wristShotPower: 70,
  wristShotAccuracy: 70,
  slapShotPower: 70,
  slapShotAccuracy: 70,
  passing: 70,
  puckControl: 70,
  deking: 70,
  handEye: 70,
  offensiveAwareness: 70,
  defensiveAwareness: 70,
  stickChecking: 70,
  shotBlocking: 70,
  discipline: 70,
  bodyChecking: 70,
  strength: 70,
  durability: 70,
  vision: 70,
  leadership: 70,
  poise: 70,
};

const canonical = {
  id: 'real-danner-id',
  playerId: 'real-danner-id',
  firstName: 'Danner',
  lastName: 'Stephenson',
  position: 'LW',
  teamId: 'hs-team',
  attributes: { ...attributes },
  isCareerPlayer: true,
  development: { attributeXP: {} },
  gameLog: [],
};

const travelCopy = {
  ...structuredClone(canonical),
  id: undefined,
  playerId: 'prospect:temporary-danner',
  sourcePlayerId: null,
  teamId: 'travel-team',
  development: { attributeXP: {} },
  gameLog: [],
};

state.player = {
  firstName: 'Danner',
  lastName: 'Stephenson',
  position: 'LW',
  teamId: 'hs-team',
  highSchoolTeamId: 'hs-team',
  attributes: { ...attributes },
  stage: 'hub',
  tryoutsComplete: true,
};
state.teams = [{
  teamId: 'hs-team',
  schoolName: 'Colorado',
  teamName: 'Thunderbirds',
  roster: [canonical],
}];
state.travelHockey = {
  teams: [{ teamId: 'travel-team', roster: [travelCopy] }],
};
state.schedule = [{
  id: 'travel-game-1',
  gameId: 'travel-game-1',
  date: '2027-06-07',
  completed: true,
  played: true,
  travelTournament: true,
  gameResult: {
    gameId: 'travel-game-1',
    date: '2027-06-07',
    winnerTeamId: 'travel-opponent',
    loserTeamId: 'travel-team',
    home: {
      teamId: 'travel-team',
      score: 2,
      skaters: [{
        playerId: 'prospect:temporary-danner',
        gamesPlayed: 1,
        dressed: true,
        goals: 0,
        assists: 0,
        shots: 3,
        plusMinus: -2,
        penaltyMinutes: 2,
        hits: 1,
        blockedShots: 0,
        takeaways: 0,
        giveaways: 0,
      }],
      goalies: [],
    },
    away: {
      teamId: 'travel-opponent',
      score: 4,
      skaters: [],
      goalies: [],
    },
  },
}];

const repaired = engine.repairCompletedGameDevelopment(
  'travel-game-1',
  { save: false }
);

const awarded = Object.values(canonical.development.attributeXP || {})
  .reduce((sum, value) => sum + Number(value || 0), 0);

// Execute the real game.js synchronization function used before rendering.
engine.save = () => true;
context.Game = { player: { ...state.player } };
const gameSource = fs.readFileSync(
  'artifacts/project-ice/public/game.js',
  'utf8'
);
const syncStart = gameSource.indexOf(
  'function syncCareerPlayerWithWorld()'
);
const syncEnd = gameSource.indexOf(
  '/*\n * ============================================================\n * CAREER LOAD — SCHEDULE MIGRATION',
  syncStart
);

if (syncStart < 0 || syncEnd < 0) {
  throw new Error('Could not extract syncCareerPlayerWithWorld from game.js.');
}

vm.runInContext(
  `${gameSource.slice(syncStart, syncEnd)}\nthis.__syncCareerPlayerWithWorld = syncCareerPlayerWithWorld;`,
  context,
  { filename: 'game-sync.js' }
);

const uiPlayer = context.__syncCareerPlayerWithWorld();
const displayed = Object.values(uiPlayer?.development?.attributeXP || {})
  .reduce((sum, value) => sum + Number(value || 0), 0);

const careerPlayers = state.teams
  .flatMap(team => team.roster || [])
  .filter(player => player?.isCareerPlayer === true);

state.travelHockey = {
  placementLevel: 'A',
  playerTeamId: 'travel-team',
  teams: [{
    teamId: 'travel-team',
    clubId: 'colorado-thunderbirds',
    roster: [],
  }],
};

vm.runInContext(
  fs.readFileSync(
    'artifacts/project-ice/public/travel-hockey-roster-world.js',
    'utf8'
  ),
  context,
  { filename: 'travel-hockey-roster-world.js' }
);

engine.rebuildTravelHockeyRosters();

const rebuiltTravelCareer = state.travelHockey.teams
  .flatMap(team => team.roster || [])
  .find(player => player?.isCareerPlayer === true);

console.log(JSON.stringify({
  repairSuccess: repaired?.success === true,
  awardedToCanonical: awarded,
  displayedByPlayerTabSource: displayed,
  canonicalPlayerId: canonical.playerId,
  playerTabPlayerId: uiPlayer?.playerId || uiPlayer?.id || null,
  careerPlayerCount: careerPlayers.length,
  rebuiltTravelPlayerId:
    rebuiltTravelCareer?.playerId ||
    rebuiltTravelCareer?.id ||
    null,
}, null, 2));

if (!(
  repaired?.success === true &&
  awarded > 0 &&
  displayed === awarded &&
  uiPlayer === canonical &&
  state.player.playerId === canonical.playerId &&
  careerPlayers.length === 1 &&
  rebuiltTravelCareer?.playerId === canonical.playerId
)) {
  process.exitCode = 1;
}
