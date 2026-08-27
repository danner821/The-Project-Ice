'use strict';

/* global WorldEngine, recoverCareerPreviewFromWorld, loadCareerPreview, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const TARGET_PLAYER_NAME = 'Danner Stephenson';
  const AWARDS_EVENT_ID = 'hs-league-awards-ceremony';

  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';

  const ACTIVE_CAREER_ID_KEY = 'projectice_active_career_id_v1';
  const PENDING_CAREER_ID_KEY = 'projectice_pending_career_id_v1';
  const CAREER_SAVE_INDEX_KEY = 'projectice_career_save_index_v1';
  const SAVE_KEY = 'projectice_save';

  const DEV_CAREER_ID = '__project-ice-postseason-dev__';
  const DEV_WORLD_RECORD_ID = `career:${DEV_CAREER_ID}`;
  const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-awards-eve-v1';

  const originalListCareerSaves =
    typeof WorldEngine.listCareerSaves === 'function'
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
      /* WorldEngine can rebuild a malformed visible index normally. */
    }
  }

  function prepareAwardsEveBaseline(sourceWorld) {
    const world = structuredClone(sourceWorld);
    const postseason = world?.postseason?.highSchool;

    if (!postseason?.championTeamId || !postseason?.completedDate) {
      throw new Error('The source career has not completed a high school postseason yet.');
    }

    const championCheckpointDate =
      dateKey(postseason.championCheckpointAcknowledgedAt) ||
      addDays(postseason.completedDate, 1);

    const ceremonyDate =
      dateKey(postseason.awardsCeremonyDate) ||
      addDays(championCheckpointDate, 7);

    const targetDate = addDays(ceremonyDate, -1);
    if (!targetDate) throw new Error('Could not determine the Awards Eve checkpoint date.');

    postseason.championCheckpointAcknowledged = true;
    postseason.championCheckpointAcknowledgedAt = championCheckpointDate;
    postseason.offseasonStartedDate = postseason.offseasonStartedDate || championCheckpointDate;
    postseason.awardsCeremonyDate = ceremonyDate;
    postseason.awardsCeremonyAcknowledged = false;
    delete postseason.awardsCeremonyAcknowledgedAt;
    postseason.awardsRevealIndex = 0;

    if (!world.season || typeof world.season !== 'object') world.season = {};
    world.season.currentDate = targetDate;
    world.season.phase = 'offseason-awards-pending';

    if (!world.player || typeof world.player !== 'object') world.player = {};
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    const careerPlayerId = world.player.playerId || world.player.id || 'career-player';
    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        const id = player?.playerId || player?.id || null;
        if (
          player?.isCareerPlayer === true ||
          String(id || '') === String(careerPlayerId || '') ||
          String(id || '') === 'career-player'
        ) {
          player.currentDate = targetDate;
        }
      }
    }

    if (!Array.isArray(world.schedule)) world.schedule = [];
    const ceremonyEvent = world.schedule.find(event =>
      String(event?.eventId || event?.id || '') === AWARDS_EVENT_ID
    );

    if (ceremonyEvent) {
      Object.assign(ceremonyEvent, {
        date: ceremonyDate,
        completed: false,
        played: false,
        status: 'scheduled',
        requiresPlayerInteraction: true,
      });
      delete ceremonyEvent.completedAt;
      delete ceremonyEvent.result;
    }

    return { world, targetDate, ceremonyDate };
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

    const prepared = prepareAwardsEveBaseline(source.world);
    const baseline = {
      id: DEV_BASELINE_RECORD_ID,
      sourceCareerId: realDannerSave.id,
      sourcePlayerName: TARGET_PLAYER_NAME,
      checkpointDate: prepared.targetDate,
      awardsCeremonyDate: prepared.ceremonyDate,
      createdAt: new Date().toISOString(),
      world: prepared.world,
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
    let checkpointDate = null;
    let ceremonyDate = null;

    try {
      const baseline = await ensureImmutableBaseline(database, realDannerSave);
      const prepared = prepareAwardsEveBaseline(baseline.world);
      checkpointDate = prepared.targetDate;
      ceremonyDate = prepared.ceremonyDate;

      await writeRecord(database, {
        id: DEV_WORLD_RECORD_ID,
        savedAt: new Date().toISOString(),
        devSandbox: true,
        sourceCareerId: realDannerSave.id,
        checkpointDate,
        awardsCeremonyDate: ceremonyDate,
        world: prepared.world,
      });
    } finally {
      database.close();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, DEV_CAREER_ID);
    localStorage.removeItem(PENDING_CAREER_ID_KEY);
    removeDevMetadataFromVisibleIndex();

    const loaded = await WorldEngine.selectCareerSave?.(DEV_CAREER_ID);
    if (!loaded) throw new Error('Could not load the isolated Awards Eve dev career.');

    if (WorldEngine.state?.season) {
      WorldEngine.state.season.currentDate = checkpointDate;
      WorldEngine.state.season.phase = 'offseason-awards-pending';
    }
    if (WorldEngine.state?.player) WorldEngine.state.player.currentDate = checkpointDate;
    if (WorldEngine.state) WorldEngine.state.currentDate = checkpointDate;

    WorldEngine.ensureLeagueAwardsCeremonyEvent?.({ save: false });
    await WorldEngine.save?.();
    removeDevMetadataFromVisibleIndex();

    return {
      sourceCareerId: realDannerSave.id,
      sandboxCareerId: DEV_CAREER_ID,
      checkpointDate,
      ceremonyDate,
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

    console.info('[Project Ice] Isolated Awards Eve dev checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      ...result,
    });
  }

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
        console.error('[Project Ice] Dev Awards Eve shortcut failed:', error);
        alert(`Dev Awards Eve shortcut failed: ${error?.message || 'unknown error'}`);
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
