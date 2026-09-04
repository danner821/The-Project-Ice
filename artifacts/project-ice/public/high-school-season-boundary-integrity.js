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

  const playerId = player => String(player?.playerId || player?.id || '');

  function enforceActiveDraftClassInvariant() {
    const world = WorldEngine.state;
    if (!world || typeof WorldEngine.applyHighSchoolRosterRollover !== 'function') return false;

    /*
     * At this boundary the actual new-season calendar date is the least
     * ambiguous source of truth. A 2024-25 HS world may not contain a 2024
     * draft-class player on an active roster. Do not infer this from stale
     * class labels or recap metadata.
     */
    const currentDate = String(world?.season?.currentDate || world?.currentDate || '').slice(0, 10);
    const startYear = Number(currentDate.slice(0, 4));
    if (!Number.isFinite(startYear)) return false;

    const minimumActiveDraftYear = startYear + 1;
    const expired = [];

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (!player || player?.isCareerPlayer === true) continue;
        const draftYear = Number(player?.draftYear);
        if (!Number.isFinite(draftYear) || draftYear >= minimumActiveDraftYear) continue;
        expired.push({
          playerId: playerId(player),
          teamId: String(team?.teamId || ''),
          seasonId: `hs-${startYear - 1}-${startYear}`,
          player: structuredClone(player),
        });
      }
    }

    if (!expired.length) return false;

    const lifecycle = world.highSchoolRosterLifecycle = world.highSchoolRosterLifecycle || {};
    lifecycle.pendingGraduatingSeasonId = `hs-${startYear - 1}-${startYear}`;
    lifecycle.pendingGraduates = expired;

    WorldEngine.applyHighSchoolRosterRollover({
      seasonId: String(world?.season?.seasonId || `hs-${startYear}-${startYear + 1}`),
      careerYearIndex: Math.max(0, startYear - 2023),
      schoolYear: world?.season?.schoolYear || world?.player?.schoolYear || null,
      startDate: currentDate,
      canonicalIntegrityRepair: true,
    });
    return true;
  }

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

    /* First normalize the new season identity, then enforce roster eligibility
       directly from the new season date. The latter is intentionally explicit:
       it prevents synthetic/dev recap metadata from delaying graduation until
       the first simulated day. */
    const currentStart = Number(String(
      WorldEngine.state?.season?.currentDate || WorldEngine.state?.currentDate || ''
    ).slice(0, 4));
    const index = Number.isFinite(currentStart) ? Math.max(0, currentStart - 2023) : undefined;

    WorldEngine.normalizeCanonicalHighSchoolTimeline?.(
      WorldEngine.state,
      {
        careerYearIndex: index,
        reconcileRosters: false,
        save: false,
      },
    );

    enforceActiveDraftClassInvariant();

    const saveResult = WorldEngine.save?.();
    if (saveResult && typeof saveResult.then === 'function') await saveResult;
    return transitioned;
  }

  WorldEngine.enforceActiveHighSchoolDraftClassInvariant = enforceActiveDraftClassInvariant;
  WorldEngine.runNextHighSchoolSeasonTransition = runNextHighSchoolSeasonTransitionWithIntegrity;
})();
