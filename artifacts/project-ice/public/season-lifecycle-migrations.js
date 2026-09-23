'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MIGRATION_VERSION = 4;
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

  function isFinalGame(game) {
    const hasScore =
      game?.homeScore !== null &&
      game?.homeScore !== undefined &&
      game?.awayScore !== null &&
      game?.awayScore !== undefined &&
      Number.isFinite(Number(game.homeScore)) &&
      Number.isFinite(Number(game.awayScore));

    return Boolean(
      game?.played === true ||
      game?.completed === true ||
      String(game?.status || '').toLowerCase() === 'final' ||
      hasScore
    );
  }

  function regularSeasonGamesThrough(endDate) {
    const limit = dateKey(endDate);
    if (!limit) return [];

    return (WorldEngine.state?.schedule || []).filter(game => {
      const date = dateKey(game?.date);
      return Boolean(
        date &&
        date <= limit &&
        game?.isPlayoff !== true &&
        game?.homeTeamId &&
        game?.awayTeamId
      );
    });
  }

  function allRegularSeasonGamesFinal(endDate) {
    const games = regularSeasonGamesThrough(endDate);
    return games.length > 0 && games.every(isFinalGame);
  }

  function recoveryLedger(world) {
    world.history =
      world.history && typeof world.history === 'object'
        ? world.history
        : {};
    world.history.recoveryMigrations =
      world.history.recoveryMigrations &&
      typeof world.history.recoveryMigrations === 'object'
        ? world.history.recoveryMigrations
        : {};
    return world.history.recoveryMigrations;
  }

  /*
   * First preserve an independent IndexedDB copy of the fully hydrated
   * original world. Never write a repaired career unless its backup commits.
   */
  async function backupBeforeRecovery(world, seasonId) {
    const careerId = WorldEngine.getActiveCareerId?.();
    if (!careerId) throw new Error('Recovery requires a loaded career');
    const backupId = 'recovery-backup:postseason:' + careerId + ':' + seasonId;
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('projectice_database', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const previous = await new Promise((resolve, reject) => {
        const request = db.transaction('worlds', 'readonly')
          .objectStore('worlds').get(backupId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (previous?.world) return backupId;
      const snapshot = structuredClone(world);
      await new Promise((resolve, reject) => {
        const tx = db.transaction('worlds', 'readwrite');
        tx.objectStore('worlds').add({
          id: backupId, recoveryBackup: true,
          careerId, savedAt: new Date().toISOString(), world: snapshot,
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      return backupId;
    } finally {
      db.close();
    }
  }

  let recoveryInFlight = false;
  async function recoverMissedPostseasonBoundary() {
    if (recoveryInFlight) return false;
    const world = WorldEngine.state || {};
    const post = world?.postseason?.highSchool || null;
    const now = currentDate();
    const endDate = dateKey(WorldEngine.getHighSchoolRegularSeasonEndDate?.());
    const checkpointDate = addDays(endDate, 7);
    const seasonId = String(
      world?.season?.seasonId || world?.season?.id || world?.currentSeason || ''
    );
    if (
      !seasonId || !now || !endDate || !checkpointDate ||
      now <= checkpointDate ||
      hasAdvancedBeyondPostseason(world) ||
      hasPlayedPlayoffGame() ||
      post?.checkpointAcknowledged === true ||
      post?.championTeamId ||
      !allRegularSeasonGamesFinal(endDate)
    ) return false;

    /* Ensure that only a finished, complete current-season league is rewound. */
    const games = regularSeasonGamesThrough(endDate);
    const expected = (world.teams?.length || 0) *
      (Number(world.season?.regularSeason?.gamesPerTeam) || 28) / 2;
    if (expected < 1 || games.length !== expected) return false;

    recoveryInFlight = true;
    try {
      const backupId = await backupBeforeRecovery(world, seasonId);
      if (WorldEngine.state !== world || currentDate() !== now ||
          hasAdvancedBeyondPostseason(world) || hasPlayedPlayoffGame()) return false;

      const previousPost = world.postseason?.highSchool || null;
      const previousSeason = structuredClone(world.season);
      const previousSchedule = structuredClone(world.schedule);
      const previousStandings = structuredClone(world.standings || []);
      const previousDate = world.currentDate;
      const previousYear = world.currentYear;
      const previousWeek = world.currentWeek;
      const previousPlayerDate = world.player?.currentDate;

      const initialized = previousPost?.initialized
        ? previousPost
        : WorldEngine.initializeHighSchoolPostseason?.({
            regularSeasonEndDate: endDate, save: false,
          });
      if (!initialized?.initialized) {
        console.warn('[SeasonLifecycle] Postseason recovery not ready.', initialized);
        return false;
      }

      try {
        WorldEngine.setCurrentDate(checkpointDate, { save: false });
        world.season.regularSeason.started = true;
        world.season.regularSeason.completed = true;
        world.season.lastProcessedDate = checkpointDate;
        world.season.phase = 'postseason-break';
        initialized.version = Math.max(4, Number(initialized.version) || 0);
        initialized.regularSeasonEndDate = endDate;
        initialized.checkpointDate = checkpointDate;
        initialized.checkpointAcknowledged = false;
        initialized.checkpointAcknowledgedAt = null;
        initialized.status = 'break';
        world.season.postseason.started = false;
        world.season.postseason.completed = false;

        const ledger = recoveryLedger(world);
        const entryId = 'postseason-boundary-recovery-v2:' + seasonId;
        ledger[entryId] = {
          version: 2, seasonId, backupId, fromDate: now,
          toDate: checkpointDate, regularSeasonEndDate: endDate,
          repairedAt: new Date().toISOString(),
        };
        const saved = await WorldEngine.save?.();
        if (saved === false) throw new Error('Repaired save failed');
        window.dispatchEvent(new CustomEvent('projectice:postseason-state-ready'));
        window.dispatchEvent(new CustomEvent('projectice:career-date-advanced'));
        console.info('[SeasonLifecycle] Restored missed postseason boundary.', ledger[entryId]);
        return true;
      } catch (error) {
        world.postseason.highSchool = previousPost;
        world.season = previousSeason;
        world.schedule = previousSchedule;
        world.standings = previousStandings;
        world.currentDate = previousDate;
        world.currentYear = previousYear;
        world.currentWeek = previousWeek;
        if (world.player) world.player.currentDate = previousPlayerDate;
        throw error;
      }
    } catch (error) {
      console.error('[SeasonLifecycle] Recovery withheld; backup/save failure.', error);
      return false;
    } finally {
      recoveryInFlight = false;
    }
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
      /*
       * Prior-season Travel tryout results survive rollover, but an inactive
       * Travel state is not evidence that this season's playoffs happened.
       */
      (
        String(travel?.status || '').toLowerCase() !== 'inactive' &&
        (
          Boolean(travel?.tryoutResult) ||
          Boolean(travel?.placementLevel) ||
          travel?.completed === true ||
          travel?.tournament?.closeoutAcknowledged === true
        )
      )
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

  async function reconcileLoadedCareer() {
    const world = WorldEngine.state || {};
    const post = world?.postseason?.highSchool || null;

    /* Never create a new live bracket inside a career that is already later. */
    if (!post?.initialized && hasAdvancedBeyondPostseason(world)) {
      return;
    }

    if (await recoverMissedPostseasonBoundary()) {
      migrate();
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
        await reconcileLoadedCareer();
        window.setTimeout(() => {
          reconcileLoadedCareer().catch(error => console.error('[SeasonLifecycle] Reconciliation failed.', error));
        }, 0);
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

  /* Recovery only runs after authoritative career hydration above. */
  observeActiveCareer();
  window.addEventListener('projectice:postseason-state-ready', observeActiveCareer);
  window.addEventListener('projectice:next-high-school-season-started', observeActiveCareer);
  window.addEventListener('projectice:player-season-recap-complete', observeActiveCareer);
})();
