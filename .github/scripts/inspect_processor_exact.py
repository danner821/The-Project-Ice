from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text()
idx=s.find('function processSeasonDate')
if idx<0: raise SystemExit('not found')
print(s[idx:idx+14000])
