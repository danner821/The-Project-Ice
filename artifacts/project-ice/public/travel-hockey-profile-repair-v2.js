'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const STYLE_ID = 'pi-travel-profile-repair-v2-style';
  let activeTravelTeam = null;
  let restoreTeamId = null;

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const idOf = player => String(player?.playerId || player?.id || '');
  const sourceIdOf = player => String(player?.sourcePlayerId || player?.playerId || player?.id || '');
  const nameOf = player => String(player?.name || player?.playerName || [player?.firstName, player?.lastName].filter(Boolean).join(' ').trim() || 'Player');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.pi-prospect-rank-badge{display:block;margin-top:3px;color:#657b96;font-size:7px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}';
    document.head.appendChild(style);
  }

  function rankRows() {
    let rows = [];
    try {
      rows = WorldEngine.getProspectRankings?.() || WorldEngine.state?.prospectRankings || WorldEngine.state?.prospects || [];
    } catch (_) {}
    if (!Array.isArray(rows)) rows = [];
    return [...rows]
      .sort((a,b) => Number(a?.rank ?? a?.prospectRank ?? a?.ranking ?? 9999) - Number(b?.rank ?? b?.prospectRank ?? b?.ranking ?? 9999))
      .slice(0, 100);
  }

  function prospectRank(player) {
    if (!player || player.generatedTravelPlayer === true) return null;
    const rows = rankRows();
    const ids = new Set([String(player.sourcePlayerId || ''), String(player.playerId || ''), String(player.id || '')].filter(Boolean));
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowId = String(row?.playerId || row?.id || row?.prospectId || '');
      if (rowId && ids.has(rowId)) return Number(row?.rank ?? row?.prospectRank ?? row?.ranking ?? index + 1);
    }

    // Travel roster prospects sometimes carry a canonical prospect identity by
    // name while their roster copy has a Travel-specific playerId. Only allow a
    // name fallback for players explicitly marked as real prospects so generated
    // players can never inherit a rank by coincidence.
    if (player.isRealProspect === true || player.realProspect === true || player.prospectId) {
      const name = nameOf(player).toLowerCase();
      const index = rows.findIndex(row => nameOf(row).toLowerCase() === name);
      if (index >= 0) return Number(rows[index]?.rank ?? rows[index]?.prospectRank ?? rows[index]?.ranking ?? index + 1);
    }
    return null;
  }

  function decorateProspects(root, team) {
    if (!root || !team) return;
    root.querySelectorAll('.pi-prospect-rank-badge').forEach(node => node.remove());
    for (const card of root.querySelectorAll('[data-player-id]')) {
      const id = String(card.dataset.playerId || '');
      const player = (team.roster || []).find(item => idOf(item) === id || sourceIdOf(item) === id);
      const rank = prospectRank(player);
      if (!rank) continue;
      const target = card.querySelector('.lineup-player__overall') || card.querySelector('.lineup-player__name') || card;
      const badge = document.createElement('small');
      badge.className = 'pi-prospect-rank-badge';
      badge.textContent = `Prospect #${rank}`;
      target.insertAdjacentElement('afterend', badge);
    }
  }

  function realCareerTeamId() {
    const player = WorldEngine.state?.player || {};
    const ids = new Set([String(player.playerId || ''), String(player.id || ''), 'career-player'].filter(Boolean));
    const team = (WorldEngine.state?.teams || []).find(item =>
      !item.travelProfileAdapter &&
      (item.roster || []).some(rosterPlayer =>
        rosterPlayer?.isCareerPlayer === true || ids.has(String(rosterPlayer?.playerId || rosterPlayer?.id || ''))
      )
    );
    return team?.teamId || null;
  }

  function restoreHighSchoolTeamTab() {
    if (Array.isArray(WorldEngine.state?.teams)) {
      WorldEngine.state.teams = WorldEngine.state.teams.filter(team => team?.travelProfileAdapter !== true);
    }
    const id = restoreTeamId || realCareerTeamId();
    if (!id) return;
    try {
      if (typeof Game !== 'undefined') Game.teamTabSelectedTeamId = id;
      globalThis.renderTeamTab?.(id);
    } catch (_) {}
  }

  function patchOpenedProfile(team) {
    const screen = document.getElementById('team-profile-screen');
    const root = document.getElementById('team-profile-modern-content');
    if (!team || !screen || !root || screen.classList.contains('screen--hidden')) return;

    root.dataset.travelTeamId = String(team.teamId || '');
    root.dataset.travelProfile = 'true';

    document.getElementById('pi-travel-clean-lineup')?.remove();
    document.getElementById('pi-travel-clean-leaders')?.remove();
    document.getElementById('pi-travel-profile-roster')?.remove();

    // Preserve the exact native Team Profile styling, but ensure the cloned
    // profile's color strip is driven by the selected Travel club.
    const primary = team.primaryColor || '#2f6fd6';
    const secondary = team.secondaryColor || '#8fc1ff';
    root.querySelectorAll('.team-profile-style-hero__color-primary').forEach(node => { node.style.background = primary; });
    root.querySelectorAll('.team-profile-style-hero__color-secondary').forEach(node => { node.style.background = secondary; });

    decorateProspects(root, team);
    WorldEngine.renderScopedTeamProfileLeaders?.();
  }

  function install() {
    injectStyle();
    if (typeof WorldEngine.openTravelTeamProfile !== 'function' || WorldEngine.__travelProfileRepairV4Wrapped) return false;

    const original = WorldEngine.openTravelTeamProfile.bind(WorldEngine);
    WorldEngine.__travelProfileRepairV4Wrapped = true;
    WorldEngine.openTravelTeamProfile = function(teamId) {
      const state = WorldEngine.rebuildTravelHockeyRosters?.() || travel();
      activeTravelTeam = (state?.teams || []).find(team => String(team.teamId) === String(teamId)) || null;
      restoreTeamId = realCareerTeamId();

      const result = original(teamId);
      requestAnimationFrame(() => {
        patchOpenedProfile(activeTravelTeam);
        // openTeamProfile clones the rendered Team tab synchronously. Once that
        // clone exists, the temporary Travel adapter is no longer needed in the
        // canonical HS team collection and must not be allowed to own the Team tab.
        restoreHighSchoolTeamTab();
        // Other profile-scope scripts render on double-rAF after open. Re-apply
        // deterministic Travel-only decoration after those scheduled renders.
        setTimeout(() => patchOpenedProfile(activeTravelTeam), 60);
        setTimeout(() => patchOpenedProfile(activeTravelTeam), 180);
      });
      return result;
    };
    return true;
  }

  document.addEventListener('click', event => {
    const root = event.target?.closest?.('#team-profile-modern-content');
    const card = event.target?.closest?.('[data-player-id]');
    if (root && card && activeTravelTeam) {
      const id = String(card.dataset.playerId || '');
      const player = (activeTravelTeam.roster || []).find(item => idOf(item) === id || sourceIdOf(item) === id);
      if (player) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const target = player.isRealProspect === true && player.sourcePlayerId
          ? (WorldEngine.getPlayerById?.(player.sourcePlayerId) || player)
          : player;
        globalThis.openPlayerProfile?.(target, 'hub');
      }
    }

    if (event.target?.closest?.('.hub-nav__item,.hub-nav__tab,[data-tab]')) {
      restoreHighSchoolTeamTab();
    }

    if (event.target?.closest?.('#btn-back-team-profile')) {
      activeTravelTeam = null;
      restoreHighSchoolTeamTab();
      restoreTeamId = null;
    }
  }, true);

  install();
  setTimeout(install, 50);
  setTimeout(install, 150);
  setTimeout(install, 350);
  setTimeout(install, 800);
})();
