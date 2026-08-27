'use strict';

/* global WorldEngine, openHubTab, openTeamProfile */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const ROOT_ID = 'pi-league-postseason-card';
  const STYLE_ID = 'pi-league-postseason-styles';

  const postseason = () =>
    WorldEngine.getHighSchoolPostseason?.() ||
    WorldEngine.state?.postseason?.highSchool ||
    null;

  const teams = () => WorldEngine.state?.teams || [];

  function teamById(teamId) {
    return teams().find(team => String(team?.teamId || '') === String(teamId || '')) || null;
  }

  function teamName(teamId) {
    const team = teamById(teamId);
    if (!team) return 'TBD';
    return `${team.schoolName || ''} ${team.teamName || team.name || ''}`.trim() || 'Team';
  }

  function careerTeamId() {
    const world = WorldEngine.state || {};
    const player = world.player || {};
    const direct = player.teamId || player.highSchoolTeamId || null;
    const canonicalId = player.playerId || player.id || 'career-player';

    for (const team of world.teams || []) {
      const found = (team?.roster || []).some(skater => {
        const id = skater?.playerId || skater?.id || null;
        return skater?.isCareerPlayer === true ||
          String(id || '') === 'career-player' ||
          String(id || '') === String(canonicalId || '');
      });
      if (found) return team.teamId || direct;
    }

    return direct;
  }

  const isCareerTeam = teamId =>
    String(teamId || '') === String(careerTeamId() || '');

  function seedFor(post, teamId) {
    return (post?.frozenStandings || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    )?.seed || null;
  }

  function winsFor(series, teamId) {
    return Number(series?.wins?.[teamId]) || 0;
  }

  function seriesWinner(series) {
    return series?.winnerTeamId || series?.winnerId || null;
  }

  function roundSeries(post, key) {
    const rounds = post?.bracket?.rounds || {};
    if (key === 'roundOne') return rounds.roundOne || [];
    if (key === 'semifinals') return rounds.semifinals || [];
    if (key === 'championship') return rounds.championship || [];
    return [];
  }

  function teamRow(post, series, teamId, fallbackLabel = 'TBD') {
    const known = Boolean(teamId);
    const career = known && isCareerTeam(teamId);
    const seed = known ? seedFor(post, teamId) : null;
    const wins = known ? winsFor(series, teamId) : null;
    const winner = known && String(seriesWinner(series) || '') === String(teamId || '');

    return `
      <div class="pi-lpo-team${known ? ' pi-lpo-team--clickable' : ''}${career ? ' pi-lpo-team--career' : ''}${winner ? ' pi-lpo-team--winner' : ''}"${known ? ` data-team-id="${String(teamId)}" role="button" tabindex="0" aria-label="Open ${teamName(teamId)} team profile"` : ''}>
        <span class="pi-lpo-seed">${seed ? `#${seed}` : '—'}</span>
        <span class="pi-lpo-team-name">${known ? teamName(teamId) : fallbackLabel}${career ? '<em>YOU</em>' : ''}</span>
        <span class="pi-lpo-wins">${known ? wins : '—'}${winner ? '<b>✓</b>' : ''}</span>
      </div>`;
  }

  function seriesCard(post, series, fallbackTop = 'TBD', fallbackBottom = 'TBD') {
    if (!series) {
      return `
        <div class="pi-lpo-series pi-lpo-series--pending">
          ${teamRow(post, null, null, fallbackTop)}
          ${teamRow(post, null, null, fallbackBottom)}
        </div>`;
    }

    const highId = series.higherSeedTeamId || series.homeTeamId || null;
    const lowId = series.lowerSeedTeamId || series.awayTeamId || null;
    return `
      <div class="pi-lpo-series${series?.completed ? ' pi-lpo-series--complete' : ''}">
        ${teamRow(post, series, highId)}
        ${teamRow(post, series, lowId)}
      </div>`;
  }

  function statusLabel(post) {
    if (post?.status === 'complete' || post?.championTeamId) return 'Postseason Complete';
    if (roundSeries(post, 'championship').length) return 'Championship';
    if (roundSeries(post, 'semifinals').length) return 'Semifinals';
    return 'Round One';
  }

  function careerStatus(post) {
    const id = careerTeamId();
    const seed = seedFor(post, id);
    if (!seed) return 'Your team did not qualify. The bracket continues around you.';
    if (String(post?.championTeamId || '') === String(id || '')) return 'Your team won the high school championship.';

    const allSeries = [
      ...roundSeries(post, 'roundOne'),
      ...roundSeries(post, 'semifinals'),
      ...roundSeries(post, 'championship'),
    ];
    const eliminated = allSeries.some(series =>
      series?.completed &&
      [series?.higherSeedTeamId, series?.lowerSeedTeamId].some(teamId => String(teamId || '') === String(id || '')) &&
      String(seriesWinner(series) || '') !== String(id || '')
    );

    if (eliminated) return `Your #${seed} seed run is over. Follow the rest of the postseason here.`;
    return `Your team entered as the #${seed} seed${Number(seed) <= 2 ? ' with a first-round bye' : ''}.`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{margin:0 0 18px;border:1px solid rgba(101,164,255,.18);border-radius:22px;background:linear-gradient(180deg,rgba(27,52,86,.58),rgba(10,22,38,.82));box-shadow:0 18px 42px rgba(0,0,0,.22);overflow:hidden;color:#f5f8ff}
      .pi-lpo-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:17px 17px 13px;border-bottom:1px solid rgba(255,255,255,.07)}
      .pi-lpo-eyebrow{margin:0 0 5px;color:#82b6ff;font-size:9px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.pi-lpo-head h3{margin:0;font-size:20px;letter-spacing:-.025em}.pi-lpo-badge{flex:0 0 auto;border-radius:999px;padding:6px 9px;border:1px solid rgba(116,180,255,.18);background:rgba(55,121,205,.11);color:#9dc8ff;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .pi-lpo-sub{padding:10px 17px 0;color:#8fa0b5;font-size:11px;line-height:1.45}.pi-lpo-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:14px 17px 15px}.pi-lpo-grid{min-width:690px;display:grid;grid-template-columns:205px 38px 205px 38px 205px;align-items:center}.pi-lpo-col{display:grid;gap:12px}.pi-lpo-col-title{margin-bottom:1px;color:#7589a4;font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.pi-lpo-series{overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.085);background:rgba(255,255,255,.035);box-shadow:0 8px 22px rgba(0,0,0,.14)}.pi-lpo-series--pending{opacity:.72}.pi-lpo-team{display:grid;grid-template-columns:29px minmax(0,1fr) 30px;align-items:center;gap:7px;min-height:43px;padding:0 10px}.pi-lpo-team+.pi-lpo-team{border-top:1px solid rgba(255,255,255,.06)}.pi-lpo-team--clickable{cursor:pointer;transition:background .15s ease,filter .15s ease}.pi-lpo-team--clickable:active{filter:brightness(1.2)}.pi-lpo-team--clickable:focus-visible{outline:2px solid rgba(95,160,255,.7);outline-offset:-2px}.pi-lpo-seed{color:#75aef8;font-size:10px;font-weight:900}.pi-lpo-team-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:760}.pi-lpo-team-name em{margin-left:5px;color:#86baff;font-size:8px;font-style:normal;font-weight:900;letter-spacing:.08em}.pi-lpo-wins{display:flex;align-items:center;justify-content:flex-end;gap:4px;color:#cad4e2;font-size:12px;font-weight:900}.pi-lpo-wins b{color:#78d4a6}.pi-lpo-team--career{background:linear-gradient(90deg,rgba(41,112,211,.27),rgba(41,112,211,.07));box-shadow:inset 3px 0 0 #5fa0ff}.pi-lpo-team--winner .pi-lpo-team-name{color:#fff}.pi-lpo-link{height:100%;min-height:104px;position:relative}.pi-lpo-link::before{content:'';position:absolute;left:4px;right:4px;top:50%;height:1px;background:rgba(116,153,205,.28)}.pi-lpo-reseed{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;padding:4px 5px;border-radius:6px;background:#111d2c;border:1px solid rgba(255,255,255,.06);color:#63758d;font-size:7px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pi-lpo-champion{margin:0 17px 14px;padding:11px 12px;border-radius:14px;border:1px solid rgba(111,205,157,.18);background:rgba(43,134,87,.10);color:#a8e6c7;font-size:11px;line-height:1.45}.pi-lpo-status{margin:0 17px 17px;padding:11px 12px;border-radius:14px;border:1px solid rgba(101,164,255,.12);background:rgba(48,103,176,.08);color:#a9c9f7;font-size:11px;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

  function findLeaguePanel() {
    const direct =
      document.getElementById('hub-panel-league') ||
      document.getElementById('league-panel') ||
      document.getElementById('league-tab-panel') ||
      document.querySelector('[data-hub-panel="league"]') ||
      document.querySelector('[data-hub-tab-panel="league"]') ||
      document.querySelector('[data-panel="league"]');
    if (direct) return direct;

    const hub = document.getElementById('hub-screen');
    if (!hub) return null;
    const candidates = [...hub.querySelectorAll('section,div')].filter(node => {
      const text = String(node.textContent || '');
      return text.includes('League Leaders') && text.includes('Standings');
    });
    return candidates.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0] || null;
  }

  function insertionHost(panel) {
    return panel?.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;
  }

  function openBracketTeam(teamId) {
    if (!teamId) return;
    if (typeof globalThis.openTeamProfile === 'function') {
      globalThis.openTeamProfile(teamId, 'hub');
    }
  }

  function bindNavigation(root) {
    if (!root || root.dataset.piTeamNavigationBound === 'true') return;
    root.dataset.piTeamNavigationBound = 'true';
    const activate = target => {
      const row = target?.closest?.('.pi-lpo-team[data-team-id]');
      if (!row) return;
      openBracketTeam(row.dataset.teamId);
    };
    root.addEventListener('click', event => activate(event.target));
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target?.closest?.('.pi-lpo-team[data-team-id]');
      if (!row) return;
      event.preventDefault();
      activate(row);
    });
  }

  function renderLeaguePostseason() {
    const post = postseason();
    const existing = document.getElementById(ROOT_ID);
    if (!post?.initialized || !post?.checkpointAcknowledged) {
      existing?.remove();
      return false;
    }

    const panel = findLeaguePanel();
    if (!panel) return false;
    const host = insertionHost(panel);
    if (!host) return false;

    injectStyles();
    const root = existing || document.createElement('section');
    root.id = ROOT_ID;

    const roundOne = roundSeries(post, 'roundOne');
    const semis = roundSeries(post, 'semifinals');
    const championship = roundSeries(post, 'championship');
    const seed1 = (post.frozenStandings || []).find(row => Number(row.seed) === 1);
    const seed2 = (post.frozenStandings || []).find(row => Number(row.seed) === 2);

    const semiOne = semis[0]
      ? seriesCard(post, semis[0])
      : `<div class="pi-lpo-series">${teamRow(post, null, seed1?.teamId, 'Seed #1')} ${teamRow(post, null, null, 'Lowest remaining seed')}</div>`;
    const semiTwo = semis[1]
      ? seriesCard(post, semis[1])
      : `<div class="pi-lpo-series">${teamRow(post, null, seed2?.teamId, 'Seed #2')} ${teamRow(post, null, null, 'Other remaining seed')}</div>`;

    root.innerHTML = `
      <div class="pi-lpo-head">
        <div><p class="pi-lpo-eyebrow">High School Postseason</p><h3>Playoff Bracket</h3></div>
        <span class="pi-lpo-badge">${statusLabel(post)}</span>
      </div>
      <div class="pi-lpo-sub">Live best-of-three series · regular-season seeds stay frozen throughout the postseason.</div>
      <div class="pi-lpo-scroll">
        <div class="pi-lpo-grid">
          <div class="pi-lpo-col"><div class="pi-lpo-col-title">Round One</div>${seriesCard(post, roundOne[0], 'Seed #3', 'Seed #6')}${seriesCard(post, roundOne[1], 'Seed #4', 'Seed #5')}</div>
          <div class="pi-lpo-link"><span class="pi-lpo-reseed">Reseed</span></div>
          <div class="pi-lpo-col"><div class="pi-lpo-col-title">Semifinals</div>${semiOne}${semiTwo}</div>
          <div class="pi-lpo-link"></div>
          <div class="pi-lpo-col"><div class="pi-lpo-col-title">Championship</div>${seriesCard(post, championship[0], 'Semifinal Winner', 'Semifinal Winner')}</div>
        </div>
      </div>
      ${post?.championTeamId ? `<div class="pi-lpo-champion"><strong>Champion:</strong> ${teamName(post.championTeamId)}</div>` : ''}
      <div class="pi-lpo-status">${careerStatus(post)}</div>`;

    bindNavigation(root);

    if (root.parentElement !== host) {
      const firstSection = [...host.children].find(child =>
        child !== root && /standings|league leaders|award races/i.test(String(child.textContent || ''))
      );
      if (firstSection) host.insertBefore(root, firstSection);
      else host.prepend(root);
    }

    return true;
  }

  if (typeof openHubTab === 'function') {
    const originalOpenHubTab = openHubTab;
    openHubTab = function(tabName, ...args) {
      const result = originalOpenHubTab.call(this, tabName, ...args);
      if (String(tabName || '').toLowerCase() === 'league') {
        window.requestAnimationFrame(renderLeaguePostseason);
      }
      return result;
    };
  }

  if (typeof WorldEngine.reconcileHighSchoolPostseason === 'function') {
    const originalReconcile = WorldEngine.reconcileHighSchoolPostseason.bind(WorldEngine);
    WorldEngine.reconcileHighSchoolPostseason = (...args) => {
      const result = originalReconcile(...args);
      const root = document.getElementById(ROOT_ID);
      if (root?.isConnected) window.requestAnimationFrame(renderLeaguePostseason);
      return result;
    };
  }

  WorldEngine.renderLeaguePostseason = renderLeaguePostseason;
})();
