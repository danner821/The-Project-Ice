'use strict';

/* global WorldEngine, Game, openHubTab, refreshCareerUI */

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
  const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-post-travel-tryouts-v2';

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

      /*
       * During the recent dev-shortcut regression several separate career ids
       * could point at the exact same visible Danner snapshot. Hide only exact
       * visible duplicates; careers that differ by even one day remain separate.
       * No IndexedDB world is deleted here.
       */
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

  function regularSeasonEndDate(world) {
    const dates = (world?.schedule || [])
      .filter(event => String(event?.type || '').toLowerCase() === 'game' && event?.isPlayoff !== true)
      .map(event => dateKey(event?.date))
      .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .sort();
    return dates[dates.length - 1] || '2027-04-22';
  }

  function preparePostTravelTryouts(sourceWorld) {
    const world = structuredClone(sourceWorld);
    if (!world.postseason || typeof world.postseason !== 'object') world.postseason = {};

    const existing = world.postseason.highSchool || {};
    const regularEnd = dateKey(existing.regularSeasonEndDate) || regularSeasonEndDate(world);
    const completedDate = dateKey(existing.completedDate) || addDays(regularEnd, 28) || '2027-05-20';
    const championDate = dateKey(existing.championCheckpointAcknowledgedAt) || addDays(completedDate, 1);
    const ceremonyDate = dateKey(existing.awardsCeremonyDate) || addDays(championDate, 7);
    const tryoutDate = addDays(ceremonyDate, 7);
    const targetDate = addDays(tryoutDate, 1);

    if (!championDate || !ceremonyDate || !tryoutDate || !targetDate) {
      throw new Error('Could not determine post-Travel Tryouts checkpoint date.');
    }

    const rounds = existing?.bracket?.rounds || {};
    world.postseason.highSchool = {
      ...existing,
      initialized: true,
      checkpointAcknowledged: true,
      status: 'complete',
      phase: 'postseason-complete',
      regularSeasonEndDate: regularEnd,
      completedDate,
      championCheckpointAcknowledged: true,
      championCheckpointAcknowledgedAt: championDate,
      offseasonStartedDate: championDate,
      awardsCeremonyDate: ceremonyDate,
      awardsCeremonyAcknowledged: true,
      awardsCeremonyAcknowledgedAt: ceremonyDate,
      bracket: {
        ...(existing.bracket || {}),
        format: existing?.bracket?.format || 'six-team-bye-best-of-three',
        qualifierCount: Number(existing?.bracket?.qualifierCount) || 6,
        rounds: {
          roundOne: Array.isArray(rounds.roundOne) ? rounds.roundOne : [],
          semifinals: Array.isArray(rounds.semifinals) ? rounds.semifinals : [],
          championship: Array.isArray(rounds.championship) ? rounds.championship : [],
        },
      },
      syntheticDevCheckpoint: true,
    };

    if (!world.player || typeof world.player !== 'object') world.player = {};

    const canonicalCareerPlayer =
      (world.teams || [])
        .flatMap(team =>
          Array.isArray(team?.roster)
            ? team.roster
            : []
        )
        .find(player =>
          player?.isCareerPlayer === true
        ) ||
      null;

    if (canonicalCareerPlayer) {
      const canonicalCareerPlayerId =
        canonicalCareerPlayer.playerId ||
        canonicalCareerPlayer.id ||
        'career-player';

      world.player.playerId =
        canonicalCareerPlayerId;

      world.player.id =
        canonicalCareerPlayerId;
    }

    const overall = Math.max(40, Math.min(99, Math.round(Number(world.player.overall ?? world.player.ovr ?? 60))));
    const neutralForm = Math.max(50, Math.min(85, Math.round(Number(world.player.currentForm ?? world.player.form ?? 65))));
    const drillAverage = Math.max(68, Math.min(82, Math.round(overall + 7)));
    const evaluation = Math.round(overall * 0.55 + neutralForm * 0.15 + drillAverage * 0.30);
    const level = evaluation >= 84 ? 'AAA' : evaluation >= 76 ? 'AA' : evaluation >= 68 ? 'A' : 'B';

    const clubs = [
      { id: 'arizona-jr-coyotes', name: 'Arizona Jr. Coyotes', city: 'Phoenix, AZ' },
      { id: 'colorado-thunderbirds', name: 'Colorado Thunderbirds', city: 'Denver, CO' },
      { id: 'dallas-stars-elite', name: 'Dallas Stars Elite', city: 'Dallas, TX' },
      { id: 'chicago-mission', name: 'Chicago Mission', city: 'Chicago, IL' },
      { id: 'little-caesars', name: 'Little Caesars', city: 'Detroit, MI' },
      { id: 'pittsburgh-penguins-elite', name: 'Pittsburgh Penguins Elite', city: 'Pittsburgh, PA' },
      { id: 'boston-jr-eagles', name: 'Boston Jr. Eagles', city: 'Boston, MA' },
      { id: 'la-jr-kings', name: 'LA Jr. Kings', city: 'Los Angeles, CA' },
    ];

    const careerPlayerId = String(world.player.playerId || world.player.id || 'career-player');
    const placementSeed = `${careerPlayerId}|${tryoutDate}|${evaluation}|${level}`;
    let hash = 2166136261;
    for (const ch of placementSeed) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const club = clubs[(hash >>> 0) % clubs.length];
    const playerName = String(
      world.player.name ||
      world.player.playerName ||
      [world.player.firstName, world.player.lastName].filter(Boolean).join(' ') ||
      TARGET_PLAYER_NAME
    );

    const drillScores = {
      skating: drillAverage,
      skill: drillAverage,
      scrimmage: drillAverage,
    };

    world.travelHockey = {
      version: 1,
      status: 'placement-complete',
      awardsCeremonyDate: ceremonyDate,
      tryoutDate,
      levels: ['B', 'A', 'AA', 'AAA'],
      guaranteedMinimumLevel: 'B',
      placementLevel: level,
      placementTeamId: club.id,
      placementTeamName: club.name,
      playerTeamId: null,
      playerTeamName: club.name,
      placementTeam: {
        teamId: club.id,
        clubId: club.id,
        name: club.name,
        city: club.city,
        level,
      },
      tryoutResult: {
        completedAt: tryoutDate,
        playerName,
        overallAtTryouts: overall,
        formScore: neutralForm,
        drillAverage,
        drillScores,
        evaluationScore: evaluation,
        placementLevel: level,
        placementTeamId: club.id,
        placementTeamName: club.name,
        placementTeamCity: club.city,
        scoutingSummary: `Dev checkpoint: completed Travel tryouts at ${level} level.`,
        reps: [],
        randomClubApplied: true,
        syntheticDevCheckpoint: true,
      },
      tournament: null,
      completed: false,
      syntheticDevCheckpoint: true,
    };

    if (!Array.isArray(world.schedule)) world.schedule = [];
    let tryoutEvent = world.schedule.find(event =>
      String(event?.eventId || event?.id || '') === 'travel-hockey-tryouts'
    );
    if (!tryoutEvent) {
      tryoutEvent = {
        id: 'travel-hockey-tryouts',
        eventId: 'travel-hockey-tryouts',
        eventKey: 'travel-hockey-tryouts',
        type: 'meeting',
        eventType: 'tryout',
        label: 'Travel Hockey Tryouts',
        shortLabel: 'Travel Tryouts',
        icon: '🏒',
        location: 'Regional Ice Center',
        objective: 'Compete for your summer travel hockey placement.',
        offseasonEvent: true,
        travelHockeyEvent: true,
        travelTryoutEvent: true,
        requiresPlayerInteraction: true,
      };
      world.schedule.push(tryoutEvent);
    }
    Object.assign(tryoutEvent, {
      date: tryoutDate,
      completed: true,
      played: true,
      status: 'completed',
      completedAt: tryoutDate,
    });
    world.schedule.sort((a, b) => dateKey(a?.date).localeCompare(dateKey(b?.date)));

    if (!world.season || typeof world.season !== 'object') world.season = {};
    world.season.currentDate = targetDate;
    world.season.phase = 'offseason-travel-hockey';
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        const id = player?.playerId || player?.id || null;
        if (
          player?.isCareerPlayer === true ||
          String(id || '') === careerPlayerId ||
          String(id || '') === 'career-player'
        ) {
          player.currentDate = targetDate;
        }
      }
    }

    return { world, targetDate, tryoutDate, ceremonyDate, placementLevel: level, placementTeamName: club.name };
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

    const realSave = await findRealDannerSave();
    if (!realSave?.id) throw new Error('Could not find the real Danner Stephenson career save.');

    const source = await readRecord(db, `career:${realSave.id}`);
    if (!source?.world) throw new Error('Danner Stephenson IndexedDB world record was not found.');

    const prepared = preparePostTravelTryouts(source.world);
    const baseline = {
      id: DEV_BASELINE_RECORD_ID,
      sourceCareerId: realSave.id,
      createdAt: new Date().toISOString(),
      world: prepared.world,
    };
    await writeRecord(db, baseline);
    return baseline;
  }

  async function rebuildSandbox() {
    const db = await openDatabase();
    let prepared;

    try {
      /*
       * Fast path: after the first successful build, every dev run clones the
       * isolated baseline directly. It no longer scans or rewrites real saves.
       */
      const baseline = await getOrCreateBaseline(db);
      prepared = preparePostTravelTryouts(baseline.world);

      await writeRecord(db, {
        id: DEV_WORLD_RECORD_ID,
        savedAt: new Date().toISOString(),
        devSandbox: true,
        sourceCareerId: baseline.sourceCareerId || null,
        checkpointDate: prepared.targetDate,
        travelTryoutDate: prepared.tryoutDate,
        world: prepared.world,
      });
    } finally {
      db.close();
    }

    localStorage.setItem(ACTIVE_CAREER_ID_KEY, DEV_CAREER_ID);
    localStorage.removeItem(PENDING_CAREER_ID_KEY);
    removeDevMetadataFromVisibleIndex();

    const loaded = await WorldEngine.selectCareerSave?.(DEV_CAREER_ID);
    if (!loaded) throw new Error('Could not load isolated post-Travel Tryouts dev career.');

    WorldEngine.ensureTravelHockeyFoundation?.({ save: false });
    WorldEngine.ensureTravelHockeyWorld?.({ save: false });
    WorldEngine.rebuildTravelHockeyRosters?.();
    WorldEngine.save?.();
    removeDevMetadataFromVisibleIndex();
    return prepared;
  }

  async function loadCheckpoint() {
    const result = await rebuildSandbox();

    /*
     * Never touch projectice_save here. The dev sandbox must not rewrite the
     * real career preview or create/recover visible careers.
     */
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

      openHubTab?.('home');
      refreshCareerUI?.();
      WorldEngine.bridgeTravelHockeyPresentation?.();
    } catch (error) {
      console.warn('[Project Ice] Dev Hub refresh failed:', error);
    }

    console.info('[Project Ice] Post-Travel Tryouts dev checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      checkpointDate: result.targetDate,
      tryoutDate: result.tryoutDate,
      placementLevel: result.placementLevel,
      placementTeamName: result.placementTeamName,
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
    if (!button || button.dataset.travelTryoutCheckpointWired === 'true') return;

    button.dataset.travelTryoutCheckpointWired = 'true';
    button.disabled = false;
    button.removeAttribute('disabled');

    const label = button.querySelector('.btn__label');
    if (label) label.textContent = 'Skip to Post-Travel Tryouts';
    if (hint) hint.classList.remove('is-visible');

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.disabled = true;

      loadCheckpoint()
        .catch(error => {
          console.error('[Project Ice] Dev post-Travel Tryouts shortcut failed:', error);
          alert(`Dev post-Travel Tryouts shortcut failed: ${error?.message || 'unknown error'}`);
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
  window.setTimeout(wireShortcut, 250);
})();
