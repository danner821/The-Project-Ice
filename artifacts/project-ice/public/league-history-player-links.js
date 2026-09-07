'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__leagueHistoryPlayerLinksInstalled === true) return;
  WorldEngine.__leagueHistoryPlayerLinksInstalled = true;

  const ROOT_ID = 'pi-league-history-recap-screen';
  let returnArchiveId = '';
  let activeHistoricalContext = null;

  const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
  const playerId = player => String(player?.playerId || player?.id || '');
  const playerName = player => clean(
    player?.playerName ||
    player?.name ||
    [player?.firstName, player?.lastName].filter(Boolean).join(' ')
  );
  const archiveId = archive => String(archive?.archiveId || archive?.identity?.seasonId || '');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function archives() {
    const records = WorldEngine.getHighSchoolSeasonArchives?.() ||
      WorldEngine.state?.history?.highSchoolSeasons || [];
    return Array.isArray(records) ? records : [];
  }

  function currentWorldPlayers() {
    if (typeof WorldEngine.getAllWorldPlayers === 'function') {
      const rows = WorldEngine.getAllWorldPlayers();
      if (Array.isArray(rows)) return rows;
    }
    return (WorldEngine.state?.teams || []).flatMap(team =>
      Array.isArray(team?.roster) ? team.roster : []
    );
  }

  function graduatedPlayers() {
    const rows = WorldEngine.state?.highSchoolRosterLifecycle?.graduatedPlayers || [];
    return Array.isArray(rows) ? rows : [];
  }

  function historicalPlayers() {
    return [...currentWorldPlayers(), ...graduatedPlayers()];
  }

  function allArchiveRows(archive) {
    return [
      ...(archive?.leagueAwards || []),
      ...(archive?.leagueLeaders?.points || []),
      ...(archive?.leagueLeaders?.goals || []),
      ...(archive?.leagueLeaders?.assists || []),
      ...(archive?.leagueLeaders?.savePercentage || []),
    ];
  }

  function archivedReferenceByName(name) {
    const target = clean(name);
    if (!target) return null;

    for (const archive of [...archives()].reverse()) {
      const hit = allArchiveRows(archive)
        .find(row => clean(row?.playerName || row?.name) === target);
      if (hit) return { archive, row: hit };
    }
    return null;
  }

  function resolvePlayer(name) {
    const reference = archivedReferenceByName(name);
    const id = String(reference?.row?.playerId || '');
    if (id) {
      const canonical = WorldEngine.getPlayerById?.(id) ||
        historicalPlayers().find(player => playerId(player) === id) ||
        null;
      if (canonical) return { player: canonical, archive: reference.archive, row: reference.row };
    }

    const target = clean(name);
    const fallback = historicalPlayers().find(player => playerName(player) === target) || null;
    return fallback ? { player: fallback, archive: reference?.archive || null, row: reference?.row || null } : null;
  }

  function clickedArchivedPlayerRow(event) {
    const root = event.target?.closest?.(`#${ROOT_ID}`);
    if (!root) return null;

    const row = event.target?.closest?.('.pi-lhr-leader-row, .pi-lhr-award-row');
    if (!row) return null;

    const nameNode = row.querySelector('strong');
    const name = clean(nameNode?.textContent);
    if (!name || name === '—') return null;
    return { row, name };
  }

  function shortSeasonLabel(archive) {
    const start = Number(archive?.identity?.startYear);
    if (Number.isFinite(start)) return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
    const label = String(archive?.identity?.label || '').trim();
    const match = label.match(/(\d{4}).*?(\d{2,4})/);
    if (match) return `${match[1].slice(-2)}-${match[2].slice(-2)}`;
    return label || '—';
  }

  function teamAbbreviation(archive, sourceRow) {
    if (sourceRow?.team) return String(sourceRow.team);
    const teamId = String(sourceRow?.teamId || '');
    const standing = (archive?.finalStandings || []).find(row => String(row?.teamId || '') === teamId);
    if (!standing) return '—';
    return String(
      standing.abbreviation ||
      `${standing.schoolName || ''} ${standing.teamName || ''}`
        .trim().split(/\s+/).filter(Boolean).map(word => word[0]).join('').toUpperCase() ||
      '—'
    );
  }

  function levelFor(player, archive, sourceRow) {
    const direct = String(sourceRow?.classLabel || '').toLowerCase();
    if (direct.includes('freshman')) return 'FR';
    if (direct.includes('sophomore')) return 'SO';
    if (direct.includes('junior')) return 'JR';
    if (direct.includes('senior')) return 'SR';

    const start = Number(archive?.identity?.startYear);
    const draftYear = Number(player?.draftYear);
    if (Number.isFinite(start) && Number.isFinite(draftYear)) {
      const grade = 13 - (draftYear - start);
      return ({ 9:'FR', 10:'SO', 11:'JR', 12:'SR' })[grade] || 'HS';
    }
    return 'HS';
  }

  function statsForScope(context, scope) {
    const rows = allArchiveRows(context.archive)
      .filter(row => String(row?.playerId || '') === String(context.playerId || ''));

    const wantedScope = scope === 'playoffs' ? 'playoffs' : 'regular-season';
    const scopedRow = rows.find(row =>
      (wantedScope === 'playoffs'
        ? String(row?.scope || '').toLowerCase() === 'playoffs'
        : String(row?.scope || 'regular-season').toLowerCase() !== 'playoffs') &&
      row?.stats && typeof row.stats === 'object'
    );

    if (scopedRow) return { row: scopedRow, stats: scopedRow.stats };

    if (wantedScope === 'regular-season') {
      const leaderRow = rows.find(row => row?.stats && typeof row.stats === 'object');
      if (leaderRow && String(leaderRow?.scope || '').toLowerCase() !== 'playoffs') {
        return { row: leaderRow, stats: leaderRow.stats };
      }
    }

    return null;
  }

  function headerMap() {
    const map = new Map();
    Array.from(document.getElementById('player-profile-statistics-head')?.querySelectorAll('th') || [])
      .forEach((cell, index) => {
        const key = String(cell.textContent || '').trim().toUpperCase().replace(/[^A-Z0-9+/%-]/g, '');
        if (key) map.set(key, index);
      });
    return map;
  }

  function setCell(row, headers, key, value) {
    const index = headers.get(key);
    if (index !== undefined && row?.children?.[index]) row.children[index].textContent = String(value);
  }

  function rowLooksEmpty(row, headers) {
    const keys = ['GP','G','A','PTS','W','L','GA','SO'];
    return keys.every(key => {
      const index = headers.get(key);
      if (index === undefined || !row?.children?.[index]) return true;
      return num(row.children[index].textContent) === 0;
    });
  }

  function renderArchivedStats() {
    const context = activeHistoricalContext;
    if (!context) return;

    const screen = document.getElementById('player-profile-screen');
    if (!screen || screen.classList.contains('screen--hidden')) return;

    const selectedScope =
      document.querySelector('#pi-npc-player-profile-scope button.is-active')?.dataset?.scope ||
      document.querySelector('#pi-player-profile-stat-scope button.is-active')?.dataset?.scope ||
      'regular-season';

    if (!['regular-season','playoffs'].includes(selectedScope)) return;

    const source = statsForScope(context, selectedScope);
    if (!source) return;

    const body = document.getElementById('player-profile-statistics-body');
    const headers = headerMap();
    if (!body || !headers.size) return;

    let rows = Array.from(body.querySelectorAll('tr'));
    if (!rows.length) return;

    const seasonLabel = shortSeasonLabel(context.archive);
    let target = rows.find(row => {
      const index = headers.get('SEASON');
      return index !== undefined && clean(row.children?.[index]?.textContent) === seasonLabel;
    });

    if (!target) {
      target = rows.find(row => rowLooksEmpty(row, headers)) || rows[0];
    }

    const s = source.stats || {};
    const team = teamAbbreviation(context.archive, source.row || context.row);
    const level = levelFor(context.player, context.archive, source.row || context.row);

    setCell(target, headers, 'SEASON', seasonLabel);
    setCell(target, headers, 'TEAM', team);
    setCell(target, headers, 'LVL', level);
    setCell(target, headers, 'GP', num(s.gamesPlayed));
    setCell(target, headers, 'G', num(s.goals));
    setCell(target, headers, 'A', num(s.assists));
    setCell(target, headers, 'PTS', num(s.points));
    setCell(target, headers, '+/-', num(s.plusMinus));
    setCell(target, headers, 'PIM', num(s.penaltyMinutes));
    setCell(target, headers, 'SOG', num(s.shots));
    setCell(target, headers, 'SHOTS', num(s.shots));
    setCell(target, headers, 'GS', num(s.gamesStarted));
    setCell(target, headers, 'W', num(s.wins));
    setCell(target, headers, 'L', num(s.losses));
    setCell(target, headers, 'OTL', num(s.overtimeLosses));
    setCell(target, headers, 'GA', num(s.goalsAgainst));
    setCell(target, headers, 'GAA', num(s.goalsAgainstAverage).toFixed(2));
    setCell(target, headers, 'SV%', num(s.savePercentage).toFixed(3).replace(/^0/, ''));
    setCell(target, headers, 'SO', num(s.shutouts));

    target.dataset.piArchivedSeason = archiveId(context.archive);

    rows = Array.from(body.querySelectorAll('tr'));
    const footer = document.getElementById('player-profile-statistics-foot')?.querySelector('tr');
    if (footer && rows.every(row => rowLooksEmpty(row, headers) || row === target)) {
      for (const key of ['GP','G','A','PTS','+/-','PIM','SOG','SHOTS','GS','W','L','OTL','GA','GAA','SV%','SO']) {
        const index = headers.get(key);
        if (index !== undefined && target.children?.[index] && footer.children?.[index]) {
          footer.children[index].textContent = target.children[index].textContent;
        }
      }
      setCell(footer, headers, 'SEASON', 'Career');
      setCell(footer, headers, 'TEAM', '—');
      setCell(footer, headers, 'LVL', '—');
    }
  }

  function scheduleArchivedStatsRender() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(renderArchivedStats);
      });
    });
  }

  document.addEventListener('click', event => {
    const back = event.target?.closest?.('#btn-back-player-profile');
    if (back && returnArchiveId) {
      const id = returnArchiveId;
      returnArchiveId = '';
      activeHistoricalContext = null;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (typeof globalThis.openHubTab === 'function') globalThis.openHubTab('league');
      else if (typeof globalThis.showScreen === 'function') globalThis.showScreen('hub');

      requestAnimationFrame(() => {
        WorldEngine.openArchivedLeagueSeasonRecap?.(id);
      });
      return;
    }

    const scopeButton = event.target?.closest?.(
      '#pi-npc-player-profile-scope button[data-scope], #pi-player-profile-stat-scope button[data-scope]'
    );
    if (scopeButton && activeHistoricalContext) {
      scheduleArchivedStatsRender();
      return;
    }

    const hit = clickedArchivedPlayerRow(event);
    if (!hit) return;

    const resolved = resolvePlayer(hit.name);
    if (!resolved?.player || typeof globalThis.openPlayerProfile !== 'function') return;

    returnArchiveId = archiveId(resolved.archive);
    activeHistoricalContext = {
      archive: resolved.archive,
      row: resolved.row,
      player: resolved.player,
      playerId: playerId(resolved.player),
    };
    WorldEngine.activeHistoricalProfileContext = activeHistoricalContext;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById(ROOT_ID)?.remove();
    globalThis.openPlayerProfile(resolved.player, 'league-history');
    scheduleArchivedStatsRender();
  }, true);

  /* Add a subtle interactive affordance only while a historical recap is open. */
  const style = document.createElement('style');
  style.textContent = `
    #${ROOT_ID} .pi-lhr-leader-row:has(strong),
    #${ROOT_ID} .pi-lhr-award-row:has(strong){cursor:pointer}
    #${ROOT_ID} .pi-lhr-leader-row:active,
    #${ROOT_ID} .pi-lhr-award-row:active{opacity:.72}
  `;
  document.head.appendChild(style);
})();
