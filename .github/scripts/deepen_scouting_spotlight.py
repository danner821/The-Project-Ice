from pathlib import Path
wp=Path('artifacts/project-ice/public/world.js')
gp=Path('artifacts/project-ice/public/game.js')
w=wp.read_text(); g=gp.read_text()

# 1) Add event spotlight helpers before weekly scouting score.
anchor='''  function calculateWeeklyScoutingScore(player = {}) {\n'''
helpers=r'''  function getScoutingGameSpotlightWeight(game = {}) {
    const scouts = Math.max(0, Number(game?.scoutsAttending) || 0);
    if (scouts <= 0) return 0;

    const contextText = [
      game.specialGameType,
      game.specialType,
      game.eventType,
      game.milestoneType,
      game.label,
      game.title,
      game.banner,
      game.context?.specialGameType,
      game.context?.milestoneType,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const isProspectClash = Boolean(
      game.isTopProspectClash ||
      game.topProspectClash ||
      /top\s*prospect|prospect\s*clash/.test(contextText)
    );

    const isGameOfWeek = Boolean(
      game.isGameOfWeek ||
      /game\s*of\s*the\s*week/.test(contextText)
    );

    /*
     * gamesObserved remains a literal count of games. This separate exposure
     * score represents how intense the evaluation environment was.
     */
    let weight = 1 + Math.min(2.5, Math.max(0, scouts - 1) * 0.35);
    if (isGameOfWeek) weight += 0.35;
    if (isProspectClash) weight += 1.5;

    return Number(weight.toFixed(2));
  }

  function getScoutingSpotlightPerformanceMomentum(player = {}) {
    const profile = player.scoutingProfile || {};
    const exposure = Math.max(0, Number(profile.scoutingExposureScore) || 0);
    if (exposure <= 0) return 0;

    const stats = getScoutingPlayerStats(player);
    const overall = Number(player.overall) || 50;
    const position = normalizeAttributePosition(player.position);
    let performanceSignal = 0;

    if (position === 'G') {
      const seasonStats = player.stats || player.seasonStats || {};
      const savePercentage = Number(
        seasonStats.savePercentage ?? seasonStats.svPct ?? player.savePercentage
      ) || 0;
      if (savePercentage > 0) {
        performanceSignal = Math.max(-1, Math.min(1, (savePercentage - 0.900) / 0.055));
      }
    } else if (stats.gp > 0) {
      const pointsPerGame = stats.points / Math.max(1, stats.gp);
      const expectedPpg = Math.max(
        0.18,
        Math.min(1.35, 0.30 + ((overall - 55) * 0.025))
      );
      performanceSignal = Math.max(
        -1,
        Math.min(1, (pointsPerGame - expectedPpg) / 0.65)
      );
    }

    /*
     * Exposure amplifies what scouts are seeing; it never rewards attendance
     * by itself. Strong play under a brighter spotlight can move a ranking
     * faster, while poor play can do the opposite.
     */
    const exposureFactor = Math.min(1, exposure / 12);
    return Number((performanceSignal * exposureFactor * 4).toFixed(3));
  }

'''
if 'function getScoutingGameSpotlightWeight(' not in w:
    if anchor not in w: raise SystemExit('weekly scouting score anchor missing')
    w=w.replace(anchor,helpers+anchor,1)

# 2) Add spotlight performance to canonical score.
old='''    const reputation = Number(player.reputationPoints) ||\n      ((Number(player.reputationStars) || 1) * 20);\n\n    return Number((\n      overall * 0.48 +\n      potential * 0.28 +\n      Math.min(20, pointsPerGame * 10) * 0.10 +\n      Math.min(100, reputation) * 0.09 +\n      Math.min(100, coachTrust) * 0.05\n    ).toFixed(3));\n'''
new='''    const reputation = Number(player.reputationPoints) ||\n      ((Number(player.reputationStars) || 1) * 20);\n    const spotlightMomentum =\n      getScoutingSpotlightPerformanceMomentum(player);\n\n    return Number((\n      overall * 0.48 +\n      potential * 0.28 +\n      Math.min(20, pointsPerGame * 10) * 0.10 +\n      Math.min(100, reputation) * 0.09 +\n      Math.min(100, coachTrust) * 0.05 +\n      spotlightMomentum\n    ).toFixed(3));\n'''
if old not in w: raise SystemExit('scouting score body missing')
w=w.replace(old,new,1)

# 3) Make weekly scouting explicitly idempotent and record weighted exposure.
old='''  function processScoutingWeek(dateString) {\n    const normalizedDate = normalizeLivingWorldDateKey(dateString);\n    const weekStart = getWeekStartDate(normalizedDate);\n    const weekEnd = getWeekEndDate(normalizedDate);\n    const weekKey = getLivingWorldWeekKey(normalizedDate);\n\n    if (!normalizedDate || !weekStart || !weekEnd || !weekKey) {\n      return { success: false, processed: false, reason: 'invalid-scouting-week' };\n    }\n'''
new='''  function processScoutingWeek(dateString) {\n    const normalizedDate = normalizeLivingWorldDateKey(dateString);\n    const weekStart = getWeekStartDate(normalizedDate);\n    const weekEnd = getWeekEndDate(normalizedDate);\n    const weekKey = getLivingWorldWeekKey(normalizedDate);\n\n    if (!normalizedDate || !weekStart || !weekEnd || !weekKey) {\n      return { success: false, processed: false, reason: 'invalid-scouting-week' };\n    }\n\n    const livingWorldState = ensureLivingWorldState();\n    if (!Array.isArray(livingWorldState.scoutingProcessedWeeks)) {\n      livingWorldState.scoutingProcessedWeeks = [];\n    }\n\n    if (livingWorldState.scoutingProcessedWeeks.includes(weekKey)) {\n      return {\n        success: true,\n        processed: false,\n        reason: 'scouting-week-already-processed',\n        weekKey,\n        rankings: Array.isArray(_state.prospectRankings) ? _state.prospectRankings : [],\n        changes: [],\n        careerChange: null,\n      };\n    }\n'''
if old not in w: raise SystemExit('processScoutingWeek opening missing')
w=w.replace(old,new,1)

old='''      const scoutedGames = getScoutedGamesForPlayer(player, weekStart, weekEnd);\n      const additionalObserved = scoutedGames.length;\n      const priorInterest = profile.interestLevel || 'None';\n\n      profile.previousRank = previousRank;\n'''
new='''      const scoutedGames = getScoutedGamesForPlayer(player, weekStart, weekEnd);\n      const additionalObserved = scoutedGames.length;\n      const weeklyExposure = scoutedGames.reduce(\n        (sum, game) => sum + getScoutingGameSpotlightWeight(game),\n        0\n      );\n      const spotlightGames = scoutedGames.filter(game =>\n        getScoutingGameSpotlightWeight(game) >= 2.5\n      ).length;\n      const priorInterest = profile.interestLevel || 'None';\n\n      profile.previousRank = previousRank;\n'''
if old not in w: raise SystemExit('scouted games block missing')
w=w.replace(old,new,1)

old='''      profile.gamesObserved = (Number(profile.gamesObserved) || 0) + additionalObserved;\n      profile.evaluationAccuracy = getScoutingEvaluationAccuracy(profile.gamesObserved);\n      profile.interestLevel = getScoutingInterestLevel(newRank, profile.gamesObserved);\n\n      if (additionalObserved > 0) {\n        profile.scoutingHistory.push({\n          type: 'games-observed',\n          weekKey,\n          startDate: weekStart,\n          endDate: weekEnd,\n          gamesObserved: additionalObserved,\n          totalGamesObserved: profile.gamesObserved,\n          rank: newRank,\n        });\n      }\n'''
new='''      profile.gamesObserved = (Number(profile.gamesObserved) || 0) + additionalObserved;\n      profile.scoutingExposureScore = Number((\n        (Number(profile.scoutingExposureScore) || 0) + weeklyExposure\n      ).toFixed(2));\n      profile.spotlightGamesObserved =\n        (Number(profile.spotlightGamesObserved) || 0) + spotlightGames;\n      profile.lastScoutedWeek = additionalObserved > 0\n        ? weekKey\n        : (profile.lastScoutedWeek || null);\n      profile.evaluationAccuracy = getScoutingEvaluationAccuracy(profile.gamesObserved);\n      profile.interestLevel = getScoutingInterestLevel(newRank, profile.gamesObserved);\n\n      if (additionalObserved > 0) {\n        profile.scoutingHistory.push({\n          type: spotlightGames > 0 ? 'spotlight-games-observed' : 'games-observed',\n          weekKey,\n          startDate: weekStart,\n          endDate: weekEnd,\n          gamesObserved: additionalObserved,\n          totalGamesObserved: profile.gamesObserved,\n          exposureAdded: Number(weeklyExposure.toFixed(2)),\n          totalExposure: profile.scoutingExposureScore,\n          spotlightGames,\n          rank: newRank,\n        });\n      }\n'''
if old not in w: raise SystemExit('profile exposure update block missing')
w=w.replace(old,new,1)

# Include exposure in change/beat and rankings records.
old='''          gamesObserved: additionalObserved,\n        });\n'''
new='''          gamesObserved: additionalObserved,\n          exposureAdded: Number(weeklyExposure.toFixed(2)),\n          spotlightGames,\n        });\n'''
# Replace only first occurrence after processScoutingWeek start.
start=w.index('  function processScoutingWeek(dateString) {')
idx=w.find(old,start)
if idx==-1: raise SystemExit('changes payload anchor missing')
w=w[:idx]+new+w[idx+len(old):]

old='''      interestLevel: entry.player?.scoutingProfile?.interestLevel || 'None',\n      rankChange: Number(entry.player?.scoutingProfile?.rankChange) || 0,\n      weekKey,\n    }));\n'''
new='''      interestLevel: entry.player?.scoutingProfile?.interestLevel || 'None',\n      rankChange: Number(entry.player?.scoutingProfile?.rankChange) || 0,\n      previousRank: Number(entry.player?.scoutingProfile?.previousRank) || null,\n      scoutingExposureScore: Number(entry.player?.scoutingProfile?.scoutingExposureScore) || 0,\n      spotlightGamesObserved: Number(entry.player?.scoutingProfile?.spotlightGamesObserved) || 0,\n      weekKey,\n    }));\n'''
if old not in w: raise SystemExit('prospect rankings record anchor missing')
w=w.replace(old,new,1)

# Mark processed only after successful update.
old='''    const scoutingReportResult =\n      processPersistentScoutingReports(\n        normalizedDate\n      );\n\n    return {\n'''
new='''    const scoutingReportResult =\n      processPersistentScoutingReports(\n        normalizedDate\n      );\n\n    livingWorldState.scoutingProcessedWeeks.push(weekKey);\n    if (livingWorldState.scoutingProcessedWeeks.length > 120) {\n      livingWorldState.scoutingProcessedWeeks =\n        livingWorldState.scoutingProcessedWeeks.slice(-120);\n    }\n\n    return {\n'''
if old not in w: raise SystemExit('scouting return anchor missing')
w=w.replace(old,new,1)

# 4) Canonical Prospects rows need previousRank so League preview shows real movement.
old='''        ...player,\n        currentRank: rank,\n        rankChange,\n        sourceType: 'world',\n'''
new='''        ...player,\n        currentRank: rank,\n        previousRank: previousRank || null,\n        rankChange,\n        sourceType: 'world',\n'''
if old not in g: raise SystemExit('canonical prospect row anchor missing')
g=g.replace(old,new,1)

wp.write_text(w); gp.write_text(g)
print('deepened scouting spotlight impact and fixed canonical prospect movement')
