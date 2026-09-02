from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
text = GAME.read_text()


def replace_once(old, new, label):
    global text
    if old not in text:
        raise SystemExit(f'Missing expected block: {label}')
    text = text.replace(old, new, 1)

# 1) Give Travel calendar events the same native game pill class used by HS games.
# Keep type='travel-game'; this is presentation-only and does not merge result pipelines.
replace_once(
"""    schedule-day-event--${event.type}\n    ${!isScheduleCalendarGame(event) ? 'schedule-day-event--icon-only' : ''}""",
"""    schedule-day-event--${event.type}\n    ${isScheduleCalendarGame(event) ? 'schedule-day-event--game' : ''}\n    ${!isScheduleCalendarGame(event) ? 'schedule-day-event--icon-only' : ''}""",
'native game pill class for Travel games'
)

# 2) Store a compact, natural Home-week-card label for Travel games while
# keeping the full label for Schedule selected-day/details presentation.
short_anchor = """        shortLabel: isHome\n          ? `vs ${opponentAbbreviation}`\n          : `@ ${opponentAbbreviation}`,"""
short_new = """        shortLabel: isHome\n          ? `vs ${opponentAbbreviation}`\n          : `@ ${opponentAbbreviation}`,\n        homeCardLabel: isTravelGame\n          ? `${isHome ? 'vs' : 'at'} ${String(opponentName || 'Opponent').replace(/\\s+(B|A|AA|AAA)$/i, '')}`\n          : null,"""
replace_once(short_anchor, short_new, 'Travel Home compact label')

# 3) Home weekly strip prefers the compact presentation label when supplied.
replace_once(
"""            event:\n              scheduledEvent.label || 'Open Day',""",
"""            event:\n              scheduledEvent.homeCardLabel ||\n              scheduledEvent.label ||\n              'Open Day',""",
'Home weekly card label preference'
)

GAME.write_text(text)
print('Travel schedule cells now reuse the native game pill class and Home cards use complete compact Travel matchup labels.')
