'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolSeasonArchiveInstalled === true) return;
  WorldEngine.__highSchoolSeasonArchiveInstalled = true;

  const VERSION = 3;

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const clone = value => value == null ? value : structuredClone(value);
  const idOf = player => String(player?.playerId || player?.id || player?.prospectId || '');
  const nameOf = player => String(
    player?.playerName || player?.name || [player?.firstName, player?.lastName].filter(Boolean).join(' ') || 'Unknown Player'
  );

  function world() {
    return WorldEngine.state || null;
  }

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() || world()?.postseason?.highSchool || null;
  }

  function careerPlayer() {
    const state = world();
    if (!state) return null;
    return (state.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) || state.player || null;
  }

  function teamById(teamId) {
    return (world()?.teams || []).find(team => String(team?.teamId || '') === String(teamId || '')) || null;
  }

  function teamSnapshot(teamId) {
    const team = teamById(teamId);
    if (!team && !teamId) return null;
    return {
      teamId: String(team?.teamId || teamId || ''),
      schoolName: team?.schoolName || '',
      teamName: team?.teamName || team?.name || '',
      abbreviation: team?.abbreviation || '',
    };
  }

  function seasonIdentity() {
    const state = world();
    const player = careerPlayer();
    const season = state?.season || {};
    const startYear = Number(
      season.seasonStartYear ||
      season.currentYear ||
      String(season.seasonId || '').match(/hs-(\d{4})-/)?.[1] ||
      String(postseason()?.regularSeasonEndDate || '').slice(0, 4)
    );
    const careerYearIndex = Number.isFinite(Number(season.careerYearIndex))
      ? Number(season.careerYearIndex)
      : Math.max(0, Math.min(3, startYear - 2023));
    const canonical = WorldEngine.getHighSchoolSeasonIdentity?.(careerYearIndex) || null;
    return {
      careerYearIndex,
      schoolYear: season.schoolYear || player?.schoolYear || player?.year || canonical?.schoolYear || '',
      startYear: Number.isFinite(startYear) ? startYear : canonical?.startYear || null,
      endYear: Number.isFinite(startYear) ? startYear + 1 : canonical?.endYear || null,
      label: season.label || season.seasonLabel || state?.currentSeason || canonical?.label || '',
      seasonId: season.seasonId || canonical?.seasonId || '',
    };
  }

  function championshipResult(post) {
    const series = post?.bracket?.rounds?.championship?.[0] || null;
    const championTeamId = post?.championTeamId || series?.winnerTeamId || null;
    const runnerUpTeamId = series?.loserTeamId || (
      championTeamId && series
        ? [series.higherSeedTeamId, series.lowerSeedTeamId].find(id => String(id) !== String(championTeamId)) || null
        : null
    );
    return {
      champion: teamSnapshot(championTeamId),
      runnerUp: teamSnapshot(runnerUpTeamId),
    };
  }

  function scopedStats(player, scope) {
    if (!player) return null;
    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    const stats = WorldEngine.getPlayerStatsByScope?.(player, scope);
    return stats ? clone(stats) : null;
  }

  function allPlayers() {
    return WorldEngine.getAllWorldPlayers?.() || (world()?.teams || []).flatMap(team => team?.roster || []);
  }

  function leaderRow(player, stats, value) {
    return {
      playerId: idOf(player),
      playerName: nameOf(player),
      teamId: player?.teamId || null,
      position: player?.position || '',
      value,
      stats: clone(stats),
    };
  }

  function topThree(rows, valueFn) {
    return rows
      .map(row => ({ ...row, value: Number(valueFn(row.stats)) || 0 }))
      .sort((a, b) => b.value - a.value || String(a.playerName).localeCompare(String(b.playerName)))
      .slice(0, 3)
      .map(row => leaderRow(row.player, row.stats, row.value));
  }

  function leagueLeaders() {
    const rows = allPlayers().map(player => ({
      player,
      playerName: nameOf(player),
      stats: scopedStats(player, 'regular-season') || {},
    })).filter(row => Number(row.stats?.gamesPlayed || 0) > 0);

    const skaters = rows.filter(row => String(row.player?.position || '').toUpperCase() !== 'G');
    const goalies = rows.filter(row => String(row.player?.position || '').toUpperCase() === 'G');

    return {
      points: topThree(skaters, stats => stats.points),
      goals: topThree(skaters, stats => stats.goals),
      assists: topThree(skaters, stats => stats.assists),
      savePercentage: topThree(goalies, stats => stats.savePercentage),
    };
  }

  function careerPlayerSnapshot() {
    const player = careerPlayer();
    if (!player) return null;
    const teamId = player.teamId || world()?.player?.teamId || null;
    return {
      playerId: idOf(player),
      playerName: nameOf(player),
      team: teamSnapshot(teamId),
      position: player.position || '',
      role: player.lineupRole || player.role || player.currentRole || null,
      overall: Number(player.overall || 0),
      potential: player.potential || null,
      schoolYear: player.schoolYear || player.year || null,
      age: Number(player.age || 0) || null,
      regularSeasonStats: scopedStats(player, 'regular-season'),
      playoffStats: scopedStats(player, 'playoffs'),
      awards: clone(player?.history?.awards || []),
    };
  }

  function travelSnapshot() {
    const travel = world()?.travelHockey || null;
    const tournament = travel?.tournament || null;
    if (!travel || !tournament) return null;
    return {
      level: travel.placementLevel || tournament.level || null,
      championTeamId: tournament.championTeamId || null,
      mvpPlayerId: tournament.mvpPlayerId || null,
      mvpPlayerName: tournament.mvpPlayerName || null,
      mvpTeamId: tournament.mvpTeamId || null,
      completed: travel.completed === true,
      closeoutAcknowledged: tournament.closeoutAcknowledged === true,
    };
  }

  function finalStandings(post) {
    if (Array.isArray(post?.frozenStandings) && post.frozenStandings.length) {
      return clone(post.frozenStandings);
    }

    const teams = world()?.teams || [];
    return teams.map(team => ({
      teamId: team.teamId || '',
      schoolName: team.schoolName || '',
      teamName: team.teamName || team.name || '',
      abbreviation: team.abbreviation || '',
      wins: Number(team.wins || 0),
      losses: Number(team.losses || 0),
      overtimeLosses: Number(team.overtimeLosses || team.otl || 0),
      points: Number(team.points ?? (Number(team.wins || 0) * 2 + Number(team.overtimeLosses || team.otl || 0))),
    })).sort((a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      String(a.teamName).localeCompare(String(b.teamName))
    );
  }

  function leagueAwardWinners(post) {
    if (Array.isArray(post?.leagueAwards?.winners) && post.leagueAwards.winners.length) {
      return clone(post.leagueAwards.winners);
    }

    const history = world()?.history?.leagueAwards;
    if (!Array.isArray(history) || !history.length) return [];
    const latest = [...history].reverse().find(record =>
      Array.isArray(record?.winners) && record.winners.length
    );
    return clone(latest?.winners || []);
  }

  function archiveReadiness() {
    const post = postseason();
    const travel = world()?.travelHockey;
    const standings = finalStandings(post);
    const awards = leagueAwardWinners(post);
    return {
      ready: Boolean(
        post?.championTeamId &&
        standings.length > 0 &&
        awards.length > 0 &&
        travel?.completed === true &&
        travel?.tournament?.closeoutAcknowledged === true
      ),
      champion: Boolean(post?.championTeamId),
      standings: standings.length,
      awards: awards.length,
      travelCompleted: travel?.completed === true,
      travelCloseout: travel?.tournament?.closeoutAcknowledged === true,
    };
  }

  function buildArchiveRecord() {
    const readiness = archiveReadiness();
    if (!readiness.ready) return null;
    const state = world();
    const post = postseason();
    const identity = seasonIdentity();
    const championship = championshipResult(post);
    const player = careerPlayerSnapshot();
    const standings = finalStandings(post);
    const awards = leagueAwardWinners(post);
    const careerTeamStanding = standings.find(row =>
      String(row?.teamId || '') === String(player?.team?.teamId || '')
    ) || null;

    return {
      version: VERSION,
      archiveId: identity.seasonId || `hs-season-${identity.startYear || dateKey(post.regularSeasonEndDate) || 'unknown'}`,
      archivedAt: dateKey(
        state?.season?.currentDate || state?.player?.currentDate || state?.currentDate
      ),
      identity,
      regularSeasonEndDate: dateKey(post.regularSeasonEndDate),
      postseasonCompletedDate: dateKey(post.completedDate),
      finalStandings: standings,
      champion: championship.champion,
      runnerUp: championship.runnerUp,
      playoffs: clone(post.bracket || null),
      leagueAwards: awards,
      playoffMvpPlayerId: post.playoffMvpPlayerId || null,
      leagueLeaders: leagueLeaders(),
      careerPlayer: player,
      careerTeamStanding: careerTeamStanding ? clone(careerTeamStanding) : null,
      travel: travelSnapshot(),
    };
  }

  function ensureArchive(options = {}) {
    const state = world();
    const readiness = archiveReadiness();
    if (!state || !readiness.ready) {
      return { archived: false, reason: 'season-not-ready', readiness };
    }

    state.history = state.history && typeof state.history === 'object' ? state.history : {};
    state.history.highSchoolSeasons = Array.isArray(state.history.highSchoolSeasons)
      ? state.history.highSchoolSeasons
      : [];

    const record = buildArchiveRecord();
    if (!record) return { archived: false, reason: 'record-unavailable', readiness };

    const existingIndex = state.history.highSchoolSeasons.findIndex(item =>
      String(item?.archiveId || '') === String(record.archiveId || '')
    );
    if (existingIndex >= 0) {
      const existing = state.history.highSchoolSeasons[existingIndex];
      if (Number(existing?.version || 0) >= VERSION) {
        return { archived: false, reason: 'already-archived', record: clone(existing), readiness };
      }
      state.history.highSchoolSeasons[existingIndex] = record;
      if (options.save !== false) WorldEngine.save?.();
      return { archived: true, upgraded: true, record: clone(record), readiness };
    }

    state.history.highSchoolSeasons.push(record);
    state.history.highSchoolSeasons.sort((a, b) =>
      Number(a?.identity?.startYear || 0) - Number(b?.identity?.startYear || 0)
    );

    if (options.save !== false) WorldEngine.save?.();
    return { archived: true, record: clone(record), readiness };
  }

  function getArchives() {
    return clone(world()?.history?.highSchoolSeasons || []);
  }

  function getArchiveById(id) {
    const record = (world()?.history?.highSchoolSeasons || []).find(item =>
      String(item?.archiveId || '') === String(id || '') ||
      String(item?.identity?.seasonId || '') === String(id || '') ||
      String(item?.identity?.label || '') === String(id || '')
    );
    return record ? clone(record) : null;
  }

  function afterLoad(result) {
    ensureArchive({ save: true });
    return result;
  }

  const originalSelectCareerSave = WorldEngine.selectCareerSave;
  if (typeof originalSelectCareerSave === 'function' && originalSelectCareerSave.__hsArchiveWrapped !== true) {
    const wrapped = async function(...args) {
      const result = await originalSelectCareerSave.apply(WorldEngine, args);
      afterLoad(result);
      return result;
    };
    wrapped.__hsArchiveWrapped = true;
    WorldEngine.selectCareerSave = wrapped;
  }

  WorldEngine.ensureHighSchoolSeasonArchive = ensureArchive;
  WorldEngine.getHighSchoolSeasonArchives = getArchives;
  WorldEngine.getHighSchoolSeasonArchive = getArchiveById;
  WorldEngine.getHighSchoolSeasonArchiveReadiness = archiveReadiness;

  ensureArchive({ save: true });
})();
