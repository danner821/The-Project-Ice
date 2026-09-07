'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachMeetingFoundationInstalled === true) return;
  WorldEngine.__coachMeetingFoundationInstalled = true;

  const state = () => WorldEngine.state || null;
  const idOf = player => String(player?.sourcePlayerId || player?.playerId || player?.id || '');

  function careerPlayer() {
    if (typeof WorldEngine.getCareerPlayer === 'function') {
      const direct = WorldEngine.getCareerPlayer();
      if (direct) return direct;
    }
    const world = state();
    const id = String(world?.player?.playerId || world?.player?.id || 'career-player');
    return WorldEngine.getPlayerById?.(id) || world?.player || null;
  }

  function seasonStartYear() {
    const world = state();
    const date = String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10);
    const direct = Number(world?.season?.seasonStartYear);
    if (Number.isFinite(direct) && direct > 2000) return direct;
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    if (!Number.isFinite(year)) return null;
    return month >= 8 ? year : year - 1;
  }

  function dateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function occupiedDates() {
    return new Set((state()?.schedule || []).map(event => String(event?.date || '').slice(0, 10)).filter(Boolean));
  }

  function nearestOpenDate(preferredDate) {
    const occupied = occupiedDates();
    if (!occupied.has(preferredDate)) return preferredDate;
    const base = new Date(`${preferredDate}T12:00:00`);
    for (let offset = 1; offset <= 5; offset += 1) {
      for (const direction of [1, -1]) {
        const probe = new Date(base);
        probe.setDate(base.getDate() + offset * direction);
        const key = probe.toISOString().slice(0, 10);
        if (!occupied.has(key)) return key;
      }
    }
    return preferredDate;
  }

  function roleLabel(player) {
    const assignment = player?.lineupAssignment || {};
    const pos = String(player?.position || '').toUpperCase();
    if (pos === 'G') {
      const raw = String(assignment?.role || player?.startingLine || player?.lineupStatus || '').toLowerCase();
      if (raw.includes('start') || Number(assignment?.line) === 1) return 'Starting Goalie';
      if (raw.includes('backup') || Number(assignment?.line) === 2) return 'Backup Goalie';
      return 'Goalie Role';
    }
    if (assignment?.unit === 'defense' || ['D','LD','RD'].includes(pos)) {
      const pair = Number(assignment?.pair || assignment?.line) || Number(String(player?.startingLine || '').match(/\d+/)?.[0]) || null;
      return pair ? `Pair ${pair}` : (player?.startingLine || 'Defense Role');
    }
    const line = Number(assignment?.line) || Number(String(player?.startingLine || '').match(/\d+/)?.[0]) || null;
    return line ? `Line ${line}` : (player?.startingLine || 'Forward Role');
  }

  function recentPerformance(player) {
    const games = Array.isArray(player?.gameLog) ? player.gameLog.slice(-5) : [];
    if (!games.length) {
      const stats = player?.seasonStats || {};
      const gp = Number(stats.gamesPlayed || stats.gp) || 0;
      if (!gp) return { signal: 'unknown', summary: 'The staff is still waiting for a meaningful sample of games.' };
      const points = Number(stats.points) || (Number(stats.goals) || 0) + (Number(stats.assists) || 0);
      const ppg = points / gp;
      return {
        signal: ppg >= 1 ? 'strong' : ppg >= 0.45 ? 'steady' : 'cold',
        summary: `${points} points through ${gp} games`,
      };
    }
    const points = games.reduce((sum, game) => sum + Number(game?.points || 0), 0);
    const ratings = games.map(game => Number(game?.gameRating)).filter(Number.isFinite);
    const avg = ratings.length ? ratings.reduce((a,b) => a+b, 0) / ratings.length : null;
    const signal = (avg !== null && avg >= 7.4) || points >= 5 ? 'strong' : (avg !== null && avg < 6.4) || points <= 1 ? 'cold' : 'steady';
    return { signal, summary: `${points} points in the last ${games.length} games` };
  }

  function meetingContext(player) {
    const trust = Math.max(0, Math.min(100, Number(player?.coachTrust) || 50));
    const role = roleLabel(player);
    const form = recentPerformance(player);
    const overall = Number(player?.overall) || 60;
    const seasonStart = Number(player?.seasonDevelopmentSnapshot?.overall || player?.development?.seasonStartingOverall || overall);
    const growth = overall - seasonStart;
    return {
      playerId: idOf(player),
      role,
      coachTrust: trust,
      performanceSignal: form.signal,
      performanceSummary: form.summary,
      overall,
      growth,
      powerPlayUnit: player?.powerPlayUnit || player?.specialTeamsAssignments?.powerPlay || null,
      penaltyKillUnit: player?.penaltyKillUnit || player?.specialTeamsAssignments?.penaltyKill || null,
    };
  }

  function syncCoachMeetings(options = {}) {
    const world = state();
    const player = careerPlayer();
    const year = seasonStartYear();
    if (!world || !player || !Number.isFinite(year)) return [];
    if (!Array.isArray(world.schedule)) world.schedule = [];

    /* Every two months during the HS competitive year: Oct, Dec, Feb. */
    const templates = [
      { key: 'oct', month: 10, day: 15, meetingType: 'expectations', label: 'Coach Meeting' },
      { key: 'dec', month: 12, day: 15, meetingType: 'role', label: 'Coach Meeting' },
      { key: 'feb', month: 2, day: 15, meetingType: 'development', label: 'Coach Meeting', yearOffset: 1 },
    ];

    const added = [];
    for (const template of templates) {
      const eventId = `hs-${year}-${template.key}-coach-meeting`;
      const existing = world.schedule.find(event => String(event?.id || event?.eventId || '') === eventId);
      if (existing) continue;
      const preferred = dateKey(year + (template.yearOffset || 0), template.month, template.day);
      const date = nearestOpenDate(preferred);
      const context = meetingContext(player);
      const event = {
        id: eventId,
        eventId,
        canonicalEventId: eventId,
        type: 'coach-meeting',
        eventType: 'coach-meeting',
        meetingType: template.meetingType,
        date,
        label: template.label,
        title: template.label,
        subtitle: 'Your coach wants to review your current role and what comes next.',
        description: 'A private check-in about your performance, development, and lineup opportunity.',
        icon: '🏒',
        isCareerEvent: true,
        requiresPlayerInteraction: true,
        completed: false,
        coachMeetingContext: context,
      };
      world.schedule.push(event);
      added.push(event);
    }

    world.schedule.sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')) || String(a?.id || '').localeCompare(String(b?.id || '')));
    world.coachMeetingCadence = {
      version: 1,
      frequency: 'every-two-months',
      seasonStartYear: year,
      eventIds: templates.map(template => `hs-${year}-${template.key}-coach-meeting`),
    };

    if (added.length && options.save !== false) WorldEngine.save?.();
    try { globalThis.refreshScheduleEvents?.(); } catch (_) {}
    return added;
  }

  WorldEngine.getCareerCoachMeetingContext = () => meetingContext(careerPlayer());
  WorldEngine.syncCoachMeetingCadence = syncCoachMeetings;

  window.addEventListener('projectice:next-high-school-season-started', () => {
    syncCoachMeetings({ save: true });
  });

  syncCoachMeetings({ save: false });
})();
