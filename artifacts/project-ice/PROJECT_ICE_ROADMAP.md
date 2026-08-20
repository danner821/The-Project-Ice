# Project Ice — Authoritative Roadmap

Updated: 2026-08-20
Authoritative planning checkpoint: 2026-08-20 Phase 3.2 kickoff

This file is the planning source of truth. Do not silently fall back to older roadmap files or prior phase ordering.

## Current checkpoint

Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE / CHECKPOINT PASSED

Phase 2 — Home / Career Hub Refresh
Status: COMPLETE / LIVE VALIDATION PASSED

Phase 3 — Season Lifecycle
Status: ACTIVE

Current mini-phase:
- Phase 3.2 — Playoff Presentation + Statistics

---

# Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE

The persistent 2027–2030 real-prospect world, HS integration rules, canonical rankings, scouting foundation, prospect profile paths and award-race preseason behavior are complete and live-validated.

Key locked rules remain:
- 150 real prospects is a floor, not a quota.
- Draft classes remain factual.
- Real prospects use persistent identities.
- HS integration replaces generated roster slots rather than enlarging rosters.
- Current Project Ice team and factual real-world biography/team snapshot remain separate concepts.
- Player-facing potential stays visible.

---

# Phase 2 — Home / Career Hub Refresh
Status: COMPLETE

Live validation completed on 2026-08-18.

The Home dashboard now includes and correctly wires:
- canonical player identity header
- dynamic Current Objective
- weekly calendar / event progression
- Next Big Moment
- Last Game
- Current Form
- Standings
- real Team Leaders
- Career Status / current role / coach trust
- Development Snapshot
- League News

Validated follow-up repairs include:
- same-day completed events immediately show DONE
- Home-origin events return to Home
- Home-origin games return to Home after postgame Continue
- unchanged potential evaluations do not create fake upgrade headlines
- prospect-ranking movement has weekly inertia and selective news coverage
- standings movement news is selective rather than spammy
- League Leaders / Award Races player profiles return directly to League

Phase 2 exit condition: PASSED.

---

# Phase 3 — Season Lifecycle
Status: ACTIVE

Goal: turn each HS year into a complete career chapter with a defined regular-season ending, postseason, awards, summer travel hockey, offseason development, permanent history, and transition into the next school year.

The HS yearly rhythm is locked as:

Regular Season → Playoff Preparation → Playoffs → Champion → Awards → Travel Tryouts → Summer Travel Tournament → Offseason Development → Season Recap → Next HS Season

This lifecycle repeats through freshman, sophomore, junior and senior seasons. The senior-year travel tournament is the final HS gameplay chapter before the later NHL Draft Transition phase.

## Phase 3.1 — Postseason Foundation
Status: COMPLETE / LIVE VALIDATION PASSED

Canonical postseason foundation is implemented and live-validated.

Locked playoff format:
- 8-team HS league.
- Top 6 qualify.
- Seeds 7 and 8 miss the playoffs.
- Seeds 1 and 2 receive byes into the semifinals.
- Round One: #3 vs #6 and #4 vs #5.
- Round One is Best of 3.
- Semifinals are Best of 3.
- Semifinals reseed: #1 plays the lowest remaining seed; #2 plays the other remaining seed.
- Championship is Best of 3.
- Higher seed hosts Games 1 and 3; lower seed hosts Game 2.
- Games are every other day during postseason play.
- If the career player's team is eliminated, the world continues simulating the rest of the bracket normally while the player has no further playoff games.

Timing:
- Regular-season standings freeze when the final regular-season game is complete.
- One full week without games follows the final regular-season game.
- One week after the finale, progression stops for a Project Ice styled Head Into Playoffs checkpoint.
- Playoff games begin approximately 1.5 weeks after the regular-season finale.
- Practice/recovery scheduling adapts around playoff games with at least two combined practice/recovery events per seven-day playoff window.

Canonical postseason state permanently preserves:
- frozen final regular-season standings
- six qualifiers and seeds
- byes
- every series
- every postseason game
- series records
- round winners
- reseeded semifinal matchups
- champion
- postseason completion date

Live validation passed for:
- May 1 hard postseason checkpoint behavior
- bracket reveal and user-team highlighting
- Round One progression and #1/#2 byes
- semifinal reseeding
- best-of-three series progression including Game 3 deciders
- career-player playoff Play Game / Sim Game flow
- adaptive practice/recovery cadence
- championship creation and world continuation after career-team elimination
- champion persistence into history/news

## Phase 3.2 — Playoff Presentation + Statistics
Status: ACTIVE

Build the persistent player-facing playoff layer on top of the validated canonical postseason state.

Locked requirements:
- Head Into Playoffs screen.
- Bracket reveal screen using the actual bracket from the save.
- During playoffs, League tab displays the playoff bracket prominently at the top.
- Existing Regular Season / Playoffs stat toggle becomes fully canonical.
- League leaders and player/team playoff stats populate separately from regular-season stats.
- Home becomes playoff-aware without becoming a separate playoff dashboard.
- Regular-season standings remain frozen/final during postseason play.
- Playoff game event and pregame screens retain distinct Project Ice postseason presentation while using the same canonical game engine.

Implementation order inside 3.2:
1. Persistent live League-tab bracket and postseason context.
2. Canonical playoff stat namespace audit/foundation.
3. League Leaders / Full Stats / player profile / team profile playoff wiring.
4. Home playoff-awareness and frozen-standings presentation audit.
5. End-to-end live validation from bracket entry through completed postseason.

## Phase 3.3 — Championship + Awards
Status: PLANNED

The day after the championship ends:
- stop progression
- show Champion screen
- winning team
- playoff team leaders
- Playoff MVP
- Continue Into Offseason

One week into the offseason:
- Award Ceremony event
- each award gets an individual suspenseful reveal
- reveal button slowly reveals the winner
- League MVP is revealed last
- regular-season awards are based purely on the frozen regular-season snapshot
- Playoff MVP is postseason-only

After all reveals:
- Continue opens permanent League Awards screen
- all league awards listed, including Playoff MVP
- Continue proceeds into offseason

## Phase 3.4 — Travel Hockey
Status: PLANNED

Travel levels:
- B
- A
- AA
- AAA

B is the guaranteed floor; the career player always makes a summer travel team.

Travel tryouts:
- similar presentation foundation to freshman tryouts
- placement depends on current attributes/overall plus current form and actual performance context
- a lower-OVR player playing exceptionally well can outperform their nominal ability level
- attributes still matter enough to prevent implausible placement swings

Summer tournament:
- 8 teams
- relevant prospects can be distributed across travel teams
- every round Best of 3
- games every other day
- one training session per week during the travel tournament
- travel schedule events appear in Home and Schedule normally

Travel Hockey Hub:
- temporary button on Home and League during travel season only
- one-page travel experience
- bracket
- tournament stats
- clickable travel team pages
- clickable player pages
- only the career player's achieved travel level is visible that summer
- do not simulate/show parallel B/A/AA/AAA worlds to the user
- levels may reuse the same fictional club identities with the level appended

Travel data remains separate from HS league/team/player-tab historical presentation.

End of tournament:
- Champion + Tournament MVP screen
- Continue returns to normal offseason
- Travel Hockey Hub buttons disappear

## Phase 3.5 — Offseason + Next Season Transition
Status: PLANNED

After travel hockey:
- 3 practices/trainings per week through August 31
- normal offseason calendar progression continues

August 31:
- hard Head Into Next Season checkpoint
- recap career player's season
- recap team's season
- brief league-season summary
- include relevant growth, standings, playoff result, champion, awards and scouting/career context

Continue:
- Next Season cutscene
- advance school year and age
- September 1 return to Home
- next-year HS tryout/preseason flow begins

Permanent HS history updates at the transition:
- league champion
- runner-up
- final standings
- playoff bracket and series results
- league awards
- Playoff MVP
- league leaders
- career-player regular-season/playoff results
- team result
- relevant league records/history

Travel hockey is excluded from HS league history and HS career statistics.

## Statistical namespaces locked for Phase 3

Maintain separate canonical scopes:
- Regular Season
- Playoffs
- Travel

Travel stats never contaminate HS regular-season or playoff career totals.

Regular-season award calculations use a frozen regular-season snapshot so playoff results cannot alter voting/races after the regular season ends.

---

# Later phases

After Season Lifecycle, the intended long-range order is:
- Draft + NHL Transition
- NHL World Building
- Long-Term Career / History
- Full Code / Game Audit and release calibration

Do not begin post-HS/NHL transition work until the HS season lifecycle is stable enough to carry a player cleanly through senior-year travel hockey.

---

# Locked Project Ice design principles

- Project Ice is a player career mode, not a GM mode.
- The user controls the career player; drafting, coaching, roster management and team-building decisions happen around the player.
- Overall is calculated from attributes and is never directly upgraded.
- Archetype is primarily a player-facing label; actual development comes from the saved development profile/personality/potential/context.
- Potential stays player-facing.
- No fatigue mechanic.
- Career-player lineup role is contextual; AI/NPC lineup ordering is primarily ability-based.
- Practice/recovery are quick career events, not separate playable minigames.
- Play Game, Sim Game and background games share one canonical hockey simulation engine.
- Real prospects use persistent identities and coexist with generated depth.
- Real prospect draft classes remain factual rather than being forced into artificial quotas.
- New systems should read/write canonical World Engine state and persist through IndexedDB.
- Prefer small focused commits and immediate testing over large rewrites.
- Always reference the latest code and this roadmap before making architectural decisions.
- If roadmap order changes later, explain why before implementation.
