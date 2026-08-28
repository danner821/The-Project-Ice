/* ============================================================
   PROJECT ICE — career-persistence.js

   Transitional persistence bridge.

   The full Project Ice world now lives in IndexedDB. The small
   projectice_save localStorage record is only a lightweight
   Continue Career preview. This bridge rebuilds that preview from
   the canonical IndexedDB world when an older browser save lost it
   during the localStorage quota failure.
   ============================================================ */

'use strict';

(() => {
  const SAVE_KEY = 'projectice_save';
  const LEGACY_WORLD_KEY = 'projectice_world';
  const CAREER_SAVE_INDEX_KEY = 'projectice_career_save_index_v1';
  const DEV_CAREER_ID = '__project-ice-postseason-dev__';
  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';
  const RECORD_ID = 'default';
  const PREVIEW_SCHEMA_VERSION = 1;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(
        request.error || new Error('Could not open Project Ice IndexedDB.')
      );
    });
  }

  async function readAllWorldRecords() {
    const database = await openDatabase();

    try {
      return await new Promise((resolve, reject) => {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          resolve([]);
          return;
        }

        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => reject(
          request.error || new Error('Could not read Project Ice world records.')
        );
      });
    } finally {
      database.close();
    }
  }

  function visibleCareerSaves() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CAREER_SAVE_INDEX_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && String(item.id || '') !== DEV_CAREER_ID);
    } catch (_) {
      return [];
    }
  }

  function hasCanonicalCareerSave() {
    return visibleCareerSaves().length > 0;
  }

  function isRealCareerRecord(record) {
    const id = String(record?.id || '');
    return (
      id.startsWith('career:') &&
      id !== `career:${DEV_CAREER_ID}` &&
      record?.devSandbox !== true &&
      record?.world &&
      typeof record.world === 'object'
    );
  }

  function findCareerPlayer(world) {
    if (!world || typeof world !== 'object') return null;

    const worldPlayer =
      world.player && typeof world.player === 'object'
        ? world.player
        : null;

    const canonicalId =
      worldPlayer?.playerId ||
      worldPlayer?.id ||
      null;

    const teams = Array.isArray(world.teams) ? world.teams : [];

    for (const team of teams) {
      const roster = Array.isArray(team?.roster) ? team.roster : [];

      const found = roster.find(player => {
        const playerId = player?.playerId || player?.id || null;

        return (
          player?.isCareerPlayer === true ||
          String(playerId || '') === 'career-player' ||
          (
            canonicalId &&
            String(playerId || '') === String(canonicalId)
          )
        );
      });

      if (found) {
        return {
          ...found,
          teamId: found.teamId || team.teamId || null,
          schoolName: found.schoolName || team.schoolName || null,
          teamName: found.teamName || team.teamName || null,
        };
      }
    }

    if (
      worldPlayer &&
      (
        worldPlayer.firstName ||
        worldPlayer.lastName ||
        worldPlayer.teamId
      )
    ) {
      return { ...worldPlayer };
    }

    return null;
  }

  function buildPreview(player, world) {
    const worldDate =
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      player?.currentDate ||
      null;

    return {
      previewVersion: PREVIEW_SCHEMA_VERSION,
      version: '0.0.3',
      savedAt: new Date().toISOString(),
      player: {
        playerId: player?.playerId || player?.id || 'career-player',
        id: player?.id || player?.playerId || 'career-player',
        firstName: player?.firstName || '',
        lastName: player?.lastName || '',
        hometown: player?.hometown || '',
        position: player?.position || '',
        handedness: player?.handedness || '',
        archetype: player?.archetype || '',
        age: Number(player?.age) || 14,
        year: player?.year || 'Freshman',
        stage: 'hub',
        tryoutsComplete: true,
        teamId: player?.teamId || player?.highSchoolTeamId || null,
        highSchoolTeamId: player?.highSchoolTeamId || player?.teamId || null,
        currentDate: worldDate,
      },
      worldRef: world?.id || 'default',
    };
  }

  function enableContinueButton() {
    const button = document.getElementById('btn-continue');
    if (!button) return;

    const hasCareer = Boolean(localStorage.getItem(SAVE_KEY)) || hasCanonicalCareerSave();
    if (!hasCareer) return;

    if (button.disabled) button.disabled = false;
    if (button.hasAttribute('disabled')) button.removeAttribute('disabled');
    if (button.getAttribute('aria-disabled') !== 'false') {
      button.setAttribute('aria-disabled', 'false');
    }
    if (button.style.pointerEvents !== 'auto') button.style.pointerEvents = 'auto';
    if (button.classList.contains('btn--secondary')) button.classList.remove('btn--secondary');
    if (!button.classList.contains('btn--primary')) button.classList.add('btn--primary');

    const noSaveTag = button.querySelector('.btn__tag');
    if (noSaveTag) noSaveTag.remove();

    const label = button.querySelector('.btn__label');
    if (label && label.textContent !== 'Continue Career') label.textContent = 'Continue Career';

    if (!button.querySelector('.btn__arrow')) {
      const arrow = document.createElement('span');
      arrow.className = 'btn__arrow';
      arrow.textContent = '›';
      button.appendChild(arrow);
    }
  }

  function keepContinueButtonEnabled() {
    [0, 50, 250, 750, 1500].forEach(delay => {
      window.setTimeout(enableContinueButton, delay);
    });
  }

  async function repairCareerPreview() {
    if (localStorage.getItem(SAVE_KEY) || hasCanonicalCareerSave()) {
      keepContinueButtonEnabled();
      return;
    }

    try {
      const records = await readAllWorldRecords();
      const realCareerRecords = records
        .filter(isRealCareerRecord)
        .sort((a, b) => String(b?.savedAt || '').localeCompare(String(a?.savedAt || '')));

      const fallbackRecord = records.find(record => String(record?.id || '') === RECORD_ID && record?.world);
      const record = realCareerRecords[0] || fallbackRecord || null;
      const world = record?.world || null;

      if (!world) {
        console.warn('[Project Ice] No canonical IndexedDB career world exists for recovery.');
        return;
      }

      const careerPlayer = findCareerPlayer(world);

      if (!careerPlayer) {
        console.warn('[Project Ice] IndexedDB world loaded, but no career player could be identified.');
        return;
      }

      const preview = buildPreview(careerPlayer, world);

      localStorage.removeItem(LEGACY_WORLD_KEY);
      localStorage.setItem(SAVE_KEY, JSON.stringify(preview));

      keepContinueButtonEnabled();

      console.info(
        '[Project Ice] Recovered Continue Career preview from IndexedDB.',
        {
          recordId: record?.id || null,
          previewVersion: preview.previewVersion,
          playerId: preview.player.playerId,
          name: `${preview.player.firstName} ${preview.player.lastName}`.trim(),
          teamId: preview.player.teamId,
          currentDate: preview.player.currentDate,
        }
      );
    } catch (error) {
      console.error('[Project Ice] Career preview recovery failed:', error);
    }
  }

  function boot() {
    repairCareerPreview();
    keepContinueButtonEnabled();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
