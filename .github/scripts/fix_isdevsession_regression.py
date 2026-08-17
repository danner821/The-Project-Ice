from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()
s=s.replace('  if (isDevSession) return;','  if (window.PROJECT_ICE_DEV_SESSION === true) return;',1)
s=s.replace('    isDevSession = true;\n    window.PROJECT_ICE_DEV_SESSION = true;','    window.PROJECT_ICE_DEV_SESSION = true;',1)
if 'isDevSession' in s:
    raise SystemExit('orphan isDevSession references remain')
p.write_text(s)
print('fixed isDevSession regression')
