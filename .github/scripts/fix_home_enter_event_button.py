from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

# Home's weekly renderer was overwriting the canonical event's completion flag
# with a purely date-based value (`i < TODAY_INDEX`). That meant an event
# completed on the current day stayed visually active until the player advanced
# the calendar, even though WorldEngine had already marked it completed.
old = """      const d = {
        ...eventData,
        dateKey,
        day: date.toLocaleDateString('en-US', {
          weekday: 'short'
        }),
        dateNumber: date.getDate(),
        isToday: i === TODAY_INDEX,
        isCompleted: i < TODAY_INDEX
      };
"""

new = """      const d = {
        ...eventData,
        dateKey,
        day: date.toLocaleDateString('en-US', {
          weekday: 'short'
        }),
        dateNumber: date.getDate(),
        isToday: i === TODAY_INDEX,
        // Preserve the canonical schedule completion state immediately. Past
        // dates still render as done, but a just-completed event on TODAY no
        // longer has its true completion flag overwritten by the date index.
        isCompleted:
          Boolean(eventData.isCompleted) ||
          i < TODAY_INDEX
      };
"""

if old not in text:
    raise SystemExit('Home day completion projection anchor not found')

text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('HOME_SAME_DAY_COMPLETION=APPLIED')
