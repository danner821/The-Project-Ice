from pathlib import Path
import re
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
w=wp.read_text(errors='ignore')
g=gp.read_text(errors='ignore')

# --- Backend: freshman eligibility helper ---
anchor="""  function buildLivingWorldAwardRaces(dateString, weekKey) {
"""
helper=r'''  function isFreshmanAwardEligible(player = {}) {
    const yearText = [
      player.year,
      player.schoolYear,
      player.classYear,
      player.gradeLabel,
      player.careerStageLabel,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const numericGrade = Number(
      player.grade ??
      player.gradeLevel ??
      player.schoolGrade
    );

    if (/freshman|9th\s*grade|grade\s*9/.test(yearText)) return true;
    if (numericGrade === 9) return true;

    /*
     * Generated HS rosters do not all carry a literal class label yet.
     * Age 14 is the canonical freshman fallback during the HS career stage.
     */
    const age = Number(player.age ?? player.development?.currentAge);
    const levelText = [player.league, player.level, player.teamLevel, player.careerLevel]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const clearlyPostHs = /nhl|ahl|echl|ncaa|college|ohl|whl|qmjhl|ushl|junior/.test(levelText);

    return Number.isFinite(age) && age <= 14 && !clearlyPostHs;
  }

  function calculateFreshmanOfYearScore(player = {}, stats = {}) {
    const gp = Math.max(1, Number(stats.gamesPlayed) || 0);
    const overall = Math.max(0, Number(player.overall) || 0);
    const reputation = Math.max(
      0,
      Number(player.reputationPoints) || ((Number(player.reputationStars) || 0) * 20)
    );
    const position = normalizeAttributePosition(player.position);

    if (position === 'G') {
      const wins = Math.max(0, Number(stats.wins) || 0);
      const savePercentage = Math.max(0, Number(stats.savePercentage) || 0);
      const shutouts = Math.max(0, Number(stats.shutouts) || 0);
      const winRate = wins / gp;
      const saveQuality = Math.max(-0.05, savePercentage - 0.88);
      return (
        winRate * 72 +
        saveQuality * 520 +
        (shutouts / gp) * 34 +
        overall * 0.34 +
        reputation * 0.035
      );
    }

    const pointsPerGame = Math.max(0, Number(stats.points) || 0) / gp;
    const goalsPerGame = Math.max(0, Number(stats.goals) || 0) / gp;
    const plusMinusPerGame = Number(stats.plusMinus || 0) / gp;
    return (
      pointsPerGame * 76 +
      goalsPerGame * 24 +
      plusMinusPerGame * 4 +
      overall * 0.34 +
      reputation * 0.035
    );
  }

'''
if 'function isFreshmanAwardEligible' not in w:
    if anchor not in w: raise SystemExit('buildLivingWorldAwardRaces anchor missing')
    w=w.replace(anchor, helper+anchor, 1)

# Add race before goalie race or at end.
needle="""      makeRace(
        'goalie',
        'Top Goaltender',
        (player, stats) => position(player) === 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.wins * 8 + stats.savePercentage * 100 + stats.shutouts * 12 + Math.max(0, 5 - stats.goalsAgainstAverage) * 4 + overall(player) * 0.08
      ),
"""
insert="""      makeRace(
        'goalie',
        'Top Goaltender',
        (player, stats) => position(player) === 'G' && stats.gamesPlayed > 0,
        (player, stats) => stats.wins * 8 + stats.savePercentage * 100 + stats.shutouts * 12 + Math.max(0, 5 - stats.goalsAgainstAverage) * 4 + overall(player) * 0.08
      ),
      makeRace(
        'freshman_of_year',
        'Freshman of the Year',
        (player, stats) => isFreshmanAwardEligible(player) && stats.gamesPlayed > 0,
        (player, stats) => calculateFreshmanOfYearScore(player, stats)
      ),
"""
if "'freshman_of_year'" not in w:
    if needle not in w: raise SystemExit('goalie race anchor missing')
    w=w.replace(needle,insert,1)

# Attach eligibility metadata to snapshot so season-transition/history can finalize the same award later.
old="""      races,
    };
"""
new="""      races,
      awardDefinitions: {
        freshman_of_year: {
          key: 'freshman_of_year',
          label: 'Freshman of the Year',
          eligibility: 'freshman',
          seasonAward: true,
        },
      },
    };
"""
# only replace within buildLivingWorldAwardRaces by finding after its snapshot const
pos=w.find('function buildLivingWorldAwardRaces')
if pos>=0:
    snap=w.find('const snapshot = {',pos)
    tail=w.find('const previousByKey',snap)
    segment=w[snap:tail]
    if 'awardDefinitions' not in segment and old in segment:
        segment=segment.replace(old,new,1)
        w=w[:snap]+segment+w[tail:]

# --- Frontend: replace local award calculation with canonical Living World races ---
def replace_js_function(text,name,new_code):
    start=text.find(f'function {name}')
    if start<0: raise SystemExit(f'{name} not found')
    brace=text.find('{',start)
    depth=0; ins=ind=tmpl=False; esc=False
    for i in range(brace,len(text)):
        c=text[i]
        if esc: esc=False; continue
        if c=='\\': esc=True; continue
        if not ind and not tmpl and c=="'": ins=not ins; continue
        if not ins and not tmpl and c=='"': ind=not ind; continue
        if not ins and not ind and c=='`': tmpl=not tmpl; continue
        if ins or ind or tmpl: continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0:
                return text[:start]+new_code+text[i+1:]
    raise SystemExit(f'could not parse {name}')

new_render=r'''function renderLeagueAwardsPreview() {
  const container = document.getElementById('league-awards-preview');
  if (!container) return;

  const livingWorld = WorldEngine.state?.livingWorld || {};
  const races = Array.isArray(livingWorld.currentAwardRaces)
    ? livingWorld.currentAwardRaces
    : [];

  if (!races.length || !races.some(race => Array.isArray(race.contenders) && race.contenders.length)) {
    container.innerHTML = `
      <div class="league-awards-empty">
        No award races yet
      </div>
    `;
    Game.currentLeagueAwardRaces = [];
    return;
  }

  const teams = Array.isArray(WorldEngine.state?.teams)
    ? WorldEngine.state.teams
    : [];
  const players = typeof getLivePlayersFromTeams === 'function'
    ? getLivePlayersFromTeams(teams)
    : teams.flatMap(team => Array.isArray(team?.roster) ? team.roster : []);

  const playerById = new Map(players.map(player => [
    String(player.playerId || player.id || ''),
    player,
  ]));

  const formatTrend = contender => {
    const previousRank = Number(contender.previousRank);
    const currentRank = Number(contender.rank);
    if (!Number.isFinite(previousRank) || !Number.isFinite(currentRank)) {
      return '<span class="league-award-contender__trend league-award-contender__trend--new">NEW</span>';
    }
    const difference = previousRank - currentRank;
    if (difference > 0) return `<span class="league-award-contender__trend league-award-contender__trend--up">▲${difference}</span>`;
    if (difference < 0) return `<span class="league-award-contender__trend league-award-contender__trend--down">▼${Math.abs(difference)}</span>`;
    return '<span class="league-award-contender__trend league-award-contender__trend--even">—</span>';
  };

  const getStatLine = (race, contender) => {
    const stats = contender.stats || {};
    if (race.key === 'goalie') {
      const sv = Number(stats.savePercentage) || 0;
      return `${Number(stats.wins) || 0} W · ${sv > 0 ? sv.toFixed(3).replace(/^0/, '') : '.000'} SV%`;
    }
    if (race.key === 'freshman_of_year') {
      const player = playerById.get(String(contender.playerId || ''));
      const position = String(player?.position || contender.position || '').toUpperCase();
      if (position === 'G' || position.includes('GOAL')) {
        const sv = Number(stats.savePercentage) || 0;
        return `${Number(stats.wins) || 0} W · ${sv > 0 ? sv.toFixed(3).replace(/^0/, '') : '.000'} SV%`;
      }
      return `${Number(stats.goals) || 0} G · ${Number(stats.assists) || 0} A · ${Number(stats.points) || 0} PTS`;
    }
    if (race.key === 'goal_scorer') return `${Number(stats.goals) || 0} G`;
    return `${Number(stats.points) || 0} PTS`;
  };

  Game.currentLeagueAwardRaces = races.map(race => ({
    ...race,
    contenders: (race.contenders || []).map(contender => ({
      ...contender,
      awardCurrentRank: contender.rank,
      awardPreviousRank: contender.previousRank,
    })),
  }));

  container.innerHTML = `
    <div class="league-awards-grid">
      ${races.map(race => `
        <section class="league-award-race" data-award-key="${race.key}">
          <header class="league-award-race__header">
            <span class="league-award-race__name">${race.label}</span>
            ${race.key === 'freshman_of_year'
              ? '<span class="league-award-race__badge">FRESHMEN</span>'
              : ''}
          </header>
          <div class="league-award-race__contenders">
            ${(race.contenders || []).slice(0,3).map(contender => {
              const player = playerById.get(String(contender.playerId || '')) || contender;
              const fullName = `${player.firstName || contender.firstName || ''} ${player.lastName || contender.lastName || ''}`.trim() || 'Unknown Player';
              const teamLabel = player.teamAbbreviation || player.teamShortName || player.teamName || '—';
              return `
                <button class="league-award-contender" type="button" data-player-id="${contender.playerId || ''}">
                  <span class="league-award-contender__rank">${contender.rank}</span>
                  <span class="league-award-contender__body">
                    <span class="league-award-contender__top">
                      <strong class="league-award-contender__name">${fullName}</strong>
                      ${formatTrend(contender)}
                    </span>
                    <span class="league-award-contender__meta">
                      ${player.position || contender.position || '—'} · ${teamLabel} · ${getStatLine(race, contender)}
                    </span>
                  </span>
                </button>
              `;
            }).join('') || '<div class="league-awards-empty">No eligible contenders yet</div>'}
          </div>
        </section>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.league-award-contender[data-player-id]').forEach(button => {
    button.addEventListener('click', () => {
      const selectedPlayer = playerById.get(String(button.dataset.playerId || ''));
      if (!selectedPlayer) return;
      openPlayerProfile(selectedPlayer, 'league');
    });
  });
}
'''

g=replace_js_function(g,'renderLeagueAwardsPreview',new_render)

# News is generic, but add explicit final-award headline support for season transition now.
news_anchor="""      if (beat?.type === 'award_leader_change') {
"""
final_block=r'''      if (beat?.type === 'season_award_winner') {
        const player = getPlayer(beat.playerId || beat.winnerPlayerId);
        publishOnce(
          beat.beatId || `season-award:${beat.seasonId || weekKey}:${beat.awardKey}:${beat.playerId || beat.winnerPlayerId}`,
          'AWARDS',
          `${playerName(player)} wins ${beat.awardLabel || 'a league award'}.`
        );
      }

'''
if "beat?.type === 'season_award_winner'" not in w:
    if news_anchor not in w: raise SystemExit('award news anchor missing')
    w=w.replace(news_anchor,final_block+news_anchor,1)

wp.write_text(w)
gp.write_text(g)
print('Freshman of the Year added to canonical weekly awards and League UI')
