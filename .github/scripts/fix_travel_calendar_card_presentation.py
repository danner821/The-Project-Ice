from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
text = GAME.read_text()


def replace_once(old, new, label):
    global text
    if old not in text:
        raise SystemExit(f'Missing expected block: {label}')
    text = text.replace(old, new, 1)

# Presentation-only helper. Travel games must look like games in the calendar,
# while remaining type='travel-game' so they cannot fall into the HS sim/result pipeline.
anchor = "function renderScheduleCalendar(year, month) {"
helper = """function isScheduleCalendarGame(event = {}) {\n  return (\n    event?.type === 'game' ||\n    event?.type === 'travel-game' ||\n    event?.travelTournament === true\n  );\n}\nfunction renderScheduleCalendar(year, month) {"""
replace_once(anchor, helper, 'calendar game presentation helper')

replace_once(
"""  event.type === 'game'\n    ? `""",
"""  isScheduleCalendarGame(event)\n    ? `""",
'calendar game icon condition'
)

replace_once(
"""    ${event.type !== 'game' ? 'schedule-day-event--icon-only' : ''}""",
"""    ${!isScheduleCalendarGame(event) ? 'schedule-day-event--icon-only' : ''}""",
'calendar icon-only class condition'
)

replace_once(
"""    event.type === 'game'\n      ? `""",
"""    isScheduleCalendarGame(event)\n      ? `""",
'calendar matchup card condition'
)

replace_once(
"""    selectedEvent.type === 'game'\n      ? ''""",
"""    isScheduleCalendarGame(selectedEvent)\n      ? ''""",
'selected-day game detail condition'
)

GAME.write_text(text)
print('Travel calendar games now use the native game-card presentation without changing their travel-game type.')
