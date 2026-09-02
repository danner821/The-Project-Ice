'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const dateKey = value => String(value || '').slice(0, 10);

  function travelState() {
    return WorldEngine.getTravelHockeyState?.() ||
      WorldEngine.state?.travelHockey ||
      null;
  }

  function currentCareerDate() {
    return dateKey(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate ||
      ''
    );
  }

  function setCareerDate(date) {
    const key = dateKey(date);
    if (!key) return;
    if (!WorldEngine.state.season || typeof WorldEngine.state.season !== 'object') {
      WorldEngine.state.season = {};
    }
    if (!WorldEngine.state.player || typeof WorldEngine.state.player !== 'object') {
      WorldEngine.state.player = {};
    }
    WorldEngine.state.season.currentDate = key;
    WorldEngine.state.player.currentDate = key;
    WorldEngine.state.currentDate = key;
  }

  function playerSeries(state = travelState(), includeComplete = false) {
    const roundKey = state?.tournament?.activeRound || null;
    if (!roundKey || roundKey === 'complete') return null;

    const playerTeamId = String(state?.playerTeamId || '');
    const series = state?.tournament?.rounds?.[roundKey] || [];
    const match = series.find(item =>
      (includeComplete || item?.status !== 'complete') &&
      (
        String(item?.teamAId || '') === playerTeamId ||
        String(item?.teamBId || '') === playerTeamId
      )
    ) || null;

    return match ? { roundKey, series: match } : null;
  }

  function pruneClinchedCareerGames(options = {}) {
    const state = travelState();
    const world = WorldEngine.state;
    if (!state?.tournament || !world || !Array.isArray(world.schedule)) return false;

    const active = playerSeries(state, false);
    const activeSeriesId = active?.series?.seriesId || null;
    const before = world.schedule.length;

    world.schedule = world.schedule.filter(event => {
      if (event?.type !== 'travel-game') return true;
      if (event?.isCompleted === true || event?.completed === true || event?.played === true) return true;

      return Boolean(
        activeSeriesId &&
        String(event?.travelSeriesId || '') === String(activeSeriesId)
      );
    });

    const changed = world.schedule.length !== before;
    if (changed && options.save !== false) WorldEngine.save?.();
    return changed;
  }

  function advanceBracketAfterCareerClinch(options = {}) {
    const state = travelState();
    const tournament = state?.tournament;
    if (!state || !tournament || tournament.status === 'complete') return false;

    const career = playerSeries(state, true);
    if (!career || career.series?.status !== 'complete') return false;

    const startingRound = career.roundKey;
    const roundSeries = tournament.rounds?.[startingRound] || [];
    if (!roundSeries.some(series => series?.status !== 'complete')) return false;
    if (typeof WorldEngine.simulateNextTravelTournamentDay !== 'function') return false;

    const now = currentCareerDate();
    const tournamentDate = dateKey(tournament.currentGameDate);
    if (now && (!tournamentDate || now > tournamentDate)) {
      tournament.currentGameDate = now;
    }

    let changed = false;
    let safety = 0;
    while (
      safety < 3 &&
      tournament.status !== 'complete' &&
      tournament.activeRound === startingRound &&
      (tournament.rounds?.[startingRound] || []).some(series => series?.status !== 'complete')
    ) {
      const result = WorldEngine.simulateNextTravelTournamentDay();
      if (!result?.success) break;
      changed = true;
      safety += 1;
    }

    if (changed) {
      WorldEngine.syncCareerTravelSchedule?.(state);
      pruneClinchedCareerGames({ save:false });
      WorldEngine.syncTravelTournamentCadence?.({ save:false });
      if (options.save !== false) WorldEngine.save?.();
      try { globalThis.refreshScheduleEvents?.(); } catch (_) {}
      try { globalThis.refreshCareerUI?.(); } catch (_) {}
    }

    return changed;
  }

  function advanceEliminatedTournamentThroughDate(targetDate = currentCareerDate(), options = {}) {
    const state = travelState();
    const tournament = state?.tournament;
    const throughDate = dateKey(targetDate);
    if (
      !state ||
      !tournament ||
      !throughDate ||
      tournament.status === 'complete' ||
      typeof WorldEngine.simulateNextTravelTournamentDay !== 'function'
    ) return false;

    // If the career team is still alive in the active round, its games must stay player-controlled.
    if (playerSeries(state, false)) return false;

    const preservedCareerDate = currentCareerDate() || throughDate;
    let changed = false;
    let safety = 0;

    while (
      safety < 8 &&
      tournament.status !== 'complete'
    ) {
      const tournamentDate = dateKey(tournament.currentGameDate);
      if (!tournamentDate || tournamentDate > throughDate) break;

      const result = WorldEngine.simulateNextTravelTournamentDay();
      if (!result?.success) break;
      changed = true;
      safety += 1;

      // simulateNextTravelTournamentDay advances the shared world date to the
      // tournament game date. An eliminated career should keep living on its
      // own calendar, so restore the date the player had already reached.
      setCareerDate(preservedCareerDate);
    }

    if (changed) {
      setCareerDate(preservedCareerDate);
      WorldEngine.syncCareerTravelSchedule?.(state);
      pruneClinchedCareerGames({ save:false });
      WorldEngine.syncTravelTournamentCadence?.({ save:false });
      if (options.save !== false) WorldEngine.save?.();
      try { globalThis.refreshScheduleEvents?.(); } catch (_) {}
      try { globalThis.refreshCareerUI?.(); } catch (_) {}
      try { WorldEngine.renderTravelTournamentCloseout?.(); } catch (_) {}
    }

    return changed;
  }

  function install() {
    const originalSync = WorldEngine.syncCareerTravelSchedule;
    if (
      typeof originalSync === 'function' &&
      originalSync.__projectIceSeriesLifecycleWrapped !== true
    ) {
      const wrappedSync = (...args) => {
        const result = originalSync.apply(WorldEngine, args);
        pruneClinchedCareerGames({ save:false });
        return result;
      };
      wrappedSync.__projectIceSeriesLifecycleWrapped = true;
      wrappedSync.__projectIceSeriesLifecycleOriginal = originalSync;
      WorldEngine.syncCareerTravelSchedule = wrappedSync;
    }

    const originalApply = WorldEngine.applyTravelTournamentGameResult;
    if (
      typeof originalApply === 'function' &&
      originalApply.__projectIceSeriesLifecycleWrapped !== true
    ) {
      const wrappedApply = (...args) => {
        const result = originalApply.apply(WorldEngine, args);
        pruneClinchedCareerGames({ save:false });
        advanceBracketAfterCareerClinch({ save:false });
        pruneClinchedCareerGames({ save:false });
        WorldEngine.save?.();
        try { globalThis.refreshScheduleEvents?.(); } catch (_) {}
        return result;
      };
      wrappedApply.__projectIceSeriesLifecycleWrapped = true;
      wrappedApply.__projectIceSeriesLifecycleOriginal = originalApply;
      WorldEngine.applyTravelTournamentGameResult = wrappedApply;
    }

    const originalAdvanceToDate = WorldEngine.advanceToDate;
    if (
      typeof originalAdvanceToDate === 'function' &&
      originalAdvanceToDate.__projectIceTravelEliminationWrapped !== true
    ) {
      const wrappedAdvanceToDate = (...args) => {
        const result = originalAdvanceToDate.apply(WorldEngine, args);
        advanceEliminatedTournamentThroughDate(currentCareerDate(), { save:true });
        return result;
      };
      wrappedAdvanceToDate.__projectIceTravelEliminationWrapped = true;
      wrappedAdvanceToDate.__projectIceTravelEliminationOriginal = originalAdvanceToDate;
      WorldEngine.advanceToDate = wrappedAdvanceToDate;
    }

    pruneClinchedCareerGames({ save:false });
    advanceBracketAfterCareerClinch({ save:false });
    advanceEliminatedTournamentThroughDate(currentCareerDate(), { save:false });
    pruneClinchedCareerGames({ save:false });
    WorldEngine.save?.();
  }

  WorldEngine.pruneClinchedTravelCareerGames = pruneClinchedCareerGames;
  WorldEngine.advanceTravelBracketAfterCareerClinch = advanceBracketAfterCareerClinch;
  WorldEngine.advanceEliminatedTravelTournamentThroughDate = advanceEliminatedTournamentThroughDate;

  install();

  const engineLoader = document.getElementById('pi-travel-tournament-engine-loader');
  if (engineLoader) {
    if (engineLoader.dataset.loaded === 'true') install();
    else engineLoader.addEventListener('load', install, { once:true });
  }
})();
