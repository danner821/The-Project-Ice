from pathlib import Path
for path in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js','artifacts/project-ice/public/style.css','artifacts/project-ice/index.html']:
    p=Path(path); lines=p.read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    needles=['getPotentialRole','potentialRole','potentialAccuracy','potentialConfidence','Top 9 F','Elite','Franchise','pp-development-potential','potential-badge','profile-potential','MED','LOW','HIGH','generateTeamRoster','potential:']
    for needle in needles:
        hits=[]
        for i,l in enumerate(lines):
            if needle.lower() in l.lower(): hits.append(i)
        if hits:
            print('\n###',needle)
            for i in hits[:6]:
                a=max(0,i-8); b=min(len(lines),i+18)
                print(f'--- {a+1}-{b} ---')
                print('\n'.join(lines[a:b]))
