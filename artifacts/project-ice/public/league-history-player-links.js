'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__leagueHistoryPlayerLinksInstalled === true) return;
  WorldEngine.__leagueHistoryPlayerLinksInstalled = true;

  const ROOT_ID = 'pi-league-history-recap-screen';

  const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
  const playerId = player => String(player?.playerId || player?.id || '');
  const playerName = player => clean(
    player?.playerName ||
    player?.name ||
    [player?.firstName, player?.lastName].filter(Boolean).join(' ')
  );

  function currentWorldPlayers() {
    if (typeof WorldEngine.getAllWorldPlayers === 'function') {
      const rows = WorldEngine.getAllWorldPlayers();
      if (Array.isArray(rows)) return rows;
    }
    return (WorldEngine.state?.teams || []).flatMap(team =>
      Array.isArray(team?.roster) ? team.roster : []
    );
  }

  function archivedPlayerIdByName(name) {
    const target = clean(name);
    if (!target) return '';

    const archives = WorldEngine.getHighSchoolSeasonArchives?.() ||
      WorldEngine.state?.history?.highSchoolSeasons || [];

    for (const archive of [...(Array.isArray(archives) ? archives : [])].reverse()) {
      const pools = [
        ...(archive?.leagueAwards || []),
        ...(archive?.leagueLeaders?.points || []),
        ...(archive?.leagueLeaders?.goals || []),
        ...(archive?.leagueLeaders?.assists || []),
        ...(archive?.leagueLeaders?.savePercentage || []),
      ];
      const hit = pools.find(row => clean(row?.playerName || row?.name) === target);
      if (hit?.playerId) return String(hit.playerId);
    }
    return '';
  }

  function resolvePlayer(name) {
    const id = archivedPlayerIdByName(name);
    if (id) {
      const canonical = WorldEngine.getPlayerById?.(id) ||
        currentWorldPlayers().find(player => playerId(player) === id) ||
        null;
      if (canonical) return canonical;
    }

    const target = clean(name);
    return currentWorldPlayers().find(player => playerName(player) === target) || null;
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
    const hit = clickedArchivedPlayerRow(event);
    if (!hit) return;

    const player = resolvePlayer(hit.name);
    if (!player || typeof globalThis.openPlayerProfile !== 'function') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById(ROOT_ID)?.remove();
    globalThis.openPlayerProfile(player, 'hub');
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
