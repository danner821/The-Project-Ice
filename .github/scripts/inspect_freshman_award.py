from pathlib import Path
for path in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js','artifacts/project-ice/index.html']:
    text=Path(path).read_text(errors='ignore')
    print('\nFILE', path)
    for needle in ['function buildLivingWorldAwardRaces','award_leader_change','career_award_top_three','currentLeagueAwardRaces','function renderLeagueAwardsPreview','seasonAwards','awardsHistory','Freshman','year ||','classYear']:
        idx=text.find(needle)
        if idx>=0:
            print('\n###', needle)
            print(text[max(0,idx-1800):idx+7000])
