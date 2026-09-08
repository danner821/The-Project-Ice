'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__travelSeasonIdIntegrityInstalled === true) return;
  WorldEngine.__travelSeasonIdIntegrityInstalled = true;

  function seasonId() {
    return String(
      WorldEngine.state?.season?.seasonId ||
      WorldEngine.state?.season?.id ||
      WorldEngine.state?.currentSeason ||
      ''
    ).trim();
  }

  function travelState() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function scopePrefix() {
    const id = seasonId();
    return id ? `travel:${id}:` : '';
  }

  function scoped(value) {
    const raw = String(value || '');
    const prefix = scopePrefix();
    if (!raw || !prefix || raw.startsWith(prefix)) return raw;
    return `${prefix}${raw}`;
  }

  function normalizeTravelIdentity() {
    const state = travelState();
    const tournament = state?.tournament;
    const prefix = scopePrefix();
    if (!state || !tournament || !prefix) return { changed: 0 };

    let changed = 0;
    const seriesIdMap = new Map();
    const rounds = tournament.rounds || {};

    for (const roundKey of ['quarterfinals', 'semifinals', 'championship']) {
      const seriesList = Array.isArray(rounds?.[roundKey]) ? rounds[roundKey] : [];
      for (const series of seriesList) {
        const oldId = String(series?.seriesId || '');
        if (oldId) {
          const nextId = scoped(oldId);
          seriesIdMap.set(oldId, nextId);
          if (nextId !== oldId) {
            series.seriesId = nextId;
            changed += 1;
          }
        }

        for (const game of Array.isArray(series?.games) ? series.games : []) {
          const oldGameId = String(game?.gameId || game?.eventId || game?.id || '');
          if (!oldGameId) continue;
          const nextGameId = scoped(oldGameId);
          if (nextGameId === oldGameId) continue;
          game.gameId = nextGameId;
          if (game.eventId !== undefined) game.eventId = nextGameId;
          if (game.id !== undefined) game.id = nextGameId;
          changed += 1;
        }
      }
    }

    tournament.seasonId = seasonId();
    tournament.identityScope = prefix.slice(0, -1);

    if (Array.isArray(WorldEngine.state?.schedule)) {
      for (const event of WorldEngine.state.schedule) {
        if (event?.travelTournament !== true && String(event?.type || '') !== 'travel-game') continue;

        const oldSeriesId = String(event?.travelSeriesId || '');
        if (oldSeriesId) {
          const nextSeriesId = seriesIdMap.get(oldSeriesId) || scoped(oldSeriesId);
          if (nextSeriesId !== oldSeriesId) {
            event.travelSeriesId = nextSeriesId;
            changed += 1;
          }
        }

        const oldEventId = String(event?.canonicalEventId || event?.gameId || event?.eventId || event?.id || '');
        if (!oldEventId) continue;
        const nextEventId = scoped(oldEventId);
        if (nextEventId === oldEventId) continue;
        event.id = nextEventId;
        event.eventId = nextEventId;
        event.gameId = nextEventId;
        event.canonicalEventId = nextEventId;
        changed += 1;
      }
    }

    return { changed, seasonId: tournament.seasonId };
  }

  function wrap(name, before = false) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__travelSeasonIdWrapped === true) return false;

    const wrapped = function(...args) {
      if (before) normalizeTravelIdentity();
      const result = original.apply(this, args);
      normalizeTravelIdentity();
      return result;
    };
    wrapped.__travelSeasonIdWrapped = true;
    WorldEngine[name] = wrapped;
    return true;
  }

  function installHooks() {
    wrap('ensureTravelTournamentProgression', true);
    wrap('syncCareerTravelSchedule', true);
    wrap('applyTravelTournamentGameResult', true);
    normalizeTravelIdentity();
  }

  const engine = document.getElementById('pi-travel-tournament-engine-loader');
  if (engine) engine.addEventListener('load', installHooks);

  const observer = new MutationObserver(() => {
    installHooks();
    if (
      typeof WorldEngine.ensureTravelTournamentProgression === 'function' &&
      typeof WorldEngine.syncCareerTravelSchedule === 'function'
    ) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  installHooks();
  window.addEventListener('projectice:next-high-school-season-started', normalizeTravelIdentity);

  WorldEngine.normalizeTravelSeasonIdentity = normalizeTravelIdentity;
})();
