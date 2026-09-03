'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__seasonDevelopmentSnapshotInstalled === true) return;
  WorldEngine.__seasonDevelopmentSnapshotInstalled = true;

  const VERSION = 1;

  const clone = value => value == null ? value : structuredClone(value);
  const idOf = player => String(player?.playerId || player?.id || '');

  function careerPlayer() {
    const world = WorldEngine.state;
    if (!world) return null;
    return (world.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) || world.player || Game?.player || null;
  }

  function seasonId() {
    const world = WorldEngine.state;
    const season = world?.season || {};
    if (season.seasonId) return String(season.seasonId);
    const index = Number.isFinite(Number(season.careerYearIndex)) ? Number(season.careerYearIndex) : 0;
    return WorldEngine.getHighSchoolSeasonIdentity?.(index)?.seasonId || '';
  }

  function schoolYear() {
    const world = WorldEngine.state;
    const player = careerPlayer();
    return String(
      world?.season?.schoolYear ||
      player?.schoolYear ||
      player?.year ||
      ''
    );
  }

  function currentDate() {
    const world = WorldEngine.state;
    return String(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate ||
      Game?.player?.currentDate ||
      ''
    ).slice(0, 10);
  }

  function attributesOf(player) {
    return clone(player?.attributes || {});
  }

  function snapshotRecord(player) {
    return {
      version: VERSION,
      seasonId: seasonId(),
      schoolYear: schoolYear(),
      capturedAt: currentDate(),
      playerId: idOf(player),
      overall: Number(player?.overall || 0),
      potential: player?.potential || null,
      attributes: attributesOf(player),
    };
  }

  function root() {
    const world = WorldEngine.state;
    if (!world) return null;
    world.history = world.history && typeof world.history === 'object' ? world.history : {};
    world.history.seasonOpeningDevelopment = world.history.seasonOpeningDevelopment && typeof world.history.seasonOpeningDevelopment === 'object'
      ? world.history.seasonOpeningDevelopment
      : {};
    return world.history.seasonOpeningDevelopment;
  }

  function capture(options = {}) {
    const player = careerPlayer();
    const key = seasonId();
    const store = root();
    if (!player || !key || !store) return { captured: false, reason: 'season-or-player-unavailable' };

    if (store[key] && options.force !== true) {
      return { captured: false, reason: 'already-captured', record: clone(store[key]) };
    }

    const record = snapshotRecord(player);
    store[key] = record;
    if (options.save !== false) WorldEngine.save?.();
    return { captured: true, record: clone(record) };
  }

  function get(id = seasonId()) {
    const store = root();
    const record = store?.[String(id || '')] || null;
    return record ? clone(record) : null;
  }

  function captureFreshSeasonAfterTryouts(result) {
    const phase = String(WorldEngine.state?.season?.phase || '').toLowerCase();
    if (!['offseason', 'postseason', 'postseason-break'].includes(phase)) {
      capture({ save: true });
    }
    return result;
  }

  const originalFinalize = WorldEngine.finalizeFreshCareerAfterTryouts;
  if (typeof originalFinalize === 'function' && originalFinalize.__seasonSnapshotWrapped !== true) {
    const wrapped = function(...args) {
      const result = originalFinalize.apply(WorldEngine, args);
      captureFreshSeasonAfterTryouts(result);
      return result;
    };
    wrapped.__seasonSnapshotWrapped = true;
    WorldEngine.finalizeFreshCareerAfterTryouts = wrapped;
  }

  WorldEngine.captureHighSchoolSeasonOpeningDevelopmentSnapshot = capture;
  WorldEngine.getHighSchoolSeasonOpeningDevelopmentSnapshot = get;
})();
