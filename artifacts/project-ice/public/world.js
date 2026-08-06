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

      if (
        !isPracticeDay &&
        !isRecoveryDay
      ) {
        continue;
      }

      const eventType =
        isPracticeDay
          ? EVENT_TYPES.PRACTICE
          : EVENT_TYPES.RECOVERY;

      const definitions =
        isPracticeDay
          ? HIGH_SCHOOL_PRACTICE_TYPES
          : HIGH_SCHOOL_RECOVERY_TYPES;

      const definition =
        pickStableHighSchoolEvent(
          definitions,
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
          EVENT_TYPES.PRACTICE,

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
     * Future weekly systems will plug in here:
     *
     * - NPC development
     * - Coach lineup reviews
     * - PP and PK reassignment
     * - Prospect rankings
     * - Award races
     * - Scouting updates
     * - Dynamic objectives
     * - League news
     *
     * For now, this coordinator only records that the
     * completed week has been processed successfully.
     */

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
      week: safeCompletedWeek,
      reason: 'week-processed',
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

      gamesPlayed:
        0,

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
     * Base cost rises sharply as an attribute approaches
     * elite levels.
     */
    let baseCost = 60;

    if (currentRating < 60) {
      baseCost =
        55 +
        (
          currentRating - 50
        ) * 2;
    } else if (currentRating < 70) {
      baseCost =
        80 +
        (
          currentRating - 60
        ) * 4;
    } else if (currentRating < 80) {
      baseCost =
        120 +
        (
          currentRating - 70
        ) * 7;
    } else if (currentRating < 90) {
      baseCost =
        190 +
        (
          currentRating - 80
        ) * 12;
    } else {
      baseCost =
        310 +
        (
          currentRating - 90
        ) * 20;
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
      40,
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

        if (
          !player ||
          player.isCareerPlayer !== true
        ) {
          continue;
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

    /*
     * Use a simulator-provided rating whenever one exists.
     * The canonical game-line contract reserves gameRating,
     * but the fallback below keeps progression functional
     * before a dedicated rating generator is installed.
     */
    const suppliedGameRating =
      Number(
        gameLine.gameRating
      );

    if (
      Number.isFinite(
        suppliedGameRating
      )
    ) {
      const normalizedRating =
        suppliedGameRating <= 10
          ? suppliedGameRating * 10
          : suppliedGameRating;

      const score =
        Math.round(
          clamp(
            normalizedRating,
            0,
            100
          )
        );

      return {
        success: true,

        scored: true,

        reason:
          'simulated-game-rating-used',

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
          suppliedGameRating,
          normalizedRating,
        },
      };
    }

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
    const baseXP =
      isGoalie
        ? 10
        : 8;

    const performanceXP =
      Math.max(
        0,
        Math.round(
          (
            score - 40
          ) * 0.45
        )
      );

    const winXP =
      performance.teamWon === true
        ? 3
        : 0;

    const totalXP =
      clamp(
        baseXP +
          performanceXP +
          winXP,
        5,
        40
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
    } else if (
      normalizedPosition === 'LD' ||
      normalizedPosition === 'RD'
    ) {
      /*
       * Defensemen receive a balanced mix of defensive reads,
       * puck movement, skating and physical positioning.
       */
      addAttributeXP(
        'defensiveAwareness',
        totalXP * 0.28
      );

      addAttributeXP(
        'stickChecking',
        totalXP * 0.24
      );

      addAttributeXP(
        'passing',
        totalXP * 0.24
      );

      addAttributeXP(
        'agility',
        totalXP * 0.24
      );
    } else {
      /*
       * Forwards receive game XP across offense, puck movement,
       * skating and hockey sense.
       */
      addAttributeXP(
        'offensiveAwareness',
        totalXP * 0.27
      );

      addAttributeXP(
        'puckControl',
        totalXP * 0.25
      );

      addAttributeXP(
        'passing',
        totalXP * 0.24
      );

      addAttributeXP(
        'acceleration',
        totalXP * 0.24
      );
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

    const eventResults =
      scheduledEvents.map(event =>
        resolveScheduledEvent(
          event,
          {
            date: dateString,
          }
        )
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

  function save() {
    if (window.PROJECT_ICE_DEV_SESSION) return;
    try {
      localStorage.setItem(WORLD_KEY, JSON.stringify(_state));
    } catch (err) {
      console.error('[WorldEngine] Save failed:', err);
    }
  }

  /**
   * Load a persisted world. Merges stored data over defaults so
   * missing fields from older save versions are back-filled.
   * @returns {boolean} true if a stored world was found and loaded.
   */
  function load() {
    try {
      const stored = localStorage.getItem(WORLD_KEY);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      _state = { ...buildDefaults(), ...parsed };
      // Deep-merge news so seed headlines survive a fresh install
      // when no stored news exists yet.
      if (!Array.isArray(_state.newsItems) || _state.newsItems.length === 0) {
        _state.newsItems = SEED_NEWS.map(item => ({ ...item }));
      }
      /*
       * Migrate older worlds into the permanent Season Engine
       * while preserving their existing saved date and week.
       */
      ensureCanonicalSeasonState(
        _state
      );
      return true;
    } catch (err) {
      console.error('[WorldEngine] Load failed:', err);
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

    if (targetDate <= currentDate) {
      return {
        success:
          targetDate === currentDate,

        currentDate,
        targetDate,
        daysAdvanced: 0,
        crossedWeeks: [],
        dateProcessingResults: [],
        reason:
          targetDate === currentDate
            ? 'already-current-date'
            : 'target-before-current-date',
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
    createCareerAttributesFromTryouts,
    upsertCareerPlayer,
    reset,
    syncSeedTeamMetadata,
    createHighSchoolSchedule,
    createHighSchoolCareerSchedule,
    completePracticeEvent,
    completeRecoveryEvent,
    completeCoachMeetingEvent,
    setCurrentDate,
    advanceDay,
    advanceToDate,
  };

})();
