from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text()

old_postgame = '''if (btnPostgameContinue) {
  btnPostgameContinue.addEventListener(
    'click',
    () => {
      refreshCareerUI();
      refreshScheduleEvents();

      openHubTab(
        'schedule'
      );
    }
  );
}
'''

new_postgame = '''if (btnPostgameContinue) {
  btnPostgameContinue.addEventListener(
    'click',
    () => {
      /*
       * Route first. A non-critical refresh failure should never strand
       * the player on the completed-game screen with a dead Continue button.
       * openHubTab('schedule') already refreshes and renders Schedule.
       */
      openHubTab(
        'schedule'
      );

      try {
        refreshCareerUI();
      } catch (error) {
        console.warn(
          '[Project Ice] Postgame UI refresh failed after returning to Schedule.',
          error
        );
      }
    }
  );
}
'''

old_event = '''if (btnEventResultsContinue) {
  btnEventResultsContinue.addEventListener(
    'click',
    () => {
      refreshCareerUI();

      refreshScheduleEvents();

      openHubTab(
        'schedule'
      );
    }
  );
}
'''

new_event = '''if (btnEventResultsContinue) {
  btnEventResultsContinue.addEventListener(
    'click',
    () => {
      openHubTab(
        'schedule'
      );

      try {
        refreshCareerUI();
      } catch (error) {
        console.warn(
          '[Project Ice] Event-results UI refresh failed after returning to Schedule.',
          error
        );
      }
    }
  );
}
'''

old_failure = '''  if (
    !result ||
    result.success !== true
  ) {
    console.error(
      '[Project Ice] Live playback chunk failed.',
      result
    );

    pauseLiveGamePlayback();

    return;
  }

  if (result.decisionPending === true) {
'''

new_failure = '''  if (
    !result ||
    result.success !== true
  ) {
    const consecutiveFailures =
      (Number(
        window.__projectIceLivePlaybackFailures
      ) || 0) + 1;

    window.__projectIceLivePlaybackFailures =
      consecutiveFailures;

    console.warn(
      '[Project Ice] Live playback chunk failed; attempting automatic recovery.',
      {
        consecutiveFailures,
        result,
      }
    );

    /*
     * A single presentation-step miss should not silently pause the game.
     * Retry a few times because the canonical engine can occasionally land
     * on a zero-time transition/stoppage boundary. Persistent failures still
     * pause safely instead of creating an endless retry loop.
     */
    if (consecutiveFailures <= 3) {
      clearLiveGamePlaybackTimer();

      liveGamePlaybackTimer =
        window.setTimeout(
          scheduleNextLiveGamePlaybackTick,
          180
        );

      return;
    }

    console.error(
      '[Project Ice] Live playback could not recover after repeated failures.',
      result
    );

    pauseLiveGamePlayback();

    return;
  }

  window.__projectIceLivePlaybackFailures = 0;

  if (result.decisionPending === true) {
'''

old_start = '''  liveGamePlaybackPaused =
    false;

  setLiveGameActiveSpeedButton(
'''

new_start = '''  liveGamePlaybackPaused =
    false;

  window.__projectIceLivePlaybackFailures = 0;

  setLiveGameActiveSpeedButton(
'''

replacements = [
    (old_postgame, new_postgame, 'postgame Continue listener'),
    (old_event, new_event, 'event-results Continue listener'),
    (old_failure, new_failure, 'live playback failure block'),
    (old_start, new_start, 'playback start reset'),
]

for old, new, label in replacements:
    if old not in text:
        raise SystemExit(f'{label} not found')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Fixed postgame Continue routing and transient live-game playback stalls')
