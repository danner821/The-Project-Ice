'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolSeasonBoundaryIntegrityInstalled === true) return;
  WorldEngine.__highSchoolSeasonBoundaryIntegrityInstalled = true;

  const base = typeof WorldEngine.runNextHighSchoolSeasonTransition === 'function'
    ? WorldEngine.runNextHighSchoolSeasonTransition.bind(WorldEngine)
    : null;
  if (!base) return;

  async function runNextHighSchoolSeasonTransitionWithIntegrity(options = {}) {
    /*
     * The season transition is the canonical boundary between two HS years.
     * Anything that belongs to the completed season must be captured BEFORE
     * the transition resets active-season stats and rolls the roster forward.
     */
    if (typeof WorldEngine.captureHighSchoolSeasonStatHistory !== 'function') {
      throw new Error('High-school season stat-history runtime did not load before season transition.');
    }
    WorldEngine.captureHighSchoolSeasonStatHistory();

    const transitioned = await base(options);
    if (!transitioned) return transitioned;

    /*
     * Reassert the new season's world invariants immediately at the boundary,
     * rather than waiting for the next simulated day/UI refresh to do it.
     * This removes expired draft classes from active HS rosters and gives the
     * Prospects screen the correct class immediately after rollover.
     */
    const index = Number(WorldEngine.getCanonicalHighSchoolCareerYearIndex?.());
    WorldEngine.normalizeCanonicalHighSchoolTimeline?.(
      WorldEngine.state,
      {
        careerYearIndex: Number.isFinite(index) ? index : undefined,
        save: false,
      },
    );
    WorldEngine.reconcileExpiredHighSchoolDraftClasses?.();

    const saveResult = WorldEngine.save?.();
    if (saveResult && typeof saveResult.then === 'function') await saveResult;
    return transitioned;
  }

  WorldEngine.runNextHighSchoolSeasonTransition = runNextHighSchoolSeasonTransitionWithIntegrity;
})();
