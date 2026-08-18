from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore').splitlines()
for name in ['getPlayerById','processScoutingWeek','processPotentialWeek','calculateWeeklyScoutingScore']:
    hit=next((i for i,l in enumerate(s) if f'function {name}' in l),None)
    print(f'\n### {name} LINE {hit+1 if hit is not None else -1}')
    if hit is not None:
        a=max(0,hit-20); b=min(len(s),hit+180)
        print('\n'.join(s[a:b]))
