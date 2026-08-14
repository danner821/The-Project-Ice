from pathlib import Path
G=Path('artifacts/project-ice/public/game.js')
W=Path('artifacts/project-ice/public/world.js')
g=G.read_text(); w=W.read_text()

# 1) Postgame routing: match every canonical game-id alias, not only gameId||id.
old="""  const scheduledGame =
    schedule.find(
      game =>
        String(
          game.gameId ||
          game.id
        ) === String(gameId)
    );

    let summary ="""
new="""  const targetGameId =
    String(gameId || '');

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
        String(alias) === targetGameId
      )
    );

  const canonicalPostgameGameId =
    scheduledGame?.gameId ||
    scheduledGame?.id ||
    scheduledGame?.eventId ||
    gameId;

    let summary ="""
assert g.count(old)==1, f'postgame lookup count {g.count(old)}'
g=g.replace(old,new,1)
g=g.replace("""          .repairCompletedGameDevelopment(
            gameId
          );""","""          .repairCompletedGameDevelopment(
            canonicalPostgameGameId
          );""",1)

# 2) Your Moment should not pause until its card is fully constructed.
early="""  pauseLiveGamePlayback();
  liveGameCareerDecisionOpen =
    true;

  let scenario ="""
assert g.count(early)==1, f'early pause count {g.count(early)}'
g=g.replace(early,"""  let scenario =""",1)
append="""  liveGameScreen.appendChild(card);
  return true;"""
replacement="""  /*
   * Only freeze playback after the full scenario card exists. If scenario
   * construction ever fails, normal game playback is never left silently
   * paused with nothing for the player to interact with.
   */
  pauseLiveGamePlayback();
  liveGameCareerDecisionOpen = true;
  liveGameScreen.appendChild(card);
  return true;"""
assert g.count(append)==1, f'card append count {g.count(append)}'
g=g.replace(append,replacement,1)

# 3) Sim approval: accept every ID alias for the same scheduled game.
old_live="""    const liveEngineCareerGameId =
      canonicalGameEvent?.gameId ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.id ||
      null;

    const careerGameApprovedForLiveEngine =
      Boolean(
        isCareerPlayerGame &&
        liveEngineCareerGameId &&
        _state.season
          ?.careerGameSimApproval &&
        String(
          liveEngineCareerGameId
        ) ===
          String(
            _state.season
              .careerGameSimApproval
          )
      );"""
new_live="""    const liveEngineCareerGameId =
      canonicalGameEvent?.gameId ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.id ||
      null;

    const approvedCareerGameAlias =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForLiveEngine =
      Boolean(
        isCareerPlayerGame &&
        approvedCareerGameAlias &&
        [
          canonicalGameEvent?.gameId,
          canonicalGameEvent?.eventId,
          canonicalGameEvent?.id,
          event?.gameId,
          event?.eventId,
          event?.id,
        ].some(alias =>
          alias !== null &&
          alias !== undefined &&
          String(alias) ===
            String(approvedCareerGameAlias)
        )
      );"""
assert w.count(old_live)==1, f'live approval count {w.count(old_live)}'
w=w.replace(old_live,new_live,1)

old_sim="""    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );"""
new_sim="""    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        approvedCareerGameId &&
        [
          canonicalGameEvent?.id,
          canonicalGameEvent?.eventId,
          canonicalGameEvent?.gameId,
          event?.id,
          event?.eventId,
          event?.gameId,
        ].some(alias =>
          alias !== null &&
          alias !== undefined &&
          String(alias) ===
            String(approvedCareerGameId)
        )
      );"""
assert w.count(old_sim)==1, f'sim approval count {w.count(old_sim)}'
w=w.replace(old_sim,new_sim,1)

# 4) TOI: make the hottest skater the dominant unit-load signal and heavily
# suppress a unit once that player's total TOI is above the role target.
old_blend="""      return (
        averageTOI * 0.58 +
        hottestPlayerTOI * 0.42
      );"""
new_blend="""      return (
        averageTOI * 0.30 +
        hottestPlayerTOI * 0.70
      );"""
assert w.count(old_blend)==1, f'TOI blend count {w.count(old_blend)}'
w=w.replace(old_blend,new_blend,1)
old_score="""        const overTargetPenalty =
          toiDeficit < 0
            ? Math.abs(toiDeficit) * 0.45
            : 0;

        const score =
          toiDeficit * 1.35 -
          overTargetPenalty +
          shiftCountDeficit * 15 +
          Math.random() * 10;"""
new_score="""        const overTargetPenalty =
          toiDeficit < 0
            ? Math.abs(toiDeficit) * 2.25
            : 0;

        const score =
          toiDeficit * 1.55 -
          overTargetPenalty +
          shiftCountDeficit * 8 +
          Math.random() * 6;"""
assert w.count(old_score)==1, f'TOI score count {w.count(old_score)}'
w=w.replace(old_score,new_score,1)

G.write_text(g); W.write_text(w)
print('Applied robust Sim aliases, safe Your Moment pausing, postgame alias routing, and stronger player-level TOI suppression.')
