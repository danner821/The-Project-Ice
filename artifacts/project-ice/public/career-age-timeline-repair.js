'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__careerAgeTimelineRepairInstalled === true) return;
  WorldEngine.__careerAgeTimelineRepairInstalled = true;

  const hash = text => {
    let value = 2166136261;
    for (const char of String(text || 'player')) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  };

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

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

  function idOf(player) {
    return String(player?.playerId || player?.id || player?.prospectId || `${player?.firstName || ''}-${player?.lastName || ''}` || 'player');
  }

  function expectedAgeForGrade(grade) {
    return 14 + Math.max(0, grade - 9);
  }

  function generatedBirthDate(player, grade, seasonStartYear) {
    const seed = hash(`${idOf(player)}:canonical-hs-birth`);
    const month = 1 + (seed % 8);
    const day = 1 + ((seed >>> 8) % 28);
    const ageOnSeptemberFirst = expectedAgeForGrade(grade);
    return `${seasonStartYear - ageOnSeptemberFirst}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function collectPlayers(world) {
    const players = [];
    const seenIds = new Set();
    const add = player => {
      if (!player || typeof player !== 'object') return;
      const id = idOf(player) || `object-${players.length}`;
      if (seenIds.has(id) && player?.isCareerPlayer !== true) return;
      seenIds.add(id);
      players.push(player);
    };
    add(world?.player);
    for (const team of world?.teams || []) for (const player of team?.roster || []) add(player);
    return players;
  }

  function repairPlayer(player, seasonStartYear) {
    const grade = gradeOf(player);
    if (!grade) return false;
    const expectedAge = expectedAgeForGrade(grade);
    const age = Number(player.age);
    const precision = String(player.birthDatePrecision || '');
    const generated = precision.startsWith('generated') || !dateKey(player.birthDate);
    const wrongByYears = !Number.isFinite(age) || Math.abs(age - expectedAge) >= 2;

    // Preserve factual DOBs. This repair only owns generated/legacy synthetic dates.
    if (!generated && !wrongByYears) return false;
    if (!generated && precision === 'day') return false;
    if (!wrongByYears && generated) return false;

    const birthDate = generatedBirthDate(player, grade, seasonStartYear);
    player.birthDate = birthDate;
    player.effectiveBirthDate = birthDate;
    player.birthDatePrecision = 'generated-day';
    player.age = expectedAge;
    return true;
  }

  function repairWorldAges(world = WorldEngine.state, explicitDate = null) {
    if (!world) return false;
    const date = dateKey(explicitDate) || dateKey(world?.season?.currentDate) || dateKey(world?.currentDate);
    if (!date) return false;
    const seasonStartYear = Number(world?.season?.seasonStartYear) || Number(date.slice(0, 4));
    if (!Number.isFinite(seasonStartYear)) return false;

    let changed = false;
    for (const player of collectPlayers(world)) {
      if (repairPlayer(player, seasonStartYear)) changed = true;
    }

    const career = (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true) || world.player;
    if (career && world.player && career !== world.player) {
      world.player.age = career.age;
      world.player.birthDate = career.birthDate;
      world.player.effectiveBirthDate = career.effectiveBirthDate;
      world.player.birthDatePrecision = career.birthDatePrecision;
    }
    if (typeof Game !== 'undefined' && Game?.player && career) {
      Game.player.age = career.age;
      Game.player.birthDate = career.birthDate;
      Game.player.effectiveBirthDate = career.effectiveBirthDate;
      Game.player.birthDatePrecision = career.birthDatePrecision;
    }

    if (changed) {
      WorldEngine.syncPlayerAges?.(world, date);
      WorldEngine.save?.();
    }
    return changed;
  }

  function wrapAsync(name) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__canonicalAgeRepairWrapped === true) return;
    const wrapped = async function(...args) {
      const result = await original.apply(WorldEngine, args);
      repairWorldAges(WorldEngine.state);
      return result;
    };
    wrapped.__canonicalAgeRepairWrapped = true;
    WorldEngine[name] = wrapped;
  }

  function wrapSync(name) {
    const original = WorldEngine[name];
    if (typeof original !== 'function' || original.__canonicalAgeRepairWrapped === true) return;
    const wrapped = function(...args) {
      const result = original.apply(WorldEngine, args);
      repairWorldAges(WorldEngine.state);
      return result;
    };
    wrapped.__canonicalAgeRepairWrapped = true;
    WorldEngine[name] = wrapped;
  }

  wrapAsync('beginNewCareerSave');
  wrapAsync('selectCareerSave');
  wrapSync('finalizeFreshCareerAfterTryouts');

  window.addEventListener('projectice:next-high-school-season-started', event => {
    repairWorldAges(WorldEngine.state, event?.detail?.startDate || null);
  });

  WorldEngine.repairCanonicalHighSchoolAges = repairWorldAges;
})();
