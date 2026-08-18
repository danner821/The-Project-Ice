from pathlib import Path

# Focused Home runtime audit.
ROOT = Path('artifacts/project-ice')
game = (ROOT / 'public/game.js').read_text(encoding='utf-8', errors='ignore')
style = (ROOT / 'public/style.css').read_text(encoding='utf-8', errors='ignore')


def extract_function(text, name):
    sigs = [f'function {name}(', f'async function {name}(']
    start = next((text.find(sig) for sig in sigs if text.find(sig) >= 0), -1)
    if start < 0:
        return f'### FUNCTION {name}\nNOT FOUND\n\n'
    brace = text.find('{', start)
    depth = 0
    quote = None
    esc = False
    i = brace
    while 0 <= i < len(text):
        ch = text[i]
        if quote:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == quote:
                quote = None
        else:
            if ch in "'\"`": quote = ch
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return f'### FUNCTION {name}\n{text[start:i+1]}\n\n'
        i += 1
    return f'### FUNCTION {name}\nUNTERMINATED\n\n'


def contexts(text, needle, radius=900, max_hits=8):
    out = [f'### CONTEXT {needle}\n']
    pos = 0
    for _ in range(max_hits):
        p = text.find(needle, pos)
        if p < 0: break
        out.append(text[max(0,p-radius):min(len(text),p+radius)] + '\n---\n')
        pos = p + len(needle)
    return ''.join(out) + '\n'

parts = []
for fn in [
    'refreshCareerUI', 'setupHubCalendar', 'renderHubStandings', 'renderTeamTab',
    'renderHubNews', 'getLivePlayersFromTeams', 'renderPlayerProfile',
    'getCareerPlayerFromWorldState', 'getTeamById', 'getTeamLeaders',
    'formatLineAssignment', 'renderLeagueLeadersPreview'
]:
    parts.append(extract_function(game, fn))

for needle in [
    "document.getElementById('hub-player-name')", 'hub-player-name', 'hub-current-objective',
    'hub-info-team', 'coachTrust', 'startingLine', 'powerPlayUnit', 'penaltyKillUnit',
    'upgradeAvailable', 'attributeXp', 'developmentState', 'seasonStats', 'lastGame',
    'recentGames', 'completedGames', 'prospectRank', 'scoutingProfile', 'reputationStars'
]:
    parts.append(contexts(game, needle))

for needle in ['.hub-info-bar', '.hub-objective-bar', '.hub-cal', '.hub-dash-card', '.hub-leaders', '.hub-news']:
    parts.append(contexts(style, needle, radius=1500, max_hits=5))

Path('.github/home_refresh_runtime_audit.txt').write_text(''.join(parts), encoding='utf-8')
print('HOME_REFRESH_RUNTIME_AUDIT=PASS')
