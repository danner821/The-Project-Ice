# Project Ice — Core Regression Checklist

Updated: 2026-08-14

Use this checklist after persistence, game-flow, calendar, simulation-engine or season-state changes. It is intentionally short enough to run often.

## A. Boot and Continue Career

- Project Ice loads without a runtime error popup.
- Continue Career is enabled when a valid career exists.
- Continue Career opens the existing Career Hub.
- Career player identity, team, overall and current date are correct.
- Closing/reloading Project Ice and using Continue Career returns to the same canonical state.

## B. Play Game path

- Advance to a career game day.
- Open the pregame matchup.
- Choose Play Game.
- Live game opens and progresses.
- Speed controls work.
- Pause/resume works.
- Scoreboard/manpower state updates.
- Event feed updates and remains scrollable.
- Rink event markers remain clickable and highlight the matching feed event.
- Career-player tracker updates during the game.
- Final horn occurs without a runtime error.
- Continue button appears after the game.
- Continue opens Postgame Summary.
- Final score and scoring summary are present/correct.
- Return to hub/calendar and confirm the game is completed.
- Reload Project Ice, Continue Career, and confirm the same game remains completed.
- Confirm current date did not rewind.
- Confirm standings/player stats did not duplicate on reload.

## C. Sim Game path

- Advance to a different career game day.
- Open the pregame matchup.
- Choose Sim Game.
- Game resolves through the canonical simulation engine.
- Postgame/result data is available.
- Calendar marks the game completed.
- Reload Project Ice, Continue Career, and confirm the game remains completed.
- Confirm current date did not rewind.
- Confirm standings/player stats did not duplicate on reload.

## D. Non-game progression

- Complete one supported Practice or Training event.
- Confirm expected player development/reward is applied once.
- Reload and confirm it remains applied once.
- Advance across at least one normal non-game date and confirm schedule/current-date state persists.

## E. Data integrity spot checks

- Career player appears once in canonical roster/stat views.
- Career team lineup still reflects contextual career-player placement.
- AI lineup ordering remains ability-based.
- Team standings totals align with completed results.
- Full Stats and player/team profile stats agree on a spot-checked player.
- No completed scheduled event has silently returned to pending.

## Phase 0 exit test

Phase 0 can be closed when Sections A-C pass after the canonical final-horn async repair and removal of `game-loader.js`. Sections D-E are required before beginning multi-season work and should also be spot-checked whenever relevant systems change.
