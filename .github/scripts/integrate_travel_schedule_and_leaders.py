from pathlib import Path
import re

ROOT = Path('artifacts/project-ice/public')
CANON = ROOT / 'travel-hockey-canonical-ui.js'
ENGINE = ROOT / 'travel-hockey-tournament-engine.js'
GAME = ROOT / 'game.js'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected block for {label}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# 1) Travel stat leaders: four real categories (PTS, G, A, SV%) with Top 5.
# ---------------------------------------------------------------------------
canon = CANON.read_text()
start = canon.find('\n  function leaders(state) {')
end = canon.find('\n  function cleanupAdapter() {', start)
if start < 0 or end < 0:
    raise SystemExit(f'Could not locate Travel leaders block: start={start}, end={end}')

leaders_fn = r'''
  function travelLeaderName(player) {
    return String(
      player?.name ||
      player?.playerName ||
      [player?.firstName, player?.lastName].filter(Boolean).join(' ') ||
      'Unknown Player'
    );
  }

  function travelLeaderRows(state) {
    return (state.teams || [])
      .flatMap(team => (team.roster || []).map(player => ({ team, player, stats: player.travelStats || {} })))
      .filter(item => Number(item.stats.gp || 0) > 0);
  }

  function leaderColumn(state, title, statKey, options = {}) {
    const goalieOnly = options.goalie === true;
    const rows = travelLeaderRows(state)
      .filter(item => {
        const isGoalie = String(item.player?.position || '').trim().toUpperCase() === 'G';
        return goalieOnly ? isGoalie : !isGoalie;
      })
      .sort((a,b) => {
        const av = Number(a.stats?.[statKey] || 0);
        const bv = Number(b.stats?.[statKey] || 0);
        if (bv !== av) return bv - av;
        const ap = Number(a.stats?.pts || 0);
        const bp = Number(b.stats?.pts || 0);
        if (bp !== ap) return bp - ap;
        return travelLeaderName(a.player).localeCompare(travelLeaderName(b.player));
      })
      .slice(0,5);

    const formatValue = entry => {
      const value = Number(entry.stats?.[statKey] || 0);
      if (statKey === 'savePercentage') {
        return value > 0 ? value.toFixed(3).replace(/^0/, '') : '.000';
      }
      return String(value);
    };

    return `
      <section class="pi-travel-leader-col">
        <div class="pi-travel-leader-col__head">${esc(title)}</div>
        <div class="pi-travel-leader-col__body">
          ${rows.length ? rows.map((item,index) => `
            <button class="pi-travel-leader-row" type="button" data-player="${esc(item.player.playerId || item.player.sourcePlayerId || item.player.id || '')}" data-team="${esc(item.team.teamId)}">
              <span class="pi-travel-leader-row__rank">${index + 1}</span>
              <span class="pi-travel-leader-row__identity">
                <strong>${esc(travelLeaderName(item.player))}</strong>
                <small>${esc(travelTeamAbbr(item.team))}</small>
              </span>
              <span class="pi-travel-leader-row__value">${esc(formatValue(item))}</span>
            </button>`).join('') : '<div class="pi-travel-leader-col__empty">No stats yet</div>'}
        </div>
      </section>`;
  }

  function leaders(state) {
    const hasStats = travelLeaderRows(state).length > 0;
    if (!hasStats) return '<div class="pi-ts-empty">Travel leaders will populate as tournament games are played.</div>';
    return `
      <div class="pi-travel-leaders-scroll" aria-label="Travel tournament statistical leaders">
        <div class="pi-travel-leaders-grid">
          ${leaderColumn(state, 'Points', 'pts')}
          ${leaderColumn(state, 'Goals', 'g')}
          ${leaderColumn(state, 'Assists', 'a')}
          ${leaderColumn(state, 'Save %', 'savePercentage', { goalie:true })}
        </div>
      </div>`;
  }
'''
canon = canon[:start] + leaders_fn + canon[end:]

# Replace the old leader CSS with a four-column, horizontally scrollable leaders board.
old_css = ".pi-ts-leader{display:grid;grid-template-columns:28px minmax(0,1fr) 58px;gap:9px;align-items:center;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-leader__identity{min-width:0}.pi-ts-leader__identity>span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}.pi-ts-leader__identity small{display:block;margin-top:3px;color:#7186a1;font-size:8px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pi-ts-leader .v{text-align:right;font-weight:900;white-space:nowrap}"
new_css = ".pi-travel-leaders-scroll{overflow-x:auto;padding-bottom:5px;margin-inline:-2px;scrollbar-width:none}.pi-travel-leaders-scroll::-webkit-scrollbar{display:none}.pi-travel-leaders-grid{display:grid;grid-template-columns:repeat(4,minmax(145px,1fr));gap:9px;min-width:610px}.pi-travel-leader-col{border:1px solid rgba(111,177,255,.12);border-radius:14px;background:rgba(7,23,40,.72);overflow:hidden}.pi-travel-leader-col__head{padding:10px 10px 8px;border-bottom:1px solid rgba(255,255,255,.055);color:#8fbdf8;font-size:8px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.pi-travel-leader-col__body{padding:4px}.pi-travel-leader-row{width:100%;display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:center;padding:8px 6px;border:0;border-radius:9px;background:transparent;color:#eef4ff;text-align:left}.pi-travel-leader-row:nth-child(even){background:rgba(255,255,255,.025)}.pi-travel-leader-row__rank{color:#5f7898;font-size:8px;font-weight:900}.pi-travel-leader-row__identity{min-width:0}.pi-travel-leader-row__identity strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:850}.pi-travel-leader-row__identity small{display:block;margin-top:2px;color:#5f7898;font-size:7px;font-weight:850;letter-spacing:.06em}.pi-travel-leader-row__value{color:#f4f8ff;font-size:11px;font-weight:950;text-align:right}.pi-travel-leader-col__empty{padding:16px 8px;color:#617690;font-size:8px;text-align:center}"
canon = replace_once(canon, old_css, new_css, 'Travel leader CSS')
CANON.write_text(canon)

# ---------------------------------------------------------------------------
# 2) Travel goalie stat integrity + career schedule projection.
# ---------------------------------------------------------------------------
engine = ENGINE.read_text()
engine = replace_once(
    engine,
    "  const blankPlayerStats = () => ({gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,savePercentage:0});",
    "  const blankPlayerStats = () => ({gp:0,g:0,a:0,pts:0,pim:0,sog:0,wins:0,losses:0,shotsAgainst:0,saves:0,goalsAgainst:0,savePercentage:0});",
    'goalie stat schema'
)
engine = replace_once(
    engine,
    "    for (const p of skaters) p.travelStats.gp = Number(p.travelStats.gp || 0) + 1;\n    for (const p of (team.roster || []).filter(isGoalie)) p.travelStats.gp = Number(p.travelStats.gp || 0) + 1;",
    "    for (const p of skaters) p.travelStats.gp = Number(p.travelStats.gp || 0) + 1;",
    'goalie GP ownership'
)
engine = replace_once(
    engine,
    "    if (starterA) {\n      starterA.travelStats.savePercentage = Math.max(0, Math.min(0.999, (shotsB-bGoals)/shotsB));\n      if (winnerA) starterA.travelStats.wins += 1;\n    }\n    if (starterB) {\n      starterB.travelStats.savePercentage = Math.max(0, Math.min(0.999, (shotsA-aGoals)/shotsA));\n      if (!winnerA) starterB.travelStats.wins += 1;\n    }",
    "    if (starterA) {\n      starterA.travelStats.gp = Number(starterA.travelStats.gp || 0) + 1;\n      starterA.travelStats.shotsAgainst = Number(starterA.travelStats.shotsAgainst || 0) + shotsB;\n      starterA.travelStats.saves = Number(starterA.travelStats.saves || 0) + Math.max(0, shotsB - bGoals);\n      starterA.travelStats.goalsAgainst = Number(starterA.travelStats.goalsAgainst || 0) + bGoals;\n      starterA.travelStats.savePercentage = starterA.travelStats.shotsAgainst > 0\n        ? starterA.travelStats.saves / starterA.travelStats.shotsAgainst\n        : 0;\n      if (winnerA) starterA.travelStats.wins += 1;\n      else starterA.travelStats.losses = Number(starterA.travelStats.losses || 0) + 1;\n    }\n    if (starterB) {\n      starterB.travelStats.gp = Number(starterB.travelStats.gp || 0) + 1;\n      starterB.travelStats.shotsAgainst = Number(starterB.travelStats.shotsAgainst || 0) + shotsA;\n      starterB.travelStats.saves = Number(starterB.travelStats.saves || 0) + Math.max(0, shotsA - aGoals);\n      starterB.travelStats.goalsAgainst = Number(starterB.travelStats.goalsAgainst || 0) + aGoals;\n      starterB.travelStats.savePercentage = starterB.travelStats.shotsAgainst > 0\n        ? starterB.travelStats.saves / starterB.travelStats.shotsAgainst\n        : 0;\n      if (!winnerA) starterB.travelStats.wins += 1;\n      else starterB.travelStats.losses = Number(starterB.travelStats.losses || 0) + 1;\n    }",
    'cumulative goalie stats'
)

schedule_helpers = r'''

  function careerSeries(state) {
    const roundKey = state?.tournament?.activeRound || null;
    if (!roundKey || roundKey === 'complete') return null;
    const series = state?.tournament?.rounds?.[roundKey] || [];
    const playerTeamId = String(state?.playerTeamId || '');
    const match = series.find(item =>
      String(item?.teamAId || '') === playerTeamId ||
      String(item?.teamBId || '') === playerTeamId
    ) || null;
    return match ? { roundKey, series: match } : null;
  }

  function syncCareerTravelSchedule(state = travel()) {
    if (!state?.tournament || !Array.isArray(WorldEngine.state?.schedule)) return false;
    const schedule = WorldEngine.state.schedule;
    const active = careerSeries(state);

    // Keep completed Travel games as history, but never leave stale future games
    // from an eliminated/finished series in the canonical career schedule.
    const activeSeriesId = active?.series?.seriesId || null;
    WorldEngine.state.schedule = schedule.filter(event => {
      if (event?.travelTournament !== true) return true;
      if (event?.isCompleted === true || event?.completed === true || event?.played === true) return true;
      return activeSeriesId && String(event?.travelSeriesId || '') === String(activeSeriesId);
    });

    if (!active || state.tournament.status === 'complete') return true;

    const { roundKey, series } = active;
    if (!series.startDate) series.startDate = state.tournament.currentGameDate;
    const teamA = teamById(state, series.teamAId);
    const teamB = teamById(state, series.teamBId);
    if (!teamA || !teamB) return false;

    const completedGames = Array.isArray(series.games) ? series.games : [];
    const completedByNumber = new Map(completedGames.map(game => [Number(game.gameNumber || 0), game]));
    const roundLabel = ROUND_LABEL[roundKey] || 'Travel Tournament';

    for (let gameNumber = 1; gameNumber <= 3; gameNumber += 1) {
      const completedGame = completedByNumber.get(gameNumber) || null;
      const seriesAlreadyWon = Number(series.teamAWins || 0) >= 2 || Number(series.teamBWins || 0) >= 2;
      if (!completedGame && seriesAlreadyWon && gameNumber > Number(series.gamesPlayed || 0)) continue;

      const eventId = `travel-career-${series.seriesId}-g${gameNumber}`;
      const existing = WorldEngine.state.schedule.find(event => String(event?.eventId || event?.id || '') === eventId) || null;
      const date = completedGame?.date || addDays(series.startDate, (gameNumber - 1) * 2);
      const homeTeamId = gameNumber % 2 === 1 ? series.teamAId : series.teamBId;
      const awayTeamId = gameNumber % 2 === 1 ? series.teamBId : series.teamAId;
      const home = teamById(state, homeTeamId);
      const away = teamById(state, awayTeamId);
      const done = Boolean(completedGame);
      const event = {
        ...(existing || {}),
        id:eventId,
        eventId,
        gameId:eventId,
        type:'travel-game',
        travelTournament:true,
        travelRound:roundKey,
        travelSeriesId:series.seriesId,
        travelGameNumber:gameNumber,
        date,
        icon:'🏒',
        label:`${away?.name || 'Away'} at ${home?.name || 'Home'}`,
        shortLabel:`${away?.shortName || away?.name || 'Away'} at ${home?.shortName || home?.name || 'Home'}`,
        location:'Summer Travel Tournament',
        objective:`${roundLabel} · Best-of-3 · Game ${gameNumber}${gameNumber === 3 ? ' · If Necessary' : ''}`,
        homeTeamId,
        awayTeamId,
        careerTeamId:state.playerTeamId,
        isCareerEvent:true,
        isCompleted:done,
        completed:done,
        played:done,
        status:done ? 'final' : 'scheduled',
      };
      if (completedGame) {
        event.homeScore = String(homeTeamId) === String(completedGame.teamAId) ? completedGame.teamAScore : completedGame.teamBScore;
        event.awayScore = String(awayTeamId) === String(completedGame.teamAId) ? completedGame.teamAScore : completedGame.teamBScore;
        event.winnerTeamId = completedGame.winnerTeamId;
        event.completedAt = completedGame.date;
      }
      if (existing) Object.assign(existing, event);
      else WorldEngine.state.schedule.push(event);
    }

    WorldEngine.state.schedule.sort((a,b) => String(a?.date || '').localeCompare(String(b?.date || '')));
    return true;
  }
'''
anchor = "\n  function ensureTournamentProgression(options = {}) {"
if anchor not in engine:
    raise SystemExit('Could not locate ensureTournamentProgression anchor')
engine = engine.replace(anchor, schedule_helpers + anchor, 1)

engine = replace_once(
    engine,
    "    if (!t.currentGameDate) t.currentGameDate = addDays(current, 1);\n    if (options.save === true) WorldEngine.save?.();",
    "    if (!t.currentGameDate) t.currentGameDate = addDays(current, 1);\n    syncCareerTravelSchedule(state);\n    if (options.save === true) WorldEngine.save?.();",
    'schedule sync on ensure'
)
engine = replace_once(
    engine,
    "    if (finished) buildNextRound(state, round.key);\n    if (state.tournament.status !== 'complete') state.tournament.currentGameDate = addDays(date, 2);\n    WorldEngine.save?.();",
    "    if (finished) buildNextRound(state, round.key);\n    if (state.tournament.status !== 'complete') state.tournament.currentGameDate = addDays(date, 2);\n    syncCareerTravelSchedule(state);\n    WorldEngine.save?.();",
    'schedule sync after sim'
)
engine = replace_once(
    engine,
    "  WorldEngine.ensureTravelTournamentProgression = ensureTournamentProgression;\n  WorldEngine.simulateNextTravelTournamentDay = simulateNextTournamentDay;",
    "  WorldEngine.ensureTravelTournamentProgression = ensureTournamentProgression;\n  WorldEngine.syncCareerTravelSchedule = syncCareerTravelSchedule;\n  WorldEngine.simulateNextTravelTournamentDay = simulateNextTournamentDay;",
    'schedule API export'
)
ENGINE.write_text(engine)

# ---------------------------------------------------------------------------
# 3) Schedule/Home presentation: show travel-game as a Game, but keep it safely
# outside the HS game resolver until the dedicated Travel live-game bridge lands.
# ---------------------------------------------------------------------------
game = GAME.read_text()

game = replace_once(
    game,
    "    if (type === 'game') {\n      return 'Game';\n    }",
    "    if (type === 'game' || type === 'travel-game') {\n      return 'Game';\n    }",
    'upcoming Travel game label'
)
game = replace_once(
    game,
    "        String(event.type || '').toLowerCase() === 'game'\n          ? getScheduleGameIcon(event)\n          : event.icon || '';",
    "        ['game','travel-game'].includes(String(event.type || '').toLowerCase())\n          ? (event.icon || getScheduleGameIcon(event))\n          : event.icon || '';",
    'upcoming Travel game icon'
)

# Preserve type and travel metadata on Home calendar eventData.
game = replace_once(
    game,
    "            eventId:\n              scheduledEvent.eventId || 'open-day',\n            summaryScreen:\n              scheduledEvent.summaryScreen,",
    "            eventId:\n              scheduledEvent.eventId || 'open-day',\n            type:\n              scheduledEvent.type,\n            travelTournament:\n              scheduledEvent.travelTournament === true,\n            summaryScreen:\n              scheduledEvent.summaryScreen,",
    'Home event metadata'
)

# Current/future Travel schedule entries open the Travel hub for now rather than
# being accidentally consumed by the HS Season Engine. The next integration will
# replace this safe handoff with the real pregame/live-game route.
home_guard = """      const isFuture = selectedIndex > TODAY_INDEX;\n      const isCompleted = Boolean(d.isCompleted);\n\n      if (isCompleted) {"""
home_guard_new = """      const isFuture = selectedIndex > TODAY_INDEX;\n      const isCompleted = Boolean(d.isCompleted);\n\n      if (d.type === 'travel-game' || d.travelTournament === true) {\n        WorldEngine.openTravelHockeyHub?.();\n        return;\n      }\n\n      if (isCompleted) {"""
if home_guard not in game:
    # Current code may use aligned spacing from an older refresh; try broad regex.
    game, count = re.subn(
        r"(\s+const isFuture\s*=\s*selectedIndex > TODAY_INDEX;\s+const isCompleted\s*=\s*Boolean\(d\.isCompleted\);)(\s+if \(isCompleted\) \{)",
        r"\1\n\n      if (d.type === 'travel-game' || d.travelTournament === true) {\n        WorldEngine.openTravelHockeyHub?.();\n        return;\n      }\2",
        game,
        count=1,
    )
    if count != 1:
        raise SystemExit('Could not add Home Travel-game safety guard')
else:
    game = game.replace(home_guard, home_guard_new, 1)

# Schedule calendar action guard.
schedule_anchor = """const selectedEvent =\n  scheduleEvents.find(\n    event =>\n      String(event.date) ===\n      String(selectedDateKey)\n  ) ||\n  null;\n\n/*\n * Games should enter their normal pregame event screen first."""
schedule_new = """const selectedEvent =\n  scheduleEvents.find(\n    event =>\n      String(event.date) ===\n      String(selectedDateKey)\n  ) ||\n  null;\n\nif (selectedEvent?.type === 'travel-game' || selectedEvent?.travelTournament === true) {\n  WorldEngine.openTravelHockeyHub?.();\n  return;\n}\n\n/*\n * Games should enter their normal pregame event screen first."""
if schedule_anchor not in game:
    raise SystemExit('Could not add Schedule Travel-game safety guard')
game = game.replace(schedule_anchor, schedule_new, 1)

# Details button should also return to the Travel tournament rather than generic EventSystem.
details_anchor = """    if (!selectedEvent) return;\n\n    /*\n     * Completed career events reopen their permanently saved"""
details_new = """    if (!selectedEvent) return;\n\n    if (selectedEvent.type === 'travel-game' || selectedEvent.travelTournament === true) {\n      WorldEngine.openTravelHockeyHub?.();\n      return;\n    }\n\n    /*\n     * Completed career events reopen their permanently saved"""
if details_anchor not in game:
    raise SystemExit('Could not add Schedule details Travel-game guard')
game = game.replace(details_anchor, details_new, 1)

GAME.write_text(game)

print('Integrated four-category Travel leaders and safe Travel career schedule projection.')
