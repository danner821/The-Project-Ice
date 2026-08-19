'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CHECKPOINT_OFFSET_DAYS = 8;

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const key = dateKey(value);
    if (!key) return null;
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function currentPostseason() {
    return WorldEngine.state?.postseason?.highSchool || null;
  }

  function regularSeasonEndDate(post = currentPostseason()) {
    return (
      dateKey(post?.regularSeasonEndDate) ||
      dateKey(WorldEngine.getHighSchoolRegularSeasonEndDate?.()) ||
      null
    );
  }

  function hasPlayedPlayoffGame() {
    return (WorldEngine.state?.schedule || []).some(game => {
      if (game?.isPlayoff !== true) return false;

      const hasScore =
        game?.homeScore !== null && game?.homeScore !== undefined &&
        game?.awayScore !== null && game?.awayScore !== undefined &&
        Number.isFinite(Number(game.homeScore)) &&
        Number.isFinite(Number(game.awayScore));

      return Boolean(
        game?.played === true ||
        String(game?.status || '').toLowerCase() === 'final' ||
        hasScore
      );
    });
  }

  function normalizeCheckpoint(options = {}) {
    const post = currentPostseason();
    if (!post?.initialized) return false;

    const endDate = regularSeasonEndDate(post);
    const desired = addDays(endDate, CHECKPOINT_OFFSET_DAYS);
    if (!desired) return false;

    if (
      post.checkpointAcknowledged === true ||
      hasPlayedPlayoffGame()
    ) {
      return false;
    }

    if (dateKey(post.checkpointDate) === desired) return false;

    post.checkpointDate = desired;
    post.checkpointEventVersion = 1;
    post.checkpointBehavior = 'blocking-career-event';

    if (options.save !== false) {
      WorldEngine.save?.();
    }

    window.dispatchEvent(
      new CustomEvent('projectice:postseason-state-ready')
    );

    return true;
  }

  const originalInitialize =
    typeof WorldEngine.initializeHighSchoolPostseason === 'function'
      ? WorldEngine.initializeHighSchoolPostseason.bind(WorldEngine)
      : null;

  if (originalInitialize) {
    WorldEngine.initializeHighSchoolPostseason = options => {
      const result = originalInitialize(options);
      normalizeCheckpoint({ save: false });
      return result;
    };
  }

  const originalReconcile =
    typeof WorldEngine.reconcileHighSchoolPostseason === 'function'
      ? WorldEngine.reconcileHighSchoolPostseason.bind(WorldEngine)
      : null;

  if (originalReconcile) {
    WorldEngine.reconcileHighSchoolPostseason = options => {
      const result = originalReconcile(options);
      normalizeCheckpoint({ save: false });
      return result;
    };
  }

  const originalAdvance =
    typeof WorldEngine.advanceToDate === 'function'
      ? WorldEngine.advanceToDate.bind(WorldEngine)
      : null;

  if (originalAdvance) {
    WorldEngine.advanceToDate = (targetDate, options = {}) => {
      /*
       * Every entry point—Home, Schedule, or future UI—must establish the
       * postseason checkpoint before attempting a multi-day jump. This makes
       * May 1 behave exactly like a blocking career event: a request for May 8
       * still stops the world on May 1 until the player acknowledges it.
       */
      WorldEngine.reconcileHighSchoolPostseason?.({ save: false });
      normalizeCheckpoint({ save: false });
      return originalAdvance(targetDate, options);
    };
  }

  WorldEngine.normalizeHighSchoolPostseasonCheckpoint = normalizeCheckpoint;

  normalizeCheckpoint({ save: true });

  window.setInterval(() => {
    normalizeCheckpoint({ save: true });
  }, 500);
})();
