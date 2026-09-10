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

  const dateOf = event => String(event?.date || '').slice(0, 10);

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

    if (event?.travelTournament === true || type === 'travel-game') return false;

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

  function canonicalWorldGame(eventId, eventData = null) {
    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const games = schedule.filter(isRegularSeasonGame);
    if (!games.length) return null;

    const wantedIds = new Set([
      String(eventId || ''),
      ...idsOf(eventData),
    ].filter(Boolean));

    const byId = games.find(game =>
      idsOf(game).some(id => wantedIds.has(id))
    );
    if (byId) return byId;

    /*
     * The season UI can carry a presentation/event id that is not the same as
     * the regenerated canonical game id after rollover. The date is the stable
     * identity at this point in the flow: there is only one HS league game for
     * the career player on a given date.
     */
    const wantedDate = dateOf(eventData);
    if (wantedDate) {
      const playerTeam = careerTeamId();
      const byDate = games.find(game =>
        dateOf(game) === wantedDate &&
        (!playerTeam ||
          String(game.homeTeamId || '') === playerTeam ||
          String(game.awayTeamId || '') === playerTeam)
      );
      if (byDate) return byDate;
    }

    return null;
  }

  function projectedGame(canonicalGame) {
    if (!canonicalGame || typeof buildSeasonCalendarEvents !== 'function') {
      return null;
    }

    const canonicalIds = new Set(idsOf(canonicalGame));
    const canonicalDate = dateOf(canonicalGame);
    const events = buildSeasonCalendarEvents();
    if (!Array.isArray(events)) return null;

    return events.find(event => {
      if (!isRegularSeasonGame(event)) return false;
      if (idsOf(event).some(id => canonicalIds.has(id))) return true;
      return Boolean(canonicalDate) && dateOf(event) === canonicalDate;
    }) || null;
  }

  function presentRegularSeasonGame(event = {}) {
    if (!isRegularSeasonGame(event)) return event;

    const home = teamById(event.homeTeamId);
    const away = teamById(event.awayTeamId);
    if (!home || !away) return event;

    const playerTeamId = careerTeamId();
    const isHome = String(event.homeTeamId || '') === playerTeamId;
    const opponent = isHome ? away : home;
    const opponentName = teamName(opponent);
    const homeName = teamName(home);
    const awayName = teamName(away);
    const matchup = `${awayName} at ${homeName}`;
    const title = isHome
      ? `Home Game vs ${opponentName}`
      : `Away Game at ${opponentName}`;

    const rawObjective = String(event.objective || '').trim();
    const rawDescription = String(event.description || '').trim();
    const genericObjective =
      !rawObjective ||
      /^prepare for the event\.?$/i.test(rawObjective) ||
      /^no scheduled activities\.?$/i.test(rawObjective);
    const genericDescription =
      !rawDescription ||
      /^review the event details before continuing\.?$/i.test(rawDescription);

    return {
      ...event,
      label: title,
      title,
      shortLabel: isHome
        ? `vs ${away?.abbreviation || opponentName}`
        : `@ ${home?.abbreviation || opponentName}`,
      objective: genericObjective
        ? `Compete against ${opponentName} and help your team win.`
        : event.objective,
      description: genericDescription
        ? `${awayName} visits ${homeName} in regular-season league play.`
        : event.description,
      location: event.location || (isHome ? 'Home' : 'Away'),
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
    /*
     * Resolve the actual game from WorldEngine.state.schedule FIRST. That is the
     * authoritative source used by simulation and survives HS season rollover.
     * The previous bridge tried to identify the game through the UI projection;
     * when the rollover UI carried a generic event identity, that lookup missed
     * and the generic "Upcoming Event" payload flowed unchanged into openEvent.
     */
    const canonical = canonicalWorldGame(eventId, eventData);
    if (!canonical) {
      return originalOpenEvent(eventId, origin, eventData);
    }

    const projected = projectedGame(canonical);
    const resolved = {
      ...(eventData || {}),
      ...canonical,
      ...(projected || {}),
    };

    return originalOpenEvent(
      eventId,
      origin,
      presentRegularSeasonGame(resolved)
    );
  };
})();