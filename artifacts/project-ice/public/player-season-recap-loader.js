'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  async function ensurePlayerSeasonRecapRuntime() {
    if (typeof WorldEngine.renderPlayerSeasonRecap === 'function') return true;
    if (document.querySelector('script[data-project-ice-player-recap-loader]')) {
      return new Promise(resolve => {
        let attempts = 0;
        const timer = setInterval(() => {
          attempts += 1;
          if (typeof WorldEngine.renderPlayerSeasonRecap === 'function' || attempts >= 40) {
            clearInterval(timer);
            resolve(typeof WorldEngine.renderPlayerSeasonRecap === 'function');
          }
        }, 50);
      });
    }

    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = '/player-season-recap.js';
      script.dataset.projectIcePlayerRecapLoader = 'true';
      script.onload = () => resolve(typeof WorldEngine.renderPlayerSeasonRecap === 'function');
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  WorldEngine.ensurePlayerSeasonRecapRuntime = ensurePlayerSeasonRecapRuntime;

  window.addEventListener('projectice:league-season-recap-complete', async () => {
    const loaded = await ensurePlayerSeasonRecapRuntime();
    if (!loaded) {
      console.error('[Project Ice] Player Season Recap runtime failed to load.');
      return;
    }
    requestAnimationFrame(() => WorldEngine.renderPlayerSeasonRecap?.({ force: true }));
  });
})();
