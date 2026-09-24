# Project Ice — Dynamic Potential 2.0

Status: **design locked; implementation and migration gated by restore validation**.
Baseline: career backup exported at game date 2025-09-04 (Junior 2025–26 preseason). **Never commit the backup to GitHub.**

## Core model (48 agreed decisions across three questionnaire rounds)

- One **dynamic actual potential rating**. No separately predetermined, immutable hidden ability ceiling. Visible role is derived consistently from the numerical rating; actual OVR can exceed the current projection.
- **Scouting certainty** measures confidence in the *current projection*, not how good the player is. Sustained unexplained outperformance or underperformance lowers certainty before a potential change. A formal potential change resets certainty to **Medium**, regardless of direction. Subsequent consistent evidence and scout exposure can rebuild it toward High.
- Five visible trends: Rapidly Falling, Falling, Stable, Rising, Rapidly Rising. Strength and persistence of evidence determine the trend. Rapid trends indicate unusually strong sustained evidence and a more imminent possible reevaluation, **never a guaranteed change**.
- Evidence: production and impact adjusted for age, position (including a separate goalie model), competition strength, usage, ice time, underlying available game statistics and comparable players, plus demonstrated attribute growth and form. Never invent missing historical data.
- Performance **primarily determines potential movement**. Low certainty allows a reevaluation but does not cause an automatic upgrade/downgrade. Exceptional performances can justify reevaluation despite low scouting exposure; ordinary cases require sustained evidence. Avoid rewarding one anomalous game.
- Most flexibility before 23; increasingly stable near ages 27–28; rare increases after 27. A truly dominant 20-year-old could reach Franchise; an equally dominant 30-year-old can remain Elite while exceeding the projected OVR. Potential declines only after prolonged context-adjusted underperformance, accounting for age and opportunity.
- Higher potential generally accelerates youth development. Growth becomes progressively more expensive as attributes/OVR approach their projected level, following tier- and personality-dependent curves. **Sustained breakout evidence gradually relaxes the potential-related XP penalty ahead of official promotion**; promotion makes the new prices effective immediately. Existing earned XP, spent XP, attribute balances and upgrades remain unchanged.
- Keep the hard **85 OVR high-school cap**. Physical decline precedes other regression as players age; potential label stays established in the thirties. No injury simulation or fatigue.
- Hidden development DNA/personality affects XP generation, distribution, performance sensitivity, early/late growth, usage response and long-term development. Personality has **no direct potential-reevaluation bonus**; it may affect results only indirectly via actual development/performance. Never reveal personality labels on player-facing profiles.
- Generation targets, complete draft class: roughly **5–12 Elite per year**, with meaningful variation in class strength, and **2–3 Franchise per decade** as a soft long-run target. Exceptional organic breakouts may exceed these targets. These are game calibration targets, not claims about EA's proprietary formulas.

## Canonical sources and compatibility

- Numerical potential and its role, confidence, accuracy, signal and trend must have **one authoritative owner** in the canonical player's development record, with synchronized legacy player-facing fields. Do not allow the Home, Player and Scouting tabs to use inconsistent precedence.
- Weekly canonical evaluator is the only in-season source of potential changes. Existing legacy annual potential mutation is unreachable and must not be revived. Seasonal historical analysis may produce **proposals**, not duplicate live mutations.
- All current high-school and development statistics, attributes, XP, history, awards, and completed/active season status must survive unchanged unless a specific potential migration is reviewed and authorized.
- Scope of **retrospective audit**: generated high-school players (including the career player). Real-world prospects outside HS, and factual real-world players currently inserted into HS rosters, must not be rerated retroactively; if their future in-season rules change, review separately.
- The existing external-prospect source must remain untouched by the migration. Where the saved world stores the career player in more than one place, update all mirrors **atomically** after an audited migration.

## Verified backup baseline and audit caveats

- Export format: projectice-career-backup v1; active record id must equal career:<activeCareerId> and careerId must equal activeCareerId.
- Backup date: 2025-09-04, current season hs-2025-2026, phase preseason; eight teams and 160 roster slots, comprising 148 generated HS players (including career player) and 12 real HS roster prospects; 191 external prospects.
- Generated players with two archived HS histories: 148/148; with at least 10 games in both archived seasons: 141/148.
- **Known canonical mismatch:** career player's top-level potential **74 / Medium / Rising**, but nested development potential **68 / High / Stable**. Do not silently pick a field and rewrite the save. Preserve both in the original backup. A read-only evidence audit found the career player's season production increased from 7 to 23 points over two 28-game seasons, with OVR 70→72. A candidate rating must be calibrated against position, deployment, competition and historical context before acceptance.
- Static backup envelope validation and Node structured-serialization round-trip passed. Browser IndexedDB restore and iPhone restore have **not** passed; the unavailable browser test is not a pass.

## Implementation gates

1. **Backup & isolated restore:** retain original JSON on user phone. Verify full envelope and that a disposable IndexedDB database can store and round-trip a 56 MB snapshot without affecting active storage. Test on iPhone before declaring restoration verified. Do not offer destructive restore without explicit confirmation and a newer-live-save warning.
2. **Read-only historical scorer:** compute position-, age- and competition-normalized evidence from available archived records. Output per-player proposed rating, role, confidence and trend, plus evidence strength, gaps and reasons for no change. No IndexedDB writes. Include career player and all eligible generated HS NPCs; exclude real-player records.
3. **Review and calibration:** simulate elite teenage breakout, moderate growth, aging NHL Elite production, two years underperformance, goalie exceptional season, overlooked late bloomer, cap-85 HS case, limited exposure and zero-stat case. Review draft-class statistical distribution separately. Review historical proposed changes before write enablement.
4. **One evaluator / XP integration:** implement canonical weekly potential engine and reconnect XP upgrade-cost function to canonical potential and earned breakout evidence. Test both manual career-player upgrades and NPC automatic upgrades. Ensure one weekly pass is idempotent and deterministic per season, player and date.
5. **Display compatibility:** Home, Player, scouting report and recap consume canonical projections; hidden personality remains hidden. Existing saved histories remain visible.
6. **Controlled migration:** on explicit approval, take an additional current backup, compare against original baseline/date, stage all proposed writes in a copy, verify no changes to XP/OVR/stats/season timeline or external prospects, then commit atomically once. Mark migration version and ensure a second load does not reapply.
7. **iPhone acceptance:** reload twice and check current date, player ratings, certainty/trend, upgrade prices, scouting ranks, past season stats, Rival Watch, timeline and event simulation before resuming play.

**Stop condition:** if backup restoration or any invariant fails, do not modify the live save. Continue new-engine work in isolated fixtures until repaired.
