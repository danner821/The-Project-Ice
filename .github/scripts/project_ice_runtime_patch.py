from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text(encoding='utf-8')
world = WORLD.read_text(encoding='utf-8')

# Existing stabilized runtime fixes remain idempotent so this one workflow can
# keep serving as the Project Ice runtime patch lane.

# 1) POSTGAME ORIGIN
old_route = """      /*
       * Route first. A non-critical refresh failure should never strand
       * the player on the completed-game screen with a dead Continue button.
       * openHubTab('schedule') already refreshes and renders Schedule.
       */
      openHubTab(
        'schedule'
      );

      try {
        refreshCareerUI();
"""
new_route = """      /*
       * Return to the tab that launched the game. Home-launched games return
       * Home; Schedule remains the fallback for every other launch path.
       */
      const returnOrigin =
        EventSystem.getOrigin();

      if (returnOrigin === 'hub') {
        openHubTab('home');
      } else {
        openHubTab('schedule');
      }

      try {
        refreshCareerUI();
"""
if old_route in game:
    game = game.replace(old_route, new_route, 1)
elif "const returnOrigin =\n        EventSystem.getOrigin();" not in game:
    raise SystemExit('postgame origin anchor not found')

# 2) POTENTIAL NEWS
potential_old = """        const direction = Number(beat.change || beat.potentialChange || 0);
        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
"""
potential_new = """        const direction = Number(beat.change || beat.potentialChange || 0);
        const previousRole =
          beat.potentialRoleBefore ||
          beat.oldRole ||
          beat.roleBefore ||
          null;

        if (
          direction === 0 ||
          (previousRole && previousRole === role)
        ) {
          return;
        }

        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
"""
if potential_old in world:
    world = world.replace(potential_old, potential_new)
elif "direction === 0 ||" not in world:
    raise SystemExit('potential news anchor not found')

# 3) WEEKLY PROSPECT RANKING INERTIA
rank_old = """    const ranked = players
      .map(player => ({
        player,
        playerId: player.id || player.playerId || null,
        score: calculateWeeklyScoutingScore(player),
      }))
      .sort((a, b) =>
        (b.score - a.score) ||
        ((Number(b.player?.overall) || 0) - (Number(a.player?.overall) || 0)) ||
        String(b.playerId || '').localeCompare(String(a.playerId || ''))
      );

    const changes = [];
"""
rank_new = """    const rawRanked = players
      .map(player => ({
        player,
        playerId: player.id || player.playerId || null,
        score: calculateWeeklyScoutingScore(player),
      }))
      .sort((a, b) =>
        (b.score - a.score) ||
        ((Number(b.player?.overall) || 0) - (Number(a.player?.overall) || 0)) ||
        String(b.playerId || '').localeCompare(String(a.playerId || ''))
      );

    const rawRankByPlayerId =
      new Map(
        rawRanked.map((entry, index) => [
          String(entry.playerId || ''),
          index + 1,
        ])
      );

    const ranked = rawRanked
      .map(entry => {
        const rawRank = rawRankByPlayerId.get(String(entry.playerId || '')) || 999;
        const previousRank = Number(entry.player?.scoutingProfile?.publicRank) || 0;
        return {
          ...entry,
          stabilizedRankScore:
            previousRank > 0
              ? previousRank * 0.72 + rawRank * 0.28
              : rawRank,
        };
      })
      .sort((a, b) =>
        (a.stabilizedRankScore - b.stabilizedRankScore) ||
        (b.score - a.score) ||
        String(a.playerId || '').localeCompare(String(b.playerId || ''))
      );

    const changes = [];
"""
if rank_old in world:
    world = world.replace(rank_old, rank_new, 1)
elif 'const rawRanked = players' not in world:
    raise SystemExit('weekly prospect ranking anchor not found')

# 4) PROSPECT MOVEMENT NEWS
news_loop_old = """    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;

      const previousRank = rank + change;
      const bigMove = Math.abs(change) >= 8;
"""
news_loop_new = """    let prospectMovementHeadlines = 0;
    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;
      if (prospectMovementHeadlines >= 3) return;

      const previousRank = rank + change;
      const bigMove = Math.abs(change) >= 10;
"""
if news_loop_old in world:
    world = world.replace(news_loop_old, news_loop_new, 1)
elif 'let prospectMovementHeadlines = 0;' not in world:
    raise SystemExit('prospect movement news loop anchor not found')

threshold_old = """      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      const player = getPlayer(entry.playerId);
"""
threshold_new = """      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      prospectMovementHeadlines += 1;

      const player = getPlayer(entry.playerId);
"""
if threshold_old in world:
    world = world.replace(threshold_old, threshold_new, 1)
elif 'prospectMovementHeadlines += 1;' not in world:
    raise SystemExit('prospect movement headline counter anchor not found')

# 5) PLAYER PROFILE RETURN ORIGIN
profile_back_old = """      btnBackPlayerProfile.addEventListener('click', () => {
        if (_playerProfileOrigin === 'full-stats') {
"""
profile_back_new = """      btnBackPlayerProfile.addEventListener('click', () => {
        if (_playerProfileOrigin === 'league') {
          openHubTab('league');
          return;
        }

        if (_playerProfileOrigin === 'full-stats') {
"""
if profile_back_old in game:
    game = game.replace(profile_back_old, profile_back_new, 1)
elif "_playerProfileOrigin === 'league'" not in game:
    raise SystemExit('League player-profile return anchor not found')

# 6) STANDINGS MOVEMENT NEWS
standings_loop_old = """      (currentSnapshot.standings || []).forEach(teamStanding => {
"""
standings_loop_new = """      let standingsMovementHeadlines = 0;
      (currentSnapshot.standings || []).forEach(teamStanding => {
"""
if standings_loop_old in world:
    world = world.replace(standings_loop_old, standings_loop_new, 1)
elif 'let standingsMovementHeadlines = 0;' not in world:
    raise SystemExit('standings movement loop anchor not found')

standings_threshold_old = """        if (Math.abs(delta) < 2) return;
        const team = getTeam(teamStanding.teamId);
"""
standings_threshold_new = """        if (Math.abs(delta) < 2) return;
        if (standingsMovementHeadlines >= 2) return;

        const enteredTopThree =
          Number(teamStanding.rank) <= 3 &&
          Number(prior.rank) > 3;
        const leftTopThree =
          Number(teamStanding.rank) > 3 &&
          Number(prior.rank) <= 3;
        const majorMove = Math.abs(delta) >= 3;

        if (!majorMove && !enteredTopThree && !leftTopThree) return;

        standingsMovementHeadlines += 1;

        const team = getTeam(teamStanding.teamId);
"""
if standings_threshold_old in world:
    world = world.replace(standings_threshold_old, standings_threshold_new, 1)
elif 'const enteredTopThree =' not in world:
    raise SystemExit('standings movement threshold anchor not found')

# 7) PHASE 3.1 — HIGH SCHOOL POSTSEASON FOUNDATION
# Establish one canonical saved postseason object before any UI is built.
# Six teams qualify; seeds 1 and 2 receive byes; Round One is 3v6 and 4v5.
postseason_marker = 'function initializeHighSchoolPostseason('
if postseason_marker not in world:
    postseason_code = r'''
  /*
   * ============================================================
   * PHASE 3.1 — HIGH SCHOOL POSTSEASON FOUNDATION
   * ============================================================
   *
   * This is the canonical saved playoff contract. UI, calendar rendering,
   * simulation, statistics, and future history screens all read this object
   * rather than rebuilding a bracket independently.
   */
  function addDaysToHighSchoolDateKey(dateKey, days) {
    const date = new Date(`${String(dateKey).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function getHighSchoolRegularSeasonEndDate() {
    const schedule = Array.isArray(_state.schedule) ? _state.schedule : [];
    const finaleDates = schedule
      .filter(event =>
        event?.isSeasonFinale === true &&
        event?.isPlayoff !== true &&
        event?.date
      )
      .map(event => String(event.date).slice(0, 10))
      .sort();

    if (finaleDates.length) {
      return finaleDates[finaleDates.length - 1];
    }

    const regularGameDates = schedule
      .filter(event =>
        event?.isPlayoff !== true &&
        event?.date &&
        event?.homeTeamId &&
        event?.awayTeamId
      )
      .map(event => String(event.date).slice(0, 10))
      .sort();

    return regularGameDates.length
      ? regularGameDates[regularGameDates.length - 1]
      : null;
  }

  function freezeHighSchoolRegularSeasonStandings() {
    const teams = Array.isArray(_state.teams) ? _state.teams : [];

    return teams
      .map(team => ({
        teamId: team.teamId,
        schoolName: team.schoolName || '',
        teamName: team.teamName || '',
        abbreviation: team.abbreviation || '',
        wins: Number(team.wins) || 0,
        losses: Number(team.losses) || 0,
        overtimeLosses: Number(team.overtimeLosses) || 0,
        points: Number(team.points) || 0,
        goalsFor: Number(team.goalsFor) || 0,
        goalsAgainst: Number(team.goalsAgainst) || 0,
      }))
      .sort((a, b) =>
        (b.points - a.points) ||
        (b.wins - a.wins) ||
        ((b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)) ||
        (b.goalsFor - a.goalsFor) ||
        String(a.teamId || '').localeCompare(String(b.teamId || ''))
      )
      .map((team, index) => ({
        ...team,
        seed: index + 1,
        qualified: index < 6,
      }));
  }

  function createHighSchoolPlayoffGame({
    seriesId,
    round,
    gameNumber,
    date,
    higherSeed,
    lowerSeed,
  }) {
    const higherSeedHosts = gameNumber === 1 || gameNumber === 3;
    const home = higherSeedHosts ? higherSeed : lowerSeed;
    const away = higherSeedHosts ? lowerSeed : higherSeed;
    const id = `hs-playoff-${seriesId}-g${gameNumber}`;

    return {
      id,
      eventId: id,
      gameId: id,
      type: 'game',
      eventType: 'game',
      label: 'Playoff Game',
      date,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      higherSeedTeamId: higherSeed.teamId,
      lowerSeedTeamId: lowerSeed.teamId,
      isPlayoff: true,
      seasonType: 'playoffs',
      playoffRound: round,
      seriesId,
      gameNumber,
      bestOf: 3,
      played: false,
      completed: false,
      homeScore: null,
      awayScore: null,
    };
  }

  function createHighSchoolPlayoffSeries({
    seriesId,
    round,
    higherSeed,
    lowerSeed,
    startDate,
  }) {
    const games = [1, 2, 3].map((gameNumber, index) =>
      createHighSchoolPlayoffGame({
        seriesId,
        round,
        gameNumber,
        date: addDaysToHighSchoolDateKey(startDate, index * 2),
        higherSeed,
        lowerSeed,
      })
    );

    return {
      seriesId,
      round,
      bestOf: 3,
      higherSeed: higherSeed.seed,
      lowerSeed: lowerSeed.seed,
      higherSeedTeamId: higherSeed.teamId,
      lowerSeedTeamId: lowerSeed.teamId,
      wins: {
        [higherSeed.teamId]: 0,
        [lowerSeed.teamId]: 0,
      },
      status: 'scheduled',
      winnerTeamId: null,
      games,
    };
  }

  function ensureHighSchoolPostseasonContainer() {
    if (!_state.postseason || typeof _state.postseason !== 'object') {
      _state.postseason = {};
    }
    if (!Object.prototype.hasOwnProperty.call(_state.postseason, 'highSchool')) {
      _state.postseason.highSchool = null;
    }
    return _state.postseason;
  }

  function getHighSchoolPostseason() {
    ensureHighSchoolPostseasonContainer();
    return _state.postseason.highSchool;
  }

  function initializeHighSchoolPostseason(options = {}) {
    ensureHighSchoolPostseasonContainer();

    if (
      _state.postseason.highSchool?.initialized === true &&
      options.force !== true
    ) {
      return _state.postseason.highSchool;
    }

    const regularSeasonEndDate =
      options.regularSeasonEndDate ||
      getHighSchoolRegularSeasonEndDate();

    if (!regularSeasonEndDate) {
      return {
        initialized: false,
        reason: 'regular-season-end-date-unavailable',
      };
    }

    const frozenStandings = freezeHighSchoolRegularSeasonStandings();
    const qualifiers = frozenStandings.filter(team => team.qualified).slice(0, 6);

    if (qualifiers.length !== 6) {
      return {
        initialized: false,
        reason: 'six-playoff-teams-required',
        qualifierCount: qualifiers.length,
      };
    }

    const seed = number => qualifiers.find(team => team.seed === number);
    const checkpointDate = addDaysToHighSchoolDateKey(regularSeasonEndDate, 7);
    const playoffStartDate = addDaysToHighSchoolDateKey(regularSeasonEndDate, 11);
    const semifinalStartDate = addDaysToHighSchoolDateKey(regularSeasonEndDate, 17);
    const championshipStartDate = addDaysToHighSchoolDateKey(regularSeasonEndDate, 23);

    const roundOne = [
      createHighSchoolPlayoffSeries({
        seriesId: 'round-one-3v6',
        round: 'round-one',
        higherSeed: seed(3),
        lowerSeed: seed(6),
        startDate: playoffStartDate,
      }),
      createHighSchoolPlayoffSeries({
        seriesId: 'round-one-4v5',
        round: 'round-one',
        higherSeed: seed(4),
        lowerSeed: seed(5),
        startDate: playoffStartDate,
      }),
    ];

    const bracket = {
      format: 'six-team-bye-best-of-three',
      qualifierCount: 6,
      byeSeeds: [1, 2],
      reseedSemifinals: true,
      homeIcePattern: 'higher-lower-higher',
      rounds: {
        roundOne,
        semifinals: [],
        championship: [],
      },
    };

    const postseason = {
      initialized: true,
      version: 1,
      status: 'pre-playoffs',
      regularSeasonEndDate,
      checkpointDate,
      playoffStartDate,
      semifinalStartDate,
      championshipStartDate,
      frozenStandings,
      qualifiers,
      bracket,
      championTeamId: null,
      completedDate: null,
    };

    _state.postseason.highSchool = postseason;

    if (options.attachSchedule !== false) {
      const existingIds = new Set(
        (Array.isArray(_state.schedule) ? _state.schedule : [])
          .map(event => String(event?.id || event?.eventId || event?.gameId || ''))
      );

      const newGames = roundOne
        .flatMap(series => series.games)
        .filter(game => !existingIds.has(String(game.id)));

      _state.schedule = [
        ...(Array.isArray(_state.schedule) ? _state.schedule : []),
        ...newGames,
      ].sort((a, b) =>
        String(a?.date || '').localeCompare(String(b?.date || '')) ||
        String(a?.id || '').localeCompare(String(b?.id || ''))
      );
    }

    if (options.save !== false) {
      save();
    }

    return postseason;
  }
'''
    anchor = "  function buildDefaults() {"
    if anchor not in world:
        raise SystemExit('postseason foundation insertion anchor not found')
    world = world.replace(anchor, postseason_code + "\n" + anchor, 1)

# New worlds explicitly reserve postseason state; older saves migrate lazily.
default_state_old = """      standings:        [],   // { teamId, wins, losses, points, … }
      prospectRankings: [],   // { rank, playerId, … }
"""
default_state_new = """      standings:        [],   // { teamId, wins, losses, points, … }
      prospectRankings: [],   // { rank, playerId, … }
      postseason: {
        highSchool: null,
      },
"""
if default_state_old in world:
    world = world.replace(default_state_old, default_state_new, 1)
elif "postseason: {\n        highSchool: null," not in world:
    raise SystemExit('postseason default state anchor not found')

# Expose only canonical postseason APIs. Presentation will be layered on next.
api_old = """    createHighSchoolSchedule,
    createHighSchoolCareerSchedule,
    completePracticeEvent,
"""
api_new = """    createHighSchoolSchedule,
    createHighSchoolCareerSchedule,
    getHighSchoolRegularSeasonEndDate,
    freezeHighSchoolRegularSeasonStandings,
    getHighSchoolPostseason,
    initializeHighSchoolPostseason,
    completePracticeEvent,
"""
if api_old in world:
    world = world.replace(api_old, api_new, 1)
elif 'initializeHighSchoolPostseason,' not in world:
    raise SystemExit('postseason public API anchor not found')

GAME.write_text(game, encoding='utf-8')
WORLD.write_text(world, encoding='utf-8')

print('PROJECT_ICE_RUNTIME_PATCH=APPLIED')
