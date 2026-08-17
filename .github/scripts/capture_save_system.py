from pathlib import Path
out=[]
for f in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js','artifacts/project-ice/index.html','artifacts/project-ice/public/style.css']:
    lines=Path(f).read_text().splitlines(); out.append('==== '+f+' ====')
    terms=['WORLD_RECORD_ID','openWorldDatabase','indexedDB','transaction(','objectStore(','put(','get(','delete(','function save','async function save','function load','async function load','Continue Career','New Career','btnContinue','btnNew','continue-career','new-career']
    hits=[]
    for i,l in enumerate(lines):
        if any(t.lower() in l.lower() for t in terms): hits.append(i)
    ranges=[]
    for i in hits:
        a=max(0,i-45); b=min(len(lines),i+140)
        if ranges and a<=ranges[-1][1]+10: ranges[-1][1]=max(ranges[-1][1],b)
        else:ranges.append([a,b])
    for a,b in ranges:
        out.append(f'--- {a+1}-{b} ---')
        out.extend(f'{j+1}: {lines[j]}' for j in range(a,b))
Path('.github/save-system-inspection.txt').write_text('\n'.join(out))
