'use strict';

/* global WorldEngine, EventSystem */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;
  if (WorldEngine.__coachMeetingRuntimeFixInstalled === true) return;
  WorldEngine.__coachMeetingRuntimeFixInstalled = true;

  const state = () => WorldEngine.state || null;

  function careerPlayer() {
    if (typeof WorldEngine.getCareerPlayer === 'function') {
      const direct = WorldEngine.getCareerPlayer();
      if (direct) return direct;
    }
    const world = state();
    const id = String(world?.player?.playerId || world?.player?.id || 'career-player');
    return WorldEngine.getPlayerById?.(id) || world?.player || null;
  }

  function isMeeting(event = {}) {
    const type = String(event?.type || event?.eventType || '').toLowerCase();
    const id = String(event?.eventId || event?.id || '').toLowerCase();
    return type.includes('meeting') || id.includes('coach-meeting');
  }

  function canonicalMeeting(eventId, eventData = null) {
    if (eventData && isMeeting(eventData)) return eventData;
    return (state()?.schedule || []).find(event => {
      const id = String(event?.eventId || event?.id || '');
      return id === String(eventId || '') && isMeeting(event);
    }) || null;
  }

  function displayPlan(plan, presented) {
    if (!plan || !presented) return;
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el && text !== undefined && text !== null) el.textContent = String(text);
    };

    set('ev-type-badge', 'COACH MEETING');
    set('ev-icon', '📋');
    set('ev-title', 'Coach Meeting');
    set('ev-location', "Coach's Office");
    set('ev-objective', plan.objectiveText);
    set('ev-description', plan.coachMessage);

    const detailsSection = document.getElementById('ev-details-section');
    const details = document.getElementById('ev-details');
    if (detailsSection && details) {
      const specialTeams = [
        plan.context?.powerPlayUnit ? `PP ${plan.context.powerPlayUnit}` : '',
        plan.context?.penaltyKillUnit ? `PK ${plan.context.penaltyKillUnit}` : '',
      ].filter(Boolean).join(' · ') || 'No special-teams role';
      const rows = [
        ['Current Role', plan.context?.role || 'Unassigned'],
        ['Coach Trust', `${Math.round(Number(plan.context?.coachTrust) || 0)}%`],
        ['Recent Form', String(plan.context?.recentForm || 'unknown').replace(/^./, ch => ch.toUpperCase())],
        ['Overall', plan.context?.overall ?? '—'],
        ['Special Teams', specialTeams],
        ['Next Step', plan.title || 'Keep earning your role'],
      ];
      details.innerHTML = rows.map(([label, value]) => `
        <div class="ev-detail-row">
          <span class="ev-detail-label">${label}</span>
          <span class="ev-detail-value">${value}</span>
        </div>
      `).join('');
      detailsSection.hidden = false;
    }

    const screen = document.getElementById('event-screen');
    if (screen) {
      screen.className = screen.className.replace(/\bev-type--\S+/g, '').trim();
      screen.classList.add('ev-type--meeting');
    }
  }

  function presentedMeeting(event) {
    const player = careerPlayer();
    const plan = WorldEngine.buildCoachMeetingPlan?.(event) || event?.coachMeetingPlan || null;
    if (!plan) return { event, plan: null };
    const presented = {
      ...event,
      icon: '📋',
      title: 'Coach Meeting',
      label: 'Coach Meeting',
      type: 'coach-meeting',
      eventType: 'coach-meeting',
      location: "Coach's Office",
      objective: plan.objectiveText,
      description: plan.coachMessage,
      coachNote: plan.coachMessage,
      coachMeetingPlan: plan,
      coachMeetingContext: plan.context,
      details: {
        'Current Role': plan.context?.role || 'Unassigned',
        'Coach Trust': `${Math.round(Number(plan.context?.coachTrust) || 0)}%`,
        'Recent Form': String(plan.context?.recentForm || 'unknown').replace(/^./, ch => ch.toUpperCase()),
        'Overall': plan.context?.overall ?? '—',
      },
    };
    if (player) presented.playerId = player.playerId || player.id || presented.playerId || null;
    Object.assign(event, presented);
    return { event: presented, plan };
  }

  const baseOpen = EventSystem.openEvent.bind(EventSystem);
  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const meeting = canonicalMeeting(eventId, eventData);
    if (!meeting) return baseOpen(eventId, origin, eventData);

    const result = presentedMeeting(meeting);
    const opened = baseOpen(eventId, origin, result.event);
    WorldEngine.__activeCoachMeetingForUi = result.event;
    requestAnimationFrame(() => displayPlan(result.plan, result.event));
    return opened;
  };

  function activateObjectiveFromCurrentMeeting() {
    const world = state();
    const player = careerPlayer();
    const current = EventSystem.getCurrentDef?.() || WorldEngine.__activeCoachMeetingForUi || null;
    if (!world || !player || !current || !isMeeting(current)) return null;

    const plan = current.coachMeetingPlan || WorldEngine.buildCoachMeetingPlan?.(current);
    if (!plan) return null;

    const objective = {
      ...structuredClone(plan),
      baseline: structuredClone(plan.baseline || {}),
      status: 'active',
      progress: 0,
      activatedDate: String(world?.season?.currentDate || world?.currentDate || current?.date || '').slice(0, 10),
    };
    world.activeCoachObjective = objective;
    player.activeCoachObjective = objective;
    if (world.player && world.player !== player) world.player.activeCoachObjective = structuredClone(objective);
    current.coachMeetingPlan = plan;
    WorldEngine.__activeCoachMeetingForUi = current;
    return objective;
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#btn-ev-begin');
    if (!button) return;
    const current = EventSystem.getCurrentDef?.() || WorldEngine.__activeCoachMeetingForUi || null;
    if (!current || !isMeeting(current)) return;

    const objective = activateObjectiveFromCurrentMeeting();
    if (!objective) return;

    setTimeout(() => {
      try { WorldEngine.save?.(); } catch (_) {}
      try { WorldEngine.renderActiveCoachObjective?.(); } catch (_) {}
    }, 0);
  }, true);

  WorldEngine.openCoachMeetingDiagnostic = function() {
    WorldEngine.syncCoachMeetingCadence?.({ save: false });
    const meeting = (state()?.schedule || []).find(event => isMeeting(event) && event?.completed !== true && event?.played !== true);
    if (!meeting) return { success: false, reason: 'no-open-coach-meeting' };
    const result = presentedMeeting(meeting);
    EventSystem.openEvent(meeting.eventId || meeting.id, 'hub', result.event);
    return { success: true, eventId: meeting.eventId || meeting.id, plan: result.plan };
  };
})();
