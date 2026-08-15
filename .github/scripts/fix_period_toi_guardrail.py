from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old = '''        const overTargetPenalty =
          toiDeficit < 0
            ? Math.abs(toiDeficit) * 2.25
            : 0;

        const score =
          toiDeficit * 1.55 -
          overTargetPenalty +
          shiftCountDeficit * 8 +
          Math.random() * 6;
'''

new = '''        const overTargetPenalty =
          toiDeficit < 0
            ? Math.abs(toiDeficit) * 2.25
            : 0;

        /*
         * Period-level workload guardrail.
         *
         * The cumulative game target can eventually correct an early
         * deployment spike, but that still allows a line to play far too
         * much in the first period and then sit later. Hockey rotations
         * should stay believable inside each period as well as across the
         * full game.
         *
         * We therefore compare the unit's hottest skater against the
         * amount of even-strength time that should reasonably have accrued
         * by this point in the CURRENT period. This is deliberately a soft
         * scoring penalty, not a hard cap: special teams, overtime and game
         * context can still create unusually high total TOI.
         */
        const periodNumber =
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

        const periodAheadSeconds =
          Math.max(
            0,
            hottestPlayerTOI -
            expectedTOIThroughNow -
            75
          );

        const periodAheadPenalty =
          periodAheadSeconds * 2.4;

        const score =
          toiDeficit * 1.55 -
          overTargetPenalty -
          periodAheadPenalty +
          shiftCountDeficit * 8 +
          Math.random() * 6;
'''

if old not in text:
    raise SystemExit('TOI scoring block not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Period TOI guardrail patched')
