from pathlib import Path

ROOT = Path('artifacts/project-ice')
index = (ROOT / 'index.html').read_text(encoding='utf-8', errors='ignore')
game = (ROOT / 'public/game.js').read_text(encoding='utf-8', errors='ignore')
style = (ROOT / 'public/style.css').read_text(encoding='utf-8', errors='ignore')


def extract_between(text, start, end, label):
    a = text.find(start)
    if a < 0:
        return f'### {label}\nNOT FOUND: {start}\n'
    b = text.find(end, a)
    if b < 0:
        b = min(len(text), a + 30000)
    else:
        b += len(end)
    return f'### {label}\n{text[a:b]}\n'


def extract_function(text, name):
    sigs = [f'function {name}(', f'async function {name}(']
    start = -1
    for sig in sigs:
        start = text.find(sig)
        if start >= 0:
            break
    if start < 0:
        return f'### FUNCTION {name}\nNOT FOUND\n'
    brace = text.find('{', start)
    if brace < 0:
        return f'### FUNCTION {name}\nNO BRACE\n'
    depth = 0
    quote = None
    esc = False
    i = brace
    while i < len(text):
        ch = text[i]
        if quote:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == quote:
                quote = None
        else:
            if ch in "'\"`":
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return f'### FUNCTION {name}\n{text[start:i+1]}\n'
        i += 1
    return f'### FUNCTION {name}\nUNTERMINATED\n'

parts = []
parts.append(extract_between(index, '<!-- HUB SCREEN -->', '<!-- FULL NEWS SCREEN -->', 'HUB MARKUP'))

for fn in [
    'setupHub',
    'refreshCareerUI',
    'setupHubCalendar',
    'renderHubStandings',
    'renderTeamTab',
    'renderHubNews',
    'getLivePlayersFromTeams',
    'renderScheduleKeyEvents',
    'refreshScheduleEvents',
]:
    parts.append(extract_function(game, fn))

for needle in [
    'hub-player-name',
    'hub-current-objective',
    'hub-leaders-you-name',
    'hub-info-team',
    'hub-prospects-card',
    'hubCalendarReady',
    'coachTrust',
    'startingLine',
    'specialTeams',
    'seasonStats',
    'gamesPlayed',
]:
    indexes = []
    pos = 0
    while True:
        p = game.find(needle, pos)
        if p < 0:
            break
        indexes.append(p)
        pos = p + len(needle)
    parts.append(f'### GAME CONTEXT {needle}\n')
    for p in indexes[:12]:
        parts.append(game[max(0,p-650):min(len(game),p+1250)] + '\n---\n')

css_needles = [
    '.hub-info-bar',
    '.hub-objective-bar',
    '.hub-cal',
    '.hub-event-panel',
    '.hub-dash-card',
    '.hub-leaders',
    '.hub-news',
    '.hub-prospects',
]
for needle in css_needles:
    parts.append(f'### CSS CONTEXT {needle}\n')
    pos = 0
    hits = 0
    while hits < 12:
        p = style.find(needle, pos)
        if p < 0:
            break
        parts.append(style[max(0,p-300):min(len(style),p+2200)] + '\n---\n')
        pos = p + len(needle)
        hits += 1

Path('.github/home_refresh_audit.txt').write_text(''.join(parts), encoding='utf-8')
print('HOME_REFRESH_AUDIT=PASS')
