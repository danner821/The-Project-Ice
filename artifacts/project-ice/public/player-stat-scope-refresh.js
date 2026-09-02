'use strict';

/* global WorldEngine, Game, updateHubScreen, refreshCareerUI */

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

  function bindCareerSnapshotToCanonicalPlayer() {
    if (
      typeof Game === 'undefined' ||
      !Game?.player ||
      typeof WorldEngine.getCareerPlayer !== 'function'
    ) {
      return null;
    }

    const canonicalPlayer = WorldEngine.getCareerPlayer();
    if (!canonicalPlayer) return null;

    /*
     * The WorldEngine roster player is the permanent source of truth for
     * development. Game.player is only a lightweight UI/career snapshot.
     *
     * Travel and playoff game completion correctly mutate the canonical
     * player's development.attributeXP. Rebind the UI snapshot from that
     * canonical record before the Player screen renders so the screen cannot
     * continue displaying an older zero-XP copy.
     *
     * This does not calculate, award, spend, or redistribute XP.
     */
    Game.player = {
      ...Game.player,
      ...canonicalPlayer,

      attributes: {
        ...(canonicalPlayer.attributes || {}),
      },

      seasonStats: {
        ...(canonicalPlayer.seasonStats || {}),
      },

      careerStats: {
        ...(canonicalPlayer.careerStats || {}),
      },

      development: {
        ...(canonicalPlayer.development || {}),

        attributeXP: {
          ...(canonicalPlayer.development?.attributeXP || {}),
        },

        attributeXPEarnedCareer: {
          ...(canonicalPlayer.development?.attributeXPEarnedCareer || {}),
        },

        xpEarnedByCategory: {
          ...(canonicalPlayer.development?.xpEarnedByCategory || {}),
        },

        attributeUpgradeCounts: {
          ...(canonicalPlayer.development?.attributeUpgradeCounts || {}),
        },
      },
    };

    return canonicalPlayer;
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

    const openingPlayerTab =
      String(target?.dataset?.hubTab || '').toLowerCase() === 'player';

    requestAnimationFrame(() => {
      if (openingPlayerTab) {
        bindCareerSnapshotToCanonicalPlayer();

        /*
         * IMPORTANT: refreshCareerUI() does NOT render the Player tab. It only
         * refreshes schedule/calendar/team surfaces. The full Player attributes
         * renderer lives inside updateHubScreen(), which calls
         * syncCareerPlayerWithWorld() and renderCareerPlayerAttributes().
         *
         * Previous fixes correctly rebound the canonical development state, but
         * then called the wrong refresh function, leaving the old zero-XP DOM in
         * place. Use the actual hub renderer here so the visible attribute rows
         * are rebuilt from the canonical player that already holds the XP.
         */
        if (typeof updateHubScreen === 'function') {
          updateHubScreen();
        } else if (typeof refreshCareerUI === 'function') {
          refreshCareerUI();
        }
      }

      observeCurrentRoot();
      queueRefresh();
    });
  }, true);

  observeCurrentRoot();
  queueRefresh();
})();
