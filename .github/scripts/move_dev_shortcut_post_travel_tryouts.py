from pathlib import Path
import re

path = Path('artifacts/project-ice/public/dev-postseason-shortcut.js')
text = path.read_text()

text = text.replace("const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-travel-tryouts-eve-v1';", "const DEV_BASELINE_RECORD_ID = 'dev-baseline:danner-post-travel-tryouts-v2';")

start = text.index('  function prepareTravelTryoutsEve(sourceWorld) {')
end = text.index('\n  async function findRealDannerSave()', start)

replacement = r'''  function preparePostTravelTryouts(sourceWorld) {
    const world = structuredClone(sourceWorld);
    if (!world.postseason || typeof world.postseason !== 'object') world.postseason = {};

    const existing = world.postseason.highSchool || {};
    const regularEnd = dateKey(existing.regularSeasonEndDate) || regularSeasonEndDate(world);
    const completedDate = dateKey(existing.completedDate) || addDays(regularEnd, 28) || '2027-05-20';
    const championDate = dateKey(existing.championCheckpointAcknowledgedAt) || addDays(completedDate, 1);
    const ceremonyDate = dateKey(existing.awardsCeremonyDate) || addDays(championDate, 7);
    const tryoutDate = addDays(ceremonyDate, 7);
    const targetDate = addDays(tryoutDate, 1);

    if (!championDate || !ceremonyDate || !tryoutDate || !targetDate) {
      throw new Error('Could not determine post-Travel Tryouts checkpoint date.');
    }

    const rounds = existing?.bracket?.rounds || {};
    world.postseason.highSchool = {
      ...existing,
      initialized: true,
      checkpointAcknowledged: true,
      status: 'complete',
      phase: 'postseason-complete',
      regularSeasonEndDate: regularEnd,
      completedDate,
      championCheckpointAcknowledged: true,
      championCheckpointAcknowledgedAt: championDate,
      offseasonStartedDate: championDate,
      awardsCeremonyDate: ceremonyDate,
      awardsCeremonyAcknowledged: true,
      awardsCeremonyAcknowledgedAt: ceremonyDate,
      bracket: {
        ...(existing.bracket || {}),
        format: existing?.bracket?.format || 'six-team-bye-best-of-three',
        qualifierCount: Number(existing?.bracket?.qualifierCount) || 6,
        rounds: {
          roundOne: Array.isArray(rounds.roundOne) ? rounds.roundOne : [],
          semifinals: Array.isArray(rounds.semifinals) ? rounds.semifinals : [],
          championship: Array.isArray(rounds.championship) ? rounds.championship : [],
        },
      },
      syntheticDevCheckpoint: true,
    };

    if (!world.player || typeof world.player !== 'object') world.player = {};
    const overall = Math.max(40, Math.min(99, Math.round(Number(world.player.overall ?? world.player.ovr ?? 60))));
    const neutralForm = Math.max(50, Math.min(85, Math.round(Number(world.player.currentForm ?? world.player.form ?? 65))));
    const drillAverage = Math.max(68, Math.min(82, Math.round(overall + 7)));
    const evaluation = Math.round(overall * 0.55 + neutralForm * 0.15 + drillAverage * 0.30);
    const level = evaluation >= 84 ? 'AAA' : evaluation >= 76 ? 'AA' : evaluation >= 68 ? 'A' : 'B';

    const clubs = [
      { id: 'arizona-jr-coyotes', name: 'Arizona Jr. Coyotes', city: 'Phoenix, AZ' },
      { id: 'colorado-thunderbirds', name: 'Colorado Thunderbirds', city: 'Denver, CO' },
      { id: 'dallas-stars-elite', name: 'Dallas Stars Elite', city: 'Dallas, TX' },
      { id: 'chicago-mission', name: 'Chicago Mission', city: 'Chicago, IL' },
      { id: 'little-caesars', name: 'Little Caesars', city: 'Detroit, MI' },
      { id: 'pittsburgh-penguins-elite', name: 'Pittsburgh Penguins Elite', city: 'Pittsburgh, PA' },
      { id: 'boston-jr-eagles', name: 'Boston Jr. Eagles', city: 'Boston, MA' },
      { id: 'la-jr-kings', name: 'LA Jr. Kings', city: 'Los Angeles, CA' },
    ];

    const careerPlayerId = String(world.player.playerId || world.player.id || 'career-player');
    const placementSeed = `${careerPlayerId}|${tryoutDate}|${evaluation}|${level}`;
    let hash = 2166136261;
    for (const ch of placementSeed) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const club = clubs[(hash >>> 0) % clubs.length];
    const playerName = String(
      world.player.name ||
      world.player.playerName ||
      [world.player.firstName, world.player.lastName].filter(Boolean).join(' ') ||
      TARGET_PLAYER_NAME
    );

    const drillScores = {
      skating: drillAverage,
      skill: drillAverage,
      scrimmage: drillAverage,
    };

    world.travelHockey = {
      version: 1,
      status: 'placement-complete',
      awardsCeremonyDate: ceremonyDate,
      tryoutDate,
      levels: ['B', 'A', 'AA', 'AAA'],
      guaranteedMinimumLevel: 'B',
      placementLevel: level,
      placementTeamId: club.id,
      placementTeamName: club.name,
      playerTeamId: null,
      playerTeamName: club.name,
      placementTeam: {
        teamId: club.id,
        clubId: club.id,
        name: club.name,
        city: club.city,
        level,
      },
      tryoutResult: {
        completedAt: tryoutDate,
        playerName,
        overallAtTryouts: overall,
        formScore: neutralForm,
        drillAverage,
        drillScores,
        evaluationScore: evaluation,
        placementLevel: level,
        placementTeamId: club.id,
        placementTeamName: club.name,
        placementTeamCity: club.city,
        scoutingSummary: `Dev checkpoint: completed Travel tryouts at ${level} level.`,
        reps: [],
        randomClubApplied: true,
        syntheticDevCheckpoint: true,
      },
      tournament: null,
      completed: false,
      syntheticDevCheckpoint: true,
    };

    if (!Array.isArray(world.schedule)) world.schedule = [];
    let tryoutEvent = world.schedule.find(event =>
      String(event?.eventId || event?.id || '') === 'travel-hockey-tryouts'
    );
    if (!tryoutEvent) {
      tryoutEvent = {
        id: 'travel-hockey-tryouts',
        eventId: 'travel-hockey-tryouts',
        eventKey: 'travel-hockey-tryouts',
        type: 'meeting',
        eventType: 'tryout',
        label: 'Travel Hockey Tryouts',
        shortLabel: 'Travel Tryouts',
        icon: '🏒',
        location: 'Regional Ice Center',
        objective: 'Compete for your summer travel hockey placement.',
        offseasonEvent: true,
        travelHockeyEvent: true,
        travelTryoutEvent: true,
        requiresPlayerInteraction: true,
      };
      world.schedule.push(tryoutEvent);
    }
    Object.assign(tryoutEvent, {
      date: tryoutDate,
      completed: true,
      played: true,
      status: 'completed',
      completedAt: tryoutDate,
    });
    world.schedule.sort((a, b) => dateKey(a?.date).localeCompare(dateKey(b?.date)));

    if (!world.season || typeof world.season !== 'object') world.season = {};
    world.season.currentDate = targetDate;
    world.season.phase = 'offseason-travel-hockey';
    world.player.currentDate = targetDate;
    world.currentDate = targetDate;

    for (const team of world.teams || []) {
      for (const player of team?.roster || []) {
        const id = player?.playerId || player?.id || null;
        if (
          player?.isCareerPlayer === true ||
          String(id || '') === careerPlayerId ||
          String(id || '') === 'career-player'
        ) {
          player.currentDate = targetDate;
        }
      }
    }

    return { world, targetDate, tryoutDate, ceremonyDate, placementLevel: level, placementTeamName: club.name };
  }
'''

text = text[:start] + replacement + text[end:]
text = text.replace('prepareTravelTryoutsEve(source.world)', 'preparePostTravelTryouts(source.world)')
text = text.replace('prepareTravelTryoutsEve(baseline.world)', 'preparePostTravelTryouts(baseline.world)')
text = text.replace("throw new Error('Could not load isolated Travel Tryouts Eve dev career.');", "throw new Error('Could not load isolated post-Travel Tryouts dev career.');")

old = """    WorldEngine.ensureTravelHockeyFoundation?.({ save: false });\n    removeDevMetadataFromVisibleIndex();\n    return prepared;"""
new = """    WorldEngine.ensureTravelHockeyFoundation?.({ save: false });\n    WorldEngine.ensureTravelHockeyWorld?.({ save: false });\n    WorldEngine.rebuildTravelHockeyRosters?.();\n    WorldEngine.save?.();\n    removeDevMetadataFromVisibleIndex();\n    return prepared;"""
if old not in text:
    raise SystemExit('Expected sandbox load block not found')
text = text.replace(old, new, 1)

text = text.replace("console.info('[Project Ice] Travel Tryouts Eve dev checkpoint loaded.'", "console.info('[Project Ice] Post-Travel Tryouts dev checkpoint loaded.'")
text = text.replace("      tryoutDate: result.tryoutDate,\n", "      tryoutDate: result.tryoutDate,\n      placementLevel: result.placementLevel,\n      placementTeamName: result.placementTeamName,\n", 1)
text = text.replace("if (label) label.textContent = 'Skip to Travel Tryouts Eve';", "if (label) label.textContent = 'Skip to Post-Travel Tryouts';")
text = text.replace("console.error('[Project Ice] Dev Travel Tryouts Eve shortcut failed:'", "console.error('[Project Ice] Dev post-Travel Tryouts shortcut failed:'")
text = text.replace("alert(`Dev Travel Tryouts Eve shortcut failed: ${error?.message || 'unknown error'}`);", "alert(`Dev post-Travel Tryouts shortcut failed: ${error?.message || 'unknown error'}`);")

path.write_text(text)
print('Updated dev shortcut to isolated post-Travel Tryouts checkpoint.')
