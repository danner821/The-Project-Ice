/* ============================================================
   PROJECT ICE — world.js
   Build 0.0.1

   World Engine — foundational data layer.
   Holds all game-world state separately from the player save.
   Player saves reference the world via worldRef: 'default'.

   Future systems (simulation, scheduling, roster generation)
   read and write through this object. This file has zero
   knowledge of game.js or the DOM; it is pure data + logic.
   ============================================================ */

'use strict';

/* global WorldEngine */

const WorldEngine = (() => {

  // ── Storage key (separate from the player SAVE_KEY) ────────
  const WORLD_KEY = 'projectice_world';

  /*
   * ============================================================
   * WORLD STORAGE — INDEXEDDB
   * ============================================================
   *
   * The Project Ice world has outgrown localStorage.
   *
   * localStorage remains available temporarily as a migration
   * source for older saves, but the full world state will now live
   * in IndexedDB so large rosters, schedules, stats and history can
   * persist safely.
   */

  const WORLD_DB_NAME =
    'projectice_database';

  const WORLD_DB_VERSION =
    1;

  const WORLD_STORE_NAME =
    'worlds';

  const WORLD_RECORD_ID =
    'default';

  function openWorldDatabase() {
    return new Promise(
      (resolve, reject) => {
        const request =
          indexedDB.open(
            WORLD_DB_NAME,
            WORLD_DB_VERSION
          );

        request.onupgradeneeded =
          event => {
            const database =
              event.target.result;

            if (
              !database.objectStoreNames
                .contains(
                  WORLD_STORE_NAME
                )
            ) {
              database.createObjectStore(
                WORLD_STORE_NAME,
                {
                  keyPath: 'id',
                }
              );
            }
          };

        request.onsuccess =
          () => {
            resolve(
              request.result
            );
          };

        request.onerror =
          () => {
            reject(
              request.error ||
              new Error(
                'Could not open Project Ice IndexedDB.'
              )
            );
          };
      }
    );
  }

  // ── Seed teams ──────────────────────────────────────────────
  // Eight fictional high-school programs for the 2022-23 season.
  // Future systems populate each team's roster array and update
  // the stats fields (wins, losses, etc.) after simulated games.
  // Add new teams here; buildDefaults() deep-copies the array.
  const SEED_TEAMS = [
    {
      teamId:          'team-summit-academy',
      schoolName:      'Summit Academy',
      teamName:        'Titans',
      abbreviation: 'TIT',
      primaryColor:    '#1a1a2e',
      secondaryColor:  '#c9a84c',
      prestige:        5,
      identity:        'Elite powerhouse with strong scout attention.',
      coach: {
        name: 'Marcus Hale',

        style:
          'Offensive-minded coach with championship expectations.',

        /*
         * Internal coaching philosophy.
         * These values guide deployment decisions but are never
         * displayed as public coach ratings.
         */
        deploymentPreferences: {
          abilityWeight: 1.08,
          coachTrustWeight: 0.15,
          recentFormWeight: 0.13,
          disciplineWeight: 0.05,
          developmentWeight: 0.05,
          roleStabilityWeight: 0.08,

          evenStrengthEmphasis: 1.04,
          powerPlayEmphasis: 1.12,
          penaltyKillEmphasis: 0.92,
          goalieEmphasis: 1.00,

          favorsOffense: true,
          favorsDefense: false,
          favorsVeterans: false,
          favorsDevelopment: false,
        },
      },

      arena: {

        name: 'Summit Ice Center',

        capacity: 2400,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-iron-peak',
      schoolName:      'Iron Peak',
      teamName:        'Wolves',
      abbreviation: 'IPW',
      primaryColor:    '#2b2d2f',
      secondaryColor:  '#8b0000',
      prestige:        3,
      identity:        'Physical, defense-first team.',
      coach: {

        name: 'Derek Mercer',

        style: 'Demanding defensive coach who values physical play.',

      },

      arena: {

        name: 'The Wolf Den',

        capacity: 2100,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-north-ridge',
      schoolName:      'North Ridge',
      teamName:        'Falcons',
      abbreviation: 'NRF',
      primaryColor:    '#003366',
      secondaryColor:  '#c0c0c0',
      prestige:        4,
      identity:        'Fast, skilled, disciplined team.',
      coach: {

        name: 'Ryan Callahan',

        style: 'Detail-oriented coach focused on speed and discipline.',

      },

      arena: {

        name: 'Falcon Ice Pavilion',

        capacity: 1950,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-cedar-valley',
      schoolName:      'Cedar Valley',
      teamName:        'Storm',
      abbreviation: 'CVS',
      primaryColor:    '#1b4332',
      secondaryColor:  '#52b788',
      prestige:        2,
      identity:        'Underdog program known for player development.',
      coach: {

        name: 'Evan Brooks',

        style: 'Patient development coach known for improving young players.',

      },

      arena: {

        name: 'Cedar Valley Community Rink',

        capacity: 1450,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-westbrook',
      schoolName:      'Westbrook',
      teamName:        'Knights',
      abbreviation: 'WBK',
      primaryColor:    '#1c1c3a',
      secondaryColor:  '#e8e8e8',
      prestige:        3,
      identity:        'Structured defensive team with strong goaltending.',
      coach: {

        name: 'Thomas Keane',

        style: 'Structured coach who emphasizes defense and goaltending.',

      },

      arena: {

        name: 'Westbrook Ice Hall',

        capacity: 1800,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-granite-falls',
      schoolName:      'Granite Falls',
      teamName:        'Bears',
      abbreviation: 'GFB',
      primaryColor:    '#3b1f0a',
      secondaryColor:  '#d4a96a',
      prestige:        2,
      identity:        'Physical, blue-collar team.',
      coach: {

        name: 'Cole Davidson',

        style: 'Blue-collar coach who demands effort and physicality.',

      },

      arena: {

        name: 'Granite Ice Pavilion',

        capacity: 2200,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-lakeview',
      schoolName:      'Lakeview',
      teamName:        'Lynx',
      abbreviation: 'LVL',
      primaryColor:    '#00416a',
      secondaryColor:  '#e4003a',
      prestige:        4,
      identity:        'High-tempo offensive team.',
      coach: {

        name: 'Jordan Price',

        style: 'Aggressive coach who encourages high-tempo offense.',

      },

      arena: {

        name: 'Lakeview Events Center',

        capacity: 2050,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-oakridge',
      schoolName:      'Oakridge',
      teamName:        'Ravens',
      abbreviation: 'OKR',
      primaryColor:    '#0d0d0d',
      secondaryColor:  '#6a0dad',
      prestige:        5,
      identity:        'Prestigious program known for producing top prospects.',
      coach: {

        name: 'Nathan Carlisle',

        style: 'Prestigious program builder with strong scouting connections.',

      },

      arena: {

        name: 'Ravenhurst Arena',

        capacity: 2600,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
  ];
  // ── Fictional player generation data ─────────────────────────

  const PLAYER_FIRST_NAMES = [
    'Aaron', 'Adam', 'Aiden', 'Alex', 'Alexander', 'Andrew', 'Anthony',
    'Asher', 'Austin', 'Beckett', 'Ben', 'Benjamin', 'Bennett', 'Blake',
    'Braden', 'Bradley', 'Brady', 'Brayden', 'Brett', 'Brody', 'Bryce',
    'Caleb', 'Callum', 'Cameron', 'Carson', 'Carter', 'Casey', 'Charlie',
    'Chase', 'Chris', 'Christian', 'Cole', 'Colin', 'Connor', 'Cooper',
    'Cullen', 'Damon', 'Daniel', 'David', 'Declan', 'Derek', 'Dominic',
    'Drew', 'Dylan', 'Easton', 'Eli', 'Elias', 'Elijah', 'Emmett',
    'Eric', 'Ethan', 'Evan', 'Everett', 'Felix', 'Finn', 'Gabriel',
    'Gavin', 'George', 'Graham', 'Grant', 'Grayson', 'Griffin', 'Hayden',
    'Henry', 'Holden', 'Hudson', 'Hunter', 'Ian', 'Isaac', 'Jack',
    'Jackson', 'Jacob', 'Jake', 'James', 'Jamie', 'Jason', 'Jaxon',
    'Jayden', 'Jeremy', 'Jesse', 'Joel', 'John', 'Jonah', 'Jonathan',
    'Jordan', 'Joseph', 'Josh', 'Joshua', 'Julian', 'Justin', 'Kai',
    'Kane', 'Keegan', 'Kellan', 'Kyle', 'Landon', 'Lane', 'Leo',
    'Levi', 'Liam', 'Logan', 'Lucas', 'Luke', 'Maddox', 'Marcus',
    'Mason', 'Matthew', 'Max', 'Micah', 'Michael', 'Miles', 'Mitchell',
    'Nate', 'Nathan', 'Nicholas', 'Nico', 'Noah', 'Nolan', 'Owen',
    'Parker', 'Patrick', 'Paul', 'Peter', 'Quinn', 'Reid', 'Riley',
    'Roman', 'Rory', 'Ryan', 'Sam', 'Samuel', 'Sawyer', 'Scott',
    'Sean', 'Sebastian', 'Simon', 'Spencer', 'Tanner', 'Theo', 'Thomas',
    'Tristan', 'Tyler', 'Victor', 'Walker', 'Wesley', 'Weston', 'Will',
    'William', 'Wyatt', 'Xavier', 'Zach', 'Zachary',

    'Aleksi', 'Anton', 'Artem', 'Axel', 'Dmitri', 'Emil', 'Erik',
    'Filip', 'Henrik', 'Hugo', 'Ilya', 'Jakob', 'Jani', 'Jesse',
    'Joakim', 'Joel', 'Jonas', 'Joonas', 'Kasper', 'Kevin', 'Leo',
    'Leon', 'Linus', 'Luka', 'Lukas', 'Magnus', 'Marek', 'Matias',
    'Mats', 'Mika', 'Mikko', 'Nikita', 'Nils', 'Oliver', 'Oskar',
    'Otto', 'Patrik', 'Rasmus', 'Sami', 'Sasha', 'Sebastian', 'Teemu',
    'Tomas', 'Viktor', 'Ville'
  ];

  const PLAYER_LAST_NAMES = [
    'Abbott', 'Adams', 'Allen', 'Anderson', 'Andrews', 'Armstrong',
    'Atkinson', 'Austin', 'Bailey', 'Baker', 'Baldwin', 'Banks',
    'Barrett', 'Barton', 'Baxter', 'Becker', 'Bell', 'Bennett',
    'Benson', 'Bishop', 'Black', 'Blair', 'Blake', 'Bolton',
    'Boone', 'Bowen', 'Boyd', 'Bradley', 'Brady', 'Brennan',
    'Briggs', 'Brooks', 'Brown', 'Bryant', 'Burke', 'Burns',
    'Burton', 'Butler', 'Byrne', 'Campbell', 'Carlson', 'Carpenter',
    'Carter', 'Casey', 'Chapman', 'Clark', 'Clarke', 'Cole',
    'Collins', 'Connelly', 'Cook', 'Cooper', 'Crawford', 'Crosby',
    'Cunningham', 'Dalton', 'Daniels', 'Davidson', 'Davis', 'Dawson',
    'Dean', 'Dixon', 'Donovan', 'Douglas', 'Doyle', 'Drake',
    'Duncan', 'Dunn', 'Edwards', 'Elliott', 'Ellis', 'Evans',
    'Farrell', 'Ferguson', 'Fisher', 'Fitzgerald', 'Fleming', 'Fletcher',
    'Flynn', 'Ford', 'Foster', 'Fox', 'Franklin', 'Fraser',
    'Freeman', 'Gallagher', 'Garrett', 'Gibson', 'Gilbert', 'Gordon',
    'Graham', 'Grant', 'Gray', 'Green', 'Griffin', 'Hall',
    'Hamilton', 'Hansen', 'Harding', 'Harper', 'Harris', 'Harrison',
    'Hart', 'Hayes', 'Henderson', 'Henry', 'Higgins', 'Hill',
    'Holland', 'Holmes', 'Howard', 'Hudson', 'Hughes', 'Hunt',
    'Hunter', 'Jackson', 'Jacobs', 'James', 'Jenkins', 'Jensen',
    'Johnson', 'Johnston', 'Jones', 'Jordan', 'Kane', 'Kelly',
    'Kennedy', 'King', 'Knight', 'Lane', 'Lawson', 'Lee',
    'Lewis', 'Lloyd', 'Logan', 'Long', 'Lowe', 'MacDonald',
    'Mackenzie', 'Martin', 'Mason', 'Matthews', 'McBride', 'McCarthy',
    'McDonald', 'McKenna', 'McLean', 'McMillan', 'Meyer', 'Miller',
    'Mitchell', 'Moore', 'Morgan', 'Morris', 'Morrison', 'Murphy',
    'Murray', 'Nelson', 'Nichols', 'Nolan', 'OBrien', 'ONeill',
    'Oliver', 'Owen', 'Palmer', 'Parker', 'Patterson', 'Payne',
    'Pearson', 'Perry', 'Peterson', 'Phillips', 'Porter', 'Powell',
    'Price', 'Quinn', 'Ramsey', 'Reed', 'Reid', 'Reynolds',
    'Richards', 'Richardson', 'Riley', 'Roberts', 'Robertson', 'Robinson',
    'Rogers', 'Ross', 'Rourke', 'Russell', 'Ryan', 'Sanders',
    'Scott', 'Shaw', 'Simpson', 'Smith', 'Spencer', 'Stevens',
    'Stewart', 'Stone', 'Sullivan', 'Taylor', 'Thomas', 'Thompson',
    'Turner', 'Walker', 'Wallace', 'Walsh', 'Ward', 'Watson',
    'Wells', 'West', 'White', 'Williams', 'Wilson', 'Woods',
    'Wright', 'Young',

    'Aho', 'Andersson', 'Backstrom', 'Berg', 'Berglund', 'Bjorck',
    'Carlsson', 'Dahl', 'Ekholm', 'Eriksson', 'Forsberg', 'Gustafsson',
    'Hedberg', 'Holm', 'Johansson', 'Karlsson', 'Larsson', 'Lindberg',
    'Lindholm', 'Lundqvist', 'Nilsson', 'Nyberg', 'Nylander', 'Olofsson',
    'Pettersson', 'Sandberg', 'Soderberg', 'Sundin', 'Svensson', 'Wallin',

    'Aaltonen', 'Heikkinen', 'Heinonen', 'Jokinen', 'Kapanen', 'Karjalainen',
    'Koskinen', 'Laaksonen', 'Laine', 'Lehtinen', 'Lehtonen', 'Manninen',
    'Mikkola', 'Niemi', 'Nieminen', 'Nurmi', 'Pulkkinen', 'Rantanen',
    'Ristolainen', 'Salminen', 'Savolainen', 'Suominen', 'Virtanen',

    'Baranov', 'Belov', 'Bogdanov', 'Fedorov', 'Gavrikov', 'Ivanov',
    'Karpov', 'Kiselev', 'Kozlov', 'Kuznetsov', 'Lebedev', 'Makarov',
    'Markov', 'Medvedev', 'Mikhailov', 'Morozov', 'Nikitin', 'Orlov',
    'Petrov', 'Popov', 'Romanov', 'Semenov', 'Sokolov', 'Sorokin',
    'Tarasov', 'Volkov', 'Voronov', 'Zaitsev',

    'Bartos', 'Cerny', 'Dvorak', 'Havel', 'Horak', 'Hronek',
    'Jelinek', 'Kolar', 'Kovar', 'Kral', 'Krejci', 'Kucera',
    'Marek', 'Navratil', 'Nemec', 'Novak', 'Prochazka', 'Sedlak',
    'Simek', 'Svoboda', 'Vesely', 'Zeman',

    'Bauer', 'Beck', 'Fischer', 'Hartmann', 'Keller', 'Klein',
    'Koch', 'Krause', 'Lehmann', 'Muller', 'Neumann', 'Richter',
    'Schmidt', 'Schneider', 'Schultz', 'Schwarz', 'Vogel', 'Wagner',
    'Weber', 'Wolf',

    'Baumann', 'Berger', 'Brunner', 'Frei', 'Gerber', 'Haas',
    'Hofer', 'Keller', 'Meier', 'Muller', 'Schmid', 'Steiner',
    'Wenger', 'Ziegler'
  ];

  const PLAYER_NATIONALITY_WEIGHTS = [
    { code: 'CAN', weight: 40 },
    { code: 'USA', weight: 32 },
    { code: 'SWE', weight: 8 },
    { code: 'FIN', weight: 7 },
    { code: 'CZE', weight: 4 },
    { code: 'SVK', weight: 3 },
    { code: 'RUS', weight: 3 },
    { code: 'GER', weight: 2 },
    { code: 'CHE', weight: 1 }
  ];

  function generatePlayerNationality() {

    const totalWeight =
      PLAYER_NATIONALITY_WEIGHTS.reduce(
        (sum, entry) => sum + entry.weight,
        0
      );

    let roll =
      Math.random() * totalWeight;

    for (const nationality of PLAYER_NATIONALITY_WEIGHTS) {

      roll -= nationality.weight;

      if (roll <= 0) {
        return nationality.code;
      }

    }

    return 'CAN';

  }

  const PLAYER_NAME_POOLS = {
    CAN: {
      firstNames: [
        'Aiden', 'Austin', 'Blake', 'Brady', 'Brayden', 'Brody',
        'Caleb', 'Callum', 'Cameron', 'Carson', 'Carter', 'Cole',
        'Connor', 'Cooper', 'Dylan', 'Easton', 'Ethan', 'Evan',
        'Gavin', 'Grayson', 'Hunter', 'Jack', 'Jake', 'Jaxon',
        'Landon', 'Liam', 'Logan', 'Luke', 'Mason', 'Matthew',
        'Nathan', 'Nolan', 'Owen', 'Parker', 'Reid', 'Ryan',
        'Tanner', 'Tyler', 'Walker', 'Wyatt'
      ],

      lastNames: [
        'Anderson', 'Bennett', 'Brennan', 'Brooks', 'Campbell',
        'Carter', 'Clarke', 'Davidson', 'Dawson', 'Donovan',
        'Fitzgerald', 'Fraser', 'Gallagher', 'Grant', 'Hansen',
        'Hayes', 'Johnston', 'Kelly', 'MacDonald', 'Mackenzie',
        'McBride', 'McCarthy', 'McDonald', 'McKenna', 'McLean',
        'McMillan', 'Mitchell', 'Morrison', 'Murphy', 'Murray',
        'ONeill', 'Quinn', 'Reid', 'Rourke', 'Sullivan', 'Walsh'
      ],
    },

    USA: {
      firstNames: [
        'Aaron', 'Andrew', 'Asher', 'Beckett', 'Benjamin', 'Bennett',
        'Bryce', 'Cameron', 'Carson', 'Carter', 'Chase', 'Christian',
        'Colin', 'Cooper', 'Declan', 'Drew', 'Eli', 'Elijah',
        'Emmett', 'Everett', 'Graham', 'Grant', 'Griffin', 'Hayden',
        'Holden', 'Hudson', 'Jackson', 'James', 'Jordan', 'Joshua',
        'Julian', 'Kai', 'Lane', 'Levi', 'Lucas', 'Maddox',
        'Miles', 'Nico', 'Parker', 'Riley', 'Sawyer', 'Weston'
      ],

      lastNames: [
        'Abbott', 'Adams', 'Allen', 'Bailey', 'Baker', 'Barrett',
        'Bishop', 'Black', 'Blair', 'Boone', 'Bowen', 'Bradley',
        'Bryant', 'Burke', 'Carlson', 'Chapman', 'Clark', 'Collins',
        'Cook', 'Cooper', 'Crawford', 'Davis', 'Dean', 'Dixon',
        'Edwards', 'Elliott', 'Ellis', 'Fisher', 'Foster', 'Fox',
        'Franklin', 'Garrett', 'Gibson', 'Gray', 'Green', 'Hall',
        'Harper', 'Harris', 'Harrison', 'Hill', 'Howard', 'Jackson',
        'Johnson', 'Jones', 'King', 'Lawson', 'Miller', 'Moore',
        'Nelson', 'Parker', 'Patterson', 'Peterson', 'Phillips',
        'Porter', 'Reynolds', 'Roberts', 'Scott', 'Stevens',
        'Taylor', 'Thompson', 'Walker', 'Watson', 'Wilson', 'Young'
      ],
    },

    SWE: {
      firstNames: [
        'Anton', 'Axel', 'Emil', 'Erik', 'Filip', 'Henrik',
        'Hugo', 'Jakob', 'Joakim', 'Jonas', 'Leo', 'Linus',
        'Magnus', 'Mats', 'Nils', 'Oliver', 'Oskar', 'Otto',
        'Rasmus', 'Viktor'
      ],

      lastNames: [
        'Andersson', 'Backstrom', 'Berg', 'Berglund', 'Bjorck',
        'Carlsson', 'Dahl', 'Ekholm', 'Eriksson', 'Forsberg',
        'Gustafsson', 'Hedberg', 'Holm', 'Johansson', 'Karlsson',
        'Larsson', 'Lindberg', 'Lindholm', 'Lundqvist', 'Nilsson',
        'Nyberg', 'Nylander', 'Olofsson', 'Pettersson', 'Sandberg',
        'Soderberg', 'Svensson', 'Wallin'
      ],
    },

    FIN: {
      firstNames: [
        'Aleksi', 'Jani', 'Jesse', 'Joel', 'Joonas', 'Kasper',
        'Matias', 'Mika', 'Mikko', 'Oskari', 'Patrik', 'Sami',
        'Teemu', 'Ville'
      ],

      lastNames: [
        'Aaltonen', 'Aho', 'Heikkinen', 'Heinonen', 'Jokinen',
        'Kapanen', 'Karjalainen', 'Koskinen', 'Laaksonen', 'Laine',
        'Lehtinen', 'Lehtonen', 'Manninen', 'Mikkola', 'Niemi',
        'Nieminen', 'Nurmi', 'Pulkkinen', 'Rantanen', 'Ristolainen',
        'Salminen', 'Savolainen', 'Suominen', 'Virtanen'
      ],
    },

    CZE: {
      firstNames: [
        'Adam', 'David', 'Filip', 'Jakub', 'Jan', 'Jiri',
        'Lukas', 'Marek', 'Martin', 'Matej', 'Patrik', 'Petr',
        'Tomas', 'Vaclav'
      ],

      lastNames: [
        'Bartos', 'Cerny', 'Dvorak', 'Havel', 'Horak', 'Hronek',
        'Jelinek', 'Kolar', 'Kovar', 'Kral', 'Krejci', 'Kucera',
        'Navratil', 'Novak', 'Prochazka', 'Sedlak', 'Simek',
        'Svoboda', 'Vesely', 'Zeman'
      ],
    },

    SVK: {
      firstNames: [
        'Adam', 'Andrej', 'Boris', 'Filip', 'Jakub', 'Juraj',
        'Lukas', 'Martin', 'Matej', 'Michal', 'Samuel', 'Tomas'
      ],

      lastNames: [
        'Baca', 'Cernak', 'Dano', 'Dubnyk', 'Hudacek', 'Jurco',
        'Kovac', 'Marincin', 'Meszaros', 'Nemec', 'Panik',
        'Roman', 'Slafkovsky', 'Tatar', 'Valach'
      ],
    },

    RUS: {
      firstNames: [
        'Alexander', 'Andrei', 'Anton', 'Artem', 'Dmitri', 'Ilya',
        'Ivan', 'Kirill', 'Mikhail', 'Nikita', 'Pavel', 'Sergei',
        'Semyon', 'Viktor', 'Yaroslav'
      ],

      lastNames: [
        'Baranov', 'Belov', 'Bogdanov', 'Fedorov', 'Gavrikov',
        'Ivanov', 'Karpov', 'Kiselev', 'Kozlov', 'Kuznetsov',
        'Lebedev', 'Makarov', 'Markov', 'Medvedev', 'Mikhailov',
        'Morozov', 'Nikitin', 'Orlov', 'Petrov', 'Popov',
        'Romanov', 'Semenov', 'Sokolov', 'Sorokin', 'Tarasov',
        'Volkov', 'Voronov', 'Zaitsev'
      ],
    },

    GER: {
      firstNames: [
        'Alexander', 'Dominik', 'Felix', 'Florian', 'Jan', 'Jonas',
        'Leon', 'Lukas', 'Marco', 'Max', 'Moritz', 'Nico',
        'Niklas', 'Tim'
      ],

      lastNames: [
        'Bauer', 'Beck', 'Fischer', 'Hartmann', 'Keller', 'Klein',
        'Koch', 'Krause', 'Lehmann', 'Muller', 'Neumann', 'Richter',
        'Schmidt', 'Schneider', 'Schultz', 'Schwarz', 'Vogel',
        'Wagner', 'Weber', 'Wolf'
      ],
    },

    CHE: {
      firstNames: [
        'Alessio', 'Dario', 'Dominic', 'Florian', 'Janis', 'Jonas',
        'Lian', 'Luca', 'Marco', 'Nico', 'Noah', 'Sandro',
        'Simon', 'Yannick'
      ],

      lastNames: [
        'Baumann', 'Berger', 'Brunner', 'Frei', 'Gerber', 'Haas',
        'Hofer', 'Keller', 'Meier', 'Muller', 'Schmid', 'Steiner',
        'Wenger', 'Ziegler'
      ],
    },
  };

  const ROSTER_POSITION_SLOTS = [
    { slot: 'fwd-1-lw', position: 'LW', line: 1 },
    { slot: 'fwd-1-c',  position: 'C',  line: 1 },
    { slot: 'fwd-1-rw', position: 'RW', line: 1 },

    { slot: 'fwd-2-lw', position: 'LW', line: 2 },
    { slot: 'fwd-2-c',  position: 'C',  line: 2 },
    { slot: 'fwd-2-rw', position: 'RW', line: 2 },

    { slot: 'fwd-3-lw', position: 'LW', line: 3 },
    { slot: 'fwd-3-c',  position: 'C',  line: 3 },
    { slot: 'fwd-3-rw', position: 'RW', line: 3 },

    { slot: 'fwd-4-lw', position: 'LW', line: 4 },
    { slot: 'fwd-4-c',  position: 'C',  line: 4 },
    { slot: 'fwd-4-rw', position: 'RW', line: 4 },

    { slot: 'def-1-ld', position: 'LD', pair: 1 },
    { slot: 'def-1-rd', position: 'RD', pair: 1 },
    { slot: 'def-2-ld', position: 'LD', pair: 2 },
    { slot: 'def-2-rd', position: 'RD', pair: 2 },
    { slot: 'def-3-ld', position: 'LD', pair: 3 },
    { slot: 'def-3-rd', position: 'RD', pair: 3 },

    { slot: 'g-starter', position: 'G', goalieRole: 'Starter' },
    { slot: 'g-backup',  position: 'G', goalieRole: 'Backup' },
  ];

  const PLAYER_ARCHETYPES = {
    C: ['Playmaker', 'Two-Way Forward', 'Sniper', 'Power Forward'],
    LW: ['Sniper', 'Playmaker', 'Power Forward', 'Two-Way Forward'],
    RW: ['Sniper', 'Playmaker', 'Power Forward', 'Two-Way Forward'],
    LD: ['Two-Way Defenseman', 'Defensive Defenseman', 'Offensive Defenseman'],
    RD: ['Two-Way Defenseman', 'Defensive Defenseman', 'Offensive Defenseman'],
    G: ['Hybrid Goalie', 'Butterfly Goalie', 'Athletic Goalie'],
  };

  const EVENT_TYPES = {
    GAME: 'game',
    PRACTICE: 'practice',
    RECOVERY: 'recovery',
    REST: 'rest',
    COACH_MEETING: 'coach-meeting',
    MEDIA: 'media',
    AWARD: 'award',
    STORY: 'story',
    TRAINING: 'training',
    CUSTOM: 'custom',
  };

  const HIGH_SCHOOL_PRACTICE_TYPES = [
    {
      eventKey: 'practice-skills',
      label: 'Skills Practice',
      shortLabel: 'Skills',
      icon: '🏒',
      location: 'Summit Ice Center',
      objective: 'Individual skill development.',
      focus: 'skills',
    },
    {
      eventKey: 'practice-skating',
      label: 'Power Skating',
      shortLabel: 'Skating',
      icon: '⛸️',
      location: 'Summit Ice Center',
      objective: 'Improve speed and edgework.',
      focus: 'skating',
    },
    {
      eventKey: 'practice-shooting',
      label: 'Shooting Practice',
      shortLabel: 'Shooting',
      icon: '🥅',
      location: 'Summit Ice Center',
      objective: 'Improve scoring ability.',
      focus: 'shooting',
    },
    {
      eventKey: 'practice-systems',
      label: 'Team Systems',
      shortLabel: 'Systems',
      icon: '🧠',
      location: 'Video Room',
      objective: 'Learn team structure.',
      focus: 'systems',
    },
    {
      eventKey: 'practice-scrimmage',
      label: 'Full Scrimmage',
      shortLabel: 'Scrimmage',
      icon: '🏒',
      location: 'Summit Ice Center',
      objective: 'Game-speed scrimmage.',
      focus: 'scrimmage',
    },
  ];

  /*
   * Player-selected weekly Training.
   *
   * Unlike team Practice, Training is controlled by the career
   * player and awards targeted individual attribute XP.
   *
   * Each training option identifies the exact attributes it can
   * develop. XP values will be calculated when the Training
   * completion system is added.
   *
   * Skater and goalie training pools remain separate so players
   * are never offered irrelevant attributes.
   */
  const HIGH_SCHOOL_TRAINING_TYPES = {
    skater: [
      {
        trainingKey:
          'training-explosive-skating',

        label:
          'Explosive Skating',

        shortLabel:
          'Explosive Skating',

        icon:
          '⚡',

        category:
          'Skating',

        description:
          'Explosive starts, acceleration work and high-speed skating mechanics.',

        xpBudget: 30,

        attributes: [
          'acceleration',
          'speed',
          'agility',
          'balance',
        ],

        attributeWeights: {
          acceleration: 1.35,
          speed: 1.15,
          agility: 1.00,
          balance: 0.75,
        },
      },

      {
        trainingKey:
          'training-edgework-mobility',

        label:
          'Edgework & Mobility',

        shortLabel:
          'Edgework',

        icon:
          '⛸️',

        category:
          'Skating',

        description:
          'Tight turns, lateral movement, puck protection and body control.',

        xpBudget: 30,

        attributes: [
          'agility',
          'balance',
          'puckControl',
          'acceleration',
        ],

        attributeWeights: {
          agility: 1.30,
          balance: 1.10,
          puckControl: 0.90,
          acceleration: 0.80,
        },
      },

      {
        trainingKey:
          'training-conditioning-strength',

        label:
          'Conditioning & Strength',

        shortLabel:
          'Conditioning',

        icon:
          '🏃',

        category:
          'Physical',

        description:
          'Build the engine and physical base needed to maintain performance throughout games.',

        xpBudget: 30,

        attributes: [
          'endurance',
          'strength',
          'durability',
          'balance',
        ],

        attributeWeights: {
          endurance: 1.35,
          strength: 1.05,
          durability: 0.90,
          balance: 0.70,
        },
      },

      {
        trainingKey:
          'training-shooting-lab',

        label:
          'Shooting Lab',

        shortLabel:
          'Shooting Lab',

        icon:
          '🎯',

        category:
          'Shooting',

        description:
          'A complete shooting session focused on accuracy, power and repeatable mechanics.',

        xpBudget: 30,

        attributes: [
          'wristShotAccuracy',
          'wristShotPower',
          'slapShotAccuracy',
          'slapShotPower',
        ],

        attributeWeights: {
          wristShotAccuracy: 1.15,
          wristShotPower: 1.00,
          slapShotAccuracy: 0.95,
          slapShotPower: 0.90,
        },
      },

      {
        trainingKey:
          'training-quick-release',

        label:
          'Quick Release',

        shortLabel:
          'Quick Release',

        icon:
          '⚡',

        category:
          'Shooting',

        description:
          'Quick-touch finishing drills that combine shooting, puck handling and offensive reads.',

        xpBudget: 30,

        attributes: [
          'wristShotAccuracy',
          'wristShotPower',
          'handEye',
          'offensiveAwareness',
          'puckControl',
        ],

        attributeWeights: {
          wristShotAccuracy: 1.25,
          wristShotPower: 1.00,
          handEye: 0.95,
          offensiveAwareness: 0.90,
          puckControl: 0.80,
        },
      },

      {
        trainingKey:
          'training-one-timer',

        label:
          'One-Timer Session',

        shortLabel:
          'One-Timers',

        icon:
          '💥',

        category:
          'Shooting',

        description:
          'Work on timing, power and finding shooting lanes for dangerous one-timers.',

        xpBudget: 30,

        attributes: [
          'slapShotPower',
          'slapShotAccuracy',
          'handEye',
          'offensiveAwareness',
        ],

        attributeWeights: {
          slapShotPower: 1.25,
          slapShotAccuracy: 1.15,
          handEye: 0.90,
          offensiveAwareness: 0.80,
        },
      },

      {
        trainingKey:
          'training-puck-skills',

        label:
          'Puck Skills',

        shortLabel:
          'Puck Skills',

        icon:
          '🏒',

        category:
          'Playmaking',

        description:
          'Technical puck work designed to improve control, creativity and execution under pressure.',

        xpBudget: 30,

        attributes: [
          'puckControl',
          'deking',
          'passing',
          'handEye',
        ],

        attributeWeights: {
          puckControl: 1.25,
          deking: 1.15,
          passing: 0.90,
          handEye: 0.80,
        },
      },

      {
        trainingKey:
          'training-vision-distribution',

        label:
          'Vision & Distribution',

        shortLabel:
          'Vision',

        icon:
          '👀',

        category:
          'Playmaking',

        description:
          'Read developing plays, move the puck quickly and create opportunities for teammates.',

        xpBudget: 30,

        attributes: [
          'passing',
          'offensiveAwareness',
          'puckControl',
          'poise',
        ],

        attributeWeights: {
          passing: 1.30,
          offensiveAwareness: 1.15,
          puckControl: 0.90,
          poise: 0.75,
        },
      },

      {
        trainingKey:
          'training-defensive-zone',

        label:
          'Defensive Zone Work',

        shortLabel:
          'Defensive Zone',

        icon:
          '🛡️',

        category:
          'Defense',

        description:
          'Positioning, lane control and puck-separation drills inside the defensive zone.',

        xpBudget: 30,

        attributes: [
          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'discipline',
        ],

        attributeWeights: {
          defensiveAwareness: 1.30,
          stickChecking: 1.10,
          shotBlocking: 0.95,
          discipline: 0.75,
        },
      },

      {
        trainingKey:
          'training-physical-battles',

        label:
          'Physical Battle Training',

        shortLabel:
          'Physical Battles',

        icon:
          '💪',

        category:
          'Physical',

        description:
          'Board battles, contact work and puck-protection drills built around strength and control.',

        xpBudget: 30,

        attributes: [
          'bodyChecking',
          'strength',
          'balance',
          'durability',
        ],

        attributeWeights: {
          bodyChecking: 1.25,
          strength: 1.15,
          balance: 0.90,
          durability: 0.80,
        },
      },

      {
        trainingKey:
          'training-two-way-iq',

        label:
          'Two-Way Hockey IQ',

        shortLabel:
          'Two-Way IQ',

        icon:
          '🧠',

        category:
          'Hockey IQ',

        description:
          'Film and situational work focused on reads, composure and disciplined two-way hockey.',

        xpBudget: 30,

        attributes: [
          'offensiveAwareness',
          'defensiveAwareness',
          'poise',
          'discipline',
        ],

        attributeWeights: {
          offensiveAwareness: 1.05,
          defensiveAwareness: 1.05,
          poise: 0.95,
          discipline: 0.95,
        },
      },

      {
        trainingKey:
          'training-faceoff-battles',

        label:
          'Faceoff & Possession Battles',

        shortLabel:
          'Faceoffs',

        icon:
          '⭕',

        category:
          'Specialty',

        description:
          'Faceoff technique, leverage and immediate possession battles after the draw.',

        xpBudget: 30,

        attributes: [
          'faceoffs',
          'strength',
          'balance',
          'discipline',
        ],

        attributeWeights: {
          faceoffs: 1.40,
          strength: 1.00,
          balance: 0.85,
          discipline: 0.70,
        },
      },

      {
        trainingKey:
          'training-net-front',

        label:
          'Net-Front Training',

        shortLabel:
          'Net Front',

        icon:
          '🥅',

        category:
          'Offense',

        description:
          'Battle for position, find loose pucks and finish chances around the crease.',

        xpBudget: 30,

        attributes: [
          'handEye',
          'strength',
          'balance',
          'offensiveAwareness',
          'wristShotAccuracy',
        ],

        attributeWeights: {
          handEye: 1.20,
          strength: 1.00,
          balance: 0.85,
          offensiveAwareness: 1.10,
          wristShotAccuracy: 0.90,
        },
      },
    ],

    goalie: [
      {
        trainingKey:
          'training-goalie-athleticism',

        label:
          'Goalie Athleticism',

        shortLabel:
          'Athleticism',

        icon:
          '⚡',

        category:
          'Athleticism',

        description:
          'Explosive movement and recovery drills designed to improve raw crease athleticism.',

        xpBudget: 30,

        attributes: [
          'reflexes',
          'agility',
          'lateralMovement',
          'recoverySpeed',
        ],

        attributeWeights: {
          reflexes: 1.15,
          agility: 1.05,
          lateralMovement: 1.15,
          recoverySpeed: 0.90,
        },
      },

      {
        trainingKey:
          'training-goalie-positioning',

        label:
          'Tracking & Positioning',

        shortLabel:
          'Positioning',

        icon:
          '📐',

        category:
          'Positioning',

        description:
          'Read shooters, manage angles and maintain strong positioning through developing plays.',

        xpBudget: 30,

        attributes: [
          'positioning',
          'angles',
          'puckTracking',
          'anticipation',
        ],

        attributeWeights: {
          positioning: 1.25,
          angles: 1.10,
          puckTracking: 1.05,
          anticipation: 0.85,
        },
      },

      {
        trainingKey:
          'training-goalie-rebound-control',

        label:
          'Rebound & Recovery',

        shortLabel:
          'Rebounds',

        icon:
          '🧱',

        category:
          'Control',

        description:
          'Control first saves and recover efficiently for dangerous second-chance opportunities.',

        xpBudget: 30,

        attributes: [
          'reboundControl',
          'recoverySpeed',
          'positioning',
          'puckTracking',
        ],

        attributeWeights: {
          reboundControl: 1.35,
          recoverySpeed: 1.00,
          positioning: 0.95,
          puckTracking: 0.80,
        },
      },

      {
        trainingKey:
          'training-goalie-glove-technique',

        label:
          'Glove-Side Technique',

        shortLabel:
          'Glove',

        icon:
          '🧤',

        category:
          'Save Technique',

        description:
          'High and low glove-side save repetitions with reaction and tracking work.',

        xpBudget: 30,

        attributes: [
          'gloveHigh',
          'gloveLow',
          'reflexes',
          'puckTracking',
        ],

        attributeWeights: {
          gloveHigh: 1.20,
          gloveLow: 1.20,
          reflexes: 0.95,
          puckTracking: 0.80,
        },
      },

      {
        trainingKey:
          'training-goalie-blocker-technique',

        label:
          'Blocker-Side Technique',

        shortLabel:
          'Blocker',

        icon:
          '🛡️',

        category:
          'Save Technique',

        description:
          'Blocker placement, reaction work and controlled redirects to safe areas.',

        xpBudget: 30,

        attributes: [
          'blockerHigh',
          'blockerLow',
          'reflexes',
          'reboundControl',
        ],

        attributeWeights: {
          blockerHigh: 1.20,
          blockerLow: 1.20,
          reflexes: 0.90,
          reboundControl: 0.85,
        },
      },

      {
        trainingKey:
          'training-goalie-low-net',

        label:
          'Low-Net Coverage',

        shortLabel:
          'Low Net',

        icon:
          '🥅',

        category:
          'Save Technique',

        description:
          'Butterfly timing, stick placement and lower-net coverage through traffic.',

        xpBudget: 30,

        attributes: [
          'fiveHole',
          'stickControl',
          'lateralMovement',
          'positioning',
        ],

        attributeWeights: {
          fiveHole: 1.25,
          stickControl: 1.15,
          lateralMovement: 0.90,
          positioning: 0.85,
        },
      },

      {
        trainingKey:
          'training-goalie-mental',

        label:
          'Mental Preparation',

        shortLabel:
          'Mental',

        icon:
          '🧠',

        category:
          'Mental',

        description:
          'Pressure situations and film work designed to improve anticipation and consistency.',

        xpBudget: 30,

        attributes: [
          'anticipation',
          'composure',
          'consistency',
          'puckTracking',
        ],

        attributeWeights: {
          anticipation: 1.10,
          composure: 1.15,
          consistency: 1.05,
          puckTracking: 0.80,
        },
      },

      {
        trainingKey:
          'training-goalie-puck-play',

        label:
          'Puck-Playing Session',

        shortLabel:
          'Puck Play',

        icon:
          '🏒',

        category:
          'Puck Playing',

        description:
          'Handle dump-ins, make outlet passes and remain composed while moving the puck.',

        xpBudget: 30,

        attributes: [
          'puckHandling',
          'goaliePassing',
          'composure',
          'anticipation',
        ],

        attributeWeights: {
          puckHandling: 1.30,
          goaliePassing: 1.25,
          composure: 0.80,
          anticipation: 0.70,
        },
      },
    ],
  };

  const HIGH_SCHOOL_RECOVERY_TYPES = [
    {
      eventKey: 'recovery',
      label: 'Recovery',
      shortLabel: 'Recovery',
      icon: '😴',
      location: 'Training Facility',
      objective: 'Rest and recover.',
      focus: 'recovery',
    },
    {
      eventKey: 'stretch',
      label: 'Stretch & Mobility',
      shortLabel: 'Stretch',
      icon: '🧘',
      location: 'Training Room',
      objective: 'Improve flexibility.',
      focus: 'mobility',
    },
    {
      eventKey: 'optional-skate',
      label: 'Optional Skate',
      shortLabel: 'Optional',
      icon: '⛸️',
      location: 'Practice Rink',
      objective: 'Light on-ice work.',
      focus: 'optional-skate',
    },
    {
      eventKey: 'treatment',
      label: 'Treatment Day',
      shortLabel: 'Treatment',
      icon: '🩹',
      location: 'Athletic Training',
      objective: 'Recovery and maintenance.',
      focus: 'treatment',
    },
  ];

  const HIGH_SCHOOL_COACH_MEETING_TYPES = [
    {
      eventKey: 'coach-meeting-expectations',

      label:
        'Coach Meeting',

      shortLabel:
        'Coach',

      icon:
        '📋',

      location:
        'Coach Hale’s Office',

      objective:
        'Review your role and expectations.',

      meetingType:
        'expectations',

      description:
        'Coach Hale wants to discuss your current role, your development, and what he expects from you moving forward.',
    },

    {
      eventKey: 'coach-meeting-development',

      label:
        'Development Meeting',

      shortLabel:
        'Coach',

      icon:
        '📋',

      location:
        'Coach Hale’s Office',

      objective:
        'Discuss your development plan.',

      meetingType:
        'development',

      description:
        'The coaching staff wants to review your progress and identify the areas that can help you earn a larger role.',
    },

    {
      eventKey: 'coach-meeting-role',

      label:
        'Role Meeting',

      shortLabel:
        'Coach',

      icon:
        '📋',

      location:
        'Coach Hale’s Office',

      objective:
        'Discuss your place in the lineup.',

      meetingType:
        'role',

      description:
        'Coach Hale has called you in to discuss your current lineup role and the opportunities available to you.',
    },
  ];

  function pickStableHighSchoolEvent(
    items,
    dateKey,
    salt = ''
  ) {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return null;
    }

    const seedText =
      `${dateKey}-${salt}`;

    let hash = 0;

    for (
      let index = 0;
      index < seedText.length;
      index++
    ) {
      hash =
        ((hash << 5) - hash) +
        seedText.charCodeAt(index);

      hash |= 0;
    }

    const selectedIndex =
      Math.abs(hash) %
      items.length;

    return items[selectedIndex];
  }

  function createHighSchoolLifeEvents() {
    const lifeEvents = [];

    /*
     * Preserve the existing opening-week career calendar.
     * These dates currently appear in HUB_DAYS inside game.js.
     *
     * Only Practice and Recovery are being moved into the
     * canonical World Engine during this phase.
     */
    const openingEvents = [
      {
        date: '2026-09-02',
        type: EVENT_TYPES.RECOVERY,
        definition:
          HIGH_SCHOOL_RECOVERY_TYPES[0],
      },
      {
        date: '2026-09-03',
        type: EVENT_TYPES.PRACTICE,
        definition:
          HIGH_SCHOOL_PRACTICE_TYPES[1],
      },
      {
        date: '2026-09-04',
        type: EVENT_TYPES.PRACTICE,
        definition:
          HIGH_SCHOOL_PRACTICE_TYPES[4],
      },
      {
        date: '2026-09-07',
        type: EVENT_TYPES.RECOVERY,
        definition:
          HIGH_SCHOOL_RECOVERY_TYPES[0],
      },
      {
        date: '2026-09-11',
        type:
          EVENT_TYPES.COACH_MEETING,

        definition:
          HIGH_SCHOOL_COACH_MEETING_TYPES[0],
      },
    ];

    openingEvents.forEach(entry => {
      const definition =
        entry.definition;

      if (!definition) return;

      lifeEvents.push({
        id:
          `career-${entry.type}-${entry.date}-${definition.eventKey}`,

        date:
          entry.date,

        type:
          entry.type,

        eventKey:
          definition.eventKey,

        label:
          definition.label,

        shortLabel:
          definition.shortLabel,

        icon:
          definition.icon,

        location:
          definition.location,

        objective:
          definition.objective,

        focus:
          definition.focus ||
          null,

        meetingType:
          definition.meetingType ||
          null,

        description:
          definition.description ||
          '',

        requiresPlayerInteraction:
          entry.type ===
            EVENT_TYPES.PRACTICE ||
          entry.type ===
            EVENT_TYPES.COACH_MEETING,

        completed: false,

        source:
          'career-calendar',
      });
    });

    /*
     * Continue the established calendar pattern:
     *
     * Tuesday and Thursday = Practice
     * Wednesday = Recovery
     */
    const startDate =
      new Date(
        '2026-09-08T12:00:00'
      );

    const endDate =
      new Date(
        '2027-03-31T12:00:00'
      );

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(
        date.getDate() + 1
      )
    ) {
      const dateKey =
        date
          .toISOString()
          .slice(0, 10);

      const weekday =
        date.getDay();

      const isPracticeDay =
        weekday === 2 ||
        weekday === 4;

      const isRecoveryDay =
        weekday === 3;

      const isTrainingDay =
        weekday === 0;

      if (
        !isPracticeDay &&
        !isRecoveryDay &&
        !isTrainingDay
      ) {
        continue;
      }

      const eventType =
        isPracticeDay
          ? EVENT_TYPES.PRACTICE
          : isRecoveryDay
            ? EVENT_TYPES.RECOVERY
            : EVENT_TYPES.TRAINING;

      const definition =
        isTrainingDay
          ? {
              eventKey:
                `training-${dateKey}`,

              label:
                'Training',

              shortLabel:
                'Training',

              icon:
                '🏋️',

              location:
                'Training Facility',

              objective:
                'Choose an area of your game to develop.',

              focus:
                'player-choice',

              description:
                'Use your weekly training session to target specific areas of your game.',
            }
          : pickStableHighSchoolEvent(
              isPracticeDay
                ? HIGH_SCHOOL_PRACTICE_TYPES
                : HIGH_SCHOOL_RECOVERY_TYPES,
              dateKey,
              eventType
            );

      if (!definition) {
        continue;
      }

      lifeEvents.push({
        id:
          `career-${eventType}-${dateKey}-${definition.eventKey}`,

        date:
          dateKey,

        type:
          eventType,

        eventKey:
          definition.eventKey,

        label:
          definition.label,

        shortLabel:
          definition.shortLabel,

        icon:
          definition.icon,

        location:
          definition.location,

        objective:
          definition.objective,

        focus:
          definition.focus,

        requiresPlayerInteraction:
        eventType ===
          EVENT_TYPES.PRACTICE ||
        eventType ===
          EVENT_TYPES.TRAINING,

        completed: false,

        source:
          'career-calendar',
      });
    }

    return lifeEvents;
  }

  function createHighSchoolCareerSchedule(
    teams = []
  ) {
    const gameEvents =
      createHighSchoolSchedule(
        teams
      ).map(game => ({
        ...game,

        /*
         * League games previously relied on their team fields
         * to identify them. Give every canonical schedule entry
         * an explicit event type.
         */
        type:
          EVENT_TYPES.GAME,

        completed:
          Boolean(game.played),

        source:
          'league-schedule',
      }));

      const lifeEvents =
        createHighSchoolLifeEvents();

      /*
       * A league game takes priority over Practice or Recovery.
       * Remove conflicting life events here so the World Engine
       * and Schedule UI always process the same visible event.
       */
      const gameDates =
        new Set(
          gameEvents.map(
            game => game.date
          )
        );

      const filteredLifeEvents =
        lifeEvents.filter(
          event =>
            !gameDates.has(
              event.date
            )
        );

      return [
        ...gameEvents,
        ...filteredLifeEvents,
      ].sort((firstEvent, secondEvent) => {
      const dateComparison =
        String(firstEvent.date)
          .localeCompare(
            String(secondEvent.date)
          );

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return String(
        firstEvent.id || ''
      ).localeCompare(
        String(secondEvent.id || '')
      );
    });
  }
  // ── EA NHL-style potential system ───────────────────────────

  function getPotentialRole(position, numericPotential) {
    const pos = String(position || 'C').toUpperCase();
    const potential = Number(numericPotential) || 75;

    const isGoalie = pos === 'G';
    const isDefense =
      pos === 'D' ||
      pos === 'LD' ||
      pos === 'RD';

    if (isGoalie) {
      if (potential >= 96) return 'Franchise';
      if (potential >= 90) return 'Elite';
      if (potential >= 84) return 'Starter';
      if (potential >= 79) return 'Fringe Starter';
      if (potential >= 74) return 'Backup';
      return 'AHL Starter';
    }

    if (isDefense) {
      if (potential >= 96) return 'Franchise';
      if (potential >= 90) return 'Elite';
      if (potential >= 84) return 'Top 4 D';
      if (potential >= 79) return 'Top 6 D';
      if (potential >= 74) return '7th D';
      return 'AHL Top 2 D';
    }

    if (potential >= 96) return 'Franchise';
    if (potential >= 90) return 'Elite';
    if (potential >= 84) return 'Top 6 F';
    if (potential >= 79) return 'Top 9 F';
    if (potential >= 74) return 'Bottom 6 F';
    return 'AHL Top 6 F';
  }

  function generatePotentialAccuracy() {
    const roll = Math.random();

    if (roll < 0.15) return 'High';
    if (roll < 0.75) return 'Medium';

    return 'Low';
  }
  // ── Player Attribute System ──────────────────────────────────

  const HIGH_SCHOOL_OVR_CAP = 85;

  const PLAYER_ATTRIBUTE_KEYS = [
    // Shooting
    'wristShotPower',
    'wristShotAccuracy',
    'slapShotPower',
    'slapShotAccuracy',

    // Puck Skills
    'passing',
    'puckControl',
    'deking',
    'handEye',

    // Skating
    'speed',
    'acceleration',
    'agility',
    'balance',
    'endurance',

    // Hockey Sense
    'offensiveAwareness',
    'defensiveAwareness',
    'poise',
    'discipline',

    // Defense / Physical
    'stickChecking',
    'shotBlocking',
    'bodyChecking',
    'strength',
    'durability',

    // Specialty
    'faceoffs',
  ];

  const GOALIE_ATTRIBUTE_KEYS = [
    // Athleticism
    'reflexes',
    'agility',
    'lateralMovement',
    'recoverySpeed',

    // Positioning and technique
    'positioning',
    'angles',
    'reboundControl',
    'gloveHigh',
    'gloveLow',
    'blockerHigh',
    'blockerLow',
    'fiveHole',
    'stickControl',

    // Mental
    'puckTracking',
    'anticipation',
    'composure',
    'consistency',

    // Puck playing
    'puckHandling',
    'goaliePassing',
  ];

  const POSITION_ATTRIBUTE_WEIGHTS = {
    C: {
      passing: 1.35,
      puckControl: 1.25,
      offensiveAwareness: 1.30,
      defensiveAwareness: 1.15,
      faceoffs: 1.30,
      speed: 1.05,
      acceleration: 1.05,
    },

    LW: {
      wristShotPower: 1.20,
      wristShotAccuracy: 1.25,
      speed: 1.20,
      acceleration: 1.15,
      puckControl: 1.15,
      offensiveAwareness: 1.15,
    },

    RW: {
      wristShotPower: 1.20,
      wristShotAccuracy: 1.25,
      speed: 1.20,
      acceleration: 1.15,
      puckControl: 1.15,
      offensiveAwareness: 1.15,
    },

    LD: {
      defensiveAwareness: 1.35,
      stickChecking: 1.30,
      shotBlocking: 1.25,
      strength: 1.15,
      slapShotPower: 1.10,
      passing: 1.05,
    },

    RD: {
      defensiveAwareness: 1.35,
      stickChecking: 1.30,
      shotBlocking: 1.25,
      strength: 1.15,
      slapShotPower: 1.10,
      passing: 1.05,
    },

    G: {},
  };

  function normalizeAttributePosition(position) {
    const raw = String(position || 'C').toUpperCase();

    if (raw === 'C' || raw.includes('CENTER')) return 'C';
    if (raw === 'LW' || raw.includes('LEFT WING')) return 'LW';
    if (raw === 'RW' || raw.includes('RIGHT WING')) return 'RW';

    if (
      raw === 'D' ||
      raw === 'LD' ||
      raw.includes('LEFT DEFENSE') ||
      raw.includes('DEFENSEMAN')
    ) {
      return 'LD';
    }

    if (raw === 'RD' || raw.includes('RIGHT DEFENSE')) {
      return 'RD';
    }

    if (raw === 'G' || raw.includes('GOAL')) return 'G';

    return 'C';
  }

  function clampAttribute(value) {
    return Math.max(25, Math.min(99, Math.round(value)));
  }

  function getArchetypeAttributeBonus(archetype, key) {
    const bonuses = {
      Sniper: {
        wristShotPower: 6,
        wristShotAccuracy: 7,
        slapShotPower: 4,
        slapShotAccuracy: 4,
        offensiveAwareness: 3,
      },

      Playmaker: {
        passing: 7,
        puckControl: 6,
        deking: 5,
        offensiveAwareness: 5,
        handEye: 3,
      },

      'Two-Way Forward': {
        defensiveAwareness: 6,
        stickChecking: 5,
        discipline: 4,
        endurance: 4,
        passing: 3,
      },

      'Power Forward': {
        strength: 7,
        bodyChecking: 7,
        balance: 5,
        wristShotPower: 4,
        durability: 4,
      },

      'Two-Way Defenseman': {
        defensiveAwareness: 6,
        stickChecking: 6,
        passing: 4,
        slapShotPower: 3,
        endurance: 3,
      },

      'Defensive Defenseman': {
        defensiveAwareness: 8,
        shotBlocking: 7,
        stickChecking: 6,
        strength: 5,
        bodyChecking: 5,
      },

      'Offensive Defenseman': {
        passing: 6,
        puckControl: 5,
        offensiveAwareness: 6,
        slapShotPower: 5,
        agility: 3,
      },

      'Butterfly Goalie': {
        positioning: 7,
        angles: 6,
        fiveHole: 7,
        reboundControl: 5,
        consistency: 5,

        reflexes: -2,
        lateralMovement: -2,
        recoverySpeed: -2,
      },

      'Athletic Goalie': {
        reflexes: 7,
        agility: 6,
        lateralMovement: 7,
        recoverySpeed: 6,
        gloveHigh: 4,
        blockerHigh: 4,

        positioning: -3,
        reboundControl: -3,
        consistency: -2,
      },

      'Hybrid Goalie': {
        reflexes: 3,
        agility: 3,
        positioning: 3,
        angles: 3,
        lateralMovement: 3,
        reboundControl: 3,
        puckTracking: 3,
      },
    };

    return bonuses[archetype]?.[key] || 0;
  }

  function createAttributesFromOverall(
    overall,
    position,
    archetype = 'Balanced'
  ) {
    const normalizedPosition = normalizeAttributePosition(position);

    const attributes = {};

    PLAYER_ATTRIBUTE_KEYS.forEach(key => {
      const randomVariance = Math.floor(Math.random() * 9) - 4;
      const archetypeBonus = getArchetypeAttributeBonus(archetype, key);

      attributes[key] = clampAttribute(
        Number(overall) + randomVariance + archetypeBonus
      );
    });

    // Position-specific realism adjustments.
    if (normalizedPosition === 'C') {
      attributes.faceoffs = clampAttribute(attributes.faceoffs + 8);
      attributes.passing = clampAttribute(attributes.passing + 3);
    }

    if (normalizedPosition === 'LW' || normalizedPosition === 'RW') {
      attributes.faceoffs = clampAttribute(attributes.faceoffs - 12);
      attributes.speed = clampAttribute(attributes.speed + 2);
    }

    if (normalizedPosition === 'LD' || normalizedPosition === 'RD') {
      attributes.faceoffs = clampAttribute(attributes.faceoffs - 18);
      attributes.defensiveAwareness = clampAttribute(
        attributes.defensiveAwareness + 4
      );
    }

    return attributes;
  }

  function createGoalieAttributesFromOverall(
    overall,
    archetype = 'Hybrid Goalie'
  ) {
    const baseOverall =
      Number(overall) || 60;

    const attributes = {};

    GOALIE_ATTRIBUTE_KEYS.forEach(key => {
      const randomVariance =
        Math.floor(Math.random() * 9) - 4;

      const archetypeBonus =
        getArchetypeAttributeBonus(
          archetype,
          key
        );

      attributes[key] =
        clampAttribute(
          baseOverall +
          randomVariance +
          archetypeBonus
        );
    });

    /*
     * Small realism adjustments shared by all goalies.
     * Core save skills should generally be more developed
     * than puck-playing ability at the high-school level.
     */
    attributes.positioning =
      clampAttribute(
        attributes.positioning + 2
      );

    attributes.puckTracking =
      clampAttribute(
        attributes.puckTracking + 2
      );

    attributes.puckHandling =
      clampAttribute(
        attributes.puckHandling - 5
      );

    attributes.goaliePassing =
      clampAttribute(
        attributes.goaliePassing - 4
      );

    return attributes;
  }

  function calculateGoalieOverallFromAttributes(
    attributes = {}
  ) {
    const weights = {
      // Most important core save abilities
      positioning: 1.45,
      reflexes: 1.40,
      puckTracking: 1.35,
      reboundControl: 1.30,
      angles: 1.25,

      // Movement and recovery
      lateralMovement: 1.25,
      agility: 1.15,
      recoverySpeed: 1.15,

      // Save-specific technique
      gloveHigh: 1.10,
      gloveLow: 1.10,
      blockerHigh: 1.10,
      blockerLow: 1.10,
      fiveHole: 1.15,
      stickControl: 1.05,

      // Mental reliability
      anticipation: 1.20,
      composure: 1.15,
      consistency: 1.20,

      // Puck playing matters, but less
      puckHandling: 0.65,
      goaliePassing: 0.60,
    };

    let totalValue = 0;
    let totalWeight = 0;

    GOALIE_ATTRIBUTE_KEYS.forEach(key => {
      const value =
        Number(attributes?.[key]) || 50;

      const weight =
        Number(weights[key]) || 1;

      totalValue += value * weight;
      totalWeight += weight;
    });

    const calculatedOverall =
      totalWeight > 0
        ? Math.round(
            totalValue / totalWeight
          )
        : 50;

    return Math.max(
      25,
      Math.min(
        HIGH_SCHOOL_OVR_CAP,
        calculatedOverall
      )
    );
  }

  function calculateOverallFromAttributes(attributes, position) {
    const normalizedPosition = normalizeAttributePosition(position);
    const weights = POSITION_ATTRIBUTE_WEIGHTS[normalizedPosition] || {};

    let totalValue = 0;
    let totalWeight = 0;

    PLAYER_ATTRIBUTE_KEYS.forEach(key => {
      const value = Number(attributes?.[key]) || 50;
      const weight = weights[key] || 1;

      totalValue += value * weight;
      totalWeight += weight;
    });

    const calculatedOverall = totalWeight
      ? Math.round(totalValue / totalWeight)
      : 50;

    return Math.max(
      25,
      Math.min(HIGH_SCHOOL_OVR_CAP, calculatedOverall)
    );
  }

  function enforceHighSchoolOverallCap(player) {
    if (!player) return player;

    const calculatedOverall = player.attributes
      ? calculateOverallFromAttributes(
          player.attributes,
          player.position
        )
      : Number(player.overall) || 50;

    player.overall = Math.min(
      HIGH_SCHOOL_OVR_CAP,
      calculatedOverall
    );

    return player;
  }

  // ── Canonical Player and Season Contracts ────────────────────

  function createEmptySkaterStats() {
    return {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      penaltyMinutes: 0,
      shots: 0,

      powerPlayGoals: 0,
      powerPlayPoints: 0,
      shorthandedGoals: 0,
      gameWinningGoals: 0,

      minutesPlayed: 0,
    };
  }

  function createEmptyGoalieStats() {
    return {
      gamesPlayed: 0,
      gamesStarted: 0,

      wins: 0,
      losses: 0,
      overtimeLosses: 0,

      shotsAgainst: 0,
      saves: 0,
      goalsAgainst: 0,

      savePercentage: 0,
      goalsAgainstAverage: 0,

      shutouts: 0,
      minutesPlayed: 0,
    };
  }

  function createEmptyPlayerStats(position) {
    const normalizedPosition =
      normalizeAttributePosition(position);

    return normalizedPosition === 'G'
      ? createEmptyGoalieStats()
      : createEmptySkaterStats();
  }

  function createDefaultDevelopmentState(
    player = {}
  ) {
    const age =
      Number(player.age) || 14;

    const potential =
      Math.max(
        25,
        Math.min(
          99,
          Number(player.potential) ||
          Number(player.overall) ||
          60
        )
      );

    return {
      /*
       * Career-player XP is manually spent later.
       * NPC growth will use the same development philosophy
       * without requiring manual XP allocation.
       */
      xpAvailable: 0,
      xpEarnedCareer: 0,
      xpSpentCareer: 0,

      /*
       * XP remains one spendable currency.
       * This ledger records how it was earned so practices,
       * games, objectives, and career summaries can preserve
       * the development focus behind each reward.
       */
      xpEarnedByCategory: {
        skating: 0,
        shooting: 0,
        passing: 0,
        defense: 0,
        physical: 0,
        hockeyIQ: 0,
        goalie: 0,
        general: 0,
      },

      /*
       * Permanent record of XP earned toward each specific
       * skater or goalie attribute.
       *
       * The keys are populated as events award XP, so this
       * supports every attribute without maintaining separate
       * hard-coded skater and goalie copies.
       */
      /*
       * Current spendable XP held by each individual attribute.
       *
       * Example:
       * wristShotAccuracy: 105
       *
       * If the upgrade costs 100 XP, the attribute increases
       * by one and keeps the remaining 5 XP.
       */
      attributeXP: {},

      /*
       * Lifetime XP earned by each attribute.
       * This never decreases and is used for career summaries,
       * development history, and future analytics.
       */
      attributeXPEarnedCareer: {},

      attributeUpgradeCounts: {},

      developmentSeed:
        Number(player.developmentSeed) ||
        Math.random(),

      potential,
      potentialRole:
        player.potentialRole ||
        getPotentialRole(
          player.position,
          potential
        ),

      potentialAccuracy:
        player.potentialAccuracy ||
        generatePotentialAccuracy(),

      /*
       * Visible direction of the player's current potential
       * evaluation. This reflects how scouts view the player's
       * trajectory rather than changing every week.
       *
       * Values:
       * rising | stable | falling
       */
      potentialTrend:
        player.development
          ?.potentialTrend ||
        player.potentialTrend ||
        'stable',

      /*
       * Hidden confidence that the current potential evaluation
       * is accurate. Low confidence allows more movement; high
       * confidence makes the evaluation increasingly stable.
       */
      potentialConfidence:
        Math.max(
          25,
          Math.min(
            100,
            Number(
              player.development
                ?.potentialConfidence ??
              player.potentialConfidence
            ) || 50
          )
        ),

      lastPotentialChangeSeason:
        player.development
          ?.lastPotentialChangeSeason ??
        player.lastPotentialChangeSeason ??
        null,

      currentAge: age,

      /*
       * These ages describe the default growth curve.
       * Individual players may eventually vary through
       * hidden longevity and development traits.
       */
      growthStartAge: 14,
      growthSlowdownAge:
        normalizeAttributePosition(
          player.position
        ) === 'G'
          ? 29
          : 27,

      regressionStartAge:
        normalizeAttributePosition(
          player.position
        ) === 'G'
          ? 35
          : 32,

      lastDevelopmentSeason: null,
      totalOverallGrowth: 0,
      totalOverallRegression: 0,

      seasonAttributeGrowth: {},
      developmentHistory: [],
    };
  }

  function createDefaultHealthState(
    player = {}
  ) {
    return {
      status:
        player.injured
          ? 'injured'
          : 'healthy',

      injured:
        Boolean(player.injured),

      injury:
        player.injury || null,

      injuryRiskModifier: 0,
      gamesMissed: 0,

      lastRecoveryDate: null,
    };
  }

  function createDefaultScoutingProfile() {
    return {
      publicRank: null,
      previousRank: null,
      rankChange: null,
      lastRankedWeek: null,

      interestLevel: 'None',
      organizationsWatching: [],

      gamesObserved: 0,
      interviewsCompleted: 0,

      strengthsKnown: [],
      weaknessesKnown: [],

      evaluationAccuracy: 'Low',
      scoutingHistory: [],
    };
  }

  function createDefaultPlayerHistory() {
    return {
      seasons: [],
      teams: [],
      transactions: [],
      lineupChanges: [],
      awards: [],
      championships: [],
      milestones: [],
      records: [],
      draft: null,
    };
  }

  function ensureCanonicalPlayerContract(
    player = {}
  ) {
    if (!player || typeof player !== 'object') {
      return player;
    }

    /*
     * Preserve an existing nationality.
     * Players from older saves receive one once during migration.
     */
    if (!player.nationality) {
      player.nationality =
        generatePlayerNationality();
    }

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const emptyStats =
      createEmptyPlayerStats(
        player.position
      );

    /*
     * Preserve existing canonical season statistics.
     * For older saves, copy the current top-level statistics
     * into the new seasonStats structure.
     */
    if (isGoalie) {
      player.seasonStats = {
        ...emptyStats,
        ...(player.seasonStats || {}),

        gamesPlayed:
          Number(
            player.seasonStats?.gamesPlayed ??
            player.gamesPlayed
          ) || 0,

        gamesStarted:
          Number(
            player.seasonStats?.gamesStarted ??
            player.gamesStarted
          ) || 0,

        wins:
          Number(
            player.seasonStats?.wins ??
            player.wins
          ) || 0,

        losses:
          Number(
            player.seasonStats?.losses ??
            player.losses
          ) || 0,

        overtimeLosses:
          Number(
            player.seasonStats?.overtimeLosses ??
            player.overtimeLosses
          ) || 0,

        shotsAgainst:
          Number(
            player.seasonStats?.shotsAgainst ??
            player.shotsAgainst
          ) || 0,

        saves:
          Number(
            player.seasonStats?.saves ??
            player.saves
          ) || 0,

        goalsAgainst:
          Number(
            player.seasonStats?.goalsAgainst ??
            player.goalsAgainst
          ) || 0,

        savePercentage:
          Number(
            player.seasonStats?.savePercentage ??
            player.savePercentage
          ) || 0,

        goalsAgainstAverage:
          Number(
            player.seasonStats?.goalsAgainstAverage ??
            player.goalsAgainstAverage
          ) || 0,

        shutouts:
          Number(
            player.seasonStats?.shutouts ??
            player.shutouts
          ) || 0,

        minutesPlayed:
          Number(
            player.seasonStats?.minutesPlayed ??
            player.minutesPlayed
          ) || 0,
      };
    } else {
      player.seasonStats = {
        ...emptyStats,
        ...(player.seasonStats || {}),

        gamesPlayed:
          Number(
            player.seasonStats?.gamesPlayed ??
            player.gamesPlayed
          ) || 0,

        goals:
          Number(
            player.seasonStats?.goals ??
            player.goals
          ) || 0,

        assists:
          Number(
            player.seasonStats?.assists ??
            player.assists
          ) || 0,

        points:
          Number(
            player.seasonStats?.points ??
            player.points
          ) || 0,

        plusMinus:
          Number(
            player.seasonStats?.plusMinus ??
            player.plusMinus
          ) || 0,

        penaltyMinutes:
          Number(
            player.seasonStats?.penaltyMinutes ??
            player.penaltyMinutes
          ) || 0,

        shots:
          Number(
            player.seasonStats?.shots ??
            player.shots
          ) || 0,

        powerPlayGoals:
          Number(
            player.seasonStats?.powerPlayGoals ??
            player.powerPlayGoals
          ) || 0,

        powerPlayPoints:
          Number(
            player.seasonStats?.powerPlayPoints ??
            player.powerPlayPoints
          ) || 0,

        shorthandedGoals:
          Number(
            player.seasonStats?.shorthandedGoals ??
            player.shorthandedGoals
          ) || 0,

        gameWinningGoals:
          Number(
            player.seasonStats?.gameWinningGoals ??
            player.gameWinningGoals
          ) || 0,

        minutesPlayed:
          Number(
            player.seasonStats?.minutesPlayed ??
            player.minutesPlayed
          ) || 0,
      };
    }

    /*
     * Existing saves have not completed a prior season yet,
     * so season statistics are also the safest initial source
     * for missing career totals.
     */
    player.careerStats = {
      ...createEmptyPlayerStats(
        player.position
      ),
      ...player.seasonStats,
      ...(player.careerStats || {}),
    };

    const defaultDevelopment =
      createDefaultDevelopmentState(
        player
      );

    player.development = {
      ...defaultDevelopment,
      ...(player.development || {}),

      xpEarnedByCategory: {
        ...defaultDevelopment
          .xpEarnedByCategory,

        ...(
          player.development
            ?.xpEarnedByCategory || {}
        ),
      },

        /*
         * Older builds stored individual attribute XP under
         * xpEarnedByAttribute. Treat that existing value as both
         * the initial spendable balance and lifetime-earned total
         * so no previously earned XP is lost during migration.
         */
        attributeXP: {
          ...defaultDevelopment
            .attributeXP,

          ...(
            player.development
              ?.attributeXP ||
            player.development
              ?.xpEarnedByAttribute ||
            {}
          ),
        },

        attributeXPEarnedCareer: {
          ...defaultDevelopment
            .attributeXPEarnedCareer,

          ...(
            player.development
              ?.attributeXPEarnedCareer ||
            player.development
              ?.xpEarnedByAttribute ||
            {}
          ),
        },

        attributeUpgradeCounts: {
        ...defaultDevelopment.attributeUpgradeCounts,
        ...(
          player.development
            ?.attributeUpgradeCounts || {}
        ),
      },

      seasonAttributeGrowth: {
        ...defaultDevelopment.seasonAttributeGrowth,
        ...(
          player.development
            ?.seasonAttributeGrowth || {}
        ),
      },

      developmentHistory:
        Array.isArray(
          player.development
            ?.developmentHistory
        )
          ? [
              ...player.development
                .developmentHistory,
            ]
          : [],
    };

    /*
     * Every player owns one permanent hidden Development DNA
     * profile. Existing DNA is preserved exactly as saved;
     * older players receive it once during migration.
     */
    if (
      !player.development.dna ||
      typeof player.development.dna !== 'object'
    ) {
      player.development.dna =
        createPlayerDevelopmentDNA(
          player
        );
    } else {
      const existingDNA =
        player.development.dna;

      /*
       * Safely migrate partially created DNA from earlier
       * development builds without rerolling personality,
       * profile, seed, or original archetype.
       */
      player.development.dna = {
        version:
          existingDNA.version ||
          'development-dna-v1',

        originalArchetype:
          existingDNA.originalArchetype ??
          player.archetype ??
          null,

        originalProfile: {
          ...(
            existingDNA.originalProfile ||
            existingDNA.profile ||
            createPlayerDevelopmentProfile(
              player
            )
          ),
        },

        profile: {
          ...(
            existingDNA.profile ||
            existingDNA.originalProfile ||
            createPlayerDevelopmentProfile(
              player
            )
          ),
        },

        personality:
          existingDNA.personality ||
          'balanced',

        personalityLabel:
          existingDNA.personalityLabel ||
          DEVELOPMENT_PERSONALITY_PROFILES[
            existingDNA.personality ||
            'balanced'
          ]?.label ||
          'Balanced',

        seed:
          Math.max(
            0,
            Math.min(
              1,
              Number(
                existingDNA.seed ??
                player.development
                  .developmentSeed ??
                player.developmentSeed
              ) || 0.5
            )
          ),

        createdAt:
          existingDNA.createdAt ||
          _state.season?.currentDate ||
          _state.player?.currentDate ||
          null,
      };
    }

    const defaultHealth =
      createDefaultHealthState(
        player
      );

    player.health = {
      ...defaultHealth,
      ...(player.health || {}),
    };

    /*
     * Keep the older injury fields synchronized temporarily.
     * Current roster logic still reads these top-level values.
     */
    player.injured =
      Boolean(player.health.injured);

    player.injury =
      player.health.injury || null;

    const defaultScouting =
      createDefaultScoutingProfile();

    player.scoutingProfile = {
      ...defaultScouting,
      ...(player.scoutingProfile || {}),

      organizationsWatching:
        Array.isArray(
          player.scoutingProfile
            ?.organizationsWatching
        )
          ? [
              ...player.scoutingProfile
                .organizationsWatching,
            ]
          : [],

      strengthsKnown:
        Array.isArray(
          player.scoutingProfile
            ?.strengthsKnown
        )
          ? [
              ...player.scoutingProfile
                .strengthsKnown,
            ]
          : [],

      weaknessesKnown:
        Array.isArray(
          player.scoutingProfile
            ?.weaknessesKnown
        )
          ? [
              ...player.scoutingProfile
                .weaknessesKnown,
            ]
          : [],

      scoutingHistory:
        Array.isArray(
          player.scoutingProfile
            ?.scoutingHistory
        )
          ? [
              ...player.scoutingProfile
                .scoutingHistory,
            ]
          : [],
    };

    const defaultHistory =
      createDefaultPlayerHistory();

    player.history = {
      ...defaultHistory,
      ...(
        player.history &&
        !Array.isArray(player.history)
          ? player.history
          : {}
      ),
    };

    Object.keys(defaultHistory)
      .forEach(key => {
        if (
          Array.isArray(
            defaultHistory[key]
          )
        ) {
          player.history[key] =
            Array.isArray(
              player.history[key]
            )
              ? [...player.history[key]]
              : [];
        }
      });

    player.gameLog =
      Array.isArray(player.gameLog)
        ? [...player.gameLog]
        : [];

    player.accomplishments =
      Array.isArray(
        player.accomplishments
      )
        ? [...player.accomplishments]
        : [];

    player.specialTeamsAssignments = {
      powerPlay: [],
      penaltyKill: [],
      ...(
        player.specialTeamsAssignments ||
        {}
      ),
    };

    player.specialTeamsAssignments.powerPlay =
      Array.isArray(
        player.specialTeamsAssignments
          .powerPlay
      )
        ? [
            ...player.specialTeamsAssignments
              .powerPlay,
          ]
        : [];

    player.specialTeamsAssignments.penaltyKill =
      Array.isArray(
        player.specialTeamsAssignments
          .penaltyKill
      )
        ? [
            ...player.specialTeamsAssignments
              .penaltyKill,
          ]
        : [];

    player.recentForm =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.recentForm) || 50
        )
      );

    player.coachTrust =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.coachTrust) || 50
        )
      );

    player.morale =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.morale) || 50
        )
      );

    player.contractVersion =
      'player-v1';

    return player;
  }

  // ── Season Engine ─────────────────────────────────────────────

  function createDefaultSeasonState(
    source = {}
  ) {
    const playerDate =
      source.player?.currentDate;

    const worldDate =
      source.currentDate;

    let currentDate =
      typeof playerDate === 'string'
        ? playerDate
        : typeof worldDate === 'string'
          ? worldDate
          : (
              worldDate &&
              typeof worldDate === 'object'
            )
            ? [
                Number(worldDate.year) || 2022,
                String(
                  Number(worldDate.month) || 9
                ).padStart(2, '0'),
                String(
                  Number(worldDate.day) || 4
                ).padStart(2, '0'),
              ].join('-')
            : '2022-09-04';

    /*
     * Guard against malformed saved dates.
     */
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        currentDate
      )
    ) {
      currentDate = '2022-09-04';
    }

    const currentYear =
      Number(
        currentDate.slice(0, 4)
      ) || 2022;

    const currentMonth =
      Number(
        currentDate.slice(5, 7)
      ) || 9;

    /*
     * Infer the hockey season from the active calendar date.
     * July through December belong to the season beginning
     * that calendar year. January through June belong to the
     * season that began the previous calendar year.
     */
    const inferredSeasonStartYear =
      currentMonth >= 7
        ? currentYear
        : currentYear - 1;

    const savedSeasonStartYear =
      Number(
        source.season?.seasonStartYear
      ) || null;

    const legacySeasonStartYear =
      Number(
        source.currentSeason
          ?.toString()
          .slice(0, 4)
      ) || null;

    const candidateSeasonStartYear =
      savedSeasonStartYear ||
      legacySeasonStartYear ||
      inferredSeasonStartYear;

    /*
     * Older dev saves may contain a 2026 date while still
     * carrying the original 2022-23 label. Only trust the
     * saved season year when it matches the active date's
     * inferred hockey season.
     */
    const seasonStartYear =
      candidateSeasonStartYear ===
      inferredSeasonStartYear
        ? candidateSeasonStartYear
        : inferredSeasonStartYear;

    const seasonEndYear =
      seasonStartYear + 1;

    return {
      id:
        source.season?.id ||
        `season-${seasonStartYear}-${seasonEndYear}`,

      label:
        source.season?.label ||
        source.currentSeason ||
        `${seasonStartYear}-${String(
          seasonEndYear
        ).slice(-2)}`,

      seasonNumber:
        Math.max(
          1,
          Number(
            source.season?.seasonNumber
          ) || 1
        ),

      careerYear:
        Math.max(
          1,
          Number(
            source.season?.careerYear
          ) || 1
        ),

      seasonStartYear,
      seasonEndYear,

      currentDate,

      currentWeek:
        Math.max(
          1,
          Number(
            source.season?.currentWeek ??
            source.currentWeek
          ) || 1
        ),

      phase:
        source.season?.phase ||
        'regular-season',

      status:
        source.season?.status ||
        'active',

      level:
        source.season?.level ||
        'high-school',

      regularSeason: {
        started:
          Boolean(
            source.season
              ?.regularSeason
              ?.started
          ),

        completed:
          Boolean(
            source.season
              ?.regularSeason
              ?.completed
          ),

        gamesPerTeam:
          Number(
            source.season
              ?.regularSeason
              ?.gamesPerTeam
          ) || 28,
      },

      postseason: {
        qualified:
          Boolean(
            source.season
              ?.postseason
              ?.qualified
          ),

        started:
          Boolean(
            source.season
              ?.postseason
              ?.started
          ),

        completed:
          Boolean(
            source.season
              ?.postseason
              ?.completed
          ),
      },

      processedDates:
        Array.isArray(
          source.season?.processedDates
        )
          ? [
              ...source.season
                .processedDates,
            ]
          : [],

      processedWeeks:
        Array.isArray(
          source.season?.processedWeeks
        )
          ? [
              ...source.season
                .processedWeeks,
            ]
          : [],

      unresolvedEventIds:
        Array.isArray(
          source.season
            ?.unresolvedEventIds
        )
          ? [
              ...source.season
                .unresolvedEventIds,
            ]
          : [],

      completedEventIds:
        Array.isArray(
          source.season
            ?.completedEventIds
        )
          ? [
              ...source.season
                .completedEventIds,
            ]
          : [],

      lastProcessedDate:
        source.season
          ?.lastProcessedDate ||
        null,

      lastProcessedWeek:
        Number(
          source.season
            ?.lastProcessedWeek
        ) || 0,
    };
  }

  function ensureCanonicalSeasonState(
    state = {}
  ) {
    if (!state || typeof state !== 'object') {
      return null;
    }

    const canonicalSeason =
      createDefaultSeasonState(state);

    state.season = canonicalSeason;

    /*
     * Keep the older world fields synchronized temporarily.
     * Existing Schedule and Hub code still read some of them.
     */
    state.currentSeason =
      canonicalSeason.label;

    state.currentWeek =
      canonicalSeason.currentWeek;

    state.currentYear =
      Number(
        canonicalSeason.currentDate.slice(
          0,
          4
        )
      );

    state.currentDate =
      canonicalSeason.currentDate;

    if (
      !state.player ||
      typeof state.player !== 'object'
    ) {
      state.player = {};
    }

    state.player.currentDate =
      canonicalSeason.currentDate;

    state.seasonVersion =
      'season-v1';

    return canonicalSeason;
  }

  function getSeasonWeekForDate(
    dateString,
    seasonStartYear
  ) {
    if (
      typeof dateString !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      return 1;
    }

    const safeSeasonStartYear =
      Number(seasonStartYear) ||
      Number(
        dateString.slice(0, 4)
      ) ||
      2023;

    /*
     * Project Ice high-school seasons currently use
     * September 1 as the beginning of the season calendar.
     *
     * This remains compatible with the planned correction
     * to a 2023 freshman start without hard-coding the
     * entire career to one specific year.
     */
    const seasonStartDate =
      new Date(
        `${safeSeasonStartYear}-09-01T12:00:00`
      );

    const activeDate =
      new Date(
        `${dateString}T12:00:00`
      );

    if (
      Number.isNaN(
        seasonStartDate.getTime()
      ) ||
      Number.isNaN(
        activeDate.getTime()
      )
    ) {
      return 1;
    }

    if (
      activeDate < seasonStartDate
    ) {
      return 1;
    }

    const millisecondsPerDay =
      24 * 60 * 60 * 1000;

    const daysSinceSeasonStart =
      Math.floor(
        (
          activeDate.getTime() -
          seasonStartDate.getTime()
        ) /
        millisecondsPerDay
      );

    return Math.max(
      1,
      Math.floor(
        daysSinceSeasonStart / 7
      ) + 1
    );
  }

  function processCompletedSeasonWeek(
    completedWeek,
    options = {}
  ) {
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    const safeCompletedWeek =
      Math.max(
        1,
        Number(completedWeek) || 1
      );

    if (
      !Array.isArray(
        _state.season.processedWeeks
      )
    ) {
      _state.season.processedWeeks = [];
    }

    const wasAlreadyProcessed =
      _state.season.processedWeeks
        .some(
          week =>
            Number(week) ===
            safeCompletedWeek
        );

    if (wasAlreadyProcessed) {
      return {
        success: true,
        processed: false,
        week: safeCompletedWeek,
        reason: 'already-processed',
      };
    }

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — LEAGUE DEVELOPMENT
     * ============================================================
     *
     * A completed season week now advances development for the
     * rest of the league before the week is marked as processed.
     *
     * processLeagueDevelopmentWeek() owns NPC development logic.
     * This coordinator only decides when that existing system runs.
     */

    const leagueDevelopment =
      processLeagueDevelopmentWeek(
        {
          week:
            safeCompletedWeek,

          currentDate:
            _state.season
              ?.currentDate ||
            _state.player
              ?.currentDate ||
            null,
        },
        {
          save: false,
        }
      );

    if (
      !leagueDevelopment ||
      leagueDevelopment.success !==
        true
    ) {
      return {
        success: false,

        processed: false,

        week:
          safeCompletedWeek,

        reason:
          leagueDevelopment
            ?.reason ||
          'weekly-league-development-failed',

        leagueDevelopment:
          leagueDevelopment ||
          null,
      };
    }

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — TEAM DEPLOYMENT REVIEW
     * ============================================================
     *
     * After NPC development has been applied, every team refreshes
     * its canonical roster deployment.
     *
     * This allows:
     * - developed NPCs to move up or down even-strength lines
     * - goalie starter/backup order to refresh
     * - PP units to be reassigned
     * - PK units to be reassigned
     *
     * The career player's existing roster slot remains reserved.
     * Career-player promotion/demotion logic is handled separately
     * through the career/coach system rather than NPC overall alone.
     */

    const teamDeploymentResults =
      (
        Array.isArray(
          _state.teams
        )
          ? _state.teams
          : []
      ).map(team => {
        const refreshedTeam =
          refreshTeamRosterManagement(
            team.teamId,
            {
              save: false,
            }
          );

        return {
          teamId:
            team.teamId,

          success:
            Boolean(
              refreshedTeam
            ),
        };
      });

    _state.season.processedWeeks.push(
      safeCompletedWeek
    );

    _state.season.processedWeeks.sort(
      (a, b) =>
        Number(a) - Number(b)
    );

    _state.season.lastProcessedWeek =
      Math.max(
        Number(
          _state.season
            .lastProcessedWeek
        ) || 0,
        safeCompletedWeek
      );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,

      processed: true,

      week:
        safeCompletedWeek,

      reason:
        'week-processed',

      leagueDevelopment,

      teamDeploymentResults,
    };
  }

  function processCrossedSeasonWeeks(
    crossedWeeks = [],
    options = {}
  ) {
    const safeCrossedWeeks =
      Array.isArray(crossedWeeks)
        ? crossedWeeks
        : [];

    const results = [];

    safeCrossedWeeks.forEach(
      enteredWeek => {
        const completedWeek =
          Number(enteredWeek) - 1;

        if (completedWeek < 1) {
          return;
        }

        const result =
          processCompletedSeasonWeek(
            completedWeek,
            {
              save: false,
            }
          );

        results.push(result);
      }
    );

    if (
      options.save !== false &&
      results.some(
        result => result.processed
      )
    ) {
      save();
    }

    return results;
  }

  function getScheduledEventsForDate(
    dateString
  ) {
    if (
      typeof dateString !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      return [];
    }

    const schedule =
      Array.isArray(_state.schedule)
        ? _state.schedule
        : [];

    return schedule
      .filter(event =>
        String(event.date) ===
        String(dateString)
      )
      .map(event => {
        const eventId =
          event.id ||
          `event-${dateString}`;

        const isGame =
          Boolean(
            event.homeTeamId &&
            event.awayTeamId
          );

        return {
          id: eventId,

          sourceId: eventId,

          date:
            event.date,

          type:
            isGame
              ? 'game'
              : event.type || 'event',

          status:
            event.played ||
            event.completed
              ? 'completed'
              : 'scheduled',

          requiresPlayerInteraction:
            Boolean(
              event.requiresPlayerInteraction
            ),

          homeTeamId:
            event.homeTeamId || null,

          awayTeamId:
            event.awayTeamId || null,

          isRivalry:
            Boolean(event.isRivalry),

          isGameOfWeek:
            Boolean(event.isGameOfWeek),

          isMilestone:
            Boolean(event.isMilestone),

          milestoneType:
            event.milestoneType || null,

          scoutsAttending:
            Number(
              event.scoutsAttending
            ) || 0,

          rawEvent:
            event,
        };
      });
  }

  function resolveScheduledEvent(
    event,
    options = {}
  ) {
    if (
      !event ||
      typeof event !== 'object'
    ) {
      return {
        success: false,
        resolved: false,
        reason: 'invalid-event',
      };
    }

    switch (event.type) {
      case EVENT_TYPES.GAME:
        return resolveGameEvent(
          event,
          options
        );

      case EVENT_TYPES.PRACTICE:
        return resolvePracticeEvent(
          event,
          options
        );

        case EVENT_TYPES.TRAINING:
        /*
         * Training is a player-controlled weekly development event.
         * Never auto-resolve it while advancing the calendar.
         *
         * Stop simulation and allow game.js to open the Training
         * selection screen, where the career player chooses a focus.
         */
        return {
          success: true,
          resolved: false,
          stopSimulation: true,

          reason:
            'training-selection-required',

          eventId:
            event?.id ||
            event?.eventId ||
            null,

          event,
        };

      case EVENT_TYPES.RECOVERY:
        return resolveRecoveryEvent(
          event,
          options
        );

      case EVENT_TYPES.COACH_MEETING:
        return resolveCoachMeetingEvent(
          event,
          options
        );

      case EVENT_TYPES.MEDIA:
        return resolveMediaEvent(
          event,
          options
        );

      default:
        return {
          success: true,
          resolved: false,
          reason: 'resolver-not-implemented',

          event,
        };
    }
  }

  // ── Canonical Game Result Contract ──────────────────────────

  function createEmptySkaterGameLine(
    player = null
  ) {
    return {
      playerId:
        player?.id ||
        player?.playerId ||
        null,

      teamId:
        player?.teamId ||
        null,

      name:
        player
          ? `${player.firstName || ''} ${player.lastName || ''}`.trim()
          : '',

      position:
        player?.position ||
        null,

      overall:
        Number(
          player?.overall
        ) || 50,

      archetype:
        player?.archetype ||
        null,

      lineupAssignment:
        player?.lineupAssignment
          ? {
              ...player.lineupAssignment,
            }
          : null,

      started:
        false,

      dressed:
        true,

      /*
       * Every skater placed on the active game roster is
       * participating in this simulated game.
       *
       * This must be 1 so the performance/development engine
       * recognizes the appearance after simulation.
       */
      gamesPlayed:
        player
          ? 1
          : 0,

      goals:
        0,

      assists:
        0,

      points:
        0,

      plusMinus:
        0,

      penaltyMinutes:
        0,

      shots:
        0,

      powerPlayGoals:
        0,

      powerPlayPoints:
        0,

      shorthandedGoals:
        0,

      gameWinningGoals:
        0,

      faceoffWins:
        0,

      faceoffAttempts:
        0,

      blockedShots:
        0,

      hits:
        0,

      takeaways:
        0,

      giveaways:
        0,

      timeOnIceSeconds:
        0,

      powerPlayTimeSeconds:
        0,

      penaltyKillTimeSeconds:
        0,

      gameRating:
        null,

      firstStar:
        false,

      secondStar:
        false,

      thirdStar:
        false,
    };
  }

  function createEmptyGoalieGameLine(
    player = null
  ) {
    return {
      playerId:
        player?.id ||
        player?.playerId ||
        null,

      teamId:
        player?.teamId ||
        null,

      name:
        player
          ? `${player.firstName || ''} ${player.lastName || ''}`.trim()
          : '',

      position:
        'G',

      goalieRole:
        player?.lineupAssignment
          ?.goalieRole ||
        player?.goalieRole ||
        null,

      started:
        false,

      dressed:
        true,

      gamesPlayed:
        0,

      wins:
        0,

      losses:
        0,

      overtimeLosses:
        0,

      shotsAgainst:
        0,

      saves:
        0,

      goalsAgainst:
        0,

      savePercentage:
        null,

      shutout:
        false,

      minutesPlayed:
        0,

      decision:
        null,

      gameRating:
        null,

      firstStar:
        false,

      secondStar:
        false,

      thirdStar:
        false,
    };
  }

  function createEmptyTeamGameResult(
    teamId = null
  ) {
    return {
      teamId,

      score:
        0,

      shots:
        0,

      penaltyMinutes:
        0,

      powerPlayOpportunities:
        0,

      powerPlayGoals:
        0,

      shorthandedGoals:
        0,

      faceoffWins:
        0,

      blockedShots:
        0,

      hits:
        0,

      giveaways:
        0,

      takeaways:
        0,

      periodScores: [
        0,
        0,
        0,
      ],

      overtimeScore:
        0,

      shootoutScore:
        0,

      skaters: [],

      goalies: [],
    };
  }

  function createEmptyGameResult(
    event = {}
  ) {
    const homeTeamId =
      event?.homeTeamId ||
      null;

    const awayTeamId =
      event?.awayTeamId ||
      null;

    return {
      success:
        true,

      completed:
        false,

      gameId:
        event?.id ||
        event?.gameId ||
        null,

      eventId:
        event?.id ||
        event?.eventId ||
        null,

      date:
        event?.date ||
        null,

      homeTeamId,

      awayTeamId,

      status:
        'scheduled',

      winnerTeamId:
        null,

      loserTeamId:
        null,

      resultType:
        null,

      wentToOvertime:
        false,

      wentToShootout:
        false,

      home:
        createEmptyTeamGameResult(
          homeTeamId
        ),

      away:
        createEmptyTeamGameResult(
          awayTeamId
        ),

      scoringPlays: [],

      penalties: [],

      playByPlay: [],

      threeStars: [],

      context: {
        isRivalry:
          Boolean(
            event?.isRivalry
          ),

        isGameOfWeek:
          Boolean(
            event?.isGameOfWeek
          ),

        isMilestone:
          Boolean(
            event?.isMilestone
          ),

        milestoneType:
          event?.milestoneType ||
          null,

        scoutsAttending:
          Number(
            event?.scoutsAttending
          ) || 0,
      },

      metadata: {
        simulatedAt:
          null,

        simulationVersion:
          'game-sim-v1',
      },
    };
  }

  function createTeamGameRoster(
    teamId
  ) {
    const team =
      getTeamById(
        teamId
      );

    if (
      !team ||
      !Array.isArray(
        team.roster
      )
    ) {
      return {
        success: false,

        reason:
          'team-roster-not-found',

        teamId,

        team:
          null,

        skaters: [],

        goalies: [],

        startingGoalie:
          null,

        backupGoalie:
          null,

        specialTeams: {
          powerPlay: [],
          penaltyKill: [],
        },
      };
    }

    /*
     * Ensure the canonical even-strength lineup and
     * special-teams deployments are current before the
     * simulator reads them.
     */
    refreshTeamRosterManagement(
      teamId,
      {
        save: false,
      }
    );

    const activePlayers =
      team.roster.filter(
        player =>
          player?.lineupStatus ===
            'active' &&
          player?.lineupAssignment
      );

    const skaters =
      activePlayers
        .filter(
          player =>
            normalizeAttributePosition(
              player.position
            ) !== 'G'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstAssignment =
              firstPlayer
                .lineupAssignment ||
              {};

            const secondAssignment =
              secondPlayer
                .lineupAssignment ||
              {};

            const unitOrder = {
              forward: 1,
              defense: 2,
              goalie: 3,
            };

            const unitDifference =
              (
                unitOrder[
                  firstAssignment.unit
                ] || 99
              ) -
              (
                unitOrder[
                  secondAssignment.unit
                ] || 99
              );

            if (
              unitDifference !== 0
            ) {
              return unitDifference;
            }

            const firstDeployment =
              Number(
                firstAssignment.line ??
                firstAssignment.pair
              ) || 99;

            const secondDeployment =
              Number(
                secondAssignment.line ??
                secondAssignment.pair
              ) || 99;

            if (
              firstDeployment !==
              secondDeployment
            ) {
              return (
                firstDeployment -
                secondDeployment
              );
            }

            return String(
              firstAssignment.position ||
              ''
            ).localeCompare(
              String(
                secondAssignment.position ||
                ''
              )
            );
          }
        );

    const goalies =
      activePlayers
        .filter(
          player =>
            normalizeAttributePosition(
              player.position
            ) === 'G'
        )
        .sort(
          (
            firstGoalie,
            secondGoalie
          ) => {
            const roleOrder = {
              Starter: 1,
              Backup: 2,
            };

            const firstRole =
              firstGoalie
                .lineupAssignment
                ?.goalieRole ||
              firstGoalie.goalieRole ||
              '';

            const secondRole =
              secondGoalie
                .lineupAssignment
                ?.goalieRole ||
              secondGoalie.goalieRole ||
              '';

            return (
              (
                roleOrder[
                  firstRole
                ] || 99
              ) -
              (
                roleOrder[
                  secondRole
                ] || 99
              )
            );
          }
        );

    const startingGoalie =
      goalies.find(
        goalie =>
          goalie
            .lineupAssignment
            ?.goalieRole ===
          'Starter'
      ) ||
      goalies[0] ||
      null;

    const backupGoalie =
      goalies.find(
        goalie =>
          goalie !==
            startingGoalie &&
          goalie
            .lineupAssignment
            ?.goalieRole ===
          'Backup'
      ) ||
      goalies.find(
        goalie =>
          goalie !==
          startingGoalie
      ) ||
      null;

    return {
      success: true,

      reason:
        'team-game-roster-created',

      teamId:
        team.teamId,

      team,

      skaters,

      goalies,

      startingGoalie,

      backupGoalie,

      specialTeams: {
        powerPlay:
          Array.isArray(
            team.specialTeams
              ?.powerPlay
          )
            ? team.specialTeams
                .powerPlay
            : [],

        penaltyKill:
          Array.isArray(
            team.specialTeams
              ?.penaltyKill
          )
            ? team.specialTeams
                .penaltyKill
            : [],
      },
    };
  }

  function populateGameResultRosters(
    gameResult
  ) {
    if (
      !gameResult ||
      typeof gameResult !== 'object'
    ) {
      return {
        success: false,

        reason:
          'invalid-game-result',

        gameResult:
          null,

        homeRoster:
          null,

        awayRoster:
          null,
      };
    }

    const homeRoster =
      createTeamGameRoster(
        gameResult.homeTeamId
      );

    if (!homeRoster.success) {
      return {
        success: false,

        reason:
          'home-game-roster-not-created',

        gameResult,

        homeRoster,

        awayRoster:
          null,
      };
    }

    const awayRoster =
      createTeamGameRoster(
        gameResult.awayTeamId
      );

    if (!awayRoster.success) {
      return {
        success: false,

        reason:
          'away-game-roster-not-created',

        gameResult,

        homeRoster,

        awayRoster,
      };
    }

    gameResult.home.skaters =
      homeRoster.skaters.map(
        player =>
          createEmptySkaterGameLine(
            player
          )
      );

    gameResult.away.skaters =
      awayRoster.skaters.map(
        player =>
          createEmptySkaterGameLine(
            player
          )
      );

    gameResult.home.goalies =
      homeRoster.goalies.map(
        player => {
          const goalieLine =
            createEmptyGoalieGameLine(
              player
            );

          goalieLine.started =
            player ===
            homeRoster.startingGoalie;

          goalieLine.gamesPlayed =
            goalieLine.started
              ? 1
              : 0;

          return goalieLine;
        }
      );

    gameResult.away.goalies =
      awayRoster.goalies.map(
        player => {
          const goalieLine =
            createEmptyGoalieGameLine(
              player
            );

          goalieLine.started =
            player ===
            awayRoster.startingGoalie;

          goalieLine.gamesPlayed =
            goalieLine.started
              ? 1
              : 0;

          return goalieLine;
        }
      );

    return {
      success: true,

      reason:
        'game-result-rosters-populated',

      gameResult,

      homeRoster,

      awayRoster,
    };
  }

  function createTeamGameStrengthProfile(
    gameRoster
  ) {
    if (
      !gameRoster?.success ||
      !gameRoster.team
    ) {
      return {
        success: false,

        reason:
          'invalid-game-roster',

        teamId:
          gameRoster?.teamId ||
          null,

        overall:
          50,

        offense:
          50,

        defense:
          50,

        powerPlay:
          50,

        penaltyKill:
          50,

        goaltending:
          50,
      };
    }

    const skaters =
      Array.isArray(
        gameRoster.skaters
      )
        ? gameRoster.skaters
        : [];

    const forwards =
      skaters.filter(
        player =>
          player?.lineupAssignment
            ?.unit === 'forward'
      );

    const defensemen =
      skaters.filter(
        player =>
          player?.lineupAssignment
            ?.unit === 'defense'
      );

    function averagePlayerOverall(
      players = [],
      fallback = 50
    ) {
      if (
        !Array.isArray(players) ||
        players.length === 0
      ) {
        return fallback;
      }

      const total =
        players.reduce(
          (sum, player) =>
            sum +
            (
              Number(
                player?.overall
              ) || fallback
            ),
          0
        );

      return total / players.length;
    }

    function getPlayerByRosterId(
      playerId
    ) {
      if (!playerId) {
        return null;
      }

      return (
        gameRoster.team.roster.find(
          player =>
            String(
              player?.playerId ||
              player?.id
            ) ===
            String(playerId)
        ) ||
        null
      );
    }

    function getSpecialTeamsPlayers(
      units = []
    ) {
      const playerIds =
        new Set();

      units.forEach(unit => {
        const slots =
          unit?.slots &&
          typeof unit.slots ===
            'object'
            ? unit.slots
            : {};

        Object.values(
          slots
        ).forEach(playerId => {
          if (playerId) {
            playerIds.add(
              String(playerId)
            );
          }
        });
      });

      return Array.from(
        playerIds
      )
        .map(
          playerId =>
            getPlayerByRosterId(
              playerId
            )
        )
        .filter(Boolean);
    }

    const forwardOverall =
      averagePlayerOverall(
        forwards
      );

    const defenseOverall =
      averagePlayerOverall(
        defensemen
      );

    const startingGoalie =
      gameRoster.startingGoalie;

    const goalieOverall =
      Number(
        startingGoalie?.overall
      ) ||
      (
        startingGoalie?.attributes
          ? calculateGoalieOverallFromAttributes(
              startingGoalie.attributes
            )
          : 50
      );

    const powerPlayPlayers =
      getSpecialTeamsPlayers(
        gameRoster.specialTeams
          ?.powerPlay
      );

    const penaltyKillPlayers =
      getSpecialTeamsPlayers(
        gameRoster.specialTeams
          ?.penaltyKill
      );

    const powerPlayOverall =
      averagePlayerOverall(
        powerPlayPlayers,
        (
          forwardOverall *
          0.65
        ) +
        (
          defenseOverall *
          0.35
        )
      );

    const penaltyKillOverall =
      averagePlayerOverall(
        penaltyKillPlayers,
        (
          defenseOverall *
          0.60
        ) +
        (
          forwardOverall *
          0.40
        )
      );

    /*
     * These ratings are simulator inputs, not public team ratings.
     * Deployment matters: top forwards drive offense, defensemen
     * and the starting goalie drive prevention.
     */
    const offense =
      (
        forwardOverall *
        0.78
      ) +
      (
        defenseOverall *
        0.22
      );

    const defense =
      (
        defenseOverall *
        0.62
      ) +
      (
        forwardOverall *
        0.18
      ) +
      (
        goalieOverall *
        0.20
      );

    const overall =
      (
        offense *
        0.38
      ) +
      (
        defense *
        0.32
      ) +
      (
        powerPlayOverall *
        0.10
      ) +
      (
        penaltyKillOverall *
        0.10
      ) +
      (
        goalieOverall *
        0.10
      );

    function roundStrength(
      value
    ) {
      return Math.max(
        25,
        Math.min(
          99,
          Math.round(value)
        )
      );
    }

    return {
      success: true,

      reason:
        'team-game-strength-created',

      teamId:
        gameRoster.teamId,

      overall:
        roundStrength(
          overall
        ),

      offense:
        roundStrength(
          offense
        ),

      defense:
        roundStrength(
          defense
        ),

      powerPlay:
        roundStrength(
          powerPlayOverall
        ),

      penaltyKill:
        roundStrength(
          penaltyKillOverall
        ),

      goaltending:
        roundStrength(
          goalieOverall
        ),

      components: {
        forwardOverall:
          roundStrength(
            forwardOverall
          ),

        defenseOverall:
          roundStrength(
            defenseOverall
          ),

        startingGoalieOverall:
          roundStrength(
            goalieOverall
          ),

        powerPlayPlayerCount:
          powerPlayPlayers.length,

        penaltyKillPlayerCount:
          penaltyKillPlayers.length,
      },
    };
  }

  function createStableGameSeed(
    gameResult = {}
  ) {
    const seedText = [
      gameResult.gameId,
      gameResult.date,
      gameResult.homeTeamId,
      gameResult.awayTeamId,
      gameResult.metadata
        ?.simulationVersion,
    ]
      .filter(
        value =>
          value !== null &&
          value !== undefined
      )
      .join('|');

    let hash =
      2166136261;

    for (
      let index = 0;
      index < seedText.length;
      index++
    ) {
      hash ^=
        seedText.charCodeAt(
          index
        );

      hash =
        Math.imul(
          hash,
          16777619
        );
    }

    return hash >>> 0;
  }

  function createSeededGameRandom(
    seed
  ) {
    let state =
      Number(seed) >>> 0;

    return function seededRandom() {
      state +=
        0x6D2B79F5;

      let value =
        state;

      value =
        Math.imul(
          value ^
          (
            value >>> 15
          ),
          value | 1
        );

      value ^=
        value +
        Math.imul(
          value ^
          (
            value >>> 7
          ),
          value | 61
        );

      return (
        (
          value ^
          (
            value >>> 14
          )
        ) >>> 0
      ) / 4294967296;
    };
  }

  function createGameRandomContext(
    gameResult = {}
  ) {
    const seed =
      createStableGameSeed(
        gameResult
      );

    const random =
      createSeededGameRandom(
        seed
      );

    return {
      seed,

      random,

      /*
       * Returns a stable decimal between min and max.
       */
      range(
        minimum,
        maximum
      ) {
        const min =
          Number(minimum) || 0;

        const max =
          Number(maximum) || 0;

        return (
          min +
          (
            max - min
          ) *
          random()
        );
      },

      /*
       * Returns a stable whole number including both limits.
       */
      integer(
        minimum,
        maximum
      ) {
        const min =
          Math.ceil(
            Number(minimum) || 0
          );

        const max =
          Math.floor(
            Number(maximum) || 0
          );

        return Math.floor(
          this.range(
            min,
            max + 1
          )
        );
      },

      chance(
        probability
      ) {
        const normalizedProbability =
          Math.max(
            0,
            Math.min(
              1,
              Number(probability) || 0
            )
          );

        return (
          random() <
          normalizedProbability
        );
      },
    };
  }

  function createGameShotTotals(
    gameResult,
    gameRandom
  ) {
    const homeMatchup =
      gameResult?.matchup?.home;

    const awayMatchup =
      gameResult?.matchup?.away;

    if (
      !homeMatchup ||
      !awayMatchup ||
      !gameRandom
    ) {
      return {
        success: false,

        reason:
          'game-shot-inputs-missing',

        homeShots:
          0,

        awayShots:
          0,
      };
    }

    /*
     * High-school games should generally land in the
     * mid-to-high 20s or low 30s for each team, while
     * still allowing occasional one-sided or high-event games.
     */
    const baseShots =
      29;

    const homeOffenseEdge =
      (
        Number(
          homeMatchup.offense
        ) || 50
      ) -
      (
        Number(
          awayMatchup.defense
        ) || 50
      );

    const awayOffenseEdge =
      (
        Number(
          awayMatchup.offense
        ) || 50
      ) -
      (
        Number(
          homeMatchup.defense
        ) || 50
      );

    const homeOverallEdge =
      (
        Number(
          homeMatchup.overall
        ) || 50
      ) -
      (
        Number(
          awayMatchup.overall
        ) || 50
      );

    const homeIceAdvantage =
      Number(
        gameResult.matchup
          ?.homeIceAdvantage
      ) || 0;

    /*
     * Matchup quality affects expected shot volume, but ratings
     * should not overwhelm natural game-to-game variation.
     */
    const expectedHomeShots =
      baseShots +
      (
        homeOffenseEdge *
        0.22
      ) +
      (
        homeOverallEdge *
        0.08
      ) +
      (
        homeIceAdvantage *
        0.45
      );

    const expectedAwayShots =
      baseShots +
      (
        awayOffenseEdge *
        0.22
      ) -
      (
        homeOverallEdge *
        0.08
      );

    /*
     * Shared pace moves both teams in the same direction.
     * Individual variance prevents the totals from mirroring
     * each other too closely.
     */
    const gamePace =
      gameRandom.range(
        -4,
        5
      );

    const homeVariance =
      gameRandom.range(
        -5,
        6
      );

    const awayVariance =
      gameRandom.range(
        -5,
        6
      );

    function normalizeShotTotal(
      value
    ) {
      return Math.max(
        16,
        Math.min(
          48,
          Math.round(value)
        )
      );
    }

    const homeShots =
      normalizeShotTotal(
        expectedHomeShots +
        gamePace +
        homeVariance
      );

    const awayShots =
      normalizeShotTotal(
        expectedAwayShots +
        gamePace +
        awayVariance
      );

    return {
      success: true,

      reason:
        'game-shot-totals-created',

      homeShots,

      awayShots,

      expected: {
        home:
          Number(
            expectedHomeShots
              .toFixed(2)
          ),

        away:
          Number(
            expectedAwayShots
              .toFixed(2)
          ),
      },

      factors: {
        gamePace:
          Number(
            gamePace.toFixed(2)
          ),

        homeOffenseEdge,

        awayOffenseEdge,

        homeOverallEdge,

        homeIceAdvantage,
      },
    };
  }

  function createGameGoalTotals(
    gameResult,
    gameRandom
  ) {
    const homeMatchup =
      gameResult?.matchup?.home;

    const awayMatchup =
      gameResult?.matchup?.away;

    const homeShots =
      Number(
        gameResult?.home?.shots
      ) || 0;

    const awayShots =
      Number(
        gameResult?.away?.shots
      ) || 0;

    if (
      !homeMatchup ||
      !awayMatchup ||
      !gameRandom ||
      homeShots <= 0 ||
      awayShots <= 0
    ) {
      return {
        success: false,

        reason:
          'game-goal-inputs-missing',

        homeGoals:
          0,

        awayGoals:
          0,
      };
    }

    /*
     * Start from a realistic scoring probability per shot.
     * Team offense raises finishing quality, while the
     * opposing starting goalie lowers it.
     */
    const baseShootingPercentage =
      0.095;

    const homeOffenseAdjustment =
      (
        (
          Number(
            homeMatchup.offense
          ) || 50
        ) - 50
      ) * 0.0012;

    const awayOffenseAdjustment =
      (
        (
          Number(
            awayMatchup.offense
          ) || 50
        ) - 50
      ) * 0.0012;

    const homeGoalieAdjustment =
      (
        (
          Number(
            homeMatchup.goaltending
          ) || 50
        ) - 50
      ) * 0.0014;

    const awayGoalieAdjustment =
      (
        (
          Number(
            awayMatchup.goaltending
          ) || 50
        ) - 50
      ) * 0.0014;

    /*
     * Finishing varies from game to game even when the same
     * teams and goalies are involved.
     */
    const homeFinishingVariance =
      gameRandom.range(
        -0.014,
        0.015
      );

    const awayFinishingVariance =
      gameRandom.range(
        -0.014,
        0.015
      );

    function normalizeScoringChance(
      value
    ) {
      return Math.max(
        0.045,
        Math.min(
          0.17,
          value
        )
      );
    }

    const homeScoringChance =
      normalizeScoringChance(
        baseShootingPercentage +
        homeOffenseAdjustment -
        awayGoalieAdjustment +
        homeFinishingVariance
      );

    const awayScoringChance =
      normalizeScoringChance(
        baseShootingPercentage +
        awayOffenseAdjustment -
        homeGoalieAdjustment +
        awayFinishingVariance
      );

    function simulateGoalsFromShots(
      shotTotal,
      scoringChance
    ) {
      let goals = 0;

      for (
        let shotIndex = 0;
        shotIndex < shotTotal;
        shotIndex++
      ) {
        if (
          gameRandom.chance(
            scoringChance
          )
        ) {
          goals += 1;
        }
      }

      return goals;
    }

    const homeGoals =
      simulateGoalsFromShots(
        homeShots,
        homeScoringChance
      );

    const awayGoals =
      simulateGoalsFromShots(
        awayShots,
        awayScoringChance
      );

    return {
      success: true,

      reason:
        'game-goal-totals-created',

      homeGoals,

      awayGoals,

      tiedAfterRegulation:
        homeGoals ===
        awayGoals,

      shootingPercentage: {
        home:
          Number(
            homeScoringChance
              .toFixed(4)
          ),

        away:
          Number(
            awayScoringChance
              .toFixed(4)
          ),
      },

      expectedGoals: {
        home:
          Number(
            (
              homeShots *
              homeScoringChance
            ).toFixed(2)
          ),

        away:
          Number(
            (
              awayShots *
              awayScoringChance
            ).toFixed(2)
          ),
      },

      factors: {
        homeOffenseAdjustment:
          Number(
            homeOffenseAdjustment
              .toFixed(4)
          ),

        awayOffenseAdjustment:
          Number(
            awayOffenseAdjustment
              .toFixed(4)
          ),

        homeGoalieAdjustment:
          Number(
            homeGoalieAdjustment
              .toFixed(4)
          ),

        awayGoalieAdjustment:
          Number(
            awayGoalieAdjustment
              .toFixed(4)
          ),

        homeFinishingVariance:
          Number(
            homeFinishingVariance
              .toFixed(4)
          ),

        awayFinishingVariance:
          Number(
            awayFinishingVariance
              .toFixed(4)
          ),
      },
    };
  }

  function distributeTeamShots(
    teamGameResult,
    teamStrength,
    gameRandom
  ) {
    if (
      !teamGameResult ||
      !Array.isArray(teamGameResult.skaters)
    ) {
      return {
        success: false,
        reason: 'invalid-team-game-result',
      };
    }

    const shotTotal =
      Number(teamGameResult.shots) || 0;

    if (shotTotal <= 0) {
      return {
        success: true,
        reason: 'no-team-shots',
        skaters: teamGameResult.skaters,
      };
    }

    const weightedPlayers =
      teamGameResult.skaters.map(
        skater => {

          const assignment =
            skater.lineupAssignment || {};

          let weight = 1;

          /*
           * Higher lines naturally generate more offense.
           */
          if (assignment.line === 1) weight += 3.5;
          else if (assignment.line === 2) weight += 2.5;
          else if (assignment.line === 3) weight += 1.5;
          else if (assignment.line === 4) weight += 0.5;

          /*
           * Defensemen generally shoot less than forwards.
           */
          if (assignment.unit === 'defense') {
            weight *= 0.72;
          }

          /*
           * Better offensive players should generate
           * more shot attempts.
           */
          weight +=
            (
              Number(skater.overall) || 50
            ) / 30;

          return {
            skater,
            weight,
            shots: 0,
          };
        }
      );

    const totalWeight =
      weightedPlayers.reduce(
        (sum, player) =>
          sum + player.weight,
        0
      );

    let assignedShots = 0;

    weightedPlayers.forEach(player => {

      const expectedShots =
        (
          player.weight /
          totalWeight
        ) * shotTotal;

      const variance =
        gameRandom.range(
          -0.45,
          0.45
        );

      const shots =
        Math.max(
          0,
          Math.round(
            expectedShots +
            variance
          )
        );

      player.shots = shots;
      assignedShots += shots;

    });

    /*
     * Fix rounding so totals always equal the
     * canonical team shot total.
     */
    while (assignedShots < shotTotal) {

      const player =
        weightedPlayers[
          gameRandom.integer(
            0,
            weightedPlayers.length - 1
          )
        ];

      player.shots++;
      assignedShots++;

    }

    while (assignedShots > shotTotal) {

      const eligible =
        weightedPlayers.filter(
          player => player.shots > 0
        );

      if (!eligible.length) break;

      const player =
        eligible[
          gameRandom.integer(
            0,
            eligible.length - 1
          )
        ];

      player.shots--;
      assignedShots--;

    }

    weightedPlayers.forEach(player => {

      const line =
        teamGameResult.skaters.find(
          skater =>
            skater.playerId ===
            player.skater.playerId
        );

      if (line) {
        line.shots = player.shots;
      }

    });

    return {
      success: true,
      reason: 'team-shots-distributed',
      skaters: teamGameResult.skaters,
    };
  }

  function distributeTeamGoals(
    teamGameResult,
    gameRandom
  ) {
    if (
      !teamGameResult ||
      !Array.isArray(
        teamGameResult.skaters
      ) ||
      !gameRandom
    ) {
      return {
        success: false,

        reason:
          'invalid-team-goal-inputs',

        assignedGoals:
          0,

        scorers: [],
      };
    }

    const teamGoals =
      Math.max(
        0,
        Number(
          teamGameResult.score
        ) || 0
      );

    if (teamGoals === 0) {
      return {
        success: true,

        reason:
          'team-scoreless',

        assignedGoals:
          0,

        scorers: [],
      };
    }

    /*
     * Build one selectable ticket for every recorded shot.
     * This ensures:
     *
     * - players with more shots are more likely to score,
     * - every goal belongs to an actual shooter,
     * - no player can score more goals than they had shots.
     */
    const availableShotTickets = [];

    teamGameResult.skaters.forEach(
      skater => {
        const playerShots =
          Math.max(
            0,
            Number(
              skater.shots
            ) || 0
          );

        for (
          let shotIndex = 0;
          shotIndex < playerShots;
          shotIndex++
        ) {
          availableShotTickets.push({
            playerId:
              skater.playerId,

            shotIndex,
          });
        }
      }
    );

    if (
      availableShotTickets.length <
      teamGoals
    ) {
      return {
        success: false,

        reason:
          'not-enough-player-shots-for-goals',

        assignedGoals:
          0,

        scorers: [],
      };
    }

    const scorers = [];

    for (
      let goalIndex = 0;
      goalIndex < teamGoals;
      goalIndex++
    ) {
      const selectedTicketIndex =
        gameRandom.integer(
          0,
          availableShotTickets.length - 1
        );

      const [
        selectedTicket,
      ] =
        availableShotTickets.splice(
          selectedTicketIndex,
          1
        );

      const scorerLine =
        teamGameResult.skaters.find(
          skater =>
            String(
              skater.playerId
            ) ===
            String(
              selectedTicket.playerId
            )
        );

      if (!scorerLine) {
        return {
          success: false,

          reason:
            'goal-scorer-line-not-found',

          assignedGoals:
            scorers.length,

          scorers,
        };
      }

      scorerLine.goals =
        (
          Number(
            scorerLine.goals
          ) || 0
        ) + 1;

      scorerLine.points =
        (
          Number(
            scorerLine.goals
          ) || 0
        ) +
        (
          Number(
            scorerLine.assists
          ) || 0
        );

      scorers.push({
        playerId:
          scorerLine.playerId,

        teamId:
          scorerLine.teamId,

        name:
          scorerLine.name,

        goalNumber:
          scorerLine.goals,

        teamGoalNumber:
          goalIndex + 1,

        sourceShotIndex:
          selectedTicket.shotIndex,
      });
    }

    const assignedGoals =
      teamGameResult.skaters.reduce(
        (total, skater) =>
          total +
          (
            Number(
              skater.goals
            ) || 0
          ),
        0
      );

    return {
      success:
        assignedGoals ===
        teamGoals,

      reason:
        assignedGoals ===
          teamGoals
          ? 'team-goals-distributed'
          : 'team-goal-total-mismatch',

      assignedGoals,

      scorers,
    };
  }

  function createEmptyScoringPlay() {
    return {
      goalNumber: 0,

      period: null,

      timeRemaining: null,

      elapsedSeconds: null,

      teamId: null,

      strength: 'EV',

      scorerId: null,

      scorerName: '',

      primaryAssistId: null,

      primaryAssistName: '',

      secondaryAssistId: null,

      secondaryAssistName: '',

      goalieId: null,

      goalieName: '',

      homeScore: 0,

      awayScore: 0,

      gameWinningGoal: false,

      overtimeGoal: false,

      shootoutGoal: false,

      emptyNet: false,
    };
  }

    function buildScoringPlays(
      teamGameResult,
      opposingGoalies,
      gameRandom,
      isHomeTeam = false
    ) {
    if (
      !teamGameResult ||
      !Array.isArray(teamGameResult.skaters)
    ) {
      return {
        success: false,
        reason: 'invalid-team-game-result',
        scoringPlays: [],
      };
    }

    const scoringPlays = [];

    const scorerQueue =
      teamGameResult.skaters.flatMap(
        skater => {

          const goals =
            Number(skater.goals) || 0;

          return Array.from(
            { length: goals },
            () => skater
          );

        }
      );

    scorerQueue.forEach(
      (scorer, index) => {

        const play =
          createEmptyScoringPlay();

        /*
         * Distribute goals across regulation.
         * Version 1 uses a weighted period selection
         * that slightly favors the second period,
         * similar to real hockey scoring distributions.
         */
        const periodRoll =
          gameRandom.range(
            0,
            100
          );

        if (periodRoll < 31) {
          play.period = 1;
        } else if (
          periodRoll < 67
        ) {
          play.period = 2;
        } else {
          play.period = 3;
        }

        /*
         * Random time remaining in the selected period.
         * Later this will become chronological.
         */
        const totalSeconds =
          gameRandom.integer(
            0,
            20 * 60 - 1
          );

        const minutes =
          Math.floor(
            totalSeconds / 60
          );

        const seconds =
          totalSeconds % 60;

        play.timeRemaining =
          `${String(
            19 - minutes
          ).padStart(2, '0')}:${String(
            59 - seconds
          ).padStart(2, '0')}`;

        play.elapsedSeconds =
          (
            play.period - 1
          ) *
            20 *
            60 +
          totalSeconds;

        play.goalNumber =
          index + 1;

        play.teamId =
          teamGameResult.teamId;

        play.isHomeGoal =
          Boolean(isHomeTeam);

        play.scorerId =
          scorer.playerId;

        play.scorerName =
          scorer.name;

        const goalie =
          Array.isArray(opposingGoalies)
            ? opposingGoalies.find(
                goalie =>
                  goalie.started
              ) ||
              opposingGoalies[0]
            : null;

        if (goalie) {
          play.goalieId =
            goalie.playerId;

          play.goalieName =
            goalie.name;
        }

        /*
         * Select up to two assisting teammates.
         * The scorer cannot assist their own goal,
         * and the same player cannot receive both assists.
         */
        const assistPool =
          teamGameResult.skaters.filter(
            teammate =>
              teammate.playerId !==
              scorer.playerId
          );

        if (
          assistPool.length > 0 &&
          gameRandom.chance(0.92)
        ) {
          const primary =
            assistPool[
              gameRandom.integer(
                0,
                assistPool.length - 1
              )
            ];

          play.primaryAssistId =
            primary.playerId;

          play.primaryAssistName =
            primary.name;

          primary.assists =
            (
              Number(
                primary.assists
              ) || 0
            ) + 1;

          primary.points =
            (
              Number(
                primary.goals
              ) || 0
            ) +
            (
              Number(
                primary.assists
              ) || 0
            );

          const remainingAssistPool =
            assistPool.filter(
              teammate =>
                teammate.playerId !==
                primary.playerId
            );

          if (
            remainingAssistPool.length > 0 &&
            gameRandom.chance(0.78)
          ) {
            const secondary =
              remainingAssistPool[
                gameRandom.integer(
                  0,
                  remainingAssistPool.length - 1
                )
              ];

            play.secondaryAssistId =
              secondary.playerId;

            play.secondaryAssistName =
              secondary.name;

            secondary.assists =
              (
                Number(
                  secondary.assists
                ) || 0
              ) + 1;

            secondary.points =
              (
                Number(
                  secondary.goals
                ) || 0
              ) +
              (
                Number(
                  secondary.assists
                ) || 0
              );
          }
        }

        scoringPlays.push(
          play
        );

      }
    );

      /*
       * Keep this team’s scoring plays chronological.
       * The complete running scoreboard is calculated only
       * after home and away plays are merged together.
       */
      scoringPlays.sort(
        (firstPlay, secondPlay) =>
          firstPlay.elapsedSeconds -
          secondPlay.elapsedSeconds
      );

    /*
     * Assign a stable sequence number after the scoring
     * plays have been sorted chronologically.
     */
    scoringPlays.forEach(
      (play, index) => {
        play.goalNumber =
          index + 1;
      }
    );

    return {
      success: true,
      reason:
        'scoring-plays-created',
      scoringPlays,
    };
  }

  function buildGameTimeline(
    gameResult,
    homeScoringPlays = [],
    awayScoringPlays = []
  ) {
    const timeline = [
      ...homeScoringPlays,
      ...awayScoringPlays,
    ];

    timeline.sort(
      (firstPlay, secondPlay) => {

        if (
          firstPlay.elapsedSeconds !==
          secondPlay.elapsedSeconds
        ) {
          return (
            firstPlay.elapsedSeconds -
            secondPlay.elapsedSeconds
          );
        }

        return (
          firstPlay.goalNumber -
          secondPlay.goalNumber
        );

      }
    );

    timeline.forEach(
      (play, index) => {
        play.gameGoalNumber =
          index + 1;
      }
    );

    /*
     * Build the true running scoreboard only after the
     * home and away scoring plays have been merged.
     */
    let runningHomeScore = 0;
    let runningAwayScore = 0;

    timeline.forEach(play => {
      if (play.isHomeGoal) {
        runningHomeScore += 1;
      } else {
        runningAwayScore += 1;
      }

      play.homeScore =
        runningHomeScore;

      play.awayScore =
        runningAwayScore;
    });

    gameResult.scoringPlays =
      timeline;

    /*
     * Mark the game-winning goal.
     * The GWG is the goal that gives the winning team
     * a lead it never relinquishes.
     */
    let finalHomeScore = 0;
    let finalAwayScore = 0;

    timeline.forEach(play => {
      finalHomeScore = play.homeScore;
      finalAwayScore = play.awayScore;
    });

    const winningIsHome =
      finalHomeScore > finalAwayScore;

    for (let index = 0; index < timeline.length; index++) {

      const play = timeline[index];

      if (
        play.homeScore === play.awayScore
      ) {
        continue;
      }

      const homeLeading =
        play.homeScore >
        play.awayScore;

      if (
        homeLeading !== winningIsHome
      ) {
        continue;
      }

      let leadLost = false;

      for (
        let future = index + 1;
        future < timeline.length;
        future++
      ) {
        const futurePlay =
          timeline[future];

        if (
          winningIsHome &&
          futurePlay.homeScore <=
            futurePlay.awayScore
        ) {
          leadLost = true;
          break;
        }

        if (
          !winningIsHome &&
          futurePlay.awayScore <=
            futurePlay.homeScore
        ) {
          leadLost = true;
          break;
        }
      }

      if (!leadLost) {
        play.gameWinningGoal = true;
        break;
      }
    }

    return {
      success: true,

      reason:
        'game-timeline-created',

      scoringPlays:
        timeline,
    };
  }

  function createGameTimelineState(
    gameResult
  ) {
    return {
      currentPeriod: 1,

      currentClockSeconds:
        20 * 60,

      gameComplete: false,

      inOvertime: false,

      inShootout: false,

      homeScore:
        gameResult.home.score,

      awayScore:
        gameResult.away.score,

      scoringPlays:
        gameResult.scoringPlays,

      currentPlayIndex: 0,
    };
  }

  function resolveOvertimeGame(
    gameResult,
    gameRandom
  ) {
    if (
      !gameResult ||
      !gameRandom ||
      !gameResult.home ||
      !gameResult.away
    ) {
      return {
        success: false,

        reason:
          'invalid-overtime-inputs',
      };
    }

    const homeScore =
      Number(
        gameResult.home.score
      ) || 0;

    const awayScore =
      Number(
        gameResult.away.score
      ) || 0;

    /*
     * Overtime is only required when regulation ends tied.
     */
    if (homeScore !== awayScore) {
      return {
        success: true,

        resolved:
          false,

        reason:
          'overtime-not-required',
      };
    }

    const homeMatchup =
      gameResult.matchup?.home ||
      {};

    const awayMatchup =
      gameResult.matchup?.away ||
      {};

    /*
     * Build a small overtime advantage from team offense,
     * overall strength, goaltending and home ice.
     *
     * Both teams always retain a meaningful chance to win.
     */
    const homeWeight =
      Math.max(
        1,
        (
          Number(
            homeMatchup.overall
          ) || 50
        ) +
        (
          Number(
            homeMatchup.offense
          ) || 50
        ) * 0.35 +
        (
          Number(
            homeMatchup.goaltending
          ) || 50
        ) * 0.15 +
        2
      );

    const awayWeight =
      Math.max(
        1,
        (
          Number(
            awayMatchup.overall
          ) || 50
        ) +
        (
          Number(
            awayMatchup.offense
          ) || 50
        ) * 0.35 +
        (
          Number(
            awayMatchup.goaltending
          ) || 50
        ) * 0.15
      );

    const homeWins =
      gameRandom.range(
        0,
        homeWeight +
          awayWeight
      ) < homeWeight;

    const winningTeamResult =
      homeWins
        ? gameResult.home
        : gameResult.away;

    const losingTeamResult =
      homeWins
        ? gameResult.away
        : gameResult.home;

    const eligibleScorers =
      Array.isArray(
        winningTeamResult.skaters
      )
        ? winningTeamResult.skaters.filter(
            skater =>
              skater &&
              skater.dressed !== false
          )
        : [];

    if (!eligibleScorers.length) {
      return {
        success: false,

        reason:
          'overtime-scorer-not-found',
      };
    }

    /*
     * Better players and players already generating shots
     * receive more overtime scoring opportunities.
     */
    const scorerTickets = [];

    eligibleScorers.forEach(
      skater => {
        const overall =
          Number(
            skater.overall
          ) || 50;

        const shots =
          Number(
            skater.shots
          ) || 0;

        const ticketCount =
          Math.max(
            1,
            Math.round(
              (
                overall - 45
              ) / 8
            ) +
            shots
          );

        for (
          let ticketIndex = 0;
          ticketIndex < ticketCount;
          ticketIndex++
        ) {
          scorerTickets.push(
            skater
          );
        }
      }
    );

    const scorer =
      scorerTickets[
        gameRandom.integer(
          0,
          scorerTickets.length - 1
        )
      ];

    /*
     * The overtime winner is an actual shot and goal.
     * Increase both the player and team totals together so
     * validation remains exact.
     */
    scorer.shots =
      (
        Number(
          scorer.shots
        ) || 0
      ) + 1;

    scorer.goals =
      (
        Number(
          scorer.goals
        ) || 0
      ) + 1;

    scorer.points =
      (
        Number(
          scorer.goals
        ) || 0
      ) +
      (
        Number(
          scorer.assists
        ) || 0
      );

    scorer.gameWinningGoals =
      (
        Number(
          scorer.gameWinningGoals
        ) || 0
      ) + 1;

    winningTeamResult.shots =
      (
        Number(
          winningTeamResult.shots
        ) || 0
      ) + 1;

    winningTeamResult.score =
      (
        Number(
          winningTeamResult.score
        ) || 0
      ) + 1;

    winningTeamResult.overtimeScore =
      1;

    losingTeamResult.overtimeScore =
      0;

    const overtimePlay =
      createEmptyScoringPlay();

    /*
     * Version 1 uses five-minute sudden-death overtime.
     */
    const overtimeElapsedSeconds =
      gameRandom.integer(
        0,
        5 * 60 - 1
      );

    const overtimeSecondsRemaining =
      5 * 60 -
      overtimeElapsedSeconds -
      1;

    const overtimeMinutesRemaining =
      Math.floor(
        overtimeSecondsRemaining / 60
      );

    const overtimeClockSeconds =
      overtimeSecondsRemaining % 60;

    overtimePlay.period =
      4;

    overtimePlay.timeRemaining =
      `${String(
        overtimeMinutesRemaining
      ).padStart(
        2,
        '0'
      )}:${String(
        overtimeClockSeconds
      ).padStart(
        2,
        '0'
      )}`;

    overtimePlay.elapsedSeconds =
      3 *
        20 *
        60 +
      overtimeElapsedSeconds;

    overtimePlay.teamId =
      winningTeamResult.teamId;

    overtimePlay.isHomeGoal =
      homeWins;

    overtimePlay.scorerId =
      scorer.playerId;

    overtimePlay.scorerName =
      scorer.name;

    overtimePlay.overtimeGoal =
      true;

    overtimePlay.gameWinningGoal =
      true;

    const opposingGoalie =
      Array.isArray(
        losingTeamResult.goalies
      )
        ? losingTeamResult.goalies.find(
            goalie =>
              goalie.started
          ) ||
          losingTeamResult.goalies[0]
        : null;

    if (opposingGoalie) {
      overtimePlay.goalieId =
        opposingGoalie.playerId;

      overtimePlay.goalieName =
        opposingGoalie.name;
    }

    /*
     * Allow the overtime winner to receive up to two assists.
     */
    const assistPool =
      eligibleScorers.filter(
        teammate =>
          teammate.playerId !==
          scorer.playerId
      );

    if (
      assistPool.length > 0 &&
      gameRandom.chance(
        0.92
      )
    ) {
      const primaryAssist =
        assistPool[
          gameRandom.integer(
            0,
            assistPool.length - 1
          )
        ];

      primaryAssist.assists =
        (
          Number(
            primaryAssist.assists
          ) || 0
        ) + 1;

      primaryAssist.points =
        (
          Number(
            primaryAssist.goals
          ) || 0
        ) +
        (
          Number(
            primaryAssist.assists
          ) || 0
        );

      overtimePlay.primaryAssistId =
        primaryAssist.playerId;

      overtimePlay.primaryAssistName =
        primaryAssist.name;

      const secondaryAssistPool =
        assistPool.filter(
          teammate =>
            teammate.playerId !==
            primaryAssist.playerId
        );

      if (
        secondaryAssistPool.length > 0 &&
        gameRandom.chance(
          0.78
        )
      ) {
        const secondaryAssist =
          secondaryAssistPool[
            gameRandom.integer(
              0,
              secondaryAssistPool.length - 1
            )
          ];

        secondaryAssist.assists =
          (
            Number(
              secondaryAssist.assists
            ) || 0
          ) + 1;

        secondaryAssist.points =
          (
            Number(
              secondaryAssist.goals
            ) || 0
          ) +
          (
            Number(
              secondaryAssist.assists
            ) || 0
          );

        overtimePlay.secondaryAssistId =
          secondaryAssist.playerId;

        overtimePlay.secondaryAssistName =
          secondaryAssist.name;
      }
    }

    /*
     * Remove the former regulation GWG marker before rebuilding
     * the complete timeline. The overtime goal is now the only
     * valid game-winning goal.
     */
    gameResult.scoringPlays.forEach(
      play => {
        play.gameWinningGoal =
          false;
      }
    );

    const timelinePreparation =
      buildGameTimeline(
        gameResult,
        gameResult.scoringPlays,
        [
          overtimePlay,
        ]
      );

    if (!timelinePreparation.success) {
      return {
        success: false,

        reason:
          timelinePreparation.reason ||
          'overtime-timeline-not-created',
      };
    }

    gameResult.wentToOvertime =
      true;

    gameResult.wentToShootout =
      false;

    gameResult.winnerTeamId =
      winningTeamResult.teamId;

    gameResult.loserTeamId =
      losingTeamResult.teamId;

    gameResult.resultType =
      'overtime';

    gameResult.status =
      'overtime-complete';

    return {
      success: true,

      resolved:
        true,

      reason:
        'overtime-resolved',

      winnerTeamId:
        gameResult.winnerTeamId,

      loserTeamId:
        gameResult.loserTeamId,

      scorerId:
        scorer.playerId,

      scoringPlay:
        overtimePlay,

      timelinePreparation,
    };
  }

  function populateGameGoalieBoxScores(
    gameResult
  ) {
    if (
      !gameResult ||
      !gameResult.home ||
      !gameResult.away
    ) {
      return {
        success: false,
        reason:
          'invalid-game-result-for-goalies',
      };
    }

    const homeGoalies =
      Array.isArray(
        gameResult.home.goalies
      )
        ? gameResult.home.goalies
        : [];

    const awayGoalies =
      Array.isArray(
        gameResult.away.goalies
      )
        ? gameResult.away.goalies
        : [];

    const findStarter = goalies =>
      goalies.find(
        goalie =>
          goalie?.started === true
      ) ||
      goalies.find(
        goalie =>
          goalie?.goalieRole ===
          'Starter'
      ) ||
      goalies[0] ||
      null;

    const homeStarter =
      findStarter(
        homeGoalies
      );

    const awayStarter =
      findStarter(
        awayGoalies
      );

    if (
      !homeStarter ||
      !awayStarter
    ) {
      return {
        success: false,
        reason:
          'starting-goalie-not-found',

        homeStarterFound:
          Boolean(homeStarter),

        awayStarterFound:
          Boolean(awayStarter),
      };
    }

    const homeScore =
      Math.max(
        0,
        Number(
          gameResult.home.score
        ) || 0
      );

    const awayScore =
      Math.max(
        0,
        Number(
          gameResult.away.score
        ) || 0
      );

    const homeShots =
      Math.max(
        homeScore,
        Number(
          gameResult.home.shots
        ) || 0
      );

    const awayShots =
      Math.max(
        awayScore,
        Number(
          gameResult.away.shots
        ) || 0
      );

    if (
      homeScore === awayScore
    ) {
      return {
        success: false,
        reason:
          'goalie-box-score-requires-decisive-result',
      };
    }

    /*
     * Determine the actual game duration.
     *
     * Regulation games use 60 minutes. Overtime games use the
     * elapsed time of the final scoring play when available.
     */
    let gameMinutes =
      60;

    if (
      gameResult.wentToOvertime ===
      true
    ) {
      const scoringPlays =
        Array.isArray(
          gameResult.scoringPlays
        )
          ? gameResult.scoringPlays
          : [];

      const finalScoringPlay =
        scoringPlays.length > 0
          ? scoringPlays[
              scoringPlays.length - 1
            ]
          : null;

      const elapsedSeconds =
        Number(
          finalScoringPlay
            ?.elapsedSeconds
        );

      if (
        Number.isFinite(
          elapsedSeconds
        ) &&
        elapsedSeconds > 3600
      ) {
        gameMinutes =
          elapsedSeconds / 60;
      }
    }

    const homeWon =
      String(
        gameResult.winnerTeamId
      ) ===
      String(
        gameResult.home.teamId
      );

    const awayWon =
      String(
        gameResult.winnerTeamId
      ) ===
      String(
        gameResult.away.teamId
      );

    const populateStarter = ({
      goalie,
      teamWon,
      teamLostInOvertime,
      shotsAgainst,
      goalsAgainst,
    }) => {
      const safeShotsAgainst =
        Math.max(
          goalsAgainst,
          Number(
            shotsAgainst
          ) || 0
        );

      const saves =
        Math.max(
          0,
          safeShotsAgainst -
          goalsAgainst
        );

      const savePercentage =
        safeShotsAgainst > 0
          ? saves /
            safeShotsAgainst
          : 0;

      goalie.started =
        true;

      goalie.dressed =
        true;

      goalie.gamesPlayed =
        1;

      goalie.wins =
        teamWon
          ? 1
          : 0;

      goalie.losses =
        !teamWon &&
        !teamLostInOvertime
          ? 1
          : 0;

      goalie.overtimeLosses =
        teamLostInOvertime
          ? 1
          : 0;

      goalie.shotsAgainst =
        safeShotsAgainst;

      goalie.saves =
        saves;

      goalie.goalsAgainst =
        goalsAgainst;

      goalie.savePercentage =
        savePercentage;

      goalie.shutout =
        goalsAgainst === 0;

      goalie.minutesPlayed =
        gameMinutes;

      goalie.decision =
        teamWon
          ? 'W'
          : teamLostInOvertime
            ? 'OTL'
            : 'L';

      /*
       * Temporary 20–100 goalie rating used by the existing
       * post-game progression calculator.
       */
      let gameRating =
        55;

      gameRating +=
        (
          savePercentage -
          0.88
        ) * 180;

      gameRating -=
        goalsAgainst * 3;

      if (teamWon) {
        gameRating += 8;
      } else if (
        teamLostInOvertime
      ) {
        gameRating -= 1;
      } else {
        gameRating -= 5;
      }

      if (
        goalie.shutout
      ) {
        gameRating += 12;
      }

      gameRating +=
        Math.max(
          0,
          Math.min(
            20,
            safeShotsAgainst - 20
          )
        ) * 0.3;

      goalie.gameRating =
        Math.round(
          Math.max(
            20,
            Math.min(
              100,
              gameRating
            )
          )
        );

      return {
        playerId:
          goalie.playerId,

        shotsAgainst:
          goalie.shotsAgainst,

        saves:
          goalie.saves,

        goalsAgainst:
          goalie.goalsAgainst,

        savePercentage:
          goalie.savePercentage,

        decision:
          goalie.decision,

        shutout:
          goalie.shutout,

        minutesPlayed:
          goalie.minutesPlayed,

        gameRating:
          goalie.gameRating,
      };
    };

    /*
     * The home goalie faces the away team's shots and score.
     * The away goalie faces the home team's shots and score.
     */
    const homeGoalieResult =
      populateStarter({
        goalie:
          homeStarter,

        teamWon:
          homeWon,

        teamLostInOvertime:
          !homeWon &&
          gameResult.wentToOvertime ===
            true,

        shotsAgainst:
          awayShots,

        goalsAgainst:
          awayScore,
      });

    const awayGoalieResult =
      populateStarter({
        goalie:
          awayStarter,

        teamWon:
          awayWon,

        teamLostInOvertime:
          !awayWon &&
          gameResult.wentToOvertime ===
            true,

        shotsAgainst:
          homeShots,

        goalsAgainst:
          homeScore,
      });

    /*
     * Backups remain dressed but receive no game statistics
     * until goalie substitutions are added later.
     */
    [
      ...homeGoalies,
      ...awayGoalies,
    ].forEach(goalie => {
      if (
        goalie === homeStarter ||
        goalie === awayStarter
      ) {
        return;
      }

      goalie.started =
        false;

      goalie.gamesPlayed =
        0;

      goalie.wins =
        0;

      goalie.losses =
        0;

      goalie.overtimeLosses =
        0;

      goalie.shotsAgainst =
        0;

      goalie.saves =
        0;

      goalie.goalsAgainst =
        0;

      goalie.savePercentage =
        null;

      goalie.shutout =
        false;

      goalie.minutesPlayed =
        0;

      goalie.decision =
        null;

      goalie.gameRating =
        null;
    });

    return {
      success: true,

      reason:
        'goalie-box-scores-populated',

      gameMinutes,

      home:
        homeGoalieResult,

      away:
        awayGoalieResult,
    };
  }

  function populateGameSkaterSecondaryStats(
    gameResult,
    gameRandom
  ) {
    if (
      !gameResult ||
      !gameRandom ||
      !gameResult.home ||
      !gameResult.away
    ) {
      return {
        success: false,
        reason:
          'invalid-skater-secondary-stat-inputs',
      };
    }

    const homeSkaters =
      Array.isArray(
        gameResult.home.skaters
      )
        ? gameResult.home.skaters
        : [];

    const awaySkaters =
      Array.isArray(
        gameResult.away.skaters
      )
        ? gameResult.away.skaters
        : [];

    const scoringPlays =
      Array.isArray(
        gameResult.scoringPlays
      )
        ? gameResult.scoringPlays
        : [];

    if (
      homeSkaters.length === 0 ||
      awaySkaters.length === 0
    ) {
      return {
        success: false,
        reason:
          'skater-box-scores-not-found',
      };
    }

    /*
     * Reset the generated values before building them.
     * This keeps retries deterministic and prevents accidental
     * duplication if the preparation step runs more than once.
     */
    [
      ...homeSkaters,
      ...awaySkaters,
    ].forEach(skater => {
      skater.plusMinus = 0;
      skater.penaltyMinutes = 0;
    });

    const shufflePlayers = players => {
      const shuffled = [
        ...players,
      ];

      for (
        let index =
          shuffled.length - 1;
        index > 0;
        index--
      ) {
        const replacementIndex =
          gameRandom.integer(
            0,
            index
          );

        [
          shuffled[index],
          shuffled[replacementIndex],
        ] = [
          shuffled[replacementIndex],
          shuffled[index],
        ];
      }

      return shuffled;
    };

    const getPlayerById = (
      skaters,
      playerId
    ) =>
      skaters.find(
        skater =>
          String(
            skater.playerId
          ) ===
          String(
            playerId
          )
      ) ||
      null;

    const selectOnIceSkaters = (
      skaters,
      requiredPlayerIds = []
    ) => {
      const selected = [];

      requiredPlayerIds
        .filter(Boolean)
        .forEach(playerId => {
          const player =
            getPlayerById(
              skaters,
              playerId
            );

          if (
            player &&
            !selected.includes(player)
          ) {
            selected.push(player);
          }
        });

      const remainingPlayers =
        shufflePlayers(
          skaters.filter(
            skater =>
              skater.dressed !== false &&
              !selected.includes(
                skater
              )
          )
        );

      while (
        selected.length < 5 &&
        remainingPlayers.length > 0
      ) {
        selected.push(
          remainingPlayers.shift()
        );
      }

      return selected;
    };

    /*
     * Plus/minus is awarded only on even-strength and
     * shorthanded goals. Power-play goals do not count.
     */
    scoringPlays.forEach(play => {
      const strength =
        String(
          play.strength || 'EV'
        ).toUpperCase();

      if (
        strength === 'PP' ||
        strength ===
          'POWER PLAY'
      ) {
        return;
      }

      const scoringTeamIsHome =
        String(
          play.teamId
        ) ===
        String(
          gameResult.home.teamId
        );

      const scoringSkaters =
        scoringTeamIsHome
          ? homeSkaters
          : awaySkaters;

      const defendingSkaters =
        scoringTeamIsHome
          ? awaySkaters
          : homeSkaters;

      const scoringPlayersOnIce =
        selectOnIceSkaters(
          scoringSkaters,
          [
            play.scorerId,
            play.primaryAssistId,
            play.secondaryAssistId,
          ]
        );

      const defendingPlayersOnIce =
        selectOnIceSkaters(
          defendingSkaters
        );

      scoringPlayersOnIce.forEach(
        skater => {
          skater.plusMinus =
            (
              Number(
                skater.plusMinus
              ) || 0
            ) + 1;
        }
      );

      defendingPlayersOnIce.forEach(
        skater => {
          skater.plusMinus =
            (
              Number(
                skater.plusMinus
              ) || 0
            ) - 1;
        }
      );
    });

    const createTeamPenalties = (
      teamResult,
      opponentResult
    ) => {
      const eligibleSkaters =
        Array.isArray(
          teamResult.skaters
        )
          ? teamResult.skaters.filter(
              skater =>
                skater &&
                skater.dressed !== false
            )
          : [];

      if (
        eligibleSkaters.length === 0
      ) {
        return [];
      }

      /*
       * Version 1 generates a realistic modest number of
       * two-minute minor penalties. Major and misconduct
       * penalties can be added with the full penalty engine.
       */
      let minorPenaltyCount =
        gameRandom.integer(
          1,
          4
        );

      if (
        gameRandom.chance(
          0.18
        )
      ) {
        minorPenaltyCount += 1;
      }

      const generatedPenalties = [];

      for (
        let penaltyIndex = 0;
        penaltyIndex <
          minorPenaltyCount;
        penaltyIndex++
      ) {
        const penaltyTickets = [];

        eligibleSkaters.forEach(
          skater => {
            const canonicalPlayer =
              getPlayerById(
                eligibleSkaters,
                skater.playerId
              );

            const discipline =
              Number(
                canonicalPlayer
                  ?.attributes
                  ?.discipline
              ) || 50;

            const bodyChecking =
              Number(
                canonicalPlayer
                  ?.attributes
                  ?.bodyChecking
              ) || 50;

            const ticketCount =
              Math.max(
                1,
                Math.round(
                  (
                    110 -
                    discipline +
                    bodyChecking * 0.25
                  ) / 15
                )
              );

            for (
              let ticketIndex = 0;
              ticketIndex <
                ticketCount;
              ticketIndex++
            ) {
              penaltyTickets.push(
                skater
              );
            }
          }
        );

        const penalizedSkater =
          penaltyTickets[
            gameRandom.integer(
              0,
              penaltyTickets.length - 1
            )
          ];

        penalizedSkater.penaltyMinutes =
          (
            Number(
              penalizedSkater
                .penaltyMinutes
            ) || 0
          ) + 2;

        const elapsedSeconds =
          gameRandom.integer(
            0,
            60 * 60 - 1
          );

        const period =
          Math.min(
            3,
            Math.floor(
              elapsedSeconds /
              (20 * 60)
            ) + 1
          );

        const secondsIntoPeriod =
          elapsedSeconds -
          (
            period - 1
          ) *
          20 *
          60;

        const secondsRemaining =
          20 *
            60 -
          secondsIntoPeriod -
          1;

        const penalty = {
          penaltyNumber:
            generatedPenalties.length +
            1,

          teamId:
            teamResult.teamId,

          opponentTeamId:
            opponentResult.teamId,

          playerId:
            penalizedSkater.playerId,

          playerName:
            penalizedSkater.name,

          period,

          timeRemaining:
            `${String(
              Math.floor(
                secondsRemaining /
                60
              )
            ).padStart(
              2,
              '0'
            )}:${String(
              secondsRemaining %
                60
            ).padStart(
              2,
              '0'
            )}`,

          elapsedSeconds,

          minutes:
            2,

          type:
            'minor',

          infraction:
            gameRandom.chance(
              0.5
            )
              ? 'Tripping'
              : gameRandom.chance(
                    0.5
                  )
                ? 'Hooking'
                : 'Interference',
        };

        generatedPenalties.push(
          penalty
        );
      }

      return generatedPenalties;
    };

    const homePenalties =
      createTeamPenalties(
        gameResult.home,
        gameResult.away
      );

    const awayPenalties =
      createTeamPenalties(
        gameResult.away,
        gameResult.home
      );

    gameResult.penalties = [
      ...homePenalties,
      ...awayPenalties,
    ].sort(
      (
        firstPenalty,
        secondPenalty
      ) =>
        (
          Number(
            firstPenalty
              .elapsedSeconds
          ) || 0
        ) -
        (
          Number(
            secondPenalty
              .elapsedSeconds
          ) || 0
        )
    );

    gameResult.penalties.forEach(
      (
        penalty,
        index
      ) => {
        penalty.penaltyNumber =
          index + 1;
      }
    );

    return {
      success: true,

      reason:
        'skater-secondary-stats-populated',

      homePenaltyMinutes:
        homeSkaters.reduce(
          (
            total,
            skater
          ) =>
            total +
            (
              Number(
                skater
                  .penaltyMinutes
              ) || 0
            ),
          0
        ),

      awayPenaltyMinutes:
        awaySkaters.reduce(
          (
            total,
            skater
          ) =>
            total +
            (
              Number(
                skater
                  .penaltyMinutes
              ) || 0
            ),
          0
        ),

      penaltyCount:
        gameResult.penalties.length,
    };
  }

  function validateGameResult(
    gameResult
  ) {
    const homeGoals =
      gameResult.home.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.goals) || 0),
        0
      );

    const awayGoals =
      gameResult.away.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.goals) || 0),
        0
      );

    const homeShots =
      gameResult.home.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.shots) || 0),
        0
      );

    const awayShots =
      gameResult.away.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.shots) || 0),
        0
      );

    const timelineGoals =
      Array.isArray(
        gameResult.scoringPlays
      )
        ? gameResult.scoringPlays.length
        : 0;

    const expectedGoals =
      gameResult.home.score +
      gameResult.away.score;

    return {
      success:
        homeGoals === gameResult.home.score &&
        awayGoals === gameResult.away.score &&
        homeShots === gameResult.home.shots &&
        awayShots === gameResult.away.shots &&
        timelineGoals === expectedGoals,

      checks: {
        homeGoalsMatch:
          homeGoals ===
          gameResult.home.score,

        awayGoalsMatch:
          awayGoals ===
          gameResult.away.score,

        homeShotsMatch:
          homeShots ===
          gameResult.home.shots,

        awayShotsMatch:
          awayShots ===
          gameResult.away.shots,

        timelineMatches:
          timelineGoals ===
          expectedGoals,
      },

      totals: {
        homeGoals,
        awayGoals,
        homeShots,
        awayShots,
        timelineGoals,
        expectedGoals,
      },
    };
  }

  function resolveGameEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    /*
     * getScheduledEventsForDate() passes a normalized event
     * wrapper containing rawEvent. Use the canonical schedule
     * record when available so all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
      canonicalGameEvent?.gameId ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.id ||
      null;

    const approvedCareerGameAlias =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForLiveEngine =
      Boolean(
        isCareerPlayerGame &&
        approvedCareerGameAlias &&
        [
          canonicalGameEvent?.gameId,
          canonicalGameEvent?.eventId,
          canonicalGameEvent?.id,
          event?.gameId,
          event?.eventId,
          event?.id,
        ].some(alias =>
          alias !== null &&
          alias !== undefined &&
          String(alias) ===
            String(approvedCareerGameAlias)
        )
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        approvedCareerGameId &&
        [
          canonicalGameEvent?.id,
          canonicalGameEvent?.eventId,
          canonicalGameEvent?.gameId,
          event?.id,
          event?.eventId,
          event?.gameId,
        ].some(alias =>
          alias !== null &&
          alias !== undefined &&
          String(alias) ===
            String(approvedCareerGameId)
        )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup screen where
     * the user chooses Play Game or Sim Game.
     */


      if (
        isCareerPlayerGame &&
        !careerGameApprovedForSim
      ) {
      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        canonicalGameEvent?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.success =
        true;

      result.resolved =
        false;

      result.stopSimulation =
        true;

      result.reason =
        'career-game-awaiting-user-choice';

      result.gameResult =
        null;

      return result;
    }

    /*
     * Sim approval is single-use.
     *
     * Clear it before resolution so it cannot leak into another
     * scheduled career game.
     */
    if (
      careerGameApprovedForSim
    ) {
      _state.season
        .careerGameSimApproval =
          null;
    }

    const gameResult =
      createEmptyGameResult(
        canonicalGameEvent
      );

    const rosterPreparation =
      populateGameResultRosters(
        gameResult
      );

    if (!rosterPreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        rosterPreparation.reason ||
        'game-rosters-not-populated';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      return result;
    }

    const homeStrength =
      createTeamGameStrengthProfile(
        rosterPreparation.homeRoster
      );

    const awayStrength =
      createTeamGameStrengthProfile(
        rosterPreparation.awayRoster
      );

    if (
      !homeStrength.success ||
      !awayStrength.success
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        !homeStrength.success
          ? homeStrength.reason
          : awayStrength.reason;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: false,

        homeStrength,

        awayStrength,
      };

      return result;
    }

    /*
     * Store the simulator inputs directly on the canonical
     * game record. These are internal pregame ratings and
     * do not alter public team or player overalls.
     */
    gameResult.matchup = {
      home: {
        ...homeStrength,
      },

      away: {
        ...awayStrength,
      },

      homeIceAdvantage:
        2,

      overallDifference:
        homeStrength.overall -
        awayStrength.overall,

      offenseDifference:
        homeStrength.offense -
        awayStrength.defense,

      defenseDifference:
        homeStrength.defense -
        awayStrength.offense,

      goalieDifference:
        homeStrength.goaltending -
        awayStrength.goaltending,
    };

    const gameRandom =
      createGameRandomContext(
        gameResult
      );

    const shotPreparation =
      createGameShotTotals(
        gameResult,
        gameRandom
      );

    if (!shotPreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        shotPreparation.reason ||
        'game-shot-totals-not-created';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: true,

        homeStrength,

        awayStrength,
      };

      result.shotPreparation =
        shotPreparation;

      return result;
    }

    /*
     * These are now canonical team shot totals for this game.
     * No player shots or goalie statistics are assigned yet.
     */
    gameResult.home.shots =
      shotPreparation.homeShots;

    gameResult.away.shots =
      shotPreparation.awayShots;

    gameResult.metadata.randomSeed =
      gameRandom.seed;

    /*
     * Assign every canonical team shot to a dressed skater
     * before determining which shots become goals.
     */
    const homeShotDistribution =
      distributeTeamShots(
        gameResult.home,
        gameResult.matchup.home,
        gameRandom
      );

    const awayShotDistribution =
      distributeTeamShots(
        gameResult.away,
        gameResult.matchup.away,
        gameRandom
      );

    if (
      !homeShotDistribution.success ||
      !awayShotDistribution.success
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        !homeShotDistribution.success
          ? homeShotDistribution.reason
          : awayShotDistribution.reason;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: true,

        homeStrength,

        awayStrength,
      };

      result.shotPreparation =
        shotPreparation;

      result.playerShotPreparation = {
        success: false,

        home:
          homeShotDistribution,

        away:
          awayShotDistribution,
      };

      return result;
    }

    const goalPreparation =
      createGameGoalTotals(
        gameResult,
        gameRandom
      );

    if (!goalPreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        goalPreparation.reason ||
        'game-goal-totals-not-created';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: true,

        homeStrength,

        awayStrength,
      };

      result.shotPreparation =
        shotPreparation;

      result.goalPreparation =
        goalPreparation;

      return result;
    }

    /*
     * These scores represent regulation only.
     * A tied score remains tied until the overtime resolver
     * is added in the next simulation step.
     */
    gameResult.home.score =
      goalPreparation.homeGoals;

    gameResult.away.score =
      goalPreparation.awayGoals;

    gameResult.status =
      goalPreparation
        .tiedAfterRegulation
          ? 'regulation-tied'
          : 'regulation-complete';

    /*
     * Assign every regulation goal to an actual recorded
     * player shot before creating assists or scoring plays.
     */
    const homeGoalDistribution =
      distributeTeamGoals(
        gameResult.home,
        gameRandom
      );

    const awayGoalDistribution =
      distributeTeamGoals(
        gameResult.away,
        gameRandom
      );

    if (
      !homeGoalDistribution.success ||
      !awayGoalDistribution.success
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        !homeGoalDistribution.success
          ? homeGoalDistribution.reason
          : awayGoalDistribution.reason;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: true,

        homeStrength,

        awayStrength,
      };

      result.shotPreparation =
        shotPreparation;

      result.playerShotPreparation = {
        success: true,

        home:
          homeShotDistribution,

        away:
          awayShotDistribution,
      };

      result.goalPreparation =
        goalPreparation;

      result.playerGoalPreparation = {
        success: false,

        home:
          homeGoalDistribution,

        away:
          awayGoalDistribution,
      };

      return result;
    }

    const homeScoringPreparation =
      buildScoringPlays(
        gameResult.home,
        gameResult.away.goalies,
        gameRandom,
        true
      );

    const awayScoringPreparation =
      buildScoringPlays(
        gameResult.away,
        gameResult.home.goalies,
        gameRandom,
        false
      );

    if (
      !homeScoringPreparation.success ||
      !awayScoringPreparation.success
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        !homeScoringPreparation.success
          ? homeScoringPreparation.reason
          : awayScoringPreparation.reason;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.scoringPlayPreparation = {
        success: false,

        home:
          homeScoringPreparation,

        away:
          awayScoringPreparation,
      };

      return result;
    }

    const timelinePreparation =
      buildGameTimeline(
        gameResult,
        homeScoringPreparation
          .scoringPlays,
        awayScoringPreparation
          .scoringPlays
      );

    if (!timelinePreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        timelinePreparation.reason ||
        'game-timeline-not-created';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.scoringPlayPreparation = {
        success: true,

        home:
          homeScoringPreparation,

        away:
          awayScoringPreparation,
      };

      result.timelinePreparation =
        timelinePreparation;

      return result;
    }

    let overtimePreparation = {
      success: true,
      resolved: false,
      reason: 'overtime-not-required',
    };

    /*
     * Regulation ties must now be resolved before the final
     * game-result validation runs.
     */
    if (
      gameResult.status ===
      'regulation-tied'
    ) {
      overtimePreparation =
        resolveOvertimeGame(
          gameResult,
          gameRandom
        );

      if (!overtimePreparation.success) {
        result.success = false;
        result.resolved = false;

        result.type =
          EVENT_TYPES.GAME;

        result.stopSimulation = true;

        result.reason =
          overtimePreparation.reason ||
          'overtime-resolution-failed';

        result.eventId =
          canonicalGameEvent?.id ||
          canonicalGameEvent?.eventId ||
          event?.id ||
          event?.eventId ||
          null;

        result.date =
          canonicalGameEvent?.date ||
          event?.date ||
          options?.date ||
          null;

        result.event =
          canonicalGameEvent;

        result.gameResult =
          gameResult;

        result.overtimePreparation =
          overtimePreparation;

        return result;
      }
    }

    /*
     * Regulation games also need a complete outcome contract.
     * Overtime games already receive these fields inside the
     * overtime resolver.
     */
    if (
      gameResult.status ===
      'regulation-complete'
    ) {
      const homeWon =
        gameResult.home.score >
        gameResult.away.score;

      const winningTeamResult =
        homeWon
          ? gameResult.home
          : gameResult.away;

      const losingTeamResult =
        homeWon
          ? gameResult.away
          : gameResult.home;

      gameResult.winnerTeamId =
        winningTeamResult.teamId;

      gameResult.loserTeamId =
        losingTeamResult.teamId;

      gameResult.resultType =
        'regulation';

      gameResult.wentToOvertime =
        false;

      gameResult.wentToShootout =
        false;

      /*
       * The timeline builder already identified the regulation
       * game-winning goal. Mark the result itself as complete.
       */
      gameResult.status =
        'regulation-complete';
    }

    /*
     * Populate the starter goalie box scores once a decisive
     * game result exists. This supplies the permanent goalie
     * application layer with real statistics instead of the
     * placeholder zero values created during initialization.
     */
    const goalieBoxScorePreparation =
      populateGameGoalieBoxScores(
        gameResult
      );

    if (
      goalieBoxScorePreparation.success !==
      true
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        goalieBoxScorePreparation.reason ||
        'goalie-box-score-preparation-failed';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.goalieBoxScorePreparation =
        goalieBoxScorePreparation;

      return result;
    }

    /*
     * Populate plus/minus and penalty minutes after the final
     * score and scoring timeline exist, but before validation
     * and permanent season-stat application.
     */
    const skaterSecondaryStatPreparation =
      populateGameSkaterSecondaryStats(
        gameResult,
        gameRandom
      );

    if (
      skaterSecondaryStatPreparation
        .success !== true
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        skaterSecondaryStatPreparation
          .reason ||
        'skater-secondary-stat-preparation-failed';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.goalieBoxScorePreparation =
        goalieBoxScorePreparation;

      result.skaterSecondaryStatPreparation =
        skaterSecondaryStatPreparation;

      return result;
    }

    const validation =
      validateGameResult(
        gameResult
      );

    if (!validation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        'game-result-validation-failed';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.goalieBoxScorePreparation =
        goalieBoxScorePreparation;

         result.skaterSecondaryStatPreparation =
        skaterSecondaryStatPreparation;

      result.validation =
        validation;

      return result;
    }

    /*
     * Regulation and overtime now both produce a validated,
     * decisive game result.
     *
     * Permanent standings, roster-stat and schedule updates
     * will be applied by the game-result application step
     * that follows this resolver.
     */
    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.GAME;

    result.stopSimulation = false;

    result.reason =
      gameResult.resultType ===
      'overtime'
        ? 'overtime-game-resolved'
        : 'regulation-game-resolved';

    result.eventId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      canonicalGameEvent?.date ||
      event?.date ||
      options?.date ||
      null;

    result.event =
      canonicalGameEvent;

    result.gameResult =
      gameResult;

    result.overtimePreparation =
      overtimePreparation;

    result.rosterPreparation = {
      success: true,

      homeTeamId:
        rosterPreparation
          .homeRoster
          ?.teamId ||
        null,

      awayTeamId:
        rosterPreparation
          .awayRoster
          ?.teamId ||
        null,

      homeSkaterCount:
        gameResult.home
          .skaters.length,

      awaySkaterCount:
        gameResult.away
          .skaters.length,

      homeGoalieCount:
        gameResult.home
          .goalies.length,

      awayGoalieCount:
        gameResult.away
          .goalies.length,

      homeStartingGoalieId:
        rosterPreparation
          .homeRoster
          ?.startingGoalie
          ?.id ||
        null,

      awayStartingGoalieId:
        rosterPreparation
          .awayRoster
          ?.startingGoalie
          ?.id ||
        null,
    };

    result.matchupPreparation = {
      success: true,

      home: {
        overall:
          homeStrength.overall,

        offense:
          homeStrength.offense,

        defense:
          homeStrength.defense,

        powerPlay:
          homeStrength.powerPlay,

        penaltyKill:
          homeStrength.penaltyKill,

        goaltending:
          homeStrength.goaltending,
      },

      away: {
        overall:
          awayStrength.overall,

        offense:
          awayStrength.offense,

        defense:
          awayStrength.defense,

        powerPlay:
          awayStrength.powerPlay,

        penaltyKill:
          awayStrength.penaltyKill,

        goaltending:
          awayStrength.goaltending,
      },
    };

    result.shotPreparation = {
      success: true,

      randomSeed:
        gameRandom.seed,

      homeShots:
        shotPreparation.homeShots,

      awayShots:
        shotPreparation.awayShots,

      expected: {
        ...shotPreparation.expected,
      },

      factors: {
        ...shotPreparation.factors,
      },
    };

    result.playerShotPreparation = {
      success: true,

      homeAssignedShots:
        gameResult.home.skaters.reduce(
          (total, skater) =>
            total +
            (
              Number(
                skater.shots
              ) || 0
            ),
          0
        ),

      awayAssignedShots:
        gameResult.away.skaters.reduce(
          (total, skater) =>
            total +
            (
              Number(
                skater.shots
              ) || 0
            ),
          0
        ),

      homeSkatersWithShots:
        gameResult.home.skaters.filter(
          skater =>
            Number(skater.shots) > 0
        ).length,

      awaySkatersWithShots:
        gameResult.away.skaters.filter(
          skater =>
            Number(skater.shots) > 0
        ).length,
    };

    result.goalPreparation = {
      success: true,

      homeGoals:
        goalPreparation.homeGoals,

      awayGoals:
        goalPreparation.awayGoals,

      tiedAfterRegulation:
        goalPreparation
          .tiedAfterRegulation,

      shootingPercentage: {
        ...goalPreparation
          .shootingPercentage,
      },

      expectedGoals: {
        ...goalPreparation
          .expectedGoals,
      },

      factors: {
        ...goalPreparation.factors,
      },
    };

    result.playerGoalPreparation = {
      success: true,

      homeAssignedGoals:
        homeGoalDistribution
          .assignedGoals,

      awayAssignedGoals:
        awayGoalDistribution
          .assignedGoals,

      homeScorers:
        homeGoalDistribution
          .scorers
          .map(scorer => ({
            ...scorer,
          })),

      awayScorers:
        awayGoalDistribution
          .scorers
          .map(scorer => ({
            ...scorer,
          })),

      homePlayersWithGoals:
        gameResult.home.skaters
          .filter(
            skater =>
              Number(
                skater.goals
              ) > 0
          )
          .length,

      awayPlayersWithGoals:
        gameResult.away.skaters
          .filter(
            skater =>
              Number(
                skater.goals
              ) > 0
          )
          .length,
    };

    result.scoringPlayPreparation = {
      success: true,

      homeScoringPlays:
        homeScoringPreparation
          .scoringPlays.length,

      awayScoringPlays:
        awayScoringPreparation
          .scoringPlays.length,

      totalScoringPlays:
        gameResult.scoringPlays
          .length,

      gameWinningGoal: {
        ...(
          gameResult.scoringPlays
            .find(
              play =>
                play.gameWinningGoal
            ) ||
          {}
        ),
      },
    };

    result.timelinePreparation = {
      success: true,

      scoringPlayCount:
        timelinePreparation
          .scoringPlays.length,

      finalHomeScore:
        gameResult.home.score,

      finalAwayScore:
        gameResult.away.score,
    };

    result.validation = {
      success: true,

      checks: {
        ...validation.checks,
      },

      totals: {
        ...validation.totals,
      },
    };

    return result;
  }

  function resolvePracticeEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = false;

    result.type =
      EVENT_TYPES.PRACTICE;

    /*
     * Practices are short player-controlled career events.
     * Calendar advancement pauses so the existing Event screen
     * can present the focus before the player completes it.
     */
    result.stopSimulation = true;

    result.reason =
      'practice-completion-required';

    result.eventId =
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      event?.date ||
      options?.date ||
      null;

    result.event = event;

    return result;
  }

  function createPracticeXPReward(
    event,
    player
  ) {
    const focus =
      String(
        event?.focus ||
        'skills'
      );

    const isGoalie =
      normalizeAttributePosition(
        player?.position
      ) === 'G';

    if (isGoalie) {
      const goalieRewards = {
        skating: {
          lateralMovement: 6,
          agility: 5,
          recoverySpeed: 5,
        },

        shooting: {
          reflexes: 6,
          gloveHigh: 4,
          blockerHigh: 4,
          puckTracking: 2,
        },

        skills: {
          puckHandling: 5,
          goaliePassing: 5,
          stickControl: 4,
        },

        systems: {
          positioning: 6,
          angles: 5,
          anticipation: 5,
        },

        scrimmage: {
          reflexes: 4,
          positioning: 4,
          puckTracking: 4,
          reboundControl: 4,
        },
      };

      const attributes =
        goalieRewards[focus] ||
        goalieRewards.skills;

      const total =
        Object.values(
          attributes
        ).reduce(
          (sum, value) =>
            sum + value,
          0
        );

      return {
        total,
        goalie: total,
        attributes,
      };
    }

    const skaterRewards = {
      skating: {
        category: 'skating',

        attributes: {
          speed: 6,
          acceleration: 6,
          agility: 4,
        },
      },

      shooting: {
        category: 'shooting',

        attributes: {
          wristShotAccuracy: 7,
          wristShotPower: 5,
          slapShotAccuracy: 4,
        },
      },

      skills: {
        category: 'passing',

        attributes: {
          passing: 6,
          puckControl: 6,
          deking: 4,
        },
      },

      systems: {
        category: 'hockeyIQ',

        attributes: {
          offensiveAwareness: 5,
          defensiveAwareness: 5,
          discipline: 4,
        },
      },

      scrimmage: {
        category: 'general',

        attributes: {
          passing: 4,
          puckControl: 4,
          offensiveAwareness: 4,
          endurance: 3,
        },
      },
    };

    const reward =
      skaterRewards[focus] ||
      skaterRewards.skills;

    const total =
      Object.values(
        reward.attributes
      ).reduce(
        (sum, value) =>
          sum + value,
        0
      );

    return {
      total,

      [reward.category]:
        total,

      attributes:
        reward.attributes,
    };
  }

  function pickStableCareerMessage(
    messages,
    ...seedParts
  ) {
    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return '';
    }

    const seed =
      seedParts
        .filter(Boolean)
        .join('|');

    let hash = 0;

    for (
      let i = 0;
      i < seed.length;
      i++
    ) {
      hash =
        ((hash << 5) - hash) +
        seed.charCodeAt(i);

      hash |= 0;
    }

    return messages[
      Math.abs(hash) %
        messages.length
    ];
  }

  function createPracticeCoachFeedback(
    event,
    player,
    result
  ) {
    const focus =
      String(
        event?.focus ||
        'skills'
      );

    const context = {
      coachTrust:
        Number(
          player?.coachTrust || 0
        ),

      reputation:
        Number(
          player?.reputationPoints || 0
        ),

      overall:
        Number(
          player?.overall || 0
        ),
    };

    const feedbackByFocus = {
      skating: [
        "Excellent edge work today.",
        "Your acceleration looked noticeably sharper.",
        "Coach Reynolds liked your skating pace.",
        "Keep driving through your crossovers.",
        "You're becoming more explosive every week.",
      ],

      shooting: [
        "Your release looked much quicker today.",
        "Coach Reynolds wants you shooting more often.",
        "You're starting to find the corners consistently.",
        "Good power through your shots today.",
        "Your finishing continues to improve.",
      ],

      skills: [
        "Excellent puck control today.",
        "Your passing looked crisp throughout practice.",
        "Coach Reynolds noticed your playmaking.",
        "You protected the puck extremely well.",
        "Keep making smart decisions with possession.",
      ],

      systems: [
        "You picked up today's systems quickly.",
        "Coach Reynolds trusts your hockey IQ.",
        "Strong positioning all practice.",
        "You were consistently in the right spots.",
        "Keep communicating with your teammates.",
      ],

      scrimmage: [
        "You competed hard every shift.",
        "Coach Reynolds loved your intensity.",
        "Great pace during today's scrimmage.",
        "You looked comfortable in game situations.",
        "Keep bringing that compete level.",
      ],
    };

    const choices =
      feedbackByFocus[focus] ||
      feedbackByFocus.skills;

    return pickStableCareerMessage(
      choices,
      event?.id,
      event?.date,
      event?.focus,
      player?.id
    );
  }

  function completePracticeEvent(
    eventId,
    options = {}
  ) {
    const event =
      _state.schedule.find(
        scheduleEvent =>
          String(scheduleEvent.id) ===
          String(eventId)
      );

    if (!event) {
      return {
        success: false,
        reason: 'practice-not-found',
      };
    }

    if (event.completed) {
      return {
        success: false,
        reason: 'practice-already-completed',
      };
    }

    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.PRACTICE;

    result.eventId =
      event.id;

    result.date =
      event.date;

    result.event =
      event;

    result.reason =
      'practice-completed';

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    result.xp =
      createPracticeXPReward(
        event,
        careerPlayer
      );

    result.coachNote =
      createPracticeCoachFeedback(
        event,
        careerPlayer,
        result
      );

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'practice-result-not-applied',
      };
    }

    /*
     * Only mark the canonical schedule event complete
     * after its reward has been applied successfully.
     */
    event.completed = true;

    event.completedAt =
      event.date;

    event.result = {
      type:
        result.type,

      reason:
        result.reason,

      xp: {
        ...(result.xp || {}),

        attributes: {
          ...(
            result.xp
              ?.attributes ||
            {}
          ),
        },
      },
    };

    /*
     * Finalize the date that was previously blocked by this
     * player-controlled Practice.
     */
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    if (
      !_state.season.processedDates
        .includes(event.date)
    ) {
      _state.season.processedDates.push(
        event.date
      );

      _state.season.processedDates.sort(
        (firstDate, secondDate) =>
          String(firstDate).localeCompare(
            String(secondDate)
          )
      );
    }

    if (
      !Array.isArray(
        _state.season.completedEventIds
      )
    ) {
      _state.season.completedEventIds = [];
    }

    if (
      !_state.season.completedEventIds
        .some(
          completedEventId =>
            String(completedEventId) ===
            String(event.id)
        )
    ) {
      _state.season.completedEventIds.push(
        event.id
      );
    }

    _state.season.lastProcessedDate =
      event.date;

    /*
     * The blocked Practice date is now fully completed,
     * so advance every canonical date field to that date
     * before saving.
     */
    setCurrentDate(
      event.date,
      {
        save: false,
      }
    );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      completed: true,

      eventId:
        event.id,

      date:
        event.date,

      focus:
        event.focus ||
        'skills',

      result,

      applied,
    };

    
  }

    function completeTrainingEvent(
      eventId,
      trainingKey,
      options = {}
    ) {
    const canonicalEvent =
      (_state.schedule || [])
        .find(event =>
          String(
            event?.id ||
            event?.eventId ||
            ''
          ) ===
          String(eventId || '')
        );

    if (!canonicalEvent) {
      return {
        success: false,
        reason:
          'training-event-not-found',
      };
    }

    if (
      canonicalEvent.type !==
      EVENT_TYPES.TRAINING
    ) {
      return {
        success: false,
        reason:
          'event-is-not-training',
      };
    }

    if (
      canonicalEvent.completed === true
    ) {
      return {
        success: false,
        reason:
          'training-already-completed',
      };
    }

      const careerPlayer =
        getPlayerById(
          _state.player?.playerId ||
          _state.player?.id ||
          'career-player'
        );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    const rawPosition =
      String(
        careerPlayer.position || ''
      )
        .trim()
        .toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes(
        'GOAL'
      );

    const trainingPool =
      isGoalie
        ? HIGH_SCHOOL_TRAINING_TYPES
            .goalie
        : HIGH_SCHOOL_TRAINING_TYPES
            .skater;

    const selectedTraining =
      trainingPool.find(training =>
        String(
          training.trainingKey || ''
        ) ===
        String(trainingKey || '')
      ) ||
      null;

    if (!selectedTraining) {
      return {
        success: false,
        reason:
          'training-type-not-found',
      };
    }

    const attributeKeys =
      Array.isArray(
        selectedTraining.attributes
      )
        ? selectedTraining.attributes
        : [];

    if (attributeKeys.length === 0) {
      return {
        success: false,
        reason:
          'training-has-no-attributes',
      };
    }

    /*
     * WEEKLY TRAINING XP
     *
     * Training uses one total XP budget that is distributed
     * across 3–5 related attributes.
     *
     * Each Training definition may provide:
     *
     * xpBudget:
     *   Total XP earned from completing the session.
     *
     * attributeWeights:
     *   Relative importance of each affected attribute.
     *
     * Example:
     *
     * attributeWeights: {
     *   acceleration: 1.35,
     *   speed: 1.15,
     *   agility: 1.00,
     *   balance: 0.75,
     * }
     *
     * If weights are not supplied, XP is distributed evenly.
     */
    const totalXP =
      Math.max(
        1,
        Math.round(
          Number(
            selectedTraining.xpBudget
          ) || 30
        )
      );

    const configuredWeights =
      selectedTraining
        .attributeWeights &&
      typeof selectedTraining
        .attributeWeights === 'object'
        ? selectedTraining
            .attributeWeights
        : {};

    const normalizedWeights = {};

    attributeKeys.forEach(
      attributeKey => {
        normalizedWeights[
          attributeKey
        ] =
          Math.max(
            0.01,
            Number(
              configuredWeights[
                attributeKey
              ]
            ) || 1
          );
      }
    );

    const totalWeight =
      Object.values(
        normalizedWeights
      ).reduce(
        (sum, weight) =>
          sum + weight,
        0
      );

    const attributeXP = {};

    attributeKeys.forEach(
      attributeKey => {
        const weight =
          normalizedWeights[
            attributeKey
          ];

        attributeXP[
          attributeKey
        ] =
          Math.max(
            1,
            Math.round(
              totalXP *
              (
                weight /
                totalWeight
              )
            )
          );
      }
    );

    /*
     * Rounding the individual rewards can cause the distributed
     * total to differ slightly from the intended Training budget.
     * Correct that difference on the primary attribute.
     */
    const distributedXP =
      Object.values(
        attributeXP
      ).reduce(
        (sum, amount) =>
          sum +
          (
            Number(amount) || 0
          ),
        0
      );

    const distributionDifference =
      totalXP -
      distributedXP;

    if (
      attributeKeys.length > 0 &&
      distributionDifference !== 0
    ) {
      const primaryAttribute =
        attributeKeys[0];

      attributeXP[
        primaryAttribute
      ] =
        Math.max(
          1,
          (
            Number(
              attributeXP[
                primaryAttribute
              ]
            ) || 0
          ) +
          distributionDifference
        );
    }

    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.TRAINING;

    result.eventId =
      canonicalEvent.id;

    result.date =
      canonicalEvent.date;

    result.event =
      canonicalEvent;

    result.reason =
      'training-completed';

    result.xp = {
      ...result.xp,

      total:
        totalXP,

      general:
        totalXP,

      attributes: {
        ...attributeXP,
      },
    };

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'training-result-not-applied',
      };
    }

    canonicalEvent.completed = true;

    canonicalEvent.completedAt =
      _state.season
        ?.currentDate ||
      canonicalEvent.date ||
      null;

    canonicalEvent.trainingKey =
      selectedTraining.trainingKey;

    canonicalEvent.trainingResult = {
      label:
        selectedTraining.label,

      category:
        selectedTraining.category,

      attributes: [
        ...attributeKeys,
      ],

      attributeXP: {
        ...attributeXP,
      },

      totalXP,
    };

      if (options.save !== false) {
        save();
      }

    return {
      success: true,
      completed: true,

      eventId:
        canonicalEvent.id,

      date:
        canonicalEvent.date,

      trainingKey:
        selectedTraining
          .trainingKey,

      result: {
        ...result,

        trainingKey:
          selectedTraining
            .trainingKey,

        label:
          selectedTraining.label,

        category:
          selectedTraining.category,
      },

      event:
        canonicalEvent,

      applied,
    };
  }

  function completeRecoveryEvent(
    eventId,
    options = {}
  ) {
    const event =
      _state.schedule.find(
        scheduleEvent =>
          String(scheduleEvent.id) ===
          String(eventId)
      );

    if (!event) {
      return {
        success: false,
        reason: 'recovery-not-found',
      };
    }

    if (event.completed) {
      return {
        success: false,
        reason:
          'recovery-already-completed',
      };
    }

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    const result =
      createRecoveryEventResult(
        event,
        careerPlayer
      );

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'recovery-result-not-applied',
      };
    }

    /*
     * Only complete the canonical event after its
     * result has applied successfully.
     */
    event.completed = true;

    event.completedAt =
      event.date;

    event.result = {
      type:
        result.type,

      reason:
        result.reason,

      morale:
        Number(result.morale) || 0,

      health: {
        ...(result.health || {}),
      },

      xp: {
        ...(result.xp || {}),

        attributes: {
          ...(
            result.xp
              ?.attributes ||
            {}
          ),
        },
      },
    };

    /*
     * Finalize the date that was blocked by Recovery.
     */
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    if (
      !_state.season.processedDates
        .includes(event.date)
    ) {
      _state.season.processedDates.push(
        event.date
      );

      _state.season.processedDates.sort(
        (firstDate, secondDate) =>
          String(firstDate).localeCompare(
            String(secondDate)
          )
      );
    }

    if (
      !Array.isArray(
        _state.season.completedEventIds
      )
    ) {
      _state.season.completedEventIds = [];
    }

    if (
      !_state.season.completedEventIds
        .some(
          completedEventId =>
            String(completedEventId) ===
            String(event.id)
        )
    ) {
      _state.season.completedEventIds.push(
        event.id
      );
    }

    _state.season.lastProcessedDate =
      event.date;

    setCurrentDate(
      event.date,
      {
        save: false,
      }
    );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      completed: true,

      eventId:
        event.id,

      date:
        event.date,

      focus:
        event.focus ||
        'recovery',

      result,

      applied,
    };
  }

  function createRecoveryEventResult(
    event,
    player
  ) {
    const result =
      createEmptyEventResult();

    const focus =
      String(
        event?.focus ||
        'recovery'
      );

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.RECOVERY;

    result.reason =
      'recovery-completed';

    result.eventId =
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      event?.date ||
      null;

    result.event =
      event;

    /*
     * Recovery affects health maintenance and injury risk.
     * Project Ice does not use a fatigue meter.
     */
    const recoveryEffects = {
      recovery: {
        injuryRiskModifier: -0.04,
        morale: 2,

        xp: {
          total: 4,
          general: 4,
          attributes: {},
        },
      },

      mobility: {
        injuryRiskModifier: -0.03,
        morale: 1,

        xp: {
          total: 5,
          physical: 5,

          attributes: {
            balance: 3,
            durability: 2,
          },
        },
      },

      'optional-skate': {
        injuryRiskModifier: -0.02,
        morale: 1,

        xp: {
          total: 6,
          skating: 6,

          attributes: {
            agility: 2,
            balance: 2,
            endurance: 2,
          },
        },
      },

      treatment: {
        injuryRiskModifier: -0.06,
        morale: 2,

        xp: {
          total: 3,
          general: 3,
          attributes: {},
        },
      },
    };

    const selectedEffect =
      recoveryEffects[focus] ||
      recoveryEffects.recovery;

    result.health = {
      injuryRiskModifier:
        selectedEffect
          .injuryRiskModifier,

      lastRecoveryDate:
        event?.date ||
        null,
    };

    result.morale =
      selectedEffect.morale;

    result.xp = {
      ...selectedEffect.xp,

      attributes: {
        ...(
          selectedEffect.xp
            ?.attributes ||
          {}
        ),
      },
    };

    return result;
  }
  
  function resolveRecoveryEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = false;

    result.type =
      EVENT_TYPES.RECOVERY;

    /*
     * Recovery is a short player-controlled career event.
     * Calendar advancement pauses so the player can review
     * and complete the scheduled recovery activity.
     */
    result.stopSimulation = true;

    result.reason =
      'recovery-completion-required';

    result.eventId =
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      event?.date ||
      options?.date ||
      null;

    result.event = event;

    return result;
  }

  function createCoachMeetingEventResult(
    event,
    player
  ) {
    const result =
      createEmptyEventResult();

    const meetingType =
      String(
        event?.meetingType ||
        'expectations'
      );

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.COACH_MEETING;

    result.reason =
      'coach-meeting-completed';

    result.eventId =
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      event?.date ||
      null;

    result.event =
      event;

    /*
     * Coach Meetings influence opportunity and direction.
     * They are not intended to hand out large XP rewards.
     */
    const meetingEffects = {
      expectations: {
        coachTrust: 2,

        notes: [
          'Coach Hale outlined what he expects from you this season.',
          'Your role is clear: stay consistent and earn every opportunity.',
          'Coach Hale wants strong habits before he gives you more responsibility.',
          'The coaching staff will be watching how you respond to expectations.',
        ],
      },

      development: {
        coachTrust: 1,

        notes: [
          'Coach Hale wants you focused on steady development.',
          'The staff believes your next step will come through consistent habits.',
          'Your development plan is clear. Now it is about following through.',
          'Coach Hale identified the areas that can help you earn a larger role.',
        ],
      },

      role: {
        coachTrust: 1,

        notes: [
          'Coach Hale explained where you currently fit in the lineup.',
          'Your opportunities will grow if you keep earning the staff’s trust.',
          'The coaching staff wants consistency before changing your role.',
          'Coach Hale made it clear that your lineup position is still in your hands.',
        ],
      },
    };

    const selectedEffect =
      meetingEffects[meetingType] ||
      meetingEffects.expectations;

    result.coachTrust =
      selectedEffect.coachTrust;

    result.coachNote =
      pickStableCareerMessage(
        selectedEffect.notes,
        event?.id,
        event?.date,
        meetingType,
        player?.id,
        player?.coachTrust
      );

    return result;
  }

  function completeCoachMeetingEvent(
    eventId,
    options = {}
  ) {
    const event =
      _state.schedule.find(
        scheduleEvent =>
          String(scheduleEvent.id) ===
          String(eventId)
      );

    if (!event) {
      return {
        success: false,
        reason:
          'coach-meeting-not-found',
      };
    }

    if (event.completed) {
      return {
        success: false,
        reason:
          'coach-meeting-already-completed',
      };
    }

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    const result =
      createCoachMeetingEventResult(
        event,
        careerPlayer
      );

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'coach-meeting-result-not-applied',
      };
    }

    /*
     * Only complete the canonical meeting after its
     * result has applied successfully.
     */
    event.completed = true;

    event.completedAt =
      event.date;

    event.result = {
      type:
        result.type,

      reason:
        result.reason,

      coachTrust:
        Number(
          result.coachTrust
        ) || 0,

      coachNote:
        result.coachNote ||
        '',
    };

    /*
     * Finalize the date that was blocked by the meeting.
     */
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    if (
      !_state.season.processedDates
        .includes(event.date)
    ) {
      _state.season.processedDates.push(
        event.date
      );

      _state.season.processedDates.sort(
        (firstDate, secondDate) =>
          String(firstDate).localeCompare(
            String(secondDate)
          )
      );
    }

    if (
      !Array.isArray(
        _state.season.completedEventIds
      )
    ) {
      _state.season.completedEventIds = [];
    }

    if (
      !_state.season.completedEventIds
        .some(
          completedEventId =>
            String(completedEventId) ===
            String(event.id)
        )
    ) {
      _state.season.completedEventIds.push(
        event.id
      );
    }

    _state.season.lastProcessedDate =
      event.date;

    setCurrentDate(
      event.date,
      {
        save: false,
      }
    );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      completed: true,

      eventId:
        event.id,

      date:
        event.date,

      meetingType:
        event.meetingType ||
        'expectations',

      result,

      applied,
    };
  }

  function resolveCoachMeetingEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = false;

    result.type =
      EVENT_TYPES.COACH_MEETING;

    /*
     * Coach Meetings are player-controlled career events.
     * Calendar advancement pauses so the player can review
     * the discussion and complete the meeting.
     */
    result.stopSimulation = true;

    result.reason =
      'coach-meeting-completion-required';

    result.eventId =
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      event?.date ||
      options?.date ||
      null;

    result.event = event;

    return result;
  }

  function resolveMediaEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = false;

    result.type =
      EVENT_TYPES.MEDIA;

    result.reason =
      'media-system-not-implemented';

    result.eventId =
      event?.id ||
      event?.eventId ||
      null;

    result.date =
      event?.date ||
      options?.date ||
      null;

    result.event = event;

    return result;
  }

  // ── Event Result Contract ───────────────────────────────────

  function createEmptyEventResult() {
    return {
      success: true,

      /*
       * If true, the Season Engine pauses and hands control
       * back to the player.
       */
      stopSimulation: false,

      /*
       * Generic bookkeeping.
       */
      resolved: false,
      type: null,
      reason: null,

      eventId: null,
      date: null,
      event: null,

      /*
       * Player progression.
       */
      xp: {
        total: 0,
        skating: 0,
        shooting: 0,
        passing: 0,
        defense: 0,
        physical: 0,
        hockeyIQ: 0,
        goalie: 0,

        attributes: {},
      },

      /*
       * Attribute or rating changes.
       */
      attributes: {},

      /*
       * Temporary player state.
       */
      coachTrust: 0,
      morale: 0,
      reputation: 0,
      health: {},

      /*
       * Statistics produced by games.
       */
      statistics: null,

      /*
       * News and history.
       */
      news: [],
      history: [],
      accomplishments: [],

      /*
       * Scouting updates.
       */
      scouting: null,

      /*
       * Objectives.
       */
      objectives: [],

      /*
       * Optional follow-up event.
       */
      nextEvent: null,
    };
  }

  function applyEventResult(
    player,
    result = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return false;
    }

    const eventResult = {
      ...createEmptyEventResult(),
      ...(result || {}),
    };

    /*
     * ---------- XP ----------
     */

    ensureCanonicalPlayerContract(
      player
    );

    const xp =
      eventResult.xp &&
      typeof eventResult.xp === 'object'
        ? eventResult.xp
        : {};

    const categoryKeys = [
      'skating',
      'shooting',
      'passing',
      'defense',
      'physical',
      'hockeyIQ',
      'goalie',
      'general',
    ];

    const attributeXP =
      xp.attributes &&
      typeof xp.attributes === 'object'
        ? xp.attributes
        : {};

    /*
     * Only accept attributes that belong to the player’s
     * actual skater or goalie attribute model.
     */
    const validAttributeKeys =
      normalizeAttributePosition(
        player.position
      ) === 'G'
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    let attributeXPTotal = 0;

    validAttributeKeys.forEach(
      attributeKey => {
        const earnedXP =
          Math.max(
            0,
            Number(
              attributeXP[attributeKey]
            ) || 0
          );

        if (earnedXP <= 0) {
          return;
        }

        player.development
          .attributeXP[
            attributeKey
          ] =
          Math.max(
            0,
            Number(
              player.development
                .attributeXP[
                  attributeKey
                ]
            ) || 0
          ) + earnedXP;

        player.development
          .attributeXPEarnedCareer[
            attributeKey
          ] =
          Math.max(
            0,
            Number(
              player.development
                .attributeXPEarnedCareer[
                  attributeKey
                ]
            ) || 0
          ) + earnedXP;

        attributeXPTotal +=
          earnedXP;
      }
    );

    let categoryXPTotal = 0;

    categoryKeys.forEach(
      categoryKey => {
        const earnedXP =
          Math.max(
            0,
            Number(
              xp[categoryKey]
            ) || 0
          );

        player.development
          .xpEarnedByCategory[
            categoryKey
          ] =
          Math.max(
            0,
            Number(
              player.development
                .xpEarnedByCategory[
                  categoryKey
                ]
            ) || 0
          ) + earnedXP;

        categoryXPTotal +=
          earnedXP;
      }
    );

    /*
     * xp.total is the authoritative spendable reward when
     * supplied by an event.
     *
     * If it is omitted, derive the spendable amount from
     * individual attributes first, then broad categories.
     *
     * We never add total + categories + attributes together,
     * because those values describe the same reward at
     * different levels of detail.
     */
    const explicitTotalXP =
      Math.max(
        0,
        Number(xp.total) || 0
      );

    const totalXP =
      explicitTotalXP > 0
        ? explicitTotalXP
        : attributeXPTotal > 0
          ? attributeXPTotal
          : categoryXPTotal;

    /*
     * Individual attribute XP is the actual upgrade
     * currency in Project Ice.
     *
     * totalXP is retained as a lifetime development
     * summary, but it is not added to a second generic
     * spendable balance.
     */
    player.development.xpEarnedCareer =
      Math.max(
        0,
        Number(
          player.development
            .xpEarnedCareer
        ) || 0
      ) + totalXP;

    /*
     * xpAvailable remains in the contract temporarily for
     * compatibility with earlier saves and possible future
     * non-attribute rewards, but normal practices, games,
     * and events do not add to it.
     */
    player.development.xpAvailable =
      Math.max(
        0,
        Number(
          player.development
            .xpAvailable
        ) || 0
      );

    /*
     * ---------- Coach Trust ----------
     */

    player.coachTrust =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.coachTrust || 50) +
            Number(
              eventResult.coachTrust
            )
        )
      );

    /*
     * ---------- Morale ----------
     */

    player.morale =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.morale || 50) +
            Number(
              eventResult.morale
            )
        )
      );

    /*
     * ---------- Reputation ----------
     */

    player.reputationPoints =
      Math.max(
        0,
        Number(
          player.reputationPoints || 0
        ) +
          Number(
            eventResult.reputation
          )
      );

    /*
     * ---------- Health ----------
     */

    const healthUpdate =
      eventResult.health &&
      typeof eventResult.health === 'object'
        ? eventResult.health
        : {};

    if (
      !player.health ||
      typeof player.health !== 'object'
    ) {
      player.health =
        createDefaultHealthState(
          player
        );
    }

    /*
     * Recovery events adjust injury risk rather than using
     * a fatigue meter. The supplied value is treated as a
     * change to the current modifier, not a replacement.
     */
    const injuryRiskChange =
      Number(
        healthUpdate.injuryRiskModifier
      );

    if (
      Number.isFinite(
        injuryRiskChange
      ) &&
      injuryRiskChange !== 0
    ) {
      player.health.injuryRiskModifier =
        Math.max(
          -1,
          Math.min(
            1,
            Number(
              player.health
                .injuryRiskModifier
            ) || 0
          ) + injuryRiskChange
        );
    }

    if (
      typeof healthUpdate.status ===
      'string'
    ) {
      player.health.status =
        healthUpdate.status;
    }

    if (
      typeof healthUpdate.injured ===
      'boolean'
    ) {
      player.health.injured =
        healthUpdate.injured;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        healthUpdate,
        'injury'
      )
    ) {
      player.health.injury =
        healthUpdate.injury;
    }

    if (
      typeof healthUpdate.lastRecoveryDate ===
      'string'
    ) {
      player.health.lastRecoveryDate =
        healthUpdate.lastRecoveryDate;
    }

    /*
     * ---------- History ----------
     */

    if (
      Array.isArray(
        eventResult.history
      )
    ) {
      player.history.milestones.push(
        ...eventResult.history
      );
    }

    /*
     * ---------- Accomplishments ----------
     */

    if (
      Array.isArray(
        eventResult.accomplishments
      )
    ) {
      player.accomplishments.push(
        ...eventResult
          .accomplishments
      );
    }

    /*
     * ---------- News ----------
     *
     * Global news integration comes later.
     */

    return true;
  }

  // ── Individual Attribute Progression ─────────────────────────

  function getPotentialDevelopmentMultiplier(
    player = {}
  ) {
    const potential =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.development
              ?.potential ??
            player.potential ??
            player.overall
          ) || 60
        )
      );

    /*
     * Higher potential lowers the XP required for growth,
     * but never makes upgrades dramatically cheap.
     */
    if (potential >= 96) return 0.84;
    if (potential >= 90) return 0.89;
    if (potential >= 84) return 0.95;
    if (potential >= 79) return 1.00;
    if (potential >= 74) return 1.07;

    return 1.14;
  }

  function getAgeDevelopmentMultiplier(
    player = {}
  ) {
    const age =
      Math.max(
        14,
        Number(
          player.age ??
          player.development?.currentAge
        ) || 14
      );

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    /*
     * Goalies generally retain useful development years
     * slightly longer than skaters.
     */
    if (isGoalie) {
      if (age <= 18) return 0.90;
      if (age <= 22) return 0.94;
      if (age <= 26) return 1.00;
      if (age <= 29) return 1.10;
      if (age <= 34) return 1.28;

      return 1.55;
    }

    if (age <= 18) return 0.90;
    if (age <= 22) return 0.95;
    if (age <= 26) return 1.00;
    if (age <= 28) return 1.12;
    if (age <= 32) return 1.30;

    return 1.60;
  }

  function getPlayerDevelopmentStage(
    player = {}
  ) {
    const age =
      Math.max(
        14,
        Number(
          player.age ??
          player.development?.currentAge
        ) || 14
      );

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    if (isGoalie) {
      if (age <= 19) {
        return {
          stage: 'rapid-growth',
          growthEligible: true,
          regressionEligible: false,
          growthMultiplier: 1.20,
        };
      }

      if (age <= 24) {
        return {
          stage: 'development',
          growthEligible: true,
          regressionEligible: false,
          growthMultiplier: 1.00,
        };
      }

      if (age <= 29) {
        return {
          stage: 'late-development',
          growthEligible: true,
          regressionEligible: false,
          growthMultiplier: 0.60,
        };
      }

      if (age <= 34) {
        return {
          stage: 'prime',
          growthEligible: true,
          regressionEligible: false,
          growthMultiplier: 0.20,
        };
      }

      return {
        stage: 'regression',
        growthEligible: false,
        regressionEligible: true,
        growthMultiplier: 0,
      };
    }

    if (age <= 18) {
      return {
        stage: 'rapid-growth',
        growthEligible: true,
        regressionEligible: false,
        growthMultiplier: 1.20,
      };
    }

    if (age <= 23) {
      return {
        stage: 'development',
        growthEligible: true,
        regressionEligible: false,
        growthMultiplier: 1.00,
      };
    }

    if (age <= 27) {
      return {
        stage: 'late-development',
        growthEligible: true,
        regressionEligible: false,
        growthMultiplier: 0.55,
      };
    }

    if (age <= 32) {
      return {
        stage: 'prime',
        growthEligible: true,
        regressionEligible: false,
        growthMultiplier: 0.15,
      };
    }

    return {
      stage: 'regression',
      growthEligible: false,
      regressionEligible: true,
      growthMultiplier: 0,
    };
  }

  function getNPCWeeklyDevelopmentBudget(
    player = {},
    context = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        eligible: false,
        totalXP: 0,
        reason: 'invalid-player',
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const developmentStage =
      getPlayerDevelopmentStage(
        player
      );

    if (
      !developmentStage.growthEligible
    ) {
      return {
        eligible: false,
        totalXP: 0,
        reason: 'growth-ineligible',
        developmentStage,
      };
    }

    const potential =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.development
              ?.potential ??
            player.potential ??
            player.overall
          ) || 60
        )
      );

    const currentOverall =
      Math.max(
        25,
        Math.min(
          99,
          Number(player.overall) || 50
        )
      );

    const developmentSeed =
      Math.max(
        0,
        Math.min(
          1,
          Number(
            player.development
              ?.developmentSeed ??
            player.developmentSeed
          ) || 0.5
        )
      );

    const gamesPlayedThisWeek =
      Math.max(
        0,
        Number(
          context.gamesPlayedThisWeek
        ) || 0
      );

    const practiceCount =
      Math.max(
        0,
        Number(
          context.practiceCount
        ) || 0
      );

    const performanceRating =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            context.performanceRating
          ) || 50
        )
      );

    const roleOpportunity =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            context.roleOpportunity
          ) || 50
        )
      );

    const healthModifier =
      player.health?.status === 'healthy'
        ? 1
        : player.health?.status === 'recovering'
          ? 0.65
          : 0;

    /*
     * Weekly base development remains deliberately modest.
     * Most players should require many weeks of accumulated
     * attribute XP before earning a +1 rating increase.
     */
    let weeklyBaseXP =
      8;

    /*
     * Potential changes development speed without acting
     * as an automatic overall ceiling.
     */
    let potentialMultiplier = 1;

    if (potential >= 96) {
      potentialMultiplier = 1.35;
    } else if (potential >= 90) {
      potentialMultiplier = 1.22;
    } else if (potential >= 84) {
      potentialMultiplier = 1.10;
    } else if (potential >= 79) {
      potentialMultiplier = 1.00;
    } else if (potential >= 74) {
      potentialMultiplier = 0.88;
    } else {
      potentialMultiplier = 0.76;
    }

    /*
     * Development becomes harder as a player approaches
     * high-end ratings.
     */
    let overallDifficultyMultiplier = 1;

    if (currentOverall >= 90) {
      overallDifficultyMultiplier = 0.35;
    } else if (currentOverall >= 85) {
      overallDifficultyMultiplier = 0.50;
    } else if (currentOverall >= 80) {
      overallDifficultyMultiplier = 0.68;
    } else if (currentOverall >= 75) {
      overallDifficultyMultiplier = 0.82;
    } else if (currentOverall >= 70) {
      overallDifficultyMultiplier = 0.92;
    }

    const gameOpportunityMultiplier =
      0.85 +
      Math.min(
        0.25,
        gamesPlayedThisWeek * 0.08
      );

    const practiceMultiplier =
      1 +
      Math.min(
        0.20,
        practiceCount * 0.06
      );

    const performanceMultiplier =
      0.85 +
      (
        performanceRating / 100
      ) * 0.30;

    const roleMultiplier =
      0.90 +
      (
        roleOpportunity / 100
      ) * 0.20;

    /*
     * The stable development seed creates believable
     * differences between otherwise similar players.
     * It does not reroll every week.
     */
    const playerVarianceMultiplier =
      0.88 +
      developmentSeed * 0.24;

    const calculatedXP =
      weeklyBaseXP *
      potentialMultiplier *
      developmentStage
        .growthMultiplier *
      overallDifficultyMultiplier *
      gameOpportunityMultiplier *
      practiceMultiplier *
      performanceMultiplier *
      roleMultiplier *
      playerVarianceMultiplier *
      healthModifier;

    /*
     * Small weekly randomness prevents every player with
     * the same profile from progressing identically.
     */
    const weeklyVariance =
      0.85 +
      Math.random() * 0.30;

    const totalXP =
      Math.max(
        0,
        Math.round(
          calculatedXP *
          weeklyVariance
        )
      );

    return {
      eligible:
        totalXP > 0,

      totalXP,

      reason:
        totalXP > 0
          ? 'development-budget-created'
          : 'no-development-earned',

      developmentStage,

      factors: {
        potentialMultiplier,
        overallDifficultyMultiplier,
        stageMultiplier:
          developmentStage
            .growthMultiplier,
        gameOpportunityMultiplier,
        practiceMultiplier,
        performanceMultiplier,
        roleMultiplier,
        playerVarianceMultiplier,
        healthModifier,
      },
    };
  }

  function createAttributeDistributionPlan(
    player = {},
    totalXP = 0
  ) {
    ensureCanonicalPlayerContract(
      player
    );

    totalXP = Math.max(
      0,
      Math.floor(Number(totalXP) || 0)
    );

    if (totalXP <= 0) {
      return {
        totalXP: 0,
        distribution: {},
      };
    }

    const dna =
      player.development?.dna || null;

    const developmentProfile =
      dna?.profile ||
      createPlayerDevelopmentProfile(
        player
      );

    const categoryBudget = {};

    let totalWeight = 0;

    DEVELOPMENT_PROFILE_CATEGORIES
      .forEach(category => {

        const weight =
          Math.max(
            0,
            Number(
              developmentProfile[
                category
              ]
            ) || 0
          );

        categoryBudget[
          category
        ] = weight;

        totalWeight += weight;

      });

    if (totalWeight <= 0) {
      return {
        totalXP,
        distribution: {},
      };
    }

    /*
     * Apply the player’s permanent hidden Development
     * Personality to the broad-category weights.
     */
    const personalityKey =
      dna?.personality ||
      'balanced';

    const personalityProfile =
      DEVELOPMENT_PERSONALITY_PROFILES[
        personalityKey
      ] ||
      DEVELOPMENT_PERSONALITY_PROFILES
        .balanced;

    const personalityCategoryWeights =
      personalityProfile
        .categoryWeights || {};

    totalWeight = 0;

    DEVELOPMENT_PROFILE_CATEGORIES
      .forEach(category => {
        const personalityAdjustment =
          Number(
            personalityCategoryWeights[
              category
            ]
          ) || 0;

        categoryBudget[category] =
          Math.max(
            0,
            Number(
              categoryBudget[category]
            ) +
            personalityAdjustment
          );

        totalWeight +=
          categoryBudget[category];
      });

    if (totalWeight <= 0) {
      return {
        totalXP,
        distribution: {},
        categoryDistribution: {},
        reason: 'no-category-weight',
      };
    }

    /*
     * Calculate each category’s exact proportional share.
     * Whole XP points are assigned first.
     */
    const categoryDistribution = {};

    const categoryRemainders = [];

    let assignedXP = 0;

    DEVELOPMENT_PROFILE_CATEGORIES
      .forEach(category => {
        const weight =
          Math.max(
            0,
            Number(
              categoryBudget[category]
            ) || 0
          );

        const exactShare =
          (
            weight /
            totalWeight
          ) *
          totalXP;

        const wholeXP =
          Math.floor(exactShare);

        categoryDistribution[
          category
        ] = wholeXP;

        assignedXP += wholeXP;

        categoryRemainders.push({
          category,

          remainder:
            exactShare - wholeXP,

          /*
           * Small weekly variation prevents identical players
           * from receiving the exact same leftover allocation.
           */
          tiebreaker:
            Math.random(),
        });
      });

    /*
     * Distribute any remaining indivisible XP points to the
     * categories with the strongest fractional claims.
     */
    let remainingXP =
      Math.max(
        0,
        totalXP - assignedXP
      );

    categoryRemainders.sort(
      (first, second) => {
        const remainderDifference =
          second.remainder -
          first.remainder;

        if (
          Math.abs(
            remainderDifference
          ) > 0.0001
        ) {
          return remainderDifference;
        }

        return (
          second.tiebreaker -
          first.tiebreaker
        );
      }
    );

    let remainderIndex = 0;

    while (
      remainingXP > 0 &&
      categoryRemainders.length > 0
    ) {
      const selectedCategory =
        categoryRemainders[
          remainderIndex %
          categoryRemainders.length
        ].category;

      categoryDistribution[
        selectedCategory
      ] += 1;

      remainingXP -= 1;
      remainderIndex += 1;
    }

    /*
     * Convert each broad category allocation into exact
     * individual attribute XP.
     */
    const distribution = {};

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const validAttributeKeys =
      isGoalie
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    Object.entries(
      categoryDistribution
    ).forEach(
      ([category, categoryXP]) => {
        const safeCategoryXP =
          Math.max(
            0,
            Math.floor(
              Number(categoryXP) || 0
            )
          );

        if (safeCategoryXP <= 0) {
          return;
        }

        const categoryWeights =
          ATTRIBUTE_DEVELOPMENT_CATEGORY_WEIGHTS[
            category
          ] || {};

        const weightedAttributes =
          Object.entries(
            categoryWeights
          )
            .filter(
              ([attributeKey]) =>
                validAttributeKeys.includes(
                  attributeKey
                )
            )
            .map(
              ([
                attributeKey,
                baseWeight,
              ], index) => {
                const currentRating =
                  Math.max(
                    25,
                    Math.min(
                      99,
                      Number(
                        player.attributes?.[
                          attributeKey
                        ]
                      ) || 50
                    )
                  );

                /*
                 * A modest weakness bonus nudges development
                 * toward weaker skills without overpowering
                 * the player's natural development DNA.
                 */
                const weaknessMultiplier =
                  1 +
                  Math.max(
                    0,
                    80 - currentRating
                  ) * 0.006;

                /*
                 * Stable player-specific variation prevents
                 * identical players from developing exactly
                 * the same way every week.
                 */
                const dnaSeed =
                  Math.max(
                    0,
                    Math.min(
                      1,
                      Number(
                        dna?.seed ??
                        player.development
                          ?.developmentSeed ??
                        player.developmentSeed
                      ) || 0.5
                    )
                  );

                const stableVariationSeed =
                  (
                    dnaSeed * 911 +
                    index * 0.137 +
                    attributeKey.length * 0.071
                  ) % 1;

                const stableVariation =
                  0.92 +
                  stableVariationSeed * 0.16;

                const finalWeight =
                  Math.max(
                    0,
                    Number(baseWeight) *
                    weaknessMultiplier *
                    stableVariation
                  );

                return {
                  attributeKey,
                  finalWeight,
                  currentRating,
                };
              }
            )
            .filter(
              entry =>
                entry.finalWeight > 0
            );

        const categoryWeightTotal =
          weightedAttributes.reduce(
            (sum, entry) =>
              sum + entry.finalWeight,
            0
          );

        if (
          categoryWeightTotal <= 0 ||
          weightedAttributes.length === 0
        ) {
          return;
        }

        const attributeRemainders = [];

        let assignedCategoryXP = 0;

        weightedAttributes.forEach(
          entry => {
            const exactShare =
              (
                entry.finalWeight /
                categoryWeightTotal
              ) *
              safeCategoryXP;

            const wholeXP =
              Math.floor(exactShare);

            distribution[
              entry.attributeKey
            ] =
              Math.max(
                0,
                Number(
                  distribution[
                    entry.attributeKey
                  ]
                ) || 0
              ) + wholeXP;

            assignedCategoryXP +=
              wholeXP;

            attributeRemainders.push({
              attributeKey:
                entry.attributeKey,

              remainder:
                exactShare - wholeXP,

              /*
               * Small per-distribution variation controls
               * which attribute receives indivisible points.
               */
              tiebreaker:
                Math.random(),
            });
          }
        );

        let remainingCategoryXP =
          Math.max(
            0,
            safeCategoryXP -
            assignedCategoryXP
          );

        attributeRemainders.sort(
          (first, second) => {
            const remainderDifference =
              second.remainder -
              first.remainder;

            if (
              Math.abs(
                remainderDifference
              ) > 0.0001
            ) {
              return remainderDifference;
            }

            return (
              second.tiebreaker -
              first.tiebreaker
            );
          }
        );

        let attributeIndex = 0;

        while (
          remainingCategoryXP > 0 &&
          attributeRemainders.length > 0
        ) {
          const selectedAttribute =
            attributeRemainders[
              attributeIndex %
              attributeRemainders.length
            ].attributeKey;

          distribution[
            selectedAttribute
          ] =
            Math.max(
              0,
              Number(
                distribution[
                  selectedAttribute
                ]
              ) || 0
            ) + 1;

          remainingCategoryXP -= 1;
          attributeIndex += 1;
        }
      }
    );

    const distributedXP =
      Object.values(distribution)
        .reduce(
          (sum, value) =>
            sum +
            Math.max(
              0,
              Number(value) || 0
            ),
          0
        );

    return {
      totalXP,

      distribution,

      categoryDistribution,

      personality:
        personalityKey,

      distributedXP,

      undistributedXP:
        Math.max(
          0,
          totalXP - distributedXP
        ),

      reason:
        distributedXP === totalXP
          ? 'distribution-created'
          : 'partial-distribution-created',
    };
  }

  function applyNPCWeeklyDevelopment(
    player = {},
    context = {},
    options = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        applied: false,
        reason: 'invalid-player',
        totalXP: 0,
        distribution: {},
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    /*
     * The career player earns development through actual
     * games, practices, objectives and career events.
     *
     * This automatic weekly pathway is for NPC players.
     */
    if (player.isCareerPlayer) {
      return {
        success: true,
        applied: false,
        reason: 'career-player-manual-development',
        totalXP: 0,
        distribution: {},
      };
    }

    const budget =
      getNPCWeeklyDevelopmentBudget(
        player,
        context
      );

    if (
      !budget.eligible ||
      budget.totalXP <= 0
    ) {
      return {
        success: true,
        applied: false,
        reason:
          budget.reason ||
          'no-development-earned',

        totalXP: 0,
        distribution: {},
        budget,
      };
    }

    const plan =
      createAttributeDistributionPlan(
        player,
        budget.totalXP
      );

    if (
      !plan ||
      plan.distributedXP <= 0
    ) {
      return {
        success: true,
        applied: false,
        reason: 'no-attribute-distribution',

        totalXP:
          budget.totalXP,

        distribution: {},
        budget,
        plan,
      };
    }

    /*
     * Use the universal Event Result Contract rather than
     * writing directly into the player’s XP balances.
     */
    const eventResult =
      createEmptyEventResult();

    eventResult.type =
      'npc-weekly-development';

    eventResult.reason =
      'weekly-development-earned';

    eventResult.xp = {
      total:
        plan.distributedXP,

      skating:
        Number(
          plan.categoryDistribution
            ?.skating
        ) || 0,

      shooting:
        Number(
          plan.categoryDistribution
            ?.shooting
        ) || 0,

      passing:
        Number(
          plan.categoryDistribution
            ?.passing
        ) || 0,

      defense:
        Number(
          plan.categoryDistribution
            ?.defense
        ) || 0,

      physical:
        Number(
          plan.categoryDistribution
            ?.physical
        ) || 0,

      hockeyIQ:
        Number(
          plan.categoryDistribution
            ?.hockeyIQ
        ) || 0,

      goalie:
        Number(
          plan.categoryDistribution
            ?.goalie
        ) || 0,

      general: 0,

      attributes: {
        ...plan.distribution,
      },
    };

    const applied =
      applyEventResult(
        player,
        eventResult
      );

    if (!applied) {
      return {
        success: false,
        applied: false,
        reason: 'event-result-application-failed',

        totalXP:
          plan.distributedXP,

        distribution: {
          ...plan.distribution,
        },

        budget,
        plan,
      };
    }

    const developmentEntry = {
      id:
        `npc-development-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'npc-weekly-development',

      date:
        _state.season?.currentDate ||
        _state.player?.currentDate ||
        null,

      seasonId:
        _state.season?.id ||
        null,

      week:
        Number(
          context.week ??
          _state.season?.currentWeek
        ) || 1,

      totalXP:
        plan.distributedXP,

      categoryDistribution: {
        ...plan.categoryDistribution,
      },

      attributeDistribution: {
        ...plan.distribution,
      },

      developmentStage:
        budget.developmentStage
          ?.stage ||
        null,
    };

    player.development
      .developmentHistory
      .push(
        developmentEntry
      );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      applied: true,
      reason: 'weekly-development-applied',

      totalXP:
        plan.distributedXP,

      distribution: {
        ...plan.distribution,
      },

      categoryDistribution: {
        ...plan.categoryDistribution,
      },

      budget,
      plan,
      developmentEntry,
    };
  }

  function processNPCAutomaticUpgrades(
    player = {},
    context = {},
    options = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        upgraded: false,
        reason: 'invalid-player',
        upgrades: [],
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    /*
     * The career player's attribute upgrades remain
     * entirely controlled through the Player tab.
     */
    if (player.isCareerPlayer) {
      return {
        success: true,
        upgraded: false,
        reason: 'career-player-manual-upgrades',
        upgrades: [],
      };
    }

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const validAttributeKeys =
      isGoalie
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    const eligibleAttributes =
      validAttributeKeys
        .map(attributeKey => {
          const eligibility =
            canUpgradePlayerAttribute(
              player,
              attributeKey
            );

          return {
            attributeKey,
            eligibility,
          };
        })
        .filter(
          entry =>
            entry.eligibility
              .canUpgrade
        )
        .sort((first, second) => {
          /*
           * Prioritize the attributes with the greatest
           * proportional XP surplus rather than simply
           * selecting the largest raw balance.
           */
          const firstRatio =
            first.eligibility
              .requiredXP > 0
              ? first.eligibility
                  .currentXP /
                first.eligibility
                  .requiredXP
              : 0;

          const secondRatio =
            second.eligibility
              .requiredXP > 0
              ? second.eligibility
                  .currentXP /
                second.eligibility
                  .requiredXP
              : 0;

          if (
            secondRatio !==
            firstRatio
          ) {
            return (
              secondRatio -
              firstRatio
            );
          }

          return (
            first.eligibility
              .currentRating -
            second.eligibility
              .currentRating
          );
        });

    if (
      eligibleAttributes.length === 0
    ) {
      return {
        success: true,
        upgraded: false,
        reason: 'no-upgrades-available',
        upgrades: [],
      };
    }

    /*
     * Prevent unrealistic weekly explosions when an older
     * save or major event creates a large XP backlog.
     *
     * Normal weekly development allows one automatic +1.
     * Exceptional contexts may temporarily allow two.
     */
    const maximumUpgrades =
      Math.max(
        1,
        Math.min(
          2,
          Number(
            context.maximumUpgrades
          ) || 1
        )
      );

    const upgrades = [];

    for (
      const entry of
      eligibleAttributes
    ) {
      if (
        upgrades.length >=
        maximumUpgrades
      ) {
        break;
      }

      const upgradeResult =
        upgradePlayerAttribute(
          player,
          entry.attributeKey,
          {
            save: false,
          }
        );

      if (
        upgradeResult.success
      ) {
        upgrades.push(
          upgradeResult
        );
      }
    }

    if (
      options.save !== false &&
      upgrades.length > 0
    ) {
      save();
    }

    return {
      success: true,

      upgraded:
        upgrades.length > 0,

      reason:
        upgrades.length > 0
          ? 'npc-upgrades-completed'
          : 'upgrade-attempt-failed',

      upgrades,

      maximumUpgrades,

      overall:
        Number(player.overall) || 0,
    };
  }

  function processNPCDevelopmentWeek(
    player = {},
    context = {},
    options = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        processed: false,
        reason: 'invalid-player',
        developmentResult: null,
        upgradeResult: null,
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    if (player.isCareerPlayer) {
      return {
        success: true,
        processed: false,
        reason: 'career-player-event-development',
        developmentResult: null,
        upgradeResult: null,
      };
    }

    const developmentResult =
      applyNPCWeeklyDevelopment(
        player,
        context,
        {
          save: false,
        }
      );

    const upgradeResult =
      processNPCAutomaticUpgrades(
        player,
        context,
        {
          save: false,
        }
      );

    const changed =
      Boolean(
        developmentResult?.applied ||
        upgradeResult?.upgraded
      );

    if (
      options.save !== false &&
      changed
    ) {
      save();
    }

    return {
      success:
        developmentResult?.success !== false &&
        upgradeResult?.success !== false,

      processed:
        changed,

      reason:
        changed
          ? 'npc-development-week-processed'
          : developmentResult?.reason ||
            upgradeResult?.reason ||
            'no-development-change',

      playerId:
        player.playerId ||
        player.id ||
        null,

      teamId:
        player.teamId ||
        null,

      developmentResult,

      upgradeResult,

      overall:
        Number(player.overall) || 0,
    };
  }

  function processLeagueDevelopmentWeek(
    context = {},
    options = {}
  ) {

    const processedPlayers = [];

    let totalPlayers = 0;
    let developedPlayers = 0;
    let upgradedPlayers = 0;

    (_state.teams || []).forEach(team => {

      const roster =
        getTeamRoster(
          team.teamId
        );

      roster.forEach(player => {

        totalPlayers++;

        const result =
          processNPCDevelopmentWeek(
            player,
            context,
            {
              save: false,
            }
          );

        processedPlayers.push(result);

        if (result?.developmentResult?.applied) {
          developedPlayers++;
        }

        if (result?.upgradeResult?.upgraded) {
          upgradedPlayers++;
        }

      });

    });

    if (options.save !== false) {
      save();
    }

    return {

      success: true,

      totalPlayers,

      developedPlayers,

      upgradedPlayers,

      processedPlayers,

    };

  }

  function getPlayerAnnualRegressionBudget(
    player = {},
    context = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        eligible: false,
        regressionPoints: 0,
        reason: 'invalid-player',
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const developmentStage =
      getPlayerDevelopmentStage(
        player
      );

    if (
      !developmentStage
        .regressionEligible
    ) {
      return {
        eligible: false,
        regressionPoints: 0,
        reason: 'regression-ineligible',
        developmentStage,
      };
    }

    const age =
      Math.max(
        14,
        Number(
          player.age ??
          player.development
            ?.currentAge
        ) || 14
      );

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const currentOverall =
      Math.max(
        25,
        Math.min(
          99,
          Number(player.overall) || 50
        )
      );

    /*
     * Stable hidden variation gives otherwise similar
     * players different aging curves without rerolling
     * their longevity every season.
     */
    const regressionSeed =
      Math.max(
        0,
        Math.min(
          1,
          Number(
            player.development
              ?.dna?.seed ??
            player.development
              ?.developmentSeed ??
            player.developmentSeed
          ) || 0.5
        )
      );

    const regressionStartAge =
      isGoalie
        ? 35
        : 33;

    const yearsIntoRegression =
      Math.max(
        0,
        age - regressionStartAge
      );

    /*
     * Decline begins modestly and becomes more likely
     * as the player moves deeper into their 30s.
     */
    let ageBasePoints =
      isGoalie
        ? 1
        : 1;

    if (yearsIntoRegression >= 2) {
      ageBasePoints += 1;
    }

    if (yearsIntoRegression >= 4) {
      ageBasePoints += 1;
    }

    if (yearsIntoRegression >= 6) {
      ageBasePoints += 2;
    }

    /*
     * Higher-rated players have more ability to lose,
     * but elite status does not automatically cause
     * a dramatic collapse.
     */
    let overallModifier = 0;

    if (currentOverall >= 90) {
      overallModifier = 1;
    } else if (currentOverall < 70) {
      overallModifier = -1;
    }

    const healthStatus =
      player.health?.status ||
      'healthy';

    let healthModifier = 0;

    if (healthStatus === 'recovering') {
      healthModifier = 1;
    }

    if (
      healthStatus === 'injured' ||
      context.majorInjury === true
    ) {
      healthModifier = 2;
    }

    /*
     * A favorable stable seed slightly protects longevity.
     * An unfavorable seed creates somewhat earlier or
     * stronger decline.
     */
    const longevityModifier =
      regressionSeed >= 0.75
        ? -1
        : regressionSeed <= 0.25
          ? 1
          : 0;

    const seasonalVariance =
      Math.random();

    let varianceModifier = 0;

    if (seasonalVariance < 0.15) {
      varianceModifier = -1;
    } else if (seasonalVariance > 0.88) {
      varianceModifier = 1;
    }

    const regressionPoints =
      Math.max(
        0,
        Math.min(
          8,
          ageBasePoints +
          overallModifier +
          healthModifier +
          longevityModifier +
          varianceModifier
        )
      );

    return {
      eligible:
        regressionPoints > 0,

      regressionPoints,

      reason:
        regressionPoints > 0
          ? 'annual-regression-budget-created'
          : 'no-regression-this-season',

      developmentStage,

      factors: {
        age,
        regressionStartAge,
        yearsIntoRegression,
        ageBasePoints,
        overallModifier,
        healthModifier,
        longevityModifier,
        varianceModifier,
        currentOverall,
        isGoalie,
      },
    };
  }

  const SKATER_REGRESSION_WEIGHTS = {
    speed: 18,
    acceleration: 17,
    agility: 13,
    endurance: 12,
    strength: 9,
    durability: 8,
    balance: 7,

    wristShotPower: 5,
    slapShotPower: 5,
    bodyChecking: 4,

    deking: 2,
    puckControl: 2,
    handEye: 2,

    wristShotAccuracy: 1,
    slapShotAccuracy: 1,
    passing: 1,
    stickChecking: 1,
    shotBlocking: 1,

    offensiveAwareness: 0.35,
    defensiveAwareness: 0.35,
    poise: 0.25,
    discipline: 0.20,
    faceoffs: 0.30,
  };

  const GOALIE_REGRESSION_WEIGHTS = {
    recoverySpeed: 17,
    lateralMovement: 16,
    reflexes: 15,
    agility: 13,

    gloveHigh: 6,
    gloveLow: 6,
    blockerHigh: 6,
    blockerLow: 6,
    fiveHole: 5,

    reboundControl: 4,
    stickControl: 3,
    consistency: 3,

    positioning: 1,
    angles: 1,
    puckTracking: 1,
    anticipation: 0.5,
    composure: 0.4,

    puckHandling: 2,
    goaliePassing: 2,
  };

  function createAnnualRegressionPlan(
    player = {},
    regressionPoints = 0
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        regressionPoints: 0,
        distribution: {},
        reason: 'invalid-player',
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const safeRegressionPoints =
      Math.max(
        0,
        Math.floor(
          Number(regressionPoints) || 0
        )
      );

    if (safeRegressionPoints <= 0) {
      return {
        success: true,
        regressionPoints: 0,
        distribution: {},
        reason: 'no-regression-points',
      };
    }

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const validAttributeKeys =
      isGoalie
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    const baseWeights =
      isGoalie
        ? GOALIE_REGRESSION_WEIGHTS
        : SKATER_REGRESSION_WEIGHTS;

    const weightedAttributes =
      validAttributeKeys
        .map((attributeKey, index) => {
          const currentRating =
            Math.max(
              25,
              Math.min(
                99,
                Number(
                  player.attributes?.[
                    attributeKey
                  ]
                ) || 50
              )
            );

          /*
           * Attributes already near the minimum should be
           * less likely to absorb further decline.
           */
          const ratingAvailability =
            Math.max(
              0,
              (
                currentRating - 25
              ) / 74
            );

          const baseWeight =
            Math.max(
              0,
              Number(
                baseWeights[
                  attributeKey
                ]
              ) || 0
            );

          const dnaSeed =
            Math.max(
              0,
              Math.min(
                1,
                Number(
                  player.development
                    ?.dna?.seed ??
                  player.development
                    ?.developmentSeed ??
                  player.developmentSeed
                ) || 0.5
              )
            );

          /*
           * Stable variation makes two similar veterans age
           * differently without completely rerolling their
           * decline pattern every season.
           */
          const stableVariationSeed =
            (
              dnaSeed * 733 +
              index * 0.193 +
              attributeKey.length * 0.047
            ) % 1;

          const stableVariation =
            0.90 +
            stableVariationSeed * 0.20;

          const finalWeight =
            baseWeight *
            ratingAvailability *
            stableVariation;

          return {
            attributeKey,
            currentRating,
            finalWeight,
            tiebreaker: Math.random(),
          };
        })
        .filter(
          entry =>
            entry.currentRating > 25 &&
            entry.finalWeight > 0
        );

    if (weightedAttributes.length === 0) {
      return {
        success: true,
        regressionPoints: 0,
        distribution: {},
        reason: 'no-regressible-attributes',
      };
    }

    const distribution = {};

    /*
     * Each annual regression point normally affects a
     * different attribute by -1. This prevents one season
     * from destroying a single rating.
     */
    const availableAttributes = [
      ...weightedAttributes,
    ];

    let remainingPoints =
      Math.min(
        safeRegressionPoints,
        availableAttributes.length
      );

    while (
      remainingPoints > 0 &&
      availableAttributes.length > 0
    ) {
      const totalWeight =
        availableAttributes.reduce(
          (sum, entry) =>
            sum + entry.finalWeight,
          0
        );

      if (totalWeight <= 0) {
        break;
      }

      let roll =
        Math.random() *
        totalWeight;

      let selectedIndex = 0;

      for (
        let index = 0;
        index <
        availableAttributes.length;
        index++
      ) {
        roll -=
          availableAttributes[
            index
          ].finalWeight;

        if (roll <= 0) {
          selectedIndex = index;
          break;
        }
      }

      const [
        selectedAttribute,
      ] =
        availableAttributes.splice(
          selectedIndex,
          1
        );

      distribution[
        selectedAttribute.attributeKey
      ] = -1;

      remainingPoints -= 1;
    }

    const assignedRegressionPoints =
      Object.values(distribution)
        .reduce(
          (sum, value) =>
            sum +
            Math.abs(
              Number(value) || 0
            ),
          0
        );

    return {
      success: true,

      regressionPoints:
        safeRegressionPoints,

      assignedRegressionPoints,

      unassignedRegressionPoints:
        Math.max(
          0,
          safeRegressionPoints -
          assignedRegressionPoints
        ),

      distribution,

      reason:
        assignedRegressionPoints > 0
          ? 'regression-plan-created'
          : 'no-regression-assigned',
    };
  }

  function applyPlayerAnnualRegression(
    player = {},
    context = {},
    options = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        applied: false,
        reason: 'invalid-player',
        distribution: {},
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const budget =
      getPlayerAnnualRegressionBudget(
        player,
        context
      );

    if (
      !budget.eligible ||
      budget.regressionPoints <= 0
    ) {
      return {
        success: true,
        applied: false,

        reason:
          budget.reason ||
          'no-regression-this-season',

        distribution: {},
        budget,
      };
    }

    const plan =
      createAnnualRegressionPlan(
        player,
        budget.regressionPoints
      );

    if (
      !plan.success ||
      plan.assignedRegressionPoints <= 0
    ) {
      return {
        success:
          plan.success !== false,

        applied: false,

        reason:
          plan.reason ||
          'no-regression-assigned',

        distribution: {},
        budget,
        plan,
      };
    }

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const validAttributeKeys =
      isGoalie
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    const overallBefore =
      Number(player.overall) || 0;

    const appliedDistribution = {};

    Object.entries(
      plan.distribution
    ).forEach(
      ([attributeKey, change]) => {
        if (
          !validAttributeKeys.includes(
            attributeKey
          )
        ) {
          return;
        }

        const safeChange =
          Math.min(
            0,
            Number(change) || 0
          );

        if (safeChange === 0) {
          return;
        }

        const previousRating =
          Math.max(
            25,
            Math.min(
              99,
              Number(
                player.attributes?.[
                  attributeKey
                ]
              ) || 50
            )
          );

        const newRating =
          clampAttribute(
            previousRating +
            safeChange
          );

        const appliedChange =
          newRating -
          previousRating;

        if (appliedChange === 0) {
          return;
        }

        player.attributes[
          attributeKey
        ] =
          newRating;

        appliedDistribution[
          attributeKey
        ] = {
          previousRating,
          newRating,
          change:
            appliedChange,
        };
      }
    );

    const appliedAttributePoints =
      Object.values(
        appliedDistribution
      ).reduce(
        (sum, entry) =>
          sum +
          Math.abs(
            Number(entry.change) || 0
          ),
        0
      );

    if (appliedAttributePoints <= 0) {
      return {
        success: true,
        applied: false,
        reason: 'regression-had-no-effect',

        distribution: {},
        budget,
        plan,
      };
    }

    /*
     * Overall remains derived entirely from the current
     * attributes. Goalies use their dedicated formula.
     */
    player.overall =
      isGoalie
        ? calculateGoalieOverallFromAttributes(
            player.attributes
          )
        : calculateOverallFromAttributes(
            player.attributes,
            player.position
          );

    const overallAfter =
      Number(player.overall) || 0;

    const overallRegression =
      Math.max(
        0,
        overallBefore -
        overallAfter
      );

    player.development
      .totalOverallRegression =
      Math.max(
        0,
        Number(
          player.development
            .totalOverallRegression
        ) || 0
      ) +
      overallRegression;

    /*
     * Track annual attribute decline separately from growth.
     */
    if (
      !player.development
        .seasonAttributeRegression ||
      typeof player.development
        .seasonAttributeRegression !==
        'object'
    ) {
      player.development
        .seasonAttributeRegression = {};
    }

    Object.entries(
      appliedDistribution
    ).forEach(
      ([attributeKey, entry]) => {
        player.development
          .seasonAttributeRegression[
            attributeKey
          ] =
          Math.max(
            0,
            Number(
              player.development
                .seasonAttributeRegression[
                  attributeKey
                ]
            ) || 0
          ) +
          Math.abs(
            Number(entry.change) || 0
          );
      }
    );

    const regressionEntry = {
      id:
        `annual-regression-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'annual-regression',

      date:
        _state.season?.currentDate ||
        _state.player?.currentDate ||
        null,

      seasonId:
        _state.season?.id ||
        null,

      seasonNumber:
        Number(
          _state.season
            ?.seasonNumber
        ) || 1,

      age:
        Number(
          player.age ??
          player.development
            ?.currentAge
        ) || null,

      regressionPoints:
        budget.regressionPoints,

      appliedAttributePoints,

      attributeChanges: {
        ...appliedDistribution,
      },

      overallBefore,
      overallAfter,
      overallRegression,

      factors: {
        ...(budget.factors || {}),
      },
    };

    player.development
      .developmentHistory
      .push(
        regressionEntry
      );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      applied: true,
      reason: 'annual-regression-applied',

      playerId:
        player.playerId ||
        player.id ||
        null,

      distribution: {
        ...appliedDistribution,
      },

      appliedAttributePoints,

      overallBefore,
      overallAfter,
      overallRegression,

      budget,
      plan,
      regressionEntry,
    };
  }

  function processLeagueAnnualRegression(
    context = {},
    options = {}
  ) {
    const teamResults = [];

    const playerResults = [];

    let totalPlayers = 0;
    let eligiblePlayers = 0;
    let regressedPlayers = 0;

    let totalAttributeDeclines = 0;
    let totalOverallRegression = 0;

    const teams =
      Array.isArray(_state.teams)
        ? _state.teams
        : [];

    teams.forEach(team => {
      const roster =
        Array.isArray(team.roster)
          ? team.roster
          : [];

      const teamPlayerResults = [];

      let teamEligiblePlayers = 0;
      let teamRegressedPlayers = 0;
      let teamAttributeDeclines = 0;
      let teamOverallRegression = 0;

      roster.forEach(player => {
        totalPlayers += 1;

        ensureCanonicalPlayerContract(
          player
        );

        const regressionResult =
          applyPlayerAnnualRegression(
            player,
            context,
            {
              save: false,
            }
          );

        const result = {
          playerId:
            player.playerId ||
            player.id ||
            null,

          teamId:
            team.teamId ||
            player.teamId ||
            null,

          playerName:
            `${player.firstName || ''} ${player.lastName || ''}`
              .trim() ||
            'Unknown Player',

          position:
            player.position ||
            null,

          age:
            Number(
              player.age ??
              player.development
                ?.currentAge
            ) || null,

          overall:
            Number(player.overall) || 0,

          ...regressionResult,
        };

        playerResults.push(result);

        teamPlayerResults.push(result);

        if (
          regressionResult
            ?.budget
            ?.eligible
        ) {
          eligiblePlayers += 1;

          teamEligiblePlayers += 1;
        }

        if (
          regressionResult?.applied
        ) {
          const attributeDeclines =
            Math.max(
              0,
              Number(
                regressionResult
                  .appliedAttributePoints
              ) || 0
            );

          const overallRegression =
            Math.max(
              0,
              Number(
                regressionResult
                  .overallRegression
              ) || 0
            );

          regressedPlayers += 1;

          teamRegressedPlayers += 1;

          totalAttributeDeclines +=
            attributeDeclines;

          teamAttributeDeclines +=
            attributeDeclines;

          totalOverallRegression +=
            overallRegression;

          teamOverallRegression +=
            overallRegression;
        }
      });

      teamResults.push({
        teamId:
          team.teamId ||
          null,

        schoolName:
          team.schoolName ||
          null,

        teamName:
          team.teamName ||
          null,

        totalPlayers:
          roster.length,

        eligiblePlayers:
          teamEligiblePlayers,

        regressedPlayers:
          teamRegressedPlayers,

        totalAttributeDeclines:
          teamAttributeDeclines,

        totalOverallRegression:
          teamOverallRegression,

        playerResults:
          teamPlayerResults,
      });
    });

    const changed =
      regressedPlayers > 0;

    if (
      options.save !== false &&
      changed
    ) {
      save();
    }

    return {
      success: true,

      processed: true,

      reason:
        changed
          ? 'league-annual-regression-processed'
          : 'league-annual-regression-no-changes',

      seasonId:
        _state.season?.id ||
        null,

      seasonNumber:
        Number(
          _state.season
            ?.seasonNumber
        ) || 1,

      totalTeams:
        teams.length,

      totalPlayers,

      eligiblePlayers,

      regressedPlayers,

      totalAttributeDeclines,

      totalOverallRegression,

      teamResults,

      playerResults,
    };
  }

  function evaluatePlayerAnnualDevelopmentTrajectory(
    player = {},
    context = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        trajectory: 'invalid',
        developmentMultiplier: 1,
        reason: 'invalid-player',
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const seasonNumber =
      Math.max(
        1,
        Number(
          context.seasonNumber ??
          _state.season?.seasonNumber
        ) || 1
      );

    /*
     * Never reroll the same player’s trajectory repeatedly
     * during the same season transition.
     */
    const previousEvaluation =
      Array.isArray(
        player.development
          ?.developmentHistory
      )
        ? player.development
            .developmentHistory
            .find(entry =>
              entry?.type ===
                'annual-development-trajectory' &&
              Number(entry.seasonNumber) ===
                seasonNumber
            )
        : null;

    if (previousEvaluation) {
      return {
        success: true,

        trajectory:
          previousEvaluation
            .trajectory,

        developmentMultiplier:
          Number(
            previousEvaluation
              .developmentMultiplier
          ) || 1,

        reason:
          'trajectory-already-evaluated',

        existingEntry:
          previousEvaluation,
      };
    }

    const stage =
      getPlayerDevelopmentStage(
        player
      );

    const potential =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.development
              ?.potential ??
            player.potential ??
            player.overall
          ) || 60
        )
      );

    const overall =
      Math.max(
        25,
        Math.min(
          99,
          Number(player.overall) || 50
        )
      );

    const performanceRating =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            context.performanceRating
          ) || 50
        )
      );

    const roleOpportunity =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            context.roleOpportunity
          ) || 50
        )
      );

    const gamesPlayedRate =
      Math.max(
        0,
        Math.min(
          1,
          Number(
            context.gamesPlayedRate
          ) || 0.75
        )
      );

    const personalityKey =
      player.development
        ?.dna?.personality ||
      'balanced';

    const developmentSeed =
      Math.max(
        0,
        Math.min(
          1,
          Number(
            player.development
              ?.dna?.seed ??
            player.development
              ?.developmentSeed ??
            player.developmentSeed
          ) || 0.5
        )
      );

    const healthStatus =
      player.health?.status ||
      'healthy';

    /*
     * Talent gap describes how much plausible room remains
     * between current ability and visible potential.
     */
    const talentGap =
      Math.max(
        0,
        potential - overall
      );

    let breakoutScore = 0;
    let underdevelopmentScore = 0;

    /*
     * Performance and meaningful opportunity are the
     * strongest causes of an annual breakout.
     */
    breakoutScore +=
      Math.max(
        0,
        performanceRating - 60
      ) * 0.75;

    breakoutScore +=
      Math.max(
        0,
        roleOpportunity - 55
      ) * 0.35;

    breakoutScore +=
      talentGap * 0.35;

    breakoutScore +=
      gamesPlayedRate * 8;

    /*
     * Weak performance, limited opportunity, missed games,
     * and poor health can create a disappointing season.
     */
    underdevelopmentScore +=
      Math.max(
        0,
        52 - performanceRating
      ) * 0.75;

    underdevelopmentScore +=
      Math.max(
        0,
        45 - roleOpportunity
      ) * 0.40;

    underdevelopmentScore +=
      Math.max(
        0,
        0.65 - gamesPlayedRate
      ) * 20;

    if (healthStatus === 'recovering') {
      underdevelopmentScore += 6;
    }

    if (healthStatus === 'injured') {
      underdevelopmentScore += 14;
    }

    /*
     * Hidden personalities alter how players respond to
     * their circumstances without changing visible potential.
     */
    if (personalityKey === 'fastLearner') {
      breakoutScore += 5;
    }

    if (personalityKey === 'highMotor') {
      breakoutScore += 3;
    }

    if (personalityKey === 'lateBloomer') {
      if (
        stage.stage ===
          'late-development' ||
        stage.stage === 'prime'
      ) {
        breakoutScore += 8;
      } else {
        breakoutScore -= 3;
      }
    }

    if (
      personalityKey ===
      'confidencePlayer'
    ) {
      if (performanceRating >= 65) {
        breakoutScore += 6;
      }

      if (performanceRating <= 45) {
        underdevelopmentScore += 6;
      }
    }

    /*
     * Stable player identity contributes to long-term career
     * differences, while the seasonal roll keeps outcomes
     * from being completely predetermined.
     */
    const stableBreakoutModifier =
      (
        developmentSeed - 0.5
      ) * 8;

    breakoutScore +=
      stableBreakoutModifier;

    underdevelopmentScore -=
      stableBreakoutModifier * 0.5;

    const seasonalRoll =
      Math.random() * 100;

    let trajectory = 'normal';
    let developmentMultiplier = 1;

    /*
     * Major breakouts remain rare. Minor positive and
     * negative seasons are more common.
     */
    if (
      breakoutScore >= 36 &&
      seasonalRoll >= 82
    ) {
      trajectory =
        'major-breakout';

      developmentMultiplier =
        1.45;
    } else if (
      breakoutScore >= 24 &&
      seasonalRoll >= 62
    ) {
      trajectory =
        'breakout';

      developmentMultiplier =
        1.22;
    } else if (
      underdevelopmentScore >= 28 &&
      seasonalRoll <= 15
    ) {
      trajectory =
        'major-underdevelopment';

      developmentMultiplier =
        0.62;
    } else if (
      underdevelopmentScore >= 18 &&
      seasonalRoll <= 34
    ) {
      trajectory =
        'underdevelopment';

      developmentMultiplier =
        0.82;
    }

    return {
      success: true,

      trajectory,

      developmentMultiplier,

      reason:
        'annual-trajectory-evaluated',

      factors: {
        seasonNumber,
        stage:
          stage.stage,

        potential,
        overall,
        talentGap,

        performanceRating,
        roleOpportunity,
        gamesPlayedRate,
        healthStatus,

        personality:
          personalityKey,

        breakoutScore:
          Number(
            breakoutScore.toFixed(2)
          ),

        underdevelopmentScore:
          Number(
            underdevelopmentScore
              .toFixed(2)
          ),

        seasonalRoll:
          Number(
            seasonalRoll.toFixed(2)
          ),
      },
    };
  }

  function evaluatePlayerAnnualPotentialChange(
    player = {},
    trajectoryResult = {},
    context = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return {
        success: false,
        changed: false,
        reason: 'invalid-player',
        potentialBefore: null,
        potentialAfter: null,
        change: 0,
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const seasonNumber =
      Math.max(
        1,
        Number(
          context.seasonNumber ??
          _state.season?.seasonNumber
        ) || 1
      );

    /*
     * Prevent the same season transition from changing
     * potential more than once.
     */
    const previousEvaluation =
      player.development
        .developmentHistory
        .find(entry =>
          entry?.type ===
            'annual-potential-evaluation' &&
          Number(entry.seasonNumber) ===
            seasonNumber
        );

    if (previousEvaluation) {
      return {
        success: true,
        changed:
          Number(
            previousEvaluation.change
          ) !== 0,

        reason:
          'potential-already-evaluated',

        potentialBefore:
          previousEvaluation
            .potentialBefore,

        potentialAfter:
          previousEvaluation
            .potentialAfter,

        change:
          Number(
            previousEvaluation.change
          ) || 0,

        existingEntry:
          previousEvaluation,
      };
    }

    const age =
      Math.max(
        14,
        Number(
          player.age ??
          player.development
            ?.currentAge
        ) || 14
      );

    const overall =
      Math.max(
        25,
        Math.min(
          99,
          Number(player.overall) || 50
        )
      );

    const potentialBefore =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.development
              ?.potential ??
            player.potential ??
            overall
          ) || overall
        )
      );

    const trajectory =
      trajectoryResult
        ?.trajectory ||
      'normal';

    const history =
      Array.isArray(
        player.development
          ?.developmentHistory
      )
        ? player.development
            .developmentHistory
        : [];

    /*
     * Look at recent annual trajectories. Potential should
     * react to sustained evidence rather than one random
     * season.
     */
    const recentTrajectories =
      history
        .filter(entry =>
          entry?.type ===
          'annual-development-trajectory'
        )
        .sort(
          (first, second) =>
            Number(
              second.seasonNumber
            ) -
            Number(
              first.seasonNumber
            )
        )
        .slice(0, 2)
        .map(entry =>
          entry.trajectory
        );

    recentTrajectories.unshift(
      trajectory
    );

    const positiveTrajectoryCount =
      recentTrajectories.filter(value =>
        value === 'breakout' ||
        value === 'major-breakout'
      ).length;

    const negativeTrajectoryCount =
      recentTrajectories.filter(value =>
        value ===
          'underdevelopment' ||
        value ===
          'major-underdevelopment'
      ).length;

    const majorBreakoutCount =
      recentTrajectories.filter(
        value =>
          value ===
          'major-breakout'
      ).length;

    const majorUnderdevelopmentCount =
      recentTrajectories.filter(
        value =>
          value ===
          'major-underdevelopment'
      ).length;

    const talentGap =
      potentialBefore -
      overall;

    /*
     * Potential becomes more stable as the player ages.
     */
    let ageMobility = 1;

    if (age <= 18) {
      ageMobility = 1.00;
    } else if (age <= 22) {
      ageMobility = 0.80;
    } else if (age <= 26) {
      ageMobility = 0.55;
    } else if (age <= 30) {
      ageMobility = 0.30;
    } else {
      ageMobility = 0.12;
    }

    let upwardScore = 0;
    let downwardScore = 0;

    upwardScore +=
      positiveTrajectoryCount * 18;

    upwardScore +=
      majorBreakoutCount * 12;

    downwardScore +=
      negativeTrajectoryCount * 18;

    downwardScore +=
      majorUnderdevelopmentCount * 12;

    /*
     * A player performing at or above the expected ceiling
     * creates evidence that evaluators underrated them.
     */
    if (talentGap <= 2) {
      upwardScore += 10;
    }

    if (overall > potentialBefore) {
      upwardScore +=
        (
          overall -
          potentialBefore
        ) * 10;
    }

    /*
     * A large unused talent gap combined with repeated poor
     * trajectories creates downward pressure.
     */
    if (
      talentGap >= 12 &&
      negativeTrajectoryCount >= 2
    ) {
      downwardScore += 10;
    }

    upwardScore *=
      ageMobility;

    downwardScore *=
      Math.max(
        0.45,
        ageMobility
      );

    const roll =
      Math.random() * 100;

    let potentialChange = 0;
    let reason =
      'potential-remained-stable';

    /*
     * Most annual evaluations produce no change.
     * Sustained major evidence can produce a larger move,
     * but movement remains gradual.
     */
    if (
      upwardScore >= 32 &&
      roll >= 82
    ) {
      potentialChange =
        majorBreakoutCount >= 2
          ? 2
          : 1;

      reason =
        'potential-increased';
    } else if (
      downwardScore >= 32 &&
      roll <= 18
    ) {
      potentialChange =
        majorUnderdevelopmentCount >= 2
          ? -2
          : -1;

      reason =
        'potential-decreased';
    }

    /*
     * Keep potential within realistic bounds and prevent it
     * from falling substantially below demonstrated ability.
     */
    const minimumPotential =
      Math.max(
        25,
        overall - 1
      );

    const potentialAfter =
      Math.max(
        minimumPotential,
        Math.min(
          99,
          potentialBefore +
          potentialChange
        )
      );

    const appliedChange =
      potentialAfter -
      potentialBefore;

    player.potential =
      potentialAfter;

    player.development.potential =
      potentialAfter;

    player.potentialRole =
      getPotentialRole(
        player.position,
        potentialAfter
      );

    player.development
      .potentialRole =
      player.potentialRole;

    /*
     * Potential Trend is visible to the player.
     * It reflects the direction of the current evaluation,
     * not a weekly performance streak.
     */
    const potentialTrend =
      appliedChange > 0
        ? 'rising'
        : appliedChange < 0
          ? 'falling'
          : (
              trajectory === 'breakout' ||
              trajectory === 'major-breakout'
            )
              ? 'rising'
              : (
                  trajectory ===
                    'underdevelopment' ||
                  trajectory ===
                    'major-underdevelopment'
                )
                  ? 'falling'
                  : 'stable';

    player.development
      .potentialTrend =
      potentialTrend;

    player.potentialTrend =
      potentialTrend;

    /*
     * Scout Confidence measures how certain evaluators are
     * that the CURRENT potential label is correct.
     *
     * Stable seasons reinforce confidence.
     * A changed or strongly trending evaluation creates new
     * uncertainty because scouts are reconsidering the player.
     */
    const confidenceBefore =
      Math.max(
        25,
        Math.min(
          100,
          Number(
            player.development
              .potentialConfidence ??
            player.potentialConfidence
          ) || 50
        )
      );

    let confidenceChange = 0;

    if (appliedChange !== 0) {
      /*
       * Potential movement means the previous evaluation was
       * incomplete, so confidence temporarily falls.
       */
      confidenceChange =
        Math.abs(appliedChange) >= 2
          ? -16
          : -10;
    } else if (
      potentialTrend === 'rising' ||
      potentialTrend === 'falling'
    ) {
      /*
       * Scouts see meaningful evidence, but have not changed
       * the official potential label yet.
       */
      confidenceChange = -4;
    } else {
      /*
       * Another stable season makes the current projection
       * more trustworthy. Older players stabilize faster.
       */
      confidenceChange =
        age <= 18
          ? 5
          : age <= 22
            ? 4
            : age <= 26
              ? 3
              : 2;
    }

    const potentialConfidence =
      Math.max(
        25,
        Math.min(
          100,
          confidenceBefore +
          confidenceChange
        )
      );

    player.development
      .potentialConfidence =
      potentialConfidence;

    player.potentialConfidence =
      potentialConfidence;

    if (appliedChange !== 0) {
      player.development
        .lastPotentialChangeSeason =
        seasonNumber;

      player.lastPotentialChangeSeason =
        seasonNumber;
    }

    const evaluationEntry = {
      id:
        `potential-evaluation-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'annual-potential-evaluation',

      date:
        _state.season?.currentDate ||
        _state.player?.currentDate ||
        null,

      seasonId:
        _state.season?.id ||
        null,

      seasonNumber,

      age,
      overall,

      potentialBefore,
      potentialAfter,

      change:
        appliedChange,

      roleBefore:
        getPotentialRole(
          player.position,
          potentialBefore
        ),

      roleAfter:
        player.potentialRole,

        trajectory,

        potentialTrend,

        confidenceBefore,

        confidenceAfter:
          potentialConfidence,

        confidenceChange,

        reason:
          appliedChange > 0
          ? 'potential-increased'
          : appliedChange < 0
            ? 'potential-decreased'
            : reason,

      factors: {
        recentTrajectories,
        positiveTrajectoryCount,
        negativeTrajectoryCount,
        majorBreakoutCount,
        majorUnderdevelopmentCount,
        talentGap,
        ageMobility,
        upwardScore:
          Number(
            upwardScore.toFixed(2)
          ),
        downwardScore:
          Number(
            downwardScore.toFixed(2)
          ),
        roll:
          Number(
            roll.toFixed(2)
          ),
      },
    };

    player.development
      .developmentHistory
      .push(
        evaluationEntry
      );

    return {
      success: true,

      changed:
        appliedChange !== 0,

      reason:
        evaluationEntry.reason,

      potentialBefore,
      potentialAfter,

      change:
        appliedChange,

      roleBefore:
        evaluationEntry.roleBefore,

      roleAfter:
        evaluationEntry.roleAfter,

      evaluationEntry,
    };
  }

  const ATTRIBUTE_DEVELOPMENT_PROFILES = {

    sniper: {
      shooting: 45,
      skating: 25,
      hockeyIQ: 15,
      passing: 10,
      physical: 5,
    },

    playmaker: {
      passing: 40,
      hockeyIQ: 30,
      skating: 20,
      shooting: 10,
      physical: 0,
    },

    powerForward: {
      physical: 35,
      shooting: 25,
      skating: 20,
      hockeyIQ: 10,
      passing: 10,
    },

    twoWayForward: {
      skating: 25,
      shooting: 20,
      passing: 20,
      defense: 20,
      hockeyIQ: 15,
    },

    offensiveDefenseman: {
      skating: 30,
      passing: 25,
      hockeyIQ: 20,
      shooting: 15,
      defense: 10,
    },

    defensiveDefenseman: {
      defense: 40,
      physical: 25,
      hockeyIQ: 20,
      skating: 15,
    },

    twoWayDefenseman: {
      defense: 30,
      skating: 25,
      passing: 20,
      hockeyIQ: 15,
      physical: 10,
    },

    hybridGoalie: {
      goalie: 100,
    }

  };

  const DEVELOPMENT_PERSONALITY_PROFILES = {
    balanced: {
      label: 'Balanced',
      weeklyXPModifier: 1.00,

      categoryWeights: {},

      ageStageModifiers: {},
      performanceSensitivity: 0,
    },

    gymRat: {
      label: 'Gym Rat',
      weeklyXPModifier: 1.05,

      categoryWeights: {
        physical: 12,
        skating: 7,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },

    naturalScorer: {
      label: 'Natural Scorer',
      weeklyXPModifier: 1.02,

      categoryWeights: {
        shooting: 15,
        hockeyIQ: 4,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0.04,
    },

    filmJunkie: {
      label: 'Film Junkie',
      weeklyXPModifier: 1.03,

      categoryWeights: {
        hockeyIQ: 16,
        defense: 6,
        passing: 4,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },

    highMotor: {
      label: 'High Motor',
      weeklyXPModifier: 1.06,

      categoryWeights: {
        skating: 8,
        defense: 6,
        physical: 5,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0.02,
    },

    smoothSkater: {
      label: 'Smooth Skater',
      weeklyXPModifier: 1.02,

      categoryWeights: {
        skating: 18,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },

    lateBloomer: {
      label: 'Late Bloomer',
      weeklyXPModifier: 0.96,

      categoryWeights: {},

      ageStageModifiers: {
        'rapid-growth': 0.82,
        development: 0.94,
        'late-development': 1.22,
        prime: 1.18,
        regression: 1.00,
      },

      performanceSensitivity: 0,
    },

    fastLearner: {
      label: 'Fast Learner',
      weeklyXPModifier: 1.10,

      categoryWeights: {},

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },

    rawAthlete: {
      label: 'Raw Athlete',
      weeklyXPModifier: 1.03,

      categoryWeights: {
        skating: 12,
        physical: 12,
        hockeyIQ: -8,
        passing: -4,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },

    confidencePlayer: {
      label: 'Confidence Player',
      weeklyXPModifier: 1.00,

      categoryWeights: {},

      ageStageModifiers: {},

      /*
       * Strong or weak recent performance will matter more
       * for this player than for other personalities.
       */
      performanceSensitivity: 0.14,
    },

    defensiveSpecialist: {
      label: 'Defensive Specialist',
      weeklyXPModifier: 1.01,

      categoryWeights: {
        defense: 18,
        hockeyIQ: 7,
        physical: 4,
        shooting: -5,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },

    teamFirst: {
      label: 'Team-First',
      weeklyXPModifier: 1.02,

      categoryWeights: {
        passing: 8,
        defense: 7,
        hockeyIQ: 6,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0.02,
    },

    perfectionist: {
      label: 'Perfectionist',
      weeklyXPModifier: 1.04,

      categoryWeights: {
        hockeyIQ: 7,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0.06,
    },

    goalieTechnician: {
      label: 'Goalie Technician',
      weeklyXPModifier: 1.04,

      categoryWeights: {
        goalie: 20,
      },

      ageStageModifiers: {},

      performanceSensitivity: 0,
    },
  };

  const ATTRIBUTE_DEVELOPMENT_CATEGORY_WEIGHTS = {
    shooting: {
      wristShotPower: 24,
      wristShotAccuracy: 28,
      slapShotPower: 18,
      slapShotAccuracy: 18,
      offensiveAwareness: 7,
      handEye: 5,
    },

    passing: {
      passing: 36,
      puckControl: 22,
      deking: 14,
      handEye: 8,
      offensiveAwareness: 20,
    },

    skating: {
      speed: 24,
      acceleration: 23,
      agility: 21,
      balance: 17,
      endurance: 15,
    },

    defense: {
      defensiveAwareness: 30,
      stickChecking: 27,
      shotBlocking: 20,
      discipline: 10,
      bodyChecking: 8,
      poise: 5,
    },

    physical: {
      strength: 30,
      bodyChecking: 25,
      balance: 18,
      durability: 17,
      endurance: 10,
    },

    hockeyIQ: {
      offensiveAwareness: 24,
      defensiveAwareness: 24,
      poise: 20,
      discipline: 15,
      passing: 10,
      handEye: 7,
    },

    goalie: {
      positioning: 11,
      reflexes: 10,
      puckTracking: 9,
      reboundControl: 9,
      angles: 8,

      lateralMovement: 8,
      agility: 6,
      recoverySpeed: 6,

      gloveHigh: 4,
      gloveLow: 4,
      blockerHigh: 4,
      blockerLow: 4,
      fiveHole: 5,
      stickControl: 3,

      anticipation: 5,
      composure: 4,
      consistency: 2,

      puckHandling: 1,
      goaliePassing: 1,
    },
  };

  const DEVELOPMENT_PROFILE_CATEGORIES = [
    'shooting',
    'passing',
    'skating',
    'defense',
    'physical',
    'hockeyIQ',
    'goalie',
  ];

  function normalizeDevelopmentProfileKey(
    archetype = ''
  ) {
    const normalized =
      String(archetype)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, char) =>
          char.toUpperCase()
        );

    const aliases = {
      sniper: 'sniper',
      playmaker: 'playmaker',
      powerForward: 'powerForward',
      twoWayForward: 'twoWayForward',
      offensiveDefenseman:
        'offensiveDefenseman',
      defensiveDefenseman:
        'defensiveDefenseman',
      twoWayDefenseman:
        'twoWayDefenseman',
      hybridGoalie: 'hybridGoalie',
      butterflyGoalie: 'hybridGoalie',
      athleticGoalie: 'hybridGoalie',
    };

    return aliases[normalized] ||
      (
        normalizeAttributePosition(
          archetype
        ) === 'G'
          ? 'hybridGoalie'
          : null
      );
  }

  function createPlayerDevelopmentProfile(
    player = {}
  ) {
    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const profileKey =
      normalizeDevelopmentProfileKey(
        player.archetype
      ) ||
      (
        isGoalie
          ? 'hybridGoalie'
          : 'twoWayForward'
      );

    const baseProfile = {
      ...(
        ATTRIBUTE_DEVELOPMENT_PROFILES[
          profileKey
        ] || {}
      ),
    };

    const developmentSeed =
      Math.max(
        0,
        Math.min(
          1,
          Number(
            player.development
              ?.developmentSeed ??
            player.developmentSeed
          ) || Math.random()
        )
      );

    /*
     * Stable per-player variation.
     * This is generated once and then saved permanently.
     */
    const profile = {};

    DEVELOPMENT_PROFILE_CATEGORIES
      .forEach((category, index) => {
        const baseWeight =
          Math.max(
            0,
            Number(
              baseProfile[category]
            ) || 0
          );

        if (
          baseWeight <= 0 &&
          !isGoalie
        ) {
          profile[category] = 0;
          return;
        }

        if (
          isGoalie &&
          category !== 'goalie'
        ) {
          profile[category] = 0;
          return;
        }

        const variationSeed =
          (
            developmentSeed * 997 +
            index * 0.173
          ) % 1;

        const variation =
          0.88 +
          variationSeed * 0.24;

        profile[category] =
          Math.max(
            0,
            baseWeight * variation
          );
      });

    /*
     * Normalize the profile so all active categories total 100.
     */
    const totalWeight =
      Object.values(profile)
        .reduce(
          (sum, value) =>
            sum + Math.max(
              0,
              Number(value) || 0
            ),
          0
        );

    if (totalWeight <= 0) {
      if (isGoalie) {
        return {
          goalie: 100,
        };
      }

      return {
        shooting: 20,
        passing: 20,
        skating: 20,
        defense: 15,
        physical: 10,
        hockeyIQ: 15,
        goalie: 0,
      };
    }

    const normalizedProfile = {};

    DEVELOPMENT_PROFILE_CATEGORIES
      .forEach(category => {
        normalizedProfile[category] =
          Number(
            (
              (
                Number(
                  profile[category]
                ) || 0
              ) /
              totalWeight *
              100
            ).toFixed(2)
          );
      });

    return normalizedProfile;
  }

  const DEVELOPMENT_PERSONALITY_WEIGHTS = [
    {
      key: 'balanced',
      weight: 24,
    },
    {
      key: 'gymRat',
      weight: 12,
    },
    {
      key: 'filmJunkie',
      weight: 10,
    },
    {
      key: 'highMotor',
      weight: 10,
    },
    {
      key: 'confidencePlayer',
      weight: 8,
    },
    {
      key: 'fastLearner',
      weight: 8,
    },
    {
      key: 'smoothSkater',
      weight: 7,
    },
    {
      key: 'teamFirst',
      weight: 6,
    },
    {
      key: 'naturalScorer',
      weight: 5,
    },
    {
      key: 'perfectionist',
      weight: 4,
    },
    {
      key: 'rawAthlete',
      weight: 3,
    },
    {
      key: 'defensiveSpecialist',
      weight: 2,
    },
    {
      key: 'lateBloomer',
      weight: 1,
    },
  ];

  function selectDevelopmentPersonality(
    player = {}
  ) {
    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const weightedOptions = [
      ...DEVELOPMENT_PERSONALITY_WEIGHTS,
    ];

    /*
     * Goalies receive access to a goalie-specific
     * developmental tendency without making it universal.
     */
    if (isGoalie) {
      weightedOptions.push({
        key: 'goalieTechnician',
        weight: 10,
      });
    }

    const totalWeight =
      weightedOptions.reduce(
        (sum, option) =>
          sum +
          Math.max(
            0,
            Number(option.weight) || 0
          ),
        0
      );

    if (totalWeight <= 0) {
      return 'balanced';
    }

    let roll =
      Math.random() *
      totalWeight;

    for (
      const option of weightedOptions
    ) {
      roll -=
        Math.max(
          0,
          Number(option.weight) || 0
        );

      if (roll <= 0) {
        return option.key;
      }
    }

    return 'balanced';
  }

  function createPlayerDevelopmentDNA(
    player = {}
  ) {
    const developmentProfile =
      createPlayerDevelopmentProfile(
        player
      );

    const personalityKey =
      selectDevelopmentPersonality(
        player
      );

    const personalityProfile =
      DEVELOPMENT_PERSONALITY_PROFILES[
        personalityKey
      ] ||
      DEVELOPMENT_PERSONALITY_PROFILES
        .balanced;

    
    return {
      version: 'development-dna-v1',

      /*
       * Visible archetype when the player was generated.
       * This never changes.
       */
      originalArchetype:
        player.archetype || null,

      /*
       * Permanent natural development tendencies.
       * These never change after generation.
       */
      originalProfile: {
        ...developmentProfile,
      },

      /*
       * Current profile used by the Development Engine.
       * Starts identical to the original profile.
       */
      profile: {
        ...developmentProfile,
      },

      personality:
        personalityKey,

      personalityLabel:
        personalityProfile.label ||
        'Balanced',

      seed:
        Math.max(
          0,
          Math.min(
            1,
            Number(
              player.development
                ?.developmentSeed ??
              player.developmentSeed
            ) || Math.random()
          )
        ),

      createdAt:
        _state.season?.currentDate ||
        _state.player?.currentDate ||
        null,
    };
  }

  function getAttributeUpgradeCost(
    player = {},
    attributeKey
  ) {
    if (
      !player ||
      typeof player !== 'object' ||
      typeof attributeKey !== 'string'
    ) {
      return null;
    }

    ensureCanonicalPlayerContract(
      player
    );

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const validAttributeKeys =
      isGoalie
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    if (
      !validAttributeKeys.includes(
        attributeKey
      )
    ) {
      return null;
    }

    const currentRating =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.attributes?.[
              attributeKey
            ]
          ) || 50
        )
      );

    /*
     * Core rating-based progression curve.
     *
     * Raw attributes improve relatively quickly.
     * As a skill becomes stronger, each additional point
     * requires substantially more development XP.
     */
    let baseCost;

    if (currentRating < 60) {
      baseCost = 35;
    } else if (currentRating < 70) {
      baseCost = 50;
    } else if (currentRating < 75) {
      baseCost = 70;
    } else if (currentRating < 80) {
      baseCost = 95;
    } else if (currentRating < 85) {
      baseCost = 130;
    } else if (currentRating < 90) {
      baseCost = 180;
    } else if (currentRating < 95) {
      baseCost = 260;
    } else if (currentRating < 98) {
      baseCost = 400;
    } else {
      baseCost = 700;
    }

    const priorUpgradeCount =
      Math.max(
        0,
        Number(
          player.development
            ?.attributeUpgradeCounts
            ?.[attributeKey]
        ) || 0
      );

    /*
     * Repeated investment in one attribute becomes
     * progressively less efficient. The penalty is capped
     * so specialization remains possible.
     */
    const repeatedUpgradeMultiplier =
      1 +
      Math.min(
        0.25,
        priorUpgradeCount * 0.02
      );

    const potentialMultiplier =
      getPotentialDevelopmentMultiplier(
        player
      );

    const ageMultiplier =
      getAgeDevelopmentMultiplier(
        player
      );

    const calculatedCost =
      Math.round(
        baseCost *
        repeatedUpgradeMultiplier *
        potentialMultiplier *
        ageMultiplier
      );

    return Math.max(
      25,
      calculatedCost
    );
  }

  function canUpgradePlayerAttribute(
    player = {},
    attributeKey
  ) {
    if (
      !player ||
      typeof player !== 'object' ||
      typeof attributeKey !== 'string'
    ) {
      return {
        canUpgrade: false,
        reason: 'invalid-request',
        attributeKey,
        currentRating: null,
        currentXP: 0,
        requiredXP: null,
        xpNeeded: null,
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    const validAttributeKeys =
      isGoalie
        ? GOALIE_ATTRIBUTE_KEYS
        : PLAYER_ATTRIBUTE_KEYS;

    if (
      !validAttributeKeys.includes(
        attributeKey
      )
    ) {
      return {
        canUpgrade: false,
        reason: 'invalid-attribute',
        attributeKey,
        currentRating: null,
        currentXP: 0,
        requiredXP: null,
        xpNeeded: null,
      };
    }

    const currentRating =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.attributes?.[
              attributeKey
            ]
          ) || 50
        )
      );

    const currentXP =
      Math.max(
        0,
        Number(
          player.development
            ?.attributeXP
            ?.[attributeKey]
        ) || 0
      );

    if (currentRating >= 99) {
      return {
        canUpgrade: false,
        reason: 'attribute-capped',
        attributeKey,
        currentRating,
        currentXP,
        requiredXP: null,
        xpNeeded: 0,
      };
    }

    const requiredXP =
      getAttributeUpgradeCost(
        player,
        attributeKey
      );

    if (
      !Number.isFinite(requiredXP)
    ) {
      return {
        canUpgrade: false,
        reason: 'cost-unavailable',
        attributeKey,
        currentRating,
        currentXP,
        requiredXP: null,
        xpNeeded: null,
      };
    }

    const canUpgrade =
      currentXP >= requiredXP;

    return {
      canUpgrade,

      reason:
        canUpgrade
          ? 'upgrade-available'
          : 'insufficient-xp',

      attributeKey,

      currentRating,
      currentXP,
      requiredXP,

      xpNeeded:
        canUpgrade
          ? 0
          : Math.max(
              0,
              requiredXP - currentXP
            ),

      overflowXP:
        canUpgrade
          ? Math.max(
              0,
              currentXP - requiredXP
            )
          : 0,
    };
  }

  function upgradePlayerAttribute(
    player = {},
    attributeKey,
    options = {}
  ) {
    const eligibility =
      canUpgradePlayerAttribute(
        player,
        attributeKey
      );

    if (!eligibility.canUpgrade) {
      return {
        success: false,

        attributeKey,

        reason:
          eligibility.reason,

        previousRating:
          eligibility.currentRating,

        newRating:
          eligibility.currentRating,

        xpSpent: 0,

        remainingXP:
          eligibility.currentXP,

        nextRequiredXP:
          eligibility.requiredXP,

        overallBefore:
          Number(player.overall) || 0,

        overallAfter:
          Number(player.overall) || 0,
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    const previousRating =
      eligibility.currentRating;

    const requiredXP =
      eligibility.requiredXP;

    const currentXP =
      eligibility.currentXP;

    const remainingXP =
      Math.max(
        0,
        currentXP - requiredXP
      );

    const overallBefore =
      Number(player.overall) || 0;

    /*
     * Increase exactly one individual attribute.
     */
    player.attributes[
      attributeKey
    ] =
      clampAttribute(
        previousRating + 1
      );

    /*
     * Spend only the required XP.
     * Any overflow remains available toward the
     * next upgrade threshold.
     */
    player.development
      .attributeXP[
        attributeKey
      ] =
      remainingXP;

    /*
     * Track how many times this specific attribute
     * has been manually upgraded.
     */
    const previousUpgradeCount =
      Math.max(
        0,
        Number(
          player.development
            .attributeUpgradeCounts[
              attributeKey
            ]
        ) || 0
      );

    player.development
      .attributeUpgradeCounts[
        attributeKey
      ] =
      previousUpgradeCount + 1;

    /*
     * Track this season's net growth by attribute.
     */
    player.development
      .seasonAttributeGrowth[
        attributeKey
      ] =
      Math.max(
        0,
        Number(
          player.development
            .seasonAttributeGrowth[
              attributeKey
            ]
        ) || 0
      ) + 1;

    const isGoalie =
      normalizeAttributePosition(
        player.position
      ) === 'G';

    /*
     * Overall is always derived from attributes.
     * It is never upgraded directly.
     */
    player.overall =
      isGoalie
        ? calculateGoalieOverallFromAttributes(
            player.attributes
          )
        : calculateOverallFromAttributes(
            player.attributes,
            player.position
          );

    enforceHighSchoolOverallCap(
      player
    );

    const overallAfter =
      Number(player.overall) || 0;

    const developmentEntry = {
      id:
        `development-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'attribute-upgrade',

      date:
        _state.season?.currentDate ||
        _state.player?.currentDate ||
        null,

      seasonId:
        _state.season?.id ||
        null,

      seasonNumber:
        Number(
          _state.season
            ?.seasonNumber
        ) || 1,

      attributeKey,

      previousRating,

      newRating:
        player.attributes[
          attributeKey
        ],

      xpSpent:
        requiredXP,

      remainingXP,

      overallBefore,

      overallAfter,
    };

    player.development
      .developmentHistory
      .push(
        developmentEntry
      );

    /*
     * Keep an easy-to-read career accomplishment record
     * only when the upgrade changes overall.
     */
    if (
      overallAfter >
      overallBefore
    ) {
      player.accomplishments.push({
        id:
          `overall-growth-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'overall-increase',

        date:
          developmentEntry.date,

        seasonId:
          developmentEntry.seasonId,

        previousOverall:
          overallBefore,

        newOverall:
          overallAfter,

        source:
          'attribute-upgrade',
      });
    }

    const nextRequiredXP =
      getAttributeUpgradeCost(
        player,
        attributeKey
      );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,

      attributeKey,

      reason:
        'attribute-upgraded',

      previousRating,

      newRating:
        player.attributes[
          attributeKey
        ],

      xpSpent:
        requiredXP,

      remainingXP,

      nextRequiredXP,

      overallBefore,

      overallAfter,

      overallIncreased:
        overallAfter >
        overallBefore,

      developmentEntry,
    };
  }

  /*
   * ============================================================
   * LIVE GAME SIMULATION STATE
   * ============================================================
   *
   * This is the authoritative in-progress representation of one
   * hockey game.
   *
   * The live simulator will mutate this object as the clock runs.
   * When the game ends, this state will be converted into the same
   * permanent gameResult contract already consumed by Project Ice's
   * standings, statistics, Postgame Summary, and Development Engine.
   *
   * Nothing permanent should be applied while this object is live.
   */
  function createLiveGameSimulationState(
    scheduledGame
  ) {
    if (
      !scheduledGame ||
      typeof scheduledGame !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-scheduled-game',
        simulation: null,
      };
    }

    const gameId =
      scheduledGame.gameId ||
      scheduledGame.eventId ||
      scheduledGame.id ||
      null;

    const homeTeamId =
      scheduledGame.homeTeamId ||
      null;

    const awayTeamId =
      scheduledGame.awayTeamId ||
      null;

    if (
      !gameId ||
      !homeTeamId ||
      !awayTeamId
    ) {
      return {
        success: false,
        reason:
          'scheduled-game-missing-teams',
        simulation: null,
      };
    }

    const homeTeam =
      getTeamById(
        homeTeamId
      );

    const awayTeam =
      getTeamById(
        awayTeamId
      );

    if (
      !homeTeam ||
      !awayTeam
    ) {
      return {
        success: false,
        reason:
          'live-game-team-not-found',
        simulation: null,
      };
    }

    const createTeamState =
      team => {
        const roster =
          Array.isArray(team.roster)
            ? team.roster
            : [];

        const activeSkaters =
          roster
            .filter(player => {
              const normalizedPosition =
                normalizeAttributePosition(
                  player.position
                );

              if (normalizedPosition === 'G') {
                return false;
              }

              return (
                player.lineupStatus ===
                  'active' ||
                Boolean(
                  player.lineupAssignment
                )
              );
            })
            .map(player => ({
              playerId:
                player.playerId ||
                player.id ||
                null,

              isCareerPlayer:
                player.isCareerPlayer ===
                true,

              firstName:
                player.firstName ||
                '',

              lastName:
                player.lastName ||
                '',

              position:
                player.position ||
                '',

              rosterSlot:
                player.rosterSlot ||
                player.slot ||
                null,

              lineupAssignment:
                player.lineupAssignment
                  ? structuredClone(
                      player.lineupAssignment
                    )
                  : null,

              overall:
                Number(
                  player.overall
                ) || 50,

              dressed: true,

              goals: 0,
              assists: 0,
              points: 0,

              shots: 0,
              hits: 0,
              blockedShots: 0,
              takeaways: 0,
              giveaways: 0,

              plusMinus: 0,

              penaltyMinutes: 0,

              powerPlayGoals: 0,
              powerPlayPoints: 0,
              shorthandedGoals: 0,
              gameWinningGoals: 0,

              timeOnIceSeconds: 0,

              firstStar: false,
              secondStar: false,
              thirdStar: false,
            }));

        const goalies =
          roster
            .filter(player =>
              normalizeAttributePosition(
                player.position
              ) === 'G'
            )
            .sort((firstGoalie, secondGoalie) => {
              const firstIsStarter =
                (
                  firstGoalie.rosterSlot ||
                  firstGoalie.slot
                ) === 'g-starter';

              const secondIsStarter =
                (
                  secondGoalie.rosterSlot ||
                  secondGoalie.slot
                ) === 'g-starter';

              if (
                firstIsStarter !==
                secondIsStarter
              ) {
                return firstIsStarter
                  ? -1
                  : 1;
              }

              return (
                Number(
                  secondGoalie.overall
                ) || 0
              ) -
              (
                Number(
                  firstGoalie.overall
                ) || 0
              );
            })
            .map((player, index) => ({
              playerId:
                player.playerId ||
                player.id ||
                null,

              firstName:
                player.firstName ||
                '',

              lastName:
                player.lastName ||
                '',

              position: 'G',

              rosterSlot:
                player.rosterSlot ||
                player.slot ||
                null,

              overall:
                Number(
                  player.overall
                ) || 50,

              started:
                index === 0,

              gamesPlayed:
                index === 0
                  ? 1
                  : 0,

              wins: 0,
              losses: 0,
              overtimeLosses: 0,

              shotsAgainst: 0,
              saves: 0,
              goalsAgainst: 0,

              minutesPlayed:
                index === 0
                  ? 60
                  : 0,

              shutout: false,
            }));

        return {
          teamId:
            team.teamId,

          schoolName:
            team.schoolName ||
            '',

          teamName:
            team.teamName ||
            '',

          abbreviation:
            team.abbreviation ||
            '',

          score: 0,

          shots: 0,

          hits: 0,

          blockedShots: 0,

          giveaways: 0,

          takeaways: 0,

          penaltyMinutes: 0,

          powerPlayOpportunities: 0,

          powerPlayGoals: 0,

          faceoffWins: 0,

          careerPlayer:
            activeSkaters.find(
              player =>
                player
                  ?.isCareerPlayer ===
                true
            ) ||
            null,

          skaters:
            activeSkaters,

          goalies,
        };
      };

    const simulation = {
      simulationVersion:
        'live-game-v1',

      gameId,

      eventId:
        gameId,

      date:
        scheduledGame.date ||
        null,

      status:
        'pregame',

      /*
       * Three regulation periods of 20:00.
       * The clock is stored as remaining seconds so presentation
       * speed never changes the underlying hockey simulation.
       */
      period: 1,

      periodLabel:
        '1st',

      clockSecondsRemaining:
        20 * 60,

      regulationComplete:
        false,

      overtime:
        false,

      shootout:
        false,

      gameComplete:
        false,

      homeTeamId,

      awayTeamId,

      home:
        createTeamState(
          homeTeam
        ),

      away:
        createTeamState(
          awayTeam
        ),

      /*
       * Chronological event history.
       *
       * Future entries will include:
       * shot
       * goal
       * save
       * hit
       * block
       * penalty
       * faceoff
       * takeaway
       * giveaway
       * period-start
       * period-end
       * interactive-moment
       */
      events: [],

      /*
       * Scoring events are also kept separately because the
       * existing Postgame Summary already expects a permanent
       * scoring-summary style representation.
       */
      scoringEvents: [],

      penalties: [],

      /*
       * ========================================================
       * SPECIAL TEAMS STATE
       * ========================================================
       *
       * Tracks active penalties and determines whether play is
       * even-strength, power-play, or penalty-kill.
       */
      specialTeams: {
        situation:
          'even-strength',

        powerPlaySide:
          null,

        penaltyKillSide:
          null,

        homeSkaters:
          5,

        awaySkaters:
          5,

        activePenalties: [],
      },

      /*
       * ========================================================
       * LIVE GAME FLOW STATE
       * ========================================================
       *
       * Tracks the hockey context between events.
       *
       * Events should not exist as unrelated random rolls.
       * A takeaway can create transition offense, a saved shot
       * can create a rebound, a whistle resets play, etc.
       */
      flow: {
        /*
         * Team currently controlling the puck.
         *
         * null = no established possession, such as before
         * the opening faceoff or immediately after a whistle.
         */
        possessionSide: null,

        /*
         * Where the puck currently is from the perspective of
         * the team with possession.
         *
         * neutral
         * offensive
         * defensive
         */
        zone: 'neutral',

        /*
         * Used by the event-time scheduler for realistic clusters.
         *
         * normal
         * transition
         * offensive-zone
         * rebound
         * scramble
         * after-faceoff
         * quiet
         */
        paceContext:
          'after-faceoff',

        /*
         * Whether play is currently stopped.
         *
         * Goals, penalties, goalie freezes, icing, offsides, etc.
         * will eventually set this true until the next faceoff.
         */
        stopped: true,

        stoppageReason:
          'period-start',

        /*
         * Keeps event generation aware of the immediately
         * preceding action.
         */
        lastEventType: null,

        lastEventSide: null,

        /*
         * Consecutive attacking pressure matters.
         *
         * Sustained zone time can increase the chance of another
         * shot without guaranteeing one.
         */
        pressureLevel: 0,

        /*
         * The selected even-strength deployment remains on the
         * ice for a stretch of play rather than rerolling all five
         * skaters every few seconds.
         */
        homeDeployment: null,

        awayDeployment: null,

        deploymentAgeSeconds: 0,

        /*
         * Tracks the most recent actual puck touches during the
         * current uninterrupted team possession.
         *
         * Goal assist attribution will read from this history rather
         * than randomly selecting teammates.
         */
        recentPossessionTouches: [],
      },

      /*
       * Career-player interaction state.
       *
       * This is where future Be-A-Pro moments can pause the
       * simulation for decisions such as Shoot / Pass.
       */
      interactiveMoment: null,

      interactiveMomentsCompleted: [],

      /*
       * Presentation speed is UI state only.
       * The simulator itself works in hockey-time increments.
       */
      presentation: {
        speed: 1,

        paused: false,
      },

      /*
       * These make the finalization step explicit.
       * The live state must only become permanent once.
       */
      finalized: false,

      finalizedGameResult: null,
    };

    return {
      success: true,

      reason:
        'live-game-state-created',

      simulation,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — ON-ICE DEPLOYMENT
   * ============================================================
   *
   * Returns the players currently deployed for one team.
   *
   * Supported situations:
   * - even-strength
   * - power-play
   * - penalty-kill
   *
   * No statistics are changed here. This function only resolves
   * which real players are eligible to participate in the next
   * live-game event.
   */
  function getLiveGameOnIcePlayers(
    simulation,
    side,
    options = {}
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        players: [],
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : side === 'away'
          ? simulation.away
          : null;

    if (!teamState) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        players: [],
      };
    }

    const canonicalTeam =
      getTeamById(
        teamState.teamId
      );

    if (!canonicalTeam) {
      return {
        success: false,
        reason:
          'live-game-team-not-found',
        players: [],
      };
    }

    const allSkaters =
      Array.isArray(
        teamState.skaters
      )
        ? teamState.skaters
        : [];

    /*
     * ==========================================================
     * PENALTY-BOX EXCLUSION
     * ==========================================================
     *
     * Any player currently serving an active penalty is ineligible
     * for every on-ice deployment until that penalty expires.
     *
     * This applies automatically to:
     *   even strength
     *   reduced even strength
     *   power play
     *   penalty kill
     *   overtime
     */
    const activePenaltyPlayerIds =
      new Set(
        (
          Array.isArray(
            simulation.specialTeams
              ?.activePenalties
          )
            ? simulation.specialTeams
                .activePenalties
            : []
        )
          .filter(
            penalty =>
              penalty &&
              penalty.active === true &&
              Number(
                penalty.secondsRemaining
              ) > 0 &&
              penalty.playerId
          )
          .map(
            penalty =>
              String(
                penalty.playerId
              )
          )
      );

    const skaters =
      allSkaters.filter(
        player =>
          !activePenaltyPlayerIds.has(
            String(
              player.playerId || ''
            )
          )
      );

    const starter =
      Array.isArray(
        teamState.goalies
      )
        ? (
            teamState.goalies.find(
              goalie =>
                goalie.started === true
            ) ||
            teamState.goalies[0] ||
            null
          )
        : null;

    const situation =
      options.situation ||
      'even-strength';

    const forwardLine =
      Math.max(
        1,
        Math.min(
          4,
          Number(
            options.forwardLine
          ) || 1
        )
      );

    const defensePair =
      Math.max(
        1,
        Math.min(
          3,
          Number(
            options.defensePair
          ) || 1
        )
      );

      const specialTeamsUnit =
        Math.max(
          1,
          Math.min(
            2,
            Number(
              options.specialTeamsUnit
            ) || 1
          )
        );

      /*
       * Optional manpower target.
       *
       * Normal calls can omit this completely.
       * Special-teams deployment can request:
       *
       * PP:
       *   5 skaters
       *   4 skaters for 4-on-3 OT
       *
       * PK:
       *   4 skaters
       *   3 skaters for 5-on-3 / 4-on-3
       */
      const requestedSkaterCount =
        Number.isFinite(
          Number(
            options.skaterCount
          )
        )
          ? Math.max(
              3,
              Math.min(
                5,
                Number(
                  options.skaterCount
                )
              )
            )
          : null;

      const findSkaterById =
      playerId =>
        skaters.find(player =>
          String(
            player.playerId || ''
          ) ===
          String(playerId || '')
        ) ||
        null;

    let deployedSkaters = [];

    /*
     * ==========================================================
     * EVEN STRENGTH
     * ==========================================================
     *
     * 3 forwards + 2 defensemen.
     */
    if (
      situation ===
      'even-strength'
    ) {
      const forwards =
        skaters.filter(player =>
          player.lineupAssignment
            ?.unit === 'forward' &&
          Number(
            player.lineupAssignment
              ?.line
          ) === forwardLine
        );

      const defensemen =
        skaters.filter(player =>
          player.lineupAssignment
            ?.unit === 'defense' &&
          Number(
            player.lineupAssignment
              ?.pair
          ) === defensePair
        );

      /*
       * Normal even strength:
       *   5 skaters = 3F + 2D
       *
       * Reduced even strength from overlapping penalties:
       *   4 skaters = 2F + 2D
       *   3 skaters = 2F + 1D
       *
       * For reduced situations, favor the stronger players from the
       * forward line / defense pair already selected for this shift.
       */
      const sortedForwards =
        [...forwards]
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              (
                Number(
                  secondPlayer.overall
                ) || 50
              ) -
              (
                Number(
                  firstPlayer.overall
                ) || 50
              )
          );

      const sortedDefensemen =
        [...defensemen]
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              (
                Number(
                  secondPlayer.overall
                ) || 50
              ) -
              (
                Number(
                  firstPlayer.overall
                ) || 50
              )
          );

      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters = [
          ...sortedForwards.slice(
            0,
            2
          ),
          ...sortedDefensemen.slice(
            0,
            2
          ),
        ];
      } else if (
        requestedSkaterCount === 3
      ) {
        deployedSkaters = [
          ...sortedForwards.slice(
            0,
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      const fullPowerPlayUnit =
        [
          slots.leftFlank,
          slots.bumper,
          slots.rightFlank,
          slots.netFront,
          slots.quarterback,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * 4-on-3:
       * keep three primary skill forwards plus the quarterback.
       *
       * Full 5-on-4 / 5-on-3:
       * use the complete PP unit.
       */
      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.rightFlank,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else if (
        requestedSkaterCount === 3
      ) {
        /*
         * Defensive fallback only; normal PP rules should not request
         * three attacking skaters.
         */
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPowerPlayUnit;
      }
    }

    /*
     * ==========================================================
     * PENALTY KILL
     * ==========================================================
     *
     * Uses the exact coach-selected PK1 / PK2 unit.
     */
    if (
      situation ===
      'penalty-kill'
    ) {
      const penaltyKillUnit =
        canonicalTeam
          .specialTeams
          ?.penaltyKill
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        penaltyKillUnit?.slots ||
        {};

      const fullPenaltyKillUnit =
        [
          slots.forward1,
          slots.forward2,
          slots.defense1,
          slots.defense2,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * Three-man PK:
       * one forward + two defensemen.
       *
       * This is used for both:
       *   regulation 5-on-3
       *   overtime 4-on-3 / 5-on-3
       */
      if (
        requestedSkaterCount === 3
      ) {
        deployedSkaters =
          [
            slots.forward1,
            slots.defense1,
            slots.defense2,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPenaltyKillUnit;
      }
    }

    /*
     * ==========================================================
     * ELIGIBLE DEPLOYMENT FALLBACK
     * ==========================================================
     *
     * A saved line or special-teams unit can contain a player who
     * is currently serving a penalty.
     *
     * Keep every eligible player from the coach-selected unit, then
     * fill only the missing spots from the best eligible remaining
     * skaters.
     *
     * This prevents situations such as a three-man PK accidentally
     * deploying only two players because one PK1 member is in the
     * penalty box.
     */
    const targetSkaterCount =
      requestedSkaterCount !== null
        ? requestedSkaterCount
        : (
            situation ===
              'penalty-kill'
              ? 4
              : 5
          );

    const deployedPlayerIds =
      new Set(
        deployedSkaters
          .filter(Boolean)
          .map(
            player =>
              String(
                player.playerId
              )
          )
      );

    if (
      deployedSkaters.length <
      targetSkaterCount
    ) {
      const fallbackCandidates =
        skaters
          .filter(
            player =>
              player &&
              !deployedPlayerIds.has(
                String(
                  player.playerId
                )
              )
          )
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              (
                Number(
                  secondPlayer.overall
                ) || 50
              ) -
              (
                Number(
                  firstPlayer.overall
                ) || 50
              )
          );

      const missingSkaters =
        targetSkaterCount -
        deployedSkaters.length;

      const replacements =
        fallbackCandidates.slice(
          0,
          missingSkaters
        );

      deployedSkaters.push(
        ...replacements
      );

      replacements.forEach(
        player => {
          deployedPlayerIds.add(
            String(
              player.playerId
            )
          );
        }
      );
    }

    /*
     * Remove accidental duplicate player IDs.
     */
    const uniquePlayers = [];

    const usedPlayerIds =
      new Set();

    deployedSkaters.forEach(
      player => {
        const playerId =
          String(
            player.playerId ||
            ''
          );

        if (
          !playerId ||
          usedPlayerIds.has(
            playerId
          )
        ) {
          return;
        }

        usedPlayerIds.add(
          playerId
        );

        uniquePlayers.push(
          player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STRENGTH DEPLOYMENT ROTATION
   * ============================================================
   *
   * Selects a forward line and defense pair for the next stretch
   * of even-strength play.
   *
   * The weights approximate normal hockey usage without giving
   * the career player any artificial preference.
   */
  function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason: 'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason: 'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * These remain the role-based even-strength usage targets.
     * Instead of independently rerolling every shift, selection now
     * balances each line/pair back toward its target share. This keeps
     * realistic game-to-game variation without producing wild TOI swings.
     */
    const forwardLineWeights = [
      { line: 1, weight: 34 },
      { line: 2, weight: 28 },
      { line: 3, weight: 22 },
      { line: 4, weight: 16 },
    ];

    const defensePairWeights = [
      { pair: 1, weight: 42 },
      { pair: 2, weight: 34 },
      { pair: 3, weight: 24 },
    ];

    if (!simulation.flow.deploymentUsage) {
      simulation.flow.deploymentUsage = {
        home: {
          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },
          defensePairs: { 1: 0, 2: 0, 3: 0 },
          evenStrengthSeconds: 0,
        },
        away: {
          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },
          defensePairs: { 1: 0, 2: 0, 3: 0 },
          evenStrengthSeconds: 0,
        },
      };
    }

    const usage =
      simulation.flow.deploymentUsage[side];

    const getElapsedRegulationSeconds = () => {
      const period =
        Math.max(
          1,
          Number(simulation.period) || 1
        );

      const completedPeriods =
        Math.max(
          0,
          Math.min(2, period - 1)
        );

      const currentPeriodElapsed =
        period <= 3
          ? Math.max(
              0,
              1200 -
                Math.max(
                  0,
                  Math.min(
                    1200,
                    Number(
                      simulation.clockSecondsRemaining
                    ) || 0
                  )
                )
            )
          : 1200;

      return (
        completedPeriods * 1200 +
        currentPeriodElapsed
      );
    };

    const teamSkaters =
      Array.isArray(
        side === 'home'
          ? simulation.home?.skaters
          : simulation.away?.skaters
      )
        ? (
            side === 'home'
              ? simulation.home.skaters
              : simulation.away.skaters
          )
        : [];

    const getUnitAverageTOI = (
      unit,
      assignmentKey,
      assignmentValue
    ) => {
      const matchingPlayers =
        teamSkaters.filter(player =>
          player
            ?.lineupAssignment
            ?.unit === unit &&
          Number(
            player
              ?.lineupAssignment
              ?.[assignmentKey]
          ) === Number(assignmentValue)
        );

      if (matchingPlayers.length === 0) {
        return null;
      }

      const playerTOIValues =
        matchingPlayers.map(player =>
          Math.max(
            0,
            Number(
              player.timeOnIceSeconds
            ) || 0
          )
        );

      const averageTOI =
        playerTOIValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        playerTOIValues.length;

      const hottestPlayerTOI =
        Math.max(...playerTOIValues);

      /*
       * Blend the unit average with the most-used skater. A player who
       * accumulated extra PP/PK minutes now meaningfully cools the next
       * 5-on-5 deployment without forcing every linemate to identical TOI.
       */
      return (
        averageTOI * 0.30 +
        hottestPlayerTOI * 0.70
      );
    };

    const balancedPick = (
      weightedOptions,
      usageMap,
      key,
      unit,
      assignmentKey
    ) => {
      const totalWeight =
        weightedOptions.reduce(
          (sum, option) =>
            sum +
            Math.max(
              0,
              Number(option.weight) || 0
            ),
          0
        );

      const totalSelections =
        Object.values(usageMap).reduce(
          (sum, value) =>
            sum +
            (Number(value) || 0),
          0
        );

      const elapsedEvenStrengthSeconds =
        Math.max(
          0,
          Number(
            simulation.flow
              ?.deploymentUsage
              ?.[side]
              ?.evenStrengthSeconds
          ) || 0
        );

      let best = null;
      let bestScore = -Infinity;

      weightedOptions.forEach(option => {
        const id =
          Number(option[key]);

        const targetShare =
          totalWeight > 0
            ? (Number(option.weight) || 0) /
              totalWeight
            : 0;

        const actualCount =
          Number(usageMap[id]) || 0;

        const targetCountAfterNext =
          (totalSelections + 1) *
          targetShare;

        const averageUnitTOI =
          getUnitAverageTOI(
            unit,
            assignmentKey,
            id
          );

        /*
         * Target TOTAL game TOI by role, not merely equal shift counts.
         * Because actual TOI includes PP/PK usage, heavy special-teams work
         * automatically reduces the urgency of the next 5-on-5 shift.
         */
        const targetTOI =
          Math.max(
            45,
            elapsedEvenStrengthSeconds
          ) * targetShare;

        const toiDeficit =
          Number.isFinite(
            averageUnitTOI
          )
            ? targetTOI -
              averageUnitTOI
            : 0;

        const shiftCountDeficit =
          targetCountAfterNext -
          actualCount;

        /*
         * Seconds played drive the decision. Shift-count balance remains a
         * smaller stabilizer, and modest jitter keeps rotations organic.
         */
        const overTargetPenalty =
          toiDeficit < 0
            ? Math.abs(toiDeficit) * 2.25
            : 0;

        /*
         * Period-level workload guardrail.
         *
         * The cumulative game target can eventually correct an early
         * deployment spike, but that still allows a line to play far too
         * much in the first period and then sit later. Hockey rotations
         * should stay believable inside each period as well as across the
         * full game.
         *
         * We therefore compare the unit's hottest skater against the
         * amount of even-strength time that should reasonably have accrued
         * by this point in the CURRENT period. This is deliberately a soft
         * scoring penalty, not a hard cap: special teams, overtime and game
         * context can still create unusually high total TOI.
         */
        const periodNumber =
          Math.max(
            1,
            Number(simulation.period) || 1
          );

        const completedPriorPeriods =
          Math.max(
            0,
            Math.min(
              3,
              periodNumber - 1
            )
          );

        const priorPeriodTargetTOI =
          completedPriorPeriods *
          20 * 60 *
          targetShare;

        const currentPeriodEvenStrengthSeconds =
          Math.max(
            0,
            elapsedEvenStrengthSeconds -
            completedPriorPeriods * 20 * 60
          );

        const currentPeriodTargetTOI =
          currentPeriodEvenStrengthSeconds *
          targetShare;

        const expectedTOIThroughNow =
          priorPeriodTargetTOI +
          currentPeriodTargetTOI;

        const periodAheadSeconds =
          Math.max(
            0,
            hottestPlayerTOI -
            expectedTOIThroughNow -
            75
          );

        const periodAheadPenalty =
          periodAheadSeconds * 2.4;

        const score =
          toiDeficit * 1.55 -
          overTargetPenalty -
          periodAheadPenalty +
          shiftCountDeficit * 8 +
          Math.random() * 6;

        if (score > bestScore) {
          bestScore = score;
          best = option;
        }
      });

      return best ||
        weightedOptions[0] ||
        null;
    };

    const selectedForwardLine =
      balancedPick(
        forwardLineWeights,
        usage.forwardLines,
        'line',
        'forward',
        'line'
      );

    const selectedDefensePair =
      balancedPick(
        defensePairWeights,
        usage.defensePairs,
        'pair',
        'defense',
        'pair'
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason: 'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation: 'even-strength',
          forwardLine: selectedForwardLine.line,
          defensePair: selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason: 'deployment-resolution-failed',
        deployment: deployment || null,
      };
    }

    usage.forwardLines[
      selectedForwardLine.line
    ] =
      (Number(
        usage.forwardLines[
          selectedForwardLine.line
        ]
      ) || 0) + 1;

    usage.defensePairs[
      selectedDefensePair.pair
    ] =
      (Number(
        usage.defensePairs[
          selectedDefensePair.pair
        ]
      ) || 0) + 1;

    return {
      success: true,
      reason: 'even-strength-deployment-selected',
      side,
      forwardLine: selectedForwardLine.line,
      defensePair: selectedDefensePair.pair,
      deployment,
    };
  }

  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }

    return {
      success: true,

      reason:
        'overtime-deployment-selected',

      side,

      deployment: {
        success: true,
        situation:
          'overtime',

        skaters:
          overtimeSkaters,

        goalie,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOOTOUT RESOLUTION
   * ============================================================
   *
   * Three-round shootout followed by sudden death if tied.
   *
   * Shootout goals do NOT count toward normal player goals,
   * shots, goalie saves, or goals against.
   *
   * The winning team receives one additional goal in the official
   * final game score.
   */
  function resolveLiveGameShootout(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    if (
      simulation.status !==
        'shootout-pending'
    ) {
      return {
        success: false,
        reason:
          'shootout-not-pending',
        event: null,
      };
    }

    const getShootoutParticipants =
      side => {
        const teamState =
          side === 'home'
            ? simulation.home
            : simulation.away;

        const skaters =
          Array.isArray(
            teamState?.skaters
          )
            ? teamState.skaters
            : [];

        const goalies =
          Array.isArray(
            teamState?.goalies
          )
            ? teamState.goalies
            : [];

        const shooterPool =
          skaters
            .map(player => {
              const canonicalPlayer =
                getPlayerById(
                  player.playerId
                );

              const attributes =
                canonicalPlayer
                  ?.attributes ||
                {};

              const shootoutRating =
                (
                  Number(
                    attributes
                      .wristShotAccuracy
                  ) || 50
                ) * 0.35 +
                (
                  Number(
                    attributes
                      .puckControl
                  ) || 50
                ) * 0.25 +
                (
                  Number(
                    attributes
                      .deking
                  ) || 50
                ) * 0.20 +
                (
                  Number(
                    attributes
                      .offensiveAwareness
                  ) || 50
                ) * 0.20;

              return {
                player,
                shootoutRating,
              };
            })
            .sort(
              (
                firstEntry,
                secondEntry
              ) =>
                secondEntry
                  .shootoutRating -
                firstEntry
                  .shootoutRating
            );

        const goalie =
          goalies.find(
            goalieLine =>
              goalieLine.started === true
          ) ||
          goalies[0] ||
          null;

        return {
          teamState,
          shooterPool,
          goalie,
        };
      };

    const homeParticipants =
      getShootoutParticipants(
        'home'
      );

    const awayParticipants =
      getShootoutParticipants(
        'away'
      );

    if (
      homeParticipants
        .shooterPool.length === 0 ||
      awayParticipants
        .shooterPool.length === 0 ||
      !homeParticipants.goalie ||
      !awayParticipants.goalie
    ) {
      return {
        success: false,
        reason:
          'shootout-participants-missing',
        event: null,
      };
    }

    const getGoalieShootoutRating =
      goalieLine => {
        const canonicalGoalie =
          getPlayerById(
            goalieLine.playerId
          );

        const attributes =
          canonicalGoalie
            ?.attributes ||
          {};

        return Math.max(
          25,
          Math.min(
            99,
            (
              Number(
                attributes.reflexes
              ) || 50
            ) * 0.35 +
            (
              Number(
                attributes
                  .puckTracking
              ) || 50
            ) * 0.30 +
            (
              Number(
                attributes.positioning
              ) || 50
            ) * 0.20 +
            (
              Number(
                attributes.composure
              ) || 50
            ) * 0.15
          )
        );
      };

    const resolveAttempt =
      (
        shootingSide,
        shooterEntry,
        opposingGoalie
      ) => {
        const goalieRating =
          getGoalieShootoutRating(
            opposingGoalie
          );

        const shooterRating =
          Math.max(
            25,
            Math.min(
              99,
              Number(
                shooterEntry
                  .shootoutRating
              ) || 50
            )
          );

        /*
         * Keep individual attempt conversion in a realistic
         * shootout range while still allowing elite shooters
         * and goalies to matter.
         */
        const scoringChance =
          Math.max(
            0.20,
            Math.min(
              0.48,
              0.33 +
              (
                shooterRating -
                goalieRating
              ) * 0.003
            )
          );

        return {
          side:
            shootingSide,

          shooterPlayerId:
            shooterEntry
              .player
              .playerId,

          goaliePlayerId:
            opposingGoalie
              .playerId,

          scored:
            Math.random() <
            scoringChance,
        };
      };

    const attempts = [];

    let homeShootoutGoals = 0;
    let awayShootoutGoals = 0;

    let homeAttempts = 0;
    let awayAttempts = 0;

    /*
     * ==========================================================
     * INITIAL THREE ROUNDS
     * ==========================================================
     */
    for (
      let round = 0;
      round < 3;
      round += 1
    ) {
      const homeShooter =
        homeParticipants
          .shooterPool[
            round %
            homeParticipants
              .shooterPool.length
          ];

      const awayShooter =
        awayParticipants
          .shooterPool[
            round %
            awayParticipants
              .shooterPool.length
          ];

      const homeAttempt =
        resolveAttempt(
          'home',
          homeShooter,
          awayParticipants.goalie
        );

      homeAttempts += 1;

      if (homeAttempt.scored) {
        homeShootoutGoals += 1;
      }

      attempts.push({
        ...homeAttempt,
        round:
          round + 1,
      });

      /*
       * Early clinch check after the home attempt.
       */
      const awayRemaining =
        3 - awayAttempts;

      if (
        homeShootoutGoals >
        awayShootoutGoals +
          awayRemaining
      ) {
        break;
      }

      const awayAttempt =
        resolveAttempt(
          'away',
          awayShooter,
          homeParticipants.goalie
        );

      awayAttempts += 1;

      if (awayAttempt.scored) {
        awayShootoutGoals += 1;
      }

      attempts.push({
        ...awayAttempt,
        round:
          round + 1,
      });

      const homeRemaining =
        3 - homeAttempts;

      if (
        awayShootoutGoals >
        homeShootoutGoals +
          homeRemaining
      ) {
        break;
      }
    }

    /*
     * ==========================================================
     * SUDDEN DEATH
     * ==========================================================
     */
    let suddenDeathRound =
      4;

    let safetyRounds =
      0;

    while (
      homeShootoutGoals ===
        awayShootoutGoals &&
      safetyRounds < 20
    ) {
      const homeShooter =
        homeParticipants
          .shooterPool[
            (
              suddenDeathRound - 1
            ) %
            homeParticipants
              .shooterPool.length
          ];

      const awayShooter =
        awayParticipants
          .shooterPool[
            (
              suddenDeathRound - 1
            ) %
            awayParticipants
              .shooterPool.length
          ];

      const homeAttempt =
        resolveAttempt(
          'home',
          homeShooter,
          awayParticipants.goalie
        );

      homeAttempts += 1;

      if (homeAttempt.scored) {
        homeShootoutGoals += 1;
      }

      attempts.push({
        ...homeAttempt,
        round:
          suddenDeathRound,
        suddenDeath: true,
      });

      const awayAttempt =
        resolveAttempt(
          'away',
          awayShooter,
          homeParticipants.goalie
        );

      awayAttempts += 1;

      if (awayAttempt.scored) {
        awayShootoutGoals += 1;
      }

      attempts.push({
        ...awayAttempt,
        round:
          suddenDeathRound,
        suddenDeath: true,
      });

      if (
        homeAttempt.scored !==
        awayAttempt.scored
      ) {
        break;
      }

      suddenDeathRound += 1;
      safetyRounds += 1;
    }

    /*
     * Extremely unlikely fallback so a pathological random run
     * can never leave the game unresolved.
     */
    if (
      homeShootoutGoals ===
        awayShootoutGoals
    ) {
      if (Math.random() < 0.5) {
        homeShootoutGoals += 1;
      } else {
        awayShootoutGoals += 1;
      }
    }

    const winnerSide =
      homeShootoutGoals >
      awayShootoutGoals
        ? 'home'
        : 'away';

    const loserSide =
      winnerSide === 'home'
        ? 'away'
        : 'home';

    const winningTeamState =
      winnerSide === 'home'
        ? simulation.home
        : simulation.away;

    /*
     * Official final-score convention:
     * shootout winner receives one additional team goal.
     */
    winningTeamState.score =
      (
        Number(
          winningTeamState.score
        ) || 0
      ) + 1;

    simulation
      .shootoutComplete =
      true;

    simulation.gameComplete =
      true;

    simulation.status =
      'completed';

    simulation.resultType =
      'shootout';

    simulation.wentToShootout =
      true;

    simulation.winnerSide =
      winnerSide;

    simulation.loserSide =
      loserSide;

    simulation.shootout = {
      homeGoals:
        homeShootoutGoals,

      awayGoals:
        awayShootoutGoals,

      homeAttempts,

      awayAttempts,

      attempts,
    };

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'shootout-complete',

      period:
        5,

      clockSecondsRemaining:
        0,

      winnerSide,

      loserSide,

      homeShootoutGoals,

      awayShootoutGoals,

      homeScore:
        simulation.home.score,

      awayScore:
        simulation.away.score,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,

      reason:
        'live-game-shootout-resolved',

      winnerSide,

      loserSide,

      event,

      shootout:
        simulation.shootout,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVENT TIME SCHEDULER
   * ============================================================
   *
   * Determines how many SECONDS of game clock pass before the
   * next meaningful hockey event.
   *
   * This is deliberately separate from event generation.
   *
   * A single minute may contain:
   * - no meaningful events
   * - one event
   * - several events
   *
   * Related sequences such as rebounds and scrambles can happen
   * only a few seconds apart, while normal possession stretches
   * may burn considerably more clock.
   */
  function scheduleNextLiveGameEventTime(
    simulation,
    context = {}
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        elapsedSeconds: 0,
        nextClockSecondsRemaining: 0,
      };
    }

    const currentClock =
      Math.max(
        0,
        Number(
          simulation
            .clockSecondsRemaining
        ) || 0
      );

    if (currentClock <= 0) {
      return {
        success: true,
        reason:
          'period-clock-expired',
        elapsedSeconds: 0,
        nextClockSecondsRemaining: 0,
      };
    }

    /*
     * CONTEXT TYPES
     *
     * normal
     *   Standard flowing play.
     *
     * transition
     *   Quick change of possession / rush.
     *
     * offensive-zone
     *   Sustained pressure creates events more frequently.
     *
     * rebound
     *   Immediate follow-up after a save.
     *
     * scramble
     *   Net-front chaos, blocked shot, loose puck, etc.
     *
     * after-faceoff
     *   Play immediately following a draw.
     *
     * quiet
     *   Low-event possession stretch.
     */
    const paceContext =
      context.paceContext ||
      'normal';

    /*
     * Generate an integer between min and max, inclusive.
     */
    const randomBetween =
      (
        minimum,
        maximum
      ) => {
        const min =
          Math.ceil(
            Number(minimum) || 0
          );

        const max =
          Math.floor(
            Number(maximum) || min
          );

        return (
          min +
          Math.floor(
            Math.random() *
            (
              max -
              min +
              1
            )
          )
        );
      };

    let minimumSeconds = 6;
    let maximumSeconds = 20;

    switch (paceContext) {
      /*
       * A rebound can create another attempt almost immediately.
       *
       * Example:
       * 12:37 shot
       * 12:34 rebound shot
       */
      case 'rebound':
        minimumSeconds = 2;
        maximumSeconds = 6;
        break;

      /*
       * Loose puck / crease scramble.
       */
      case 'scramble':
        minimumSeconds = 2;
        maximumSeconds = 8;
        break;

      /*
       * Rushes and possession changes generate moderately
       * quick follow-up action.
       */
      case 'transition':
        minimumSeconds = 4;
        maximumSeconds = 13;
        break;

      /*
       * Sustained offensive-zone pressure means meaningful
       * events tend to happen more frequently.
       */
      case 'offensive-zone':
        minimumSeconds = 4;
        maximumSeconds = 14;
        break;

      /*
       * After a faceoff, teams usually need at least a few
       * seconds to establish possession or create an event.
       */
      case 'after-faceoff':
        minimumSeconds = 5;
        maximumSeconds = 16;
        break;

      /*
       * Some stretches simply contain cycling, regrouping,
       * line changes or neutral-zone play without anything
       * worth putting in the live event feed.
       */
      case 'quiet':
        minimumSeconds = 14;
        maximumSeconds = 30;
        break;

      case 'normal':
      default:
        minimumSeconds = 6;
        maximumSeconds = 20;
        break;
    }

    let elapsedSeconds =
      randomBetween(
        minimumSeconds,
        maximumSeconds
      );

    /*
     * Add natural variance.
     *
     * Occasionally flowing hockey produces a particularly quick
     * event even when there was no explicit rebound/scramble.
     */
    if (
      paceContext === 'normal' &&
      Math.random() < 0.10
    ) {
      elapsedSeconds =
        randomBetween(
          3,
          6
        );
    }

    /*
     * Occasionally a possession produces a longer quiet stretch.
     * This prevents the feed from becoming an endless machine-gun
     * stream of events.
     */
    if (
      (
        paceContext === 'normal' ||
        paceContext === 'after-faceoff'
      ) &&
      Math.random() < 0.08
    ) {
      elapsedSeconds +=
        randomBetween(
          6,
          14
        );
    }

    /*
     * Never advance past the end of the period.
     */
    elapsedSeconds =
      Math.min(
        currentClock,
        Math.max(
          1,
          elapsedSeconds
        )
      );

    const nextClockSecondsRemaining =
      Math.max(
        0,
        currentClock -
        elapsedSeconds
      );

    return {
      success: true,

      reason:
        'live-game-event-time-scheduled',

      paceContext,

      elapsedSeconds,

      previousClockSecondsRemaining:
        currentClock,

      nextClockSecondsRemaining,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVENT TYPE SELECTOR
   * ============================================================
   *
   * Chooses the next meaningful hockey event based on the
   * current flow of play.
   *
   * This function only selects the TYPE of event.
   * Separate resolution helpers will later determine:
   *
   * shot-attempt
   *   → miss / block / save / goal
   *
   * turnover
   *   → giveaway / takeaway / transition
   *
   * penalty
   *   → penalized player / infraction / PP state
   *
   * stoppage
   *   → goalie freeze / icing / offside / etc.
   */
  function selectNextLiveGameEventType(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        eventType: null,
      };
    }

    const flow =
      simulation.flow &&
      typeof simulation.flow === 'object'
        ? simulation.flow
        : null;

    if (!flow) {
      return {
        success: false,
        reason:
          'live-game-flow-missing',
        eventType: null,
      };
    }

    /*
     * Dead puck means the next meaningful action must restart
     * play with a faceoff.
     */
    if (flow.stopped === true) {
      return {
        success: true,
        reason:
          'stopped-play-requires-faceoff',
        eventType:
          'faceoff',
      };
    }

    const zone =
      flow.zone ||
      'neutral';

    const paceContext =
      flow.paceContext ||
      'normal';

    const pressureLevel =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            flow.pressureLevel
          ) || 0
        )
      );

    /*
     * Weighted choices rather than direct percentages.
     *
     * These are intentionally easy to tune once we begin
     * whole-game calibration.
     */
    const weights = {
      'shot-attempt': 38,
      hit: 14,
      turnover: 8,
      penalty: 4,
      stoppage: 6,
      'possession-advance': 19,
      'quiet-play': 11,
    };

    /*
     * ==========================================================
     * OFFENSIVE ZONE
     * ==========================================================
     *
     * More shot attempts and sustained-possession events.
     */
    if (zone === 'offensive') {
      weights['shot-attempt'] +=
        13;

      weights['possession-advance'] +=
        3;

      weights['quiet-play'] -=
        4;

      /*
       * Sustained pressure makes another attempt increasingly
       * plausible without guaranteeing one.
       */
      weights['shot-attempt'] +=
        pressureLevel * 2;

      weights.turnover +=
        pressureLevel * 0.25;
    }

    /*
     * ==========================================================
     * NEUTRAL ZONE
     * ==========================================================
     *
     * More puck movement and turnovers, fewer direct shots.
     */
    if (zone === 'neutral') {
      weights['shot-attempt'] -=
        12;

      weights.turnover +=
        2;

      weights['possession-advance'] +=
        9;

      weights['quiet-play'] +=
        3;
    }

    /*
     * ==========================================================
     * DEFENSIVE ZONE
     * ==========================================================
     *
     * From the perspective of the team that currently owns the
     * puck, this usually means breakout attempts.
     */
    if (zone === 'defensive') {
      weights['shot-attempt'] -=
        14;

      weights.turnover +=
        2;

      weights['possession-advance'] +=
        10;

      weights['quiet-play'] +=
        4;
    }

    /*
     * ==========================================================
     * REBOUND / SCRAMBLE
     * ==========================================================
     *
     * These contexts should strongly favor another immediate
     * attempt or a whistle.
     */
    if (paceContext === 'rebound') {
      weights['shot-attempt'] +=
        34;

      weights.stoppage +=
        14;

      weights.hit -=
        7;

      weights['quiet-play'] -=
        12;

      weights['possession-advance'] -=
        9;
    }

    if (paceContext === 'scramble') {
      weights['shot-attempt'] +=
        22;

      weights.stoppage +=
        12;

      weights.turnover +=
        2;

      weights['quiet-play'] -=
        10;
    }

    /*
     * ==========================================================
     * TRANSITION
     * ==========================================================
     *
     * Rush hockey creates more chances and possession swings.
     */
    if (paceContext === 'transition') {
      weights['shot-attempt'] +=
        12;

      weights.turnover +=
        2;

      weights['possession-advance'] +=
        6;

      weights['quiet-play'] -=
        7;
    }

    /*
     * After a draw there is commonly some possession-establishing
     * play before a dangerous attempt develops.
     */
    if (
      paceContext ===
      'after-faceoff'
    ) {
      weights['possession-advance'] +=
        7;

      weights['shot-attempt'] -=
        5;
    }

    /*
     * Quiet context intentionally suppresses major events.
     */
    if (paceContext === 'quiet') {
      weights['quiet-play'] +=
        20;

      weights['possession-advance'] +=
        5;

      weights['shot-attempt'] -=
        8;

      weights.penalty -=
        1;
    }

    /*
     * ==========================================================
     * POWER-PLAY EVENT PRESSURE
     * ==========================================================
     *
     * Once the PP has established possession, its actual personnel,
     * the opposing PK personnel, and the manpower advantage influence
     * how frequently dangerous offensive events develop.
     *
     * We increase shot/possession pressure rather than directly
     * increasing goal probability.
     *
     * That keeps goaltending and individual finishing responsible
     * for whether the chance actually becomes a goal.
     */
    const specialTeamsMatchup =
      getLiveGameSpecialTeamsMatchup(
        simulation
      );

    if (
      specialTeamsMatchup?.success === true &&
      flow.possessionSide ===
        specialTeamsMatchup.powerPlaySide
    ) {
      const specialTeamsAdvantage =
        Math.max(
          -20,
          Math.min(
            30,
            Number(
              specialTeamsMatchup
                .totalAdvantage
            ) || 0
          )
        );

      /*
       * Average 5-on-4:
       * meaningful increase in shot creation.
       *
       * Elite PP / poor PK:
       * larger increase.
       *
       * Weak PP / elite PK:
       * advantage can be substantially suppressed.
       */
      const shotWeightBonus =
        Math.max(
          4,
          Math.min(
            22,
            8 +
            specialTeamsAdvantage *
              0.40
          )
        );

      const possessionWeightBonus =
        Math.max(
          2,
          Math.min(
            12,
            4 +
            specialTeamsAdvantage *
              0.20
          )
        );

      weights['shot-attempt'] +=
        shotWeightBonus;

      weights['possession-advance'] +=
        possessionWeightBonus;

      /*
       * Power plays generally spend less established-zone time in
       * low-event hockey than ordinary even-strength possessions.
       */
      weights['quiet-play'] -=
        Math.max(
          2,
          Math.min(
            8,
            3 +
            specialTeamsAdvantage *
              0.10
          )
        );

      /*
       * Two-man advantages should feel substantially more dangerous
       * without turning every event into a shot.
       */
      if (
        specialTeamsMatchup
          .manpowerAdvantage >= 2
      ) {
        weights['shot-attempt'] +=
          7;

        weights['possession-advance'] +=
          3;

        weights['quiet-play'] -=
          3;
      }
    }

    /*
     * Normalize impossible negative weights.
     */
    Object.keys(
      weights
    ).forEach(eventType => {
      weights[eventType] =
        Math.max(
          0,
          Number(
            weights[eventType]
          ) || 0
        );
    });

    const weightedEntries =
      Object.entries(
        weights
      )
        .filter(
          ([, weight]) =>
            weight > 0
        );

    const totalWeight =
      weightedEntries.reduce(
        (
          sum,
          [, weight]
        ) =>
          sum + weight,
        0
      );

    if (totalWeight <= 0) {
      return {
        success: false,
        reason:
          'live-game-event-weights-empty',
        eventType: null,
        weights,
      };
    }

    let roll =
      Math.random() *
      totalWeight;

    let selectedEventType =
      weightedEntries[0][0];

    for (
      const [
        eventType,
        weight,
      ] of weightedEntries
    ) {
      roll -= weight;

      if (roll <= 0) {
        selectedEventType =
          eventType;

        break;
      }
    }

    return {
      success: true,

      reason:
        'live-game-event-type-selected',

      eventType:
        selectedEventType,

      context: {
        zone,
        paceContext,
        pressureLevel,
      },

      weights: {
        ...weights,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — FACEOFF RESOLUTION
   * ============================================================
   *
   * Resolves a faceoff, awards possession, and resets the flow
   * state for the next stretch of play.
   *
   * This uses the actual deployed skaters when available.
   */
  function resolveLiveGameFaceoff(
    simulation,
    options = {}
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    const isOvertime =
      simulation.period === 4;

    const homeDeployment =
      simulation.flow
        ?.homeDeployment ||
      (
        isOvertime
          ? selectLiveGameOvertimeDeployment(
              simulation,
              'home'
            )
          : selectLiveGameEvenStrengthDeployment(
              simulation,
              'home'
            )
      )?.deployment ||
      null;

    const awayDeployment =
      simulation.flow
        ?.awayDeployment ||
      (
        isOvertime
          ? selectLiveGameOvertimeDeployment(
              simulation,
              'away'
            )
          : selectLiveGameEvenStrengthDeployment(
              simulation,
              'away'
            )
      )?.deployment ||
      null;

    if (
      !homeDeployment ||
      !awayDeployment
    ) {
      return {
        success: false,
        reason:
          'faceoff-deployment-missing',
        event: null,
      };
    }

    const findCenter =
      deployment => {
        const skaters =
          Array.isArray(
            deployment.skaters
          )
            ? deployment.skaters
            : [];

        return (
          skaters.find(player =>
            normalizeAttributePosition(
              player.position
            ) === 'C'
          ) ||
          skaters[0] ||
          null
        );
      };

    const homeCenter =
      findCenter(
        homeDeployment
      );

    const awayCenter =
      findCenter(
        awayDeployment
      );

    const getFaceoffRating =
      player => {
        if (!player) {
          return 50;
        }

        const canonicalPlayer =
          getPlayerById(
            player.playerId
          );

        return Math.max(
          25,
          Math.min(
            99,
            Number(
              canonicalPlayer
                ?.attributes
                ?.faceoffs
            ) ||
            Number(
              canonicalPlayer
                ?.overall
            ) ||
            Number(
              player.overall
            ) ||
            50
          )
        );
      };

    const homeRating =
      getFaceoffRating(
        homeCenter
      );

    const awayRating =
      getFaceoffRating(
        awayCenter
      );

    /*
     * Skill matters, but randomness still matters a lot on one draw.
     */
    const homeScore =
      homeRating +
      (
        Math.random() * 30
      );

    const awayScore =
      awayRating +
      (
        Math.random() * 30
      );

    const winnerSide =
      homeScore >= awayScore
        ? 'home'
        : 'away';

    const loserSide =
      winnerSide === 'home'
        ? 'away'
        : 'home';

    const winningTeamState =
      winnerSide === 'home'
        ? simulation.home
        : simulation.away;

    winningTeamState.faceoffWins =
      (
        Number(
          winningTeamState
            .faceoffWins
        ) || 0
      ) + 1;

    /*
     * ==========================================================
     * INDIVIDUAL FACEOFF STATS
     * ==========================================================
     *
     * Credit the actual centers who took the draw.
     */
    const winningCenter =
      winnerSide === 'home'
        ? homeCenter
        : awayCenter;

    const losingCenter =
      loserSide === 'home'
        ? homeCenter
        : awayCenter;

    if (winningCenter) {
      winningCenter.faceoffWins =
        (
          Number(
            winningCenter.faceoffWins
          ) || 0
        ) + 1;

      winningCenter.faceoffAttempts =
        (
          Number(
            winningCenter.faceoffAttempts
          ) || 0
        ) + 1;
    }

    if (losingCenter) {
      losingCenter.faceoffLosses =
        (
          Number(
            losingCenter.faceoffLosses
          ) || 0
        ) + 1;

      losingCenter.faceoffAttempts =
        (
          Number(
            losingCenter.faceoffAttempts
          ) || 0
        ) + 1;
    }

    const requestedZone =
      options.zone ||
      'neutral';

    simulation.flow
      .possessionSide =
      winnerSide;

    simulation.flow.zone =
      requestedZone;

    simulation.flow
      .paceContext =
      'after-faceoff';

    simulation.flow.stopped =
      false;

    simulation.flow
      .stoppageReason =
      null;

    simulation.flow
      .lastEventType =
      'faceoff';

    simulation.flow
      .lastEventSide =
      winnerSide;

    simulation.flow
      .pressureLevel =
      0;

    simulation.flow
      .homeDeployment =
      homeDeployment;

    simulation.flow
      .awayDeployment =
      awayDeployment;

    simulation.flow
      .deploymentAgeSeconds =
      0;

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'faceoff',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      winnerSide,

      loserSide,

      winnerTeamId:
        winnerSide === 'home'
          ? simulation.homeTeamId
          : simulation.awayTeamId,

      loserTeamId:
        loserSide === 'home'
          ? simulation.homeTeamId
          : simulation.awayTeamId,

      winnerPlayerId:
        winnerSide === 'home'
          ? homeCenter?.playerId ||
            null
          : awayCenter?.playerId ||
            null,

      loserPlayerId:
        loserSide === 'home'
          ? homeCenter?.playerId ||
            null
          : awayCenter?.playerId ||
            null,

      zone:
        requestedZone,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,

      reason:
        'live-game-faceoff-resolved',

      winnerSide,

      loserSide,

      event,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SPECIAL TEAMS MATCHUP PROFILE
   * ============================================================
   *
   * Evaluates the actual PP and PK players currently deployed.
   *
   * This is intentionally attribute-driven rather than using a
   * generic team-strength modifier.
   *
   * Power-play quality emphasizes:
   * - puck movement
   * - offensive awareness
   * - puck control
   * - shooting threat
   *
   * Penalty-kill quality emphasizes:
   * - defensive awareness
   * - stick checking
   * - skating
   * - shot blocking
   *
   * Manpower advantage is handled separately so having an extra
   * skater matters even when the two units have similar ratings.
   */
  function getLiveGameSpecialTeamsMatchup(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object' ||
      !simulation.flow ||
      !simulation.specialTeams
    ) {
      return {
        success: false,
        reason:
          'invalid-special-teams-matchup-state',
      };
    }

    const specialTeams =
      simulation.specialTeams;

    if (
      specialTeams.situation !==
        'power-play' ||
      (
        specialTeams.powerPlaySide !==
          'home' &&
        specialTeams.powerPlaySide !==
          'away'
      )
    ) {
      return {
        success: false,
        reason:
          'no-active-power-play',
      };
    }

    const powerPlaySide =
      specialTeams.powerPlaySide;

    const penaltyKillSide =
      specialTeams.penaltyKillSide;

    const powerPlayDeployment =
      powerPlaySide === 'home'
        ? simulation.flow
            .homeDeployment
        : simulation.flow
            .awayDeployment;

    const penaltyKillDeployment =
      penaltyKillSide === 'home'
        ? simulation.flow
            .homeDeployment
        : simulation.flow
            .awayDeployment;

    const powerPlaySkaters =
      Array.isArray(
        powerPlayDeployment
          ?.skaters
      )
        ? powerPlayDeployment.skaters
        : [];

    const penaltyKillSkaters =
      Array.isArray(
        penaltyKillDeployment
          ?.skaters
      )
        ? penaltyKillDeployment.skaters
        : [];

    if (
      powerPlaySkaters.length === 0 ||
      penaltyKillSkaters.length === 0
    ) {
      return {
        success: false,
        reason:
          'special-teams-players-missing',
      };
    }

    const average =
      values => {
        if (
          !Array.isArray(values) ||
          values.length === 0
        ) {
          return 50;
        }

        return (
          values.reduce(
            (sum, value) =>
              sum +
              (
                Number(value) ||
                50
              ),
            0
          ) /
          values.length
        );
      };

    const getAttributes =
      player =>
        getPlayerById(
          player?.playerId
        )?.attributes ||
        {};

    /*
     * ==========================================================
     * POWER-PLAY QUALITY
     * ==========================================================
     */
    const powerPlayRatings =
      powerPlaySkaters.map(
        player => {
          const attributes =
            getAttributes(
              player
            );

          const shotThreat =
            (
              (
                Number(
                  attributes
                    .wristShotAccuracy
                ) || 50
              ) +
              (
                Number(
                  attributes
                    .slapShotAccuracy
                ) || 50
              )
            ) / 2;

          return (
            (
              Number(
                attributes.passing
              ) || 50
            ) * 0.27 +
            (
              Number(
                attributes
                  .offensiveAwareness
              ) || 50
            ) * 0.23 +
            (
              Number(
                attributes
                  .puckControl
              ) || 50
            ) * 0.20 +
            shotThreat * 0.18 +
            (
              Number(
                attributes.poise
              ) || 50
            ) * 0.12
          );
        }
      );

    /*
     * ==========================================================
     * PENALTY-KILL QUALITY
     * ==========================================================
     */
    const penaltyKillRatings =
      penaltyKillSkaters.map(
        player => {
          const attributes =
            getAttributes(
              player
            );

          return (
            (
              Number(
                attributes
                  .defensiveAwareness
              ) || 50
            ) * 0.30 +
            (
              Number(
                attributes
                  .stickChecking
              ) || 50
            ) * 0.24 +
            (
              Number(
                attributes
                  .shotBlocking
              ) || 50
            ) * 0.18 +
            (
              Number(
                attributes.agility
              ) || 50
            ) * 0.10 +
            (
              Number(
                attributes.speed
              ) || 50
            ) * 0.10 +
            (
              Number(
                attributes.poise
              ) || 50
            ) * 0.08
          );
        }
      );

    const powerPlayRating =
      Math.max(
        25,
        Math.min(
          99,
          average(
            powerPlayRatings
          )
        )
      );

    const penaltyKillRating =
      Math.max(
        25,
        Math.min(
          99,
          average(
            penaltyKillRatings
          )
        )
      );

    /*
     * Attribute advantage before accounting for the actual
     * numerical manpower edge.
     */
    const skillAdvantage =
      powerPlayRating -
      penaltyKillRating;

    const powerPlaySkaterCount =
      powerPlaySide === 'home'
        ? Number(
            specialTeams
              .homeSkaters
          ) || 5
        : Number(
            specialTeams
              .awaySkaters
          ) || 5;

    const penaltyKillSkaterCount =
      penaltyKillSide === 'home'
        ? Number(
            specialTeams
              .homeSkaters
          ) || 4
        : Number(
            specialTeams
              .awaySkaters
          ) || 4;

    const manpowerAdvantage =
      Math.max(
        0,
        powerPlaySkaterCount -
        penaltyKillSkaterCount
      );

    /*
     * One extra skater should matter substantially.
     * A two-man advantage should be even more dangerous without
     * making scoring or zone possession automatic.
     */
    const manpowerBonus =
      manpowerAdvantage === 1
        ? 9
        : manpowerAdvantage >= 2
          ? 16
          : 0;

    const totalAdvantage =
      skillAdvantage +
      manpowerBonus;

    return {
      success: true,

      reason:
        'special-teams-matchup-created',

      powerPlaySide,
      penaltyKillSide,

      powerPlayRating,
      penaltyKillRating,

      skillAdvantage,

      manpowerAdvantage,
      manpowerBonus,

      totalAdvantage,

      powerPlaySkaterCount,
      penaltyKillSkaterCount,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — POSSESSION MATCHUP PROFILE
   * ============================================================
   *
   * Builds an attribute-driven comparison between the team with
   * possession and the defending team currently on the ice.
   *
   * This helper does not change game state.
   * It only calculates the ratings used by possession outcomes.
   */
  function getLiveGamePossessionMatchup(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object' ||
      !simulation.flow
    ) {
      return {
        success: false,
        reason:
          'invalid-possession-matchup-state',
      };
    }

    const flow =
      simulation.flow;

    const possessionSide =
      flow.possessionSide;

    if (
      possessionSide !== 'home' &&
      possessionSide !== 'away'
    ) {
      return {
        success: false,
        reason:
          'possession-side-missing',
      };
    }

    const defendingSide =
      possessionSide === 'home'
        ? 'away'
        : 'home';

    const possessingDeployment =
      possessionSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const defendingDeployment =
      defendingSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const possessingSkaters =
      Array.isArray(
        possessingDeployment
          ?.skaters
      )
        ? possessingDeployment.skaters
        : [];

    const defendingSkaters =
      Array.isArray(
        defendingDeployment
          ?.skaters
      )
        ? defendingDeployment.skaters
        : [];

    if (
      possessingSkaters.length === 0 ||
      defendingSkaters.length === 0
    ) {
      return {
        success: false,
        reason:
          'possession-matchup-players-missing',
      };
    }

    const average =
      values => {
        const safeValues =
          values.filter(
            value =>
              Number.isFinite(
                Number(value)
              )
          );

        if (
          safeValues.length === 0
        ) {
          return 50;
        }

        return (
          safeValues.reduce(
            (sum, value) =>
              sum +
              Number(value),
            0
          ) /
          safeValues.length
        );
      };

    const getAttributes =
      player => {
        const canonicalPlayer =
          getPlayerById(
            player?.playerId
          );

        return (
          canonicalPlayer
            ?.attributes ||
          {}
        );
      };

    /*
     * Offensive possession quality.
     *
     * Passing and puck control matter most, while awareness,
     * skating and poise help the unit move through traffic and
     * maintain structure.
     */
    const possessionRatings =
      possessingSkaters.map(
        player => {
          const attributes =
            getAttributes(
              player
            );

          return (
            (
              Number(
                attributes.passing
              ) || 50
            ) * 0.28 +
            (
              Number(
                attributes
                  .puckControl
              ) || 50
            ) * 0.27 +
            (
              Number(
                attributes
                  .offensiveAwareness
              ) || 50
            ) * 0.18 +
            (
              Number(
                attributes.speed
              ) || 50
            ) * 0.10 +
            (
              Number(
                attributes
                  .acceleration
              ) || 50
            ) * 0.07 +
            (
              Number(
                attributes.poise
              ) || 50
            ) * 0.10
          );
        }
      );

    /*
     * Defensive disruption quality.
     *
     * Awareness and stick checking drive most defensive control,
     * with skating and physical ability helping defenders close
     * space and end possessions.
     */
    const defensiveRatings =
      defendingSkaters.map(
        player => {
          const attributes =
            getAttributes(
              player
            );

          return (
            (
              Number(
                attributes
                  .defensiveAwareness
              ) || 50
            ) * 0.30 +
            (
              Number(
                attributes
                  .stickChecking
              ) || 50
            ) * 0.25 +
            (
              Number(
                attributes.agility
              ) || 50
            ) * 0.12 +
            (
              Number(
                attributes.speed
              ) || 50
            ) * 0.10 +
            (
              Number(
                attributes.strength
              ) || 50
            ) * 0.08 +
            (
              Number(
                attributes
                  .bodyChecking
              ) || 50
            ) * 0.07 +
            (
              Number(
                attributes.poise
              ) || 50
            ) * 0.08
          );
        }
      );

    const possessionRating =
      Math.max(
        25,
        Math.min(
          99,
          average(
            possessionRatings
          )
        )
      );

    const defensiveRating =
      Math.max(
        25,
        Math.min(
          99,
          average(
            defensiveRatings
          )
        )
      );

      /*
       * Base even-strength attribute matchup.
       */
      const baseAdvantage =
        possessionRating -
        defensiveRating;

      /*
       * ==========================================================
       * POWER-PLAY POSSESSION MODIFIER
       * ==========================================================
       *
       * When the team with possession owns the active power play,
       * blend in the dedicated PP-vs-PK matchup.
       *
       * This means:
       *
       * - elite PP units enter and sustain the zone better
       * - elite PK units can meaningfully suppress that advantage
       * - the extra skater matters without becoming an automatic win
       *
       * We deliberately do NOT invert this when the PK gains the puck.
       * PK possession will get dedicated clearance logic separately.
       */
      let specialTeamsAdjustment =
        0;

      const specialTeamsMatchup =
        getLiveGameSpecialTeamsMatchup(
          simulation
        );

      if (
        specialTeamsMatchup?.success === true &&
        specialTeamsMatchup.powerPlaySide ===
          possessionSide
      ) {
        specialTeamsAdjustment =
          Math.max(
            -12,
            Math.min(
              18,
              Number(
                specialTeamsMatchup
                  .totalAdvantage
              ) * 0.55
            )
          );
      }

        /*
         * ==========================================================
         * HOME-ICE INFLUENCE
         * ==========================================================
         *
         * Home ice provides a very small contextual edge in puck
         * management and territorial play.
         *
         * It does NOT:
         * - boost shooting percentage
         * - weaken the away goalie
         * - override player attributes
         * - guarantee the home team wins more individual battles
         *
         * Better players remain overwhelmingly more important.
         */
        const homeIceAdjustment =
          possessionSide === 'home'
            ? 1.25
            : -1.25;

        const advantage =
          baseAdvantage +
          specialTeamsAdjustment +
          homeIceAdjustment;

        return {
        success: true,

        reason:
          'possession-matchup-created',

        possessionSide,
        defendingSide,

        possessionRating,
        defensiveRating,

        baseAdvantage,

          specialTeamsAdjustment,

          homeIceAdjustment,

          advantage,

      possessingSkaterCount:
        possessingSkaters.length,

      defendingSkaterCount:
        defendingSkaters.length,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — POSSESSION / ZONE ADVANCE
   * ============================================================
   *
   * Resolves normal puck movement through the rink.
   *
   * This creates connected hockey sequences:
   *
   * defensive zone
   * → breakout
   * → neutral zone
   * → zone entry
   * → offensive pressure
   *
   * It can also produce failed entries, possession changes,
   * and transition opportunities for the other team.
   */

  /*
   * ============================================================
   * LIVE GAME — POSSESSION TOUCH HISTORY
   * ============================================================
   *
   * Records actual player involvement during the current
   * possession so goals can later award assists from recent
   * puck contributors.
   */
  function recordLiveGamePossessionTouch(
    simulation,
    side,
    playerId,
    touchType = 'possession'
  ) {
    if (
      !simulation ||
      !simulation.flow ||
      !playerId ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return false;
    }

    const flow =
      simulation.flow;

    if (
      !Array.isArray(
        flow.recentPossessionTouches
      )
    ) {
      flow.recentPossessionTouches = [];
    }

    /*
     * If possession has changed teams, the previous team's touch
     * history cannot contribute assists to the new possession.
     */
    const existingSide =
      flow.recentPossessionTouches[
        flow.recentPossessionTouches.length - 1
      ]?.side ||
      null;

    if (
      existingSide &&
      existingSide !== side
    ) {
      flow.recentPossessionTouches = [];
    }

    const touch = {
      playerId,
      side,
      touchType,

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,
    };

    flow.recentPossessionTouches.push(
      touch
    );

    /*
     * We only need a short rolling window.
     * This is enough to reconstruct the last several meaningful
     * puck contributors without carrying an entire game's history.
     */
    if (
      flow.recentPossessionTouches
        .length > 8
    ) {
      flow.recentPossessionTouches =
        flow.recentPossessionTouches
          .slice(-8);
    }

    return true;
  }
  
  function resolveLiveGamePossessionAdvance(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    const flow =
      simulation.flow &&
      typeof simulation.flow === 'object'
        ? simulation.flow
        : null;

    if (
      !flow ||
      flow.stopped === true
    ) {
      return {
        success: false,
        reason:
          'live-game-not-in-flowing-play',
        event: null,
      };
    }

    const possessionSide =
      flow.possessionSide;

    if (
      possessionSide !== 'home' &&
      possessionSide !== 'away'
    ) {
      return {
        success: false,
        reason:
          'possession-side-missing',
        event: null,
      };
    }

    const defendingSide =
      possessionSide === 'home'
        ? 'away'
        : 'home';

    const possessingDeployment =
      possessionSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const possessingSkaters =
      Array.isArray(
        possessingDeployment?.skaters
      )
        ? possessingDeployment.skaters
        : [];

    const currentZone =
      flow.zone ||
      'neutral';

    /*
     * Compare the actual skaters currently on the ice.
     *
     * Positive advantage:
     *   possessing unit is stronger
     *
     * Negative advantage:
     *   defending unit is stronger
     *
     * Clamp the matchup so even extreme talent gaps cannot make
     * possession outcomes automatic.
     */
    const possessionMatchup =
      getLiveGamePossessionMatchup(
        simulation
      );

    const possessionAdvantage =
      possessionMatchup?.success === true
        ? Math.max(
            -25,
            Math.min(
              25,
              Number(
                possessionMatchup
                  .advantage
              ) || 0
            )
          )
        : 0;

    /*
     * ==========================================================
     * PENALTY-KILL CLEARANCE CONTEXT
     * ==========================================================
     *
     * When the shorthanded team gains the puck in its defensive
     * zone, its primary objective is often to clear the puck and
     * force the PP to restart from deep in its own end.
     */
    const specialTeamsMatchup =
      getLiveGameSpecialTeamsMatchup(
        simulation
      );

    const isPenaltyKillPossession =
      specialTeamsMatchup
        ?.success === true &&
      specialTeamsMatchup
        .penaltyKillSide ===
        possessionSide;

    let nextZone =
      currentZone;

    let nextPossessionSide =
      possessionSide;

    let outcome =
      'possession-maintained';

    let paceContext =
      'normal';

    /*
     * ==========================================================
     * DEFENSIVE ZONE
     * ==========================================================
     *
     * Usually a breakout attempt.
     */
    if (
      currentZone ===
      'defensive'
    ) {
      /*
       * ========================================================
       * PENALTY-KILL CLEAR
       * ========================================================
       *
       * Successful clear:
       *
       * PK sends the puck the length of the ice.
       * PP retrieves it in its own defensive zone and must rebuild.
       *
       * Better PK units clear more effectively.
       * Better PP units and a two-man advantage make clearing harder.
       */
      if (
        isPenaltyKillPossession
      ) {
        const pkClearChance =
          Math.max(
            0.34,
            Math.min(
              0.78,
              0.58 -
              (
                Number(
                  specialTeamsMatchup
                    .totalAdvantage
                ) || 0
              ) * 0.0045
            )
          );

        if (
          Math.random() <
          pkClearChance
        ) {
          nextPossessionSide =
            defendingSide;

          /*
           * Possession has changed to the PP team.
           *
           * From the PP team's perspective, it is now retrieving the
           * cleared puck in its own defensive zone.
           */
          nextZone =
            'defensive';

          paceContext =
            'quiet';

          outcome =
            'penalty-kill-clear';

          flow.pressureLevel =
            0;

          flow.recentPossessionTouches =
            [];

          flow.possessionSide =
            nextPossessionSide;

          flow.zone =
            nextZone;

          flow.paceContext =
            paceContext;

          flow.lastEventType =
            'penalty-kill-clear';

          flow.lastEventSide =
            possessionSide;

          const event = {
            id:
              `live-event-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

            type:
              'penalty-kill-clear',

            period:
              simulation.period,

            clockSecondsRemaining:
              simulation
                .clockSecondsRemaining,

            clearingSide:
              possessionSide,

            powerPlaySide:
              defendingSide,

            possessionChanged:
              true,

            clearChance:
              pkClearChance,

            penaltyKillRating:
              specialTeamsMatchup
                .penaltyKillRating,

            powerPlayRating:
              specialTeamsMatchup
                .powerPlayRating,
          };

          simulation.events.push(
            event
          );

          return {
            success: true,

            reason:
              'live-game-penalty-kill-clear',

            event,

            possessionSide:
              nextPossessionSide,

            zone:
              nextZone,

            outcome,

            paceContext,
          };
        }
      }
      /*
       * Base:
       * 68% clean breakout
       * 18% remain trapped
       * 14% dangerous turnover
       *
       * Better puck-moving units improve the clean breakout rate.
       * Better defending/forechecking units force more failed exits.
       */
      const cleanBreakoutChance =
        Math.max(
          0.48,
          Math.min(
            0.82,
            0.68 +
            possessionAdvantage *
              0.005
          )
        );

      const dangerousTurnoverChance =
        Math.max(
          0.07,
          Math.min(
            0.24,
            0.14 -
            possessionAdvantage *
              0.0025
          )
        );

      const roll =
        Math.random();

      if (
        roll <
        cleanBreakoutChance
      ) {
        nextZone =
          'neutral';

        paceContext =
          'transition';

        outcome =
          'successful-breakout';
      } else if (
        roll <
        1 -
        dangerousTurnoverChance
      ) {
        nextZone =
          'defensive';

        paceContext =
          'quiet';

        outcome =
          'breakout-delayed';
      } else {
        nextPossessionSide =
          defendingSide;

        nextZone =
          'offensive';

        paceContext =
          'transition';

        outcome =
          'defensive-zone-turnover';
      }
    }

    /*
     * ==========================================================
     * NEUTRAL ZONE
     * ==========================================================
     *
     * Zone entries, failed entries and possession exchanges.
     */
    if (
      currentZone ===
      'neutral'
    ) {
      /*
       * Base:
       * 52% clean entry
       * 20% retain neutral-zone possession
       * 16% turnover
       * 12% forced regroup
       *
       * This is one of the most important places for skill
       * differentiation. Passing, puck control, awareness and
       * skating now directly compete against defensive structure.
       */
      const cleanEntryChance =
        Math.max(
          0.34,
          Math.min(
            0.70,
            0.52 +
            possessionAdvantage *
              0.006
          )
        );

      const turnoverChance =
        Math.max(
          0.08,
          Math.min(
            0.28,
            0.16 -
            possessionAdvantage *
              0.003
          )
        );

      const regroupChance =
        Math.max(
          0.06,
          Math.min(
            0.22,
            0.12 -
            possessionAdvantage *
              0.002
          )
        );

      const roll =
        Math.random();

      if (
        roll <
        cleanEntryChance
      ) {
        nextZone =
          'offensive';

        paceContext =
          'offensive-zone';

        outcome =
          'successful-zone-entry';
      } else if (
        roll <
        1 -
        turnoverChance -
        regroupChance
      ) {
        nextZone =
          'neutral';

        paceContext =
          'normal';

        outcome =
          'neutral-zone-possession';
      } else if (
        roll <
        1 -
        regroupChance
      ) {
        nextPossessionSide =
          defendingSide;

        nextZone =
          'neutral';

        paceContext =
          'transition';

        outcome =
          'neutral-zone-turnover';
      } else {
        nextZone =
          'defensive';

        paceContext =
          'quiet';

        outcome =
          'regroup';
      }
    }

    /*
     * ==========================================================
     * OFFENSIVE ZONE
     * ==========================================================
     *
     * Sustained pressure, cycling or defensive clearances.
     */
    if (
      currentZone ===
      'offensive'
    ) {
      /*
       * Base:
       * 60% sustained pressure
       * 20% cleared but possession retained
       * 20% defending team wins the puck
       *
       * Strong attacking units stay in the zone longer.
       * Strong defensive units end possessions more often.
       */
      const sustainedPressureChance =
        Math.max(
          0.40,
          Math.min(
            0.76,
            0.60 +
            possessionAdvantage *
              0.005
          )
        );

      const defensiveRecoveryChance =
        Math.max(
          0.10,
          Math.min(
            0.34,
            0.20 -
            possessionAdvantage *
              0.004
          )
        );

      const roll =
        Math.random();

      if (
        roll <
        sustainedPressureChance
      ) {
        nextZone =
          'offensive';

        paceContext =
          'offensive-zone';

        outcome =
          'offensive-pressure';

        flow.pressureLevel =
          Math.min(
            5,
            (
              Number(
                flow.pressureLevel
              ) || 0
            ) + 1
          );
      } else if (
        roll <
        1 -
        defensiveRecoveryChance
      ) {
        nextZone =
          'neutral';

        paceContext =
          'transition';

        outcome =
          'zone-cleared';

        flow.pressureLevel =
          Math.max(
            0,
            (
              Number(
                flow.pressureLevel
              ) || 0
            ) - 2
          );
      } else {
        nextPossessionSide =
          defendingSide;

        nextZone =
          'defensive';

        paceContext =
          'transition';

        outcome =
          'defensive-recovery';

        flow.pressureLevel =
          0;
      }
    }

    /*
     * If possession changed, sustained attacking pressure resets.
     */
    if (
      nextPossessionSide !==
      possessionSide
    ) {
      flow.pressureLevel =
        0;
    }

    flow.possessionSide =
      nextPossessionSide;

    flow.zone =
      nextZone;

    flow.paceContext =
      paceContext;

      flow.lastEventType =
        'possession-advance';

      flow.lastEventSide =
        nextPossessionSide;

      /*
       * A possession-advance represents an actual carry/pass/setup.
       * Give that action to one of the currently deployed puck
       * handlers so future assists have real possession history.
       */
      let possessionPlayer =
        null;

      if (
        nextPossessionSide ===
          possessionSide &&
        possessingSkaters.length > 0
      ) {
        const weightedSkaters =
          possessingSkaters.map(
            player => {
              const canonicalPlayer =
                getPlayerById(
                  player.playerId
                );

              const attributes =
                canonicalPlayer
                  ?.attributes ||
                {};

              const involvementWeight =
                (
                  Number(
                    attributes.passing
                  ) || 50
                ) * 0.40 +
                (
                  Number(
                    attributes.puckControl
                  ) || 50
                ) * 0.35 +
                (
                  Number(
                    attributes
                      .offensiveAwareness
                  ) || 50
                ) * 0.25;

              return {
                player,
                weight:
                  Math.max(
                    10,
                    involvementWeight
                  ),
              };
            }
          );

        const totalWeight =
          weightedSkaters.reduce(
            (sum, entry) =>
              sum + entry.weight,
            0
          );

        let roll =
          Math.random() *
          totalWeight;

        for (
          const entry of
          weightedSkaters
        ) {
          roll -= entry.weight;

          if (roll <= 0) {
            possessionPlayer =
              entry.player;

            break;
          }
        }

        possessionPlayer =
          possessionPlayer ||
          weightedSkaters[0]
            ?.player ||
          null;

        if (possessionPlayer) {
          recordLiveGamePossessionTouch(
            simulation,
            possessionSide,
            possessionPlayer.playerId,
            outcome
          );
        }
      } else {
        /*
         * Possession changed during this advance.
         * Clear the old attacking sequence; the new team starts fresh.
         */
        flow.recentPossessionTouches =
          [];
      }

      const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'possession-advance',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      side:
        nextPossessionSide,

      previousSide:
        possessionSide,

      previousZone:
        currentZone,

      zone:
        nextZone,

      outcome,

        possessionChanged:
          nextPossessionSide !==
          possessionSide,

        playerId:
          possessionPlayer
            ?.playerId ||
          null,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,

      reason:
        'live-game-possession-advanced',

      event,

      possessionSide:
        nextPossessionSide,

      zone:
        nextZone,

      outcome,

      paceContext,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — GOALIE SAVE PROFILE
   * ============================================================
   *
   * Builds an attribute-driven profile for the goalie currently
   * facing a live shot.
   *
   * Overall is deliberately NOT used as a hidden save modifier.
   * A goalie succeeds because the goalie attributes that make up
   * his game are actually strong.
   *
   * Shot-location-specific ratings such as glove / blocker /
   * five-hole will be layered in when shot types and locations
   * are added.
   */
  function getLiveGameGoalieSaveProfile(
    goalieLine
  ) {
    if (
      !goalieLine ||
      !goalieLine.playerId
    ) {
      return {
        success: false,
        reason:
          'goalie-line-missing',
      };
    }

    const canonicalGoalie =
      getPlayerById(
        goalieLine.playerId
      );

    if (!canonicalGoalie) {
      return {
        success: false,
        reason:
          'canonical-goalie-missing',
      };
    }

    const attributes =
      canonicalGoalie
        .attributes ||
      {};

    const clampRating =
      value =>
        Math.max(
          25,
          Math.min(
            99,
            Number(value) || 50
          )
        );

    const reflexes =
      clampRating(
        attributes.reflexes
      );

    const puckTracking =
      clampRating(
        attributes.puckTracking
      );

    const positioning =
      clampRating(
        attributes.positioning
      );

    const lateralMovement =
      clampRating(
        attributes.lateralMovement
      );

    const anticipation =
      clampRating(
        attributes.anticipation
      );

    const composure =
      clampRating(
        attributes.composure
      );

    const consistency =
      clampRating(
        attributes.consistency
      );

    const reboundControl =
      clampRating(
        attributes.reboundControl
      );

    /*
     * ==========================================================
     * CORE SAVE ABILITY
     * ==========================================================
     *
     * Reflexes and tracking matter most on ordinary live shots.
     * Positioning keeps the goalie structurally sound.
     * Lateral movement matters when play moves across the ice.
     * Anticipation and composure represent reading the attack.
     * Consistency adds a smaller stabilizing component.
     */
    const saveAbility =
      reflexes * 0.22 +
      puckTracking * 0.20 +
      positioning * 0.18 +
      lateralMovement * 0.13 +
      anticipation * 0.11 +
      composure * 0.09 +
      consistency * 0.07;

    /*
     * Rebound prevention deserves its own rating because making
     * the initial save and controlling the rebound are different
     * goalie skills.
     */
    const reboundAbility =
      reboundControl * 0.55 +
      positioning * 0.15 +
      puckTracking * 0.12 +
      composure * 0.10 +
      reflexes * 0.08;

    /*
     * Scramble ability becomes especially useful following rebounds
     * or chaotic net-front sequences.
     */
    const scrambleAbility =
      reflexes * 0.28 +
      lateralMovement * 0.22 +
      puckTracking * 0.18 +
      composure * 0.14 +
      anticipation * 0.10 +
      positioning * 0.08;

    return {
      success: true,

      reason:
        'goalie-save-profile-created',

      playerId:
        goalieLine.playerId,

      saveAbility:
        Math.max(
          25,
          Math.min(
            99,
            saveAbility
          )
        ),

      reboundAbility:
        Math.max(
          25,
          Math.min(
            99,
            reboundAbility
          )
        ),

      scrambleAbility:
        Math.max(
          25,
          Math.min(
            99,
            scrambleAbility
          )
        ),

      attributes: {
        reflexes,
        puckTracking,
        positioning,
        lateralMovement,
        anticipation,
        composure,
        consistency,
        reboundControl,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOT TYPE SELECTION
   * ============================================================
   *
   * Chooses the type of shot created by the current possession.
   *
   * This does NOT resolve whether the shot is blocked, missed,
   * saved or scored. It only determines what kind of chance the
   * attacking player is attempting.
   */
  function selectLiveGameShotType(
    simulation,
    shooter
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object' ||
      !simulation.flow ||
      !shooter
    ) {
      return {
        success: false,
        reason:
          'invalid-shot-type-selection',
        shotType: null,
      };
    }

    const flow =
      simulation.flow;

    const canonicalShooter =
      getPlayerById(
        shooter.playerId
      );

    const attributes =
      canonicalShooter
        ?.attributes ||
      {};

    const wristAccuracy =
      Number(
        attributes
          .wristShotAccuracy
      ) || 50;

    const slapAccuracy =
      Number(
        attributes
          .slapShotAccuracy
      ) || 50;

    const slapPower =
      Number(
        attributes
          .slapShotPower
      ) || 50;

    const handEye =
      Number(
        attributes.handEye
      ) || 50;

    const puckControl =
      Number(
        attributes.puckControl
      ) || 50;

    const offensiveAwareness =
      Number(
        attributes
          .offensiveAwareness
      ) || 50;

    const paceContext =
      flow.paceContext ||
      'normal';

    const zone =
      flow.zone ||
      'neutral';

    /*
     * Base shot-type weights.
     *
     * These are intentionally broad starting values and will be
     * calibrated after we validate player-type differentiation.
     */
    const weights = {
      wrist: 44,
      snap: 22,
      slap: 13,
      'one-timer': 8,
      deflection: 5,
      rebound: 5,
      breakaway: 3,
    };

    /*
     * Rebound context should strongly favor immediate follow-up
     * chances rather than ordinary perimeter shots.
     */
    if (
      paceContext ===
      'rebound'
    ) {
      weights.rebound +=
        34;

      weights.deflection +=
        8;

      weights.wrist -=
        15;

      weights.snap -=
        8;

      weights.slap -=
        8;
    }

    /*
     * Net-front scramble:
     * more tips, rebounds and quick-release shots.
     */
    if (
      paceContext ===
      'scramble'
    ) {
      weights.rebound +=
        18;

      weights.deflection +=
        15;

      weights.snap +=
        6;

      weights.slap -=
        7;
    }

    /*
     * Transition hockey creates more rush / quick-release chances.
     */
    if (
      paceContext ===
      'transition'
    ) {
      weights.snap +=
        7;

      weights.breakaway +=
        5;

      weights.slap -=
        3;
    }

    /*
     * Established offensive-zone possession creates more point
     * shots and cross-ice setup opportunities.
     */
    if (
      zone === 'offensive' &&
      (
        paceContext ===
          'offensive-zone' ||
        (
          Number(
            flow.pressureLevel
          ) || 0
        ) >= 2
      )
    ) {
      weights.slap +=
        5;

      weights['one-timer'] +=
        6;

      weights.deflection +=
        3;
    }

    /*
     * Shooter skill can influence what chances they tend to create.
     *
     * This is NOT an archetype bonus. It comes directly from the
     * player's actual attributes.
     */
    weights.slap +=
      Math.max(
        0,
        (
          slapPower +
          slapAccuracy
        ) / 2 -
        65
      ) * 0.12;

    weights.deflection +=
      Math.max(
        0,
        handEye - 65
      ) * 0.10;

    weights['one-timer'] +=
      Math.max(
        0,
        (
          offensiveAwareness +
          wristAccuracy
        ) / 2 -
        68
      ) * 0.10;

    weights.breakaway +=
      Math.max(
        0,
        (
          puckControl +
          offensiveAwareness
        ) / 2 -
        72
      ) * 0.07;

    Object.keys(
      weights
    ).forEach(
      shotType => {
        weights[shotType] =
          Math.max(
            0,
            Number(
              weights[shotType]
            ) || 0
          );
      }
    );

    const entries =
      Object.entries(
        weights
      )
        .filter(
          ([, weight]) =>
            weight > 0
        );

    const totalWeight =
      entries.reduce(
        (
          total,
          [, weight]
        ) =>
          total + weight,
        0
      );

    if (
      totalWeight <= 0
    ) {
      return {
        success: true,
        reason:
          'shot-type-defaulted',
        shotType:
          'wrist',
        weights,
      };
    }

    let roll =
      Math.random() *
      totalWeight;

    let shotType =
      entries[0][0];

    for (
      const [
        candidateType,
        weight,
      ] of entries
    ) {
      roll -= weight;

      if (
        roll <= 0
      ) {
        shotType =
          candidateType;

        break;
      }
    }

    return {
      success: true,

      reason:
        'shot-type-selected',

      shotType,

      weights,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOT ATTEMPT RESOLUTION
   * ============================================================
   *
   * Resolves one shot attempt into:
   *
   * blocked
   * missed
   * saved
   * goal
   *
   * Uses real deployed players, canonical attributes, current
   * zone pressure, and the defending goalie.
   */
  function resolveLiveGameShotAttempt(
    simulation,
    forcedShooterPlayerId = null,
    forcedShotType = null
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    const flow =
      simulation.flow &&
      typeof simulation.flow === 'object'
        ? simulation.flow
        : null;

    if (
      !flow ||
      flow.stopped === true
    ) {
      return {
        success: false,
        reason:
          'live-game-not-in-flowing-play',
        event: null,
      };
    }

    const attackingSide =
      flow.possessionSide;

    if (
      attackingSide !== 'home' &&
      attackingSide !== 'away'
    ) {
      return {
        success: false,
        reason:
          'shot-possession-side-missing',
        event: null,
      };
    }

    const defendingSide =
      attackingSide === 'home'
        ? 'away'
        : 'home';

    const attackingDeployment =
      attackingSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const defendingDeployment =
      defendingSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    if (
      !attackingDeployment ||
      !defendingDeployment
    ) {
      return {
        success: false,
        reason:
          'shot-deployment-missing',
        event: null,
      };
    }

    const attackingSkaters =
      Array.isArray(
        attackingDeployment.skaters
      )
        ? attackingDeployment.skaters
        : [];

    const defendingSkaters =
      Array.isArray(
        defendingDeployment.skaters
      )
        ? defendingDeployment.skaters
        : [];

    const goalie =
      defendingDeployment.goalie ||
      null;

    if (
      attackingSkaters.length === 0 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'shot-participants-missing',
        event: null,
      };
    }

    /*
     * Choose the shooter using offensive involvement rather than
     * giving every skater equal odds.
     */
    const shooterEntries =
      attackingSkaters.map(
        player => {
          const canonicalPlayer =
            getPlayerById(
              player.playerId
            );

          const attributes =
            canonicalPlayer
              ?.attributes ||
            {};

          const shootingScore =
            (
              Number(
                attributes
                  .wristShotAccuracy
              ) || 50
            ) * 0.35 +
            (
              Number(
                attributes
                  .wristShotPower
              ) || 50
            ) * 0.15 +
            (
              Number(
                attributes
                  .offensiveAwareness
              ) || 50
            ) * 0.30 +
            (
              Number(
                attributes
                  .puckControl
              ) || 50
            ) * 0.20;

          return {
            player,
            weight:
              Math.max(
                10,
                shootingScore
              ),
          };
        }
      );

    const totalShooterWeight =
      shooterEntries.reduce(
        (sum, entry) =>
          sum +
          entry.weight,
        0
      );

    let shooterRoll =
      Math.random() *
      totalShooterWeight;

    let shooter =
      shooterEntries[0]
        ?.player ||
      attackingSkaters[0];

    for (
      const entry of
      shooterEntries
    ) {
      shooterRoll -=
        entry.weight;

      if (shooterRoll <= 0) {
        shooter =
          entry.player;

        break;
      }
    }

if (forcedShooterPlayerId) {
  const forcedShooter =
    attackingSkaters.find(
      player =>
        String(player?.playerId || '') ===
        String(forcedShooterPlayerId)
    ) ||
    null;

  if (forcedShooter) {
    shooter =
      forcedShooter;
  }
}

const shooterPlayer =
  getPlayerById(
    shooter.playerId
  );

    const goaliePlayer =
      getPlayerById(
        goalie.playerId
      );

    const shooterAttributes =
      shooterPlayer
        ?.attributes ||
      {};

    const goalieAttributes =
      goaliePlayer
        ?.attributes ||
      {};

    /*
     * Choose one defending skater as the primary blocker threat.
     */
    const blocker =
      defendingSkaters[
        Math.floor(
          Math.random() *
          defendingSkaters.length
        )
      ] ||
      null;

    const blockerPlayer =
      blocker
        ? getPlayerById(
            blocker.playerId
          )
        : null;

    const blockerAttributes =
      blockerPlayer
        ?.attributes ||
      {};

    const shotTypeSelection =
      selectLiveGameShotType(
        simulation,
        shooter
      );

    if (
      !shotTypeSelection ||
      shotTypeSelection.success !== true
    ) {
      return {
        success: false,
        reason:
          shotTypeSelection?.reason ||
          'shot-type-selection-failed',
        event: null,
      };
    }

    const allowedForcedShotTypes =
      new Set([
        'wrist',
        'snap',
        'slap',
        'one-timer',
        'deflection',
        'rebound',
        'breakaway',
      ]);

    const shotType =
      allowedForcedShotTypes.has(
        String(forcedShotType || '')
      )
        ? String(forcedShotType)
        : shotTypeSelection.shotType ||
          'wrist';

    /*
     * ==========================================================
     * SHOT-TYPE ATTRIBUTE PROFILE
     * ==========================================================
     *
     * Different shot types emphasize different skills.
     * Overall is never used as a hidden finishing modifier.
     */
    const wristAccuracy =
      Number(
        shooterAttributes
          .wristShotAccuracy
      ) || 50;

    const wristPower =
      Number(
        shooterAttributes
          .wristShotPower
      ) || 50;

    const slapAccuracy =
      Number(
        shooterAttributes
          .slapShotAccuracy
      ) || 50;

    const slapPower =
      Number(
        shooterAttributes
          .slapShotPower
      ) || 50;

    const handEye =
      Number(
        shooterAttributes.handEye
      ) || 50;

    const puckControl =
      Number(
        shooterAttributes
          .puckControl
      ) || 50;

    const deking =
      Number(
        shooterAttributes.deking
      ) || 50;

    const offensiveAwareness =
      Number(
        shooterAttributes
          .offensiveAwareness
      ) || 50;

    let shotAccuracy =
      wristAccuracy;

    let shotPower =
      wristPower;

    let finishingAbility =
      (
        wristAccuracy * 0.58 +
        wristPower * 0.17 +
        offensiveAwareness *
          0.25
      );

    switch (shotType) {
      case 'snap':
        shotAccuracy =
          wristAccuracy * 0.72 +
          puckControl * 0.18 +
          offensiveAwareness *
            0.10;

        shotPower =
          wristPower * 0.82 +
          slapPower * 0.18;

        finishingAbility =
          shotAccuracy * 0.55 +
          shotPower * 0.18 +
          offensiveAwareness *
            0.27;
        break;

      case 'slap':
        shotAccuracy =
          slapAccuracy;

        shotPower =
          slapPower;

        finishingAbility =
          slapAccuracy * 0.46 +
          slapPower * 0.34 +
          offensiveAwareness *
            0.20;
        break;

      case 'one-timer':
        shotAccuracy =
          (
            wristAccuracy *
              0.38 +
            slapAccuracy *
              0.32 +
            offensiveAwareness *
              0.20 +
            handEye *
              0.10
          );

        shotPower =
          wristPower * 0.35 +
          slapPower * 0.65;

        finishingAbility =
          shotAccuracy * 0.48 +
          shotPower * 0.27 +
          offensiveAwareness *
            0.15 +
          handEye * 0.10;
        break;

      case 'deflection':
        shotAccuracy =
          handEye * 0.52 +
          offensiveAwareness *
            0.30 +
          wristAccuracy * 0.18;

        shotPower =
          48 +
          handEye * 0.30;

        finishingAbility =
          handEye * 0.48 +
          offensiveAwareness *
            0.32 +
          wristAccuracy * 0.20;
        break;

      case 'rebound':
        shotAccuracy =
          wristAccuracy * 0.34 +
          handEye * 0.30 +
          offensiveAwareness *
            0.24 +
          puckControl * 0.12;

        shotPower =
          wristPower * 0.60 +
          handEye * 0.20 +
          puckControl * 0.20;

        finishingAbility =
          shotAccuracy * 0.44 +
          offensiveAwareness *
            0.26 +
          handEye * 0.20 +
          puckControl * 0.10;
        break;

      case 'breakaway':
        shotAccuracy =
          wristAccuracy * 0.32 +
          deking * 0.30 +
          puckControl * 0.22 +
          offensiveAwareness *
            0.16;

        shotPower =
          wristPower * 0.65 +
          puckControl * 0.20 +
          deking * 0.15;

        finishingAbility =
          deking * 0.30 +
          puckControl * 0.25 +
          wristAccuracy * 0.23 +
          offensiveAwareness *
            0.22;
        break;

      case 'wrist':
      default:
        break;
    }

    /*
     * Keep all derived ratings inside the same scale as the rest
     * of the simulation.
     */
    shotAccuracy =
      Math.max(
        25,
        Math.min(
          99,
          shotAccuracy
        )
      );

    shotPower =
      Math.max(
        25,
        Math.min(
          99,
          shotPower
        )
      );

    finishingAbility =
      Math.max(
        25,
        Math.min(
          99,
          finishingAbility
        )
      );

    const blockingAbility =
      blockerPlayer
        ? Math.max(
            25,
            Math.min(
              99,
              (
                Number(
                  blockerAttributes
                    .shotBlocking
                ) || 50
              ) * 0.70 +
              (
                Number(
                  blockerAttributes
                    .defensiveAwareness
                ) || 50
              ) * 0.30
            )
          )
        : 45;

    const goalieProfile =
      getLiveGameGoalieSaveProfile(
        goalie
      );

    if (
      !goalieProfile ||
      goalieProfile.success !== true
    ) {
      return {
        success: false,
        reason:
          goalieProfile?.reason ||
          'goalie-save-profile-failed',
        event: null,
      };
    }

    /*
     * Normal shots primarily use the standard save profile.
     *
     * Rebounds and scramble sequences are more chaotic, so the
     * goalie's scramble ability matters substantially more.
     */
    /*
     * ==========================================================
     * SHOT-TYPE GOALIE RESPONSE
     * ==========================================================
     *
     * Different chances stress different goalie skills.
     */
    let goalieAbility =
      goalieProfile
        .saveAbility;

    switch (shotType) {
      case 'one-timer':
        goalieAbility =
          goalieProfile
            .saveAbility * 0.40 +
          goalieProfile
            .scrambleAbility * 0.35 +
          goalieProfile
            .attributes
            .lateralMovement * 0.25;
        break;

      case 'deflection':
        goalieAbility =
          goalieProfile
            .saveAbility * 0.34 +
          goalieProfile
            .scrambleAbility * 0.36 +
          goalieProfile
            .attributes
            .puckTracking * 0.30;
        break;

      case 'rebound':
        goalieAbility =
          goalieProfile
            .scrambleAbility * 0.50 +
          goalieProfile
            .reboundAbility * 0.30 +
          goalieProfile
            .attributes
            .reflexes * 0.20;
        break;

      case 'breakaway':
        goalieAbility =
          goalieProfile
            .attributes
            .anticipation * 0.27 +
          goalieProfile
            .attributes
            .composure * 0.24 +
          goalieProfile
            .attributes
            .reflexes * 0.20 +
          goalieProfile
            .attributes
            .lateralMovement * 0.17 +
          goalieProfile
            .attributes
            .positioning * 0.12;
        break;

      case 'slap':
        goalieAbility =
          goalieProfile
            .attributes
            .puckTracking * 0.27 +
          goalieProfile
            .attributes
            .positioning * 0.25 +
          goalieProfile
            .attributes
            .reflexes * 0.23 +
          goalieProfile
            .saveAbility * 0.25;
        break;

      case 'snap':
        goalieAbility =
          goalieProfile
            .attributes
            .reflexes * 0.29 +
          goalieProfile
            .attributes
            .positioning * 0.23 +
          goalieProfile
            .attributes
            .puckTracking * 0.22 +
          goalieProfile
            .saveAbility * 0.26;
        break;

      case 'wrist':
      default:
        goalieAbility =
          goalieProfile
            .saveAbility;
        break;
    }

    goalieAbility =
      Math.max(
        25,
        Math.min(
          99,
          goalieAbility
        )
      );

    const pressureLevel =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            flow.pressureLevel
          ) || 0
        )
      );

    /*
     * Shot quality improves during sustained offensive pressure.
     */
    const pressureBonus =
      pressureLevel * 1.8;

    /*
     * Resolve block chance first.
     */
    const blockChance =
      Math.max(
        0.16,
        Math.min(
          0.42,
          0.26 +
          (
            blockingAbility - 60
          ) * 0.0025 -
          (
            shotPower - 60
          ) * 0.0008 +
          pressureLevel * 0.004
        )
      );

    const blockRoll =
      Math.random();

    if (
      blockRoll <
      blockChance
    ) {
      shooter.shots =
        (
          Number(
            shooter.shots
          ) || 0
        );

      if (blocker) {
        blocker.blockedShots =
          (
            Number(
              blocker.blockedShots
            ) || 0
          ) + 1;
      }

      const attackingTeamState =
        attackingSide === 'home'
          ? simulation.home
          : simulation.away;

      const defendingTeamState =
        defendingSide === 'home'
          ? simulation.home
          : simulation.away;

      defendingTeamState
        .blockedShots =
        (
          Number(
            defendingTeamState
              .blockedShots
          ) || 0
        ) + 1;

      flow.paceContext =
        Math.random() < 0.45
          ? 'scramble'
          : 'normal';

      flow.pressureLevel =
        Math.min(
          5,
          pressureLevel + 1
        );

      flow.lastEventType =
        'shot-blocked';

      flow.lastEventSide =
        attackingSide;

      const event = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'shot-blocked',

        period:
          simulation.period,

        clockSecondsRemaining:
          simulation
            .clockSecondsRemaining,

        side:
          attackingSide,

        teamId:
          attackingTeamState
            .teamId,

          shooterPlayerId:
            shooter.playerId,

          shotType,

          blockerPlayerId:
          blocker?.playerId ||
          null,
      };

      simulation.events.push(
        event
      );

      return {
        success: true,
        reason:
          'live-game-shot-blocked',
        outcome:
          'blocked',
        event,
      };
    }

    /*
     * Then resolve whether the attempt misses the net.
     */
    const missChance =
      Math.max(
        0.10,
        Math.min(
          0.34,
          0.25 -
          (
            shotAccuracy - 60
          ) * 0.003 -
          pressureBonus * 0.002
        )
      );

    if (
      Math.random() <
      missChance
    ) {
      flow.paceContext =
        'normal';

      flow.pressureLevel =
        Math.max(
          0,
          pressureLevel - 1
        );

      flow.lastEventType =
        'shot-missed';

      flow.lastEventSide =
        attackingSide;

      const event = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'shot-missed',

        period:
          simulation.period,

        clockSecondsRemaining:
          simulation
            .clockSecondsRemaining,

        side:
          attackingSide,

        teamId:
          (
            attackingSide ===
            'home'
              ? simulation.home
              : simulation.away
          ).teamId,

        shooterPlayerId:
          shooter.playerId,
        
        shotType,
      };

      simulation.events.push(
        event
      );

      return {
        success: true,
        reason:
          'live-game-shot-missed',
        outcome:
          'missed',
        event,
      };
    }

    /*
     * At this point the puck reached the net.
     * Team and shooter receive an official shot.
     */
    const attackingTeamState =
      attackingSide === 'home'
        ? simulation.home
        : simulation.away;

    attackingTeamState.shots =
      (
        Number(
          attackingTeamState.shots
        ) || 0
      ) + 1;

    shooter.shots =
      (
        Number(
          shooter.shots
        ) || 0
      ) + 1;

    goalie.shotsAgainst =
      (
        Number(
          goalie.shotsAgainst
        ) || 0
      ) + 1;

    /*
     * ==========================================================
     * SHOT SCORING PROBABILITY
     * ==========================================================
     *
     * Even-strength finishing remains driven by:
     * - shooter finishing ability
     * - goalie ability
     * - sustained offensive pressure
     *
     * Power-play shots receive a modest chance-quality increase.
     * This represents the extra passing lane, goalie movement and
     * open ice created by the manpower advantage.
     *
     * Importantly, PP quality still matters:
     * a strong PP against a weak PK receives a larger benefit than
     * a weak PP attacking an elite penalty kill.
     */
    const scoringSpecialTeamsMatchup =
      getLiveGameSpecialTeamsMatchup(
        simulation
      );

    const isPowerPlayShot =
      scoringSpecialTeamsMatchup
        ?.success === true &&
      scoringSpecialTeamsMatchup
        .powerPlaySide ===
        attackingSide;

    let powerPlayScoringBonus =
      0;

    if (isPowerPlayShot) {
      const specialTeamsAdvantage =
        Math.max(
          -15,
          Math.min(
            30,
            Number(
              scoringSpecialTeamsMatchup
                .totalAdvantage
            ) || 0
          )
        );

      /*
       * Typical 5-on-4:
       * roughly +2.5 to +3.5 percentage points of shot quality.
       *
       * Excellent PP vs poor PK:
       * can push toward roughly +4.5 points.
       *
       * Strong PK:
       * suppresses much of the extra danger.
       */
      powerPlayScoringBonus =
        Math.max(
          0.015,
          Math.min(
            0.045,
            0.024 +
            specialTeamsAdvantage *
              0.0007
          )
        );

      /*
       * A two-man advantage should create an additional bump without
       * turning 5-on-3 shots into automatic goals.
       */
      if (
        scoringSpecialTeamsMatchup
          .manpowerAdvantage >= 2
      ) {
        powerPlayScoringBonus +=
          0.008;
      }
    }

    const scoringChance =
      Math.max(
        0.05,
        Math.min(
          0.28,
          0.102 +
          (
            finishingAbility -
            goalieAbility
          ) * 0.002 +
          pressureLevel * 0.008 +
          powerPlayScoringBonus
        )
      );

    if (
      Math.random() <
      scoringChance
    ) {
          attackingTeamState.score =
            (
              Number(
                attackingTeamState.score
              ) || 0
            ) + 1;

          /*
           * ==========================================================
           * POWER-PLAY GOAL RESOLUTION
           * ==========================================================
           *
           * If the attacking team scores while it owns the active
           * power play, credit the PPG and expire one standard minor
           * against the defending team.
           */
          let powerPlayGoal =
            false;

          const specialTeams =
            simulation.specialTeams &&
            typeof simulation.specialTeams === 'object'
              ? simulation.specialTeams
              : null;

          if (
            specialTeams &&
            specialTeams.situation === 'power-play' &&
            specialTeams.powerPlaySide === attackingSide &&
            specialTeams.penaltyKillSide === defendingSide
          ) {
            powerPlayGoal =
              true;

            attackingTeamState.powerPlayGoals =
              (
                Number(
                  attackingTeamState.powerPlayGoals
                ) || 0
              ) + 1;

            const activePenalties =
              Array.isArray(
                specialTeams.activePenalties
              )
                ? specialTeams.activePenalties
                : [];

            const expiringPenalty =
              activePenalties.find(
                penalty =>
                  penalty &&
                  penalty.active === true &&
                  penalty.penalizedSide === defendingSide &&
                  Number(
                    penalty.minutes
                  ) === 2
              ) ||
              null;

            if (expiringPenalty) {
              expiringPenalty.active =
                false;

              expiringPenalty.secondsRemaining =
                0;

              specialTeams.activePenalties =
                activePenalties.filter(
                  penalty =>
                    penalty &&
                    penalty.active === true
                );
            }

            /*
             * Recalculate manpower from every penalty that remains active.
             *
             * This is the authoritative path for restoring manpower after
             * a power-play goal.
             *
             * Examples:
             *
             * 5v4 + PPG
             *   -> expired minor removed
             *   -> 5v5
             *
             * 5v3 + PPG
             *   -> one minor removed
             *   -> remaining minor produces 5v4
             *
             * 4v3 + PPG
             *   -> manpower is rebuilt from whatever penalties remain
             *
             * We deliberately do not hardcode 5v5 / 5v4 here because the
             * correct state depends on the complete active-penalty stack.
             */
            const manpowerRefresh =
              refreshLiveGameManpowerState(
                simulation
              );

            if (
              !manpowerRefresh ||
              manpowerRefresh.success !== true
            ) {
              return {
                success: false,

                reason:
                  manpowerRefresh?.reason ||
                  'power-play-goal-manpower-refresh-failed',

                event: null,
              };
            }
          }

          /*
           * ==========================================================
           * PLUS / MINUS
           * ==========================================================
           *
           * Even-strength goals:
           *   scoring skaters on ice     +1
           *   defending skaters on ice   -1
           *
           * Shorthanded goals use the same rule.
           *
           * Power-play goals do NOT affect plus/minus.
           * Goalies never receive plus/minus.
           */
          if (!powerPlayGoal) {
            attackingSkaters.forEach(
              player => {
                if (!player) {
                  return;
                }

                player.plusMinus =
                  (
                    Number(
                      player.plusMinus
                    ) || 0
                  ) + 1;
              }
            );

            defendingSkaters.forEach(
              player => {
                if (!player) {
                  return;
                }

                player.plusMinus =
                  (
                    Number(
                      player.plusMinus
                    ) || 0
                  ) - 1;
              }
            );
          }

          shooter.goals =
          (
            Number(
              shooter.goals
            ) || 0
          ) + 1;

        /*
         * ==========================================================
         * ASSIST ATTRIBUTION
         * ==========================================================
         *
         * Use recent uninterrupted possession history rather than
         * randomly selecting teammates.
         *
         * Most goals receive one or two assists, but unassisted goals
         * remain possible.
         */
        const recentTouches =
          Array.isArray(
            flow.recentPossessionTouches
          )
            ? flow.recentPossessionTouches
            : [];

        const assistCandidates = [];

        for (
          let index =
            recentTouches.length - 1;
          index >= 0;
          index -= 1
        ) {
          const touch =
            recentTouches[index];

          if (
            !touch ||
            touch.side !== attackingSide ||
            !touch.playerId ||
            String(
              touch.playerId
            ) ===
              String(
                shooter.playerId
              )
          ) {
            continue;
          }

          if (
            assistCandidates.some(
              candidate =>
                String(
                  candidate.playerId
                ) ===
                String(
                  touch.playerId
                )
            )
          ) {
            continue;
          }

          assistCandidates.push(
            touch
          );

          if (
            assistCandidates.length >= 2
          ) {
            break;
          }
        }

        /*
         * Hockey goals are usually assisted, but not always.
         *
         * The most recent valid possession contributor is the primary
         * assist candidate. The next unique contributor is secondary.
         */
        let primaryAssist =
          null;

        let secondaryAssist =
          null;

        if (
          assistCandidates.length > 0 &&
          Math.random() < 0.91
        ) {
          primaryAssist =
            assistCandidates[0];
        }

        if (
          primaryAssist &&
          assistCandidates.length > 1 &&
          Math.random() < 0.74
        ) {
          secondaryAssist =
            assistCandidates[1];
        }

        const creditAssist =
          assistTouch => {
            if (!assistTouch) {
              return null;
            }

            const assistPlayer =
              attackingSkaters.find(
                player =>
                  String(
                    player.playerId
                  ) ===
                  String(
                    assistTouch.playerId
                  )
              ) ||
              null;

            if (!assistPlayer) {
              return null;
            }

            assistPlayer.assists =
              (
                Number(
                  assistPlayer.assists
                ) || 0
              ) + 1;

            assistPlayer.points =
              (
                Number(
                  assistPlayer.goals
                ) || 0
              ) +
              (
                Number(
                  assistPlayer.assists
                ) || 0
              );

            return assistPlayer;
          };

        const primaryAssistPlayer =
          creditAssist(
            primaryAssist
          );

        const secondaryAssistPlayer =
          creditAssist(
            secondaryAssist
          );

        shooter.points =
          (
            Number(
              shooter.goals
            ) || 0
          ) +
          (
            Number(
              shooter.assists
            ) || 0
          );

        goalie.goalsAgainst =
        (
          Number(
            goalie.goalsAgainst
          ) || 0
        ) + 1;

      flow.stopped = true;

      flow.stoppageReason =
        'goal';

      flow.paceContext =
        'after-faceoff';

      flow.zone =
        'neutral';

      flow.possessionSide =
        null;

      flow.pressureLevel =
        0;

      flow.lastEventType =
        'goal';

      flow.lastEventSide =
        attackingSide;

      /*
       * Overtime is sudden death.
       *
       * Any goal scored in period 4 immediately completes the game.
       */
      const overtimeWinningGoal =
        simulation.period === 4;

      if (overtimeWinningGoal) {
        simulation
          .overtimeComplete =
          true;

        simulation.gameComplete =
          true;

        simulation.status =
          'completed';

        simulation.resultType =
          'overtime';

        simulation.winnerSide =
          attackingSide;

        simulation.loserSide =
          defendingSide;
      }

      const event = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'goal',

        period:
          simulation.period,

        clockSecondsRemaining:
          simulation
            .clockSecondsRemaining,

        side:
          attackingSide,

        teamId:
          attackingTeamState
            .teamId,

          scorerPlayerId:
            shooter.playerId,

          shotType,

          primaryAssistPlayerId:
          primaryAssistPlayer
            ?.playerId ||
          null,

        secondaryAssistPlayerId:
          secondaryAssistPlayer
            ?.playerId ||
          null,

          goaliePlayerId:
            goalie.playerId,

            powerPlayGoal,

            overtimeGoal:
              overtimeWinningGoal,

            gameWinningGoal:
              overtimeWinningGoal,

            homeScore:
          simulation.home.score,

        awayScore:
          simulation.away.score,
      };

      simulation.events.push(
        event
      );

      simulation.scoringEvents.push(
        event
      );

      /*
       * A goal ends the current possession sequence.
       * The next possession begins after the center-ice faceoff.
       */
      flow.recentPossessionTouches =
        [];

      return {
        success: true,
        reason:
          'live-game-goal-scored',
        outcome:
          'goal',
        event,
      };
    }

    /*
     * Otherwise the goalie makes the save.
     */
    goalie.saves =
      (
        Number(
          goalie.saves
        ) || 0
      ) + 1;

    const reboundControl =
      goalieProfile
        .reboundAbility;

    const reboundChance =
      Math.max(
        0.12,
        Math.min(
          0.42,
          0.30 -
          (
            reboundControl - 60
          ) * 0.003 +
          pressureLevel * 0.015
        )
      );

    const rebound =
      Math.random() <
      reboundChance;

    if (rebound) {
      flow.paceContext =
        'rebound';

      flow.zone =
        'offensive';

      flow.pressureLevel =
        Math.min(
          5,
          pressureLevel + 1
        );
    } else {
      /*
       * Non-rebound save may either freeze the puck or send play
       * back into normal flow.
       */
      const freezeChance =
        Math.max(
          0.25,
          Math.min(
            0.65,
            0.42 +
            (
              reboundControl - 60
            ) * 0.004
          )
        );

      if (
        Math.random() <
        freezeChance
      ) {
        flow.stopped =
          true;

        flow.stoppageReason =
          'goalie-freeze';

        flow.paceContext =
          'after-faceoff';
      } else {
        flow.paceContext =
          'normal';

        flow.pressureLevel =
          Math.max(
            0,
            pressureLevel - 1
          );
      }
    }

    flow.lastEventType =
      'shot-saved';

    flow.lastEventSide =
      attackingSide;

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'shot-saved',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      side:
        attackingSide,

      teamId:
        attackingTeamState
          .teamId,

        shooterPlayerId:
          shooter.playerId,

        shotType,

        goaliePlayerId:
        goalie.playerId,

      rebound,

      frozen:
        flow.stopped === true,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,
      reason:
        'live-game-shot-saved',
      outcome:
        'saved',
      rebound,
      event,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — HIT RESOLUTION
   * ============================================================
   */
/*
 * ============================================================
 * LIVE GAME — CAREER PLAYER PASS DECISION
 * ============================================================
 */
function resolveLiveGameCareerPass(
  simulation,
  playerId,
  passStyle = 'pass'
) {
  const flow =
    simulation?.flow ||
    null;

  const side =
    flow?.possessionSide ||
    null;

  if (
    !flow ||
    flow.stopped === true ||
    !playerId ||
    (side !== 'home' && side !== 'away')
  ) {
    return {
      success: false,
      reason: 'career-pass-context-invalid',
      event: null,
    };
  }

  const deployment =
    side === 'home'
      ? flow.homeDeployment
      : flow.awayDeployment;

  const defendingDeployment =
    side === 'home'
      ? flow.awayDeployment
      : flow.homeDeployment;

  const passer =
    (Array.isArray(deployment?.skaters)
      ? deployment.skaters
      : []
    ).find(
      player =>
        String(player?.playerId || '') ===
        String(playerId)
    ) ||
    null;

  if (!passer) {
    return {
      success: false,
      reason: 'career-passer-not-deployed',
      event: null,
    };
  }

  const passerAttributes =
    getPlayerById(playerId)
      ?.attributes ||
    {};

  const passSkill =
    (Number(passerAttributes.passing) || 50) * 0.44 +
    (Number(passerAttributes.puckControl) || 50) * 0.22 +
    (Number(passerAttributes.offensiveAwareness) || 50) * 0.21 +
    (Number(passerAttributes.poise) || 50) * 0.13;

  const defenders =
    Array.isArray(defendingDeployment?.skaters)
      ? defendingDeployment.skaters
      : [];

  const defensivePressure =
    defenders.length
      ? defenders.reduce(
          (total, defender) => {
            const attrs =
              getPlayerById(defender.playerId)
                ?.attributes ||
              {};
            return total +
              (Number(attrs.stickChecking) || 50) * 0.55 +
              (Number(attrs.defensiveAwareness) || 50) * 0.45;
          },
          0
        ) / defenders.length
      : 50;

  const passStyleConfig =
    {
      'pass': { success: 0, pressure: 1.25 },
      'pass-trailer': { success: 0.03, pressure: 1.35 },
      'pass-safe': { success: 0.09, pressure: 0.70 },
      'pass-seam': { success: -0.08, pressure: 1.85 },
      'pass-backdoor': { success: -0.11, pressure: 2.15 },
    }[passStyle] ||
    { success: 0, pressure: 1.25 };

  const successChance =
    Math.max(
      0.34,
      Math.min(
        0.95,
        0.70 +
        passStyleConfig.success +
        (passSkill - defensivePressure) * 0.006
      )
    );

  const completed =
    Math.random() < successChance;

  if (completed) {
    flow.zone =
      flow.zone === 'defensive'
        ? 'neutral'
        : 'offensive';
    flow.paceContext =
      'offensive-zone';
    flow.pressureLevel =
      Math.min(
        5,
        (Number(flow.pressureLevel) || 0) +
        passStyleConfig.pressure
      );
    flow.lastEventType =
      'career-pass';
    flow.lastEventSide =
      side;

    recordLiveGamePossessionTouch(
      simulation,
      side,
      playerId,
      'career-pass'
    );

    const event = {
      id: `live-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'career-pass',
      period: simulation.period,
      clockSecondsRemaining: simulation.clockSecondsRemaining,
      side,
      playerId,
      completed: true,
      successChance,
      passStyle,
    };

    simulation.events.push(event);

    return {
      success: true,
      reason: 'career-pass-completed',
      completed: true,
      event,
    };
  }

  const defendingSide =
    side === 'home'
      ? 'away'
      : 'home';
  const attackingTeam =
    side === 'home'
      ? simulation.home
      : simulation.away;

  attackingTeam.giveaways =
    (Number(attackingTeam.giveaways) || 0) + 1;
  passer.giveaways =
    (Number(passer.giveaways) || 0) + 1;

  flow.possessionSide =
    defendingSide;
  flow.zone =
    flow.zone === 'offensive'
      ? 'defensive'
      : flow.zone === 'defensive'
        ? 'offensive'
        : 'neutral';
  flow.paceContext =
    'transition';
  flow.pressureLevel =
    0;
  flow.recentPossessionTouches =
    [];
  flow.lastEventType =
    'giveaway';
  flow.lastEventSide =
    defendingSide;

  const event = {
    id: `live-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'turnover',
    period: simulation.period,
    clockSecondsRemaining: simulation.clockSecondsRemaining,
    giveawaySide: side,
    takeawaySide: defendingSide,
    giveawayPlayerId: playerId,
    takeawayPlayerId: null,
    creditedTakeaway: false,
    possessionChanged: true,
    careerDecision: passStyle,
    passStyle,
    successChance,
  };

  simulation.events.push(event);

  return {
    success: true,
    reason: 'career-pass-missed',
    completed: false,
    event,
  };
}

  function resolveLiveGameCareerDefense(
    simulation,
    playerId,
    action
  ) {
    if (!simulation || !simulation.flow || !playerId) {
      return { success: false, reason: 'invalid-career-defense-state', event: null };
    }

    const flow = simulation.flow;
    const careerPlayer = getPlayerById(playerId);
    if (!careerPlayer) {
      return { success: false, reason: 'career-defender-not-found', event: null };
    }

    const homeOnIce = Array.isArray(flow.homeDeployment?.skaters)
      ? flow.homeDeployment.skaters : [];
    const awayOnIce = Array.isArray(flow.awayDeployment?.skaters)
      ? flow.awayDeployment.skaters : [];
    const careerSide = homeOnIce.some(p => String(p.playerId) === String(playerId))
      ? 'home'
      : awayOnIce.some(p => String(p.playerId) === String(playerId))
        ? 'away' : null;

    if (!careerSide || flow.possessionSide === careerSide) {
      return { success: false, reason: 'career-defense-context-missing', event: null };
    }

    const attackingSide = flow.possessionSide;
    const attackingDeployment = attackingSide === 'home'
      ? flow.homeDeployment : flow.awayDeployment;
    const attackers = Array.isArray(attackingDeployment?.skaters)
      ? attackingDeployment.skaters : [];
    const attrs = careerPlayer.attributes || {};

    const attackerPressure = attackers.length
      ? attackers.reduce((sum, skater) => {
          const p = getPlayerById(skater.playerId)?.attributes || {};
          return sum + (Number(p.puckControl) || 50) * 0.45 +
            (Number(p.offensiveAwareness) || 50) * 0.35 +
            (Number(p.skating) || Number(p.acceleration) || 50) * 0.20;
        }, 0) / attackers.length
      : 50;

    let defenseSkill = 50;
    let baseChance = 0.50;
    let pressureReduction = 1;
    let turnoverBonus = 0;

    if (action === 'defend-stick') {
      defenseSkill = (Number(attrs.stickChecking) || 50) * 0.50 +
        (Number(attrs.defensiveAwareness) || 50) * 0.35 +
        (Number(attrs.acceleration) || Number(attrs.skating) || 50) * 0.15;
      baseChance = 0.52;
      pressureReduction = 1.6;
      turnoverBonus = 0.28;
    } else if (action === 'defend-body') {
      defenseSkill = (Number(attrs.bodyChecking) || 50) * 0.50 +
        (Number(attrs.strength) || 50) * 0.30 +
        (Number(attrs.aggression) || 50) * 0.20;
      baseChance = 0.44;
      pressureReduction = 2.0;
      turnoverBonus = 0.34;
    } else {
      defenseSkill = (Number(attrs.defensiveAwareness) || 50) * 0.55 +
        (Number(attrs.stickChecking) || 50) * 0.20 +
        (Number(attrs.skating) || Number(attrs.acceleration) || 50) * 0.25;
      baseChance = 0.62;
      pressureReduction = 1.35;
      turnoverBonus = 0.12;
    }

    const successChance = Math.max(0.28, Math.min(0.88,
      baseChance + (defenseSkill - attackerPressure) * 0.006));
    const succeeded = Math.random() < successChance;
    const pressureBefore = Number(flow.pressureLevel) || 0;
    let possessionChanged = false;

    if (succeeded) {
      flow.pressureLevel = Math.max(0, pressureBefore - pressureReduction);
      possessionChanged = Math.random() < Math.min(0.82, 0.30 + turnoverBonus +
        (defenseSkill - attackerPressure) * 0.004);

      if (possessionChanged) {
        flow.possessionSide = careerSide;
        flow.zone = flow.zone === 'offensive' ? 'defensive'
          : flow.zone === 'defensive' ? 'offensive' : 'neutral';
        flow.paceContext = 'transition';
        flow.pressureLevel = 0;
        flow.recentPossessionTouches = [];
        const teamState = careerSide === 'home' ? simulation.home : simulation.away;
        teamState.takeaways = (Number(teamState.takeaways) || 0) + 1;
        careerPlayer.takeaways = (Number(careerPlayer.takeaways) || 0) + 1;
      } else {
        flow.paceContext = 'normal';
      }

      if (action === 'defend-body') {
        const teamState = careerSide === 'home' ? simulation.home : simulation.away;
        teamState.hits = (Number(teamState.hits) || 0) + 1;
        careerPlayer.hits = (Number(careerPlayer.hits) || 0) + 1;
      }
    } else {
      flow.pressureLevel = Math.min(5, pressureBefore + (action === 'defend-body' ? 0.75 : 0.45));
      flow.paceContext = flow.zone === 'offensive' ? 'offensive-zone' : 'normal';
    }

    flow.lastEventType = 'career-defense';
    flow.lastEventSide = careerSide;

    const event = {
      id: `live-event-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      type: 'career-defense',
      period: simulation.period,
      clockSecondsRemaining: simulation.clockSecondsRemaining,
      side: careerSide,
      playerId,
      defenseAction: action,
      succeeded,
      possessionChanged,
      successChance,
      pressureBefore,
      pressureAfter: Number(flow.pressureLevel) || 0,
    };
    simulation.events.push(event);
    return { success: true, reason: 'career-defense-resolved', succeeded, possessionChanged, event };
  }

  function resolveLiveGameHit(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason: 'invalid-live-game',
        event: null,
      };
    }

    const flow =
      simulation.flow;

    if (
      !flow ||
      flow.stopped === true
    ) {
      return {
        success: false,
        reason:
          'live-game-not-in-flowing-play',
        event: null,
      };
    }

    const possessionSide =
      flow.possessionSide;

    if (
      possessionSide !== 'home' &&
      possessionSide !== 'away'
    ) {
      return {
        success: false,
        reason:
          'hit-possession-side-missing',
        event: null,
      };
    }

    const defendingSide =
      possessionSide === 'home'
        ? 'away'
        : 'home';

    const defendingDeployment =
      defendingSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const attackingDeployment =
      possessionSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const hitters =
      Array.isArray(
        defendingDeployment?.skaters
      )
        ? defendingDeployment.skaters
        : [];

    const puckCarriers =
      Array.isArray(
        attackingDeployment?.skaters
      )
        ? attackingDeployment.skaters
        : [];

    if (
      hitters.length === 0 ||
      puckCarriers.length === 0
    ) {
      return {
        success: false,
        reason:
          'hit-participants-missing',
        event: null,
      };
    }

    const weightedPick =
      entries => {
        const totalWeight =
          entries.reduce(
            (sum, entry) =>
              sum + entry.weight,
            0
          );

        let roll =
          Math.random() *
          totalWeight;

        for (
          const entry of entries
        ) {
          roll -= entry.weight;

          if (roll <= 0) {
            return entry.player;
          }
        }

        return entries[0]
          ?.player ||
          null;
      };

    const hitter =
      weightedPick(
        hitters.map(player => {
          const canonicalPlayer =
            getPlayerById(
              player.playerId
            );

          const attributes =
            canonicalPlayer
              ?.attributes ||
            {};

          const physicalScore =
            (
              Number(
                attributes
                  .bodyChecking
              ) || 50
            ) * 0.55 +
            (
              Number(
                attributes
                  .strength
              ) || 50
            ) * 0.30 +
            (
              Number(
                attributes
                  .aggression
              ) || 50
            ) * 0.15;

          return {
            player,
            weight:
              Math.max(
                10,
                physicalScore
              ),
          };
        })
      );

    const puckCarrier =
      weightedPick(
        puckCarriers.map(player => {
          const canonicalPlayer =
            getPlayerById(
              player.playerId
            );

          const attributes =
            canonicalPlayer
              ?.attributes ||
            {};

          const involvementScore =
            (
              Number(
                attributes
                  .puckControl
              ) || 50
            ) * 0.50 +
            (
              Number(
                attributes
                  .offensiveAwareness
              ) || 50
            ) * 0.30 +
            (
              Number(
                attributes
                  .balance
              ) || 50
            ) * 0.20;

          return {
            player,
            weight:
              Math.max(
                10,
                involvementScore
              ),
          };
        })
      );

    if (
      !hitter ||
      !puckCarrier
    ) {
      return {
        success: false,
        reason:
          'hit-selection-failed',
        event: null,
      };
    }

    const hitterPlayer =
      getPlayerById(
        hitter.playerId
      );

    const carrierPlayer =
      getPlayerById(
        puckCarrier.playerId
      );

    const hitterAttributes =
      hitterPlayer
        ?.attributes ||
      {};

    const carrierAttributes =
      carrierPlayer
        ?.attributes ||
      {};

    const hitStrength =
      (
        Number(
          hitterAttributes
            .bodyChecking
        ) || 50
      ) * 0.55 +
      (
        Number(
          hitterAttributes
            .strength
        ) || 50
      ) * 0.30 +
      (
        Number(
          hitterAttributes
            .aggression
        ) || 50
      ) * 0.15;

    const carrierResistance =
      (
        Number(
          carrierAttributes
            .balance
        ) || 50
      ) * 0.45 +
      (
        Number(
          carrierAttributes
            .strength
        ) || 50
      ) * 0.30 +
      (
        Number(
          carrierAttributes
            .puckControl
        ) || 50
      ) * 0.25;

    const turnoverChance =
      Math.max(
        0.12,
        Math.min(
          0.48,
          0.24 +
          (
            hitStrength -
            carrierResistance
          ) * 0.004
        )
      );

    const possessionChanged =
      Math.random() <
      turnoverChance;

    const defendingTeamState =
      defendingSide === 'home'
        ? simulation.home
        : simulation.away;

    defendingTeamState.hits =
      (
        Number(
          defendingTeamState.hits
        ) || 0
      ) + 1;

    hitter.hits =
      (
        Number(
          hitter.hits
        ) || 0
      ) + 1;

    if (possessionChanged) {
      flow.possessionSide =
        defendingSide;

      flow.zone =
        flow.zone === 'offensive'
          ? 'defensive'
          : flow.zone === 'defensive'
            ? 'offensive'
            : 'neutral';

      flow.paceContext =
        'transition';

      flow.pressureLevel =
        0;
    } else {
      flow.paceContext =
        flow.zone === 'offensive'
          ? 'offensive-zone'
          : 'normal';
    }

    flow.lastEventType =
      'hit';

    flow.lastEventSide =
      defendingSide;

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'hit',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      side:
        defendingSide,

      hitterPlayerId:
        hitter.playerId,

      hitPlayerId:
        puckCarrier.playerId,

      possessionChanged,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,
      reason:
        'live-game-hit-resolved',
      possessionChanged,
      event,
    };
  }


  /*
   * ============================================================
   * LIVE GAME — TURNOVER RESOLUTION
   * ============================================================
   *
   * Resolves giveaways/takeaways and changes possession.
   */
  function resolveLiveGameTurnover(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    const flow =
      simulation.flow;

    if (
      !flow ||
      flow.stopped === true
    ) {
      return {
        success: false,
        reason:
          'live-game-not-in-flowing-play',
        event: null,
      };
    }

    const possessionSide =
      flow.possessionSide;

    if (
      possessionSide !== 'home' &&
      possessionSide !== 'away'
    ) {
      return {
        success: false,
        reason:
          'turnover-possession-side-missing',
        event: null,
      };
    }

    const defendingSide =
      possessionSide === 'home'
        ? 'away'
        : 'home';

    const attackingDeployment =
      possessionSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const defendingDeployment =
      defendingSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const attackers =
      Array.isArray(
        attackingDeployment
          ?.skaters
      )
        ? attackingDeployment.skaters
        : [];

    const defenders =
      Array.isArray(
        defendingDeployment
          ?.skaters
      )
        ? defendingDeployment.skaters
        : [];

    if (
      attackers.length === 0 ||
      defenders.length === 0
    ) {
      return {
        success: false,
        reason:
          'turnover-participants-missing',
        event: null,
      };
    }

    /*
     * ==========================================================
     * WEIGHTED PARTICIPANT SELECTION
     * ==========================================================
     *
     * Skilled puck handlers naturally touch the puck more often,
     * so they should also appear in contested-possession events
     * more often without automatically becoming turnover-prone.
     */
    const weightedPick =
      entries => {
        const totalWeight =
          entries.reduce(
            (sum, entry) =>
              sum +
              Math.max(
                0,
                Number(
                  entry.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            entries[0]?.player ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const entry of entries
        ) {
          roll -=
            Math.max(
              0,
              Number(
                entry.weight
              ) || 0
            );

          if (roll <= 0) {
            return entry.player;
          }
        }

        return (
          entries[
            entries.length - 1
          ]?.player ||
          null
        );
      };

    const puckCarrier =
      weightedPick(
        attackers.map(
          player => {
            const canonicalPlayer =
              getPlayerById(
                player.playerId
              );

            const attributes =
              canonicalPlayer
                ?.attributes ||
              {};

            const involvement =
              (
                Number(
                  attributes
                    .puckControl
                ) || 50
              ) * 0.40 +
              (
                Number(
                  attributes.passing
                ) || 50
              ) * 0.25 +
              (
                Number(
                  attributes
                    .offensiveAwareness
                ) || 50
              ) * 0.20 +
              (
                Number(
                  attributes.poise
                ) || 50
              ) * 0.15;

            return {
              player,

              weight:
                Math.max(
                  10,
                  involvement
                ),
            };
          }
        )
      );

    const defender =
      weightedPick(
        defenders.map(
          player => {
            const canonicalPlayer =
              getPlayerById(
                player.playerId
              );

            const attributes =
              canonicalPlayer
                ?.attributes ||
              {};

            const disruption =
              (
                Number(
                  attributes
                    .stickChecking
                ) || 50
              ) * 0.40 +
              (
                Number(
                  attributes
                    .defensiveAwareness
                ) || 50
              ) * 0.35 +
              (
                Number(
                  attributes.agility
                ) || 50
              ) * 0.15 +
              (
                Number(
                  attributes.speed
                ) || 50
              ) * 0.10;

            return {
              player,

              weight:
                Math.max(
                  10,
                  disruption
                ),
            };
          }
        )
      );

    if (
      !puckCarrier ||
      !defender
    ) {
      return {
        success: false,
        reason:
          'turnover-selection-failed',
        event: null,
      };
    }

    const carrierPlayer =
      getPlayerById(
        puckCarrier.playerId
      );

    const defenderPlayer =
      getPlayerById(
        defender.playerId
      );

    const carrierAttributes =
      carrierPlayer
        ?.attributes ||
      {};

    const defenderAttributes =
      defenderPlayer
        ?.attributes ||
      {};

    /*
     * ==========================================================
     * PUCK SECURITY
     * ==========================================================
     *
     * Puck Control is the largest component.
     * Passing and Poise protect against poor decisions.
     * Balance helps the carrier survive physical pressure.
     */
    const puckSecurity =
      (
        Number(
          carrierAttributes
            .puckControl
        ) || 50
      ) * 0.42 +
      (
        Number(
          carrierAttributes.passing
        ) || 50
      ) * 0.22 +
      (
        Number(
          carrierAttributes.poise
        ) || 50
      ) * 0.20 +
      (
        Number(
          carrierAttributes.balance
        ) || 50
      ) * 0.16;

    /*
     * ==========================================================
     * DEFENSIVE DISRUPTION
     * ==========================================================
     */
    const defensiveDisruption =
      (
        Number(
          defenderAttributes
            .stickChecking
        ) || 50
      ) * 0.40 +
      (
        Number(
          defenderAttributes
            .defensiveAwareness
        ) || 50
      ) * 0.32 +
      (
        Number(
          defenderAttributes.agility
        ) || 50
      ) * 0.15 +
      (
        Number(
          defenderAttributes.speed
        ) || 50
      ) * 0.08 +
      (
        Number(
          defenderAttributes.strength
        ) || 50
      ) * 0.05;

    const disruptionAdvantage =
      defensiveDisruption -
      puckSecurity;

    /*
     * A selected turnover event represents genuine defensive
     * pressure, but the offensive player is NOT guaranteed to
     * lose possession.
     *
     * Equal players:
     * approximately 60% possession-loss chance.
     *
     * Strong puck carrier:
     * substantially more likely to survive the pressure.
     *
     * Strong defender:
     * substantially more likely to force the turnover.
     */
    const possessionLossChance =
      Math.max(
        0.28,
        Math.min(
          0.84,
          0.60 +
          disruptionAdvantage *
            0.007
        )
      );

    const possessionLost =
      Math.random() <
      possessionLossChance;

    /*
     * ==========================================================
     * POSSESSION RETAINED
     * ==========================================================
     */
    if (!possessionLost) {
      flow.paceContext =
        flow.zone ===
          'offensive'
          ? 'offensive-zone'
          : 'normal';

      /*
       * Escaping pressure can preserve or slightly strengthen an
       * offensive possession, but never creates huge free pressure.
       */
      if (
        flow.zone ===
        'offensive'
      ) {
        flow.pressureLevel =
          Math.min(
            5,
            (
              Number(
                flow.pressureLevel
              ) || 0
            ) + 0.5
          );
      }

      flow.lastEventType =
        'turnover-avoided';

      flow.lastEventSide =
        possessionSide;

      recordLiveGamePossessionTouch(
        simulation,
        possessionSide,
        puckCarrier.playerId,
        'turnover-avoided'
      );

      const event = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'turnover-avoided',

        period:
          simulation.period,

        clockSecondsRemaining:
          simulation
            .clockSecondsRemaining,

        side:
          possessionSide,

        playerId:
          puckCarrier.playerId,

        defenderPlayerId:
          defender.playerId,

        puckSecurity,

        defensiveDisruption,

        possessionLossChance,

        possessionChanged:
          false,
      };

      simulation.events.push(
        event
      );

      return {
        success: true,

        reason:
          'live-game-turnover-avoided',

        possessionChanged:
          false,

        creditedTakeaway:
          false,

        event,
      };
    }

    /*
     * ==========================================================
     * POSSESSION LOST
     * ==========================================================
     *
     * A lost puck can be:
     *
     * - a clean defensive takeaway
     * - a forced/unforced giveaway without individual takeaway
     *
     * Defensive skill determines which one is more likely.
     */
    const cleanTakeawayChance =
      Math.max(
        0.28,
        Math.min(
          0.82,
          0.52 +
          disruptionAdvantage *
            0.006
        )
      );

    const creditedTakeaway =
      Math.random() <
      cleanTakeawayChance;

    const attackingTeamState =
      possessionSide === 'home'
        ? simulation.home
        : simulation.away;

    const defendingTeamState =
      defendingSide === 'home'
        ? simulation.home
        : simulation.away;

    attackingTeamState.giveaways =
      (
        Number(
          attackingTeamState
            .giveaways
        ) || 0
      ) + 1;

    puckCarrier.giveaways =
      (
        Number(
          puckCarrier.giveaways
        ) || 0
      ) + 1;

    if (creditedTakeaway) {
      defendingTeamState.takeaways =
        (
          Number(
            defendingTeamState
              .takeaways
          ) || 0
        ) + 1;

      defender.takeaways =
        (
          Number(
            defender.takeaways
          ) || 0
        ) + 1;
    }

    flow.possessionSide =
      defendingSide;

    flow.zone =
      flow.zone ===
        'offensive'
        ? 'defensive'
        : flow.zone ===
            'defensive'
          ? 'offensive'
          : 'neutral';

    flow.paceContext =
      'transition';

    flow.pressureLevel =
      0;

    flow.recentPossessionTouches =
      [];

    flow.lastEventType =
      creditedTakeaway
        ? 'takeaway'
        : 'giveaway';

    flow.lastEventSide =
      defendingSide;

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'turnover',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      giveawaySide:
        possessionSide,

      takeawaySide:
        defendingSide,

      giveawayPlayerId:
        puckCarrier.playerId,

      takeawayPlayerId:
        creditedTakeaway
          ? defender.playerId
          : null,

      creditedTakeaway,

      puckSecurity,

      defensiveDisruption,

      possessionLossChance,

      cleanTakeawayChance,

      possessionChanged:
        true,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,

      reason:
        creditedTakeaway
          ? 'live-game-clean-takeaway'
          : 'live-game-giveaway',

      possessionChanged:
        true,

      creditedTakeaway,

      event,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — MANPOWER STATE
   * ============================================================
   *
   * Rebuilds the current manpower situation from every active
   * penalty rather than assuming every penalty creates 5-on-4.
   *
   * Regulation:
   *   even differential      -> 5v5
   *   one extra minor        -> 5v4
   *   two+ extra minors      -> 5v3
   *
   * Overtime:
   *   even differential      -> 3v3
   *   one extra minor        -> 4v3
   *   two+ extra minors      -> 5v3
   *
   * Coincidental/equal active penalties cancel for manpower
   * purposes while still remaining in the penalty list.
   */
  function refreshLiveGameManpowerState(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
      };
    }

    if (
      !simulation.specialTeams ||
      typeof simulation.specialTeams !==
        'object'
    ) {
      return {
        success: false,
        reason:
          'special-teams-state-missing',
      };
    }

    const specialTeams =
      simulation.specialTeams;

    const activePenalties =
      Array.isArray(
        specialTeams.activePenalties
      )
        ? specialTeams.activePenalties
            .filter(
              penalty =>
                penalty &&
                penalty.active === true &&
                Number(
                  penalty.secondsRemaining
                ) > 0
            )
        : [];

    specialTeams.activePenalties =
      activePenalties;

    /*
     * Penalties explicitly marked coincidental do not create
     * a manpower disadvantage.
     *
     * Normal overlapping minors DO.
     */
    const manpowerPenalties =
      activePenalties.filter(
        penalty =>
          penalty.coincidental !==
          true
      );

    const homePenaltyCount =
      manpowerPenalties.filter(
        penalty =>
          penalty.penalizedSide ===
          'home'
      ).length;

    const awayPenaltyCount =
      manpowerPenalties.filter(
        penalty =>
          penalty.penalizedSide ===
          'away'
      ).length;

    const isOvertime =
      simulation.period === 4;

    let homeSkaters =
      isOvertime
        ? 3
        : 5;

    let awaySkaters =
      isOvertime
        ? 3
        : 5;

    /*
     * ==========================================================
     * REGULATION
     * ==========================================================
     *
     * Reduce each team's skater count independently.
     *
     * Examples:
     *
     * 1 home penalty, 0 away:
     *   4v5
     *
     * 2 home penalties, 0 away:
     *   3v5
     *
     * 1 home penalty, 1 away:
     *   4v4
     *
     * 2 home penalties, 1 away:
     *   3v4
     *
     * Never go below three skaters.
     */
    if (!isOvertime) {
      homeSkaters =
        Math.max(
          3,
          5 -
          homePenaltyCount
        );

      awaySkaters =
        Math.max(
          3,
          5 -
          awayPenaltyCount
        );
    }

    /*
     * ==========================================================
     * OVERTIME
     * ==========================================================
     *
     * NHL-style 3-on-3 overtime penalties add skaters to the
     * advantaged team rather than reducing the penalized team
     * below three.
     *
     * Examples:
     *
     * no penalties:
     *   3v3
     *
     * home has one extra penalty:
     *   3v4
     *
     * home has two extra penalties:
     *   3v5
     *
     * one active non-coincidental minor each:
     *   3v3
     *
     * The penalty counts still remain active and continue timing.
     */
    if (isOvertime) {
      const penaltyDifferential =
        homePenaltyCount -
        awayPenaltyCount;

      if (
        penaltyDifferential > 0
      ) {
        homeSkaters =
          3;

        awaySkaters =
          Math.min(
            5,
            3 +
            penaltyDifferential
          );
      } else if (
        penaltyDifferential < 0
      ) {
        homeSkaters =
          Math.min(
            5,
            3 +
            Math.abs(
              penaltyDifferential
            )
          );

        awaySkaters =
          3;
      }
    }

    let situation =
      'even-strength';

    let powerPlaySide =
      null;

    let penaltyKillSide =
      null;

    if (
      homeSkaters >
      awaySkaters
    ) {
      situation =
        'power-play';

      powerPlaySide =
        'home';

      penaltyKillSide =
        'away';
    } else if (
      awaySkaters >
      homeSkaters
    ) {
      situation =
        'power-play';

      powerPlaySide =
        'away';

      penaltyKillSide =
        'home';
    }

    specialTeams.situation =
      situation;

    specialTeams.powerPlaySide =
      powerPlaySide;

    specialTeams.penaltyKillSide =
      penaltyKillSide;

    specialTeams.homeSkaters =
      homeSkaters;

    specialTeams.awaySkaters =
      awaySkaters;

    specialTeams.homeActivePenaltyCount =
      homePenaltyCount;

    specialTeams.awayActivePenaltyCount =
      awayPenaltyCount;

    specialTeams.penaltyDifferential =
      homePenaltyCount -
      awayPenaltyCount;

    return {
      success: true,

      reason:
        'live-game-manpower-refreshed',

      situation,

      powerPlaySide,
      penaltyKillSide,

      homeSkaters,
      awaySkaters,

      homePenaltyCount,
      awayPenaltyCount,

      penaltyDifferential:
        homePenaltyCount -
        awayPenaltyCount,

      activePenaltyCount:
        activePenalties.length,

      manpowerPenaltyCount:
        manpowerPenalties.length,

      isOvertime,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — PENALTY RESOLUTION
   * ============================================================
   */
  function resolveLiveGamePenalty(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    const flow =
      simulation.flow;

    if (
      !flow ||
      flow.stopped === true
    ) {
      return {
        success: false,
        reason:
          'live-game-not-in-flowing-play',
        event: null,
      };
    }

    const possessionSide =
      flow.possessionSide;

    const penalizedSide =
      Math.random() < 0.56
        ? (
            possessionSide === 'home'
              ? 'away'
              : 'home'
          )
        : possessionSide;

    if (
      penalizedSide !== 'home' &&
      penalizedSide !== 'away'
    ) {
      return {
        success: false,
        reason:
          'penalty-side-missing',
        event: null,
      };
    }

    const advantagedSide =
      penalizedSide === 'home'
        ? 'away'
        : 'home';

    const penalizedDeployment =
      penalizedSide === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const skaters =
      Array.isArray(
        penalizedDeployment?.skaters
      )
        ? penalizedDeployment.skaters
        : [];

    if (skaters.length === 0) {
      return {
        success: false,
        reason:
          'penalty-participants-missing',
        event: null,
      };
    }

    /*
     * ==========================================================
     * PENALIZED PLAYER SELECTION
     * ==========================================================
     *
     * Players with high Aggression and low Discipline are more
     * likely to take penalties.
     *
     * Disciplined players can still take penalties occasionally,
     * but reckless players should accumulate noticeably more over
     * a full season.
     */
    const penaltyCandidates =
      skaters.map(
        player => {
          const canonicalPlayer =
            getPlayerById(
              player.playerId
            );

          const attributes =
            canonicalPlayer
              ?.attributes ||
            {};

          const aggression =
            Math.max(
              25,
              Math.min(
                99,
                Number(
                  attributes.aggression
                ) || 50
              )
            );

          const discipline =
            Math.max(
              25,
              Math.min(
                99,
                Number(
                  attributes.discipline
                ) || 50
              )
            );

          /*
           * Baseline keeps every player eligible.
           *
           * Examples:
           *
           * 90 aggression / 45 discipline
           * → substantially elevated penalty weight
           *
           * 45 aggression / 90 discipline
           * → much lower penalty weight
           */
          const penaltyTendency =
            Math.max(
              8,
              50 +
              (
                aggression -
                discipline
              ) * 0.85
            );

          return {
            player,
            aggression,
            discipline,
            weight:
              penaltyTendency,
          };
        }
      );

    const totalPenaltyWeight =
      penaltyCandidates.reduce(
        (
          total,
          candidate
        ) =>
          total +
          candidate.weight,
        0
      );

    let penaltyRoll =
      Math.random() *
      totalPenaltyWeight;

    let selectedPenaltyCandidate =
      penaltyCandidates[0] ||
      null;

    for (
      const candidate of
      penaltyCandidates
    ) {
      penaltyRoll -=
        candidate.weight;

      if (
        penaltyRoll <= 0
      ) {
        selectedPenaltyCandidate =
          candidate;

        break;
      }
    }

    const penalizedPlayer =
      selectedPenaltyCandidate
        ?.player ||
      skaters[0];

    const selectedAggression =
      selectedPenaltyCandidate
        ?.aggression ??
      50;

    const selectedDiscipline =
      selectedPenaltyCandidate
        ?.discipline ??
      50;

      const canonicalPlayer =
        getPlayerById(
          penalizedPlayer.playerId
        );

      const attributes =
        canonicalPlayer
          ?.attributes ||
        {};

      const aggression =
        selectedAggression;

      const discipline =
        selectedDiscipline;

      const physicalBias =
      Math.max(
        0,
        Math.min(
          1,
          (
            aggression -
            discipline +
            50
          ) / 100
        )
      );

    const infractionRoll =
      Math.random();

    let infraction =
      'Tripping';

    if (infractionRoll < 0.20) {
      infraction =
        'Hooking';
    } else if (
      infractionRoll < 0.38
    ) {
      infraction =
        'Holding';
    } else if (
      infractionRoll < 0.54
    ) {
      infraction =
        'Interference';
    } else if (
      infractionRoll < 0.69
    ) {
      infraction =
        'Slashing';
    } else if (
      infractionRoll <
        0.69 +
        physicalBias * 0.20
    ) {
      infraction =
        'Roughing';
    } else if (
      infractionRoll < 0.92
    ) {
      infraction =
        'Cross-checking';
    }

    const penaltyMinutes = 2;

    const penalizedTeamState =
      penalizedSide === 'home'
        ? simulation.home
        : simulation.away;

    const advantagedTeamState =
      advantagedSide === 'home'
        ? simulation.home
        : simulation.away;

    penalizedTeamState
      .penaltyMinutes =
      (
        Number(
          penalizedTeamState
            .penaltyMinutes
        ) || 0
      ) +
      penaltyMinutes;

    penalizedPlayer
      .penaltyMinutes =
      (
        Number(
          penalizedPlayer
            .penaltyMinutes
        ) || 0
      ) +
      penaltyMinutes;

    /*
     * Remember the manpower advantage BEFORE this new penalty.
     *
     * We will only award a new PP opportunity if this penalty
     * actually creates or increases a numerical advantage.
     */
    const previousHomeSkaters =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            simulation.specialTeams
              ?.homeSkaters
          ) ||
          (
            simulation.period === 4
              ? 3
              : 5
          )
        )
      );

    const previousAwaySkaters =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            simulation.specialTeams
              ?.awaySkaters
          ) ||
          (
            simulation.period === 4
              ? 3
              : 5
          )
        )
      );

    const previousAdvantageSize =
      advantagedSide === 'home'
        ? Math.max(
            0,
            previousHomeSkaters -
            previousAwaySkaters
          )
        : Math.max(
            0,
            previousAwaySkaters -
            previousHomeSkaters
          );

    const penalty = {
      id:
        `penalty-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      penalizedSide,

      advantagedSide,

      playerId:
        penalizedPlayer.playerId,

      infraction,

      minutes:
        penaltyMinutes,

      secondsRemaining:
        penaltyMinutes * 60,

      active: true,
    };

    simulation.penalties.push(
      penalty
    );

    simulation.specialTeams
      .activePenalties
      .push(
        penalty
      );

    /*
     * Recalculate manpower from EVERY currently active penalty.
     *
     * This correctly handles:
     *
     * regulation:
     *   5v5
     *   5v4
     *   5v3
     *
     * overtime:
     *   3v3
     *   4v3
     *   5v3
     *
     * as well as equal/coincidental penalty counts.
     */
    const manpowerRefresh =
      refreshLiveGameManpowerState(
        simulation
      );

    if (
      !manpowerRefresh ||
      manpowerRefresh.success !== true
    ) {
      /*
       * The penalty itself has already been recorded, so this should
       * be treated as a simulation failure rather than silently
       * continuing with incorrect manpower.
       */
      return {
        success: false,

        reason:
          manpowerRefresh?.reason ||
          'penalty-manpower-refresh-failed',

        penalty,

        event: null,
      };
    }

    /*
     * ==========================================================
     * POWER-PLAY OPPORTUNITY ACCOUNTING
     * ==========================================================
     *
     * Only count a new opportunity when this penalty creates or
     * increases the opponent's manpower advantage.
     *
     * Examples:
     *
     * 5v5 -> 5v4
     *   +1 PP opportunity
     *
     * 5v4 -> 5v3
     *   +1 PP opportunity
     *
     * 5v4 -> 4v4 because the PP team takes a penalty
     *   no new PP opportunity
     *
     * 4v4 -> 4v3
     *   +1 PP opportunity
     */
    const newAdvantageSize =
      advantagedSide === 'home'
        ? Math.max(
            0,
            manpowerRefresh.homeSkaters -
            manpowerRefresh.awaySkaters
          )
        : Math.max(
            0,
            manpowerRefresh.awaySkaters -
            manpowerRefresh.homeSkaters
          );

    if (
      newAdvantageSize >
      previousAdvantageSize
    ) {
      advantagedTeamState
        .powerPlayOpportunities =
        (
          Number(
            advantagedTeamState
              .powerPlayOpportunities
          ) || 0
        ) + 1;
    }

    flow.stopped =
      true;

    flow.stoppageReason =
      'penalty';

    flow.paceContext =
      'after-faceoff';

    flow.possessionSide =
      null;

    flow.zone =
      'neutral';

    flow.pressureLevel =
      0;

    flow.lastEventType =
      'penalty';

    flow.lastEventSide =
      penalizedSide;

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'penalty',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      penalizedSide,

      advantagedSide,

      teamId:
        penalizedTeamState
          .teamId,

      playerId:
        penalizedPlayer.playerId,

      infraction,

      minutes:
        penaltyMinutes,

      penaltyId:
        penalty.id,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,
      reason:
        'live-game-penalty-resolved',
      penalty,
      event,
    };
  }


  /*
   * ============================================================
   * LIVE GAME — SPECIAL TEAMS CLOCK
   * ============================================================
   *
   * Reduces active penalty time whenever hockey time advances.
   * Expired minors restore even-strength play.
   */
  function advanceLiveGameSpecialTeamsClock(
    simulation,
    elapsedSeconds
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
      };
    }

    const specialTeams =
      simulation.specialTeams;

    if (
      !specialTeams ||
      !Array.isArray(
        specialTeams.activePenalties
      )
    ) {
      return {
        success: false,
        reason:
          'special-teams-state-missing',
      };
    }

    const safeElapsed =
      Math.max(
        0,
        Number(
          elapsedSeconds
        ) || 0
      );

    specialTeams
      .activePenalties
      .forEach(
        penalty => {
          if (
            penalty.active !== true
          ) {
            return;
          }

          penalty.secondsRemaining =
            Math.max(
              0,
              (
                Number(
                  penalty
                    .secondsRemaining
                ) || 0
              ) -
              safeElapsed
            );

          if (
            penalty.secondsRemaining <= 0
          ) {
            penalty.active =
              false;
          }
        }
      );

    specialTeams
      .activePenalties =
      specialTeams
        .activePenalties
        .filter(
          penalty =>
            penalty.active === true
        );

    const manpowerRefresh =
      refreshLiveGameManpowerState(
        simulation
      );

    if (
      !manpowerRefresh ||
      manpowerRefresh.success !== true
    ) {
      return {
        success: false,

        reason:
          manpowerRefresh?.reason ||
          'special-teams-manpower-refresh-failed',

        activePenalties:
          specialTeams
            .activePenalties,
      };
    }

    return {
      success: true,

      reason:
        specialTeams
          .activePenalties
          .length > 0
          ? 'penalty-clock-advanced'
          : 'even-strength-restored',

      activePenalties:
        specialTeams
          .activePenalties,

      manpower:
        manpowerRefresh,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — ONE SIMULATION STEP
   * ============================================================
   *
   * Advances one meaningful slice of hockey.
   *
   * This is NOT one minute and NOT one event per minute.
   * Each step schedules its own amount of hockey time based on
   * game context, then resolves the next meaningful event.
   */
  function advanceLiveGameStep(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        event: null,
      };
    }

    if (
      simulation.gameComplete === true ||
      simulation.finalized === true
    ) {
      return {
        success: false,
        reason:
          'live-game-already-complete',
        event: null,
      };
    }

    /*
     * A tied game that has completed overtime resolves its
     * shootout before any more hockey-clock steps are attempted.
     */
    if (
      simulation.status ===
      'shootout-pending'
    ) {
      const shootoutResult =
        resolveLiveGameShootout(
          simulation
        );

      return {
        success:
          shootoutResult
            ?.success === true,

        reason:
          shootoutResult
            ?.reason ||
          'shootout-resolution-failed',

        elapsedSeconds: 0,

        event:
          shootoutResult
            ?.event ||
          null,

        result:
          shootoutResult ||
          null,

        simulation,
      };
    }

    const flow =
      simulation.flow;

    if (
      !flow ||
      typeof flow !== 'object'
    ) {
      return {
        success: false,
        reason:
          'live-game-flow-missing',
        event: null,
      };
    }

    /*
     * ==========================================================
     * PERIOD START / STOPPAGE
     * ==========================================================
     *
     * Dead puck does not consume hockey clock.
     * The next action is a faceoff at the same timestamp.
     */
    if (flow.stopped === true) {
      const faceoffZone =
        flow.stoppageReason ===
          'goal'
          ? 'neutral'
          : flow.zone ||
            'neutral';

      const faceoffResult =
        resolveLiveGameFaceoff(
          simulation,
          {
            zone:
              faceoffZone,
          }
        );

      return {
        success:
          faceoffResult
            ?.success === true,

        reason:
          faceoffResult
            ?.reason ||
          'faceoff-resolution-failed',

        elapsedSeconds: 0,

        event:
          faceoffResult
            ?.event ||
          null,

        result:
          faceoffResult ||
          null,

        simulation,
      };
    }

    /*
     * ==========================================================
     * DEPLOYMENT / SHIFT MANAGEMENT
     * ==========================================================
     *
     * Keep the same skaters on the ice for a real stretch rather
     * than rerolling all five participants every event.
     *
     * Normal shifts are roughly 35–55 seconds. We allow some
     * variance here because event timestamps do not represent
     * every whistle-free second of a shift.
     */

    /*
     * ==========================================================
     * OVERTIME DEPLOYMENT
     * ==========================================================
     *
     * Period 4 uses 3-on-3 hockey:
     * two forwards + one defenseman + goalie.
     */
    const isOvertime =
      simulation.period === 4;
    
    const deploymentNeedsRefresh =
      !flow.homeDeployment ||
      !flow.awayDeployment ||
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) >=
        (
          35 +
          Math.floor(
            Math.random() * 21
          )
        );

      if (deploymentNeedsRefresh) {
        const homeDeploymentResult =
          isOvertime
            ? selectLiveGameOvertimeDeployment(
                simulation,
                'home'
              )
            : selectLiveGameEvenStrengthDeployment(
                simulation,
                'home'
              );

        const awayDeploymentResult =
          isOvertime
            ? selectLiveGameOvertimeDeployment(
                simulation,
                'away'
              )
            : selectLiveGameEvenStrengthDeployment(
                simulation,
                'away'
              );

      if (
        homeDeploymentResult
          ?.success !== true ||
        awayDeploymentResult
          ?.success !== true
      ) {
        return {
          success: false,
          reason:
            'live-game-deployment-refresh-failed',

          homeDeploymentResult,
          awayDeploymentResult,

          event: null,
        };
      }

      flow.homeDeployment =
        homeDeploymentResult
          .deployment;

      flow.awayDeployment =
        awayDeploymentResult
          .deployment;

      flow.deploymentAgeSeconds =
        0;
    }

    /*
     * ==========================================================
     * MANPOWER-AWARE DEPLOYMENT
     * ==========================================================
     *
     * The authoritative manpower counts live in:
     *
     *   specialTeams.homeSkaters
     *   specialTeams.awaySkaters
     *
     * This turns those state values into the actual players on
     * the ice.
     *
     * Supported regulation states:
     *   5v5
     *   5v4
     *   5v3
     *   4v4
     *   4v3
     *   3v3
     *
     * Supported overtime states:
     *   3v3
     *   4v3
     *   5v3
     */
    const specialTeams =
      simulation.specialTeams ||
      {};

    const homeSkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.homeSkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const awaySkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.awaySkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const homeHasAdvantage =
      homeSkaterCount >
      awaySkaterCount;

    const awayHasAdvantage =
      awaySkaterCount >
      homeSkaterCount;

    /*
     * Rotate special-teams units during extended penalties.
     * Unit 1 starts the sequence; Unit 2 takes the next ~45-second window.
     * This prevents PP1/PK1 skaters from playing an entire two-minute minor.
     */
    const specialTeamsShiftUnit =
      (
        Math.floor(
          (Number(flow.deploymentAgeSeconds) || 0) / 45
        ) % 2
      ) + 1;

    /*
     * ========================================================
     * HOME DEPLOYMENT
     * ========================================================
     */
    let homeManpowerDeployment =
      null;

    if (homeHasAdvantage) {
      /*
       * Home team owns the power play.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'power-play',

            specialTeamsUnit:
              specialTeamsShiftUnit,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (awayHasAdvantage) {
      /*
       * Home team is killing the penalty.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit:
              specialTeamsShiftUnit,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.homeDeployment
                ?.defensePair ||
              1,

            skaterCount:
              homeSkaterCount,
          }
        );
    }

    /*
     * ========================================================
     * AWAY DEPLOYMENT
     * ========================================================
     */
    let awayManpowerDeployment =
      null;

    if (awayHasAdvantage) {
      /*
       * Away team owns the power play.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'power-play',

            specialTeamsUnit:
              specialTeamsShiftUnit,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (homeHasAdvantage) {
      /*
       * Away team is killing the penalty.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit:
              specialTeamsShiftUnit,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      awaySkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) +
      elapsedSeconds;

    /*
     * ==========================================================
     * TIME ON ICE
     * ==========================================================
     *
     * Credit every currently deployed player for the actual
     * elapsed hockey seconds from this simulation step.
     */
    const addTOIToDeployment =
      deployment => {
        if (
          !deployment ||
          typeof deployment !== 'object'
        ) {
          return;
        }

        const skaters =
          Array.isArray(
            deployment.skaters
          )
            ? deployment.skaters
            : [];

        skaters.forEach(
          player => {
            if (!player) {
              return;
            }

            player.timeOnIceSeconds =
              (
                Number(
                  player.timeOnIceSeconds
                ) || 0
              ) +
              elapsedSeconds;
          }
        );

        const goalie =
          deployment.goalie ||
          null;

        if (goalie) {
          goalie.timeOnIceSeconds =
            (
              Number(
                goalie.timeOnIceSeconds
              ) || 0
            ) +
            elapsedSeconds;
        }
      };

    addTOIToDeployment(
      flow.homeDeployment
    );

    addTOIToDeployment(
      flow.awayDeployment
    );

    /*
     * Penalties count down using actual hockey seconds, completely
     * independent of presentation speed.
     */
    const manpowerBeforeClock =
      `${homeSkaterCount}v${awaySkaterCount}`;

    /*
     * Track actual 5-on-5 regulation seconds separately from total game
     * clock. Even-strength line targets must not grow during PP/PK time,
     * otherwise a player who already received special-teams minutes is
     * incorrectly sent back out at 5-on-5 to 'catch up'.
     */
    if (
      elapsedSeconds > 0 &&
      Number(simulation.period) <= 3 &&
      homeSkaterCount === 5 &&
      awaySkaterCount === 5
    ) {
      if (!simulation.flow.deploymentUsage) {
        simulation.flow.deploymentUsage = {
          home: {
            forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },
            defensePairs: { 1: 0, 2: 0, 3: 0 },
            evenStrengthSeconds: 0,
          },
          away: {
            forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },
            defensePairs: { 1: 0, 2: 0, 3: 0 },
            evenStrengthSeconds: 0,
          },
        };
      }

      ['home', 'away'].forEach(sideKey => {
        const sideUsage =
          simulation.flow.deploymentUsage[sideKey];

        sideUsage.evenStrengthSeconds =
          (Number(sideUsage.evenStrengthSeconds) || 0) +
          elapsedSeconds;
      });
    }

    advanceLiveGameSpecialTeamsClock(
      simulation,
      elapsedSeconds
    );

    const manpowerAfterClock =
      `${Math.max(3, Number(specialTeams.homeSkaters) || 5)}v${Math.max(3, Number(specialTeams.awaySkaters) || 5)}`;

    if (manpowerAfterClock !== manpowerBeforeClock) {
      flow.homeDeployment = null;
      flow.awayDeployment = null;
      flow.deploymentAgeSeconds = 0;
    }

    /*
     * ==========================================================
     * PERIOD EXPIRATION
     * ==========================================================
     */
    if (
      simulation
        .clockSecondsRemaining <= 0
    ) {
      const periodEndEvent = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'period-end',

        period:
          simulation.period,

        clockSecondsRemaining: 0,

        homeScore:
          simulation.home.score,

        awayScore:
          simulation.away.score,
      };

      simulation.events.push(
        periodEndEvent
      );

      /*
       * Regulation periods 1 and 2 advance normally.
       */
      if (
        simulation.period < 3
      ) {
        simulation.period +=
          1;

        simulation.periodLabel =
          simulation.period === 2
            ? '2nd'
            : '3rd';

        simulation
          .clockSecondsRemaining =
          20 * 60;

        flow.stopped =
          true;

        flow.stoppageReason =
          'period-start';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.paceContext =
          'after-faceoff';

        flow.pressureLevel =
          0;

        flow.homeDeployment =
          null;

        flow.awayDeployment =
          null;

        flow.deploymentAgeSeconds =
          0;
      } else if (
        simulation.period === 3
      ) {
        simulation
          .regulationComplete =
          true;

        /*
         * A decisive regulation result ends immediately.
         */
        if (
          Number(
            simulation.home.score
          ) !==
          Number(
            simulation.away.score
          )
        ) {
          simulation.gameComplete =
            true;

          simulation.status =
            'completed';
        } else {
          /*
           * ======================================================
           * LIVE OVERTIME INITIALIZATION
           * ======================================================
           *
           * Regulation tie → 5-minute sudden-death overtime.
           *
           * Overtime uses period 4 and a fresh center-ice faceoff.
           */
          simulation.period =
            4;

          simulation.periodLabel =
            'OT';

          simulation
            .clockSecondsRemaining =
            5 * 60;

          simulation.status =
            'overtime';

          simulation.wentToOvertime =
            true;

          /*
           * Reinterpret any penalties carrying over from regulation
           * using overtime manpower rules.
           *
           * Regulation 5v4 becomes OT 4v3.
           * Regulation 5v3 becomes OT 5v3.
           * No active penalties remains ordinary 3v3.
           */
          const overtimeManpowerRefresh =
            refreshLiveGameManpowerState(
              simulation
            );

          if (
            !overtimeManpowerRefresh ||
            overtimeManpowerRefresh
              .success !== true
          ) {
            return {
              success: false,

              reason:
                overtimeManpowerRefresh
                  ?.reason ||
                'overtime-manpower-refresh-failed',

              elapsedSeconds,

              event:
                periodEndEvent,

              simulation,
            };
          }

          flow.stopped =
            true;

          flow.stoppageReason =
            'overtime-start';

          flow.possessionSide =
            null;

          flow.zone =
            'neutral';

          flow.paceContext =
            'after-faceoff';

          flow.pressureLevel =
            0;

          flow.homeDeployment =
            null;

          flow.awayDeployment =
            null;

          flow.deploymentAgeSeconds =
            0;

          flow.recentPossessionTouches =
            [];
        }
      } else if (
        simulation.period === 4
      ) {
        /*
         * If overtime reaches 0:00 without a goal, the game remains
         * tied and moves to the shootout state.
         *
         * We will build the actual shootout resolver next.
         */
        simulation
          .overtimeComplete =
          true;

        simulation.status =
          'shootout-pending';

        flow.stopped =
          true;

        flow.stoppageReason =
          'overtime-ended-tied';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.pressureLevel =
          0;

        flow.recentPossessionTouches =
          [];
      }

      return {
        success: true,

        reason:
          'live-game-period-ended',

        elapsedSeconds,

        event:
          periodEndEvent,

        simulation,
      };
    }

    /*
     * ==========================================================
     * SELECT NEXT EVENT
     * ==========================================================
     */
const pendingCareerDecision =
  simulation.pendingCareerDecision &&
  typeof simulation.pendingCareerDecision === 'object'
    ? simulation.pendingCareerDecision
    : null;

simulation.pendingCareerDecision =
  null;

const pendingAction =
  String(pendingCareerDecision?.action || '');

const selection =
  pendingAction.startsWith('shoot')
    ? { success: true, reason: 'career-decision-shoot', eventType: 'shot-attempt' }
    : pendingAction.startsWith('pass')
      ? { success: true, reason: 'career-decision-pass', eventType: 'career-pass' }
      : ['defend-stick', 'defend-body', 'defend-contain'].includes(pendingAction)
        ? { success: true, reason: 'career-decision-defense', eventType: 'career-defense' }
        : selectNextLiveGameEventType(simulation);

    if (
      !selection ||
      selection.success !== true
    ) {
      return {
        success: false,
        reason:
          selection?.reason ||
          'live-game-event-selection-failed',
        elapsedSeconds,
        event: null,
      };
    }

    let resolution = null;

    switch (
      selection.eventType
    ) {
      case 'shot-attempt':
        resolution =
resolveLiveGameShotAttempt(
  simulation,
  pendingAction.startsWith('shoot')
    ? pendingCareerDecision?.playerId || null
    : null,
  pendingAction.startsWith('shoot-')
    ? pendingAction.slice('shoot-'.length)
    : null
);
        break;

case 'career-pass':
  resolution =
    resolveLiveGameCareerPass(
      simulation,
      pendingCareerDecision?.playerId || null,
      pendingAction || 'pass'
    );
  break;

case 'career-defense':
  resolution = resolveLiveGameCareerDefense(
    simulation,
    pendingCareerDecision?.playerId || null,
    pendingCareerDecision?.action || 'defend-contain'
  );
  break;

      case 'hit':
        resolution =
          resolveLiveGameHit(
            simulation
          );
        break;

      case 'turnover':
        resolution =
          resolveLiveGameTurnover(
            simulation
          );
        break;

      case 'penalty':
        resolution =
          resolveLiveGamePenalty(
            simulation
          );
        break;

      case 'possession-advance':
        resolution =
          resolveLiveGamePossessionAdvance(
            simulation
          );
        break;

      /*
       * A generic stoppage creates a whistle and forces the next
       * step to resolve a faceoff at the same game-clock time.
       */
      case 'stoppage': {
        flow.stopped =
          true;

        flow.stoppageReason =
          'general-stoppage';

        flow.paceContext =
          'after-faceoff';

        flow.pressureLevel =
          0;

        const event = {
          id:
            `live-event-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,

          type:
            'stoppage',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,

          side:
            flow.possessionSide,

          zone:
            flow.zone,
        };

        simulation.events.push(
          event
        );

        resolution = {
          success: true,
          reason:
            'live-game-stoppage-resolved',
          event,
        };

        break;
      }

      /*
       * Quiet play burns clock and changes context without adding
       * a visible event-feed item.
       */
      case 'quiet-play':
      default:
        flow.paceContext =
          'quiet';

        flow.lastEventType =
          'quiet-play';

        resolution = {
          success: true,
          reason:
            'live-game-quiet-play',

          event: null,
        };

        break;
    }

    if (
      !resolution ||
      resolution.success !== true
    ) {
      return {
        success: false,

        reason:
          resolution?.reason ||
          'live-game-event-resolution-failed',

        elapsedSeconds,

        eventType:
          selection.eventType,

        event: null,

        resolution:
          resolution || null,
      };
    }

    return {
      success: true,

      reason:
        'live-game-step-completed',

      elapsedSeconds,

      eventType:
        selection.eventType,

      event:
        resolution.event ||
        null,

      resolution,

      simulation,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — RESOLVE TO FINAL CANONICAL RESULT
   * ============================================================
   *
   * Runs one scheduled game completely through the validated
   * live-game engine and returns the finalized canonical
   * gameResult.
   *
   * IMPORTANT:
   *
   * This function does NOT:
   * - update standings
   * - update season statistics
   * - mark the schedule game as played
   * - apply development
   * - save world state
   *
   * Those responsibilities remain with the existing Season Engine
   * application layer.
   *
   * This function owns only:
   *
   * scheduled game
   *   -> live simulation state
   *   -> live simulation steps
   *   -> completed game
   *   -> canonical gameResult
   */
  function resolveLiveGameToFinalResult(
    scheduledGame,
    options = {}
  ) {
    if (
      !scheduledGame ||
      typeof scheduledGame !== 'object'
    ) {
      return {
        success: false,

        reason:
          'invalid-scheduled-live-game',

        simulation: null,

        gameResult: null,

        steps: 0,

        failures: [],
      };
    }

    const creation =
      createLiveGameSimulationState(
        scheduledGame
      );

    if (
      !creation ||
      creation.success !== true ||
      !creation.simulation
    ) {
      return {
        success: false,

        reason:
          creation?.reason ||
          'live-game-creation-failed',

        simulation:
          creation?.simulation ||
          null,

        gameResult: null,

        steps: 0,

        failures: [],
      };
    }

    const simulation =
      creation.simulation;

    const maxSteps =
      Math.max(
        100,
        Number(
          options.maxSteps
        ) || 3000
      );

    const failures = [];

    let steps = 0;

    while (
      simulation.gameComplete !== true &&
      steps < maxSteps
    ) {
      const step =
        advanceLiveGameStep(
          simulation
        );

      steps += 1;

      if (
        !step ||
        step.success !== true
      ) {
        failures.push({
          step: steps,

          reason:
            step?.reason ||
            'unknown-live-game-step-failure',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,
        });

        break;
      }
    }

    /*
     * Reaching the safety cap without completing the game is a
     * resolver failure. Never finalize a partial game.
     */
    if (
      simulation.gameComplete !== true &&
      failures.length === 0
    ) {
      failures.push({
        step: steps,

        reason:
          'live-game-step-limit-reached',

        period:
          simulation.period,

        clockSecondsRemaining:
          simulation
            .clockSecondsRemaining,
      });
    }

    if (failures.length > 0) {
      return {
        success: false,

        reason:
          failures[
            failures.length - 1
          ]?.reason ||
          'live-game-resolution-failed',

        simulation,

        gameResult: null,

        steps,

        failures,
      };
    }

    const finalization =
      finalizeLiveGameSimulation(
        simulation
      );

    if (
      !finalization ||
      finalization.success !== true ||
      !finalization.gameResult
    ) {
      return {
        success: false,

        reason:
          finalization?.reason ||
          'live-game-finalization-failed',

        simulation,

        gameResult: null,

        steps,

        failures: [
          {
            step: steps,

            reason:
              finalization?.reason ||
              'live-game-finalization-failed',

            period:
              simulation.period,

            clockSecondsRemaining:
              simulation
                .clockSecondsRemaining,
          },
        ],
      };
    }

    return {
      success: true,

      reason:
        'live-game-resolved-to-final-result',

      simulation,

      gameResult:
        structuredClone(
          finalization.gameResult
        ),

      steps,

      failures: [],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — FULL REGULATION DIAGNOSTIC
   * ============================================================
   *
   * Runs one real scheduled game completely IN MEMORY.
   *
   * Nothing is saved.
   * Nothing is applied to standings.
   * No permanent player statistics are changed.
   *
   * This exists only so we can evaluate the hockey math before
   * connecting the live simulator to the actual career UI.
   */
  function runLiveGameSimulationDiagnostic(
    gameId = null,
    options = {}
  ) {
    const schedule =
      Array.isArray(
        _state.schedule
      )
        ? _state.schedule
        : [];

    /*
     * Use a requested game when supplied.
     * Otherwise use the first unplayed scheduled game.
     */
    /*
     * ==========================================================
     * DIAGNOSTIC MATCHUP SOURCE
     * ==========================================================
     *
     * Normal diagnostic:
     *   use an existing scheduled career game.
     *
     * Controlled diagnostic:
     *   options.scheduledGame can provide a temporary matchup
     *   entirely in memory.
     *
     * This lets competitive-balance tests repeatedly simulate
     * specific teams without modifying the real career schedule.
     */
    const providedDiagnosticGame =
      options.scheduledGame &&
      typeof options.scheduledGame ===
        'object'
        ? {
            ...options.scheduledGame,

            gameId:
              options.scheduledGame
                .gameId ||
              `diagnostic-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

            eventId:
              options.scheduledGame
                .eventId ||
              options.scheduledGame
                .gameId ||
              null,

            type:
              'game',
          }
        : null;

    const scheduledGame =
      providedDiagnosticGame ||
      (
        gameId
          ? schedule.find(event =>
              String(
                event.gameId ||
                event.eventId ||
                event.id ||
                ''
              ) ===
              String(gameId)
            )
          : schedule.find(event =>
              event?.type === 'game' &&
              event?.played !== true &&
              event?.completed !== true
            )
      ) ||
      null;

    if (!scheduledGame) {
      return {
        success: false,

        reason:
          'diagnostic-game-not-found',

        diagnostic: null,
      };
    }

    const creation =
      createLiveGameSimulationState(
        scheduledGame
      );

    if (
      !creation ||
      creation.success !== true ||
      !creation.simulation
    ) {
      return {
        success: false,

        reason:
          creation?.reason ||
          'diagnostic-live-game-creation-failed',

        diagnostic: null,
      };
    }

    const simulation =
      creation.simulation;

    /*
     * The regulation diagnostic deliberately stops after
     * three periods even when tied.
     *
     * Overtime is not implemented yet, so continuing a tied
     * game beyond regulation would be invalid.
     */
    const maxSteps =
      Math.max(
        100,
        Number(
          options.maxSteps
        ) || 3000
      );

    const stepTypeCounts = {};

    const failures = [];

    let steps = 0;

      while (
        simulation
          .gameComplete !== true &&
        steps < maxSteps
      ) {
      const step =
        advanceLiveGameStep(
          simulation
        );

      steps += 1;

      if (
        !step ||
        step.success !== true
      ) {
        failures.push({
          step:
            steps,

          reason:
            step?.reason ||
            'unknown-step-failure',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,
        });

        break;
      }

      const stepType =
        step.eventType ||
        step.event?.type ||
        step.reason ||
        'unknown';

      stepTypeCounts[
        stepType
      ] =
        (
          Number(
            stepTypeCounts[
              stepType
            ]
          ) || 0
        ) + 1;
    }

    /*
     * ==========================================================
     * FINAL RESULT VALIDATION
     * ==========================================================
     *
     * A diagnostic game is not considered fully successful merely
     * because the hockey simulation reached gameComplete.
     *
     * It must also convert and finalize into the exact canonical
     * gameResult contract used by the permanent career systems.
     */
    let finalization = null;

    if (
      simulation.gameComplete === true &&
      failures.length === 0
    ) {
      finalization =
        finalizeLiveGameSimulation(
          simulation
        );

      if (
        !finalization ||
        finalization.success !== true ||
        !finalization.gameResult
      ) {
        failures.push({
          step:
            steps,

          reason:
            finalization?.reason ||
            'live-game-finalization-failed',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,
        });
      }
    }

    /*
     * Count every recorded live event by type.
     */
    const eventTypeCounts = {};

    (
      Array.isArray(
        simulation.events
      )
        ? simulation.events
        : []
    ).forEach(event => {
      const type =
        event?.type ||
        'unknown';

      eventTypeCounts[
        type
      ] =
        (
          Number(
            eventTypeCounts[
              type
            ]
          ) || 0
        ) + 1;
    });

    const home =
      simulation.home;

    const away =
      simulation.away;

    /*
     * Shot attempts include:
     *
     * blocked
     * missed
     * saved
     * goals
     *
     * Official SOG remain simulation.home/away.shots.
     */
    const shotAttempts =
      (
        Number(
          eventTypeCounts[
            'shot-blocked'
          ]
        ) || 0
      ) +
      (
        Number(
          eventTypeCounts[
            'shot-missed'
          ]
        ) || 0
      ) +
      (
        Number(
          eventTypeCounts[
            'shot-saved'
          ]
        ) || 0
      ) +
      (
        Number(
          eventTypeCounts.goal
        ) || 0
      );

    const visibleEvents =
      (
        Array.isArray(
          simulation.events
        )
          ? simulation.events
          : []
      ).filter(event =>
        ![
          'possession-advance',
        ].includes(
          event?.type
        )
      );

    /*
     * Produce a compact readable timeline of the first events.
     * This lets us inspect whether timestamps cluster naturally.
     */
    const formatClock =
      seconds => {
        const safeSeconds =
          Math.max(
            0,
            Number(seconds) || 0
          );

        const minutes =
          Math.floor(
            safeSeconds / 60
          );

        const remainingSeconds =
          safeSeconds % 60;

        return (
          `${minutes}:` +
          String(
            remainingSeconds
          ).padStart(
            2,
            '0'
          )
        );
      };

    const timelineSample =
      visibleEvents
        .slice(
          0,
          40
        )
        .map(event => ({
          period:
            event.period,

          clock:
            formatClock(
              event
                .clockSecondsRemaining
            ),

          type:
            event.type,

          side:
            event.side ||
            event.winnerSide ||
            event.penalizedSide ||
            null,
        }));

    const diagnostic = {
      gameId:
        simulation.gameId,

      date:
        simulation.date,

      teams: {
        home: {
          teamId:
            home.teamId,

          abbreviation:
            home.abbreviation,
        },

        away: {
          teamId:
            away.teamId,

          abbreviation:
            away.abbreviation,
        },
      },

      completedRegulation:
        simulation
          .regulationComplete === true,

        gameComplete:
          simulation
            .gameComplete === true,

        canonicalResultCreated:
          Boolean(
            finalization &&
            finalization.success === true &&
            finalization.gameResult
          ),

        finalized:
          simulation.finalized === true,

        finalizedGameResult:
          finalization?.gameResult
            ? structuredClone(
                finalization.gameResult
              )
            : null,

        wentToOvertime:
        simulation
          .wentToOvertime === true,

      wentToShootout:
        simulation
          .wentToShootout === true,

      resultType:
        simulation.resultType ||
        (
          simulation
            .wentToShootout === true
            ? 'shootout'
            : simulation
                .wentToOvertime === true
              ? 'overtime'
              : 'regulation'
        ),

      winnerSide:
        simulation.winnerSide ||
        (
          Number(home.score) >
          Number(away.score)
            ? 'home'
            : Number(away.score) >
                Number(home.score)
              ? 'away'
              : null
        ),

      steps,

      hitStepLimit:
        steps >= maxSteps,

      failures,

      finalScore: {
        home:
          Number(
            home.score
          ) || 0,

        away:
          Number(
            away.score
          ) || 0,
      },

      teamStats: {
        home: {
          shots:
            Number(
              home.shots
            ) || 0,

          hits:
            Number(
              home.hits
            ) || 0,

          blockedShots:
            Number(
              home.blockedShots
            ) || 0,

          giveaways:
            Number(
              home.giveaways
            ) || 0,

          takeaways:
            Number(
              home.takeaways
            ) || 0,

          penaltyMinutes:
            Number(
              home.penaltyMinutes
            ) || 0,

          powerPlayOpportunities:
            Number(
              home
                .powerPlayOpportunities
            ) || 0,

          powerPlayGoals:
            Number(
              home.powerPlayGoals
            ) || 0,

          faceoffWins:
            Number(
              home.faceoffWins
            ) || 0,
        },

        away: {
          shots:
            Number(
              away.shots
            ) || 0,

          hits:
            Number(
              away.hits
            ) || 0,

          blockedShots:
            Number(
              away.blockedShots
            ) || 0,

          giveaways:
            Number(
              away.giveaways
            ) || 0,

          takeaways:
            Number(
              away.takeaways
            ) || 0,

          penaltyMinutes:
            Number(
              away.penaltyMinutes
            ) || 0,

          powerPlayOpportunities:
            Number(
              away
                .powerPlayOpportunities
            ) || 0,

          powerPlayGoals:
            Number(
              away.powerPlayGoals
            ) || 0,

          faceoffWins:
            Number(
              away.faceoffWins
            ) || 0,
        },
      },

      totals: {
        goals:
          (
            Number(
              home.score
            ) || 0
          ) +
          (
            Number(
              away.score
            ) || 0
          ),

        shotsOnGoal:
          (
            Number(
              home.shots
            ) || 0
          ) +
          (
            Number(
              away.shots
            ) || 0
          ),

        shotAttempts,

        hits:
          (
            Number(
              home.hits
            ) || 0
          ) +
          (
            Number(
              away.hits
            ) || 0
          ),

        giveaways:
          (
            Number(
              home.giveaways
            ) || 0
          ) +
          (
            Number(
              away.giveaways
            ) || 0
          ),

        takeaways:
          (
            Number(
              home.takeaways
            ) || 0
          ) +
          (
            Number(
              away.takeaways
            ) || 0
          ),

        penaltyMinutes:
          (
            Number(
              home.penaltyMinutes
            ) || 0
          ) +
          (
            Number(
              away.penaltyMinutes
            ) || 0
          ),

        faceoffs:
          (
            Number(
              home.faceoffWins
            ) || 0
          ) +
          (
            Number(
              away.faceoffWins
            ) || 0
          ),

        recordedEvents:
          Array.isArray(
            simulation.events
          )
            ? simulation
                .events.length
            : 0,
      },

      eventTypeCounts,

      stepTypeCounts,

      timelineSample,
    };

    /*
     * Useful when running through a browser/Replit console,
     * while still returning the full result for a future dev UI.
     */
    console.log(
      '[Project Ice] Live Game Diagnostic',
      diagnostic
    );

    console.table(
      diagnostic.teamStats
    );

    console.table(
      timelineSample
    );

    return {
      success:
        failures.length === 0 &&
        simulation
          .gameComplete === true &&
        finalization
          ?.success === true &&
        Boolean(
          finalization
            ?.gameResult
        ),

      reason:
        failures.length > 0
          ? 'diagnostic-step-failed'
          : simulation
              .gameComplete !== true
            ? 'diagnostic-game-incomplete'
            : finalization
                ?.success !== true ||
              !finalization
                ?.gameResult
              ? 'diagnostic-finalization-failed'
              : 'diagnostic-game-and-result-completed',

      diagnostic,

      finalization,

      simulation,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — COMPETITIVE BALANCE DIAGNOSTIC
   * ============================================================
   *
   * Repeatedly simulates a strong team against a weak team using
   * the real live engine.
   *
   * Nothing is saved.
   * Nothing is applied to standings.
   * Nothing permanent is changed.
   *
   * Home ice alternates every game so roster strength is the main
   * variable being tested.
   */
  function runLiveGameCompetitiveBalanceDiagnostic(
    options = {}
  ) {
    const teams =
      Array.isArray(
        _state.teams
      )
        ? _state.teams
        : [];

    if (teams.length < 2) {
      return {
        success: false,
        reason:
          'not-enough-teams-for-competitive-diagnostic',
      };
    }

    const sampleSize =
      Math.max(
        20,
        Math.min(
          1000,
          Number(
            options.sampleSize
          ) || 300
        )
      );

    /*
     * ==========================================================
     * TEAM QUALITY ESTIMATE
     * ==========================================================
     *
     * This is used ONLY to choose which two real teams to test.
     *
     * The games themselves do NOT use this number.
     * The real live engine still uses actual players, attributes,
     * deployments, goalies, PP/PK units, etc.
     */
    const getTeamDiagnosticQuality =
      team => {
        const roster =
          Array.isArray(
            team?.roster
          )
            ? team.roster
            : [];

        const activePlayers =
          roster.filter(
            player =>
              player &&
              (
                player.lineupStatus ===
                  'active' ||
                Boolean(
                  player.lineupAssignment
                )
              )
          );

        if (
          activePlayers.length === 0
        ) {
          return null;
        }

        const skaters =
          activePlayers.filter(
            player =>
              normalizeAttributePosition(
                player.position
              ) !== 'G'
          );

        const goalies =
          activePlayers.filter(
            player =>
              normalizeAttributePosition(
                player.position
              ) === 'G'
          );

        if (
          skaters.length < 10 ||
          goalies.length === 0
        ) {
          return null;
        }

        const average =
          entries =>
            entries.length > 0
              ? entries.reduce(
                  (
                    total,
                    player
                  ) =>
                    total +
                    (
                      Number(
                        player.overall
                      ) || 50
                    ),
                  0
                ) /
                entries.length
              : 50;

        const skaterAverage =
          average(
            skaters
          );

        const goalieAverage =
          average(
            goalies.slice(
              0,
              2
            )
          );

        /*
         * Skater depth matters most, but goaltending gets enough
         * weight to keep an elite/poor starter from being ignored.
         */
        const quality =
          skaterAverage *
            0.78 +
          goalieAverage *
            0.22;

        return {
          team,
          teamId:
            team.teamId,

          abbreviation:
            team.abbreviation ||
            team.teamName ||
            team.schoolName ||
            team.teamId,

          skaterAverage,

          goalieAverage,

          quality,
        };
      };

    const rankedTeams =
      teams
        .map(
          getTeamDiagnosticQuality
        )
        .filter(Boolean)
        .sort(
          (
            firstTeam,
            secondTeam
          ) =>
            secondTeam.quality -
            firstTeam.quality
        );

    if (
      rankedTeams.length < 2
    ) {
      return {
        success: false,
        reason:
          'not-enough-valid-teams-for-competitive-diagnostic',
      };
    }

    /*
     * ==========================================================
     * REQUESTED MATCHUP OVERRIDE
     * ==========================================================
     *
     * By default this diagnostic still tests the strongest valid
     * team against the weakest valid team.
     *
     * Gradient diagnostics can instead supply two specific team IDs
     * while reusing this exact same simulation/testing pipeline.
     */
    const requestedStrongTeamId =
      options.strongTeamId ||
      null;

    const requestedWeakTeamId =
      options.weakTeamId ||
      null;

    const strongTeam =
      requestedStrongTeamId
        ? rankedTeams.find(
            entry =>
              String(
                entry.teamId
              ) ===
              String(
                requestedStrongTeamId
              )
          ) ||
          null
        : rankedTeams[0];

    const weakTeam =
      requestedWeakTeamId
        ? rankedTeams.find(
            entry =>
              String(
                entry.teamId
              ) ===
              String(
                requestedWeakTeamId
              )
          ) ||
          null
        : rankedTeams[
            rankedTeams.length - 1
          ];

    if (
      !strongTeam ||
      !weakTeam
    ) {
      return {
        success: false,
        reason:
          'requested-competitive-diagnostic-team-not-found',
      };
    }

    if (
      String(
        strongTeam.teamId
      ) ===
      String(
        weakTeam.teamId
      )
    ) {
      return {
        success: false,
        reason:
          'competitive-diagnostic-teams-identical',
      };
    }

    let completedGames = 0;
    let failedGames = 0;

    let strongWins = 0;
    let weakWins = 0;

    let strongRegulationWins = 0;
    let weakRegulationWins = 0;

    let overtimeGames = 0;
    let shootoutGames = 0;

    let strongGoals = 0;
    let weakGoals = 0;

    let strongShots = 0;
    let weakShots = 0;

    let strongPowerPlayOpportunities =
      0;

    let weakPowerPlayOpportunities =
      0;

    let strongPowerPlayGoals =
      0;

    let weakPowerPlayGoals =
      0;

    let strongHomeGames = 0;
    let weakHomeGames = 0;

    let strongHomeWins = 0;
    let weakHomeWins = 0;

    const failures = [];

    for (
      let index = 0;
      index < sampleSize;
      index += 1
    ) {
      /*
       * Alternate home ice every game.
       */
      const strongIsHome =
        index % 2 === 0;

      const homeTeamId =
        strongIsHome
          ? strongTeam.teamId
          : weakTeam.teamId;

      const awayTeamId =
        strongIsHome
          ? weakTeam.teamId
          : strongTeam.teamId;

      const diagnostic =
        runLiveGameSimulationDiagnostic(
          null,
          {
            scheduledGame: {
              gameId:
                `competitive-${Date.now()}-${index}-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,

              eventId:
                `competitive-${index}`,

              date:
                _state.season
                  ?.currentDate ||
                _state.player
                  ?.currentDate ||
                null,

              homeTeamId,

              awayTeamId,
            },

            maxSteps:
              Number(
                options.maxSteps
              ) || 4000,
          }
        );

      if (
        !diagnostic ||
        diagnostic.success !== true ||
        !diagnostic.diagnostic ||
        !diagnostic.finalization
          ?.gameResult
      ) {
        failedGames += 1;

        failures.push({
          index,

          reason:
            diagnostic?.reason ||
            diagnostic
              ?.diagnostic
              ?.failures?.[0]
              ?.reason ||
            'competitive-game-failed',
        });

        continue;
      }

      completedGames += 1;

      const result =
        diagnostic
          .finalization
          .gameResult;

      const strongResult =
        String(
          result.homeTeamId
        ) ===
        String(
          strongTeam.teamId
        )
          ? result.home
          : result.away;

      const weakResult =
        String(
          result.homeTeamId
        ) ===
        String(
          weakTeam.teamId
        )
          ? result.home
          : result.away;

      const strongWon =
        String(
          result.winnerTeamId
        ) ===
        String(
          strongTeam.teamId
        );

      if (strongWon) {
        strongWins += 1;
      } else {
        weakWins += 1;
      }

      if (
        result.resultType ===
        'regulation'
      ) {
        if (strongWon) {
          strongRegulationWins +=
            1;
        } else {
          weakRegulationWins +=
            1;
        }
      }

      if (
        result.wentToOvertime ===
        true
      ) {
        overtimeGames += 1;
      }

      if (
        result.wentToShootout ===
        true
      ) {
        shootoutGames += 1;
      }

      strongGoals +=
        Number(
          strongResult.score
        ) || 0;

      weakGoals +=
        Number(
          weakResult.score
        ) || 0;

      strongShots +=
        Number(
          strongResult.shots
        ) || 0;

      weakShots +=
        Number(
          weakResult.shots
        ) || 0;

      strongPowerPlayOpportunities +=
        Number(
          strongResult
            .powerPlayOpportunities
        ) || 0;

      weakPowerPlayOpportunities +=
        Number(
          weakResult
            .powerPlayOpportunities
        ) || 0;

      strongPowerPlayGoals +=
        Number(
          strongResult
            .powerPlayGoals
        ) || 0;

      weakPowerPlayGoals +=
        Number(
          weakResult
            .powerPlayGoals
        ) || 0;

      if (strongIsHome) {
        strongHomeGames += 1;

        if (strongWon) {
          strongHomeWins += 1;
        }
      } else {
        weakHomeGames += 1;

        if (!strongWon) {
          weakHomeWins += 1;
        }
      }
    }

    const safeCompleted =
      Math.max(
        1,
        completedGames
      );

    const strongWinRate =
      strongWins /
      safeCompleted;

    const weakWinRate =
      weakWins /
      safeCompleted;

    const strongPowerPlayPercentage =
      strongPowerPlayOpportunities >
      0
        ? strongPowerPlayGoals /
          strongPowerPlayOpportunities
        : 0;

    const weakPowerPlayPercentage =
      weakPowerPlayOpportunities >
      0
        ? weakPowerPlayGoals /
          weakPowerPlayOpportunities
        : 0;

    const report = {
      sampleSize,

      completedGames,
      failedGames,

      strongTeam: {
        teamId:
          strongTeam.teamId,

        abbreviation:
          strongTeam.abbreviation,

        diagnosticQuality:
          Number(
            strongTeam.quality
              .toFixed(2)
          ),

        skaterAverage:
          Number(
            strongTeam
              .skaterAverage
              .toFixed(2)
          ),

        goalieAverage:
          Number(
            strongTeam
              .goalieAverage
              .toFixed(2)
          ),

        wins:
          strongWins,

        winRate:
          Number(
            (
              strongWinRate *
              100
            ).toFixed(1)
          ),

        regulationWins:
          strongRegulationWins,

        goalsPerGame:
          Number(
            (
              strongGoals /
              safeCompleted
            ).toFixed(2)
          ),

        shotsPerGame:
          Number(
            (
              strongShots /
              safeCompleted
            ).toFixed(2)
          ),

        powerPlayOpportunitiesPerGame:
          Number(
            (
              strongPowerPlayOpportunities /
              safeCompleted
            ).toFixed(2)
          ),

        powerPlayPercentage:
          Number(
            (
              strongPowerPlayPercentage *
              100
            ).toFixed(1)
          ),

        homeWinRate:
          strongHomeGames > 0
            ? Number(
                (
                  (
                    strongHomeWins /
                    strongHomeGames
                  ) *
                  100
                ).toFixed(1)
              )
            : 0,
      },

      weakTeam: {
        teamId:
          weakTeam.teamId,

        abbreviation:
          weakTeam.abbreviation,

        diagnosticQuality:
          Number(
            weakTeam.quality
              .toFixed(2)
          ),

        skaterAverage:
          Number(
            weakTeam
              .skaterAverage
              .toFixed(2)
          ),

        goalieAverage:
          Number(
            weakTeam
              .goalieAverage
              .toFixed(2)
          ),

        wins:
          weakWins,

        winRate:
          Number(
            (
              weakWinRate *
              100
            ).toFixed(1)
          ),

        regulationWins:
          weakRegulationWins,

        goalsPerGame:
          Number(
            (
              weakGoals /
              safeCompleted
            ).toFixed(2)
          ),

        shotsPerGame:
          Number(
            (
              weakShots /
              safeCompleted
            ).toFixed(2)
          ),

        powerPlayOpportunitiesPerGame:
          Number(
            (
              weakPowerPlayOpportunities /
              safeCompleted
            ).toFixed(2)
          ),

        powerPlayPercentage:
          Number(
            (
              weakPowerPlayPercentage *
              100
            ).toFixed(1)
          ),

        homeWinRate:
          weakHomeGames > 0
            ? Number(
                (
                  (
                    weakHomeWins /
                    weakHomeGames
                  ) *
                  100
                ).toFixed(1)
              )
            : 0,
      },

      overtimeRate:
        Number(
          (
            overtimeGames /
            safeCompleted *
            100
          ).toFixed(1)
        ),

      shootoutRate:
        Number(
          (
            shootoutGames /
            safeCompleted *
            100
          ).toFixed(1)
        ),

      goalDifferentialPerGame:
        Number(
          (
            (
              strongGoals -
              weakGoals
            ) /
            safeCompleted
          ).toFixed(2)
        ),

      shotDifferentialPerGame:
        Number(
          (
            (
              strongShots -
              weakShots
            ) /
            safeCompleted
          ).toFixed(2)
        ),

      failures:
        failures.slice(
          0,
          20
        ),
    };

    console.log(
      '[Project Ice] Competitive Balance Diagnostic',
      report
    );

    console.table({
      Strong: {
        Team:
          report
            .strongTeam
            .abbreviation,

        Quality:
          report
            .strongTeam
            .diagnosticQuality,

        'Win %':
          report
            .strongTeam
            .winRate,

        'Goals/Game':
          report
            .strongTeam
            .goalsPerGame,

        'Shots/Game':
          report
            .strongTeam
            .shotsPerGame,

        'PP %':
          report
            .strongTeam
            .powerPlayPercentage,
      },

      Weak: {
        Team:
          report
            .weakTeam
            .abbreviation,

        Quality:
          report
            .weakTeam
            .diagnosticQuality,

        'Win %':
          report
            .weakTeam
            .winRate,

        'Goals/Game':
          report
            .weakTeam
            .goalsPerGame,

        'Shots/Game':
          report
            .weakTeam
            .shotsPerGame,

        'PP %':
          report
            .weakTeam
            .powerPlayPercentage,
      },
    });

    return {
      success:
        completedGames > 0 &&
        failedGames === 0,

      reason:
        failedGames > 0
          ? 'competitive-diagnostic-had-failures'
          : 'competitive-diagnostic-completed',

      report,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — STRENGTH GRADIENT DIAGNOSTIC
   * ============================================================
   *
   * Tests the entire league talent curve rather than only the
   * strongest team against the weakest team.
   *
   * With eight valid teams this produces:
   *
   * #1 vs #8
   * #2 vs #7
   * #3 vs #6
   * #4 vs #5
   *
   * Every matchup reuses the canonical competitive-balance
   * diagnostic, including alternating home ice.
   */
  function runLiveGameStrengthGradientDiagnostic(
    options = {}
  ) {
    const teams =
      Array.isArray(
        _state.teams
      )
        ? _state.teams
        : [];

    const gamesPerMatchup =
      Math.max(
        50,
        Math.min(
          500,
          Number(
            options.gamesPerMatchup
          ) || 150
        )
      );

    /*
     * Use the exact same diagnostic-quality philosophy as the
     * competitive-balance test.
     *
     * This ranking ONLY chooses matchups.
     * It does not affect simulation outcomes.
     */
    const getTeamQuality =
      team => {
        const roster =
          Array.isArray(
            team?.roster
          )
            ? team.roster
            : [];

        const activePlayers =
          roster.filter(
            player =>
              player &&
              (
                player.lineupStatus ===
                  'active' ||
                Boolean(
                  player.lineupAssignment
                )
              )
          );

        const skaters =
          activePlayers.filter(
            player =>
              normalizeAttributePosition(
                player.position
              ) !== 'G'
          );

        const goalies =
          activePlayers.filter(
            player =>
              normalizeAttributePosition(
                player.position
              ) === 'G'
          );

        if (
          skaters.length < 10 ||
          goalies.length === 0
        ) {
          return null;
        }

        const average =
          entries =>
            entries.length > 0
              ? entries.reduce(
                  (
                    total,
                    player
                  ) =>
                    total +
                    (
                      Number(
                        player.overall
                      ) || 50
                    ),
                  0
                ) /
                entries.length
              : 50;

        const skaterAverage =
          average(
            skaters
          );

        const goalieAverage =
          average(
            goalies.slice(
              0,
              2
            )
          );

        return {
          teamId:
            team.teamId,

          abbreviation:
            team.abbreviation ||
            team.teamName ||
            team.schoolName ||
            team.teamId,

          quality:
            skaterAverage *
              0.78 +
            goalieAverage *
              0.22,
        };
      };

    const rankedTeams =
      teams
        .map(
          getTeamQuality
        )
        .filter(Boolean)
        .sort(
          (
            firstTeam,
            secondTeam
          ) =>
            secondTeam.quality -
            firstTeam.quality
        );

    if (
      rankedTeams.length < 4
    ) {
      return {
        success: false,
        reason:
          'not-enough-teams-for-strength-gradient',
        report: null,
      };
    }

    /*
     * Pair strongest with weakest, second strongest with second
     * weakest, etc.
     */
    const matchupCount =
      Math.floor(
        rankedTeams.length / 2
      );

    const matchups = [];

    let totalCompletedGames = 0;
    let totalFailedGames = 0;

    for (
      let index = 0;
      index < matchupCount;
      index += 1
    ) {
      const higherTeam =
        rankedTeams[index];

      const lowerTeam =
        rankedTeams[
          rankedTeams.length -
          1 -
          index
        ];

      if (
        !higherTeam ||
        !lowerTeam ||
        String(
          higherTeam.teamId
        ) ===
        String(
          lowerTeam.teamId
        )
      ) {
        continue;
      }

      const result =
        runLiveGameCompetitiveBalanceDiagnostic({
          sampleSize:
            gamesPerMatchup,

          strongTeamId:
            higherTeam.teamId,

          weakTeamId:
            lowerTeam.teamId,

          maxSteps:
            Number(
              options.maxSteps
            ) || 4000,
        });

      if (
        !result ||
        !result.report
      ) {
        matchups.push({
          matchup:
            index + 1,

          success: false,

          reason:
            result?.reason ||
            'gradient-matchup-failed',

          higherTeam:
            higherTeam.abbreviation,

          lowerTeam:
            lowerTeam.abbreviation,
        });

        continue;
      }

      const report =
        result.report;

      totalCompletedGames +=
        Number(
          report.completedGames
        ) || 0;

      totalFailedGames +=
        Number(
          report.failedGames
        ) || 0;

      matchups.push({
        matchup:
          index + 1,

        success:
          result.success === true,

        higherRank:
          index + 1,

        lowerRank:
          rankedTeams.length -
          index,

        higherTeam:
          report
            .strongTeam
            .abbreviation,

        lowerTeam:
          report
            .weakTeam
            .abbreviation,

        higherQuality:
          report
            .strongTeam
            .diagnosticQuality,

        lowerQuality:
          report
            .weakTeam
            .diagnosticQuality,

        qualityGap:
          Number(
            (
              report
                .strongTeam
                .diagnosticQuality -
              report
                .weakTeam
                .diagnosticQuality
            ).toFixed(2)
          ),

        higherWinRate:
          report
            .strongTeam
            .winRate,

        lowerWinRate:
          report
            .weakTeam
            .winRate,

        higherGoalsPerGame:
          report
            .strongTeam
            .goalsPerGame,

        lowerGoalsPerGame:
          report
            .weakTeam
            .goalsPerGame,

        goalDifferentialPerGame:
          report
            .goalDifferentialPerGame,

        higherShotsPerGame:
          report
            .strongTeam
            .shotsPerGame,

        lowerShotsPerGame:
          report
            .weakTeam
            .shotsPerGame,

        shotDifferentialPerGame:
          report
            .shotDifferentialPerGame,

        higherPowerPlayPercentage:
          report
            .strongTeam
            .powerPlayPercentage,

        lowerPowerPlayPercentage:
          report
            .weakTeam
            .powerPlayPercentage,

        overtimeRate:
          report.overtimeRate,

        shootoutRate:
          report.shootoutRate,

        completedGames:
          report.completedGames,

        failedGames:
          report.failedGames,
      });
    }

    const successfulMatchups =
      matchups.filter(
        matchup =>
          matchup.success === true
      );

    const report = {
      gamesPerMatchup,

      matchupCount:
        matchups.length,

      successfulMatchups:
        successfulMatchups.length,

      totalCompletedGames,

      totalFailedGames,

      rankings:
        rankedTeams.map(
          (
            team,
            index
          ) => ({
            rank:
              index + 1,

            abbreviation:
              team.abbreviation,

            quality:
              Number(
                team.quality.toFixed(
                  2
                )
              ),
          })
        ),

      matchups,
    };

    console.log(
      '[Project Ice] Strength Gradient Diagnostic',
      report
    );

    return {
      success:
        successfulMatchups.length ===
          matchups.length &&
        totalFailedGames === 0,

      reason:
        totalFailedGames > 0
          ? 'strength-gradient-had-failures'
          : successfulMatchups.length !==
              matchups.length
            ? 'strength-gradient-matchup-failed'
            : 'strength-gradient-completed',

      report,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — TEAM SIMULATION PROFILE
   * ============================================================
   *
   * Read-only diagnostic.
   *
   * Summarizes a real team's roster through the same types of
   * attributes the live-game resolver actually cares about.
   *
   * This does NOT affect simulation outcomes.
   */
  function getLiveGameTeamSimulationProfile(
    teamId
  ) {
    const team =
      getTeamById(
        teamId
      );

    if (!team) {
      return {
        success: false,
        reason:
          'team-simulation-profile-team-not-found',
        profile: null,
      };
    }

    const roster =
      Array.isArray(
        team.roster
      )
        ? team.roster
        : [];

    const activePlayers =
      roster.filter(
        player =>
          player &&
          player.injured !== true &&
          player.lineupStatus !==
            'unavailable' &&
          (
            player.lineupStatus ===
              'active' ||
            Boolean(
              player.lineupAssignment
            )
          )
      );

    const skaters =
      activePlayers.filter(
        player =>
          normalizeAttributePosition(
            player.position
          ) !== 'G'
      );

    const goalies =
      activePlayers.filter(
        player =>
          normalizeAttributePosition(
            player.position
          ) === 'G'
      );

    if (
      skaters.length === 0 ||
      goalies.length === 0
    ) {
      return {
        success: false,
        reason:
          'team-simulation-profile-roster-incomplete',
        profile: null,
      };
    }

    const clamp =
      value =>
        Math.max(
          25,
          Math.min(
            99,
            Number(value) || 50
          )
        );

    const average =
      values => {
        const safeValues =
          values.filter(
            value =>
              Number.isFinite(
                Number(value)
              )
          );

        if (
          safeValues.length === 0
        ) {
          return 50;
        }

        return (
          safeValues.reduce(
            (
              total,
              value
            ) =>
              total +
              Number(value),
            0
          ) /
          safeValues.length
        );
      };

    const getAttributes =
      player =>
        player?.attributes ||
        {};

    /*
     * ==========================================================
     * SIMPLE OVERALL QUALITY
     * ==========================================================
     *
     * Same broad ranking concept used by the competitive diagnostic.
     * This is included only so we can compare it against the much
     * richer simulation-facing categories below.
     */
    const skaterOverall =
      average(
        skaters.map(
          player =>
            Number(
              player.overall
            ) || 50
        )
      );

    const sortedGoalies =
      [...goalies].sort(
        (
          firstGoalie,
          secondGoalie
        ) =>
          (
            Number(
              secondGoalie.overall
            ) || 50
          ) -
          (
            Number(
              firstGoalie.overall
            ) || 50
          )
      );

    /*
     * Prefer the actual starter assignment when available.
     * Otherwise use the highest-rated active goalie.
     */
    const starterGoalie =
      goalies.find(
        goalie =>
          goalie.rosterSlot ===
            'G1' ||
          goalie
            .lineupAssignment
            ?.rosterSlot ===
            'G1' ||
          goalie
            .lineupAssignment
            ?.line === 1
      ) ||
      sortedGoalies[0] ||
      null;

    const goalieOverall =
      starterGoalie
        ? Number(
            starterGoalie.overall
          ) || 50
        : 50;

    const overallQuality =
      skaterOverall *
        0.78 +
      goalieOverall *
        0.22;

    /*
     * ==========================================================
     * EVEN-STRENGTH POSSESSION OFFENSE
     * ==========================================================
     *
     * Mirrors the offensive attribute blend used by
     * getLiveGamePossessionMatchup().
     */
    const possessionOffense =
      average(
        skaters.map(
          player => {
            const attributes =
              getAttributes(
                player
              );

            return (
              clamp(
                attributes.passing
              ) * 0.28 +
              clamp(
                attributes.puckControl
              ) * 0.27 +
              clamp(
                attributes
                  .offensiveAwareness
              ) * 0.18 +
              clamp(
                attributes.speed
              ) * 0.10 +
              clamp(
                attributes.acceleration
              ) * 0.07 +
              clamp(
                attributes.poise
              ) * 0.10
            );
          }
        )
      );

    /*
     * ==========================================================
     * EVEN-STRENGTH DEFENSIVE DISRUPTION
     * ==========================================================
     *
     * Mirrors the defensive attribute blend used by
     * getLiveGamePossessionMatchup().
     */
    const defensiveDisruption =
      average(
        skaters.map(
          player => {
            const attributes =
              getAttributes(
                player
              );

            return (
              clamp(
                attributes
                  .defensiveAwareness
              ) * 0.30 +
              clamp(
                attributes
                  .stickChecking
              ) * 0.25 +
              clamp(
                attributes.agility
              ) * 0.12 +
              clamp(
                attributes.speed
              ) * 0.10 +
              clamp(
                attributes.strength
              ) * 0.08 +
              clamp(
                attributes
                  .bodyChecking
              ) * 0.07 +
              clamp(
                attributes.poise
              ) * 0.08
            );
          }
        )
      );

    /*
     * ==========================================================
     * SHOOTING / FINISHING PROFILE
     * ==========================================================
     *
     * Broad snapshot of the attributes feeding shooter selection,
     * shot types and finishing.
     *
     * This is intentionally diagnostic only — the actual resolver
     * still calculates every real shot individually.
     */
    const finishing =
      average(
        skaters.map(
          player => {
            const attributes =
              getAttributes(
                player
              );

            return (
              clamp(
                attributes
                  .wristShotAccuracy
              ) * 0.27 +
              clamp(
                attributes
                  .wristShotPower
              ) * 0.10 +
              clamp(
                attributes
                  .slapShotAccuracy
              ) * 0.13 +
              clamp(
                attributes
                  .slapShotPower
              ) * 0.10 +
              clamp(
                attributes
                  .offensiveAwareness
              ) * 0.18 +
              clamp(
                attributes.handEye
              ) * 0.08 +
              clamp(
                attributes.puckControl
              ) * 0.08 +
              clamp(
                attributes.deking
              ) * 0.06
            );
          }
        )
      );

    /*
     * ==========================================================
     * STARTING GOALIE PROFILE
     * ==========================================================
     */
    let goalieSaveAbility =
      50;

    let goalieReboundAbility =
      50;

    let goalieScrambleAbility =
      50;

    if (starterGoalie) {
      const goalieProfile =
        getLiveGameGoalieSaveProfile({
          playerId:
            starterGoalie.playerId ||
            starterGoalie.id,
        });

      if (
        goalieProfile?.success ===
        true
      ) {
        goalieSaveAbility =
          goalieProfile
            .saveAbility;

        goalieReboundAbility =
          goalieProfile
            .reboundAbility;

        goalieScrambleAbility =
          goalieProfile
            .scrambleAbility;
      }
    }

    /*
     * ==========================================================
     * SPECIAL-TEAMS PLAYER COLLECTION
     * ==========================================================
     */
    const getUnitPlayers =
      units => {
        const entries = [];

        (
          Array.isArray(units)
            ? units.slice(0, 2)
            : []
        ).forEach(
          (
            unit,
            unitIndex
          ) => {
            const slots =
              unit?.slots &&
              typeof unit.slots ===
                'object'
                ? Object.values(
                    unit.slots
                  )
                : [];

            slots.forEach(
              playerId => {
                if (!playerId) {
                  return;
                }

                const player =
                  getPlayerById(
                    playerId
                  );

                if (!player) {
                  return;
                }

                /*
                 * Unit 1 receives modestly more diagnostic weight
                 * because it receives the more important deployment.
                 */
                entries.push({
                  player,
                  weight:
                    unitIndex === 0
                      ? 1.25
                      : 0.85,
                });
              }
            );
          }
        );

        return entries;
      };

    const weightedAverage =
      (
        entries,
        ratingFunction
      ) => {
        if (
          !Array.isArray(entries) ||
          entries.length === 0
        ) {
          return 50;
        }

        let weightedTotal =
          0;

        let totalWeight =
          0;

        entries.forEach(
          entry => {
            const weight =
              Math.max(
                0,
                Number(
                  entry.weight
                ) || 0
              );

            if (weight <= 0) {
              return;
            }

            weightedTotal +=
              ratingFunction(
                entry.player
              ) *
              weight;

            totalWeight +=
              weight;
          }
        );

        return totalWeight > 0
          ? weightedTotal /
            totalWeight
          : 50;
      };

    const powerPlayPlayers =
      getUnitPlayers(
        team
          .specialTeams
          ?.powerPlay
      );

    const penaltyKillPlayers =
      getUnitPlayers(
        team
          .specialTeams
          ?.penaltyKill
      );

    /*
     * Mirrors the actual PP attribute blend used by
     * getLiveGameSpecialTeamsMatchup().
     */
    const powerPlayQuality =
      weightedAverage(
        powerPlayPlayers,
        player => {
          const attributes =
            getAttributes(
              player
            );

          const shotThreat =
            (
              clamp(
                attributes
                  .wristShotAccuracy
              ) +
              clamp(
                attributes
                  .slapShotAccuracy
              )
            ) /
            2;

          return (
            clamp(
              attributes.passing
            ) * 0.27 +
            clamp(
              attributes
                .offensiveAwareness
            ) * 0.23 +
            clamp(
              attributes.puckControl
            ) * 0.20 +
            shotThreat *
              0.18 +
            clamp(
              attributes.poise
            ) * 0.12
          );
        }
      );

    /*
     * Mirrors the actual PK attribute blend used by
     * getLiveGameSpecialTeamsMatchup().
     */
    const penaltyKillQuality =
      weightedAverage(
        penaltyKillPlayers,
        player => {
          const attributes =
            getAttributes(
              player
            );

          return (
            clamp(
              attributes
                .defensiveAwareness
            ) * 0.30 +
            clamp(
              attributes
                .stickChecking
            ) * 0.24 +
            clamp(
              attributes
                .shotBlocking
            ) * 0.18 +
            clamp(
              attributes.agility
            ) * 0.10 +
            clamp(
              attributes.speed
            ) * 0.10 +
            clamp(
              attributes.poise
            ) * 0.08
          );
        }
      );

    const round =
      value =>
        Number(
          (
            Number(value) || 0
          ).toFixed(2)
        );

    const profile = {
      teamId:
        team.teamId,

      abbreviation:
        team.abbreviation ||
        team.teamName ||
        team.schoolName ||
        team.teamId,

      overallQuality:
        round(
          overallQuality
        ),

      skaterOverall:
        round(
          skaterOverall
        ),

      starterGoalieOverall:
        round(
          goalieOverall
        ),

      possessionOffense:
        round(
          possessionOffense
        ),

      defensiveDisruption:
        round(
          defensiveDisruption
        ),

      finishing:
        round(
          finishing
        ),

      goalieSaveAbility:
        round(
          goalieSaveAbility
        ),

      goalieReboundAbility:
        round(
          goalieReboundAbility
        ),

      goalieScrambleAbility:
        round(
          goalieScrambleAbility
        ),

      powerPlayQuality:
        round(
          powerPlayQuality
        ),

      penaltyKillQuality:
        round(
          penaltyKillQuality
        ),

      starterGoalieId:
        starterGoalie
          ?.playerId ||
        starterGoalie?.id ||
        null,

      activeSkaters:
        skaters.length,

      activeGoalies:
        goalies.length,
    };

    return {
      success: true,

      reason:
        'team-simulation-profile-created',

      profile,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — DIAGNOSTIC ATTRIBUTE OVERRIDE
   * ============================================================
   *
   * DEV / DIAGNOSTIC ONLY.
   *
   * Temporarily adjusts selected player attributes for controlled
   * simulation testing.
   *
   * Every original value is snapshotted so it can be restored
   * exactly after the diagnostic finishes.
   *
   * This helper must NEVER be used for normal career progression.
   */
  function applyLiveGameDiagnosticAttributeOverride(
    players,
    attributeNames,
    adjustment
  ) {
    if (
      !Array.isArray(players) ||
      !Array.isArray(attributeNames)
    ) {
      return {
        success: false,
        reason:
          'invalid-diagnostic-attribute-override',
        snapshots: [],
      };
    }

    const safeAdjustment =
      Number(adjustment) || 0;

    const snapshots = [];

    players.forEach(
      player => {
        if (!player) {
          return;
        }

        const canonicalPlayer =
          getPlayerById(
            player.playerId ||
            player.id
          );

        if (!canonicalPlayer) {
          return;
        }

        if (
          !canonicalPlayer.attributes ||
          typeof canonicalPlayer.attributes !==
            'object'
        ) {
          canonicalPlayer.attributes = {};
        }

        attributeNames.forEach(
          attributeName => {
            if (!attributeName) {
              return;
            }

            const hadOwnValue =
              Object.prototype
                .hasOwnProperty.call(
                  canonicalPlayer.attributes,
                  attributeName
                );

            const originalValue =
              canonicalPlayer
                .attributes[
                  attributeName
                ];

            snapshots.push({
              player:
                canonicalPlayer,

              attributeName,

              hadOwnValue,

              originalValue,
            });

            const currentValue =
              Number(
                originalValue
              ) || 50;

            canonicalPlayer
              .attributes[
                attributeName
              ] =
              Math.max(
                25,
                Math.min(
                  99,
                  currentValue +
                  safeAdjustment
                )
              );
          }
        );
      }
    );

    return {
      success: true,

      reason:
        'diagnostic-attribute-override-applied',

      snapshots,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — RESTORE DIAGNOSTIC ATTRIBUTE OVERRIDE
   * ============================================================
   */
  function restoreLiveGameDiagnosticAttributeOverride(
    snapshots
  ) {
    if (!Array.isArray(snapshots)) {
      return false;
    }

    /*
     * Restore in reverse order in case the same attribute was ever
     * touched more than once during a future diagnostic.
     */
    [...snapshots]
      .reverse()
      .forEach(
        snapshot => {
          const player =
            snapshot?.player;

          const attributeName =
            snapshot
              ?.attributeName;

          if (
            !player ||
            !attributeName ||
            !player.attributes
          ) {
            return;
          }

          if (
            snapshot.hadOwnValue
          ) {
            player.attributes[
              attributeName
            ] =
              snapshot
                .originalValue;
          } else {
            delete player
              .attributes[
                attributeName
              ];
          }
        }
      );

    return true;
  }

  /*
   * ============================================================
   * LIVE GAME — ATTRIBUTE ISOLATION DIAGNOSTIC
   * ============================================================
   *
   * Runs controlled tests where one hockey skill family is boosted
   * while everything else stays unchanged.
   *
   * All temporary attribute changes are restored with try/finally.
   */
  function runLiveGameAttributeIsolationDiagnostic(
    options = {}
  ) {
    const teams =
      Array.isArray(
        _state.teams
      )
        ? _state.teams
        : [];

    const gamesPerTest =
      Math.max(
        50,
        Math.min(
          400,
          Number(
            options.gamesPerTest
          ) || 150
        )
      );

    const validProfiles =
      teams
        .map(
          team => {
            const result =
              getLiveGameTeamSimulationProfile(
                team.teamId
              );

            return result?.success === true
              ? {
                  team,
                  profile:
                    result.profile,
                }
              : null;
          }
        )
        .filter(Boolean)
        .sort(
          (
            first,
            second
          ) =>
            first.profile.overallQuality -
            second.profile.overallQuality
        );

    if (
      validProfiles.length < 2
    ) {
      return {
        success: false,
        reason:
          'not-enough-valid-teams-for-attribute-isolation',
        report: null,
      };
    }

    /*
     * Pick two teams near the middle of the league so the baseline
     * matchup is reasonably competitive.
     */
    const middleIndex =
      Math.floor(
        validProfiles.length / 2
      );

    const testTeamEntry =
      validProfiles[
        Math.max(
          0,
          middleIndex - 1
        )
      ];

    const controlTeamEntry =
      validProfiles[
        Math.min(
          validProfiles.length - 1,
          middleIndex
        )
      ];

    const testTeam =
      testTeamEntry.team;

    const controlTeam =
      controlTeamEntry.team;

    const getActiveSkaters =
      team =>
        (
          Array.isArray(
            team?.roster
          )
            ? team.roster
            : []
        ).filter(
          player =>
            player &&
            player.injured !== true &&
            player.lineupStatus !==
              'unavailable' &&
            (
              player.lineupStatus ===
                'active' ||
              Boolean(
                player.lineupAssignment
              )
            ) &&
            normalizeAttributePosition(
              player.position
            ) !== 'G'
        );

    const getActiveGoalies =
      team =>
        (
          Array.isArray(
            team?.roster
          )
            ? team.roster
            : []
        ).filter(
          player =>
            player &&
            player.injured !== true &&
            player.lineupStatus !==
              'unavailable' &&
            (
              player.lineupStatus ===
                'active' ||
              Boolean(
                player.lineupAssignment
              )
            ) &&
            normalizeAttributePosition(
              player.position
            ) === 'G'
        );

    const testSkaters =
      getActiveSkaters(
        testTeam
      );

    const testGoalies =
      getActiveGoalies(
        testTeam
      );

    if (
      testSkaters.length === 0 ||
      testGoalies.length === 0
    ) {
      return {
        success: false,
        reason:
          'attribute-isolation-test-roster-incomplete',
        report: null,
      };
    }

    const boost =
      Math.max(
        1,
        Math.min(
          15,
          Number(
            options.boost
          ) || 8
        )
      );

    /*
     * Every test uses the SAME two teams.
     *
     * Only the listed attributes change.
     */
    const tests = [
      {
        key:
          'baseline',

        label:
          'Baseline',

        players: [],

        attributes: [],
      },

      {
        key:
          'shooting',

        label:
          'Shooting +8',

        players:
          testSkaters,

        attributes: [
          'wristShotAccuracy',
          'wristShotPower',
          'slapShotAccuracy',
          'slapShotPower',
          'handEye',
        ],
      },

      {
        key:
          'possession',

        label:
          'Possession +8',

        players:
          testSkaters,

        attributes: [
          'passing',
          'puckControl',
          'offensiveAwareness',
          'speed',
          'acceleration',
          'poise',
        ],
      },

      {
        key:
          'defense',

        label:
          'Defense +8',

        players:
          testSkaters,

        attributes: [
          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'agility',
          'strength',
          'bodyChecking',
          'poise',
        ],
      },

      {
        key:
          'goalie',

        label:
          'Goalie +8',

        players:
          testGoalies,

        attributes: [
          'positioning',
          'reflexes',
          'puckTracking',
          'reboundControl',
          'lateralMovement',
          'anticipation',
          'composure',
        ],
      },

      {
        key:
          'broad',

        label:
          'Broad Roster +8',

        players: [
          ...testSkaters,
          ...testGoalies,
        ],

        attributes: [
          'passing',
          'puckControl',
          'offensiveAwareness',
          'speed',
          'acceleration',
          'poise',

          'wristShotAccuracy',
          'wristShotPower',
          'slapShotAccuracy',
          'slapShotPower',
          'handEye',
          'deking',

          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'agility',
          'strength',
          'bodyChecking',

          'positioning',
          'reflexes',
          'puckTracking',
          'reboundControl',
          'lateralMovement',
          'anticipation',
          'composure',
        ],
      },
    ];

    const results = [];

    for (
      const test of tests
    ) {
      let snapshots = [];

      try {
        if (
          test.attributes.length > 0
        ) {
          const override =
            applyLiveGameDiagnosticAttributeOverride(
              test.players,
              test.attributes,
              boost
            );

          if (
            override?.success !== true
          ) {
            results.push({
              key:
                test.key,

              label:
                test.label,

              success: false,

              reason:
                override?.reason ||
                'attribute-override-failed',
            });

            continue;
          }

          snapshots =
            override.snapshots;
        }

        const beforeProfile =
          getLiveGameTeamSimulationProfile(
            testTeam.teamId
          );

        const diagnostic =
          runLiveGameCompetitiveBalanceDiagnostic({
            sampleSize:
              gamesPerTest,

            strongTeamId:
              testTeam.teamId,

            weakTeamId:
              controlTeam.teamId,
          });

        if (
          !diagnostic ||
          !diagnostic.report
        ) {
          results.push({
            key:
              test.key,

            label:
              test.label,

            success: false,

            reason:
              diagnostic?.reason ||
              'attribute-isolation-simulation-failed',
          });

          continue;
        }

        const report =
          diagnostic.report;

        const testResult =
          String(
            report
              .strongTeam
              .teamId
          ) ===
          String(
            testTeam.teamId
          )
            ? report.strongTeam
            : report.weakTeam;

        const controlResult =
          String(
            report
              .strongTeam
              .teamId
          ) ===
          String(
            controlTeam.teamId
          )
            ? report.strongTeam
            : report.weakTeam;

        results.push({
          key:
            test.key,

          label:
            test.label,

          success:
            diagnostic.success ===
            true,

          profile:
            beforeProfile
              ?.profile ||
            null,

          testTeamWinRate:
            testResult.winRate,

          controlTeamWinRate:
            controlResult.winRate,

          testGoalsPerGame:
            testResult.goalsPerGame,

          controlGoalsPerGame:
            controlResult.goalsPerGame,

          testShotsPerGame:
            testResult.shotsPerGame,

          controlShotsPerGame:
            controlResult.shotsPerGame,

          testPowerPlayPercentage:
            testResult
              .powerPlayPercentage,

          controlPowerPlayPercentage:
            controlResult
              .powerPlayPercentage,

          goalDifferentialPerGame:
            report
              .goalDifferentialPerGame,

          shotDifferentialPerGame:
            report
              .shotDifferentialPerGame,

          overtimeRate:
            report.overtimeRate,

          shootoutRate:
            report.shootoutRate,

          completedGames:
            report.completedGames,

          failedGames:
            report.failedGames,
        });
      } finally {
        if (
          snapshots.length > 0
        ) {
          restoreLiveGameDiagnosticAttributeOverride(
            snapshots
          );
        }
      }
    }

    const successfulResults =
      results.filter(
        result =>
          result.success === true
      );

    const report = {
      gamesPerTest,

      boost,

      testTeam: {
        teamId:
          testTeam.teamId,

        abbreviation:
          testTeam.abbreviation ||
          testTeam.teamName ||
          testTeam.schoolName ||
          testTeam.teamId,
      },

      controlTeam: {
        teamId:
          controlTeam.teamId,

        abbreviation:
          controlTeam.abbreviation ||
          controlTeam.teamName ||
          controlTeam.schoolName ||
          controlTeam.teamId,
      },

      completedTests:
        successfulResults.length,

      totalTests:
        tests.length,

      results,
    };

    console.log(
      '[Project Ice] Attribute Isolation Diagnostic',
      report
    );

    return {
      success:
        successfulResults.length ===
        tests.length,

      reason:
        successfulResults.length ===
        tests.length
          ? 'attribute-isolation-completed'
          : 'attribute-isolation-had-failures',

      report,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — FINAL GAME RESULT CONVERSION
   * ============================================================
   *
   * Converts a completed live-game simulation into the canonical
   * Project Ice gameResult contract already consumed by:
   *
   * - standings
   * - schedule results
   * - skater season stats
   * - goalie season stats
   * - postgame summaries
   * - career-player progression
   *
   * This function does NOT permanently apply anything.
   * It only builds the final result package.
   */
  function createGameResultFromLiveSimulation(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game-simulation',
        gameResult: null,
      };
    }

    if (
      simulation.gameComplete !== true
    ) {
      return {
        success: false,
        reason:
          'live-game-not-complete',
        gameResult: null,
      };
    }

    const home =
      simulation.home;

    const away =
      simulation.away;

    if (
      !home ||
      !away ||
      !home.teamId ||
      !away.teamId
    ) {
      return {
        success: false,
        reason:
          'live-game-team-state-missing',
        gameResult: null,
      };
    }

    const homeScore =
      Math.max(
        0,
        Number(home.score) || 0
      );

    const awayScore =
      Math.max(
        0,
        Number(away.score) || 0
      );

    if (
      homeScore === awayScore
    ) {
      return {
        success: false,
        reason:
          'completed-live-game-still-tied',
        gameResult: null,
      };
    }

    const winnerSide =
      simulation.winnerSide ||
      (
        homeScore > awayScore
          ? 'home'
          : 'away'
      );

    const loserSide =
      winnerSide === 'home'
        ? 'away'
        : 'home';

    const winnerTeamId =
      winnerSide === 'home'
        ? home.teamId
        : away.teamId;

    const loserTeamId =
      loserSide === 'home'
        ? home.teamId
        : away.teamId;

    /*
     * Live skater lines already contain the exact stats accumulated
     * during the simulation. Clone them so the permanent result does
     * not share mutable references with the live simulation.
     */
    const homeSkaters =
      Array.isArray(home.skaters)
        ? structuredClone(
            home.skaters
          )
        : [];

    const awaySkaters =
      Array.isArray(away.skaters)
        ? structuredClone(
            away.skaters
          )
        : [];

    const normalizeGoalieLines =
      (
        goalieLines,
        side
      ) => {
        const lines =
          Array.isArray(goalieLines)
            ? structuredClone(
                goalieLines
              )
            : [];

        const teamWon =
          winnerSide === side;

        const teamLost =
          loserSide === side;

        lines.forEach(
          goalieLine => {
            if (!goalieLine) {
              return;
            }

            const played =
              (
                Number(
                  goalieLine
                    .timeOnIceSeconds
                ) || 0
              ) > 0 ||
              goalieLine.started === true;

            goalieLine.gamesPlayed =
              played
                ? 1
                : 0;

            /*
             * Existing permanent goalie application expects minutes,
             * while the live engine tracks exact TOI seconds.
             */
            goalieLine.minutesPlayed =
              Math.max(
                0,
                Number(
                  goalieLine
                    .timeOnIceSeconds
                ) || 0
              ) / 60;

            goalieLine.wins =
              played &&
              teamWon
                ? 1
                : 0;

            goalieLine.losses =
              played &&
              teamLost &&
              simulation
                .wentToOvertime !== true
                ? 1
                : 0;

            goalieLine
              .overtimeLosses =
              played &&
              teamLost &&
              simulation
                .wentToOvertime === true
                ? 1
                : 0;

            /*
             * Shootout goals are part of the official team score but are
             * not goals against for the goalie.
             *
             * A goalie who allows zero actual goals through regulation/OT
             * therefore keeps the shutout even if their team loses a
             * 0-0 game in the shootout.
             */
            goalieLine.shutout =
              played &&
              (
                Number(
                  goalieLine.goalsAgainst
                ) || 0
              ) === 0;
          }
        );

        return lines;
      };

    const homeGoalies =
      normalizeGoalieLines(
        home.goalies,
        'home'
      );

    const awayGoalies =
      normalizeGoalieLines(
        away.goalies,
        'away'
      );

    /*
     * Any dressed skater in the live roster participated in the game
     * contract. The permanent stat layer uses gamesPlayed when
     * calculating performance/progression.
     */
    [
      ...homeSkaters,
      ...awaySkaters,
    ].forEach(
      skaterLine => {
        if (!skaterLine) {
          return;
        }

        skaterLine.gamesPlayed =
          skaterLine.dressed === false
            ? 0
            : 1;
      }
    );

    const scoringPlays =
      Array.isArray(
        simulation.scoringEvents
      )
        ? structuredClone(
            simulation.scoringEvents
          )
        : [];

    const penalties =
      Array.isArray(
        simulation.penaltyEvents
      )
        ? structuredClone(
            simulation.penaltyEvents
          )
        : [];

    /*
     * The full live event stream is presentation-only.
     *
     * Permanently storing hundreds of internal events for every
     * league game makes the world save grow extremely quickly.
     *
     * Postgame already preserves the data we actually need:
     * - scoring plays
     * - penalties
     * - final score
     * - skater box scores
     * - goalie box scores
     *
     * If we build historical game replays later, they should use
     * their own compact event-history format rather than the raw
     * resolver stream.
     */
    const playByPlay = [];

    const gameResult = {
      gameId:
        simulation.gameId ||
        null,

      eventId:
        simulation.gameId ||
        null,

      date:
        simulation.date ||
        null,

      homeTeamId:
        home.teamId,

      awayTeamId:
        away.teamId,

      completed: true,

      status:
        'completed',

      winnerTeamId,

      loserTeamId,

      resultType:
        simulation.resultType ||
        (
          simulation
            .wentToShootout === true
            ? 'shootout'
            : simulation
                .wentToOvertime === true
              ? 'overtime'
              : 'regulation'
        ),

      wentToOvertime:
        simulation
          .wentToOvertime === true,

      wentToShootout:
        simulation
          .wentToShootout === true,

      home: {
        teamId:
          home.teamId,

        abbreviation:
          home.abbreviation ||
          null,

        score:
          homeScore,

        shots:
          Number(
            home.shots
          ) || 0,

        hits:
          Number(
            home.hits
          ) || 0,

        blockedShots:
          Number(
            home.blockedShots
          ) || 0,

        giveaways:
          Number(
            home.giveaways
          ) || 0,

        takeaways:
          Number(
            home.takeaways
          ) || 0,

        penaltyMinutes:
          Number(
            home.penaltyMinutes
          ) || 0,

        powerPlayOpportunities:
          Number(
            home
              .powerPlayOpportunities
          ) || 0,

        powerPlayGoals:
          Number(
            home.powerPlayGoals
          ) || 0,

        faceoffWins:
          Number(
            home.faceoffWins
          ) || 0,

        skaters:
          homeSkaters,

        goalies:
          homeGoalies,
      },

      away: {
        teamId:
          away.teamId,

        abbreviation:
          away.abbreviation ||
          null,

        score:
          awayScore,

        shots:
          Number(
            away.shots
          ) || 0,

        hits:
          Number(
            away.hits
          ) || 0,

        blockedShots:
          Number(
            away.blockedShots
          ) || 0,

        giveaways:
          Number(
            away.giveaways
          ) || 0,

        takeaways:
          Number(
            away.takeaways
          ) || 0,

        penaltyMinutes:
          Number(
            away.penaltyMinutes
          ) || 0,

        powerPlayOpportunities:
          Number(
            away
              .powerPlayOpportunities
          ) || 0,

        powerPlayGoals:
          Number(
            away.powerPlayGoals
          ) || 0,

        faceoffWins:
          Number(
            away.faceoffWins
          ) || 0,

        skaters:
          awaySkaters,

        goalies:
          awayGoalies,
      },

      scoringPlays,

      penalties,

      playByPlay,

      shootout:
        simulation.shootout
          ? structuredClone(
              simulation.shootout
            )
          : null,

      threeStars: [],

      context: {
        ...(
          simulation.context ||
          {}
        ),
      },

      metadata: {
        simulatedAt:
          new Date().toISOString(),

        simulationVersion:
          'live-game-v1',
      },
    };

    return {
      success: true,

      reason:
        'live-game-result-created',

      gameResult,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — FINALIZATION
   * ============================================================
   *
   * Converts a completed live simulation into its permanent
   * canonical gameResult exactly once.
   *
   * This still does NOT write standings, season stats or the
   * schedule. It only freezes the finished simulation result.
   */
  function finalizeLiveGameSimulation(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        finalized: false,
        reason:
          'invalid-live-game-simulation',
        gameResult: null,
      };
    }

    /*
     * Idempotency guard.
     *
     * If this game was already finalized, return the previously
     * frozen result instead of rebuilding it.
     */
    if (
      simulation.finalized === true &&
      simulation.finalizedGameResult
    ) {
      return {
        success: true,
        finalized: false,
        reason:
          'live-game-already-finalized',

        gameResult:
          structuredClone(
            simulation
              .finalizedGameResult
          ),
      };
    }

    if (
      simulation.gameComplete !== true
    ) {
      return {
        success: false,
        finalized: false,
        reason:
          'live-game-not-complete',
        gameResult: null,
      };
    }

    const conversion =
      createGameResultFromLiveSimulation(
        simulation
      );

    if (
      !conversion ||
      conversion.success !== true ||
      !conversion.gameResult
    ) {
      return {
        success: false,
        finalized: false,
        reason:
          conversion?.reason ||
          'live-game-result-conversion-failed',
        gameResult: null,
      };
    }

    /*
     * Freeze a detached copy onto the simulation.
     *
     * Anything that happens to the returned object afterward
     * cannot mutate the saved final live-game result.
     */
    simulation.finalizedGameResult =
      structuredClone(
        conversion.gameResult
      );

    simulation.finalized =
      true;

    return {
      success: true,
      finalized: true,
      reason:
        'live-game-finalized',

      gameResult:
        structuredClone(
          simulation
            .finalizedGameResult
        ),
    };
  }
  
  function applyGameResultToTeamsAndSchedule(
    gameResult
  ) {
    if (
      !gameResult ||
      typeof gameResult !== 'object'
    ) {
      return {
        success: false,
        applied: false,
        reason: 'invalid-game-result',
      };
    }

    const gameId =
      gameResult.gameId ||
      gameResult.eventId ||
      null;

    const homeTeamId =
      gameResult.homeTeamId ||
      gameResult.home?.teamId ||
      null;

    const awayTeamId =
      gameResult.awayTeamId ||
      gameResult.away?.teamId ||
      null;

    const winnerTeamId =
      gameResult.winnerTeamId ||
      null;

    const loserTeamId =
      gameResult.loserTeamId ||
      null;

    const homeScore =
      Number(
        gameResult.home?.score
      );

    const awayScore =
      Number(
        gameResult.away?.score
      );

    if (
      !gameId ||
      !homeTeamId ||
      !awayTeamId ||
      !winnerTeamId ||
      !loserTeamId ||
      !Number.isFinite(homeScore) ||
      !Number.isFinite(awayScore) ||
      homeScore === awayScore
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'incomplete-game-result',
      };
    }

    const schedule =
      Array.isArray(_state.schedule)
        ? _state.schedule
        : [];

    const scheduledGame =
      schedule.find(event =>
        (
          event?.id === gameId ||
          event?.eventId === gameId ||
          event?.gameId === gameId
        )
      );

    if (!scheduledGame) {
      return {
        success: false,
        applied: false,
        reason:
          'scheduled-game-not-found',

        gameId,
      };
    }

    /*
     * The schedule record is the idempotency guard.
     * A completed game must never update standings twice,
     * even if the same date is processed again.
     */
    if (
      scheduledGame.played === true ||
      scheduledGame.completed === true
    ) {
      return {
        success: true,
        applied: false,
        reason:
          'game-already-applied',

        gameId,
        scheduledGame,
      };
    }

    const homeTeam =
      getTeamById(
        homeTeamId
      );

    const awayTeam =
      getTeamById(
        awayTeamId
      );

    if (
      !homeTeam ||
      !awayTeam
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'game-team-not-found',

        homeTeamId,
        awayTeamId,
      };
    }

    const winningTeam =
      winnerTeamId === homeTeamId
        ? homeTeam
        : winnerTeamId === awayTeamId
          ? awayTeam
          : null;

    const losingTeam =
      loserTeamId === homeTeamId
        ? homeTeam
        : loserTeamId === awayTeamId
          ? awayTeam
          : null;

    if (
      !winningTeam ||
      !losingTeam ||
      winningTeam.teamId ===
        losingTeam.teamId
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'invalid-game-winner',
      };
    }

    /*
     * Normalize all standings fields before changing them.
     */
    [homeTeam, awayTeam].forEach(
      team => {
        team.wins =
          Math.max(
            0,
            Number(team.wins) || 0
          );

        team.losses =
          Math.max(
            0,
            Number(team.losses) || 0
          );

        team.overtimeLosses =
          Math.max(
            0,
            Number(
              team.overtimeLosses
            ) || 0
          );

        team.goalsFor =
          Math.max(
            0,
            Number(
              team.goalsFor
            ) || 0
          );

        team.goalsAgainst =
          Math.max(
            0,
            Number(
              team.goalsAgainst
            ) || 0
          );

        team.points =
          Math.max(
            0,
            Number(team.points) || 0
          );
      }
    );

    /*
     * Team scoring totals.
     */
    homeTeam.goalsFor +=
      homeScore;

    homeTeam.goalsAgainst +=
      awayScore;

    awayTeam.goalsFor +=
      awayScore;

    awayTeam.goalsAgainst +=
      homeScore;

    /*
     * Project Ice currently uses the standard:
     *
     * Regulation/OT win = 2 points
     * Overtime loss     = 1 point
     * Regulation loss   = 0 points
     */
    winningTeam.wins += 1;
    winningTeam.points += 2;

    if (
      gameResult.resultType ===
        'overtime' ||
      gameResult.wentToOvertime ===
        true
    ) {
      losingTeam.overtimeLosses +=
        1;

      losingTeam.points += 1;
    } else {
      losingTeam.losses += 1;
    }

    /*
     * Permanently complete the canonical schedule record.
     */
    scheduledGame.played =
      true;

    scheduledGame.completed =
      true;

    scheduledGame.homeScore =
      homeScore;

    scheduledGame.awayScore =
      awayScore;

    scheduledGame.winnerTeamId =
      winnerTeamId;

    scheduledGame.loserTeamId =
      loserTeamId;

    scheduledGame.resultType =
      gameResult.resultType ||
      (
        gameResult.wentToOvertime
          ? 'overtime'
          : 'regulation'
      );

    scheduledGame.wentToOvertime =
      Boolean(
        gameResult.wentToOvertime
      );

    scheduledGame.wentToShootout =
      Boolean(
        gameResult.wentToShootout
      );

    scheduledGame.gameResult = {
      ...gameResult,

      completed: true,

      status:
        'completed',

      metadata: {
        ...(gameResult.metadata || {}),

        appliedAt:
          new Date().toISOString(),
      },
    };

    /*
     * Freeze the completed game's postgame data on the canonical
     * schedule record. The summary and full box score will both
     * read from this saved package without resimulating the game.
     */
    scheduledGame.postgameSummary = {
      gameId,

      date:
        scheduledGame.date ||
        gameResult.date ||
        null,

      resultType:
        scheduledGame.resultType,

      wentToOvertime:
        Boolean(
          scheduledGame.wentToOvertime
        ),

      wentToShootout:
        Boolean(
          scheduledGame.wentToShootout
        ),

      winnerTeamId,
      loserTeamId,

      finalScore: {
        home:
          Number(homeScore) || 0,

        away:
          Number(awayScore) || 0,
      },

      home: {
        teamId:
          gameResult.home?.teamId ||
          scheduledGame.homeTeamId ||
          null,

        score:
          Number(
            gameResult.home?.score
          ) || 0,

        shots:
          Number(
            gameResult.home?.shots
          ) || 0,

        skaters:
          Array.isArray(
            gameResult.home?.skaters
          )
            ? structuredClone(
                gameResult.home.skaters
              )
            : [],

        goalies:
          Array.isArray(
            gameResult.home?.goalies
          )
            ? structuredClone(
                gameResult.home.goalies
              )
            : [],
      },

      away: {
        teamId:
          gameResult.away?.teamId ||
          scheduledGame.awayTeamId ||
          null,

        score:
          Number(
            gameResult.away?.score
          ) || 0,

        shots:
          Number(
            gameResult.away?.shots
          ) || 0,

        skaters:
          Array.isArray(
            gameResult.away?.skaters
          )
            ? structuredClone(
                gameResult.away.skaters
              )
            : [],

        goalies:
          Array.isArray(
            gameResult.away?.goalies
          )
            ? structuredClone(
                gameResult.away.goalies
              )
            : [],
      },

      timeline:
      Array.isArray(
        gameResult.scoringPlays
      )
        ? structuredClone(
            gameResult.scoringPlays
          )
        : [],

      development:
      gameResult.development &&
      typeof gameResult.development ===
        'object'
        ? structuredClone(
            gameResult.development
          )
        : null,

      savedAt:
        scheduledGame.gameResult
          ?.metadata
          ?.appliedAt ||
        new Date().toISOString(),
    };

    gameResult.completed =
      true;

    gameResult.status =
      'completed';

    gameResult.metadata = {
      ...(gameResult.metadata || {}),

      appliedAt:
        scheduledGame.gameResult
          .metadata.appliedAt,
    };

    return {
      success: true,
      applied: true,
      reason:
        'game-teams-and-schedule-updated',

      gameId,

      homeTeamId,
      awayTeamId,

      winnerTeamId,
      loserTeamId,

      resultType:
        scheduledGame.resultType,

      scheduledGame,
    };
  }

  function applyGameResultToSkaterStats(
    gameResult
  ) {
    if (
      !gameResult ||
      typeof gameResult !== 'object'
    ) {
      return {
        success: false,
        applied: false,
        reason: 'invalid-game-result',
      };
    }

    const gameId =
      gameResult.gameId ||
      gameResult.eventId ||
      null;

    const teamResults = [
      gameResult.home,
      gameResult.away,
    ];

    if (
      !gameId ||
      teamResults.some(
        teamResult =>
          !teamResult ||
          !Array.isArray(
            teamResult.skaters
          )
      )
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'invalid-skater-box-score',
      };
    }

    const appliedPlayers = [];

    for (
      const teamResult of teamResults
    ) {
      for (
        const skaterLine of
        teamResult.skaters
      ) {
        const playerId =
          skaterLine?.playerId ||
          null;

        if (!playerId) {
          return {
            success: false,
            applied: false,
            reason:
              'skater-player-id-missing',

            gameId,
          };
        }

        const player =
          getPlayerById(
            playerId
          );

        if (!player) {
          return {
            success: false,
            applied: false,
            reason:
              'canonical-skater-not-found',

            gameId,
            playerId,
          };
        }

        ensureCanonicalPlayerContract(
          player
        );

        /*
         * The schedule application helper prevents a game from
         * being applied twice. Keep a player-level guard too so
         * future retries can never duplicate an individual line.
         */
        if (
          !Array.isArray(
            player.appliedGameIds
          )
        ) {
          player.appliedGameIds = [];
        }

        if (
          player.appliedGameIds.includes(
            gameId
          )
        ) {
          appliedPlayers.push({
            playerId,
            applied: false,
            reason:
              'player-game-already-applied',
          });

          continue;
        }

        const seasonStats =
          player.seasonStats;

        const dressed =
          skaterLine.dressed !== false;

        if (dressed) {
          seasonStats.gamesPlayed =
            (
              Number(
                seasonStats.gamesPlayed
              ) || 0
            ) + 1;
        }

        const goals =
          Math.max(
            0,
            Number(
              skaterLine.goals
            ) || 0
          );

        const assists =
          Math.max(
            0,
            Number(
              skaterLine.assists
            ) || 0
          );

        seasonStats.goals =
          (
            Number(
              seasonStats.goals
            ) || 0
          ) + goals;

        seasonStats.assists =
          (
            Number(
              seasonStats.assists
            ) || 0
          ) + assists;

        /*
         * Recalculate points from permanent goal and assist
         * totals instead of trusting a potentially stale value.
         */
        seasonStats.points =
          seasonStats.goals +
          seasonStats.assists;

        seasonStats.plusMinus =
          (
            Number(
              seasonStats.plusMinus
            ) || 0
          ) +
          (
            Number(
              skaterLine.plusMinus
            ) || 0
          );

        seasonStats.penaltyMinutes =
          (
            Number(
              seasonStats.penaltyMinutes
            ) || 0
          ) +
          Math.max(
            0,
            Number(
              skaterLine.penaltyMinutes
            ) || 0
          );

        seasonStats.shots =
          (
            Number(
              seasonStats.shots
            ) || 0
          ) +
          Math.max(
            0,
            Number(
              skaterLine.shots
            ) || 0
          );

        seasonStats.powerPlayGoals =
          (
            Number(
              seasonStats
                .powerPlayGoals
            ) || 0
          ) +
          Math.max(
            0,
            Number(
              skaterLine
                .powerPlayGoals
            ) || 0
          );

        seasonStats.powerPlayPoints =
          (
            Number(
              seasonStats
                .powerPlayPoints
            ) || 0
          ) +
          Math.max(
            0,
            Number(
              skaterLine
                .powerPlayPoints
            ) || 0
          );

        seasonStats.shorthandedGoals =
          (
            Number(
              seasonStats
                .shorthandedGoals
            ) || 0
          ) +
          Math.max(
            0,
            Number(
              skaterLine
                .shorthandedGoals
            ) || 0
          );

        seasonStats.gameWinningGoals =
          (
            Number(
              seasonStats
                .gameWinningGoals
            ) || 0
          ) +
          Math.max(
            0,
            Number(
              skaterLine
                .gameWinningGoals
            ) || 0
          );

        /*
         * Canonical season stats store minutes as a number.
         * The game line stores exact time in seconds.
         */
        seasonStats.minutesPlayed =
          (
            Number(
              seasonStats.minutesPlayed
            ) || 0
          ) +
          (
            Math.max(
              0,
              Number(
                skaterLine
                  .timeOnIceSeconds
              ) || 0
            ) / 60
          );

        /*
         * Preserve the older top-level fields temporarily because
         * some existing Team, League and Full Stats renderers may
         * still read them during the transition.
         */
        player.gamesPlayed =
          seasonStats.gamesPlayed;

        player.goals =
          seasonStats.goals;

        player.assists =
          seasonStats.assists;

        player.points =
          seasonStats.points;

        player.plusMinus =
          seasonStats.plusMinus;

        player.penaltyMinutes =
          seasonStats.penaltyMinutes;

        player.shots =
          seasonStats.shots;

        player.appliedGameIds.push(
          gameId
        );

        appliedPlayers.push({
          playerId,
          applied: true,
          goals,
          assists,
          points:
            goals + assists,
          shots:
            Math.max(
              0,
              Number(
                skaterLine.shots
              ) || 0
            ),
        });
      }
    }

    return {
      success: true,
      applied: true,
      reason:
        'skater-season-stats-updated',

      gameId,

      appliedPlayers,
    };
  }

  function applyGameResultToGoalieStats(
    gameResult
  ) {
    if (
      !gameResult ||
      typeof gameResult !== 'object'
    ) {
      return {
        success: false,
        applied: false,
        reason: 'invalid-game-result',
      };
    }

    const gameId =
      gameResult.gameId ||
      gameResult.eventId ||
      null;

    const teamResults = [
      gameResult.home,
      gameResult.away,
    ];

    if (
      !gameId ||
      teamResults.some(
        teamResult =>
          !teamResult ||
          !Array.isArray(
            teamResult.goalies
          )
      )
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'invalid-goalie-box-score',
      };
    }

    const appliedGoalies = [];

    for (
      const teamResult of teamResults
    ) {
      for (
        const goalieLine of
        teamResult.goalies
      ) {
        const playerId =
          goalieLine?.playerId ||
          null;

        if (!playerId) {
          return {
            success: false,
            applied: false,
            reason:
              'goalie-player-id-missing',

            gameId,
          };
        }

        const player =
          getPlayerById(
            playerId
          );

        if (!player) {
          return {
            success: false,
            applied: false,
            reason:
              'canonical-goalie-not-found',

            gameId,
            playerId,
          };
        }

        ensureCanonicalPlayerContract(
          player
        );

        /*
         * Maintain the same player-level duplicate guard used
         * by the skater-stat application helper.
         */
        if (
          !Array.isArray(
            player.appliedGameIds
          )
        ) {
          player.appliedGameIds = [];
        }

        if (
          player.appliedGameIds.includes(
            gameId
          )
        ) {
          appliedGoalies.push({
            playerId,
            applied: false,
            reason:
              'player-game-already-applied',
          });

          continue;
        }

        const seasonStats =
          player.seasonStats;

        const gamesPlayed =
          Math.max(
            0,
            Number(
              goalieLine.gamesPlayed
            ) || 0
          );

        const gamesStarted =
          goalieLine.started === true
            ? 1
            : 0;

        const wins =
          Math.max(
            0,
            Number(
              goalieLine.wins
            ) || 0
          );

        const losses =
          Math.max(
            0,
            Number(
              goalieLine.losses
            ) || 0
          );

        const overtimeLosses =
          Math.max(
            0,
            Number(
              goalieLine.overtimeLosses
            ) || 0
          );

        const shotsAgainst =
          Math.max(
            0,
            Number(
              goalieLine.shotsAgainst
            ) || 0
          );

        const saves =
          Math.max(
            0,
            Number(
              goalieLine.saves
            ) || 0
          );

        const goalsAgainst =
          Math.max(
            0,
            Number(
              goalieLine.goalsAgainst
            ) || 0
          );

        const minutesPlayed =
          Math.max(
            0,
            Number(
              goalieLine.minutesPlayed
            ) || 0
          );

        const shutouts =
          goalieLine.shutout === true
            ? 1
            : 0;

        seasonStats.gamesPlayed =
          (
            Number(
              seasonStats.gamesPlayed
            ) || 0
          ) + gamesPlayed;

        seasonStats.gamesStarted =
          (
            Number(
              seasonStats.gamesStarted
            ) || 0
          ) + gamesStarted;

        seasonStats.wins =
          (
            Number(
              seasonStats.wins
            ) || 0
          ) + wins;

        seasonStats.losses =
          (
            Number(
              seasonStats.losses
            ) || 0
          ) + losses;

        seasonStats.overtimeLosses =
          (
            Number(
              seasonStats.overtimeLosses
            ) || 0
          ) + overtimeLosses;

        seasonStats.shotsAgainst =
          (
            Number(
              seasonStats.shotsAgainst
            ) || 0
          ) + shotsAgainst;

        seasonStats.saves =
          (
            Number(
              seasonStats.saves
            ) || 0
          ) + saves;

        seasonStats.goalsAgainst =
          (
            Number(
              seasonStats.goalsAgainst
            ) || 0
          ) + goalsAgainst;

        seasonStats.shutouts =
          (
            Number(
              seasonStats.shutouts
            ) || 0
          ) + shutouts;

        seasonStats.minutesPlayed =
          (
            Number(
              seasonStats.minutesPlayed
            ) || 0
          ) + minutesPlayed;

        /*
         * Recalculate the rate statistics from permanent totals.
         * This prevents rounding drift across multiple games.
         */
        seasonStats.savePercentage =
          seasonStats.shotsAgainst > 0
            ? seasonStats.saves /
              seasonStats.shotsAgainst
            : 0;

        seasonStats.goalsAgainstAverage =
          seasonStats.minutesPlayed > 0
            ? (
                seasonStats.goalsAgainst *
                60
              ) /
              seasonStats.minutesPlayed
            : 0;

        /*
         * Preserve the older top-level fields while existing
         * Team, League and Full Stats renderers transition fully
         * to seasonStats.
         */
        player.gamesPlayed =
          seasonStats.gamesPlayed;

        player.gamesStarted =
          seasonStats.gamesStarted;

        player.wins =
          seasonStats.wins;

        player.losses =
          seasonStats.losses;

        player.overtimeLosses =
          seasonStats.overtimeLosses;

        player.shotsAgainst =
          seasonStats.shotsAgainst;

        player.saves =
          seasonStats.saves;

        player.goalsAgainst =
          seasonStats.goalsAgainst;

        player.savePercentage =
          seasonStats.savePercentage;

        player.goalsAgainstAverage =
          seasonStats.goalsAgainstAverage;

        player.shutouts =
          seasonStats.shutouts;

        player.minutesPlayed =
          seasonStats.minutesPlayed;

        player.appliedGameIds.push(
          gameId
        );

        appliedGoalies.push({
          playerId,
          applied: true,

          gamesPlayed,
          gamesStarted,

          wins,
          losses,
          overtimeLosses,

          shotsAgainst,
          saves,
          goalsAgainst,

          shutouts,
          minutesPlayed,

          savePercentage:
            shotsAgainst > 0
              ? saves /
                shotsAgainst
              : 0,
        });
      }
    }

    return {
      success: true,
      applied: true,
      reason:
        'goalie-season-stats-updated',

      gameId,

      appliedGoalies,
    };
  }

  function getCareerPlayerGamePerformance(
    gameResult
  ) {
    if (
      !gameResult ||
      typeof gameResult !== 'object'
    ) {
      return {
        success: false,
        found: false,
        reason: 'invalid-game-result',
        player: null,
        teamResult: null,
        opponentResult: null,
        gameLine: null,
        playerType: null,
      };
    }

    const teamResults = [
      gameResult.home,
      gameResult.away,
    ];

    for (
      const teamResult of teamResults
    ) {
      if (!teamResult) {
        continue;
      }

      const opponentResult =
        teamResult === gameResult.home
          ? gameResult.away
          : gameResult.home;

      const skaterLines =
        Array.isArray(
          teamResult.skaters
        )
          ? teamResult.skaters
          : [];

      const goalieLines =
        Array.isArray(
          teamResult.goalies
        )
          ? teamResult.goalies
          : [];

      const allGameLines = [
        ...skaterLines.map(
          gameLine => ({
            gameLine,
            playerType: 'skater',
          })
        ),

        ...goalieLines.map(
          gameLine => ({
            gameLine,
            playerType: 'goalie',
          })
        ),
      ];

      for (
        const entry of allGameLines
      ) {
        const playerId =
          entry.gameLine?.playerId ||
          null;

        if (!playerId) {
          continue;
        }

        const player =
          getPlayerById(
            playerId
          );

        const canonicalCareerPlayerId =
          _state.player?.playerId ||
          _state.player?.id ||
          null;

        const isCareerPlayer =
          Boolean(
            player &&
            (
              player.isCareerPlayer === true ||
              (
                canonicalCareerPlayerId &&
                (
                  String(
                    player.playerId ||
                    player.id ||
                    ''
                  ) ===
                  String(
                    canonicalCareerPlayerId
                  )
                )
              )
            )
          );

        if (!isCareerPlayer) {
          continue;
        }

        /*
         * Repair older/migrated career-player records that match
         * the canonical career ID but are missing the explicit flag.
         */
        if (
          player.isCareerPlayer !== true
        ) {
          player.isCareerPlayer = true;
        }

        ensureCanonicalPlayerContract(
          player
        );

        const teamWon =
          String(
            gameResult.winnerTeamId
          ) ===
          String(
            teamResult.teamId
          );

        const teamLost =
          String(
            gameResult.loserTeamId
          ) ===
          String(
            teamResult.teamId
          );

        return {
          success: true,

          found: true,

          reason:
            'career-player-performance-found',

          gameId:
            gameResult.gameId ||
            gameResult.eventId ||
            null,

          date:
            gameResult.date ||
            null,

          player,

          playerId,

          playerType:
            entry.playerType,

          gameLine:
            entry.gameLine,

          gameResult,

          teamResult,

          opponentResult,

          teamWon,

          teamLost,

          wentToOvertime:
            Boolean(
              gameResult.wentToOvertime
            ),

          wentToShootout:
            Boolean(
              gameResult.wentToShootout
            ),

          gameContext: {
            ...(gameResult.context || {}),
          },
        };
      }
    }

    /*
     * Most league games will not contain the career player.
     * That is a valid outcome, not an application failure.
     */
    return {
      success: true,

      found: false,

      reason:
        'career-player-not-in-game',

      gameId:
        gameResult.gameId ||
        gameResult.eventId ||
        null,

      player: null,

      playerId: null,

      playerType: null,

      gameLine: null,

      gameResult,

      teamResult: null,

      opponentResult: null,

      teamWon: false,

      teamLost: false,

      wentToOvertime:
        Boolean(
          gameResult.wentToOvertime
        ),

      wentToShootout:
        Boolean(
          gameResult.wentToShootout
        ),

      gameContext: {
        ...(gameResult.context || {}),
      },
    };
  }

  function calculateCareerGamePerformanceScore(
    performance
  ) {
    if (
      !performance ||
      performance.success !== true ||
      performance.found !== true ||
      !performance.gameLine
    ) {
      return {
        success: true,

        scored: false,

        reason:
          'career-player-performance-not-found',

        score: null,

        tier: null,

        components: {},
      };
    }

    const clamp = (
      value,
      minimum,
      maximum
    ) =>
      Math.max(
        minimum,
        Math.min(
          maximum,
          Number(value) || 0
        )
      );

    const gameLine =
      performance.gameLine;

    const playerType =
      performance.playerType;


    if (
      playerType === 'goalie'
    ) {
      const gamesPlayed =
        Math.max(
          0,
          Number(
            gameLine.gamesPlayed
          ) || 0
        );

      /*
       * A dressed backup who never entered the game should not
       * receive a performance score or progression reward.
       */
      if (gamesPlayed <= 0) {
        return {
          success: true,

          scored: false,

          reason:
            'goalie-did-not-play',

          score: null,

          tier: null,

          components: {
            gamesPlayed,
          },
        };
      }

      const shotsAgainst =
        Math.max(
          0,
          Number(
            gameLine.shotsAgainst
          ) || 0
        );

      const saves =
        Math.max(
          0,
          Number(
            gameLine.saves
          ) || 0
        );

      const goalsAgainst =
        Math.max(
          0,
          Number(
            gameLine.goalsAgainst
          ) || 0
        );

      const savePercentage =
        shotsAgainst > 0
          ? saves /
            shotsAgainst
          : 0;

      const minutesPlayed =
        Math.max(
          0,
          Number(
            gameLine.minutesPlayed
          ) || 0
        );

      /*
       * Begin around an average performance and adjust using:
       *
       * Save percentage
       * Goals allowed
       * Game decision
       * Shutout
       * Workload
       */
      let rawScore =
        55;

      rawScore +=
        (
          savePercentage -
          0.88
        ) * 180;

      rawScore -=
        goalsAgainst * 3;

      if (
        Number(
          gameLine.wins
        ) > 0 ||
        performance.teamWon === true
      ) {
        rawScore += 8;
      }

      if (
        Number(
          gameLine.losses
        ) > 0
      ) {
        rawScore -= 5;
      }

      if (
        Number(
          gameLine.overtimeLosses
        ) > 0
      ) {
        rawScore -= 1;
      }

      if (
        gameLine.shutout === true
      ) {
        rawScore += 12;
      }

      /*
       * Reward meaningful workload without letting shot volume
       * overpower actual save quality.
       */
      rawScore +=
        clamp(
          shotsAgainst - 20,
          0,
          20
        ) * 0.3;

      /*
       * Partial appearances receive slightly reduced weight.
       */
      if (
        minutesPlayed > 0 &&
        minutesPlayed < 40
      ) {
        rawScore -= 4;
      }

      const score =
        Math.round(
          clamp(
            rawScore,
            20,
            100
          )
        );

      return {
        success: true,

        scored: true,

        reason:
          'goalie-performance-calculated',

        score,

        tier:
          score >= 90
            ? 'elite'
            : score >= 80
              ? 'excellent'
              : score >= 70
                ? 'strong'
                : score >= 60
                  ? 'solid'
                  : score >= 50
                    ? 'average'
                    : score >= 40
                      ? 'poor'
                      : 'very-poor',

        components: {
          gamesPlayed,
          shotsAgainst,
          saves,
          goalsAgainst,
          savePercentage,
          minutesPlayed,

          win:
            Number(
              gameLine.wins
            ) > 0 ||
            performance.teamWon === true,

          loss:
            Number(
              gameLine.losses
            ) > 0,

          overtimeLoss:
            Number(
              gameLine.overtimeLosses
            ) > 0,

          shutout:
            gameLine.shutout === true,
        },
      };
    }

    /*
     * Skater scoring begins from a neutral game and then rewards
     * production, shot generation, two-way play, involvement,
     * discipline and team outcome.
     */
    const dressed =
      gameLine.dressed !== false;

    const gamesPlayed =
      Math.max(
        0,
        Number(
          gameLine.gamesPlayed
        ) || 0
      );

    if (
      !dressed ||
      gamesPlayed <= 0
    ) {
      return {
        success: true,

        scored: false,

        reason:
          'skater-did-not-play',

        score: null,

        tier: null,

        components: {
          dressed,
          gamesPlayed,
        },
      };
    }

    const goals =
      Math.max(
        0,
        Number(
          gameLine.goals
        ) || 0
      );

    const assists =
      Math.max(
        0,
        Number(
          gameLine.assists
        ) || 0
      );

    const points =
      goals +
      assists;

    const shots =
      Math.max(
        0,
        Number(
          gameLine.shots
        ) || 0
      );

    const plusMinus =
      Number(
        gameLine.plusMinus
      ) || 0;

    const penaltyMinutes =
      Math.max(
        0,
        Number(
          gameLine.penaltyMinutes
        ) || 0
      );

    const blockedShots =
      Math.max(
        0,
        Number(
          gameLine.blockedShots
        ) || 0
      );

    const hits =
      Math.max(
        0,
        Number(
          gameLine.hits
        ) || 0
      );

    const takeaways =
      Math.max(
        0,
        Number(
          gameLine.takeaways
        ) || 0
      );

    const giveaways =
      Math.max(
        0,
        Number(
          gameLine.giveaways
        ) || 0
      );

    const timeOnIceSeconds =
      Math.max(
        0,
        Number(
          gameLine.timeOnIceSeconds
        ) || 0
      );

    let rawScore =
      50;

    rawScore +=
      goals * 13;

    rawScore +=
      assists * 8;

    rawScore +=
      clamp(
        shots,
        0,
        8
      ) * 1.25;

    rawScore +=
      clamp(
        plusMinus,
        -4,
        4
      ) * 3;

    rawScore +=
      clamp(
        blockedShots,
        0,
        5
      ) * 1.25;

    rawScore +=
      clamp(
        hits,
        0,
        6
      ) * 0.75;

    rawScore +=
      clamp(
        takeaways,
        0,
        5
      ) * 1.5;

    rawScore -=
      clamp(
        giveaways,
        0,
        6
      ) * 1.5;

    rawScore -=
      clamp(
        penaltyMinutes,
        0,
        10
      ) * 0.8;

    if (
      Number(
        gameLine.gameWinningGoals
      ) > 0
    ) {
      rawScore += 6;
    }

    if (
      gameLine.firstStar === true
    ) {
      rawScore += 8;
    } else if (
      gameLine.secondStar === true
    ) {
      rawScore += 5;
    } else if (
      gameLine.thirdStar === true
    ) {
      rawScore += 3;
    }

    if (
      performance.teamWon === true
    ) {
      rawScore += 4;
    } else if (
      performance.teamLost === true
    ) {
      rawScore -= 2;
    }

    /*
     * Meaningful ice time adds a small involvement bonus.
     * It does not replace production or two-way performance.
     */
    rawScore +=
      clamp(
        (
          timeOnIceSeconds -
          600
        ) / 300,
        0,
        3
      );

    const score =
      Math.round(
        clamp(
          rawScore,
          20,
          100
        )
      );

    return {
      success: true,

      scored: true,

      reason:
        'skater-performance-calculated',

      score,

      tier:
        score >= 90
          ? 'elite'
          : score >= 80
            ? 'excellent'
            : score >= 70
              ? 'strong'
              : score >= 60
                ? 'solid'
                : score >= 50
                  ? 'average'
                  : score >= 40
                    ? 'poor'
                    : 'very-poor',

      components: {
        gamesPlayed,
        goals,
        assists,
        points,
        shots,
        plusMinus,
        penaltyMinutes,
        blockedShots,
        hits,
        takeaways,
        giveaways,
        timeOnIceSeconds,

        gameWinningGoal:
          Number(
            gameLine.gameWinningGoals
          ) > 0,

        teamWon:
          performance.teamWon === true,

        teamLost:
          performance.teamLost === true,
      },
    };
  }

  function createPostGameProgressionResult(
    performance,
    performanceScore
  ) {
    if (
      !performance ||
      performance.success !== true ||
      performance.found !== true ||
      !performance.player ||
      !performance.gameLine
    ) {
      return {
        success: true,

        created: false,

        reason:
          'career-player-performance-not-found',

        player: null,

        eventResult: null,

        recentFormTarget: null,

        gameLogEntry: null,
      };
    }

    if (
      !performanceScore ||
      performanceScore.success !== true ||
      performanceScore.scored !== true
    ) {
      return {
        success: true,

        created: false,

        reason:
          performanceScore?.reason ||
          'performance-score-not-created',

        player:
          performance.player,

        eventResult: null,

        recentFormTarget: null,

        gameLogEntry: null,
      };
    }

    const clamp = (
      value,
      minimum,
      maximum
    ) =>
      Math.max(
        minimum,
        Math.min(
          maximum,
          Number(value) || 0
        )
      );

    const player =
      performance.player;

    const gameLine =
      performance.gameLine;

    const score =
      clamp(
        performanceScore.score,
        20,
        100
      );

    const tier =
      performanceScore.tier ||
      'average';

    const isGoalie =
      performance.playerType ===
      'goalie';

    /*
     * Every appearance earns a modest baseline reward.
     * Better performances add more XP, but one great game
     * must never produce an instant attribute increase.
     */
    /*
     * Game development XP.
     *
     * The player should feel meaningful progress after every
     * appearance, while elite performances accelerate growth
     * without creating instant attribute increases.
     */

    /*
     * Be-A-Pro-style game progression pace.
     *
     * The performance score already incorporates actual game
     * production and two-way play. Convert that score into a
     * predictable development reward so every game produces
     * visible progress without creating instant upgrades.
     */
    let totalXP;

    if (score < 40) {
      /*
       * Very poor game
       * Target: 10–13 XP
       */
      totalXP =
        10 +
        Math.round(
          (
            score - 20
          ) / 7
        );

    } else if (score < 50) {
      /*
       * Poor game
       * Target: 14–17 XP
       */
      totalXP =
        14 +
        Math.round(
          (
            score - 40
          ) / 3
        );

    } else if (score < 60) {
      /*
       * Average game
       * Target: 18–21 XP
       */
      totalXP =
        18 +
        Math.round(
          (
            score - 50
          ) / 3
        );

    } else if (score < 70) {
      /*
       * Solid game
       * Target: 22–25 XP
       */
      totalXP =
        22 +
        Math.round(
          (
            score - 60
          ) / 3
        );

    } else if (score < 80) {
      /*
       * Strong game
       * Target: 26–30 XP
       */
      totalXP =
        26 +
        Math.round(
          (
            score - 70
          ) / 2
        );

    } else if (score < 90) {
      /*
       * Excellent game
       * Target: 31–36 XP
       */
      totalXP =
        31 +
        Math.round(
          (
            score - 80
          ) / 2
        );

    } else {
      /*
       * Elite / dominant game
       * Target: 37–45 XP
       */
      totalXP =
        37 +
        Math.round(
          (
            score - 90
          ) * 0.8
        );
    }

    totalXP =
      clamp(
        totalXP,
        10,
        45
      );

    /*
     * Reward individual attributes rather than a second generic
     * spendable currency. applyEventResult() already treats
     * xp.attributes as the real upgrade balance.
     */
    const attributeRewards = {};

    const addAttributeXP = (
      attributeKey,
      amount
    ) => {
      const safeAmount =
        Math.max(
          0,
          Math.round(
            Number(amount) || 0
          )
        );

      if (safeAmount <= 0) {
        return;
      }

      attributeRewards[
        attributeKey
      ] =
        (
          Number(
            attributeRewards[
              attributeKey
            ]
          ) || 0
        ) + safeAmount;
    };

    const normalizedPosition =
      normalizeAttributePosition(
        player.position
      );

    if (isGoalie) {
      /*
       * Goalie game XP emphasizes reads, positioning,
       * tracking and reaction ability.
       */
      addAttributeXP(
        'puckTracking',
        totalXP * 0.28
      );

      addAttributeXP(
        'positioning',
        totalXP * 0.26
      );

      addAttributeXP(
        'reflexes',
        totalXP * 0.24
      );

      addAttributeXP(
        'reboundControl',
        totalXP * 0.22
      );
    } else {
      /*
       * Smart skater development.
       *
       * XP direction now responds to the player's actual game
       * instead of giving every forward or defenseman the same
       * fixed attribute split.
       */

      const goals =
        Math.max(
          0,
          Number(gameLine.goals) || 0
        );

      const assists =
        Math.max(
          0,
          Number(gameLine.assists) || 0
        );

      const shots =
        Math.max(
          0,
          Number(gameLine.shots) || 0
        );

      const plusMinus =
        Number(gameLine.plusMinus) || 0;

      const blockedShots =
        Math.max(
          0,
          Number(
            gameLine.blockedShots
          ) || 0
        );

      const hits =
        Math.max(
          0,
          Number(gameLine.hits) || 0
        );

      const takeaways =
        Math.max(
          0,
          Number(
            gameLine.takeaways
          ) || 0
        );

      const giveaways =
        Math.max(
          0,
          Number(
            gameLine.giveaways
          ) || 0
        );

      const penaltyMinutes =
        Math.max(
          0,
          Number(
            gameLine.penaltyMinutes
          ) || 0
        );

      const isDefenseman =
        normalizedPosition === 'LD' ||
        normalizedPosition === 'RD';

      /*
       * Weight map, not raw XP.
       * These weights are normalized into totalXP below.
       */
      const developmentWeights = {};

      const addWeight = (
        attributeKey,
        amount
      ) => {
        const safeAmount =
          Math.max(
            0,
            Number(amount) || 0
          );

        if (safeAmount <= 0) {
          return;
        }

        developmentWeights[
          attributeKey
        ] =
          (
            Number(
              developmentWeights[
                attributeKey
              ]
            ) || 0
          ) + safeAmount;
      };

      /*
       * Every skater gets a small involvement baseline.
       * Position changes what that baseline emphasizes.
       */
      if (isDefenseman) {
        addWeight(
          'defensiveAwareness',
          1.8
        );

        addWeight(
          'passing',
          1.1
        );

        addWeight(
          'stickChecking',
          1.0
        );

        addWeight(
          'agility',
          0.7
        );
      } else {
        addWeight(
          'offensiveAwareness',
          1.5
        );

        addWeight(
          'puckControl',
          1.0
        );

        addWeight(
          'acceleration',
          0.7
        );

        addWeight(
          'passing',
          0.6
        );
      }

      /*
       * Goals:
       * finishing, shooting and offensive reads.
       */
      if (goals > 0) {
        addWeight(
          'wristShotAccuracy',
          goals * 3.2
        );

        addWeight(
          'wristShotPower',
          goals * 1.5
        );

        addWeight(
          'offensiveAwareness',
          goals * 2.3
        );

        addWeight(
          'puckControl',
          goals * 1.0
        );
      }

      /*
       * Assists:
       * passing, reads and puck possession.
       */
      if (assists > 0) {
        addWeight(
          'passing',
          assists * 3.4
        );

        addWeight(
          'offensiveAwareness',
          assists * 2.2
        );

        addWeight(
          'puckControl',
          assists * 1.6
        );
      }

      /*
       * Shot volume provides smaller shooting growth even when
       * the player does not score.
       */
      if (shots > 0) {
        addWeight(
          'wristShotAccuracy',
          Math.min(
            shots,
            8
          ) * 0.45
        );

        addWeight(
          'wristShotPower',
          Math.min(
            shots,
            8
          ) * 0.20
        );
      }

      /*
       * Two-way results.
       */
      if (plusMinus > 0) {
        addWeight(
          'defensiveAwareness',
          Math.min(
            plusMinus,
            4
          ) * 0.8
        );

        addWeight(
          'offensiveAwareness',
          Math.min(
            plusMinus,
            4
          ) * 0.5
        );
      }

      /*
       * Shot blocking.
       */
      if (blockedShots > 0) {
        addWeight(
          'shotBlocking',
          Math.min(
            blockedShots,
            6
          ) * 2.2
        );

        addWeight(
          'defensiveAwareness',
          Math.min(
            blockedShots,
            6
          ) * 1.1
        );
      }

      /*
       * Physical play.
       */
      if (hits > 0) {
        addWeight(
          'bodyChecking',
          Math.min(
            hits,
            8
          ) * 1.8
        );

        addWeight(
          'strength',
          Math.min(
            hits,
            8
          ) * 0.9
        );
      }

      /*
       * Puck retrieval and defensive reads.
       */
      if (takeaways > 0) {
        addWeight(
          'stickChecking',
          Math.min(
            takeaways,
            6
          ) * 2.2
        );

        addWeight(
          'defensiveAwareness',
          Math.min(
            takeaways,
            6
          ) * 1.3
        );
      }

      /*
       * Mistakes do not remove previously earned XP, but they
       * reduce the weighting of awareness/puck-control growth.
       */
      if (giveaways > 0) {
        const giveawayPenalty =
          Math.min(
            giveaways,
            6
          ) * 0.45;

        if (
          developmentWeights
            .puckControl
        ) {
          developmentWeights
            .puckControl =
            Math.max(
              0.25,
              developmentWeights
                .puckControl -
                giveawayPenalty
            );
        }

        if (
          developmentWeights
            .offensiveAwareness
        ) {
          developmentWeights
            .offensiveAwareness =
            Math.max(
              0.25,
              developmentWeights
                .offensiveAwareness -
                giveawayPenalty *
                  0.6
            );
        }
      }

      /*
       * Excessive penalties slightly suppress discipline-
       * adjacent defensive development rather than subtracting
       * XP from the player.
       */
      if (
        penaltyMinutes >= 4 &&
        developmentWeights
          .defensiveAwareness
      ) {
        developmentWeights
          .defensiveAwareness =
          Math.max(
            0.25,
            developmentWeights
              .defensiveAwareness -
              Math.min(
                penaltyMinutes,
                10
              ) *
                0.12
          );
      }

      /*
       * Keep only the most relevant skills from this game.
       *
       * A player can touch many areas in one performance, but
       * development should feel focused rather than diluted
       * across every attribute that received a tiny weight.
       */
      const rankedDevelopmentWeights =
        Object.entries(
          developmentWeights
        )
          .filter(
            ([, weight]) =>
              Number(weight) > 0
          )
          .sort(
            (
              [, firstWeight],
              [, secondWeight]
            ) =>
              Number(secondWeight) -
              Number(firstWeight)
          );

      /*
       * The number of rewarded attributes can vary naturally.
       *
       * Quiet games remain focused on roughly three skills.
       * More varied performances can develop four or five.
       */
      let rewardAttributeCount = 3;

      if (
        rankedDevelopmentWeights.length >= 4 &&
        (
          goals +
          assists +
          blockedShots +
          hits +
          takeaways
        ) >= 2
      ) {
        rewardAttributeCount = 4;
      }

      if (
        rankedDevelopmentWeights.length >= 5 &&
        (
          goals +
          assists +
          blockedShots +
          hits +
          takeaways
        ) >= 4
      ) {
        rewardAttributeCount = 5;
      }

      const selectedDevelopmentWeights =
        rankedDevelopmentWeights.slice(
          0,
          rewardAttributeCount
        );

      const selectedWeightTotal =
        selectedDevelopmentWeights.reduce(
          (
            sum,
            [, weight]
          ) =>
            sum +
            (
              Number(weight) || 0
            ),
          0
        );

      if (selectedWeightTotal > 0) {
        selectedDevelopmentWeights.forEach(
          ([
            attributeKey,
            weight
          ]) => {
            addAttributeXP(
              attributeKey,
              totalXP *
                (
                  weight /
                  selectedWeightTotal
                )
            );
          }
        );
      }
    }

    /*
     * Rounding individual rewards can leave the attribute total
     * one or two points away from totalXP. Correct that difference
     * on the first rewarded attribute.
     */
    const rewardedAttributeKeys =
      Object.keys(
        attributeRewards
      );

    const distributedXP =
      Object.values(
        attributeRewards
      ).reduce(
        (sum, amount) =>
          sum +
          (
            Number(amount) || 0
          ),
        0
      );

    const distributionDifference =
      totalXP -
      distributedXP;

    if (
      rewardedAttributeKeys.length > 0 &&
      distributionDifference !== 0
    ) {
      const primaryAttribute =
        rewardedAttributeKeys[0];

      attributeRewards[
        primaryAttribute
      ] =
        Math.max(
          0,
          attributeRewards[
            primaryAttribute
          ] +
            distributionDifference
        );
    }

    /*
     * Coach trust reacts more quickly than reputation.
     * Average games are mostly neutral, while sustained strong
     * performances will eventually influence deployment.
     */
    const coachTrustChange =
      score >= 90
        ? 4
        : score >= 80
          ? 3
          : score >= 70
            ? 2
            : score >= 60
              ? 1
              : score >= 45
                ? 0
                : score >= 35
                  ? -1
                  : -2;

    /*
     * Reputation grows only from notable performances.
     * It is not a duplicate form or XP meter.
     */
    let reputationChange =
      score >= 90
        ? 5
        : score >= 80
          ? 3
          : score >= 70
            ? 1
            : 0;

    const isFeaturedGame =
      Boolean(
        performance.gameContext
          ?.isFeatured ||
        performance.gameContext
          ?.featured ||
        performance.gameContext
          ?.scoutsInAttendance ||
        performance.gameContext
          ?.rivalry
      );

    if (
      isFeaturedGame &&
      score >= 70
    ) {
      reputationChange += 2;
    }

    const moraleChange =
      performance.teamWon === true
        ? score >= 70
          ? 2
          : 1
        : score < 45
          ? -2
          : -1;

    /*
     * Recent form trends toward the new performance instead of
     * becoming identical to one game's score.
     *
     * The actual player mutation will be handled separately.
     */
    const previousRecentForm =
      clamp(
        player.recentForm,
        0,
        100
      );

    const recentFormTarget =
      Math.round(
        clamp(
          previousRecentForm *
            0.65 +
          score *
            0.35,
          0,
          100
        )
      );

    const teamResult =
      performance.teamResult ||
      {};

    const opponentResult =
      performance.opponentResult ||
      {};

    const gameId =
      performance.gameId ||
      null;

    const gameDate =
      performance.date ||
      null;

    const eventResult =
      createEmptyEventResult();

    eventResult.success =
      true;

    eventResult.resolved =
      true;

    eventResult.type =
      EVENT_TYPES.GAME;

    eventResult.reason =
      'post-game-progression-created';

    eventResult.eventId =
      gameId;

    eventResult.date =
      gameDate;

    eventResult.xp = {
      ...eventResult.xp,

      total:
        totalXP,

      goalie:
        isGoalie
          ? totalXP
          : 0,

      general:
        totalXP,

      attributes:
        attributeRewards,
    };

    eventResult.coachTrust =
      coachTrustChange;

    eventResult.morale =
      moraleChange;

    eventResult.reputation =
      reputationChange;

    /*
     * Preserve the game-performance data alongside the reward.
     * This will help the future weekly summary and objective
     * systems without needing to recalculate the box score.
     */
    eventResult.statistics = {
      gameId,

      playerId:
        player.playerId ||
        player.id ||
        null,

      playerType:
        performance.playerType,

      performanceScore:
        score,

      performanceTier:
        tier,

      teamId:
        teamResult.teamId ||
        player.teamId ||
        null,

      opponentTeamId:
        opponentResult.teamId ||
        null,

      teamWon:
        performance.teamWon === true,

      teamLost:
        performance.teamLost === true,

      wentToOvertime:
        performance.wentToOvertime === true,

      wentToShootout:
        performance.wentToShootout === true,

      gameLine: {
        ...gameLine,
      },
    };

    const gameLogEntry = {
      gameId,

      date:
        gameDate,

      teamId:
        teamResult.teamId ||
        player.teamId ||
        null,

      opponentTeamId:
        opponentResult.teamId ||
        null,

      homeTeamId:
        performance.gameResult
          ?.home?.teamId ||
        null,

      awayTeamId:
        performance.gameResult
          ?.away?.teamId ||
        null,

      result:
        performance.teamWon === true
          ? 'W'
          : performance.wentToOvertime === true
            ? 'OTL'
            : 'L',

      teamScore:
        Number(
          teamResult.score
        ) || 0,

      opponentScore:
        Number(
          opponentResult.score
        ) || 0,

      playerType:
        performance.playerType,

      performanceScore:
        score,

      performanceTier:
        tier,

      xpEarned:
        totalXP,

      coachTrustChange,

      moraleChange,

      reputationChange,

      recentFormBefore:
        previousRecentForm,

      recentFormAfter:
        recentFormTarget,

      statistics: {
        ...gameLine,
      },
    };

    return {
      success: true,

      created: true,

      reason:
        'post-game-progression-result-created',

      player,

      playerId:
        player.playerId ||
        player.id ||
        null,

      gameId,

      performanceScore:
        score,

      performanceTier:
        tier,

      totalXP,

      attributeRewards,

      coachTrustChange,

      moraleChange,

      reputationChange,

      previousRecentForm,

      recentFormTarget,

      eventResult,

      gameLogEntry,
    };
  }

  function applyPostGameProgression(
    progressionResult
  ) {
    if (
      !progressionResult ||
      typeof progressionResult !== 'object'
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'invalid-post-game-progression',
      };
    }

    /*
     * NPC-only games correctly produce no career-player
     * progression package. That is not an application failure.
     */
    if (
      progressionResult.created !== true
    ) {
      return {
        success: true,
        applied: false,
        reason:
          progressionResult.reason ||
          'post-game-progression-not-created',

        gameId:
          progressionResult.gameId ||
          null,

        playerId:
          progressionResult.playerId ||
          null,
      };
    }

    const player =
      progressionResult.player ||
      (
        progressionResult.playerId
          ? getPlayerById(
              progressionResult.playerId
            )
          : null
      );

    const gameId =
      progressionResult.gameId ||
      progressionResult.gameLogEntry
        ?.gameId ||
      progressionResult.eventResult
        ?.eventId ||
      null;

    if (
      !player ||
      !gameId ||
      !progressionResult.eventResult
    ) {
      return {
        success: false,
        applied: false,
        reason:
          'incomplete-post-game-progression',

        gameId,

        playerId:
          progressionResult.playerId ||
          null,
      };
    }

    ensureCanonicalPlayerContract(
      player
    );

    if (
      !Array.isArray(
        player.gameLog
      )
    ) {
      player.gameLog = [];
    }

    /*
     * The career game log is the permanent duplicate guard.
     * A game can update progression only once, even if its
     * date or application pipeline is retried.
     */
    const existingGameLogEntry =
      player.gameLog.find(
        entry =>
          String(
            entry?.gameId
          ) ===
          String(
            gameId
          )
      ) ||
      null;

    if (existingGameLogEntry) {
      return {
        success: true,
        applied: false,
        reason:
          'post-game-progression-already-applied',

        gameId,

        playerId:
          player.playerId ||
          player.id ||
          null,

        gameLogEntry:
          existingGameLogEntry,
      };
    }

    const previousState = {
      recentForm:
        Number(
          player.recentForm
        ) || 50,

      coachTrust:
        Number(
          player.coachTrust
        ) || 50,

      morale:
        Number(
          player.morale
        ) || 50,

      reputationPoints:
        Number(
          player.reputationPoints
        ) || 0,

      lifetimeXP:
        Number(
          player.development
            ?.lifetimeXP
        ) || 0,

      gameLogLength:
        player.gameLog.length,
    };

    /*
     * The shared Event Result applier remains the canonical
     * writer for XP, trust, morale, reputation, health,
     * history, accomplishments and future progression fields.
     */
    const eventApplied =
      applyEventResult(
        player,
        progressionResult.eventResult
      );

    if (!eventApplied) {
      return {
        success: false,
        applied: false,
        reason:
          'post-game-event-result-not-applied',

        gameId,

        playerId:
          player.playerId ||
          player.id ||
          null,
      };
    }

    const clamp = (
      value,
      minimum,
      maximum
    ) =>
      Math.max(
        minimum,
        Math.min(
          maximum,
          Number(value) || 0
        )
      );

    /*
     * Recent form is intentionally separate from XP, trust and
     * reputation. It reflects the player's current performance
     * trend and will later influence deployment decisions.
     */
    player.recentForm =
      Math.round(
        clamp(
          progressionResult
            .recentFormTarget,
          0,
          100
        )
      );

    const gameLogEntry = {
      ...(
        progressionResult
          .gameLogEntry ||
        {}
      ),

      gameId,

      playerId:
        player.playerId ||
        player.id ||
        null,

      appliedAt:
        new Date().toISOString(),
    };

    player.gameLog.push(
      gameLogEntry
    );

    /*
     * Keep the log chronological while preserving stable order
     * for multiple entries sharing the same date.
     */
    player.gameLog.sort(
      (
        firstEntry,
        secondEntry
      ) => {
        const dateComparison =
          String(
            firstEntry?.date ||
            ''
          ).localeCompare(
            String(
              secondEntry?.date ||
              ''
            )
          );

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return String(
          firstEntry?.gameId ||
          ''
        ).localeCompare(
          String(
            secondEntry?.gameId ||
            ''
          )
        );
      }
    );

    ensureCanonicalPlayerContract(
      player
    );

    return {
      success: true,
      applied: true,
      reason:
        'post-game-progression-applied',

      gameId,

      playerId:
        player.playerId ||
        player.id ||
        null,

      performanceScore:
        progressionResult
          .performanceScore,

      performanceTier:
        progressionResult
          .performanceTier,

      xpEarned:
        progressionResult.totalXP,

      attributeRewards: {
        ...(
          progressionResult
            .attributeRewards ||
          {}
        ),
      },

      coachTrustChange:
        progressionResult
          .coachTrustChange,

      moraleChange:
        progressionResult
          .moraleChange,

      reputationChange:
        progressionResult
          .reputationChange,

      previousState,

      currentState: {
        recentForm:
          player.recentForm,

        coachTrust:
          player.coachTrust,

        morale:
          player.morale,

        reputationPoints:
          Number(
            player.reputationPoints
          ) || 0,

        lifetimeXP:
          Number(
            player.development
              ?.lifetimeXP
          ) || 0,
      },

      gameLogEntry,
    };
  }

  function repairCompletedGameDevelopment(
    gameId,
    options = {}
  ) {
    if (!gameId) {
      return {
        success: false,
        repaired: false,
        reason: 'game-id-missing',
      };
    }

    const scheduledGame =
      Array.isArray(_state.schedule)
        ? _state.schedule.find(game =>
            String(
              game?.id ||
              game?.gameId ||
              ''
            ) ===
            String(gameId)
          ) || null
        : null;

    if (!scheduledGame) {
      return {
        success: false,
        repaired: false,
        reason: 'scheduled-game-not-found',
        gameId,
      };
    }

    const savedGameResult =
      scheduledGame.gameResult &&
      typeof scheduledGame.gameResult ===
        'object'
        ? structuredClone(
            scheduledGame.gameResult
          )
        : null;

    if (!savedGameResult) {
      return {
        success: false,
        repaired: false,
        reason: 'saved-game-result-missing',
        gameId,
      };
    }

    /*
     * Older completed games were saved before the simulator
     * correctly marked skater/goalie appearances.
     *
     * Repair participation only on the temporary copy used
     * for development reconstruction.
     */
    [
      savedGameResult.home,
      savedGameResult.away,
    ].forEach(teamResult => {
      if (!teamResult) {
        return;
      }

      if (
        Array.isArray(
          teamResult.skaters
        )
      ) {
        teamResult.skaters.forEach(
          skaterLine => {
            if (
              skaterLine &&
              skaterLine.dressed !== false
            ) {
              skaterLine.gamesPlayed = 1;
            }
          }
        );
      }

      if (
        Array.isArray(
          teamResult.goalies
        )
      ) {
        teamResult.goalies.forEach(
          goalieLine => {
            if (!goalieLine) {
              return;
            }

            if (
              goalieLine.started === true
            ) {
              goalieLine.gamesPlayed = 1;
            }
          }
        );
      }
    });

    const careerPerformance =
      getCareerPlayerGamePerformance(
        savedGameResult
      );

    if (
      careerPerformance.success !== true ||
      careerPerformance.found !== true
    ) {
      return {
        success: false,
        repaired: false,
        reason:
          careerPerformance.reason ||
          'career-player-performance-not-found',
        gameId,
        careerPerformance,
      };
    }

    const performanceScore =
      calculateCareerGamePerformanceScore(
        careerPerformance
      );

    if (
      performanceScore.success !== true ||
      performanceScore.scored !== true
    ) {
      return {
        success: false,
        repaired: false,
        reason:
          performanceScore.reason ||
          'career-performance-score-not-created',
        gameId,
        careerPerformance,
        performanceScore,
      };
    }

    const progressionResult =
      createPostGameProgressionResult(
        careerPerformance,
        performanceScore
      );

    if (
      progressionResult.success !== true ||
      progressionResult.created !== true
    ) {
      return {
        success: false,
        repaired: false,
        reason:
          progressionResult.reason ||
          'progression-result-not-created',
        gameId,
        careerPerformance,
        performanceScore,
        progressionResult,
      };
    }

    /*
     * applyPostGameProgression already contains the permanent
     * game-log duplicate guard, so an old game can never award
     * its XP twice.
     */
    const progressionApplication =
      applyPostGameProgression(
        progressionResult
      );

    const savedDevelopment = {
      progressionResult:
        structuredClone(
          progressionResult
        ),

      progressionApplication:
        progressionApplication &&
        typeof progressionApplication ===
          'object'
          ? structuredClone(
              progressionApplication
            )
          : null,

      performanceScore:
        Number(
          performanceScore.score
        ) || 0,

      playerId:
        careerPerformance.playerId ||
        null,

      repaired:
        true,

      repairedAt:
        new Date().toISOString(),
    };

    scheduledGame.postgameSummary =
      scheduledGame.postgameSummary &&
      typeof scheduledGame
        .postgameSummary === 'object'
        ? scheduledGame.postgameSummary
        : {};

    scheduledGame
      .postgameSummary
      .development =
      structuredClone(
        savedDevelopment
      );

    scheduledGame
      .gameResult
      .development =
      structuredClone(
        savedDevelopment
      );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      repaired: true,
      reason:
        progressionApplication
          ?.reason ===
          'post-game-progression-already-applied'
          ? 'development-display-repaired'
          : 'development-repaired-and-applied',

      gameId,

      careerPerformance,
      performanceScore,
      progressionResult,
      progressionApplication,

      development:
        savedDevelopment,
    };
  }

  function processSeasonDate(
    dateString,
    options = {}
  ) {
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      typeof dateString !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      return {
        success: false,
        processed: false,
        date: dateString,
        reason: 'invalid-date',
      };
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    const wasAlreadyProcessed =
      _state.season.processedDates
        .includes(dateString);

    if (wasAlreadyProcessed) {
      return {
        success: true,
        processed: false,
        date: dateString,
        reason: 'already-processed',
        eventResults: [],
      };
    }

    /*
     * Future date-specific systems will plug in here:
     *
     * - Scheduled games
     * - Practices
     * - Recovery sessions
     * - Coach meetings
     * - Media interviews
     * - Scout interviews
     * - Injury decisions
     * - Story events
     *
     * For now, the coordinator records the date exactly once.
     */
    const scheduledEvents =
      getScheduledEventsForDate(
        dateString
      );

    /*
     * ROADMAP 6 — LIVE GAME RESULT HANDOFF
     *
     * A career game played through the live experience has
     * already been completely resolved by the canonical live
     * simulator.
     *
     * When that finished gameResult is supplied here, inject it
     * into the NORMAL permanent game-result application pipeline
     * instead of simulating the same scheduled game again.
     */
    const suppliedGameResult =
      options?.resolvedGameResult &&
      typeof options
        .resolvedGameResult ===
          'object'
        ? options.resolvedGameResult
        : null;

    const suppliedGameId =
      suppliedGameResult
        ?.gameId ||
      suppliedGameResult
        ?.eventId ||
      null;

    const eventResults =
      scheduledEvents.map(
        event => {
          const eventId =
            event?.gameId ||
            event?.eventId ||
            event?.id ||
            null;

          const isSuppliedLiveGame =
            Boolean(
              suppliedGameResult &&
              suppliedGameId &&
              eventId &&
              String(eventId) ===
                String(
                  suppliedGameId
                )
            );

          if (
            isSuppliedLiveGame
          ) {
            return {
              success: true,

              resolved: true,

              type:
                EVENT_TYPES.GAME,

              eventId,

              date:
                dateString,

              reason:
                'completed-live-game-result-supplied',

              gameResult:
                structuredClone(
                  suppliedGameResult
                ),
            };
          }

          return resolveScheduledEvent(
            event,
            {
              date:
                dateString,
            }
          );
        }
      );

    const blockingEventResult =
      eventResults.find(
        result =>
          result?.stopSimulation === true
      ) || null;

    if (blockingEventResult) {
      return {
        success: true,
        processed: false,
        date: dateString,

        reason:
          'player-interaction-required',

        stopSimulation: true,

        blockingEventResult,

        eventResults,
      };
    }

    /*
     * Apply every resolved game to the canonical teams and
     * schedule before finalizing the date.
     *
     * Game results use their own application layer because
     * they affect the entire league rather than only the
     * career player.
     */
    const appliedGameResults =
      eventResults
        .filter(result =>
          result?.resolved === true &&
          result?.type ===
            EVENT_TYPES.GAME
        )
        .map(result => {
          const teamAndScheduleApplication =
            applyGameResultToTeamsAndSchedule(
              result.gameResult
            );

          /*
           * Do not attempt player-stat application when the
           * team or schedule write itself failed.
           */
          if (
            teamAndScheduleApplication
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                teamAndScheduleApplication
                  .reason ||
                'team-and-schedule-application-failed',

              teamAndScheduleApplication,

              skaterStatApplication:
                null,
            };
          }

          const skaterStatApplication =
            applyGameResultToSkaterStats(
              result.gameResult
            );

          if (
            skaterStatApplication
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                skaterStatApplication
                  .reason ||
                'skater-stat-application-failed',

              teamAndScheduleApplication,

              skaterStatApplication,

              goalieStatApplication:
                null,
            };
          }

          /*
           * Apply the simulated goalie box scores only after
           * the team, schedule and skater writes succeeded.
           */
          const goalieStatApplication =
            applyGameResultToGoalieStats(
              result.gameResult
            );

          if (
            goalieStatApplication
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                goalieStatApplication
                  .reason ||
                'goalie-stat-application-failed',

              teamAndScheduleApplication,

              skaterStatApplication,

              goalieStatApplication,
            };
          }

          /*
           * Find the career player in this game's box score.
           * NPC-only games correctly continue without creating
           * a progression package.
           */
          const careerPerformance =
            getCareerPlayerGamePerformance(
              result.gameResult
            );

          if (
            careerPerformance
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                careerPerformance
                  .reason ||
                'career-performance-lookup-failed',

              teamAndScheduleApplication,

              skaterStatApplication,

              goalieStatApplication,

              careerPerformance,

              performanceScore:
                null,

              progressionResult:
                null,

              progressionApplication:
                null,
            };
          }

          const performanceScore =
            calculateCareerGamePerformanceScore(
              careerPerformance
            );

          if (
            performanceScore
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                performanceScore
                  .reason ||
                'career-performance-score-failed',

              teamAndScheduleApplication,

              skaterStatApplication,

              goalieStatApplication,

              careerPerformance,

              performanceScore,

              progressionResult:
                null,

              progressionApplication:
                null,
            };
          }

          const progressionResult =
            createPostGameProgressionResult(
              careerPerformance,
              performanceScore
            );

          if (
            progressionResult
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                progressionResult
                  .reason ||
                'post-game-progression-creation-failed',

              teamAndScheduleApplication,

              skaterStatApplication,

              goalieStatApplication,

              careerPerformance,

              performanceScore,

              progressionResult,

              progressionApplication:
                null,
            };
          }

          const progressionApplication =
            applyPostGameProgression(
              progressionResult
            );

          /*
           * Freeze the already-applied career development result
           * onto both the canonical game result and the permanently
           * saved schedule entry. Team/schedule application happens
           * earlier, so its postgameSummary must be updated directly.
           */
          const savedDevelopment = {
            progressionResult:
              progressionResult &&
              typeof progressionResult ===
                'object'
                ? structuredClone(
                    progressionResult
                  )
                : null,

            progressionApplication:
              progressionApplication &&
              typeof progressionApplication ===
                'object'
                ? structuredClone(
                    progressionApplication
                  )
                : null,

            performanceScore:
              Number(
                performanceScore
              ) || 0,

            playerId:
              careerPerformance
                ?.playerId ||
              null,
          };

          if (
            result.gameResult &&
            typeof result.gameResult ===
              'object'
          ) {
            result.gameResult.development =
              structuredClone(
                savedDevelopment
              );
          }

          const completedScheduledGame =
            teamAndScheduleApplication
              ?.scheduledGame ||
            null;

          if (
            completedScheduledGame
              ?.postgameSummary &&
            typeof completedScheduledGame
              .postgameSummary ===
                'object'
          ) {
            completedScheduledGame
              .postgameSummary
              .development =
              structuredClone(
                savedDevelopment
              );
          }

          save();

          if (
            progressionApplication
              .success !== true
          ) {
            return {
              eventId:
                result.eventId ||
                result.gameResult?.gameId ||
                null,

              success: false,

              applied: false,

              reason:
                progressionApplication
                  .reason ||
                'post-game-progression-application-failed',

              teamAndScheduleApplication,

              skaterStatApplication,

              goalieStatApplication,

              careerPerformance,

              performanceScore,

              progressionResult,

              progressionApplication,
            };
          }

          return {
            eventId:
              result.eventId ||
              result.gameResult?.gameId ||
              null,

            success: true,

            applied:
              Boolean(
                teamAndScheduleApplication
                  .applied ||
                skaterStatApplication
                  .applied ||
                goalieStatApplication
                  .applied ||
                progressionApplication
                  .applied
              ),

            reason:
              careerPerformance.found
                ? 'complete-game-and-career-progression-applied'
                : 'complete-npc-game-result-applied',

            teamAndScheduleApplication,

            skaterStatApplication,

            goalieStatApplication,

            careerPerformance,

            performanceScore,

            progressionResult,

            progressionApplication,
          };
        });

    const failedGameApplication =
      appliedGameResults.find(
        application =>
          application?.success !== true
      ) || null;

    /*
     * Never mark the date as processed when a resolved game
     * could not be written permanently. This keeps the date
     * available for a safe retry instead of losing the result.
     */
    if (failedGameApplication) {
      return {
        success: false,

        processed: false,

        date:
          dateString,

        reason:
          'game-result-application-failed',

        stopSimulation:
          true,

        failedGameApplication,

        eventResults,

        appliedGameResults,
      };
    }

    /*
     * Apply every successfully resolved event result to the
     * canonical career player before the date is finalized.
     *
     * Unresolved placeholders and blocking events are ignored.
     */
    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    const appliedEventResults =
      eventResults
        .filter(result =>
          result?.resolved === true
        )
        .map(result => ({
          eventId:
            result.eventId ||
            null,

          type:
            result.type ||
            null,

          applied:
            careerPlayer
              ? applyEventResult(
                  careerPlayer,
                  result
                )
              : false,
        }));

    _state.season.processedDates.push(
      dateString
    );

    _state.season.processedDates.sort(
      (a, b) =>
        String(a).localeCompare(
          String(b)
        )
    );

    _state.season.lastProcessedDate =
      dateString;

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      processed: true,
      date: dateString,
      reason: 'date-processed',

      eventResults,

      appliedGameResults,

      appliedEventResults,
    };
  }
  
  // ── Hockey Player Blueprint ──────────────────────────────────

  function createGeneratedPlayer(slot) {

    const nationality =
      generatePlayerNationality();

    const namePool =
      PLAYER_NAME_POOLS[nationality] || {
        firstNames:
          PLAYER_FIRST_NAMES,

        lastNames:
          PLAYER_LAST_NAMES,
      };

    const firstName =
      namePool.firstNames[
        Math.floor(
          Math.random() *
          namePool.firstNames.length
        )
      ];

    const lastName =
      namePool.lastNames[
        Math.floor(
          Math.random() *
          namePool.lastNames.length
        )
      ];

    const overall =
      Math.floor(Math.random() * 13) + 58; // 58–70

    const potential =
      overall + Math.floor(Math.random() * 16) + 8;
    

    const archetypes =
      PLAYER_ARCHETYPES[slot.position] || ['Balanced'];
    const archetype =
      archetypes[
        Math.floor(Math.random() * archetypes.length)
      ];
    const potentialRole = getPotentialRole(
      slot.position,
      Math.min(99, potential)
    );

      const potentialAccuracy =
        generatePotentialAccuracy();

      const attributes =
        slot.position === 'G'
          ? createGoalieAttributesFromOverall(
              overall,
              archetype
            )
          : createAttributesFromOverall(
              overall,
              slot.position,
              archetype
            );

      const calculatedOverall =
        slot.position === 'G'
          ? calculateGoalieOverallFromAttributes(
              attributes
            )
          : calculateOverallFromAttributes(
              attributes,
              slot.position
            );

        return ensureCanonicalPlayerContract({

      id:
        'player_' +
        Math.random().toString(36).slice(2, 10),

      firstName,
      lastName,

      nationality,

      position: slot.position,

      rosterSlot: slot.slot,

      overall: calculatedOverall,

      potential: Math.min(99, potential),

      year: 'Freshman',

      age: 14,

      shoots:
        Math.random() < 0.65 ? 'L' : 'R',

      height:
        `${5 + Math.floor(Math.random() * 2)}'${6 + Math.floor(Math.random() * 7)}"`,

      weight:
        135 + Math.floor(Math.random() * 50),

      archetype,
      
      attributes,
        
      goals: 0,
      assists: 0,
      points: 0,

      gamesPlayed: 0,

      plusMinus: 0,

      penaltyMinutes: 0,

      captain: false,

      alternateCaptain: false,

      injured: false,

      injury: null,

      morale: 50,

      coachTrust: 50,

      // Public scouting recognition. This is separate from current ability.
      reputationStars: 1,
      reputationPoints: Math.floor(Math.random() * 16) + 5,

      developmentSeed: Math.random(),

    });

  }
  function assignUniqueJerseyNumbers(
    roster = []
  ) {
    if (!Array.isArray(roster)) {
      return roster;
    }

    const usedNumbers =
      new Set();

    const playersNeedingNumbers = [];

    /*
     * Process the career player first so their chosen jersey
     * number takes priority if an older generated player has
     * the same number.
     */
    const orderedPlayers = [
      ...roster.filter(
        player => player.isCareerPlayer
      ),

      ...roster.filter(
        player => !player.isCareerPlayer
      ),
    ];

    orderedPlayers.forEach(player => {
      const jerseyNumber =
        Number(player.jerseyNumber);

      const hasValidNumber =
        Number.isInteger(jerseyNumber) &&
        jerseyNumber >= 1 &&
        jerseyNumber <= 99;

      const numberIsAvailable =
        hasValidNumber &&
        !usedNumbers.has(jerseyNumber);

      if (numberIsAvailable) {
        player.jerseyNumber =
          jerseyNumber;

        usedNumbers.add(
          jerseyNumber
        );

        return;
      }

      /*
       * Missing, invalid, or duplicate numbers are the only
       * ones that should be reassigned.
       */
      player.jerseyNumber = null;

      playersNeedingNumbers.push(
        player
      );
    });

    const availableNumbers =
      Array.from(
        {
          length: 99,
        },
        (_, index) => index + 1
      )
        .filter(
          number =>
            !usedNumbers.has(number)
        );

    /*
     * Randomize only the unused-number pool.
     * Once assigned and saved, these numbers will be
     * preserved during every later load.
     */
    for (
      let index =
        availableNumbers.length - 1;

      index > 0;

      index--
    ) {
      const swapIndex =
        Math.floor(
          Math.random() *
          (index + 1)
        );

      [
        availableNumbers[index],
        availableNumbers[swapIndex],
      ] = [
        availableNumbers[swapIndex],
        availableNumbers[index],
      ];
    }

    playersNeedingNumbers
      .forEach((player, index) => {
        player.jerseyNumber =
          availableNumbers[index] ||
          null;
      });

    return roster;
  }
  function generateTeamRoster(team) {
    const usedNames = new Set();

    const roster = ROSTER_POSITION_SLOTS.map(slot => {
      let player;
      let fullName;
      let attempts = 0;

      do {
        player = createGeneratedPlayer(slot);
        fullName = `${player.firstName} ${player.lastName}`;
        attempts++;
      } while (usedNames.has(fullName) && attempts < 50);

      usedNames.add(fullName);

      const roll = Math.random();

      if (roll < 0.12) {
        player.year = 'Senior';
        player.age = Math.random() < 0.5 ? 17 : 18;
        player.overall += 8;
      } else if (roll < 0.38) {
        player.year = 'Junior';
        player.age = Math.random() < 0.5 ? 16 : 17;
        player.overall += 5;
      } else if (roll < 0.68) {
        player.year = 'Sophomore';
        player.age = Math.random() < 0.5 ? 15 : 16;
        player.overall += 2;
      } else {
        player.year = 'Freshman';
        player.age = Math.random() < 0.75 ? 14 : 15;
      }

      player.overall = Math.min(82, player.overall);
      player.potential = Math.max(
        player.overall,
        Math.min(99, player.potential)
      );
      // Stronger and older players begin with more established reputations.
      let reputationBonus = 0;

      if (player.overall >= 78) reputationBonus += 30;
      else if (player.overall >= 74) reputationBonus += 20;
      else if (player.overall >= 70) reputationBonus += 10;

      if (player.year === 'Senior') reputationBonus += 10;
      else if (player.year === 'Junior') reputationBonus += 6;
      else if (player.year === 'Sophomore') reputationBonus += 3;

      player.reputationPoints = Math.min(
        100,
        player.reputationPoints + reputationBonus
      );

      if (player.reputationPoints >= 85) {
        player.reputationStars = 4;
      } else if (player.reputationPoints >= 60) {
        player.reputationStars = 3;
      } else if (player.reputationPoints >= 30) {
        player.reputationStars = 2;
      } else {
        player.reputationStars = 1;
      }
      player.teamId = team.teamId;
      player.schoolName = team.schoolName;
      player.teamName = team.teamName;

      return player;
    });

    const skaters = roster.filter(player => player.position !== 'G');

    skaters
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3)
      .forEach((player, index) => {
        if (index === 0) player.captain = true;
        if (index === 1 || index === 2) player.alternateCaptain = true;
      });

    return assignUniqueJerseyNumbers(roster);
  }

  function ensureGeneratedRosters() {
    const teams = WorldEngine.state.teams || [];

    teams.forEach(team => {
      const seedTeam = SEED_TEAMS.find(
        seed => seed.teamId === team.teamId
      );

      // Add newer static team data to older saved worlds.
      if (seedTeam) {
        if (!team.coach && seedTeam.coach) {
          team.coach = { ...seedTeam.coach };
        }

        if (
          team.coach &&
          seedTeam.coach?.deploymentPreferences &&
          (
            !team.coach.deploymentPreferences ||
            typeof team.coach.deploymentPreferences !== 'object'
          )
        ) {
          team.coach.deploymentPreferences = {
            ...seedTeam.coach.deploymentPreferences
          };
        }

        if (!team.arena && seedTeam.arena) {
          team.arena = { ...seedTeam.arena };
        }
      }

      // Generate a roster only when one does not already exist.
      if (!Array.isArray(team.roster) || team.roster.length !== 20) {
        team.roster = generateTeamRoster(team);
      }

      /*
       * Migrate every team to the permanent special-teams
       * deployment structure without overwriting assignments
       * that already exist.
       */
      if (
        !team.specialTeams ||
        typeof team.specialTeams !== 'object'
      ) {
        team.specialTeams =
          createEmptySpecialTeamsUnits();
      }

      if (
        !Array.isArray(team.specialTeams.powerPlay)
      ) {
        team.specialTeams.powerPlay =
          createEmptySpecialTeamsUnits().powerPlay;
      }

      if (
        !Array.isArray(team.specialTeams.penaltyKill)
      ) {
        team.specialTeams.penaltyKill =
          createEmptySpecialTeamsUnits().penaltyKill;
      }
      // Migrate older saved roster players that were created before attributes existed.
      team.roster.forEach(player => {
        if (!player.archetype) {
          const archetypes =
            PLAYER_ARCHETYPES[player.position] || ['Balanced'];

          player.archetype =
            archetypes[Math.floor(Math.random() * archetypes.length)];
        }

        const normalizedPosition =
          normalizeAttributePosition(
            player.position
          );

        const isGoalie =
          normalizedPosition === 'G';

        const hasGoalieAttributes =
          player.attributes &&
          GOALIE_ATTRIBUTE_KEYS.every(
            key =>
              typeof player.attributes[key] ===
              'number'
          );

        if (
          isGoalie &&
          !hasGoalieAttributes
        ) {
          /*
           * One-time migration for saved goalies that still
           * contain the older skater attribute schema.
           *
           * Their existing overall becomes the generation target,
           * preserving their approximate ability while replacing
           * irrelevant shooting/faceoff ratings with goalie skills.
           */
          player.attributes =
            createGoalieAttributesFromOverall(
              Number(player.overall) || 60,
              player.archetype || 'Hybrid Goalie'
            );

          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel = 'goalie-v1';
        } else if (
          !isGoalie &&
          !player.attributes
        ) {
          player.attributes =
            createAttributesFromOverall(
              Number(player.overall) || 60,
              player.position,
              player.archetype
            );

          player.overall =
            calculateOverallFromAttributes(
              player.attributes,
              player.position
            );

          player.attributeModel = 'skater-v1';
        } else if (
          isGoalie &&
          hasGoalieAttributes
        ) {
          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel =
            player.attributeModel || 'goalie-v1';
        } else {
          player.attributeModel =
            player.attributeModel || 'skater-v1';
        }
        // Migrate older saved players created before NHL-style potentials existed.
        if (!player.potentialRole) {
          player.potentialRole = getPotentialRole(
            player.position,
            Math.min(99, Number(player.potential) || Number(player.overall) || 75)
          );
        }

        if (!player.potentialAccuracy) {
          player.potentialAccuracy = generatePotentialAccuracy();
        }

        /*
         * Migrate every existing saved player into the permanent
         * Player Contract without replacing current attributes,
         * statistics, identity, roster role, or progression data.
         */
        ensureCanonicalPlayerContract(player);
      });
      assignUniqueJerseyNumbers(team.roster);

      /*
       * Run the permanent roster and deployment engine for
       * every team—not only the career player's team.
       *
       * This sorts NPCs by overall within their positions,
       * sets the stronger goalie as starter, and fills
       * PP1, PP2, PK1, and PK2.
       *
       * Save once after the league-wide migration rather
       * than once for every individual team.
       */
      refreshTeamRosterManagement(
        team.teamId,
        {
          save: false,
        }
      );
    });

    save();
    
    if (
      !Array.isArray(WorldEngine.state.schedule) ||
      WorldEngine.state.schedule.length === 0
    ) {
      WorldEngine.syncSeedTeamMetadata();

      WorldEngine.state.schedule =
        WorldEngine.createHighSchoolCareerSchedule(
          WorldEngine.state.teams
        );
    }

    WorldEngine.save();
  }
  // ── Seed news headlines ─────────────────────────────────────
  // Stored newest-first. Future simulation systems add real
  // headlines via WorldEngine.news.publish({ date, tag, headline }).
  const SEED_NEWS = [
    { date: '2022-09-04', tag: 'Tryouts',  headline: 'Freshman tryouts begin this week across all programs.' },
    { date: '2022-09-02', tag: 'Schedule', headline: 'League releases official preseason schedule.' },
    { date: '2022-09-01', tag: 'Scouting', headline: 'Scouts expected at upcoming showcase events this fall.' },
    { date: '2022-08-30', tag: 'Roster',   headline: 'Coaches begin finalizing preseason rosters.' },
    { date: '2022-08-28', tag: 'Rankings', headline: 'Preseason rankings set to be announced soon.' },
  ];

  // ── Default world state ─────────────────────────────────────
  // This is the authoritative shape. All fields must be present
  // here so future load() merges can fill gaps from old saves.
  function syncSeedTeamMetadata() {
    const seedTeamsById = new Map(
      SEED_TEAMS.map(team => [team.teamId, team])
    );

    _state.teams = (_state.teams || []).map(team => {
      const seedTeam = seedTeamsById.get(team.teamId);

      if (!seedTeam) {
        return team;
      }

      return {
        ...team,

        schoolName: seedTeam.schoolName,
        teamName: seedTeam.teamName,
        abbreviation:
          seedTeam.abbreviation ||
          team.abbreviation,

        primaryColor: seedTeam.primaryColor,
        secondaryColor: seedTeam.secondaryColor,
        prestige: seedTeam.prestige,
        identity: seedTeam.identity,

        coach: {
          ...team.coach,
          ...seedTeam.coach,
        },

        arena: {
          ...team.arena,
          ...seedTeam.arena,
        },
      };
    });

    return _state.teams;
  }
  const HIGH_SCHOOL_RIVALRIES = [
    [
      'team-summit-academy',
      'team-oakridge',
    ],
    [
      'team-iron-peak',
      'team-granite-falls',
    ],
    [
      'team-north-ridge',
      'team-lakeview',
    ],
    [
      'team-cedar-valley',
      'team-westbrook',
    ],
  ];

  function isHighSchoolRivalry(
    firstTeamId,
    secondTeamId
  ) {
    return HIGH_SCHOOL_RIVALRIES.some(
      ([rivalA, rivalB]) =>
        (
          rivalA === firstTeamId &&
          rivalB === secondTeamId
        ) ||
        (
          rivalA === secondTeamId &&
          rivalB === firstTeamId
        )
    );
  }
  function getHighSchoolScoutAttendance({
    homeTeam,
    awayTeam,
    cycle,
    round,
    matchupIndex,
  }) {
    const homePrestige =
      Number(homeTeam?.prestige) || 1;

    const awayPrestige =
      Number(awayTeam?.prestige) || 1;

    const combinedPrestige =
      homePrestige + awayPrestige;

    /*
     * Deterministic seed:
     * The same schedule structure always produces the same
     * scout-attendance pattern instead of changing randomly
     * whenever the game reloads.
     */
    const scheduleSeed =
      (
        (cycle + 1) * 17 +
        (round + 1) * 11 +
        (matchupIndex + 1) * 7 +
        combinedPrestige * 5
      ) % 100;

    let scoutChance = 12;

    // Stronger programs naturally attract more attention.
    if (combinedPrestige >= 9) {
      scoutChance += 20;
    } else if (combinedPrestige >= 7) {
      scoutChance += 12;
    } else if (combinedPrestige >= 5) {
      scoutChance += 5;
    }

    // Attention rises as the season progresses.
    if (cycle === 1) {
      scoutChance += 5;
    } else if (cycle === 2) {
      scoutChance += 10;
    } else if (cycle === 3) {
      scoutChance += 16;
    }

    if (scheduleSeed >= scoutChance) {
      return 0;
    }

    // Bigger matchups can attract multiple scouts.
    if (
      combinedPrestige >= 9 &&
      scheduleSeed < 12
    ) {
      return 3;
    }

    if (
      combinedPrestige >= 7 &&
      scheduleSeed < 20
    ) {
      return 2;
    }

    return 1;
  }
  function getGameOfWeekMatchupIndex(
    matchups,
    cycle,
    round
  ) {
    if (!Array.isArray(matchups) || matchups.length === 0) {
      return -1;
    }

    let bestIndex = 0;
    let bestScore = -Infinity;

    matchups.forEach((matchup, matchupIndex) => {
      const firstPrestige =
        Number(matchup.firstTeam?.prestige) || 1;

      const secondPrestige =
        Number(matchup.secondTeam?.prestige) || 1;

      const combinedPrestige =
        firstPrestige + secondPrestige;

      const prestigeGap =
        Math.abs(firstPrestige - secondPrestige);

      /*
       * Strong programs raise the score.
       * Closely matched programs receive a bonus.
       * The small deterministic value breaks ties without randomness.
       */
      const tieBreaker =
        (
          (cycle + 1) * 13 +
          (round + 1) * 7 +
          (matchupIndex + 1) * 3
        ) % 10;

      const matchupScore =
        combinedPrestige * 10 -
        prestigeGap * 4 +
        tieBreaker;

      if (matchupScore > bestScore) {
        bestScore = matchupScore;
        bestIndex = matchupIndex;
      }
    });

    return bestIndex;
  }
  function createHighSchoolSchedule(teams) {
    const games = [];

    const gameDates = [
      '2026-09-18',
      '2026-09-25',
      '2026-10-02',
      '2026-10-09',
      '2026-10-16',
      '2026-10-23',
      '2026-11-06',
      '2026-11-13',
      '2026-11-20',
      '2026-11-27',
      '2026-12-04',
      '2026-12-11',
      '2027-01-08',
      '2027-01-15',
      '2027-01-22',
      '2027-01-29',
      '2027-02-05',
      '2027-02-12',
      '2027-02-19',
      '2027-02-26',
      '2027-03-05',
      '2027-03-12',
      '2027-03-19',
      '2027-03-26',
      '2027-04-02',
      '2027-04-09',
      '2027-04-16',
      '2027-04-23',
    ];

    if (!Array.isArray(teams) || teams.length < 2) {
      return games;
    }

    /*
     * Build one seven-round circle-method rotation.
     * With eight teams, every team faces every opponent once
     * during each seven-game cycle.
     */
    const rotation = [...teams];
    const rounds = [];

    for (let round = 0; round < teams.length - 1; round++) {
      const matchups = [];

      for (
        let matchup = 0;
        matchup < rotation.length / 2;
        matchup++
      ) {
        const firstTeam = rotation[matchup];
        const secondTeam =
          rotation[rotation.length - 1 - matchup];

        matchups.push({
          firstTeam,
          secondTeam,
        });
      }

      rounds.push(matchups);

      /*
       * Keep the first team fixed and rotate every other team.
       */
      const fixedTeam = rotation[0];
      const rotatingTeams = rotation.slice(1);

      rotatingTeams.unshift(rotatingTeams.pop());

      rotation.splice(
        0,
        rotation.length,
        fixedTeam,
        ...rotatingTeams
      );
    }

    /*
     * Repeat the full round robin four times.
     * Cycles 1 and 3 use the original home/away assignment.
     * Cycles 2 and 4 reverse it.
     *
     * Result:
     * - 28 games per team
     * - Four games against every opponent
     * - Two home and two away against every opponent
     */
    for (let cycle = 0; cycle < 4; cycle++) {
      const reverseHomeAway = cycle % 2 === 1;

      for (let round = 0; round < rounds.length; round++) {
        const scheduleIndex =
          cycle * rounds.length + round;

        const date = gameDates[scheduleIndex];

        const isSeasonOpener =
          scheduleIndex === 0;

        const isSeasonFinale =
          scheduleIndex === gameDates.length - 1;

        const isMilestone =
          isSeasonOpener ||
          isSeasonFinale;

        const milestoneType =
          isSeasonOpener
            ? 'season-opener'
            : isSeasonFinale
              ? 'season-finale'
              : '';

        const gameOfWeekMatchupIndex =
          getGameOfWeekMatchupIndex(
            rounds[round],
            cycle,
            round
          );

        rounds[round].forEach((matchup, matchupIndex) => {
          const homeTeam = reverseHomeAway
            ? matchup.secondTeam
            : matchup.firstTeam;

          const awayTeam = reverseHomeAway
            ? matchup.firstTeam
            : matchup.secondTeam;

          const isRivalry = isHighSchoolRivalry(
            homeTeam.teamId,
            awayTeam.teamId
          );

          const isGameOfWeek =
            matchupIndex === gameOfWeekMatchupIndex;

          const scoutsAttending =
            getHighSchoolScoutAttendance({
              homeTeam,
              awayTeam,
              cycle,
              round,
              matchupIndex,
            });

          const featuredReasons = [];

          if (isSeasonOpener) {
            featuredReasons.push(
              'Opening night marks the beginning of the regular season.'
            );

            featuredReasons.push(
              'A strong start can establish early momentum, coach trust, and reputation.'
            );
          }

          if (isSeasonFinale) {
            featuredReasons.push(
              'The final game of the regular season could carry major standings implications.'
            );

            featuredReasons.push(
              'A strong finish can influence playoff positioning and how the season is remembered.'
            );
          }

          if (isGameOfWeek) {
            featuredReasons.push(
              'Selected as the league’s Game of the Week.'
            );

            featuredReasons.push(
              'The featured matchup brings increased attention and a stronger opportunity to build reputation.'
            );
          }

          if (isRivalry) {
            featuredReasons.push(
              `${homeTeam.schoolName} and ${awayTeam.schoolName} renew their rivalry.`
            );

            featuredReasons.push(
              'Rivalry games carry added pressure and can have a major impact on coach trust and reputation.'
            );
          }

          if (scoutsAttending > 0) {
            featuredReasons.push(
              scoutsAttending === 1
                ? 'One junior scout is expected to attend.'
                : `${scoutsAttending} junior scouts are expected to attend.`
            );

            featuredReasons.push(
              scoutsAttending >= 3
                ? 'A standout performance could significantly increase your scouting attention.'
                : 'A strong performance could improve your scouting attention.'
            );
          }

          games.push({
            id: `hs-game-c${cycle + 1}-r${round + 1}-m${matchupIndex + 1}`,
            date,

            homeTeamId: homeTeam.teamId,
            awayTeamId: awayTeam.teamId,

            isMilestone,
            milestoneType,

            isSeasonOpener,
            isSeasonFinale,

            isGameOfWeek,

            isFeatured:
              isGameOfWeek,

            isRivalry,

            scoutsAttending,

            hasScouts:
              scoutsAttending > 0,

            featuredReasons,

            played: false,
            homeScore: null,
            awayScore: null,
          });
        });
      }
    }

    return games;
  }
  function buildDefaults() {
    return {
      // Identity
      id:      'default',
      version: '0.0.1',

      // ── Time ─────────────────────────────────────────────────
      // currentDate is the in-game calendar date.
      // Stored as { year, month, day } so arithmetic is simple.
      currentDate: { year: 2022, month: 9, day: 4 },

      // Human-readable season label (e.g. '2022-23')
      currentSeason: '2022-23',

      // Week number within the current season (1-indexed)
      currentWeek: 1,

      // Calendar year matching currentDate.year
      currentYear: 2022,

      // ── League ───────────────────────────────────────────────
      league: {
        name: 'Midwest Youth Hockey League',
        // Future fields: divisions, tiers, numTeams, etc.
      },

      // ── World collections ────────────────────────────────────
      // teams: seeded with the eight programs for the 2022-23 season.
      // All other collections remain empty until future systems
      // populate them and call WorldEngine.save() to persist.
      teams: SEED_TEAMS.map(t => ({ ...t, roster: [] })),

      players:          [],   // { id, name, position, teamId, … }
      schedule: createHighSchoolCareerSchedule(
        SEED_TEAMS.map(team => ({ ...team }))
      ),   // Games, practices, recovery, and future career events
      standings:        [],   // { teamId, wins, losses, points, … }
      prospectRankings: [],   // { rank, playerId, … }

      // ── News ─────────────────────────────────────────────────
      // Managed via WorldEngine.news — not written directly.
      // Stored here so it persists with the world save.
      newsItems: SEED_NEWS.map(item => ({ ...item })),
    };
  }

  // ── Internal mutable state ──────────────────────────────────
  let _state = buildDefaults();

  /*
   * New worlds receive the same permanent Season Engine
   * contract as migrated saved worlds.
   */
  ensureCanonicalSeasonState(
    _state
  );

  // ── News subsystem ──────────────────────────────────────────
  // Exposes the same API surface as the old NewsSystem IIFE so
  // game.js can alias it: const NewsSystem = WorldEngine.news;
  //
  // Dependency inversion: game.js registers renderHubNews via
  // WorldEngine.news.onNewsChange() so this file never touches
  // the DOM or references any game.js symbol.

  let _onNewsChange = null;

  const news = {
    /**
     * Register a callback invoked after every publish().
     * Called once by game.js after renderHubNews is defined.
     * @param {Function} cb
     */
    onNewsChange(cb) {
      _onNewsChange = cb;
    },

    /**
     * Add a headline to the top of the feed and notify listeners.
     * @param {{ date: string, tag: string, headline: string }} item
     */
    publish({ date, tag, headline }) {
      _state.newsItems.unshift({ date, tag, headline });
      if (typeof _onNewsChange === 'function') _onNewsChange();
    },

    /**
     * Return the n most recent headlines (default 3).
     * @param {number} n
     * @returns {{ date: string, tag: string, headline: string }[]}
     */
    getRecent(n = 3) {
      return _state.newsItems.slice(0, n);
    },
  };

  // ── Persistence ─────────────────────────────────────────────
  // World state is persisted separately from the player save.
  // Call save() after any simulation step that mutates _state.
  // Call load() in init(); if no stored world exists it silently
  // falls back to defaults.

  async function save() {
    const worldSnapshot =
      structuredClone(_state);

    /*
     * Primary save: IndexedDB.
     */
    try {
      const database =
        await openWorldDatabase();

      await new Promise(
        (resolve, reject) => {
          const transaction =
            database.transaction(
              WORLD_STORE_NAME,
              'readwrite'
            );

          const store =
            transaction.objectStore(
              WORLD_STORE_NAME
            );

          store.put({
            id:
              WORLD_RECORD_ID,

            savedAt:
              new Date()
                .toISOString(),

            world:
              worldSnapshot,
          });

          transaction.oncomplete =
            () => {
              resolve();
            };

          transaction.onerror =
            () => {
              reject(
                transaction.error ||
                new Error(
                  'Project Ice world save transaction failed.'
                )
              );
            };

          transaction.onabort =
            () => {
              reject(
                transaction.error ||
                new Error(
                  'Project Ice world save transaction was aborted.'
                )
              );
            };
        }
      );

      database.close();
    } catch (error) {
      console.error(
        '[WorldEngine] IndexedDB save failed:',
        error
      );

      return false;
    }


    return true;
  }

  /**
   * Load a persisted world. Merges stored data over defaults so
   * missing fields from older save versions are back-filled.
   * @returns {boolean} true if a stored world was found and loaded.
   */
  async function load() {
    /*
     * ============================================================
     * PRIMARY LOAD — INDEXEDDB
     * ============================================================
     */
    try {
      const database =
        await openWorldDatabase();

      const storedRecord =
        await new Promise(
          (resolve, reject) => {
            const transaction =
              database.transaction(
                WORLD_STORE_NAME,
                'readonly'
              );

            const store =
              transaction.objectStore(
                WORLD_STORE_NAME
              );

            const request =
              store.get(
                WORLD_RECORD_ID
              );

            request.onsuccess =
              () => {
                resolve(
                  request.result ||
                  null
                );
              };

            request.onerror =
              () => {
                reject(
                  request.error ||
                  new Error(
                    'Project Ice IndexedDB world load failed.'
                  )
                );
              };
          }
        );

      database.close();

      if (
        storedRecord?.world &&
        typeof storedRecord.world ===
          'object'
      ) {
        _state = {
          ...buildDefaults(),
          ...storedRecord.world,
        };

        if (
          !Array.isArray(
            _state.newsItems
          ) ||
          _state.newsItems.length === 0
        ) {
          _state.newsItems =
            SEED_NEWS.map(
              item => ({
                ...item,
              })
            );
        }

        ensureCanonicalSeasonState(
          _state
        );

        /*
         * IndexedDB is now authoritative.
         * Remove the obsolete giant localStorage world so it cannot
         * consume the browser quota needed by the small career preview.
         */
        localStorage.removeItem(
          WORLD_KEY
        );

        return true;
      }
    } catch (error) {
      console.warn(
        '[WorldEngine] IndexedDB load unavailable, trying legacy localStorage:',
        error
      );
    }

    /*
     * ============================================================
     * LEGACY MIGRATION — LOCALSTORAGE
     * ============================================================
     *
     * If IndexedDB does not have a world yet, import the existing
     * localStorage world once so current careers are preserved.
     */
    try {
      const stored =
        localStorage.getItem(
          WORLD_KEY
        );

      if (!stored) {
        return false;
      }

      const parsed =
        JSON.parse(stored);

      _state = {
        ...buildDefaults(),
        ...parsed,
      };

      if (
        !Array.isArray(
          _state.newsItems
        ) ||
        _state.newsItems.length === 0
      ) {
        _state.newsItems =
          SEED_NEWS.map(
            item => ({
              ...item,
            })
          );
      }

      ensureCanonicalSeasonState(
        _state
      );

      /*
       * Immediately migrate the legacy world into IndexedDB.
       */
      await save();

      /*
       * Migration succeeded. The old localStorage world is no longer
       * needed and was the source of our quota problem.
       */
      localStorage.removeItem(
        WORLD_KEY
      );

      return true;
    } catch (error) {
      console.error(
        '[WorldEngine] Load failed:',
        error
      );

      return false;
    }
  }

  /** Reset to defaults and wipe the stored world. */
  function reset() {
    _state = buildDefaults();

    ensureCanonicalSeasonState(
      _state
    );

    if (!_state.player) {
      _state.player = {};
    }

    _state.player.currentDate = '2026-09-01';

    localStorage.removeItem(WORLD_KEY);
    save();
  }
  function setCurrentDate(
    dateString,
    options = {}
  ) {
    if (
      typeof dateString !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateString
      )
    ) {
      console.warn(
        `[WorldEngine] Invalid date: ${dateString}`
      );

      return null;
    }

    const parsedDate =
      new Date(
        `${dateString}T12:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      console.warn(
        `[WorldEngine] Unusable date: ${dateString}`
      );

      return null;
    }

    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    /*
     * The Season Engine is the permanent source of truth.
     */
    _state.season.currentDate =
      dateString;

    const calculatedWeek =
      getSeasonWeekForDate(
        dateString,
        _state.season.seasonStartYear
      );

    _state.season.currentWeek =
      calculatedWeek;

    /*
     * Compatibility fields remain synchronized while
     * existing Schedule and Hub code are migrated.
     */
    _state.currentDate =
      dateString;

    _state.currentYear =
      Number(
        dateString.slice(0, 4)
      );

    _state.currentWeek =
      calculatedWeek;

    if (
      !_state.player ||
      typeof _state.player !== 'object'
    ) {
      _state.player = {};
    }

    _state.player.currentDate =
      dateString;

    /*
     * Keep the canonical roster version of the career player
     * synchronized with the Season Engine. game.js renders from
     * this player through syncCareerPlayerWithWorld().
     */
    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (careerPlayer) {
      careerPlayer.currentDate =
        dateString;
    }

    if (options.save !== false) {
      save();
    }

    return dateString;
  }

  function advanceDay(
    options = {}
  ) {
    const currentDate =
      _state.season?.currentDate ||
      _state.player?.currentDate ||
      _state.currentDate;

    if (
      typeof currentDate !== 'string'
    ) {
      console.warn(
        '[WorldEngine] Cannot advance an invalid current date.'
      );

      return null;
    }

    const nextDate =
      new Date(
        `${currentDate}T12:00:00`
      );

    if (
      Number.isNaN(
        nextDate.getTime()
      )
    ) {
      console.warn(
        `[WorldEngine] Cannot advance date: ${currentDate}`
      );

      return null;
    }

    nextDate.setDate(
      nextDate.getDate() + 1
    );

    const nextDateString = [
      nextDate.getFullYear(),

      String(
        nextDate.getMonth() + 1
      ).padStart(2, '0'),

      String(
        nextDate.getDate()
      ).padStart(2, '0'),
    ].join('-');

    return setCurrentDate(
      nextDateString,
      options
    );
  }

  function buildSimulationSummary({
    daysAdvanced = 0,
    dateProcessingResults = [],
    crossedWeeks = [],
    weeklyProcessingResults = [],
  }) {

    const summary = {
      daysAdvanced,

      processedDates:
        dateProcessingResults.length,

      totalEvents: 0,

      completedEvents: 0,

      pendingEvents: 0,

      eventTypes: {},

      crossedWeeks,

      weeklyProcessingResults,
    };

    dateProcessingResults.forEach(
      day => {

        (day.eventResults || []).forEach(
          event => {

            summary.totalEvents += 1;

            if (event.resolved) {
              summary.completedEvents += 1;
            } else {
              summary.pendingEvents += 1;
            }

            summary.eventTypes[
              event.type
            ] =
              (summary.eventTypes[
                event.type
              ] || 0) + 1;
          }
        );

      }
    );

    return summary;
  }

  function advanceToDate(
    targetDate,
    options = {}
  ) {
    const currentDate =
      _state.season?.currentDate ||
      _state.player?.currentDate ||
      _state.currentDate;

    const startingWeek =
      Math.max(
        1,
        Number(
          _state.season?.currentWeek ??
          _state.currentWeek
        ) || 1
      );

    if (
      typeof targetDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        targetDate
      )
    ) {
      console.warn(
        `[WorldEngine] Invalid target date: ${targetDate}`
      );

      return {
        success: false,
        currentDate,
        targetDate,
        daysAdvanced: 0,
        crossedWeeks: [],
        dateProcessingResults: [],
        reason: 'invalid-target-date',
      };
    }

    if (
      typeof currentDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        currentDate
      )
    ) {
      console.warn(
        '[WorldEngine] Cannot advance from an invalid current date.'
      );

      return {
        success: false,
        currentDate,
        targetDate,
        daysAdvanced: 0,
        crossedWeeks: [],
        dateProcessingResults: [],
        reason: 'invalid-current-date',
      };
    }

    if (targetDate < currentDate) {
      return {
        success: false,

        currentDate,
        targetDate,

        daysAdvanced: 0,

        crossedWeeks: [],

        dateProcessingResults: [],

        reason:
          'target-before-current-date',
      };
    }

    /*
     * ROADMAP 6 — SAME-DAY CAREER GAME SIM
     *
     * Normally advancing to the current date is a no-op.
     *
     * Pregame Sim Game is the one exception: the calendar has
     * already arrived on game day and the career game was held
     * unresolved while waiting for the user's Play/Sim choice.
     */
    if (
      targetDate === currentDate
    ) {
      if (
        options
          ?.processCurrentDate !==
        true
      ) {
        return {
          success: true,

          currentDate,
          targetDate,

          daysAdvanced: 0,

          crossedWeeks: [],

          dateProcessingResults: [],

          reason:
            'already-current-date',
        };
      }

      const currentDateResult =
        processSeasonDate(
          currentDate,
          options
        );

      return {
        success:
          currentDateResult
            ?.success !== false,

        currentDate,
        targetDate,

        daysAdvanced: 0,

        crossedWeeks: [],

        dateProcessingResults: [
          currentDateResult,
        ],

        stopSimulation:
          currentDateResult
            ?.stopSimulation === true,

        blockingEventResult:
          currentDateResult
            ?.stopSimulation === true
            ? currentDateResult
            : null,

        reason:
          'current-date-processed',
      };
    }

    let nextDate =
      currentDate;

    let daysAdvanced = 0;

    const dateProcessingResults = [];

    let blockingDateResult = null;

    /*
     * Safety guard prevents a malformed request from
     * advancing through an unlimited number of days.
     */
    const maximumDays =
      Math.max(
        1,
        Number(options.maximumDays) ||
        730
      );

    while (
      nextDate < targetDate &&
      daysAdvanced < maximumDays
    ) {
      const advancedDate =
        advanceDay({
          save: false,
        });

      if (!advancedDate) {
        break;
      }

      nextDate =
        advancedDate;

      const dateProcessingResult =
        processSeasonDate(
          advancedDate,
          {
            save: false,
          }
        );

      dateProcessingResults.push(
        dateProcessingResult
      );

      daysAdvanced += 1;

      if (
        dateProcessingResult
          ?.stopSimulation === true
      ) {
        blockingDateResult =
          dateProcessingResult;

        break;
      }
    }

    const reachedTarget =
      nextDate === targetDate;

    const endingWeek =
      Math.max(
        1,
        Number(
          _state.season?.currentWeek ??
          _state.currentWeek
        ) || startingWeek
      );

    const crossedWeeks = [];

    if (endingWeek > startingWeek) {
      for (
        let week =
          startingWeek + 1;

        week <= endingWeek;

        week++
      ) {
        crossedWeeks.push(week);
      }
    }

    /*
     * Entering a new week completes the previous week.
     * Every weekly system will eventually run through this
     * coordinator exactly once.
     */
    const weeklyProcessingResults =
      processCrossedSeasonWeeks(
        crossedWeeks,
        {
          save: false,
        }
      );

    const simulationSummary =
      buildSimulationSummary({
        daysAdvanced,
        dateProcessingResults,
        crossedWeeks,
        weeklyProcessingResults,
      });

    if (
      options.save !== false &&
      daysAdvanced > 0
    ) {
      save();
    }

    return {
      success:
      reachedTarget &&
      !blockingDateResult,

      currentDate:
        nextDate,

      targetDate,

      daysAdvanced,

      dateProcessingResults,

      crossedWeeks,

      weeklyProcessingResults,

      simulationSummary,

      stopSimulation:
        Boolean(blockingDateResult),

      blockingDateResult,

      blockingEventResult:
        blockingDateResult
          ?.blockingEventResult ||
        null,

      reason:
      blockingDateResult
        ? 'player-interaction-required'
        : reachedTarget
          ? 'target-reached'
          : daysAdvanced >= maximumDays
            ? 'maximum-days-reached'
            : 'advance-failed',
    };
  }
  
  // ── Canonical team and player accessors ─────────────────────
  // ── Roster Management Engine ────────────────────────────────

  function getOrderedRosterSlotsForPosition(position) {
    const normalizedPosition =
      normalizeCareerPosition(position);

    const slotsByPosition = {
      LW: [
        'fwd-1-lw',
        'fwd-2-lw',
        'fwd-3-lw',
        'fwd-4-lw',
      ],

      C: [
        'fwd-1-c',
        'fwd-2-c',
        'fwd-3-c',
        'fwd-4-c',
      ],

      RW: [
        'fwd-1-rw',
        'fwd-2-rw',
        'fwd-3-rw',
        'fwd-4-rw',
      ],

      LD: [
        'def-1-ld',
        'def-2-ld',
        'def-3-ld',
      ],

      RD: [
        'def-1-rd',
        'def-2-rd',
        'def-3-rd',
      ],

      G: [
        'g-starter',
        'g-backup',
      ],
    };

    return [
      ...(slotsByPosition[normalizedPosition] || []),
    ];
  }

  // ── Player Deployment Engine ────────────────────────────────
  // These calculations are internal coaching tools.
  // They must never be displayed as public player ratings.

  function calculateHiddenWeightedRating(
    attributes = {},
    weights = {}
  ) {
    const entries =
      Object.entries(weights);

    if (entries.length === 0) {
      return 50;
    }

    let totalValue = 0;
    let totalWeight = 0;

    entries.forEach(([attributeKey, weight]) => {
      const safeWeight =
        Math.max(
          0,
          Number(weight) || 0
        );

      if (safeWeight === 0) {
        return;
      }

      const attributeValue =
        Math.max(
          25,
          Math.min(
            99,
            Number(attributes[attributeKey]) || 50
          )
        );

      totalValue +=
        attributeValue * safeWeight;

      totalWeight += safeWeight;
    });

    if (totalWeight === 0) {
      return 50;
    }

    return Number(
      (
        totalValue /
        totalWeight
      ).toFixed(2)
    );
  }

  function evaluateEvenStrengthDeployment(
    player = {}
  ) {
    const position =
      normalizeCareerPosition(
        player.position
      );

    const attributes =
      player.attributes || {};

    /*
     * Goalies are evaluated separately.
     * Returning null prevents goalie ratings from being
     * accidentally compared with skater deployment scores.
     */
    if (position === 'G') {
      return null;
    }

    let weights = {};

    if (position === 'C') {
      weights = {
        passing: 1.25,
        puckControl: 1.15,
        offensiveAwareness: 1.20,
        defensiveAwareness: 1.10,
        faceoffs: 1.15,
        speed: 0.90,
        acceleration: 0.90,
        discipline: 0.75,
        poise: 0.85,
      };
    } else if (
      position === 'LW' ||
      position === 'RW'
    ) {
      weights = {
        wristShotAccuracy: 1.20,
        wristShotPower: 1.00,
        puckControl: 1.10,
        offensiveAwareness: 1.20,
        passing: 0.90,
        speed: 1.05,
        acceleration: 1.00,
        defensiveAwareness: 0.70,
        poise: 0.80,
      };
    } else if (
      position === 'LD' ||
      position === 'RD'
    ) {
      weights = {
        defensiveAwareness: 1.30,
        stickChecking: 1.20,
        shotBlocking: 1.05,
        passing: 1.00,
        puckControl: 0.75,
        slapShotPower: 0.70,
        strength: 0.90,
        agility: 0.85,
        discipline: 0.85,
        poise: 0.90,
      };
    }

    return calculateHiddenWeightedRating(
      attributes,
      weights
    );
  }

  function evaluatePowerPlayDeployment(
    player = {}
  ) {
    const position =
      normalizeCareerPosition(
        player.position
      );

    const attributes =
      player.attributes || {};

    /*
     * Goalies do not receive skater power-play roles.
     */
    if (position === 'G') {
      return null;
    }

    let weights = {};

    if (position === 'C') {
      weights = {
        passing: 1.40,
        puckControl: 1.30,
        offensiveAwareness: 1.40,
        wristShotAccuracy: 1.05,
        handEye: 1.00,
        faceoffs: 0.85,
        deking: 0.95,
        poise: 1.00,
      };
    } else if (
      position === 'LW' ||
      position === 'RW'
    ) {
      weights = {
        wristShotAccuracy: 1.40,
        wristShotPower: 1.20,
        slapShotAccuracy: 1.00,
        puckControl: 1.25,
        offensiveAwareness: 1.35,
        passing: 1.05,
        deking: 1.05,
        handEye: 1.00,
        poise: 0.95,
      };
    } else if (
      position === 'LD' ||
      position === 'RD'
    ) {
      weights = {
        passing: 1.35,
        puckControl: 1.15,
        offensiveAwareness: 1.25,
        slapShotPower: 1.20,
        slapShotAccuracy: 1.10,
        poise: 1.00,
        puckTracking: 0,
      };
    }

    return calculateHiddenWeightedRating(
      attributes,
      weights
    );
  }

  function evaluatePenaltyKillDeployment(
    player = {}
  ) {
    const position =
      normalizeCareerPosition(
        player.position
      );

    const attributes =
      player.attributes || {};

    /*
     * Goalies are evaluated separately.
     */
    if (position === 'G') {
      return null;
    }

    let weights = {};

    if (position === 'C') {
      weights = {
        defensiveAwareness: 1.45,
        stickChecking: 1.30,
        shotBlocking: 1.05,
        faceoffs: 1.25,
        discipline: 1.25,
        speed: 0.95,
        acceleration: 0.95,
        endurance: 0.85,
        poise: 0.90,
      };
    } else if (
      position === 'LW' ||
      position === 'RW'
    ) {
      weights = {
        defensiveAwareness: 1.40,
        stickChecking: 1.30,
        shotBlocking: 1.00,
        discipline: 1.25,
        speed: 1.00,
        acceleration: 1.00,
        endurance: 0.90,
        strength: 0.75,
        poise: 0.85,
      };
    } else if (
      position === 'LD' ||
      position === 'RD'
    ) {
      weights = {
        defensiveAwareness: 1.50,
        stickChecking: 1.40,
        shotBlocking: 1.35,
        discipline: 1.20,
        strength: 1.00,
        positioning: 0,
        agility: 0.85,
        endurance: 0.85,
        poise: 0.90,
      };
    }

    return calculateHiddenWeightedRating(
      attributes,
      weights
    );
  }

  function evaluateGoalieDeployment(
    player = {}
  ) {
    const position =
      normalizeCareerPosition(
        player.position
      );

    if (position !== 'G') {
      return null;
    }

    const attributes =
      player.attributes || {};

    return calculateHiddenWeightedRating(
      attributes,
      {
        positioning: 1.45,
        reflexes: 1.40,
        puckTracking: 1.35,
        reboundControl: 1.30,
        consistency: 1.25,
        anticipation: 1.20,
        lateralMovement: 1.15,
        composure: 1.15,
        angles: 1.10,
        recoverySpeed: 1.00,
      }
    );
  }

  function getHiddenPlayerDeploymentProfile(
    player = {}
  ) {
    const position =
      normalizeCareerPosition(
        player.position
      );

    if (position === 'G') {
      return {
        playerId:
          player.playerId ||
          player.id ||
          null,

        position: 'G',

        goalie:
          evaluateGoalieDeployment(player),
      };
    }

    return {
      playerId:
        player.playerId ||
        player.id ||
        null,

      position,

      evenStrength:
        evaluateEvenStrengthDeployment(player),

      powerPlay:
        evaluatePowerPlayDeployment(player),

      penaltyKill:
        evaluatePenaltyKillDeployment(player),
    };
  }

  // ── Coach Decision Engine ───────────────────────────────────
  // These preferences influence internal deployment decisions.
  // They are not public coach ratings and should not be shown
  // numerically anywhere in the game.

  function getCoachDeploymentPreferences(
    coach = {}
  ) {
    const preferences =
      coach.deploymentPreferences &&
      typeof coach.deploymentPreferences === 'object'
        ? coach.deploymentPreferences
        : {};

    return {
      /*
       * How strongly this coach values each source of
       * information when making deployment decisions.
       */
      abilityWeight:
        Number(preferences.abilityWeight) || 1,

      coachTrustWeight:
        Number(preferences.coachTrustWeight) || 0.16,

      recentFormWeight:
        Number(preferences.recentFormWeight) || 0.12,

      disciplineWeight:
        Number(preferences.disciplineWeight) || 0.08,

      developmentWeight:
        Number(preferences.developmentWeight) || 0.06,

      roleStabilityWeight:
        Number(preferences.roleStabilityWeight) || 0.08,

      /*
       * Role-specific coach emphasis.
       * A value above 1 increases emphasis; below 1 reduces it.
       */
      evenStrengthEmphasis:
        Number(preferences.evenStrengthEmphasis) || 1,

      powerPlayEmphasis:
        Number(preferences.powerPlayEmphasis) || 1,

      penaltyKillEmphasis:
        Number(preferences.penaltyKillEmphasis) || 1,

      goalieEmphasis:
        Number(preferences.goalieEmphasis) || 1,

      /*
       * Philosophy flags used later for tie-breaking and
       * coach explanations.
       */
      favorsOffense:
        Boolean(preferences.favorsOffense),

      favorsDefense:
        Boolean(preferences.favorsDefense),

      favorsVeterans:
        Boolean(preferences.favorsVeterans),

      favorsDevelopment:
        Boolean(preferences.favorsDevelopment),
    };
  }

  function evaluateCoachDeploymentDecision(
    player = {},
    coach = {},
    role = 'evenStrength'
  ) {
    const profile =
      getHiddenPlayerDeploymentProfile(
        player
      );

    if (!profile) {
      return null;
    }

    const preferences =
      getCoachDeploymentPreferences(
        coach
      );

    const validRoles = [
      'evenStrength',
      'powerPlay',
      'penaltyKill',
      'goalie',
    ];

    if (!validRoles.includes(role)) {
      return null;
    }

    const rawAbility =
      Number(profile[role]);

    if (!Number.isFinite(rawAbility)) {
      return null;
    }

    const emphasisByRole = {
      evenStrength:
        preferences.evenStrengthEmphasis,

      powerPlay:
        preferences.powerPlayEmphasis,

      penaltyKill:
        preferences.penaltyKillEmphasis,

      goalie:
        preferences.goalieEmphasis,
    };

    const roleEmphasis =
      Number(emphasisByRole[role]) || 1;

    const coachTrust =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.coachTrust) || 50
        )
      );

    const recentForm =
      Math.max(
        0,
        Math.min(
          100,
          Number(player.recentForm) || 50
        )
      );

    const discipline =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            player.attributes?.discipline
          ) || 50
        )
      );

    const developmentReadiness =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            player.development?.readiness ??
            player.developmentReadiness
          ) || 50
        )
      );

    /*
     * Stability is deliberately modest. It helps coaches
     * avoid unnecessary lineup changes without allowing an
     * established role to overpower ability and performance.
     */
    const hasEstablishedRole =
      player.lineupStatus === 'active' &&
      player.lineupAssignment;

    const roleStability =
      hasEstablishedRole
        ? 60
        : 50;

    let decisionScore =
      rawAbility *
      preferences.abilityWeight *
      roleEmphasis;

    decisionScore +=
      (coachTrust - 50) *
      preferences.coachTrustWeight;

    decisionScore +=
      (recentForm - 50) *
      preferences.recentFormWeight;

    decisionScore +=
      (discipline - 50) *
      preferences.disciplineWeight;

    decisionScore +=
      (developmentReadiness - 50) *
      preferences.developmentWeight;

    decisionScore +=
      (roleStability - 50) *
      preferences.roleStabilityWeight;

    /*
     * Offensive and defensive philosophies create small,
     * role-specific adjustments rather than overriding the
     * player's actual hockey attributes.
     */
    if (
      preferences.favorsOffense &&
      role === 'powerPlay'
    ) {
      decisionScore += 2;
    }

    if (
      preferences.favorsDefense &&
      role === 'penaltyKill'
    ) {
      decisionScore += 2;
    }

    if (
      preferences.favorsDevelopment &&
      developmentReadiness > 60
    ) {
      decisionScore += 1.5;
    }

    return Number(
      decisionScore.toFixed(2)
    );
  }

  function rankTeamPlayersForRole(
    team = {},
    role = 'evenStrength',
    filterFn = null
  ) {
    const roster =
      Array.isArray(team.roster)
        ? team.roster
        : [];

    const coach =
      team.coach || {};

    return roster
      .filter(player => {
        if (
          typeof filterFn === 'function' &&
          !filterFn(player)
        ) {
          return false;
        }

        /*
         * Injured or unavailable players cannot receive
         * active deployment assignments.
         */
        if (
          player.injured ||
          player.lineupStatus === 'unavailable'
        ) {
          return false;
        }

        return true;
      })
      .map(player => {
        const decisionScore =
          evaluateCoachDeploymentDecision(
            player,
            coach,
            role
          );

        return {
          player,
          decisionScore,
        };
      })
      .filter(entry =>
        Number.isFinite(
          entry.decisionScore
        )
      )
      .sort((a, b) => {
        const scoreDifference =
          b.decisionScore -
          a.decisionScore;

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        /*
         * Overall is only a deterministic tiebreaker.
         * The hidden coach decision score remains the
         * primary deployment measure.
         */
        const overallDifference =
          (Number(b.player.overall) || 0) -
          (Number(a.player.overall) || 0);

        if (overallDifference !== 0) {
          return overallDifference;
        }

        const firstName =
          `${a.player.firstName || ''} ${a.player.lastName || ''}`;

        const secondName =
          `${b.player.firstName || ''} ${b.player.lastName || ''}`;

        return firstName.localeCompare(
          secondName
        );
      });
  }

  function assignPowerPlayUnits(team = {}) {
    if (
      !team.specialTeams ||
      !Array.isArray(
        team.specialTeams.powerPlay
      )
    ) {
      return;
    }

    const getPlayerId = player =>
      player.playerId ||
      player.id ||
      null;

    const rankedForwards =
      rankTeamPlayersForRole(
        team,
        'powerPlay',
        player => {
          const position =
            normalizeCareerPosition(
              player.position
            );

          return (
            position === 'LW' ||
            position === 'C' ||
            position === 'RW'
          );
        }
      );

    const rankedDefensemen =
      rankTeamPlayersForRole(
        team,
        'powerPlay',
        player => {
          const position =
            normalizeCareerPosition(
              player.position
            );

          return (
            position === 'LD' ||
            position === 'RD'
          );
        }
      );

    const selectedForwardIds =
      new Set();

    const selectedDefenseIds =
      new Set();

    team.specialTeams.powerPlay
      .slice(0, 2)
      .forEach((unit, unitIndex) => {
        const availableForwards =
          rankedForwards.filter(entry => {
            const playerId =
              getPlayerId(entry.player);

            return (
              playerId &&
              !selectedForwardIds.has(
                String(playerId)
              )
            );
          });

        const availableDefensemen =
          rankedDefensemen.filter(entry => {
            const playerId =
              getPlayerId(entry.player);

            return (
              playerId &&
              !selectedDefenseIds.has(
                String(playerId)
              )
            );
          });

        const unitForwards =
          availableForwards.slice(0, 4);

        const unitDefenseman =
          availableDefensemen[0] || null;

        unitForwards.forEach(entry => {
          const playerId =
            getPlayerId(entry.player);

          if (playerId) {
            selectedForwardIds.add(
              String(playerId)
            );
          }
        });

        if (unitDefenseman) {
          const playerId =
            getPlayerId(
              unitDefenseman.player
            );

          if (playerId) {
            selectedDefenseIds.add(
              String(playerId)
            );
          }
        }

        const centers =
          unitForwards.filter(entry =>
            normalizeCareerPosition(
              entry.player.position
            ) === 'C'
          );

        const wingers =
          unitForwards.filter(entry => {
            const position =
              normalizeCareerPosition(
                entry.player.position
              );

            return (
              position === 'LW' ||
              position === 'RW'
            );
          });

        const bumper =
          centers[0] ||
          unitForwards[0] ||
          null;

        const remainingForwards =
          unitForwards.filter(
            entry => entry !== bumper
          );

        const leftFlank =
          wingers.find(entry =>
            normalizeCareerPosition(
              entry.player.position
            ) === 'LW'
          ) ||
          remainingForwards[0] ||
          null;

        const rightFlank =
          wingers.find(entry =>
            entry !== leftFlank &&
            normalizeCareerPosition(
              entry.player.position
            ) === 'RW'
          ) ||
          remainingForwards.find(
            entry => entry !== leftFlank
          ) ||
          null;

        const netFront =
          remainingForwards.find(
            entry =>
              entry !== leftFlank &&
              entry !== rightFlank
          ) ||
          null;

        unit.unit = unitIndex + 1;

        unit.slots = {
          leftFlank:
            leftFlank
              ? getPlayerId(
                  leftFlank.player
                )
              : null,

          bumper:
            bumper
              ? getPlayerId(
                  bumper.player
                )
              : null,

          rightFlank:
            rightFlank
              ? getPlayerId(
                  rightFlank.player
                )
              : null,

          netFront:
            netFront
              ? getPlayerId(
                  netFront.player
                )
              : null,

          quarterback:
            unitDefenseman
              ? getPlayerId(
                  unitDefenseman.player
                )
              : null,
        };
      });
  }

  function assignPenaltyKillUnits(team = {}) {
    if (
      !team.specialTeams ||
      !Array.isArray(
        team.specialTeams.penaltyKill
      )
    ) {
      return;
    }

    const getPlayerId = player =>
      player.playerId ||
      player.id ||
      null;

    const rankedForwards =
      rankTeamPlayersForRole(
        team,
        'penaltyKill',
        player => {
          const position =
            normalizeCareerPosition(
              player.position
            );

          return (
            position === 'LW' ||
            position === 'C' ||
            position === 'RW'
          );
        }
      );

    const rankedDefensemen =
      rankTeamPlayersForRole(
        team,
        'penaltyKill',
        player => {
          const position =
            normalizeCareerPosition(
              player.position
            );

          return (
            position === 'LD' ||
            position === 'RD'
          );
        }
      );

    const selectedForwardIds =
      new Set();

    const selectedDefenseIds =
      new Set();

    team.specialTeams.penaltyKill
      .slice(0, 2)
      .forEach((unit, unitIndex) => {
        const availableForwards =
          rankedForwards.filter(entry => {
            const playerId =
              getPlayerId(entry.player);

            return (
              playerId &&
              !selectedForwardIds.has(
                String(playerId)
              )
            );
          });

        const availableDefensemen =
          rankedDefensemen.filter(entry => {
            const playerId =
              getPlayerId(entry.player);

            return (
              playerId &&
              !selectedDefenseIds.has(
                String(playerId)
              )
            );
          });

        const unitForwards =
          availableForwards.slice(0, 2);

        const unitDefensemen =
          availableDefensemen.slice(0, 2);

        unitForwards.forEach(entry => {
          const playerId =
            getPlayerId(entry.player);

          if (playerId) {
            selectedForwardIds.add(
              String(playerId)
            );
          }
        });

        unitDefensemen.forEach(entry => {
          const playerId =
            getPlayerId(entry.player);

          if (playerId) {
            selectedDefenseIds.add(
              String(playerId)
            );
          }
        });

        const naturalCenter =
          unitForwards.find(entry =>
            normalizeCareerPosition(
              entry.player.position
            ) === 'C'
          );

        const forward1 =
          naturalCenter ||
          unitForwards[0] ||
          null;

        const forward2 =
          unitForwards.find(
            entry => entry !== forward1
          ) ||
          null;

        const naturalLeftDefense =
          unitDefensemen.find(entry =>
            normalizeCareerPosition(
              entry.player.position
            ) === 'LD'
          );

        const defense1 =
          naturalLeftDefense ||
          unitDefensemen[0] ||
          null;

        const defense2 =
          unitDefensemen.find(
            entry => entry !== defense1
          ) ||
          null;

        unit.unit = unitIndex + 1;

        unit.slots = {
          forward1:
            forward1
              ? getPlayerId(
                  forward1.player
                )
              : null,

          forward2:
            forward2
              ? getPlayerId(
                  forward2.player
                )
              : null,

          defense1:
            defense1
              ? getPlayerId(
                  defense1.player
                )
              : null,

          defense2:
            defense2
              ? getPlayerId(
                  defense2.player
                )
              : null,
        };
      });
  }

  function assignSpecialTeamsUnits(team = {}) {
    if (!team || !Array.isArray(team.roster)) {
      return null;
    }

    if (
      !team.specialTeams ||
      typeof team.specialTeams !== 'object'
    ) {
      team.specialTeams =
        createEmptySpecialTeamsUnits();
    }

    if (
      !Array.isArray(
        team.specialTeams.powerPlay
      )
    ) {
      team.specialTeams.powerPlay =
        createEmptySpecialTeamsUnits()
          .powerPlay;
    }

    if (
      !Array.isArray(
        team.specialTeams.penaltyKill
      )
    ) {
      team.specialTeams.penaltyKill =
        createEmptySpecialTeamsUnits()
          .penaltyKill;
    }

    assignPowerPlayUnits(team);
    assignPenaltyKillUnits(team);

    return team.specialTeams;
  }

  function createEmptySpecialTeamsUnits() {
    return {
      powerPlay: [
        {
          unit: 1,

          slots: {
            leftFlank: null,
            bumper: null,
            rightFlank: null,
            netFront: null,
            quarterback: null,
          },
        },

        {
          unit: 2,

          slots: {
            leftFlank: null,
            bumper: null,
            rightFlank: null,
            netFront: null,
            quarterback: null,
          },
        },
      ],

      penaltyKill: [
        {
          unit: 1,

          slots: {
            forward1: null,
            forward2: null,
            defense1: null,
            defense2: null,
          },
        },

        {
          unit: 2,

          slots: {
            forward1: null,
            forward2: null,
            defense1: null,
            defense2: null,
          },
        },
      ],
    };
  }

  function assignNpcRosterSlots(team) {
    if (!team || !Array.isArray(team.roster)) {
      return;
    }

    const roster = team.roster;

    const positions = [
      'LW',
      'C',
      'RW',
      'LD',
      'RD',
      'G',
    ];

    positions.forEach(position => {
      const slots =
        getOrderedRosterSlotsForPosition(position);

      const careerPlayers = roster.filter(player =>
        player.isCareerPlayer &&
        normalizeCareerPosition(player.position) === position
      );

      const reservedSlots = new Set(
        careerPlayers
          .map(player => player.rosterSlot)
          .filter(Boolean)
      );

      const availableSlots =
        slots.filter(slot => !reservedSlots.has(slot));

      const npcPlayers = roster
        .filter(player =>
          !player.isCareerPlayer &&
          normalizeCareerPosition(player.position) === position
        )
        .sort(
          (a, b) =>
            (b.overall || 0) -
            (a.overall || 0)
        );

      npcPlayers.forEach((player, index) => {
        const slot =
          availableSlots[index];

        if (!slot) {
          return;
        }

        player.rosterSlot = slot;
      });
    });
  }

  function refreshTeamRosterManagement(
    teamId,
    options = {}
  ) {
    const team = getTeamById(teamId);

    if (!team || !Array.isArray(team.roster)) {
      console.warn(
        `[WorldEngine] Cannot refresh roster management for team: ${teamId}`
      );

      return null;
    }

    /*
     * Every team permanently owns its deployment units.
     * Only create the structure when it does not already exist,
     * so future coach assignments survive roster refreshes.
     */
    if (
      !team.specialTeams ||
      typeof team.specialTeams !== 'object'
    ) {
      team.specialTeams =
        createEmptySpecialTeamsUnits();
    }

    if (
      !Array.isArray(team.specialTeams.powerPlay)
    ) {
      team.specialTeams.powerPlay =
        createEmptySpecialTeamsUnits().powerPlay;
    }

    if (
      !Array.isArray(team.specialTeams.penaltyKill)
    ) {
      team.specialTeams.penaltyKill =
        createEmptySpecialTeamsUnits().penaltyKill;
    }

    /*
     * Career-player placement remains reserved.
     * NPC players are reordered by overall into the
     * highest available slots for their positions.
     */
    assignNpcRosterSlots(team);

    team.roster.forEach(player => {
      const slot =
        player.rosterSlot ||
        player.slot ||
        null;

      if (!slot) {
        player.lineupStatus = 'unassigned';
        player.lineupAssignment = null;
        return;
      }

      let lineupAssignment = null;

      const forwardMatch =
        slot.match(
          /^fwd-(\d+)-(lw|c|rw)$/
        );

      const defenseMatch =
        slot.match(
          /^def-(\d+)-(ld|rd)$/
        );

      if (forwardMatch) {
        const line =
          Number(forwardMatch[1]);

        const position =
          forwardMatch[2].toUpperCase();

        lineupAssignment = {
          unit: 'forward',
          line,
          position,
          role: `Line ${line} ${position}`,
          status: 'active',
        };
      } else if (defenseMatch) {
        const pair =
          Number(defenseMatch[1]);

        const position =
          defenseMatch[2].toUpperCase();

        lineupAssignment = {
          unit: 'defense',
          pair,
          position,
          role: `Pair ${pair} ${position}`,
          status: 'active',
        };
      } else if (
        slot === 'g-starter' ||
        slot === 'g-backup'
      ) {
        const goalieRole =
          slot === 'g-starter'
            ? 'Starter'
            : 'Backup';

        lineupAssignment = {
          unit: 'goalie',
          goalieRole,
          position: 'G',
          role: goalieRole,
          status: 'active',
        };
      }

      player.lineupAssignment =
        lineupAssignment;

      player.lineupStatus =
        lineupAssignment
          ? 'active'
          : 'unassigned';
    });

    /*
     * Rebuild the coach-selected PP and PK deployments
     * after the canonical roster and even-strength lineup
     * have been refreshed.
     *
     * Hidden evaluation scores are discarded. Only the
     * selected player IDs remain on team.specialTeams.
     */
    assignSpecialTeamsUnits(team);

    if (options.save !== false) {
      save();
    }

    return team;
  }

  function getTeamById(teamId) {
    if (!teamId) return null;

    const teams =
      Array.isArray(_state.teams)
        ? _state.teams
        : [];

    return (
      teams.find(
        team =>
          String(team.teamId) ===
          String(teamId)
      ) || null
    );
  }

  function getTeamRoster(teamId) {
    const team = getTeamById(teamId);

    return team && Array.isArray(team.roster)
      ? team.roster
      : [];
  }

  function getPlayerById(playerId) {
    if (!playerId) return null;

    const teams =
      Array.isArray(_state.teams)
        ? _state.teams
        : [];

    for (const team of teams) {
      const roster =
        Array.isArray(team.roster)
          ? team.roster
          : [];

      const player = roster.find(
        rosterPlayer =>
          String(
            rosterPlayer.playerId ||
            rosterPlayer.id
          ) === String(playerId)
      );

      if (player) {
        return player;
      }
    }

    return null;
  }
  function normalizeCareerPosition(position) {
    const rawPosition =
      String(position || 'C')
        .trim()
        .toUpperCase();

    if (
      rawPosition === 'C' ||
      rawPosition.includes('CENTER')
    ) {
      return 'C';
    }

    if (
      rawPosition === 'LW' ||
      rawPosition.includes('LEFT WING')
    ) {
      return 'LW';
    }

    if (
      rawPosition === 'RW' ||
      rawPosition.includes('RIGHT WING')
    ) {
      return 'RW';
    }

    if (
      rawPosition === 'RD' ||
      rawPosition.includes('RIGHT DEFENSE')
    ) {
      return 'RD';
    }

    if (
      rawPosition === 'D' ||
      rawPosition === 'LD' ||
      rawPosition.includes('DEFENSE')
    ) {
      return 'LD';
    }

    if (
      rawPosition === 'G' ||
      rawPosition.includes('GOAL')
    ) {
      return 'G';
    }

    return 'C';
  }

  function createInitialCareerLineupAssignment(
    playerData = {}
  ) {
    const position =
      normalizeCareerPosition(
        playerData.position
      );

    const rawStartingLine =
      String(
        playerData.startingLine || ''
      );

    const lineMatch =
      rawStartingLine.match(/\d+/);

    const requestedLine =
      lineMatch
        ? Number(lineMatch[0])
        : null;

    let rosterSlot = null;
    let lineupAssignment = null;

    if (
      position === 'C' ||
      position === 'LW' ||
      position === 'RW'
    ) {
      const line =
        Math.max(
          1,
          Math.min(
            4,
            requestedLine || 4
          )
        );

      const slotPosition =
        position.toLowerCase();

      rosterSlot =
        `fwd-${line}-${slotPosition}`;

      lineupAssignment = {
        unit: 'forward',
        line,
        position,
        role: `Line ${line} ${position}`,
        status: 'active',
      };
    } else if (
      position === 'LD' ||
      position === 'RD'
    ) {
      const pair =
        Math.max(
          1,
          Math.min(
            3,
            requestedLine || 3
          )
        );

      const slotPosition =
        position.toLowerCase();

      rosterSlot =
        `def-${pair}-${slotPosition}`;

      lineupAssignment = {
        unit: 'defense',
        pair,
        position,
        role: `Pair ${pair} ${position}`,
        status: 'active',
      };
    } else if (position === 'G') {
      const goalieRole =
        requestedLine === 1
          ? 'Starter'
          : 'Backup';

      rosterSlot =
        goalieRole === 'Starter'
          ? 'g-starter'
          : 'g-backup';

      lineupAssignment = {
        unit: 'goalie',
        goalieRole,
        position: 'G',
        role: goalieRole,
        status: 'active',
      };
    }

    return {
      rosterSlot,
      lineupAssignment,
      lineupStatus:
        lineupAssignment
          ? 'active'
          : 'unassigned',
    };
  }

  function getCareerTryoutTargetOverall(
    tryoutScore
  ) {
    const score = Math.max(
      0,
      Math.min(
        100,
        Number(tryoutScore) || 0
      )
    );

    /*
     * Freshman starting range:
     * weakest results begin around 60 OVR,
     * exceptional results can reach 68 OVR.
     *
     * This is only the attribute-generation target.
     * Final overall must still be calculated from attributes.
     */
    if (score >= 97) return 68;
    if (score >= 93) return 67;
    if (score >= 88) return 66;
    if (score >= 82) return 65;
    if (score >= 75) return 64;
    if (score >= 68) return 63;
    if (score >= 60) return 62;
    if (score >= 50) return 61;

    return 60;
  }

  function createCareerAttributesFromTryouts(
    playerData = {}
  ) {
    const results =
      playerData.tryoutResults || {};

    const skatingScore =
      Number(results.skating?.score) || 0;

    const puckControlScore =
      Number(results.puckControl?.score) || 0;

    const scrimmageScore =
      Number(results.scrimmage?.score) || 0;

    const overallTryoutScore =
      Number(playerData.overallTryoutScore) ||
      Math.round(
        (
          skatingScore +
          puckControlScore +
          scrimmageScore
        ) / 3
      ) ||
      0;

    const targetOverall =
      getCareerTryoutTargetOverall(
        overallTryoutScore
      );

    const position =
      normalizeCareerPosition(
        playerData.position
      );

    const archetype =
      playerData.archetype ||
      'Balanced';

    /*
     * Begin with the same attribute-generation foundation
     * used by generated World Engine players.
     */
    const attributes =
      createAttributesFromOverall(
        targetOverall,
        position,
        archetype
      );

    function getDrillAdjustment(
      drillScore
    ) {
      const difference =
        Number(drillScore) -
        overallTryoutScore;

      return Math.max(
        -5,
        Math.min(
          5,
          Math.round(difference / 5)
        )
      );
    }

    const skatingAdjustment =
      getDrillAdjustment(skatingScore);

    const puckAdjustment =
      getDrillAdjustment(puckControlScore);

    const scrimmageAdjustment =
      getDrillAdjustment(scrimmageScore);

    const adjustKeys = (
      keys,
      adjustment
    ) => {
      keys.forEach(key => {
        if (
          typeof attributes[key] !==
          'number'
        ) {
          return;
        }

        attributes[key] =
          clampAttribute(
            attributes[key] +
            adjustment
          );
      });
    };

    adjustKeys(
      [
        'speed',
        'acceleration',
        'agility',
        'balance',
        'endurance',
      ],
      skatingAdjustment
    );

    adjustKeys(
      [
        'passing',
        'puckControl',
        'deking',
        'handEye',
        'wristShotAccuracy',
      ],
      puckAdjustment
    );

    adjustKeys(
      [
        'offensiveAwareness',
        'defensiveAwareness',
        'poise',
        'discipline',
        'stickChecking',
        'shotBlocking',
      ],
      scrimmageAdjustment
    );

    /*
     * Normalize the finished attribute set back toward the
     * intended 60–68 starting band while preserving the
     * strengths and weaknesses created by each drill.
     */
    let calculatedOverall =
      calculateOverallFromAttributes(
        attributes,
        position
      );

    let normalizationDifference =
      targetOverall -
      calculatedOverall;

    if (normalizationDifference !== 0) {
      PLAYER_ATTRIBUTE_KEYS.forEach(key => {
        attributes[key] =
          clampAttribute(
            attributes[key] +
            normalizationDifference
          );
      });
    }

    calculatedOverall =
      calculateOverallFromAttributes(
        attributes,
        position
      );

    return {
      attributes,
      overall: calculatedOverall,
      targetOverall,

      tryoutProfile: {
        overallScore:
          overallTryoutScore,

        skatingScore,
        puckControlScore,
        scrimmageScore,

        skatingAdjustment,
        puckAdjustment,
        scrimmageAdjustment,
      },
    };
  }

  function upsertCareerPlayer(playerData = {}) {
    const careerPlayerId =
      playerData.playerId ||
      playerData.id ||
      'career-player';

    const teamId =
      playerData.teamId ||
      playerData.highSchoolTeamId ||
      null;

    if (!teamId) {
      console.warn(
        '[WorldEngine] Cannot add career player without a teamId.'
      );

      return null;
    }

    const targetTeam = getTeamById(teamId);

    if (!targetTeam) {
      console.warn(
        `[WorldEngine] Career player team not found: ${teamId}`
      );

      return null;
    }

    /*
     * Ensure only one canonical career-player record exists
     * anywhere in the world.
     */
    _state.teams.forEach(team => {
      if (!Array.isArray(team.roster)) {
        team.roster = [];
        return;
      }

      team.roster = team.roster.filter(player => {
        const playerId =
          player.playerId ||
          player.id ||
          '';

        return (
          String(playerId) !==
          String(careerPlayerId)
        );
      });
    });

    const position =
      normalizeCareerPosition(
        playerData.position
      );

    const tryoutAbility =
      createCareerAttributesFromTryouts(
        playerData
      );

    const attributes =
      playerData.attributes &&
      Object.keys(playerData.attributes).length > 0
        ? {
            ...playerData.attributes,
          }
        : tryoutAbility.attributes;

    const overall =
      calculateOverallFromAttributes(
        attributes,
        position
      );

    const initialLineup =
      createInitialCareerLineupAssignment(
        playerData
      );

    const careerPlayer = {
      ...playerData,

      id: careerPlayerId,
      playerId: careerPlayerId,

      firstName:
        playerData.firstName || '',

      lastName:
        playerData.lastName || '',

      teamId:
        targetTeam.teamId,

      schoolName:
        targetTeam.schoolName,

      teamName:
        targetTeam.teamName,

      position,

      attributes,
      overall,

      tryoutProfile:
        playerData.tryoutProfile ||
        tryoutAbility.tryoutProfile,

      startingOverall:
        Number(playerData.startingOverall) ||
        overall,

      isCareerPlayer: true,

      /*
       * The permanent lineup engine will assign these fields.
       * We intentionally do not hard-code third-line center here.
       */
      rosterSlot:
        playerData.rosterSlot ||
        initialLineup.rosterSlot,

      lineupAssignment:
        playerData.lineupAssignment ||
        initialLineup.lineupAssignment,

      lineupStatus:
        playerData.lineupStatus ||
        initialLineup.lineupStatus,

      coachTrust:
        Number(playerData.coachTrust) || 50,

      recentForm:
        Number(playerData.recentForm) || 50,

      morale:
        Number(playerData.morale) || 50,

      injured:
        Boolean(playerData.injured),

      injury:
        playerData.injury || null,

      reputationStars:
        Number(playerData.reputationStars) || 1,

      reputationPoints:
        Number(playerData.reputationPoints) || 0,

      gamesPlayed:
        Number(playerData.gamesPlayed) || 0,

      goals:
        Number(playerData.goals) || 0,

      assists:
        Number(playerData.assists) || 0,

      points:
        Number(playerData.points) || 0,

      plusMinus:
        Number(playerData.plusMinus) || 0,

      penaltyMinutes:
        Number(playerData.penaltyMinutes) || 0,

      shots:
        Number(playerData.shots) || 0,

      seasonStats: {
        ...(playerData.seasonStats || {}),
      },

      careerStats: {
        ...(playerData.careerStats || {}),
      },

      development: {
        ...(playerData.development || {}),
      },

      health: {
        ...(playerData.health || {}),
      },

      scoutingProfile: {
        ...(playerData.scoutingProfile || {}),
      },

      history: {
        ...(
          playerData.history &&
          !Array.isArray(playerData.history)
            ? playerData.history
            : {}
        ),
      },

      gameLog:
        Array.isArray(playerData.gameLog)
          ? [...playerData.gameLog]
          : [],

      accomplishments:
        Array.isArray(playerData.accomplishments)
          ? [...playerData.accomplishments]
          : [],

      specialTeamsAssignments: {
        powerPlay: Array.isArray(
          playerData
            .specialTeamsAssignments
            ?.powerPlay
        )
          ? [
              ...playerData
                .specialTeamsAssignments
                .powerPlay,
            ]
          : [],

        penaltyKill: Array.isArray(
          playerData
            .specialTeamsAssignments
            ?.penaltyKill
        )
          ? [
              ...playerData
                .specialTeamsAssignments
                .penaltyKill,
            ]
          : [],
      },
    };

    ensureCanonicalPlayerContract(
      careerPlayer
    );

    /*
     * The generated roster begins with 20 players.
     * The career player takes the lineup slot earned at tryouts,
     * replacing the generated placeholder in that slot so the
     * official team roster remains at 20 players.
     */
    const assignedRosterSlot =
      careerPlayer.rosterSlot ||
      careerPlayer.lineupAssignment?.rosterSlot ||
      null;

    if (assignedRosterSlot) {
      targetTeam.roster =
        targetTeam.roster.filter(player => {
          const playerSlot =
            player.rosterSlot ||
            player.slot ||
            null;

          return (
            String(playerSlot) !==
            String(assignedRosterSlot)
          );
        });
    }

    targetTeam.roster.push(careerPlayer);

    /*
     * Reorganize every NPC by overall after the career
     * player claims the lineup slot earned at tryouts.
     *
     * The career player's slot remains reserved.
     */
    refreshTeamRosterManagement(
      targetTeam.teamId
    );

    return careerPlayer;
  }

  // ── Public API ───────────────────────────────────────────────

  return {
    /**
     * Direct read access to world state.
     * Future simulation code reads _state.teams, _state.schedule, etc.
     * Do not mutate _state.newsItems directly — use news.publish().
     */
    get state() { return _state; },

    /** The storage key, exposed so game.js can reference it if needed. */
    WORLD_KEY,

    news,
    save,
    load,
    ensureGeneratedRosters,
    getOrderedRosterSlotsForPosition,
    createEmptySpecialTeamsUnits,
    assignNpcRosterSlots,
    refreshTeamRosterManagement,
    getTeamById,
    getTeamRoster,
    getPlayerById,
    getCareerTryoutTargetOverall,
    createGoalieAttributesFromOverall,
    calculateGoalieOverallFromAttributes,
    getAttributeUpgradeCost,
    canUpgradePlayerAttribute,
    upgradePlayerAttribute,
    createLiveGameSimulationState,
    finalizeLiveGameSimulation,
    getLiveGameOnIcePlayers,
    selectLiveGameEvenStrengthDeployment,
    selectLiveGameOvertimeDeployment,
    resolveLiveGameShootout,
    scheduleNextLiveGameEventTime,
    selectNextLiveGameEventType,
    resolveLiveGameFaceoff,
    resolveLiveGamePossessionAdvance,
    resolveLiveGameShotAttempt,
    resolveLiveGameHit,
    resolveLiveGameTurnover,
    resolveLiveGamePenalty,
    advanceLiveGameSpecialTeamsClock,
    advanceLiveGameStep,
    resolveLiveGameToFinalResult,
    runLiveGameSimulationDiagnostic,
    runLiveGameCompetitiveBalanceDiagnostic,
    runLiveGameStrengthGradientDiagnostic,
    getLiveGameTeamSimulationProfile,
    runLiveGameAttributeIsolationDiagnostic,
    createCareerAttributesFromTryouts,
    upsertCareerPlayer,
    repairCompletedGameDevelopment,
    reset,
    syncSeedTeamMetadata,
    getTrainingTypes() {
      return structuredClone(
        HIGH_SCHOOL_TRAINING_TYPES
      );
    },
    createHighSchoolSchedule,
    createHighSchoolCareerSchedule,
    completePracticeEvent,
    completeTrainingEvent,
    completeRecoveryEvent,
    completeCoachMeetingEvent,
    setCurrentDate,
    advanceDay,
    advanceToDate,
  };

})();
