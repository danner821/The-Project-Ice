from pathlib import Path
for p in ['artifacts/project-ice/public/game.js','artifacts/project-ice/public/world.js']:
    s=Path(p).read_text(errors='ignore')
    print('\nFILE',p)
    for name in ['loadCareerPreview','recoverCareerPreviewFromWorld','selectCareerSave','listCareerSaves','loadCareerSave','commitActiveCareerSave']:
        idx=s.find(f'function {name}')
        if idx<0:
            idx=s.find(f'async function {name}')
        if idx<0:
            idx=s.find(f'{name}(')
        print('\n###',name,'@',idx)
        if idx>=0:
            print(s[max(0,idx-1200):idx+9000])
