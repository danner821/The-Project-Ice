'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__canonicalHighSchoolTimelineInstalled === true) return;
  WorldEngine.__canonicalHighSchoolTimelineInstalled = true;

  const VERSION = 3;
  const CANONICAL_START_YEAR = 2023;
  const CLASS_NAMES = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  function careerPlayer(world = WorldEngine.state) {
    if (!world) return null;
    return (world.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true) || world.player || null;
  }

  function gradeOf(player) {
    const explicit = Number(player?.grade);
    if (explicit >= 9 && explicit <= 12) return explicit;
    const label = String(player?.schoolYear || player?.classLevel || player?.year || '').toLowerCase();
    if (label.includes('freshman')) return 9;
    if (label.includes('sophomore')) return 10;
    if (label.includes('junior')) return 11;
    if (label.includes('senior')) return 12;
    return null;
  }

  function isSyntheticDevFixture(world = WorldEngine.state) {
    const travel = world?.travelHockey || {};
    const tournament = travel?.tournament || {};
    const post = world?.postseason?.highSchool || {};
    return Boolean(
      travel.syntheticDevCheckpoint === true ||
      travel.syntheticPostTravelOffseason === true ||
      tournament.syntheticDevCheckpoint === true ||
      tournament.syntheticPostTravelOffseason === true ||
      post.syntheticDevCheckpoint === true
    );
  }

  function indexFromCanonicalDate(world = WorldEngine.state) {
    const date = dateKey(world?.season?.currentDate || world?.currentDate || world?.player?.currentDate);
    if (!date) return null;
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const startYear = month >= 9 ? year : year - 1;
    const index = startYear - CANONICAL_START_YEAR;
    return index >= 0 && index <= 3 ? index : null;
  }

  function inferCareerYearIndex(world = WorldEngine.state) {
    if (!world) return 0;
    const rawDate = dateKey(world?.season?.currentDate || world?.currentDate || world?.player?.currentDate);
    const rawYear = Number(rawDate?.slice(0, 4));

    /* The reusable dev fixture completed freshman year while it still carried
       the retired 2026-27 bootstrap date. Its lifecycle position is freshman. */
    if (isSyntheticDevFixture(world) && Number.isFinite(rawYear) && rawYear >= 2027) return 0;

    const fromDate = indexFromCanonicalDate(world);
    if (fromDate !== null) return fromDate;

    const explicit = Number(world?.season?.careerYearIndex);
    if (explicit >= 0 && explicit <= 3) return explicit;

    const grade = gradeOf(careerPlayer(world) || world?.player || Game?.player);
    if (grade) return Math.max(0, Math.min(3, grade - 9));
    return 0;
  }

  function identity(index) {
    return WorldEngine.getHighSchoolSeasonIdentity?.(index) || {
      careerYearIndex: index,
      schoolYear: CLASS_NAMES[index],
      startYear: CANONICAL_START_YEAR + index,
      endYear: CANONICAL_START_YEAR + index + 1,
      label: `${CANONICAL_START_YEAR + index}-${String(CANONICAL_START_YEAR + index + 1).slice(-2)}`,
      seasonId: `hs-${CANONICAL_START_YEAR + index}-${CANONICAL_START_YEAR + index + 1}`,
      startDate: `${CANONICAL_START_YEAR + index}-09-01`,
      tryoutDate: `${CANONICAL_START_YEAR + index}-09-02`,
    };
  }

  function normalizeNpcClass(player, startYear, assign) {
    if (!player || player?.isCareerPlayer === true) return;
    const draftYear = Number(player?.draftYear);
    if (!Number.isFinite(draftYear)) return;
    const grade = 13 - (draftYear - Number(startYear));
    if (grade < 9 || grade > 12) return;
    const label = CLASS_NAMES[grade - 9];
    assign(player, 'grade', grade);
    assign(player, 'schoolYear', label);
    assign(player, 'classLevel', label);
    assign(player, 'year', label);
  }

  function reconcileExpiredDraftClasses(world, id) {
    if (!world || !id || typeof WorldEngine.applyHighSchoolRosterRollover !== 'function') return false;
    if (Number(id.careerYearIndex) <= 0) return false;

    const cutoffDraftYear = Number(id.startYear) + 1;
    const lifecycle = world.highSchoolRosterLifecycle = world.highSchoolRosterLifecycle || {};
    if (lifecycle.canonicalReconcileInProgress === true) return false;

    const expired = [];
    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (!player || player?.isCareerPlayer === true) continue;
        const draftYear = Number(player?.draftYear);
        if (!Number.isFinite(draftYear) || draftYear >= cutoffDraftYear) continue;
        expired.push({
          playerId: String(player?.playerId || player?.id || ''),
          teamId: String(team?.teamId || ''),
          seasonId: `hs-${id.startYear - 1}-${id.startYear}`,
          player: structuredClone(player),
        });
      }
    }

    if (!expired.length) return false;

    lifecycle.pendingGraduatingSeasonId = `hs-${id.startYear - 1}-${id.startYear}`;
    lifecycle.pendingGraduates = expired;
    lifecycle.canonicalReconcileInProgress = true;
    try {
      WorldEngine.applyHighSchoolRosterRollover({
        seasonId: id.seasonId,
        careerYearIndex: id.careerYearIndex,
        schoolYear: id.schoolYear,
        startDate: id.startDate,
        tryoutDate: id.tryoutDate,
        canonicalIntegrityRepair: true,
      });
    } finally {
      lifecycle.canonicalReconcileInProgress = false;
    }
    return true;
  }

  function normalize(world = WorldEngine.state, options = {}) {
    if (!world) return false;
    const index = Number.isFinite(Number(options.careerYearIndex))
      ? Math.max(0, Math.min(3, Number(options.careerYearIndex)))
      : inferCareerYearIndex(world);
    const id = identity(index);
    const season = world.season = world.season || {};
    let changed = false;

    const assign = (target, key, value) => {
      if (!target || target[key] === value) return;
      target[key] = value;
      changed = true;
    };

    assign(world, 'currentSeason', id.label);
    assign(world, 'currentYear', id.startYear);
    assign(season, 'seasonId', id.seasonId);
    assign(season, 'id', id.seasonId);
    assign(season, 'label', id.label);
    assign(season, 'seasonLabel', id.label);
    assign(season, 'seasonStartYear', id.startYear);
    assign(season, 'seasonEndYear', id.endYear);
    assign(season, 'currentYear', id.startYear);
    assign(season, 'careerYearIndex', index);
    assign(season, 'careerYear', index + 1);
    assign(season, 'schoolYear', id.schoolYear);

    const player = careerPlayer(world);
    if (player) {
      assign(player, 'grade', index + 9);
      assign(player, 'schoolYear', id.schoolYear);
      assign(player, 'classLevel', id.schoolYear);
      assign(player, 'year', id.schoolYear);
    }
    if (world.player) {
      assign(world.player, 'grade', index + 9);
      assign(world.player, 'schoolYear', id.schoolYear);
      assign(world.player, 'classLevel', id.schoolYear);
      assign(world.player, 'year', id.schoolYear);
    }

    /* Draft year is the stable HS class anchor for NPCs. Repairing grade here
       means graduation, age, profile history and rankings all read one class. */
    for (const team of world.teams || []) {
      for (const rosterPlayer of team?.roster || []) normalizeNpcClass(rosterPlayer, id.startYear, assign);
    }

    if (typeof Game !== 'undefined' && Game?.player) {
      Game.player.grade = index + 9;
      Game.player.schoolYear = id.schoolYear;
      Game.player.classLevel = id.schoolYear;
      Game.player.year = id.schoolYear;
    }

    const root = world.canonicalHighSchoolTimeline = world.canonicalHighSchoolTimeline || {};
    root.version = VERSION;
    root.careerYearIndex = index;
    root.startYear = id.startYear;
    root.seasonId = id.seasonId;
    root.syntheticFixture = isSyntheticDevFixture(world);

    WorldEngine.repairCanonicalHighSchoolAges?.(world, season.currentDate || world.currentDate || null);

    /* Active HS rosters may never contain a player from a draft class that has
       already aged out of the current season. This is a world-state invariant,
       not a Prospects-screen filter. The rollover service archives/removes the
       expired player and creates the replacement freshman before presentation. */
    const reconciledRosters = options.reconcileRosters === false
      ? false
      : reconcileExpiredDraftClasses(world, id);

    if ((changed || reconciledRosters) && options.save !== false) WorldEngine.save?.();
    return changed || reconciledRosters;
  }

  function wrapAsync(name) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__canonicalTimelineWrapped === true) return;
    const wrapped = async function(...args) {
      const result = await original.apply(WorldEngine, args);
      normalize(WorldEngine.state, { save: true });
      return result;
    };
    wrapped.__canonicalTimelineWrapped = true;
    WorldEngine[name] = wrapped;
  }

  function wrapSync(name) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__canonicalTimelineWrapped === true) return;
    const wrapped = function(...args) {
      const result = original.apply(WorldEngine, args);
      normalize(WorldEngine.state, { save: true });
      return result;
    };
    wrapped.__canonicalTimelineWrapped = true;
    WorldEngine[name] = wrapped;
  }

  wrapAsync('beginNewCareerSave');
  wrapAsync('selectCareerSave');
  wrapSync('finalizeFreshCareerAfterTryouts');

  window.addEventListener('projectice:next-high-school-season-started', event => {
    const detailIndex = Number(event?.detail?.careerYearIndex);
    normalize(WorldEngine.state, {
      careerYearIndex: Number.isFinite(detailIndex) ? detailIndex : undefined,
      save: false,
    });
  });

  WorldEngine.normalizeCanonicalHighSchoolTimeline = normalize;
  WorldEngine.reconcileExpiredHighSchoolDraftClasses = () => {
    const index = inferCareerYearIndex(WorldEngine.state);
    return reconcileExpiredDraftClasses(WorldEngine.state, identity(index));
  };
  WorldEngine.getCanonicalHighSchoolCareerYearIndex = () => inferCareerYearIndex(WorldEngine.state);
  WorldEngine.getCanonicalHighSchoolSeasonStartYear = () => identity(inferCareerYearIndex(WorldEngine.state)).startYear;

  normalize(WorldEngine.state, { save: false });
})();
