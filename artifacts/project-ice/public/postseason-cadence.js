'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MODULE_VERSION = 2;
  const WINDOW_DAYS = 7;
  const MIN_EVENTS_PER_WINDOW = 2;

  const key = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const dateKey = key(value);
    if (!dateKey) return null;
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function careerTeamId() {
    const world = WorldEngine.state || {};
    const player = world.player || {};
    const direct = player.teamId || player.highSchoolTeamId || null;
    const playerId = player.playerId || player.id || 'career-player';

    for (const team of world.teams || []) {
      const found = (team?.roster || []).some(skater => {
        const id = skater?.playerId || skater?.id || null;
        return skater?.isCareerPlayer === true ||
          String(id || '') === String(playerId || '') ||
          String(id || '') === 'career-player';
      });
      if (found) return team.teamId || direct;
    }

    return direct;
  }

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function isCareerPlayoffGame(event, teamId) {
    if (!event || event?.isPlayoff !== true || event?.type !== 'game') return false;
    return String(event.homeTeamId || '') === String(teamId || '') ||
      String(event.awayTeamId || '') === String(teamId || '');
  }

  function activeCareerGameDates(schedule, teamId) {
    return new Set(
      schedule
        .filter(event =>
          isCareerPlayoffGame(event, teamId) &&
          event?.canceled !== true &&
          String(event?.status || '').toLowerCase() !== 'not-needed'
        )
        .map(event => key(event.date))
        .filter(Boolean)
    );
  }

  function hasAnyEventOnDate(schedule, date) {
    return schedule.some(event =>
      key(event?.date) === date &&
      event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed'
    );
  }

  function nextCareerGameDate(schedule, teamId, afterDate) {
    return schedule
      .filter(event => isCareerPlayoffGame(event, teamId) && event?.canceled !== true)
      .map(event => key(event.date))
      .filter(date => date && date >= afterDate)
      .sort()[0] || null;
  }

  function previousCareerGameDate(schedule, teamId, beforeDate) {
    return schedule
      .filter(event => isCareerPlayoffGame(event, teamId) && event?.canceled !== true)
      .map(event => key(event.date))
      .filter(date => date && date < beforeDate)
      .sort()
      .reverse()[0] || null;
  }

  function chooseEventType(schedule, teamId, date) {
    const previous = previousCareerGameDate(schedule, teamId, date);
    const next = nextCareerGameDate(schedule, teamId, date);

    if (previous && addDays(previous, 1) === date) return 'recovery';
    if (next && addDays(date, 1) === next) return 'practice';
    return previous ? 'recovery' : 'practice';
  }

  function applyEventPresentation(event, type) {
    const practice = type === 'practice';
    event.type = type;
    event.eventType = type;
    event.label = practice ? 'Playoff Practice' : 'Recovery Session';
    event.shortLabel = practice ? 'Practice' : 'Recovery';
    event.icon = practice ? '🏒' : '😴';
    event.location = practice ? 'Team Rink' : 'Recovery Room';
    event.objective = practice
      ? 'Stay sharp and prepare for the next playoff test.'
      : 'Reset physically and mentally between postseason games.';
    event.cadenceVersion = MODULE_VERSION;
    return event;
  }

  function buildCareerEvent(date, type, windowIndex, slotIndex) {
    const id = `hs-playoff-cadence-${date}`;
    return applyEventPresentation({
      id,
      eventId: id,
      date,
      isPlayoff: true,
      seasonType: 'playoffs',
      postseasonCareerEvent: true,
      completed: false,
      played: false,
      status: 'scheduled',
      cadenceWindow: windowIndex,
      cadenceSlot: slotIndex,
    }, type);
  }

  function reconcileExistingCadence(world, teamId) {
    const schedule = Array.isArray(world.schedule) ? world.schedule : (world.schedule = []);
    const gameDates = activeCareerGameDates(schedule, teamId);
    let changed = false;

    /*
     * A future playoff game may be created after preparation events were
     * already projected. Never allow a practice/recovery event to occupy a
     * newly claimed career-game date.
     */
    const filtered = schedule.filter(event => {
      if (event?.postseasonCareerEvent !== true) return true;
      const date = key(event.date);
      if (!date || !gameDates.has(date)) return true;
      changed = true;
      return false;
    });

    if (filtered.length !== schedule.length) {
      world.schedule = filtered;
    }

    const currentSchedule = Array.isArray(world.schedule) ? world.schedule : [];

    /*
     * Once a matchup becomes known, nearby preparation events should adapt.
     * For example, the day after a newly created semifinal becomes Recovery
     * and the day before it becomes Practice without creating a new event.
     */
    for (const event of currentSchedule) {
      if (event?.postseasonCareerEvent !== true || event?.completed === true) continue;
      const date = key(event.date);
      if (!date) continue;
      const desiredType = chooseEventType(currentSchedule, teamId, date);
      if (event.type !== desiredType || Number(event.cadenceVersion) !== MODULE_VERSION) {
        applyEventPresentation(event, desiredType);
        changed = true;
      }
    }

    return changed;
  }

  function ensureWindowEvents(world, windowStart, windowIndex) {
    const schedule = Array.isArray(world.schedule) ? world.schedule : (world.schedule = []);
    const teamId = careerTeamId();
    if (!teamId) return 0;

    const windowEnd = addDays(windowStart, WINDOW_DAYS - 1);
    const existing = schedule.filter(event =>
      event?.postseasonCareerEvent === true &&
      key(event?.date) >= windowStart &&
      key(event?.date) <= windowEnd &&
      event?.canceled !== true
    );

    let needed = Math.max(0, MIN_EVENTS_PER_WINDOW - existing.length);
    if (needed === 0) return 0;

    const candidates = [];
    for (let offset = 0; offset < WINDOW_DAYS; offset += 1) {
      const date = addDays(windowStart, offset);
      if (!date) continue;
      if (hasAnyEventOnDate(schedule, date)) continue;

      const nextGame = nextCareerGameDate(schedule, teamId, date);
      const previousGame = previousCareerGameDate(schedule, teamId, date);
      let score = 0;
      if (previousGame && addDays(previousGame, 1) === date) score += 5;
      if (nextGame && addDays(date, 1) === nextGame) score += 4;
      if (offset === 2 || offset === 4) score += 1;
      candidates.push({ date, score });
    }

    candidates.sort((a, b) => (b.score - a.score) || a.date.localeCompare(b.date));

    let added = 0;
    for (const candidate of candidates) {
      if (needed <= 0) break;
      const type = chooseEventType(schedule, teamId, candidate.date);
      schedule.push(buildCareerEvent(candidate.date, type, windowIndex, existing.length + added));
      added += 1;
      needed -= 1;
    }

    if (added > 0) {
      schedule.sort((a, b) =>
        String(a?.date || '').localeCompare(String(b?.date || '')) ||
        String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
      );
    }

    return added;
  }

  function syncCadence(options = {}) {
    const world = WorldEngine.state;
    const post = postseason();
    if (!world || !post?.initialized || !key(post.playoffStartDate)) return false;

    const teamId = careerTeamId();
    if (!teamId) return false;

    let changed = reconcileExistingCadence(world, teamId);

    const start = key(post.playoffStartDate);
    const championshipStart = key(post.championshipStartDate) || addDays(start, 12);
    const projectedEnd = addDays(championshipStart, 6);

    let windowIndex = 0;
    for (let cursor = start; cursor && cursor <= projectedEnd; cursor = addDays(cursor, WINDOW_DAYS)) {
      if (ensureWindowEvents(world, cursor, windowIndex) > 0) changed = true;
      windowIndex += 1;
    }

    post.cadence = {
      ...(post.cadence || {}),
      version: MODULE_VERSION,
      minimumCareerEventsPerSevenDays: MIN_EVENTS_PER_WINDOW,
      gamesEveryOtherDay: true,
      adaptiveAroundKnownCareerGames: true,
      syncedAt: new Date().toISOString(),
    };

    if (changed && options.save !== false) {
      WorldEngine.save?.();
    }

    return changed;
  }

  const originalReconcile =
    typeof WorldEngine.reconcileHighSchoolPostseason === 'function'
      ? WorldEngine.reconcileHighSchoolPostseason.bind(WorldEngine)
      : null;

  if (originalReconcile) {
    WorldEngine.reconcileHighSchoolPostseason = (...args) => {
      const result = originalReconcile(...args);
      syncCadence({ save: false });
      return result;
    };
  }

  WorldEngine.syncHighSchoolPostseasonCadence = syncCadence;

  syncCadence({ save: true });
  window.setInterval(() => syncCadence({ save: true }), 1000);
})();
