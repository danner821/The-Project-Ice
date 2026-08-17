from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore').splitlines()
needles=['evaluatePlayerAnnualPotentialChange(','evaluatePlayerAnnualDevelopmentTrajectory(','getPotentialDevelopmentMultiplier(','getAttributeUpgradeRequirement(','processNPCDevelopmentWeek(','processPotentialWeek(']
for needle in needles:
    print(f'\n===== {needle} CALL SITES =====')
    for i,line in enumerate(s):
        if needle in line:
            a=max(0,i-8); b=min(len(s),i+18)
            print(f'--- lines {a+1}-{b} ---')
            print('\n'.join(s[a:b]))
