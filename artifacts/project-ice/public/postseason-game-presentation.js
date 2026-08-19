'use strict';

/* global WorldEngine, EventSystem */

(() => {
  if (typeof WorldEngine === 'undefined') return;

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

  const gameId = item => String(item?.gameId || item?.eventId || item?.id || '');

  function currentEvent() {
    const def = typeof EventSystem !== 'undefined'
      ? EventSystem.getCurrentDef?.()
      : null;

    const id = gameId(def);
    const canonical = (WorldEngine.state?.schedule || []).find(item =>
      id && gameId(item) === id
    ) || null;

    return canonical || def || null;
  }

  function currentPlayoffGame() {
    const event = currentEvent();
    return event?.isPlayoff === true ? event : null;
  }

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function findSeries(event) {
    const rounds = postseason()?.bracket?.rounds || {};
    const all = [
      ...(rounds.roundOne || []),
      ...(rounds.semifinals || []),
      ...(rounds.championship || []),
    ];
    return all.find(series =>
      String(series?.seriesId || '') === String(event?.seriesId || '')
    ) || null;
  }

  function careerTeamId() {
    const world = WorldEngine.state || {};
    const player = world.player || {};
    const direct = player.teamId || player.highSchoolTeamId || null;
    const playerId = player.playerId || player.id || 'career-player';

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

  function teamShortName(teamId) {
    const team = (WorldEngine.state?.teams || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    );
    return team?.teamName || team?.schoolName || 'Team';
  }

  function seriesStatus(event) {
    const series = findSeries(event);
    if (!series) return 'Best of 3';

    const high = Number(series?.wins?.[series.higherSeedTeamId]) || 0;
    const low = Number(series?.wins?.[series.lowerSeedTeamId]) || 0;

    if (high === low) return `Series tied ${high}-${low}`;

    const leaderId = high > low
      ? series.higherSeedTeamId
      : series.lowerSeedTeamId;
    return `${teamShortName(leaderId)} leads ${Math.max(high, low)}-${Math.min(high, low)}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen {
        position: relative;
        background:
          radial-gradient(circle at 50% 0%, rgba(103,176,255,.15), transparent 34%),
          linear-gradient(180deg, #071424 0%, #06111f 48%, #050d18 100%);
      }
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen::before,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, rgba(112,185,255,.95), transparent);
        box-shadow: 0 0 18px rgba(80,155,255,.45);
        pointer-events: none;
        z-index: 2;
      }
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen .pi-playoff-game-context,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .pi-playoff-game-context {
        display:flex;align-items:center;justify-content:center;gap:7px;
        margin:10px auto 0;padding:7px 11px;width:fit-content;
        max-width:calc(100% - 36px);border:1px solid rgba(119,180,255,.22);
        border-radius:999px;background:rgba(38,95,165,.12);color:#9dc8ff;
        font-size:10px;line-height:1;font-weight:850;letter-spacing:.09em;
        text-transform:uppercase;box-shadow:0 8px 26px rgba(6,44,91,.18);
      }
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen .pi-playoff-game-context__dot,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .pi-playoff-game-context__dot {
        width:4px;height:4px;border-radius:50%;background:#79b7ff;
        box-shadow:0 0 8px rgba(121,183,255,.8);flex:0 0 auto;
      }
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen .btn--primary,
      #${EVENT_SCREEN_ID}.pi-playoff-game-screen #btn-ev-begin,
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .btn--primary {
        box-shadow:0 14px 34px rgba(19,91,191,.30),inset 0 0 0 1px rgba(137,194,255,.18);
      }
      #${PREGAME_SCREEN_ID}.pi-playoff-game-screen .pregame-matchup { position:relative; }
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

  function setText(element, value) {
    if (!element) return;
    if (!element.dataset.piOriginalText) {
      element.dataset.piOriginalText = element.textContent || '';
    }
    if (String(element.textContent || '') === String(value)) return;
    element.textContent = value;
  }

  function restoreText(root) {
    root?.querySelectorAll('[data-pi-original-text]').forEach(element => {
      const original = element.dataset.piOriginalText || '';
      if (element.textContent !== original) element.textContent = original;
      delete element.dataset.piOriginalText;
    });
  }

  function addContext(root, event, anchor) {
    if (!root || !event) return;

    let strip = root.querySelector('.pi-playoff-game-context');
    if (!strip) {
      strip = document.createElement('div');
      strip.className = 'pi-playoff-game-context';
      const target = anchor || root.firstElementChild;
      target?.insertAdjacentElement('afterend', strip);
    }

    const label = roundLabel(event.playoffRound);
    const number = Number(event.gameNumber) || 1;
    const status = seriesStatus(event);
    const signature = `${label}|${number}|${status}`;
    if (strip.dataset.piSignature === signature) return;

    strip.dataset.piSignature = signature;
    strip.innerHTML = `
      <span>${label}</span>
      <span class="pi-playoff-game-context__dot"></span>
      <span>Game ${number}</span>
      <span class="pi-playoff-game-context__dot"></span>
      <span>${status}</span>
    `;
  }

  function removeContext(root) {
    root?.querySelectorAll('.pi-playoff-game-context').forEach(item => item.remove());
  }

  function replaceExactText(root, from, to) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const matches = [];
    while (walker.nextNode()) {
      const element = walker.currentNode;
      if (element.children.length === 0 && String(element.textContent || '').trim() === from) {
        matches.push(element);
      }
    }
    matches.forEach(element => setText(element, to));
  }

  function replaceRegularSeasonDescription(root, event) {
    if (!root) return;

    const careerId = careerTeamId();
    const opponentId = String(event.homeTeamId || '') === String(careerId || '')
      ? event.awayTeamId
      : event.homeTeamId;
    const opponent = teamShortName(opponentId);
    const round = roundLabel(event.playoffRound).toLowerCase();
    const number = Number(event.gameNumber) || 1;

    root.querySelectorAll('p, div, span').forEach(element => {
      if (element.children.length > 0) return;
      const text = String(element.textContent || '').trim();
      if (/^A regular-season (home|away) game against/i.test(text)) {
        setText(
          element,
          `High school ${round} — Game ${number} of a best-of-three series against the ${opponent}.`
        );
      }
    });
  }

  function decorateEventScreen(event) {
    const root = document.getElementById(EVENT_SCREEN_ID);
    if (!root) return;

    root.classList.add('pi-playoff-game-screen');
    const round = roundLabel(event.playoffRound);
    const number = Number(event.gameNumber) || 1;

    replaceExactText(root, 'Regular Season', `${round} · Game ${number}`);
    replaceRegularSeasonDescription(root, event);

    const title = [...root.querySelectorAll('h1, h2, h3')].find(element =>
      /game vs|game at|home game|away game/i.test(String(element.textContent || ''))
    );
    addContext(root, event, title);
  }

  function decoratePregameScreen(event) {
    const root = document.getElementById(PREGAME_SCREEN_ID);
    if (!root) return;

    root.classList.add('pi-playoff-game-screen');
    const round = roundLabel(event.playoffRound);
    const number = Number(event.gameNumber) || 1;

    setText(document.getElementById('pregame-matchup-title'), `${round} · Game ${number}`);
    setText(root.querySelector('.pregame-matchup__eyebrow'), 'PROJECT ICE · POSTSEASON');
    addContext(root, event, root.querySelector('.pregame-matchup__header'));
  }

  function clearScreen(root) {
    if (!root) return;
    root.classList.remove('pi-playoff-game-screen');
    restoreText(root);
    removeContext(root);
  }

  function sync() {
    injectStyles();

    const eventScreen = document.getElementById(EVENT_SCREEN_ID);
    const pregameScreen = document.getElementById(PREGAME_SCREEN_ID);
    const eventVisible = eventScreen && !eventScreen.classList.contains('screen--hidden');
    const pregameVisible = pregameScreen && !pregameScreen.classList.contains('screen--hidden');

    if (!eventVisible && !pregameVisible) return;

    const playoffGame = currentPlayoffGame();
    if (!playoffGame) {
      if (eventVisible) clearScreen(eventScreen);
      if (pregameVisible) clearScreen(pregameScreen);
      return;
    }

    if (eventVisible) decorateEventScreen(playoffGame);
    if (pregameVisible) decoratePregameScreen(playoffGame);
  }

  injectStyles();
  sync();

  const observer = new MutationObserver(() => sync());
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  window.setInterval(sync, 250);
})();
