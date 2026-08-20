'use strict';

/* global WorldEngine, simulateToDate */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const actionButton = document.getElementById('schedule-selected-day-action');
  const detailsButton = document.getElementById('schedule-selected-day-details');

  if (!actionButton || !detailsButton) return;

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  function selectedDate() {
    return dateKey(document.querySelector('.schedule-day--selected')?.dataset?.date);
  }

  function currentDate() {
    const world = WorldEngine.state || {};
    return dateKey(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate
    );
  }

  function schedule() {
    return Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];
  }

  function isActive(event) {
    return Boolean(
      event &&
      event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed' &&
      event?.completed !== true &&
      event?.played !== true
    );
  }

  function activeEventOn(date) {
    if (!date) return null;
    return schedule().find(event =>
      dateKey(event?.date) === date && isActive(event)
    ) || null;
  }

  function careerTeamId() {
    const world = WorldEngine.state || {};
    const player = world.player || {};
    const direct = player.teamId || player.highSchoolTeamId || null;
    const playerId = player.playerId || player.id || 'career-player';

    for (const team of world.teams || []) {
      const found = (team?.roster || []).some(skater => {
        const id = skater?.playerId || skater?.id || null;
        return skater?.isCareerPlayer === true ||
          String(id || '') === String(playerId || '') ||
          String(id || '') === 'career-player';
      });
      if (found) return team.teamId || direct;
    }

    return direct;
  }

  function isCareerGame(event) {
    if (event?.type !== 'game') return false;
    const teamId = careerTeamId();
    if (!teamId) return false;
    return String(event.homeTeamId || '') === String(teamId) ||
      String(event.awayTeamId || '') === String(teamId);
  }

  function isBlockingCareerEvent(event) {
    if (!isActive(event)) return false;

    const type = String(event?.type || event?.eventType || '').toLowerCase();

    return Boolean(
      event?.requiresPlayerInteraction === true ||
      type === 'practice' ||
      type === 'training' ||
      type === 'coach-meeting' ||
      type === 'meeting' ||
      isCareerGame(event)
    );
  }

  function firstBlockingDateBetween(today, requestedTarget) {
    return schedule()
      .filter(event => {
        const date = dateKey(event?.date);
        return Boolean(
          date &&
          date > today &&
          date <= requestedTarget &&
          isBlockingCareerEvent(event)
        );
      })
      .sort((a, b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.eventId || a.id || '').localeCompare(String(b.eventId || b.id || ''))
      )
      .map(event => dateKey(event.date))
      .find(Boolean) || null;
  }

  function setHidden(button, hidden) {
    if (button.hidden !== hidden) button.hidden = hidden;
  }

  function setDisabled(button, disabled) {
    if (button.disabled !== disabled) button.disabled = disabled;
  }

  function setData(button, key, value) {
    const next = String(value || '');
    if (String(button.dataset[key] || '') !== next) {
      button.dataset[key] = next;
    }
  }

  function setButtonLabel(button, text) {
    const label = button.querySelector('.btn__label');
    if (label) {
      if (String(label.textContent || '') !== String(text)) {
        label.textContent = text;
      }
      return;
    }
    if (String(button.textContent || '') !== String(text)) {
      button.textContent = text;
    }
  }

  function syncSelectedDayControls() {
    const selected = selectedDate();
    const today = currentDate();
    if (!selected || !today) return;

    const event = activeEventOn(selected);
    const future = selected > today;

    if (!event) {
      setHidden(detailsButton, true);
      setDisabled(detailsButton, true);
      if (detailsButton.getAttribute('aria-hidden') !== 'true') {
        detailsButton.setAttribute('aria-hidden', 'true');
      }

      setHidden(actionButton, false);
      setDisabled(actionButton, !future);
      setData(actionButton, 'openDayTarget', future ? selected : '');
      setButtonLabel(actionButton, future ? 'Simulate to Date' : 'No Event');
      return;
    }

    setHidden(detailsButton, false);
    setDisabled(detailsButton, false);
    if (detailsButton.hasAttribute('aria-hidden')) {
      detailsButton.removeAttribute('aria-hidden');
    }
    setData(actionButton, 'openDayTarget', '');
  }

  function clampTarget(requestedTarget, today) {
    if (!requestedTarget || !today) return requestedTarget;

    /*
     * The engine owns the May 1 postseason checkpoint. After that checkpoint
     * is cleared, a long Schedule jump still must not cross an unresolved
     * player-controlled career event. Stop at the first one and let the normal
     * simulateToDate flow open it.
     */
    const firstBlockingDate = firstBlockingDateBetween(today, requestedTarget);
    return firstBlockingDate || requestedTarget;
  }

  actionButton.addEventListener('click', event => {
    const requestedTarget = dateKey(actionButton.dataset.openDayTarget);
    const today = currentDate();

    if (
      !requestedTarget ||
      !today ||
      requestedTarget <= today ||
      activeEventOn(requestedTarget)
    ) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const target = clampTarget(requestedTarget, today);

    if (typeof simulateToDate === 'function') {
      /*
       * simulateToDate already refreshes the canonical schedule and routes a
       * blocking event. Do not immediately refresh the hub again here; doing
       * so can overwrite the event screen that simulation just opened.
       */
      simulateToDate(target, 'schedule');
    }
  }, true);

  document.addEventListener('click', event => {
    if (event.target.closest('[data-date]')) {
      window.setTimeout(syncSelectedDayControls, 0);
    }
  }, true);

  let syncQueued = false;
  const queueSync = () => {
    if (syncQueued) return;
    syncQueued = true;
    window.requestAnimationFrame(() => {
      syncQueued = false;
      syncSelectedDayControls();
    });
  };

  const observer = new MutationObserver(queueSync);

  const scheduleRoot =
    document.getElementById('hub-panel-schedule') ||
    document.getElementById('schedule-panel') ||
    actionButton.parentElement?.parentElement ||
    document.body;

  observer.observe(scheduleRoot, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'data-date', 'disabled', 'hidden'],
  });

  syncSelectedDayControls();
})();
