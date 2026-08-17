from pathlib import Path

game = Path('artifacts/project-ice/public/game.js')
style = Path('artifacts/project-ice/public/style.css')

g = game.read_text()
s = style.read_text()

anchor = "  titleScreen.classList.add('screen--hidden');\n  creationScreen.classList.add('screen--hidden');\n"
replacement = "  titleScreen.classList.add('screen--hidden');\n  careerSavesScreen.classList.add('screen--hidden');\n  creationScreen.classList.add('screen--hidden');\n"
if anchor not in g:
    raise SystemExit('showScreen hide anchor missing')
g = g.replace(anchor, replacement, 1)

anchor = "  if (screenName === 'title')      titleScreen.classList.remove('screen--hidden');\n  if (screenName === 'creation')   creationScreen.classList.remove('screen--hidden');\n"
replacement = "  if (screenName === 'title')      titleScreen.classList.remove('screen--hidden');\n  if (screenName === 'career-saves') careerSavesScreen.classList.remove('screen--hidden');\n  if (screenName === 'creation')   creationScreen.classList.remove('screen--hidden');\n"
if anchor not in g:
    raise SystemExit('showScreen reveal anchor missing')
g = g.replace(anchor, replacement, 1)

game.write_text(g)

anchor = "#creation-screen,\n#summary-screen,"
replacement = "#career-saves-screen,\n#creation-screen,\n#summary-screen,"
if anchor not in s:
    raise SystemExit('screen style selector anchor missing')
s = s.replace(anchor, replacement, 1)

extra = """
#career-saves-screen {
  background:
    radial-gradient(ellipse 90% 55% at 50% 0%, #123476 0%, transparent 65%),
    linear-gradient(180deg, #07142f 0%, #050d1f 55%, #020814 100%);
  justify-content: flex-start;
  align-items: stretch;
  overflow-y: auto;
  padding-left: 20px;
  padding-right: 20px;
}

#career-saves-screen .career-saves-content {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}
"""
marker = "/* ── Multi-career save selection ───────────────────────────── */\n"
if marker not in s:
    raise SystemExit('career save style marker missing')
s = s.replace(marker, marker + extra, 1)

style.write_text(s)
print('fixed career saves screen navigation and layout')
