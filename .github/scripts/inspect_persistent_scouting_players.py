from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore').splitlines()
for name in ['processPersistentScoutingReports','updatePersistentScoutingReport','updatePersistentScoutingOrganizations']:
    hit=next((i for i,l in enumerate(s) if f'function {name}' in l),None)
    print(f'### {name} {hit+1 if hit is not None else -1}')
    if hit is not None: print('\n'.join(s[max(0,hit-10):min(len(s),hit+120)]))
