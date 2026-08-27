'use strict';

/* global WorldEngine, EventSystem */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const EVENT_ID = 'hs-league-awards-ceremony';
  const dateKey = value => String(value || '').slice(0, 10);

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function getEvent() {
    return (WorldEngine.state?.schedule || []).find(event =>
      String(event?.eventId || event?.id || '') === EVENT_ID
    ) || null;
  }

  function ensureEvent(options = {}) {
    const post = postseason();
    const ceremonyDate = dateKey(post?.awardsCeremonyDate);
    if (
      !post?.championCheckpointAcknowledged ||
      !/^\d{4}-\d{2}-\d{2}$/.test(ceremonyDate)
    ) {
      return null;
    }

    const world = WorldEngine.state;
    if (!Array.isArray(world.schedule)) world.schedule = [];

    let event = getEvent();
    if (!event) {
      event = {
        id: EVENT_ID,
        eventId: EVENT_ID,
        eventKey: 'league-awards-ceremony',
        type: 'meeting',
        eventType: 'awards',
        date: ceremonyDate,
        label: 'League Awards Ceremony',
        shortLabel: 'Awards Ceremony',
        icon: '🏆',
        location: 'League Awards Hall',
        objective: 'Attend the league awards ceremony and see who takes home the season honors.',
        description: 'The Midwest Youth Hockey League gathers to reveal its regular-season award winners and Playoff MVP.',
        requiresPlayerInteraction: true,
        offseasonEvent: true,
        leagueAwardsCeremony: true,
        completed: false,
        played: false,
        status: 'scheduled',
      };
      world.schedule.push(event);
    } else {
      event.date = ceremonyDate;
      event.eventKey = 'league-awards-ceremony';
      event.type = 'meeting';
      event.eventType = 'awards';
      event.label = 'League Awards Ceremony';
      event.shortLabel = 'Awards Ceremony';
      event.icon = '🏆';
      event.location = 'League Awards Hall';
      event.objective = 'Attend the league awards ceremony and see who takes home the season honors.';
      event.description = 'The Midwest Youth Hockey League gathers to reveal its regular-season award winners and Playoff MVP.';
      event.requiresPlayerInteraction = true;
      event.offseasonEvent = true;
      event.leagueAwardsCeremony = true;
    }

    if (post?.awardsCeremonyAcknowledged === true) {
      event.completed = true;
      event.played = true;
      event.status = 'completed';
      event.completedAt = post.awardsCeremonyAcknowledgedAt || ceremonyDate;
      event.requiresPlayerInteraction = false;
      event.result = event.result || {
        title: 'League Awards Ceremony',
        summary: 'The league awards were revealed and recorded in league history.',
      };
    }

    world.schedule.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    if (options.save === true) WorldEngine.save?.();
    return event;
  }

  function completeEvent() {
    const post = postseason();
    const event = ensureEvent({ save: false });
    if (!event) return;
    event.completed = true;
    event.played = true;
    event.status = 'completed';
    event.completedAt = post?.awardsCeremonyAcknowledgedAt || dateKey(post?.awardsCeremonyDate);
    event.requiresPlayerInteraction = false;
    event.result = {
      title: 'League Awards Ceremony',
      summary: 'The league awards were revealed and recorded in league history.',
    };
    WorldEngine.save?.();
  }

  if (typeof EventSystem !== 'undefined' && typeof EventSystem.openEvent === 'function') {
    const originalOpenEvent = EventSystem.openEvent.bind(EventSystem);
    EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
      const id = String(eventId || eventData?.eventId || eventData?.id || '');
      if (id === EVENT_ID || eventData?.leagueAwardsCeremony === true) {
        ensureEvent({ save: false });
        if (typeof WorldEngine.renderAwardsCeremony === 'function') {
          return WorldEngine.renderAwardsCeremony();
        }
      }
      return originalOpenEvent(eventId, origin, eventData);
    };
  }

  const originalAdvance = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvance) {
    WorldEngine.advanceToDate = function(...args) {
      ensureEvent({ save: false });
      const result = originalAdvance(...args);
      ensureEvent({ save: false });
      return result;
    };
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.('#pi-champion-continue')) {
      window.requestAnimationFrame(() => {
        const created = ensureEvent({ save: true });
        if (created && typeof window.refreshCareerUI === 'function') {
          window.refreshCareerUI();
        }
      });
      return;
    }

    if (event.target?.closest?.('#pi-awards-finish')) {
      window.requestAnimationFrame(completeEvent);
    }
  });

  WorldEngine.ensureLeagueAwardsCeremonyEvent = ensureEvent;
  WorldEngine.getLeagueAwardsCeremonyEvent = getEvent;

  ensureEvent({ save: false });
})();
