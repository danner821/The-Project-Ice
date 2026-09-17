'use strict';

/* global WorldEngine, renderStandingsScreen */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__standingsSeasonLabelInstalled === true) return;
  WorldEngine.__standingsSeasonLabelInstalled = true;

  const canonicalSeasonLabel = () =>
    WorldEngine.state?.season?.label ||
    WorldEngine.state?.season?.seasonLabel ||
    WorldEngine.state?.currentSeason ||
    null;

  const syncStandingsSeasonLabel = () => {
    const badge = document.querySelector('#standings-screen .sl-season-badge');
    const seasonLabel = canonicalSeasonLabel();

    if (badge && seasonLabel) {
      badge.textContent = String(seasonLabel).replace('-', '–');
    }
  };

  if (typeof renderStandingsScreen === 'function') {
    const originalRenderStandingsScreen = renderStandingsScreen;

    renderStandingsScreen = function renderCanonicalStandingsScreen(...args) {
      const result = originalRenderStandingsScreen.apply(this, args);
      syncStandingsSeasonLabel();
      return result;
    };
  }

  window.addEventListener('projectice:next-high-school-season-started', syncStandingsSeasonLabel);

  syncStandingsSeasonLabel();
})();
