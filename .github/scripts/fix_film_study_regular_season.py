from pathlib import Path

ROOT = Path('artifacts/project-ice')
PUBLIC = ROOT / 'public'

# 1) Give Film Study one explicit runtime owner in Vite, after the next-season
# transition runtime exists and before calendar projection renders the schedule.
vite_path = ROOT / 'vite.config.ts'
vite = vite_path.read_text(encoding='utf-8')
anchor = "    if (!html.includes('/high-school-next-season-transition.js')) scripts.push('    <script src=\"/high-school-next-season-transition.js\"></script>');\n"
film_line = "    if (!html.includes('/film-study-event.js')) scripts.push('    <script src=\"/film-study-event.js\"></script>');\n"
if film_line not in vite:
    if anchor not in vite:
        raise SystemExit('Vite Film Study insertion anchor not found')
    vite = vite.replace(anchor, anchor + film_line, 1)
vite_path.write_text(vite, encoding='utf-8')

# 2) Make the Film Study runtime recognize all canonical Recovery aliases,
# normalize existing saves on boot, and normalize every newly generated HS
# schedule at its source boundary so later years cannot recreate Recovery.
film_path = PUBLIC / 'film-study-event.js'
film = film_path.read_text(encoding='utf-8')

old_guard = """  function normalizeFilmStudyEvent(event) {\n    if (!event || String(event.type || event.eventType || '').toLowerCase() !== 'recovery') return false;\n    let changed = false;\n"""
new_guard = """  function normalizeFilmStudyEvent(event) {\n    if (!event) return false;\n    const identifiers = [event.type, event.eventType, event.eventKey]\n      .map(value => String(value || '').trim().toLowerCase());\n    const isRecovery = identifiers.some(value => value === 'recovery' || value === 'recovery-sleep');\n    if (!isRecovery) return false;\n    let changed = false;\n"""
if old_guard not in film:
    raise SystemExit('Film Study normalization guard anchor not found')
film = film.replace(old_guard, new_guard, 1)

old_boot = """  normalizeCatalog();\n  normalizeSchedule({ save: true });\n  if (typeof COMPLETE_SCREENS !== 'undefined') COMPLETE_SCREENS['film-study'] = openFilmStudy;\n  WorldEngine.syncFilmStudyEvents = normalizeSchedule;\n  window.ProjectIceFilmStudy = { open: openFilmStudy, sync: normalizeSchedule };\n})();\n"""
new_boot = """  normalizeCatalog();\n\n  /*\n   * Canonical schedule boundary: every regular-season schedule generated for\n   * a fresh or returning HS year leaves WorldEngine already expressed as Film\n   * Study instead of relying on a later UI repaint to rename Recovery.\n   */\n  const originalCreateHighSchoolCareerSchedule =\n    typeof WorldEngine.createHighSchoolCareerSchedule === 'function'\n      ? WorldEngine.createHighSchoolCareerSchedule.bind(WorldEngine)\n      : null;\n\n  if (originalCreateHighSchoolCareerSchedule && !WorldEngine.__filmStudyScheduleFactoryWrapped) {\n    WorldEngine.createHighSchoolCareerSchedule = (...args) => {\n      const schedule = originalCreateHighSchoolCareerSchedule(...args);\n      if (Array.isArray(schedule)) {\n        for (const event of schedule) normalizeFilmStudyEvent(event);\n      }\n      return schedule;\n    };\n    WorldEngine.__filmStudyScheduleFactoryWrapped = true;\n  }\n\n  normalizeSchedule({ save: true });\n\n  /* Returning-year transitions rebuild the schedule in-place during the same\n   * browser session. Reconcile immediately from the lifecycle event instead of\n   * waiting for a refresh or polling loop. */\n  window.addEventListener('projectice:next-high-school-season-started', () => {\n    normalizeSchedule({ save: true });\n  });\n\n  if (typeof COMPLETE_SCREENS !== 'undefined') COMPLETE_SCREENS['film-study'] = openFilmStudy;\n  WorldEngine.syncFilmStudyEvents = normalizeSchedule;\n  window.ProjectIceFilmStudy = { open: openFilmStudy, sync: normalizeSchedule };\n})();\n"""
if old_boot not in film:
    raise SystemExit('Film Study boot anchor not found')
film = film.replace(old_boot, new_boot, 1)
film_path.write_text(film, encoding='utf-8')

# 3) Remove the old dynamic loader from postseason-cadence. Film Study now has
# one explicit Vite owner and postseason only owns postseason cadence.
post_path = PUBLIC / 'postseason-cadence.js'
post = post_path.read_text(encoding='utf-8')
old_loader = """\n  /*\n   * Film Study is the player-facing replacement for Recovery. This cadence\n   * module is part of every career boot already, so load the focused runtime\n   * once without adding another Vite ownership layer.\n   */\n  if (!document.getElementById('pi-film-study-runtime')) {\n    const script = document.createElement('script');\n    script.id = 'pi-film-study-runtime';\n    script.src = '/film-study-event.js';\n    script.defer = true;\n    document.head.appendChild(script);\n  }\n"""
if old_loader not in post:
    raise SystemExit('Postseason dynamic Film Study loader anchor not found')
post = post.replace(old_loader, '\n', 1)
post_path.write_text(post, encoding='utf-8')

# Remove the one-time migration plumbing from the finished runtime commit.
Path('.github/scripts/fix_film_study_regular_season.py').unlink(missing_ok=True)
Path('.github/workflows/fix-film-study-regular-season.yml').unlink(missing_ok=True)
