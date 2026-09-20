from pathlib import Path

ROOT = Path('artifacts/project-ice')
game_path = ROOT / 'public' / 'game.js'
css_path = ROOT / 'public' / 'style.css'

game = game_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

replacements = [
("""          <span class="lineup-player__name">
            ${fullName}
            ${getLeadershipBadge(player)}
          </span>""",
 """          <span class="lineup-player__name">
            <span class="lineup-player__name-text">${fullName}</span>
            ${getLeadershipBadge(player)}
          </span>"""),
("""          <span class="lineup-player__name">
            ${fullName}
            ${getLeadershipBadge(player)}
          </span>""",
 """          <span class="lineup-player__name">
            <span class="lineup-player__name-text">${fullName}</span>
            ${getLeadershipBadge(player)}
          </span>"""),
("""            <span class="lineup-player__name">
              ${fullName}
              ${leadershipBadge}
            </span>""",
 """            <span class="lineup-player__name">
              <span class="lineup-player__name-text">${fullName}</span>
              ${leadershipBadge}
            </span>"""),
]

changed = 0
for old, new in replacements:
    if old in game:
        game = game.replace(old, new, 1)
        changed += 1

if changed < 3:
    raise SystemExit(f'Expected 3 lineup name/leadership replacements, got {changed}')

css_block = r"""

/* Leadership badges must never be ellipsized by long lineup names. */
.lineup-player__name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}

.lineup-player__name-text {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lineup-player__name > .tp-roster-leadership-badge,
.lineup-player__name > .lineup-player__leadership {
  flex: 0 0 auto;
}
"""

if 'Leadership badges must never be ellipsized by long lineup names.' not in css:
    css += css_block

game_path.write_text(game, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')

Path('.github/scripts/fix_lineup_leadership_badge_overflow.py').unlink(missing_ok=True)
Path('.github/workflows/fix-lineup-leadership-badge-overflow.yml').unlink(missing_ok=True)
