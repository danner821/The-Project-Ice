from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')
for needle in ['function applyGameResultToSkaterStats','function applyGameResultToGoalieStats','function createEmptySkaterGameLine','function createEmptyGoalieGameLine','function applyGameResultToTeamsAndSchedule','threeStars','postgameSummary','function processSeasonDate']:
    print('\n###',needle)
    i=s.find(needle)
    if i<0:
        print('NOT FOUND'); continue
    start=s.count('\n',0,i)+1
    snippet=s[i:i+9000]
    print(f'LINE {start}')
    print(snippet)
