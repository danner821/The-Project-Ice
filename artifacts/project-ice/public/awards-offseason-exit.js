'use strict';

/* global WorldEngine, openHubTab, refreshCareerUI */

(() => {
  if (typeof WorldEngine === 'undefined') return;

  const EVENT_ID = 'hs-league-awards-ceremony';

  function postseason() {
    return WorldEngine.getHighSchoolPostseason?.() ||
      WorldEngine.state?.postseason?.highSchool ||
      null;
  }

  function currentDate() {
    return String(
      WorldEngine.state?.season?.currentDate ||
      WorldEngine.state?.player?.currentDate ||
      WorldEngine.state?.currentDate ||
      ''
    ).slice(0, 10);
  }

  function finishCeremony() {
    const post = postseason();
    if (!post) return;

    post.awardsCeremonyAcknowledged = true;
    post.awardsCeremonyAcknowledgedAt = currentDate() || post.awardsCeremonyDate;

    if (WorldEngine.state?.season) {
      WorldEngine.state.season.phase = 'offseason';
    }

    const event = (WorldEngine.state?.schedule || []).find(item =>
      String(item?.eventId || item?.id || '') === EVENT_ID
    );
    if (event) {
      event.completed = true;
      event.played = true;
      event.status = 'completed';
      event.completedAt = post.awardsCeremonyAcknowledgedAt;
      event.requiresPlayerInteraction = false;
      event.result = {
        title: 'League Awards Ceremony',
        summary: 'The league awards were revealed and recorded in league history.',
      };
    }

    WorldEngine.save?.();
    document.getElementById('pi-awards-ceremony')?.remove();

    if (typeof openHubTab === 'function') openHubTab('home');
    if (typeof refreshCareerUI === 'function') refreshCareerUI();
    WorldEngine.renderLeagueAwardsHistoryCard?.();
  }

  /*
   * The permanent League Awards screen remains available from the League tab,
   * but it should not be forced immediately after the ceremony. Capture only
   * the ceremony's final Continue action before its older direct handler runs.
   */
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#pi-awards-finish');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    finishCeremony();
  }, true);
})();
