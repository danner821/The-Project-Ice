from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old = '''        const periodAheadSeconds =
          Math.max(
            0,
            hottestPlayerTOI -
            expectedTOIThroughNow -
            75
          );
'''

new = '''        const unitHottestPlayerTOI =
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

        const periodAheadSeconds =
          Math.max(
            0,
            unitHottestPlayerTOI -
            expectedTOIThroughNow -
            75
          );
'''

if old not in text:
    raise SystemExit('period TOI guardrail block not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Fixed period TOI guardrail scope')
