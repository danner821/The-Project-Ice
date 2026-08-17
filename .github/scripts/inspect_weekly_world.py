from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
lines=p.read_text().splitlines()
terms=['processWeek','weekly','award','prospect','recentForm','coachTrust','scouting','news','objective','lineup','specialTeams','processDate','advanceToDate']
out=[]
for i,line in enumerate(lines):
    low=line.lower()
    if any(t.lower() in low for t in terms):
        start=max(0,i-16); end=min(len(lines),i+34)
        out.append(f'--- {start+1}-{end} ---')
        out.extend(f'{j+1}: {lines[j]}' for j in range(start,end))
Path('.github/weekly-world-inspection.txt').write_text('\n'.join(out))
