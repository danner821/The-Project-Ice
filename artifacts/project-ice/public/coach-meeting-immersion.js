'use strict';

/* global WorldEngine, EventSystem */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachMeetingImmersionInstalled === true) return;
  WorldEngine.__coachMeetingImmersionInstalled = true;

  const state = () => WorldEngine.state || null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

  function careerPlayer() {
    if (typeof WorldEngine.getCareerPlayer === 'function') {
      const direct = WorldEngine.getCareerPlayer();
      if (direct) return direct;
    }
    const world = state();
    const id = String(world?.player?.playerId || world?.player?.id || 'career-player');
    return WorldEngine.getPlayerById?.(id) || world?.player || null;
  }

  function canonicalMeeting(eventId, eventData = null) {
    if (eventData && String(eventData?.type || eventData?.eventType || '').toLowerCase().includes('meeting')) {
      return eventData;
    }
    return (state()?.schedule || []).find(event => {
      const id = String(event?.eventId || event?.id || '');
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      return id === String(eventId || '') && type.includes('meeting');
    }) || null;
  }

  function statsFor(player) {
    const scoped = WorldEngine.getPlayerStatsByScope?.(player, 'regular-season');
    const s = scoped && typeof scoped === 'object' ? scoped : (player?.seasonStats || player?.stats || {});
    return {
      gp: Number(s?.gamesPlayed ?? s?.gp) || 0,
      goals: Number(s?.goals ?? s?.g) || 0,
      assists: Number(s?.assists ?? s?.a) || 0,
      points: Math.max(
        Number(s?.points ?? s?.pts) || 0,
        (Number(s?.goals ?? s?.g) || 0) + (Number(s?.assists ?? s?.a) || 0),
      ),
      plusMinus: Number(s?.plusMinus ?? s?.['+/-']) || 0,
      wins: Number(s?.wins ?? s?.w) || 0,
      saves: Number(s?.saves ?? s?.sv) || 0,
    };
  }

  function parseRole(player) {
    const pos = String(player?.position || '').toUpperCase();
    const assignment = player?.lineupAssignment || {};
    if (pos === 'G') {
      const raw = String(assignment?.role || player?.startingLine || player?.lineupStatus || '').toLowerCase();
      if (raw.includes('start') || Number(assignment?.line) === 1) return { label: 'Starting Goalie', tier: 1, unit: 'goalie' };
      if (raw.includes('backup') || Number(assignment?.line) === 2) return { label: 'Backup Goalie', tier: 2, unit: 'goalie' };
      return { label: 'Goalie Role', tier: 2, unit: 'goalie' };
    }
    if (assignment?.unit === 'defense' || ['D','LD','RD'].includes(pos)) {
      const pair = Number(assignment?.pair || assignment?.line) || Number(String(player?.startingLine || '').match(/\d+/)?.[0]) || 3;
      return { label: `Pair ${pair}`, tier: pair, unit: 'defense' };
    }
    const line = Number(assignment?.line) || Number(String(player?.startingLine || '').match(/\d+/)?.[0]) || 4;
    return { label: `Line ${line}`, tier: line, unit: 'forward' };
  }

  function recentSignal(player) {
    const logs = Array.isArray(player?.gameLog) ? player.gameLog.slice(-5) : [];
    if (logs.length) {
      const points = logs.reduce((sum, game) => sum + Number(game?.points || 0), 0);
      const ratings = logs.map(game => Number(game?.gameRating)).filter(Number.isFinite);
      const avg = ratings.length ? ratings.reduce((a,b) => a+b, 0) / ratings.length : null;
      if ((avg !== null && avg >= 7.4) || points >= 5) return 'strong';
      if ((avg !== null && avg < 6.4) || points <= 1) return 'cold';
      return 'steady';
    }
    const s = statsFor(player);
    if (!s.gp) return 'unknown';
    const ppg = s.points / s.gp;
    if (ppg >= 1) return 'strong';
    if (ppg < 0.4) return 'cold';
    return 'steady';
  }

  function nextRole(role) {
    if (role.unit === 'goalie') return role.tier > 1 ? 'Starting Goalie' : null;
    if (role.tier > 1) return `${role.unit === 'defense' ? 'Pair' : 'Line'} ${role.tier - 1}`;
    return null;
  }

  function buildPlan(event, player) {
    const role = parseRole(player);
    const trust = clamp(player?.coachTrust, 0, 100) || 50;
    const signal = recentSignal(player);
    const stats = statsFor(player);
    const betterRole = nextRole(role);
    const highOpportunity = Boolean(betterRole && trust >= 68 && signal !== 'cold');
    const protectRole = !betterRole;
    const rebuild = trust < 55 || signal === 'cold';

    let title;
    let objectiveText;
    let coachMessage;
    let targetPoints = 0;
    let targetWins = 0;
    const targetGames = 3;
    let outcome = 'consistency_review';

    if (rebuild) {
      title = 'Rebuild Coach Trust';
      if (role.unit === 'goalie') {
        targetWins = 1;
        objectiveText = `Play 3 more games and earn at least 1 win to steady your role.`;
      } else {
        targetPoints = role.unit === 'defense' ? 1 : 2;
        objectiveText = `Play 3 more games and produce at least ${targetPoints} point${targetPoints === 1 ? '' : 's'} to steady your role.`;
      }
      coachMessage = `You're on ${role.label} right now. I need more consistency before we talk about moving you up. Settle your game over the next three, make reliable plays, and give me something I can trust every night.`;
      outcome = 'rebuild_trust';
    } else if (highOpportunity) {
      title = `Earn a ${betterRole} Look`;
      if (role.unit === 'goalie') {
        targetWins = 2;
        objectiveText = `Play 3 more games and earn 2 wins to make the case for the starting job.`;
      } else {
        targetPoints = role.unit === 'defense' ? 2 : 3;
        objectiveText = `Play 3 more games and produce at least ${targetPoints} points to earn a ${betterRole} review.`;
      }
      coachMessage = `You're holding ${role.label}, and you've put yourself in position to push higher. Give me three strong games and I'll take a serious look at you for ${betterRole}.`;
      outcome = 'promotion_review';
    } else if (protectRole) {
      title = `Hold Your ${role.label} Role`;
      if (role.unit === 'goalie') {
        targetWins = 2;
        objectiveText = 'Play 3 more games and earn 2 wins to reinforce your place as the starter.';
      } else {
        targetPoints = role.unit === 'defense' ? 2 : 3;
        objectiveText = `Play 3 more games and produce at least ${targetPoints} points to reinforce your top role.`;
      }
      coachMessage = `You've earned ${role.label}. Now I need you to show me you can own it. The next three games are about setting the standard and keeping that spot.`;
      outcome = 'protect_role';
    } else {
      title = `Build Momentum on ${role.label}`;
      if (role.unit === 'goalie') {
        targetWins = 1;
        objectiveText = 'Play 3 more games and earn at least 1 win to strengthen your case for more responsibility.';
      } else {
        targetPoints = role.unit === 'defense' ? 1 : 2;
        objectiveText = `Play 3 more games and produce at least ${targetPoints} point${targetPoints === 1 ? '' : 's'} to strengthen your case for more responsibility.`;
      }
      coachMessage = `You're on ${role.label}. I like parts of what I'm seeing, but I need a stronger body of work before I change your role. Give me three dependable games and we'll revisit it.`;
    }

    const context = {
      role: role.label,
      coachTrust: trust,
      recentForm: signal,
      overall: Number(player?.overall) || null,
      powerPlayUnit: player?.powerPlayUnit || player?.specialTeamsAssignments?.powerPlay || null,
      penaltyKillUnit: player?.penaltyKillUnit || player?.specialTeamsAssignments?.penaltyKill || null,
    };

    return {
      id: `${String(event?.eventId || event?.id || 'coach-meeting')}-objective`,
      meetingEventId: String(event?.eventId || event?.id || ''),
      createdDate: String(event?.date || state()?.season?.currentDate || '').slice(0, 10),
      title,
      objectiveText,
      coachMessage,
      targetGames,
      targetPoints,
      targetWins,
      baseline: stats,
      context,
      outcome,
      status: 'pending',
      progress: 0,
    };
  }

  function applyMeetingPresentation(event, player) {
    if (!event || !player) return event;
    const plan = buildPlan(event, player);
    event.coachMeetingPlan = plan;
    event.coachMeetingContext = plan.context;
    event.icon = '📋';
    event.label = 'Coach Meeting';
    event.title = 'Coach Meeting';
    event.location = "Coach's Office";
    event.subtitle = `${plan.context.role} · Coach Trust ${Math.round(plan.context.coachTrust)}%`;
    event.description = plan.coachMessage;
    event.objective = plan.objectiveText;
    event.coachNote = plan.coachMessage;
    return event;
  }

  function activateObjective(event) {
    const world = state();
    const player = careerPlayer();
    if (!world || !player || !event) return null;
    const plan = event.coachMeetingPlan || buildPlan(event, player);
    const objective = {
      ...structuredClone(plan),
      baseline: statsFor(player),
      status: 'active',
      activatedDate: String(world?.season?.currentDate || world?.currentDate || event?.date || '').slice(0, 10),
      progress: 0,
    };
    world.activeCoachObjective = objective;
    player.activeCoachObjective = objective;
    if (world.player && world.player !== player) world.player.activeCoachObjective = structuredClone(objective);
    return objective;
  }

  function objectiveProgress(objective, player) {
    const current = statsFor(player);
    const baseline = objective?.baseline || {};
    const games = Math.max(0, current.gp - (Number(baseline.gp) || 0));
    const points = Math.max(0, current.points - (Number(baseline.points) || 0));
    const wins = Math.max(0, current.wins - (Number(baseline.wins) || 0));
    const gamePart = clamp(games / Math.max(1, Number(objective?.targetGames) || 3), 0, 1);
    const productionTarget = Number(objective?.targetWins) > 0 ? Number(objective.targetWins) : Number(objective?.targetPoints) || 0;
    const productionNow = Number(objective?.targetWins) > 0 ? wins : points;
    const productionPart = productionTarget > 0 ? clamp(productionNow / productionTarget, 0, 1) : 1;
    const progress = Math.round((gamePart * 0.55 + productionPart * 0.45) * 100);
    const completed = games >= (Number(objective?.targetGames) || 3) && productionNow >= productionTarget;
    return { games, points, wins, progress, completed };
  }

  function finalizeObjective(objective, player) {
    const world = state();
    if (!world || !objective || !player || objective.status === 'completed') return;
    objective.status = 'completed';
    objective.completedDate = String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10);
    objective.progress = 100;

    const oldTrust = clamp(player?.coachTrust, 0, 100) || 50;
    const trustGain = objective.outcome === 'rebuild_trust' ? 4 : 3;
    player.coachTrust = clamp(oldTrust + trustGain, 0, 100);
    if (world.player && world.player !== player) world.player.coachTrust = player.coachTrust;

    player.coachMeetingOpportunity = {
      sourceObjectiveId: objective.id,
      createdDate: objective.completedDate,
      type: objective.outcome,
      currentRole: objective.context?.role || null,
      earned: true,
      consumed: false,
      strength: objective.outcome === 'promotion_review' ? 8 : objective.outcome === 'protect_role' ? 5 : 4,
    };

    if (!Array.isArray(world.coachObjectiveHistory)) world.coachObjectiveHistory = [];
    world.coachObjectiveHistory.push(structuredClone(objective));
    world.coachObjectiveHistory = world.coachObjectiveHistory.slice(-24);
  }

  function syncObjective() {
    const world = state();
    const player = careerPlayer();
    const objective = world?.activeCoachObjective || player?.activeCoachObjective || null;
    if (!world || !player || !objective || objective.status !== 'active') return objective;
    const p = objectiveProgress(objective, player);
    objective.progress = p.progress;
    objective.current = p;
    player.activeCoachObjective = objective;
    if (p.completed) finalizeObjective(objective, player);
    return objective;
  }

  function renderObjectiveToHome() {
    const objective = syncObjective();
    if (!objective || !['active','completed'].includes(objective.status)) return;
    const current = objective.current || { games: objective.targetGames || 0, points: 0, wins: 0, progress: objective.progress || 0 };
    const title = document.getElementById('hub-current-objective-title');
    const text = document.getElementById('hub-current-objective');
    const stage = document.getElementById('home-objective-stage');
    const fill = document.getElementById('home-objective-progress-fill');
    const label = document.getElementById('home-objective-progress-label');
    if (title) title.textContent = objective.status === 'completed' ? `${objective.title} — Complete` : objective.title;
    if (text) text.textContent = objective.objectiveText;
    if (stage) stage.textContent = objective.status === 'completed' ? 'Coach Objective Complete' : `Coach Objective · ${current.games}/${objective.targetGames} Games`;
    if (fill) fill.style.width = `${objective.status === 'completed' ? 100 : current.progress}%`;
    if (label) label.textContent = `${objective.status === 'completed' ? 100 : current.progress}%`;
  }

  if (typeof EventSystem !== 'undefined' && typeof EventSystem.openEvent === 'function') {
    const baseOpen = EventSystem.openEvent.bind(EventSystem);
    EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
      const meeting = canonicalMeeting(eventId, eventData);
      if (!meeting) return baseOpen(eventId, origin, eventData);
      const player = careerPlayer();
      const presented = applyMeetingPresentation(meeting, player);
      return baseOpen(eventId, origin, presented);
    };
  }

  if (typeof WorldEngine.completeCoachMeetingEvent === 'function') {
    const baseComplete = WorldEngine.completeCoachMeetingEvent.bind(WorldEngine);
    WorldEngine.completeCoachMeetingEvent = function(...args) {
      const eventId = typeof args[0] === 'string'
        ? args[0]
        : String(args[0]?.eventId || args[0]?.id || '');
      const meeting = canonicalMeeting(eventId, typeof args[0] === 'object' ? args[0] : null);
      if (meeting) applyMeetingPresentation(meeting, careerPlayer());
      const result = baseComplete(...args);
      if (meeting) {
        activateObjective(meeting);
        try { WorldEngine.save?.(); } catch (_) {}
        requestAnimationFrame(renderObjectiveToHome);
      }
      return result;
    };
  }

  if (typeof globalThis.refreshCareerUI === 'function') {
    const baseRefresh = globalThis.refreshCareerUI;
    globalThis.refreshCareerUI = function(...args) {
      const result = baseRefresh.apply(this, args);
      requestAnimationFrame(renderObjectiveToHome);
      return result;
    };
  }

  WorldEngine.getActiveCoachObjective = () => syncObjective();
  WorldEngine.renderActiveCoachObjective = renderObjectiveToHome;
  WorldEngine.buildCoachMeetingPlan = event => buildPlan(event, careerPlayer());

  for (const event of state()?.schedule || []) {
    const type = String(event?.type || event?.eventType || '').toLowerCase();
    if (type.includes('meeting')) applyMeetingPresentation(event, careerPlayer());
  }

  requestAnimationFrame(renderObjectiveToHome);
})();
