from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old = '''    const failures = [];

    let steps = 0;

    while (
      simulation.gameComplete !== true &&
      steps < maxSteps
    ) {
      const step =
        advanceLiveGameStep(
          simulation
        );

      steps += 1;

      if (
        !step ||
        step.success !== true
      ) {
        failures.push({
          step: steps,

          reason:
            step?.reason ||
            'unknown-live-game-step-failure',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,
        });

        break;
      }
    }
'''

new = '''    const failures = [];

    let steps = 0;
    let consecutiveFailures = 0;

    /*
     * The visible live-game player already treats an isolated zero-time
     * deployment/event boundary as recoverable. The instant resolver used by
     * Sim Game must obey the same contract; otherwise Sim Game can fail on a
     * transient step that the exact same hockey game would recover from when
     * played visibly.
     */
    while (
      simulation.gameComplete !== true &&
      steps < maxSteps
    ) {
      const step =
        advanceLiveGameStep(
          simulation
        );

      steps += 1;

      if (
        !step ||
        step.success !== true
      ) {
        consecutiveFailures += 1;

        failures.push({
          step: steps,

          reason:
            step?.reason ||
            'unknown-live-game-step-failure',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,

          recovered:
            consecutiveFailures <= 3,
        });

        if (consecutiveFailures <= 3) {
          continue;
        }

        break;
      }

      consecutiveFailures = 0;
    }
'''

if old not in text:
    raise SystemExit('universal resolver loop not found')
text = text.replace(old, new, 1)

old_failure = '''    if (failures.length > 0) {
      return {
        success: false,

        reason:
          failures[
            failures.length - 1
          ]?.reason ||
          'live-game-resolution-failed',

        simulation,

        gameResult: null,

        steps,

        failures,
      };
    }
'''
new_failure = '''    const unrecoveredFailure =
      failures.find(
        failure =>
          failure?.recovered !== true
      ) || null;

    if (unrecoveredFailure) {
      return {
        success: false,

        reason:
          unrecoveredFailure.reason ||
          'live-game-resolution-failed',

        simulation,

        gameResult: null,

        steps,

        failures,
      };
    }
'''
if old_failure not in text:
    raise SystemExit('universal resolver failure block not found')
text = text.replace(old_failure, new_failure, 1)

# Successful resolution may still have recovered transient failures; return them
# for diagnostics rather than falsely claiming the run had none.
old_success = '''      steps,

      failures: [],
    };
  }
'''
new_success = '''      steps,

      failures,
    };
  }
'''
if old_success not in text:
    raise SystemExit('universal resolver success tail not found')
text = text.replace(old_success, new_success, 1)

path.write_text(text)
print('Universal instant resolver now recovers transient live-step failures')
