'use strict';

/* global WorldEngine, EventSystem */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;

  const STYLE_ID = 'pi-postseason-event-polish-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #event-screen.pi-playoff-game-screen .pi-playoff-game-context {
        margin:12px 0 0;
        padding:7px 12px;
        max-width:100%;
        font-size:9px;
        letter-spacing:.085em;
      }
      #event-screen.pi-playoff-game-screen .pi-playoff-event-details {
        margin:18px 0 20px;
        padding:0 16px;
        border-radius:16px;
        background:rgba(16,41,69,.24);
        box-shadow:0 12px 30px rgba(0,0,0,.16),inset 0 0 0 1px rgba(104,171,255,.025);
      }
      #event-screen.pi-playoff-game-screen .pi-playoff-event-detail {
        min-height:50px;
        gap:14px;
      }
      #event-screen.pi-playoff-game-screen .pi-playoff-event-detail__label {
        font-size:9px;
        letter-spacing:.14em;
      }
      #event-screen.pi-playoff-game-screen .pi-playoff-event-detail__value {
        font-size:13px;
        line-height:1.25;
      }
      #event-screen.pi-playoff-game-screen h1,
      #event-screen.pi-playoff-game-screen h2,
      #event-screen.pi-playoff-game-screen h3 {
        letter-spacing:-.025em;
      }
      #event-screen.pi-playoff-game-screen #btn-ev-begin {
        margin-top:4px;
      }
    `;
    document.head.appendChild(style);
  }

  function resolveCanonical(event, eventId) {
    if (typeof WorldEngine.resolveCanonicalScheduleEvent === 'function') {
      return WorldEngine.resolveCanonicalScheduleEvent(event, eventId);
    }
    return event;
  }

  function polishEventScreen(event) {
    const type = String(event?.type || event?.eventType || '').toLowerCase();
    if (event?.isPlayoff !== true || type !== 'game') return;

    const root = document.getElementById('event-screen');
    if (!root || !root.classList.contains('pi-playoff-game-screen')) return;

    const title = [...root.querySelectorAll('h1,h2,h3')].find(node =>
      /round one|semifinal|championship|playoff/i.test(String(node.textContent || ''))
    );
    const context = root.querySelector('.pi-playoff-game-context');

    if (title && context && title.parentElement && context.parentElement === title.parentElement) {
      const titleRow = title.parentElement;
      titleRow.insertAdjacentElement('afterend', context);
    }

    const details = root.querySelector('.pi-playoff-event-details');
    if (details) {
      const rows = [...details.querySelectorAll('.pi-playoff-event-detail')];
      for (const row of rows) {
        const label = row.querySelector('.pi-playoff-event-detail__label');
        const value = row.querySelector('.pi-playoff-event-detail__value');
        if (String(label?.textContent || '').trim().toLowerCase() === 'venue' &&
            /^tbd$/i.test(String(value?.textContent || '').trim())) {
          row.remove();
        }
      }
    }
  }

  injectStyles();

  const originalOpenEvent = EventSystem.openEvent?.bind(EventSystem);
  if (!originalOpenEvent) return;

  EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
    const canonical = resolveCanonical(eventData, eventId);
    const result = originalOpenEvent(eventId, origin, eventData);
    window.requestAnimationFrame(() => polishEventScreen(canonical));
    return result;
  };
})();
