## game schedule month first match
```js
 () => {
  resetPlayer();
  showScreen('creation');
});

btnContinue.addEventListener('click', () => {
  loadCareerPreview();
});

// ── DEV SHORTCUT — TEMPORARY, REMOVE BEFORE RELEASE ──────────────────────────
// Loads the saved career and jumps straight to Career Hub without running
// any cinematic sequences or altering career stage / tryout state.
btnDevHub.addEventListener('click', () => {
  const savedCareer = localStorage.getItem(SAVE_KEY);
  if (!savedCareer) return;

  try {
    const parsed = JSON.parse(savedCareer);
    if (!parsed.player) return;

    Game.player = {
      ...Game.player,
      ...parsed.player,
    };

    const devDate =
      '2026-09-17';

    /*
     * DEV SHORTCUT
     *
     * Jump directly to the intended testing date.
     *
     * Do not rewind the canonical world to season start and
     * re-simulate already processed history. Rewinding only the
     * clock while retaining completed games/events creates an
     * internally inconsistent world and can stop early on a
     * player-controlled event such as Training.
     */
    WorldEngine.setCurrentDate(
      devDate,
      {
        save: false,
      }
    );

    Game.player.currentDate =
      devDate;

    const canonicalPlayer =
      syncCareerPlayerWithWorld();

    if (!canonicalPlayer) {
      console.error(
        '[DEV] Career player could not be synchronized with the World Engine.'
      );

      return;
    }

    WorldEngine.state.schedule =
      WorldEngine.createHighSchoolCareerSchedule(
        WorldEngine.state.teams
      );

    scheduleViewYear = 2026;
    scheduleViewMonth = 8;

    isDevSession = true;
    window.PROJECT_ICE_DEV_SESSION = true;

    

    refreshScheduleEvents();
    refreshCareerUI();
    showScreen('hub');
  } catch (err) {
    console.error('[DEV] Skip to Hub failed:', err);
  }
});

if (btnLiveGameDiagnostic) {
  btnLiveGameDiagnostic
    .addEventListener(
      'click',
      () => {
        runLiveGameDiagnosticFromUI();
      }
    );
}
// ─────────────────────────────────────────────────────────────────────────────

btnBackTitle.addEventListener('click', () => {
  showScreen('title');
});

btnBackCreation.addEventListener('click', () => {
  showScreen('creation');
});

btnBackSummary.addEventListener('click', () => {
  showScreen('summary');
});
function openHubTab(tabId) {
  const validTabs = [
    'home',
    'schedule',
    'player',
    'team',
    'league'
  ];

  if (!validTabs.includes(tabId)) return;

  showScreen('hub');

  document
    .querySelectorAll('.hub-nav__tab')
    .forEach(tab => {
      tab.classList.toggle(
        'hub-nav__tab--active',
        tab.dataset.hubTab === tabId
      );
    });

  document
    .querySelectorAll('.hub-tab-panel')
    .forEach(panel => {
      const isActive =
        panel.id === `hub-tab-${tabId}`;

      panel.classList.toggle(
        'hub-tab-panel--active',
        isActive
      );

      panel.setAttribute(
        'aria-hidden',
        String(!isActive)
      );
    });

  const hubInfoBar =
    document.getElementById('hub-info-bar');

  if (hubInfoBar) {
    hubInfoBar.style.display =
      tabId === 'home' ? '' : 'none';
  }

  if (tabId === 'schedule') {
    refreshScheduleEvents();

    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );

    renderScheduleKeyEvents();
  }

  if (tabId === 'home') {
    setupHubCalendar();
  }

  if (tabId === 'player') {
    _activePlayerProfile = null;
    renderPlayerProfile();
  }

  if (tabId === 'team') {
    renderTeamTab(Game.teamTabSelectedTeamId);
  }
  if (tabId === 'league') {
    renderLeagueStandingsPreview();
    renderLeagueLeadersPreview();
    renderLeagueAwardsPreview();
    if (
      !Array.isArray(Game.currentProspectRankings) ||
      Game.currentProspectRankings.length === 0
    ) {
      renderProspectsScreen();
    }
    renderLeagueProspectsPreview();
  }
}
const btnBackPlayerProfile =
  document.getElementById('btn-back-player-profile');

if (btnBackPlayerProfile) {
  
      btnBackPlayerProfile.addEventListener('click', () => {
        if (_playerProfileOrigin === 'full-stats') {
          showScreen('full-stats');
          return;
        }
        if (_playerProfileOrigin === 'prospects') {
          showScreen('prospects');
          renderProspectsScreen();
          return;
        }
        if (_playerProfileOrigin === 'league-prospects') {
          openHubTab('league');
          return;
        }

        if (_playerProfileOrigin === 'hub-team') {
      showScreen('hub');

      document
        .querySelectorAll('.hub-tab-panel')
        .forEach(panel => {
          panel.classList.remove('hub-tab-panel--active');
          panel.setAttribute('aria-hidden', 'true');
        });
      

      document
        .querySelectorAll('.hub-nav__tab')
        .forEach(button => {
          button.classList.remove('hub-nav__tab--active');
        });

      const teamPanel =
        document.getElementById('hub-tab-team');

      const teamButton =
        document.querySelector('[data-hub-tab="team"]');

      if (teamPanel) {
        teamPanel.classList.add('hub-tab-panel--active');
        teamPanel.setAttribute('aria-hidden', 'false');
      }

      if (teamButton) {
        teamButton.classList.add('hub-nav__tab--active');
      }

      renderTeamTab();
      return;
    }

    showScreen('team-profile');
  });
}
// ── Hockey Background screen ────────────────────────────────
document.querySelectorAll('#background-screen .bg-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#background-screen .bg-card').forEach((c) =>
      c.classList.remove('bg-card--selected')
    );
    card.classList.add('bg-card--selected');
    Game.player.background = card.dataset.background;
    btnContinueBackground.disabled = false;
    btnContinueBackground.classList.remove('btn--secondary');
    btnContinueBackground.classList.add('btn--primary');
  });
});

btnIdentityBackground.addEventListener('click', () => {
  showScreen('background');
});

btnBackIdentity.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueBackground.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── Archetype screen ────────────────────────────────────────
document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#archetype-screen .bg-card').forEach((c) =>
      c.classList.remove('bg-card--selected')
    );
    ca
```


## game currentMonth first match
NOT FOUND


## game renderSchedule first match
```js
ndow.PROJECT_ICE_DEV_SESSION = true;

    

    refreshScheduleEvents();
    refreshCareerUI();
    showScreen('hub');
  } catch (err) {
    console.error('[DEV] Skip to Hub failed:', err);
  }
});

if (btnLiveGameDiagnostic) {
  btnLiveGameDiagnostic
    .addEventListener(
      'click',
      () => {
        runLiveGameDiagnosticFromUI();
      }
    );
}
// ─────────────────────────────────────────────────────────────────────────────

btnBackTitle.addEventListener('click', () => {
  showScreen('title');
});

btnBackCreation.addEventListener('click', () => {
  showScreen('creation');
});

btnBackSummary.addEventListener('click', () => {
  showScreen('summary');
});
function openHubTab(tabId) {
  const validTabs = [
    'home',
    'schedule',
    'player',
    'team',
    'league'
  ];

  if (!validTabs.includes(tabId)) return;

  showScreen('hub');

  document
    .querySelectorAll('.hub-nav__tab')
    .forEach(tab => {
      tab.classList.toggle(
        'hub-nav__tab--active',
        tab.dataset.hubTab === tabId
      );
    });

  document
    .querySelectorAll('.hub-tab-panel')
    .forEach(panel => {
      const isActive =
        panel.id === `hub-tab-${tabId}`;

      panel.classList.toggle(
        'hub-tab-panel--active',
        isActive
      );

      panel.setAttribute(
        'aria-hidden',
        String(!isActive)
      );
    });

  const hubInfoBar =
    document.getElementById('hub-info-bar');

  if (hubInfoBar) {
    hubInfoBar.style.display =
      tabId === 'home' ? '' : 'none';
  }

  if (tabId === 'schedule') {
    refreshScheduleEvents();

    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );

    renderScheduleKeyEvents();
  }

  if (tabId === 'home') {
    setupHubCalendar();
  }

  if (tabId === 'player') {
    _activePlayerProfile = null;
    renderPlayerProfile();
  }

  if (tabId === 'team') {
    renderTeamTab(Game.teamTabSelectedTeamId);
  }
  if (tabId === 'league') {
    renderLeagueStandingsPreview();
    renderLeagueLeadersPreview();
    renderLeagueAwardsPreview();
    if (
      !Array.isArray(Game.currentProspectRankings) ||
      Game.currentProspectRankings.length === 0
    ) {
      renderProspectsScreen();
    }
    renderLeagueProspectsPreview();
  }
}
const btnBackPlayerProfile =
  document.getElementById('btn-back-player-profile');

if (btnBackPlayerProfile) {
  
      btnBackPlayerProfile.addEventListener('click', () => {
        if (_playerProfileOrigin === 'full-stats') {
          showScreen('full-stats');
          return;
        }
        if (_playerProfileOrigin === 'prospects') {
          showScreen('prospects');
          renderProspectsScreen();
          return;
        }
        if (_playerProfileOrigin === 'league-prospects') {
          openHubTab('league');
          return;
        }

        if (_playerProfileOrigin === 'hub-team') {
      showScreen('hub');

      document
        .querySelectorAll('.hub-tab-panel')
        .forEach(panel => {
          panel.classList.remove('hub-tab-panel--active');
          panel.setAttribute('aria-hidden', 'true');
        });
      

      document
        .querySelectorAll('.hub-nav__tab')
        .forEach(button => {
          button.classList.remove('hub-nav__tab--active');
        });

      const teamPanel =
        document.getElementById('hub-tab-team');

      const teamButton =
        document.querySelector('[data-hub-tab="team"]');

      if (teamPanel) {
        teamPanel.classList.add('hub-tab-panel--active');
        teamPanel.setAttribute('aria-hidden', 'false');
      }

      if (teamButton) {
        teamButton.classList.add('hub-nav__tab--active');
      }

      renderTeamTab();
      return;
    }

    showScreen('team-profile');
  });
}
// ── Hockey Background screen ────────────────────────────────
document.querySelectorAll('#background-screen .bg-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#background-screen .bg-card').forEach((c) =>
      c.classList.remove('bg-card--selected')
    );
    card.classList.add('bg-card--selected');
    Game.player.background = card.dataset.background;
    btnContinueBackground.disabled = false;
    btnContinueBackground.classList.remove('btn--secondary');
    btnContinueBackground.classList.add('btn--primary');
  });
});

btnIdentityBackground.addEventListener('click', () => {
  showScreen('background');
});

btnBackIdentity.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueBackground.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── Archetype screen ────────────────────────────────────────
document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#archetype-screen .bg-card').forEach((c) =>
      c.classList.remove('bg-card--selected')
    );
    card.classList.add('bg-card--selected');
    Game.player.archetype = card.dataset.archetype;
    btnContinueArchetype.disabled = false;
    btnContinueArchetype.classList.remove('btn--secondary');
    btnContinueArchetype.classList.add('btn--primary');
  });
});

btnIdentityArchetype.addEventListener('click', () => {
  showScreen('archetype');
});

btnBackIdentityArchetype.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueArchetype.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── NHL Team screen ─────────────────────────────────────────
document.querySelectorAll('#nhlteam-screen .team-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#nhlteam-screen .team-card').forEach((c) =>
      c.classList.remove('team-card--selected')
    );
    card.classList.add('team-card--selected');
    Game.player.nhlTeam = card.dataset.team;
    btnContinueNhlTeam.disabled = false;
    btnContinueNhlTeam.classList.remove('btn--secondary');
    btnContinueNhlTeam.classList.add('btn--primary');
  });
});

btnIdentityNhlTeam.addEventListener('click', () => {
  showScreen('nhlteam');
});

btnBackIdentityNhlTeam.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueNhlTeam.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

// ── Motivation screen ───────────────────────────────────────
document.querySelectorAll('#motivation-screen .motivation-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#motivation-screen .motivation-card').fo
```


## game schedule-tab first match
```js
     openPregameMatchup(
          def
        );

      if (!openedPregame) {
        console.error(
          '[Project Ice] Unable to open pregame matchup.',
          def
        );
      }

      return;
    }

    /*
     * Canonical Practice completion.
     */
    const {
      supported,
      completion,
    } =
      completeCurrentCareerEvent(
        def
      );

      if (supported) {
        if (!completion?.success) {
          console.error(
            '[Project Ice] Event completion failed:',
            completion
          );

          return;
        }

        if (
          completion.awaitingSelection === true
        ) {
          return;
        }

        syncCareerPlayerWithWorld();

      Game.player.currentDate =
        WorldEngine.state.season
          ?.currentDate ||
        completion.date ||
        Game.player.currentDate;

      saveCareerPreview();

      refreshCareerUI();

      refreshScheduleEvents();

      EventResultsSystem.open(
        def,
        completion
      );

      return;
    }

    /*
     * Existing tryout and future dedicated event routes.
     */
    if (
      def.completeScreen &&
      COMPLETE_SCREENS[
        def.completeScreen
      ]
    ) {
      COMPLETE_SCREENS[
        def.completeScreen
      ]();

      return;
    }

    const toast =
      document.getElementById(
        'ev-begin-toast'
      );

    if (toast) {
      toast.hidden = false;
    }
  });

/*
 * Event Results — shared continuation path.
 *
 * Practice, Recovery, and future career events all return
 * through the same refreshed Schedule-tab route.
 */

const btnPostgameContinue =
  document.getElementById(
    'btn-postgame-continue'
  );

if (btnPostgameContinue) {
  btnPostgameContinue.addEventListener(
    'click',
    () => {
      refreshCareerUI();
      refreshScheduleEvents();

      openHubTab(
        'schedule'
      );
    }
  );
}

document
  .getElementById(
    'btn-postgame-box-score'
  )
  ?.addEventListener(
    'click',
    () => {
      const gameId =
        postgameSummaryScreen?.dataset
          ?.gameId;

      if (gameId) {
        openBoxScore(gameId);
      }
    }
  );

document
  .getElementById(
    'btn-box-score-back'
  )
  ?.addEventListener(
    'click',
    () => {
      showScreen(
        'postgame-summary'
      );
    }
  );

document
  .getElementById(
    'box-score-away-toggle'
  )
  ?.addEventListener(
    'click',
    () => {
      boxScoreScreen?._renderSide?.(
        'away'
      );
    }
  );

document
  .getElementById(
    'box-score-home-toggle'
  )
  ?.addEventListener(
    'click',
    () => {
      boxScoreScreen?._renderSide?.(
        'home'
      );
    }
  );
const btnEventResultsContinue =
  document.getElementById(
    'btn-event-results-continue'
  );

if (btnEventResultsContinue) {
  btnEventResultsContinue.addEventListener(
    'click',
    () => {
      refreshCareerUI();

      refreshScheduleEvents();

      openHubTab(
        'schedule'
      );
    }
  );
}

// ── Tryout Summary navigation ─────────────────────────────────

// Back: first-time → return to event screen (arena); history → return to hub
// ════════════════════════════════════════════════════════════════
// DRILL ENGINE
// Generic factory for tryout evaluation drills.
// DrillEngine(config) returns { open, beginDrill }:
//   open()       — populates the shared coach-intro screen and shows it.
//   beginDrill() — resets state, renders the first decision, shows skating-eval.
// ════════════════════════════════════════════════════════════════

// Tracks whichever drill instance is currently open so the shared coach-intro
// "Begin" button always starts the right drill regardless of sequence.
let _activeDrill = null;

// Tracks the active drill's completion handler so btn-sr-continue knows where to route.
let _drillContinueCallback = null;

const DrillEngine = (function () {

  // ── Shared helpers (one copy for all drill instances) ──────
  const NPC_POOL = [
    'Ethan Brooks',  'Mason Carter', 'Luke Jensen',  'Jake Murray',
    'Cody Park',     'Tyler Voss',   'Brandon Lee',  'Connor Walsh',
    'Dylan Shaw',    'Nate Rourke',  'Austin Reid',  'Hunter Cole',
  ];

  function _roll([min, max]) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function _letterGrade(s) {
    if (s >= 97) return 'A+';
    if (s >= 93) return 'A';
    if (s >= 90) return 'A\u2212';
    if (s >= 87) return 'B+';
    if (s >= 83) return 'B';
    if (s >= 80) return 'B\u2212';
    if (s >= 77) return 'C+';
    if (s >= 73) return 'C';
    if (s >= 70) return 'C\u2212';
    if (s >= 67) return 'D+';
    if (s >= 63) return 'D';
    if (s >= 60) return 'D\u2212';
    return 'F';
  }

  function _generateNpcs(playerScore) {
    const names = [...NPC_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    return names.map(name => {
      const delta = Math.floor(Math.random() * 14) - 6; // -6 to +7
      const score = Math.max(52, Math.min(99, playerScore + delta));
      return { name, score };
    });
  }

  // ── Per-instance factory ───────────────────────────────────
  // config shape:
  //   evalNumber    {number}    e.g. 1
  //   evalTotal     {number}    e.g. 3
  //   evalName      {string}    e.g. 'Skating'
  //   evalIcon      {string}    e.g. '⛸️'
  //   coachSpeech   {string}    quoted text shown on intro screen
  //   traits        {string[]}  pills shown below the speech
  //   decisions     {Array}     3 decision objects (prompt + choices)
  //   coachFeedback {Function}  (score:number) => string
  //   onComplete    {Function}  called when the player presses Continue on results
  function create(config) {

    let _state = {};

    function _resetState() {
      _state = {
        decisionIndex:  0,
        decisionScores: [],
        totalScore:     0,
        grade:          '',
        feedback:       '',
        npcResults:     [],
      };
    }

    function _el(id) { return document.getElementById(id); }

    // Populate shared coach-intro screen elements with this drill's data
    function _populateCoachIntro() {
      const tag        = _el('ci-eval-tag');
      const icon       = _el('ci-eval-icon');
      const title      = _el('ci-eval-title');
      const speech     = _el('ci-speech-text');
      const traitsEl   = _el('ci-traits');
      const btnLabel   = _el('ci-begin-btn-label');
      const evalHeader = _el('se-eval-header');   // skating-eval screen top bar

      if (tag)        tag.textContent        = `EVALUATION ${config.evalNumber} OF ${config.evalTotal}`;
      if (ico
```


## world homeDeployment first match
```js
   null,

        homeSkaters:
          5,

        awaySkaters:
          5,

        activePenalties: [],
      },

      /*
       * ========================================================
       * LIVE GAME FLOW STATE
       * ========================================================
       *
       * Tracks the hockey context between events.
       *
       * Events should not exist as unrelated random rolls.
       * A takeaway can create transition offense, a saved shot
       * can create a rebound, a whistle resets play, etc.
       */
      flow: {
        /*
         * Team currently controlling the puck.
         *
         * null = no established possession, such as before
         * the opening faceoff or immediately after a whistle.
         */
        possessionSide: null,

        /*
         * Where the puck currently is from the perspective of
         * the team with possession.
         *
         * neutral
         * offensive
         * defensive
         */
        zone: 'neutral',

        /*
         * Used by the event-time scheduler for realistic clusters.
         *
         * normal
         * transition
         * offensive-zone
         * rebound
         * scramble
         * after-faceoff
         * quiet
         */
        paceContext:
          'after-faceoff',

        /*
         * Whether play is currently stopped.
         *
         * Goals, penalties, goalie freezes, icing, offsides, etc.
         * will eventually set this true until the next faceoff.
         */
        stopped: true,

        stoppageReason:
          'period-start',

        /*
         * Keeps event generation aware of the immediately
         * preceding action.
         */
        lastEventType: null,

        lastEventSide: null,

        /*
         * Consecutive attacking pressure matters.
         *
         * Sustained zone time can increase the chance of another
         * shot without guaranteeing one.
         */
        pressureLevel: 0,

        /*
         * The selected even-strength deployment remains on the
         * ice for a stretch of play rather than rerolling all five
         * skaters every few seconds.
         */
        homeDeployment: null,

        awayDeployment: null,

        deploymentAgeSeconds: 0,

        /*
         * Tracks the most recent actual puck touches during the
         * current uninterrupted team possession.
         *
         * Goal assist attribution will read from this history rather
         * than randomly selecting teammates.
         */
        recentPossessionTouches: [],
      },

      /*
       * Career-player interaction state.
       *
       * This is where future Be-A-Pro moments can pause the
       * simulation for decisions such as Shoot / Pass.
       */
      interactiveMoment: null,

      interactiveMomentsCompleted: [],

      /*
       * Presentation speed is UI state only.
       * The simulator itself works in hockey-time increments.
       */
      presentation: {
        speed: 1,

        paused: false,
      },

      /*
       * These make the finalization step explicit.
       * The live state must only become permanent once.
       */
      finalized: false,

      finalizedGameResult: null,
    };

    return {
      success: true,

      reason:
        'live-game-state-created',

      simulation,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — ON-ICE DEPLOYMENT
   * ============================================================
   *
   * Returns the players currently deployed for one team.
   *
   * Supported situations:
   * - even-strength
   * - power-play
   * - penalty-kill
   *
   * No statistics are changed here. This function only resolves
   * which real players are eligible to participate in the next
   * live-game event.
   */
  function getLiveGameOnIcePlayers(
    simulation,
    side,
    options = {}
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        players: [],
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : side === 'away'
          ? simulation.away
          : null;

    if (!teamState) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        players: [],
      };
    }

    const canonicalTeam =
      getTeamById(
        teamState.teamId
      );

    if (!canonicalTeam) {
      return {
        success: false,
        reason:
          'live-game-team-not-found',
        players: [],
      };
    }

    const allSkaters =
      Array.isArray(
        teamState.skaters
      )
        ? teamState.skaters
        : [];

    /*
     * ==========================================================
     * PENALTY-BOX EXCLUSION
     * ==========================================================
     *
     * Any player currently serving an active penalty is ineligible
     * for every on-ice deployment until that penalty expires.
     *
     * This applies automatically to:
     *   even strength
     *   reduced even strength
     *   power play
     *   penalty kill
     *   overtime
     */
    const activePenaltyPlayerIds =
      new Set(
        (
          Array.isArray(
            simulation.specialTeams
              ?.activePenalties
          )
            ? simulation.specialTeams
                .activePenalties
            : []
        )
          .filter(
            penalty =>
              penalty &&
              penalty.active === true &&
              Number(
                penalty.secondsRemaining
              ) > 0 &&
              penalty.playerId
          )
          .map(
            penalty =>
              String(
                penalty.playerId
              )
          )
      );

    const skaters =
      allSkaters.filter(
        player =>
          !activePenaltyPlayerIds.has(
            String(
              player.playerId || ''
            )
          )
      );

    const starter =
      Array.isArray(
        teamState.goalies
      )
        ? (
            teamState.goalies.find(
              goalie =>
                goalie.started === true
            ) ||
            teamState.goalies[0] ||
            null
          )
        : null;

    const situation =
      options.situation ||
      'even-strength';

    const forwardLine =
      Math.max(
        1,
        Math.min(
          4,
          Number(
            options.forwardLine
          ) || 1
        )
      );

    const defensePair =
      Math.max(
        1,
        Math.min(
          3,
          Number(
            options.defensePair
          ) || 1
        )
      );

      const specialTeamsUnit =
        Math.max(
          1,
          Math.min(
            2,
            Number(
              options.specialTeamsUnit
            ) || 1
          )
        );

      /*
       * Optional manpower target.
       *
       * Normal calls can omit this completely.
       * Special-teams deployment can request:
       *
       * PP:
       *   5 skaters
       *   4 skaters for 4-on-3 OT
       *
       * PK:
       *   4 skaters
       *   3 skaters for 5-on-3 / 4-on-3
       */
      const requestedSkaterCount =
        Number.isFinite(
          Number(
            options.skaterCount
          )
        )
          ? Math.max(
              3,
              Math.min(
                5,
                Number(
                  options.skaterCount
                )
              )
            )
          : null;

      const findSkaterById =
      playerId =>
        skaters.find(player =>
          String(
            player.playerId || ''
          ) ===
          String(playerId || '')
        ) ||
        null;

    let deployedSkaters = [];

    /*
     * ==========================================================
     * EVEN STRENGTH
     * ==========================================================
     *
     * 3 forwards + 2 defensemen.
     */
    if (
      situation ===
      'even-strength'
    ) {
      const forwards =
        skaters.filter(player =>
          player.lineupAssignment
            ?.unit === 'forward' &&
          Number(
            player.lineupAssignment
              ?.line
          ) === forwardLine
        );

      const defensemen =
        skaters.filter(player =>
          player.lineupAssignment
            ?.unit === 'defense' &&
          Number(
            player.lineupAssignment
              ?.pair
          ) === defensePair
        );

      /*
       * Normal even strength:
       *   5 skaters = 3F + 2D
       *
       * Reduced even strength from overlapping penalties:
       *   4 skaters = 2F + 2D
       *   3 skaters = 2F + 1D
       *
       * For reduced situations, favor the stronger players from the
       * forward line / defense pair already selected for this shift.
       */
      const sortedForwards =
        [...forwards]
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              (
                Number(
                  secondPlayer.overall
                ) || 50
              ) -
              (
                Number(
                  firstPlayer.overall
                ) || 50
              )
          );

      const sortedDefensemen =
        [...defensemen]
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
              (
                Number(
                  secondPlayer.overall
                ) || 50
              ) -
              (
                Number(
                  firstPlayer.overall
                ) || 50
              )
          );

      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters = [
          ...sortedForwards.slice(
            0,
            2
          ),
          ...sortedDefensemen.slice(
            0,
            2
          ),
        ];
      } else if (
        requestedSkaterCount === 3
      ) {
        deployedSkaters = [
          ...sortedForwards.slice(
            0,
```


## world shift first match
```js

      )
        ? gameResult.scoringPlays
        : [];

    if (
      homeSkaters.length === 0 ||
      awaySkaters.length === 0
    ) {
      return {
        success: false,
        reason:
          'skater-box-scores-not-found',
      };
    }

    /*
     * Reset the generated values before building them.
     * This keeps retries deterministic and prevents accidental
     * duplication if the preparation step runs more than once.
     */
    [
      ...homeSkaters,
      ...awaySkaters,
    ].forEach(skater => {
      skater.plusMinus = 0;
      skater.penaltyMinutes = 0;
    });

    const shufflePlayers = players => {
      const shuffled = [
        ...players,
      ];

      for (
        let index =
          shuffled.length - 1;
        index > 0;
        index--
      ) {
        const replacementIndex =
          gameRandom.integer(
            0,
            index
          );

        [
          shuffled[index],
          shuffled[replacementIndex],
        ] = [
          shuffled[replacementIndex],
          shuffled[index],
        ];
      }

      return shuffled;
    };

    const getPlayerById = (
      skaters,
      playerId
    ) =>
      skaters.find(
        skater =>
          String(
            skater.playerId
          ) ===
          String(
            playerId
          )
      ) ||
      null;

    const selectOnIceSkaters = (
      skaters,
      requiredPlayerIds = []
    ) => {
      const selected = [];

      requiredPlayerIds
        .filter(Boolean)
        .forEach(playerId => {
          const player =
            getPlayerById(
              skaters,
              playerId
            );

          if (
            player &&
            !selected.includes(player)
          ) {
            selected.push(player);
          }
        });

      const remainingPlayers =
        shufflePlayers(
          skaters.filter(
            skater =>
              skater.dressed !== false &&
              !selected.includes(
                skater
              )
          )
        );

      while (
        selected.length < 5 &&
        remainingPlayers.length > 0
      ) {
        selected.push(
          remainingPlayers.shift()
        );
      }

      return selected;
    };

    /*
     * Plus/minus is awarded only on even-strength and
     * shorthanded goals. Power-play goals do not count.
     */
    scoringPlays.forEach(play => {
      const strength =
        String(
          play.strength || 'EV'
        ).toUpperCase();

      if (
        strength === 'PP' ||
        strength ===
          'POWER PLAY'
      ) {
        return;
      }

      const scoringTeamIsHome =
        String(
          play.teamId
        ) ===
        String(
          gameResult.home.teamId
        );

      const scoringSkaters =
        scoringTeamIsHome
          ? homeSkaters
          : awaySkaters;

      const defendingSkaters =
        scoringTeamIsHome
          ? awaySkaters
          : homeSkaters;

      const scoringPlayersOnIce =
        selectOnIceSkaters(
          scoringSkaters,
          [
            play.scorerId,
            play.primaryAssistId,
            play.secondaryAssistId,
          ]
        );

      const defendingPlayersOnIce =
        selectOnIceSkaters(
          defendingSkaters
        );

      scoringPlayersOnIce.forEach(
        skater => {
          skater.plusMinus =
            (
              Number(
                skater.plusMinus
              ) || 0
            ) + 1;
        }
      );

      defendingPlayersOnIce.forEach(
        skater => {
          skater.plusMinus =
            (
              Number(
                skater.plusMinus
              ) || 0
            ) - 1;
        }
      );
    });

    const createTeamPenalties = (
      teamResult,
      opponentResult
    ) => {
      const eligibleSkaters =
        Array.isArray(
          teamResult.skaters
        )
          ? teamResult.skaters.filter(
              skater =>
                skater &&
                skater.dressed !== false
            )
          : [];

      if (
        eligibleSkaters.length === 0
      ) {
        return [];
      }

      /*
       * Version 1 generates a realistic modest number of
       * two-minute minor penalties. Major and misconduct
       * penalties can be added with the full penalty engine.
       */
      let minorPenaltyCount =
        gameRandom.integer(
          1,
          4
        );

      if (
        gameRandom.chance(
          0.18
        )
      ) {
        minorPenaltyCount += 1;
      }

      const generatedPenalties = [];

      for (
        let penaltyIndex = 0;
        penaltyIndex <
          minorPenaltyCount;
        penaltyIndex++
      ) {
        const penaltyTickets = [];

        eligibleSkaters.forEach(
          skater => {
            const canonicalPlayer =
              getPlayerById(
                eligibleSkaters,
                skater.playerId
              );

            const discipline =
              Number(
                canonicalPlayer
                  ?.attributes
                  ?.discipline
              ) || 50;

            const bodyChecking =
              Number(
                canonicalPlayer
                  ?.attributes
                  ?.bodyChecking
              ) || 50;

            const ticketCount =
              Math.max(
                1,
                Math.round(
                  (
                    110 -
                    discipline +
                    bodyChecking * 0.25
                  ) / 15
                )
              );

            for (
              let ticketIndex = 0;
              ticketIndex <
                ticketCount;
              ticketIndex++
            ) {
              penaltyTickets.push(
                skater
              );
            }
          }
        );

        const penalizedSkater =
          penaltyTickets[
            gameRandom.integer(
              0,
              penaltyTickets.length - 1
            )
          ];

        penalizedSkater.penaltyMinutes =
          (
            Number(
              penalizedSkater
                .penaltyMinutes
            ) || 0
          ) + 2;

        const elapsedSeconds =
          gameRandom.integer(
            0,
            60 * 60 - 1
          );

        const period =
          Math.min(
            3,
            Math.floor(
              elapsedSeconds /
              (20 * 60)
            ) + 1
          );

        const secondsIntoPeriod =
          elapsedSeconds -
          (
            period - 1
          ) *
          20 *
          60;

        const secondsRemaining =
          20 *
            60 -
          secondsIntoPeriod -
          1;

        const penalty = {
          penaltyNumber:
            generatedPenalties.length +
            1,

          teamId:
            teamResult.teamId,

          opponentTeamId:
            opponentResult.teamId,

          playerId:
            penalizedSkater.playerId,

          playerName:
            penalizedSkater.name,

          period,

          timeRemaining:
            `${String(
              Math.floor(
                secondsRemaining /
                60
              )
            ).padStart(
              2,
              '0'
            )}:${String(
              secondsRemaining %
                60
            ).padStart(
              2,
              '0'
            )}`,

          elapsedSeconds,

          minutes:
            2,

          type:
            'minor',

          infraction:
            gameRandom.chance(
              0.5
            )
              ? 'Tripping'
              : gameRandom.chance(
                    0.5
                  )
                ? 'Hooking'
                : 'Interference',
        };

        generatedPenalties.push(
          penalty
        );
      }

      return generatedPenalties;
    };

    const homePenalties =
      createTeamPenalties(
        gameResult.home,
        gameResult.away
      );

    const awayPenalties =
      createTeamPenalties(
        gameResult.away,
        gameResult.home
      );

    gameResult.penalties = [
      ...homePenalties,
      ...awayPenalties,
    ].sort(
      (
        firstPenalty,
        secondPenalty
      ) =>
        (
          Number(
            firstPenalty
              .elapsedSeconds
          ) || 0
        ) -
        (
          Number(
            secondPenalty
              .elapsedSeconds
          ) || 0
        )
    );

    gameResult.penalties.forEach(
      (
        penalty,
        index
      ) => {
        penalty.penaltyNumber =
          index + 1;
      }
    );

    return {
      success: true,

      reason:
        'skater-secondary-stats-populated',

      homePenaltyMinutes:
        homeSkaters.reduce(
          (
            total,
            skater
          ) =>
            total +
            (
              Number(
                skater
                  .penaltyMinutes
              ) || 0
            ),
          0
        ),

      awayPenaltyMinutes:
        awaySkaters.reduce(
          (
            total,
            skater
          ) =>
            total +
            (
              Number(
                skater
                  .penaltyMinutes
              ) || 0
            ),
          0
        ),

      penaltyCount:
        gameResult.penalties.length,
    };
  }

  function validateGameResult(
    gameResult
  ) {
    const homeGoals =
      gameResult.home.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.goals) || 0),
        0
      );

    const awayGoals =
      gameResult.away.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.goals) || 0),
        0
      );

    const homeShots =
      gameResult.home.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.shots) || 0),
        0
      );

    const awayShots =
      gameResult.away.skaters.reduce(
        (total, skater) =>
          total +
          (Number(skater.shots) || 0),
        0
      );

    const timelineGoals =
      A
```


## world deployment first match
```js
te will now live
   * in IndexedDB so large rosters, schedules, stats and history can
   * persist safely.
   */

  const WORLD_DB_NAME =
    'projectice_database';

  const WORLD_DB_VERSION =
    1;

  const WORLD_STORE_NAME =
    'worlds';

  const WORLD_RECORD_ID =
    'default';

  function openWorldDatabase() {
    return new Promise(
      (resolve, reject) => {
        const request =
          indexedDB.open(
            WORLD_DB_NAME,
            WORLD_DB_VERSION
          );

        request.onupgradeneeded =
          event => {
            const database =
              event.target.result;

            if (
              !database.objectStoreNames
                .contains(
                  WORLD_STORE_NAME
                )
            ) {
              database.createObjectStore(
                WORLD_STORE_NAME,
                {
                  keyPath: 'id',
                }
              );
            }
          };

        request.onsuccess =
          () => {
            resolve(
              request.result
            );
          };

        request.onerror =
          () => {
            reject(
              request.error ||
              new Error(
                'Could not open Project Ice IndexedDB.'
              )
            );
          };
      }
    );
  }

  // ── Seed teams ──────────────────────────────────────────────
  // Eight fictional high-school programs for the 2022-23 season.
  // Future systems populate each team's roster array and update
  // the stats fields (wins, losses, etc.) after simulated games.
  // Add new teams here; buildDefaults() deep-copies the array.
  const SEED_TEAMS = [
    {
      teamId:          'team-summit-academy',
      schoolName:      'Summit Academy',
      teamName:        'Titans',
      abbreviation: 'TIT',
      primaryColor:    '#1a1a2e',
      secondaryColor:  '#c9a84c',
      prestige:        5,
      identity:        'Elite powerhouse with strong scout attention.',
      coach: {
        name: 'Marcus Hale',

        style:
          'Offensive-minded coach with championship expectations.',

        /*
         * Internal coaching philosophy.
         * These values guide deployment decisions but are never
         * displayed as public coach ratings.
         */
        deploymentPreferences: {
          abilityWeight: 1.08,
          coachTrustWeight: 0.15,
          recentFormWeight: 0.13,
          disciplineWeight: 0.05,
          developmentWeight: 0.05,
          roleStabilityWeight: 0.08,

          evenStrengthEmphasis: 1.04,
          powerPlayEmphasis: 1.12,
          penaltyKillEmphasis: 0.92,
          goalieEmphasis: 1.00,

          favorsOffense: true,
          favorsDefense: false,
          favorsVeterans: false,
          favorsDevelopment: false,
        },
      },

      arena: {

        name: 'Summit Ice Center',

        capacity: 2400,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-iron-peak',
      schoolName:      'Iron Peak',
      teamName:        'Wolves',
      abbreviation: 'IPW',
      primaryColor:    '#2b2d2f',
      secondaryColor:  '#8b0000',
      prestige:        3,
      identity:        'Physical, defense-first team.',
      coach: {

        name: 'Derek Mercer',

        style: 'Demanding defensive coach who values physical play.',

      },

      arena: {

        name: 'The Wolf Den',

        capacity: 2100,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-north-ridge',
      schoolName:      'North Ridge',
      teamName:        'Falcons',
      abbreviation: 'NRF',
      primaryColor:    '#003366',
      secondaryColor:  '#c0c0c0',
      prestige:        4,
      identity:        'Fast, skilled, disciplined team.',
      coach: {

        name: 'Ryan Callahan',

        style: 'Detail-oriented coach focused on speed and discipline.',

      },

      arena: {

        name: 'Falcon Ice Pavilion',

        capacity: 1950,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-cedar-valley',
      schoolName:      'Cedar Valley',
      teamName:        'Storm',
      abbreviation: 'CVS',
      primaryColor:    '#1b4332',
      secondaryColor:  '#52b788',
      prestige:        2,
      identity:        'Underdog program known for player development.',
      coach: {

        name: 'Evan Brooks',

        style: 'Patient development coach known for improving young players.',

      },

      arena: {

        name: 'Cedar Valley Community Rink',

        capacity: 1450,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-westbrook',
      schoolName:      'Westbrook',
      teamName:        'Knights',
      abbreviation: 'WBK',
      primaryColor:    '#1c1c3a',
      secondaryColor:  '#e8e8e8',
      prestige:        3,
      identity:        'Structured defensive team with strong goaltending.',
      coach: {

        name: 'Thomas Keane',

        style: 'Structured coach who emphasizes defense and goaltending.',

      },

      arena: {

        name: 'Westbrook Ice Hall',

        capacity: 1800,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-granite-falls',
      schoolName:      'Granite Falls',
      teamName:        'Bears',
      abbreviation: 'GFB',
      primaryColor:    '#3b1f0a',
      secondaryColor:  '#d4a96a',
      prestige:        2,
      identity:        'Physical, blue-collar team.',
      coach: {

        name: 'Cole Davidson',

        style: 'Blue-collar coach who demands effort and physicality.',

      },

      arena: {

        name: 'Granite Ice Pavilion',

        capacity: 2200,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-lakeview',
      schoolName:      'Lakeview',
      teamName:        'Lynx',
      abbreviation: 'LVL',
      primaryColor:    '#00416a',
      secondaryColor:  '#e4003a',
      prestige:        4,
      identity:        'High-tempo offensive team.',
      coach: {

        name: 'Jordan Price',

        style: 'Aggressive coach who encourages high-tempo offense.',

      },

      arena: {

        name: 'Lakeview Events Center',

        capacity: 2050,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
    {
      teamId:          'team-oakridge',
      schoolName:      'Oakridge',
      teamName:        'Ravens',
      abbreviation: 'OKR',
      primaryColor:    '#0d0d0d',
      secondaryColor:  '#6a0dad',
      prestige:        5,
      identity:        'Prestigious program known for producing top prospects.',
      coach: {

        name: 'Nathan Carlisle',

        style: 'Prestigious program builder with strong scouting connections.',

      },

      arena: {

        name: 'Ravenhurst Arena',

        capacity: 2600,

      },
      roster:          [],
      wins:            0,
      losses:          0,
      overtimeLosses:  0,
      goalsFor:        0,
      goalsAgainst:    0,
      points:          0,
    },
  ];
  // ── Fictional player generation data ─────────────────────────

  const PLAYER_FIRST_NAMES = [
    'Aaron', 'Adam', 'Aiden', 'Alex', 'Alexander', 'Andrew', 'Anthony',
    'Asher', 'Austin', 'Beckett', 'Ben', 'Benjamin', 'Bennett', 'Blake',
    'Braden', 'Bradley', 'Brady', 'Brayden', 'Brett', 'Brody', 'Bryce',
    'Caleb', 'Callum', 'Cameron', 'Carson', 'Carter', 'Casey', 'Charlie',
    'Chase', 'Chris', 'Christian', 'Cole', 'Colin', 'Connor', 'Cooper',
    'Cullen', 'Damon', 'Daniel', 'David', 'Declan', 'Derek', 'Dominic',
    'Drew', 'Dylan', 'Easton', 'Eli', 'Elias', 'Elijah', 'Emmett',
    'Eric', 'Ethan', 'Evan', 'Everett', 'Felix', 'Finn', 'Gabriel',
    'Gavin', 'George', 'Graham', 'Grant', 'Grayson', 'Griffin', 'Hayden',
    'Henry', 'Holden', 'Hudson', 'Hunter', 'Ian', 'Isaac', 'Jack',
    'Jackson', 'Jacob', 'Jake', 'James', 'Jamie', 'Jason', 'Jaxon',
    'Jayden', 'Jeremy', 'Jesse', 'Joel', 'John', 'Jonah', 'Jonathan',
    'Jordan', 'Joseph', 'Josh', 'Joshua', 'Julian', 'Justin', 'Kai',
    'Kane', 'Keegan', 'Kellan', 'Kyle', 'Landon', 'Lane', 'Leo',
    'Levi', 'Liam', 'Logan', 'Lucas', 'Luke', 'Maddox', 'Marcus',
    'Mason', 'Matthew', 'Max', 'Micah', 'Michael', 'Miles', 'Mitchell',
    'Nate', 'Nathan', 'Nicholas', 'Nico', 'Noah', 'Nolan', 'Owen',
    'Parker', 'Patrick', 'Paul', 'Peter', 'Quinn', 'Reid', 'Riley',
    'Roman', 'Rory', 'Ryan', 'Sam', 'Samuel', 'Sawyer', 'Scott',
    'Sean', 'Sebastian', 'Simon', 'Spencer', 'Tanner', 'Theo', 'Thomas',
    'Tristan', 'Tyler', 'Victor', 'Walker', 'Wesley', 'Weston', 'Will',
    'William', 'Wyatt', 'Xavier', 'Zach', 'Zachary',

    'Aleksi', 'Anton', 'Artem', 'Axel', 'Dmitri', 'Emil', 'Erik',
    'Filip', 'Henrik', 'Hugo', 'Ilya', 'Jakob', 'Jani', 'Jesse',
    'Joakim', 'Joel', 'Jonas', 'Joonas', 'Kasper', 'Kevin', 'Leo',
    'Leon', 'Linus', 'Luka', 'Lukas', 'Magnus', 'Marek', 'Matias',
    'Mats', 'Mika', 'Mikko', 'Nikita', 'Nils', 'Oliver', 'Oskar',
    'Otto', 'Patrik', 'Rasmus', 'Sami', 'Sasha', 'Sebastian', 'Teemu',
    'Tomas', 'Viktor', 'Ville'
  ];

  const PLAYER_LAST_NAMES = [
   
```


## world lineupAssignment first match
```js
ent,
    options = {}
  ) {
    if (
      !event ||
      typeof event !== 'object'
    ) {
      return {
        success: false,
        resolved: false,
        reason: 'invalid-event',
      };
    }

    switch (event.type) {
      case EVENT_TYPES.GAME:
        return resolveGameEvent(
          event,
          options
        );

      case EVENT_TYPES.PRACTICE:
        return resolvePracticeEvent(
          event,
          options
        );

        case EVENT_TYPES.TRAINING:
        /*
         * Training is a player-controlled weekly development event.
         * Never auto-resolve it while advancing the calendar.
         *
         * Stop simulation and allow game.js to open the Training
         * selection screen, where the career player chooses a focus.
         */
        return {
          success: true,
          resolved: false,
          stopSimulation: true,

          reason:
            'training-selection-required',

          eventId:
            event?.id ||
            event?.eventId ||
            null,

          event,
        };

      case EVENT_TYPES.RECOVERY:
        return resolveRecoveryEvent(
          event,
          options
        );

      case EVENT_TYPES.COACH_MEETING:
        return resolveCoachMeetingEvent(
          event,
          options
        );

      case EVENT_TYPES.MEDIA:
        return resolveMediaEvent(
          event,
          options
        );

      default:
        return {
          success: true,
          resolved: false,
          reason: 'resolver-not-implemented',

          event,
        };
    }
  }

  // ── Canonical Game Result Contract ──────────────────────────

  function createEmptySkaterGameLine(
    player = null
  ) {
    return {
      playerId:
        player?.id ||
        player?.playerId ||
        null,

      teamId:
        player?.teamId ||
        null,

      name:
        player
          ? `${player.firstName || ''} ${player.lastName || ''}`.trim()
          : '',

      position:
        player?.position ||
        null,

      overall:
        Number(
          player?.overall
        ) || 50,

      archetype:
        player?.archetype ||
        null,

      lineupAssignment:
        player?.lineupAssignment
          ? {
              ...player.lineupAssignment,
            }
          : null,

      started:
        false,

      dressed:
        true,

      /*
       * Every skater placed on the active game roster is
       * participating in this simulated game.
       *
       * This must be 1 so the performance/development engine
       * recognizes the appearance after simulation.
       */
      gamesPlayed:
        player
          ? 1
          : 0,

      goals:
        0,

      assists:
        0,

      points:
        0,

      plusMinus:
        0,

      penaltyMinutes:
        0,

      shots:
        0,

      powerPlayGoals:
        0,

      powerPlayPoints:
        0,

      shorthandedGoals:
        0,

      gameWinningGoals:
        0,

      faceoffWins:
        0,

      faceoffAttempts:
        0,

      blockedShots:
        0,

      hits:
        0,

      takeaways:
        0,

      giveaways:
        0,

      timeOnIceSeconds:
        0,

      powerPlayTimeSeconds:
        0,

      penaltyKillTimeSeconds:
        0,

      gameRating:
        null,

      firstStar:
        false,

      secondStar:
        false,

      thirdStar:
        false,
    };
  }

  function createEmptyGoalieGameLine(
    player = null
  ) {
    return {
      playerId:
        player?.id ||
        player?.playerId ||
        null,

      teamId:
        player?.teamId ||
        null,

      name:
        player
          ? `${player.firstName || ''} ${player.lastName || ''}`.trim()
          : '',

      position:
        'G',

      goalieRole:
        player?.lineupAssignment
          ?.goalieRole ||
        player?.goalieRole ||
        null,

      started:
        false,

      dressed:
        true,

      gamesPlayed:
        0,

      wins:
        0,

      losses:
        0,

      overtimeLosses:
        0,

      shotsAgainst:
        0,

      saves:
        0,

      goalsAgainst:
        0,

      savePercentage:
        null,

      shutout:
        false,

      minutesPlayed:
        0,

      decision:
        null,

      gameRating:
        null,

      firstStar:
        false,

      secondStar:
        false,

      thirdStar:
        false,
    };
  }

  function createEmptyTeamGameResult(
    teamId = null
  ) {
    return {
      teamId,

      score:
        0,

      shots:
        0,

      penaltyMinutes:
        0,

      powerPlayOpportunities:
        0,

      powerPlayGoals:
        0,

      shorthandedGoals:
        0,

      faceoffWins:
        0,

      blockedShots:
        0,

      hits:
        0,

      giveaways:
        0,

      takeaways:
        0,

      periodScores: [
        0,
        0,
        0,
      ],

      overtimeScore:
        0,

      shootoutScore:
        0,

      skaters: [],

      goalies: [],
    };
  }

  function createEmptyGameResult(
    event = {}
  ) {
    const homeTeamId =
      event?.homeTeamId ||
      null;

    const awayTeamId =
      event?.awayTeamId ||
      null;

    return {
      success:
        true,

      completed:
        false,

      gameId:
        event?.id ||
        event?.gameId ||
        null,

      eventId:
        event?.id ||
        event?.eventId ||
        null,

      date:
        event?.date ||
        null,

      homeTeamId,

      awayTeamId,

      status:
        'scheduled',

      winnerTeamId:
        null,

      loserTeamId:
        null,

      resultType:
        null,

      wentToOvertime:
        false,

      wentToShootout:
        false,

      home:
        createEmptyTeamGameResult(
          homeTeamId
        ),

      away:
        createEmptyTeamGameResult(
          awayTeamId
        ),

      scoringPlays: [],

      penalties: [],

      playByPlay: [],

      threeStars: [],

      context: {
        isRivalry:
          Boolean(
            event?.isRivalry
          ),

        isGameOfWeek:
          Boolean(
            event?.isGameOfWeek
          ),

        isMilestone:
          Boolean(
            event?.isMilestone
          ),

        milestoneType:
          event?.milestoneType ||
          null,

        scoutsAttending:
          Number(
            event?.scoutsAttending
          ) || 0,
      },

      metadata: {
        simulatedAt:
          null,

        simulationVersion:
          'game-sim-v1',
      },
    };
  }

  function createTeamGameRoster(
    teamId
  ) {
    const team =
      getTeamById(
        teamId
      );

    if (
      !team ||
      !Array.isArray(
        team.roster
      )
    ) {
      return {
        success: false,

        reason:
          'team-roster-not-found',

        teamId,

        team:
          null,

        skaters: [],

        goalies: [],

        startingGoalie:
          null,

        backupGoalie:
          null,

        specialTeams: {
          powerPlay: [],
          penaltyKill: [],
        },
      };
    }

    /*
     * Ensure the canonical even-strength lineup and
     * special-teams deployments are current before the
     * simulator reads them.
     */
    refreshTeamRosterManagement(
      teamId,
      {
        save: false,
      }
    );

    const activePlayers =
      team.roster.filter(
        player =>
          player?.lineupStatus ===
            'active' &&
          player?.lineupAssignment
      );

    const skaters =
      activePlayers
        .filter(
          player =>
            normalizeAttributePosition(
              player.position
            ) !== 'G'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstAssignment =
              firstPlayer
                .lineupAssignment ||
              {};

            const secondAssignment =
              secondPlayer
                .lineupAssignment ||
              {};

            const unitOrder = {
              forward: 1,
              defense: 2,
              goalie: 3,
            };

            const unitDifference =
              (
                unitOrder[
                  firstAssignment.unit
                ] || 99
              ) -
              (
                unitOrder[
                  secondAssignment.unit
                ] || 99
              );

            if (
              unitDifference !== 0
            ) {
              return unitDifference;
            }

            const firstDeployment =
              Number(
                firstAssignment.line ??
                firstAssignment.pair
              ) || 99;

            const secondDeployment =
              Number(
                secondAssignment.line ??
                secondAssignment.pair
              ) || 99;

            if (
              firstDeployment !==
              secondDeployment
            ) {
              return (
                firstDeployment -
                secondDeployment
              );
            }

            return String(
              firstAssignment.position ||
              ''
            ).localeCompare(
              String(
                secondAssignment.position ||
                ''
              )
            );
          }
        );

    const goalies =
      activePlayers
        .filter(
          player =>
            normalizeAttributePosition(
              player.position
            ) === 'G'
        )
        .sort(
          (
            firstGoalie,
            secondGoalie
          ) => {
            const roleOrder = {
              Starter: 1,
              Backup: 2,
            };

            const firstRole =
              firstGoalie
                .lineupAssignment
                ?.goalieRole ||
              firstGoalie.goalieRole ||
              '';

            const secondRole =
              secondGoalie
                .lineupAssignment
                ?.goalieRole ||
              secondGoalie.goalieRole ||
              '';

         
```
