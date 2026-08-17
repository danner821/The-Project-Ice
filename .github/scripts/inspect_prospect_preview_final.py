from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')
needles=['renderLeagueProspectsPreview','league-prospects-preview','currentProspectRankings','btn-league-full-prospects']
out=[]
for n in needles:
    out.append(f'\n### {n}\n')
    start=0; count=0
    while True:
        i=s.find(n,start)
        if i<0: break
        line=s.count('\n',0,i)+1
        out.append(f'LINE {line}\n{s[max(0,i-1800):i+5000]}\n')
        start=i+1; count+=1
        if count>=12: break
Path('.github/prospect_preview_final_audit.txt').write_text('\n'.join(out))
