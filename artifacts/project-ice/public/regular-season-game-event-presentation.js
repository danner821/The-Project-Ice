'use strict';

/* global WorldEngine, EventSystem */
(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;
  if (EventSystem.__projectIceRegularSeasonGameEventPresentationInstalled === true) return;
  if (typeof EventSystem.openEvent !== 'function') return;
  EventSystem.__projectIceRegularSeasonGameEventPresentationInstalled = true;

  const originalOpenEvent = EventSystem.openEvent.bind(EventSystem);

  const teamById = teamId =>
    (WorldEngine.state?.teams || []).find(team =>
      String(team?.teamId || '') === String(teamId || '')
    ) || null;

  const teamName = team => String(
    team?.schoolName && team?.teamName
      ? `${team.schoolName} ${team.teamName}`
      : team?.teamName || team?.name || team?.schoolName || team?.abbreviation || 'Opponent'
  ).trim();

  const careerTeamId = () => String(
    (WorldEngine.state?.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true)?.teamId ||
    WorldEngine.state?.player?.teamId ||
    ''
  );

  function canonicalEvent(eventId, eventData = null) {
    const wanted = String(
      eventData?.eventId ||
      eventData?.id ||
      eventData?.gameId ||
      eventId ||
      ''
    );

    if (!wanted) return eventData || null;

    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const found = schedule.find(event => {
      const keys = [event?.eventId, event?.id, event?.gameId]
        .filter(Boolean)
        .map(String);
      return keys.includes(wanted);
    }) || null;

    return found
      ? { ...found, ...(eventData || {}) }
      : eventData;
  }

  function isRegularSeasonGame(event = {}) {
    const type = String(event?.type || event?.eventType || '').toLowerCase();
    if (type !== 'game' && !(event?.homeTeamId && event?.awayTeamId)) return false;
    if (event?.travelTournament === true || type === 'travel-game') return false;
    if (
      event?.postseasonGame === true ||
      event?.isPostseasonGame === true ||
      event?.playoffGame === true ||
      event?.postseason === true ||
      event?.playoff === true ||
      String(event?.seasonScope || '').toLowerCase().includes('playoff') ||
      String(event?.scope || '').toLowerCase().includes('playoff')
    ) return false;
    return Boolean(event?.homeTeamId && event?.awayTeamId);
  }

  function enrich(event = {}) {
    if (!isRegularSeasonGame(event)) return event;

    const home = teamById(event.homeTeamId);
    const away = teamById(event.awayTeamId);
    if (!home || !away) return event;

    const homeName = teamName(home);
    const awayName = teamName(away);
    const playerTeamId = careerTeamId();
    const playerIsHome = playerTeamId && String(event.homeTeamId) === playerTeamId;
    const opponent = playerIsHome ? away : home;
    const opponentName = teamName(opponent);
    const venueWord = playerIsHome ? 'home' : 'away';

    const genericTitle = !event.label || /^upcoming event$/i.test(String(event.label));
    const genericObjective = !event.objective || /^prepare for the event\.?$/i.test(String(event.objective));
    const genericDescription = !event.description || /^review the event details before continuing\.?$/i.test(String(event.description));

    return {
      ...event,
      label: genericTitle ? `${awayName} at ${homeName}` : event.label,
      title: genericTitle ? `${awayName} at ${homeName}` : (event.title || event.label),
      shortLabel: event.shortLabel || `${away?.abbreviation || awayName} at ${home?.abbreviation || homeName}`,
      objective: genericObjective
        ? `Regular-season ${venueWord} game against ${opponentName}.`
        : event.objective,
      description: genericDescription
        ? `${awayName} visits ${homeName} in regular-season league play.`
        : event.description,
      details: {
        Opponent: opponentName,
        Matchup: `${awayName} at ${homeName}`,
        ...(event.details && typeof event.details === 'object' ? event.details : {}),
      },
    };
  }

  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const resolved = canonicalEvent(eventId, eventData);
    return originalOpenEvent(eventId, origin, resolved ? enrich(resolved) : eventData);
  };
})();
