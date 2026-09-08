# Project Ice — Pre-Playthrough Codebase Audit

Audit date: 2026-09-08

## Purpose

This audit is the hardening pass immediately before the first full Freshman → Senior high-school career playthrough.

The goal is not to redesign working systems. It is to verify the current code against the locked Project Ice architecture, remove obvious pre-alpha debris, repair lifecycle bugs that would corrupt a multi-year career, and identify items that are better tuned naturally during the full playthrough.

## Runtime source of truth

The live Project Ice application remains the static app under `artifacts/project-ice/index.html` plus runtime files under `artifacts/project-ice/public/`.

Canonical owners remain:
- `public/world.js` — world state, persistence, rosters, schedule resolution, statistics, development and simulation state.
- `public/game.js` — player-facing controller/presentation and live-game flow.
- focused runtime modules — lifecycle, postseason, Travel, history, rankings, coach meetings and compatibility repairs.
- IndexedDB — canonical full career persistence.

The React `src/` tree is still dormant Replit scaffold, not the gameplay runtime.

## Current architecture status

### High-school multi-year lifecycle — implemented and actively hardened

The canonical timeline is:
- Freshman: 2023–24
- Sophomore: 2024–25
- Junior: 2025–26
- Senior: 2026–27

The annual loop now includes:
Regular Season → Postseason → Champion → Awards → Travel → Offseason → League Season Recap → Player Season Recap → New Season Cutscene → Roster Rollover → Returning Varsity Tryouts → Next Season.

### Permanent history — implemented

Completed seasons are frozen before annual mutation. League History can reopen archived season recaps. Awards retain stable player identities and persist onto player profiles.

Known non-blocking QA item:
- one archived generated-player profile path has previously failed to display its frozen historical statistics even though the archive/award itself is correct. This was explicitly deferred for observation during the real playthrough unless it becomes broader than the isolated case.

### Prospect model — implemented / calibrated

The public Top 100 now uses the calibrated V2 model rather than a simple OVR/potential sort. It includes ability, potential, performance, development trajectory, scouting/exposure, competition context and draft readiness, with separate goalie/skater performance logic, two-week publications and controlled rank movement.

Public reputation tiers (Local / Regional / National / Elite / Generational) are coordinated with the published rankings without becoming aliases for rank. Generational status is intentionally rare.

### Coach / role immersion — implemented

Recurring contextual coach meetings occur during the HS season. Meetings read the player's current role, coach trust, form, overall and special-teams context, then create short-term objectives.

The role loop now supports:
- trust/consistency objectives
- promotion reviews
- role-security warnings
- demotion reviews
- persisted coach-role history
- canonical NPC lineup reconciliation after a career-player role change

Objective targets will still need feel/balance tuning during the real playthrough.

## Critical findings repaired in this audit

### 1. Returning-player sophomore statistics stayed at zero — FIXED

Root cause:
- HS schedule game IDs reused the same cycle/round/matchup IDs every season.
- each player also retained `appliedGameIds` across annual rollover.
- therefore a sophomore game could look identical to a freshman game to the player-level duplicate guard.
- standings advanced because team/schedule result application succeeded, while player stat application correctly refused what looked like a duplicate.

Repairs:
- `appliedGameIds` is now reset with other current-season stat state during HS roster rollover.
- new-season HS game IDs are normalized to include the canonical season identity before the new season is played.

This restores the intended invariant: game-result idempotency is per unique game, while player career history remains permanent.

### 2. New-season Schedule could repaint the old month — FIXED

The canonical schedule was already rebuilt, but the visible Schedule screen could remain pointed at the previous August/offseason month until navigation forced another render.

The calendar projection now:
- repoints the visible calendar month to the new canonical season date
- rebuilds Home/Schedule projections directly from `world.schedule`
- performs a final boundary sync after annual integrity work finishes

The player should no longer need an extra click or simulated day to see the new season.

### 3. Yearly HS game IDs were not season-scoped — FIXED

The roadmap requires all yearly lifecycle/game IDs to include season identity. The base schedule generator's reusable IDs are now normalized at the annual boundary to include the active `seasonId` before any game can be resolved.

### 4. Coach role change could leave NPC lineup state stale — FIXED

Promotion/demotion changed the career player's reserved slot, but the canonical NPC lineup manager was not guaranteed to re-run immediately afterwards.

A reconciliation runtime now re-runs team roster management once after an approved promotion or demotion so the career player's new slot is reserved and NPCs are re-sorted around it rather than leaving duplicate slot ownership.

### 5. Obsolete user-specific dev-save cleanup still loaded on every boot — REMOVED FROM RUNTIME

A dated one-off cleanup module targeted specific old dev saves by player name/date. Its migration purpose is over and it no longer belongs in the live runtime stack. The file may remain in repository history, but Vite no longer injects it.

## Multi-year integrity checks reviewed

### Canonical time / class / age
- canonical 2023–27 HS identity module is active
- grade/class remains separate from age
- generated-player age repair is deterministic
- active draft-class reconciliation runs at annual boundaries

### Roster rollover
- completed-season data is captured before mutation
- graduating/expired players are archived rather than destroyed
- incoming freshmen replace vacated roster positions
- active-player current-season stat containers reset after archive
- AI lineup management re-runs after rollover

### Statistics
Canonical scope separation remains:
- Regular Season
- Playoffs
- Travel
- International where applicable

Travel must not contaminate HS regular-season/playoff totals.

The newly repaired annual `appliedGameIds` lifecycle is a required regression check for sophomore, junior and senior seasons.

### Awards / history
- awards remain stable-player-ID facts
- yearly archive owns completed-season historical truth
- League History reopening works
- historical profile navigation works
- goalie lower-profile rendering has been repaired

### Schedule / blocking events
- `world.schedule` remains authoritative
- recurring coach meetings project into Home/Schedule
- returning tryouts remain blocking player-interaction events
- new-season calendar projection rebuilds directly after rollover

### Prospect rankings
- expired draft classes are removed from active HS rosters before new-season rankings rebuild
- Top 100 candidate pool is rebuilt at the season boundary
- rankings are not simply OVR order

### Persistence
- IndexedDB remains canonical
- annual changes save after boundary integrity work
- lightweight Continue Career preview must remain presentation only

## Remaining pre-playthrough cleanup / watch items

### P1 — verify repaired sophomore stat accumulation live
Before starting a fresh four-year career, use the sophomore dev shortcut, simulate at least one regular-season game, and verify:
- team standings advance
- skater GP/G/A/PTS advance
- goalie GP/W/L/SV% advance
- Full Stats / Team Leaders / player profiles agree
- reload does not duplicate those totals

This is the final live validation for the stat-ID repair.

### P1 — Travel yearly identity should be watched closely
The HS yearly game-ID collision is now fixed. Travel tournament series currently use reusable human-readable series IDs internally (`travel-qf-*`, `travel-sf-*`, etc.). Travel state is replaced between seasons, so this is not currently proven to corrupt statistics, but the roadmap's stronger rule is that yearly tournament/game identity should also be season-specific.

Before senior completion, verify Travel history and current Travel schedule never confuse two seasons. If any collision appears, season-scope the Travel tournament identity rather than patching individual screens.

### P2 — transition UI still performs legacy hidden tab refreshes
The next-season cutscene contains a legacy `hardRefreshRolloverUI()` helper that opens Schedule → League → Home behind the cutscene. Canonical calendar sync now makes this unnecessary for Schedule correctness.

It is not currently a correctness blocker, but it is a likely source of avoidable work during rollover. Remove/refactor only with immediate transition regression testing because this path touches several presentation systems at once.

### P2 — runtime module count is high
The project has intentionally moved new systems out of `game.js` / `world.js`, which is good, but several feature areas now use layered wrappers around the same functions. Continue to prefer one canonical owner per responsibility and retire narrow repair wrappers when their behavior can safely be consolidated.

Do not perform a broad rewrite immediately before the full playthrough.

### P2 — coach objective balance
The objective plumbing is functional. Point/win targets and promotion thresholds should be tuned from the real Freshman → Senior experience rather than overfitted through diagnostics.

### P3 — dev controls
Dev shortcuts remain useful for the pre-alpha hardening pass. They should not be removed until the full HS QA run is complete.

## Pre-playthrough hard gate

Do not begin the fresh HS playthrough until all of these pass:

1. App boots without runtime error.
2. Sophomore dev shortcut creates the 2024–25 season correctly.
3. New Schedule immediately shows the 2024–25 calendar without extra navigation.
4. At least one sophomore game produces non-zero player statistics.
5. Stats survive reload without duplication.
6. Current Top 100 contains only eligible active draft classes.
7. Contextual coach meeting opens and creates an objective.
8. Promotion/demotion diagnostics leave a valid lineup with one career player and no duplicate role slot.
9. Fresh New Career still begins on the canonical 2023–24 Freshman timeline.

Once those pass, start a completely new career and use the four-year playthrough itself as the next QA phase.

## During the full playthrough

Tune/fix one issue at a time while watching:
- progression pace and XP
- coach objective difficulty/frequency
- lineup movement
- scouting exposure and ranking movement
- game/stat realism
- standings and award races
- postseason/Travel flow
- annual archive correctness
- roster turnover
- age/draft-class progression
- history/profile presentation
- performance on mobile

Do not begin NHL/Draft implementation until a newly created career reaches the end of senior-year Travel with correct permanent four-year history.