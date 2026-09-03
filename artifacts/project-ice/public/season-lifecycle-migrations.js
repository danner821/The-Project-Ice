'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MIGRATION_VERSION = 2;
  let lastObservedPostseason = null;
  let lastObservedVersion = null;

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
    const world = WorldEngine.state || {};
    return dateKey(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate
    );
  }

  function hasPlayedPlayoffGame() {
    return (WorldEngine.state?.schedule || []).some(game => {
      if (game?.isPlayoff !== true) return false;
      const hasScore =
        game?.homeScore !== null &&
        game?.homeScore !== undefined &&
        game?.awayScore !== null &&
        game?.awayScore !== undefined;
      return Boolean(
        game?.played === true ||
        game?.completed === true ||
        String(game?.status || '').toLowerCase() === 'final' ||
        hasScore
      );
    });
  }

  /*
   * Lifecycle migrations are allowed to backfill schema, never to move a
   * career backwards. Older saves can legitimately be missing the postseason
   * checkpoint fields even though the player has already reached awards,
   * Travel, or the offseason. Those states must not be re-initialized as a
   * fresh postseason break on load.
   */
  function hasAdvancedBeyondPostseason(world = WorldEngine.state || {}) {
    const phase = String(world?.season?.phase || '').trim().toLowerCase();
    const post = world?.postseason?.highSchool || null;
    const travel = world?.travelHockey || null;

    return Boolean(
      new Set([
        'postseason-complete',
        'awards',
        'offseason',
        'travel',
        'travel-hockey',
        'summer-travel',
      ]).has(phase) ||
      world?.season?.postseason?.completed === true ||
      post?.status === 'complete' ||
      Boolean(post?.championTeamId) ||
      travel?.tryoutResult ||
      travel?.placementLevel ||
      travel?.completed === true ||
      travel?.tournament?.closeoutAcknowledged === true
    );
  }

  function migrate() {
    const world = WorldEngine.state;
    const post = world?.postseason?.highSchool;
    if (!post?.initialized) return false;

    const needsMigration =
      Number(post.version || 0) < MIGRATION_VERSION ||
      !dateKey(post.checkpointDate) ||
      typeof post.checkpointAcknowledged !== 'boolean';
    if (!needsMigration) return false;

    const endDate =
      dateKey(post.regularSeasonEndDate) ||
      WorldEngine.getHighSchoolRegularSeasonEndDate?.() ||
      null;
    if (!endDate) return false;

    const advanced = hasAdvancedBeyondPostseason(world);
    const playoffAlreadyStarted = advanced || hasPlayedPlayoffGame();

    post.version = MIGRATION_VERSION;
    post.regularSeasonEndDate = endDate;
    post.checkpointDate = addDays(endDate, 7);
    post.playoffStartDate = dateKey(post.playoffStartDate) || addDays(endDate, 11);
    post.semifinalStartDate = dateKey(post.semifinalStartDate) || addDays(endDate, 17);
    post.championshipStartDate = dateKey(post.championshipStartDate) || addDays(endDate, 23);

    if (playoffAlreadyStarted) {
      post.checkpointAcknowledged = true;
      post.checkpointAcknowledgedAt =
        dateKey(post.checkpointAcknowledgedAt) ||
        post.checkpointDate ||
        currentDate();
    } else {
      post.checkpointAcknowledged = false;
      post.checkpointAcknowledgedAt = null;
      post.status = 'break';

      if (world.season?.postseason) {
        world.season.postseason.started = false;
        world.season.phase = 'postseason-break';
      }
    }

    WorldEngine.save?.();
    console.info('[SeasonLifecycle] Existing postseason save migrated to checkpoint schema.');
    return true;
  }

  function reconcileLoadedCareer() {
    const world = WorldEngine.state || {};
    const post = world?.postseason?.highSchool || null;

    /* Never create a new live bracket inside a career that is already later. */
    if (!post?.initialized && hasAdvancedBeyondPostseason(world)) {
      return;
    }

    WorldEngine.reconcileHighSchoolPostseason?.({ save: true });
    migrate();
  }

  const originalSelectCareerSave =
    typeof WorldEngine.selectCareerSave === 'function'
      ? WorldEngine.selectCareerSave.bind(WorldEngine)
      : null;

  if (originalSelectCareerSave) {
    WorldEngine.selectCareerSave = async (...args) => {
      const loaded = await originalSelectCareerSave(...args);
      if (loaded) {
        reconcileLoadedCareer();
        window.setTimeout(reconcileLoadedCareer, 0);
      }
      return loaded;
    };
  }

  function observeActiveCareer() {
    const world = WorldEngine.state || {};
    const post = world?.postseason?.highSchool || null;
    const version = post?.version ?? null;

    if (post !== lastObservedPostseason || version !== lastObservedVersion) {
      lastObservedPostseason = post;
      lastObservedVersion = version;

      if (!post?.initialized) {
        if (!hasAdvancedBeyondPostseason(world)) {
          WorldEngine.reconcileHighSchoolPostseason?.({ save: false });
        }
      }
      migrate();
      return;
    }

    if (
      post?.initialized &&
      (
        Number(post.version || 0) < MIGRATION_VERSION ||
        !dateKey(post.checkpointDate) ||
        typeof post.checkpointAcknowledged !== 'boolean'
      )
    ) {
      migrate();
    }
  }

  observeActiveCareer();
  window.setInterval(observeActiveCareer, 250);
})();
