from pathlib import Path
for p in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js','artifacts/project-ice/index.html']:
    text=Path(p).read_text(errors='ignore')
    print('\nFILE',p)
    low=text.lower(); needle='isdevsession'; start=0
    while True:
        i=low.find(needle,start)
        if i<0: break
        print('\n--- MATCH ---')
        print(text[max(0,i-1800):i+2600])
        start=i+1
