from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js']:
    text=Path(path).read_text(errors='ignore')
    print('\nFILE',path)
    for needle in ['REAL_PROSPECTS','renderProspectsScreen','currentProspectRankings','prospectRankings','visibleProspects','draftYear','realPlayer']:
        start=0; hits=0
        while True:
            i=text.find(needle,start)
            if i<0: break
            print(f'\n### {needle} @ {i}\n{text[max(0,i-2500):i+5000]}')
            start=i+len(needle); hits+=1
            if hits>=5: break
