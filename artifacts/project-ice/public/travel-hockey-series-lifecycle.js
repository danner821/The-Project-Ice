'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  function travelState() {
    return WorldEngine.getTravelHockeyState?.() ||
      WorldEngine.state?.travelHockey ||
      null;
  }

  function activeCareerSeries(state = travelState()) {
    const roundKey = state?.tournament?.activeRound || null;
    if (!roundKey || roundKey === 'complete') return null;

    const playerTeamId = String(state?.playerTeamId || '');
    const series = state?.tournament?.rounds?.[roundKey] || [];
    const match = series.find(item =>
      item?.status !== 'complete' &&
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

    const active = activeCareerSeries(state);
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
        pruneClinchedCareerGames({ save:true });
        try { globalThis.refreshScheduleEvents?.(); } catch (_) {}
        return result;
      };
      wrappedApply.__projectIceSeriesLifecycleWrapped = true;
      wrappedApply.__projectIceSeriesLifecycleOriginal = originalApply;
      WorldEngine.applyTravelTournamentGameResult = wrappedApply;
    }

    pruneClinchedCareerGames({ save:true });
  }

  WorldEngine.pruneClinchedTravelCareerGames = pruneClinchedCareerGames;

  install();

  const engineLoader = document.getElementById('pi-travel-tournament-engine-loader');
  if (engineLoader) {
    if (engineLoader.dataset.loaded === 'true') install();
    else engineLoader.addEventListener('load', install, { once:true });
  }
})();
