from pathlib import Path

style_path = Path('artifacts/project-ice/public/style.css')
style = style_path.read_text(encoding='utf-8')
marker = '/* PROJECT ICE — HOME WEEK CALENDAR EDGE FIX 2026-08-18 */'

if marker not in style:
    style += f'''\n\n{marker}\n/* Keep the Home week scroller inside the Home content column.\n   The shared calendar strip intentionally bleeds 20px past its parent, but\n   on the refreshed Home palette that exposes a different background at both\n   viewport edges. Home should retain horizontal scrolling without that bleed. */\n#hub-tab-home .home-week-card .hub-cal__strip {{\n  margin-left: 0;\n  margin-right: 0;\n  padding-left: 2px;\n  padding-right: 2px;\n  scroll-padding-inline: 2px;\n}}\n'''
    style_path.write_text(style, encoding='utf-8')
    print('HOME_WEEK_EDGE_FIX=APPLIED')
else:
    print('HOME_WEEK_EDGE_FIX=ALREADY_PRESENT')
