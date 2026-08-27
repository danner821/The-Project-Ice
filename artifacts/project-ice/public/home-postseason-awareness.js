'use strict';

/* global WorldEngine, Game */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const normalize = value => String(value || '').trim().toLowerCase();
  const dateKey = value => String(value || '').slice(0, 10);

  function world() {
    return WorldEngine.state || {};
  }

  function postseason() {
    return world()?.postseason?.highSchool || null;
  }

  function careerTeamId() {
    return String(
      world()?.player?.teamId ||
      world()?.player?.highSchoolTeamId ||
      Game?.player?.teamId ||
      Game?.player?.highSchoolTeamId ||
      ''
    );
  }

  function team(teamId) {
    return (world()?.teams || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function teamName(teamId) {
    const item = team(teamId);
    if (!item) return 'Opponent';
    return String(item.teamName || item.schoolName || item.abbreviation || 'Opponent');
  }

  function fullTeamName(teamId) {
    const item = team(teamId);
    if (!item) return 'Unknown Team';
    return `${item.schoolName || ''} ${item.teamName || ''}`.trim() || item.abbreviation || 'Unknown Team';
  }

  function roundLabel(round) {
    const value = normalize(round);
    if (value === 'round-one') return 'Round One';
    if (value === 'semifinals' || value === 'semifinal') return 'Semifinal';
    if (value === 'championship') return 'Championship';
    return 'Playoffs';
  }

  function allSeries(ps) {
    const rounds = ps?.bracket?.rounds || {};
    return [
      ...(rounds.roundOne || []),
      ...(rounds.semifinals || []),
      ...(rounds.championship || []),
    ];
  }

  function seriesContains(series, teamId) {
    return [series?.higherSeedTeamId, series?.lowerSeedTeamId]
      .some(id => String(id || '') === String(teamId || ''));
  }

  function currentCareerSeries(ps, teamId) {
    const candidates = allSeries(ps).filter(series =>
      seriesContains(series, teamId) &&
      series?.status !== 'complete'
    );
    return candidates[candidates.length - 1] || null;
  }

  function completedCareerSeries(ps, teamId) {
    return allSeries(ps).filter(series =>
      seriesContains(series, teamId) && series?.status === 'complete'
    );
  }

  function careerEliminated(ps, teamId) {
    const completed = completedCareerSeries(ps, teamId);
    return completed.some(series => String(series?.loserTeamId || '') === String(teamId || ''));
  }

  function careerSeed(ps, teamId) {
    return (ps?.frozenStandings || []).find(item =>
      String(item?.teamId || '') === String(teamId || '')
    ) || null;
  }

  function nextGameForSeries(series) {
    if (!series) return null;
    const ids = new Set((series.games || []).map(game =>
      String(game?.gameId || game?.eventId || game?.id || '')
    ).filter(Boolean));

    return (world()?.schedule || [])
      .filter(game => ids.has(String(game?.gameId || game?.eventId || game?.id || '')))
      .filter(game => game?.isPlayoff === true)
      .filter(game => game?.completed !== true && game?.played !== true && game?.canceled !== true)
      .sort((a, b) => dateKey(a?.date).localeCompare(dateKey(b?.date)))[0] || null;
  }

  function nextLeaguePlayoffGame() {
    return (world()?.schedule || [])
      .filter(game => game?.isPlayoff === true)
      .filter(game => game?.completed !== true && game?.played !== true && game?.canceled !== true)
      .sort((a, b) => dateKey(a?.date).localeCompare(dateKey(b?.date)))[0] || null;
  }

  function prettyDate(value) {
    const key = dateKey(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return 'Coming up';
    const date = new Date(`${key}T12:00:00`);
    if (Number.isNaN(date.getTime())) return 'Coming up';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function seriesWins(series, teamId) {
    return Number(series?.wins?.[teamId] || 0);
  }

  function opponentId(series, teamId) {
    if (!series) return '';
    return String(series.higherSeedTeamId || '') === String(teamId || '')
      ? series.lowerSeedTeamId
      : series.higherSeedTeamId;
  }

  function setText(id, text) {
    const node = document.getElementById(id);
    if (node && text !== undefined && text !== null) node.textContent = String(text);
  }

  function setStandingsFinalPresentation() {
    const card = document.getElementById('hub-standings-card');
    if (!card) return;

    const title = card.querySelector('.hub-dash-card__title');
    if (title) title.textContent = 'Final Regular Season Standings';

    const kicker = card.querySelector('.home-section-kicker');
    if (kicker) kicker.textContent = 'League · Final';

    card.dataset.piPostseasonFrozen = 'true';
  }

  function objectiveFor(ps, teamId) {
    const seed = careerSeed(ps, teamId);
    const eliminated = careerEliminated(ps, teamId);
    const champion = String(ps?.championTeamId || '') === String(teamId || '');
    const activeSeries = currentCareerSeries(ps, teamId);
    const status = normalize(ps?.status);

    if (!seed) {
      return {
        stage: 'Postseason',
        title: 'Season Complete',
        text: 'Your team missed the playoff field. Follow the postseason and prepare for what comes next.',
      };
    }

    if (champion) {
      return {
        stage: 'Champions',
        title: 'Championship Won',
        text: 'You finished the postseason on top. The league title belongs to your team.',
      };
    }

    if (eliminated) {
      return {
        stage: 'Postseason',
        title: 'Playoff Run Complete',
        text: 'Your season is over, but the league postseason continues around you.',
      };
    }

    if (status === 'break' || ps?.checkpointAcknowledged !== true) {
      return {
        stage: `#${seed.seed} Seed · Playoffs`,
        title: 'Prepare for the Playoffs',
        text: seed.seed <= 2
          ? 'Use the first-round bye to prepare for your semifinal matchup.'
          : 'Get ready for a best-of-three opening-round series.',
      };
    }

    if (activeSeries) {
      const round = roundLabel(activeSeries.round);
      const oppId = opponentId(activeSeries, teamId);
      const yourWins = seriesWins(activeSeries, teamId);
      const oppWins = seriesWins(activeSeries, oppId);
      return {
        stage: `${round} · #${seed.seed} Seed`,
        title: round === 'Championship' ? 'Win the Championship' : `Win the ${round}`,
        text: `${teamName(oppId)} is next. Series ${yourWins}-${oppWins}; first to two wins advances.`,
      };
    }

    return {
      stage: `#${seed.seed} Seed · Playoffs`,
      title: 'Stay Ready',
      text: 'The bracket is moving. Your next postseason matchup will appear when the round is set.',
    };
  }

  function bigMomentFor(ps, teamId) {
    const seed = careerSeed(ps, teamId);
    const eliminated = careerEliminated(ps, teamId);
    const champion = String(ps?.championTeamId || '') === String(teamId || '');
    const activeSeries = currentCareerSeries(ps, teamId);
    const nextCareerGame = nextGameForSeries(activeSeries);

    if (champion) {
      return {
        icon: '🏆',
        title: 'League Champions',
        detail: `${fullTeamName(teamId)} won the high school championship.`,
        meta: ps?.completedDate ? `Clinched ${prettyDate(ps.completedDate)}` : 'Championship secured',
      };
    }

    if (nextCareerGame && activeSeries) {
      const oppId = opponentId(activeSeries, teamId);
      const gameNumber = Number(nextCareerGame?.gameNumber || 1);
      return {
        icon: '🏒',
        title: `${roundLabel(activeSeries.round)} · Game ${gameNumber}`,
        detail: `Best-of-three series against ${teamName(oppId)}.`,
        meta: prettyDate(nextCareerGame.date),
      };
    }

    if (seed?.seed <= 2 && normalize(ps?.status) === 'round-one' && !eliminated) {
      return {
        icon: '⏭️',
        title: 'First-Round Bye',
        detail: 'Your semifinal opponent will be determined by the opening-round results.',
        meta: `Entered as the #${seed.seed} seed`,
      };
    }

    const nextLeagueGame = nextLeaguePlayoffGame();
    if (eliminated && nextLeagueGame) {
      return {
        icon: '🏆',
        title: 'Postseason Continues',
        detail: 'Your run is over. Follow the remaining bracket from the League tab.',
        meta: `${roundLabel(nextLeagueGame.playoffRound)} · ${prettyDate(nextLeagueGame.date)}`,
      };
    }

    if (ps?.championTeamId) {
      return {
        icon: '🏆',
        title: 'Champion Crowned',
        detail: `${fullTeamName(ps.championTeamId)} won the league championship.`,
        meta: ps?.completedDate ? prettyDate(ps.completedDate) : 'Postseason complete',
      };
    }

    return {
      icon: '🏒',
      title: 'Playoff Bracket',
      detail: 'The postseason is underway. Follow every series from the League tab.',
      meta: 'Postseason',
    };
  }

  function applyHomePostseasonAwareness() {
    const ps = postseason();
    if (!ps?.initialized) return false;

    const teamId = careerTeamId();
    const objective = objectiveFor(ps, teamId);
    const moment = bigMomentFor(ps, teamId);

    setText('home-objective-stage', objective.stage);
    setText('hub-current-objective-title', objective.title);
    setText('hub-current-objective', objective.text);

    setText('home-big-moment-icon', moment.icon);
    setText('home-big-moment-title', moment.title);
    setText('home-big-moment-detail', moment.detail);
    setText('home-big-moment-meta', moment.meta);

    setStandingsFinalPresentation();
    return true;
  }

  function applyAfterCore() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => applyHomePostseasonAwareness());
    });
  }

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('[data-tab], [data-hub-tab], [data-tab-target], .hub-tab, .hub-nav__item');
    if (!target) return;

    const label = normalize(
      target?.dataset?.tab ||
      target?.dataset?.hubTab ||
      target?.dataset?.tabTarget ||
      target?.textContent
    );

    if (label === 'home' || label.includes('home')) applyAfterCore();
  });

  const originalAdvance = WorldEngine.advanceToDate?.bind(WorldEngine);
  if (originalAdvance) {
    WorldEngine.advanceToDate = function(...args) {
      const result = originalAdvance(...args);
      applyAfterCore();
      return result;
    };
  }

  const originalReconcile = WorldEngine.reconcileHighSchoolPostseason?.bind(WorldEngine);
  if (originalReconcile) {
    WorldEngine.reconcileHighSchoolPostseason = function(...args) {
      const result = originalReconcile(...args);
      applyAfterCore();
      return result;
    };
  }

  WorldEngine.applyHomePostseasonAwareness = applyHomePostseasonAwareness;
  applyAfterCore();
})();
