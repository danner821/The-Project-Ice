from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

helpers=r'''
  function getPotentialAccuracyFromConfidence(confidence) {
    const safeConfidence = Math.max(0, Math.min(100, Number(confidence) || 0));
    if (safeConfidence >= 75) return 'High';
    if (safeConfidence >= 45) return 'Medium';
    return 'Low';
  }

  function getPotentialWeekEvidence(player = {}) {
    ensureCanonicalPlayerContract(player);

    const development = player.development || {};
    const stats = player.seasonStats || {};
    const age = Number(player.age ?? development.currentAge) || 14;
    const overall = Number(player.overall) || 50;
    const gamesPlayed = Number(stats.gamesPlayed ?? player.gamesPlayed) || 0;
    const recentForm = Math.max(0, Math.min(100, Number(player.recentForm) || 50));
    const coachTrust = Math.max(0, Math.min(100, Number(player.coachTrust) || 50));
    const injuryGamesMissed = Math.max(0, Number(player.health?.gamesMissed) || 0);
    const growthLedger = development.seasonAttributeGrowth || {};
    const attributeGrowth = Object.values(growthLedger).reduce(
      (sum, value) => sum + Math.max(0, Number(value) || 0),
      0
    );

    let performanceSignal = 0;
    const position = normalizeAttributePosition(player.position);

    if (gamesPlayed >= 3) {
      if (position === 'G') {
        const savePercentage = Number(stats.savePercentage ?? player.savePercentage) || 0;
        if (savePercentage > 0) {
          performanceSignal = Math.max(-1, Math.min(1, (savePercentage - 0.900) / 0.055));
        }
      } else {
        const goals = Number(stats.goals ?? player.goals) || 0;
        const assists = Number(stats.assists ?? player.assists) || 0;
        const points = Number(stats.points ?? player.points) || (goals + assists);
        const pointsPerGame = points / Math.max(1, gamesPlayed);
        const expectedPpg = Math.max(0.18, Math.min(1.35, 0.30 + ((overall - 55) * 0.025)));
        performanceSignal = Math.max(-1, Math.min(1, (pointsPerGame - expectedPpg) / 0.65));
      }
    }

    const formSignal = (recentForm - 50) / 50;
    const trustSignal = (coachTrust - 50) / 50;
    const growthSignal = Math.max(-1, Math.min(1, attributeGrowth / 12));
    const injurySignal = Math.max(-1, -injuryGamesMissed / 8);

    /*
     * Dynamic potential should react to sustained evidence, not one hot week.
     * Performance is the largest input, while development, form, trust and
     * health provide supporting context. Younger players remain more fluid.
     */
    const ageFlexibility = age <= 18 ? 1 : age <= 23 ? 0.72 : age <= 27 ? 0.42 : 0.20;
    const evidence = (
      performanceSignal * 0.48 +
      growthSignal * 0.22 +
      formSignal * 0.14 +
      trustSignal * 0.10 +
      injurySignal * 0.06
    ) * ageFlexibility;

    return {
      evidence: Number(Math.max(-1, Math.min(1, evidence)).toFixed(4)),
      performanceSignal: Number(performanceSignal.toFixed(4)),
      growthSignal: Number(growthSignal.toFixed(4)),
      formSignal: Number(formSignal.toFixed(4)),
      trustSignal: Number(trustSignal.toFixed(4)),
      injurySignal: Number(injurySignal.toFixed(4)),
      gamesPlayed,
      age,
      overall,
    };
  }

  function evaluatePlayerPotentialWeek(player = {}, dateString) {
    ensureCanonicalPlayerContract(player);

    const normalizedDate = normalizeLivingWorldDateKey(dateString);
    const weekKey = getLivingWorldWeekKey(normalizedDate);
    const development = player.development;

    if (!normalizedDate || !weekKey || !development) {
      return { success: false, changed: false, reason: 'invalid-potential-evaluation' };
    }

    if (development.lastPotentialEvaluationWeek === weekKey) {
      return { success: true, changed: false, reason: 'potential-week-already-evaluated', weekKey };
    }

    const evidence = getPotentialWeekEvidence(player);
    const priorSignal = Number(development.potentialSignal) || 0;
    const signal = Math.max(-4, Math.min(4, priorSignal * 0.76 + evidence.evidence));
    const oldPotential = Math.max(25, Math.min(99, Number(development.potential ?? player.potential) || evidence.overall));
    const oldRole = development.potentialRole || getPotentialRole(player.position, oldPotential);
    const oldConfidence = Math.max(25, Math.min(100, Number(development.potentialConfidence) || 50));

    /* Confidence rises with accumulated evaluation evidence. */
    const observedGames = Math.max(0, Number(player.scoutingProfile?.gamesObserved) || 0);
    const confidenceGain = 0.35 + Math.min(0.65, observedGames * 0.035);
    const newConfidence = Math.max(25, Math.min(100, oldConfidence + confidenceGain));
    const threshold = 2.15 + ((newConfidence - 25) / 75) * 0.95;

    const currentWeek = Math.max(1, Number(_state.season?.currentWeek) || 1);
    const lastChangedWeek = Number(development.lastPotentialChangeWeek) || -999;
    const weeksSinceChange = currentWeek - lastChangedWeek;
    const cooldownMet = weeksSinceChange >= 4;

    let delta = 0;
    if (cooldownMet && signal >= threshold) delta = 1;
    if (cooldownMet && signal <= -threshold) delta = -1;

    /* Never let a projected ceiling fall below demonstrated current ability. */
    const minimumPotential = Math.min(99, Math.max(25, evidence.overall + (evidence.age <= 23 ? 2 : 0)));
    const newPotential = Math.max(minimumPotential, Math.min(99, oldPotential + delta));
    const changed = newPotential !== oldPotential;
    const appliedDelta = newPotential - oldPotential;

    development.potential = newPotential;
    development.potentialRole = getPotentialRole(player.position, newPotential);
    development.potentialConfidence = Number(newConfidence.toFixed(2));
    development.potentialAccuracy = getPotentialAccuracyFromConfidence(newConfidence);
    development.potentialSignal = changed ? Number((signal * 0.35).toFixed(4)) : Number(signal.toFixed(4));
    development.potentialTrend = changed
      ? (appliedDelta > 0 ? 'rising' : 'falling')
      : signal >= 1.15
        ? 'rising'
        : signal <= -1.15
          ? 'falling'
          : 'stable';
    development.lastPotentialEvaluationWeek = weekKey;

    if (!Array.isArray(development.potentialHistory)) {
      development.potentialHistory = [];
    }

    if (changed) {
      development.lastPotentialChangeWeek = currentWeek;
      development.lastPotentialChangeSeason = _state.season?.label || _state.currentSeason || null;
      development.potentialHistory.push({
        weekKey,
        date: normalizedDate,
        from: oldPotential,
        to: newPotential,
        fromRole: oldRole,
        toRole: development.potentialRole,
        trend: development.potentialTrend,
        confidence: development.potentialConfidence,
        evidence,
      });
      development.potentialHistory = development.potentialHistory.slice(-40);
    }

    /* Keep legacy/player-facing fields synchronized with canonical development. */
    player.potential = newPotential;
    player.potentialRole = development.potentialRole;
    player.potentialAccuracy = development.potentialAccuracy;
    player.potentialTrend = development.potentialTrend;
    player.potentialConfidence = development.potentialConfidence;

    return {
      success: true,
      changed,
      weekKey,
      oldPotential,
      newPotential,
      oldRole,
      newRole: development.potentialRole,
      trend: development.potentialTrend,
      confidence: development.potentialConfidence,
      accuracy: development.potentialAccuracy,
      signal: development.potentialSignal,
      threshold: Number(threshold.toFixed(4)),
      evidence,
    };
  }

  function processPotentialWeek(dateString) {
    const normalizedDate = normalizeLivingWorldDateKey(dateString);
    const weekKey = getLivingWorldWeekKey(normalizedDate);
    if (!normalizedDate || !weekKey) {
      return { success: false, processed: false, reason: 'invalid-potential-week' };
    }

    const players = (_state?.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : [])
    );

    const results = players.map(player => evaluatePlayerPotentialWeek(player, normalizedDate));
    const changes = results.filter(result => result?.changed === true);
    const careerPlayer = getCareerPlayerFromWorldState();
    const careerId = String(careerPlayer?.id || careerPlayer?.playerId || 'career-player');
    const careerIndex = players.findIndex(player =>
      String(player?.id || player?.playerId || '') === careerId
    );
    const careerResult = careerIndex >= 0 ? results[careerIndex] : null;

    if (careerResult?.changed) {
      const livingWorld = ensureLivingWorldState();
      livingWorld.recentBeats.push({
        type: 'potential_update',
        weekKey,
        date: normalizedDate,
        playerId: careerId,
        from: careerResult.oldPotential,
        to: careerResult.newPotential,
        fromRole: careerResult.oldRole,
        toRole: careerResult.newRole,
        trend: careerResult.trend,
        accuracy: careerResult.accuracy,
      });
      if (livingWorld.recentBeats.length > 120) {
        livingWorld.recentBeats = livingWorld.recentBeats.slice(-120);
      }
    }

    return {
      success: true,
      processed: true,
      reason: 'weekly-potential-processed',
      weekKey,
      evaluated: results.length,
      changes,
      careerResult,
    };
  }

'''

if 'function processPotentialWeek(' not in s:
    anchor='  function processScoutingWeek(dateString) {'
    idx=s.find(anchor)
    if idx<0: raise SystemExit('processScoutingWeek anchor missing')
    s=s[:idx]+helpers+s[idx:]

# Extend canonical development state with stable dynamic-potential fields.
needle="""      lastPotentialChangeSeason:\n        player.development\n          ?.lastPotentialChangeSeason ??\n        player.lastPotentialChangeSeason ??\n        null,\n\n      currentAge: age,"""
if 'potentialSignal:' not in s[s.find('function createDefaultDevelopmentState'):s.find('function createDefaultHealthState')]:
    repl="""      lastPotentialChangeSeason:\n        player.development\n          ?.lastPotentialChangeSeason ??\n        player.lastPotentialChangeSeason ??\n        null,\n\n      lastPotentialChangeWeek:\n        Number(player.development?.lastPotentialChangeWeek) || null,\n\n      lastPotentialEvaluationWeek:\n        player.development?.lastPotentialEvaluationWeek || null,\n\n      potentialSignal:\n        Number(player.development?.potentialSignal) || 0,\n\n      potentialHistory:\n        Array.isArray(player.development?.potentialHistory)\n          ? [...player.development.potentialHistory]\n          : [],\n\n      currentAge: age,"""
    if needle not in s: raise SystemExit('development state anchor missing')
    s=s.replace(needle,repl,1)

# Preserve nested potential history during canonical migration.
needle2="""      developmentHistory:\n        Array.isArray(\n          player.development\n            ?.developmentHistory\n        )\n          ? [\n              ...player.development\n                .developmentHistory,\n            ]\n          : [],\n    };"""
if needle2 in s and 'potentialHistory:' not in s[s.find('player.development = {'):s.find('/*\n     * Every player owns one permanent hidden Development DNA')]:
    repl2="""      developmentHistory:\n        Array.isArray(\n          player.development\n            ?.developmentHistory\n        )\n          ? [\n              ...player.development\n                .developmentHistory,\n            ]\n          : [],\n\n      potentialHistory:\n        Array.isArray(player.development?.potentialHistory)\n          ? [...player.development.potentialHistory]\n          : [],\n    };"""
    s=s.replace(needle2,repl2,1)

# Run potential evaluation before canonical scouting rankings for each living-world week.
if 'processPotentialWeek(normalizedDate);\n\n    processScoutingWeek(normalizedDate);' not in s:
    needle3='    processScoutingWeek(normalizedDate);'
    if needle3 not in s: raise SystemExit('scouting integration call missing')
    s=s.replace(needle3,'    processPotentialWeek(normalizedDate);\n\n    processScoutingWeek(normalizedDate);',1)

# Export for diagnostics/future UI if scouting is already exported.
if 'processPotentialWeek,' not in s:
    matches=list(__import__('re').finditer(r'(^[ \t]*processScoutingWeek\s*,\s*$)',s,__import__('re').M))
    if matches:
        m=matches[-1]
        s=s[:m.start()]+'    processPotentialWeek,\n'+s[m.start():]

p.write_text(s)
print('implemented stable NHL-style dynamic potential engine')
