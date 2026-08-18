from pathlib import Path

# Project Ice runtime patch: preserve canonical completion on the current Home date.
path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

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
        isCompleted:
          Boolean(eventData.isCompleted) ||
          i < TODAY_INDEX
      };
"""

if old in text:
    text = text.replace(old, new, 1)
elif 'Boolean(eventData.isCompleted) ||' not in text:
    raise SystemExit('same-day completion anchor not found')

path.write_text(text, encoding='utf-8')
print('SAME_DAY_HOME_COMPLETION_RUNTIME=APPLIED')
