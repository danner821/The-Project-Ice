'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CARD_ID = 'pi-league-awards-card';
  const SCREEN_ID = 'pi-league-awards-screen';
  const HISTORY_SCREEN_ID = 'pi-league-history-screen';
  const STYLE_ID = 'pi-league-awards-history-styles';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const post = () =>
    WorldEngine.getHighSchoolPostseason?.() ||
    WorldEngine.state?.postseason?.highSchool ||
    null;

  function currentAwards() {
    const direct = post()?.leagueAwards?.winners;
    if (Array.isArray(direct) && direct.length) return direct;

    const history = Array.isArray(WorldEngine.state?.history?.leagueAwards)
      ? WorldEngine.state.history.leagueAwards
      : [];
    return history[history.length - 1]?.winners || [];
  }

  function seasonLabel() {
    return String(
      WorldEngine.state?.season?.label ||
      WorldEngine.state?.season?.seasonLabel ||
      '2022–23'
    );
  }

  function championName() {
    const postseason = post();
    const id = postseason?.championTeamId || null;
    const team = (WorldEngine.state?.teams || []).find(item =>
      String(item?.teamId || '') === String(id || '')
    );
    return team
      ? `${team.schoolName || ''} ${team.teamName || team.name || ''}`.trim()
      : '—';
  }

  function archives() {
    WorldEngine.ensureHighSchoolSeasonArchive?.({ save: false });
    const records = WorldEngine.getHighSchoolSeasonArchives?.() ||
      WorldEngine.state?.history?.highSchoolSeasons ||
      [];
    return Array.isArray(records)
      ? records.slice().sort((a, b) => Number(a?.identity?.startYear || 0) - Number(b?.identity?.startYear || 0))
      : [];
  }

  function archiveLabel(record) {
    const identity = record?.identity || {};
    if (identity.label) return String(identity.label).replace(/-/g, '–');
    const startYear = Number(identity.startYear || 0);
    return startYear ? `${startYear}–${String(startYear + 1).slice(-2)}` : 'Completed Season';
  }

  function archiveSchoolYear(record) {
    return String(record?.identity?.schoolYear || 'High School');
  }

  function teamName(team) {
    if (!team) return '—';
    return `${team.schoolName || ''} ${team.teamName || team.name || ''}`.trim() || team.abbreviation || '—';
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CARD_ID}{margin:0 0 18px;color:#f5f8ff}
      .pi-lah-card-action{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 15px;border:1px solid rgba(101,164,255,.14);border-radius:17px;background:rgba(18,39,66,.48);color:inherit;text-align:left;font:inherit;box-shadow:none}.pi-lah-card-action:active{background:rgba(30,59,96,.58)}
      .pi-lah-card-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:rgba(72,132,214,.10);font-size:17px}.pi-lah-card-copy{min-width:0}.pi-lah-kicker{display:block;margin-bottom:3px;color:#7696bd;font-size:8px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.pi-lah-card-title{display:block;font-size:15px;font-weight:900;letter-spacing:-.015em}.pi-lah-card-sub{display:block;margin-top:3px;color:#71859f;font-size:10px;line-height:1.35}.pi-lah-chevron{color:#6f8fb8;font-size:24px;line-height:1;font-weight:500}
      #${SCREEN_ID},#${HISTORY_SCREEN_ID}{position:fixed;inset:0;z-index:100001;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 26px) 20px calc(env(safe-area-inset-bottom,0px) + 34px);background:radial-gradient(circle at 50% 5%,rgba(67,126,219,.28),transparent 31%),linear-gradient(180deg,#07172a,#04101e);color:#f5f8ff}.pi-lah-shell{max-width:650px;margin:0 auto}.pi-lah-back{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(120,164,218,.24);border-radius:14px;background:rgba(17,39,68,.72);color:#fff;font-size:25px}.pi-lah-title-wrap{text-align:center;margin:18px 0 22px}.pi-lah-title-wrap .pi-lah-kicker{margin-bottom:6px}.pi-lah-title{margin:0;font-size:34px;letter-spacing:-.04em}.pi-lah-sub{margin:7px 0 0;color:#8297b2;font-size:12px}.pi-lah-champion{margin-bottom:17px;padding:16px 17px;border:1px solid rgba(113,195,156,.17);border-radius:18px;background:rgba(35,121,76,.10)}.pi-lah-champion span{display:block;color:#73b795;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-lah-champion strong{display:block;margin-top:6px;font-size:19px}
      .pi-lah-list{display:grid;gap:10px}.pi-lah-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:15px 16px;border:1px solid rgba(255,255,255,.075);border-radius:16px;background:rgba(12,29,50,.76)}.pi-lah-row[data-player-id]{cursor:pointer}.pi-lah-award{display:block;color:#7f94ae;font-size:9px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.pi-lah-winner{display:block;margin-top:5px;font-size:15px;font-weight:900}.pi-lah-meta{display:block;margin-top:3px;color:#617691;font-size:10px}.pi-lah-scope{color:#8cb8f3;font-size:9px;font-weight:900;text-align:right;text-transform:uppercase}.pi-lah-continue{width:100%;margin-top:20px;padding:17px 18px;border:1px solid rgba(110,174,255,.30);border-radius:17px;background:linear-gradient(135deg,#2b67ce,#183d88);color:#fff;font:inherit;font-size:15px;font-weight:900}
      #league-history-preview.pi-lh-ready{min-height:0!important;border:0!important;background:transparent!important;padding:0!important}.pi-lh-preview-card{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:15px 16px;border:1px solid rgba(101,164,255,.15);border-radius:16px;background:rgba(15,34,58,.64);color:#f5f8ff;text-align:left;font:inherit}.pi-lh-preview-label{display:block;color:#7899c3;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.pi-lh-preview-title{display:block;margin-top:5px;font-size:15px;font-weight:900}.pi-lh-preview-meta{display:block;margin-top:4px;color:#71859f;font-size:10px}.pi-lh-empty{padding:16px;color:#71859f;font-size:11px;text-align:center}.pi-lh-season-list{display:grid;gap:11px}.pi-lh-season{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:17px;border:1px solid rgba(255,255,255,.08);border-radius:17px;background:rgba(12,29,50,.78);color:#fff;text-align:left;font:inherit}.pi-lh-season-year{display:block;color:#8eb9f1;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.pi-lh-season-title{display:block;margin-top:5px;font-size:17px;font-weight:900}.pi-lh-season-meta{display:block;margin-top:4px;color:#71859f;font-size:10px}.pi-lh-section-title{margin:22px 0 10px;color:#8aa5c8;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-lh-standings{display:grid;gap:7px}.pi-lh-standing{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border-radius:13px;background:rgba(12,29,50,.72);font-size:11px}.pi-lh-standing-rank{color:#7c95b4;font-weight:900}.pi-lh-standing-team{font-weight:800}.pi-lh-standing-record{color:#88a5c8;font-weight:800}.pi-lh-detail-actions{margin-top:20px}
    `;
    document.head.appendChild(style);
  }

  function findLeaguePanel() {
    return document.getElementById('hub-panel-league') ||
      document.getElementById('league-panel') ||
      document.getElementById('league-tab-panel') ||
      document.querySelector('[data-hub-panel="league"]') ||
      document.querySelector('[data-hub-tab-panel="league"]') ||
      document.querySelector('[data-panel="league"]') ||
      document.getElementById('pi-league-postseason-card')?.parentElement ||
      null;
  }

  function playerById(id) {
    if (!id) return null;
    return WorldEngine.getPlayerById?.(id) ||
      (WorldEngine.getAllWorldPlayers?.() || []).find(player =>
        String(player?.playerId || player?.id || '') === String(id)
      ) || null;
  }

  function openWinner(playerId) {
    const player = playerById(playerId);
    if (!player || typeof globalThis.openPlayerProfile !== 'function') return;
    document.getElementById(SCREEN_ID)?.remove();
    document.getElementById(HISTORY_SCREEN_ID)?.remove();
    globalThis.openPlayerProfile(player, 'hub');
  }

  function openScreen() {
    const winners = currentAwards();
    if (!winners.length) return false;

    injectStyles();
    document.getElementById(SCREEN_ID)?.remove();

    const root = document.createElement('section');
    root.id = SCREEN_ID;
    root.innerHTML = `
      <div class="pi-lah-shell">
        <button type="button" class="pi-lah-back" id="pi-lah-back" aria-label="Back to League">‹</button>
        <div class="pi-lah-title-wrap">
          <span class="pi-lah-kicker">Project Ice · League History</span>
          <h1 class="pi-lah-title">${esc(seasonLabel())} League Awards</h1>
          <p class="pi-lah-sub">The official award winners from the completed high school season.</p>
        </div>
        <div class="pi-lah-champion"><span>League Champion</span><strong>${esc(championName())}</strong></div>
        <div class="pi-lah-list">
          ${winners.map(item => `
            <div class="pi-lah-row"${item?.playerId ? ` data-player-id="${esc(item.playerId)}" role="button" tabindex="0"` : ''}>
              <div>
                <span class="pi-lah-award">${esc(item?.title || 'League Award')}</span>
                <strong class="pi-lah-winner">${esc(item?.playerName || '—')}</strong>
                <span class="pi-lah-meta">${esc([item?.team, item?.classLabel, item?.position].filter(Boolean).join(' · '))}</span>
              </div>
              <span class="pi-lah-scope">${item?.scope === 'playoffs' ? 'Playoffs' : 'Regular Season'}</span>
            </div>`).join('')}
        </div>
        <button type="button" class="pi-lah-continue" id="pi-lah-continue">Back to League</button>
      </div>`;

    root.addEventListener('click', event => {
      const row = event.target?.closest?.('.pi-lah-row[data-player-id]');
      if (row) {
        openWinner(row.dataset.playerId);
        return;
      }
      if (event.target?.closest?.('#pi-lah-back, #pi-lah-continue')) root.remove();
    });

    document.body.appendChild(root);
    return true;
  }

  function renderArchiveDetail(root, record) {
    const standings = Array.isArray(record?.finalStandings) ? record.finalStandings : [];
    const awards = Array.isArray(record?.leagueAwards) ? record.leagueAwards : [];
    root.innerHTML = `
      <div class="pi-lah-shell">
        <button type="button" class="pi-lah-back" data-history-back aria-label="Back to seasons">‹</button>
        <div class="pi-lah-title-wrap">
          <span class="pi-lah-kicker">Project Ice · League History</span>
          <h1 class="pi-lah-title">${esc(archiveLabel(record))}</h1>
          <p class="pi-lah-sub">${esc(archiveSchoolYear(record))} Season · Permanent Archive</p>
        </div>
        <div class="pi-lah-champion"><span>League Champion</span><strong>${esc(teamName(record?.champion))}</strong></div>
        <div class="pi-lh-section-title">Final Standings</div>
        <div class="pi-lh-standings">
          ${standings.map((row, index) => `
            <div class="pi-lh-standing">
              <span class="pi-lh-standing-rank">${index + 1}</span>
              <span class="pi-lh-standing-team">${esc(`${row?.schoolName || ''} ${row?.teamName || row?.name || ''}`.trim() || row?.abbreviation || '—')}</span>
              <span class="pi-lh-standing-record">${Number(row?.wins || 0)}-${Number(row?.losses || 0)}${Number(row?.overtimeLosses || 0) ? `-${Number(row.overtimeLosses)}` : ''}</span>
            </div>`).join('') || '<div class="pi-lh-empty">No archived standings.</div>'}
        </div>
        <div class="pi-lh-section-title">League Awards</div>
        <div class="pi-lah-list">
          ${awards.map(item => `
            <div class="pi-lah-row"${item?.playerId ? ` data-player-id="${esc(item.playerId)}" role="button" tabindex="0"` : ''}>
              <div>
                <span class="pi-lah-award">${esc(item?.title || 'League Award')}</span>
                <strong class="pi-lah-winner">${esc(item?.playerName || '—')}</strong>
                <span class="pi-lah-meta">${esc([item?.team, item?.classLabel, item?.position].filter(Boolean).join(' · '))}</span>
              </div>
              <span class="pi-lah-scope">${item?.scope === 'playoffs' ? 'Playoffs' : 'Regular Season'}</span>
            </div>`).join('') || '<div class="pi-lh-empty">No archived awards.</div>'}
        </div>
        <div class="pi-lh-detail-actions"><button type="button" class="pi-lah-continue" data-history-back>Back to Seasons</button></div>
      </div>`;
  }

  function renderArchiveList(root) {
    const records = archives();
    root.innerHTML = `
      <div class="pi-lah-shell">
        <button type="button" class="pi-lah-back" data-history-close aria-label="Back to League">‹</button>
        <div class="pi-lah-title-wrap">
          <span class="pi-lah-kicker">Project Ice · League History</span>
          <h1 class="pi-lah-title">League History</h1>
          <p class="pi-lah-sub">Every completed high school season is preserved here permanently.</p>
        </div>
        <div class="pi-lh-season-list">
          ${records.slice().reverse().map(record => `
            <button type="button" class="pi-lh-season" data-archive-id="${esc(record?.archiveId || record?.identity?.seasonId || '')}">
              <span>
                <span class="pi-lh-season-year">${esc(archiveLabel(record))}</span>
                <strong class="pi-lh-season-title">${esc(archiveSchoolYear(record))} Season</strong>
                <span class="pi-lh-season-meta">Champion · ${esc(teamName(record?.champion))}</span>
              </span>
              <span class="pi-lah-chevron">›</span>
            </button>`).join('') || '<div class="pi-lh-empty">No completed seasons have been archived yet.</div>'}
        </div>
        <button type="button" class="pi-lah-continue" data-history-close>Back to League</button>
      </div>`;
  }

  function openLeagueHistory(archiveId = null) {
    injectStyles();
    document.getElementById(HISTORY_SCREEN_ID)?.remove();
    const root = document.createElement('section');
    root.id = HISTORY_SCREEN_ID;

    const record = archiveId
      ? WorldEngine.getHighSchoolSeasonArchive?.(archiveId) || archives().find(item => String(item?.archiveId || '') === String(archiveId))
      : null;
    if (record) renderArchiveDetail(root, record);
    else renderArchiveList(root);

    root.addEventListener('click', event => {
      const playerRow = event.target?.closest?.('.pi-lah-row[data-player-id]');
      if (playerRow) {
        openWinner(playerRow.dataset.playerId);
        return;
      }
      const season = event.target?.closest?.('[data-archive-id]');
      if (season) {
        const selected = WorldEngine.getHighSchoolSeasonArchive?.(season.dataset.archiveId) ||
          archives().find(item => String(item?.archiveId || '') === String(season.dataset.archiveId));
        if (selected) renderArchiveDetail(root, selected);
        return;
      }
      if (event.target?.closest?.('[data-history-back]')) {
        renderArchiveList(root);
        return;
      }
      if (event.target?.closest?.('[data-history-close]')) root.remove();
    });

    document.body.appendChild(root);
    return true;
  }

  function renderLeagueHistoryPreview() {
    const preview = document.getElementById('league-history-preview');
    if (!preview) return false;
    injectStyles();
    preview.classList.add('pi-lh-ready');
    const records = archives();
    const latest = records[records.length - 1];
    if (!latest) {
      preview.innerHTML = '<div class="pi-lh-empty">No completed seasons have been archived yet.</div>';
      return false;
    }
    preview.innerHTML = `
      <button type="button" class="pi-lh-preview-card" data-archive-id="${esc(latest?.archiveId || latest?.identity?.seasonId || '')}">
        <span>
          <span class="pi-lh-preview-label">Latest Completed Season</span>
          <strong class="pi-lh-preview-title">${esc(archiveLabel(latest))} · ${esc(archiveSchoolYear(latest))}</strong>
          <span class="pi-lh-preview-meta">Champion · ${esc(teamName(latest?.champion))}</span>
        </span>
        <span class="pi-lah-chevron">›</span>
      </button>`;
    preview.querySelector('[data-archive-id]')?.addEventListener('click', event => {
      openLeagueHistory(event.currentTarget.dataset.archiveId);
    });
    return true;
  }

  function wireExploreButton() {
    const preview = document.getElementById('league-history-preview');
    const section = preview?.closest?.('.league-section') || preview?.parentElement;
    if (!section) return false;
    const buttons = [...section.querySelectorAll('button')];
    const explore = buttons.find(button => /explore/i.test(String(button.textContent || '')));
    if (!explore || explore.dataset.piLeagueHistoryWired === '1') return Boolean(explore);
    explore.dataset.piLeagueHistoryWired = '1';
    explore.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openLeagueHistory();
    });
    return true;
  }

  function renderLeagueCard() {
    const winners = currentAwards();
    const postseason = post();
    const existing = document.getElementById(CARD_ID);
    if (!winners.length || postseason?.awardsCeremonyAcknowledged !== true) {
      existing?.remove();
    } else {
      const panel = findLeaguePanel();
      if (panel) {
        const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;
        injectStyles();
        const root = existing || document.createElement('section');
        root.id = CARD_ID;
        root.innerHTML = `
          <button type="button" class="pi-lah-card-action" aria-label="View ${esc(seasonLabel())} League Awards">
            <span class="pi-lah-card-icon">🏆</span>
            <span class="pi-lah-card-copy">
              <span class="pi-lah-kicker">Season History</span>
              <span class="pi-lah-card-title">League Awards</span>
              <span class="pi-lah-card-sub">${esc(seasonLabel())} honors are permanently recorded</span>
            </span>
            <span class="pi-lah-chevron">›</span>
          </button>`;
        root.querySelector('.pi-lah-card-action')?.addEventListener('click', () => openScreen());

        const postseasonCard = document.getElementById('pi-league-postseason-card');
        if (postseasonCard?.parentElement === host) postseasonCard.insertAdjacentElement('afterend', root);
        else if (!root.isConnected) {
          const standings = [...host.children].find(child => /league standings/i.test(String(child.textContent || '')));
          if (standings) standings.insertAdjacentElement('beforebegin', root);
          else host.appendChild(root);
        }
      }
    }

    renderLeagueHistoryPreview();
    wireExploreButton();
    return true;
  }

  document.addEventListener('click', event => {
    const leagueButton = event.target?.closest?.('[data-tab="league"], [data-hub-tab="league"], #hub-tab-league, #btn-tab-league');
    if (leagueButton) requestAnimationFrame(renderLeagueCard);
  }, true);

  WorldEngine.openLeagueAwardsScreen = openScreen;
  WorldEngine.renderLeagueAwardsHistoryCard = renderLeagueCard;
  WorldEngine.openLeagueHistory = openLeagueHistory;
  WorldEngine.renderLeagueHistoryPreview = renderLeagueHistoryPreview;

  requestAnimationFrame(renderLeagueCard);
})();
