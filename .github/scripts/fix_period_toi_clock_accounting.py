from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old = '''        const periodNumber =
          Math.max(
            1,
            Number(simulation.period) || 1
          );

        const completedPriorPeriods =
          Math.max(
            0,
            Math.min(
              3,
              periodNumber - 1
            )
          );

        const priorPeriodTargetTOI =
          completedPriorPeriods *
          20 * 60 *
          targetShare;

        const currentPeriodEvenStrengthSeconds =
          Math.max(
            0,
            elapsedEvenStrengthSeconds -
            completedPriorPeriods * 20 * 60
          );

        const currentPeriodTargetTOI =
          currentPeriodEvenStrengthSeconds *
          targetShare;

        const expectedTOIThroughNow =
          priorPeriodTargetTOI +
          currentPeriodTargetTOI;
'''

new = '''        const elapsedRegulationSeconds =
          getElapsedRegulationSeconds();

        /*
         * Compare TOTAL player TOI against real game-clock progress.
         *
         * The previous version subtracted full 20-minute periods from
         * cumulative even-strength time. In penalty-heavy games that can
         * collapse the current-period target because a prior period did not
         * actually contain 20 minutes of even-strength play.
         *
         * Live player TOI already includes PP/PK usage, so wall-clock elapsed
         * is the correct denominator for this workload guardrail. Special
         * teams can still raise a player's TOI naturally, while the next 5v5
         * deployment now cools that player without misreading period time.
         */
        const expectedTOIThroughNow =
          elapsedRegulationSeconds *
          targetShare;
'''

if old not in text:
    raise SystemExit('period TOI clock-accounting block not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Fixed period TOI clock accounting')
