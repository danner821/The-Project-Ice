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
  const DB_NAME = 'projectice_database';
  const DB_VERSION = 1;
  const STORE_NAME = 'worlds';
  const RECORD_ID = 'default';
  const ACTIVE_CAREER_ID_KEY = 'projectice_active_career_id_v1';
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

  async function readWorldRecord() {
    const database = await openDatabase();

    try {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        return null;
      }

      const activeCareerId =
        localStorage.getItem(ACTIVE_CAREER_ID_KEY) ||
        null;

      const records = await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const request = transaction.objectStore(STORE_NAME).getAll();

        request.onsuccess = () => resolve(
          Array.isArray(request.result)
            ? request.result
            : []
        );

        request.onerror = () => reject(
          request.error ||
          new Error('Could not read Project Ice world records.')
        );
      });

      const careerRecords = records
        .filter(record =>
          String(record?.id || '').startsWith('career:') &&
          record?.world
        )
        .sort((a, b) =>
          String(b?.savedAt || '').localeCompare(String(a?.savedAt || ''))
        );

      if (activeCareerId) {
        const exact = careerRecords.find(record =>
          String(record.id) === `career:${activeCareerId}`
        );

        if (exact) {
          return exact;
        }
      }

      if (careerRecords.length > 0) {
        return careerRecords[0];
      }

      /*
       * The old default record is a migration source only. It is considered
       * only when no career-specific record exists at all.
       */
      return records.find(record =>
        String(record?.id || '') === RECORD_ID &&
        record?.world
      ) || null;
    } finally {
      database.close();
    }
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

      /*
       * Keep the legacy version field during the migration window so
       * existing readers remain compatible while new persistence code
       * can reason about the preview contract explicitly.
       */
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

    button.disabled = false;
    button.removeAttribute('disabled');
    button.setAttribute('aria-disabled', 'false');
    button.style.pointerEvents = 'auto';
    button.classList.remove('btn--secondary');
    button.classList.add('btn--primary');
    button.innerHTML = `
      <span class="btn__icon">📁</span>
      <span class="btn__label">Continue Career</span>
      <span class="btn__arrow">›</span>
    `;
  }

  function keepContinueButtonEnabled() {
    enableContinueButton();

    [0, 50, 250, 750, 1500].forEach(delay => {
      window.setTimeout(enableContinueButton, delay);
    });
  }

  async function repairCareerPreview() {
    if (localStorage.getItem(SAVE_KEY)) {
      keepContinueButtonEnabled();
      return;
    }

    try {
      const record = await readWorldRecord();
      const world = record?.world || null;

      if (!world) {
        console.warn('[Project Ice] No IndexedDB world exists for career recovery.');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      repairCareerPreview();
    });
  } else {
    repairCareerPreview();
  }
})();
