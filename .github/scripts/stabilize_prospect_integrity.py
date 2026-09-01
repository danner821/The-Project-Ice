from pathlib import Path

world_path = Path('artifacts/project-ice/public/world.js')
game_path = Path('artifacts/project-ice/public/game.js')
world = world_path.read_text(errors='ignore')
game = game_path.read_text(errors='ignore')

# 1) Freeze saved HS real-prospect cohorts. Source-data curation must never
# silently replace the cohort membership of an in-progress career.
start = world.find('  function ensureHighSchoolProspectPipelineState() {')
end = world.find('\n  function getCurrentSeasonLabelForProspectPipeline()', start)
if start < 0 or end < 0:
    raise SystemExit('HS prospect pipeline state function bounds missing')

new_pipeline_state = r'''  function ensureHighSchoolProspectPipelineState() {
    if (!_state.highSchoolProspectPipeline || typeof _state.highSchoolProspectPipeline !== 'object') {
      _state.highSchoolProspectPipeline = {
        version: 2,
        cohortSize: HIGH_SCHOOL_REAL_PROSPECTS_PER_CLASS,
        cohorts: {},
      };
    }

    if (!_state.highSchoolProspectPipeline.cohorts || typeof _state.highSchoolProspectPipeline.cohorts !== 'object') {
      _state.highSchoolProspectPipeline.cohorts = {};
    }

    _state.highSchoolProspectPipeline.version = Math.max(
      2,
      Number(_state.highSchoolProspectPipeline.version) || 0
    );
    _state.highSchoolProspectPipeline.cohortSize = HIGH_SCHOOL_REAL_PROSPECTS_PER_CLASS;

    [2027, 2028, 2029, 2030].forEach(draftYear => {
      const existing = _state.highSchoolProspectPipeline.cohorts[draftYear];
      const hasLockedMembership = Boolean(
        existing &&
        Array.isArray(existing.playerIds) &&
        existing.playerIds.length > 0
      );

      if (hasLockedMembership) {
        existing.draftYear = Number(existing.draftYear) || draftYear;
        existing.entrySeason = existing.entrySeason || HIGH_SCHOOL_REAL_PROSPECT_ENTRY_SEASON[draftYear];
        existing.entryClass = existing.entryClass || 'Freshman';
        existing.locked = true;
        existing.playerIds = [...new Set(existing.playerIds.map(String).filter(Boolean))];
        return;
      }

      const selected = getHighSchoolProspectCohort(draftYear);
      const entrySeason = HIGH_SCHOOL_REAL_PROSPECT_ENTRY_SEASON[draftYear];

      _state.highSchoolProspectPipeline.cohorts[draftYear] = {
        draftYear,
        entrySeason,
        entryClass: 'Freshman',
        playerIds: selected.map(player => String(player.id || player.playerId)),
        locked: true,
      };
    });

    return _state.highSchoolProspectPipeline;
  }
'''
world = world[:start] + new_pipeline_state + world[end:]

# 2) Never mutate the static REAL_PROSPECTS source object when restoring a
# missing external player into an HS roster.
old_source = """      const sourcePlayer = externalById.get(id) || sourceById.get(id);\n      if (!sourcePlayer) return;\n"""
new_source = """      const externalPlayer = externalById.get(id) || null;\n      const sourceTemplate = sourceById.get(id) || null;\n      const sourcePlayer = externalPlayer || (sourceTemplate ? structuredClone(sourceTemplate) : null);\n      if (!sourcePlayer) return;\n"""
if old_source not in world:
    raise SystemExit('HS prospect source fallback anchor missing')
world = world.replace(old_source, new_source, 1)

# 3) Add one dedicated, side-effect-contained scouting universe. Temporary
# Travel adapters/copies/generated Travel players must never enter master
# prospect rankings. The career player is explicitly retained even if a roster
# migration is temporarily incomplete.
anchor = '  function processScoutingWeek(dateString) {\n'
if anchor not in world:
    raise SystemExit('processScoutingWeek anchor missing')
helper = r'''  function getScoutingProspectUniverse() {
    const canonicalRosterPlayers =
      (Array.isArray(_state.teams) ? _state.teams : [])
        .filter(team => team?.travelProfileAdapter !== true)
        .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
        .filter(player =>
          player &&
          player.generatedTravelPlayer !== true &&
          player.travelProfileAdapter !== true
        );

    const externalPlayers = ensureExternalProspectWorld();
    const careerPlayer = getCareerPlayerFromWorldState() || _state.player || null;
    const unique = new Map();

    const addPlayer = player => {
      if (!player || typeof player !== 'object') return;
      if (player.generatedTravelPlayer === true) return;

      ensureCanonicalPlayerContract(player);

      const canonicalId = String(
        player.sourcePlayerId ||
        player.playerId ||
        player.id ||
        ''
      );

      if (!canonicalId || unique.has(canonicalId)) return;
      unique.set(canonicalId, player);
    };

    canonicalRosterPlayers.forEach(addPlayer);
    externalPlayers.forEach(addPlayer);
    addPlayer(careerPlayer);

    return Array.from(unique.values());
  }

  function getProspectRankings() {
    return Array.isArray(_state.prospectRankings)
      ? _state.prospectRankings
      : [];
  }

'''
world = world.replace(anchor, helper + anchor, 1)

# 4) Scouting-owned systems use the scouting universe, not generic world
# players. Leave non-scouting callers of getAllWorldPlayers untouched.
old_reports = '  function processPersistentScoutingReports(dateString) {\n    const players = getAllWorldPlayers();\n'
new_reports = '  function processPersistentScoutingReports(dateString) {\n    const players = getScoutingProspectUniverse();\n'
if old_reports not in world:
    raise SystemExit('persistent scouting player source anchor missing')
world = world.replace(old_reports, new_reports, 1)

old_week = '    const players = getAllWorldPlayers();\n\n    if (players.length === 0) {\n'
new_week = '    const players = getScoutingProspectUniverse();\n\n    if (players.length === 0) {\n'
if old_week not in world:
    raise SystemExit('weekly scouting player source anchor missing')
world = world.replace(old_week, new_week, 1)

# Rival Watch should compare against the same canonical board.
world = world.replace(
    '    const candidates = getAllWorldPlayers()\n      .filter(player => {',
    '    const candidates = getScoutingProspectUniverse()\n      .filter(player => {',
    1,
)

# 5) Public read APIs give Travel/UI one explicit rankings authority.
export_anchor = '    getAllWorldPlayers,\n    getExternalProspects: () => ensureExternalProspectWorld(),\n'
export_replacement = '    getAllWorldPlayers,\n    getScoutingProspectUniverse,\n    getProspectRankings,\n    getExternalProspects: () => ensureExternalProspectWorld(),\n'
if export_anchor not in world:
    raise SystemExit('WorldEngine prospect export anchor missing')
world = world.replace(export_anchor, export_replacement, 1)

# 6) The Prospects screen must never erase a known career rank merely because
# a malformed/incomplete ranking array temporarily lacks the career row.
old_game = """    const careerCanonicalRow = canonicalRows.find(player => player.isUser);\n    Game.player.prospectRank = careerCanonicalRow?.currentRank || null;\n"""
new_game = """    const careerCanonicalRow = canonicalRows.find(player => player.isUser);\n    const canonicalCareerPlayer =\n      typeof WorldEngine?.getPlayerById === 'function'\n        ? WorldEngine.getPlayerById(\n            Game.player?.playerId ||\n            Game.player?.id ||\n            'career-player'\n          )\n        : null;\n    const preservedCareerRank =\n      Number(canonicalCareerPlayer?.scoutingProfile?.publicRank) ||\n      Number(Game.player?.prospectRank) ||\n      null;\n\n    Game.player.prospectRank =\n      careerCanonicalRow?.currentRank ||\n      preservedCareerRank;\n"""
if old_game not in game:
    raise SystemExit('career prospect rank UI anchor missing')
game = game.replace(old_game, new_game, 1)

world_path.write_text(world, encoding='utf-8')
game_path.write_text(game, encoding='utf-8')
print('PROSPECT_INTEGRITY_STABILIZATION=OK')
