from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text()

anchor='''  function processScoutingWeek(dateString) {\n'''
if anchor not in s:
    raise SystemExit('processScoutingWeek anchor missing')

helpers=r'''  function getScoutingAttributeGroups(player = {}) {
    const isGoalie = normalizeAttributePosition(player.position) === 'G';
    if (isGoalie) {
      return [
        { label: 'Athleticism', keys: ['reflexes', 'agility', 'lateralMovement', 'recoverySpeed'] },
        { label: 'Positioning', keys: ['positioning', 'angles', 'puckTracking'] },
        { label: 'Rebound Control', keys: ['reboundControl', 'stickControl'] },
        { label: 'Glove', keys: ['gloveHigh', 'gloveLow'] },
        { label: 'Blocker', keys: ['blockerHigh', 'blockerLow'] },
        { label: 'Composure', keys: ['anticipation', 'composure', 'consistency'] },
      ];
    }

    return [
      { label: 'Skating', keys: ['speed', 'acceleration', 'agility', 'balance'] },
      { label: 'Shot', keys: ['wristShotPower', 'wristShotAccuracy', 'slapShotPower', 'slapShotAccuracy'] },
      { label: 'Puck Skills', keys: ['passing', 'puckControl', 'deking', 'handEye'] },
      { label: 'Offensive IQ', keys: ['offensiveAwareness', 'poise'] },
      { label: 'Defensive Game', keys: ['defensiveAwareness', 'stickChecking', 'shotBlocking'] },
      { label: 'Physical Game', keys: ['bodyChecking', 'strength', 'durability'] },
    ];
  }

  function getScoutingTraitEvaluations(player = {}) {
    const attributes = player.attributes || {};
    const overall = Math.max(25, Math.min(99, Number(player.overall) || 50));
    const groups = getScoutingAttributeGroups(player)
      .map(group => {
        const values = group.keys
          .map(key => Number(attributes[key]))
          .filter(Number.isFinite);
        if (!values.length) return null;
        const rating = values.reduce((sum, value) => sum + value, 0) / values.length;
        return {
          label: group.label,
          rating: Number(rating.toFixed(2)),
          relative: Number((rating - overall).toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.rating - a.rating);

    return {
      strengths: groups
        .filter(item => item.relative >= 2 || item.rating >= overall + 1)
        .slice(0, 3),
      weaknesses: [...groups]
        .sort((a, b) => a.rating - b.rating)
        .filter(item => item.relative <= -2 || item.rating <= overall - 1)
        .slice(0, 3),
      groups,
    };
  }

  function buildScoutingReportSummary(player = {}, profile = {}) {
    const name = [player.firstName, player.lastName].filter(Boolean).join(' ') || 'Prospect';
    const interest = profile.interestLevel || 'None';
    const accuracy =
      player.development?.potentialAccuracy ||
      player.potentialAccuracy ||
      profile.evaluationAccuracy ||
      'Low';
    const trend = String(player.development?.potentialTrend || player.potentialTrend || 'stable').toLowerCase();
    const observed = Math.max(0, Number(profile.gamesObserved) || 0);

    if (observed <= 0) {
      return 'Play in scout-attended games to begin building an external evaluation.';
    }

    const trendText =
      trend === 'rising'
        ? 'The projection is trending upward as evaluators continue to gather evidence.'
        : trend === 'falling'
          ? 'Evaluators are becoming less bullish on the current projection.'
          : 'The current projection remains steady.';

    if (observed < 3) {
      return `${name} has only been seen in a small sample. Early notes are forming, but scouts are not ready to make strong conclusions yet. ${trendText}`;
    }

    if (observed < 8) {
      return `${name} is becoming a more established scouting target. ${interest} interest is developing and the evaluation is currently ${String(accuracy).toLowerCase()} confidence. ${trendText}`;
    }

    return `${name} now has a meaningful body of scouted games. The hockey world has a ${String(accuracy).toLowerCase()}-confidence read on the player, with ${interest.toLowerCase()} external interest. ${trendText}`;
  }

  function updatePersistentScoutingReport(player = {}, dateString) {
    if (!player || typeof player !== 'object') {
      return { success: false, updated: false, reason: 'invalid-player' };
    }

    ensureCanonicalPlayerContract(player);
    const profile = player.scoutingProfile && typeof player.scoutingProfile === 'object'
      ? player.scoutingProfile
      : (player.scoutingProfile = {});

    if (!Array.isArray(profile.scoutingHistory)) profile.scoutingHistory = [];
    if (!Array.isArray(profile.strengthsKnown)) profile.strengthsKnown = [];
    if (!Array.isArray(profile.weaknessesKnown)) profile.weaknessesKnown = [];

    const observed = Math.max(0, Number(profile.gamesObserved) || 0);
    const evaluation = getScoutingTraitEvaluations(player);

    /*
     * Traits reveal slowly. One observed game can expose one obvious trait;
     * a few observations unlock a fuller report. This prevents the scouting
     * page from instantly becoming a perfect attribute readout.
     */
    const revealCount = observed >= 8 ? 3 : observed >= 3 ? 2 : observed >= 1 ? 1 : 0;
    profile.strengthsKnown = evaluation.strengths
      .slice(0, revealCount)
      .map(item => item.label);
    profile.weaknessesKnown = evaluation.weaknesses
      .slice(0, revealCount)
      .map(item => item.label);

    const normalizedDate = normalizeLivingWorldDateKey(dateString) || dateString || null;
    const weekKey = getLivingWorldWeekKey(normalizedDate);
    const lastReport = profile.scoutingHistory[profile.scoutingHistory.length - 1] || null;

    /* One report snapshot per week. */
    if (lastReport?.weekKey === weekKey) {
      lastReport.summary = buildScoutingReportSummary(player, profile);
      lastReport.gamesObserved = observed;
      lastReport.interestLevel = profile.interestLevel || 'None';
      lastReport.evaluationAccuracy =
        player.development?.potentialAccuracy || player.potentialAccuracy || profile.evaluationAccuracy || 'Low';
      lastReport.strengthsKnown = [...profile.strengthsKnown];
      lastReport.weaknessesKnown = [...profile.weaknessesKnown];
      return { success: true, updated: true, reason: 'scouting-report-week-refreshed', report: lastReport };
    }

    const report = {
      weekKey,
      date: normalizedDate,
      gamesObserved: observed,
      publicRank: Number(profile.publicRank) || null,
      previousRank: Number(profile.previousRank) || null,
      interestLevel: profile.interestLevel || 'None',
      evaluationAccuracy:
        player.development?.potentialAccuracy || player.potentialAccuracy || profile.evaluationAccuracy || 'Low',
      strengthsKnown: [...profile.strengthsKnown],
      weaknessesKnown: [...profile.weaknessesKnown],
      summary: buildScoutingReportSummary(player, profile),
    };

    profile.scoutingHistory.push(report);
    profile.scoutingHistory = profile.scoutingHistory.slice(-52);
    return { success: true, updated: true, reason: 'scouting-report-created', report };
  }

  function processPersistentScoutingReports(dateString) {
    const players = (_state?.teams || []).flatMap(team =>
      Array.isArray(team?.roster) ? team.roster : []
    );
    const results = players.map(player => updatePersistentScoutingReport(player, dateString));
    return {
      success: true,
      processed: true,
      updated: results.filter(result => result?.updated).length,
      results,
    };
  }

'''
if 'function updatePersistentScoutingReport(' not in s:
    s=s.replace(anchor, helpers+anchor, 1)

# Wire reports immediately after the canonical scouting week is processed.
# Locate the living-world caller, not the processScoutingWeek implementation.
call_patterns=[
'''    const scoutingResult = processScoutingWeek(\n      normalizedDate\n    );\n''',
'''    const scoutingResult =\n      processScoutingWeek(\n        normalizedDate\n      );\n''',
'''    const scoutingResult = processScoutingWeek(normalizedDate);\n'''
]
replacement=None
matched=None
for pattern in call_patterns:
    if pattern in s:
        matched=pattern
        replacement=pattern+'''\n    const scoutingReportResult =\n      processPersistentScoutingReports(\n        normalizedDate\n      );\n'''
        break
if not matched:
    # fallback: call from processScoutingWeek itself just before its final success return
    start=s.index('  function processScoutingWeek(dateString) {')
    next_fn=s.find('\n  function ', start+10)
    if next_fn == -1: next_fn=len(s)
    chunk=s[start:next_fn]
    marker='''    return {\n      success: true,\n      processed: true,'''
    idx=chunk.rfind(marker)
    if idx == -1:
        raise SystemExit('could not find scouting process return/caller')
    chunk=chunk[:idx]+'''    const scoutingReportResult =\n      processPersistentScoutingReports(\n        normalizedDate\n      );\n\n'''+chunk[idx:]
    s=s[:start]+chunk+s[next_fn:]
else:
    s=s.replace(matched,replacement,1)

# If the living-world return explicitly packages scoutingResult, include report result too.
if 'scoutingReportResult' in s and 'scoutingReportResult,' not in s:
    # safe optional insertion near a common return key
    s=s.replace('''      scoutingResult,\n''','''      scoutingResult,\n      scoutingReportResult,\n''',1)

p.write_text(s)
print('added persistent scouting report engine')
