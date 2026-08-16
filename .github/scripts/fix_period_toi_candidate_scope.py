from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old = '''        const unitHottestPlayerTOI =
          Math.max(
            0,
            ...skaters.map(
              player =>
                Math.max(
                  0,
                  Number(player?.toiSeconds) || 0
                )
            )
          );
'''

new = '''        const unitPlayers =
          teamSkaters.filter(player =>
            player
              ?.lineupAssignment
              ?.unit === unit &&
            Number(
              player
                ?.lineupAssignment
                ?.[assignmentKey]
            ) === id
          );

        const unitHottestPlayerTOI =
          Math.max(
            0,
            ...unitPlayers.map(
              player =>
                Math.max(
                  0,
                  Number(
                    player.timeOnIceSeconds
                  ) || 0
                )
            )
          );
'''

if old not in text:
    raise SystemExit('broken period TOI unit player block not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Fixed period TOI candidate-unit scope and TOI field')
