from pathlib import Path

WORLD = Path('artifacts/project-ice/public/world.js')
GAME = Path('artifacts/project-ice/public/game.js')
HTML = Path('artifacts/project-ice/index.html')

world = WORLD.read_text()
game = GAME.read_text()
html = HTML.read_text()

# Freeze PP results into the permanent postgame package for both played and instant-sim games.
old_home = '''        shots:\n          Number(\n            gameResult.home?.shots\n          ) || 0,\n\n        skaters:\n'''
new_home = '''        shots:\n          Number(\n            gameResult.home?.shots\n          ) || 0,\n\n        powerPlayGoals:\n          Number(\n            gameResult.home?.powerPlayGoals\n          ) || 0,\n\n        powerPlayOpportunities:\n          Number(\n            gameResult.home?.powerPlayOpportunities\n          ) || 0,\n\n        skaters:\n'''
if old_home not in world:
    raise SystemExit('home postgame summary anchor not found')
world = world.replace(old_home, new_home, 1)

old_away = '''        shots:\n          Number(\n            gameResult.away?.shots\n          ) || 0,\n\n        skaters:\n'''
new_away = '''        shots:\n          Number(\n            gameResult.away?.shots\n          ) || 0,\n\n        powerPlayGoals:\n          Number(\n            gameResult.away?.powerPlayGoals\n          ) || 0,\n\n        powerPlayOpportunities:\n          Number(\n            gameResult.away?.powerPlayOpportunities\n          ) || 0,\n\n        skaters:\n'''
if old_away not in world:
    raise SystemExit('away postgame summary anchor not found')
world = world.replace(old_away, new_away, 1)

# Render NHL-style goals/opportunities in the existing Team Stats card.
old_game = '''  setText(\n    'postgame-home-shots',\n    Number(\n      summary.home?.shots\n    ) || 0\n  );\n\n  setText(\n    'postgame-player-name',\n'''
new_game = '''  setText(\n    'postgame-home-shots',\n    Number(\n      summary.home?.shots\n    ) || 0\n  );\n\n  setText(\n    'postgame-away-power-play',\n    `${\n      Number(\n        summary.away?.powerPlayGoals\n      ) || 0\n    }/${\n      Number(\n        summary.away?.powerPlayOpportunities\n      ) || 0\n    }`\n  );\n\n  setText(\n    'postgame-home-power-play',\n    `${\n      Number(\n        summary.home?.powerPlayGoals\n      ) || 0\n    }/${\n      Number(\n        summary.home?.powerPlayOpportunities\n      ) || 0\n    }`\n  );\n\n  setText(\n    'postgame-player-name',\n'''
if old_game not in game:
    raise SystemExit('game postgame shots anchor not found')
game = game.replace(old_game, new_game, 1)

# Add the visible Team Stats row directly below Shots.
old_html = '''                <div class="postgame-team-stat-row">\n                  <strong\n                    id="postgame-away-shots"\n                  >\n                    0\n                  </strong>\n\n                  <span>Shots</span>\n\n                  <strong\n                    id="postgame-home-shots"\n                  >\n                    0\n                  </strong>\n                </div>\n\n              </div>\n'''
new_html = '''                <div class="postgame-team-stat-row">\n                  <strong\n                    id="postgame-away-shots"\n                  >\n                    0\n                  </strong>\n\n                  <span>Shots</span>\n\n                  <strong\n                    id="postgame-home-shots"\n                  >\n                    0\n                  </strong>\n                </div>\n\n                <div class="postgame-team-stat-row">\n                  <strong\n                    id="postgame-away-power-play"\n                  >\n                    0/0\n                  </strong>\n\n                  <span>Power Play</span>\n\n                  <strong\n                    id="postgame-home-power-play"\n                  >\n                    0/0\n                  </strong>\n                </div>\n\n              </div>\n'''
if old_html not in html:
    raise SystemExit('postgame Team Stats shots row anchor not found')
html = html.replace(old_html, new_html, 1)

WORLD.write_text(world)
GAME.write_text(game)
HTML.write_text(html)
