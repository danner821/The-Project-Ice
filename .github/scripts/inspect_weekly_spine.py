from pathlib import Path
lines=Path('artifacts/project-ice/public/world.js').read_text().splitlines()
patterns=['function processDate','function advanceToDate','processDate(','advanceToDate(','weekly','lastProcessed','awardSnapshots','prospectRankings','ranking','news.publish','publishNews','lineup','recentForm','coachTrust']
for pat in patterns:
 print('\n###',pat)
 for i,l in enumerate(lines):
  if pat.lower() in l.lower():
   a=max(0,i-12); b=min(len(lines),i+28)
   for j in range(a,b): print(f'{j+1}: {lines[j]}')
