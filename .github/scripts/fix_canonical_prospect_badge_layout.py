from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
CSS = Path('artifacts/project-ice/public/style.css')
game = GAME.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')

# 1) Shared Team/Profile lineup builder. Team Profile explicitly rebuilds its
# cloned roster with buildTeamLineupMarkup(), so this builder must own the badge.
old = '''        <span class="lineup-player__name">\n          ${fullName}\n          ${getLeadershipBadge(player)}\n        </span>\n\n        <span class="lineup-player__overall">\n          ${overall} OVR\n        </span>'''
new = '''        <span class="lineup-player__identity">\n          <span class="lineup-player__name">\n            ${fullName}\n            ${getLeadershipBadge(player)}\n          </span>\n          ${getCanonicalProspectBadgeHtml(player)}\n        </span>\n\n        <span class="lineup-player__overall">\n          ${overall} OVR\n        </span>'''
if old not in game:
    raise SystemExit('shared lineup player-card anchor missing')
game = game.replace(old, new, 1)

# 2) Shared special-teams builder uses the same visual identity contract.
old = '''        <span class="lineup-player__name">\n          ${fullName}\n          ${getLeadershipBadge(player)}\n        </span>\n\n        <span class="lineup-player__overall">\n          ${overall} OVR\n        </span>'''
new = '''        <span class="lineup-player__identity">\n          <span class="lineup-player__name">\n            ${fullName}\n            ${getLeadershipBadge(player)}\n          </span>\n          ${getCanonicalProspectBadgeHtml(player)}\n        </span>\n\n        <span class="lineup-player__overall">\n          ${overall} OVR\n        </span>'''
if old not in game:
    raise SystemExit('special-teams player-card anchor missing')
game = game.replace(old, new, 1)

# 3) Current Team-tab lineup renderer had the badge inside the nowrap name span,
# which caused the visible ellipses. Give name + badge a vertical identity owner.
old = '''          <span class="lineup-player__position">${position}</span>\n          <span class="lineup-player__name">\n  ${fullName}\n  ${leadershipBadge}\n  ${getCanonicalProspectBadgeHtml(player, true)}\n</span>\n          <span class="lineup-player__overall">${overall} OVR</span>'''
new = '''          <span class="lineup-player__position">${position}</span>\n          <span class="lineup-player__identity">\n            <span class="lineup-player__name">\n              ${fullName}\n              ${leadershipBadge}\n            </span>\n            ${getCanonicalProspectBadgeHtml(player)}\n          </span>\n          <span class="lineup-player__overall">${overall} OVR</span>'''
if old not in game:
    raise SystemExit('Team-tab player-card badge anchor missing')
game = game.replace(old, new, 1)

# 4) Legacy roster-row renderer can still be used by older/static profile paths.
# Keep its name/leadership and prospect label together vertically, with OVR separate.
old = '''        <span class="tp-roster-player-name-wrap">\n          <button\n            class="tp-player-link"\n            data-player-id="${rosterPlayer.id}"\n            type="button"\n          >\n            ${fullName}\n          </button>\n\n          ${leadershipBadge}\n        </span>\n\n        ${prospectBadge}\n\n        <span class="tp-roster-player-ovr">'''
new = '''        <span class="tp-roster-player-info">\n          <span class="tp-roster-player-name-wrap">\n            <button\n              class="tp-player-link"\n              data-player-id="${rosterPlayer.id}"\n              type="button"\n            >\n              ${fullName}\n            </button>\n\n            ${leadershipBadge}\n          </span>\n          ${prospectBadge}\n        </span>\n\n        <span class="tp-roster-player-ovr">'''
if old not in game:
    raise SystemExit('legacy roster player info anchor missing')
game = game.replace(old, new, 1)

# Career row uses the same legacy layout contract.
old = '''          <span class="tp-roster-player-name-wrap">\n            <button\n              class="tp-player-link"\n              data-player-id="career-player"\n              type="button"\n            >\n              ${playerName}\n            </button>\n          </span>\n\n          ${getCanonicalProspectBadgeHtml({'''
new = '''          <span class="tp-roster-player-info">\n            <span class="tp-roster-player-name-wrap">\n              <button\n                class="tp-player-link"\n                data-player-id="career-player"\n                type="button"\n              >\n                ${playerName}\n              </button>\n            </span>\n\n            ${getCanonicalProspectBadgeHtml({'''
if old not in game:
    raise SystemExit('career legacy identity start anchor missing')
game = game.replace(old, new, 1)
old = '''          isCareerPlayer: true,\n        })}\n\n        <span class="tp-roster-player-ovr">'''
new = '''          isCareerPlayer: true,\n        })}\n          </span>\n\n        <span class="tp-roster-player-ovr">'''
if old not in game:
    raise SystemExit('career legacy identity close anchor missing')
game = game.replace(old, new, 1)

# 5) Layout CSS: badge is a second line beneath the name and cannot consume the
# single-line name's horizontal width. This applies to Team and cloned Team Profile.
css_block = r'''

/* ── Canonical player identity stack: name, then prospect rank ── */
.lineup-player__identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  gap: 2px;
}

.lineup-player__identity > .lineup-player__name {
  width: 100%;
  min-width: 0;
}

.lineup-player__identity > .pi-prospect-rank-badge {
  display: block;
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tp-roster-player-info {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: 2px;
}

.tp-roster-player-info > .tp-roster-player-name-wrap {
  max-width: 100%;
}

.tp-roster-player-info > .pi-prospect-rank-badge {
  margin: 0;
}
'''
if '/* ── Canonical player identity stack: name, then prospect rank ── */' not in css:
    css += css_block

GAME.write_text(game, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
print('CANONICAL_PROSPECT_BADGE_LAYOUT=OK')
