from pathlib import Path
for path in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js']:
    lines=Path(path).read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    for i,l in enumerate(lines):
        low=l.lower()
        if 'function' in low and 'overall' in low:
            print(f'### LINE {i+1}: {l}')
            print('\n'.join(lines[max(0,i-10):min(len(lines),i+100)]))
        elif 'overall =' in low and 'attribute' in '\n'.join(lines[max(0,i-5):i+3]).lower():
            print(f'### OVERALL ASSIGN {i+1}')
            print('\n'.join(lines[max(0,i-12):min(len(lines),i+35)]))
