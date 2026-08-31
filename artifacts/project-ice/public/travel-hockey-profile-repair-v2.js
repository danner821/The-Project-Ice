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
  const pos = player => {
    const raw = String(player?.position || player?.pos || '').toUpperCase();
    if (raw === 'G' || raw.includes('GOAL')) return 'G';
    if (raw === 'D' || raw.includes('DEF')) return 'D';
    if (raw === 'LW' || raw.includes('LEFT')) return 'LW';
    if (raw === 'RW' || raw.includes('RIGHT')) return 'RW';
    return 'C';
  };

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
    const ids = new Set([String(player.sourcePlayerId || ''), String(player.playerId || ''), String(player.id || '')].filter(Boolean));
    const rows = rankRows();
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowId = String(row?.playerId || row?.id || row?.prospectId || '');
      if (rowId && ids.has(rowId)) return Number(row?.rank ?? row?.prospectRank ?? row?.ranking ?? index + 1);
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

  function setTravelLeaders(root, team) {
    const leadersSection = root?.querySelector('.team-leaders');
    if (!leadersSection || !team) return;

    const label = leadersSection.querySelector('.team-section-label');
    if (label) label.textContent = 'Travel Leaders';
    leadersSection.querySelectorAll('#pi-team-profile-leaders-scope,.team-leader-scope,.team-leader-scope-control,[id*="leaders-scope"]').forEach(node => node.remove());

    const players = (team.roster || []).filter(player => Number(player?.travelStats?.gp || 0) > 0);
    const top = key => [...players].sort((a,b) => Number(b.travelStats?.[key] || 0) - Number(a.travelStats?.[key] || 0))[0] || null;
    const goalies = players.filter(player => pos(player) === 'G');
    const goalieWins = [...goalies].sort((a,b) => Number(b.travelStats?.wins || b.travelStats?.w || 0) - Number(a.travelStats?.wins || a.travelStats?.w || 0))[0] || null;
    const savePct = [...goalies].sort((a,b) => Number(b.travelStats?.savePercentage || 0) - Number(a.travelStats?.savePercentage || 0))[0] || null;

    const set = (suffix, value) => {
      const element = leadersSection.querySelector(`[id$="${suffix}"]`);
      if (element) element.textContent = value;
    };

    const goals = top('g');
    const assists = top('a');
    const points = top('pts');
    set('team-leader-goals', goals ? `${nameOf(goals)} · ${Number(goals.travelStats.g || 0)}` : 'No stats yet');
    set('team-leader-assists', assists ? `${nameOf(assists)} · ${Number(assists.travelStats.a || 0)}` : 'No stats yet');
    set('team-leader-points', points ? `${nameOf(points)} · ${Number(points.travelStats.pts || 0)}` : 'No stats yet');
    set('team-leader-wins', goalieWins ? `${nameOf(goalieWins)} · ${Number(goalieWins.travelStats.wins || goalieWins.travelStats.w || 0)}` : 'No stats yet');
    set('team-leader-save-percentage', savePct ? `${nameOf(savePct)} · ${Number(savePct.travelStats.savePercentage || 0).toFixed(3)}` : 'No stats yet');
  }

  function patchOpenedProfile(team) {
    const screen = document.getElementById('team-profile-screen');
    const root = document.getElementById('team-profile-modern-content');
    if (!team || !screen || !root || screen.classList.contains('screen--hidden')) return;

    document.getElementById('pi-travel-clean-lineup')?.remove();
    document.getElementById('pi-travel-clean-leaders')?.remove();
    document.getElementById('pi-travel-profile-roster')?.remove();
    document.getElementById('pi-team-profile-leaders-scope')?.remove();

    const lineup = root.querySelector('.team-roster');
    if (lineup) lineup.style.display = '';
    const leaders = root.querySelector('.team-leaders');
    if (leaders) leaders.style.display = '';

    setTravelLeaders(root, team);
    decorateProspects(root, team);
  }

  function realCareerTeamId() {
    const player = WorldEngine.state?.player || {};
    const ids = new Set([String(player.playerId || ''), String(player.id || ''), 'career-player'].filter(Boolean));
    const team = (WorldEngine.state?.teams || []).find(item => !item.travelProfileAdapter && (item.roster || []).some(rosterPlayer => rosterPlayer?.isCareerPlayer === true || ids.has(String(rosterPlayer?.playerId || rosterPlayer?.id || ''))));
    return team?.teamId || null;
  }

  function install() {
    injectStyle();
    if (typeof WorldEngine.openTravelTeamProfile !== 'function' || WorldEngine.__travelProfileRepairV3Wrapped) return false;

    const original = WorldEngine.openTravelTeamProfile.bind(WorldEngine);
    WorldEngine.__travelProfileRepairV3Wrapped = true;
    WorldEngine.openTravelTeamProfile = function(teamId) {
      const state = WorldEngine.rebuildTravelHockeyRosters?.() || travel();
      activeTravelTeam = (state?.teams || []).find(team => String(team.teamId) === String(teamId)) || null;
      try { restoreTeamId = typeof Game !== 'undefined' ? Game.teamTabSelectedTeamId : null; } catch (_) { restoreTeamId = null; }

      const result = original(teamId);
      requestAnimationFrame(() => {
        patchOpenedProfile(activeTravelTeam);
        const id = restoreTeamId || realCareerTeamId();
        try { if (typeof Game !== 'undefined' && id) Game.teamTabSelectedTeamId = id; } catch (_) {}
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

    if (event.target?.closest?.('#btn-back-team-profile')) {
      activeTravelTeam = null;
      restoreTeamId = null;
    }
  }, true);

  install();
  setTimeout(install, 50);
  setTimeout(install, 150);
  setTimeout(install, 350);
  setTimeout(install, 800);
})();
