from pathlib import Path
import re

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text(encoding='utf-8')
world = WORLD.read_text(encoding='utf-8')

# 1) Postgame Continue should honor where the game was launched from.
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
       * Return to the tab that launched the game. Games entered from Home
       * should return to Home; Schedule remains the fallback for any route
       * that does not carry an explicit Hub origin.
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
if old_route not in game:
    raise SystemExit('Postgame Continue route anchor not found')
game = game.replace(old_route, new_route, 1)

# 2) Potential news only publishes when the actual potential changed, and only
# when that change crossed into a different visible potential role. This stops
# stable weekly evaluations from being described as an "elevation".
potential_anchor = """        const direction = Number(beat.change || beat.potentialChange || 0);
        const verb = direction < 0 ? 'revised to' : 'elevated to';
"""
potential_replacement = """        const direction = Number(beat.change || beat.potentialChange || 0);
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
"""
potential_count = world.count(potential_anchor)
if potential_count < 1:
    raise SystemExit('Potential-news anchor not found')
world = world.replace(potential_anchor, potential_replacement)

# 3) Stabilize weekly prospect rankings. Raw scouting scores still change every
# week, but prior public rank carries 72% of the ordering signal and the new raw
# rank carries 28%. Sustained performance still moves a prospect; one noisy week
# no longer reshuffles the board dramatically.
rank_pattern = re.compile(
    r"    const ranked = players\n"
    r"(?P<body>.*?score: calculateWeeklyScoutingScore\(player\),.*?\n"
    r"      \);\n\n"
    r"    ranked\.forEach",
    re.S,
)

matches = list(rank_pattern.finditer(world))
if not matches:
    raise SystemExit('Weekly prospect ranking block not found')


def stabilize_rank_block(match):
    block = match.group(0)
    block = block.replace('    const ranked = players\n', '    let ranked = players\n', 1)
    marker = '\n\n    ranked.forEach'
    if marker not in block:
        raise SystemExit('Weekly prospect ranking insertion marker missing')

    stabilization = """

    const rawRankByPlayerId =
      new Map(
        ranked.map((entry, index) => [
          String(entry.playerId || ''),
          index + 1,
        ])
      );

    ranked = ranked
      .map(entry => {
        const rawRank =
          rawRankByPlayerId.get(
            String(entry.playerId || '')
          ) || 999;

        const previousRank =
          Number(
            entry.player?.scoutingProfile
              ?.publicRank
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
        String(a.playerId || '').localeCompare(
          String(b.playerId || '')
        )
      );
"""
    return block.replace(marker, stabilization + marker, 1)

world = rank_pattern.sub(stabilize_rank_block, world)

# 4) League News should summarize prospect movement instead of becoming a
# transaction log. Only the first three major/milestone moves each week are
# published, and a generic "big move" now requires ten spots.
loop_anchor = """    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;
"""
loop_replacement = """    let prospectMovementHeadlines = 0;
    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;
      if (prospectMovementHeadlines >= 3) return;
"""
loop_count = world.count(loop_anchor)
if loop_count < 1:
    raise SystemExit('Prospect-news loop anchor not found')
world = world.replace(loop_anchor, loop_replacement)

big_move_anchor = "const bigMove = Math.abs(change) >= 8;"
if big_move_anchor not in world:
    raise SystemExit('Prospect big-move threshold anchor not found')
world = world.replace(
    big_move_anchor,
    "const bigMove = Math.abs(change) >= 10;"
)

threshold_anchor = """      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      const player = getPlayer(entry.playerId);
"""
threshold_replacement = """      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      prospectMovementHeadlines += 1;

      const player = getPlayer(entry.playerId);
"""
threshold_count = world.count(threshold_anchor)
if threshold_count < 1:
    raise SystemExit('Prospect headline threshold anchor not found')
world = world.replace(threshold_anchor, threshold_replacement)

GAME.write_text(game, encoding='utf-8')
WORLD.write_text(world, encoding='utf-8')

print('PROJECT_ICE_RUNTIME_PATCH=APPLIED')
print(f'potential_news_blocks={potential_count}')
print(f'ranking_blocks={len(matches)}')
print(f'prospect_news_loops={loop_count}')
