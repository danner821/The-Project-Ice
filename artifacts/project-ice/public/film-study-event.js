'use strict';

/* global WorldEngine, EventSystem, EventResultsSystem, COMPLETE_SCREENS, showScreen, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;

  const FILM_STUDY_VERSION = 1;

  const choicesForPlayer = player => {
    const position = String(player?.position || '').toUpperCase();
    const goalie = position === 'G';

    if (goalie) {
      return [
        {
          key: 'reads', icon: '👁️', title: 'Read Shooters',
          description: 'Study release cues, traffic, and how shooters disguise their intentions.',
          rewards: { puckTracking: 4, anticipation: 3, positioning: 2 }, category: 'goalie',
        },
        {
          key: 'movement', icon: '🥅', title: 'Crease Movement',
          description: 'Review lateral routes, depth, and recovery after first saves.',
          rewards: { lateralMovement: 4, recoverySpeed: 3, angles: 2 }, category: 'goalie',
        },
        {
          key: 'rebound', icon: '🎯', title: 'Rebound Control',
          description: 'Break down where second chances came from and how to kill plays sooner.',
          rewards: { reboundControl: 4, stickControl: 3, composure: 2 }, category: 'goalie',
        },
      ];
    }

    return [
      {
        key: 'offense', icon: '⚡', title: 'Offensive Reads',
        description: 'Study entries, passing lanes, and where space opened around the puck.',
        rewards: { offensiveAwareness: 4, passing: 3, puckControl: 2 }, category: 'hockeyIQ',
      },
      {
        key: 'defense', icon: '🛡️', title: 'Defensive Details',
        description: 'Review positioning, retrievals, coverage, and decisions without the puck.',
        rewards: { defensiveAwareness: 4, stickChecking: 3, poise: 2 }, category: 'hockeyIQ',
      },
      {
        key: 'special-teams', icon: '🎬', title: 'Special Teams',
        description: 'Study power-play and penalty-kill structure, reads, and pressure points.',
        rewards: { offensiveAwareness: 3, defensiveAwareness: 3, passing: 3 }, category: 'hockeyIQ',
      },
    ];
  };

  function careerPlayer() {
    const world = WorldEngine.state || {};
    for (const team of world.teams || []) {
      const found = (team?.roster || []).find(player => player?.isCareerPlayer === true);
      if (found) return found;
    }
    const wanted = String(world.player?.playerId || world.player?.id || 'career-player');
    for (const team of world.teams || []) {
      const found = (team?.roster || []).find(player =>
        String(player?.playerId || player?.id || '') === wanted
      );
      if (found) return found;
    }
    return world.player || null;
  }

  function normalizeFilmStudyEvent(event) {
    if (!event) return false;
    const identifiers = [event.type, event.eventType, event.eventKey]
      .map(value => String(value || '').trim().toLowerCase());
    const isRecovery = identifiers.some(value => value === 'recovery' || value === 'recovery-sleep');
    if (!isRecovery) return false;
    let changed = false;
    const set = (key, value) => {
      if (event[key] !== value) {
        event[key] = value;
        changed = true;
      }
    };
    set('label', event.isPlayoff ? 'Playoff Film Study' : 'Film Study');
    set('shortLabel', 'Film Study');
    set('icon', '🎥');
    set('location', 'Video Room');
    set('objective', 'Review film and choose one area of your game to sharpen.');
    set('description', event.isPlayoff
      ? 'A focused postseason video session built around the last game and the next opponent.'
      : 'Sit down with game film, identify details you can improve, and turn them into development progress.');
    set('completeScreen', 'film-study');
    set('requiresPlayerInteraction', true);
    set('filmStudyVersion', FILM_STUDY_VERSION);
    return changed;
  }

  function normalizeCatalog() {
    const catalog = EventSystem.EVENT_CATALOG || {};
    for (const key of ['recovery', 'recovery-sleep']) {
      const def = catalog[key];
      if (!def) continue;
      def.title = 'Film Study';
      def.type = 'recovery';
      def.icon = '🎥';
      def.location = 'Video Room';
      def.objective = 'Review film and choose one area of your game to sharpen.';
      def.description = 'Break down game film and focus on one detail that can make you better next time out.';
      def.completeScreen = 'film-study';
    }
  }

  function normalizeSchedule(options = {}) {
    const schedule = Array.isArray(WorldEngine.state?.schedule) ? WorldEngine.state.schedule : [];
    let changed = false;
    for (const event of schedule) if (normalizeFilmStudyEvent(event)) changed = true;
    if (changed && options.save !== false) WorldEngine.save?.();
    return changed;
  }

  function resolveCurrentEvent() {
    const def = EventSystem.getCurrentDef?.() || null;
    const ids = [def?.eventId, def?.id, def?.canonicalEventId].filter(Boolean).map(String);
    const schedule = Array.isArray(WorldEngine.state?.schedule) ? WorldEngine.state.schedule : [];
    if (ids.length) {
      const exact = schedule.find(event =>
        [event?.eventId, event?.id, event?.canonicalEventId].filter(Boolean)
          .some(id => ids.includes(String(id)))
      );
      if (exact) return exact;
    }
    const currentDate = WorldEngine.state?.season?.currentDate || WorldEngine.state?.player?.currentDate || WorldEngine.state?.currentDate || null;
    return schedule.find(event =>
      String(event?.date || '') === String(currentDate || '') &&
      String(event?.type || event?.eventType || '').toLowerCase() === 'recovery' &&
      event?.completed !== true && event?.isCompleted !== true
    ) || null;
  }

  function applyFocusXP(player, choice, event) {
    if (!player || !choice?.rewards) return 0;
    if (!player.development || typeof player.development !== 'object') player.development = {};
    const dev = player.development;
    if (!dev.attributeXP || typeof dev.attributeXP !== 'object') dev.attributeXP = {};
    if (!dev.attributeXPEarnedCareer || typeof dev.attributeXPEarnedCareer !== 'object') dev.attributeXPEarnedCareer = {};
    if (!dev.xpEarnedByCategory || typeof dev.xpEarnedByCategory !== 'object') dev.xpEarnedByCategory = {};
    if (!Array.isArray(dev.developmentHistory)) dev.developmentHistory = [];

    let total = 0;
    for (const [attribute, raw] of Object.entries(choice.rewards)) {
      const amount = Math.max(0, Math.round(Number(raw) || 0));
      if (!amount) continue;
      dev.attributeXP[attribute] = Math.max(0, Number(dev.attributeXP[attribute]) || 0) + amount;
      dev.attributeXPEarnedCareer[attribute] = Math.max(0, Number(dev.attributeXPEarnedCareer[attribute]) || 0) + amount;
      total += amount;
    }
    dev.xpEarnedCareer = Math.max(0, Number(dev.xpEarnedCareer) || 0) + total;
    dev.lifetimeXP = Math.max(0, Number(dev.lifetimeXP) || 0) + total;
    dev.xpEarnedByCategory[choice.category] = Math.max(0, Number(dev.xpEarnedByCategory[choice.category]) || 0) + total;
    dev.developmentHistory.push({
      id: `film-study-${event?.date || 'date'}-${choice.key}`,
      type: 'film-study', source: 'film-study',
      date: event?.date || WorldEngine.state?.season?.currentDate || null,
      seasonId: WorldEngine.state?.season?.seasonId || WorldEngine.state?.season?.id || null,
      focus: choice.key, focusLabel: choice.title,
      attributeXP: { ...choice.rewards }, totalXP: total,
    });
    return total;
  }

  function injectStyles() {
    if (document.getElementById('pi-film-study-styles')) return;
    const style = document.createElement('style');
    style.id = 'pi-film-study-styles';
    style.textContent = `
      #pi-film-study-screen{position:fixed;inset:0;z-index:10050;overflow-y:auto;background:radial-gradient(circle at 50% -10%,rgba(45,86,165,.24),transparent 42%),#060b16;color:#f4f7ff;padding:max(22px,env(safe-area-inset-top)) 18px max(34px,env(safe-area-inset-bottom))}.pi-film-study__shell{width:min(100%,520px);margin:0 auto}.pi-film-study__back{appearance:none;border:0;background:transparent;color:#9fb0ce;font:inherit;padding:8px 0 18px}.pi-film-study__hero{border:1px solid rgba(108,146,214,.22);background:linear-gradient(180deg,rgba(18,31,57,.94),rgba(10,18,34,.94));border-radius:22px;padding:22px;box-shadow:0 18px 55px rgba(0,0,0,.28)}.pi-film-study__eyebrow{margin:0 0 8px;color:#779be0;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.pi-film-study__title{margin:0;font-size:28px;line-height:1.05}.pi-film-study__copy{margin:12px 0 0;color:#aebbd1;line-height:1.55;font-size:14px}.pi-film-study__choices{display:grid;gap:12px;margin-top:16px}.pi-film-study__choice{width:100%;text-align:left;color:inherit;border:1px solid rgba(119,155,224,.18);background:rgba(15,26,47,.82);border-radius:18px;padding:16px;display:grid;grid-template-columns:40px 1fr;gap:12px;align-items:start}.pi-film-study__choice:active{transform:scale(.99);background:rgba(24,42,75,.9)}.pi-film-study__icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:rgba(76,119,201,.13);font-size:20px}.pi-film-study__choice strong{display:block;font-size:16px;margin-bottom:5px}.pi-film-study__choice span{display:block;color:#9eacc3;font-size:13px;line-height:1.4}.pi-film-study__reward{margin-top:8px;color:#79a7ff!important;font-size:12px!important;font-weight:700}
    `;
    document.head.appendChild(style);
  }

  function openFilmStudy() {
    normalizeSchedule({ save: false });
    const event = resolveCurrentEvent();
    if (!event) {
      console.warn('[Project Ice] Film Study could not resolve the active recovery event.');
      return;
    }
    injectStyles();
    document.getElementById('pi-film-study-screen')?.remove();
    const player = careerPlayer();
    const choices = choicesForPlayer(player);
    const root = document.createElement('section');
    root.id = 'pi-film-study-screen';
    root.innerHTML = `
      <div class="pi-film-study__shell">
        <button type="button" class="pi-film-study__back" data-film-back>‹ Back</button>
        <div class="pi-film-study__hero">
          <p class="pi-film-study__eyebrow">${event.isPlayoff ? 'Postseason • Video Room' : 'Video Room'}</p>
          <h2 class="pi-film-study__title">🎥 Film Study</h2>
          <p class="pi-film-study__copy">Review the tape and choose one detail to sharpen. Film work gives a small, focused development boost without replacing Training or game-earned XP.</p>
        </div>
        <div class="pi-film-study__choices">
          ${choices.map(choice => `<button type="button" class="pi-film-study__choice" data-film-choice="${choice.key}"><span class="pi-film-study__icon">${choice.icon}</span><span><strong>${choice.title}</strong><span>${choice.description}</span><span class="pi-film-study__reward">Small focused attribute XP</span></span></button>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(root);

    root.querySelector('[data-film-back]')?.addEventListener('click', () => {
      root.remove();
      showScreen?.('event');
    });

    root.querySelectorAll('[data-film-choice]').forEach(button => {
      button.addEventListener('click', async () => {
        if (root.dataset.completing === '1') return;
        root.dataset.completing = '1';
        const choice = choices.find(item => item.key === button.dataset.filmChoice);
        if (!choice) return;
        const eventId = event.eventId || event.id;
        const base = WorldEngine.completeRecoveryEvent?.(eventId, { save: false }) || { success: true, applied: false };
        const totalXP = applyFocusXP(player, choice, event);
        event.completed = true; event.isCompleted = true; event.played = true; event.status = 'completed';
        event.filmStudyFocus = choice.key; event.filmStudyFocusLabel = choice.title; event.filmStudyRewards = { ...choice.rewards };
        await WorldEngine.save?.();
        root.remove();
        refreshCareerUI?.();
        const result = {
          ...(base?.result && typeof base.result === 'object' ? base.result : base),
          success: true, eventType: 'film-study', focus: choice.key, focusLabel: choice.title,
          xp: { ...((base?.result?.xp || base?.xp) || {}), attributes: { ...choice.rewards }, general: totalXP },
          coachNote: `Film review complete: ${choice.title}.`,
        };
        if (typeof EventResultsSystem !== 'undefined' && EventResultsSystem?.open) {
          EventResultsSystem.open(event, { success: true, result, date: event.date, coachNote: result.coachNote });
        } else {
          showScreen?.('hub');
        }
      });
    });
  }

  normalizeCatalog();

  /*
   * Canonical schedule boundary: every regular-season schedule generated for
   * a fresh or returning HS year leaves WorldEngine already expressed as Film
   * Study instead of relying on a later UI repaint to rename Recovery.
   */
  const originalCreateHighSchoolCareerSchedule =
    typeof WorldEngine.createHighSchoolCareerSchedule === 'function'
      ? WorldEngine.createHighSchoolCareerSchedule.bind(WorldEngine)
      : null;

  if (originalCreateHighSchoolCareerSchedule && !WorldEngine.__filmStudyScheduleFactoryWrapped) {
    WorldEngine.createHighSchoolCareerSchedule = (...args) => {
      const schedule = originalCreateHighSchoolCareerSchedule(...args);
      if (Array.isArray(schedule)) {
        for (const event of schedule) normalizeFilmStudyEvent(event);
      }
      return schedule;
    };
    WorldEngine.__filmStudyScheduleFactoryWrapped = true;
  }

  normalizeSchedule({ save: true });

  /* Returning-year transitions rebuild the schedule in-place during the same
   * browser session. Reconcile immediately from the lifecycle event instead of
   * waiting for a refresh or polling loop. */
  window.addEventListener('projectice:next-high-school-season-started', () => {
    normalizeSchedule({ save: true });
  });

  if (typeof COMPLETE_SCREENS !== 'undefined') COMPLETE_SCREENS['film-study'] = openFilmStudy;
  WorldEngine.syncFilmStudyEvents = normalizeSchedule;
  window.ProjectIceFilmStudy = { open: openFilmStudy, sync: normalizeSchedule };
})();
