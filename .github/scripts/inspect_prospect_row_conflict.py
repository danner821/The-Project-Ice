from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/style.css']:
    s=Path(path).read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    for needle in ['pr-player-reputation','pr-player-context','renderProspectsScreen','prospectContext']:
        hits=[i for i,l in enumerate(s) if needle in l]
        print('NEEDLE',needle,'HITS', [i+1 for i in hits])
        for i in hits:
            print('\n'.join(s[max(0,i-6):min(len(s),i+12)]))
            print('---')
