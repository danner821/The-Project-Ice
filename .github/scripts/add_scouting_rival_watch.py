from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

anchor='''  function processPersistentScoutingReports(dateString) {\n'''
if anchor not in s:
    raise SystemExit('persistent scouting reports anchor missing')

helpers=r'''  function buildScoutingRivalSnapshot(player = {}) {
    if (!player || typeof player !== 'object') return null;
    const profile = player.scoutingProfile || {};
    const rank = Math.max(0, Number(profile.publicRank) || 0);
    if (!rank) return null;

    const team = (_state.teams || []).find(candidate =>
      String(candidate?.teamId || candidate?.id || '') === String(player.teamId || '')
    );

    return {
      playerId: player.id || player.playerId || null,
      name: [player.firstName, player.lastName].filter(Boolean).join(' ') || 'Prospect',
      position: player.position || null,
      overall: Number(player.overall) || null,
      rank,
      previousRank: Math.max(0, Number(profile.previousRank) || 0) || null,
      rankChange:
        Number(profile.previousRank) > 0
          ? Number(profile.previousRank) - rank
          : 0,
      potentialRole:
        player.development?.potentialRole ||
        player.potentialRole ||
        null,
      potentialAccuracy:
        player.development?.potentialAccuracy ||
        player.potentialAccuracy ||
        profile.evaluationAccuracy ||
        'Low',
      teamId: player.teamId || null,
      teamName: team
        ? `${team.schoolName || ''} ${team.teamName || ''}`.trim()
        : null,
    };
  }

  function updateCareerScoutingRivalWatch(dateString) {
    const careerPlayer = getCareerPlayerFromWorldState();
    if (!careerPlayer || typeof careerPlayer !== 'object') {
      return { success: false, updated: false, reason: 'career-player-missing' };
    }

    ensureCanonicalPlayerContract(careerPlayer);
    const profile = careerPlayer.scoutingProfile && typeof careerPlayer.scoutingProfile === 'object'
      ? careerPlayer.scoutingProfile
      : (careerPlayer.scoutingProfile = {});

    const careerRank = Math.max(0, Number(profile.publicRank) || 0);
    const weekKey = getLivingWorldWeekKey(dateString);

    if (!careerRank) {
      profile.rivalWatch = {
        weekKey,
        date: normalizeLivingWorldDateKey(dateString) || dateString || null,
        currentRank: null,
        above: null,
        below: null,
        positionRival: null,
      };
      return { success: true, updated: true, reason: 'career-player-not-ranked', rivalWatch: profile.rivalWatch };
    }

    const careerId = String(careerPlayer.id || careerPlayer.playerId || 'career-player');
    const careerPosition = normalizeAttributePosition(careerPlayer.position);

    const candidates = (_state.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .filter(player => {
        const playerId = String(player?.id || player?.playerId || '');
        const rank = Math.max(0, Number(player?.scoutingProfile?.publicRank) || 0);
        return playerId && playerId !== careerId && rank > 0;
      })
      .map(player => ({
        player,
        rank: Math.max(0, Number(player.scoutingProfile.publicRank) || 0),
      }));

    const above = candidates
      .filter(entry => entry.rank < careerRank)
      .sort((a, b) => b.rank - a.rank)[0]?.player || null;

    const below = candidates
      .filter(entry => entry.rank > careerRank)
      .sort((a, b) => a.rank - b.rank)[0]?.player || null;

    const positionRival = candidates
      .filter(entry => normalizeAttributePosition(entry.player.position) === careerPosition)
      .sort((a, b) => {
        const aDistance = Math.abs(a.rank - careerRank);
        const bDistance = Math.abs(b.rank - careerRank);
        return (aDistance - bDistance) || (a.rank - b.rank);
      })[0]?.player || null;

    const nextWatch = {
      weekKey,
      date: normalizeLivingWorldDateKey(dateString) || dateString || null,
      currentRank: careerRank,
      above: buildScoutingRivalSnapshot(above),
      below: buildScoutingRivalSnapshot(below),
      positionRival: buildScoutingRivalSnapshot(positionRival),
    };

    const previousWatch = profile.rivalWatch && typeof profile.rivalWatch === 'object'
      ? profile.rivalWatch
      : null;

    profile.rivalWatch = nextWatch;
    if (!Array.isArray(profile.rivalWatchHistory)) profile.rivalWatchHistory = [];

    const lastHistory = profile.rivalWatchHistory[profile.rivalWatchHistory.length - 1] || null;
    if (lastHistory?.weekKey === weekKey) {
      profile.rivalWatchHistory[profile.rivalWatchHistory.length - 1] = structuredClone(nextWatch);
    } else {
      profile.rivalWatchHistory.push(structuredClone(nextWatch));
      profile.rivalWatchHistory = profile.rivalWatchHistory.slice(-52);
    }

    const changed = Boolean(
      !previousWatch ||
      Number(previousWatch.currentRank) !== careerRank ||
      String(previousWatch.above?.playerId || '') !== String(nextWatch.above?.playerId || '') ||
      String(previousWatch.below?.playerId || '') !== String(nextWatch.below?.playerId || '') ||
      String(previousWatch.positionRival?.playerId || '') !== String(nextWatch.positionRival?.playerId || '')
    );

    if (changed) {
      const livingWorld = ensureLivingWorldState();
      livingWorld.recentBeats.push({
        type: 'scouting_rival_watch',
        weekKey,
        date: nextWatch.date,
        playerId: careerId,
        currentRank: careerRank,
        previousRank: Math.max(0, Number(profile.previousRank) || 0) || null,
        above: nextWatch.above,
        below: nextWatch.below,
        positionRival: nextWatch.positionRival,
      });
      if (livingWorld.recentBeats.length > 120) {
        livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);
      }
    }

    return {
      success: true,
      updated: true,
      changed,
      reason: changed ? 'scouting-rival-watch-updated' : 'scouting-rival-watch-stable',
      rivalWatch: nextWatch,
    };
  }

'''
if 'function updateCareerScoutingRivalWatch(' not in s:
    s=s.replace(anchor,helpers+anchor,1)

# Update after all individual scouting profiles/reports have refreshed.
old='''    return {\n      success: true,\n      processed: true,\n      updated: results.filter(result => result?.updated).length,\n      results,\n    };\n  }\n'''
new='''    const rivalWatchResult =\n      updateCareerScoutingRivalWatch(\n        dateString\n      );\n\n    return {\n      success: true,\n      processed: true,\n      updated: results.filter(result => result?.updated).length,\n      results,\n      rivalWatchResult,\n    };\n  }\n'''
# replace only first occurrence after processPersistentScoutingReports anchor
start=s.index(anchor)
idx=s.find(old,start)
if idx == -1:
    raise SystemExit('persistent report return block missing')
s=s[:idx]+new+s[idx+len(old):]

p.write_text(s)
print('added persistent scouting rival watch')
