'use strict';

/* global WorldEngine, Game, renderFullStatsScreen */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof renderFullStatsScreen !== 'function') return;

  const STYLE_ID = 'pi-full-stats-scope-styles';
  const CONTROL_ID = 'pi-full-stats-scope-control';
  const MIRROR_KEYS = [
    'gamesPlayed','goals','assists','points','plusMinus','penaltyMinutes','shots',
    'powerPlayGoals','powerPlayPoints','shorthandedGoals','gameWinningGoals','minutesPlayed',
    'gamesStarted','wins','losses','overtimeLosses','shotsAgainst','saves','goalsAgainst',
    'savePercentage','goalsAgainstAverage','shutouts'
  ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:0 0 14px;padding:4px;border:1px solid rgba(89,151,239,.18);border-radius:14px;background:rgba(5,18,36,.52)}
      #${CONTROL_ID} button{appearance:none;border:0;border-radius:10px;padding:10px 12px;background:transparent;color:#6f86a4;font:inherit;font-size:11px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;transition:background .15s ease,color .15s ease,box-shadow .15s ease}
      #${CONTROL_ID} button.is-active{background:linear-gradient(135deg,rgba(54,126,225,.28),rgba(34,82,157,.25));color:#cfe2ff;box-shadow:inset 0 0 0 1px rgba(103,168,255,.22)}
      .pi-full-stats-playoff-note{margin:0 0 12px;color:#7186a2;font-size:11px;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

  function currentScope() {
    if (typeof Game !== 'undefined' && Game.fullStatsScope === 'playoffs') return 'playoffs';
    return 'regular-season';
  }

  function ensureControl() {
    const controls = document.querySelector('#full-stats-screen .full-stats-controls');
    if (!controls) return;

    injectStyles();
    let root = document.getElementById(CONTROL_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = CONTROL_ID;
      root.setAttribute('role', 'group');
      root.setAttribute('aria-label', 'Season phase');
      root.innerHTML = `
        <button type="button" data-scope="regular-season">Regular Season</button>
        <button type="button" data-scope="playoffs">Playoffs</button>
      `;
      controls.insertAdjacentElement('beforebegin', root);

      root.addEventListener('click', event => {
        const button = event.target.closest('button[data-scope]');
        if (!button) return;
        if (typeof Game !== 'undefined') Game.fullStatsScope = button.dataset.scope;
        window.renderFullStatsScreen();
      });
    }

    const scope = currentScope();
    root.querySelectorAll('button[data-scope]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.scope === scope);
      button.setAttribute('aria-pressed', button.dataset.scope === scope ? 'true' : 'false');
    });
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

  function alignPlayoffScoringTiebreaks() {
    if (currentScope() !== 'playoffs') return;
    if (String(Game?.fullStatsView || 'skaters') !== 'skaters') return;

    const sort = Game?.fullStatsSort?.skaters;
    if (!sort || sort.key !== 'points' || sort.direction !== 'desc') return;

    const body = document.getElementById('full-stats-table-body');
    if (!body) return;

    const rows = Array.from(body.querySelectorAll('tr'));
    if (rows.length < 2) return;

    const value = (row, index) => Number(row.children?.[index]?.textContent?.trim()) || 0;
    const name = row => String(row.children?.[0]?.textContent || '').trim();

    rows.sort((a, b) =>
      value(b, 6) - value(a, 6) ||
      value(b, 4) - value(a, 4) ||
      value(b, 5) - value(a, 5) ||
      name(a).localeCompare(name(b))
    );

    rows.forEach(row => body.appendChild(row));
  }

  const originalRender = renderFullStatsScreen;

  window.renderFullStatsScreen = function(...args) {
    const scope = currentScope();
    WorldEngine.rebuildHighSchoolPostseasonStats?.();

    const players = WorldEngine.getAllWorldPlayers?.() || [];
    const snapshots = players.map(snapshotPlayer);

    try {
      players.forEach(player => applyScopedStats(player, scope));
      const result = originalRender(...args);
      ensureControl();

      const context = document.getElementById('full-stats-context');
      if (context) {
        const base = String(context.textContent || '').replace(/\s+[·•]\s+(Regular Season|Playoffs)$/i, '');
        context.textContent = `${base} · ${scope === 'playoffs' ? 'Playoffs' : 'Regular Season'}`;
      }

      alignPlayoffScoringTiebreaks();
      return result;
    } finally {
      snapshots.forEach(restorePlayer);
    }
  };

  if (typeof Game !== 'undefined' && !Game.fullStatsScope) {
    Game.fullStatsScope = 'regular-season';
  }
})();
