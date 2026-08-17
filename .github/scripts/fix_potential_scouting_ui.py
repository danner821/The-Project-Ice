from pathlib import Path

game=Path('artifacts/project-ice/public/game.js')
html=Path('artifacts/project-ice/index.html')
g=game.read_text()
h=html.read_text()

# Potential is explicitly player-facing in Project Ice. Show both the role tier
# and the actual projected potential instead of hiding the number in a tooltip.
old="""    setText(\n      'pp-development-potential',\n      potentialRole\n    );\n"""
new="""    setText(\n      'pp-development-potential',\n      `${potentialRole} • ${potential} POT`\n    );\n"""
if old not in g:
    raise SystemExit('potential display anchor missing')
g=g.replace(old,new,1)

# Scouting accuracy must be driven by the same canonical development contract,
# not by a potentially stale scoutingProfile cache on older saves.
old="""    const evaluationAccuracy =\n      scouting.evaluationAccuracy ||\n      (\n        confidence >= 75\n          ? 'High'\n          : confidence >= 50\n            ? 'Medium'\n            : 'Low'\n      );\n"""
new="""    const canonicalAccuracy =\n      player.development?.potentialAccuracy ||\n      player.potentialAccuracy ||\n      null;\n\n    const evaluationAccuracy =\n      canonicalAccuracy ||\n      (\n        confidence >= 75\n          ? 'High'\n          : confidence >= 50\n            ? 'Medium'\n            : 'Low'\n      );\n"""
if old not in g:
    raise SystemExit('accuracy anchor missing')
g=g.replace(old,new,1)

old="""    setText(\n      'pp-scouting-accuracy',\n      evaluationAccuracy\n    );\n\n    setText(\n      'pp-scouting-report-date',\n"""
new="""    setText(\n      'pp-scouting-accuracy',\n      evaluationAccuracy\n    );\n\n    setText(\n      'pp-scouting-confidence-detail',\n      `Potential certainty • ${Math.round(confidence)}%`\n    );\n\n    setText(\n      'pp-scouting-report-date',\n"""
if old not in g:
    raise SystemExit('scouting detail anchor missing')
g=g.replace(old,new,1)

# Make the Development tooltip explain uncertainty instead of redundantly
# revealing a number that is now visible.
old="""    if (potentialElement) {\n      potentialElement.title =\n        `${potential} projected potential`;\n    }\n"""
new="""    if (potentialElement) {\n      potentialElement.title =\n        `${potentialRole} projection • ${Math.round(\n          Math.max(25, Math.min(100, Number(\n            development.potentialConfidence ??\n            player.potentialConfidence\n          ) || 50))\n        )}% scouting confidence`;\n    }\n"""
if old not in g:
    raise SystemExit('potential tooltip anchor missing')
g=g.replace(old,new,1)

old="""                  <span class=\"pp-scouting-card__detail\">\n                    Current scouting certainty\n                  </span>\n"""
new="""                  <span\n                    class=\"pp-scouting-card__detail\"\n                    id=\"pp-scouting-confidence-detail\"\n                  >\n                    Potential certainty • 50%\n                  </span>\n"""
if old not in h:
    raise SystemExit('html scouting confidence anchor missing')
h=h.replace(old,new,1)

game.write_text(g)
html.write_text(h)
print('fixed player-facing potential and scouting confidence UI')
