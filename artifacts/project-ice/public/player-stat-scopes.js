'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const PROFILE_CONTROL_ID = 'pi-player-profile-stat-scope';
  const STYLE_ID = 'pi-player-stat-scope-styles';
  let profileScope = 'regular-season';
  let lastProfilePlayer = null;
  let lastProfileOptions = null;

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function playerId(player) {
    return String(player?.playerId || player?.id || '');
  }

  function getAllPlayers() {
    return WorldEngine.getAllWorldPlayers?.() || [];
  }

  function sameName(a, b) {
    return (
      normalize(a?.firstName) === normalize(b?.firstName) &&
      normalize(a?.lastName) === normalize(b?.lastName)
    );
  }

  function resolveCanonicalPlayer(player) {
    const ids = [player?.id, player?.playerId].filter(Boolean);
    for (const id of ids) {
      const found = WorldEngine.getPlayerById?.(id);
      if (found) return found;
    }

    const players = getAllPlayers();
    const flagged = players.find(candidate =>
      candidate?.isCareerPlayer === true ||
      candidate?.careerPlayer === true ||
      candidate?.isUserPlayer === true
    );
    if (flagged && sameName(flagged, player || Game?.player)) return flagged;

    const source = player || Game?.player || {};
    const teamId = String(source?.teamId || '');
    const exact = players.find(candidate =>
      sameName(candidate, source) &&
      (!teamId || String(candidate?.teamId || '') === teamId)
    );
    if (exact) return exact;

    return players.find(candidate => sameName(candidate, source)) || player || null;
  }

  function resolveCareerPlayer() {
    return resolveCanonicalPlayer(Game?.player || null);
  }

  function scopeFromCareerFilter() {
    return document.getElementById('pp-statistics-filter')?.value === 'playoffs'
      ? 'playoffs'
      : 'regular-season';
  }

  function getScopedStats(player, scope) {
    const canonical = resolveCanonicalPlayer(player);
    if (!canonical) return null;
    WorldEngine.rebuildHighSchoolPostseasonStats?.();
    return WorldEngine.getPlayerStatsByScope?.(canonical, scope) || null;
  }

  function headerMap(headId) {
    const cells = Array.from(document.getElementById(headId)?.querySelectorAll('th') || []);
    const map = new Map();
    cells.forEach((cell, index) => {
      const key = String(cell.textContent || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9+/%-]/g, '');
      if (key) map.set(key, index);
    });
    return map;
  }

  function setCell(row, index, value) {
    if (!row || index === undefined) return;
    const cell = row.children?.[index];
    if (cell) cell.textContent = String(value);
  }

  function valuesFor(player, stats) {
    if (!stats) return null;
    const goalie = String(player?.position || '').toUpperCase() === 'G';
    if (goalie) {
      return {
        GP: stats.gamesPlayed || 0,
        GS: stats.gamesStarted || 0,
        W: stats.wins || 0,
        L: stats.losses || 0,
        OTL: stats.overtimeLosses || 0,
        GA: stats.goalsAgainst || 0,
        GAA: Number(stats.goalsAgainstAverage || 0).toFixed(2),
        'SV%': Number(stats.savePercentage || 0).toFixed(3).replace(/^0/, ''),
        SO: stats.shutouts || 0,
      };
    }

    return {
      GP: stats.gamesPlayed || 0,
      G: stats.goals || 0,
      A: stats.assists || 0,
      PTS: stats.points || 0,
      '+/-': stats.plusMinus || 0,
      PIM: stats.penaltyMinutes || 0,
      SOG: stats.shots || 0,
      SHOTS: stats.shots || 0,
    };
  }

  function overlayTable({ player, scope, headId, bodyId, footId }) {
    const canonical = resolveCanonicalPlayer(player);
    if (!canonical) return false;

    const stats = getScopedStats(canonical, scope);
    const values = valuesFor(canonical, stats);
    if (!values) return false;

    const headers = headerMap(headId);
    const body = document.getElementById(bodyId);
    const rows = Array.from(body?.querySelectorAll('tr') || []);
    if (!rows.length) return false;

    const currentRow = rows[rows.length - 1];
    Object.entries(values).forEach(([label, value]) => {
      setCell(currentRow, headers.get(label), value);
    });

    const footerRow = document.getElementById(footId)?.querySelector('tr');
    if (footerRow) {
      Object.entries(values).forEach(([label, value]) => {
        setCell(footerRow, headers.get(label), value);
      });
    }

    currentRow.dataset.piStatScope = scope;
    if (footerRow) footerRow.dataset.piStatScope = scope;
    return true;
  }

  function applyCareerScope() {
    return overlayTable({
      player: resolveCareerPlayer(),
      scope: scopeFromCareerFilter(),
      headId: 'pp-statistics-head',
      bodyId: 'pp-statistics-body',
      footId: 'pp-statistics-foot',
    });
  }

  function applyCareerScopeAfterCore() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyCareerScope();
      });
    });
  }

  /*
   * Important: the Player tab calls its local renderer directly, bypassing the
   * globally exposed shared renderer. Do not compete with that renderer.
   * Instead, allow the core table to finish, then overlay the active-season row
   * from the canonical scoped stats API. A delegated listener also survives any
   * future replacement of the select element.
   */
  document.addEventListener('change', event => {
    if (event.target?.id === 'pp-statistics-filter') {
      applyCareerScopeAfterCore();
    }
  });

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('[data-tab], [data-hub-tab], [data-tab-target], .hub-tab');
    const label = normalize(
      target?.dataset?.tab ||
      target?.dataset?.hubTab ||
      target?.dataset?.tabTarget ||
      target?.textContent
    );
    if (label === 'player' || label.includes('player')) {
      applyCareerScopeAfterCore();
    }
  });

  /* Standalone player profiles still use the globally exposed shared renderer. */
  const sharedRender = globalThis.renderProjectIcePlayerStatistics;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PROFILE_CONTROL_ID}{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:10px 0 12px;padding:3px;border:1px solid rgba(82,145,232,.16);border-radius:12px;background:rgba(5,18,35,.45)}
      #${PROFILE_CONTROL_ID} button{appearance:none;border:0;border-radius:9px;padding:8px 9px;background:transparent;color:#6d819e;font:inherit;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      #${PROFILE_CONTROL_ID} button.is-active{background:rgba(54,126,225,.2);color:#bdd7fb;box-shadow:inset 0 0 0 1px rgba(94,159,249,.18)}
    `;
    document.head.appendChild(style);
  }

  function syncProfileButtons() {
    document.querySelectorAll(`#${PROFILE_CONTROL_ID} button[data-scope]`).forEach(button => {
      const active = button.dataset.scope === profileScope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function ensureProfileControl() {
    const table = document.getElementById('player-profile-statistics-head')?.closest('table');
    if (!table) return;
    const card = table.closest('.pp-statistics-card') || table.parentElement;
    if (!card) return;

    injectStyles();
    let control = document.getElementById(PROFILE_CONTROL_ID);
    if (!control) {
      control = document.createElement('div');
      control.id = PROFILE_CONTROL_ID;
      control.innerHTML = `
        <button type="button" data-scope="regular-season">Regular Season</button>
        <button type="button" data-scope="playoffs">Playoffs</button>
      `;
      card.insertAdjacentElement('beforebegin', control);
      control.addEventListener('click', event => {
        const button = event.target.closest('button[data-scope]');
        if (!button) return;
        profileScope = button.dataset.scope === 'playoffs' ? 'playoffs' : 'regular-season';
        syncProfileButtons();
        if (lastProfilePlayer && typeof sharedRender === 'function') {
          sharedRender(lastProfilePlayer, lastProfileOptions || {});
          requestAnimationFrame(() => overlayTable({
            player: lastProfilePlayer,
            scope: profileScope,
            headId: 'player-profile-statistics-head',
            bodyId: 'player-profile-statistics-body',
            footId: 'player-profile-statistics-foot',
          }));
        }
      });
    }
    syncProfileButtons();
  }

  if (typeof sharedRender === 'function') {
    globalThis.renderProjectIcePlayerStatistics = function(player = {}, options = {}) {
      const result = sharedRender(player, options);
      const standalone = String(options?.headId || '') === 'player-profile-statistics-head';
      if (standalone) {
        lastProfilePlayer = player;
        lastProfileOptions = options;
        ensureProfileControl();
        requestAnimationFrame(() => overlayTable({
          player,
          scope: profileScope,
          headId: 'player-profile-statistics-head',
          bodyId: 'player-profile-statistics-body',
          footId: 'player-profile-statistics-foot',
        }));
      }
      return result;
    };
  }

  WorldEngine.applyCareerPlayerStatScope = applyCareerScope;
  applyCareerScopeAfterCore();
})();
