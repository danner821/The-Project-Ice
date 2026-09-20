from pathlib import Path

ROOT = Path('artifacts/project-ice')
game_path = ROOT / 'public' / 'game.js'
game = game_path.read_text(encoding='utf-8')

old = """    const skaterCategories = [
      {
        name: 'Shooting',
        keys: [
          'wristShotPower',
          'wristShotAccuracy',
          'slapShotPower',
          'slapShotAccuracy',
        ],
      },

      {
        name: 'Playmaking',
        keys: [
          'passing',
          'puckControl',
          'deking',
          'handEye',
          'offensiveAwareness',
        ],
      },

      {
        name: 'Skating',
        keys: [
          'speed',
          'acceleration',
          'agility',
          'balance',
          'endurance',
        ],
      },

      {
        name: 'Defense',
        keys: [
          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'discipline',
        ],
      },

      {
        name: 'Physical',
        keys: [
          'bodyChecking',
          'strength',
          'durability',
          'balance',
          'endurance',
        ],
      },

      {
        name: 'Hockey IQ',
        keys: [
          'offensiveAwareness',
          'defensiveAwareness',
          'poise',
          'discipline',
          'faceoffs',
        ],
      },
    ];
"""
new = """    /*
     * UPGRADE NOTIFICATION OWNERSHIP
     *
     * These keys must match the Player tab's visible primary ownership map.
     * Category badges are derived from this helper, so an attribute must live
     * in exactly one skater category here or one upgrade can light two headers.
     */
    const skaterCategories = [
      {
        name: 'Shooting',
        keys: [
          'wristShotPower',
          'wristShotAccuracy',
          'slapShotPower',
          'slapShotAccuracy',
        ],
      },

      {
        name: 'Playmaking',
        keys: [
          'passing',
          'puckControl',
          'deking',
          'handEye',
        ],
      },

      {
        name: 'Skating',
        keys: [
          'speed',
          'acceleration',
          'agility',
          'balance',
          'endurance',
        ],
      },

      {
        name: 'Defense',
        keys: [
          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'discipline',
        ],
      },

      {
        name: 'Physical',
        keys: [
          'bodyChecking',
          'strength',
          'durability',
        ],
      },

      {
        name: 'Hockey IQ',
        keys: [
          'offensiveAwareness',
          'poise',
          'faceoffs',
        ],
      },
    ];
"""
if old not in game:
    raise SystemExit('upgrade category ownership anchor not found')
game = game.replace(old, new, 1)
game_path.write_text(game, encoding='utf-8')

Path('.github/scripts/fix_upgrade_category_ownership.py').unlink(missing_ok=True)
Path('.github/workflows/fix-upgrade-category-ownership.yml').unlink(missing_ok=True)
