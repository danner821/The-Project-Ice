/* ============================================================
   PROJECT ICE — season-lifecycle.js

   Phase 3.1 — AI standings, playoffs, and champions.

   This module intentionally lives beside world.js rather than duplicating
   any hockey simulation logic. It orchestrates the canonical WorldEngine:
   regular-season games continue to resolve through WorldEngine.advanceToDate,
   playoff games are added to the same schedule, and the existing game engine
   remains the only source of on-ice outcomes and player/team statistics.
   ============================================================ */

'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined' || !WorldEngine?.state) {
    console.warn('[SeasonLifecycle] WorldEngine is unavailable.');
    return;
  }

  const FORMAT = 'six-team-bye-best-of-three';
  const QUALIFIER_COUNT = 6;
  const SERIES_WINS_REQUIRED = 2;
  const MODULE_VERSION = 1;

  const originalAdvanceToDate =
    typeof WorldEngine.advanceToDate === 'function'
      ? WorldEngine.advanceToDate.bind(WorldEngine)
      : null;

  if (!originalAdvanceToDate) {
    console.warn('[SeasonLifecycle] WorldEngine.advanceToDate is unavailable.');
    return;
  }

  function clone(value) {
    return value == null ? value : structuredClone(value);
  }

  function dateKey(value) {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  }

  function addDays(value, days) {
    const key = dateKey(value);
    if (!key) return null;
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function currentDate() {
    const state = WorldEngine.state;
    return dateKey(
      state?.season?.currentDate ||
      state?.player?.currentDate ||
      state?.currentDate
    );
  }

  function teamById(teamId) {
    return (WorldEngine.state?.teams || []).find(team =>
      String(team?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function teamName(teamId) {
    const team = teamById(teamId);
    return team
      ? `${team.schoolName || ''} ${team.teamName || ''}`.trim()
      : 'Unknown Team';
  }

  function getRegularSeasonGames() {
    return (Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : []
    ).filter(event =>
      event?.isPlayoff !== true &&
      event?.homeTeamId &&
      event?.awayTeamId &&
      dateKey(event?.date)
    );
  }

  function getHighSchoolRegularSeasonEndDate() {
    const finaleDates = getRegularSeasonGames()
      .filter(event => event?.isSeasonFinale === true)
      .map(event => dateKey(event.date))
      .filter(Boolean)
      .sort();

    if (finaleDates.length) {
      return finaleDates[finaleDates.length - 1];
    }

    const gameDates = getRegularSeasonGames()
      .map(event => dateKey(event.date))
      .filter(Boolean)
      .sort();

    return gameDates.length ? gameDates[gameDates.length - 1] : null;
  }

  function isFinalGame(event) {
    if (!event || typeof event !== 'object') return false;

    const homeScore = Number(event.homeScore);
    const awayScore = Number(event.awayScore);
    const hasScore = Number.isFinite(homeScore) && Number.isFinite(awayScore);

    return Boolean(
      event.played === true ||
      event.completed === true ||
      String(event.status || '').toLowerCase() === 'final' ||
      hasScore
    );
  }

  function regularSeasonComplete() {
    const games = getRegularSeasonGames();
    return games.length > 0 && games.every(isFinalGame);
  }

  function freezeHighSchoolRegularSeasonStandings() {
    return (WorldEngine.state?.teams || [])
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
        qualified: index < QUALIFIER_COUNT,
      }));
  }

  function refreshCanonicalStandings() {
    const state = WorldEngine.state;
    const postseason = state?.postseason?.highSchool;

    if (postseason?.initialized && Array.isArray(postseason.frozenStandings)) {
      state.standings = clone(postseason.frozenStandings);
      return state.standings;
    }

    state.standings = freezeHighSchoolRegularSeasonStandings();
    return state.standings;
  }

  function ensureContainers() {
    const state = WorldEngine.state;

    if (!state.postseason || typeof state.postseason !== 'object') {
      state.postseason = {};
    }
    if (!Object.prototype.hasOwnProperty.call(state.postseason, 'highSchool')) {
      state.postseason.highSchool = null;
    }

    if (!state.history || typeof state.history !== 'object') {
      state.history = {};
    }
    if (!Array.isArray(state.history.champions)) state.history.champions = [];
    if (!Array.isArray(state.history.titles)) state.history.titles = [];

    if (state.season && typeof state.season === 'object') {
      if (!state.season.postseason || typeof state.season.postseason !== 'object') {
        state.season.postseason = {
          qualified: false,
          started: false,
          completed: false,
        };
      }
    }

    return state;
  }

  function seedEntry(seedNumber, postseason = WorldEngine.state?.postseason?.highSchool) {
    return (postseason?.frozenStandings || []).find(entry =>
      Number(entry?.seed) === Number(seedNumber)
    ) || null;
  }

  function seedForTeam(teamId, postseason = WorldEngine.state?.postseason?.highSchool) {
    return (postseason?.frozenStandings || []).find(entry =>
      String(entry?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function createPlayoffGame({
    seriesId,
    round,
    gameNumber,
    date,
    higherSeed,
    lowerSeed,
  }) {
    const higherHosts = gameNumber === 1 || gameNumber === 3;
    const home = higherHosts ? higherSeed : lowerSeed;
    const away = higherHosts ? lowerSeed : higherSeed;
    const id = `hs-playoff-${seriesId}-g${gameNumber}`;

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
      status: 'scheduled',
    };
  }

  function createSeries({
    seriesId,
    round,
    higherSeed,
    lowerSeed,
    startDate,
  }) {
    if (!higherSeed?.teamId || !lowerSeed?.teamId || !startDate) return null;

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
      loserTeamId: null,
      completedDate: null,
      games: [1, 2, 3].map((gameNumber, index) =>
        createPlayoffGame({
          seriesId,
          round,
          gameNumber,
          date: addDays(startDate, index * 2),
          higherSeed,
          lowerSeed,
        })
      ),
    };
  }

  function appendGamesToSchedule(games = []) {
    const state = WorldEngine.state;
    if (!Array.isArray(state.schedule)) state.schedule = [];

    const existingIds = new Set(state.schedule.map(event =>
      String(event?.id || event?.eventId || event?.gameId || '')
    ));

    let added = 0;
    games.filter(Boolean).forEach(game => {
      const id = String(game?.id || game?.eventId || game?.gameId || '');
      if (!id || existingIds.has(id)) return;
      state.schedule.push(game);
      existingIds.add(id);
      added += 1;
    });

    state.schedule.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.id || a?.eventId || '').localeCompare(String(b?.id || b?.eventId || ''))
    );

    return added;
  }

  function initializeHighSchoolPostseason(options = {}) {
    const state = ensureContainers();

    if (state.postseason.highSchool?.initialized === true && options.force !== true) {
      return state.postseason.highSchool;
    }

    const regularSeasonEndDate =
      dateKey(options.regularSeasonEndDate) ||
      getHighSchoolRegularSeasonEndDate();

    if (!regularSeasonEndDate) {
      return { initialized: false, reason: 'regular-season-end-date-unavailable' };
    }

    if (options.force !== true && !regularSeasonComplete()) {
      return { initialized: false, reason: 'regular-season-not-complete' };
    }

    const frozenStandings = freezeHighSchoolRegularSeasonStandings();
    const qualifiers = frozenStandings.filter(team => team.qualified).slice(0, QUALIFIER_COUNT);

    if (qualifiers.length !== QUALIFIER_COUNT) {
      return {
        initialized: false,
        reason: 'six-playoff-teams-required',
        qualifierCount: qualifiers.length,
      };
    }

    const seed = number => qualifiers.find(team => Number(team.seed) === Number(number));
    const playoffStartDate = addDays(regularSeasonEndDate, 11);
    const semifinalStartDate = addDays(regularSeasonEndDate, 17);
    const championshipStartDate = addDays(regularSeasonEndDate, 23);

    const roundOne = [
      createSeries({
        seriesId: 'round-one-3v6',
        round: 'round-one',
        higherSeed: seed(3),
        lowerSeed: seed(6),
        startDate: playoffStartDate,
      }),
      createSeries({
        seriesId: 'round-one-4v5',
        round: 'round-one',
        higherSeed: seed(4),
        lowerSeed: seed(5),
        startDate: playoffStartDate,
      }),
    ].filter(Boolean);

    const careerTeamId =
      state?.player?.teamId ||
      state?.player?.highSchoolTeamId ||
      null;
    const careerSeed = qualifiers.find(team =>
      String(team.teamId) === String(careerTeamId || '')
    ) || null;

    const postseason = {
      initialized: true,
      version: MODULE_VERSION,
      format: FORMAT,
      status: 'round-one',
      regularSeasonEndDate,
      playoffStartDate,
      semifinalStartDate,
      championshipStartDate,
      frozenStandings,
      qualifiers,
      byeSeeds: [1, 2],
      reseedSemifinals: true,
      bracket: {
        format: FORMAT,
        qualifierCount: QUALIFIER_COUNT,
        rounds: {
          roundOne,
          semifinals: [],
          championship: [],
        },
      },
      championTeamId: null,
      completedDate: null,
    };

    state.postseason.highSchool = postseason;
    state.standings = clone(frozenStandings);

    if (state.season?.postseason) {
      state.season.postseason.qualified = Boolean(careerSeed);
      state.season.postseason.seed = careerSeed?.seed || null;
      state.season.postseason.started = true;
      state.season.postseason.completed = false;
      state.season.phase = 'postseason';
    }

    appendGamesToSchedule(roundOne.flatMap(series => series.games));

    if (options.save !== false) WorldEngine.save();
    return postseason;
  }

  function canonicalScheduleGame(game) {
    const id = String(game?.id || game?.eventId || game?.gameId || '');
    if (!id) return game || null;

    return (WorldEngine.state?.schedule || []).find(event =>
      String(event?.id || event?.eventId || event?.gameId || '') === id
    ) || game || null;
  }

  function winnerFromGame(game) {
    const canonical = canonicalScheduleGame(game);
    if (!isFinalGame(canonical)) return null;

    const homeScore = Number(canonical?.homeScore);
    const awayScore = Number(canonical?.awayScore);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore === awayScore) {
      return null;
    }

    return homeScore > awayScore
      ? canonical.homeTeamId
      : canonical.awayTeamId;
  }

  function cancelUnneededSeriesGames(series) {
    if (!series?.winnerTeamId) return 0;

    const state = WorldEngine.state;
    const removableIds = new Set();

    (series.games || []).forEach(game => {
      const canonical = canonicalScheduleGame(game);
      if (isFinalGame(canonical)) return;

      game.canceled = true;
      game.status = 'not-needed';
      game.completed = true;
      game.completedAt = series.completedDate || currentDate();
      removableIds.add(String(game.id || game.eventId || game.gameId || ''));
    });

    if (!removableIds.size) return 0;

    const before = state.schedule.length;
    state.schedule = state.schedule.filter(event =>
      !removableIds.has(String(event?.id || event?.eventId || event?.gameId || ''))
    );

    return before - state.schedule.length;
  }

  function reconcileSeries(series) {
    if (!series || series.status === 'complete') return false;

    const wins = {
      [series.higherSeedTeamId]: 0,
      [series.lowerSeedTeamId]: 0,
    };
    let latestCompletedDate = null;

    for (const game of series.games || []) {
      const canonical = canonicalScheduleGame(game);
      const winner = winnerFromGame(canonical);
      if (!winner) continue;

      wins[winner] = (Number(wins[winner]) || 0) + 1;
      latestCompletedDate = dateKey(canonical?.date) || latestCompletedDate;
    }

    series.wins = wins;

    const winnerTeamId = Object.keys(wins).find(teamId =>
      Number(wins[teamId]) >= SERIES_WINS_REQUIRED
    ) || null;

    if (!winnerTeamId) {
      series.status = Object.values(wins).some(value => Number(value) > 0)
        ? 'in-progress'
        : 'scheduled';
      return false;
    }

    series.status = 'complete';
    series.winnerTeamId = winnerTeamId;
    series.loserTeamId = String(winnerTeamId) === String(series.higherSeedTeamId)
      ? series.lowerSeedTeamId
      : series.higherSeedTeamId;
    series.completedDate = latestCompletedDate || currentDate();
    cancelUnneededSeriesGames(series);
    return true;
  }

  function createSemifinals(postseason) {
    const existing = postseason?.bracket?.rounds?.semifinals || [];
    if (existing.length) return false;

    const roundOne = postseason?.bracket?.rounds?.roundOne || [];
    if (roundOne.length !== 2 || roundOne.some(series => series.status !== 'complete')) {
      return false;
    }

    const advancingTeamIds = [
      seedEntry(1, postseason)?.teamId,
      seedEntry(2, postseason)?.teamId,
      ...roundOne.map(series => series.winnerTeamId),
    ].filter(Boolean);

    if (advancingTeamIds.length !== 4) return false;

    const advancingSeeds = advancingTeamIds
      .map(teamId => seedForTeam(teamId, postseason))
      .filter(Boolean)
      .sort((a, b) => Number(a.seed) - Number(b.seed));

    if (advancingSeeds.length !== 4) return false;

    const semifinals = [
      createSeries({
        seriesId: 'semifinal-a',
        round: 'semifinals',
        higherSeed: advancingSeeds[0],
        lowerSeed: advancingSeeds[3],
        startDate: postseason.semifinalStartDate,
      }),
      createSeries({
        seriesId: 'semifinal-b',
        round: 'semifinals',
        higherSeed: advancingSeeds[1],
        lowerSeed: advancingSeeds[2],
        startDate: postseason.semifinalStartDate,
      }),
    ].filter(Boolean);

    if (semifinals.length !== 2) return false;

    postseason.bracket.rounds.semifinals = semifinals;
    postseason.status = 'semifinals';
    appendGamesToSchedule(semifinals.flatMap(series => series.games));
    return true;
  }

  function createChampionship(postseason) {
    const existing = postseason?.bracket?.rounds?.championship || [];
    if (existing.length) return false;

    const semifinals = postseason?.bracket?.rounds?.semifinals || [];
    if (semifinals.length !== 2 || semifinals.some(series => series.status !== 'complete')) {
      return false;
    }

    const finalists = semifinals
      .map(series => seedForTeam(series.winnerTeamId, postseason))
      .filter(Boolean)
      .sort((a, b) => Number(a.seed) - Number(b.seed));

    if (finalists.length !== 2) return false;

    const championship = createSeries({
      seriesId: 'championship',
      round: 'championship',
      higherSeed: finalists[0],
      lowerSeed: finalists[1],
      startDate: postseason.championshipStartDate,
    });

    if (!championship) return false;

    postseason.bracket.rounds.championship = [championship];
    postseason.status = 'championship';
    appendGamesToSchedule(championship.games);
    return true;
  }

  function recordChampion(postseason) {
    if (!postseason || postseason.championTeamId) return false;

    const championship = postseason?.bracket?.rounds?.championship?.[0] || null;
    if (!championship || championship.status !== 'complete' || !championship.winnerTeamId) {
      return false;
    }

    const state = ensureContainers();
    const championTeamId = championship.winnerTeamId;
    const completedDate = championship.completedDate || currentDate();
    const seasonId = state?.season?.id || state?.currentSeason || 'high-school-season';
    const historyId = `${seasonId}:high-school-champion`;

    postseason.championTeamId = championTeamId;
    postseason.completedDate = completedDate;
    postseason.status = 'complete';

    if (state.season?.postseason) {
      state.season.postseason.completed = true;
      state.season.postseason.championTeamId = championTeamId;
      state.season.phase = 'postseason-complete';
    }

    if (!state.history.champions.some(entry => String(entry?.id || '') === historyId)) {
      state.history.champions.push({
        id: historyId,
        seasonId,
        seasonLabel: state?.season?.label || state?.currentSeason || null,
        level: 'high-school',
        teamId: championTeamId,
        teamName: teamName(championTeamId),
        date: completedDate,
      });
    }

    if (!state.history.titles.some(entry => String(entry?.id || '') === historyId)) {
      state.history.titles.push({
        id: historyId,
        seasonId,
        seasonLabel: state?.season?.label || state?.currentSeason || null,
        level: 'high-school',
        title: 'League Champion',
        teamId: championTeamId,
        teamName: teamName(championTeamId),
        date: completedDate,
      });
    }

    if (WorldEngine.news?.publish) {
      WorldEngine.news.publish({
        date: completedDate,
        tag: 'CHAMPIONS',
        headline: `${teamName(championTeamId)} wins the high school league championship.`,
      });
    }

    return true;
  }

  function reconcileHighSchoolPostseason(options = {}) {
    const state = ensureContainers();
    let changed = false;

    if (!state.postseason.highSchool?.initialized) {
      const endDate = getHighSchoolRegularSeasonEndDate();
      const now = currentDate();
      if (endDate && now && now >= endDate && regularSeasonComplete()) {
        const initialized = initializeHighSchoolPostseason({ save: false });
        if (initialized?.initialized) changed = true;
      }
    }

    const postseason = state.postseason.highSchool;
    if (!postseason?.initialized) {
      refreshCanonicalStandings();
      if (changed && options.save !== false) WorldEngine.save();
      return { changed, postseason: postseason || null };
    }

    const rounds = postseason.bracket?.rounds || {};

    for (const series of rounds.roundOne || []) {
      if (reconcileSeries(series)) changed = true;
    }

    if (createSemifinals(postseason)) changed = true;

    for (const series of postseason.bracket?.rounds?.semifinals || []) {
      if (reconcileSeries(series)) changed = true;
    }

    if (createChampionship(postseason)) changed = true;

    for (const series of postseason.bracket?.rounds?.championship || []) {
      if (reconcileSeries(series)) changed = true;
    }

    if (recordChampion(postseason)) changed = true;

    refreshCanonicalStandings();

    if (changed && options.save !== false) WorldEngine.save();
    return { changed, postseason };
  }

  function nextDateAfter(value) {
    return addDays(value, 1);
  }

  function buildSimulationSummary(daysAdvanced, dateProcessingResults, crossedWeeks, weeklyProcessingResults) {
    const summary = {
      daysAdvanced,
      processedDates: dateProcessingResults.length,
      totalEvents: 0,
      completedEvents: 0,
      pendingEvents: 0,
      eventTypes: {},
      crossedWeeks,
      weeklyProcessingResults,
    };

    dateProcessingResults.forEach(day => {
      (day?.eventResults || []).forEach(event => {
        summary.totalEvents += 1;
        if (event?.resolved) summary.completedEvents += 1;
        else summary.pendingEvents += 1;
        const type = event?.type || 'unknown';
        summary.eventTypes[type] = (summary.eventTypes[type] || 0) + 1;
      });
    });

    return summary;
  }

  function advanceToDateWithLifecycle(targetDate, options = {}) {
    const target = dateKey(targetDate);
    const start = currentDate();

    if (!target || !start || target <= start) {
      const result = originalAdvanceToDate(targetDate, options);
      reconcileHighSchoolPostseason({ save: options.save });
      return result;
    }

    let dateProcessingResults = [];
    let crossedWeeks = [];
    let weeklyProcessingResults = [];
    let daysAdvanced = 0;
    let lastResult = null;
    let stopSimulation = false;
    let blockingDateResult = null;

    const maximumDays = Math.max(1, Number(options.maximumDays) || 730);

    while (currentDate() < target && daysAdvanced < maximumDays) {
      reconcileHighSchoolPostseason({ save: false });

      const nextDate = nextDateAfter(currentDate());
      if (!nextDate) break;

      lastResult = originalAdvanceToDate(nextDate, {
        ...options,
        maximumDays: 1,
        save: false,
      });

      const stepDates = Array.isArray(lastResult?.dateProcessingResults)
        ? lastResult.dateProcessingResults
        : [];
      const stepWeeks = Array.isArray(lastResult?.crossedWeeks)
        ? lastResult.crossedWeeks
        : [];
      const stepWeekly = Array.isArray(lastResult?.weeklyProcessingResults)
        ? lastResult.weeklyProcessingResults
        : [];

      dateProcessingResults.push(...stepDates);
      crossedWeeks.push(...stepWeeks);
      weeklyProcessingResults.push(...stepWeekly);
      daysAdvanced += Math.max(0, Number(lastResult?.daysAdvanced) || 0);

      reconcileHighSchoolPostseason({ save: false });

      if (lastResult?.stopSimulation === true) {
        stopSimulation = true;
        blockingDateResult = lastResult?.blockingDateResult || lastResult;
        break;
      }

      if ((Number(lastResult?.daysAdvanced) || 0) <= 0 && currentDate() < target) {
        break;
      }
    }

    crossedWeeks = [...new Set(crossedWeeks)];

    if (options.save !== false && (daysAdvanced > 0 || stopSimulation)) {
      WorldEngine.save();
    }

    const reachedTarget = currentDate() === target;

    return {
      success: reachedTarget && !stopSimulation,
      currentDate: currentDate(),
      targetDate: target,
      daysAdvanced,
      dateProcessingResults,
      crossedWeeks,
      weeklyProcessingResults,
      simulationSummary: buildSimulationSummary(
        daysAdvanced,
        dateProcessingResults,
        crossedWeeks,
        weeklyProcessingResults
      ),
      stopSimulation,
      blockingDateResult,
      blockingEventResult:
        blockingDateResult?.blockingEventResult ||
        lastResult?.blockingEventResult ||
        null,
      reason: stopSimulation
        ? 'player-interaction-required'
        : reachedTarget
          ? 'target-reached'
          : daysAdvanced >= maximumDays
            ? 'maximum-days-reached'
            : lastResult?.reason || 'advance-failed',
    };
  }

  WorldEngine.getHighSchoolRegularSeasonEndDate = getHighSchoolRegularSeasonEndDate;
  WorldEngine.freezeHighSchoolRegularSeasonStandings = freezeHighSchoolRegularSeasonStandings;
  WorldEngine.getHighSchoolPostseason = () => {
    ensureContainers();
    return WorldEngine.state.postseason.highSchool;
  };
  WorldEngine.initializeHighSchoolPostseason = initializeHighSchoolPostseason;
  WorldEngine.reconcileHighSchoolPostseason = reconcileHighSchoolPostseason;
  WorldEngine.advanceToDate = advanceToDateWithLifecycle;

  /* Migrate current/older worlds lazily without changing any saved outcomes. */
  ensureContainers();
  refreshCanonicalStandings();
  reconcileHighSchoolPostseason({ save: false });
})();
