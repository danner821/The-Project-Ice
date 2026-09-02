from pathlib import Path

WORLD = Path('artifacts/project-ice/public/world.js')
GAME = Path('artifacts/project-ice/public/game.js')
world = WORLD.read_text(encoding='utf-8')
game = GAME.read_text(encoding='utf-8')

anchor = """  function getProspectRankForPlayer(playerOrId) {\n"""
if anchor not in world:
    raise SystemExit('getProspectRankForPlayer anchor missing')

helper = r'''  function buildCanonicalProspectRankingSnapshot(weekKey = null) {
    const players = getScoutingProspectUniverse();
    if (players.length === 0) return [];

    const rawRanked = players
      .map(player => ({
        player,
        playerId: player.id || player.playerId || null,
        score: calculateWeeklyScoutingScore(player),
      }))
      .sort((a, b) =>
        (b.score - a.score) ||
        ((Number(b.player?.overall) || 0) - (Number(a.player?.overall) || 0)) ||
        String(b.playerId || '').localeCompare(String(a.playerId || ''))
      );

    const rawRankByPlayerId = new Map(
      rawRanked.map((entry, index) => [String(entry.playerId || ''), index + 1])
    );

    const ranked = rawRanked
      .map(entry => {
        const rawRank = rawRankByPlayerId.get(String(entry.playerId || '')) || 999;
        const previousRank = Number(entry.player?.scoutingProfile?.publicRank) || 0;
        return {
          ...entry,
          stabilizedRankScore:
            previousRank > 0
              ? (previousRank * 0.72 + rawRank * 0.28)
              : rawRank,
        };
      })
      .sort((a, b) =>
        (a.stabilizedRankScore - b.stabilizedRankScore) ||
        (b.score - a.score) ||
        String(a.playerId || '').localeCompare(String(b.playerId || ''))
      );

    return ranked.map((entry, index) => ({
      rank: index + 1,
      playerId: entry.playerId,
      teamId: entry.player?.teamId || null,
      firstName: entry.player?.firstName || '',
      lastName: entry.player?.lastName || '',
      position: entry.player?.position || '',
      draftYear: getProjectIceProspectDraftYear(entry.player),
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
      persistentProspect:
        !isRankingOnlyBridgeProspect(entry.player) &&
        getProjectIceProspectDraftYear(entry.player) >= 2027,
      portToNhlWorld: canProspectPortToNhlWorld(entry.player),
      rankingOnly: isRankingOnlyBridgeProspect(entry.player),
      score: entry.score,
      interestLevel: entry.player?.scoutingProfile?.interestLevel || 'None',
      rankChange: Number(entry.player?.scoutingProfile?.rankChange) || 0,
      previousRank: Number(entry.player?.scoutingProfile?.previousRank) || null,
      scoutingExposureScore: Number(entry.player?.scoutingProfile?.scoutingExposureScore) || 0,
      spotlightGamesObserved: Number(entry.player?.scoutingProfile?.spotlightGamesObserved) || 0,
      weekKey,
    }));
  }

  function ensureProspectRankingsInitialized() {
    if (Array.isArray(_state.prospectRankings) && _state.prospectRankings.length > 0) {
      return _state.prospectRankings;
    }

    const date =
      _state?.season?.currentDate ||
      _state?.player?.currentDate ||
      _state?.currentDate ||
      null;
    const weekKey = date ? getLivingWorldWeekKey(normalizeLivingWorldDateKey(date)) : null;
    const snapshot = buildCanonicalProspectRankingSnapshot(weekKey || 'bootstrap');

    _state.prospectRankings = snapshot;

    if (snapshot.length > 0) {
      const rankById = new Map(
        snapshot.map(row => [String(row.playerId || ''), Number(row.rank) || 0])
      );
      getScoutingProspectUniverse().forEach(player => {
        const id = String(player?.id || player?.playerId || '');
        const rank = rankById.get(id) || 0;
        if (!rank) return;
        const profile = player.scoutingProfile || (player.scoutingProfile = createDefaultScoutingProfile());
        if (!(Number(profile.publicRank) > 0)) profile.publicRank = rank;
      });
    }

    return _state.prospectRankings;
  }

'''
world = world.replace(anchor, helper + anchor, 1)

old = """    const rankings = Array.isArray(_state.prospectRankings)\n      ? _state.prospectRankings\n      : [];\n"""
new = """    const rankings = ensureProspectRankingsInitialized();\n"""
if old not in world:
    raise SystemExit('rank resolver rankings source missing')
world = world.replace(old, new, 1)

old = """  function getProspectRankings() {\n    return Array.isArray(_state.prospectRankings)\n      ? _state.prospectRankings\n      : [];\n  }\n"""
new = """  function getProspectRankings() {\n    return ensureProspectRankingsInitialized();\n  }\n"""
if old not in world:
    raise SystemExit('getProspectRankings body missing')
world = world.replace(old, new, 1)

# Make the actual Prospects screen consume the public canonical API instead of
# reading state directly. This guarantees old/dev saves bootstrap the same board
# that badges read before any fallback UI can invent a second Top 100.
old = """  const canonicalRankedProspects =\n    (Array.isArray(WorldEngine.state.prospectRankings)\n      ? WorldEngine.state.prospectRankings\n      : [])\n"""
new = """  const canonicalRankedProspects =\n    (typeof WorldEngine?.getProspectRankings === 'function'\n      ? WorldEngine.getProspectRankings()\n      : [])\n"""
if old not in game:
    raise SystemExit('Prospects screen canonical source missing')
game = game.replace(old, new, 1)

WORLD.write_text(world, encoding='utf-8')
GAME.write_text(game, encoding='utf-8')
print('PROSPECT_RANK_BOOTSTRAP_ROOT=OK')
