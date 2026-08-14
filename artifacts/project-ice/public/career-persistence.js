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

  let continueRecoveryBound = false;

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
      return await new Promise((resolve, reject) => {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          resolve(null);
          return;
        }

        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(RECORD_ID);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(
          request.error || new Error('Could not read Project Ice world record.')
        );
      });
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

  function bindCanonicalContinueRecovery() {
    const button = document.getElementById('btn-continue');

    if (!button || continueRecoveryBound) return;

    /*
     * The title-screen listener in game.js is present, but recovered
     * IndexedDB careers can still leave the title visible without
     * throwing. This bubble listener runs after game.js's listener.
     * If game.js already navigated, it does nothing. If not, it uses
     * game.js's existing canonical sync/render helpers to finish the
     * restore from the already-loaded WorldEngine state.
     */
    button.addEventListener('click', () => {
      window.setTimeout(() => {
        const titleScreen = document.getElementById('title-screen');
        const stillOnTitle = Boolean(
          titleScreen &&
          !titleScreen.classList.contains('screen--hidden')
        );

        if (!stillOnTitle) return;

        try {
          const previewText = localStorage.getItem(SAVE_KEY);
          const preview = previewText
            ? JSON.parse(previewText)
            : null;

          if (!preview?.player) {
            throw new Error('Recovered career preview is missing player data.');
          }

          if (typeof Game !== 'object' || !Game.player) {
            throw new Error('Game state is unavailable.');
          }

          Game.player = {
            ...Game.player,
            ...preview.player,
            stage: 'hub',
            tryoutsComplete: true,
          };

          const canonicalPlayer =
            typeof syncCareerPlayerWithWorld === 'function'
              ? syncCareerPlayerWithWorld()
              : null;

          if (!canonicalPlayer) {
            throw new Error('Canonical career player could not be synchronized from WorldEngine.');
          }

          Game.player.currentDate =
            WorldEngine.state?.season?.currentDate ||
            Game.player.currentDate ||
            preview.player.currentDate ||
            null;

          if (typeof ensureCareerScheduleEventsOnLoad === 'function') {
            ensureCareerScheduleEventsOnLoad();
          }

          if (typeof refreshScheduleEvents === 'function') {
            refreshScheduleEvents();
          }

          if (typeof refreshCareerUI === 'function') {
            refreshCareerUI();
          }

          if (typeof showScreen !== 'function') {
            throw new Error('Project Ice screen router is unavailable.');
          }

          showScreen('hub');

          if (typeof ensureHubLiveGameDiagnosticButton === 'function') {
            ensureHubLiveGameDiagnosticButton();
          }

          console.info(
            '[Project Ice] Continue Career completed through canonical recovery fallback.',
            {
              playerId: Game.player.playerId || Game.player.id,
              teamId: Game.player.teamId,
              currentDate: Game.player.currentDate,
            }
          );
        } catch (error) {
          console.error(
            '[Project Ice] Canonical Continue Career recovery failed:',
            error
          );

          alert(
            [
              'CONTINUE CAREER RECOVERY ERROR',
              '',
              `Name: ${error?.name || 'Error'}`,
              `Message: ${error?.message || String(error)}`,
            ].join('\n')
          );
        }
      }, 0);
    });

    continueRecoveryBound = true;
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

    bindCanonicalContinueRecovery();
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
