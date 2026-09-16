'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__seasonDevelopmentSnapshotInstalled === true) return;
  WorldEngine.__seasonDevelopmentSnapshotInstalled = true;

  const VERSION = 2;

  const clone = value => value == null ? value : structuredClone(value);
  const idOf = player => String(player?.playerId || player?.id || '');

  function careerPlayer() {
    const world = WorldEngine.state;
    if (!world) return null;
    return (world.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) ||
      world.player ||
      (typeof Game !== 'undefined' ? Game?.player : null) ||
      null;
  }

  function seasonId() {
    const world = WorldEngine.state;
    const season = world?.season || {};
    if (season.seasonId) return String(season.seasonId);
    const index = Number.isFinite(Number(season.careerYearIndex))
      ? Number(season.careerYearIndex)
      : 0;
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
      (typeof Game !== 'undefined' ? Game?.player?.currentDate : '') ||
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
    world.history =
      world.history && typeof world.history === 'object'
        ? world.history
        : {};
    world.history.seasonOpeningDevelopment =
      world.history.seasonOpeningDevelopment &&
      typeof world.history.seasonOpeningDevelopment === 'object'
        ? world.history.seasonOpeningDevelopment
        : {};
    return world.history.seasonOpeningDevelopment;
  }

  function syncLegacySeasonBaseline(player, record) {
    if (!player || !record) return;

    player.development =
      player.development && typeof player.development === 'object'
        ? player.development
        : {};
    player.development.seasonStartingOverall = Number(record.overall) || 0;

    const worldSnapshot = WorldEngine.state?.player;
    if (worldSnapshot && worldSnapshot !== player) {
      worldSnapshot.development =
        worldSnapshot.development && typeof worldSnapshot.development === 'object'
          ? worldSnapshot.development
          : {};
      worldSnapshot.development.seasonStartingOverall = Number(record.overall) || 0;
    }

    if (typeof Game !== 'undefined' && Game?.player && Game.player !== player) {
      Game.player.development =
        Game.player.development && typeof Game.player.development === 'object'
          ? Game.player.development
          : {};
      Game.player.development.seasonStartingOverall = Number(record.overall) || 0;
    }
  }

  function capture(options = {}) {
    const player = careerPlayer();
    const key = seasonId();
    const store = root();

    if (!player || !key || !store) {
      return {
        captured: false,
        reason: 'season-or-player-unavailable',
      };
    }

    if (store[key] && options.force !== true) {
      syncLegacySeasonBaseline(player, store[key]);
      return {
        captured: false,
        reason: 'already-captured',
        record: clone(store[key]),
      };
    }

    const record = snapshotRecord(player);
    store[key] = record;
    syncLegacySeasonBaseline(player, record);

    if (options.save !== false) WorldEngine.save?.();

    return {
      captured: true,
      record: clone(record),
    };
  }

  function get(id = seasonId()) {
    const store = root();
    const record = store?.[String(id || '')] || null;
    return record ? clone(record) : null;
  }

  function orderedSnapshots() {
    const store = root();
    return Object.values(store || {})
      .filter(record =>
        record &&
        Number.isFinite(Number(record.overall))
      )
      .sort((a, b) =>
        String(a?.capturedAt || '').localeCompare(String(b?.capturedAt || '')) ||
        String(a?.seasonId || '').localeCompare(String(b?.seasonId || ''))
      );
  }

  function growthSummary() {
    const player = careerPlayer();
    if (!player) return null;

    const currentOverall = Number(player.overall) || 0;
    const currentOpening = get();
    const snapshots = orderedSnapshots();
    const careerOpening = snapshots[0] || currentOpening || null;

    if (!currentOpening || !careerOpening) return null;

    const seasonOpeningOverall =
      Number(currentOpening.overall) || currentOverall;
    const careerOpeningOverall =
      Number(careerOpening.overall) || currentOverall;

    return {
      currentOverall,
      seasonOpeningOverall,
      careerOpeningOverall,
      seasonGrowth: currentOverall - seasonOpeningOverall,
      careerGrowth: currentOverall - careerOpeningOverall,
    };
  }

  function formatGrowth(value) {
    const safe = Number(value) || 0;
    return safe > 0 ? `+${safe} OVR` : `${safe} OVR`;
  }

  function renderGrowth() {
    const summary = growthSummary();
    if (!summary) return false;

    const seasonNode = document.getElementById('pp-growth-season');
    const careerNode = document.getElementById('pp-growth-career');
    if (!seasonNode || !careerNode) return false;

    seasonNode.textContent = formatGrowth(summary.seasonGrowth);
    careerNode.textContent = formatGrowth(summary.careerGrowth);
    return true;
  }

  function renderGrowthAfterCore() {
    requestAnimationFrame(() => {
      requestAnimationFrame(renderGrowth);
    });
  }

  function captureFreshSeasonAfterTryouts(result) {
    const phase = String(WorldEngine.state?.season?.phase || '').toLowerCase();
    if (!['offseason', 'postseason', 'postseason-break'].includes(phase)) {
      capture({ save: true });
      renderGrowthAfterCore();
    }
    return result;
  }

  const originalFinalize = WorldEngine.finalizeFreshCareerAfterTryouts;
  if (
    typeof originalFinalize === 'function' &&
    originalFinalize.__seasonSnapshotWrapped !== true
  ) {
    const wrapped = function(...args) {
      const result = originalFinalize.apply(WorldEngine, args);
      captureFreshSeasonAfterTryouts(result);
      return result;
    };
    wrapped.__seasonSnapshotWrapped = true;
    WorldEngine.finalizeFreshCareerAfterTryouts = wrapped;
  }

  window.addEventListener(
    'projectice:next-high-school-season-started',
    () => {
      capture({ save: true });
      renderGrowthAfterCore();
    }
  );

  document.addEventListener('click', event => {
    const target = event.target?.closest?.(
      '[data-tab], [data-hub-tab], [data-tab-target], .hub-tab'
    );

    const label = String(
      target?.dataset?.tab ||
      target?.dataset?.hubTab ||
      target?.dataset?.tabTarget ||
      target?.textContent ||
      ''
    ).trim().toLowerCase();

    if (label === 'player' || label.includes('player')) {
      renderGrowthAfterCore();
    }
  });

  WorldEngine.captureHighSchoolSeasonOpeningDevelopmentSnapshot = capture;
  WorldEngine.getHighSchoolSeasonOpeningDevelopmentSnapshot = get;
  WorldEngine.getHighSchoolGrowthSummary = growthSummary;
  WorldEngine.renderHighSchoolGrowthSummary = renderGrowth;

  renderGrowthAfterCore();
})();
