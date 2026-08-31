'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  let selectedScope = 'regular-season';
  const nameOf = p => `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.name || p?.playerName || 'Unknown Player';
  const root = () => document.getElementById('team-profile-modern-content');
  const visible = () => {
    const s = document.getElementById('team-profile-screen');
    return Boolean(s && !s.classList.contains('screen--hidden'));
  };
  const travelTeam = () => {
    const id = String(root()?.dataset?.travelTeamId || '');
    const state = WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
    return id ? (state?.teams || []).find(t => String(t?.teamId || '') === id) || null : null;
  };

  function profileTeam() {
    const travel = travelTeam();
    if (travel) return travel;
    const r = root();
    if (!r) return null;
    const hero = String(r.querySelector('.team-profile-style-hero')?.textContent || r.textContent || '').toLowerCase();
    return (WorldEngine.state?.teams || []).find(t => {
      if (t?.travelProfileAdapter) return false;
      const full = `${t?.schoolName || ''} ${t?.teamName || ''}`.trim().toLowerCase();
      return full && hero.includes(full);
    }) || null;
  }

  function statsOf(player, isTravel) {
    if (!isTravel) return WorldEngine.getPlayerStatsByScope?.(player, selectedScope) || null;
    const s = player?.travelStats || {};
    return {
      gamesPlayed: Number(s.gp ?? s.gamesPlayed ?? 0),
      goals: Number(s.g ?? s.goals ?? 0),
      assists: Number(s.a ?? s.assists ?? 0),
      points: Number(s.pts ?? s.points ?? 0),
      wins: Number(s.wins ?? s.w ?? 0),
      savePercentage: Number(s.savePercentage ?? s.svPct ?? 0),
    };
  }

  function best(entries, key, secondary = null) {
    return [...entries].sort((a,b) =>
      Number(b.stats?.[key] || 0) - Number(a.stats?.[key] || 0) ||
      (secondary ? Number(b.stats?.[secondary] || 0) - Number(a.stats?.[secondary] || 0) : 0) ||
      nameOf(a.player).localeCompare(nameOf(b.player))
    )[0] || null;
  }

  function renderValues(team, isTravel) {
    const r = root();
    const section = r?.querySelector('.team-leaders');
    if (!section || !team) return false;
    const roster = Array.isArray(team.roster) ? team.roster : [];
    const entries = roster.map(player => ({ player, stats: statsOf(player,isTravel) }));
    const skaters = entries.filter(e => String(e.player?.position || '').toUpperCase() !== 'G' && Number(e.stats?.gamesPlayed || 0) > 0);
    const goalies = entries.filter(e => String(e.player?.position || '').toUpperCase() === 'G' && Number(e.stats?.gamesPlayed || 0) > 0);
    const goals = best(skaters,'goals','points');
    const assists = best(skaters,'assists','points');
    const points = [...skaters].sort((a,b) => Number(b.stats?.points || 0)-Number(a.stats?.points || 0) || Number(b.stats?.goals || 0)-Number(a.stats?.goals || 0))[0] || null;
    const wins = best(goalies,'wins','savePercentage');
    const sv = best(goalies,'savePercentage','wins');
    const format = (entry,key,fn=v=>String(v)) => entry ? `${nameOf(entry.player)} · ${fn(entry.stats?.[key] || 0)}` : 'No stats yet';
    const values = {
      'team-leader-goals': format(goals,'goals'),
      'team-leader-assists': format(assists,'assists'),
      'team-leader-points': format(points,'points'),
      'team-leader-wins': format(wins,'wins'),
      'team-leader-save-percentage': format(sv,'savePercentage',v=>Number(v||0).toFixed(3).replace(/^0/,'')),
    };
    Object.entries(values).forEach(([id,text]) => {
      const el = r.querySelector(`[id="${id}"]`);
      if (el) el.textContent = text;
    });
    const label = section.querySelector('.team-section-label');
    if (label) label.textContent = isTravel ? 'Travel Leaders' : 'Team Leaders';
    return true;
  }

  function bindNativeControl(team, isTravel) {
    const r = root();
    if (!r) return;
    r.querySelector('#pi-team-profile-leaders-scope')?.remove();
    const control = r.querySelector('#pi-team-leaders-scope');
    if (isTravel) {
      if (control) control.style.display = 'none';
      selectedScope = 'regular-season';
      return;
    }
    if (!control) return;
    control.style.display = '';
    if (control.dataset.piProfileBound !== 'true') {
      control.dataset.piProfileBound = 'true';
      control.addEventListener('click', event => {
        const button = event.target.closest('button[data-scope]');
        if (!button) return;
        selectedScope = button.dataset.scope === 'playoffs' ? 'playoffs' : 'regular-season';
        control.querySelectorAll('button[data-scope]').forEach(b => {
          const on = b.dataset.scope === selectedScope;
          b.classList.toggle('is-active',on);
          b.setAttribute('aria-pressed',on ? 'true' : 'false');
        });
        renderValues(team,false);
      });
    }
    control.querySelectorAll('button[data-scope]').forEach(b => {
      const on = b.dataset.scope === selectedScope;
      b.classList.toggle('is-active',on);
      b.setAttribute('aria-pressed',on ? 'true' : 'false');
    });
  }

  function render() {
    if (!visible()) return false;
    const team = profileTeam();
    if (!team) return false;
    const isTravel = Boolean(travelTeam());
    if (!isTravel) WorldEngine.rebuildHighSchoolPostseasonStats?.();
    bindNativeControl(team,isTravel);
    renderValues(team,isTravel);
    const full = root()?.querySelector('#profile-team-view-full-stats');
    if (full && full.dataset.piProfileScopeBound !== 'true') {
      full.dataset.piProfileScopeBound = 'true';
      full.addEventListener('click',()=>{ if (typeof Game !== 'undefined') Game.fullStatsScope = selectedScope; },true);
    }
    return true;
  }

  const afterCore = () => requestAnimationFrame(() => requestAnimationFrame(render));
  document.addEventListener('click',afterCore);
  document.addEventListener('change',e=>{ if(e.target?.closest?.('#team-profile-screen')) afterCore(); });
  WorldEngine.renderScopedTeamProfileLeaders = render;
})();
