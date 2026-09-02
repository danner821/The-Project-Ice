from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js').read_text(errors='ignore').splitlines()
CSS = Path('artifacts/project-ice/public/style.css').read_text(errors='ignore').splitlines()
CANON = Path('artifacts/project-ice/public/travel-hockey-canonical-ui.js').read_text(errors='ignore').splitlines()


def show(lines, needle, before=20, after=120):
    hits=[i for i,l in enumerate(lines) if needle in l]
    print(f'\n### {needle} HITS {[i+1 for i in hits[:8]]}')
    for i in hits[:4]:
        print('\n'.join(lines[max(0,i-before):min(len(lines),i+after)]))
        print('\n---CUT---\n')

print('=== GAME ===')
for needle in [
    'function renderTeamProfile',
    'renderTeamProfile =',
    'team-profile-modern-content',
    'team-page-root',
    'cloneNode',
    'function getCanonicalProspectBadgeHtml',
    'const prospectBadge',
    '${prospectBadge}',
    'getCanonicalProspectBadgeHtml(player, true)',
]:
    show(GAME, needle)

print('=== CSS ===')
for needle in [
    '.tp-roster-row__name',
    '.tp-roster-player-name-wrap',
    '.tp-player-link',
    '.pi-prospect-rank-badge',
    '.lineup-player__name',
]:
    show(CSS, needle, 12, 60)

print('=== TRAVEL CANONICAL ===')
for needle in ['openTravelTeamProfile','openTeamProfile','renderTeamProfile','cleanupAdapter']:
    show(CANON, needle, 20, 100)
