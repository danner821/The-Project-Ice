from pathlib import Path

FILES = [
    Path('artifacts/project-ice/public/world.js'),
    Path('artifacts/project-ice/public/game.js'),
    Path('artifacts/project-ice/index.html'),
]
TERMS = [
    'postgameSummary', 'openPostgameSummary', 'team stats', 'Team Stats',
    'powerPlay', 'power play', 'power-play', 'penalty', 'penalties',
    'manAdvantage', 'strength', 'specialTeams'
]

out = []
for path in FILES:
    text = path.read_text()
    lines = text.splitlines()
    out.append(f'===== {path} =====')
    hits = []
    for i, line in enumerate(lines):
        if any(term.lower() in line.lower() for term in TERMS):
            hits.append(i)
    # Keep useful clusters, with generous context but avoid duplicates.
    seen = set()
    for i in hits:
        start = max(0, i - 14)
        end = min(len(lines), i + 30)
        key = (start // 20, end // 20)
        if key in seen:
            continue
        seen.add(key)
        out.append(f'--- lines {start+1}-{end} ---')
        for j in range(start, end):
            out.append(f'{j+1}: {lines[j]}')
        if len(seen) >= 80:
            break

Path('.github/pp-summary-inspection.txt').write_text('\n'.join(out))
