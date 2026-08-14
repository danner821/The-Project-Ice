from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')


def replace_function(source, name, replacement, next_name):
    start_token = f'function {name}('
    next_token = f'function {next_name}('
    start = source.find(start_token)
    if start < 0:
        raise SystemExit(f'missing function {name}')
    end = source.find(next_token, start)
    if end < 0:
        raise SystemExit(f'missing next function {next_name}')
    return source[:start] + replacement.rstrip() + '\n\n' + source[end:]

submit_fn = r'''function submitLiveGameCareerDecision(
  action,
  choiceLabel = '',
  choiceRisk = '',
  scenarioLabel = ''
) {
  if (
    !activeLiveGame ||
    !liveGameCareerPlayerId ||
    !liveGameCareerDecisionOpen
  ) {
    return;
  }

  const decisionCard =
    document.getElementById(
      'live-game-career-decision'
    );

  if (decisionCard) {
    decisionCard
      .querySelectorAll('button')
      .forEach(button => {
        button.disabled = true;
        button.style.opacity = '.55';
      });
  }

  const context =
    getLiveCareerPlayerContext();

  const careerScore =
    context?.side === 'home'
      ? Number(activeLiveGame.home?.score) || 0
      : Number(activeLiveGame.away?.score) || 0;

  const opponentScore =
    context?.side === 'home'
      ? Number(activeLiveGame.away?.score) || 0
      : Number(activeLiveGame.home?.score) || 0;

  liveGameCareerDecisionLastChoice = {
    action,
    label:
      choiceLabel ||
      (action === 'shoot'
        ? 'Shoot'
        : action === 'pass'
          ? 'Pass'
          : 'Hold the puck'),
    risk:
      choiceRisk ||
      'READ',
    scenario:
      scenarioLabel ||
      'YOUR MOMENT',
    period:
      activeLiveGame.period,
    clockSecondsRemaining:
      activeLiveGame.clockSecondsRemaining,
    careerScore,
    opponentScore,
    pressureBefore:
      Number(activeLiveGame.flow?.pressureLevel) || 0,
  };

  activeLiveGame.pendingCareerDecision = {
    action,
    playerId:
      liveGameCareerPlayerId,
    period:
      activeLiveGame.period,
    clockSecondsRemaining:
      activeLiveGame.clockSecondsRemaining,
  };

  closeLiveGameCareerDecision();

  liveGameCareerDecisionCooldownSteps =
    11;

  startLiveGamePlayback(
    liveGamePlaybackSpeed
  );
}'''

maybe_fn = r'''function maybeOpenLiveGameCareerDecision() {
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
    activeLiveGame.flow ||
    null;

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
    flow.zone ||
    'neutral';

  if (
    zone !== 'offensive' &&
    zone !== 'neutral'
  ) {
    return false;
  }

  const period =
    Number(activeLiveGame.period) || 1;

  const clock =
    Number(activeLiveGame.clockSecondsRemaining) || 0;

  const careerScore =
    context.side === 'home'
      ? Number(activeLiveGame.home?.score) || 0
      : Number(activeLiveGame.away?.score) || 0;

  const opponentScore =
    context.side === 'home'
      ? Number(activeLiveGame.away?.score) || 0
      : Number(activeLiveGame.home?.score) || 0;

  const scoreDiff =
    careerScore -
    opponentScore;

  const homeSkaters =
    Math.max(
      3,
      Number(activeLiveGame.specialTeams?.homeSkaters) || 5
    );

  const awaySkaters =
    Math.max(
      3,
      Number(activeLiveGame.specialTeams?.awaySkaters) || 5
    );

  const careerSkaters =
    context.side === 'home'
      ? homeSkaters
      : awaySkaters;

  const opponentSkaters =
    context.side === 'home'
      ? awaySkaters
      : homeSkaters;

  const onPowerPlay =
    careerSkaters >
    opponentSkaters;

  const lateClutch =
    period >= 3 &&
    clock <= 300 &&
    Math.abs(scoreDiff) <= 1;

  const pressure =
    Number(flow.pressureLevel) ||
    0;

  let chance =
    zone === 'offensive'
      ? Math.min(
          0.20,
          0.07 +
          pressure * 0.023
        )
      : 0.03;

  if (onPowerPlay) {
    chance += 0.035;
  }

  if (lateClutch) {
    chance += 0.08;
  }

  if (Math.random() >= chance) {
    return false;
  }

  pauseLiveGamePlayback();
  liveGameCareerDecisionOpen =
    true;

  let scenario = {
    key: 'offensive-read',
    eyebrow: 'OFFENSIVE ZONE',
    title: 'You receive the puck with room to work.',
    detail: 'The defense is set, but you have enough space to dictate the next move.',
    accent: '#6aa8ff',
    choices: [
      {
        action: 'shoot',
        label: 'Attack the net',
        note: 'Turn the possession into a shot now',
        risk: 'AGGRESSIVE',
      },
      {
        action: 'pass',
        label: 'Find the open man',
        note: 'Use vision and passing to extend the attack',
        risk: 'CREATE',
      },
      {
        action: 'hold',
        label: 'Protect and scan',
        note: 'Keep possession and wait for a better lane',
        risk: 'POISE',
      },
    ],
  };

  if (zone === 'neutral') {
    scenario = {
      key: 'transition-rush',
      eyebrow: 'TRANSITION RUSH',
      title: 'You carry the puck at a retreating defense.',
      detail: 'The gap is still forming. Your next touch decides whether the rush becomes a chance.',
      accent: '#75b7ff',
      choices: [
        {
          action: 'shoot',
          label: 'Drive and fire',
          note: 'Attack before the defense can set',
          risk: 'ATTACK',
        },
        {
          action: 'pass',
          label: 'Hit the trailer',
          note: 'Move the puck into the developing lane',
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
  } else if (pressure >= 5) {
    scenario = {
      key: 'net-front-chaos',
      eyebrow: 'NET-FRONT CHAOS',
      title: 'The defense is scrambling around its own crease.',
      detail: 'Bodies are collapsing toward the net and the goalie is fighting through traffic.',
      accent: '#ffbe66',
      choices: [
        {
          action: 'shoot',
          label: 'Put it through traffic',
          note: 'Trust the chaos and get the puck on goal',
          risk: 'FINISH',
        },
        {
          action: 'pass',
          label: 'Slip it across',
          note: 'Look for a teammate outside the collapse',
          risk: 'CREATE',
        },
        {
          action: 'hold',
          label: 'Pull it back',
          note: 'Escape the traffic and reset the possession',
          risk: 'COMPOSED',
        },
      ],
    };
  } else if (pressure >= 3) {
    scenario = {
      key: 'high-danger-read',
      eyebrow: 'HIGH-DANGER READ',
      title: 'A dangerous lane opens in front of you.',
      detail: 'You have a brief window before the defense closes it down.',
      accent: '#84c6ff',
      choices: [
        {
          action: 'shoot',
          label: 'Take the lane',
          note: 'Use the opening before it disappears',
          risk: 'DECISIVE',
        },
        {
          action: 'pass',
          label: 'Draw and dish',
          note: 'Pull pressure toward you and move the puck',
          risk: 'PLAYMAKE',
        },
        {
          action: 'hold',
          label: 'Stay on it',
          note: 'Protect the puck and force another defensive read',
          risk: 'POISE',
        },
      ],
    };
  }

  if (onPowerPlay) {
    scenario = {
      key: 'power-play-read',
      eyebrow: 'POWER PLAY',
      title: 'The penalty kill collapses toward your side.',
      detail: 'One clean decision can shift the entire box and create the best look of the shift.',
      accent: '#f0bf55',
      choices: [
        {
          action: 'shoot',
          label: 'Shoot through the screen',
          note: 'Get it to the net while the goalie is fighting traffic',
          risk: 'PRESSURE',
        },
        {
          action: 'pass',
          label: 'Work it through the seam',
          note: 'Use your vision to force the penalty kill to rotate',
          risk: 'CREATE',
        },
        {
          action: 'hold',
          label: 'Reset the setup',
          note: 'Keep possession and make the killers move again',
          risk: 'PATIENT',
        },
      ],
    };
  }

  if (lateClutch) {
    const tied =
      scoreDiff === 0;

    scenario = {
      key: 'clutch-possession',
      eyebrow:
        tied
          ? 'CLUTCH MOMENT · TIE GAME'
          : scoreDiff < 0
            ? 'CLUTCH MOMENT · NEED A GOAL'
            : 'CLUTCH MOMENT · PROTECT THE LEAD',
      title:
        tied
          ? 'This possession could decide the game.'
          : scoreDiff < 0
            ? 'Time is running out. The puck is on your stick.'
            : 'A smart decision here can drain precious time.',
      detail:
        `${getLivePresentationPeriodLabel(period)} · ${formatLivePresentationClock(clock)} · ${careerScore}-${opponentScore}`,
      accent: '#f5d06f',
      choices:
        scoreDiff > 0
          ? [
              {
                action: 'hold',
                label: 'Protect the puck',
                note: 'Make them chase you and burn clock',
                risk: 'SAFE',
              },
              {
                action: 'pass',
                label: 'Find support',
                note: 'Move it to the safest open teammate',
                risk: 'SMART',
              },
              {
                action: 'shoot',
                label: 'Go for the dagger',
                note: 'Attack before they can recover',
                risk: 'BOLD',
              },
            ]
          : [
              {
                action: 'shoot',
                label: tied ? 'Take the big shot' : 'Fire it now',
                note: 'Put the moment on your stick',
                risk: 'CLUTCH',
              },
              {
                action: 'pass',
                label: 'Find the best look',
                note: 'Trust your vision under pressure',
                risk: 'CREATE',
              },
              {
                action: 'hold',
                label: 'Wait for the lane',
                note: 'Stay composed and refuse a bad attempt',
                risk: 'POISE',
              },
            ],
    };
  }

  const card =
    document.createElement('div');

  card.id =
    'live-game-career-decision';

  card.style.cssText = `
    position:absolute;
    inset:0;
    z-index:40;
    display:flex;
    align-items:flex-end;
    padding:18px 14px 20px;
    background:linear-gradient(180deg,rgba(2,10,23,.20) 0%,rgba(2,9,22,.72) 42%,rgba(1,7,17,.96) 100%);
    backdrop-filter:blur(2px);
  `;

  const choiceMarkup =
    scenario.choices
      .map(
        (choice, index) => `
          <button
            type="button"
            data-career-live-choice="${choice.action}"
            data-career-live-label="${choice.label}"
            data-career-live-risk="${choice.risk}"
            data-career-live-scenario="${scenario.eyebrow}"
            style="
              width:100%;
              text-align:left;
              border:1px solid ${index === 0 ? scenario.accent : 'rgba(255,255,255,.13)'};
              border-radius:14px;
              padding:12px 13px;
              background:${index === 0 ? 'rgba(35,103,210,.23)' : 'rgba(255,255,255,.055)'};
              color:#fff;
            "
          >
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
              <span style="font-size:14px;font-weight:850;">${choice.label}</span>
              <span style="font-size:9px;font-weight:900;letter-spacing:.11em;color:${scenario.accent};">${choice.risk}</span>
            </div>
            <div style="margin-top:3px;font-size:11px;line-height:1.3;color:rgba(208,222,244,.67);">${choice.note}</div>
          </button>
        `
      )
      .join('');

  card.innerHTML = `
    <div style="width:100%;border:1px solid rgba(120,167,235,.25);border-radius:20px;padding:16px;background:rgba(5,17,38,.98);box-shadow:0 18px 45px rgba(0,0,0,.50);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="font-size:10px;font-weight:900;letter-spacing:.15em;color:${scenario.accent};">YOUR MOMENT · ${scenario.eyebrow}</div>
        <div style="font-size:10px;font-weight:800;color:rgba(190,208,234,.58);">${getLivePresentationPeriodLabel(period)} · ${formatLivePresentationClock(clock)}</div>
      </div>
      <div style="margin-top:8px;font-size:19px;line-height:1.15;font-weight:900;color:#fff;">${scenario.title}</div>
      <div style="margin-top:6px;font-size:12px;line-height:1.4;color:rgba(207,220,241,.72);">${scenario.detail}</div>
      <div style="margin-top:9px;font-size:10px;font-weight:800;color:rgba(180,202,235,.52);">SCORE ${careerScore}-${opponentScore} · PRESSURE ${Math.round(pressure)}</div>
      <div style="display:grid;gap:8px;margin-top:14px;">${choiceMarkup}</div>
      <div style="margin-top:10px;text-align:center;font-size:9px;letter-spacing:.09em;color:rgba(171,190,220,.42);">YOUR ATTRIBUTES + GAME CONTEXT RESOLVE THE RESULT</div>
    </div>
  `;

  card.querySelectorAll(
    '[data-career-live-choice]'
  ).forEach(button => {
    button.addEventListener('click', () => {
      submitLiveGameCareerDecision(
        button.dataset.careerLiveChoice,
        button.dataset.careerLiveLabel,
        button.dataset.careerLiveRisk,
        button.dataset.careerLiveScenario
      );
    });
  });

  liveGameScreen.appendChild(card);
  return true;
}'''

text = replace_function(
    text,
    'submitLiveGameCareerDecision',
    submit_fn,
    'maybeOpenLiveGameCareerDecision',
)

text = replace_function(
    text,
    'maybeOpenLiveGameCareerDecision',
    maybe_fn,
    'advanceLiveGamePresentationStep',
)

old_start = "  if (liveGameCareerDecisionLastChoice) {\n"
old_end = "  newEvents.forEach(\n    event => {"
start = text.find(old_start)
end = text.find(old_end, start)
if start < 0 or end < 0:
    raise SystemExit('outcome feedback block not found')

feedback = r'''  if (liveGameCareerDecisionLastChoice) {
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

    let outcomeTitle =
      choice.action === 'hold'
        ? 'You stay patient and keep reading the play.'
        : choice.action === 'pass'
          ? 'You try to create for a teammate.'
          : 'You commit to attacking the net.';

    let outcomeDetail =
      'The possession continues through the live engine.';

    let outcomeTag =
      choice.risk ||
      'DECISION';

    if (outcomeType === 'goal') {
      outcomeTitle =
        'GOAL — the possession turns into a finish.';
      outcomeDetail =
        eventText?.secondary ||
        'Your choice directly helped create the biggest result possible.';
      outcomeTag =
        'IMPACT';
    } else if (
      outcomeType === 'shot' ||
      outcomeType === 'shot-on-goal' ||
      outcomeType === 'shot-saved'
    ) {
      outcomeTitle =
        eventText?.primary ||
        'You create a shot.';
      outcomeDetail =
        eventText?.secondary ||
        'The decision produces a real attempt through the canonical shot resolver.';
      outcomeTag =
        'CHANCE';
    } else if (outcomeType === 'career-pass') {
      outcomeTitle =
        'Pass completed — possession stays alive.';
      outcomeDetail =
        `The puck moves cleanly and your team keeps attacking. Pressure is now ${Math.round(Number(activeLiveGame.flow?.pressureLevel) || 0)}.`;
      outcomeTag =
        'CREATED';
    } else if (outcomeType === 'turnover') {
      outcomeTitle =
        'The play is broken up.';
      outcomeDetail =
        'The defense reads the decision and possession goes the other way.';
      outcomeTag =
        'TURNOVER';
    } else if (choice.action === 'hold') {
      outcomeTitle =
        'You refuse the first option and let the play breathe.';
      outcomeDetail =
        outcomeEvent
          ? `${eventText?.primary || 'Play develops'}${eventText?.secondary ? ` · ${eventText.secondary}` : ''}`
          : 'You keep the sequence alive without forcing a low-quality play.';
      outcomeTag =
        'POISE';
    }

    const currentContext =
      getLiveCareerPlayerContext();

    const currentCareerScore =
      currentContext?.side === 'home'
        ? Number(activeLiveGame.home?.score) || 0
        : Number(activeLiveGame.away?.score) || 0;

    const currentOpponentScore =
      currentContext?.side === 'home'
        ? Number(activeLiveGame.away?.score) || 0
        : Number(activeLiveGame.home?.score) || 0;

    const clockLabel =
      `${getLivePresentationPeriodLabel(activeLiveGame.period)} · ${formatLivePresentationClock(activeLiveGame.clockSecondsRemaining)}`;

    document.getElementById(
      'live-game-career-outcome'
    )?.remove();

    const outcome =
      document.createElement('div');

    outcome.id =
      'live-game-career-outcome';

    outcome.style.cssText = `
      position:absolute;
      left:14px;
      right:14px;
      bottom:18px;
      z-index:35;
      padding:14px 15px;
      border-radius:16px;
      border:1px solid rgba(113,164,239,.34);
      background:rgba(5,17,38,.98);
      box-shadow:0 14px 38px rgba(0,0,0,.42);
      pointer-events:none;
    `;

    outcome.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div style="font-size:9px;font-weight:900;letter-spacing:.13em;color:#7fb2ff;">${choice.scenario || 'YOUR MOMENT'}</div>
        <div style="font-size:9px;font-weight:900;letter-spacing:.11em;color:#f2cf77;">${outcomeTag}</div>
      </div>
      <div style="margin-top:7px;font-size:15px;line-height:1.18;font-weight:900;color:#fff;">${outcomeTitle}</div>
      <div style="margin-top:5px;font-size:11px;line-height:1.42;color:rgba(205,219,240,.72);">${outcomeDetail}</div>
      <div style="margin-top:9px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:8px;font-size:9px;font-weight:800;color:rgba(177,197,226,.52);">
        <span>${choice.label}</span>
        <span>${clockLabel} · ${currentCareerScore}-${currentOpponentScore}</span>
      </div>
    `;

    liveGameScreen.appendChild(outcome);

    window.setTimeout(() => {
      outcome.remove();
    }, 2800);

    liveGameCareerDecisionLastChoice =
      null;
  }

'''

text = text[:start] + feedback + text[end:]

path.write_text(text, encoding='utf-8')
print('Phase 1 decision depth v3 applied.')
