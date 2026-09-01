from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

start = text.find('function getCanonicalTop100ProspectRank(player) {')
end = text.find('\nfunction getCanonicalProspectBadgeHtml(', start)
if start < 0 or end < 0:
    raise SystemExit('canonical prospect badge helper not found')

replacement = r'''function getCanonicalTop100ProspectRank(player) {
  if (!player) return null;

  /*
   * scoutingProfile.publicRank is the canonical saved ranking field.
   * The weekly scouting engine writes publicRank there, not on the player
   * root. Read that contract first so every canonical roster surface consumes
   * the same rank that powers the Prospects screen.
   */
  const rankFromPlayer = candidate => {
    if (!candidate || typeof candidate !== 'object') return null;
    const rank = Number(
      candidate.scoutingProfile?.publicRank ??
      candidate.prospectRank ??
      candidate.publicRank ??
      candidate.rank ??
      0
    );
    return Number.isFinite(rank) && rank >= 1 && rank <= 100
      ? rank
      : null;
  };

  const directRank = rankFromPlayer(player);
  if (directRank) return directRank;

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

  /*
   * Travel uses copied roster records. Resolve those copies back to the
   * canonical world player before consulting the flattened ranking board.
   */
  for (const id of ids) {
    let canonical = null;
    try {
      canonical = WorldEngine.getPlayerById?.(id) || null;
    } catch (_) {
      canonical = null;
    }
    const canonicalRank = rankFromPlayer(canonical);
    if (canonicalRank) return canonicalRank;
  }

  let rankings = [];
  try {
    rankings = WorldEngine.getProspectRankings?.() || [];
  } catch (_) {
    rankings = [];
  }

  if (!Array.isArray(rankings) || rankings.length === 0) return null;

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

  const rank = Number(
    row?.rank ??
    row?.prospectRank ??
    row?.publicRank ??
    0
  );

  return Number.isFinite(rank) && rank >= 1 && rank <= 100
    ? rank
    : null;
}
'''

text = text[:start] + replacement + text[end:]
path.write_text(text, encoding='utf-8')
print('CANONICAL_PROSPECT_BADGE_RESOLUTION=OK')
