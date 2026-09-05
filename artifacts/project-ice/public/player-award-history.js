'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__playerAwardHistoryInstalled === true) return;
  WorldEngine.__playerAwardHistoryInstalled = true;

  const VERSION = 2;

  const idOf = player => String(player?.playerId || player?.id || '');
  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  function playerById(playerId) {
    if (!playerId) return null;
    return WorldEngine.getPlayerById?.(playerId) ||
      (WorldEngine.getAllWorldPlayers?.() || []).find(player => idOf(player) === String(playerId)) ||
      (WorldEngine.state?.teams || []).flatMap(team => team?.roster || [])
        .find(player => idOf(player) === String(playerId)) ||
      null;
  }

  function seasonLabelFromRecord(record, award) {
    const explicit =
      award?.seasonLabel ||
      award?.season ||
      record?.seasonLabel ||
      record?.season ||
      record?.identity?.label ||
      null;
    if (explicit) return String(explicit);

    const date = dateKey(record?.date) || dateKey(record?.archivedAt) || dateKey(String(record?.key || '').split(':')[0]);
    if (!date) return String(WorldEngine.state?.season?.label || 'High School');
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  }

  function normalizedAward(record, award) {
    const seasonLabel = seasonLabelFromRecord(record, award);
    const awardId = String(award?.awardId || award?.id || award?.title || 'award');
    return {
      key: `${seasonLabel}:${awardId}`,
      awardId,
      title: String(award?.title || 'League Award'),
      season: seasonLabel,
      seasonLabel,
      year: seasonLabel,
      level: 'High School',
      scope: award?.scope || 'regular-season',
      team: award?.team || null,
      teamId: award?.teamId || null,
      playerId: String(award?.playerId || ''),
      date: record?.date || record?.archivedAt || null,
    };
  }

  function upsertPlayerAward(player, award) {
    if (!player || !award?.key) return false;
    player.history = player.history && typeof player.history === 'object' ? player.history : {};
    player.history.awards = Array.isArray(player.history.awards) ? player.history.awards : [];

    const index = player.history.awards.findIndex(item =>
      String(item?.key || `${item?.seasonLabel || item?.season || ''}:${item?.awardId || item?.title || ''}`) === award.key
    );

    if (index >= 0) {
      const before = JSON.stringify(player.history.awards[index]);
      player.history.awards[index] = { ...player.history.awards[index], ...award };
      return JSON.stringify(player.history.awards[index]) !== before;
    }

    player.history.awards.push(award);
    return true;
  }

  function reconcileAwardRecord(record, winners) {
    let changed = false;
    for (const winner of winners || []) {
      const playerId = String(winner?.playerId || '');
      if (!playerId) continue;
      const player = playerById(playerId);
      if (!player) continue;
      if (upsertPlayerAward(player, normalizedAward(record, winner))) changed = true;
    }
    return changed;
  }

  function reconcilePlayerAwardHistory() {
    const world = WorldEngine.state;
    if (!world) return false;
    const history = world.history = world.history || {};
    let changed = false;

    /* Legacy/current award history remains a compatibility input. */
    const legacyRecords = Array.isArray(history.leagueAwards) ? history.leagueAwards : [];
    for (const record of legacyRecords) {
      if (reconcileAwardRecord(record, record?.winners || [])) changed = true;
    }

    /*
     * Canonical source of completed-season truth. Once a season rolls over,
     * postseason state can reset and the old one-off leagueAwards bucket may no
     * longer be sufficient. Permanent player awards must therefore be rebuilt
     * from the immutable yearly archives that survive every future season.
     */
    const seasonArchives = Array.isArray(history.highSchoolSeasons) ? history.highSchoolSeasons : [];
    for (const archive of seasonArchives) {
      if (reconcileAwardRecord(archive, archive?.leagueAwards || [])) changed = true;
    }

    /* Also reconcile the current postseason result before/while its archive is written. */
    const postseason = WorldEngine.getHighSchoolPostseason?.() || world?.postseason?.highSchool || null;
    const currentWinners = Array.isArray(postseason?.leagueAwards?.winners)
      ? postseason.leagueAwards.winners
      : [];
    if (currentWinners.length) {
      const currentRecord = {
        date: postseason?.leagueAwards?.selectedAt || world?.season?.currentDate || null,
        seasonLabel: world?.season?.label || world?.season?.seasonLabel || null,
      };
      if (reconcileAwardRecord(currentRecord, currentWinners)) changed = true;
    }

    const root = history.playerAwardHistory = history.playerAwardHistory || {};
    if (root.version !== VERSION) {
      root.version = VERSION;
      changed = true;
    }
    return changed;
  }

  function getPlayerAwardHistory(playerOrId) {
    reconcilePlayerAwardHistory();
    const player = typeof playerOrId === 'object' ? playerOrId : playerById(playerOrId);
    const awards = Array.isArray(player?.history?.awards) ? player.history.awards : [];
    return awards.slice().sort((a, b) =>
      String(a?.seasonLabel || a?.season || '').localeCompare(String(b?.seasonLabel || b?.season || '')) ||
      String(a?.title || '').localeCompare(String(b?.title || ''))
    );
  }

  const originalSave = typeof WorldEngine.save === 'function'
    ? WorldEngine.save.bind(WorldEngine)
    : null;
  if (originalSave && !WorldEngine.save.__playerAwardHistoryWrapped) {
    const wrappedSave = function(...args) {
      reconcilePlayerAwardHistory();
      return originalSave(...args);
    };
    wrappedSave.__playerAwardHistoryWrapped = true;
    WorldEngine.save = wrappedSave;
  }

  const originalSelect = typeof WorldEngine.selectCareerSave === 'function'
    ? WorldEngine.selectCareerSave.bind(WorldEngine)
    : null;
  if (originalSelect && !WorldEngine.selectCareerSave.__playerAwardHistoryWrapped) {
    const wrappedSelect = async function(...args) {
      const result = await originalSelect(...args);
      const changed = reconcilePlayerAwardHistory();
      if (changed) originalSave?.();
      return result;
    };
    wrappedSelect.__playerAwardHistoryWrapped = true;
    WorldEngine.selectCareerSave = wrappedSelect;
  }

  WorldEngine.reconcilePlayerAwardHistory = reconcilePlayerAwardHistory;
  WorldEngine.getPlayerAwardHistory = getPlayerAwardHistory;

  reconcilePlayerAwardHistory();
})();
