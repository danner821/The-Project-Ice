# Project Ice — Pre-Playthrough Codebase Audit

Audit date: 2026-09-16

## Purpose

This audit is the final hardening record immediately before the first full Freshman → Senior high-school career playthrough.

The goal is not to redesign working systems. It is to verify the current code against the locked Project Ice architecture, remove obvious pre-alpha debris, repair lifecycle bugs that would corrupt a multi-year career, and leave balance/pacing tuning to the real playthrough.

## Runtime source of truth

The live Project Ice application remains the static app under `artifacts/project-ice/index.html` plus runtime files under `artifacts/project-ice/public/`.

Canonical owners remain:
- `public/world.js` — world state, persistence, rosters, schedule resolution, statistics, development and simulation state.
- `public/game.js` — player-facing controller/presentation and live-game flow.
- focused runtime modules — lifecycle, postseason, Travel, history, rankings, coach meetings and compatibility repairs.
- IndexedDB — canonical full career persistence.

The React `src/` tree remains dormant Replit scaffold, not the gameplay runtime.

## Current architecture status

### High-school multi-year lifecycle — implemented and hardened for playthrough

Canonical timeline:
- Freshman: 2023–24
- Sophomore: 2024–25
- Junior: 2025–26
- Senior: 2026–27

Annual loop:
Regular Season → Postseason → Champion → Awards → Travel → Offseason → League Season Recap → Player Season Recap → New Season Cutscene → Roster Rollover → Returning Varsity Tryouts → Next Season.

The architecture is now at the point where the next meaningful validation is a completely fresh four-year career, not another feature batch.

### Permanent history — implemented

Completed seasons are frozen before annual mutation. League History can reopen archived season recaps. Awards retain stable player identities and persist onto player profiles.

Known non-blocking QA item:
- one archived generated-player profile path has previously failed to display its frozen historical statistics even though the archive/award itself is correct. Continue to watch this during the real playthrough and only escalate if it proves broader than the isolated case.

### Prospect model — implemented / calibrated

The public Top 100 uses the calibrated V2 model rather than a simple OVR/potential sort. It includes ability, potential, performance, development trajectory, scouting/exposure, competition context and draft readiness, with separate goalie/skater performance logic, two-week publications and controlled rank movement.

Public reputation tiers (Local / Regional / National / Elite / Generational) are coordinated with published rankings without becoming aliases for rank. Generational status remains intentionally rare.

### Coach / role immersion — implemented

Recurring contextual coach meetings occur during the HS season. Meetings read the player's current role, coach trust, form, overall and special-teams context, then create short-term objectives.

The role loop supports:
- trust/consistency objectives
- promotion reviews
- role-security warnings
- demotion reviews
- persisted coach-role history
- canonical NPC lineup reconciliation after a career-player role change

Objective targets remain a playthrough tuning item, not an architectural blocker.

## Critical findings repaired before playthrough

### 1. Returning-player sophomore statistics stayed at zero — FIXED

Root cause:
- HS schedule game IDs reused the same cycle/round/matchup IDs every season.
- each player also retained `appliedGameIds` across annual rollover.
- therefore a sophomore game could look identical to a freshman game to the player-level duplicate guard.
- standings advanced because team/schedule result application succeeded, while player stat application correctly refused what looked like a duplicate.

Repairs:
- `appliedGameIds` resets with current-season stat state during HS roster rollover.
- new-season HS game IDs include canonical season identity before the new season is played.

This restores the intended invariant: game-result idempotency is per unique game, while player career history remains permanent.

### 2. New-season Schedule could repaint the old month — FIXED

The canonical schedule was already rebuilt, but the visible Schedule screen could remain pointed at the previous August/offseason month until navigation forced another render.

The calendar projection now:
- repoints the visible calendar month to the new canonical season date
- rebuilds Home/Schedule projections directly from `world.schedule`
- performs a final boundary sync after annual integrity work finishes

The player no longer needs an extra click or simulated day to see the new season.

### 3. Yearly HS game IDs were not season-scoped — FIXED

All yearly HS lifecycle/game IDs are normalized to include active season identity before game resolution.

### 4. Travel tournament/game identity was not strongly season-scoped — FIXED

Travel identity normalization now scopes tournament series/game identifiers to the active season. This closes the same class of cross-year collision risk that previously affected HS regular-season statistics.

### 5. Coach role change could leave NPC lineup state stale — FIXED

Promotion/demotion changed the career player's reserved slot, but the canonical NPC lineup manager was not guaranteed to re-run immediately afterwards.

A reconciliation runtime now re-runs team roster management after approved role movement so the career player's new slot is reserved and NPCs are sorted around it rather than leaving duplicate slot ownership.

### 6. Obsolete user-specific dev-save cleanup still loaded on every boot — REMOVED FROM RUNTIME

A dated one-off cleanup module targeted specific old dev saves by player name/date. Its migration purpose is over and it no longer belongs in the live runtime stack. The file may remain in repository history, but Vite no longer injects it.

### 7. Recovery conflicted with the no-fatigue design — REPLACED WITH FILM STUDY

Recovery has been replaced by interactive Film Study across regular and returning HS seasons.

Film Study now:
- appears as the canonical event instead of Recovery
- offers Offensive Reads / Defensive Details / Special Teams choices
- routes through its dedicated interaction before generic event completion
- grants focused individual attribute XP
- does not grant Recovery-era morale or injury-risk effects
- persists/completes through the normal event flow

The underlying normalization is handled at the schedule/lifecycle boundary rather than by a cosmetic rename.

### 8. Three permanent polling loops ran every 250–500ms — REMOVED

The following permanent loops were removed:
- postseason checkpoint normalization
- postseason UI sync
- season lifecycle migration observation

They were replaced with explicit lifecycle/UI events and wrapped state transitions. This removes constant mobile work without changing simulation logic.

The bounded loader retry in `player-season-recap-loader.js` remains because it self-terminates and is not permanent polling.

### 9. Broad MutationObserver audit — ONE CLEARLY REDUNDANT OBSERVER REMOVED

The active MutationObserver inventory was reviewed rather than mechanically reduced.

Removed:
- the full-document Travel season-identity observer that watched `document.documentElement` only to detect the Travel tournament engine. The canonical loader already exposes an explicit engine `load` lifecycle event, so the broad observer was redundant.

Retained intentionally:
- Schedule observer scoped to the Schedule presentation root
- player stat-scope refresh observer
- Travel presentation observers
- Travel stat-history/profile presentation observer
- other observers whose ownership is still tied to DOM creation/replacement

No broad observer purge was performed immediately before the four-year test. Further consolidation should happen only when the playthrough identifies a concrete failure or measurable performance problem.

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

The annual `appliedGameIds` lifecycle remains a required regression watch through sophomore, junior and senior seasons.

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
- Film Study is canonical across HS schedules

### Prospect rankings
- expired draft classes are removed from active HS rosters before new-season rankings rebuild
- Top 100 candidate pool is rebuilt at the season boundary
- rankings are not simply OVR order

### Persistence
- IndexedDB remains canonical
- annual changes save after boundary integrity work
- lightweight Continue Career preview remains presentation only

### Mobile/runtime performance
- permanent 250–500ms polling has been removed
- one clearly redundant broad full-document observer has been removed
- remaining MutationObservers are retained where they still own real presentation synchronization
- large-scale wrapper/module consolidation is deferred until after the real playthrough unless a blocking failure appears

## Remaining watch items for the full playthrough

### P1 — annual stat identity regression
Across sophomore, junior and senior seasons verify:
- team standings advance
- skater GP/G/A/PTS advance
- goalie GP/W/L/SV% advance
- Full Stats / Team Leaders / player profiles agree
- reload does not duplicate totals

### P1 — Travel yearly continuity
Travel identity is now season-scoped, but the fresh four-year career is the real proof. Verify Travel history, current Travel schedule, series results and statistics never confuse two seasons.

### P2 — archived generated-player profile edge case
Watch the previously isolated case where a historical generated-player profile did not display frozen stats. Do not patch preemptively unless reproduced.

### P2 — transition UI legacy refresh work
The next-season cutscene still contains legacy hidden tab refresh behavior in `hardRefreshRolloverUI()`. Canonical calendar sync now owns Schedule correctness, so some of this may eventually be removable.

Do not refactor it before the fresh playthrough unless it produces an actual transition problem.

### P2 — runtime module count / wrapper layering
The project intentionally moved focused systems out of `game.js` / `world.js`, but several feature areas still layer wrappers around common functions. Prefer one owner per responsibility when a proven problem justifies consolidation.

Do not perform a broad rewrite before the full playthrough.

### P2 — coach objective balance
The objective plumbing is functional. Point/win targets and promotion thresholds should be tuned from the real Freshman → Senior experience rather than overfitted through diagnostics.

### P3 — dev controls
Dev shortcuts remain useful for diagnosis during the pre-alpha QA cycle. Do not remove them until the full HS QA run is complete.

## Final pre-playthrough gate

Completed:
1. App boots without runtime error.
2. Sophomore/returning-year lifecycle has been exercised in dev testing.
3. New Schedule projects the returning-season calendar correctly.
4. Returning-season player statistics were repaired and live tested during hardening.
5. Current Top 100/coach/role systems are functional.
6. Film Study replacement is live validated.
7. Permanent 250–500ms polling loops are removed and normal navigation/event flow is live validated.
8. Broad MutationObserver audit is complete and the clearly redundant full-document observer is removed.

Remaining before New Career:
9. Refresh authoritative roadmap/audit to the current state. COMPLETE with this update.
10. Perform one final static integrity check of the resulting runtime stack.

If the static integrity check passes, stop building and create the fresh career.

## During the full playthrough

Tune/fix one issue at a time while watching:
- progression pace and XP
- Film Study/Training cadence and reward feel
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
