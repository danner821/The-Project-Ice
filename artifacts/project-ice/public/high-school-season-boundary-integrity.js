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
  const BOUNDARY_INTEGRITY_VERSION = 2;

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const key = dateKey(value);
    if (!key) return null;
    const date = new Date(key + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function recapState() {
    const world = WorldEngine.state;
    if (!world) return null;
    world.seasonTransition =
      world.seasonTransition && typeof world.seasonTransition === 'object'
        ? world.seasonTransition
        : {};
    world.seasonTransition.recap =
      world.seasonTransition.recap && typeof world.seasonTransition.recap === 'object'
        ? world.seasonTransition.recap
        : {};
    return world.seasonTransition.recap;
  }

  function currentSeasonStartYear() {
    return Number(
      WorldEngine.state?.season?.seasonStartYear ||
      String(
        WorldEngine.state?.season?.currentDate ||
        WorldEngine.state?.currentDate ||
        ''
      ).slice(0, 4)
    ) || null;
  }

  function hasCompletedCurrentSeasonGame() {
    const startYear = currentSeasonStartYear();
    if (!Number.isFinite(startYear)) return false;
    const seasonStart = String(startYear) + '-09-01';

    return (WorldEngine.state?.schedule || []).some(event => {
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      const isGame = type === 'game' || Boolean(event?.homeTeamId && event?.awayTeamId);
      const date = dateKey(event?.date);
      const done =
        event?.played === true ||
        event?.completed === true ||
        event?.isCompleted === true ||
        String(event?.status || '').toLowerCase() === 'final';
      return Boolean(isGame && date && date >= seasonStart && done);
    });
  }

  function zeroCurrentSeasonStats(player) {
    if (!player || typeof player !== 'object') return;

    const zeroKeys = [
      'gamesPlayed','gp','goals','g','assists','a','points','pts','plusMinus',
      'pim','penaltyMinutes','shots','shotsOnGoal','sog','wins','w','losses','l',
      'overtimeLosses','otl','goalsAgainst','ga','saves','shotsAgainst',
      'shutouts','so','savePercentage','goalsAgainstAverage','gamesStarted',
      'minutesPlayed','powerPlayGoals','powerPlayPoints','shorthandedGoals',
      'gameWinningGoals'
    ];

    for (const key of zeroKeys) {
      if (key in player) player[key] = 0;
    }

    for (const bucket of [
      'stats',
      'regularSeasonStats',
      'playoffStats',
      'seasonStats',
      'postseasonStats',
    ]) {
      if (!player[bucket] || typeof player[bucket] !== 'object') continue;
      for (const key of Object.keys(player[bucket])) {
        if (typeof player[bucket][key] === 'number') player[bucket][key] = 0;
      }
    }

    player.appliedGameIds = [];
  }

  function zeroCurrentSeasonWorldState() {
    const world = WorldEngine.state;
    if (!world) return false;

    const seen = new Set();
    const reset = player => {
      if (!player || typeof player !== 'object') return;
      const id = playerId(player) || player;
      if (seen.has(id)) return;
      seen.add(id);
      zeroCurrentSeasonStats(player);
    };

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) reset(player);
      for (const key of ['wins','losses','overtimeLosses','points','goalsFor','goalsAgainst']) {
        team[key] = 0;
      }
    }

    reset(world.player);

    if (typeof Game !== 'undefined' && Game?.player) {
      zeroCurrentSeasonStats(Game.player);
    }

    world.standings = [];
    world.leagueLeaders = null;
    world.currentAwardRaces = null;

    if (world.livingWorld && typeof world.livingWorld === 'object') {
      world.livingWorld.currentAwardRaces = [];
    }

    return true;
  }

  function canonicalGradeFromDraftYear(player, startYear) {
    const draftYear = Number(player?.draftYear);
    if (!Number.isFinite(draftYear) || !Number.isFinite(startYear)) return null;
    const grade = 13 - (draftYear - startYear);
    return grade >= 9 && grade <= 12 ? grade : null;
  }

  function normalizeFreshmanFlags() {
    const startYear = currentSeasonStartYear();
    if (!Number.isFinite(startYear)) return false;
    let changed = false;

    for (const team of WorldEngine.state?.teams || []) {
      for (const player of team?.roster || []) {
        if (!player || player?.isCareerPlayer === true) continue;
        const explicit = Number(player?.grade);
        const grade =
          canonicalGradeFromDraftYear(player, startYear) ||
          (explicit >= 9 && explicit <= 12 ? explicit : null);
        if (!grade) continue;

        const freshman = grade === 9;
        if (player.isFreshman !== freshman) {
          player.isFreshman = freshman;
          changed = true;
        }
      }
    }

    return changed;
  }

  function ensureReturningTryout() {
    const world = WorldEngine.state;
    const startYear = currentSeasonStartYear();
    if (!world || !Number.isFinite(startYear) || startYear <= 2023) return false;

    const index = Math.max(0, startYear - 2023);
    const identity = WorldEngine.getHighSchoolSeasonIdentity?.(index) || {
      seasonId: 'hs-' + startYear + '-' + (startYear + 1),
      tryoutDate: startYear + '-09-02',
    };

    const schedule = Array.isArray(world.schedule) ? world.schedule : [];
    const tryouts = schedule.filter(event =>
      event?.returningYearTryout === true ||
      String(event?.eventKey || '') === 'returning-varsity-tryouts'
    );

    const completed = tryouts.find(event =>
      event?.completed === true ||
      event?.played === true ||
      event?.isCompleted === true
    );

    if (completed) return false;

    const current = dateKey(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate
    ) || (startYear + '-09-01');

    let targetDate = dateKey(identity.tryoutDate) || (startYear + '-09-02');

    if (targetDate < current) {
      targetDate = addDays(current, 1) || current;
    }

    const firstGameDate = schedule
      .filter(event => {
        const type = String(event?.type || event?.eventType || '').toLowerCase();
        return type === 'game' && dateKey(event?.date) && dateKey(event.date) >= current;
      })
      .map(event => dateKey(event.date))
      .sort()[0] || null;

    if (firstGameDate && targetDate >= firstGameDate) {
      targetDate = current;
    }

    const fillerTypes = new Set([
      'practice','recovery','film-study','training','off','rest',
    ]);

    world.schedule = schedule.filter(event => {
      if (tryouts.includes(event)) return false;
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      const sameDay = dateKey(event?.date) === targetDate;
      return !(sameDay && fillerTypes.has(type));
    });

    const canonicalId = 'returning-varsity-tryouts:' + identity.seasonId;

    world.schedule.push({
      id: canonicalId,
      eventId: 'tryout-freshman',
      canonicalEventId: canonicalId,
      type: 'tryout',
      eventType: 'tryout',
      eventKey: 'returning-varsity-tryouts',
      label: 'Varsity Tryouts',
      shortLabel: 'Tryouts',
      icon: '🥅',
      date: targetDate,
      location: 'Home Rink',
      objective: 'Earn your role for the new season.',
      description: 'You already belong to the program. This year, tryouts determine where you fit in the lineup.',
      requiresPlayerInteraction: true,
      isCareerEvent: true,
      preseasonEvent: true,
      returningYearTryout: true,
      completed: false,
      isCompleted: false,
      played: false,
      status: 'scheduled',
      recoveredAtSeasonBoundary: true,
    });

    world.schedule.sort((a, b) =>
      String(a?.date || '').localeCompare(String(b?.date || '')) ||
      String(a?.eventId || a?.id || '').localeCompare(String(b?.eventId || b?.id || ''))
    );

    if (world.season) {
      world.season.completedEventIds = Array.isArray(world.season.completedEventIds)
        ? world.season.completedEventIds.filter(id =>
            String(id) !== 'tryout-freshman' &&
            !String(id).includes('returning-varsity-tryouts')
          )
        : [];
    }

    return true;
  }

  function normalizeAllStatHistories() {
    if (typeof WorldEngine.normalizeHighSchoolSeasonStatHistory !== 'function') {
      return false;
    }

    const seen = new Set();
    const players = [];

    const add = player => {
      if (!player || typeof player !== 'object') return;
      const id = playerId(player) || player;
      if (seen.has(id)) return;
      seen.add(id);
      players.push(player);
    };

    for (const player of WorldEngine.getAllWorldPlayers?.() || []) add(player);
    for (const team of WorldEngine.state?.teams || []) {
      for (const player of team?.roster || []) add(player);
    }
    add(WorldEngine.state?.player);

    for (const player of players) {
      WorldEngine.normalizeHighSchoolSeasonStatHistory(player);
    }

    return true;
  }

  function markBoundaryComplete() {
    const recap = recapState();
    const world = WorldEngine.state;
    if (!recap || !world) return;

    recap.nextSeasonTransitionComplete = true;
    recap.nextSeasonTransitionCompletedAt =
      world?.season?.currentDate ||
      world?.currentDate ||
      null;
    recap.nextSeasonTransitionStage = 'complete';
    recap.boundaryIntegrityVersion = BOUNDARY_INTEGRITY_VERSION;
    recap.boundaryIntegritySeasonId =
      world?.season?.seasonId ||
      world?.season?.id ||
      null;
  }

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

    /*
     * A season boundary is a legitimate simulation event, so publishing a new
     * board is explicit here. Ordinary getters are intentionally read-only.
     */
    const rebuilt =
      typeof WorldEngine.rebuildProspectRankingModelV2 === 'function'
        ? WorldEngine.rebuildProspectRankingModelV2()
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
    normalizeFreshmanFlags();
    ensureReturningTryout();
    normalizeAllStatHistories();
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

    markBoundaryComplete();

    const saveResult = WorldEngine.save?.();
    if (saveResult && typeof saveResult.then === 'function') await saveResult;
    return transitioned;
  }

  async function repairInterruptedSeasonBoundary(options = {}) {
    const world = WorldEngine.state;
    const recap = recapState();
    const startYear = currentSeasonStartYear();

    if (
      !world ||
      !recap ||
      !Number.isFinite(startYear) ||
      startYear <= 2023
    ) {
      return { repaired: false, reason: 'not-returning-season' };
    }

    const seasonId = String(
      world?.season?.seasonId ||
      world?.season?.id ||
      ''
    );

    if (
      Number(recap.boundaryIntegrityVersion || 0) >= BOUNDARY_INTEGRITY_VERSION &&
      String(recap.boundaryIntegritySeasonId || '') === seasonId
    ) {
      return { repaired: false, reason: 'boundary-already-verified' };
    }

    /*
     * Never zero a season after a real current-year game has been played.
     * This migration is only for the interrupted preseason transition window.
     */
    if (hasCompletedCurrentSeasonGame()) {
      return { repaired: false, reason: 'season-already-in-progress' };
    }

    const index = Math.max(0, startYear - 2023);

    WorldEngine.normalizeCanonicalHighSchoolTimeline?.(
      world,
      {
        careerYearIndex: index,
        reconcileRosters: false,
        save: false,
      }
    );

    enforceActiveDraftClassInvariant();

    /*
     * The interrupted save can have new-season identity but old-season stat
     * mirrors because the lifecycle event never ran. Repair those mirrors only
     * while the new season still has zero completed games.
     */
    zeroCurrentSeasonWorldState();
    normalizeFreshmanFlags();
    normalizeAllStatHistories();
    ensureReturningTryout();
    ensureSeasonScopedHighSchoolGameIds();
    rebuildProspectRankingsAtSeasonBoundary();

    try {
      WorldEngine.reconcilePlayerAwardHistory?.();
    } catch (_) {}

    try {
      WorldEngine.syncHighSchoolLeadership?.({ save: false });
    } catch (_) {}

    try {
      WorldEngine.syncCareerCalendarProjection?.(
        world?.season?.currentDate || null
      );
    } catch (_) {}

    markBoundaryComplete();

    const saveResult = WorldEngine.save?.();
    if (saveResult && typeof saveResult.then === 'function') {
      await saveResult;
    }

    try { refreshCareerUI?.(); } catch (_) {}

    return {
      repaired: true,
      reason: 'interrupted-season-boundary-repaired',
      seasonId,
      startYear,
      source: options.source || null,
    };
  }

  const baseSelectCareerSave =
    typeof WorldEngine.selectCareerSave === 'function'
      ? WorldEngine.selectCareerSave.bind(WorldEngine)
      : null;

  if (
    baseSelectCareerSave &&
    WorldEngine.selectCareerSave.__seasonBoundaryRepairWrapped !== true
  ) {
    const wrappedSelectCareerSave = async function(...args) {
      const result = await baseSelectCareerSave(...args);
      await repairInterruptedSeasonBoundary({ source: 'career-load' });
      return result;
    };
    wrappedSelectCareerSave.__seasonBoundaryRepairWrapped = true;
    WorldEngine.selectCareerSave = wrappedSelectCareerSave;
  }

  WorldEngine.enforceActiveHighSchoolDraftClassInvariant = enforceActiveDraftClassInvariant;
  WorldEngine.ensureSeasonScopedHighSchoolGameIds = ensureSeasonScopedHighSchoolGameIds;
  WorldEngine.rebuildProspectRankingsAtSeasonBoundary = rebuildProspectRankingsAtSeasonBoundary;
  WorldEngine.repairInterruptedSeasonBoundary = repairInterruptedSeasonBoundary;
  WorldEngine.runNextHighSchoolSeasonTransition = runNextHighSchoolSeasonTransitionWithIntegrity;
})();