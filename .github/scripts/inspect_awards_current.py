from pathlib import Path
for path in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js']:
    lines=Path(path).read_text(errors='ignore').splitlines()
    print('\nFILE',path)
    names=['renderLeagueAwardsPreview','buildLivingWorldAwardRaces','processLivingWorldAwardRaces']
    for name in names:
        hit=next((i for i,l in enumerate(lines) if f'function {name}' in l),None)
        print(f'\n### {name} LINE {hit+1 if hit is not None else -1}')
        if hit is not None:
            # print through next same-indent function or max 500 lines
            end=min(len(lines),hit+500)
            for j in range(hit+1,end):
                if lines[j].startswith('function ') or lines[j].startswith('  function '):
                    end=j
                    break
            print('\n'.join(lines[max(0,hit-15):end]))
