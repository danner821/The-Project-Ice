from pathlib import Path
for f in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js','artifacts/project-ice/index.html','artifacts/project-ice/public/style.css']:
    p=Path(f); lines=p.read_text().splitlines(); print('\n====',f,'====')
    terms=['WORLD_RECORD_ID','openWorldDatabase','function save','async function save','function load','async function load','Continue Career','New Career','btnContinue','btnNew','continue-career','new-career','reset','buildDefaults','SAVE_KEY','localStorage']
    hits=[]
    for i,l in enumerate(lines):
        if any(t.lower() in l.lower() for t in terms): hits.append(i)
    ranges=[]
    for i in hits:
        a=max(0,i-30); b=min(len(lines),i+100)
        if ranges and a<=ranges[-1][1]: ranges[-1][1]=max(ranges[-1][1],b)
        else: ranges.append([a,b])
    for a,b in ranges[:80]:
        print(f'--- {a+1}-{b} ---')
        for j in range(a,b): print(f'{j+1}: {lines[j]}')
