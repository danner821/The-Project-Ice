from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()
patterns=['blockingScheduleEvent.eventId','function submitLiveGameCareerDecision','live-game-final-continue']
for pat in patterns:
    i=s.find(pat)
    print('\n===== '+pat+' =====')
    if i<0:
        print('NOT FOUND')
    else:
        print(s[max(0,i-1800):i+2600])
