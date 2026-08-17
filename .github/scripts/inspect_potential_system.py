from pathlib import Path
for path in [Path('artifacts/project-ice/public/world.js'), Path('artifacts/project-ice/public/game.js')]:
    text=path.read_text(errors='ignore')
    print(f'===== {path} =====')
    lines=text.splitlines()
    needles=['potential','potentialTrend','potentialAccuracy','development','developmentProfile','developmentPersonality','overall','xp','attributeXp','progression','scoutingProfile']
    hits=[]
    for i,line in enumerate(lines):
        low=line.lower()
        if any(n.lower() in low for n in needles): hits.append(i)
    shown=[]
    for i in hits[:260]:
        if any(abs(i-j)<15 for j in shown): continue
        shown.append(i)
        a=max(0,i-12); b=min(len(lines),i+24)
        print(f'--- lines {a+1}-{b} ---')
        print('\n'.join(lines[a:b]))
