from pathlib import Path

ROOT = Path('artifacts/project-ice')
world_path = ROOT / 'public' / 'world.js'
index_path = ROOT / 'index.html'
world = world_path.read_text(encoding='utf-8')

anchor = """        /*
         * Hockey goals are usually assisted, but not always.
         *
         * The most recent valid possession contributor is the primary
         * assist candidate. The next unique contributor is secondary.
         */
        let primaryAssist =
          null;
"""
insert = """        /*
         * NHL ASSIST CALIBRATION
         *
         * The probability model below was already in a realistic range
         * (roughly 1.58 assists per goal when two valid candidates exist),
         * but the possession-touch history can contain only the shooter or
         * one teammate on short/transition sequences. That artificially
         * suppresses league-wide assists even though the goal itself came
         * from normal five-man offensive support.
         *
         * Preserve the actual recent touch order first. If fewer than two
         * unique teammates are available, supplement the pool from the other
         * skaters currently on the ice. Those support candidates are weighted
         * by passing, offensive awareness and puck control so playmakers are
         * still more likely to collect assists than random teammates.
         *
         * This changes assist CREDIT only. It does not change goals, shots or
         * game scores.
         */
        if (assistCandidates.length < 2) {
          const existingIds = new Set(
            assistCandidates.map(candidate => String(candidate?.playerId || ''))
          );

          const supportPool = attackingSkaters
            .filter(player =>
              player?.playerId &&
              String(player.playerId) !== String(shooter.playerId) &&
              !existingIds.has(String(player.playerId))
            )
            .map(player => {
              const canonical = getPlayerById(player.playerId) || {};
              const attributes = canonical.attributes || {};

              const weight =
                Math.max(
                  1,
                  (Number(attributes.passing) || 50) * 0.45 +
                  (Number(attributes.offensiveAwareness) || 50) * 0.35 +
                  (Number(attributes.puckControl) || 50) * 0.20
                );

              return { player, weight };
            });

          while (assistCandidates.length < 2 && supportPool.length > 0) {
            const totalWeight = supportPool.reduce(
              (sum, entry) => sum + entry.weight,
              0
            );

            let roll = Math.random() * totalWeight;
            let selectedIndex = 0;

            for (let index = 0; index < supportPool.length; index += 1) {
              roll -= supportPool[index].weight;

              if (roll <= 0) {
                selectedIndex = index;
                break;
              }
            }

            const [selected] = supportPool.splice(selectedIndex, 1);

            if (!selected?.player?.playerId) {
              continue;
            }

            assistCandidates.push({
              playerId: selected.player.playerId,
              side: attackingSide,
              touchType: 'assist-support',
              period: simulation.period,
              clockSecondsRemaining: simulation.clockSecondsRemaining,
            });
          }
        }

        /*
         * Hockey goals are usually assisted, but not always.
         *
         * The most recent valid possession contributor is the primary
         * assist candidate. The next unique contributor is secondary.
         */
        let primaryAssist =
          null;
"""
if anchor not in world:
    raise SystemExit('assist calibration anchor not found')
world = world.replace(anchor, insert, 1)
world_path.write_text(world, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
import re
index = re.sub(
    r'/world\.js\?v=[^"\']+',
    '/world.js?v=20260920-nhl-assist-calibration-1',
    index,
    count=1,
)
index_path.write_text(index, encoding='utf-8')

Path('.github/scripts/calibrate_hockey_assist_rates.py').unlink(missing_ok=True)
Path('.github/workflows/calibrate-hockey-assist-rates.yml').unlink(missing_ok=True)
