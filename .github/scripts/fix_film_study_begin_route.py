from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
text = GAME.read_text(encoding='utf-8')

dedicated = """    /*
     * Existing tryout and future dedicated event routes.
     */
    if (
      def.completeScreen &&
      COMPLETE_SCREENS[
        def.completeScreen
      ]
    ) {
      COMPLETE_SCREENS[
        def.completeScreen
      ]();

      return;
    }

"""

anchor = """    /*
     * Canonical Practice completion.
     */
"""

if text.count(dedicated) != 1:
    raise SystemExit(f'Expected exactly one dedicated-route block, found {text.count(dedicated)}')
if text.count(anchor) != 1:
    raise SystemExit(f'Expected exactly one generic completion anchor, found {text.count(anchor)}')

# Dedicated screens are routing decisions, not completion handlers. They must
# run before generic type-based completion; otherwise a Film Study event that
# retains canonical type "recovery" gets completed immediately as Recovery.
text = text.replace(dedicated, '', 1)
text = text.replace(anchor, dedicated + anchor, 1)
GAME.write_text(text, encoding='utf-8')

# Clean up temporary inspection/fix plumbing in the same functional commit.
Path('.github/workflows/inspect-film-study-begin.yml').unlink(missing_ok=True)
Path('.github/scripts/fix_film_study_begin_route.py').unlink(missing_ok=True)
Path('.github/workflows/fix-film-study-begin-route.yml').unlink(missing_ok=True)
