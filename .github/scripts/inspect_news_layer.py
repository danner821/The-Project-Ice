from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js','artifacts/project-ice/index.html']:
    lines=Path(path).read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    needles=['renderHubNews','renderLeagueNewsPreview','league-news-preview','recentBeats','scouting_update','potential_update','scouting_rival_watch','team_form','standings_move','Top Prospect Clash','Scouts in Attendance','isGameOfWeek','isRivalry']
    for needle in needles:
        hits=[i for i,l in enumerate(lines) if needle.lower() in l.lower()]
        if hits:
            print('\n###',needle)
            for i in hits[:8]:
                a=max(0,i-30); b=min(len(lines),i+100)
                print(f'--- {a+1}-{b} ---')
                print('\n'.join(lines[a:b]))
