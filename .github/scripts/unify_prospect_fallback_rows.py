from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')

old="""            <span class=\"pr-col pr-col--name\">\n            <span class=\"pr-player-name\">\n              ${fullName}\n            </span>\n\n            <span class=\"pr-player-reputation\">\n              ${stars}\n            </span>\n          </span>\n"""
if old not in s:
    raise SystemExit('fallback reputation row anchor missing')

new="""            <span class=\"pr-col pr-col--name\">\n            <span class=\"pr-player-name\">\n              ${fullName}\n            </span>\n\n            <span class=\"pr-player-context\">\n              ${[player.teamName || player.currentTeam || player.realTeamSnapshot || '', player.league || player.realLeagueSnapshot || 'HS']\n                .map(value => String(value || '').trim())\n                .filter(Boolean)\n                .filter((value, index, values) => values.indexOf(value) === index)\n                .join(' · ') || 'Prospect'}\n            </span>\n          </span>\n"""
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('FALLBACK_PROSPECT_ROWS_UNIFIED=1')
