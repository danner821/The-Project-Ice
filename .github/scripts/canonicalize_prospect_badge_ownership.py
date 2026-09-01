from pathlib import Path

world_path = Path('artifacts/project-ice/public/world.js')
game_path = Path('artifacts/project-ice/public/game.js')
travel_path = Path('artifacts/project-ice/public/travel-hockey-profile-repair-v2.js')

world = world_path.read_text(encoding='utf-8')
game = game_path.read_text(encoding='utf-8')
travel = travel_path.read_text(encoding='utf-8')

# 1) WorldEngine becomes the single owner of prospect-rank identity resolution.
anchor = """  function getProspectRankings() {
    return Array.isArray(_state.prospectRankings)
      ? _state.prospectRankings
      : [];
  }
"""
helper = """  function getProspectRankForPlayer(playerOrId) {
    const player =
      playerOrId && typeof playerOrId === 'object'
        ? playerOrId
        : null;

    const ids = new Set(
      (player
        ? [player.sourcePlayerId, player.playerId, player.id, player.prospectId]
        : [playerOrId]
      )
        .filter(Boolean)
        .map(value => String(value))
    );

    if (player?.isCareerPlayer === true) {
      [
        _state?.player?.playerId,
        _state?.player?.id,
        'career-player',
      ]
        .filter(Boolean)
        .forEach(value => ids.add(String(value)));
    }

    if (ids.size === 0) return null;

    const rankings = Array.isArray(_state.prospectRankings)
      ? _state.prospectRankings
      : [];

    const row = rankings.find(entry => {
      const rowIds = [
        entry?.sourcePlayerId,
        entry?.playerId,
        entry?.id,
        entry?.prospectId,
      ]
        .filter(Boolean)
        .map(value => String(value));

      return rowIds.some(id => ids.has(id));
    });

    const rank = Number(row?.rank || 0);
    return Number.isFinite(rank) && rank > 0 ? rank : null;
  }

""" + anchor

if 'function getProspectRankForPlayer(playerOrId)' not in world:
    if anchor not in world:
        raise SystemExit('WorldEngine getProspectRankings anchor missing')
    world = world.replace(anchor, helper, 1)

export_anchor = """    getScoutingProspectUniverse,
    getProspectRankings,
"""
export_replacement = """    getScoutingProspectUniverse,
    getProspectRankings,
    getProspectRankForPlayer,
"""
if '    getProspectRankForPlayer,\n' not in world:
    if export_anchor not in world:
        raise SystemExit('WorldEngine prospect export anchor missing')
    world = world.replace(export_anchor, export_replacement, 1)

# 2) Canonical Team/Team Profile renderer delegates rank identity to WorldEngine.
start = game.find('function getCanonicalTop100ProspectRank(player) {')
end = game.find('\nfunction getCanonicalProspectBadgeHtml', start)
if start < 0 or end < 0:
    raise SystemExit('game prospect badge resolver bounds missing')

resolver = """function getCanonicalTop100ProspectRank(player) {
  if (!player) return null;

  const rank = Number(
    WorldEngine.getProspectRankForPlayer?.(player) || 0
  );

  return Number.isFinite(rank) && rank >= 1 && rank <= 100
    ? rank
    : null;
}
"""
game = game[:start] + resolver + game[end:]

# 3) Travel profile repair must not own prospect badges. It may repair Travel
# context/leaders, but rank presentation belongs to the canonical renderer.
travel = travel.replace("  const STYLE_ID='pi-travel-profile-repair-v2-style';\n", '')

style_start = travel.find('  function injectStyle()')
rank_start = travel.find('  function rankRows()', style_start)
real_start = travel.find('  function realCareerTeamId()', rank_start)
if style_start >= 0 and rank_start >= 0 and real_start >= 0:
    travel = travel[:style_start] + travel[real_start:]
else:
    raise SystemExit('Travel badge helper block bounds missing')

travel = travel.replace('decorate(root,team);WorldEngine.renderScopedTeamProfileLeaders?.();', 'WorldEngine.renderScopedTeamProfileLeaders?.();')
travel = travel.replace('function install(){injectStyle();installTeamTabOwnership();', 'function install(){installTeamTabOwnership();')

world_path.write_text(world, encoding='utf-8')
game_path.write_text(game, encoding='utf-8')
travel_path.write_text(travel, encoding='utf-8')

print('CANONICAL_PROSPECT_BADGE_OWNERSHIP=OK')
