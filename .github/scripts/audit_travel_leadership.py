from pathlib import Path
import re

root=Path('artifacts/project-ice')
for p in [root/'public/game.js', root/'public/world.js', root/'public/travel-hockey-roster-world.js', root/'public/travel-hockey-canonical-ui.js']:
    text=p.read_text(errors='ignore')
    print(f'\n===== {p} =====')
    for m in re.finditer(r'(?i)captain|alternate|leadership-badge|tp-roster-player-name-wrap', text):
        a=max(0,m.start()-500); b=min(len(text),m.start()+900)
        print(text[a:b].replace('\r',''))
        print('\n---MATCH---\n')
