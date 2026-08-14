from pathlib import Path

world_path=Path('artifacts/project-ice/public/world.js')
game_path=Path('artifacts/project-ice/public/game.js')
world=world_path.read_text(encoding='utf-8')
game=game_path.read_text(encoding='utf-8')

# WORLD: insert canonical career defense resolver before generic hit resolver.
anchor='  function resolveLiveGameHit(\n    simulation\n  ) {'
if anchor not in world:
    raise SystemExit('world hit anchor missing')
resolver=r'''  function resolveLiveGameCareerDefense(
    simulation,
    playerId,
    action
  ) {
    if (!simulation || !simulation.flow || !playerId) {
      return { success: false, reason: 'invalid-career-defense-state', event: null };
    }

    const flow = simulation.flow;
    const careerPlayer = getPlayerById(playerId);
    if (!careerPlayer) {
      return { success: false, reason: 'career-defender-not-found', event: null };
    }

    const homeOnIce = Array.isArray(flow.homeDeployment?.skaters)
      ? flow.homeDeployment.skaters : [];
    const awayOnIce = Array.isArray(flow.awayDeployment?.skaters)
      ? flow.awayDeployment.skaters : [];
    const careerSide = homeOnIce.some(p => String(p.playerId) === String(playerId))
      ? 'home'
      : awayOnIce.some(p => String(p.playerId) === String(playerId))
        ? 'away' : null;

    if (!careerSide || flow.possessionSide === careerSide) {
      return { success: false, reason: 'career-defense-context-missing', event: null };
    }

    const attackingSide = flow.possessionSide;
    const attackingDeployment = attackingSide === 'home'
      ? flow.homeDeployment : flow.awayDeployment;
    const attackers = Array.isArray(attackingDeployment?.skaters)
      ? attackingDeployment.skaters : [];
    const attrs = careerPlayer.attributes || {};

    const attackerPressure = attackers.length
      ? attackers.reduce((sum, skater) => {
          const p = getPlayerById(skater.playerId)?.attributes || {};
          return sum + (Number(p.puckControl) || 50) * 0.45 +
            (Number(p.offensiveAwareness) || 50) * 0.35 +
            (Number(p.skating) || Number(p.acceleration) || 50) * 0.20;
        }, 0) / attackers.length
      : 50;

    let defenseSkill = 50;
    let baseChance = 0.50;
    let pressureReduction = 1;
    let turnoverBonus = 0;

    if (action === 'defend-stick') {
      defenseSkill = (Number(attrs.stickChecking) || 50) * 0.50 +
        (Number(attrs.defensiveAwareness) || 50) * 0.35 +
        (Number(attrs.acceleration) || Number(attrs.skating) || 50) * 0.15;
      baseChance = 0.52;
      pressureReduction = 1.6;
      turnoverBonus = 0.28;
    } else if (action === 'defend-body') {
      defenseSkill = (Number(attrs.bodyChecking) || 50) * 0.50 +
        (Number(attrs.strength) || 50) * 0.30 +
        (Number(attrs.aggression) || 50) * 0.20;
      baseChance = 0.44;
      pressureReduction = 2.0;
      turnoverBonus = 0.34;
    } else {
      defenseSkill = (Number(attrs.defensiveAwareness) || 50) * 0.55 +
        (Number(attrs.stickChecking) || 50) * 0.20 +
        (Number(attrs.skating) || Number(attrs.acceleration) || 50) * 0.25;
      baseChance = 0.62;
      pressureReduction = 1.35;
      turnoverBonus = 0.12;
    }

    const successChance = Math.max(0.28, Math.min(0.88,
      baseChance + (defenseSkill - attackerPressure) * 0.006));
    const succeeded = Math.random() < successChance;
    const pressureBefore = Number(flow.pressureLevel) || 0;
    let possessionChanged = false;

    if (succeeded) {
      flow.pressureLevel = Math.max(0, pressureBefore - pressureReduction);
      possessionChanged = Math.random() < Math.min(0.82, 0.30 + turnoverBonus +
        (defenseSkill - attackerPressure) * 0.004);

      if (possessionChanged) {
        flow.possessionSide = careerSide;
        flow.zone = flow.zone === 'offensive' ? 'defensive'
          : flow.zone === 'defensive' ? 'offensive' : 'neutral';
        flow.paceContext = 'transition';
        flow.pressureLevel = 0;
        flow.recentPossessionTouches = [];
        const teamState = careerSide === 'home' ? simulation.home : simulation.away;
        teamState.takeaways = (Number(teamState.takeaways) || 0) + 1;
        careerPlayer.takeaways = (Number(careerPlayer.takeaways) || 0) + 1;
      } else {
        flow.paceContext = 'normal';
      }

      if (action === 'defend-body') {
        const teamState = careerSide === 'home' ? simulation.home : simulation.away;
        teamState.hits = (Number(teamState.hits) || 0) + 1;
        careerPlayer.hits = (Number(careerPlayer.hits) || 0) + 1;
      }
    } else {
      flow.pressureLevel = Math.min(5, pressureBefore + (action === 'defend-body' ? 0.75 : 0.45));
      flow.paceContext = flow.zone === 'offensive' ? 'offensive-zone' : 'normal';
    }

    flow.lastEventType = 'career-defense';
    flow.lastEventSide = careerSide;

    const event = {
      id: `live-event-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      type: 'career-defense',
      period: simulation.period,
      clockSecondsRemaining: simulation.clockSecondsRemaining,
      side: careerSide,
      playerId,
      defenseAction: action,
      succeeded,
      possessionChanged,
      successChance,
      pressureBefore,
      pressureAfter: Number(flow.pressureLevel) || 0,
    };
    simulation.events.push(event);
    return { success: true, reason: 'career-defense-resolved', succeeded, possessionChanged, event };
  }

'''
world=world.replace(anchor,resolver+anchor,1)

old_sel="""const selection =\n  pendingCareerDecision?.action === 'shoot'\n    ? {\n        success: true,\n        reason: 'career-decision-shoot',\n        eventType: 'shot-attempt',\n      }\n    : pendingCareerDecision?.action === 'pass'\n      ? {\n          success: true,\n          reason: 'career-decision-pass',\n          eventType: 'career-pass',\n        }\n      : selectNextLiveGameEventType(\n          simulation\n        );"""
new_sel="""const selection =\n  pendingCareerDecision?.action === 'shoot'\n    ? { success: true, reason: 'career-decision-shoot', eventType: 'shot-attempt' }\n    : pendingCareerDecision?.action === 'pass'\n      ? { success: true, reason: 'career-decision-pass', eventType: 'career-pass' }\n      : ['defend-stick', 'defend-body', 'defend-contain'].includes(pendingCareerDecision?.action)\n        ? { success: true, reason: 'career-decision-defense', eventType: 'career-defense' }\n        : selectNextLiveGameEventType(simulation);"""
if old_sel not in world:
    raise SystemExit('world selection anchor missing')
world=world.replace(old_sel,new_sel,1)

case_anchor="""case 'career-pass':\n  resolution =\n    resolveLiveGameCareerPass(\n      simulation,\n      pendingCareerDecision?.playerId || null\n    );\n  break;"""
case_new=case_anchor+"""

case 'career-defense':
  resolution = resolveLiveGameCareerDefense(
    simulation,
    pendingCareerDecision?.playerId || null,
    pendingCareerDecision?.action || 'defend-contain'
  );
  break;"""
if case_anchor not in world:
    raise SystemExit('world switch anchor missing')
world=world.replace(case_anchor,case_new,1)

# GAME: allow opponent possession to produce defensive moments.
old_guard="""    !flow ||\n    flow.stopped === true ||\n    flow.possessionSide !== context.side\n  ) {\n    return false;\n  }\n\n  const zone =\n    flow.zone ||\n    'neutral';\n\n  if (\n    zone !== 'offensive' &&\n    zone !== 'neutral'\n  ) {\n    return false;\n  }"""
new_guard="""    !flow ||\n    flow.stopped === true ||\n    (flow.possessionSide !== 'home' && flow.possessionSide !== 'away')\n  ) {\n    return false;\n  }\n\n  const zone = flow.zone || 'neutral';\n  const careerHasPossession = flow.possessionSide === context.side;\n  const careerIsDefending = flow.possessionSide !== context.side;\n\n  if (careerHasPossession && zone !== 'offensive' && zone !== 'neutral') {\n    return false;\n  }"""
if old_guard not in game:
    raise SystemExit('game possession guard missing')
game=game.replace(old_guard,new_guard,1)

old_chance="""  let chance =\n    zone === 'offensive'\n      ? Math.min(\n          0.20,\n          0.07 +\n          pressure * 0.023\n        )\n      : 0.03;\n\n  if (onPowerPlay) {\n    chance += 0.035;\n  }\n\n  if (lateClutch) {\n    chance += 0.08;\n  }"""
new_chance="""  let chance = careerIsDefending\n    ? Math.min(0.18, 0.055 + pressure * 0.021)\n    : zone === 'offensive'\n      ? Math.min(0.20, 0.07 + pressure * 0.023)\n      : 0.03;\n\n  if (!careerIsDefending && onPowerPlay) chance += 0.035;\n  if (careerIsDefending && careerSkaters < opponentSkaters) chance += 0.035;\n  if (lateClutch) chance += careerIsDefending ? 0.06 : 0.08;"""
if old_chance not in game:
    raise SystemExit('game chance anchor missing')
game=game.replace(old_chance,new_chance,1)

scenario_anchor="""  let scenario = {\n    key: 'offensive-read',"""
defense_prefix="""  let scenario = careerIsDefending ? {\n    key: zone === 'offensive' ? 'defensive-zone-read' : 'backcheck-read',\n    eyebrow: zone === 'offensive' ? 'DEFENSIVE ZONE' : 'BACKCHECK',\n    title: zone === 'offensive'\n      ? 'The puck carrier attacks your layer of coverage.'\n      : 'The rush is coming back at you with speed.',\n    detail: zone === 'offensive'\n      ? 'Choose how aggressively you want to challenge the possession.'\n      : 'Your read can stop the rush or give the attack another lane.',\n    accent: '#7dd3b0',\n    choices: [\n      { action: 'defend-stick', label: 'Attack the puck', note: 'Use your stick and timing to force a takeaway', risk: 'READ' },\n      { action: 'defend-body', label: 'Step into him', note: 'Use strength and body checking to separate puck from player', risk: 'PHYSICAL' },\n      { action: 'defend-contain', label: 'Hold your lane', note: 'Stay disciplined and take away the dangerous option', risk: 'POSITION' },\n    ],\n  } : {\n    key: 'offensive-read',"""
if scenario_anchor not in game:
    raise SystemExit('game scenario anchor missing')
game=game.replace(scenario_anchor,defense_prefix,1)

# Prevent offensive scenario overrides from replacing a defensive scenario.
game=game.replace("  if (zone === 'neutral') {\n    scenario = {","  if (!careerIsDefending && zone === 'neutral') {\n    scenario = {",1)
game=game.replace("  } else if (pressure >= 5) {\n    scenario = {","  } else if (!careerIsDefending && pressure >= 5) {\n    scenario = {",1)
game=game.replace("  } else if (pressure >= 3) {\n    scenario = {","  } else if (!careerIsDefending && pressure >= 3) {\n    scenario = {",1)
game=game.replace("  if (onPowerPlay) {\n    scenario = {","  if (!careerIsDefending && onPowerPlay) {\n    scenario = {",1)
# Clutch remains, but create defensive clutch wording by skipping offensive clutch override while defending.
game=game.replace("  if (lateClutch) {\n    const tied =","  if (lateClutch && !careerIsDefending) {\n    const tied =",1)

# Add defensive event to visible feed.
game=game.replace("      'career-pass',\n    ]);","      'career-pass',\n      'career-defense',\n    ]);",1)

# Outcome detail for career defense.
outcome_anchor="""    } else if (outcomeType === 'career-pass') {"""
outcome_insert="""    } else if (outcomeType === 'career-defense') {
      const defenseAction = String(outcomeEvent?.defenseAction || choice.action || '');
      const succeeded = outcomeEvent?.succeeded === true;
      const wonPuck = outcomeEvent?.possessionChanged === true;
      outcomeTitle = wonPuck
        ? 'You win the puck back.'
        : succeeded
          ? 'You shut the play down.'
          : 'The attacker gets through your pressure.';
      outcomeDetail = wonPuck
        ? `${defenseAction === 'defend-body' ? 'The contact separates him from the puck' : 'Your read creates the takeaway'} · possession flips your way.`
        : succeeded
          ? `Pressure drops from ${Number(outcomeEvent?.pressureBefore || 0).toFixed(1)} to ${Number(outcomeEvent?.pressureAfter || 0).toFixed(1)} and the danger is contained.`
          : `The gamble does not land · opponent pressure rises to ${Number(outcomeEvent?.pressureAfter || 0).toFixed(1)}.`;
      outcomeTag = wonPuck ? 'TAKEAWAY' : succeeded ? 'DEFENDED' : 'BEATEN';
"""+outcome_anchor
if outcome_anchor not in game:
    raise SystemExit('game outcome anchor missing')
game=game.replace(outcome_anchor,outcome_insert,1)

world_path.write_text(world,encoding='utf-8')
game_path.write_text(game,encoding='utf-8')
