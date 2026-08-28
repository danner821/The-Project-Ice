'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  let activeAdapterId = null;

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function teamById(id) {
    return (travel()?.teams || []).find(team => String(team?.teamId || '') === String(id || '')) || null;
  }

  function randomIndex(length) {
    if (!length) return 0;
    try {
      if (globalThis.crypto?.getRandomValues) {
        const value = new Uint32Array(1);
        globalThis.crypto.getRandomValues(value);
        return value[0] % length;
      }
    } catch (_) {}
    return Math.floor(Math.random() * length);
  }

  function assignFreshPlacementTeam() {
    const state = travel();
    const result = state?.tryoutResult;
    const level = result?.placementLevel || state?.placementLevel;
    const options = state?.teamOptionsByLevel?.[level];
    if (!state || !result || !level || !Array.isArray(options) || !options.length) return false;

    // The tryout tier is earned from the evaluation. The club within that tier
    // is a fresh draw for this tryout run and then becomes canonical.
    const currentId = String(result.placementTeamId || state.placementTeamId || '');
    const pool = options.length > 1
      ? options.filter(team => String(team?.teamId || '') !== currentId)
      : options;
    const selected = pool[randomIndex(pool.length)] || options[0];
    if (!selected) return false;

    state.placementLevel = level;
    state.placementTeamId = selected.teamId;
    state.placementTeamName = selected.name;
    state.playerTeamId = selected.teamId;
    state.playerTeamName = selected.name;
    state.placementTeam = { ...selected };
    result.placementTeamId = selected.teamId;
    result.placementTeamName = selected.name;
    result.placementTeamCity = selected.city;

    // Any summer world that may have reacted to the just-finished tryout must
    // be rebuilt around this one canonical assignment.
    delete state.worldVersion;
    delete state.teams;
    delete state.tournament;
    WorldEngine.ensureTravelHockeyWorld?.({ save: false });
    WorldEngine.save?.();
    syncTryoutResultTeam();
    return true;
  }

  function syncTryoutResultTeam() {
    const state = travel();
    const result = state?.tryoutResult;
    const root = document.getElementById('pi-travel-tryouts-screen');
    const teamCard = root?.querySelector('.pi-travel-team');
    if (!state || !result || !teamCard) return false;

    const name = state.placementTeamName || state.playerTeamName || result.placementTeamName;
    const city = state.placementTeam?.city || result.placementTeamCity || '';
    if (!name) return false;

    result.placementTeamId = state.placementTeamId || state.playerTeamId || result.placementTeamId;
    result.placementTeamName = name;
    result.placementTeamCity = city;

    const nameNode = teamCard.querySelector('strong');
    const cityNode = teamCard.querySelector('small');
    if (nameNode) nameNode.textContent = name;
    if (cityNode) cityNode.textContent = city;
    else if (city) {
      const small = document.createElement('small');
      small.textContent = city;
      teamCard.appendChild(small);
    }
    return true;
  }

  function levelPrestige(level) {
    return ({ B: 1, A: 2, AA: 3, AAA: 4 })[String(level || '').toUpperCase()] || 2;
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 4)
      .toUpperCase() || 'TRV';
  }

  function makeAdapter(team) {
    const state = travel();
    const stats = team?.travelStats || {};
    const level = state?.placementLevel || team?.level || 'A';
    const clubName = team?.shortName || String(team?.name || '').replace(/\s+(B|A|AA|AAA)$/i, '') || 'Travel Hockey';

    return {
      ...team,
      teamId: team.teamId,
      schoolName: clubName,
      teamName: `${level} Travel Hockey`,
      abbreviation: team.abbreviation || initials(clubName),
      level,
      teamLevel: level,
      primaryColor: team.primaryColor || '#2f6fd6',
      secondaryColor: team.secondaryColor || '#8fc1ff',
      wins: Number(stats.w || 0),
      losses: Number(stats.l || 0),
      overtimeLosses: 0,
      points: Number(stats.w || 0) * 2,
      goalsFor: Number(stats.gf || 0),
      goalsAgainst: Number(stats.ga || 0),
      prestige: levelPrestige(level),
      identity: `${level} summer travel hockey`,
      coachName: team.coachName || 'Travel Hockey Staff',
      coachStyle: team.coachStyle || 'Tournament development',
      arenaName: team.arenaName || `${team.city || 'Regional'} Ice Center`,
      arenaCapacity: team.arenaCapacity || 'Travel venue',
      travelProfileAdapter: true,
      roster: (team.roster || []).map(player => ({
        ...player,
        teamId: team.teamId,
        stats: player.travelStats || player.stats,
      })),
    };
  }

  function cleanupAdapter() {
    if (!activeAdapterId || !Array.isArray(WorldEngine.state?.teams)) return;
    WorldEngine.state.teams = WorldEngine.state.teams.filter(team =>
      !(team?.travelProfileAdapter === true && String(team?.teamId || '') === String(activeAdapterId))
    );
    activeAdapterId = null;
  }

  function openCanonicalTravelTeamProfile(teamId) {
    const team = teamById(teamId);
    if (!team || typeof globalThis.openTeamProfile !== 'function') return false;

    cleanupAdapter();
    if (!Array.isArray(WorldEngine.state.teams)) WorldEngine.state.teams = [];

    const adapter = makeAdapter(team);
    WorldEngine.state.teams.push(adapter);
    activeAdapterId = adapter.teamId;

    document.getElementById('pi-travel-team-profile-v3')?.remove();
    document.getElementById('pi-travel-hockey-hub-v3')?.remove();
    document.getElementById('pi-travel-hockey-hub')?.remove();

    globalThis.openTeamProfile(adapter.teamId, 'hub');

    requestAnimationFrame(() => {
      const eyebrow = document.querySelector('#team-profile-screen .tp-header .eyebrow');
      const levelNode = document.getElementById('tp-team-level');
      if (eyebrow) eyebrow.textContent = 'Travel Team Profile';
      if (levelNode) levelNode.textContent = `${travel()?.placementLevel || adapter.level} Travel Hockey`;
      document.getElementById('pi-team-profile-leaders-scope')?.remove();
    });
    return true;
  }

  function returnToTravelHub() {
    cleanupAdapter();
    if (typeof globalThis.showScreen === 'function') globalThis.showScreen('hub');
    requestAnimationFrame(() => WorldEngine.openTravelHockeyHub?.());
  }

  // The original tryout code finishes and renders the placement result on the
  // target button handler. By the time the click bubbles here, state is ready;
  // assign the club once without MutationObservers or capture-phase races.
  document.addEventListener('click', event => {
    const next = event.target?.closest?.('.pi-travel-next');
    if (!next || String(next.textContent || '').trim() !== 'See Placement') return;
    queueMicrotask(assignFreshPlacementTeam);
  });

  // Travel Field/bracket navigation must beat the older custom profile handler,
  // so this one narrow handler stays in capture phase and only matches team links.
  document.addEventListener('click', event => {
    const teamNode = event.target?.closest?.(
      '#pi-travel-hockey-hub-v3 .thv3-team[data-team], #pi-travel-hockey-hub-v3 .thv3-your[data-team], #pi-travel-hockey-hub-v3 .thv3-series-row [data-team]'
    );
    if (teamNode) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openCanonicalTravelTeamProfile(teamNode.dataset.team);
      return;
    }

    if (activeAdapterId && event.target?.closest?.('#btn-back-team-profile')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      returnToTravelHub();
    }
  }, true);

  document.addEventListener('click', event => {
    if (activeAdapterId && event.target?.closest?.('.hub-nav__item,[data-tab]')) cleanupAdapter();
  });

  WorldEngine.openTravelTeamProfile = openCanonicalTravelTeamProfile;
  WorldEngine.syncTravelTryoutResultTeam = syncTryoutResultTeam;
})();
