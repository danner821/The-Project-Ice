from pathlib import Path

p = Path('artifacts/project-ice/public/world.js')
s = p.read_text(errors='ignore')

# Insert the HS-path cohort/promotion engine immediately before the existing
# external-prospect reconciliation function. This keeps all prospect identity
# movement inside the canonical World Engine.
anchor = "  function ensureExternalProspectWorld() {\n"
if anchor not in s:
    raise SystemExit('ensureExternalProspectWorld anchor missing')

helper = r'''  const HIGH_SCHOOL_REAL_PROSPECTS_PER_CLASS = 12;

  const HIGH_SCHOOL_REAL_PROSPECT_ENTRY_SEASON = Object.freeze({
    2027: '2026-27',
    2028: '2027-28',
    2029: '2028-29',
    2030: '2029-30',
  });

  function getHighSchoolProspectSelectionScore(player = {}) {
    const id = String(player?.id || player?.playerId || '');
    const draftYear = Number(player?.draftYear) || 0;
    let hash = 2166136261;
    const text = `${draftYear}:project-ice-hs-path:${id}`;

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function getHighSchoolProspectCohort(draftYear) {
    const year = Number(draftYear);
    const sourceProspects =
      typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)
        ? REAL_PROSPECTS
        : [];

    return sourceProspects
      .filter(player =>
        player?.realPlayer === true &&
        Number(player?.draftYear) === year
      )
      .slice()
      .sort((first, second) => {
        const firstScore = getHighSchoolProspectSelectionScore(first);
        const secondScore = getHighSchoolProspectSelectionScore(second);
        if (firstScore !== secondScore) return firstScore - secondScore;
        return String(first?.id || '').localeCompare(String(second?.id || ''));
      })
      .slice(0, HIGH_SCHOOL_REAL_PROSPECTS_PER_CLASS);
  }

  function ensureHighSchoolProspectPipelineState() {
    if (!_state.highSchoolProspectPipeline || typeof _state.highSchoolProspectPipeline !== 'object') {
      _state.highSchoolProspectPipeline = {
        version: 1,
        cohortSize: HIGH_SCHOOL_REAL_PROSPECTS_PER_CLASS,
        cohorts: {},
      };
    }

    if (!_state.highSchoolProspectPipeline.cohorts || typeof _state.highSchoolProspectPipeline.cohorts !== 'object') {
      _state.highSchoolProspectPipeline.cohorts = {};
    }

    [2027, 2028, 2029, 2030].forEach(draftYear => {
      const selected = getHighSchoolProspectCohort(draftYear);
      const entrySeason = HIGH_SCHOOL_REAL_PROSPECT_ENTRY_SEASON[draftYear];

      _state.highSchoolProspectPipeline.cohorts[draftYear] = {
        draftYear,
        entrySeason,
        entryClass: 'Freshman',
        playerIds: selected.map(player => String(player.id || player.playerId)),
      };
    });

    return _state.highSchoolProspectPipeline;
  }

  function getCurrentSeasonLabelForProspectPipeline() {
    return String(
      _state?.season?.label ||
      _state?.currentSeason ||
      ''
    ).trim();
  }

  function getProspectRosterPositionGroup(position) {
    const normalized = normalizeAttributePosition(position);
    if (normalized === 'G') return 'G';
    if (normalized === 'LD' || normalized === 'RD') return 'D';
    return 'F';
  }

  function findGeneratedRosterReplacement(team, prospect) {
    const roster = Array.isArray(team?.roster) ? team.roster : [];
    const targetPosition = normalizeAttributePosition(prospect?.position);
    const targetGroup = getProspectRosterPositionGroup(prospect?.position);

    const eligible = roster.filter(player =>
      player &&
      player?.isCareerPlayer !== true &&
      player?.realPlayer !== true
    );

    return (
      eligible.find(player => normalizeAttributePosition(player?.position) === targetPosition) ||
      eligible.find(player => getProspectRosterPositionGroup(player?.position) === targetGroup) ||
      eligible[eligible.length - 1] ||
      null
    );
  }

  function assignHighSchoolProspectToTeam(prospect, team, replacementPlayer = null) {
    if (!prospect || !team) return null;

    const schoolFullName = `${team.schoolName || ''} ${team.teamName || ''}`.trim();
    const rosterSlot = replacementPlayer?.rosterSlot || prospect?.rosterSlot || null;
    const jerseyNumber = replacementPlayer?.jerseyNumber || prospect?.jerseyNumber || null;

    prospect.teamId = team.teamId;
    prospect.schoolName = team.schoolName || '';
    prospect.teamName = team.teamName || '';
    prospect.teamAbbreviation = team.abbreviation || '';
    prospect.currentTeam = schoolFullName;
    prospect.league = 'HS';
    prospect.teamLevel = 'HS';
    prospect.year = 'Freshman';
    prospect.age = 14;
    prospect.careerStage = 'hs-freshman';
    prospect.hsPathProspect = true;
    prospect.hsEntrySeason = HIGH_SCHOOL_REAL_PROSPECT_ENTRY_SEASON[Number(prospect.draftYear)] || null;
    prospect.hsEntryDraftYear = Number(prospect.draftYear) || null;
    prospect.hsEntryClass = 'Freshman';
    prospect.hsRosterActive = true;

    if (rosterSlot) prospect.rosterSlot = rosterSlot;
    if (jerseyNumber) prospect.jerseyNumber = jerseyNumber;

    ensureCanonicalPlayerContract(prospect);
    return prospect;
  }

  function promoteHighSchoolProspectCohort(draftYear, options = {}) {
    const year = Number(draftYear);
    const pipeline = ensureHighSchoolProspectPipelineState();
    const cohort = pipeline?.cohorts?.[year];
    if (!cohort) return [];

    const expectedSeason = String(cohort.entrySeason || '');
    const currentSeason = getCurrentSeasonLabelForProspectPipeline();
    const force = options?.force === true;

    if (!force && currentSeason !== expectedSeason) return [];

    const teams = Array.isArray(_state.teams) ? _state.teams : [];
    if (teams.length === 0) return [];

    const sourceById = new Map(
      (typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)
        ? REAL_PROSPECTS
        : [])
        .map(player => [String(player?.id || player?.playerId || ''), player])
    );

    const externalById = new Map(
      (Array.isArray(_state.externalProspects) ? _state.externalProspects : [])
        .map(player => [String(player?.id || player?.playerId || ''), player])
    );

    const alreadyRosteredIds = new Set(
      teams.flatMap(team =>
        (Array.isArray(team?.roster) ? team.roster : [])
          .map(player => String(player?.id || player?.playerId || ''))
      )
    );

    const promoted = [];

    cohort.playerIds.forEach((playerId, cohortIndex) => {
      const id = String(playerId || '');
      if (!id) return;

      if (alreadyRosteredIds.has(id)) {
        const existingRosterPlayer = teams
          .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
          .find(player => String(player?.id || player?.playerId || '') === id);
        if (existingRosterPlayer) {
          existingRosterPlayer.hsPathProspect = true;
          existingRosterPlayer.hsEntrySeason = expectedSeason;
          existingRosterPlayer.hsEntryDraftYear = year;
          existingRosterPlayer.hsEntryClass = 'Freshman';
          existingRosterPlayer.hsRosterActive = true;
          promoted.push(existingRosterPlayer);
        }
        return;
      }

      const sourcePlayer = externalById.get(id) || sourceById.get(id);
      if (!sourcePlayer) return;

      /*
       * Spread the 12-player class across all eight schools in a stable
       * 2/1/2/1/2/1/2/1 pattern. The prospect replaces a generated roster
       * player so every team stays at its established roster size.
       */
      const teamIndex = cohortIndex % teams.length;
      const team = teams[teamIndex];
      const replacement = findGeneratedRosterReplacement(team, sourcePlayer);
      if (!replacement) return;

      const replacementIndex = team.roster.findIndex(player => player === replacement);
      if (replacementIndex < 0) return;

      const canonicalProspect = sourcePlayer;
      assignHighSchoolProspectToTeam(canonicalProspect, team, replacement);
      team.roster.splice(replacementIndex, 1, canonicalProspect);

      alreadyRosteredIds.add(id);
      promoted.push(canonicalProspect);
    });

    if (promoted.length > 0) {
      const promotedIds = new Set(promoted.map(player => String(player.id || player.playerId || '')));
      _state.externalProspects = (Array.isArray(_state.externalProspects) ? _state.externalProspects : [])
        .filter(player => !promotedIds.has(String(player?.id || player?.playerId || '')));
    }

    return promoted;
  }

  function ensureHighSchoolRealProspectPipeline() {
    const pipeline = ensureHighSchoolProspectPipelineState();
    const currentSeason = getCurrentSeasonLabelForProspectPipeline();

    Object.values(pipeline.cohorts || {}).forEach(cohort => {
      const ids = new Set(cohort.playerIds || []);

      (Array.isArray(_state.externalProspects) ? _state.externalProspects : []).forEach(player => {
        const id = String(player?.id || player?.playerId || '');
        if (!ids.has(id)) return;
        player.hsPathProspect = true;
        player.hsEntrySeason = cohort.entrySeason;
        player.hsEntryDraftYear = Number(cohort.draftYear) || null;
        player.hsEntryClass = 'Freshman';
        player.hsRosterActive = false;
      });

      if (String(cohort.entrySeason) === currentSeason) {
        promoteHighSchoolProspectCohort(cohort.draftYear);
      }
    });

    return pipeline;
  }

'''

s = s.replace(anchor, helper + anchor, 1)

# Run the pipeline at the end of external-prospect reconciliation. We anchor on
# the exact final return used by the current canonical function.
old = """    return _state.externalProspects;\n  }\n\n  function getAllWorldPlayers() {\n"""
new = """    ensureHighSchoolRealProspectPipeline();\n    return _state.externalProspects;\n  }\n\n  function getAllWorldPlayers() {\n"""
if old not in s:
    raise SystemExit('external prospect reconciliation return anchor missing')
s = s.replace(old, new, 1)

# Public read/promotion APIs for Season Lifecycle and testing.
old = """    getExternalProspects: () => ensureExternalProspectWorld(),\n"""
new = """    getExternalProspects: () => ensureExternalProspectWorld(),\n    getHighSchoolProspectPipeline: () => ensureHighSchoolProspectPipelineState(),\n    getHighSchoolProspectCohort,\n    promoteHighSchoolProspectCohort,\n"""
if old not in s:
    raise SystemExit('WorldEngine prospect export anchor missing')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('HS_REAL_PROSPECT_PIPELINE=OK')
