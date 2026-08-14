from pathlib import Path
text=Path('artifacts/project-ice/public/world.js').read_text(encoding='utf-8')
name='selectLiveGameEvenStrengthDeployment'
start=text.find('function '+name+'(')
if start<0: raise SystemExit('selector not found')
# next function boundary
end=text.find('\n  function ', start+20)
if end<0: end=min(len(text),start+20000)
Path('artifacts/project-ice/LIVE_SELECTOR_TEMP.txt').write_text(text[start:end],encoding='utf-8')
