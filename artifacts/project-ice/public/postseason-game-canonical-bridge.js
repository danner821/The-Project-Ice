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

  function mergeCanonical(found, event) {
    if (!found) return event || null;
    if (!event || typeof event !== 'object') return found;

    /*
     * Canonical state supplies simulation identity and fields the UI projection
     * may omit. The caller's projected/presentation fields must remain intact.
     *
     * Previously this bridge returned `found` by itself. Because this wrapper
     * sits underneath the regular-season presentation wrapper in the openEvent
     * chain, that behavior discarded the already-correct Home/Away Game label,
     * objective and description immediately before EventSystem populated the
     * screen. The surviving canonical featured flags are why the special-game
     * reasons looked correct while the hero fell back to "Upcoming Event".
     */
    return {
      ...found,
      ...event,
    };
  }

  function resolveCanonicalEvent(event, fallbackId = null) {
    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const ids = [eventKey(event), String(fallbackId || '')]
      .filter(Boolean);

    for (const id of ids) {
      const found = schedule.find(item => eventKey(item) === id);
      if (found) return mergeCanonical(found, event);
    }

    if (event?.date && event?.homeTeamId && event?.awayTeamId) {
      const found = schedule.find(item =>
        dateKey(item?.date) === dateKey(event.date) &&
        String(item?.homeTeamId || '') === String(event.homeTeamId || '') &&
        String(item?.awayTeamId || '') === String(event.awayTeamId || '')
      );
      if (found) return mergeCanonical(found, event);
    }

    return event || null;
  }

  const presentationAwareOpenEvent = EventSystem.openEvent?.bind(EventSystem);
  if (!presentationAwareOpenEvent) return;

  /*
   * Restore canonical metadata without replacing richer projected UI data.
   * This keeps postseason-only fields available while allowing the regular
   * season calendar/event presentation to survive the wrapper chain.
   */
  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const canonicalEvent = resolveCanonicalEvent(eventData, eventId);
    return presentationAwareOpenEvent(eventId, origin, canonicalEvent);
  };

  WorldEngine.resolveCanonicalScheduleEvent = resolveCanonicalEvent;
})();
