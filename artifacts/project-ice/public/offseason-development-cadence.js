'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MODULE_VERSION = 3;
  const WINDOW_DAYS = 7;
  const TRAININGS_PER_WINDOW = 3;
  const OFFSEASON_END_DATE = '2027-08-30';

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const key = dateKey(value);
    if (!key) return null;
    const date = new Date(`${key}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function travelState() {
    return WorldEngine.state?.travelHockey ||
      WorldEngine.getTravelHockeyState?.() ||
      null;
  }

  function isPostTravelOffseason() {
    const world = WorldEngine.state;
    if (!world || String(world?.season?.phase || '').toLowerCase() !== 'offseason') return false;

    const travel = travelState();
    const tournament = travel?.tournament;
    return Boolean(
      travel?.completed === true ||
      tournament?.closeoutAcknowledged === true ||
      world?.offseasonDevelopment?.postTravelBoundary === true
    );
  }

  function schedule() {
    const world = WorldEngine.state;
    if (!world) return [];
    if (!Array.isArray(world.schedule)) world.schedule = [];
    return world.schedule;
  }

  function activeEvent(event) {
    return event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed';
  }

  function hasAnyEventOnDate(events, date) {
    return events.some(event =>
      activeEvent(event) && dateKey(event?.date) === date
    );
  }

  function isOffseasonTraining(event) {
    return event?.offseasonDevelopmentEvent === true;
  }

  function applyCanonicalPracticePresentation(event, slotIndex = 0) {
    if (!event) return event;

    const focuses = ['skills', 'systems', 'skating'];
    const descriptions = [
      'A focused offseason skill session built around puck work, shooting, and individual execution.',
      'A structured offseason practice emphasizing reads, habits, and complete-game execution.',
      'A high-tempo offseason session centered on skating quality, pace, and movement.',
    ];

    event.type = 'practice';
    event.eventType = 'practice';
    event.eventKey = 'practice-systems';
    event.label = 'Offseason Training';
    event.shortLabel = 'Training';
    event.icon = '🏒';
    event.location = 'Training Rink';
    event.objective = 'Keep developing before the next high school season.';
    event.description = descriptions[slotIndex % descriptions.length];
    event.focus = focuses[slotIndex % focuses.length];
    event.requiresPlayerInteraction = true;
    event.isCareerEvent = true;
    event.offseasonEvent = true;
    event.offseasonDevelopmentEvent = true;
    event.seasonType = 'offseason';
    event.travelHockeyEvent = false;
    event.travelTournament = false;
    event.travelTournamentTraining = false;
    event.cadenceVersion = MODULE_VERSION;
    event.cadenceSlot = slotIndex;
    return event;
  }

  function buildTrainingEvent(date, windowIndex, slotIndex) {
    const id = `offseason-training-${date}`;
    return applyCanonicalPracticePresentation({
      id,
      eventId: id,
      date,
      completed: false,
      played: false,
      status: 'scheduled',
      cadenceWindow: windowIndex,
    }, slotIndex);
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
    const root = offseasonRoot();
    if (!root) return null;

    const existing = dateKey(root.startDate);
    if (existing) return existing;

    const travel = travelState();
    const start = dateKey(
      travel?.tournament?.closeoutAcknowledgedAt ||
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate
    );

    if (start) root.startDate = start;
    return start;
  }

  function reconcileExistingEvents(events) {
    let changed = false;
    for (const event of events) {
      if (!isOffseasonTraining(event)) continue;
      const slot = Number(event?.cadenceSlot) || 0;
      const before = JSON.stringify({
        type:event.type,
        eventType:event.eventType,
        eventKey:event.eventKey,
        label:event.label,
        requiresPlayerInteraction:event.requiresPlayerInteraction,
        travelHockeyEvent:event.travelHockeyEvent,
        cadenceVersion:event.cadenceVersion,
      });
      applyCanonicalPracticePresentation(event, slot);
      const after = JSON.stringify({
        type:event.type,
        eventType:event.eventType,
        eventKey:event.eventKey,
        label:event.label,
        requiresPlayerInteraction:event.requiresPlayerInteraction,
        travelHockeyEvent:event.travelHockeyEvent,
        cadenceVersion:event.cadenceVersion,
      });
      if (before !== after) changed = true;
    }
    return changed;
  }

  function chooseTrainingDates(events, windowStart, windowEnd, needed) {
    const preferredOffsets = [1, 3, 5, 2, 4, 0, 6];
    const candidates = [];

    for (const offset of preferredOffsets) {
      const date = addDays(windowStart, offset);
      if (!date || date > windowEnd || date > OFFSEASON_END_DATE) continue;
      if (hasAnyEventOnDate(events, date)) continue;
      candidates.push(date);
      if (candidates.length >= needed) break;
    }

    return candidates;
  }

  function ensureWindow(events, windowStart, windowIndex) {
    const rawEnd = addDays(windowStart, WINDOW_DAYS - 1);
    const windowEnd = rawEnd && rawEnd < OFFSEASON_END_DATE
      ? rawEnd
      : OFFSEASON_END_DATE;

    const existing = events.filter(event =>
      isOffseasonTraining(event) &&
      activeEvent(event) &&
      dateKey(event?.date) >= windowStart &&
      dateKey(event?.date) <= windowEnd
    );

    let needed = Math.max(0, TRAININGS_PER_WINDOW - existing.length);
    if (needed === 0) return 0;

    const dates = chooseTrainingDates(events, windowStart, windowEnd, needed);
    let added = 0;

    for (const date of dates) {
      events.push(buildTrainingEvent(date, windowIndex, existing.length + added));
      added += 1;
      needed -= 1;
      if (needed <= 0) break;
    }

    return added;
  }

  function syncOffseasonDevelopmentCadence(options = {}) {
    if (!isPostTravelOffseason()) return false;

    const world = WorldEngine.state;
    const root = offseasonRoot();
    const start = resolveStartDate();
    if (!world || !root || !start) return false;

    root.postTravelBoundary = true;

    const events = schedule();
    let changed = reconcileExistingEvents(events);

    let windowIndex = 0;
    for (
      let cursor = start;
      cursor && cursor <= OFFSEASON_END_DATE;
      cursor = addDays(cursor, WINDOW_DAYS)
    ) {
      if (ensureWindow(events, cursor, windowIndex) > 0) changed = true;
      windowIndex += 1;
    }

    events.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    const nextCadence = {
      version: MODULE_VERSION,
      startDate: start,
      endDate: OFFSEASON_END_DATE,
      trainingsPerSevenDays: TRAININGS_PER_WINDOW,
      checkpointDate: '2027-08-31',
      postTravelBoundary: true,
    };

    if (
      Number(root.version) !== MODULE_VERSION ||
      root.startDate !== nextCadence.startDate ||
      root.endDate !== nextCadence.endDate ||
      Number(root.trainingsPerSevenDays) !== TRAININGS_PER_WINDOW ||
      root.checkpointDate !== nextCadence.checkpointDate ||
      root.postTravelBoundary !== true
    ) {
      Object.assign(root, nextCadence);
      changed = true;
    }

    if (changed && options.save !== false) WorldEngine.save?.();
    return changed;
  }

  function syncAndRefresh() {
    const changed = syncOffseasonDevelopmentCadence({ save:true });
    if (!changed) return false;
    try { globalThis.refreshCareerUI?.(); } catch (_) {}
    try { globalThis.updateHubScreen?.(); } catch (_) {}
    return true;
  }

  WorldEngine.syncOffseasonDevelopmentCadence = syncOffseasonDevelopmentCadence;

  const originalSelectCareerSave = WorldEngine.selectCareerSave;
  if (
    typeof originalSelectCareerSave === 'function' &&
    originalSelectCareerSave.__projectIceOffseasonCadenceWrapped !== true
  ) {
    const wrappedSelectCareerSave = async (...args) => {
      const result = await originalSelectCareerSave.apply(WorldEngine, args);
      if (result) {
        syncAndRefresh();
        queueMicrotask(syncAndRefresh);
        requestAnimationFrame(syncAndRefresh);
      }
      return result;
    };
    wrappedSelectCareerSave.__projectIceOffseasonCadenceWrapped = true;
    wrappedSelectCareerSave.__projectIceOffseasonCadenceOriginal = originalSelectCareerSave;
    WorldEngine.selectCareerSave = wrappedSelectCareerSave;
  }

  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#pi-travel-closeout-continue')) return;
    requestAnimationFrame(syncAndRefresh);
  });

  syncOffseasonDevelopmentCadence({ save:true });
})();
