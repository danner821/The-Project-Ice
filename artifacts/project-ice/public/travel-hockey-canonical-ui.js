'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HUB = 'pi-travel-hockey-hub-canonical';
  const HOME = 'pi-travel-home-card';
  const LEAGUE = 'pi-travel-league-card';
  const ACTIVE = 'pi-travel-season-active';
  const STYLE = 'pi-travel-canonical-styles';
  const LAST_CLUB = 'projectice_last_travel_club_v2';
  let adapterId = null;

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const active = () => Boolean(travel()?.tryoutResult && travel()?.placementLevel && travel()?.completed !== true);

  function rosterCareer() {
    const base = WorldEngine.state?.player || {};
    const id = String(base.playerId || base.id || 'career-player');
    let best = null;
    for (const team of WorldEngine.state?.teams || []) {
      if (team?.travelProfileAdapter) continue;
      for (const player of team?.roster || []) {
        const playerId = String(player?.playerId || player?.id || '');
        if (player?.isCareerPlayer === true || playerId === 'career-player' || playerId === id) {
          if (!best || Number(player?.overall ?? player?.ovr ?? 0) > Number(best?.overall ?? best?.ovr ?? 0)) best = player;
        }
      }
    }
    return best;
  }

  function highSchoolTeamId() {
    const rosterPlayer = rosterCareer();
    const candidates = [
      rosterPlayer?.teamId,
      Game?.player?.highSchoolTeamId,
      Game?.player?.teamId,
      WorldEngine.state?.player?.highSchoolTeamId,
      WorldEngine.state?.player?.teamId,
    ].filter(Boolean);

    for (const candidate of candidates) {
      const team = (WorldEngine.state?.teams || []).find(item =>
        !item?.travelProfileAdapter && String(item?.teamId || '') === String(candidate)
      );
      if (team) return team.teamId;
    }
    return null;
  }

  function syncCareer() {
    if (!travel()) return WorldEngine.state?.player || null;
    const source = rosterCareer();
    if (!source) return WorldEngine.state?.player || null;
    const merged = { ...(WorldEngine.state?.player || {}) };
    ['playerId','id','firstName','lastName','name','playerName','position','handedness','archetype','overall','ovr','attributes','ratings','age','potential','coachTrust','trust','currentForm','form'].forEach(key => {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') merged[key] = source[key];
    });
    if (!merged.name) merged.name = [merged.firstName, merged.lastName].filter(Boolean).join(' ').trim();
    if (!merged.playerName) merged.playerName = merged.name;
    WorldEngine.state.player = merged;
    try { if (typeof Game !== 'undefined' && Game) Game.player = { ...(Game.player || {}), ...merged }; } catch (_) {}
    return merged;
  }

  const originalSelect = typeof WorldEngine.selectCareerSave === 'function'
    ? WorldEngine.selectCareerSave.bind(WorldEngine)
    : null;
  if (originalSelect && !WorldEngine.__travelCareerSyncWrapped) {
    WorldEngine.__travelCareerSyncWrapped = true;
    WorldEngine.selectCareerSave = async (...args) => {
      const result = await originalSelect(...args);
      syncCareer();
      return result;
    };
  }

  function randomIndex(length) {
    if (!length) return 0;
    try {
      if (globalThis.crypto?.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % length;
      }
    } catch (_) {}
    return Math.floor(Math.random() * length);
  }

  function randomizePlacement() {
    const state = travel();
    const result = state?.tryoutResult;
    const level = state?.placementLevel || result?.placementLevel;
    if (!state || !result || !level || result.randomClubApplied === true) return false;

    const options = state.teamOptionsByLevel?.[level];
    if (!Array.isArray(options) || options.length < 2) return false;

    let last = '';
    try { last = localStorage.getItem(`${LAST_CLUB}:${level}`) || ''; } catch (_) {}
    const deterministic = String(result.placementTeamId || state.placementTeamId || '');
    let pool = options.filter(option => String(option.teamId) !== last && String(option.teamId) !== deterministic);
    if (!pool.length) pool = options.filter(option => String(option.teamId) !== last);
    if (!pool.length) pool = options.slice();

    const pick = pool[randomIndex(pool.length)] || options[0];
    if (!pick) return false;

    result.randomClubApplied = true;
    result.placementTeamId = pick.teamId;
    result.placementTeamName = pick.name;
    result.placementTeamCity = pick.city;
    state.placementTeamId = pick.teamId;
    state.placementTeamName = pick.name;
    state.playerTeamId = pick.teamId;
    state.playerTeamName = pick.name;
    state.placementTeam = { ...pick };
    delete state.worldVersion;
    delete state.travelRosterWorldVersion;
    delete state.teams;
    delete state.tournament;

    try { localStorage.setItem(`${LAST_CLUB}:${level}`, String(pick.teamId)); } catch (_) {}

    const card = document.querySelector('#pi-travel-tryouts-screen .pi-travel-team');
    if (card) {
      const strong = card.querySelector('strong');
      const small = card.querySelector('small');
      if (strong) strong.textContent = pick.name;
      if (small) small.textContent = pick.city || '';
    }
    WorldEngine.save?.();
    return true;
  }

  function ensureWorld(save = false) {
    syncCareer();
    const state = WorldEngine.ensureTravelHockeyWorld?.({ save:false }) || travel();
    if (!state?.teams?.length) return state;

    WorldEngine.rebuildTravelHockeyRosters?.();
    const career = syncCareer() || {};
    const careerId = String(career.playerId || career.id || 'career-player');
    const careerName = String(career.name || career.playerName || [career.firstName, career.lastName].filter(Boolean).join(' ') || 'Career Player');
    const careerOverall = Number(career.overall ?? career.ovr ?? 60);

    for (const team of state.teams) {
      team.travelStats = team.travelStats || { gp:0, w:0, l:0, gf:0, ga:0 };
      for (const player of team.roster || []) {
        const id = String(player.playerId || player.sourcePlayerId || player.id || '');
        if (player.isCareerPlayer || id === careerId || id === 'career-player') {
          player.isCareerPlayer = true;
          player.name = careerName;
          player.firstName = career.firstName || player.firstName;
          player.lastName = career.lastName || player.lastName;
          player.position = career.position || player.position;
          player.overall = careerOverall;
          player.ovr = careerOverall;
          player.attributes = career.attributes || player.attributes;
          player.ratings = career.ratings || player.ratings;
          player.sourcePlayerId = careerId;
        }
        player.travelStats = player.travelStats || { gp:0, g:0, a:0, pts:0, pim:0, sog:0, wins:0, savePercentage:0 };
      }
    }

    state.tournament = state.tournament || {
      version:1,
      status:'not-started',
      level:state.placementLevel,
      teamIds:state.teams.map(team => team.teamId),
      rounds:{ quarterfinals:[], semifinals:[], championship:[] },
      championTeamId:null,
    };
    state.tournament.rounds = state.tournament.rounds || { quarterfinals:[], semifinals:[], championship:[] };
    if (!Array.isArray(state.tournament.rounds.quarterfinals) || state.tournament.rounds.quarterfinals.length !== 4) {
      const teams = [...state.teams].sort((a,b) => Number(a.seed || 99) - Number(b.seed || 99));
      const pairs = [[0,7],[3,4],[1,6],[2,5]];
      state.tournament.rounds.quarterfinals = pairs.map((pair,index) => ({
        seriesId:`travel-qf-${index + 1}`,
        teamAId:teams[pair[0]]?.teamId || null,
        teamBId:teams[pair[1]]?.teamId || null,
        teamAWins:0,
        teamBWins:0,
        status:'scheduled',
        bestOf:3,
      }));
    }
    if (!Array.isArray(state.tournament.rounds.semifinals)) state.tournament.rounds.semifinals = [];
    if (!Array.isArray(state.tournament.rounds.championship)) state.tournament.rounds.championship = [];
    if (save) WorldEngine.save?.();
    return state;
  }

  const byTeam = (state,id) => (state?.teams || []).find(team => String(team.teamId) === String(id || '')) || null;
  const record = team => `${Number(team?.travelStats?.w || 0)}-${Number(team?.travelStats?.l || 0)}`;

  function styles() {
    if (document.getElementById(STYLE)) return;
    const style = document.createElement('style');
    style.id = STYLE;
    style.textContent = `body.${ACTIVE} #pi-league-postseason-card,body.${ACTIVE} #pi-playoff-leaders-card{display:none!important}.pi-ts-card{margin:18px 0;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.22);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.88));color:#f6f9ff;cursor:pointer}.pi-ts-card small{display:block;color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.pi-ts-card strong{display:block;margin-top:6px;font-size:18px}.pi-ts-card span{display:block;margin-top:5px;color:#8298b2;font-size:10px}.pi-ts-card b{float:right;color:#8fc1ff;font-size:20px}#${HUB}{position:fixed;inset:0;z-index:100090;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 18px calc(env(safe-area-inset-bottom,0px) + 30px);background:radial-gradient(circle at 50% 0%,rgba(48,107,201,.34),transparent 32%),linear-gradient(180deg,#061628,#030d18);color:#f6f9ff}.pi-ts-shell{max-width:650px;margin:0 auto}.pi-ts-back{width:42px;height:42px;border-radius:14px;border:1px solid rgba(118,166,229,.23);background:rgba(17,40,70,.72);color:#fff;font-size:25px}.pi-ts-kicker{margin-top:17px;color:#7aaff6;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-ts-title{margin:7px 0 5px;font-size:31px}.pi-ts-sub{margin:0;color:#8499b4;font-size:11px;line-height:1.5}.pi-ts-your{margin-top:17px;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.22);background:rgba(40,98,180,.18);cursor:pointer}.pi-ts-your h2{margin:7px 0 3px;font-size:22px}.pi-ts-your small{color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-ts-your p{margin:0;color:#8298b2;font-size:10px}.pi-ts-sec{margin-top:22px}.pi-ts-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:9px}.pi-ts-head h3{margin:0;font-size:18px}.pi-ts-head span{color:#6f86a4;font-size:9px;text-transform:uppercase;font-weight:900}.pi-ts-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pi-ts-team,.pi-ts-series{padding:13px;border-radius:15px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-team.you{border-color:rgba(95,166,255,.38);background:rgba(45,105,190,.14)}.pi-ts-team strong{display:block;font-size:12px}.pi-ts-team span,.pi-ts-team em{display:block;margin-top:4px;color:#7186a1;font-size:9px;font-style:normal}.pi-ts-series{cursor:default;margin-bottom:8px}.pi-ts-row{display:flex;justify-content:space-between;margin-top:7px;font-size:11px;font-weight:800}.pi-ts-row button{all:unset;cursor:pointer}.pi-ts-empty{padding:14px;border-radius:14px;border:1px dashed rgba(112,166,236,.22);color:#8297b0;font-size:10px}.pi-ts-leader{display:grid;grid-template-columns:28px 1fr 50px;gap:9px;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.03);cursor:pointer}.pi-ts-leader .v{text-align:right;font-weight:900}`;
    document.head.appendChild(style);
  }

  function bracket(state) {
    const groups = [
      ['Quarterfinals', state.tournament?.rounds?.quarterfinals || []],
      ['Semifinals', state.tournament?.rounds?.semifinals || []],
      ['Championship', state.tournament?.rounds?.championship || []],
    ];
    return groups.map(([label,series]) => `<div class="pi-ts-sec"><div class="pi-ts-head"><h3>${label}</h3><span>Best of 3</span></div>${series.length ? series.map((item,index) => {
      const a = byTeam(state,item.teamAId);
      const b = byTeam(state,item.teamBId);
      return `<div class="pi-ts-series"><small>Series ${index + 1}</small><div class="pi-ts-row"><button data-team="${esc(a?.teamId || '')}">${esc(a?.name || 'TBD')}</button><span>${Number(item.teamAWins || 0)}</span></div><div class="pi-ts-row"><button data-team="${esc(b?.teamId || '')}">${esc(b?.name || 'TBD')}</button><span>${Number(item.teamBWins || 0)}</span></div></div>`;
    }).join('') : '<div class="pi-ts-empty">This round will populate when the previous round is decided.</div>'}</div>`).join('');
  }

  function leaders(state) {
    const rows = (state.teams || [])
      .flatMap(team => (team.roster || []).map(player => ({ team, player })))
      .filter(item => Number(item.player.travelStats?.gp || 0) > 0)
      .sort((a,b) => Number(b.player.travelStats?.pts || 0) - Number(a.player.travelStats?.pts || 0))
      .slice(0,5);
    if (!rows.length) return '<div class="pi-ts-empty">Travel leaders will populate as tournament games are played.</div>';
    return rows.map((item,index) => `<div class="pi-ts-leader" data-player="${esc(item.player.playerId || item.player.sourcePlayerId || '')}" data-team="${esc(item.team.teamId)}"><span>${index + 1}</span><span>${esc(item.player.name)}<small>${esc(item.team.shortName || item.team.name)}</small></span><span class="v">${Number(item.player.travelStats?.pts || 0)} PTS</span></div>`).join('');
  }

  function cleanupAdapter() {
    if (adapterId && Array.isArray(WorldEngine.state?.teams)) {
      WorldEngine.state.teams = WorldEngine.state.teams.filter(team => !(team.travelProfileAdapter && String(team.teamId) === String(adapterId)));
    }
    const profileMount = document.getElementById('team-profile-modern-content');
    if (profileMount) delete profileMount.dataset.travelTeamId;
    adapterId = null;
  }

  function canonicalTravelPlayerStats(player) {
    const s = player?.travelStats || {};
    const gamesPlayed = Number(s.gp ?? s.gamesPlayed ?? 0);
    const goals = Number(s.g ?? s.goals ?? 0);
    const assists = Number(s.a ?? s.assists ?? 0);
    const points = Number(s.pts ?? s.points ?? (goals + assists));
    const shots = Number(s.sog ?? s.shots ?? s.shotsOnGoal ?? 0);
    const penaltyMinutes = Number(s.pim ?? s.penaltyMinutes ?? 0);
    const wins = Number(s.wins ?? s.w ?? 0);
    const losses = Number(s.losses ?? s.l ?? 0);
    const shotsAgainst = Number(s.shotsAgainst ?? 0);
    const saves = Number(s.saves ?? 0);
    const goalsAgainst = Number(s.goalsAgainst ?? 0);
    const savedPct = Number(s.savePercentage ?? s.svPct ?? 0);
    const savePercentage = savedPct > 0 ? savedPct : (shotsAgainst > 0 ? saves / shotsAgainst : 0);
    return {
      ...s,
      gamesPlayed, goals, assists, points, shots, shotsOnGoal: shots, penaltyMinutes,
      wins, losses, shotsAgainst, saves, goalsAgainst, savePercentage,
      gp: gamesPlayed, g: goals, a: assists, pts: points, sog: shots, pim: penaltyMinutes
    };
  }

  function adapter(team) {
    const state = travel();
    const stats = team.travelStats || {};
    const level = state?.placementLevel || team.level || 'A';
    const club = team.shortName || String(team.name || '').replace(/\s+(B|A|AA|AAA)$/i, '');
    return {
      ...team,
      schoolName: club,
      teamName: `${level} Travel Hockey`,
      abbreviation: team.abbreviation || club.split(/\s+/).map(part => part[0]).join('').slice(0,4).toUpperCase(),
      primaryColor: team.primaryColor || '#2f6fd6',
      secondaryColor: team.secondaryColor || '#8fc1ff',
      wins: Number(stats.w || 0),
      losses: Number(stats.l || 0),
      overtimeLosses: 0,
      points: Number(stats.w || 0) * 2,
      goalsFor: Number(stats.gf || 0),
      goalsAgainst: Number(stats.ga || 0),
      prestige: Number(team.prestige || 3),
      identity: team.identity || `${level} summer travel hockey`,
      coachName: team.coachName || team.coach?.name || 'Travel Hockey Staff',
      coachStyle: team.coachStyle || team.coach?.style || 'Tournament development',
      arenaName: team.arenaName || team.arena?.name || `${team.city || 'Regional'} Ice Center`,
      arenaCapacity: team.arenaCapacity || team.arena?.capacity || 800,
      level,
      teamLevel: `${level} Travel Hockey`,
      travelProfileAdapter: true,
      roster: (team.roster || []).map(player => {
        const travelOnlyStats = canonicalTravelPlayerStats(player);
        return {
          ...player,
          teamId: team.teamId,
          stats: { ...travelOnlyStats },
          seasonStats: { ...travelOnlyStats },
          regularSeasonStats: { ...travelOnlyStats },
        };
      }),
    };
  }

  function openTeam(id) {
    const state = ensureWorld(false);
    const team = byTeam(state,id);
    if (!team || typeof globalThis.openTeamProfile !== 'function') return false;
    cleanupAdapter();
    const hsTeamId = highSchoolTeamId();
    const previousTeamTabId = hsTeamId || (typeof Game !== 'undefined' && Game?.teamTabSelectedTeamId) || null;
    const profileTeam = adapter(team);
    if (!Array.isArray(WorldEngine.state.teams)) WorldEngine.state.teams = [];
    WorldEngine.state.teams.push(profileTeam);
    adapterId = profileTeam.teamId;
    document.getElementById(HUB)?.remove();
    globalThis.openTeamProfile(profileTeam.teamId,'hub');
    const profileMount = document.getElementById('team-profile-modern-content');
    if (profileMount) profileMount.dataset.travelTeamId = String(team.teamId);

    // renderTeamProfile builds the Travel profile synchronously from the Team tab
    // renderer, which temporarily selects the adapter as the Team-tab team. Put
    // the persistent Team-tab selection back immediately; the cloned profile is
    // already built and remains independent.
    if (typeof Game !== 'undefined' && Game) {
      Game.teamTabSelectedTeamId = previousTeamTabId || hsTeamId || null;
    }

    requestAnimationFrame(() => {
      const eyebrow = document.querySelector('#team-profile-screen .tp-header .eyebrow');
      if (eyebrow) eyebrow.textContent = 'Travel Team Profile';
      document.getElementById('pi-team-profile-leaders-scope')?.remove();
    });
    return true;
  }

  function openPlayer(teamId,id) {
    const state = ensureWorld(false);
    const team = byTeam(state,teamId);
    const player = (team?.roster || []).find(item => String(item.playerId || item.sourcePlayerId || '') === String(id || ''));
    if (!player || typeof globalThis.openPlayerProfile !== 'function') return false;
    document.getElementById(HUB)?.remove();
    globalThis.openPlayerProfile((player.sourcePlayerId && WorldEngine.getPlayerById?.(player.sourcePlayerId)) || player,'hub');
    return true;
  }

  function openHub() {
    cleanupAdapter();
    const state = ensureWorld(true);
    if (!state?.teams?.length) return false;
    styles();
    document.getElementById('pi-travel-hockey-hub')?.remove();
    document.getElementById(HUB)?.remove();
    const mine = byTeam(state,state.playerTeamId) || state.teams[0];
    const root = document.createElement('section');
    root.id = HUB;
    root.innerHTML = `<div class="pi-ts-shell"><button class="pi-ts-back">‹</button><div class="pi-ts-kicker">Summer Travel Hockey · ${esc(state.placementLevel)}</div><h1 class="pi-ts-title">Travel Hockey Hub</h1><p class="pi-ts-sub">Your summer tournament world. Team profiles, bracket progress, and Travel statistics all live here.</p><div class="pi-ts-your" data-team="${esc(mine.teamId)}"><small>Your Team</small><h2>${esc(mine.name)}</h2><p>${esc(mine.city)} · ${record(mine)} tournament record</p></div><div class="pi-ts-sec"><div class="pi-ts-head"><h3>Travel Field</h3><span>8 Teams</span></div><div class="pi-ts-grid">${state.teams.map(team => `<div class="pi-ts-team${team.teamId === state.playerTeamId ? ' you' : ''}" data-team="${esc(team.teamId)}"><strong>${esc(team.name)}</strong><span>${esc(team.city)}${team.teamId === state.playerTeamId ? ' · YOU' : ''}</span><em>${record(team)} · ${Number(team.travelStats?.gp || 0) ? `${Number(team.travelStats.gf || 0)} GF · ${Number(team.travelStats.ga || 0)} GA` : 'Tournament not started'}</em></div>`).join('')}</div></div>${bracket(state)}<div class="pi-ts-sec"><div class="pi-ts-head"><h3>Travel Stat Leaders</h3><span>PTS</span></div>${leaders(state)}</div></div>`;

    root.querySelector('.pi-ts-back')?.addEventListener('click', () => root.remove());
    root.querySelectorAll('[data-team]').forEach(node => node.addEventListener('click', event => {
      if (event.target.closest('[data-player]')) return;
      if (node.dataset.team) openTeam(node.dataset.team);
    }));
    root.querySelectorAll('[data-player]').forEach(node => node.addEventListener('click', event => {
      event.stopPropagation();
      openPlayer(node.dataset.team,node.dataset.player);
    }));
    document.body.appendChild(root);
    return true;
  }

  function entry(id,state) {
    const card = document.createElement('section');
    card.id = id;
    card.className = 'pi-ts-card';
    card.tabIndex = 0;
    card.innerHTML = `<b>›</b><small>Summer Travel Hockey · ${esc(state.placementLevel)}</small><strong>${esc(state.playerTeamName || 'Travel Hockey Hub')}</strong><span>Open teams, tournament bracket, and Travel stat leaders.</span>`;
    card.addEventListener('click',openHub);
    return card;
  }

  function objective(state) {
    const stage = document.getElementById('home-objective-stage');
    const title = document.getElementById('hub-current-objective-title');
    const text = document.getElementById('hub-current-objective');
    if (stage) stage.textContent = `${state.placementLevel} Travel Hockey`;
    if (title) title.textContent = 'Summer Tournament';
    if (text) text.textContent = `Represent ${state.playerTeamName || 'your travel team'} and make your summer tournament count.`;
  }

  function reconcile() {
    styles();
    document.body?.classList.toggle(ACTIVE,active());
    if (!active()) {
      document.getElementById(HOME)?.remove();
      document.getElementById(LEAGUE)?.remove();
      return false;
    }
    const state = ensureWorld(false);
    if (!state) return false;

    document.getElementById(HOME)?.remove();
    const home = document.getElementById('hub-tab-home') || document.getElementById('hub-panel-home');
    const objectiveCard = home?.querySelector('.home-objective');
    if (home) {
      const card = entry(HOME,state);
      objectiveCard ? objectiveCard.insertAdjacentElement('afterend',card) : home.prepend(card);
    }

    document.getElementById(LEAGUE)?.remove();
    const league = document.getElementById('hub-tab-league') || document.getElementById('hub-panel-league') || document.getElementById('league-panel');
    if (league) league.prepend(entry(LEAGUE,state));
    objective(state);
    return true;
  }

  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      reconcile();
      setTimeout(reconcile,80);
    });
  }

  // Capture the See Placement click before the tryout screen replaces the button.
  // The old bubbling listener checked event.target after renderResult detached the
  // button from #pi-travel-tryouts-screen, so the selector no longer matched and
  // the deterministic club was never replaced.
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#pi-travel-tryouts-screen .pi-travel-next');
    if (button && /see placement/i.test(button.textContent || '')) {
      setTimeout(() => {
        randomizePlacement();
        queue();
      },0);
    }
  }, true);

  // Team navigation must never inherit the temporary Travel profile selection.
  // Use the actual hub navigation contract from index.html (`data-hub-tab`).
  // This capture-phase boundary runs before the core hub handler renders Team.
  document.addEventListener('click', event => {
    const teamNav = event.target?.closest?.('.hub-nav__tab[data-hub-tab="team"], [data-hub-tab="team"]');
    if (!teamNav) return;
    const hsTeamId = highSchoolTeamId();
    cleanupAdapter();
    if (typeof Game !== 'undefined' && Game && hsTeamId) {
      Game.teamTabSelectedTeamId = hsTeamId;
    }
  }, true);

  document.addEventListener('click', event => {
    if (adapterId && event.target?.closest?.('#btn-back-team-profile')) {
      setTimeout(() => {
        cleanupAdapter();
        openHub();
      },0);
      return;
    }
    if (event.target?.closest?.('.hub-nav__tab,[data-hub-tab],#pi-travel-tryouts-continue,#btn-dev-hub')) {
      queue();
      setTimeout(queue,140);
    }
  });

  syncCareer();
  styles();
  setTimeout(queue,100);
  setTimeout(queue,500);
  setTimeout(queue,1200);

  WorldEngine.syncTravelCareerIdentity = syncCareer;
  WorldEngine.openTravelHockeyHub = openHub;
  WorldEngine.openTravelTeamProfile = openTeam;
  WorldEngine.renderTravelHockeyHubEntries = reconcile;
  WorldEngine.reconcileTravelSeasonPresentation = reconcile;
})();