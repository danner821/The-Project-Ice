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
      event = {
        id: TRYOUT_EVENT_ID,
        eventId: TRYOUT_EVENT_ID,
      };
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

  const originalAdvance = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvance) {
    WorldEngine.advanceToDate = function(...args) {
      ensureFoundation({ save: false });
      const result = originalAdvance(...args);
      ensureFoundation({ save: false });
      return result;
    };
  }

  WorldEngine.ensureTravelHockeyFoundation = ensureFoundation;
  WorldEngine.getTravelHockeyState = travelState;
  WorldEngine.getTravelHockeyTryoutEvent = getTryoutEvent;

  ensureFoundation({ save: false });
})();
