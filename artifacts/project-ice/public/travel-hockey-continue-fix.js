'use strict';

/* global WorldEngine, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  let handling = false;

  function continueIntoSummer(event) {
    const button = event.target?.closest?.('#pi-travel-tryouts-continue');
    if (!button || handling) return;

    const root = document.getElementById('pi-travel-tryouts-screen');
    const state = WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
    if (!root || !state?.tryoutResult || !state?.placementLevel) return;

    handling = true;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    button.disabled = true;

    try {
      // Preserve the exact club shown on the placement result as the canonical
      // summer team before any world-building/reconciliation runs.
      const result = state.tryoutResult;
      if (result.placementTeamId) state.placementTeamId = result.placementTeamId;
      if (result.placementTeamName) state.placementTeamName = result.placementTeamName;
      if (result.placementTeamId) state.playerTeamId = result.placementTeamId;
      if (result.placementTeamName) state.playerTeamName = result.placementTeamName;

      WorldEngine.ensureTravelHockeyFoundation?.({ save: false });
      WorldEngine.ensureTravelHockeyWorld?.({ save: false });
      WorldEngine.save?.();

      root.remove();

      if (typeof openHubTab === 'function') openHubTab('home');
      if (typeof refreshCareerUI === 'function') refreshCareerUI();

      WorldEngine.bridgeTravelHockeyPresentation?.();
      WorldEngine.reconcileTravelSeasonUI?.();
      WorldEngine.stabilizeTravelSeasonUI?.();
    } catch (error) {
      console.error('[Project Ice] Continue Into Summer failed:', error);
      button.disabled = false;
      handling = false;
      alert(`Continue Into Summer failed: ${error?.message || 'unknown error'}`);
      return;
    }

    window.setTimeout(() => {
      handling = false;
    }, 250);
  }

  // Capture phase makes this the single authoritative handler and prevents
  // older travel runtimes from racing the placement-to-summer transition.
  document.addEventListener('click', continueIntoSummer, true);
})();
