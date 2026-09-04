'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolSeasonStatHistoryInstalled === true) return;
  WorldEngine.__highSchoolSeasonStatHistoryInstalled = true;

  const VERSION = 2;
  const CLASS_ABBR = { 9: 'FR', 10: 'SO', 11: 'JR', 12: 'SR' };
  const clone = value => value == null ? value : structuredClone(value);
  const idOf = player => String(player?.playerId || player?.id || '');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function seasonStartYear() {
    return Number(
      WorldEngine.getCanonicalHighSchoolSeasonStartYear?.() ||
      WorldEngine.state?.season?.seasonStartYear ||
      String(WorldEngine.state?.season?.currentDate || WorldEngine.state?.currentDate || '').slice(0, 4)
    ) || null;
  }

  function seasonIdentity(startYear = seasonStartYear()) {
    const index = Number(startYear) - 2023;
    const canonical = index >= 0 && index <= 3 ? WorldEngine.getHighSchoolSeasonIdentity?.(index) : null;
    return canonical || {
      seasonId: `hs-${startYear}-${Number(startYear) + 1}`,
      label: `${startYear}-${String(Number(startYear) + 1).slice(-2)}`,
      startYear: Number(startYear),
    };
  }

  function shortLabel(startYear) {
    return `${String(startYear).slice(-2)}-${String(Number(startYear) + 1).slice(-2)}`;
  }

  function gradeOf(player, startYear = seasonStartYear()) {
    const draftYear = Number(player?.draftYear);
    if (Number.isFinite(draftYear) && Number.isFinite(Number(startYear))) {
      const byDraft = 13 - (draftYear - Number(startYear));
      if (byDraft >= 9 && byDraft <= 12) return byDraft;
    }
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

  function resolvePlayer(value) {
    if (!value) return null;
    if (typeof value === 'object') {
      const id = idOf(value);
      return (id && WorldEngine.getPlayerById?.(id)) || value;
    }
    return WorldEngine.getPlayerById?.(value) || null;
  }

  function scoped(player, scope) {
    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    return clone(WorldEngine.getPlayerStatsByScope?.(player, scope) || {});
  }

  function rawHistory(player) {
    player.highSchoolSeasonHistory = Array.isArray(player.highSchoolSeasonHistory) ? player.highSchoolSeasonHistory : [];
    return player.highSchoolSeasonHistory;
  }

  function normalizeHistory(player) {
    const history = rawHistory(player);
    const currentStart = seasonStartYear();
    if (!Number.isFinite(currentStart) || !history.length) return history;
    const currentGrade = gradeOf(player, currentStart);
    let changed = false;

    history.forEach((row, index) => {
      const distance = history.length - index;
      const rowStart = currentStart - distance;
      const rowGrade = currentGrade ? currentGrade - distance : null;
      const identity = seasonIdentity(rowStart);
      const updates = {
        version: VERSION,
        seasonId: identity.seasonId,
        seasonLabel: shortLabel(rowStart),
        seasonStartYear: rowStart,
        grade: rowGrade >= 9 && rowGrade <= 12 ? rowGrade : row?.grade,
        level: rowGrade >= 9 && rowGrade <= 12 ? CLASS_ABBR[rowGrade] : (row?.level || 'HS'),
      };
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && row[key] !== value) { row[key] = value; changed = true; }
      });
    });

    if (changed) WorldEngine.save?.();
    return history;
  }

  function captureCompletedSeason() {
    const start = seasonStartYear();
    if (!Number.isFinite(start)) return false;
    const identity = seasonIdentity(start);
    for (const player of allPlayers()) {
      if (!player || !idOf(player)) continue;
      const history = normalizeHistory(player);
      if (history.some(row => Number(row?.seasonStartYear) === start)) continue;
      const grade = gradeOf(player, start);
      history.push({
        version: VERSION,
        seasonId: identity.seasonId,
        seasonLabel: shortLabel(start),
        seasonStartYear: start,
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
    const start = seasonStartYear();
    const grade = gradeOf(player, start);
    return {
      seasonId: seasonIdentity(start).seasonId,
      seasonLabel: shortLabel(start),
      teamId: player?.teamId || null,
      teamAbbreviation: teamAbbr(player),
      grade,
      level: CLASS_ABBR[grade] || 'HS',
      stats: scoped(player, scope),
      current: true,
    };
  }

  function rowsFor(playerValue, scope) {
    const player = resolvePlayer(playerValue);
    if (!player) return [];
    const key = scope === 'playoffs' ? 'playoffStats' : 'regularSeasonStats';
    const historical = normalizeHistory(player).map(row => ({ ...row, stats: clone(row?.[key] || {}), current: false }));
    return [...historical, activeRow(player, scope)];
  }

  function headerMap(headId) {
    const map = new Map();
    Array.from(document.getElementById(headId)?.querySelectorAll('th') || []).forEach((cell, index) => {
      const key = String(cell.textContent || '').trim().toUpperCase().replace(/[^A-Z0-9+/%-]/g, '');
      if (key) map.set(key, index);
    });
    return map;
  }

  function setCell(row, index, value) {
    if (row && index !== undefined && row.children?.[index]) row.children[index].textContent = String(value);
  }

  function applyStatsToRow(row, headers, record) {
    const s = record.stats || {};
    const values = {
      SEASON: record.seasonLabel || '—', TEAM: record.teamAbbreviation || '—', LVL: record.level || 'HS',
      GP: num(s.gamesPlayed), G: num(s.goals), A: num(s.assists), PTS: num(s.points), '+/-': num(s.plusMinus),
      PIM: num(s.penaltyMinutes), SOG: num(s.shots), SHOTS: num(s.shots), GS: num(s.gamesStarted),
      W: num(s.wins), L: num(s.losses), OTL: num(s.overtimeLosses), GA: num(s.goalsAgainst),
      GAA: num(s.goalsAgainstAverage).toFixed(2), 'SV%': num(s.savePercentage).toFixed(3).replace(/^0/, ''), SO: num(s.shutouts),
    };
    Object.entries(values).forEach(([key, value]) => setCell(row, headers.get(key), value));
    row.dataset.piSeasonHistory = record.seasonId || '';
    row.classList.toggle('pp-stat-row--current', record.current === true);
  }

  function totals(records) {
    const out = {};
    for (const record of records) {
      for (const [key, value] of Object.entries(record.stats || {})) {
        if (typeof value === 'number' && !['savePercentage','goalsAgainstAverage'].includes(key)) out[key] = num(out[key]) + num(value);
      }
    }
    if ('goals' in out || 'assists' in out) out.points = num(out.goals) + num(out.assists);
    if (num(out.shotsAgainst) > 0) out.savePercentage = num(out.saves) / num(out.shotsAgainst);
    if (num(out.minutesPlayed) > 0) out.goalsAgainstAverage = num(out.goalsAgainst) * 60 / num(out.minutesPlayed);
    return out;
  }

  function projectTable({ player, scope, headId, bodyId, footId }) {
    player = resolvePlayer(player);
    const body = document.getElementById(bodyId);
    const headers = headerMap(headId);
    if (!body || !headers.size || !player) return false;
    const template = Array.from(body.querySelectorAll('tr')).pop();
    if (!template) return false;
    const records = rowsFor(player, scope);
    body.innerHTML = '';
    records.forEach(record => {
      const row = template.cloneNode(true);
      applyStatsToRow(row, headers, record);
      body.appendChild(row);
    });
    const footer = document.getElementById(footId)?.querySelector('tr');
    if (footer) {
      applyStatsToRow(footer, headers, { seasonId:'career', seasonLabel:'Career', teamAbbreviation:'—', level:'—', stats:totals(records), current:false });
      setCell(footer, headers.get('SEASON'), 'Career'); setCell(footer, headers.get('TEAM'), '—'); setCell(footer, headers.get('LVL'), '—');
    }
    return true;
  }

  function careerPlayer() {
    return allPlayers().find(player => player?.isCareerPlayer === true) || WorldEngine.state?.player || Game?.player || null;
  }

  function careerScope() {
    return document.getElementById('pp-statistics-filter')?.value === 'playoffs' ? 'playoffs' : 'regular-season';
  }

  function projectCareerTable() {
    return projectTable({ player:careerPlayer(), scope:careerScope(), headId:'pp-statistics-head', bodyId:'pp-statistics-body', footId:'pp-statistics-foot' });
  }

  function profileScope() {
    return document.querySelector('#pi-player-profile-stat-scope .is-active')?.dataset?.scope === 'playoffs' ? 'playoffs' : 'regular-season';
  }

  function projectProfile(player) {
    return projectTable({ player, scope:profileScope(), headId:'player-profile-statistics-head', bodyId:'player-profile-statistics-body', footId:'player-profile-statistics-foot' });
  }

  let lastProfilePlayer = null;
  const baseProfileRender = globalThis.renderProjectIcePlayerStatistics;
  if (typeof baseProfileRender === 'function') {
    globalThis.renderProjectIcePlayerStatistics = function(player = {}, options = {}) {
      const result = baseProfileRender(player, options);
      if (String(options?.headId || '') === 'player-profile-statistics-head') {
        lastProfilePlayer = resolvePlayer(player);
        requestAnimationFrame(() => projectProfile(lastProfilePlayer));
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

    const playerRow = event.target?.closest?.('[data-player-id]');
    const clickedId = playerRow?.dataset?.playerId;
    if (clickedId) {
      const canonical = resolvePlayer(clickedId);
      if (canonical) {
        lastProfilePlayer = canonical;
        requestAnimationFrame(() => requestAnimationFrame(() => projectProfile(canonical)));
      }
    }

    const scopeButton = event.target?.closest?.('#pi-player-profile-stat-scope button[data-scope]');
    if (scopeButton && lastProfilePlayer) requestAnimationFrame(() => projectProfile(lastProfilePlayer));
  }, true);

  window.addEventListener('projectice:player-season-recap-complete', captureCompletedSeason);

  WorldEngine.captureHighSchoolSeasonStatHistory = captureCompletedSeason;
  WorldEngine.getHighSchoolSeasonStatRows = rowsFor;
  WorldEngine.normalizeHighSchoolSeasonStatHistory = normalizeHistory;
})();
