# Project Ice — Authoritative Roadmap

Updated: 2026-08-18
Authoritative planning checkpoint: 2026-08-17

This file replaces the stale August 14 roadmap as the planning source of truth.

IMPORTANT: Only roadmap items explicitly recovered from the August 17 planning checkpoint are locked below. Later phases are intentionally left open until the post-Phase-1 vision session rather than being silently reconstructed from older roadmaps.

## Current checkpoint

Phase 1 — Real Prospects + Scouting Completion
Status: COMPLETE / CHECKPOINT PASSED

Phase 2 — Home / Career Hub Refresh
Status: NEXT, but do not begin implementation until the user gives the post-Phase-1 vision.

Before Phase 2 implementation, perform the promised Phase 1 inventory and use the user’s new vision to define the exact Home/Career Hub scope.

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
Status: COMPLETE AS A REVIEW STEP / awaiting user vision

Purpose: stop before Home work, compare the real current codebase against what is actually complete, partial or still missing, and then let the user redefine priorities before Phase 2 begins.

Inventory conclusions to carry forward:

- Core persistence/world architecture is strong and should not be redesigned.
- Player/development architecture is substantially built and should be tuned/extended, not replaced.
- Team, lineup, special teams, League stats and standings are mature enough to consume future systems.
- Schedule/time flow and canonical game simulation are functional foundations, not future greenfield systems.
- The real-prospect database/world foundation is now built; the remaining scouting work is primarily deeper career-facing scouting consequences and presentation.
- Weekly living-world machinery exists in the backend but its player-facing storytelling layer remains incomplete.
- Home is now behind the richness of the underlying world and is the next major player-facing opportunity.
- Season lifecycle/history and post-HS/pro career remain major long-term structural work.
- Do not perform cleanup-only refactors of monolithic runtime files unless a feature or regression path requires it.

---

# Phase 2 — Home / Career Hub Refresh
Status: NEXT — SCOPE TO BE DEFINED BY USER VISION

The August 17 roadmap explicitly placed Home / Career Hub Refresh immediately after Phase 1.

Do not start coding this phase until the user gives the post-inventory vision.

Known principles already carried forward:

- Home should be the career dashboard, not a static menu.
- It should surface truthful information from canonical world state.
- It should prioritize what matters to the career player now.
- It should use the existing compact/premium mobile visual language.
- It should not become a GM dashboard.
- News/objectives/cards should ultimately react to real state changes rather than disconnected random flavor text.

Exact Phase 2 cards, layout, hierarchy, story surfaces and supporting systems will be locked after the user provides the new vision.

---

# Later phases
Status: NOT RE-LOCKED YET

The prior roadmaps contained later work such as living-world storytelling, deeper scouting consequences, season transition/history, post-high-school pathways, draft/NHL career and release calibration.

Those remain valid long-term areas, but their exact ordering is intentionally NOT declared authoritative in this file until the user finishes the post-Phase-1 vision session.

This prevents an older roadmap from silently overriding the August 17 plan again.

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
