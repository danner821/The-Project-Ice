from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js']:
    s=Path(path).read_text(errors='ignore')
    print('\nFILE',path)
    for needle in ['renderLeagueAwardsPreview','league-awards-preview','refreshTeamRosterManagement','lineupAssignment','rosterSlot','buildLivingWorldWeeklySnapshot','processLivingWorldWeek']:
        print('\n###',needle)
        start=0; found=0
        while found<8:
            i=s.lower().find(needle.lower(),start)
            if i<0: break
            print(s[max(0,i-1800):i+5200])
            start=i+1; found+=1
