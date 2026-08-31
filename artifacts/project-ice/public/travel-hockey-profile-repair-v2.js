'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const STYLE_ID = 'pi-travel-profile-repair-v2-style';
  let activeTravelTeam = null;

  const travel = () => WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  const idOf = p => String(p?.playerId || p?.id || '');
  const sourceIdOf = p => String(p?.sourcePlayerId || p?.playerId || p?.id || '');
  const nameOf = p => String(p?.name || p?.playerName || [p?.firstName,p?.lastName].filter(Boolean).join(' ').trim() || 'Player');
  const ovr = p => Number(p?.overall ?? p?.ovr ?? p?.rating ?? 0);
  const pos = p => {
    const raw = String(p?.position || p?.pos || '').toUpperCase();
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

  function takePreferred(pool, preferred) {
    let index = pool.findIndex(player => pos(player) === preferred);
    if (index < 0) index = 0;
    return index >= 0 ? pool.splice(index, 1)[0] : null;
  }

  function assignNativeSlots(team) {
    if (!Array.isArray(team?.roster)) return team;

    for (const player of team.roster) {
      delete player.rosterSlot;
      delete player.slot;
    }

    const forwards = team.roster.filter(player => !['D','G'].includes(pos(player))).sort((a,b) => ovr(b) - ovr(a));
    const defense = team.roster.filter(player => pos(player) === 'D').sort((a,b) => ovr(b) - ovr(a));
    const goalies = team.roster.filter(player => pos(player) === 'G').sort((a,b) => ovr(b) - ovr(a));
    const forwardPool = [...forwards];

    for (let line = 1; line <= 4; line += 1) {
      const lw = takePreferred(forwardPool, 'LW');
      const c = takePreferred(forwardPool, 'C');
      const rw = takePreferred(forwardPool, 'RW');
      if (lw) lw.rosterSlot = `fwd-${line}-lw`;
      if (c) c.rosterSlot = `fwd-${line}-c`;
      if (rw) rw.rosterSlot = `fwd-${line}-rw`;
    }

    for (let pair = 1; pair <= 3; pair += 1) {
      const ld = defense[(pair - 1) * 2];
      const rd = defense[(pair - 1) * 2 + 1];
      if (ld) ld.rosterSlot = `def-${pair}-ld`;
      if (rd) rd.rosterSlot = `def-${pair}-rd`;
    }

    if (goalies[0]) goalies[0].rosterSlot = 'g-starter';
    if (goalies[1]) goalies[1].rosterSlot = 'g-backup';

    const playerId = player => player ? (player.playerId || player.id || null) : null;
    const fwd = team.roster.filter(player => String(player.rosterSlot || '').startsWith('fwd-')).sort((a,b) => String(a.rosterSlot).localeCompare(String(b.rosterSlot)));
    const def = team.roster.filter(player => String(player.rosterSlot || '').startsWith('def-')).sort((a,b) => String(a.rosterSlot).localeCompare(String(b.rosterSlot)));
    const pp = unit => ({ slots: { leftFlank: playerId(unit[0]), bumper: playerId(unit[1]), rightFlank: playerId(unit[2]), netFront: playerId(unit[3]), quarterback: playerId(unit[4]) } });
    const pk = unit => ({ slots: { leftForward: playerId(unit[0]), rightForward: playerId(unit[1]), leftDefense: playerId(unit[2]), rightDefense: playerId(unit[3]) } });

    team.specialTeams = {
      powerPlay: [pp([...fwd.slice(0,3), ...def.slice(0,2)]), pp([...fwd.slice(3,6), ...def.slice(2,4)])],
      penaltyKill: [pk([...fwd.slice(0,2), ...def.slice(0,2)]), pk([...fwd.slice(2,4), ...def.slice(2,4)])],
    };

    return team;
  }

  function repairTravelWorld() {
    const state = travel();
    if (!state?.teams?.length) return state;
    state.teams.forEach(assignNativeSlots);
    return state;
  }

  function rankRows() {
    let rows = [];
    try { rows = WorldEngine.getProspectRankings?.() || WorldEngine.state?.prospectRankings || WorldEngine.state?.prospects || []; } catch (_) {}
    if (!Array.isArray(rows)) rows = [];
    return [...rows].sort((a,b) => Number(a?.rank ?? a?.prospectRank ?? a?.ranking ?? 9999) - Number(b?.rank ?? b?.prospectRank ?? b?.ranking ?? 9999)).slice(0,100);
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
    return null;
  }

  function decorateNativeCards(root, team) {
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

  function travelLeader(team, key, goalie = false) {
    const pool = (team?.roster || []).filter(player => Number(player?.travelStats?.gp || 0) > 0 && (!goalie || pos(player) === 'G'));
    if (!pool.length) return null;
    return [...pool].sort((a,b) => Number(b.travelStats?.[key] || 0) - Number(a.travelStats?.[key] || 0))[0];
  }

  function patchProfileDom(team) {
    if (!team) return;
    const screen = document.getElementById('team-profile-screen');
    const root = document.getElementById('team-profile-modern-content');
    if (!screen || !root || screen.classList.contains('screen--hidden')) return;

    document.getElementById('pi-travel-clean-lineup')?.remove();
    document.getElementById('pi-travel-clean-leaders')?.remove();
    document.getElementById('pi-travel-profile-roster')?.remove();
    document.getElementById('pi-team-profile-leaders-scope')?.remove();
    root.querySelectorAll('[data-pi-travel-original-lineup],[data-pi-travel-original-leaders]').forEach(element => {
      element.style.display = '';
      delete element.dataset.piTravelOriginalLineup;
      delete element.dataset.piTravelOriginalLeaders;
    });

    const rosterSection = root.querySelector('.team-roster');
    if (rosterSection) rosterSection.style.display = '';

    const leadersSection = root.querySelector('.team-leaders');
    if (leadersSection) {
      leadersSection.style.display = '';
      const label = leadersSection.querySelector('.team-section-label');
      if (label) label.textContent = 'Travel Leaders';
      leadersSection.querySelectorAll('[id*="scope"],.team-leader-scope,.team-leader-scope-control').forEach(node => node.remove());
      const set = (suffix, value) => {
        const element = leadersSection.querySelector(`[id$="${suffix}"]`);
        if (element) element.textContent = value;
      };
      const goals = travelLeader(team, 'g');
      const assists = travelLeader(team, 'a');
      const points = travelLeader(team, 'pts');
      const goalieWins = travelLeader(team, 'wins', true) || travelLeader(team, 'w', true);
      const savePct = (team.roster || []).filter(player => pos(player) === 'G' && Number(player?.travelStats?.gp || 0) > 0).sort((a,b) => Number(b.travelStats?.savePercentage || 0) - Number(a.travelStats?.savePercentage || 0))[0];
      set('team-leader-goals', goals ? `${nameOf(goals)} · ${Number(goals.travelStats.g || 0)}` : 'No stats yet');
      set('team-leader-assists', assists ? `${nameOf(assists)} · ${Number(assists.travelStats.a || 0)}` : 'No stats yet');
      set('team-leader-points', points ? `${nameOf(points)} · ${Number(points.travelStats.pts || 0)}` : 'No stats yet');
      set('team-leader-wins', goalieWins ? `${nameOf(goalieWins)} · ${Number(goalieWins.travelStats.wins || goalieWins.travelStats.w || 0)}` : 'No stats yet');
      set('team-leader-save-percentage', savePct ? `${nameOf(savePct)} · ${Number(savePct.travelStats.savePercentage || 0).toFixed(3)}` : 'No stats yet');
    }

    decorateNativeCards(root, team);
  }

  function realCareerTeamId() {
    const player = WorldEngine.state?.player || {};
    const ids = new Set([String(player.playerId || ''), String(player.id || ''), 'career-player'].filter(Boolean));
    const team = (WorldEngine.state?.teams || []).find(item => !item.travelProfileAdapter && (item.roster || []).some(rosterPlayer => rosterPlayer?.isCareerPlayer === true || ids.has(String(rosterPlayer?.playerId || rosterPlayer?.id || ''))));
    return team?.teamId || null;
  }

  function cleanupAdapterAndRestore(restoreId) {
    if (Array.isArray(WorldEngine.state?.teams)) {
      WorldEngine.state.teams = WorldEngine.state.teams.filter(team => team?.travelProfileAdapter !== true);
    }
    const id = restoreId || realCareerTeamId();
    try { if (typeof Game !== 'undefined' && id) Game.teamTabSelectedTeamId = id; } catch (_) {}
    try { if (id && typeof globalThis.renderTeamTab === 'function') globalThis.renderTeamTab(id); } catch (_) {}
  }

  function install() {
    injectStyle();
    repairTravelWorld();
    if (typeof WorldEngine.openTravelTeamProfile !== 'function' || WorldEngine.__travelProfileRepairV2Wrapped) return;

    const original = WorldEngine.openTravelTeamProfile.bind(WorldEngine);
    WorldEngine.__travelProfileRepairV2Wrapped = true;
    WorldEngine.openTravelTeamProfile = function(teamId) {
      repairTravelWorld();
      const state = travel();
      const team = (state?.teams || []).find(item => String(item.teamId) === String(teamId));
      if (team) assignNativeSlots(team);

      let restoreId = null;
      try { restoreId = typeof Game !== 'undefined' ? Game.teamTabSelectedTeamId : null; } catch (_) {}
      activeTravelTeam = team || null;

      const result = original(teamId);
      requestAnimationFrame(() => {
        patchProfileDom(activeTravelTeam);
        cleanupAdapterAndRestore(restoreId);
      });
      return result;
    };
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
        let target = player;
        if (player.isRealProspect === true && player.sourcePlayerId) target = WorldEngine.getPlayerById?.(player.sourcePlayerId) || player;
        if (typeof globalThis.openPlayerProfile === 'function') globalThis.openPlayerProfile(target, 'hub');
      }
    }

    if (event.target?.closest?.('#btn-back-team-profile,.hub-nav__tab')) {
      activeTravelTeam = null;
      cleanupAdapterAndRestore(null);
    }
  }, true);

  // Deliberately no MutationObserver here. The previous implementation observed
  // the entire document and then removed/re-added prospect badges inside its own
  // callback, which created a self-sustaining childList mutation loop on iPhone.
  // Profile patching is now deterministic: once, immediately after the canonical
  // profile is opened.
  install();
  setTimeout(install, 100);
  setTimeout(install, 350);
  setTimeout(install, 800);
})();
