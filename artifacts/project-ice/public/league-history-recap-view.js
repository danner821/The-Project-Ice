'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__leagueHistoryRecapViewInstalled === true) return;
  WorldEngine.__leagueHistoryRecapViewInstalled = true;

  const ROOT_ID = 'pi-league-history-recap-screen';
  const STYLE_ID = 'pi-league-history-recap-styles';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const archives = () => {
    const records = WorldEngine.getHighSchoolSeasonArchives?.() ||
      WorldEngine.state?.history?.highSchoolSeasons || [];
    return Array.isArray(records) ? records.slice() : [];
  };

  const archiveId = record => String(record?.archiveId || record?.identity?.seasonId || '');

  function findArchive(id) {
    const records = archives();
    if (!id) return records[records.length - 1] || null;
    return records.find(record =>
      archiveId(record) === String(id) ||
      String(record?.identity?.seasonId || '') === String(id)
    ) || null;
  }

  function teamName(team) {
    if (!team) return '—';
    return String(
      team.fullName ||
      [team.schoolName, team.teamName].filter(Boolean).join(' ') ||
      team.name || team.abbreviation || '—'
    );
  }

  function playerName(row) {
    return String(row?.playerName || row?.name || '—');
  }

  function formatSavePct(value) {
    return Number(value || 0).toFixed(3).replace(/^0/, '');
  }

  function travelTeamName(record) {
    const teamId = record?.travel?.championTeamId;
    const travel = WorldEngine.state?.travelHockey || {};
    const teams = travel.teams || travel.tournament?.teams || travel.world?.teams || [];
    const current = teams.find(team => String(team?.teamId || '') === String(teamId || ''));
    return String(current?.name || current?.teamName || current?.shortName || record?.travel?.championTeamName || teamId || '—');
  }

  function standingsMarkup(rows) {
    return (rows || []).map((row, index) => `
      <div class="pi-lhr-standing-row">
        <span class="pi-lhr-rank">${index + 1}</span>
        <strong>${esc(teamName(row))}</strong>
        <span>${Number(row?.wins || 0)}-${Number(row?.losses || 0)}-${Number(row?.overtimeLosses || 0)}</span>
        <span class="pi-lhr-pts">${Number(row?.points || 0)} PTS</span>
      </div>`).join('');
  }

  function leaderGroup(title, rows, formatter = value => String(Number(value || 0))) {
    return `
      <div class="pi-lhr-leader-group">
        <div class="pi-lhr-section-label">${esc(title)}</div>
        ${(rows || []).map((row, index) => `
          <div class="pi-lhr-leader-row">
            <span>${index + 1}</span>
            <strong>${esc(playerName(row))}</strong>
            <b>${esc(formatter(row?.value))}</b>
          </div>`).join('') || '<div class="pi-lhr-empty">No qualifying players</div>'}
      </div>`;
  }

  function awardsMarkup(awards) {
    return (awards || []).map(award => `
      <div class="pi-lhr-award-row">
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
      #${ROOT_ID}{position:fixed;inset:0;z-index:100190;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 24px) 18px calc(env(safe-area-inset-bottom,0px) + 32px);background:radial-gradient(circle at 50% 0%,rgba(49,108,195,.28),transparent 34%),linear-gradient(180deg,#07172a,#04101e);color:#f6f9ff}
      .pi-lhr-shell{max-width:640px;margin:0 auto}.pi-lhr-kicker{text-align:center;color:#7fb4ff;font-size:9px;font-weight:900;letter-spacing:.19em;text-transform:uppercase}.pi-lhr-title{text-align:center;margin:8px 0 4px;font-size:32px;letter-spacing:-.04em}.pi-lhr-sub{text-align:center;margin:0 0 20px;color:#849bb8;font-size:12px}
      .pi-lhr-hero{padding:20px;border:1px solid rgba(105,166,255,.22);border-radius:22px;background:linear-gradient(180deg,rgba(32,65,108,.78),rgba(12,29,51,.88));text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.22)}.pi-lhr-trophy{font-size:34px}.pi-lhr-hero-label{margin-top:8px;color:#7895bb;font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.pi-lhr-hero-name{margin-top:7px;font-size:24px;font-weight:900;letter-spacing:-.03em}.pi-lhr-hero-meta{margin-top:5px;color:#8da4bf;font-size:11px}
      .pi-lhr-card{margin-top:14px;padding:16px;border:1px solid rgba(91,145,219,.16);border-radius:18px;background:rgba(10,27,48,.82)}.pi-lhr-card h2{margin:0 0 12px;font-size:15px;letter-spacing:-.01em}.pi-lhr-section-label{color:#6e8db2;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .pi-lhr-standing-row{display:grid;grid-template-columns:24px minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid rgba(255,255,255,.055);font-size:10px}.pi-lhr-standing-row:first-child{border-top:0}.pi-lhr-standing-row strong{font-size:11px}.pi-lhr-rank{color:#6c86a5;font-weight:900}.pi-lhr-pts{color:#84b6ff;font-weight:900}
      .pi-lhr-leaders{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pi-lhr-leader-group{padding:12px;border:1px solid rgba(88,142,215,.12);border-radius:14px;background:rgba(6,19,35,.46)}.pi-lhr-leader-row{display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:center;padding:7px 0;border-top:1px solid rgba(255,255,255,.05);font-size:9px}.pi-lhr-leader-row:nth-child(2){margin-top:7px;border-top:0}.pi-lhr-leader-row span{color:#647f9f;font-weight:900}.pi-lhr-leader-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}.pi-lhr-leader-row b{color:#a9ccff;font-size:10px}.pi-lhr-empty{margin-top:8px;color:#637d9b;font-size:9px}
      .pi-lhr-award-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;padding:10px 0;border-top:1px solid rgba(255,255,255,.055)}.pi-lhr-award-row:first-child{border-top:0}.pi-lhr-award-row span{color:#7792b3;font-size:9px;font-weight:900;text-transform:uppercase}.pi-lhr-award-row strong{font-size:11px;text-align:right}.pi-lhr-award-row small{grid-column:2;color:#657f9e;font-size:8px;text-align:right}
      .pi-lhr-travel{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pi-lhr-travel-item{padding:13px;border-radius:14px;background:rgba(7,20,37,.5);border:1px solid rgba(92,148,224,.12)}.pi-lhr-travel-item span{display:block;color:#6d88aa;font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.pi-lhr-travel-item strong{display:block;margin-top:6px;font-size:12px;line-height:1.25}
      .pi-lhr-btn{width:100%;margin-top:16px;padding:17px 18px;border:1px solid rgba(105,167,255,.3);border-radius:17px;background:linear-gradient(135deg,#2763c9,#173b86);color:#fff;font:inherit;font-size:14px;font-weight:900;text-align:left;box-shadow:0 12px 28px rgba(20,78,177,.25)}.pi-lhr-btn span{float:right;color:#bed7ff}.pi-lhr-note{text-align:center;margin:11px 8px 0;color:#607895;font-size:9px;line-height:1.4}
      .pi-lhr-history-list{display:grid;gap:10px}.pi-lhr-history-row{width:100%;padding:16px;border:1px solid rgba(91,145,219,.16);border-radius:17px;background:rgba(10,27,48,.82);color:#fff;text-align:left;font:inherit}.pi-lhr-history-row strong{display:block;font-size:16px}.pi-lhr-history-row span{display:block;margin-top:5px;color:#7f98b8;font-size:10px}
    `;
    document.head.appendChild(style);
  }

  function renderArchive(record, options = {}) {
    if (!record) return false;
    injectStyles();
    document.getElementById('pi-league-history-screen')?.remove();
    document.getElementById(ROOT_ID)?.remove();

    const root = document.createElement('section');
    root.id = ROOT_ID;
    const identityLabel = record?.identity?.label || 'Completed Season';
    const schoolYear = record?.identity?.schoolYear || 'High School';
    const leaders = record?.leagueLeaders || {};
    root.innerHTML = `
      <div class="pi-lhr-shell">
        <div class="pi-lhr-kicker">Project Ice · League History</div>
        <h1 class="pi-lhr-title">Season Recap</h1>
        <p class="pi-lhr-sub">${esc(identityLabel)} · ${esc(schoolYear)} Season</p>
        <div class="pi-lhr-hero">
          <div class="pi-lhr-trophy">🏆</div>
          <div class="pi-lhr-hero-label">League Champion</div>
          <div class="pi-lhr-hero-name">${esc(teamName(record?.champion))}</div>
          <div class="pi-lhr-hero-meta">Runner-up: ${esc(teamName(record?.runnerUp))}</div>
        </div>
        <section class="pi-lhr-card"><h2>Final Standings</h2>${standingsMarkup(record?.finalStandings || [])}</section>
        <section class="pi-lhr-card"><h2>League Leaders</h2><div class="pi-lhr-leaders">
          ${leaderGroup('Points', leaders.points)}
          ${leaderGroup('Goals', leaders.goals)}
          ${leaderGroup('Assists', leaders.assists)}
          ${leaderGroup('Save Percentage', leaders.savePercentage, formatSavePct)}
        </div></section>
        <section class="pi-lhr-card"><h2>Award Winners</h2>${awardsMarkup(record?.leagueAwards || [])}</section>
        <section class="pi-lhr-card"><h2>Summer Travel Hockey</h2><div class="pi-lhr-travel">
          <div class="pi-lhr-travel-item"><span>Travel Champion</span><strong>${esc(travelTeamName(record))}</strong></div>
          <div class="pi-lhr-travel-item"><span>Tournament MVP</span><strong>${esc(record?.travel?.mvpPlayerName || '—')}</strong></div>
        </div></section>
        <button type="button" class="pi-lhr-btn" data-lhr-back>${options.fromList ? 'Back to Seasons' : 'Back to League'} <span>›</span></button>
        <div class="pi-lhr-note">This completed season is permanently preserved in League History.</div>
      </div>`;

    root.addEventListener('click', event => {
      if (!event.target?.closest?.('[data-lhr-back]')) return;
      root.remove();
      if (options.fromList) openList();
    });
    document.body.appendChild(root);
    return true;
  }

  function openList() {
    injectStyles();
    document.getElementById('pi-league-history-screen')?.remove();
    document.getElementById(ROOT_ID)?.remove();
    const records = archives().sort((a, b) => Number(b?.identity?.startYear || 0) - Number(a?.identity?.startYear || 0));
    const root = document.createElement('section');
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="pi-lhr-shell">
        <div class="pi-lhr-kicker">Project Ice · League History</div>
        <h1 class="pi-lhr-title">League History</h1>
        <p class="pi-lhr-sub">Every completed high school season.</p>
        <div class="pi-lhr-history-list">
          ${records.map(record => `
            <button type="button" class="pi-lhr-history-row" data-lhr-archive="${esc(archiveId(record))}">
              <strong>${esc(record?.identity?.label || 'Completed Season')} · ${esc(record?.identity?.schoolYear || 'High School')}</strong>
              <span>Champion: ${esc(teamName(record?.champion))}</span>
            </button>`).join('') || '<div class="pi-lhr-empty">No completed seasons yet.</div>'}
        </div>
        <button type="button" class="pi-lhr-btn" data-lhr-close>Back to League <span>›</span></button>
      </div>`;
    root.addEventListener('click', event => {
      const season = event.target?.closest?.('[data-lhr-archive]');
      if (season) {
        const record = findArchive(season.dataset.lhrArchive);
        root.remove();
        renderArchive(record, { fromList: true });
        return;
      }
      if (event.target?.closest?.('[data-lhr-close]')) root.remove();
    });
    document.body.appendChild(root);
    return true;
  }

  /*
   * The archive builder is intentionally comprehensive and therefore costly.
   * Once a completed archive already exists and the career has moved into a
   * later active season, repeated League-tab renders should only read history,
   * not rebuild/check the completed season on every click.
   */
  const baseEnsureArchive = typeof WorldEngine.ensureHighSchoolSeasonArchive === 'function'
    ? WorldEngine.ensureHighSchoolSeasonArchive.bind(WorldEngine)
    : null;
  if (baseEnsureArchive && baseEnsureArchive.__leagueHistoryFastPath !== true) {
    const fastEnsureArchive = function(options = {}) {
      const records = WorldEngine.state?.history?.highSchoolSeasons;
      const currentSeasonId = String(WorldEngine.state?.season?.seasonId || '');
      const currentPhase = String(WorldEngine.state?.season?.phase || '').toLowerCase();
      const latest = Array.isArray(records) ? records[records.length - 1] : null;
      const archivedSeasonId = String(latest?.identity?.seasonId || latest?.archiveId || '');
      if (latest && currentPhase !== 'offseason' && archivedSeasonId && archivedSeasonId !== currentSeasonId) {
        return { archived: false, reason: 'already-archived-prior-season', record: structuredClone(latest) };
      }
      return baseEnsureArchive(options);
    };
    fastEnsureArchive.__leagueHistoryFastPath = true;
    WorldEngine.ensureHighSchoolSeasonArchive = fastEnsureArchive;
  }

  document.addEventListener('click', event => {
    const previewButton = event.target?.closest?.('#league-history-preview button[data-archive-id], #league-history-preview .pi-lh-preview-card');
    if (previewButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = previewButton.dataset?.archiveId || archiveId(archives().slice(-1)[0]);
      renderArchive(findArchive(id));
      return;
    }

    const button = event.target?.closest?.('button');
    if (!button || !/explore/i.test(String(button.textContent || ''))) return;
    const section = button.closest?.('.league-section');
    if (!section?.querySelector?.('#league-history-preview')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openList();
  }, true);

  WorldEngine.openArchivedLeagueSeasonRecap = id => renderArchive(findArchive(id));
})();
