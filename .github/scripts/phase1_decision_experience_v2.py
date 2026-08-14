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

# Add one small state object beside the existing decision globals.
marker = "let liveGameCareerDecisionCooldownSteps =\n  0;"
if marker not in text:
    raise SystemExit('decision cooldown marker missing')
if 'liveGameCareerDecisionLastChoice' not in text:
    text = text.replace(
        marker,
        marker + "\n\nlet liveGameCareerDecisionLastChoice =\n  null;",
        1,
    )

submit_fn = r'''function submitLiveGameCareerDecision(action, choiceLabel = '') {
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
    decisionCard.querySelectorAll('button').forEach(button => {
      button.disabled = true;
      button.style.opacity = '.55';
    });
  }

  liveGameCareerDecisionLastChoice = {
    action,
    label:
      choiceLabel ||
      (action === 'shoot'
        ? 'Shoot'
        : action === 'pass'
          ? 'Pass'
          : 'Hold the puck'),
    period:
      activeLiveGame.period,
    clockSecondsRemaining:
      activeLiveGame.clockSecondsRemaining,
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
    eyebrow:
      zone === 'offensive'
        ? 'OFFENSIVE ZONE'
        : 'TRANSITION',
    title:
      zone === 'offensive'
        ? 'You have space with the puck.'
        : 'You catch the defense moving backward.',
    detail:
      zone === 'offensive'
        ? 'The play is opening up. Choose how you want to attack.'
        : 'There is a decision to make before the defense gets set.',
    accent: '#6aa8ff',
    choices: [
      {
        action: 'shoot',
        label: 'Attack the net',
        note: 'Force a shot now',
        risk: 'AGGRESSIVE',
      },
      {
        action: 'pass',
        label: 'Move the puck',
        note: 'Use your passing and vision',
        risk: 'SMART',
      },
      {
        action: 'hold',
        label: 'Stay patient',
        note: 'Let the play develop',
        risk: 'CONTROL',
      },
    ],
  };

  if (onPowerPlay) {
    scenario = {
      eyebrow: 'POWER PLAY',
      title: 'The penalty kill is collapsing toward you.',
      detail: 'A clean decision here can create the best chance of the shift.',
      accent: '#f0bf55',
      choices: [
        {
          action: 'shoot',
          label: 'Shoot through traffic',
          note: 'Get the puck to the net',
          risk: 'PRESSURE',
        },
        {
          action: 'pass',
          label: 'Work it low',
          note: 'Try to open the box',
          risk: 'CREATE',
        },
        {
          action: 'hold',
          label: 'Reset the setup',
          note: 'Keep possession and wait',
          risk: 'PATIENT',
        },
      ],
    };
  }

  if (lateClutch) {
    const tied =
      scoreDiff === 0;

    scenario = {
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
            ? 'Time is running out. You have the puck.'
            : 'A smart play here can kill valuable time.',
      detail:
        `${getLivePresentationPeriodLabel(period)} · ${formatLivePresentationClock(clock)} · ${careerScore}-${opponentScore}`,
      accent: '#f5d06f',
      choices:
        scoreDiff > 0
          ? [
              {
                action: 'hold',
                label: 'Protect the puck',
                note: 'Make them chase you',
                risk: 'SAFE',
              },
              {
                action: 'pass',
                label: 'Find support',
                note: 'Move it to the open teammate',
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
                note: 'Trust your vision',
                risk: 'CREATE',
              },
              {
                action: 'hold',
                label: 'Wait for the lane',
                note: 'Stay composed under pressure',
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
        button.dataset.careerLiveLabel
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

# Add outcome feedback after the canonical step has produced its new events.
needle = "  newEvents.forEach(\n    event => {"
if needle not in text:
    raise SystemExit('new events marker missing')

feedback = r'''  if (liveGameCareerDecisionLastChoice) {
    const choice =
      liveGameCareerDecisionLastChoice;

    const outcomeEvent =
      newEvents[newEvents.length - 1] ||
      step.event ||
      null;

    const outcomeType =
      String(outcomeEvent?.type || '');

    let outcomeTitle =
      choice.action === 'hold'
        ? 'You stay composed and let the play develop.'
        : choice.action === 'pass'
          ? 'You move the puck.'
          : 'You attack the net.';

    let outcomeDetail =
      'Play continues.';

    if (outcomeType === 'goal') {
      outcomeTitle =
        'GOAL — your decision pays off.';
      outcomeDetail =
        'A huge moment in the game.';
    } else if (
      outcomeType === 'shot' ||
      outcomeType === 'shot-on-goal' ||
      outcomeType === 'shot-saved'
    ) {
      outcomeDetail =
        'You create a shot on the possession.';
    } else if (outcomeType === 'career-pass') {
      outcomeTitle =
        'Pass completed.';
      outcomeDetail =
        'Your team keeps the attack alive.';
    } else if (outcomeType === 'turnover') {
      outcomeTitle =
        'The play is broken up.';
      outcomeDetail =
        'Possession goes the other way.';
    }

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
      padding:12px 14px;
      border-radius:14px;
      border:1px solid rgba(113,164,239,.30);
      background:rgba(5,17,38,.96);
      box-shadow:0 12px 32px rgba(0,0,0,.35);
      pointer-events:none;
    `;

    outcome.innerHTML = `
      <div style="font-size:9px;font-weight:900;letter-spacing:.13em;color:#7fb2ff;">${choice.label.toUpperCase()}</div>
      <div style="margin-top:3px;font-size:14px;font-weight:850;color:#fff;">${outcomeTitle}</div>
      <div style="margin-top:2px;font-size:11px;color:rgba(205,219,240,.68);">${outcomeDetail}</div>
    `;

    liveGameScreen.appendChild(outcome);

    window.setTimeout(() => {
      outcome.remove();
    }, 1650);

    liveGameCareerDecisionLastChoice =
      null;
  }

'''

text = text.replace(needle, feedback + needle, 1)

# Reset the new state at game start if the existing reset block is present.
reset = "  liveGameCareerDecisionCooldownSteps =\n    0;"
if reset in text and "liveGameCareerDecisionLastChoice =\n    null;" not in text[text.find(reset):text.find(reset)+250]:
    text = text.replace(
        reset,
        reset + "\n\n  liveGameCareerDecisionLastChoice =\n    null;",
        1,
    )

path.write_text(text, encoding='utf-8')
print('Phase 1 decision experience v2 patched successfully.')
