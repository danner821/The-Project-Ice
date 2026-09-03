'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MODULE_VERSION = 6;
  const WINDOW_DAYS = 7;
  const TRAININGS_PER_WINDOW = 3;

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const key = dateKey(value);
    if (!key) return null;
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function travelState() {
    return WorldEngine.state?.travelHockey ||
      WorldEngine.getTravelHockeyState?.() ||
      null;
  }

  function schedule() {
    const world = WorldEngine.state;
    if (!world) return [];
    if (!Array.isArray(world.schedule)) world.schedule = [];
    return world.schedule;
  }

  function offseasonRoot() {
    const world = WorldEngine.state;
    if (!world) return null;
    if (!world.offseasonDevelopment || typeof world.offseasonDevelopment !== 'object') {
      world.offseasonDevelopment = {};
    }
    return world.offseasonDevelopment;
  }

  function resolveStartDate() {
    const travel = travelState();
    const root = offseasonRoot();
    return dateKey(
      travel?.tournament?.closeoutAcknowledgedAt ||
      root?.startDate ||
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate
    );
  }

  function seasonBoundaryDates(startDate) {
    const key = dateKey(startDate);
    if (!key) return null;
    const year = Number(key.slice(0, 4));
    if (!Number.isFinite(year)) return null;
    return {
      endDate: `${year}-08-30`,
      checkpointDate: `${year}-08-31`,
    };
  }

  function isPostTravelOffseason() {
    const world = WorldEngine.state;
    if (!world || String(world?.season?.phase || '').toLowerCase() !== 'offseason') {
      return false;
    }

    const travel = travelState();
    return Boolean(
      travel?.completed === true ||
      travel?.tournament?.closeoutAcknowledged === true ||
      world?.offseasonDevelopment?.postTravelBoundary === true
    );
  }

  function isComplete(event) {
    return event?.completed === true ||
      event?.played === true ||
      event?.isCompleted === true;
  }

  function isActive(event) {
    return event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed';
  }

  function isOffseasonTraining(event) {
    return event?.offseasonDevelopmentEvent === true;
  }

  function isPriorPhaseFiller(event, startDate, endDate) {
    const date = dateKey(event?.date);
    if (!date || date < startDate || date > endDate) return false;
    if (isComplete(event) || isOffseasonTraining(event)) return false;

    if (
      event?.travelTournament === true ||
      event?.travelTournamentTraining === true ||
      event?.travelHockeyEvent === true ||
      String(event?.type || '').toLowerCase() === 'travel-game'
    ) {
      return true;
    }

    if (event?.postseasonCareerEvent === true) return true;

    const type = String(event?.type || event?.eventType || '').trim().toLowerCase();
    return new Set(['practice', 'recovery', 'training', 'off', 'rest']).has(type);
  }

  function normalizeSchedule(startDate, endDate) {
    const world = WorldEngine.state;
    const events = schedule();
    const filtered = events.filter(event => !isPriorPhaseFiller(event, startDate, endDate));
    if (filtered.length === events.length) return false;
    world.schedule = filtered;
    return true;
  }

  function applyPracticePresentation(event, slotIndex = 0) {
    const focuses = ['skills', 'systems', 'skating'];
    const descriptions = [
      'A focused offseason skill session built around puck work, shooting, and individual execution.',
      'A structured offseason practice emphasizing reads, habits, and complete-game execution.',
      'A high-tempo offseason session centered on skating quality, pace, and movement.',
    ];

    Object.assign(event, {
      type: 'practice',
      eventType: 'practice',
      eventKey: 'practice-systems',
      label: 'Offseason Training',
      shortLabel: 'Training',
      icon: '🏒',
      location: 'Training Rink',
      objective: 'Keep developing before the next high school season.',
      description: descriptions[slotIndex % descriptions.length],
      focus: focuses[slotIndex % focuses.length],
      requiresPlayerInteraction: true,
      isCareerEvent: true,
      offseasonEvent: true,
      offseasonDevelopmentEvent: true,
      seasonType: 'offseason',
      travelHockeyEvent: false,
      travelTournament: false,
      travelTournamentTraining: false,
      cadenceVersion: MODULE_VERSION,
      cadenceSlot: slotIndex,
    });
    return event;
  }

  function buildTrainingEvent(date, windowIndex, slotIndex) {
    const id = `offseason-training-${date}`;
    return applyPracticePresentation({
      id,
      eventId: id,
      date,
      completed: false,
      played: false,
      isCompleted: false,
      status: 'scheduled',
      cadenceWindow: windowIndex,
    }, slotIndex);
  }

  function hasBlockingEvent(events, date) {
    return events.some(event =>
      isActive(event) && dateKey(event?.date) === date
    );
  }

  function chooseTrainingDates(events, windowStart, windowEnd, endDate, needed) {
    const preferredOffsets = [1, 3, 5, 2, 4, 0, 6];
    const dates = [];
    for (const offset of preferredOffsets) {
      const date = addDays(windowStart, offset);
      if (!date || date > windowEnd || date > endDate) continue;
      if (hasBlockingEvent(events, date)) continue;
      dates.push(date);
      if (dates.length >= needed) break;
    }
    return dates;
  }

  function ensureWindow(events, windowStart, endDate, windowIndex) {
    const rawEnd = addDays(windowStart, WINDOW_DAYS - 1);
    const windowEnd = rawEnd && rawEnd < endDate ? rawEnd : endDate;

    const existing = events.filter(event =>
      isOffseasonTraining(event) &&
      isActive(event) &&
      dateKey(event?.date) >= windowStart &&
      dateKey(event?.date) <= windowEnd
    );

    let needed = Math.max(0, TRAININGS_PER_WINDOW - existing.length);
    if (!needed) return 0;

    const dates = chooseTrainingDates(events, windowStart, windowEnd, endDate, needed);
    let added = 0;
    for (const date of dates) {
      events.push(buildTrainingEvent(date, windowIndex, existing.length + added));
      added += 1;
      needed -= 1;
      if (!needed) break;
    }
    return added;
  }

  function reconcileExistingEvents(events, startDate, endDate) {
    let changed = false;
    for (const event of events) {
      if (!isOffseasonTraining(event)) continue;
      const date = dateKey(event?.date);
      if (!date || date < startDate || date > endDate) continue;
      const before = JSON.stringify(event);
      applyPracticePresentation(event, Number(event?.cadenceSlot) || 0);
      if (JSON.stringify(event) !== before) changed = true;
    }
    return changed;
  }

  function getTrainingEvents() {
    return schedule().filter(event => isOffseasonTraining(event));
  }

  function syncOffseasonDevelopmentCadence(options = {}) {
    if (!isPostTravelOffseason()) return false;

    const world = WorldEngine.state;
    const root = offseasonRoot();
    const startDate = resolveStartDate();
    const boundaries = seasonBoundaryDates(startDate);
    if (!world || !root || !startDate || !boundaries) return false;

    const { endDate, checkpointDate } = boundaries;
    if (startDate > checkpointDate) return false;

    let changed = normalizeSchedule(startDate, endDate);
    const events = schedule();

    if (reconcileExistingEvents(events, startDate, endDate)) changed = true;

    let windowIndex = 0;
    for (
      let cursor = startDate;
      cursor && cursor <= endDate;
      cursor = addDays(cursor, WINDOW_DAYS)
    ) {
      if (ensureWindow(events, cursor, endDate, windowIndex) > 0) changed = true;
      windowIndex += 1;
    }

    events.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    const nextRoot = {
      version: MODULE_VERSION,
      startDate,
      endDate,
      trainingsPerSevenDays: TRAININGS_PER_WINDOW,
      checkpointDate,
      postTravelBoundary: true,
    };

    if (
      Number(root.version) !== MODULE_VERSION ||
      root.startDate !== startDate ||
      root.endDate !== endDate ||
      Number(root.trainingsPerSevenDays) !== TRAININGS_PER_WINDOW ||
      root.checkpointDate !== checkpointDate ||
      root.postTravelBoundary !== true
    ) {
      Object.assign(root, nextRoot);
      changed = true;
    }

    if (changed && options.save !== false) WorldEngine.save?.();
    return changed;
  }

  WorldEngine.syncOffseasonDevelopmentCadence = syncOffseasonDevelopmentCadence;
  WorldEngine.getOffseasonDevelopmentTrainingEvents = getTrainingEvents;

  /* Resume path only. Lifecycle owners explicitly call sync at phase entry. */
  if (isPostTravelOffseason()) {
    syncOffseasonDevelopmentCadence({ save: true });
  }
})();