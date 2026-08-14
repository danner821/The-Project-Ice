from pathlib import Path
for rel in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js']:
    text=Path(rel).read_text(encoding='utf-8')
    print('\nFILE', rel)
    for needle in ['pendingCareerDecision','function advanceLiveGameStep','function resolveLiveGameHit','function resolveLiveGameTakeaway','function maybeOpenLiveGameCareerDecision']:
        i=text.find(needle)
        print('\nNEEDLE', needle, 'AT', i)
        if i>=0:
            print(text[max(0,i-2500):i+7000])