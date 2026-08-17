from pathlib import Path

FILES = [
    Path('artifacts/project-ice/public/world.js'),
    Path('artifacts/project-ice/public/game.js'),
    Path('artifacts/project-ice/index.html'),
]
TERMS = [
    'powerPlayOpportunities',
    'powerPlayGoals',
    'postgameSummary',
    'finalizeLiveGameSimulation',
    'createLiveGameSimulationState',
    'penaltyMinutes',
]

out = []
for path in FILES:
    lines = path.read_text().splitlines()
    out.append(f'===== {path} =====')
    hits = [i for i, line in enumerate(lines) if any(term in line for term in TERMS)]
    merged = []
    for i in hits:
        start = max(0, i - 18)
        end = min(len(lines), i + 36)
        if merged and start <= merged[-1][1] + 5:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    for start, end in merged:
        out.append(f'--- lines {start+1}-{end} ---')
        for j in range(start, end):
            out.append(f'{j+1}: {lines[j]}')

Path('.github/pp-summary-inspection.txt').write_text('\n'.join(out))
