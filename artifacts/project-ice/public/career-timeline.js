'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__careerTimelineInstalled === true) return;
  WorldEngine.__careerTimelineInstalled = true;

  const VERSION = 1;
  const ROOT_ID = 'pp-career-timeline';
  const STYLE_ID = 'pi-career-timeline-styles';
  const CLASS_BY_GRADE = { 9:'Freshman', 10:'Sophomore', 11:'Junior', 12:'Senior' };

  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clean = value => String(value || '').trim();
  const idOf = player => String(player?.playerId || player?.id || 'career-player');

  function careerPlayer() {
    return WorldEngine.getCareerPlayer?.() ||
      (WorldEngine.getAllWorldPlayers?.() || []).find(player => player?.isCareerPlayer === true) ||
      WorldEngine.state?.player || Game?.player || null;
  }

  function currentDate() {
    return clean(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.currentDate ||
      Game?.player?.currentDate
    ).slice(0,10);
  }

  function seasonStartYear() {
    return Number(
      WorldEngine.getCanonicalHighSchoolSeasonStartYear?.() ||
      WorldEngine.state?.season?.seasonStartYear ||
      currentDate().slice(0,4)
    ) || 2023;
  }

  function seasonLabel(startYear) {
    const start = Number(startYear);
    return `${start}-${String(start + 1).slice(-2)}`;
  }

  function seasonDate(startYear, monthDay = '09-01') {
    return `${Number(startYear)}-${monthDay}`;
  }

  function teamFor(player) {
    return (WorldEngine.state?.teams || []).find(team =>
      String(team?.teamId || '') === String(player?.teamId || '')
    ) || null;
  }

  function teamName(player) {
    const team = teamFor(player);
    return clean(
      team?.schoolName && team?.teamName
        ? `${team.schoolName} ${team.teamName}`
        : team?.teamName || team?.name || team?.schoolName || team?.abbreviation || 'High School Team'
    );
  }

  function historyRoot(player = careerPlayer()) {
    if (!player) return null;
    player.history = player.history && typeof player.history === 'object' ? player.history : {};
    player.history.careerTimeline = Array.isArray(player.history.careerTimeline)
      ? player.history.careerTimeline
      : [];
    return player.history.careerTimeline;
  }

  function normalizeEvent(event = {}) {
    const date = clean(event.date).slice(0,10) || currentDate() || null;
    const title = clean(event.title || event.name || 'Career Moment');
    const type = clean(event.type || 'milestone').toLowerCase();
    const key = clean(event.key || `${date || 'undated'}:${type}:${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`);
    return {
      version: VERSION,
      key,
      date,
      type,
      title,
      subtitle: clean(event.subtitle),
      detail: clean(event.detail || event.description),
      seasonLabel: clean(event.seasonLabel || event.season),
      icon: clean(event.icon),
      source: clean(event.source || 'career'),
    };
  }

  function upsertEvent(event, options = {}) {
    const player = careerPlayer();
    const root = historyRoot(player);
    if (!player || !root) return null;
    const next = normalizeEvent(event);
    const index = root.findIndex(item => clean(item?.key) === next.key);
    if (index >= 0) root[index] = { ...root[index], ...next };
    else root.push(next);
    if (options.save !== false) WorldEngine.save?.();
    return next;
  }

  function statsSummary(stats = {}) {
    const gp = num(stats.gamesPlayed ?? stats.gp);
    const goals = num(stats.goals ?? stats.g);
    const assists = num(stats.assists ?? stats.a);
    const points = num(stats.points ?? stats.pts ?? (goals + assists));
    return `${gp} GP · ${goals} G · ${assists} A · ${points} PTS`;
  }

  function seedCareerStart(player) {
    const firstStart = 2023;
    upsertEvent({
      key:`career-start:${idOf(player)}`,
      date:seasonDate(firstStart),
      type:'career-start',
      icon:'🏒',
      title:'High School Career Begins',
      subtitle:`Freshman · ${teamName(player)}`,
      detail:'Your four-year high school hockey journey begins.',
      seasonLabel:seasonLabel(firstStart),
      source:'career-time',
    }, {save:false});
  }

  function seedCompletedSeasons(player) {
    const rows = Array.isArray(player?.highSchoolSeasonHistory) ? player.highSchoolSeasonHistory : [];
    for (const row of rows) {
      const start = Number(row?.seasonStartYear);
      if (!Number.isFinite(start)) continue;
      const grade = Number(row?.grade);
      const className = CLASS_BY_GRADE[grade] || row?.level || 'High School';
      const stats = row?.regularSeasonStats || {};
      const ovr = num(row?.overall);
      upsertEvent({
        key:`hs-season-complete:${start}`,
        date:`${start + 1}-08-31`,
        type:'season',
        icon:'📅',
        title:`${className} Season Complete`,
        subtitle:`${row?.teamAbbreviation || teamName(player)} · ${seasonLabel(start)}`,
        detail:`${statsSummary(stats)}${ovr ? ` · ${ovr} OVR` : ''}`,
        seasonLabel:seasonLabel(start),
        source:'high-school-season-history',
      }, {save:false});
    }
  }

  function seedCurrentSeason(player) {
    const start = seasonStartYear();
    if (start <= 2023) return;
    const grade = 9 + (start - 2023);
    const className = CLASS_BY_GRADE[grade] || clean(player?.schoolYear || player?.year) || 'High School';
    upsertEvent({
      key:`hs-season-start:${start}`,
      date:seasonDate(start),
      type:'season-start',
      icon:'❄️',
      title:`${className} Season Begins`,
      subtitle:`${teamName(player)} · ${seasonLabel(start)}`,
      detail:'A new high school season begins.',
      seasonLabel:seasonLabel(start),
      source:'career-time',
    }, {save:false});
  }

  function seedAwards(player) {
    const awards = WorldEngine.getPlayerAwardHistory?.(player) || player?.history?.awards || [];
    for (const award of awards || []) {
      const title = clean(award?.title || award?.name || award?.awardName || 'League Award');
      const label = clean(award?.seasonLabel || award?.season || award?.year || 'High School');
      upsertEvent({
        key:`award:${award?.key || `${label}:${title}`}`,
        date:clean(award?.date).slice(0,10) || null,
        type:'award',
        icon:'🏆',
        title,
        subtitle:`${label} · High School`,
        detail:'Individual award earned.',
        seasonLabel:label,
        source:'player-award-history',
      }, {save:false});
    }
  }

  function reconcile() {
    const player = careerPlayer();
    if (!player) return [];
    seedCareerStart(player);
    seedCompletedSeasons(player);
    seedCurrentSeason(player);
    seedAwards(player);
    const root = historyRoot(player) || [];
    root.sort((a,b) => clean(a?.date || '9999').localeCompare(clean(b?.date || '9999')) || clean(a?.title).localeCompare(clean(b?.title)));
    return root;
  }

  function iconFor(event) {
    if (event?.icon) return event.icon;
    return ({
      'career-start':'🏒', season:'📅', 'season-start':'❄️', award:'🏆',
      championship:'🏆', promotion:'⬆️', milestone:'⭐', team:'🛡️'
    })[event?.type] || '•';
  }

  function prettyDate(value) {
    const key = clean(value).slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return '';
    const [y,m,d] = key.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  }

  function escapeHtml(value) {
    return clean(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}.pi-career-timeline{display:flex;flex-direction:column;gap:0;border:1px solid rgba(89,145,226,.2);border-radius:16px;background:rgba(5,18,35,.38);overflow:hidden}
      .pi-timeline-row{display:grid;grid-template-columns:42px minmax(0,1fr);gap:12px;padding:16px 16px 15px;position:relative}
      .pi-timeline-row+ .pi-timeline-row{border-top:1px solid rgba(96,145,210,.14)}
      .pi-timeline-marker{display:flex;flex-direction:column;align-items:center;position:relative}
      .pi-timeline-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(49,112,202,.18);border:1px solid rgba(86,153,245,.28);font-size:17px;z-index:1}
      .pi-timeline-line{position:absolute;top:34px;bottom:-16px;width:1px;background:rgba(96,145,210,.22)}
      .pi-timeline-row:last-child .pi-timeline-line{display:none}
      .pi-timeline-date{display:block;color:#6681a7;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
      .pi-timeline-title{display:block;color:#f2f7ff;font-size:16px;line-height:1.2;margin-bottom:4px}
      .pi-timeline-subtitle{display:block;color:#89a4ca;font-size:12px;line-height:1.35}
      .pi-timeline-detail{margin:7px 0 0;color:#a8b9d1;font-size:12px;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return false;
    injectStyles();
    const events = reconcile();
    if (!events.length) return false;
    root.classList.add('pi-career-timeline');
    root.innerHTML = [...events].reverse().map(event => `
      <article class="pi-timeline-row" data-timeline-key="${escapeHtml(event.key)}">
        <div class="pi-timeline-marker">
          <span class="pi-timeline-icon">${escapeHtml(iconFor(event))}</span>
          <span class="pi-timeline-line"></span>
        </div>
        <div class="pi-timeline-copy">
          <span class="pi-timeline-date">${escapeHtml(prettyDate(event.date) || event.seasonLabel || 'Career')}</span>
          <strong class="pi-timeline-title">${escapeHtml(event.title)}</strong>
          ${event.subtitle ? `<span class="pi-timeline-subtitle">${escapeHtml(event.subtitle)}</span>` : ''}
          ${event.detail ? `<p class="pi-timeline-detail">${escapeHtml(event.detail)}</p>` : ''}
        </div>
      </article>
    `).join('');
    return true;
  }

  function scheduleRender() {
    requestAnimationFrame(() => requestAnimationFrame(render));
  }

  document.addEventListener('click', event => {
    const tab = event.target?.closest?.('[data-tab], [data-hub-tab], [data-tab-target], .hub-tab');
    const label = clean(tab?.dataset?.tab || tab?.dataset?.hubTab || tab?.dataset?.tabTarget || tab?.textContent).toLowerCase();
    if (label.includes('player')) scheduleRender();
  });

  window.addEventListener('projectice:player-season-recap-complete', scheduleRender);
  window.addEventListener('projectice:next-high-school-season-started', scheduleRender);

  const originalSave = typeof WorldEngine.save === 'function' ? WorldEngine.save.bind(WorldEngine) : null;
  if (originalSave && !WorldEngine.save.__careerTimelineWrapped) {
    const wrappedSave = function(...args) {
      reconcile();
      return originalSave(...args);
    };
    wrappedSave.__careerTimelineWrapped = true;
    WorldEngine.save = wrappedSave;
  }

  WorldEngine.addCareerTimelineEvent = upsertEvent;
  WorldEngine.reconcileCareerTimeline = reconcile;
  WorldEngine.renderCareerTimeline = render;

  reconcile();
  scheduleRender();
})();