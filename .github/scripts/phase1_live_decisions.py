from pathlib import Path
from textwrap import dedent

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text(encoding='utf-8')
world = WORLD.read_text(encoding='utf-8')


def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


# Canonical engine: explicit choices can override only the next event.
world = once(
    world,
    "  function resolveLiveGameShotAttempt(\n    simulation\n  ) {",
    "  function resolveLiveGameShotAttempt(\n    simulation,\n    forcedShooterPlayerId = null\n  ) {",
    'shot signature',
)

world = once(
    world,
    "    const shooterPlayer =\n      getPlayerById(\n        shooter.playerId\n      );",
    dedent('''\
    if (forcedShooterPlayerId) {
      const forcedShooter =
        attackingSkaters.find(
          player =>
            String(player?.playerId || '') ===
            String(forcedShooterPlayerId)
        ) ||
        null;

      if (forcedShooter) {
        shooter =
          forcedShooter;
      }
    }

    const shooterPlayer =
      getPlayerById(
        shooter.playerId
      );'''),
    'forced shooter',
)

hit_marker = dedent('''\
  /*
   * ============================================================
   * LIVE GAME — HIT RESOLUTION
   * ============================================================
   */''')

pass_resolver = dedent('''\
  /*
   * ============================================================
   * LIVE GAME — CAREER PLAYER PASS DECISION
   * ============================================================
   */
  function resolveLiveGameCareerPass(
    simulation,
    playerId
  ) {
    const flow =
      simulation?.flow ||
      null;

    const side =
      flow?.possessionSide ||
      null;

    if (
      !flow ||
      flow.stopped === true ||
      !playerId ||
      (side !== 'home' && side !== 'away')
    ) {
      return {
        success: false,
        reason: 'career-pass-context-invalid',
        event: null,
      };
    }

    const deployment =
      side === 'home'
        ? flow.homeDeployment
        : flow.awayDeployment;

    const defendingDeployment =
      side === 'home'
        ? flow.awayDeployment
        : flow.homeDeployment;

    const passer =
      (Array.isArray(deployment?.skaters)
        ? deployment.skaters
        : []
      ).find(
        player =>
          String(player?.playerId || '') ===
          String(playerId)
      ) ||
      null;

    if (!passer) {
      return {
        success: false,
        reason: 'career-passer-not-deployed',
        event: null,
      };
    }

    const passerAttributes =
      getPlayerById(playerId)
        ?.attributes ||
      {};

    const passSkill =
      (Number(passerAttributes.passing) || 50) * 0.44 +
      (Number(passerAttributes.puckControl) || 50) * 0.22 +
      (Number(passerAttributes.offensiveAwareness) || 50) * 0.21 +
      (Number(passerAttributes.poise) || 50) * 0.13;

    const defenders =
      Array.isArray(defendingDeployment?.skaters)
        ? defendingDeployment.skaters
        : [];

    const defensivePressure =
      defenders.length
        ? defenders.reduce(
            (total, defender) => {
              const attrs =
                getPlayerById(defender.playerId)
                  ?.attributes ||
                {};
              return total +
                (Number(attrs.stickChecking) || 50) * 0.55 +
                (Number(attrs.defensiveAwareness) || 50) * 0.45;
            },
            0
          ) / defenders.length
        : 50;

    const successChance =
      Math.max(
        0.46,
        Math.min(
          0.91,
          0.70 +
          (passSkill - defensivePressure) * 0.006
        )
      );

    const completed =
      Math.random() < successChance;

    if (completed) {
      flow.zone =
        flow.zone === 'defensive'
          ? 'neutral'
          : 'offensive';
      flow.paceContext =
        'offensive-zone';
      flow.pressureLevel =
        Math.min(
          5,
          (Number(flow.pressureLevel) || 0) + 1.25
        );
      flow.lastEventType =
        'career-pass';
      flow.lastEventSide =
        side;

      recordLiveGamePossessionTouch(
        simulation,
        side,
        playerId,
        'career-pass'
      );

      const event = {
        id: `live-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'career-pass',
        period: simulation.period,
        clockSecondsRemaining: simulation.clockSecondsRemaining,
        side,
        playerId,
        completed: true,
        successChance,
      };

      simulation.events.push(event);

      return {
        success: true,
        reason: 'career-pass-completed',
        completed: true,
        event,
      };
    }

    const defendingSide =
      side === 'home'
        ? 'away'
        : 'home';
    const attackingTeam =
      side === 'home'
        ? simulation.home
        : simulation.away;

    attackingTeam.giveaways =
      (Number(attackingTeam.giveaways) || 0) + 1;
    passer.giveaways =
      (Number(passer.giveaways) || 0) + 1;

    flow.possessionSide =
      defendingSide;
    flow.zone =
      flow.zone === 'offensive'
        ? 'defensive'
        : flow.zone === 'defensive'
          ? 'offensive'
          : 'neutral';
    flow.paceContext =
      'transition';
    flow.pressureLevel =
      0;
    flow.recentPossessionTouches =
      [];
    flow.lastEventType =
      'giveaway';
    flow.lastEventSide =
      defendingSide;

    const event = {
      id: `live-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'turnover',
      period: simulation.period,
      clockSecondsRemaining: simulation.clockSecondsRemaining,
      giveawaySide: side,
      takeawaySide: defendingSide,
      giveawayPlayerId: playerId,
      takeawayPlayerId: null,
      creditedTakeaway: false,
      possessionChanged: true,
      careerDecision: 'pass',
      successChance,
    };

    simulation.events.push(event);

    return {
      success: true,
      reason: 'career-pass-missed',
      completed: false,
      event,
    };
  }

''')

world = once(world, hit_marker, pass_resolver + hit_marker, 'pass resolver')

world = once(
    world,
    "    const selection =\n      selectNextLiveGameEventType(\n        simulation\n      );",
    dedent('''\
    const pendingCareerDecision =
      simulation.pendingCareerDecision &&
      typeof simulation.pendingCareerDecision === 'object'
        ? simulation.pendingCareerDecision
        : null;

    simulation.pendingCareerDecision =
      null;

    const selection =
      pendingCareerDecision?.action === 'shoot'
        ? {
            success: true,
            reason: 'career-decision-shoot',
            eventType: 'shot-attempt',
          }
        : pendingCareerDecision?.action === 'pass'
          ? {
              success: true,
              reason: 'career-decision-pass',
              eventType: 'career-pass',
            }
          : selectNextLiveGameEventType(
              simulation
            );'''),
    'event override',
)

world = once(
    world,
    "          resolveLiveGameShotAttempt(\n            simulation\n          );",
    dedent('''\
          resolveLiveGameShotAttempt(
            simulation,
            pendingCareerDecision?.action === 'shoot'
              ? pendingCareerDecision.playerId
              : null
          );'''),
    'shot call',
)

hit_case = dedent('''\
      case 'hit':
        resolution =
          resolveLiveGameHit(
            simulation
          );
        break;''')
world = once(
    world,
    hit_case,
    dedent('''\
      case 'career-pass':
        resolution =
          resolveLiveGameCareerPass(
            simulation,
            pendingCareerDecision?.playerId || null
          );
        break;

''') + hit_case,
    'pass case',
)

# Presentation state.
game = once(
    game,
    "let liveGameCareerTOISeconds =\n  0;",
    "let liveGameCareerTOISeconds =\n  0;\n\nlet liveGameCareerDecisionOpen =\n  false;\n\nlet liveGameCareerDecisionCooldownSteps =\n  0;",
    'decision globals',
)

game = once(
    game,
    "  liveGameCareerTOISeconds =\n    0;\n\n  liveGameCompletionHandled =\n    false;",
    "  liveGameCareerTOISeconds =\n    0;\n\n  liveGameCareerDecisionOpen =\n    false;\n\n  liveGameCareerDecisionCooldownSteps =\n    0;\n\n  document.getElementById(\n    'live-game-career-decision'\n  )?.remove();\n\n  liveGameCompletionHandled =\n    false;",
    'decision reset',
)

decision_ui = dedent('''\
function closeLiveGameCareerDecision() {
  document.getElementById(
    'live-game-career-decision'
  )?.remove();
  liveGameCareerDecisionOpen =
    false;
}

function submitLiveGameCareerDecision(action) {
  if (
    !activeLiveGame ||
    !liveGameCareerPlayerId ||
    !liveGameCareerDecisionOpen
  ) {
    return;
  }

  activeLiveGame.pendingCareerDecision = {
    action,
    playerId: liveGameCareerPlayerId,
    period: activeLiveGame.period,
    clockSecondsRemaining:
      activeLiveGame.clockSecondsRemaining,
  };

  closeLiveGameCareerDecision();
  liveGameCareerDecisionCooldownSteps =
    10;
  startLiveGamePlayback(
    liveGamePlaybackSpeed
  );
}

function maybeOpenLiveGameCareerDecision() {
  if (
    liveGameCareerDecisionOpen ||
    !activeLiveGame ||
    activeLiveGame.gameComplete === true
  ) {
    return liveGameCareerDecisionOpen;
  }

  if (liveGameCareerDecisionCooldownSteps > 0) {
    liveGameCareerDecisionCooldownSteps -= 1;
    return false;
  }

  const context =
    getLiveCareerPlayerContext();
  const flow =
    activeLiveGame.flow || null;

  if (
    !context?.onIce ||
    context.inPenaltyBox ||
    !flow ||
    flow.stopped === true ||
    flow.possessionSide !== context.side
  ) {
    return false;
  }

  const zone =
    flow.zone || 'neutral';

  if (zone !== 'offensive' && zone !== 'neutral') {
    return false;
  }

  const pressure =
    Number(flow.pressureLevel) || 0;
  const chance =
    zone === 'offensive'
      ? Math.min(0.22, 0.08 + pressure * 0.025)
      : 0.035;

  if (Math.random() >= chance) {
    return false;
  }

  pauseLiveGamePlayback();
  liveGameCareerDecisionOpen =
    true;

  const card =
    document.createElement('div');
  card.id =
    'live-game-career-decision';
  card.style.cssText = `
    position:absolute;left:14px;right:14px;bottom:18px;z-index:30;
    padding:14px;border:1px solid rgba(116,169,255,.34);
    border-radius:16px;background:rgba(7,22,48,.97);
    box-shadow:0 14px 38px rgba(0,0,0,.35);
  `;

  card.innerHTML = `
    <div style="font-size:11px;font-weight:800;letter-spacing:.08em;color:#7fb2ff;text-transform:uppercase;">
      Your Moment · ${zone === 'offensive' ? 'Offensive zone' : 'Transition'}
    </div>
    <div style="margin-top:5px;font-size:15px;font-weight:800;color:#fff;">
      You have the puck. What do you do?
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px;">
      <button type="button" data-career-live-choice="pass" style="padding:11px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);color:#fff;font-weight:800;">Pass</button>
      <button type="button" data-career-live-choice="shoot" style="padding:11px 10px;border-radius:12px;border:1px solid rgba(116,169,255,.48);background:rgba(35,103,210,.32);color:#fff;font-weight:800;">Shoot</button>
    </div>
  `;

  card.querySelectorAll(
    '[data-career-live-choice]'
  ).forEach(button => {
    button.addEventListener('click', () => {
      submitLiveGameCareerDecision(
        button.dataset.careerLiveChoice
      );
    });
  });

  liveGameScreen.appendChild(card);
  return true;
}

''')

game = once(
    game,
    'function advanceLiveGamePresentationStep() {',
    decision_ui + 'function advanceLiveGamePresentationStep() {',
    'decision UI',
)

game = once(
    game,
    "  const careerContextBefore =\n    getLiveCareerPlayerContext();",
    "  if (maybeOpenLiveGameCareerDecision()) {\n    return {\n      success: true,\n      elapsedSeconds: 0,\n      gameComplete: false,\n      decisionPending: true,\n    };\n  }\n\n  const careerContextBefore =\n    getLiveCareerPlayerContext();",
    'step guard',
)

game = once(
    game,
    "    elapsedSeconds +=\n      Math.max(\n        0,\n        Number(\n          stepResult\n            .elapsedSeconds\n        ) || 0\n      );",
    "    if (stepResult.decisionPending === true) {\n      return {\n        success: true,\n        elapsedSeconds,\n        gameComplete: false,\n        safetySteps,\n        decisionPending: true,\n      };\n    }\n\n    elapsedSeconds +=\n      Math.max(\n        0,\n        Number(\n          stepResult\n            .elapsedSeconds\n        ) || 0\n      );",
    'chunk guard',
)

game = once(
    game,
    "  /*\n   * The game has reached its canonical ending.\n   * Final result / postgame application comes in the next\n   * roadmap step.\n   */",
    "  if (result.decisionPending === true) {\n    return;\n  }\n\n  /*\n   * The game has reached its canonical ending.\n   * Final result / postgame application comes in the next\n   * roadmap step.\n   */",
    'scheduler guard',
)

game = once(
    game,
    "      'goal',\n      'penalty',",
    "      'goal',\n      'penalty',\n      'career-pass',",
    'feed visibility',
)

penalty_marker = dedent('''\
  /*
   * ==========================================================
   * PENALTY
   * ==========================================================
   */''')
pass_text = dedent('''\
  if (eventType === 'career-pass') {
    const passer =
      getLivePresentationPlayer(event.playerId);
    const name =
      passer?.name || 'Career Player';
    const label =
      passer?.jerseyNumber
        ? `#${passer.jerseyNumber} ${name}`
        : name;

    return {
      primary: `PASS — ${label}`,
      secondary: 'Completed · possession continues',
    };
  }

''')
game = once(game, penalty_marker, pass_text + penalty_marker, 'pass feed text')

GAME.write_text(game, encoding='utf-8')
WORLD.write_text(world, encoding='utf-8')
print('Phase 1 live decisions patched successfully.')
