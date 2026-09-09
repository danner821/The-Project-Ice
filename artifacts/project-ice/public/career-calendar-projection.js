'use strict';

/* global WorldEngine, buildSeasonCalendarEvents, refreshScheduleEvents, setupHubCalendar, renderScheduleCalendar, renderScheduleKeyEvents, scheduleViewYear, scheduleViewMonth, renderLeagueStandingsPreview */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__careerCalendarProjectionInstalled === true) return;

  if (
    typeof buildSeasonCalendarEvents !== 'function' ||
    typeof refreshScheduleEvents !== 'function'
  ) {
    console.error('[Project Ice] Career Calendar Projection could not find the core calendar renderer.');
    return;
  }

  WorldEngine.__careerCalendarProjectionInstalled = true;

  const originalBuildSeasonCalendarEvents = buildSeasonCalendarEvents;

  const eventKey = event =>
    String(
      event?.canonicalEventId ||
      event?.eventId ||
      event?.gameId ||
      event?.id ||
      ''
    );

  const eventIds = event => [
    event?.canonicalEventId,
    event?.eventId,
    event?.gameId,
    event?.id,
  ].filter(Boolean).map(String);

  const dateKey = event => String(event?.date || '').slice(0, 10);

  const isGame = event => Boolean(
    event?.type === 'game' ||
    event?.type === 'travel-game' ||
    (
      event?.homeTeamId &&
      event?.awayTeamId
    )
  );

  const isHighSchoolRegularSeasonGame = event => {
    if (!event || !isGame(event)) return false;

    const type = String(event?.type || event?.eventType || '').toLowerCase();

    if (
      type === 'travel-game' ||
      event?.travelTournament === true ||
      event?.postseasonGame === true ||
      event?.isPostseasonGame === true ||
      event?.playoffGame === true ||
      event?.postseason === true ||
      event?.playoff === true ||
      String(event?.seasonScope || '').toLowerCase().includes('playoff') ||
      String(event?.scope || '').toLowerCase().includes('playoff')
    ) {
      return false;
    }

    return Boolean(event?.homeTeamId && event?.awayTeamId);
  };

  const teamById = teamId =>
    (WorldEngine.state?.teams || []).find(team =>
      String(team?.teamId || team?.id || '') === String(teamId || '')
    ) || null;

  const teamName = team => String(
    team?.schoolName && team?.teamName
      ? `${team.schoolName} ${team.teamName}`
      : team?.teamName ||
        team?.name ||
        team?.schoolName ||
        team?.abbreviation ||
        'Opponent'
  ).trim();

  const careerTeamId = () => String(
    (WorldEngine.state?.teams || [])
      .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
      .find(player => player?.isCareerPlayer === true || player?.isUser === true)
      ?.teamId ||
    WorldEngine.state?.player?.teamId ||
    ''
  );

  const findCanonicalGame = (event, canonicalSchedule) => {
    const wantedIds = new Set(eventIds(event));

    let match = canonicalSchedule.find(candidate =>
      isGame(candidate) &&
      eventIds(candidate).some(id => wantedIds.has(id))
    ) || null;

    if (match) return match;

    const eventDate = dateKey(event);
    const homeTeamId = String(event?.homeTeamId || '');
    const awayTeamId = String(event?.awayTeamId || '');

    if (!eventDate || !homeTeamId || !awayTeamId) return null;

    return canonicalSchedule.find(candidate =>
      isGame(candidate) &&
      dateKey(candidate) === eventDate &&
      String(candidate?.homeTeamId || '') === homeTeamId &&
      String(candidate?.awayTeamId || '') === awayTeamId
    ) || null;
  };

  /*
   * Regular-season HS games use one presentation contract in every school year.
   * This runs inside the calendar projector itself — the same source that Home
   * and Schedule consume — so sophomore/junior/senior games cannot fall back to
   * the EventSystem catalog's generic "Upcoming Event" copy.
   */
  const presentHighSchoolGame = (event, canonicalSchedule) => {
    if (!isHighSchoolRegularSeasonGame(event)) return event;

    const canonicalGame = findCanonicalGame(event, canonicalSchedule);
    const merged = canonicalGame
      ? { ...canonicalGame, ...event }
      : event;

    const home = teamById(merged.homeTeamId);
    const away = teamById(merged.awayTeamId);

    if (!home || !away) return merged;

    const homeName = teamName(home);
    const awayName = teamName(away);
    const matchup = `${awayName} at ${homeName}`;

    const playerTeamId = careerTeamId();
    const playerIsHome =
      playerTeamId &&
      String(merged.homeTeamId) === playerTeamId;

    const opponent = playerIsHome ? away : home;
    const opponentName = teamName(opponent);
    const venueWord = playerIsHome ? 'home' : 'away';

    const rawLabel = String(merged.label || merged.title || '').trim();
    const rawObjective = String(merged.objective || '').trim();
    const rawDescription = String(merged.description || '').trim();

    const genericTitle =
      !rawLabel ||
      /^upcoming event$/i.test(rawLabel) ||
      /^open day$/i.test(rawLabel);

    const genericObjective =
      !rawObjective ||
      /^prepare for the event\.?$/i.test(rawObjective) ||
      /^no scheduled activities\.?$/i.test(rawObjective);

    const genericDescription =
      !rawDescription ||
      /^review the event details before continuing\.?$/i.test(rawDescription);

    const label = genericTitle ? matchup : rawLabel;

    return {
      ...merged,
      label,
      title: label,
      shortLabel:
        merged.shortLabel ||
        `${away?.abbreviation || awayName} at ${home?.abbreviation || homeName}`,
      objective: genericObjective
        ? `Regular-season ${venueWord} game against ${opponentName}.`
        : merged.objective,
      description: genericDescription
        ? `${awayName} visits ${homeName} in regular-season league play.`
        : merged.description,
      details: {
        Opponent: opponentName,
        Matchup: matchup,
        ...(merged.details && typeof merged.details === 'object'
          ? merged.details
          : {}),
      },
    };
  };

  const shouldProjectCareerEvent = event => {
    if (!event || isGame(event)) return false;
    if (!dateKey(event)) return false;

    const type = String(event?.type || event?.eventType || '').toLowerCase();

    return Boolean(
      event?.isCareerEvent === true ||
      event?.requiresPlayerInteraction === true ||
      event?.returningYearTryout === true ||
      type === 'tryout' ||
      type === 'meeting' ||
      type === 'coach-meeting' ||
      type === 'scouting' ||
      type === 'awards'
    );
  };

  /*
   * Core calendar contract:
   * WorldEngine.state.schedule is authoritative. The old UI projector only
   * whitelisted practice/recovery/training/coach-meeting, which meant a real
   * canonical tryout could exist, stop simulation, and still be invisible on
   * Home/Schedule. Preserve the existing game presentation, then add every
   * dated career event that the player can actually interact with.
   */
  buildSeasonCalendarEvents = function buildCanonicalCareerCalendarEvents() {
    const rawProjected = originalBuildSeasonCalendarEvents();
    const canonical = Array.isArray(WorldEngine.state?.schedule)
      ? WorldEngine.state.schedule
      : [];

    const projected = Array.isArray(rawProjected)
      ? rawProjected.map(event =>
          presentHighSchoolGame(event, canonical)
        )
      : [];

    const existingKeys = new Set(
      projected
        .flatMap(event => [
          eventKey(event),
          String(event?.eventId || ''),
          String(event?.id || ''),
        ])
        .filter(Boolean)
    );

    const additionalCareerEvents = canonical
      .filter(shouldProjectCareerEvent)
      .filter(event => {
        const keys = [
          eventKey(event),
          String(event?.eventId || ''),
          String(event?.id || ''),
        ].filter(Boolean);

        return !keys.some(key => existingKeys.has(key));
      })
      .map(event => ({
        ...event,

        /*
         * Preserve EventSystem identity. Do not rewrite eventId to id.
         * The Season Engine reports blocking events by eventId first, so this
         * is what lets a Sept. 2 tryout stop simulation and open immediately.
         */
        eventId:
          event.eventId ||
          event.id,

        isCompleted: Boolean(
          event.completed === true ||
          event.played === true ||
          String(event.status || '').toLowerCase() === 'completed'
        ),
      }));

    return [
      ...projected,
      ...additionalCareerEvents,
    ].sort((a, b) =>
      dateKey(a).localeCompare(dateKey(b)) ||
      eventKey(a).localeCompare(eventKey(b))
    );
  };

  /*
   * Home must never depend on somebody having visited Schedule first.
   * Rebuild the UI mirror from canonical state every time Home renders.
   */
  if (typeof setupHubCalendar === 'function') {
    const originalSetupHubCalendar = setupHubCalendar;

    setupHubCalendar = function setupCanonicalHubCalendar(...args) {
      refreshScheduleEvents();
      return originalSetupHubCalendar.apply(this, args);
    };
  }

  /*
   * The League season label is presentation of canonical season identity,
   * not a permanent 2022-23 string from index.html.
   */
  if (typeof renderLeagueStandingsPreview === 'function') {
    const originalRenderLeagueStandingsPreview = renderLeagueStandingsPreview;

    renderLeagueStandingsPreview = function renderCanonicalLeagueStandingsPreview(...args) {
      const result = originalRenderLeagueStandingsPreview.apply(this, args);
      const label = document.getElementById('league-season');
      const seasonLabel =
        WorldEngine.state?.season?.label ||
        WorldEngine.state?.season?.seasonLabel ||
        WorldEngine.state?.currentSeason ||
        null;

      if (label && seasonLabel) {
        label.textContent = `${seasonLabel} Season`;
      }

      return result;
    };
  }

  function syncVisibleCalendarFromCanonical(targetDate = null) {
    const normalizedTarget = String(
      targetDate ||
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.currentDate ||
      ''
    ).slice(0, 10);

    /*
     * A new season starts in a different month than the recap/offseason view.
     * Updating the canonical schedule alone is not enough: the Schedule screen
     * can remain pointed at August and appear stale until the user navigates.
     * Move the visible month to the new canonical date before repainting.
     */
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedTarget)) {
      const targetYear = Number(normalizedTarget.slice(0, 4));
      const targetMonth = Number(normalizedTarget.slice(5, 7)) - 1;
      if (Number.isFinite(targetYear) && Number.isFinite(targetMonth)) {
        scheduleViewYear = targetYear;
        scheduleViewMonth = targetMonth;
      }
    }

    refreshScheduleEvents();

    try {
      setupHubCalendar();
    } catch (_) {}

    try {
      if (
        typeof renderScheduleCalendar === 'function' &&
        Number.isFinite(Number(scheduleViewYear)) &&
        Number.isFinite(Number(scheduleViewMonth))
      ) {
        renderScheduleCalendar(scheduleViewYear, scheduleViewMonth);
      }
      renderScheduleKeyEvents?.();
    } catch (_) {}
  }

  /*
   * Annual rollover is a hard lifecycle boundary. The new schedule is created
   * synchronously before this event is emitted, and roster rollover listeners
   * run before this module because they are registered earlier in the runtime
   * stack. Repoint the visible month and rebuild both calendar views directly
   * from canonical state. No extra click, navigation, or simulated day should
   * be required.
   */
  window.addEventListener('projectice:next-high-school-season-started', event => {
    syncVisibleCalendarFromCanonical(event?.detail?.startDate || null);
  });

  WorldEngine.syncCareerCalendarProjection = syncVisibleCalendarFromCanonical;

  /* Initial sync for careers that load directly into Hub. */
  try {
    syncVisibleCalendarFromCanonical();
  } catch (error) {
    console.warn('[Project Ice] Career Calendar Projection initial sync skipped:', error);
  }
})();