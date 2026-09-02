'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MODULE_VERSION = 2;
  const WINDOW_DAYS = 7;
  const MIN_TRAININGS_PER_WINDOW = 1;

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const key = dateKey(value);
    if (!key) return null;
    const date = new Date(`${key}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function travelState() {
    return WorldEngine.getTravelHockeyState?.() ||
      WorldEngine.state?.travelHockey ||
      null;
  }

  function schedule() {
    const world = WorldEngine.state;
    if (!world) return [];
    if (!Array.isArray(world.schedule)) world.schedule = [];
    return world.schedule;
  }

  function isTravelGame(event) {
    return event?.type === 'travel-game';
  }

  function isTravelTraining(event) {
    return event?.travelTournamentTraining === true;
  }

  function activeEvent(event) {
    return event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed';
  }

  function hasAnyEventOnDate(events, date) {
    return events.some(event =>
      activeEvent(event) &&
      dateKey(event?.date) === date
    );
  }

  function gameDates(events) {
    return events
      .filter(event => isTravelGame(event) && activeEvent(event))
      .map(event => dateKey(event.date))
      .filter(Boolean)
      .sort();
  }

  function previousTravelGameDate(events, beforeDate) {
    return gameDates(events)
      .filter(date => date < beforeDate)
      .reverse()[0] || null;
  }

  function nextTravelGameDate(events, afterDate) {
    return gameDates(events)
      .filter(date => date > afterDate)[0] || null;
  }

  function buildTrainingEvent(date, windowIndex) {
    const id = `travel-training-${date}`;

    return {
      id,
      eventId: id,
      date,
      type: 'practice',
      eventType: 'practice',
      eventKey: 'practice-systems',
      label: 'Travel Hockey Training',
      shortLabel: 'Travel Training',
      icon: '🏒',
      location: 'Travel Team Rink',
      objective: 'Stay sharp and keep developing during the summer tournament.',
      description: 'A focused summer travel session built around skill work, team execution, and development.',
      focus: 'systems',
      requiresPlayerInteraction: true,
      isCareerEvent: true,
      travelTournament: true,
      travelTournamentTraining: true,
      seasonType: 'travel',
      completed: false,
      played: false,
      status: 'scheduled',
      cadenceVersion: MODULE_VERSION,
      cadenceWindow: windowIndex,
    };
  }

  function chooseTrainingDate(events, windowStart, windowEnd) {
    const candidates = [];

    for (
      let date = windowStart;
      date && date <= windowEnd;
      date = addDays(date, 1)
    ) {
      if (hasAnyEventOnDate(events, date)) continue;

      const previousGame = previousTravelGameDate(events, date);
      const nextGame = nextTravelGameDate(events, date);
      let score = 0;

      if (nextGame && addDays(date, 1) === nextGame) score += 5;
      if (previousGame && addDays(previousGame, 1) === date) score += 3;

      const offset = Math.round(
        (new Date(`${date}T12:00:00`) - new Date(`${windowStart}T12:00:00`)) /
        86400000
      );
      if (offset === 3 || offset === 4) score += 1;

      candidates.push({ date, score });
    }

    candidates.sort((a, b) =>
      (b.score - a.score) || a.date.localeCompare(b.date)
    );

    return candidates[0]?.date || null;
  }

  function removeStaleFutureTrainings(events, tournamentComplete) {
    if (!tournamentComplete) return false;

    const before = events.length;
    const filtered = events.filter(event =>
      !(
        isTravelTraining(event) &&
        event?.completed !== true &&
        event?.played !== true
      )
    );

    if (filtered.length === before) return false;
    WorldEngine.state.schedule = filtered;
    return true;
  }

  function syncTravelTournamentCadence(options = {}) {
    const state = travelState();
    const world = WorldEngine.state;
    if (!state?.tournament || !world) return false;

    let events = schedule();
    const tournamentComplete =
      state.tournament.status === 'complete' || state.completed === true;

    let changed = removeStaleFutureTrainings(events, tournamentComplete);
    if (tournamentComplete) {
      if (changed && options.save !== false) WorldEngine.save?.();
      return changed;
    }

    events = schedule();
    const dates = gameDates(events);
    if (dates.length === 0) return changed;

    const firstGameDate = dates[0];
    const lastKnownGameDate = dates[dates.length - 1];

    let windowIndex = 0;
    for (
      let windowStart = firstGameDate;
      windowStart && windowStart <= lastKnownGameDate;
      windowStart = addDays(windowStart, WINDOW_DAYS)
    ) {
      const windowEnd = addDays(windowStart, WINDOW_DAYS - 1);
      const existingTraining = events.filter(event =>
        isTravelTraining(event) &&
        activeEvent(event) &&
        dateKey(event.date) >= windowStart &&
        dateKey(event.date) <= windowEnd
      );

      if (existingTraining.length < MIN_TRAININGS_PER_WINDOW) {
        const trainingDate = chooseTrainingDate(
          events,
          windowStart,
          windowEnd
        );

        if (trainingDate) {
          events.push(buildTrainingEvent(trainingDate, windowIndex));
          events.sort((a, b) =>
            String(a?.date || '').localeCompare(String(b?.date || '')) ||
            String(a?.eventId || a?.id || '').localeCompare(
              String(b?.eventId || b?.id || '')
            )
          );
          changed = true;
        }
      }

      windowIndex += 1;
    }

    state.tournament.cadence = {
      ...(state.tournament.cadence || {}),
      version: MODULE_VERSION,
      trainingSessionsPerSevenDays: MIN_TRAININGS_PER_WINDOW,
      gamesEveryOtherDay: true,
    };

    if (changed && options.save !== false) {
      WorldEngine.save?.();
    }

    return changed;
  }

  WorldEngine.syncTravelTournamentCadence = syncTravelTournamentCadence;

  function installResultHookAndSync() {
    const originalApplyTravelResult =
      typeof WorldEngine.applyTravelTournamentGameResult === 'function'
        ? WorldEngine.applyTravelTournamentGameResult
        : null;

    if (
      originalApplyTravelResult &&
      originalApplyTravelResult.__projectIceTravelCadenceWrapped !== true
    ) {
      const wrappedApplyTravelTournamentGameResult = (...args) => {
        const result = originalApplyTravelResult.apply(WorldEngine, args);
        syncTravelTournamentCadence({ save: true });
        return result;
      };

      wrappedApplyTravelTournamentGameResult
        .__projectIceTravelCadenceWrapped = true;
      wrappedApplyTravelTournamentGameResult
        .__projectIceTravelCadenceOriginal = originalApplyTravelResult;

      WorldEngine.applyTravelTournamentGameResult =
        wrappedApplyTravelTournamentGameResult;
    }

    return syncTravelTournamentCadence({ save: true });
  }

  /*
   * travel-hockey-season-ui.js injects the tournament engine asynchronously.
   * This cadence file is part of the normal Vite runtime stack, so it can run
   * before that dynamic script has finished creating the Travel game schedule.
   * Sync once now for already-loaded careers, then sync again exactly when the
   * tournament engine finishes loading. That makes both fresh and resumed
   * Travel tournaments deterministic without polling.
   */
  installResultHookAndSync();

  const engineLoader =
    document.getElementById('pi-travel-tournament-engine-loader');

  if (engineLoader) {
    if (engineLoader.dataset.loaded === 'true') {
      installResultHookAndSync();
    } else {
      engineLoader.addEventListener(
        'load',
        installResultHookAndSync,
        { once: true }
      );
    }
  }
})();
