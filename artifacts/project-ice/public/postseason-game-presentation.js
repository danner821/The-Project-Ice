'use strict';

/* global WorldEngine, EventSystem, openPregameMatchup */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;

  const STYLE_ID = 'pi-postseason-game-presentation-styles';
  const EVENT_SCREEN_ID = 'event-screen';
  const PREGAME_SCREEN_ID = 'pregame-matchup-screen';

  const roundLabel = round => {
    const value = String(round || '').toLowerCase();
    if (value === 'round-one') return 'Round One';
    if (value === 'semifinals') return 'Semifinal';
    if (value === 'championship') return 'Championship';
    return 'Playoffs';
  };

  const isPlayoffGame = event => {
    const type = String(event?.type || event?.eventType || '').toLowerCase();
    return event?.isPlayoff === true && type === 'game';
  };

  const postseason = () =>
    WorldEngine.getHighSchoolPostseason?.() ||
    WorldEngine.state?.postseason?.highSchool ||
    null;

  function findSeries(event) {
    const rounds = postseason()?.bracket?.rounds || {};
    return [
      ...(rounds.roundOne || []),
      ...(rounds.semifinals || []),
      ...(rounds.championship || []),
    ].find(series => String(series?.seriesId || '') === String(event?.seriesId || '')) || null;
  }

  function teamShortName(teamId) {
    const team = (WorldEngine.state?.teams || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    );
    return team?.teamName || team?.schoolName || 'Team';
  }

  function careerTeamId() {
    const world = WorldEngine.state || {};
    const player = world.player || {};
    const playerId = player.playerId || player.id || 'career-player';
    const direct = player.teamId || player.highSchoolTeamId || null;

    for (const team of world.teams || []) {
      const found = (team?.roster || []).some(skater => {
        const id = skater?.playerId || skater?.id || null;
        return skater?.isCareerPlayer === true ||
          String(id || '') === String(playerId || '') ||
          String(id || '') === 'career-player';
      });
      if (found) return team.teamId || direct;
    }
    return direct;
  }

  function seriesStatus(event) {
    const series = findSeries(event);
    if (!series) return 'Best of 3';

    const high = Number(series?.wins?.[series.higherSeedTeamId]) || 0;
    const low = Number(series?.wins?.[series.lowerSeedTeamId]) || 0;
    if (high === low) return `Series tied ${high}-${low}`;

    const leaderId = high > low ? series.higherSeedTeamId : series.lowerSeedTeamId;
    return `${teamShortName(leaderId)} leads ${Math.max(high, low)}-${Math.min(high, low)}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen {
        position:relative;
        background:
          radial-gradient(circle at 50% 0%, rgba(103,176,255,.15), transparent 34%),
          linear-gradient(180deg,#071424 0%,#06111f 48%,#050d18 100%);
      }
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen::before,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen::before {
        content:'';position:absolute;inset:0 0 auto 0;height:3px;
        background:linear-gradient(90deg,transparent,rgba(112,185,255,.95),transparent);
        box-shadow:0 0 18px rgba(80,155,255,.45);pointer-events:none;z-index:2;
      }
      .pi-playoff-game-context {
        display:flex;align-items:center;justify-content:center;gap:7px;
        margin:10px auto 0;padding:7px 11px;width:fit-content;max-width:calc(100% - 36px);
        border:1px solid rgba(119,180,255,.22);border-radius:999px;
        background:rgba(38,95,165,.12);color:#9dc8ff;font-size:10px;line-height:1;
        font-weight:850;letter-spacing:.09em;text-transform:uppercase;
        box-shadow:0 8px 26px rgba(6,44,91,.18);
      }
      .pi-playoff-game-context__dot {
        width:4px;height:4px;border-radius:50%;background:#79b7ff;
        box-shadow:0 0 8px rgba(121,183,255,.8);flex:0 0 auto;
      }
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen .btn--primary,
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen #btn-ev-begin,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .btn--primary {
        box-shadow:0 14px 34px rgba(19,91,191,.30),inset 0 0 0 1px rgba(137,194,255,.18);
      }
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .pregame-matchup__header { padding-top:8px; }
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .pregame-matchup__title {
        text-shadow:0 0 24px rgba(105,173,255,.18);
      }
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .pregame-matchup__card,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen [class*='matchup-card'] {
        border-color:rgba(112,176,255,.22)!important;
        box-shadow:0 18px 44px rgba(0,0,0,.24),inset 0 0 0 1px rgba(99,163,246,.05);
      }
    `;
    document.head.appendChild(style);
  }

  function clearDecoration(root) {
    if (!root) return;
    root.classList.remove('pi-playoff-game-screen');
    root.querySelectorAll('.pi-playoff-game-context').forEach(node => node.remove());
  }

  function addContext(root, event, anchor) {
    if (!root || !anchor) return;
    root.querySelectorAll('.pi-playoff-game-context').forEach(node => node.remove());
    const strip = document.createElement('div');
    strip.className = 'pi-playoff-game-context';
    strip.innerHTML = `
      <span>${roundLabel(event.playoffRound)}</span>
      <span class="pi-playoff-game-context__dot"></span>
      <span>Game ${Number(event.gameNumber) || 1}</span>
      <span class="pi-playoff-game-context__dot"></span>
      <span>${seriesStatus(event)}</span>
    `;
    anchor.insertAdjacentElement('afterend', strip);
  }

  function replaceLeafText(root, exactText, replacement) {
    if (!root) return;
    for (const element of root.querySelectorAll('*')) {
      if (element.children.length === 0 && String(element.textContent || '').trim() === exactText) {
        element.textContent = replacement;
      }
    }
  }

  function decorateEventScreen(event) {
    if (!isPlayoffGame(event)) return;
    const root = document.getElementById(EVENT_SCREEN_ID);
    if (!root) return;

    clearDecoration(root);
    root.classList.add('pi-playoff-game-screen');

    const round = roundLabel(event.playoffRound);
    const number = Number(event.gameNumber) || 1;
    replaceLeafText(root, 'Regular Season', `${round} · Game ${number}`);

    const careerId = careerTeamId();
    const opponentId = String(event.homeTeamId || '') === String(careerId || '')
      ? event.awayTeamId
      : event.homeTeamId;
    const opponent = teamShortName(opponentId);

    for (const element of root.querySelectorAll('p,div,span')) {
      if (element.children.length > 0) continue;
      if (/^A regular-season (home|away) game against/i.test(String(element.textContent || '').trim())) {
        element.textContent = `High school ${round.toLowerCase()} — Game ${number} of a best-of-three series against the ${opponent}.`;
      }
    }

    const title = [...root.querySelectorAll('h1,h2,h3')].find(element =>
      /game vs|game at|home game|away game/i.test(String(element.textContent || ''))
    );
    if (title) addContext(root, event, title);
  }

  function decoratePregameScreen(event) {
    if (!isPlayoffGame(event)) return;
    const root = document.getElementById(PREGAME_SCREEN_ID);
    if (!root) return;

    clearDecoration(root);
    root.classList.add('pi-playoff-game-screen');

    const round = roundLabel(event.playoffRound);
    const number = Number(event.gameNumber) || 1;
    const title = document.getElementById('pregame-matchup-title');
    if (title) title.textContent = `${round} · Game ${number}`;

    const eyebrow = root.querySelector('.pregame-matchup__eyebrow');
    if (eyebrow) eyebrow.textContent = 'PROJECT ICE · POSTSEASON';

    const header = root.querySelector('.pregame-matchup__header');
    if (header) addContext(root, event, header);
  }

  injectStyles();

  const originalOpenEvent = EventSystem.openEvent?.bind(EventSystem);
  if (originalOpenEvent) {
    EventSystem.openEvent = function(eventId, origin = 'hub', eventData = null) {
      const eventRoot = document.getElementById(EVENT_SCREEN_ID);
      clearDecoration(eventRoot);

      const result = originalOpenEvent(eventId, origin, eventData);
      const current = EventSystem.getCurrentDef?.() || eventData;
      if (isPlayoffGame(current)) {
        window.requestAnimationFrame(() => decorateEventScreen(current));
      }
      return result;
    };
  }

  if (typeof openPregameMatchup === 'function') {
    const originalOpenPregameMatchup = openPregameMatchup;
    openPregameMatchup = function(eventDefinition) {
      const pregameRoot = document.getElementById(PREGAME_SCREEN_ID);
      clearDecoration(pregameRoot);

      const result = originalOpenPregameMatchup(eventDefinition);
      if (result !== false && isPlayoffGame(eventDefinition)) {
        window.requestAnimationFrame(() => decoratePregameScreen(eventDefinition));
      }
      return result;
    };
  }
})();
