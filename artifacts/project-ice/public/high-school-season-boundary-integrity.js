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


  function resetActiveSeasonStats(player) {
    if (!player || typeof player !== 'object') return;
    const goalie = String(player?.position || '').toUpperCase() === 'G';
    const empty = goalie
      ? {
          gamesPlayed:0, gamesStarted:0, wins:0, losses:0, overtimeLosses:0,
          shotsAgainst:0, saves:0, goalsAgainst:0, savePercentage:0,
          goalsAgainstAverage:0, shutouts:0, minutesPlayed:0,
        }
      : {
          gamesPlayed:0, goals:0, assists:0, points:0, plusMinus:0,
          penaltyMinutes:0, shots:0, powerPlayGoals:0, powerPlayPoints:0,
          shorthandedGoals:0, gameWinningGoals:0, minutesPlayed:0,
        };

    player.seasonStats = { ...empty };
    player.postseasonStats = { ...empty };
    player.appliedGameIds = [];

    const zeroKeys = [
      'gamesPlayed','gp','goals','g','assists','a','points','pts','plusMinus',
      'pim','penaltyMinutes','shots','shotsOnGoal','sog','wins','w','losses','l',
      'overtimeLosses','otl','goalsAgainst','ga','saves','shotsAgainst','shutouts',
      'so','savePercentage','goalsAgainstAverage','gamesStarted','minutesPlayed',
      'powerPlayGoals','powerPlayPoints','shorthandedGoals','gameWinningGoals'
    ];
    for (const key of zeroKeys) if (key in player) player[key] = 0;

    for (const bucket of ['stats','regularSeasonStats','playoffStats']) {
      if (!player[bucket] || typeof player[bucket] !== 'object') continue;
      for (const key of Object.keys(player[bucket])) {
        if (typeof player[bucket][key] === 'number') player[bucket][key] = 0;
      }
    }
  }

  function hasCompletedCurrentSeasonGame() {
    const world = WorldEngine.state;
    const seasonId = String(world?.season?.seasonId || world?.season?.id || '');
    return (world?.schedule || []).some(event => {
      const isGame = Boolean(
        event?.type === 'game' ||
        event?.eventType === 'game' ||
        (event?.homeTeamId && event?.awayTeamId)
      );
      if (!isGame) return false;
      const id = String(event?.canonicalEventId || event?.gameId || event?.eventId || event?.id || '');
      const belongs = !seasonId || !id.includes(':') || id.startsWith(`${seasonId}:`);
      const final = event?.played === true || event?.completed === true || String(event?.status || '').toLowerCase() === 'final';
      return belongs && final && Number.isFinite(Number(event?.homeScore)) && Number.isFinite(Number(event?.awayScore));
    });
  }

  function ensureReturningTryoutAtBoundary() {
    const world = WorldEngine.state;
    const startYear = Number(String(world?.season?.currentDate || world?.currentDate || '').slice(0,4));
    const careerYearIndex = Number(world?.season?.careerYearIndex);
    if (!Number.isFinite(startYear) || !Number.isFinite(careerYearIndex) || careerYearIndex <= 0) return false;

    const identity = WorldEngine.getHighSchoolSeasonIdentity?.(careerYearIndex);
    const tryoutDate = String(identity?.tryoutDate || `${startYear}-09-02`);
    if (!Array.isArray(world.schedule)) world.schedule = [];

    const isReturningTryout = event =>
      event?.returningYearTryout === true ||
      String(event?.eventKey || '') === 'returning-varsity-tryouts';

    let changed = false;
    const already = world.schedule.some(isReturningTryout);

    world.schedule = world.schedule.filter(event => {
      if (isReturningTryout(event)) return true;
      if (String(event?.date || '') !== tryoutDate) return true;
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      const key = String(event?.eventKey || '').toLowerCase();
      const filler = ['practice','recovery','film-study','training','off','rest'].includes(type) ||
        ['recovery','film-study'].includes(key);
      if (filler) {
        changed = true;
        return false;
      }
      return true;
    });

    if (!already) {
      world.schedule.push({
        id: `returning-varsity-tryouts:${identity?.seasonId || world?.season?.seasonId || startYear}`,
        eventId: 'tryout-freshman',
        canonicalEventId: `returning-varsity-tryouts:${identity?.seasonId || world?.season?.seasonId || startYear}`,
        type:'tryout', eventType:'tryout', eventKey:'returning-varsity-tryouts',
        label:'Varsity Tryouts', shortLabel:'Tryouts', icon:'🥅', date:tryoutDate,
        location:'Home Rink', objective:'Earn your role for the new season.',
        description:'You already belong to the program. This year, tryouts determine where you fit in the lineup.',
        requiresPlayerInteraction:true, isCareerEvent:true, preseasonEvent:true,
        returningYearTryout:true, completed:false, played:false, status:'scheduled',
      });
      changed = true;
    }

    world.schedule.sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||'')));
    return changed;
  }

  function repairEarlySeasonBoundaryState() {
    const world = WorldEngine.state;
    if (!world) return false;

    const currentDate = String(world?.season?.currentDate || world?.currentDate || '').slice(0,10);
    const startYear = Number(currentDate.slice(0,4));
    const careerYearIndex = Number(world?.season?.careerYearIndex);
    if (!Number.isFinite(startYear) || startYear <= 2023 || !Number.isFinite(careerYearIndex)) return false;

    const seasonId = String(world?.season?.seasonId || world?.season?.id || `hs-${startYear}-${startYear+1}`);
    world.seasonBoundaryIntegrityRepairs = world.seasonBoundaryIntegrityRepairs || {};
    if (world.seasonBoundaryIntegrityRepairs[seasonId] === 2) return false;

    const earlySeptember = currentDate >= `${startYear}-09-01` && currentDate <= `${startYear}-09-15`;
    if (!earlySeptember) return false;

    WorldEngine.normalizeCanonicalHighSchoolTimeline?.(world, {
      careerYearIndex,
      reconcileRosters:false,
      save:false,
    });

    enforceActiveDraftClassInvariant();

    /*
     * A transition that was saved before its rollover listeners completed can
     * carry last year's active stat buckets into September. Before the first
     * game of the new year, resetting those buckets is lossless and restores
     * Team Leaders, league goalie leaders, and award races to preseason state.
     */
    if (!hasCompletedCurrentSeasonGame()) {
      for (const team of world.teams || []) {
        for (const player of team?.roster || []) resetActiveSeasonStats(player);
        for (const key of ['wins','losses','overtimeLosses','points','goalsFor','goalsAgainst']) team[key] = 0;
      }
      resetActiveSeasonStats(world.player);
      if (typeof Game !== 'undefined' && Game?.player) resetActiveSeasonStats(Game.player);
      world.standings = [];
      world.leagueLeaders = null;
      world.currentAwardRaces = null;
      if (world.livingWorld && typeof world.livingWorld === 'object') {
        world.livingWorld.currentAwardRaces = [];
        world.livingWorld.currentAwardRaceSnapshot = null;
      }
    }

    /*
     * Repair the exact double-advance symptom from the old duplicate transition:
     * canonical draft year is the stable class anchor. For generated players
     * without one, the prior season-history grade is the fallback.
     */
    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (!player || player?.isCareerPlayer === true) continue;
        const draftYear = Number(player?.draftYear);
        let grade = Number.isFinite(draftYear) ? 13 - (draftYear - startYear) : null;
        if (!(grade >= 9 && grade <= 12)) {
          const rows = Array.isArray(player?.highSchoolSeasonHistory) ? player.highSchoolSeasonHistory : [];
          const prior = [...rows].reverse().find(row => Number(row?.seasonStartYear) === startYear - 1);
          if (prior && Number(prior.grade) >= 9 && Number(prior.grade) < 12) grade = Number(prior.grade) + 1;
        }
        if (grade >= 9 && grade <= 12) {
          const names = {9:'Freshman',10:'Sophomore',11:'Junior',12:'Senior'};
          player.grade = grade;
          player.schoolYear = names[grade];
          player.classLevel = names[grade];
          player.year = names[grade];
        }
        WorldEngine.normalizeHighSchoolSeasonStatHistory?.(player);
      }
    }

    const career = (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true) || world.player;
    if (career) WorldEngine.normalizeHighSchoolSeasonStatHistory?.(career);

    ensureReturningTryoutAtBoundary();
    ensureSeasonScopedHighSchoolGameIds();
    rebuildProspectRankingsAtSeasonBoundary();
    try { WorldEngine.syncCareerCalendarProjection?.(currentDate); } catch (_) {}

    world.seasonBoundaryIntegrityRepairs[seasonId] = 2;
    WorldEngine.save?.();
    return true;
  }

  function finalizeTransitionTransaction() {
    const world = WorldEngine.state;
    const recap = world?.seasonTransition?.recap;
    if (!recap) return false;
    recap.nextSeasonTransitionComplete = true;
    recap.nextSeasonTransitionStarted = false;
    recap.nextSeasonTransitionCompletedAt = String(
      world?.season?.currentDate || world?.currentDate || recap.nextSeasonTransitionCompletedAt || ''
    ).slice(0,10) || null;
    recap.nextSeasonSeededSeasonId = String(world?.season?.seasonId || world?.season?.id || recap.nextSeasonId || '');
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
    ensureSeasonScopedHighSchoolGameIds();
    rebuildProspectRankingsAtSeasonBoundary();
    repairEarlySeasonBoundaryState();
    finalizeTransitionTransaction();

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
  WorldEngine.repairEarlyHighSchoolSeasonBoundaryState = repairEarlySeasonBoundaryState;
  WorldEngine.runNextHighSchoolSeasonTransition = runNextHighSchoolSeasonTransitionWithIntegrity;

  /*
   * Crash recovery: if a save was written after seeding the new season but
   * before final boundary integrity completed, resume the same transaction on
   * next launch. Old affected saves marked complete too early are repaired by
   * the early-season invariant pass instead.
   */
  setTimeout(() => {
    const recap = WorldEngine.state?.seasonTransition?.recap;
    if (recap?.playerRecapAcknowledged === true && recap?.nextSeasonTransitionComplete !== true) {
      Promise.resolve(WorldEngine.runNextHighSchoolSeasonTransition({ force:true, recovery:true }))
        .catch(error => console.error('[Project Ice] Season-transition recovery failed:', error));
      return;
    }
    repairEarlySeasonBoundaryState();
  }, 0);
})();