'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const EVENT_ID = 'travel-hockey-tryouts';
  const MIGRATION_VERSION = 2;

  function migrate() {
    const state = WorldEngine.state?.travelHockey;
    if (!state || Number(state.tryoutFlowVersion || 0) >= MIGRATION_VERSION) return false;

    const result = state.tryoutResult || null;
    const hasNewFlowResult =
      Array.isArray(result?.reps) &&
      result.reps.length >= 9 &&
      Boolean(result?.placementTeamName);

    state.tryoutFlowVersion = MIGRATION_VERSION;

    if (!result || hasNewFlowResult) {
      WorldEngine.save?.();
      return false;
    }

    state.status = 'tryouts-pending';
    state.placementLevel = null;
    state.tryoutResult = null;
    state.playerTeamId = null;
    state.playerTeamName = null;
    state.placementTeam = null;

    const event = (WorldEngine.state?.schedule || []).find(item =>
      String(item?.eventId || item?.id || '') === EVENT_ID
    );
    if (event) {
      event.completed = false;
      event.played = false;
      event.status = 'scheduled';
      event.requiresPlayerInteraction = true;
      delete event.completedAt;
      delete event.result;
    }

    WorldEngine.save?.();
    WorldEngine.bridgeTravelHockeyPresentation?.();
    return true;
  }

  WorldEngine.migrateTravelHockeyTryoutsV2 = migrate;
  migrate();
})();