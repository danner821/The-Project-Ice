/* ============================================================
   PROJECT ICE — game.js
   Build 0.0.2
   Title screen, player creation and save preview
   ============================================================ */

'use strict';

const SAVE_KEY = 'projectice_save';

const Game = {
  screen: 'title',

  player: {
    firstName: '',
    lastName: '',
    hometown: '',
    position: '',
    handedness: '',
    background: '',
    archetype: '',
    motivation: '',
    nhlTeam: '',
    age: 14,
    careerStart: 2022,
    // ── Career progression ─────────────────────────────────────
    // stage: 'creation' | 'hub'
    //   'creation' → player is still in the intro sequence
    //   'hub'      → tryouts complete; save loads directly to Career Hub
    stage: 'creation',
    tryoutsComplete: false,
  },
};

// ── Screen references ───────────────────────────────────────
const titleScreen          = document.getElementById('title-screen');
const creationScreen       = document.getElementById('creation-screen');
const careerSavesScreen    = document.getElementById('career-saves-screen');
const careerSaveList       = document.getElementById('career-save-list');
const careerSaveCount      = document.getElementById('career-save-count');
const btnBackCareerSaves   = document.getElementById('btn-back-career-saves');
const summaryScreen        = document.getElementById('summary-screen');
const identityScreen       = document.getElementById('identity-screen');
const careerOverviewScreen = document.getElementById('career-overview-screen');
const bedroomScreen        = document.getElementById('bedroom-screen');
const nhlTeamScreen        = document.getElementById('nhlteam-screen');
const motivationScreen     = document.getElementById('motivation-screen');
const archetypeScreen      = document.getElementById('archetype-screen');
const backgroundScreen     = document.getElementById('background-screen');
const arenaScreen          = document.getElementById('arena-screen');
const hubScreen            = document.getElementById('hub-screen');
const standingsScreen      = document.getElementById('standings-screen');
const teamProfileScreen    = document.getElementById('team-profile-screen');
const playerProfileScreen = document.getElementById('player-profile-screen');
const fullStatsScreen =
  document.getElementById('full-stats-screen');
const prospectsScreen      = document.getElementById('prospects-screen');
const eventScreen =
  document.getElementById('event-screen');
const pregameMatchupScreen =
  document.getElementById(
    'pregame-matchup-screen'
  );
const liveGameScreen =
  document.getElementById(
    'live-game-screen'
  );

const trainingScreen =
  document.getElementById(
    'training-screen'
  );

const trainingOptions =
  document.getElementById(
    'training-options'
  );

const btnBackTraining =
  document.getElementById(
    'btn-back-training'
  );

const eventResultsScreen =
  document.getElementById(
    'event-results-screen'
  );

const postgameSummaryScreen =
  document.getElementById(
    'postgame-summary-screen'
  );

const boxScoreScreen =
  document.getElementById(
    'box-score-screen'
  );

const tryoutSummaryScreen =
  document.getElementById(
    'tryout-summary-screen'
  );
const rosterRevealScreen = document.getElementById('roster-reveal-screen');
const coachIntroScreen     = document.getElementById('coach-intro-screen');
const coachResultsScreen = document.getElementById('coach-results-screen');
const skatingEvalScreen    = document.getElementById('skating-eval-screen');
const skatingResultsScreen = document.getElementById('skating-results-screen');


/*
 * ============================================================
 * DEV — LIVE GAME DIAGNOSTIC
 * ============================================================
 */
function runLiveGameDiagnosticFromUI() {
  const result =
    WorldEngine
      .runLiveGameSimulationDiagnostic();

  if (
    !result ||
    result.success !== true
  ) {
    console.error(
      '[Project Ice] Live game diagnostic failed:',
      result
    );

    alert(
      `Live game diagnostic failed: ${
        result?.reason ||
        'unknown-error'
      }`
    );

    return;
  }

  const diagnostic =
    result.diagnostic;

  const home =
    diagnostic
      .teams
      .home
      .abbreviation ||
    diagnostic
      .teams
      .home
      .teamId;

  const away =
    diagnostic
      .teams
      .away
      .abbreviation ||
    diagnostic
      .teams
      .away
      .teamId;

  const homeStats =
    diagnostic
      .teamStats
      .home;

  const awayStats =
    diagnostic
      .teamStats
      .away;

  alert(
    [
      'LIVE GAME DIAGNOSTIC',
      '',
      `${away} ${diagnostic.finalScore.away} - ${diagnostic.finalScore.home} ${home}`,
      '',
      `Shots: ${awayStats.shots} - ${homeStats.shots}`,
      `Hits: ${awayStats.hits} - ${homeStats.hits}`,
      `Blocks: ${awayStats.blockedShots} - ${homeStats.blockedShots}`,
      `Giveaways: ${awayStats.giveaways} - ${homeStats.giveaways}`,
      `Takeaways: ${awayStats.takeaways} - ${homeStats.takeaways}`,
      `PIM: ${awayStats.penaltyMinutes} - ${homeStats.penaltyMinutes}`,
      `Faceoffs: ${awayStats.faceoffWins} - ${homeStats.faceoffWins}`,
      '',
      `Steps: ${diagnostic.steps}`,
      `Recorded events: ${diagnostic.totals.recordedEvents}`,
      `Regulation complete: ${diagnostic.completedRegulation}`,
      `Tied after regulation: ${diagnostic.tiedAfterRegulation}`,
    ].join('\n')
  );
}

function runLiveGameCalibrationFromUI() {
  const SAMPLE_SIZE = 100;

  const totals = {
    homeGoals: 0,
    awayGoals: 0,
    homeShots: 0,
    awayShots: 0,
    homeHits: 0,
    awayHits: 0,
    homeBlocks: 0,
    awayBlocks: 0,
    homeGiveaways: 0,
    awayGiveaways: 0,
    homeTakeaways: 0,
    awayTakeaways: 0,
    homePIM: 0,
    awayPIM: 0,
    homeFaceoffs: 0,
    awayFaceoffs: 0,
    events: 0,
    steps: 0,
    tiesAfterRegulation: 0,
  };

  const ranges = {
    goals: [],
    shots: [],
    hits: [],
    blocks: [],
    giveaways: [],
    takeaways: [],
    pim: [],
    faceoffs: [],
    events: [],
  };

  let completed = 0;

  let canonicalResultsCreated = 0;

  const failedGames = [];

  for (let i = 0; i < SAMPLE_SIZE; i += 1) {
    const result =
      WorldEngine.runLiveGameSimulationDiagnostic();

    if (
      !result ||
      result.success !== true ||
      !result.diagnostic
    ) {
      const d =
        result?.diagnostic ||
        null;

      const sim =
        result?.simulation ||
        null;

      const lastFailure =
        Array.isArray(
          d?.failures
        ) &&
        d.failures.length > 0
          ? d.failures[
              d.failures.length - 1
            ]
          : null;

      failedGames.push({
        gameNumber:
          i + 1,

        reason:
          lastFailure?.reason ||
          result?.reason ||
          'unknown-failure',

        period:
          lastFailure?.period ??
          sim?.period ??
          'N/A',

        clock:
          lastFailure
            ?.clockSecondsRemaining ??
          sim?.clockSecondsRemaining ??
          'N/A',

        status:
          sim?.status ||
          'N/A',

        gameComplete:
          sim?.gameComplete === true,

        regulationComplete:
          sim?.regulationComplete === true,

        wentToOvertime:
          sim?.wentToOvertime === true,

        wentToShootout:
          sim?.wentToShootout === true,

        stoppageReason:
          sim?.flow
            ?.stoppageReason ||
          'none',

        steps:
          d?.steps ??
          'N/A',

        hitStepLimit:
          d?.hitStepLimit === true,

        score:
          d?.finalScore
            ? `${d.finalScore.home}-${d.finalScore.away}`
            : `${
                sim?.home?.score ?? '?'
              }-${
                sim?.away?.score ?? '?'
              }`,
      });

      console.error(
        `[Calibration] Game ${i + 1} failed:`,
        result
      );

      continue;
    }

    const d = result.diagnostic;
    const home = d.teamStats.home;
    const away = d.teamStats.away;

    completed += 1;

    if (
      result.diagnostic
        ?.canonicalResultCreated === true &&
      result.diagnostic
        ?.finalized === true
    ) {
      canonicalResultsCreated += 1;
    }

    totals.homeGoals += d.finalScore.home;
    totals.awayGoals += d.finalScore.away;

    totals.homeShots += home.shots;
    totals.awayShots += away.shots;

    totals.homeHits += home.hits;
    totals.awayHits += away.hits;

    totals.homeBlocks += home.blockedShots;
    totals.awayBlocks += away.blockedShots;

    totals.homeGiveaways += home.giveaways;
    totals.awayGiveaways += away.giveaways;

    totals.homeTakeaways += home.takeaways;
    totals.awayTakeaways += away.takeaways;

    totals.homePIM += home.penaltyMinutes;
    totals.awayPIM += away.penaltyMinutes;

    totals.homeFaceoffs += home.faceoffWins;
    totals.awayFaceoffs += away.faceoffWins;

    totals.events += d.totals.recordedEvents;
    totals.steps += d.steps;

    if (d.wentToOvertime) {
      totals.tiesAfterRegulation += 1;
    }

    ranges.goals.push(
      d.finalScore.home +
      d.finalScore.away
    );

    ranges.shots.push(
      home.shots +
      away.shots
    );

    ranges.hits.push(
      home.hits +
      away.hits
    );

    ranges.blocks.push(
      home.blockedShots +
      away.blockedShots
    );

    ranges.giveaways.push(
      home.giveaways +
      away.giveaways
    );

    ranges.takeaways.push(
      home.takeaways +
      away.takeaways
    );

    ranges.pim.push(
      home.penaltyMinutes +
      away.penaltyMinutes
    );

    ranges.faceoffs.push(
      home.faceoffWins +
      away.faceoffWins
    );

    ranges.events.push(
      d.totals.recordedEvents
    );
  }

  if (completed === 0) {
    alert(
      'Calibration failed: no games completed.'
    );

    return;
  }

  const avg = value =>
    (value / completed).toFixed(1);

  const range = values => {
    if (!values.length) {
      return 'N/A';
    }

    return (
      `${Math.min(...values)}–` +
      `${Math.max(...values)}`
    );
  };

  alert(
    [
      '100-GAME SIM CALIBRATION',
      '',
      `Completed: ${completed}/${SAMPLE_SIZE}`,
      `Canonical Results: ${canonicalResultsCreated}/${SAMPLE_SIZE}`,
      '',
      'AVERAGE PER TEAM',

      `Goals: ${avg(
        (
          totals.homeGoals +
          totals.awayGoals
        ) / 2
      )}`,

      `Shots: ${avg(
        (
          totals.homeShots +
          totals.awayShots
        ) / 2
      )}`,

      `Hits: ${avg(
        (
          totals.homeHits +
          totals.awayHits
        ) / 2
      )}`,

      `Blocks: ${avg(
        (
          totals.homeBlocks +
          totals.awayBlocks
        ) / 2
      )}`,

      `Giveaways: ${avg(
        (
          totals.homeGiveaways +
          totals.awayGiveaways
        ) / 2
      )}`,

      `Takeaways: ${avg(
        (
          totals.homeTakeaways +
          totals.awayTakeaways
        ) / 2
      )}`,

      `PIM: ${avg(
        (
          totals.homePIM +
          totals.awayPIM
        ) / 2
      )}`,

      `Faceoff Wins: ${avg(
        (
          totals.homeFaceoffs +
          totals.awayFaceoffs
        ) / 2
      )}`,

      '',
      'GAME RANGES',
      `Total Goals: ${range(ranges.goals)}`,
      `Total Shots: ${range(ranges.shots)}`,
      `Total Hits: ${range(ranges.hits)}`,
      `Total Blocks: ${range(ranges.blocks)}`,
      `Total Giveaways: ${range(
        ranges.giveaways
      )}`,
      `Total Takeaways: ${range(
        ranges.takeaways
      )}`,
      `Total PIM: ${range(ranges.pim)}`,
      `Total Faceoffs: ${range(
        ranges.faceoffs
      )}`,
      '',
      `Avg Recorded Events: ${avg(
        totals.events
      )}`,
      `Avg Simulation Steps: ${avg(
        totals.steps
      )}`,
    `Regulation Ties: ${
      totals.tiesAfterRegulation
    }/${completed}`,

    '',

    failedGames.length > 0
      ? `FAILED GAMES: ${failedGames.length}`
      : 'FAILED GAMES: 0',

    ...failedGames.map(
      failure => [
        '',
        `Game ${failure.gameNumber}`,
        `Reason: ${failure.reason}`,
        `Period: ${failure.period}`,
        `Clock: ${failure.clock}`,
        `Status: ${failure.status}`,
        `Score: ${failure.score}`,
        `Steps: ${failure.steps}`,
        `Hit Step Limit: ${failure.hitStepLimit}`,
        `Regulation Complete: ${failure.regulationComplete}`,
        `Went To OT: ${failure.wentToOvertime}`,
        `Went To SO: ${failure.wentToShootout}`,
        `Stoppage: ${failure.stoppageReason}`,
      ].join('\n')
    ),
    ].join('\n')
  );
}
window.runLiveGameDiagnostic =
  runLiveGameDiagnosticFromUI;

function ensureHubLiveGameDiagnosticButton() {
  return;
  const existingButton =
    document.getElementById(
      'hub-live-game-diagnostic'
    );

  if (existingButton) {
    return;
  }

  const button =
    document.createElement(
      'button'
    );

  button.id =
    'hub-live-game-diagnostic';

  button.type =
    'button';

  button.textContent =
    '🧪 Run Live Game Diagnostic';

  button.style.cssText = `
    position: fixed;
    right: 18px;
    bottom: 92px;
    z-index: 9999;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(97, 161, 255, 0.7);
    background: rgba(10, 31, 67, 0.96);
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
  `;

  button.addEventListener(
    'click',
    () => {
      runLiveGameCalibrationFromUI();
    }
  );

  document.body.appendChild(
    button
  );

  

  /*
   * ============================================================
   * DEV — COMPETITIVE BALANCE DIAGNOSTIC BUTTON
   * ============================================================
   */
  const existingCompetitiveButton =
    document.getElementById(
      'hub-competitive-balance-diagnostic'
    );

  if (!existingCompetitiveButton) {
    const competitiveButton =
      document.createElement(
        'button'
      );

    competitiveButton.id =
      'hub-competitive-balance-diagnostic';

    competitiveButton.type =
      'button';

    competitiveButton.textContent =
      '⚖️ Competitive Balance Test';

    competitiveButton.style.cssText = `
      position: fixed;
      right: 18px;
      bottom: 148px;
      z-index: 9999;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255, 197, 97, 0.75);
      background: rgba(57, 39, 10, 0.96);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
    `;

    competitiveButton.addEventListener(
      'click',
      () => {
        competitiveButton.disabled =
          true;

        const originalText =
          competitiveButton.textContent;

        competitiveButton.textContent =
          '⚖️ Running 300 Games...';

        setTimeout(
          () => {
            const result =
              WorldEngine
                .runLiveGameCompetitiveBalanceDiagnostic({
                  sampleSize: 300,
                });

            competitiveButton.disabled =
              false;

            competitiveButton.textContent =
              originalText;

            if (
              !result ||
              result.success !== true ||
              !result.report
            ) {
              console.error(
                '[Project Ice] Competitive balance diagnostic failed:',
                result
              );

              alert(
                `Competitive balance diagnostic failed: ${
                  result?.reason ||
                  'unknown-error'
                }`
              );

              return;
            }

            const report =
              result.report;

            const strong =
              report.strongTeam;

            const weak =
              report.weakTeam;

            alert(
              [
                'COMPETITIVE BALANCE TEST',
                '',
                `Completed: ${report.completedGames}/${report.sampleSize}`,
                `Failed: ${report.failedGames}`,
                '',
                'TEAM QUALITY',
                `${strong.abbreviation}: ${strong.diagnosticQuality}`,
                `${weak.abbreviation}: ${weak.diagnosticQuality}`,
                '',
                'WIN RATE',
                `${strong.abbreviation}: ${strong.winRate}%`,
                `${weak.abbreviation}: ${weak.winRate}%`,
                '',
                'GOALS / GAME',
                `${strong.abbreviation}: ${strong.goalsPerGame}`,
                `${weak.abbreviation}: ${weak.goalsPerGame}`,
                '',
                'SHOTS / GAME',
                `${strong.abbreviation}: ${strong.shotsPerGame}`,
                `${weak.abbreviation}: ${weak.shotsPerGame}`,
                '',
                'POWER PLAY',
                `${strong.abbreviation}: ${strong.powerPlayPercentage}%`,
                `${weak.abbreviation}: ${weak.powerPlayPercentage}%`,
                '',
                'GAME FLOW',
                `OT Rate: ${report.overtimeRate}%`,
                `Shootout Rate: ${report.shootoutRate}%`,
                '',
                'DIFFERENTIALS',
                `Goal Differential/Game: ${report.goalDifferentialPerGame}`,
                `Shot Differential/Game: ${report.shotDifferentialPerGame}`,
                '',
                'HOME SPLITS',
                `${strong.abbreviation}: ${strong.homeWinRate}% at home`,
                `${weak.abbreviation}: ${weak.homeWinRate}% at home`,
              ].join('\n')
            );
          },
          50
        );
      }
    );

document.body.appendChild(
  competitiveButton
);
}

/*
* ============================================================
* DEV — STRENGTH GRADIENT DIAGNOSTIC BUTTON
* ============================================================
*/
const existingGradientButton =
document.getElementById(
  'hub-strength-gradient-diagnostic'
);

if (!existingGradientButton) {
const gradientButton =
  document.createElement(
    'button'
  );

gradientButton.id =
  'hub-strength-gradient-diagnostic';

gradientButton.type =
  'button';

gradientButton.textContent =
  '📈 Strength Gradient Test';

gradientButton.style.cssText = `
  position: fixed;
  right: 18px;
  bottom: 204px;
  z-index: 9999;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(126, 227, 168, 0.75);
  background: rgba(12, 54, 35, 0.96);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

gradientButton.addEventListener(
  'click',
  () => {
    gradientButton.disabled =
      true;

    const originalText =
      gradientButton.textContent;

    gradientButton.textContent =
      '📈 Running 600 Games...';

    setTimeout(
      () => {
        const result =
          WorldEngine
            .runLiveGameStrengthGradientDiagnostic({
              gamesPerMatchup: 150,
            });

        gradientButton.disabled =
          false;

        gradientButton.textContent =
          originalText;

        if (
          !result ||
          result.success !== true ||
          !result.report
        ) {
          console.error(
            '[Project Ice] Strength gradient diagnostic failed:',
            result
          );

          alert(
            `Strength gradient diagnostic failed: ${
              result?.reason ||
              'unknown-error'
            }`
          );

          return;
        }

        const report =
          result.report;

        const matchupLines =
          report.matchups.map(
            matchup => [
              `#${matchup.higherRank} ${matchup.higherTeam} vs #${matchup.lowerRank} ${matchup.lowerTeam}`,
              `Quality: ${matchup.higherQuality} - ${matchup.lowerQuality}`,
              `Gap: ${matchup.qualityGap}`,
              `Win Rate: ${matchup.higherWinRate}% - ${matchup.lowerWinRate}%`,
              `Goals/Game: ${matchup.higherGoalsPerGame} - ${matchup.lowerGoalsPerGame}`,
              `Shots/Game: ${matchup.higherShotsPerGame} - ${matchup.lowerShotsPerGame}`,
              `Goal Diff/Game: ${matchup.goalDifferentialPerGame}`,
              `Shot Diff/Game: ${matchup.shotDifferentialPerGame}`,
              `PP%: ${matchup.higherPowerPlayPercentage}% - ${matchup.lowerPowerPlayPercentage}%`,
              `OT: ${matchup.overtimeRate}%`,
              `SO: ${matchup.shootoutRate}%`,
            ].join('\n')
          );

        alert(
          [
            'STRENGTH GRADIENT TEST',
            '',
            `Games Per Matchup: ${report.gamesPerMatchup}`,
            `Completed: ${report.totalCompletedGames}`,
            `Failed: ${report.totalFailedGames}`,
            '',
            ...matchupLines.flatMap(
              line => [
                line,
                '',
              ]
            ),
          ].join('\n')
        );
      },
      50
    );
  }
);

document.body.appendChild(
  gradientButton
);
}

/*
* ============================================================
* DEV — TEAM SIMULATION PROFILES BUTTON
* ============================================================
*/
const existingProfilesButton =
document.getElementById(
  'hub-team-simulation-profiles'
);

if (!existingProfilesButton) {
const profilesButton =
  document.createElement(
    'button'
  );

profilesButton.id =
  'hub-team-simulation-profiles';

profilesButton.type =
  'button';

profilesButton.textContent =
  '🔬 Team Sim Profiles';

profilesButton.style.cssText = `
  position: fixed;
  right: 18px;
  bottom: 260px;
  z-index: 9999;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(184, 138, 255, 0.75);
  background: rgba(42, 21, 70, 0.96);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

profilesButton.addEventListener(
  'click',
  () => {
    const teams =
      Array.isArray(
        WorldEngine.state?.teams
      )
        ? WorldEngine.state.teams
        : [];

    const profiles =
      teams
        .map(
          team =>
            WorldEngine
              .getLiveGameTeamSimulationProfile(
                team.teamId
              )
        )
        .filter(
          result =>
            result?.success === true &&
            result.profile
        )
        .map(
          result =>
            result.profile
        )
        .sort(
          (
            firstTeam,
            secondTeam
          ) =>
            secondTeam.overallQuality -
            firstTeam.overallQuality
        );

    if (
      profiles.length === 0
    ) {
      alert(
        'No valid team simulation profiles were available.'
      );

      return;
    }

    const profileLines =
      profiles.map(
        (
          profile,
          index
        ) => [
          `#${index + 1} ${profile.abbreviation}`,
          `Overall Quality: ${profile.overallQuality}`,
          `Skater OVR: ${profile.skaterOverall}`,
          `Starter G OVR: ${profile.starterGoalieOverall}`,
          `Possession: ${profile.possessionOffense}`,
          `Defense: ${profile.defensiveDisruption}`,
          `Finishing: ${profile.finishing}`,
          `Goalie Save: ${profile.goalieSaveAbility}`,
          `Goalie Rebound: ${profile.goalieReboundAbility}`,
          `Goalie Scramble: ${profile.goalieScrambleAbility}`,
          `PP: ${profile.powerPlayQuality}`,
          `PK: ${profile.penaltyKillQuality}`,
          '',
        ].join('\n')
      );

    alert(
      [
        'TEAM SIMULATION PROFILES',
        '',
        ...profileLines,
      ].join('\n')
    );
  }
);

document.body.appendChild(
  profilesButton
);
}

/*
* ============================================================
* DEV — ATTRIBUTE ISOLATION TEST BUTTON
* ============================================================
*/
const existingIsolationButton =
document.getElementById(
  'hub-attribute-isolation-test'
);

if (!existingIsolationButton) {
const isolationButton =
  document.createElement(
    'button'
  );

isolationButton.id =
  'hub-attribute-isolation-test';

isolationButton.type =
  'button';

isolationButton.textContent =
  '🧬 Attribute Isolation Test';

isolationButton.style.cssText = `
  position: fixed;
  right: 18px;
  bottom: 310px;
  z-index: 9999;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 122, 196, 0.78);
  background: rgba(74, 22, 58, 0.96);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

isolationButton.addEventListener(
  'click',
  () => {
    isolationButton.disabled =
      true;

    const originalText =
      isolationButton.textContent;

    isolationButton.textContent =
      '🧬 Running...';

    try {
      const diagnostic =
        WorldEngine
          .runLiveGameAttributeIsolationDiagnostic({
            gamesPerTest: 400,
            boost: 8,
          });

      const report =
        diagnostic?.report;

      if (!report) {
        alert(
          `Attribute Isolation Test failed.\n\nReason: ${
            diagnostic?.reason ||
            'unknown'
          }`
        );

        return;
      }

      const resultLines =
        report.results.map(
          result => {
            if (
              result?.success !==
              true
            ) {
              return [
                result.label,
                'FAILED',
                `Reason: ${
                  result.reason ||
                  'unknown'
                }`,
                '',
              ].join('\n');
            }

            return [
              result.label,
              `Win Rate: ${Number(
                result.testTeamWinRate
              ).toFixed(1)}%`,
              `Goals/Game: ${Number(
                result.testGoalsPerGame
              ).toFixed(2)}`,
              `Shots/Game: ${Number(
                result.testShotsPerGame
              ).toFixed(2)}`,
              `PP: ${Number(
                result.testPowerPlayPercentage
              ).toFixed(1)}%`,
              `Goal Diff/Game: ${Number(
                result.goalDifferentialPerGame
              ).toFixed(2)}`,
              `Shot Diff/Game: ${Number(
                result.shotDifferentialPerGame
              ).toFixed(2)}`,
              '',
            ].join('\n');
          }
        );

      alert(
        [
          'ATTRIBUTE ISOLATION TEST',
          '',
          `${report.testTeam.abbreviation} vs ${report.controlTeam.abbreviation}`,
          `Boost: +${report.boost}`,
          `Games Per Test: ${report.gamesPerTest}`,
          `Completed Tests: ${report.completedTests}/${report.totalTests}`,
          '',
          ...resultLines,
        ].join('\n')
      );
    } catch (error) {
      console.error(
        '[Project Ice] Attribute Isolation Test failed',
        error
      );

      alert(
        [
          'ATTRIBUTE ISOLATION TEST',
          '',
          'The diagnostic encountered an error.',
          '',
          error?.message ||
            String(error),
        ].join('\n')
      );
    } finally {
      isolationButton.disabled =
        false;

      isolationButton.textContent =
        originalText;
    }
  }
);

document.body.appendChild(
  isolationButton
);
}
}


// ── Button references ───────────────────────────────────────
const btnNewCareer = document.getElementById('btn-new-career');
const btnContinue = document.getElementById('btn-continue');
// ── DEV SHORTCUT — TEMPORARY, REMOVE BEFORE RELEASE ──────────────────────────
const btnDevHub       = document.getElementById('btn-dev-hub');

const btnLiveGameDiagnostic =
  document.getElementById(
    'btn-live-game-diagnostic'
  );

const devShortcutHint = document.getElementById('dev-shortcut-hint');
// ─────────────────────────────────────────────────────────────────────────────
const btnBackTitle = document.getElementById('btn-back-title');
const btnBackCreation = document.getElementById('btn-back-creation');
const btnBackSummary = document.getElementById('btn-back-summary');
const btnContinueSummary = document.getElementById('btn-continue-summary');
const btnDeleteSave = document.getElementById('btn-delete-save');
const btnContinueSetup      = document.getElementById('btn-continue-setup');
const btnIdentityBackground = document.getElementById('btn-identity-background');
const btnBackIdentity       = document.getElementById('btn-back-identity');
const btnContinueBackground = document.getElementById('btn-continue-background');
const btnIdentityArchetype     = document.getElementById('btn-identity-archetype');
const btnBackIdentityArchetype = document.getElementById('btn-back-identity-archetype');
const btnContinueArchetype     = document.getElementById('btn-continue-archetype');
const btnIdentityMotivation     = document.getElementById('btn-identity-motivation');
const btnBackIdentityMotivation = document.getElementById('btn-back-identity-motivation');
const btnContinueMotivation     = document.getElementById('btn-continue-motivation');
const btnIdentityNhlTeam        = document.getElementById('btn-identity-nhlteam');
const btnBackIdentityNhlTeam    = document.getElementById('btn-back-identity-nhlteam');
const btnContinueNhlTeam        = document.getElementById('btn-continue-nhlteam');
const btnBackOverview           = document.getElementById('btn-back-overview');
const btnBeginCareer            = document.getElementById('btn-begin-career');

// ── Form references ─────────────────────────────────────────
const playerForm = document.getElementById('player-form');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const hometownInput = document.getElementById('hometown');
const formError = document.getElementById('form-error');

// ── Summary references ──────────────────────────────────────
const summaryName = document.getElementById('summary-name');
const summaryDetails = document.getElementById('summary-details');
const summaryHometown = document.getElementById('summary-hometown');

// ── Identity references ─────────────────────────────────────
const identityBgStatus         = document.getElementById('identity-background-status');
const identityArchetypeStatus  = document.getElementById('identity-archetype-status');
const identityMotivationStatus = document.getElementById('identity-motivation-status');
const identityNhlTeamStatus    = document.getElementById('identity-nhlteam-status');
const overviewPlayerName       = document.getElementById('overview-player-name');
const overviewPlayerPosition   = document.getElementById('overview-player-position');
const overviewPlayerHometown   = document.getElementById('overview-player-hometown');
const playerWeightInput =
  document.getElementById('player-weight');
const playerWeightValue =
  document.getElementById('player-weight-value');
const overviewBackground       = document.getElementById('overview-background');
const overviewArchetype        = document.getElementById('overview-archetype');
const overviewMotivation       = document.getElementById('overview-motivation');
const overviewNhlTeam          = document.getElementById('overview-nhlteam');
const statusBackground         = document.getElementById('status-background');
const statusArchetype          = document.getElementById('status-archetype');
const statusMotivation         = document.getElementById('status-motivation');
const statusNhlTeam            = document.getElementById('status-nhlteam');
const identityCompleteCount    = document.getElementById('identity-complete-count');

// ── Archetype position rules ────────────────────────────────
const POSITION_GROUP = {
  'Center':     'forward',
  'Left Wing':  'forward',
  'Right Wing': 'forward',
  'Defenseman': 'defense',
  'Goalie':     'goalie',
};

const VALID_ARCHETYPES = {
  forward: ['Sniper', 'Playmaker', 'Power Forward', 'Two-Way Forward'],
  defense: ['Offensive Defenseman', 'Defensive Defenseman'],
  goalie:  ['Butterfly Goalie', 'Athletic Goalie', 'Hybrid Goalie'],
};

function getPositionGroup(position) {
  return POSITION_GROUP[position] || '';
}

function isArchetypeValidForPosition(archetype, position) {
  const group = getPositionGroup(position);
  if (!group) return false;
  return (VALID_ARCHETYPES[group] || []).includes(archetype);
}

function filterArchetypeCards() {
  const group = getPositionGroup(Game.player.position);
  document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
    const show = card.dataset.positionGroup === group;
    card.style.display = show ? '' : 'none';
  });
}

function renderTrainingOptions() {
  if (
    !trainingOptions ||
    typeof WorldEngine
      ?.getTrainingTypes !==
      'function'
  ) {
    return;
  }

  const trainingCatalog =
    WorldEngine.getTrainingTypes();

  const positionGroup =
    getPositionGroup(
      Game.player.position
    );

  const trainingPool =
    positionGroup === 'goalie'
      ? trainingCatalog.goalie
      : trainingCatalog.skater;

  /*
   * WEEKLY TRAINING SELECTION
   *
   * Show a stable random subset of the full Training catalog.
   * The same Training date always produces the same choices,
   * even after reloading the save.
   */
  const activeTrainingEvent =
    Array.isArray(
      WorldEngine.state.schedule
    )
      ? WorldEngine.state.schedule.find(
          event =>
            String(
              event?.id ||
              event?.eventId ||
              ''
            ) ===
            String(
              activeTrainingEventId ||
              ''
            )
        )
      : null;

  const trainingDate =
    activeTrainingEvent?.date ||
    Game.player.currentDate ||
    'training';

  const stableTrainingScore =
    training => {
      const seedText =
        `${trainingDate}-${training.trainingKey}`;

      let hash = 0;

      for (
        let index = 0;
        index < seedText.length;
        index += 1
      ) {
        hash =
          (
            (hash << 5) -
            hash
          ) +
          seedText.charCodeAt(
            index
          );

        hash |= 0;
      }

      return Math.abs(hash);
    };

  const choiceCount =
    Math.min(
      trainingPool.length,
      4 +
        (
          stableTrainingScore({
            trainingKey:
              'weekly-choice-count',
          }) % 3
        )
    );

  const weeklyTrainingPool =
    [...trainingPool]
      .sort(
        (firstTraining, secondTraining) =>
          stableTrainingScore(
            firstTraining
          ) -
          stableTrainingScore(
            secondTraining
          )
      )
      .slice(
        0,
        choiceCount
      );

    if (
      !Array.isArray(weeklyTrainingPool) ||
      weeklyTrainingPool.length === 0
    ) {
    trainingOptions.innerHTML = `
      <div class="training-empty">
        No training options are available.
      </div>
    `;

    return;
  }

  const formatAttributeLabel =
    attributeKey => {
      const labelMap = {
        wristShotPower:
          'Wrist Shot Power',

        wristShotAccuracy:
          'Wrist Shot Accuracy',

        slapShotPower:
          'Slap Shot Power',

        slapShotAccuracy:
          'Slap Shot Accuracy',

        passing:
          'Passing',

        puckControl:
          'Puck Control',

        deking:
          'Deking',

        handEye:
          'Hand-Eye',

        speed:
          'Speed',

        acceleration:
          'Acceleration',

        agility:
          'Agility',

        balance:
          'Balance',

        endurance:
          'Endurance',

        offensiveAwareness:
          'Offensive Awareness',

        defensiveAwareness:
          'Defensive Awareness',

        poise:
          'Poise',

        discipline:
          'Discipline',

        stickChecking:
          'Stick Checking',

        shotBlocking:
          'Shot Blocking',

        bodyChecking:
          'Body Checking',

        strength:
          'Strength',

        durability:
          'Durability',

        faceoffs:
          'Faceoffs',

        reflexes:
          'Reflexes',

        lateralMovement:
          'Lateral Movement',

        recoverySpeed:
          'Recovery Speed',

        positioning:
          'Positioning',

        angles:
          'Angles',

        reboundControl:
          'Rebound Control',

        gloveHigh:
          'Glove High',

        gloveLow:
          'Glove Low',

        blockerHigh:
          'Blocker High',

        blockerLow:
          'Blocker Low',

        fiveHole:
          'Five Hole',

        stickControl:
          'Stick Control',

        puckTracking:
          'Puck Tracking',

        anticipation:
          'Anticipation',

        composure:
          'Composure',

        consistency:
          'Consistency',

        puckHandling:
          'Puck Handling',

        goaliePassing:
          'Goalie Passing',
      };

      return (
        labelMap[attributeKey] ||
        attributeKey
      );
    };

  trainingOptions.innerHTML =
        weeklyTrainingPool
        .map(training => {
        const attributeMarkup =
          Array.isArray(
            training.attributes
          )
            ? training.attributes
                .map(attributeKey => `
                  <span
                    class="training-option__attribute"
                  >
                    + ${formatAttributeLabel(
                      attributeKey
                    )}
                  </span>
                `)
                .join('')
            : '';

        return `
          <button
            class="training-option"
            type="button"
            data-training-key="${
              training.trainingKey
            }"
          >
            <div
              class="training-option__icon"
              aria-hidden="true"
            >
              ${training.icon || '🏋️'}
            </div>

            <div
              class="training-option__content"
            >
              <div
                class="training-option__top"
              >
                <strong
                  class="training-option__name"
                >
                  ${training.label}
                </strong>

                <span
                  class="training-option__category"
                >
                  ${training.category}
                </span>
              </div>

              <p
                class="training-option__description"
              >
                ${
                  training.description ||
                  ''
                }
              </p>

              <div
                class="training-option__attributes"
              >
                ${attributeMarkup}
              </div>
            </div>

            <span
              class="training-option__arrow"
              aria-hidden="true"
            >
              ›
            </span>
          </button>
        `;
      })
      .join('');

  trainingOptions
    .querySelectorAll(
      '[data-training-key]'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          const trainingKey =
            button.dataset
              .trainingKey;

          if (
            !trainingKey ||
            !activeTrainingEventId
          ) {
            console.error(
              '[Project Ice] Training selection is missing its canonical event or training key.'
            );

            return;
          }

          const trainingDefinition =
            weeklyTrainingPool.find(
              training =>
                String(
                  training.trainingKey
                ) ===
                String(trainingKey)
            ) ||
            null;

          if (!trainingDefinition) {
            console.error(
              '[Project Ice] Selected Training definition could not be found.',
              trainingKey
            );

            return;
          }

          /*
           * Prevent double taps while the World Engine
           * completes the canonical Training event.
           */
          trainingOptions
            .querySelectorAll(
              '[data-training-key]'
            )
            .forEach(
              trainingButton => {
                trainingButton.disabled =
                  true;
              }
            );

          const completion =
            WorldEngine
              .completeTrainingEvent(
                activeTrainingEventId,
                trainingKey
              );

          if (
            !completion ||
            completion.success !== true
          ) {
            console.error(
              '[Project Ice] Training completion failed:',
              completion
            );

            trainingOptions
              .querySelectorAll(
                '[data-training-key]'
              )
              .forEach(
                trainingButton => {
                  trainingButton.disabled =
                    false;
                }
              );

            return;
          }

          /*
           * Pull the newly earned attribute XP back into
           * the career-player UI/save representation.
           */
          syncCareerPlayerWithWorld();

          saveCareerPreview();

          refreshScheduleEvents();

          refreshCareerUI();

          /*
           * Training is a dedicated presentation screen.
           * Explicitly dismiss it before opening the reusable
           * Event Results screen so the two screens can never overlap.
           */
          if (trainingScreen) {
            trainingScreen.classList.remove(
              'active'
            );

            trainingScreen.style.display =
              'none';
          }

          /*
           * Training now uses the same reusable results
           * presentation as Practice and Recovery.
           */

          EventResultsSystem.open(
            {
              ...trainingDefinition,

              type:
                'training',

              label:
                trainingDefinition
                  .label,

              icon:
                trainingDefinition
                  .icon ||
                '🏋️',
            },
            completion
          );

          activeTrainingEventId =
            null;
        }
      );
    });
}

let activeTrainingEventId = null;

function openTrainingScreen(
  eventId
) {
  if (trainingScreen) {
    trainingScreen.style.display =
      '';
  }
  if (
    !trainingScreen ||
    !eventId
  ) {
    return;
  }

  activeTrainingEventId =
    String(eventId);

  renderTrainingOptions();

  document
    .querySelectorAll(
      '.screen'
    )
    .forEach(screen => {
      screen.classList.add(
        'screen--hidden'
      );
    });

  trainingScreen.classList.remove(
    'screen--hidden'
  );

  trainingScreen.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant',
  });
}

// ── Event System ─────────────────────────────────────────────
// One reusable event screen for every event type in the game.
//
// To add a new event:  add an entry to EVENT_CATALOG.
// To open an event:    EventSystem.openEvent('event-id', originScreen)
//
// EVENT_CATALOG fields:
//   title       — display name shown on the event screen
//   type        — category key → maps to CSS .ev-type--* class on #event-screen
//                 built-in types: practice | tryout | game | recovery | rest |
//                                 meeting | interview | ceremony
//   icon        — emoji shown in the hero block
//   location    — venue / facility name shown under the title
//   objective   — one-sentence player goal (shown in Objective section)
//   description — 1-3 sentence flavour text (shown in Description section)

const EventSystem = (() => {
  // ── Catalog ────────────────────────────────────────────────
  const EVENT_CATALOG = {
    'practice': {
      title:       'Practice',
      type:        'practice',
      icon:        '🏒',
      location:    'Summit Ice Center',
      objective:   'Work on skating edges and passing.',
      description: 'A full team practice session. The coaching staff will run you through drills and line rushes. Every rep is a chance to move up the depth chart.',
    },
    'tryout-freshman': {
      title:       'Freshman Tryouts',
      type:        'tryout',
      icon:        '🥅',
      location:    'Eastdale Ice Arena',
      objective:   'Impress the coaching staff.',
      description: 'Your first real chance to prove you belong. The coaches are watching every shift — your skating, your decisions, your compete level. Play your game.',
      // When the player presses Begin Event, route to the Coach Intro screen
      // which explains the drill before play begins.
      completeScreen: 'tryout-freshman-intro',
    },
    'recovery': {
      title:       'Recovery',
      type:        'recovery',
      icon:        '💪',
      location:    'Training Facility',
      objective:   'Rest and stay sharp.',
      description: 'Light conditioning and body work. Recovery days are how players stay healthy across a long season. Take it seriously.',
    },
    'practice-scrimmage': {
      title:       'Practice',
      type:        'practice',
      icon:        '🏒',
      location:    'Summit Ice Center',
      objective:   'Full team scrimmage session.',
      description: "Today's practice wraps up with a full-ice scrimmage. Play as if it's a real game — the coaches are tracking every line combination.",
    },
    'off-day': {
      title:       'Off Day',
      type:        'rest',
      icon:        '📅',
      location:    '—',
      objective:   'Rest and recover.',
      description: 'No scheduled team activities today. Use the time wisely — your body and mind both need the break.',
    },
    'exhibition-game': {
      title:       'Exhibition Game',
      type:        'game',
      icon:        '🥅',
      location:    'Eastdale Ice Arena',
      objective:   'Get game-ready. Show your best.',
      description: "The first live game action of the preseason. Results don't go on the record, but your performance absolutely does. The coaching staff is still setting lines.",
      details: {
        League: 'High School',
        Opponent: 'Ravens',
        Venue: 'Eastdale Ice Arena',
        'Puck Drop': '7:00 PM',
        Crowd: 'Expected sellout',
        Scouts: '3 junior scouts attending',
        Stakes: 'Chance to earn a top-line role'
      },
      isFeatured: true,

      featuredReasons: [
        'Three junior scouts are attending.',
        'Coaches are evaluating line combinations.',
      ]
    },
    'recovery-sleep': {
      title:       'Recovery',
      type:        'recovery',
      icon:        '😴',
      location:    'Training Facility',
      objective:   'Rest and light conditioning.',
      description: 'End-of-week recovery session. Prioritise sleep and nutrition. The grind starts again next week.',
    },
    // ── Future event stubs (ready to flesh out) ──────────────
    // 'coach-meeting':   { title: 'Coach Meeting',    type: 'meeting',   icon: '📋', ... },
    // 'scout-interview': { title: 'Scout Interview',  type: 'interview', icon: '🔍', ... },
    // 'team-meeting':    { title: 'Team Meeting',     type: 'meeting',   icon: '📢', ... },
    // 'award-ceremony':  { title: 'Award Ceremony',   type: 'ceremony',  icon: '🏆', ... },
  };

  // ── Internal state ─────────────────────────────────────────
  let _origin     = 'hub';   // screen to return to when Back is pressed
  let _currentDef = null;    // definition of the event currently on screen

  // ── Helpers ────────────────────────────────────────────────
  function _set(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function _populate(def) {
    _currentDef = def;
    _set('ev-type-badge',  def.type.toUpperCase());
    _set('ev-icon',        def.icon);
    _set('ev-title',       def.title);
    _set(
      'ev-location',
      def.type === 'game'
        ? ''
        : def.location
    );
    _set('ev-objective',   def.objective);
    _set('ev-description', def.description);

    const metaRow = document.getElementById('ev-meta-row');

    if (metaRow) {
      metaRow.style.display =
        def.type === 'game'
          ? 'none'
          : '';
    }

    const detailsSection =
      document.getElementById('ev-details-section');

    const detailsContainer =
      document.getElementById('ev-details');

    detailsContainer.innerHTML = '';

    if (def.details && Object.keys(def.details).length) {
      detailsSection.hidden = false;

      Object.entries(def.details).forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'ev-detail-row';

        row.innerHTML = `
          <span class="ev-detail-label">${label}</span>
          <span class="ev-detail-value">${value}</span>
        `;

        detailsContainer.appendChild(row);
      });
    } else {
      detailsSection.hidden = true;
    }

    const featuredSection =
      document.getElementById('ev-featured-section');

    const featuredContainer =
      document.getElementById('ev-featured-reasons');

    if (featuredContainer) {
      featuredContainer.innerHTML = '';
    }

    const featuredReasons =
      Array.isArray(def.featuredReasons)
        ? def.featuredReasons
        : [];


      if (
        featuredSection &&
        featuredContainer &&
        featuredReasons.length > 0
      ) {
      featuredSection.hidden = false;

      featuredReasons.forEach(reason => {
        const item = document.createElement('div');
        item.className = 'ev-featured-reason';

        item.innerHTML = `
          <span class="ev-featured-reason__marker">
            •
          </span>

          <span>
            ${reason}
          </span>
        `;

        featuredContainer.appendChild(item);
      });
    } else if (featuredSection) {
      featuredSection.hidden = true;
    }

    // Swap the type colour class on the screen element
    const screen = document.getElementById('event-screen');
    if (screen) {
      screen.className = screen.className
        .replace(/\bev-type--\S+/g, '')
        .trim();
      screen.classList.add(`ev-type--${def.type}`);
    }

    // Reset the "coming soon" toast
    const toast = document.getElementById('ev-begin-toast');
    if (toast) toast.hidden = true;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Open the event screen for a given catalog entry.
   * @param {string} eventId   — key in EVENT_CATALOG
   * @param {string} [origin]  — screen name to return to on Back (default 'hub')
   */
  function openEvent(eventId, origin = 'hub', eventData = null) {
    const catalogDef = EVENT_CATALOG[eventId];

        const def = eventData
        ? {
            /*
             * Preserve the canonical schedule identity and any
             * event-specific data such as id, eventId, date and focus.
             */
            ...catalogDef,
            ...eventData,

            title:
              eventData.label ||
              catalogDef?.title ||
              'Upcoming Event',
          type:
            eventData.type ||
            catalogDef?.type ||
            'event',
          icon:
            eventData.icon ||
            catalogDef?.icon ||
            '🏒',
          location:
            eventData.location ||
            catalogDef?.location ||
            '—',
          objective:
            eventData.objective ||
            catalogDef?.objective ||
            'Prepare for the event.',
          description:
            eventData.description ||
            catalogDef?.description ||
            'Review the event details before continuing.',
          details:
            eventData.details ||
            catalogDef?.details ||
            {},
        isFeatured:
          eventData.isFeatured ??
          catalogDef?.isFeatured ??
          false,

        featuredReasons:
          Array.isArray(eventData.featuredReasons)
            ? eventData.featuredReasons
            : Array.isArray(catalogDef?.featuredReasons)
              ? catalogDef.featuredReasons
              : []
        }
      : catalogDef;

    if (!def) {
      console.warn(
        `EventSystem.openEvent: unknown event "${eventId}"`
      );
      return;
    }

    _origin = origin;
    _populate(def);
    showScreen('event');
  }

  /** Which screen Back should return to. */
  function getOrigin() { return _origin; }

  /** Returns the catalog definition of the event currently on screen. */
  function getCurrentDef() { return _currentDef; }

  return { openEvent, getOrigin, getCurrentDef, EVENT_CATALOG };
})();

// ── Screen navigation ───────────────────────────────────────
function showScreen(screenName) {
  titleScreen.classList.add('screen--hidden');
  careerSavesScreen.classList.add('screen--hidden');
  creationScreen.classList.add('screen--hidden');
  summaryScreen.classList.add('screen--hidden');
  identityScreen.classList.add('screen--hidden');
  careerOverviewScreen.classList.add('screen--hidden');
  bedroomScreen.classList.add('screen--hidden');
  nhlTeamScreen.classList.add('screen--hidden');
  motivationScreen.classList.add('screen--hidden');
  archetypeScreen.classList.add('screen--hidden');
  backgroundScreen.classList.add('screen--hidden');
  arenaScreen.classList.add('screen--hidden');
  hubScreen.classList.add('screen--hidden');
  standingsScreen.classList.add('screen--hidden');
  teamProfileScreen.classList.add('screen--hidden');
  playerProfileScreen.classList.add('screen--hidden');
  fullStatsScreen.classList.add('screen--hidden');
  prospectsScreen.classList.add('screen--hidden');
  eventScreen.classList.add(
    'screen--hidden'
  );
  pregameMatchupScreen.classList.add(
    'screen--hidden'
  );
  liveGameScreen.classList.add(
    'screen--hidden'
  );

  eventResultsScreen.classList.add(
    'screen--hidden'
  );

  postgameSummaryScreen.classList.add(
    'screen--hidden'
  );

  boxScoreScreen.classList.add(
    'screen--hidden'
  );

  tryoutSummaryScreen.classList.add(
    'screen--hidden'
  );
  rosterRevealScreen.classList.add('screen--hidden');
  coachIntroScreen.classList.add('screen--hidden');
  coachResultsScreen.classList.add('screen--hidden');
  skatingEvalScreen.classList.add('screen--hidden');
  skatingResultsScreen.classList.add('screen--hidden');

  if (screenName === 'title')      titleScreen.classList.remove('screen--hidden');
  if (screenName === 'career-saves') careerSavesScreen.classList.remove('screen--hidden');
  if (screenName === 'creation')   creationScreen.classList.remove('screen--hidden');
  if (screenName === 'summary')    summaryScreen.classList.remove('screen--hidden');
  if (screenName === 'identity') {
    // Clear archetype if the saved choice is no longer valid for the current position
    if (Game.player.archetype && !isArchetypeValidForPosition(Game.player.archetype, Game.player.position)) {
      Game.player.archetype = '';
    }
    identityScreen.classList.remove('screen--hidden');
    updateIdentityScreen();
  }
  if (screenName === 'overview') {
    careerOverviewScreen.classList.remove('screen--hidden');
    updateCareerOverview();
  }
  if (screenName === 'bedroom') {
    bedroomScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'nhlteam') {
    nhlTeamScreen.classList.remove('screen--hidden');
    restoreNhlTeamSelection();
  }
  if (screenName === 'motivation') {
    motivationScreen.classList.remove('screen--hidden');
    restoreMotivationSelection();
  }
  if (screenName === 'archetype') {
    archetypeScreen.classList.remove('screen--hidden');
    filterArchetypeCards();
    restoreArchetypeSelection();
  }
  if (screenName === 'background') {
    backgroundScreen.classList.remove('screen--hidden');
    restoreBackgroundSelection();
  }
  if (screenName === 'arena') {
    arenaScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'hub') {
    hubScreen.classList.remove('screen--hidden');
    updateHubScreen();
  }
  if (screenName === 'standings') {
    standingsScreen.classList.remove('screen--hidden');
    renderStandingsScreen();
  }
  if (screenName === 'team-profile') {
    teamProfileScreen.classList.remove('screen--hidden');
    // Content already populated by openTeamProfile() before showScreen() is called
  }
  if (screenName === 'player-profile') {
    playerProfileScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'full-stats') {
    fullStatsScreen.classList.remove('screen--hidden');
    renderFullStatsScreen();
  }
  if (screenName === 'prospects') {
    prospectsScreen.classList.remove('screen--hidden');
    renderProspectsScreen();
  }
  if (screenName === 'event') {
    eventScreen.classList.remove('screen--hidden');
    // Content already populated by EventSystem.openEvent() before showScreen() is called
  }
  if (
    screenName ===
    'pregame-matchup'
  ) {
    pregameMatchupScreen
      .classList.remove(
        'screen--hidden'
      );
  }
  if (
    screenName ===
    'live-game'
  ) {
    liveGameScreen
      .classList.remove(
        'screen--hidden'
      );
  }
    if (
      screenName ===
      'event-results'
    ) {
      eventResultsScreen.classList.remove(
        'screen--hidden'
      );
    }

    if (
      screenName ===
      'postgame-summary'
    ) {
      postgameSummaryScreen.classList.remove(
        'screen--hidden'
      );
    }

    if (
      screenName ===
      'box-score'
    ) {
      boxScoreScreen.classList.remove(
        'screen--hidden'
      );
    }

    if (screenName === 'tryout-summary') {
    tryoutSummaryScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'roster-reveal') {
    rosterRevealScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'coach-intro') {
    coachIntroScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'coach-results') {
    coachResultsScreen.classList.remove('screen--hidden');
  } 
  if (screenName === 'skating-eval') {
    skatingEvalScreen.classList.remove('screen--hidden');
  }
  if (screenName === 'skating-results') {
    skatingResultsScreen.classList.remove('screen--hidden');
  }

  Game.screen = screenName;
  window.scrollTo(0, 0);
}

// ── Identity screen update ──────────────────────────────────
function setIdentityStatus(el, complete) {
  el.textContent = complete ? '🟢 COMPLETE' : '⚪ NOT SELECTED';
  el.classList.toggle('identity-card__status--complete', complete);
  el.classList.toggle('identity-card__status--empty',   !complete);
}

function updateIdentityBackground() {
  const selected = Game.player.background;
  identityBgStatus.textContent = selected || 'Not Selected';
  identityBgStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityArchetype() {
  const selected = Game.player.archetype;
  identityArchetypeStatus.textContent = selected || 'Not Selected';
  identityArchetypeStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityMotivation() {
  const selected = Game.player.motivation;
  identityMotivationStatus.textContent = selected || 'Not Selected';
  identityMotivationStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityNhlTeam() {
  const selected = Game.player.nhlTeam;
  identityNhlTeamStatus.textContent = selected || 'Not Selected';
  identityNhlTeamStatus.classList.toggle('identity-card__subtitle--selected', Boolean(selected));
}

function updateIdentityScreen() {
  updateIdentityBackground();
  updateIdentityArchetype();
  updateIdentityMotivation();
  updateIdentityNhlTeam();

  const bgDone    = Boolean(Game.player.background);
  const archDone  = Boolean(Game.player.archetype);
  const motivDone = Boolean(Game.player.motivation);
  const nhlDone   = Boolean(Game.player.nhlTeam);

  setIdentityStatus(statusBackground, bgDone);
  setIdentityStatus(statusArchetype,  archDone);
  setIdentityStatus(statusMotivation, motivDone);
  setIdentityStatus(statusNhlTeam,    nhlDone);

  const count = [bgDone, archDone, motivDone, nhlDone].filter(Boolean).length;
  identityCompleteCount.textContent = count;

  const allDone = count === 4;
  btnContinueSetup.disabled = !allDone;
  btnContinueSetup.classList.toggle('btn--primary',    allDone);
  btnContinueSetup.classList.toggle('btn--secondary', !allDone);
}

// ── Career Overview ─────────────────────────────────────────
function updateCareerOverview() {
  const p = Game.player;
  overviewPlayerName.textContent     = `${p.firstName} ${p.lastName}`;
  overviewPlayerPosition.textContent = `${p.position} · Shoots ${p.handedness}`;
  overviewPlayerHometown.textContent = p.hometown;
  overviewBackground.textContent     = p.background  || '—';
  overviewArchetype.textContent      = p.archetype   || '—';
  overviewMotivation.textContent     = p.motivation  || '—';
  overviewNhlTeam.textContent        = p.nhlTeam     || '—';
}

// ── Restore selection UI ────────────────────────────────────
function restoreBackgroundSelection() {
  const saved = Game.player.background;

  document.querySelectorAll('#background-screen .bg-card').forEach((card) => {
    card.classList.toggle('bg-card--selected', saved && card.dataset.background === saved);
  });

  const has = Boolean(saved);
  btnContinueBackground.disabled = !has;
  btnContinueBackground.classList.toggle('btn--primary',   has);
  btnContinueBackground.classList.toggle('btn--secondary', !has);
}

function restoreNhlTeamSelection() {
  const saved = Game.player.nhlTeam;

  document.querySelectorAll('#nhlteam-screen .team-card').forEach((card) => {
    card.classList.toggle('team-card--selected', saved && card.dataset.team === saved);
  });

  const has = Boolean(saved);
  btnContinueNhlTeam.disabled = !has;
  btnContinueNhlTeam.classList.toggle('btn--primary',   has);
  btnContinueNhlTeam.classList.toggle('btn--secondary', !has);
}

function restoreMotivationSelection() {
  const saved = Game.player.motivation;

  document.querySelectorAll('#motivation-screen .motivation-card').forEach((card) => {
    card.classList.toggle('motivation-card--selected', saved && card.dataset.motivation === saved);
  });

  const has = Boolean(saved);
  btnContinueMotivation.disabled = !has;
  btnContinueMotivation.classList.toggle('btn--primary',   has);
  btnContinueMotivation.classList.toggle('btn--secondary', !has);
}

function restoreArchetypeSelection() {
  const saved = Game.player.archetype;

  document.querySelectorAll('#archetype-screen .bg-card').forEach((card) => {
    card.classList.toggle('bg-card--selected', saved && card.dataset.archetype === saved);
  });

  const has = Boolean(saved);
  btnContinueArchetype.disabled = !has;
  btnContinueArchetype.classList.toggle('btn--primary',   has);
  btnContinueArchetype.classList.toggle('btn--secondary', !has);
}

// ── Ripple effect ───────────────────────────────────────────
function spawnRipple(button, event) {
  if (!button || button.disabled) return;

  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const size = Math.max(rect.width, rect.height);

  const ripple = document.createElement('span');
  ripple.className = 'ripple';

  ripple.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
  `;

  button.appendChild(ripple);

  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
}

// ── Player choice buttons ───────────────────────────────────
function handleChoiceButton(button) {
  const groupName = button.dataset.choiceGroup;
  const selectedValue = button.dataset.value;

  const buttonsInGroup = document.querySelectorAll(
    `[data-choice-group="${groupName}"]`
  );

  buttonsInGroup.forEach((choiceButton) => {
    choiceButton.classList.remove('choice-card--selected');
  });

  button.classList.add('choice-card--selected');

  if (groupName === 'position') {
    Game.player.position = selectedValue;
  }

  if (groupName === 'handedness') {
    Game.player.handedness = selectedValue;
  }

  formError.textContent = '';
}

// ── Player form ─────────────────────────────────────────────
function handlePlayerFormSubmit(event) {
  event.preventDefault();

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const hometown = hometownInput.value.trim();
  const height =
    document.getElementById('player-height')?.value ||
    `5'10"`;

  const weight =
    Number(
      document.getElementById('player-weight')?.value
    ) || 175;

  const jerseyNumber =
    Number(
      document.getElementById('player-jersey-number')?.value
    ) || 19;

  const shoots =
    Game.player.handedness === 'Right' ? 'R' : 'L';
  if (!firstName || !lastName || !hometown) {
    formError.textContent = 'Complete your name and hometown to continue.';
    return;
  }

  if (!Game.player.position) {
    formError.textContent = 'Choose your position to continue.';
    return;
  }

  if (!Game.player.handedness) {
    formError.textContent = 'Choose whether your player shoots left or right.';
    return;
  }

  Game.player.firstName = firstName;
  Game.player.lastName = lastName;
  Game.player.hometown = hometown;
  Game.player.height = height;
  Game.player.weight = weight;
  Game.player.jerseyNumber = jerseyNumber;
  Game.player.shoots = shoots;

  updateSummary();
  saveCareerPreview();
  showScreen('summary');
}

// ── Summary screen ──────────────────────────────────────────
function updateSummary() {
  summaryName.textContent =
    `${Game.player.firstName} ${Game.player.lastName}`;

  summaryDetails.textContent =
    `${Game.player.position} · Shoots ${Game.player.handedness}`;

  summaryHometown.textContent = Game.player.hometown;
}

// ── Save system ─────────────────────────────────────────────
function saveCareerPreview() {
  if (isDevSession) return;
  try {
    const playerPreview = {
      playerId:
        Game.player.playerId ||
        Game.player.id ||
        'career-player',

      id:
        Game.player.id ||
        Game.player.playerId ||
        'career-player',

      firstName:
        Game.player.firstName ||
        '',

      lastName:
        Game.player.lastName ||
        '',

      hometown:
        Game.player.hometown ||
        '',

      position:
        Game.player.position ||
        '',

      handedness:
        Game.player.handedness ||
        '',

      archetype:
        Game.player.archetype ||
        '',

      age:
        Number(
          Game.player.age
        ) || 14,

      year:
        Game.player.year ||
        'Freshman',

      stage:
        Game.player.stage ||
        'hub',

      tryoutsComplete:
        Game.player.tryoutsComplete ===
        true,

      teamId:
        Game.player.teamId ||
        Game.player.highSchoolTeamId ||
        null,

      highSchoolTeamId:
        Game.player.highSchoolTeamId ||
        Game.player.teamId ||
        null,

      currentDate:
        Game.player.currentDate ||
        WorldEngine.state
          .season
          ?.currentDate ||
        null,

      overall: Number(Game.player.overall) || null,
      startingOverall: Number(Game.player.startingOverall) || Number(Game.player.overall) || null,
      attributes: Game.player.attributes ? { ...Game.player.attributes } : null,
      startingLine: Game.player.startingLine || null,
      rosterSlot: Game.player.rosterSlot || null,
      lineupAssignment: Game.player.lineupAssignment ? { ...Game.player.lineupAssignment } : null,
      lineupStatus: Game.player.lineupStatus || null,
      overallTryoutScore: Number(Game.player.overallTryoutScore) || null,
      overallTryoutGrade: Game.player.overallTryoutGrade || null,
      tryoutResults: Game.player.tryoutResults ? JSON.parse(JSON.stringify(Game.player.tryoutResults)) : null,
      tryoutProfile: Game.player.tryoutProfile ? JSON.parse(JSON.stringify(Game.player.tryoutProfile)) : null,
      coachTrust: Number(Game.player.coachTrust) || null,
      reputationStars: Number(Game.player.reputationStars) || null,
      reputationPoints: Number(Game.player.reputationPoints) || null,
      teamLevel: Game.player.teamLevel || null,
    };

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: '0.0.3',
        savedAt:
          new Date()
            .toISOString(),

        player:
          playerPreview,

        worldRef:
          WorldEngine.state.id,
      })
    );

    updateContinueButton();
    updateDevShortcut(); // DEV SHORTCUT — remove with dev shortcut
  } catch (error) {
    console.error('[Project Ice] Save failed:', error);
  }
}

function syncCareerPlayerWithWorld() {
  const playerTeamId =
    Game.player.teamId ||
    Game.player.highSchoolTeamId ||
    null;

  if (!playerTeamId) {
    return null;
  }

  const careerPlayerId =
    Game.player.playerId ||
    Game.player.id ||
    'career-player';

  const existingPlayer =
    WorldEngine.getPlayerById(
      careerPlayerId
    );

  /*
   * The canonical player already exists.
   * Synchronize Game.player from that record without
   * regenerating attributes or changing lineup placement.
   */
  if (existingPlayer) {
    Game.player = {
      ...Game.player,
      ...existingPlayer,

      attributes: {
        ...(existingPlayer.attributes || {}),
      },

      seasonStats: {
        ...(existingPlayer.seasonStats || {}),
      },

      careerStats: {
        ...(existingPlayer.careerStats || {}),
      },

      development: {
        ...(existingPlayer.development || {}),
      },

      history: {
        ...(existingPlayer.history || {}),

        seasons: Array.isArray(
          existingPlayer.history?.seasons
        )
          ? [...existingPlayer.history.seasons]
          : [],

        teams: Array.isArray(
          existingPlayer.history?.teams
        )
          ? [...existingPlayer.history.teams]
          : [],

        transactions: Array.isArray(
          existingPlayer.history?.transactions
        )
          ? [...existingPlayer.history.transactions]
          : [],

        lineupChanges: Array.isArray(
          existingPlayer.history?.lineupChanges
        )
          ? [...existingPlayer.history.lineupChanges]
          : [],

        awards: Array.isArray(
          existingPlayer.history?.awards
        )
          ? [...existingPlayer.history.awards]
          : [],

        championships: Array.isArray(
          existingPlayer.history?.championships
        )
          ? [...existingPlayer.history.championships]
          : [],

        milestones: Array.isArray(
          existingPlayer.history?.milestones
        )
          ? [...existingPlayer.history.milestones]
          : [],

        records: Array.isArray(
          existingPlayer.history?.records
        )
          ? [...existingPlayer.history.records]
          : [],
      },
    };

    WorldEngine.refreshTeamRosterManagement(
      existingPlayer.teamId
    );

    return existingPlayer;
  }

  /*
   * Migration path for saves created before the career
   * player became a canonical World Engine roster member.
   */
  const canonicalPlayer =
    WorldEngine.upsertCareerPlayer({
      ...Game.player,

      id: careerPlayerId,
      playerId: careerPlayerId,

      teamId: playerTeamId,
    });

  if (!canonicalPlayer) {
    return null;
  }

  Game.player = {
    ...Game.player,
    ...canonicalPlayer,

    attributes: {
      ...(canonicalPlayer.attributes || {}),
    },

    seasonStats: {
      ...(canonicalPlayer.seasonStats || {}),
    },

    careerStats: {
      ...(canonicalPlayer.careerStats || {}),
    },

    development: {
      ...(canonicalPlayer.development || {}),
    },

    history: {
      ...(canonicalPlayer.history || {}),

      seasons: Array.isArray(
        canonicalPlayer.history?.seasons
      )
        ? [...canonicalPlayer.history.seasons]
        : [],

      teams: Array.isArray(
        canonicalPlayer.history?.teams
      )
        ? [...canonicalPlayer.history.teams]
        : [],

      transactions: Array.isArray(
        canonicalPlayer.history?.transactions
      )
        ? [...canonicalPlayer.history.transactions]
        : [],

      lineupChanges: Array.isArray(
        canonicalPlayer.history?.lineupChanges
      )
        ? [...canonicalPlayer.history.lineupChanges]
        : [],

      awards: Array.isArray(
        canonicalPlayer.history?.awards
      )
        ? [...canonicalPlayer.history.awards]
        : [],

      championships: Array.isArray(
        canonicalPlayer.history?.championships
      )
        ? [...canonicalPlayer.history.championships]
        : [],

      milestones: Array.isArray(
        canonicalPlayer.history?.milestones
      )
        ? [...canonicalPlayer.history.milestones]
        : [],

      records: Array.isArray(
        canonicalPlayer.history?.records
      )
        ? [...canonicalPlayer.history.records]
        : [],
    },
  };

  return canonicalPlayer;
}

/*
 * ============================================================
 * CAREER LOAD — SCHEDULE MIGRATION
 * ============================================================
 *
 * Older saves may contain only the original game schedule.
 * Newer builds also require Practice, Recovery, Training,
 * meetings, etc.
 *
 * Rebuild the canonical season schedule, then preserve all
 * existing completion/results data from the saved world.
 */
function ensureCareerScheduleEventsOnLoad() {
  const existingSchedule =
    Array.isArray(
      WorldEngine.state.schedule
    )
      ? WorldEngine.state.schedule
      : [];

  const hasCareerEvents =
    existingSchedule.some(event =>
      [
        'practice',
        'recovery',
        'training',
      ].includes(
        String(
          event?.type || ''
        ).toLowerCase()
      )
    );

  /*
   * Current saves that already contain the expanded schedule
   * need no migration.
   */
  const latestGameDate = existingSchedule.filter(e => String(e?.type || '').toLowerCase() === 'game').reduce((m,e) => String(e?.date || '') > m ? String(e.date) : m, '');
  const latestCareerDate = existingSchedule.filter(e => ['practice','recovery','training'].includes(String(e?.type || '').toLowerCase())).reduce((m,e) => String(e?.date || '') > m ? String(e.date) : m, '');

  if (hasCareerEvents && (!latestGameDate || latestCareerDate >= latestGameDate)) {
    return false;
  }

  const rebuiltSchedule =
    WorldEngine
      .createHighSchoolCareerSchedule(
        WorldEngine.state.teams
      );

  if (
    !Array.isArray(rebuiltSchedule) ||
    rebuiltSchedule.length === 0
  ) {
    console.error(
      '[Career Load] Could not rebuild canonical schedule.'
    );

    return false;
  }

  /*
   * Match an old event to its regenerated counterpart.
   *
   * Prefer permanent IDs. Fall back to date/type/team matchup
   * for older game records whose identifiers may differ.
   */
  const findExistingEvent =
    newEvent => {
      const newIds = [
        newEvent?.eventId,
        newEvent?.gameId,
        newEvent?.id,
      ]
        .filter(Boolean)
        .map(String);

      const byId =
        existingSchedule.find(
          existingEvent => {
            const existingIds = [
              existingEvent?.eventId,
              existingEvent?.gameId,
              existingEvent?.id,
            ]
              .filter(Boolean)
              .map(String);

            return newIds.some(id =>
              existingIds.includes(id)
            );
          }
        );

      if (byId) {
        return byId;
      }

      return (
        existingSchedule.find(
          existingEvent =>
            String(
              existingEvent?.date || ''
            ) ===
              String(
                newEvent?.date || ''
              ) &&
            String(
              existingEvent?.type || ''
            ) ===
              String(
                newEvent?.type || ''
              ) &&
            String(
              existingEvent?.homeTeamId ||
              ''
            ) ===
              String(
                newEvent?.homeTeamId ||
                ''
              ) &&
            String(
              existingEvent?.awayTeamId ||
              ''
            ) ===
              String(
                newEvent?.awayTeamId ||
                ''
              )
        ) ||
        null
      );
    };

  WorldEngine.state.schedule =
    rebuiltSchedule.map(
      newEvent => {
        const existingEvent =
          findExistingEvent(
            newEvent
          );

        if (!existingEvent) {
          return newEvent;
        }

        /*
         * Keep the regenerated event definition, but preserve
         * all saved progress/results from the old record.
         */
        return {
          ...newEvent,
          ...existingEvent,

          /*
           * Preserve canonical identity fields from the new
           * schedule when the old save did not contain them.
           */
          eventId:
            existingEvent.eventId ||
            newEvent.eventId,

          gameId:
            existingEvent.gameId ||
            newEvent.gameId,

          id:
            existingEvent.id ||
            newEvent.id,
        };
      }
    );

  WorldEngine.save();

  console.log(
    '[Career Load] Expanded schedule migrated successfully.'
  );

  return true;
}

    function loadCareerPreview() {
      try {
        const savedCareer =
          localStorage.getItem(
            SAVE_KEY
          );

        if (savedCareer) {
          const parsedCareer =
            JSON.parse(
              savedCareer
            );

          if (
            parsedCareer?.player
          ) {
            Game.player = {
              ...Game.player,
              ...parsedCareer.player,
            };
          }
        } else {
          /*
           * No localStorage preview exists.
           *
           * Recover directly from the canonical IndexedDB world.
           */
          const recovered =
            recoverCareerPreviewFromWorld();

          if (!recovered) {
            console.error(
              '[Project Ice] No recoverable career exists in the loaded world.'
            );

            return;
          }
        }
    Game.player.currentDate =
      WorldEngine.state.player?.currentDate ||
      Game.player.currentDate ||
      '2026-09-01';

    syncCareerPlayerWithWorld();

    /*
     * Make normal Continue Career use the same complete
     * season architecture as a newly initialized career.
     */
    ensureCareerScheduleEventsOnLoad();

    refreshScheduleEvents();

    // ── Route based on career stage ───────────────────────────
    // 'hub' stage → tryouts are done; skip the intro sequence.
    if (Game.player.stage === 'hub') {
        refreshCareerUI();
        showScreen('hub');

        ensureHubLiveGameDiagnosticButton();

        return;
    }

    // Still in creation flow — restore form state and resume at summary.
    firstNameInput.value = Game.player.firstName || '';
    lastNameInput.value = Game.player.lastName || '';
    hometownInput.value = Game.player.hometown || '';

    restoreSelectedChoice('position', Game.player.position);
    restoreSelectedChoice('handedness', Game.player.handedness);

    updateSummary();
    showScreen('summary');
  } catch (error) {
    console.error('[Project Ice] Load failed:', error);
  }
}

function deleteCareerPreview() {
  const confirmed = window.confirm(
    'Delete your saved Project Ice career preview?'
  );

  if (!confirmed) return;

  localStorage.removeItem(SAVE_KEY);
  resetPlayer();
  updateContinueButton();
  updateDevShortcut(); // DEV SHORTCUT — remove with dev shortcut
  showScreen('title');
}

function restoreSelectedChoice(groupName, selectedValue) {
  const choices = document.querySelectorAll(
    `[data-choice-group="${groupName}"]`
  );

  choices.forEach((choice) => {
    const isSelected = choice.dataset.value === selectedValue;

    choice.classList.toggle('choice-card--selected', isSelected);
  });
}

/*
 * ============================================================
 * CAREER EXISTENCE — CANONICAL WORLD CHECK
 * ============================================================
 *
 * IndexedDB / WorldEngine is now the source of truth.
 *
 * The old projectice_save localStorage record is only a
 * compatibility/preview cache and must never be required in
 * order to continue an existing career.
 */
function hasCanonicalCareerWorld() {
  const directCareerPlayer =
    WorldEngine.getPlayerById(
      'career-player'
    );

  if (directCareerPlayer) {
    return true;
  }

  for (
    const team of
    WorldEngine.state.teams || []
  ) {
    const found =
      (
        team.roster || []
      ).some(
        player =>
          player?.isCareerPlayer ===
            true ||
          String(
            player?.id ||
            player?.playerId ||
            ''
          ) ===
            'career-player'
      );

    if (found) {
      return true;
    }
  }

  return false;
}

  function updateContinueButton() {
    const hasSave =
      Boolean(
        localStorage.getItem(
          SAVE_KEY
        )
      ) ||
      hasCanonicalCareerWorld() ||
      (() => {
        try {
          const saves = JSON.parse(localStorage.getItem('projectice_career_save_index_v1') || '[]');
          return Array.isArray(saves) && saves.length > 0;
        } catch (_) {
          return false;
        }
      })();

  btnContinue.disabled = !hasSave;

  if (hasSave) {
    btnContinue.classList.remove('btn--secondary');
    btnContinue.classList.add('btn--primary');

    btnContinue.innerHTML = `
      <span class="btn__icon">📁</span>
      <span class="btn__label">Continue Career</span>
      <span class="btn__arrow">›</span>
    `;
  } else {
    btnContinue.classList.remove('btn--primary');
    btnContinue.classList.add('btn--secondary');

    btnContinue.innerHTML = `
      <span class="btn__icon">📁</span>
      <span class="btn__label">Continue Career</span>
      <span class="btn__tag">No Save Found</span>
    `;
  }
}

// ── DEV SHORTCUT — TEMPORARY, REMOVE BEFORE RELEASE ──────────────────────────
// Enables the "Skip to Career Hub" button only when a saved career exists.
// Does not alter save data, career stage, or tryout completion state.
function updateDevShortcut() {
  const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
  btnDevHub.disabled = !hasSave;
  devShortcutHint.classList.toggle('is-visible', !hasSave);
}
// ─────────────────────────────────────────────────────────────────────────────

function resetPlayer() {
  Game.player = {
    firstName: '',
    lastName: '',
    hometown: '',
    position: '',
    handedness: '',
    background: '',
    archetype: '',
    motivation: '',
    nhlTeam: '',
    age: 14,
    careerStart: 2022,
  };

  playerForm.reset();

  document.querySelectorAll('.choice-card').forEach((choice) => {
    choice.classList.remove('choice-card--selected');
  });

  formError.textContent = '';
}

// ── Event listeners ─────────────────────────────────────────
btnNewCareer.addEventListener('pointerdown', (event) => {
  spawnRipple(btnNewCareer, event);
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function renderCareerSaveSelection() {
  let saves = await WorldEngine.listCareerSaves();

  /*
   * The old lightweight preview is a last-resort recovery source only.
   * If a career reached Hub but its IndexedDB/index write was interrupted,
   * rebuild that official career instead of forcing the player to redo tryouts.
   */
  try {
    const rawPreview = localStorage.getItem(SAVE_KEY);
    const previewPlayer = rawPreview
      ? JSON.parse(rawPreview)?.player
      : null;

    const previewName = previewPlayer
      ? `${previewPlayer.firstName || ''} ${previewPlayer.lastName || ''}`.trim()
      : '';
    const previewTeamId = previewPlayer?.teamId || previewPlayer?.highSchoolTeamId || null;
    const previewIsOfficial = Boolean(
      previewName &&
      previewTeamId &&
      (
        previewPlayer?.stage === 'hub' ||
        previewPlayer?.tryoutsComplete === true
      )
    );
    const previewAlreadyListed = previewIsOfficial && saves.some(save =>
      String(save?.playerName || '').trim().toLowerCase() === previewName.toLowerCase()
    );

    if (
      previewIsOfficial &&
      !previewAlreadyListed &&
      typeof WorldEngine.recoverOfficialCareerFromPreview === 'function'
    ) {
      const recovered = await WorldEngine.recoverOfficialCareerFromPreview(previewPlayer);
      if (recovered) {
        saves = await WorldEngine.listCareerSaves();
      }
    }
  } catch (error) {
    console.warn('[Project Ice] Career preview recovery was unavailable:', error);
  }

  careerSaveList.innerHTML = '';
  careerSaveCount.textContent = `${saves.length} ${saves.length === 1 ? 'Save' : 'Saves'}`;

  saves.forEach(save => {
    const shell = document.createElement('div');
    shell.className = 'career-save-card-shell';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'career-save-card';
    const dateLabel = save.currentDate ? new Date(`${save.currentDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Career in progress';
    const details = [save.position, save.teamName, save.overall ? `${save.overall} OVR` : ''].filter(Boolean).join(' • ');
    card.innerHTML = `
      <div class="career-save-card__top">
        <div>
          <p class="career-save-card__name">${escapeHtml(save.playerName || 'Project Ice Career')}</p>
          <p class="career-save-card__details">${escapeHtml(details || 'High School Career')}</p>
        </div>
        <span class="career-save-card__arrow">›</span>
      </div>
      <div class="career-save-card__meta">
        <span>${escapeHtml(save.seasonLabel || 'Season 1')}</span>
        <span>${escapeHtml(dateLabel)}</span>
      </div>
    `;
    card.addEventListener('click', async () => {
      card.disabled = true;
      const loaded = await WorldEngine.selectCareerSave(save.id);
      if (!loaded) { card.disabled = false; return; }
      localStorage.removeItem(SAVE_KEY);
      recoverCareerPreviewFromWorld();
      loadCareerPreview();
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'career-save-delete';
    deleteButton.setAttribute('aria-label', `Delete ${save.playerName || 'career'}`);
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const playerName = save.playerName || 'this career';
      const confirmed = window.confirm(`Delete ${playerName}? This cannot be undone.`);
      if (!confirmed) return;

      deleteButton.disabled = true;
      card.disabled = true;
      const deleted = await WorldEngine.deleteCareerSave(save.id);
      if (!deleted) {
        deleteButton.disabled = false;
        card.disabled = false;
        return;
      }

      await renderCareerSaveSelection();
      updateContinueButton();
    });

    shell.appendChild(card);
    shell.appendChild(deleteButton);
    careerSaveList.appendChild(shell);
  });

  showScreen('career-saves');
}

btnNewCareer.addEventListener('click', async () => {
  btnNewCareer.disabled = true;
  await WorldEngine.beginNewCareerSave();
  localStorage.removeItem(SAVE_KEY);
  resetPlayer();
  btnNewCareer.disabled = false;
  showScreen('creation');
});

btnContinue.addEventListener('click', () => {
  renderCareerSaveSelection();
});

if (btnBackCareerSaves) {
  btnBackCareerSaves.addEventListener('click', () => {
    updateContinueButton();
    showScreen('title');
  });
}

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

    /*
     * Always enter Schedule on the career's canonical current month.
     * Manual month navigation still works normally after the tab opens.
     */
    const scheduleCurrentDate =
      WorldEngine.state?.season?.currentDate ||
      Game.player?.currentDate ||
      null;

    const scheduleDateMatch =
      String(scheduleCurrentDate || '')
        .match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (scheduleDateMatch) {
      scheduleViewYear =
        Number(scheduleDateMatch[1]);

      scheduleViewMonth =
        Math.max(
          0,
          Math.min(
            11,
            Number(scheduleDateMatch[2]) - 1
          )
        );
    }

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
    renderLeagueNewsPreview();
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
    document.querySelectorAll('#motivation-screen .motivation-card').forEach((c) =>
      c.classList.remove('motivation-card--selected')
    );
    card.classList.add('motivation-card--selected');
    Game.player.motivation = card.dataset.motivation;
    btnContinueMotivation.disabled = false;
    btnContinueMotivation.classList.remove('btn--secondary');
    btnContinueMotivation.classList.add('btn--primary');
  });
});

btnIdentityMotivation.addEventListener('click', () => {
  showScreen('motivation');
});

btnBackIdentityMotivation.addEventListener('click', () => {
  showScreen('identity');
});

btnContinueMotivation.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

btnContinueSummary.addEventListener('click', () => {
  saveCareerPreview();
  showScreen('identity');
});

btnContinueSetup.addEventListener('click', () => {
  showScreen('overview');
});

btnBackOverview.addEventListener('click', () => {
  showScreen('identity');
});

btnBeginCareer.addEventListener('click', () => {
  runIntroSequence();
});

// ── Bedroom interactions ────────────────────────────────────
let brToastTimer = null;

function showBedroomToast(message) {
  const toast = document.getElementById('br-toast');
  toast.textContent = message;
  toast.classList.add('br__toast--visible');
  clearTimeout(brToastTimer);
  brToastTimer = setTimeout(() => {
    toast.classList.remove('br__toast--visible');
  }, 3800);
}

document.querySelector('.br__bag').addEventListener('click', () => {
  showBedroomToast('Everything is packed for tomorrow\'s tryouts.');
});

document.querySelector('.br__stick-wrap').addEventListener('click', () => {
  showBedroomToast('You\'ve practiced with this stick almost every day this summer.');
});

document.querySelector('.br__phone').addEventListener('click', () => {
  const overlay = document.getElementById('messages-overlay');
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
});

document.getElementById('btn-close-messages').addEventListener('click', () => {
  const overlay = document.getElementById('messages-overlay');
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
});

function openSleepModal() {
  const modal = document.getElementById('sleep-modal');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

document.querySelector('.br__mattress').addEventListener('click', openSleepModal);
document.querySelector('.br__headboard').addEventListener('click', openSleepModal);

document.getElementById('btn-sleep-no').addEventListener('click', () => {
  const modal = document.getElementById('sleep-modal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
});

document.getElementById('btn-sleep-yes').addEventListener('click', async () => {
  const modal = document.getElementById('sleep-modal');
  modal.classList.remove('is-open');
  await sleep(250);
  await runSleepSequence();
});

async function runSleepSequence() {
  const overlay = document.getElementById('cinematic-overlay');
  const text    = document.getElementById('cinematic-text');

  // Fade to black
  overlay.classList.add('is-active');
  await sleep(1100);

  // Card 1 — Date
  text.innerHTML = '<span class="cin-date">September 4, 2022</span>';
  text.style.opacity = '1';
  await sleep(2000);
  text.style.opacity = '0';
  await sleep(560);
  text.innerHTML = '';

  // Card 2 — Event + Venue
  text.innerHTML = '<span class="cin-title">Freshman Tryouts</span><span class="cin-venue">Ice Den Arena</span>';
  text.style.opacity = '1';
  await sleep(2000);
  text.style.opacity = '0';
  await sleep(560);
  text.innerHTML = '';

  // Reveal arena screen, fade overlay out
  showScreen('arena');
  overlay.classList.remove('is-active');
  await sleep(1100);

  // Begin dialogue sequence
  runArenaDialogue();
}

async function runArenaDialogue() {
  await sleep(3000); // brief moment to take in the scene

  const dialogueEl = document.getElementById('arena-dialogue');
  const approachEl = document.getElementById('dlg-approach');
  const bubbleEl   = document.getElementById('dlg-bubble');
  const speakerEl  = document.getElementById('dlg-speaker');
  const textEl     = document.getElementById('dlg-text');
  const actionEl   = document.getElementById('arena-action');

  // Slide panel up with approach description
  dialogueEl.classList.add('is-visible');
  dialogueEl.setAttribute('aria-hidden', 'false');
  await sleep(1800);

  // Swap approach text for dialogue bubble
  approachEl.style.transition = 'opacity 0.3s ease';
  approachEl.style.opacity = '0';
  await sleep(320);
  approachEl.style.display = 'none';
  bubbleEl.style.display = 'flex';

  async function showLine(speaker, cssClass, line) {
    speakerEl.textContent = speaker;
    speakerEl.className = 'arena-dialogue__speaker ' + cssClass;
    textEl.style.opacity = '0';
    textEl.textContent = line;
    await sleep(60);
    textEl.style.opacity = '1';
  }

  // Line 1 — Coach Reynolds
  await showLine('Coach Reynolds', 'arena-dialogue__speaker--coach',
    `"You must be ${Game.player.lastName || 'you'}."`);
  await sleep(2600);

  // Line 2 — Player
  await showLine(Game.player.firstName || 'You', 'arena-dialogue__speaker--player',
    '"Yes, sir."');
  await sleep(2000);

  // Line 3 — Coach Reynolds
  await showLine('Coach Reynolds', 'arena-dialogue__speaker--coach',
    '"Good. Grab a jersey and get on the ice. We\'ll see what you\'ve got."');
  await sleep(3000);

  // Dismiss dialogue, show CTA
  dialogueEl.classList.remove('is-visible');
  await sleep(450);
  actionEl.classList.add('is-visible');
  actionEl.setAttribute('aria-hidden', 'false');
}

document.getElementById('btn-take-ice').addEventListener('click', () => {
  // Launch the Freshman Tryouts event via the Event System.
  // EventSystem.openEvent handles the transition — no cinematic needed here,
  // the event screen is the player's gateway to the tryout.
  EventSystem.openEvent('tryout-freshman', 'arena');
});

// ── News System ──────────────────────────────────────────────
// NewsSystem is now a thin alias for WorldEngine.news.
// All existing call sites (NewsSystem.publish, NewsSystem.getRecent)
// work without modification. The news feed lives in the World Engine
// and is persisted with world state, not the player save.
// See public/world.js for the full implementation.
const NewsSystem = WorldEngine.news;

function renderHubNews() {
  const container = document.getElementById('hub-news-list');
  if (!container) return;
  const items = NewsSystem.getRecent(3);
  container.innerHTML = items.map(item => `
    <div class="hub-news__item">
      <span class="hub-news__tag">${item.tag}</span>
      <span class="hub-news__headline">${item.headline}</span>
    </div>
  `).join('');
}


function renderLeagueNewsPreview() {
  const container = document.getElementById('league-news-preview');
  if (!container) return;

  const items = NewsSystem.getRecent(8);

  if (!items.length) {
    container.innerHTML = `
      <div class="league-news-feed__empty">
        No major league stories yet.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="league-news-feed">
      ${items.map(item => `
        <article class="league-news-card">
          <div class="league-news-card__meta">
            <span class="league-news-card__tag">${item.tag || 'LEAGUE'}</span>
            <span class="league-news-card__date">${item.date || ''}</span>
          </div>
          <strong class="league-news-card__headline">
            ${item.headline || ''}
          </strong>
        </article>
      `).join('')}
    </div>
  `;
}


function renderFullNewsScreen() {
  const container = document.getElementById('full-news-list');
  const countEl = document.getElementById('full-news-count');
  if (!container) return;

  const items = NewsSystem.getRecent(100);
  if (countEl) countEl.textContent = String(items.length);

  if (!items.length) {
    container.innerHTML = `
      <div class="full-news-list__empty">
        No league stories yet.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <article class="full-news-item">
      <div class="full-news-item__meta">
        <span class="full-news-item__tag">${item.tag || 'LEAGUE'}</span>
        <span class="full-news-item__date">${item.date || ''}</span>
      </div>
      <strong class="full-news-item__headline">
        ${item.headline || ''}
      </strong>
    </article>
  `).join('');
}

function openFullNewsScreen() {
  const screen = document.getElementById('full-news-screen');
  if (!screen) return;
  renderFullNewsScreen();
  screen.classList.add('is-open');
  screen.setAttribute('aria-hidden', 'false');
  document.body.classList.add('full-news-open');
}

function closeFullNewsScreen() {
  const screen = document.getElementById('full-news-screen');
  if (!screen) return;
  screen.classList.remove('is-open');
  screen.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('full-news-open');
}

['btn-hub-view-all-news', 'btn-league-view-all-news']
  .forEach(id => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', openFullNewsScreen);
  });

const fullNewsBackButton = document.getElementById('btn-back-full-news');
if (fullNewsBackButton) {
  fullNewsBackButton.addEventListener('click', closeFullNewsScreen);
}

// Register the hub re-render callback with the World Engine news system.
// WorldEngine.news.publish() will call renderHubNews() automatically
// whenever a new headline is added — without world.js touching the DOM.
WorldEngine.news.onNewsChange(() => {
  renderHubNews();
  renderLeagueNewsPreview();

  const fullNewsScreen = document.getElementById('full-news-screen');
  if (fullNewsScreen?.classList.contains('is-open')) {
    renderFullNewsScreen();
  }
});

// ── Team Profile ─────────────────────────────────────────────
// One reusable screen shared by both standings entry points.
// _teamProfileOrigin controls where the Back button returns to.

let _teamProfileOrigin = 'hub';  // 'hub' | 'standings'
let _playerProfileOrigin = 'team-profile';
let _activePlayerProfile = null;

/** Convert a numeric prestige (1-5) to a star string. */
function prestigeStars(n) {
  const filled = Math.max(0, Math.min(5, n));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}
function buildTeamLineupMarkup(roster = []) {
  const safeRoster =
    Array.isArray(roster)
      ? roster
      : [];

  const getPlayerBySlot = slot =>
    safeRoster.find(
      player =>
        (player.rosterSlot || player.slot) === slot
    );

  const getLeadershipBadge = player => {
    if (!player) return '';

    if (player.captain) {
      return `
        <span
          class="lineup-player__leadership tp-roster-leadership-badge"
          aria-label="Captain"
          title="Captain"
        >
          C
        </span>
      `;
    }

    if (player.alternateCaptain) {
      return `
        <span
          class="lineup-player__leadership tp-roster-leadership-badge"
          aria-label="Alternate captain"
          title="Alternate Captain"
        >
          A
        </span>
      `;
    }

    return '';
  };

  const getPlayerCard = player => {
    if (!player) {
      return `
        <div class="lineup-player lineup-player--empty">
          Empty
        </div>
      `;
    }

    const fullName =
      `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
      'Unknown Player';

    const rawPosition =
      String(player.position || '—')
        .trim()
        .toUpperCase();

    const positionMap = {
      CENTER: 'C',
      FORWARD: 'C',
      'LEFT WING': 'LW',
      LEFTWING: 'LW',
      'RIGHT WING': 'RW',
      RIGHTWING: 'RW',
      DEFENSE: 'D',
      DEFENCEMAN: 'D',
      DEFENSEMAN: 'D',
      GOALIE: 'G',
      GOALTENDER: 'G'
    };

    const position =
      positionMap[rawPosition] ||
      rawPosition;
    const overall = Number(player.overall) || 0;
    const playerId =
      player.playerId ||
      player.id ||
      '';

    return `
      <button
  class="team-roster__player lineup-player ${
    player.isCareerPlayer
      ? 'career-player-highlight'
      : ''
  }"
  type="button"
  data-player-id="${playerId}"
>
        <span class="lineup-player__position">
          ${position}
        </span>

        <span class="lineup-player__name">
          ${fullName}
          ${getLeadershipBadge(player)}
        </span>

        <span class="lineup-player__overall">
          ${overall} OVR
        </span>
      </button>
    `;
  };

  return `
    <section class="lineup-section">
      <h3 class="lineup-section__title">
        Forwards
      </h3>

      ${[1, 2, 3, 4].map(lineNumber => `
        <div class="lineup-unit">
          <div class="lineup-unit__label">
            Line ${lineNumber}
          </div>

          <div class="lineup-unit__players lineup-unit__players--three">
            ${getPlayerCard(
              getPlayerBySlot(`fwd-${lineNumber}-lw`)
            )}

            ${getPlayerCard(
              getPlayerBySlot(`fwd-${lineNumber}-c`)
            )}

            ${getPlayerCard(
              getPlayerBySlot(`fwd-${lineNumber}-rw`)
            )}
          </div>
        </div>
      `).join('')}
    </section>

    <section class="lineup-section">
      <h3 class="lineup-section__title">
        Defense
      </h3>

      ${[1, 2, 3].map(pairNumber => `
        <div class="lineup-unit">
          <div class="lineup-unit__label">
            Pair ${pairNumber}
          </div>

          <div class="lineup-unit__players lineup-unit__players--two">
            ${getPlayerCard(
              getPlayerBySlot(`def-${pairNumber}-ld`)
            )}

            ${getPlayerCard(
              getPlayerBySlot(`def-${pairNumber}-rd`)
            )}
          </div>
        </div>
      `).join('')}
    </section>

    <section class="lineup-section">
      <h3 class="lineup-section__title">
        Goaltenders
      </h3>

      <div class="lineup-unit">
        <div class="lineup-unit__players lineup-unit__players--two">
          <div class="lineup-goalie">
            <div class="lineup-unit__label">
              Starter
            </div>

            ${getPlayerCard(
              getPlayerBySlot('g-starter')
            )}
          </div>

          <div class="lineup-goalie">
            <div class="lineup-unit__label">
              Backup
            </div>

            ${getPlayerCard(
              getPlayerBySlot('g-backup')
            )}
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildTeamSpecialTeamsMarkup(
  team = {},
  roster = []
) {
  const safeRoster =
    Array.isArray(roster)
      ? roster
      : [];

  const getPlayerById = playerId => {
    if (!playerId) return null;

    return (
      safeRoster.find(player => {
        const rosterPlayerId =
          player.playerId ||
          player.id ||
          null;

        return (
          String(rosterPlayerId) ===
          String(playerId)
        );
      }) || null
    );
  };

  const getLeadershipBadge = player => {
    if (!player) return '';

    if (player.captain) {
      return `
        <span
          class="lineup-player__leadership tp-roster-leadership-badge"
          aria-label="Captain"
          title="Captain"
        >
          C
        </span>
      `;
    }

    if (player.alternateCaptain) {
      return `
        <span
          class="lineup-player__leadership tp-roster-leadership-badge"
          aria-label="Alternate captain"
          title="Alternate Captain"
        >
          A
        </span>
      `;
    }

    return '';
  };

  const getPlayerCard = (
    player,
    roleLabel
  ) => {
    if (!player) {
      return `
        <div
          class="lineup-player lineup-player--empty"
        >
          <span class="lineup-player__position">
            ${roleLabel}
          </span>

          <span class="lineup-player__name">
            Unassigned
          </span>
        </div>
      `;
    }

    const fullName =
      `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
      'Unknown Player';

    const playerId =
      player.playerId ||
      player.id ||
      '';

    const overall =
      Number(player.overall) || 0;

    return `
      <button
        class="team-roster__player lineup-player ${
          player.isCareerPlayer
            ? 'career-player-highlight'
            : ''
        }"
        type="button"
        data-player-id="${playerId}"
      >
        <span class="lineup-player__position">
          ${roleLabel}
        </span>

        <span class="lineup-player__name">
          ${fullName}
          ${getLeadershipBadge(player)}
        </span>

        <span class="lineup-player__overall">
          ${overall} OVR
        </span>
      </button>
    `;
  };

  const powerPlay =
    Array.isArray(
      team.specialTeams?.powerPlay
    )
      ? team.specialTeams.powerPlay
      : [];

  const penaltyKill =
    Array.isArray(
      team.specialTeams?.penaltyKill
    )
      ? team.specialTeams.penaltyKill
      : [];

  const buildPowerPlayUnit = (
    unit,
    unitNumber
  ) => {
    const slots =
      unit?.slots || {};

    return `
      <div class="lineup-unit special-teams-unit">
        <div class="lineup-unit__label">
          PP${unitNumber}
        </div>

        <div class="special-teams-unit__players special-teams-unit__players--power-play">
          ${getPlayerCard(
            getPlayerById(slots.leftFlank),
            'Left Flank'
          )}

          ${getPlayerCard(
            getPlayerById(slots.bumper),
            'Bumper'
          )}

          ${getPlayerCard(
            getPlayerById(slots.rightFlank),
            'Right Flank'
          )}

          ${getPlayerCard(
            getPlayerById(slots.netFront),
            'Net Front'
          )}

          ${getPlayerCard(
            getPlayerById(slots.quarterback),
            'Quarterback'
          )}
        </div>
      </div>
    `;
  };

  const buildPenaltyKillUnit = (
    unit,
    unitNumber
  ) => {
    const slots =
      unit?.slots || {};

    return `
      <div class="lineup-unit special-teams-unit">
        <div class="lineup-unit__label">
          PK${unitNumber}
        </div>

        <div class="special-teams-unit__players special-teams-unit__players--penalty-kill">
          ${getPlayerCard(
            getPlayerById(slots.forward1),
            'Forward'
          )}

          ${getPlayerCard(
            getPlayerById(slots.forward2),
            'Forward'
          )}

          ${getPlayerCard(
            getPlayerById(slots.defense1),
            'Defense'
          )}

          ${getPlayerCard(
            getPlayerById(slots.defense2),
            'Defense'
          )}
        </div>
      </div>
    `;
  };

  return `
    <section class="lineup-section">
      <h3 class="lineup-section__title">
        Power Play
      </h3>

      ${buildPowerPlayUnit(
        powerPlay[0],
        1
      )}

      ${buildPowerPlayUnit(
        powerPlay[1],
        2
      )}
    </section>

    <section class="lineup-section">
      <h3 class="lineup-section__title">
        Penalty Kill
      </h3>

      ${buildPenaltyKillUnit(
        penaltyKill[0],
        1
      )}

      ${buildPenaltyKillUnit(
        penaltyKill[1],
        2
      )}
    </section>
  `;
}

function buildModernTeamProfileLayout() {
  const source = document.getElementById('team-page-root');
  const mount = document.getElementById(
    'team-profile-modern-content'
  );

  if (!source || !mount) return null;

  const clone = source.cloneNode(true);

  clone.dataset.profileMode = 'true';

  clone.id = 'team-profile-page-root';

  clone
    .querySelectorAll('[id]')
    .forEach(element => {
      element.id = `profile-${element.id}`;
    });

  const eyebrow = clone.querySelector(
    '.team-profile-style-hero__eyebrow'
  );

  if (eyebrow) {
    eyebrow.textContent = 'Team Profile';
  }

  mount.innerHTML = '';
  mount.appendChild(clone);

  return clone;
}
/**
 * Populate the team profile screen with data from WorldEngine.
 * Must be called before showScreen('team-profile').
 * @param {string} teamId
 */
function renderTeamProfile(teamId) {
    const team =
      WorldEngine.state.teams.find(
        t =>
          String(t.teamId) ===
          String(teamId)
      );

  if (!team) return;

  /*
   * Render the requested team into the reusable Team page
   * before cloning it for the Team Profile screen.
   * This keeps coach, arena, record, standings, leaders,
   * lineup and season data synchronized.
   */
  renderTeamTab(team.teamId);

  const modernRoot =
    buildModernTeamProfileLayout();

    if (!modernRoot) return;

    modernRoot.dataset.teamId = team.teamId;

    const modernRosterListEl =
      modernRoot.querySelector(
        '#profile-team-roster-list'
      );

    const modernSpecialTeamsListEl =
      modernRoot.querySelector(
        '#profile-team-special-teams-list'
      );

  let selectedTeamRoster =
    Array.isArray(team.roster)
      ? team.roster.map(player => ({
          ...player
        }))
      : [];

  const playerTeamId =
    Game.player.teamId ||
    Game.player.highSchoolTeamId ||
    null;

    const isCareerPlayerTeam =
      playerTeamId &&
      String(playerTeamId) ===
        String(team.teamId);

    if (isCareerPlayerTeam) {
    const careerPlayer = {
      ...Game.player,

      playerId:
        Game.player.playerId ||
        Game.player.id ||
        'career-player',

      teamId:
        playerTeamId,

      overall:
        Game.player.overall ??
        Game.player.ovr ??
        60,

      isCareerPlayer: true
    };

    const careerPosition =
      String(
        careerPlayer.position || 'C'
      ).toUpperCase();

    let careerSlot =
      Game.player.rosterSlot ||
      Game.player.slot ||
      null;

    if (!careerSlot) {
      if (
        careerPosition === 'LD' ||
        careerPosition === 'RD' ||
        careerPosition.includes('DEFENSE')
      ) {
        careerSlot =
          careerPosition === 'RD'
            ? 'def-3-rd'
            : 'def-3-ld';
      } else if (
        careerPosition === 'G' ||
        careerPosition.includes('GOAL')
      ) {
        careerSlot = 'g-backup';
      } else if (
        careerPosition === 'LW' ||
        careerPosition.includes('LEFT WING')
      ) {
        careerSlot = 'fwd-3-lw';
      } else if (
        careerPosition === 'RW' ||
        careerPosition.includes('RIGHT WING')
      ) {
        careerSlot = 'fwd-3-rw';
      } else {
        careerSlot = 'fwd-3-c';
      }
    }

    const replacementIndex =
      selectedTeamRoster.findIndex(
        player =>
          (player.rosterSlot || player.slot) ===
          careerSlot
      );

    const careerPlayerWithSlot = {
      ...careerPlayer,
      rosterSlot: careerSlot,
      slot: careerSlot
    };

    if (replacementIndex !== -1) {
      selectedTeamRoster[
        replacementIndex
      ] = careerPlayerWithSlot;
    } else {
      selectedTeamRoster.push(
        careerPlayerWithSlot
      );
    }
  }

    if (modernRosterListEl) {
      modernRosterListEl.innerHTML =
        buildTeamLineupMarkup(
          selectedTeamRoster
        );

      modernRosterListEl
        .querySelectorAll('.team-roster__player')
        .forEach(button => {
          button.addEventListener('click', () => {
            const playerId =
              button.dataset.playerId;

            const selectedPlayer =
              selectedTeamRoster.find(
                player =>
                  String(
                    player.playerId ||
                    player.id
                  ) === String(playerId)
              );

            if (!selectedPlayer) return;

            openPlayerProfile(
              selectedPlayer,
              'team-profile'
            );
          });
        });
    }

    if (modernSpecialTeamsListEl) {
      modernSpecialTeamsListEl.innerHTML =
        buildTeamSpecialTeamsMarkup(
          team,
          selectedTeamRoster
        );

      modernSpecialTeamsListEl
        .querySelectorAll(
          '.team-roster__player'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const playerId =
                button.dataset.playerId;

              const selectedPlayer =
                selectedTeamRoster.find(
                  player =>
                    String(
                      player.playerId ||
                      player.id
                    ) === String(playerId)
                );

              if (!selectedPlayer) return;

              openPlayerProfile(
                selectedPlayer,
                'team-profile'
              );
            }
          );
        });
    }

   setupTeamLineupToggle(
     modernRoot,
     'profile-'
   );
  
    const modernFullStatsButton =
      modernRoot.querySelector(
        '#profile-team-view-full-stats'
      );

    if (modernFullStatsButton) {
      modernFullStatsButton.addEventListener(
        'click',
        () => {
          Game.fullStatsOrigin = 'team-profile';
          Game.fullStatsTeamId = team.teamId;
          Game.fullStatsSelectedTeamId = team.teamId;

          showScreen('full-stats');
        }
      );
    }
  
    const modernPrimaryColorEl =
      modernRoot.querySelector(
        '.team-profile-style-hero__color-primary'
      );

    const modernSecondaryColorEl =
      modernRoot.querySelector(
        '.team-profile-style-hero__color-secondary'
      );

    if (modernPrimaryColorEl) {
      modernPrimaryColorEl.style.background =
        team.primaryColor || '#2f6fd6';
    }

    if (modernSecondaryColorEl) {
      modernSecondaryColorEl.style.background =
        team.secondaryColor || '#d6aa2f';
    }

    const modernTeamNameEl =
      modernRoot.querySelector(
        '#profile-team-page-name'
      );

    const modernPrestigeEl =
      modernRoot.querySelector(
        '#profile-team-page-prestige'
      );

    const modernLevelEl =
      modernRoot.querySelector(
        '#profile-team-page-level'
      );

    const modernIdentityEl =
      modernRoot.querySelector(
        '#profile-team-page-identity'
      );

    if (modernTeamNameEl) {
      modernTeamNameEl.textContent =
        `${team.schoolName} ${team.teamName}`;
    }

    if (modernPrestigeEl) {
      modernPrestigeEl.textContent =
        '★'.repeat(Number(team.prestige) || 0);
    }

    if (modernLevelEl) {
      modernLevelEl.textContent =
        'Junior Varsity';
    }

    if (modernIdentityEl) {
      modernIdentityEl.textContent =
        team.identity ||
        'Program identity unavailable.';
    }

    const gd =
      team.goalsFor - team.goalsAgainst;
  const gdStr  = gd > 0 ? `+${gd}` : `${gd}`;
  const record = `${team.wins}-${team.losses}-${team.overtimeLosses}`;

  // Color bar halves
  const barPrimary   = document.getElementById('tp-color-bar-primary');
  const barSecondary = document.getElementById('tp-color-bar-secondary');
  if (barPrimary)   barPrimary.style.background   = team.primaryColor;
  if (barSecondary) barSecondary.style.background = team.secondaryColor;

  // Header
  const schoolEl = document.getElementById('tp-school-name');
  if (schoolEl) schoolEl.textContent = team.schoolName;

  // Hero
  const teamNameEl = document.getElementById('tp-team-name');
  if (teamNameEl) teamNameEl.textContent = team.teamName;
  const teamLevelEl = document.getElementById('tp-team-level');

  if (teamLevelEl) {
    const isPlayerTeam = Game.player.teamId === team.teamId;

    teamLevelEl.textContent = isPlayerTeam
      ? Game.player.teamLevel || 'Junior Varsity'
      : 'Junior Varsity';
  }
  const prestigeEl = document.getElementById('tp-prestige');
  if (prestigeEl) prestigeEl.textContent = prestigeStars(team.prestige);

  // Identity card — left border tinted to primary color
  const identityCard = document.getElementById('tp-identity-card');
  if (identityCard) identityCard.style.borderLeftColor = team.primaryColor;

  const identityEl = document.getElementById('tp-identity');
  if (identityEl) identityEl.textContent = team.identity;
  const coachNameEl = document.getElementById('tp-coach-name');
  const coachStyleEl = document.getElementById('tp-coach-style');

  if (coachNameEl) {
    coachNameEl.textContent = team.coach?.name || 'Coach TBD';
  }

  if (coachStyleEl) {
    coachStyleEl.textContent =
      team.coach?.style || 'Coaching profile unavailable.';
  }

  const arenaNameEl = document.getElementById('tp-arena-name');
  const arenaCapacityEl = document.getElementById('tp-arena-capacity');

  if (arenaNameEl) {
    arenaNameEl.textContent = team.arena?.name || 'Arena TBD';
  }

  if (arenaCapacityEl) {
    arenaCapacityEl.textContent = team.arena?.capacity
      ? `Capacity: ${team.arena.capacity.toLocaleString()}`
      : 'Capacity unavailable';
  }
  // Stat pills
  const recordEl = document.getElementById('tp-record');
  if (recordEl) recordEl.textContent = record;

  const ptsEl = document.getElementById('tp-pts');
  if (ptsEl) ptsEl.textContent = team.points;

  const gdEl = document.getElementById('tp-gd');
  if (gdEl) gdEl.textContent = gdStr;

  // Color chips
  const chipPrimary   = document.getElementById('tp-chip-primary');
  const chipSecondary = document.getElementById('tp-chip-secondary');
  if (chipPrimary)   chipPrimary.style.background   = team.primaryColor;
  if (chipSecondary) chipSecondary.style.background = team.secondaryColor;
  // Populate the full generated roster.
  document.querySelectorAll('#tp-roster .tp-roster-row').forEach(row => {
    row.classList.remove('tp-roster-row--you');

    const nameEl = row.querySelector('.tp-roster-row__name');
    const slot = row.dataset.rosterSlot;

    if (!nameEl || !slot) return;

    const rosterPlayer = Array.isArray(team.roster)
      ? team.roster.find(player => player.rosterSlot === slot)
      : null;

    if (rosterPlayer) {
      const fullName = `${rosterPlayer.firstName} ${rosterPlayer.lastName}`;

      let leadershipBadge = '';

      if (rosterPlayer.captain) {
        leadershipBadge = '<span class="tp-roster-leadership-badge">C</span>';
      } else if (rosterPlayer.alternateCaptain) {
        leadershipBadge = '<span class="tp-roster-leadership-badge">A</span>';
      }

      nameEl.classList.remove('tp-roster-row__name--empty');
      nameEl.innerHTML = `
        <span class="tp-roster-player-name-wrap">
          <button
            class="tp-player-link"
            data-player-id="${rosterPlayer.id}"
            type="button"
          >
            ${fullName}
          </button>

          ${leadershipBadge}
        </span>

        <span class="tp-roster-player-ovr">
          ${rosterPlayer.overall} OVR
        </span>
      `;
    } else {
      nameEl.classList.add('tp-roster-row__name--empty');
      nameEl.textContent = 'Player Coming Soon';
    }
  });

  // Show the user's player only on their assigned school.
  const isPlayerTeam =
    Game.player.teamId &&
    Game.player.teamId === team.teamId;

  if (isPlayerTeam) {
    const playerName = [
      Game.player.firstName,
      Game.player.lastName,
    ].filter(Boolean).join(' ') || 'Your Player';

    const rawPosition = String(Game.player.position || 'C').toUpperCase();
    const rawLine = String(Game.player.startingLine || '3rd Line');

    const lineMatch = rawLine.match(/\d+/);
    const lineNumber = lineMatch
      ? Math.max(1, Math.min(4, Number(lineMatch[0])))
      : 3;

    let rosterSlot;

    if (rawPosition === 'C' || rawPosition.includes('CENTER')) {
      rosterSlot = `fwd-${lineNumber}-c`;
    } else if (
      rawPosition === 'LW' ||
      rawPosition.includes('LEFT WING')
    ) {
      rosterSlot = `fwd-${lineNumber}-lw`;
    } else if (
      rawPosition === 'RW' ||
      rawPosition.includes('RIGHT WING')
    ) {
      rosterSlot = `fwd-${lineNumber}-rw`;
    } else if (
      rawPosition === 'D' ||
      rawPosition === 'LD' ||
      rawPosition === 'RD' ||
      rawPosition.includes('DEFENSE')
    ) {
      const pairNumber = Math.max(1, Math.min(3, lineNumber));
      const side = rawPosition === 'RD' ? 'rd' : 'ld';
      rosterSlot = `def-${pairNumber}-${side}`;
    } else if (
      rawPosition === 'G' ||
      rawPosition.includes('GOAL')
    ) {
      rosterSlot = lineNumber === 1 ? 'g-starter' : 'g-backup';
    } else {
      rosterSlot = `fwd-${lineNumber}-c`;
    }

    const playerRow = document.querySelector(
      `#tp-roster [data-roster-slot="${rosterSlot}"]`
    );

    if (playerRow) {
      const nameEl = playerRow.querySelector('.tp-roster-row__name');

      playerRow.classList.add('tp-roster-row--you');

      if (nameEl) {
        nameEl.classList.remove('tp-roster-row__name--empty');
        const playerOverall = Game.player.overall || 60;

        nameEl.innerHTML = `
          <span class="tp-roster-player-name-wrap">
            <button
              class="tp-player-link"
              data-player-id="career-player"
              type="button"
            >
              ${playerName}
            </button>
          </span>

          <span class="tp-roster-player-ovr">
            ${playerOverall} OVR
          </span>
        `;
      }
    }
  }
}

/**
 * Open the team profile for the given teamId.
 * @param {string} teamId  - WorldEngine teamId
 * @param {'hub'|'standings'} origin - where Back should return to
 */
function openTeamProfile(teamId, origin) {
  _teamProfileOrigin = origin;
  renderTeamProfile(teamId);
  showScreen('team-profile');
}

function openPlayerProfile(player, origin = 'team-profile') {
  if (!player) return;

  _activePlayerProfile = player;
  _playerProfileOrigin = origin;

  renderPlayerProfile();
  showScreen('player-profile');
}
// ── Top 100 Prospects ─────────────────────────────────────────
// Position groups and trend patterns cycle across 100 placeholder rows.
// Swap the loop body for WorldEngine.state.prospectRankings when real data exists.

const PR_POSITIONS = ['C','LW','RW','LD','RD','C','LW','RW','G','LD','RD','LW'];
const PR_TRENDS    = ['➖','🔼','➖','🔽','➖','🔼','➖','➖','🔽','🔼','➖','🔼'];

function posBadgeClass(pos) {
  if (pos === 'G')                  return 'pr-pos-badge--g';
  if (pos === 'LD' || pos === 'RD') return 'pr-pos-badge--def';
  return 'pr-pos-badge--fwd';
}

let prospectsReady = false;

function renderProspectsScreen() {
  const container = document.getElementById('pr-rows');
  if (!container) return;

  const teams = WorldEngine.state.teams || [];
  const playerTeamId = Game.player.teamId || '';

  /*
   * CANONICAL SCOUTING RANKINGS FIRST.
   *
   * The Weekly Living World owns publicRank / previousRank / scouting
   * certainty for every saved world player. Once those rankings exist, the
   * Prospects screen must render them directly instead of recalculating an
   * alternate ranking from OVR + hidden potential + reputation.
   *
   * The legacy generator below remains only as a pre-ranking fallback for old
   * saves / brand-new careers before the first scouting week has published.
   */
  const canonicalRankedProspects = teams
    .flatMap(team => {
      const roster = Array.isArray(team?.roster) ? team.roster : [];
      return roster.map(player => ({
        player,
        team,
        rank: Math.max(0, Number(player?.scoutingProfile?.publicRank) || 0),
      }));
    })
    .filter(entry => entry.rank > 0)
    .sort((a, b) => a.rank - b.rank);

  if (canonicalRankedProspects.length > 0) {
    const canonicalRows = canonicalRankedProspects.map(({ player, team, rank }) => {
      const previousRank = Math.max(
        0,
        Number(player?.scoutingProfile?.previousRank) || 0
      );
      const rankChange = previousRank > 0 ? previousRank - rank : 0;
      const teamAbbreviation =
        team?.abbreviation ||
        `${team?.schoolName || ''} ${team?.teamName || ''}`
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(word => word[0])
          .join('')
          .toUpperCase() ||
        '—';

      const playerId = player?.id || player?.playerId || '';
      const careerId = Game.player?.id || Game.player?.playerId || 'career-player';
      const isUser = Boolean(
        player?.isCareerPlayer ||
        (playerId && String(playerId) === String(careerId))
      );

      return {
        ...player,
        currentRank: rank,
        previousRank: previousRank || null,
        rankChange,
        sourceType: 'world',
        isUser,
        schoolName: team?.schoolName || '',
        teamName: team?.teamName || '',
        teamAbbreviation,
        league: player?.league || player?.teamLevel || 'HS',
      };
    });

    Game.currentProspectRankings = canonicalRows;
    Game.visibleProspects = canonicalRows.slice(0, 100);

    const careerCanonicalRow = canonicalRows.find(player => player.isUser);
    Game.player.prospectRank = careerCanonicalRow?.currentRank || null;

    container.innerHTML = Game.visibleProspects
      .map(player => {
        const rank = Number(player.currentRank) || 0;
        const fullName =
          `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
          'Unknown Prospect';
        const badgeCls = posBadgeClass(player.position);
        const teamDisplay = player.teamAbbreviation || '—';
        const leagueDisplay = player.league || 'HS';
        const draftYear = Number(player.draftYear) || '—';
        const rankChange = Number(player.rankChange) || 0;
        const trend =
          rankChange > 0
            ? '🔼'
            : rankChange < 0
              ? '🔽'
              : '➖';
        const reputationStars = Math.max(
          1,
          Math.min(5, Number(player.reputationStars) || 1)
        );
        const stars =
          '★'.repeat(reputationStars) +
          '☆'.repeat(5 - reputationStars);

        return `
          <div
            class="pr-row pr-row--data${player.isUser ? ' pr-row--user' : ''}"
            role="listitem"
            data-rank="${rank}"
            data-player-id="${player.id || player.playerId || ''}"
            data-player-source="world"
          >
            <span class="pr-col pr-col--rank">${rank}</span>
            <span class="pr-col pr-col--name">
              <span class="pr-player-name">${fullName}</span>
              <span class="pr-player-reputation">${stars}</span>
            </span>
            <span class="pr-col pr-col--pos">
              <span class="pr-pos-badge ${badgeCls}">${player.position || '—'}</span>
            </span>
            <span class="pr-col pr-col--team">${teamDisplay}</span>
            <span class="pr-col pr-col--league">${leagueDisplay}</span>
            <span class="pr-col pr-col--draft">${draftYear}</span>
            <span class="pr-col pr-col--trend">${trend}</span>
          </div>
        `;
      })
      .join('');

    prospectsReady = true;
    return;
  }

  // Determine which generated roster slot is occupied by the career player.
  function getUserRosterSlot() {
    const rawPosition = String(Game.player.position || 'C').toUpperCase();
    const rawLine = String(Game.player.startingLine || '3rd Line');

    const lineMatch = rawLine.match(/\d+/);
    const lineNumber = lineMatch
      ? Math.max(1, Math.min(4, Number(lineMatch[0])))
      : 3;

    if (rawPosition === 'C' || rawPosition.includes('CENTER')) {
      return `fwd-${lineNumber}-c`;
    }

    if (rawPosition === 'LW' || rawPosition.includes('LEFT WING')) {
      return `fwd-${lineNumber}-lw`;
    }

    if (rawPosition === 'RW' || rawPosition.includes('RIGHT WING')) {
      return `fwd-${lineNumber}-rw`;
    }

    if (
      rawPosition === 'D' ||
      rawPosition === 'LD' ||
      rawPosition === 'RD' ||
      rawPosition.includes('DEFENSE')
    ) {
      const pairNumber = Math.max(1, Math.min(3, lineNumber));
      const side = rawPosition === 'RD' ? 'rd' : 'ld';

      return `def-${pairNumber}-${side}`;
    }

    if (rawPosition === 'G' || rawPosition.includes('GOAL')) {
      return lineNumber === 1 ? 'g-starter' : 'g-backup';
    }

    return `fwd-${lineNumber}-c`;
  }

  const userRosterSlot = getUserRosterSlot();

  // Add all fictional high-school roster players.
  const generatedProspects = teams.flatMap(team => {
    const roster = Array.isArray(team.roster) ? team.roster : [];

    return roster
      .filter(player => {
        // Hide the fictional player occupying the user's roster slot.
        const isReplacedByUser =
          team.teamId === playerTeamId &&
          player.rosterSlot === userRosterSlot;

        return !isReplacedByUser;
      })
      .map(player => ({
        ...player,

        sourceType: 'fictional-hs',
        isUser: false,
        realPlayer: false,

        schoolName: team.schoolName,
        teamName: team.teamName,
        teamAbbreviation: `${team.schoolName} ${team.teamName}`
          .split(/\s+/)
          .filter(Boolean)
          .map(word => word[0])
          .join('')
          .toUpperCase(),

        league: 'HS',
      }));
  });

  // Add all real 2027-and-younger prospects.
  const realProspects =
    typeof REAL_PROSPECTS !== 'undefined' &&
    Array.isArray(REAL_PROSPECTS)
      ? REAL_PROSPECTS.map(player => ({
          ...player,

          sourceType: 'real',
          isUser: false,
          realPlayer: true,

          // These allow the same renderer to handle every player type.
          schoolName: '',
          teamName: player.currentTeam || '',
          teamAbbreviation:
            player.teamAbbreviation ||
            String(player.currentTeam || '—')
              .split(/\s+/)
              .filter(Boolean)
              .map(word => word[0])
              .join('')
              .toUpperCase(),
        }))
      : [];

  const prospectPool = [
    ...generatedProspects,
    ...realProspects,
  ];

  // Add the user's career player.
  if (Game.player.tryoutsComplete && playerTeamId) {
    const assignedTeam = teams.find(
      team => team.teamId === playerTeamId
    );

    prospectPool.push({
      id: 'career-player',

      firstName: Game.player.firstName || '',
      lastName: Game.player.lastName || '',

      position: Game.player.position || 'C',

      overall: Number(Game.player.overall) || 60,
      potential: Number(Game.player.potential) || 78,

      year: 'Freshman',
      age: Number(Game.player.age) || 14,

      reputationStars:
        Number(Game.player.reputationStars) || 1,

      reputationPoints:
        Number(Game.player.reputationPoints) ||
        (Number(Game.player.reputationStars) || 1) * 20,

      developmentSeed: 0.5,

      schoolName: assignedTeam?.schoolName || 'Unassigned',
      teamName: assignedTeam?.teamName || '',

      teamAbbreviation: assignedTeam
        ? `${assignedTeam.schoolName} ${assignedTeam.teamName}`
            .split(/\s+/)
            .filter(Boolean)
            .map(word => word[0])
            .join('')
            .toUpperCase()
        : '—',

      league: 'HS',
      draftYear: 2027,

      sourceType: 'career',
      realPlayer: false,
      isUser: true,
    });
  }

  function getReputationPoints(player) {
    if (Number.isFinite(Number(player.reputationPoints))) {
      return Number(player.reputationPoints);
    }

    // Migration fallback for older generated rosters.
    let points = 10;
    const overall = Number(player.overall) || 60;

    if (overall >= 78) points += 30;
    else if (overall >= 74) points += 20;
    else if (overall >= 70) points += 10;

    if (player.year === 'Senior') points += 10;
    else if (player.year === 'Junior') points += 6;
    else if (player.year === 'Sophomore') points += 3;

    return Math.min(100, points);
  }

  function getReputationStars(player) {
    if (Number.isFinite(Number(player.reputationStars))) {
      return Math.max(
        1,
        Math.min(5, Number(player.reputationStars))
      );
    }

    const points = getReputationPoints(player);

    if (points >= 95) return 5;
    if (points >= 85) return 4;
    if (points >= 60) return 3;
    if (points >= 30) return 2;

    return 1;
  }

  function getDraftYear(player) {
    if (Number.isFinite(Number(player.draftYear))) {
      return Number(player.draftYear);
    }

    if (player.year === 'Senior') return 2024;
    if (player.year === 'Junior') return 2025;
    if (player.year === 'Sophomore') return 2026;

    return 2027;
  }

  function getTrend(player) {
    const seed = Number(player.developmentSeed) || 0.5;

    if (seed >= 0.67) return '🔼';
    if (seed <= 0.33) return '🔽';

    return '➖';
  }

  function getProspectScore(player) {
    const overall = Number(player.overall) || 60;
    const potential = Number(player.potential) || overall;
    const reputation = getReputationPoints(player);

    // Current ability: 50%
    // Potential ceiling: 30%
    // Reputation/exposure: 20%
    return (
      overall * 0.5 +
      potential * 0.3 +
      reputation * 0.2
    );
  }

  const rankedProspects = prospectPool
    .map(player => ({
      ...player,

      prospectScore: getProspectScore(player),
      reputationStars: getReputationStars(player),
      reputationPoints: getReputationPoints(player),
      draftYear: getDraftYear(player),
    }))
    
    .sort((a, b) => {
      if (b.prospectScore !== a.prospectScore) {
        return b.prospectScore - a.prospectScore;
      }

      if (b.overall !== a.overall) {
        return b.overall - a.overall;
      }

      if (b.potential !== a.potential) {
        return b.potential - a.potential;
      }

      return a.lastName.localeCompare(b.lastName);
    });

  // Save the user's real rank, even when outside the visible Top 100.
  const userIndex = rankedProspects.findIndex(
    player => player.isUser
  );

  Game.player.prospectRank =
    userIndex >= 0 ? userIndex + 1 : null;

  const topProspects = rankedProspects.slice(0, 100);
  
  Game.visibleProspects = topProspects;

  Game.currentProspectRankings =
    rankedProspects.map((player, index) => ({
      ...player,
      currentRank: index + 1
    }));

  container.innerHTML = topProspects
    .map((player, index) => {
      const rank = index + 1;

      const fullName =
        `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
        'Unknown Prospect';

      const badgeCls = posBadgeClass(player.position);

      const stars =
        '★'.repeat(player.reputationStars) +
        '☆'.repeat(5 - player.reputationStars);

      const teamDisplay =
        player.teamAbbreviation || '—';

      const leagueDisplay =
        player.league || 'HS';

      return `
        <div
          class="pr-row pr-row--data${player.isUser ? ' pr-row--user' : ''}"
          role="listitem"
          data-rank="${rank}"
          data-player-id="${player.id}"
          data-player-source="${player.sourceType || 'unknown'}"
        >
          <span class="pr-col pr-col--rank">
            ${rank}
          </span>

          <span class="pr-col pr-col--name">
            <span class="pr-player-name">
              ${fullName}
            </span>

            <span class="pr-player-reputation">
              ${stars}
            </span>
          </span>

          <span class="pr-col pr-col--pos">
            <span class="pr-pos-badge ${badgeCls}">
              ${player.position}
            </span>
          </span>

          <span class="pr-col pr-col--team">
            ${teamDisplay}
          </span>

          <span class="pr-col pr-col--league">
            ${leagueDisplay}
          </span>

          <span class="pr-col pr-col--draft">
            ${player.draftYear}
          </span>

          <span class="pr-col pr-col--trend">
            ${getTrend(player)}
          </span>
        </div>
      `;
    })
    .join('');

  prospectsReady = true;
}


// ── Standings ────────────────────────────────────────────────
// Shared sort used by both the hub preview card and the full standings screen.
// Sort order: Points desc → Wins desc → Goal Differential desc.
function getSortedStandings() {
  return [...WorldEngine.state.teams].sort((a, b) => {
    if (b.points !== a.points)           return b.points - a.points;
    if (b.wins   !== a.wins)             return b.wins   - a.wins;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    return gdB - gdA;
  });
}

// Renders the top-4 preview inside the hub home tab standings card.
// Each data row carries data-team-id so click delegation can open the team profile.
function renderHubStandings() {
  const container = document.getElementById('hub-standings-preview');
  if (!container) return;

  const teams = getSortedStandings().slice(0, 4);
  const playerTeamId = Game.player.teamId || '';

  // Keep the existing header row, replace everything after it.
  const header = container.querySelector('.hub-standings__row--header');
  container.innerHTML = '';
  if (header) container.appendChild(header);

  teams.forEach((t, i) => {
    const isPlayerTeam =
      playerTeamId &&
      t.teamId === playerTeamId;

    const row = document.createElement('div');

    row.className = [
      'hub-standings__row',
      'hub-standings__row--clickable',
      isPlayerTeam ? 'hub-standings__row--player-team' : '',
    ].filter(Boolean).join(' ');

    row.dataset.teamId = t.teamId;
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');

    row.innerHTML = `
      <span class="hub-standings__pos">${i + 1}</span>

      <span class="hub-standings__team">
        <span>${t.schoolName} ${t.teamName}</span>
        
      </span>

      <span class="hub-standings__stat">${t.wins}</span>
      <span class="hub-standings__stat">${t.losses}</span>
      <span class="hub-standings__stat hub-standings__stat--pts">${t.points}</span>
    `;

    container.appendChild(row);
  });
}
function renderLeagueLeadersPreview() {
  const container =
    document.getElementById(
      'league-leaders-preview'
    );

  if (!container) return;

  const teams =
    Array.isArray(WorldEngine.state.teams)
      ? WorldEngine.state.teams
      : [];

  const players =
    getLivePlayersFromTeams(teams);

  const skaters =
    players.filter(player => {
      const position =
        String(player.position || '')
          .trim()
          .toUpperCase();

      return (
        position !== 'G' &&
        !position.includes('GOAL')
      );
    });

  const goalies =
    players.filter(player => {
      const position =
        String(player.position || '')
          .trim()
          .toUpperCase();

      return (
        position === 'G' ||
        position.includes('GOAL')
      );
    });

  const getTopThree = (
    playerList,
    statKey,
    secondaryKey = 'points'
  ) => {
    return [...playerList]
      .filter(player =>
        Number(player[statKey] || 0) > 0
      )
      .sort((a, b) => {
        const primaryDifference =
          Number(b[statKey] || 0) -
          Number(a[statKey] || 0);

        if (primaryDifference !== 0) {
          return primaryDifference;
        }

        const secondaryDifference =
          Number(b[secondaryKey] || 0) -
          Number(a[secondaryKey] || 0);

        if (secondaryDifference !== 0) {
          return secondaryDifference;
        }

        const nameA =
          `${a.firstName || ''} ${a.lastName || ''}`;

        const nameB =
          `${b.firstName || ''} ${b.lastName || ''}`;

        return nameA.localeCompare(nameB);
      })
      .slice(0, 3);
  };

  const pointsLeaders =
    getTopThree(
      skaters,
      'points',
      'goals'
    );

  const goalsLeaders =
    getTopThree(
      skaters,
      'goals',
      'points'
    );

  const assistsLeaders =
    getTopThree(
      skaters,
      'assists',
      'points'
    );

  const savePercentageLeaders =
    getTopThree(
      goalies,
      'savePercentage',
      'wins'
    );

  const goalieWinsLeaders =
    getTopThree(
      goalies,
      'wins',
      'savePercentage'
    );

  const formatSavePercentage = value => {
    const numericValue =
      Number(value || 0);

    if (numericValue <= 0) {
      return '.000';
    }

    /*
      Supports either:
      0.925
      or
      92.5
    */
    const normalizedValue =
      numericValue > 1
        ? numericValue / 100
        : numericValue;

    return normalizedValue
      .toFixed(3)
      .replace(/^0/, '');
  };

  const buildLeaderRow = (
    player,
    index,
    statKey,
    formatter = value =>
      String(Number(value || 0))
  ) => {
    const fullName =
      `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
      'Unknown Player';

    const playerId =
      player.playerId ||
      player.id ||
      '';

    return `
      <button
        class="league-leader-row ${
          player.isCareerPlayer
            ? 'career-player-highlight'
            : ''
        }"
        type="button"
        data-player-id="${playerId}"
      >
        <span class="league-leader-row__rank">
          ${index + 1}
        </span>

        <span class="league-leader-row__identity">
          <strong class="league-leader-row__name">
            ${fullName}
          </strong>

          <span class="league-leader-row__team">
            ${player.teamAbbreviation || ''}
          </span>
        </span>

        <strong class="league-leader-row__value">
          ${formatter(player[statKey])}
        </strong>
      </button>
    `;
  };

  const buildLeaderGroup = (
    label,
    leaders,
    statKey,
    formatter
  ) => {
    const rows =
      leaders.length > 0
        ? leaders
            .map((player, index) =>
              buildLeaderRow(
                player,
                index,
                statKey,
                formatter
              )
            )
            .join('')
        : `
          <div class="league-leader-group__empty">
            No stats yet
          </div>
        `;

    return `
      <section class="league-leader-group">
        <header class="league-leader-group__header">
          <span class="league-leader-group__label">
            ${label}
          </span>
        </header>

        <div class="league-leader-group__rows">
          ${rows}
        </div>
      </section>
    `;
  };

  container.innerHTML = `
    <div class="league-leaders-grid">
      ${buildLeaderGroup(
        'Points',
        pointsLeaders,
        'points'
      )}

      ${buildLeaderGroup(
        'Goals',
        goalsLeaders,
        'goals'
      )}

      ${buildLeaderGroup(
        'Assists',
        assistsLeaders,
        'assists'
      )}

      ${buildLeaderGroup(
        'Goalie Wins',
        goalieWinsLeaders,
        'wins'
      )}

      ${buildLeaderGroup(
        'Save Percentage',
        savePercentageLeaders,
        'savePercentage',
        formatSavePercentage
      )}

    </div>
  `;

  container
    .querySelectorAll(
      '.league-leader-row[data-player-id]'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          const playerId =
            button.dataset.playerId;

          const selectedPlayer =
            players.find(player =>
              String(
                player.playerId ||
                player.id
              ) === String(playerId)
            );

          if (!selectedPlayer) return;

          openPlayerProfile(
            selectedPlayer,
            'league'
          );
        }
      );
    });
}
function renderLeagueAwardsPreview() {
  const container = document.getElementById('league-awards-preview');
  if (!container) return;

  const livingWorld = WorldEngine.state?.livingWorld || {};
  const races = Array.isArray(livingWorld.currentAwardRaces)
    ? livingWorld.currentAwardRaces
    : [];

  if (!races.length || !races.some(race => Array.isArray(race.contenders) && race.contenders.length)) {
    container.innerHTML = `
      <div class="league-awards-empty">
        No award races yet
      </div>
    `;
    Game.currentLeagueAwardRaces = [];
    return;
  }

  const teams = Array.isArray(WorldEngine.state?.teams)
    ? WorldEngine.state.teams
    : [];
  const players = typeof getLivePlayersFromTeams === 'function'
    ? getLivePlayersFromTeams(teams)
    : teams.flatMap(team => Array.isArray(team?.roster) ? team.roster : []);

  const playerById = new Map(players.map(player => [
    String(player.playerId || player.id || ''),
    player,
  ]));

  const formatTrend = contender => {
    const previousRank = Number(contender.previousRank);
    const currentRank = Number(contender.rank);
    if (!Number.isFinite(previousRank) || !Number.isFinite(currentRank)) {
      return '<span class="league-award-contender__trend league-award-contender__trend--new">NEW</span>';
    }
    const difference = previousRank - currentRank;
    if (difference > 0) return `<span class="league-award-contender__trend league-award-contender__trend--up">▲${difference}</span>`;
    if (difference < 0) return `<span class="league-award-contender__trend league-award-contender__trend--down">▼${Math.abs(difference)}</span>`;
    return '<span class="league-award-contender__trend league-award-contender__trend--even">—</span>';
  };

  const getStatLine = (race, contender) => {
    const stats = contender.stats || {};
    if (race.key === 'goalie') {
      const sv = Number(stats.savePercentage) || 0;
      return `${Number(stats.wins) || 0} W · ${sv > 0 ? sv.toFixed(3).replace(/^0/, '') : '.000'} SV%`;
    }
    if (race.key === 'freshman_of_year') {
      const player = playerById.get(String(contender.playerId || ''));
      const position = String(player?.position || contender.position || '').toUpperCase();
      if (position === 'G' || position.includes('GOAL')) {
        const sv = Number(stats.savePercentage) || 0;
        return `${Number(stats.wins) || 0} W · ${sv > 0 ? sv.toFixed(3).replace(/^0/, '') : '.000'} SV%`;
      }
      return `${Number(stats.goals) || 0} G · ${Number(stats.assists) || 0} A · ${Number(stats.points) || 0} PTS`;
    }
    if (race.key === 'goal_scorer') return `${Number(stats.goals) || 0} G`;
    return `${Number(stats.points) || 0} PTS`;
  };

  Game.currentLeagueAwardRaces = races.map(race => ({
    ...race,
    contenders: (race.contenders || []).map(contender => ({
      ...contender,
      awardCurrentRank: contender.rank,
      awardPreviousRank: contender.previousRank,
    })),
  }));

  container.innerHTML = `
    <div class="league-awards-grid">
      ${races.map(race => `
        <section class="league-award-race" data-award-key="${race.key}">
          <header class="league-award-race__header">
            <span class="league-award-race__name">${race.label}</span>
            ${race.key === 'freshman_of_year'
              ? '<span class="league-award-race__badge">FRESHMEN</span>'
              : ''}
          </header>
          <div class="league-award-race__contenders">
            ${(race.contenders || []).slice(0,3).map(contender => {
              const player = playerById.get(String(contender.playerId || '')) || contender;
              const fullName = `${player.firstName || contender.firstName || ''} ${player.lastName || contender.lastName || ''}`.trim() || 'Unknown Player';
              const teamLabel = player.teamAbbreviation || player.teamShortName || player.teamName || '—';
              return `
                <button class="league-award-contender" type="button" data-player-id="${contender.playerId || ''}">
                  <span class="league-award-contender__rank">${contender.rank}</span>
                  <span class="league-award-contender__body">
                    <span class="league-award-contender__top">
                      <strong class="league-award-contender__name">${fullName}</strong>
                      ${formatTrend(contender)}
                    </span>
                    <span class="league-award-contender__meta">
                      ${player.position || contender.position || '—'} · ${teamLabel} · ${getStatLine(race, contender)}
                    </span>
                  </span>
                </button>
              `;
            }).join('') || '<div class="league-awards-empty">No eligible contenders yet</div>'}
          </div>
        </section>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.league-award-contender[data-player-id]').forEach(button => {
    button.addEventListener('click', () => {
      const selectedPlayer = playerById.get(String(button.dataset.playerId || ''));
      if (!selectedPlayer) return;
      openPlayerProfile(selectedPlayer, 'league');
    });
  });
}

}
function simulateToDate(
  targetDate
) {
  const currentDate =
    WorldEngine.state.season
      ?.currentDate ||
    WorldEngine.state.player
      ?.currentDate ||
    Game.player.currentDate ||
    '2026-09-01';

  Game.player.currentDate =
    currentDate;

  const sameDayCareerGameSim =
    Boolean(
      targetDate === currentDate &&
      WorldEngine.state
        .season
        ?.careerGameSimApproval
    );

  if (
    !targetDate ||
    (
      targetDate <= currentDate &&
      !sameDayCareerGameSim
    )
  ) {
    return currentDate;
  }

  /*
   * Snapshot completed career-team games before advancing.
   *
   * Postgame routing must identify games that became completed
   * during THIS simulation call instead of trying to infer that
   * afterward from date ranges.
   */
  const preSimulationSchedule =
    Array.isArray(
      WorldEngine.state.schedule
    )
      ? WorldEngine.state.schedule
      : [];

  const careerTeamId =
    WorldEngine.state.player
      ?.teamId ||
    Game.player
      ?.teamId ||
    null;

  const previouslyCompletedCareerGameIds =
    new Set(
      preSimulationSchedule
        .filter(event => {
          if (
            event?.type !== 'game' ||
            event?.played !== true
          ) {
            return false;
          }

          const isCareerTeamGame =
            careerTeamId &&
            (
              String(
                event.homeTeamId || ''
              ) ===
                String(careerTeamId) ||
              String(
                event.awayTeamId || ''
              ) ===
                String(careerTeamId)
            );

          return Boolean(
            isCareerTeamGame
          );
        })
        .map(event =>
          String(
            event.id ||
            event.gameId ||
            ''
          )
        )
        .filter(Boolean)
    );

  /*
   * CAREER GAME PRESENTATION STOP
   *
   * A career-team game is a hard stop during calendar simulation.
   *
   * Example:
   * Current date: Sep 17
   * Requested:    Sep 20
   * Career game:  Sep 18
   *
   * We advance only through Sep 18, present its Postgame Summary,
   * and let the player choose to continue farther afterward.
   *
   * This prevents later interactive events such as Sunday
   * Training from being processed before the player has seen
   * the completed game's presentation.
   */
  const nextCareerGame =
    preSimulationSchedule
      .filter(event => {
        if (
          event?.type !== 'game' ||
          event?.played === true
        ) {
          return false;
        }

        const eventDate =
          String(
            event.date || ''
          );

        if (
          !eventDate ||
          eventDate <= currentDate ||
          eventDate > targetDate
        ) {
          return false;
        }

        const isCareerTeamGame =
          careerTeamId &&
          (
            String(
              event.homeTeamId || ''
            ) ===
              String(careerTeamId) ||
            String(
              event.awayTeamId || ''
            ) ===
              String(careerTeamId)
          );

        return Boolean(
          isCareerTeamGame
        );
      })
      .sort(
        (firstGame, secondGame) =>
          String(
            firstGame.date || ''
          ).localeCompare(
            String(
              secondGame.date || ''
            )
          )
      )[0] ||
    null;

  const simulationTargetDate =
    nextCareerGame?.date ||
    targetDate;

  /*
   * Time advancement now belongs to the Season Engine.
   * The UI only requests a target date and reacts to
   * the result.
   */
  const result =
    WorldEngine.advanceToDate(
      simulationTargetDate,
      {
        processCurrentDate:
          sameDayCareerGameSim,
      }
    );

  const reachedDate =
    result?.currentDate ||
    currentDate;

  Game.player.currentDate =
    reachedDate;

  setupHubCalendar();

  refreshScheduleEvents();

  renderScheduleCalendar(
    scheduleViewYear,
    scheduleViewMonth
  );

  renderScheduleKeyEvents();

  /*
   * If the Season Engine stopped for a player-controlled
   * event, open that event instead of silently remaining
   * on the calendar.
   */
  if (
    result?.stopSimulation === true
  ) {
    const blockingWorldEvent =
      result.blockingEventResult
        ?.event ||
      null;

    const blockingEventId =
      blockingWorldEvent
        ?.eventId ||
      blockingWorldEvent
        ?.id ||
      null;

    const blockingScheduleEvent =
      scheduleEvents.find(event =>
        String(event.eventId) ===
        String(blockingEventId)
      ) || null;

    /*
     * Career games now stop the Season Engine on game day
     * before being resolved.
     *
     * Route that stop directly into the Pregame Matchup instead
     * of reopening the generic Begin Event screen.
     */
    if (
      result
        ?.blockingEventResult
        ?.reason ===
        'career-game-awaiting-user-choice' &&
      blockingScheduleEvent
    ) {
      openPregameMatchup(
        blockingScheduleEvent
      );

      return reachedDate;
    }

    if (blockingScheduleEvent) {
      EventSystem.openEvent(
        blockingScheduleEvent.eventId,
        'schedule',
        blockingScheduleEvent
      );
    }
}

/*
* When normal simulation completes one or more games,
* immediately open the first newly completed game's
* permanently saved Postgame Summary.
*
* Do not override a practice, recovery session, meeting,
* or other player-controlled event that stopped simulation.
*/

const canonicalSchedule =
  Array.isArray(
    WorldEngine.state.schedule
  )
    ? WorldEngine.state.schedule
    : [];


  const newlyCompletedGame =
    canonicalSchedule
      .filter(game => {
        if (
          game?.type !== 'game' ||
          game?.played !== true ||
          !game?.postgameSummary
        ) {
          return false;
        }

        const gameId =
          String(
            game.id ||
            game.gameId ||
            ''
          );

        if (!gameId) {
          return false;
        }

        const isCareerTeamGame =
          careerTeamId &&
          (
            String(
              game.homeTeamId || ''
            ) ===
              String(careerTeamId) ||
            String(
              game.awayTeamId || ''
            ) ===
              String(careerTeamId)
          );

        if (!isCareerTeamGame) {
          return false;
        }

        return (
          !previouslyCompletedCareerGameIds
            .has(gameId)
        );
      })
      .sort((a, b) =>
        String(a.date || '')
          .localeCompare(
            String(b.date || '')
          )
      )[0] ||
    null;

const completedGameId =
  newlyCompletedGame
    ?.gameId ||
  newlyCompletedGame
    ?.id ||
  null;

if (completedGameId) {
  openPostgameSummary(
    completedGameId
  );
}


return reachedDate;
}
document
.getElementById('schedule-selected-day-action')
?.addEventListener('click', () => {
  const selectedCell = document.querySelector(
    '.schedule-day--selected'
  );

  if (!selectedCell) return;

  const selectedDateKey =
    selectedCell.dataset.date;

  if (!selectedDateKey) return;

const currentDate =
  Game.player.currentDate || '2026-09-01';

if (selectedDateKey <= currentDate) return;

const selectedEvent =
  scheduleEvents.find(
    event =>
      String(event.date) ===
      String(selectedDateKey)
  ) ||
  null;

/*
 * Games should enter their normal pregame event screen first.
 * The game is not simulated until the player presses
 * Begin Event from that screen.
 */
if (
  selectedEvent?.type === 'game' &&
  selectedEvent.isCompleted !== true
) {
  EventSystem.openEvent(
    selectedEvent.eventId,
    'schedule',
    selectedEvent
  );

  return;
}

simulateToDate(selectedDateKey);
});
document
.getElementById('schedule-selected-day-details')
?.addEventListener('click', () => {
  const detailsButton =
    document.getElementById('schedule-selected-day-details');

  const eventId =
    detailsButton?.dataset.eventId;

    const selectedEvent =
      scheduleEvents.find(
        event =>
          String(event.eventId) ===
          String(eventId)
      );

    if (!selectedEvent) return;

    /*
     * Completed career events reopen their permanently saved
     * completion screen instead of reopening the pre-event screen.
     *
     * This is display-only. Event rewards are not processed again.
     */
    /*
     * Completed games reopen their permanently saved
     * postgame summary instead of the pregame event page.
     */
    const isCompletedGame =
      Boolean(selectedEvent.isCompleted) &&
      selectedEvent.type === 'game';

    if (isCompletedGame) {
      const completedGameId =
        selectedEvent.gameId ||
        selectedEvent.eventId ||
        null;

      if (
        completedGameId &&
        openPostgameSummary(
          completedGameId
        )
      ) {
        return;
      }

      console.error(
        '[Schedule] Could not open completed game summary.',
        selectedEvent
      );

      return;
    }
  
    const isCompletedCareerEvent =
      Boolean(selectedEvent.isCompleted) &&
      selectedEvent.type !== 'game' &&
      selectedEvent.result &&
      typeof selectedEvent.result === 'object';

    if (isCompletedCareerEvent) {
      EventResultsSystem.open(
        selectedEvent,
        {
          success: true,

          result:
            selectedEvent.result,

          date:
            selectedEvent.completedAt ||
            selectedEvent.date,

          coachNote:
            selectedEvent.result
              ?.coachNote ||
            '',
        }
      );

      return;
    }

    if (
    selectedEvent.isCompleted &&
    selectedEvent.summaryScreen === 'tryout-summary'
  ) {
    openTryoutSummary('history');
    return;
  }

  EventSystem.openEvent(
    selectedEvent.eventId,
    'schedule',
    selectedEvent
  );
});
function renderScheduleKeyEvents() {
  const list =
    document.getElementById(
      'schedule-upcoming-list'
    );

  if (!list) return;

  const events =
    Array.isArray(scheduleEvents)
      ? scheduleEvents
      : [];

  /*
   * Use the career's current date when available.
   * The September 1 fallback matches the present HS calendar.
   */
  const currentDateKey =
    Game.currentDateKey ||
    Game.currentDate ||
    Game.player?.currentDateKey ||
    Game.player?.currentDate ||
    '2026-09-01';

  const ignoredTypes =
    new Set([
      'practice',
      'recovery',
      'off'
    ]);

  const getEventTypeLabel = event => {
    const type =
      String(event?.type || '')
        .trim()
        .toLowerCase();

    if (type === 'game') {
      return 'Game';
    }

    if (type === 'tryout') {
      return 'Tryout';
    }

    if (
      type === 'meeting' ||
      String(event?.eventId || '').includes('meeting')
    ) {
      return 'Meeting';
    }

    if (
      type === 'scouting' ||
      String(event?.eventId || '').includes('scout')
    ) {
      return 'Scouting';
    }

    if (
      type === 'ranking' ||
      String(event?.eventId || '').includes('ranking')
    ) {
      return 'Rankings';
    }

    if (
      type === 'playoff' ||
      String(event?.eventId || '').includes('playoff')
    ) {
      return 'Playoffs';
    }

    return 'Event';
  };

  const formatUpcomingDate = dateKey => {
    const date =
      new Date(`${dateKey}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateKey;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    );
  };

  const upcomingEvents =
    events
      .filter(event => {
        if (!event?.date) return false;

        const type =
          String(event.type || '')
            .trim()
            .toLowerCase();

        if (ignoredTypes.has(type)) {
          return false;
        }

        if (event.isCompleted) {
          return false;
        }

        return (
          String(event.date) >=
          String(currentDateKey)
        );
      })
      .sort((a, b) =>
        String(a.date).localeCompare(
          String(b.date)
        )
      )
      .slice(0, 3);

  if (upcomingEvents.length === 0) {
    list.innerHTML = `
      <p class="schedule-upcoming-empty">
        Nothing important scheduled yet.
      </p>
    `;

    return;
  }

  list.innerHTML = upcomingEvents
    .map(event => {
      const label =
        event.label ||
        event.shortLabel ||
        'Upcoming Event';

      const typeLabel =
        getEventTypeLabel(event);

      const upcomingIcon =
        String(event.type || '').toLowerCase() === 'game'
          ? getScheduleGameIcon(event)
          : event.icon || '';

      return `
        <div
          class="schedule-upcoming-item"
          data-event-id="${event.eventId || ''}"
          data-event-date="${event.date}"
        >
          <div class="schedule-upcoming-item__date">
            ${formatUpcomingDate(event.date)}
          </div>

          <div class="schedule-upcoming-item__content">
  <span class="schedule-upcoming-item__type">
    ${upcomingIcon
      ? `<span aria-hidden="true">${upcomingIcon}</span> `
      : ''
    }${typeLabel}
  </span>

  <strong class="schedule-upcoming-item__title">
    ${label}
  </strong>
</div>
        </div>
      `;
    })
    .join('');
  list
  .querySelectorAll('.schedule-upcoming-item')
  .forEach(item => {
    item.addEventListener('click', () => {
      const eventDate =
        item.dataset.eventDate;

      if (!eventDate) return;

      const targetDate =
        new Date(`${eventDate}T12:00:00`);

      if (Number.isNaN(targetDate.getTime())) {
        return;
      }

      scheduleViewYear =
        targetDate.getFullYear();

      scheduleViewMonth =
        targetDate.getMonth();

      renderScheduleCalendar(
        scheduleViewYear,
        scheduleViewMonth
      );

      const targetCell =
        document.querySelector(
          `.schedule-day[data-date="${eventDate}"]`
        );

      if (!targetCell) return;

      targetCell.click();

      const selectedPanel =
        document.getElementById(
          'schedule-selected-day-panel'
        );

      if (selectedPanel) {
        selectedPanel.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}
function renderPlayerProfile() {
  const selectedPlayer = _activePlayerProfile;
  if (!selectedPlayer) return;

  /*
   * Standalone Player Profiles are presentation-only views over the same
   * canonical world-player backend used by the career Player tab. Prospect
   * lists and stat tables sometimes pass copied snapshot objects, so resolve
   * back to the saved roster player before rendering whenever possible.
   */
  const selectedPlayerId = String(
    selectedPlayer.id || selectedPlayer.playerId || ''
  );

  const canonicalPlayer = (WorldEngine.state.teams || [])
    .flatMap(team => Array.isArray(team?.roster) ? team.roster : [])
    .find(player =>
      selectedPlayerId &&
      String(player?.id || player?.playerId || '') === selectedPlayerId
    );

  const p = canonicalPlayer || selectedPlayer;

  if (canonicalPlayer) {
    _activePlayerProfile = canonicalPlayer;
  }

  const name = `${p.firstName} ${p.lastName}`.trim() || '—';
  const age = p.age || 14;
  const pos = p.position || '—';

  const assignedTeam =
    (WorldEngine.state.teams || [])
      .find(team => team.teamId === p.teamId);

  const fullTeamName = assignedTeam
    ? `${assignedTeam.schoolName} ${assignedTeam.teamName}`
    : 'Freshman Tryouts';
  const nameEl = document.getElementById('player-profile-name');
if (nameEl) {
  nameEl.textContent = name;
}
  const posEl = document.getElementById('player-profile-pos');
  if (posEl) {
    const jersey = p.jerseyNumber || '--';
    if (p.jerseyNumber) {
      posEl.textContent = `${pos} #${p.jerseyNumber}`;
    } else {
      posEl.textContent = pos;
    }
  }

  const ageEl = document.getElementById('player-profile-age');
  if (ageEl) {
    const playerYear = p.year || 'Freshman';

    ageEl.textContent = `${age} years old · ${playerYear}`;
  }

  const teamEl = document.getElementById('player-profile-team');
  if (teamEl) {
    teamEl.textContent = fullTeamName;
  }
  const archetypeEl =
    document.getElementById('player-profile-archetype');

  if (archetypeEl) {
    const rawArchetype = String(p.archetype || 'Balanced');

    const archetypeLabels = {
      Sniper: 'Sniper',
      Playmaker: 'Playmaker',
      PowerForward: 'Power Forward',
      TwoWayForward: 'Two-Way Forward',
      Grinder: 'Grinder',
      Enforcer: 'Enforcer',
      OffensiveDefenseman: 'Offensive Defenseman',
      DefensiveDefenseman: 'Defensive Defenseman',
      TwoWayDefenseman: 'Two-Way Defenseman',
      PuckMovingDefenseman: 'Puck-Moving Defenseman',
      ButterflyGoalie: 'Butterfly Goalie',
      HybridGoalie: 'Hybrid Goalie',
      StandUpGoalie: 'Stand-Up Goalie',
      Balanced: 'Balanced',
    };

    archetypeEl.textContent =
      archetypeLabels[rawArchetype] || rawArchetype;
  }
  const heightEl =
    document.getElementById('player-profile-height');

  if (heightEl) {
    heightEl.textContent = p.height || `5'10"`;
  }

  const weightEl =
    document.getElementById('player-profile-weight');

  if (weightEl) {
    const weight = Number(p.weight) || 175;
    weightEl.textContent = `${weight} lbs`;
  }

  const shootsEl =
    document.getElementById('player-profile-shoots');

  if (shootsEl) {
    shootsEl.textContent = `Shoots ${p.shoots || 'L'}`;
  }

  const ovrEl = document.getElementById('pp-player-ovr');
  if (ovrEl) {
    ovrEl.textContent = p.overall;
  }
  const reputationStars = Math.max(
    1,
    Math.min(5, Number(p.reputationStars) || 1)
  );

  const starsEl = document.getElementById('pp-player-stars');
  if (starsEl) {
    starsEl.textContent =
      '★'.repeat(reputationStars) +
      '☆'.repeat(5 - reputationStars);
  }

  const labelEl = document.getElementById('pp-player-label');
  if (labelEl) {
    const reputationLabels = {
      1: 'Local Prospect',
      2: 'Regional Prospect',
      3: 'National Prospect',
      4: 'Elite Prospect',
      5: 'Generational Prospect',
    };

    labelEl.textContent =
      reputationLabels[reputationStars] || 'Local Prospect';
  }
  const potentialRoleEl =
    document.getElementById('player-profile-potential-role');

  if (potentialRoleEl) {
    potentialRoleEl.textContent =
      p.development?.potentialRole ||
      p.potentialRole ||
      'Top 9 F';
  }

  const potentialAccuracyEl =
    document.getElementById('player-profile-potential-accuracy');

  if (potentialAccuracyEl) {
    const accuracy = String(
      p.development?.potentialAccuracy ||
      p.potentialAccuracy ||
      p.scoutingProfile?.evaluationAccuracy ||
      'Medium'
    ).toUpperCase();

    potentialAccuracyEl.textContent =
      accuracy === 'MEDIUM' ? 'MED' : accuracy;
    potentialAccuracyEl.dataset.accuracy =
      accuracy === 'MEDIUM' ? 'MED' : accuracy;
  }
  const attributesEl = document.getElementById('pp-attributes');

  if (attributesEl) {
    const attributes = p.attributes || {};

    const normalizedProfilePosition =
      String(p.position || '')
        .trim()
        .toUpperCase();

    const isGoalieProfile =
      normalizedProfilePosition === 'G' ||
      normalizedProfilePosition.includes('GOAL');

    function getAttributeBarClass(value) {
      if (value >= 70) {
        return 'pp-stat__bar-fill--high';
      }

      if (value >= 55) {
        return 'pp-stat__bar-fill--mid';
      }

      return 'pp-stat__bar-fill--low';
    }

    function getCategoryOverall(stats) {
      if (!Array.isArray(stats) || stats.length === 0) {
        return 50;
      }

      return Math.round(
        stats.reduce(
          (total, stat) =>
            total + Number(stat[1] || 0),
          0
        ) / stats.length
      );
    }

    function buildAttributeCategory({
      name,
      icon,
      stats,
      open = false,
    }) {
      const categoryOverall =
        getCategoryOverall(stats);

      return `
        <div class="pp-attr-cat ${
          open
            ? 'pp-attr-cat--open'
            : ''
        }">
          <button
            class="pp-attr-cat__header"
            type="button"
          >
            <span class="pp-attr-cat__icon">
              ${icon}
            </span>

            <span class="pp-attr-cat__name">
              ${name}
            </span>

            <span class="pp-attr-cat__ovr">
              ${categoryOverall}
            </span>

            <span class="pp-attr-cat__chevron">
              ›
            </span>
          </button>

          <div class="pp-attr-cat__body">
            ${stats.map(([label, value]) => `
              <div class="pp-stat">
                <span class="pp-stat__name">
                  ${label}
                </span>

                <div class="pp-stat__bar">
                  <div
                    class="pp-stat__bar-fill ${
                      getAttributeBarClass(value)
                    }"
                    style="width: ${value}%"
                  ></div>
                </div>

                <span class="pp-stat__val">
                  ${value}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (isGoalieProfile) {
      const athleticismStats = [
        ['Reflexes', Number(attributes.reflexes) || 50],
        ['Agility', Number(attributes.agility) || 50],
        ['Lateral Movement', Number(attributes.lateralMovement) || 50],
        ['Recovery Speed', Number(attributes.recoverySpeed) || 50],
      ];

      const positioningStats = [
        ['Positioning', Number(attributes.positioning) || 50],
        ['Angles', Number(attributes.angles) || 50],
        ['Puck Tracking', Number(attributes.puckTracking) || 50],
        ['Anticipation', Number(attributes.anticipation) || 50],
      ];

      const saveTechniqueStats = [
        ['Glove High', Number(attributes.gloveHigh) || 50],
        ['Glove Low', Number(attributes.gloveLow) || 50],
        ['Blocker High', Number(attributes.blockerHigh) || 50],
        ['Blocker Low', Number(attributes.blockerLow) || 50],
        ['Five Hole', Number(attributes.fiveHole) || 50],
        ['Stick Control', Number(attributes.stickControl) || 50],
      ];

      const controlStats = [
        ['Rebound Control', Number(attributes.reboundControl) || 50],
        ['Composure', Number(attributes.composure) || 50],
        ['Consistency', Number(attributes.consistency) || 50],
      ];

      const puckPlayingStats = [
        ['Puck Handling', Number(attributes.puckHandling) || 50],
        ['Goalie Passing', Number(attributes.goaliePassing) || 50],
      ];

      attributesEl.innerHTML = [
        buildAttributeCategory({
          name: 'Athleticism',
          icon: '⚡',
          stats: athleticismStats,
          open: true,
        }),

        buildAttributeCategory({
          name: 'Positioning',
          icon: '🥅',
          stats: positioningStats,
        }),

        buildAttributeCategory({
          name: 'Save Technique',
          icon: '🧤',
          stats: saveTechniqueStats,
        }),

        buildAttributeCategory({
          name: 'Control & Mental',
          icon: '🧠',
          stats: controlStats,
        }),

        buildAttributeCategory({
          name: 'Puck Playing',
          icon: '🏒',
          stats: puckPlayingStats,
        }),
      ].join('');

      document
        .querySelectorAll(
          '#pp-attributes .pp-attr-cat__header'
        )
        .forEach(header => {
          header.addEventListener('click', () => {
            const selectedCategory =
              header.closest('.pp-attr-cat');

            if (!selectedCategory) return;

            selectedCategory.classList.toggle(
              'pp-attr-cat--open'
            );
          });
        });

      return;
    }

    const skatingStats = [
      ['Speed', Number(attributes.speed) || 50],
      ['Acceleration', Number(attributes.acceleration) || 50],
      ['Agility', Number(attributes.agility) || 50],
      ['Balance', Number(attributes.balance) || 50],
      ['Endurance', Number(attributes.endurance) || 50],
    ];

    const skatingOverall = Math.round(
      skatingStats.reduce((total, stat) => total + stat[1], 0) /
      skatingStats.length
    );


    const shootingStats = [
      ['Wrist Shot Power', Number(attributes.wristShotPower) || 50],
      ['Wrist Shot Accuracy', Number(attributes.wristShotAccuracy) || 50],
      ['Slap Shot Power', Number(attributes.slapShotPower) || 50],
      ['Slap Shot Accuracy', Number(attributes.slapShotAccuracy) || 50],
    ];

    const shootingOverall = Math.round(
      shootingStats.reduce((total, stat) => total + stat[1], 0) /
      shootingStats.length
    );
    const playmakingStats = [
      ['Passing', Number(attributes.passing) || 50],
      ['Puck Control', Number(attributes.puckControl) || 50],
      ['Deking', Number(attributes.deking) || 50],
      ['Hand-Eye', Number(attributes.handEye) || 50],
      ['Offensive Awareness', Number(attributes.offensiveAwareness) || 50],
    ];

    const playmakingOverall = Math.round(
      playmakingStats.reduce((total, stat) => total + stat[1], 0) /
      playmakingStats.length
    );
    const defenseStats = [
      ['Defensive Awareness', Number(attributes.defensiveAwareness) || 50],
      ['Stick Checking', Number(attributes.stickChecking) || 50],
      ['Shot Blocking', Number(attributes.shotBlocking) || 50],
      ['Discipline', Number(attributes.discipline) || 50],
    ];

    const defenseOverall = Math.round(
      defenseStats.reduce((total, stat) => total + stat[1], 0) /
      defenseStats.length
    );
    const physicalStats = [
      ['Body Checking', Number(attributes.bodyChecking) || 50],
      ['Strength', Number(attributes.strength) || 50],
      ['Durability', Number(attributes.durability) || 50],
      ['Balance', Number(attributes.balance) || 50],
      ['Endurance', Number(attributes.endurance) || 50],
    ];

    const physicalOverall = Math.round(
      physicalStats.reduce((total, stat) => total + stat[1], 0) /
      physicalStats.length
    );
    const hockeyIQStats = [
      ['Vision', Number(attributes.vision) || 50],
      ['Offensive Awareness', Number(attributes.offensiveAwareness) || 50],
      ['Defensive Awareness', Number(attributes.defensiveAwareness) || 50],
      ['Discipline', Number(attributes.discipline) || 50],
      ['Leadership', Number(attributes.leadership) || 50],
    ];

    const hockeyIQOverall = Math.round(
      hockeyIQStats.reduce((total, stat) => total + stat[1], 0) /
      hockeyIQStats.length
    );

    attributesEl.innerHTML = `
      <div class="pp-attr-cat pp-attr-cat--open">
        <button class="pp-attr-cat__header" type="button">
          <span class="pp-attr-cat__icon">⛸️</span>
          <span class="pp-attr-cat__name">Skating</span>
          <span class="pp-attr-cat__ovr">${skatingOverall}</span>
          <span class="pp-attr-cat__chevron">›</span>
        </button>

        <div class="pp-attr-cat__body">
          ${skatingStats.map(([name, value]) => `
            <div class="pp-stat">
              <span class="pp-stat__name">${name}</span>

              <div class="pp-stat__bar">
                <div
                  class="pp-stat__bar-fill ${getAttributeBarClass(value)}"
                  style="width: ${value}%"
                ></div>
              </div>

              <span class="pp-stat__val">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pp-attr-cat">
        <button class="pp-attr-cat__header" type="button">
          <span class="pp-attr-cat__icon">🏒</span>
          <span class="pp-attr-cat__name">Shooting</span>
          <span class="pp-attr-cat__ovr">${shootingOverall}</span>
          <span class="pp-attr-cat__chevron">›</span>
        </button>

        <div class="pp-attr-cat__body">
          ${shootingStats.map(([name, value]) => `
            <div class="pp-stat">
              <span class="pp-stat__name">${name}</span>

              <div class="pp-stat__bar">
                <div
                  class="pp-stat__bar-fill ${getAttributeBarClass(value)}"
                  style="width: ${value}%"
                ></div>
              </div>

              <span class="pp-stat__val">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pp-attr-cat">
        <button class="pp-attr-cat__header" type="button">
          <span class="pp-attr-cat__icon">🎯</span>
          <span class="pp-attr-cat__name">Playmaking</span>
          <span class="pp-attr-cat__ovr">${playmakingOverall}</span>
          <span class="pp-attr-cat__chevron">›</span>
        </button>

        <div class="pp-attr-cat__body">
          ${playmakingStats.map(([name, value]) => `
            <div class="pp-stat">
              <span class="pp-stat__name">${name}</span>

              <div class="pp-stat__bar">
                <div
                  class="pp-stat__bar-fill ${getAttributeBarClass(value)}"
                  style="width: ${value}%"
                ></div>
              </div>

              <span class="pp-stat__val">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pp-attr-cat">
        <button class="pp-attr-cat__header" type="button">
          <span class="pp-attr-cat__icon">🛡️</span>
          <span class="pp-attr-cat__name">Defense</span>
          <span class="pp-attr-cat__ovr">${defenseOverall}</span>
          <span class="pp-attr-cat__chevron">›</span>
        </button>

        <div class="pp-attr-cat__body">
          ${defenseStats.map(([name, value]) => `
            <div class="pp-stat">
              <span class="pp-stat__name">${name}</span>

              <div class="pp-stat__bar">
                <div
                  class="pp-stat__bar-fill ${getAttributeBarClass(value)}"
                  style="width: ${value}%"
                ></div>
              </div>

              <span class="pp-stat__val">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pp-attr-cat">
        <button class="pp-attr-cat__header" type="button">
          <span class="pp-attr-cat__icon">💪</span>
          <span class="pp-attr-cat__name">Physical</span>
          <span class="pp-attr-cat__ovr">${physicalOverall}</span>
          <span class="pp-attr-cat__chevron">›</span>
        </button>

        <div class="pp-attr-cat__body">
          ${physicalStats.map(([name, value]) => `
            <div class="pp-stat">
              <span class="pp-stat__name">${name}</span>

              <div class="pp-stat__bar">
                <div
                  class="pp-stat__bar-fill ${getAttributeBarClass(value)}"
                  style="width: ${value}%"
                ></div>
              </div>

              <span class="pp-stat__val">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="pp-attr-cat">
        <button class="pp-attr-cat__header" type="button">
          <span class="pp-attr-cat__icon">🧠</span>
          <span class="pp-attr-cat__name">Hockey IQ</span>
          <span class="pp-attr-cat__ovr">${hockeyIQOverall}</span>
          <span class="pp-attr-cat__chevron">›</span>
        </button>

        <div class="pp-attr-cat__body">
          ${hockeyIQStats.map(([name, value]) => `
            <div class="pp-stat">
              <span class="pp-stat__name">${name}</span>

              <div class="pp-stat__bar">
                <div
                  class="pp-stat__bar-fill ${getAttributeBarClass(value)}"
                  style="width: ${value}%"
                ></div>
              </div>

              <span class="pp-stat__val">${value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  document
  .querySelectorAll('#pp-attributes .pp-attr-cat__header')
  .forEach(header => {
    header.addEventListener('click', () => {
      const selectedCategory = header.closest('.pp-attr-cat');
      if (!selectedCategory) return;

      selectedCategory.classList.toggle('pp-attr-cat--open');
    });
  });
  const attributeLabels = {
    wristShotPower: 'Wrist Shot Power',
    wristShotAccuracy: 'Wrist Shot Accuracy',
    slapShotPower: 'Slap Shot Power',
    slapShotAccuracy: 'Slap Shot Accuracy',

    passing: 'Passing',
    puckControl: 'Puck Control',
    deking: 'Deking',
    handEye: 'Hand-Eye',

    speed: 'Speed',
    acceleration: 'Acceleration',
    agility: 'Agility',
    balance: 'Balance',
    endurance: 'Endurance',

    offensiveAwareness: 'Offensive Awareness',
    defensiveAwareness: 'Defensive Awareness',
    poise: 'Poise',
    discipline: 'Discipline',

    stickChecking: 'Stick Checking',
    shotBlocking: 'Shot Blocking',
    bodyChecking: 'Body Checking',
    strength: 'Strength',
    durability: 'Durability',

    faceoffs: 'Faceoffs',
  };

  const rankedAttributes = Object.entries(p.attributes || {})
    .filter(([key, value]) => {
      return (
        Object.prototype.hasOwnProperty.call(attributeLabels, key) &&
        Number.isFinite(Number(value))
      );
    })
    .map(([key, value]) => ({
      key,
      label: attributeLabels[key],
      value: Number(value),
    }))
    .sort((a, b) => b.value - a.value);

  const scoutingProfile =
    p.scoutingProfile && typeof p.scoutingProfile === 'object'
      ? p.scoutingProfile
      : {};

  const knownStrengths = Array.isArray(scoutingProfile.strengthsKnown)
    ? scoutingProfile.strengthsKnown.filter(Boolean)
    : [];

  const knownWeaknesses = Array.isArray(scoutingProfile.weaknessesKnown)
    ? scoutingProfile.weaknessesKnown.filter(Boolean)
    : [];

  const strengths = knownStrengths.map(trait => ({
    label: typeof trait === 'string' ? trait : (trait.label || trait.name || 'Strength'),
  }));

  const weaknesses = knownWeaknesses.map(trait => ({
    label: typeof trait === 'string' ? trait : (trait.label || trait.name || 'Weakness'),
  }));

  const strengthsEl = document.getElementById('pp-strengths');

  if (strengthsEl) {
    strengthsEl.innerHTML = strengths.length > 0
      ? strengths
          .map(attribute => `
            <li class="pp-dev-list__item">
              ${attribute.label}
            </li>
          `)
          .join('')
      : '<li class="pp-dev-list__item">Not evaluated</li>';
  }

  const weaknessesEl =
    document.getElementById(
      'pp-weaknesses'
    );

  if (weaknessesEl) {
    weaknessesEl.innerHTML = weaknesses.length > 0
      ? weaknesses
          .map(attribute => `
            <li class="pp-dev-list__item">
              ${attribute.label}
            </li>
          `)
          .join('')
      : '<li class="pp-dev-list__item">Not evaluated</li>';
  }

  /*
   * Standalone Player Profile statistics are read-only.
   * This reuses the Career Player statistics renderer but
   * targets the separate snapshot-table containers.
   */
  if (
    typeof globalThis
      .renderProjectIcePlayerStatistics ===
    'function'
  ) {
    globalThis
      .renderProjectIcePlayerStatistics(
        p,
        {
          headId:
            'player-profile-statistics-head',

          bodyId:
            'player-profile-statistics-body',

          footId:
            'player-profile-statistics-foot',
        }
      );
  }

  /*
   * Standalone Player Profile awards are read-only.
   * Championships are included by the shared Awards renderer.
   */
  if (
    typeof globalThis
      .renderProjectIcePlayerAwards ===
    'function'
  ) {
    globalThis
      .renderProjectIcePlayerAwards(
        p,
        {
          listId:
            'player-profile-awards-list',
        }
      );
  }

  /*
   * Standalone Player Profile records are read-only.
   */
  if (
    typeof globalThis
      .renderProjectIcePlayerRecords ===
    'function'
  ) {
    globalThis
      .renderProjectIcePlayerRecords(
        p,
        {
          listId:
            'player-profile-records-list',
        }
      );
  }

  const scoutTextEl =
    document.getElementById(
      'pp-scout-text'
    );

  if (scoutTextEl) {
    const scoutingHistory = Array.isArray(p.scoutingProfile?.scoutingHistory)
      ? p.scoutingProfile.scoutingHistory
      : [];
    const latestScoutingReport = scoutingHistory[scoutingHistory.length - 1] || null;

    scoutTextEl.textContent =
      latestScoutingReport?.summary ||
      latestScoutingReport?.reportText ||
      getScoutReport(p);
  }
}
function getScoutReport(player) {
  const attributes = player.attributes || {};

  const rating = key => Number(attributes[key]) || 50;

  const categoryScores = [
    {
      key: 'skating',
      score: (rating('speed') + rating('acceleration') + rating('agility')) / 3,
    },
    {
      key: 'playmaking',
      score:
        (rating('passing') +
          rating('puckControl') +
          rating('offensiveAwareness')) /
        3,
    },
    {
      key: 'shooting',
      score:
        (rating('wristShotPower') +
          rating('wristShotAccuracy') +
          rating('slapShotPower')) /
        3,
    },
    {
      key: 'defense',
      score:
        (rating('defensiveAwareness') +
          rating('stickChecking') +
          rating('shotBlocking')) /
        3,
    },
    {
      key: 'physical',
      score:
        (rating('strength') +
          rating('bodyChecking') +
          rating('balance')) /
        3,
    },
  ].sort((a, b) => b.score - a.score);

  const bestCategory = categoryScores[0]?.key || 'skating';

  const openingByCategory = {
    skating:
      'is a mobile player whose skating gives them the ability to create separation and play with pace.',
    playmaking:
      'is a creative puck carrier who sees developing plays and looks to generate chances for teammates.',
    shooting:
      'is an offense-first player whose shot makes them a threat whenever space opens in the attacking zone.',
    defense:
      'is a responsible player who reads developing plays well and shows dependable habits away from the puck.',
    physical:
      'plays a competitive, physical style and is willing to battle for possession in difficult areas.',
  };

  const weakestOptions = [
    {
      value: rating('strength'),
      sentence:
        'Continued physical development will be important as the competition becomes stronger.',
    },
    {
      value: rating('defensiveAwareness'),
      sentence:
        'Improving consistency away from the puck would make their overall game more dependable.',
    },
    {
      value: rating('wristShotAccuracy'),
      sentence:
        'More consistent finishing would help convert a greater share of offensive opportunities.',
    },
    {
      value: rating('puckControl'),
      sentence:
        'Cleaner puck management under pressure would help them create offense more consistently.',
    },
    {
      value: rating('endurance'),
      sentence:
        'Improved conditioning would allow them to maintain their impact deeper into games.',
    },
  ].sort((a, b) => a.value - b.value);

  const overall = Number(player.overall) || 60;
  const potential = Number(
    player.development?.potential ?? player.potential
  ) || overall;
  const age = Number(player.age) || 14;

  let projection;

  if (potential >= 94) {
    projection =
      'Their long-term ceiling is among the highest in the class if development remains on schedule.';
  } else if (potential >= 90) {
    projection =
      'They project as an elite prospect with legitimate top-line or top-pair upside.';
  } else if (potential >= 85) {
    projection =
      'They project as a strong long-term prospect with meaningful upside at the next level.';
  } else if (potential >= 80) {
    projection =
      'They project as a dependable contributor with continued development.';
  } else if (overall >= 70 && age <= 15) {
    projection =
      'Their current ability is advanced for their age, giving them room to rise quickly.';
  } else {
    projection =
      'Their future role will depend on steady development over the next several seasons.';
  }

  const fullName =
    `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
    'This prospect';

  return [
    `${fullName} ${openingByCategory[bestCategory]}`,
    weakestOptions[0].sentence,
    projection,
  ].join(' ');
}
function updateHubScreen() {
  /*
   * Always synchronize from the canonical World Engine player
   * before rendering the Career Player tab.
   *
   * This keeps the Player tab, Team tab, Full Stats, attributes,
   * overall, development, and future upgrades on one data source.
   */
  syncCareerPlayerWithWorld();

  const p =
    Game.player;
  const name = `${p.firstName} ${p.lastName}`.trim() || '—';
  const age  = p.age || 14;
  const pos  = p.position || '—';

  const assignedTeam =
    (WorldEngine.state.teams || []).find(team => {
      const matchesTeamId =
        p.teamId && team.teamId === p.teamId;

      const containsPlayer =
        (team.roster || []).some(rosterPlayer =>
          String(rosterPlayer.id) === String(p.id)
        );

      return matchesTeamId || containsPlayer;
    });

  const fullTeamName = assignedTeam
    ? `${assignedTeam.schoolName} ${assignedTeam.teamName}`
    : 'Freshman Tryouts';

  // ── Identity bar ─────────────────────────────────────────
  const nameEl = document.getElementById('hub-player-name');
  if (nameEl) nameEl.textContent = name;

  const posEl = document.getElementById('hub-player-pos');
  if (posEl) posEl.textContent = pos;

  const ageBarEl = document.getElementById('hub-player-age-bar');
  if (ageBarEl) ageBarEl.textContent = age;

  const teamInfoEl = document.getElementById('hub-info-team');

  if (teamInfoEl) {
    teamInfoEl.textContent = p.tryoutsComplete
      ? `${fullTeamName} · ${p.teamLevel || ''} · ${pos}`
      : 'Freshman Tryouts';
  }

  const objectiveEl = document.getElementById('hub-current-objective');

  if (objectiveEl) {
    objectiveEl.textContent = p.tryoutsComplete
      ? 'Earn Coach Reynolds’ trust and work your way up the lineup.'
      : 'Impress the coaching staff during freshman tryouts.';
  }

  // OVR is hardcoded at 60 until attribute calculation is wired.
  // hub-player-ovr already reads "60" from HTML.

  // ── Home tab – team leaders ───────────────────────────────
  const leadersNameEl = document.getElementById('hub-leaders-you-name');
  if (leadersNameEl) leadersNameEl.textContent = name;

  const leadersPosEl = document.getElementById('hub-leaders-you-pos');
  if (leadersPosEl) leadersPosEl.textContent = pos;

  // ── Home tab – standings preview ─────────────────────────
  renderHubStandings();

  // ── Home tab – news ───────────────────────────────────────
  renderHubNews();

  // ── Player profile tab fields ─────────────────────────────
  const ppNameEl =
    document.getElementById(
      'pp-player-name'
    );

  if (ppNameEl) {
    ppNameEl.textContent = name;
  }

  const ppPosEl =
    document.getElementById(
      'pp-player-pos'
    );

  if (ppPosEl) {
    const jerseyNumber =
      Number(p.jerseyNumber);

    ppPosEl.textContent =
      Number.isFinite(jerseyNumber) &&
      jerseyNumber > 0
        ? `${pos} #${jerseyNumber}`
        : pos;
  }

  const ppArchetypeEl =
    document.getElementById(
      'pp-player-archetype'
    );

  if (ppArchetypeEl) {
    ppArchetypeEl.textContent =
      p.archetype ||
      (
        String(pos).toUpperCase() === 'G'
          ? 'Hybrid Goalie'
          : 'Balanced'
      );
  }

  const ppAgeEl =
    document.getElementById(
      'pp-player-age'
    );

  if (ppAgeEl) {
    ppAgeEl.textContent =
      `Age ${age}`;
  }

  const ppCareerSubtitleEl =
    document.getElementById(
      'pp-player-career-subtitle'
    );

  if (ppCareerSubtitleEl) {
    let careerSubtitle =
      p.year ||
      'Freshman';

    if (
      p.draftProjectionLabel
    ) {
      careerSubtitle =
        p.draftProjectionLabel;
    } else if (
      p.careerStageLabel
    ) {
      careerSubtitle =
        p.careerStageLabel;
    } else if (
      p.teamLevel
    ) {
      careerSubtitle =
        p.teamLevel;
    }

    ppCareerSubtitleEl.textContent =
      careerSubtitle;
  }

  const ppTeamEl =
    document.getElementById(
      'pp-player-team'
    );

  if (ppTeamEl) {
    ppTeamEl.textContent =
      fullTeamName;
  }

  /*
   * Render the Career Player tab from the canonical player's
   * real overall and attribute ratings.
   *
   * Queries are scoped to #hub-tab-player so the separate
   * teammate Player Profile screen cannot receive these values.
   */
  const careerPlayerTab =
    document.getElementById(
      'hub-tab-player'
    );

  if (careerPlayerTab) {
    const careerOverallEl =
      careerPlayerTab.querySelector(
        '.pp-header__ovr-value'
      );

    if (careerOverallEl) {
      careerOverallEl.textContent =
        Number(p.overall) || 0;
    }

    const attributes =
      p.attributes || {};

    const averageAttributeValues =
      attributeKeys => {
        if (
          !Array.isArray(attributeKeys) ||
          attributeKeys.length === 0
        ) {
          return 50;
        }

        return Math.round(
          attributeKeys.reduce(
            (total, attributeKey) =>
              total +
              (
                Number(
                  attributes[
                    attributeKey
                  ]
                ) || 50
              ),
            0
          ) /
          attributeKeys.length
        );
      };

    /*
     * These category formulas intentionally match the
     * existing standalone Player Profile calculations.
     */
    const categoryRatings = {
      Shooting:
        averageAttributeValues([
          'wristShotPower',
          'wristShotAccuracy',
          'slapShotPower',
          'slapShotAccuracy',
        ]),

      Playmaking:
        averageAttributeValues([
          'passing',
          'puckControl',
          'deking',
          'handEye',
          'offensiveAwareness',
        ]),

      Skating:
        averageAttributeValues([
          'speed',
          'acceleration',
          'agility',
          'balance',
          'endurance',
        ]),

      Defense:
        averageAttributeValues([
          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'discipline',
        ]),

      Physical:
        averageAttributeValues([
          'bodyChecking',
          'strength',
          'durability',
          'balance',
          'endurance',
        ]),

      'Hockey IQ':
        averageAttributeValues([
          'vision',
          'offensiveAwareness',
          'defensiveAwareness',
          'discipline',
          'leadership',
        ]),
    };

    careerPlayerTab
      .querySelectorAll(
        '.pp-attr-cat'
      )
      .forEach(categoryElement => {
        const nameElement =
          categoryElement.querySelector(
            '.pp-attr-cat__name'
          );

        const overallElement =
          categoryElement.querySelector(
            '.pp-attr-cat__ovr'
          );

        const categoryName =
          nameElement?.textContent
            ?.trim();

        if (
          !categoryName ||
          !overallElement ||
          categoryRatings[
            categoryName
          ] === undefined
        ) {
          return;
        }

        overallElement.textContent =
          categoryRatings[
            categoryName
          ];
      });

    renderCareerPlayerAttributes(p);
    updatePlayerDevelopmentCards(p);

    /*
     * Expose the single existing statistics renderer so the
     * standalone read-only Player Profile can reuse it.
     */
    globalThis.renderProjectIcePlayerStatistics =
      renderCareerPlayerStatistics;

    globalThis.renderProjectIcePlayerAwards =
      updatePlayerAwardsSection;

    globalThis.renderProjectIcePlayerRecords =
      updatePlayerRecordsSection;

    renderCareerPlayerStatistics(p);
    updatePlayerScoutingSection(p);
    updatePlayerAwardsSection(p);
    updatePlayerRecordsSection(p);
    updatePlayerCareerTimeline(p);
    updatePlayerUpgradeNotification();
    
    
  }

  function getUpgradeableAttributeCategories(
    player = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return [];
    }

    const rawPosition =
      String(
        player.position || ''
      )
        .trim()
        .toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes('GOAL');

    const skaterCategories = [
      {
        name: 'Shooting',
        keys: [
          'wristShotPower',
          'wristShotAccuracy',
          'slapShotPower',
          'slapShotAccuracy',
        ],
      },

      {
        name: 'Playmaking',
        keys: [
          'passing',
          'puckControl',
          'deking',
          'handEye',
          'offensiveAwareness',
        ],
      },

      {
        name: 'Skating',
        keys: [
          'speed',
          'acceleration',
          'agility',
          'balance',
          'endurance',
        ],
      },

      {
        name: 'Defense',
        keys: [
          'defensiveAwareness',
          'stickChecking',
          'shotBlocking',
          'discipline',
        ],
      },

      {
        name: 'Physical',
        keys: [
          'bodyChecking',
          'strength',
          'durability',
          'balance',
          'endurance',
        ],
      },

      {
        name: 'Hockey IQ',
        keys: [
          'offensiveAwareness',
          'defensiveAwareness',
          'poise',
          'discipline',
          'faceoffs',
        ],
      },
    ];

    const goalieCategories = [
      {
        name: 'Athleticism',
        keys: [
          'reflexes',
          'agility',
          'lateralMovement',
          'recoverySpeed',
        ],
      },

      {
        name: 'Positioning',
        keys: [
          'positioning',
          'angles',
          'reboundControl',
          'puckTracking',
        ],
      },

      {
        name: 'Save Technique',
        keys: [
          'gloveHigh',
          'gloveLow',
          'blockerHigh',
          'blockerLow',
          'fiveHole',
          'stickControl',
        ],
      },

      {
        name: 'Mental',
        keys: [
          'anticipation',
          'composure',
          'consistency',
        ],
      },

      {
        name: 'Puck Playing',
        keys: [
          'puckHandling',
          'goaliePassing',
        ],
      },
    ];

    const categories =
      isGoalie
        ? goalieCategories
        : skaterCategories;

    return categories
      .filter(category =>
        category.keys.some(
          attributeKey => {
            const eligibility =
              WorldEngine
                .canUpgradePlayerAttribute(
                  player,
                  attributeKey
                );

            return Boolean(
              eligibility?.canUpgrade
            );
          }
        )
      )
      .map(category => category.name);
  }

  function updatePlayerUpgradeNotification() {
    const playerTabButton =
      document.querySelector(
        '.hub-nav__tab[data-hub-tab="player"]'
      );

    if (!playerTabButton) {
      return;
    }

    const canonicalPlayer =
      syncCareerPlayerWithWorld() ||
      Game.player;

    const hasUpgradeAvailable =
      getUpgradeableAttributeCategories(
        canonicalPlayer
      ).length > 0;

    playerTabButton.classList.toggle(
      'hub-nav__tab--upgrade-available',
      hasUpgradeAvailable
    );
  }

  function updatePlayerDevelopmentCards(
    player = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return;
    }

    const setText = (
      elementId,
      value
    ) => {
      const element =
        document.getElementById(
          elementId
        );

      if (element) {
        element.textContent =
          value;
      }
    };

    const development =
      player.development || {};

    const potentialTrend =
      String(
        development.potentialTrend ??
        player.potentialTrend ??
        'stable'
      )
        .trim()
        .toLowerCase();

    const potentialTrendDisplay = {
      rising: {
        text: '▲ Rising',
        className:
          'pp-career-card__value--trend-rising',
      },

      falling: {
        text: '▼ Falling',
        className:
          'pp-career-card__value--trend-falling',
      },

      stable: {
        text: 'Stable',
        className:
          'pp-career-card__value--trend-stable',
      },
    }[
      potentialTrend
    ] || {
      text: 'Stable',
      className:
        'pp-career-card__value--trend-stable',
    };

    const potential =
      Math.max(
        25,
        Math.min(
          99,
          Number(
            development.potential ??
            player.potential ??
            player.overall
          ) || 60
        )
      );

    const potentialRole =
      development.potentialRole ||
      player.potentialRole ||
      'Developing Prospect';

    const coachTrust =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            player.coachTrust
          ) || 0
        )
      );

    const reputationStars =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            player.reputationStars
          ) || 0
        )
      );

    const reputationDisplay =
      '★'.repeat(
        reputationStars
      ) +
      '☆'.repeat(
        5 - reputationStars
      );

    const currentOverall =
      Number(player.overall) || 0;

    const startingOverall =
      Number(
        player.startingOverall
      ) || currentOverall;

    const careerGrowth =
      Number.isFinite(
        Number(
          development
            .totalOverallGrowth
        )
      )
        ? Number(
            development
              .totalOverallGrowth
          )
        : Math.max(
            0,
            currentOverall -
            startingOverall
          );

    /*
     * Until season-transition snapshots exist, current overall
     * growth is also the safest first-season growth value.
     * Later seasons will use the saved season-start overall.
     */
    const seasonStartingOverall =
      Number(
        development
          .seasonStartingOverall
      ) || startingOverall;

    const seasonGrowth =
      currentOverall -
      seasonStartingOverall;

    const formatGrowth =
      value => {
        const safeValue =
          Number(value) || 0;

        return `${
          safeValue > 0
            ? '+'
            : ''
        }${safeValue} OVR`;
      };

    const isGoalie =
      String(
        player.position || ''
      )
        .toUpperCase()
        .includes('G');

    const primeWindow =
      isGoalie
        ? '27–32'
        : '24–28';

    setText(
      'pp-development-potential',
      potentialRole
    );

    const potentialAccuracy =
      development.potentialAccuracy ||
      player.potentialAccuracy ||
      (
        Number(development.potentialConfidence ?? player.potentialConfidence) >= 75
          ? 'High'
          : Number(development.potentialConfidence ?? player.potentialConfidence) >= 45
            ? 'Medium'
            : 'Low'
      );

    const potentialAccuracyKey =
      String(potentialAccuracy || 'Medium')
        .trim()
        .toLowerCase();

    const potentialAccuracyElement =
      document.getElementById(
        'pp-development-potential-accuracy'
      );

    if (potentialAccuracyElement) {
      potentialAccuracyElement.textContent =
        potentialAccuracyKey === 'high'
          ? 'HIGH'
          : potentialAccuracyKey === 'low'
            ? 'LOW'
            : 'MED';

      potentialAccuracyElement.classList.remove(
        'pp-potential-certainty-pill--low',
        'pp-potential-certainty-pill--medium',
        'pp-potential-certainty-pill--high'
      );

      potentialAccuracyElement.classList.add(
        `pp-potential-certainty-pill--${
          potentialAccuracyKey === 'high'
            ? 'high'
            : potentialAccuracyKey === 'low'
              ? 'low'
              : 'medium'
        }`
      );
    }

    setText(
      'pp-development-trend',
      potentialTrendDisplay.text
    );

    const potentialTrendElement =
      document.getElementById(
        'pp-development-trend'
      );

    if (potentialTrendElement) {
      potentialTrendElement.classList.remove(
        'pp-career-card__value--trend-rising',
        'pp-career-card__value--trend-falling',
        'pp-career-card__value--trend-stable'
      );

      potentialTrendElement.classList.add(
        potentialTrendDisplay.className
      );
    }

    setText(
      'pp-development-trust',
      `${coachTrust}%`
    );

    setText(
      'pp-development-reputation',
      reputationDisplay
    );

    setText(
      'career-player-reputation-stars',
      reputationDisplay
    );

    const reputationLabels = {
      0: 'Unranked Prospect',
      1: 'Local Prospect',
      2: 'Regional Prospect',
      3: 'National Prospect',
      4: 'Elite Prospect',
      5: 'Generational Prospect',
    };

    setText(
      'career-player-reputation-label',
      reputationLabels[reputationStars] ||
        'Unranked Prospect'
    );

    setText(
      'pp-growth-season',
      formatGrowth(
        seasonGrowth
      )
    );

    setText(
      'pp-growth-career',
      formatGrowth(
        careerGrowth
      )
    );

    setText(
      'pp-growth-prime',
      primeWindow
    );

    /*
     * Keep the numeric potential available in the tooltip
     * without cluttering the visible card.
     */
    const potentialElement =
      document.getElementById(
        'pp-development-potential'
      );

    if (potentialElement) {
      potentialElement.title =
        `${potentialRole} projection`;
    }
  }

    function renderCareerPlayerStatistics(
      player = {},
      {
        headId = 'pp-statistics-head',
        bodyId = 'pp-statistics-body',
        footId = 'pp-statistics-foot'
      } = {}
    ) {
      const head =
        document.getElementById(headId);

      const body =
        document.getElementById(bodyId);

      const foot =
        document.getElementById(footId);

    if (
      !head ||
      !body ||
      !foot ||
      !player ||
      typeof player !== 'object'
    ) {
      return;
    }

    const rawPosition =
      String(
        player.position || ''
      )
        .trim()
        .toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes('GOAL');

    const assignedTeam =
      (WorldEngine.state.teams || [])
        .find(
          team =>
            team.teamId ===
            player.teamId
        );

    const teamAbbreviation =
      assignedTeam?.abbreviation ||
      '—';

    const currentYear =
      Number(
        WorldEngine.state
          ?.season?.startYear ??
        player.careerStart ??
        2022
      ) || 2022;

    const seasonLabel =
      `${String(currentYear).slice(-2)}-${String(
        currentYear + 1
      ).slice(-2)}`;

    const rawLevel =
      String(
        player.teamLevel ||
        player.year ||
        'HS'
      )
        .trim()
        .toUpperCase();

    const levelLabels = {
      'JUNIOR VARSITY': 'JV',
      'VARSITY': 'V',
      'FRESHMAN': 'FR',
      'SOPHOMORE': 'SO',
      'JUNIOR': 'JR',
      'SENIOR': 'SR',
      'HIGH SCHOOL': 'HS',
    };

    const level =
      levelLabels[rawLevel] ||
      rawLevel.slice(0, 3);

    const seasonStats =
      player.seasonStats || {};

    const careerStats =
      player.careerStats || {};

    /*
     * Completed seasons are permanent snapshots stored in
     * player.history.seasons. They render above the live,
     * highlighted current-season row.
     */
    const completedSeasons =
      Array.isArray(
        player.history?.seasons
      )
        ? player.history.seasons
            .filter(
              season =>
                season &&
                typeof season === 'object'
            )
            .map(season => {
              const stats =
                season.stats ||
                season.seasonStats ||
                {};

              const startYear =
                Number(
                  season.startYear ??
                  season.seasonStartYear ??
                  season.year
                );

              const seasonLabel =
                season.seasonLabel ||
                (
                  Number.isFinite(startYear)
                    ? `${String(startYear).slice(-2)}-${String(
                        startYear + 1
                      ).slice(-2)}`
                    : '—'
                );

              const team =
                season.teamAbbreviation ||
                season.abbreviation ||
                season.team ||
                '—';

              const rawLevel =
                String(
                  season.level ||
                  season.teamLevel ||
                  season.yearLabel ||
                  'HS'
                )
                  .trim()
                  .toUpperCase();

              const levelLabels = {
                'JUNIOR VARSITY': 'JV',
                'VARSITY': 'V',
                'FRESHMAN': 'FR',
                'SOPHOMORE': 'SO',
                'JUNIOR': 'JR',
                'SENIOR': 'SR',
                'HIGH SCHOOL': 'HS',
                'AHL': 'AHL',
                'NHL': 'NHL',
              };

              const level =
                levelLabels[rawLevel] ||
                rawLevel.slice(0, 3);

              return {
                ...season,
                stats,
                seasonLabel,
                team,
                level,
                sortYear:
                  Number.isFinite(startYear)
                    ? startYear
                    : 0,
              };
            })
            .sort(
              (firstSeason, secondSeason) =>
                firstSeason.sortYear -
                secondSeason.sortYear
            )
        : [];

    if (isGoalie) {
      head.innerHTML = `
        <tr>
          <th>Season</th>
          <th>Team</th>
          <th>Lvl</th>
          <th>GP</th>
          <th>W</th>
          <th>L</th>
          <th>OTL</th>
          <th>GA</th>
          <th>GAA</th>
          <th>SV%</th>
          <th>SO</th>
        </tr>
      `;

      const completedGoalieRows =
        completedSeasons
          .map(season => {
            const stats =
              season.stats || {};

            return `
              <tr>
                <td>${season.seasonLabel}</td>
                <td>${season.team}</td>
                <td>${season.level}</td>
                <td>${Number(stats.gamesPlayed) || 0}</td>
                <td>${Number(stats.wins) || 0}</td>
                <td>${Number(stats.losses) || 0}</td>
                <td>${Number(stats.overtimeLosses) || 0}</td>
                <td>${Number(stats.goalsAgainst) || 0}</td>
                <td>${formatGoalieAverage(
                  stats.goalsAgainstAverage
                )}</td>
                <td>${formatSavePercentage(
                  stats.savePercentage
                )}</td>
                <td>${Number(stats.shutouts) || 0}</td>
              </tr>
            `;
          })
          .join('');

      body.innerHTML = `
        ${completedGoalieRows}

        <tr class="pp-statistics-current">
          <td>${seasonLabel}</td>
          <td>${teamAbbreviation}</td>
          <td>${level}</td>
          <td>${Number(seasonStats.gamesPlayed) || 0}</td>
          <td>${Number(seasonStats.wins) || 0}</td>
          <td>${Number(seasonStats.losses) || 0}</td>
          <td>${Number(seasonStats.overtimeLosses) || 0}</td>
          <td>${Number(seasonStats.goalsAgainst) || 0}</td>
          <td>${formatGoalieAverage(
            seasonStats.goalsAgainstAverage
          )}</td>
          <td>${formatSavePercentage(
            seasonStats.savePercentage
          )}</td>
          <td>${Number(seasonStats.shutouts) || 0}</td>
        </tr>
      `;

      foot.innerHTML = `
        <tr class="pp-statistics-career">
          <td>Career</td>
          <td>—</td>
          <td>—</td>
          <td>${Number(careerStats.gamesPlayed) || 0}</td>
          <td>${Number(careerStats.wins) || 0}</td>
          <td>${Number(careerStats.losses) || 0}</td>
          <td>${Number(careerStats.overtimeLosses) || 0}</td>
          <td>${Number(careerStats.goalsAgainst) || 0}</td>
          <td>${formatGoalieAverage(
            careerStats.goalsAgainstAverage
          )}</td>
          <td>${formatSavePercentage(
            careerStats.savePercentage
          )}</td>
          <td>${Number(careerStats.shutouts) || 0}</td>
        </tr>
      `;

      return;
    }

    head.innerHTML = `
      <tr>
        <th>Season</th>
        <th>Team</th>
        <th>Lvl</th>
        <th>GP</th>
        <th>G</th>
        <th>A</th>
        <th>PTS</th>
        <th>+/-</th>
        <th>PIM</th>
        <th>SOG</th>
      </tr>
    `;

    const completedSkaterRows =
      completedSeasons
        .map(season => {
          const stats =
            season.stats || {};

          return `
            <tr>
              <td>${season.seasonLabel}</td>
              <td>${season.team}</td>
              <td>${season.level}</td>
              <td>${Number(stats.gamesPlayed) || 0}</td>
              <td>${Number(stats.goals) || 0}</td>
              <td>${Number(stats.assists) || 0}</td>
              <td>${Number(stats.points) || 0}</td>
              <td>${formatPlusMinus(
                stats.plusMinus
              )}</td>
              <td>${Number(stats.penaltyMinutes) || 0}</td>
              <td>${Number(stats.shots) || 0}</td>
            </tr>
          `;
        })
        .join('');

    body.innerHTML = `
      ${completedSkaterRows}

      <tr class="pp-statistics-current">
        <td>${seasonLabel}</td>
        <td>${teamAbbreviation}</td>
        <td>${level}</td>
        <td>${Number(seasonStats.gamesPlayed) || 0}</td>
        <td>${Number(seasonStats.goals) || 0}</td>
        <td>${Number(seasonStats.assists) || 0}</td>
        <td>${Number(seasonStats.points) || 0}</td>
        <td>${formatPlusMinus(
          seasonStats.plusMinus
        )}</td>
        <td>${Number(seasonStats.penaltyMinutes) || 0}</td>
        <td>${Number(seasonStats.shots) || 0}</td>
      </tr>
    `;

    foot.innerHTML = `
      <tr class="pp-statistics-career">
        <td>Career</td>
        <td>—</td>
        <td>—</td>
        <td>${Number(careerStats.gamesPlayed) || 0}</td>
        <td>${Number(careerStats.goals) || 0}</td>
        <td>${Number(careerStats.assists) || 0}</td>
        <td>${Number(careerStats.points) || 0}</td>
        <td>${formatPlusMinus(
          careerStats.plusMinus
        )}</td>
        <td>${Number(careerStats.penaltyMinutes) || 0}</td>
        <td>${Number(careerStats.shots) || 0}</td>
      </tr>
    `;
  }

  function formatPlusMinus(
    value
  ) {
    const number =
      Number(value) || 0;

    return number > 0
      ? `+${number}`
      : String(number);
  }

  function formatGoalieAverage(
    value
  ) {
    return (
      Number(value) || 0
    ).toFixed(2);
  }

  function formatSavePercentage(
    value
  ) {
    const number =
      Number(value) || 0;

    if (number <= 0) {
      return '.000';
    }

    return number
      .toFixed(3)
      .replace(/^0/, '');
  }

  function updatePlayerScoutingSection(
    player = {}
  ) {
    if (
      !player ||
      typeof player !== 'object'
    ) {
      return;
    }

    const scouting =
      player.scoutingProfile || {};

    const setText = (
      elementId,
      value
    ) => {
      const element =
        document.getElementById(
          elementId
        );

      if (element) {
        element.textContent =
          value;
      }
    };

    const publicRank =
      Number(
        scouting.publicRank
      );

    const previousRank =
      Number(
        scouting.previousRank
      );

    const rankingText =
      Number.isFinite(publicRank) &&
      publicRank > 0
        ? `#${publicRank}`
        : 'Not Ranked';

    let rankingChangeText =
      'No ranking history';

    if (
      Number.isFinite(publicRank) &&
      publicRank > 0 &&
      Number.isFinite(previousRank) &&
      previousRank > 0
    ) {
      const rankDifference =
        previousRank -
        publicRank;

      rankingChangeText =
        rankDifference > 0
          ? `▲ Up ${rankDifference}`
          : rankDifference < 0
            ? `▼ Down ${Math.abs(
                rankDifference
              )}`
            : 'No change';
    } else if (
      Number.isFinite(publicRank) &&
      publicRank > 0
    ) {
      rankingChangeText =
        'First published ranking';
    }

    const organizationsWatching =
      Array.isArray(
        scouting.organizationsWatching
      )
        ? scouting.organizationsWatching
        : [];

    const watchersText =
      organizationsWatching.length > 0
        ? organizationsWatching
            .map(organization => {
              if (
                typeof organization ===
                'string'
              ) {
                return organization;
              }

              return (
                organization.name ||
                organization.label ||
                organization.teamName ||
                organization.schoolName ||
                'Organization'
              );
            })
            .join(', ')
        : 'No organizations watching';

    const confidence =
      Math.max(
        25,
        Math.min(
          100,
          Number(
            player.development
              ?.potentialConfidence ??
            player.potentialConfidence
          ) || 50
        )
      );

    const canonicalAccuracy =
      player.development?.potentialAccuracy ||
      player.potentialAccuracy ||
      null;

    const evaluationAccuracy =
      canonicalAccuracy ||
      (
        confidence >= 75
          ? 'High'
          : confidence >= 50
            ? 'Medium'
            : 'Low'
      );

    const rivalWatch =
      scouting.rivalWatch &&
      typeof scouting.rivalWatch === 'object'
        ? scouting.rivalWatch
        : null;

    const rivalCurrentRank =
      document.getElementById(
        'pp-scouting-rival-current-rank'
      );

    const rivalEmpty =
      document.getElementById(
        'pp-scouting-rival-empty'
      );

    const rivalGrid =
      document.getElementById(
        'pp-scouting-rival-grid'
      );

    const escapeScoutingText = value =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const renderRival = (
      prefix,
      rival
    ) => {
      const nameElement =
        document.getElementById(
          `pp-scouting-rival-${prefix}-name`
        );
      const metaElement =
        document.getElementById(
          `pp-scouting-rival-${prefix}-meta`
        );

      if (!nameElement || !metaElement) return;

      if (!rival) {
        nameElement.textContent = 'No nearby prospect';
        metaElement.textContent = '—';
        return;
      }

      nameElement.textContent =
        rival.name ||
        'Prospect';

      const rank =
        Math.max(0, Number(rival.rank) || 0);
      const position = rival.position || '—';
      const teamName = rival.teamName || null;
      const movement = Number(rival.rankChange) || 0;
      const movementText =
        movement > 0
          ? `▲ ${movement}`
          : movement < 0
            ? `▼ ${Math.abs(movement)}`
            : null;

      metaElement.textContent = [
        rank > 0 ? `#${rank}` : null,
        position,
        movementText,
        teamName,
      ].filter(Boolean).join(' • ');
    };

    const rankedForRivalWatch =
      Boolean(
        rivalWatch &&
        Number(rivalWatch.currentRank) > 0
      );

    if (rivalCurrentRank) {
      rivalCurrentRank.textContent =
        rankedForRivalWatch
          ? `#${Number(rivalWatch.currentRank)}`
          : 'Not Ranked';
    }

    if (rivalEmpty) {
      rivalEmpty.hidden =
        rankedForRivalWatch;
    }

    if (rivalGrid) {
      rivalGrid.hidden =
        !rankedForRivalWatch;
    }

    if (rankedForRivalWatch) {
      renderRival('above', rivalWatch.above);
      renderRival('position', rivalWatch.positionRival);
      renderRival('below', rivalWatch.below);
    }

    const scoutingHistory =
      Array.isArray(
        scouting.scoutingHistory
      )
        ? scouting.scoutingHistory
        : [];

    const latestReport =
      scoutingHistory.length > 0
        ? scoutingHistory[
            scoutingHistory.length - 1
          ]
        : null;

    const reportText =
      latestReport?.summary ||
      latestReport?.reportText ||
      latestReport?.text ||
      latestReport?.evaluation ||
      'Play in scout-attended games to begin building an external evaluation.';

    const reportDate =
      latestReport?.date ||
      latestReport?.createdAt ||
      latestReport?.seasonLabel ||
      'No report yet';

    const renderTraitList = (
      elementId,
      traits
    ) => {
      const container =
        document.getElementById(
          elementId
        );

      if (!container) {
        return;
      }

      const safeTraits =
        Array.isArray(traits)
          ? traits.filter(Boolean)
          : [];

      if (safeTraits.length === 0) {
        container.innerHTML = `
          <span class="pp-scouting-empty">
            Not evaluated
          </span>
        `;

        return;
      }

      container.innerHTML =
        safeTraits
          .map(trait => `
            <span class="pp-scouting-trait">
              ${
                typeof trait === 'string'
                  ? trait
                  : (
                      trait.label ||
                      trait.name ||
                      'Evaluation'
                    )
              }
            </span>
          `)
          .join('');
    };

    setText(
      'pp-scouting-ranking',
      rankingText
    );

    setText(
      'pp-scouting-ranking-change',
      rankingChangeText
    );

    setText(
      'pp-scouting-interest',
      scouting.interestLevel ||
      'None'
    );

    setText(
      'pp-scouting-watchers',
      watchersText
    );

    setText(
      'pp-scouting-games-observed',
      Number(
        scouting.gamesObserved
      ) || 0
    );

    setText(
      'pp-scouting-accuracy',
      evaluationAccuracy
    );

    setText(
      'pp-scouting-confidence-detail',
      `Potential certainty • ${Math.round(confidence)}%`
    );

    setText(
      'pp-scouting-report-date',
      reportDate
    );

    setText(
      'pp-scouting-report-text',
      reportText
    );

    renderTraitList(
      'pp-scouting-strengths',
      scouting.strengthsKnown
    );

    renderTraitList(
      'pp-scouting-weaknesses',
      scouting.weaknessesKnown
    );
  }

  function updatePlayerAwardsSection(
      player = {},
      {
        listId = 'pp-awards-list'
      } = {}
    ) {
      const awardsList =
        document.getElementById(
          listId
        );

    if (!awardsList) return;

    const history =
      player.history || {};

    const awards = [
      ...(history.awards || []),
      ...(history.championships || [])
    ];

    awards.sort((a, b) => {
      return (
        (b.year || 0) -
        (a.year || 0)
      );
    });

    if (!awards.length) {

      awardsList.innerHTML = `
        <div class="pp-awards-empty">

          <span class="pp-awards-empty__icon">
            🏆
          </span>

          <div>

            <strong class="pp-awards-empty__title">
              No Awards Yet
            </strong>

            <p class="pp-awards-empty__text">
              Individual awards and championships will appear here throughout your career.
            </p>

          </div>

        </div>
      `;

      return;
    }

    awardsList.innerHTML =
      awards.map(award => `

        <div class="pp-award-card">

          <div class="pp-award-card__icon">
            ${award.icon || "🏆"}
          </div>

          <div class="pp-award-card__info">

            <div class="pp-award-card__title">
              ${award.name}
            </div>

            <div class="pp-award-card__meta">
              ${award.season || ""}
              •
              ${award.level || ""}
              •
              ${award.team || ""}
            </div>

          </div>

        </div>

      `).join("");

  }

  function updatePlayerRecordsSection(
      player = {},
      {
        listId = 'pp-records-list'
      } = {}
    ) {
      const recordsList =
        document.getElementById(
          listId
        );

    if (!recordsList) {
      return;
    }

    const records =
      Array.isArray(
        player.history?.records
      )
        ? [...player.history.records]
        : [];

    records.sort(
      (firstRecord, secondRecord) => {
        const firstYear =
          Number(
            firstRecord.year ??
            firstRecord.seasonStartYear
          ) || 0;

        const secondYear =
          Number(
            secondRecord.year ??
            secondRecord.seasonStartYear
          ) || 0;

        return secondYear - firstYear;
      }
    );

    if (records.length === 0) {
      recordsList.innerHTML = `
        <div class="pp-records-empty">
          <span class="pp-records-empty__icon">
            📖
          </span>

          <div>
            <strong class="pp-records-empty__title">
              No Records Yet
            </strong>

            <p class="pp-records-empty__text">
              Team, league, and career records will appear here when you set them.
            </p>
          </div>
        </div>
      `;

      return;
    }

    recordsList.innerHTML =
      records
        .map(record => {
          const recordName =
            record.name ||
            record.title ||
            record.recordName ||
            'Career Record';

          const recordValue =
            record.value ??
            record.recordValue ??
            record.total ??
            '';

          const recordScope =
            record.scope ||
            record.type ||
            record.level ||
            'Career';

          const recordSeason =
            record.season ||
            record.seasonLabel ||
            (
              record.year
                ? String(record.year)
                : ''
            );

          const metaParts = [
            recordScope,
            recordSeason,
            record.team ||
              record.teamName ||
              '',
          ].filter(Boolean);

          return `
            <article class="pp-record-card">
              <div class="pp-record-card__icon">
                ${record.icon || '📖'}
              </div>

              <div class="pp-record-card__content">
                <strong class="pp-record-card__title">
                  ${recordName}
                </strong>

                ${
                  recordValue !== ''
                    ? `
                      <span class="pp-record-card__value">
                        ${recordValue}
                      </span>
                    `
                    : ''
                }

                ${
                  metaParts.length > 0
                    ? `
                      <span class="pp-record-card__meta">
                        ${metaParts.join(' • ')}
                      </span>
                    `
                    : ''
                }
              </div>
            </article>
          `;
        })
        .join('');
  }

  function updatePlayerCareerTimeline(
    player = {}
  ) {
    const timeline =
      document.getElementById(
        'pp-career-timeline'
      );

    if (!timeline) {
      return;
    }

    const history =
      player.history &&
      typeof player.history === 'object'
        ? player.history
        : {};

    const timelineEntries = [];

    const getEntryYear = entry => {
      const directYear =
        Number(
          entry?.year ??
          entry?.startYear ??
          entry?.seasonStartYear ??
          entry?.draftYear
        );

      if (Number.isFinite(directYear)) {
        return directYear;
      }

      const seasonText =
        String(
          entry?.season ||
          entry?.seasonLabel ||
          ''
        );

      const seasonYearMatch =
        seasonText.match(/\d{4}/);

      if (seasonYearMatch) {
        return Number(
          seasonYearMatch[0]
        );
      }

      const dateText =
        entry?.date ||
        entry?.createdAt ||
        entry?.completedAt ||
        null;

      if (dateText) {
        const parsedDate =
          new Date(dateText);

        if (
          !Number.isNaN(
            parsedDate.getTime()
          )
        ) {
          return parsedDate.getFullYear();
        }
      }

      return 0;
    };

    const getEntryTimestamp = entry => {
      const dateText =
        entry?.date ||
        entry?.createdAt ||
        entry?.completedAt ||
        null;

      if (dateText) {
        const timestamp =
          new Date(dateText).getTime();

        if (
          !Number.isNaN(timestamp)
        ) {
          return timestamp;
        }
      }

      const year =
        getEntryYear(entry);

      return year > 0
        ? new Date(
            `${year}-01-01T00:00:00`
          ).getTime()
        : 0;
    };

    const addTimelineEntry = ({
      source = {},
      type = 'milestone',
      icon = '🏒',
      title = 'Career Milestone',
      detail = '',
    }) => {
      if (
        !source ||
        typeof source !== 'object'
      ) {
        return;
      }

      const year =
        getEntryYear(source);

      const season =
        source.season ||
        source.seasonLabel ||
        '';

      const team =
        source.team ||
        source.teamName ||
        source.schoolName ||
        '';

      const level =
        source.level ||
        source.teamLevel ||
        source.league ||
        '';

      timelineEntries.push({
        id:
          source.id ||
          `${type}-${year}-${title}-${timelineEntries.length}`,

        type,

        icon:
          source.icon ||
          icon,

        title,

        detail,

        year,

        season,

        team,

        level,

        timestamp:
          getEntryTimestamp(
            source
          ),
      });
    };

    /*
     * Completed seasons establish the long-term year-by-year
     * structure of the career.
     */
    (
      Array.isArray(history.seasons)
        ? history.seasons
        : []
    ).forEach(season => {
      const seasonLabel =
        season.season ||
        season.seasonLabel ||
        (
          season.startYear
            ? `${season.startYear}-${String(
                Number(season.startYear) + 1
              ).slice(-2)}`
            : ''
        );

      const teamName =
        season.team ||
        season.teamName ||
        season.schoolName ||
        '';

      const level =
        season.level ||
        season.teamLevel ||
        season.league ||
        '';

      const detailParts = [
        teamName,
        level,
      ].filter(Boolean);

      addTimelineEntry({
        source: {
          ...season,
          season:
            seasonLabel,
        },

        type:
          'season',

        icon:
          '📅',

        title:
          season.title ||
          season.name ||
          'Season Completed',

        detail:
          detailParts.join(' • '),
      });
    });

    /*
     * Team history includes joining a program, promotion to a
     * new level, trades, signings, and other team changes.
     */
    (
      Array.isArray(history.teams)
        ? history.teams
        : []
    ).forEach(teamEntry => {
      const teamName =
        teamEntry.team ||
        teamEntry.teamName ||
        teamEntry.schoolName ||
        'New Team';

      const action =
        teamEntry.action ||
        teamEntry.event ||
        teamEntry.status ||
        'Joined';

      addTimelineEntry({
        source:
          teamEntry,

        type:
          'team',

        icon:
          '🛡️',

        title:
          teamEntry.title ||
          `${action} ${teamName}`,

        detail:
          teamEntry.level ||
          teamEntry.teamLevel ||
          teamEntry.league ||
          '',
      });
    });

    (
      Array.isArray(
        history.transactions
      )
        ? history.transactions
        : []
    ).forEach(transaction => {
      addTimelineEntry({
        source:
          transaction,

        type:
          'transaction',

        icon:
          '✍️',

        title:
          transaction.title ||
          transaction.name ||
          transaction.description ||
          transaction.type ||
          'Career Transaction',

        detail:
          transaction.team ||
          transaction.teamName ||
          transaction.detail ||
          '',
      });
    });

    (
      Array.isArray(
        history.lineupChanges
      )
        ? history.lineupChanges
        : []
    ).forEach(change => {
      const role =
        change.newRole ||
        change.role ||
        change.line ||
        change.pair ||
        change.goalieRole ||
        '';

      addTimelineEntry({
        source:
          change,

        type:
          'lineup',

        icon:
          '📋',

        title:
          change.title ||
          change.description ||
          'Lineup Role Changed',

        detail:
          role
            ? `New role: ${role}`
            : '',
      });
    });

    (
      Array.isArray(history.awards)
        ? history.awards
        : []
    ).forEach(award => {
      addTimelineEntry({
        source:
          award,

        type:
          'award',

        icon:
          '🏆',

        title:
          award.name ||
          award.title ||
          'Award Won',

        detail:
          [
            award.level ||
              award.league ||
              '',

            award.team ||
              award.teamName ||
              '',
          ]
            .filter(Boolean)
            .join(' • '),
      });
    });

    (
      Array.isArray(
        history.championships
      )
        ? history.championships
        : []
    ).forEach(championship => {
      addTimelineEntry({
        source:
          championship,

        type:
          'championship',

        icon:
          '🥇',

        title:
          championship.name ||
          championship.title ||
          'Championship Won',

        detail:
          [
            championship.level ||
              championship.league ||
              '',

            championship.team ||
              championship.teamName ||
              '',
          ]
            .filter(Boolean)
            .join(' • '),
      });
    });

    (
      Array.isArray(
        history.milestones
      )
        ? history.milestones
        : []
    ).forEach(milestone => {
      addTimelineEntry({
        source:
          milestone,

        type:
          'milestone',

        icon:
          '⭐',

        title:
          milestone.name ||
          milestone.title ||
          milestone.description ||
          'Career Milestone',

        detail:
          milestone.detail ||
          milestone.value ||
          '',
      });
    });

    (
      Array.isArray(history.records)
        ? history.records
        : []
    ).forEach(record => {
      const recordValue =
        record.value ??
        record.recordValue ??
        record.total ??
        '';

      addTimelineEntry({
        source:
          record,

        type:
          'record',

        icon:
          '📖',

        title:
          record.name ||
          record.title ||
          record.recordName ||
          'Record Set',

        detail:
          recordValue !== ''
            ? String(recordValue)
            : (
                record.scope ||
                record.level ||
                ''
              ),
      });
    });

    if (
      history.draft &&
      typeof history.draft === 'object'
    ) {
      const draft =
        history.draft;

      const pick =
        draft.overallPick ??
        draft.pick ??
        draft.selection ??
        null;

      const round =
        draft.round ??
        null;

      const draftDetailParts = [
        draft.team ||
          draft.teamName ||
          '',

        round
          ? `Round ${round}`
          : '',

        pick
          ? `${pick}th Overall`
          : '',
      ].filter(Boolean);

      addTimelineEntry({
        source:
          draft,

        type:
          'draft',

        icon:
          '🎤',

        title:
          draft.title ||
          'Selected in the NHL Draft',

        detail:
          draftDetailParts.join(' • '),
      });
    }

    /*
     * Remove accidental duplicate history records while
     * preserving genuinely separate career events.
     */
    const uniqueEntries = [];

    const seenEntries =
      new Set();

    timelineEntries.forEach(entry => {
      const duplicateKey = [
        entry.type,
        entry.title,
        entry.year,
        entry.season,
        entry.team,
        entry.detail,
      ].join('|');

      if (
        seenEntries.has(
          duplicateKey
        )
      ) {
        return;
      }

      seenEntries.add(
        duplicateKey
      );

      uniqueEntries.push(
        entry
      );
    });

    uniqueEntries.sort(
      (
        firstEntry,
        secondEntry
      ) => {
        if (
          firstEntry.timestamp !==
          secondEntry.timestamp
        ) {
          return (
            secondEntry.timestamp -
            firstEntry.timestamp
          );
        }

        return (
          secondEntry.year -
          firstEntry.year
        );
      }
    );

    if (
      uniqueEntries.length === 0
    ) {
      timeline.innerHTML = `
        <div class="pp-timeline-empty">
          <span class="pp-timeline-empty__icon">
            🏒
          </span>

          <div>
            <strong class="pp-timeline-empty__title">
              Your Story Starts Here
            </strong>

            <p class="pp-timeline-empty__text">
              Teams, promotions, milestones, awards, championships, and major career moments will appear here.
            </p>
          </div>
        </div>
      `;

      return;
    }

    timeline.innerHTML =
      uniqueEntries
        .map(entry => {
          const dateLabel =
            entry.season ||
            (
              entry.year > 0
                ? String(entry.year)
                : 'Career'
            );

          const metaParts = [
            entry.team,
            entry.level,
            entry.detail,
          ].filter(Boolean);

          return `
            <article
              class="pp-timeline-entry"
              data-timeline-type="${entry.type}"
            >
              <div class="pp-timeline-entry__rail">
                <span class="pp-timeline-entry__dot">
                  ${entry.icon}
                </span>

                <span class="pp-timeline-entry__line"></span>
              </div>

              <div class="pp-timeline-entry__content">
                <span class="pp-timeline-entry__date">
                  ${dateLabel}
                </span>

                <strong class="pp-timeline-entry__title">
                  ${entry.title}
                </strong>

                ${
                  metaParts.length > 0
                    ? `
                      <span class="pp-timeline-entry__meta">
                        ${metaParts.join(' • ')}
                      </span>
                    `
                    : ''
                }
              </div>
            </article>
          `;
        })
        .join('');
  }

  function showAttributeUpgradeConfirmation({
    attributeLabel = 'Attribute',
    attributeBefore = 0,
    attributeAfter = 0,
    overallBefore = 0,
    overallAfter = 0,
  } = {}) {
    const existingToast =
      document.getElementById(
        'attribute-upgrade-confirmation'
      );

    if (existingToast) {
      existingToast.remove();
    }

    const overallChanged =
      Number(overallAfter) !==
      Number(overallBefore);

    const toast =
      document.createElement('div');

    toast.id =
      'attribute-upgrade-confirmation';

    toast.className =
      'attribute-upgrade-confirmation';

    toast.innerHTML = `
      <div
        class="attribute-upgrade-confirmation__eyebrow"
      >
        ATTRIBUTE UPGRADED
      </div>

      <div
        class="attribute-upgrade-confirmation__name"
      >
        ${attributeLabel}
      </div>

      <div
        class="attribute-upgrade-confirmation__change"
      >
        <span>${attributeBefore}</span>

        <span
          class="attribute-upgrade-confirmation__arrow"
        >
          →
        </span>

        <strong>${attributeAfter}</strong>
      </div>

      ${
        overallChanged
          ? `
            <div
              class="attribute-upgrade-confirmation__overall"
            >
              <span>Overall</span>

              <strong>
                ${overallBefore}
                →
                ${overallAfter}
              </strong>
            </div>
          `
          : ''
      }
    `;

    document.body.appendChild(
      toast
    );

    requestAnimationFrame(() => {
      toast.classList.add(
        'attribute-upgrade-confirmation--visible'
      );
    });

    window.setTimeout(() => {
      toast.classList.remove(
        'attribute-upgrade-confirmation--visible'
      );

      window.setTimeout(() => {
        toast.remove();
      }, 250);
    }, 2200);
  }

  function renderCareerPlayerAttributes(
    player = {}
  ) {
    const container =
      document.getElementById(
        'career-player-attributes'
      );

    const previouslyOpenCategoryNames =
      Array.from(
        container?.querySelectorAll(
          '.pp-attr-cat.pp-attr-cat--open .pp-attr-cat__name'
        ) || []
      )
        .map(element =>
          element.textContent?.trim()
        )
        .filter(Boolean);

    if (
      !container ||
      !player ||
      typeof player !== 'object'
    ) {
      return;
    }

    const attributes =
      player.attributes || {};

    const rawPosition =
      String(
        player.position || ''
      ).toUpperCase();

    const isGoalie =
      rawPosition === 'G' ||
      rawPosition.includes('GOAL');

    const skaterCategories = [
      {
        name: 'Shooting',
        icon: '🏒',
        attributes: [
          {
            key: 'wristShotPower',
            label: 'Wrist Shot Power',
          },
          {
            key: 'wristShotAccuracy',
            label: 'Wrist Shot Accuracy',
          },
          {
            key: 'slapShotPower',
            label: 'Slap Shot Power',
          },
          {
            key: 'slapShotAccuracy',
            label: 'Slap Shot Accuracy',
          },
        ],
      },

      {
        name: 'Playmaking',
        icon: '🎯',
        attributes: [
          {
            key: 'passing',
            label: 'Passing',
          },
          {
            key: 'puckControl',
            label: 'Puck Control',
          },
          {
            key: 'deking',
            label: 'Deking',
          },
          {
            key: 'handEye',
            label: 'Hand-Eye',
          },
          {
            key: 'offensiveAwareness',
            label: 'Offensive Awareness',
          },
        ],
      },

      {
        name: 'Skating',
        icon: '⛸️',
        attributes: [
          {
            key: 'speed',
            label: 'Speed',
          },
          {
            key: 'acceleration',
            label: 'Acceleration',
          },
          {
            key: 'agility',
            label: 'Agility',
          },
          {
            key: 'balance',
            label: 'Balance',
          },
          {
            key: 'endurance',
            label: 'Endurance',
          },
        ],
      },

      {
        name: 'Defense',
        icon: '🛡️',
        attributes: [
          {
            key: 'defensiveAwareness',
            label: 'Defensive Awareness',
          },
          {
            key: 'stickChecking',
            label: 'Stick Checking',
          },
          {
            key: 'shotBlocking',
            label: 'Shot Blocking',
          },
          {
            key: 'discipline',
            label: 'Discipline',
          },
        ],
      },

      {
        name: 'Physical',
        icon: '💪',
        attributes: [
          {
            key: 'bodyChecking',
            label: 'Body Checking',
          },
          {
            key: 'strength',
            label: 'Strength',
          },
          {
            key: 'durability',
            label: 'Durability',
          },
          {
            key: 'balance',
            label: 'Balance',
          },
          {
            key: 'endurance',
            label: 'Endurance',
          },
        ],
      },

      {
        name: 'Hockey IQ',
        icon: '🧠',
        attributes: [
          {
            key: 'offensiveAwareness',
            label: 'Offensive Awareness',
          },
          {
            key: 'defensiveAwareness',
            label: 'Defensive Awareness',
          },
          {
            key: 'poise',
            label: 'Poise',
          },
          {
            key: 'discipline',
            label: 'Discipline',
          },
          {
            key: 'faceoffs',
            label: 'Faceoffs',
          },
        ],
      },
    ];

    const goalieCategories = [
      {
        name: 'Athleticism',
        icon: '⚡',
        attributes: [
          {
            key: 'reflexes',
            label: 'Reflexes',
          },
          {
            key: 'agility',
            label: 'Agility',
          },
          {
            key: 'lateralMovement',
            label: 'Lateral Movement',
          },
          {
            key: 'recoverySpeed',
            label: 'Recovery Speed',
          },
        ],
      },

      {
        name: 'Positioning',
        icon: '🥅',
        attributes: [
          {
            key: 'positioning',
            label: 'Positioning',
          },
          {
            key: 'angles',
            label: 'Angles',
          },
          {
            key: 'reboundControl',
            label: 'Rebound Control',
          },
          {
            key: 'puckTracking',
            label: 'Puck Tracking',
          },
        ],
      },

      {
        name: 'Save Technique',
        icon: '🧤',
        attributes: [
          {
            key: 'gloveHigh',
            label: 'Glove High',
          },
          {
            key: 'gloveLow',
            label: 'Glove Low',
          },
          {
            key: 'blockerHigh',
            label: 'Blocker High',
          },
          {
            key: 'blockerLow',
            label: 'Blocker Low',
          },
          {
            key: 'fiveHole',
            label: 'Five Hole',
          },
          {
            key: 'stickControl',
            label: 'Stick Control',
          },
        ],
      },

      {
        name: 'Mental',
        icon: '🧠',
        attributes: [
          {
            key: 'anticipation',
            label: 'Anticipation',
          },
          {
            key: 'composure',
            label: 'Composure',
          },
          {
            key: 'consistency',
            label: 'Consistency',
          },
        ],
      },

      {
        name: 'Puck Playing',
        icon: '🏒',
        attributes: [
          {
            key: 'puckHandling',
            label: 'Puck Handling',
          },
          {
            key: 'goaliePassing',
            label: 'Passing',
          },
        ],
      },
    ];

    const rawCategories =
      isGoalie
        ? goalieCategories
        : skaterCategories;

    /*
     * PLAYER TAB ATTRIBUTE OWNERSHIP
     *
     * Several canonical attributes legitimately influence more than one
     * development category under the hood. The Player tab should not render
     * the same upgradeable attribute twice, though, because one manual +1
     * then looks like two separate upgrades happened.
     *
     * Keep the backend category/development weights untouched and give each
     * skater attribute one clear player-facing home here.
     */
    const primaryCategoryByAttribute = {
      speed: 'Skating',
      acceleration: 'Skating',
      agility: 'Skating',
      balance: 'Skating',
      endurance: 'Skating',

      wristShotPower: 'Shooting',
      wristShotAccuracy: 'Shooting',
      slapShotPower: 'Shooting',
      slapShotAccuracy: 'Shooting',
      handEye: 'Playmaking',

      passing: 'Playmaking',
      puckControl: 'Playmaking',
      deking: 'Playmaking',

      defensiveAwareness: 'Defense',
      stickChecking: 'Defense',
      shotBlocking: 'Defense',
      discipline: 'Defense',

      strength: 'Physical',
      bodyChecking: 'Physical',
      durability: 'Physical',

      offensiveAwareness: 'Hockey IQ',
      poise: 'Hockey IQ',
    };

    const seenAttributeKeys =
      new Set();

    const categories =
      isGoalie
        ? rawCategories
        : rawCategories
            .map(category => ({
              ...category,
              attributes:
                Array.isArray(category.attributes)
                  ? category.attributes.filter(attribute => {
                      const attributeKey =
                        attribute?.key ||
                        null;

                      if (!attributeKey) {
                        return true;
                      }

                      const primaryCategory =
                        primaryCategoryByAttribute[
                          attributeKey
                        ];

                      if (
                        primaryCategory &&
                        primaryCategory !== category.name
                      ) {
                        return false;
                      }

                      if (
                        seenAttributeKeys.has(
                          attributeKey
                        )
                      ) {
                        return false;
                      }

                      seenAttributeKeys.add(
                        attributeKey
                      );

                      return true;
                    })
                  : [],
            }))
            .filter(
              category =>
                category.attributes.length > 0
            );

    const upgradeableCategories =
      getUpgradeableAttributeCategories(
        player
      );

    const getCategoryRating =
      categoryAttributes => {
        const validRatings =
          categoryAttributes
            .map(attribute =>
              Number(
                attributes[
                  attribute.key
                ]
              )
            )
            .filter(
              rating =>
                Number.isFinite(rating)
            );

        if (validRatings.length === 0) {
          return 50;
        }

        return Math.round(
          validRatings.reduce(
            (sum, rating) =>
              sum + rating,
            0
          ) /
          validRatings.length
        );
      };

    const getRatingClass =
      rating => {
        if (rating >= 80) {
          return 'pp-stat__bar-fill--elite';
        }

        if (rating >= 70) {
          return 'pp-stat__bar-fill--high';
        }

        if (rating >= 60) {
          return 'pp-stat__bar-fill--mid';
        }

        return 'pp-stat__bar-fill--low';
      };

    container.innerHTML =
      categories
        .map(category => {
          const categoryRating =
            getCategoryRating(
              category.attributes
            );

          const attributeRows =
            category.attributes
              .map(attribute => {
                const rating =
                  Math.max(
                    25,
                    Math.min(
                      99,
                      Number(
                        attributes[
                          attribute.key
                        ]
                      ) || 50
                    )
                  );

                const eligibility =
                  WorldEngine
                    .canUpgradePlayerAttribute(
                      player,
                      attribute.key
                    );

                const currentXP =
                  Math.max(
                    0,
                    Number(
                      eligibility.currentXP
                    ) || 0
                  );

                const requiredXP =
                  Math.max(
                    0,
                    Number(
                      eligibility.requiredXP
                    ) || 0
                  );

                const xpPercentage =
                  requiredXP > 0
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          (
                            currentXP /
                            requiredXP
                          ) * 100
                        )
                      )
                    : 100;

                const upgradeMarkup =
                  eligibility.canUpgrade
                    ? `
                      <button
                        class="pp-attribute-upgrade"
                        type="button"
                        data-upgrade-attribute="${attribute.key}"
                      >
                        Upgrade Available
                      </button>
                    `
                    : eligibility.reason ===
                      'attribute-capped'
                      ? `
                        <span
                          class="pp-attribute-capped"
                        >
                          MAX
                        </span>
                      `
                      : '';

                return `
                  <div
                    class="pp-stat pp-stat--development"
                    data-attribute-key="${attribute.key}"
                  >
                    <div
                      class="pp-stat__main"
                    >
                      <span
                        class="pp-stat__name"
                      >
                        ${attribute.label}
                      </span>

                      <div
                        class="pp-stat__bar"
                      >
                        <div
                          class="
                            pp-stat__bar-fill
                            ${getRatingClass(rating)}
                          "
                          style="width: ${rating}%"
                        ></div>
                      </div>

                      <span
                        class="pp-stat__val"
                      >
                        ${rating}
                      </span>
                    </div>

                    <div
                      class="pp-attribute-progress"
                    >
                      <div
                        class="pp-attribute-progress__track"
                      >
                        <div
                          class="pp-attribute-progress__fill"
                          style="width: ${xpPercentage}%"
                        ></div>
                      </div>

                      <div
                        class="pp-attribute-progress__details"
                      >
                        <span
                          class="pp-attribute-progress__xp"
                        >
                          ${
                            requiredXP > 0
                              ? `${currentXP} / ${requiredXP} XP`
                              : 'Attribute Maxed'
                          }
                        </span>

                        ${upgradeMarkup}
                      </div>
                    </div>
                  </div>
                `;
              })
              .join('');

          return `
            <div class="pp-attr-cat">
              <button
                class="pp-attr-cat__header"
                type="button"
                aria-expanded="false"
              >
                <span
                  class="pp-attr-cat__icon"
                >
                  ${category.icon}
                </span>

                <span
  class="pp-attr-cat__name"
>
  ${category.name}
</span>

${
  upgradeableCategories.includes(
    category.name
  )
    ? `
      <span
        class="pp-attr-cat__upgrade-ready"
      >
        <span
          class="pp-attr-cat__upgrade-dot"
          aria-hidden="true"
        ></span>

        Upgrade Available
      </span>
    `
    : ''
}

<span
  class="pp-attr-cat__ovr"
>
  ${categoryRating}
</span>

                <span
                  class="pp-attr-cat__chevron"
                >
                  ›
                </span>
              </button>

              <div class="pp-attr-cat__body">
                ${attributeRows}
              </div>
            </div>
          `;
        })
        .join('');

    container
    .querySelectorAll(
      '.pp-attr-cat'
    )
    .forEach(categoryElement => {
      const categoryName =
        categoryElement
          .querySelector(
            '.pp-attr-cat__name'
          )
          ?.textContent
          ?.trim();

      if (
        !categoryName ||
        !previouslyOpenCategoryNames
          .includes(categoryName)
      ) {
        return;
      }

      categoryElement.classList.add(
        'pp-attr-cat--open'
      );

      const header =
        categoryElement.querySelector(
          '.pp-attr-cat__header'
        );

      if (header) {
        header.setAttribute(
          'aria-expanded',
          'true'
        );
      }
    });

    /*
     * Bind one delegated handler after the dynamic attribute
     * markup has been rendered.
     */
    container.onclick = event => {
      const upgradeButton =
        event.target.closest(
          '[data-upgrade-attribute]'
        );

      /*
       * Handle upgrades before category headers so clicking an
       * upgrade button never accidentally collapses the group.
       */
      if (upgradeButton) {
        event.preventDefault();
        event.stopPropagation();

        const attributeKey =
          upgradeButton.dataset
            .upgradeAttribute;

        if (!attributeKey) {
          return;
        }

        const attributeLabel =
          upgradeButton
            .closest(
              '.pp-stat--development'
            )
            ?.querySelector(
              '.pp-stat__name'
            )
            ?.textContent
            ?.trim() ||
          attributeKey;

        const canonicalPlayer =
          syncCareerPlayerWithWorld();

        if (!canonicalPlayer) {
          console.error(
            '[Project Ice] Career player could not be synchronized before upgrading.'
          );

          return;
        }

        const attributeBefore =
          Number(
            canonicalPlayer
              .attributes?.[
                attributeKey
              ]
          ) || 0;

        const overallBefore =
          Number(
            canonicalPlayer.overall
          ) || 0;

        const result =
          WorldEngine
            .upgradePlayerAttribute(
              canonicalPlayer,
              attributeKey
            );

        if (!result?.success) {
          console.warn(
            '[Project Ice] Attribute upgrade failed:',
            result
          );

          return;
        }

        const attributeAfter =
          Number(
            canonicalPlayer
              .attributes?.[
                attributeKey
              ]
          ) || attributeBefore;

        const overallAfter =
          Number(
            canonicalPlayer.overall
          ) || overallBefore;

        showAttributeUpgradeConfirmation({
          attributeLabel,
          attributeBefore,
          attributeAfter,
          overallBefore,
          overallAfter,
        });

        syncCareerPlayerWithWorld();
        saveCareerPreview();
        updateHubScreen();

        return;
      }

      const categoryHeader =
        event.target.closest(
          '.pp-attr-cat__header'
        );

      if (!categoryHeader) {
        return;
      }

      const category =
        categoryHeader.closest(
          '.pp-attr-cat'
        );

      if (!category) {
        return;
      }

      const isOpen =
        category.classList.toggle(
          'pp-attr-cat--open'
        );

      categoryHeader.setAttribute(
        'aria-expanded',
        String(isOpen)
      );
    };
  }

  

  // ── One-time setup ────────────────────────────────────────
  if (!hubCalendarReady) {
    setupHubCalendar();
    hubCalendarReady = true;
  }
}
function orderNpcRosterByOverall(npcRoster) {
  const orderedRoster = npcRoster.map(player => ({
    ...player
  }));

  const positionSlots = {
    LW: [
      'fwd-1-lw',
      'fwd-2-lw',
      'fwd-3-lw',
      'fwd-4-lw'
    ],
    C: [
      'fwd-1-c',
      'fwd-2-c',
      'fwd-3-c',
      'fwd-4-c'
    ],
    RW: [
      'fwd-1-rw',
      'fwd-2-rw',
      'fwd-3-rw',
      'fwd-4-rw'
    ],
    LD: [
      'def-1-ld',
      'def-2-ld',
      'def-3-ld'
    ],
    RD: [
      'def-1-rd',
      'def-2-rd',
      'def-3-rd'
    ],
    G: [
      'g-starter',
      'g-backup'
    ]
  };

  Object.entries(positionSlots).forEach(
    ([position, slots]) => {
      const playersAtPosition = orderedRoster
        .filter(player => player.position === position)
        .sort(
          (a, b) =>
            (Number(b.overall) || 0) -
            (Number(a.overall) || 0)
        );

      playersAtPosition.forEach((player, index) => {
        player.rosterSlot = slots[index] || player.rosterSlot;

        if (position === 'G') {
          player.goalieRole =
            index === 0 ? 'Starter' : 'Backup';
        } else if (position === 'LD' || position === 'RD') {
          player.pair = index + 1;
        } else {
          player.line = index + 1;
        }
      });
    }
  );

  return orderedRoster;
}
function openTeamTab(teamId = null, origin = 'hub') {
  const playerTeamId =
    Game.player.teamId ||
    Game.player.highSchoolTeamId ||
    null;

  Game.teamTabSelectedTeamId =
    teamId || playerTeamId;

  Game.teamTabOrigin = origin;

  openHubTab('team');
}
    function renderTeamTab(
      teamId = null
    ) {
      const teams =
        WorldEngine.state.teams || [];

      const playerTeamId =
        Game.player.teamId ||
        Game.player.highSchoolTeamId ||
        null;

      const selectedTeamId =
        teamId ||
        Game.teamTabSelectedTeamId ||
        playerTeamId;

      const team =
        teams.find(
          item =>
            String(item.teamId) ===
            String(selectedTeamId)
        );

      if (!team) return;

      /*
       * Preserve the selected team so every later refresh,
       * Full Stats link and profile transition uses the same
       * team instead of reverting to the career player's team.
       */
      Game.teamTabSelectedTeamId =
        team.teamId;

  const teamNameEl =
    document.getElementById('team-page-name');

  const recordEl =
    document.getElementById('team-page-record');

  const prestigeEl =
    document.getElementById('team-page-prestige');

  const identityEl =
    document.getElementById('team-page-identity');

  const coachEl =
    document.getElementById('team-page-coach');

  const coachStyleEl =
    document.getElementById('team-page-coach-style');

  const arenaEl =
    document.getElementById('team-page-arena');

  const arenaCapacityEl =
    document.getElementById(
      'team-page-arena-capacity'
    );

  const wins = Number(team.wins) || 0;
  const losses = Number(team.losses) || 0;
  const overtimeLosses =
    Number(team.overtimeLosses) || 0;
  const points = Number(team.points) || 0;

  const prestige =
    Math.max(
      0,
      Math.min(5, Number(team.prestige) || 0)
    );

  if (teamNameEl) {
    teamNameEl.textContent =
      `${team.schoolName} ${team.teamName}`;
  }

  if (recordEl) {
    recordEl.textContent =
      Game.player?.teamLevel || 'Junior Varsity';
  }
  const seasonRecordEl =
    document.getElementById('team-page-season-record');

  const leaguePositionEl =
    document.getElementById('team-page-league-position');

  const goalsForEl =
    document.getElementById('team-page-goals-for');

  const goalsAgainstEl =
    document.getElementById('team-page-goals-against');

  const pointsEl =
    document.getElementById('team-page-points');
  if (seasonRecordEl) {
    seasonRecordEl.textContent =
      `${wins}-${losses}-${overtimeLosses}`;
  }

  if (pointsEl) {
    pointsEl.textContent = points;
  }

  if (goalsForEl) {
    goalsForEl.textContent = team.goalsFor ?? 0;
  }

  if (goalsAgainstEl) {
    goalsAgainstEl.textContent = team.goalsAgainst ?? 0;
  }

  if (prestigeEl) {
    prestigeEl.textContent =
      '★'.repeat(Number(team.prestige) || 0);
  }

  if (identityEl) {
    identityEl.textContent =
      team.identity || 'Program identity unavailable.';
  }

  if (coachEl) {
    coachEl.textContent =
      team.coach?.name || 'Coach unavailable';
  }

  if (coachStyleEl) {
    coachStyleEl.textContent =
      team.coach?.style || 'Coaching style unavailable.';
  }

  if (arenaEl) {
    arenaEl.textContent =
      team.arena?.name || 'Arena unavailable';
  }

  if (arenaCapacityEl) {
    const capacity =
      Number(team.arena?.capacity) || 0;

    arenaCapacityEl.textContent =
      capacity > 0
        ? `Capacity: ${capacity.toLocaleString('en-US')}`
        : 'Capacity unavailable';
  }
  const rosterCountEl =
    document.getElementById('team-roster-count');

  const rosterListEl =
    document.getElementById('team-roster-list');

  const specialTeamsListEl =
      document.getElementById(
        'team-special-teams-list'
      );

  const npcRoster =
    Array.isArray(team.roster)
      ? orderNpcRosterByOverall(team.roster)
      : [];

    const roster =
      WorldEngine.getTeamRoster(
        team.teamId
      );

  if (rosterCountEl) {
    rosterCountEl.textContent =
      `${roster.length} Player${roster.length === 1 ? '' : 's'}`;
  }

  if (rosterListEl) {
    const getPlayerCard = player => {
      if (!player) return '<div class="lineup-player lineup-player--empty">Empty</div>';

      const fullName =
        `${player.firstName || ''} ${player.lastName || ''}`.trim() ||
        'Unknown Player';

      const position = player.position || '—';
      const overall = Number(player.overall) || 0;
      const playerId = player.playerId || player.id || '';
      const leadershipBadge =
        player.captain
          ? `
            <span
              class="lineup-player__leadership tp-roster-leadership-badge"
              aria-label="Captain"
              title="Captain"
            >
              C
            </span>
          `
          : player.alternateCaptain
            ? `
              <span
                class="lineup-player__leadership tp-roster-leadership-badge"
                aria-label="Alternate captain"
                title="Alternate Captain"
              >
                A
              </span>
            `
            : '';
      

      return `
        <button
          class="team-roster__player lineup-player ${player.isCareerPlayer ? 'career-player-highlight' : ''}"
          type="button"
          data-player-id="${playerId}"
        >
          <span class="lineup-player__position">${position}</span>
          <span class="lineup-player__name">
  ${fullName}
  ${leadershipBadge}
</span>
          <span class="lineup-player__overall">${overall} OVR</span>
        </button>
      `;
    };

    const getPlayerBySlot = slot =>
      roster.find(player =>
        (player.rosterSlot || player.slot) === slot
      );

    rosterListEl.innerHTML = `
      <section class="lineup-section">
        <h3 class="lineup-section__title">Forwards</h3>

        ${[1, 2, 3, 4].map(lineNumber => `
          <div class="lineup-unit">
            <div class="lineup-unit__label">Line ${lineNumber}</div>

            <div class="lineup-unit__players lineup-unit__players--three">
              ${getPlayerCard(getPlayerBySlot(`fwd-${lineNumber}-lw`))}
              ${getPlayerCard(getPlayerBySlot(`fwd-${lineNumber}-c`))}
              ${getPlayerCard(getPlayerBySlot(`fwd-${lineNumber}-rw`))}
            </div>
          </div>
        `).join('')}
      </section>

      <section class="lineup-section">
        <h3 class="lineup-section__title">Defense</h3>

        ${[1, 2, 3].map(pairNumber => `
          <div class="lineup-unit">
            <div class="lineup-unit__label">Pair ${pairNumber}</div>

            <div class="lineup-unit__players lineup-unit__players--two">
              ${getPlayerCard(getPlayerBySlot(`def-${pairNumber}-ld`))}
              ${getPlayerCard(getPlayerBySlot(`def-${pairNumber}-rd`))}
            </div>
          </div>
        `).join('')}
      </section>

      <section class="lineup-section">
        <h3 class="lineup-section__title">Goaltenders</h3>

        <div class="lineup-unit">
          <div class="lineup-unit__players lineup-unit__players--two">
            <div class="lineup-goalie">
              <div class="lineup-unit__label">Starter</div>
              ${getPlayerCard(getPlayerBySlot('g-starter'))}
            </div>

            <div class="lineup-goalie">
              <div class="lineup-unit__label">Backup</div>
              ${getPlayerCard(getPlayerBySlot('g-backup'))}
            </div>
          </div>
        </div>
      </section>
    `;
  }

    if (specialTeamsListEl) {
      specialTeamsListEl.innerHTML =
        buildTeamSpecialTeamsMarkup(
          team,
          roster
        );
    }

    /*
     * Render Team Leaders from the same canonical roster and
     * season-stat data used by Full Stats and Player Profiles.
     */
    const getSeasonStat = (
      player,
      statKey
    ) =>
      Number(
        player?.seasonStats?.[
          statKey
        ] ??
        player?.[statKey]
      ) || 0;

    const isGoalie = player => {
      const position =
        String(
          player?.position || ''
        )
          .trim()
          .toUpperCase();

      return (
        position === 'G' ||
        position.includes(
          'GOAL'
        )
      );
    };

    const skaters =
      roster.filter(
        player =>
          !isGoalie(player)
      );

    const goalies =
      roster.filter(
        isGoalie
      );

    const getLeader = (
      players,
      statKey
    ) =>
      [...players].sort(
        (
          firstPlayer,
          secondPlayer
        ) => {
          const statDifference =
            getSeasonStat(
              secondPlayer,
              statKey
            ) -
            getSeasonStat(
              firstPlayer,
              statKey
            );

          if (
            statDifference !== 0
          ) {
            return statDifference;
          }

          return (
            Number(
              secondPlayer.overall
            ) || 0
          ) -
          (
            Number(
              firstPlayer.overall
            ) || 0
          );
        }
      )[0] || null;

    const getFullName = player =>
      player
        ? `${
            player.firstName || ''
          } ${
            player.lastName || ''
          }`.trim() ||
          'Unknown Player'
        : '';

    const setLeaderText = (
      elementId,
      player,
      formattedValue
    ) => {
      const element =
        document.getElementById(
          elementId
        );

      if (!element) {
        return;
      }

      element.textContent =
        player
          ? `${getFullName(
              player
            )} — ${formattedValue}`
          : 'No stats yet';
    };

    const goalsLeader =
      getLeader(
        skaters,
        'goals'
      );

    const assistsLeader =
      getLeader(
        skaters,
        'assists'
      );

    const pointsLeader =
      getLeader(
        skaters,
        'points'
      );

    const winsLeader =
      getLeader(
        goalies,
        'wins'
      );

    const getSavePercentage =
      goalie => {
        const savedPercentage =
          Number(
            goalie?.seasonStats
              ?.savePercentage ??
            goalie?.savePercentage
          );

        if (
          Number.isFinite(
            savedPercentage
          ) &&
          savedPercentage > 0
        ) {
          return savedPercentage;
        }

        const saves =
          getSeasonStat(
            goalie,
            'saves'
          );

        const shotsAgainst =
          getSeasonStat(
            goalie,
            'shotsAgainst'
          );

        return shotsAgainst > 0
          ? saves /
            shotsAgainst
          : 0;
      };

    const savePercentageLeader =
      [...goalies].sort(
        (
          firstGoalie,
          secondGoalie
        ) =>
          getSavePercentage(
            secondGoalie
          ) -
          getSavePercentage(
            firstGoalie
          )
      )[0] || null;

    const formatSavePercentage =
      value => {
        const percentage =
          Number(value) || 0;

        return percentage > 0
          ? percentage
              .toFixed(3)
              .replace(
                /^0/,
                ''
              )
          : '.000';
      };

    setLeaderText(
      'team-leader-goals',
      goalsLeader,
      getSeasonStat(
        goalsLeader,
        'goals'
      )
    );

    setLeaderText(
      'team-leader-assists',
      assistsLeader,
      getSeasonStat(
        assistsLeader,
        'assists'
      )
    );

    setLeaderText(
      'team-leader-points',
      pointsLeader,
      getSeasonStat(
        pointsLeader,
        'points'
      )
    );

    setLeaderText(
      'team-leader-wins',
      winsLeader,
      getSeasonStat(
        winsLeader,
        'wins'
      )
    );

    setLeaderText(
      'team-leader-save-percentage',
      savePercentageLeader,
      formatSavePercentage(
        getSavePercentage(
          savePercentageLeader
        )
      )
    );

    rosterListEl
    .querySelectorAll('.team-roster__player')
  .forEach(button => {
    button.addEventListener('click', () => {
      const playerId =
        button.dataset.playerId;

      const selectedPlayer =
        roster.find(
          player =>
          String(player.playerId || player.id) ===
          String(playerId)
        );

      if (!selectedPlayer) return;

      openPlayerProfile(selectedPlayer, 'hub-team');
    });
  });

    if (specialTeamsListEl) {
      specialTeamsListEl
        .querySelectorAll(
          '.team-roster__player'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              const playerId =
                button.dataset.playerId;

              const selectedPlayer =
                roster.find(
                  player =>
                    String(
                      player.playerId ||
                      player.id
                    ) === String(playerId)
                );

              if (!selectedPlayer) return;

              openPlayerProfile(
                selectedPlayer,
                'hub-team'
              );
            }
          );
        });
    }

    setupTeamLineupToggle();
}

function setupTeamLineupToggle(
  root = document,
  idPrefix = ''
) {
  const evenButton =
    root.querySelector(
      `#${idPrefix}team-lineup-view-even`
    );

  const specialButton =
    root.querySelector(
      `#${idPrefix}team-lineup-view-special`
    );

  const evenStrengthList =
    root.querySelector(
      `#${idPrefix}team-roster-list`
    );

  const specialTeamsList =
    root.querySelector(
      `#${idPrefix}team-special-teams-list`
    );

  if (
    !evenButton ||
    !specialButton ||
    !evenStrengthList ||
    !specialTeamsList
  ) {
    return;
  }

  const setView = view => {
    const showEvenStrength =
      view === 'even';

    evenStrengthList.hidden =
      !showEvenStrength;

    specialTeamsList.hidden =
      showEvenStrength;

    evenButton.classList.toggle(
      'team-lineup-toggle__button--active',
      showEvenStrength
    );

    specialButton.classList.toggle(
      'team-lineup-toggle__button--active',
      !showEvenStrength
    );

    evenButton.setAttribute(
      'aria-pressed',
      String(showEvenStrength)
    );

    specialButton.setAttribute(
      'aria-pressed',
      String(!showEvenStrength)
    );
  };

  evenButton.onclick = () => {
    setView('even');
  };

  specialButton.onclick = () => {
    setView('special');
  };

  setView('even');
}

function refreshCareerUI() {
  refreshScheduleEvents();

  setupHubCalendar();

  renderScheduleCalendar(
    scheduleViewYear,
    scheduleViewMonth
  );

  renderScheduleKeyEvents();

  renderTeamTab();
}
function setupHubCalendar() {
  const currentDateKey =
    Game.player.currentDate || '2026-09-01';

  const currentDate =
    new Date(`${currentDateKey}T12:00:00`);
  const weekLabel = document.querySelector(
    '.hub-cal__week-label'
  );

  if (weekLabel) {
    weekLabel.textContent =
      `Week of ${currentDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}`;
  }
  const strip     = document.getElementById('hub-cal-strip');
  const epIcon    = document.getElementById('hub-ep-icon');
  const epName    = document.getElementById('hub-ep-name');
  const epLoc     = document.getElementById('hub-ep-location');
  const epObj     = document.getElementById('hub-ep-objective');
  const epBtnLbl  = document.getElementById('hub-ep-btn-label');
  const epToast   = document.getElementById('hub-ep-toast');
  const epBtn     = document.getElementById('btn-hub-event');
  if (!strip) return;
  strip.innerHTML = '';

  const TODAY_INDEX = 2;

  // ── Build cards ───────────────────────────────────────────
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i - 2);

      const dateKey = date.toISOString().slice(0, 10);

      const templateDay =
        HUB_DAYS.find(day => day.dateKey === dateKey) || {
          icon: '📅',
          event: 'Open Day',
          location: '—',
          objective: 'No scheduled activities.',
          eventId: 'open-day',
          isCompleted: false,
        };
      const scheduledEvent =
        scheduleEvents.find(event =>
          event.date === dateKey
        );

      const eventData = scheduledEvent
        ? {
            icon: scheduledEvent.icon || '📅',
            event:
              scheduledEvent.label || 'Open Day',
            location:
              scheduledEvent.location || '—',
            objective:
              scheduledEvent.objective ||
              'No scheduled activities.',
            eventId:
              scheduledEvent.eventId || 'open-day',
            summaryScreen:
              scheduledEvent.summaryScreen,
            isCompleted:
              Boolean(scheduledEvent.isCompleted),
          }
        : templateDay;

      const d = {
        ...eventData,
        date: dateKey,
        day: date.toLocaleDateString('en-US', {
          weekday: 'short'
        }),
        dateNumber: date.getDate(),
        isToday: i === TODAY_INDEX,
        isCompleted: i < TODAY_INDEX
      };
      
    const isToday     = i === TODAY_INDEX;
    const isFuture    = i > TODAY_INDEX;
    const isCompleted = Boolean(d.isCompleted);

    const card = document.createElement('div');
    card.className = [
      'hub-cal-card',
      isCompleted ? 'hub-cal-card--completed' : '',
      isToday     ? 'hub-cal-card--today'     : '',
      isFuture    ? 'hub-cal-card--future'    : '',
    ].filter(Boolean).join(' ');
    card.dataset.dayIndex = i;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <span class="hub-cal-card__day">${d.day}</span>
      <span class="hub-cal-card__date">${d.dateNumber}</span>
      ${isCompleted
        ? '<span class="hub-cal-card__check" aria-hidden="true">✓</span>'
        : `<span class="hub-cal-card__icon">${d.icon}</span>`
      }
      <span class="hub-cal-card__title">${d.event}</span>
      ${isCompleted ? '<span class="hub-cal-card__status-done" aria-hidden="true">Done</span>' : ''}
      ${isToday ? '<span class="hub-cal-card__dot" aria-hidden="true"></span>' : ''}
    `;
      card.eventData = d;

    strip.appendChild(card);
  });

  // ── Selection & event panel update ───────────────────────
  const cards = strip.querySelectorAll('.hub-cal-card');

  function selectDay(index) {
    cards.forEach(c => c.classList.remove('hub-cal-card--selected'));
    cards[index].classList.add('hub-cal-card--selected');

    const d = cards[index].eventData;
    const isFuture    = index > TODAY_INDEX;
    const isCompleted = Boolean(d.isCompleted);

    if (epIcon) epIcon.textContent = isCompleted ? '✅' : d.icon;
    if (epName) epName.textContent = d.event;
    if (epLoc)  epLoc.textContent  = d.location;
    if (epObj)  epObj.textContent  = isCompleted ? 'This event has been completed.' : d.objective;

    if (epBtnLbl) {
      if (isCompleted)   epBtnLbl.textContent = 'View Summary';
      else if (isFuture) epBtnLbl.textContent = 'Simulate to Selected Day';
      else               epBtnLbl.textContent = 'Enter Event';
    }
    if (epToast) epToast.hidden = true;
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => selectDay(i));
  });

  // ── Event panel button ────────────────────────────────────
  if (epBtn) {
    epBtn.addEventListener('click', () => {
      const selectedIndex = [...cards].findIndex(c => c.classList.contains('hub-cal-card--selected'));
      const selectedCard = cards[selectedIndex];
      const d = selectedCard?.eventData;

      if (!d) return;
      const isFuture    = selectedIndex > TODAY_INDEX;
      const isCompleted = Boolean(d.isCompleted);

      if (isCompleted) {
        if (d.eventId === 'tryout-freshman') {
          openTryoutSummary('history');
          return;
        }

          EventSystem.openEvent(d.eventId, 'hub');
          return;
      } else if (isFuture) {
        const nextDate = simulateToDate(d.date);

        if (epToast) {
          epToast.hidden = false;
          epToast.textContent = `Advanced to ${nextDate}`;
        }

        refreshCareerUI();
      } else {
        // Enter the event via the Event System
        const selectedCard = cards[selectedIndex];
        const selectedEvent = selectedCard?.eventData;

        if (!selectedEvent?.eventId) return;

        EventSystem.openEvent(selectedEvent.eventId, 'hub');
      }
    });
  }

  // Scroll completed card into view, then settle on today
  const completedCard = strip.querySelector('.hub-cal-card--completed');
  if (completedCard) {
    completedCard.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' });
  }
  selectDay(TODAY_INDEX);
}

// ── Standings screen navigation ──────────────────────────────
document.getElementById('btn-hub-standings-all').addEventListener('click', () => {
  showScreen('standings');
});
document.getElementById('btn-league-full-standings')
  .addEventListener('click', () => {
    showScreen('standings');
});

document.getElementById('btn-back-standings').addEventListener('click', () => {
  showScreen('hub');
});

// ── Team Profile navigation ───────────────────────────────────
// Event delegation — one listener per standings container.
// Any click on a row with data-team-id opens the team profile.

document.getElementById('hub-standings-preview').addEventListener('click', e => {
  const row = e.target.closest('[data-team-id]');
  if (!row) return;
  openTeamProfile(row.dataset.teamId, 'hub');
});
document
.getElementById('league-standings-preview-rows')
?.addEventListener('click', event => {
  const row = event.target.closest('[data-team-id]');
  if (!row) return;

  openTeamProfile(
    row.dataset.teamId,
    'league'
  );
});
document.getElementById('sl-rows').addEventListener('click', e => {
  const row = e.target.closest('[data-team-id]');
  if (!row) return;
  openTeamProfile(row.dataset.teamId, 'standings');
});

document.getElementById('btn-back-team-profile').addEventListener('click', () => {
  showScreen(_teamProfileOrigin === 'standings' ? 'standings' : 'hub');
});

// Roster row tap highlight — one delegated listener on the roster container.
// Adds .is-tapped for a brief flash; no navigation yet.
document.getElementById('tp-roster').addEventListener('click', e => {
  const row = e.target.closest('.tp-roster-row');
  if (!row) return;
  row.classList.add('is-tapped');
  setTimeout(() => row.classList.remove('is-tapped'), 220);
});

// ── Top 100 Prospects navigation ──────────────────────────────

// Hub card → open prospects screen
document
.getElementById('hub-prospects-card')
?.addEventListener('click', () => {
  Game.prospectScreenOrigin = 'home';
  showScreen('prospects');
});

// Back button → return to hub
document
.getElementById('btn-back-prospects')
?.addEventListener('click', () => {
  if (Game.prospectScreenOrigin === 'league') {
    openHubTab('league');
    return;
  }

  openHubTab('home');
});

// Row tap → brief flash + show toast
document
.getElementById('pr-rows')
?.addEventListener('click', event => {
  const row =
    event.target.closest('.pr-row--data');

  if (!row) return;

  const playerId =
    row.dataset.playerId;

  if (!playerId) return;

  const visibleProspects =
    Array.isArray(Game.visibleProspects)
      ? Game.visibleProspects
      : [];

  const selectedProspect =
    visibleProspects.find(player =>
      String(player.id || player.playerId) ===
      String(playerId)
    );

  if (!selectedProspect) {
    console.warn(
      'Prospect not found:',
      playerId
    );
    return;
  }

  row.classList.add('is-tapped');

  setTimeout(() => {
    row.classList.remove('is-tapped');
  }, 200);

  openPlayerProfile(
    selectedProspect,
    'prospects'
  );
});

// ── Event screen navigation ───────────────────────────────────

// Back — returns to whichever screen opened this event
document
.getElementById('btn-back-event')
.addEventListener('click', () => {
  const origin = EventSystem.getOrigin();

  showScreen('hub');

  const targetTab =
    origin === 'schedule'
      ? 'schedule'
      : origin === 'player'
        ? 'player'
        : origin === 'team'
          ? 'team'
          : origin === 'league'
            ? 'league'
            : 'home';

  document
    .querySelectorAll('.hub-nav__tab')
    .forEach(tab => {
      tab.classList.toggle(
        'hub-nav__tab--active',
        tab.dataset.hubTab === targetTab
      );
    });

  document
    .querySelectorAll('.hub-tab-panel')
    .forEach(panel => {
      const isTarget =
        panel.id === `hub-tab-${targetTab}`;

      panel.classList.toggle(
        'hub-tab-panel--active',
        isTarget
      );

      if (isTarget) {
        panel.removeAttribute('aria-hidden');
      } else {
        panel.setAttribute('aria-hidden', 'true');
      }
    });

  if (targetTab === 'schedule') {
    refreshScheduleEvents();
    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );
    renderScheduleKeyEvents();
  }

  if (targetTab === 'home') {
    setupHubCalendar();
  }
});

// ── Tryout Summary helpers ────────────────────────────────────
// context 'first-time' = player just finished tryouts for the first time.
// context 'history'    = player reviewing from the hub calendar.
function getTryoutLetterGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A−';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B−';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C−';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D−';
  return 'F';
}

function getOverallTryoutFeedback(score) {
  if (score >= 93) {
    return 'An exceptional tryout. You consistently stood out in all three evaluations.';
  }

  if (score >= 85) {
    return 'A strong overall performance. You showed that you can contribute at this level.';
  }

  if (score >= 75) {
    return 'A solid tryout with several encouraging moments. Continued development will be important.';
  }

  if (score >= 65) {
    return 'You competed hard, but several parts of your game still need refinement.';
  }

  return 'The effort was there, but the coaching staff believes you need significant development.';
}
let _tryoutSummaryContext = 'history';

function openTryoutSummary(context) {
  _tryoutSummaryContext = context;

  const results = Game.player.tryoutResults || {};

  const skating = results.skating || {
    score: 0,
    grade: '--',
  };

  const puckControl = results.puckControl || {
    score: 0,
    grade: '--',
  };

  const scrimmage = results.scrimmage || {
    score: 0,
    grade: '--',
  };

  const completedResults = [
    skating,
    puckControl,
    scrimmage,
  ].filter(result => typeof result.score === 'number' && result.grade !== '--');

  const overallScore = completedResults.length
    ? Math.round(
        completedResults.reduce((total, result) => total + result.score, 0)
        / completedResults.length
      )
    : 0;

  const overallGrade = completedResults.length === 3
    ? getTryoutLetterGrade(overallScore)
    : '--';

  Game.player.overallTryoutScore = overallScore;
  Game.player.overallTryoutGrade = overallGrade;

  const skatingEl = document.getElementById('ts-skating-grade');
  const puckEl = document.getElementById('ts-puck-grade');
  const scrimmageEl = document.getElementById('ts-scrimmage-grade');
  const overallEl = document.getElementById('ts-overall-grade');
  const evaluationEl = document.getElementById('ts-coach-evaluation');

  if (skatingEl) skatingEl.textContent = skating.grade;
  if (puckEl) puckEl.textContent = puckControl.grade;
  if (scrimmageEl) scrimmageEl.textContent = scrimmage.grade;
  if (overallEl) overallEl.textContent = overallGrade;

  if (evaluationEl) {
    evaluationEl.textContent = completedResults.length === 3
      ? getOverallTryoutFeedback(overallScore)
      : 'Complete all three evaluations to receive a final report.';
  }

  const ctaEl = document.getElementById('ts-cta-hub');
  if (ctaEl) {
    ctaEl.hidden = context !== 'first-time';
  }

  saveCareerPreview();
  showScreen('tryout-summary');
}

// Maps EVENT_CATALOG completeScreen keys → their handler functions.
// Add new entries here as more event types receive completion screens.
const COMPLETE_SCREENS = {
  // 'tryout-freshman-intro' → open the Skating drill (Drill 1); DrillEngine populates coach-intro
  'tryout-freshman-intro': () => SkatingDrill.open(),
  // 'tryout-summary' → open the tryout summary (used by results "Continue")
  'tryout-summary':        () => openTryoutSummary('first-time'),
};
/*
 * Reusable Event Results controller.
 *
 * Converts a World Engine completion result into the
 * player-facing Event Results screen.
 */
const EventResultsSystem = (() => {

  function setText(
    elementId,
    value
  ) {
    const element =
      document.getElementById(
        elementId
      );

    if (element) {
      element.textContent =
        value ?? '';
    }
  }

  function formatResultLabel(
    value = ''
  ) {
    return String(value)
      .replace(
        /([a-z])([A-Z])/g,
        '$1 $2'
      )
      .replace(
        /[-_]/g,
        ' '
      )
      .replace(
        /\b\w/g,
        letter =>
          letter.toUpperCase()
      );
  }

  function createResultRow({
    label,
    value,
    detail = '',
  }) {
    return `
      <div class="er-result-row">
        <div class="er-result-row__copy">
          <span class="er-result-row__label">
            ${label}
          </span>

          ${
            detail
              ? `
                <span class="er-result-row__detail">
                  ${detail}
                </span>
              `
              : ''
          }
        </div>

        <strong class="er-result-row__value">
          ${value}
        </strong>
      </div>
    `;
  }

  function buildXPResults(
    xp = {},
    player = {}
  ) {
    const rows = [];

    const totalXP =
      Number(xp.total) || 0;

    if (totalXP > 0) {
      rows.push(
        createResultRow({
          label:
            'Development Earned',

          value:
            `+${totalXP} XP`,

          detail:
            'Applied to individual attributes',
        })
      );
    }

    const attributeXP =
      xp.attributes &&
      typeof xp.attributes ===
        'object'
        ? xp.attributes
        : {};

    Object.entries(
      attributeXP
    ).forEach(
      ([attributeKey, amount]) => {
        const xpAmount =
          Number(amount) || 0;

        if (xpAmount <= 0) {
          return;
        }

        const eligibility =
          WorldEngine
            .canUpgradePlayerAttribute(
              player,
              attributeKey
            );

        const currentXP =
          Math.max(
            0,
            Number(
              eligibility?.currentXP
            ) || 0
          );

        const requiredXP =
          Number(
            eligibility?.requiredXP
          );

        let progressDetail =
          'Attribute progress recorded';

        if (
          eligibility
            ?.reason ===
          'attribute-capped'
        ) {
          progressDetail =
            'Attribute is at maximum';
        } else if (
          eligibility
            ?.canUpgrade === true
        ) {
          progressDetail =
            'Upgrade available';
        } else if (
          Number.isFinite(
            requiredXP
          )
        ) {
          progressDetail =
            `${currentXP} / ${requiredXP} XP toward upgrade`;
        }

        rows.push(
          createResultRow({
            label:
              formatResultLabel(
                attributeKey
              ),

            value:
              `+${xpAmount} XP`,

            detail:
              progressDetail,
          })
        );
      }
    );

    return rows;
  }

  function buildRecoveryResults(
    result = {}
  ) {
    const rows = [];

    const moraleChange =
      Number(result.morale) || 0;

    if (moraleChange !== 0) {
      rows.push(
        createResultRow({
          label: 'Morale',

          value:
            moraleChange > 0
              ? `+${moraleChange}`
              : String(
                  moraleChange
                ),
        })
      );
    }

    const coachTrustChange =
      Number(
        result.coachTrust
      ) || 0;

    if (coachTrustChange !== 0) {
      rows.push(
        createResultRow({
          label:
            'Coach Trust',

          value:
            coachTrustChange > 0
              ? `+${coachTrustChange}`
              : String(
                  coachTrustChange
                ),

          detail:
            'Your standing with the coaching staff',
        })
      );
    }

    const injuryRiskChange =
      Number(
        result.health
          ?.injuryRiskModifier
      ) || 0;

    if (injuryRiskChange < 0) {
      rows.push(
        createResultRow({
          label: 'Injury Risk',
          value: 'Reduced',

          detail:
            `${Math.round(
              Math.abs(
                injuryRiskChange
              ) * 100
            )}% improvement`,
        })
      );
    }

    return rows;
  }

  function open(
    eventDefinition,
    completion
  ) {
    const result =
      completion?.result ||
      {};

    const eventType =
      String(
        result.type ||
        eventDefinition?.type ||
        'event'
      );

    const eventLabel =
      eventDefinition?.label ||
      eventDefinition?.title ||
      formatResultLabel(
        eventType
      );

    const eventIcon =
      eventDefinition?.icon ||
      (
        eventType === 'recovery'
          ? '💪'
          : '🏒'
      );

    setText(
      'er-type-badge',
      eventType.toUpperCase()
    );

    setText(
      'er-icon',
      eventIcon
    );

    setText(
      'er-title',
      `${eventLabel} Complete`
    );

    setText(
      'er-subtitle',
      eventType === 'recovery'
        ? 'Your recovery work has been recorded.'
        : 'Your development progress has been recorded.'
    );

    const resultRows = [
      ...buildXPResults(
        result.xp,
        Game.player
      ),

      ...buildRecoveryResults(
        result
      ),
    ];

    const resultsList =
      document.getElementById(
        'er-results-list'
      );

    if (resultsList) {
      resultsList.innerHTML =
        resultRows.length > 0
          ? resultRows.join('')
          : createResultRow({
              label:
                'Event Completed',

              value:
                'Recorded',
            });
    }

    const noteCard =
      document.getElementById(
        'er-note-card'
      );

    const noteText =
      document.getElementById(
        'er-note-text'
      );

    const coachNote =
      result.coachNote ||
      completion?.coachNote ||
      '';

    if (noteCard) {
      noteCard.hidden =
        !coachNote;
    }

    if (noteText) {
      noteText.textContent =
        coachNote || '—';
    }

    showScreen(
      'event-results'
    );
  }

  return {
    open,
  };
})();
/*
 * Universal career-event completion registry.
 *
 * Each supported interactive event type maps to one
 * World Engine completion method. Future event types can
 * register here without adding another large button branch.
 */
const EVENT_COMPLETION_HANDLERS = {
  practice(eventId) {
    return WorldEngine
      .completePracticeEvent(
        eventId
      );
  },

  training(eventId) {
    openTrainingScreen(
      eventId
    );

    return {
      success: true,
      awaitingSelection: true,
    };
  },

  recovery(eventId) {
    return WorldEngine
      .completeRecoveryEvent(
        eventId
      );
  },

  'coach-meeting'(eventId) {
    return WorldEngine
      .completeCoachMeetingEvent(
        eventId
      );
  },
};

function completeCurrentCareerEvent(
  eventDefinition
) {
  const eventType =
    String(
      eventDefinition?.type ||
      ''
    );

  const completionHandler =
    EVENT_COMPLETION_HANDLERS[
      eventType
    ];

  if (
    typeof completionHandler !==
    'function'
  ) {
    return {
      supported: false,
      completion: null,
    };
  }

  const eventId =
    eventDefinition?.id ||
    eventDefinition?.eventId ||
    null;

  if (!eventId) {
    console.error(
      `[Project Ice] ${eventType} event is missing its canonical ID.`
    );

    return {
      supported: true,

      completion: {
        success: false,
        reason:
          'canonical-event-id-missing',
      },
    };
  }

  return {
    supported: true,
    completion:
      completionHandler(
        eventId
      ),
  };
}

/*
 * ============================================================
 * ROADMAP 6 — OPEN PREGAME MATCHUP
 * ============================================================
 *
 * Populates the EA-style matchup presentation from the real
 * scheduled game and the same team-strength profiles used by
 * the canonical live-game engine.
 */
function openPregameMatchup(
  eventDefinition
) {
  if (
    !eventDefinition ||
    eventDefinition.type !== 'game'
  ) {
    return false;
  }

  const schedule =
    Array.isArray(
      WorldEngine.state
        ?.schedule
    )
      ? WorldEngine.state
          .schedule
      : [];

  const scheduledGame =
    schedule.find(game => {
      const scheduledId =
        game?.id ||
        game?.gameId ||
        game?.eventId ||
        null;

      const eventGameId =
        eventDefinition
          ?.gameId ||
        eventDefinition
          ?.eventId ||
        eventDefinition
          ?.id ||
        null;

      return (
        scheduledId &&
        eventGameId &&
        String(scheduledId) ===
          String(eventGameId)
      );
    }) || null;

  if (!scheduledGame) {
    console.error(
      '[Project Ice] Pregame matchup could not find scheduled game.',
      eventDefinition
    );

    return false;
  }

  const awayTeam =
    WorldEngine.getTeamById(
      scheduledGame.awayTeamId
    );

  const homeTeam =
    WorldEngine.getTeamById(
      scheduledGame.homeTeamId
    );

  if (
    !awayTeam ||
    !homeTeam
  ) {
    console.error(
      '[Project Ice] Pregame matchup missing team data.',
      scheduledGame
    );

    return false;
  }

  const awayProfileResult =
    WorldEngine
      .getLiveGameTeamSimulationProfile(
        awayTeam.teamId
      );

  const homeProfileResult =
    WorldEngine
      .getLiveGameTeamSimulationProfile(
        homeTeam.teamId
      );

  const awayProfile =
    awayProfileResult
      ?.success === true
      ? awayProfileResult.profile
      : null;

  const homeProfile =
    homeProfileResult
      ?.success === true
      ? homeProfileResult.profile
      : null;

  /*
   * The live-game profile values are already normalized
   * hockey ratings. Round them for the EA-style presentation.
   */
  const rating =
    value =>
      Math.max(
        25,
        Math.min(
          99,
          Math.round(
            Number(value) || 50
          )
        )
      );

  const teamRecord =
    team =>
      `${
        Number(team?.wins) || 0
      }-${
        Number(team?.losses) || 0
      }-${
        Number(
          team?.overtimeLosses
        ) || 0
      }`;

  const teamDisplayName =
    team =>
      team?.schoolName ||
      team?.teamName ||
      team?.abbreviation ||
      'Team';

  const date =
    scheduledGame.date ||
    eventDefinition.date ||
    null;

  const dateLabel =
    date
      ? new Date(
          `${date}T12:00:00`
        ).toLocaleDateString(
          'en-US',
          {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }
        )
      : 'Game Day';

  const gameType =
    scheduledGame
      ?.specialType ||
    scheduledGame
      ?.gameType ||
    eventDefinition
      ?.details
      ?.['Game Type'] ||
    'Regular Season';

  const venue =
    homeTeam
      ?.arena
      ?.name ||
    eventDefinition
      ?.details
      ?.Venue ||
    'Arena';

  document.getElementById(
    'pregame-matchup-title'
  ).textContent =
    gameType;

  document.getElementById(
    'pregame-matchup-meta'
  ).textContent =
    dateLabel;

  document.getElementById(
    'pregame-matchup-venue'
  ).textContent =
    venue;

  /*
   * AWAY TEAM
   */
  document.getElementById(
    'pregame-away-badge'
  ).textContent =
    awayTeam.abbreviation ||
    'AWY';

  document.getElementById(
    'pregame-away-name'
  ).textContent =
    teamDisplayName(
      awayTeam
    );

  document.getElementById(
    'pregame-away-record'
  ).textContent =
    teamRecord(
      awayTeam
    );

  document.getElementById(
    'pregame-away-overall'
  ).textContent =
    rating(
      awayProfile
        ?.overallQuality
    );

  document.getElementById(
    'pregame-away-offense'
  ).textContent =
    rating(
      awayProfile
        ?.possessionOffense
    );

  document.getElementById(
    'pregame-away-defense'
  ).textContent =
    rating(
      awayProfile
        ?.defensiveDisruption
    );

  /*
   * HOME TEAM
   */
  document.getElementById(
    'pregame-home-badge'
  ).textContent =
    homeTeam.abbreviation ||
    'HME';

  document.getElementById(
    'pregame-home-name'
  ).textContent =
    teamDisplayName(
      homeTeam
    );

  document.getElementById(
    'pregame-home-record'
  ).textContent =
    teamRecord(
      homeTeam
    );

  document.getElementById(
    'pregame-home-overall'
  ).textContent =
    rating(
      homeProfile
        ?.overallQuality
    );

  document.getElementById(
    'pregame-home-offense'
  ).textContent =
    rating(
      homeProfile
        ?.possessionOffense
    );

  document.getElementById(
    'pregame-home-defense'
  ).textContent =
    rating(
      homeProfile
        ?.defensiveDisruption
    );

  /*
   * Keep the real scheduled game attached to the screen
   * so Play Game / Sim Game can use this exact matchup next.
   */
  pregameMatchupScreen
    .dataset.gameId =
      scheduledGame.id ||
      scheduledGame.gameId ||
      scheduledGame.eventId ||
      '';

  if (
    typeof bindPregameSimButton ===
      'function'
  ) {
    bindPregameSimButton();
  }

  showScreen(
    'pregame-matchup'
  );

  return true;
}

let activeLiveGame = null;

let liveGamePlaybackTimer =
  null;

let liveGamePlaybackSpeed =
  1;

let liveGamePlaybackPaused =
  true;

let liveGameCareerPlayerId =
  null;

let liveGameCompletionHandled =
  false;

let liveGameCareerTOISeconds =
  0;

let liveGameCareerDecisionOpen =
  false;

let liveGameCareerDecisionCooldownSteps =
  0;

let liveGameCareerDecisionLastChoice =
  null;

/*
 * ============================================================
 * ROADMAP 6 — OPEN LIVE GAME
 * ============================================================
 *
 * Populates the static live-game presentation from the exact
 * scheduled career game selected on the pregame matchup screen.
 *
 * No simulation steps are processed yet.
 */
function openLiveGame(
  gameId
) {
  const schedule =
    Array.isArray(
      WorldEngine.state
        ?.schedule
    )
      ? WorldEngine.state
          .schedule
      : [];

  const scheduledGame =
    schedule.find(game => {
      const candidateId =
        game?.id ||
        game?.gameId ||
        game?.eventId ||
        null;

      return (
        candidateId &&
        gameId &&
        String(candidateId) ===
          String(gameId)
      );
    }) || null;

  if (!scheduledGame) {
    console.error(
      '[Project Ice] Live Game could not find scheduled game.',
      gameId
    );

    return false;
  }

  const awayTeam =
    WorldEngine.getTeamById(
      scheduledGame.awayTeamId
    );

  const homeTeam =
    WorldEngine.getTeamById(
      scheduledGame.homeTeamId
    );

  if (
    !awayTeam ||
    !homeTeam
  ) {
    console.error(
      '[Project Ice] Live Game missing team data.',
      scheduledGame
    );

    return false;
  }

  /*
   * ============================================================
   * ROADMAP 6 — CREATE CANONICAL LIVE GAME STATE
   * ============================================================
   *
   * Play Game now creates the exact same live simulation object
   * used by the validated canonical resolver.
   *
   * Nothing is permanently written yet.
   */
  const liveGameCreation =
    WorldEngine
      .createLiveGameSimulationState(
        scheduledGame
      );

  if (
    !liveGameCreation ||
    liveGameCreation
      .success !== true ||
    !liveGameCreation
      .simulation
  ) {
    console.error(
      '[Project Ice] Unable to create live game simulation.',
      liveGameCreation
    );

    return false;
  }

  activeLiveGame =
    liveGameCreation
      .simulation;

  clearLiveGamePlaybackTimer();

  liveGamePlaybackSpeed =
    1;

  liveGamePlaybackPaused =
    true;

  setLiveGameActiveSpeedButton(
    1
  );

  const pauseButton =
    document.getElementById(
      'btn-live-game-pause'
    );

  if (pauseButton) {
    pauseButton.textContent =
      'Pause';
  }

  const careerPlayer =
    WorldEngine.state.player ||
    Game.player ||
    {};

  /*
   * Locate the career player from the actual world roster.
   *
   * Do not depend exclusively on state.player.teamId because
   * the roster copy is the authoritative in-season player.
   */
  const worldTeams =
    Array.isArray(
      WorldEngine.state
        ?.teams
    )
      ? WorldEngine.state
          .teams
      : [];

  let careerTeam =
    null;

  let careerRosterPlayer =
    null;

  for (
    const team of worldTeams
  ) {
    const roster =
      Array.isArray(
        team?.roster
      )
        ? team.roster
        : [];

    const foundPlayer =
      roster.find(
        player =>
          player
            ?.isCareerPlayer ===
          true
      ) ||
      null;

    if (foundPlayer) {
      careerTeam =
        team;

      careerRosterPlayer =
        foundPlayer;

      break;
    }
  }

  const careerTeamId =
    careerTeam?.teamId ||
    careerPlayer.teamId ||
    null;

  liveGameCareerPlayerId =
    careerRosterPlayer
      ?.playerId ||
    careerRosterPlayer
      ?.id ||
    careerPlayer
      ?.playerId ||
    careerPlayer
      ?.id ||
    null;

  liveGameCareerTOISeconds =
    0;

  liveGameCareerDecisionOpen =
    false;

  liveGameCareerDecisionCooldownSteps =
    0;

  liveGameCareerDecisionLastChoice =
    null;

  document.getElementById(
    'live-game-career-decision'
  )?.remove();

  liveGameCompletionHandled =
    false;

  const playerName =
    [
      careerRosterPlayer
        ?.firstName ||
        careerPlayer
          ?.firstName ||
        '',

      careerRosterPlayer
        ?.lastName ||
        careerPlayer
          ?.lastName ||
        '',
    ]
      .filter(Boolean)
      .join(' ') ||
    'Career Player';

  const playerPosition =
    careerRosterPlayer
      ?.position ||
    careerPlayer
      ?.position ||
    '—';

  const playerRole =
    careerRosterPlayer
      ?.lineupAssignment
      ?.label ||
    careerRosterPlayer
      ?.lineupStatus ||
    playerPosition;

  document.getElementById(
    'live-game-away-abbr'
  ).textContent =
    awayTeam.abbreviation ||
    'AWY';

  document.getElementById(
    'live-game-home-abbr'
  ).textContent =
    homeTeam.abbreviation ||
    'HME';

  const formatLiveGameClock =
    totalSeconds => {
      const safeSeconds =
        Math.max(
          0,
          Number(
            totalSeconds
          ) || 0
        );

      const minutes =
        Math.floor(
          safeSeconds / 60
        );

      const seconds =
        safeSeconds % 60;

      return (
        `${minutes}:` +
        `${String(
          seconds
        ).padStart(
          2,
          '0'
        )}`
      );
    };

  const periodLabel =
    period => {
      if (period === 1) {
        return '1ST';
      }

      if (period === 2) {
        return '2ND';
      }

      if (period === 3) {
        return '3RD';
      }

      if (period === 4) {
        return 'OT';
      }

      if (period >= 5) {
        return 'SO';
      }

      return '1ST';
    };

  document.getElementById(
    'live-game-away-score'
  ).textContent =
    String(
      activeLiveGame
        ?.away
        ?.score ??
      0
    );

  document.getElementById(
    'live-game-home-score'
  ).textContent =
    String(
      activeLiveGame
        ?.home
        ?.score ??
      0
    );

  document.getElementById(
    'live-game-period'
  ).textContent =
    periodLabel(
      Number(
        activeLiveGame
          ?.period
      ) || 1
    );

  document.getElementById(
    'live-game-clock'
  ).textContent =
    formatLiveGameClock(
      activeLiveGame
        ?.clockSecondsRemaining
    );

  document.getElementById(
    'live-game-strength'
  ).textContent =
    '5 ON 5';

  document.getElementById(
    'live-game-player-name'
  ).textContent =
    playerName;

  document.getElementById(
    'live-game-player-role'
  ).textContent =
    playerRole;

  document.getElementById(
    'live-game-player-status'
  ).textContent =
    'BENCH';

  document.getElementById(
    'live-game-player-toi'
  ).textContent =
    '0:00';

  document.getElementById(
    'live-game-player-goals'
  ).textContent =
    '0';

  document.getElementById(
    'live-game-player-assists'
  ).textContent =
    '0';

  document.getElementById(
    'live-game-player-shots'
  ).textContent =
    '0';

  document.getElementById(
    'live-game-player-plusminus'
  ).textContent =
    '0';

  const timeline =
    document.getElementById(
      'live-game-timeline'
    );

  if (timeline) {
    timeline.innerHTML = `
      <div class="live-game__timeline-empty">
        Puck drop coming up.
      </div>
    `;
  }

  const rinkEvents =
    document.getElementById(
      'live-game-rink-events'
    );

  if (rinkEvents) {
    rinkEvents.innerHTML =
      '';
  }

  liveGameScreen
    .dataset.gameId =
      String(
        scheduledGame.id ||
        scheduledGame.gameId ||
        scheduledGame.eventId ||
        ''
      );

  renderLiveCareerPlayerStrip();

  showScreen(
    'live-game'
  );

  return true;
}

/*
 * ============================================================
 * ROADMAP 6 — LIVE GAME PRESENTATION STEP
 * ============================================================
 *
 * Advances the canonical live simulation by one meaningful
 * hockey step and refreshes the visible scoreboard / game feed.
 *
 * Temporary interaction:
 * tapping 1× advances one step.
 *
 * Once validated, the same function will power timed playback
 * at 1× / 2× / 4× / MAX.
 */

function formatLivePresentationClock(
  totalSeconds
) {
  const safeSeconds =
    Math.max(
      0,
      Number(
        totalSeconds
      ) || 0
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const seconds =
    safeSeconds % 60;

  return (
    `${minutes}:` +
    `${String(
      seconds
    ).padStart(
      2,
      '0'
    )}`
  );
}

function getLivePresentationPeriodLabel(
  period
) {
  const safePeriod =
    Number(period) || 1;

  if (safePeriod === 1) {
    return '1ST';
  }

  if (safePeriod === 2) {
    return '2ND';
  }

  if (safePeriod === 3) {
    return '3RD';
  }

  if (safePeriod === 4) {
    return 'OT';
  }

  if (safePeriod >= 5) {
    return 'SO';
  }

  return '1ST';
}

/*
 * ============================================================
 * ROADMAP 6 — LIVE PRESENTATION PLAYER LOOKUP
 * ============================================================
 *
 * Live events store stable player IDs.
 *
 * Resolve those IDs back to the canonical roster so the
 * presentation layer can display real names and jersey numbers
 * without duplicating identity data inside the simulator.
 */

function getLivePresentationPlayer(
  playerId
) {
  if (!playerId) {
    return null;
  }

  const teams =
    Array.isArray(
      WorldEngine.state
        ?.teams
    )
      ? WorldEngine.state
          .teams
      : [];

  for (const team of teams) {
    const roster =
      Array.isArray(
        team?.roster
      )
        ? team.roster
        : [];

    const player =
      roster.find(
        rosterPlayer =>
          String(
            rosterPlayer
              ?.playerId ||
            rosterPlayer
              ?.id ||
            ''
          ) ===
          String(playerId)
      ) ||
      null;

    if (!player) {
      continue;
    }

    const name =
      [
        player.firstName ||
          '',
        player.lastName ||
          '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      'Unknown Player';

    const jerseyNumber =
      player.jerseyNumber ??
      player.number ??
      player.jersey ??
      null;

    return {
      player,
      team,

      playerId:
        player.playerId ||
        player.id ||
        playerId,

      name,

      jerseyNumber,

      position:
        player.position ||
        null,
    };
  }

  return null;
}

function formatLiveShotType(
  shotType
) {
  const safeType =
    String(
      shotType ||
      'shot'
    )
      .replaceAll(
        '-',
        ' '
      );

  return (
    safeType
      .charAt(0)
      .toUpperCase() +
    safeType.slice(1)
  );
}

function getLivePresentationEventText(
  event
) {
  if (!event) {
    return 'Play continues.';
  }

  const eventType =
    String(
      event.type ||
      event.eventType ||
      event.result ||
      ''
    );

  /*
   * ==========================================================
   * SAVED SHOT
   * ==========================================================
   */

  if (
    eventType ===
      'shot-saved' ||
    eventType ===
      'shot-on-goal' ||
    eventType ===
      'shot'
  ) {
    const shooter =
      getLivePresentationPlayer(
        event
          .shooterPlayerId
      );

    const goalie =
      getLivePresentationPlayer(
        event
          .goaliePlayerId
      );

    const shotType =
      formatLiveShotType(
        event.shotType
      );

    const shooterName =
      shooter?.name ||
      'Unknown Shooter';

    if (goalie?.name) {
      const shooterLabel =
        shooter?.jerseyNumber
          ? `#${shooter.jerseyNumber} ${shooterName}`
          : shooterName;

      const goalieLabel =
        goalie?.jerseyNumber
          ? `#${goalie.jerseyNumber} ${goalie.name}`
          : goalie?.name;

      if (goalieLabel) {
        return {
          primary:
            `SHOT — ${shooterLabel}`,

          secondary:
            `${shotType} · Saved by ${goalieLabel}`,
        };
      }

      return {
        primary:
          `SHOT — ${shooterLabel}`,

        secondary:
          `${shotType} · Saved`,
      };
    }

    const shooterLabel =
      shooter?.jerseyNumber
        ? `#${shooter.jerseyNumber} ${shooterName}`
        : shooterName;

    return {
      primary:
        `SHOT — ${shooterLabel}`,

      secondary:
        `${shotType} · Saved`,
    };
  }

  /*
   * ==========================================================
   * GOAL
   * ==========================================================
   */

  if (
    eventType ===
    'goal'
  ) {
    const scorer =
      getLivePresentationPlayer(
        event
          .scorerPlayerId
      );

    const primaryAssist =
      getLivePresentationPlayer(
        event
          .primaryAssistPlayerId
      );

    const secondaryAssist =
      getLivePresentationPlayer(
        event
          .secondaryAssistPlayerId
      );

    const assistNames =
      [
        primaryAssist?.name,
        secondaryAssist?.name,
      ]
        .filter(Boolean);

    const scorerName =
      scorer?.name ||
      'Unknown Scorer';

    const scorerLabel =
      scorer?.jerseyNumber
        ? `#${scorer.jerseyNumber} ${scorerName}`
        : scorerName;

    const assistLabels =
      [
        primaryAssist,
        secondaryAssist,
      ]
        .filter(Boolean)
        .map(player =>
          player.jerseyNumber
            ? `#${player.jerseyNumber} ${player.name}`
            : player.name
        );

    if (
      assistLabels.length > 0
    ) {
      return {
        primary:
          `GOAL — ${scorerLabel}`,

        secondary:
          `Assists: ${
            assistLabels.join(', ')
          }`,
      };
    }

    return {
      primary:
        `GOAL — ${scorerLabel}`,

      secondary:
        'Unassisted',
    };
  }

  /*
   * ==========================================================
   * HIT
   * ==========================================================
   */

  if (
    eventType ===
    'hit'
  ) {
    const hitter =
      getLivePresentationPlayer(
        event
          .hitterPlayerId
      );

    const playerHit =
      getLivePresentationPlayer(
        event
          .hitPlayerId
      );

    const hitterName =
      hitter?.name ||
      'Unknown Player';

    if (playerHit?.name) {
    const hitterLabel =
      hitter?.jerseyNumber
        ? `#${hitter.jerseyNumber} ${hitterName}`
        : hitterName;

    const hitPlayerLabel =
      playerHit?.jerseyNumber
        ? `#${playerHit.jerseyNumber} ${playerHit.name}`
        : playerHit?.name;

    return {
      primary:
        `HIT — ${hitterLabel}`,

      secondary:
        hitPlayerLabel
          ? `on ${hitPlayerLabel}`
          : '',
    };

    }
  }

if (eventType === 'career-pass') {
  const passer =
    getLivePresentationPlayer(event.playerId);
  const name =
    passer?.name || 'Career Player';
  const label =
    passer?.jerseyNumber
      ? `#${passer.jerseyNumber} ${name}`
      : name;

  return {
    primary: `PASS — ${label}`,
    secondary: 'Completed · possession continues',
  };
}

  /*
   * ==========================================================
   * PENALTY
   * ==========================================================
   */

  if (
    eventType ===
    'penalty'
  ) {
    const penalizedPlayer =
      getLivePresentationPlayer(
        event.playerId
      );

    const playerName =
      penalizedPlayer
        ?.name ||
      'Unknown Player';

    const infraction =
      event.infraction ||
      'Penalty';

    const minutes =
      Number(
        event.minutes
      ) || 2;

    const penalizedLabel =
      penalizedPlayer?.jerseyNumber
        ? `#${penalizedPlayer.jerseyNumber} ${playerName}`
        : playerName;

    return {
      primary:
        `PENALTY — ${penalizedLabel}`,

      secondary:
        `${infraction} · ${minutes} min`,
    };
  }

  /*
   * Everything else still exists inside the engine,
   * but it is intentionally not part of our broadcast feed.
   */
    return {
      primary: '',
      secondary: '',
    };
}

/*
 * ============================================================
 * ROADMAP 6 — CAREER PLAYER LIVE STATE
 * ============================================================
 */

function getLiveCareerPlayerContext() {
  if (
    !activeLiveGame ||
    !liveGameCareerPlayerId
  ) {
    return null;
  }

  const identity =
    getLivePresentationPlayer(
      liveGameCareerPlayerId
    );

  const canonicalPlayer =
    identity?.player ||
    null;

  /*
   * The persistent roster and live simulator can expose the
   * same player through playerId or id depending on which
   * object layer we're looking at.
   *
   * Match against every stable ID we have, then use name as a
   * final safety fallback for the career player.
   */
  const targetIds =
    new Set(
      [
        liveGameCareerPlayerId,

        canonicalPlayer
          ?.playerId,

        canonicalPlayer
          ?.id,
      ]
        .filter(
          value =>
            value !== null &&
            value !== undefined &&
            String(value).length > 0
        )
        .map(
          value =>
            String(value)
        )
    );

  const normalizeName =
    value =>
      String(value || '')
        .trim()
        .toLowerCase();

  const targetName =
    normalizeName(
      identity?.name
    );

  const playerMatches =
    player => {
      if (!player) {
        return false;
      }

      /*
       * The career player has an explicit canonical flag.
       * This is the primary identity check for live deployment.
       */
      if (
        player.isCareerPlayer ===
        true
      ) {
        return true;
      }

      const candidateIds =
        [
          player.playerId,
          player.id,
        ]
          .filter(
            value =>
              value !== null &&
              value !== undefined
          )
          .map(
            value =>
              String(value)
          );

      if (
        candidateIds.some(
          id =>
            targetIds.has(id)
        )
      ) {
        return true;
      }

      const candidateName =
        normalizeName(
          player.name ||
          [
            player.firstName,
            player.lastName,
          ]
            .filter(Boolean)
            .join(' ')
        );

      return (
        targetName &&
        candidateName ===
          targetName
      );
    };

  /*
   * Live-team player collections have evolved during the
   * resolver build. Search every supported collection rather
   * than assuming only teamState.skaters exists.
   */
  const collectTeamPlayers =
    teamState => {
      const collections =
        [
          teamState?.skaters,
          teamState?.players,
          teamState?.roster,
        ];

      return collections
        .filter(
          Array.isArray
        )
        .flat();
    };

  const homePlayers =
    collectTeamPlayers(
      activeLiveGame.home
    );

  const awayPlayers =
    collectTeamPlayers(
      activeLiveGame.away
    );

  /*
   * The live engine now exposes the career player explicitly.
   * Use that canonical reference first.
   */
  const homeCareerPlayer =
    activeLiveGame
      ?.home
      ?.careerPlayer ||
    null;

  const awayCareerPlayer =
    activeLiveGame
      ?.away
      ?.careerPlayer ||
    null;

  let liveSkater =
    homeCareerPlayer ||
    awayCareerPlayer ||
    null;

  let side =
    homeCareerPlayer
      ? 'home'
      : awayCareerPlayer
        ? 'away'
        : null;

  /*
   * Safety fallback for old saves/live states.
   */
  if (!liveSkater) {
    liveSkater =
      homePlayers.find(
        playerMatches
      ) ||
      null;

    if (liveSkater) {
      side =
        'home';
    }
  }

  if (!liveSkater) {
    liveSkater =
      awayPlayers.find(
        playerMatches
      ) ||
      null;

    if (liveSkater) {
      side =
        'away';
    }
  }

  /*
   * The deployment itself definitely contains the players
   * currently participating in the resolver, so also search it
   * directly. This is especially useful before/after rotations.
   */
  const homeDeployment =
    activeLiveGame
      ?.flow
      ?.homeDeployment ||
    null;

  const awayDeployment =
    activeLiveGame
      ?.flow
      ?.awayDeployment ||
    null;

  const homeOnIcePlayer =
    (
      Array.isArray(
        homeDeployment
          ?.skaters
      )
        ? homeDeployment.skaters
        : []
    ).find(
      playerMatches
    ) ||
    null;

  const awayOnIcePlayer =
    (
      Array.isArray(
        awayDeployment
          ?.skaters
      )
        ? awayDeployment.skaters
        : []
    ).find(
      playerMatches
    ) ||
    null;

  /*
   * If the team-state collection didn't expose the player but
   * the current deployment does, the deployment copy is still
   * a valid canonical live-player object.
   */
  if (
    !liveSkater &&
    homeOnIcePlayer
  ) {
    liveSkater =
      homeOnIcePlayer;

    side =
      'home';
  }

  if (
    !liveSkater &&
    awayOnIcePlayer
  ) {
    liveSkater =
      awayOnIcePlayer;

    side =
      'away';
  }

  const onIce =
    Boolean(
      homeOnIcePlayer ||
      awayOnIcePlayer
    );

  const deployment =
    side === 'home'
      ? homeDeployment
      : side === 'away'
        ? awayDeployment
        : null;

  const activePenalties =
    Array.isArray(
      activeLiveGame
        ?.specialTeams
        ?.activePenalties
    )
      ? activeLiveGame
          .specialTeams
          .activePenalties
      : [];

  const inPenaltyBox =
    activePenalties.some(
      penalty =>
        penalty?.active ===
          true &&
        playerMatches({
          playerId:
            penalty.playerId,
        })
    );

  return {
    side,
    liveSkater,
    deployment,
    onIce,
    inPenaltyBox,

    matched:
      Boolean(liveSkater),

    matchedFromDeployment:
      Boolean(
        homeOnIcePlayer ||
        awayOnIcePlayer
      ),
  };
}

function renderLiveCareerPlayerStrip() {
  const context =
    getLiveCareerPlayerContext();

  const identity =
    getLivePresentationPlayer(
      liveGameCareerPlayerId
    );

  if (!identity) {
    return;
  }

  const liveSkater =
    context?.liveSkater ||
    {};

  const canonicalPlayer =
    identity.player ||
    {};

  const playerName =
    identity.name ||
    'Career Player';

  const assignment =
    canonicalPlayer
      ?.lineupAssignment ||
    {};

  let playerRole =
    identity.position ||
    '—';

  if (
    assignment.unit ===
      'forward' &&
    assignment.line
  ) {
    playerRole =
      `${
        identity.position ||
        'F'
      } · Line ${
        assignment.line
      }`;
  }

  if (
    assignment.unit ===
      'defense' &&
    assignment.pair
  ) {
    playerRole =
      `${
        identity.position ||
        'D'
      } · Pair ${
        assignment.pair
      }`;
  }

  let status =
    'BENCH';

  if (
    context?.inPenaltyBox
  ) {
    status =
      'PENALTY BOX';
  } else if (
    context?.onIce
  ) {
    status =
      'ON ICE';
  }

  document.getElementById(
    'live-game-player-name'
  ).textContent =
    playerName;

  document.getElementById(
    'live-game-player-role'
  ).textContent =
    playerRole;

  document.getElementById(
    'live-game-player-status'
  ).textContent =
    status;

  const canonicalLiveTOISeconds =
    Math.max(
      0,
      Number(
        liveSkater.timeOnIceSeconds
      ) || 0
    );

  document.getElementById(
    'live-game-player-toi'
  ).textContent =
    formatLivePresentationClock(
      canonicalLiveTOISeconds
    );

  document.getElementById(
    'live-game-player-goals'
  ).textContent =
    String(
      Number(
        liveSkater.goals
      ) || 0
    );

  document.getElementById(
    'live-game-player-assists'
  ).textContent =
    String(
      Number(
        liveSkater.assists
      ) || 0
    );

  document.getElementById(
    'live-game-player-shots'
  ).textContent =
    String(
      Number(
        liveSkater.shots
      ) || 0
    );

  const plusMinus =
    Number(
      liveSkater.plusMinus
    ) || 0;

  document.getElementById(
    'live-game-player-plusminus'
  ).textContent =
    plusMinus > 0
      ? `+${plusMinus}`
      : String(
          plusMinus
        );
}

function renderLiveGameState() {
  if (!activeLiveGame) {
    return;
  }

  document.getElementById(
    'live-game-away-score'
  ).textContent =
    String(
      activeLiveGame
        ?.away
        ?.score ??
      0
    );

  document.getElementById(
    'live-game-home-score'
  ).textContent =
    String(
      activeLiveGame
        ?.home
        ?.score ??
      0
    );

  document.getElementById(
    'live-game-period'
  ).textContent =
    getLivePresentationPeriodLabel(
      activeLiveGame.period
    );

  document.getElementById(
    'live-game-clock'
  ).textContent =
    formatLivePresentationClock(
      activeLiveGame
        .clockSecondsRemaining
    );

  const strengthElement =
    document.getElementById(
      'live-game-strength'
    );

  if (strengthElement) {
    const homeStrength =
      Math.max(
        3,
        Number(
          activeLiveGame
            ?.specialTeams
            ?.homeSkaters
        ) || 5
      );

    const awayStrength =
      Math.max(
        3,
        Number(
          activeLiveGame
            ?.specialTeams
            ?.awaySkaters
        ) || 5
      );

    strengthElement.textContent =
      `${awayStrength} ON ${homeStrength}`;
  }

  renderLiveCareerPlayerStrip();
}

function appendLiveGameEventToFeed(
  event
) {
  if (!event) {
    return;
  }

  /*
   * ROADMAP 6 — BROADCAST FEED FILTER
   *
   * The simulation remains fully detailed internally.
   * The player-facing feed only surfaces meaningful
   * broadcast events.
   */
  const eventType =
    String(
      event.type ||
      event.eventType ||
      event.result ||
      ''
    );

  const visibleEventTypes =
    new Set([
      'shot',
      'shot-on-goal',
      'shot-saved',
      'hit',
      'goal',
      'penalty',
      'career-pass',
      'career-defense',
    ]);

  if (
    !visibleEventTypes.has(
      eventType
    )
  ) {
    return;
  }

  const timeline =
    document.getElementById(
      'live-game-timeline'
    );

  if (!timeline) {
    return;
  }

  const emptyState =
    timeline.querySelector(
      '.live-game__timeline-empty'
    );

  if (emptyState) {
    emptyState.remove();
  }

  const eventElement =
    document.createElement(
      'div'
    );

  eventElement.className =
    'live-game__timeline-event';

  if (eventType === 'goal') {
    eventElement.classList.add('live-game__timeline-event--goal');
  }

  eventElement.dataset.eventId =
    String(
      event.id ||
      ''
    );

  const period =
    getLivePresentationPeriodLabel(
      event.period ||
      activeLiveGame?.period
    );

  const clock =
    formatLivePresentationClock(
      event.clockSecondsRemaining ??
      activeLiveGame
        ?.clockSecondsRemaining
    );

  const eventText =
    getLivePresentationEventText(
      event
    );

  eventElement.innerHTML = `
    <span class="live-game__timeline-time">
      ${period} · ${clock}
    </span>

    <div class="live-game__timeline-primary">
      ${eventText.primary || ''}
    </div>

    ${
      eventText.secondary
        ? `
          <div class="live-game__timeline-secondary">
            ${eventText.secondary}
          </div>
        `
        : ''
    }
  `;

  /*
   * Newest event stays at the top,
   * HLM-style.
   */
  timeline.prepend(
    eventElement
  );

  /*
   * Keep the visible feed lightweight.
   * Older events remain in the simulation state.
   */
  while (
    timeline.children.length > 12
  ) {
    timeline.removeChild(
      timeline.lastElementChild
    );
  }
}

/*
 * ============================================================
 * ROADMAP 6 — RINK EVENT MARKERS
 * ============================================================
 *
 * The rink visualizes the same four broadcast event categories
 * shown in the Game Feed.
 *
 * Markers show only the acting player's jersey number.
 * Clicking one finds and highlights its matching feed event.
 */

function getLiveGameMarkerPlayerId(
  event
) {
  if (!event) {
    return null;
  }

  switch (event.type) {
    case 'shot':
    case 'shot-on-goal':
    case 'shot-saved':
      return (
        event.shooterPlayerId ||
        null
      );

    case 'goal':
      return (
        event.scorerPlayerId ||
        null
      );

    case 'hit':
      return (
        event.hitterPlayerId ||
        null
      );

    case 'penalty':
      return (
        event.playerId ||
        null
      );

    default:
      return null;
  }
}

function getStableLiveMarkerNumber(
  value
) {
  const text =
    String(
      value ||
      ''
    );

  let hash = 0;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    hash =
      (
        hash * 31 +
        text.charCodeAt(index)
      ) >>> 0;
  }

  return hash;
}

function getLiveGameMarkerPosition(
  event
) {
  const hash =
    getStableLiveMarkerNumber(
      event.id
    );

  /*
   * Teams change attacking ends each period.
   *
   * This is presentation-level zone placement only.
   * Exact shot/hit coordinates will eventually come from the
   * canonical simulation itself.
   */
  const oddPeriod =
    (
      Number(
        event.period
      ) || 1
    ) % 2 === 1;

  const eventSide =
    event.side ||
    event.penalizedSide ||
    'home';

  let attacksRight =
    eventSide === 'home';

  if (!oddPeriod) {
    attacksRight =
      !attacksRight;
  }

  const eventType =
    String(
      event.type ||
      ''
    );

  let xPercent;
  let yPercent;

  /*
   * Shots and goals appear inside the attacking zone.
   */
  if (
    eventType === 'shot' ||
    eventType === 'shot-on-goal' ||
    eventType === 'shot-saved' ||
    eventType === 'goal'
  ) {
    const attackingX =
      68 +
      (
        hash % 20
      );

    xPercent =
      attacksRight
        ? attackingX
        : 100 - attackingX;

    yPercent =
      22 +
      (
        (
          hash >>> 4
        ) % 56
      );
  }

  /*
   * Hits can happen across more of the ice.
   */
  else if (
    eventType === 'hit'
  ) {
    xPercent =
      18 +
      (
        hash % 64
      );

    yPercent =
      12 +
      (
        (
          hash >>> 5
        ) % 76
      );
  }

  /*
   * Penalties are shown near the general area of play.
   */
  else {
    xPercent =
      24 +
      (
        hash % 52
      );

    yPercent =
      18 +
      (
        (
          hash >>> 6
        ) % 64
      );
  }

  return {
    xPercent,
    yPercent,
  };
}

function highlightLiveGameFeedEvent(
  eventId
) {
  if (!eventId) {
    return;
  }

  const timeline =
    document.getElementById(
      'live-game-timeline'
    );

  if (!timeline) {
    return;
  }

  timeline
    .querySelectorAll(
      '.live-game__timeline-event--highlighted'
    )
    .forEach(element => {
      element.classList.remove(
        'live-game__timeline-event--highlighted'
      );
    });

  const matchingEvent =
    Array
      .from(
        timeline.querySelectorAll(
          '.live-game__timeline-event'
        )
      )
      .find(
        element =>
          String(
            element.dataset
              .eventId ||
            ''
          ) ===
          String(eventId)
      );

  if (!matchingEvent) {
    return;
  }

  matchingEvent.classList.add(
    'live-game__timeline-event--highlighted'
  );

  matchingEvent.scrollIntoView({
    behavior:
      'smooth',

    block:
      'center',
  });

  window.setTimeout(
    () => {
      matchingEvent.classList.remove(
        'live-game__timeline-event--highlighted'
      );
    },
    2200
  );
}

function appendLiveGameMarker(
  event
) {
  if (!event?.id) {
    return;
  }

  const rinkEvents =
    document.getElementById(
      'live-game-rink-events'
    );

  if (!rinkEvents) {
    return;
  }

  const playerId =
    getLiveGameMarkerPlayerId(
      event
    );

  const player =
    getLivePresentationPlayer(
      playerId
    );

  if (
    !player ||
    player.jerseyNumber ===
      null ||
    player.jerseyNumber ===
      undefined
  ) {
    return;
  }

  const position =
    getLiveGameMarkerPosition(
      event
    );

  const marker =
    document.createElement(
      'button'
    );

  marker.type =
    'button';

  const markerType =
    String(
      event.type ||
      ''
    );

  let markerClass =
    'live-game__event-marker';

  if (
    markerType === 'shot' ||
    markerType === 'shot-on-goal' ||
    markerType === 'shot-saved'
  ) {
    markerClass +=
      ' live-game__event-marker--shot';
  }

  if (
    markerType === 'goal'
  ) {
    markerClass +=
      ' live-game__event-marker--goal';
  }

  if (
    markerType === 'hit'
  ) {
    markerClass +=
      ' live-game__event-marker--hit';
  }

  if (
    markerType === 'penalty'
  ) {
    markerClass +=
      ' live-game__event-marker--penalty';
  }

  marker.className =
    markerClass;

  marker.dataset.eventId =
    String(event.id);

  marker.textContent =
    String(
      player.jerseyNumber
    );

  marker.style.left =
    `${position.xPercent}%`;

  marker.style.top =
    `${position.yPercent}%`;

  marker.setAttribute(
    'aria-label',
    `View ${event.type} by ${player.name}`
  );

  marker.addEventListener(
    'click',
    () => {
      highlightLiveGameFeedEvent(
        event.id
      );
    }
  );

  rinkEvents.appendChild(
    marker
  );

  /*
   * Keep only the most recent markers visible.
   */
  while (
    rinkEvents.children.length >
    10
  ) {
    rinkEvents.removeChild(
      rinkEvents.firstElementChild
    );
  }
}

function closeLiveGameCareerDecision() {
  document.getElementById(
    'live-game-career-decision'
  )?.remove();
  liveGameCareerDecisionOpen =
    false;
}

function submitLiveGameCareerDecision(
  action,
  choiceLabel = '',
  choiceRisk = '',
  scenarioLabel = ''
) {
  if (
    !activeLiveGame ||
    !liveGameCareerPlayerId ||
    !liveGameCareerDecisionOpen
  ) {
    return;
  }

  const decisionCard =
    document.getElementById(
      'live-game-career-decision'
    );

  if (decisionCard) {
    decisionCard
      .querySelectorAll('button')
      .forEach(button => {
        button.disabled = true;
        button.style.opacity = '.55';
      });
  }

  const context =
    getLiveCareerPlayerContext();

  const careerScore =
    context?.side === 'home'
      ? Number(activeLiveGame.home?.score) || 0
      : Number(activeLiveGame.away?.score) || 0;

  const opponentScore =
    context?.side === 'home'
      ? Number(activeLiveGame.away?.score) || 0
      : Number(activeLiveGame.home?.score) || 0;

  liveGameCareerDecisionLastChoice = {
    action,
    label:
      choiceLabel ||
      (String(action).startsWith('shoot')
        ? 'Shoot'
        : String(action).startsWith('pass')
          ? 'Pass'
          : 'Hold the puck'),
    risk:
      choiceRisk ||
      'READ',
    scenario:
      scenarioLabel ||
      'YOUR MOMENT',
    period:
      activeLiveGame.period,
    clockSecondsRemaining:
      activeLiveGame.clockSecondsRemaining,
    careerScore,
    opponentScore,
    pressureBefore:
      Number(activeLiveGame.flow?.pressureLevel) || 0,
  };

  activeLiveGame.pendingCareerDecision = {
    action,
    playerId:
      liveGameCareerPlayerId,
    period:
      activeLiveGame.period,
    clockSecondsRemaining:
      activeLiveGame.clockSecondsRemaining,
  };

  closeLiveGameCareerDecision();

  liveGameCareerDecisionCooldownSteps =
    11;

  /*
   * Resolve the selected hockey action immediately. The choice itself
   * intentionally paused playback, so waiting for the next playback timer
   * made some rush decisions appear frozen until the user pressed 1x.
   */
  liveGamePlaybackPaused = false;
  clearLiveGamePlaybackTimer();

  const immediateDecisionResult =
    advanceLiveGamePresentationChunk(60);

  if (
    (!immediateDecisionResult || immediateDecisionResult.success !== true) &&
    activeLiveGame?.gameComplete !== true
  ) {
    console.error(
      '[Project Ice] Immediate career decision resolution failed.',
      immediateDecisionResult
    );
    startLiveGamePlayback(liveGamePlaybackSpeed);
    return;
  }

  /*
   * A meaningful outcome pauses itself and waits for Resume Game. If this
   * particular action produced no outcome overlay, return to normal playback.
   */
  if (
    !document.getElementById('live-game-career-outcome') &&
    activeLiveGame?.gameComplete !== true
  ) {
    startLiveGamePlayback(liveGamePlaybackSpeed);
  }
}

function maybeOpenLiveGameCareerDecision() {
  if (
    liveGameCareerDecisionOpen ||
    !activeLiveGame ||
    activeLiveGame.gameComplete === true
  ) {
    return liveGameCareerDecisionOpen;
  }

  if (liveGameCareerDecisionCooldownSteps > 0) {
    liveGameCareerDecisionCooldownSteps -= 1;
    return false;
  }

  const context =
    getLiveCareerPlayerContext();

  const flow =
    activeLiveGame.flow ||
    null;

  if (
    !context?.onIce ||
    context.inPenaltyBox ||
    !flow ||
    flow.stopped === true ||
    (flow.possessionSide !== 'home' && flow.possessionSide !== 'away')
  ) {
    return false;
  }

  const zone = flow.zone || 'neutral';
  const careerHasPossession = flow.possessionSide === context.side;
  const careerIsDefending = flow.possessionSide !== context.side;

  if (careerHasPossession && zone !== 'offensive' && zone !== 'neutral') {
    return false;
  }

  const period =
    Number(activeLiveGame.period) || 1;

  const clock =
    Number(activeLiveGame.clockSecondsRemaining) || 0;

  const careerScore =
    context.side === 'home'
      ? Number(activeLiveGame.home?.score) || 0
      : Number(activeLiveGame.away?.score) || 0;

  const opponentScore =
    context.side === 'home'
      ? Number(activeLiveGame.away?.score) || 0
      : Number(activeLiveGame.home?.score) || 0;

  const scoreDiff =
    careerScore -
    opponentScore;

  const homeSkaters =
    Math.max(
      3,
      Number(activeLiveGame.specialTeams?.homeSkaters) || 5
    );

  const awaySkaters =
    Math.max(
      3,
      Number(activeLiveGame.specialTeams?.awaySkaters) || 5
    );

  const careerSkaters =
    context.side === 'home'
      ? homeSkaters
      : awaySkaters;

  const opponentSkaters =
    context.side === 'home'
      ? awaySkaters
      : homeSkaters;

  const onPowerPlay =
    careerSkaters >
    opponentSkaters;

  const lateClutch =
    period >= 3 &&
    clock <= 300 &&
    Math.abs(scoreDiff) <= 1;

  const pressure =
    Number(flow.pressureLevel) ||
    0;

  let chance = careerIsDefending
    ? Math.min(0.18, 0.055 + pressure * 0.021)
    : zone === 'offensive'
      ? Math.min(0.20, 0.07 + pressure * 0.023)
      : 0.085;

  if (!careerIsDefending && onPowerPlay) chance += 0.035;
  if (careerIsDefending && careerSkaters < opponentSkaters) chance += 0.035;
  if (lateClutch) chance += careerIsDefending ? 0.06 : 0.08;

  if (Math.random() >= chance) {
    return false;
  }

  let scenario = careerIsDefending ? {
    key: zone === 'offensive' ? 'defensive-zone-read' : 'backcheck-read',
    eyebrow: zone === 'offensive' ? 'DEFENSIVE ZONE' : 'BACKCHECK',
    title: zone === 'offensive'
      ? 'The puck carrier attacks your layer of coverage.'
      : 'The rush is coming back at you with speed.',
    detail: zone === 'offensive'
      ? 'Choose how aggressively you want to challenge the possession.'
      : 'Your read can stop the rush or give the attack another lane.',
    accent: '#7dd3b0',
    choices: [
      { action: 'defend-stick', label: 'Attack the puck', note: 'Use your stick and timing to force a takeaway', risk: 'READ' },
      { action: 'defend-body', label: 'Step into him', note: 'Use strength and body checking to separate puck from player', risk: 'PHYSICAL' },
      { action: 'defend-contain', label: 'Hold your lane', note: 'Stay disciplined and take away the dangerous option', risk: 'POSITION' },
    ],
  } : {
    key: 'offensive-read',
    eyebrow: 'OFFENSIVE ZONE',
    title: 'You receive the puck with room to work.',
    detail: 'The defense is set, but you have enough space to dictate the next move.',
    accent: '#6aa8ff',
    choices: [
      {
        action: 'shoot',
        label: 'Attack the net',
        note: 'Turn the possession into a shot now',
        risk: 'AGGRESSIVE',
      },
      {
        action: 'pass',
        label: 'Find the open man',
        note: 'Use vision and passing to extend the attack',
        risk: 'CREATE',
      },
      {
        action: 'hold',
        label: 'Protect and scan',
        note: 'Keep possession and wait for a better lane',
        risk: 'POISE',
      },
    ],
  };

  if (!careerIsDefending && zone === 'neutral') {
    const rushRoll = Math.random();

    if (rushRoll < 0.24) {
      scenario = {
        key: 'breakaway',
        eyebrow: 'BREAKAWAY',
        title: 'You are in alone on the goalie.',
        detail: 'There is no second defender to bail him out. Pick how you want to finish it.',
        accent: '#ffcf70',
        choices: [
          {
            action: 'shoot-snap',
            label: 'Shoot early',
            note: 'Release it before the goalie can fully set',
            risk: 'QUICK',
          },
          {
            action: 'shoot-breakaway',
            label: 'Make a move',
            note: 'Challenge the goalie with deking and puck control',
            risk: 'SKILL',
          },
          {
            action: 'shoot-wrist',
            label: 'Pick a corner',
            note: 'Stay patient and trust your wrist-shot accuracy',
            risk: 'FINISH',
          },
        ],
      };
    } else if (rushRoll < 0.68) {
      scenario = {
        key: 'two-on-one',
        eyebrow: '2-ON-1 RUSH',
        title: 'You enter with one teammate and one defender back.',
        detail: 'The defender has to respect both lanes. Your read decides the chance.',
        accent: '#7ec8ff',
        choices: [
          {
            action: 'shoot-snap',
            label: 'Use the teammate as a decoy',
            note: 'Keep the puck and snap it before the defender closes',
            risk: 'SHOOT',
          },
          {
            action: 'pass-seam',
            label: 'Slide it across',
            note: 'Attempt the dangerous pass through the defender',
            risk: 'HIGH RISK',
          },
          {
            action: 'hold',
            label: 'Delay and read',
            note: 'Force the defender to commit before making the next play',
            risk: 'POISE',
          },
        ],
      };
    } else {
      scenario = {
        key: 'transition-rush',
        eyebrow: 'TRANSITION RUSH',
        title: 'You carry the puck at a retreating defense.',
        detail: 'The gap is still forming. Your next touch decides whether the rush becomes a chance.',
        accent: '#75b7ff',
        choices: [
          {
            action: 'shoot-snap',
            label: 'Drive and fire',
            note: 'Attack before the defense can set',
            risk: 'ATTACK',
          },
          {
            action: 'pass-trailer',
            label: 'Hit the trailer',
            note: 'Move the puck into the developing second wave',
            risk: 'VISION',
          },
          {
            action: 'hold',
            label: 'Delay the rush',
            note: 'Buy time and let support arrive',
            risk: 'CONTROL',
          },
        ],
      };
    }
  } else if (!careerIsDefending && pressure >= 5) {
    scenario = {
      key: 'net-front-chaos',
      eyebrow: 'NET-FRONT CHAOS',
      title: 'The defense is scrambling around its own crease.',
      detail: 'Bodies are collapsing toward the net and the goalie is fighting through traffic.',
      accent: '#ffbe66',
      choices: [
        {
          action: 'shoot-rebound',
          label: 'Jam the loose puck',
          note: 'Trust the chaos and get the puck on goal',
          risk: 'FINISH',
        },
        {
          action: 'pass-backdoor',
          label: 'Slip it backdoor',
          note: 'Look for a teammate outside the collapse',
          risk: 'CREATE',
        },
        {
          action: 'hold',
          label: 'Pull it back',
          note: 'Escape the traffic and reset the possession',
          risk: 'COMPOSED',
        },
      ],
    };
  } else if (!careerIsDefending && pressure >= 3) {
    scenario = {
      key: 'high-danger-read',
      eyebrow: 'HIGH-DANGER READ',
      title: 'A dangerous lane opens in front of you.',
      detail: 'You have a brief window before the defense closes it down.',
      accent: '#84c6ff',
      choices: [
        {
          action: 'shoot-snap',
          label: 'Take the lane',
          note: 'Use the opening before it disappears',
          risk: 'DECISIVE',
        },
        {
          action: 'pass-seam',
          label: 'Draw and dish',
          note: 'Pull pressure toward you and move the puck',
          risk: 'PLAYMAKE',
        },
        {
          action: 'hold',
          label: 'Stay on it',
          note: 'Protect the puck and force another defensive read',
          risk: 'POISE',
        },
      ],
    };
  }

  if (!careerIsDefending && onPowerPlay) {
    scenario = {
      key: 'power-play-read',
      eyebrow: 'POWER PLAY',
      title: 'The penalty kill collapses toward your side.',
      detail: 'One clean decision can shift the entire box and create the best look of the shift.',
      accent: '#f0bf55',
      choices: [
        {
          action: 'shoot-one-timer',
          label: 'Hammer the one-timer',
          note: 'Get it to the net while the goalie is fighting traffic',
          risk: 'PRESSURE',
        },
        {
          action: 'pass-seam',
          label: 'Work it through the seam',
          note: 'Use your vision to force the penalty kill to rotate',
          risk: 'CREATE',
        },
        {
          action: 'hold',
          label: 'Reset the setup',
          note: 'Keep possession and make the killers move again',
          risk: 'PATIENT',
        },
      ],
    };
  }

  if (lateClutch && !careerIsDefending) {
    const tied =
      scoreDiff === 0;

    scenario = {
      key: 'clutch-possession',
      eyebrow:
        tied
          ? 'CLUTCH MOMENT · TIE GAME'
          : scoreDiff < 0
            ? 'CLUTCH MOMENT · NEED A GOAL'
            : 'CLUTCH MOMENT · PROTECT THE LEAD',
      title:
        tied
          ? 'This possession could decide the game.'
          : scoreDiff < 0
            ? 'Time is running out. The puck is on your stick.'
            : 'A smart decision here can drain precious time.',
      detail:
        `${getLivePresentationPeriodLabel(period)} · ${formatLivePresentationClock(clock)} · ${careerScore}-${opponentScore}`,
      accent: '#f5d06f',
      choices:
        scoreDiff > 0
          ? [
              {
                action: 'hold',
                label: 'Protect the puck',
                note: 'Make them chase you and burn clock',
                risk: 'SAFE',
              },
              {
                action: 'pass-safe',
                label: 'Find support',
                note: 'Move it to the safest open teammate',
                risk: 'SMART',
              },
              {
                action: 'shoot-snap',
                label: 'Go for the dagger',
                note: 'Attack before they can recover',
                risk: 'BOLD',
              },
            ]
          : [
              {
                action: 'shoot-snap',
                label: tied ? 'Take the big shot' : 'Fire it now',
                note: 'Put the moment on your stick',
                risk: 'CLUTCH',
              },
              {
                action: 'pass-seam',
                label: 'Find the best look',
                note: 'Trust your vision under pressure',
                risk: 'CREATE',
              },
              {
                action: 'hold',
                label: 'Wait for the lane',
                note: 'Stay composed and refuse a bad attempt',
                risk: 'POISE',
              },
            ],
    };
  }

  const card =
    document.createElement('div');

  card.id =
    'live-game-career-decision';

  card.style.cssText = `
    position:absolute;
    inset:0;
    z-index:40;
    display:flex;
    align-items:flex-end;
    padding:18px 14px 20px;
    background:linear-gradient(180deg,rgba(2,10,23,.20) 0%,rgba(2,9,22,.72) 42%,rgba(1,7,17,.96) 100%);
    backdrop-filter:blur(2px);
  `;

  const choiceMarkup =
    scenario.choices
      .map(
        (choice, index) => `
          <button
            type="button"
            data-career-live-choice="${choice.action}"
            data-career-live-label="${choice.label}"
            data-career-live-risk="${choice.risk}"
            data-career-live-scenario="${scenario.eyebrow}"
            style="
              width:100%;
              text-align:left;
              border:1px solid ${index === 0 ? scenario.accent : 'rgba(255,255,255,.13)'};
              border-radius:14px;
              padding:12px 13px;
              background:${index === 0 ? 'rgba(35,103,210,.23)' : 'rgba(255,255,255,.055)'};
              color:#fff;
            "
          >
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
              <span style="font-size:14px;font-weight:850;">${choice.label}</span>
              <span style="font-size:9px;font-weight:900;letter-spacing:.11em;color:${scenario.accent};">${choice.risk}</span>
            </div>
            <div style="margin-top:3px;font-size:11px;line-height:1.3;color:rgba(208,222,244,.67);">${choice.note}</div>
          </button>
        `
      )
      .join('');

  card.innerHTML = `
    <div style="width:100%;border:1px solid rgba(120,167,235,.25);border-radius:20px;padding:16px;background:rgba(5,17,38,.98);box-shadow:0 18px 45px rgba(0,0,0,.50);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="font-size:10px;font-weight:900;letter-spacing:.15em;color:${scenario.accent};">YOUR MOMENT · ${scenario.eyebrow}</div>
        <div style="font-size:10px;font-weight:800;color:rgba(190,208,234,.58);">${getLivePresentationPeriodLabel(period)} · ${formatLivePresentationClock(clock)}</div>
      </div>
      <div style="margin-top:8px;font-size:19px;line-height:1.15;font-weight:900;color:#fff;">${scenario.title}</div>
      <div style="margin-top:6px;font-size:12px;line-height:1.4;color:rgba(207,220,241,.72);">${scenario.detail}</div>
      <div style="margin-top:9px;font-size:10px;font-weight:800;color:rgba(180,202,235,.52);">SCORE ${careerScore}-${opponentScore} · PRESSURE ${Math.round(pressure)}</div>
      <div style="display:grid;gap:8px;margin-top:14px;">${choiceMarkup}</div>
      <div style="margin-top:10px;text-align:center;font-size:9px;letter-spacing:.09em;color:rgba(171,190,220,.42);">YOUR ATTRIBUTES + GAME CONTEXT RESOLVE THE RESULT</div>
    </div>
  `;

  card.querySelectorAll(
    '[data-career-live-choice]'
  ).forEach(button => {
    button.addEventListener('click', () => {
      submitLiveGameCareerDecision(
        button.dataset.careerLiveChoice,
        button.dataset.careerLiveLabel,
        button.dataset.careerLiveRisk,
        button.dataset.careerLiveScenario
      );
    });
  });

  /*
   * Only freeze playback after the full scenario card exists. If scenario
   * construction ever fails, normal game playback is never left silently
   * paused with nothing for the player to interact with.
   */
  pauseLiveGamePlayback();
  liveGameCareerDecisionOpen = true;
  liveGameScreen.appendChild(card);
  return true;
}

function advanceLiveGamePresentationStep() {
  if (!activeLiveGame) {
    console.error(
      '[Project Ice] No active live game simulation.'
    );

    return;
  }

  if (
    activeLiveGame
      .gameComplete === true
  ) {
    return;
  }

  if (maybeOpenLiveGameCareerDecision()) {
    return {
      success: true,
      elapsedSeconds: 0,
      gameComplete: false,
      decisionPending: true,
    };
  }

  const careerContextBefore =
    getLiveCareerPlayerContext();

  const careerWasOnIce =
    careerContextBefore
      ?.onIce === true;

  const previousEventCount =
    Array.isArray(
      activeLiveGame.events
    )
      ? activeLiveGame.events.length
      : 0;

  const step =
    WorldEngine
      .advanceLiveGameStep(
        activeLiveGame
      );

  if (
    !step ||
    step.success !== true
  ) {
    console.error(
      '[Project Ice] Live game step failed.',
      step
    );

    return;
  }

  /*
   * advanceLiveGameStep mutates the same canonical simulation
   * object. Keep the returned reference if supplied.
   */
  activeLiveGame =
    step.simulation ||
    activeLiveGame;

  const elapsedSeconds =
    Math.max(
      0,
      Number(
        step.elapsedSeconds
      ) || 0
    );

  const careerContextAfter =
    getLiveCareerPlayerContext();

  const careerIsOnIce =
    careerContextAfter
      ?.onIce === true;

  /*
   * A deployment may be selected or cleared inside the canonical
   * step itself, so checking both sides of the step prevents us
   * from losing the first or final segment of a shift.
   */
  if (elapsedSeconds > 0) {
    if (
      careerWasOnIce &&
      careerIsOnIce
    ) {
      liveGameCareerTOISeconds +=
        elapsedSeconds;
    } else if (
      careerWasOnIce ||
      careerIsOnIce
    ) {
      liveGameCareerTOISeconds +=
        elapsedSeconds * 0.5;
    }
  }

  renderLiveGameState();

  const events =
    Array.isArray(
      activeLiveGame.events
    )
      ? activeLiveGame.events
      : [];

  const newEvents =
    events.slice(
      previousEventCount
    );

  if (liveGameCareerDecisionLastChoice) {
    const choice =
      liveGameCareerDecisionLastChoice;

    const outcomeEvent =
      newEvents[newEvents.length - 1] ||
      step.event ||
      null;

    const outcomeType =
      String(outcomeEvent?.type || '');

    const eventText =
      outcomeEvent
        ? getLivePresentationEventText(outcomeEvent)
        : null;

    const contextAfterChoice =
      getLiveCareerPlayerContext();

    const careerScore =
      contextAfterChoice?.side === 'home'
        ? Number(activeLiveGame.home?.score) || 0
        : Number(activeLiveGame.away?.score) || 0;

    const opponentScore =
      contextAfterChoice?.side === 'home'
        ? Number(activeLiveGame.away?.score) || 0
        : Number(activeLiveGame.home?.score) || 0;

    const pressureAfter =
      Number(activeLiveGame.flow?.pressureLevel) || 0;

    const isPassChoice =
      String(choice.action || '').startsWith('pass');

    const isShotChoice =
      String(choice.action || '').startsWith('shoot');

    let resultTag =
      choice.action === 'hold'
        ? 'POISE'
        : isPassChoice
          ? 'CREATE'
          : 'ATTACK';

    let outcomeTitle =
      choice.action === 'hold'
        ? 'You stay composed and let the play develop.'
        : isPassChoice
          ? 'You move the puck.'
          : 'You attack the net.';

    let outcomeDetail =
      eventText?.secondary ||
      'Play develops from your decision.';

    let impactDetail =
      `Offensive pressure: ${pressureAfter}`;

    if (outcomeType === 'goal') {
      resultTag = 'IMPACT';
      outcomeTitle =
        eventText?.primary ||
        'GOAL — your decision pays off.';
      outcomeDetail =
        eventText?.secondary ||
        'A huge moment in the game.';
      impactDetail =
        `Score now ${careerScore}-${opponentScore}`;
    } else if (
      outcomeType === 'shot' ||
      outcomeType === 'shot-on-goal' ||
      outcomeType === 'shot-saved' ||
      outcomeType === 'shot-blocked' ||
      outcomeType === 'shot-missed'
    ) {
      resultTag = 'CHANCE';
      outcomeTitle =
        eventText?.primary ||
        'You create a shooting chance.';
      outcomeDetail =
        eventText?.secondary ||
        'The possession produces a shot.';
      impactDetail =
        `Score ${careerScore}-${opponentScore} · pressure ${pressureAfter}`;
    } else if (outcomeType === 'career-defense') {
      const defenseAction = String(outcomeEvent?.defenseAction || choice.action || '');
      const succeeded = outcomeEvent?.succeeded === true;
      const wonPuck = outcomeEvent?.possessionChanged === true;
      outcomeTitle = wonPuck
        ? 'You win the puck back.'
        : succeeded
          ? 'You shut the play down.'
          : 'The attacker gets through your pressure.';
      outcomeDetail = wonPuck
        ? `${defenseAction === 'defend-body' ? 'The contact separates him from the puck' : 'Your read creates the takeaway'} · possession flips your way.`
        : succeeded
          ? `Pressure drops from ${Number(outcomeEvent?.pressureBefore || 0).toFixed(1)} to ${Number(outcomeEvent?.pressureAfter || 0).toFixed(1)} and the danger is contained.`
          : `The gamble does not land · opponent pressure rises to ${Number(outcomeEvent?.pressureAfter || 0).toFixed(1)}.`;
      resultTag = wonPuck ? 'TAKEAWAY' : succeeded ? 'DEFENDED' : 'BEATEN';
    } else if (outcomeType === 'career-pass') {
      resultTag = 'CREATED';
      outcomeTitle =
        'Pass completed — possession stays alive.';
      outcomeDetail =
        'Your read keeps the attack moving and gives your team another action.';
      impactDetail =
        `Offensive pressure builds to ${pressureAfter}`;
    } else if (outcomeType === 'turnover') {
      resultTag = 'TURNOVER';
      outcomeTitle =
        'The defense reads the play.';
      outcomeDetail =
        'Your possession ends and the puck goes the other way.';
      impactDetail =
        `Score remains ${careerScore}-${opponentScore}`;
    } else if (choice.action === 'hold') {
      resultTag = 'POISE';
      outcomeTitle =
        'You stay patient and let the play breathe.';
      outcomeDetail =
        eventText?.primary ||
        'The next layer of the possession develops around you.';
      impactDetail =
        eventText?.secondary ||
        `Offensive pressure: ${pressureAfter}`;
    }

    /*
     * The result itself is now a player moment too.
     * Freeze the live game until the user has had time to absorb it.
     */
    pauseLiveGamePlayback();

    document.getElementById(
      'live-game-career-outcome'
    )?.remove();

    const outcome =
      document.createElement('div');

    outcome.id =
      'live-game-career-outcome';

    outcome.style.cssText = `
      position:absolute;
      inset:0;
      z-index:38;
      display:flex;
      align-items:flex-end;
      padding:18px 14px 20px;
      background:linear-gradient(180deg,rgba(2,10,23,.12) 0%,rgba(2,9,22,.66) 46%,rgba(1,7,17,.96) 100%);
      backdrop-filter:blur(2px);
    `;

    outcome.innerHTML = `
      <div style="width:100%;border:1px solid rgba(113,164,239,.30);border-radius:20px;padding:16px;background:rgba(5,17,38,.985);box-shadow:0 18px 45px rgba(0,0,0,.48);">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div style="font-size:9px;font-weight:900;letter-spacing:.14em;color:#7fb2ff;">${String(choice.scenario || 'YOUR MOMENT').toUpperCase()}</div>
          <div style="font-size:9px;font-weight:900;letter-spacing:.12em;color:#f1c86a;">${resultTag}</div>
        </div>
        <div style="margin-top:7px;font-size:11px;font-weight:800;color:rgba(197,215,242,.68);">YOU CHOSE · ${String(choice.label || choice.action).toUpperCase()}</div>
        <div style="margin-top:5px;font-size:18px;line-height:1.2;font-weight:900;color:#fff;">${outcomeTitle}</div>
        <div style="margin-top:6px;font-size:12px;line-height:1.45;color:rgba(211,224,244,.75);">${outcomeDetail}</div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:10px;line-height:1.35;color:rgba(177,198,228,.58);">${impactDetail} · ${getLivePresentationPeriodLabel(activeLiveGame.period)} ${formatLivePresentationClock(activeLiveGame.clockSecondsRemaining)} · ${careerScore}-${opponentScore}</div>
        <button id="live-game-career-outcome-resume" type="button" style="width:100%;margin-top:13px;padding:12px 14px;border-radius:13px;border:1px solid rgba(116,169,255,.48);background:rgba(35,103,210,.32);color:#fff;font-size:13px;font-weight:900;letter-spacing:.02em;">Resume Game</button>
      </div>
    `;

    liveGameScreen.appendChild(outcome);

    document.getElementById(
      'live-game-career-outcome-resume'
    )?.addEventListener(
      'click',
      () => {
        outcome.remove();
        startLiveGamePlayback(
          liveGamePlaybackSpeed
        );
      }
    );

    liveGameCareerDecisionLastChoice =
      null;
  }

  newEvents.forEach(
    event => {
      appendLiveGameEventToFeed(
        event
      );

      const visibleMarkerTypes =
        new Set([
          'shot',
          'shot-on-goal',
          'shot-saved',
          'goal',
          'hit',
          'penalty',
        ]);

      if (
        visibleMarkerTypes.has(
          String(
            event?.type ||
            ''
          )
        )
      ) {
        appendLiveGameMarker(
          event
        );
      }
    }
  );
  return {
    success: true,

    elapsedSeconds:
      Math.max(
        0,
        Number(
          step.elapsedSeconds
        ) || 0
      ),

    gameComplete:
      activeLiveGame
        ?.gameComplete === true,
  };
}

/*
 * ============================================================
 * ROADMAP 6 — LIVE GAME PLAYBACK
 * ============================================================
 *
 * Presentation speed controls how much canonical hockey time
 * is consumed during each playback tick.
 *
 * 1×  -> ~1 game minute every 1 real second
 * 2×  -> ~2 game minutes every 1 real second
 * 4×  -> ~4 game minutes every 1 real second
 * MAX -> rapid completion
 *
 * Every canonical step still occurs. Nothing inside the
 * simulation is skipped merely because presentation is faster.
 */

function clearLiveGamePlaybackTimer() {
  if (
    liveGamePlaybackTimer !==
    null
  ) {
    window.clearTimeout(
      liveGamePlaybackTimer
    );

    liveGamePlaybackTimer =
      null;
  }
}

function setLiveGameActiveSpeedButton(
  speed
) {
  document
    .querySelectorAll(
      '[data-live-game-speed]'
    )
    .forEach(button => {
      button.classList.remove(
        'live-game__speed-button--active'
      );

      if (
        String(
          button.dataset
            .liveGameSpeed
        ) ===
        String(speed)
      ) {
        button.classList.add(
          'live-game__speed-button--active'
        );
      }
    });
}

function advanceLiveGamePresentationChunk(
  targetGameSeconds
) {
  if (
    !activeLiveGame ||
    activeLiveGame
      .gameComplete === true
  ) {
    return {
      success: true,
      elapsedSeconds: 0,
      gameComplete:
        activeLiveGame
          ?.gameComplete === true,
    };
  }

  const targetSeconds =
    Math.max(
      1,
      Number(
        targetGameSeconds
      ) || 60
    );

  let elapsedSeconds =
    0;

  let safetySteps =
    0;

  /*
   * Some canonical steps consume zero clock time:
   * faceoffs, restarts, shootout transitions, etc.
   *
   * They must still resolve, so this loop counts hockey time
   * separately from raw engine steps.
   */
  while (
    activeLiveGame &&
    activeLiveGame
      .gameComplete !== true &&
    elapsedSeconds <
      targetSeconds &&
    safetySteps < 300
  ) {
    const stepResult =
      advanceLiveGamePresentationStep();

    safetySteps += 1;

    if (
      !stepResult ||
      stepResult.success !== true
    ) {
      return {
        success: false,

        elapsedSeconds,

        gameComplete:
          activeLiveGame
            ?.gameComplete === true,
      };
    }

    if (stepResult.decisionPending === true) {
      return {
        success: true,
        elapsedSeconds,
        gameComplete: false,
        safetySteps,
        decisionPending: true,
      };
    }

    elapsedSeconds +=
      Math.max(
        0,
        Number(
          stepResult
            .elapsedSeconds
        ) || 0
      );
  }

  return {
    success: true,

    elapsedSeconds,

    gameComplete:
      activeLiveGame
        ?.gameComplete === true,

    safetySteps,
  };
}

function pauseLiveGamePlayback() {
  liveGamePlaybackPaused =
    true;

  clearLiveGamePlaybackTimer();

  const pauseButton =
    document.getElementById(
      'btn-live-game-pause'
    );

  if (pauseButton) {
    pauseButton.textContent =
      'Resume';
  }
}

/*
 * ============================================================
 * ROADMAP 6 — LIVE GAME FINAL HORN
 * ============================================================
 *
 * This is the single presentation handoff point when the
 * canonical live simulation reports that the game is complete.
 *
 * Final result application + Postgame Summary routing will be
 * connected here next.
 */

  async function handleLiveGameCompletion() {
  if (
    liveGameCompletionHandled ||
    !activeLiveGame ||
    activeLiveGame
      .gameComplete !== true
  ) {
    return;
  }

  liveGameCompletionHandled =
    true;

  /*
   * Freeze the presentation at the final horn.
   */
  liveGamePlaybackPaused =
    true;

  clearLiveGamePlaybackTimer();

  /*
   * The final horn owns the live-game screen. Remove any persistent career
   * decision/outcome overlay so it cannot sit above the final Continue button.
   */
  document.getElementById(
    'live-game-career-decision'
  )?.remove();
  document.getElementById(
    'live-game-career-outcome'
  )?.remove();
  liveGameCareerDecisionOpen = false;

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
   * career-player stats and final events are painted before we
   * leave the live presentation.
   */
  renderLiveGameState();

  /*
   * Temporary final-horn hold.
   *
   * The next step replaces this timeout body with the canonical
   * result application + existing Postgame Summary handoff.
   */
  window.setTimeout(
    async () => {
      if (
        !activeLiveGame ||
        activeLiveGame
          .gameComplete !== true
      ) {
        return;
      }

      /*
       * Freeze the completed live simulation into the exact
       * canonical gameResult contract used everywhere else.
       */
      const finalization =
        WorldEngine
          .finalizeLiveGameSimulation(
            activeLiveGame
          );

      if (
        !finalization ||
        finalization
          .success !== true ||
        !finalization
          .gameResult
      ) {
        console.error(
          '[Project Ice] Live game finalization failed.',
          finalization
        );

        liveGameCompletionHandled =
          false;

        return;
      }

      const gameId =
        finalization
          .gameResult
          .gameId ||
        activeLiveGame
          .gameId;

      const gameDate =
        finalization
          .gameResult
          .date ||
        Game.player
          .currentDate;

      /*
       * Send the live game's completed canonical result through
       * the SAME permanent date-processing pipeline used by
       * normal simulated games.
       *
       * This is what writes:
       * - schedule result
       * - standings
       * - skater stats
       * - goalie stats
       * - career progression
       * - permanent postgame summary
       */
      const application =
        WorldEngine
          .advanceToDate(
            gameDate,
            {
              processCurrentDate:
                true,

              resolvedGameResult:
                finalization
                  .gameResult,
            }
          );

      if (
        !application ||
        application
          .success !== true
      ) {
        console.error(
          '[Project Ice] Live game result application failed.',
          application
        );

        liveGameCompletionHandled =
          false;

        return;
      }

      /*
       * The completed live-game result has now been applied to the
       * canonical World Engine schedule in memory.
       *
       * Persist that completed state immediately so a reload cannot
       * restore the pregame version of this scheduled game.
       */
      const worldSaved =
        await WorldEngine.save();

      if (!worldSaved) {
        console.error(
          '[Project Ice] Completed live game could not be persisted.'
        );

        liveGameCompletionHandled =
          false;

        return;
      }

      

      /*
       * Pull the newly persisted world state back into the
       * presentation layer before opening Postgame.
       */
      /*
       * These presentation refreshes are useful, but they are not allowed
       * to block the final-horn Continue control. A late-season schedule
       * migration or another optional UI refresh can throw even though the
       * completed game has already been finalized, applied and saved.
       */
      try {
        if (
          typeof syncCareerPlayerWithWorld ===
          'function'
        ) {
          syncCareerPlayerWithWorld();
        }

        if (
          typeof refreshScheduleEvents ===
          'function'
        ) {
          refreshScheduleEvents();
        }
      } catch (error) {
        console.warn(
          '[Project Ice] Optional postgame presentation refresh failed; Continue remains available.',
          error
        );
      }

      /*
       * openPostgameSummary reads ONLY the permanently saved
       * scheduled-game result, so reaching this screen proves
       * the canonical application succeeded.
       */
      /*
       * Keep the player on the rink after the final horn.
       * The game has already been permanently applied above;
       * this button only controls when we leave the live-game
       * presentation and enter Postgame Summary.
       */
      let continueButton =
        document.getElementById(
          'live-game-final-continue'
        );

      if (!continueButton) {
        continueButton =
          document.createElement(
            'button'
          );

        continueButton.id =
          'live-game-final-continue';

        continueButton.type =
          'button';

        continueButton.textContent =
          'Continue';

        continueButton.style.cssText = `
          position: fixed;
          left: 50%;
          bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%);
          z-index: 2147483647;
          pointer-events: auto;
          touch-action: manipulation;

          min-width: 132px;
          padding: 11px 22px;

          border: 1px solid rgba(116, 169, 255, 0.34);
          border-radius: 999px;

          background: rgba(9, 28, 58, 0.94);
          color: #f5f8ff;

          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.03em;

          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.22);

          opacity: 0;
          transition:
            opacity 180ms ease,
            transform 180ms ease;
        `;

        document.body.appendChild(
          continueButton
        );

        requestAnimationFrame(
          () => {
            continueButton.style.opacity =
              '1';

            continueButton.style.transform =
              'translateX(-50%) translateY(-2px)';
          }
        );
      }

      /*
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
              '[Project Ice] Final-horn Postgame Summary renderer threw an error.',
              {
                postgameGameId,
                gameId,
                error,
              }
            );

            opened =
              Game.screen ===
              'postgame-summary';
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
    },
    250
  );
}

function scheduleNextLiveGamePlaybackTick() {
  clearLiveGamePlaybackTimer();

  if (
    liveGamePlaybackPaused ||
    !activeLiveGame ||
    activeLiveGame
      .gameComplete === true
  ) {
    return;
  }

  const isMaxSpeed =
    liveGamePlaybackSpeed ===
    'max';

  const gameSecondsThisTick =
    isMaxSpeed
      ? 20 * 60
      : Math.max(
          1,
          Number(
            liveGamePlaybackSpeed
          ) || 1
        ) * 60;

  const result =
    advanceLiveGamePresentationChunk(
      gameSecondsThisTick
    );

  if (
    !result ||
    result.success !== true
  ) {
    const consecutiveFailures =
      (Number(
        window.__projectIceLivePlaybackFailures
      ) || 0) + 1;

    window.__projectIceLivePlaybackFailures =
      consecutiveFailures;

    console.warn(
      '[Project Ice] Live playback chunk failed; attempting automatic recovery.',
      {
        consecutiveFailures,
        result,
      }
    );

    /*
     * A single presentation-step miss should not silently pause the game.
     * Retry a few times because the canonical engine can occasionally land
     * on a zero-time transition/stoppage boundary. Persistent failures still
     * pause safely instead of creating an endless retry loop.
     */
    if (consecutiveFailures <= 3) {
      clearLiveGamePlaybackTimer();

      liveGamePlaybackTimer =
        window.setTimeout(
          scheduleNextLiveGamePlaybackTick,
          180
        );

      return;
    }

    console.error(
      '[Project Ice] Live playback could not recover after repeated failures.',
      result
    );

    pauseLiveGamePlayback();

    return;
  }

  window.__projectIceLivePlaybackFailures = 0;

  if (result.decisionPending === true) {
    return;
  }

  /*
   * The game has reached its canonical ending.
   * Final result / postgame application comes in the next
   * roadmap step.
   */
  if (
    activeLiveGame
      ?.gameComplete === true
  ) {
    liveGamePlaybackPaused =
      true;

    clearLiveGamePlaybackTimer();

    const pauseButton =
      document.getElementById(
        'btn-live-game-pause'
      );

    if (pauseButton) {
      pauseButton.textContent =
        'Game Over';
    }

    handleLiveGameCompletion();

    return;
  }

  /*
   * Normal speeds deliberately pause for a full second so the
   * user has time to read the feed.
   *
   * MAX only yields briefly to the browser so the screen remains
   * responsive while racing toward the final horn.
   */
  const delay =
    isMaxSpeed
      ? 75
      : 1000;

  liveGamePlaybackTimer =
    window.setTimeout(
      scheduleNextLiveGamePlaybackTick,
      delay
    );
}

function startLiveGamePlayback(
  speed = 1
) {
  if (
    !activeLiveGame ||
    activeLiveGame
      .gameComplete === true
  ) {
    return;
  }

  liveGamePlaybackSpeed =
    speed === 'max'
      ? 'max'
      : Math.max(
          1,
          Number(speed) || 1
        );

  liveGamePlaybackPaused =
    false;

  window.__projectIceLivePlaybackFailures = 0;

  setLiveGameActiveSpeedButton(
    liveGamePlaybackSpeed
  );

  const pauseButton =
    document.getElementById(
      'btn-live-game-pause'
    );

  if (pauseButton) {
    pauseButton.textContent =
      'Pause';
  }

  /*
   * Changing speed should feel immediate.
   */
  scheduleNextLiveGamePlaybackTick();
}

document
.getElementById(
  'btn-pregame-play'
)
?.addEventListener(
  'click',
  () => {
    const gameId =
      pregameMatchupScreen
        ?.dataset
        ?.gameId ||
      null;

    if (!gameId) {
      console.error(
        '[Project Ice] Play Game is missing its scheduled game ID.'
      );

      return;
    }

    openLiveGame(
      gameId
    );
  }
);

/*
 * ============================================================
 * LIVE GAME SPEED CONTROLS
 * ============================================================
 */

document
  .querySelectorAll(
    '[data-live-game-speed]'
  )
  .forEach(button => {
    button.addEventListener(
      'click',
      () => {
        const speedValue =
          button.dataset
            .liveGameSpeed;

        const speed =
          speedValue === 'max'
            ? 'max'
            : Number(
                speedValue
              ) || 1;

        startLiveGamePlayback(
          speed
        );
      }
    );
  });

document
  .getElementById(
    'btn-live-game-pause'
  )
  ?.addEventListener(
    'click',
    () => {
      if (
        !activeLiveGame ||
        activeLiveGame
          .gameComplete === true
      ) {
        return;
      }

      if (
        liveGamePlaybackPaused
      ) {
        startLiveGamePlayback(
          liveGamePlaybackSpeed
        );
      } else {
        pauseLiveGamePlayback();
      }
    }
  );

/*
 * ============================================================
 * ROADMAP 6 — PREGAME SIM GAME
 * ============================================================
 *
 * The career game is already stopped on game day before any
 * hockey simulation occurs.
 *
 * Sim Game explicitly releases that game back to the canonical
 * Season Engine, resolves it, persists the result, and then uses
 * the existing postgame-summary pathway.
 */

async function simulatePregameMatchupGame(
  requestedGameId
) {
  const gameId =
    String(requestedGameId || '');

  const simButton =
    document.getElementById(
      'btn-pregame-sim'
    );

  if (!gameId) {
    console.error(
      '[Project Ice] Sim Game is missing its scheduled game ID.'
    );
    return false;
  }

  const schedule =
    Array.isArray(
      WorldEngine.state?.schedule
    )
      ? WorldEngine.state.schedule
      : [];

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
        String(alias) === gameId
      )
    ) || null;

  if (!scheduledGame) {
    console.error(
      '[Project Ice] Sim Game could not find the scheduled matchup.',
      { gameId }
    );
    return false;
  }

  if (simButton) {
    simButton.disabled = true;
    simButton.dataset.originalLabel =
      simButton.textContent || 'Sim Game';
    simButton.textContent = 'Simulating…';
  }

  try {
    /*
     * Do not re-enter the Season Engine's user-choice gate. Resolve the exact
     * scheduled game directly with the universal hockey engine, then hand its
     * completed result to the canonical date/application pipeline.
     */
    let completedResult =
      scheduledGame.gameResult &&
      (scheduledGame.played === true ||
       scheduledGame.completed === true)
        ? structuredClone(
            scheduledGame.gameResult
          )
        : null;

    if (!completedResult) {
      const resolution =
        WorldEngine
          .resolveLiveGameToFinalResult(
            scheduledGame
          );

      if (
        !resolution ||
        resolution.success !== true ||
        !resolution.gameResult
      ) {
        console.error(
          '[Project Ice] Sim Game universal resolver failed.',
          resolution
        );
        return false;
      }

      completedResult =
        resolution.gameResult;

      const gameDate =
        completedResult.date ||
        scheduledGame.date ||
        WorldEngine.state
          .season
          ?.currentDate ||
        Game.player.currentDate ||
        null;

      if (!gameDate) {
        console.error(
          '[Project Ice] Sim Game could not determine the game date.'
        );
        return false;
      }

      const application =
        WorldEngine.advanceToDate(
          gameDate,
          {
            processCurrentDate: true,
            resolvedGameResult:
              completedResult,
          }
        );

      if (
        !application ||
        application.success !== true
      ) {
        console.error(
          '[Project Ice] Sim Game canonical result application failed.',
          application
        );
        return false;
      }
    }

    const worldSaved =
      await WorldEngine.save();

    if (!worldSaved) {
      console.error(
        '[Project Ice] Sim Game result could not be persisted.'
      );
      return false;
    }

    if (
      typeof syncCareerPlayerWithWorld ===
        'function'
    ) {
      syncCareerPlayerWithWorld();
    }

    if (
      typeof refreshScheduleEvents ===
        'function'
    ) {
      refreshScheduleEvents();
    }

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
          String(alias) === gameId
        )
      ) || scheduledGame;

    const postgameId =
      completedGame?.gameId ||
      completedGame?.id ||
      completedGame?.eventId ||
      completedGame?.postgameSummary?.gameId ||
      completedResult?.gameId ||
      gameId;

    let opened = false;

    try {
      opened =
        openPostgameSummary(
          postgameId
        );
    } catch (error) {
      /*
       * openPostgameSummary navigates before optional rendering. If an
       * optional renderer throws after navigation, treat the handoff itself
       * as successful instead of bouncing back to the matchup screen.
       */
      console.error(
        '[Project Ice] Sim Game Postgame renderer threw.',
        error
      );

      opened =
        Game.screen ===
        'postgame-summary';
    }

    if (!opened) {
      console.error(
        '[Project Ice] Sim Game completed but Postgame Summary could not open.',
        {
          postgameId,
          completedGame,
        }
      );
      return false;
    }

    return true;
  } finally {
    if (
      simButton &&
      Game.screen !==
        'postgame-summary'
    ) {
      simButton.disabled = false;
      simButton.textContent =
        simButton.dataset.originalLabel ||
        'Sim Game';
    }
  }
}

/*
 * Bind when the matchup is actually opened as well as here at startup.
 * Assigning onclick (instead of stacking listeners) guarantees one handler.
 */
const bindPregameSimButton = () => {
  const button =
    document.getElementById(
      'btn-pregame-sim'
    );

  if (!button) {
    return;
  }

  button.onclick =
    () =>
      simulatePregameMatchupGame(
        pregameMatchupScreen
          ?.dataset
          ?.gameId ||
        null
      );
};

bindPregameSimButton();


// Begin Event — complete supported career events or route
// into an existing dedicated event screen.
document
  .getElementById('btn-ev-begin')
  .addEventListener('click', () => {
    const def =
      EventSystem.getCurrentDef();

    if (!def) {
      return;
    }

    /*
     * Games use the normal Season Engine simulation path.
     * Opening the event screen does not simulate anything;
     * the game begins only after the player presses Begin Event.
     */
    if (def.type === 'game') {
      const gameDate =
        def.date ||
        null;

      if (!gameDate) {
        console.error(
          '[Project Ice] Game event is missing its scheduled date.',
          def
        );

        return;
      }

      const currentDate =
        WorldEngine.state
          .season
          ?.currentDate ||
        null;

      /*
       * If this game is still in the future, preserve the existing
       * Season Engine advancement path.
       *
       * That path processes every intervening date and stops for
       * player-controlled practices, recovery, training, meetings,
       * etc. exactly as it did before the pregame screen existed.
       */
      if (
        currentDate &&
        String(currentDate) <
          String(gameDate)
      ) {
        simulateToDate(
          gameDate
        );

        return;
      }

      /*
       * We have actually reached game day.
       *
       * Do NOT call simulateToDate() again here because that would
       * allow the scheduled game itself to resolve before the player
       * gets the Play Game / Sim Game choice.
       */
      const openedPregame =
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
      /*
       * Route first. A non-critical refresh failure should never strand
       * the player on the completed-game screen with a dead Continue button.
       * openHubTab('schedule') already refreshes and renders Schedule.
       */
      openHubTab(
        'schedule'
      );

      try {
        refreshCareerUI();
      } catch (error) {
        console.warn(
          '[Project Ice] Postgame UI refresh failed after returning to Schedule.',
          error
        );
      }
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
      openHubTab(
        'schedule'
      );

      try {
        refreshCareerUI();
      } catch (error) {
        console.warn(
          '[Project Ice] Event-results UI refresh failed after returning to Schedule.',
          error
        );
      }
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
      if (icon)       icon.textContent       = config.evalIcon;
      if (title)      title.textContent      = config.evalName;
      if (speech)     speech.textContent     = config.coachSpeech;
      if (btnLabel)   btnLabel.textContent   = `Begin ${config.evalName} Evaluation`;
      if (evalHeader) evalHeader.textContent = `${config.evalIcon} ${config.evalName} Evaluation`;
      if (traitsEl) {
        traitsEl.innerHTML = config.traits
          .map(t => `<span class="ci-trait">${t}</span>`)
          .join('');
      }
    }

    function _renderDecision() {
      const dec   = config.decisions[_state.decisionIndex];
      const total = config.decisions.length;
      const idx   = _state.decisionIndex;

      const fill = _el('se-progress-fill');
      if (fill) fill.style.width = `${((idx + 1) / total) * 100}%`;
      const lbl = _el('se-progress-label');
      if (lbl)  lbl.textContent = `${idx + 1} / ${total}`;

      const sitEl = _el('se-situation-text');
      if (sitEl) sitEl.textContent = dec.prompt;

      const choicesEl = _el('se-choices');
      if (choicesEl) {
        choicesEl.innerHTML = dec.choices.map((c, ci) => `
          <button class="se-choice-btn" data-choice="${ci}">
            <div class="se-choice-btn__text-wrap">
              <span class="se-choice-btn__label">${c.label}</span>
              <span class="se-choice-btn__desc">${c.desc}</span>
            </div>
            <span class="se-choice-btn__arrow">\u203a</span>
          </button>
        `).join('');

        choicesEl.querySelectorAll('.se-choice-btn').forEach(btn => {
          btn.addEventListener('click', () => _onChoiceSelected(parseInt(btn.dataset.choice, 10)));
        });
      }

      const outcomeEl = _el('se-outcome');
      if (outcomeEl) outcomeEl.hidden = true;
    }

    function _onChoiceSelected(ci) {
      const dec    = config.decisions[_state.decisionIndex];
      const choice = dec.choices[ci];
      const score  = _roll(choice.range);

      _state.decisionScores.push(score);

      document.querySelectorAll('.se-choice-btn').forEach((btn, bi) => {
        btn.disabled = true;
        if (bi === ci) btn.classList.add('is-selected');
        else           btn.classList.add('is-dimmed');
      });

      const outcomeEl    = _el('se-outcome');
      const outcomeScore = _el('se-outcome-score');
      const outcomeText  = _el('se-outcome-text');
      if (outcomeEl)    outcomeEl.hidden = false;
      if (outcomeScore) outcomeScore.textContent = `+${score}`;
      if (outcomeText)  outcomeText.textContent  = choice.outcome;

      _state.decisionIndex++;
      const isLast = _state.decisionIndex >= config.decisions.length;
      setTimeout(() => {
        if (isLast) _finalize();
        else        _transitionNext();
      }, isLast ? 1500 : 1200);
    }

    function _transitionNext() {
      const content = _el('se-content');
      if (!content) { _renderDecision(); return; }
      content.classList.add('is-fading');
      setTimeout(() => {
        _renderDecision();
        content.classList.remove('is-fading');
      }, 260);
    }

    function _finalize() {
      const rawSum = _state.decisionScores.reduce((a, b) => a + b, 0);
      const score  = Math.min(100, rawSum);

      _state.totalScore = score;
      _state.grade      = _letterGrade(score);
      _state.feedback   = config.coachFeedback(score);
      _state.npcResults = _generateNpcs(score);

      // Permanently store this drill's result for the final tryout evaluation.
      if (!Game.player.tryoutResults) {
        Game.player.tryoutResults = {};
      }

      Game.player.tryoutResults[config.resultKey] = {
        score,
        grade: _state.grade,
        feedback: _state.feedback,
      };

      // Save after every drill so progress survives a reload.
      saveCareerPreview();

      _renderResults();
      showScreen('skating-results');
    }

    function _renderResults() {
      const { totalScore: score, grade, feedback, npcResults } = _state;

      // Update header badge with this drill's icon and name
      const badgeEl = _el('sr-header-badge');
      if (badgeEl) badgeEl.textContent = `${config.evalIcon} ${config.evalName} Evaluation`;

      // Score count-up animation
      const scoreEl = _el('sr-score-num');
      if (scoreEl) {
        scoreEl.textContent = '0';
        const dur = 1300;
        const t0  = performance.now();
        function tick(now) {
          const elapsed = Math.min((now - t0) / dur, 1);
          const ease    = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
          scoreEl.textContent = Math.round(ease * score);
          if (elapsed < 1) requestAnimationFrame(tick);
          else scoreEl.textContent = score;
        }
        requestAnimationFrame(tick);
      }

      const gradeEl = _el('sr-grade');
      if (gradeEl) {
        gradeEl.textContent = grade;
        gradeEl.className   = 'sr-grade';
        gradeEl.classList.add(`sr-grade--${grade[0].toLowerCase()}`);
      }

      const feedEl = _el('sr-feedback');
      if (feedEl) feedEl.textContent = feedback;

      const playerName = [Game.player.firstName, Game.player.lastName]
        .filter(Boolean).join(' ') || 'You';

      const allSkaters = [
        { name: playerName, score, isPlayer: true },
        ...npcResults,
      ].sort((a, b) => b.score - a.score);

      const boardEl = _el('sr-leaderboard');
      if (boardEl) {
        boardEl.innerHTML = allSkaters.map((s, i) => `
          <div class="sr-board-row${s.isPlayer ? ' sr-board-row--player' : ''}">
            <span class="sr-board-rank">${i + 1}</span>
            <div class="sr-board-name-wrap">
              <span class="sr-board-name">${s.name}</span>
              ${s.isPlayer ? '<span class="sr-board-you-tag">YOU</span>' : ''}
            </div>
            <span class="sr-board-score">${s.score}</span>
          </div>
        `).join('');
      }

      // Register this drill's completion route for btn-sr-continue
      _drillContinueCallback = config.onComplete;
    }

    // open(): register this drill as active, populate coach-intro, and navigate to it.
    // Setting _activeDrill here ensures btn-begin-skating calls *this* drill's beginDrill,
    // not whichever drill happened to be defined last.
    function open() {
      _activeDrill = { beginDrill };
      _populateCoachIntro();
      showScreen('coach-intro');
    }

    // beginDrill(): called from the "Begin … Evaluation" button on coach-intro
    function beginDrill() {
      _resetState();
      _renderDecision();
      showScreen('skating-eval');
    }

    return { open, beginDrill };
  }

  return create;
})();

// ── Skating Evaluation (Drill 1 of 3) ────────────────────────────

  const SkatingDrill = DrillEngine({
    resultKey:   'skating',
    evalNumber:  1,
  evalTotal:   3,
  evalName:    'Skating',
  evalIcon:    '⛸️',
  coachSpeech: '"Today we\'re evaluating your skating ability. Speed, acceleration, and agility all matter. Give us your best effort."',
  traits: ['⚡ Speed', '💨 Acceleration', '🔄 Agility'],
  decisions: [
    {
      prompt: 'Coach blows the whistle. Skaters line up at the blue line. The first sprint is about to begin. How do you approach it?',
      choices: [
        { label: 'Explode off the line',       desc: 'Max acceleration from the first stride.',    range: [26, 34], outcome: 'You rocket off the line. Clean first stride, full extension. The coaches clock your burst.' },
        { label: 'Build your speed gradually', desc: 'Controlled start — find your stride early.', range: [22, 28], outcome: 'Smooth build. Your stride lengthens through mid-ice. Consistent and efficient.' },
        { label: 'Watch the pack first',       desc: 'Read how the other skaters set up.',         range: [13, 21], outcome: 'A half-beat of hesitation. You find your stride late. Coach Reynolds makes a note.' },
      ],
    },
    {
      prompt: 'You hit the first hard corner at full speed. A tight turn — every edge counts here.',
      choices: [
        { label: 'Drive the inside edge hard', desc: 'Aggressive carve — carry all your speed through the turn.', range: [25, 33], outcome: 'Sharp carve through the arc. You hold your speed. Heads turn on the bench.' },
        { label: 'Balanced edge, clean cut',   desc: 'Technique over aggression — efficient and controlled.',     range: [22, 28], outcome: 'Textbook turn. Clean edges, controlled speed. The coaches see solid fundamentals.' },
        { label: 'Wide arc to carry momentum', desc: 'Give yourself room to stay fast through the corner.',       range: [17, 25], outcome: 'You carry decent speed but the arc is loose. Not as tight as the coaches want.' },
      ],
    },
    {
      prompt: 'Final straight. Twenty feet to the finish cone. The coaching staff is watching your compete level.',
      choices: [
        { label: 'Dig deep — leave nothing behind', desc: 'Max effort all the way through the line.',  range: [26, 34], outcome: "Full gas to the line. Legs burning. You don't ease up an inch. Compete noted." },
        { label: 'Hold your stride',                desc: 'Efficient and controlled — finish strong.', range: [22, 28], outcome: 'Steady to the line. Efficient, repeatable. You look like you have more in the tank.' },
        { label: 'Ease into the finish',            desc: 'Save energy for the next drill.',           range: [11, 19], outcome: 'You coast the last few strides. Coach Reynolds stops writing.' },
      ],
    },
  ],
  coachFeedback(score) {
    if (score >= 90) return 'Outstanding skating. Your acceleration and edge work stood out from the group. Coach Reynolds circled your name.';
    if (score >= 80) return 'Good evaluation. Above-average speed with solid technique through the corners. You belong on this ice.';
    if (score >= 70) return 'Decent showing. A few breakdowns in the turns, but your compete level came through.';
    if (score >= 60) return 'Average result. Work on your edge transitions — the raw speed is there, but technique needs to catch up.';
    return 'Tough eval today. Skating is the foundation of everything at this level. Keep putting in the reps.';
  },
  onComplete: () => PuckControlDrill.open(),
});

// ── Puck Control Evaluation (Drill 2 of 3) ───────────────────────

  const PuckControlDrill = DrillEngine({
    resultKey:   'puckControl',
    evalNumber:  2,
  evalTotal:   3,
  evalName:    'Puck Control',
  evalIcon:    '🏒',
  coachSpeech: '"This evaluation is about your hands. We want to see your stickhandling under pressure, your passing accuracy, and how well you protect the puck in tight space."',
  traits: ['🏒 Stickhandling', '🎯 Passing', '💪 Puck Protection'],
  decisions: [
    {
      prompt: 'Coach sets up a tight stickhandling course through four cones at mid-ice. How do you attack it?',
      choices: [
        { label: 'Attack the course, full speed',     desc: 'Stickhandle through the cones as fast as possible.', range: [25, 34], outcome: 'Hands are fast and tight. You navigate the cones clean. Scouts watching make a note.' },
        { label: 'Controlled speed, precise hands',   desc: 'Take your time — clean hands over speed.',            range: [22, 28], outcome: 'Efficient. Your hands work in rhythm. No mistakes. Coach nods.' },
        { label: 'Stay on the outside of the cones', desc: 'Play it safe, stay wide.',                             range: [13, 21], outcome: 'You avoid the challenge. The course is wide open. Coach writes something down.' },
      ],
    },
    {
      prompt: 'A coach stands at the far blue line. You have three seconds to make a decision — pass or carry.',
      choices: [
        { label: 'Lead pass — thread the needle',    desc: 'Fire a crisp pass to the exact spot.',  range: [24, 33], outcome: 'Perfect lead pass. Tape to tape. The coach catches it without breaking stride.' },
        { label: 'Safe chip pass — flat and direct', desc: 'Straightforward pass, easy to handle.', range: [21, 27], outcome: 'Solid, clean pass. Safe and accurate. Gets the job done.' },
        { label: 'Carry it yourself',                desc: 'Decide to keep the puck and skate.',    range: [15, 23], outcome: 'You keep it, but a pass was clearly open. Coach marks your decision-making.' },
      ],
    },
    {
      prompt: 'A defensive player applies pressure from behind. You\'re battling for puck control along the boards.',
      choices: [
        { label: 'Shield the puck with your body',    desc: 'Use your frame to protect possession.',      range: [25, 33], outcome: 'Strong puck protection. You win the battle, keep possession, and make a clean exit.' },
        { label: 'Quick spin move to create space',   desc: 'Beat the pressure with footwork and hands.', range: [23, 32], outcome: 'Nice spin. You create space and exit cleanly. Coaches react with interest.' },
        { label: 'Try to skate through the pressure', desc: 'Test your speed against the defender.',      range: [14, 24], outcome: 'You fight but lose the battle. Possession gone. Tough spot.' },
      ],
    },
  ],
  coachFeedback(score) {
    if (score >= 90) return "Elite hands. Your stickhandling and puck protection under pressure were the best we've seen today. You belong in this league.";
    if (score >= 80) return 'Good puck control. Accurate passing, solid hands through traffic. You showed you can handle the puck at this level.';
    if (score >= 70) return 'Decent showing with the puck. Some good moments, but the tight-space stickhandling needs more work.';
    if (score >= 60) return 'Average result. Puck control separates players at this level — keep working your hands every day.';
    return 'Struggled to control the puck today. Touch and feel come with repetition — get your stickhandling reps in.';
  },
  onComplete: () => ScrimmageDrill.open(),
});
// ── Scrimmage Evaluation (Drill 3 of 3) ─────────────────────────

  const ScrimmageDrill = DrillEngine({
    resultKey: 'scrimmage',
    evalNumber: 3,
  evalTotal: 3,
  evalName: 'Scrimmage',
  evalIcon: '🥅',
  coachSpeech:
    '"The final evaluation is a live scrimmage. We want to see how you read the game, support your teammates, and compete when the play breaks down."',

  traits: [
    '🧠 Hockey IQ',
    '👁️ Offensive Awareness',
    '🛡️ Defensive Awareness',
  ],

  decisions: [
    {
      prompt:
        'Your line enters the offensive zone on a three-on-two rush. The puck carrier draws the first defender toward him. What do you do?',
      choices: [
        {
          label: 'Drive the far post',
          desc: 'Create a passing lane and force the second defender back.',
          range: [25, 34],
          outcome:
            'You time the drive perfectly. The defender collapses toward you, opening space for your teammate in the slot.',
        },
        {
          label: 'Trail the play high',
          desc: 'Stay available for a late pass and protect against a turnover.',
          range: [22, 29],
          outcome:
            'You remain available above the puck and give your line a safe option. Smart, responsible positioning.',
        },
        {
          label: 'Call for the puck immediately',
          desc: 'Demand possession and try to create the play yourself.',
          range: [14, 23],
          outcome:
            'You call for it, but the passing lane is covered. The rush loses momentum and the defense resets.',
        },
      ],
    },

    {
      prompt:
        'The puck turns over at the offensive blue line. An opponent accelerates the other way while one of your teammates is caught deep.',
      choices: [
        {
          label: 'Backcheck through the middle',
          desc: 'Take away the most dangerous lane and support your defense.',
          range: [26, 34],
          outcome:
            'You sprint through the middle and eliminate the passing option. The rush is forced harmlessly toward the boards.',
        },
        {
          label: 'Pressure the puck carrier',
          desc: 'Attack quickly and try to stop the rush before it develops.',
          range: [21, 30],
          outcome:
            'You close the gap aggressively. The puck carrier is rushed, although the middle lane briefly opens behind you.',
        },
        {
          label: 'Wait near the blue line',
          desc: 'Stay available for offense if your team wins the puck back.',
          range: [10, 19],
          outcome:
            'You remain high while the opponent creates an odd-man rush. Coach Reynolds immediately notices the missed backcheck.',
        },
      ],
    },

    {
      prompt:
        'Late in the scrimmage, the score is tied. You collect a loose puck below the faceoff circle with a teammate open near the net.',
      choices: [
        {
          label: 'Pass into the slot',
          desc: 'Make the high-percentage play to the open teammate.',
          range: [25, 34],
          outcome:
            'You find the open stick in the slot. The quick chance forces a difficult save and keeps the pressure alive.',
        },
        {
          label: 'Attack the net yourself',
          desc: 'Protect the puck and challenge the goalie from close range.',
          range: [22, 31],
          outcome:
            'You drive hard to the crease and create a dangerous chance. The coaches like the confidence and compete level.',
        },
        {
          label: 'Send the puck around the boards',
          desc: 'Keep possession and avoid making a risky play.',
          range: [16, 24],
          outcome:
            'Your line keeps possession, but an excellent scoring opportunity disappears. Safe, but not decisive.',
        },
      ],
    },
  ],

  coachFeedback(score) {
    if (score >= 90) {
      return 'Outstanding scrimmage. You anticipated plays before they developed and consistently made your linemates better. Coach Reynolds was impressed.';
    }

    if (score >= 80) {
      return 'Strong performance. You supported the puck well, competed defensively, and made smart decisions under pressure.';
    }

    if (score >= 70) {
      return 'Solid showing. You had several good reads, though your positioning became inconsistent when the play changed direction.';
    }

    if (score >= 60) {
      return 'Average scrimmage. You showed flashes, but the coaches want quicker decisions and more consistent defensive effort.';
    }

    return 'Tough scrimmage. Slow reads and missed assignments hurt your evaluation. Keep learning how to impact the play without the puck.';
  },

    onComplete: () => showScreen('coach-results'),
});

document.getElementById('btn-back-tryout-summary').addEventListener('click', () => {
  if (_tryoutSummaryContext === 'first-time') {
    showScreen(EventSystem.getOrigin()); // 'arena' — so they can re-read the event
  } else {
    showScreen('hub');
  }
});
document.getElementById('btn-view-roster').addEventListener('click', () => {
  openTryoutSummary('first-time');
});
document.getElementById('btn-back-coach-results').addEventListener('click', () => {
  showScreen('skating-results');
});
function calculateTryoutPlacement() {
  const score = Number(Game.player.overallTryoutScore) || 0;
  const teams = WorldEngine.state.teams || [];

  // Assign one random high school once and preserve it permanently.
  let assignedTeam = teams.find(team => team.teamId === Game.player.teamId);

  if (!assignedTeam && teams.length > 0) {
    assignedTeam = teams[Math.floor(Math.random() * teams.length)];

    Game.player.teamId = assignedTeam.teamId;
    Game.player.schoolName = assignedTeam.schoolName;
    Game.player.teamName = assignedTeam.teamName;
  }

  // Varsity is intentionally difficult for a freshman to reach.
  let level = 'Junior Varsity';

  if (score >= 95) {
    level = Math.random() < 0.75 ? 'Varsity' : 'Junior Varsity';
  } else if (score >= 90) {
    level = Math.random() < 0.25 ? 'Varsity' : 'Junior Varsity';
  }

  let startingLine;

  if (level === 'Varsity') {
    if (score >= 97) startingLine = '1st Line';
    else if (score >= 93) startingLine = '2nd Line';
    else startingLine = '3rd Line';
  } else {
    if (score >= 92) startingLine = '1st Line';
    else if (score >= 84) startingLine = '2nd Line';
    else if (score >= 72) startingLine = '3rd Line';
    else startingLine = '4th Line';
  }

  const coachTrust = Math.max(
    35,
    Math.min(50, 35 + Math.round((score - 60) * 0.4))
  );

  const reputationStars = score >= 93 ? 2 : 1;

  Game.player.teamLevel = level;
  Game.player.startingLine = startingLine;
  Game.player.coachTrust = coachTrust;
  Game.player.reputationStars = reputationStars;

  saveCareerPreview();

  return {
    assignedTeam,
    level,
    startingLine,
    coachTrust,
    reputationStars,
  };
}
// Enter Career Hub — only visible on first completion.
// Marks stage='hub' so future save loads skip the intro sequence.
document.getElementById('btn-ts-enter-hub').addEventListener('click', () => {
  const placement = calculateTryoutPlacement();
  const team = placement.assignedTeam;

  const fullTeamName = team
    ? `${team.schoolName} ${team.teamName}`
    : 'High School Team';

  const position = Game.player.position || 'Player';
  const stars =
    '★'.repeat(placement.reputationStars) +
    '☆'.repeat(5 - placement.reputationStars);

  document.getElementById('rr-team-name').textContent = fullTeamName;
  document.getElementById('rr-team-level').textContent = placement.level;
  document.getElementById('rr-position').textContent = position;
  document.getElementById('rr-line').textContent = placement.startingLine;
  document.getElementById('rr-trust').textContent = `${placement.coachTrust}%`;
  document.getElementById('rr-reputation').textContent = stars;

  showScreen('roster-reveal');
});
document
.getElementById('btn-begin-season')
.addEventListener('click', async () => {
  const canonicalPlayer =
    WorldEngine.finalizeFreshCareerAfterTryouts({
      ...Game.player,

      playerId:
        Game.player.playerId ||
        Game.player.id ||
        'career-player',
    });

  if (!canonicalPlayer) {
    console.error(
      '[Project Ice] Career player could not be added to the World Engine roster.'
    );

    return;
  }

  /*
   * Keep the player save synchronized with the canonical
   * World Engine record created from the tryout results.
   */
  Game.player = {
    ...Game.player,

    playerId:
      canonicalPlayer.playerId,

    id:
      canonicalPlayer.id,

    position:
      canonicalPlayer.position,

    attributes: {
      ...canonicalPlayer.attributes,
    },

    overall:
      canonicalPlayer.overall,

    startingOverall:
      canonicalPlayer.startingOverall,

    tryoutProfile:
      canonicalPlayer.tryoutProfile,

    rosterSlot:
      canonicalPlayer.rosterSlot,

    lineupAssignment:
      canonicalPlayer.lineupAssignment,

    lineupStatus:
      canonicalPlayer.lineupStatus,

    coachTrust:
      canonicalPlayer.coachTrust,

    recentForm:
      canonicalPlayer.recentForm,

    morale:
      canonicalPlayer.morale,

    reputationStars:
      canonicalPlayer.reputationStars,

    reputationPoints:
      canonicalPlayer.reputationPoints,

    stage: 'hub',
    tryoutsComplete: true,
    currentDate: '2026-09-02',
  };

  /* The career becomes an official selectable save only now: tryouts are complete and Career Hub is unlocked. */
  if (typeof WorldEngine.commitActiveCareerSave === 'function') {
    const committed = await WorldEngine.commitActiveCareerSave();
    if (!committed) {
      console.error('[Project Ice] Career could not be durably committed after tryouts.');
      return;
    }
  }

  saveCareerPreview();
  showScreen('hub');
});

// ── Coach Intro navigation ────────────────────────────────────────
document.getElementById('btn-back-coach-intro').addEventListener('click', () => {
  // Return to the event screen so the player can re-read the tryout brief
  showScreen('event');
});

document.getElementById('btn-begin-skating').addEventListener('click', () => {
  // Delegate to whichever drill called open() — never hardcode a specific instance.
  if (_activeDrill) _activeDrill.beginDrill();
});

// ── Skating Results navigation ────────────────────────────────────
document.getElementById('btn-sr-continue').addEventListener('click', () => {
  // Routes to the next drill or the tryout summary, depending on which drill just finished.
  if (_drillContinueCallback) _drillContinueCallback();
});
document
  .getElementById('schedule-prev-month')
  ?.addEventListener('click', () => {
    scheduleViewMonth--;

    if (scheduleViewMonth < 0) {
      scheduleViewMonth = 11;
      scheduleViewYear--;
    }

    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );
  });

document
  .getElementById('schedule-next-month')
  ?.addEventListener('click', () => {
    scheduleViewMonth++;

    if (scheduleViewMonth > 11) {
      scheduleViewMonth = 0;
      scheduleViewYear++;
    }

    renderScheduleCalendar(
      scheduleViewYear,
      scheduleViewMonth
    );
  });
document
.querySelectorAll('.hub-nav__tab')
.forEach(tab => {
  tab.addEventListener('click', () => {
    const id = tab.dataset.hubTab;

    if (id === 'team') {
      openTeamTab(null, 'hub');
      return;
    }

    openHubTab(id);
  });
});

// ── Player profile accordion ─────────────────────────────────
document.querySelectorAll('.pp-attr-cat__header').forEach(header => {
  header.addEventListener('click', () => {
    const cat = header.closest('.pp-attr-cat');
    cat.classList.toggle('pp-attr-cat--open');
  });
});
document
.getElementById('btn-league-full-stats')
?.addEventListener('click', () => {
  Game.fullStatsOrigin = 'league';
  Game.fullStatsTeamId = null;
  Game.fullStatsSelectedTeamId = null;

  showScreen('full-stats');
});
document
.getElementById('btn-league-full-prospects')
?.addEventListener('click', () => {
  Game.prospectScreenOrigin = 'league';
  showScreen('prospects');
});
document
  .getElementById('team-view-full-stats')
  ?.addEventListener('click', () => {
    Game.fullStatsOrigin = 'team';

    Game.fullStatsTeamId =
      Game.player.teamId ||
      Game.player.highSchoolTeamId ||
      null;
    Game.fullStatsSelectedTeamId =
      Game.fullStatsTeamId;

    showScreen('full-stats');
  });

document
  .getElementById('btn-back-full-stats')
  ?.addEventListener('click', () => {
    if (Game.fullStatsOrigin === 'team-profile') {
      showScreen('team-profile');
      return;
    }
    if (Game.fullStatsOrigin === 'team') {
      openHubTab('team');
      return;
    }

    if (Game.fullStatsOrigin === 'league') {
      openHubTab('league');
      return;
    }

    openHubTab('home');
  });
document
.getElementById('full-stats-team-filter')
?.addEventListener('change', event => {
  Game.fullStatsSelectedTeamId =
    event.target.value;

  renderFullStatsScreen();
});
document
.querySelectorAll('.full-stats-type-toggle__button')
.forEach(button => {
  button.addEventListener('click', () => {
    Game.fullStatsView =
      button.dataset.statsType || 'skaters';

    document
      .querySelectorAll('.full-stats-type-toggle__button')
      .forEach(toggleButton => {
        toggleButton.classList.toggle(
          'full-stats-type-toggle__button--active',
          toggleButton === button
        );
      });

    renderFullStatsScreen();
  });
});
// ── Cinematic intro sequence ────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIntroSequence() {
  const overlay = document.getElementById('cinematic-overlay');
  const text    = document.getElementById('cinematic-text');

  // Step 1 — fade to black over 1 s
  overlay.classList.add('is-active');
  await sleep(1100);

  async function showCard(html) {
    text.innerHTML = html;
    text.style.opacity = '1';
    await sleep(2200);
    text.style.opacity = '0';
    await sleep(580);
    text.innerHTML = '';
  }

  // Step 2 — date
  await showCard('September 3, 2022');

  // Step 3 — age / year
  await showCard('Age 14<br>Freshman Year');

  // Step 4 — story beat
  await showCard('Tomorrow is freshman hockey tryouts.');

  // Step 5 — reveal bedroom, fade overlay out
  showScreen('bedroom');
  overlay.classList.remove('is-active');
  await sleep(1100);
}

btnDeleteSave.addEventListener('click', () => {
  deleteCareerPreview();
});

playerForm.addEventListener('submit', handlePlayerFormSubmit);
if (playerWeightInput && playerWeightValue) {
  const updateWeightDisplay = () => {
    playerWeightValue.textContent =
      `${playerWeightInput.value} lbs`;
  };

  playerWeightInput.addEventListener(
    'input',
    updateWeightDisplay
  );

  updateWeightDisplay();
}

document.querySelectorAll('.choice-card').forEach((button) => {
  button.addEventListener('click', () => {
    handleChoiceButton(button);
  });
});
document.addEventListener('click', event => {
  const button = event.target.closest('.tp-player-link');
  if (!button) return;

  const playerId = button.dataset.playerId;

  let player = null;
  if (playerId === 'career-player') {
    const assignedTeam = (WorldEngine.state.teams || [])
      .find(team => team.teamId === Game.player.teamId);

    player = {
      ...Game.player,
      id: 'career-player',
      firstName: Game.player.firstName || '',
      lastName: Game.player.lastName || '',
      position: Game.player.position || 'C',
      overall: Number(Game.player.overall) || 60,
      age: Number(Game.player.age) || 14,
      year: Game.player.year || 'Freshman',
      teamId: Game.player.teamId || '',
      teamName: assignedTeam?.teamName || '',
      schoolName: assignedTeam?.schoolName || '',
      attributes: Game.player.attributes || {},
      reputationStars: Number(Game.player.reputationStars) || 1,
      potential: Number(Game.player.potential) || 78,
    };
  } else {

  for (const team of WorldEngine.state.teams || []) {
    const foundPlayer = (team.roster || []).find(
      p => String(p.id) === String(playerId)
    );

    if (foundPlayer) {
      player = {
        ...foundPlayer,
        teamId: team.teamId,
      };
      break;
    }
  }
}
  if (!player) return;

  _activePlayerProfile = player;
  _playerProfileOrigin = 'team-profile';
  renderPlayerProfile();
  showScreen('player-profile');
});

function recoverCareerPreviewFromWorld() {
  /*
   * If the small player preview still exists, nothing to recover.
   */
  if (
    localStorage.getItem(
      SAVE_KEY
    )
  ) {
    return true;
  }

  /*
   * The canonical World Engine roster is the source of truth.
   * Find the career player that survived in IndexedDB.
   */
  let careerPlayer =
    WorldEngine.getPlayerById(
      'career-player'
    ) ||
    null;

  if (!careerPlayer) {
    for (
      const team of
      WorldEngine.state.teams ||
      []
    ) {
      const found =
        (
          team.roster ||
          []
        ).find(
          player =>
            player?.isCareerPlayer ===
            true
        );

      if (found) {
        careerPlayer = {
          ...found,
          teamId:
            found.teamId ||
            team.teamId,
          schoolName:
            found.schoolName ||
            team.schoolName,
          teamName:
            found.teamName ||
            team.teamName,
        };

        break;
      }
    }
  }

  if (!careerPlayer) {
    const rosterCareerPlayers = [];

    for (
      const team of
      WorldEngine.state.teams ||
      []
    ) {
      for (
        const player of
        team.roster ||
        []
      ) {
        if (
          player?.isCareerPlayer === true ||
          String(
            player?.id ||
            player?.playerId ||
            ''
          ) === 'career-player'
        ) {
          rosterCareerPlayers.push({
            id:
              player?.id ||
              player?.playerId ||
              'missing',

            name:
              `${player?.firstName || ''} ${player?.lastName || ''}`.trim(),

            teamId:
              team.teamId,
          });
        }
      }
    }

    alert(
      [
        'CAREER RECOVERY DIAGNOSTIC',
        '',
        `World player id: ${
          WorldEngine.state
            ?.player
            ?.id ||
          'missing'
        }`,
        `World player playerId: ${
          WorldEngine.state
            ?.player
            ?.playerId ||
          'missing'
        }`,
        '',
        `Teams: ${
          (
            WorldEngine.state.teams ||
            []
          ).length
        }`,
        `Career players found in rosters: ${
          rosterCareerPlayers.length
        }`,
        '',
        rosterCareerPlayers.length
          ? JSON.stringify(
              rosterCareerPlayers,
              null,
              2
            )
          : 'No canonical career player found.',
      ].join('\n')
    );

    return false;
  }

  /*
   * Reconstruct Game.player from the canonical player.
   * upsertCareerPlayer originally received the full Game.player,
   * so these identity/career fields should already be preserved.
   */
  Game.player = {
    ...Game.player,
    ...careerPlayer,

    playerId:
      careerPlayer.playerId ||
      careerPlayer.id ||
      'career-player',

    id:
      careerPlayer.id ||
      careerPlayer.playerId ||
      'career-player',

    teamId:
      careerPlayer.teamId ||
      null,

    stage:
      'hub',

    tryoutsComplete:
      true,

    currentDate:
      WorldEngine.state
        .season
        ?.currentDate ||
      careerPlayer.currentDate ||
      Game.player.currentDate,
  };

  /*
   * Recreate only the small Continue Career record.
   * The actual universe remains in IndexedDB.
   */
  /*
   * Try to rebuild the lightweight preview cache, but the
   * canonical world no longer depends on that write succeeding.
   */
  saveCareerPreview();

  return true;
}

// ── App initialization ──────────────────────────────────────
async function init() {
  await WorldEngine.load();

  WorldEngine.ensureGeneratedRosters();

  /*
   * Careers created before the IndexedDB migration may have lost
   * their small localStorage preview when the old giant world hit
   * the storage quota. Recover it from the canonical world.
   */
  recoverCareerPreviewFromWorld();

  updateContinueButton();
  updateDevShortcut();

  showScreen('title');
}

document.addEventListener('DOMContentLoaded', init);