from pathlib import Path
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
hp=Path('artifacts/project-ice/index.html')
w=wp.read_text(); g=gp.read_text(); h=hp.read_text()

# 1) Career player UI: role only, no numeric POT, and replace Trend with scouting Evaluation.
g=g.replace("""    setText(\n      'pp-development-potential',\n      `${potentialRole} • ${potential} POT`\n    );\n\n    setText(\n      'pp-development-trend',\n      potentialTrendDisplay.text\n    );\n""","""    setText(\n      'pp-development-potential',\n      potentialRole\n    );\n\n    const potentialAccuracy =\n      development.potentialAccuracy ||\n      player.potentialAccuracy ||\n      (\n        Number(development.potentialConfidence ?? player.potentialConfidence) >= 75\n          ? 'High'\n          : Number(development.potentialConfidence ?? player.potentialConfidence) >= 45\n            ? 'Medium'\n            : 'Low'\n      );\n\n    setText(\n      'pp-development-trend',\n      String(potentialAccuracy).toUpperCase()\n    );\n""",1)

# Remove directional trend styling from the career-facing card; those signals are hidden.
old="""    const potentialTrendElement =\n      document.getElementById(\n        'pp-development-trend'\n      );\n\n    if (potentialTrendElement) {\n      potentialTrendElement.classList.remove(\n        'pp-career-card__value--trend-rising',\n        'pp-career-card__value--trend-falling',\n        'pp-career-card__value--trend-stable'\n      );\n\n      potentialTrendElement.classList.add(\n        potentialTrendDisplay.className\n      );\n    }\n"""
new="""    const potentialTrendElement =\n      document.getElementById(\n        'pp-development-trend'\n      );\n\n    if (potentialTrendElement) {\n      potentialTrendElement.classList.remove(\n        'pp-career-card__value--trend-rising',\n        'pp-career-card__value--trend-falling',\n        'pp-career-card__value--trend-stable'\n      );\n    }\n"""
if old not in g: raise SystemExit('trend style block missing')
g=g.replace(old,new,1)

# Tooltip must not leak numeric potential or hidden distance-to-change.
old="""    if (potentialElement) {\n      potentialElement.title =\n        `${potentialRole} projection • ${Math.round(\n          Math.max(25, Math.min(100, Number(\n            development.potentialConfidence ??\n            player.potentialConfidence\n          ) || 50))\n        )}% scouting confidence`;\n    }\n"""
new="""    if (potentialElement) {\n      potentialElement.title =\n        `${potentialRole} projection`;\n    }\n"""
if old not in g: raise SystemExit('tooltip block missing')
g=g.replace(old,new,1)

h=h.replace("""                  <span class=\"pp-career-card__label\">\n                    Trend\n                  </span>\n""","""                  <span class=\"pp-career-card__label\">\n                    Evaluation\n                  </span>\n""",1)
h=h.replace(""">\n                    Stable\n                  </strong>\n""",""">\n                    MEDIUM\n                  </strong>\n""",1)

# 2) Potential engine: confidence becomes the public uncertainty clue.
old="""    /* Confidence rises with accumulated evaluation evidence. */\n    const observedGames = Math.max(0, Number(player.scoutingProfile?.gamesObserved) || 0);\n    const confidenceGain = 0.35 + Math.min(0.65, observedGames * 0.035);\n    const newConfidence = Math.max(25, Math.min(100, oldConfidence + confidenceGain));\n    const threshold = 2.15 + ((newConfidence - 25) / 75) * 0.95;\n\n    const currentWeek = Math.max(1, Number(_state.season?.currentWeek) || 1);\n    const lastChangedWeek = Number(development.lastPotentialChangeWeek) || -999;\n    const weeksSinceChange = currentWeek - lastChangedWeek;\n    const cooldownMet = weeksSinceChange >= 4;\n\n    let delta = 0;\n    if (cooldownMet && signal >= threshold) delta = 1;\n    if (cooldownMet && signal <= -threshold) delta = -1;\n"""
new="""    /*\n     * Public scouting certainty is deliberately the ONLY clue that the\n     * projection may be getting stale. When sustained performance/growth no\n     * longer fits the current projection, certainty erodes. When the evidence\n     * fits again, observation slowly rebuilds confidence. We never expose the\n     * hidden signal or distance to a potential change.\n     */\n    const observedGames = Math.max(0, Number(player.scoutingProfile?.gamesObserved) || 0);\n    const mismatchStrength = Math.max(0, Math.abs(signal) - 0.85);\n    const evidenceStrength = Math.abs(Number(evidence.evidence) || 0);\n    const meaningfulMismatch = evidenceStrength >= 0.22 && mismatchStrength > 0;\n\n    let confidenceDelta;\n    if (meaningfulMismatch) {\n      confidenceDelta = -Math.min(2.4, 0.35 + mismatchStrength * 0.72);\n    } else {\n      confidenceDelta = 0.18 + Math.min(0.52, observedGames * 0.025);\n    }\n\n    let newConfidence = Math.max(25, Math.min(100, oldConfidence + confidenceDelta));\n\n    /*\n     * Actual potential movement should feel like NHL Franchise: rare, delayed,\n     * and impossible to time precisely. Strong sustained evidence first has to\n     * destabilize the scouting projection, then clear a long cooldown, then\n     * survive a hidden reevaluation roll.\n     */\n    const threshold = 3.05 + ((newConfidence - 25) / 75) * 0.70;\n\n    const currentWeek = Math.max(1, Number(_state.season?.currentWeek) || 1);\n    const lastChangedWeek = Number(development.lastPotentialChangeWeek) || -999;\n    const weeksSinceChange = currentWeek - lastChangedWeek;\n    const cooldownMet = weeksSinceChange >= 10;\n\n    const thresholdExcess = Math.max(0, Math.abs(signal) - threshold);\n    const reevaluationChance = Math.min(0.28, 0.08 + thresholdExcess * 0.11);\n    const reevaluationRoll = Math.random();\n\n    let delta = 0;\n    if (cooldownMet && signal >= threshold && reevaluationRoll < reevaluationChance) delta = 1;\n    if (cooldownMet && signal <= -threshold && reevaluationRoll < reevaluationChance) delta = -1;\n"""
if old not in w: raise SystemExit('confidence/threshold block missing')
w=w.replace(old,new,1)

# 3) When a hidden potential change happens, scouting certainty resets because evaluators
# are now assessing a new projection. This makes the visible role jump surprising.
old="""    const changed = newPotential !== oldPotential;\n    const appliedDelta = newPotential - oldPotential;\n\n    development.potential = newPotential;\n    development.potentialRole = getPotentialRole(player.position, newPotential);\n    development.potentialConfidence = Number(newConfidence.toFixed(2));\n"""
new="""    const changed = newPotential !== oldPotential;\n    const appliedDelta = newPotential - oldPotential;\n\n    if (changed) {\n      newConfidence = Math.max(38, Math.min(62, newConfidence));\n    }\n\n    development.potential = newPotential;\n    development.potentialRole = getPotentialRole(player.position, newPotential);\n    development.potentialConfidence = Number(newConfidence.toFixed(2));\n"""
if old not in w: raise SystemExit('changed confidence block missing')
w=w.replace(old,new,1)

# Preserve hidden diagnostics in engine return for debugging, not UI. Add roll/chance for tests.
old="""      signal: development.potentialSignal,\n      threshold: Number(threshold.toFixed(4)),\n      evidence,\n"""
new="""      signal: development.potentialSignal,\n      threshold: Number(threshold.toFixed(4)),\n      reevaluationChance: Number(reevaluationChance.toFixed(4)),\n      reevaluationRoll: Number(reevaluationRoll.toFixed(4)),\n      evidence,\n"""
if old not in w: raise SystemExit('return diagnostics block missing')
w=w.replace(old,new,1)

wp.write_text(w); gp.write_text(g); hp.write_text(h)
print('tuned NHL-style potential mystery and certainty behavior')
