from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

# More realistic even-strength role shares. The previous line-1/pair-1 weights
# already implied extreme total minutes before PP/PK work was added.
text = text.replace(
'''    const forwardLineWeights = [
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
''',
'''    const forwardLineWeights = [
      { line: 1, weight: 30 },
      { line: 2, weight: 27 },
      { line: 3, weight: 24 },
      { line: 4, weight: 19 },
    ];

    const defensePairWeights = [
      { pair: 1, weight: 38 },
      { pair: 2, weight: 34 },
      { pair: 3, weight: 28 },
    ];
''',
1)

anchor = '''    /*
     * ==========================================================
     * ELIGIBLE DEPLOYMENT FALLBACK
     * ==========================================================
'''
if anchor not in text:
    raise SystemExit('eligible fallback anchor not found')

workload = r'''    /*
     * ==========================================================
     * TOTAL WORKLOAD DISTRIBUTION — PP / PK
     * ==========================================================
     *
     * Even-strength balancing already reads total player TOI, but a player
     * can still collect too many minutes through repeated PP/PK assignments.
     * Keep special-teams usage on a role-appropriate game-clock pace as well.
     *
     * This is not a fatigue system and it is not a hard statistical cap.
     * Coaches simply give the next special-teams shift to a comparable,
     * eligible skater when someone is materially ahead of his expected total
     * workload. That keeps minutes distributed through all three periods.
     */
    if (
      situation === 'power-play' ||
      situation === 'penalty-kill'
    ) {
      const periodNumber =
        Math.max(
          1,
          Number(simulation.period) || 1
        );

      const completedRegulationPeriods =
        Math.max(
          0,
          Math.min(
            2,
            periodNumber - 1
          )
        );

      const currentRegulationElapsed =
        periodNumber <= 3
          ? Math.max(
              0,
              1200 -
                Math.max(
                  0,
                  Math.min(
                    1200,
                    Number(
                      simulation.clockSecondsRemaining
                    ) || 0
                  )
                )
            )
          : 1200;

      const elapsedRegulationSeconds =
        Math.min(
          3600,
          completedRegulationPeriods *
            1200 +
          currentRegulationElapsed
        );

      const getTotalWorkloadTargetShare =
        player => {
          const assignment =
            player?.lineupAssignment ||
            {};

          if (assignment.unit === 'forward') {
            const line =
              Math.max(
                1,
                Math.min(
                  4,
                  Number(assignment.line) || 4
                )
              );

            return ({
              1: 0.35,
              2: 0.32,
              3: 0.28,
              4: 0.24,
            })[line];
          }

          if (assignment.unit === 'defense') {
            const pair =
              Math.max(
                1,
                Math.min(
                  3,
                  Number(assignment.pair) || 3
                )
              );

            return ({
              1: 0.43,
              2: 0.38,
              3: 0.32,
            })[pair];
          }

          return 0.28;
        };

      const getWorkloadOverage =
        player =>
          (
            Number(
              player?.timeOnIceSeconds
            ) || 0
          ) -
          elapsedRegulationSeconds *
            getTotalWorkloadTargetShare(
              player
            );

      const deployedIds =
        new Set(
          deployedSkaters
            .filter(Boolean)
            .map(player =>
              String(
                player.playerId || ''
              )
            )
        );

      deployedSkaters =
        deployedSkaters.map(player => {
          if (!player) {
            return player;
          }

          const playerOverage =
            getWorkloadOverage(player);

          /*
           * About one shift of flexibility is intentional. Once a skater is
           * more than 75 seconds ahead of his role pace, look for relief.
           */
          if (playerOverage <= 75) {
            return player;
          }

          const playerUnit =
            player?.lineupAssignment
              ?.unit ||
            null;

          const replacement =
            skaters
              .filter(candidate => {
                if (!candidate) {
                  return false;
                }

                const candidateId =
                  String(
                    candidate.playerId || ''
                  );

                if (
                  !candidateId ||
                  deployedIds.has(
                    candidateId
                  )
                ) {
                  return false;
                }

                const candidateUnit =
                  candidate?.lineupAssignment
                    ?.unit ||
                  null;

                return (
                  !playerUnit ||
                  !candidateUnit ||
                  candidateUnit ===
                    playerUnit
                );
              })
              .map(candidate => ({
                candidate,
                overage:
                  getWorkloadOverage(
                    candidate
                  ),
              }))
              .filter(entry =>
                entry.overage <
                  playerOverage - 45
              )
              .sort((first, second) => {
                if (
                  first.overage !==
                  second.overage
                ) {
                  return (
                    first.overage -
                    second.overage
                  );
                }

                return (
                  (Number(
                    second.candidate
                      ?.overall
                  ) || 50) -
                  (Number(
                    first.candidate
                      ?.overall
                  ) || 50)
                );
              })[0]
              ?.candidate ||
            null;

          if (!replacement) {
            return player;
          }

          deployedIds.delete(
            String(
              player.playerId || ''
            )
          );

          deployedIds.add(
            String(
              replacement.playerId || ''
            )
          );

          return replacement;
        });
    }

'''
text = text.replace(anchor, workload + anchor, 1)

path.write_text(text)
print('Added role-paced total workload distribution across EV, PP, and PK')
