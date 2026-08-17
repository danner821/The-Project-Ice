from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
lines=p.read_text(errors='ignore').splitlines()
for needle in ['function processScoutingWeek','_state.prospectRankings','publicRank','previousRank','rankingHistory','processPersistentScoutingReports','getCareerPlayerFromWorldState']:
    print('\n###',needle)
    hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
    for i in hits[:8]:
        a=max(0,i-35); b=min(len(lines),i+140)
        print(f'--- {a+1}-{b} ---')
        print('\n'.join(lines[a:b]))
