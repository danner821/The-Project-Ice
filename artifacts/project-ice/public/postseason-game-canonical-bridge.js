'use strict';

/* global WorldEngine, EventSystem */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;

  const eventKey = event => String(
    event?.gameId ||
    event?.eventId ||
    event?.id ||
    ''
  );

  const dateKey = value => String(value || '').slice(0, 10);

  function resolveCanonicalEvent(event, fallbackId = null) {
    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const ids = [eventKey(event), String(fallbackId || '')]
      .filter(Boolean);

    for (const id of ids) {
      const found = schedule.find(item => eventKey(item) === id);
      if (found) return found;
    }

    if (event?.date && event?.homeTeamId && event?.awayTeamId) {
      const found = schedule.find(item =>
        dateKey(item?.date) === dateKey(event.date) &&
        String(item?.homeTeamId || '') === String(event.homeTeamId || '') &&
        String(item?.awayTeamId || '') === String(event.awayTeamId || '')
      );
      if (found) return found;
    }

    return event || null;
  }

  const presentationAwareOpenEvent = EventSystem.openEvent?.bind(EventSystem);
  if (!presentationAwareOpenEvent) return;

  /*
   * The Schedule/Home calendar can pass a projected event object that omits
   * postseason-only fields. Resolve that projection back to the canonical
   * WorldEngine schedule entry before the presentation wrapper receives it.
   *
   * This module intentionally has no observers, timers, DOM writes, or save
   * behavior. It only restores canonical event metadata at the call boundary.
   */
  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const canonicalEvent = resolveCanonicalEvent(eventData, eventId);
    return presentationAwareOpenEvent(eventId, origin, canonicalEvent);
  };

  WorldEngine.resolveCanonicalScheduleEvent = resolveCanonicalEvent;
})();
