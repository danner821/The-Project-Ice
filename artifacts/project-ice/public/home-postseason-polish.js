'use strict';

(() => {
  const normalize = value => String(value || '').trim().toLowerCase();

  function fixObjectiveGrammar() {
    const node = document.getElementById('hub-current-objective');
    if (!node) return;

    node.textContent = String(node.textContent || '')
      .replace(/\bWolves is next\./, 'Wolves are next.')
      .replace(/\bBears is next\./, 'Bears are next.')
      .replace(/\bFalcons is next\./, 'Falcons are next.')
      .replace(/\bRavens is next\./, 'Ravens are next.')
      .replace(/\bLynx is next\./, 'Lynx are next.');
  }

  function polishOpenDayAction() {
    const name = document.getElementById('hub-ep-name');
    const objective = document.getElementById('hub-ep-objective');
    const button = document.getElementById('btn-hub-event');
    const label = document.getElementById('hub-ep-btn-label');
    if (!name || !objective || !button || !label) return;

    const isOpenDay = normalize(name.textContent) === 'open day';
    const noActivity = normalize(objective.textContent).includes('no scheduled activities');
    const shouldDisable = isOpenDay && noActivity;

    if (shouldDisable) {
      if (button.dataset.piOriginalDisabled === undefined) {
        button.dataset.piOriginalDisabled = button.disabled ? 'true' : 'false';
      }
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('is-open-day-disabled');
      label.textContent = 'No Action Needed';
      return;
    }

    if (button.classList.contains('is-open-day-disabled')) {
      const originalDisabled = button.dataset.piOriginalDisabled === 'true';
      button.disabled = originalDisabled;
      button.removeAttribute('aria-disabled');
      button.classList.remove('is-open-day-disabled');
      delete button.dataset.piOriginalDisabled;
    }
  }

  function apply() {
    fixObjectiveGrammar();
    polishOpenDayAction();
  }

  function applyAfterCore() {
    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
  }

  document.addEventListener('click', event => {
    if (
      event.target?.closest?.('#hub-cal-strip, .hub-calendar-day, .hub-day-card, [data-date-key], [data-hub-date], [data-tab], .hub-nav__item')
    ) {
      applyAfterCore();
    }
  });

  document.addEventListener('change', applyAfterCore);

  globalThis.ProjectIceHomePostseasonPolish = { apply, applyAfterCore };
  applyAfterCore();
})();
