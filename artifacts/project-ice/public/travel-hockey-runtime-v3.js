'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HUB_ID = 'pi-travel-hockey-hub-v3';
  const TEAM_ID = 'pi-travel-team-profile-v3';
  const HOME_ID = 'pi-travel-home-card';
  const LEAGUE_ID = 'pi-travel-league-card';
  const STYLE_ID = 'pi-travel-hockey-v3-styles';

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function activeTravel() {
    const state = travel();
    return Boolean(state?.tryoutResult && state?.placementLevel && state?.completed !== true);
  }

  function ensureWorld(save = false) {
    const state = WorldEngine.ensureTravelHockeyWorld?.({ save: false }) || travel();
    if (!state?.teams?.length) return state;

    const canonical = WorldEngine.state?.player || {};
    const canonicalId = String(canonical.playerId || canonical.id || 'career-player');
    const canonicalName = String(canonical.name || canonical.playerName || [canonical.firstName, canonical.lastName].filter(Boolean).join(' ').trim() || 'Career Player');

    state.teams.forEach(team => {
      const ids = new Set();
      const names = new Set();
      team.roster = (team.roster || []).filter(player => {
        const id = String(player?.playerId || player?.sourcePlayerId || player?.id || '');
        const name = String(player?.name || '').trim().toLowerCase();
        if ((id && ids.has(id)) || (name && names.has(name))) return false;
        if (id) ids.add(id);
        if (name) names.add(name);

        if (player?.isCareerPlayer === true || id === canonicalId || id === 'career-player') {
          player.isCareerPlayer = true;
          player.name = canonicalName;
          player.firstName = canonical.firstName || player.firstName || null;
          player.lastName = canonical.lastName || player.lastName || null;
          player.sourcePlayerId = canonicalId;
        }
        if (!player.travelStats) player.travelStats = { gp: 0, g: 0, a: 0, pts: 0, pim: 0, sog: 0 };
        return true;
      });
      if (!team.travelStats) team.travelStats = { gp: 0, w: 0, l: 0, gf: 0, ga: 0 };
    });

    if (!state.tournament || typeof state.tournament !== 'object') {
      state.tournament = { version: 1, status: 'not-started', level: state.placementLevel, teamIds: state.teams.map(t => t.teamId), rounds: { quarterfinals: [], semifinals: [], championship: [] }, championTeamId: null, tournamentMvpPlayerId: null };
    }
    if (!state.tournament.rounds) state.tournament.rounds = { quarterfinals: [], semifinals: [], championship: [] };
    if (!Array.isArray(state.tournament.rounds.quarterfinals) || state.tournament.rounds.quarterfinals.length !== 4) {
      const teams = [...state.teams].sort((a, b) => Number(a.seed || 99) - Number(b.seed || 99));
      const pairs = [[0,7],[3,4],[1,6],[2,5]];
      state.tournament.rounds.quarterfinals = pairs.map((pair, index) => ({
        seriesId: `travel-qf-${index + 1}`,
        round: 'quarterfinals',
        teamAId: teams[pair[0]]?.teamId || null,
        teamBId: teams[pair[1]]?.teamId || null,
        teamAWins: 0,
        teamBWins: 0,
        status: 'scheduled',
        bestOf: 3,
      }));
    }
    if (!Array.isArray(state.tournament.rounds.semifinals)) state.tournament.rounds.semifinals = [];
    if (!Array.isArray(state.tournament.rounds.championship)) state.tournament.rounds.championship = [];

    if (save) WorldEngine.save?.();
    return state;
  }

  function teamById(state, id) {
    return (state?.teams || []).find(team => String(team?.teamId) === String(id || '')) || null;
  }

  function teamRecord(team) {
    const s = team?.travelStats || {};
    return `${Number(s.w || 0)}-${Number(s.l || 0)}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pi-travel-season-card{margin:18px 0;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.22);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.88));color:#f6f9ff;cursor:pointer}.pi-travel-season-card small{display:block;color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.pi-travel-season-card strong{display:block;margin-top:6px;font-size:18px}.pi-travel-season-card span{display:block;margin-top:5px;color:#8298b2;font-size:10px}.pi-travel-season-card b{float:right;color:#8fc1ff;font-size:20px}
      #${HUB_ID},#${TEAM_ID}{position:fixed;inset:0;z-index:100090;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 18px calc(env(safe-area-inset-bottom,0px) + 30px);background:radial-gradient(circle at 50% 0%,rgba(48,107,201,.34),transparent 32%),linear-gradient(180deg,#061628,#030d18);color:#f6f9ff}.thv3-shell{max-width:650px;margin:0 auto}.thv3-back{width:42px;height:42px;border-radius:14px;border:1px solid rgba(118,166,229,.23);background:rgba(17,40,70,.72);color:#fff;font-size:25px}.thv3-kicker{margin-top:17px;color:#7aaff6;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.thv3-title{margin:7px 0 5px;font-size:31px;letter-spacing:-.04em}.thv3-sub{margin:0;color:#8499b4;font-size:11px;line-height:1.5}.thv3-your{margin-top:17px;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.22);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.82));cursor:pointer}.thv3-your small{color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.thv3-your h2{margin:7px 0 3px;font-size:22px}.thv3-your p{margin:0;color:#8298b2;font-size:10px}.thv3-your b{float:right;color:#8fc1ff;font-size:18px}.thv3-section{margin-top:22px}.thv3-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:9px}.thv3-head h3{margin:0;font-size:18px}.thv3-head span{color:#6f86a4;font-size:9px;text-transform:uppercase;font-weight:900}.thv3-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.thv3-team{padding:13px;border-radius:15px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03);cursor:pointer}.thv3-team.you{border-color:rgba(95,166,255,.38);background:rgba(45,105,190,.14)}.thv3-team strong{display:block;font-size:12px;line-height:1.25}.thv3-team span{display:block;margin-top:4px;color:#7186a1;font-size:9px}.thv3-team em{display:block;margin-top:7px;color:#9cb9db;font-size:9px;font-style:normal;font-weight:800}.thv3-series{display:grid;gap:8px}.thv3-series-card{padding:12px 13px;border-radius:14px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03)}.thv3-series-card small{display:block;color:#6e87a5;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.thv3-series-row{display:flex;justify-content:space-between;gap:10px;margin-top:7px;font-size:11px;font-weight:800}.thv3-series-row button{all:unset;cursor:pointer}.thv3-series-row span{color:#7e96b2}.thv3-empty{padding:14px;border-radius:14px;border:1px dashed rgba(112,166,236,.22);color:#8297b0;font-size:10px;line-height:1.5}.thv3-leaders{display:grid;gap:7px}.thv3-leader{display:grid;grid-template-columns:28px 1fr 50px;gap:9px;align-items:center;padding:11px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03);cursor:pointer}.thv3-leader .rank{color:#6d87a6;font-size:9px;font-weight:900}.thv3-leader .name{font-size:11px;font-weight:850}.thv3-leader .name small{display:block;margin-top:2px;color:#6c839f;font-size:8px}.thv3-leader .value{text-align:right;font-size:13px;font-weight:950}.thv3-leader .value small{display:block;color:#6f86a4;font-size:7px}.thv3-profile{margin-top:17px;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.2);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.82))}.thv3-profile h2{margin:0;font-size:25px}.thv3-profile p{margin:5px 0 0;color:#8298b2;font-size:10px}.thv3-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.thv3-meta div{padding:11px;border-radius:13px;background:rgba(255,255,255,.035);text-align:center}.thv3-meta span{display:block;color:#7187a3;font-size:7px;font-weight:900;text-transform:uppercase}.thv3-meta strong{display:block;margin-top:5px;font-size:14px}.thv3-roster{display:grid;gap:6px}.thv3-player{display:grid;grid-template-columns:34px 1fr 40px;gap:8px;align-items:center;padding:10px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.055);background:rgba(255,255,255,.025);cursor:pointer}.thv3-player.you{border-color:rgba(91,159,244,.28);background:rgba(48,111,199,.16)}.thv3-player .pos{color:#79adf5;font-size:9px;font-weight:900}.thv3-player .name{font-size:11px;font-weight:850}.thv3-player .name small{display:block;margin-top:2px;color:#657b96;font-size:8px}.thv3-player .ovr{text-align:right;font-size:11px;font-weight:900}
    `;
    document.head.appendChild(style);
  }

  function openPlayer(teamId, id) {
    const state = ensureWorld(false);
    const team = teamById(state, teamId);
    const player = (team?.roster || []).find(p => String(p.playerId || p.sourcePlayerId || '') === String(id || '')) || null;
    if (!player || typeof globalThis.openPlayerProfile !== 'function') return;
    const source = player.sourcePlayerId ? WorldEngine.getPlayerById?.(player.sourcePlayerId) : null;
    globalThis.openPlayerProfile(source || player, 'hub');
  }

  function openTeam(teamId) {
    const state = ensureWorld(true);
    const team = teamById(state, teamId);
    if (!team) return false;
    injectStyles();
    document.getElementById(TEAM_ID)?.remove();
    const root = document.createElement('section');
    root.id = TEAM_ID;
    const roster = [...(team.roster || [])].sort((a,b) => (a.position === 'G') - (b.position === 'G') || Number(b.overall || 0) - Number(a.overall || 0));
    root.innerHTML = `<div class="thv3-shell"><button class="thv3-back" type="button">‹</button><div class="thv3-kicker">Summer Travel Hockey · ${esc(state.placementLevel)}</div><h1 class="thv3-title">Team Profile</h1><div class="thv3-profile"><h2>${esc(team.name)}</h2><p>${esc(team.city)} · ${esc(state.placementLevel)} Travel Hockey</p><div class="thv3-meta"><div><span>Record</span><strong>${teamRecord(team)}</strong></div><div><span>GF</span><strong>${Number(team.travelStats?.gf || 0)}</strong></div><div><span>GA</span><strong>${Number(team.travelStats?.ga || 0)}</strong></div></div></div><div class="thv3-section"><div class="thv3-head"><h3>Roster</h3><span>${roster.length} Players</span></div><div class="thv3-roster">${roster.map(p => `<div class="thv3-player${p.isCareerPlayer ? ' you' : ''}" data-player="${esc(p.playerId || p.sourcePlayerId || '')}"><span class="pos">${esc(p.position)}</span><span class="name">${esc(p.name)}${p.isCareerPlayer ? '<small>YOU</small>' : p.isRealProspect ? '<small>PROSPECT</small>' : ''}</span><span class="ovr">${esc(p.overall)}</span></div>`).join('')}</div></div></div>`;
    root.querySelector('.thv3-back')?.addEventListener('click', () => root.remove());
    root.querySelectorAll('[data-player]').forEach(row => row.addEventListener('click', () => openPlayer(team.teamId, row.dataset.player)));
    document.body.appendChild(root);
    return true;
  }

  function bracketHtml(state) {
    const rounds = state?.tournament?.rounds || {};
    const groups = [['Quarterfinals', rounds.quarterfinals || []], ['Semifinals', rounds.semifinals || []], ['Championship', rounds.championship || []]];
    return groups.map(([label, series]) => `<div class="thv3-section"><div class="thv3-head"><h3>${label}</h3><span>Best of 3</span></div>${series.length ? `<div class="thv3-series">${series.map((s, index) => { const a = teamById(state, s.teamAId); const b = teamById(state, s.teamBId); return `<div class="thv3-series-card"><small>Series ${index + 1}</small><div class="thv3-series-row"><button data-team="${esc(a?.teamId || '')}">${esc(a?.name || 'TBD')}</button><span>${Number(s.teamAWins || 0)}</span></div><div class="thv3-series-row"><button data-team="${esc(b?.teamId || '')}">${esc(b?.name || 'TBD')}</button><span>${Number(s.teamBWins || 0)}</span></div></div>`; }).join('')}</div>` : '<div class="thv3-empty">This round will populate when the previous round is decided.</div>'}</div>`).join('');
  }

  function leadersHtml(state) {
    const entries = (state?.teams || []).flatMap(team => (team.roster || []).map(player => ({ team, player }))).filter(entry => Number(entry.player?.travelStats?.gp || 0) > 0).sort((a,b) => Number(b.player.travelStats?.pts || 0) - Number(a.player.travelStats?.pts || 0) || Number(b.player.travelStats?.g || 0) - Number(a.player.travelStats?.g || 0)).slice(0,5);
    if (!entries.length) return '<div class="thv3-empty">Travel leaders will populate as tournament games are played.</div>';
    return `<div class="thv3-leaders">${entries.map((entry,index) => `<div class="thv3-leader" data-player="${esc(entry.player.playerId || entry.player.sourcePlayerId || '')}" data-team="${esc(entry.team.teamId)}"><span class="rank">${index + 1}</span><span class="name">${esc(entry.player.name)}<small>${esc(entry.team.shortName || entry.team.name)}</small></span><span class="value">${Number(entry.player.travelStats?.pts || 0)}<small>PTS</small></span></div>`).join('')}</div>`;
  }

  function openHub() {
    const state = ensureWorld(true);
    if (!state?.teams?.length) return false;
    injectStyles();
    document.getElementById('pi-travel-hockey-hub')?.remove();
    document.getElementById(HUB_ID)?.remove();
    const myTeam = teamById(state, state.playerTeamId) || state.teams[0];
    const root = document.createElement('section');
    root.id = HUB_ID;
    root.innerHTML = `<div class="thv3-shell"><button class="thv3-back" type="button">‹</button><div class="thv3-kicker">Summer Travel Hockey · ${esc(state.placementLevel)}</div><h1 class="thv3-title">Travel Hockey Hub</h1><p class="thv3-sub">Your summer tournament world. Team profiles, bracket progress, and Travel statistics all live here.</p><div class="thv3-your" data-team="${esc(myTeam.teamId)}"><b>›</b><small>Your Team</small><h2>${esc(myTeam.name)}</h2><p>${esc(myTeam.city)} · ${teamRecord(myTeam)} tournament record</p></div><div class="thv3-section"><div class="thv3-head"><h3>Travel Field</h3><span>8 Teams</span></div><div class="thv3-grid">${state.teams.map(team => `<div class="thv3-team${team.teamId === state.playerTeamId ? ' you' : ''}" data-team="${esc(team.teamId)}"><strong>${esc(team.name)}</strong><span>${esc(team.city)}${team.teamId === state.playerTeamId ? ' · YOU' : ''}</span><em>${teamRecord(team)}${Number(team.travelStats?.gp || 0) ? ` · ${Number(team.travelStats.gf || 0)} GF · ${Number(team.travelStats.ga || 0)} GA` : ' · Tournament not started'}</em></div>`).join('')}</div></div>${bracketHtml(state)}<div class="thv3-section"><div class="thv3-head"><h3>Travel Stat Leaders</h3><span>PTS</span></div>${leadersHtml(state)}</div></div>`;
    root.querySelector('.thv3-back')?.addEventListener('click', () => root.remove());
    root.querySelectorAll('[data-team]').forEach(node => node.addEventListener('click', event => { const player = event.target.closest('[data-player]'); if (player) return; const id = node.dataset.team; if (id) openTeam(id); }));
    root.querySelectorAll('[data-player]').forEach(node => node.addEventListener('click', event => { event.stopPropagation(); openPlayer(node.dataset.team, node.dataset.player); }));
    document.body.appendChild(root);
    return true;
  }

  function makeEntry(id, state) {
    const card = document.createElement('section');
    card.id = id;
    card.className = 'pi-travel-season-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `<b>›</b><small>Summer Travel Hockey · ${esc(state.placementLevel)}</small><strong>${esc(state.playerTeamName || 'Travel Hockey Hub')}</strong><span>Open teams, tournament bracket, and Travel stat leaders.</span>`;
    const open = () => openHub();
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    return card;
  }

  function updateObjective(state) {
    const stage = document.getElementById('home-objective-stage');
    const title = document.getElementById('hub-current-objective-title');
    const text = document.getElementById('hub-current-objective');
    if (stage) stage.textContent = `${state.placementLevel} Travel Hockey`;
    if (title) title.textContent = 'Summer Tournament';
    if (text) text.textContent = `Represent ${state.playerTeamName || 'your travel team'} and make your summer tournament count.`;
  }

  function hideHighSchoolPostseason() {
    if (!activeTravel()) return;
    ['pi-league-postseason-card','pi-playoff-leaders-card'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.style.display = 'none';
    });
  }

  function placeEntries() {
    if (!activeTravel()) return;
    const state = ensureWorld(false);
    if (!state) return;
    injectStyles();

    document.getElementById(HOME_ID)?.remove();
    const home = document.getElementById('hub-tab-home');
    const objective = home?.querySelector('.home-objective');
    if (home && objective) objective.insertAdjacentElement('afterend', makeEntry(HOME_ID, state));

    document.getElementById(LEAGUE_ID)?.remove();
    const league = document.getElementById('hub-tab-league');
    if (league) league.prepend(makeEntry(LEAGUE_ID, state));

    updateObjective(state);
    hideHighSchoolPostseason();
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      placeEntries();
      window.setTimeout(() => { placeEntries(); hideHighSchoolPostseason(); }, 50);
    });
  }

  const observer = new MutationObserver(queue);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', queue, { passive: true });

  WorldEngine.openTravelHockeyHub = openHub;
  WorldEngine.openTravelTeamProfile = openTeam;
  WorldEngine.reconcileTravelSeasonUI = placeEntries;

  queue();
})();
