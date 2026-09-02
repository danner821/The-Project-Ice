'use strict';

/* global WorldEngine */
(() => {
  if (typeof WorldEngine === 'undefined') return;

  const INSTALL_KEY = '__projectIceTravelXpLiveDiagnosticInstalled';
  const LAST_REPAIR_KEY = '__projectIceTravelXpLastRepairDiagnostic';

  if (globalThis[INSTALL_KEY]) return;
  globalThis[INSTALL_KEY] = true;

  const sumAttributeXP = player =>
    Object.values(player?.development?.attributeXP || {})
      .reduce(
        (sum, value) => sum + Math.max(0, Number(value) || 0),
        0
      );

  const getCareerPlayer = () =>
    typeof WorldEngine.getCareerPlayer === 'function'
      ? WorldEngine.getCareerPlayer()
      : null;

  function installRepairProbe() {
    const original = WorldEngine.repairCompletedGameDevelopment;

    if (
      typeof original !== 'function' ||
      original.__projectIceTravelXpDiagnosticWrapped === true
    ) {
      return typeof original === 'function';
    }

    function wrappedRepairCompletedGameDevelopment(...args) {
      const beforePlayer = getCareerPlayer();
      const beforeXP = sumAttributeXP(beforePlayer);
      const beforePlayerId =
        beforePlayer?.playerId ||
        beforePlayer?.id ||
        'missing';

      let result;
      let thrownError = null;

      try {
        result = original.apply(WorldEngine, args);
        return result;
      } catch (error) {
        thrownError = error;
        throw error;
      } finally {
        const afterPlayer = getCareerPlayer();

        globalThis[LAST_REPAIR_KEY] = {
          gameId: String(args?.[0] || ''),
          beforeXP,
          afterXP: sumAttributeXP(afterPlayer),
          beforePlayerId,
          afterPlayerId:
            afterPlayer?.playerId ||
            afterPlayer?.id ||
            'missing',
          result: result || null,
          error: thrownError
            ? String(thrownError?.message || thrownError)
            : null,
          capturedAt: Date.now(),
        };
      }
    }

    wrappedRepairCompletedGameDevelopment.__projectIceTravelXpDiagnosticWrapped = true;
    wrappedRepairCompletedGameDevelopment.__projectIceTravelXpDiagnosticOriginal = original;
    WorldEngine.repairCompletedGameDevelopment = wrappedRepairCompletedGameDevelopment;
    return true;
  }

  function installTravelResultProbe() {
    const original = WorldEngine.applyTravelTournamentGameResult;

    if (
      typeof original !== 'function' ||
      original.__projectIceTravelXpDiagnosticWrapped === true
    ) {
      return typeof original === 'function';
    }

    function wrappedApplyTravelTournamentGameResult(gameResult, ...rest) {
      installRepairProbe();

      globalThis[LAST_REPAIR_KEY] = null;

      const gameId = String(
        gameResult?.gameId ||
        gameResult?.eventId ||
        'unknown'
      );

      const beforePlayer = getCareerPlayer();
      const xpBeforeTravelApply = sumAttributeXP(beforePlayer);
      const playerIdBefore =
        beforePlayer?.playerId ||
        beforePlayer?.id ||
        'missing';

      const travelResult = original.call(
        WorldEngine,
        gameResult,
        ...rest
      );

      const afterTravelPlayer = getCareerPlayer();
      const xpAfterTravelApply = sumAttributeXP(afterTravelPlayer);
      const playerIdAfterTravelApply =
        afterTravelPlayer?.playerId ||
        afterTravelPlayer?.id ||
        'missing';

      window.setTimeout(() => {
        const repair = globalThis[LAST_REPAIR_KEY] || null;
        const afterFlowPlayer = getCareerPlayer();
        const xpAfterFullFlow = sumAttributeXP(afterFlowPlayer);
        const playerIdAfterFullFlow =
          afterFlowPlayer?.playerId ||
          afterFlowPlayer?.id ||
          'missing';

        const repairResult = repair?.result || null;
        const progressionResult =
          repairResult?.progressionResult ||
          repairResult?.developmentResult ||
          null;
        const progressionApplication =
          repairResult?.progressionApplication ||
          repairResult?.application ||
          null;

        const calculatedXP = Math.max(
          0,
          Number(
            progressionResult?.totalXP ??
            progressionResult?.xp?.total ??
            repairResult?.totalXP
          ) || 0
        );

        const applyFlag =
          progressionApplication?.applied === true
            ? 'TRUE'
            : progressionApplication?.applied === false
              ? 'FALSE'
              : 'UNKNOWN';

        const applyReason =
          progressionApplication?.reason ||
          repairResult?.reason ||
          repair?.error ||
          'missing';

        const lines = [
          'TRAVEL XP LIVE DIAGNOSTIC',
          '',
          `Game: ${gameId}`,
          `Calculated XP reported: ${calculatedXP}`,
          `Progression applied: ${applyFlag}`,
          `Progression reason: ${applyReason}`,
          '',
          `Career XP before Travel apply: ${xpBeforeTravelApply}`,
          `Repair XP before: ${repair?.beforeXP ?? 'NO REPAIR CALL'}`,
          `Repair XP immediately after: ${repair?.afterXP ?? 'NO REPAIR CALL'}`,
          `XP after Travel result returns: ${xpAfterTravelApply}`,
          `XP after full game flow: ${xpAfterFullFlow}`,
          '',
          `Player before: ${playerIdBefore}`,
          `Player after repair: ${repair?.afterPlayerId ?? 'NO REPAIR CALL'}`,
          `Player after Travel: ${playerIdAfterTravelApply}`,
          `Player after flow: ${playerIdAfterFullFlow}`,
          '',
          `Travel result: ${travelResult?.reason || 'missing'}`,
          '',
          'Screenshot this alert and send it to ChatGPT.'
        ];

        window.alert(lines.join('\n'));
      }, 500);

      return travelResult;
    }

    wrappedApplyTravelTournamentGameResult.__projectIceTravelXpDiagnosticWrapped = true;
    wrappedApplyTravelTournamentGameResult.__projectIceTravelXpDiagnosticOriginal = original;
    WorldEngine.applyTravelTournamentGameResult = wrappedApplyTravelTournamentGameResult;
    return true;
  }

  let attempts = 0;
  const maxAttempts = 40;

  const timer = window.setInterval(() => {
    attempts += 1;

    const repairReady = installRepairProbe();
    const travelReady = installTravelResultProbe();

    if ((repairReady && travelReady) || attempts >= maxAttempts) {
      window.clearInterval(timer);
    }
  }, 100);
})();
