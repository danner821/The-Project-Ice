'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const SKATER_KEYS = [
    'gamesPlayed', 'goals', 'assists', 'points', 'plusMinus',
    'penaltyMinutes', 'shots', 'powerPlayGoals', 'powerPlayPoints',
    'shorthandedGoals', 'gameWinningGoals', 'minutesPlayed',
  ];

  const GOALIE_KEYS = [
    'gamesPlayed', 'gamesStarted', 'wins', 'losses', 'overtimeLosses',
    'shotsAgainst', 'saves', 'goalsAgainst', 'savePercentage',
    'goalsAgainstAverage', 'shutouts', 'minutesPlayed',
  ];

  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const idOf = player => String(player?.playerId || player?.id || '');
  const isGoalie = player => String(player?.position || '').toUpperCase() === 'G';

  function emptySkaterStats() {
    return {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      penaltyMinutes: 0,
      shots: 0,
      powerPlayGoals: 0,
      powerPlayPoints: 0,
      shorthandedGoals: 0,
      gameWinningGoals: 0,
      minutesPlayed: 0,
    };
  }

  function emptyGoalieStats() {
    return {
      gamesPlayed: 0,
      gamesStarted: 0,
      wins: 0,
      losses: 0,
      overtimeLosses: 0,
      shotsAgainst: 0,
      saves: 0,
      goalsAgainst: 0,
      savePercentage: 0,
      goalsAgainstAverage: 0,
      shutouts: 0,
      minutesPlayed: 0,
    };
  }

  function emptyForPlayer(player) {
    return isGoalie(player) ? emptyGoalieStats() : emptySkaterStats();
  }

  function completedPlayoffGames() {
    return (WorldEngine.state?.schedule || []).filter(event =>
      event?.isPlayoff === true &&
      event?.completed === true &&
      event?.played === true &&
      (event?.gameResult || event?.postgameSummary)
    );
  }

  function resultFor(event) {
    return event?.gameResult || event?.postgameSummary || null;
  }

  function addSkaterLine(target, line) {
    const dressed = line?.dressed !== false && number(line?.gamesPlayed || 1) > 0;
    if (dressed) target.gamesPlayed += 1;
    target.goals += Math.max(0, number(line?.goals));
    target.assists += Math.max(0, number(line?.assists));
    target.points = target.goals + target.assists;
    target.plusMinus += number(line?.plusMinus);
    target.penaltyMinutes += Math.max(0, number(line?.penaltyMinutes));
    target.shots += Math.max(0, number(line?.shots));
    target.powerPlayGoals += Math.max(0, number(line?.powerPlayGoals));
    target.powerPlayPoints += Math.max(0, number(line?.powerPlayPoints));
    target.shorthandedGoals += Math.max(0, number(line?.shorthandedGoals));
    target.gameWinningGoals += Math.max(0, number(line?.gameWinningGoals));
    target.minutesPlayed += Math.max(
      0,
      number(line?.minutesPlayed) || number(line?.timeOnIceSeconds) / 60,
    );
  }

  function addGoalieLine(target, line) {
    const gp = Math.max(0, number(line?.gamesPlayed));
    const minutes = Math.max(
      0,
      number(line?.minutesPlayed) || number(line?.timeOnIceSeconds) / 60,
    );

    target.gamesPlayed += gp || (minutes > 0 ? 1 : 0);
    target.gamesStarted += line?.started === true ? 1 : Math.max(0, number(line?.gamesStarted));
    target.wins += Math.max(0, number(line?.wins));
    target.losses += Math.max(0, number(line?.losses));
    target.overtimeLosses += Math.max(0, number(line?.overtimeLosses));
    target.shotsAgainst += Math.max(0, number(line?.shotsAgainst));
    target.saves += Math.max(0, number(line?.saves));
    target.goalsAgainst += Math.max(0, number(line?.goalsAgainst));
    target.shutouts += line?.shutout === true ? 1 : Math.max(0, number(line?.shutouts));
    target.minutesPlayed += minutes;

    target.savePercentage = target.shotsAgainst > 0
      ? target.saves / target.shotsAgainst
      : 0;
    target.goalsAgainstAverage = target.minutesPlayed > 0
      ? (target.goalsAgainst * 60) / target.minutesPlayed
      : 0;
  }

  function subtractStats(total, playoffs, goalie) {
    const result = goalie ? emptyGoalieStats() : emptySkaterStats();
    const additiveKeys = goalie
      ? GOALIE_KEYS.filter(key => !['savePercentage', 'goalsAgainstAverage'].includes(key))
      : SKATER_KEYS;

    additiveKeys.forEach(key => {
      result[key] = number(total?.[key]) - number(playoffs?.[key]);
      if (key !== 'plusMinus') result[key] = Math.max(0, result[key]);
    });

    if (goalie) {
      result.savePercentage = result.shotsAgainst > 0
        ? result.saves / result.shotsAgainst
        : 0;
      result.goalsAgainstAverage = result.minutesPlayed > 0
        ? (result.goalsAgainst * 60) / result.minutesPlayed
        : 0;
    } else {
      result.points = result.goals + result.assists;
    }

    return result;
  }

  function buildTeamPlayoffStats(games) {
    const teamStats = {};

    const ensure = teamId => {
      const key = String(teamId || '');
      if (!key) return null;
      if (!teamStats[key]) {
        teamStats[key] = {
          teamId: key,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          shotsFor: 0,
          shotsAgainst: 0,
          powerPlayGoals: 0,
          powerPlayOpportunities: 0,
        };
      }
      return teamStats[key];
    };

    games.forEach(event => {
      const result = resultFor(event);
      if (!result) return;
      const homeId = result.homeTeamId || result.home?.teamId || event.homeTeamId;
      const awayId = result.awayTeamId || result.away?.teamId || event.awayTeamId;
      const home = ensure(homeId);
      const away = ensure(awayId);
      if (!home || !away) return;

      const homeScore = number(result.home?.score ?? event.homeScore);
      const awayScore = number(result.away?.score ?? event.awayScore);
      const homeShots = number(result.home?.shots);
      const awayShots = number(result.away?.shots);

      home.gamesPlayed += 1;
      away.gamesPlayed += 1;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;
      home.shotsFor += homeShots;
      home.shotsAgainst += awayShots;
      away.shotsFor += awayShots;
      away.shotsAgainst += homeShots;
      home.powerPlayGoals += number(result.home?.powerPlayGoals);
      home.powerPlayOpportunities += number(result.home?.powerPlayOpportunities);
      away.powerPlayGoals += number(result.away?.powerPlayGoals);
      away.powerPlayOpportunities += number(result.away?.powerPlayOpportunities);

      const winner = String(result.winnerTeamId || event.winnerTeamId || '');
      if (winner === String(homeId)) {
        home.wins += 1;
        away.losses += 1;
      } else if (winner === String(awayId)) {
        away.wins += 1;
        home.losses += 1;
      }
    });

    return teamStats;
  }

  function rebuildHighSchoolPostseasonStats() {
    const games = completedPlayoffGames();
    const players = WorldEngine.getAllWorldPlayers?.() || [];
    const byPlayerId = new Map();

    players.forEach(player => {
      const id = idOf(player);
      if (!id) return;
      byPlayerId.set(id, player);
      player.postseasonStats = emptyForPlayer(player);
    });

    games.forEach(event => {
      const result = resultFor(event);
      if (!result) return;

      [result.home, result.away].forEach(teamResult => {
        if (!teamResult) return;

        (teamResult.skaters || []).forEach(line => {
          const player = byPlayerId.get(String(line?.playerId || ''));
          if (!player) return;
          if (!player.postseasonStats || isGoalie(player)) {
            player.postseasonStats = emptySkaterStats();
          }
          addSkaterLine(player.postseasonStats, line);
        });

        (teamResult.goalies || []).forEach(line => {
          const player = byPlayerId.get(String(line?.playerId || ''));
          if (!player) return;
          if (!player.postseasonStats || !isGoalie(player)) {
            player.postseasonStats = emptyGoalieStats();
          }
          addGoalieLine(player.postseasonStats, line);
        });
      });
    });

    const teamStats = buildTeamPlayoffStats(games);
    const state = WorldEngine.state;
    state.postseason = state.postseason || {};
    state.postseason.highSchool = state.postseason.highSchool || {};
    state.postseason.highSchool.statistics = {
      rebuiltAt: new Date().toISOString(),
      completedGameIds: games.map(event => event.gameId || event.eventId || event.id).filter(Boolean),
      teams: teamStats,
    };

    return {
      success: true,
      completedGames: games.length,
      players: players.length,
      teams: Object.keys(teamStats).length,
    };
  }

  function resolvePlayer(playerOrId) {
    if (playerOrId && typeof playerOrId === 'object') return playerOrId;
    return WorldEngine.getPlayerById?.(playerOrId) || null;
  }

  function getPlayerStatsByScope(playerOrId, scope = 'regularSeason') {
    const player = resolvePlayer(playerOrId);
    if (!player) return null;

    rebuildHighSchoolPostseasonStats();

    const playoffs = player.postseasonStats || emptyForPlayer(player);
    const season = player.seasonStats || emptyForPlayer(player);
    const normalized = String(scope || '').toLowerCase();

    if (normalized === 'playoffs' || normalized === 'postseason') {
      return structuredClone(playoffs);
    }

    if (normalized === 'total' || normalized === 'combined' || normalized === 'season') {
      return structuredClone(season);
    }

    return subtractStats(season, playoffs, isGoalie(player));
  }

  function getTeamStatsByScope(teamId, scope = 'regularSeason') {
    rebuildHighSchoolPostseasonStats();
    const team = WorldEngine.getTeamById?.(teamId);
    if (!team) return null;

    const playoff = WorldEngine.state?.postseason?.highSchool?.statistics?.teams?.[String(teamId)] || {
      teamId: String(teamId || ''), gamesPlayed: 0, wins: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, shotsFor: 0, shotsAgainst: 0,
      powerPlayGoals: 0, powerPlayOpportunities: 0,
    };

    const normalized = String(scope || '').toLowerCase();
    if (normalized === 'playoffs' || normalized === 'postseason') return structuredClone(playoff);

    return {
      teamId: team.teamId,
      wins: Math.max(0, number(team.wins) - number(playoff.wins)),
      losses: Math.max(0, number(team.losses) - number(playoff.losses)),
      overtimeLosses: Math.max(0, number(team.overtimeLosses)),
      goalsFor: Math.max(0, number(team.goalsFor) - number(playoff.goalsFor)),
      goalsAgainst: Math.max(0, number(team.goalsAgainst) - number(playoff.goalsAgainst)),
      points: Math.max(0, number(team.points) - number(playoff.wins) * 2),
    };
  }

  WorldEngine.rebuildHighSchoolPostseasonStats = rebuildHighSchoolPostseasonStats;
  WorldEngine.getPlayerStatsByScope = getPlayerStatsByScope;
  WorldEngine.getTeamStatsByScope = getTeamStatsByScope;
  WorldEngine.getHighSchoolPostseasonStatistics = () => {
    rebuildHighSchoolPostseasonStats();
    return WorldEngine.state?.postseason?.highSchool?.statistics || null;
  };

  const originalAdvanceToDate = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvanceToDate) {
    WorldEngine.advanceToDate = function(...args) {
      const result = originalAdvanceToDate(...args);
      rebuildHighSchoolPostseasonStats();
      return result;
    };
  }

  const originalFinalize = WorldEngine.finalizeLiveGameSimulation?.bind(WorldEngine);
  if (originalFinalize) {
    WorldEngine.finalizeLiveGameSimulation = function(...args) {
      const result = originalFinalize(...args);
      rebuildHighSchoolPostseasonStats();
      return result;
    };
  }

  rebuildHighSchoolPostseasonStats();
})();
