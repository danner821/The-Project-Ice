from pathlib import Path

game_path=Path('artifacts/project-ice/public/game.js')
world_path=Path('artifacts/project-ice/public/world.js')
game=game_path.read_text(encoding='utf-8')
world=world_path.read_text(encoding='utf-8')

# 1) Schedule tab always opens on the canonical career month.
old_schedule="""  if (tabId === 'schedule') {
    refreshScheduleEvents();

    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );

    renderScheduleKeyEvents();
  }
"""
new_schedule="""  if (tabId === 'schedule') {
    refreshScheduleEvents();

    /*
     * Always enter Schedule on the career's canonical current month.
     * Manual month navigation still works normally after the tab opens.
     */
    const scheduleCurrentDate =
      WorldEngine.state?.season?.currentDate ||
      Game.player?.currentDate ||
      null;

    const scheduleDateMatch =
      String(scheduleCurrentDate || '')
        .match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);

    if (scheduleDateMatch) {
      scheduleViewYear =
        Number(scheduleDateMatch[1]);

      scheduleViewMonth =
        Math.max(
          0,
          Math.min(
            11,
            Number(scheduleDateMatch[2]) - 1
          )
        );
    }

    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );

    renderScheduleKeyEvents();
  }
"""
if old_schedule not in game:
    raise SystemExit('schedule tab block not found')
game=game.replace(old_schedule,new_schedule,1)

# 2) Replace automatic outcome toast with a persistent paused result + Resume Game.
start=game.find('  if (liveGameCareerDecisionLastChoice) {')
end=game.find('  newEvents.forEach(',start)
if start<0 or end<0:
    raise SystemExit('career outcome block not found')
new_outcome=r'''  if (liveGameCareerDecisionLastChoice) {
    const choice =
      liveGameCareerDecisionLastChoice;

    const outcomeEvent =
      newEvents[newEvents.length - 1] ||
      step.event ||
      null;

    const outcomeType =
      String(outcomeEvent?.type || '');

    const eventText =
      outcomeEvent
        ? getLivePresentationEventText(outcomeEvent)
        : null;

    const contextAfterChoice =
      getLiveCareerPlayerContext();

    const careerScore =
      contextAfterChoice?.side === 'home'
        ? Number(activeLiveGame.home?.score) || 0
        : Number(activeLiveGame.away?.score) || 0;

    const opponentScore =
      contextAfterChoice?.side === 'home'
        ? Number(activeLiveGame.away?.score) || 0
        : Number(activeLiveGame.home?.score) || 0;

    const pressureAfter =
      Number(activeLiveGame.flow?.pressureLevel) || 0;

    let resultTag =
      choice.action === 'hold'
        ? 'POISE'
        : choice.action === 'pass'
          ? 'CREATE'
          : 'ATTACK';

    let outcomeTitle =
      choice.action === 'hold'
        ? 'You stay composed and let the play develop.'
        : choice.action === 'pass'
          ? 'You move the puck.'
          : 'You attack the net.';

    let outcomeDetail =
      eventText?.secondary ||
      'Play develops from your decision.';

    let impactDetail =
      `Offensive pressure: ${pressureAfter}`;

    if (outcomeType === 'goal') {
      resultTag = 'IMPACT';
      outcomeTitle =
        eventText?.primary ||
        'GOAL — your decision pays off.';
      outcomeDetail =
        eventText?.secondary ||
        'A huge moment in the game.';
      impactDetail =
        `Score now ${careerScore}-${opponentScore}`;
    } else if (
      outcomeType === 'shot' ||
      outcomeType === 'shot-on-goal' ||
      outcomeType === 'shot-saved'
    ) {
      resultTag = 'CHANCE';
      outcomeTitle =
        eventText?.primary ||
        'You create a shooting chance.';
      outcomeDetail =
        eventText?.secondary ||
        'The possession produces a shot.';
      impactDetail =
        `Score ${careerScore}-${opponentScore} · pressure ${pressureAfter}`;
    } else if (outcomeType === 'career-pass') {
      resultTag = 'CREATED';
      outcomeTitle =
        'Pass completed — possession stays alive.';
      outcomeDetail =
        'Your read keeps the attack moving and gives your team another action.';
      impactDetail =
        `Offensive pressure builds to ${pressureAfter}`;
    } else if (outcomeType === 'turnover') {
      resultTag = 'TURNOVER';
      outcomeTitle =
        'The defense reads the play.';
      outcomeDetail =
        'Your possession ends and the puck goes the other way.';
      impactDetail =
        `Score remains ${careerScore}-${opponentScore}`;
    } else if (choice.action === 'hold') {
      resultTag = 'POISE';
      outcomeTitle =
        'You stay patient and let the play breathe.';
      outcomeDetail =
        eventText?.primary ||
        'The next layer of the possession develops around you.';
      impactDetail =
        eventText?.secondary ||
        `Offensive pressure: ${pressureAfter}`;
    }

    /*
     * The result itself is now a player moment too.
     * Freeze the live game until the user has had time to absorb it.
     */
    pauseLiveGamePlayback();

    document.getElementById(
      'live-game-career-outcome'
    )?.remove();

    const outcome =
      document.createElement('div');

    outcome.id =
      'live-game-career-outcome';

    outcome.style.cssText = `
      position:absolute;
      inset:0;
      z-index:38;
      display:flex;
      align-items:flex-end;
      padding:18px 14px 20px;
      background:linear-gradient(180deg,rgba(2,10,23,.12) 0%,rgba(2,9,22,.66) 46%,rgba(1,7,17,.96) 100%);
      backdrop-filter:blur(2px);
    `;

    outcome.innerHTML = `
      <div style="width:100%;border:1px solid rgba(113,164,239,.30);border-radius:20px;padding:16px;background:rgba(5,17,38,.985);box-shadow:0 18px 45px rgba(0,0,0,.48);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div style="font-size:9px;font-weight:900;letter-spacing:.14em;color:#7fb2ff;">${String(choice.scenario || 'YOUR MOMENT').toUpperCase()}</div>
          <div style="font-size:9px;font-weight:900;letter-spacing:.12em;color:#f1c86a;">${resultTag}</div>
        </div>
        <div style="margin-top:7px;font-size:11px;font-weight:800;color:rgba(197,215,242,.68);">YOU CHOSE · ${String(choice.label || choice.action).toUpperCase()}</div>
        <div style="margin-top:5px;font-size:18px;line-height:1.2;font-weight:900;color:#fff;">${outcomeTitle}</div>
        <div style="margin-top:6px;font-size:12px;line-height:1.45;color:rgba(211,224,244,.75);">${outcomeDetail}</div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:10px;line-height:1.35;color:rgba(177,198,228,.58);">${impactDetail} · ${getLivePresentationPeriodLabel(activeLiveGame.period)} ${formatLivePresentationClock(activeLiveGame.clockSecondsRemaining)} · ${careerScore}-${opponentScore}</div>
        <button id="live-game-career-outcome-resume" type="button" style="width:100%;margin-top:13px;padding:12px 14px;border-radius:13px;border:1px solid rgba(116,169,255,.48);background:rgba(35,103,210,.32);color:#fff;font-size:13px;font-weight:900;letter-spacing:.02em;">Resume Game</button>
      </div>
    `;

    liveGameScreen.appendChild(outcome);

    document.getElementById(
      'live-game-career-outcome-resume'
    )?.addEventListener(
      'click',
      () => {
        outcome.remove();
        startLiveGamePlayback(
          liveGamePlaybackSpeed
        );
      }
    );

    liveGameCareerDecisionLastChoice =
      null;
  }

'''
game=game[:start]+new_outcome+game[end:]

game_path.write_text(game,encoding='utf-8')

# 3) Tighten even-strength deployment around role targets by balancing accumulated shifts.
fn_start=world.find('function selectLiveGameEvenStrengthDeployment(')
fn_end=world.find('\n  function ',fn_start+20)
if fn_start<0 or fn_end<0:
    raise SystemExit('even strength selector not found')
replacement=r'''function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason: 'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason: 'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * These remain the role-based even-strength usage targets.
     * Instead of independently rerolling every shift, selection now
     * balances each line/pair back toward its target share. This keeps
     * realistic game-to-game variation without producing wild TOI swings.
     */
    const forwardLineWeights = [
      { line: 1, weight: 34 },
      { line: 2, weight: 28 },
      { line: 3, weight: 22 },
      { line: 4, weight: 16 },
    ];

    const defensePairWeights = [
      { pair: 1, weight: 42 },
      { pair: 2, weight: 34 },
      { pair: 3, weight: 24 },
    ];

    if (!simulation.flow.deploymentUsage) {
      simulation.flow.deploymentUsage = {
        home: {
          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },
          defensePairs: { 1: 0, 2: 0, 3: 0 },
        },
        away: {
          forwardLines: { 1: 0, 2: 0, 3: 0, 4: 0 },
          defensePairs: { 1: 0, 2: 0, 3: 0 },
        },
      };
    }

    const usage =
      simulation.flow.deploymentUsage[side];

    const balancedPick = (
      weightedOptions,
      usageMap,
      key
    ) => {
      const totalWeight =
        weightedOptions.reduce(
          (sum, option) =>
            sum + Math.max(0, Number(option.weight) || 0),
          0
        );

      const totalSelections =
        Object.values(usageMap).reduce(
          (sum, value) => sum + (Number(value) || 0),
          0
        );

      let best = null;
      let bestScore = -Infinity;

      weightedOptions.forEach(option => {
        const id =
          Number(option[key]);
        const targetShare =
          totalWeight > 0
            ? (Number(option.weight) || 0) / totalWeight
            : 0;
        const actualCount =
          Number(usageMap[id]) || 0;
        const targetCountAfterNext =
          (totalSelections + 1) * targetShare;

        /*
         * Large deficit term keeps usage near role targets.
         * Small jitter preserves natural shift-to-shift variation.
         */
        const score =
          (targetCountAfterNext - actualCount) * 100 +
          Math.random() * 10;

        if (score > bestScore) {
          bestScore = score;
          best = option;
        }
      });

      return best || weightedOptions[0] || null;
    };

    const selectedForwardLine =
      balancedPick(
        forwardLineWeights,
        usage.forwardLines,
        'line'
      );

    const selectedDefensePair =
      balancedPick(
        defensePairWeights,
        usage.defensePairs,
        'pair'
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason: 'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation: 'even-strength',
          forwardLine: selectedForwardLine.line,
          defensePair: selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason: 'deployment-resolution-failed',
        deployment: deployment || null,
      };
    }

    usage.forwardLines[
      selectedForwardLine.line
    ] =
      (Number(
        usage.forwardLines[
          selectedForwardLine.line
        ]
      ) || 0) + 1;

    usage.defensePairs[
      selectedDefensePair.pair
    ] =
      (Number(
        usage.defensePairs[
          selectedDefensePair.pair
        ]
      ) || 0) + 1;

    return {
      success: true,
      reason: 'even-strength-deployment-selected',
      side,
      forwardLine: selectedForwardLine.line,
      defensePair: selectedDefensePair.pair,
      deployment,
    };
  }
'''
world=world[:fn_start]+replacement+world[fn_end:]
world_path.write_text(world,encoding='utf-8')
