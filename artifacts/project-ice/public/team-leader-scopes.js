'use strict';

/* global WorldEngine, Game, openHubTab, openTeamTab */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CONTROL_ID = 'pi-team-leaders-scope';
  const STYLE_ID = 'pi-team-leaders-scope-styles';
  let selectedScope = 'regular-season';

  const playerName = player =>
    `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Unknown Player';

  function postseasonAvailable() {
    const hs = WorldEngine.state?.postseason?.highSchool;
    return Boolean(hs && hs.initialized === true);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:10px 0 14px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 9px;background:transparent;color:#6d819e;font:inherit;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      #${CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}
      .pi-team-leader-empty{color:#647892!important;font-weight:700!important}
    `;
    document.head.appendChild(style);
  }

  function currentTeam() {
    const teamId = Game?.player?.teamId || Game?.player?.highSchoolTeamId || null;
    return teamId ? WorldEngine.getTeamById?.(teamId) || null : null;
  }

  function scopedEntries(team, goalie) {
    const roster = Array.isArray(team?.roster) ? team.roster : [];
    return roster
      .filter(player => goalie
        ? String(player?.position || '').toUpperCase() === 'G'
        : String(player?.position || '').toUpperCase() !== 'G')
      .map(player => ({
        player,
        stats: WorldEngine.getPlayerStatsByScope?.(player, selectedScope) || null,
      }))
      .filter(entry => entry.stats && Number(entry.stats.gamesPlayed || 0) > 0);
  }

  function best(entries, key, secondaryKey = null) {
    return [...entries].sort((a, b) =>
      Number(b.stats?.[key] || 0) - Number(a.stats?.[key] || 0) ||
      (secondaryKey ? Number(b.stats?.[secondaryKey] || 0) - Number(a.stats?.[secondaryKey] || 0) : 0) ||
      playerName(a.player).localeCompare(playerName(b.player))
    )[0] || null;
  }

  function formatLeader(entry, key, formatter = value => String(value)) {
    if (!entry) return 'No stats yet';
    return `${playerName(entry.player)} · ${formatter(entry.stats?.[key] || 0)}`;
  }

  function updateLeaderValues() {
    const team = currentTeam();
    if (!team) return;

    WorldEngine.rebuildHighSchoolPostseasonStats?.();

    const skaters = scopedEntries(team, false);
    const goalies = scopedEntries(team, true);

    const goals = best(skaters, 'goals', 'points');
    const assists = best(skaters, 'assists', 'points');
    const points = [...skaters].sort((a, b) =>
      Number(b.stats.points || 0) - Number(a.stats.points || 0) ||
      Number(b.stats.goals || 0) - Number(a.stats.goals || 0) ||
      Number(b.stats.assists || 0) - Number(a.stats.assists || 0) ||
      playerName(a.player).localeCompare(playerName(b.player))
    )[0] || null;
    const wins = best(goalies, 'wins', 'savePercentage');
    const savePct = best(goalies, 'savePercentage', 'wins');

    const values = {
      'team-leader-goals': formatLeader(goals, 'goals'),
      'team-leader-assists': formatLeader(assists, 'assists'),
      'team-leader-points': formatLeader(points, 'points'),
      'team-leader-wins': formatLeader(wins, 'wins'),
      'team-leader-save-percentage': formatLeader(
        savePct,
        'savePercentage',
        value => Number(value || 0).toFixed(3).replace(/^0/, '')
      ),
    };

    Object.entries(values).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.textContent = text;
      element.classList.toggle('pi-team-leader-empty', text === 'No stats yet');
    });
  }

  function ensureControl() {
    const section = document.querySelector('#hub-tab-team .team-leaders');
    const header = section?.querySelector('.team-leaders__header');
    if (!section || !header) return;

    injectStyles();

    let control = document.getElementById(CONTROL_ID);
    if (!postseasonAvailable()) {
      control?.remove();
      selectedScope = 'regular-season';
      updateLeaderValues();
      return;
    }

    if (!control) {
      control = document.createElement('div');
      control.id = CONTROL_ID;
      control.setAttribute('role', 'group');
      control.setAttribute('aria-label', 'Team leader season phase');
      control.innerHTML = `
        <button type="button" data-scope="regular-season">Regular Season</button>
        <button type="button" data-scope="playoffs">Playoffs</button>
      `;
      header.insertAdjacentElement('afterend', control);

      control.addEventListener('click', event => {
        const button = event.target.closest('button[data-scope]');
        if (!button) return;
        selectedScope = button.dataset.scope === 'playoffs' ? 'playoffs' : 'regular-season';
        syncButtons();
        updateLeaderValues();
      });
    }

    syncButtons();

    const fullStatsButton = document.getElementById('team-view-full-stats');
    if (fullStatsButton && fullStatsButton.dataset.piScopeBound !== 'true') {
      fullStatsButton.dataset.piScopeBound = 'true';
      fullStatsButton.addEventListener('click', () => {
        if (typeof Game !== 'undefined') Game.fullStatsScope = selectedScope;
      }, true);
    }
  }

  function syncButtons() {
    const control = document.getElementById(CONTROL_ID);
    if (!control) return;
    control.querySelectorAll('button[data-scope]').forEach(button => {
      const active = button.dataset.scope === selectedScope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function render() {
    ensureControl();
    updateLeaderValues();
  }

  const originalOpenHubTab = typeof openHubTab === 'function' ? openHubTab : null;
  if (originalOpenHubTab) {
    window.openHubTab = function(tabName, ...args) {
      const result = originalOpenHubTab(tabName, ...args);
      if (String(tabName || '').toLowerCase() === 'team') requestAnimationFrame(render);
      return result;
    };
  }

  const originalOpenTeamTab = typeof openTeamTab === 'function' ? openTeamTab : null;
  if (originalOpenTeamTab) {
    window.openTeamTab = function(...args) {
      const result = originalOpenTeamTab(...args);
      requestAnimationFrame(render);
      return result;
    };
  }

  WorldEngine.renderScopedTeamLeaders = render;
})();
