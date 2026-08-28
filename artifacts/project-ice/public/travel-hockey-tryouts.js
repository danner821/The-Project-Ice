'use strict';

/* global WorldEngine, EventSystem, openHubTab, refreshCareerUI, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const EVENT_ID = 'travel-hockey-tryouts';
  const ROOT_ID = 'pi-travel-tryouts-screen';
  const STYLE_ID = 'pi-travel-tryouts-styles';
  const LEVELS = ['B', 'A', 'AA', 'AAA'];

  const CLUBS = [
    { id: 'arizona-jr-coyotes', name: 'Arizona Jr. Coyotes', city: 'Phoenix, AZ' },
    { id: 'colorado-thunderbirds', name: 'Colorado Thunderbirds', city: 'Denver, CO' },
    { id: 'dallas-stars-elite', name: 'Dallas Stars Elite', city: 'Dallas, TX' },
    { id: 'chicago-mission', name: 'Chicago Mission', city: 'Chicago, IL' },
    { id: 'little-caesars', name: 'Little Caesars', city: 'Detroit, MI' },
    { id: 'pittsburgh-penguins-elite', name: 'Pittsburgh Penguins Elite', city: 'Pittsburgh, PA' },
    { id: 'boston-jr-eagles', name: 'Boston Jr. Eagles', city: 'Boston, MA' },
    { id: 'la-jr-kings', name: 'LA Jr. Kings', city: 'Los Angeles, CA' },
  ];

  const DRILLS = [
    {
      key: 'skating',
      label: 'Skating & Pace',
      icon: '⛸️',
      detail: 'Three reps testing acceleration, edge control, and recovery speed.',
      attributeGroup: 'skating',
      reps: [
        {
          title: 'Explode Through the Gate',
          situation: 'You start flat-footed at the goal line. The evaluator wants your first three strides to separate you immediately.',
          options: [
            { key: 'power', label: 'Drive three power strides', note: 'Maximum acceleration. Small execution window.', quality: 8, difficulty: 0.82 },
            { key: 'quick', label: 'Use quick compact strides', note: 'Cleaner launch with less top-end burst.', quality: 5, difficulty: 0.62 },
            { key: 'safe', label: 'Build speed gradually', note: 'Reliable, but scouts may want more explosiveness.', quality: 2, difficulty: 0.42 },
          ],
        },
        {
          title: 'Edgework Gauntlet',
          situation: 'Four tight cones force two hard direction changes before a sprint out of the turn.',
          options: [
            { key: 'attack', label: 'Attack every cone at full speed', note: 'Highest ceiling if your edges hold.', quality: 8, difficulty: 0.86 },
            { key: 'control', label: 'Stay low and carve clean edges', note: 'Balanced speed and control.', quality: 6, difficulty: 0.64 },
            { key: 'wide', label: 'Take wider turns', note: 'Safer line, but costs time.', quality: 2, difficulty: 0.38 },
          ],
        },
        {
          title: 'Recovery Race',
          situation: 'You are given a half-step disadvantage and must close the gap before the far blue line.',
          options: [
            { key: 'crossovers', label: 'Use aggressive crossover acceleration', note: 'Fastest recovery if timed correctly.', quality: 8, difficulty: 0.82 },
            { key: 'straight', label: 'Stay direct and sprint', note: 'Simple line with a solid floor.', quality: 5, difficulty: 0.58 },
            { key: 'angle', label: 'Take a conservative angle', note: 'Limits the loss but rarely wins the race.', quality: 2, difficulty: 0.35 },
          ],
        },
      ],
    },
    {
      key: 'skill',
      label: 'Puck Skills',
      icon: '🏒',
      detail: 'Three puck reps testing control, deception, passing, and finishing.',
      attributeGroup: 'skill',
      reps: [
        {
          title: 'Tight-Area Entry',
          situation: 'A defender shades your forehand at the top of the circle and takes away the obvious lane.',
          options: [
            { key: 'inside', label: 'Pull inside and attack the hands', note: 'Creative and dangerous, but turnover-prone.', quality: 8, difficulty: 0.84 },
            { key: 'delay', label: 'Delay and change the angle', note: 'Creates space without forcing the play.', quality: 6, difficulty: 0.61 },
            { key: 'chip', label: 'Chip it behind and retrieve', note: 'Safe possession play with less skill upside.', quality: 3, difficulty: 0.40 },
          ],
        },
        {
          title: 'Seam Passing',
          situation: 'Two targets flash through a narrow passing lane while a stick obstacle closes the middle.',
          options: [
            { key: 'thread', label: 'Thread the seam immediately', note: 'Elite play if the timing is perfect.', quality: 8, difficulty: 0.86 },
            { key: 'move', label: 'Shift the puck, then hit the lane', note: 'Manipulates the obstacle before the pass.', quality: 6, difficulty: 0.64 },
            { key: 'reset', label: 'Reset and use the safe outlet', note: 'Keeps possession but shows less creation.', quality: 2, difficulty: 0.34 },
          ],
        },
        {
          title: 'Finish Under Pressure',
          situation: 'You receive the puck below the hashmarks with one touch before the coach closes the shooting lane.',
          options: [
            { key: 'quick', label: 'One-touch quick release', note: 'Hardest execution, highest scoring value.', quality: 8, difficulty: 0.85 },
            { key: 'change', label: 'Pull and change the release point', note: 'Balanced deception and control.', quality: 6, difficulty: 0.63 },
            { key: 'settle', label: 'Settle the puck before shooting', note: 'Cleaner contact, but the lane may disappear.', quality: 3, difficulty: 0.42 },
          ],
        },
      ],
    },
    {
      key: 'scrimmage',
      label: 'Competitive Scrimmage',
      icon: '⚡',
      detail: 'Three live reads testing hockey IQ, compete level, and decision-making.',
      attributeGroup: 'scrimmage',
      reps: [
        {
          title: '2-on-1 Rush',
          situation: 'The defender takes away the pass early. Your teammate is still driving the far post.',
          options: [
            { key: 'freeze', label: 'Attack the defender and freeze him', note: 'Force a late decision before passing or shooting.', quality: 8, difficulty: 0.74 },
            { key: 'shoot', label: 'Use the teammate as a decoy and shoot', note: 'Good read if the goalie cheats pass.', quality: 6, difficulty: 0.56 },
            { key: 'force', label: 'Force the cross-crease pass', note: 'Flashy if it works, costly if it does not.', quality: 4, difficulty: 0.82 },
          ],
        },
        {
          title: 'Defensive Zone Retrieval',
          situation: 'You arrive first on a rimmed puck with pressure coming over your shoulder and the middle briefly open.',
          options: [
            { key: 'middle', label: 'Escape through the middle', note: 'High-value exit if you read the pressure correctly.', quality: 8, difficulty: 0.78 },
            { key: 'reverse', label: 'Reverse behind the net', note: 'Strong pressure read and possession play.', quality: 6, difficulty: 0.55 },
            { key: 'glass', label: 'Chip it safely off the glass', note: 'Gets out of danger, but concedes possession.', quality: 3, difficulty: 0.30 },
          ],
        },
        {
          title: 'Final Shift',
          situation: 'Thirty seconds remain in the scrimmage. Your line has the puck down low and the evaluators are watching who drives the play.',
          options: [
            { key: 'attack-net', label: 'Cut to the middle and attack the net', note: 'Assertive finish with real upside.', quality: 8, difficulty: 0.76 },
            { key: 'cycle', label: 'Win the wall and extend the cycle', note: 'Shows strength, patience, and possession IQ.', quality: 6, difficulty: 0.52 },
            { key: 'perimeter', label: 'Keep it safe on the perimeter', note: 'Low mistake risk, but little impact.', quality: 2, difficulty: 0.26 },
          ],
        },
      ],
    },
  ];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const dateKey = value => String(value || '').slice(0, 10);
  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100050;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 24px) 18px calc(env(safe-area-inset-bottom,0px) + 28px);background:radial-gradient(circle at 50% 0%,rgba(46,108,205,.34),transparent 31%),linear-gradient(180deg,#07182b,#040d19);color:#f6f9ff}
      .pi-travel-shell{max-width:620px;margin:0 auto}.pi-travel-kicker{color:#79adf5;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-travel-title{margin:8px 0 6px;font-size:32px;line-height:1;letter-spacing:-.045em}.pi-travel-sub{margin:0;color:#8ca0ba;font-size:12px;line-height:1.55}.pi-travel-card{margin-top:18px;padding:17px;border:1px solid rgba(115,170,247,.16);border-radius:21px;background:linear-gradient(180deg,rgba(19,44,76,.78),rgba(8,24,43,.9));box-shadow:0 18px 42px rgba(0,0,0,.2)}
      .pi-travel-meta{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.pi-travel-meta div{padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055)}.pi-travel-meta .wide{grid-column:1/-1}.pi-travel-meta span{display:block;color:#71859e;font-size:8px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.pi-travel-meta strong{display:block;margin-top:4px;font-size:13px}
      .pi-travel-drill-head{display:flex;gap:12px;align-items:center}.pi-travel-drill-icon{width:45px;height:45px;display:grid;place-items:center;border-radius:14px;background:rgba(56,121,213,.13);font-size:22px}.pi-travel-drill-head h2{margin:0;font-size:20px}.pi-travel-drill-head p{margin:4px 0 0;color:#7f94ad;font-size:11px;line-height:1.45}.pi-travel-progress{display:flex;gap:6px;margin:15px 0 2px}.pi-travel-progress i{height:4px;flex:1;border-radius:10px;background:rgba(255,255,255,.08)}.pi-travel-progress i.on{background:#5d9cf2}.pi-travel-rep-count{margin-top:13px;color:#6f87a6;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .pi-travel-situation{margin-top:10px;padding:14px;border-radius:16px;background:rgba(6,17,31,.48);border:1px solid rgba(255,255,255,.055)}.pi-travel-situation h3{margin:0 0 6px;font-size:16px}.pi-travel-situation p{margin:0;color:#8ea2bc;font-size:11px;line-height:1.52}.pi-travel-choices{display:grid;gap:9px;margin-top:13px}.pi-travel-choice{width:100%;padding:14px 15px;text-align:left;border-radius:15px;border:1px solid rgba(106,165,242,.18);background:rgba(38,83,146,.08);color:#f6f9ff;font:inherit}.pi-travel-choice strong{display:block;font-size:13px}.pi-travel-choice span{display:block;margin-top:4px;color:#7187a3;font-size:10px;line-height:1.4}.pi-travel-choice:active{filter:brightness(1.2)}
      .pi-travel-meter-wrap{margin-top:15px}.pi-travel-meter-label{display:flex;justify-content:space-between;gap:10px;color:#7187a3;font-size:9px;font-weight:800}.pi-travel-meter{position:relative;height:18px;margin-top:7px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.06)}.pi-travel-meter-zone{position:absolute;left:41%;width:18%;top:0;bottom:0;background:rgba(91,188,134,.34);box-shadow:0 0 18px rgba(91,188,134,.22)}.pi-travel-meter-cursor{position:absolute;top:2px;bottom:2px;width:4px;border-radius:5px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.8);transform:translateX(-50%)}.pi-travel-execute{width:100%;margin-top:12px;padding:14px;border:1px solid rgba(111,177,255,.26);border-radius:14px;background:rgba(40,101,190,.20);color:#fff;font:inherit;font-size:13px;font-weight:900}.pi-travel-feedback{margin-top:14px;padding:13px 14px;border-radius:15px;border:1px solid rgba(111,177,255,.14);background:rgba(37,81,143,.09)}.pi-travel-feedback strong{display:block;font-size:13px}.pi-travel-feedback p{margin:5px 0 0;color:#8298b4;font-size:10px;line-height:1.48}.pi-travel-feedback .score{margin-top:8px;color:#9fc7ff;font-size:11px;font-weight:900}.pi-travel-next{width:100%;margin-top:12px;padding:14px;border:1px solid rgba(111,177,255,.27);border-radius:14px;background:linear-gradient(135deg,#2c6bcf,#1b438d);color:#fff;font:inherit;font-size:13px;font-weight:900}
      .pi-travel-result{text-align:center;padding:8px 0 2px}.pi-travel-level{width:106px;height:106px;margin:7px auto 15px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(111,179,255,.35);background:radial-gradient(circle,rgba(53,119,211,.31),rgba(16,45,82,.7));box-shadow:0 0 45px rgba(57,124,217,.2);font-size:34px;font-weight:950}.pi-travel-result h2{margin:0;font-size:27px}.pi-travel-result p{margin:8px auto 0;max-width:390px;color:#8fa3bd;font-size:12px;line-height:1.55}.pi-travel-team{margin:17px 0 4px;padding:15px;border-radius:17px;border:1px solid rgba(102,173,255,.20);background:linear-gradient(135deg,rgba(44,104,190,.22),rgba(17,49,91,.28));text-align:left}.pi-travel-team span{display:block;color:#75a6e7;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.pi-travel-team strong{display:block;margin-top:5px;font-size:18px}.pi-travel-team small{display:block;margin-top:3px;color:#7f94ad;font-size:10px}.pi-travel-score{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.pi-travel-score div{padding:12px 7px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055)}.pi-travel-score span{display:block;color:#7187a3;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pi-travel-score strong{display:block;margin-top:5px;font-size:15px}.pi-travel-summary{margin-top:14px;padding:14px;border-radius:16px;background:rgba(7,19,34,.50);border:1px solid rgba(255,255,255,.055);text-align:left}.pi-travel-summary span{display:block;color:#7187a3;font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.pi-travel-summary p{margin:6px 0 0;color:#9aadc5;font-size:11px;line-height:1.5}.pi-travel-continue{width:100%;margin-top:18px;padding:16px;border:1px solid rgba(111,177,255,.27);border-radius:16px;background:linear-gradient(135deg,#2c6bcf,#1b438d);color:#fff;font:inherit;font-size:14px;font-weight:900}
      @media(max-width:420px){.pi-travel-title{font-size:29px}.pi-travel-score{gap:6px}.pi-travel-score div{padding:11px 4px}}
    `;
    document.head.appendChild(style);
  }

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function worldPlayer() {
    return WorldEngine.state?.player || {};
  }

  function gamePlayer() {
    try {
      return typeof Game !== 'undefined' && Game?.player ? Game.player : {};
    } catch (_) {
      return {};
    }
  }

  function playerName() {
    const p = worldPlayer();
    const g = gamePlayer();
    const joined = obj => [obj?.firstName, obj?.lastName].filter(Boolean).join(' ').trim();
    const selectors = ['#hub-player-name', '#player-name', '.hub-player-name', '.career-player-name', '[data-player-name]'];
    const domName = selectors.map(selector => document.querySelector(selector)?.textContent?.trim()).find(Boolean);
    return String(
      p.name || p.fullName || p.playerName || joined(p) ||
      g.name || g.fullName || g.playerName || joined(g) ||
      domName || 'Career Player'
    );
  }

  function currentEvent() {
    return WorldEngine.getTravelHockeyTryoutEvent?.() ||
      (WorldEngine.state?.schedule || []).find(item => String(item?.eventId || item?.id || '') === EVENT_ID) || null;
  }

  function numeric(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function overall() {
    const p = worldPlayer();
    const g = gamePlayer();
    return clamp(Math.round(numeric(p.overall ?? p.ovr ?? g.overall ?? g.ovr, 60)), 40, 99);
  }

  function formScore() {
    const p = worldPlayer();
    const g = gamePlayer();
    const raw = p.currentForm ?? p.form ?? p.recentForm ?? p.performanceForm ?? g.currentForm ?? g.form ?? null;
    if (typeof raw === 'number') {
      if (raw >= 0 && raw <= 1) return Math.round(50 + raw * 35);
      if (raw >= -10 && raw <= 10) return Math.round(70 + raw * 2);
      return clamp(Math.round(raw), 45, 95);
    }
    const trust = numeric(p.coachTrust ?? p.trust ?? g.coachTrust ?? g.trust, 50);
    return clamp(Math.round(62 + (trust - 50) * 0.18), 50, 82);
  }

  function attributeValues(obj, out = []) {
    if (!obj || typeof obj !== 'object') return out;
    for (const value of Object.values(obj)) {
      if (typeof value === 'number' && value >= 20 && value <= 99) out.push(value);
      else if (value && typeof value === 'object' && !Array.isArray(value)) attributeValues(value, out);
    }
    return out;
  }

  function skillBase(drillKey) {
    const p = worldPlayer();
    const g = gamePlayer();
    const attrs = p.attributes || p.ratings || g.attributes || g.ratings || {};
    const groups = {
      skating: attrs.skating || attrs.Skating || null,
      skill: attrs.shooting || attrs.Shooting || attrs.puckSkills || attrs.offense || attrs.passing || attrs.Passing || null,
      scrimmage: attrs.iq || attrs.IQ || attrs.hockeyIQ || attrs.passing || attrs.Passing || attrs.defense || attrs.Defense || null,
    };
    const values = attributeValues(groups[drillKey]);
    if (!values.length) return overall();
    return clamp(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), 40, 99);
  }

  function stableHash(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function teamMatrix() {
    const matrix = {};
    for (const level of LEVELS) {
      matrix[level] = CLUBS.map(club => ({
        teamId: `travel-${club.id}-${level.toLowerCase()}`,
        organizationId: club.id,
        organizationName: club.name,
        name: `${club.name} ${level}`,
        city: club.city,
        level,
      }));
    }
    return matrix;
  }

  function ensureTravelTeams(state) {
    if (!state) return null;
    if (!state.teamOptionsByLevel || typeof state.teamOptionsByLevel !== 'object') {
      state.teamOptionsByLevel = teamMatrix();
    }
    state.organizations = CLUBS.map(club => ({ ...club }));
    return state.teamOptionsByLevel;
  }

  function choosePlacementTeam(state, level, evaluation) {
    const matrix = ensureTravelTeams(state);
    const options = matrix?.[level] || [];
    if (!options.length) return null;
    const p = worldPlayer();
    const key = `${p.playerId || p.id || playerName()}|${state.tryoutDate || ''}|${evaluation}|${level}`;
    const selected = options[stableHash(key) % options.length];
    state.playerTeamId = selected.teamId;
    state.playerTeamName = selected.name;
    state.placementTeam = { ...selected };
    return selected;
  }

  function timingLabel(accuracy) {
    if (accuracy >= 0.9) return { title: 'Perfect execution', note: 'You hit the rep exactly when the window opened.' };
    if (accuracy >= 0.72) return { title: 'Clean execution', note: 'Strong timing with only a small loss of pace.' };
    if (accuracy >= 0.5) return { title: 'Usable rep', note: 'You completed the play, but the timing was not sharp.' };
    return { title: 'Missed the window', note: 'The idea was there, but the execution broke down.' };
  }

  function scoreRep(drillKey, option, timingAccuracy) {
    const ability = skillBase(drillKey);
    const form = formScore();
    const execution = clamp(Math.round(timingAccuracy * 100), 0, 100);
    const difficultyReward = Math.round(option.difficulty * 7);
    return clamp(Math.round(
      ability * 0.53 +
      form * 0.10 +
      execution * 0.27 +
      option.quality +
      difficultyReward * timingAccuracy
    ), 40, 99);
  }

  function placementFrom(total) {
    if (total >= 84) return 'AAA';
    if (total >= 76) return 'AA';
    if (total >= 68) return 'A';
    return 'B';
  }

  function drillAverage(reps, key) {
    const selected = reps.filter(item => item.drillKey === key);
    if (!selected.length) return 0;
    return Math.round(selected.reduce((sum, item) => sum + item.score, 0) / selected.length);
  }

  function scoutingSummary(level, drillScores) {
    const entries = Object.entries(drillScores).sort((a, b) => b[1] - a[1]);
    const best = entries[0]?.[0] || 'scrimmage';
    const labels = { skating: 'pace and skating', skill: 'puck skill', scrimmage: 'competitive reads' };
    const levelText = {
      B: 'You earned a summer roster spot, but the evaluators want more consistency before moving you into a higher tier.',
      A: 'You showed enough pace and execution to separate yourself from the B group and earn an A-level spot.',
      AA: 'You looked comfortable against stronger competition and earned a legitimate AA placement.',
      AAA: 'You performed like a top travel player and earned a AAA placement against the strongest group.',
    };
    return `${levelText[level]} Your best area today was ${labels[best]}.`;
  }

  function finishTryouts(reps) {
    const state = travel();
    if (!state) return null;
    const scores = {
      skating: drillAverage(reps, 'skating'),
      skill: drillAverage(reps, 'skill'),
      scrimmage: drillAverage(reps, 'scrimmage'),
    };
    const average = Math.round((scores.skating + scores.skill + scores.scrimmage) / 3);
    const evaluation = Math.round(overall() * 0.55 + formScore() * 0.15 + average * 0.30);
    const level = placementFrom(evaluation);
    const completedAt = dateKey(state.tryoutDate || WorldEngine.state?.season?.currentDate || new Date().toISOString());
    const team = choosePlacementTeam(state, level, evaluation);

    state.placementLevel = level;
    state.status = 'placement-complete';
    state.tryoutResult = {
      completedAt,
      playerName: playerName(),
      overallAtTryouts: overall(),
      formScore: formScore(),
      drillAverage: average,
      drillScores: scores,
      evaluationScore: evaluation,
      placementLevel: level,
      placementTeamId: team?.teamId || null,
      placementTeamName: team?.name || null,
      placementTeamCity: team?.city || null,
      scoutingSummary: scoutingSummary(level, scores),
      reps: reps.map(item => ({ ...item })),
    };

    const event = currentEvent();
    if (event) {
      event.completed = true;
      event.played = true;
      event.status = 'completed';
      event.completedAt = completedAt;
      event.requiresPlayerInteraction = false;
      event.result = {
        title: 'Travel Hockey Tryouts',
        summary: team?.name
          ? `Made ${team.name} for the summer travel season.`
          : `Placed at ${level} level for the summer travel season.`,
      };
    }

    WorldEngine.save?.();
    return state.tryoutResult;
  }

  function renderResult(result) {
    const root = document.getElementById(ROOT_ID);
    if (!root || !result) return;
    const teamName = result.placementTeamName || travel()?.playerTeamName || `${result.placementLevel} Travel Team`;
    const teamCity = result.placementTeamCity || travel()?.placementTeam?.city || '';
    const scores = result.drillScores || {
      skating: drillAverage(result.reps || [], 'skating'),
      skill: drillAverage(result.reps || [], 'skill'),
      scrimmage: drillAverage(result.reps || [], 'scrimmage'),
    };
    root.innerHTML = `
      <div class="pi-travel-shell">
        <div class="pi-travel-card pi-travel-result">
          <div class="pi-travel-kicker">Summer Travel Hockey · Placement</div>
          <div class="pi-travel-level">${esc(result.placementLevel)}</div>
          <h2>${esc(result.playerName || playerName())} made ${esc(result.placementLevel)}</h2>
          <p>Your level and summer team are locked. This is the roster that will carry into the travel tournament.</p>
          <div class="pi-travel-team">
            <span>Your Travel Team</span>
            <strong>${esc(teamName)}</strong>
            ${teamCity ? `<small>${esc(teamCity)}</small>` : ''}
          </div>
          <div class="pi-travel-score">
            <div><span>Skating</span><strong>${scores.skating || '—'}</strong></div>
            <div><span>Puck Skills</span><strong>${scores.skill || '—'}</strong></div>
            <div><span>Scrimmage</span><strong>${scores.scrimmage || '—'}</strong></div>
          </div>
          <div class="pi-travel-summary">
            <span>Evaluator Note</span>
            <p>${esc(result.scoutingSummary || scoutingSummary(result.placementLevel, scores))}</p>
          </div>
          <button type="button" class="pi-travel-continue" id="pi-travel-tryouts-continue">Continue Into Summer</button>
        </div>
      </div>`;

    root.querySelector('#pi-travel-tryouts-continue')?.addEventListener('click', () => {
      root.remove();
      WorldEngine.ensureTravelHockeyFoundation?.({ save: true });
      if (typeof openHubTab === 'function') openHubTab('home');
      if (typeof refreshCareerUI === 'function') refreshCareerUI();
      WorldEngine.bridgeTravelHockeyPresentation?.();
    });
  }

  function renderRep(drillIndex, repIndex, results) {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    const drill = DRILLS[drillIndex];
    const rep = drill.reps[repIndex];

    root.innerHTML = `
      <div class="pi-travel-shell">
        <div class="pi-travel-kicker">Summer Travel Hockey · Tryouts</div>
        <h1 class="pi-travel-title">${esc(drill.label)}</h1>
        <p class="pi-travel-sub">${esc(drill.detail)}</p>
        <div class="pi-travel-card">
          <div class="pi-travel-drill-head">
            <div class="pi-travel-drill-icon">${drill.icon}</div>
            <div><h2>${esc(drill.label)}</h2><p>Drill ${drillIndex + 1} of ${DRILLS.length}</p></div>
          </div>
          <div class="pi-travel-progress">${DRILLS.map((_, i) => `<i class="${i <= drillIndex ? 'on' : ''}"></i>`).join('')}</div>
          <div class="pi-travel-rep-count">Rep ${repIndex + 1} of ${drill.reps.length}</div>
          <div class="pi-travel-situation">
            <h3>${esc(rep.title)}</h3>
            <p>${esc(rep.situation)}</p>
          </div>
          <div class="pi-travel-choices">
            ${rep.options.map(option => `<button type="button" class="pi-travel-choice" data-option="${esc(option.key)}"><strong>${esc(option.label)}</strong><span>${esc(option.note)}</span></button>`).join('')}
          </div>
        </div>
      </div>`;

    root.querySelectorAll('.pi-travel-choice').forEach(button => {
      button.addEventListener('click', () => {
        const option = rep.options.find(item => item.key === button.dataset.option) || rep.options[1] || rep.options[0];
        renderTiming(drillIndex, repIndex, results, option);
      });
    });
  }

  function renderTiming(drillIndex, repIndex, results, option) {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    const drill = DRILLS[drillIndex];
    const rep = drill.reps[repIndex];
    const card = root.querySelector('.pi-travel-card');
    if (!card) return;

    card.querySelector('.pi-travel-choices')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'pi-travel-meter-wrap';
    wrap.innerHTML = `
      <div class="pi-travel-feedback"><strong>${esc(option.label)}</strong><p>Now execute it. Tap when the white marker reaches the green window.</p></div>
      <div class="pi-travel-meter-label"><span>Early</span><span>Execution Window</span><span>Late</span></div>
      <div class="pi-travel-meter"><div class="pi-travel-meter-zone"></div><div class="pi-travel-meter-cursor"></div></div>
      <button type="button" class="pi-travel-execute">Execute Rep</button>`;
    card.appendChild(wrap);

    const cursor = wrap.querySelector('.pi-travel-meter-cursor');
    const button = wrap.querySelector('.pi-travel-execute');
    let position = 0;
    let direction = 1;
    let last = performance.now();
    let running = true;
    const speed = 0.058 + option.difficulty * 0.035;

    const animate = now => {
      if (!running) return;
      const delta = Math.min(34, now - last);
      last = now;
      position += direction * speed * delta;
      if (position >= 100) { position = 100; direction = -1; }
      if (position <= 0) { position = 0; direction = 1; }
      if (cursor) cursor.style.left = `${position}%`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    button?.addEventListener('click', () => {
      if (!running) return;
      running = false;
      button.disabled = true;
      const distance = Math.abs(position - 50);
      const accuracy = clamp(1 - distance / 50, 0, 1);
      const score = scoreRep(drill.key, option, accuracy);
      const timing = timingLabel(accuracy);
      const nextResults = [...results, {
        drillKey: drill.key,
        drillLabel: drill.label,
        repTitle: rep.title,
        optionKey: option.key,
        optionLabel: option.label,
        timingAccuracy: Number(accuracy.toFixed(3)),
        score,
      }];

      wrap.innerHTML = `
        <div class="pi-travel-feedback">
          <strong>${esc(timing.title)}</strong>
          <p>${esc(timing.note)} ${esc(option.label)} was the decision.</p>
          <div class="score">Rep Score: ${score}</div>
        </div>
        <button type="button" class="pi-travel-next">${repIndex + 1 < drill.reps.length ? 'Next Rep' : drillIndex + 1 < DRILLS.length ? 'Next Drill' : 'See Placement'}</button>`;

      wrap.querySelector('.pi-travel-next')?.addEventListener('click', () => {
        if (repIndex + 1 < drill.reps.length) {
          renderRep(drillIndex, repIndex + 1, nextResults);
        } else if (drillIndex + 1 < DRILLS.length) {
          renderRep(drillIndex + 1, 0, nextResults);
        } else {
          renderResult(finishTryouts(nextResults));
        }
      });
    });
  }

  function openTryouts() {
    const state = travel();
    if (!state) return false;
    ensureTravelTeams(state);
    injectStyles();
    document.getElementById(ROOT_ID)?.remove();
    const root = document.createElement('section');
    root.id = ROOT_ID;
    document.body.appendChild(root);

    if (state.tryoutResult) {
      renderResult(state.tryoutResult);
      return true;
    }

    const event = currentEvent();
    root.innerHTML = `
      <div class="pi-travel-shell">
        <div class="pi-travel-kicker">Summer Travel Hockey</div>
        <h1 class="pi-travel-title">Travel Hockey Tryouts</h1>
        <p class="pi-travel-sub">The high school season is behind you. Today determines both the level and club you will represent this summer.</p>
        <div class="pi-travel-card">
          <div class="pi-travel-meta">
            <div class="wide"><span>Player</span><strong>${esc(playerName())}</strong></div>
            <div><span>Current Overall</span><strong>${overall()} OVR</strong></div>
            <div><span>Location</span><strong>${esc(event?.location || 'Regional Ice Center')}</strong></div>
          </div>
          <button type="button" class="pi-travel-continue" id="pi-travel-start-tryouts">Begin Tryouts</button>
        </div>
      </div>`;
    root.querySelector('#pi-travel-start-tryouts')?.addEventListener('click', () => renderRep(0, 0, []));
    return true;
  }

  if (typeof EventSystem !== 'undefined' && typeof EventSystem.openEvent === 'function') {
    const originalOpenEvent = EventSystem.openEvent.bind(EventSystem);
    EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
      const id = String(eventId || eventData?.eventId || eventData?.id || '');
      if (id === EVENT_ID || eventData?.travelTryoutEvent === true) {
        WorldEngine.ensureTravelHockeyFoundation?.({ save: false });
        return openTryouts();
      }
      return originalOpenEvent(eventId, origin, eventData);
    };
  }

  document.addEventListener('click', event => {
    const target = event.target?.closest?.(`[data-event-id="${EVENT_ID}"], [data-pi-travel-event="${EVENT_ID}"]`);
    if (!target) return;
    const current = dateKey(WorldEngine.state?.season?.currentDate || WorldEngine.state?.player?.currentDate || WorldEngine.state?.currentDate);
    const state = travel();
    if (state?.tryoutDate && current && current < state.tryoutDate) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openTryouts();
  }, true);

  WorldEngine.openTravelHockeyTryouts = openTryouts;
  WorldEngine.getTravelHockeyTeamOptions = () => travel()?.teamOptionsByLevel || teamMatrix();
})();