from pathlib import Path

ROOT = Path('artifacts/project-ice')
index_path = ROOT / 'index.html'
game_path = ROOT / 'public/game.js'
style_path = ROOT / 'public/style.css'

index = index_path.read_text(encoding='utf-8')
game = game_path.read_text(encoding='utf-8')
style = style_path.read_text(encoding='utf-8')

# -----------------------------------------------------------------------------
# HOME MARKUP
# -----------------------------------------------------------------------------
start_marker = '          <!-- Home tab panel -->\n          <div id="hub-tab-home" class="hub-tab-panel hub-tab-panel--active">'
end_marker = '          </div><!-- /#hub-tab-home -->'
start = index.find(start_marker)
end = index.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('Home tab markup anchors not found')
end += len(end_marker)

new_home = '''          <!-- Home tab panel -->
          <div id="hub-tab-home" class="hub-tab-panel hub-tab-panel--active">

            <!-- Dynamic career objective -->
            <section class="home-objective" aria-labelledby="home-objective-label">
              <div class="home-objective__topline">
                <span class="home-section-kicker" id="home-objective-label">Current Objective</span>
                <span class="home-objective__stage" id="home-objective-stage">Freshman Season</span>
              </div>
              <h2 class="home-objective__title" id="hub-current-objective-title">Earn Your Role</h2>
              <p class="home-objective__text" id="hub-current-objective">Establish yourself in the lineup and build coach trust.</p>
              <div class="home-objective__progress-row">
                <div class="home-objective__progress-track" aria-hidden="true">
                  <div class="home-objective__progress-fill" id="home-objective-progress-fill"></div>
                </div>
                <span class="home-objective__progress-label" id="home-objective-progress-label">0%</span>
              </div>
            </section>

            <!-- Weekly calendar -->
            <section class="hub-cal home-week-card">
              <div class="home-section-heading">
                <div>
                  <span class="home-section-kicker">Schedule</span>
                  <h3>This Week</h3>
                </div>
                <span class="hub-cal__week-label">Week of September 8, 2022</span>
              </div>

              <div class="hub-cal__strip" id="hub-cal-strip"></div>

              <div class="hub-event-panel" id="hub-event-panel">
                <div class="hub-event-panel__hero">
                  <span class="hub-event-panel__icon" id="hub-ep-icon">🏒</span>
                  <span class="hub-event-panel__name" id="hub-ep-name">Practice</span>
                </div>
                <div class="hub-event-panel__meta">
                  <div class="hub-event-panel__location">
                    <span class="hub-event-panel__meta-icon" aria-hidden="true">📍</span>
                    <span class="hub-event-panel__meta-text" id="hub-ep-location">Summit Ice Center</span>
                  </div>
                  <div class="hub-event-panel__objective">
                    <span class="hub-event-panel__objective-label">Objective</span>
                    <span class="hub-event-panel__objective-text" id="hub-ep-objective">Work on skating edges and passing.</span>
                  </div>
                </div>
                <button class="btn btn--primary hub-event-panel__btn" id="btn-hub-event">
                  <span class="btn__label" id="hub-ep-btn-label">Enter Event</span>
                  <span class="btn__arrow">›</span>
                </button>
                <p class="hub-event-panel__toast" id="hub-ep-toast" hidden></p>
              </div>
            </section>

            <!-- Context that changes with the career -->
            <section class="home-feature-card" id="home-big-moment-card">
              <div class="home-feature-card__icon" id="home-big-moment-icon">📅</div>
              <div class="home-feature-card__content">
                <span class="home-section-kicker">Next Big Moment</span>
                <h3 id="home-big-moment-title">Opening Week</h3>
                <p id="home-big-moment-detail">Your next important career event will appear here.</p>
                <span class="home-feature-card__meta" id="home-big-moment-meta">Coming up</span>
              </div>
            </section>

            <div class="home-snapshot-grid">
              <section class="home-snapshot-card" id="home-last-game-card">
                <span class="home-section-kicker">Last Game</span>
                <strong class="home-snapshot-card__value" id="home-last-game-result">No games yet</strong>
                <span class="home-snapshot-card__detail" id="home-last-game-detail">Your most recent result will appear here.</span>
              </section>

              <section class="home-snapshot-card" id="home-form-card">
                <span class="home-section-kicker">Current Form</span>
                <strong class="home-snapshot-card__value" id="home-form-status">Season Start</strong>
                <span class="home-snapshot-card__detail" id="home-form-detail">No regular-season sample yet.</span>
              </section>
            </div>

            <!-- Standings -->
            <section class="hub-dash-card home-dashboard-card" id="hub-standings-card">
              <div class="hub-dash-card__header">
                <div>
                  <span class="home-section-kicker">League</span>
                  <span class="hub-dash-card__title">Standings</span>
                </div>
                <button class="hub-dash-card__action hub-dash-card__action--btn" id="btn-hub-standings-all" aria-label="View full standings">View All ›</button>
              </div>
              <div class="hub-dash-card__body">
                <div class="hub-standings" id="hub-standings-preview">
                  <div class="hub-standings__row hub-standings__row--header">
                    <span class="hub-standings__pos">#</span>
                    <span class="hub-standings__team">Team</span>
                    <span class="hub-standings__stat">W</span>
                    <span class="hub-standings__stat">L</span>
                    <span class="hub-standings__stat hub-standings__stat--pts">PTS</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Correct live team leaders -->
            <section class="hub-dash-card home-dashboard-card" id="home-team-leaders-card">
              <div class="hub-dash-card__header">
                <div>
                  <span class="home-section-kicker">My Team</span>
                  <span class="hub-dash-card__title">Team Leaders</span>
                </div>
                <button class="hub-dash-card__action hub-dash-card__action--btn" id="btn-hub-team-leaders-all" type="button">Team ›</button>
              </div>
              <div class="hub-dash-card__body">
                <div class="hub-leaders" id="hub-team-leaders-list"></div>
              </div>
            </section>

            <!-- Player career status -->
            <section class="home-career-card">
              <div class="home-section-heading home-section-heading--compact">
                <div>
                  <span class="home-section-kicker">Career Status</span>
                  <h3>Where You Stand</h3>
                </div>
                <button class="home-text-action" id="btn-home-open-player" type="button">Player ›</button>
              </div>

              <div class="home-career-grid">
                <div class="home-career-stat">
                  <span>Current Role</span>
                  <strong id="home-current-role">—</strong>
                </div>
                <div class="home-career-stat">
                  <span>Coach Trust</span>
                  <strong id="home-coach-trust">—</strong>
                </div>
                <div class="home-career-stat">
                  <span>Season Line</span>
                  <strong id="home-season-line">0 GP · 0 PTS</strong>
                </div>
                <div class="home-career-stat">
                  <span>Prospect Status</span>
                  <strong id="home-prospect-status">Not Ranked</strong>
                </div>
              </div>

              <div class="home-development-strip">
                <div>
                  <span class="home-section-kicker">Development Snapshot</span>
                  <strong id="home-development-title">Building your game</strong>
                  <p id="home-development-detail">Your progression updates will surface here.</p>
                </div>
                <span class="home-development-strip__ovr" id="home-development-ovr">60 OVR</span>
              </div>
            </section>

            <!-- League News stays canonical -->
            <section class="hub-dash-card home-dashboard-card">
              <div class="hub-dash-card__header">
                <div>
                  <span class="home-section-kicker">Living World</span>
                  <span class="hub-dash-card__title">League News</span>
                </div>
                <button class="hub-dash-card__action news-view-all-button" id="btn-hub-view-all-news" type="button">View All ›</button>
              </div>
              <div class="hub-dash-card__body">
                <div class="hub-news" id="hub-news-list"></div>
              </div>
            </section>

          </div><!-- /#hub-tab-home -->'''

index = index[:start] + new_home + index[end:]

# Refine identity header while preserving all existing data IDs and fields.
old_header_start = '        <!-- Fixed player identity bar -->'
old_header_end = '        <!-- Scrollable main content -->'
a = index.find(old_header_start)
b = index.find(old_header_end, a)
if a < 0 or b < 0:
    raise SystemExit('Hub identity header anchors not found')
new_header = '''        <!-- Fixed player identity bar -->
        <div class="hub-info-bar hub-info-bar--refreshed" id="hub-info-bar">
          <div class="hub-info-bar__accent" aria-hidden="true"></div>
          <div class="hub-info-bar__main">
            <div class="hub-info-bar__identity">
              <p class="hub-info-bar__name" id="hub-player-name">—</p>
              <p class="hub-info-bar__attrs">
                <span id="hub-player-pos">C</span>
                <span class="hub-info-bar__dot">•</span>
                <span>Age <span id="hub-player-age-bar">14</span></span>
                <span class="hub-info-bar__dot">•</span>
                <span>OVR <span class="hub-info-bar__ovr-inline" id="hub-player-ovr">60</span></span>
              </p>
            </div>
            <div class="hub-info-bar__reputation">
              <span class="hub-info-bar__rep-stars" id="hub-rep-stars">★☆☆☆☆</span>
              <span class="hub-info-bar__rep-tier" id="hub-rep-tier">Local Prospect</span>
            </div>
          </div>
          <p class="hub-info-bar__team" id="hub-info-team">Freshman Tryouts</p>
        </div>

'''
index = index[:a] + new_header + index[b:]

# -----------------------------------------------------------------------------
# HOME RUNTIME
# -----------------------------------------------------------------------------
insert_anchor = 'function setupHubCalendar() {'
if insert_anchor not in game:
    raise SystemExit('setupHubCalendar anchor not found')

home_runtime = r'''// ── Home / Career Hub Refresh ───────────────────────────────
function getHomeCareerPlayer() {
  const gameId = String(Game.player?.id || Game.player?.playerId || 'career-player');
  const direct =
    typeof WorldEngine?.getPlayerById === 'function'
      ? WorldEngine.getPlayerById(gameId)
      : null;

  if (direct) return direct;

  const teams = Array.isArray(WorldEngine?.state?.teams)
    ? WorldEngine.state.teams
    : [];

  for (const team of teams) {
    const roster = Array.isArray(team?.roster) ? team.roster : [];
    const found = roster.find(player => {
      const id = String(player?.id || player?.playerId || '');
      return Boolean(
        player?.isCareerPlayer ||
        player?.isUser ||
        (id && id === gameId)
      );
    });
    if (found) return found;
  }

  return Game.player || {};
}

function getHomePlayerStats(player) {
  const nested =
    player?.seasonStats ||
    player?.stats ||
    player?.statistics ||
    {};

  const read = (...keys) => {
    for (const key of keys) {
      const direct = Number(player?.[key]);
      if (Number.isFinite(direct)) return direct;
      const value = Number(nested?.[key]);
      if (Number.isFinite(value)) return value;
    }
    return 0;
  };

  const gp = read('gamesPlayed', 'gp');
  const goals = read('goals', 'g');
  const assists = read('assists', 'a');
  const points = Math.max(read('points', 'pts'), goals + assists);
  return { gp, goals, assists, points };
}

function getHomeTeam(player) {
  const teamId = player?.teamId || Game.player?.teamId || '';
  return (WorldEngine.state?.teams || []).find(team =>
    String(team?.teamId || '') === String(teamId)
  ) || null;
}

function getHomeCoachTrust(player) {
  const candidates = [
    player?.coachTrust,
    player?.development?.coachTrust,
    player?.developmentState?.coachTrust,
    Game.player?.coachTrust,
  ];
  const raw = candidates.find(value => Number.isFinite(Number(value)));
  return Math.max(0, Math.min(100, Number(raw ?? 50)));
}

function getHomeStageLabel(player) {
  const year = String(player?.year || Game.player?.year || '').trim();
  const age = Number(player?.age || Game.player?.age || 14);
  const level = String(player?.teamLevel || Game.player?.teamLevel || '').trim();
  if (year) return `${year} Season`;
  if (level) return `${level} · Age ${age}`;
  return `Age ${age} Season`;
}

function getHomeObjective(player, stats, coachTrust) {
  const position = String(player?.position || Game.player?.position || '').toUpperCase();
  const rank = Number(player?.scoutingProfile?.publicRank || Game.player?.prospectRank || 0);
  const observed = Number(player?.scoutingProfile?.gamesObserved || 0);

  if (!Game.player?.tryoutsComplete) {
    return {
      title: 'Make the Team',
      text: 'Show the coaching staff you belong during freshman tryouts.',
      progress: Math.max(0, Math.min(100, coachTrust)),
      label: `${Math.round(coachTrust)}% coach trust`,
    };
  }

  if (stats.gp === 0) {
    return {
      title: 'Earn Your Role',
      text: 'Establish yourself in the lineup and build trust before the season settles in.',
      progress: Math.max(10, coachTrust),
      label: `${Math.round(coachTrust)}% coach trust`,
    };
  }

  if (coachTrust < 55) {
    return {
      title: 'Build Coach Trust',
      text: 'Play responsible hockey and make the most of every shift to earn a larger role.',
      progress: Math.round((coachTrust / 55) * 100),
      label: `${Math.round(coachTrust)} / 55 trust target`,
    };
  }

  if (observed > 0 && (!rank || rank > 50)) {
    const target = rank ? 50 : 100;
    const progress = rank ? Math.max(10, Math.min(95, ((101 - rank) / 51) * 100)) : 15;
    return {
      title: 'Turn Attention Into Momentum',
      text: 'Scouts are watching. Keep producing and push your name up the prospect board.',
      progress,
      label: rank ? `Currently #${rank}` : 'Evaluation underway',
    };
  }

  if (position === 'G' || position.includes('GOAL')) {
    const targetGp = Math.max(5, stats.gp + (stats.gp < 5 ? 5 - stats.gp : 3));
    return {
      title: 'Own the Crease',
      text: 'Stack quality starts and give your team a chance to win every night.',
      progress: Math.min(100, (stats.gp / targetGp) * 100),
      label: `${stats.gp} starts logged`,
    };
  }

  const nextPointTarget = Math.max(5, Math.ceil((stats.points + 1) / 5) * 5);
  return {
    title: 'Drive Your Season Forward',
    text: 'Keep producing, protect your role, and make this stretch of the season count.',
    progress: Math.min(100, (stats.points / nextPointTarget) * 100),
    label: `${stats.points} / ${nextPointTarget} points`,
  };
}

function getHomeCurrentRole(player) {
  const line =
    player?.startingLine ||
    player?.lineAssignment ||
    Game.player?.startingLine ||
    'Depth Role';
  const extras = [];
  const pp = player?.powerPlayUnit || player?.ppUnit || Game.player?.powerPlayUnit;
  const pk = player?.penaltyKillUnit || player?.pkUnit || Game.player?.penaltyKillUnit;
  if (pp) extras.push(String(pp).toUpperCase().startsWith('PP') ? String(pp).toUpperCase() : `PP${pp}`);
  if (pk) extras.push(String(pk).toUpperCase().startsWith('PK') ? String(pk).toUpperCase() : `PK${pk}`);
  return [line, ...extras].filter(Boolean).join(' · ');
}

function getHomeUpcomingMoment() {
  const today = String(Game.player?.currentDate || WorldEngine.state?.season?.currentDate || '').slice(0, 10);
  const events = Array.isArray(scheduleEvents) ? scheduleEvents : [];
  const upcoming = events
    .filter(event => {
      const date = String(event?.date || '').slice(0, 10);
      return date && (!today || date >= today) && !event?.isCompleted;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const priorityWords = /scout|rival|playoff|championship|tournament|game of the week|prospect|last game/i;
  return upcoming.find(event => priorityWords.test(`${event?.label || ''} ${event?.objective || ''}`)) ||
    upcoming.find(event => /game/i.test(String(event?.label || ''))) ||
    upcoming[0] || null;
}

function getHomeCompletedGames() {
  const buckets = [
    WorldEngine.state?.completedGames,
    WorldEngine.state?.gameResults,
    WorldEngine.state?.results,
    WorldEngine.state?.season?.completedGames,
    WorldEngine.state?.season?.gameResults,
    WorldEngine.state?.season?.schedule,
    WorldEngine.state?.schedule,
  ].filter(Array.isArray);

  const seen = new Set();
  return buckets.flat().filter(game => {
    if (!game || typeof game !== 'object') return false;
    const complete = Boolean(
      game.isCompleted || game.completed || game.gameComplete ||
      game.status === 'completed' || game.status === 'final' ||
      game.finalScore || game.result
    );
    if (!complete) return false;
    const key = String(game.gameId || game.id || `${game.date || ''}-${game.homeTeamId || game.home?.teamId || ''}-${game.awayTeamId || game.away?.teamId || ''}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => String(b.date || b.completedAt || '').localeCompare(String(a.date || a.completedAt || '')));
}

function getHomeLastGame(team) {
  if (!team) return null;
  const teamId = String(team.teamId || '');
  const game = getHomeCompletedGames().find(item => {
    const homeId = String(item.homeTeamId || item.home?.teamId || item.homeTeam?.teamId || '');
    const awayId = String(item.awayTeamId || item.away?.teamId || item.awayTeam?.teamId || '');
    return teamId && (homeId === teamId || awayId === teamId);
  });
  if (!game) return null;

  const homeId = String(game.homeTeamId || game.home?.teamId || game.homeTeam?.teamId || '');
  const isHome = homeId === teamId;
  const readScore = (side) => {
    const direct = game?.[`${side}Score`];
    if (Number.isFinite(Number(direct))) return Number(direct);
    const nested = game?.finalScore?.[side] ?? game?.result?.[side] ?? game?.[side]?.score ?? game?.[`${side}Team`]?.score;
    return Number.isFinite(Number(nested)) ? Number(nested) : null;
  };
  const homeScore = readScore('home');
  const awayScore = readScore('away');
  const own = isHome ? homeScore : awayScore;
  const opp = isHome ? awayScore : homeScore;
  const oppId = isHome
    ? String(game.awayTeamId || game.away?.teamId || game.awayTeam?.teamId || '')
    : String(game.homeTeamId || game.home?.teamId || game.homeTeam?.teamId || '');
  const opponent = (WorldEngine.state?.teams || []).find(t => String(t.teamId) === oppId);
  const opponentName = opponent ? `${opponent.schoolName} ${opponent.teamName}` : (game.opponentName || 'Opponent');
  const result = own != null && opp != null ? (own > opp ? 'W' : own < opp ? 'L' : 'T') : 'Final';
  return {
    result,
    score: own != null && opp != null ? `${own}–${opp}` : 'Final',
    opponentName,
    date: game.date || game.completedAt || '',
  };
}

function renderHomeTeamLeaders(player, team) {
  const container = document.getElementById('hub-team-leaders-list');
  if (!container) return;
  if (!team) {
    container.innerHTML = '<div class="home-empty-state">Team not assigned yet.</div>';
    return;
  }

  const roster = typeof WorldEngine?.getTeamRoster === 'function'
    ? WorldEngine.getTeamRoster(team.teamId)
    : (team.roster || []);

  const skaters = roster
    .filter(p => String(p?.position || '').toUpperCase() !== 'G')
    .map(p => ({ player: p, stats: getHomePlayerStats(p) }))
    .filter(entry => entry.stats.gp > 0 || entry.stats.points > 0)
    .sort((a, b) => (b.stats.points - a.stats.points) || (b.stats.goals - a.stats.goals) || String(a.player.lastName || '').localeCompare(String(b.player.lastName || '')))
    .slice(0, 3);

  if (!skaters.length) {
    container.innerHTML = '<div class="home-empty-state">No team stats yet. Leaders will populate after the season begins.</div>';
    return;
  }

  const careerId = String(player?.id || player?.playerId || Game.player?.id || 'career-player');
  container.innerHTML = skaters.map((entry, index) => {
    const p = entry.player;
    const id = String(p?.id || p?.playerId || '');
    const isUser = p?.isCareerPlayer || p?.isUser || (id && id === careerId);
    const name = `${String(p?.firstName || '').slice(0, 1)}. ${p?.lastName || ''}`.trim();
    return `
      <div class="hub-leaders__row${isUser ? ' hub-leaders__row--you' : ''}">
        <span class="hub-leaders__rank">${index + 1}</span>
        <span class="hub-leaders__name">${name || 'Player'}</span>
        <span class="hub-leaders__pos-badge">${p?.position || '—'}</span>
        <span class="hub-leaders__stat">${entry.stats.points} pts</span>
      </div>
    `;
  }).join('');
}

function renderHomeDashboard() {
  const home = document.getElementById('hub-tab-home');
  if (!home) return;

  const player = getHomeCareerPlayer();
  const stats = getHomePlayerStats(player);
  const team = getHomeTeam(player);
  const coachTrust = getHomeCoachTrust(player);
  const fullName = `${player?.firstName || Game.player?.firstName || ''} ${player?.lastName || Game.player?.lastName || ''}`.trim() || 'Career Player';
  const position = player?.position || Game.player?.position || '—';
  const age = Number(player?.age || Game.player?.age || 14);
  const overall = Number(player?.overall || Game.player?.overall || 60);
  const repStars = Math.max(1, Math.min(5, Number(player?.reputationStars || Game.player?.reputationStars || 1)));
  const repLabels = {1:'Local Prospect',2:'Regional Prospect',3:'Rising Prospect',4:'National Prospect',5:'Elite Prospect'};

  const nameEl = document.getElementById('hub-player-name');
  const posEl = document.getElementById('hub-player-pos');
  const ageEl = document.getElementById('hub-player-age-bar');
  const ovrEl = document.getElementById('hub-player-ovr');
  const starsEl = document.getElementById('hub-rep-stars');
  const tierEl = document.getElementById('hub-rep-tier');
  const teamEl = document.getElementById('hub-info-team');
  if (nameEl) nameEl.textContent = fullName;
  if (posEl) posEl.textContent = position;
  if (ageEl) ageEl.textContent = age;
  if (ovrEl) ovrEl.textContent = overall;
  if (starsEl) starsEl.textContent = '★'.repeat(repStars) + '☆'.repeat(5 - repStars);
  if (tierEl) tierEl.textContent = repLabels[repStars] || 'Prospect';
  if (teamEl) teamEl.textContent = team ? `${team.schoolName} ${team.teamName}` : 'Freshman Tryouts';

  const objective = getHomeObjective(player, stats, coachTrust);
  const objectiveTitle = document.getElementById('hub-current-objective-title');
  const objectiveText = document.getElementById('hub-current-objective');
  const objectiveStage = document.getElementById('home-objective-stage');
  const objectiveFill = document.getElementById('home-objective-progress-fill');
  const objectiveLabel = document.getElementById('home-objective-progress-label');
  if (objectiveTitle) objectiveTitle.textContent = objective.title;
  if (objectiveText) objectiveText.textContent = objective.text;
  if (objectiveStage) objectiveStage.textContent = getHomeStageLabel(player);
  if (objectiveFill) objectiveFill.style.width = `${Math.max(0, Math.min(100, objective.progress))}%`;
  if (objectiveLabel) objectiveLabel.textContent = objective.label;

  const role = getHomeCurrentRole(player);
  const roleEl = document.getElementById('home-current-role');
  const trustEl = document.getElementById('home-coach-trust');
  const seasonLineEl = document.getElementById('home-season-line');
  const prospectEl = document.getElementById('home-prospect-status');
  if (roleEl) roleEl.textContent = role;
  if (trustEl) trustEl.textContent = `${Math.round(coachTrust)}%`;
  if (seasonLineEl) seasonLineEl.textContent = `${stats.gp} GP · ${stats.goals}G · ${stats.assists}A · ${stats.points}PTS`;
  const rank = Number(player?.scoutingProfile?.publicRank || Game.player?.prospectRank || 0);
  if (prospectEl) prospectEl.textContent = rank ? `#${rank} Prospect` : (repLabels[repStars] || 'Not Ranked');

  const devTitle = document.getElementById('home-development-title');
  const devDetail = document.getElementById('home-development-detail');
  const devOvr = document.getElementById('home-development-ovr');
  const potential = player?.potentialRole || player?.potentialTier || player?.potential || Game.player?.potential;
  if (devTitle) devTitle.textContent = coachTrust >= 70 ? 'Role is trending up' : coachTrust < 45 ? 'Opportunity to earn more' : 'Development on track';
  if (devDetail) devDetail.textContent = potential ? `Potential: ${potential} · Keep stacking practices, games, and objectives.` : 'Keep stacking practices, games, and objectives to grow your attributes.';
  if (devOvr) devOvr.textContent = `${overall} OVR`;

  const moment = getHomeUpcomingMoment();
  const momentIcon = document.getElementById('home-big-moment-icon');
  const momentTitle = document.getElementById('home-big-moment-title');
  const momentDetail = document.getElementById('home-big-moment-detail');
  const momentMeta = document.getElementById('home-big-moment-meta');
  if (momentIcon) momentIcon.textContent = moment?.icon || '📅';
  if (momentTitle) momentTitle.textContent = moment?.label || 'No Major Event Scheduled';
  if (momentDetail) momentDetail.textContent = moment?.objective || 'Keep building toward the next major career moment.';
  if (momentMeta) {
    const parsed = moment?.date ? new Date(`${moment.date}T12:00:00`) : null;
    momentMeta.textContent = parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})
      : 'Career calendar';
  }

  const lastGame = getHomeLastGame(team);
  const lastResult = document.getElementById('home-last-game-result');
  const lastDetail = document.getElementById('home-last-game-detail');
  if (lastResult) lastResult.textContent = lastGame ? `${lastGame.result} ${lastGame.score}` : 'No games yet';
  if (lastDetail) lastDetail.textContent = lastGame ? `vs ${lastGame.opponentName}` : 'Your most recent result will appear here.';

  const formStatus = document.getElementById('home-form-status');
  const formDetail = document.getElementById('home-form-detail');
  if (stats.gp > 0) {
    const ppg = stats.points / stats.gp;
    const label = ppg >= 1.25 ? '🔥 Hot' : ppg >= 0.65 ? '↗ Trending' : ppg >= 0.3 ? 'Steady' : 'Building';
    if (formStatus) formStatus.textContent = label;
    if (formDetail) formDetail.textContent = `${stats.points} PTS in ${stats.gp} GP · ${ppg.toFixed(2)} P/GP`;
  } else {
    if (formStatus) formStatus.textContent = 'Season Start';
    if (formDetail) formDetail.textContent = 'No regular-season sample yet.';
  }

  renderHomeTeamLeaders(player, team);
  renderHubStandings();
  renderHubNews();

  const teamButton = document.getElementById('btn-hub-team-leaders-all');
  if (teamButton) teamButton.onclick = () => document.querySelector('[data-hub-tab="team"]')?.click();
  const playerButton = document.getElementById('btn-home-open-player');
  if (playerButton) playerButton.onclick = () => document.querySelector('[data-hub-tab="player"]')?.click();
}

'''

game = game.replace(insert_anchor, home_runtime + insert_anchor, 1)

# Keep Home live whenever calendar refreshes.
calendar_prefix = "function setupHubCalendar() {\n  const currentDateKey ="
if calendar_prefix not in game:
    raise SystemExit('setupHubCalendar prefix not found')
game = game.replace(
    calendar_prefix,
    "function setupHubCalendar() {\n  renderHomeDashboard();\n\n  const currentDateKey =",
    1,
)

# Refresh dashboard as part of every canonical career UI refresh.
refresh_old = '''function refreshCareerUI() {
  refreshScheduleEvents();

  setupHubCalendar();'''
refresh_new = '''function refreshCareerUI() {
  refreshScheduleEvents();

  renderHomeDashboard();
  setupHubCalendar();'''
if refresh_old not in game:
    raise SystemExit('refreshCareerUI anchor not found')
game = game.replace(refresh_old, refresh_new, 1)

# -----------------------------------------------------------------------------
# STYLING — append scoped overrides to preserve old components safely.
# -----------------------------------------------------------------------------
marker = '/* PROJECT ICE — HOME / CAREER HUB REFRESH 2026-08-18 */'
if marker in style:
    style = style[:style.find(marker)].rstrip() + '\n\n'

style += r'''
/* PROJECT ICE — HOME / CAREER HUB REFRESH 2026-08-18 */
#hub-screen {
  background:
    radial-gradient(circle at 85% 8%, rgba(54, 116, 210, 0.13), transparent 28%),
    linear-gradient(180deg, #08111f 0%, #0a1321 44%, #08101c 100%);
}

.hub-info-bar--refreshed {
  position: relative;
  overflow: hidden;
  padding: 15px 18px 13px;
  background: linear-gradient(135deg, rgba(13, 27, 48, 0.98), rgba(10, 19, 34, 0.98));
  border-bottom: 1px solid rgba(132, 169, 221, 0.16);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
}

.hub-info-bar__accent {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, #6aa7ff, #2f6fca 65%, transparent);
}

.hub-info-bar__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.hub-info-bar__identity { min-width: 0; }
.hub-info-bar--refreshed .hub-info-bar__name {
  margin: 0 0 5px;
  color: #f5f9ff;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hub-info-bar--refreshed .hub-info-bar__attrs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  color: #9cacc2;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.hub-info-bar--refreshed .hub-info-bar__dot { color: #48617d; }
.hub-info-bar--refreshed .hub-info-bar__ovr-inline { color: #e8f2ff; }
.hub-info-bar__reputation {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex: 0 0 auto;
}

.hub-info-bar--refreshed .hub-info-bar__rep-stars {
  color: #f4c967;
  font-size: 12px;
  letter-spacing: 1px;
}

.hub-info-bar--refreshed .hub-info-bar__rep-tier {
  color: #8295ad;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hub-info-bar--refreshed .hub-info-bar__team {
  margin: 9px 0 0;
  padding-top: 9px;
  border-top: 1px solid rgba(150, 181, 222, 0.1);
  color: #b8c9dc;
  font-size: 11px;
  font-weight: 700;
}

#hub-tab-home {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 20px;
}

.home-section-kicker {
  display: block;
  color: #7197c9;
  font-size: 9px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.home-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.home-section-heading h3 {
  margin: 3px 0 0;
  color: #f2f6fb;
  font-size: 16px;
  letter-spacing: -0.02em;
}
.home-section-heading--compact { margin-bottom: 12px; }

.home-objective {
  padding: 16px;
  border: 1px solid rgba(85, 138, 207, 0.22);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(21, 44, 75, 0.9), rgba(12, 25, 43, 0.96));
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
}
.home-objective__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.home-objective__stage {
  color: #9bb1ca;
  font-size: 10px;
  font-weight: 700;
}
.home-objective__title {
  margin: 8px 0 5px;
  color: #f5f9ff;
  font-size: 19px;
  line-height: 1.1;
  letter-spacing: -0.025em;
}
.home-objective__text {
  margin: 0;
  color: #aebdd0;
  font-size: 12px;
  line-height: 1.45;
}
.home-objective__progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 13px;
}
.home-objective__progress-track {
  height: 5px;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 174, 205, 0.12);
}
.home-objective__progress-fill {
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4f8fe9, #8dbbff);
  transition: width 220ms ease;
}
.home-objective__progress-label {
  min-width: 78px;
  color: #b8cbe4;
  font-size: 10px;
  font-weight: 800;
  text-align: right;
}

.home-week-card {
  margin: 0;
  padding: 14px 0 0;
  border-top: 1px solid rgba(139, 166, 201, 0.1);
}
.home-week-card .home-section-heading { padding: 0 2px; }
.home-week-card .hub-cal__week-label {
  color: #758aa4;
  font-size: 9px;
  font-weight: 700;
}

.home-feature-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(96, 143, 202, 0.16);
  border-radius: 13px;
  background: rgba(13, 25, 43, 0.88);
}
.home-feature-card__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(66, 122, 197, 0.22), rgba(31, 61, 101, 0.3));
  font-size: 20px;
}
.home-feature-card__content h3 {
  margin: 4px 0 3px;
  color: #eef5fd;
  font-size: 14px;
}
.home-feature-card__content p {
  margin: 0;
  color: #98a9be;
  font-size: 11px;
  line-height: 1.4;
}
.home-feature-card__meta {
  display: block;
  margin-top: 7px;
  color: #6e9cda;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.home-snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.home-snapshot-card {
  min-width: 0;
  padding: 13px;
  border: 1px solid rgba(126, 154, 190, 0.13);
  border-radius: 12px;
  background: rgba(12, 23, 39, 0.82);
}
.home-snapshot-card__value {
  display: block;
  margin-top: 7px;
  color: #f0f6fd;
  font-size: 17px;
  line-height: 1.05;
}
.home-snapshot-card__detail {
  display: block;
  margin-top: 6px;
  color: #8799af;
  font-size: 10px;
  line-height: 1.35;
}

.home-dashboard-card.hub-dash-card {
  margin: 0;
  border: 1px solid rgba(125, 154, 190, 0.13);
  border-radius: 13px;
  background: rgba(11, 22, 38, 0.85);
  box-shadow: none;
}
.home-dashboard-card .hub-dash-card__header {
  min-height: 54px;
  padding: 12px 14px;
  border-bottom-color: rgba(131, 159, 193, 0.1);
}
.home-dashboard-card .hub-dash-card__title {
  display: block;
  margin-top: 3px;
  color: #eaf2fc;
  font-size: 14px;
}
.home-dashboard-card .hub-dash-card__body { padding: 8px 12px 12px; }

.home-empty-state {
  padding: 14px 4px;
  color: #7f92a9;
  font-size: 11px;
  line-height: 1.45;
}

.home-career-card {
  padding: 14px;
  border: 1px solid rgba(112, 151, 201, 0.17);
  border-radius: 13px;
  background: linear-gradient(155deg, rgba(14, 28, 48, 0.93), rgba(10, 20, 35, 0.94));
}
.home-text-action {
  border: 0;
  background: transparent;
  color: #78a7e3;
  font: inherit;
  font-size: 10px;
  font-weight: 800;
}
.home-career-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid rgba(129, 158, 194, 0.11);
  border-radius: 10px;
  background: rgba(126, 158, 199, 0.08);
}
.home-career-stat {
  min-width: 0;
  padding: 11px;
  background: rgba(9, 19, 33, 0.82);
}
.home-career-stat span {
  display: block;
  margin-bottom: 5px;
  color: #6f849e;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.home-career-stat strong {
  display: block;
  overflow: hidden;
  color: #dfeaf7;
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
}
.home-development-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  background: rgba(51, 91, 143, 0.13);
}
.home-development-strip strong {
  display: block;
  margin-top: 4px;
  color: #eaf2fb;
  font-size: 12px;
}
.home-development-strip p {
  margin: 3px 0 0;
  color: #8396ad;
  font-size: 9.5px;
  line-height: 1.35;
}
.home-development-strip__ovr {
  flex: 0 0 auto;
  padding: 6px 8px;
  border: 1px solid rgba(111, 162, 226, 0.2);
  border-radius: 8px;
  color: #a8ccff;
  font-size: 10px;
  font-weight: 900;
}

#home-team-leaders-card .hub-leaders__row {
  grid-template-columns: 22px minmax(0, 1fr) 34px 52px;
}

@media (max-width: 380px) {
  .home-snapshot-grid { grid-template-columns: 1fr; }
  .home-career-grid { grid-template-columns: 1fr 1fr; }
  .home-objective__progress-label { min-width: 66px; }
}
'''

index_path.write_text(index, encoding='utf-8')
game_path.write_text(game, encoding='utf-8')
style_path.write_text(style, encoding='utf-8')

print('HOME_CAREER_HUB_REFRESH_PATCH=PASS')
