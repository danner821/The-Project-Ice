from pathlib import Path
import re

GAME = Path('artifacts/project-ice/public/game.js')
CSS = Path('artifacts/project-ice/public/style.css')

game = GAME.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')

helper = r'''
/*
 * Canonical Top-100 prospect badge helper.
 *
 * This is intentionally read-only. It never generates or rewrites rankings;
 * it only resolves the current saved scouting board. Travel copies resolve
 * through sourcePlayerId so the badge always follows the canonical player.
 */
function getCanonicalTop100ProspectRank(player) {
  if (!player) return null;

  const direct = Number(
    player.prospectRank ??
    player.publicRank ??
    player.rank ??
    0
  );

  if (Number.isFinite(direct) && direct >= 1 && direct <= 100) {
    return direct;
  }

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
    const rowId = String(
      entry?.playerId ||
      entry?.id ||
      entry?.prospectId ||
      ''
    );
    return rowId && ids.has(rowId);
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

function getCanonicalProspectBadgeHtml(player, compact = false) {
  const rank = getCanonicalTop100ProspectRank(player);
  if (!rank) return '';
  return `<span class="pi-prospect-rank-badge${compact ? ' pi-prospect-rank-badge--compact' : ''}">Prospect #${rank}</span>`;
}

'''

if 'function getCanonicalTop100ProspectRank(player)' not in game:
    anchor = 'function renderTeamTab('
    idx = game.find(anchor)
    if idx < 0:
        raise SystemExit('renderTeamTab anchor missing')
    game = game[:idx] + helper + game[idx:]

# Main roster rows: add the badge immediately below the name/leadership row.
pattern = re.compile(
    r"(let leadershipBadge = '';\s+"
    r"if \(rosterPlayer\.captain\) \{\s+"
    r"leadershipBadge = '<span class=\\?\"tp-roster-leadership-badge\\?\">C</span>';\s+"
    r"\} else if \(rosterPlayer\.alternateCaptain\) \{\s+"
    r"leadershipBadge = '<span class=\\?\"tp-roster-leadership-badge\\?\">A</span>';\s+"
    r"\})"
)

def add_badge_var(match):
    block = match.group(1)
    if 'prospectBadge' in block:
        return block
    return block + "\n\n      const prospectBadge =\n        getCanonicalProspectBadgeHtml(rosterPlayer);"

game, count_vars = pattern.subn(add_badge_var, game)
if count_vars < 1 and 'const prospectBadge =' not in game:
    raise SystemExit('roster leadership blocks not found')

# Insert the main-row badge between name wrapper and OVR. This occurs in both
# the live Team tab renderer and the cloned Team Profile renderer path.
old_main = '''          ${leadershipBadge}
        </span>

        <span class="tp-roster-player-ovr">'''
new_main = '''          ${leadershipBadge}
        </span>

        ${prospectBadge}

        <span class="tp-roster-player-ovr">'''
main_count = game.count(old_main)
if main_count:
    game = game.replace(old_main, new_main)
elif '${prospectBadge}' not in game:
    raise SystemExit('main roster HTML anchor missing')

# Career-player rows are rendered separately. They must use the same saved
# board, including when the career player itself reaches the Top 100.
career_anchor = '''        <span class="tp-roster-player-ovr">
            ${playerOverall} OVR'''
career_insert = '''        ${getCanonicalProspectBadgeHtml({
          ...Game.player,
          playerId:
            WorldEngine.state?.player?.playerId ||
            WorldEngine.state?.player?.id ||
            Game.player?.playerId ||
            Game.player?.id ||
            'career-player',
          isCareerPlayer: true,
        })}

        <span class="tp-roster-player-ovr">
            ${playerOverall} OVR'''
career_count = game.count(career_anchor)
if career_count:
    game = game.replace(career_anchor, career_insert)

# Compact lineup/special-teams cards: resolve directly from the player object.
# These are presentation-only and do not affect rankings.
compact_old = '''  ${fullName}
  ${leadershipBadge}
</span>'''
compact_new = '''  ${fullName}
  ${leadershipBadge}
  ${getCanonicalProspectBadgeHtml(player, true)}
</span>'''
if compact_old in game:
    game = game.replace(compact_old, compact_new)

css_block = r'''

/* ── Canonical Top-100 prospect rank badges ── */
.pi-prospect-rank-badge {
  display: block;
  width: fit-content;
  margin-top: 2px;
  color: rgba(181, 194, 216, 0.62);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  white-space: nowrap;
}

.pi-prospect-rank-badge--compact {
  display: inline-block;
  margin: 0 0 0 5px;
  font-size: 8px;
  vertical-align: middle;
}
'''

if '/* ── Canonical Top-100 prospect rank badges ── */' not in css:
    css += css_block

GAME.write_text(game, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')

print('CANONICAL_PROSPECT_BADGES=OK')
print('ROSTER_BADGE_BLOCKS=', count_vars)
print('MAIN_HTML_BLOCKS=', main_count)
print('CAREER_HTML_BLOCKS=', career_count)
