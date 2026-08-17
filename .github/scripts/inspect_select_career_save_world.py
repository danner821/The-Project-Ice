from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore')
i=s.find('selectCareerSave')
print('FIRST',i)
while i>=0:
    print('\n---\n',s[max(0,i-2500):i+12000])
    i=s.find('selectCareerSave',i+1)
