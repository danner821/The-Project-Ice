from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')
old='''            <span class="pr-player-reputation">\n              ${stars}\n            </span>'''
count=s.count(old)
if count != 1:
    raise SystemExit(f'expected exactly 1 fallback reputation block, found {count}')
new='''            <span class="pr-player-context">\n              ${[\n                player.teamName || player.currentTeam || player.realTeamSnapshot || '',\n                player.league || player.realLeagueSnapshot || 'HS',\n              ]\n                .map(value => String(value || '').trim())\n                .filter(Boolean)\n                .filter((value, index, values) => values.indexOf(value) === index)\n                .join(' · ') || 'Prospect'}\n            </span>'''
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('FALLBACK_REPUTATION_BLOCK_REPLACED=1')
