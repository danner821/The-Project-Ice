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

  function isExactPostTravelOffseason(world) {
    const travel = world?.travelHockey;
    const tournament = travel?.tournament;
    return Boolean(
      travel &&
      tournament?.status === 'complete' &&
      tournament?.championTeamId &&
      tournament?.closeoutAcknowledged === true &&
      travel?.completed === true &&
      String(world?.season?.phase || '').toLowerCase() === 'offseason'
    );
  }

  function cleanPostTravelState(world) {
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
      const isTravel =
        event?.travelTournament === true ||
        event?.travelTournamentTraining === true ||
        event?.travelHockeyEvent === true ||
        String(event?.type || '') === 'travel-game';
      if (!isTravel) return true;
      return event?.completed === true || event?.played === true || event?.isCompleted === true;
    });

    world.season.phase = 'offseason';
    const targetDate = dateKey(
      world.season.currentDate ||
      world.player.currentDate ||
      world.currentDate
    );
    if (!targetDate) throw new Error('The post-Travel checkpoint has no valid current date.');

    world.season.currentDate = targetDate;
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (player?.isCareerPlayer === true) player.currentDate = targetDate;
      }
    }

    return world;
  }

  function prepareExactPostTravelOffseason(sourceWorld) {
    if (!isExactPostTravelOffseason(sourceWorld)) return null;
    const world = cleanPostTravelState(structuredClone(sourceWorld));
    return {
      world,
      targetDate: dateKey(world.season.currentDate),
      sourceKind: 'exact-completed-travel',
    };
  }

  /*
   * Phase 3.4 was built and validated entirely in the isolated dev career. Some
   * browser/title reloads can replace that sandbox record with the older dev
   * checkpoint, so a completed Travel world is not guaranteed to still exist in
   * IndexedDB when Phase 3.5 starts.
   *
   * This fallback intentionally creates ONLY a dev checkpoint. It starts from
   * the already-stable post-Travel-Tryouts v4 baseline (which contains the real
   * HS postseason/awards/player/development state) and advances the *lifecycle*
   * to the same boundary as Continue Into Offseason. It does not touch the real
   * career, award XP, replay games, or invent HS statistics.
   *
   * Travel tournament gameplay itself has already been live-validated. For the
   * Phase 3.5 sandbox we need the correct offseason ownership/state boundary,
   * not another replay of Phase 3.4.
   */
  function synthesizePostTravelOffseason(sourceWorld) {
    const world = structuredClone(sourceWorld);
    if (!world.player || typeof world.player !== 'object') world.player = {};
    if (!world.season || typeof world.season !== 'object') world.season = {};
    if (!world.travelHockey || typeof world.travelHockey !== 'object') world.travelHockey = {};

    const travel = world.travelHockey;
    const tryoutDate = dateKey(
      travel.tryoutResult?.completedAt ||
      travel.tryoutDate ||
      world.season.currentDate ||
      world.player.currentDate ||
      world.currentDate
    );
    if (!tryoutDate) throw new Error('Could not determine the Travel checkpoint date.');

    /* The validated Travel tournament occupied roughly two tournament weeks. */
    const targetDate = addDays(tryoutDate, 16) || tryoutDate;
    const teamId = String(
      travel.playerTeamId ||
      travel.placementTeamId ||
      travel.placementTeam?.teamId ||
      'dev-travel-complete'
    );

    travel.status = 'completed';
    travel.completed = true;
    travel.syntheticDevCheckpoint = true;
    travel.syntheticPostTravelOffseason = true;
    travel.tournament = {
      ...(travel.tournament || {}),
      status: 'complete',
      championTeamId: travel.tournament?.championTeamId || teamId,
      closeoutAcknowledged: true,
      closeoutAcknowledgedAt: targetDate,
      syntheticDevCheckpoint: true,
      syntheticPostTravelOffseason: true,
    };

    world.season.phase = 'offseason';
    world.season.currentDate = targetDate;
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    if (!world.postseason || typeof world.postseason !== 'object') world.postseason = {};
    if (world.postseason.highSchool) {
      world.postseason.highSchool.status = 'complete';
      world.postseason.highSchool.phase = 'postseason-complete';
    }

    const canonical = canonicalCareerPlayer(world);
    if (canonical) canonical.currentDate = targetDate;

    cleanPostTravelState(world);
    return { world, targetDate, sourceKind: 'synthetic-from-post-tryout-baseline' };
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

    const candidates = [];

    const currentSandbox = await readRecord(db, DEV_WORLD_RECORD_ID);
    if (currentSandbox?.world) candidates.push({ record: currentSandbox, kind: 'current-dev-sandbox' });

    const realSave = await findRealDannerSave();
    if (realSave?.id) {
      const realRecord = await readRecord(db, `career:${realSave.id}`);
      if (realRecord?.world) candidates.push({ record: realRecord, kind: 'visible-career' });
    }

    for (const candidate of candidates) {
      const prepared = prepareExactPostTravelOffseason(candidate.record.world);
      if (!prepared) continue;
      const baseline = {
        id: DEV_BASELINE_RECORD_ID,
        sourceCareerId: candidate.record.sourceCareerId || realSave?.id || null,
        createdAt: new Date().toISOString(),
        checkpointDate: prepared.targetDate,
        checkpointKind: 'post-travel-offseason',
        sourceKind: candidate.kind,
        world: prepared.world,
      };
      await writeRecord(db, baseline);
      return baseline;
    }

    const legacy = await readRecord(db, LEGACY_POST_TRYOUT_BASELINE_ID);
    if (!legacy?.world) {
      throw new Error('Could not find the existing post-Travel dev baseline.');
    }

    const prepared = synthesizePostTravelOffseason(legacy.world);
    const baseline = {
      id: DEV_BASELINE_RECORD_ID,
      sourceCareerId: legacy.sourceCareerId || null,
      createdAt: new Date().toISOString(),
      checkpointDate: prepared.targetDate,
      checkpointKind: 'post-travel-offseason',
      sourceKind: prepared.sourceKind,
      world: prepared.world,
    };
    await writeRecord(db, baseline);
    return baseline;
  }

  async function rebuildSandbox() {
    const db = await openDatabase();
    let baseline;
    try {
      baseline = await getOrCreateBaseline(db);
      const world = cleanPostTravelState(structuredClone(baseline.world));
      await writeRecord(db, {
        id: DEV_WORLD_RECORD_ID,
        savedAt: new Date().toISOString(),
        devSandbox: true,
        sourceCareerId: baseline.sourceCareerId || null,
        checkpointDate: baseline.checkpointDate,
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

    WorldEngine.save?.();
    removeDevMetadataFromVisibleIndex();
    return {
      targetDate: dateKey(WorldEngine.state?.season?.currentDate),
      sourceKind: baseline.sourceKind || 'post-travel-offseason',
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

    openHubTab?.('home');
    if (typeof updateHubScreen === 'function') updateHubScreen();
    else refreshCareerUI?.();

    console.info('[Project Ice] Post-Travel offseason dev checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      checkpointDate: result.targetDate,
      sourceKind: result.sourceKind,
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
