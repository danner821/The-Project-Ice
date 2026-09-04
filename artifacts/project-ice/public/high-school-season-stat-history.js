'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolSeasonStatHistoryInstalled === true) return;
  WorldEngine.__highSchoolSeasonStatHistoryInstalled = true;

  const VERSION = 1;
  const CLASS_ABBR = { 9: 'FR', 10: 'SO', 11: 'JR', 12: 'SR' };

  const clone = value => value == null ? value : structuredClone(value);
  const idOf = player => String(player?.playerId || player?.id || '');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function seasonStartYear(state = WorldEngine.state) {
    return Number(
      state?.season?.seasonStartYear ||
      state?.season?.currentYear ||
      String(state?.season?.seasonId || '').match(/hs-(\d{4})-/)?.[1] ||
      String(state?.season?.currentDate || state?.currentDate || '').slice(0, 4)
    ) || null;
  }

  function seasonId(state = WorldEngine.state) {
    return String(state?.season?.seasonId || state?.season?.id || state?.currentSeason || '');
  }

  function seasonLabel(state = WorldEngine.state) {
    const start = seasonStartYear(state);
    if (start) return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
    return String(state?.season?.label || state?.season?.seasonLabel || state?.currentSeason || '');
  }

  function gradeOf(player) {
    const explicit = Number(player?.grade);
    if (explicit >= 9 && explicit <= 12) return explicit;
    const label = String(player?.schoolYear || player?.classLevel || player?.year || '').toLowerCase();
    if (label.includes('freshman')) return 9;
    if (label.includes('sophomore')) return 10;
    if (label.includes('junior')) return 11;
    if (label.includes('senior')) return 12;
    return null;
  }

  function teamOf(player) {
    return (WorldEngine.state?.teams || []).find(team => String(team?.teamId || '') === String(player?.teamId || '')) || null;
  }

  function teamAbbr(player) {
    const team = teamOf(player);
    return String(team?.abbreviation || `${team?.schoolName || ''} ${team?.teamName || ''}`
      .trim().split(/\s+/).filter(Boolean).map(word => word[0]).join('').toUpperCase() || '—');
  }

  function allPlayers() {
    return WorldEngine.getAllWorldPlayers?.() || (WorldEngine.state?.teams || []).flatMap(team => team?.roster || []);
  }

  function scoped(player, scope) {
    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    return clone(WorldEngine.getPlayerStatsByScope?.(player, scope) || {});
  }

  function historyRoot(player) {
    player.highSchoolSeasonHistory = Array.isArray(player.highSchoolSeasonHistory)
      ? player.highSchoolSeasonHistory
      : [];
    return player.highSchoolSeasonHistory;
  }

  function captureCompletedSeason() {
    const state = WorldEngine.state;
    if (!state) return false;
    const sid = seasonId(state);
    if (!sid) return false;
    const label = seasonLabel(state);

    for (const player of allPlayers()) {
      if (!player || !idOf(player)) continue;
      const history = historyRoot(player);
      if (history.some(row => String(row?.seasonId || '') === sid)) continue;
      const grade = gradeOf(player);
      history.push({
        version: VERSION,
        seasonId: sid,
        seasonLabel: label,
        seasonStartYear: seasonStartYear(state),
        teamId: player.teamId || null,
        teamAbbreviation: teamAbbr(player),
        grade,
        level: CLASS_ABBR[grade] || 'HS',
        age: num(player.age) || null,
        regularSeasonStats: scoped(player, 'regular-season'),
        playoffStats: scoped(player, 'playoffs'),
        overall: num(player.overall),
        capturedAt: new Date().toISOString(),
      });
    }
    WorldEngine.save?.();
    return true;
  }

  function activeRow(player, scope) {
    const grade = gradeOf(player);
    return {
      seasonId: seasonId(),
      seasonLabel: seasonLabel(),
      teamId: player?.teamId || null,
      teamAbbreviation: teamAbbr(player),
      grade,
      level: CLASS_ABBR[grade] || 'HS',
      stats: scoped(player, scope),
      current: true,
    };
  }

  function rowsFor(player, scope) {
    const key = scope === 'playoffs' ? 'playoffStats' : 'regularSeasonStats';
    const historical = historyRoot(player).map(row => ({
      ...row,
      stats: clone(row?.[key] || {}),
      current: false,
    }));
    return [...historical, activeRow(player, scope)];
  }

  function headerMap(headId) {
    const cells = Array.from(document.getElementById(headId)?.querySelectorAll('th') || []);
    const map = new Map();
    cells.forEach((cell, index) => {
      const key = String(cell.textContent || '').trim().toUpperCase().replace(/[^A-Z0-9+/%-]/g, '');
      if (key) map.set(key, index);
    });
    return map;
  }

  function setCell(row, index, value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function applyStatsToRow(row, headers, record) {
    const s = record.stats || {};
    const values = {
      SEASON: record.seasonLabel || '—',
      TEAM: record.teamAbbreviation || '—',
      LVL: record.level || 'HS',
      GP: num(s.gamesPlayed),
      G: num(s.goals),
      A: num(s.assists),
      PTS: num(s.points),
      '+/-': num(s.plusMinus),
      PIM: num(s.penaltyMinutes),
      SOG: num(s.shots),
      SHOTS: num(s.shots),
      GS: num(s.gamesStarted),
      W: num(s.wins),
      L: num(s.losses),
      OTL: num(s.overtimeLosses),
      GA: num(s.goalsAgainst),
      GAA: num(s.goalsAgainstAverage).toFixed(2),
      'SV%': num(s.savePercentage).toFixed(3).replace(/^0/, ''),
      SO: num(s.shutouts),
    };
    Object.entries(values).forEach(([key, value]) => setCell(row, headers.get(key), value));
    row.dataset.piSeasonHistory = record.seasonId || '';
    row.classList.toggle('pp-stat-row--current', record.current === true);
  }

  function totals(records) {
    const out = {};
    for (const record of records) {
      const s = record.stats || {};
      for (const [key, value] of Object.entries(s)) {
        if (typeof value === 'number' && !['savePercentage','goalsAgainstAverage'].includes(key)) {
          out[key] = num(out[key]) + num(value);
        }
      }
    }
    if ('goals' in out || 'assists' in out) out.points = num(out.goals) + num(out.assists);
    if (num(out.shotsAgainst) > 0) out.savePercentage = num(out.saves) / num(out.shotsAgainst);
    if (num(out.minutesPlayed) > 0) out.goalsAgainstAverage = num(out.goalsAgainst) * 60 / num(out.minutesPlayed);
    return out;
  }

  function projectTable({ player, scope, headId, bodyId, footId }) {
    const body = document.getElementById(bodyId);
    const headers = headerMap(headId);
    if (!body || !headers.size || !player) return false;

    const existingRows = Array.from(body.querySelectorAll('tr'));
    const template = existingRows[existingRows.length - 1];
    if (!template) return false;

    const records = rowsFor(player, scope);
    body.innerHTML = '';
    for (const record of records) {
      const row = template.cloneNode(true);
      applyStatsToRow(row, headers, record);
      body.appendChild(row);
    }

    const footer = document.getElementById(footId)?.querySelector('tr');
    if (footer) {
      applyStatsToRow(footer, headers, {
        seasonId: 'career',
        seasonLabel: 'Career',
        teamAbbreviation: '—',
        level: '—',
        stats: totals(records),
        current: false,
      });
      setCell(footer, headers.get('SEASON'), 'Career');
      setCell(footer, headers.get('TEAM'), '—');
      setCell(footer, headers.get('LVL'), '—');
    }
    return true;
  }

  function careerPlayer() {
    const players = allPlayers();
    return players.find(player => player?.isCareerPlayer === true) || WorldEngine.state?.player || Game?.player || null;
  }

  function activeCareerScope() {
    return document.getElementById('pp-statistics-filter')?.value === 'playoffs' ? 'playoffs' : 'regular-season';
  }

  function projectCareerTable() {
    projectTable({
      player: careerPlayer(),
      scope: activeCareerScope(),
      headId: 'pp-statistics-head',
      bodyId: 'pp-statistics-body',
      footId: 'pp-statistics-foot',
    });
  }

  let lastProfilePlayer = null;
  const baseProfileRender = globalThis.renderProjectIcePlayerStatistics;
  if (typeof baseProfileRender === 'function') {
    globalThis.renderProjectIcePlayerStatistics = function(player = {}, options = {}) {
      const result = baseProfileRender(player, options);
      if (String(options?.headId || '') === 'player-profile-statistics-head') {
        lastProfilePlayer = player;
        requestAnimationFrame(() => projectTable({
          player,
          scope: document.querySelector('#pi-player-profile-stat-scope .is-active')?.dataset?.scope === 'playoffs' ? 'playoffs' : 'regular-season',
          headId: 'player-profile-statistics-head',
          bodyId: 'player-profile-statistics-body',
          footId: 'player-profile-statistics-foot',
        }));
      }
      return result;
    };
  }

  document.addEventListener('change', event => {
    if (event.target?.id === 'pp-statistics-filter') requestAnimationFrame(projectCareerTable);
  });

  document.addEventListener('click', event => {
    const tab = event.target?.closest?.('[data-tab], [data-hub-tab], [data-tab-target], .hub-tab');
    const label = String(tab?.dataset?.tab || tab?.dataset?.hubTab || tab?.dataset?.tabTarget || tab?.textContent || '').toLowerCase();
    if (label.includes('player')) requestAnimationFrame(() => requestAnimationFrame(projectCareerTable));

    const scopeButton = event.target?.closest?.('#pi-player-profile-stat-scope button[data-scope]');
    if (scopeButton && lastProfilePlayer) {
      requestAnimationFrame(() => projectTable({
        player: lastProfilePlayer,
        scope: scopeButton.dataset.scope === 'playoffs' ? 'playoffs' : 'regular-season',
        headId: 'player-profile-statistics-head',
        bodyId: 'player-profile-statistics-body',
        footId: 'player-profile-statistics-foot',
      }));
    }
  });

  window.addEventListener('projectice:player-season-recap-complete', captureCompletedSeason);

  /* The rollover service owns graduation. Calling it a second time at the same
     deterministic boundary lets v2 reconcile stale draft-class metadata after
     the new season identity is already canonical, without any timer/retry. */
  window.addEventListener('projectice:next-high-school-season-started', event => {
    WorldEngine.applyHighSchoolRosterRollover?.(event?.detail || {});
  });

  WorldEngine.captureHighSchoolSeasonStatHistory = captureCompletedSeason;
  WorldEngine.getHighSchoolSeasonStatRows = rowsFor;
})();
