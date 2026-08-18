from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')
for name in ['buildDefaults','getPlayerById','processScoutingWeek','processPotentialWeek','calculateWeeklyScoutingScore','ensureScoutingProfile','getScoutingExposureSummary']:
    for prefix in ['function '+name,'async function '+name]:
        i=s.find(prefix)
        if i>=0:
            print('\n###',name,'@',i)
            print(s[max(0,i-2500):i+12000])
            break
