from pathlib import Path

files = [
    Path('artifacts/project-ice/public/game.js'),
    Path('artifacts/project-ice/public/world.js'),
    Path('artifacts/project-ice/public/style.css'),
]
terms = [
    'goal', 'feed', 'play-by-play', 'playbyplay', 'live-game', 'practice', 'training',
    'schedule', 'seasonEnd', 'endDate', 'April', 'weekly', 'recovery'
]

out=[]
for path in files:
    lines = path.read_text().splitlines()
    out.append(f'===== {path} =====')
    hits=[]
    for i,line in enumerate(lines):
        low=line.lower()
        if any(t.lower() in low for t in terms):
            hits.append(i)
    merged=[]
    for i in hits:
        start=max(0,i-12); end=min(len(lines),i+24)
        if merged and start <= merged[-1][1]+4:
            merged[-1]=(merged[-1][0],max(merged[-1][1],end))
        else:
            merged.append((start,end))
    for start,end in merged[:120]:
        out.append(f'--- lines {start+1}-{end} ---')
        for j in range(start,end): out.append(f'{j+1}: {lines[j]}')
Path('.github/goal-calendar-inspection.txt').write_text('\n'.join(out))
