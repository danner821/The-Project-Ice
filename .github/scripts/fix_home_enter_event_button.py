from pathlib import Path

# Extract the exact live Schedule/Home/EventSystem action paths so the next patch
# can consolidate behavior without guessing at the monolithic runtime.
path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')
out = Path('.github/home_schedule_action_audit.txt')

sections = []
for label, needle, before, after in [
    ('SCHEDULE_ACTION', "Games should enter their normal pregame event screen first.", 3500, 6500),
    ('BEGIN_EVENT', "const btnBeginEvent", 1000, 7000),
    ('HOME_EVENT_BUTTON', "// ── Event panel button", 1000, 5000),
    ('EVENTSYSTEM_OPEN', "function openEvent(eventId, origin = 'hub', eventData = null)", 500, 5000),
]:
    idx = text.find(needle)
    if idx < 0:
        sections.append(f'### {label}\nNOT FOUND\n')
        continue
    start = max(0, idx - before)
    end = min(len(text), idx + len(needle) + after)
    sections.append(f'### {label}\n{text[start:end]}\n')

out.write_text('\n\n'.join(sections), encoding='utf-8')
print('HOME_SCHEDULE_ACTION_AUDIT=WRITTEN')
