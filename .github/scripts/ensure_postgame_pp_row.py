from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text()
needle = """  setText(\n    'postgame-away-power-play',\n"""
if needle not in text:
    raise SystemExit('PP render anchor not found')
insert = """  /*\n   * Be resilient to an already-open/stale Vite document after a Git pull.\n   * If the HTML shell was loaded before the Power Play row existed,\n   * create the row from the current game.js so the stat still appears\n   * without requiring a brand-new browser tab/session.\n   */\n  if (\n    !document.getElementById(\n      'postgame-away-power-play'\n    ) ||\n    !document.getElementById(\n      'postgame-home-power-play'\n    )\n  ) {\n    const teamStatsContainer =\n      document.querySelector(\n        '.postgame-team-stats'\n      );\n\n    if (teamStatsContainer) {\n      const powerPlayRow =\n        document.createElement('div');\n\n      powerPlayRow.className =\n        'postgame-team-stat-row';\n\n      powerPlayRow.innerHTML = `\n        <strong id=\"postgame-away-power-play\">0/0</strong>\n        <span>Power Play</span>\n        <strong id=\"postgame-home-power-play\">0/0</strong>\n      `;\n\n      teamStatsContainer.appendChild(\n        powerPlayRow\n      );\n    }\n  }\n\n"""
text = text.replace(needle, insert + needle, 1)
path.write_text(text)
