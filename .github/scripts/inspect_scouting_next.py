from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
lines=p.read_text(errors='ignore').splitlines()
for needle in ['function processScoutingWeek','scoutingHistory.push','strengthsKnown','weaknessesKnown','organizationsWatching','publicRank','interestLevel']:
    print('\n###', needle)
    hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
    for i in hits[:10]:
        a=max(0,i-35); b=min(len(lines),i+120)
        print(f'--- {a+1}-{b} ---')
        print('\n'.join(lines[a:b]))
