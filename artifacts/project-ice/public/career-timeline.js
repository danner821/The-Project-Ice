'use strict';

/* global WorldEngine, Game */
(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__careerTimelineInstalled === true) return;
  WorldEngine.__careerTimelineInstalled = true;

  const VERSION = 3;
  const ROOT_ID = 'pp-career-timeline';
  const STYLE_ID = 'pi-career-timeline-styles';
  const CLASS_BY_GRADE = { 9:'Freshman', 10:'Sophomore', 11:'Junior', 12:'Senior' };
  const MILESTONE_STEP = 100;

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

  function startYearFromLabel(label) {
    const match = clean(label).match(/^(\d{4})-/);
    return match ? Number(match[1]) : null;
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

  function trackingRoot(player = careerPlayer()) {
    if (!player) return null;
    player.history = player.history && typeof player.history === 'object' ? player.history : {};
    player.history.timelineTracking = player.history.timelineTracking && typeof player.history.timelineTracking === 'object'
      ? player.history.timelineTracking
      : {};
    const root = player.history.timelineTracking;
    root.version = VERSION;
    root.levels = root.levels && typeof root.levels === 'object' ? root.levels : {};
    return root;
  }

  function normalizeEvent(event = {}) {
    const explicitNullDate = Object.prototype.hasOwnProperty.call(event, 'date') && event.date === null;
    const date = explicitNullDate ? null : (clean(event.date).slice(0,10) || currentDate() || null);
    const title = clean(event.title || event.name || 'Career Moment');
    const type = clean(event.type || 'milestone').toLowerCase();
    const key = clean(event.key || `${date || event.seasonLabel || 'undated'}:${type}:${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`);
    return {
      version: VERSION,
      key,
      date,
      sortDate: clean(event.sortDate).slice(0,10) || date || null,
      type,
      title,
      subtitle: clean(event.subtitle),
      detail: clean(event.detail || event.description),
      seasonLabel: clean(event.seasonLabel || event.season),
      level: clean(event.level),
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

  function statLine(stats = {}) {
    const goals = num(stats.goals ?? stats.g);
    const assists = num(stats.assists ?? stats.a);
    const points = num(stats.points ?? stats.pts ?? (goals + assists));
    return { goals, assists, points };
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
      level:'High School',
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
        level:'High School',
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
      level:'High School',
      source:'career-time',
    }, {save:false});
  }

  function seedAwards(player) {
    const awards = WorldEngine.getPlayerAwardHistory?.(player) || player?.history?.awards || [];
    for (const award of awards || []) {
      const title = clean(award?.title || award?.name || award?.awardName || 'League Award');
      const awardId = clean(award?.awardId || award?.id).toLowerCase();
      if (award?.championship === true || award?.teamAward === true || awardId === 'high-school-champion') continue;
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
        level:'High School',
        source:'player-award-history',
      }, {save:false});
    }
  }

  function canonicalArchiveDate(archive) {
    const raw = clean(archive?.postseasonCompletedDate || archive?.archivedAt).slice(0,10);
    const endYear = Number(archive?.identity?.endYear);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    if (!Number.isFinite(endYear)) return raw;
    return Number(raw.slice(0,4)) === endYear ? raw : `${endYear}${raw.slice(4)}`;
  }

  function seedChampionships(player) {
    const archives = WorldEngine.getHighSchoolSeasonArchives?.() || WorldEngine.state?.history?.highSchoolSeasons || [];
    for (const archive of archives || []) {
      const playerTeamId = clean(archive?.careerPlayer?.team?.teamId);
      const championTeamId = clean(archive?.champion?.teamId || archive?.championTeamId);
      if (!playerTeamId || !championTeamId || playerTeamId !== championTeamId) continue;
      const label = clean(archive?.identity?.label || archive?.seasonLabel || 'High School');
      const team = clean(
        archive?.champion?.abbreviation ||
        archive?.careerPlayer?.team?.abbreviation ||
        archive?.careerPlayer?.team?.teamName ||
        teamName(player)
      );
      upsertEvent({
        key:`championship:high-school:${archive?.archiveId || label}`,
        date:canonicalArchiveDate(archive),
        type:'championship',
        icon:'🏆',
        title:'High School Champion',
        subtitle:`${team} · ${label}`,
        detail:'Won the high school championship.',
        seasonLabel:label,
        level:'High School',
        source:'high-school-season-archive',
      }, {save:false});
    }
  }

  function completedHighSchoolStats(player) {
    const rows = Array.isArray(player?.highSchoolSeasonHistory) ? player.highSchoolSeasonHistory : [];
    return rows.map(row => ({
      seasonLabel: clean(row?.seasonLabel || (Number.isFinite(Number(row?.seasonStartYear)) ? seasonLabel(Number(row.seasonStartYear)) : '')),
      stats: statLine(row?.regularSeasonStats || {}),
    }));
  }

  function currentHighSchoolCareerStats(player) {
    const completed = completedHighSchoolStats(player);
    const out = completed.reduce((sum, row) => ({
      goals: sum.goals + row.stats.goals,
      assists: sum.assists + row.stats.assists,
      points: sum.points + row.stats.points,
    }), { goals:0, assists:0, points:0 });
    const current = statLine(WorldEngine.getPlayerStatsByScope?.(player, 'regular-season') || player || {});
    out.goals += current.goals;
    out.assists += current.assists;
    out.points += current.points;
    return out;
  }

  function earliestCompletedSeasonWith(player, stat) {
    return completedHighSchoolStats(player).find(row => num(row?.stats?.[stat]) > 0)?.seasonLabel || '';
  }

  function addFirstLevelMoments(levelKey, levelName, stats, previous, metadata = {}) {
    const firstPointKey = `first:${levelKey}:point`;
    const firstGoalKey = `first:${levelKey}:goal`;
    const combinedKey = `first:${levelKey}:goal-and-point`;
    const root = historyRoot() || [];
    const hasPoint = root.some(item => clean(item?.key) === firstPointKey || clean(item?.key) === combinedKey);
    const hasGoal = root.some(item => clean(item?.key) === firstGoalKey || clean(item?.key) === combinedKey);
    const pointCrossed = !hasPoint && previous.points <= 0 && stats.points > 0;
    const goalCrossed = !hasGoal && previous.goals <= 0 && stats.goals > 0;

    if (pointCrossed && goalCrossed && metadata.sameGame !== false) {
      upsertEvent({
        key:combinedKey,
        date:metadata.date ?? currentDate(),
        type:'first',
        icon:'🥅',
        title:`First ${levelName} Goal & Point`,
        subtitle:metadata.subtitle || levelName,
        detail:`Scored the first goal and recorded the first point at the ${levelName} level.`,
        seasonLabel:metadata.seasonLabel || '',
        level:levelName,
        source:'career-stat-milestones',
      }, {save:false});
      return;
    }

    if (pointCrossed) {
      upsertEvent({
        key:firstPointKey,
        date:metadata.date ?? currentDate(),
        type:'first',
        icon:'⭐',
        title:`First ${levelName} Point`,
        subtitle:metadata.subtitle || levelName,
        detail:`Recorded the first point at the ${levelName} level.`,
        seasonLabel:metadata.seasonLabel || '',
        level:levelName,
        source:'career-stat-milestones',
      }, {save:false});
    }

    if (goalCrossed) {
      upsertEvent({
        key:firstGoalKey,
        date:metadata.date ?? currentDate(),
        type:'first',
        icon:'🥅',
        title:`First ${levelName} Goal`,
        subtitle:metadata.subtitle || levelName,
        detail:`Scored the first goal at the ${levelName} level.`,
        seasonLabel:metadata.seasonLabel || '',
        level:levelName,
        source:'career-stat-milestones',
      }, {save:false});
    }
  }

  function addHundredMilestones(levelKey, levelName, stats, previous, metadata = {}) {
    for (const [field, label] of [['points','Career Points'], ['goals','Career Goals'], ['assists','Career Assists']]) {
      const before = Math.max(0, num(previous[field]));
      const after = Math.max(0, num(stats[field]));
      const firstThreshold = Math.floor(before / MILESTONE_STEP) * MILESTONE_STEP + MILESTONE_STEP;
      for (let mark = firstThreshold; mark <= after; mark += MILESTONE_STEP) {
        upsertEvent({
          key:`milestone:${levelKey}:${field}:${mark}`,
          date:metadata.date ?? currentDate(),
          type:'milestone',
          icon:'💯',
          title:`${mark} ${label}`,
          subtitle:metadata.subtitle || levelName,
          detail:`Reached ${mark} ${field} in the career.`,
          seasonLabel:metadata.seasonLabel || '',
          level:levelName,
          source:'career-stat-milestones',
        }, {save:false});
      }
    }
  }

  function recordLevelStats(levelKey, levelName, statsInput, metadata = {}) {
    const player = careerPlayer();
    const tracking = trackingRoot(player);
    if (!player || !tracking) return [];
    const key = clean(levelKey || levelName || 'career').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    const stats = statLine(statsInput || {});
    const previous = tracking.levels[key] && typeof tracking.levels[key] === 'object'
      ? tracking.levels[key]
      : { goals:0, assists:0, points:0, initialized:false };

    if (previous.initialized === true) {
      addFirstLevelMoments(key, levelName, stats, previous, metadata);
      addHundredMilestones(key, levelName, stats, previous, metadata);
    }

    tracking.levels[key] = { ...stats, initialized:true, updatedAt:metadata.date || currentDate() || null };
    return historyRoot(player) || [];
  }

  function seedHighSchoolFirsts(player) {
    const stats = currentHighSchoolCareerStats(player);
    const root = historyRoot(player) || [];
    const tracking = trackingRoot(player);
    const level = tracking?.levels?.['high-school'];

    if (level?.initialized) {
      recordLevelStats('high-school', 'High School', stats, {
        date:currentDate(),
        seasonLabel:seasonLabel(seasonStartYear()),
        subtitle:`${teamName(player)} · ${seasonLabel(seasonStartYear())}`,
        sameGame:true,
      });
      return;
    }

    const hasAnyFirst = root.some(item => clean(item?.key).startsWith('first:high-school:'));
    if (!hasAnyFirst && stats.points > 0) {
      const label = earliestCompletedSeasonWith(player, 'points') || seasonLabel(seasonStartYear());
      const start = startYearFromLabel(label) || seasonStartYear();
      upsertEvent({
        key:'first:high-school:point',
        date:null,
        sortDate:`${start}-12-01`,
        type:'first',
        icon:'⭐',
        title:'First High School Point',
        subtitle:`High School · ${label}`,
        detail:'Recorded the first point of the high school career.',
        seasonLabel:label,
        level:'High School',
        source:'career-stat-backfill',
      }, {save:false});
    }
    if (!hasAnyFirst && stats.goals > 0) {
      const label = earliestCompletedSeasonWith(player, 'goals') || seasonLabel(seasonStartYear());
      const start = startYearFromLabel(label) || seasonStartYear();
      upsertEvent({
        key:'first:high-school:goal',
        date:null,
        sortDate:`${start}-12-02`,
        type:'first',
        icon:'🥅',
        title:'First High School Goal',
        subtitle:`High School · ${label}`,
        detail:'Scored the first goal of the high school career.',
        seasonLabel:label,
        level:'High School',
        source:'career-stat-backfill',
      }, {save:false});
    }

    if (tracking) tracking.levels['high-school'] = { ...stats, initialized:true, updatedAt:currentDate() || null };
  }

  function recordChampionship(options = {}) {
    const levelName = clean(options.level || 'Career');
    return upsertEvent({
      key:clean(options.key || `championship:${levelName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}:${options.seasonLabel || options.date || currentDate()}`),
      date:options.date ?? currentDate(),
      type:'championship',
      icon:options.icon || '🏆',
      title:options.title || `${levelName} Champion`,
      subtitle:options.subtitle || levelName,
      detail:options.detail || `Won the ${levelName} championship.`,
      seasonLabel:options.seasonLabel || '',
      level:levelName,
      source:options.source || 'career-championship',
    });
  }

  function recordCaptaincy(role = 'Captain', options = {}) {
    const normalizedRole = /alternate|assistant|\ba\b/i.test(clean(role)) ? 'Alternate Captain' : 'Captain';
    const levelName = clean(options.level || 'Career');
    return upsertEvent({
      key:clean(options.key || `captaincy:${levelName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}:${normalizedRole.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`),
      date:options.date ?? currentDate(),
      type:'captaincy',
      icon:'©️',
      title:`Named ${normalizedRole}`,
      subtitle:options.subtitle || levelName,
      detail:options.detail || `Leadership role awarded at the ${levelName} level.`,
      seasonLabel:options.seasonLabel || '',
      level:levelName,
      source:options.source || 'career-captaincy',
    });
  }

  function recordTransition(options = {}) {
    return upsertEvent({
      key:clean(options.key || `transition:${options.title || options.level || currentDate()}`),
      date:options.date ?? currentDate(),
      type:options.type || 'transition',
      icon:options.icon || '➡️',
      title:options.title || 'Career Transition',
      subtitle:options.subtitle || clean(options.level),
      detail:options.detail || '',
      seasonLabel:options.seasonLabel || '',
      level:options.level || '',
      source:options.source || 'career-transition',
    });
  }

  function reconcile() {
    const player = careerPlayer();
    if (!player) return [];
    seedCareerStart(player);
    seedCompletedSeasons(player);
    seedCurrentSeason(player);
    seedAwards(player);
    seedChampionships(player);
    seedHighSchoolFirsts(player);
    const root = historyRoot(player) || [];
    root.sort((a,b) => {
      const aDate = clean(a?.sortDate || a?.date || '9999');
      const bDate = clean(b?.sortDate || b?.date || '9999');
      return aDate.localeCompare(bDate) || clean(a?.seasonLabel).localeCompare(clean(b?.seasonLabel)) || clean(a?.title).localeCompare(clean(b?.title));
    });
    return root;
  }

  function iconFor(event) {
    if (event?.icon) return event.icon;
    return ({
      'career-start':'🏒', season:'📅', 'season-start':'❄️', award:'🏆',
      championship:'🏆', promotion:'⬆️', milestone:'💯', first:'⭐',
      captaincy:'©️', transition:'➡️', draft:'🎟️', contract:'✍️', team:'🛡️'
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
  WorldEngine.recordCareerLevelStats = recordLevelStats;
  WorldEngine.recordCareerChampionship = recordChampionship;
  WorldEngine.recordCareerCaptaincy = recordCaptaincy;
  WorldEngine.recordCareerTransition = recordTransition;

  reconcile();
  scheduleRender();
})();