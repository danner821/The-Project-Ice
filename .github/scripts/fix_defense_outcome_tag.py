from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(encoding='utf-8')
old="outcomeTag = wonPuck ? 'TAKEAWAY' : succeeded ? 'DEFENDED' : 'BEATEN';"
new="resultTag = wonPuck ? 'TAKEAWAY' : succeeded ? 'DEFENDED' : 'BEATEN';"
if old not in s:
    raise SystemExit('target outcomeTag assignment not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
