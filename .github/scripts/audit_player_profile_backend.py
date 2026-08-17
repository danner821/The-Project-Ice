from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
lines=p.read_text(errors='ignore').splitlines()
needles=['player-profile-screen','renderPlayerProfile','potentialRole','potentialAccuracy','potentialTrend','scoutingProfile','strengthsKnown','weaknessesKnown','organizationsWatching','publicRank','gamesObserved']
for needle in needles:
    print('\n###', needle)
    hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
    for i in hits[:12]:
        a=max(0,i-30); b=min(len(lines),i+120)
        print(f'--- {a+1}-{b} ---')
        print('\n'.join(lines[a:b]))
