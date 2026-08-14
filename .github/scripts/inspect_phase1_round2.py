from pathlib import Path
for fn in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js']:
    s=Path(fn).read_text()
    print('\n### FILE',fn)
    pats=['sameDayCareerGameSim','btn-sim-game','Sim Game','function simulateToDate','function handleLiveGameCompletion','function maybeOpenLiveGameCareerDecision','function submitLiveGameCareerDecision','function openPostgameSummary','function startLiveGamePlayback','selectLiveGameEvenStrengthDeployment','timeOnIceSeconds','specialTeamsShiftUnit']
    for pat in pats:
        i=s.find(pat)
        if i>=0:
            print('\n===== '+pat+' =====')
            print(s[max(0,i-1800):i+5000])
