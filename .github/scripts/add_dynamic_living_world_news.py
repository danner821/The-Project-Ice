from pathlib import Path
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
sp=Path('artifacts/project-ice/public/style.css')
w=wp.read_text(); g=gp.read_text(); s=sp.read_text()

# 1) Harden news.publish without breaking the existing API.
old="""    publish({ date, tag, headline }) {
      _state.newsItems.unshift({ date, tag, headline });
      if (typeof _onNewsChange === 'function') _onNewsChange();
    },
"""
new="""    publish({ date, tag, headline }) {
      if (!headline) return;

      const normalizedHeadline = String(headline).trim();
      const normalizedDate = date || _state?.season?.currentDate || null;
      const normalizedTag = tag || 'LEAGUE';

      /*
       * News is persistent world state. Avoid adjacent duplicate headlines
       * when a UI refresh or compatibility path republishes the same beat.
       */
      const duplicate = (_state.newsItems || []).some(item =>
        String(item?.headline || '') === normalizedHeadline &&
        String(item?.date || '') === String(normalizedDate || '')
      );

      if (!duplicate) {
        _state.newsItems.unshift({
          date: normalizedDate,
          tag: normalizedTag,
          headline: normalizedHeadline,
        });
        _state.newsItems = _state.newsItems.slice(0, 100);
      }

      if (typeof _onNewsChange === 'function') _onNewsChange();
    },
"""
if old not in w: raise SystemExit('news.publish anchor missing')
w=w.replace(old,new,1)

# 2) Add canonical Living World -> News translator before weekly snapshot builder.
anchor="""  function buildLivingWorldWeeklySnapshot(processedAtDate) {
"""
block=r'''  function publishLivingWorldNewsForWeek(dateString, weekKey) {
    const normalizedDate = normalizeLivingWorldDateKey(dateString);
    const livingWorld = ensureLivingWorldState();

    if (!normalizedDate || !weekKey) {
      return { success: false, published: 0, reason: 'invalid-news-week' };
    }

    if (!Array.isArray(livingWorld.newsBeatIds)) {
      livingWorld.newsBeatIds = [];
    }

    const publishedIds = new Set(livingWorld.newsBeatIds.map(String));
    let published = 0;

    const getPlayer = playerId => {
      const id = String(playerId || '');
      if (!id) return null;
      return (_state.teams || [])
        .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
        .find(player => String(player?.id || player?.playerId || '') === id) || null;
    };

    const getTeam = teamId =>
      (_state.teams || []).find(team =>
        String(team?.teamId || '') === String(teamId || '')
      ) || null;

    const playerName = player =>
      `${player?.firstName || ''} ${player?.lastName || ''}`.trim() || 'A prospect';

    const teamName = team =>
      `${team?.schoolName || ''} ${team?.teamName || ''}`.trim() || 'A team';

    const publishOnce = (id, tag, headline) => {
      const safeId = String(id || '');
      if (!safeId || !headline || publishedIds.has(safeId)) return false;
      news.publish({ date: normalizedDate, tag, headline });
      publishedIds.add(safeId);
      published += 1;
      return true;
    };

    /* Potential changes are rare by design, so every visible tier change is news. */
    const weekBeats = (livingWorld.recentBeats || []).filter(beat =>
      String(beat?.weekKey || '') === String(weekKey)
    );

    weekBeats.forEach((beat, index) => {
      if (beat?.type === 'potential_update') {
        const player = getPlayer(beat.playerId);
        const role =
          beat.potentialRoleAfter ||
          beat.newRole ||
          beat.roleAfter ||
          player?.development?.potentialRole ||
          player?.potentialRole ||
          'a new projection';
        const direction = Number(beat.change || beat.potentialChange || 0);
        const verb = direction < 0 ? 'revised to' : 'elevated to';
        publishOnce(
          `potential:${weekKey}:${beat.playerId || index}:${role}`,
          'SCOUTING',
          `${playerName(player)}'s potential is ${verb} ${role}.`
        );
      }
    });

    /*
     * League-wide prospect movement: only meaningful jumps/crossings become
     * headlines so the feed does not turn into a weekly transaction log.
     */
    (_state.prospectRankings || []).forEach(entry => {
      const rank = Math.max(0, Number(entry?.rank) || 0);
      const change = Number(entry?.rankChange) || 0;
      if (!rank || !change) return;

      const previousRank = rank + change;
      const bigMove = Math.abs(change) >= 8;
      const crossedTop20 = rank <= 20 && previousRank > 20;
      const crossedTop50 = rank <= 50 && previousRank > 50;
      const crossedTop100 = rank <= 100 && previousRank > 100;

      if (!bigMove && !crossedTop20 && !crossedTop50 && !crossedTop100) return;

      const player = getPlayer(entry.playerId);
      const movement = change > 0
        ? `jumps ${Math.abs(change)} spots to #${rank}`
        : `slides ${Math.abs(change)} spots to #${rank}`;

      publishOnce(
        `prospect:${weekKey}:${entry.playerId}:${rank}`,
        'PROSPECTS',
        `${playerName(player)} ${movement} in the latest prospect rankings.`
      );
    });

    /* Leader changes and major table movement come from weekly snapshots. */
    const snapshots = livingWorld.weeklySnapshots || [];
    const currentSnapshot = snapshots[snapshots.length - 1] || null;
    const priorSnapshot = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

    if (currentSnapshot && priorSnapshot) {
      const priorStandings = Array.isArray(priorSnapshot.standings)
        ? priorSnapshot.standings
        : [];

      (currentSnapshot.standings || []).forEach(teamStanding => {
        const prior = priorStandings.find(item =>
          String(item?.teamId || '') === String(teamStanding?.teamId || '')
        );
        if (!prior) return;
        const delta = Number(prior.rank) - Number(teamStanding.rank);
        if (Math.abs(delta) < 2) return;
        const team = getTeam(teamStanding.teamId);
        publishOnce(
          `standings:${weekKey}:${teamStanding.teamId}:${teamStanding.rank}`,
          'LEAGUE',
          `${teamName(team)} ${delta > 0 ? 'climbs' : 'falls'} ${Math.abs(delta)} spots to ${teamStanding.rank}${teamStanding.rank === 1 ? 'st' : teamStanding.rank === 2 ? 'nd' : teamStanding.rank === 3 ? 'rd' : 'th'} in the league.`
        );
      });

      const currentLeader = currentSnapshot.standings?.[0] || null;
      const priorLeader = priorSnapshot.standings?.[0] || null;
      if (
        currentLeader?.teamId &&
        priorLeader?.teamId &&
        String(currentLeader.teamId) !== String(priorLeader.teamId)
      ) {
        publishOnce(
          `leader:${weekKey}:${currentLeader.teamId}`,
          'LEAGUE',
          `${teamName(getTeam(currentLeader.teamId))} takes over first place in the league.`
        );
      }
    }

    /*
     * A genuinely high-profile scouting environment is itself league news.
     * This does not change rankings by itself; the scouting engine separately
     * combines exposure with actual performance.
     */
    const schedule = Array.isArray(_state?.season?.schedule)
      ? _state.season.schedule
      : (Array.isArray(_state?.schedule) ? _state.schedule : []);
    const weekStart = getWeekStartDate(normalizedDate);
    const weekEnd = getWeekEndDate(normalizedDate);

    schedule.forEach(game => {
      const gameDate = normalizeLivingWorldDateKey(game?.date);
      if (!gameDate || gameDate < weekStart || gameDate > weekEnd) return;
      if (!(game?.played === true || game?.completed === true || game?.status === 'final')) return;

      const scouts = Math.max(0, Number(game?.scoutsAttending) || 0);
      const spotlightWeight = getScoutingGameSpotlightWeight(game);
      if (scouts < 4 && spotlightWeight < 3) return;

      const home = getTeam(game.homeTeamId);
      const away = getTeam(game.awayTeamId);
      const contextText = [
        game.specialGameType,
        game.specialType,
        game.milestoneType,
        game.label,
        game.title,
        game.banner,
      ].filter(Boolean).join(' ').toLowerCase();
      const isProspectClash = Boolean(
        game.isTopProspectClash ||
        game.topProspectClash ||
        /top\s*prospect|prospect\s*clash/.test(contextText)
      );

      publishOnce(
        `spotlight:${weekKey}:${game.id || game.gameId || game.eventId || gameDate}`,
        'SCOUTING',
        isProspectClash
          ? `Top prospects take center stage as ${teamName(away)} meets ${teamName(home)} under a heavy scouting spotlight.`
          : `${scouts} scouts were on hand for ${teamName(away)} at ${teamName(home)}.`
      );
    });

    livingWorld.newsBeatIds = Array.from(publishedIds).slice(-300);

    return {
      success: true,
      published,
      reason: 'living-world-news-published',
    };
  }

'''
if anchor not in w: raise SystemExit('weekly snapshot anchor missing')
if 'function publishLivingWorldNewsForWeek' not in w:
    w=w.replace(anchor,block+anchor,1)

# 3) Call news translator only after the complete weekly snapshot/beat set exists.
old="""    livingWorld.recentBeats.push(...snapshot.beats.map(beat => ({ ...beat, weekKey, date: normalizedDate })));
    if (livingWorld.weeklySnapshots.length > 60) livingWorld.weeklySnapshots = livingWorld.weeklySnapshots.slice(-60);
    if (livingWorld.recentBeats.length > 120) livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);
    return snapshot;
"""
new="""    livingWorld.recentBeats.push(...snapshot.beats.map(beat => ({ ...beat, weekKey, date: normalizedDate })));
    if (livingWorld.weeklySnapshots.length > 60) livingWorld.weeklySnapshots = livingWorld.weeklySnapshots.slice(-60);
    if (livingWorld.recentBeats.length > 120) livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);

    /*
     * Dynamic news is a consumer of completed Living World state. It never
     * invents outcomes or mutates scouting/standings; it reports what those
     * canonical systems already decided.
     */
    publishLivingWorldNewsForWeek(normalizedDate, weekKey);

    return snapshot;
"""
if old not in w: raise SystemExit('processLivingWorldWeek tail anchor missing')
w=w.replace(old,new,1)

# 4) Add League news renderer right after Hub news renderer.
anchor_g="""function renderHubNews() {
  const container = document.getElementById('hub-news-list');
  if (!container) return;
  const items = NewsSystem.getRecent(3);
  container.innerHTML = items.map(item => `
    <div class=\"hub-news__item\">
      <span class=\"hub-news__tag\">${item.tag}</span>
      <span class=\"hub-news__headline\">${item.headline}</span>
    </div>
  `).join('');
}
"""
add_g=anchor_g+r'''

function renderLeagueNewsPreview() {
  const container = document.getElementById('league-news-preview');
  if (!container) return;

  const items = NewsSystem.getRecent(8);

  if (!items.length) {
    container.innerHTML = `
      <div class="league-news-feed__empty">
        No major league stories yet.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="league-news-feed">
      ${items.map(item => `
        <article class="league-news-card">
          <div class="league-news-card__meta">
            <span class="league-news-card__tag">${item.tag || 'LEAGUE'}</span>
            <span class="league-news-card__date">${item.date || ''}</span>
          </div>
          <strong class="league-news-card__headline">
            ${item.headline || ''}
          </strong>
        </article>
      `).join('')}
    </div>
  `;
}
'''
if anchor_g not in g: raise SystemExit('renderHubNews anchor missing')
if 'function renderLeagueNewsPreview' not in g:
    g=g.replace(anchor_g,add_g,1)

# 5) Make League tab render news from the same canonical NewsSystem.
old="""    renderLeagueAwardsPreview();
    if (
"""
new="""    renderLeagueAwardsPreview();
    renderLeagueNewsPreview();
    if (
"""
if old not in g: raise SystemExit('league tab render anchor missing')
g=g.replace(old,new,1)

# 6) Same news callback refreshes both consumers when visible.
old="""WorldEngine.news.onNewsChange(renderHubNews);
"""
new="""WorldEngine.news.onNewsChange(() => {
  renderHubNews();
  renderLeagueNewsPreview();
});
"""
if old not in g: raise SystemExit('news callback anchor missing')
g=g.replace(old,new,1)

# 7) Compact League news styling.
css=r'''

/* Dynamic League News — canonical WorldEngine.news consumer */
.league-news-feed {
  display: grid;
  gap: 8px;
}

.league-news-card {
  display: grid;
  gap: 7px;
  padding: 12px 13px;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 13px;
  background: rgba(255,255,255,0.035);
}

.league-news-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.league-news-card__tag {
  color: #91bbff;
  font-size: 0.63rem;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.league-news-card__date {
  color: rgba(255,255,255,0.38);
  font-size: 0.66rem;
}

.league-news-card__headline {
  color: #f1f5fb;
  font-size: 0.88rem;
  line-height: 1.38;
}

.league-news-feed__empty {
  padding: 13px;
  color: rgba(255,255,255,0.46);
  font-size: 0.8rem;
}
'''
if '/* Dynamic League News — canonical WorldEngine.news consumer */' not in s:
    s += css

wp.write_text(w); gp.write_text(g); sp.write_text(s)
print('added dynamic Living World news backend and League news renderer')
