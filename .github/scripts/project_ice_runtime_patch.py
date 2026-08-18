from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text(encoding='utf-8')
world = WORLD.read_text(encoding='utf-8')

# 1) POSTGAME ORIGIN
# A game launched from Home should return Home after the postgame summary.
# Schedule remains the safe fallback for games launched anywhere else.
old_route = """      /*
       * Route first. A non-critical refresh failure should never strand
       * the player on the completed-game screen with a dead Continue button.
       * openHubTab('schedule') already refreshes and renders Schedule.
       */
      openHubTab(
        'schedule'
      );

      try {
        refreshCareerUI();
"""
new_route = """      /*
       * Return to the tab that launched the game. Home-launched games return
       * Home; Schedule remains the fallback for every other launch path.
       */
      const returnOrigin =
        EventSystem.getOrigin();

      if (returnOrigin === 'hub') {
        openHubTab('home');
      } else {
        openHubTab('schedule');
      }

      try {
        refreshCareerUI();
"""

if old_route in game:
    game = game.replace(old_route, new_route, 1)
elif "const returnOrigin =\n        EventSystem.getOrigin();" not in game:
    raise SystemExit('postgame origin anchor not found')

# 2) POTENTIAL NEWS
# Never describe a stable evaluation as an upgrade. A potential headline is
# only warranted when the numeric potential changed AND that change moved the
# player into a different visible potential role/tier.
potential_old = """        const direction = Number(beat.change || beat.potentialChange || 0);
        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
"""
potential_new = """        const direction = Number(beat.change || beat.potentialChange || 0);
        const previousRole =
          beat.potentialRoleBefore ||
          beat.oldRole ||
          beat.roleBefore ||
          null;

        if (
          direction === 0 ||
          (previousRole && previousRole === role)
        ) {
          return;
        }

        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
"""

if potential_old in world:
    world = world.replace(potential_old, potential_new)
elif "direction === 0 ||" not in world:
    raise SystemExit('potential news anchor not found')

# 3) WEEKLY PROSPECT RANKING INERTIA
# The raw weekly scouting score still matters, but public rankings should not
# reset from scratch every seven days. Blend the old public rank with the new
# raw rank so sustained evidence moves players while one noisy week does not.
rank_old = """    const ranked = players
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
"""
rank_new = """    const rawRanked = players
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

    const rawRankByPlayerId =
      new Map(
        rawRanked.map((entry, index) => [
          String(entry.playerId || ''),
          index + 1,
        ])
      );

    const ranked = rawRanked
      .map(entry => {
        const rawRank =
          rawRankByPlayerId.get(
            String(entry.playerId || '')
          ) || 999;

        const previousRank =
          Number(
            entry.player?.scoutingProfile?.publicRank
          ) || 0;

        return {
          ...entry,
          stabilizedRankScore:
            previousRank > 0
              ? (
                  previousRank * 0.72 +
                  rawRank * 0.28
                )
              : rawRank,
        };
      })
      .sort((a, b) =>
        (a.stabilizedRankScore - b.stabilizedRankScore) ||
        (b.score - a.score) ||
        String(a.playerId || '').localeCompare(String(b.playerId || ''))
      );

    const changes = [];
"""

if rank_old in world:
    world = world.replace(rank_old, rank_new, 1)
elif 'const rawRanked = players' not in world:
    raise SystemExit('weekly prospect ranking anchor not found')

# 4) PROSPECT MOVEMENT NEWS
# Keep ranking movement available in the actual rankings screen, but make the
# news feed selective: max three meaningful prospect-movement headlines each
# week, with a generic big move requiring at least ten spots.
news_loop_old = """    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;

      const previousRank = rank + change;
      const bigMove = Math.abs(change) >= 8;
"""
news_loop_new = """    let prospectMovementHeadlines = 0;
    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;
      if (prospectMovementHeadlines >= 3) return;

      const previousRank = rank + change;
      const bigMove = Math.abs(change) >= 10;
"""

if news_loop_old in world:
    world = world.replace(news_loop_old, news_loop_new, 1)
elif 'let prospectMovementHeadlines = 0;' not in world:
    raise SystemExit('prospect movement news loop anchor not found')

threshold_old = """      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      const player = getPlayer(entry.playerId);
"""
threshold_new = """      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      prospectMovementHeadlines += 1;

      const player = getPlayer(entry.playerId);
"""

if threshold_old in world:
    world = world.replace(threshold_old, threshold_new, 1)
elif 'prospectMovementHeadlines += 1;' not in world:
    raise SystemExit('prospect movement headline counter anchor not found')

GAME.write_text(game, encoding='utf-8')
WORLD.write_text(world, encoding='utf-8')

print('PROJECT_ICE_RUNTIME_PATCH=APPLIED')
