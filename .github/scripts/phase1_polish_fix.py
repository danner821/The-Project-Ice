from pathlib import Path
import re

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text()
world = WORLD.read_text()

# ------------------------------------------------------------------
# Player tab: show every canonical skater attribute in one primary home.
# This fixes the UX where upgrading one underlying attribute appeared to
# upgrade a second row because the same key was rendered in two categories.
# ------------------------------------------------------------------
old_game = """    const categories =
      isGoalie
        ? goalieCategories
        : skaterCategories;
    const upgradeableCategories =
"""

new_game = """    const rawCategories =
      isGoalie
        ? goalieCategories
        : skaterCategories;

    /*
     * PLAYER TAB ATTRIBUTE OWNERSHIP
     *
     * Several canonical attributes legitimately influence more than one
     * development category under the hood. The Player tab should not render
     * the same upgradeable attribute twice, though, because one manual +1
     * then looks like two separate upgrades happened.
     *
     * Keep the backend category/development weights untouched and give each
     * skater attribute one clear player-facing home here.
     */
    const primaryCategoryByAttribute = {
      speed: 'Skating',
      acceleration: 'Skating',
      agility: 'Skating',
      balance: 'Skating',
      endurance: 'Skating',

      wristShotPower: 'Shooting',
      wristShotAccuracy: 'Shooting',
      slapShotPower: 'Shooting',
      slapShotAccuracy: 'Shooting',
      handEye: 'Shooting',

      passing: 'Passing',
      puckControl: 'Passing',
      deking: 'Passing',

      defensiveAwareness: 'Defense',
      stickChecking: 'Defense',
      shotBlocking: 'Defense',
      discipline: 'Defense',

      strength: 'Physical',
      bodyChecking: 'Physical',
      durability: 'Physical',

      offensiveAwareness: 'Hockey IQ',
      poise: 'Hockey IQ',
    };

    const seenAttributeKeys =
      new Set();

    const categories =
      isGoalie
        ? rawCategories
        : rawCategories
            .map(category => ({
              ...category,
              attributes:
                Array.isArray(category.attributes)
                  ? category.attributes.filter(attribute => {
                      const attributeKey =
                        attribute?.key ||
                        null;

                      if (!attributeKey) {
                        return true;
                      }

                      const primaryCategory =
                        primaryCategoryByAttribute[
                          attributeKey
                        ];

                      if (
                        primaryCategory &&
                        primaryCategory !== category.name
                      ) {
                        return false;
                      }

                      if (
                        seenAttributeKeys.has(
                          attributeKey
                        )
                      ) {
                        return false;
                      }

                      seenAttributeKeys.add(
                        attributeKey
                      );

                      return true;
                    })
                  : [],
            }))
            .filter(
              category =>
                category.attributes.length > 0
            );

    const upgradeableCategories =
"""

count = game.count(old_game)
if count != 1:
    raise SystemExit(f'Expected one Player-tab category block, found {count}')
game = game.replace(old_game, new_game, 1)

# ------------------------------------------------------------------
# Live game deployment: balance against actual accumulated TOI rather than
# shift count alone. Special-teams minutes now naturally suppress the next
# even-strength deployment when a unit is already running hot.
# ------------------------------------------------------------------
pattern = re.compile(
    r"    const balancedPick = \(\n"
    r"      weightedOptions,\n"
    r"      usageMap,\n"
    r"      key\n"
    r"    \) => \{.*?"
    r"      return best \|\| weightedOptions\[0\] \|\| null;\n"
    r"    \};",
    re.S,
)

replacement = """    const getElapsedRegulationSeconds = () => {
      const period =
        Math.max(
          1,
          Number(simulation.period) || 1
        );

      const completedPeriods =
        Math.max(
          0,
          Math.min(2, period - 1)
        );

      const currentPeriodElapsed =
        period <= 3
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

      return (
        completedPeriods * 1200 +
        currentPeriodElapsed
      );
    };

    const teamSkaters =
      Array.isArray(
        side === 'home'
          ? simulation.home?.skaters
          : simulation.away?.skaters
      )
        ? (
            side === 'home'
              ? simulation.home.skaters
              : simulation.away.skaters
          )
        : [];

    const getUnitAverageTOI = (
      unit,
      assignmentKey,
      assignmentValue
    ) => {
      const matchingPlayers =
        teamSkaters.filter(player =>
          player
            ?.lineupAssignment
            ?.unit === unit &&
          Number(
            player
              ?.lineupAssignment
              ?.[assignmentKey]
          ) === Number(assignmentValue)
        );

      if (matchingPlayers.length === 0) {
        return null;
      }

      return (
        matchingPlayers.reduce(
          (sum, player) =>
            sum +
            Math.max(
              0,
              Number(
                player.timeOnIceSeconds
              ) || 0
            ),
          0
        ) /
        matchingPlayers.length
      );
    };

    const balancedPick = (
      weightedOptions,
      usageMap,
      key,
      unit,
      assignmentKey
    ) => {
      const totalWeight =
        weightedOptions.reduce(
          (sum, option) =>
            sum +
            Math.max(
              0,
              Number(option.weight) || 0
            ),
          0
        );

      const totalSelections =
        Object.values(usageMap).reduce(
          (sum, value) =>
            sum +
            (Number(value) || 0),
          0
        );

      const elapsedGameSeconds =
        getElapsedRegulationSeconds();

      let best = null;
      let bestScore = -Infinity;

      weightedOptions.forEach(option => {
        const id =
          Number(option[key]);

        const targetShare =
          totalWeight > 0
            ? (Number(option.weight) || 0) /
              totalWeight
            : 0;

        const actualCount =
          Number(usageMap[id]) || 0;

        const targetCountAfterNext =
          (totalSelections + 1) *
          targetShare;

        const averageUnitTOI =
          getUnitAverageTOI(
            unit,
            assignmentKey,
            id
          );

        /*
         * Target TOTAL game TOI by role, not merely equal shift counts.
         * Because actual TOI includes PP/PK usage, heavy special-teams work
         * automatically reduces the urgency of the next 5-on-5 shift.
         */
        const targetTOI =
          Math.max(
            45,
            elapsedGameSeconds
          ) * targetShare;

        const toiDeficit =
          Number.isFinite(
            averageUnitTOI
          )
            ? targetTOI -
              averageUnitTOI
            : 0;

        const shiftCountDeficit =
          targetCountAfterNext -
          actualCount;

        /*
         * Seconds played drive the decision. Shift-count balance remains a
         * smaller stabilizer, and modest jitter keeps rotations organic.
         */
        const score =
          toiDeficit * 1.25 +
          shiftCountDeficit * 18 +
          Math.random() * 12;

        if (score > bestScore) {
          bestScore = score;
          best = option;
        }
      });

      return best ||
        weightedOptions[0] ||
        null;
    };"""

world, substitutions = pattern.subn(replacement, world, count=1)
if substitutions != 1:
    raise SystemExit(f'Expected one balancedPick block, changed {substitutions}')

old_forward = """      balancedPick(
        forwardLineWeights,
        usage.forwardLines,
        'line'
      );"""
new_forward = """      balancedPick(
        forwardLineWeights,
        usage.forwardLines,
        'line',
        'forward',
        'line'
      );"""
if world.count(old_forward) != 1:
    raise SystemExit('Could not uniquely locate forward balancedPick call')
world = world.replace(old_forward, new_forward, 1)

old_defense = """      balancedPick(
        defensePairWeights,
        usage.defensePairs,
        'pair'
      );"""
new_defense = """      balancedPick(
        defensePairWeights,
        usage.defensePairs,
        'pair',
        'defense',
        'pair'
      );"""
if world.count(old_defense) != 1:
    raise SystemExit('Could not uniquely locate defense balancedPick call')
world = world.replace(old_defense, new_defense, 1)

GAME.write_text(game)
WORLD.write_text(world)
print('Patched Player-tab attribute ownership and TOI-aware deployment.')
