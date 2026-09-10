'use strict';

/* global WorldEngine, openPlayerProfile */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const PRIMARY_CONTROL_ID = 'pi-player-profile-stat-scope';
  const LEGACY_CONTROL_ID = 'pi-npc-player-profile-scope';
  const STYLE_ID = 'pi-npc-player-profile-scope-styles';
  const VALID_SCOPES = new Set(['regular-season', 'playoffs', 'travel', 'international']);
  let activePlayer = null;
  let selectedScope = 'regular-season';

  const normalize = value => String(value || '').trim().toLowerCase();
  const idOf = player => String(player?.playerId || player?.id || '');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

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

  function setCell(row, index, value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function valuesFor(player, stats = {}) {
    if (String(player?.position || '').toUpperCase() === 'G') {
      return {
        GP: num(stats.gamesPlayed ?? stats.gp),
        GS: num(stats.gamesStarted ?? stats.gs ?? stats.gp),
        W: num(stats.wins),
        L: num(stats.losses),
        OTL: num(stats.overtimeLosses ?? stats.otl),
        GA: num(stats.goalsAgainst ?? stats.ga),
        GAA: num(stats.goalsAgainstAverage ?? stats.gaa).toFixed(2),
        'SV%': num(stats.savePercentage ?? stats.svPct).toFixed(3).replace(/^0/, ''),
        SO: num(stats.shutouts ?? stats.so),
      };
    }

    return {
      GP: num(stats.gamesPlayed ?? stats.gp),
      G: num(stats.goals ?? stats.g),
      A: num(stats.assists ?? stats.a),
      PTS: num(stats.points ?? stats.pts ?? (num(stats.goals ?? stats.g) + num(stats.assists ?? stats.a))),
      '+/-': num(stats.plusMinus),
      PIM: num(stats.penaltyMinutes ?? stats.pim),
      SOG: num(stats.shots ?? stats.sog),
      SHOTS: num(stats.shots ?? stats.sog),
    };
  }

  function seasonLabelFromDate(value) {
    const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
    const start = month >= 9 ? year : year - 1;
    return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
  }

  function baseSeasonRows(player) {
    const regular = WorldEngine.getHighSchoolSeasonStatRows?.(player, 'regular-season');
    if (Array.isArray(regular) && regular.length) return regular;

    const body = document.getElementById('player-profile-statistics-body');
    const map = headers();
    return Array.from(body?.querySelectorAll('tr') || []).map(row => ({
      seasonLabel: String(row.children?.[map.get('SEASON')]?.textContent || '—').trim(),
      teamAbbreviation: String(row.children?.[map.get('TEAM')]?.textContent || '—').trim(),
      level: String(row.children?.[map.get('LVL')]?.textContent || 'HS').trim(),
      stats: {},
      current: false,
    }));
  }

  function rowsForHighSchool(player, scope) {
    const rows = WorldEngine.getHighSchoolSeasonStatRows?.(player, scope);
    if (Array.isArray(rows) && rows.length) return rows;

    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    const stats = WorldEngine.getPlayerStatsByScope?.(player, scope) || {};
    const scaffold = baseSeasonRows(player);
    if (!scaffold.length) return [];
    return scaffold.map((row, index) => ({
      ...row,
      stats: index === scaffold.length - 1 ? stats : {},
      current: index === scaffold.length - 1,
    }));
  }

  function rowsForTravel(player) {
    const scaffold = baseSeasonRows(player);
    const travel = WorldEngine.getPlayerTravelStats?.(player) || null;
    const entries = Array.isArray(travel?.entries) ? travel.entries : [];
    const bySeason = new Map();

    for (const entry of entries) {
      const label = seasonLabelFromDate(entry?.date);
      if (!label) continue;
      const existing = bySeason.get(label) || {
        stats: { gp:0, g:0, a:0, pts:0, pim:0, sog:0, wins:0, losses:0, shotsAgainst:0, saves:0, goalsAgainst:0 },
        meta: entry,
      };
      const s = entry?.stats || {};
      for (const key of ['gp','g','a','pts','pim','sog','wins','losses','shotsAgainst','saves','goalsAgainst']) {
        existing.stats[key] += num(s[key]);
      }
      existing.meta = entry;
      bySeason.set(label, existing);
    }

    return scaffold.map(row => {
      const found = bySeason.get(row.seasonLabel) || null;
      const s = found?.stats || {};
      let stats;
      if (String(player?.position || found?.meta?.position || '').toUpperCase() === 'G') {
        const gp = num(s.gp);
        const shotsAgainst = num(s.shotsAgainst);
        stats = {
          gamesPlayed: gp,
          gamesStarted: gp,
          wins: num(s.wins),
          losses: num(s.losses),
          overtimeLosses: 0,
          goalsAgainst: num(s.goalsAgainst),
          goalsAgainstAverage: gp > 0 ? num(s.goalsAgainst) / gp : 0,
          savePercentage: shotsAgainst > 0 ? num(s.saves) / shotsAgainst : 0,
          shutouts: 0,
        };
      } else {
        stats = {
          gamesPlayed: num(s.gp),
          goals: num(s.g),
          assists: num(s.a),
          points: num(s.pts ?? (num(s.g) + num(s.a))),
          plusMinus: 0,
          penaltyMinutes: num(s.pim),
          shots: num(s.sog),
        };
      }
      return {
        ...row,
        teamAbbreviation: found?.meta?.teamAbbr || found?.meta?.teamName || 'Travel',
        level: found?.meta?.level || 'TRV',
        stats,
      };
    });
  }

  function rowsForInternational(player) {
    const scaffold = baseSeasonRows(player);
    const current = player?.internationalStats || player?.statsByScope?.international || {};
    return scaffold.map((row, index) => ({
      ...row,
      teamAbbreviation: '—',
      level: 'INT',
      stats: index === scaffold.length - 1 ? current : {},
    }));
  }

  function selectedRows(player) {
    if (selectedScope === 'regular-season' || selectedScope === 'playoffs') {
      return rowsForHighSchool(player, selectedScope);
    }
    if (selectedScope === 'travel') return rowsForTravel(player);
    return rowsForInternational(player);
  }

  function totals(player, records) {
    const goalie = String(player?.position || '').toUpperCase() === 'G';
    if (goalie) {
      const out = { gamesPlayed:0, gamesStarted:0, wins:0, losses:0, overtimeLosses:0, goalsAgainst:0, shotsAgainst:0, saves:0, shutouts:0 };
      for (const record of records) {
        const s = record?.stats || {};
        out.gamesPlayed += num(s.gamesPlayed ?? s.gp);
        out.gamesStarted += num(s.gamesStarted ?? s.gs ?? s.gp);
        out.wins += num(s.wins);
        out.losses += num(s.losses);
        out.overtimeLosses += num(s.overtimeLosses ?? s.otl);
        out.goalsAgainst += num(s.goalsAgainst ?? s.ga);
        out.shotsAgainst += num(s.shotsAgainst);
        out.saves += num(s.saves);
        out.shutouts += num(s.shutouts ?? s.so);
      }
      out.goalsAgainstAverage = out.gamesPlayed > 0 ? out.goalsAgainst / out.gamesPlayed : 0;
      out.savePercentage = out.shotsAgainst > 0 ? out.saves / out.shotsAgainst : 0;
      return out;
    }

    const out = { gamesPlayed:0, goals:0, assists:0, points:0, plusMinus:0, penaltyMinutes:0, shots:0 };
    for (const record of records) {
      const s = record?.stats || {};
      out.gamesPlayed += num(s.gamesPlayed ?? s.gp);
      out.goals += num(s.goals ?? s.g);
      out.assists += num(s.assists ?? s.a);
      out.plusMinus += num(s.plusMinus);
      out.penaltyMinutes += num(s.penaltyMinutes ?? s.pim);
      out.shots += num(s.shots ?? s.sog);
    }
    out.points = out.goals + out.assists;
    return out;
  }

  function writeRecord(row, map, player, record) {
    setCell(row, map.get('SEASON'), record?.seasonLabel || '—');
    setCell(row, map.get('TEAM'), record?.teamAbbreviation || '—');
    setCell(row, map.get('LVL'), record?.level || '—');
    const values = valuesFor(player, record?.stats || {});
    Object.entries(values).forEach(([key, value]) => setCell(row, map.get(key), value));
    row.dataset.piStatScope = selectedScope;
  }

  function applyScope() {
    const player = canonicalPlayer(activePlayer);
    if (!player) return false;

    const body = document.getElementById('player-profile-statistics-body');
    const map = headers();
    if (!body || !map.size) return false;

    const oldRows = Array.from(body.querySelectorAll('tr'));
    const template = oldRows[oldRows.length - 1];
    if (!template) return false;

    const records = selectedRows(player);
    if (!records.length) return false;

    body.innerHTML = '';
    for (const record of records) {
      const row = template.cloneNode(true);
      writeRecord(row, map, player, record);
      body.appendChild(row);
    }

    const footer = document.getElementById('player-profile-statistics-foot')?.querySelector('tr');
    if (footer) {
      writeRecord(footer, map, player, {
        seasonLabel: 'Career',
        teamAbbreviation: '—',
        level: '—',
        stats: totals(player, records),
      });
      setCell(footer, map.get('SEASON'), 'Career');
      setCell(footer, map.get('TEAM'), '—');
      setCell(footer, map.get('LVL'), '—');
    }

    return true;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PRIMARY_CONTROL_ID}{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:10px 0 12px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${PRIMARY_CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 6px;background:transparent;color:#6d819e;font:inherit;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
      #${PRIMARY_CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}
    `;
    document.head.appendChild(style);
  }

  function syncButtons() {
    document.querySelectorAll(`#${PRIMARY_CONTROL_ID} button[data-scope]`).forEach(button => {
      const active = button.dataset.scope === selectedScope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function ensureControl() {
    const table = document.getElementById('player-profile-statistics-head')?.closest('table');
    if (!table) return false;

    injectStyles();

    const legacy = document.getElementById(LEGACY_CONTROL_ID);
    if (legacy) legacy.remove();

    let control = document.getElementById(PRIMARY_CONTROL_ID);
    if (!control) {
      control = document.createElement('div');
      control.id = PRIMARY_CONTROL_ID;
      control.setAttribute('role', 'group');
      control.setAttribute('aria-label', 'Player statistics competition');
      table.insertAdjacentElement('beforebegin', control);
    }

    control.style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))';
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
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      ensureControl();
      applyScope();
      syncButtons();
    })));
  }

  const originalOpenPlayerProfile = typeof globalThis.openPlayerProfile === 'function'
    ? globalThis.openPlayerProfile
    : null;

  if (originalOpenPlayerProfile) {
    globalThis.openPlayerProfile = function(player, origin, ...args) {
      selectedScope = 'regular-season';
      activePlayer = canonicalPlayer(player);
      const result = originalOpenPlayerProfile.call(this, player, origin, ...args);
      applyAfterCore(activePlayer);
      return result;
    };
  }

  /*
   * One owner for the standalone Player Profile scope buttons.
   * This capture listener intentionally intercepts the legacy scope handlers in
   * player-stat-scopes.js and travel-stat-history.js so they cannot redraw a
   * different scope after this controller has rendered the full season table.
   */
  document.addEventListener('click', event => {
    const scopeButton = event.target?.closest?.(
      `#${PRIMARY_CONTROL_ID} button[data-scope], #${LEGACY_CONTROL_ID} button[data-scope]`
    );
    if (!scopeButton) return;

    const scope = scopeButton.dataset.scope;
    if (!VALID_SCOPES.has(scope)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    selectedScope = scope;
    syncButtons();
    applyAfterCore(activePlayer);
  }, true);

  WorldEngine.applyNpcPlayerProfileStatScope = applyScope;
  WorldEngine.applyStandalonePlayerProfileStatScope = applyScope;
})();
