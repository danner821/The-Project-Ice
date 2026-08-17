from pathlib import Path
for fname in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js']:
    lines=Path(fname).read_text().splitlines()
    print('\n###',fname)
    terms=['processSeasonDate','advanceToDate','practice','recovery','news','scout','weekly','event','schedule','generateSeasonSchedule','career hub','renderHome','renderSchedule','refreshHome']
    hits=[]
    for i,line in enumerate(lines):
        low=line.lower()
        if any(t.lower() in low for t in terms): hits.append(i)
    seen=[]
    for i in hits:
        if any(abs(i-x)<70 for x in seen): continue
        seen.append(i)
        print(f'\n===== around {i+1} =====')
        for j in range(max(0,i-45),min(len(lines),i+100)):
            print(f'{j+1}: {lines[j]}')
