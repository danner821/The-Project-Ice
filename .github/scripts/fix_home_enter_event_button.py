from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

# Home can enter a future event by simulating up to its date. simulateToDate()
# was hard-coded to reopen blocking player events with origin='schedule', so by
# the time Event Results opened, EventSystem.getOrigin() correctly reported
# 'schedule' even though the player had launched from Home. Make the simulation
# path origin-aware instead of trying to repair the origin after completion.

old_signature = """function simulateToDate(
  targetDate
) {
"""
new_signature = """function simulateToDate(
  targetDate,
  origin = 'schedule'
) {
"""
if old_signature not in text:
    raise SystemExit('simulateToDate signature anchor not found')
text = text.replace(old_signature, new_signature, 1)

old_blocking_route = """      EventSystem.openEvent(
        blockingScheduleEvent.eventId,
        'schedule',
        blockingScheduleEvent
      );
"""
new_blocking_route = """      EventSystem.openEvent(
        blockingScheduleEvent.eventId,
        origin,
        blockingScheduleEvent
      );
"""
if old_blocking_route not in text:
    raise SystemExit('blocking event origin route anchor not found')
text = text.replace(old_blocking_route, new_blocking_route, 1)

# Only the Home weekly snapshot needs to override the default. Schedule callers
# keep the default 'schedule' origin automatically.
home_start = text.find('// ── Event panel button')
home_end = text.find('// Scroll completed card', home_start)
if home_start < 0 or home_end < 0:
    raise SystemExit('Home event action block not found')
home_block = text[home_start:home_end]
old_home_sim = "simulateToDate(d.date);"
new_home_sim = "simulateToDate(d.date, 'hub');"
if old_home_sim not in home_block:
    raise SystemExit('Home simulateToDate call not found')
home_block = home_block.replace(old_home_sim, new_home_sim, 1)
text = text[:home_start] + home_block + text[home_end:]

path.write_text(text, encoding='utf-8')
print('HOME_SIMULATION_ORIGIN=APPLIED')
