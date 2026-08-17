from pathlib import Path
import re

p = Path('artifacts/project-ice/public/world.js')
s = p.read_text()

helpers = r'''  function normalizeLivingWorldDateKey(value) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (value && typeof value === 'object') {
      const year = Number(value.year);
      const month = Number(value.month);
      const day = Number(value.day);

      if (year && month && day) {
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    return null;
  }

  function livingWorldDateFromKey(value) {
    const key = normalizeLivingWorldDateKey(value);
    if (!key) return null;

    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function livingWorldDateKeyFromDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

    return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function ensureLivingWorldState() {
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
    const date = livingWorldDateFromKey(dateString);
    if (!date) return null;

    const copy = new Date(date.getTime());
    const day = copy.getUTCDay();
    copy.setUTCDate(copy.getUTCDate() - ((day + 6) % 7));

    return livingWorldDateKeyFromDate(copy);
  }

  function getWeekEndDate(dateString) {
    const start = livingWorldDateFromKey(getWeekStartDate(dateString));
    if (!start) return null;

    start.setUTCDate(start.getUTCDate() + 6);
    return livingWorldDateKeyFromDate(start);
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
    const standing = (_state?.standings || []).find(item =>
      String(item?.teamId || '') === String(team?.teamId || '')
    ) || {};

    const wins = Number(standing?.wins ?? team?.wins) || 0;
    const losses = Number(standing?.losses ?? team?.losses) || 0;
    const overtimeLosses = Number(
      standing?.overtimeLosses ??
      standing?.otl ??
      team?.overtimeLosses ??
      team?.otl
    ) || 0;

    const pointsValue = standing?.points ?? team?.points;
    const points = Number.isFinite(Number(pointsValue))
      ? Number(pointsValue)
      : (wins * 2) + overtimeLosses;

    return {
      teamId: team?.teamId || null,
      teamName: `${team?.schoolName || ''} ${team?.teamName || ''}`.trim(),
      abbreviation: team?.abbreviation || '',
      wins,
      losses,
      overtimeLosses,
      points,
      goalsFor: Number(standing?.goalsFor ?? team?.goalsFor) || 0,
      goalsAgainst: Number(standing?.goalsAgainst ?? team?.goalsAgainst) || 0,
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
    const seasonSchedule = Array.isArray(_state?.season?.schedule)
      ? _state.season.schedule
      : (Array.isArray(_state?.schedule) ? _state.schedule : []);

    const games = seasonSchedule.filter(game => {
      const gameDate = normalizeLivingWorldDateKey(game?.date);
      if (!gameDate || gameDate < weekStart || gameDate > weekEnd) return false;
      if (!(game?.played === true || game?.completed === true || game?.status === 'final')) return false;

      return String(game?.homeTeamId || '') === String(player?.teamId || '') ||
        String(game?.awayTeamId || '') === String(player?.teamId || '');
    });

    return {
      gamesPlayed: games.length,
      seasonGamesPlayed: Number(stats?.gamesPlayed ?? stats?.gp) || 0,
      seasonGoals: Number(stats?.goals ?? stats?.g) || 0,
      seasonAssists: Number(stats?.assists ?? stats?.a) || 0,
      seasonPoints: Number(stats?.points ?? stats?.pts) || 0,
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
    const careerTeam = (_state?.teams || []).find(team =>
      String(team?.teamId || '') === String(careerTeamId || '')
    ) || null;
    const careerStanding = standings.find(team =>
      String(team?.teamId || '') === String(careerTeamId || '')
    ) || null;
    const livingWorld = ensureLivingWorldState();
    const prior = livingWorld.weeklySnapshots.length
      ? livingWorld.weeklySnapshots[livingWorld.weeklySnapshots.length - 1]
      : null;
    const priorCareerStanding = prior?.standings?.find(team =>
      String(team?.teamId || '') === String(careerTeamId || '')
    ) || null;

    const beats = [];

    if (careerTeam && careerStanding) {
      const careerTeamLabel = `${careerTeam.schoolName || ''} ${careerTeam.teamName || ''}`.trim();
      const rankDelta = priorCareerStanding
        ? Number(priorCareerStanding.rank) - Number(careerStanding.rank)
        : 0;

      beats.push({
        type: 'team_form',
        teamId: careerTeam.teamId,
        headline: `${careerTeamLabel || 'Your team'} is ${careerStanding.rank} in the league`,
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
      processedAtDate: normalizeLivingWorldDateKey(processedAtDate),
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
    const normalizedDate = normalizeLivingWorldDateKey(dateString);
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
    livingWorld.recentBeats.push(
      ...snapshot.beats.map(beat => ({ ...beat, weekKey, date: normalizedDate }))
    );

    if (livingWorld.weeklySnapshots.length > 60) {
      livingWorld.weeklySnapshots = livingWorld.weeklySnapshots.slice(-60);
    }

    if (livingWorld.recentBeats.length > 120) {
      livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);
    }

    return snapshot;
  }

  function processLivingWorldForDate(dateString) {
    const normalizedDate = normalizeLivingWorldDateKey(dateString);
    const date = livingWorldDateFromKey(normalizedDate);
    if (!date) return null;

    const livingWorld = ensureLivingWorldState();
    const shouldProcess = date.getUTCDay() === 1 || livingWorld.processedWeeks.length === 0;

    return shouldProcess ? processLivingWorldWeek(normalizedDate) : null;
  }

'''

if 'function ensureLivingWorldState()' not in s:
    match = re.search(r'(^[ \t]*(?:async[ \t]+)?function[ \t]+processSeasonDate\b)', s, re.M)
    if not match:
        raise SystemExit('processSeasonDate function not found')
    s = s[:match.start()] + helpers + s[match.start():]

if 'processLivingWorldForDate(dateString);' not in s:
    pattern = re.compile(r'(\n[ \t]*_state\.season\.lastProcessedDate\s*=\s*\n[ \t]*dateString;\s*\n)(\s*if \(options\.save !== false\) \{)')
    s, count = pattern.subn(r'\1\n    processLivingWorldForDate(dateString);\n\n\2', s, count=1)
    if count != 1:
        raise SystemExit('lastProcessedDate integration anchor missing')

if 'livingWorld:' not in s:
    anchor = re.compile(r'([ \t]*prospectRankings:\s*\[\],[^\n]*\n)')
    replacement = r'''\1
      livingWorld: {
        version: 1,
        processedWeeks: [],
        weeklySnapshots: [],
        recentBeats: [],
      },
'''
    s, count = anchor.subn(replacement, s, count=1)
    if count != 1:
        raise SystemExit('buildDefaults living world anchor missing')

# Expose the weekly living-world hooks beside the public date processor when available.
if 'processLivingWorldWeek,' not in s:
    matches = list(re.finditer(r'(^[ \t]*processSeasonDate\s*,\s*$)', s, re.M))
    if matches:
        m = matches[-1]
        insertion = m.group(0) + '\n    ensureLivingWorldState,\n    processLivingWorldWeek,\n    processLivingWorldForDate,\n    getLivingWorldWeekKey,'
        s = s[:m.start()] + insertion + s[m.end():]
    else:
        print('warning: public processSeasonDate export not found; helpers remain internal')

p.write_text(s)
print('implemented weekly living world foundation')
