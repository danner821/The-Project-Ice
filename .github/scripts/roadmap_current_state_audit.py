from pathlib import Path
files={p:Path(p).read_text(errors='ignore') for p in [
'artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js','artifacts/project-ice/public/prospects.js','artifacts/project-ice/index.html']}
checks={
'game.js':[
'renderFullNewsScreen','renderLeagueNewsPreview','renderLeagueProspectsPreview','renderPlayerProfile','renderProspectsScreen',
'renderLeagueAwardsPreview','renderCareerSaveSelection','loadCareerPreview','openHubTab','btnHubViewAllNews','btnLeagueViewAllNews',
'liveGame','decision','choice','pass / shoot','pp-development-potential-accuracy','Rival Watch','organizationsWatching'],
'world.js':[
'processLivingWorldWeek','processLivingWorldForDate','publishLivingWorldNewsForWeek','buildLivingWorldAwardRaces','freshman_of_year',
'processScoutingWeek','processPersistentScoutingReports','updatePersistentScoutingReport','processPotentialWeek','evaluateDynamicPotential',
'getProjectIceDraftPotentialCalibration','organizationsWatching','rivalWatch','awardRaceSnapshots','lineupSnapshots','major_game',
'processMajorGame','season_award_winner','advanceToDate','processSeasonDate','selectCareerSave','listCareerSaves','finalizeFreshCareerAfterTryouts',
'getPotentialRoleBoundary','potentialConfidence','potentialTrend'],
'prospects.js':['REAL_PROSPECTS','2027','2028','2029','2030','realPlayer'],
'index.html':['full-news-screen','btn-hub-view-all-news','btn-league-view-all-news','league-news-preview','league-awards-preview','league-prospects-preview']}
for name,needles in checks.items():
    text=files['artifacts/project-ice/public/'+name] if name in ['game.js','world.js','prospects.js'] else files['artifacts/project-ice/index.html']
    print('\n##',name,'lines',text.count('\n')+1,'bytes',len(text.encode()))
    for needle in needles:
        print(('YES' if needle.lower() in text.lower() else 'NO '),needle)

# specific function snippets / counts
for path in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js']:
    text=files[path]
    print('\n## FUNCTIONS',path)
    for n in ['processLivingWorldWeek','processScoutingWeek','processPotentialWeek','buildLivingWorldAwardRaces','renderLeagueAwardsPreview','renderLeagueProspectsPreview','renderFullNewsScreen']:
        idx=text.find('function '+n)
        print(n, idx)

# prospects stats
p=files['artifacts/project-ice/public/prospects.js']
print('\n## prospects rough counts')
for year in ['2027','2028','2029','2030']:
    print(year,p.count(year))
print('realPlayer true',p.count('realPlayer: true'))
