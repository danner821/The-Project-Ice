from pathlib import Path
import re
text=Path('artifacts/project-ice/public/world.js').read_text(encoding='utf-8')
parts=[]
for term in ['deploymentAgeSeconds','forwardLine','defensePair','specialTeamsUnit','careerPlayer','shiftSeconds']:
    parts.append(f'## {term}')
    matches=list(re.finditer(term,text,re.I))
    for i,m in enumerate(matches[:12]):
        a=max(0,m.start()-1800); b=min(len(text),m.start()+4200)
        parts.append(f'### match {i+1}\n```js\n{text[a:b]}\n```')
Path('artifacts/project-ice/PHASE1_TOI_AUDIT_TEMP.md').write_text('\n\n'.join(parts),encoding='utf-8')
