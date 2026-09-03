'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolSeasonArchiveInstalled === true) return;
  WorldEngine.__highSchoolSeasonArchiveInstalled = true;

  const VERSION = 5;

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

  function isSyntheticDevState() {
    const post = postseason();
    const travel = world()?.travelHockey;
    return Boolean(
      post?.syntheticDevCheckpoint === true ||
      travel?.syntheticDevCheckpoint === true ||
      travel?.syntheticPostTravelOffseason === true ||
      travel?.tournament?.syntheticDevCheckpoint === true ||
      travel?.tournament?.syntheticPostTravelOffseason === true
    );
  }

  function championshipSeries(post) {
    return post?.bracket?.rounds?.championship?.[0] ||
      post?.bracket?.championship?.[0] ||
      post?.championshipSeries ||
      null;
  }

  function championshipResult(post, standings = finalStandings(post)) {
    const series = championshipSeries(post);
    const championTeamId =
      post?.championTeamId ||
      series?.winnerTeamId ||
      series?.winnerId ||
      post?.championship?.winnerTeamId ||
      (isSyntheticDevState() ? standings?.[0]?.teamId || null : null);
    const runnerUpTeamId =
      series?.loserTeamId ||
      series?.loserId ||
      post?.championship?.loserTeamId ||
      (
        championTeamId && series
          ? [
              series.higherSeedTeamId,
              series.lowerSeedTeamId,
              series.homeTeamId,
              series.awayTeamId,
            ].find(id => id && String(id) !== String(championTeamId)) || null
          : null
      ) ||
      (isSyntheticDevState()
        ? standings.find(row => String(row?.teamId || '') !== String(championTeamId || ''))?.teamId || null
        : null);
    return {
      championTeamId,
      runnerUpTeamId,
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
    const fallbackMvp = isSyntheticDevState() ? careerPlayer() : null;
    return {
      level: travel.placementLevel || tournament.level || null,
      championTeamId: tournament.championTeamId || travel.playerTeamId || travel.placementTeamId || null,
      mvpPlayerId: tournament.mvpPlayerId || idOf(fallbackMvp) || null,
      mvpPlayerName: tournament.mvpPlayerName || (fallbackMvp ? nameOf(fallbackMvp) : null),
      mvpTeamId: tournament.mvpTeamId || travel.playerTeamId || travel.placementTeamId || null,
      completed: travel.completed === true,
      closeoutAcknowledged: tournament.closeoutAcknowledged === true,
      syntheticDevFixture: isSyntheticDevState(),
    };
  }

  function leagueAwardWinners(post) {
    if (Array.isArray(post?.leagueAwards?.winners) && post.leagueAwards.winners.length) {
      return clone(post.leagueAwards.winners);
    }

    const history = world()?.history?.leagueAwards;
    if (Array.isArray(history) && history.length) {
      const latest = [...history].reverse().find(record =>
        Array.isArray(record?.winners) && record.winners.length
      );
      if (latest?.winners?.length) return clone(latest.winners);
    }

    if (!isSyntheticDevState()) return [];

    const rows = allPlayers().map(player => ({
      player,
      stats: scopedStats(player, 'regular-season') || {},
    }));
    const skaters = rows.filter(row => String(row.player?.position || '').toUpperCase() !== 'G');
    const goalies = rows.filter(row => String(row.player?.position || '').toUpperCase() === 'G');
    const byPoints = [...skaters].sort((a, b) => Number(b.stats?.points || 0) - Number(a.stats?.points || 0));
    const defense = skaters.filter(row => ['D', 'LD', 'RD'].includes(String(row.player?.position || '').toUpperCase()))
      .sort((a, b) => Number(b.stats?.points || 0) - Number(a.stats?.points || 0));
    const bySave = [...goalies].sort((a, b) => Number(b.stats?.savePercentage || 0) - Number(a.stats?.savePercentage || 0));
    const makeAward = (row, title) => row ? {
      title,
      playerId: idOf(row.player),
      playerName: nameOf(row.player),
      teamId: row.player?.teamId || null,
      team: teamById(row.player?.teamId)?.teamName || teamById(row.player?.teamId)?.name || '',
      position: row.player?.position || '',
      scope: 'regular-season',
      syntheticDevFixture: true,
    } : null;

    return [
      makeAward(byPoints[0], 'League MVP'),
      makeAward(byPoints[1] || byPoints[0], 'Best Forward'),
      makeAward(defense[0] || byPoints[2] || byPoints[0], 'Best Defenseman'),
      makeAward(bySave[0], 'Best Goaltender'),
    ].filter(Boolean);
  }

  function archiveReadiness() {
    const post = postseason();
    const travel = world()?.travelHockey;
    const standings = finalStandings(post);
    const awards = leagueAwardWinners(post);
    const championship = championshipResult(post, standings);
    return {
      ready: Boolean(
        championship.championTeamId &&
        standings.length > 0 &&
        awards.length > 0 &&
        travel?.completed === true &&
        travel?.tournament?.closeoutAcknowledged === true
      ),
      champion: Boolean(championship.championTeamId),
      championTeamId: championship.championTeamId || null,
      standings: standings.length,
      awards: awards.length,
      travelCompleted: travel?.completed === true,
      travelCloseout: travel?.tournament?.closeoutAcknowledged === true,
      syntheticDevFixture: isSyntheticDevState(),
    };
  }

  function buildArchiveRecord() {
    const readiness = archiveReadiness();
    if (!readiness.ready) return null;
    const state = world();
    const post = postseason();
    const identity = seasonIdentity();
    const standings = finalStandings(post);
    const championship = championshipResult(post, standings);
    const player = careerPlayerSnapshot();
    const awards = leagueAwardWinners(post);
    const careerTeamStanding = standings.find(row =>
      String(row?.teamId || '') === String(player?.team?.teamId || '')
    ) || null;

    return {
      version: VERSION,
      archiveId: identity.seasonId || `hs-season-${identity.startYear || dateKey(post?.regularSeasonEndDate) || 'unknown'}`,
      archivedAt: dateKey(
        state?.season?.currentDate || state?.player?.currentDate || state?.currentDate
      ),
      identity,
      regularSeasonEndDate: dateKey(post?.regularSeasonEndDate),
      postseasonCompletedDate: dateKey(post?.completedDate),
      finalStandings: standings,
      champion: championship.champion,
      runnerUp: championship.runnerUp,
      playoffs: clone(post?.bracket || null),
      leagueAwards: awards,
      playoffMvpPlayerId: post?.playoffMvpPlayerId || null,
      leagueLeaders: leagueLeaders(),
      careerPlayer: player,
      careerTeamStanding: careerTeamStanding ? clone(careerTeamStanding) : null,
      travel: travelSnapshot(),
      syntheticDevFixture: readiness.syntheticDevFixture === true,
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
