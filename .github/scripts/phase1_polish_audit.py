from pathlib import Path
import re

game = Path('artifacts/project-ice/public/game.js').read_text(encoding='utf-8')
world = Path('artifacts/project-ice/public/world.js').read_text(encoding='utf-8')

sections=[]

def grab(text, pattern, label, before=1600, after=5000):
    m=re.search(pattern,text,re.I|re.M)
    if not m:
        sections.append(f'## {label}\nNOT FOUND\n')
        return
    a=max(0,m.start()-before); b=min(len(text),m.start()+after)
    sections.append(f'## {label}\n```js\n{text[a:b]}\n```\n')

# schedule month/view state
for pattern,label in [
    (r'schedule.*month','game schedule month first match'),
    (r'currentMonth','game currentMonth first match'),
    (r'renderSchedule','game renderSchedule first match'),
    (r'schedule-tab','game schedule-tab first match'),
]: grab(game,pattern,label)

# live deployment / shifts / TOI
for pattern,label in [
    (r'homeDeployment','world homeDeployment first match'),
    (r'shift','world shift first match'),
    (r'deployment','world deployment first match'),
    (r'lineupAssignment','world lineupAssignment first match'),
]: grab(world,pattern,label,2200,8000)

Path('artifacts/project-ice/PHASE1_POLISH_AUDIT_TEMP.md').write_text('\n\n'.join(sections),encoding='utf-8')
