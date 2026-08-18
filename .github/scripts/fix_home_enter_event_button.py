from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

# Event Results currently always returns to Schedule, even when the event was
# entered from Home. That also leaves the Home week snapshot displaying the
# pre-completion card until another full render happens.
start = text.find("const btnEventResultsContinue =")
if start < 0:
    raise SystemExit('Event Results Continue anchor not found')

route = """      openHubTab(
        'schedule'
      );
"""
route_index = text.find(route, start)
if route_index < 0:
    raise SystemExit('Event Results forced-Schedule route not found')

replacement = """      const returnOrigin =
        EventSystem.getOrigin();

      /*
       * Event Results should return to the surface that launched the event.
       * Home is a weekly view of the canonical Schedule, so refresh that shared
       * schedule data before returning to Home. This immediately converts the
       * just-completed card to DONE and prevents re-entering the event.
       */
      if (returnOrigin === 'hub') {
        refreshScheduleEvents();
        setupHubCalendar();
        openHubTab('home');
      } else {
        openHubTab('schedule');
      }
"""

text = (
    text[:route_index] +
    replacement +
    text[route_index + len(route):]
)

path.write_text(text, encoding='utf-8')
print('EVENT_RESULTS_ORIGIN_AND_HOME_REFRESH=APPLIED')
