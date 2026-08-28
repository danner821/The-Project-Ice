'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HOME_ID = 'pi-travel-home-card';
  const LEAGUE_ID = 'pi-travel-league-card';
  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function travel() {
    return WorldEngine.normalizeTravelHockeyWorld?.(false) ||
      WorldEngine.ensureTravelHockeyWorld?.({ save: false }) ||
      WorldEngine.getTravelHockeyState?.() ||
      WorldEngine.state?.travelHockey || null;
  }

  function homePanel() {
    return document.getElementById('hub-panel-home') ||
      document.getElementById('hub-tab-home') ||
      document.querySelector('[data-hub-panel="home"]') ||
      document.querySelector('[data-panel="home"]');
  }

  function leaguePanel() {
    return document.getElementById('hub-panel-league') ||
      document.getElementById('league-panel') ||
      document.querySelector('[data-hub-panel="league"]') ||
      document.querySelector('[data-panel="league"]');
  }

  function makeCard(id, state) {
    const card = document.createElement('div');
    card.id = id;
    card.className = 'pi-travel-entry';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `<b>›</b><small>Summer Travel Hockey · ${esc(state.placementLevel || '')}</small><strong>${esc(state.playerTeamName || 'Travel Hockey Hub')}</strong><span>Open teams, tournament bracket, and Travel stat leaders.</span>`;
    const open = () => WorldEngine.openTravelHockeyHub?.();
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open();
    });
    return card;
  }

  function placeHome(state) {
    const panel = homePanel();
    if (!panel) return;
    document.getElementById(HOME_ID)?.remove();
    const card = makeCard(HOME_ID, state);
    const strip = panel.querySelector('#hub-cal-strip') || document.getElementById('hub-cal-strip');
    const scheduleSection = strip?.closest('.hub-card, .hub-section, section, article, div');
    if (scheduleSection && scheduleSection !== panel && panel.contains(scheduleSection)) {
      scheduleSection.insertAdjacentElement('beforebegin', card);
    } else {
      const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content') || panel;
      host.prepend(card);
    }
  }

  function placeLeague(state) {
    const panel = leaguePanel();
    if (!panel) return;
    document.getElementById(LEAGUE_ID)?.remove();
    const card = makeCard(LEAGUE_ID, state);
    const host = panel.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;
    host.prepend(card);
  }

  let frame = null;
  function reconcile() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const state = travel();
      if (!state?.tryoutResult || state.completed === true) {
        document.getElementById(HOME_ID)?.remove();
        document.getElementById(LEAGUE_ID)?.remove();
        return;
      }
      placeHome(state);
      placeLeague(state);
    });
  }

  document.addEventListener('click', () => requestAnimationFrame(reconcile), { passive: true });
  window.addEventListener('load', reconcile, { once: true });
  window.setTimeout(reconcile, 100);
  window.setTimeout(reconcile, 500);
  window.setTimeout(reconcile, 1200);

  WorldEngine.reconcileTravelHockeyEntrypoints = reconcile;
})();
