from pathlib import Path
s=Path('artifacts/project-ice/public/world.js').read_text(errors='ignore')
for name in ['async function load(', 'function getWorldRecordId', 'function readCareerSaveIndex', 'function buildCareerSaveMetadata', 'async function listCareerSaves']:
    i=s.find(name)
    print('\n###',name,'@',i)
    if i>=0: print(s[max(0,i-1800):i+9000])
