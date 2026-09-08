'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__coachMeetingDevShortcutInstalled === true) return;
  WorldEngine.__coachMeetingDevShortcutInstalled = true;

  const DEV_CAREER_ID = '__project-ice-postseason-dev__';

  function currentDate() {
    return String(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      ''
    ).slice(0, 10);
  }

  function careerPlayer() {
    const world = WorldEngine.state;
    if (!world) return null;
    const direct = WorldEngine.getCareerPlayer?.();
    if (direct) return direct;
    return (world.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) || world.player || null;
  }

  async function ensureDevWorld() {
    if (WorldEngine.state?.season && careerPlayer()) return true;
    if (typeof WorldEngine.selectCareerSave !== 'function') {
      throw new Error('Dev save loader is unavailable.');
    }

    const loaded = await WorldEngine.selectCareerSave(DEV_CAREER_ID);
    if (!loaded || !WorldEngine.state?.season || !careerPlayer()) {
      throw new Error('Coach diagnostic save is unavailable. Run Skip to Sophomore Tryouts once, then retry.');
    }
    return true;
  }

  function ensureDiagnosticMeeting() {
    const world = WorldEngine.state;
    if (!world) return null;
    WorldEngine.syncCoachMeetingCadence?.({ save: false });

    let meeting = (world.schedule || []).find(event => {
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      return type.includes('meeting') && event?.completed !== true && event?.played !== true;
    });

    if (meeting) return meeting;

    if (!Array.isArray(world.schedule)) world.schedule = [];
    const date = currentDate() || '2024-10-15';
    meeting = {
      id: 'dev-coach-meeting-diagnostic',
      eventId: 'dev-coach-meeting-diagnostic',
      canonicalEventId: 'dev-coach-meeting-diagnostic',
      type: 'coach-meeting',
      eventType: 'coach-meeting',
      meetingType: 'diagnostic',
      date,
      label: 'Coach Meeting',
      title: 'Coach Meeting',
      icon: '📋',
      location: "Coach's Office",
      isCareerEvent: true,
      requiresPlayerInteraction: true,
      completed: false,
      played: false,
      isCompleted: false,
      diagnosticOnly: true,
    };
    world.schedule.push(meeting);
    return meeting;
  }

  function ensureDiagnosticObjective() {
    const world = WorldEngine.state;
    const player = careerPlayer();
    if (!world || !player) return null;

    const existing = world.activeCoachObjective || player.activeCoachObjective || null;
    if (existing) return existing;

    const meeting = ensureDiagnosticMeeting();
    const plan = WorldEngine.buildCoachMeetingPlan?.(meeting);
    if (!plan) return null;

    const objective = {
      ...structuredClone(plan),
      id: plan.id || 'dev-coach-objective-diagnostic',
      baseline: structuredClone(plan.baseline || {}),
      status: 'active',
      progress: 0,
      activatedDate: currentDate() || meeting?.date || null,
      diagnosticOnly: true,
    };

    world.activeCoachObjective = objective;
    player.activeCoachObjective = objective;
    if (world.player && world.player !== player) {
      world.player.activeCoachObjective = structuredClone(objective);
    }
    return objective;
  }

  async function loadAndOpenMeeting(button) {
    button.disabled = true;
    const label = button.querySelector('.btn__label');
    const original = label?.textContent || 'Test Coach Meeting';
    if (label) label.textContent = 'Opening Coach Meeting…';

    try {
      await ensureDevWorld();
      ensureDiagnosticMeeting();
      const result = WorldEngine.openCoachMeetingDiagnostic?.();
      if (!result?.success) {
        throw new Error(result?.reason || 'Could not open the Coach Meeting diagnostic.');
      }
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
      const objective = ensureDiagnosticObjective();
      if (!objective) throw new Error('Could not create or recover a Coach Objective diagnostic.');

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
      event.stopPropagation();
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
