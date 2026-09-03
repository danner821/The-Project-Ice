'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__careerTimeServiceInstalled === true) return;
  WorldEngine.__careerTimeServiceInstalled = true;

  const VERSION = 1;
  const CANONICAL_START_YEAR = 2022;
  const LEGACY_START_YEAR = 2026;
  const YEAR_SHIFT = CANONICAL_START_YEAR - LEGACY_START_YEAR;
  const CLASS_NAMES = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  function seasonIdentity(index = 0) {
    const careerYearIndex = Math.max(0, Math.min(3, Number(index) || 0));
    const startYear = CANONICAL_START_YEAR + careerYearIndex;
    return {
      careerYearIndex,
      schoolYear: CLASS_NAMES[careerYearIndex],
      startYear,
      endYear: startYear + 1,
      label: `${startYear}-${String(startYear + 1).slice(-2)}`,
      seasonId: `hs-${startYear}-${startYear + 1}`,
      startDate: `${startYear}-09-01`,
      tryoutDate: `${startYear}-09-02`,
      transitionDate: `${startYear + 1}-08-31`,
    };
  }

  function hash(text) {
    let value = 2166136261;
    for (const char of String(text || 'player')) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function playerId(player) {
    return String(
      player?.playerId ||
      player?.id ||
      player?.prospectId ||
      `${player?.firstName || ''}-${player?.lastName || ''}` ||
      'player'
    );
  }

  function fullBirthDate(value) {
    const key = dateKey(value);
    return key || null;
  }

  function birthYearOnly(value) {
    const text = String(value || '').trim();
    return /^\d{4}$/.test(text) ? Number(text) : null;
  }

  function calculateAge(birthDate, onDate) {
    const dob = fullBirthDate(birthDate);
    const now = dateKey(onDate);
    if (!dob || !now) return null;
    const birthYear = Number(dob.slice(0, 4));
    const currentYear = Number(now.slice(0, 4));
    if (!Number.isFinite(birthYear) || !Number.isFinite(currentYear)) return null;
    let age = currentYear - birthYear;
    if (now.slice(5) < dob.slice(5)) age -= 1;
    return Math.max(0, age);
  }

  function currentWorldDate(world = WorldEngine.state) {
    return dateKey(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate ||
      Game?.player?.currentDate
    );
  }

  function generatedEffectiveBirthDate(player, anchorDate) {
    const anchor = dateKey(anchorDate) || seasonIdentity(0).startDate;
    const currentAge = Math.max(13, Math.min(19, Number(player?.age) || 14));
    const seed = hash(playerId(player));
    const month = 1 + (seed % 12);
    const day = 1 + ((seed >>> 8) % 28);
    const md = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const anchorYear = Number(anchor.slice(0, 4));
    const birthYear = anchorYear - currentAge - (md > anchor.slice(5) ? 1 : 0);
    return `${birthYear}-${md}`;
  }

  function effectiveDateForYearOnly(player, year) {
    const seed = hash(`${playerId(player)}:birth-date`);
    const month = 1 + (seed % 12);
    const day = 1 + ((seed >>> 8) % 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function ensurePlayerBirthDate(player, anchorDate) {
    if (!player || typeof player !== 'object') return false;
    let changed = false;
    const factualFull = fullBirthDate(player.birthDate);
    const factualYear = birthYearOnly(player.birthDate);

    if (factualFull) {
      if (player.birthDatePrecision !== 'day') {
        player.birthDatePrecision = 'day';
        changed = true;
      }
      if (player.effectiveBirthDate !== factualFull) {
        player.effectiveBirthDate = factualFull;
        changed = true;
      }
    } else if (factualYear) {
      const effective = fullBirthDate(player.effectiveBirthDate) || effectiveDateForYearOnly(player, factualYear);
      if (player.birthDatePrecision !== 'year') {
        player.birthDatePrecision = 'year';
        changed = true;
      }
      if (player.effectiveBirthDate !== effective) {
        player.effectiveBirthDate = effective;
        changed = true;
      }
    } else {
      const generated = fullBirthDate(player.effectiveBirthDate) || generatedEffectiveBirthDate(player, anchorDate);
      if (player.birthDate !== generated) {
        player.birthDate = generated;
        changed = true;
      }
      if (player.birthDatePrecision !== 'generated-day') {
        player.birthDatePrecision = 'generated-day';
        changed = true;
      }
      if (player.effectiveBirthDate !== generated) {
        player.effectiveBirthDate = generated;
        changed = true;
      }
    }
    return changed;
  }

  function collectPlayers(world = WorldEngine.state) {
    const result = [];
    const seen = new Set();
    const add = player => {
      if (!player || typeof player !== 'object' || seen.has(player)) return;
      seen.add(player);
      result.push(player);
    };

    add(world?.player);
    for (const team of world?.teams || []) {
      for (const player of team?.roster || []) add(player);
    }

    const travelTeams =
      world?.travelHockey?.teams ||
      world?.travelHockey?.tournament?.teams ||
      world?.travelHockey?.world?.teams ||
      [];
    for (const team of travelTeams) {
      for (const player of team?.roster || []) add(player);
    }

    for (const player of WorldEngine.getAllWorldPlayers?.() || []) add(player);
    return result;
  }

  function syncPlayerAges(world = WorldEngine.state, explicitDate = null) {
    if (!world) return false;
    const now = dateKey(explicitDate) || currentWorldDate(world);
    if (!now) return false;

    let changed = false;
    for (const player of collectPlayers(world)) {
      if (ensurePlayerBirthDate(player, now)) changed = true;
      const age = calculateAge(player.effectiveBirthDate || player.birthDate, now);
      if (Number.isFinite(age) && Number(player.age) !== age) {
        player.age = age;
        changed = true;
      }
    }

    if (typeof Game !== 'undefined' && Game?.player) {
      if (ensurePlayerBirthDate(Game.player, now)) changed = true;
      const age = calculateAge(Game.player.effectiveBirthDate || Game.player.birthDate, now);
      if (Number.isFinite(age) && Number(Game.player.age) !== age) {
        Game.player.age = age;
        changed = true;
      }
    }

    const root = world.careerTime = world.careerTime || {};
    if (root.version !== VERSION || root.lastAgeSyncDate !== now) {
      root.version = VERSION;
      root.lastAgeSyncDate = now;
      changed = true;
    }
    return changed;
  }

  function shiftIsoYear(value, delta) {
    const key = dateKey(value);
    if (!key) return value;
    const year = Number(key.slice(0, 4));
    if (!Number.isFinite(year)) return value;
    return `${year + delta}${String(value).slice(4)}`;
  }

  function shiftScheduleDates(world, delta) {
    for (const event of world?.schedule || []) {
      if (dateKey(event?.date)) event.date = shiftIsoYear(event.date, delta);
      for (const field of ['scheduledDate', 'gameDate', 'startDate', 'endDate']) {
        if (dateKey(event?.[field])) event[field] = shiftIsoYear(event[field], delta);
      }
    }
  }

  function syncCurrentDateCopies(world, date) {
    if (!world || !dateKey(date)) return;
    world.currentDate = date;
    world.player = world.player || {};
    world.player.currentDate = date;
    world.season = world.season || {};
    world.season.currentDate = date;

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (player?.isCareerPlayer === true) player.currentDate = date;
      }
    }
    if (typeof Game !== 'undefined' && Game?.player) Game.player.currentDate = date;
  }

  function hasRecordedScore(event) {
    return ['homeScore', 'awayScore', 'scoreFor', 'scoreAgainst'].some(field => {
      const value = event?.[field];
      return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
    });
  }

  function hasPlayedSeasonGame(world) {
    const schedulePlayed = (world?.schedule || []).some(event =>
      event?.played === true ||
      event?.completed === true ||
      event?.isCompleted === true ||
      hasRecordedScore(event)
    );
    const teamStats = (world?.teams || []).some(team =>
      Number(team?.wins || 0) > 0 ||
      Number(team?.losses || 0) > 0 ||
      Number(team?.overtimeLosses || 0) > 0
    );
    return schedulePlayed || teamStats;
  }

  function isLegacyFreshCareer(world = WorldEngine.state) {
    if (!world) return false;
    const now = currentWorldDate(world);
    if (!now || !/^2026-09-0[12]$/.test(now)) return false;
    if (world?.travelHockey?.completed === true) return false;
    if (world?.postseason?.highSchool?.initialized === true) return false;
    if (hasPlayedSeasonGame(world)) return false;

    const yearLabel = String(
      world?.player?.schoolYear ||
      world?.player?.classLevel ||
      world?.player?.year ||
      Game?.player?.year ||
      'Freshman'
    ).toLowerCase();
    return !yearLabel || yearLabel.includes('freshman');
  }

  function normalizeFreshCareerTimeline(world = WorldEngine.state) {
    if (!isLegacyFreshCareer(world)) return false;
    const oldDate = currentWorldDate(world);
    const newDate = shiftIsoYear(oldDate, YEAR_SHIFT);
    const identity = seasonIdentity(0);

    shiftScheduleDates(world, YEAR_SHIFT);
    syncCurrentDateCopies(world, newDate);

    world.currentSeason = identity.label;
    world.currentYear = identity.startYear;
    world.season = world.season || {};
    Object.assign(world.season, {
      seasonId: identity.seasonId,
      label: identity.label,
      seasonLabel: identity.label,
      seasonStartYear: identity.startYear,
      seasonEndYear: identity.endYear,
      currentYear: identity.startYear,
      careerYearIndex: 0,
      schoolYear: 'Freshman',
    });

    world.player = world.player || {};
    world.player.year = 'Freshman';
    world.player.schoolYear = 'Freshman';
    if (typeof Game !== 'undefined' && Game?.player) {
      Game.player.year = 'Freshman';
      Game.player.schoolYear = 'Freshman';
    }

    world.careerTime = {
      ...(world.careerTime || {}),
      version: VERSION,
      canonicalTimeline: true,
      normalizedFromLegacyFreshTimeline: true,
      normalizedFromDate: oldDate,
      normalizedToDate: newDate,
    };

    syncPlayerAges(world, newDate);
    return true;
  }

  function afterWorldMutation(result, options = {}) {
    const changedTimeline = options.normalizeFresh === true
      ? normalizeFreshCareerTimeline(WorldEngine.state)
      : false;
    const changedAges = syncPlayerAges(WorldEngine.state);
    if ((changedTimeline || changedAges) && options.save !== false) WorldEngine.save?.();
    return result;
  }

  function wrapSync(name, options = {}) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__careerTimeWrapped === true) return;
    const wrapped = function(...args) {
      const result = original.apply(WorldEngine, args);
      afterWorldMutation(result, options);
      return result;
    };
    wrapped.__careerTimeWrapped = true;
    WorldEngine[name] = wrapped;
  }

  function wrapAsync(name, options = {}) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__careerTimeWrapped === true) return;
    const wrapped = async function(...args) {
      const result = await original.apply(WorldEngine, args);
      afterWorldMutation(result, options);
      return result;
    };
    wrapped.__careerTimeWrapped = true;
    WorldEngine[name] = wrapped;
  }

  WorldEngine.getHighSchoolSeasonIdentity = seasonIdentity;
  WorldEngine.calculateAgeOnDate = calculateAge;
  WorldEngine.ensurePlayerBirthDate = ensurePlayerBirthDate;
  WorldEngine.syncPlayerAges = syncPlayerAges;
  WorldEngine.normalizeFreshCareerTimeline = normalizeFreshCareerTimeline;

  wrapAsync('beginNewCareerSave', { normalizeFresh: true, save: true });
  wrapSync('finalizeFreshCareerAfterTryouts', { normalizeFresh: true, save: true });
  wrapAsync('selectCareerSave', { normalizeFresh: true, save: true });
  wrapSync('setCurrentDate', { save: true });
  wrapSync('advanceDay', { save: true });
  wrapSync('advanceToDate', { save: true });

  /* Existing progressed careers keep their date. Only birthdate/age state is reconciled. */
  syncPlayerAges(WorldEngine.state);
})();
