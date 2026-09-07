'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__leagueHistoryPlayerLinksInstalled === true) return;
  WorldEngine.__leagueHistoryPlayerLinksInstalled = true;

  const ROOT_ID = 'pi-league-history-recap-screen';
  let returnArchiveId = '';

  const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
  const playerId = player => String(player?.playerId || player?.id || '');
  const playerName = player => clean(
    player?.playerName ||
    player?.name ||
    [player?.firstName, player?.lastName].filter(Boolean).join(' ')
  );
  const archiveId = archive => String(archive?.archiveId || archive?.identity?.seasonId || '');

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

  function archivedReferenceByName(name) {
    const target = clean(name);
    if (!target) return null;

    for (const archive of [...archives()].reverse()) {
      const pools = [
        ...(archive?.leagueAwards || []),
        ...(archive?.leagueLeaders?.points || []),
        ...(archive?.leagueLeaders?.goals || []),
        ...(archive?.leagueLeaders?.assists || []),
        ...(archive?.leagueLeaders?.savePercentage || []),
      ];
      const hit = pools.find(row => clean(row?.playerName || row?.name) === target);
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
      if (canonical) return { player: canonical, archive: reference.archive };
    }

    const target = clean(name);
    const fallback = historicalPlayers().find(player => playerName(player) === target) || null;
    return fallback ? { player: fallback, archive: reference?.archive || null } : null;
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

  document.addEventListener('click', event => {
    const back = event.target?.closest?.('#btn-back-player-profile');
    if (back && returnArchiveId) {
      const id = returnArchiveId;
      returnArchiveId = '';
      event.preventDefault();
      event.stopImmediatePropagation();

      if (typeof globalThis.openHubTab === 'function') globalThis.openHubTab('league');
      else if (typeof globalThis.showScreen === 'function') globalThis.showScreen('hub');

      requestAnimationFrame(() => {
        WorldEngine.openArchivedLeagueSeasonRecap?.(id);
      });
      return;
    }

    const hit = clickedArchivedPlayerRow(event);
    if (!hit) return;

    const resolved = resolvePlayer(hit.name);
    if (!resolved?.player || typeof globalThis.openPlayerProfile !== 'function') return;

    returnArchiveId = archiveId(resolved.archive);

    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById(ROOT_ID)?.remove();
    globalThis.openPlayerProfile(resolved.player, 'league-history');
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
