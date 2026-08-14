from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text()
world = WORLD.read_text()

# 1) Player-facing TOI should display the canonical live skater's accumulated
# TOI, not a presentation-side approximation that can overcount transition steps.
old_game = """  document.getElementById(\n    'live-game-player-toi'\n  ).textContent =\n    formatLivePresentationClock(\n      liveGameCareerTOISeconds\n    );\n"""
new_game = """  const canonicalLiveTOISeconds =\n    Math.max(\n      0,\n      Number(\n        liveSkater.timeOnIceSeconds\n      ) || 0\n    );\n\n  document.getElementById(\n    'live-game-player-toi'\n  ).textContent =\n    formatLivePresentationClock(\n      canonicalLiveTOISeconds\n    );\n"""
if game.count(old_game) != 1:
    raise SystemExit(f'Expected one live TOI display block, found {game.count(old_game)}')
game = game.replace(old_game, new_game, 1)

# 2) During penalties, rotate PP/PK units instead of leaving Unit 1 out for the
# entire advantage. Use the existing deployment age to alternate roughly every
# 45 seconds while preserving the canonical special-teams lineups.
anchor = """    /*\n     * ========================================================\n     * HOME DEPLOYMENT\n     * ========================================================\n     */\n"""
insert = """    /*\n     * Rotate special-teams units during extended penalties.\n     * Unit 1 starts the sequence; Unit 2 takes the next ~45-second window.\n     * This prevents PP1/PK1 skaters from playing an entire two-minute minor.\n     */\n    const specialTeamsShiftUnit =\n      (\n        Math.floor(\n          (Number(flow.deploymentAgeSeconds) || 0) / 45\n        ) % 2\n      ) + 1;\n\n""" + anchor
if world.count(anchor) != 1:
    raise SystemExit(f'Expected one home deployment anchor, found {world.count(anchor)}')
world = world.replace(anchor, insert, 1)

# Restrict replacements to the manpower-deployment section only.
start = world.index(insert)
end_marker = """    /*\n     * ==========================================================\n     * EVENT TIMING\n     * ==========================================================\n     */\n"""
end = world.index(end_marker, start)
section = world[start:end]
count_units = section.count("specialTeamsUnit: 1,")
if count_units != 4:
    raise SystemExit(f'Expected four special-teams unit-1 assignments in deployment section, found {count_units}')
section = section.replace("specialTeamsUnit: 1,", "specialTeamsUnit:\n              specialTeamsShiftUnit,")
world = world[:start] + section + world[end:]

# 3) When a penalty expires or manpower otherwise changes, throw away the
# special-teams deployment immediately. Otherwise the PP/PK personnel can linger
# into 5-on-5 until the ordinary shift-age refresh fires.
old_clock = """    advanceLiveGameSpecialTeamsClock(\n      simulation,\n      elapsedSeconds\n    );\n\n    /*\n     * ==========================================================\n     * PERIOD EXPIRATION\n"""
new_clock = """    const manpowerBeforeClock =\n      `${homeSkaterCount}v${awaySkaterCount}`;\n\n    advanceLiveGameSpecialTeamsClock(\n      simulation,\n      elapsedSeconds\n    );\n\n    const manpowerAfterClock =\n      `${Math.max(3, Number(specialTeams.homeSkaters) || 5)}v${Math.max(3, Number(specialTeams.awaySkaters) || 5)}`;\n\n    if (manpowerAfterClock !== manpowerBeforeClock) {\n      flow.homeDeployment = null;\n      flow.awayDeployment = null;\n      flow.deploymentAgeSeconds = 0;\n    }\n\n    /*\n     * ==========================================================\n     * PERIOD EXPIRATION\n"""
if world.count(old_clock) != 1:
    raise SystemExit(f'Expected one special-teams clock block, found {world.count(old_clock)}')
world = world.replace(old_clock, new_clock, 1)

GAME.write_text(game)
WORLD.write_text(world)
print('Fixed canonical live TOI display and special-teams deployment rotation/reset.')
