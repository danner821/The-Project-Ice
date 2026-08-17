from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

anchor='''  function processPersistentScoutingReports(dateString) {\n'''
if anchor not in s:
    raise SystemExit('persistent scouting reports anchor missing')

helpers=r'''  function getScoutingOrganizationPool(player = {}) {
    const age = Math.max(14, Number(player.age) || 14);
    const levelText = [
      player.teamLevel,
      player.level,
      player.league,
      player.currentLeague,
      player.careerLevel,
    ].filter(Boolean).join(' ').toLowerCase();

    if (/nhl/.test(levelText)) {
      return [
        'NHL Pro Scouting',
        'National Media Watch',
        'International Pro Scouting',
      ];
    }

    if (/college|ncaa/.test(levelText) || age >= 18) {
      return [
        'NHL Central Scouting',
        'NHL Team Scouts',
        'Pro Development Staff',
      ];
    }

    if (age >= 16) {
      return [
        'NHL Central Scouting',
        'College Programs',
        'Junior Hockey Scouts',
      ];
    }

    return [
      'Regional Prep Scouts',
      'Junior Hockey Scouts',
      'College Programs',
    ];
  }

  function updateScoutingOrganizationsWatching(player = {}, dateString) {
    if (!player || typeof player !== 'object') {
      return { success: false, updated: false, reason: 'invalid-player' };
    }

    ensureCanonicalPlayerContract(player);
    const profile = player.scoutingProfile && typeof player.scoutingProfile === 'object'
      ? player.scoutingProfile
      : (player.scoutingProfile = {});

    const observed = Math.max(0, Number(profile.gamesObserved) || 0);
    const rank = Math.max(0, Number(profile.publicRank) || 0);
    const interest = String(profile.interestLevel || 'None').toLowerCase();
    const pool = getScoutingOrganizationPool(player);

    let count = 0;
    if (observed >= 1 || interest === 'low') count = 1;
    if (observed >= 3 || interest === 'moderate' || (rank > 0 && rank <= 100)) count = 2;
    if (observed >= 6 || interest === 'high' || (rank > 0 && rank <= 35)) count = 3;

    /*
     * Interest should build from actual exposure. A player cannot accumulate a
     * wall of watching organizations before anyone has seen him play.
     */
    if (observed <= 0) count = 0;

    const previous = Array.isArray(profile.organizationsWatching)
      ? profile.organizationsWatching.map(item => typeof item === 'string' ? item : item?.name).filter(Boolean)
      : [];

    const next = pool.slice(0, count);
    profile.organizationsWatching = next.map(name => ({
      name,
      since: previous.includes(name)
        ? (profile.organizationInterestHistory || []).find(item => item?.name === name)?.since || dateString || null
        : dateString || null,
    }));

    if (!Array.isArray(profile.organizationInterestHistory)) {
      profile.organizationInterestHistory = [];
    }

    next.forEach(name => {
      if (!profile.organizationInterestHistory.some(item => item?.name === name)) {
        profile.organizationInterestHistory.push({
          name,
          since: dateString || null,
          firstObservedGames: observed,
          firstPublicRank: rank || null,
        });
      }
    });

    profile.organizationInterestHistory = profile.organizationInterestHistory.slice(-24);

    return {
      success: true,
      updated: true,
      reason: 'scouting-organizations-updated',
      organizationsWatching: profile.organizationsWatching,
    };
  }

'''
if 'function updateScoutingOrganizationsWatching(' not in s:
    s=s.replace(anchor, helpers+anchor, 1)

old='''    const results = players.map(player => updatePersistentScoutingReport(player, dateString));\n'''
new='''    const results = players.map(player => {\n      const organizationResult = updateScoutingOrganizationsWatching(player, dateString);\n      const reportResult = updatePersistentScoutingReport(player, dateString);\n      return {\n        ...reportResult,\n        organizationResult,\n      };\n    });\n'''
if old not in s:
    raise SystemExit('persistent report map anchor missing')
s=s.replace(old,new,1)

p.write_text(s)
print('added persistent scouting organization interest')
