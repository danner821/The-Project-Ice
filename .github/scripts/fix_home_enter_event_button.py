from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text(encoding='utf-8')

old = """  // ── Event panel button ────────────────────────────────────
  if (epBtn) {
    epBtn.addEventListener('click', () => {
      const selectedIndex = [...cards].findIndex(c => c.classList.contains('hub-cal-card--selected'));
      const selectedCard = cards[selectedIndex];
      const d = selectedCard?.eventData;

      if (!d) return;
      const isFuture    = selectedIndex > TODAY_INDEX;
      const isCompleted = Boolean(d.isCompleted);

      if (isCompleted) {
        if (d.eventId === 'tryout-freshman') {
          openTryoutSummary('history');
          return;
        }

          EventSystem.openEvent(d.eventId, 'hub');
          return;
      } else if (isFuture) {
        const nextDate = simulateToDate(d.date);

        if (epToast) {
          epToast.hidden = false;
          epToast.textContent = `Advanced to ${nextDate}`;
        }

        refreshCareerUI();
      } else {
        // Enter the event via the Event System
        const selectedCard = cards[selectedIndex];
        const selectedEvent = selectedCard?.eventData;

        if (!selectedEvent?.eventId) return;

        EventSystem.openEvent(selectedEvent.eventId, 'hub');
      }
    });
  }
"""

new = """  // ── Event panel button ────────────────────────────────────
  // setupHubCalendar() is called repeatedly as the career UI refreshes.
  // Use one replaceable click handler rather than stacking listeners on the
  // persistent Home button, and pass the selected schedule payload through to
  // EventSystem so Home opens the exact same event definition shown in the card.
  if (epBtn) {
    epBtn.onclick = () => {
      const selectedIndex = [...cards].findIndex(c =>
        c.classList.contains('hub-cal-card--selected')
      );
      const selectedCard = cards[selectedIndex];
      const d = selectedCard?.eventData;

      if (!d) return;

      const isFuture = selectedIndex > TODAY_INDEX;
      const isCompleted = Boolean(d.isCompleted);

      if (isCompleted) {
        if (d.eventId === 'tryout-freshman') {
          openTryoutSummary('history');
          return;
        }

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

if old not in text:
    raise SystemExit('Home event button block not found; refusing unsafe patch')

path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('HOME_ENTER_EVENT_BUTTON_FIX=APPLIED')
