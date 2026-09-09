'use strict';

/* global EventSystem, buildSeasonCalendarEvents */
(() => {
  if (typeof EventSystem === 'undefined') return;
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

  function projectedRegularSeasonGame(eventId, eventData = null) {
    /*
     * buildSeasonCalendarEvents is a global lexical binding created by game.js
     * and later wrapped by career-calendar-projection.js. A top-level let/const
     * binding is visible by identifier across classic scripts, but it is not a
     * property of window/globalThis. Referencing globalThis here made this
     * bridge silently return null every time.
     */
    if (typeof buildSeasonCalendarEvents !== 'function') return null;

    const wanted = new Set([
      String(eventId || ''),
      ...idsOf(eventData),
    ].filter(Boolean));

    const events = buildSeasonCalendarEvents();
    if (!Array.isArray(events)) return null;

    return events.find(event => {
      const type = String(event?.type || '').toLowerCase();
      if (type !== 'game') return false;
      if (
        event?.travelTournament === true ||
        event?.postseasonGame === true ||
        event?.isPostseasonGame === true ||
        event?.playoffGame === true
      ) return false;
      return idsOf(event).some(id => wanted.has(id));
    }) || null;
  }

  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const projected = projectedRegularSeasonGame(eventId, eventData);
    return originalOpenEvent(eventId, origin, projected || eventData);
  };
})();
