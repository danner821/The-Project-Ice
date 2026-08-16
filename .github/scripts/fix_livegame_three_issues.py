from pathlib import Path

GAME = Path('artifacts/project-ice/public/game.js')
WORLD = Path('artifacts/project-ice/public/world.js')

game = GAME.read_text()
world = WORLD.read_text()

# 1) Final-horn Continue: remove any career overlays that can sit above the
# dynamically-created Continue button, and raise the button above live-game UI.
old_final = '''  liveGameCareerDecisionOpen = false;

  /*
   * Make absolutely sure the final scoreboard, manpower state,
'''
new_final = '''  liveGameCareerDecisionOpen = false;

  /*
   * A career decision/outcome can resolve on the same canonical step as the
   * final horn. Those overlays sit above the rink and can intercept taps even
   * after the game is complete, making the visible Continue button look dead.
   */
  document.getElementById(
    'live-game-career-decision'
  )?.remove();

  document.getElementById(
    'live-game-career-outcome'
  )?.remove();

  /*
   * Make absolutely sure the final scoreboard, manpower state,
'''
if old_final not in game:
    raise SystemExit('final horn overlay cleanup anchor not found')
game = game.replace(old_final, new_final, 1)

game = game.replace('''          z-index: 20;\n''', '''          z-index: 80;\n          pointer-events: auto;\n          touch-action: manipulation;\n''', 1)

# 2) Pregame Sim Game: process the current date explicitly, then open the
# completed game's canonical postgame screen after persistence.
old_sim = '''        const simulationResult =
          simulateToDate(
            currentDate
          );

        if (
          simulationResult &&
          typeof simulationResult.then ===
            'function'
        ) {
          await simulationResult;
        }

        const worldSaved =
          await WorldEngine.save();

        if (!worldSaved) {
          console.error(
            '[Project Ice] Sim Game result could not be persisted.'
          );

          return;
        }
'''
new_sim = '''      /*
       * We are already ON game day, so simulateToDate(currentDate) can be a
       * no-op depending on date-advance semantics. Process the current date
       * explicitly; the one-shot approval above allows this exact career game
       * to resolve instead of stopping for the Play/Sim choice again.
       */
      const simulationResult =
        WorldEngine.advanceToDate(
          currentDate,
          {
            processCurrentDate: true,
          }
        );

      if (
        !simulationResult ||
        simulationResult.success !== true
      ) {
        console.error(
          '[Project Ice] Sim Game failed to resolve the current game day.',
          simulationResult
        );

        return;
      }

      const worldSaved =
        await WorldEngine.save();

      if (!worldSaved) {
        console.error(
          '[Project Ice] Sim Game result could not be persisted.'
        );

        return;
      }

      if (
        typeof syncCareerPlayerWithWorld ===
        'function'
      ) {
        syncCareerPlayerWithWorld();
      }

      refreshScheduleEvents();

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
            String(alias) === String(gameId)
          )
        ) || null;

      const postgameId =
        completedGame?.gameId ||
        completedGame?.id ||
        completedGame?.eventId ||
        completedGame?.postgameSummary?.gameId ||
        gameId;

      if (!openPostgameSummary(postgameId)) {
        console.error(
          '[Project Ice] Sim Game completed but Postgame Summary could not open.',
          {
            postgameId,
            completedGame,
            simulationResult,
          }
        );
      }
'''
if old_sim not in game:
    raise SystemExit('pregame sim block not found')
game = game.replace(old_sim, new_sim, 1)

# 3) TOI pacing: current scoring is soft enough that a line can front-load
# several minutes and only be corrected later. Add a strong pace envelope so
# usage stays distributed through the game instead of 16+ minutes by halfway.
old_toi = '''        const periodAheadPenalty =
          periodAheadSeconds * 2.4;

        const score =
          toiDeficit * 1.55 -
          overTargetPenalty -
          periodAheadPenalty +
          shiftCountDeficit * 8 +
          Math.random() * 6;
'''
new_toi = '''        const periodAheadPenalty =
          periodAheadSeconds * 2.4;

        /*
         * Pace envelope.
         *
         * Soft balancing eventually fixes an early TOI spike, but it can do
         * so by benching the unit late in the game. Once a unit's hottest
         * skater is more than ~90 seconds ahead of his role's game-clock pace,
         * make that unit extremely unlikely at 5v5 until the clock catches up.
         * This preserves role hierarchy while distributing TOI much more
         * naturally across all three periods.
         */
        const paceHardPenalty =
          periodAheadSeconds > 90
            ? 2000 +
              (periodAheadSeconds - 90) * 20
            : 0;

        const score =
          toiDeficit * 1.55 -
          overTargetPenalty -
          periodAheadPenalty -
          paceHardPenalty +
          shiftCountDeficit * 8 +
          Math.random() * 6;
'''
if old_toi not in world:
    raise SystemExit('TOI pace score block not found')
world = world.replace(old_toi, new_toi, 1)

GAME.write_text(game)
WORLD.write_text(world)
print('Fixed final-horn Continue tap interception, current-day Sim Game, and TOI front-loading')
