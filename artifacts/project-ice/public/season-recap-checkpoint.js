'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__seasonRecapCheckpointInstalled === true) return;
  WorldEngine.__seasonRecapCheckpointInstalled = true;

  const ROOT_ID = 'pi-season-recap-screen';
  const STYLE_ID = 'pi-season-recap-styles';
  const EVENT_KEY = 'high-school-season-recap';

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const world = () => WorldEngine.state || null;
  const currentDate = () => dateKey(
    world()?.season?.currentDate || world()?.player?.currentDate || world()?.currentDate
  );

  function checkpointDate() {
    const explicit = dateKey(world()?.offseasonDevelopment?.checkpointDate);
    if (explicit) return explicit;
    const closeout = dateKey(world()?.travelHockey?.tournament?.closeoutAcknowledgedAt);
    if (!closeout) return null;
    return `${closeout.slice(0, 4)}-08-31`;
  }

  function isEligibleOffseason() {
    const state = world();
    return Boolean(
      state &&
      String(state?.season?.phase || '').toLowerCase() === 'offseason' &&
      state?.travelHockey?.completed === true &&
      state?.travelHockey?.tournament?.closeoutAcknowledged === true
    );
  }

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

  function eventId() {
    const archive = WorldEngine.getHighSchoolSeasonArchives?.()?.slice(-1)?.[0] || null;
    const seasonId = archive?.identity?.seasonId || world()?.season?.seasonId || 'hs-season';
    return `${EVENT_KEY}:${seasonId}`;
  }

  function ensureCheckpointEvent(options = {}) {
    if (!isEligibleOffseason()) return null;
    const state = world();
    const date = checkpointDate();
    if (!state || !date) return null;
    if (!Array.isArray(state.schedule)) state.schedule = [];

    const id = eventId();
    let event = state.schedule.find(item => String(item?.eventId || item?.id || '') === id) || null;
    const acknowledged = recapState()?.leagueRecapAcknowledged === true;

    if (!event) {
      event = {
        id,
        eventId: id,
        type: 'season-recap',
        eventType: 'season-recap',
        eventKey: EVENT_KEY,
        label: 'Season Recap',
        shortLabel: 'Season Recap',
        icon: '🏆',
        date,
        location: 'League Headquarters',
        objective: 'Look back on the completed high school season.',
        description: 'The season is officially complete. Review the league year before moving into your next chapter.',
        requiresPlayerInteraction: !acknowledged,
        isCareerEvent: true,
        offseasonEvent: true,
        seasonTransitionEvent: true,
        completed: acknowledged,
        played: acknowledged,
        status: acknowledged ? 'completed' : 'scheduled',
      };
      state.schedule.push(event);
    } else {
      Object.assign(event, {
        date,
        type: 'season-recap',
        eventType: 'season-recap',
        eventKey: EVENT_KEY,
        label: 'Season Recap',
        shortLabel: 'Season Recap',
        icon: '🏆',
        requiresPlayerInteraction: !acknowledged,
        isCareerEvent: true,
        offseasonEvent: true,
        seasonTransitionEvent: true,
      });
      if (acknowledged) {
        event.completed = true;
        event.played = true;
        event.status = 'completed';
      }
    }

    state.schedule.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    if (options.save !== false) WorldEngine.save?.();
    return event;
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

  function playerName(row) {
    return String(row?.playerName || row?.name || '—');
  }

  function formatSavePct(value) {
    const number = Number(value || 0);
    return number.toFixed(3).replace(/^0/, '');
  }

  function resolveTravelTeamName(teamId) {
    const travel = world()?.travelHockey || {};
    const teams = travel.teams || travel.tournament?.teams || travel.world?.teams || [];
    const team = teams.find(item => String(item?.teamId || '') === String(teamId || '')) || null;
    return String(team?.name || team?.teamName || team?.shortName || teamId || '—');
  }

  function standingsMarkup(rows) {
    return (rows || []).map((row, index) => `
      <div class="pi-sr-standing-row">
        <span class="pi-sr-rank">${index + 1}</span>
        <strong>${esc(teamName(row))}</strong>
        <span>${Number(row?.wins || 0)}-${Number(row?.losses || 0)}-${Number(row?.overtimeLosses || 0)}</span>
        <span class="pi-sr-pts">${Number(row?.points || 0)} PTS</span>
      </div>`).join('');
  }

  function leaderGroup(title, rows, formatter = value => String(Number(value || 0))) {
    return `
      <div class="pi-sr-leader-group">
        <div class="pi-sr-section-label">${esc(title)}</div>
        ${(rows || []).map((row, index) => `
          <div class="pi-sr-leader-row">
            <span>${index + 1}</span>
            <strong>${esc(playerName(row))}</strong>
            <b>${esc(formatter(row?.value))}</b>
          </div>`).join('') || '<div class="pi-sr-empty">No qualifying players</div>'}
      </div>`;
  }

  function awardsMarkup(awards) {
    return (awards || []).map(award => `
      <div class="pi-sr-award-row">
        <span>${esc(award?.title || 'Award')}</span>
        <strong>${esc(award?.playerName || '—')}</strong>
        <small>${esc(award?.team || '')}</small>
      </div>`).join('');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100180;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 24px) 18px calc(env(safe-area-inset-bottom,0px) + 32px);background:radial-gradient(circle at 50% 0%,rgba(49,108,195,.28),transparent 34%),linear-gradient(180deg,#07172a,#04101e);color:#f6f9ff}
      .pi-sr-shell{max-width:640px;margin:0 auto}.pi-sr-kicker{text-align:center;color:#7fb4ff;font-size:9px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}.pi-sr-title{text-align:center;margin:8px 0 4px;font-size:32px;letter-spacing:-.04em}.pi-sr-sub{text-align:center;margin:0 0 20px;color:#849bb8;font-size:12px}
      .pi-sr-hero{padding:20px;border:1px solid rgba(105,166,255,.22);border-radius:22px;background:linear-gradient(180deg,rgba(32,65,108,.78),rgba(12,29,51,.88));text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.22)}.pi-sr-trophy{font-size:34px}.pi-sr-hero-label{margin-top:8px;color:#7895bb;font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.pi-sr-hero-name{margin-top:7px;font-size:24px;font-weight:900;letter-spacing:-.03em}.pi-sr-hero-meta{margin-top:5px;color:#8da4bf;font-size:11px}
      .pi-sr-card{margin-top:14px;padding:16px;border:1px solid rgba(91,145,219,.16);border-radius:18px;background:rgba(10,27,48,.82)}.pi-sr-card h2{margin:0 0 12px;font-size:15px;letter-spacing:-.01em}.pi-sr-section-label{color:#6e8db2;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .pi-sr-standing-row{display:grid;grid-template-columns:24px minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid rgba(255,255,255,.055);font-size:10px}.pi-sr-standing-row:first-child{border-top:0}.pi-sr-standing-row strong{font-size:11px}.pi-sr-rank{color:#6c86a5;font-weight:900}.pi-sr-pts{color:#84b6ff;font-weight:900}
      .pi-sr-leaders{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pi-sr-leader-group{padding:12px;border:1px solid rgba(88,142,215,.12);border-radius:14px;background:rgba(6,19,35,.46)}.pi-sr-leader-row{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:center;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);font-size:9px}.pi-sr-leader-row:nth-child(2){margin-top:7px;border-top:0}.pi-sr-leader-row span{color:#647f9f;font-weight:900}.pi-sr-leader-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}.pi-sr-leader-row b{color:#a9ccff;font-size:10px}.pi-sr-empty{margin-top:8px;color:#637d9b;font-size:9px}
      .pi-sr-award-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;padding:10px 0;border-top:1px solid rgba(255,255,255,.055)}.pi-sr-award-row:first-child{border-top:0}.pi-sr-award-row span{color:#7792b3;font-size:9px;font-weight:900;text-transform:uppercase}.pi-sr-award-row strong{font-size:11px;text-align:right}.pi-sr-award-row small{grid-column:2;color:#657f9e;font-size:8px;text-align:right}
      .pi-sr-travel{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pi-sr-travel-item{padding:13px;border-radius:14px;background:rgba(7,20,37,.5);border:1px solid rgba(92,148,224,.12)}.pi-sr-travel-item span{display:block;color:#6d88aa;font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.pi-sr-travel-item strong{display:block;margin-top:6px;font-size:12px;line-height:1.25}
      .pi-sr-btn{width:100%;margin-top:16px;padding:17px 18px;border:1px solid rgba(105,167,255,.3);border-radius:17px;background:linear-gradient(135deg,#2763c9,#173b86);color:#fff;font:inherit;font-size:14px;font-weight:900;text-align:left;box-shadow:0 12px 28px rgba(20,78,177,.25)}.pi-sr-btn span{float:right;color:#bed7ff}.pi-sr-note{text-align:center;margin:11px 8px 0;color:#607895;font-size:9px;line-height:1.4}
    `;
    document.head.appendChild(style);
  }

  function activeArchive() {
    WorldEngine.ensureHighSchoolSeasonArchive?.({ save: false });
    const archives = WorldEngine.getHighSchoolSeasonArchives?.() || [];
    return archives[archives.length - 1] || null;
  }

  function renderLeagueSeasonRecap(options = {}) {
    if (!isEligibleOffseason()) return false;
    const recap = recapState();
    if (!recap || (recap.leagueRecapAcknowledged === true && options.force !== true)) return false;

    const archive = activeArchive();
    if (!archive) return false;

    injectStyles();
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    const identityLabel = archive?.identity?.label || 'Completed Season';
    const schoolYear = archive?.identity?.schoolYear || 'High School';
    const champion = teamName(archive?.champion);
    const runnerUp = teamName(archive?.runnerUp);
    const leaders = archive?.leagueLeaders || {};
    const travelChampion = resolveTravelTeamName(archive?.travel?.championTeamId);

    root.innerHTML = `
      <div class="pi-sr-shell">
        <div class="pi-sr-kicker">Project Ice · League History</div>
        <h1 class="pi-sr-title">Season Recap</h1>
        <p class="pi-sr-sub">${esc(identityLabel)} · ${esc(schoolYear)} Season</p>

        <div class="pi-sr-hero">
          <div class="pi-sr-trophy">🏆</div>
          <div class="pi-sr-hero-label">League Champion</div>
          <div class="pi-sr-hero-name">${esc(champion)}</div>
          <div class="pi-sr-hero-meta">Runner-up: ${esc(runnerUp)}</div>
        </div>

        <section class="pi-sr-card">
          <h2>Final Standings</h2>
          ${standingsMarkup(archive?.finalStandings || [])}
        </section>

        <section class="pi-sr-card">
          <h2>League Leaders</h2>
          <div class="pi-sr-leaders">
            ${leaderGroup('Points', leaders.points)}
            ${leaderGroup('Goals', leaders.goals)}
            ${leaderGroup('Assists', leaders.assists)}
            ${leaderGroup('Save Percentage', leaders.savePercentage, formatSavePct)}
          </div>
        </section>

        <section class="pi-sr-card">
          <h2>Award Winners</h2>
          ${awardsMarkup(archive?.leagueAwards || [])}
        </section>

        <section class="pi-sr-card">
          <h2>Summer Travel Hockey</h2>
          <div class="pi-sr-travel">
            <div class="pi-sr-travel-item"><span>Travel Champion</span><strong>${esc(travelChampion)}</strong></div>
            <div class="pi-sr-travel-item"><span>Tournament MVP</span><strong>${esc(archive?.travel?.mvpPlayerName || '—')}</strong></div>
          </div>
        </section>

        <button class="pi-sr-btn" type="button" id="pi-season-recap-continue">Continue to Player Recap <span>›</span></button>
        <div class="pi-sr-note">This completed season is permanently preserved in League History.</div>
      </div>`;

    root.querySelector('#pi-season-recap-continue')?.addEventListener('click', () => {
      recap.leagueRecapAcknowledged = true;
      recap.leagueRecapAcknowledgedAt = currentDate() || checkpointDate();
      recap.archiveId = archive.archiveId || archive.identity?.seasonId || null;

      const event = ensureCheckpointEvent({ save: false });
      if (event) {
        event.completed = true;
        event.played = true;
        event.status = 'completed';
        event.completedAt = recap.leagueRecapAcknowledgedAt;
        event.requiresPlayerInteraction = false;
      }

      WorldEngine.save?.();
      root.remove();
      window.dispatchEvent(new CustomEvent('projectice:league-season-recap-complete', {
        detail: { archiveId: recap.archiveId }
      }));
    });

    return true;
  }

  function shouldBlockAtCheckpoint() {
    const date = checkpointDate();
    const now = currentDate();
    return Boolean(
      isEligibleOffseason() &&
      date && now &&
      now >= date &&
      recapState()?.leagueRecapAcknowledged !== true
    );
  }

  const originalAdvanceToDate = typeof WorldEngine.advanceToDate === 'function'
    ? WorldEngine.advanceToDate.bind(WorldEngine)
    : null;

  if (originalAdvanceToDate) {
    WorldEngine.advanceToDate = function seasonRecapAwareAdvance(targetDate, options = {}) {
      ensureCheckpointEvent({ save: false });

      const requested = dateKey(targetDate);
      const before = currentDate();
      const checkpoint = checkpointDate();
      const recapPending = Boolean(
        isEligibleOffseason() &&
        checkpoint &&
        recapState()?.leagueRecapAcknowledged !== true
      );

      /*
       * If the career is already sitting on Aug. 31, do not allow any later
       * simulation path to move one day beyond the unresolved recap. This is
       * the true hard-stop branch that the prior implementation missed.
       */
      if (
        recapPending &&
        requested && before &&
        before >= checkpoint &&
        requested > before
      ) {
        requestAnimationFrame(() => renderLeagueSeasonRecap({ force: true }));
        return {
          success: true,
          currentDate: before,
          targetDate: requested,
          seasonRecapCheckpoint: true,
          stopSimulation: true,
          reason: 'season-recap-pending',
        };
      }

      const mustStop = Boolean(
        recapPending &&
        requested && before &&
        before < checkpoint &&
        requested >= checkpoint
      );

      const result = originalAdvanceToDate(mustStop ? checkpoint : targetDate, {
        ...options,
        save: false,
      });

      if (options.save !== false) WorldEngine.save?.();

      if (shouldBlockAtCheckpoint()) {
        requestAnimationFrame(() => renderLeagueSeasonRecap({ force: true }));
        return {
          ...(result || {}),
          success: true,
          currentDate: currentDate(),
          targetDate: requested,
          seasonRecapCheckpoint: true,
          stopSimulation: true,
          reason: 'season-recap-checkpoint-reached',
        };
      }

      return result;
    };
  }

  document.addEventListener('click', event => {
    const details = event.target?.closest?.('#schedule-selected-day-details');
    if (!details) return;
    const selected = dateKey(document.querySelector('.schedule-day--selected')?.dataset?.date);
    if (!selected || selected !== checkpointDate()) return;
    const checkpointEvent = ensureCheckpointEvent({ save: false });
    if (!checkpointEvent || checkpointEvent.requiresPlayerInteraction !== true) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderLeagueSeasonRecap({ force: true });
  }, true);

  WorldEngine.ensureSeasonRecapCheckpointEvent = ensureCheckpointEvent;
  WorldEngine.renderLeagueSeasonRecap = renderLeagueSeasonRecap;
  WorldEngine.getSeasonRecapCheckpointDate = checkpointDate;

  ensureCheckpointEvent({ save: true });
  if (shouldBlockAtCheckpoint()) requestAnimationFrame(() => renderLeagueSeasonRecap({ force: true }));
})();
