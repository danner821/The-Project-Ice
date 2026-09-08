'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachRoleSecurityInstalled === true) return;
  WorldEngine.__coachRoleSecurityInstalled = true;

  const state = () => WorldEngine.state || null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

  function careerPlayer() {
    const world = state();
    if (!world) return null;
    return WorldEngine.getCareerPlayer?.() ||
      (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true) ||
      world.player || null;
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

  function worseRole(role) {
    if (!role) return null;
    if (role.unit === 'goalie') return role.tier === 1 ? { ...role, tier: 2, label: 'Backup Goalie' } : null;
    const max = role.unit === 'defense' ? 3 : 4;
    if (role.tier >= max) return null;
    const tier = role.tier + 1;
    return { ...role, tier, label: `${role.unit === 'defense' ? 'Pair' : 'Line'} ${tier}` };
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

  function applyRole(player, role, sourceObjectiveId) {
    const world = state();
    if (!world || !player || !role) return false;
    const slot = slotFor(player, role);
    const assignment = {
      ...(player.lineupAssignment || {}),
      line: role.tier,
      pair: role.unit === 'defense' ? role.tier : undefined,
      unit: role.unit,
      role: role.label,
      label: role.label,
      rosterSlot: slot,
      source: 'coach-role-security-review',
      sourceObjectiveId,
    };
    const display = role.unit === 'goalie'
      ? role.label
      : role.unit === 'defense'
        ? `${role.tier}${role.tier === 1 ? 'st' : role.tier === 2 ? 'nd' : 'rd'} Pair`
        : `${role.tier}${role.tier === 1 ? 'st' : role.tier === 2 ? 'nd' : role.tier === 3 ? 'rd' : 'th'} Line`;
    for (const target of [player, world.player, typeof Game !== 'undefined' ? Game?.player : null]) {
      if (!target) continue;
      target.startingLine = display;
      target.rosterSlot = slot;
      target.lineupAssignment = structuredClone(assignment);
    }
    return true;
  }

  function riskState(player) {
    if (!player.coachRoleRisk || typeof player.coachRoleRisk !== 'object') {
      player.coachRoleRisk = { strikes: 0, warned: false, lastOutcome: null };
    }
    return player.coachRoleRisk;
  }

  function syncCopies(player) {
    const world = state();
    if (world?.player && world.player !== player) world.player.coachRoleRisk = structuredClone(player.coachRoleRisk || {});
  }

  function processSecurity() {
    const world = state();
    const player = careerPlayer();
    const objective = world?.activeCoachObjective || player?.activeCoachObjective || null;
    if (!world || !player || !objective || objective.roleSecurityProcessed === true) return null;

    const risk = riskState(player);
    if (objective.status === 'completed') {
      if (['rebuild_trust','protect_role','role_security_review','consistency_review'].includes(objective.outcome)) {
        risk.strikes = 0;
        risk.warned = false;
        risk.lastOutcome = 'secured';
        risk.lastDate = objective.completedDate || String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10);
      }
      objective.roleSecurityProcessed = true;
      syncCopies(player);
      return { action: 'secured', role: currentRole(player) };
    }

    if (objective.status !== 'failed') return null;

    const oldRole = currentRole(player);
    const demotion = worseRole(oldRole);
    const force = objective.diagnosticForceDemotion === true;
    const finalWarning = objective.outcome === 'role_security_review' || objective.outcome === 'protect_role';

    if ((force || finalWarning || risk.strikes >= 1) && demotion) {
      applyRole(player, demotion, objective.id || null);
      risk.strikes = 0;
      risk.warned = false;
      risk.lastOutcome = 'demoted';
      risk.lastDate = objective.failedDate || String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10);
      objective.roleSecurityResult = { action: 'demoted', oldRole: oldRole.label, newRole: demotion.label };
    } else {
      risk.strikes = Math.min(2, Number(risk.strikes || 0) + 1);
      risk.warned = true;
      risk.lastOutcome = 'warning';
      risk.lastDate = objective.failedDate || String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10);
      objective.roleSecurityResult = { action: 'warning', oldRole: oldRole.label, newRole: null };
    }

    objective.roleSecurityProcessed = true;
    syncCopies(player);
    try { WorldEngine.save?.(); } catch (_) {}
    try { globalThis.refreshCareerUI?.(); } catch (_) {}
    return objective.roleSecurityResult;
  }

  const baseBuild = WorldEngine.buildCoachMeetingPlan;
  if (typeof baseBuild === 'function') {
    WorldEngine.buildCoachMeetingPlan = function(event) {
      const plan = baseBuild.call(this, event);
      const player = careerPlayer();
      if (!plan || !player) return plan;
      const risk = riskState(player);
      if (!risk.warned || Number(risk.strikes || 0) < 1) return plan;

      const role = currentRole(player);
      const unitLabel = role.unit === 'goalie' ? role.label : role.label;
      plan.title = `Protect Your ${unitLabel} Role`;
      if (role.unit === 'goalie') {
        plan.targetWins = 1;
        plan.targetPoints = 0;
        plan.objectiveText = `Play 3 more games and earn at least 1 win to keep your ${unitLabel} role secure.`;
      } else {
        plan.targetWins = 0;
        plan.targetPoints = role.unit === 'defense' ? 1 : 2;
        plan.objectiveText = `Play 3 more games and produce at least ${plan.targetPoints} point${plan.targetPoints === 1 ? '' : 's'} to keep your ${unitLabel} role secure.`;
      }
      plan.coachMessage = `The last stretch put your ${unitLabel} spot under pressure. This is a real role check now. Give me three dependable games or I may have to move you down.`;
      plan.outcome = 'role_security_review';
      plan.roleSecurityWarning = true;
      return plan;
    };
  }

  const baseProcess = WorldEngine.processCoachObjectiveRoleReview;
  if (typeof baseProcess === 'function') {
    WorldEngine.processCoachObjectiveRoleReview = function(...args) {
      const result = baseProcess.apply(this, args);
      processSecurity();
      return result;
    };
  }

  const baseGet = WorldEngine.getActiveCoachObjective;
  if (typeof baseGet === 'function') {
    WorldEngine.getActiveCoachObjective = function(...args) {
      const result = baseGet.apply(this, args);
      processSecurity();
      return result;
    };
  }

  WorldEngine.processCoachRoleSecurity = processSecurity;

  WorldEngine.runCoachDemotionDiagnostic = function() {
    const world = state();
    const player = careerPlayer();
    if (!world || !player) return { success: false, reason: 'no-career-player' };
    const oldRole = currentRole(player);
    const next = worseRole(oldRole);
    if (!next) return { success: false, reason: 'already-lowest-role', role: oldRole };
    const objective = {
      id: `coach-demotion-diagnostic-${Date.now()}`,
      title: `Protect Your ${oldRole.label} Role`,
      objectiveText: 'Diagnostic role-security objective.',
      outcome: 'role_security_review',
      status: 'failed',
      failedDate: String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10),
      diagnosticForceDemotion: true,
      roleReviewProcessed: true,
      diagnosticOnly: true,
    };
    world.activeCoachObjective = objective;
    player.activeCoachObjective = objective;
    if (world.player && world.player !== player) world.player.activeCoachObjective = structuredClone(objective);
    const result = processSecurity();
    try { WorldEngine.save?.(); } catch (_) {}
    return { success: true, oldRole, role: currentRole(player), result };
  };

  function installDiagnosticButton() {
    const area = document.querySelector('.dev-shortcut-area');
    if (!area || document.getElementById('btn-dev-coach-demotion')) return;
    const button = document.createElement('button');
    button.id = 'btn-dev-coach-demotion';
    button.type = 'button';
    button.className = 'btn btn--dev';
    button.innerHTML = '<span class="btn__label">Test Demotion Review</span>';
    const hint = document.getElementById('dev-shortcut-hint');
    if (hint) area.insertBefore(button, hint); else area.appendChild(button);
    button.addEventListener('click', async event => {
      event.preventDefault();
      button.disabled = true;
      try {
        const result = WorldEngine.runCoachDemotionDiagnostic?.();
        if (!result?.success) throw new Error(result?.reason || 'demotion-diagnostic-failed');
        alert(`Role security review failed. ${result.oldRole?.label || 'Previous role'} → ${result.role?.label || 'new role'}.`);
      } catch (error) {
        alert(`Test Demotion Review failed: ${error?.message || 'unknown error'}`);
      } finally {
        button.disabled = false;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installDiagnosticButton, { once: true });
  else installDiagnosticButton();

  requestAnimationFrame(processSecurity);
})();
