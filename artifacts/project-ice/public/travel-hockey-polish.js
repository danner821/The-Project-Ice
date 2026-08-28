'use strict';

/* global WorldEngine, openHubTab */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HUB_ID = 'pi-travel-hockey-hub';
  const TEAM_ID = 'pi-travel-team-profile';
  const STYLE_ID = 'pi-travel-hockey-polish-styles';
  const HOME_ENTRY = 'pi-travel-home-card';
  const LEAGUE_ENTRY = 'pi-travel-league-card';
  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function state() {
    return WorldEngine.ensureTravelHockeyWorld?.({ save: false }) ||
      WorldEngine.getTravelHockeyState?.() ||
      WorldEngine.state?.travelHockey || null;
  }

  function canonicalPlayer() {
    return WorldEngine.state?.player || {};
  }

  function canonicalName() {
    const p = canonicalPlayer();
    return String(p.name || p.playerName || [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || 'Career Player');
  }

  function normalizeWorld(save = false) {
    const travel = state();
    if (!travel?.teams?.length) return travel;
    const careerName = canonicalName();
    const careerId = String(canonicalPlayer()?.playerId || canonicalPlayer()?.id || 'career-player');

    travel.teams.forEach(team => {
      const seen = new Set();
      team.roster = (team.roster || []).filter(player => {
        const id = String(player?.playerId || player?.sourcePlayerId || player?.id || '');
        const name = String(player?.name || '').trim().toLowerCase();
        const key = id || `name:${name}`;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        if (player?.isCareerPlayer === true || id === careerId || id === 'career-player') {
          player.isCareerPlayer = true;
          player.name = careerName;
          player.firstName = canonicalPlayer()?.firstName || player.firstName || null;
          player.lastName = canonicalPlayer()?.lastName || player.lastName || null;
          player.sourcePlayerId = careerId;
        }
        if (!player.travelStats) player.travelStats = { gp: 0, g: 0, a: 0, pts: 0, pim: 0, sog: 0 };
        return true;
      });
      if (!team.travelStats) team.travelStats = { gp: 0, w: 0, l: 0, gf: 0, ga: 0 };
    });

    if (save) WorldEngine.save?.();
    return travel;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${HUB_ID},#${TEAM_ID}{position:fixed;inset:0;z-index:100070;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 18px calc(env(safe-area-inset-bottom,0px) + 30px);background:radial-gradient(circle at 50% 0%,rgba(48,107,201,.34),transparent 32%),linear-gradient(180deg,#061628,#030d18);color:#f6f9ff}
      .pth-shell{max-width:650px;margin:0 auto}.pth-back{width:42px;height:42px;border-radius:14px;border:1px solid rgba(118,166,229,.23);background:rgba(17,40,70,.72);color:#fff;font-size:25px}.pth-kicker{margin-top:17px;color:#7aaff6;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pth-title{margin:7px 0 5px;font-size:31px;letter-spacing:-.04em}.pth-sub{margin:0;color:#8499b4;font-size:11px;line-height:1.5}.pth-section{margin-top:22px}.pth-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:9px}.pth-head h3{margin:0;font-size:18px}.pth-head span{color:#6f86a4;font-size:9px;text-transform:uppercase;font-weight:900}.pth-your,.pth-team-card,.pth-series,.pth-leader,.pth-roster-row{border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03)}
      .pth-your{margin-top:17px;padding:17px;border-radius:20px;border-color:rgba(104,170,251,.22);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.82));cursor:pointer}.pth-your small{color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pth-your h2{margin:7px 0 3px;font-size:22px}.pth-your p{margin:0;color:#8298b2;font-size:10px}.pth-your b{float:right;color:#8fc1ff;font-size:18px}
      .pth-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pth-team-card{padding:13px;border-radius:15px;cursor:pointer}.pth-team-card.you{border-color:rgba(95,166,255,.38);background:rgba(45,105,190,.14)}.pth-team-card strong{display:block;font-size:12px;line-height:1.25}.pth-team-card span{display:block;margin-top:4px;color:#7186a1;font-size:9px}.pth-team-card em{display:block;margin-top:7px;color:#9cb9db;font-size:9px;font-style:normal;font-weight:800}.pth-team-card:active,.pth-your:active,.pth-series:active,.pth-leader:active,.pth-roster-row:active{filter:brightness(1.18)}
      .pth-bracket{display:grid;gap:8px}.pth-series{padding:12px 13px;border-radius:14px}.pth-series small{display:block;color:#6e87a5;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.pth-series div{display:flex;justify-content:space-between;gap:10px;margin-top:7px;font-size:11px;font-weight:800}.pth-series button{all:unset;cursor:pointer;min-width:0}.pth-series .record{color:#7e96b2;font-weight:700}.pth-empty{padding:14px;border-radius:14px;border:1px dashed rgba(112,166,236,.22);color:#8297b0;font-size:10px;line-height:1.5}.pth-leaders{display:grid;gap:7px}.pth-leader{display:grid;grid-template-columns:28px 1fr 50px;gap:9px;align-items:center;padding:11px 12px;border-radius:13px;cursor:pointer}.pth-leader .rank{color:#6d87a6;font-size:9px;font-weight:900}.pth-leader .name{font-size:11px;font-weight:850}.pth-leader .name small{display:block;margin-top:2px;color:#6c839f;font-size:8px}.pth-leader .value{text-align:right;font-size:13px;font-weight:950}.pth-leader .value small{display:block;color:#6f86a4;font-size:7px}.pth-profile-card{margin-top:17px;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.2);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.82))}.pth-profile-card h2{margin:0;font-size:25px}.pth-profile-card p{margin:5px 0 0;color:#8298b2;font-size:10px}.pth-profile-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.pth-profile-meta div{padding:11px;border-radius:13px;background:rgba(255,255,255,.035);text-align:center}.pth-profile-meta span{display:block;color:#7187a3;font-size:7px;font-weight:900;text-transform:uppercase}.pth-profile-meta strong{display:block;margin-top:5px;font-size:14px}.pth-roster{display:grid;gap:6px}.pth-roster-row{display:grid;grid-template-columns:34px 1fr 40px;gap:8px;align-items:center;padding:10px 12px;border-radius:13px;cursor:pointer}.pth-roster-row.you{border-color:rgba(91,159,244,.28);background:rgba(48,111,199,.16)}.pth-roster-row .pos{color:#79adf5;font-size:9px;font-weight:900}.pth-roster-row .name{font-size:11px;font-weight:850}.pth-roster-row .name small{display:block;margin-top:2px;color:#657b96;font-size:8px}.pth-roster-row .ovr{text-align:right;font-size:11px;font-weight:900}
      .pi-travel-entry{cursor:pointer}
    `;
    document.head.appendChild(style);
  }

  function teamRecord(team) {
    const s = team?.travelStats || {};
    return `${Number(s.w || 0)}-${Number(s.l || 0)}`;
  }

  function quarterfinals(travel) {
    const existing = travel?.tournament?.rounds?.quarterfinals;
    if (Array.isArray(existing) && existing.length) return existing;
    const teams = [...(travel?.teams || [])].sort((a,b) => Number(a.seed || 99) - Number(b.seed || 99));
    const pairs = [[0,7],[3,4],[1,6],[2,5]];
    return pairs.map((pair, index) => ({
      seriesId: `travel-qf-${index + 1}`,
      round: 'Quarterfinal',
      teamAId: teams[pair[0]]?.teamId,
      teamBId: teams[pair[1]]?.teamId,
      teamAWins: 0,
      teamBWins: 0,
      status: 'scheduled',
    }));
  }

  function teamById(travel, id) {
    return (travel?.teams || []).find(team => String(team.teamId) === String(id)) || null;
  }

  function renderBracket(travel) {
    const rounds = travel?.tournament?.rounds || {};
    const sections = [
      ['Quarterfinals', Array.isArray(rounds.quarterfinals) && rounds.quarterfinals.length ? rounds.quarterfinals : quarterfinals(travel)],
      ['Semifinals', rounds.semifinals || []],
      ['Championship', rounds.championship || []],
    ];
    return sections.map(([label, series]) => `
      <div class="pth-section"><div class="pth-head"><h3>${label}</h3><span>Best of 3</span></div>
      <div class="pth-bracket">${series.length ? series.map((s, i) => {
        const a = teamById(travel, s.teamAId);
        const b = teamById(travel, s.teamBId);
        return `<div class="pth-series"><small>Series ${i + 1}</small>
          <div><button data-travel-team="${esc(a?.teamId || '')}">${esc(a?.name || 'TBD')}</button><span class="record">${Number(s.teamAWins || 0)}</span></div>
          <div><button data-travel-team="${esc(b?.teamId || '')}">${esc(b?.name || 'TBD')}</button><span class="record">${Number(s.teamBWins || 0)}</span></div>
        </div>`;
      }).join('') : '<div class="pth-empty">This round will populate when the previous round is decided.</div>'}</div></div>`;
    }).join('');
  }

  function leaderData(travel) {
    const players = (travel?.teams || []).flatMap(team => (team.roster || []).map(player => ({ player, team })));
    const played = players.filter(({player}) => Number(player?.travelStats?.gp || 0) > 0);
    if (!played.length) return [];
    return played.sort((a,b) =>
      Number(b.player?.travelStats?.pts || 0) - Number(a.player?.travelStats?.pts || 0) ||
      Number(b.player?.travelStats?.g || 0) - Number(a.player?.travelStats?.g || 0) ||
      Number(b.player?.overall || 0) - Number(a.player?.overall || 0)
    ).slice(0,5);
  }

  function renderLeaders(travel) {
    const leaders = leaderData(travel);
    return `<div class="pth-section"><div class="pth-head"><h3>Travel Stat Leaders</h3><span>PTS</span></div>
      ${leaders.length ? `<div class="pth-leaders">${leaders.map((entry,index) => `<div class="pth-leader" data-travel-player="${esc(entry.player.playerId || entry.player.sourcePlayerId || '')}" data-travel-team="${esc(entry.team.teamId)}"><span class="rank">${index+1}</span><span class="name">${esc(entry.player.name)}<small>${esc(entry.team.shortName || entry.team.name)}</small></span><span class="value">${Number(entry.player.travelStats?.pts || 0)}<small>PTS</small></span></div>`).join('')}</div>` : '<div class="pth-empty">Travel leaders will populate as tournament games are played.</div>'}
    </div>`;
  }

  function openPlayerFromTravel(teamId, id) {
    const travel = normalizeWorld(false);
    const team = teamById(travel, teamId);
    const player = (team?.roster || []).find(p => String(p.playerId || p.sourcePlayerId || '') === String(id || '')) || null;
    if (!player || typeof globalThis.openPlayerProfile !== 'function') return;
    const source = player.sourcePlayerId ? WorldEngine.getPlayerById?.(player.sourcePlayerId) : null;
    globalThis.openPlayerProfile(source || player, 'hub');
  }

  function openTeamProfile(teamId) {
    const travel = normalizeWorld(true);
    const team = teamById(travel, teamId);
    if (!team) return false;
    injectStyles();
    document.getElementById(TEAM_ID)?.remove();
    const root = document.createElement('section');
    root.id = TEAM_ID;
    const roster = [...(team.roster || [])].sort((a,b) => (a.position === 'G') - (b.position === 'G') || Number(b.overall || 0) - Number(a.overall || 0));
    root.innerHTML = `<div class="pth-shell">
      <button class="pth-back" type="button" aria-label="Back">‹</button>
      <div class="pth-kicker">Summer Travel Hockey · ${esc(travel.placementLevel)}</div>
      <h1 class="pth-title">Team Profile</h1>
      <div class="pth-profile-card"><h2>${esc(team.name)}</h2><p>${esc(team.city)} · ${esc(travel.placementLevel)} Travel Hockey</p>
        <div class="pth-profile-meta"><div><span>Record</span><strong>${teamRecord(team)}</strong></div><div><span>GF</span><strong>${Number(team.travelStats?.gf || 0)}</strong></div><div><span>GA</span><strong>${Number(team.travelStats?.ga || 0)}</strong></div></div>
      </div>
      <div class="pth-section"><div class="pth-head"><h3>Roster</h3><span>${roster.length} Players</span></div><div class="pth-roster">${roster.map(p => `<div class="pth-roster-row${p.isCareerPlayer ? ' you' : ''}" data-player-id="${esc(p.playerId || p.sourcePlayerId || '')}"><span class="pos">${esc(p.position)}</span><span class="name">${esc(p.name)}${p.isCareerPlayer ? '<small>YOU</small>' : p.isRealProspect ? '<small>PROSPECT</small>' : ''}</span><span class="ovr">${esc(p.overall)}</span></div>`).join('')}</div></div>
    </div>`;
    root.querySelector('.pth-back')?.addEventListener('click', () => root.remove());
    root.querySelectorAll('[data-player-id]').forEach(row => row.addEventListener('click', () => openPlayerFromTravel(team.teamId, row.dataset.playerId)));
    document.body.appendChild(root);
    return true;
  }

  function openHub() {
    const travel = normalizeWorld(true);
    if (!travel?.teams?.length) return false;
    injectStyles();
    document.getElementById(HUB_ID)?.remove();
    const yourTeam = teamById(travel, travel.playerTeamId) || travel.teams[0];
    const root = document.createElement('section');
    root.id = HUB_ID;
    root.innerHTML = `<div class="pth-shell">
      <button class="pth-back" type="button" aria-label="Back">‹</button>
      <div class="pth-kicker">Summer Travel Hockey · ${esc(travel.placementLevel)}</div>
      <h1 class="pth-title">Travel Hockey Hub</h1>
      <p class="pth-sub">Your summer world is separate from high school. Only the ${esc(travel.placementLevel)} level you earned exists in this travel season.</p>
      <div class="pth-your" data-travel-team="${esc(yourTeam.teamId)}"><b>›</b><small>Your Team</small><h2>${esc(yourTeam.name)}</h2><p>${esc(yourTeam.city)} · ${teamRecord(yourTeam)}</p></div>
      <div class="pth-section"><div class="pth-head"><h3>Travel Field</h3><span>8 Teams</span></div><div class="pth-grid">${travel.teams.map(team => `<div class="pth-team-card${team.teamId === travel.playerTeamId ? ' you' : ''}" data-travel-team="${esc(team.teamId)}"><strong>${esc(team.name)}</strong><span>${esc(team.city)}${team.teamId === travel.playerTeamId ? ' · YOU' : ''}</span><em>${teamRecord(team)}</em></div>`).join('')}</div></div>
      ${renderBracket(travel)}
      ${renderLeaders(travel)}
    </div>`;
    root.querySelector('.pth-back')?.addEventListener('click', () => root.remove());
    root.addEventListener('click', event => {
      const teamTarget = event.target?.closest?.('[data-travel-team]');
      const playerTarget = event.target?.closest?.('[data-travel-player]');
      if (playerTarget) {
        openPlayerFromTravel(playerTarget.dataset.travelTeam, playerTarget.dataset.travelPlayer);
        return;
      }
      if (teamTarget?.dataset.travelTeam) openTeamProfile(teamTarget.dataset.travelTeam);
    });
    document.body.appendChild(root);
    return true;
  }

  function homePanel() {
    return document.getElementById('hub-panel-home') || document.getElementById('hub-tab-home') || document.querySelector('[data-hub-panel="home"]') || document.querySelector('[data-panel="home"]');
  }
  function leaguePanel() {
    return document.getElementById('hub-panel-league') || document.getElementById('league-panel') || document.querySelector('[data-hub-panel="league"]') || document.querySelector('[data-panel="league"]');
  }

  function placeEntry(id, panel, mode) {
    const travel = normalizeWorld(false);
    if (!travel || travel.completed === true || !panel) return;
    injectStyles();
    let card = document.getElementById(id);
    if (!card) {
      card = document.createElement('div');
      card.id = id;
      card.className = 'pi-travel-entry';
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.addEventListener('click', openHub);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openHub(); } });
    }
    card.innerHTML = `<b>›</b><small>Summer Travel Hockey · ${esc(travel.placementLevel)}</small><strong>${esc(travel.playerTeamName || 'Travel Hockey Hub')}</strong><span>Open the tournament hub, bracket, teams and travel leaders.</span>`;

    if (mode === 'home') {
      const schedule = panel.querySelector('.hub-cal, .hub-calendar, #hub-cal-strip')?.closest('section,div');
      const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content') || panel;
      if (schedule?.parentElement) schedule.parentElement.insertBefore(card, schedule);
      else host.prepend(card);
    } else {
      const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;
      host.prepend(card);
    }
  }

  function renderEntries() {
    const travel = normalizeWorld(false);
    if (!travel) return;
    placeEntry(HOME_ENTRY, homePanel(), 'home');
    placeEntry(LEAGUE_ENTRY, leaguePanel(), 'league');
  }

  const originalOpenHubTab = typeof openHubTab === 'function' ? openHubTab : null;
  if (originalOpenHubTab) {
    globalThis.openHubTab = function(tabName, ...args) {
      const result = originalOpenHubTab(tabName, ...args);
      requestAnimationFrame(renderEntries);
      return result;
    };
  }

  WorldEngine.normalizeTravelHockeyWorld = normalizeWorld;
  WorldEngine.openTravelHockeyHub = openHub;
  WorldEngine.openTravelTeamProfile = openTeamProfile;
  WorldEngine.renderTravelHockeyHubEntries = renderEntries;

  document.addEventListener('click', () => requestAnimationFrame(renderEntries), { passive: true });
  normalizeWorld(false);
  requestAnimationFrame(renderEntries);
})();