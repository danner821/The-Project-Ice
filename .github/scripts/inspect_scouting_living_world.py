from pathlib import Path
for path in [Path('artifacts/project-ice/public/world.js'), Path('artifacts/project-ice/public/game.js')]:
    text=path.read_text(errors='ignore')
    print(f'===== {path} =====')
    needles=['scout','Scouting','prospectRankings','hasScouts','scoutsAttending','recentBeats','newsItems','League News','Player tab','renderPlayer','renderHome','Home']
    lines=text.splitlines()
    hits=[]
    for i,line in enumerate(lines):
        low=line.lower()
        if any(n.lower() in low for n in needles):
            hits.append(i)
    shown=set()
    for i in hits[:180]:
        a=max(0,i-8); b=min(len(lines),i+14)
        key=(a,b)
        if any(abs(i-j)<12 for j in shown):
            continue
        shown.add(i)
        print(f'--- lines {a+1}-{b} ---')
        print('\n'.join(lines[a:b]))
