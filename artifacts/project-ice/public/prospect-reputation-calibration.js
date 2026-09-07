'use strict';

/* global WorldEngine */

(() => {
  if (typeof WorldEngine === 'undefined') return;
  if (WorldEngine.__prospectReputationCalibrationInstalled === true) return;
  WorldEngine.__prospectReputationCalibrationInstalled = true;

  const LABELS = Object.freeze({
    1: 'Local Prospect',
    2: 'Regional Prospect',
    3: 'National Prospect',
    4: 'Elite Prospect',
    5: 'Generational Prospect',
  });

  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const idOf = player => String(player?.sourcePlayerId || player?.playerId || player?.id || '');

  function rankingRows() {
    const rows = Array.isArray(WorldEngine.state?.prospectRankings)
      ? WorldEngine.state.prospectRankings
      : [];
    return rows;
  }

  function rankingFor(player) {
    const id = idOf(player);
    if (!id) return null;
    return rankingRows().find(row => String(row?.playerId || '') === id) || null;
  }

  function reputationEvidence(player) {
    const points = num(player?.reputationPoints);
    if (points > 0) return Math.max(0, Math.min(100, points));

    const profile = player?.scoutingProfile || {};
    const exposure = Math.max(0, Math.min(100, num(profile.scoutingExposureScore) * 4));
    const spotlight = Math.max(0, Math.min(100, num(profile.spotlightGamesObserved) * 18));
    return Math.max(0, Math.min(100, 20 + exposure * 0.55 + spotlight * 0.25));
  }

  function tierFor(player) {
    if (!player) return { stars: 1, label: LABELS[1], rank: null };

    const row = rankingFor(player);
    const rank = num(row?.rank) || null;
    const potential = num(player?.development?.potential ?? player?.potential);
    const reputation = reputationEvidence(player);
    const performance = num(row?.components?.performance);
    const trajectory = num(row?.components?.trajectory);

    let stars = 1;

    /*
     * Public reputation should agree with the scouting board without simply
     * duplicating it. Rank establishes the player's national visibility band;
     * reputation/exposure can move the player within that band. A player cannot
     * become "Generational" just by accumulating reputation points.
     */
    if (rank && rank <= 100) stars = 2;
    if (rank && rank <= 50) stars = 3;
    if (rank && rank <= 20) stars = 4;

    if (rank && rank <= 70 && reputation >= 62) stars = Math.max(stars, 3);
    if (rank && rank <= 30 && reputation >= 76) stars = Math.max(stars, 4);

    const generationalCase = Boolean(
      rank && rank <= 5 &&
      potential >= 94 &&
      reputation >= 78 &&
      (performance >= 84 || trajectory >= 78 || num(row?.score) >= 82)
    );
    if (generationalCase) stars = 5;

    return {
      stars,
      label: LABELS[stars] || LABELS[1],
      rank,
      reputation,
      generationalCase,
    };
  }

  function prospectUniverse() {
    const rows = typeof WorldEngine.getScoutingProspectUniverse === 'function'
      ? WorldEngine.getScoutingProspectUniverse()
      : (typeof WorldEngine.getAllWorldPlayers === 'function' ? WorldEngine.getAllWorldPlayers() : []);
    return Array.isArray(rows) ? rows : [];
  }

  function reconcileAll() {
    for (const player of prospectUniverse()) {
      if (!player || typeof player !== 'object') continue;
      const tier = tierFor(player);
      player.reputationStars = tier.stars;
      player.reputationLabel = tier.label;
      const profile = player.scoutingProfile || (player.scoutingProfile = {});
      profile.publicReputationStars = tier.stars;
      profile.publicReputationLabel = tier.label;
    }
    return true;
  }

  function refreshOpenProfile(player) {
    const tier = tierFor(player);
    const starsEl = document.getElementById('pp-player-stars');
    const labelEl = document.getElementById('pp-player-label');
    if (starsEl) starsEl.textContent = '★'.repeat(tier.stars) + '☆'.repeat(5 - tier.stars);
    if (labelEl) labelEl.textContent = tier.label;
  }

  const baseGetRankings = typeof WorldEngine.getProspectRankings === 'function'
    ? WorldEngine.getProspectRankings.bind(WorldEngine)
    : null;

  if (baseGetRankings) {
    WorldEngine.getProspectRankings = function(...args) {
      const rows = baseGetRankings(...args);
      reconcileAll();
      return rows;
    };
  }

  WorldEngine.getProspectReputationTier = playerOrId => {
    const player = typeof playerOrId === 'object'
      ? playerOrId
      : WorldEngine.getPlayerById?.(playerOrId);
    return tierFor(player);
  };
  WorldEngine.reconcileProspectReputation = reconcileAll;

  const baseOpenPlayerProfile = globalThis.openPlayerProfile;
  if (typeof baseOpenPlayerProfile === 'function') {
    globalThis.openPlayerProfile = function(player, origin, ...args) {
      const result = baseOpenPlayerProfile.call(this, player, origin, ...args);
      requestAnimationFrame(() => refreshOpenProfile(player));
      return result;
    };
  }

  reconcileAll();
})();
