'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__playerAwardsTabSyncInstalled === true) return;
  WorldEngine.__playerAwardsTabSyncInstalled = true;

  function renderCareerPlayerAwards() {
    if (typeof globalThis.renderProjectIcePlayerAwards !== 'function') return false;
    const player = WorldEngine.state?.player;
    if (!player) return false;

    return globalThis.renderProjectIcePlayerAwards(player, {
      listId: 'pp-awards-list',
    });
  }

  function scheduleRender() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderCareerPlayerAwards();
      });
    });
  }

  document.addEventListener('click', event => {
    const tab = event.target?.closest?.(
      '[data-tab], [data-hub-tab], [data-tab-target], .hub-tab'
    );
    const label = String(
      tab?.dataset?.tab ||
      tab?.dataset?.hubTab ||
      tab?.dataset?.tabTarget ||
      tab?.textContent ||
      ''
    ).toLowerCase();

    if (label.includes('player')) scheduleRender();
  });

  window.addEventListener('projectice:player-season-recap-complete', scheduleRender);
  window.addEventListener('projectice:next-high-school-season-started', scheduleRender);
  window.addEventListener('projectice:awards-updated', scheduleRender);

  WorldEngine.renderCareerPlayerAwards = renderCareerPlayerAwards;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRender, { once: true });
  } else {
    scheduleRender();
  }
})();
