'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__nextHighSchoolSeasonTransitionInstalled === true) return;
  WorldEngine.__nextHighSchoolSeasonTransitionInstalled = true;

  const ROOT_ID = 'pi-next-season-cutscene';
  const STYLE_ID = 'pi-next-season-cutscene-styles';

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const state = () => WorldEngine.state || null;

  function recapState() {
    const world = state();
    if (!world) return null;
    world.seasonTransition = world.seasonTransition && typeof world.seasonTransition === 'object'
      ? world.seasonTransition
      : {};
    world.seasonTransition.recap = world.seasonTransition.recap && typeof world.seasonTransition.recap === 'object'
      ? world.seasonTransition.recap
      : {};
    return world.seasonTransition.recap;
  }

  function activeArchive() {
    const recap = recapState();
    if (recap?.archiveId) {
      const explicit = WorldEngine.getHighSchoolSeasonArchive?.(recap.archiveId);
      if (explicit) return explicit;
    }
    const archives = WorldEngine.getHighSchoolSeasonArchives?.() || [];
    return archives[archives.length - 1] || null;
  }

  function nextIdentity() {
    const recap = recapState();
    const archive = activeArchive();
    const archivedIndex = Number(archive?.identity?.careerYearIndex);
    let nextIndex = Number.isFinite(Number(recap?.nextCareerYearIndex))
      ? Number(recap.nextCareerYearIndex)
      : (Number.isFinite(archivedIndex) ? archivedIndex + 1 : 1);

    /*
     * The long-lived synthetic dev baseline carries stale senior/2022 labels.
     * It exists only to test the freshman lifecycle without replaying months of
     * gameplay, so keep its rollover fixture explicitly Freshman -> Sophomore.
     */
    if (archive?.syntheticDevFixture === true) nextIndex = 1;

    return WorldEngine.getHighSchoolSeasonIdentity?.(nextIndex) || null;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100260;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 35%,rgba(49,108,195,.24),transparent 34%),linear-gradient(180deg,#020914,#061528);color:#fff;opacity:0;transition:opacity .45s ease}
      #${ROOT_ID}.is-visible{opacity:1}
      .pi-ns-shell{width:min(100%,620px);text-align:center}
      .pi-ns-kicker{color:#7fb4ff;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;opacity:.9}
      .pi-ns-title{margin:14px 0 4px;font-size:42px;line-height:1;letter-spacing:-.045em;font-weight:950}
      .pi-ns-sub{margin:10px 0 0;color:#8da5c2;font-size:15px}
      .pi-ns-line{width:64px;height:2px;margin:24px auto;background:linear-gradient(90deg,transparent,#77aefe,transparent)}
      .pi-ns-date{color:#bed5f2;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .pi-ns-phase{opacity:0;transform:translateY(8px);transition:opacity .45s ease,transform .45s ease}
      .pi-ns-phase.is-active{opacity:1;transform:translateY(0)}
    `;
    document.head.appendChild(style);
  }

  function ensureRoot() {
    injectStyles();
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    root.innerHTML = '<div class="pi-ns-shell"><div class="pi-ns-phase" id="pi-ns-phase"></div></div>';
    requestAnimationFrame(() => root.classList.add('is-visible'));
    return root;
  }

  async function phase(root, html, duration = 1450) {
    const node = root.querySelector('#pi-ns-phase');
    if (!node) return;
    node.classList.remove('is-active');
    await wait(180);
    node.innerHTML = html;
    requestAnimationFrame(() => node.classList.add('is-active'));
    await wait(duration);
  }

  function syncDateCopies(date) {
    const world = state();
    if (!world || !dateKey(date)) return;
    world.currentDate = date;
    world.player = world.player || {};
    world.player.currentDate = date;
    if (world.season) world.season.currentDate = date;
    const career = (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true);
    if (career) career.currentDate = date;
    if (typeof Game !== 'undefined' && Game?.player) Game.player.currentDate = date;
  }

  function seedNextSeasonIdentity(identity) {
    const world = state();
    if (!world || !identity) return false;

    world.currentSeason = identity.label;
    world.currentYear = identity.startYear;
    world.currentWeek = 1;

    world.season = {
      ...(world.season || {}),
      id: identity.seasonId,
      seasonId: identity.seasonId,
      label: identity.label,
      seasonLabel: identity.label,
      seasonNumber: identity.careerYearIndex + 1,
      careerYear: identity.careerYearIndex + 1,
      careerYearIndex: identity.careerYearIndex,
      schoolYear: identity.schoolYear,
      seasonStartYear: identity.startYear,
      seasonEndYear: identity.endYear,
      currentDate: identity.startDate,
      currentWeek: 1,
      phase: 'preseason',
      status: 'active',
      level: 'high-school',
      regularSeason: {
        started: false,
        completed: false,
        gamesPerTeam: Number(world?.season?.regularSeason?.gamesPerTeam || 28),
      },
      postseason: {
        qualified: false,
        started: false,
        completed: false,
      },
      processedDates: [],
      processedWeeks: [],
      weeklyHistory: [],
      unresolvedEventIds: [],
      completedEventIds: [],
      lastProcessedDate: null,
      lastProcessedWeek: 0,
    };

    world.player = world.player || {};
    world.player.year = identity.schoolYear;
    world.player.schoolYear = identity.schoolYear;
    if (typeof Game !== 'undefined' && Game?.player) {
      Game.player.year = identity.schoolYear;
      Game.player.schoolYear = identity.schoolYear;
    }

    syncDateCopies(identity.startDate);
    WorldEngine.syncPlayerAges?.(world, identity.startDate);

    const recap = recapState();
    if (recap) {
      recap.nextSeasonTransitionComplete = true;
      recap.nextSeasonTransitionCompletedAt = identity.startDate;
      recap.nextSeasonId = identity.seasonId;
      recap.nextCareerYearIndex = identity.careerYearIndex;
    }

    return true;
  }

  async function runTransition(options = {}) {
    const recap = recapState();
    if (!recap || recap.playerRecapAcknowledged !== true) return false;
    if (recap.nextSeasonTransitionComplete === true && options.force !== true) return false;

    const identity = nextIdentity();
    if (!identity) return false;

    document.getElementById('pi-player-season-recap-screen')?.remove();
    const root = ensureRoot();

    await phase(root, `
      <div class="pi-ns-kicker">Project Ice</div>
      <div class="pi-ns-title">Freshman Year Complete</div>
      <div class="pi-ns-sub">One chapter closes.</div>
    `, 1300);

    await phase(root, `
      <div class="pi-ns-kicker">Year ${identity.careerYearIndex + 1}</div>
      <div class="pi-ns-title">${identity.schoolYear} Season</div>
      <div class="pi-ns-sub">${identity.label}</div>
      <div class="pi-ns-line"></div>
      <div class="pi-ns-date">A new season begins</div>
    `, 1650);

    seedNextSeasonIdentity(identity);
    await WorldEngine.save?.();

    await phase(root, `
      <div class="pi-ns-kicker">Back to School</div>
      <div class="pi-ns-title">September 1</div>
      <div class="pi-ns-sub">${identity.startYear} · ${identity.schoolYear} season</div>
      <div class="pi-ns-line"></div>
      <div class="pi-ns-date">Returning tryouts are next</div>
    `, 1350);

    root.classList.remove('is-visible');
    await wait(460);
    root.remove();

    try { window.refreshCareerUI?.(); } catch (_) {}
    try { window.updateHubScreen?.(); } catch (_) {}
    try { window.openHubTab?.('home'); } catch (_) {}

    window.dispatchEvent(new CustomEvent('projectice:next-high-school-season-started', {
      detail: {
        seasonId: identity.seasonId,
        careerYearIndex: identity.careerYearIndex,
        schoolYear: identity.schoolYear,
        startDate: identity.startDate,
        tryoutDate: identity.tryoutDate,
      },
    }));

    return true;
  }

  window.addEventListener('projectice:player-season-recap-complete', () => {
    runTransition({ force: true }).catch(error => {
      console.error('[Project Ice] Next-season transition failed:', error);
      alert(`Next-season transition failed: ${error?.message || error}`);
    });
  });

  WorldEngine.runNextHighSchoolSeasonTransition = runTransition;
})();
