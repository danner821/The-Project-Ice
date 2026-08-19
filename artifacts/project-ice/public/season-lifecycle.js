'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined' || !WorldEngine?.state) return;

  const FORMAT = 'six-team-bye-best-of-three';
  const QUALIFIERS = 6;
  const WINS_TO_ADVANCE = 2;
  const originalAdvanceToDate = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (!originalAdvanceToDate) return;

  const state = () => WorldEngine.state;
  const key = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };
  const addDays = (value, days) => {
    const dateKey = key(value);
    if (!dateKey) return null;
    const date = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };
  const currentDate = () => key(
    state()?.season?.currentDate || state()?.player?.currentDate || state()?.currentDate
  );
  const gameId = game => String(game?.id || game?.eventId || game?.gameId || '');
  const hasFinalScore = game =>
    game?.homeScore !== null && game?.homeScore !== undefined &&
    game?.awayScore !== null && game?.awayScore !== undefined &&
    Number.isFinite(Number(game.homeScore)) && Number.isFinite(Number(game.awayScore));
  const isFinal = game => Boolean(
    game?.played === true ||
    game?.completed === true ||
    String(game?.status || '').toLowerCase() === 'final' ||
    hasFinalScore(game)
  );
  const team = teamId => (state()?.teams || []).find(item =>
    String(item?.teamId || '') === String(teamId || '')
  ) || null;
  const teamName = teamId => {
    const item = team(teamId);
    return item ? `${item.schoolName || ''} ${item.teamName || ''}`.trim() : 'Unknown Team';
  };

  function ensureContainers() {
    const world = state();
    if (!world.postseason || typeof world.postseason !== 'object') world.postseason = {};
    if (!Object.prototype.hasOwnProperty.call(world.postseason, 'highSchool')) {
      world.postseason.highSchool = null;
    }
    if (!world.history || typeof world.history !== 'object') world.history = {};
    if (!Array.isArray(world.history.champions)) world.history.champions = [];
    if (!Array.isArray(world.history.titles)) world.history.titles = [];
    if (world.season && (!world.season.postseason || typeof world.season.postseason !== 'object')) {
      world.season.postseason = { qualified: false, started: false, completed: false };
    }
    return world;
  }

  function regularGames() {
    return (state()?.schedule || []).filter(game =>
      game?.isPlayoff !== true && game?.homeTeamId && game?.awayTeamId && key(game?.date)
    );
  }

  function getRegularSeasonEndDate() {
    const finales = regularGames()
      .filter(game => game?.isSeasonFinale === true)
      .map(game => key(game.date))
      .filter(Boolean)
      .sort();
    if (finales.length) return finales[finales.length - 1];
    const dates = regularGames().map(game => key(game.date)).filter(Boolean).sort();
    return dates.length ? dates[dates.length - 1] : null;
  }

  function regularSeasonComplete() {
    const games = regularGames();
    return games.length > 0 && games.every(isFinal);
  }

  function standingsSnapshot() {
    return (state()?.teams || [])
      .map(item => ({
        teamId: item.teamId,
        schoolName: item.schoolName || '',
        teamName: item.teamName || '',
        abbreviation: item.abbreviation || '',
        wins: Number(item.wins) || 0,
        losses: Number(item.losses) || 0,
        overtimeLosses: Number(item.overtimeLosses) || 0,
        points: Number(item.points) || 0,
        goalsFor: Number(item.goalsFor) || 0,
        goalsAgainst: Number(item.goalsAgainst) || 0,
      }))
      .sort((a, b) =>
        (b.points - a.points) ||
        (b.wins - a.wins) ||
        ((b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)) ||
        (b.goalsFor - a.goalsFor) ||
        String(a.teamId).localeCompare(String(b.teamId))
      )
      .map((item, index) => ({ ...item, seed: index + 1, qualified: index < QUALIFIERS }));
  }

  function refreshStandings() {
    const postseason = state()?.postseason?.highSchool;
    state().standings = structuredClone(
      postseason?.initialized ? postseason.frozenStandings : standingsSnapshot()
    );
  }

  function seedForTeam(teamId, postseason = state()?.postseason?.highSchool) {
    return (postseason?.frozenStandings || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function createGame(seriesId, round, number, date, high, low) {
    const highHome = number === 1 || number === 3;
    const home = highHome ? high : low;
    const away = highHome ? low : high;
    const id = `hs-playoff-${seriesId}-g${number}`;
    return {
      id,
      eventId: id,
      gameId: id,
      type: 'game',
      eventType: 'game',
      label: 'Playoff Game',
      shortLabel: 'Playoffs',
      date,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      higherSeedTeamId: high.teamId,
      lowerSeedTeamId: low.teamId,
      isPlayoff: true,
      seasonType: 'playoffs',
      playoffRound: round,
      seriesId,
      gameNumber: number,
      bestOf: 3,
      played: false,
      completed: false,
      status: 'scheduled',
    };
  }

  function createSeries(seriesId, round, high, low, startDate) {
    if (!high?.teamId || !low?.teamId || !startDate) return null;
    return {
      seriesId,
      round,
      bestOf: 3,
      higherSeed: high.seed,
      lowerSeed: low.seed,
      higherSeedTeamId: high.teamId,
      lowerSeedTeamId: low.teamId,
      wins: { [high.teamId]: 0, [low.teamId]: 0 },
      status: 'scheduled',
      winnerTeamId: null,
      loserTeamId: null,
      completedDate: null,
      games: [1, 2, 3].map((number, index) =>
        createGame(seriesId, round, number, addDays(startDate, index * 2), high, low)
      ),
    };
  }

  function appendGames(games) {
    const world = state();
    if (!Array.isArray(world.schedule)) world.schedule = [];
    const ids = new Set(world.schedule.map(gameId));
    let added = 0;
    for (const game of games.filter(Boolean)) {
      if (!gameId(game) || ids.has(gameId(game))) continue;
      world.schedule.push(game);
      ids.add(gameId(game));
      added += 1;
    }
    world.schedule.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) || gameId(a).localeCompare(gameId(b))
    );
    return added;
  }

  function initializePostseason(options = {}) {
    const world = ensureContainers();
    if (world.postseason.highSchool?.initialized && options.force !== true) {
      return world.postseason.highSchool;
    }

    const endDate = key(options.regularSeasonEndDate) || getRegularSeasonEndDate();
    if (!endDate) return { initialized: false, reason: 'regular-season-end-date-unavailable' };
    if (options.force !== true && !regularSeasonComplete()) {
      return { initialized: false, reason: 'regular-season-not-complete' };
    }

    const frozen = standingsSnapshot();
    const qualifiers = frozen.filter(item => item.qualified).slice(0, QUALIFIERS);
    if (qualifiers.length !== QUALIFIERS) {
      return { initialized: false, reason: 'six-playoff-teams-required' };
    }

    const bySeed = number => qualifiers.find(item => Number(item.seed) === Number(number));
    const playoffStartDate = addDays(endDate, 11);
    const semifinalStartDate = addDays(endDate, 17);
    const championshipStartDate = addDays(endDate, 23);
    const roundOne = [
      createSeries('round-one-3v6', 'round-one', bySeed(3), bySeed(6), playoffStartDate),
      createSeries('round-one-4v5', 'round-one', bySeed(4), bySeed(5), playoffStartDate),
    ].filter(Boolean);

    const careerTeamId = world?.player?.teamId || world?.player?.highSchoolTeamId || null;
    const careerSeed = qualifiers.find(item => String(item.teamId) === String(careerTeamId || '')) || null;

    world.postseason.highSchool = {
      initialized: true,
      version: 1,
      format: FORMAT,
      status: 'round-one',
      regularSeasonEndDate: endDate,
      playoffStartDate,
      semifinalStartDate,
      championshipStartDate,
      frozenStandings: frozen,
      qualifiers,
      byeSeeds: [1, 2],
      reseedSemifinals: true,
      bracket: {
        format: FORMAT,
        qualifierCount: QUALIFIERS,
        rounds: { roundOne, semifinals: [], championship: [] },
      },
      championTeamId: null,
      completedDate: null,
    };

    if (world.season?.postseason) {
      world.season.postseason.qualified = Boolean(careerSeed);
      world.season.postseason.seed = careerSeed?.seed || null;
      world.season.postseason.started = true;
      world.season.postseason.completed = false;
      world.season.phase = 'postseason';
    }

    appendGames(roundOne.flatMap(series => series.games));
    refreshStandings();
    if (options.save !== false) WorldEngine.save();
    return world.postseason.highSchool;
  }

  function canonicalGame(game) {
    return (state()?.schedule || []).find(item => gameId(item) === gameId(game)) || game || null;
  }

  function winner(game) {
    const item = canonicalGame(game);
    if (!isFinal(item) || !hasFinalScore(item)) return null;
    const home = Number(item.homeScore);
    const away = Number(item.awayScore);
    if (home === away) return null;
    return home > away ? item.homeTeamId : item.awayTeamId;
  }

  function finishSeries(series) {
    const wins = { [series.higherSeedTeamId]: 0, [series.lowerSeedTeamId]: 0 };
    let completedDate = null;
    for (const game of series.games || []) {
      const canonical = canonicalGame(game);
      const gameWinner = winner(canonical);
      if (!gameWinner) continue;
      wins[gameWinner] = (wins[gameWinner] || 0) + 1;
      completedDate = key(canonical?.date) || completedDate;
    }
    series.wins = wins;

    const seriesWinner = Object.keys(wins).find(teamId => wins[teamId] >= WINS_TO_ADVANCE) || null;
    if (!seriesWinner) {
      series.status = Object.values(wins).some(value => value > 0) ? 'in-progress' : 'scheduled';
      return false;
    }

    series.status = 'complete';
    series.winnerTeamId = seriesWinner;
    series.loserTeamId = String(seriesWinner) === String(series.higherSeedTeamId)
      ? series.lowerSeedTeamId
      : series.higherSeedTeamId;
    series.completedDate = completedDate || currentDate();

    const unneeded = new Set();
    for (const game of series.games || []) {
      const canonical = canonicalGame(game);
      if (isFinal(canonical)) continue;
      game.canceled = true;
      game.status = 'not-needed';
      game.completed = true;
      game.completedAt = series.completedDate;
      unneeded.add(gameId(game));
    }
    if (unneeded.size) {
      state().schedule = state().schedule.filter(game => !unneeded.has(gameId(game)));
    }
    return true;
  }

  function seedSemifinals(postseason) {
    const rounds = postseason.bracket.rounds;
    if (rounds.semifinals.length) return false;
    if (rounds.roundOne.length !== 2 || rounds.roundOne.some(series => series.status !== 'complete')) return false;

    const advancing = [
      postseason.frozenStandings.find(item => item.seed === 1)?.teamId,
      postseason.frozenStandings.find(item => item.seed === 2)?.teamId,
      ...rounds.roundOne.map(series => series.winnerTeamId),
    ]
      .filter(Boolean)
      .map(teamId => seedForTeam(teamId, postseason))
      .filter(Boolean)
      .sort((a, b) => a.seed - b.seed);

    if (advancing.length !== 4) return false;
    rounds.semifinals = [
      createSeries('semifinal-a', 'semifinals', advancing[0], advancing[3], postseason.semifinalStartDate),
      createSeries('semifinal-b', 'semifinals', advancing[1], advancing[2], postseason.semifinalStartDate),
    ].filter(Boolean);
    if (rounds.semifinals.length !== 2) return false;
    postseason.status = 'semifinals';
    appendGames(rounds.semifinals.flatMap(series => series.games));
    return true;
  }

  function seedChampionship(postseason) {
    const rounds = postseason.bracket.rounds;
    if (rounds.championship.length) return false;
    if (rounds.semifinals.length !== 2 || rounds.semifinals.some(series => series.status !== 'complete')) return false;

    const finalists = rounds.semifinals
      .map(series => seedForTeam(series.winnerTeamId, postseason))
      .filter(Boolean)
      .sort((a, b) => a.seed - b.seed);
    if (finalists.length !== 2) return false;

    const series = createSeries(
      'championship',
      'championship',
      finalists[0],
      finalists[1],
      postseason.championshipStartDate
    );
    if (!series) return false;
    rounds.championship = [series];
    postseason.status = 'championship';
    appendGames(series.games);
    return true;
  }

  function recordChampion(postseason) {
    if (postseason.championTeamId) return false;
    const series = postseason.bracket.rounds.championship[0];
    if (!series || series.status !== 'complete' || !series.winnerTeamId) return false;

    const world = ensureContainers();
    const championTeamId = series.winnerTeamId;
    const completedDate = series.completedDate || currentDate();
    const seasonId = world?.season?.id || world?.currentSeason || 'high-school-season';
    const id = `${seasonId}:high-school-champion`;

    postseason.championTeamId = championTeamId;
    postseason.completedDate = completedDate;
    postseason.status = 'complete';
    if (world.season?.postseason) {
      world.season.postseason.completed = true;
      world.season.postseason.championTeamId = championTeamId;
      world.season.phase = 'postseason-complete';
    }

    const record = {
      id,
      seasonId,
      seasonLabel: world?.season?.label || world?.currentSeason || null,
      level: 'high-school',
      teamId: championTeamId,
      teamName: teamName(championTeamId),
      date: completedDate,
    };
    if (!world.history.champions.some(item => item?.id === id)) {
      world.history.champions.push({ ...record });
    }
    if (!world.history.titles.some(item => item?.id === id)) {
      world.history.titles.push({ ...record, title: 'League Champion' });
    }
    WorldEngine.news?.publish?.({
      date: completedDate,
      tag: 'CHAMPIONS',
      headline: `${teamName(championTeamId)} wins the high school league championship.`,
    });
    return true;
  }

  function reconcile(options = {}) {
    const world = ensureContainers();
    let changed = false;
    const endDate = getRegularSeasonEndDate();
    const now = currentDate();

    if (!world.postseason.highSchool?.initialized && endDate && now && now >= endDate && regularSeasonComplete()) {
      changed = initializePostseason({ save: false })?.initialized === true;
    }

    const postseason = world.postseason.highSchool;
    if (!postseason?.initialized) {
      refreshStandings();
      if (changed && options.save !== false) WorldEngine.save();
      return { changed, postseason: postseason || null };
    }

    for (const series of postseason.bracket.rounds.roundOne || []) {
      if (series.status !== 'complete' && finishSeries(series)) changed = true;
    }
    if (seedSemifinals(postseason)) changed = true;
    for (const series of postseason.bracket.rounds.semifinals || []) {
      if (series.status !== 'complete' && finishSeries(series)) changed = true;
    }
    if (seedChampionship(postseason)) changed = true;
    for (const series of postseason.bracket.rounds.championship || []) {
      if (series.status !== 'complete' && finishSeries(series)) changed = true;
    }
    if (recordChampion(postseason)) changed = true;

    refreshStandings();
    if (changed && options.save !== false) WorldEngine.save();
    return { changed, postseason };
  }

  function summary(daysAdvanced, dateResults, crossedWeeks, weeklyResults) {
    const output = {
      daysAdvanced,
      processedDates: dateResults.length,
      totalEvents: 0,
      completedEvents: 0,
      pendingEvents: 0,
      eventTypes: {},
      crossedWeeks,
      weeklyProcessingResults: weeklyResults,
    };
    for (const day of dateResults) {
      for (const event of day?.eventResults || []) {
        output.totalEvents += 1;
        if (event?.resolved) output.completedEvents += 1;
        else output.pendingEvents += 1;
        const type = event?.type || 'unknown';
        output.eventTypes[type] = (output.eventTypes[type] || 0) + 1;
      }
    }
    return output;
  }

  function advanceWithLifecycle(targetDate, options = {}) {
    const target = key(targetDate);
    const start = currentDate();
    if (!target || !start || target <= start) {
      const result = originalAdvanceToDate(targetDate, options);
      reconcile({ save: options.save });
      return result;
    }

    const dateResults = [];
    const crossedWeeks = [];
    const weeklyResults = [];
    const maximumDays = Math.max(1, Number(options.maximumDays) || 730);
    let daysAdvanced = 0;
    let last = null;
    let blockingDateResult = null;

    while (currentDate() < target && daysAdvanced < maximumDays) {
      reconcile({ save: false });
      const nextDate = addDays(currentDate(), 1);
      if (!nextDate) break;

      last = originalAdvanceToDate(nextDate, { ...options, maximumDays: 1, save: false });
      dateResults.push(...(last?.dateProcessingResults || []));
      crossedWeeks.push(...(last?.crossedWeeks || []));
      weeklyResults.push(...(last?.weeklyProcessingResults || []));
      daysAdvanced += Math.max(0, Number(last?.daysAdvanced) || 0);
      reconcile({ save: false });

      if (last?.stopSimulation === true) {
        blockingDateResult = last?.blockingDateResult || last;
        break;
      }
      if ((Number(last?.daysAdvanced) || 0) <= 0 && currentDate() < target) break;
    }

    const reachedTarget = currentDate() === target;
    const stopSimulation = Boolean(blockingDateResult);
    const uniqueWeeks = [...new Set(crossedWeeks)];
    if (options.save !== false && (daysAdvanced > 0 || stopSimulation)) WorldEngine.save();

    return {
      success: reachedTarget && !stopSimulation,
      currentDate: currentDate(),
      targetDate: target,
      daysAdvanced,
      dateProcessingResults: dateResults,
      crossedWeeks: uniqueWeeks,
      weeklyProcessingResults: weeklyResults,
      simulationSummary: summary(daysAdvanced, dateResults, uniqueWeeks, weeklyResults),
      stopSimulation,
      blockingDateResult,
      blockingEventResult: blockingDateResult?.blockingEventResult || last?.blockingEventResult || null,
      reason: stopSimulation
        ? 'player-interaction-required'
        : reachedTarget
          ? 'target-reached'
          : daysAdvanced >= maximumDays
            ? 'maximum-days-reached'
            : last?.reason || 'advance-failed',
    };
  }

  WorldEngine.getHighSchoolRegularSeasonEndDate = getRegularSeasonEndDate;
  WorldEngine.freezeHighSchoolRegularSeasonStandings = standingsSnapshot;
  WorldEngine.getHighSchoolPostseason = () => {
    ensureContainers();
    return state().postseason.highSchool;
  };
  WorldEngine.initializeHighSchoolPostseason = initializePostseason;
  WorldEngine.reconcileHighSchoolPostseason = reconcile;
  WorldEngine.advanceToDate = advanceWithLifecycle;

  ensureContainers();
  refreshStandings();
  reconcile({ save: false });
})();
