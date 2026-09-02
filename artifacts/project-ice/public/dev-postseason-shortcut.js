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
  const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-post-travel-offseason-v5';

  const originalListCareerSaves = typeof WorldEngine.listCareerSaves === 'function'
    ? WorldEngine.listCareerSaves.bind(WorldEngine)
    : null;

  const dateKey = value => String(value || '').slice(0, 10);

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

  function validatePostTravelOffseason(world) {
    const travel = world?.travelHockey || null;
    const tournament = travel?.tournament || null;
    const phase = String(world?.season?.phase || '').toLowerCase();

    if (!travel || !tournament) {
      throw new Error('This career has no completed Travel tournament to checkpoint from.');
    }
    if (tournament.status !== 'complete' || !tournament.championTeamId) {
      throw new Error('The Travel tournament is not complete yet. Finish the tournament first.');
    }
    if (tournament.closeoutAcknowledged !== true || travel.completed !== true) {
      throw new Error('Press Continue Into Offseason on the Travel Tournament Complete screen first.');
    }
    if (phase !== 'offseason') {
      throw new Error(`Expected the post-Travel offseason boundary, but season phase is "${world?.season?.phase || 'unknown'}".`);
    }

    return true;
  }

  function preparePostTravelOffseason(sourceWorld) {
    validatePostTravelOffseason(sourceWorld);
    const world = structuredClone(sourceWorld);

    if (!world.player || typeof world.player !== 'object') world.player = {};
    if (!world.season || typeof world.season !== 'object') world.season = {};
    if (!Array.isArray(world.schedule)) world.schedule = [];

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
        event?.travelHockeyEvent === true;
      if (!travelEvent) return true;
      return event?.completed === true || event?.played === true || event?.isCompleted === true;
    });

    world.season.phase = 'offseason';

    const targetDate = dateKey(
      world.season.currentDate ||
      world.player.currentDate ||
      world.currentDate
    );

    if (!targetDate) {
      throw new Error('The post-Travel career has no valid current date.');
    }

    world.season.currentDate = targetDate;
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (player?.isCareerPlayer === true) player.currentDate = targetDate;
      }
    }

    return {
      world,
      targetDate,
      placementLevel: world.travelHockey?.placementLevel || null,
      championTeamId: world.travelHockey?.tournament?.championTeamId || null,
      tournamentMvpPlayerId: world.travelHockey?.tournament?.mvpPlayerId || null,
    };
  }

  async function findRealDannerSave() {
    if (!originalListCareerSaves) return null;
    const saves = dedupeVisibleSaves(await originalListCareerSaves());
    return saves.find(save =>
      String(save?.playerName || '').trim().toLowerCase() === TARGET_PLAYER_NAME.toLowerCase()
    ) || null;
  }

  async function getOrCreateBaseline(db) {
    const existing = await readRecord(db, DEV_BASELINE_RECORD_ID);
    if (existing?.world) return existing;

    /*
     * Phase 3.4 was developed inside the isolated dev sandbox, not the original
     * visible career. That sandbox is therefore the most faithful source for the
     * exact state produced by pressing Continue Into Offseason during our live
     * validation. Prefer it when it is already at the completed Travel boundary.
     *
     * Only fall back to the visible career if that save independently completed
     * Travel. This keeps the shortcut exact without mutating either source save.
     */
    const completedSandbox = await readRecord(db, DEV_WORLD_RECORD_ID);
    if (completedSandbox?.world) {
      try {
        const prepared = preparePostTravelOffseason(completedSandbox.world);
        const baseline = {
          id: DEV_BASELINE_RECORD_ID,
          sourceCareerId: completedSandbox.sourceCareerId || DEV_CAREER_ID,
          createdAt: new Date().toISOString(),
          checkpointDate: prepared.targetDate,
          checkpointKind: 'post-travel-offseason',
          sourceKind: 'completed-dev-sandbox',
          world: prepared.world,
        };
        await writeRecord(db, baseline);
        return baseline;
      } catch (_) {}
    }

    const realSave = await findRealDannerSave();
    if (!realSave?.id) throw new Error('Could not find a completed post-Travel career checkpoint.');

    const source = await readRecord(db, `career:${realSave.id}`);
    if (!source?.world) throw new Error('Danner Stephenson IndexedDB world record was not found.');

    const prepared = preparePostTravelOffseason(source.world);
    const baseline = {
      id: DEV_BASELINE_RECORD_ID,
      sourceCareerId: realSave.id,
      createdAt: new Date().toISOString(),
      checkpointDate: prepared.targetDate,
      checkpointKind: 'post-travel-offseason',
      sourceKind: 'visible-career',
      world: prepared.world,
    };
    await writeRecord(db, baseline);
    return baseline;
  }

  async function rebuildSandbox() {
    const db = await openDatabase();
    let prepared;

    try {
      const baseline = await getOrCreateBaseline(db);
      prepared = preparePostTravelOffseason(baseline.world);

      await writeRecord(db, {
        id: DEV_WORLD_RECORD_ID,
        savedAt: new Date().toISOString(),
        devSandbox: true,
        sourceCareerId: baseline.sourceCareerId || null,
        checkpointDate: prepared.targetDate,
        checkpointKind: 'post-travel-offseason',
        world: prepared.world,
      });
    } finally {
      db.close();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, DEV_CAREER_ID);
    localStorage.removeItem(PENDING_CAREER_ID_KEY);
    removeDevMetadataFromVisibleIndex();

    const loaded = await WorldEngine.selectCareerSave?.(DEV_CAREER_ID);
    if (!loaded) throw new Error('Could not load isolated post-Travel offseason dev career.');

    WorldEngine.archiveTravelTournamentStats?.({ save:false });
    WorldEngine.save?.();
    removeDevMetadataFromVisibleIndex();
    return prepared;
  }

  async function loadCheckpoint() {
    const result = await rebuildSandbox();

    try {
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
      document.getElementById('pi-travel-home-card')?.remove();
      document.getElementById('pi-travel-league-card')?.remove();
      document.getElementById('pi-travel-hockey-hub-canonical')?.remove();
      document.getElementById('pi-league-postseason-card')?.remove();

      openHubTab?.('home');
      if (typeof updateHubScreen === 'function') updateHubScreen();
      else refreshCareerUI?.();
    } catch (error) {
      console.warn('[Project Ice] Dev Hub refresh failed:', error);
    }

    console.info('[Project Ice] Post-Travel offseason dev checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      checkpointDate: result.targetDate,
      placementLevel: result.placementLevel,
      championTeamId: result.championTeamId,
      tournamentMvpPlayerId: result.tournamentMvpPlayerId,
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
    if (!button || button.dataset.postTravelOffseasonCheckpointWired === 'true') return;

    button.dataset.postTravelOffseasonCheckpointWired = 'true';
    button.disabled = false;
    button.removeAttribute('disabled');

    const label = button.querySelector('.btn__label');
    if (label) label.textContent = 'Skip to Post-Travel Offseason';
    if (hint) hint.classList.remove('is-visible');

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;

      loadCheckpoint()
        .catch(error => {
          console.error('[Project Ice] Dev post-Travel offseason shortcut failed:', error);
          alert(`Dev post-Travel offseason shortcut failed: ${error?.message || 'unknown error'}`);
        })
        .finally(() => {
          button.disabled = false;
        });
    }, true);
  }

  removeDevMetadataFromVisibleIndex();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireShortcut, { once:true });
  } else {
    wireShortcut();
  }
  window.setTimeout(wireShortcut, 250);
})();
