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

  function ensureSeasonScopedHighSchoolGameIds() {
    const world = WorldEngine.state;
    if (!world || !Array.isArray(world.schedule)) return { changed: 0, totalGames: 0 };

    const seasonId = String(
      world?.season?.seasonId ||
      world?.season?.id ||
      world?.currentSeason ||
      ''
    ).trim();

    if (!seasonId) return { changed: 0, totalGames: 0 };

    let changed = 0;
    let totalGames = 0;

    for (const event of world.schedule) {
      const isGame = Boolean(
        event?.type === 'game' ||
        event?.eventType === 'game' ||
        (event?.homeTeamId && event?.awayTeamId)
      );
      if (!isGame) continue;
      totalGames += 1;

      const existingId = String(
        event?.canonicalEventId ||
        event?.gameId ||
        event?.eventId ||
        event?.id ||
        ''
      );
      if (!existingId) continue;

      const prefix = `${seasonId}:`;
      const scopedId = existingId.startsWith(prefix)
        ? existingId
        : `${prefix}${existingId}`;

      if (scopedId === existingId) continue;

      /*
       * The base schedule generator intentionally reuses cycle/round/matchup
       * IDs every year. That violates the multi-year lifecycle contract and
       * collides with player-level appliedGameIds. Normalize every alias at the
       * season boundary, before any game in the new year can be resolved.
       */
      event.id = scopedId;
      event.eventId = scopedId;
      event.gameId = scopedId;
      event.canonicalEventId = scopedId;
      changed += 1;
    }

    return { changed, totalGames };
  }

  function rebuildProspectRankingsAtSeasonBoundary() {
    const world = WorldEngine.state;
    if (!world) return [];

    /*
     * Prospect rankings are persistent world state. The ranking bootstrap
     * intentionally returns any existing non-empty array without rebuilding it,
     * which means last season's Top 100 can survive even after the roster
     * rollover correctly removes that draft class. A season boundary changes
     * the eligible candidate universe, so the stored ranking is no longer a
     * valid cache and must be rebuilt from canonical current-world truth.
     */
    world.prospectRankings = [];

    const rebuilt = typeof WorldEngine.getProspectRankings === 'function'
      ? WorldEngine.getProspectRankings()
      : [];

    return Array.isArray(rebuilt) ? rebuilt : [];
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
    ensureSeasonScopedHighSchoolGameIds();
    rebuildProspectRankingsAtSeasonBoundary();

    /*
     * The transition's own cutscene can repaint UI before every boundary
     * listener has finished mutating canonical state. Rebuild the calendar once
     * more here, after roster eligibility, season-scoped IDs and rankings are
     * final, so Schedule immediately reflects the completed new-season state.
     */
    try {
      WorldEngine.syncCareerCalendarProjection?.(
        WorldEngine.state?.season?.currentDate || null
      );
    } catch (_) {}

    const saveResult = WorldEngine.save?.();
    if (saveResult && typeof saveResult.then === 'function') await saveResult;
    return transitioned;
  }

  WorldEngine.enforceActiveHighSchoolDraftClassInvariant = enforceActiveDraftClassInvariant;
  WorldEngine.ensureSeasonScopedHighSchoolGameIds = ensureSeasonScopedHighSchoolGameIds;
  WorldEngine.rebuildProspectRankingsAtSeasonBoundary = rebuildProspectRankingsAtSeasonBoundary;
  WorldEngine.runNextHighSchoolSeasonTransition = runNextHighSchoolSeasonTransitionWithIntegrity;
})();