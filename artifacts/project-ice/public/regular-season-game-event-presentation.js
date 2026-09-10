'use strict';

/* global WorldEngine, EventSystem, buildSeasonCalendarEvents */
(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;
  if (typeof EventSystem.openEvent !== 'function') return;
  if (EventSystem.__projectIceRegularSeasonGameProjectionBridgeInstalled === true) return;
  EventSystem.__projectIceRegularSeasonGameProjectionBridgeInstalled = true;

  const originalOpenEvent = EventSystem.openEvent.bind(EventSystem);

  const idsOf = event => [
    event?.eventId,
    event?.canonicalEventId,
    event?.id,
    event?.gameId,
  ].filter(Boolean).map(String);

  const teamById = teamId =>
    (WorldEngine.state?.teams || []).find(team =>
      String(team?.teamId || '') === String(teamId || '')
    ) || null;

  const teamName = team => String(
    team?.schoolName && team?.teamName
      ? `${team.schoolName} ${team.teamName}`
      : team?.teamName ||
        team?.name ||
        team?.schoolName ||
        team?.abbreviation ||
        'Opponent'
  ).trim();

  const careerTeamId = () => String(
    (WorldEngine.state?.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true || player?.isUser === true)
      ?.teamId ||
    WorldEngine.state?.player?.teamId ||
    ''
  );

  function isRegularSeasonGame(event = {}) {
    const type = String(event?.type || event?.eventType || '').toLowerCase();

    if (
      type !== 'game' &&
      !(event?.homeTeamId && event?.awayTeamId)
    ) {
      return false;
    }

    if (
      event?.travelTournament === true ||
      type === 'travel-game'
    ) {
      return false;
    }

    if (
      event?.postseasonGame === true ||
      event?.isPostseasonGame === true ||
      event?.playoffGame === true ||
      event?.postseason === true ||
      event?.playoff === true ||
      String(event?.seasonScope || '').toLowerCase().includes('playoff') ||
      String(event?.scope || '').toLowerCase().includes('playoff')
    ) {
      return false;
    }

    return true;
  }

  function projectedRegularSeasonGame(eventId, eventData = null) {
    if (typeof buildSeasonCalendarEvents !== 'function') return null;

    const wantedIds = new Set([
      String(eventId || ''),
      ...idsOf(eventData),
    ].filter(Boolean));

    const events = buildSeasonCalendarEvents();
    if (!Array.isArray(events)) return null;

    const byId = events.find(event =>
      isRegularSeasonGame(event) &&
      idsOf(event).some(id => wantedIds.has(id))
    );

    if (byId) return byId;

    /*
     * Season-scoped rollover ids can differ from the temporary UI payload.
     * Date + matchup identity is the canonical fallback for the same game.
     */
    const date = String(eventData?.date || '').slice(0, 10);
    const homeTeamId = String(eventData?.homeTeamId || '');
    const awayTeamId = String(eventData?.awayTeamId || '');

    return events.find(event => {
      if (!isRegularSeasonGame(event)) return false;
      if (date && String(event?.date || '').slice(0, 10) !== date) return false;
      if (homeTeamId && String(event?.homeTeamId || '') !== homeTeamId) return false;
      if (awayTeamId && String(event?.awayTeamId || '') !== awayTeamId) return false;
      return Boolean(date || homeTeamId || awayTeamId);
    }) || null;
  }

  function enrichRegularSeasonGame(event = {}) {
    if (!isRegularSeasonGame(event)) return event;

    const home = teamById(event.homeTeamId);
    const away = teamById(event.awayTeamId);

    /* The core freshman projector already owns presentation when teams resolve. */
    if (!home || !away) return event;

    const rawLabel = String(event.label || event.title || '').trim();
    const rawObjective = String(event.objective || '').trim();
    const rawDescription = String(event.description || '').trim();

    const genericTitle = !rawLabel || /^upcoming event$/i.test(rawLabel);
    const genericObjective = !rawObjective || /^prepare for the event\.?$/i.test(rawObjective);
    const genericDescription = !rawDescription || /^review the event details before continuing\.?$/i.test(rawDescription);

    if (!genericTitle && !genericObjective && !genericDescription) {
      return event;
    }

    const playerTeamId = careerTeamId();
    const isHome = String(event.homeTeamId || '') === playerTeamId;
    const opponent = isHome ? away : home;
    const opponentName = teamName(opponent);

    return {
      ...event,
      label: genericTitle
        ? (isHome ? `Home Game vs ${opponentName}` : `Away Game at ${opponentName}`)
        : event.label,
      title: genericTitle
        ? (isHome ? `Home Game vs ${opponentName}` : `Away Game at ${opponentName}`)
        : (event.title || event.label),
      objective: genericObjective ? 'Compete and help your team win.' : event.objective,
      description: genericDescription
        ? `${isHome ? 'Home' : 'Away'} regular-season matchup against ${opponentName}.`
        : event.description,
    };
  }

  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const projected = projectedRegularSeasonGame(eventId, eventData);

    /*
     * IMPORTANT: the freshman calendar projection is authoritative for game
     * presentation. The previous merge order spread the generic caller payload
     * AFTER the projected game, overwriting its correct Home/Away Game label,
     * objective, description, team ids, and matchup data with "Upcoming Event"
     * defaults. Preserve caller-only metadata first; projected fields win last.
     */
    const resolved = projected
      ? {
          ...(eventData || {}),
          ...projected,
        }
      : eventData;

    return originalOpenEvent(
      eventId,
      origin,
      resolved ? enrichRegularSeasonGame(resolved) : resolved
    );
  };
})();