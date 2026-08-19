'use strict';

/* global WorldEngine, recoverCareerPreviewFromWorld, loadCareerPreview, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const TARGET_PLAYER_NAME = 'Danner Stephenson';
  const TARGET_DATE = '2027-04-29';
  const SAVE_KEY = 'projectice_save';

  function resetPostseasonTestState() {
    const world = WorldEngine.state;
    if (!world || typeof world !== 'object') return false;

    if (Array.isArray(world.schedule)) {
      world.schedule = world.schedule.filter(event => event?.isPlayoff !== true);
    }

    if (!world.postseason || typeof world.postseason !== 'object') {
      world.postseason = {};
    }
    world.postseason.highSchool = null;

    if (world.season && typeof world.season === 'object') {
      world.season.currentDate = TARGET_DATE;
      world.season.phase = 'regular-season-complete';
      world.season.postseason = {
        qualified: false,
        started: false,
        completed: false,
      };
    }

    if (world.player && typeof world.player === 'object') {
      world.player.currentDate = TARGET_DATE;
    }

    world.currentDate = TARGET_DATE;

    return true;
  }

  async function loadDannerCheckpoint() {
    const saves = await WorldEngine.listCareerSaves?.();
    const target = (Array.isArray(saves) ? saves : []).find(save =>
      String(save?.playerName || '').trim().toLowerCase() === TARGET_PLAYER_NAME.toLowerCase()
    );

    if (!target?.id) {
      alert('Dev shortcut could not find the Danner Stephenson career save.');
      return;
    }

    const loaded = await WorldEngine.selectCareerSave(target.id);
    if (!loaded) {
      alert('Dev shortcut could not load the Danner Stephenson career save.');
      return;
    }

    if (!resetPostseasonTestState()) {
      alert('Dev shortcut could not reset the postseason checkpoint state.');
      return;
    }

    await WorldEngine.save?.();

    try {
      localStorage.removeItem(SAVE_KEY);
      if (typeof recoverCareerPreviewFromWorld === 'function') {
        recoverCareerPreviewFromWorld();
      }
      if (typeof loadCareerPreview === 'function') {
        loadCareerPreview();
      }
    } catch (error) {
      console.warn('[Project Ice] Dev shortcut preview refresh failed:', error);
    }

    try {
      if (typeof openHubTab === 'function') openHubTab('home');
      if (typeof refreshCareerUI === 'function') refreshCareerUI();
    } catch (error) {
      console.warn('[Project Ice] Dev shortcut Hub refresh failed:', error);
    }

    console.info('[Project Ice] Dev postseason checkpoint loaded.', {
      playerName: TARGET_PLAYER_NAME,
      date: TARGET_DATE,
      saveId: target.id,
    });
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
        alert('Dev postseason shortcut failed. Check the console for details.');
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
