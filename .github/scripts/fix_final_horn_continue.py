from pathlib import Path

path = Path('artifacts/project-ice/public/game.js')
text = path.read_text()

old = '''      continueButton.onclick =
        () => {
          continueButton.disabled =
            true;

          const opened =
            openPostgameSummary(
              gameId
            );

          if (!opened) {
            console.error(
              '[Project Ice] Postgame Summary failed to open.',
              {
                gameId,
                application,
              }
            );

            continueButton.disabled =
              false;

            return;
          }

          continueButton.remove();
        };
'''

new = '''      /*
       * Resolve the postgame screen from the canonical schedule AFTER the
       * live result has been applied. The live simulation/result ID can be
       * an alias of the scheduled game's permanent ID, so do not make the
       * final-horn button depend on one transient identifier.
       */
      const completedScheduleGame =
        (Array.isArray(
          WorldEngine.state?.schedule
        )
          ? WorldEngine.state.schedule
          : []
        ).find(game => {
          const aliases = [
            game?.gameId,
            game?.id,
            game?.eventId,
            game?.postgameSummary?.gameId,
          ]
            .filter(
              value =>
                value !== null &&
                value !== undefined
            )
            .map(String);

          const liveAliases = [
            gameId,
            activeLiveGame?.gameId,
            finalization?.gameResult?.gameId,
          ]
            .filter(
              value =>
                value !== null &&
                value !== undefined
            )
            .map(String);

          if (
            aliases.some(alias =>
              liveAliases.includes(alias)
            )
          ) {
            return true;
          }

          return (
            String(game?.date || '') ===
              String(gameDate || '') &&
            String(game?.homeTeamId || '') ===
              String(activeLiveGame?.home?.teamId || '') &&
            String(game?.awayTeamId || '') ===
              String(activeLiveGame?.away?.teamId || '') &&
            Boolean(
              game?.postgameSummary ||
              game?.played ||
              game?.completed
            )
          );
        }) || null;

      const postgameGameId =
        completedScheduleGame?.gameId ||
        completedScheduleGame?.id ||
        completedScheduleGame?.eventId ||
        completedScheduleGame
          ?.postgameSummary
          ?.gameId ||
        gameId;

      continueButton.onclick =
        () => {
          continueButton.disabled =
            true;

          let opened = false;

          try {
            opened =
              openPostgameSummary(
                postgameGameId
              );
          } catch (error) {
            console.error(
              '[Project Ice] Final-horn Postgame Summary handoff threw an error.',
              {
                postgameGameId,
                gameId,
                error,
              }
            );
          }

          if (!opened) {
            console.error(
              '[Project Ice] Final-horn Postgame Summary failed to open.',
              {
                postgameGameId,
                gameId,
                completedScheduleGame,
                application,
              }
            );

            continueButton.disabled =
              false;

            return;
          }

          continueButton.remove();
        };
'''

if old not in text:
    raise SystemExit('final horn Continue handler block not found')

text = text.replace(old, new, 1)
path.write_text(text)
print('Fixed final-horn Continue canonical postgame handoff')
