'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachMeetingDevShortcutInstalled === true) return;
  WorldEngine.__coachMeetingDevShortcutInstalled = true;

  const DEV_CAREER_ID = '__project-ice-postseason-dev__';

  async function ensureDevWorld() {
    if (WorldEngine.state?.season && String(WorldEngine.state?.player?.schoolYear || WorldEngine.state?.player?.classLevel || '').toLowerCase().includes('soph')) return true;
    if (typeof WorldEngine.selectCareerSave !== 'function') return false;
    try {
      return Boolean(await WorldEngine.selectCareerSave(DEV_CAREER_ID));
    } catch (_) {
      return false;
    }
  }

  async function loadAndOpenMeeting(button) {
    button.disabled = true;
    const label = button.querySelector('.btn__label');
    const original = label?.textContent || 'Test Coach Meeting';
    if (label) label.textContent = 'Opening Coach Meeting…';
    try {
      await ensureDevWorld();
      WorldEngine.syncCoachMeetingCadence?.({ save: false });
      const result = WorldEngine.openCoachMeetingDiagnostic?.();
      if (!result?.success) throw new Error(result?.reason || 'Could not open the Coach Meeting diagnostic.');
    } finally {
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  async function completeObjectiveDiagnostic(button) {
    button.disabled = true;
    const label = button.querySelector('.btn__label');
    const original = label?.textContent || 'Pass Coach Objective';
    if (label) label.textContent = 'Completing Objective…';
    try {
      await ensureDevWorld();
      let objective = WorldEngine.state?.activeCoachObjective || WorldEngine.getActiveCoachObjective?.();
      if (!objective) {
        const created = WorldEngine.createCoachPromotionReviewDiagnostic?.();
        if (created?.success) objective = created.objective;
      }
      const result = WorldEngine.runCoachObjectiveOutcomeDiagnostic?.('success');
      if (!result?.success) throw new Error(result?.reason || 'Could not complete the Coach Objective diagnostic.');
      try { await WorldEngine.save?.(); } catch (_) {}
      try { globalThis.refreshCareerUI?.(); } catch (_) {}
      try { globalThis.updateHubScreen?.(); } catch (_) {}
      try { globalThis.openHubTab?.('home'); } catch (_) {}

      const review = result.review || result.objective?.roleReview || null;
      const role = result.role?.label || result.role?.role || 'current role';
      const message = review?.approved
        ? `Objective passed. Coach approved the role review. New role: ${review.newRole || role}.`
        : `Objective passed. Coach review completed. You remain in ${role}.`;
      alert(message);
    } finally {
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  async function promotionDiagnostic(button) {
    button.disabled = true;
    const label = button.querySelector('.btn__label');
    const original = label?.textContent || 'Test Promotion Review';
    if (label) label.textContent = 'Setting Up Promotion Review…';
    try {
      await ensureDevWorld();
      const created = WorldEngine.createCoachPromotionReviewDiagnostic?.();
      if (!created?.success) throw new Error(created?.reason || 'Could not create promotion review.');
      const result = WorldEngine.runCoachObjectiveOutcomeDiagnostic?.('success');
      if (!result?.success) throw new Error(result?.reason || 'Could not complete promotion review.');
      try { await WorldEngine.save?.(); } catch (_) {}
      try { globalThis.refreshCareerUI?.(); } catch (_) {}
      try { globalThis.updateHubScreen?.(); } catch (_) {}
      try { globalThis.openHubTab?.('home'); } catch (_) {}
      const review = result.review || result.objective?.roleReview || null;
      const role = result.role?.label || 'current role';
      alert(review?.approved
        ? `Promotion review passed. ${review.oldRole || 'Previous role'} → ${review.newRole || role}.`
        : `Promotion review ran, but you remain in ${role}.`);
    } finally {
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  function addButton(area, id, labelText, handler, hint) {
    if (document.getElementById(id)) return;
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'btn btn--dev';
    button.innerHTML = `<span class="btn__label">${labelText}</span>`;
    if (hint) area.insertBefore(button, hint);
    else area.appendChild(button);
    button.addEventListener('click', event => {
      event.preventDefault();
      handler(button).catch(error => {
        console.error(`[Project Ice] ${labelText} diagnostic failed:`, error);
        alert(`${labelText} diagnostic failed: ${error?.message || 'unknown error'}`);
      });
    });
  }

  function install() {
    const area = document.querySelector('.dev-shortcut-area');
    if (!area) return;
    const hint = document.getElementById('dev-shortcut-hint');
    addButton(area, 'btn-dev-coach-meeting', 'Test Coach Meeting', loadAndOpenMeeting, hint);
    addButton(area, 'btn-dev-coach-objective-pass', 'Pass Coach Objective', completeObjectiveDiagnostic, hint);
    addButton(area, 'btn-dev-coach-promotion', 'Test Promotion Review', promotionDiagnostic, hint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
