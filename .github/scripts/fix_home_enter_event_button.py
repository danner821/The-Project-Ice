from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

# 1) Home must retain the full canonical schedule event. The previous Home
# projection dropped type/label/gameId/result/etc., causing EventSystem to fall
# back to a generic Upcoming Event and breaking Begin Event routing.
old_event_data = """      const eventData = scheduledEvent
        ? {
            icon: scheduledEvent.icon || '📅',
            event:
              scheduledEvent.label || 'Open Day',
            location:
              scheduledEvent.location || '—',
            objective:
              scheduledEvent.objective ||
              'No scheduled activities.',
            eventId:
              scheduledEvent.eventId || 'open-day',
            summaryScreen:
              scheduledEvent.summaryScreen,
            isCompleted:
              Boolean(scheduledEvent.isCompleted),
          }
        : templateDay;
"""
new_event_data = """      const eventData = scheduledEvent
        ? {
            // Keep the entire canonical schedule record. Home is only a weekly
            // view of Schedule; it must never manufacture a second event shape.
            ...scheduledEvent,
            icon: scheduledEvent.icon || '📅',
            event:
              scheduledEvent.label ||
              scheduledEvent.title ||
              'Open Day',
            label:
              scheduledEvent.label ||
              scheduledEvent.title ||
              'Open Day',
            location:
              scheduledEvent.location || '—',
            objective:
              scheduledEvent.objective ||
              'No scheduled activities.',
            eventId:
              scheduledEvent.eventId || 'open-day',
            isCompleted:
              Boolean(scheduledEvent.isCompleted),
          }
        : templateDay;
"""
if old_event_data not in text:
    raise SystemExit('Canonical Home event-data projection anchor not found')
text = text.replace(old_event_data, new_event_data, 1)

# 2) Make the Home action semantics mirror Schedule: completed records reopen
# their saved summary/results, future games enter the normal game event flow,
# future non-games advance through simulateToDate, and current events open the
# same EventSystem screen using the same canonical schedule record.
start = text.find('  // ── Event panel button ────────────────────────────────────')
end = text.find('  // Scroll completed card into view, then settle on today', start)
if start < 0 or end < 0:
    raise SystemExit('Home event-action block anchors not found')

new_action = """  // ── Event panel button ────────────────────────────────────
  // Home and Schedule are two views over the same canonical schedule. Keep one
  // replaceable handler here, but use the exact same saved event record and the
  // same underlying Schedule/EventSystem result routes.
  if (epBtn) {
    epBtn.onclick = () => {
      const selectedIndex = [...cards].findIndex(c =>
        c.classList.contains('hub-cal-card--selected')
      );
      const d = cards[selectedIndex]?.eventData;

      if (!d) return;

      const isFuture = selectedIndex > TODAY_INDEX;
      const isCompleted = Boolean(d.isCompleted);

      if (isCompleted) {
        if (d.type === 'game') {
          const completedGameId =
            d.gameId ||
            d.id ||
            d.eventId ||
            null;

          if (completedGameId && openPostgameSummary(completedGameId)) {
            return;
          }
        }

        if (
          d.type !== 'game' &&
          d.result &&
          typeof d.result === 'object'
        ) {
          EventResultsSystem.open(d, {
            success: true,
            result: d.result,
            date: d.completedAt || d.date,
            coachNote: d.result?.coachNote || '',
          });
          return;
        }

        if (d.summaryScreen === 'tryout-summary') {
          openTryoutSummary('history');
          return;
        }

        if (d.eventId) {
          EventSystem.openEvent(d.eventId, 'hub', d);
        }
        return;
      }

      // Schedule treats a future game specially: enter its normal event/pregame
      // path instead of simulating through it. Home must do the same.
      if (isFuture && d.type === 'game') {
        if (d.eventId) {
          EventSystem.openEvent(d.eventId, 'hub', d);
        }
        return;
      }

      if (isFuture) {
        const nextDate = simulateToDate(d.date);

        if (epToast) {
          epToast.hidden = false;
          epToast.textContent = `Advanced to ${nextDate}`;
        }

        refreshCareerUI();
        return;
      }

      if (!d.eventId) return;

      EventSystem.openEvent(d.eventId, 'hub', d);
    };
  }

"""
text = text[:start] + new_action + text[end:]

path.write_text(text, encoding='utf-8')
print('HOME_SCHEDULE_CANONICAL_LINK=APPLIED')
