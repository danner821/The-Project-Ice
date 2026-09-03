'use strict';

/* global WorldEngine, Game, openHubTab, refreshCareerUI, updateHubScreen */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const TARGET_PLAYER_NAME = 'Danner Stephenson';
  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';
  const ACTIVE_CAREER_ID_KEY = 'projectice_active_career_id_v1';
  const PENDING_CAREER_ID_KEY = 'projectice_pending_career_id_v1';
  const CAREER_SAVE_INDEX_KEY = 'projectice_career_save_index_v1';

  const DEV_CAREER_ID = '__project-ice-postseason-dev__';
  const DEV_WORLD_RECORD_ID = `career:${DEV_CAREER_ID}`;
  const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-post-travel-offseason-v6';
  const LEGACY_POST_TRYOUT_BASELINE_ID = 'dev-baseline:danner-post-travel-tryouts-v4';

  const originalListCareerSaves = typeof WorldEngine.listCareerSaves === 'function'
    ? WorldEngine.listCareerSaves.bind(WorldEngine)
    : null;

  const dateKey = value => String(value || '').slice(0, 10);

  function addDays(value, days) {
    const key = dateKey(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open Project Ice IndexedDB.'));
    });
  }

  function readRecord(db, id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  function writeRecord(db, record) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function removeDevMetadataFromVisibleIndex() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CAREER_SAVE_INDEX_KEY) || '[]');
      if (!Array.isArray(parsed)) return;
      const cleaned = parsed.filter(item => String(item?.id || '') !== DEV_CAREER_ID);
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(CAREER_SAVE_INDEX_KEY, JSON.stringify(cleaned));
      }
    } catch (_) {}
  }

  function dedupeVisibleSaves(saves) {
    const seenIds = new Set();
    const seenFingerprints = new Set();
    const result = [];

    for (const save of Array.isArray(saves) ? saves : []) {
      const id = String(save?.id || '');
      if (!id || id === DEV_CAREER_ID || seenIds.has(id)) continue;
      seenIds.add(id);

      const fingerprint = [
        String(save?.playerName || '').trim().toLowerCase(),
        dateKey(save?.currentDate),
        String(save?.teamName || '').trim().toLowerCase(),
        String(save?.position || '').trim().toLowerCase(),
        String(save?.overall ?? ''),
      ].join('|');

      if (fingerprint !== '||||' && seenFingerprints.has(fingerprint)) continue;
      if (fingerprint !== '||||') seenFingerprints.add(fingerprint);
      result.push(save);
    }

    return result;
  }

  function canonicalCareerPlayer(world) {
    return (world?.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) || null;
  }

  function cleanPostTravelState(world) {
    if (!world.player || typeof world.player !== 'object') world.player = {};
    if (!world.season || typeof world.season !== 'object') world.season = {};
    if (!Array.isArray(world.schedule)) world.schedule = [];
    if (!world.travelHockey || typeof world.travelHockey !== 'object') world.travelHockey = {};

    const canonical = canonicalCareerPlayer(world);
    if (canonical) {
      const id = canonical.playerId || canonical.id || 'career-player';
      world.player.playerId = id;
      world.player.id = id;
    }

    world.schedule = world.schedule.filter(event => {
      const travelEvent =
        event?.travelTournament === true ||
        event?.travelTournamentTraining === true ||
        event?.travelHockeyEvent === true ||
        String(event?.type || '') === 'travel-game';
      if (!travelEvent) return true;
      return event?.completed === true || event?.played === true || event?.isCompleted === true;
    });

    const targetDate = dateKey(
      world.travelHockey?.tournament?.closeoutAcknowledgedAt ||
      world.season.currentDate ||
      world.player.currentDate ||
      world.currentDate
    );
    if (!targetDate) throw new Error('The post-Travel checkpoint has no valid current date.');

    world.season.phase = 'offseason';
    world.season.currentDate = targetDate;
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    world.travelHockey.status = 'completed';
    world.travelHockey.completed = true;
    world.travelHockey.tournament = {
      ...(world.travelHockey.tournament || {}),
      status: 'complete',
      closeoutAcknowledged: true,
      closeoutAcknowledgedAt: targetDate,
    };

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (player?.isCareerPlayer === true) player.currentDate = targetDate;
      }
    }

    return world;
  }

  function synthesizeBaselineFromLegacy(sourceWorld) {
    const world = structuredClone(sourceWorld);
    if (!world.travelHockey || typeof world.travelHockey !== 'object') world.travelHockey = {};
    if (!world.season || typeof world.season !== 'object') world.season = {};
    if (!world.player || typeof world.player !== 'object') world.player = {};

    const travel = world.travelHockey;
    const tryoutDate = dateKey(
      travel.tryoutResult?.completedAt ||
      travel.tryoutDate ||
      world.season.currentDate ||
      world.player.currentDate ||
      world.currentDate
    );
    if (!tryoutDate) throw new Error('Could not determine the legacy Travel checkpoint date.');

    const targetDate = addDays(tryoutDate, 16) || tryoutDate;
    const teamId = String(
      travel.playerTeamId ||
      travel.placementTeamId ||
      travel.placementTeam?.teamId ||
      'dev-travel-complete'
    );

    travel.completed = true;
    travel.status = 'completed';
    travel.syntheticDevCheckpoint = true;
    travel.tournament = {
      ...(travel.tournament || {}),
      status: 'complete',
      championTeamId: travel.tournament?.championTeamId || teamId,
      closeoutAcknowledged: true,
      closeoutAcknowledgedAt: targetDate,
      syntheticDevCheckpoint: true,
    };

    world.season.phase = 'offseason';
    world.season.currentDate = targetDate;
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    return cleanPostTravelState(world);
  }

  async function getBaseline(db) {
    const existing = await readRecord(db, DEV_BASELINE_RECORD_ID);
    if (existing?.world) return existing;

    const legacy = await readRecord(db, LEGACY_POST_TRYOUT_BASELINE_ID);
    if (!legacy?.world) {
      throw new Error('Could not find the stable post-Travel dev baseline.');
    }

    const world = synthesizeBaselineFromLegacy(legacy.world);
    const baseline = {
      id: DEV_BASELINE_RECORD_ID,
      sourceCareerId: legacy.sourceCareerId || null,
      createdAt: new Date().toISOString(),
      checkpointDate: dateKey(world?.season?.currentDate),
      checkpointKind: 'post-travel-offseason',
      sourceKind: 'synthetic-from-post-tryout-baseline',
      world,
    };

    await writeRecord(db, baseline);
    return baseline;
  }

  async function persistActiveWorld() {
    const result = WorldEngine.save?.();
    if (result && typeof result.then === 'function') await result;
  }

  function advanceDevWorldToSeasonRecap() {
    const state = WorldEngine.state;
    if (!state) throw new Error('No active dev world is loaded.');

    WorldEngine.syncOffseasonDevelopmentCadence?.({ save: false });
    WorldEngine.ensureHighSchoolSeasonArchive?.({ save: false });

    const checkpoint = dateKey(
      WorldEngine.getSeasonRecapCheckpointDate?.() ||
      state?.offseasonDevelopment?.checkpointDate
    );
    if (!checkpoint) throw new Error('Season Recap checkpoint date is unavailable.');

    for (const event of state.schedule || []) {
      const eventDate = dateKey(event?.date);
      if (
        event?.offseasonDevelopmentEvent === true &&
        eventDate && eventDate <= checkpoint &&
        event?.completed !== true &&
        event?.played !== true
      ) {
        event.completed = true;
        event.played = true;
        event.isCompleted = true;
        event.status = 'completed';
        event.completedAt = eventDate;
        event.requiresPlayerInteraction = false;
        event.devSkippedForSeasonRecap = true;
      }
    }

    state.seasonTransition = state.seasonTransition && typeof state.seasonTransition === 'object'
      ? state.seasonTransition
      : {};
    state.seasonTransition.recap = {};

    state.season.phase = 'offseason';
    state.season.currentDate = checkpoint;
    state.player.currentDate = checkpoint;
    state.currentDate = checkpoint;

    for (const team of state.teams || []) {
      for (const player of team?.roster || []) {
        if (player?.isCareerPlayer === true) player.currentDate = checkpoint;
      }
    }

    WorldEngine.ensureSeasonRecapCheckpointEvent?.({ save: false });
    return checkpoint;
  }

  async function rebuildSandbox() {
    const db = await openDatabase();
    let baseline;
    try {
      baseline = await getBaseline(db);
      const world = cleanPostTravelState(structuredClone(baseline.world));
      await writeRecord(db, {
        id: DEV_WORLD_RECORD_ID,
        savedAt: new Date().toISOString(),
        devSandbox: true,
        sourceCareerId: baseline.sourceCareerId || null,
        checkpointDate: dateKey(world?.season?.currentDate),
        checkpointKind: 'post-travel-offseason',
        world,
      });
    } finally {
      db.close();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, DEV_CAREER_ID);
    localStorage.removeItem(PENDING_CAREER_ID_KEY);
    removeDevMetadataFromVisibleIndex();

    const loaded = await WorldEngine.selectCareerSave?.(DEV_CAREER_ID);
    if (!loaded) throw new Error('Could not load isolated post-Travel offseason dev career.');

    if (String(WorldEngine.state?.season?.phase || '').toLowerCase() !== 'offseason') {
      throw new Error(`Loaded dev state is not offseason (phase=${WorldEngine.state?.season?.phase || 'missing'}).`);
    }

    if (WorldEngine.state?.travelHockey?.completed !== true) {
      throw new Error('Loaded dev state lost the completed Travel boundary.');
    }

    if (typeof WorldEngine.syncOffseasonDevelopmentCadence !== 'function') {
      throw new Error('Offseason cadence runtime did not load.');
    }
    if (typeof WorldEngine.renderLeagueSeasonRecap !== 'function') {
      throw new Error('Season Recap runtime did not load.');
    }

    WorldEngine.syncOffseasonDevelopmentCadence({ save: false });
    const trainings = typeof WorldEngine.getOffseasonDevelopmentTrainingEvents === 'function'
      ? WorldEngine.getOffseasonDevelopmentTrainingEvents()
      : (WorldEngine.state?.schedule || []).filter(event => event?.offseasonDevelopmentEvent === true);

    if (trainings.length < 2) {
      throw new Error(`Offseason cadence created ${trainings.length} training events.`);
    }

    const targetDate = advanceDevWorldToSeasonRecap();
    await persistActiveWorld();
    removeDevMetadataFromVisibleIndex();

    return {
      targetDate,
      sourceKind: baseline.sourceKind || 'post-travel-offseason',
      trainingCount: trainings.length,
    };
  }

  async function loadCheckpoint() {
    const result = await rebuildSandbox();

    if (typeof Game !== 'undefined' && WorldEngine.state?.player) {
      Game.player = {
        ...Game.player,
        ...WorldEngine.state.player,
        stage: 'hub',
        tryoutsComplete: true,
        currentDate: result.targetDate,
      };
    }

    document.body.classList.remove('pi-travel-season-active');
    document.body.classList.add('pi-travel-closeout-complete');
    document.getElementById('pi-travel-home-card')?.remove();
    document.getElementById('pi-travel-league-card')?.remove();
    document.getElementById('pi-travel-hockey-hub-canonical')?.remove();
    document.getElementById('pi-league-postseason-card')?.remove();

    if (typeof refreshCareerUI === 'function') refreshCareerUI();
    if (typeof updateHubScreen === 'function') updateHubScreen();
    if (typeof openHubTab === 'function') openHubTab('home');

    requestAnimationFrame(() => {
      WorldEngine.renderLeagueSeasonRecap?.({ force: true });
    });

    console.info('[Project Ice] Season Recap dev checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      checkpointDate: result.targetDate,
      sourceKind: result.sourceKind,
      trainingCount: result.trainingCount,
    });
  }

  if (originalListCareerSaves) {
    WorldEngine.listCareerSaves = async (...args) => {
      const saves = await originalListCareerSaves(...args);
      removeDevMetadataFromVisibleIndex();
      return dedupeVisibleSaves(saves);
    };
  }

  function wireShortcut() {
    const button = document.getElementById('btn-dev-hub');
    const hint = document.getElementById('dev-shortcut-hint');
    if (!button || button.dataset.seasonRecapCheckpointWired === 'true') return;

    button.dataset.seasonRecapCheckpointWired = 'true';
    button.disabled = false;
    button.removeAttribute('disabled');

    const label = button.querySelector('.btn__label');
    if (label) label.textContent = 'Skip to Season Recap';
    if (hint) hint.classList.remove('is-visible');

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;

      loadCheckpoint()
        .catch(error => {
          console.error('[Project Ice] Dev Season Recap shortcut failed:', error);
          alert(`Dev Season Recap shortcut failed: ${error?.message || 'unknown error'}`);
        })
        .finally(() => {
          button.disabled = false;
        });
    }, true);
  }

  removeDevMetadataFromVisibleIndex();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireShortcut, { once: true });
  } else {
    wireShortcut();
  }
})();
