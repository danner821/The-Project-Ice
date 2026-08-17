from pathlib import Path
for path in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js']:
    lines=Path(path).read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    for needle in ['scoutsAttending','Top Prospect Clash','Scouts in Attendance','specialGame','processScoutingWeek','getScoutedGamesForPlayer','renderLeagueProspectsPreview','prospectRankings','rankChange']:
        print('\n###',needle)
        hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
        for i in hits[:10]:
            a=max(0,i-25); b=min(len(lines),i+110)
            print(f'--- {a+1}-{b} ---')
            print('\n'.join(lines[a:b]))
