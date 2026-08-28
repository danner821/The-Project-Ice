'use strict';

/* global WorldEngine, openHubTab */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const SCREEN_ID = 'pi-travel-hockey-hub';
  const STYLE_ID = 'pi-travel-hockey-hub-styles';
  const HOME_CARD_ID = 'pi-travel-home-card';
  const LEAGUE_CARD_ID = 'pi-travel-league-card';
  const CLUBS = [
    { id: 'arizona-jr-coyotes', name: 'Arizona Jr. Coyotes', city: 'Phoenix, AZ' },
    { id: 'colorado-thunderbirds', name: 'Colorado Thunderbirds', city: 'Denver, CO' },
    { id: 'dallas-stars-elite', name: 'Dallas Stars Elite', city: 'Dallas, TX' },
    { id: 'chicago-mission', name: 'Chicago Mission', city: 'Chicago, IL' },
    { id: 'little-caesars', name: 'Little Caesars', city: 'Detroit, MI' },
    { id: 'pittsburgh-penguins-elite', name: 'Pittsburgh Penguins Elite', city: 'Pittsburgh, PA' },
    { id: 'boston-jr-eagles', name: 'Boston Jr. Eagles', city: 'Boston, MA' },
    { id: 'la-jr-kings', name: 'LA Jr. Kings', city: 'Los Angeles, CA' },
  ];
  const FIRST = ['Mason','Liam','Noah','Ethan','Logan','Owen','Jack','Lucas','Aiden','Carter','Hudson','Cole','Nolan','Wyatt','Caleb','Ryan','Luke','Connor','Gavin','Blake','Tyler','Evan','Dylan','Chase','Cam','Jake','Ben','Max','Alex','Sam','Brady','Parker'];
  const LAST = ['Miller','Anderson','Johnson','Thompson','Nelson','Bennett','Carter','Brooks','Foster','Hayes','Reed','Morgan','Murphy','Sullivan','Turner','Cooper','Bailey','Perry','Ward','Price','Bell','Cook','Ross','Gray','Wood','Kelly','Howard','Richardson','Hughes','Peterson','Lewis','Young'];
  const POSITIONS = ['C','LW','RW','C','LW','RW','D','D','D','D','D','D','G','G'];
  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function player() {
    return WorldEngine.state?.player || {};
  }

  function playerName(p = player()) {
    const direct = p?.name || p?.playerName;
    if (direct) return String(direct);
    const joined = [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
    return joined || 'Career Player';
  }

  function playerId(p) {
    return String(p?.playerId || p?.id || '');
  }

  function overallOf(p, fallback = 60) {
    const n = Number(p?.overall ?? p?.ovr ?? p?.rating);
    return Number.isFinite(n) ? clamp(Math.round(n), 40, 99) : fallback;
  }

  function positionOf(p) {
    const raw = String(p?.position || p?.pos || '').toUpperCase();
    if (raw.includes('GOAL')) return 'G';
    if (raw === 'D' || raw.includes('DEF')) return 'D';
    if (raw.includes('LEFT') || raw === 'LW') return 'LW';
    if (raw.includes('RIGHT') || raw === 'RW') return 'RW';
    return raw === 'C' || raw.includes('CENTER') ? 'C' : 'C';
  }

  function allWorldPlayers() {
    const direct = WorldEngine.getAllWorldPlayers?.();
    if (Array.isArray(direct) && direct.length) return direct;
    const teams = WorldEngine.state?.teams || [];
    return teams.flatMap(team => Array.isArray(team?.roster) ? team.roster : []);
  }

  function seededInt(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function generatedPlayer(teamId, slot, level) {
    const seed = seededInt(`${teamId}:${slot}:${level}`);
    const baseByLevel = { B: 57, A: 63, AA: 69, AAA: 75 };
    const first = FIRST[seed % FIRST.length];
    const last = LAST[Math.floor(seed / FIRST.length) % LAST.length];
    const pos = POSITIONS[slot % POSITIONS.length];
    const jitter = (seed % 9) - 4;
    return {
      playerId: `travel-gen:${teamId}:${slot}`,
      name: `${first} ${last}`,
      firstName: first,
      lastName: last,
      position: pos,
      overall: clamp((baseByLevel[level] || 60) + jitter, 48, 88),
      generatedTravelPlayer: true,
      travelStats: { gp: 0, g: 0, a: 0, pts: 0, pim: 0, sog: 0 },
    };
  }

  function snapshotPlayer(p) {
    return {
      playerId: playerId(p) || `travel-ref:${seededInt(playerName(p))}`,
      name: playerName(p),
      firstName: p?.firstName || null,
      lastName: p?.lastName || null,
      position: positionOf(p),
      overall: overallOf(p),
      isCareerPlayer: p?.isCareerPlayer === true || playerId(p) === playerId(player()),
      isRealProspect: p?.isRealProspect === true || p?.realProspect === true || Boolean(p?.prospectId),
      sourcePlayerId: playerId(p) || null,
      travelStats: { gp: 0, g: 0, a: 0, pts: 0, pim: 0, sog: 0 },
    };
  }

  function chooseCandidatePool(level) {
    const careerId = playerId(player());
    const target = { B: 58, A: 64, AA: 70, AAA: 76 }[level] || 64;
    return allWorldPlayers()
      .filter(p => playerId(p) && playerId(p) !== careerId)
      .map(p => ({ p, delta: Math.abs(overallOf(p) - target) }))
      .sort((a, b) => {
        const ar = a.p?.isRealProspect === true || a.p?.realProspect === true || a.p?.prospectId ? 0 : 1;
        const br = b.p?.isRealProspect === true || b.p?.realProspect === true || b.p?.prospectId ? 0 : 1;
        return ar - br || a.delta - b.delta || playerName(a.p).localeCompare(playerName(b.p));
      })
      .map(item => item.p);
  }

  function buildRoster(team, index, level, used) {
    const roster = [];
    const pool = chooseCandidatePool(level);
    const wanted = 20;
    for (const p of pool) {
      if (roster.length >= wanted) break;
      const id = playerId(p);
      if (!id || used.has(id)) continue;
      const pos = positionOf(p);
      const goalieCount = roster.filter(x => x.position === 'G').length;
      if (pos === 'G' && goalieCount >= 2) continue;
      used.add(id);
      roster.push(snapshotPlayer(p));
    }
    while (roster.length < wanted) {
      roster.push(generatedPlayer(team.teamId, roster.length + index * 20, level));
    }
    if (!roster.some(p => p.position === 'G')) {
      roster[roster.length - 1] = { ...generatedPlayer(team.teamId, 199, level), position: 'G' };
      roster[roster.length - 2] = { ...generatedPlayer(team.teamId, 198, level), position: 'G' };
    }
    return roster;
  }

  function ensureWorld(options = {}) {
    const state = travel();
    if (!state?.tryoutResult || !state?.placementLevel) return null;
    const level = state.placementLevel;
    const selectedId = state.placementTeamId || state.tryoutResult?.placementTeamId || state.placementTeam?.teamId;
    if (state.worldVersion === 1 && Array.isArray(state.teams) && state.teams.length === 8 && state.playerTeamId) return state;

    const used = new Set();
    const teams = CLUBS.map((club, index) => {
      const teamId = `${club.id}-${String(level).toLowerCase()}`;
      return {
        teamId,
        clubId: club.id,
        name: `${club.name} ${level}`,
        shortName: club.name,
        city: club.city,
        level,
        seed: index + 1,
        roster: [],
        travelStats: { gp: 0, w: 0, l: 0, gf: 0, ga: 0 },
      };
    });

    teams.forEach((team, index) => {
      team.roster = buildRoster(team, index, level, used);
    });

    let careerTeam = teams.find(team => team.clubId === selectedId || team.teamId === selectedId) || null;
    if (!careerTeam) {
      const name = state.tryoutResult?.placementTeamName || state.playerTeamName || '';
      careerTeam = teams.find(team => name && team.name.startsWith(name.replace(/\s+(B|A|AA|AAA)$/i, ''))) || teams[0];
    }

    const careerSnapshot = snapshotPlayer(player());
    careerSnapshot.isCareerPlayer = true;
    const replaceIndex = careerTeam.roster.findIndex(p => p.position !== 'G');
    careerTeam.roster.splice(Math.max(0, replaceIndex), 1, careerSnapshot);

    state.worldVersion = 1;
    state.status = state.status === 'placement-complete' ? 'travel-world-ready' : state.status;
    state.teams = teams;
    state.playerTeamId = careerTeam.teamId;
    state.playerTeamName = careerTeam.name;
    state.placementTeam = {
      teamId: careerTeam.teamId,
      clubId: careerTeam.clubId,
      name: careerTeam.name,
      city: careerTeam.city,
      level,
    };
    if (!state.tournament || typeof state.tournament !== 'object') {
      state.tournament = {
        version: 1,
        status: 'not-started',
        level,
        teamIds: teams.map(team => team.teamId),
        rounds: { quarterfinals: [], semifinals: [], championship: [] },
        championTeamId: null,
        tournamentMvpPlayerId: null,
      };
    }

    if (options.save === true) WorldEngine.save?.();
    return state;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .pi-travel-entry{margin:18px 0;padding:15px 16px;border:1px solid rgba(93,157,239,.18);border-radius:18px;background:linear-gradient(135deg,rgba(33,82,151,.17),rgba(9,27,48,.76));color:#f6f9ff;cursor:pointer}.pi-travel-entry small{display:block;color:#75aaf2;font-size:8px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.pi-travel-entry strong{display:block;margin-top:5px;font-size:16px}.pi-travel-entry span{display:block;margin-top:4px;color:#7f96b2;font-size:10px}.pi-travel-entry b{float:right;color:#8fc1ff;font-size:18px}
      #${SCREEN_ID}{position:fixed;inset:0;z-index:100060;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 18px calc(env(safe-area-inset-bottom,0px) + 30px);background:radial-gradient(circle at 50% 0%,rgba(48,107,201,.34),transparent 32%),linear-gradient(180deg,#061628,#030d18);color:#f6f9ff}.pi-th-shell{max-width:650px;margin:0 auto}.pi-th-back{width:42px;height:42px;border-radius:14px;border:1px solid rgba(118,166,229,.23);background:rgba(17,40,70,.72);color:#fff;font-size:25px}.pi-th-kicker{margin-top:17px;color:#7aaff6;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-th-title{margin:7px 0 5px;font-size:31px;letter-spacing:-.04em}.pi-th-sub{margin:0;color:#8499b4;font-size:11px;line-height:1.5}.pi-th-team{margin-top:17px;padding:17px;border-radius:20px;border:1px solid rgba(104,170,251,.2);background:linear-gradient(135deg,rgba(40,98,180,.21),rgba(10,28,50,.82))}.pi-th-team span{color:#79adf5;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-th-team h2{margin:7px 0 3px;font-size:22px}.pi-th-team p{margin:0;color:#8298b2;font-size:10px}.pi-th-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.pi-th-club{padding:13px;border-radius:15px;border:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.03)}.pi-th-club.you{border-color:rgba(95,166,255,.38);background:rgba(45,105,190,.14)}.pi-th-club strong{display:block;font-size:12px;line-height:1.25}.pi-th-club span{display:block;margin-top:4px;color:#7186a1;font-size:9px}.pi-th-section{margin-top:22px}.pi-th-section-head{display:flex;justify-content:space-between;align-items:end;margin-bottom:9px}.pi-th-section-head h3{margin:0;font-size:18px}.pi-th-section-head span{color:#6f86a4;font-size:9px;text-transform:uppercase;font-weight:900}.pi-th-roster{display:grid;gap:6px}.pi-th-player{display:grid;grid-template-columns:34px 1fr 38px;gap:8px;align-items:center;padding:10px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.055);background:rgba(255,255,255,.025)}.pi-th-player.you{background:rgba(48,111,199,.16);border-color:rgba(91,159,244,.25)}.pi-th-pos{color:#79adf5;font-size:9px;font-weight:900}.pi-th-name{font-size:11px;font-weight:800}.pi-th-name small{display:block;margin-top:2px;color:#657b96;font-size:8px;font-weight:700}.pi-th-ovr{text-align:right;font-size:11px;font-weight:900}.pi-th-coming{margin-top:20px;padding:15px;border-radius:16px;border:1px dashed rgba(112,166,236,.22);color:#8297b0;font-size:10px;line-height:1.5}
    `;
    document.head.appendChild(style);
  }

  function openHub() {
    const state = ensureWorld({ save: true });
    if (!state) return false;
    injectStyles();
    document.getElementById(SCREEN_ID)?.remove();
    const team = state.teams.find(t => t.teamId === state.playerTeamId) || state.teams[0];
    const root = document.createElement('section');
    root.id = SCREEN_ID;
    root.innerHTML = `
      <div class="pi-th-shell">
        <button class="pi-th-back" type="button" aria-label="Back">‹</button>
        <div class="pi-th-kicker">Summer Travel Hockey · ${esc(state.placementLevel)}</div>
        <h1 class="pi-th-title">Travel Hockey Hub</h1>
        <p class="pi-th-sub">Your summer world is separate from high school. Only the ${esc(state.placementLevel)} level you earned exists in this save's travel season.</p>
        <div class="pi-th-team"><span>Your Team</span><h2>${esc(team.name)}</h2><p>${esc(team.city)} · 20-player tournament roster</p></div>
        <div class="pi-th-section"><div class="pi-th-section-head"><h3>Travel Field</h3><span>8 Teams</span></div><div class="pi-th-grid">${state.teams.map(t => `<div class="pi-th-club${t.teamId === state.playerTeamId ? ' you' : ''}"><strong>${esc(t.name)}</strong><span>${esc(t.city)}${t.teamId === state.playerTeamId ? ' · YOU' : ''}</span></div>`).join('')}</div></div>
        <div class="pi-th-section"><div class="pi-th-section-head"><h3>${esc(team.name)} Roster</h3><span>20 Players</span></div><div class="pi-th-roster">${team.roster.slice().sort((a,b) => (a.position === 'G') - (b.position === 'G') || b.overall - a.overall).map(p => `<div class="pi-th-player${p.isCareerPlayer ? ' you' : ''}"><span class="pi-th-pos">${esc(p.position)}</span><span class="pi-th-name">${esc(p.name)}${p.isRealProspect ? '<small>REAL PROSPECT</small>' : p.isCareerPlayer ? '<small>YOU</small>' : ''}</span><span class="pi-th-ovr">${esc(p.overall)}</span></div>`).join('')}</div></div>
        <div class="pi-th-coming"><strong>Tournament setup next:</strong> the 8-team best-of-three bracket, every-other-day games, separate Travel statistics, and weekly training will populate here without touching HS regular-season or playoff stats.</div>
      </div>`;
    root.querySelector('.pi-th-back')?.addEventListener('click', () => root.remove());
    document.body.appendChild(root);
    return true;
  }

  function homePanel() {
    return document.getElementById('hub-panel-home') || document.getElementById('hub-tab-home') || document.querySelector('[data-hub-panel="home"]') || document.querySelector('[data-panel="home"]');
  }
  function leaguePanel() {
    return document.getElementById('hub-panel-league') || document.getElementById('league-panel') || document.querySelector('[data-hub-panel="league"]') || document.querySelector('[data-panel="league"]');
  }

  function renderEntry(panel, id) {
    if (!panel || document.getElementById(id)) return;
    const state = ensureWorld({ save: false });
    if (!state || state.completed === true) return;
    injectStyles();
    const card = document.createElement('div');
    card.id = id;
    card.className = 'pi-travel-entry';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `<b>›</b><small>Summer Travel Hockey · ${esc(state.placementLevel)}</small><strong>${esc(state.playerTeamName || 'Travel Hockey Hub')}</strong><span>Open your travel roster and summer tournament world.</span>`;
    const open = () => openHub();
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;
    host.appendChild(card);
  }

  let frame = null;
  function renderEntries() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const state = ensureWorld({ save: false });
      if (!state) {
        document.getElementById(HOME_CARD_ID)?.remove();
        document.getElementById(LEAGUE_CARD_ID)?.remove();
        return;
      }
      renderEntry(homePanel(), HOME_CARD_ID);
      renderEntry(leaguePanel(), LEAGUE_CARD_ID);
    });
  }

  document.addEventListener('click', () => requestAnimationFrame(renderEntries), { passive: true });
  WorldEngine.ensureTravelHockeyWorld = ensureWorld;
  WorldEngine.openTravelHockeyHub = openHub;
  WorldEngine.renderTravelHockeyHubEntries = renderEntries;

  ensureWorld({ save: false });
  renderEntries();
})();
