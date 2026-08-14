from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()

# 1. Null-safe Season Engine stop handling: a completed Sim Game can stop
# simulation without a schedule UI event to reopen.
old="""    EventSystem.openEvent(
      blockingScheduleEvent.eventId,
      'schedule',
      blockingScheduleEvent
    );
}"""
new="""    if (blockingScheduleEvent) {
      EventSystem.openEvent(
        blockingScheduleEvent.eventId,
        'schedule',
        blockingScheduleEvent
      );
    }
}"""
assert s.count(old)==1, f'blockingScheduleEvent block count={s.count(old)}'
s=s.replace(old,new,1)

# 2. Resolve a queued Your Moment immediately when the user chooses rather
# than waiting for the next playback timer/button press.
old="""  startLiveGamePlayback(
    liveGamePlaybackSpeed
  );
}

function maybeOpenLiveGameCareerDecision()"""
new="""  /*
   * Resolve the selected hockey action immediately. The choice itself
   * intentionally paused playback, so waiting for the next playback timer
   * made some rush decisions appear frozen until the user pressed 1x.
   */
  liveGamePlaybackPaused = false;
  clearLiveGamePlaybackTimer();

  const immediateDecisionResult =
    advanceLiveGamePresentationChunk(60);

  if (
    (!immediateDecisionResult || immediateDecisionResult.success !== true) &&
    activeLiveGame?.gameComplete !== true
  ) {
    console.error(
      '[Project Ice] Immediate career decision resolution failed.',
      immediateDecisionResult
    );
    startLiveGamePlayback(liveGamePlaybackSpeed);
    return;
  }

  /*
   * A meaningful outcome pauses itself and waits for Resume Game. If this
   * particular action produced no outcome overlay, return to normal playback.
   */
  if (
    !document.getElementById('live-game-career-outcome') &&
    activeLiveGame?.gameComplete !== true
  ) {
    startLiveGamePlayback(liveGamePlaybackSpeed);
  }
}

function maybeOpenLiveGameCareerDecision()"""
assert s.count(old)==1, f'decision resume block count={s.count(old)}'
s=s.replace(old,new,1)

# 3. A persistent Your Moment outcome has z-index 38 while the final Continue
# button is z-index 20. Clear interaction overlays at the final horn so they
# cannot invisibly intercept the Continue tap.
anchor="""  liveGamePlaybackPaused =
    true;

  clearLiveGamePlaybackTimer();"""
replacement="""  liveGamePlaybackPaused =
    true;

  clearLiveGamePlaybackTimer();

  /*
   * The final horn owns the live-game screen. Remove any persistent career
   * decision/outcome overlay so it cannot sit above the final Continue button.
   */
  document.getElementById(
    'live-game-career-decision'
  )?.remove();
  document.getElementById(
    'live-game-career-outcome'
  )?.remove();
  liveGameCareerDecisionOpen = false;"""
# Must target completion handler only; this exact block appears once in final-horn path.
assert s.count(anchor)>=1, 'final horn pause anchor missing'
# choose occurrence immediately after liveGameCompletionHandled = true
idx=s.find('liveGameCompletionHandled =\n    true;')
assert idx>=0, 'completion handler marker missing'
pos=s.find(anchor, idx)
assert pos>=0 and pos-idx<1500, 'final horn pause anchor not near completion marker'
s=s[:pos]+s[pos:].replace(anchor,replacement,1)

p.write_text(s)
print('Fixed Sim Game null stop, immediate Your Moment resolution, and final-horn Continue overlay interception.')
