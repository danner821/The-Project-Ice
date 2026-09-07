'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__prospectRankingModelV2Installed === true) return;
  WorldEngine.__prospectRankingModelV2Installed = true;

  const VERSION = 2;
  const REVISION = 3;
  const TOP_LIMIT = 100;
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const idOf = player => String(player?.sourcePlayerId || player?.playerId || player?.id || '');

  function state() {
    return WorldEngine.state || null;
  }

  function currentDate() {
    return String(
      state()?.season?.currentDate ||
      state()?.player?.currentDate ||
      state()?.currentDate ||
      ''
    ).slice(0, 10);
  }

  function seasonStartYear() {
    const date = currentDate();
    const direct = Number(String(state()?.season?.seasonStartYear || '').slice(0, 4));
    if (Number.isFinite(direct) && direct > 2000) return direct;
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    if (!Number.isFinite(year)) return null;
    return month >= 9 ? year : year - 1;
  }

  function publicationKey() {
    const date = currentDate();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'bootstrap';
    const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
    return `rank-v2-${Math.floor(days / 14)}`;
  }

  function prospectUniverse() {
    const rows = typeof WorldEngine.getScoutingProspectUniverse === 'function'
      ? WorldEngine.getScoutingProspectUniverse()
      : (typeof WorldEngine.getAllWorldPlayers === 'function' ? WorldEngine.getAllWorldPlayers() : []);
    const startYear = seasonStartYear();
    const minimumDraftYear = Number.isFinite(startYear) ? startYear + 1 : null;
    const unique = new Map();

    for (const player of Array.isArray(rows) ? rows : []) {
      if (!player || player.generatedTravelPlayer === true || player.travelProfileAdapter === true) continue;
      const id = idOf(player);
      if (!id || unique.has(id)) continue;
      const draftYear = num(player.draftYear || player?.scoutingProfile?.draftYear || player?.development?.draftYear);
      if (minimumDraftYear && draftYear && draftYear < minimumDraftYear) continue;
      unique.set(id, player);
    }
    return Array.from(unique.values());
  }

  function teamFor(player) {
    return (state()?.teams || []).find(team =>
      String(team?.teamId || '') === String(player?.teamId || '') ||
      (team?.roster || []).some(item => idOf(item) === idOf(player))
    ) || null;
  }

  function scopedStats(player) {
    const stats = WorldEngine.getPlayerStatsByScope?.(player, 'regular-season');
    if (stats && typeof stats === 'object') return stats;
    return player?.seasonStats || player?.regularSeasonStats || player?.stats || {};
  }

  function isGoalie(player) {
    return String(player?.position || '').toUpperCase() === 'G';
  }

  function perceivedPotential(player) {
    const raw = clamp(player?.development?.potential ?? player?.potential ?? player?.overall ?? 60, 25, 99);
    const accuracy = String(
      player?.development?.potentialAccuracy ||
      player?.potentialAccuracy ||
      player?.scoutingProfile?.evaluationAccuracy ||
      'Low'
    ).toLowerCase();
    const certainty = accuracy.includes('high') ? 1 : accuracy.includes('med') ? 0.86 : 0.72;
    return clamp(70 + (raw - 70) * certainty, 25, 99);
  }

  function performanceSignal(player) {
    const s = scopedStats(player);
    const gp = Math.max(0, num(s?.gamesPlayed));
    if (gp <= 0) return 50;

    if (isGoalie(player)) {
      const sv = num(s?.savePercentage);
      const gaa = num(s?.goalsAgainstAverage);
      const wins = num(s?.wins);
      const starts = Math.max(1, num(s?.gamesStarted || s?.gamesPlayed));
      const saveScore = clamp((sv - 0.82) / 0.14 * 100);
      const gaaScore = clamp((5.0 - gaa) / 3.2 * 100);
      const winScore = clamp((wins / starts) * 100);
      return clamp(saveScore * 0.52 + gaaScore * 0.28 + winScore * 0.20);
    }

    const ppg = num(s?.points) / gp;
    const gpg = num(s?.goals) / gp;
    const plusMinusPerGame = num(s?.plusMinus) / gp;
    const scoring = clamp(ppg / 2.0 * 100);
    const finishing = clamp(gpg / 0.9 * 100);
    const twoWay = clamp(50 + plusMinusPerGame * 22);
    return clamp(scoring * 0.62 + finishing * 0.23 + twoWay * 0.15);
  }

  function trajectorySignal(player) {
    const current = num(player?.overall);
    const start = num(
      player?.seasonDevelopmentSnapshot?.overall ||
      player?.startingOverall ||
      player?.development?.seasonStartingOverall ||
      current
    );
    const delta = current - start;
    const trend = String(player?.development?.potentialTrend || player?.potentialTrend || '').toLowerCase();
    let score = 50 + delta * 8;
    if (trend.includes('up') || trend.includes('rise')) score += 8;
    if (trend.includes('down') || trend.includes('fall')) score -= 8;
    return clamp(score);
  }

  function scoutingSignal(player) {
    const profile = player?.scoutingProfile || {};
    const reputation = num(player?.reputationPoints) || num(player?.reputationStars) * 20;
    const exposure = num(profile?.scoutingExposureScore);
    const spotlight = num(profile?.spotlightGamesObserved);
    return clamp(
      clamp(reputation, 0, 100) * 0.52 +
      clamp(exposure * 4, 0, 100) * 0.33 +
      clamp(spotlight * 18, 0, 100) * 0.15
    );
  }

  function competitionSignal(player) {
    const team = teamFor(player);
    const prestige = clamp(num(team?.prestige) * 20, 0, 100);
    const league = String(player?.league || player?.realLeagueSnapshot || '').toLowerCase();
    let leagueScore = 55;
    if (/chl|ushl|ohl|whl|qmjhl|ntdp/.test(league)) leagueScore = 90;
    else if (/aaa|prep|high school|hs/.test(league)) leagueScore = 68;
    return clamp(prestige * 0.55 + leagueScore * 0.45);
  }

  function readinessSignal(player) {
    const start = seasonStartYear();
    const draftYear = num(player?.draftYear);
    if (!Number.isFinite(start) || !draftYear) return 50;
    const yearsAway = draftYear - (start + 1);
    if (yearsAway <= 0) return 100;
    if (yearsAway === 1) return 78;
    if (yearsAway === 2) return 60;
    if (yearsAway === 3) return 44;
    return 30;
  }

  function componentScore(player) {
    const ability = clamp(player?.overall || 50, 25, 99);
    const potential = perceivedPotential(player);
    const performance = performanceSignal(player);
    const trajectory = trajectorySignal(player);
    const scouting = scoutingSignal(player);
    const competition = competitionSignal(player);
    const readiness = readinessSignal(player);

    const score =
      ability * 0.30 +
      potential * 0.24 +
      performance * 0.18 +
      trajectory * 0.08 +
      scouting * 0.07 +
      competition * 0.05 +
      readiness * 0.08;

    return {
      score: Number(score.toFixed(3)),
      components: { ability, potential, performance, trajectory, scouting, competition, readiness },
    };
  }

  function priorRankMap() {
    const map = new Map();
    for (const row of state()?.prospectRankings || []) {
      const id = String(row?.playerId || '');
      const rank = num(row?.rank);
      if (id && rank > 0) map.set(id, rank);
    }
    return map;
  }

  function publicationMovementLimit(previousRank, components, rawGap) {
    if (!(previousRank > 0)) return null;

    let limit = previousRank <= 10
      ? 4
      : previousRank <= 25
        ? 6
        : previousRank <= 50
          ? 9
          : 12;

    const scouting = clamp(components?.scouting, 0, 100);
    const performance = clamp(components?.performance, 0, 100);
    const trajectory = clamp(components?.trajectory, 0, 100);

    /* Strong evidence can accelerate a move, but one publication should never
       turn one hot game into a 30-spot leap. */
    if (scouting >= 70) limit += 2;
    if (performance >= 82 || performance <= 18) limit += 2;
    if (trajectory >= 75 || trajectory <= 25) limit += 1;
    if (Math.abs(rawGap) >= 35 && scouting >= 60) limit += 2;

    return Math.min(18, limit);
  }

  function buildRankingSnapshot() {
    const universe = prospectUniverse();
    const previous = priorRankMap();
    const raw = universe.map(player => {
      const scored = componentScore(player);
      return { player, playerId: idOf(player), ...scored };
    }).sort((a, b) =>
      b.score - a.score ||
      num(b.player?.overall) - num(a.player?.overall) ||
      String(a.playerId).localeCompare(String(b.playerId))
    );

    const rawRank = new Map(raw.map((entry, index) => [entry.playerId, index + 1]));
    const stabilized = raw.map(entry => {
      const prev = previous.get(entry.playerId) || 0;
      const currentRaw = rawRank.get(entry.playerId) || 999;
      const exposure = clamp(entry.components.scouting, 0, 100);
      const rawGap = prev > 0 ? currentRaw - prev : 0;
      const movementLimit = publicationMovementLimit(prev, entry.components, rawGap);
      const boundedRaw = prev > 0 && movementLimit
        ? clamp(currentRaw, Math.max(1, prev - movementLimit), prev + movementLimit)
        : currentRaw;
      const priorWeight = prev > 0 ? Math.max(0.46, 0.66 - exposure * 0.0015) : 0;

      return {
        ...entry,
        previousRank: prev || null,
        rawRank: currentRaw,
        movementLimit,
        boundedRawRank: boundedRaw,
        stabilizedRankScore: prev > 0
          ? prev * priorWeight + boundedRaw * (1 - priorWeight)
          : currentRaw,
      };
    }).sort((a, b) =>
      a.stabilizedRankScore - b.stabilizedRankScore ||
      b.score - a.score ||
      String(a.playerId).localeCompare(String(b.playerId))
    );

    const key = publicationKey();
    const rows = stabilized.slice(0, TOP_LIMIT).map((entry, index) => {
      const rank = index + 1;
      const prev = entry.previousRank;
      return {
        modelVersion: VERSION,
        modelRevision: REVISION,
        publicationKey: key,
        rank,
        playerId: entry.playerId,
        teamId: entry.player?.teamId || null,
        firstName: entry.player?.firstName || '',
        lastName: entry.player?.lastName || '',
        position: entry.player?.position || '',
        draftYear: num(entry.player?.draftYear) || null,
        overall: num(entry.player?.overall),
        potential: num(entry.player?.development?.potential ?? entry.player?.potential),
        score: entry.score,
        components: entry.components,
        rawRank: entry.rawRank,
        boundedRawRank: entry.boundedRawRank,
        publicationMovementLimit: entry.movementLimit,
        previousRank: prev,
        rankChange: prev ? prev - rank : 0,
        trend: !prev ? 'new' : prev > rank ? 'up' : prev < rank ? 'down' : 'even',
        currentTeam: entry.player?.currentTeam || entry.player?.teamName || '',
        league: entry.player?.league || entry.player?.realLeagueSnapshot || '',
        realPlayer: entry.player?.realPlayer === true,
      };
    });

    const byId = new Map(rows.map(row => [String(row.playerId || ''), row]));
    for (const player of universe) {
      const profile = player.scoutingProfile || (player.scoutingProfile = {});
      const row = byId.get(idOf(player));
      const oldPublic = num(profile.publicRank) || null;
      profile.previousRank = oldPublic;
      profile.publicRank = row?.rank || null;
      profile.rankChange = row?.rankChange || 0;
      profile.trend = row?.trend || 'unranked';
      profile.lastRankedPublication = key;
    }

    const world = state();
    if (world) {
      world.prospectRankings = rows;
      world.prospectRankingModelV2 = {
        version: VERSION,
        revision: REVISION,
        publicationKey: key,
        publishedAt: currentDate() || null,
        universeSize: universe.length,
        topLimit: TOP_LIMIT,
        publicationCadenceDays: 14,
        movementPolicy: 'tiered-evidence-capped',
        weights: {
          ability: 0.30,
          potential: 0.24,
          performance: 0.18,
          trajectory: 0.08,
          scouting: 0.07,
          competition: 0.05,
          readiness: 0.08,
        },
      };
    }
    return rows;
  }

  const baseGetRankings = typeof WorldEngine.getProspectRankings === 'function'
    ? WorldEngine.getProspectRankings.bind(WorldEngine)
    : null;

  function getProspectRankingsV2() {
    const world = state();
    const key = publicationKey();
    const existing = Array.isArray(world?.prospectRankings) ? world.prospectRankings : [];
    const valid = existing.length > 0 &&
      existing.every(row => Number(row?.modelVersion) === VERSION && Number(row?.modelRevision) === REVISION) &&
      String(world?.prospectRankingModelV2?.publicationKey || '') === key &&
      Number(world?.prospectRankingModelV2?.revision) === REVISION;
    if (valid) return existing;
    return buildRankingSnapshot();
  }

  WorldEngine.getLegacyProspectRankings = baseGetRankings;
  WorldEngine.getProspectRankings = getProspectRankingsV2;
  WorldEngine.rebuildProspectRankingModelV2 = buildRankingSnapshot;
  WorldEngine.getProspectRankingModelV2 = () => state()?.prospectRankingModelV2 || null;

  /* Force one canonical publication on load so old weekly/raw rankings cannot
     remain the visible Top 100 once this runtime is installed. */
  getProspectRankingsV2();
})();
