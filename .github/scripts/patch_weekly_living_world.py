from pathlib import Path

path = Path('artifacts/project-ice/public/world.js')
text = path.read_text()

old = """      processedWeeks:\n        Array.isArray(\n          source.season?.processedWeeks\n        )\n          ? [\n              ...source.season\n                .processedWeeks,\n            ]\n          : [],\n\n      unresolvedEventIds:"""
new = """      processedWeeks:\n        Array.isArray(\n          source.season?.processedWeeks\n        )\n          ? [\n              ...source.season\n                .processedWeeks,\n            ]\n          : [],\n\n      /*\n       * Compact, permanent end-of-week snapshots.\n       *\n       * These records let later Home, News, awards and scouting\n       * systems react to what the world actually looked like when\n       * a week ended instead of reconstructing old weeks from the\n       * current state. Keep only a season-sized history so saves do\n       * not grow without bound.\n       */\n      weeklyHistory:\n        Array.isArray(\n          source.season?.weeklyHistory\n        )\n          ? source.season\n              .weeklyHistory\n              .slice(-64)\n              .map(record =>\n                record &&\n                typeof record === 'object'\n                  ? structuredClone(record)\n                  : record\n              )\n          : [],\n\n      unresolvedEventIds:"""
if old not in text:
    raise SystemExit('season processedWeeks anchor not found')
text = text.replace(old, new, 1)

anchor = """  function processCompletedSeasonWeek(\n    completedWeek,\n    options = {}\n  ) {"""
helpers = r'''  function buildWeeklyLivingWorldSnapshot(
    completedWeek,
    completedAtDate
  ) {
    const safeWeek =
      Math.max(
        1,
        Number(completedWeek) || 1
      );

    const teams =
      Array.isArray(_state.teams)
        ? _state.teams
        : [];

    const standings =
      teams
        .map(team => ({
          teamId:
            team?.teamId || null,

          abbreviation:
            team?.abbreviation || '',

          wins:
            Math.max(
              0,
              Number(team?.wins) || 0
            ),

          losses:
            Math.max(
              0,
              Number(team?.losses) || 0
            ),

          overtimeLosses:
            Math.max(
              0,
              Number(
                team?.overtimeLosses
              ) || 0
            ),

          points:
            Math.max(
              0,
              Number(team?.points) || 0
            ),

          goalsFor:
            Math.max(
              0,
              Number(team?.goalsFor) || 0
            ),

          goalsAgainst:
            Math.max(
              0,
              Number(
                team?.goalsAgainst
              ) || 0
            ),
        }))
        .sort((firstTeam, secondTeam) => {
          const pointsDifference =
            secondTeam.points -
            firstTeam.points;

          if (pointsDifference !== 0) {
            return pointsDifference;
          }

          const winsDifference =
            secondTeam.wins -
            firstTeam.wins;

          if (winsDifference !== 0) {
            return winsDifference;
          }

          const firstGoalDifference =
            firstTeam.goalsFor -
            firstTeam.goalsAgainst;

          const secondGoalDifference =
            secondTeam.goalsFor -
            secondTeam.goalsAgainst;

          return (
            secondGoalDifference -
            firstGoalDifference
          );
        });

    const skaters = [];

    teams.forEach(team => {
      const roster =
        Array.isArray(team?.roster)
          ? team.roster
          : [];

      roster.forEach(player => {
        if (
          normalizeAttributePosition(
            player?.position
          ) === 'G'
        ) {
          return;
        }

        const goals =
          Math.max(
            0,
            Number(player?.goals) || 0
          );

        const assists =
          Math.max(
            0,
            Number(player?.assists) || 0
          );

        skaters.push({
          playerId:
            player?.id ||
            player?.playerId ||
            null,

          teamId:
            team?.teamId || null,

          name:
            `${player?.firstName || ''} ${player?.lastName || ''}`.trim(),

          gamesPlayed:
            Math.max(
              0,
              Number(
                player?.gamesPlayed
              ) || 0
            ),

          goals,
          assists,

          points:
            Math.max(
              goals + assists,
              Number(player?.points) || 0
            ),
        });
      });
    });

    const topSkaters = (
      primaryKey,
      secondaryKey
    ) =>
      skaters
        .slice()
        .sort((firstPlayer, secondPlayer) => {
          const primaryDifference =
            Number(
              secondPlayer[primaryKey]
            ) -
            Number(
              firstPlayer[primaryKey]
            );

          if (primaryDifference !== 0) {
            return primaryDifference;
          }

          const secondaryDifference =
            Number(
              secondPlayer[secondaryKey]
            ) -
            Number(
              firstPlayer[secondaryKey]
            );

          if (secondaryDifference !== 0) {
            return secondaryDifference;
          }

          return (
            secondPlayer.gamesPlayed -
            firstPlayer.gamesPlayed
          );
        })
        .slice(0, 5);

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    return {
      week: safeWeek,

      completedAtDate:
        completedAtDate ||
        _state.season?.currentDate ||
        _state.currentDate ||
        null,

      standings,

      leaders: {
        points:
          topSkaters(
            'points',
            'goals'
          ),

        goals:
          topSkaters(
            'goals',
            'points'
          ),

        assists:
          topSkaters(
            'assists',
            'points'
          ),
      },

      career:
        careerPlayer
          ? {
              playerId:
                careerPlayer.id ||
                careerPlayer.playerId ||
                null,

              teamId:
                careerPlayer.teamId ||
                null,

              gamesPlayed:
                Math.max(
                  0,
                  Number(
                    careerPlayer
                      .gamesPlayed
                  ) || 0
                ),

              goals:
                Math.max(
                  0,
                  Number(
                    careerPlayer.goals
                  ) || 0
                ),

              assists:
                Math.max(
                  0,
                  Number(
                    careerPlayer.assists
                  ) || 0
                ),

              points:
                Math.max(
                  0,
                  Number(
                    careerPlayer.points
                  ) ||
                  (
                    Number(
                      careerPlayer.goals
                    ) || 0
                  ) +
                  (
                    Number(
                      careerPlayer.assists
                    ) || 0
                  )
                ),

              coachTrust:
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      careerPlayer
                        .coachTrust
                    ) || 50
                  )
                ),

              recentForm:
                Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      careerPlayer
                        .recentForm
                    ) || 50
                  )
                ),

              lineupAssignment:
                careerPlayer
                  .lineupAssignment
                  ? structuredClone(
                      careerPlayer
                        .lineupAssignment
                    )
                  : null,

              specialTeamsAssignments:
                careerPlayer
                  .specialTeamsAssignments
                  ? structuredClone(
                      careerPlayer
                        .specialTeamsAssignments
                    )
                  : {
                      powerPlay: [],
                      penaltyKill: [],
                    },
            }
          : null,
    };
  }

  function saveWeeklyLivingWorldSnapshot(
    snapshot
  ) {
    if (
      !snapshot ||
      typeof snapshot !== 'object'
    ) {
      return false;
    }

    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.weeklyHistory
      )
    ) {
      _state.season.weeklyHistory = [];
    }

    const safeWeek =
      Math.max(
        1,
        Number(snapshot.week) || 1
      );

    const existingIndex =
      _state.season.weeklyHistory
        .findIndex(
          record =>
            Number(record?.week) ===
            safeWeek
        );

    const frozenSnapshot =
      structuredClone(snapshot);

    if (existingIndex >= 0) {
      _state.season.weeklyHistory[
        existingIndex
      ] = frozenSnapshot;
    } else {
      _state.season.weeklyHistory.push(
        frozenSnapshot
      );
    }

    _state.season.weeklyHistory.sort(
      (firstRecord, secondRecord) =>
        Number(firstRecord?.week) -
        Number(secondRecord?.week)
    );

    if (
      _state.season.weeklyHistory
        .length > 64
    ) {
      _state.season.weeklyHistory =
        _state.season.weeklyHistory
          .slice(-64);
    }

    return true;
  }

'''
if anchor not in text:
    raise SystemExit('weekly processor anchor not found')
text = text.replace(anchor, helpers + anchor, 1)

old2 = """    _state.season.processedWeeks.push(\n      safeCompletedWeek\n    );"""
new2 = """    /*\n     * Freeze the real league state at this exact week boundary.\n     * Later presentation systems can consume these records without\n     * mutating or re-simulating history.\n     */\n    const weeklySnapshot =\n      buildWeeklyLivingWorldSnapshot(\n        safeCompletedWeek,\n        options.completedAtDate ||\n          _state.season?.currentDate ||\n          _state.currentDate ||\n          null\n      );\n\n    saveWeeklyLivingWorldSnapshot(\n      weeklySnapshot\n    );\n\n    _state.season.processedWeeks.push(\n      safeCompletedWeek\n    );"""
if old2 not in text:
    raise SystemExit('processedWeeks push anchor not found')
text = text.replace(old2, new2, 1)

old3 = """      teamDeploymentResults,\n    };\n  }\n\n  function processCrossedSeasonWeeks("""
new3 = """      teamDeploymentResults,\n\n      weeklySnapshot,\n    };\n  }\n\n  function processCrossedSeasonWeeks("""
if old3 not in text:
    raise SystemExit('weekly return anchor not found')
text = text.replace(old3, new3, 1)

old4 = """  function processCrossedSeasonWeeks(\n    crossedWeeks = [],\n    options = {}\n  ) {\n    const safeCrossedWeeks =\n      Array.isArray(crossedWeeks)\n        ? crossedWeeks\n        : [];\n\n    const results = [];\n\n    safeCrossedWeeks.forEach(\n      enteredWeek => {\n        const completedWeek =\n          Number(enteredWeek) - 1;\n\n        if (completedWeek < 1) {\n          return;\n        }\n\n        const result =\n          processCompletedSeasonWeek(\n            completedWeek,\n            {\n              save: false,\n            }\n          );\n\n        results.push(result);\n      }\n    );"""
new4 = """  function processCrossedSeasonWeeks(\n    crossedWeeks = [],\n    options = {}\n  ) {\n    const safeCrossedWeeks =\n      Array.isArray(crossedWeeks)\n        ? crossedWeeks\n        : [];\n\n    const results = [];\n\n    safeCrossedWeeks.forEach(\n      enteredWeek => {\n        const completedWeek =\n          Number(enteredWeek) - 1;\n\n        if (completedWeek < 1) {\n          return;\n        }\n\n        const result =\n          processCompletedSeasonWeek(\n            completedWeek,\n            {\n              save: false,\n\n              completedAtDate:\n                options.completedAtDate ||\n                _state.season\n                  ?.currentDate ||\n                _state.currentDate ||\n                null,\n            }\n          );\n\n        results.push(result);\n      }\n    );"""
if old4 not in text:
    raise SystemExit('processCrossedSeasonWeeks body anchor not found')
text = text.replace(old4, new4, 1)

# Replace the advanceToDate loop/final weekly block with boundary-time processing.
old5 = """    const dateProcessingResults = [];\n\n    let blockingDateResult = null;"""
new5 = """    const dateProcessingResults = [];\n\n    const crossedWeeks = [];\n\n    const weeklyProcessingResults = [];\n\n    let activeWeek =\n      startingWeek;\n\n    let blockingDateResult = null;"""
if old5 not in text:
    raise SystemExit('advance accumulator anchor not found')
text = text.replace(old5, new5, 1)

old6 = """      dateProcessingResults.push(\n        dateProcessingResult\n      );\n\n      daysAdvanced += 1;\n\n      if (\n        dateProcessingResult\n          ?.stopSimulation === true\n      ) {\n        blockingDateResult =\n          dateProcessingResult;\n\n        break;\n      }\n    }\n\n    const reachedTarget =\n      nextDate === targetDate;\n\n    const endingWeek =\n      Math.max(\n        1,\n        Number(\n          _state.season?.currentWeek ??\n          _state.currentWeek\n        ) || startingWeek\n      );\n\n    const crossedWeeks = [];\n\n    if (endingWeek > startingWeek) {\n      for (\n        let week =\n          startingWeek + 1;\n\n        week <= endingWeek;\n\n        week++\n      ) {\n        crossedWeeks.push(week);\n      }\n    }\n\n    /*\n     * Entering a new week completes the previous week.\n     * Every weekly system will eventually run through this\n     * coordinator exactly once.\n     */\n    const weeklyProcessingResults =\n      processCrossedSeasonWeeks(\n        crossedWeeks,\n        {\n          save: false,\n        }\n      );"""
new6 = """      dateProcessingResults.push(\n        dateProcessingResult\n      );\n\n      daysAdvanced += 1;\n\n      const enteredWeek =\n        Math.max(\n          1,\n          Number(\n            _state.season?.currentWeek ??\n            _state.currentWeek\n          ) || activeWeek\n        );\n\n      /*\n       * Process a completed week at the moment its boundary is\n       * crossed. This is essential when Sim To Date spans several\n       * weeks: each snapshot must reflect that week's real state,\n       * not the final state at the end of the entire skip.\n       *\n       * The new day's scheduled event is resolved first, so results\n       * on that date are canonical before any presentation reads the\n       * world again. A blocking interaction still preserves the week\n       * boundary because the calendar has genuinely entered it.\n       */\n      if (enteredWeek > activeWeek) {\n        const enteredWeeks = [];\n\n        for (\n          let week = activeWeek + 1;\n          week <= enteredWeek;\n          week++\n        ) {\n          enteredWeeks.push(week);\n          crossedWeeks.push(week);\n        }\n\n        const boundaryResults =\n          processCrossedSeasonWeeks(\n            enteredWeeks,\n            {\n              save: false,\n              completedAtDate:\n                advancedDate,\n            }\n          );\n\n        weeklyProcessingResults.push(\n          ...boundaryResults\n        );\n\n        activeWeek = enteredWeek;\n      }\n\n      if (\n        dateProcessingResult\n          ?.stopSimulation === true\n      ) {\n        blockingDateResult =\n          dateProcessingResult;\n\n        break;\n      }\n    }\n\n    const reachedTarget =\n      nextDate === targetDate;"""
if old6 not in text:
    raise SystemExit('advance weekly final block anchor not found')
text = text.replace(old6, new6, 1)

path.write_text(text)
print('Patched Weekly Living World v1')
