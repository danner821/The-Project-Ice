from pathlib import Path
for path in ['artifacts/project-ice/public/world.js','artifacts/project-ice/public/game.js']:
    lines=Path(path).read_text().splitlines()
    terms=['recoverOfficialCareerFromPreview','finalizeFreshCareerAfterTryouts','calculateTryoutPlacement','overallTryoutScore','startingOverall','lineupAssignment','tryoutResults']
    print('\n###', path)
    for term in terms:
        hits=[i for i,l in enumerate(lines) if term in l]
        for i in hits[:5]:
            print(f'===== {term} @ {i+1} =====')
            for j in range(max(0,i-35), min(len(lines), i+120)):
                print(f'{j+1}: {lines[j]}')
