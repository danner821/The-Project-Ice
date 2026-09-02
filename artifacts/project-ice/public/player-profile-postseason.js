'use strict';

/* global WorldEngine, openPlayerProfile */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CONTROL_ID = 'pi-npc-player-profile-scope';
  const STYLE_ID = 'pi-npc-player-profile-scope-styles';
  const VALID_SCOPES = new Set(['regular-season', 'playoffs', 'travel', 'international']);
  let activePlayer = null;
  let selectedScope = 'regular-season';

  const normalize = value => String(value || '').trim().toLowerCase();
  const idOf = player => String(player?.playerId || player?.id || '');

  function canonicalPlayer(player) {
    if (!player) return null;
    const id = idOf(player);
    if (id) {
      const direct = WorldEngine.getPlayerById?.(id);
      if (direct) return direct;
    }

    const players = WorldEngine.getAllWorldPlayers?.() || [];
    const teamId = String(player?.teamId || '');
    return players.find(candidate =>
      normalize(candidate?.firstName) === normalize(player?.firstName) &&
      normalize(candidate?.lastName) === normalize(player?.lastName) &&
      (!teamId || String(candidate?.teamId || '') === teamId)
    ) || player;
  }

  function headers() {
    const cells = Array.from(
      document.getElementById('player-profile-statistics-head')?.querySelectorAll('th') || []
    );
    const map = new Map();
    cells.forEach((cell, index) => {
      const key = String(cell.textContent || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9+/%-]/g, '');
      if (key) map.set(key, index);
    });
    return map;
  }

  function valuesFor(player, stats) {
    if (!stats) return null;
    if (String(player?.position || '').toUpperCase() === 'G') {
      return {
        GP: Number(stats.gamesPlayed ?? stats.gp ?? 0),
        GS: Number(stats.gamesStarted ?? stats.gs ?? stats.gp ?? 0),
        W: Number(stats.wins ?? 0),
        L: Number(stats.losses ?? 0),
        OTL: Number(stats.overtimeLosses ?? stats.otl ?? 0),
        GA: Number(stats.goalsAgainst ?? stats.ga ?? 0),
        GAA: Number(stats.goalsAgainstAverage ?? stats.gaa ?? 0).toFixed(2),
        'SV%': Number(stats.savePercentage ?? stats.svPct ?? 0).toFixed(3).replace(/^0/, ''),
        SO: Number(stats.shutouts ?? stats.so ?? 0),
      };
    }

    return {
      GP: Number(stats.gamesPlayed ?? stats.gp ?? 0),
      G: Number(stats.goals ?? stats.g ?? 0),
      A: Number(stats.assists ?? stats.a ?? 0),
      PTS: Number(stats.points ?? stats.pts ?? 0),
      '+/-': Number(stats.plusMinus ?? 0),
      PIM: Number(stats.penaltyMinutes ?? stats.pim ?? 0),
      SOG: Number(stats.shots ?? stats.sog ?? 0),
      SHOTS: Number(stats.shots ?? stats.sog ?? 0),
    };
  }

  function zeroStats(player) {
    return String(player?.position || '').toUpperCase() === 'G'
      ? { gamesPlayed:0, gamesStarted:0, wins:0, losses:0, overtimeLosses:0, goalsAgainst:0, goalsAgainstAverage:0, savePercentage:0, shutouts:0 }
      : { gamesPlayed:0, goals:0, assists:0, points:0, plusMinus:0, penaltyMinutes:0, shots:0 };
  }

  function scopedStats(player) {
    if (selectedScope === 'travel') {
      const travel = WorldEngine.getPlayerTravelStats?.(player);
      const total = travel?.total || null;
      if (!total) return zeroStats(player);
      if (String(player?.position || travel?.latest?.position || '').toUpperCase() === 'G') {
        return {
          gamesPlayed:Number(total.gp || 0),
          gamesStarted:Number(total.gp || 0),
          wins:Number(total.wins || 0),
          losses:Number(total.losses || 0),
          overtimeLosses:0,
          goalsAgainst:Number(total.goalsAgainst || 0),
          goalsAgainstAverage:Number(total.gp || 0) > 0 ? Number(total.goalsAgainst || 0) / Number(total.gp || 1) : 0,
          savePercentage:Number(total.savePercentage || 0),
          shutouts:0,
        };
      }
      return {
        gamesPlayed:Number(total.gp || 0),
        goals:Number(total.g || 0),
        assists:Number(total.a || 0),
        points:Number(total.pts || 0),
        plusMinus:0,
        penaltyMinutes:Number(total.pim || 0),
        shots:Number(total.sog || 0),
      };
    }

    if (selectedScope === 'international') {
      return player?.internationalStats || player?.statsByScope?.international || zeroStats(player);
    }

    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    return WorldEngine.getPlayerStatsByScope?.(player, selectedScope) || zeroStats(player);
  }

  function setCell(row, index, value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function applyScope() {
    const player = canonicalPlayer(activePlayer);
    if (!player) return false;

    const stats = scopedStats(player);
    const values = valuesFor(player, stats);
    if (!values) return false;

    const map = headers();
    const body = document.getElementById('player-profile-statistics-body');
    const rows = Array.from(body?.querySelectorAll('tr') || []);
    if (!rows.length) return false;

    const currentRow = rows[rows.length - 1];
    Object.entries(values).forEach(([key, value]) => setCell(currentRow, map.get(key), value));
    currentRow.dataset.piStatScope = selectedScope;

    if (selectedScope === 'travel') {
      const travel = WorldEngine.getPlayerTravelStats?.(player);
      const latest = travel?.latest || null;
      setCell(currentRow, map.get('TEAM'), latest?.teamAbbr || latest?.teamName || 'Travel');
      setCell(currentRow, map.get('LVL'), latest?.level || 'TRV');
    }

    const footer = document.getElementById('player-profile-statistics-foot')?.querySelector('tr');
    if (footer && rows.length === 1) {
      Object.entries(values).forEach(([key, value]) => setCell(footer, map.get(key), value));
      footer.dataset.piStatScope = selectedScope;
      if (selectedScope === 'travel') {
        setCell(footer, map.get('TEAM'), '—');
        setCell(footer, map.get('LVL'), '—');
      }
    }

    return true;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTROL_ID}{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:10px 0 12px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 6px;background:transparent;color:#6d819e;font:inherit;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
      #${CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}
    `;
    document.head.appendChild(style);
  }

  function syncButtons() {
    document.querySelectorAll(`#${CONTROL_ID} button[data-scope]`).forEach(button => {
      const active = button.dataset.scope === selectedScope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function ensureControl() {
    const table = document.getElementById('player-profile-statistics-head')?.closest('table');
    if (!table) return false;

    injectStyles();
    let control = document.getElementById(CONTROL_ID);
    if (!control) {
      control = document.createElement('div');
      control.id = CONTROL_ID;
      control.setAttribute('role', 'group');
      control.setAttribute('aria-label', 'Player statistics competition');
      table.insertAdjacentElement('beforebegin', control);
    }

    control.innerHTML = `
      <button type="button" data-scope="regular-season">Regular Season</button>
      <button type="button" data-scope="playoffs">Playoffs</button>
      <button type="button" data-scope="travel">Travel</button>
      <button type="button" data-scope="international">International</button>
    `;

    syncButtons();
    return true;
  }

  function applyAfterCore(player) {
    activePlayer = player || activePlayer;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ensureControl();
        applyScope();
      });
    });
  }

  const originalOpenPlayerProfile = typeof globalThis.openPlayerProfile === 'function'
    ? globalThis.openPlayerProfile
    : null;

  if (originalOpenPlayerProfile) {
    globalThis.openPlayerProfile = function(player, origin, ...args) {
      selectedScope = 'regular-season';
      activePlayer = player;
      const result = originalOpenPlayerProfile.call(this, player, origin, ...args);
      applyAfterCore(player);
      return result;
    };
  }

  document.addEventListener('click', event => {
    const scopeButton = event.target?.closest?.(`#${CONTROL_ID} button[data-scope]`);
    if (scopeButton) {
      const scope = scopeButton.dataset.scope;
      if (!VALID_SCOPES.has(scope)) return;
      selectedScope = scope;
      syncButtons();
      applyScope();
      return;
    }

    if (event.target?.closest?.('#player-profile-screen') && activePlayer) {
      requestAnimationFrame(() => {
        ensureControl();
        applyScope();
      });
    }
  });

  WorldEngine.applyNpcPlayerProfileStatScope = applyScope;
})();
