from pathlib import Path
p=Path('artifacts/project-ice/public/world.js')
s=p.read_text(errors='ignore')

# Persistent external prospect collection.
old="""      prospectRankings: [],   // { rank, playerId, … }

      livingWorld: {
"""
new="""      prospectRankings: [],   // { rank, playerId, … }

      /* Persistent 2027–2030 real-prospect universe. */
      externalProspects:
        typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)
          ? REAL_PROSPECTS.map(player => structuredClone(player))
          : [],

      livingWorld: {
"""
if old not in s: raise SystemExit('defaults anchor missing')
s=s.replace(old,new,1)

# Unified canonical player source and save-safe migration.
anchor="  function getPlayerById(playerId) {\n"
helper=r'''  function ensureExternalProspectWorld() {
    const sourceProspects =
      typeof REAL_PROSPECTS !== 'undefined' && Array.isArray(REAL_PROSPECTS)
        ? REAL_PROSPECTS
        : [];

    if (!Array.isArray(_state.externalProspects)) _state.externalProspects = [];

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

      /* Add new factual/static fields without resetting evolved career state. */
      [
        'firstName','lastName','fullName','position','draftYear','birthDate',
        'nationality','height','weightLbs','shoots','catches',
        'realTeamSnapshot','realLeagueSnapshot','biographySource',
        'realPlayer','persistentProspect','portToNhlWorld','rankingOnly','ratingSource'
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

    _state.externalProspects.forEach(player => ensureCanonicalPlayerContract(player));
    return _state.externalProspects;
  }

  function getAllWorldPlayers() {
    const rosterPlayers = (Array.isArray(_state.teams) ? _state.teams : [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : []);
    const unique = new Map();

    [...rosterPlayers, ...ensureExternalProspectWorld()].forEach(player => {
      if (!player || typeof player !== 'object') return;
      ensureCanonicalPlayerContract(player);
      const id = String(player.id || player.playerId || '');
      if (id && !unique.has(id)) unique.set(id, player);
    });

    return Array.from(unique.values());
  }

'''
if anchor not in s: raise SystemExit('getPlayerById anchor missing')
s=s.replace(anchor,helper+anchor,1)

# Extend lookup. Replace only the final return-null inside the getPlayerById function.
start=s.find('  function getPlayerById(playerId) {')
end=s.find('  function normalizeCareerPosition(position)',start)
if start < 0 or end < 0: raise SystemExit('getPlayerById bounds missing')
chunk=s[start:end]
needle="""    return null;
  }
"""
replacement="""    const externalPlayer = ensureExternalProspectWorld().find(
      prospect => String(prospect.playerId || prospect.id) === String(playerId)
    );

    return externalPlayer || null;
  }
"""
if needle not in chunk: raise SystemExit('getPlayerById terminal return missing')
chunk=chunk.replace(needle,replacement,1)
s=s[:start]+chunk+s[end:]

# Persistent scouting reports: all world players.
old="""  function processPersistentScoutingReports(dateString) {
    const players = (_state?.teams || []).flatMap(team =>
      Array.isArray(team?.roster) ? team.roster : []
    );
"""
new="""  function processPersistentScoutingReports(dateString) {
    const players = getAllWorldPlayers();
"""
if old not in s: raise SystemExit('persistent-report players anchor missing')
s=s.replace(old,new,1)

# Weekly scouting: all world players.
old="""    const players = (_state?.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : []).map(player => {
        ensureCanonicalPlayerContract(player);
        return player;
      })
    );
"""
if old not in s: raise SystemExit('scouting players anchor missing')
s=s.replace(old,"    const players = getAllWorldPlayers();\n",1)

# Weekly potential: all world players, scoped to its function.
ps=s.find('  function processPotentialWeek(dateString) {')
pe=s.find('  function getScoutingAttributeGroups',ps)
if ps < 0 or pe < 0: raise SystemExit('potential function bounds missing')
pchunk=s[ps:pe]
old="""    const players = (_state?.teams || []).flatMap(team =>
      (Array.isArray(team?.roster) ? team.roster : [])
    );
"""
if old not in pchunk: raise SystemExit('potential players anchor missing')
pchunk=pchunk.replace(old,"    const players = getAllWorldPlayers();\n",1)
s=s[:ps]+pchunk+s[pe:]

# Canonical ranking rows carry all context downstream UI/draft systems need.
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
        entry.player?.potentialTier || '',
      potentialAccuracy:
        entry.player?.development?.potentialAccuracy ||
        entry.player?.potentialAccuracy ||
        entry.player?.scoutingProfile?.evaluationAccuracy || 'Low',
      currentTeam:
        entry.player?.currentTeam || entry.player?.realTeamSnapshot || entry.player?.teamName || '',
      teamName:
        entry.player?.teamName || entry.player?.currentTeam || entry.player?.realTeamSnapshot || '',
      league: entry.player?.league || entry.player?.realLeagueSnapshot || '',
      nationality: entry.player?.nationality || '',
      realPlayer: entry.player?.realPlayer === true,
      persistentProspect: entry.player?.persistentProspect === true,
      portToNhlWorld: entry.player?.portToNhlWorld === true,
      rankingOnly: entry.player?.rankingOnly === true,
      score: entry.score,
"""
if old not in s: raise SystemExit('ranking row anchor missing')
s=s.replace(old,new,1)

# Public read APIs.
old="    getPlayerById,\n"
new="""    getPlayerById,
    getAllWorldPlayers,
    getExternalProspects: () => ensureExternalProspectWorld(),
"""
if old not in s: raise SystemExit('export anchor missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('WORLD_REAL_PROSPECT_INTEGRATION=OK')
