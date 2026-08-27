'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const CARD_ID = 'pi-league-awards-card';
  const SCREEN_ID = 'pi-league-awards-screen';
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

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CARD_ID}{margin:24px 0 0;padding:18px;border:1px solid rgba(102,166,255,.20);border-radius:21px;background:linear-gradient(180deg,rgba(24,49,84,.72),rgba(9,24,43,.86));box-shadow:0 16px 36px rgba(0,0,0,.15);color:#f5f8ff}
      .pi-lah-card-head{display:flex;justify-content:space-between;gap:14px;align-items:center}.pi-lah-kicker{display:block;margin-bottom:4px;color:#7fb3fa;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.pi-lah-card-head h3{margin:0;font-size:20px;letter-spacing:-.025em}.pi-lah-card-sub{margin:9px 0 0;color:#8297b2;font-size:11px;line-height:1.45}.pi-lah-open{flex:0 0 auto;padding:9px 12px;border:1px solid rgba(105,171,255,.28);border-radius:999px;background:rgba(48,107,188,.12);color:#a9ceff;font:inherit;font-size:10px;font-weight:900}
      #${SCREEN_ID}{position:fixed;inset:0;z-index:100001;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 26px) 20px calc(env(safe-area-inset-bottom,0px) + 34px);background:radial-gradient(circle at 50% 5%,rgba(67,126,219,.28),transparent 31%),linear-gradient(180deg,#07172a,#04101e);color:#f5f8ff}.pi-lah-shell{max-width:650px;margin:0 auto}.pi-lah-back{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(120,164,218,.24);border-radius:14px;background:rgba(17,39,68,.72);color:#fff;font-size:25px}.pi-lah-title-wrap{text-align:center;margin:18px 0 22px}.pi-lah-title-wrap .pi-lah-kicker{margin-bottom:6px}.pi-lah-title{margin:0;font-size:34px;letter-spacing:-.04em}.pi-lah-sub{margin:7px 0 0;color:#8297b2;font-size:12px}.pi-lah-champion{margin-bottom:17px;padding:16px 17px;border:1px solid rgba(113,195,156,.17);border-radius:18px;background:rgba(35,121,76,.10)}.pi-lah-champion span{display:block;color:#73b795;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-lah-champion strong{display:block;margin-top:6px;font-size:19px}
      .pi-lah-list{display:grid;gap:10px}.pi-lah-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:15px 16px;border:1px solid rgba(255,255,255,.075);border-radius:16px;background:rgba(12,29,50,.76)}.pi-lah-row[data-player-id]{cursor:pointer}.pi-lah-award{display:block;color:#7f94ae;font-size:9px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.pi-lah-winner{display:block;margin-top:5px;font-size:15px;font-weight:900}.pi-lah-meta{display:block;margin-top:3px;color:#617691;font-size:10px}.pi-lah-scope{color:#8cb8f3;font-size:9px;font-weight:900;text-align:right;text-transform:uppercase}.pi-lah-continue{width:100%;margin-top:20px;padding:17px 18px;border:1px solid rgba(110,174,255,.30);border-radius:17px;background:linear-gradient(135deg,#2b67ce,#183d88);color:#fff;font:inherit;font-size:15px;font-weight:900}
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
      if (event.target?.closest?.('#pi-lah-back, #pi-lah-continue')) {
        root.remove();
      }
    });

    document.body.appendChild(root);
    return true;
  }

  function renderLeagueCard() {
    const winners = currentAwards();
    const postseason = post();
    const existing = document.getElementById(CARD_ID);
    if (!winners.length || postseason?.awardsCeremonyAcknowledged !== true) {
      existing?.remove();
      return false;
    }

    const panel = findLeaguePanel();
    if (!panel) return false;
    const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;

    injectStyles();
    const root = existing || document.createElement('section');
    root.id = CARD_ID;
    root.innerHTML = `
      <div class="pi-lah-card-head">
        <div><span class="pi-lah-kicker">Season History</span><h3>League Awards</h3></div>
        <button type="button" class="pi-lah-open">View Awards</button>
      </div>
      <p class="pi-lah-card-sub">${esc(seasonLabel())} honors are final and permanently recorded.</p>`;
    root.querySelector('.pi-lah-open')?.addEventListener('click', () => openScreen());

    if (!root.isConnected) {
      const leaders = document.getElementById('pi-playoff-leaders-card');
      if (leaders?.parentElement === host) leaders.insertAdjacentElement('afterend', root);
      else host.prepend(root);
    }
    return true;
  }

  document.addEventListener('click', event => {
    const leagueButton = event.target?.closest?.('[data-tab="league"], [data-hub-tab="league"], #hub-tab-league, #btn-tab-league');
    if (leagueButton) requestAnimationFrame(renderLeagueCard);
  }, true);

  WorldEngine.openLeagueAwardsScreen = openScreen;
  WorldEngine.renderLeagueAwardsHistoryCard = renderLeagueCard;

  requestAnimationFrame(renderLeagueCard);
})();
