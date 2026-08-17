from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
lines=p.read_text().splitlines()
terms=['function listCareerSaves', 'async function listCareerSaves', 'function openWorldDatabase', 'const WORLD_STORE_NAME', 'CAREER_INDEX_KEY', 'getWorldRecordId', 'getAll(', 'openCursor', 'async function selectCareerSave']
for term in terms:
    for i,line in enumerate(lines):
        if term in line:
            print(f'===== {term} @ {i+1} =====')
            for j in range(max(0,i-45), min(len(lines), i+180)):
                print(f'{j+1}: {lines[j]}')
            break
