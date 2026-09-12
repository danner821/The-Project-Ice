'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__playerAwardHistoryInstalled === true) return;
  WorldEngine.__playerAwardHistoryInstalled = true;

  const VERSION = 5;

  const idOf = player => String(player?.playerId || player?.id || '');
  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  function graduatedPlayers() {
    const rows = WorldEngine.state?.highSchoolRosterLifecycle?.graduatedPlayers || [];
    return Array.isArray(rows) ? rows : [];
  }

  function allKnownPlayers() {
    const rows = [];
    const seen = new Set();
    const add = player => {
      if (!player || typeof player !== 'object') return;
      const key = idOf(player) || player;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(player);
    };

    for (const player of WorldEngine.getAllWorldPlayers?.() || []) add(player);
    for (const team of WorldEngine.state?.teams || []) {
      for (const player of team?.roster || []) add(player);
    }
    for (const player of graduatedPlayers()) add(player);
    add(WorldEngine.state?.player);
    return rows;
  }

  function playerById(playerId) {
    if (!playerId) return null;
    return WorldEngine.getPlayerById?.(playerId) ||
      allKnownPlayers().find(player => idOf(player) === String(playerId)) ||
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

  function canonicalSeasonDate(record, value) {
    const raw = dateKey(value);
    const endYear = Number(record?.identity?.endYear);
    if (!raw || !Number.isFinite(endYear)) return raw;
    const year = Number(raw.slice(0, 4));
    if (year === endYear) return raw;
    return `${endYear}${raw.slice(4)}`;
  }

  function normalizedAward(record, award) {
    const seasonLabel = seasonLabelFromRecord(record, award);
    const title = String(award?.title || award?.name || award?.awardName || 'League Award');
    const awardId = String(award?.awardId || award?.id || title || 'award');
    return {
      key: `${seasonLabel}:${awardId}`,
      awardId,
      title,
      name: title,
      awardName: title,
      season: seasonLabel,
      seasonLabel,
      year: seasonLabel,
      level: award?.level || 'High School',
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
      String(item?.key || `${item?.seasonLabel || item?.season || ''}:${item?.awardId || item?.title || item?.name || ''}`) === award.key
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

  function playerParticipatedForTeam(player, archive, teamId) {
    const startYear = Number(archive?.identity?.startYear);
    const history = Array.isArray(player?.highSchoolSeasonHistory)
      ? player.highSchoolSeasonHistory
      : [];

    if (Number.isFinite(startYear)) {
      return history.some(row =>
        Number(row?.seasonStartYear) === startYear &&
        String(row?.teamId || '') === String(teamId || '')
      );
    }

    return String(player?.teamId || '') === String(teamId || '');
  }

  function championshipAward(record, player, teamId, teamName) {
    const seasonLabel = seasonLabelFromRecord(record, null);
    const rawDate = record?.postseasonCompletedDate || record?.archivedAt || null;
    const date = canonicalSeasonDate(record, rawDate);
    return {
      key: `${seasonLabel}:high-school-champion`,
      awardId: 'high-school-champion',
      title: 'High School Champion',
      name: 'High School Champion',
      awardName: 'High School Champion',
      season: seasonLabel,
      seasonLabel,
      year: seasonLabel,
      level: 'High School',
      scope: 'team',
      team: teamName || null,
      teamId: teamId || null,
      playerId: idOf(player),
      date,
      championship: true,
      teamAward: true,
    };
  }

  function reconcileArchivedChampionship(record) {
    const championTeamId = String(record?.champion?.teamId || record?.championTeamId || '');
    if (!championTeamId) return false;

    const championName = String(
      record?.champion?.abbreviation ||
      record?.champion?.teamName ||
      record?.champion?.name ||
      ''
    );

    let changed = false;
    for (const player of allKnownPlayers()) {
      if (!playerParticipatedForTeam(player, record, championTeamId)) continue;
      if (upsertPlayerAward(player, championshipAward(record, player, championTeamId, championName))) {
        changed = true;
      }
    }
    return changed;
  }

  function reconcileCurrentChampionship(postseason, world) {
    const championTeamId = String(postseason?.championTeamId || '');
    if (!championTeamId) return false;

    const team = (world?.teams || []).find(item => String(item?.teamId || '') === championTeamId) || null;
    const seasonLabel = String(world?.season?.label || world?.season?.seasonLabel || world?.currentSeason || 'High School');
    const date = dateKey(postseason?.completedDate || world?.season?.currentDate || world?.currentDate);
    const record = {
      identity: {
        label: seasonLabel,
        startYear: Number(world?.season?.seasonStartYear || world?.season?.currentYear) || null,
        endYear: Number(world?.season?.seasonEndYear) || null,
      },
      seasonLabel,
      postseasonCompletedDate: date,
    };

    let changed = false;
    for (const player of team?.roster || []) {
      if (upsertPlayerAward(player, championshipAward(
        record,
        player,
        championTeamId,
        team?.abbreviation || team?.teamName || team?.name || ''
      ))) changed = true;
    }
    return changed;
  }

  function reconcilePlayerAwardHistory() {
    const world = WorldEngine.state;
    if (!world) return false;
    const history = world.history = world.history || {};
    let changed = false;

    const legacyRecords = Array.isArray(history.leagueAwards) ? history.leagueAwards : [];
    for (const record of legacyRecords) {
      if (reconcileAwardRecord(record, record?.winners || [])) changed = true;
    }

    const seasonArchives = Array.isArray(history.highSchoolSeasons) ? history.highSchoolSeasons : [];
    for (const archive of seasonArchives) {
      if (reconcileAwardRecord(archive, archive?.leagueAwards || [])) changed = true;
      if (reconcileArchivedChampionship(archive)) changed = true;
    }

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
    if (reconcileCurrentChampionship(postseason, world)) changed = true;

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
      String(a?.title || a?.name || '').localeCompare(String(b?.title || b?.name || ''))
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