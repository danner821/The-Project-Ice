from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text()
world = WORLD.read_text()

# ---------------------------------------------------------------------------
# 1) Postgame rendering/navigation must never be blocked by display-only work.
# ---------------------------------------------------------------------------
old_repair = '''    if (\n      scheduledGame &&\n      !hasSavedCareerDevelopment &&\n      typeof WorldEngine\n        .repairCompletedGameDevelopment ===\n          'function'\n    ) {\n      const repairResult =\n        WorldEngine\n          .repairCompletedGameDevelopment(\n            canonicalPostgameGameId\n          );\n\n      if (\n        repairResult?.success === true\n      ) {\n        /*\n         * The repair mutates the canonical scheduled game.\n         * Re-read its summary before rendering the screen.\n         */\n        summary =\n          scheduledGame.postgameSummary ||\n          summary;\n      } else {\n        console.warn(\n          '[Postgame Summary] Development repair failed.',\n          repairResult\n        );\n      }\n    }\n'''
new_repair = '''    if (\n      scheduledGame &&\n      !hasSavedCareerDevelopment &&\n      typeof WorldEngine\n        .repairCompletedGameDevelopment ===\n          'function'\n    ) {\n      /*\n       * Development repair is optional display maintenance. It must never\n       * prevent a completed hockey game from opening its Postgame Summary.\n       */\n      try {\n        const repairResult =\n          WorldEngine\n            .repairCompletedGameDevelopment(\n              canonicalPostgameGameId\n            );\n\n        if (\n          repairResult?.success === true\n        ) {\n          summary =\n            scheduledGame.postgameSummary ||\n            summary;\n        } else {\n          console.warn(\n            '[Postgame Summary] Development repair failed.',\n            repairResult\n          );\n        }\n      } catch (error) {\n        console.warn(\n          '[Postgame Summary] Development repair threw; continuing to summary.',\n          error\n        );\n      }\n    }\n'''
if old_repair not in game:
    raise SystemExit('postgame repair block not found')
game = game.replace(old_repair, new_repair, 1)

old_missing = '''    if (\n      !scheduledGame ||\n      !summary\n    ) {\n    console.error(\n      '[Postgame Summary] Saved game result not found.',\n      {\n        gameId,\n        scheduledGame,\n      }\n    );\n\n    return false;\n  }\n\n  const homeTeam =\n'''
new_missing = '''    if (\n      !scheduledGame ||\n      !summary\n    ) {\n    console.error(\n      '[Postgame Summary] Saved game result not found.',\n      {\n        gameId,\n        scheduledGame,\n      }\n    );\n\n    return false;\n  }\n\n  /*\n   * Navigate FIRST. Everything below is presentation-only rendering. If a\n   * malformed optional stat ever throws, the player still leaves the rink\n   * and reaches the completed-game screen instead of seeing a dead button.\n   */\n  showScreen(\n    'postgame-summary'\n  );\n\n  const homeTeam =\n'''
if old_missing not in game:
    raise SystemExit('postgame missing-summary anchor not found')
game = game.replace(old_missing, new_missing, 1)

# Remove the later duplicate showScreen call and make scrolling feature-safe.
old_tail = '''  showScreen(\n    'postgame-summary'\n  );\n\n  if (postgameSummaryScreen) {\n    postgameSummaryScreen.scrollTo({\n      top: 0,\n      left: 0,\n      behavior: 'instant',\n    });\n  }\n\n  window.scrollTo(\n    {\n      top: 0,\n      behavior: 'instant',\n    }\n  );\n\n  return true;\n}\n'''
new_tail = '''  if (\n    postgameSummaryScreen &&\n    typeof postgameSummaryScreen.scrollTo ===\n      'function'\n  ) {\n    postgameSummaryScreen.scrollTo({\n      top: 0,\n      left: 0,\n    });\n  }\n\n  if (\n    typeof window.scrollTo ===\n      'function'\n  ) {\n    window.scrollTo(0, 0);\n  }\n\n  return true;\n}\n'''
if old_tail not in game:
    raise SystemExit('postgame tail block not found')
game = game.replace(old_tail, new_tail, 1)

# ---------------------------------------------------------------------------
# 2) Sim Game: bypass the old approval/re-entry path. Resolve the exact game
#    directly through the universal live engine, then apply that frozen result
#    through the same canonical result pipeline used by a played live game.
# ---------------------------------------------------------------------------
listener_start = game.find("document\n  .getElementById(\n    'btn-pregame-sim'\n  )")
listener_end_marker = "\n\n// Begin Event — complete supported career events"
listener_end = game.find(listener_end_marker, listener_start)
if listener_start < 0 or listener_end < 0:
    raise SystemExit('pregame sim listener block not found')

new_sim_block = r'''async function simulatePregameMatchupGame(
  requestedGameId
) {
  const gameId =
    String(requestedGameId || '');

  const simButton =
    document.getElementById(
      'btn-pregame-sim'
    );

  if (!gameId) {
    console.error(
      '[Project Ice] Sim Game is missing its scheduled game ID.'
    );
    return false;
  }

  const schedule =
    Array.isArray(
      WorldEngine.state?.schedule
    )
      ? WorldEngine.state.schedule
      : [];

  const scheduledGame =
    schedule.find(game =>
      [
        game?.gameId,
        game?.id,
        game?.eventId,
        game?.postgameSummary?.gameId,
      ].some(alias =>
        alias !== null &&
        alias !== undefined &&
        String(alias) === gameId
      )
    ) || null;

  if (!scheduledGame) {
    console.error(
      '[Project Ice] Sim Game could not find the scheduled matchup.',
      { gameId }
    );
    return false;
  }

  if (simButton) {
    simButton.disabled = true;
    simButton.dataset.originalLabel =
      simButton.textContent || 'Sim Game';
    simButton.textContent = 'Simulating…';
  }

  try {
    /*
     * Do not re-enter the Season Engine's user-choice gate. Resolve the exact
     * scheduled game directly with the universal hockey engine, then hand its
     * completed result to the canonical date/application pipeline.
     */
    let completedResult =
      scheduledGame.gameResult &&
      (scheduledGame.played === true ||
       scheduledGame.completed === true)
        ? structuredClone(
            scheduledGame.gameResult
          )
        : null;

    if (!completedResult) {
      const resolution =
        WorldEngine
          .resolveLiveGameToFinalResult(
            scheduledGame
          );

      if (
        !resolution ||
        resolution.success !== true ||
        !resolution.gameResult
      ) {
        console.error(
          '[Project Ice] Sim Game universal resolver failed.',
          resolution
        );
        return false;
      }

      completedResult =
        resolution.gameResult;

      const gameDate =
        completedResult.date ||
        scheduledGame.date ||
        WorldEngine.state
          .season
          ?.currentDate ||
        Game.player.currentDate ||
        null;

      if (!gameDate) {
        console.error(
          '[Project Ice] Sim Game could not determine the game date.'
        );
        return false;
      }

      const application =
        WorldEngine.advanceToDate(
          gameDate,
          {
            processCurrentDate: true,
            resolvedGameResult:
              completedResult,
          }
        );

      if (
        !application ||
        application.success !== true
      ) {
        console.error(
          '[Project Ice] Sim Game canonical result application failed.',
          application
        );
        return false;
      }
    }

    const worldSaved =
      await WorldEngine.save();

    if (!worldSaved) {
      console.error(
        '[Project Ice] Sim Game result could not be persisted.'
      );
      return false;
    }

    if (
      typeof syncCareerPlayerWithWorld ===
        'function'
    ) {
      syncCareerPlayerWithWorld();
    }

    if (
      typeof refreshScheduleEvents ===
        'function'
    ) {
      refreshScheduleEvents();
    }

    const completedGame =
      (Array.isArray(
        WorldEngine.state?.schedule
      )
        ? WorldEngine.state.schedule
        : []
      ).find(game =>
        [
          game?.gameId,
          game?.id,
          game?.eventId,
          game?.postgameSummary?.gameId,
        ].some(alias =>
          alias !== null &&
          alias !== undefined &&
          String(alias) === gameId
        )
      ) || scheduledGame;

    const postgameId =
      completedGame?.gameId ||
      completedGame?.id ||
      completedGame?.eventId ||
      completedGame?.postgameSummary?.gameId ||
      completedResult?.gameId ||
      gameId;

    let opened = false;

    try {
      opened =
        openPostgameSummary(
          postgameId
        );
    } catch (error) {
      /*
       * openPostgameSummary navigates before optional rendering. If an
       * optional renderer throws after navigation, treat the handoff itself
       * as successful instead of bouncing back to the matchup screen.
       */
      console.error(
        '[Project Ice] Sim Game Postgame renderer threw.',
        error
      );

      opened =
        Game.screen ===
        'postgame-summary';
    }

    if (!opened) {
      console.error(
        '[Project Ice] Sim Game completed but Postgame Summary could not open.',
        {
          postgameId,
          completedGame,
        }
      );
      return false;
    }

    return true;
  } finally {
    if (
      simButton &&
      Game.screen !==
        'postgame-summary'
    ) {
      simButton.disabled = false;
      simButton.textContent =
        simButton.dataset.originalLabel ||
        'Sim Game';
    }
  }
}

/*
 * Bind when the matchup is actually opened as well as here at startup.
 * Assigning onclick (instead of stacking listeners) guarantees one handler.
 */
const bindPregameSimButton = () => {
  const button =
    document.getElementById(
      'btn-pregame-sim'
    );

  if (!button) {
    return;
  }

  button.onclick =
    () =>
      simulatePregameMatchupGame(
        pregameMatchupScreen
          ?.dataset
          ?.gameId ||
        null
      );
};

bindPregameSimButton();
'''
game = game[:listener_start] + new_sim_block + game[listener_end:]

# Re-bind Sim Game every time the canonical matchup screen is populated.
old_pregame_show = '''  pregameMatchupScreen\n    .dataset.gameId =\n      scheduledGame.id ||\n      scheduledGame.gameId ||\n      scheduledGame.eventId ||\n      '';\n\n  showScreen(\n    'pregame-matchup'\n  );\n'''
new_pregame_show = '''  pregameMatchupScreen\n    .dataset.gameId =\n      scheduledGame.id ||\n      scheduledGame.gameId ||\n      scheduledGame.eventId ||\n      '';\n\n  if (\n    typeof bindPregameSimButton ===\n      'function'\n  ) {\n    bindPregameSimButton();\n  }\n\n  showScreen(\n    'pregame-matchup'\n  );\n'''
if old_pregame_show not in game:
    raise SystemExit('pregame show block not found')
game = game.replace(old_pregame_show, new_pregame_show, 1)

# ---------------------------------------------------------------------------
# 3) Final-horn Continue: mount it at document.body level. A button nested in
#    the live screen cannot escape an ancestor stacking context, no matter how
#    high its own z-index is. A fixed body-level control cannot be covered by
#    the rink/decision layers.
# ---------------------------------------------------------------------------
old_append = '''        continueButton.style.cssText = `\n          position: absolute;\n          left: 50%;\n          bottom: 24px;\n          transform: translateX(-50%);\n          z-index: 80;\n          pointer-events: auto;\n          touch-action: manipulation;\n'''
new_append = '''        continueButton.style.cssText = `\n          position: fixed;\n          left: 50%;\n          bottom: calc(24px + env(safe-area-inset-bottom, 0px));\n          transform: translateX(-50%);\n          z-index: 2147483647;\n          pointer-events: auto;\n          touch-action: manipulation;\n'''
if old_append not in game:
    raise SystemExit('final continue style block not found')
game = game.replace(old_append, new_append, 1)

old_parent = '''        liveGameScreen.appendChild(\n          continueButton\n        );\n'''
new_parent = '''        document.body.appendChild(\n          continueButton\n        );\n'''
if old_parent not in game:
    raise SystemExit('final continue append block not found')
game = game.replace(old_parent, new_parent, 1)

old_open_catch = '''          } catch (error) {\n            console.error(\n              '[Project Ice] Final-horn Postgame Summary handoff threw an error.',\n              {\n                postgameGameId,\n                gameId,\n                error,\n              }\n            );\n          }\n\n          if (!opened) {\n'''
new_open_catch = '''          } catch (error) {\n            console.error(\n              '[Project Ice] Final-horn Postgame Summary renderer threw an error.',\n              {\n                postgameGameId,\n                gameId,\n                error,\n              }\n            );\n\n            opened =\n              Game.screen ===\n              'postgame-summary';\n          }\n\n          if (!opened) {\n'''
if old_open_catch not in game:
    raise SystemExit('final continue catch block not found')
game = game.replace(old_open_catch, new_open_catch, 1)

# ---------------------------------------------------------------------------
# 4) Canonical same-day result application: if a date was already marked as
#    processed, a supplied completed live result must still be allowed through.
#    Process only that supplied game in this exceptional retry path.
# ---------------------------------------------------------------------------
old_processed = '''    const wasAlreadyProcessed =\n      _state.season.processedDates\n        .includes(dateString);\n\n    if (wasAlreadyProcessed) {\n      return {\n        success: true,\n        processed: false,\n        date: dateString,\n        reason: 'already-processed',\n        eventResults: [],\n      };\n    }\n'''
new_processed = '''    const wasAlreadyProcessed =\n      _state.season.processedDates\n        .includes(dateString);\n\n    const hasSuppliedResolvedGameResult =\n      Boolean(\n        options?.resolvedGameResult &&\n        typeof options.resolvedGameResult ===\n          'object'\n      );\n\n    if (\n      wasAlreadyProcessed &&\n      !hasSuppliedResolvedGameResult\n    ) {\n      return {\n        success: true,\n        processed: false,\n        date: dateString,\n        reason: 'already-processed',\n        eventResults: [],\n      };\n    }\n'''
if old_processed not in world:
    raise SystemExit('processed-date guard not found')
world = world.replace(old_processed, new_processed, 1)

old_events_map = '''    const eventResults =\n      scheduledEvents.map(\n        event => {\n'''
new_events_map = '''    const eventsForProcessing =\n      wasAlreadyProcessed &&\n      suppliedGameResult\n        ? scheduledEvents.filter(event => {\n            const eventId =\n              event?.gameId ||\n              event?.eventId ||\n              event?.id ||\n              null;\n\n            return Boolean(\n              suppliedGameId &&\n              eventId &&\n              String(eventId) ===\n                String(suppliedGameId)\n            );\n          })\n        : scheduledEvents;\n\n    const eventResults =\n      eventsForProcessing.map(\n        event => {\n'''
if old_events_map not in world:
    raise SystemExit('event results map anchor not found')
world = world.replace(old_events_map, new_events_map, 1)

# Canonical schedule lookup should compare ID aliases by value, not JS type.
old_schedule_find = '''    const scheduledGame =\n      schedule.find(event =>\n        (\n          event?.id === gameId ||\n          event?.eventId === gameId ||\n          event?.gameId === gameId\n        )\n      );\n'''
new_schedule_find = '''    const scheduledGame =\n      schedule.find(event =>\n        [\n          event?.id,\n          event?.eventId,\n          event?.gameId,\n        ].some(alias =>\n          alias !== null &&\n          alias !== undefined &&\n          String(alias) ===\n            String(gameId)\n        )\n      );\n'''
if old_schedule_find not in world:
    raise SystemExit('apply result schedule lookup not found')
world = world.replace(old_schedule_find, new_schedule_find, 1)

# ---------------------------------------------------------------------------
# 5) TOI pacing: special-teams rotation needs its own clock. The old code used
#    deploymentAgeSeconds, which is reset every normal 35-55 second shift; that
#    repeatedly restarted PP/PK at Unit 1 and could front-load huge minutes.
# ---------------------------------------------------------------------------
old_st_unit = '''    /*\n     * Rotate special-teams units during extended penalties.\n     * Unit 1 starts the sequence; Unit 2 takes the next ~45-second window.\n     * This prevents PP1/PK1 skaters from playing an entire two-minute minor.\n     */\n    const specialTeamsShiftUnit =\n      (\n        Math.floor(\n          (Number(flow.deploymentAgeSeconds) || 0) / 45\n        ) % 2\n      ) + 1;\n'''
new_st_unit = '''    /*\n     * SPECIAL-TEAMS ROTATION CLOCK\n     *\n     * This must be independent from deploymentAgeSeconds. The normal shift\n     * clock resets every 35-55 seconds, which previously kept restarting\n     * penalties on PP1/PK1 and caused severe early-game TOI front-loading.\n     */\n    if (\n      !flow.specialTeamsRotation ||\n      typeof flow.specialTeamsRotation !==\n        'object'\n    ) {\n      flow.specialTeamsRotation = {\n        active: false,\n        unit: 1,\n        ageSeconds: 0,\n        manpowerKey: '',\n      };\n    }\n\n    const specialTeamsActive =\n      homeHasAdvantage ||\n      awayHasAdvantage;\n\n    const specialTeamsManpowerKey =\n      specialTeamsActive\n        ? `${homeSkaterCount}v${awaySkaterCount}`\n        : '';\n\n    if (!specialTeamsActive) {\n      flow.specialTeamsRotation.active =\n        false;\n      flow.specialTeamsRotation.unit =\n        1;\n      flow.specialTeamsRotation.ageSeconds =\n        0;\n      flow.specialTeamsRotation.manpowerKey =\n        '';\n    } else if (\n      flow.specialTeamsRotation.active !==\n        true ||\n      flow.specialTeamsRotation.manpowerKey !==\n        specialTeamsManpowerKey\n    ) {\n      flow.specialTeamsRotation.active =\n        true;\n      flow.specialTeamsRotation.unit =\n        1;\n      flow.specialTeamsRotation.ageSeconds =\n        0;\n      flow.specialTeamsRotation.manpowerKey =\n        specialTeamsManpowerKey;\n    }\n\n    while (\n      specialTeamsActive &&\n      Number(\n        flow.specialTeamsRotation\n          .ageSeconds\n      ) >= 45\n    ) {\n      flow.specialTeamsRotation.ageSeconds =\n        Math.max(\n          0,\n          Number(\n            flow.specialTeamsRotation\n              .ageSeconds\n          ) - 45\n        );\n\n      flow.specialTeamsRotation.unit =\n        Number(\n          flow.specialTeamsRotation.unit\n        ) === 1\n          ? 2\n          : 1;\n    }\n\n    const specialTeamsShiftUnit =\n      Math.max(\n        1,\n        Math.min(\n          2,\n          Number(\n            flow.specialTeamsRotation.unit\n          ) || 1\n        )\n      );\n'''
if old_st_unit not in world:
    raise SystemExit('special teams unit rotation block not found')
world = world.replace(old_st_unit, new_st_unit, 1)

# Increment the independent rotation clock by actual hockey seconds.
old_after_toi = '''    addTOIToDeployment(\n      flow.awayDeployment\n    );\n\n    /*\n     * Penalties count down using actual hockey seconds, completely\n'''
new_after_toi = '''    addTOIToDeployment(\n      flow.awayDeployment\n    );\n\n    if (\n      specialTeamsActive &&\n      flow.specialTeamsRotation\n        ?.active === true\n    ) {\n      flow.specialTeamsRotation.ageSeconds =\n        (\n          Number(\n            flow.specialTeamsRotation\n              .ageSeconds\n          ) || 0\n        ) +\n        elapsedSeconds;\n    }\n\n    /*\n     * Penalties count down using actual hockey seconds, completely\n'''
if old_after_toi not in world:
    raise SystemExit('TOI post-credit anchor not found')
world = world.replace(old_after_toi, new_after_toi, 1)

# Tighten the all-situations cooling buffer. ES already reads total TOI; with
# PP/PK now rotating correctly this prevents a top unit from getting several
# minutes ahead and then being benched late to compensate.
old_pace = '''        const periodAheadSeconds =\n          Math.max(\n            0,\n            unitHottestPlayerTOI -\n            expectedTOIThroughNow -\n            75\n          );\n'''
new_pace = '''        const periodAheadSeconds =\n          Math.max(\n            0,\n            unitHottestPlayerTOI -\n            expectedTOIThroughNow -\n            45\n          );\n'''
if old_pace not in world:
    raise SystemExit('TOI pace buffer not found')
world = world.replace(old_pace, new_pace, 1)

GAME.write_text(game)
WORLD.write_text(world)
print('Applied robust game-day flow, postgame navigation, and TOI rotation fixes')
