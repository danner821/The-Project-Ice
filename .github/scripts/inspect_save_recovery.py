from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
lines=p.read_text().splitlines()
terms=['function save(', 'buildCareerSaveMetadata', 'upsertCareerSaveMetadata', 'PENDING_CAREER_ID_KEY', 'ACTIVE_CAREER_ID_KEY', 'beginNewCareerSave', 'commitActiveCareerSave', 'listCareerSaves']
for term in terms:
    for i,line in enumerate(lines):
        if term in line:
            print(f'===== {term} @ {i+1} =====')
            for j in range(max(0,i-35), min(len(lines), i+140)):
                print(f'{j+1}: {lines[j]}')
            break
