from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
STYLE = Path('artifacts/project-ice/public/style.css')

g = GAME.read_text(encoding='utf-8')
s = STYLE.read_text(encoding='utf-8')

# 1) Dynamic season badge from canonical saved world date.
anchor = """  const teams = WorldEngine.state.teams || [];
  const playerTeamId = Game.player.teamId || '';
"""
insert = """  const teams = WorldEngine.state.teams || [];
  const playerTeamId = Game.player.teamId || '';

  // Never show a hard-coded season on the scouting screen. Derive it from
  // the canonical saved world date so old/new careers stay correct.
  const prospectSeasonBadge = document.querySelector('#prospects-screen .sl-season-badge');
  const prospectDateValue =
    WorldEngine.state?.season?.currentDate ||
    Game.player?.currentDate ||
    WorldEngine.state?.currentDate ||
    '';
  if (prospectSeasonBadge && prospectDateValue) {
    const prospectDate = new Date(`${String(prospectDateValue).slice(0, 10)}T12:00:00`);
    if (!Number.isNaN(prospectDate.getTime())) {
      const calendarYear = prospectDate.getFullYear();
      const startYear = prospectDate.getMonth() >= 6 ? calendarYear : calendarYear - 1;
      prospectSeasonBadge.textContent = `${startYear}–${String((startYear + 1) % 100).padStart(2, '0')}`;
    }
  }
"""
if anchor not in g:
    raise SystemExit('renderProspectsScreen season anchor missing')
g = g.replace(anchor, insert, 1)

# 2) Replace stars under canonical names with useful team/league context.
old = """        const reputationStars = Math.max(
          1,
          Math.min(5, Number(player.reputationStars) || 1)
        );
        const stars =
          '★'.repeat(reputationStars) +
          '☆'.repeat(5 - reputationStars);
"""
new = """        const prospectContext = [
          player.teamName || player.currentTeam || player.realTeamSnapshot || '',
          leagueDisplay,
        ]
          .map(value => String(value || '').trim())
          .filter(Boolean)
          .filter((value, index, values) => values.indexOf(value) === index)
          .join(' · ');
"""
if old not in g:
    raise SystemExit('canonical reputation-stars anchor missing')
g = g.replace(old, new, 1)

old = """              <span class=\"pr-player-name\">${fullName}</span>
              <span class=\"pr-player-reputation\">${stars}</span>
"""
new = """              <span class=\"pr-player-name\">${fullName}</span>
              <span class=\"pr-player-context\">${prospectContext || 'Prospect'}</span>
"""
if old not in g:
    raise SystemExit('canonical row name secondary anchor missing')
g = g.replace(old, new, 1)

# 3) Append narrowly-scoped mobile layout override. Keep markup/header contract intact,
#    but collapse Team/Lge into the name subline where they actually fit on iPhone.
marker = '/* PROJECT ICE — prospect rankings mobile refinement */'
if marker not in s:
    s += r'''

/* PROJECT ICE — prospect rankings mobile refinement */
#prospects-screen .pr-row {
  grid-template-columns: 24px minmax(0, 1fr) 38px 42px 24px;
  gap: 7px;
  padding-left: 12px;
  padding-right: 12px;
}

#prospects-screen .pr-col--team,
#prospects-screen .pr-col--league {
  display: none;
}

#prospects-screen .pr-col--name {
  min-width: 0;
  overflow: hidden;
}

#prospects-screen .pr-player-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

#prospects-screen .pr-player-context {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(115, 150, 205, 0.72);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.015em;
}

#prospects-screen .pr-col--pos,
#prospects-screen .pr-col--draft,
#prospects-screen .pr-col--trend {
  justify-self: center;
}

#prospects-screen .pr-row--header .pr-col--name {
  overflow: visible;
}
'''

GAME.write_text(g, encoding='utf-8')
STYLE.write_text(s, encoding='utf-8')
print('PROSPECT_MOBILE_REFINEMENT=OK')
