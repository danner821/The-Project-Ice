# Potential 2.0 — canonical preseason seeding and prospective weekly dry-run

**Status:** offline, read-only; no live ratings updated and no numerical changes approved.

The policy explicitly **preserves every existing potential rating unless the player's exact original root and development values are reviewed**. In particular, Alacai's saved root 74 and displayed development 68 remain an unresolved identity-bound decision; the tools neither choose one automatically nor silently lower confidence in the live record.

A current Backup 3 revision-16 snapshot and the original revision-4 September 4 snapshot were each run through the same offline canonical-seed and prospective weekly-shadow dry run. Both generated **identical decisions**:

| Status | Roster players |
|---|---:|
| Canonical root/development value agrees; no current-season games yet | 94 |
| Incoming-class history predates player generation; quarantine | 53 |
| Real HS-rostered players; preserve without automatic rerating | 12 |
| Root/development conflict; hold for explicit reviewed seed | 1 |

The last category is the career player, with root 74 and nested 68. Current game date: September 4, 2025; **zero** automatic numerical proposals. Even a player with at least eight games remains withheld if no clean, same-level, similar-potential peer cohort meets the minimum. Neither chronological archives nor quarantined predecessor records may be used as substitute current-season games.

Reproducible offline scripts, **never imported by live gameplay**:
- `tools/potential-v2-preseason-policy.js PRIVATE_BACKUP.json` validates backup identity and excludes duplicated player IDs, contaminated generated freshmen, real players and unresolved potential records.
- `tools/potential-v2-preseason-shadow-run.js PRIVATE_BACKUP.json` uses only eligible current-year synthetic peers and executes the prospective `potential-v2-weekly-shadow.js` evaluator in memory. The CLI rehashes its input and rejects unexpected numerical proposals, count mismatches or file changes.
- The associated `*.test.js` suites cover immutable inputs, two potential fields, plausible-looking inherited histories, legitimate fresh incoming histories, lack of fresh game evidence and missing peer support.

**Verification:** both original and current private backups passed independently with identical 94/53/12/1 decisions; synthetics passed; SHA-256 of both backups matched their previous fingerprints. Do not store user backup JSON or per-player private plans in GitHub.

**Next engineering gates:** (1) establish a supported, explicitly reviewed canonical-seed decision for the career player without treating the higher field or the displayed field as automatically authoritative; (2) validate prospective evidence over several completed synthetic weeks (games, injuries/recovery, team and age cohort turnover), with quarantined players never borrowing inherited history; (3) rehearse exact user-approved plan on the disposable fresh-backup clone with full-world allowlist and a fresh current-device export/revision gate; (4) only then request explicit approval before any live migration. Until then, the old Player tab display is legacy behavior and not an approved Potential 2.0 outcome.


## Thirty-six-week synthetic longevity and actual-roster cohort sensitivity

- Added a **permanent offline, source-level 36-week regression** (`tools/potential-v2-multiweek-cohort.test.js`, commit `dc6754b`). A high-performing synthetic skater earned one hypothetical 79→84 move, an average skater held 79, and an underperformer earned one hypothetical 79→78 move. The controlled test paused games for five weeks (injury/no-games gate), reduced the valid peer pool from 18 to three for six weeks (insufficient-cohort gate), then recovered. The previously contaminated freshman, curated real player, unresolved-potential player and an unplayed goalie remained withheld for **all 36 weeks**. Repeat evaluations were deterministic and inputs were immutable. These are **synthetic behavior demonstrations, not real-player rating recommendations or calibrated real-world progression predictions**.
- Ran a **private read-only demographic/potential-cohort sensitivity** against Backup 3's 94 valid generated roster players: 62 forwards, 24 defensemen and just eight goalies. The script temporarily substituted fictional 20-game stats in memory and performed 12 deterministic availability patterns at each dropout level, 1,128 benchmark checks per level. At 0% and 10% short-sample availability, all 1,128 peer benchmarks were supported. At 20%: **1,054 supported / 74 withheld**, including **60/96 goalie peer benchmarks withheld**. At 30%: 1,050 / 78, including 64/96 goalie withheld. At 40%: 1,040 / 88, including 72/96 goalie withheld. These are **peer-benchmark coverage** counts, not potential decisions; any individual with inadequate games is also separately withheld.
- Eight current eligible goalies make the goalie cohort a **sample-scarcity risk**. Do not relax the current five-goalie comparison threshold, admit contaminated prior histories, compare goalies with skaters, or fabricate missing stats to force an evaluation. Added permanent sparse-goalie regression to `tools/potential-v2-weekly-shadow.test.js` (commit `e8d57a2`) after confirming the threshold behavior. The original local regression initially assumed four of nine peers missing would withhold; it correctly still had five valid peers. The final test uses five of nine missing (four valid) and **PASS**. Existing longitudinal, weekly and 36-week suites all passed locally after correction.
- Re-ran the real private Backup 3 read-only preseason CLI and independently verified both original and current backup SHA-256 fingerprints unchanged; it still yields **94 awaiting current games, 53 quarantine, 12 real-player hold, 1 unresolved career conflict, zero approved numeric proposals**. No live save or potential migration ran.
- Remaining: integrate this read-only shadow evaluation into a **disposable synthetic WorldEngine game/week schedule rehearsal**, validate ratings and statistics under actual event flow, then prepare an explicit user-reviewable canonical 74 vs 68 resolution. Existing potential conflicts and quarantined inherited histories remain blocked throughout.
