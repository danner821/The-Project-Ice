'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CHECKPOINT_OFFSET_DAYS = 8;

  const originalAdvanceToDate =
    typeof WorldEngine.advanceToDate === 'function'
      ? WorldEngine.advanceToDate.bind(WorldEngine)
      : null;

  if (!originalAdvanceToDate) return;

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

  function careerTeamId() {
    const world = WorldEngine.state || {};
    return world?.player?.teamId || world?.player?.highSchoolTeamId || null;
  }

  function isRegularSeasonGame(game) {
    return Boolean(
      game &&
      game?.isPlayoff !== true &&
      game?.homeTeamId &&
      game?.awayTeamId &&
      dateKey(game?.date)
    );
  }

  function isFinal(game) {
    const hasScore =
      game?.homeScore !== null && game?.homeScore !== undefined &&
      game?.awayScore !== null && game?.awayScore !== undefined &&
      Number.isFinite(Number(game.homeScore)) &&
      Number.isFinite(Number(game.awayScore));

    return Boolean(
      game?.played === true ||
      game?.completed === true ||
      String(game?.status || '').toLowerCase() === 'final' ||
      hasScore
    );
  }

  function regularSeasonEndDate() {
    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];
    const regular = schedule.filter(isRegularSeasonGame);

    const explicitFinales = regular
      .filter(game => game?.isSeasonFinale === true)
      .map(game => dateKey(game.date))
      .filter(Boolean)
      .sort();

    if (explicitFinales.length) {
      return explicitFinales[explicitFinales.length - 1];
    }

    const teamId = careerTeamId();
    const careerGames = regular.filter(game =>
      teamId && (
        String(game.homeTeamId) === String(teamId) ||
        String(game.awayTeamId) === String(teamId)
      )
    );

    const completedCareerDates = careerGames
      .filter(isFinal)
      .map(game => dateKey(game.date))
      .filter(Boolean)
      .sort();

    if (completedCareerDates.length) {
      return completedCareerDates[completedCareerDates.length - 1];
    }

    return WorldEngine.getHighSchoolRegularSeasonEndDate?.() || null;
  }

  function desiredCheckpointDate() {
    const endDate = regularSeasonEndDate();
    return endDate ? addDays(endDate, CHECKPOINT_OFFSET_DAYS) : null;
  }

  function hasPlayedPlayoffGame() {
    return (WorldEngine.state?.schedule || []).some(game =>
      game?.isPlayoff === true && isFinal(game)
    );
  }

  function checkpointAlreadyCleared() {
    const post = WorldEngine.state?.postseason?.highSchool || null;
    return Boolean(
      post?.checkpointAcknowledged === true ||
      hasPlayedPlayoffGame()
    );
  }

  function normalizeExistingCheckpoint() {
    const post = WorldEngine.state?.postseason?.highSchool || null;
    const checkpoint = desiredCheckpointDate();

    if (
      !post?.initialized ||
      !checkpoint ||
      checkpointAlreadyCleared()
    ) {
      return checkpoint;
    }

    post.checkpointDate = checkpoint;
    post.checkpointEventVersion = 2;
    post.checkpointBehavior = 'blocking-career-event';
    return checkpoint;
  }

  function ensureCheckpointState(options = {}) {
    const now = currentDate();
    const endDate = regularSeasonEndDate();
    if (!now || !endDate) return null;

    const checkpointDate = addDays(endDate, CHECKPOINT_OFFSET_DAYS);
    if (!checkpointDate || now < checkpointDate) return null;

    let post = WorldEngine.state?.postseason?.highSchool || null;

    if (!post?.initialized) {
      post = WorldEngine.initializeHighSchoolPostseason?.({
        force: true,
        regularSeasonEndDate: endDate,
        save: false,
      }) || null;
    }

    if (!post?.initialized) return null;

    post.version = Math.max(2, Number(post.version) || 0);
    post.regularSeasonEndDate = dateKey(post.regularSeasonEndDate) || endDate;

    if (!checkpointAlreadyCleared()) {
      post.checkpointDate = checkpointDate;
      post.checkpointEventVersion = 2;
      post.checkpointBehavior = 'blocking-career-event';
      post.checkpointAcknowledged = false;
      post.checkpointAcknowledgedAt = null;
      post.status = 'break';

      if (WorldEngine.state?.season?.postseason) {
        WorldEngine.state.season.postseason.started = false;
        WorldEngine.state.season.phase = 'postseason-break';
      }
    }

    if (options.save !== false) WorldEngine.save?.();
    window.dispatchEvent(new CustomEvent('projectice:postseason-state-ready'));
    return post;
  }

  WorldEngine.ensureHighSchoolPostseasonCheckpoint = ensureCheckpointState;

  WorldEngine.advanceToDate = function postseasonAwareAdvance(targetDate, options = {}) {
    const requestedTarget = dateKey(targetDate);
    const before = currentDate();
    const checkpoint = desiredCheckpointDate();

    normalizeExistingCheckpoint();

    const mustStopAtCheckpoint = Boolean(
      requestedTarget &&
      before &&
      checkpoint &&
      before < checkpoint &&
      requestedTarget >= checkpoint &&
      !checkpointAlreadyCleared()
    );

    const effectiveTarget = mustStopAtCheckpoint
      ? checkpoint
      : targetDate;

    let result = originalAdvanceToDate(effectiveTarget, {
      ...options,
      save: false,
    });

    /*
     * Older lifecycle code may create a postseason object mid-advance with
     * the previous Apr 30 checkpoint. If that inner wrapper stops one day
     * early, normalize the newly created state to May 1 and finish the final
     * single day before exposing the checkpoint to the UI.
     */
    if (
      mustStopAtCheckpoint &&
      currentDate() &&
      currentDate() < checkpoint
    ) {
      normalizeExistingCheckpoint();
      result = originalAdvanceToDate(checkpoint, {
        ...options,
        maximumDays: 1,
        save: false,
      });
    }

    const after = currentDate();

    if (after && after !== before) {
      ensureCheckpointState({ save: false });
    }

    if (options.save !== false && after !== before) {
      WorldEngine.save?.();
    }

    if (mustStopAtCheckpoint && after === checkpoint) {
      return {
        ...(result || {}),
        success: true,
        currentDate: after,
        targetDate: requestedTarget,
        postseasonCheckpoint: true,
        stopSimulation: false,
        reason: 'postseason-checkpoint-reached',
      };
    }

    return result;
  };
})();
