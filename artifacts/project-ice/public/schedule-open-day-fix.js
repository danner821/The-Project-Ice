'use strict';

/* global WorldEngine, simulateToDate, refreshCareerUI */

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

  function activeEventOn(date) {
    if (!date) return null;
    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    return schedule.find(event =>
      dateKey(event?.date) === date &&
      event?.canceled !== true &&
      String(event?.status || '').toLowerCase() !== 'not-needed'
    ) || null;
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

  function clampToPendingPostseasonCheckpoint(target) {
    if (!target) return target;

    try {
      WorldEngine.reconcileHighSchoolPostseason?.({ save: false });
    } catch (error) {
      console.warn('[Schedule] Could not reconcile postseason before date jump:', error);
    }

    const post =
      WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;

    const checkpoint = dateKey(post?.checkpointDate);
    if (
      post?.initialized === true &&
      post?.checkpointAcknowledged !== true &&
      checkpoint &&
      target > checkpoint
    ) {
      return checkpoint;
    }

    return target;
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

    const target = clampToPendingPostseasonCheckpoint(requestedTarget);

    if (typeof simulateToDate === 'function') {
      simulateToDate(target, 'schedule');
      if (typeof refreshCareerUI === 'function') refreshCareerUI();
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
