from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/index.html','artifacts/project-ice/public/style.css']:
    p=Path(path); lines=p.read_text(errors='ignore').splitlines()
    print('\nFILE', path)
    needles=['Organizations Watching','Scout Summary','Known Strengths','Known Weaknesses','Scouting','publicRank','gamesObserved','organizationsWatching','strengthsKnown','weaknessesKnown','rivalWatch','prospects-preview','Top Prospects']
    for needle in needles:
        hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
        if hits:
            print('\n###',needle)
            for i in hits[:8]:
                a=max(0,i-30); b=min(len(lines),i+90)
                print(f'--- {a+1}-{b} ---')
                print('\n'.join(lines[a:b]))
