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

  function currentDate() {
    return dateKey(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate
    );
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
    ) return null;

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
      Object.assign(event, {
        date: ceremonyDate,
        eventKey: 'league-awards-ceremony',
        type: 'meeting',
        eventType: 'awards',
        label: 'League Awards Ceremony',
        shortLabel: 'Awards Ceremony',
        icon: '🏆',
        location: 'League Awards Hall',
        objective: 'Attend the league awards ceremony and see who takes home the season honors.',
        description: 'The Midwest Youth Hockey League gathers to reveal its regular-season award winners and Playoff MVP.',
        offseasonEvent: true,
        leagueAwardsCeremony: true,
      });
      if (post?.awardsCeremonyAcknowledged !== true) {
        event.requiresPlayerInteraction = true;
        event.completed = false;
        event.played = false;
        event.status = 'scheduled';
      }
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

  function scheduleRoot() {
    const action = document.getElementById('schedule-selected-day-action');
    return action?.closest('.hub-tab-panel, .screen, section') ||
      document.getElementById('hub-tab-schedule') ||
      document.getElementById('schedule-screen') ||
      null;
  }

  function bridgeScheduleCalendar(event) {
    if (!event || event.completed === true) return;
    const root = scheduleRoot();
    const cell = root?.querySelector(`[data-date="${event.date}"]`) ||
      document.querySelector(`[data-date="${event.date}"]`);
    if (!cell) return;
    if (cell.querySelector(`[data-pi-awards-event="${EVENT_ID}"]`)) return;

    const marker = document.createElement('div');
    marker.dataset.piAwardsEvent = EVENT_ID;
    marker.setAttribute('aria-label', 'League Awards Ceremony');
    marker.style.cssText = 'margin-top:6px;padding:5px 4px;border-radius:8px;border:1px solid rgba(108,170,255,.45);background:rgba(30,75,145,.42);color:#dceaff;font-size:9px;font-weight:800;line-height:1.05;text-align:center;overflow:hidden;';
    marker.innerHTML = '<div style="font-size:13px;margin-bottom:2px">🏆</div><div>Awards</div>';
    cell.appendChild(marker);
  }

  function bridgeHomeWeek(event) {
    if (!event || event.completed === true) return;
    const cards = [...document.querySelectorAll('#hub-cal-strip .hub-cal-card')];
    const card = cards.find(item => dateKey(item?.eventData?.date) === event.date);
    if (!card) return;

    card.eventData = {
      ...(card.eventData || {}),
      date: event.date,
      icon: '🏆',
      event: 'Awards Ceremony',
      label: 'League Awards Ceremony',
      location: event.location,
      objective: event.objective,
      eventId: EVENT_ID,
      leagueAwardsCeremony: true,
      isCompleted: false,
    };

    const icon = card.querySelector('.hub-cal-card__icon');
    if (icon && icon.textContent !== '🏆') icon.textContent = '🏆';
    const title = card.querySelector('.hub-cal-card__title');
    if (title && title.textContent !== 'Awards Ceremony') title.textContent = 'Awards Ceremony';
  }

  function bridgeUpcoming(event) {
    if (!event || event.completed === true) return;
    const list = document.getElementById('schedule-upcoming-list');
    if (!list || list.querySelector(`[data-event-id="${EVENT_ID}"]`)) return;

    const item = document.createElement('div');
    item.className = 'schedule-upcoming-item';
    item.dataset.eventId = EVENT_ID;
    item.dataset.eventDate = event.date;
    const date = new Date(`${event.date}T12:00:00`);
    const label = Number.isNaN(date.getTime())
      ? event.date
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    item.innerHTML = `<div class="schedule-upcoming-item__date">${label}</div><div class="schedule-upcoming-item__content"><span class="schedule-upcoming-item__type"><span aria-hidden="true">🏆</span> Event</span><strong class="schedule-upcoming-item__title">League Awards Ceremony</strong></div>`;
    item.addEventListener('click', () => {
      const root = scheduleRoot();
      const target = root?.querySelector(`[data-date="${event.date}"]`) ||
        document.querySelector(`[data-date="${event.date}"]`);
      target?.click?.();
      target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    });
    list.appendChild(item);
  }

  function syncSelectedCeremonyDay(event) {
    const root = scheduleRoot();
    const selected = root?.querySelector('.schedule-day--selected, [data-date].is-selected, [data-date][aria-selected="true"]');
    if (dateKey(selected?.dataset?.date) !== event?.date) return;

    const details = document.getElementById('schedule-selected-day-details');
    if (details) {
      details.dataset.eventId = EVENT_ID;
      details.hidden = false;
      details.disabled = false;
      details.removeAttribute('aria-hidden');
    }
  }

  let presentationFrame = null;
  function bridgePresentation() {
    if (presentationFrame !== null) return;
    presentationFrame = requestAnimationFrame(() => {
      presentationFrame = null;
      const event = ensureEvent({ save: false });
      if (!event) return;
      bridgeScheduleCalendar(event);
      bridgeHomeWeek(event);
      bridgeUpcoming(event);
      syncSelectedCeremonyDay(event);
    });
  }

  function attachScopedObservers() {
    const home = document.getElementById('hub-cal-strip');
    const schedule = scheduleRoot();

    if (home && !home.dataset.piAwardsObserver) {
      home.dataset.piAwardsObserver = '1';
      new MutationObserver(bridgePresentation).observe(home, {
        childList: true,
        subtree: true,
      });
    }

    if (schedule && !schedule.dataset.piAwardsObserver) {
      schedule.dataset.piAwardsObserver = '1';
      new MutationObserver(bridgePresentation).observe(schedule, {
        childList: true,
        subtree: true,
      });
    }
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
      attachScopedObservers();
      bridgePresentation();
      return result;
    };
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.('#pi-champion-continue')) {
      requestAnimationFrame(() => {
        ensureEvent({ save: true });
        attachScopedObservers();
        bridgePresentation();
      });
      return;
    }

    if (event.target?.closest?.('#pi-awards-finish')) {
      requestAnimationFrame(completeEvent);
      return;
    }

    const ceremony = ensureEvent({ save: false });
    if (ceremony && event.target?.closest?.(`[data-date="${ceremony.date}"]`)) {
      requestAnimationFrame(() => syncSelectedCeremonyDay(ceremony));
    }

    attachScopedObservers();
    bridgePresentation();
  }, { passive: true });

  WorldEngine.ensureLeagueAwardsCeremonyEvent = ensureEvent;
  WorldEngine.getLeagueAwardsCeremonyEvent = getEvent;
  WorldEngine.bridgeLeagueAwardsCeremonyPresentation = bridgePresentation;

  ensureEvent({ save: false });
  attachScopedObservers();
  bridgePresentation();
})();
