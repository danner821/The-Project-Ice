from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')
needles=['renderCareerSaveSelection','selectCareerSave','career-save','ACTIVE_CAREER_ID_KEY','PENDING_CAREER_ID_KEY','addEventListener(\'click\'','addEventListener("click"']
for n in needles:
    print('\n###',n)
    start=0
    low=s.lower(); needle=n.lower()
    count=0
    while True:
        i=low.find(needle,start)
        if i<0: break
        print(s[max(0,i-2400):i+4200])
        print('\n---')
        start=i+1; count+=1
        if count>=10: break
