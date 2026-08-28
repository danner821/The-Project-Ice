'use strict';

/* global WorldEngine, EventSystem, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const EVENT_ID = 'travel-hockey-tryouts';
  const ROOT_ID = 'pi-travel-tryouts-screen';
  const STYLE_ID = 'pi-travel-tryouts-styles';
  const DRILLS = [
    { key: 'skating', label: 'Skating & Pace', icon: '⛸️', detail: 'Explosiveness, edgework, and pace under pressure.' },
    { key: 'skill', label: 'Puck Skills', icon: '🏒', detail: 'Puck control, passing, and finishing in tight areas.' },
    { key: 'scrimmage', label: 'Competitive Scrimmage', icon: '⚡', detail: 'Read the game, create chances, and compete shift to shift.' },
  ];
  const APPROACHES = [
    { key: 'steady', label: 'Stay composed', note: 'Lower risk, smaller ceiling.', risk: 2, bonus: 1 },
    { key: 'balanced', label: 'Play your game', note: 'Trust your ability and make the right play.', risk: 5, bonus: 4 },
    { key: 'attack', label: 'Push the pace', note: 'Higher ceiling, but mistakes are punished.', risk: 10, bonus: 8 },
  ];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const dateKey = value => String(value || '').slice(0, 10);

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;inset:0;z-index:100050;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 24px) 18px calc(env(safe-area-inset-bottom,0px) + 28px);background:radial-gradient(circle at 50% 0%,rgba(46,108,205,.34),transparent 31%),linear-gradient(180deg,#07182b,#040d19);color:#f6f9ff}
      .pi-travel-shell{max-width:620px;margin:0 auto}.pi-travel-kicker{color:#79adf5;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.pi-travel-title{margin:8px 0 6px;font-size:32px;line-height:1;letter-spacing:-.045em}.pi-travel-sub{margin:0;color:#8ca0ba;font-size:12px;line-height:1.55}.pi-travel-card{margin-top:18px;padding:17px;border:1px solid rgba(115,170,247,.16);border-radius:21px;background:linear-gradient(180deg,rgba(19,44,76,.78),rgba(8,24,43,.9));box-shadow:0 18px 42px rgba(0,0,0,.2)}
      .pi-travel-meta{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.pi-travel-meta div{padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055)}.pi-travel-meta span{display:block;color:#71859e;font-size:8px;font-weight:900;letter-spacing:.11em;text-transform:uppercase}.pi-travel-meta strong{display:block;margin-top:4px;font-size:13px}
      .pi-travel-drill-head{display:flex;gap:12px;align-items:center}.pi-travel-drill-icon{width:45px;height:45px;display:grid;place-items:center;border-radius:14px;background:rgba(56,121,213,.13);font-size:22px}.pi-travel-drill-head h2{margin:0;font-size:20px}.pi-travel-drill-head p{margin:4px 0 0;color:#7f94ad;font-size:11px;line-height:1.45}.pi-travel-progress{display:flex;gap:6px;margin:15px 0 2px}.pi-travel-progress i{height:4px;flex:1;border-radius:10px;background:rgba(255,255,255,.08)}.pi-travel-progress i.on{background:#5d9cf2}
      .pi-travel-choices{display:grid;gap:9px;margin-top:15px}.pi-travel-choice{width:100%;padding:14px 15px;text-align:left;border-radius:15px;border:1px solid rgba(106,165,242,.18);background:rgba(38,83,146,.08);color:#f6f9ff;font:inherit}.pi-travel-choice strong{display:block;font-size:13px}.pi-travel-choice span{display:block;margin-top:4px;color:#7187a3;font-size:10px;line-height:1.4}.pi-travel-choice:active{filter:brightness(1.2)}
      .pi-travel-result{text-align:center;padding:8px 0 2px}.pi-travel-level{width:106px;height:106px;margin:7px auto 15px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(111,179,255,.35);background:radial-gradient(circle,rgba(53,119,211,.31),rgba(16,45,82,.7));box-shadow:0 0 45px rgba(57,124,217,.2);font-size:34px;font-weight:950}.pi-travel-result h2{margin:0;font-size:27px}.pi-travel-result p{margin:8px auto 0;max-width:390px;color:#8fa3bd;font-size:12px;line-height:1.55}.pi-travel-score{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.pi-travel-score div{padding:12px 7px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.055)}.pi-travel-score span{display:block;color:#7187a3;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pi-travel-score strong{display:block;margin-top:5px;font-size:15px}.pi-travel-continue{width:100%;margin-top:18px;padding:16px;border:1px solid rgba(111,177,255,.27);border-radius:16px;background:linear-gradient(135deg,#2c6bcf,#1b438d);color:#fff;font:inherit;font-size:14px;font-weight:900}
    `;
    document.head.appendChild(style);
  }

  function travel() {
    return WorldEngine.getTravelHockeyState?.() || WorldEngine.state?.travelHockey || null;
  }

  function player() {
    return WorldEngine.state?.player || {};
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
    const p = player();
    return clamp(Math.round(numeric(p.overall ?? p.ovr, 60)), 40, 99);
  }

  function formScore() {
    const p = player();
    const raw = p.currentForm ?? p.form ?? p.recentForm ?? p.performanceForm ?? null;
    if (typeof raw === 'number') {
      if (raw >= 0 && raw <= 1) return Math.round(50 + raw * 35);
      if (raw >= -10 && raw <= 10) return Math.round(70 + raw * 2);
      return clamp(Math.round(raw), 45, 95);
    }
    const trust = numeric(p.coachTrust ?? p.trust, 50);
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
    const p = player();
    const attrs = p.attributes || p.ratings || {};
    const groups = {
      skating: attrs.skating || attrs.Skating || null,
      skill: attrs.shooting || attrs.Shooting || attrs.puckSkills || attrs.offense || null,
      scrimmage: attrs.iq || attrs.IQ || attrs.passing || attrs.Passing || null,
    };
    const values = attributeValues(groups[drillKey]);
    if (!values.length) return overall();
    return clamp(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), 40, 99);
  }

  function scoreDrill(drillKey, approach) {
    const ability = skillBase(drillKey);
    const roll = Math.floor(Math.random() * (approach.risk * 2 + 1)) - approach.risk;
    return clamp(Math.round(ability * 0.74 + formScore() * 0.14 + 12 + approach.bonus + roll), 45, 99);
  }

  function placementFrom(total) {
    if (total >= 84) return 'AAA';
    if (total >= 76) return 'AA';
    if (total >= 68) return 'A';
    return 'B';
  }

  function finishTryouts(scores) {
    const state = travel();
    if (!state) return null;
    const average = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
    const evaluation = Math.round(overall() * 0.55 + formScore() * 0.15 + average * 0.30);
    const level = placementFrom(evaluation);
    const completedAt = dateKey(state.tryoutDate || WorldEngine.state?.season?.currentDate || new Date().toISOString());

    state.placementLevel = level;
    state.status = 'placement-complete';
    state.tryoutResult = {
      completedAt,
      overallAtTryouts: overall(),
      formScore: formScore(),
      drillAverage: average,
      evaluationScore: evaluation,
      placementLevel: level,
      drills: scores.map(item => ({ ...item })),
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
        summary: `Placed at ${level} level for the summer travel season.`,
      };
    }

    WorldEngine.save?.();
    return state.tryoutResult;
  }

  function renderResult(result) {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    root.innerHTML = `
      <div class="pi-travel-shell">
        <div class="pi-travel-card pi-travel-result">
          <div class="pi-travel-kicker">Summer Travel Hockey · Placement</div>
          <div class="pi-travel-level">${result.placementLevel}</div>
          <h2>You made ${result.placementLevel}</h2>
          <p>Your summer placement is locked. The travel tournament world will now be built around this level only.</p>
          <div class="pi-travel-score">
            <div><span>Overall</span><strong>${result.overallAtTryouts}</strong></div>
            <div><span>Tryout</span><strong>${result.drillAverage}</strong></div>
            <div><span>Evaluation</span><strong>${result.evaluationScore}</strong></div>
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

  function renderDrill(index, scores) {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    const drill = DRILLS[index];
    root.innerHTML = `
      <div class="pi-travel-shell">
        <div class="pi-travel-kicker">Summer Travel Hockey · Tryouts</div>
        <h1 class="pi-travel-title">Earn Your Level</h1>
        <p class="pi-travel-sub">Three evaluations. Your ability matters most, but recent form and how you perform today can move your placement.</p>
        <div class="pi-travel-card">
          <div class="pi-travel-drill-head">
            <div class="pi-travel-drill-icon">${drill.icon}</div>
            <div><h2>${drill.label}</h2><p>${drill.detail}</p></div>
          </div>
          <div class="pi-travel-progress">${DRILLS.map((_, i) => `<i class="${i <= index ? 'on' : ''}"></i>`).join('')}</div>
          <div class="pi-travel-choices">
            ${APPROACHES.map(choice => `<button type="button" class="pi-travel-choice" data-approach="${choice.key}"><strong>${choice.label}</strong><span>${choice.note}</span></button>`).join('')}
          </div>
        </div>
      </div>`;

    root.querySelectorAll('.pi-travel-choice').forEach(button => {
      button.addEventListener('click', () => {
        const approach = APPROACHES.find(item => item.key === button.dataset.approach) || APPROACHES[1];
        const score = scoreDrill(drill.key, approach);
        const next = [...scores, { key: drill.key, label: drill.label, approach: approach.key, score }];
        if (index + 1 < DRILLS.length) renderDrill(index + 1, next);
        else renderResult(finishTryouts(next));
      });
    });
  }

  function openTryouts() {
    const state = travel();
    if (!state) return false;
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
    const p = player();
    root.innerHTML = `
      <div class="pi-travel-shell">
        <div class="pi-travel-kicker">Summer Travel Hockey</div>
        <h1 class="pi-travel-title">Travel Hockey Tryouts</h1>
        <p class="pi-travel-sub">The high school season is behind you. Today determines the level of your summer travel team.</p>
        <div class="pi-travel-card">
          <div class="pi-travel-meta">
            <div><span>Player</span><strong>${String(p.name || p.playerName || 'Career Player')}</strong></div>
            <div><span>Current Overall</span><strong>${overall()} OVR</strong></div>
            <div><span>Location</span><strong>${String(event?.location || 'Regional Ice Center')}</strong></div>
            <div><span>Guaranteed Floor</span><strong>B</strong></div>
          </div>
          <button type="button" class="pi-travel-continue" id="pi-travel-start-tryouts">Begin Tryouts</button>
        </div>
      </div>`;
    root.querySelector('#pi-travel-start-tryouts')?.addEventListener('click', () => renderDrill(0, []));
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
})();
