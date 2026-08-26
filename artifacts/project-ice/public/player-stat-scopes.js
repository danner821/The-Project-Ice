'use strict';

/* global WorldEngine, Game, openHubTab */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (typeof globalThis.renderProjectIcePlayerStatistics !== 'function') return;

  const STYLE_ID = 'pi-player-stat-scope-styles';
  const PROFILE_CONTROL_ID = 'pi-player-profile-stat-scope';
  const MIRROR_KEYS = [
    'gamesPlayed','goals','assists','points','plusMinus','penaltyMinutes','shots',
    'powerPlayGoals','powerPlayPoints','shorthandedGoals','gameWinningGoals','minutesPlayed',
    'gamesStarted','wins','losses','overtimeLosses','shotsAgainst','saves','goalsAgainst',
    'savePercentage','goalsAgainstAverage','shutouts'
  ];

  let profileScope = 'regular-season';
  let lastProfilePlayer = null;
  let lastProfileOptions = null;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PROFILE_CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:10px 0 12px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${PROFILE_CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 9px;background:transparent;color:#6d819e;font:inherit;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      #${PROFILE_CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}
    `;
    document.head.appendChild(style);
  }

  function snapshotPlayer(player) {
    const topLevel = {};
    MIRROR_KEYS.forEach(key => { topLevel[key] = player[key]; });
    return {
      player,
      seasonStats: player.seasonStats && typeof player.seasonStats === 'object'
        ? { ...player.seasonStats }
        : player.seasonStats,
      topLevel,
    };
  }

  function applyScopedStats(player, scope) {
    const stats = WorldEngine.getPlayerStatsByScope?.(player, scope);
    if (!stats) return;
    player.seasonStats = { ...stats };
    MIRROR_KEYS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(stats, key)) player[key] = stats[key];
    });
  }

  function restorePlayer(snapshot) {
    snapshot.player.seasonStats = snapshot.seasonStats;
    MIRROR_KEYS.forEach(key => { snapshot.player[key] = snapshot.topLevel[key]; });
  }

  function careerScope() {
    const select = document.getElementById('pp-statistics-filter');
    return select?.value === 'playoffs' ? 'playoffs' : 'regular-season';
  }

  function syncProfileButtons() {
    const control = document.getElementById(PROFILE_CONTROL_ID);
    if (!control) return;
    control.querySelectorAll('button[data-scope]').forEach(button => {
      const active = button.dataset.scope === profileScope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function ensureProfileControl() {
    const table = document.getElementById('player-profile-statistics-head')?.closest('table');
    if (!table) return;
    const card = table.closest('.pp-statistics-card') || table.parentElement;
    if (!card) return;

    injectStyles();
    let control = document.getElementById(PROFILE_CONTROL_ID);
    if (!control) {
      control = document.createElement('div');
      control.id = PROFILE_CONTROL_ID;
      control.setAttribute('role', 'group');
      control.setAttribute('aria-label', 'Player statistics season phase');
      control.innerHTML = `
        <button type="button" data-scope="regular-season">Regular Season</button>
        <button type="button" data-scope="playoffs">Playoffs</button>
      `;
      card.insertAdjacentElement('beforebegin', control);
      control.addEventListener('click', event => {
        const button = event.target.closest('button[data-scope]');
        if (!button) return;
        profileScope = button.dataset.scope === 'playoffs' ? 'playoffs' : 'regular-season';
        syncProfileButtons();
        if (lastProfilePlayer && lastProfileOptions) {
          globalThis.renderProjectIcePlayerStatistics(lastProfilePlayer, lastProfileOptions);
        }
      });
    }
    syncProfileButtons();
  }

  const originalSharedRender = globalThis.renderProjectIcePlayerStatistics;

  globalThis.renderProjectIcePlayerStatistics = function(player = {}, options = {}) {
    const isStandalone = String(options?.headId || '') === 'player-profile-statistics-head';
    const scope = isStandalone ? profileScope : careerScope();

    if (isStandalone) {
      lastProfilePlayer = player;
      lastProfileOptions = options;
    }

    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    const snapshot = snapshotPlayer(player);

    try {
      applyScopedStats(player, scope);
      const result = originalSharedRender(player, options);
      if (isStandalone) ensureProfileControl();
      return result;
    } finally {
      restorePlayer(snapshot);
    }
  };

  function rerenderCareerPlayerStats() {
    const player = WorldEngine.getPlayerById?.(Game?.player?.id || Game?.player?.playerId || 'career-player') || Game?.player;
    if (!player) return;
    globalThis.renderProjectIcePlayerStatistics(player, {
      headId: 'pp-statistics-head',
      bodyId: 'pp-statistics-body',
      footId: 'pp-statistics-foot',
    });
  }

  document.getElementById('pp-statistics-filter')?.addEventListener('change', () => {
    requestAnimationFrame(rerenderCareerPlayerStats);
  });

  const originalOpenHubTab = typeof openHubTab === 'function' ? openHubTab : null;
  if (originalOpenHubTab) {
    window.openHubTab = function(tabName, ...args) {
      const result = originalOpenHubTab(tabName, ...args);
      if (String(tabName || '').toLowerCase() === 'player') {
        requestAnimationFrame(rerenderCareerPlayerStats);
      }
      return result;
    };
  }

  WorldEngine.renderScopedCareerPlayerStatistics = rerenderCareerPlayerStats;
})();
