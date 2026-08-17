from pathlib import Path
import re
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

helpers=r'''
  function getScoutingInterestLevel(rank, gamesObserved = 0) {
    const safeRank = Number(rank) || 999;
    const observed = Number(gamesObserved) || 0;

    if (safeRank <= 20 && observed >= 3) return 'High';
    if (safeRank <= 50 && observed >= 2) return 'Moderate';
    if (safeRank <= 100 || observed >= 1) return 'Low';
    return 'None';
  }

  function getScoutingEvaluationAccuracy(gamesObserved = 0) {
    const observed = Number(gamesObserved) || 0;
    if (observed >= 8) return 'High';
    if (observed >= 3) return 'Medium';
    return 'Low';
  }

  function getScoutingPlayerStats(player = {}) {
    const stats = player.stats || player.seasonStats || {};
    const gp = Number(stats.gamesPlayed ?? stats.gp) || 0;
    const goals = Number(stats.goals ?? stats.g) || 0;
    const assists = Number(stats.assists ?? stats.a) || 0;
    const points = Number(stats.points ?? stats.pts) || (goals + assists);
    return { gp, goals, assists, points };
  }

  function calculateWeeklyScoutingScore(player = {}) {
    const overall = Number(player.overall) || 50;
    const potential = Number(
      player.development?.potential ??
      player.potential ??
      overall
    ) || overall;
    const stats = getScoutingPlayerStats(player);
    const pointsPerGame = stats.gp > 0 ? stats.points / stats.gp : 0;
    const coachTrust = Number(player.coachTrust) || 50;
    const reputation = Number(player.reputationPoints) ||
      ((Number(player.reputationStars) || 1) * 20);

    return Number((
      overall * 0.48 +
      potential * 0.28 +
      Math.min(20, pointsPerGame * 10) * 0.10 +
      Math.min(100, reputation) * 0.09 +
      Math.min(100, coachTrust) * 0.05
    ).toFixed(3));
  }

  function getScoutedGamesForPlayer(player, weekStart, weekEnd) {
    const schedule = Array.isArray(_state?.season?.schedule)
      ? _state.season.schedule
      : (Array.isArray(_state?.schedule) ? _state.schedule : []);

    return schedule.filter(game => {
      const gameDate = normalizeLivingWorldDateKey(game?.date);
      if (!gameDate || gameDate < weekStart || gameDate > weekEnd) return false;
      if (!(game?.played === true || game?.completed === true || game?.status === 'final')) return false;
      if ((Number(game?.scoutsAttending) || 0) <= 0) return false;
      return String(game?.homeTeamId || '') === String(player?.teamId || '') ||
        String(game?.awayTeamId || '') === String(player?.teamId || '');
    });
  }

  function processScoutingWeek(dateString) {
    const normalizedDate = normalizeLivingWorldDateKey(dateString);
    const weekStart = getWeekStartDate(normalizedDate);
    const weekEnd = getWeekEndDate(normalizedDate);
    const weekKey = getLivingWorldWeekKey(normalizedDate);

    if (!normalizedDate || !weekStart || !weekEnd || !weekKey) {
      return { success: false, processed: false, reason: 'invalid-scouting-week' };
    }

    const players = (_state?.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : []).map(player => {
        ensureCanonicalPlayerContract(player);
        return player;
      })
    );

    if (players.length === 0) {
      _state.prospectRankings = [];
      return { success: true, processed: true, reason: 'no-scouting-players', rankings: [] };
    }

    const ranked = players
      .map(player => ({
        player,
        playerId: player.id || player.playerId || null,
        score: calculateWeeklyScoutingScore(player),
      }))
      .sort((a, b) =>
        (b.score - a.score) ||
        ((Number(b.player?.overall) || 0) - (Number(a.player?.overall) || 0)) ||
        String(b.playerId || '').localeCompare(String(a.playerId || ''))
      );

    const changes = [];

    ranked.forEach((entry, index) => {
      const player = entry.player;
      const profile = player.scoutingProfile || (player.scoutingProfile = createDefaultScoutingProfile());
      const newRank = index + 1;
      const previousRank = Number(profile.publicRank) || null;
      const scoutedGames = getScoutedGamesForPlayer(player, weekStart, weekEnd);
      const additionalObserved = scoutedGames.length;
      const priorInterest = profile.interestLevel || 'None';

      profile.previousRank = previousRank;
      profile.publicRank = newRank;
      profile.rankChange = previousRank ? previousRank - newRank : 0;
      profile.lastRankedWeek = weekKey;
      profile.gamesObserved = (Number(profile.gamesObserved) || 0) + additionalObserved;
      profile.evaluationAccuracy = getScoutingEvaluationAccuracy(profile.gamesObserved);
      profile.interestLevel = getScoutingInterestLevel(newRank, profile.gamesObserved);

      if (additionalObserved > 0) {
        profile.scoutingHistory.push({
          type: 'games-observed',
          weekKey,
          startDate: weekStart,
          endDate: weekEnd,
          gamesObserved: additionalObserved,
          totalGamesObserved: profile.gamesObserved,
          rank: newRank,
        });
      }

      if (previousRank !== newRank || priorInterest !== profile.interestLevel || additionalObserved > 0) {
        changes.push({
          playerId: entry.playerId,
          previousRank,
          newRank,
          rankChange: profile.rankChange,
          interestBefore: priorInterest,
          interestAfter: profile.interestLevel,
          gamesObserved: additionalObserved,
        });
      }
    });

    _state.prospectRankings = ranked.map((entry, index) => ({
      rank: index + 1,
      playerId: entry.playerId,
      teamId: entry.player?.teamId || null,
      firstName: entry.player?.firstName || '',
      lastName: entry.player?.lastName || '',
      position: entry.player?.position || '',
      overall: Number(entry.player?.overall) || 0,
      potential: Number(entry.player?.development?.potential ?? entry.player?.potential) || 0,
      score: entry.score,
      interestLevel: entry.player?.scoutingProfile?.interestLevel || 'None',
      rankChange: Number(entry.player?.scoutingProfile?.rankChange) || 0,
      weekKey,
    }));

    const careerPlayer = getCareerPlayerFromWorldState();
    const careerId = String(careerPlayer?.id || careerPlayer?.playerId || 'career-player');
    const careerChange = changes.find(change => String(change.playerId || '') === careerId) || null;
    const livingWorld = ensureLivingWorldState();

    if (careerChange) {
      livingWorld.recentBeats.push({
        type: 'scouting_update',
        weekKey,
        date: normalizedDate,
        ...careerChange,
      });
      if (livingWorld.recentBeats.length > 120) {
        livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);
      }
    }

    return {
      success: true,
      processed: true,
      reason: 'weekly-scouting-processed',
      weekKey,
      rankings: _state.prospectRankings,
      changes,
      careerChange,
    };
  }

'''

if 'function processScoutingWeek(' not in s:
    anchor='  function buildLivingWorldWeeklySnapshot(processedAtDate) {'
    idx=s.find(anchor)
    if idx<0: raise SystemExit('living world snapshot anchor missing')
    s=s[:idx]+helpers+s[idx:]

if 'processScoutingWeek(normalizedDate);' not in s:
    needle='''    const snapshot = buildLivingWorldWeeklySnapshot(normalizedDate);'''
    repl='''    processScoutingWeek(normalizedDate);\n\n    const snapshot = buildLivingWorldWeeklySnapshot(normalizedDate);'''
    if needle not in s: raise SystemExit('living world week integration anchor missing')
    s=s.replace(needle,repl,1)

# Expose scouting processor beside living world exports if public export exists.
if 'processScoutingWeek,' not in s:
    matches=list(re.finditer(r'(^[ \t]*processLivingWorldWeek\s*,\s*$)',s,re.M))
    if matches:
        m=matches[-1]
        s=s[:m.end()]+'\n    processScoutingWeek,'+s[m.end():]
    else:
        print('warning: processLivingWorldWeek public export not found')

p.write_text(s)
print('implemented weekly scouting engine')
