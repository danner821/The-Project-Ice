'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const MODULE_VERSION = 1;
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

  function hasAnyEventOnDate(schedule, date) {
    return schedule.some(event =>
      key(event?.date) === date &&
      event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed'
    );
  }

  function nextCareerGameDate(schedule, teamId, afterDate) {
    return schedule
      .filter(event => isCareerPlayoffGame(event, teamId))
      .map(event => key(event.date))
      .filter(date => date && date >= afterDate)
      .sort()[0] || null;
  }

  function previousCareerGameDate(schedule, teamId, beforeDate) {
    return schedule
      .filter(event => isCareerPlayoffGame(event, teamId))
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

  function buildCareerEvent(date, type, windowIndex, slotIndex) {
    const practice = type === 'practice';
    const id = `hs-playoff-${type}-${date}`;
    return {
      id,
      eventId: id,
      type,
      eventType: type,
      date,
      label: practice ? 'Playoff Practice' : 'Recovery Session',
      shortLabel: practice ? 'Practice' : 'Recovery',
      icon: practice ? '🏒' : '😴',
      location: practice ? 'Team Rink' : 'Recovery Room',
      objective: practice
        ? 'Stay sharp and prepare for the next playoff test.'
        : 'Reset physically and mentally between postseason games.',
      isPlayoff: true,
      seasonType: 'playoffs',
      postseasonCareerEvent: true,
      completed: false,
      played: false,
      status: 'scheduled',
      cadenceVersion: MODULE_VERSION,
      cadenceWindow: windowIndex,
      cadenceSlot: slotIndex,
    };
  }

  function ensureWindowEvents(world, post, windowStart, windowIndex) {
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

      const careerGameToday = schedule.some(event =>
        isCareerPlayoffGame(event, teamId) && key(event.date) === date
      );
      if (careerGameToday) continue;

      const nextGame = nextCareerGameDate(schedule, teamId, date);
      const previousGame = previousCareerGameDate(schedule, teamId, date);
      let score = 0;
      if (previousGame && addDays(previousGame, 1) === date) score += 4;
      if (nextGame && addDays(date, 1) === nextGame) score += 3;
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

    const start = key(post.playoffStartDate);
    const championshipStart = key(post.championshipStartDate) || addDays(start, 12);
    const projectedEnd = addDays(championshipStart, 6);

    let added = 0;
    let windowIndex = 0;
    for (let cursor = start; cursor && cursor <= projectedEnd; cursor = addDays(cursor, WINDOW_DAYS)) {
      added += ensureWindowEvents(world, post, cursor, windowIndex);
      windowIndex += 1;
    }

    post.cadence = {
      ...(post.cadence || {}),
      version: MODULE_VERSION,
      minimumCareerEventsPerSevenDays: MIN_EVENTS_PER_WINDOW,
      gamesEveryOtherDay: true,
      syncedAt: new Date().toISOString(),
    };

    if (added > 0 && options.save !== false) {
      WorldEngine.save?.();
    }

    return added > 0;
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
