from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js','artifacts/project-ice/index.html']:
    lines=Path(path).read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    needles=['function openPlayerProfile','function renderPlayerProfile','player-profile-potential-role','player-profile-potential-accuracy','player-profile-scouting','scoutingProfile','potentialTrend','birthDate','nationality','realTeamSnapshot','attributes']
    for needle in needles:
        hits=[i for i,l in enumerate(lines) if needle in l]
        if hits:
            print('\n###',needle,'HITS', [i+1 for i in hits[:8]])
            for i in hits[:3]:
                print('\n'.join(lines[max(0,i-12):min(len(lines),i+85)]))
