# Project Ice — Updated Roadmap

Updated: 2026-08-14

This roadmap supersedes earlier ordering unless a later architectural finding requires a change. Any order change should be explained before implementation.

## Phase 0 — Stability Hardening and Cleanup
Status: NEXT

Goal: lock the current foundation before adding more interconnected systems.

- Directly repair the final-horn async bug in canonical `game.js` and retire `game-loader.js` after regression testing.
- Verify Continue Career, IndexedDB save/load, Play Game completion, Sim Game completion, reload-after-game, postgame summary, schedule persistence and date persistence.
- Keep `career-persistence.js` only as the migration bridge.
- Remove zero-risk troubleshooting residue.
- Establish an explicit save-schema version/migration convention before multi-season work.
- Do not delete dormant Replit/React scaffolding until the runtime/build has been proven independent of it.

Exit criteria: the current career can be played, simulated, closed, reloaded and continued without diagnostics or temporary runtime errors.

## Phase 1 — Weekly Living World

Goal: make the hockey world visibly change around the career player every week.

- Process all AI games through the universal simulation engine.
- Generate a weekly world recap from canonical changes rather than random flavor text.
- Surface standings movers, hot/cold teams, statistical leaders and notable performances.
- Track player form/context changes that can later feed Scouting and News.
- Create a reusable world-event/history record so downstream systems consume the same events.
- Preserve the rule that the user controls only the career player; coaching/roster/team decisions happen around the player.

Exit criteria: advancing one week produces a coherent set of world changes that remain correct after reload.

## Phase 2 — Scouting and Prospect World

Goal: connect career performance to an evolving prospect ecosystem.

- Scouts in attendance become functional context, not just presentation.
- Prospect Watch / Rival Watch.
- Watchlist and evolving scouting evaluations.
- Real/generated prospect pool integrated with world state.
- Player-facing potential remains visible, while certainty/evaluation can evolve.
- Scouting reacts to performance, competition level, role, development and important games.

Exit criteria: scouting information changes for understandable reasons and persists across weeks/seasons.

## Phase 3 — News and Home Hub Refresh

Goal: turn world events into a clean career narrative.

- Dynamic League News generated from living-world events.
- Home hub prioritizes what matters to the career player this week.
- Rival/prospect stories, streaks, standings races, milestones and scout attention.
- Avoid duplicate news by using persistent event IDs/history.
- Keep the existing compact visual language rather than redesigning the whole app again.

Exit criteria: Home feels like a living career dashboard rather than a static menu.

## Phase 4 — Season Transition, Awards and History

Goal: make Year 1 safely become Year 2 and establish true multi-season careers.

- End-of-season standings/results freeze.
- Postseason handling appropriate to the current level.
- Awards/championship/milestone history.
- Per-season player/team statistics archived.
- Age/year advancement.
- New schedule generation without destroying historical results.
- Development/offseason progression using the existing development engine.
- Save-schema migration finalized for multi-season state.

Exit criteria: complete a season, reload, begin the next season and retain all prior history/statistics.

## Phase 5 — Post-High-School Career Pathways

Goal: expand the world beyond high school while keeping the same career-mode philosophy.

- Travel/junior/college/pro opportunity structure as designed.
- Tryout/offers/commitment transitions controlled by world systems and player career choices where appropriate.
- Level-specific rosters, schedules, statistics and scouting.
- Career timeline records every transition.

Exit criteria: the player can leave high school and continue seamlessly into the next career level.

## Phase 6 — Draft and NHL Career Ecosystem

Goal: deliver the long-form destination of Project Ice.

- Draft eligibility and draft event.
- NHL organization assignment and roster ecosystem.
- NHL/AHL-level deployment and career progression.
- Contracts/career milestones/awards/history where appropriate to a player career mode.
- Real historical/current-world alignment only where intentionally designed.
- Continue to avoid GM control: drafting, trades, coaching and roster construction happen around the player.

Exit criteria: a career can progress from age 14 into a persistent professional career.

## Phase 7 — Release Cleanup and Calibration

Goal: turn the working pre-alpha into a stable, maintainable game build.

- Remove dev shortcut and diagnostics.
- Remove migration bridges that are no longer required.
- Remove dormant scaffolding only after build verification.
- Break up monolithic files where doing so reduces real maintenance risk.
- Full simulation calibration: scoring, shots, penalties, special teams, goalie performance, ice time, development pace and regression.
- Regression pass across New Career, Continue Career, every hub tab, game flow, season transition and long-term saves.

## Locked Design Principles

- Project Ice is a player career mode, not a GM mode.
- Overall is calculated from attributes and is never directly upgraded.
- Archetype is primarily a player-facing label; actual development comes from the saved development profile/personality/potential/context.
- Potential stays player-facing.
- No fatigue mechanic.
- Career-player lineup role is contextual; AI/NPC lineup ordering is primarily ability-based.
- Practice/recovery are quick career events, not separate playable mini-games.
- Play Game, Sim Game and background games should share one canonical hockey simulation engine.
- New systems should read/write canonical world state and persist through IndexedDB.
- Prefer small focused commits and immediate testing over large rewrites.
