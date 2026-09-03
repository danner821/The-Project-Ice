# Project Ice — Authoritative Roadmap

Updated: 2026-09-03
Authoritative planning checkpoint: Phase 3.5 multi-year HS lifecycle

This file is the planning source of truth. Always use the latest code and this roadmap before making architectural decisions. Do not silently fall back to older phase ordering.

## Current checkpoint

Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE / LIVE VALIDATED

Phase 2 — Home / Career Hub Refresh
Status: COMPLETE / LIVE VALIDATED

Phase 3 — Complete High School Season Lifecycle
Status: ACTIVE

Completed/live-validated Phase 3 systems:
- 3.1 Postseason Foundation
- 3.2 Playoff Presentation + Statistics
- 3.3 Championship + Awards
- 3.4 Travel Hockey
- 3.5 offseason entry and two canonical Training events per seven days

Current mini-phase:
- Phase 3.5A — Canonical Time + Birthdates

The HS yearly rhythm is locked as:

Regular Season → Playoff Preparation → Playoffs → Champion → Awards → Travel Tryouts → Summer Travel Tournament → Offseason Development → League Season Recap → Career Player Season Recap → Next Season Cutscene → Returning Tryouts → Next HS Season

This lifecycle repeats through freshman, sophomore, junior and senior seasons.

---

# Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE

Locked rules:
- 150 real prospects is a floor, not a quota.
- Draft classes remain factual.
- Real prospects use persistent identities.
- HS integration replaces generated roster slots rather than enlarging rosters.
- Current Project Ice team and factual real-world biography/team snapshot remain separate concepts.
- Player-facing potential stays visible.

---

# Phase 2 — Home / Career Hub Refresh
Status: COMPLETE

The Home dashboard, weekly calendar, current objective, Next Big Moment, Last Game, Current Form, Standings, Team Leaders, Career Status, Development Snapshot and League News are live validated.

---

# Phase 3 — Complete High School Season Lifecycle
Status: ACTIVE

Goal: make all four HS years function as one persistent living career world with permanent history, aging, roster turnover, recurring seasons and reusable lifecycle systems.

## Phase 3.1 — Postseason Foundation
Status: COMPLETE / LIVE VALIDATED

Locked playoff format:
- 8-team HS league.
- Top 6 qualify; seeds 7 and 8 miss.
- Seeds 1 and 2 receive semifinal byes.
- Round One: #3 vs #6 and #4 vs #5.
- Round One, semifinals and championship are Best of 3.
- Semifinals reseed.
- Higher seed hosts Games 1 and 3; lower seed hosts Game 2.
- Games are every other day.
- World continues normally after career-team elimination.

## Phase 3.2 — Playoff Presentation + Statistics
Status: COMPLETE / LIVE VALIDATED

Locked canonical scopes:
- Regular Season
- Playoffs
- Travel
- International where applicable

Travel never contaminates HS regular-season/playoff statistics.

## Phase 3.3 — Championship + Awards
Status: COMPLETE / LIVE VALIDATED

Implemented:
- Champion checkpoint
- Playoff MVP
- Award Ceremony
- persisted close-race subjective award selection
- League Awards history presentation

### Permanent award identity rule
Awards are permanent player career facts, not temporary season-screen text.

Every award record must retain the winner's stable playerId. A player's profile must aggregate their awards across every completed season. If a player wins League MVP as a freshman, that award must still appear on that player's profile as a sophomore, junior, senior and later in their career.

Season rollover, stat resets, roster movement and graduation must never detach an award from its winner.

## Phase 3.4 — Travel Hockey
Status: COMPLETE / LIVE VALIDATED

Implemented:
- B / A / AA / AAA placement
- guaranteed Travel floor
- Travel tryouts
- persistent Travel clubs/rosters and real-prospect integration
- 8-team Best-of-3 tournament
- canonical Travel Play Game / Sim Game
- weekly Travel training cadence
- Travel statistics and history
- Travel Champion + Tournament MVP
- background tournament continuation after career-player elimination
- Travel closeout into normal offseason

Travel remains a separate statistical namespace from HS league history, while the Travel Champion and Tournament MVP may be referenced on that year's overall season recap.

## Phase 3.5 — Multi-Year HS Lifecycle
Status: ACTIVE

### 3.5A — Canonical Time + Birthdates
Status: ACTIVE / NEXT IMPLEMENTATION

Canonical HS timeline:
- Freshman: 2022–23
- Sophomore: 2023–24
- Junior: 2024–25
- Senior: 2025–26

Requirements:
- eliminate conflicting fresh-career 2026/2027 hardcodes
- one canonical season identity contract
- every player has a persistent birthDate/effective birth date
- age is derived from birthdate + current game date and changes naturally on birthdays
- school class is separate from age
- preserve factual real-prospect DOBs when known
- if a sourced prospect only has birth year, retain that factual source value and track an internal deterministic effective date rather than pretending an exact factual birthday is known
- generated players receive deterministic believable birthdates consistent with their current age/class
- existing progressed/dev saves must not be rewound by the fresh-career timeline migration

### 3.5B — Permanent Season Archive + League History
Status: PLANNED

Before the living world mutates for a new year, freeze the completed season into one immutable canonical archive, e.g. `world.history.highSchoolSeasons`.

Every archived season preserves:
- season identity/year
- final standings
- champion and runner-up
- complete playoff bracket/series/results
- league awards and Playoff MVP, with stable playerIds
- top league leaders
- career-player regular-season and playoff results
- career-player team and final role
- relevant team result
- relevant records/history
- Travel Champion and Tournament MVP references

League → History must list every completed season and allow the exact historical Season Recap to be reopened forever.

Do not create separate competing history owners for standings, champion, awards, etc. The yearly season archive is the canonical historical owner; existing one-off history structures become compatibility inputs where needed.

### 3.5C — League Season Recap
Status: PLANNED

At the Aug. 31 end-of-offseason checkpoint, screen one shows the completed season from the immutable archive:
- champion
- final standings
- top 3 in the four canonical headline stat categories used by League Leaders
- award winners
- Playoff MVP
- Travel Champion
- Travel Tournament MVP

This exact screen must remain reopenable later from League History.

### 3.5D — Career Player Season Recap
Status: PLANNED

Screen two summarizes the career player's year:
- team and final lineup role
- Regular Season stats
- Playoff stats
- Travel level/stats/result
- team finish
- awards/honors
- opening OVR → ending OVR
- each attribute that actually increased
- meaningful scouting/prospect/reputation/potential movement when applicable
- meaningful milestones only; avoid clutter

A season-opening development snapshot must be saved so growth is measured from actual beginning/end state rather than reverse-engineered from XP.

### 3.5E — Next Season Cutscene
Status: PLANNED

After Continue on the career recap:
- leave normal Hub presentation
- cinematic school-year completion beat
- announce the next class, e.g. Sophomore Season
- announce next season label
- transition to September 1
- perform yearly world rollover behind this presentation

### 3.5F — Annual HS World Rollover
Status: PLANNED

One reusable annual service must handle every transition; do not build separate sophomore/junior/senior hacks.

Requirements:
- archive old season BEFORE mutation/reset
- seniors graduate from active HS rosters but remain persistent historical identities
- juniors → seniors
- sophomores → juniors
- freshmen → sophomores
- incoming freshmen/prospects enter
- roster sizes remain stable
- real prospects continue using persistent identities
- AI lineups recalculate from the new roster
- career-player program/team remains the same unless a future explicit transfer system is designed
- current-season standings/stats/award races reset only after archive
- all yearly lifecycle/game IDs must include season/tournament identity to prevent collisions

### 3.5G — Returning Varsity Tryouts
Status: PLANNED

Project Ice high-school hockey is Varsity-only. JV is not a live gameplay level.

Returning-year tryouts reuse the existing freshman tryout presentation/drills but answer a different question:
- the player is already returning to the same Varsity program
- tryouts determine lineup role, not whether they make JV/Varsity

Role outcomes:
- Forward: Lines 1–4
- Defense: Pairs 1–3

Evaluation considers current attributes, drill performance, prior-season performance, coach trust, development/context and competition from the changed roster. Career-player placement remains contextual rather than pure OVR sorting.

Use the same relative calendar timing as the canonical freshman-year tryout event after the September 1 return.

### 3.5H — New Season Generation
Status: PLANNED

After returning tryouts:
- generate a fresh HS schedule for the new year
- recalculate rosters/lineups/team strength
- reset only new-season statistical containers
- preserve all historical seasons, player career history, awards, records and Travel history
- generate unique yearly Travel tournament/game IDs

## Phase 3.6 — Reusable Four-Year HS Loop
Status: PLANNED

Exit condition:
- the same annual lifecycle can progress Freshman → Sophomore → Junior → Senior without year-specific hacks
- senior-year Travel is the final HS gameplay chapter
- all four years remain visible in permanent history

---

# Phase 4 — Full Fresh-Career HS Playthrough / QA
Status: PLANNED / HARD GATE BEFORE NHL

After Phase 3.6, start a completely new career and personally play the entire HS career:
- Freshman season through Travel/offseason
- Sophomore season through Travel/offseason
- Junior season through Travel/offseason
- Senior season through final Travel

During this playthrough, repair bugs, pacing issues, balance issues, presentation problems and small desired changes one at a time against the real career.

Hard exit gate:
- DO NOT begin Draft/NHL implementation until one newly created career reaches the end of senior-year Travel with correct four-year history and no blocking lifecycle failures.

---

# Phase 5 — HS Career Finalization Audit
Status: PLANNED

Verify before freezing HS gameplay:
- four permanent season-history entries
- champions/runner-ups correct
- final standings correct
- playoff brackets/series correct
- award winners permanently linked to player identities and visible on future player profiles
- Travel history correct
- player season/career stat totals correct
- development history correct
- birthdate/age behavior correct
- graduating players leave active HS rosters correctly
- incoming players and real prospects remain unique
- no duplicate player identities
- no stale lifecycle/calendar events
- no freshman-only assumptions remain
- no JV appears in live gameplay outside one-way compatibility migration

---

# Phase 6 — Draft + NHL Transition
Status: BLOCKED UNTIL PHASES 4–5 PASS

Only after the full HS playthrough/audit:
- final prospect ranking / draft eligibility
- Draft transition presentation
- AI-controlled drafting/team assignment
- NHL contract/organization transition
- NHL World Building
- long-term pro career/history systems

---

# Locked Project Ice design principles

- Project Ice is a player career mode, not a GM mode.
- The user controls the career player; drafting, coaching, roster management and team-building decisions happen around the player.
- High-school hockey is Varsity-only; JV is obsolete compatibility data, not a live gameplay level.
- Overall is calculated from attributes and is never directly upgraded.
- Archetype is primarily a player-facing label; development comes from saved development profile/personality/potential/context.
- Potential stays player-facing.
- No fatigue mechanic.
- Career-player lineup role is contextual; AI/NPC lineup ordering is primarily ability-based.
- Practice/recovery/Training are quick career events, not separate playable minigames.
- Play Game, Sim Game and background games share one canonical hockey simulation engine.
- Real prospects use persistent identities and coexist with generated depth.
- Real prospect draft classes remain factual.
- Awards and historical achievements are linked to stable player identities permanently.
- One immutable season archive owns completed-season historical truth.
- Archive before mutating the living world.
- Annual rollover is generic and reusable across all four HS years.
- New systems read/write canonical World Engine state and persist through IndexedDB.
- Prefer root-cause architecture and small focused commits over stacked display/timing patches.
- Always reference the latest code and this roadmap before making architectural decisions.
- If roadmap order changes later, explain why before implementation.
