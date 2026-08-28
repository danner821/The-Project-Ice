'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function randomIndex(length) {
    if (!length) return 0;
    try {
      if (globalThis.crypto?.getRandomValues) {
        const value = new Uint32Array(1);
        globalThis.crypto.getRandomValues(value);
        return value[0] % length;
      }
    } catch (_) {}
    return Math.floor(Math.random() * length);
  }

  function ensureFreshPlacement() {
    const state = travel();
    const result = state?.tryoutResult;
    const level = state?.placementLevel || result?.placementLevel;
    if (!state || !result || !level || state.travelTeamSelectionVersion === 2) return false;

    const options = state?.teamOptionsByLevel?.[level];
    if (!Array.isArray(options) || !options.length) {
      state.travelTeamSelectionVersion = 2;
      return false;
    }

    const selected = options[randomIndex(options.length)];
    if (!selected) return false;

    state.placementTeamId = selected.teamId;
    state.placementTeamName = selected.name;
    state.playerTeamId = selected.teamId;
    state.playerTeamName = selected.name;
    state.placementTeam = { ...selected };
    result.placementTeamId = selected.teamId;
    result.placementTeamName = selected.name;
    result.placementTeamCity = selected.city;
    state.travelTeamSelectionVersion = 2;

    /* A newly completed dev tryout must build a fresh summer world around
       this placement rather than reuse any previously constructed team world. */
    delete state.worldVersion;
    delete state.teams;
    delete state.tournament;

    WorldEngine.save?.();
    return true;
  }

  function fixHomeOpenDayAction() {
    const name = document.getElementById('hub-ep-name');
    const objective = document.getElementById('hub-ep-objective');
    const button = document.getElementById('btn-hub-event');
    const label = document.getElementById('hub-ep-btn-label');
    if (!name || !objective || !button || !label) return;

    const isOpen = String(name.textContent || '').trim().toLowerCase() === 'open day';
    const noActivity = String(objective.textContent || '').toLowerCase().includes('no scheduled activities');
    const coreLabel = String(label.textContent || '').trim().toLowerCase();
    const future = coreLabel === 'simulate to selected day';

    if (isOpen && noActivity && !future) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('is-open-day-disabled');
      label.textContent = 'No Action Needed';
    } else if (button.classList.contains('is-open-day-disabled')) {
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      button.classList.remove('is-open-day-disabled');
    }
  }

  let timer = null;
  function reconcile() {
    ensureFreshPlacement();
    fixHomeOpenDayAction();
    WorldEngine.reconcileTravelSeasonUI?.();
  }

  function queue() {
    if (timer !== null) clearTimeout(timer);
    requestAnimationFrame(reconcile);
    timer = window.setTimeout(() => {
      timer = null;
      reconcile();
    }, 80);
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.('#hub-cal-strip,[data-date],.hub-cal-card,.hub-calendar-day,.hub-day-card,#pi-travel-tryouts-screen,.hub-nav__item,[data-tab]')) queue();
  }, true);

  const homePanel = document.getElementById('hub-tab-home');
  if (homePanel) {
    new MutationObserver(queue).observe(homePanel, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class','disabled','aria-disabled'],
    });
  }

  window.setTimeout(queue, 100);
  window.setTimeout(queue, 500);
  WorldEngine.stabilizeTravelSeasonUI = reconcile;
})();
