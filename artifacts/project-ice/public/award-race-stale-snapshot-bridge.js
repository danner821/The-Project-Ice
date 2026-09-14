'use strict';

/* global WorldEngine, Game, renderLeagueAwardsPreview */
(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__awardRaceStaleSnapshotBridgeInstalled === true) return;
  WorldEngine.__awardRaceStaleSnapshotBridgeInstalled = true;

  function playerGamesPlayed(player = {}) {
    const stats = player.seasonStats || player.stats || {};
    return Math.max(
      0,
      Number(
        stats.gamesPlayed ??
        stats.gp ??
        player.gamesPlayed ??
        player.gp
      ) || 0
    );
  }

  function leagueHasPlayedGames() {
    return (WorldEngine.state?.teams || []).some(team =>
      (Array.isArray(team?.roster) ? team.roster : [])
        .some(player => playerGamesPlayed(player) > 0)
    );
  }

  function canonicalRaceHasContenders(races = []) {
    return races.some(race =>
      Array.isArray(race?.contenders) && race.contenders.length > 0
    );
  }

  function invalidateStaleEmptySnapshot() {
    const livingWorld = WorldEngine.state?.livingWorld;
    if (!livingWorld) return false;

    const races = Array.isArray(livingWorld.currentAwardRaces)
      ? livingWorld.currentAwardRaces
      : [];

    if (!races.length) return false;
    if (canonicalRaceHasContenders(races)) return false;
    if (!leagueHasPlayedGames()) return false;

    /*
     * A preseason/Monday Living World snapshot can legitimately contain the
     * award definitions with zero contenders. If games are then played before
     * the next weekly snapshot, that empty array is stale. The League UI sees
     * a non-empty canonical array and never reaches its existing live-stat
     * fallback, which leaves "No award races yet" on screen even though stats
     * are already accumulating.
     *
     * Clear only the stale current pointer. Historical weekly snapshots remain
     * untouched, and the next Living World weekly pass will replace this with
     * a fresh canonical race snapshot. Until then the existing League renderer
     * correctly derives the current race from live season stats.
     */
    livingWorld.currentAwardRaces = [];
    return true;
  }

  const baseRenderLeagueAwardsPreview =
    typeof globalThis.renderLeagueAwardsPreview === 'function'
      ? globalThis.renderLeagueAwardsPreview
      : null;

  if (baseRenderLeagueAwardsPreview) {
    globalThis.renderLeagueAwardsPreview = function(...args) {
      invalidateStaleEmptySnapshot();
      return baseRenderLeagueAwardsPreview.apply(this, args);
    };
  }

  document.addEventListener('click', event => {
    const tab = event.target?.closest?.(
      '[data-tab], [data-hub-tab], [data-tab-target], .hub-tab'
    );
    const label = String(
      tab?.dataset?.tab ||
      tab?.dataset?.hubTab ||
      tab?.dataset?.tabTarget ||
      tab?.textContent ||
      ''
    ).toLowerCase();

    if (label.includes('league')) {
      invalidateStaleEmptySnapshot();
    }
  }, true);

  WorldEngine.invalidateStaleAwardRaceSnapshot = invalidateStaleEmptySnapshot;
  invalidateStaleEmptySnapshot();
})();