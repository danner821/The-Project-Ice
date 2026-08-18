from pathlib import Path
import subprocess

GOOD='016596c1e3a2f9c1b9914a4940a8760630cd21c7'
path='artifacts/project-ice/public/game.js'
current=Path(path).read_text(errors='ignore')

def extract_function(text, name):
    marker=f'function {name}'
    start=text.find(marker)
    if start < 0:
        raise SystemExit(f'current function missing: {name}')
    brace=text.find('{', start)
    depth=0
    state=None
    esc=False
    for i in range(brace, len(text)):
        c=text[i]
        if esc:
            esc=False
            continue
        if c=='\\':
            esc=True
            continue
        if state:
            if c==state:
                state=None
            continue
        if c in "'\"`":
            state=c
            continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0:
                return text[start:i+1]
    raise SystemExit(f'unbalanced function: {name}')

def replace_function(text, name, replacement):
    old=extract_function(text,name)
    return text.replace(old,replacement,1)

# Preserve ONLY the intentional Freshman-aware award presentation from current.
award_fn=extract_function(current,'renderLeagueAwardsPreview')
if 'freshman_of_year' not in award_fn or 'Freshman' not in award_fn:
    raise SystemExit('current Freshman award renderer is not present')

base=subprocess.check_output(['git','show',f'{GOOD}:{path}'],text=True)
restored=replace_function(base,'renderLeagueAwardsPreview',award_fn)

# These are core functions that disappeared during the accidental truncation.
required=[
    'renderCareerSaveSelection',
    'loadCareerPreview',
    'recoverCareerPreviewFromWorld',
    'renderLeagueProspectsPreview',
    'renderFullNewsScreen',
    'renderLeagueNewsPreview',
]
for name in required:
    if f'function {name}' not in restored and f'async function {name}' not in restored:
        raise SystemExit(f'restored core function missing: {name}')

# The old orphan local isDevSession reference was itself already present in the
# known-good file. Keep behavior but make it safe using the existing global flag.
restored=restored.replace('  if (isDevSession) return;','  if (window.PROJECT_ICE_DEV_SESSION === true) return;',1)
restored=restored.replace('    isDevSession = true;\n    window.PROJECT_ICE_DEV_SESSION = true;','    window.PROJECT_ICE_DEV_SESSION = true;',1)

Path(path).write_text(restored)
print('restored game.js from last user-confirmed working commit and preserved Freshman award UI')
