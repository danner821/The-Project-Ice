'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CONTROL_ID = 'pi-team-profile-leaders-scope';
  const STYLE_ID = 'pi-team-profile-leaders-scope-styles';
  let selectedScope = 'regular-season';

  const playerName = player =>
    `${player?.firstName || ''} ${player?.lastName || ''}`.trim() ||
    player?.name || player?.playerName || 'Unknown Player';

  function postseasonAvailable() {
    const hs = WorldEngine.state?.postseason?.highSchool;
    return Boolean(hs?.initialized === true);
  }

  function profileVisible() {
    const screen = document.getElementById('team-profile-screen');
    return Boolean(screen && !screen.classList.contains('screen--hidden'));
  }

  function profileRoot() {
    return document.getElementById('team-profile-modern-content');
  }

  function travelProfileTeam() {
    const root = profileRoot();
    const teamId = String(root?.dataset?.travelTeamId || '');
    if (!teamId) return null;
    const travel = WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
    return (travel?.teams || []).find(team => String(team?.teamId || '') === teamId) || null;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:10px 0 14px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 9px;background:transparent;color:#6d819e;font:inherit;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      #${CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}
      #team-profile-screen .pi-team-leader-empty{color:#647892!important;font-weight:700!important}
    `;
    document.head.appendChild(style);
  }

  function resolveProfileTeam() {
    const travelTeam = travelProfileTeam();
    if (travelTeam) return travelTeam;

    const root = profileRoot();
    if (!root) return null;

    const playerNode = root.querySelector('[data-player-id]');
    const playerId = playerNode?.dataset?.playerId;
    if (playerId) {
      const player = WorldEngine.getPlayerById?.(playerId);
      if (player?.teamId) {
        const team = WorldEngine.getTeamById?.(player.teamId);
        if (team) return team;
      }
    }

    const abbreviation = String(
      root.querySelector('[id*="team-abbr"], [id*="team-abbreviation"]')?.textContent || ''
    ).trim().toLowerCase();
    if (abbreviation) {
      const team = (WorldEngine.state?.teams || []).find(item =>
        String(item?.abbreviation || '').trim().toLowerCase() === abbreviation
      );
      if (team) return team;
    }

    const heroText = String(
      root.querySelector('.team-profile-style-hero')?.textContent || root.textContent || ''
    ).toLowerCase();
    return (WorldEngine.state?.teams || []).find(item => {
      const fullName = `${item?.schoolName || ''} ${item?.teamName || ''}`.trim().toLowerCase();
      return fullName && heroText.includes(fullName);
    }) || null;
  }

  function travelStats(player) {
    const stats = player?.travelStats || {};
    return {
      gamesPlayed: Number(stats.gp || stats.gamesPlayed || 0),
      goals: Number(stats.g || stats.goals || 0),
      assists: Number(stats.a || stats.assists || 0),
      points: Number(stats.pts || stats.points || 0),
      wins: Number(stats.wins || stats.w || 0),
      savePercentage: Number(stats.savePercentage || stats.svPct || 0),
    };
  }

  function scopedEntries(team, goalie, isTravel) {
    const roster = Array.isArray(team?.roster) ? team.roster : [];
    return roster
      .filter(player => goalie
        ? String(player?.position || '').toUpperCase() === 'G'
        : String(player?.position || '').toUpperCase() !== 'G')
      .map(player => ({
        player,
        stats: isTravel
          ? travelStats(player)
          : (WorldEngine.getPlayerStatsByScope?.(player, selectedScope) || null),
      }))
      .filter(entry => entry.stats && Number(entry.stats.gamesPlayed || 0) > 0);
  }

  function best(entries, key, secondaryKey = null) {
    return [...entries].sort((a, b) =>
      Number(b.stats?.[key] || 0) - Number(a.stats?.[key] || 0) ||
      (secondaryKey
        ? Number(b.stats?.[secondaryKey] || 0) - Number(a.stats?.[secondaryKey] || 0)
        : 0) ||
      playerName(a.player).localeCompare(playerName(b.player))
    )[0] || null;
  }

  function formatLeader(entry, key, formatter = value => String(value)) {
    if (!entry) return 'No stats yet';
    return `${playerName(entry.player)} · ${formatter(entry.stats?.[key] || 0)}`;
  }

  function updateLeaderValues() {
    if (!profileVisible()) return false;
    const team = resolveProfileTeam();
    if (!team) return false;
    const isTravel = Boolean(travelProfileTeam());

    if (!isTravel) WorldEngine.rebuildHighSchoolPostseasonStats?.();

    const skaters = scopedEntries(team, false, isTravel);
    const goalies = scopedEntries(team, true, isTravel);
    const goals = best(skaters, 'goals', 'points');
    const assists = best(skaters, 'assists', 'points');
    const points = [...skaters].sort((a, b) =>
      Number(b.stats?.points || 0) - Number(a.stats?.points || 0) ||
      Number(b.stats?.goals || 0) - Number(a.stats?.goals || 0) ||
      Number(b.stats?.assists || 0) - Number(a.stats?.assists || 0) ||
      playerName(a.player).localeCompare(playerName(b.player))
    )[0] || null;
    const wins = best(goalies, 'wins', 'savePercentage');
    const savePct = best(goalies, 'savePercentage', 'wins');

    const values = {
      'profile-team-leader-goals': formatLeader(goals, 'goals'),
      'profile-team-leader-assists': formatLeader(assists, 'assists'),
      'profile-team-leader-points': formatLeader(points, 'points'),
      'profile-team-leader-wins': formatLeader(wins, 'wins'),
      'profile-team-leader-save-percentage': formatLeader(
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

    const section = document.querySelector('#team-profile-modern-content .team-leaders');
    const label = section?.querySelector('.team-section-label');
    if (label) label.textContent = isTravel ? 'Travel Leaders' : 'Team Leaders';

    return true;
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

  function ensureControl() {
    if (!profileVisible()) return false;
    const section = document.querySelector('#team-profile-modern-content .team-leaders');
    const header = section?.querySelector('.team-leaders__header');
    if (!section || !header) return false;

    injectStyles();
    let control = document.getElementById(CONTROL_ID);

    // Travel Hockey has one summer-tournament stat scope. Never show HS
    // Regular Season / Playoffs controls on a Travel team profile.
    if (travelProfileTeam()) {
      control?.remove();
      selectedScope = 'regular-season';
      updateLeaderValues();
      return true;
    }

    if (!postseasonAvailable()) {
      control?.remove();
      selectedScope = 'regular-season';
      updateLeaderValues();
      return true;
    }

    if (!control) {
      control = document.createElement('div');
      control.id = CONTROL_ID;
      control.setAttribute('role', 'group');
      control.setAttribute('aria-label', 'Team profile leader season phase');
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

    const fullStatsButton = document.getElementById('profile-team-view-full-stats');
    if (fullStatsButton && fullStatsButton.dataset.piProfileScopeBound !== 'true') {
      fullStatsButton.dataset.piProfileScopeBound = 'true';
      fullStatsButton.addEventListener('click', () => {
        if (typeof Game !== 'undefined') Game.fullStatsScope = selectedScope;
      }, true);
    }

    return true;
  }

  function render() {
    ensureControl();
    updateLeaderValues();
  }

  function renderAfterCore() {
    requestAnimationFrame(() => requestAnimationFrame(render));
  }

  document.addEventListener('click', renderAfterCore);
  document.addEventListener('change', event => {
    if (event.target?.closest?.('#team-profile-screen')) renderAfterCore();
  });

  WorldEngine.renderScopedTeamProfileLeaders = render;
})();
