from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js']:
    lines=Path(path).read_text().splitlines()
    print('FILE',path)
    terms=['startingOverall','overallTryoutScore','lineupAssignment','rosterSlot','startingLine','calculateOverall','overall =','attributes']
    hits=[]
    for i,line in enumerate(lines):
        if any(t in line for t in terms): hits.append(i)
    for i in hits[:120]:
        print(f'--- {i+1} ---')
        for j in range(max(0,i-5),min(len(lines),i+12)):
            print(f'{j+1}: {lines[j]}')
