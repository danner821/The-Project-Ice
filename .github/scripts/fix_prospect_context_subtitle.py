from pathlib import Path

game_path = Path('artifacts/project-ice/public/game.js')
css_path = Path('artifacts/project-ice/public/style.css')

game = game_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

old = """        const reputationStars = Math.max(
          1,
          Math.min(5, Number(player.reputationStars) || 1)
        );
        const stars =
          '★'.repeat(reputationStars) +
          '☆'.repeat(5 - reputationStars);
"""
new = """        const teamContext =
          player.teamName ||
          player.currentTeam ||
          player.realTeamSnapshot ||
          player.schoolName ||
          '';
        const leagueContext =
          player.league ||
          player.realLeagueSnapshot ||
          player.teamLevel ||
          '';
        const playerContext = [teamContext, leagueContext]
          .filter(Boolean)
          .filter((value, index, values) => values.indexOf(value) === index)
          .join(' · ');
"""
if old not in game:
    raise SystemExit('reputation calculation anchor missing')
game = game.replace(old, new, 1)

old = """              <span class=\"pr-player-name\">${fullName}</span>
              <span class=\"pr-player-reputation\">${stars}</span>
"""
new = """              <span class=\"pr-player-name\">${fullName}</span>
              ${playerContext ? `<span class=\"pr-player-context\">${playerContext}</span>` : ''}
"""
if old not in game:
    raise SystemExit('prospect name/reputation markup anchor missing')
game = game.replace(old, new, 1)

css_append = r'''

/* Prospect ranking secondary context — full team + league beneath player name. */
.pr-player-context {
  display: block;
  margin-top: 3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(125, 157, 205, 0.72);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.015em;
}
'''
if '.pr-player-context {' not in css:
    css += css_append

# Small-diff safety checks.
if game.count('pr-player-context') != 1:
    raise SystemExit('unexpected prospect context markup count')
if '${stars}' in game[game.find('function renderProspectsScreen'):game.find('function renderProspectsScreen') + 16000]:
    raise SystemExit('stars still present in canonical prospect renderer')

game_path.write_text(game, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('PROSPECT_CONTEXT_SUBTITLE=OK')
