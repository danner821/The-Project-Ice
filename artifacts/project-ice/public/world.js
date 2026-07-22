/* ============================================================
   PROJECT ICE — world.js
   Build 0.0.1

   World Engine — foundational data layer.
   Holds all game-world state separately from the player save.
   Player saves reference the world via worldRef: 'default'.

   Future systems (simulation, scheduling, roster generation)
   read and write through this object. This file has zero
   knowledge of game.js or the DOM; it is pure data + logic.
   ============================================================ */

'use strict';

/* global WorldEngine */

const WorldEngine = (() => {

  // ── Storage key (separate from the player SAVE_KEY) ────────
  const WORLD_KEY = 'projectice_world';

  // ── Seed news headlines ─────────────────────────────────────
  // Stored newest-first. Future simulation systems add real
  // headlines via WorldEngine.news.publish({ date, tag, headline }).
  const SEED_NEWS = [
    { date: '2022-09-04', tag: 'Tryouts',  headline: 'Freshman tryouts begin this week across all programs.' },
    { date: '2022-09-02', tag: 'Schedule', headline: 'League releases official preseason schedule.' },
    { date: '2022-09-01', tag: 'Scouting', headline: 'Scouts expected at upcoming showcase events this fall.' },
    { date: '2022-08-30', tag: 'Roster',   headline: 'Coaches begin finalizing preseason rosters.' },
    { date: '2022-08-28', tag: 'Rankings', headline: 'Preseason rankings set to be announced soon.' },
  ];

  // ── Default world state ─────────────────────────────────────
  // This is the authoritative shape. All fields must be present
  // here so future load() merges can fill gaps from old saves.
  function buildDefaults() {
    return {
      // Identity
      id:      'default',
      version: '0.0.1',

      // ── Time ─────────────────────────────────────────────────
      // currentDate is the in-game calendar date.
      // Stored as { year, month, day } so arithmetic is simple.
      currentDate: { year: 2022, month: 9, day: 4 },

      // Human-readable season label (e.g. '2022-23')
      currentSeason: '2022-23',

      // Week number within the current season (1-indexed)
      currentWeek: 1,

      // Calendar year matching currentDate.year
      currentYear: 2022,

      // ── League ───────────────────────────────────────────────
      league: {
        name: 'Midwest Youth Hockey League',
        // Future fields: divisions, tiers, numTeams, etc.
      },

      // ── World collections ────────────────────────────────────
      // All empty at this stage. Future generation systems
      // populate these and call WorldEngine.save() to persist.
      teams:            [],   // { id, name, city, division, … }
      players:          [],   // { id, name, position, teamId, … }
      schedule:         [],   // { id, homeTeamId, awayTeamId, date, … }
      standings:        [],   // { teamId, wins, losses, points, … }
      prospectRankings: [],   // { rank, playerId, … }

      // ── News ─────────────────────────────────────────────────
      // Managed via WorldEngine.news — not written directly.
      // Stored here so it persists with the world save.
      newsItems: SEED_NEWS.map(item => ({ ...item })),
    };
  }

  // ── Internal mutable state ──────────────────────────────────
  let _state = buildDefaults();

  // ── News subsystem ──────────────────────────────────────────
  // Exposes the same API surface as the old NewsSystem IIFE so
  // game.js can alias it: const NewsSystem = WorldEngine.news;
  //
  // Dependency inversion: game.js registers renderHubNews via
  // WorldEngine.news.onNewsChange() so this file never touches
  // the DOM or references any game.js symbol.

  let _onNewsChange = null;

  const news = {
    /**
     * Register a callback invoked after every publish().
     * Called once by game.js after renderHubNews is defined.
     * @param {Function} cb
     */
    onNewsChange(cb) {
      _onNewsChange = cb;
    },

    /**
     * Add a headline to the top of the feed and notify listeners.
     * @param {{ date: string, tag: string, headline: string }} item
     */
    publish({ date, tag, headline }) {
      _state.newsItems.unshift({ date, tag, headline });
      if (typeof _onNewsChange === 'function') _onNewsChange();
    },

    /**
     * Return the n most recent headlines (default 3).
     * @param {number} n
     * @returns {{ date: string, tag: string, headline: string }[]}
     */
    getRecent(n = 3) {
      return _state.newsItems.slice(0, n);
    },
  };

  // ── Persistence ─────────────────────────────────────────────
  // World state is persisted separately from the player save.
  // Call save() after any simulation step that mutates _state.
  // Call load() in init(); if no stored world exists it silently
  // falls back to defaults.

  function save() {
    try {
      localStorage.setItem(WORLD_KEY, JSON.stringify(_state));
    } catch (err) {
      console.error('[WorldEngine] Save failed:', err);
    }
  }

  /**
   * Load a persisted world. Merges stored data over defaults so
   * missing fields from older save versions are back-filled.
   * @returns {boolean} true if a stored world was found and loaded.
   */
  function load() {
    try {
      const stored = localStorage.getItem(WORLD_KEY);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      _state = { ...buildDefaults(), ...parsed };
      // Deep-merge news so seed headlines survive a fresh install
      // when no stored news exists yet.
      if (!Array.isArray(_state.newsItems) || _state.newsItems.length === 0) {
        _state.newsItems = SEED_NEWS.map(item => ({ ...item }));
      }
      return true;
    } catch (err) {
      console.error('[WorldEngine] Load failed:', err);
      return false;
    }
  }

  /** Reset to defaults and wipe the stored world. */
  function reset() {
    _state = buildDefaults();
    localStorage.removeItem(WORLD_KEY);
  }

  // ── Public API ───────────────────────────────────────────────

  return {
    /**
     * Direct read access to world state.
     * Future simulation code reads _state.teams, _state.schedule, etc.
     * Do not mutate _state.newsItems directly — use news.publish().
     */
    get state() { return _state; },

    /** The storage key, exposed so game.js can reference it if needed. */
    WORLD_KEY,

    news,
    save,
    load,
    reset,
  };

})();
