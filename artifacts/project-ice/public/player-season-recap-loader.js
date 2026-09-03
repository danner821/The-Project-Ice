'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  async function ensureRuntime({ method, selector, src, datasetKey }) {
    if (typeof WorldEngine[method] === 'function') return true;
    if (document.querySelector(selector)) {
      return new Promise(resolve => {
        let attempts = 0;
        const timer = setInterval(() => {
          attempts += 1;
          if (typeof WorldEngine[method] === 'function' || attempts >= 40) {
            clearInterval(timer);
            resolve(typeof WorldEngine[method] === 'function');
          }
        }, 50);
      });
    }

    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = src;
      script.dataset[datasetKey] = 'true';
      script.onload = () => resolve(typeof WorldEngine[method] === 'function');
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  function ensurePlayerSeasonRecapRuntime() {
    return ensureRuntime({
      method: 'renderPlayerSeasonRecap',
      selector: 'script[data-project-ice-player-recap-loader]',
      src: '/player-season-recap.js',
      datasetKey: 'projectIcePlayerRecapLoader',
    });
  }

  function ensureNextSeasonTransitionRuntime() {
    return ensureRuntime({
      method: 'runNextHighSchoolSeasonTransition',
      selector: 'script[data-project-ice-next-season-loader]',
      src: '/high-school-next-season-transition.js',
      datasetKey: 'projectIceNextSeasonLoader',
    });
  }

  WorldEngine.ensurePlayerSeasonRecapRuntime = ensurePlayerSeasonRecapRuntime;
  WorldEngine.ensureNextSeasonTransitionRuntime = ensureNextSeasonTransitionRuntime;

  window.addEventListener('projectice:league-season-recap-complete', async () => {
    const loaded = await ensurePlayerSeasonRecapRuntime();
    if (!loaded) {
      console.error('[Project Ice] Player Season Recap runtime failed to load.');
      return;
    }
    requestAnimationFrame(() => WorldEngine.renderPlayerSeasonRecap?.({ force: true }));
  });

  window.addEventListener('projectice:player-season-recap-complete', async () => {
    const loaded = await ensureNextSeasonTransitionRuntime();
    if (!loaded) {
      console.error('[Project Ice] Next-season transition runtime failed to load.');
      alert('Next-season transition runtime failed to load.');
      return;
    }
    WorldEngine.runNextHighSchoolSeasonTransition?.({ force: true });
  });
})();
