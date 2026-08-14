from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text()

replacements = {
    "      handEye: 'Shooting',": "      handEye: 'Playmaking',",
    "      passing: 'Passing',": "      passing: 'Playmaking',",
    "      puckControl: 'Passing',": "      puckControl: 'Playmaking',",
    "      deking: 'Passing',": "      deking: 'Playmaking',",
}

for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected one occurrence of {old!r}, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Corrected player-facing attribute category ownership.')
