'use strict';

/* global WorldEngine, Game, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolRosterRolloverInstalled === true) return;
  WorldEngine.__highSchoolRosterRolloverInstalled = true;

  const VERSION = 1;
  const CLASS_BY_GRADE = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' };
  const FIRST_NAMES = [
    'Aiden','Bennett','Caleb','Carter','Cole','Dylan','Eli','Evan','Finn','Gavin',
    'Hudson','Jack','Jace','Landon','Leo','Logan','Mason','Miles','Nolan','Owen',
    'Parker','Reid','Ryan','Sam','Theo','Tyler','Wyatt','Zach','Blake','Chase',
    'Connor','Easton','Griffin','Hayden','Luke','Max','Nate','Noah','Riley','Tate'
  ];
  const LAST_NAMES = [
    'Anderson','Bennett','Brooks','Campbell','Carter','Collins','Cooper','Davis','Foster','Gray',
    'Green','Hall','Hayes','Hill','Howard','Jensen','Kelly','King','Lee','Martin',
    'Miller','Mitchell','Moore','Morgan','Murphy','Nelson','Parker','Reed','Roberts','Ross',
    'Scott','Stewart','Taylor','Thomas','Turner','Walker','Walsh','Ward','White','Young'
  ];

  const hash = text => {
    let value = 2166136261;
    for (const char of String(text || 'player')) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  };

  const playerId = player => String(player?.playerId || player?.id || '');

  function playerGrade(player) {
    const explicit = Number(player?.grade);
    if (explicit >= 9 && explicit <= 12) return explicit;
    const label = String(player?.schoolYear || player?.classLevel || player?.year || '').toLowerCase();
    if (label.includes('freshman')) return 9;
    if (label.includes('sophomore')) return 10;
    if (label.includes('junior')) return 11;
    if (label.includes('senior')) return 12;
    return null;
  }

  function lifecycle(world = WorldEngine.state) {
    if (!world) return null;
    const root = world.highSchoolRosterLifecycle = world.highSchoolRosterLifecycle || {};
    root.version = VERSION;
    root.graduatedPlayers = Array.isArray(root.graduatedPlayers) ? root.graduatedPlayers : [];
    root.completedSeasonIds = Array.isArray(root.completedSeasonIds) ? root.completedSeasonIds : [];
    return root;
  }

  function resetStats(player) {
    if (!player || typeof player !== 'object') return;
    const zeroKeys = [
      'gamesPlayed','gp','goals','g','assists','a','points','pts','plusMinus','pim',
      'penaltyMinutes','shots','shotsOnGoal','sog','wins','w','losses','l',
      'overtimeLosses','otl','goalsAgainst','ga','saves','shotsAgainst','shutouts','so'
    ];
    for (const key of zeroKeys) if (key in player) player[key] = 0;
    for (const bucket of ['stats','regularSeasonStats','playoffStats']) {
      if (!player[bucket] || typeof player[bucket] !== 'object') continue;
      for (const key of Object.keys(player[bucket])) {
        if (typeof player[bucket][key] === 'number') player[bucket][key] = 0;
      }
    }
  }

  function canonicalGeneratedBirthDate(player, grade, seasonStartYear) {
    const expectedAge = 14 + Math.max(0, grade - 9);
    const seed = hash(`${playerId(player)}:${seasonStartYear}:birth`);
    const month = 1 + (seed % 8); // before Sept. 1 so displayed age matches grade baseline
    const day = 1 + ((seed >>> 8) % 28);
    return `${seasonStartYear - expectedAge}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function repairGeneratedAge(player, seasonStartYear, force = false) {
    if (!player || player?.isCareerPlayer === true) return false;
    const grade = playerGrade(player);
    if (!grade) return false;
    const expectedAge = 14 + (grade - 9);
    const currentAge = Number(player.age);
    const generated = String(player.birthDatePrecision || '').startsWith('generated');
    const obviouslyWrong = !Number.isFinite(currentAge) || Math.abs(currentAge - expectedAge) >= 2;
    if (!force && !generated && !obviouslyWrong) return false;
    if (!force && generated && !obviouslyWrong) return false;
    const birthDate = canonicalGeneratedBirthDate(player, grade, seasonStartYear);
    player.birthDate = birthDate;
    player.effectiveBirthDate = birthDate;
    player.birthDatePrecision = 'generated-day';
    player.age = expectedAge;
    return true;
  }

  function captureGraduatingClass() {
    const world = WorldEngine.state;
    const root = lifecycle(world);
    if (!world || !root) return false;
    const seasonId = String(world?.season?.seasonId || world?.season?.id || world?.currentSeason || 'unknown-season');
    const pending = [];

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        if (player?.isCareerPlayer === true) continue;
        if (playerGrade(player) !== 12) continue;
        pending.push({
          playerId: playerId(player),
          teamId: String(team.teamId || ''),
          seasonId,
          player: JSON.parse(JSON.stringify(player)),
        });
      }
    }

    root.pendingGraduatingSeasonId = seasonId;
    root.pendingGraduates = pending;
    return true;
  }

  function uniqueName(seed, usedNames) {
    for (let offset = 0; offset < 200; offset += 1) {
      const value = hash(`${seed}:${offset}`);
      const firstName = FIRST_NAMES[value % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(value >>> 8) % LAST_NAMES.length];
      const key = `${firstName} ${lastName}`.toLowerCase();
      if (!usedNames.has(key)) {
        usedNames.add(key);
        return { firstName, lastName };
      }
    }
    return { firstName: 'Alex', lastName: `Prospect ${seed}` };
  }

  function adjustAttributes(attributes, seed) {
    if (!attributes || typeof attributes !== 'object') return attributes;
    const copy = JSON.parse(JSON.stringify(attributes));
    const reduction = 5 + (seed % 7);
    for (const [key, value] of Object.entries(copy)) {
      if (typeof value === 'number') copy[key] = Math.max(45, Math.min(99, Math.round(value - reduction)));
    }
    return copy;
  }

  function incomingFreshmanFromGraduate(graduate, team, identity, slotIndex, usedNames) {
    const seed = hash(`${team.teamId}:${identity.seasonId}:${slotIndex}:${playerId(graduate)}`);
    const name = uniqueName(seed, usedNames);
    const id = `hs-${identity.startYear}-freshman-${String(team.teamId || 'team').replace(/^team-/, '')}-${slotIndex + 1}-${seed.toString(36)}`;
    const position = graduate?.position || ['C','LW','RW','D','D','G'][seed % 6];
    const baseOverall = Number(graduate?.overall) || 66;
    const overall = Math.max(55, Math.min(72, Math.round(baseOverall - 5 - (seed % 6))));
    const player = {
      ...JSON.parse(JSON.stringify(graduate || {})),
      id,
      playerId: id,
      prospectId: id,
      firstName: name.firstName,
      lastName: name.lastName,
      fullName: `${name.firstName} ${name.lastName}`,
      name: `${name.firstName} ${name.lastName}`,
      isCareerPlayer: false,
      isUser: false,
      teamId: team.teamId,
      currentTeam: `${team.schoolName || ''} ${team.teamName || ''}`.trim(),
      position,
      grade: 9,
      schoolYear: 'Freshman',
      classLevel: 'Freshman',
      year: 'Freshman',
      age: 14,
      overall,
      startingOverall: overall,
      attributes: adjustAttributes(graduate?.attributes, seed),
      rosterSlot: null,
      startingLine: null,
      lineupAssignment: null,
      lineupStatus: 'active',
      tryoutsComplete: true,
      awards: [],
      awardHistory: [],
      records: [],
      careerTimeline: [],
      seasonHistory: [],
      travelHistory: [],
      generatedIncomingFreshman: true,
      incomingClassSeasonId: identity.seasonId,
      scoutingProfile: {
        ...(graduate?.scoutingProfile && typeof graduate.scoutingProfile === 'object' ? graduate.scoutingProfile : {}),
        publicRank: null,
        previousRank: null,
        trend: 'new',
      },
    };
    resetStats(player);
    const birthDate = canonicalGeneratedBirthDate(player, 9, identity.startYear);
    player.birthDate = birthDate;
    player.effectiveBirthDate = birthDate;
    player.birthDatePrecision = 'generated-day';
    return player;
  }

  function applyRollover(detail = {}) {
    const world = WorldEngine.state;
    const root = lifecycle(world);
    if (!world || !root) return false;
    const seasonId = String(detail.seasonId || world?.season?.seasonId || world?.season?.id || '');
    const startYear = Number(String(detail.startDate || world?.season?.currentDate || '').slice(0, 4)) || Number(world?.season?.seasonStartYear) || 2024;
    const identity = {
      seasonId,
      startYear,
    };

    if (root.completedSeasonIds.includes(seasonId)) return false;

    const pending = Array.isArray(root.pendingGraduates) ? root.pendingGraduates : [];
    const pendingByTeam = new Map();
    for (const item of pending) {
      if (!pendingByTeam.has(item.teamId)) pendingByTeam.set(item.teamId, []);
      pendingByTeam.get(item.teamId).push(item);
    }

    const usedNames = new Set(
      (world.teams || []).flatMap(team => team?.roster || []).map(player =>
        `${player?.firstName || ''} ${player?.lastName || ''}`.trim().toLowerCase()
      ).filter(Boolean)
    );

    let graduatedCount = 0;
    let incomingCount = 0;

    for (const team of world.teams || []) {
      const teamId = String(team.teamId || '');
      const graduates = pendingByTeam.get(teamId) || [];
      const graduateIds = new Set(graduates.map(item => item.playerId));
      const roster = Array.isArray(team.roster) ? team.roster : [];

      if (graduates.length > 0) {
        team.roster = roster.filter(player => !graduateIds.has(playerId(player)));
        graduates.forEach(item => {
          root.graduatedPlayers.push({
            ...item.player,
            graduatedFromTeamId: teamId,
            graduatedAfterSeasonId: item.seasonId,
            graduationStatus: 'graduated',
          });
        });
        graduatedCount += graduates.length;

        graduates.forEach((item, index) => {
          team.roster.push(incomingFreshmanFromGraduate(item.player, team, identity, index, usedNames));
          incomingCount += 1;
        });
      }

      for (const player of team.roster || []) {
        repairGeneratedAge(player, startYear, false);
      }

      try {
        WorldEngine.refreshTeamRosterManagement?.(team.teamId, { save: false });
      } catch (error) {
        console.warn('[Project Ice] Could not refresh rollover lineup:', team.teamId, error);
      }
    }

    root.lastRollover = {
      seasonId,
      appliedAt: String(detail.startDate || world?.season?.currentDate || ''),
      graduatedCount,
      incomingCount,
    };
    root.completedSeasonIds.push(seasonId);
    root.pendingGraduates = [];
    root.pendingGraduatingSeasonId = null;

    WorldEngine.syncPlayerAges?.(world, detail.startDate || world?.season?.currentDate);
    WorldEngine.save?.();
    try { refreshCareerUI?.(); } catch (_) {}
    return true;
  }

  window.addEventListener('projectice:player-season-recap-complete', captureGraduatingClass);
  window.addEventListener('projectice:next-high-school-season-started', event => {
    applyRollover(event?.detail || {});
  });

  WorldEngine.captureHighSchoolGraduatingClass = captureGraduatingClass;
  WorldEngine.applyHighSchoolRosterRollover = applyRollover;
})();
