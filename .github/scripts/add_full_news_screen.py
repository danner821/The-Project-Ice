from pathlib import Path
hp=Path('artifacts/project-ice/index.html')
gp=Path('artifacts/project-ice/public/game.js')
sp=Path('artifacts/project-ice/public/style.css')
h=hp.read_text(); g=gp.read_text(); s=sp.read_text()

# Home View All button
old='''              <div class="hub-dash-card__header">\n                <span class="hub-dash-card__title">League News</span>\n              </div>'''
new='''              <div class="hub-dash-card__header">\n                <span class="hub-dash-card__title">League News</span>\n                <button\n                  class="hub-dash-card__action news-view-all-button"\n                  id="btn-hub-view-all-news"\n                  type="button"\n                >\n                  View All ›\n                </button>\n              </div>'''
if old not in h: raise SystemExit('home news header anchor missing')
h=h.replace(old,new,1)

# League View All button
old='''              <section class="league-section" id="league-news-section">\n                <div class="league-section__header">\n                  <div>\n                    <p class="eyebrow">League News</p>\n                    <h3>Around the League</h3>\n                  </div>\n                </div>'''
new='''              <section class="league-section" id="league-news-section">\n                <div class="league-section__header">\n                  <div>\n                    <p class="eyebrow">League News</p>\n                    <h3>Around the League</h3>\n                  </div>\n\n                  <button\n                    class="league-section__action news-view-all-button"\n                    id="btn-league-view-all-news"\n                    type="button"\n                  >\n                    View All\n                  </button>\n                </div>'''
if old not in h: raise SystemExit('league news header anchor missing')
h=h.replace(old,new,1)

# Full-screen overlay before standings screen
anchor='''      <!-- STANDINGS SCREEN -->'''
overlay='''      <!-- FULL NEWS SCREEN -->\n      <section\n        id="full-news-screen"\n        class="full-news-screen"\n        aria-hidden="true"\n      >\n        <header class="full-news-screen__header">\n          <button\n            class="back-button"\n            id="btn-back-full-news"\n            type="button"\n            aria-label="Back to Career Hub"\n          >\n            ‹\n          </button>\n\n          <div>\n            <p class="eyebrow">Living World</p>\n            <h2>League News</h2>\n          </div>\n\n          <span class="full-news-screen__count" id="full-news-count">0</span>\n        </header>\n\n        <div class="full-news-screen__scroll">\n          <div id="full-news-list" class="full-news-list"></div>\n        </div>\n      </section>\n\n'''
if anchor not in h: raise SystemExit('standings marker missing')
if 'id="full-news-screen"' not in h:
    h=h.replace(anchor,overlay+anchor,1)

# JS full feed render/open/close inserted after renderLeagueNewsPreview function block by stable callback marker.
marker='''// Register the hub re-render callback with the World Engine news system.'''
block=r'''
function renderFullNewsScreen() {
  const container = document.getElementById('full-news-list');
  const countEl = document.getElementById('full-news-count');
  if (!container) return;

  const items = NewsSystem.getRecent(100);
  if (countEl) countEl.textContent = String(items.length);

  if (!items.length) {
    container.innerHTML = `
      <div class="full-news-list__empty">
        No league stories yet.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <article class="full-news-item">
      <div class="full-news-item__meta">
        <span class="full-news-item__tag">${item.tag || 'LEAGUE'}</span>
        <span class="full-news-item__date">${item.date || ''}</span>
      </div>
      <strong class="full-news-item__headline">
        ${item.headline || ''}
      </strong>
    </article>
  `).join('');
}

function openFullNewsScreen() {
  const screen = document.getElementById('full-news-screen');
  if (!screen) return;
  renderFullNewsScreen();
  screen.classList.add('is-open');
  screen.setAttribute('aria-hidden', 'false');
  document.body.classList.add('full-news-open');
}

function closeFullNewsScreen() {
  const screen = document.getElementById('full-news-screen');
  if (!screen) return;
  screen.classList.remove('is-open');
  screen.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('full-news-open');
}

['btn-hub-view-all-news', 'btn-league-view-all-news']
  .forEach(id => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', openFullNewsScreen);
  });

const fullNewsBackButton = document.getElementById('btn-back-full-news');
if (fullNewsBackButton) {
  fullNewsBackButton.addEventListener('click', closeFullNewsScreen);
}

'''
if marker not in g: raise SystemExit('news callback marker missing')
if 'function renderFullNewsScreen()' not in g:
    g=g.replace(marker,block+marker,1)

# Refresh full screen too when live news changes.
old='''WorldEngine.news.onNewsChange(() => {\n  renderHubNews();\n  renderLeagueNewsPreview();\n});'''
new='''WorldEngine.news.onNewsChange(() => {\n  renderHubNews();\n  renderLeagueNewsPreview();\n\n  const fullNewsScreen = document.getElementById('full-news-screen');\n  if (fullNewsScreen?.classList.contains('is-open')) {\n    renderFullNewsScreen();\n  }\n});'''
if old not in g: raise SystemExit('news listener anchor missing')
g=g.replace(old,new,1)

css=r'''

/* Full scrollable League News screen */
.news-view-all-button {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.full-news-screen {
  position: fixed;
  inset: 0;
  z-index: 2300000000;
  display: flex;
  flex-direction: column;
  background: #07101d;
  opacity: 0;
  pointer-events: none;
  transform: translateX(8px);
  transition: opacity 160ms ease, transform 160ms ease;
}

.full-news-screen.is-open {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

body.full-news-open {
  overflow: hidden;
}

.full-news-screen__header {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: max(14px, env(safe-area-inset-top)) 16px 13px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(7,16,29,0.98);
}

.full-news-screen__header h2 {
  margin: 2px 0 0;
  font-size: 1.2rem;
}

.full-news-screen__count {
  min-width: 30px;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(87,145,255,0.14);
  color: #a8c8ff;
  font-size: 0.72rem;
  font-weight: 850;
  text-align: center;
}

.full-news-screen__scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 13px 14px calc(24px + env(safe-area-inset-bottom));
}

.full-news-list {
  display: grid;
  gap: 9px;
  max-width: 720px;
  margin: 0 auto;
}

.full-news-item {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.075);
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
}

.full-news-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.full-news-item__tag {
  color: #91bbff;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.full-news-item__date {
  color: rgba(255,255,255,0.4);
  font-size: 0.68rem;
}

.full-news-item__headline {
  color: #f4f7fc;
  font-size: 0.93rem;
  line-height: 1.42;
}

.full-news-list__empty {
  padding: 28px 16px;
  color: rgba(255,255,255,0.45);
  text-align: center;
}
'''
if '/* Full scrollable League News screen */' not in s:
    s += css

hp.write_text(h); gp.write_text(g); sp.write_text(s)
print('added shared full-screen scrollable news feed')
