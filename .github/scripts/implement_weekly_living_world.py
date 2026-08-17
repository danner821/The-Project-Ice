from pathlib import Path
import re
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

helpers=r'''  function ensureLivingWorldState() {
    if (!_state.livingWorld || typeof _state.livingWorld !== 'object') {
      _state.livingWorld = {};
    }
    const state = _state.livingWorld;
    if (!Number.isFinite(Number(state.version))) state.version = 1;
    if (!Array.isArray(state.processedWeeks)) state.processedWeeks = [];
    if (!Array.isArray(state.weeklySnapshots)) state.weeklySnapshots = [];
    if (!Array.isArray(state.recentBeats)) state.recentBeats = [];
    return state;
  }

  function getWeekStartDate(dateString) {
    const date = parseDateKey(dateString);
    if (!date) return null;
    const copy = new Date(date.getTime());
    const day = copy.getUTCDay();
    copy.setUTCDate(copy.getUTCDate() - ((day + 6) % 7));
    return toDateKey(copy);
  }

  function getWeekEndDate(dateString) {
    const start = parseDateKey(getWeekStartDate(dateString));
    if (!start) return null;
    start.setUTCDate(start.getUTCDate() + 6);
    return toDateKey(start);
  }

  function getLivingWorldWeekKey(dateString) {
    const start = getWeekStartDate(dateString);
    return start ? `week:${start}` : null;
  }

  function getCareerPlayerFromWorldState(state = _state) {
    const playerId = state?.player?.playerId || state?.player?.id || 'career-player';
    for (const team of state?.teams || []) {
      const found = (team?.roster || []).find(player =>
        player?.isCareerPlayer === true ||
        String(player?.id || player?.playerId || '') === String(playerId)
      );
      if (found) return found;
    }
    return state?.player || null;
  }

  function getTeamStandingSnapshot(team) {
    const wins = Number(team?.wins) || 0;
    const losses = Number(team?.losses) || 0;
    const overtimeLosses = Number(team?.overtimeLosses) || 0;
    const points = Number.isFinite(Number(team?.points)) ? Number(team.points) : (wins * 2) + overtimeLosses;
    return {
      teamId: team?.teamId || null,
      teamName: `${team?.schoolName || ''} ${team?.teamName || ''}`.trim(),
      abbreviation: team?.abbreviation || '',
      wins,
      losses,
      overtimeLosses,
      points,
      goalsFor: Number(team?.goalsFor) || 0,
      goalsAgainst: Number(team?.goalsAgainst) || 0,
    };
  }

  function rankLivingWorldStandings(teams = _state?.teams || []) {
    return teams
      .map(getTeamStandingSnapshot)
      .sort((a, b) =>
        (b.points - a.points) ||
        (b.wins - a.wins) ||
        ((b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)) ||
        String(a.teamName).localeCompare(String(b.teamName))
      )
      .map((team, index) => ({ ...team, rank: index + 1 }));
  }

  function getCareerPlayerWeeklyStats(player, weekStart, weekEnd) {
    const stats = player?.stats || player?.seasonStats || {};
    const games = (_state?.season?.schedule || []).filter(game => {
      const gameDate = normalizeDateKey(game?.date);
      if (!gameDate || gameDate < weekStart || gameDate > weekEnd) return false;
      if (!(game?.played === true || game?.completed === true || game?.status === 'final')) return false;
      return String(game?.homeTeamId || '') === String(player?.teamId || '') ||
        String(game?.awayTeamId || '') === String(player?.teamId || '');
    });
    return {
      gamesPlayed: games.length,
      seasonGamesPlayed: Number(stats?.gamesPlayed) || 0,
      seasonGoals: Number(stats?.goals) || 0,
      seasonAssists: Number(stats?.assists) || 0,
      seasonPoints: Number(stats?.points) || 0,
      seasonPlusMinus: Number(stats?.plusMinus) || 0,
    };
  }

  function buildLivingWorldWeeklySnapshot(processedAtDate) {
    const weekStart = getWeekStartDate(processedAtDate);
    const weekEnd = getWeekEndDate(processedAtDate);
    const weekKey = getLivingWorldWeekKey(processedAtDate);
    if (!weekStart || !weekEnd || !weekKey) return null;

    const standings = rankLivingWorldStandings();
    const careerPlayer = getCareerPlayerFromWorldState();
    const careerTeamId = careerPlayer?.teamId || _state?.player?.teamId || null;
    const careerTeam = (_state?.teams || []).find(team => String(team?.teamId || '') === String(careerTeamId || '')) || null;
    const careerStanding = standings.find(team => String(team?.teamId || '') === String(careerTeamId || '')) || null;
    const livingWorld = ensureLivingWorldState();
    const prior = livingWorld.weeklySnapshots.length ? livingWorld.weeklySnapshots[livingWorld.weeklySnapshots.length - 1] : null;
    const priorCareerStanding = prior?.standings?.find(team => String(team?.teamId || '') === String(careerTeamId || '')) || null;

    const beats = [];
    if (careerTeam && careerStanding) {
      const rankDelta = priorCareerStanding ? Number(priorCareerStanding.rank) - Number(careerStanding.rank) : 0;
      beats.push({
        type: 'team_form',
        teamId: careerTeam.teamId,
        headline: `${careerTeam.schoolName || careerTeam.teamName} is ${careerStanding.rank} in the league`,
        detail: `${careerStanding.wins}-${careerStanding.losses}-${careerStanding.overtimeLosses}`,
        rank: careerStanding.rank,
        rankDelta,
      });
      if (rankDelta !== 0) {
        beats.push({
          type: 'standings_move',
          teamId: careerTeam.teamId,
          direction: rankDelta > 0 ? 'up' : 'down',
          places: Math.abs(rankDelta),
          fromRank: priorCareerStanding.rank,
          toRank: careerStanding.rank,
        });
      }
    }

    if (careerPlayer) {
      beats.push({
        type: 'player_context',
        playerId: careerPlayer.id || careerPlayer.playerId || 'career-player',
        overall: Number(careerPlayer.overall) || Number(_state?.player?.overall) || null,
        coachTrust: Number(careerPlayer.coachTrust ?? _state?.player?.coachTrust) || 0,
        lineupAssignment: careerPlayer.lineupAssignment || careerPlayer.rosterSlot || careerPlayer.startingLine || null,
        weeklyStats: getCareerPlayerWeeklyStats(careerPlayer, weekStart, weekEnd),
      });
    }

    return {
      weekKey,
      startDate: weekStart,
      endDate: weekEnd,
      processedAtDate: normalizeDateKey(processedAtDate),
      standings,
      leader: standings[0] || null,
      careerTeam: careerStanding,
      careerPlayer: careerPlayer ? {
        playerId: careerPlayer.id || careerPlayer.playerId || 'career-player',
        name: `${careerPlayer.firstName || _state?.player?.firstName || ''} ${careerPlayer.lastName || _state?.player?.lastName || ''}`.trim(),
        teamId: careerTeamId,
        position: careerPlayer.position || _state?.player?.position || '',
        overall: Number(careerPlayer.overall) || Number(_state?.player?.overall) || null,
        coachTrust: Number(careerPlayer.coachTrust ?? _state?.player?.coachTrust) || 0,
        lineupAssignment: careerPlayer.lineupAssignment || careerPlayer.rosterSlot || careerPlayer.startingLine || null,
        weeklyStats: getCareerPlayerWeeklyStats(careerPlayer, weekStart, weekEnd),
      } : null,
      beats,
    };
  }

  function processLivingWorldWeek(dateString) {
    const normalizedDate = normalizeDateKey(dateString);
    if (!normalizedDate) return null;
    const livingWorld = ensureLivingWorldState();
    const weekKey = getLivingWorldWeekKey(normalizedDate);
    if (!weekKey || livingWorld.processedWeeks.includes(weekKey)) {
      return livingWorld.weeklySnapshots.find(item => item?.weekKey === weekKey) || null;
    }
    const snapshot = buildLivingWorldWeeklySnapshot(normalizedDate);
    if (!snapshot) return null;
    livingWorld.processedWeeks.push(weekKey);
    livingWorld.weeklySnapshots.push(snapshot);
    livingWorld.recentBeats.push(...snapshot.beats.map(beat => ({ ...beat, weekKey, date: normalizedDate })));
    if (livingWorld.weeklySnapshots.length > 60) livingWorld.weeklySnapshots = livingWorld.weeklySnapshots.slice(-60);
    if (livingWorld.recentBeats.length > 120) livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);
    return snapshot;
  }

  function processLivingWorldForDate(dateString) {
    const normalizedDate = normalizeDateKey(dateString);
    const date = parseDateKey(normalizedDate);
    if (!date) return null;
    const livingWorld = ensureLivingWorldState();
    const shouldProcess = date.getUTCDay() === 1 || livingWorld.processedWeeks.length === 0;
    return shouldProcess ? processLivingWorldWeek(normalizedDate) : null;
  }

'''

if 'function ensureLivingWorldState()' not in s:
    match=re.search(r'(^[ \t]*(?:async[ \t]+)?function[ \t]+processSeasonDate\b)', s, re.M)
    if not match:
        raise SystemExit('processSeasonDate function not found')
    s=s[:match.start()]+helpers+s[match.start():]

# Integrate once into the central date processor by finding its processedDates push.
if 'processLivingWorldForDate(normalizedDate);' not in s:
    start=re.search(r'(?:async[ \t]+)?function[ \t]+processSeasonDate\b', s)
    if not start:
        raise SystemExit('processSeasonDate not found after helper insertion')
    tail=s[start.start():]
    push=re.search(r'[^\n]*processedDates\.push\(normalizedDate\);', tail)
    if not push:
        raise SystemExit('processedDates push not found inside processSeasonDate')
    absolute=start.start()+push.end()
    s=s[:absolute]+'\n\n    processLivingWorldForDate(normalizedDate);'+s[absolute:]

# Export public APIs immediately after processSeasonDate entry, independent of formatting.
if not re.search(r'\bensureLivingWorldState\s*,', s[s.rfind('return {'):]):
    # Use last occurrence of processSeasonDate, which is expected in public API object.
    matches=list(re.finditer(r'(^[ \t]*processSeasonDate\s*,)', s, re.M))
    if not matches:
        raise SystemExit('public processSeasonDate export not found')
    m=matches[-1]
    insertion=m.group(0)+'\n    ensureLivingWorldState,\n    processLivingWorldWeek,\n    processLivingWorldForDate,\n    getLivingWorldWeekKey,'
    s=s[:m.start()]+insertion+s[m.end():]

p.write_text(s)
print('implemented weekly living world foundation')
