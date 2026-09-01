from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

old = """  const canonicalRankedProspects = teams
    .flatMap(team => {
      const roster = Array.isArray(team?.roster) ? team.roster : [];
      return roster.map(player => ({
        player,
        team,
        rank: Math.max(0, Number(player?.scoutingProfile?.publicRank) || 0),
      }));
    })
    .filter(entry => entry.rank > 0)
    .sort((a, b) => a.rank - b.rank);
"""
new = """  const canonicalRankedProspects =
    (Array.isArray(WorldEngine.getProspectRankings?.())
      ? WorldEngine.getProspectRankings()
      : [])
      .map(ranking => {
        const player =
          typeof WorldEngine?.getPlayerById === 'function'
            ? WorldEngine.getPlayerById(ranking?.playerId)
            : null;
        const resolvedPlayer = player || ranking;
        const team = teams.find(team =>
          String(team?.teamId || '') ===
          String(ranking?.teamId || resolvedPlayer?.teamId || '')
        ) || null;

        return {
          player: resolvedPlayer,
          team,
          ranking,
          rank: Math.max(0, Number(ranking?.rank) || 0),
        };
      })
      .filter(entry => entry.rank > 0 && entry.player)
      .sort((a, b) => a.rank - b.rank);
"""

if old not in text:
    raise SystemExit('stale roster-based prospect ranking source not found')
text = text.replace(old, new, 1)

old_map = """    const canonicalRows = canonicalRankedProspects.map(({ player, team, rank }) => {
"""
new_map = """    const canonicalRows = canonicalRankedProspects.map(({ player, team, ranking, rank }) => {
"""
if old_map in text:
    text = text.replace(old_map, new_map, 1)

old_return = """      return {
        ...player,
        currentRank: rank,
"""
new_return = """      return {
        ...ranking,
        ...player,
        currentRank: rank,
"""
if old_return in text:
    text = text.replace(old_return, new_return, 1)

# The badge renderer must consume exactly the same saved ranking board as the
# Prospects screen. Remove top-level rank fallbacks that can diverge from it.
start = text.find('function getCanonicalTop100ProspectRank(player) {')
end = text.find('\nfunction getCanonicalProspectBadgeHtml', start)
if start < 0 or end < 0:
    raise SystemExit('canonical prospect badge resolver not found')

resolver = r'''function getCanonicalTop100ProspectRank(player) {
  if (!player) return null;

  let rankings = [];
  try {
    rankings = WorldEngine.getProspectRankings?.() || [];
  } catch (_) {
    rankings = [];
  }

  if (!Array.isArray(rankings) || rankings.length === 0) return null;

  const ids = new Set(
    [
      player.sourcePlayerId,
      player.playerId,
      player.id,
      player.prospectId,
    ]
      .filter(Boolean)
      .map(value => String(value))
  );

  if (player.isCareerPlayer === true) {
    [
      WorldEngine.state?.player?.playerId,
      WorldEngine.state?.player?.id,
      Game.player?.playerId,
      Game.player?.id,
      'career-player',
    ]
      .filter(Boolean)
      .forEach(value => ids.add(String(value)));
  }

  const row = rankings.find(entry => {
    const rowId = String(entry?.playerId || entry?.id || entry?.prospectId || '');
    return rowId && ids.has(rowId);
  });

  const rank = Number(row?.rank || 0);
  return Number.isFinite(rank) && rank >= 1 && rank <= 100 ? rank : null;
}
'''
text = text[:start] + resolver + text[end:]

path.write_text(text, encoding='utf-8')
print('PROSPECT_RANK_SOURCE_ROOT=OK')
