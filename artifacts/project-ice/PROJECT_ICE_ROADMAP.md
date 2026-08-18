# Project Ice — Authoritative Roadmap

Updated: 2026-08-18
Authoritative planning checkpoint: 2026-08-17, expanded by the Phase 2 vision session on 2026-08-18

This file is the planning source of truth. Do not silently fall back to older roadmap files or prior phase ordering.

## Current checkpoint

Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE / CHECKPOINT PASSED

Phase 2 — Home / Career Hub Refresh
Status: IMPLEMENTED IN GITHUB / AWAITING LIVE REPLIT VISUAL VALIDATION

Primary implementation commit:
- `f614010acf133cfcd1fdb766f74728ae7f8fa282` — Refresh Home career dashboard

Before declaring Phase 2 complete, validate the refreshed Home screen in the live Replit build and repair any wiring, layout, or state issues found there.

---

# Phase 1 — Real Prospects + Scouting Completion

Goal: finish the real-prospect world and make the League/Scouting surfaces read from one canonical prospect ecosystem before moving to Home.

## Real prospect database and class rules

- Deep real-prospect pool across the 2027, 2028, 2029 and 2030 NHL draft classes.
- 150 real prospects is a floor, not a hard cap or quota.
- Draft classes must remain factual; do not rebalance or relabel real players merely to make class counts look even.
- Full Prospect Rankings may include 2024–2026 bridge/history players.
- 2024–2026 bridge/history players never port into the later Project Ice NHL world.
- Persistent future-world real prospects are 2027–2030.
- Real players use stable persistent identities.
- Project Ice game ratings/potential/development values are game-balance evaluations, not official scouting ratings.

## World integration

- Real prospects live in the canonical World Engine rather than only as UI/database rows.
- Current 2027 freshmen can enter the fictional Project Ice HS league.
- Future 2028–2030 cohorts remain outside the HS rosters until their proper entry year.
- HS integration replaces generated roster slots; it does not enlarge team rosters.
- A real prospect rostered in Project Ice HS remains the same player identity.
- Their factual real-world team is preserved separately as biography/history context.
- Their active Project Ice team becomes the HS program while they are rostered there.
- No duplicate active-world/external copies of the same real player.

## Prospect rankings and UI

- Full Prospect Rankings use the canonical weekly ranking system.
- Public rank, previous rank, rank movement and NEW status are supported.
- Prospect rows show useful team/league context rather than five-star reputation clutter.
- League Top Prospects preview and the full Prospect Rankings screen read from the same prospect world.
- Prospect rows/cards open the canonical player profile path.
- HS-integrated real prospects appear only once in rankings.

## Scouting foundation

- Scouts-in-attendance context exists.
- Prospect profiles expose player-facing scouting information while hidden evaluation/certainty systems can evolve underneath.
- Rival Watch / Prospect Watch infrastructure belongs to the scouting/living-world layer.
- Player-facing potential remains visible.
- Scouting/ranking systems should react to actual world state rather than disconnected fake data.

## Award/ranking integration rules

- Award races must not manufacture contenders before games have been played.
- Before league GP exists, the League Award Races section should show an honest empty state.
- Weekly ranking/award movement should be driven by canonical snapshots.

## Phase 1 visual validation completed

Validated in the live Replit build on 2026-08-18:

- Jamie Glance and Kayden Stroeder are present on Summit Academy’s HS roster.
- Their player profiles open normally.
- Duplicate prospect-ranking entries caused by HS + external copies were fixed.
- HS-integrated real prospects now appear once in rankings.
- Award Races correctly show no contenders before games exist.
- League Top Prospects preview is populated and visually consistent with the rankings system.
- Current HS real-prospect pipeline audit preserved 20-player rosters and prevented premature future-class roster insertion.

Phase 1 exit condition: PASSED.

---

# Phase 1 Inventory Checkpoint
Status: COMPLETE

Purpose: stop before Home work, compare the real current codebase against what is actually complete, partial or still missing, and then let the user redefine priorities before Phase 2 begins.

Inventory conclusions carried forward:

- Core persistence/world architecture is strong and should not be redesigned.
- Player/development architecture is substantially built and should be tuned/extended, not replaced.
- Team, lineup, special teams, League stats and standings are mature enough to consume future systems.
- Schedule/time flow and canonical game simulation are functional foundations, not future greenfield systems.
- The real-prospect database/world foundation is now built; the remaining scouting work is primarily deeper career-facing scouting consequences and presentation.
- Weekly living-world machinery exists in the backend but its player-facing storytelling layer remains incomplete.
- Home had fallen behind the richness of the underlying world and became the next major player-facing priority.
- Season lifecycle/history and post-HS/pro career remain major long-term structural work.
- Do not perform cleanup-only refactors of monolithic runtime files unless a feature or regression path requires it.

---

# Phase 2 — Home / Career Hub Refresh
Status: IMPLEMENTED / LIVE VALIDATION NEXT

Goal: make Home the main career dashboard — the screen that immediately answers who the player is, what matters now, what just happened, what is coming next, and where the career currently stands.

## Locked Home vision

### Player identity header

- Keep the same core information fields already established on Home:
  - player name
  - position
  - age
  - overall
  - reputation stars/tier
  - current team
- Fix the header so it resolves the actual canonical career player rather than showing stale or incorrect identity information.
- Preserve the compact mobile footprint.
- Restyle the colors slightly so the header feels more consistent with the rest of Project Ice: darker navy/glass surfaces, restrained blue accents, and less visually disconnected styling.

### Dynamic Current Objective

- Current Objective is no longer a static sentence.
- It must change with the player’s actual stage and context.
- Objective families can include:
  - Make the Team during tryouts.
  - Earn Your Role before meaningful game samples exist.
  - Build Coach Trust when trust is low.
  - Turn Attention Into Momentum when scouts are observing and ranking pressure matters.
  - Goalie-specific role objectives when appropriate.
  - Production/season-progress goals once the player is established.
- Show a compact progress indicator and a meaningful contextual label rather than fake completion values.
- Future levels of the career should reuse this same system with stage-appropriate objectives instead of requiring a new Home design.

### This Week calendar

- Preserve the existing weekly calendar because it is a core Home feature.
- Audit it rather than redesigning it.
- It must continue to read from the real schedule/current date.
- Completed, current, and future days must render correctly.
- Current events should enter the Event System.
- Future dates should simulate to the selected date through the canonical time-flow path.
- Completed events should route to the appropriate summary/history path where available.
- The event detail panel remains attached to the selected day.

### Next Big Moment

- Add a dynamic card that surfaces the most meaningful upcoming career event.
- Priority examples include scout-attended games, rivalry games, playoffs, championships, Game of the Week, prospect-related events, and other important career moments.
- If no special event exists, fall back to the next game or next scheduled event.
- This card should evolve naturally as new career systems are added.

### Last Game

- Add a compact Last Game snapshot.
- It should read from completed canonical game/result state where available.
- Show result and opponent without inventing a result.
- Before any game exists, show an honest empty state.
- Future polish can make this card reopen the canonical game summary if a stable result-to-summary navigation path is available.

### Current Form

- Add an at-a-glance form/status card.
- Use actual season statistics rather than randomized labels.
- Before games, show a season-start state.
- Once a sample exists, present a compact trend driven by production/performance data.
- The system may become more sophisticated later as a dedicated form model grows in the living-world layer.

### Standings

- Keep the existing Home standings preview.
- Continue to use the canonical standings renderer and preserve team-row navigation.
- Do not turn Home into a second full League screen.

### Team Leaders

- Remove the old hard-coded/fake player names and point totals.
- Read from the player’s actual current team roster and live statistics.
- Show a truthful empty state before team statistics exist.
- Highlight the career player when they appear among the leaders.
- Provide a quick route to the Team tab/full team context.

### Career Status / Current Role

- Add a compact career-status section that can answer at a glance:
  - Current Role / line assignment
  - PP/PK assignment when available
  - Coach Trust
  - Current season stat line
  - Prospect status/rank
- This should remain player-career context, not GM information.

### Development Snapshot

- Add a lightweight reminder of player development without duplicating the full Player tab.
- Show current OVR and relevant progression context.
- Potential may be surfaced because potential remains player-facing.
- Future upgrade/XP notifications can plug into this surface when their canonical data contract is stable.

### League News

- Keep the existing League News block and its View All flow.
- Continue to consume the canonical NewsSystem.
- Home should surface only the most recent/relevant items, not duplicate the entire League tab.

### Prospects

- Remove the Top Prospects card from Home.
- Prospect rankings remain on the League tab and full Prospect Rankings screen.
- Home may still mention the career player’s own prospect status/rank inside Career Status when relevant.

## Home layout hierarchy

Target hierarchy:

1. Player Header
2. Current Objective
3. This Week calendar
4. Next Big Moment
5. Last Game + Current Form
6. Standings
7. Team Leaders
8. Career Status + Development Snapshot
9. League News

Cards should remain compact enough for portrait iPhone use and visually consistent with the polished Team/League/Player language already established.

## Phase 2 implementation notes

Implemented in `f614010acf133cfcd1fdb766f74728ae7f8fa282`:

- Refreshed Home header styling while preserving the original identity fields/IDs.
- Added a canonical career-player resolver for Home.
- Added dynamic career-stage objective logic and progress presentation.
- Preserved and re-wired the existing weekly calendar flow.
- Added Next Big Moment.
- Added Last Game and Current Form snapshots.
- Preserved canonical Standings.
- Replaced fake Team Leaders with live roster/stat-driven leaders and a real empty state.
- Added Career Status with role, trust, season line, and prospect status.
- Added Development Snapshot.
- Preserved canonical League News.
- Removed Home’s Top Prospects card.
- Added scoped visual styling instead of redesigning unrelated screens.

## Phase 2 validation checklist

Before Phase 2 is marked complete, verify in Replit:

- Correct player name, position, age, OVR, reputation and team in the top header.
- Header visually matches the rest of the game.
- Dynamic objective is sensible for the current career state.
- Week calendar still selects days, opens current events, simulates to future dates, and handles completed events.
- Next Big Moment is sensible for the current schedule.
- Last Game does not invent data and begins populating after games.
- Current Form changes only from real statistics.
- Standings still navigate correctly.
- Team Leaders show an honest pre-game empty state and real leaders once stats exist.
- Career Status shows the correct line/role and coach trust.
- League News remains populated and View All works.
- Home no longer contains the separate Top Prospects card.
- Team and Player shortcut buttons route correctly.
- No regression to Continue Career or save/reload behavior.

Phase 2 exit condition: the refreshed Home works as a truthful, polished main career dashboard in the live build and remains stable after reload.

---

# Later phases
Status: NOT RE-LOCKED YET

The prior roadmaps contained later work such as living-world storytelling, deeper scouting consequences, season transition/history, post-high-school pathways, draft/NHL career and release calibration.

Those remain valid long-term areas, but their exact ordering is intentionally NOT declared authoritative here until the user explicitly locks the next roadmap after Phase 2 validation.

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
