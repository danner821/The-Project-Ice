'use strict';

/* global WorldEngine */

(() => {
  const collapse = () => {
    document.querySelectorAll('#player-profile-screen .pp-attr-cat').forEach(card => {
      card.classList.remove('pp-attr-cat--open');
    });
  };

  const idOf = player => String(player?.playerId || player?.id || '');
  const isGoalie = player => {
    const pos = String(player?.position || '').trim().toUpperCase();
    return pos === 'G' || pos.includes('GOAL');
  };

  function renderCareerPlayerAwards() {
    if (typeof WorldEngine === 'undefined') return false;
    if (typeof globalThis.renderProjectIcePlayerAwards !== 'function') return false;

    const player = WorldEngine.state?.player;
    if (!player) return false;

    return globalThis.renderProjectIcePlayerAwards(player, {
      listId: 'pp-awards-list',
    });
  }

  function scheduleCareerPlayerAwards() {
    requestAnimationFrame(() => requestAnimationFrame(renderCareerPlayerAwards));
  }

  function finishGoalieProfile(player) {
    if (typeof WorldEngine === 'undefined' || !player || !isGoalie(player)) return;
    const p = (idOf(player) && WorldEngine.getPlayerById?.(idOf(player))) || player;
    const scouting = p.scoutingProfile && typeof p.scoutingProfile === 'object'
      ? p.scoutingProfile
      : {};

    const strengths = Array.isArray(scouting.strengthsKnown)
      ? scouting.strengthsKnown.filter(Boolean)
      : [];
    const weaknesses = Array.isArray(scouting.weaknessesKnown)
      ? scouting.weaknessesKnown.filter(Boolean)
      : [];

    const renderTraits = (elementId, traits, fallback) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.innerHTML = traits.length
        ? traits.map(trait => {
            const label = typeof trait === 'string'
              ? trait
              : (trait?.label || trait?.name || fallback);
            return `<li class="pp-dev-list__item">${label}</li>`;
          }).join('')
        : '<li class="pp-dev-list__item">Not evaluated</li>';
    };

    renderTraits('pp-strengths', strengths, 'Strength');
    renderTraits('pp-weaknesses', weaknesses, 'Weakness');

    globalThis.renderProjectIcePlayerStatistics?.(p, {
      headId: 'player-profile-statistics-head',
      bodyId: 'player-profile-statistics-body',
      footId: 'player-profile-statistics-foot',
    });

    globalThis.renderProjectIcePlayerAwards?.(p, {
      listId: 'player-profile-awards-list',
    });

    globalThis.renderProjectIcePlayerRecords?.(p, {
      listId: 'player-profile-records-list',
    });

    const scoutTextEl =
      document.getElementById('pp-scout-text') ||
      document.getElementById('pp-scouting-report-text');

    if (scoutTextEl) {
      const history = Array.isArray(scouting.scoutingHistory)
        ? scouting.scoutingHistory
        : [];
      const latest = history[history.length - 1] || null;
      const fallback = typeof globalThis.getScoutReport === 'function'
        ? globalThis.getScoutReport(p)
        : `${p.firstName || 'This'} ${p.lastName || 'goalie'} has not been fully evaluated yet.`;
      scoutTextEl.textContent = latest?.summary || latest?.reportText || fallback;
    }
  }

  const baseShowScreen = globalThis.showScreen;
  if (typeof baseShowScreen === 'function') {
    globalThis.showScreen = function(screenId, ...args) {
      const result = baseShowScreen(screenId, ...args);
      const normalized = String(screenId || '').toLowerCase();
      if (normalized === 'player-profile') requestAnimationFrame(collapse);
      if (normalized === 'player' || normalized === 'player-screen') scheduleCareerPlayerAwards();
      return result;
    };
  }

  const baseRenderPlayerProfile = globalThis.renderPlayerProfile;
  if (typeof baseRenderPlayerProfile === 'function') {
    globalThis.renderPlayerProfile = function(...args) {
      const result = baseRenderPlayerProfile(...args);
      requestAnimationFrame(collapse);
      return result;
    };
  }

  const baseOpenPlayerProfile = globalThis.openPlayerProfile;
  if (typeof baseOpenPlayerProfile === 'function') {
    globalThis.openPlayerProfile = function(player, origin, ...args) {
      const result = baseOpenPlayerProfile.call(this, player, origin, ...args);
      if (isGoalie(player)) {
        requestAnimationFrame(() => finishGoalieProfile(player));
      }
      return result;
    };
  }

  document.addEventListener('click', event => {
    const tab = event.target?.closest?.(
      '[data-tab], [data-hub-tab], [data-tab-target], .hub-tab'
    );
    const label = String(
      tab?.dataset?.tab ||
      tab?.dataset?.hubTab ||
      tab?.dataset?.tabTarget ||
      tab?.textContent ||
      ''
    ).toLowerCase();

    if (label.includes('player')) scheduleCareerPlayerAwards();
  });

  window.addEventListener('projectice:player-season-recap-complete', scheduleCareerPlayerAwards);
  window.addEventListener('projectice:next-high-school-season-started', scheduleCareerPlayerAwards);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleCareerPlayerAwards, { once: true });
  } else {
    scheduleCareerPlayerAwards();
  }
})();
