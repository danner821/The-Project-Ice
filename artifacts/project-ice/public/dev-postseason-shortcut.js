'use strict';

/* global WorldEngine, recoverCareerPreviewFromWorld, loadCareerPreview, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const TARGET_PLAYER_NAME = 'Danner Stephenson';
  const TARGET_DATE = '2027-04-29';

  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';

  const ACTIVE_CAREER_ID_KEY = 'projectice_active_career_id_v1';
  const PENDING_CAREER_ID_KEY = 'projectice_pending_career_id_v1';
  const CAREER_SAVE_INDEX_KEY = 'projectice_career_save_index_v1';
  const SAVE_KEY = 'projectice_save';

  /*
   * The dev sandbox must never be the user's real career record.
   * It gets its own normal career record so every existing autosave path can
   * run unchanged, while the baseline lives under a non-career key so it can
   * never appear in Continue Career.
   */
  const DEV_CAREER_ID = '__project-ice-postseason-dev__';
  const DEV_WORLD_RECORD_ID = `career:${DEV_CAREER_ID}`;
  const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-postseason-apr29-v1';

  const originalListCareerSaves =
    typeof WorldEngine.listCareerSaves === 'function'
      ? WorldEngine.listCareerSaves.bind(WorldEngine)
      : null;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = event => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open Project Ice IndexedDB.'));
    });
  }

  function readRecord(database, id) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  function writeRecord(database, record) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function removeDevMetadataFromVisibleIndex() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CAREER_SAVE_INDEX_KEY) || '[]');
      if (!Array.isArray(parsed)) return;
      localStorage.setItem(
        CAREER_SAVE_INDEX_KEY,
        JSON.stringify(parsed.filter(item => String(item?.id || '') !== DEV_CAREER_ID))
      );
    } catch (_) {
      /* A malformed index will be rebuilt by WorldEngine normally. */
    }
  }

  function prepareApril29Baseline(sourceWorld) {
    const world = structuredClone(sourceWorld);

    /* Remove only postseason/test-layer data. Regular-season results remain. */
    if (Array.isArray(world.schedule)) {
      world.schedule = world.schedule.filter(event => event?.isPlayoff !== true);
    }

    if (!world.postseason || typeof world.postseason !== 'object') {
      world.postseason = {};
    }
    world.postseason.highSchool = null;

    if (!world.season || typeof world.season !== 'object') {
      world.season = {};
    }

    world.season.currentDate = TARGET_DATE;
    world.season.phase = 'regular-season-complete';
    world.season.postseason = {
      qualified: false,
      started: false,
      completed: false,
    };

    if (!world.player || typeof world.player !== 'object') {
      world.player = {};
    }
    world.player.currentDate = TARGET_DATE;
    world.currentDate = TARGET_DATE;

    /*
     * Keep the canonical roster copy of the career player on the same date.
     * Do not touch attributes, stats, awards, development, roster placement,
     * team records, standings, news, or any regular-season history.
     */
    const careerPlayerId = world.player.playerId || world.player.id || 'career-player';
    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        const id = player?.playerId || player?.id || null;
        if (
          player?.isCareerPlayer === true ||
          String(id || '') === String(careerPlayerId || '') ||
          String(id || '') === 'career-player'
        ) {
          player.currentDate = TARGET_DATE;
        }
      }
    }

    return world;
  }

  async function findRealDannerSave() {
    if (!originalListCareerSaves) return null;
    const saves = await originalListCareerSaves();
    return (Array.isArray(saves) ? saves : []).find(save =>
      String(save?.id || '') !== DEV_CAREER_ID &&
      String(save?.playerName || '').trim().toLowerCase() === TARGET_PLAYER_NAME.toLowerCase()
    ) || null;
  }

  async function ensureImmutableBaseline(database, realDannerSave) {
    const existing = await readRecord(database, DEV_BASELINE_RECORD_ID);
    if (existing?.world) return existing;

    const source = await readRecord(database, `career:${realDannerSave.id}`);
    if (!source?.world) {
      throw new Error('Danner Stephenson IndexedDB world record was not found.');
    }

    const baseline = {
      id: DEV_BASELINE_RECORD_ID,
      sourceCareerId: realDannerSave.id,
      sourcePlayerName: TARGET_PLAYER_NAME,
      checkpointDate: TARGET_DATE,
      createdAt: new Date().toISOString(),
      world: prepareApril29Baseline(source.world),
    };

    await writeRecord(database, baseline);
    return baseline;
  }

  async function rebuildSandboxFromBaseline() {
    const realDannerSave = await findRealDannerSave();
    if (!realDannerSave?.id) {
      throw new Error('Could not find the real Danner Stephenson career save.');
    }

    const database = await openDatabase();
    try {
      const baseline = await ensureImmutableBaseline(database, realDannerSave);
      const sandboxWorld = prepareApril29Baseline(baseline.world);

      await writeRecord(database, {
        id: DEV_WORLD_RECORD_ID,
        savedAt: new Date().toISOString(),
        devSandbox: true,
        sourceCareerId: realDannerSave.id,
        world: sandboxWorld,
      });
    } finally {
      database.close();
    }

    /* Switch active persistence only after the isolated record exists. */
    localStorage.setItem(ACTIVE_CAREER_ID_KEY, DEV_CAREER_ID);
    localStorage.removeItem(PENDING_CAREER_ID_KEY);
    removeDevMetadataFromVisibleIndex();

    const loaded = await WorldEngine.selectCareerSave?.(DEV_CAREER_ID);
    if (!loaded) {
      throw new Error('Could not load the isolated postseason dev career.');
    }

    /* The lifecycle load hooks may initialize the bracket, but the date stays Apr 29. */
    if (WorldEngine.state?.season) WorldEngine.state.season.currentDate = TARGET_DATE;
    if (WorldEngine.state?.player) WorldEngine.state.player.currentDate = TARGET_DATE;
    if (WorldEngine.state) WorldEngine.state.currentDate = TARGET_DATE;

    await WorldEngine.save?.();
    removeDevMetadataFromVisibleIndex();

    return {
      sourceCareerId: realDannerSave.id,
      sandboxCareerId: DEV_CAREER_ID,
    };
  }

  async function loadDannerCheckpoint() {
    const result = await rebuildSandboxFromBaseline();

    try {
      localStorage.removeItem(SAVE_KEY);
      if (typeof recoverCareerPreviewFromWorld === 'function') recoverCareerPreviewFromWorld();
      if (typeof loadCareerPreview === 'function') loadCareerPreview();
    } catch (error) {
      console.warn('[Project Ice] Dev shortcut preview refresh failed:', error);
    }

    try {
      if (typeof openHubTab === 'function') openHubTab('home');
      if (typeof refreshCareerUI === 'function') refreshCareerUI();
    } catch (error) {
      console.warn('[Project Ice] Dev shortcut Hub refresh failed:', error);
    }

    console.info('[Project Ice] Isolated postseason dev checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      date: TARGET_DATE,
      ...result,
    });
  }

  /* Keep the hidden sandbox out of Continue Career even after index recovery. */
  if (originalListCareerSaves) {
    WorldEngine.listCareerSaves = async (...args) => {
      const saves = await originalListCareerSaves(...args);
      removeDevMetadataFromVisibleIndex();
      return (Array.isArray(saves) ? saves : []).filter(save =>
        String(save?.id || '') !== DEV_CAREER_ID
      );
    };
  }

  function wireShortcut() {
    const button = document.getElementById('btn-dev-hub');
    const hint = document.getElementById('dev-shortcut-hint');
    if (!button || button.dataset.postseasonCheckpointWired === 'true') return;

    button.dataset.postseasonCheckpointWired = 'true';
    button.disabled = false;
    button.removeAttribute('disabled');
    if (hint) hint.classList.remove('is-visible');

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      loadDannerCheckpoint().catch(error => {
        console.error('[Project Ice] Dev postseason shortcut failed:', error);
        alert(`Dev postseason shortcut failed: ${error?.message || 'unknown error'}`);
      });
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireShortcut, { once: true });
  } else {
    wireShortcut();
  }

  window.setTimeout(wireShortcut, 250);
})();
