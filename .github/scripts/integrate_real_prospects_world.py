from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')

# 1. Persistent external prospect collection in defaults.
old="""      prospectRankings: [],   // { rank, playerId, … }

      livingWorld: {
"""
new="""      prospectRankings: [],   // { rank, playerId, … }

      /*
       * Persistent non-HS prospect universe. REAL_PROSPECTS is loaded before
       * world.js. These players are canonical world entities, not UI-only
       * rows, and later survive into Draft/NHL systems when portToNhlWorld is
       * true. Existing saves are reconciled by ensureExternalProspectWorld().
       */
      externalProspects:
        typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)
          ? REAL_PROSPECTS.map(player => structuredClone(player))
          : [],

      livingWorld: {
"""
if old not in s: raise SystemExit('defaults anchor missing')
s=s.replace(old,new,1)

# 2. Add external-world reconciliation and unified player source before getPlayerById.
anchor="""  function getPlayerById(playerId) {
"""
helper=r'''  function ensureExternalProspectWorld() {
    const sourceProspects =
      typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)
        ? REAL_PROSPECTS
        : [];

    if (!Array.isArray(_state.externalProspects)) {
      _state.externalProspects = [];
    }

    const existingById = new Map(
      _state.externalProspects
        .filter(player => player && (player.id || player.playerId))
        .map(player => [String(player.id || player.playerId), player])
    );

    sourceProspects.forEach(sourcePlayer => {
      const sourceId = String(sourcePlayer?.id || sourcePlayer?.playerId || '');
      if (!sourceId) return;

      const existing = existingById.get(sourceId);
      if (!existing) {
        const created = structuredClone(sourcePlayer);
        _state.externalProspects.push(created);
        existingById.set(sourceId, created);
        return;
      }

      /*
       * Data migrations may add factual/static fields later, but must never
       * overwrite evolved ratings, potential, scouting history or development
       * state in an existing career save.
       */
      [
        'firstName','lastName','fullName','position','draftYear','birthDate',
        'nationality','height','weightLbs','shoots','catches',
        'realTeamSnapshot','realLeagueSnapshot','biographySource',
        'realPlayer','persistentProspect','portToNhlWorld','rankingOnly',
        'ratingSource'
      ].forEach(key => {
        if ((existing[key] === undefined || existing[key] === null || existing[key] === '') &&
            sourcePlayer[key] !== undefined) {
          existing[key] = structuredClone(sourcePlayer[key]);
        }
      });
    });

    _state.externalProspects = _state.externalProspects.filter(player =>
      player &&
      Number(player.draftYear) >= 2027 &&
      Number(player.draftYear) <= 2030 &&
      player.realPlayer === true
    );

    _state.externalProspects.forEach(player => {
      ensureCanonicalPlayerContract(player);
    });

    return _state.externalProspects;
  }

  function getAllWorldPlayers() {
    const rosterPlayers = (Array.isArray(_state.teams) ? _state.teams : [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : []);
    const externalPlayers = ensureExternalProspectWorld();
    const unique = new Map();

    [...rosterPlayers, ...externalPlayers].forEach(player => {
      if (!player || typeof player !== 'object') return;
      ensureCanonicalPlayerContract(player);
      const id = String(player.id || player.playerId || '');
      if (!id) return;
      if (!unique.has(id)) unique.set(id, player);
    });

    return Array.from(unique.values());
  }

'''
if anchor not in s: raise SystemExit('getPlayerById anchor missing')
s=s.replace(anchor,helper+anchor,1)

# 3. Extend canonical player lookup to external players.
old="""    return null;
  }
  function normalizeCareerPosition(position) {
"""
new="""    const externalPlayer = ensureExternalProspectWorld().find(
      prospect =>
        String(prospect.playerId || prospect.id) === String(playerId)
    );

    return externalPlayer || null;
  }
  function normalizeCareerPosition(position) {
"""
# restrict to occurrence after getPlayerById
idx=s.find('  function getPlayerById(playerId) {')
end=s.find('  function normalizeCareerPosition(position)',idx)
chunk=s[idx:end]
if old not in chunk: raise SystemExit('getPlayerById return anchor missing')
chunk=chunk.replace(old,new,1)
s=s[:idx]+chunk+s[end:]

# 4. Persistent scouting reports consume all canonical world players.
old="""  function processPersistentScoutingReports(dateString) {
    const players = (_state?.teams || []).flatMap(team =>
      Array.isArray(team?.roster) ? team.roster : []
    );
"""
new="""  function processPersistentScoutingReports(dateString) {
    const players = getAllWorldPlayers();
"""
if old not in s: raise SystemExit('persistent reports anchor missing')
s=s.replace(old,new,1)

# 5. Weekly scouting consumes all canonical world players.
old="""    const players = (_state?.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : []).map(player => {
        ensureCanonicalPlayerContract(player);
        return player;
      })
    );
"""
new="""    const players = getAllWorldPlayers();
"""
if old not in s: raise SystemExit('weekly scouting players anchor missing')
s=s.replace(old,new,1)

# 6. Weekly potential consumes all canonical world players.
old="""    const players = (_state?.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : [])
    );
"""
new="""    const players = getAllWorldPlayers();
"""
# occurrence near processPotentialWeek only
pi=s.find('  function processPotentialWeek(dateString) {')
pe=s.find('  function getScoutingAttributeGroups',pi)
pchunk=s[pi:pe]
if old not in pchunk: raise SystemExit('potential players anchor missing')
pchunk=pchunk.replace(old,new,1)
s=s[:pi]+pchunk+s[pe:]

# 7. Carry persistent prospect identity/context into canonical ranking rows.
old="""      position: entry.player?.position || '',
      overall: Number(entry.player?.overall) || 0,
      potential: Number(entry.player?.development?.potential ?? entry.player?.potential) || 0,
      score: entry.score,
"""
new="""      position: entry.player?.position || '',
      draftYear: Number(entry.player?.draftYear) || null,
      overall: Number(entry.player?.overall) || 0,
      potential: Number(entry.player?.development?.potential ?? entry.player?.potential) || 0,
      potentialRole:
        entry.player?.development?.potentialRole ||
        entry.player?.potentialRole ||
        entry.player?.potentialTier ||
        '',
      potentialAccuracy:
        entry.player?.development?.potentialAccuracy ||
        entry.player?.potentialAccuracy ||
        entry.player?.scoutingProfile?.evaluationAccuracy ||
        'Low',
      currentTeam:
        entry.player?.currentTeam ||
        entry.player?.realTeamSnapshot ||
        entry.player?.teamName ||
        '',
      teamName:
        entry.player?.teamName ||
        entry.player?.currentTeam ||
        entry.player?.realTeamSnapshot ||
        '',
      league:
        entry.player?.league ||
        entry.player?.realLeagueSnapshot ||
        '',
      nationality: entry.player?.nationality || '',
      realPlayer: entry.player?.realPlayer === true,
      persistentProspect: entry.player?.persistentProspect === true,
      portToNhlWorld: entry.player?.portToNhlWorld === true,
      rankingOnly: entry.player?.rankingOnly === true,
      score: entry.score,
"""
if old not in s: raise SystemExit('ranking row anchor missing')
s=s.replace(old,new,1)

# 8. Export read APIs for future UI/draft systems if return object anchor exists.
# Add methods next to getPlayerById exposure using a conservative exact replacement.
old="""    getPlayerById,
"""
new="""    getPlayerById,
    getAllWorldPlayers,
    getExternalProspects: () => ensureExternalProspectWorld(),
"""
if old not in s: raise SystemExit('WorldEngine export getPlayerById anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('WORLD_REAL_PROSPECT_INTEGRATION=OK')
