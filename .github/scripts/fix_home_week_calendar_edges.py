from pathlib import Path

style_path = Path('artifacts/project-ice/public/style.css')
style = style_path.read_text(encoding='utf-8')
edge_marker = '/* PROJECT ICE — HOME WEEK CALENDAR EDGE FIX 2026-08-18 */'
round_marker = '/* PROJECT ICE — HOME WEEK CARD ROUNDING 2026-08-18 */'

changed = False

if edge_marker not in style:
    style += f'''\n\n{edge_marker}\n/* Keep the Home week scroller inside the Home content column.\n   The shared calendar strip intentionally bleeds 20px past its parent, but\n   on the refreshed Home palette that exposes a different background at both\n   viewport edges. Home should retain horizontal scrolling without that bleed. */\n#hub-tab-home .home-week-card .hub-cal__strip {{\n  margin-left: 0;\n  margin-right: 0;\n  padding-left: 2px;\n  padding-right: 2px;\n  scroll-padding-inline: 2px;\n}}\n'''
    changed = True

if round_marker not in style:
    style += f'''\n\n{round_marker}\n/* Match the Home schedule shell to the rounded cards used throughout the hub. */\n#hub-tab-home .home-week-card {{\n  border: 1px solid rgba(104, 158, 228, 0.22);\n  border-radius: 18px;\n  overflow: hidden;\n  padding-top: 14px;\n  background: linear-gradient(180deg, rgba(20, 55, 99, 0.72), rgba(11, 36, 72, 0.76));\n}}\n#hub-tab-home .home-week-card .home-section-heading {{\n  padding-left: 14px;\n  padding-right: 14px;\n}}\n#hub-tab-home .home-week-card .hub-cal__strip {{\n  padding-left: 4px;\n  padding-right: 4px;\n}}\n#hub-tab-home .home-week-card .hub-event-panel {{\n  margin-left: 0;\n  margin-right: 0;\n  border-left: 0;\n  border-right: 0;\n  border-bottom: 0;\n  border-radius: 0;\n}}\n'''
    changed = True

if changed:
    style_path.write_text(style, encoding='utf-8')
    print('HOME_WEEK_CARD_FIX=APPLIED')
else:
    print('HOME_WEEK_CARD_FIX=ALREADY_PRESENT')
