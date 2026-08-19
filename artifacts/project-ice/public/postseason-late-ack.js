'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const originalAcknowledge =
    typeof WorldEngine.acknowledgeHighSchoolPostseasonCheckpoint === 'function'
      ? WorldEngine.acknowledgeHighSchoolPostseasonCheckpoint.bind(WorldEngine)
      : null;

  if (!originalAcknowledge) return;

  const key = value => {
    const text = String(value || '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
  };

  const addDays = (value, days) => {
    const dateKey = key(value);
    if (!dateKey) return null;
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };

  function currentDate() {
    const world = WorldEngine.state || {};
    return key(
      world?.season?.currentDate ||
      world?.player?.currentDate ||
      world?.currentDate
    );
  }

  function gameId(game) {
    return String(game?.gameId || game?.eventId || game?.id || '');
  }

  function hasFinalScore(game) {
    return (
      game?.homeScore !== null && game?.homeScore !== undefined &&
      game?.awayScore !== null && game?.awayScore !== undefined &&
      Number.isFinite(Number(game.homeScore)) &&
      Number.isFinite(Number(game.awayScore))
    );
  }

  function isFinal(game) {
    return Boolean(
      game?.played === true ||
      game?.completed === true ||
      String(game?.status || '').toLowerCase() === 'final' ||
      hasFinalScore(game)
    );
  }

  function updateCanonicalGameDate(id, date) {
    if (!id || !date) return;
    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];
    const canonical = schedule.find(game => gameId(game) === String(id));
    if (canonical && !isFinal(canonical)) canonical.date = date;
  }

  function redateSeries(series, startDate) {
    if (!series || !startDate || series.status === 'complete') return;

    (series.games || []).forEach((game, index) => {
      if (isFinal(game)) return;
      const number = Number(game?.gameNumber) || (index + 1);
      const date = addDays(startDate, (number - 1) * 2);
      if (!date) return;
      game.date = date;
      updateCanonicalGameDate(gameId(game), date);
    });
  }

  function rebaseIfLate() {
    const post =
      WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;

    const now = currentDate();
    const originalStart = key(post?.playoffStartDate);

    if (!post?.initialized || !now || !originalStart) return false;

    const schedule = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const anyPlayoffFinal = schedule.some(game =>
      game?.isPlayoff === true && isFinal(game)
    );

    /*
     * Normal checkpoint acknowledgement happens before Round One starts and
     * must preserve the authored dates. Only recover a late acknowledgement
     * when every playoff game is still untouched and the original start has
     * already passed.
     */
    if (anyPlayoffFinal || now < originalStart) return false;

    const newRoundOneStart = addDays(now, 1);
    if (!newRoundOneStart || newRoundOneStart === originalStart) return false;

    const newSemifinalStart = addDays(newRoundOneStart, 6);
    const newChampionshipStart = addDays(newRoundOneStart, 12);

    post.playoffStartDate = newRoundOneStart;
    post.semifinalStartDate = newSemifinalStart;
    post.championshipStartDate = newChampionshipStart;
    post.lateCheckpointRebased = true;
    post.lateCheckpointRebasedAt = now;

    const rounds = post?.bracket?.rounds || {};

    (rounds.roundOne || []).forEach(series =>
      redateSeries(series, newRoundOneStart)
    );

    (rounds.semifinals || []).forEach(series =>
      redateSeries(series, newSemifinalStart)
    );

    (rounds.championship || []).forEach(series =>
      redateSeries(series, newChampionshipStart)
    );

    if (Array.isArray(WorldEngine.state?.schedule)) {
      WorldEngine.state.schedule.sort((a, b) =>
        String(a?.date || '').localeCompare(String(b?.date || '')) ||
        gameId(a).localeCompare(gameId(b))
      );
    }

    return true;
  }

  WorldEngine.acknowledgeHighSchoolPostseasonCheckpoint = function acknowledgeWithLateRecovery(options = {}) {
    const rebased = rebaseIfLate();
    const result = originalAcknowledge({ ...options, save: false });

    WorldEngine.reconcileHighSchoolPostseason?.({ save: false });
    WorldEngine.syncHighSchoolPostseasonCadence?.({ save: false });

    if (options.save !== false) WorldEngine.save?.();

    return {
      ...(result || {}),
      postseasonScheduleRebased: rebased,
    };
  };
})();
