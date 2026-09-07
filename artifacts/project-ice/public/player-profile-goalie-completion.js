'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__goalieProfileCompletionInstalled === true) return;
  WorldEngine.__goalieProfileCompletionInstalled = true;

  const idOf = player => String(player?.playerId || player?.id || '');

  function canonical(player) {
    const id = idOf(player);
    return (id && WorldEngine.getPlayerById?.(id)) || player || null;
  }

  function isGoalie(player) {
    const pos = String(player?.position || '').trim().toUpperCase();
    return pos === 'G' || pos.includes('GOAL');
  }

  function finishGoalieProfile(player) {
    const p = canonical(player);
    if (!p || !isGoalie(p)) return;

    const scoutingProfile =
      p.scoutingProfile && typeof p.scoutingProfile === 'object'
        ? p.scoutingProfile
        : {};

    const strengths = Array.isArray(scoutingProfile.strengthsKnown)
      ? scoutingProfile.strengthsKnown.filter(Boolean)
      : [];
    const weaknesses = Array.isArray(scoutingProfile.weaknessesKnown)
      ? scoutingProfile.weaknessesKnown.filter(Boolean)
      : [];

    const strengthsEl = document.getElementById('pp-strengths');
    if (strengthsEl) {
      strengthsEl.innerHTML = strengths.length
        ? strengths.map(trait => {
            const label = typeof trait === 'string' ? trait : (trait?.label || trait?.name || 'Strength');
            return `<li class="pp-dev-list__item">${label}</li>`;
          }).join('')
        : '<li class="pp-dev-list__item">Not evaluated</li>';
    }

    const weaknessesEl = document.getElementById('pp-weaknesses');
    if (weaknessesEl) {
      weaknessesEl.innerHTML = weaknesses.length
        ? weaknesses.map(trait => {
            const label = typeof trait === 'string' ? trait : (trait?.label || trait?.name || 'Weakness');
            return `<li class="pp-dev-list__item">${label}</li>`;
          }).join('')
        : '<li class="pp-dev-list__item">Not evaluated</li>';
    }

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
      const history = Array.isArray(scoutingProfile.scoutingHistory)
        ? scoutingProfile.scoutingHistory
        : [];
      const latest = history[history.length - 1] || null;
      const fallback = typeof globalThis.getScoutReport === 'function'
        ? globalThis.getScoutReport(p)
        : `${p.firstName || 'This'} ${p.lastName || 'goalie'} has not been fully evaluated yet.`;
      scoutTextEl.textContent = latest?.summary || latest?.reportText || fallback;
    }
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

  WorldEngine.finishGoaliePlayerProfile = finishGoalieProfile;
})();
