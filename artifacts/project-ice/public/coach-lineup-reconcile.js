'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachLineupReconcileInstalled === true) return;
  WorldEngine.__coachLineupReconcileInstalled = true;

  function careerPlayer() {
    const world = WorldEngine.state;
    if (!world) return null;
    return WorldEngine.getCareerPlayer?.() ||
      (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true) ||
      world.player || null;
  }

  function activeObjective() {
    const player = careerPlayer();
    return WorldEngine.state?.activeCoachObjective || player?.activeCoachObjective || null;
  }

  function reconcileIfNeeded(reason = '') {
    const player = careerPlayer();
    const objective = activeObjective();
    if (!player || !objective || objective.coachLineupReconciled === true) return false;

    const promoted = objective?.roleReview?.approved === true && Boolean(objective?.roleReview?.newRole);
    const demoted = objective?.roleSecurityResult?.action === 'demoted';
    if (!promoted && !demoted) return false;

    const teamId = String(player?.teamId || WorldEngine.state?.player?.teamId || '');
    if (!teamId || typeof WorldEngine.refreshTeamRosterManagement !== 'function') return false;

    /*
     * Coach role application reserves the career player's newly earned slot.
     * Re-run the canonical NPC lineup manager immediately afterwards so the
     * player who previously occupied that slot is displaced/re-sorted instead
     * of leaving two roster entries pointing at the same line/pair/goalie job.
     */
    WorldEngine.refreshTeamRosterManagement(teamId, { save: false });
    objective.coachLineupReconciled = true;
    objective.coachLineupReconciledReason = reason || (promoted ? 'promotion' : 'demotion');

    if (player.activeCoachObjective?.id === objective.id) {
      player.activeCoachObjective.coachLineupReconciled = true;
      player.activeCoachObjective.coachLineupReconciledReason = objective.coachLineupReconciledReason;
    }

    try { WorldEngine.save?.(); } catch (_) {}
    try { globalThis.refreshCareerUI?.(); } catch (_) {}
    return true;
  }

  const baseRoleReview = WorldEngine.processCoachObjectiveRoleReview;
  if (typeof baseRoleReview === 'function') {
    WorldEngine.processCoachObjectiveRoleReview = function(...args) {
      const result = baseRoleReview.apply(this, args);
      reconcileIfNeeded('promotion-review');
      return result;
    };
  }

  const baseSecurity = WorldEngine.processCoachRoleSecurity;
  if (typeof baseSecurity === 'function') {
    WorldEngine.processCoachRoleSecurity = function(...args) {
      const result = baseSecurity.apply(this, args);
      reconcileIfNeeded('role-security-review');
      return result;
    };
  }

  requestAnimationFrame(() => reconcileIfNeeded('load-repair'));
})();
