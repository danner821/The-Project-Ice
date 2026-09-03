'use strict';

/* global WorldEngine, Game, EventSystem, SkatingDrill, openTryoutSummary */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__nextHighSchoolSeasonTransitionInstalled === true) return;
  WorldEngine.__nextHighSchoolSeasonTransitionInstalled = true;

  const ROOT_ID = 'pi-next-season-cutscene';
  const STYLE_ID = 'pi-next-season-cutscene-styles';
  const TRYOUT_ROOT_ID = 'pi-hs-tryouts-screen';
  const TRYOUT_STYLE_ID = 'pi-hs-tryouts-styles';
  const CLASS_BY_GRADE = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' };

  const TRYOUT_DRILLS = [
    {
      key: 'skating', label: 'Skating & Pace', icon: '⛸️',
      reps: [
        { title: 'Explode Through the Gate', situation: 'You start flat-footed at the goal line. The coaches want your first three strides to create separation.', options: [
          { label: 'Drive three power strides', note: 'Maximum burst. Tight execution window.', quality: 8, difficulty: .82 },
          { label: 'Use quick compact strides', note: 'Cleaner launch with less top-end burst.', quality: 5, difficulty: .62 },
          { label: 'Build speed gradually', note: 'Safe, but less explosive.', quality: 2, difficulty: .42 },
        ]},
        { title: 'Edgework Gauntlet', situation: 'Four tight cones force two hard direction changes before a sprint out of the turn.', options: [
          { label: 'Attack every cone at full speed', note: 'Highest ceiling if your edges hold.', quality: 8, difficulty: .86 },
          { label: 'Stay low and carve clean edges', note: 'Balanced speed and control.', quality: 6, difficulty: .64 },
          { label: 'Take wider turns', note: 'Safer line, but costs time.', quality: 2, difficulty: .38 },
        ]},
        { title: 'Recovery Race', situation: 'You start a half-step behind and must close the gap before the far blue line.', options: [
          { label: 'Use aggressive crossovers', note: 'Fastest recovery if timed correctly.', quality: 8, difficulty: .82 },
          { label: 'Stay direct and sprint', note: 'Simple line with a solid floor.', quality: 5, difficulty: .58 },
          { label: 'Take a conservative angle', note: 'Limits risk but rarely wins the race.', quality: 2, difficulty: .35 },
        ]},
      ],
    },
    {
      key: 'puckControl', label: 'Puck Skills', icon: '🏒',
      reps: [
        { title: 'Tight-Area Entry', situation: 'A defender shades your forehand and takes away the obvious lane.', options: [
          { label: 'Pull inside and attack the hands', note: 'Creative and dangerous, but turnover-prone.', quality: 8, difficulty: .84 },
          { label: 'Delay and change the angle', note: 'Creates space without forcing the play.', quality: 6, difficulty: .61 },
          { label: 'Chip it behind and retrieve', note: 'Safe possession play.', quality: 3, difficulty: .40 },
        ]},
        { title: 'Seam Passing', situation: 'Two targets flash through a narrow lane while a stick obstacle closes the middle.', options: [
          { label: 'Thread the seam immediately', note: 'Elite play if the timing is perfect.', quality: 8, difficulty: .86 },
          { label: 'Shift the puck, then hit the lane', note: 'Manipulates the obstacle first.', quality: 6, difficulty: .64 },
          { label: 'Reset to the safe outlet', note: 'Keeps possession with less creation.', quality: 2, difficulty: .34 },
        ]},
        { title: 'Finish Under Pressure', situation: 'You get one touch below the hashmarks before the shooting lane closes.', options: [
          { label: 'One-touch quick release', note: 'Hardest execution, highest value.', quality: 8, difficulty: .85 },
          { label: 'Pull and change the release point', note: 'Balanced deception and control.', quality: 6, difficulty: .63 },
          { label: 'Settle the puck before shooting', note: 'Cleaner contact, but the lane may disappear.', quality: 3, difficulty: .42 },
        ]},
      ],
    },
    {
      key: 'scrimmage', label: 'Competitive Scrimmage', icon: '⚡',
      reps: [
        { title: '2-on-1 Rush', situation: 'The defender takes away the pass early while your teammate drives the far post.', options: [
          { label: 'Attack and freeze the defender', note: 'Force a late decision before passing or shooting.', quality: 8, difficulty: .74 },
          { label: 'Use the teammate as a decoy and shoot', note: 'Good read if the goalie cheats pass.', quality: 6, difficulty: .56 },
          { label: 'Force the cross-crease pass', note: 'Flashy if it works, costly if it does not.', quality: 4, difficulty: .82 },
        ]},
        { title: 'Defensive Zone Retrieval', situation: 'You arrive first on a rimmed puck with pressure coming over your shoulder.', options: [
          { label: 'Escape through the middle', note: 'High-value exit if you read pressure correctly.', quality: 8, difficulty: .78 },
          { label: 'Reverse behind the net', note: 'Strong pressure read and possession play.', quality: 6, difficulty: .55 },
          { label: 'Chip it safely off the glass', note: 'Gets out of danger but concedes possession.', quality: 3, difficulty: .30 },
        ]},
        { title: 'Final Shift', situation: 'Thirty seconds remain. The coaches are watching who drives the play.', options: [
          { label: 'Cut to the middle and attack the net', note: 'Assertive finish with real upside.', quality: 8, difficulty: .76 },
          { label: 'Win the wall and extend the cycle', note: 'Shows strength, patience, and possession IQ.', quality: 6, difficulty: .52 },
          { label: 'Keep it safe on the perimeter', note: 'Low mistake risk, little impact.', quality: 2, difficulty: .26 },
        ]},
      ],
    },
  ];

  const dateKey = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const state = () => WorldEngine.state || null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function recapState() {
    const world = state();
    if (!world) return null;
    world.seasonTransition = world.seasonTransition && typeof world.seasonTransition === 'object' ? world.seasonTransition : {};
    world.seasonTransition.recap = world.seasonTransition.recap && typeof world.seasonTransition.recap === 'object' ? world.seasonTransition.recap : {};
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
    let nextIndex = Number.isFinite(Number(recap?.nextCareerYearIndex)) ? Number(recap.nextCareerYearIndex) : (Number.isFinite(archivedIndex) ? archivedIndex + 1 : 1);
    if (archive?.syntheticDevFixture === true) nextIndex = 1;
    return WorldEngine.getHighSchoolSeasonIdentity?.(nextIndex) || null;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `#${ROOT_ID}{position:fixed;inset:0;z-index:100260;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 35%,rgba(49,108,195,.24),transparent 34%),linear-gradient(180deg,#020914,#061528);color:#fff;opacity:0;transition:opacity .45s ease}#${ROOT_ID}.is-visible{opacity:1}.pi-ns-shell{width:min(100%,620px);text-align:center}.pi-ns-kicker{color:#7fb4ff;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;opacity:.9}.pi-ns-title{margin:14px 0 4px;font-size:42px;line-height:1;letter-spacing:-.045em;font-weight:950}.pi-ns-sub{margin:10px 0 0;color:#8da5c2;font-size:15px}.pi-ns-line{width:64px;height:2px;margin:24px auto;background:linear-gradient(90deg,transparent,#77aefe,transparent)}.pi-ns-date{color:#bed5f2;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.pi-ns-phase{opacity:0;transform:translateY(8px);transition:opacity .45s ease,transform .45s ease}.pi-ns-phase.is-active{opacity:1;transform:translateY(0)}`;
    document.head.appendChild(style);
  }

  function injectTryoutStyles() {
    if (document.getElementById(TRYOUT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = TRYOUT_STYLE_ID;
    style.textContent = `#${TRYOUT_ROOT_ID}{position:fixed;inset:0;z-index:100270;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 24px) 18px calc(env(safe-area-inset-bottom,0px) + 30px);background:radial-gradient(circle at 50% 0%,rgba(46,108,205,.34),transparent 31%),linear-gradient(180deg,#07182b,#040d19);color:#f6f9ff}.pi-hst-shell{max-width:620px;margin:0 auto}.pi-hst-kicker{color:#79adf5;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-hst-title{margin:8px 0 6px;font-size:32px;line-height:1;letter-spacing:-.045em}.pi-hst-sub{margin:0;color:#8ca0ba;font-size:12px;line-height:1.55}.pi-hst-card{margin-top:18px;padding:17px;border:1px solid rgba(115,170,247,.16);border-radius:21px;background:linear-gradient(180deg,rgba(19,44,76,.78),rgba(8,24,43,.9))}.pi-hst-head{display:flex;gap:12px;align-items:center}.pi-hst-icon{width:45px;height:45px;display:grid;place-items:center;border-radius:14px;background:rgba(56,121,213,.13);font-size:22px}.pi-hst-head h2{margin:0;font-size:20px}.pi-hst-head p{margin:4px 0 0;color:#7f94ad;font-size:11px}.pi-hst-progress{display:flex;gap:6px;margin:15px 0}.pi-hst-progress i{height:4px;flex:1;border-radius:10px;background:rgba(255,255,255,.08)}.pi-hst-progress i.on{background:#5d9cf2}.pi-hst-sit{padding:14px;border-radius:16px;background:rgba(6,17,31,.48);border:1px solid rgba(255,255,255,.055)}.pi-hst-sit h3{margin:0 0 6px;font-size:16px}.pi-hst-sit p{margin:0;color:#8ea2bc;font-size:11px;line-height:1.52}.pi-hst-choices{display:grid;gap:9px;margin-top:13px}.pi-hst-choice{width:100%;padding:14px 15px;text-align:left;border-radius:15px;border:1px solid rgba(106,165,242,.18);background:rgba(38,83,146,.08);color:#f6f9ff}.pi-hst-choice strong{display:block;font-size:13px}.pi-hst-choice span{display:block;margin-top:4px;color:#7187a3;font-size:10px}.pi-hst-meter{position:relative;height:18px;margin-top:14px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.06)}.pi-hst-zone{position:absolute;left:41%;width:18%;top:0;bottom:0;background:rgba(91,188,134,.34)}.pi-hst-cursor{position:absolute;top:2px;bottom:2px;width:4px;border-radius:5px;background:#fff;transform:translateX(-50%)}.pi-hst-execute,.pi-hst-next{width:100%;margin-top:12px;padding:14px;border:1px solid rgba(111,177,255,.27);border-radius:14px;background:linear-gradient(135deg,#2c6bcf,#1b438d);color:#fff;font-size:13px;font-weight:900}.pi-hst-feedback{margin-top:14px;padding:13px;border-radius:15px;background:rgba(37,81,143,.09);border:1px solid rgba(111,177,255,.14)}.pi-hst-result{text-align:center}.pi-hst-role{font-size:34px;font-weight:950;margin:14px 0 4px}`;
    document.head.appendChild(style);
  }

  function ensureRoot() {
    injectStyles();
    let root = document.getElementById(ROOT_ID);
    if (!root) { root = document.createElement('section'); root.id = ROOT_ID; document.body.appendChild(root); }
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

  function playerGrade(player) {
    const grade = Number(player?.grade);
    if (grade >= 9 && grade <= 12) return grade;
    const label = String(player?.schoolYear || player?.classLevel || player?.year || '').toLowerCase();
    if (label.includes('freshman')) return 9;
    if (label.includes('sophomore')) return 10;
    if (label.includes('junior')) return 11;
    if (label.includes('senior')) return 12;
    return null;
  }

  function resetCurrentSeasonStats(player) {
    if (!player || typeof player !== 'object') return;
    const zero = ['gamesPlayed','gp','goals','g','assists','a','points','pts','plusMinus','pim','penaltyMinutes','shots','shotsOnGoal','sog','wins','w','losses','l','overtimeLosses','otl','goalsAgainst','ga','saves','shotsAgainst','shutouts','so'];
    zero.forEach(key => { if (key in player) player[key] = 0; });
    for (const bucket of ['stats','regularSeasonStats','playoffStats']) {
      if (!player[bucket] || typeof player[bucket] !== 'object') continue;
      Object.keys(player[bucket]).forEach(key => { if (typeof player[bucket][key] === 'number') player[bucket][key] = 0; });
    }
  }

  function advanceReturningClasses(identity) {
    const world = state();
    if (!world) return;
    const career = (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true);
    for (const team of world.teams || []) {
      for (const player of team.roster || []) {
        if (player === career || player?.isCareerPlayer === true) {
          player.grade = 9 + identity.careerYearIndex;
          player.schoolYear = identity.schoolYear;
          player.classLevel = identity.schoolYear;
          player.year = identity.schoolYear;
        } else {
          const grade = playerGrade(player);
          if (grade && grade < 12) {
            player.grade = grade + 1;
            player.schoolYear = CLASS_BY_GRADE[grade + 1];
            player.classLevel = CLASS_BY_GRADE[grade + 1];
            player.year = CLASS_BY_GRADE[grade + 1];
          }
        }
        resetCurrentSeasonStats(player);
      }
    }
    world.player = world.player || {};
    world.player.grade = 9 + identity.careerYearIndex;
    world.player.schoolYear = identity.schoolYear;
    world.player.classLevel = identity.schoolYear;
    world.player.year = identity.schoolYear;
    resetCurrentSeasonStats(world.player);
    if (typeof Game !== 'undefined' && Game?.player) {
      Game.player.grade = 9 + identity.careerYearIndex;
      Game.player.schoolYear = identity.schoolYear;
      Game.player.classLevel = identity.schoolYear;
      Game.player.year = identity.schoolYear;
    }
  }

  function resetTeamStandings() {
    const world = state();
    if (!world) return;
    for (const team of world.teams || []) ['wins','losses','overtimeLosses','points','goalsFor','goalsAgainst'].forEach(key => { team[key] = 0; });
    world.standings = [];
    world.leagueLeaders = null;
    world.currentAwardRaces = null;
  }

  function shiftScheduleToSeason(schedule, targetYear) {
    const dated = (schedule || []).map(event => String(event?.date || '')).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));
    const september = dated.find(value => value.slice(5, 7) === '09');
    const sourceYear = september ? Number(september.slice(0, 4)) : null;
    if (!Number.isFinite(sourceYear)) return schedule || [];
    const delta = Number(targetYear) - sourceYear;
    return (schedule || []).map(event => {
      const copy = { ...event };
      ['date','scheduledDate','gameDate','startDate','endDate'].forEach(field => {
        const value = String(copy?.[field] || '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) copy[field] = `${Number(value.slice(0, 4)) + delta}${value.slice(4)}`;
      });
      return copy;
    });
  }

  function rebuildNewSeasonSchedule(identity) {
    const world = state();
    if (!world || typeof WorldEngine.createHighSchoolCareerSchedule !== 'function') return;
    const generated = WorldEngine.createHighSchoolCareerSchedule(world.teams || []);
    world.schedule = shiftScheduleToSeason(generated, identity.startYear);
    world.schedule = (world.schedule || []).filter(event => {
      const type = String(event?.type || event?.eventType || '').toLowerCase();
      const key = String(event?.eventKey || '').toLowerCase();
      const sameDay = String(event?.date || '') === String(identity.tryoutDate);
      const filler = ['practice','recovery','training','off','rest'].includes(type);
      return !type.includes('tryout') && !key.includes('tryout') && !(sameDay && filler);
    });
    world.schedule.push({
      id: `returning-varsity-tryouts:${identity.seasonId}`,
      eventId: 'tryout-freshman',
      canonicalEventId: `returning-varsity-tryouts:${identity.seasonId}`,
      type: 'tryout', eventType: 'tryout', eventKey: 'returning-varsity-tryouts',
      label: 'Varsity Tryouts', shortLabel: 'Tryouts', icon: '🥅', date: identity.tryoutDate,
      location: 'Home Rink', objective: 'Earn your role for the new season.',
      description: 'You already belong to the program. This year, tryouts determine where you fit in the lineup.',
      requiresPlayerInteraction: true, isCareerEvent: true, preseasonEvent: true, returningYearTryout: true,
      completed: false, played: false, status: 'scheduled',
    });
    world.schedule.sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')));
  }

  function repairSyntheticDevBirthdate(identity, archive) {
    if (archive?.syntheticDevFixture !== true) return;
    const world = state();
    if (!world) return;
    const career = (world.teams || []).flatMap(team => team?.roster || []).find(player => player?.isCareerPlayer === true) || world.player;
    if (!career) return;
    const birthDate = `${identity.startYear - 15}-06-15`;
    for (const player of [career, world.player, typeof Game !== 'undefined' ? Game?.player : null]) {
      if (!player) continue;
      player.birthDate = birthDate; player.effectiveBirthDate = birthDate; player.birthDatePrecision = 'generated-day';
    }
  }

  function resetSeasonScopedLifecycle() {
    const world = state();
    if (!world) return;
    world.postseason = {};
    world.offseasonDevelopment = {};
    world.travelHockey = { ...(world.travelHockey || {}), status: 'inactive', completed: false, currentSeasonComplete: false, tournament: null, placementLevel: null };
  }

  function seedNextSeasonIdentity(identity) {
    const world = state();
    if (!world || !identity) return false;
    const archive = activeArchive();
    world.currentSeason = identity.label;
    world.currentYear = identity.startYear;
    world.currentWeek = 1;
    world.season = {
      id: identity.seasonId, seasonId: identity.seasonId, label: identity.label, seasonLabel: identity.label,
      seasonNumber: identity.careerYearIndex + 1, careerYear: identity.careerYearIndex + 1, careerYearIndex: identity.careerYearIndex,
      schoolYear: identity.schoolYear, seasonStartYear: identity.startYear, seasonEndYear: identity.endYear,
      currentDate: identity.startDate, currentWeek: 1, phase: 'preseason', status: 'active', level: 'high-school',
      regularSeason: { started: false, completed: false, gamesPerTeam: 28 }, postseason: { qualified: false, started: false, completed: false },
      processedDates: [], processedWeeks: [], weeklyHistory: [], unresolvedEventIds: [], completedEventIds: [], lastProcessedDate: null, lastProcessedWeek: 0,
    };
    advanceReturningClasses(identity);
    resetTeamStandings();
    resetSeasonScopedLifecycle();
    rebuildNewSeasonSchedule(identity);
    syncDateCopies(identity.startDate);
    repairSyntheticDevBirthdate(identity, archive);
    WorldEngine.syncPlayerAges?.(world, identity.startDate);
    for (const team of world.teams || []) { try { WorldEngine.refreshTeamRosterManagement?.(team.teamId, { save: false }); } catch (_) {} }
    const recap = recapState();
    if (recap) {
      recap.nextSeasonTransitionComplete = true;
      recap.nextSeasonTransitionCompletedAt = identity.startDate;
      recap.nextSeasonId = identity.seasonId;
      recap.nextCareerYearIndex = identity.careerYearIndex;
    }
    return true;
  }

  function hardRefreshRolloverUI(identity) {
    // Render the same canonical paths the user previously had to trigger manually.
    // The cutscene is still covering the hub, so these renders happen invisibly.
    try { window.openHubTab?.('schedule'); } catch (_) {}
    try { window.openHubTab?.('league'); } catch (_) {}
    try { window.openHubTab?.('home'); } catch (_) {}
    const seasonLabel = document.getElementById('league-season');
    if (seasonLabel) seasonLabel.textContent = `${identity.label} Season`;
  }

  async function runTransition(options = {}) {
    const recap = recapState();
    if (!recap || recap.playerRecapAcknowledged !== true) return false;
    if (recap.nextSeasonTransitionComplete === true && options.force !== true) return false;
    const identity = nextIdentity();
    if (!identity) return false;
    document.getElementById('pi-player-season-recap-screen')?.remove();
    const root = ensureRoot();
    const archive = activeArchive();
    const completedYear = archive?.syntheticDevFixture === true ? 'Freshman' : (archive?.identity?.schoolYear || 'High School');
    await phase(root, `<div class="pi-ns-kicker">Project Ice</div><div class="pi-ns-title">${completedYear} Year Complete</div><div class="pi-ns-sub">One chapter closes.</div>`, 1300);
    await phase(root, `<div class="pi-ns-kicker">Year ${identity.careerYearIndex + 1}</div><div class="pi-ns-title">${identity.schoolYear} Season</div><div class="pi-ns-sub">${identity.label}</div><div class="pi-ns-line"></div><div class="pi-ns-date">A new season begins</div>`, 1650);
    seedNextSeasonIdentity(identity);
    await WorldEngine.save?.();
    hardRefreshRolloverUI(identity);
    await phase(root, `<div class="pi-ns-kicker">Back to School</div><div class="pi-ns-title">September 1</div><div class="pi-ns-sub">${identity.startYear} · ${identity.schoolYear} season</div><div class="pi-ns-line"></div><div class="pi-ns-date">Returning tryouts are next</div>`, 1350);
    root.classList.remove('is-visible');
    await wait(460);
    root.remove();
    hardRefreshRolloverUI(identity);
    window.dispatchEvent(new CustomEvent('projectice:next-high-school-season-started', { detail: { seasonId: identity.seasonId, careerYearIndex: identity.careerYearIndex, schoolYear: identity.schoolYear, startDate: identity.startDate, tryoutDate: identity.tryoutDate } }));
    return true;
  }

  function gradeFor(score) {
    if (score >= 93) return 'A'; if (score >= 85) return 'B+'; if (score >= 78) return 'B'; if (score >= 70) return 'C+'; if (score >= 62) return 'C'; return 'D';
  }

  function careerPlayer() {
    const world = state();
    return (world?.teams || []).flatMap(t => t?.roster || []).find(p => p?.isCareerPlayer === true) || world?.player || Game?.player || null;
  }

  function rosterSlotFor(position, line) {
    const p = String(position || 'C').toUpperCase();
    const n = clamp(Number(line) || 3, 1, 4);
    if (p === 'C' || p.includes('CENTER')) return `fwd-${n}-c`;
    if (p === 'LW' || p.includes('LEFT')) return `fwd-${n}-lw`;
    if (p === 'RW' || p.includes('RIGHT')) return `fwd-${n}-rw`;
    if (p === 'D' || p === 'LD' || p === 'RD' || p.includes('DEF')) return `def-${clamp(n,1,3)}-${p === 'RD' ? 'rd' : 'ld'}`;
    if (p === 'G' || p.includes('GOAL')) return n === 1 ? 'g-starter' : 'g-backup';
    return `fwd-${n}-c`;
  }

  function applyReturningTryoutResult(score) {
    const world = state();
    const player = careerPlayer();
    if (!world || !player) return null;
    const ovr = Number(player.overall || Game?.player?.overall) || 60;
    const trust = Number(player.coachTrust || Game?.player?.coachTrust) || 50;
    const composite = Math.round(score * .55 + ovr * .25 + trust * .20);
    const pos = String(player.position || Game?.player?.position || 'C').toUpperCase();
    let line = composite >= 84 ? 1 : composite >= 75 ? 2 : composite >= 66 ? 3 : 4;
    let label = `${line}${line === 1 ? 'st' : line === 2 ? 'nd' : line === 3 ? 'rd' : 'th'} Line`;
    if (pos === 'D' || pos === 'LD' || pos === 'RD' || pos.includes('DEF')) {
      line = composite >= 80 ? 1 : composite >= 68 ? 2 : 3;
      label = `${line}${line === 1 ? 'st' : line === 2 ? 'nd' : 'rd'} Pair`;
    } else if (pos === 'G' || pos.includes('GOAL')) {
      line = composite >= 74 ? 1 : 2;
      label = line === 1 ? 'Starting Goalie' : 'Backup Goalie';
    }
    const slot = rosterSlotFor(pos, line);
    const assignment = { line, label, rosterSlot: slot, source: 'returning-varsity-tryouts', score, composite };
    for (const target of [player, world.player, Game?.player]) {
      if (!target) continue;
      target.startingLine = label;
      target.rosterSlot = slot;
      target.lineupAssignment = assignment;
      target.lineupStatus = 'active';
      target.overallTryoutScore = score;
      target.overallTryoutGrade = gradeFor(score);
      target.tryoutsComplete = true;
    }
    const event = (world.schedule || []).find(e => e?.returningYearTryout === true || String(e?.eventKey || '') === 'returning-varsity-tryouts');
    if (event) { event.completed = true; event.played = true; event.status = 'completed'; event.result = { score, composite, assignment }; }
    if (world.season) {
      world.season.completedEventIds = Array.isArray(world.season.completedEventIds) ? world.season.completedEventIds : [];
      if (!world.season.completedEventIds.includes(event?.canonicalEventId || event?.id)) world.season.completedEventIds.push(event?.canonicalEventId || event?.id);
    }
    try { WorldEngine.refreshTeamRosterManagement?.(player.teamId || world.player?.teamId, { save: false }); } catch (_) {}
    WorldEngine.save?.();
    return assignment;
  }

  function openHighSchoolTryouts(mode = 'freshman') {
    injectTryoutStyles();
    document.getElementById(TRYOUT_ROOT_ID)?.remove();
    const root = document.createElement('section');
    root.id = TRYOUT_ROOT_ID;
    document.body.appendChild(root);
    let drillIndex = 0, repIndex = 0, selected = null, cursor = 0, direction = 1, raf = null;
    const scores = { skating: [], puckControl: [], scrimmage: [] };
    const isReturning = mode === 'returning';

    const stopMeter = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const animate = () => {
      cursor += direction * 1.65;
      if (cursor >= 100) { cursor = 100; direction = -1; }
      if (cursor <= 0) { cursor = 0; direction = 1; }
      const node = root.querySelector('.pi-hst-cursor');
      if (node) node.style.left = `${cursor}%`;
      raf = requestAnimationFrame(animate);
    };

    const finish = () => {
      stopMeter();
      const drillScores = {};
      for (const drill of TRYOUT_DRILLS) drillScores[drill.key] = Math.round((scores[drill.key].reduce((a,b)=>a+b,0) / scores[drill.key].length) || 0);
      const overall = Math.round((drillScores.skating + drillScores.puckControl + drillScores.scrimmage) / 3);
      if (!Game.player.tryoutResults) Game.player.tryoutResults = {};
      for (const key of ['skating','puckControl','scrimmage']) Game.player.tryoutResults[key] = { score: drillScores[key], grade: gradeFor(drillScores[key]) };
      Game.player.overallTryoutScore = overall;
      Game.player.overallTryoutGrade = gradeFor(overall);
      if (!isReturning) {
        root.remove();
        try { openTryoutSummary('first-time'); } catch (_) {}
        return;
      }
      const assignment = applyReturningTryoutResult(overall);
      root.innerHTML = `<div class="pi-hst-shell"><div class="pi-hst-card pi-hst-result"><div class="pi-hst-kicker">Varsity Tryouts Complete</div><div class="pi-hst-title">You earned your role.</div><div class="pi-hst-role">${esc(assignment?.label || 'Lineup Role')}</div><p class="pi-hst-sub">Tryout grade ${esc(gradeFor(overall))} · ${overall}/100. Your returning-season role blends today's performance with your current ability and coach trust.</p><button class="pi-hst-next" id="pi-hst-finish">Continue to Season</button></div></div>`;
      root.querySelector('#pi-hst-finish')?.addEventListener('click', () => {
        root.remove();
        try { window.openHubTab?.('schedule'); window.openHubTab?.('home'); } catch (_) {}
      });
    };

    const render = () => {
      stopMeter(); selected = null; cursor = 0; direction = 1;
      const drill = TRYOUT_DRILLS[drillIndex];
      const rep = drill.reps[repIndex];
      const totalRep = drillIndex * 3 + repIndex;
      root.innerHTML = `<div class="pi-hst-shell"><div class="pi-hst-kicker">Project Ice · ${isReturning ? 'Varsity' : 'Freshman'} Tryouts</div><h1 class="pi-hst-title">Earn Your Spot</h1><p class="pi-hst-sub">Choose your approach, then time the execution meter. Nine reps decide the evaluation.</p><div class="pi-hst-card"><div class="pi-hst-head"><div class="pi-hst-icon">${drill.icon}</div><div><h2>${drill.label}</h2><p>Rep ${repIndex + 1} of 3 · Drill ${drillIndex + 1} of 3</p></div></div><div class="pi-hst-progress">${Array.from({length:9},(_,i)=>`<i class="${i <= totalRep ? 'on' : ''}"></i>`).join('')}</div><div class="pi-hst-sit"><h3>${rep.title}</h3><p>${rep.situation}</p></div><div class="pi-hst-choices">${rep.options.map((o,i)=>`<button class="pi-hst-choice" data-choice="${i}"><strong>${o.label}</strong><span>${o.note}</span></button>`).join('')}</div><div id="pi-hst-execution"></div></div></div>`;
      root.querySelectorAll('.pi-hst-choice').forEach(btn => btn.addEventListener('click', () => {
        selected = rep.options[Number(btn.dataset.choice)];
        root.querySelectorAll('.pi-hst-choice').forEach(b => b.disabled = true);
        root.querySelector('#pi-hst-execution').innerHTML = `<div class="pi-hst-meter"><div class="pi-hst-zone"></div><div class="pi-hst-cursor" style="left:0%"></div></div><button class="pi-hst-execute">Execute</button>`;
        animate();
        root.querySelector('.pi-hst-execute')?.addEventListener('click', () => {
          stopMeter();
          const timing = Math.max(0, 1 - Math.abs(cursor - 50) / 50);
          const execution = clamp(Math.round(timing * 100), 0, 100);
          const score = clamp(Math.round(42 + selected.quality * 4.5 + execution * .28 - selected.difficulty * 8), 35, 100);
          scores[drill.key].push(score);
          root.querySelector('#pi-hst-execution').innerHTML = `<div class="pi-hst-feedback"><strong>${execution >= 82 ? 'Clean execution' : execution >= 60 ? 'Solid rep' : 'Missed the window'}</strong><p>Rep score: ${score}/100</p></div><button class="pi-hst-next">${totalRep === 8 ? 'View Tryout Result' : 'Next Rep'}</button>`;
          root.querySelector('.pi-hst-next')?.addEventListener('click', () => {
            if (repIndex < 2) repIndex += 1; else { repIndex = 0; drillIndex += 1; }
            if (drillIndex >= TRYOUT_DRILLS.length) finish(); else render();
          });
        }, { once: true });
      }));
    };
    render();
  }

  // Replace the old freshman drill chain with the Travel-style execution model.
  try {
    if (typeof SkatingDrill !== 'undefined' && SkatingDrill && typeof SkatingDrill.open === 'function' && !SkatingDrill.__projectIceInteractiveWrapped) {
      SkatingDrill.open = () => openHighSchoolTryouts('freshman');
      SkatingDrill.__projectIceInteractiveWrapped = true;
    }
  } catch (_) {}

  // Returning-year event uses the canonical freshman event id so the legacy calendar
  // renderer recognizes it, but this wrapper swaps in returning-season rules.
  try {
    if (typeof EventSystem !== 'undefined' && typeof EventSystem.openEvent === 'function' && !EventSystem.__projectIceHsTryoutWrapped) {
      const originalOpenEvent = EventSystem.openEvent.bind(EventSystem);
      EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
        const returning = eventData?.returningYearTryout === true || String(eventData?.eventKey || '') === 'returning-varsity-tryouts';
        if (returning) { openHighSchoolTryouts('returning'); return true; }
        return originalOpenEvent(eventId, origin, eventData);
      };
      EventSystem.__projectIceHsTryoutWrapped = true;
    }
  } catch (_) {}

  window.addEventListener('projectice:player-season-recap-complete', () => {
    runTransition({ force: true }).catch(error => {
      console.error('[Project Ice] Next-season transition failed:', error);
      alert(`Next-season transition failed: ${error?.message || error}`);
    });
  });

  WorldEngine.runNextHighSchoolSeasonTransition = runTransition;
  WorldEngine.openInteractiveHighSchoolTryouts = openHighSchoolTryouts;
})();