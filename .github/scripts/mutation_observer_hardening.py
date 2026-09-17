from pathlib import Path

path = Path('artifacts/project-ice/public/travel-season-id-integrity.js')
text = path.read_text(encoding='utf-8')

old = """  const engine = document.getElementById('pi-travel-tournament-engine-loader');\n  if (engine) engine.addEventListener('load', installHooks);\n\n  const observer = new MutationObserver(() => {\n    installHooks();\n    if (\n      typeof WorldEngine.ensureTravelTournamentProgression === 'function' &&\n      typeof WorldEngine.syncCareerTravelSchedule === 'function'\n    ) observer.disconnect();\n  });\n  observer.observe(document.documentElement, { childList: true, subtree: true });\n\n  installHooks();\n"""

new = """  const engine = document.getElementById('pi-travel-tournament-engine-loader');\n  if (engine) {\n    if (engine.dataset.loaded === 'true') installHooks();\n    else engine.addEventListener('load', installHooks, { once: true });\n  }\n\n  /*\n   * travel-hockey-season-ui.js is loaded earlier in the canonical Vite stack\n   * and creates the engine loader synchronously. The previous documentElement\n   * MutationObserver watched every DOM insertion only to discover that known\n   * script. Use the loader lifecycle directly instead.\n   */\n  installHooks();\n"""

if old not in text:
    raise SystemExit('Expected travel observer block was not found; refusing to patch a different runtime shape.')

text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')

# Remove the one-time migration plumbing from the finished commit.
Path('.github/scripts/mutation_observer_hardening.py').unlink(missing_ok=True)
Path('.github/workflows/mutation-observer-hardening.yml').unlink(missing_ok=True)
