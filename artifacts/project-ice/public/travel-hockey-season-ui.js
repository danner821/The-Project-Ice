'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const HOME_CARD_ID = 'pi-travel-home-card';
  const LEAGUE_CARD_ID = 'pi-travel-league-card';
  const ACTIVE_CLASS = 'pi-travel-season-active';
  const STYLE_ID = 'pi-travel-season-ui-styles';

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function activeTravel() {
    const state = travel();
    return Boolean(state?.tryoutResult && state?.placementLevel && state?.completed !== true);
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

  function applyFreshPlacementTeam() {
    const state = travel();
    const result = state?.tryoutResult;
    const level = state?.placementLevel || result?.placementLevel;
    if (!state || !result || !level || state.randomTravelTeamChosen === true) return false;

    const options = state?.teamOptionsByLevel?.[level];
    if (!Array.isArray(options) || !options.length) return false;

    const selected = options[randomIndex(options.length)] || options[0];
    state.randomTravelTeamChosen = true;
    state.placementTeamId = selected.teamId;
    state.placementTeamName = selected.name;
    state.playerTeamId = selected.teamId;
    state.playerTeamName = selected.name;
    state.placementTeam = { ...selected };

    result.placementTeamId = selected.teamId;
    result.placementTeamName = selected.name;
    result.placementTeamCity = selected.city;

    delete state.worldVersion;
    delete state.teams;
    delete state.tournament;

    const root = document.getElementById('pi-travel-tryouts-screen');
    const card = root?.querySelector('.pi-travel-team');
    const nameNode = card?.querySelector('strong');
    const cityNode = card?.querySelector('small');
    if (nameNode) nameNode.textContent = selected.name;
    if (cityNode) cityNode.textContent = selected.city || '';

    WorldEngine.save?.();
    return true;
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
      document.getElementById('league-tab-panel') ||
      document.querySelector('[data-hub-panel="league"]') ||
      document.querySelector('[data-hub-tab-panel="league"]') ||
      document.querySelector('[data-panel="league"]');
  }

  function contentHost(panel) {
    return panel?.querySelector('.hub-tab-content,.hub-panel__content,.hub-panel-content,.league-content') || panel;
  }

  function placeHomeCard() {
    const panel = homePanel();
    const card = document.getElementById(HOME_CARD_ID);
    if (!panel || !card) return;

    const strip = panel.querySelector('#hub-cal-strip') || document.getElementById('hub-cal-strip');
    const scheduleSection = strip?.closest('.hub-card,.hub-section,section,article');

    if (scheduleSection && scheduleSection !== panel && panel.contains(scheduleSection)) {
      if (card.nextElementSibling !== scheduleSection) {
        scheduleSection.insertAdjacentElement('beforebegin', card);
      }
      return;
    }

    const objective = panel.querySelector('.home-objective,#home-objective,[data-home-objective]');
    if (objective) objective.insertAdjacentElement('afterend', card);
  }

  function placeLeagueCard() {
    const panel = leaguePanel();
    const card = document.getElementById(LEAGUE_CARD_ID);
    if (!panel || !card) return;
    const host = contentHost(panel);
    if (host.firstElementChild !== card) host.prepend(card);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      body.${ACTIVE_CLASS} #pi-league-postseason-card,
      body.${ACTIVE_CLASS} #pi-playoff-leaders-card {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function reconcile() {
    injectStyles();
    const active = activeTravel();
    document.body?.classList.toggle(ACTIVE_CLASS, active);

    if (!active) return;

    WorldEngine.renderTravelHockeyHubEntries?.();
    requestAnimationFrame(() => {
      placeHomeCard();
      placeLeagueCard();
    });
  }

  document.addEventListener('click', event => {
    const target = event.target;

    if (target?.closest?.('#pi-travel-tryouts-screen .pi-travel-next')) {
      window.setTimeout(() => {
        applyFreshPlacementTeam();
        reconcile();
      }, 0);
      return;
    }

    if (target?.closest?.('.hub-nav__item,[data-tab],#pi-travel-tryouts-continue')) {
      requestAnimationFrame(reconcile);
      window.setTimeout(reconcile, 80);
    }
  });

  window.setTimeout(reconcile, 100);
  window.setTimeout(reconcile, 500);
  window.setTimeout(reconcile, 1200);

  WorldEngine.reconcileTravelSeasonPresentation = reconcile;
})();
