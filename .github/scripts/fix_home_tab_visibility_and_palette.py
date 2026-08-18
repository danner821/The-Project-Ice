from pathlib import Path

ROOT = Path('artifacts/project-ice')
style_path = ROOT / 'public/style.css'
style = style_path.read_text(encoding='utf-8')

marker = '/* PROJECT ICE — HOME TAB VISIBILITY + PALETTE FIX 2026-08-18 */'
if marker not in style:
    style += r'''

/* PROJECT ICE — HOME TAB VISIBILITY + PALETTE FIX 2026-08-18 */

/* A hidden hub panel must never occupy scroll space. */
#hub-screen .hub-tab-panel[aria-hidden="true"],
#hub-screen .hub-tab-panel:not(.hub-tab-panel--active) {
  display: none !important;
}

#hub-screen .hub-tab-panel.hub-tab-panel--active[aria-hidden="false"],
#hub-screen .hub-tab-panel.hub-tab-panel--active:not([aria-hidden]) {
  display: flex !important;
}

/* Bring Home back into the brighter blue/navy visual family used elsewhere. */
#hub-screen {
  background:
    radial-gradient(ellipse 92% 48% at 50% 0%, rgba(35, 83, 170, 0.24) 0%, transparent 66%),
    linear-gradient(180deg, #07142f 0%, #08172f 48%, #050d1f 100%);
}

#hub-screen .hub-info-bar--refreshed {
  background:
    linear-gradient(135deg, rgba(18, 48, 92, 0.96), rgba(9, 27, 55, 0.96));
  border-bottom-color: rgba(101, 157, 236, 0.22);
}

#hub-screen .home-objective,
#hub-screen .home-feature-card,
#hub-screen .home-snapshot-card,
#hub-screen .home-dashboard-card,
#hub-screen .home-career-card,
#hub-screen .home-week-card {
  background:
    linear-gradient(145deg, rgba(17, 42, 78, 0.88), rgba(8, 24, 48, 0.92));
  border-color: rgba(104, 160, 235, 0.23);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
}

#hub-screen .home-objective {
  background:
    linear-gradient(145deg, rgba(27, 65, 119, 0.86), rgba(12, 36, 70, 0.94));
}

#hub-screen .home-development-strip,
#hub-screen .home-career-stat,
#hub-screen .hub-event-panel {
  background: rgba(13, 34, 65, 0.82);
  border-color: rgba(104, 160, 235, 0.18);
}

#hub-screen .home-section-kicker,
#hub-screen .home-objective__stage,
#hub-screen .hub-cal__week-label {
  color: rgba(137, 185, 247, 0.86);
}

#hub-screen .home-objective__text,
#hub-screen .home-snapshot-card__detail,
#hub-screen .home-feature-card__content p,
#hub-screen .home-development-strip p {
  color: rgba(194, 213, 239, 0.72);
}
'''

style_path.write_text(style, encoding='utf-8')
print('HOME_TAB_VISIBILITY_PALETTE_FIX=PASS')
