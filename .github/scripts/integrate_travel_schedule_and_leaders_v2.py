from pathlib import Path
import subprocess

GAME = Path('artifacts/project-ice/public/game.js')
text = GAME.read_text()

# The current Home calendar no longer carries summaryScreen in this object.
# Normalize that one block to the shape expected by the integration migration,
# then let the single migration own the actual Travel metadata insertion.
old = """            eventId:
              scheduledEvent.eventId || 'open-day',
            isCompleted:
              Boolean(scheduledEvent.isCompleted),"""
new = """            eventId:
              scheduledEvent.eventId || 'open-day',
            summaryScreen:
              scheduledEvent.summaryScreen,
            isCompleted:
              Boolean(scheduledEvent.isCompleted),"""

if old not in text:
    raise SystemExit('Could not normalize current Home calendar eventData shape')

GAME.write_text(text.replace(old, new, 1))
subprocess.run(['python', '.github/scripts/integrate_travel_schedule_and_leaders.py'], check=True)
print('Travel schedule/leaders integration v2 applied.')
