'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const TRYOUT_EVENT_ID = 'travel-hockey-tryouts';
  const LEVELS = ['B', 'A', 'AA', 'AAA'];
  const dateKey = value => String(value || '').slice(0, 10);

  function addDays(value, days) {
    const key = dateKey(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function travelState() {
    const world = WorldEngine.state;
    if (!world) return null;
    if (!world.travelHockey || typeof world.travelHockey !== 'object') {
      world.travelHockey = {};
    }
    return world.travelHockey;
  }

  function getTryoutEvent() {
    return (WorldEngine.state?.schedule || []).find(event =>
      String(event?.eventId || event?.id || '') === TRYOUT_EVENT_ID
    ) || null;
  }

  function scheduleRoot() {
    const action = document.getElementById('schedule-selected-day-action');
    return action?.closest('.hub-tab-panel, .screen, section') ||
      document.getElementById('hub-tab-schedule') ||
      document.getElementById('schedule-screen') ||
      null;
  }

  function ensureFoundation(options = {}) {
    const world = WorldEngine.state;
    const post = postseason();
    if (!world || post?.awardsCeremonyAcknowledged !== true) return null;

    const awardsDate = dateKey(
      post?.awardsCeremonyAcknowledgedAt ||
      post?.awardsCeremonyDate
    );
    if (!/^\d{4}-\d{2}-\d{2}$/.test(awardsDate)) return null;

    const tryoutDate = addDays(awardsDate, 7);
    if (!tryoutDate) return null;

    const travel = travelState();
    if (!travel) return null;

    if (!travel.version) travel.version = 1;
    travel.status = travel.status || 'tryouts-pending';
    travel.awardsCeremonyDate = awardsDate;
    travel.tryoutDate = travel.tryoutDate || tryoutDate;
    travel.levels = Array.isArray(travel.levels) && travel.levels.length
      ? travel.levels
      : [...LEVELS];
    travel.guaranteedMinimumLevel = 'B';
    if (!Object.prototype.hasOwnProperty.call(travel, 'placementLevel')) travel.placementLevel = null;
    if (!Object.prototype.hasOwnProperty.call(travel, 'tryoutResult')) travel.tryoutResult = null;
    if (!Object.prototype.hasOwnProperty.call(travel, 'tournament')) travel.tournament = null;
    if (!Object.prototype.hasOwnProperty.call(travel, 'completed')) travel.completed = false;

    if (!Array.isArray(world.schedule)) world.schedule = [];
    let event = getTryoutEvent();
    if (!event) {
      event = { id: TRYOUT_EVENT_ID, eventId: TRYOUT_EVENT_ID };
      world.schedule.push(event);
    }

    Object.assign(event, {
      eventKey: 'travel-hockey-tryouts',
      type: 'meeting',
      eventType: 'tryout',
      date: travel.tryoutDate,
      label: 'Travel Hockey Tryouts',
      shortLabel: 'Travel Tryouts',
      icon: '🏒',
      location: 'Regional Ice Center',
      objective: 'Compete for your summer travel hockey placement.',
      description: 'Earn a B, A, AA, or AAA summer placement based on your ability, form, and tryout performance.',
      offseasonEvent: true,
      travelHockeyEvent: true,
      travelTryoutEvent: true,
      requiresPlayerInteraction: travel.tryoutResult ? false : true,
      completed: Boolean(travel.tryoutResult),
      played: Boolean(travel.tryoutResult),
      status: travel.tryoutResult ? 'completed' : 'scheduled',
    });

    if (travel.tryoutResult) {
      event.completedAt = travel.tryoutResult.completedAt || travel.tryoutDate;
      event.result = event.result || {
        title: 'Travel Hockey Tryouts',
        summary: `Placed at ${travel.placementLevel || 'B'} level for the summer travel season.`,
      };
    }

    world.schedule.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    if (options.save === true) WorldEngine.save?.();
    return { travel, event };
  }

  function bridgeScheduleCalendar(event) {
    if (!event || event.completed === true) return;
    const root = scheduleRoot();
    const cell = root?.querySelector(`[data-date="${event.date}"]`) ||
      document.querySelector(`[data-date="${event.date}"]`);
    if (!cell || cell.querySelector(`[data-pi-travel-event="${TRYOUT_EVENT_ID}"]`)) return;

    const marker = document.createElement('div');
    marker.dataset.piTravelEvent = TRYOUT_EVENT_ID;
    marker.setAttribute('aria-label', 'Travel Hockey Tryouts');
    marker.style.cssText = 'margin-top:6px;padding:5px 4px;border-radius:8px;border:1px solid rgba(108,170,255,.45);background:rgba(30,75,145,.42);color:#dceaff;font-size:9px;font-weight:800;line-height:1.05;text-align:center;overflow:hidden;';
    marker.innerHTML = '<div style="font-size:13px;margin-bottom:2px">🏒</div><div>Travel Tryouts</div>';
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
      icon: '🏒',
      event: 'Travel Tryouts',
      label: 'Travel Hockey Tryouts',
      location: event.location,
      objective: event.objective,
      eventId: TRYOUT_EVENT_ID,
      travelHockeyEvent: true,
      travelTryoutEvent: true,
      isCompleted: false,
    };

    const icon = card.querySelector('.hub-cal-card__icon');
    if (icon) icon.textContent = '🏒';
    const title = card.querySelector('.hub-cal-card__title');
    if (title) title.textContent = 'Travel Tryouts';
  }

  function bridgeUpcoming(event) {
    if (!event || event.completed === true) return;
    const list = document.getElementById('schedule-upcoming-list');
    if (!list || list.querySelector(`[data-event-id="${TRYOUT_EVENT_ID}"]`)) return;

    const item = document.createElement('div');
    item.className = 'schedule-upcoming-item';
    item.dataset.eventId = TRYOUT_EVENT_ID;
    item.dataset.eventDate = event.date;
    const date = new Date(`${event.date}T12:00:00`);
    const label = Number.isNaN(date.getTime())
      ? event.date
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    item.innerHTML = `<div class="schedule-upcoming-item__date">${label}</div><div class="schedule-upcoming-item__content"><span class="schedule-upcoming-item__type"><span aria-hidden="true">🏒</span> Event</span><strong class="schedule-upcoming-item__title">Travel Hockey Tryouts</strong></div>`;
    item.addEventListener('click', () => {
      const root = scheduleRoot();
      const target = root?.querySelector(`[data-date="${event.date}"]`) ||
        document.querySelector(`[data-date="${event.date}"]`);
      target?.click?.();
      target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    });
    list.appendChild(item);
  }

  let frame = null;
  function bridgePresentation() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const ensured = ensureFoundation({ save: false });
      const event = ensured?.event || getTryoutEvent();
      if (!event) return;
      bridgeScheduleCalendar(event);
      bridgeHomeWeek(event);
      bridgeUpcoming(event);
    });
  }

  function attachObservers() {
    const home = document.getElementById('hub-cal-strip');
    const schedule = scheduleRoot();

    if (home && !home.dataset.piTravelObserver) {
      home.dataset.piTravelObserver = '1';
      new MutationObserver(bridgePresentation).observe(home, { childList: true, subtree: true });
    }

    if (schedule && !schedule.dataset.piTravelObserver) {
      schedule.dataset.piTravelObserver = '1';
      new MutationObserver(bridgePresentation).observe(schedule, { childList: true, subtree: true });
    }
  }

  const originalAdvance = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvance) {
    WorldEngine.advanceToDate = function(...args) {
      ensureFoundation({ save: false });
      const result = originalAdvance(...args);
      ensureFoundation({ save: false });
      attachObservers();
      bridgePresentation();
      return result;
    };
  }

  document.addEventListener('click', () => {
    requestAnimationFrame(() => {
      ensureFoundation({ save: false });
      attachObservers();
      bridgePresentation();
    });
  }, { passive: true });

  WorldEngine.ensureTravelHockeyFoundation = ensureFoundation;
  WorldEngine.getTravelHockeyState = travelState;
  WorldEngine.getTravelHockeyTryoutEvent = getTryoutEvent;
  WorldEngine.bridgeTravelHockeyPresentation = bridgePresentation;

  ensureFoundation({ save: false });
  attachObservers();
  bridgePresentation();
})();
