'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__freshmanAwardRaceMigrationInstalled === true) return;
  WorldEngine.__freshmanAwardRaceMigrationInstalled = true;

  const RACE_KEY = 'freshman_of_year';

  const idOf = player => String(player?.playerId || player?.id || '');
  const classLabel = player => String(
    player?.schoolYear ||
    player?.classLevel ||
    player?.gradeName ||
    player?.year ||
    ''
  ).trim();

  function isFreshman(player) {
    const grade = Number(player?.grade);
    return player?.isFreshman === true || classLabel(player).toLowerCase().includes('freshman') || grade === 9;
  }

  function regularStats(player) {
    return WorldEngine.getPlayerStatsByScope?.(player, 'regular-season') || {
      gamesPlayed: Number(player?.gamesPlayed || 0),
      goals: Number(player?.goals || 0),
      assists: Number(player?.assists || 0),
      points: Number(player?.points || 0),
      plusMinus: Number(player?.plusMinus || 0),
    };
  }

  function score(player, stats) {
    return (
      Number(stats?.points || 0) * 4 +
      Number(stats?.goals || 0) * 1.5 +
      Number(stats?.plusMinus || 0) * 0.3 +
      Number(player?.overall || 0) * 0.08
    );
  }

  function teamIdFor(player) {
    if (player?.teamId) return player.teamId;
    const team = (WorldEngine.state?.teams || []).find(candidate =>
      (candidate?.roster || []).some(member => idOf(member) === idOf(player))
    );
    return team?.teamId || null;
  }

  function buildFreshmanRace(previousRace = null) {
    const previousRanks = new Map(
      (previousRace?.contenders || []).map(item => [String(item?.playerId || ''), Number(item?.rank)])
    );

    const contenders = (WorldEngine.state?.teams || [])
      .flatMap(team => (team?.roster || []).map(player => ({ player, teamId: team?.teamId || teamIdFor(player) })))
      .filter(({ player }) => {
        const stats = regularStats(player);
        return isFreshman(player) && Number(stats?.gamesPlayed || 0) > 0;
      })
      .map(entry => {
        const stats = regularStats(entry.player);
        return { ...entry, stats, score: score(entry.player, stats) };
      })
      .sort((a, b) =>
        b.score - a.score ||
        Number(b.player?.overall || 0) - Number(a.player?.overall || 0) ||
        idOf(a.player).localeCompare(idOf(b.player))
      )
      .slice(0, 5)
      .map((entry, index) => {
        const playerId = idOf(entry.player);
        const previousRank = previousRanks.get(playerId) || null;
        return {
          rank: index + 1,
          previousRank,
          rankChange: previousRank ? previousRank - (index + 1) : 0,
          playerId,
          teamId: entry.teamId,
          firstName: entry.player?.firstName || '',
          lastName: entry.player?.lastName || '',
          position: entry.player?.position || '',
          overall: Number(entry.player?.overall || 0),
          score: Number(entry.score.toFixed(3)),
          stats: structuredClone(entry.stats || {}),
        };
      });

    return {
      key: RACE_KEY,
      label: 'Freshman of the Year',
      contenders,
    };
  }

  function migrate(options = {}) {
    const livingWorld = WorldEngine.state?.livingWorld;
    if (!livingWorld || !Array.isArray(livingWorld.currentAwardRaces) || livingWorld.currentAwardRaces.length === 0) {
      return false;
    }

    if (livingWorld.currentAwardRaces.some(race => String(race?.key || '') === RACE_KEY)) {
      return false;
    }

    const previousSnapshot = Array.isArray(livingWorld.awardRaceSnapshots) && livingWorld.awardRaceSnapshots.length
      ? livingWorld.awardRaceSnapshots[livingWorld.awardRaceSnapshots.length - 1]
      : null;
    const previousFreshmanRace = previousSnapshot?.races?.find(race => String(race?.key || '') === RACE_KEY) || null;
    const race = buildFreshmanRace(previousFreshmanRace);

    livingWorld.currentAwardRaces.push(race);
    livingWorld.awardDefinitions = livingWorld.awardDefinitions && typeof livingWorld.awardDefinitions === 'object'
      ? livingWorld.awardDefinitions
      : {};
    livingWorld.awardDefinitions[RACE_KEY] = {
      key: RACE_KEY,
      label: 'Freshman of the Year',
      eligibility: 'freshman',
      seasonAward: true,
    };

    if (options.save !== false) WorldEngine.save?.();
    return true;
  }

  WorldEngine.migrateFreshmanAwardRace = migrate;

  migrate({ save: true });

  document.addEventListener('click', event => {
    const leagueButton = event.target?.closest?.('[data-tab="league"], [data-hub-tab="league"], #hub-tab-league, #btn-tab-league');
    if (!leagueButton) return;
    migrate({ save: true });
  }, true);
})();
