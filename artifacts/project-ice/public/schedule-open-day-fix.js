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

  function setButtonLabel(button, text) {
    const label = button.querySelector('.btn__label');
    if (label) label.textContent = text;
    else button.textContent = text;
  }

  function syncSelectedDayControls() {
    const selected = selectedDate();
    const today = currentDate();
    if (!selected || !today) return;

    const event = activeEventOn(selected);
    const future = selected > today;

    if (!event) {
      detailsButton.hidden = true;
      detailsButton.disabled = true;
      detailsButton.setAttribute('aria-hidden', 'true');

      actionButton.hidden = false;
      actionButton.disabled = !future;
      actionButton.dataset.openDayTarget = future ? selected : '';
      setButtonLabel(actionButton, future ? 'Simulate to Date' : 'No Event');
      return;
    }

    detailsButton.hidden = false;
    detailsButton.disabled = false;
    detailsButton.removeAttribute('aria-hidden');
    actionButton.dataset.openDayTarget = '';
  }

  function clampToPendingPostseasonCheckpoint(target) {
    if (!target) return target;

    /*
     * A long Schedule-tab jump must never leap over the hard postseason
     * checkpoint. Reconcile first so an Apr 29 end-of-season save has its
     * postseason/checkpoint created before we decide how far it may advance.
     *
     * WorldEngine.advanceToDate also owns this rule. This UI guard makes the
     * Schedule shortcut obey the same contract even if another runtime layer
     * later wraps the engine or the selected target is several days ahead.
     */
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

  /*
   * The Schedule calendar rerenders its selected-day panel frequently. Keep
   * the controls synchronized after calendar clicks and those DOM updates.
   */
  document.addEventListener('click', event => {
    if (event.target.closest('[data-date]')) {
      window.setTimeout(syncSelectedDayControls, 0);
    }
  }, true);

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(syncSelectedDayControls);
  });

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
