from pathlib import Path
import re

files = {
    'game': Path('artifacts/project-ice/public/game.js').read_text(),
    'world': Path('artifacts/project-ice/public/world.js').read_text(),
    'html': Path('artifacts/project-ice/index.html').read_text(),
    'css': Path('artifacts/project-ice/public/style.css').read_text(),
}

def block(text, needle, before=1000, after=5000):
    i = text.find(needle)
    if i < 0:
        return f'NOT FOUND: {needle}'
    return text[max(0,i-before):min(len(text),i+after)]

parts=[]
for title,key,needle,b,a in [
    ('SHOWSCREEN','game','function showScreen',1200,6000),
    ('OPEN PREGAME','game','function openPregameMatchup',1200,9000),
    ('PREGAME HTML','html','btn-pregame-sim',2500,5000),
    ('LIVE HTML','html','live-game-screen',2500,9000),
    ('POSTGAME HTML','html','postgame-summary-screen',2500,6000),
    ('SIM APPROVAL','world','careerGameSimApproval',5000,10000),
    ('ADVANCE DATE','world','function advanceToDate',2500,14000),
    ('TOI ACCRUAL','world','timeOnIceSeconds',6000,8000),
    ('SPECIAL TEAMS SHIFT','world','specialTeamsShiftUnit',5000,10000),
]:
    parts.append(f'\n\n===== {title} =====\n'+block(files[key],needle,b,a))

# CSS rules containing relevant selectors, with context.
css=files['css']
for needle in ['#pregame-matchup-screen','#live-game-screen','#postgame-summary-screen','.screen','live-game-career-decision','live-game-career-outcome']:
    parts.append(f'\n\n===== CSS {needle} =====\n'+block(css,needle,1500,4500))

Path('.github/deep-inspection.txt').write_text(''.join(parts))
