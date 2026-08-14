from pathlib import Path
import re

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text()
world = WORLD.read_text()

# -----------------------------
# game.js: richer action labels
# -----------------------------
old = """    label:\n      choiceLabel ||\n      (action === 'shoot'\n        ? 'Shoot'\n        : action === 'pass'\n          ? 'Pass'\n          : 'Hold the puck'),\n"""
new = """    label:\n      choiceLabel ||\n      (String(action).startsWith('shoot')\n        ? 'Shoot'\n        : String(action).startsWith('pass')\n          ? 'Pass'\n          : 'Hold the puck'),\n"""
if game.count(old) != 1:
    raise SystemExit('Could not locate default live decision label block')
game = game.replace(old, new, 1)

# -----------------------------
# game.js: offense scenarios
# -----------------------------
neutral_pattern = re.compile(r"  if \(!careerIsDefending && zone === 'neutral'\) \{.*?\n  \} else if \(!careerIsDefending && pressure >= 5\) \{", re.S)
neutral_replacement = """  if (!careerIsDefending && zone === 'neutral') {
    const rushRoll = Math.random();

    if (rushRoll < 0.18) {
      scenario = {
        key: 'breakaway',
        eyebrow: 'BREAKAWAY',
        title: 'You are in alone on the goalie.',
        detail: 'There is no second defender to bail him out. Pick how you want to finish it.',
        accent: '#ffcf70',
        choices: [
          {
            action: 'shoot-snap',
            label: 'Shoot early',
            note: 'Release it before the goalie can fully set',
            risk: 'QUICK',
          },
          {
            action: 'shoot-breakaway',
            label: 'Make a move',
            note: 'Challenge the goalie with deking and puck control',
            risk: 'SKILL',
          },
          {
            action: 'shoot-wrist',
            label: 'Pick a corner',
            note: 'Stay patient and trust your wrist-shot accuracy',
            risk: 'FINISH',
          },
        ],
      };
    } else if (rushRoll < 0.52) {
      scenario = {
        key: 'two-on-one',
        eyebrow: '2-ON-1 RUSH',
        title: 'You enter with one teammate and one defender back.',
        detail: 'The defender has to respect both lanes. Your read decides the chance.',
        accent: '#7ec8ff',
        choices: [
          {
            action: 'shoot-snap',
            label: 'Use the teammate as a decoy',
            note: 'Keep the puck and snap it before the defender closes',
            risk: 'SHOOT',
          },
          {
            action: 'pass-seam',
            label: 'Slide it across',
            note: 'Attempt the dangerous pass through the defender',
            risk: 'HIGH RISK',
          },
          {
            action: 'hold',
            label: 'Delay and read',
            note: 'Force the defender to commit before making the next play',
            risk: 'POISE',
          },
        ],
      };
    } else {
      scenario = {
        key: 'transition-rush',
        eyebrow: 'TRANSITION RUSH',
        title: 'You carry the puck at a retreating defense.',
        detail: 'The gap is still forming. Your next touch decides whether the rush becomes a chance.',
        accent: '#75b7ff',
        choices: [
          {
            action: 'shoot-snap',
            label: 'Drive and fire',
            note: 'Attack before the defense can set',
            risk: 'ATTACK',
          },
          {
            action: 'pass-trailer',
            label: 'Hit the trailer',
            note: 'Move the puck into the developing second wave',
            risk: 'VISION',
          },
          {
            action: 'hold',
            label: 'Delay the rush',
            note: 'Buy time and let support arrive',
            risk: 'CONTROL',
          },
        ],
      };
    }
  } else if (!careerIsDefending && pressure >= 5) {"""
game, count = neutral_pattern.subn(neutral_replacement, game, count=1)
if count != 1:
    raise SystemExit(f'Expected one neutral transition scenario block, changed {count}')

# Net-front actions
for old_action, new_action in [
    ("action: 'shoot',\n          label: 'Put it through traffic'", "action: 'shoot-rebound',\n          label: 'Jam the loose puck'"),
    ("action: 'pass',\n          label: 'Slip it across'", "action: 'pass-backdoor',\n          label: 'Slip it backdoor'"),
    ("action: 'shoot',\n          label: 'Take the lane'", "action: 'shoot-snap',\n          label: 'Take the lane'"),
    ("action: 'pass',\n          label: 'Draw and dish'", "action: 'pass-seam',\n          label: 'Draw and dish'"),
    ("action: 'shoot',\n          label: 'Shoot through the screen'", "action: 'shoot-one-timer',\n          label: 'Hammer the one-timer'"),
    ("action: 'pass',\n          label: 'Work it through the seam'", "action: 'pass-seam',\n          label: 'Work it through the seam'"),
]:
    if game.count(old_action) != 1:
        raise SystemExit(f'Could not uniquely locate action block: {old_action}')
    game = game.replace(old_action, new_action, 1)

# Clutch shot/pass choices should also use explicit styles.
game = game.replace("action: 'shoot',\n                label: 'Go for the dagger'", "action: 'shoot-snap',\n                label: 'Go for the dagger'", 1)
game = game.replace("action: 'pass',\n                label: 'Find support'", "action: 'pass-safe',\n                label: 'Find support'", 1)
game = game.replace("action: 'shoot',\n                label: tied ? 'Take the big shot' : 'Fire it now'", "action: 'shoot-snap',\n                label: tied ? 'Take the big shot' : 'Fire it now'", 1)
game = game.replace("action: 'pass',\n                label: 'Find the best look'", "action: 'pass-seam',\n                label: 'Find the best look'", 1)

# Outcome defaults support styled action names.
old = """    let resultTag =\n      choice.action === 'hold'\n        ? 'POISE'\n        : choice.action === 'pass'\n          ? 'CREATE'\n          : 'ATTACK';\n\n    let outcomeTitle =\n      choice.action === 'hold'\n        ? 'You stay composed and let the play develop.'\n        : choice.action === 'pass'\n          ? 'You move the puck.'\n          : 'You attack the net.';\n"""
new = """    const isPassChoice =\n      String(choice.action || '').startsWith('pass');\n\n    const isShotChoice =\n      String(choice.action || '').startsWith('shoot');\n\n    let resultTag =\n      choice.action === 'hold'\n        ? 'POISE'\n        : isPassChoice\n          ? 'CREATE'\n          : 'ATTACK';\n\n    let outcomeTitle =\n      choice.action === 'hold'\n        ? 'You stay composed and let the play develop.'\n        : isPassChoice\n          ? 'You move the puck.'\n          : 'You attack the net.';\n"""
if game.count(old) != 1:
    raise SystemExit('Could not locate outcome default block')
game = game.replace(old, new, 1)

# Include blocked and missed attempts in shot outcome feedback.
old = """      outcomeType === 'shot' ||\n      outcomeType === 'shot-on-goal' ||\n      outcomeType === 'shot-saved'\n"""
new = """      outcomeType === 'shot' ||\n      outcomeType === 'shot-on-goal' ||\n      outcomeType === 'shot-saved' ||\n      outcomeType === 'shot-blocked' ||\n      outcomeType === 'shot-missed'\n"""
if game.count(old) != 1:
    raise SystemExit('Could not locate shot outcome type block')
game = game.replace(old, new, 1)

# -----------------------------
# world.js: forced shot styles
# -----------------------------
old = """  function resolveLiveGameShotAttempt(\n    simulation,\n    forcedShooterPlayerId = null\n  ) {\n"""
new = """  function resolveLiveGameShotAttempt(\n    simulation,\n    forcedShooterPlayerId = null,\n    forcedShotType = null\n  ) {\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate shot resolver signature')
world = world.replace(old, new, 1)

old = """    const shotType =\n      shotTypeSelection.shotType ||\n      'wrist';\n"""
new = """    const allowedForcedShotTypes =\n      new Set([\n        'wrist',\n        'snap',\n        'slap',\n        'one-timer',\n        'deflection',\n        'rebound',\n        'breakaway',\n      ]);\n\n    const shotType =\n      allowedForcedShotTypes.has(\n        String(forcedShotType || '')\n      )\n        ? String(forcedShotType)\n        : shotTypeSelection.shotType ||\n          'wrist';\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate shot type assignment')
world = world.replace(old, new, 1)

# Career pass now accepts a style and meaningfully trades completion risk for chance quality.
old = """function resolveLiveGameCareerPass(\n  simulation,\n  playerId\n) {\n"""
new = """function resolveLiveGameCareerPass(\n  simulation,\n  playerId,\n  passStyle = 'pass'\n) {\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate career pass signature')
world = world.replace(old, new, 1)

old = """  const successChance =\n    Math.max(\n      0.46,\n      Math.min(\n        0.91,\n        0.70 +\n        (passSkill - defensivePressure) * 0.006\n      )\n    );\n"""
new = """  const passStyleConfig =\n    {\n      'pass': { success: 0, pressure: 1.25 },\n      'pass-trailer': { success: 0.03, pressure: 1.35 },\n      'pass-safe': { success: 0.09, pressure: 0.70 },\n      'pass-seam': { success: -0.08, pressure: 1.85 },\n      'pass-backdoor': { success: -0.11, pressure: 2.15 },\n    }[passStyle] ||\n    { success: 0, pressure: 1.25 };\n\n  const successChance =\n    Math.max(\n      0.34,\n      Math.min(\n        0.95,\n        0.70 +\n        passStyleConfig.success +\n        (passSkill - defensivePressure) * 0.006\n      )\n    );\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate pass success chance block')
world = world.replace(old, new, 1)

old = """        (Number(flow.pressureLevel) || 0) + 1.25\n"""
new = """        (Number(flow.pressureLevel) || 0) +\n        passStyleConfig.pressure\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate career pass pressure gain')
world = world.replace(old, new, 1)

# Add style metadata to pass / turnover events.
world = world.replace("      successChance,\n    };\n\n    simulation.events.push(event);", "      successChance,\n      passStyle,\n    };\n\n    simulation.events.push(event);", 1)
world = world.replace("    careerDecision: 'pass',\n    successChance,", "    careerDecision: passStyle,\n    passStyle,\n    successChance,", 1)

# Pending decision routing supports shot/pass variants.
old = """const selection =\n  pendingCareerDecision?.action === 'shoot'\n    ? { success: true, reason: 'career-decision-shoot', eventType: 'shot-attempt' }\n    : pendingCareerDecision?.action === 'pass'\n      ? { success: true, reason: 'career-decision-pass', eventType: 'career-pass' }\n      : ['defend-stick', 'defend-body', 'defend-contain'].includes(pendingCareerDecision?.action)\n        ? { success: true, reason: 'career-decision-defense', eventType: 'career-defense' }\n        : selectNextLiveGameEventType(simulation);\n"""
new = """const pendingAction =\n  String(pendingCareerDecision?.action || '');\n\nconst selection =\n  pendingAction.startsWith('shoot')\n    ? { success: true, reason: 'career-decision-shoot', eventType: 'shot-attempt' }\n    : pendingAction.startsWith('pass')\n      ? { success: true, reason: 'career-decision-pass', eventType: 'career-pass' }\n      : ['defend-stick', 'defend-body', 'defend-contain'].includes(pendingAction)\n        ? { success: true, reason: 'career-decision-defense', eventType: 'career-defense' }\n        : selectNextLiveGameEventType(simulation);\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate pending decision selection block')
world = world.replace(old, new, 1)

old = """resolveLiveGameShotAttempt(\n  simulation,\n  pendingCareerDecision?.action === 'shoot'\n    ? pendingCareerDecision.playerId\n    : null\n);\n"""
new = """resolveLiveGameShotAttempt(\n  simulation,\n  pendingAction.startsWith('shoot')\n    ? pendingCareerDecision?.playerId || null\n    : null,\n  pendingAction.startsWith('shoot-')\n    ? pendingAction.slice('shoot-'.length)\n    : null\n);\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate shot resolution call')
world = world.replace(old, new, 1)

old = """    resolveLiveGameCareerPass(\n      simulation,\n      pendingCareerDecision?.playerId || null\n    );\n"""
new = """    resolveLiveGameCareerPass(\n      simulation,\n      pendingCareerDecision?.playerId || null,\n      pendingAction || 'pass'\n    );\n"""
if world.count(old) != 1:
    raise SystemExit('Could not locate career pass resolution call')
world = world.replace(old, new, 1)

GAME.write_text(game)
WORLD.write_text(world)
print('Added breakaway / 2-on-1 scenarios and style-aware offensive decisions.')
