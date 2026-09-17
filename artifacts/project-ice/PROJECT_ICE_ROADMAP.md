# Project Ice — Authoritative Roadmap

Updated: 2026-09-16
Authoritative planning checkpoint: pre-playthrough hardening complete; final static integrity check next

This file is the planning source of truth. Always use the latest code and this roadmap before making architectural decisions. Do not silently fall back to older phase ordering.

## Current checkpoint

Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE / LIVE VALIDATED

Phase 2 — Home / Career Hub Refresh
Status: COMPLETE / LIVE VALIDATED

Phase 3 — Complete High School Season Lifecycle
Status: IMPLEMENTED / PRE-PLAYTHROUGH HARDENING COMPLETE

Phase 4 — Full Fresh-Career HS Playthrough / QA
Status: NEXT, after one final static integrity check

The HS yearly rhythm is locked as:

Regular Season → Playoff Preparation → Playoffs → Champion → Awards → Travel Tryouts → Summer Travel Tournament → Offseason Development → League Season Recap → Career Player Season Recap → Next Season Cutscene → Returning Varsity Tryouts → Next HS Season

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
- Public prospect rankings use the calibrated V2 model rather than a simple OVR/potential sort.
- Public reputation tiers remain related to, but distinct from, ranking position.

---

# Phase 2 — Home / Career Hub Refresh
Status: COMPLETE

The Home dashboard, weekly calendar, current objective, Next Big Moment, Last Game, Current Form, Standings, Team Leaders, Career Status, Development Snapshot and League News are live validated.

---

# Phase 3 — Complete High School Season Lifecycle
Status: IMPLEMENTED / PRE-PLAYTHROUGH HARDENING COMPLETE

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

Every award record retains the winner's stable playerId. A player's profile aggregates awards across completed seasons. Season rollover, stat resets, roster movement and graduation must never detach an award from its winner.

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
- season-scoped Travel tournament/game identity protection

Travel remains a separate statistical namespace from HS league history, while the Travel Champion and Tournament MVP may be referenced on that year's overall season recap.

## Phase 3.5 — Multi-Year HS Lifecycle
Status: IMPLEMENTED / HARDENED

Canonical HS timeline:
- Freshman: 2023–24
- Sophomore: 2024–25
- Junior: 2025–26
- Senior: 2026–27

Implemented lifecycle architecture:
- canonical time/season identity
- birthdate/effective-birthdate age model
- permanent season archive and League History
- League Season Recap
- Career Player Season Recap
- Next Season Cutscene
- reusable annual HS world rollover
- Returning Varsity Tryouts
- fresh yearly HS schedule generation
- season-scoped game identity
- recurring coach/role objectives
- current-season stats reset only after archival
- permanent player, award and historical identity preservation

### Annual archive rule
Before the living world mutates for a new year, the completed season is frozen into the canonical yearly history owner. The archive preserves season identity, standings, champion, playoff results, awards, leaders, career-player results, team result, records/history and relevant Travel references.

### Annual rollover rule
One reusable annual service handles each HS transition. Seniors graduate from active HS rosters but remain historical identities; younger classes advance; incoming players fill the new class; roster sizes stay stable; AI lineups recalculate; the career player remains with the same school unless a future explicit transfer system is designed.

### Returning Varsity Tryouts
High-school hockey is Varsity-only. Returning-year tryouts determine lineup role, not whether the player makes JV/Varsity.

Role outcomes:
- Forward: Lines 1–4
- Defense: Pairs 1–3

Evaluation considers current attributes, drill performance, prior-season performance, coach trust, development/context and competition from the changed roster. Career-player placement remains contextual rather than pure OVR sorting.

## Phase 3.6 — Reusable Four-Year HS Loop
Status: IMPLEMENTED / AWAITING FULL FRESH-CAREER VALIDATION

The runtime is designed to progress Freshman → Sophomore → Junior → Senior without year-specific gameplay forks. The remaining proof is the real four-year playthrough, not more feature construction.

### Pre-playthrough hardening completed 2026-09-16
- Replaced Recovery with interactive Film Study in the no-fatigue design.
- Film Study is canonical across new and returning HS seasons.
- Dedicated Film Study choice flow routes before generic event completion.
- Film Study rewards only focused attribute XP; Recovery morale/injury effects no longer leak through.
- Removed the three permanent 250–500ms polling loops and replaced them with lifecycle/UI events.
- Audited MutationObservers and removed the clearly redundant full-document Travel identity observer.
- Broad wrapper/module consolidation was intentionally deferred until the playthrough exposes a real failure.

---

# Phase 4 — Full Fresh-Career HS Playthrough / QA
Status: NEXT / HARD GATE BEFORE NHL

Before pressing New Career, perform one final static integrity check of the resulting runtime stack. If that passes, stop feature building and begin the real playthrough.

Create a completely new career and personally play the entire HS career:
- Freshman season through Travel/offseason
- Sophomore season through Travel/offseason
- Junior season through Travel/offseason
- Senior season through final Travel

During this playthrough, repair bugs, pacing issues, balance issues, presentation problems and small desired changes one at a time against the real career.

Primary QA watch list:
- progression pace and attribute XP
- coach objective difficulty/frequency
- lineup movement and role security
- scouting exposure, reputation and ranking movement
- game/stat realism
- standings and award races
- postseason and Travel flow
- annual archive correctness
- roster turnover and graduation
- age/draft-class progression
- history/profile presentation
- mobile responsiveness/performance
- no stale events or duplicate identities across years

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
- Recovery is not a live gameplay event; Film Study fills that career-interaction slot.
- Career-player lineup role is contextual; AI/NPC lineup ordering is primarily ability-based.
- Practice, Training and Film Study are quick career events, not separate playable minigames.
- Play Game, Sim Game and background games share one canonical hockey simulation engine.
- Real prospects use persistent identities and coexist with generated depth.
- Real prospect draft classes remain factual.
- Awards and historical achievements are linked to stable player identities permanently.
- One immutable season archive owns completed-season historical truth.
- Archive before mutating the living world.
- Annual rollover is generic and reusable across all four HS years.
- New systems read/write canonical World Engine state and persist through IndexedDB.
- Prefer lifecycle events and explicit owners over permanent polling or broad DOM observation.
- Prefer root-cause architecture and small focused commits over stacked display/timing patches.
- Always reference the latest code and this roadmap before making architectural decisions.
- If roadmap order changes later, explain why before implementation.
