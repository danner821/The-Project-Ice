from pathlib import Path
for fn in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js','artifacts/project-ice/public/index.html']:
    p=Path(fn)
    s=p.read_text()
    print('\n###', fn)
    pats=[
      'btn-pregame-sim','btn-live-game-continue','Continue','openPostgameSummary','handleLiveGameCompletion',
      'maybeOpenLiveGameCareerDecision','submitLiveGameCareerDecision','pauseLiveGamePlayback','startLiveGamePlayback',
      'liveGameCareerTOISeconds','careerGameSimApproval','function simulateToDate','showScreen(\'postgame',
      'postgame-summary','gameComplete','decisionPending','targetTOI','timeOnIceSeconds','forwardLineWeights'
    ]
    for pat in pats:
        start=0; hits=0
        while True:
            i=s.find(pat,start)
            if i<0: break
            hits+=1
            print(f'\n===== {pat} hit {hits} @ {i} =====')
            print(s[max(0,i-2500):i+6500])
            start=i+len(pat)
            if hits>=8: break
