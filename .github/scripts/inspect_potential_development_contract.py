from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore').splitlines()
needles=['awardPlayerXP','spend','attributeXP','processLeagueDevelopmentWeek','developmentMultiplier','potentialRole','potentialConfidence','potentialSignal','development.dna','potential']
for needle in needles:
    print(f'\n===== {needle} =====')
    count=0
    for i,line in enumerate(s):
        if needle.lower() in line.lower():
            a=max(0,i-18); b=min(len(s),i+42)
            print(f'--- lines {a+1}-{b} ---')
            print('\n'.join(s[a:b]))
            count+=1
            if count>=8: break
