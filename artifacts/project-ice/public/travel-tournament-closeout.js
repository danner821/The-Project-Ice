'use strict';

/* global WorldEngine, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROOT_ID = 'pi-travel-tournament-closeout';
  const STYLE_ID = 'pi-travel-tournament-closeout-styles';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const travel = () =>
    WorldEngine.getTravelHockeyState?.() ||
    WorldEngine.state?.travelHockey ||
    null;

  const idOf = player => String(
    player?.playerId ||
    player?.sourcePlayerId ||
    player?.id ||
    ''
  );

  const playerName = player => String(
    player?.name ||
    player?.playerName ||
    [player?.firstName, player?.lastName].filter(Boolean).join(' ') ||
    'Unknown Player'
  );

  function teamById(state, teamId) {
    return (state?.teams || []).find(team =>
      String(team?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function allTravelPlayers(state) {
    const rows = [];
    for (const team of state?.teams || []) {
      for (const player of team?.roster || []) {
        rows.push({ player, team });
      }
    }
    return rows;
  }

  function mvpScore(entry) {
    const player = entry?.player || {};
    const stats = player.travelStats || {};
    const goalie = String(player.position || '').toUpperCase() === 'G';

    if (goalie) {
      const gp = Math.max(0, Number(stats.gp || 0));
      const wins = Math.max(0, Number(stats.wins || 0));
      const sv = Math.max(0, Number(stats.savePercentage || 0));
      const ga = Math.max(0, Number(stats.goalsAgainst || 0));
      const gaaProxy = gp > 0 ? ga / gp : 99;
      return wins * 5 + sv * 12 - gaaProxy;
    }

    return (
      Math.max(0, Number(stats.pts || 0)) * 3 +
      Math.max(0, Number(stats.g || 0)) * 1.5 +
      Math.max(0, Number(stats.sog || 0)) * 0.05
    );
  }

  function chooseMvp(state) {
    const tournament = state?.tournament;
    if (!tournament) return null;

    if (tournament.mvpPlayerId) {
      const saved = allTravelPlayers(state).find(entry =>
        idOf(entry.player) === String(tournament.mvpPlayerId)
      );
      if (saved) return saved;
    }

    const candidates = allTravelPlayers(state)
      .filter(entry => Number(entry?.player?.travelStats?.gp || 0) > 0)
      .map(entry => ({ ...entry, score: mvpScore(entry) }))
      .sort((a, b) =>
        b.score - a.score ||
        playerName(a.player).localeCompare(playerName(b.player))
      );

    const winner = candidates[0] || null;
    if (!winner) return null;

    tournament.mvpPlayerId = idOf(winner.player);
    tournament.mvpPlayerName = playerName(winner.player);
    tournament.mvpTeamId = winner.team?.teamId || null;
    tournament.mvpSelectedAt = String(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate ||
      new Date().toISOString().slice(0, 10)
    ).slice(0, 10);

    WorldEngine.save?.();
    return winner;
  }

  function mvpStatLine(entry) {
    if (!entry?.player) return 'Tournament standout';
    const player = entry.player;
    const stats = player.travelStats || {};
    const goalie = String(player.position || '').toUpperCase() === 'G';

    if (goalie) {
      const sv = Number(stats.savePercentage || 0);
      return `${Number(stats.wins || 0)} W · ${sv.toFixed(3).replace(/^0/, '')} SV%`;
    }

    return `${Number(stats.g || 0)} G · ${Number(stats.a || 0)} A · ${Number(stats.pts || 0)} PTS`;
  }

  function shouldShow() {
    const state = travel();
    return Boolean(
      state?.tournament?.status === 'complete' &&
      state?.tournament?.championTeamId &&
      state?.tournament?.closeoutAcknowledged !== true
    );
  }

  function postgameVisible() {
    const screen = document.getElementById('postgame-summary-screen');
    return Boolean(screen && !screen.classList.contains('screen--hidden'));
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100120;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 28px) 22px calc(env(safe-area-inset-bottom,0px) + 34px);background:radial-gradient(circle at 50% 10%,rgba(45,111,211,.34),transparent 34%),linear-gradient(180deg,#07182c 0%,#04101f 100%);color:#f5f8ff}
      .pi-travel-close-shell{max-width:620px;margin:0 auto}.pi-travel-close-trophy{width:82px;height:82px;margin:12px auto 18px;display:grid;place-items:center;border-radius:50%;font-size:40px;background:radial-gradient(circle,rgba(89,149,244,.28),rgba(40,81,145,.08));border:1px solid rgba(120,180,255,.22);box-shadow:0 0 50px rgba(69,132,227,.20)}
      .pi-travel-close-kicker{margin:18px 0 8px;color:#82b7ff;text-align:center;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.pi-travel-close-title{text-align:center;margin:0;font-size:35px;line-height:1;letter-spacing:-.045em}.pi-travel-close-sub{text-align:center;margin:10px 0 24px;color:#8fa4be;font-size:13px;line-height:1.5}
      .pi-travel-close-team{padding:20px;border:1px solid rgba(104,166,255,.22);border-radius:22px;background:linear-gradient(180deg,rgba(30,61,103,.78),rgba(12,29,51,.86));text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.22)}.pi-travel-close-team-label{color:#7592b7;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.pi-travel-close-team-name{margin:8px 0 2px;font-size:26px;font-weight:900;letter-spacing:-.03em}.pi-travel-close-team-meta{color:#89a0ba;font-size:12px}
      .pi-travel-close-mvp{margin-top:16px;padding:18px;border:1px solid rgba(111,174,255,.22);border-radius:20px;background:linear-gradient(135deg,rgba(49,98,170,.28),rgba(13,32,55,.82))}.pi-travel-close-mvp-label{color:#7f9cbe;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-travel-close-mvp-name{margin-top:8px;font-size:21px;font-weight:900}.pi-travel-close-mvp-team{margin-top:4px;color:#80a0c7;font-size:10px;font-weight:800}.pi-travel-close-mvp-stat{margin-top:7px;color:#9cb1ca;font-size:12px}
      .pi-travel-close-btn{width:100%;margin-top:18px;padding:18px 20px;border:1px solid rgba(105,167,255,.30);border-radius:19px;background:linear-gradient(135deg,#2763c9,#173b86);box-shadow:0 14px 30px rgba(20,78,177,.28);color:white;font:inherit;font-size:16px;font-weight:900;text-align:left}.pi-travel-close-btn span{float:right;color:#b9d3ff}.pi-travel-close-note{text-align:center;margin:13px 12px 0;color:#667e99;font-size:10px;line-height:1.4}
    `;
    document.head.appendChild(style);
  }

  function render() {
    if (!shouldShow() || postgameVisible()) return false;

    const state = travel();
    const champion = teamById(state, state.tournament.championTeamId);
    const mvp = chooseMvp(state);

    injectStyles();
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div class="pi-travel-close-shell">
        <div class="pi-travel-close-trophy">🏆</div>
        <div class="pi-travel-close-kicker">Project Ice · Summer Travel Hockey</div>
        <h1 class="pi-travel-close-title">Tournament Complete</h1>
        <p class="pi-travel-close-sub">The summer tournament is over. One club leaves as champion.</p>

        <div class="pi-travel-close-team">
          <div class="pi-travel-close-team-label">${esc(state.placementLevel || state.tournament.level || '')} Travel Champion</div>
          <div class="pi-travel-close-team-name">${esc(champion?.name || 'Travel Champion')}</div>
          <div class="pi-travel-close-team-meta">Best-of-three championship winner</div>
        </div>

        <div class="pi-travel-close-mvp">
          <div class="pi-travel-close-mvp-label">Tournament MVP</div>
          <div class="pi-travel-close-mvp-name">${esc(mvp ? playerName(mvp.player) : '—')}</div>
          <div class="pi-travel-close-mvp-team">${esc(mvp?.team?.name || '')}</div>
          <div class="pi-travel-close-mvp-stat">${esc(mvpStatLine(mvp))}</div>
        </div>

        <button type="button" class="pi-travel-close-btn" id="pi-travel-closeout-continue">Continue Into Offseason <span>›</span></button>
        <div class="pi-travel-close-note">Travel statistics remain separate from your high school regular-season and playoff history.</div>
      </div>`;

    root.querySelector('#pi-travel-closeout-continue')?.addEventListener('click', () => {
      const current = travel();
      if (!current?.tournament) return;

      current.tournament.closeoutAcknowledged = true;
      current.tournament.closeoutAcknowledgedAt = String(
        WorldEngine.state?.season?.currentDate ||
        WorldEngine.state?.player?.currentDate ||
        WorldEngine.state?.currentDate ||
        new Date().toISOString().slice(0, 10)
      ).slice(0, 10);
      current.status = 'completed';
      current.completed = true;

      if (WorldEngine.state?.season) {
        WorldEngine.state.season.phase = 'offseason';
      }

      WorldEngine.syncTravelTournamentCadence?.({ save:false });
      WorldEngine.save?.();
      root.remove();

      try { document.body.classList.remove('pi-travel-season-active'); } catch (_) {}
      try { document.getElementById('pi-travel-home-card')?.remove(); } catch (_) {}
      try { document.getElementById('pi-travel-league-card')?.remove(); } catch (_) {}
      try { document.getElementById('pi-travel-hockey-hub-canonical')?.remove(); } catch (_) {}

      if (typeof openHubTab === 'function') openHubTab('home');
      if (typeof refreshCareerUI === 'function') refreshCareerUI();
    });

    return true;
  }

  function installHooks() {
    const applyResult = WorldEngine.applyTravelTournamentGameResult;
    if (
      typeof applyResult === 'function' &&
      applyResult.__projectIceTravelCloseoutWrapped !== true
    ) {
      const wrapped = (...args) => {
        const result = applyResult.apply(WorldEngine, args);
        if (shouldShow()) {
          requestAnimationFrame(() => {
            if (!postgameVisible()) render();
          });
        }
        return result;
      };
      wrapped.__projectIceTravelCloseoutWrapped = true;
      wrapped.__projectIceTravelCloseoutOriginal = applyResult;
      WorldEngine.applyTravelTournamentGameResult = wrapped;
    }

    const simulateDay = WorldEngine.simulateNextTravelTournamentDay;
    if (
      typeof simulateDay === 'function' &&
      simulateDay.__projectIceTravelCloseoutWrapped !== true
    ) {
      const wrapped = (...args) => {
        const result = simulateDay.apply(WorldEngine, args);
        if (shouldShow()) requestAnimationFrame(render);
        return result;
      };
      wrapped.__projectIceTravelCloseoutWrapped = true;
      wrapped.__projectIceTravelCloseoutOriginal = simulateDay;
      WorldEngine.simulateNextTravelTournamentDay = wrapped;
    }
  }

  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#btn-postgame-continue')) return;
    if (!shouldShow()) return;
    setTimeout(render, 0);
  });

  WorldEngine.renderTravelTournamentCloseout = render;

  installHooks();

  const engineLoader = document.getElementById('pi-travel-tournament-engine-loader');
  if (engineLoader) {
    if (engineLoader.dataset.loaded === 'true') installHooks();
    else engineLoader.addEventListener('load', () => {
      installHooks();
      requestAnimationFrame(render);
    }, { once:true });
  }

  requestAnimationFrame(render);
})();
