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

    return Boolean(event?.homeTeamId && event?.awayTeamId);
  }

  function projectedRegularSeasonGame(eventId, eventData = null) {
    /*
     * The calendar projector is the same presentation source used by the
     * freshman season. Keep using that canonical projection for every HS year.
     */
    if (typeof buildSeasonCalendarEvents !== 'function') return null;

    const wanted = new Set([
      String(eventId || ''),
      ...idsOf(eventData),
    ].filter(Boolean));

    const events = buildSeasonCalendarEvents();
    if (!Array.isArray(events)) return null;

    return events.find(event => {
      if (!isRegularSeasonGame(event)) return false;
      return idsOf(event).some(id => wanted.has(id));
    }) || null;
  }

  function enrichRegularSeasonGame(event = {}) {
    if (!isRegularSeasonGame(event)) return event;

    const home = teamById(event.homeTeamId);
    const away = teamById(event.awayTeamId);

    if (!home || !away) return event;

    const homeName = teamName(home);
    const awayName = teamName(away);
    const matchup = `${awayName} at ${homeName}`;

    const playerTeamId = careerTeamId();
    const playerIsHome =
      playerTeamId &&
      String(event.homeTeamId) === playerTeamId;

    const opponent = playerIsHome ? away : home;
    const opponentName = teamName(opponent);
    const venueWord = playerIsHome ? 'home' : 'away';

    const rawLabel = String(event.label || event.title || '').trim();
    const rawObjective = String(event.objective || '').trim();
    const rawDescription = String(event.description || '').trim();

    const genericTitle =
      !rawLabel ||
      /^upcoming event$/i.test(rawLabel) ||
      /^open day$/i.test(rawLabel);

    const genericObjective =
      !rawObjective ||
      /^prepare for the event\.?$/i.test(rawObjective) ||
      /^no scheduled activities\.?$/i.test(rawObjective);

    const genericDescription =
      !rawDescription ||
      /^review the event details before continuing\.?$/i.test(rawDescription);

    const resolvedLabel = genericTitle
      ? matchup
      : rawLabel;

    return {
      ...event,
      label: resolvedLabel,
      title: resolvedLabel,
      shortLabel:
        event.shortLabel ||
        `${away?.abbreviation || awayName} at ${home?.abbreviation || homeName}`,
      objective: genericObjective
        ? `Regular-season ${venueWord} game against ${opponentName}.`
        : event.objective,
      description: genericDescription
        ? `${awayName} visits ${homeName} in regular-season league play.`
        : event.description,
      details: {
        Opponent: opponentName,
        Matchup: matchup,
        ...(event.details && typeof event.details === 'object'
          ? event.details
          : {}),
      },
    };
  }

  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const projected = projectedRegularSeasonGame(eventId, eventData);

    /*
     * The regression came from replacing the old enrichment layer when the
     * freshman calendar bridge was added. Resolve through the freshman
     * projector first, then run the same matchup enrichment that existed
     * before that replacement. Preserve any richer caller data last.
     */
    const resolved = projected
      ? {
          ...projected,
          ...(eventData || {}),
        }
      : eventData;

    return originalOpenEvent(
      eventId,
      origin,
      resolved ? enrichRegularSeasonGame(resolved) : resolved
    );
  };
})();