from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

# 1) Add canonical game-beat recorder before career-player-specific performance lookup.
anchor="""  function getCareerPlayerGamePerformance(
    gameResult
  ) {
"""
block=r'''  function recordGameLivingWorldBeats(
    gameResult,
    skaterStatApplication = null,
    goalieStatApplication = null
  ) {
    if (!gameResult || typeof gameResult !== 'object') {
      return { success: false, recorded: 0, reason: 'invalid-game-result' };
    }

    const livingWorld = ensureLivingWorldState();
    const gameId = String(gameResult.gameId || gameResult.eventId || '');
    const date = normalizeLivingWorldDateKey(
      gameResult.date ||
      gameResult.gameDate ||
      _state?.season?.currentDate ||
      _state?.season?.lastProcessedDate
    );
    const weekKey = getLivingWorldWeekKey(date);

    if (!gameId || !date || !weekKey) {
      return { success: false, recorded: 0, reason: 'game-beat-identity-missing' };
    }

    if (!Array.isArray(livingWorld.gameBeatIds)) {
      livingWorld.gameBeatIds = [];
    }

    const existingIds = new Set(livingWorld.gameBeatIds.map(String));
    const beats = [];

    const addBeat = (id, beat) => {
      const safeId = String(id || '');
      if (!safeId || existingIds.has(safeId)) return false;
      existingIds.add(safeId);
      beats.push({
        ...beat,
        beatId: safeId,
        gameId,
        weekKey,
        date,
      });
      return true;
    };

    const getPlayer = playerId =>
      getPlayerById(playerId) || null;

    const getTeam = teamId =>
      getTeamById(teamId) || null;

    /*
     * Individual skater performances. These thresholds are intentionally high
     * enough that the feed celebrates standout games rather than every decent
     * night. The same rules apply to career and NPC players.
     */
    (skaterStatApplication?.appliedPlayers || []).forEach(line => {
      if (line?.applied !== true) return;
      const goals = Math.max(0, Number(line.goals) || 0);
      const assists = Math.max(0, Number(line.assists) || 0);
      const points = Math.max(0, Number(line.points) || goals + assists);
      const player = getPlayer(line.playerId);

      let performanceType = null;
      if (goals >= 4) performanceType = 'four_goal_game';
      else if (goals >= 3) performanceType = 'hat_trick';
      else if (points >= 5) performanceType = 'five_point_game';
      else if (points >= 4) performanceType = 'four_point_game';

      if (performanceType) {
        addBeat(
          `performance:${gameId}:${line.playerId}:${performanceType}`,
          {
            type: 'major_player_performance',
            playerId: line.playerId,
            teamId: player?.teamId || null,
            performanceType,
            goals,
            assists,
            points,
            shots: Math.max(0, Number(line.shots) || 0),
          }
        );
      }

      const stats = player?.seasonStats || {};
      const milestones = [
        ['goals', 10], ['goals', 20], ['goals', 30],
        ['assists', 15], ['assists', 25], ['assists', 40],
        ['points', 20], ['points', 30], ['points', 40], ['points', 50],
      ];

      milestones.forEach(([statKey, target]) => {
        const total = Math.max(0, Number(stats?.[statKey]) || 0);
        const gameIncrement = statKey === 'goals'
          ? goals
          : statKey === 'assists'
            ? assists
            : points;
        const before = Math.max(0, total - gameIncrement);
        if (before < target && total >= target) {
          addBeat(
            `milestone:${line.playerId}:${statKey}:${target}:${_state?.season?.seasonId || _state?.season?.year || 'season'}`,
            {
              type: 'season_stat_milestone',
              playerId: line.playerId,
              teamId: player?.teamId || null,
              statKey,
              target,
              total,
            }
          );
        }
      });
    });

    /* Goaltender spotlight performances and shutout milestones. */
    (goalieStatApplication?.appliedGoalies || []).forEach(line => {
      if (line?.applied !== true || Number(line.gamesPlayed) <= 0) return;
      const shotsAgainst = Math.max(0, Number(line.shotsAgainst) || 0);
      const saves = Math.max(0, Number(line.saves) || 0);
      const goalsAgainst = Math.max(0, Number(line.goalsAgainst) || 0);
      const savePercentage = shotsAgainst > 0 ? saves / shotsAgainst : 0;
      const shutout = Number(line.shutouts) > 0 || goalsAgainst === 0;
      const player = getPlayer(line.playerId);

      let performanceType = null;
      if (shutout && saves >= 30) performanceType = 'thirty_save_shutout';
      else if (saves >= 40 && savePercentage >= 0.930) performanceType = 'forty_save_gem';
      else if (saves >= 35 && savePercentage >= 0.950) performanceType = 'goalie_masterclass';

      if (performanceType) {
        addBeat(
          `goalie-performance:${gameId}:${line.playerId}:${performanceType}`,
          {
            type: 'major_goalie_performance',
            playerId: line.playerId,
            teamId: player?.teamId || null,
            performanceType,
            saves,
            shotsAgainst,
            goalsAgainst,
            savePercentage: Number(savePercentage.toFixed(3)),
            shutout,
          }
        );
      }

      const seasonShutouts = Math.max(0, Number(player?.seasonStats?.shutouts) || 0);
      [3, 5, 8].forEach(target => {
        const before = Math.max(0, seasonShutouts - (shutout ? 1 : 0));
        if (before < target && seasonShutouts >= target) {
          addBeat(
            `goalie-milestone:${line.playerId}:shutouts:${target}:${_state?.season?.seasonId || _state?.season?.year || 'season'}`,
            {
              type: 'season_stat_milestone',
              playerId: line.playerId,
              teamId: player?.teamId || null,
              statKey: 'shutouts',
              target,
              total: seasonShutouts,
            }
          );
        }
      });
    });

    /*
     * Major game context. Rivalry / Game of the Week / Prospect Clash results
     * are worth remembering, but ordinary results remain box-score-only.
     */
    const context = gameResult.context || {};
    const specialText = [
      context.specialGameType,
      context.milestoneType,
      gameResult.specialGameType,
      gameResult.milestoneType,
      gameResult.title,
      gameResult.label,
    ].filter(Boolean).join(' ').toLowerCase();

    const isProspectClash = Boolean(
      context.isTopProspectClash ||
      gameResult.isTopProspectClash ||
      /top\s*prospect|prospect\s*clash/.test(specialText)
    );
    const isRivalry = Boolean(context.isRivalry || gameResult.isRivalry);
    const isGameOfWeek = Boolean(context.isGameOfWeek || gameResult.isGameOfWeek);

    if (isProspectClash || isRivalry || isGameOfWeek) {
      const homeScore = Math.max(0, Number(gameResult.home?.score ?? gameResult.homeScore) || 0);
      const awayScore = Math.max(0, Number(gameResult.away?.score ?? gameResult.awayScore) || 0);
      addBeat(
        `featured-result:${gameId}`,
        {
          type: 'featured_game_result',
          homeTeamId: gameResult.home?.teamId || gameResult.homeTeamId || null,
          awayTeamId: gameResult.away?.teamId || gameResult.awayTeamId || null,
          winnerTeamId: gameResult.winnerTeamId || null,
          homeScore,
          awayScore,
          isProspectClash,
          isRivalry,
          isGameOfWeek,
          scoutsAttending: Math.max(0, Number(context.scoutsAttending) || 0),
        }
      );
    }

    if (beats.length > 0) {
      livingWorld.recentBeats.push(...beats);
      livingWorld.recentBeats = livingWorld.recentBeats.slice(-160);
    }
    livingWorld.gameBeatIds = Array.from(existingIds).slice(-500);

    return {
      success: true,
      recorded: beats.length,
      reason: beats.length ? 'game-living-world-beats-recorded' : 'no-major-game-beats',
      beats,
    };
  }

'''
if anchor not in s: raise SystemExit('career performance anchor missing')
if 'function recordGameLivingWorldBeats' not in s:
    s=s.replace(anchor,block+anchor,1)

# 2) Record beats after full league stat application succeeds, before career-only progression.
anchor2="""          /*
           * Find the career player in this game's box score.
           * NPC-only games correctly continue without creating
           * a progression package.
           */
          const careerPerformance =
"""
insert2="""          /*
           * Feed major performances and featured results into the canonical
           * Living World before any career-player-only progression branch.
           * NPC games therefore create the same world consequences.
           */
          const livingWorldGameBeats =
            recordGameLivingWorldBeats(
              result.gameResult,
              skaterStatApplication,
              goalieStatApplication
            );

          /*
           * Find the career player in this game's box score.
           * NPC-only games correctly continue without creating
           * a progression package.
           */
          const careerPerformance =
"""
if anchor2 not in s: raise SystemExit('game application hook anchor missing')
s=s.replace(anchor2,insert2,1)

# 3) Make news consume pending unpublished beats up to processing date, not only exact week.
old="""    const weekBeats = (livingWorld.recentBeats || []).filter(beat =>
      String(beat?.weekKey || '') === String(weekKey)
    );
"""
new="""    const weekBeats = (livingWorld.recentBeats || []).filter(beat => {
      const beatDate = normalizeLivingWorldDateKey(beat?.date);
      return !beatDate || beatDate <= normalizedDate;
    });
"""
if old not in s: raise SystemExit('weekBeats exact-week anchor missing')
s=s.replace(old,new,1)

# 4) Extend beat-to-headline translation after potential updates loop.
anchor4="""    weekBeats.forEach((beat, index) => {
      if (beat?.type === 'potential_update') {
        const player = getPlayer(beat.playerId);
        const role =
          beat.potentialRoleAfter ||
          beat.newRole ||
          beat.roleAfter ||
          player?.development?.potentialRole ||
          player?.potentialRole ||
          'a new projection';
        const direction = Number(beat.change || beat.potentialChange || 0);
        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
          `potential:${weekKey}:${beat.playerId || index}:${role}`,
          'SCOUTING',
          `${playerName(player)}'s potential is ${verb} ${role}.`
        );
      }
    });
"""
new4=anchor4+r'''

    weekBeats.forEach((beat, index) => {
      const player = getPlayer(beat?.playerId);

      if (beat?.type === 'major_player_performance') {
        const goals = Math.max(0, Number(beat.goals) || 0);
        const assists = Math.max(0, Number(beat.assists) || 0);
        const points = Math.max(0, Number(beat.points) || goals + assists);
        const headline = goals >= 4
          ? `${playerName(player)} erupts for ${goals} goals in a dominant performance.`
          : goals >= 3
            ? `${playerName(player)} records a hat trick in a ${points}-point night.`
            : `${playerName(player)} puts up ${points} points in a breakout performance.`;
        publishOnce(
          beat.beatId || `major-performance:${beat.gameId || weekKey}:${beat.playerId || index}`,
          'PERFORMANCE',
          headline
        );
      }

      if (beat?.type === 'major_goalie_performance') {
        const saves = Math.max(0, Number(beat.saves) || 0);
        const headline = beat.shutout
          ? `${playerName(player)} turns aside ${saves} shots in a statement shutout.`
          : `${playerName(player)} delivers a ${saves}-save performance between the pipes.`;
        publishOnce(
          beat.beatId || `goalie-performance:${beat.gameId || weekKey}:${beat.playerId || index}`,
          'PERFORMANCE',
          headline
        );
      }

      if (beat?.type === 'season_stat_milestone') {
        const labels = {
          goals: 'goals',
          assists: 'assists',
          points: 'points',
          shutouts: 'shutouts',
        };
        const label = labels[beat.statKey] || beat.statKey || 'milestone';
        publishOnce(
          beat.beatId || `milestone:${beat.playerId || index}:${beat.statKey}:${beat.target}`,
          'MILESTONE',
          `${playerName(player)} reaches ${beat.target} ${label} on the season.`
        );
      }

      if (beat?.type === 'featured_game_result') {
        const home = getTeam(beat.homeTeamId);
        const away = getTeam(beat.awayTeamId);
        const winner = getTeam(beat.winnerTeamId);
        const contextLabel = beat.isProspectClash
          ? 'Top Prospect Clash'
          : beat.isRivalry
            ? 'rivalry matchup'
            : 'Game of the Week';
        const score = `${Math.max(0, Number(beat.awayScore) || 0)}-${Math.max(0, Number(beat.homeScore) || 0)}`;
        publishOnce(
          beat.beatId || `featured-result:${beat.gameId || index}`,
          beat.isProspectClash ? 'PROSPECTS' : 'LEAGUE',
          `${teamName(winner)} wins the ${contextLabel} as ${teamName(away)} and ${teamName(home)} finish ${score}.`
        );
      }
    });
'''
if anchor4 not in s: raise SystemExit('potential-news loop anchor missing')
s=s.replace(anchor4,new4,1)

p.write_text(s)
print('added major game Living World beats, milestones, and reliable pending-beat news consumption')
