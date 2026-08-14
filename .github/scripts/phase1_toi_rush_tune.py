from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text()
world = WORLD.read_text()

# ------------------------------------------------------------
# TOI: make even-strength rotation sensitive to the hottest
# individual on a unit, not only the unit average. This prevents
# a PP-heavy career player from being dragged back onto the ice
# because his linemates are still below their shared average target.
# ------------------------------------------------------------
old = """      return (\n        matchingPlayers.reduce(\n          (sum, player) =>\n            sum +\n            Math.max(\n              0,\n              Number(\n                player.timeOnIceSeconds\n              ) || 0\n            ),\n          0\n        ) /\n        matchingPlayers.length\n      );\n"""
new = """      const playerTOIValues =\n        matchingPlayers.map(player =>\n          Math.max(\n            0,\n            Number(\n              player.timeOnIceSeconds\n            ) || 0\n          )\n        );\n\n      const averageTOI =\n        playerTOIValues.reduce(\n          (sum, value) =>\n            sum + value,\n          0\n        ) /\n        playerTOIValues.length;\n\n      const hottestPlayerTOI =\n        Math.max(...playerTOIValues);\n\n      /*\n       * Blend the unit average with the most-used skater. A player who\n       * accumulated extra PP/PK minutes now meaningfully cools the next\n       * 5-on-5 deployment without forcing every linemate to identical TOI.\n       */\n      return (\n        averageTOI * 0.58 +\n        hottestPlayerTOI * 0.42\n      );\n"""
if world.count(old) != 1:
    raise SystemExit(f'Expected one unit average TOI return block, found {world.count(old)}')
world = world.replace(old, new, 1)

# Make over-target actual TOI matter a bit more than before.
old = """        const score =\n          toiDeficit * 1.25 +\n          shiftCountDeficit * 18 +\n          Math.random() * 12;\n"""
new = """        const overTargetPenalty =\n          toiDeficit < 0\n            ? Math.abs(toiDeficit) * 0.45\n            : 0;\n\n        const score =\n          toiDeficit * 1.35 -\n          overTargetPenalty +\n          shiftCountDeficit * 15 +\n          Math.random() * 10;\n"""
if world.count(old) != 1:
    raise SystemExit('Could not uniquely locate deployment score block')
world = world.replace(old, new, 1)

# ------------------------------------------------------------
# Rush moments: the initial 3% neutral-zone gate made breakaways
# and 2-on-1s effectively invisible. Keep them special, but make
# them realistically discoverable during normal testing/play.
# ------------------------------------------------------------
old = """    : zone === 'offensive'\n      ? Math.min(0.20, 0.07 + pressure * 0.023)\n      : 0.03;\n"""
new = """    : zone === 'offensive'\n      ? Math.min(0.20, 0.07 + pressure * 0.023)\n      : 0.085;\n"""
if game.count(old) != 1:
    raise SystemExit('Could not uniquely locate neutral-zone decision chance')
game = game.replace(old, new, 1)

if game.count('if (rushRoll < 0.18) {') != 1:
    raise SystemExit('Could not uniquely locate breakaway threshold')
game = game.replace('if (rushRoll < 0.18) {', 'if (rushRoll < 0.24) {', 1)

if game.count('} else if (rushRoll < 0.52) {') != 1:
    raise SystemExit('Could not uniquely locate 2-on-1 threshold')
game = game.replace('} else if (rushRoll < 0.52) {', '} else if (rushRoll < 0.68) {', 1)

GAME.write_text(game)
WORLD.write_text(world)
print('Tightened player-aware TOI rotation and increased discoverability of rush moments.')
