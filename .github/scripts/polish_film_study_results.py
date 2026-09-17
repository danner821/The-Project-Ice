from pathlib import Path

film_path = Path('artifacts/project-ice/public/film-study-event.js')
film = film_path.read_text(encoding='utf-8')

# 1) Center choice emojis. The generic descendant span rule was overriding
# display:grid on the icon span, which is why the emoji sat high/left.
old_css = ".pi-film-study__icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:rgba(76,119,201,.13);font-size:20px}"
new_css = ".pi-film-study__choice .pi-film-study__icon{width:40px;height:40px;display:grid;place-items:center;text-align:center;line-height:1;border-radius:12px;background:rgba(76,119,201,.13);font-size:20px}"
if old_css not in film:
    raise SystemExit('Film Study icon CSS anchor not found')
film = film.replace(old_css, new_css, 1)

# 2) Film Study must not inherit Recovery's morale/health behavior. Complete the
# canonical blocking event locally, apply only focused attribute XP, and keep
# the season lifecycle bookkeeping Recovery previously supplied.
old_block = """        const eventId = event.eventId || event.id;\n        const base = WorldEngine.completeRecoveryEvent?.(eventId, { save: false }) || { success: true, applied: false };\n        const totalXP = applyFocusXP(player, choice, event);\n        event.completed = true; event.isCompleted = true; event.played = true; event.status = 'completed';\n        event.filmStudyFocus = choice.key; event.filmStudyFocusLabel = choice.title; event.filmStudyRewards = { ...choice.rewards };\n        await WorldEngine.save?.();\n        root.remove();\n        refreshCareerUI?.();\n        const result = {\n          ...(base?.result && typeof base.result === 'object' ? base.result : base),\n          success: true, eventType: 'film-study', focus: choice.key, focusLabel: choice.title,\n          xp: { ...((base?.result?.xp || base?.xp) || {}), attributes: { ...choice.rewards }, general: totalXP },\n          coachNote: `Film review complete: ${choice.title}.`,\n        };\n        if (typeof EventResultsSystem !== 'undefined' && EventResultsSystem?.open) {\n          EventResultsSystem.open(event, { success: true, result, date: event.date, coachNote: result.coachNote });\n        } else {\n"""
new_block = """        const eventId = event.eventId || event.id;\n        const totalXP = applyFocusXP(player, choice, event);\n\n        event.completed = true;\n        event.isCompleted = true;\n        event.played = true;\n        event.status = 'completed';\n        event.completedAt = event.date;\n        event.filmStudyFocus = choice.key;\n        event.filmStudyFocusLabel = choice.title;\n        event.filmStudyRewards = { ...choice.rewards };\n        event.result = {\n          type: 'film-study',\n          focus: choice.key,\n          focusLabel: choice.title,\n          xp: { attributes: { ...choice.rewards } },\n        };\n\n        const season = WorldEngine.state?.season;\n        if (season && typeof season === 'object') {\n          if (!Array.isArray(season.processedDates)) season.processedDates = [];\n          if (event.date && !season.processedDates.includes(event.date)) {\n            season.processedDates.push(event.date);\n            season.processedDates.sort((a, b) => String(a).localeCompare(String(b)));\n          }\n          if (!Array.isArray(season.completedEventIds)) season.completedEventIds = [];\n          const canonicalId = event.id || event.eventId || event.canonicalEventId || eventId;\n          if (canonicalId && !season.completedEventIds.some(id => String(id) === String(canonicalId))) {\n            season.completedEventIds.push(canonicalId);\n          }\n          season.lastProcessedDate = event.date || season.lastProcessedDate || null;\n          if (event.date) season.currentDate = event.date;\n        }\n        if (WorldEngine.state?.player && event.date) WorldEngine.state.player.currentDate = event.date;\n\n        await WorldEngine.save?.();\n        root.remove();\n        refreshCareerUI?.();\n        const result = {\n          success: true,\n          eventType: 'film-study',\n          focus: choice.key,\n          focusLabel: choice.title,\n          totalXP,\n          xp: { attributes: { ...choice.rewards } },\n          coachNote: `Film review complete: ${choice.title}.`,\n        };\n        const resultEvent = {\n          ...event,\n          type: 'film-study',\n          eventType: 'film-study',\n          eventKey: 'film-study',\n          label: 'Film Study',\n          shortLabel: 'Film Study',\n          icon: '🎥',\n        };\n        if (typeof EventResultsSystem !== 'undefined' && EventResultsSystem?.open) {\n          EventResultsSystem.open(resultEvent, { success: true, result, date: event.date, coachNote: result.coachNote });\n        } else {\n"""
if old_block not in film:
    raise SystemExit('Film Study completion block anchor not found')
film = film.replace(old_block, new_block, 1)
film_path.write_text(film, encoding='utf-8')

# Remove temporary inspection and one-time patch plumbing after this commit.
Path('.github/workflows/inspect-recovery-completion.yml').unlink(missing_ok=True)
Path('.github/workflows/polish-film-study-results.yml').unlink(missing_ok=True)
Path('.github/scripts/polish_film_study_results.py').unlink(missing_ok=True)
