'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__highSchoolLeadershipInstalled === true) return;
  WorldEngine.__highSchoolLeadershipInstalled = true;

  const VERSION = 1;
  const playerId = player => String(player?.playerId || player?.id || '');

  const isHighSchoolTeam = team => {
    const id = String(team?.teamId || '');
    return Boolean(
      id.startsWith('team-') &&
      !id.startsWith('team-travel-') &&
      Array.isArray(team?.roster)
    );
  };

  const isGoalie = player =>
    String(player?.position || '').toUpperCase() === 'G';

  const gradeValue = player => {
    const explicit = Number(player?.grade);
    if (explicit >= 9 && explicit <= 12) return explicit;

    const label = String(
      player?.schoolYear ||
      player?.classLevel ||
      player?.year ||
      ''
    ).toLowerCase();

    if (label.includes('senior')) return 12;
    if (label.includes('junior')) return 11;
    if (label.includes('sophomore')) return 10;
    if (label.includes('freshman')) return 9;
    return 9;
  };

  const existingLetter = player => {
    if (
      player?.captain === true ||
      player?.isCaptain === true ||
      String(player?.captainRole || '').toUpperCase() === 'C' ||
      String(player?.leadershipLetter || '').toUpperCase() === 'C' ||
      String(player?.letter || '').toUpperCase() === 'C'
    ) return 'C';

    if (
      player?.alternateCaptain === true ||
      player?.isAlternateCaptain === true ||
      player?.alternate === true ||
      player?.isAlternate === true ||
      String(player?.captainRole || '').toUpperCase() === 'A' ||
      String(player?.leadershipLetter || '').toUpperCase() === 'A' ||
      String(player?.letter || '').toUpperCase() === 'A'
    ) return 'A';

    return '';
  };

  const leadershipRating = player =>
    Number(
      player?.attributes?.leadership ??
      player?.leadership ??
      player?.intangibles ??
      50
    ) || 50;

  const leadershipScore = player => {
    const existing = existingLetter(player);
    const letterBonus = existing === 'C' ? 1000 : existing === 'A' ? 650 : 0;
    const gradeBonus = gradeValue(player) * 30;
    const overall = Number(player?.overall ?? player?.ovr ?? player?.rating ?? 60) || 60;
    const leadership = leadershipRating(player);
    const trust = Number(player?.coachTrust ?? player?.trust ?? 50) || 50;

    return (
      letterBonus +
      gradeBonus +
      overall * 4 +
      leadership * 2 +
      trust
    );
  };

  function clearLeadership(player) {
    if (!player || typeof player !== 'object') return;

    player.captain = false;
    player.isCaptain = false;
    player.alternate = false;
    player.isAlternate = false;
    player.alternateCaptain = false;
    player.isAlternateCaptain = false;

    if ('captainRole' in player) delete player.captainRole;
    if ('leadershipRole' in player) delete player.leadershipRole;
    if ('captainLetter' in player) delete player.captainLetter;
    if ('leadershipLetter' in player) delete player.leadershipLetter;
    if ('letter' in player) delete player.letter;
    if ('teamCaptain' in player) delete player.teamCaptain;
    if ('teamAlternate' in player) delete player.teamAlternate;
  }

  function markCaptain(player) {
    clearLeadership(player);
    player.captain = true;
    player.isCaptain = true;
    player.captainRole = 'C';
    player.leadershipRole = 'captain';
    player.captainLetter = 'C';
    player.leadershipLetter = 'C';
    player.letter = 'C';
    player.teamCaptain = true;
  }

  function markAlternate(player) {
    clearLeadership(player);
    player.alternate = true;
    player.isAlternate = true;
    player.alternateCaptain = true;
    player.isAlternateCaptain = true;
    player.captainRole = 'A';
    player.leadershipRole = 'alternate';
    player.captainLetter = 'A';
    player.leadershipLetter = 'A';
    player.letter = 'A';
    player.teamAlternate = true;
  }

  function assignTeamLeadership(team) {
    if (!isHighSchoolTeam(team)) return false;

    const roster = (team.roster || []).filter(player =>
      player &&
      playerId(player) &&
      !isGoalie(player)
    );

    if (roster.length < 3) return false;

    const ranked = [...roster].sort((a, b) =>
      leadershipScore(b) - leadershipScore(a) ||
      String(playerId(a)).localeCompare(String(playerId(b)))
    );

    const captain = ranked[0] || null;
    const alternates = ranked.slice(1, 3);
    if (!captain || alternates.length < 2) return false;

    let changed = false;

    for (const player of team.roster || []) {
      const before = JSON.stringify({
        captain: player?.captain,
        isCaptain: player?.isCaptain,
        alternate: player?.alternate,
        isAlternate: player?.isAlternate,
        alternateCaptain: player?.alternateCaptain,
        isAlternateCaptain: player?.isAlternateCaptain,
        captainRole: player?.captainRole,
        leadershipRole: player?.leadershipRole,
        captainLetter: player?.captainLetter,
        leadershipLetter: player?.leadershipLetter,
        letter: player?.letter,
      });

      if (player === captain) markCaptain(player);
      else if (alternates.includes(player)) markAlternate(player);
      else clearLeadership(player);

      const after = JSON.stringify({
        captain: player?.captain,
        isCaptain: player?.isCaptain,
        alternate: player?.alternate,
        isAlternate: player?.isAlternate,
        alternateCaptain: player?.alternateCaptain,
        isAlternateCaptain: player?.isAlternateCaptain,
        captainRole: player?.captainRole,
        leadershipRole: player?.leadershipRole,
        captainLetter: player?.captainLetter,
        leadershipLetter: player?.leadershipLetter,
        letter: player?.letter,
      });

      if (before !== after) changed = true;
    }

    const captainId = playerId(captain);
    const alternateCaptainIds = alternates.map(playerId);

    if (String(team.captainId || '') !== captainId) changed = true;
    if (
      JSON.stringify((team.alternateCaptainIds || []).map(String)) !==
      JSON.stringify(alternateCaptainIds)
    ) changed = true;

    team.captainId = captainId;
    team.alternateCaptainIds = alternateCaptainIds;
    team.captains = [
      { playerId: captainId, role: 'C' },
      ...alternateCaptainIds.map(id => ({ playerId: id, role: 'A' })),
    ];
    team.leadership = {
      version: VERSION,
      captainId,
      alternateCaptainIds: [...alternateCaptainIds],
    };

    return changed;
  }

  function syncHighSchoolLeadership(options = {}) {
    const teams = Array.isArray(WorldEngine.state?.teams)
      ? WorldEngine.state.teams
      : [];

    let changed = false;
    for (const team of teams) {
      if (assignTeamLeadership(team)) changed = true;
    }

    if (changed && options.save !== false) {
      WorldEngine.save?.();
    }

    return changed;
  }

  const baseEnsureGeneratedRosters =
    typeof WorldEngine.ensureGeneratedRosters === 'function'
      ? WorldEngine.ensureGeneratedRosters.bind(WorldEngine)
      : null;

  if (
    baseEnsureGeneratedRosters &&
    WorldEngine.__highSchoolLeadershipRosterWrapped !== true
  ) {
    WorldEngine.ensureGeneratedRosters = function(...args) {
      const result = baseEnsureGeneratedRosters(...args);
      syncHighSchoolLeadership({ save: true });
      return result;
    };
    WorldEngine.__highSchoolLeadershipRosterWrapped = true;
  }

  window.addEventListener('projectice:next-high-school-season-started', () => {
    syncHighSchoolLeadership({ save: true });
  });

  WorldEngine.syncHighSchoolLeadership = syncHighSchoolLeadership;
})();
