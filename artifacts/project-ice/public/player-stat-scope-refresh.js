'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  let observer = null;
  let observedRoot = null;
  let queued = false;
  let applying = false;

  function filter() {
    return document.getElementById('pp-statistics-filter');
  }

  function body() {
    return document.getElementById('pp-statistics-body');
  }

  function statisticsRoot() {
    const select = filter();
    const tableBody = body();
    if (!select || !tableBody) return null;
    return select.closest('.pp-statistics-card, .player-statistics, section') ||
      tableBody.closest('table')?.parentElement ||
      tableBody.parentElement;
  }

  function observeCurrentRoot() {
    const root = statisticsRoot();
    if (!root) return false;
    if (root === observedRoot && observer) return true;

    observer?.disconnect();
    observedRoot = root;
    observer = new MutationObserver(() => {
      if (!applying) queueRefresh();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return true;
  }

  function applyScope() {
    if (applying || !filter() || !body()) return;

    applying = true;
    observer?.disconnect();
    try {
      WorldEngine.applyCareerPlayerStatScope?.();
    } finally {
      applying = false;
      observeCurrentRoot();
    }
  }

  function queueRefresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (!observeCurrentRoot()) return;
      applyScope();
    });
  }

  /*
   * The Player screen can rebuild its statistics row after attribute upgrades
   * and other local renders. Watch only the statistics section so the selected
   * Regular Season / Playoffs scope remains authoritative without observing the
   * rest of the app or polling.
   */
  document.addEventListener('change', event => {
    if (event.target?.id === 'pp-statistics-filter') queueRefresh();
  }, true);

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('[data-tab], [data-hub-tab], [data-tab-target], .hub-tab, button');
    if (!target) return;
    requestAnimationFrame(() => {
      observeCurrentRoot();
      queueRefresh();
    });
  }, true);

  observeCurrentRoot();
  queueRefresh();
})();
