'use strict';

/* global WorldEngine, buildSeasonCalendarEvents, refreshScheduleEvents, setupHubCalendar, renderLeagueStandingsPreview */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__careerCalendarProjectionInstalled === true) return;

  if (
    typeof buildSeasonCalendarEvents !== 'function' ||
    typeof refreshScheduleEvents !== 'function'
  ) {
    console.error('[Project Ice] Career Calendar Projection could not find the core calendar renderer.');
    return;
  }

  WorldEngine.__careerCalendarProjectionInstalled = true;

  const originalBuildSeasonCalendarEvents = buildSeasonCalendarEvents;

  const eventKey = event =>
    String(
      event?.canonicalEventId ||
      event?.eventId ||
      event?.gameId ||
      event?.id ||
      ''
    );

  const dateKey = event => String(event?.date || '').slice(0, 10);

  const isGame = event => Boolean(
    event?.type === 'game' ||
    event?.type === 'travel-game' ||
    (
      event?.homeTeamId &&
      event?.awayTeamId
    )
  );

  const shouldProjectCareerEvent = event => {
    if (!event || isGame(event)) return false;
    if (!dateKey(event)) return false;

    const type = String(event?.type || event?.eventType || '').toLowerCase();

    return Boolean(
      event?.isCareerEvent === true ||
      event?.requiresPlayerInteraction === true ||
      event?.returningYearTryout === true ||
      type === 'tryout' ||
      type === 'meeting' ||
      type === 'coach-meeting' ||
      type === 'scouting' ||
      type === 'awards'
    );
  };

  /*
   * Core calendar contract:
   * WorldEngine.state.schedule is authoritative. The old UI projector only
   * whitelisted practice/recovery/training/coach-meeting, which meant a real
   * canonical tryout could exist, stop simulation, and still be invisible on
   * Home/Schedule. Preserve the existing game presentation, then add every
   * dated career event that the player can actually interact with.
   */
  buildSeasonCalendarEvents = function buildCanonicalCareerCalendarEvents() {
    const projected = originalBuildSeasonCalendarEvents();
    const canonical = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const existingKeys = new Set(
      projected
        .flatMap(event => [
          eventKey(event),
          String(event?.eventId || ''),
          String(event?.id || ''),
        ])
        .filter(Boolean)
    );

    const additionalCareerEvents = canonical
      .filter(shouldProjectCareerEvent)
      .filter(event => {
        const keys = [
          eventKey(event),
          String(event?.eventId || ''),
          String(event?.id || ''),
        ].filter(Boolean);

        return !keys.some(key => existingKeys.has(key));
      })
      .map(event => ({
        ...event,

        /*
         * Preserve EventSystem identity. Do not rewrite eventId to id.
         * The Season Engine reports blocking events by eventId first, so this
         * is what lets a Sept. 2 tryout stop simulation and open immediately.
         */
        eventId:
          event.eventId ||
          event.id,

        isCompleted: Boolean(
          event.completed === true ||
          event.played === true ||
          String(event.status || '').toLowerCase() === 'completed'
        ),
      }));

    return [
      ...projected,
      ...additionalCareerEvents,
    ].sort((a, b) =>
      dateKey(a).localeCompare(dateKey(b)) ||
      eventKey(a).localeCompare(eventKey(b))
    );
  };

  /*
   * Home must never depend on somebody having visited Schedule first.
   * Rebuild the UI mirror from canonical state every time Home renders.
   */
  if (typeof setupHubCalendar === 'function') {
    const originalSetupHubCalendar = setupHubCalendar;

    setupHubCalendar = function setupCanonicalHubCalendar(...args) {
      refreshScheduleEvents();
      return originalSetupHubCalendar.apply(this, args);
    };
  }

  /*
   * The League season label is presentation of canonical season identity,
   * not a permanent 2022-23 string from index.html.
   */
  if (typeof renderLeagueStandingsPreview === 'function') {
    const originalRenderLeagueStandingsPreview = renderLeagueStandingsPreview;

    renderLeagueStandingsPreview = function renderCanonicalLeagueStandingsPreview(...args) {
      const result = originalRenderLeagueStandingsPreview.apply(this, args);
      const label = document.getElementById('league-season');
      const seasonLabel =
        WorldEngine.state?.season?.label ||
        WorldEngine.state?.season?.seasonLabel ||
        WorldEngine.state?.currentSeason ||
        null;

      if (label && seasonLabel) {
        label.textContent = `${seasonLabel} Season`;
      }

      return result;
    };
  }

  /* Initial sync for careers that load directly into Hub. */
  try {
    refreshScheduleEvents();
  } catch (error) {
    console.warn('[Project Ice] Career Calendar Projection initial sync skipped:', error);
  }
})();
