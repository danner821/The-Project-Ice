'use strict';

/* global WorldEngine, EventSystem, openPregameMatchup */

(() => {
  if (typeof WorldEngine === 'undefined' || typeof EventSystem === 'undefined') return;

  const STYLE_ID = 'pi-postseason-game-presentation-styles';
  const EVENT_SCREEN_ID = 'event-screen';
  const PREGAME_SCREEN_ID = 'pregame-matchup-screen';
  let activePlayoffGame = null;

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

  function teamRecord(teamId) {
    return (WorldEngine.state?.teams || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function teamShortName(teamId) {
    const team = teamRecord(teamId);
    return team?.teamName || team?.schoolName || team?.name || 'Team';
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

  function formatDate(value) {
    const key = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return String(value || 'TBD');
    const date = new Date(`${key}T12:00:00`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
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
      .pi-playoff-event-details {
        margin:22px 0 24px;padding:0 18px;border:1px solid rgba(112,176,255,.18);
        border-radius:18px;background:rgba(20,47,78,.28);overflow:hidden;
        box-shadow:0 16px 38px rgba(0,0,0,.18),inset 0 0 0 1px rgba(104,171,255,.03);
      }
      .pi-playoff-event-detail {
        display:flex;align-items:center;justify-content:space-between;gap:18px;
        min-height:58px;border-bottom:1px solid rgba(132,166,205,.12);
      }
      .pi-playoff-event-detail:last-child { border-bottom:0; }
      .pi-playoff-event-detail__label {
        color:#7f9fc4;font-size:10px;font-weight:850;letter-spacing:.15em;text-transform:uppercase;
      }
      .pi-playoff-event-detail__value {
        color:#edf5ff;font-size:14px;font-weight:750;text-align:right;
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
    root.querySelectorAll('.pi-playoff-game-context,.pi-playoff-event-details').forEach(node => node.remove());
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
    if (!root) return false;
    for (const element of root.querySelectorAll('*')) {
      if (element.children.length === 0 && String(element.textContent || '').trim() === exactText) {
        element.textContent = replacement;
        return true;
      }
    }
    return false;
  }

  function replaceFirstMatchingLeaf(root, patterns, replacement) {
    if (!root) return false;
    for (const element of root.querySelectorAll('*')) {
      if (element.children.length > 0) continue;
      const text = String(element.textContent || '').trim();
      if (patterns.some(pattern => pattern.test(text))) {
        element.textContent = replacement;
        return true;
      }
    }
    return false;
  }

  function eventOpponent(event) {
    const careerId = careerTeamId();
    return String(event.homeTeamId || '') === String(careerId || '')
      ? event.awayTeamId
      : event.homeTeamId;
  }

  function eventVenue(event) {
    return event.venue || event.location || event.arena || event.rink || 'TBD';
  }

  function eventObjective(event) {
    const status = seriesStatus(event);
    const gameNumber = Number(event.gameNumber) || 1;
    if (gameNumber === 1) return 'Set the tone and take control of the series.';
    if (/tied/i.test(status)) return 'Break the tie and seize the series advantage.';
    if (/leads/i.test(status) && status.startsWith(teamShortName(careerTeamId()))) {
      return 'Finish the job and close out the series.';
    }
    return 'Respond under pressure and keep the season alive.';
  }

  function addEventDetails(root, event, anchor) {
    if (!root || !anchor) return;
    root.querySelectorAll('.pi-playoff-event-details').forEach(node => node.remove());

    const opponentId = eventOpponent(event);
    const details = document.createElement('div');
    details.className = 'pi-playoff-event-details';
    details.innerHTML = `
      <div class="pi-playoff-event-detail">
        <span class="pi-playoff-event-detail__label">Round</span>
        <span class="pi-playoff-event-detail__value">${roundLabel(event.playoffRound)} · Game ${Number(event.gameNumber) || 1}</span>
      </div>
      <div class="pi-playoff-event-detail">
        <span class="pi-playoff-event-detail__label">Opponent</span>
        <span class="pi-playoff-event-detail__value">${teamShortName(opponentId)}</span>
      </div>
      <div class="pi-playoff-event-detail">
        <span class="pi-playoff-event-detail__label">Venue</span>
        <span class="pi-playoff-event-detail__value">${eventVenue(event)}</span>
      </div>
      <div class="pi-playoff-event-detail">
        <span class="pi-playoff-event-detail__label">Date</span>
        <span class="pi-playoff-event-detail__value">${formatDate(event.date)}</span>
      </div>
      <div class="pi-playoff-event-detail">
        <span class="pi-playoff-event-detail__label">Series</span>
        <span class="pi-playoff-event-detail__value">${seriesStatus(event)}</span>
      </div>
    `;
    anchor.insertAdjacentElement('beforebegin', details);
  }

  function decorateEventScreen(event) {
    if (!isPlayoffGame(event)) return;
    const root = document.getElementById(EVENT_SCREEN_ID);
    if (!root) return;

    clearDecoration(root);
    root.classList.add('pi-playoff-game-screen');

    const round = roundLabel(event.playoffRound);
    const number = Number(event.gameNumber) || 1;
    const opponentId = eventOpponent(event);
    const opponent = teamShortName(opponentId);

    const title = [...root.querySelectorAll('h1,h2,h3')].find(element =>
      /playoff game|game vs|game at|home game|away game/i.test(String(element.textContent || ''))
    );
    if (title) {
      title.textContent = `${round} · Game ${number}`;
      addContext(root, event, title);
    }

    replaceLeafText(root, 'Regular Season', `${round} · Game ${number}`);
    replaceFirstMatchingLeaf(
      root,
      [/^Prepare for the event\.?$/i, /^Game Day$/i],
      eventObjective(event),
    );
    replaceFirstMatchingLeaf(
      root,
      [/^Review the event details before continuing\.?$/i, /^A regular-season (home|away) game against/i],
      `Game ${number} of a best-of-three ${round.toLowerCase()} series against ${opponent}. ${seriesStatus(event)}.`,
    );

    const beginButton = root.querySelector('#btn-ev-begin,button.btn--primary,.btn--primary');
    if (beginButton) addEventDetails(root, event, beginButton);
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
      activePlayoffGame = isPlayoffGame(eventData) ? eventData : null;

      const result = originalOpenEvent(eventId, origin, eventData);
      if (activePlayoffGame) {
        window.requestAnimationFrame(() => decorateEventScreen(activePlayoffGame));
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
      const playoffGame = isPlayoffGame(eventDefinition)
        ? eventDefinition
        : activePlayoffGame;
      if (result !== false && playoffGame) {
        window.requestAnimationFrame(() => decoratePregameScreen(playoffGame));
      }
      return result;
    };
  }
})();
