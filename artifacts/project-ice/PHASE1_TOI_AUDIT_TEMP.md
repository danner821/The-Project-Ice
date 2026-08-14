## deploymentAgeSeconds

### match 1
```js
ffense, a saved shot
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

    const forwardL
```

### match 2
```js
       winningTeamState
            .faceoffWins
        ) || 0
      ) + 1;

    /*
     * ==========================================================
     * INDIVIDUAL FACEOFF STATS
     * ==========================================================
     *
     * Credit the actual centers who took the draw.
     */
    const winningCenter =
      winnerSide === 'home'
        ? homeCenter
        : awayCenter;

    const losingCenter =
      loserSide === 'home'
        ? homeCenter
        : awayCenter;

    if (winningCenter) {
      winningCenter.faceoffWins =
        (
          Number(
            winningCenter.faceoffWins
          ) || 0
        ) + 1;

      winningCenter.faceoffAttempts =
        (
          Number(
            winningCenter.faceoffAttempts
          ) || 0
        ) + 1;
    }

    if (losingCenter) {
      losingCenter.faceoffLosses =
        (
          Number(
            losingCenter.faceoffLosses
          ) || 0
        ) + 1;

      losingCenter.faceoffAttempts =
        (
          Number(
            losingCenter.faceoffAttempts
          ) || 0
        ) + 1;
    }

    const requestedZone =
      options.zone ||
      'neutral';

    simulation.flow
      .possessionSide =
      winnerSide;

    simulation.flow.zone =
      requestedZone;

    simulation.flow
      .paceContext =
      'after-faceoff';

    simulation.flow.stopped =
      false;

    simulation.flow
      .stoppageReason =
      null;

    simulation.flow
      .lastEventType =
      'faceoff';

    simulation.flow
      .lastEventSide =
      winnerSide;

    simulation.flow
      .pressureLevel =
      0;

    simulation.flow
      .homeDeployment =
      homeDeployment;

    simulation.flow
      .awayDeployment =
      awayDeployment;

    simulation.flow
      .deploymentAgeSeconds =
      0;

    const event = {
      id:
        `live-event-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      type:
        'faceoff',

      period:
        simulation.period,

      clockSecondsRemaining:
        simulation
          .clockSecondsRemaining,

      winnerSide,

      loserSide,

      winnerTeamId:
        winnerSide === 'home'
          ? simulation.homeTeamId
          : simulation.awayTeamId,

      loserTeamId:
        loserSide === 'home'
          ? simulation.homeTeamId
          : simulation.awayTeamId,

      winnerPlayerId:
        winnerSide === 'home'
          ? homeCenter?.playerId ||
            null
          : awayCenter?.playerId ||
            null,

      loserPlayerId:
        loserSide === 'home'
          ? homeCenter?.playerId ||
            null
          : awayCenter?.playerId ||
            null,

      zone:
        requestedZone,
    };

    simulation.events.push(
      event
    );

    return {
      success: true,

      reason:
        'live-game-faceoff-resolved',

      winnerSide,

      loserSide,

      event,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SPECIAL TEAMS MATCHUP PROFILE
   * ============================================================
   *
   * Evaluates the actual PP and PK players currently deployed.
   *
   * This is intentionally attribute-driven rather than using a
   * generic team-strength modifier.
   *
   * Power-play quality emphasizes:
   * - puck movement
   * - offensive awareness
   * - puck control
   * - shooting threat
   *
   * Penalty-kill quality emphasizes:
   * - defensive awareness
   * - stick checking
   * - skating
   * - shot blocking
   *
   * Manpower advantage is handled separately so having an extra
   * skater matters even when the two units have similar ratings.
   */
  function getLiveGameSpecialTeamsMatchup(
    simulation
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object' ||
      !simulation.flow ||
      !simulation.specialTeams
    ) {
      return {
        success: false,
        reason:
          'invalid-special-teams-matchup-state',
      };
    }

    const specialTeams =
      simulation.specialTeams;

    if (
      specialTeams.situation !==
        'power-play' ||
      (
        specialTeams.powerPlaySide !==
          'home' &&
        specialTeams.powerPlaySide !==
          'away'
      )
    ) {
      return {
        success: false,
        reason:
          'no-active-power-play',
      };
    }

    const powerPlaySide =
      specialTeams.powerPlaySide;

    const penaltyKillSide =
      specialTeams.penaltyKillSide;

    const powerPlayDeployment =
      powerPlaySide === 'home'
        ? simulation.flow
            .homeDeployment
        : simulation.flow
            .awayDeployment;

    const penaltyKillDeployment =
      penaltyKillSide === 'home'
        ? simulation.flow
            .homeDeployment
        : simulation.flow
            .awayDeployment;

    const powerPlaySkaters =
      Array.isArray(
        powerPlayDeployment
          ?.skaters
      )
        ? powerPlayDeployment.skaters
        : [];

    const penaltyKillSkaters =
      Array.isArray(
        penaltyKillDeployment
          ?.skaters
      )
        ? penaltyKillDeployment.skaters
        : [];

    if (
      powerPlaySkaters.length === 0 ||
      penaltyKillSkaters.length === 0
    ) {
      return {
        success: false,
        reason:
          'special-teams-players-missing',
      };
    }

    const average =
      values => {
        if (
          !Array.isArray(values) ||
          values.length === 0
        ) {
          return 50;
        }

        return (
          values.reduce(
            (sum, value) =>
              sum +
              (
                Number(value) ||
                50
              ),
            0
          ) /
          values.length
        );
      };

    const getAttributes =
      player =>
        getPlayerById(
          player?.playerId
        )?.attributes ||
        {};

    /*
     * =====================================
```

### match 3
```js
   * Dead puck does not consume hockey clock.
     * The next action is a faceoff at the same timestamp.
     */
    if (flow.stopped === true) {
      const faceoffZone =
        flow.stoppageReason ===
          'goal'
          ? 'neutral'
          : flow.zone ||
            'neutral';

      const faceoffResult =
        resolveLiveGameFaceoff(
          simulation,
          {
            zone:
              faceoffZone,
          }
        );

      return {
        success:
          faceoffResult
            ?.success === true,

        reason:
          faceoffResult
            ?.reason ||
          'faceoff-resolution-failed',

        elapsedSeconds: 0,

        event:
          faceoffResult
            ?.event ||
          null,

        result:
          faceoffResult ||
          null,

        simulation,
      };
    }

    /*
     * ==========================================================
     * DEPLOYMENT / SHIFT MANAGEMENT
     * ==========================================================
     *
     * Keep the same skaters on the ice for a real stretch rather
     * than rerolling all five participants every event.
     *
     * Normal shifts are roughly 35–55 seconds. We allow some
     * variance here because event timestamps do not represent
     * every whistle-free second of a shift.
     */

    /*
     * ==========================================================
     * OVERTIME DEPLOYMENT
     * ==========================================================
     *
     * Period 4 uses 3-on-3 hockey:
     * two forwards + one defenseman + goalie.
     */
    const isOvertime =
      simulation.period === 4;
    
    const deploymentNeedsRefresh =
      !flow.homeDeployment ||
      !flow.awayDeployment ||
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) >=
        (
          35 +
          Math.floor(
            Math.random() * 21
          )
        );

      if (deploymentNeedsRefresh) {
        const homeDeploymentResult =
          isOvertime
            ? selectLiveGameOvertimeDeployment(
                simulation,
                'home'
              )
            : selectLiveGameEvenStrengthDeployment(
                simulation,
                'home'
              );

        const awayDeploymentResult =
          isOvertime
            ? selectLiveGameOvertimeDeployment(
                simulation,
                'away'
              )
            : selectLiveGameEvenStrengthDeployment(
                simulation,
                'away'
              );

      if (
        homeDeploymentResult
          ?.success !== true ||
        awayDeploymentResult
          ?.success !== true
      ) {
        return {
          success: false,
          reason:
            'live-game-deployment-refresh-failed',

          homeDeploymentResult,
          awayDeploymentResult,

          event: null,
        };
      }

      flow.homeDeployment =
        homeDeploymentResult
          .deployment;

      flow.awayDeployment =
        awayDeploymentResult
          .deployment;

      flow.deploymentAgeSeconds =
        0;
    }

    /*
     * ==========================================================
     * MANPOWER-AWARE DEPLOYMENT
     * ==========================================================
     *
     * The authoritative manpower counts live in:
     *
     *   specialTeams.homeSkaters
     *   specialTeams.awaySkaters
     *
     * This turns those state values into the actual players on
     * the ice.
     *
     * Supported regulation states:
     *   5v5
     *   5v4
     *   5v3
     *   4v4
     *   4v3
     *   3v3
     *
     * Supported overtime states:
     *   3v3
     *   4v3
     *   5v3
     */
    const specialTeams =
      simulation.specialTeams ||
      {};

    const homeSkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.homeSkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const awaySkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.awaySkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const homeHasAdvantage =
      homeSkaterCount >
      awaySkaterCount;

    const awayHasAdvantage =
      awaySkaterCount >
      homeSkaterCount;

    /*
     * ========================================================
     * HOME DEPLOYMENT
     * ========================================================
     */
    let homeManpowerDeployment =
      null;

    if (homeHasAdvantage) {
      /*
       * Home team owns the power play.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (awayHasAdvantage) {
      /*
       * Home team is killing the penalty.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePa
```

### match 4
```js
le-free second of a shift.
     */

    /*
     * ==========================================================
     * OVERTIME DEPLOYMENT
     * ==========================================================
     *
     * Period 4 uses 3-on-3 hockey:
     * two forwards + one defenseman + goalie.
     */
    const isOvertime =
      simulation.period === 4;
    
    const deploymentNeedsRefresh =
      !flow.homeDeployment ||
      !flow.awayDeployment ||
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) >=
        (
          35 +
          Math.floor(
            Math.random() * 21
          )
        );

      if (deploymentNeedsRefresh) {
        const homeDeploymentResult =
          isOvertime
            ? selectLiveGameOvertimeDeployment(
                simulation,
                'home'
              )
            : selectLiveGameEvenStrengthDeployment(
                simulation,
                'home'
              );

        const awayDeploymentResult =
          isOvertime
            ? selectLiveGameOvertimeDeployment(
                simulation,
                'away'
              )
            : selectLiveGameEvenStrengthDeployment(
                simulation,
                'away'
              );

      if (
        homeDeploymentResult
          ?.success !== true ||
        awayDeploymentResult
          ?.success !== true
      ) {
        return {
          success: false,
          reason:
            'live-game-deployment-refresh-failed',

          homeDeploymentResult,
          awayDeploymentResult,

          event: null,
        };
      }

      flow.homeDeployment =
        homeDeploymentResult
          .deployment;

      flow.awayDeployment =
        awayDeploymentResult
          .deployment;

      flow.deploymentAgeSeconds =
        0;
    }

    /*
     * ==========================================================
     * MANPOWER-AWARE DEPLOYMENT
     * ==========================================================
     *
     * The authoritative manpower counts live in:
     *
     *   specialTeams.homeSkaters
     *   specialTeams.awaySkaters
     *
     * This turns those state values into the actual players on
     * the ice.
     *
     * Supported regulation states:
     *   5v5
     *   5v4
     *   5v3
     *   4v4
     *   4v3
     *   3v3
     *
     * Supported overtime states:
     *   3v3
     *   4v3
     *   5v3
     */
    const specialTeams =
      simulation.specialTeams ||
      {};

    const homeSkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.homeSkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const awaySkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.awaySkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const homeHasAdvantage =
      homeSkaterCount >
      awaySkaterCount;

    const awayHasAdvantage =
      awaySkaterCount >
      homeSkaterCount;

    /*
     * ========================================================
     * HOME DEPLOYMENT
     * ========================================================
     */
    let homeManpowerDeployment =
      null;

    if (homeHasAdvantage) {
      /*
       * Home team owns the power play.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (awayHasAdvantage) {
      /*
       * Home team is killing the penalty.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.homeDeployment
                ?.defensePair ||
              1,

            skaterCount:
              homeSkaterCount,
          }
        );
    }

    /*
     * ========================================================
     * AWAY DEPLOYMENT
     * ========================================================
     */
    let awayManpowerDeployment =
      null;

    if (awayHasAdvantage) {
      /*
       * Away team owns the power play.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (homeHasAdvantage) {
      /*
       * Away team is killing the penalty.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      awaySkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       
```

### match 5
```js

        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) +
      elapsedSeconds;

    /*
     * ==========================================================
     * TIME ON ICE
     * ==========================================================
     *
     * Credit every currently deployed player for the actual
     * elapsed hockey seconds from this simulation step.
     */
    const addTOIToDeployment =
      deployment => {
        if (
          !deployment ||
          typeof deployment !== 'object'
        ) {
          return;
        }

        const skaters =
          Array.isArray(
            deployment.skaters
          )
            ? deployment.skaters
            : [];

        skaters.forEach(
          player => {
            if (!player) {
              return;
            }

            player.timeOnIceSeconds =
              (
                Number(
                  player.timeOnIceSeconds
                ) || 0
              ) +
              elapsedSeconds;
          }
        );

        const goalie =
          deployment.goalie ||
          null;

        if (goalie) {
          goalie.timeOnIceSeconds =
            (
              Number(
                goalie.timeOnIceSeconds
              ) || 0
            ) +
            elapsedSeconds;
        }
      };

    addTOIToDeployment(
      flow.homeDeployment
    );

    addTOIToDeployment(
      flow.awayDeployment
    );

    /*
     * Penalties count down using actual hockey seconds, completely
     * independent of presentation speed.
     */
    advanceLiveGameSpecialTeamsClock(
      simulation,
      elapsedSeconds
    );

    /*
     * ==========================================================
     * PERIOD EXPIRATION
     * ==========================================================
     */
    if (
      simulation
        .clockSecondsRemaining <= 0
    ) {
      const periodEndEvent = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'period-end',

        period:
          simulation.period,

        clockSecondsRemaining: 0,

        homeScore:
          simulation.home.score,

        awayScore:
          simulation.away.score,
      };

      simulation.events.push(
        periodEndEvent
      );

      /*
       * Regulation periods 1 and 2 advance normally.
       */
      if (
        simulation.period < 3
      ) {
        simulation.period +=
          1;

        simulation.periodLabel =
          simulation.period === 2
            ? '2nd'
            : '3rd';

        simulation
          .clockSecondsRemaining =
          20 * 60;

        flow.stopped =
          true;

        flow.stoppageReason =
          'period-start';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.paceContext =
          'after-faceoff';

        flow.pressureLevel =
          0;

        flow.homeDeployment =
          null;

        flow.awayDeployment =
          null;

        flow.deploymentAgeSeconds =
          0;
      } else if (
        simulation.period === 3
      ) {
        simulation
          .regulationComplete =
          true;

        /*
         * A decisive regulation result ends immediately.
         */
        if (
          Number(
            simulation.home.score
          ) !==
          Number(
            simulation.away.score
          )
        ) {
          simulation.gameComplete =
            true;

          simulation.status =
            'completed';
        } else {
          /*
           * ======================================================
           * LIVE OVERTIME INITIALIZATION
           * ======================================================
           *
           * Regulation tie → 5-minute sudden-death overtime.
           *
           * Overtime uses period 4 and a fresh center-ice faceoff.
           */
          simulation.period =
            4;

          simulation.periodLabel =
            'OT';

          simulation
            .clockSecondsRemaining =
            5 * 60;

          simulatio
```

### match 6
```js
    'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) +
      elapsedSeconds;

    /*
     * ==========================================================
     * TIME ON ICE
     * ==========================================================
     *
     * Credit every currently deployed player for the actual
     * elapsed hockey seconds from this simulation step.
     */
    const addTOIToDeployment =
      deployment => {
        if (
          !deployment ||
          typeof deployment !== 'object'
        ) {
          return;
        }

        const skaters =
          Array.isArray(
            deployment.skaters
          )
            ? deployment.skaters
            : [];

        skaters.forEach(
          player => {
            if (!player) {
              return;
            }

            player.timeOnIceSeconds =
              (
                Number(
                  player.timeOnIceSeconds
                ) || 0
              ) +
              elapsedSeconds;
          }
        );

        const goalie =
          deployment.goalie ||
          null;

        if (goalie) {
          goalie.timeOnIceSeconds =
            (
              Number(
                goalie.timeOnIceSeconds
              ) || 0
            ) +
            elapsedSeconds;
        }
      };

    addTOIToDeployment(
      flow.homeDeployment
    );

    addTOIToDeployment(
      flow.awayDeployment
    );

    /*
     * Penalties count down using actual hockey seconds, completely
     * independent of presentation speed.
     */
    advanceLiveGameSpecialTeamsClock(
      simulation,
      elapsedSeconds
    );

    /*
     * ==========================================================
     * PERIOD EXPIRATION
     * ==========================================================
     */
    if (
      simulation
        .clockSecondsRemaining <= 0
    ) {
      const periodEndEvent = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'period-end',

        period:
          simulation.period,

        clockSecondsRemaining: 0,

        homeScore:
          simulation.home.score,

        awayScore:
          simulation.away.score,
      };

      simulation.events.push(
        periodEndEvent
      );

      /*
       * Regulation periods 1 and 2 advance normally.
       */
      if (
        simulation.period < 3
      ) {
        simulation.period +=
          1;

        simulation.periodLabel =
          simulation.period === 2
            ? '2nd'
            : '3rd';

        simulation
          .clockSecondsRemaining =
          20 * 60;

        flow.stopped =
          true;

        flow.stoppageReason =
          'period-start';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.paceContext =
          'after-faceoff';

        flow.pressureLevel =
          0;

        flow.homeDeployment =
          null;

        flow.awayDeployment =
          null;

        flow.deploymentAgeSeconds =
          0;
      } else if (
        simulation.period === 3
      ) {
        simulation
          .regulationComplete =
          true;

        /*
         * A decisive regulation result ends immediately.
         */
        if (
          Number(
            simulation.home.score
          ) !==
          Number(
            simulation.away.score
          )
        ) {
          simulation.gameComplete =
            true;

          simulation.status =
            'completed';
        } else {
          /*
           * ======================================================
           * LIVE OVERTIME INITIALIZATION
           * ======================================================
           *
           * Regulation tie → 5-minute sudden-death overtime.
           *
           * Overtime uses period 4 and a fresh center-ice faceoff.
           */
          simulation.period =
            4;

          simulation.periodLabel =
            'OT';

          simulation
            .clockSecondsRemaining =
            5 * 60;

          simulation.status =
            'overtime';

          simulation.wentT
```

### match 7
```js
       elapsedSeconds;
        }
      };

    addTOIToDeployment(
      flow.homeDeployment
    );

    addTOIToDeployment(
      flow.awayDeployment
    );

    /*
     * Penalties count down using actual hockey seconds, completely
     * independent of presentation speed.
     */
    advanceLiveGameSpecialTeamsClock(
      simulation,
      elapsedSeconds
    );

    /*
     * ==========================================================
     * PERIOD EXPIRATION
     * ==========================================================
     */
    if (
      simulation
        .clockSecondsRemaining <= 0
    ) {
      const periodEndEvent = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          'period-end',

        period:
          simulation.period,

        clockSecondsRemaining: 0,

        homeScore:
          simulation.home.score,

        awayScore:
          simulation.away.score,
      };

      simulation.events.push(
        periodEndEvent
      );

      /*
       * Regulation periods 1 and 2 advance normally.
       */
      if (
        simulation.period < 3
      ) {
        simulation.period +=
          1;

        simulation.periodLabel =
          simulation.period === 2
            ? '2nd'
            : '3rd';

        simulation
          .clockSecondsRemaining =
          20 * 60;

        flow.stopped =
          true;

        flow.stoppageReason =
          'period-start';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.paceContext =
          'after-faceoff';

        flow.pressureLevel =
          0;

        flow.homeDeployment =
          null;

        flow.awayDeployment =
          null;

        flow.deploymentAgeSeconds =
          0;
      } else if (
        simulation.period === 3
      ) {
        simulation
          .regulationComplete =
          true;

        /*
         * A decisive regulation result ends immediately.
         */
        if (
          Number(
            simulation.home.score
          ) !==
          Number(
            simulation.away.score
          )
        ) {
          simulation.gameComplete =
            true;

          simulation.status =
            'completed';
        } else {
          /*
           * ======================================================
           * LIVE OVERTIME INITIALIZATION
           * ======================================================
           *
           * Regulation tie → 5-minute sudden-death overtime.
           *
           * Overtime uses period 4 and a fresh center-ice faceoff.
           */
          simulation.period =
            4;

          simulation.periodLabel =
            'OT';

          simulation
            .clockSecondsRemaining =
            5 * 60;

          simulation.status =
            'overtime';

          simulation.wentToOvertime =
            true;

          /*
           * Reinterpret any penalties carrying over from regulation
           * using overtime manpower rules.
           *
           * Regulation 5v4 becomes OT 4v3.
           * Regulation 5v3 becomes OT 5v3.
           * No active penalties remains ordinary 3v3.
           */
          const overtimeManpowerRefresh =
            refreshLiveGameManpowerState(
              simulation
            );

          if (
            !overtimeManpowerRefresh ||
            overtimeManpowerRefresh
              .success !== true
          ) {
            return {
              success: false,

              reason:
                overtimeManpowerRefresh
                  ?.reason ||
                'overtime-manpower-refresh-failed',

              elapsedSeconds,

              event:
                periodEndEvent,

              simulation,
            };
          }

          flow.stopped =
            true;

          flow.stoppageReason =
            'overtime-start';

          flow.possessionSide =
            null;

          flow.zone =
            'neutral';

          flow.paceContext =
            'after-faceoff';

          flow.pressureLevel =
            0;

          flow.homeDeployment =
            null;

          flow.awayDeployment =
            null;

          flow.deploymentAgeSeconds =
            0;

          flow.recentPossessionTouches =
            [];
        }
      } else if (
        simulation.period === 4
      ) {
        /*
         * If overtime reaches 0:00 without a goal, the game remains
         * tied and moves to the shootout state.
         *
         * We will build the actual shootout resolver next.
         */
        simulation
          .overtimeComplete =
          true;

        simulation.status =
          'shootout-pending';

        flow.stopped =
          true;

        flow.stoppageReason =
          'overtime-ended-tied';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.pressureLevel =
          0;

        flow.recentPossessionTouches =
          [];
      }

      return {
        success: true,

        reason:
          'live-game-period-ended',

        elapsedSeconds,

        event:
          periodEndEvent,

        simulation,
      };
    }

    /*
     * ==========================================================
     * SELECT NEXT EVENT
     * ==========================================================
     */
const pendingCareerDecision =
  simulation.pendingCareerDecision &&
  typeof simulation.pendingCareerDecision === 'object'
    ? simulation.pendingCareerDecision
    : null;

simulation.pendingCareerDecision =
  null;

const selection =
  pendingCareerDecision?.action === 'shoot'
    ? {
        success: true,
        reason: 'career-decision-shoot',
        eventType: 'shot-attempt',
      }
    : pendingCareerDecision?.action === 'pass'
      ? {
          success: true,
          reason: 'career-decision-pass',
          
```

### match 8
```js
=================
           *
           * Regulation tie → 5-minute sudden-death overtime.
           *
           * Overtime uses period 4 and a fresh center-ice faceoff.
           */
          simulation.period =
            4;

          simulation.periodLabel =
            'OT';

          simulation
            .clockSecondsRemaining =
            5 * 60;

          simulation.status =
            'overtime';

          simulation.wentToOvertime =
            true;

          /*
           * Reinterpret any penalties carrying over from regulation
           * using overtime manpower rules.
           *
           * Regulation 5v4 becomes OT 4v3.
           * Regulation 5v3 becomes OT 5v3.
           * No active penalties remains ordinary 3v3.
           */
          const overtimeManpowerRefresh =
            refreshLiveGameManpowerState(
              simulation
            );

          if (
            !overtimeManpowerRefresh ||
            overtimeManpowerRefresh
              .success !== true
          ) {
            return {
              success: false,

              reason:
                overtimeManpowerRefresh
                  ?.reason ||
                'overtime-manpower-refresh-failed',

              elapsedSeconds,

              event:
                periodEndEvent,

              simulation,
            };
          }

          flow.stopped =
            true;

          flow.stoppageReason =
            'overtime-start';

          flow.possessionSide =
            null;

          flow.zone =
            'neutral';

          flow.paceContext =
            'after-faceoff';

          flow.pressureLevel =
            0;

          flow.homeDeployment =
            null;

          flow.awayDeployment =
            null;

          flow.deploymentAgeSeconds =
            0;

          flow.recentPossessionTouches =
            [];
        }
      } else if (
        simulation.period === 4
      ) {
        /*
         * If overtime reaches 0:00 without a goal, the game remains
         * tied and moves to the shootout state.
         *
         * We will build the actual shootout resolver next.
         */
        simulation
          .overtimeComplete =
          true;

        simulation.status =
          'shootout-pending';

        flow.stopped =
          true;

        flow.stoppageReason =
          'overtime-ended-tied';

        flow.possessionSide =
          null;

        flow.zone =
          'neutral';

        flow.pressureLevel =
          0;

        flow.recentPossessionTouches =
          [];
      }

      return {
        success: true,

        reason:
          'live-game-period-ended',

        elapsedSeconds,

        event:
          periodEndEvent,

        simulation,
      };
    }

    /*
     * ==========================================================
     * SELECT NEXT EVENT
     * ==========================================================
     */
const pendingCareerDecision =
  simulation.pendingCareerDecision &&
  typeof simulation.pendingCareerDecision === 'object'
    ? simulation.pendingCareerDecision
    : null;

simulation.pendingCareerDecision =
  null;

const selection =
  pendingCareerDecision?.action === 'shoot'
    ? {
        success: true,
        reason: 'career-decision-shoot',
        eventType: 'shot-attempt',
      }
    : pendingCareerDecision?.action === 'pass'
      ? {
          success: true,
          reason: 'career-decision-pass',
          eventType: 'career-pass',
        }
      : selectNextLiveGameEventType(
          simulation
        );

    if (
      !selection ||
      selection.success !== true
    ) {
      return {
        success: false,
        reason:
          selection?.reason ||
          'live-game-event-selection-failed',
        elapsedSeconds,
        event: null,
      };
    }

    let resolution = null;

    switch (
      selection.eventType
    ) {
      case 'shot-attempt':
        resolution =
resolveLiveGameShotAttempt(
  simulation,
  pendingCareerDecision?.action === 'shoot'
    ? pendingCareerDecision.playerId
    : null
);
        break;

case 'career-pass':
  resolution =
    resolveLiveGameCareerPass(
      simulation,
      pendingCareerDecision?.playerId || null
    );
  break;

      case 'hit':
        resolution =
          resolveLiveGameHit(
            simulation
          );
        break;

      case 'turnover':
        resolution =
          resolveLiveGameTurnover(
            simulation
          );
        break;

      case 'penalty':
        resolution =
          resolveLiveGamePenalty(
            simulation
          );
        break;

      case 'possession-advance':
        resolution =
          resolveLiveGamePossessionAdvance(
            simulation
          );
        break;

      /*
       * A generic stoppage creates a whistle and forces the next
       * step to resolve a faceoff at the same game-clock time.
       */
      case 'stoppage': {
        flow.stopped =
          true;

        flow.stoppageReason =
          'general-stoppage';

        flow.paceContext =
          'after-faceoff';

        flow.pressureLevel =
          0;

        const event = {
          id:
            `live-event-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,

          type:
            'stoppage',

          period:
            simulation.period,

          clockSecondsRemaining:
            simulation
              .clockSecondsRemaining,

          side:
            flow.possessionSide,

          zone:
            flow.zone,
        };

        simulation.events.push(
          event
        );

        resolution = {
          success: true,
          reason:
            'live-game-stoppage-resolved',
          event,
        };

        break;
      }

      /*
       * Quiet play burns clock and changes context without adding
       * a visible event-feed item.
       */
      case 'quiet-play':
```

## forwardLine

### match 1
```js
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit alr
```

### match 2
```js
katers
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const pow
```

### match 3
```js
wardLine
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      const fullPowerPlayUnit =
        [
          slots.leftFlank,
          slots.bumper,
          slots.rightFlank,
          slots.netFront,
          slots.quarterback,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * 4-on-3:
       * keep three primary skill forwards plus the quarterback.
       *
       * Full 5-on-4 / 5-on-3:
       * use the complete PP unit.
       */
      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.rightFlank,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else if (
        requestedSkaterCount === 3
      ) {
        /*
         * Defensive fallback only; normal PP rules should not request
         * three attacking skaters.
         */
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPowerPlayUnit;
      }
    }

    /*
     * ==========================================================
     * PENALTY KILL
     * ==========================================================
     *
     * Uses the exact coach-selected PK1 / PK2 unit.
     */
    if (
      situation ===
      'penalty-kill'
    ) {
      const penaltyKillUnit =
 
```

### match 4
```js
 deployedSkaters.length <
      targetSkaterCount
    ) {
      const fallbackCandidates =
        skaters
          .filter(
            player =>
              player &&
              !deployedPlayerIds.has(
                String(
                  player.playerId
                )
              )
          )
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

      const missingSkaters =
        targetSkaterCount -
        deployedSkaters.length;

      const replacements =
        fallbackCandidates.slice(
          0,
          missingSkaters
        );

      deployedSkaters.push(
        ...replacements
      );

      replacements.forEach(
        player => {
          deployedPlayerIds.add(
            String(
              player.playerId
            )
          );
        }
      );
    }

    /*
     * Remove accidental duplicate player IDs.
     */
    const uniquePlayers = [];

    const usedPlayerIds =
      new Set();

    deployedSkaters.forEach(
      player => {
        const playerId =
          String(
            player.playerId ||
            ''
          );

        if (
          !playerId ||
          usedPlayerIds.has(
            playerId
          )
        ) {
          return;
        }

        usedPlayerIds.add(
          playerId
        );

        uniquePlayers.push(
          player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STRENGTH DEPLOYMENT ROTATION
   * ============================================================
   *
   * Selects a forward line and defense pair for the next stretch
   * of even-strength play.
   *
   * The weights approximate normal hockey usage without giving
   * the career player any artificial preference.
   */
  function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
 
```

### match 5
```js
       String(
            player.playerId ||
            ''
          );

        if (
          !playerId ||
          usedPlayerIds.has(
            playerId
          )
        ) {
          return;
        }

        usedPlayerIds.add(
          playerId
        );

        uniquePlayers.push(
          player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STRENGTH DEPLOYMENT ROTATION
   * ============================================================
   *
   * Selects a forward line and defense pair for the next stretch
   * of even-strength play.
   *
   * The weights approximate normal hockey usage without giving
   * the career player any artificial preference.
   */
  function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) 
```

### match 6
```js
 }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForw
```

### match 7
```js
  side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
  
```

### match 8
```js
  };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine
```

### match 9
```js
       weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-p
```

### match 10
```js
;

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        dep
```

### match 11
```js
            0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }

    return {
      success: true,

      reason:
        'overtime-deployment-selected',

      side,

      deployment: {
        success: true,
        situation:
          'overtime',

        skaters:
          overtimeSkaters,

        goalie,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOOTOUT RESOLUTION
   * ===================================
```

### match 12
```js
  Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }

    return {
      success: true,

      reason:
        'overtime-deployment-selected',

      side,

      deployment: {
        success: true,
        situation:
          'overtime',

        skaters:
          overtimeSkaters,

        goalie,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOOTOUT RESOLUTION
   * ============================================================
   
```

## defensePair

### match 1
```js
===================================
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams

```

### match 2
```js
====================
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const
```

### match 3
```js
 =
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      const fullPowerPlayUnit =
        [
          slots.leftFlank,
          slots.bumper,
          slots.rightFlank,
          slots.netFront,
          slots.quarterback,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * 4-on-3:
       * keep three primary skill forwards plus the quarterback.
       *
       * Full 5-on-4 / 5-on-3:
       * use the complete PP unit.
       */
      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.rightFlank,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else if (
        requestedSkaterCount === 3
      ) {
        /*
         * Defensive fallback only; normal PP rules should not request
         * three attacking skaters.
         */
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPowerPlayUnit;
      }
    }

    /*
     * ==========================================================
     * PENALTY KILL
     * ==========================================================
     *
     * Uses the exact coach-selected PK1 / PK2 unit.
     */
    if (
      situation ===
      'penalty-kill'
    ) {
      const penaltyKillUnit =
        canonicalTeam
          .specialTeams
          ?.penaltyKill
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        penaltyKillUnit?.slots ||
        {};

      const fullPenaltyKillUni
```

### match 4
```js
gth <
      targetSkaterCount
    ) {
      const fallbackCandidates =
        skaters
          .filter(
            player =>
              player &&
              !deployedPlayerIds.has(
                String(
                  player.playerId
                )
              )
          )
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

      const missingSkaters =
        targetSkaterCount -
        deployedSkaters.length;

      const replacements =
        fallbackCandidates.slice(
          0,
          missingSkaters
        );

      deployedSkaters.push(
        ...replacements
      );

      replacements.forEach(
        player => {
          deployedPlayerIds.add(
            String(
              player.playerId
            )
          );
        }
      );
    }

    /*
     * Remove accidental duplicate player IDs.
     */
    const uniquePlayers = [];

    const usedPlayerIds =
      new Set();

    deployedSkaters.forEach(
      player => {
        const playerId =
          String(
            player.playerId ||
            ''
          );

        if (
          !playerId ||
          usedPlayerIds.has(
            playerId
          )
        ) {
          return;
        }

        usedPlayerIds.add(
          playerId
        );

        uniquePlayers.push(
          player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STRENGTH DEPLOYMENT ROTATION
   * ============================================================
   *
   * Selects a forward line and defense pair for the next stretch
   * of even-strength play.
   *
   * The weights approximate normal hockey usage without giving
   * the career player any artificial preference.
   */
  function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
```

### match 5
```js
 player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STRENGTH DEPLOYMENT ROTATION
   * ============================================================
   *
   * Selects a forward line and defense pair for the next stretch
   * of even-strength play.
   *
   * The weights approximate normal hockey usage without giving
   * the career player any artificial preference.
   */
  function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
```

### match 6
```js
  success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman 
```

### match 7
```js
  'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    
```

### match 8
```js
ard usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.start
```

### match 9
```js
ir usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }
```

### match 10
```js
st defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }

    return {
      success: tru
```

### match 11
```js
   option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }

    return {
      success: true,

      reason:
        'overtime-deployment-selected',

      side,

      deployment: {
        success: true,
        situation:
          'overtime',

        skaters:
          overtimeSkaters,

        goalie,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOOTOUT RESOLUTION
   * ============================================================
   *
   * Three-round shooto
```

### match 12
```js
    ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLiveGameOvertimeDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      (
        side !== 'home' &&
        side !== 'away'
      )
    ) {
      return {
        success: false,
        reason:
          'invalid-overtime-deployment-input',
        deployment: null,
      };
    }

    const teamState =
      side === 'home'
        ? simulation.home
        : simulation.away;

    const skaters =
      Array.isArray(
        teamState?.skaters
      )
        ? teamState.skaters
        : [];

    const goalies =
      Array.isArray(
        teamState?.goalies
      )
        ? teamState.goalies
        : [];

    const forwards =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'forward'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const defensemen =
      skaters
        .filter(
          player =>
            player
              ?.lineupAssignment
              ?.unit === 'defense'
        )
        .sort(
          (
            firstPlayer,
            secondPlayer
          ) => {
            const firstCanonical =
              getPlayerById(
                firstPlayer.playerId
              );

            const secondCanonical =
              getPlayerById(
                secondPlayer.playerId
              );

            return (
              (
                Number(
                  secondCanonical
                    ?.overall
                ) ||
                Number(
                  secondPlayer.overall
                ) ||
                50
              ) -
              (
                Number(
                  firstCanonical
                    ?.overall
                ) ||
                Number(
                  firstPlayer.overall
                ) ||
                50
              )
            );
          }
        );

    const selectedForwards =
      forwards.slice(
        0,
        2
      );

    const selectedDefenseman =
      defensemen[0] ||
      null;

    const goalie =
      goalies.find(
        goalieLine =>
          goalieLine.started === true
      ) ||
      goalies[0] ||
      null;

    const overtimeSkaters = [
      ...selectedForwards,
      selectedDefenseman,
    ].filter(Boolean);

    if (
      overtimeSkaters.length < 3 ||
      !goalie
    ) {
      return {
        success: false,
        reason:
          'overtime-deployment-participants-missing',
        deployment: null,
      };
    }

    return {
      success: true,

      reason:
        'overtime-deployment-selected',

      side,

      deployment: {
        success: true,
        situation:
          'overtime',

        skaters:
          overtimeSkaters,

        goalie,
      },
    };
  }

  /*
   * ============================================================
   * LIVE GAME — SHOOTOUT RESOLUTION
   * ============================================================
   *
   * Three-round shootout followed by sudden death i
```

## specialTeamsUnit

### match 1
```js
ng an active penalty is ineligible
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      c
```

### match 2
```js
tomatically to:
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      const fullPowerPlayUnit =
        [
          slots.leftFlank,
          slots.bumper,
          slots.rightFlank,
          slo
```

### match 3
```js
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
            2
          ),
          ...sortedDefensemen.slice(
            0,
            1
          ),
        ];
      } else {
        deployedSkaters = [
          ...forwards,
          ...defensemen,
        ];
      }
    }

    /*
     * ==========================================================
     * POWER PLAY
     * ==========================================================
     *
     * Uses the exact coach-selected PP1 / PP2 unit already saved
     * on the team.
     */
    if (
      situation ===
      'power-play'
    ) {
      const powerPlayUnit =
        canonicalTeam
          .specialTeams
          ?.powerPlay
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      const fullPowerPlayUnit =
        [
          slots.leftFlank,
          slots.bumper,
          slots.rightFlank,
          slots.netFront,
          slots.quarterback,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * 4-on-3:
       * keep three primary skill forwards plus the quarterback.
       *
       * Full 5-on-4 / 5-on-3:
       * use the complete PP unit.
       */
      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.rightFlank,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else if (
        requestedSkaterCount === 3
      ) {
        /*
         * Defensive fallback only; normal PP rules should not request
         * three attacking skaters.
         */
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPowerPlayUnit;
      }
    }

    /*
     * ==========================================================
     * PENALTY KILL
     * ==========================================================
     *
     * Uses the exact coach-selected PK1 / PK2 unit.
     */
    if (
      situation ===
      'penalty-kill'
    ) {
      const penaltyKillUnit =
        canonicalTeam
          .specialTeams
          ?.penaltyKill
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        penaltyKillUnit?.slots ||
        {};

      const fullPenaltyKillUnit =
        [
          slots.forward1,
          slots.forward2,
          slots.defense1,
          slots.defense2,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * Three-man PK:
       * one forward + two defensemen.
       *
       * This is used for both:
       *   regulation 5-on-3
       *   overtime 4-on-3 / 5-on-3
       */
      if (
        requestedSkaterCount === 3
      ) {
        deployedSkaters =
          [
            slots.forward1,
            slots.defense1,
            slots.defense2,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPenaltyKillUnit;
      }
    }

    /*
     * ==========================================================
     * ELIGIBLE DEPLOYMENT FALLBACK
     * ==========================================================
     *
     * A saved line or special-teams unit can contain a player who
     * is currently serving a penalty.
     *
     * Keep every eligible player from the coach-selected unit, then
     * fill only the missing spots from the best eligible remaining
     * skaters.
     *
     * This prevents situations such as a three-man PK accidentally
     * deploying only two players because one PK1 member is in the
     * penalty box.
     */
    const targetSkaterCount =
      requestedSkaterCount !== null
        ? requestedSkaterCount
        : (
            situation ===
              'penalty-kill'
              ? 4
              : 5
          );

    const deployedPlayerIds =
      new Set(
        deployedSkaters
          .filter(Boolean)
          .map(
            player =>
              String(
                player.playerId
              )
          )
      );

    if (
      deployedSkaters.length <
      targetSkaterCount
    ) {
      const fallbackCandidates =
        skaters
          .filter(
            player =>
              player &&
              !deployedPlayerIds.has(
                String(
                  player.playerId
                )
              )
          )
          .sort(
            (
              firstPlayer,
              secondPlayer
            ) =>
      
```

### match 4
```js
         specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        powerPlayUnit?.slots ||
        {};

      const fullPowerPlayUnit =
        [
          slots.leftFlank,
          slots.bumper,
          slots.rightFlank,
          slots.netFront,
          slots.quarterback,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * 4-on-3:
       * keep three primary skill forwards plus the quarterback.
       *
       * Full 5-on-4 / 5-on-3:
       * use the complete PP unit.
       */
      if (
        requestedSkaterCount === 4
      ) {
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.rightFlank,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else if (
        requestedSkaterCount === 3
      ) {
        /*
         * Defensive fallback only; normal PP rules should not request
         * three attacking skaters.
         */
        deployedSkaters =
          [
            slots.leftFlank,
            slots.bumper,
            slots.quarterback,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPowerPlayUnit;
      }
    }

    /*
     * ==========================================================
     * PENALTY KILL
     * ==========================================================
     *
     * Uses the exact coach-selected PK1 / PK2 unit.
     */
    if (
      situation ===
      'penalty-kill'
    ) {
      const penaltyKillUnit =
        canonicalTeam
          .specialTeams
          ?.penaltyKill
          ?.[
            specialTeamsUnit - 1
          ] ||
        null;

      const slots =
        penaltyKillUnit?.slots ||
        {};

      const fullPenaltyKillUnit =
        [
          slots.forward1,
          slots.forward2,
          slots.defense1,
          slots.defense2,
        ]
          .map(
            findSkaterById
          )
          .filter(Boolean);

      /*
       * Three-man PK:
       * one forward + two defensemen.
       *
       * This is used for both:
       *   regulation 5-on-3
       *   overtime 4-on-3 / 5-on-3
       */
      if (
        requestedSkaterCount === 3
      ) {
        deployedSkaters =
          [
            slots.forward1,
            slots.defense1,
            slots.defense2,
          ]
            .map(
              findSkaterById
            )
            .filter(Boolean);
      } else {
        deployedSkaters =
          fullPenaltyKillUnit;
      }
    }

    /*
     * ==========================================================
     * ELIGIBLE DEPLOYMENT FALLBACK
     * ==========================================================
     *
     * A saved line or special-teams unit can contain a player who
     * is currently serving a penalty.
     *
     * Keep every eligible player from the coach-selected unit, then
     * fill only the missing spots from the best eligible remaining
     * skaters.
     *
     * This prevents situations such as a three-man PK accidentally
     * deploying only two players because one PK1 member is in the
     * penalty box.
     */
    const targetSkaterCount =
      requestedSkaterCount !== null
        ? requestedSkaterCount
        : (
            situation ===
              'penalty-kill'
              ? 4
              : 5
          );

    const deployedPlayerIds =
      new Set(
        deployedSkaters
          .filter(Boolean)
          .map(
            player =>
              String(
                player.playerId
              )
          )
      );

    if (
      deployedSkaters.length <
      targetSkaterCount
    ) {
      const fallbackCandidates =
        skaters
          .filter(
            player =>
              player &&
              !deployedPlayerIds.has(
                String(
                  player.playerId
                )
              )
          )
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

      const missingSkaters =
        targetSkaterCount -
        deployedSkaters.length;

      const replacements =
        fallbackCandidates.slice(
          0,
          missingSkaters
        );

      deployedSkaters.push(
        ...replacements
      );

      replacements.forEach(
        player => {
          deployedPlayerIds.add(
            String(
              player.playerId
            )
          );
        }
      );
    }

    /*
     * Remove accidental duplicate player IDs.
     */
    const uniquePlayers = [];

    const usedPlayerIds =
      new Set();

    deployedSkaters.forEach(
      player => {
        const playerId =
          String(
            player.playerId ||
            ''
          );

        if (
          !playerId ||
          usedPlayerIds.has(
            playerId
          )
        ) {
          return;
        }

        usedPlayerIds.add(
          playerId
        );

        uniquePlayers.push(
          player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STR
```

### match 5
```js
aterCount
    ) {
      const fallbackCandidates =
        skaters
          .filter(
            player =>
              player &&
              !deployedPlayerIds.has(
                String(
                  player.playerId
                )
              )
          )
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

      const missingSkaters =
        targetSkaterCount -
        deployedSkaters.length;

      const replacements =
        fallbackCandidates.slice(
          0,
          missingSkaters
        );

      deployedSkaters.push(
        ...replacements
      );

      replacements.forEach(
        player => {
          deployedPlayerIds.add(
            String(
              player.playerId
            )
          );
        }
      );
    }

    /*
     * Remove accidental duplicate player IDs.
     */
    const uniquePlayers = [];

    const usedPlayerIds =
      new Set();

    deployedSkaters.forEach(
      player => {
        const playerId =
          String(
            player.playerId ||
            ''
          );

        if (
          !playerId ||
          usedPlayerIds.has(
            playerId
          )
        ) {
          return;
        }

        usedPlayerIds.add(
          playerId
        );

        uniquePlayers.push(
          player
        );
      }
    );

    return {
      success: true,

      reason:
        'live-game-deployment-resolved',

      side,

      situation,

      forwardLine,

      defensePair,

      specialTeamsUnit,

      skaters:
        uniquePlayers,

      goalie:
        starter,

      players:
        starter
          ? [
              ...uniquePlayers,
              starter,
            ]
          : [
              ...uniquePlayers,
            ],
    };
  }

  /*
   * ============================================================
   * LIVE GAME — EVEN-STRENGTH DEPLOYMENT ROTATION
   * ============================================================
   *
   * Selects a forward line and defense pair for the next stretch
   * of even-strength play.
   *
   * The weights approximate normal hockey usage without giving
   * the career player any artificial preference.
   */
  function selectLiveGameEvenStrengthDeployment(
    simulation,
    side
  ) {
    if (
      !simulation ||
      typeof simulation !== 'object'
    ) {
      return {
        success: false,
        reason:
          'invalid-live-game',
        deployment: null,
      };
    }

    if (
      side !== 'home' &&
      side !== 'away'
    ) {
      return {
        success: false,
        reason:
          'invalid-team-side',
        deployment: null,
      };
    }

    /*
     * Forward usage targets.
     *
     * These are relative weights, not exact TOI percentages.
     */
    const forwardLineWeights = [
      {
        line: 1,
        weight: 34,
      },
      {
        line: 2,
        weight: 28,
      },
      {
        line: 3,
        weight: 22,
      },
      {
        line: 4,
        weight: 16,
      },
    ];

    /*
     * Defensive-pair usage targets.
     */
    const defensePairWeights = [
      {
        pair: 1,
        weight: 42,
      },
      {
        pair: 2,
        weight: 34,
      },
      {
        pair: 3,
        weight: 24,
      },
    ];

    const weightedPick =
      weightedOptions => {
        const totalWeight =
          weightedOptions.reduce(
            (sum, option) =>
              sum +
              Math.max(
                0,
                Number(
                  option.weight
                ) || 0
              ),
            0
          );

        if (totalWeight <= 0) {
          return (
            weightedOptions[0] ||
            null
          );
        }

        let roll =
          Math.random() *
          totalWeight;

        for (
          const option of
          weightedOptions
        ) {
          roll -=
            Math.max(
              0,
              Number(
                option.weight
              ) || 0
            );

          if (roll <= 0) {
            return option;
          }
        }

        return (
          weightedOptions[
            weightedOptions.length - 1
          ] ||
          null
        );
      };

    const selectedForwardLine =
      weightedPick(
        forwardLineWeights
      );

    const selectedDefensePair =
      weightedPick(
        defensePairWeights
      );

    if (
      !selectedForwardLine ||
      !selectedDefensePair
    ) {
      return {
        success: false,
        reason:
          'deployment-selection-failed',
        deployment: null,
      };
    }

    const deployment =
      getLiveGameOnIcePlayers(
        simulation,
        side,
        {
          situation:
            'even-strength',

          forwardLine:
            selectedForwardLine.line,

          defensePair:
            selectedDefensePair.pair,
        }
      );

    if (
      !deployment ||
      deployment.success !== true
    ) {
      return {
        success: false,
        reason:
          'deployment-resolution-failed',
        deployment:
          deployment || null,
      };
    }

    return {
      success: true,

      reason:
        'even-strength-deployment-selected',

      side,

      forwardLine:
        selectedForwardLine.line,

      defensePair:
        selectedDefensePair.pair,

      deployment,
    };
  }

  /*
   * ============================================================
   * LIVE GAME — OVERTIME DEPLOYMENT
   * ============================================================
   *
   * Selects a 3-on-3 group:
   * two forwards
   * one defenseman
   * one goalie
   */
  function selectLi
```

### match 6
```js
====================================================
     * MANPOWER-AWARE DEPLOYMENT
     * ==========================================================
     *
     * The authoritative manpower counts live in:
     *
     *   specialTeams.homeSkaters
     *   specialTeams.awaySkaters
     *
     * This turns those state values into the actual players on
     * the ice.
     *
     * Supported regulation states:
     *   5v5
     *   5v4
     *   5v3
     *   4v4
     *   4v3
     *   3v3
     *
     * Supported overtime states:
     *   3v3
     *   4v3
     *   5v3
     */
    const specialTeams =
      simulation.specialTeams ||
      {};

    const homeSkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.homeSkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const awaySkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.awaySkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const homeHasAdvantage =
      homeSkaterCount >
      awaySkaterCount;

    const awayHasAdvantage =
      awaySkaterCount >
      homeSkaterCount;

    /*
     * ========================================================
     * HOME DEPLOYMENT
     * ========================================================
     */
    let homeManpowerDeployment =
      null;

    if (homeHasAdvantage) {
      /*
       * Home team owns the power play.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (awayHasAdvantage) {
      /*
       * Home team is killing the penalty.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.homeDeployment
                ?.defensePair ||
              1,

            skaterCount:
              homeSkaterCount,
          }
        );
    }

    /*
     * ========================================================
     * AWAY DEPLOYMENT
     * ========================================================
     */
    let awayManpowerDeployment =
      null;

    if (awayHasAdvantage) {
      /*
       * Away team owns the power play.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (homeHasAdvantage) {
      /*
       * Away team is killing the penalty.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      awaySkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
     
```

### match 7
```js
   * Supported regulation states:
     *   5v5
     *   5v4
     *   5v3
     *   4v4
     *   4v3
     *   3v3
     *
     * Supported overtime states:
     *   3v3
     *   4v3
     *   5v3
     */
    const specialTeams =
      simulation.specialTeams ||
      {};

    const homeSkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.homeSkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const awaySkaterCount =
      Math.max(
        3,
        Math.min(
          5,
          Number(
            specialTeams.awaySkaters
          ) ||
          (
            isOvertime
              ? 3
              : 5
          )
        )
      );

    const homeHasAdvantage =
      homeSkaterCount >
      awaySkaterCount;

    const awayHasAdvantage =
      awaySkaterCount >
      homeSkaterCount;

    /*
     * ========================================================
     * HOME DEPLOYMENT
     * ========================================================
     */
    let homeManpowerDeployment =
      null;

    if (homeHasAdvantage) {
      /*
       * Home team owns the power play.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (awayHasAdvantage) {
      /*
       * Home team is killing the penalty.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.homeDeployment
                ?.defensePair ||
              1,

            skaterCount:
              homeSkaterCount,
          }
        );
    }

    /*
     * ========================================================
     * AWAY DEPLOYMENT
     * ========================================================
     */
    let awayManpowerDeployment =
      null;

    if (awayHasAdvantage) {
      /*
       * Away team owns the power play.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (homeHasAdvantage) {
      /*
       * Away team is killing the penalty.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      awaySkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) +
      elapsedSeconds;

    /*
     * ==========================================================
     * TIME ON ICE
     * ==========================================================
     *
     * Credit every currently deployed player for the actual
     * elapsed hockey seconds from this simulation 
```

### match 8
```js
        simulation,
          'home',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (awayHasAdvantage) {
      /*
       * Home team is killing the penalty.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.homeDeployment
                ?.defensePair ||
              1,

            skaterCount:
              homeSkaterCount,
          }
        );
    }

    /*
     * ========================================================
     * AWAY DEPLOYMENT
     * ========================================================
     */
    let awayManpowerDeployment =
      null;

    if (awayHasAdvantage) {
      /*
       * Away team owns the power play.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (homeHasAdvantage) {
      /*
       * Away team is killing the penalty.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      awaySkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) +
      elapsedSeconds;

    /*
     * ==========================================================
     * TIME ON ICE
     * ==========================================================
     *
     * Credit every currently deployed player for the actual
     * elapsed hockey seconds from this simulation step.
     */
    const addTOIToDeployment =
      deployment => {
        if (
          !deployment ||
          typeof deployment !== 'object'
        ) {
          return;
        }

        const skaters =
          Array.isArray(
            deployment.skaters
          )
            ? deployment.skaters
            : [];

        skaters.forEach(
          player => {
            if (!player) {
              return;
            }

            player.timeOnIceSeconds =
              (
                Number(
                  player.timeOnIceSeconds
                ) || 0
              ) +
              elapsedSeconds;
          }
        );

        const goalie =
          deployment.goalie ||
          null;

        if (goalie) {
          goalie.timeOnIceSeconds =
            (
              Number(
                goalie.timeOnIceSeconds
              ) || 0
            ) +
            elapsedSeconds;
        }
      };

    addTOIToDeployment(
      flow.homeDeployment
    );

    addTOIToDeployment(
      flow.awayDeployment
    );

    /*
     * Penalties count down using actual hockey seconds, completely
     * independent of presentation speed.
     */
    advanceLiveGameSpecialTeamsClock(
      simulation,
      elapsedSeconds
    );

    /*
     * ===================
```

### match 9
```js
      simulation,
          'home',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              homeSkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      homeSkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       *
       * Preserve the line/pair already selected for this shift.
       */
      homeManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'home',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.homeDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.homeDeployment
                ?.defensePair ||
              1,

            skaterCount:
              homeSkaterCount,
          }
        );
    }

    /*
     * ========================================================
     * AWAY DEPLOYMENT
     * ========================================================
     */
    let awayManpowerDeployment =
      null;

    if (awayHasAdvantage) {
      /*
       * Away team owns the power play.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'power-play',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (homeHasAdvantage) {
      /*
       * Away team is killing the penalty.
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'penalty-kill',

            specialTeamsUnit: 1,

            skaterCount:
              awaySkaterCount,
          }
        );
    } else if (
      !isOvertime &&
      awaySkaterCount < 5
    ) {
      /*
       * Reduced even-strength regulation hockey:
       *
       * 4v4
       * 3v3
       */
      awayManpowerDeployment =
        getLiveGameOnIcePlayers(
          simulation,
          'away',
          {
            situation:
              'even-strength',

            forwardLine:
              flow.awayDeployment
                ?.forwardLine ||
              1,

            defensePair:
              flow.awayDeployment
                ?.defensePair ||
              1,

            skaterCount:
              awaySkaterCount,
          }
        );
    }

    /*
     * Only replace the normal shift deployment when a manpower
     * resolver actually produced a valid deployment.
     *
     * Ordinary 5v5 regulation and ordinary 3v3 overtime continue
     * using the deployments selected earlier in this step.
     */
    if (
      homeManpowerDeployment
        ?.success === true
    ) {
      flow.homeDeployment =
        homeManpowerDeployment;
    }

    if (
      awayManpowerDeployment
        ?.success === true
    ) {
      flow.awayDeployment =
        awayManpowerDeployment;
    }

    /*
     * ==========================================================
     * EVENT TIMING
     * ==========================================================
     */
    const timing =
      scheduleNextLiveGameEventTime(
        simulation,
        {
          paceContext:
            flow.paceContext ||
            'normal',
        }
      );

    if (
      !timing ||
      timing.success !== true
    ) {
      return {
        success: false,
        reason:
          timing?.reason ||
          'live-game-event-time-failed',
        event: null,
      };
    }

    const elapsedSeconds =
      Math.max(
        0,
        Number(
          timing.elapsedSeconds
        ) || 0
      );

    simulation
      .clockSecondsRemaining =
      timing
        .nextClockSecondsRemaining;

    flow.deploymentAgeSeconds =
      (
        Number(
          flow.deploymentAgeSeconds
        ) || 0
      ) +
      elapsedSeconds;

    /*
     * ==========================================================
     * TIME ON ICE
     * ==========================================================
     *
     * Credit every currently deployed player for the actual
     * elapsed hockey seconds from this simulation step.
     */
    const addTOIToDeployment =
      deployment => {
        if (
          !deployment ||
          typeof deployment !== 'object'
        ) {
          return;
        }

        const skaters =
          Array.isArray(
            deployment.skaters
          )
            ? deployment.skaters
            : [];

        skaters.forEach(
          player => {
            if (!player) {
              return;
            }

            player.timeOnIceSeconds =
              (
                Number(
                  player.timeOnIceSeconds
                ) || 0
              ) +
              elapsedSeconds;
          }
        );

        const goalie =
          deployment.goalie ||
          null;

        if (goalie) {
          goalie.timeOnIceSeconds =
            (
              Number(
                goalie.timeOnIceSeconds
              ) || 0
            ) +
            elapsedSeconds;
        }
      };

    addTOIToDeployment(
      flow.homeDeployment
    );

    addTOIToDeployment(
      flow.awayDeployment
    );

    /*
     * Penalties count down using actual hockey seconds, completely
     * independent of presentation speed.
     */
    advanceLiveGameSpecialTeamsClock(
      simulation,
      elapsedSeconds
    );

    /*
     * ==========================================================
     * PERIOD EXPIRATION
     * ==========================================================
     */
    if (
      simulation
        .clockSecondsRemaining <= 0
    ) {
      const periodEndEvent = {
        id:
          `live-event-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
       
```

### match 10
```js
player.teamName = team.teamName;

      return player;
    });

    const skaters = roster.filter(player => player.position !== 'G');

    skaters
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3)
      .forEach((player, index) => {
        if (index === 0) player.captain = true;
        if (index === 1 || index === 2) player.alternateCaptain = true;
      });

    return assignUniqueJerseyNumbers(roster);
  }

  function ensureGeneratedRosters() {
    const teams = WorldEngine.state.teams || [];

    teams.forEach(team => {
      const seedTeam = SEED_TEAMS.find(
        seed => seed.teamId === team.teamId
      );

      // Add newer static team data to older saved worlds.
      if (seedTeam) {
        if (!team.coach && seedTeam.coach) {
          team.coach = { ...seedTeam.coach };
        }

        if (
          team.coach &&
          seedTeam.coach?.deploymentPreferences &&
          (
            !team.coach.deploymentPreferences ||
            typeof team.coach.deploymentPreferences !== 'object'
          )
        ) {
          team.coach.deploymentPreferences = {
            ...seedTeam.coach.deploymentPreferences
          };
        }

        if (!team.arena && seedTeam.arena) {
          team.arena = { ...seedTeam.arena };
        }
      }

      // Generate a roster only when one does not already exist.
      if (!Array.isArray(team.roster) || team.roster.length !== 20) {
        team.roster = generateTeamRoster(team);
      }

      /*
       * Migrate every team to the permanent special-teams
       * deployment structure without overwriting assignments
       * that already exist.
       */
      if (
        !team.specialTeams ||
        typeof team.specialTeams !== 'object'
      ) {
        team.specialTeams =
          createEmptySpecialTeamsUnits();
      }

      if (
        !Array.isArray(team.specialTeams.powerPlay)
      ) {
        team.specialTeams.powerPlay =
          createEmptySpecialTeamsUnits().powerPlay;
      }

      if (
        !Array.isArray(team.specialTeams.penaltyKill)
      ) {
        team.specialTeams.penaltyKill =
          createEmptySpecialTeamsUnits().penaltyKill;
      }
      // Migrate older saved roster players that were created before attributes existed.
      team.roster.forEach(player => {
        if (!player.archetype) {
          const archetypes =
            PLAYER_ARCHETYPES[player.position] || ['Balanced'];

          player.archetype =
            archetypes[Math.floor(Math.random() * archetypes.length)];
        }

        const normalizedPosition =
          normalizeAttributePosition(
            player.position
          );

        const isGoalie =
          normalizedPosition === 'G';

        const hasGoalieAttributes =
          player.attributes &&
          GOALIE_ATTRIBUTE_KEYS.every(
            key =>
              typeof player.attributes[key] ===
              'number'
          );

        if (
          isGoalie &&
          !hasGoalieAttributes
        ) {
          /*
           * One-time migration for saved goalies that still
           * contain the older skater attribute schema.
           *
           * Their existing overall becomes the generation target,
           * preserving their approximate ability while replacing
           * irrelevant shooting/faceoff ratings with goalie skills.
           */
          player.attributes =
            createGoalieAttributesFromOverall(
              Number(player.overall) || 60,
              player.archetype || 'Hybrid Goalie'
            );

          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel = 'goalie-v1';
        } else if (
          !isGoalie &&
          !player.attributes
        ) {
          player.attributes =
            createAttributesFromOverall(
              Number(player.overall) || 60,
              player.position,
              player.archetype
            );

          player.overall =
            calculateOverallFromAttributes(
              player.attributes,
              player.position
            );

          player.attributeModel = 'skater-v1';
        } else if (
          isGoalie &&
          hasGoalieAttributes
        ) {
          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel =
            player.attributeModel || 'goalie-v1';
        } else {
          player.attributeModel =
            player.attributeModel || 'skater-v1';
        }
        // Migrate older saved players created before NHL-style potentials existed.
        if (!player.potentialRole) {
          player.potentialRole = getPotentialRole(
            player.position,
            Math.min(99, Number(player.potential) || Number(player.overall) || 75)
          );
        }

        if (!player.potentialAccuracy) {
          player.potentialAccuracy = generatePotentialAccuracy();
        }

        /*
         * Migrate every existing saved player into the permanent
         * Player Contract without replacing current attributes,
         * statistics, identity, roster role, or progression data.
         */
        ensureCanonicalPlayerContract(player);
      });
      assignUniqueJerseyNumbers(team.roster);

      /*
       * Run the permanent roster and deployment engine for
       * every team—not only the career player's team.
       *
       * This sorts NPCs by overall within their positions,
       * sets the stronger goalie as starter, and fills
       * PP1, PP2, PK1, and PK2.
       *
       * Save once after the league-wide migration rather
       * than once for every individual team.
       */
      refreshTeamRosterManagement(
        team.teamId,
        {
          save: false,
        }
      );
    });

    save();
    
    if (
      !Array.isArray(WorldEngine.state.schedule) ||
      WorldEngine.state.schedule.length ==
```

### match 11
```js
 b) => b.overall - a.overall)
      .slice(0, 3)
      .forEach((player, index) => {
        if (index === 0) player.captain = true;
        if (index === 1 || index === 2) player.alternateCaptain = true;
      });

    return assignUniqueJerseyNumbers(roster);
  }

  function ensureGeneratedRosters() {
    const teams = WorldEngine.state.teams || [];

    teams.forEach(team => {
      const seedTeam = SEED_TEAMS.find(
        seed => seed.teamId === team.teamId
      );

      // Add newer static team data to older saved worlds.
      if (seedTeam) {
        if (!team.coach && seedTeam.coach) {
          team.coach = { ...seedTeam.coach };
        }

        if (
          team.coach &&
          seedTeam.coach?.deploymentPreferences &&
          (
            !team.coach.deploymentPreferences ||
            typeof team.coach.deploymentPreferences !== 'object'
          )
        ) {
          team.coach.deploymentPreferences = {
            ...seedTeam.coach.deploymentPreferences
          };
        }

        if (!team.arena && seedTeam.arena) {
          team.arena = { ...seedTeam.arena };
        }
      }

      // Generate a roster only when one does not already exist.
      if (!Array.isArray(team.roster) || team.roster.length !== 20) {
        team.roster = generateTeamRoster(team);
      }

      /*
       * Migrate every team to the permanent special-teams
       * deployment structure without overwriting assignments
       * that already exist.
       */
      if (
        !team.specialTeams ||
        typeof team.specialTeams !== 'object'
      ) {
        team.specialTeams =
          createEmptySpecialTeamsUnits();
      }

      if (
        !Array.isArray(team.specialTeams.powerPlay)
      ) {
        team.specialTeams.powerPlay =
          createEmptySpecialTeamsUnits().powerPlay;
      }

      if (
        !Array.isArray(team.specialTeams.penaltyKill)
      ) {
        team.specialTeams.penaltyKill =
          createEmptySpecialTeamsUnits().penaltyKill;
      }
      // Migrate older saved roster players that were created before attributes existed.
      team.roster.forEach(player => {
        if (!player.archetype) {
          const archetypes =
            PLAYER_ARCHETYPES[player.position] || ['Balanced'];

          player.archetype =
            archetypes[Math.floor(Math.random() * archetypes.length)];
        }

        const normalizedPosition =
          normalizeAttributePosition(
            player.position
          );

        const isGoalie =
          normalizedPosition === 'G';

        const hasGoalieAttributes =
          player.attributes &&
          GOALIE_ATTRIBUTE_KEYS.every(
            key =>
              typeof player.attributes[key] ===
              'number'
          );

        if (
          isGoalie &&
          !hasGoalieAttributes
        ) {
          /*
           * One-time migration for saved goalies that still
           * contain the older skater attribute schema.
           *
           * Their existing overall becomes the generation target,
           * preserving their approximate ability while replacing
           * irrelevant shooting/faceoff ratings with goalie skills.
           */
          player.attributes =
            createGoalieAttributesFromOverall(
              Number(player.overall) || 60,
              player.archetype || 'Hybrid Goalie'
            );

          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel = 'goalie-v1';
        } else if (
          !isGoalie &&
          !player.attributes
        ) {
          player.attributes =
            createAttributesFromOverall(
              Number(player.overall) || 60,
              player.position,
              player.archetype
            );

          player.overall =
            calculateOverallFromAttributes(
              player.attributes,
              player.position
            );

          player.attributeModel = 'skater-v1';
        } else if (
          isGoalie &&
          hasGoalieAttributes
        ) {
          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel =
            player.attributeModel || 'goalie-v1';
        } else {
          player.attributeModel =
            player.attributeModel || 'skater-v1';
        }
        // Migrate older saved players created before NHL-style potentials existed.
        if (!player.potentialRole) {
          player.potentialRole = getPotentialRole(
            player.position,
            Math.min(99, Number(player.potential) || Number(player.overall) || 75)
          );
        }

        if (!player.potentialAccuracy) {
          player.potentialAccuracy = generatePotentialAccuracy();
        }

        /*
         * Migrate every existing saved player into the permanent
         * Player Contract without replacing current attributes,
         * statistics, identity, roster role, or progression data.
         */
        ensureCanonicalPlayerContract(player);
      });
      assignUniqueJerseyNumbers(team.roster);

      /*
       * Run the permanent roster and deployment engine for
       * every team—not only the career player's team.
       *
       * This sorts NPCs by overall within their positions,
       * sets the stronger goalie as starter, and fills
       * PP1, PP2, PK1, and PK2.
       *
       * Save once after the league-wide migration rather
       * than once for every individual team.
       */
      refreshTeamRosterManagement(
        team.teamId,
        {
          save: false,
        }
      );
    });

    save();
    
    if (
      !Array.isArray(WorldEngine.state.schedule) ||
      WorldEngine.state.schedule.length === 0
    ) {
      WorldEngine.syncSeedTeamMetadata();

      WorldEngine.state.schedule =
        WorldEngine.createHighSchoolCareerSchedule(
          WorldEngin
```

### match 12
```js
yer.alternateCaptain = true;
      });

    return assignUniqueJerseyNumbers(roster);
  }

  function ensureGeneratedRosters() {
    const teams = WorldEngine.state.teams || [];

    teams.forEach(team => {
      const seedTeam = SEED_TEAMS.find(
        seed => seed.teamId === team.teamId
      );

      // Add newer static team data to older saved worlds.
      if (seedTeam) {
        if (!team.coach && seedTeam.coach) {
          team.coach = { ...seedTeam.coach };
        }

        if (
          team.coach &&
          seedTeam.coach?.deploymentPreferences &&
          (
            !team.coach.deploymentPreferences ||
            typeof team.coach.deploymentPreferences !== 'object'
          )
        ) {
          team.coach.deploymentPreferences = {
            ...seedTeam.coach.deploymentPreferences
          };
        }

        if (!team.arena && seedTeam.arena) {
          team.arena = { ...seedTeam.arena };
        }
      }

      // Generate a roster only when one does not already exist.
      if (!Array.isArray(team.roster) || team.roster.length !== 20) {
        team.roster = generateTeamRoster(team);
      }

      /*
       * Migrate every team to the permanent special-teams
       * deployment structure without overwriting assignments
       * that already exist.
       */
      if (
        !team.specialTeams ||
        typeof team.specialTeams !== 'object'
      ) {
        team.specialTeams =
          createEmptySpecialTeamsUnits();
      }

      if (
        !Array.isArray(team.specialTeams.powerPlay)
      ) {
        team.specialTeams.powerPlay =
          createEmptySpecialTeamsUnits().powerPlay;
      }

      if (
        !Array.isArray(team.specialTeams.penaltyKill)
      ) {
        team.specialTeams.penaltyKill =
          createEmptySpecialTeamsUnits().penaltyKill;
      }
      // Migrate older saved roster players that were created before attributes existed.
      team.roster.forEach(player => {
        if (!player.archetype) {
          const archetypes =
            PLAYER_ARCHETYPES[player.position] || ['Balanced'];

          player.archetype =
            archetypes[Math.floor(Math.random() * archetypes.length)];
        }

        const normalizedPosition =
          normalizeAttributePosition(
            player.position
          );

        const isGoalie =
          normalizedPosition === 'G';

        const hasGoalieAttributes =
          player.attributes &&
          GOALIE_ATTRIBUTE_KEYS.every(
            key =>
              typeof player.attributes[key] ===
              'number'
          );

        if (
          isGoalie &&
          !hasGoalieAttributes
        ) {
          /*
           * One-time migration for saved goalies that still
           * contain the older skater attribute schema.
           *
           * Their existing overall becomes the generation target,
           * preserving their approximate ability while replacing
           * irrelevant shooting/faceoff ratings with goalie skills.
           */
          player.attributes =
            createGoalieAttributesFromOverall(
              Number(player.overall) || 60,
              player.archetype || 'Hybrid Goalie'
            );

          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel = 'goalie-v1';
        } else if (
          !isGoalie &&
          !player.attributes
        ) {
          player.attributes =
            createAttributesFromOverall(
              Number(player.overall) || 60,
              player.position,
              player.archetype
            );

          player.overall =
            calculateOverallFromAttributes(
              player.attributes,
              player.position
            );

          player.attributeModel = 'skater-v1';
        } else if (
          isGoalie &&
          hasGoalieAttributes
        ) {
          player.overall =
            calculateGoalieOverallFromAttributes(
              player.attributes
            );

          player.attributeModel =
            player.attributeModel || 'goalie-v1';
        } else {
          player.attributeModel =
            player.attributeModel || 'skater-v1';
        }
        // Migrate older saved players created before NHL-style potentials existed.
        if (!player.potentialRole) {
          player.potentialRole = getPotentialRole(
            player.position,
            Math.min(99, Number(player.potential) || Number(player.overall) || 75)
          );
        }

        if (!player.potentialAccuracy) {
          player.potentialAccuracy = generatePotentialAccuracy();
        }

        /*
         * Migrate every existing saved player into the permanent
         * Player Contract without replacing current attributes,
         * statistics, identity, roster role, or progression data.
         */
        ensureCanonicalPlayerContract(player);
      });
      assignUniqueJerseyNumbers(team.roster);

      /*
       * Run the permanent roster and deployment engine for
       * every team—not only the career player's team.
       *
       * This sorts NPCs by overall within their positions,
       * sets the stronger goalie as starter, and fills
       * PP1, PP2, PK1, and PK2.
       *
       * Save once after the league-wide migration rather
       * than once for every individual team.
       */
      refreshTeamRosterManagement(
        team.teamId,
        {
          save: false,
        }
      );
    });

    save();
    
    if (
      !Array.isArray(WorldEngine.state.schedule) ||
      WorldEngine.state.schedule.length === 0
    ) {
      WorldEngine.syncSeedTeamMetadata();

      WorldEngine.state.schedule =
        WorldEngine.createHighSchoolCareerSchedule(
          WorldEngine.state.teams
        );
    }

    WorldEngine.save();
  }
  // ── Seed news headlines ─────────────────────────────────────
  // Stored newest-first. Future simulation system
```

## careerPlayer

### match 1
```js
atch:
          awayShots ===
          gameResult.away.shots,

        timelineMatches:
          timelineGoals ===
          expectedGoals,
      },

      totals: {
        homeGoals,
        awayGoals,
        homeShots,
        awayShots,
        timelineGoals,
        expectedGoals,
      },
    };
  }

  function resolveGameEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    /*
     * getScheduledEventsForDate() passes a normalized event
     * wrapper containing rawEvent. Use the canonical schedule
     * record when available so all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ====================================
```

### match 2
```js
     homeGoals,
        awayGoals,
        homeShots,
        awayShots,
        timelineGoals,
        expectedGoals,
      },
    };
  }

  function resolveGameEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    /*
     * getScheduledEventsForDate() passes a normalized event
     * wrapper containing rawEvent. Use the canonical schedule
     * record when available so all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game
```

### match 3
```js
    awayShots,
        timelineGoals,
        expectedGoals,
      },
    };
  }

  function resolveGameEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    /*
     * getScheduledEventsForDate() passes a normalized event
     * wrapper containing rawEvent. Use the canonical schedule
     * record when available so all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js w
```

### match 4
```js

        expectedGoals,
      },
    };
  }

  function resolveGameEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    /*
     * getScheduledEventsForDate() passes a normalized event
     * wrapper containing rawEvent. Use the canonical schedule
     * record when available so all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup scr
```

### match 5
```js
lveGameEvent(
    event,
    options = {}
  ) {
    const result =
      createEmptyEventResult();

    /*
     * getScheduledEventsForDate() passes a normalized event
     * wrapper containing rawEvent. Use the canonical schedule
     * record when available so all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup screen where
     * the user chooses Play Game or Sim Game.
   
```

### match 6
```js
all original game context is
     * preserved in the game-result contract.
     */
    const canonicalGameEvent =
      event?.rawEvent &&
      typeof event.rawEvent ===
        'object'
        ? event.rawEvent
        : event;

    /*
     * ============================================================
     * WEEKLY LIVING WORLD — AI VS AI CANONICAL RESOLUTION
     * ============================================================
     *
     * AI-vs-AI scheduled games now use the same validated live-game
     * resolver that will eventually power the visible game-day
     * experience.
     *
     * Career-player games temporarily continue through the existing
     * career-game path until the Live Game Experience is connected.
     *
     * The live resolver itself performs no permanent writes.
     * processSeasonDate() remains responsible for applying the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup screen where
     * the user chooses Play Game or Sim Game.
     */


      if (
        isCareerPlayerGame &&
        !careerGameApprovedForSim
      ) {
      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        canonicalGameEvent?.
```

### match 7
```js
ng the
     * returned canonical gameResult to the schedule, standings,
     * player stats and development systems.
     */

    const homeTeam =
      getTeamById(
        canonicalGameEvent
          ?.homeTeamId
      );

    const awayTeam =
      getTeamById(
        canonicalGameEvent
          ?.awayTeamId
      );

    const teamContainsCareerPlayer =
      team =>
        Array.isArray(
          team?.roster
        ) &&
        team.roster.some(
          player =>
            player
              ?.isCareerPlayer ===
            true
        );

    const isCareerPlayerGame =
      teamContainsCareerPlayer(
        homeTeam
      ) ||
      teamContainsCareerPlayer(
        awayTeam
      );

    const liveEngineCareerGameId =
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
      );

      /*
       * ============================================================
       * UNIVERSAL GAME SIMULATION ENGINE
       * ============================================================
       *
       * Every hockey game now uses the same canonical live-game
       * resolver:
       *
       * - Play Game presents the resolver step-by-step.
       * - Sim Game resolves the same engine immediately.
       * - Background AI games resolve the same engine immediately.
       *
       * Presentation speed must never change hockey outcomes.
       */
        if (
          !isCareerPlayerGame ||
          careerGameApprovedForLiveEngine
        ) {
        /*
         * Sim approval is single-use.
         *
         * Clear it before resolution so it can never leak into a
         * later career game.
         */
          if (
            careerGameApprovedForLiveEngine
          ) {
          _state.season
            .careerGameSimApproval =
              null;
        }

        const liveResolution =
          resolveLiveGameToFinalResult(
            canonicalGameEvent
          );

      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup screen where
     * the user chooses Play Game or Sim Game.
     */


      if (
        isCareerPlayerGame &&
        !careerGameApprovedForSim
      ) {
      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        canonicalGameEvent?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.success =
        true;

      result.resolved =
        false;

      result.stopSimulation =
        true;

      result.reason =
        'career-game-awaiting-user-choice';

      result.gameResult =
        null;

      return result;
    }

    /*
     * Sim approval is single-use.
     *
     * Clear it before resolution so it cannot leak into another
     * scheduled career game.
     */
    if (
      careerGameApprovedForSim
    ) {
      _state.season
        .careerGameSimApproval =
          null;
    }

    const gameResult =
      createEmptyGameResult(
        canonicalGameEvent
      );
```

### match 8
```js
     canonicalGameEvent?.id ||
        canonicalGameEvent
          ?.eventId ||
        canonicalGameEvent
          ?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      if (
        !liveResolution ||
        liveResolution
          .success !== true ||
        !liveResolution.gameResult
      ) {
        result.success =
          false;

        result.resolved =
          false;

        result.stopSimulation =
          true;

        result.reason =
          liveResolution?.reason ||
          'ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup screen where
     * the user chooses Play Game or Sim Game.
     */


      if (
        isCareerPlayerGame &&
        !careerGameApprovedForSim
      ) {
      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        canonicalGameEvent?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.success =
        true;

      result.resolved =
        false;

      result.stopSimulation =
        true;

      result.reason =
        'career-game-awaiting-user-choice';

      result.gameResult =
        null;

      return result;
    }

    /*
     * Sim approval is single-use.
     *
     * Clear it before resolution so it cannot leak into another
     * scheduled career game.
     */
    if (
      careerGameApprovedForSim
    ) {
      _state.season
        .careerGameSimApproval =
          null;
    }

    const gameResult =
      createEmptyGameResult(
        canonicalGameEvent
      );

    const rosterPreparation =
      populateGameResultRosters(
        gameResult
      );

    if (!rosterPreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        rosterPreparation.reason ||
        'game-rosters-not-populated';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      return result;
    }

    const homeStrength =
      createTeamGameStrengthProfile(
        rosterPreparation.homeRoster
      );

    const awayStrength =
      createTeamGameStrengthProfile(
        rosterPreparation.awayRoster
      );

    if (
      !homeStrength.success ||
      !awayStrength.success
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        !homeStrength.success
          ? homeStrength.reason
          : awayStrength.reason;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: false,

        homeStrength,

        awayStrength,
      };

      return result;
    }

    /*
     * Store the simulator inputs directly on the canonical
     * game record. These are internal pregame ratings and
     * do not alter public team or player overalls.
     */
    gameResult.matchup = {
      home: {
        ...homeStrength,
      },

      away: {
        ...awayStrength,
      },

      homeIceAdvantage:
        2,

      overallDifference:
        homeStrength.overall -
        awayStrengt
```

### match 9
```js
ai-live-game-resolution-failed';

        result.gameResult =
          null;

        result.liveGameResolution =
          liveResolution || null;

        return result;
      }

      result.success =
        true;

      result.resolved =
        true;

      result.stopSimulation =
        false;

      result.reason =
        'ai-game-resolved-by-live-engine';

      result.gameResult =
        liveResolution.gameResult;

      result.liveGameResolution = {
        success: true,

        reason:
          liveResolution.reason,

        steps:
          liveResolution.steps,
      };

      return result;
    }

    /*
     * Pregame Sim Game may explicitly authorize this exact
     * career game to resolve immediately.
     */
    const careerGameId =
      canonicalGameEvent?.id ||
      canonicalGameEvent?.eventId ||
      canonicalGameEvent?.gameId ||
      event?.id ||
      event?.eventId ||
      null;

    const approvedCareerGameId =
      _state.season
        ?.careerGameSimApproval ||
      null;

    const careerGameApprovedForSim =
      Boolean(
        isCareerPlayerGame &&
        careerGameId &&
        approvedCareerGameId &&
        String(careerGameId) ===
          String(
            approvedCareerGameId
          )
      );

    /*
     * ============================================================
     * ROADMAP 6 — CAREER GAME USER DECISION POINT
     * ============================================================
     *
     * Background AI games resolve immediately.
     *
     * A game involving the career player must stop the Season
     * Engine on game day BEFORE any hockey simulation occurs.
     * game.js will then open the Pregame Matchup screen where
     * the user chooses Play Game or Sim Game.
     */


      if (
        isCareerPlayerGame &&
        !careerGameApprovedForSim
      ) {
      result.type =
        EVENT_TYPES.GAME;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        canonicalGameEvent?.gameId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.success =
        true;

      result.resolved =
        false;

      result.stopSimulation =
        true;

      result.reason =
        'career-game-awaiting-user-choice';

      result.gameResult =
        null;

      return result;
    }

    /*
     * Sim approval is single-use.
     *
     * Clear it before resolution so it cannot leak into another
     * scheduled career game.
     */
    if (
      careerGameApprovedForSim
    ) {
      _state.season
        .careerGameSimApproval =
          null;
    }

    const gameResult =
      createEmptyGameResult(
        canonicalGameEvent
      );

    const rosterPreparation =
      populateGameResultRosters(
        gameResult
      );

    if (!rosterPreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        rosterPreparation.reason ||
        'game-rosters-not-populated';

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      return result;
    }

    const homeStrength =
      createTeamGameStrengthProfile(
        rosterPreparation.homeRoster
      );

    const awayStrength =
      createTeamGameStrengthProfile(
        rosterPreparation.awayRoster
      );

    if (
      !homeStrength.success ||
      !awayStrength.success
    ) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        !homeStrength.success
          ? homeStrength.reason
          : awayStrength.reason;

      result.eventId =
        canonicalGameEvent?.id ||
        canonicalGameEvent?.eventId ||
        event?.id ||
        event?.eventId ||
        null;

      result.date =
        canonicalGameEvent?.date ||
        event?.date ||
        options?.date ||
        null;

      result.event =
        canonicalGameEvent;

      result.gameResult =
        gameResult;

      result.rosterPreparation =
        rosterPreparation;

      result.matchupPreparation = {
        success: false,

        homeStrength,

        awayStrength,
      };

      return result;
    }

    /*
     * Store the simulator inputs directly on the canonical
     * game record. These are internal pregame ratings and
     * do not alter public team or player overalls.
     */
    gameResult.matchup = {
      home: {
        ...homeStrength,
      },

      away: {
        ...awayStrength,
      },

      homeIceAdvantage:
        2,

      overallDifference:
        homeStrength.overall -
        awayStrength.overall,

      offenseDifference:
        homeStrength.offense -
        awayStrength.defense,

      defenseDifference:
        homeStrength.defense -
        awayStrength.offense,

      goalieDifference:
        homeStrength.goaltending -
        awayStrength.goaltending,
    };

    const gameRandom =
      createGameRandomContext(
        gameResult
      );

    const shotPreparation =
      createGameShotTotals(
        gameResult,
        gameRandom
      );

    if (!shotPreparation.success) {
      result.success = false;
      result.resolved = false;

      result.type =
        EVENT_TYPES.GAME;

      result.stopSimulation = true;

      result.reason =
        shotPreparation.re
```

### match 10
```js
Excellent puck control today.",
        "Your passing looked crisp throughout practice.",
        "Coach Reynolds noticed your playmaking.",
        "You protected the puck extremely well.",
        "Keep making smart decisions with possession.",
      ],

      systems: [
        "You picked up today's systems quickly.",
        "Coach Reynolds trusts your hockey IQ.",
        "Strong positioning all practice.",
        "You were consistently in the right spots.",
        "Keep communicating with your teammates.",
      ],

      scrimmage: [
        "You competed hard every shift.",
        "Coach Reynolds loved your intensity.",
        "Great pace during today's scrimmage.",
        "You looked comfortable in game situations.",
        "Keep bringing that compete level.",
      ],
    };

    const choices =
      feedbackByFocus[focus] ||
      feedbackByFocus.skills;

    return pickStableCareerMessage(
      choices,
      event?.id,
      event?.date,
      event?.focus,
      player?.id
    );
  }

  function completePracticeEvent(
    eventId,
    options = {}
  ) {
    const event =
      _state.schedule.find(
        scheduleEvent =>
          String(scheduleEvent.id) ===
          String(eventId)
      );

    if (!event) {
      return {
        success: false,
        reason: 'practice-not-found',
      };
    }

    if (event.completed) {
      return {
        success: false,
        reason: 'practice-already-completed',
      };
    }

    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.PRACTICE;

    result.eventId =
      event.id;

    result.date =
      event.date;

    result.event =
      event;

    result.reason =
      'practice-completed';

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    result.xp =
      createPracticeXPReward(
        event,
        careerPlayer
      );

    result.coachNote =
      createPracticeCoachFeedback(
        event,
        careerPlayer,
        result
      );

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'practice-result-not-applied',
      };
    }

    /*
     * Only mark the canonical schedule event complete
     * after its reward has been applied successfully.
     */
    event.completed = true;

    event.completedAt =
      event.date;

    event.result = {
      type:
        result.type,

      reason:
        result.reason,

      xp: {
        ...(result.xp || {}),

        attributes: {
          ...(
            result.xp
              ?.attributes ||
            {}
          ),
        },
      },
    };

    /*
     * Finalize the date that was previously blocked by this
     * player-controlled Practice.
     */
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    if (
      !_state.season.processedDates
        .includes(event.date)
    ) {
      _state.season.processedDates.push(
        event.date
      );

      _state.season.processedDates.sort(
        (firstDate, secondDate) =>
          String(firstDate).localeCompare(
            String(secondDate)
          )
      );
    }

    if (
      !Array.isArray(
        _state.season.completedEventIds
      )
    ) {
      _state.season.completedEventIds = [];
    }

    if (
      !_state.season.completedEventIds
        .some(
          completedEventId =>
            String(completedEventId) ===
            String(event.id)
        )
    ) {
      _state.season.completedEventIds.push(
        event.id
      );
    }

    _state.season.lastProcessedDate =
      event.date;

    /*
     * The blocked Practice date is now fully completed,
     * so advance every canonical date field to that date
     * before saving.
     */
    setCurrentDate(
      event.date,
      {
        save: false,
      }
    );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      completed: true,

      eventId:
        event.id,

      date:
        event.date,

      focus:
        event.focus ||
        'skills',

      result,

      applied,
    };

    
  }

    function completeTrainingEvent(
      eventId,
      trainingKey,
      options = {}
    ) {
    const canonicalEvent =
      (_state.schedule || [])
        .find(event =>
          String(
            event?.id ||
            event?.eventId ||
            ''
          ) ===
          String(eventId || '')
        );

    if (!canonicalEvent) {
      return {
        success: false,
        reason:
          'training-event-not-found',
      };
    }

    if (
      canonicalEvent.type !==
      EVENT_TYPES.TRAINING
    ) {
      return {
        success: false,
        reason:
          'event-is-not-training',
      };
    }

    if (
      canonicalEvent.completed === true
    ) {
      return {
        success: false,
        reason:
          'training-already-completed',
      };
    }

      const careerPlayer =
        getPlayerById(
          _state.player?.playerId ||
          _state.player?.id ||
          'career-player'
        );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    const rawPosition =
      String(
        careerPlayer.position || ''
      )
        .trim()
        .toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes(
        'GOAL'
      );

    c
```

### match 11
```js
      "You protected the puck extremely well.",
        "Keep making smart decisions with possession.",
      ],

      systems: [
        "You picked up today's systems quickly.",
        "Coach Reynolds trusts your hockey IQ.",
        "Strong positioning all practice.",
        "You were consistently in the right spots.",
        "Keep communicating with your teammates.",
      ],

      scrimmage: [
        "You competed hard every shift.",
        "Coach Reynolds loved your intensity.",
        "Great pace during today's scrimmage.",
        "You looked comfortable in game situations.",
        "Keep bringing that compete level.",
      ],
    };

    const choices =
      feedbackByFocus[focus] ||
      feedbackByFocus.skills;

    return pickStableCareerMessage(
      choices,
      event?.id,
      event?.date,
      event?.focus,
      player?.id
    );
  }

  function completePracticeEvent(
    eventId,
    options = {}
  ) {
    const event =
      _state.schedule.find(
        scheduleEvent =>
          String(scheduleEvent.id) ===
          String(eventId)
      );

    if (!event) {
      return {
        success: false,
        reason: 'practice-not-found',
      };
    }

    if (event.completed) {
      return {
        success: false,
        reason: 'practice-already-completed',
      };
    }

    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.PRACTICE;

    result.eventId =
      event.id;

    result.date =
      event.date;

    result.event =
      event;

    result.reason =
      'practice-completed';

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    result.xp =
      createPracticeXPReward(
        event,
        careerPlayer
      );

    result.coachNote =
      createPracticeCoachFeedback(
        event,
        careerPlayer,
        result
      );

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'practice-result-not-applied',
      };
    }

    /*
     * Only mark the canonical schedule event complete
     * after its reward has been applied successfully.
     */
    event.completed = true;

    event.completedAt =
      event.date;

    event.result = {
      type:
        result.type,

      reason:
        result.reason,

      xp: {
        ...(result.xp || {}),

        attributes: {
          ...(
            result.xp
              ?.attributes ||
            {}
          ),
        },
      },
    };

    /*
     * Finalize the date that was previously blocked by this
     * player-controlled Practice.
     */
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    if (
      !_state.season.processedDates
        .includes(event.date)
    ) {
      _state.season.processedDates.push(
        event.date
      );

      _state.season.processedDates.sort(
        (firstDate, secondDate) =>
          String(firstDate).localeCompare(
            String(secondDate)
          )
      );
    }

    if (
      !Array.isArray(
        _state.season.completedEventIds
      )
    ) {
      _state.season.completedEventIds = [];
    }

    if (
      !_state.season.completedEventIds
        .some(
          completedEventId =>
            String(completedEventId) ===
            String(event.id)
        )
    ) {
      _state.season.completedEventIds.push(
        event.id
      );
    }

    _state.season.lastProcessedDate =
      event.date;

    /*
     * The blocked Practice date is now fully completed,
     * so advance every canonical date field to that date
     * before saving.
     */
    setCurrentDate(
      event.date,
      {
        save: false,
      }
    );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      completed: true,

      eventId:
        event.id,

      date:
        event.date,

      focus:
        event.focus ||
        'skills',

      result,

      applied,
    };

    
  }

    function completeTrainingEvent(
      eventId,
      trainingKey,
      options = {}
    ) {
    const canonicalEvent =
      (_state.schedule || [])
        .find(event =>
          String(
            event?.id ||
            event?.eventId ||
            ''
          ) ===
          String(eventId || '')
        );

    if (!canonicalEvent) {
      return {
        success: false,
        reason:
          'training-event-not-found',
      };
    }

    if (
      canonicalEvent.type !==
      EVENT_TYPES.TRAINING
    ) {
      return {
        success: false,
        reason:
          'event-is-not-training',
      };
    }

    if (
      canonicalEvent.completed === true
    ) {
      return {
        success: false,
        reason:
          'training-already-completed',
      };
    }

      const careerPlayer =
        getPlayerById(
          _state.player?.playerId ||
          _state.player?.id ||
          'career-player'
        );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    const rawPosition =
      String(
        careerPlayer.position || ''
      )
        .trim()
        .toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes(
        'GOAL'
      );

    const trainingPool =
      isGoalie
        ? HIGH_SCHOOL_TRAINING_TYPES
            .goalie
        : HIGH_SCHOOL_TRAINING_TYPES
            .s
```

### match 12
```js
ch Reynolds trusts your hockey IQ.",
        "Strong positioning all practice.",
        "You were consistently in the right spots.",
        "Keep communicating with your teammates.",
      ],

      scrimmage: [
        "You competed hard every shift.",
        "Coach Reynolds loved your intensity.",
        "Great pace during today's scrimmage.",
        "You looked comfortable in game situations.",
        "Keep bringing that compete level.",
      ],
    };

    const choices =
      feedbackByFocus[focus] ||
      feedbackByFocus.skills;

    return pickStableCareerMessage(
      choices,
      event?.id,
      event?.date,
      event?.focus,
      player?.id
    );
  }

  function completePracticeEvent(
    eventId,
    options = {}
  ) {
    const event =
      _state.schedule.find(
        scheduleEvent =>
          String(scheduleEvent.id) ===
          String(eventId)
      );

    if (!event) {
      return {
        success: false,
        reason: 'practice-not-found',
      };
    }

    if (event.completed) {
      return {
        success: false,
        reason: 'practice-already-completed',
      };
    }

    const result =
      createEmptyEventResult();

    result.success = true;
    result.resolved = true;

    result.type =
      EVENT_TYPES.PRACTICE;

    result.eventId =
      event.id;

    result.date =
      event.date;

    result.event =
      event;

    result.reason =
      'practice-completed';

    const careerPlayer =
      getPlayerById(
        _state.player?.playerId ||
        _state.player?.id ||
        'career-player'
      );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    result.xp =
      createPracticeXPReward(
        event,
        careerPlayer
      );

    result.coachNote =
      createPracticeCoachFeedback(
        event,
        careerPlayer,
        result
      );

    const applied =
      applyEventResult(
        careerPlayer,
        result
      );

    if (!applied) {
      return {
        success: false,
        reason:
          'practice-result-not-applied',
      };
    }

    /*
     * Only mark the canonical schedule event complete
     * after its reward has been applied successfully.
     */
    event.completed = true;

    event.completedAt =
      event.date;

    event.result = {
      type:
        result.type,

      reason:
        result.reason,

      xp: {
        ...(result.xp || {}),

        attributes: {
          ...(
            result.xp
              ?.attributes ||
            {}
          ),
        },
      },
    };

    /*
     * Finalize the date that was previously blocked by this
     * player-controlled Practice.
     */
    if (
      !_state.season ||
      typeof _state.season !== 'object'
    ) {
      ensureCanonicalSeasonState(
        _state
      );
    }

    if (
      !Array.isArray(
        _state.season.processedDates
      )
    ) {
      _state.season.processedDates = [];
    }

    if (
      !_state.season.processedDates
        .includes(event.date)
    ) {
      _state.season.processedDates.push(
        event.date
      );

      _state.season.processedDates.sort(
        (firstDate, secondDate) =>
          String(firstDate).localeCompare(
            String(secondDate)
          )
      );
    }

    if (
      !Array.isArray(
        _state.season.completedEventIds
      )
    ) {
      _state.season.completedEventIds = [];
    }

    if (
      !_state.season.completedEventIds
        .some(
          completedEventId =>
            String(completedEventId) ===
            String(event.id)
        )
    ) {
      _state.season.completedEventIds.push(
        event.id
      );
    }

    _state.season.lastProcessedDate =
      event.date;

    /*
     * The blocked Practice date is now fully completed,
     * so advance every canonical date field to that date
     * before saving.
     */
    setCurrentDate(
      event.date,
      {
        save: false,
      }
    );

    if (options.save !== false) {
      save();
    }

    return {
      success: true,
      completed: true,

      eventId:
        event.id,

      date:
        event.date,

      focus:
        event.focus ||
        'skills',

      result,

      applied,
    };

    
  }

    function completeTrainingEvent(
      eventId,
      trainingKey,
      options = {}
    ) {
    const canonicalEvent =
      (_state.schedule || [])
        .find(event =>
          String(
            event?.id ||
            event?.eventId ||
            ''
          ) ===
          String(eventId || '')
        );

    if (!canonicalEvent) {
      return {
        success: false,
        reason:
          'training-event-not-found',
      };
    }

    if (
      canonicalEvent.type !==
      EVENT_TYPES.TRAINING
    ) {
      return {
        success: false,
        reason:
          'event-is-not-training',
      };
    }

    if (
      canonicalEvent.completed === true
    ) {
      return {
        success: false,
        reason:
          'training-already-completed',
      };
    }

      const careerPlayer =
        getPlayerById(
          _state.player?.playerId ||
          _state.player?.id ||
          'career-player'
        );

    if (!careerPlayer) {
      return {
        success: false,
        reason:
          'career-player-not-found',
      };
    }

    const rawPosition =
      String(
        careerPlayer.position || ''
      )
        .trim()
        .toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes(
        'GOAL'
      );

    const trainingPool =
      isGoalie
        ? HIGH_SCHOOL_TRAINING_TYPES
            .goalie
        : HIGH_SCHOOL_TRAINING_TYPES
            .skater;

    const selectedTraining =
      trainingPool.find(training =>
        String(
          training.trainingKey || ''
        ) ===
        String(trainingKey || '')
      ) ||
      nu
```

## shiftSeconds