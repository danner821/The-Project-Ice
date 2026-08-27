'use strict';

/* global WorldEngine, openPlayerProfile */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CONTROL_ID = 'pi-npc-player-profile-scope';
  const STYLE_ID = 'pi-npc-player-profile-scope-styles';
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
        GP: Number(stats.gamesPlayed || 0),
        GS: Number(stats.gamesStarted || 0),
        W: Number(stats.wins || 0),
        L: Number(stats.losses || 0),
        OTL: Number(stats.overtimeLosses || 0),
        GA: Number(stats.goalsAgainst || 0),
        GAA: Number(stats.goalsAgainstAverage || 0).toFixed(2),
        'SV%': Number(stats.savePercentage || 0).toFixed(3).replace(/^0/, ''),
        SO: Number(stats.shutouts || 0),
      };
    }

    return {
      GP: Number(stats.gamesPlayed || 0),
      G: Number(stats.goals || 0),
      A: Number(stats.assists || 0),
      PTS: Number(stats.points || 0),
      '+/-': Number(stats.plusMinus || 0),
      PIM: Number(stats.penaltyMinutes || 0),
      SOG: Number(stats.shots || 0),
      SHOTS: Number(stats.shots || 0),
    };
  }

  function setCell(row, index, value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function applyScope() {
    const player = canonicalPlayer(activePlayer);
    if (!player) return false;

    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    const stats = WorldEngine.getPlayerStatsByScope?.(player, selectedScope);
    const values = valuesFor(player, stats);
    if (!values) return false;

    const map = headers();
    const body = document.getElementById('player-profile-statistics-body');
    const rows = Array.from(body?.querySelectorAll('tr') || []);
    if (!rows.length) return false;

    const currentRow = rows[rows.length - 1];
    Object.entries(values).forEach(([key, value]) => setCell(currentRow, map.get(key), value));
    currentRow.dataset.piStatScope = selectedScope;

    const footer = document.getElementById('player-profile-statistics-foot')?.querySelector('tr');
    if (footer && rows.length === 1) {
      Object.entries(values).forEach(([key, value]) => setCell(footer, map.get(key), value));
      footer.dataset.piStatScope = selectedScope;
    }

    return true;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:10px 0 12px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 9px;background:transparent;color:#6d819e;font:inherit;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
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
      control.setAttribute('aria-label', 'Player statistics season phase');
      control.innerHTML = `
        <button type="button" data-scope="regular-season">Regular Season</button>
        <button type="button" data-scope="playoffs">Playoffs</button>
      `;
      table.insertAdjacentElement('beforebegin', control);
      control.addEventListener('click', event => {
        const button = event.target?.closest?.('button[data-scope]');
        if (!button) return;
        selectedScope = button.dataset.scope === 'playoffs' ? 'playoffs' : 'regular-season';
        syncButtons();
        applyScope();
      });
    }

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
    if (event.target?.closest?.('#player-profile-screen') && activePlayer) {
      requestAnimationFrame(() => {
        ensureControl();
        applyScope();
      });
    }
  });

  WorldEngine.applyNpcPlayerProfileStatScope = applyScope;
})();
