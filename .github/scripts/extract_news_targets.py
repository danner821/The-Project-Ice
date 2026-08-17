from pathlib import Path
import re

def extract_function(text, name):
    start=text.find(f'function {name}')
    if start<0: return f'NOT FOUND {name}\n'
    i=text.find('{', start)
    depth=0
    in_s=in_d=in_t=False
    esc=False
    for j in range(i,len(text)):
        c=text[j]
        if esc: esc=False; continue
        if c=='\\': esc=True; continue
        if not in_d and not in_t and c=="'": in_s=not in_s; continue
        if not in_s and not in_t and c=='"': in_d=not in_d; continue
        if not in_s and not in_d and c=='`': in_t=not in_t; continue
        if in_s or in_d or in_t: continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0: return text[start:j+1]+'\n'
    return text[start:start+5000]

g=Path('artifacts/project-ice/public/game.js').read_text(errors='ignore')
w=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore')
out=[]
for name in ['renderHubNews','renderLeagueNewsPreview','renderLeagueProspectsPreview']:
    out.append('\n### GAME '+name+'\n'+extract_function(g,name))
for needle in ['const news =','news: {','publishNews','createNews','getRecent','onNewsChange']:
    idx=w.find(needle)
    if idx>=0:
        out.append('\n### WORLD '+needle+'\n'+w[max(0,idx-1200):idx+5000])
Path('.github/news_targets.txt').write_text('\n'.join(out))
