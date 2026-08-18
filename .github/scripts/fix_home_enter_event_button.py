from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

# Home's weekly renderer must preserve the canonical event completion state
# even when the completed event is still on the career's current date.
old = "        isCompleted: i < TODAY_INDEX"
new = """        isCompleted:
          Boolean(eventData.isCompleted) ||
          i < TODAY_INDEX"""

if old in text:
    text = text.replace(old, new, 1)
elif 'Boolean(eventData.isCompleted) ||' not in text:
    raise SystemExit('Home same-day completion anchor not found')

path.write_text(text, encoding='utf-8')
print('HOME_SAME_DAY_COMPLETION=APPLIED')
