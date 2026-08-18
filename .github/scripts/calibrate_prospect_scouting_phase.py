from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')

# 1) Add class/readiness adjustment before calculateWeeklyScoutingScore.
anchor="""  function calculateWeeklyScoutingScore(player = {}) {
"""
helper=r'''  function getProspectClassReadinessAdjustment(player = {}) {
    const draftYear = getProjectIceProspectDraftYear(player);
    if (!draftYear) return 0;

    /*
     * Opening Project Ice world: 2024 seniors, 2025 juniors, 2026 sophomores,
     * 2027 freshmen. Older players are physically closer to the next level;
     * younger future classes can still rank, but must be exceptional enough to
     * overcome a readiness gap rather than winning the board on potential alone.
     */
    const careerPlayer = getCareerPlayerFromWorldState();
    const careerDraftYear = getProjectIceProspectDraftYear(careerPlayer) || 2027;
    const classDistance = draftYear - careerDraftYear;

    if (classDistance <= -3) return 10.5;
    if (classDistance === -2) return 7.0;
    if (classDistance === -1) return 3.5;
    if (classDistance === 0) return 0;
    if (classDistance === 1) return -5.0;
    if (classDistance === 2) return -10.0;
    return -15.0;
  }

'''
if anchor not in s: raise SystemExit('calculateWeeklyScoutingScore anchor missing')
s=s.replace(anchor,helper+anchor,1)

old="""    const spotlightMomentum =
      getScoutingSpotlightPerformanceMomentum(player);

    return Number((
      overall * 0.48 +
      potential * 0.28 +
      Math.min(20, pointsPerGame * 10) * 0.10 +
      Math.min(100, reputation) * 0.09 +
      Math.min(100, coachTrust) * 0.05 +
      spotlightMomentum
    ).toFixed(3));
"""
new="""    const spotlightMomentum =
      getScoutingSpotlightPerformanceMomentum(player);
    const classReadinessAdjustment =
      getProspectClassReadinessAdjustment(player);

    return Number((
      overall * 0.48 +
      potential * 0.28 +
      Math.min(20, pointsPerGame * 10) * 0.10 +
      Math.min(100, reputation) * 0.09 +
      Math.min(100, coachTrust) * 0.05 +
      spotlightMomentum +
      classReadinessAdjustment
    ).toFixed(3));
"""
if old not in s: raise SystemExit('scouting score body anchor missing')
s=s.replace(old,new,1)

# 2) Rival Watch sees the full canonical world, not only HS rosters.
old="""    const candidates = (_state.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .filter(player => {
"""
new="""    const candidates = getAllWorldPlayers()
      .filter(player => {
"""
if old not in s: raise SystemExit('rival watch candidate anchor missing')
s=s.replace(old,new,1)

# 3) Zero observed games must not passively increase certainty.
old="""    if (meaningfulMismatch) {
      confidenceDelta = -Math.min(2.4, 0.35 + mismatchStrength * 0.72);
    } else {
      confidenceDelta = 0.18 + Math.min(0.52, observedGames * 0.025);
    }
"""
new="""    if (meaningfulMismatch) {
      confidenceDelta = -Math.min(2.4, 0.35 + mismatchStrength * 0.72);
    } else if (observedGames > 0) {
      confidenceDelta = 0.18 + Math.min(0.52, observedGames * 0.025);
    } else {
      /* No observation = no free increase in scouting certainty. */
      confidenceDelta = 0;
    }
"""
if old not in s: raise SystemExit('potential confidence anchor missing')
s=s.replace(old,new,1)

# 4) Avoid one redundant scouting report every week when nothing observable changed.
needle="""    const lastReport = profile.scoutingHistory[profile.scoutingHistory.length - 1] || null;

    /* One report snapshot per week. */
"""
replacement="""    const lastReport = profile.scoutingHistory[profile.scoutingHistory.length - 1] || null;
    const canonicalAccuracy =
      player.development?.potentialAccuracy ||
      player.potentialAccuracy ||
      profile.evaluationAccuracy ||
      'Low';
    const sameKnownTraits = (first = [], second = []) =>
      JSON.stringify(first || []) === JSON.stringify(second || []);
    const reportMeaningfullyChanged = Boolean(
      !lastReport ||
      Number(lastReport.gamesObserved || 0) !== observed ||
      String(lastReport.interestLevel || 'None') !== String(profile.interestLevel || 'None') ||
      String(lastReport.evaluationAccuracy || 'Low') !== String(canonicalAccuracy) ||
      !sameKnownTraits(lastReport.strengthsKnown, profile.strengthsKnown) ||
      !sameKnownTraits(lastReport.weaknessesKnown, profile.weaknessesKnown)
    );

    if (lastReport && lastReport.weekKey !== weekKey && !reportMeaningfullyChanged) {
      return {
        success: true,
        updated: false,
        reason: 'scouting-report-no-new-evidence',
        report: lastReport,
      };
    }

    /* One report snapshot per week when scouting information actually changes. */
"""
if needle not in s: raise SystemExit('scouting report lastReport anchor missing')
s=s.replace(needle,replacement,1)

# Use canonicalAccuracy in same-week and new report fields.
s=s.replace("""      lastReport.evaluationAccuracy =
        player.development?.potentialAccuracy || player.potentialAccuracy || profile.evaluationAccuracy || 'Low';
""","""      lastReport.evaluationAccuracy = canonicalAccuracy;
""",1)
s=s.replace("""      evaluationAccuracy:
        player.development?.potentialAccuracy || player.potentialAccuracy || profile.evaluationAccuracy || 'Low',
""","""      evaluationAccuracy: canonicalAccuracy,
""",1)

p.write_text(s,encoding='utf-8')
print('PROSPECT_SCOUTING_CALIBRATION=OK')
