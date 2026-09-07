'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachObjectiveRoleReviewInstalled === true) return;
  WorldEngine.__coachObjectiveRoleReviewInstalled = true;

  const state = () => WorldEngine.state || null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

  function careerPlayer() {
    const world = state();
    if (!world) return null;
    const direct = WorldEngine.getCareerPlayer?.();
    if (direct) return direct;
    return (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true) || world.player || null;
  }

  function careerTeam(player) {
    const world = state();
    if (!world || !player) return null;
    return (world.teams || []).find(team => String(team?.teamId || '') === String(player?.teamId || world?.player?.teamId || '')) || null;
  }

  function statsFor(player) {
    const scoped = WorldEngine.getPlayerStatsByScope?.(player, 'regular-season');
    const s = scoped && typeof scoped === 'object' ? scoped : (player?.seasonStats || player?.stats || {});
    return {
      gp: Number(s?.gamesPlayed ?? s?.gp) || 0,
      points: Math.max(Number(s?.points ?? s?.pts) || 0, (Number(s?.goals ?? s?.g) || 0) + (Number(s?.assists ?? s?.a) || 0)),
      wins: Number(s?.wins ?? s?.w) || 0,
    };
  }

  function currentRole(player) {
    const pos = String(player?.position || '').toUpperCase();
    const assignment = player?.lineupAssignment || {};
    if (pos === 'G') {
      const raw = String(assignment?.role || player?.startingLine || player?.lineupStatus || '').toLowerCase();
      const tier = raw.includes('start') || Number(assignment?.line) === 1 ? 1 : 2;
      return { unit: 'goalie', tier, label: tier === 1 ? 'Starting Goalie' : 'Backup Goalie' };
    }
    if (assignment?.unit === 'defense' || ['D','LD','RD'].includes(pos)) {
      const tier = clamp(Number(assignment?.pair || assignment?.line) || Number(String(player?.startingLine || '').match(/\d+/)?.[0]) || 3, 1, 3);
      return { unit: 'defense', tier, label: `Pair ${tier}` };
    }
    const tier = clamp(Number(assignment?.line) || Number(String(player?.startingLine || '').match(/\d+/)?.[0]) || 4, 1, 4);
    return { unit: 'forward', tier, label: `Line ${tier}` };
  }

  function targetRole(role) {
    if (!role || role.tier <= 1) return null;
    const tier = role.tier - 1;
    return {
      ...role,
      tier,
      label: role.unit === 'goalie' ? 'Starting Goalie' : `${role.unit === 'defense' ? 'Pair' : 'Line'} ${tier}`,
    };
  }

  function slotFor(player, role) {
    if (role.unit === 'goalie') return role.tier === 1 ? 'g-starter' : 'g-backup';
    const current = String(player?.rosterSlot || player?.lineupAssignment?.rosterSlot || '').toLowerCase();
    if (role.unit === 'defense') {
      const side = current.endsWith('-rd') || String(player?.position || '').toUpperCase() === 'RD' ? 'rd' : 'ld';
      return `def-${role.tier}-${side}`;
    }
    const pos = String(player?.position || '').toUpperCase();
    const suffix = pos === 'C' || pos.includes('CENTER') ? 'c' : pos === 'RW' || pos.includes('RIGHT') ? 'rw' : 'lw';
    return `fwd-${role.tier}-${suffix}`;
  }

  function linePeers(team, player, role) {
    if (!team || !role) return [];
    const roster = Array.isArray(team.roster) ? team.roster : [];
    if (role.unit === 'goalie') {
      return roster.filter(p => p !== player && String(p?.rosterSlot || p?.lineupAssignment?.rosterSlot || '') === 'g-starter');
    }
    const prefix = role.unit === 'defense' ? `def-${role.tier}-` : `fwd-${role.tier}-`;
    return roster.filter(p => p !== player && String(p?.rosterSlot || p?.lineupAssignment?.rosterSlot || '').startsWith(prefix));
  }

  function applyRole(player, role, sourceObjectiveId) {
    const world = state();
    if (!world || !player || !role) return false;
    const slot = slotFor(player, role);
    const assignment = {
      ...(player.lineupAssignment || {}),
      line: role.tier,
      pair: role.unit === 'defense' ? role.tier : undefined,
      unit: role.unit === 'defense' ? 'defense' : role.unit === 'goalie' ? 'goalie' : 'forward',
      role: role.label,
      label: role.label,
      rosterSlot: slot,
      source: 'coach-objective-review',
      sourceObjectiveId,
    };

    const label = role.unit === 'goalie'
      ? role.label
      : role.unit === 'defense'
        ? `${role.tier}${role.tier === 1 ? 'st' : role.tier === 2 ? 'nd' : 'rd'} Pair`
        : `${role.tier}${role.tier === 1 ? 'st' : role.tier === 2 ? 'nd' : role.tier === 3 ? 'rd' : 'th'} Line`;

    for (const target of [player, world.player, typeof Game !== 'undefined' ? Game?.player : null]) {
      if (!target) continue;
      target.startingLine = label;
      target.rosterSlot = slot;
      target.lineupAssignment = structuredClone(assignment);
    }
    return true;
  }

  function evaluatePromotion(objective, player) {
    const role = currentRole(player);
    const next = targetRole(role);
    if (!next) return { approved: false, reason: 'already-top-role', role, next: null, score: 0 };

    const team = careerTeam(player);
    const peers = linePeers(team, player, next);
    const peerAvg = peers.length
      ? peers.reduce((sum, p) => sum + (Number(p?.overall) || 60), 0) / peers.length
      : Number(player?.overall) || 60;
    const overall = Number(player?.overall) || 60;
    const trust = clamp(player?.coachTrust, 0, 100) || 50;
    const current = objective?.current || {};
    const targetProduction = Number(objective?.targetWins) > 0 ? Number(objective.targetWins) : Number(objective?.targetPoints) || 1;
    const actualProduction = Number(objective?.targetWins) > 0 ? Number(current?.wins) || 0 : Number(current?.points) || 0;
    const productionRatio = clamp(actualProduction / Math.max(1, targetProduction), 0, 1.5);
    const abilityScore = clamp(70 + (overall - peerAvg) * 6, 35, 95);
    const reviewScore = Math.round(trust * 0.45 + abilityScore * 0.35 + clamp(productionRatio * 70, 0, 100) * 0.20);
    return {
      approved: trust >= 68 && overall >= peerAvg - 4 && reviewScore >= 68,
      reason: 'promotion-review',
      role,
      next,
      peerAvg: Math.round(peerAvg * 10) / 10,
      overall,
      trust,
      reviewScore,
    };
  }

  function recordReview(objective, result) {
    const world = state();
    const player = careerPlayer();
    if (!world || !player || !objective || !result) return null;
    const entry = {
      objectiveId: objective.id || null,
      date: String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10),
      outcome: objective.status,
      objectiveType: objective.outcome || null,
      approved: result.approved === true,
      oldRole: result.role?.label || currentRole(player).label,
      newRole: result.approved ? result.next?.label || null : null,
      reviewScore: result.reviewScore ?? null,
      playerOverall: Number(player?.overall) || null,
      coachTrust: Number(player?.coachTrust) || null,
      peerAverageOverall: result.peerAvg ?? null,
    };
    if (!Array.isArray(world.coachRoleReviewHistory)) world.coachRoleReviewHistory = [];
    world.coachRoleReviewHistory.push(entry);
    world.coachRoleReviewHistory = world.coachRoleReviewHistory.slice(-24);
    player.lastCoachRoleReview = entry;
    if (world.player && world.player !== player) world.player.lastCoachRoleReview = structuredClone(entry);
    return entry;
  }

  function processCompletedObjective(objective) {
    const player = careerPlayer();
    if (!player || !objective || objective.status !== 'completed' || objective.roleReviewProcessed === true) return null;

    let result = { approved: false, reason: 'objective-complete-no-promotion', role: currentRole(player), next: null };
    if (objective.outcome === 'promotion_review') {
      result = evaluatePromotion(objective, player);
      if (result.approved && result.next) applyRole(player, result.next, objective.id || null);
    }

    objective.roleReviewProcessed = true;
    objective.roleReview = {
      approved: result.approved === true,
      reviewScore: result.reviewScore ?? null,
      oldRole: result.role?.label || null,
      newRole: result.approved ? result.next?.label || null : null,
    };
    if (player.activeCoachObjective?.id === objective.id) player.activeCoachObjective = objective;
    if (state()?.activeCoachObjective?.id === objective.id) state().activeCoachObjective = objective;
    recordReview(objective, result);

    const opportunity = player.coachMeetingOpportunity;
    if (opportunity && String(opportunity.sourceObjectiveId || '') === String(objective.id || '')) {
      opportunity.consumed = true;
      opportunity.reviewApproved = result.approved === true;
      opportunity.reviewScore = result.reviewScore ?? null;
    }
    try { WorldEngine.save?.(); } catch (_) {}
    try { globalThis.refreshCareerUI?.(); } catch (_) {}
    return result;
  }

  function processFailedObjective(objective, player) {
    if (!objective || !player || objective.status !== 'active') return null;
    const s = statsFor(player);
    const baseline = objective.baseline || {};
    const games = Math.max(0, s.gp - (Number(baseline.gp) || 0));
    const points = Math.max(0, s.points - (Number(baseline.points) || 0));
    const wins = Math.max(0, s.wins - (Number(baseline.wins) || 0));
    const productionTarget = Number(objective.targetWins) > 0 ? Number(objective.targetWins) : Number(objective.targetPoints) || 0;
    const productionNow = Number(objective.targetWins) > 0 ? wins : points;
    if (games < (Number(objective.targetGames) || 3) || productionNow >= productionTarget) return null;

    objective.status = 'failed';
    objective.progress = 100;
    objective.current = { games, points, wins, progress: 100, completed: false };
    objective.failedDate = String(state()?.season?.currentDate || state()?.currentDate || '').slice(0, 10);
    objective.roleReviewProcessed = true;
    objective.roleReview = { approved: false, oldRole: currentRole(player).label, newRole: null, reason: 'objective-missed' };

    player.coachTrust = clamp((Number(player.coachTrust) || 50) - 1, 0, 100);
    if (state()?.player && state().player !== player) state().player.coachTrust = player.coachTrust;
    recordReview(objective, { approved: false, role: currentRole(player), next: null });
    try { WorldEngine.save?.(); } catch (_) {}
    return objective;
  }

  function syncRoleReview() {
    const player = careerPlayer();
    const objective = state()?.activeCoachObjective || player?.activeCoachObjective || null;
    if (!player || !objective) return null;
    if (objective.status === 'active') processFailedObjective(objective, player);
    if (objective.status === 'completed') return processCompletedObjective(objective);
    return objective.roleReview || null;
  }

  const originalGetObjective = WorldEngine.getActiveCoachObjective;
  if (typeof originalGetObjective === 'function') {
    WorldEngine.getActiveCoachObjective = function(...args) {
      const result = originalGetObjective.apply(this, args);
      syncRoleReview();
      return result;
    };
  }

  const originalRenderObjective = WorldEngine.renderActiveCoachObjective;
  if (typeof originalRenderObjective === 'function') {
    WorldEngine.renderActiveCoachObjective = function(...args) {
      syncRoleReview();
      return originalRenderObjective.apply(this, args);
    };
  }

  WorldEngine.processCoachObjectiveRoleReview = syncRoleReview;

  WorldEngine.runCoachObjectiveOutcomeDiagnostic = function(mode = 'success') {
    const world = state();
    const player = careerPlayer();
    const objective = world?.activeCoachObjective || player?.activeCoachObjective || null;
    if (!world || !player || !objective) return { success: false, reason: 'no-active-coach-objective' };

    const baseline = objective.baseline || {};
    const targetGames = Number(objective.targetGames) || 3;
    const targetPoints = Number(objective.targetPoints) || 0;
    const targetWins = Number(objective.targetWins) || 0;
    const fakeStats = {
      gamesPlayed: (Number(baseline.gp) || 0) + targetGames,
      points: (Number(baseline.points) || 0) + (mode === 'success' ? targetPoints : Math.max(0, targetPoints - 1)),
      wins: (Number(baseline.wins) || 0) + (mode === 'success' ? targetWins : Math.max(0, targetWins - 1)),
    };
    player.seasonStats = { ...(player.seasonStats || {}), ...fakeStats };
    if (world.player && world.player !== player) world.player.seasonStats = structuredClone(player.seasonStats);

    WorldEngine.getActiveCoachObjective?.();
    syncRoleReview();
    return {
      success: true,
      mode,
      objective: world.activeCoachObjective || player.activeCoachObjective,
      role: currentRole(player),
      review: player.lastCoachRoleReview || null,
    };
  };

  requestAnimationFrame(syncRoleReview);
})();
