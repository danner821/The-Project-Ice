'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__playerSeasonRecapInstalled === true) return;
  WorldEngine.__playerSeasonRecapInstalled = true;

  const ROOT_ID = 'pi-player-season-recap-screen';
  const STYLE_ID = 'pi-player-season-recap-styles';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const world = () => WorldEngine.state || null;
  const currentDate = () => dateKey(
    world()?.season?.currentDate || world()?.player?.currentDate || world()?.currentDate
  );

  function recapState() {
    const state = world();
    if (!state) return null;
    state.seasonTransition = state.seasonTransition && typeof state.seasonTransition === 'object'
      ? state.seasonTransition
      : {};
    state.seasonTransition.recap = state.seasonTransition.recap && typeof state.seasonTransition.recap === 'object'
      ? state.seasonTransition.recap
      : {};
    return state.seasonTransition.recap;
  }

  function activeArchive() {
    const recap = recapState();
    const explicit = recap?.archiveId
      ? WorldEngine.getHighSchoolSeasonArchive?.(recap.archiveId)
      : null;
    if (explicit) return explicit;
    const archives = WorldEngine.getHighSchoolSeasonArchives?.() || [];
    return archives[archives.length - 1] || null;
  }

  function canonicalCareerPlayer() {
    const state = world();
    if (!state) return null;
    return (state.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) || state.player || null;
  }

  function teamName(team) {
    if (!team) return '—';
    return String(
      team.fullName ||
      [team.schoolName, team.teamName].filter(Boolean).join(' ') ||
      team.name ||
      team.abbreviation ||
      '—'
    );
  }

  function statValue(stats, ...keys) {
    for (const key of keys) {
      const value = stats?.[key];
      if (value !== undefined && value !== null && value !== '') return Number(value) || 0;
    }
    return 0;
  }

  function statStrip(stats, scope) {
    const isGoalie = String(activeArchive()?.careerPlayer?.position || '').toUpperCase() === 'G';
    if (!stats || statValue(stats, 'gamesPlayed', 'gp') <= 0) {
      return `<div class="pi-pr-empty">No ${esc(scope)} statistics recorded.</div>`;
    }

    const items = isGoalie
      ? [
          ['GP', statValue(stats, 'gamesPlayed', 'gp')],
          ['W', statValue(stats, 'wins', 'w')],
          ['L', statValue(stats, 'losses', 'l')],
          ['SV%', statValue(stats, 'savePercentage', 'svPct').toFixed(3).replace(/^0/, '')],
          ['SO', statValue(stats, 'shutouts', 'so')],
        ]
      : [
          ['GP', statValue(stats, 'gamesPlayed', 'gp')],
          ['G', statValue(stats, 'goals', 'g')],
          ['A', statValue(stats, 'assists', 'a')],
          ['PTS', statValue(stats, 'points', 'pts')],
          ['+/-', statValue(stats, 'plusMinus') > 0 ? `+${statValue(stats, 'plusMinus')}` : statValue(stats, 'plusMinus')],
        ];

    return `<div class="pi-pr-stat-grid">${items.map(([label, value]) => `
      <div class="pi-pr-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>
    `).join('')}</div>`;
  }

  function travelStats() {
    const player = canonicalCareerPlayer();
    return player?.travelStats || world()?.player?.travelStats || null;
  }

  function travelTeamName(teamId) {
    const travel = world()?.travelHockey || {};
    const teams = travel.teams || travel.tournament?.teams || travel.world?.teams || [];
    const team = teams.find(item => String(item?.teamId || item?.id || '') === String(teamId || ''));
    return String(team?.name || team?.teamName || team?.shortName || teamId || '—');
  }

  function humanize(key) {
    return String(key || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function flattenNumericAttributes(value, prefix = '', rows = []) {
    if (!value || typeof value !== 'object') return rows;
    Object.entries(value).forEach(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof child === 'number' && Number.isFinite(child)) {
        rows.push({ path, label: humanize(key), value: child });
      } else if (child && typeof child === 'object' && !Array.isArray(child)) {
        flattenNumericAttributes(child, path, rows);
      }
    });
    return rows;
  }

  function developmentMarkup(archive) {
    const seasonId = archive?.identity?.seasonId || archive?.archiveId || '';
    const opening = WorldEngine.getHighSchoolSeasonOpeningDevelopmentSnapshot?.(seasonId) || null;
    const endingPlayer = canonicalCareerPlayer();
    const endingOverall = Number(archive?.careerPlayer?.overall ?? endingPlayer?.overall ?? 0);

    if (!opening) {
      return `
        <div class="pi-pr-ovr-row">
          <div><span>Ending Overall</span><strong>${endingOverall || '—'}</strong></div>
        </div>
        <div class="pi-pr-dev-note">This legacy dev checkpoint predates season-opening development snapshots. A fresh career will show the exact OVR change and every attribute upgraded during the season.</div>`;
    }

    const openingRows = new Map(flattenNumericAttributes(opening.attributes).map(row => [row.path, row]));
    const endingRows = flattenNumericAttributes(endingPlayer?.attributes || {});
    const gains = endingRows
      .map(row => ({ ...row, before: openingRows.get(row.path)?.value }))
      .filter(row => Number.isFinite(row.before) && row.value > row.before)
      .map(row => ({ ...row, gain: row.value - row.before }))
      .sort((a, b) => b.gain - a.gain || a.label.localeCompare(b.label));

    return `
      <div class="pi-pr-ovr-row">
        <div><span>Starting OVR</span><strong>${Number(opening.overall || 0) || '—'}</strong></div>
        <div class="pi-pr-ovr-arrow">→</div>
        <div><span>Ending OVR</span><strong>${endingOverall || '—'}</strong></div>
      </div>
      <div class="pi-pr-growth-list">
        ${gains.length
          ? gains.map(row => `
              <div class="pi-pr-growth-row">
                <strong>${esc(row.label)}</strong>
                <span>${row.before} → ${row.value}</span>
                <b>+${row.gain}</b>
              </div>`).join('')
          : '<div class="pi-pr-empty">No attribute increases were recorded this season.</div>'}
      </div>`;
  }

  function awardsMarkup(archive) {
    const playerId = String(archive?.careerPlayer?.playerId || '');
    const awards = (archive?.leagueAwards || []).filter(award =>
      playerId && String(award?.playerId || '') === playerId
    );
    const playoffMvp = String(archive?.playoffMvpPlayerId || '') === playerId &&
      !awards.some(award => String(award?.title || '').toLowerCase().includes('playoff mvp'));

    if (playoffMvp) awards.push({ title: 'Playoff MVP' });
    if (!awards.length) return '<div class="pi-pr-empty">No individual awards this season.</div>';

    return `<div class="pi-pr-honors">${awards.map(award => `
      <div class="pi-pr-honor"><span>🏅</span><strong>${esc(award?.title || 'Award')}</strong></div>
    `).join('')}</div>`;
  }

  function teamFinishText(archive) {
    const standing = archive?.careerTeamStanding;
    const standings = archive?.finalStandings || [];
    const index = standings.findIndex(row => String(row?.teamId || '') === String(standing?.teamId || ''));
    if (index < 0) return '—';
    const suffix = n => {
      if (n % 100 >= 11 && n % 100 <= 13) return 'th';
      return ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th';
    };
    const place = index + 1;
    return `${place}${suffix(place)} · ${Number(standing?.wins || 0)}-${Number(standing?.losses || 0)}-${Number(standing?.overtimeLosses || 0)}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100190;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 24px) 18px calc(env(safe-area-inset-bottom,0px) + 32px);background:radial-gradient(circle at 50% 0%,rgba(47,111,203,.29),transparent 35%),linear-gradient(180deg,#07172a,#04101e);color:#f7faff}
      .pi-pr-shell{max-width:640px;margin:0 auto}.pi-pr-kicker{text-align:center;color:#7fb4ff;font-size:9px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}.pi-pr-title{text-align:center;margin:8px 0 3px;font-size:32px;letter-spacing:-.04em}.pi-pr-sub{text-align:center;margin:0 0 19px;color:#849bb8;font-size:12px}
      .pi-pr-hero{padding:20px;border:1px solid rgba(104,166,255,.22);border-radius:22px;background:linear-gradient(180deg,rgba(31,64,107,.8),rgba(11,29,51,.9));box-shadow:0 18px 40px rgba(0,0,0,.22)}.pi-pr-hero-name{font-size:25px;font-weight:900;letter-spacing:-.035em}.pi-pr-hero-meta{margin-top:6px;color:#93a9c3;font-size:11px}.pi-pr-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.pi-pr-summary-item{padding:11px 8px;border:1px solid rgba(108,165,238,.13);border-radius:13px;background:rgba(6,20,37,.5)}.pi-pr-summary-item span{display:block;color:#6d88aa;font-size:7px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.pi-pr-summary-item strong{display:block;margin-top:5px;font-size:10px;line-height:1.2}
      .pi-pr-card{margin-top:14px;padding:16px;border:1px solid rgba(91,145,219,.16);border-radius:18px;background:rgba(10,27,48,.82)}.pi-pr-card h2{margin:0 0 12px;font-size:15px}.pi-pr-scope{margin-top:14px}.pi-pr-scope:first-of-type{margin-top:0}.pi-pr-scope-label{margin-bottom:8px;color:#6f8db1;font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
      .pi-pr-stat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.pi-pr-stat{padding:9px 4px;border:1px solid rgba(97,152,225,.12);border-radius:11px;background:rgba(6,19,35,.48);text-align:center}.pi-pr-stat span{display:block;color:#6984a4;font-size:7px;font-weight:900}.pi-pr-stat strong{display:block;margin-top:4px;font-size:13px}.pi-pr-empty{color:#657f9f;font-size:10px;line-height:1.5}
      .pi-pr-travel-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pi-pr-travel-item{padding:12px;border:1px solid rgba(95,151,224,.12);border-radius:13px;background:rgba(6,19,35,.48)}.pi-pr-travel-item span{display:block;color:#6c87a8;font-size:7px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.pi-pr-travel-item strong{display:block;margin-top:5px;font-size:11px;line-height:1.25}
      .pi-pr-ovr-row{display:flex;align-items:center;justify-content:center;gap:18px;padding:14px;border-radius:14px;background:rgba(6,19,35,.46)}.pi-pr-ovr-row div:not(.pi-pr-ovr-arrow){text-align:center}.pi-pr-ovr-row span{display:block;color:#718dab;font-size:7px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.pi-pr-ovr-row strong{display:block;margin-top:4px;font-size:25px}.pi-pr-ovr-arrow{color:#76a9ed;font-size:19px}.pi-pr-growth-list{margin-top:10px}.pi-pr-growth-row{display:grid;grid-template-columns:minmax(0,1fr) auto 36px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid rgba(255,255,255,.055);font-size:9px}.pi-pr-growth-row:first-child{border-top:0}.pi-pr-growth-row strong{font-size:10px}.pi-pr-growth-row span{color:#7890ad}.pi-pr-growth-row b{color:#84b8ff;text-align:right}.pi-pr-dev-note{margin-top:10px;color:#667f9e;font-size:9px;line-height:1.5}
      .pi-pr-honors{display:grid;gap:7px}.pi-pr-honor{display:flex;gap:9px;align-items:center;padding:10px 11px;border:1px solid rgba(97,152,225,.11);border-radius:12px;background:rgba(6,19,35,.46)}.pi-pr-honor strong{font-size:11px}.pi-pr-btn{width:100%;margin-top:16px;padding:17px 18px;border:1px solid rgba(105,167,255,.3);border-radius:17px;background:linear-gradient(135deg,#2763c9,#173b86);color:#fff;font:inherit;font-size:14px;font-weight:900;text-align:left;box-shadow:0 12px 28px rgba(20,78,177,.25)}.pi-pr-btn span{float:right;color:#bed7ff}.pi-pr-note{text-align:center;margin:11px 8px 0;color:#607895;font-size:9px;line-height:1.4}
    `;
    document.head.appendChild(style);
  }

  function render(options = {}) {
    const recap = recapState();
    if (!recap || recap.leagueRecapAcknowledged !== true) return false;
    if (recap.playerRecapAcknowledged === true && options.force !== true) return false;

    const archive = activeArchive();
    if (!archive?.careerPlayer) return false;

    injectStyles();
    document.getElementById('pi-season-recap-screen')?.remove();

    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    const player = archive.careerPlayer;
    const travel = archive.travel || {};
    const currentTravel = world()?.travelHockey || {};
    const travelTeamId = currentTravel.playerTeamId || currentTravel.placementTeamId || travel.mvpTeamId || null;
    const wasTravelChampion = Boolean(travel.championTeamId && travelTeamId && String(travel.championTeamId) === String(travelTeamId));
    const nextIndex = Math.min(3, Number(archive?.identity?.careerYearIndex || 0) + 1);
    const nextIdentity = WorldEngine.getHighSchoolSeasonIdentity?.(nextIndex) || null;
    const role = player.role || 'Returning Player';

    root.innerHTML = `
      <div class="pi-pr-shell">
        <div class="pi-pr-kicker">Project Ice · Career Yearbook</div>
        <h1 class="pi-pr-title">${esc(archive?.identity?.schoolYear || 'High School')} Season</h1>
        <p class="pi-pr-sub">${esc(archive?.identity?.label || '')} · Your Year in Review</p>

        <div class="pi-pr-hero">
          <div class="pi-pr-hero-name">${esc(player.playerName || 'Career Player')}</div>
          <div class="pi-pr-hero-meta">${esc(teamName(player.team))} · ${esc(player.position || '')}</div>
          <div class="pi-pr-summary">
            <div class="pi-pr-summary-item"><span>Team Finish</span><strong>${esc(teamFinishText(archive))}</strong></div>
            <div class="pi-pr-summary-item"><span>Final Role</span><strong>${esc(role)}</strong></div>
            <div class="pi-pr-summary-item"><span>Potential</span><strong>${esc(player.potential || '—')}</strong></div>
          </div>
        </div>

        <section class="pi-pr-card">
          <h2>High School Statistics</h2>
          <div class="pi-pr-scope"><div class="pi-pr-scope-label">Regular Season</div>${statStrip(player.regularSeasonStats, 'regular-season')}</div>
          <div class="pi-pr-scope"><div class="pi-pr-scope-label">Playoffs</div>${statStrip(player.playoffStats, 'playoff')}</div>
        </section>

        <section class="pi-pr-card">
          <h2>Summer Travel Hockey</h2>
          <div class="pi-pr-travel-grid">
            <div class="pi-pr-travel-item"><span>Level</span><strong>${esc(travel.level || currentTravel.placementLevel || '—')}</strong></div>
            <div class="pi-pr-travel-item"><span>Club</span><strong>${esc(travelTeamName(travelTeamId))}</strong></div>
            <div class="pi-pr-travel-item"><span>Tournament Result</span><strong>${wasTravelChampion ? 'Champion' : 'Completed'}</strong></div>
            <div class="pi-pr-travel-item"><span>Tournament MVP</span><strong>${String(travel.mvpPlayerId || '') === String(player.playerId || '') ? 'Winner' : '—'}</strong></div>
          </div>
          <div class="pi-pr-scope"><div class="pi-pr-scope-label">Travel Stats</div>${statStrip(travelStats(), 'Travel')}</div>
        </section>

        <section class="pi-pr-card">
          <h2>Season Development</h2>
          ${developmentMarkup(archive)}
        </section>

        <section class="pi-pr-card">
          <h2>Awards & Honors</h2>
          ${awardsMarkup(archive)}
        </section>

        <button class="pi-pr-btn" id="pi-player-season-recap-continue" type="button">${nextIdentity ? `Continue to ${esc(nextIdentity.schoolYear)} Season` : 'Continue'} <span>›</span></button>
        <div class="pi-pr-note">Your completed season remains permanently preserved in League History.</div>
      </div>`;

    root.querySelector('#pi-player-season-recap-continue')?.addEventListener('click', () => {
      recap.playerRecapAcknowledged = true;
      recap.playerRecapAcknowledgedAt = currentDate();
      recap.nextCareerYearIndex = nextIndex;
      recap.nextSeasonId = nextIdentity?.seasonId || null;
      WorldEngine.save?.();
      root.remove();
      window.dispatchEvent(new CustomEvent('projectice:player-season-recap-complete', {
        detail: {
          archiveId: archive.archiveId || null,
          nextCareerYearIndex: nextIndex,
          nextSeasonId: nextIdentity?.seasonId || null,
        },
      }));
    });

    return true;
  }

  function shouldBlock() {
    const recap = recapState();
    return Boolean(
      recap?.leagueRecapAcknowledged === true &&
      recap?.playerRecapAcknowledged !== true &&
      world()?.travelHockey?.completed === true &&
      String(world()?.season?.phase || '').toLowerCase() === 'offseason'
    );
  }

  window.addEventListener('projectice:league-season-recap-complete', () => {
    requestAnimationFrame(() => render({ force: true }));
  });

  const originalAdvanceToDate = typeof WorldEngine.advanceToDate === 'function'
    ? WorldEngine.advanceToDate.bind(WorldEngine)
    : null;

  if (originalAdvanceToDate) {
    WorldEngine.advanceToDate = function playerRecapAwareAdvance(targetDate, options = {}) {
      if (shouldBlock()) {
        requestAnimationFrame(() => render({ force: true }));
        return {
          success: true,
          currentDate: currentDate(),
          targetDate: dateKey(targetDate),
          playerSeasonRecapCheckpoint: true,
          stopSimulation: true,
          reason: 'player-season-recap-pending',
        };
      }
      return originalAdvanceToDate(targetDate, options);
    };
  }

  WorldEngine.renderPlayerSeasonRecap = render;

  if (shouldBlock()) requestAnimationFrame(() => render({ force: true }));
})();
