'use strict';

/* global WorldEngine, openHubTab, openPlayerProfile */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROOT_ID = 'pi-playoff-leaders-card';
  const STYLE_ID = 'pi-playoff-leaders-styles';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const playerId = player => String(player?.playerId || player?.id || '');
  const playerName = player =>
    `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'Unknown Player';

  const teamForPlayer = player =>
    (WorldEngine.state?.teams || []).find(team =>
      String(team?.teamId || '') === String(player?.teamId || '') ||
      (team?.roster || []).some(item =>
        String(item?.playerId || item?.id || '') === String(player?.playerId || player?.id || '')
      )
    ) || null;

  function teamLabel(player) {
    const team = teamForPlayer(player);
    return team?.abbreviation || team?.teamName || '—';
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{margin:28px 0 0;border:1px solid rgba(93,157,245,.22);border-radius:22px;overflow:hidden;background:linear-gradient(180deg,rgba(20,43,76,.78),rgba(9,24,43,.86));box-shadow:0 16px 34px rgba(0,0,0,.14)}
      .pi-pl-head{padding:18px 20px 15px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.pi-pl-eyebrow{margin:0 0 5px;color:#79adf5;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-pl-head h3{margin:0;color:#f5f8ff;font-size:22px;letter-spacing:-.025em}.pi-pl-games{padding:7px 10px;border:1px solid rgba(93,157,245,.25);border-radius:999px;color:#9bc2f8;background:rgba(55,122,216,.08);font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
      .pi-pl-body{padding:14px 16px 17px}.pi-pl-section+.pi-pl-section{margin-top:18px}.pi-pl-title{display:flex;justify-content:space-between;align-items:center;margin:0 4px 8px}.pi-pl-title span:first-child{color:#8498b5;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-pl-title span:last-child{color:#60738e;font-size:10px}
      .pi-pl-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 10px;border-radius:13px;cursor:pointer;transition:background .15s ease,filter .15s ease}.pi-pl-row:nth-child(even){background:rgba(255,255,255,.026)}.pi-pl-row:active{filter:brightness(1.18)}.pi-pl-row:focus-visible{outline:2px solid rgba(95,160,255,.7)}.pi-pl-rank{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:rgba(75,143,239,.12);color:#7eb2f8;font-size:11px;font-weight:900}.pi-pl-player{min-width:0}.pi-pl-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eef4ff;font-size:13px;font-weight:800}.pi-pl-team{display:block;margin-top:2px;color:#60738e;font-size:10px;font-weight:800;letter-spacing:.07em}.pi-pl-stat{text-align:right}.pi-pl-stat strong{display:block;color:#f6f9ff;font-size:16px}.pi-pl-stat span{display:block;margin-top:1px;color:#6f85a2;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.pi-pl-empty{padding:13px;color:#71839c;font-size:12px;line-height:1.5}
    `;
    document.head.appendChild(style);
  }

  function getData() {
    if (typeof WorldEngine.rebuildHighSchoolPostseasonStats !== 'function') return null;
    const rebuild = WorldEngine.rebuildHighSchoolPostseasonStats();
    if (!rebuild || rebuild.completedGames <= 0) return null;

    const players = WorldEngine.getAllWorldPlayers?.() || [];
    const skaters = [];
    const goalies = [];

    players.forEach(player => {
      const stats = WorldEngine.getPlayerStatsByScope?.(player, 'playoffs');
      if (!stats || Number(stats.gamesPlayed) <= 0) return;

      if (String(player?.position || '').toUpperCase() === 'G') {
        goalies.push({ player, stats });
      } else {
        skaters.push({ player, stats });
      }
    });

    skaters.sort((a, b) =>
      Number(b.stats.points) - Number(a.stats.points) ||
      Number(b.stats.goals) - Number(a.stats.goals) ||
      Number(b.stats.assists) - Number(a.stats.assists) ||
      String(playerName(a.player)).localeCompare(playerName(b.player))
    );

    goalies.sort((a, b) =>
      Number(b.stats.savePercentage) - Number(a.stats.savePercentage) ||
      Number(b.stats.wins) - Number(a.stats.wins) ||
      Number(a.stats.goalsAgainstAverage) - Number(b.stats.goalsAgainstAverage) ||
      String(playerName(a.player)).localeCompare(playerName(b.player))
    );

    return {
      completedGames: rebuild.completedGames,
      skaters: skaters.slice(0, 5),
      goalies: goalies.slice(0, 3),
    };
  }

  function leaderRow(entry, index, goalie = false) {
    const { player, stats } = entry;
    const value = goalie
      ? Number(stats.savePercentage || 0).toFixed(3).replace(/^0/, '')
      : Number(stats.points || 0);
    const label = goalie ? 'SV%' : 'PTS';
    const id = playerId(player);
    return `
      <div class="pi-pl-row" data-player-id="${esc(id)}" role="button" tabindex="0" aria-label="Open ${esc(playerName(player))} player profile">
        <span class="pi-pl-rank">${index + 1}</span>
        <span class="pi-pl-player">
          <span class="pi-pl-name">${esc(playerName(player))}</span>
          <span class="pi-pl-team">${esc(teamLabel(player))}${goalie ? ` · ${Number(stats.wins || 0)} W` : ` · ${Number(stats.goals || 0)} G · ${Number(stats.assists || 0)} A`}</span>
        </span>
        <span class="pi-pl-stat"><strong>${esc(value)}</strong><span>${label}</span></span>
      </div>`;
  }

  function openLeaderPlayer(id) {
    const player = WorldEngine.getPlayerById?.(id) ||
      (WorldEngine.getAllWorldPlayers?.() || []).find(item => playerId(item) === String(id || '')) || null;
    if (!player) return;
    if (typeof globalThis.openPlayerProfile === 'function') {
      globalThis.openPlayerProfile(player, 'hub');
    }
  }

  function bindNavigation(root) {
    if (!root || root.dataset.piPlayerNavigationBound === 'true') return;
    root.dataset.piPlayerNavigationBound = 'true';
    const activate = target => {
      const row = target?.closest?.('.pi-pl-row[data-player-id]');
      if (!row) return;
      openLeaderPlayer(row.dataset.playerId);
    };
    root.addEventListener('click', event => activate(event.target));
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target?.closest?.('.pi-pl-row[data-player-id]');
      if (!row) return;
      event.preventDefault();
      activate(row);
    });
  }

  function render() {
    const bracket = document.getElementById('pi-league-postseason-card');
    if (!bracket || !bracket.isConnected) {
      document.getElementById(ROOT_ID)?.remove();
      return;
    }

    const data = getData();
    if (!data) {
      document.getElementById(ROOT_ID)?.remove();
      return;
    }

    injectStyles();
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      bracket.insertAdjacentElement('afterend', root);
    }

    root.innerHTML = `
      <div class="pi-pl-head">
        <div><p class="pi-pl-eyebrow">Postseason Statistics</p><h3>Playoff Leaders</h3></div>
        <span class="pi-pl-games">${data.completedGames} games final</span>
      </div>
      <div class="pi-pl-body">
        <div class="pi-pl-section">
          <div class="pi-pl-title"><span>Skaters</span><span>Playoff scoring</span></div>
          ${data.skaters.length ? data.skaters.map((entry, index) => leaderRow(entry, index)).join('') : '<div class="pi-pl-empty">No skater playoff statistics yet.</div>'}
        </div>
        <div class="pi-pl-section">
          <div class="pi-pl-title"><span>Goaltenders</span><span>Playoff performance</span></div>
          ${data.goalies.length ? data.goalies.map((entry, index) => leaderRow(entry, index, true)).join('') : '<div class="pi-pl-empty">No goalie playoff statistics yet.</div>'}
        </div>
      </div>`;

    bindNavigation(root);
  }

  const originalOpenHubTab = typeof openHubTab === 'function' ? openHubTab : null;
  if (originalOpenHubTab) {
    window.openHubTab = function(tabName, ...args) {
      const result = originalOpenHubTab(tabName, ...args);
      if (String(tabName || '').toLowerCase() === 'league') {
        requestAnimationFrame(render);
      }
      return result;
    };
  }

  const originalReconcile = WorldEngine.reconcileHighSchoolPostseason?.bind(WorldEngine);
  if (originalReconcile) {
    WorldEngine.reconcileHighSchoolPostseason = function(...args) {
      const result = originalReconcile(...args);
      WorldEngine.rebuildHighSchoolPostseasonStats?.();
      if (document.getElementById('pi-league-postseason-card')) requestAnimationFrame(render);
      return result;
    };
  }

  WorldEngine.renderLeaguePlayoffLeaders = render;
})();
