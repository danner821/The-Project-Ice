from pathlib import Path
for fp, terms in [
    ('artifacts/project-ice/public/world.js', ['function save(', 'buildCareerSaveMetadata', 'listCareerSaves', 'beginNewCareerSave', 'commitActiveCareerSave']),
    ('artifacts/project-ice/public/game.js', ['SAVE_KEY', 'saveCareerPreview', 'loadCareerPreview', 'WorldEngine.load', 'renderCareerSaveList', 'btn-continue-career'])
]:
    p=Path(fp); lines=p.read_text().splitlines()
    print(f'######## {fp} ########')
    for term in terms:
        for i,line in enumerate(lines):
            if term in line:
                print(f'===== {term} @ {i+1} =====')
                for j in range(max(0,i-45), min(len(lines), i+160)):
                    print(f'{j+1}: {lines[j]}')
                break
