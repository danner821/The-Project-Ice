'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__seasonDevelopmentSnapshotInstalled === true) return;
  WorldEngine.__seasonDevelopmentSnapshotInstalled = true;

  const VERSION = 4;

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

  function careerOpeningOverall(player = careerPlayer()) {
    /*
     * Season-opening snapshots are the durable historical source of truth.
     * startingOverall can be rewritten by later tryout/load flows, so it must
     * never outrank an older verified opening snapshot when calculating
     * career growth.
     */
    const snapshots = orderedSnapshots();

    for (const record of snapshots) {
      const savedCareerOpening = Number(record?.careerOpeningOverall);
      if (Number.isFinite(savedCareerOpening) && savedCareerOpening > 0) {
        return savedCareerOpening;
      }
    }

    const earliest = snapshots[0];
    const earliestOverall = Number(earliest?.overall);
    if (Number.isFinite(earliestOverall) && earliestOverall > 0) {
      return earliestOverall;
    }

    const world = WorldEngine.state;
    const gamePlayer = typeof Game !== 'undefined' ? Game?.player : null;
    const explicitCandidates = [
      player?.startingOverall,
      world?.player?.startingOverall,
      gamePlayer?.startingOverall,
    ];

    for (const candidate of explicitCandidates) {
      const value = Number(candidate);
      if (Number.isFinite(value) && value > 0) return value;
    }

    const current = Number(player?.overall);
    return Number.isFinite(current) ? current : 0;
  }

  function snapshotRecord(player) {
    return {
      version: VERSION,
      seasonId: seasonId(),
      schoolYear: schoolYear(),
      capturedAt: currentDate(),
      playerId: idOf(player),
      overall: Number(player?.overall || 0),
      careerOpeningOverall: careerOpeningOverall(player),
      potential: player?.potential || null,
      attributes: attributesOf(player),
    };
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

  function repairCareerOpening(record, player) {
    if (!record || typeof record !== 'object') return false;
    const canonical = careerOpeningOverall(player);
    const existing = Number(record.careerOpeningOverall);
    if (!Number.isFinite(canonical) || canonical <= 0) return false;
    if (Number.isFinite(existing) && existing === canonical) return false;
    record.careerOpeningOverall = canonical;
    record.version = VERSION;
    return true;
  }

  function capture(options = {}) {
    const player = careerPlayer();
    const key = String(options.seasonId || seasonId() || '');
    const store = root();

    if (!player || !key || !store) {
      return {
        captured: false,
        reason: 'season-or-player-unavailable',
      };
    }

    if (store[key] && options.force !== true) {
      const repaired = repairCareerOpening(store[key], player);
      syncLegacySeasonBaseline(player, store[key]);
      if (repaired && options.save !== false) WorldEngine.save?.();
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

  function growthSummary() {
    const player = careerPlayer();
    if (!player) return null;

    const currentOverall = Number(player.overall) || 0;
    const currentOpening = get();
    const currentSchoolYear = schoolYear();

    /*
     * A small number of rollover saves captured the new-year event before the
     * season identity finished advancing. In those saves, get() can return the
     * prior year's opening snapshot (for example freshman 68 OVR while the
     * player is already a sophomore). Detect that mismatch and use the most
     * recent completed season's ending overall as the new season baseline.
     */
    const openingSchoolYear = String(currentOpening?.schoolYear || '');
    const openingMatchesCurrentSeason =
      currentOpening &&
      (
        !currentSchoolYear ||
        !openingSchoolYear ||
        openingSchoolYear === currentSchoolYear
      );

    const archives =
      typeof WorldEngine.getHighSchoolSeasonArchives === 'function'
        ? WorldEngine.getHighSchoolSeasonArchives()
        : [];

    const latestCompletedArchive =
      Array.isArray(archives) && archives.length > 0
        ? archives[archives.length - 1]
        : null;

    const previousSeasonEndingOverall =
      Number(latestCompletedArchive?.careerPlayer?.overall) || 0;

    const seasonOpeningOverall =
      openingMatchesCurrentSeason
        ? (Number(currentOpening?.overall) || currentOverall)
        : (previousSeasonEndingOverall || Number(currentOpening?.overall) || currentOverall);

    const originalCareerOverall = careerOpeningOverall(player) || currentOverall;

    return {
      currentOverall,
      seasonOpeningOverall,
      careerOpeningOverall: originalCareerOverall,
      seasonGrowth: currentOverall - seasonOpeningOverall,
      careerGrowth: currentOverall - originalCareerOverall,
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
    event => {
      /*
       * Use the transition payload's seasonId directly. This avoids an event
       * ordering race where another listener has not yet copied the new season
       * identity onto WorldEngine.state when this handler runs.
       */
      capture({
        save: true,
        seasonId: event?.detail?.seasonId || seasonId(),
      });
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
