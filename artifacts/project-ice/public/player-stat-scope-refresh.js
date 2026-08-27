'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  let queued = false;

  function tablePresent() {
    return Boolean(
      document.getElementById('pp-statistics-filter') &&
      document.getElementById('pp-statistics-body')
    );
  }

  function queueRefresh() {
    if (queued || !tablePresent()) return;
    queued = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        queued = false;
        if (!tablePresent()) return;
        WorldEngine.applyCareerPlayerStatScope?.();
      });
    });
  }

  /*
   * Attribute upgrades and a few other Player-tab actions rebuild the normal
   * statistics row as part of the core Player render. Reapply the currently
   * selected canonical scope only after that core repaint has settled.
   *
   * This intentionally does not observe the whole document and does not poll.
   */
  document.addEventListener('click', queueRefresh, true);
  document.addEventListener('change', event => {
    if (event.target?.id === 'pp-statistics-filter') queueRefresh();
  }, true);

  queueRefresh();
})();
